# SwarmGuard — System Architecture

> **Project:** SwarmGuard — Decentralized AI Security Swarm for DeFi
> **Hackathon:** Monad Blitz — The Agent Economy (June 20, 2026)
> **Status:** Architecture finalized, ready for 5-hour build

---

## 1. System Overview

SwarmGuard is a **decentralized immune system for DeFi protocols**. It deploys a swarm of specialized AI agents that independently monitor different attack vectors, submit signed verdicts on-chain, and trigger protective actions when consensus is reached — all without human intervention.

**Core Principle:** No single agent can trigger an action. Consensus requires multiple independent detections, making the system resilient to false positives and Byzantine agents.

---

## 2. High-Level Architecture

```
Layer 4: DASHBOARD (React + Vite + Tailwind)
  +-------------+  +-------------+  +-------------+  +-------------+
  | Agent Cards |  | Protocol    |  | Event Log   |  | Attack      |
  | (status)    |  | Status      |  | (on-chain)  |  | Simulator   |
  +-------------+  +-------------+  +-------------+  +-------------+
                          |
                          v WebSocket / RPC Polling
Layer 3: AGENT SWARM (Python 3.11)
  +-----------------+  +-----------------+  +-----------------+
  | Flashloan       |  | Oracle          |  | Liquidity       |
  | Detector        |  | Watcher         |  | Monitor         |
  | - Mempool scan  |  | - Price compare |  | - TVL tracking  |
  | - Borrow pattern|  | - CEX vs on-chain|  | - Reserve ratio |
  | - Same-block    |  | - Deviation %   |  | - Drain velocity|
  |   repay detect  |  | - Threshold flag|  | - Threshold flag|
  +--------+--------+  +--------+--------+  +--------+--------+
           |                    |                    |
           +--------------------+--------------------+
                                |
                                v submitVerdict()
                         +-------------+
                         | BaseAgent   |
                         | - fetch_data()|
                         | - detect()    |
                         | - submit()    |
                         +-------------+
                                |
                                v signed transaction
Layer 2: MONAD BLOCKCHAIN (Solidity)
  +-------------------------------------------------------------+
  | SwarmCoordinator Contract                                    |
  | +-------------+  +-------------+  +-------------+  +-------+ |
  | | Verdict     |  | Consensus   |  | Action      |  |Protocol| |
  | | Registry    |  | Engine      |  | Executor    |  |Registry| |
  | | - agentId   |  | - Tally     |  | - Pause     |  | - target| |
  | | - threatLvl |  | - Threshold |  | - Freeze    |  | - thresh| |
  | | - evidence  |  | - Weighted  |  | - Alert     |  | - status| |
  | | - timestamp |  | - TimeWindow|  | - Circuit   |  |        | |
  | |             |  |             |  |   Breaker   |  |        | |
  | +-------------+  +-------------+  +-------------+  +-------+ |
  +-------------------------------------------------------------+
  | AgentRegistry Contract (ERC-8004)                            |
  | +-------------+  +-------------+  +-------------+          |
  | | ERC-8004    |  | Reputation  |  | Staking     |          |
  | | Identity    |  | Tracker     |  | (future)    |          |
  | | - NFT ID    |  | - score     |  | - deposit   |          |
  | | - metadata  |  | - accuracy  |  | - slash     |          |
  | | - owner     |  | - history   |  | - reward    |          |
  | +-------------+  +-------------+  +-------------+          |
  +-------------------------------------------------------------+
  | Monad Testnet / Mainnet                                     |
  | 10,000 TPS | 400ms blocks | ~$0 gas                        |
  +-------------------------------------------------------------+
                                |
                                v event emission
Layer 1: DATA SOURCES
  +-------------+  +-------------+  +-------------+  +-------------+
  | Monad RPC   |  | Price APIs  |  | DEX APIs    |  | Mock        |
  | (mempool)   |  | (Chainlink) |  | (TVL data)  |  | Injector    |
  +-------------+  +-------------+  +-------------+  +-------------+
                          (for demo / hackathon)
```

