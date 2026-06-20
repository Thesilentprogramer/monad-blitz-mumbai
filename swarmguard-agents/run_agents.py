"""
Launch the status server + all 4 SwarmGuard agents.

Usage:
  python run_agents.py

Starts status_server.py on port 8001 as a subprocess, then launches the
4 agents in parallel threads. The dashboard polls port 8001 for live
reasoning text alongside on-chain state from Monad.
"""

import subprocess
import sys
import threading
import time
from pathlib import Path

from agents.flashloan_agent import FlashloanAgent
from agents.oracle_agent import OracleAgent
from agents.velocity_agent import VelocityAgent
from agents.wallet_agent import WalletAgent

BANNER = """
╔══════════════════════════════════════════════════════════════╗
║              SwarmGuard — Agent Swarm Starting               ║
║  4 independent AI agents + status server                     ║
║  Network: Monad Testnet (Chain ID 10143)                     ║
║  Status server: http://localhost:8001                        ║
╚══════════════════════════════════════════════════════════════╝
"""


def launch_agent(agent_class):
    try:
        agent = agent_class()
        agent.run()
    except Exception as exc:
        print(f"[FATAL] {agent_class.__name__} crashed: {exc}", file=sys.stderr, flush=True)


def start_status_server() -> subprocess.Popen | None:
    script = Path(__file__).parent / "status_server.py"
    try:
        proc = subprocess.Popen([sys.executable, str(script)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(1.2)  # give uvicorn a moment to bind
        print("Status server started on http://localhost:8001", flush=True)
        return proc
    except Exception as exc:
        print(f"[WARN] Could not start status server: {exc}", flush=True)
        return None


def main():
    print(BANNER, flush=True)

    status_proc = start_status_server()

    agent_classes = [FlashloanAgent, OracleAgent, VelocityAgent, WalletAgent]
    threads = []

    for cls in agent_classes:
        t = threading.Thread(target=launch_agent, args=(cls,), daemon=True, name=cls.__name__)
        t.start()
        threads.append(t)
        time.sleep(0.3)  # stagger startup to avoid log interleaving at init

    print(f"All {len(threads)} agents running. Ctrl+C to stop.\n", flush=True)

    try:
        while True:
            time.sleep(1)
            # Restart any thread that died unexpectedly
            for i, t in enumerate(threads):
                if not t.is_alive():
                    cls = agent_classes[i]
                    print(f"[WARN] {cls.__name__} thread died — restarting ...", flush=True)
                    new_t = threading.Thread(
                        target=launch_agent, args=(cls,), daemon=True, name=cls.__name__
                    )
                    new_t.start()
                    threads[i] = new_t
    except KeyboardInterrupt:
        print("\nShutting down agents.", flush=True)
        if status_proc:
            status_proc.terminate()


if __name__ == "__main__":
    main()
