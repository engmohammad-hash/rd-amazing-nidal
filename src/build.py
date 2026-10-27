"""Build the static site, in Arabic and English: src/templates + src/data -> docs/.

  data/site.ar.json   everything the pages say and show, in Arabic (the base: numbers, slugs, scenes, images)
  data/site.en.json   the English text only, laid over the Arabic by key (lists of objects by position)
  data/ui.<lang>.json the words of the interface: buttons, headings, labels, page titles

Arabic pages are at the site root, English ones under en/. The scroll films (docs/frames) and gallery stills
(docs/gallery) come from tools/render_scene.py and are shared by both; this script only reads them.

Run from the repo root:  python -I src/build.py
"""
import datetime
import hashlib
import json
import shutil
import time
from pathlib import Path
from urllib.parse import quote

from jinja2 import Environment, FileSystemLoader, StrictUndefined

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

# Product films are 120 frames; three acts share the scroll, the last one carries the order buttons.
PRODUCT_FILM = {"frames": 120, "height": 380, "starts": [0.14, 0.46, 0.80], "windows": [(0.08, 0.34), (0.38, 0.64), (0.68, 9)]}

env = Environment(loader=FileSystemLoader(SRC / "templates"), autoescape=True, undefined=StrictUndefined,
                  trim_blocks=True, lstrip_blocks=True)
env.filters["fill"] = lambda s, **kw: fill(s, **kw)


def fill(s, **kw):
    for k, v in kw.items():
        s = s.replace("{" + k + "}", str(v))
    return s


def wa(text):
    return f"https://wa.me/{WHATSAPP}?text={quote(text)}"


def copy_assets():
    # overwrite in place: on Windows a file another program has open cannot be deleted, only rewritten
    assets = OUT / "assets"
    shutil.copytree(SRC / "static", assets, dirs_exist_ok=True)
    shutil.copytree(SRC / "scenes", assets / "scenes", dirs_exist_ok=True)   # drawn live by assets/js/live.js
    shutil.copy2(ROOT / "tools" / "bench.js", assets / "js" / "bench.js")
    # the home film's opening frame doubles as the link-preview image
    shutil.copy2(OUT / "frames" / "story" / "desktop" / "000.jpg", assets / "img" / "og.jpg")
    digest = hashlib.sha1()
    for p in sorted([*(SRC / "static").rglob("*"), *(SRC / "scenes").rglob("*")]):
        if p.is_file():
            digest.update(p.read_bytes())
    return digest.hexdigest()[:8]


def film_preload(scene):
    # the first small sheet of the set this screen will use; `as=fetch` matches the player's fetch()
    return [
        {"href": f"frames/{scene}/desktop-small-0.jpg", "media": "(min-aspect-ratio: 85/100)"},
        {"href": f"frames/{scene}/mobile-small-0.jpg", "media": "(max-aspect-ratio: 85/100)"},
    ]


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


# ---------- structured data ----------

ORG_ID = BASE + "#business"
DAYS = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"]


