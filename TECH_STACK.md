# SwarmGuard — Technology Stack

> **Project:** SwarmGuard — Decentralized AI Security Swarm for DeFi
> **Hackathon:** Monad Blitz — The Agent Economy (June 20, 2026)
> **Status:** Stack finalized, dependencies locked

---

## 1. Stack Overview

```
+-------------------------------------------------------------+
|                    SWARMGUARD TECH STACK                      |
+-------------------------------------------------------------+
|                                                             |
|  FRONTEND (User Interface)                                  |
|  +----------------+  +----------------+  +----------------+  |
|  | React 18       |  | Vite 5         |  | Tailwind CSS 3 |  |
|  | UI Library     |  | Build Tool     |  | Styling       |  |
|  +----------------+  +----------------+  +----------------+  |
|                                                             |
|  AGENT SWARM (AI + Blockchain Integration)                    |
|  +----------------+  +----------------+  +----------------+  |
|  | Python 3.11    |  | web3.py 6.x    |  | OpenAI SDK     |  |
|  | Runtime        |  | Blockchain     |  | AI/LLM         |  |
|  +----------------+  +----------------+  +----------------+  |
|                                                             |
|  BLOCKCHAIN (Smart Contracts)                               |
|  +----------------+  +----------------+  +----------------+  |
|  | Solidity 0.8   |  | Hardhat 2.x    |  | Monad Testnet  |  |
|  | Language       |  | Dev Framework  |  | Network        |  |
|  +----------------+  +----------------+  +----------------+  |
|                                                             |
|  INFRASTRUCTURE (DevOps + Tooling)                          |
|  +----------------+  +----------------+  +----------------+  |
|  | Git            |  | dotenv         |  | VS Code        |  |
|  | Version Ctrl   |  | Config Mgmt    |  | IDE            |  |
|  +----------------+  +----------------+  +----------------+  |
|                                                             |
+-------------------------------------------------------------+
```

---

## 2. Layer-by-Layer Breakdown

### 2.1 Blockchain Layer

#### Smart Contract Platform

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Language** | Solidity | ^0.8.19 | Smart contract development |
| **Framework** | Hardhat | ^2.19.0 | Compile, test, deploy |
| **Network** | Monad Testnet | Latest | Deployment target |
| **Mainnet** | Monad Mainnet | Latest | Production target |
| **EVM Compatibility** | Full | N/A | Use existing Ethereum tooling |

#### Monad-Specific Configuration

```javascript
// hardhat.config.js
module.exports = {
  solidity: "0.8.19",
  networks: {
    monadTestnet: {
      url: "https://rpc.testnet.monad.xyz",
      chainId: 10143,
      accounts: [process.env.PRIVATE_KEY]
    },
    monadMainnet: {
      url: "https://rpc.monad.xyz",
      chainId: 143,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: {
      monadTestnet: "not-needed",
      monadMainnet: "not-needed"
    }
  }
};
```

#### Contract Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| OpenZeppelin Contracts | ^5.0.0 | ERC-721 (ERC-8004 base), Ownable, ReentrancyGuard |
| OpenZeppelin Contracts-Upgradeable | ^5.0.0 | Future: upgradeable contracts |

#### Contract Architecture

```
Contracts/
├── AgentRegistry.sol          # ERC-8004 agent identity + reputation
│   ├── inherits: ERC721, Ownable
│   ├── uses: OpenZeppelin ERC721
│   └── deploys: AgentRegistry contract
│
├── SwarmCoordinator.sol       # Consensus + action execution
│   ├── imports: AgentRegistry interface
│   ├── uses: ReentrancyGuard
│   └── deploys: SwarmCoordinator contract
│
├── interfaces/
│   ├── IAgentRegistry.sol     # Interface for AgentRegistry
│   └── ITargetProtocol.sol    # Interface for monitored contracts
│
└── mocks/
    └── MockTargetProtocol.sol # Demo contract to monitor (has pause function)
```

---

### 2.2 AI / Agent Layer

#### Runtime Environment

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Language** | Python | 3.11+ | Agent logic, data processing |
| **Interpreter** | CPython | 3.11.7 | Standard Python runtime |
| **Package Manager** | pip | 24.x | Dependency management |
| **Virtual Env** | venv | Built-in | Isolation |

#### Core Dependencies

