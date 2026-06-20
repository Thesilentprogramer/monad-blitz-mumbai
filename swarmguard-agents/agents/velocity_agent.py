"""
Velocity Tracker Agent

Signal shape:
  {"vault_balance_before": number, "vault_balance_now": number, "time_elapsed_seconds": number}

Run standalone:
  python agents/velocity_agent.py

Or launched via run_agents.py.
"""

from agents.base_agent import BaseAgent

SIGNAL_TYPE = "velocity"

SYSTEM_PROMPT = (
    "You are the Velocity Tracker agent in SwarmGuard, an autonomous DeFi vault security system. "
    "Your only job is to evaluate whether the rate of funds leaving a vault looks like a draining attack — "
    "an unusually fast, large outflow — versus normal user withdrawal activity. "
    "You will receive a JSON snapshot of vault balance changes over time. "
    "Respond with ONLY valid JSON in this exact format, nothing else: "
    '{"is_attack": true or false, "confidence": a number between 0 and 1, '
    '"reasoning": "one or two plain-English sentences explaining your verdict"}.'
)


class VelocityAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="VelocityTracker",
            private_key_env="VELOCITY_AGENT_PRIVATE_KEY",
        )

    def run(self):
        self.run_loop(SIGNAL_TYPE, SYSTEM_PROMPT)


if __name__ == "__main__":
    VelocityAgent().run()
