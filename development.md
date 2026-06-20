
# Create the development.md file for SwarmGuard

swarmguard_dev_md = """# SwarmGuard — Development Plan

> **Status (June 20, 2026):** Architecture finalized. Monad testnet configured. Ready for 5-hour hackathon build.
> **Hackathon:** Monad Blitz — The Agent Economy
> **Theme:** Agentic systems on blockchain with real-world transactions

---

## What This System Really Does

SwarmGuard is a **decentralized AI security swarm** that monitors DeFi protocols on Monad. Multiple specialized AI agents independently watch different attack vectors (flashloans, oracle manipulation, liquidity drains), submit signed verdicts on-chain, and trigger auto-protective actions when consensus is reached — no human needed for the first response.

**The core design rule:** Agents are independent, reputation-weighted, and their verdicts are immutable on-chain. The swarm decides, not a single entity.

---

## Why This Is Different

| Common Approach | Risk | What SwarmGuard Does Instead |
|---|---|---|
| Centralized security team | Single point of failure, slow response | Decentralized swarm — no single agent can trigger action alone |
| Off-chain monitoring | Verdicts aren't auditable or trustless | Every verdict written on-chain, verifiable by anyone |
| One-size-fits-all detection | Misses novel attack patterns | Specialized agents per attack vector, each with domain-specific logic |
| Human-in-the-loop for first response | Minutes to hours of delay | Sub-second consensus → auto-action in <10 seconds |
| Generic chain deployment | Gas costs make swarm monitoring economically impossible | Monad's 10,000 TPS + ~$0 gas makes real-time swarm consensus viable |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)                  │
│  Live Dashboard | Agent Status | Simulate Attack | Explorer │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  AGENT SWARM (Python 3.11)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │ Flashloan   │  │ Oracle      │  │ Liquidity           │   │
│  │ Detector    │  │ Watcher     │  │ Monitor             │   │
│  │ (mempool)   │  │ (price)     │  │ (TVL)               │   │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘   │
│         │                │                      │             │
│         └────────────────┼──────────────────────┘             │
│                          ▼                                   │
│              submitVerdict(protocolId, threatLevel, evidence)  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              MONAD BLOCKCHAIN (Solidity)                     │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ AgentRegistry   │  │ SwarmCoordinator              │   │
│  │ (ERC-8004 IDs)  │  │ • VerdictRegistry             │   │
│  │ • Reputation    │  │ • Consensus Engine            │   │
│  │ • Staking       │  │ • ActionExecutor              │   │
│  └─────────────────┘  └──────────────┘  └──────────────┘   │
│                          │                                   │
│                          ▼                                   │
│              PAUSE | FREEZE | ALERT | CIRCUIT BREAKER        │
└─────────────────────────────────────────────────────────────┘
```

---

## Model / AI Strategy

**Provider:** OpenAI API (configurable via env vars)

| Stage | Model | Why |
|---|---|---|
| Pattern detection (agent logic) | `gpt-4o-mini` | Cheap, fast, handles structured extraction from raw data |
| Escalation (ambiguous cases) | `gpt-4o` | Stronger reasoning for edge cases — triggered only when confidence < threshold |
| Justification generation | `gpt-4o-mini` | Templated prose from already-decided facts |

**Tiered calling:**
- First pass: cheap model handles obvious cases (clear flashloan pattern, large price deviation)
- Escalation: stronger model only for low-confidence/ambiguous detections
- This keeps costs low while maintaining accuracy on edge cases

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Blockchain | Solidity + Hardhat | Smart contracts on Monad |
| Agent Runtime | Python 3.11 + `web3.py` | Agent logic, on-chain interaction |
| AI/LLM | OpenAI API (`gpt-4o-mini` default) | Pattern detection, reasoning |
| Dashboard | React + Vite + Tailwind | Live status, demo interface |
| Data Sources | Monad RPC + mock injectors | Real mempool data + simulated attacks |
| Identity | ERC-8004 (AgentRegistry) | Portable on-chain agent identity + reputation |

---

## Environment Variables

Copy `.env.example` → `.env`:

| Variable | Required | Purpose |
|---|---|---|
| `MONAD_RPC` | Yes | Monad testnet RPC endpoint |
| `OPENAI_API_KEY` | Yes | All LLM calls |
| `SWARM_COORDINATOR_ADDRESS` | Yes | Deployed contract address |
| `AGENT_REGISTRY_ADDRESS` | Yes | Deployed contract address |
| `AGENT1_PRIVATE_KEY` | Yes | Flashloan agent wallet |
| `AGENT2_PRIVATE_KEY` | Yes | Oracle agent wallet |
| `AGENT3_PRIVATE_KEY` | Yes | Liquidity agent wallet |
| `LLM_DEFAULT_MODEL` | No (default `gpt-4o-mini`) | First-pass detection |
| `LLM_ESCALATION_MODEL` | No (default `gpt-4o`) | Ambiguous cases |
| `ESCALATION_THRESHOLD` | No (default `0.6`) | Confidence below this triggers escalation |
| `CONSENSUS_THRESHOLD` | No (default `60`) | % of agents needed for action |

---

## Project Structure

```
swarmguard/
├── contracts/
│   ├── AgentRegistry.sol          # ERC-8004 compatible agent identity
│   ├── SwarmCoordinator.sol       # Consensus + action execution
│   └── abi/
│       ├── AgentRegistry.json
│       └── SwarmCoordinator.json
├── agents/
│   ├── __init__.py
│   ├── base_agent.py              # Abstract base: fetch, detect, submit
│   ├── flashloan_agent.py         # Mempool monitoring
│   ├── oracle_agent.py            # Price deviation detection
│   └── liquidity_agent.py         # TVL drain detection
├── simulator/
│   └── attack_simulator.py        # Injects mock attacks for demo
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Main dashboard
│   │   ├── components/
│   │   │   ├── AgentCard.jsx     # Individual agent status
│   │   │   ├── ProtocolStatus.jsx # Pause/active indicator
│   │   │   ├── EventLog.jsx      # On-chain event feed
│   │   │   └── AttackPanel.jsx   # Simulate buttons
│   │   └── main.jsx
│   └── package.json
├── scripts/
│   ├── deploy.js                 # Hardhat deploy to Monad testnet
│   └── register_agents.js        # Register 3 agents post-deploy
├── cache/
│   └── verdict_log.jsonl         # Audit trail of all agent submissions
├── run_demo.py                  # Start all agents + simulator
├── .env
├── .env.example
├── hardhat.config.js
└── README.md
```

---

## Development Phases

### Phase 0: Pre-Hackathon Setup (Do Before)
- [ ] Fund Monad testnet wallet (faucet: https://testnet.monad.xyz)
- [ ] Install Hardhat, initialize project with Monad RPC
- [ ] Install Python deps: `web3`, `openai`, `python-dotenv`, `asyncio`
- [ ] Scaffold React app with Vite + Tailwind
- [ ] Verify `.env` is populated and contracts compile

### Phase 1: Smart Contracts (90 min)
- [ ] Write `AgentRegistry.sol` — agent registration, reputation, ERC-8004 metadata
- [ ] Write `SwarmCoordinator.sol` — verdict submission, consensus engine, action execution
- [ ] Deploy both to Monad testnet
- [ ] Save contract addresses to `.env`
- [ ] Test: register 3 agents, submit mock verdict, verify consensus math

**Exit condition:** `registerAgent()` and `submitVerdict()` both succeed on testnet.

### Phase 2: Agent Swarm (90 min)
- [ ] Implement `BaseAgent` class: `fetch_data()`, `detect()`, `submit_verdict()`
- [ ] Implement `FlashloanAgent`: polls mempool/DEX API, detects large same-block borrows
- [ ] Implement `OracleAgent`: compares on-chain vs CEX prices, flags deviation
- [ ] Implement `LiquidityAgent`: tracks TVL changes, flags sudden drops
- [ ] Test each agent independently against mock data
- [ ] Wire agents to submit real transactions to `SwarmCoordinator`

**Exit condition:** All 3 agents can submit verdicts on-chain and they appear in `protocolVerdicts`.

### Phase 3: Attack Simulator (30 min)
- [ ] Build `AttackSimulator` with 3 scenarios: flashloan, oracle manip, liquidity drain
- [ ] Each scenario injects mock data into the relevant agent's `fetch_data()`
- [ ] Add "Simulate Attack" buttons to dashboard

**Exit condition:** Pressing "Simulate Flashloan" causes FlashloanAgent to submit a high-threat verdict.

### Phase 4: Dashboard (60 min)
- [ ] Agent cards: name, status (green/yellow/red), reputation score
- [ ] Protocol status: ACTIVE / PAUSED with color indicator
- [ ] Event log: real-time feed of on-chain verdicts + actions
- [ ] Attack panel: 3 simulate buttons + reset
- [ ] Link to Monad explorer for transaction verification

**Exit condition:** Dashboard shows live agent status and updates when attack is simulated.

### Phase 5: Integration & Demo Prep (30 min)
- [ ] Wire `run_demo.py` to start all agents + simulator
- [ ] Full end-to-end test: simulate attack → agents flag → consensus → contract pauses
- [ ] Verify all transactions on Monad explorer
- [ ] Prepare 3-minute pitch script
- [ ] Clean up repo, write README

**Exit condition:** Complete demo runs in <2 minutes with zero manual intervention.

---

## The Demo Script (3 Minutes)

| Time | Speaker | Screen |
|------|---------|--------|
| 0:00 | "DeFi lost $3B to exploits. Current security is centralized or slow." | Headlines of major hacks |
| 0:20 | "We built SwarmGuard — a decentralized immune system." | Dashboard with 3 green agents |
| 0:30 | "Each agent has an on-chain identity via ERC-8004." | Click agent → show NFT ID + reputation |
| 0:40 | "Now I'll simulate a flashloan attack." | Press "Simulate Flashloan" |
| 0:42 | "Agent 1 sees abnormal borrow in mempool..." | Flashloan Agent → yellow |
| 0:45 | "Agent 2 confirms price deviation..." | Oracle Agent → yellow |
| 0:48 | "Agent 3 sees liquidity draining..." | Liquidity Agent → red |
| 0:52 | "Consensus reached — 60% threshold hit." | All agents red, counter hits 3/3 |
| 0:55 | "Contract auto-pauses. No human touched anything." | "CONTRACT PAUSED" banner |
| 1:00 | "All verifiable on Monad in under 10 seconds." | Show Monad explorer with tx hashes |
| 1:10 | "This is only possible on Monad — 10K TPS, near-zero gas." | Gas cost: $0 vs $500/hr on Ethereum |
| 1:20 | "SwarmGuard — decentralized security for the agent economy." | Logo + GitHub + live links |

---

## Important Features (What Must Be in v1)

- [ ] Agents submit real transactions to Monad testnet (not mock)
- [ ] Consensus threshold enforced on-chain (not off-chain)
- [ ] Auto-action triggered without human intervention
- [ ] Dashboard shows live on-chain events (via RPC polling or WebSocket)
- [ ] Each agent has distinct wallet + on-chain identity
- [ ] Demo completes in <2 minutes with clear "wow" moment
- [ ] All transactions verifiable on Monad explorer

---

## What Will Score Well Beyond Baseline

- **ERC-8004 integration:** Agent identities as NFTs with portable reputation — directly fits "Agent Economy" theme
- **Real-time on-chain consensus:** Not simulated — actual smart contract tallying votes
- **Monad-specific justification:** Explicitly show why this is impossible on other chains (gas cost comparison)
- **Reputation system:** Agents gain/lose reputation based on accuracy — creates economic incentive layer
- **Audit trail:** Every verdict logged on-chain + in `cache/verdict_log.jsonl` for transparency
- **Modular agent design:** Easy to add new agent types (bridge guardian, wallet profiler, etc.)

---

## Known Limitations (Be Honest)

- 🟡 **Mock data for demo:** Real mempool monitoring needs production RPC; demo uses injected mock attacks
- 🟡 **3 agents only:** Full swarm would have 10+ agents; 3 is enough for proof-of-concept
- 🟡 **Simplified consensus:** Reputation-weighted voting not implemented in v1 (equal weight)
- 🟡 **No slashing:** Bad agents aren't economically penalized yet — reputation only
- 🟡 **Frontend polling:** No WebSocket subscription yet; dashboard polls RPC every 2s

---

## Roadmap

### High Priority (Post-Hackathon)
- [ ] Reputation-weighted consensus (high-rep agents count more)
- [ ] Slashing mechanism for false positives
- [ ] Real mempool integration via Monad RPC
- [ ] WebSocket subscription for instant dashboard updates
- [ ] Additional agents: Bridge Guardian, Wallet Profiler, Governance Monitor

### Medium Priority
- [ ] Cross-protocol monitoring (not just one target contract)
- [ ] Machine learning model for anomaly detection (replace rule-based)
- [ ] Governance DAO for parameter changes (thresholds, agent whitelist)
- [ ] Insurance integration: auto-payout when swarm prevents loss

### Nice to Have
- [ ] Mobile app for push alerts
- [ ] Cross-chain monitoring via bridges
- [ ] Formal verification of consensus contract

---

## Common Commands

```bash
# Setup
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in keys

# Deploy contracts
npx hardhat run scripts/deploy.js --network monadTestnet

# Register agents
npx hardhat run scripts/register_agents.js --network monadTestnet

# Start swarm
python run_demo.py

# Start dashboard
cd frontend && npm install && npm run dev
```

---

## Monad-Specific Context

### Why Monad Enables This

| Feature | SwarmGuard Requirement | Monad Deliverable |
|---------|----------------------|-------------------|
| Throughput | 10+ agents writing verdicts every few seconds | 10,000 TPS |
| Finality | Consensus must resolve before attack completes | 400ms blocks, 800ms finality |
| Gas Cost | Swarm monitoring must be economically viable | Near-zero gas |
| EVM Compatibility | Use existing Solidity tooling | Full EVM bytecode compatible |
| Decentralization | No single sequencer controlling agents | MonadBFT consensus |

### MonadDB Relevance

MonadDB is Monad's custom key-value database for storing authenticated blockchain data (Merkle Patricia Trie nodes). While you don't interact with it directly, it enables the throughput that makes real-time swarm consensus possible. Mention in pitch: *"Monad's custom database architecture enables the 10K TPS that makes decentralized real-time security monitoring economically viable."*

---

*Last updated: June 20, 2026*
"""

with open('/mnt/agents/output/development.md', 'w') as f:
    f.write(swarmguard_dev_md)

print("development.md created successfully!")
print(f"Length: {len(swarmguard_dev_md)} characters")
