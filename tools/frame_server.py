"""Local server for rendering the story frames.

Serves the repo so tools/render.html can load, and saves each POST /save/<set>/<NNN>.webp
into demo/frames/<set>/. Run from the repo root:  python tools/frame_server.py
then open http://localhost:8766/tools/render.html
"""
import re
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FRAMES = ROOT / "demo" / "frames"
SAVE = re.compile(r"^/save/(desktop|mobile)/(\d{3})\.webp$")


class Handler(SimpleHTTPRequestHandler):
    def do_POST(self):
        m = SAVE.match(self.path)
        if not m:
            self.send_error(404, "unknown save path")
            return
        body = self.rfile.read(int(self.headers.get("Content-Length", 0)))
        out = FRAMES / m.group(1)
        out.mkdir(parents=True, exist_ok=True)
        (out / f"{m.group(2)}.webp").write_bytes(body)
        self.send_response(204)
        self.end_headers()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", 8766), partial(Handler, directory=str(ROOT))).serve_forever()