def crumbs_ld(trail):
    return {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": name, "item": BASE + href} for i, (name, href) in enumerate(trail)]}


def jsonld(*nodes):
    return json.dumps({"@context": "https://schema.org", "@graph": list(nodes)}, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")


# ---------- one language ----------

class Site:
    def __init__(self, code, data, t):
        self.code, self.data, self.t = code, data, t
        self.b, self.products = data["business"], data["products"]
        self.prefix = t["prefix"]

    def business_ld(self):
        b, pre = self.b, self.prefix
        return {
            "@type": "LocalBusiness", "@id": ORG_ID,
            "name": f"{b['name']} .. {b['tagline']}" if self.code == "ar" else f"{b['name']} | {b['tagline']}",
            "alternateName": AR["business"]["name"] if self.code == "en" else b["name_en"],
            "description": b["about_short"], "url": BASE + pre,
            "logo": BASE + "assets/img/logo-color.png", "image": BASE + "assets/img/og.jpg",
            "telephone": b["phone"], "email": b["email"],
            "address": {"@type": "PostalAddress", "addressLocality": b["city"], "addressRegion": b["region"], "addressCountry": "SA"},
            "areaServed": [{"@type": "City", "name": b["city"]}, {"@type": "AdministrativeArea", "name": b["region"]}],
            "openingHoursSpecification": [{"@type": "OpeningHoursSpecification", "dayOfWeek": DAYS,
                                           "opens": b["hours"]["open"], "closes": b["hours"]["close"]}],
            "sameAs": [f"https://www.instagram.com/{b['instagram']}/"],
            "contactPoint": {"@type": "ContactPoint", "telephone": b["phone"], "contactType": "customer service",
                             "availableLanguage": ["ar", "en"]},
            "makesOffer": [{"@type": "Offer", "itemOffered": {"@type": "Service", "name": p["name"],
                            "url": BASE + pre + f"products/{p['slug']}/"}} for p in self.products],
        }

    def render(self, template, path, ctx):
        """`path` is the page's place inside its language, e.g. "products/"; Arabic sits at the root, English under en/."""
        t, full = self.t, self.prefix + path
        depth = full.count("/") if full.endswith("/") else 0
        root = SITE_PATH if template == "404.html" else "../" * depth
        other = t["other"]
        page = {
            "t": t, "lang": t["lang"], "dir": t["dir"], "b": self.b, "credit": self.data["credit"],
            "nav": self.data["nav"], "products": self.products, "home": self.data["home"], "vision": self.data["vision2030"],
            "reviews": self.data["reviews"], "reviews_note": self.data["reviews_note"], "faq": self.data["faq"],
            "root": root, "path": full, "version": VERSION, "wa": wa, "cta": True, "preload": [],
            "og_image": "assets/img/og.jpg", "section": path.split("/", 1)[0] + "/" if "/" in path else "",
            "link": lambda href, pre=self.prefix: (root + pre + href) or "./",
            "alt_link": (root + other["prefix"] + path) or "./",
            "alternates": {"ar": BASE + path, "en": BASE + "en/" + path},
        }
        page.update(ctx)
        write(OUT / (full + "index.html" if full == "" or full.endswith("/") else full), env.get_template(template).render(**page))
        PAGES.append((self.code, path, template))

    def build(self):
        t, b, m, pre = self.t, self.b, self.t["meta"], self.prefix
        names = {"name": b["name"], "tagline": b["tagline"], "city": b["city"]}
        home_trail = [(t["crumb_home"], pre)]
        products_trail = home_trail + [(t["products"]["title"], pre + "products/")]

        self.render("home.html", "", {
            "title": fill(m["home_title"], **names), "description": m["home_desc"],
            "preload": film_preload("story"),
            "jsonld": jsonld(self.business_ld(), {"@type": "WebSite", "@id": BASE + pre + "#site", "url": BASE + pre,
                                                  "name": b["name"], "inLanguage": t["locale"].replace("_", "-"),
                                                  "publisher": {"@id": ORG_ID}}),
        })
        self.render("products.html", "products/", {
            "title": fill(m["products_title"], **names), "description": m["products_desc"],
            "jsonld": jsonld(crumbs_ld(products_trail), {"@type": "ItemList", "itemListElement": [
                {"@type": "ListItem", "position": i + 1, "name": p["name"], "url": BASE + pre + f"products/{p['slug']}/"}
                for i, p in enumerate(self.products)]}),
        })
        for i, p in enumerate(self.products):
            path = f"products/{p['slug']}/"
            acts = [dict(act, a=w[0], b=w[1], cta=k == len(p["acts"]) - 1) for k, (act, w) in enumerate(zip(p["acts"], PRODUCT_FILM["windows"]))]
            related = [self.products[(i + k) % len(self.products)] for k in (1, 2, 3)]
            self.render("product.html", path, {
                "title": fill(m["product_title"], product=p["name"], **names), "description": p["description"],
                "p": p, "acts": acts, "related": related, "film": PRODUCT_FILM,
                "og_image": f"gallery/{p['scene']}/01.jpg", "preload": film_preload(p["scene"]),
                "jsonld": jsonld(
                    crumbs_ld(products_trail + [(p["name"], pre + path)]),
                    {"@type": "Service", "name": p["name"], "description": p["description"], "url": BASE + pre + path,
                     "image": [BASE + f"gallery/{p['scene']}/{n:02d}.jpg" for n in range(1, 7)],
                     "serviceType": "طباعة" if self.code == "ar" else "Printing", "provider": {"@id": ORG_ID}, "areaServed": b["region"]}),
            })
        self.render("works.html", "works/", {
            "title": fill(m["works_title"], **names), "description": m["works_desc"], "og_image": "gallery/incense/01.jpg",
            "jsonld": jsonld(crumbs_ld(home_trail + [(t["works"]["title"], pre + "works/")])),
        })
        self.render("about.html", "about/", {
            "title": fill(m["about_title"], **names), "description": b["about_short"] + m["about_desc_extra"],
            "og_image": "gallery/cards/01.jpg",
            "jsonld": jsonld(crumbs_ld(home_trail + [(t["about"]["title"], pre + "about/")]),
                             {"@type": "AboutPage", "url": BASE + pre + "about/", "about": {"@id": ORG_ID}}),
        })
        self.render("reviews.html", "reviews/", {
            "title": fill(m["reviews_title"], **names), "description": m["reviews_desc"],
            "jsonld": jsonld(crumbs_ld(home_trail + [(t["reviews"]["title"], pre + "reviews/")])),
        })
        self.render("contact.html", "contact/", {
            "title": fill(m["contact_title"], **names),
            "description": fill(m["contact_desc"], phone=b["phone_display"], hours=b["hours"]["label"]),
            "cta": False,
            "jsonld": jsonld(crumbs_ld(home_trail + [(t["contact"]["title"], pre + "contact/")]), self.business_ld(),
                             {"@type": "FAQPage", "mainEntity": [
                                 {"@type": "Question", "name": f["q"], "acceptedAnswer": {"@type": "Answer", "text": f["a"]}}
                                 for f in self.data["faq"]]}),
        })
        if self.code == "ar":   # GitHub Pages has a single 404 page for the whole site
            self.render("404.html", "404.html", {
                "title": fill(m["notfound_title"], **names), "description": m["notfound_desc"],
                "cta": False, "section": None, "jsonld": jsonld(),
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
    for s, head, pages_head, faq_head in ((ar, "المنتجات", "الصفحات", "أسئلة شائعة"), (en, "Products", "Pages", "FAQ")):
        lines += [f"## {head}", ""]
        lines += [f"- [{p['name']}]({BASE}{s.prefix}products/{p['slug']}/): {p['description']}" for p in s.products]
        lines += ["", f"## {pages_head}", ""]
        lines += [f"- [{n['label']}]({BASE}{s.prefix}{n['href']})" for n in s.data["nav"]]
        lines += ["", f"## {faq_head}", ""]
        lines += [f"- {f['q']} {f['a']}" for f in s.data["faq"]]
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
