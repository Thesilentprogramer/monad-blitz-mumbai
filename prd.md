# SwarmGuard — Product Requirements Document

> **Status:** Draft for Monad Blitz hackathon build
> **Build window:** 5 hours
> **Companion docs:** `development.md` (architecture/stack), `phases.md` (hour-by-hour execution)

---

## 1. Summary

SwarmGuard is a decentralized swarm of specialized AI agents that monitors on-chain financial activity for attack patterns, reaches consensus on threat verdicts entirely on-chain, and triggers automatic protective action — without a human in the loop for first response.

The system is designed as **open infrastructure**: any agent operator can run an agent and stake into the swarm, and any protocol can register to be monitored. For the hackathon build, this is demonstrated end-to-end against **one mock DeFi protocol** so the architecture is provably real, not just diagrammed.

---

## 2. Problem Statement

DeFi protocols have lost over $3B to exploits — flashloan attacks, oracle manipulation, liquidity drains. Today's defenses fall into two camps, both broken in their own way:

- **Centralized monitoring** (one team, one dashboard) — a single point of failure, and slow: human review takes minutes to hours, long after an exploit completes.
- **No real-time on-chain response** — even when an anomaly is caught, most "fixes" happen off-chain (a tweet, a pause vote) faster than the actual money moves.

The gap isn't detection — plenty of tools detect anomalies. The gap is **trustless, sub-second, on-chain consensus that triggers action before a human could read an alert.**

---

## 3. Goals

| Goal | Why it matters |
|---|---|
| Verdicts are decentralized — no single agent can trigger action alone | Removes single point of failure; the swarm decides, not one entity |
| Verdicts are immutable and on-chain | Anyone can audit what was detected, when, and by whom — trustless by design |
| Consensus-to-action happens in seconds, not minutes | The entire point — speed is what existing tools can't offer |
| The system works for any registered protocol, not just one hardcoded target | This is what makes it infrastructure rather than a single app |
| Demo proves the mechanism live, with real on-chain transactions | A diagram of "how it could work" is not credible; a live consensus vote is |

### Non-goals (explicitly out of scope for v1)

- Reputation-weighted voting (v1 uses equal-weight votes per agent)
- Slashing / economic penalties for wrong verdicts
- Real mempool monitoring against live mainnet traffic
- Cross-protocol monitoring in a single demo run (architecture supports it; demo shows one protocol)
- Mobile alerts, cross-chain bridges, ML-based anomaly models (all roadmap, not v1)

---

## 4. Target Users

SwarmGuard is built as **open infrastructure** — the registry and coordinator are designed so that:

- **Any protocol** can register itself for monitoring and set its own consensus threshold
- **Any agent operator** can run a specialized agent and participate in the swarm

This is a deliberate choice: the system is not scoped to one customer type (e.g. "DeFi teams only") because the consensus mechanism itself is generic — it works on any signal that can be expressed as a verdict with evidence. Future-facing user types include protocol teams, independent security researchers running agents for reward, and eventually consumer-facing products (wallets, insurance) that subscribe to the swarm's verdicts.

**For v1, this generality is proven, not assumed** — by registering one concrete mock protocol and running a real attack simulation against it end-to-end on Monad testnet. The hackathon demo is the evidence that the infrastructure claim is real.

---

## 5. Core User Stories

| As a... | I want to... | So that... |
|---|---|---|
| Protocol (registered contract) | be monitored by independent agents without running my own security team | I get fast threat detection without centralizing trust in one party |
| Agent operator | run a specialized detection agent and submit verdicts on-chain | my detection work is auditable and contributes to a trustless consensus |
| Anyone observing the system | verify, after the fact, exactly which agents flagged what and when | I don't have to trust a black box — every verdict is on Monad explorer |
| Demo viewer / judge | watch a real attack get detected and stopped in seconds, live | I believe this works because I saw it happen, not because I was told |

---

## 6. Functional Requirements

