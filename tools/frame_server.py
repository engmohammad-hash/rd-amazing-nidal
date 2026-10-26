"""Local server for rendering the story frames.

Serves the repo so tools/render.html can load, and saves each POST /save/<set>/<NNN>.jpg
into demo/frames/<set>/. Also takes POST /bench results from tools/bench.js into tools/bench.log.
Run from the repo root:  python tools/frame_server.py
then open http://localhost:8766/tools/render.html
"""
import re
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FRAMES = ROOT / "demo" / "frames"
SAVE = re.compile(r"^/save/(desktop|mobile)/(\d{3})\.jpg$")


class Handler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == "/bench":
            body = self.rfile.read(int(self.headers.get("Content-Length", 0)))
            with open(ROOT / "tools" / "bench.log", "ab") as log:
                log.write(body + b"\n")
            self.send_response(204)
            self.end_headers()
            return
        m = SAVE.match(self.path)
        if not m:
            self.send_error(404, "unknown save path")
            return
        body = self.rfile.read(int(self.headers.get("Content-Length", 0)))
        out = FRAMES / m.group(1)
        out.mkdir(parents=True, exist_ok=True)
        (out / f"{m.group(2)}.jpg").write_bytes(body)
        self.send_response(204)
        self.end_headers()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", 8766), partial(Handler, directory=str(ROOT))).serve_forever()
