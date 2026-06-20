"""
Wallet Profiler Agent

Signal shape:
  {
    "wallet_address": "0x...",
    "wallet_age_days": number,
    "transaction_amount": number,
    "wallet_history_summary": "string"
  }

Run standalone:
  python agents/wallet_agent.py

Or launched via run_agents.py.
"""

from agents.base_agent import BaseAgent

SIGNAL_TYPE = "wallet"

SYSTEM_PROMPT = (
    "You are the Wallet Profiler agent in SwarmGuard, an autonomous DeFi vault security system. "
    "Your only job is to evaluate whether a wallet making a transaction looks suspicious based on "
    "its age and transaction size — for example, a brand-new wallet suddenly moving a very large "
    "amount is a common attacker pattern, while an old, established wallet doing the same is normal. "
    "You will receive a JSON snapshot of a wallet's profile and transaction. "
    "Respond with ONLY valid JSON in this exact format, nothing else: "
    '{"is_attack": true or false, "confidence": a number between 0 and 1, '
    '"reasoning": "one or two plain-English sentences explaining your verdict"}.'
)


class WalletAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="WalletProfiler",
            private_key_env="WALLET_AGENT_PRIVATE_KEY",
        )

    def run(self):
        self.run_loop(SIGNAL_TYPE, SYSTEM_PROMPT)


if __name__ == "__main__":
    WalletAgent().run()
