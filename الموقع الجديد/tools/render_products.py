"""Render the product pictures in headless Edge, then cut each one's 720 x 540 thumbnail.

Needs tools/serve.py running on port 8767 (it files what src/products/render.html posts).
usage: python -I tools/render_products.py [kind,kind,... | all] [--only=N] [--thumbs]
       --thumbs only remakes the thumbnails
"""
import json
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PRODUCTS = ROOT / "src" / "static" / "img" / "products"
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
PORT = 9338
STALL = 150   # seconds without progress before a run is abandoned

args = [a for a in sys.argv[1:] if not a.startswith("--")]
opt = lambda name, default: next((a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith(f"--{name}=")), default)


def title():
    try:
        tabs = json.load(urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json", timeout=3))
        return next((t["title"] for t in tabs if "render.html" in t.get("url", "")), "")
    except Exception:
        return ""


def render(kinds):
    only = opt("only", "")
    url = f"http://localhost:8767/src/products/render.html?kinds={kinds}" + (f"&only={only}" if only else "")
    edge = subprocess.Popen([
        EDGE, "--headless=new", "--no-first-run", "--disable-extensions", "--disable-sync",
        "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows",
        "--ignore-gpu-blocklist", f"--user-data-dir={Path(tempfile.gettempdir()) / 'rd-products-profile'}",
        f"--remote-debugging-port={PORT}", "--window-size=1700,1400", url,
    ])
    last, moved = "", time.time()
    try:
        while True:
            time.sleep(2)
            t = title()
            if t and t != last:
                print("  ", t, flush=True)
                last, moved = t, time.time()
            if t.startswith(("ALL DONE", "FAILED")):
                return t.startswith("ALL DONE")
            if time.time() - moved > STALL:
                print("   stalled", flush=True)
                return False
    finally:
        subprocess.run(["taskkill", "/F", "/T", "/PID", str(edge.pid)], capture_output=True)
        time.sleep(1.5)


def thumbs():
    n = 0
    for f in sorted(PRODUCTS.glob("*-[0-9][0-9].jpg")):
        t = f.with_name(f.stem + "-thumb.jpg")
        if t.exists() and t.stat().st_mtime >= f.stat().st_mtime:
            continue
        im = Image.open(f).convert("RGB")
        im.thumbnail((720, 540), Image.LANCZOS)
        im.save(t, "JPEG", quality=82, optimize=True, progressive=True)
        n += 1
    print(n, "thumbnails made")


if __name__ == "__main__":
    ok = True
    if "--thumbs" not in sys.argv:
        ok = render(args[0] if args else "all")
    thumbs()
    sys.exit(0 if ok else 1)