---

## 3. Component Deep Dive

### 3.1 Agent Swarm Layer

Each agent is an **independent Python process** with its own wallet, running specialized detection logic.

#### Agent Lifecycle

START -> REGISTER on-chain -> POLL data -> DETECT anomaly -> SUBMIT verdict
                                      |                        |
                                      | No anomaly             |
                                      |                        |
                                      v                        v
                                   SLEEP 5 sec              WAIT next poll

#### Agent Types (v1 — 3 agents)

| Agent | Data Source | Detection Logic | Threat Signal |
|-------|------------|----------------|---------------|
| **Flashloan Detector** | Mempool / DEX API | Large borrow + same-block repay pattern | Borrow >$1M in single tx, repaid within same block |
| **Oracle Watcher** | Chainlink + CEX API | Price deviation between on-chain and off-chain | Deviation >2% for >2 blocks |
| **Liquidity Monitor** | DEX TVL endpoints | Sudden TVL drop in pool | TVL drop >10% in single block |

#### Agent Base Class

```python
class BaseAgent:
    # Abstract base for all SwarmGuard agents.
    # Each agent:
    # 1. Has its own EOA wallet (registered in AgentRegistry)
    # 2. Polls a specific data source
    # 3. Runs detection logic (rule-based + LLM-augmented)
    # 4. Submits signed verdict to SwarmCoordinator
    # 5. Builds reputation based on accuracy

    def __init__(self, agent_type, private_key, 
                 coordinator_address, registry_address):
        self.agent_type = agent_type
        self.w3 = Web3(Web3.HTTPProvider(os.getenv("MONAD_RPC")))
        self.account = self.w3.eth.account.from_key(private_key)
        self.coordinator = self.w3.eth.contract(
            address=coordinator_address, abi=CO_ABI)
        self.registry = self.w3.eth.contract(
            address=registry_address, abi=AR_ABI)
        self.openai = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    def fetch_data(self):
        # Poll data source. Returns raw data for detection.
        pass

    def detect(self, data):
        # Analyze data for anomalies.
        # Returns:
        #   threat_level: 0-100 (0 = safe, 100 = critical)
        #   evidence: structured dict with detection reasoning
        pass

    def submit_verdict(self, protocol_id, threat_level, evidence):
        # Submit signed verdict to SwarmCoordinator on Monad.
        evidence_hash = self.w3.keccak(text=json.dumps(evidence)).hex()
        tx = self.coordinator.functions.submitVerdict(
            protocol_id, threat_level, evidence_hash
        ).build_transaction({
            'from': self.account.address,
            'nonce': self.w3.eth.get_transaction_count(self.account.address),
            'gas': 200000,
            'gasPrice': self.w3.to_wei('1', 'gwei')
        })
        signed = self.w3.eth.account.sign_transaction(
            tx, private_key=self.account.key)
        tx_hash = self.w3.eth.send_raw_transaction(signed.rawTransaction)
        return tx_hash.hex()

    def run(self, protocol_id, poll_interval=5):
        # Main loop. Poll -> detect -> submit (if threat > threshold).
        while True:
            data = self.fetch_data()
            threat_level, evidence = self.detect(data)
            if threat_level > 30:  # Only submit notable threats
                tx = self.submit_verdict(protocol_id, threat_level, evidence)
                print(f"[{self.agent_type}] Threat: {threat_level} | Tx: {tx}")
            time.sleep(poll_interval)
```

---

### 3.2 Blockchain Layer

#### SwarmCoordinator Contract

**Purpose:** Receive verdicts from agents, tally votes, trigger actions when consensus is reached.

**Key Functions:**

