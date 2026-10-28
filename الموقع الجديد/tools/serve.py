"""Local server for the new site: serves this folder and saves the hero film's frames.

  POST /save/hero/<desktop|mobile>/<NNNN>.jpg   -> tools/out/hero/<set>/NNNN.jpg

Run:  python -I tools/serve.py
then  http://localhost:8767/docs/            the built site
      http://localhost:8767/src/video/render.html?set=desktop&sample=6   a quick look at the film
"""
import re
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "tools" / "out"
SAVE = re.compile(r"^/save/(hero)/(desktop|mobile)/(\d{4})\.jpg$")


class Handler(SimpleHTTPRequestHandler):
    def do_POST(self):
        body = self.rfile.read(int(self.headers.get("Content-Length", 0)))
        m = SAVE.match(self.path)
        if not m:
            self.send_error(404, "unknown save path")
            return
        folder = OUT / m.group(1) / m.group(2)
        folder.mkdir(parents=True, exist_ok=True)
        (folder / f"{m.group(3)}.jpg").write_bytes(body)
        self.send_response(204)
        self.end_headers()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *args):
        pass


class Server(ThreadingHTTPServer):
    request_queue_size = 128


if __name__ == "__main__":
    Server(("127.0.0.1", 8767), partial(Handler, directory=str(ROOT))).serve_forever()
