"""Run the scrolling speed test (tools/bench.js) in a real, visible Edge window.

Every run starts with an empty browser cache, like a first-time visitor, but reuses one Edge profile
(a brand-new profile spends its first minute on setup work that skews the result).
The result is read from the page title through Edge's debugging port and printed.

usage: python tools/run_bench.py [runs] [url]
       url defaults to the local copy (needs tools/frame_server.py on port 8766);
       pass https://engmohammad-hash.github.io/rd-amazing-nidal/ to test the live site.
"""
import json
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
PORT = 9334
runs = int(sys.argv[1]) if len(sys.argv) > 1 else 1
url = (sys.argv[2] if len(sys.argv) > 2 else "http://localhost:8766/demo/local.html").split("#")[0] + "#bench"

profile = Path(tempfile.gettempdir()) / "rd-bench-profile"
for run in range(runs):
    cache = Path(tempfile.mkdtemp(prefix="rd-bench-cache-"))
    sep = "&" if "?" in url.split("#")[0] else "?"
    page = url.replace("#bench", f"{sep}run={int(time.time())}#bench")
    edge = subprocess.Popen([
        EDGE, "--no-first-run", "--no-default-browser-check", "--disable-extensions", "--disable-sync",
        "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding",
        "--disable-background-timer-throttling", f"--user-data-dir={profile}", f"--disk-cache-dir={cache}",
        f"--remote-debugging-port={PORT}", "--start-maximized", f"--app={page}",
    ])
    result = None
    deadline = time.time() + 150
    while time.time() < deadline and result is None:
        time.sleep(2)
        try:
            tabs = json.load(urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json", timeout=3))
        except Exception:
            continue
        for t in tabs:
            if t.get("title", "").startswith("BENCH DONE "):
                result = t["title"][len("BENCH DONE "):]
    subprocess.run(["taskkill", "/F", "/T", "/PID", str(edge.pid)], capture_output=True)
    time.sleep(3)
    shutil.rmtree(cache, ignore_errors=True)
    print(f"run {run + 1} ->", result or "no result (timed out)", flush=True)