```solidity
// Register a protocol to be monitored
function registerProtocol(
    address targetContract, 
    uint256 consensusThreshold,  // e.g., 60 = 60% of active agents
    uint256 actionThreshold     // min threat level to count toward consensus
) external returns (uint256 protocolId);

// Submit verdict (called by registered agents)
function submitVerdict(
    uint256 protocolId,
    uint8 threatLevel,        // 0-100
    bytes32 evidenceHash      // keccak256 of detection evidence JSON
) external;

// View: check if consensus reached for a protocol
function checkConsensus(uint256 protocolId) external view returns (bool);

// View: get all verdicts for a protocol in current window
function getVerdicts(uint256 protocolId) external view returns (Verdict[] memory);

// Execute protective action (auto-called when consensus reached)
function executeAction(uint256 protocolId, ActionType action) internal;
```

**Consensus Algorithm:**

For each protocol:
    Collect all verdicts within VOTE_WINDOW blocks (e.g., 10 blocks)

    For each agent that submitted:
        Get agent reputation from AgentRegistry

    Calculate weighted average threat level:
        weighted_threat = sum(threat_level_i * reputation_i) / sum(reputation_i)

    Count agents with threat_level >= action_threshold

    If (counting_agents / total_active_agents) >= consensus_threshold:
        Trigger action based on weighted_threat:
            30-60: ALERT (notify governance)
            60-80: PAUSE (pause target contract)
            80-100: CIRCUIT_BREAKER (protocol-wide halt)

#### AgentRegistry Contract (ERC-8004 Compatible)

**Purpose:** On-chain identity, reputation, and discoverability for all agents.

```solidity
struct Agent {
    address owner;           // EOA that controls this agent
    string metadataURI;      // IPFS hash with agent type, description, version
    uint256 reputation;      // accuracy score (starts at 100)
    uint256 totalVerdicts;   // total submissions
    uint256 accurateVerdicts;// submissions that matched final outcome
    bool isActive;           // can be deactivated by owner or governance
    uint256 registrationTime;
}

// ERC-8004: Agent Identity as NFT
mapping(uint256 => Agent) public agents;
mapping(address => uint256) public agentIdByOwner;
mapping(uint256 => address) public ownerOf;  // ERC-721 compatible
uint256 public nextAgentId;

// Register new agent (creates ERC-8004 identity NFT)
function registerAgent(string calldata metadataURI) external returns (uint256 agentId);

// Update reputation (called only by SwarmCoordinator)
function updateReputation(uint256 agentId, bool wasAccurate) external;

// Deactivate agent (governance or owner)
function deactivateAgent(uint256 agentId) external;

// View: get agent reputation score
function getReputation(uint256 agentId) external view returns (uint256);
```

**ERC-8004 Compliance:**
- Each agent is a non-transferable ERC-721 NFT (soulbound to owner address)
- Metadata URI contains agent type, capabilities, version history
- Reputation is on-chain and portable across protocols

---

### 3.3 Dashboard Layer

**Purpose:** Real-time visualization of swarm status, on-chain events, and attack simulation.

**Components:**

| Component | Data Source | Update Frequency |
|-----------|------------|-----------------|
| Agent Cards | AgentRegistry + SwarmCoordinator | 2s polling |
| Protocol Status | SwarmCoordinator.protocols | Event-driven |
| Event Log | SwarmCoordinator events | WebSocket / 2s polling |
| Attack Simulator | Mock data injection | On button click |
| Explorer Link | MonadVision / Blockscout | Static links |

**State Flow:**

User clicks "Simulate Flashloan"
    |
    v
Frontend sends POST to simulator API
    |
    v
Simulator injects mock borrow data into FlashloanAgent's fetch_data()
    |
    v
FlashloanAgent detects anomaly -> submits verdict on-chain
    |
    v
SwarmCoordinator emits VerdictSubmitted event
    |
    v
Dashboard receives event -> Agent Card turns yellow
    |
    v
Other agents also detect (if multi-vector attack) -> more verdicts
    |
    v
Consensus threshold reached -> SwarmCoordinator emits ActionTriggered
    |
    v
Dashboard updates: Protocol Status = PAUSED, all agents red
    |
    v
Explorer link shows transaction hash for verification

---

## 4. Data Flow Diagrams

### 4.1 Normal Operation (No Attack)

