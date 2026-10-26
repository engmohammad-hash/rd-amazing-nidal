"""Run the scrolling speed test (tools/bench.js) in a real, visible Edge window.

Needs tools/frame_server.py running on port 8766. Each run appends one line of results to tools/bench.log.
usage: python tools/run_bench.py [runs]
"""
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LOG = ROOT / "tools" / "bench.log"
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

# one profile for every run: a brand-new Edge profile spends its first minute on setup work that
# competes with the page, which a visitor's everyday browser does not do
profile = str(Path(tempfile.gettempdir()) / "rd-bench-profile")

for run in range(int(sys.argv[1]) if len(sys.argv) > 1 else 1):
    before = LOG.read_text(encoding="utf-8").count("\n") if LOG.exists() else 0
    edge = subprocess.Popen([
        EDGE, "--no-first-run", "--no-default-browser-check", "--disable-extensions", "--disable-sync",
        "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding",
        "--disable-background-timer-throttling", f"--user-data-dir={profile}", "--start-maximized",
        "--app=http://localhost:8766/demo/local.html#bench",
    ])
    deadline = time.time() + 120
    while time.time() < deadline:
        time.sleep(2)
        if LOG.exists() and LOG.read_text(encoding="utf-8").count("\n") > before:
            break
    subprocess.run(["taskkill", "/F", "/T", "/PID", str(edge.pid)], capture_output=True)
    time.sleep(2)
    lines = LOG.read_text(encoding="utf-8").splitlines() if LOG.exists() else []
    print(f"run {run + 1} ->", lines[-1] if len(lines) > before else "no result (timed out)", flush=True)
