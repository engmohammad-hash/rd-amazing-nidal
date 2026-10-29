"""Build the new site, in Arabic and English: src/templates + src/data -> docs/.

  data/site.ar.json   everything the page says and shows, in Arabic (the base: numbers, images)
  data/site.en.json   the English text only, laid over the Arabic by key (lists of objects by position)
  data/ui.<lang>.json the words of the interface: buttons, section headings, page titles

Arabic at the site root, English under en/. Each has the long home page, the shop, a page for each of the sixteen
service sections (services/<section>/) and one for every product in them (services/<section>/<product>/).
The hero film (static/video) comes from tools/render_video.py, the product pictures from tools/render_products.py
and the shop's own photos from tools/photos.py; this script only copies them.

Run from this folder:  python -I src/build.py
"""
import base64
import datetime
import hashlib
import io
import json
import shutil
import time
from pathlib import Path
from urllib.parse import quote

from jinja2 import Environment, FileSystemLoader, StrictUndefined
from PIL import Image

SRC = Path(__file__).resolve().parent
ROOT = SRC.parent
OUT = ROOT / "docs"


def load(name):
    return json.loads((SRC / "data" / name).read_text(encoding="utf-8"))


def merged(base, over):
    """`over` laid on `base`: objects merge by key, lists of objects by position, anything else is replaced."""
    if isinstance(base, dict) and isinstance(over, dict):
        return {**base, **{k: merged(base[k], v) if k in base else v for k, v in over.items()}}
    if isinstance(base, list) and isinstance(over, list) and base and all(isinstance(x, dict) for x in base):
        return [merged(x, y) for x, y in zip(base, over)] + base[len(over):]
    return over


AR = load("site.ar.json")
LANGS = [("ar", AR, load("ui.ar.json")), ("en", merged(AR, load("site.en.json")), load("ui.en.json"))]
BASE = AR["business"]["base_url"]
SITE_PATH = "/" + BASE.split("://", 1)[1].split("/", 1)[1]   # "/rd-amazing-nidal/"
WHATSAPP = AR["business"]["whatsapp"]

env = Environment(loader=FileSystemLoader(SRC / "templates"), autoescape=True, undefined=StrictUndefined,
                  trim_blocks=True, lstrip_blocks=True)
env.filters["fill"] = lambda s, **kw: fill(s, **kw)
# "See our {name}" reads "See our business cards" in English; names that start with a capitalised word (ID cards) stay
env.filters["lcfirst"] = lambda s: s[:1].lower() + s[1:] if s[1:2].islower() and s[:1].isascii() else s


def fill(s, **kw):
    for k, v in kw.items():
        s = s.replace("{" + k + "}", str(v))
    return s


def wa(text):
    return f"https://wa.me/{WHATSAPP}?text={quote(text)}"


def write(target, text):
    # Windows briefly locks a file that a preview or a virus scan has open; wait it out instead of failing
    target.parent.mkdir(parents=True, exist_ok=True)
    for attempt in range(8):
        try:
            target.write_text(text, encoding="utf-8", newline="\n")
            return
        except OSError:
            if attempt == 7:
                raise
            time.sleep(.25 * (attempt + 1))


def copy_assets():
    # overwrite in place: on Windows a file another program has open cannot be deleted, only rewritten
    shutil.copytree(SRC / "static", OUT / "assets", dirs_exist_ok=True)
    digest = hashlib.sha1()
    for p in sorted((SRC / "static").rglob("*")):
        if p.is_file():
            digest.update(p.read_bytes())
    return digest.hexdigest()[:8]


def lqip(name, size):
    """A thumbnail of the film's first frame small enough to sit inside the page (well under a kilobyte)."""
    im = Image.open(SRC / "static" / "video" / name).convert("RGB")
    im.thumbnail(size, Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=60)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


HERO_LQIP = {"desktop": lqip("hero-desktop.jpg", (48, 27)), "mobile": lqip("hero-mobile.jpg", (27, 48))}