| Package | Version | Purpose | Why This One |
|---------|---------|---------|-------------|
| **web3.py** | ^6.15.0 | Blockchain interaction | Most mature Python Ethereum library |
| **openai** | ^1.30.0 | LLM / VLM API calls | Official SDK, supports all models |
| **python-dotenv** | ^1.0.0 | Environment config | Standard for 12-factor apps |
| **requests** | ^2.31.0 | HTTP API calls | Standard for REST APIs |
| **aiohttp** | ^3.9.0 | Async HTTP | For concurrent agent polling |
| **pydantic** | ^2.7.0 | Data validation | Type-safe config and data models |
| **loguru** | ^0.7.0 | Logging | Better than stdlib logging |
| **tenacity** | ^8.2.0 | Retry logic | Handles RPC failures gracefully |
| **eth-account** | ^0.11.0 | Key management | Part of web3.py ecosystem |

#### AI Model Configuration

| Model Tier | Default Model | Fallback | Use Case |
|------------|--------------|----------|----------|
| **Detection (cheap)** | gpt-4o-mini | gpt-3.5-turbo | First-pass anomaly detection |
| **Escalation (strong)** | gpt-4o | gpt-4-turbo | Low-confidence / ambiguous cases |
| **Justification (cheap)** | gpt-4o-mini | gpt-3.5-turbo | Templated text generation |

```python
# Model selection via environment variables
LLM_DEFAULT_MODEL = os.getenv("LLM_DEFAULT_MODEL", "gpt-4o-mini")
LLM_ESCALATION_MODEL = os.getenv("LLM_ESCALATION_MODEL", "gpt-4o")
LLM_JUSTIFICATION_MODEL = os.getenv("LLM_JUSTIFICATION_MODEL", "gpt-4o-mini")
```

#### Agent Architecture Pattern

```
agents/
├── __init__.py
├── base_agent.py              # Abstract base class
│   ├── Web3 connection
│   ├── OpenAI client
│   ├── Contract interfaces
│   └── Abstract: fetch_data(), detect()
│
├── flashloan_agent.py         # Flashloan detection
│   ├── Data: mempool / DEX API
│   ├── Logic: borrow pattern analysis
│   └── Model: rule-based + LLM augmentation
│
├── oracle_agent.py            # Oracle manipulation
│   ├── Data: Chainlink + CEX prices
│   ├── Logic: deviation calculation
│   └── Model: rule-based + LLM augmentation
│
└── liquidity_agent.py           # Liquidity drain
    ├── Data: DEX TVL endpoints
    ├── Logic: TVL change analysis
    └── Model: rule-based + LLM augmentation
```

---

### 2.3 Frontend Layer

#### Framework & Build

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | React | ^18.2.0 | UI library |
| **Build Tool** | Vite | ^5.0.0 | Fast dev server + bundler |
| **Language** | TypeScript | ^5.3.0 | Type safety |
| **Bundler** | Rollup (via Vite) | ^4.0.0 | Module bundling |
| **Dev Server** | Vite Dev Server | Built-in | Hot reload, proxy |

#### Styling & UI

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **CSS Framework** | Tailwind CSS | ^3.4.0 | Utility-first styling |
| **UI Components** | Headless UI | ^1.7.0 | Accessible primitives |
| **Icons** | Lucide React | ^0.300.0 | Icon library |
| **Animations** | Framer Motion | ^11.0.0 | Smooth transitions |
| **Fonts** | Inter | Google Fonts | Clean typography |

#### State Management

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **State** | React Hooks | Built-in | Local component state |
| **Polling** | useEffect + setInterval | Built-in | RPC polling for events |
| **Future** | WebSocket | Native | Real-time event streaming |

#### Dashboard Components

```
frontend/src/
├── App.tsx                      # Root component
├── main.tsx                     # Entry point
│
├── components/
│   ├── AgentCard.tsx            # Individual agent status card
│   │   ├── Status: green/yellow/red
│   │   ├── Reputation score
│   │   ├── Last verdict time
│   │   └── Agent type icon
│   │
│   ├── ProtocolStatus.tsx       # Overall protocol health
│   │   ├── ACTIVE / PAUSED / CIRCUIT_BROKEN
│   │   ├── Consensus progress bar
│   │   └── Last action timestamp
│   │
│   ├── EventLog.tsx             # On-chain event feed
│   │   ├── VerdictSubmitted events
│   │   ├── ActionTriggered events
│   │   └── Transaction hashes
│   │
│   ├── AttackPanel.tsx          # Simulation controls
│   │   ├── Flashloan button
│   │   ├── Oracle Manip button
│   │   ├── Liquidity Drain button
│   │   └── Reset button
│   │
│   └── ExplorerLink.tsx         # MonadVision link generator
│
├── hooks/
│   ├── useAgentStatus.ts        # Poll AgentRegistry
│   ├── useProtocolStatus.ts     # Poll SwarmCoordinator
│   ├── useEventLog.ts           # Poll for events
│   └── useSimulateAttack.ts     # Trigger mock attack
│
├── utils/
│   ├── rpc.ts                   # Monad RPC connection
│   ├── contracts.ts             # Contract ABIs + addresses
│   └── formatters.ts            # Time, number, hash formatting
│
└── types/
    ├── agent.ts                 # Agent type definitions
    ├── protocol.ts              # Protocol type definitions
    └── events.ts                # Event type definitions
```

