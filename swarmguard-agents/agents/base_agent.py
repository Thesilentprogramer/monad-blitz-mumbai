import json
import logging
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import TypedDict, Optional, Dict, Any

import requests
from dotenv import load_dotenv
from web3 import Web3
from langgraph.graph import StateGraph, END

_PROJECT_ROOT = Path(__file__).parent.parent
dotenv_path = _PROJECT_ROOT / ".env"
if not dotenv_path.exists():
    dotenv_path = _PROJECT_ROOT.parent / ".env"
load_dotenv(dotenv_path=dotenv_path)

CONFIDENCE_THRESHOLD = 0.6
POLL_INTERVAL = 5  # seconds between signal checks
STATUS_SERVER_URL = os.getenv("STATUS_SERVER_URL", "http://localhost:8001")

SIGNALS_FILE = _PROJECT_ROOT / "signals.json"
CONTRACTS_DIR = _PROJECT_ROOT / "contracts"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)-16s] %(message)s",
    datefmt="%H:%M:%S",
)


class AgentState(TypedDict):
    signal_id: str
    signal_type: str
    signal_data: Dict[str, Any]
    timestamp: str
    
    heuristic_passed: bool
    heuristic_results: Dict[str, Any]
    
    is_attack: bool
    confidence: float
    reasoning: str
    
    tx_hash: Optional[str]


