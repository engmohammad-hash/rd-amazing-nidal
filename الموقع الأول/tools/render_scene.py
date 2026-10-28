"""Render scenes headlessly with Edge, then build the small sheets and gallery thumbnails.

Needs tools/frame_server.py running on port 8766.
usage: python tools/render_scene.py story cards incense ...   [--what film|stills|both]
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
DOCS = ROOT / "docs"
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
PORT = 9335
TILES = {"desktop": (288, 162), "mobile": (162, 324)}

args = [a for a in sys.argv[1:] if not a.startswith("--")]
opt = lambda name, default: next((a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith(f"--{name}=")), default)
what, sample, only = opt("what", "both"), opt("sample", ""), opt("set", "")


def page_title():
    try:
        tabs = json.load(urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json", timeout=3))
        return next((t["title"] for t in tabs if "render.html" in t.get("url", "")), "")
    except Exception:
        return ""


STALL = 120   # seconds without progress before a render is abandoned and started again


def render_once(scene):
    profile = Path(tempfile.gettempdir()) / "rd-render-profile"
    edge = subprocess.Popen([
        EDGE, "--headless=new", "--no-first-run", "--disable-extensions", "--disable-sync",
        "--disable-background-timer-throttling", "--disable-renderer-backgrounding",
        "--disable-backgrounding-occluded-windows", "--ignore-gpu-blocklist",
        f"--user-data-dir={profile}", f"--remote-debugging-port={PORT}", "--window-size=1700,1700",
        f"http://localhost:8766/src/render.html?scene={scene}&what={what}&sample={sample}&set={only}",
    ])
    title, last, moved = "", "", time.time()
    while True:
        time.sleep(3)
        title = page_title()
        if title != last and title:
            print("  ", title, flush=True)
            last, moved = title, time.time()
        if title.startswith(("ALL DONE", "FAILED")):
            break
        if time.time() - moved > STALL:
            print("   stalled", flush=True)
            title = "STALLED"
            break
    subprocess.run(["taskkill", "/F", "/T", "/PID", str(edge.pid)], capture_output=True)
    time.sleep(3)
    return title


def render(scene):
    # a failed or stalled run starts over once; frames are overwritten in place
    for attempt in (1, 2):
        title = render_once(scene)
        if title.startswith("ALL DONE"):
            return True
        if attempt == 1:
            print("   trying again", flush=True)
    return False


def sheets(scene):
    # four sheets per device: sheet n holds frames n, n+4, n+8 ... in a 10-column grid
    for name, (tw, th) in TILES.items():
        frames = sorted((DOCS / "frames" / scene / name).glob("*.jpg"))
        if not frames:
            continue
        rows = -(-len(frames[0::4]) // 10)
        for n in range(4):
            sheet = Image.new("RGB", (tw * 10, th * rows))
            for k, f in enumerate(frames[n::4]):
                sheet.paste(Image.open(f).convert("RGB").resize((tw, th), Image.LANCZOS), ((k % 10) * tw, (k // 10) * th))
            sheet.save(DOCS / "frames" / scene / f"{name}-small-{n}.jpg", "JPEG", quality=62, optimize=True)


def thumbs(scene):
    for f in sorted((DOCS / "gallery" / scene).glob("[0-9][0-9].jpg")):
        im = Image.open(f).convert("RGB")
        im.thumbnail((720, 540), Image.LANCZOS)
        im.save(f.with_name(f.stem + "-thumb.jpg"), "JPEG", quality=82, optimize=True)


for scene in args:
    print(scene, flush=True)
    if render(scene):
        if not sample:
            sheets(scene)
        thumbs(scene)
        print(scene, "ok", flush=True)
    else:
        print(scene, "FAILED", flush=True)