---

### 2.4 Data & API Layer

#### External Data Sources

| Source | Type | Endpoint | Auth | Usage |
|--------|------|----------|------|-------|
| **Monad RPC** | JSON-RPC | https://rpc.testnet.monad.xyz | None | Read state, send transactions |
| **MonadVision** | Block Explorer | https://testnet.monadexplorer.com | None | Verify transactions |
| **Chainlink** | On-chain | Contract call | None | Price feed data |
| **Binance API** | REST | https://api.binance.com | Optional | CEX price reference |
| **CoinGecko** | REST | https://api.coingecko.com | Optional | Price reference |
| **The Graph** | GraphQL | DEX subgraph | None | TVL / reserve data |

#### Mock Data (Hackathon Demo)

```python
# simulator/attack_simulator.py
# Injects mock data instead of real API calls for demo purposes

FLASHLOAN_SCENARIO = {
    "borrows": [
        {"token": "USDC", "amount": 5000000, "block": "same"},
        {"token": "WETH", "amount": 2500, "block": "same"}
    ],
    "expected_threat_level": 85
}

ORACLE_SCENARIO = {
    "chainlink_price": 1800.00,
    "cex_price": 1950.00,
    "deviation_percent": 8.33,
    "expected_threat_level": 90
}

LIQUIDITY_SCENARIO = {
    "pool": "ETH-USDC",
    "previous_tvl": 10000000,
    "current_tvl": 7200000,
    "drop_percent": 28,
    "expected_threat_level": 95
}
```

---

### 2.5 DevOps & Tooling

#### Development Environment

| Tool | Version | Purpose |
|------|---------|---------|
| **VS Code** | Latest | IDE |
| **ES7+ React snippets** | Latest | Code snippets |
| **Solidity extension** | Latest | Syntax highlighting |
| **Python extension** | Latest | IntelliSense |
| **Prettier** | ^3.0.0 | Code formatting |
| **ESLint** | ^8.0.0 | JS/TS linting |
| **Black** | ^24.0.0 | Python formatting |
| **Ruff** | ^0.1.0 | Python linting |

#### Version Control

| Tool | Version | Purpose |
|------|---------|---------|
| **Git** | ^2.40.0 | Version control |
| **GitHub** | N/A | Repository hosting |
| **.gitignore** | Standard | Exclude node_modules, venv, .env |

#### Configuration Management

| Tool | Version | Purpose |
|------|---------|---------|
| **dotenv** | ^16.0.0 | Environment variables |
| **.env.example** | N/A | Template for required vars |
| **.env** | N/A | Local secrets (gitignored) |

---

## 3. Dependency Matrix

### 3.1 Production Dependencies

```json
// package.json (Frontend)
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.300.0",
    "framer-motion": "^11.0.0",
    "@headlessui/react": "^1.7.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "prettier": "^3.0.0",
    "eslint": "^8.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0"
  }
}
```

```txt
# requirements.txt (Python)
web3==6.15.0
openai==1.30.0
python-dotenv==1.0.0
requests==2.31.0
aiohttp==3.9.0
pydantic==2.7.0
loguru==0.7.0
tenacity==8.2.0
eth-account==0.11.0
```

```json
// package.json (Hardhat)
{
  "devDependencies": {
    "hardhat": "^2.19.0",
    "@nomicfoundation/hardhat-toolbox": "^4.0.0",
    "@openzeppelin/contracts": "^5.0.0",
    "dotenv": "^16.0.0"
  }
}
```

### 3.2 Development vs Production

