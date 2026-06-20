"""
SwarmGuard Status Server

Runs alongside the agents. Agents POST their verdicts here after each Claude
evaluation; the dashboard polls GET /status to display live reasoning text.

Start:
  python status_server.py

Endpoints:
  GET  /status          → latest report per agent (verdict, confidence, reasoning, tx_hash)
  POST /report          → agents call this internally
  POST /trigger-demo    → dashboard "Trigger Attack" button calls this
"""

import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

app = FastAPI(title="SwarmGuard Status Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store: agent_name → latest report dict
_reports: dict[str, dict] = {}


@app.get("/", response_class=HTMLResponse)
async def get_dashboard():
    dashboard_path = Path(__file__).parent.parent / "swarmguard_dashboard.html"
    try:
        with open(dashboard_path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        return f"<h3>Error loading dashboard: {e}</h3>"


@app.post("/report")
async def receive_report(request: Request):
    payload = await request.json()
    agent = payload.get("agent", "unknown")
    _reports[agent] = {**payload, "received_at": datetime.now(timezone.utc).isoformat()}
    return {"ok": True}


@app.get("/status")
async def get_status():
    return {"agents": _reports}


@app.post("/trigger-demo")
async def trigger_demo():
    script = Path(__file__).parent / "simulate_attack.py"
    subprocess.Popen([sys.executable, str(script), "--mode", "attack"])
    return {"ok": True, "message": "Staggered attack demo triggered"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
