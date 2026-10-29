"""Render a background film with headless Edge, then encode it into the looping video the site plays.

Needs tools/serve.py running on port 8767.
usage: python -I tools/render_video.py [desktop] [mobile]   [--film=hero|reels-a|reels-b]   [--encode-only]

  hero      the gold-foil film drawn by src/video/render.html; goes straight into the site:
              src/static/video/hero-<set>.mp4 and .jpg (the first frame, shown until it plays), src/static/img/og.jpg
  reels-a   cut by src/video/reels.html from the shop's Instagram reels in their own style
  reels-b   cut by the same page: the shop's front and its work in a gold frame
            these two go to tools/out/review/ for the client to approve first

  tools/out/<film>/<set>/NNNN.jpg   the frames (not kept in git)
"""
import json
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

import imageio_ffmpeg
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
PORT = 9336
FPS = 30
STALL = 120
FILM = next((a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--film=")), "hero")
FRAMES = ROOT / "tools" / "out" / FILM
PAGE = "render.html?set={set}" if FILM == "hero" else f"reels.html?cut={FILM[-1]}&set={{set}}"
VIDEO = ROOT / "src" / "static" / "video" if FILM == "hero" else ROOT / "tools" / "out" / "review"
# quality per set: lower crf is sharper and heavier; real footage needs less detail kept than the drawn film
CRF = {"hero": {"desktop": 22, "mobile": 24}}.get(FILM, {"desktop": 24, "mobile": 25})


def page_title():
    try:
        tabs = json.load(urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json", timeout=3))
        return next((t["title"] for t in tabs if "/src/video/" in t.get("url", "")), "")
    except Exception:
        return ""


def render(set_name):
    profile = Path(tempfile.gettempdir()) / "rd-hero-profile"
    edge = subprocess.Popen([
        EDGE, "--headless=new", "--no-first-run", "--disable-extensions", "--disable-sync",
        "--disable-background-timer-throttling", "--disable-renderer-backgrounding",
        "--disable-backgrounding-occluded-windows", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required",
        f"--user-data-dir={profile}", f"--remote-debugging-port={PORT}", "--window-size=1200,1200",
        f"http://localhost:8767/src/video/{PAGE.format(set=set_name)}",
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
            title = "STALLED"
            break
    subprocess.run(["taskkill", "/F", "/T", "/PID", str(edge.pid)], capture_output=True)
    time.sleep(2)
    return title.startswith("ALL DONE")


def encode(set_name):
    VIDEO.mkdir(parents=True, exist_ok=True)
    src = FRAMES / set_name
    out = VIDEO / f"{FILM}-{set_name}.mp4"
    subprocess.run([
        imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", str(src / "%04d.jpg"),
        "-c:v", "libx264", "-preset", "slow", "-crf", str(CRF[set_name]), "-tune", "film",
        "-pix_fmt", "yuv420p", "-profile:v", "high", "-g", str(FPS * 2), "-movflags", "+faststart", "-an", str(out),
    ], check=True)
    first = Image.open(src / "0000.jpg").convert("RGB")
    first.save(VIDEO / f"{FILM}-{set_name}.jpg", "JPEG", quality=80, optimize=True, progressive=True)
    if FILM == "hero" and set_name == "desktop":
        first.resize((1200, 675), Image.LANCZOS).save(ROOT / "src" / "static" / "img" / "og.jpg", "JPEG", quality=84, optimize=True)
    print(f"   {out.name}: {out.stat().st_size / 1048576:.2f} MB", flush=True)


sets = [a for a in sys.argv[1:] if not a.startswith("--")] or ["desktop", "mobile"]
for s in sets:
    print(FILM, s, flush=True)
    if "--encode-only" in sys.argv or render(s):
        encode(s)
    else:
        print(FILM, s, "FAILED", flush=True)