| Component | Development | Production |
|-----------|------------|------------|
| **Network** | Monad Testnet | Monad Mainnet |
| **Agent Polling** | 5 seconds | 1-2 seconds |
| **Dashboard** | localhost:5173 | Deployed (Vercel/Netlify) |
| **Contracts** | Hardhat local + testnet | Mainnet verified |
| **API Keys** | Test keys | Production keys |
| **Logging** | Verbose (console) | Structured (file + cloud) |

---

## 4. Environment Setup

### 4.1 Prerequisites

| Tool | Minimum Version | Install Command |
|------|----------------|----------------|
| Node.js | 18.0.0 | `nvm install 18` |
| npm | 9.0.0 | Included with Node |
| Python | 3.11.0 | `pyenv install 3.11` |
| pip | 24.0.0 | Included with Python |
| Git | 2.40.0 | `brew install git` |
| Hardhat | 2.19.0 | `npm install -g hardhat` |

### 4.2 Project Setup Commands

```bash
# 1. Clone repository
git clone https://github.com/yourteam/swarmguard.git
cd swarmguard

# 2. Setup Python environment
python3.11 -m venv .venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scriptsctivate   # Windows
pip install -r requirements.txt

# 3. Setup Hardhat
cd contracts
npm install
npx hardhat compile

# 4. Setup Frontend
cd ../frontend
npm install

# 5. Configure environment
cp .env.example .env
# Edit .env with your API keys and contract addresses

# 6. Deploy contracts (testnet)
npx hardhat run scripts/deploy.js --network monadTestnet
# Save output addresses to .env

# 7. Register agents
npx hardhat run scripts/register_agents.js --network monadTestnet

# 8. Start agents
python run_demo.py

# 9. Start dashboard (new terminal)
cd frontend
npm run dev
# Open http://localhost:5173
```

### 4.3 Environment Variables

```bash
# .env.example
# Copy to .env and fill in values

# === MONAD BLOCKCHAIN ===
MONAD_RPC=https://rpc.testnet.monad.xyz
MONAD_CHAIN_ID=10143

# === CONTRACT ADDRESSES (fill after deploy) ===
AGENT_REGISTRY_ADDRESS=0x...
SWARM_COORDINATOR_ADDRESS=0x...
TARGET_PROTOCOL_ADDRESS=0x...

# === AGENT WALLETS (3 separate EOAs) ===
AGENT1_PRIVATE_KEY=0x...
AGENT2_PRIVATE_KEY=0x...
AGENT3_PRIVATE_KEY=0x...

# === AI / OPENAI ===
OPENAI_API_KEY=sk-...

# === MODEL CONFIGURATION ===
LLM_DEFAULT_MODEL=gpt-4o-mini
LLM_ESCALATION_MODEL=gpt-4o
LLM_JUSTIFICATION_MODEL=gpt-4o-mini
ESCALATION_THRESHOLD=0.6

# === CONSENSUS PARAMETERS ===
CONSENSUS_THRESHOLD=60
ACTION_THRESHOLD=30

# === DEMO MODE ===
DEMO_MODE=true
MOCK_DATA=true
```

---

## 5. Testing Strategy

### 5.1 Contract Testing

| Test Type | Tool | Coverage |
|-----------|------|----------|
| Unit Tests | Hardhat + Chai | All contract functions |
| Integration | Hardhat Network | Agent -> Coordinator flow |
| Fuzzing | Echidna (future) | Consensus edge cases |

```bash
# Run contract tests
npx hardhat test

# Run with coverage
npx hardhat coverage
```

### 5.2 Agent Testing

| Test Type | Tool | Coverage |
|-----------|------|----------|
| Unit Tests | pytest | Detection logic |
| Integration | pytest + local Hardhat | End-to-end agent flow |
| Mock Tests | unittest.mock | External API calls |

```bash
# Run agent tests
pytest agents/tests/

# Run with coverage
pytest --cov=agents agents/tests/
```

### 5.3 Frontend Testing

| Test Type | Tool | Coverage |
|-----------|------|----------|
| Component | Vitest + React Testing Library | UI components |
| E2E | Playwright (future) | Full demo flow |

```bash
# Run frontend tests
npm run test
```

---

## 6. Deployment Checklist

### 6.1 Pre-Deployment

- [ ] All contracts compile without warnings
- [ ] Contract tests pass (100% coverage target)
- [ ] Agent tests pass
- [ ] Frontend builds without errors
- [ ] Environment variables configured
- [ ] Testnet wallets funded
- [ ] API keys validated

### 6.2 Deployment Steps

1. **Deploy Contracts**
   ```bash
   npx hardhat run scripts/deploy.js --network monadTestnet
   ```