Agent 1 (GREEN)    Agent 2 (GREEN)    Agent 3 (GREEN)
     |                  |                  |
     |  fetch_data()    |                  |
     |  (normal values) |                  |
     |                  |                  |
     v                  v                  v
+-------------------------------------------+
| detect() -> threat_level = 0-20           |
| (below submission threshold)              |
+-------------------------------------------+
     |                  |                  |
|   NO SUBMIT  |   NO SUBMIT  |   NO SUBMIT
     |                  |                  |
     v                  v                  v
+-------------------------------------------+
| Dashboard: All agents GREEN               |
| Protocol: ACTIVE                          |
| Event Log: (quiet)                        |
+-------------------------------------------+

### 4.2 Attack Detected (Single Vector)

Agent 1 (RED)      Agent 2 (YELLOW)   Agent 3 (GREEN)
     |                  |                  |
|  Large borrow detected                  |
|  threat_level = 85                      |
     |                  |                  |
     v                  v                  v
+-------------------------------------------+
| Agent 1 submits verdict (85)              |
| Agent 2 submits verdict (45)              |
| Agent 3: no submit (safe)               |
+-------------------------------------------+
     |                  |                  |
     v                  v                  v
+-------------------------------------------+
| SwarmCoordinator:                         |
|   2/3 agents flagged (66%)                |
|   Weighted threat: 72                     |
|   Threshold: 60% -> CONSENSUS             |
|   Action: PAUSE (72 is 60-80 range)       |
+-------------------------------------------+
     |
     v
+-------------------------------------------+
| Dashboard:                                |
|   Agent 1: RED (reputation +1)          |
|   Agent 2: YELLOW (reputation +1)         |
|   Agent 3: GREEN (no change)            |
|   Protocol: PAUSED                        |
|   Event: "PAUSE triggered by swarm"       |
+-------------------------------------------+

### 4.3 Attack Detected (Multi-Vector)

Flashloan (RED)    Oracle (RED)       Liquidity (RED)
     |                  |                  |
|  Flashloan   |  Price       |  TVL
|  + Oracle    |  deviation   |  drain
|  manipulation|  + liquidity |  + flashloan
|              |  drain       |
     v                  v                  v
+-------------------------------------------+
| All 3 agents submit high threat           |
| (85, 90, 95)                              |
| Weighted threat: 91                       |
| Consensus: 100% (3/3)                     |
| Action: CIRCUIT_BREAKER (91 > 80)       |
+-------------------------------------------+

---

## 5. Security Model

### 5.1 Threats & Mitigations

| Threat | Mitigation | Implementation |
|--------|-----------|----------------|
| Rogue Agent | Reputation-weighted consensus | High-rep agents count more; new agents start with low weight |
| Sybil Attack | Registration cost + staking | Future: require MON deposit to register |
| False Positives | Multi-agent consensus | Single agent cannot trigger action |
| Censorship | Decentralized agent set | Anyone can register an agent; no whitelist |
| Front-running | Commit-reveal (future) | Agents commit hash, reveal after block |
| Oracle Failure | Multiple data sources | Each agent uses independent data feeds |

### 5.2 Trust Assumptions

1. Majority of agents are honest: Consensus requires >50% agreement; system works if majority detects correctly.
2. Monad chain is secure: All verdicts and actions rely on Monad's consensus (MonadBFT).
3. Data sources are accurate: Agents rely on external APIs (Chainlink, CEX, DEX); compromised source can cause false detection.

---

## 6. Performance Characteristics

| Metric | Target | Monad Capability |
|--------|--------|-----------------|
| Agent verdict submission | <2 seconds | 400ms blocks, 800ms finality |
| Consensus detection | <5 seconds | Parallel execution, 10K TPS |
| Action execution | <10 seconds total | Smart contract auto-execution |
| Dashboard update | <2 seconds | RPC polling or WebSocket |
| Gas cost per verdict | <$0.001 | Monad near-zero gas |
| Swarm size (v1) | 3 agents | Easily scalable to 10+ |
| Concurrent protocols | 1 (demo) | Contract supports unlimited |

