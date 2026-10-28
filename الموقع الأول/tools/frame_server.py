"""Local server for rendering scenes and for testing the site.

Serves the repo. src/render.html posts what it renders here:
  POST /save/<scene>/<desktop|mobile>/<NNN>.jpg   -> docs/frames/<scene>/<set>/NNN.jpg
  POST /save-still/<scene>/<NN>.jpg               -> docs/gallery/<scene>/NN.jpg
tools/bench.js posts speed-test results to POST /bench (appended to tools/bench.log).

Run from the repo root:  python tools/frame_server.py
then open http://localhost:8766/src/render.html?scene=story
Imitate a slow connection with FRAME_SERVER_KBPS (shared bandwidth, e.g. 130) and
FRAME_SERVER_RTT_MS (wait before each response, e.g. 300); only film frames are slowed.
"""
import os
import re
import threading
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
SAVE_FRAME = re.compile(r"^/save/([a-z-]+)/(desktop|mobile)/(\d{3})\.jpg$")
SAVE_STILL = re.compile(r"^/save-still/([a-z-]+)/(\d{2})\.jpg$")
KBPS = float(os.environ.get("FRAME_SERVER_KBPS", "0"))
RTT = float(os.environ.get("FRAME_SERVER_RTT_MS", "0")) / 1000
PIPE = threading.Lock()


class Handler(SimpleHTTPRequestHandler):
    def copyfile(self, source, outputfile):
        if "/frames/" not in self.path:
            return super().copyfile(source, outputfile)
        if RTT:
            time.sleep(RTT)
        if not KBPS:
            return super().copyfile(source, outputfile)
        data = source.read()
        with PIPE:
            time.sleep(len(data) / (KBPS * 1024))
        outputfile.write(data)

    def do_POST(self):
        body = self.rfile.read(int(self.headers.get("Content-Length", 0)))
        if self.path == "/bench":
            with open(ROOT / "tools" / "bench.log", "ab") as log:
                log.write(body + b"\n")
        elif m := SAVE_FRAME.match(self.path):
            out = DOCS / "frames" / m.group(1) / m.group(2)
            out.mkdir(parents=True, exist_ok=True)
            (out / f"{m.group(3)}.jpg").write_bytes(body)
        elif m := SAVE_STILL.match(self.path):
            out = DOCS / "gallery" / m.group(1)
            out.mkdir(parents=True, exist_ok=True)
            (out / f"{m.group(2)}.jpg").write_bytes(body)
        else:
            self.send_error(404, "unknown save path")
            return
        self.send_response(204)
        self.end_headers()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *args):
        pass


class Server(ThreadingHTTPServer):
    # the default backlog of 5 overflows when a browser test and a render share the server
    request_queue_size = 128


if __name__ == "__main__":
    Server(("127.0.0.1", 8766), partial(Handler, directory=str(ROOT))).serve_forever()
