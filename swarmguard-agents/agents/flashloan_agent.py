"""
Flashloan Detector Agent

Signal shape:
  {"loan_amount": number, "repaid_within_same_tx": bool, "borrower_address": "0x..."}

Run standalone:
  python agents/flashloan_agent.py

Or launched via run_agents.py.
"""

from agents.base_agent import BaseAgent

SIGNAL_TYPE = "flashloan"

SYSTEM_PROMPT = (
    "You are the Flashloan Detector agent in SwarmGuard, an autonomous DeFi vault security system. "
    "Your only job is to evaluate whether a transaction signal looks like a flashloan exploit — "
    "an attacker borrowing a very large amount of an asset and repaying it within the same transaction, "
    "typically to manipulate prices or drain a vault before repayment. "
    "You will receive a JSON snapshot of a transaction signal. "
    "Respond with ONLY valid JSON in this exact format, nothing else: "
    '{"is_attack": true or false, "confidence": a number between 0 and 1, '
    '"reasoning": "one or two plain-English sentences explaining your verdict"}.'
)


class FlashloanAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="FlashloanDetector",
            private_key_env="FLASHLOAN_AGENT_PRIVATE_KEY",
        )

    def run(self):
        self.run_loop(SIGNAL_TYPE, SYSTEM_PROMPT)


if __name__ == "__main__":
    FlashloanAgent().run()