---

## 7. Deployment Topology

Hackathon Demo Setup:

  +---------+  +---------+  +---------+
  | Agent 1 |  | Agent 2 |  | Agent 3 |
  | (Python)|  | (Python)|  | (Python)|
  | Local   |  | Local   |  | Local   |
  +----+----+  +----+----+  +----+----+
       |           |           |
       +-----------+-----------+
                   |
                   v
  +---------------------------------------+
  |      Monad Testnet (RPC endpoint)       |
  |  +---------+ +---------+ +---------+  |
  |  | AgentReg| |SwarmCoord| | Target  |  |
  |  | Contract| | Contract | | Protocol|  |
  |  +---------+ +---------+ +---------+  |
  +---------------------------------------+
                   |
                   v
  +---------------------------------------+
  |      Dashboard (React dev server)     |
  |  localhost:5173 -> polls RPC         |
  +---------------------------------------+

  All running on single laptop for hackathon demo

---

## 8. Monad-Specific Design Decisions

### Why Not Ethereum?

| Factor | Ethereum | Monad | Impact on SwarmGuard |
|--------|----------|-------|----------------------|
| Block time | 12s | 400ms | Verdicts settle 30x faster |
| Finality | ~15 min | 800ms | Actions trigger in <1s |
| TPS | ~15 | 10,000 | 100+ agents can submit concurrently |
| Gas cost | $1-50/tx | ~$0 | Swarm monitoring is economically viable |
| EVM compat | Yes | Yes | Same Solidity code, same tooling |

### Why Not an L2?

L2s have fast execution but centralized sequencers. A single sequencer can censor agent verdicts or reorder transactions. Monad is an L1 with decentralized consensus (MonadBFT) — no single point of censorship.

### MonadDB Relevance

MonadDB is the custom storage layer that enables Monad's throughput. While agents don't interact with it directly, it makes the economics work:
- Sequential writes on SSDs = efficient state updates
- Async I/O = agents can read state without blocking
- Patricia Trie native = fast Merkle proofs for verdict verification

---

## 9. Integration Points

### 9.1 External APIs

| Service | Purpose | Endpoint | Auth |
|---------|---------|----------|------|
| Monad RPC | Read blockchain state, submit transactions | https://rpc.testnet.monad.xyz | None (testnet) |
| Chainlink Price Feeds | Oracle price data | On-chain contract | None (public) |
| Binance / Coinbase API | CEX reference prices | REST API | API key (optional) |
| DEX Subgraph / API | TVL, reserve data | GraphQL / REST | None (public) |

### 9.2 On-Chain Contracts

| Contract | Address (Testnet) | Purpose |
|----------|------------------|---------|
| AgentRegistry | TBD after deploy | Agent identity + reputation |
| SwarmCoordinator | TBD after deploy | Verdict collection + consensus |
| Target Protocol | TBD (demo contract) | Contract being monitored |

---

## 10. Future Architecture (Post-Hackathon)

Production Vision:

  +--------+ +--------+ +--------+ +--------+
  | Bridge | | Wallet | |Governance| | MEV   |
  |Guardian| |Profiler| | Monitor | |Detector|
  +--------+ +--------+ +--------+ +--------+

  +---------------------------------------+
  |     SwarmConsensus (multi-protocol)   |
  |  - Reputation-weighted voting         |
  |  - ZK-proof verification              |
  |  - Cross-chain message passing        |
  +---------------------------------------+

  +---------------------------------------+
  |      Insurance Integration            |
  |  - Auto-payout when swarm prevents    |
  |  - Premium based on coverage        |
  +---------------------------------------+

  +---------------------------------------+
  |         DAO Governance                |
  |  - Parameter changes                  |
  |  - Dispute resolution                 |
  |  - Treasury management                |
  +---------------------------------------+

---

*Document version: 1.0*
*Last updated: June 20, 2026*
