"""Build the full-document pages from demo/index.html (the Claude Artifact source, which has no <!doctype>).

Writes:
  demo/local.html   for run-demo.bat and local testing (assets next to it)
  index.html        the GitHub Pages home, at the repo root, with link-preview tags

Run from the repo root:  python tools/build_site.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE_URL = "https://engmohammad-hash.github.io/rd-amazing-nidal/"

body = (ROOT / "demo" / "index.html").read_text(encoding="utf-8")

BASE_HEAD = (
    '<meta charset="utf-8">'
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
    "<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}"
    "body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>"
)

PREVIEW_HEAD = (
    '<meta property="og:type" content="website">'
    '<meta property="og:locale" content="ar_SA">'
    '<meta property="og:title" content="مطبعة RD Amazing">'
    '<meta property="og:description" content="تصميم وطباعة وتشطيب وتغليف للمطبوعات الفاخرة في المملكة العربية السعودية.">'
    f'<meta property="og:url" content="{SITE_URL}">'
    f'<meta property="og:image" content="{SITE_URL}demo/assets/logo-color.png">'
    '<meta name="twitter:card" content="summary">'
    '<link rel="icon" type="image/png" href="demo/assets/logo-color.png">'
)


def page(head_extra: str, html: str) -> str:
    return "<!doctype html><html lang=\"ar\" dir=\"rtl\"><head>" + BASE_HEAD + head_extra + "</head><body>" + html + "</body></html>\n"


(ROOT / "demo" / "local.html").write_text(page("", body), encoding="utf-8")

# the root page loads the same files from demo/assets/
root_body = body.replace('src="assets/', 'src="demo/assets/').replace("loadImg('assets/", "loadImg('demo/assets/")
assert root_body.count("demo/assets/") >= 5, "asset paths were not rewritten"
(ROOT / "index.html").write_text(page(PREVIEW_HEAD, root_body), encoding="utf-8")

print("wrote demo/local.html and index.html")
