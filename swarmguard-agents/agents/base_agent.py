import json
import logging
import os
import time
from datetime import datetime, timezone
from pathlib import Path

import requests
from anthropic import Anthropic
from dotenv import load_dotenv
from web3 import Web3

load_dotenv()

CONFIDENCE_THRESHOLD = 0.6
POLL_INTERVAL = 5  # seconds between signal checks
STATUS_SERVER_URL = os.getenv("STATUS_SERVER_URL", "http://localhost:8001")

_PROJECT_ROOT = Path(__file__).parent.parent
SIGNALS_FILE = _PROJECT_ROOT / "signals.json"
CONTRACTS_DIR = _PROJECT_ROOT / "contracts"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)-16s] %(message)s",
    datefmt="%H:%M:%S",
)


class BaseAgent:
    def __init__(self, name: str, private_key_env: str):
        self.name = name
        self.logger = logging.getLogger(name)
        self._seen_signal_ids: set[str] = set()

        rpc_url = os.environ["MONAD_RPC_URL"]
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        if not self.w3.is_connected():
            raise RuntimeError(f"Cannot connect to Monad RPC: {rpc_url}")

        private_key = os.environ[private_key_env]
        self.account = self.w3.eth.account.from_key(private_key)
        self.address = self.account.address

        with open(CONTRACTS_DIR / "coordinator_abi.json") as f:
            coordinator_abi = json.load(f)
        with open(CONTRACTS_DIR / "vault_abi.json") as f:
            vault_abi = json.load(f)

        self.coordinator = self.w3.eth.contract(
            address=Web3.to_checksum_address(os.environ["COORDINATOR_ADDRESS"]),
            abi=coordinator_abi,
        )
        self.vault = self.w3.eth.contract(
            address=Web3.to_checksum_address(os.environ["VAULT_ADDRESS"]),
            abi=vault_abi,
        )

        self.anthropic = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
        self._model = os.getenv("CLAUDE_MODEL", "claude-haiku-4-5-20251001")

        self.logger.info(f"Ready — wallet {self.address} — model {self._model}")

    # ------------------------------------------------------------------
    # Claude evaluation
    # ------------------------------------------------------------------

    def evaluate_with_claude(self, system_prompt: str, signal_data: dict) -> dict:
        """Call Claude with the given system prompt and signal data, return parsed verdict dict."""
        user_message = json.dumps(signal_data, indent=2)
        fallback = {
            "is_attack": False,
            "confidence": 0.0,
            "reasoning": "Failed to parse Claude response — defaulting to safe.",
        }

        for attempt in range(2):
            try:
                response = self.anthropic.messages.create(
                    model=self._model,
                    max_tokens=256,
                    system=system_prompt,
                    messages=[{"role": "user", "content": user_message}],
                )
                text = response.content[0].text.strip()

                # Strip markdown code fences if present
                if text.startswith("```"):
                    parts = text.split("```")
                    text = parts[1]
                    if text.startswith("json"):
                        text = text[4:]
                    text = text.strip()

                result = json.loads(text)
                assert "is_attack" in result
                assert "confidence" in result
                assert "reasoning" in result
                return result

            except Exception as exc:
                if attempt == 0:
                    self.logger.warning(f"Parse error on attempt 1, retrying: {exc}")
                    time.sleep(1)
                else:
                    self.logger.warning(f"Parse error on attempt 2, using fallback: {exc}")

        return fallback

    # ------------------------------------------------------------------
    # On-chain verdict submission
    # ------------------------------------------------------------------

    def submit_verdict(self, is_attack: bool) -> str | None:
        """Sign and send submitVerdict(is_attack) to the Coordinator contract."""
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
            self.logger.error(f"submit_verdict failed: {exc}")
            return None

    # ------------------------------------------------------------------
    # Signal polling
    # ------------------------------------------------------------------

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

    # ------------------------------------------------------------------
    # Status server reporting
    # ------------------------------------------------------------------

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

    # ------------------------------------------------------------------
    # Main agent loop (called by each subagent's run())
    # ------------------------------------------------------------------

    def run_loop(self, signal_type: str, system_prompt: str) -> None:
        self.logger.info(f"Polling for '{signal_type}' signals every {POLL_INTERVAL}s ...")
        while True:
            try:
                new_signals = self._new_signals_of_type(signal_type)
                for signal in new_signals:
                    sid = signal["signal_id"]
                    self._seen_signal_ids.add(sid)
                    self.logger.info(f"New signal [{sid}] — evaluating with Claude ...")

                    result = self.evaluate_with_claude(system_prompt, signal["data"])

                    is_attack: bool = result.get("is_attack", False)
                    confidence: float = result.get("confidence", 0.0)
                    reasoning: str = result.get("reasoning", "")
                    verdict_label = "ATTACK  ⚠" if is_attack else "SAFE    ✓"

                    print(
                        f"\n{'─'*64}\n"
                        f"  Agent      : {self.name}\n"
                        f"  Signal ID  : {sid}\n"
                        f"  Verdict    : {verdict_label}\n"
                        f"  Confidence : {confidence:.0%}\n"
                        f"  Reasoning  : {reasoning}\n"
                        f"{'─'*64}\n",
                        flush=True,
                    )

                    tx_hash: str | None = None
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
                        tx_hash, signal.get("timestamp", ""),
                    )
            except Exception as exc:
                self.logger.error(f"Poll loop error: {exc}")

            time.sleep(POLL_INTERVAL)
