"""
Signal simulator for SwarmGuard demo.

Modes:
  --mode normal            Write benign signals every 15-20s (agents look alive)
  --mode attack            Staggered attack narrative (~20s total, all 4 types)
  --mode demo              Normal signals for N seconds, then staggered attack

Attack narrative sequence:
  T+0s  Oracle Watcher   — suspicious price spike (early warning)
  T+5s  Wallet Profiler  — brand-new wallet, massive transaction
  T+10s Flashloan Detect — 12.5M same-block borrow/repay (3rd flag → auto-pause)
  T+15s Velocity Tracker — vault already frozen, drain attempt blocked

Usage:
  python simulate_attack.py --mode normal
  python simulate_attack.py --mode attack
  python simulate_attack.py --mode demo --attack-delay 60
"""

import argparse
import json
import random
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

SIGNALS_FILE = Path(__file__).parent / "signals.json"

# ---------------------------------------------------------------------------
# Signal factories
# ---------------------------------------------------------------------------

def _signal(signal_type: str, data: dict) -> dict:
    return {
        "signal_id": str(uuid.uuid4()),
        "type": signal_type,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": data,
    }


# --- Benign signals ---------------------------------------------------------

def benign_flashloan() -> dict:
    return _signal("flashloan", {
        "loan_amount": random.randint(1_000, 50_000),
        "repaid_within_same_tx": True,
        "borrower_address": "0xAbcD1234AbcD1234AbcD1234AbcD1234AbcD1234",
    })


def benign_oracle() -> dict:
    previous = random.uniform(1_800, 2_000)
    change_pct = random.uniform(-0.005, 0.005)
    return _signal("oracle", {
        "asset": "ETH",
        "previous_price": round(previous, 2),
        "current_price": round(previous * (1 + change_pct), 2),
        "time_elapsed_seconds": random.randint(30, 300),
    })


def benign_velocity() -> dict:
    before = random.randint(500_000, 1_000_000)
    withdrawn = random.randint(500, 5_000)
    return _signal("velocity", {
        "vault_balance_before": before,
        "vault_balance_now": before - withdrawn,
        "time_elapsed_seconds": random.randint(60, 600),
    })


def benign_wallet() -> dict:
    return _signal("wallet", {
        "wallet_address": "0xABCDABCDABCDABCDABCDABCDABCDABCDABCDABCD",
        "wallet_age_days": random.randint(180, 1_500),
        "transaction_amount": random.randint(100, 5_000),
        "wallet_history_summary": (
            "Established wallet with 200+ transactions over 2 years. "
            "Regular DeFi user with varied activity across multiple protocols."
        ),
    })


# --- Attack signals ---------------------------------------------------------

def attack_oracle() -> dict:
    """T+0: First warning — abnormal price spike."""
    return _signal("oracle", {
        "asset": "ETH",
        "previous_price": 1_950.00,
        "current_price": 6_630.00,   # +240% in 2 seconds
        "time_elapsed_seconds": 2,
    })


def attack_wallet() -> dict:
    """T+5: Brand-new wallet moving $9.8M."""
    return _signal("wallet", {
        "wallet_address": "0xDeadDeadDeadDeadDeadDeadDeadDeadDeadDead",
        "wallet_age_days": 1,
        "transaction_amount": 9_800_000,
        "wallet_history_summary": (
            "Brand-new wallet created 22 hours ago. Only 1 prior transaction: "
            "a small ETH transfer from a mixer. No previous DeFi activity."
        ),
    })


def attack_flashloan() -> dict:
    """T+10: 12.5M flashloan same-block repay — 3rd flag triggers auto-pause."""
    return _signal("flashloan", {
        "loan_amount": 12_500_000,
        "repaid_within_same_tx": True,
        "borrower_address": "0xDeadBeefDeadBeefDeadBeefDeadBeefDeadBeef",
    })


def attack_velocity() -> dict:
    """T+15: Vault already frozen — drain attempt blocked."""
    return _signal("velocity", {
        "vault_balance_before": 800_000,
        "vault_balance_now": 12_000,        # 98.5% drained
        "time_elapsed_seconds": 3,
    })


# ---------------------------------------------------------------------------
# File helpers
# ---------------------------------------------------------------------------

def _read_signals() -> list:
    try:
        with open(SIGNALS_FILE) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def _append(signal: dict) -> None:
    signals = _read_signals()
    signals.append(signal)
    with open(SIGNALS_FILE, "w") as f:
        json.dump(signals, f, indent=2)
    ts = signal["timestamp"][11:19]
    sid = signal["signal_id"][:8]
    print(f"[{ts}] +{signal['type']:12s} signal [{sid}...]", flush=True)


# ---------------------------------------------------------------------------
# Modes
# ---------------------------------------------------------------------------

def mode_normal() -> None:
    print("Normal mode — benign signals every 15-20s. Ctrl+C to stop.\n")
    while True:
        for factory in [benign_oracle, benign_wallet, benign_flashloan, benign_velocity]:
            _append(factory())
        delay = random.randint(15, 20)
        print(f"  next batch in {delay}s ...\n", flush=True)
        time.sleep(delay)


def mode_attack() -> None:
    """Staggered narrative attack over ~20 seconds."""
    print("\n" + "="*60)
    print("  ATTACK SIMULATION — staggered narrative")
    print("="*60)

    print("\nT+0s  → OracleWatcher   — suspicious price spike (+240% in 2s)")
    _append(attack_oracle())

    time.sleep(5)
    print("\nT+5s  → WalletProfiler  — brand-new wallet moving $9.8M")
    _append(attack_wallet())

    time.sleep(5)
    print("\nT+10s → FlashloanDetect — 12.5M same-block borrow/repay (3rd flag → auto-pause)")
    _append(attack_flashloan())

    time.sleep(5)
    print("\nT+15s → VelocityTracker — vault already frozen, drain attempt blocked")
    _append(attack_velocity())

    print("\n" + "="*60)
    print("  Attack sequence complete. Watch agent console + dashboard.")
    print("="*60 + "\n")


def mode_demo(attack_delay: int) -> None:
    print(f"Demo mode — {attack_delay}s of normal signals, then staggered attack.\n")
    start = time.time()
    while time.time() - start < attack_delay:
        for factory in [benign_oracle, benign_wallet, benign_flashloan, benign_velocity]:
            _append(factory())
        remaining = attack_delay - (time.time() - start)
        delay = min(random.randint(15, 20), max(remaining, 0))
        if delay > 0:
            print(f"  next batch in {delay:.0f}s (attack in {remaining:.0f}s) ...\n", flush=True)
            time.sleep(delay)
    mode_attack()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="SwarmGuard signal simulator")
    parser.add_argument(
        "--mode",
        choices=["normal", "attack", "demo"],
        default="demo",
        help="Simulation mode (default: demo)",
    )
    parser.add_argument(
        "--attack-delay",
        type=int,
        default=60,
        metavar="SECONDS",
        help="Seconds of normal signals before attack (demo mode only, default: 60)",
    )
    args = parser.parse_args()

    if args.mode == "normal":
        mode_normal()
    elif args.mode == "attack":
        mode_attack()
    elif args.mode == "demo":
        mode_demo(args.attack_delay)


if __name__ == "__main__":
    main()