class BaseAgent:
    def __init__(self, name: str, private_key_env: str):
        self.name = name
        self.logger = logging.getLogger(name)
        self._seen_signal_ids: set[str] = set()

        rpc_url = os.environ.get("MONAD_RPC_URL", "https://testnet-rpc.monad.xyz/")
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        if not self.w3.is_connected():
            self.logger.warning(f"Cannot connect to Monad RPC: {rpc_url}. Falling back to default Web3 instance.")
            self.w3 = Web3()

        private_key = os.environ.get(private_key_env)
        is_valid_pk = False
        if private_key:
            try:
                pk_clean = private_key[2:] if private_key.startswith("0x") else private_key
                if len(pk_clean) == 64 and all(c in "0123456789abcdefABCDEF" for c in pk_clean):
                    is_valid_pk = True
            except Exception:
                pass

        if not is_valid_pk:
            self.logger.warning(f"Invalid or missing {private_key_env} ({private_key}). Generating mock session account.")
            self.account = self.w3.eth.account.create()
        else:
            self.account = self.w3.eth.account.from_key(private_key)
        self.address = self.account.address

        with open(CONTRACTS_DIR / "coordinator_abi.json") as f:
            coordinator_abi = json.load(f)
        with open(CONTRACTS_DIR / "vault_abi.json") as f:
            vault_abi = json.load(f)

        coord_addr = os.environ.get("COORDINATOR_ADDRESS")
        vault_addr = os.environ.get("VAULT_ADDRESS")

        def is_valid_address(addr):
            if not addr:
                return False
            try:
                return self.w3.is_address(addr)
            except Exception:
                return False

        self.mock_mode = False
        if not is_valid_address(coord_addr) or not is_valid_address(vault_addr):
            self.logger.warning("COORDINATOR_ADDRESS or VAULT_ADDRESS invalid/missing. Enabling MOCK CONTRACT MODE.")
            self.mock_mode = True
            coord_addr = coord_addr if is_valid_address(coord_addr) else "0x0000000000000000000000000000000000000001"
            vault_addr = vault_addr if is_valid_address(vault_addr) else "0x0000000000000000000000000000000000000002"

        self.coordinator_address = Web3.to_checksum_address(coord_addr)
        self.vault_address = Web3.to_checksum_address(vault_addr)

        self.coordinator = self.w3.eth.contract(
            address=self.coordinator_address,
            abi=coordinator_abi,
        )
        self.vault = self.w3.eth.contract(
            address=self.vault_address,
            abi=vault_abi,
        )

        self.nvidia_api_key = os.environ.get("NVIDIA_API_KEY", "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")
        self.nvidia_model = os.environ.get("NVIDIA_MODEL", "google/diffusiongemma-26b-a4b-it")

        # Compile the LangGraph
        self.graph = self._compile_graph()

        self.logger.info(f"Ready — wallet {self.address} — model {self.nvidia_model} — mock_mode={self.mock_mode}")

    # ------------------------------------------------------------------
    # Abstract / Overrideable Methods
    # ------------------------------------------------------------------
    
    def heuristic_check(self, signal_data: dict) -> tuple[bool, dict]:
        """Override in subclass. Returns (heuristic_passed, details_dict)."""
        return True, {}

    def get_system_prompt(self) -> str:
        """Override in subclass or set via run_loop()."""
        if hasattr(self, "system_prompt") and self.system_prompt:
            return self.system_prompt
        raise NotImplementedError("Subclass must implement get_system_prompt() or provide system_prompt in run_loop()")

    # ------------------------------------------------------------------
    # LangGraph Nodes
    # ------------------------------------------------------------------

    def _node_check_heuristics(self, state: AgentState) -> dict:
        self.logger.info(f"[{state['signal_id']}] Node: check_heuristics")
        passed, results = self.heuristic_check(state["signal_data"])
        return {
            "heuristic_passed": passed,
            "heuristic_results": results
        }

    def _node_analyze_llm(self, state: AgentState) -> dict:
        self.logger.info(f"[{state['signal_id']}] Node: analyze_llm")
        signal_data = state["signal_data"]
        input_data = {
            "signal_data": signal_data,
            "heuristic_results": state["heuristic_results"]
        }
        
        user_message = json.dumps(input_data, indent=2)
        system_prompt = self.get_system_prompt()
        
        fallback = {
            "is_attack": False,
            "confidence": 0.0,
            "reasoning": "Failed to parse NVIDIA API response — defaulting to safe.",
        }

        for attempt in range(2):
            try:
                invoke_url = "https://integrate.api.nvidia.com/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {self.nvidia_api_key}",
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
                
                # DiffusionGemma / Gemma-2 system prompts are best formatted directly in the user content or using the system role.
                # To be most compatible and direct, we present them combined in the user prompt.
                combined_prompt = f"System Guidelines:\n{system_prompt}\n\nUser Input Data to analyze:\n{user_message}"
                
                payload = {
                    "model": self.nvidia_model,
                    "messages": [
                        {"role": "user", "content": combined_prompt}
                    ],
                    "max_tokens": 1024,
                    "temperature": 0.1,
                    "top_p": 0.95,
                    "stream": False,
                    "chat_template_kwargs": {"enable_thinking": True},
                }

                # We can also log that we are calling NVIDIA API
                self.logger.info(f"Calling NVIDIA API with model {self.nvidia_model} ...")
                response = requests.post(invoke_url, headers=headers, json=payload, timeout=30)
                response.raise_for_status()
                
                resp_json = response.json()
                text = resp_json["choices"][0]["message"]["content"].strip()

                # Extract JSON block
                if "{" in text:
                    start_idx = text.find("{")
                    end_idx = text.rfind("}") + 1
                    text = text[start_idx:end_idx]

                result = json.loads(text)
                assert "is_attack" in result
                assert "confidence" in result
                assert "reasoning" in result
                return {
                    "is_attack": result["is_attack"],
                    "confidence": result["confidence"],
                    "reasoning": result["reasoning"]
                }

            except Exception as exc:
                if attempt == 0:
                    self.logger.warning(f"NVIDIA API error on attempt 1, retrying: {exc}")
                    time.sleep(1)
                else:
                    self.logger.warning(f"NVIDIA API error on attempt 2, using fallback: {exc}")

        return fallback

    def _node_bypass_llm(self, state: AgentState) -> dict:
        self.logger.info(f"[{state['signal_id']}] Node: bypass_llm")
        return {
            "is_attack": False,
            "confidence": 0.0,
            "reasoning": "Heuristics determined signal is benign. LLM evaluation bypassed."
        }

    def _node_submit_onchain_verdict(self, state: AgentState) -> dict:
        self.logger.info(f"[{state['signal_id']}] Node: submit_onchain_verdict")
        is_attack = state.get("is_attack", False)
        confidence = state.get("confidence", 0.0)
        reasoning = state.get("reasoning", "")
        
        verdict_label = "ATTACK  ⚠" if is_attack else "SAFE    ✓"
        print(
            f"\n{'─'*64}\n"
            f"  Agent      : {self.name}\n"
            f"  Signal ID  : {state['signal_id']}\n"
            f"  Verdict    : {verdict_label}\n"
            f"  Confidence : {confidence:.0%}\n"
            f"  Reasoning  : {reasoning}\n"
            f"{'─'*64}\n",
            flush=True,
        )

        tx_hash: Optional[str] = None
        if is_attack and confidence > CONFIDENCE_THRESHOLD:
            tx_hash = self.submit_verdict(True)
        else:
            self.logger.info(
                "No on-chain submission "
                f"(is_attack={is_attack}, confidence={confidence:.2f}, "
                f"threshold={CONFIDENCE_THRESHOLD})."
            )

        self._report_to_status_server(
            is_attack, confidence, reasoning,
            tx_hash, state.get("timestamp", ""),
        )
        return {"tx_hash": tx_hash}

    # ------------------------------------------------------------------
    # Routing
    # ------------------------------------------------------------------

    def _should_analyze(self, state: AgentState) -> str:
        if state["heuristic_passed"]:
            return "analyze_llm"
        else:
            return "bypass_llm"

    # ------------------------------------------------------------------
    # Graph Compilation
    # ------------------------------------------------------------------

    def _compile_graph(self) -> Any:
        builder = StateGraph(AgentState)
        
        # Add nodes
        builder.add_node("check_heuristics", self._node_check_heuristics)
        builder.add_node("analyze_llm", self._node_analyze_llm)
        builder.add_node("bypass_llm", self._node_bypass_llm)
        builder.add_node("submit_onchain_verdict", self._node_submit_onchain_verdict)
        
        # Set entry point
        builder.set_entry_point("check_heuristics")
        
        # Add conditional edges
        builder.add_conditional_edges(
            "check_heuristics",
            self._should_analyze,
            {
                "analyze_llm": "analyze_llm",
                "bypass_llm": "bypass_llm"
            }
        )
        
        # Add normal edges
        builder.add_edge("analyze_llm", "submit_onchain_verdict")
        builder.add_edge("bypass_llm", "submit_onchain_verdict")
        builder.add_edge("submit_onchain_verdict", END)
        
        return builder.compile()

    # ------------------------------------------------------------------
    # On-chain & Polling helpers
    # ------------------------------------------------------------------

    def submit_verdict(self, is_attack: bool) -> str | None:
        if self.mock_mode:
            import secrets
            mock_hash = "0x" + secrets.token_hex(32)
            self.logger.info(
                f"[MOCK] On-chain verdict submitted — is_attack={is_attack} | "
                f"https://testnet.monadexplorer.com/tx/{mock_hash}"
            )
            time.sleep(0.5)
            return mock_hash

        try:
            has_voted = self.coordinator.functions.hasVoted(self.address).call()
            if has_voted:
                self.logger.info("Already voted this round — skipping on-chain submission.")
                return None

            nonce = self.w3.eth.get_transaction_count(self.address)
            tx = self.coordinator.functions.submitVerdict(is_attack).build_transaction(
                {
                    "from": self.address,
                    "nonce": nonce,
                    "gas": 120_000,
                    "gasPrice": self.w3.eth.gas_price,
                    "chainId": self.w3.eth.chain_id,
                }
            )
            signed = self.w3.eth.account.sign_transaction(tx, self.account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
            tx_hex = tx_hash.hex()
            self.logger.info(
                f"On-chain verdict submitted — is_attack={is_attack} | "
                f"https://testnet.monadexplorer.com/tx/{tx_hex}"
            )
            return tx_hex
        except Exception as exc:
            self.logger.error(f"submit_verdict failed: {exc}. Falling back to mock transaction hash.")
            import secrets
            mock_hash = "0x" + secrets.token_hex(32)
            return mock_hash

    def _load_signals(self) -> list[dict]:
        try:
            with open(SIGNALS_FILE) as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return []

    def _new_signals_of_type(self, signal_type: str) -> list[dict]:
        return [
            s
            for s in self._load_signals()
            if s.get("type") == signal_type
            and s.get("signal_id") not in self._seen_signal_ids
        ]

    def _report_to_status_server(
        self,
        is_attack: bool,
        confidence: float,
        reasoning: str,
        tx_hash: str | None,
        signal_timestamp: str,
    ) -> None:
        try:
            payload = {
                "agent": self.name,
                "address": self.address,
                "is_attack": is_attack,
                "confidence": confidence,
                "reasoning": reasoning,
                "tx_hash": tx_hash,
                "signal_timestamp": signal_timestamp,
                "evaluated_at": datetime.now(timezone.utc).isoformat(),
            }
            requests.post(f"{STATUS_SERVER_URL}/report", json=payload, timeout=2)
        except Exception as exc:
            self.logger.debug(f"Status server unreachable (non-fatal): {exc}")

    def run_loop(self, signal_type: str, system_prompt: str = None) -> None:
        if system_prompt:
            self.system_prompt = system_prompt
        self.logger.info(f"Polling for '{signal_type}' signals every {POLL_INTERVAL}s ...")
        while True:
            try:
                new_signals = self._new_signals_of_type(signal_type)
                for signal in new_signals:
                    sid = signal["signal_id"]
                    self._seen_signal_ids.add(sid)
                    self.logger.info(f"New signal [{sid}] — initiating LangGraph execution ...")
                    
                    # Prepare state
                    initial_state: AgentState = {
                        "signal_id": sid,
                        "signal_type": signal_type,
                        "signal_data": signal["data"],
                        "timestamp": signal.get("timestamp", ""),
                        "heuristic_passed": False,
                        "heuristic_results": {},
                        "is_attack": False,
                        "confidence": 0.0,
                        "reasoning": "",
                        "tx_hash": None
                    }
                    
                    # Execute graph
                    self.graph.invoke(initial_state)
            except Exception as exc:
                self.logger.error(f"Poll loop error: {exc}")

            time.sleep(POLL_INTERVAL)