### 6.1 Agent Registry (`AgentRegistry.sol`)
- `registerAgent(address, metadata)` — any wallet can register as an agent
- Stores a basic reputation counter per agent (display-only in v1, not weighted into consensus)
- Exit condition: 3 agents can register on Monad testnet

### 6.2 Swarm Coordinator (`SwarmCoordinator.sol`)
- `submitVerdict(protocolId, threatLevel, evidence)` — any registered agent can submit a verdict for a registered protocol
- Tallies votes per protocol against a configurable `CONSENSUS_THRESHOLD`
- `triggerAction()` — once threshold is met, flips protocol state (e.g. `paused = true`) automatically
- Exit condition: submitting verdicts from 3 agents reaches threshold and triggers a real state change on-chain

### 6.3 Agent Swarm (Python)
- **Flashloan agent** — detects abnormally large same-block borrows
- **Oracle agent** — compares two price sources, flags deviation past a threshold
- **Liquidity agent** — tracks TVL, flags sudden drops
- Each agent independently fetches data, runs detection logic, and signs + submits its own verdict transaction
- Exit condition: each of the 3 agents can independently detect and submit a verdict without depending on another agent's output

### 6.4 Attack Simulator
- Scripted scenario injecting mock malicious data into the monitored protocol's signals
- Triggers agent detection in a predictable, demo-able sequence
- Exit condition: running the simulator causes real verdicts to land on-chain, in order, leading to a real consensus action

### 6.5 Dashboard
- Live agent status (green/yellow/red) per agent
- Protocol status banner (ACTIVE / PAUSED)
- Real-time event log of on-chain verdicts
- "Simulate Attack" control
- Link out to Monad explorer for every transaction shown
- Exit condition: dashboard visibly updates within ~2 seconds of an on-chain state change, with zero manual refresh

---

## 7. Success Criteria

**For the hackathon submission, SwarmGuard succeeds if:**

1. All on-chain actions in the demo are real transactions on Monad testnet — no mocked blockchain calls
2. The full sequence (simulate attack → 3 agents detect independently → consensus reached → protocol auto-pauses → dashboard reflects it) completes in under 2 minutes with zero manual intervention
3. Every transaction shown in the demo is independently verifiable on Monad explorer, live, if a judge asks to check
4. The demo can be run twice in a row without failure (per `phases.md` Phase 5 exit condition)
5. The "why Monad" claim is concrete and falsifiable — a real gas-cost comparison, not an assertion

**This explicitly does not require:** reputation weighting, slashing, multi-protocol support live in the demo, or production-grade mempool integration. Those are correctly scoped as roadmap (see `development.md`).

---

## 8. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Multi-contract or multi-agent system breaks under time pressure | `phases.md` defines a fallback cut at every phase boundary — drop scope, never extend the clock |
| LLM calls (OpenAI) are slow/rate-limited live | Rule-based detection thresholds as the demo-path fallback; LLM path kept in code, disclosed honestly if asked |
| "General infrastructure" framing reads as vague to judges | Demo proves it against one concrete protocol — generality is asserted in the pitch, evidenced in the demo |
| Judges ask "why not just monitor this off-chain and alert a human" | Answer is speed + trustlessness: on-chain consensus is auditable by anyone and fast enough to act before the exploit completes — off-chain alerting can't make either claim |

---

## 9. Out of Scope / Roadmap

See `development.md` → **Roadmap** section for the full prioritized list (reputation-weighted consensus, slashing, real mempool integration, WebSocket dashboard updates, additional agent types, cross-protocol monitoring, insurance auto-payout integration).

---

## 10. Open Questions

- What is the actual first paying or registering protocol post-hackathon, if this continues past the event? "General infrastructure" is the right v1 framing, but a real second user is what would validate the registry design beyond the demo.
- Does reputation eventually weight consensus, or stay equal-weight permanently? Affects whether `AgentRegistry`'s reputation field is cosmetic or load-bearing long-term.

---

*Companion files: `development.md` (architecture, stack, demo script), `phases.md` (5-hour execution checklist).*