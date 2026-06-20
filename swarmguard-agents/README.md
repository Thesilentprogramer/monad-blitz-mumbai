# SwarmGuard — AI Agent Swarm

Four independent AI agents (powered by real Claude API calls) monitor for DeFi attacks and vote on-chain via the Coordinator contract on Monad testnet.

> **Disclaimer:** This system uses testnet infrastructure and simulated signals only. It is not connected to real DeFi protocols or real funds.

---

## Architecture

```
simulate_attack.py  →  signals.json  →  4 agents  →  Coordinator contract (Monad testnet)
                                                              ↕
                                              swarmguard_dashboard.html
```

Each agent:
1. Polls `signals.json` every 5 seconds for new signals matching its type
2. Calls the Claude API with its dedicated system prompt and the signal data
3. Logs the verdict (timestamp, agent name, is_attack, confidence, reasoning)
4. If `is_attack == true` AND `confidence > 0.6`, submits `submitVerdict(true)` on-chain

---

## Prerequisites

- Python 3.11+
- Four funded Monad testnet wallets (one per agent — addresses must match Coordinator constructor args)
- Anthropic API key
- Coordinator + Vault contracts deployed (via Remix, separately)

---

## Setup

### 1. Install dependencies

```bash
cd swarmguard-agents
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in all values:

```
MONAD_RPC_URL=https://testnet-rpc.monad.xyz/
COORDINATOR_ADDRESS=0x<deployed coordinator>
VAULT_ADDRESS=0x<deployed vault>
ANTHROPIC_API_KEY=sk-ant-...

FLASHLOAN_AGENT_PRIVATE_KEY=0x<key for agent index 0>
ORACLE_AGENT_PRIVATE_KEY=0x<key for agent index 1>
VELOCITY_AGENT_PRIVATE_KEY=0x<key for agent index 2>
WALLET_AGENT_PRIVATE_KEY=0x<key for agent index 3>
```

**Critical:** the wallet address derived from each private key must be the address passed into `Coordinator`'s constructor at the corresponding index `[0, 1, 2, 3]`. Mismatches cause every `submitVerdict` call to revert with "not an authorized agent."

---

## Running

### Terminal 1 — Start all agents

```bash
python run_agents.py
```

All 4 agents start in parallel threads. Each prints live verdicts to the console as signals arrive.

### Terminal 2 — Run the signal simulator

```bash
# Demo mode: 60s of benign signals, then trigger attack
python simulate_attack.py --mode demo --attack-delay 60

# Just fire attack signals immediately
python simulate_attack.py --mode attack

# Benign signals only (agents stay active without triggering alarm)
python simulate_attack.py --mode normal
```

### Dashboard

Open `swarmguard_dashboard.html` in a browser. Enter the contract addresses and agent wallet addresses. It polls live state from Monad testnet every 5 seconds, showing:
- Vault paused status
- Flag count vs threshold
- Which agents have voted
- Attack triggered indicator

---

## Running a single agent (for isolated testing)

```bash
# Test FlashloanDetector on its own, then drop a signal manually:
python -m agents.flashloan_agent

# In another terminal, write a test flashloan attack signal:
python -c "
import json, uuid
from datetime import datetime, timezone
from pathlib import Path

sig = {
    'signal_id': str(uuid.uuid4()),
    'type': 'flashloan',
    'timestamp': datetime.now(timezone.utc).isoformat(),
    'data': {
        'loan_amount': 12500000,
        'repaid_within_same_tx': True,
        'borrower_address': '0xDeadBeefDeadBeefDeadBeefDeadBeefDeadBeef'
    }
}
p = Path('signals.json')
signals = json.loads(p.read_text()) if p.exists() else []
signals.append(sig)
p.write_text(json.dumps(signals, indent=2))
print('Signal written:', sig['signal_id'])
"
```

---

## Project structure

```
swarmguard-agents/
  .env.example          # template — copy to .env and fill in real values
  .gitignore            # excludes .env
  requirements.txt
  signals.json          # shared signal store (read by agents, written by simulator)
  contracts/
    coordinator_abi.json
    vault_abi.json
  agents/
    base_agent.py       # shared Web3 + Claude + on-chain logic
    flashloan_agent.py
    oracle_agent.py
    velocity_agent.py
    wallet_agent.py
  run_agents.py         # launches all 4 agents in parallel
  simulate_attack.py    # writes attack/benign signals to signals.json
```

---

## Tuning

| Constant | File | Default | Effect |
|---|---|---|---|
| `CONFIDENCE_THRESHOLD` | `base_agent.py` | `0.6` | Minimum confidence for on-chain submission |
| `POLL_INTERVAL` | `base_agent.py` | `5` (seconds) | How often each agent checks signals.json |
| `CLAUDE_MODEL` | `.env` | `claude-haiku-4-5-20251001` | Model used for evaluation |

---

## Network

- **Chain:** Monad Testnet
- **Chain ID:** 10143
- **RPC:** https://testnet-rpc.monad.xyz/
- **Explorer:** https://testnet.monadexplorer.com/