2. **Verify Contracts**
   ```bash
   npx hardhat verify --network monadTestnet <address> <constructor_args>
   ```

3. **Register Agents**
   ```bash
   npx hardhat run scripts/register_agents.js --network monadTestnet
   ```

4. **Start Agent Swarm**
   ```bash
   python run_demo.py
   ```

5. **Launch Dashboard**
   ```bash
   cd frontend && npm run dev
   ```

### 6.3 Post-Deployment Verification

- [ ] AgentRegistry shows 3 registered agents
- [ ] SwarmCoordinator shows registered protocol
- [ ] Agents can submit verdicts (test with low threat)
- [ ] Consensus triggers correctly (test with mock attack)
- [ ] Dashboard shows real-time updates
- [ ] All transactions visible on MonadVision

---

## 7. Performance Benchmarks

| Metric | Target | Measurement Tool |
|--------|--------|-----------------|
| Contract deploy time | <30s | Hardhat timer |
| Agent verdict submission | <2s | Python time module |
| Consensus detection | <5s | Block timestamp diff |
| Dashboard render | <100ms | React Profiler |
| Full demo cycle | <10s | Stopwatch |
| Gas per verdict | <0.001 MON | Hardhat gas reporter |

---

## 8. Troubleshooting Guide

| Problem | Cause | Solution |
|---------|-------|----------|
| "Insufficient funds" | Testnet wallet empty | Request faucet: https://testnet.monad.xyz |
| "Nonce too low" | Multiple agents same wallet | Each agent needs separate wallet |
| "Contract not found" | Wrong address in .env | Redeploy and update .env |
| "OpenAI rate limit" | Too many requests | Add delays, use cheaper model |
| "RPC timeout" | Network congestion | Retry with tenacity, use backup RPC |
| "Dashboard not updating" | CORS issue | Configure Vite proxy |

---

## 9. Resource Requirements

### 9.1 Development Machine

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 4 cores | 8 cores |
| RAM | 8 GB | 16 GB |
| Storage | 10 GB free | 50 GB free |
| OS | macOS / Linux / WSL | macOS / Linux |
| Network | Stable internet | Low latency |

### 9.2 Running Costs (Testnet)

| Component | Cost | Notes |
|-----------|------|-------|
| Contract deploy | ~0.001 MON | One-time per deploy |
| Agent verdicts | ~0.0001 MON each | ~$0 at testnet prices |
| OpenAI API | ~$0.01-0.10 per demo | Depends on model tier |
| Frontend hosting | Free | localhost for hackathon |

### 9.3 Running Costs (Mainnet Projection)

| Component | Cost (MON) | Cost (USD est.) |
|-----------|-----------|-----------------|
| Contract deploy | 0.01-0.1 | ~$0.01-0.10 |
| Per verdict | 0.0001-0.001 | ~$0.0001-0.001 |
| 100 agents, 1000 verdicts/day | 0.1-1 MON | ~$0.10-1.00 |
| OpenAI (cheap tier) | N/A | ~$5-20/day |
| OpenAI (with escalation) | N/A | ~$20-50/day |

---

## 10. Alternative Stack Considerations

### 10.1 Why Not These Alternatives?

| Alternative | Why Not Used | Trade-off |
|-------------|------------|-----------|
| **Truffle** instead of Hardhat | Hardhat has better TypeScript support, faster compile | Personal preference |
| **Ethers.js v5** instead of web3.py | web3.py has better Python integration for agents | Ethers.js for frontend only |
| **LangChain** instead of raw OpenAI | Adds complexity for simple use case | Could add for v2 agent orchestration |
| **Next.js** instead of Vite | Vite is faster for hackathon prototyping | Next.js for production SEO |
| **WebSocket** instead of polling | WebSocket not available on all RPCs | Polling is more reliable for demo |
| **Docker** instead of local env | Adds complexity for 5-hour hackathon | Docker for production deployment |

### 10.2 Future Stack Evolution

| Phase | Addition | When |
|-------|----------|------|
| v1.1 | WebSocket subscriptions | After hackathon |
| v1.2 | LangGraph for agent orchestration | Multi-agent coordination |
| v1.3 | Docker + Docker Compose | Production deployment |
| v2.0 | Rust agent runtime | Performance-critical agents |
| v2.0 | ZK proofs for verdict verification | Privacy + trustlessness |
| v2.0 | IPFS for agent metadata | Decentralized metadata |

---

*Document version: 1.0*
*Last updated: June 20, 2026*
