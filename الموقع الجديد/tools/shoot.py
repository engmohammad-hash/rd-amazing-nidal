"""Screenshots of a page in headless Edge, the way a visitor scrolls it: one viewport at a time, stitched into
one tall image (scaled down) so the whole page can be looked over at once.

usage: python -I tools/shoot.py <url> <out.jpg> [--w=1440] [--h=900] [--mobile] [--theme=light|dark] [--scale=.5]
       [--js=<code to run first>] [--top-only]
"""
import json
import subprocess
import sys
import tempfile
import time
import urllib.request
from io import BytesIO
from base64 import b64decode
from pathlib import Path

import websocket
from PIL import Image

EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
PORT = 9337
args = [a for a in sys.argv[1:] if not a.startswith("--")]
opt = lambda name, default: next((a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith(f"--{name}=")), default)
url, out = args[0], Path(args[1])
W, H, mobile, theme, scale = int(opt("w", 1440)), int(opt("h", 900)), "--mobile" in sys.argv, opt("theme", "light"), float(opt("scale", .5))
dpr = 2 if mobile else 1

edge = subprocess.Popen([
    EDGE, "--headless=new", "--no-first-run", "--disable-extensions", "--hide-scrollbars", "--autoplay-policy=no-user-gesture-required",
    f"--user-data-dir={Path(tempfile.gettempdir()) / 'rd-shoot-profile'}", f"--remote-debugging-port={PORT}", "about:blank",
])
try:
    for _ in range(50):
        try:
            tabs = json.load(urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json", timeout=2))
            page = next(t for t in tabs if t.get("type") == "page")
            break
        except Exception:
            time.sleep(.3)
    ws = websocket.create_connection(page["webSocketDebuggerUrl"], timeout=60)
    seq = 0

    def cdp(method, **params):
        global seq
        seq += 1
        ws.send(json.dumps({"id": seq, "method": method, "params": params}))
        while True:
            msg = json.loads(ws.recv())
            if msg.get("id") == seq:
                return msg.get("result", {})

    def js(expr):
        return cdp("Runtime.evaluate", expression=expr, returnByValue=True, awaitPromise=True).get("result", {}).get("value")

    cdp("Emulation.setDeviceMetricsOverride", width=W, height=H, deviceScaleFactor=dpr, mobile=mobile)
    if mobile:
        cdp("Emulation.setTouchEmulationEnabled", enabled=True)
    cdp("Emulation.setEmulatedMedia", features=[{"name": "prefers-color-scheme", "value": theme}])
    cdp("Page.enable")
    cdp("Page.navigate", url=url)
    time.sleep(1)
    js(f"try {{ localStorage.setItem('theme', '{theme}'); }} catch (e) {{}}")
    cdp("Page.reload", ignoreCache=True)
    time.sleep(4)
    total = js("document.documentElement.scrollHeight")
    info = js("({sheets: [...document.styleSheets].map(s => s.href + ':' + (s.cssRules ? s.cssRules.length : 'x')), bg: getComputedStyle(document.body).backgroundColor, video: (v => v && {src: v.currentSrc, playing: v.classList.contains('playing'), t: v.currentTime})(document.querySelector('.hero-video')), big: [...document.querySelectorAll('body *')].map(e => [e, e.getBoundingClientRect()]).filter(([e, r]) => r.height > 2000).slice(0, 12).map(([e, r]) => e.tagName + '.' + String(e.getAttribute('class')).slice(0, 30) + ' ' + Math.round(r.height) + 'x' + Math.round(r.width))})")
    print("page height", total, "info", info, flush=True)
    if total > 20000:
        raise SystemExit("page far too tall, stopping")
    before = opt("js", "")   # e.g. open the cart before the pictures are taken
    if before:
        js(before)
        time.sleep(1.2)
    shots, y = [], 0
    while True:
        js(f"window.scrollTo({{top: {y}, behavior: 'instant'}})")
        time.sleep(1.6)   # long enough for things to rise into place
        img = Image.open(BytesIO(b64decode(cdp("Page.captureScreenshot", format="png")["data"]))).convert("RGB")
        shots.append(img)
        img.resize((int(img.width * scale * 1.4), int(img.height * scale * 1.4)), Image.LANCZOS).save(out.with_name(f"{out.stem}-{len(shots):02d}.jpg"), "JPEG", quality=84)
        if len(shots) == 1:   # later shots without the sticky header, so the stitched page reads cleanly
            js("document.head.insertAdjacentHTML('beforeend', '<style>.hdr{position:relative!important}</style>')")
            total = js("document.documentElement.scrollHeight")
        if y + H >= total or "--top-only" in sys.argv:
            break
        y = min(y + H, total - H)
    last_overlap = (len(shots) - 1) * H - (total - H) if len(shots) > 1 else 0
    full = Image.new("RGB", (W * dpr, total * dpr), "white")
    for i, img in enumerate(shots):
        top = (i * H if i < len(shots) - 1 else total - H) * dpr
        full.paste(img, (0, top))
    full = full.resize((int(W * dpr * scale), int(total * dpr * scale)), Image.LANCZOS)
    out.parent.mkdir(parents=True, exist_ok=True)
    full.save(out, "JPEG", quality=82)
    shots[0].save(out.with_name(out.stem + "-top.jpg"), "JPEG", quality=88)
    print("saved", out, full.size, flush=True)
finally:
    subprocess.run(["taskkill", "/F", "/T", "/PID", str(edge.pid)], capture_output=True)