# a picture is named by where it comes from: "photo/12" the shop's own photos, "shop/bags-01" the shop page's renders,
# "p/tshirt-01" the product renders. Each has a full size (the lightbox), a 4:3 "md" and a 720 x 540 thumbnail.
PIC_DIRS = {"photo": "photos", "shop": "shop", "p": "products"}
MISSING = set()


def pic(key, root):
    kind, name = key.split("/", 1)
    folder = PIC_DIRS[kind]
    base = SRC / "static" / "img" / folder / name
    for suffix in ("", "-thumb") + (("-md",) if kind == "photo" else ()):
        if not base.with_name(base.name + suffix + ".jpg").exists():
            MISSING.add(f"{folder}/{name}{suffix}.jpg")
    url = f"{root}assets/img/{folder}/{name}"
    return {"key": key, "full": url + ".jpg", "md": url + ("-md.jpg" if kind == "photo" else ".jpg"), "thumb": url + "-thumb.jpg",
            "abs": BASE + f"assets/img/{folder}/{name}.jpg"}


def jsonld(*nodes):
    return json.dumps({"@context": "https://schema.org", "@graph": list(nodes)}, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")


ORG_ID = BASE + "#business"
DAYS = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"]


class Site:
    def __init__(self, code, data, t):
        self.code, self.data, self.t = code, data, t
        self.b = data["business"]
        self.prefix = t["prefix"]

    def business_ld(self):
        b = self.b
        return {
            "@type": "LocalBusiness", "@id": ORG_ID,
            "name": f"{b['name']} .. {b['tagline']}" if self.code == "ar" else f"{b['name']} | {b['tagline']}",
            "alternateName": AR["business"]["name"] if self.code == "en" else b["name_en"],
            "description": b["about_short"], "url": BASE + self.prefix,
            "logo": BASE + "assets/img/logo-color.png", "image": BASE + "assets/img/og.jpg",
            "telephone": b["phone"], "email": b["email"],
            "address": {"@type": "PostalAddress", "addressLocality": b["city"], "addressRegion": b["region"], "addressCountry": "SA"},
            "areaServed": [{"@type": "City", "name": b["city"]}, {"@type": "AdministrativeArea", "name": b["region"]}],
            "openingHoursSpecification": [{"@type": "OpeningHoursSpecification", "dayOfWeek": DAYS,
                                           "opens": b["hours"]["open"], "closes": b["hours"]["close"]}],
            "sameAs": [f"https://www.instagram.com/{b['instagram']}/"],
            "hasOfferCatalog": {"@type": "OfferCatalog", "name": self.t["services"]["title"][0], "itemListElement": [
                {"@type": "OfferCatalog", "name": s["name"], "url": BASE + self.prefix + f"services/{s['id']}/", "itemListElement": [
                    {"@type": "Offer", "itemOffered": {"@type": "Service", "name": item["name"],
                                                       "url": BASE + self.prefix + f"services/{s['id']}/{item['id']}/"}}
                    for item in s["items"]]}
                for s in self.data["services"]]},
        }

    def shop_json(self, root):
        """What the cart, favourites and quick view need on every page, in this page's language."""
        shop, img = self.data["shop"], root + "assets/img/shop/"
        products = []
        for p in shop["products"]:
            o = shop["options"][p["cat"]]
            products.append({
                "id": p["id"], "cat": p["cat"], "name": p["name"], "short": p["short"], "badge": p.get("badge", ""),
                "img": [f"{img}{k}.jpg" for k in p["img"]], "thumb": [f"{img}{k}-thumb.jpg" for k in p["img"]],
                "unit": o["unit"], "min": o["min"], "step": o["step"], "choices": o["choices"],
            })
        return json.dumps({
            "wa": WHATSAPP, "shop": root + self.prefix + "shop/",
            "cats": {c["id"]: c["name"] for c in shop["categories"]}, "products": products, "t": self.t["cart"],
        }, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")

    def render(self, template, path, ctx):
        """`path` is the page's place inside its language; Arabic sits at the root, English under en/."""
        t, full = self.t, self.prefix + path
        depth = full.count("/") if full.endswith("/") else 0
        root = SITE_PATH if template == "404.html" else "../" * depth
        home = (root + self.prefix) or "./"
        page = {
            "t": t, "lang": t["lang"], "dir": t["dir"], "b": self.b, "d": self.data, "credit": self.data["credit"],
            "root": root, "home": home, "path": full, "version": VERSION, "wa": wa, "template": template, "hero_lqip": HERO_LQIP,
            "shop": self.data["shop"], "shop_link": root + self.prefix + "shop/", "shop_json": self.shop_json(root),
            # where a section's or a product's page is, from any page; and its pictures as seen from this page
            "svc_link": lambda sid, pid=None, base=root + self.prefix: f"{base}services/{sid}/" + (f"{pid}/" if pid else ""),
            "pic": lambda key, r=root: pic(key, r),
            "cat_names": {c["id"]: c["name"] for c in self.data["shop"]["categories"]},
            # on the home page a section link is just its anchor; elsewhere it leads back home first
            "anchor": (lambda id: "#" + id) if template == "home.html" else (lambda id, h=home: h + "#" + id),
            # the 404 page exists in Arabic only: its language switch goes to the English home page
            "alt_link": (root + t["other"]["prefix"] + ("" if template == "404.html" else path)) or "./",
            "alternates": {"ar": BASE + path, "en": BASE + "en/" + path},
        }
        page.update(ctx)
        write(OUT / (full + "index.html" if full == "" or full.endswith("/") else full), env.get_template(template).render(**page))
        PAGES.append((self.code, path, template))

    def build(self):
        t, b, m = self.t, self.b, self.t["meta"]
        names = {"name": b["name"], "city": b["city"]}
        self.render("home.html", "", {
            "title": fill(m["home_title"], **names), "description": m["home_desc"],
            "jsonld": jsonld(self.business_ld(), {"@type": "WebSite", "@id": BASE + self.prefix + "#site", "url": BASE + self.prefix,
                                                  "name": b["name"], "inLanguage": t["locale"].replace("_", "-"),
                                                  "publisher": {"@id": ORG_ID}}),
        })
        shop_url = BASE + self.prefix + "shop/"
        self.render("shop.html", "shop/", {
            "title": fill(t["shop"]["meta_title"], **names), "description": t["shop"]["meta_desc"],
            "jsonld": jsonld(
                {"@type": "BreadcrumbList", "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": t["shop"]["crumb_home"], "item": BASE + self.prefix},
                    {"@type": "ListItem", "position": 2, "name": t["shop"]["title"], "item": shop_url}]},
                {"@type": "ItemList", "itemListElement": [
                    {"@type": "ListItem", "position": i + 1, "url": f"{shop_url}?p={p['id']}", "name": p["name"],
                     "image": BASE + f"assets/img/shop/{p['img'][0]}.jpg"}
                    for i, p in enumerate(self.data["shop"]["products"])]}),
        })
        self.build_services(names)
        if self.code == "ar":   # GitHub Pages has a single 404 page for the whole site
            self.render("404.html", "404.html", {
                "title": fill(m["notfound_title"], **names), "description": m["notfound_desc"], "jsonld": jsonld(),
            })


    def crumbs(self, *trail):
        """BreadcrumbList from the home page down: (name, path) pairs, path inside this language."""
        home = (self.t["shop"]["crumb_home"], "")
        return {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": name, "item": BASE + self.prefix + path}
            for i, (name, path) in enumerate((home,) + trail)]}

    def build_services(self, names):
        t, c, svcs = self.t, self.t["catalog"], self.data["services"]
        for k, s in enumerate(svcs):
            spath = f"services/{s['id']}/"
            self.render("section.html", spath, {
                "title": fill(c["meta_section"], section=s["name"], **names), "description": s["lead"],
                "svc": s, "svc_index": k, "jsonld": jsonld(
                    self.crumbs((t["services"]["eyebrow_short"], "#services"), (s["name"], spath)),
                    {"@type": "ItemList", "name": s["name"], "itemListElement": [
                        {"@type": "ListItem", "position": i + 1, "name": it["name"], "url": BASE + self.prefix + spath + it["id"] + "/"}
                        for i, it in enumerate(s["items"])]}),
            })
            for i, it in enumerate(s["items"]):
                ppath = spath + it["id"] + "/"
                self.render("product.html", ppath, {
                    "title": fill(c["meta_product"], product=it["name"], section=s["name"], **names), "description": it["short"],
                    "svc": s, "svc_index": k, "item": it, "item_index": i, "jsonld": jsonld(
                        self.crumbs((t["services"]["eyebrow_short"], "#services"), (s["name"], spath), (it["name"], ppath)),
                        {"@type": "Service", "name": it["name"], "description": it["short"], "serviceType": s["name"],
                         "url": BASE + self.prefix + ppath, "image": [pic(key, "")["abs"] for key in it["img"]],
                         "provider": {"@id": ORG_ID}, "areaServed": {"@type": "City", "name": self.b["city"]}}),
                })


