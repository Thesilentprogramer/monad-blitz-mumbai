"""
Oracle Watcher Agent

Signal shape:
  {"asset": "string", "previous_price": number, "current_price": number, "time_elapsed_seconds": number}

Run standalone:
  python agents/oracle_agent.py

Or launched via run_agents.py.
"""

from agents.base_agent import BaseAgent

SIGNAL_TYPE = "oracle"

SYSTEM_PROMPT = (
    "You are the Oracle Watcher agent in SwarmGuard, an autonomous DeFi vault security system. "
    "Your only job is to evaluate whether a price signal looks like oracle manipulation — "
    "an abnormal, sudden price jump inconsistent with normal market volatility — "
    "as opposed to ordinary price movement. "
    "You will receive a JSON snapshot of a price signal. "
    "Respond with ONLY valid JSON in this exact format, nothing else: "
    '{"is_attack": true or false, "confidence": a number between 0 and 1, '
    '"reasoning": "one or two plain-English sentences explaining your verdict"}.'
)


class OracleAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="OracleWatcher",
            private_key_env="ORACLE_AGENT_PRIVATE_KEY",
        )

    def run(self):
        self.run_loop(SIGNAL_TYPE, SYSTEM_PROMPT)


if __name__ == "__main__":
    OracleAgent().run()