def write_meta(sites):
    today = datetime.date.today().isoformat()
    urls = ""
    for code, path, template in PAGES:
        if template == "404.html":
            continue
        alts = "".join(f'<xhtml:link rel="alternate" hreflang="{c}" href="{BASE}{s.prefix}{path}"/>' for c, s in sites.items())
        urls += f"<url><loc>{BASE}{sites[code].prefix}{path}</loc><lastmod>{today}</lastmod>{alts}</url>\n"
    write(OUT / "sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n'
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
          + urls + "</urlset>\n")
    write(OUT / "robots.txt", f"User-agent: *\nAllow: /\n\nSitemap: {BASE}sitemap.xml\n")
    write(OUT / ".nojekyll", "")

    ar, en = sites["ar"], sites["en"]
    b = ar.b
    lines = [f"# {b['name']} .. {b['tagline']} ({en.b['name']})", "", f"> {b['about_short']}", "", f"> {en.b['about_short']}", "",
             f"- الموقع / Location: {b['city']}، {b['region']}، {b['country']} ({en.b['city']}, {en.b['region']}, {en.b['country']})",
             f"- واتساب واتصال / WhatsApp and phone: {b['phone_display']}",
             f"- البريد / Email: {b['email']}",
             f"- إنستغرام / Instagram: https://www.instagram.com/{b['instagram']}/",
             f"- ساعات العمل / Hours: {b['hours']['label']} ({en.b['hours']['label']})", ""]
    for s, head in ((ar, "الخدمات"), (en, "Services")):
        lines += [f"## {head}", ""]
        for svc in s.data["services"]:
            lines += [f"- [{svc['name']}]({BASE}{s.prefix}services/{svc['id']}/): {svc['lead']}"]
            lines += [f"  - [{it['name']}]({BASE}{s.prefix}services/{svc['id']}/{it['id']}/): {it['short']}" for it in svc["items"]]
        lines += ["", f"### {s.t['shop']['title']} ({BASE}{s.prefix}shop/)", ""]
        lines += [f"- {p['name']}: {p['short']}" for p in s.data["shop"]["products"]]
        lines += [""]
    write(OUT / "llms.txt", "\n".join(lines))


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    PAGES = []
    VERSION = copy_assets()
    sites = {code: Site(code, data, t) for code, data, t in LANGS}
    for s in sites.values():
        s.build()
    write_meta(sites)
    print(f"built {len(PAGES)} pages into {OUT} (v{VERSION})")
    if MISSING:
        print(f"{len(MISSING)} pictures still to make, e.g. {', '.join(sorted(MISSING)[:6])}")
