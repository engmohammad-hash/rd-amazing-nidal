"""Build the static site: src/templates + src/data/site.json -> docs/.

The scroll films (docs/frames) and gallery stills (docs/gallery) come from tools/render_scene.py; this script
only reads them. Everything else under docs/ is rewritten on each build.

Run from the repo root:  python -I src/build.py
"""
import datetime
import hashlib
import json
import shutil
from pathlib import Path
from urllib.parse import quote

from jinja2 import Environment, FileSystemLoader, StrictUndefined

SRC = Path(__file__).resolve().parent
ROOT = SRC.parent
OUT = ROOT / "docs"

data = json.loads((SRC / "data" / "site.json").read_text(encoding="utf-8"))
b = data["business"]
products = data["products"]
BASE = b["base_url"]
SITE_PATH = "/" + BASE.split("://", 1)[1].split("/", 1)[1]   # "/rd-amazing-nidal/"

# Product films are 120 frames; three acts share the scroll, the last one carries the order buttons.
PRODUCT_FILM = {"frames": 120, "height": 380, "starts": [0.14, 0.46, 0.80], "windows": [(0.08, 0.34), (0.38, 0.64), (0.68, 9)]}

env = Environment(loader=FileSystemLoader(SRC / "templates"), autoescape=True, undefined=StrictUndefined,
                  trim_blocks=True, lstrip_blocks=True)


def wa(text):
    return f"https://wa.me/{b['whatsapp']}?text={quote(text)}"


def copy_assets():
    assets = OUT / "assets"
    if assets.exists():
        shutil.rmtree(assets)
    shutil.copytree(SRC / "static", assets)
    shutil.copy2(ROOT / "tools" / "bench.js", assets / "js" / "bench.js")
    # the home film's opening frame doubles as the link-preview image
    shutil.copy2(OUT / "frames" / "story" / "desktop" / "000.jpg", assets / "img" / "og.jpg")
    digest = hashlib.sha1()
    for p in sorted((SRC / "static").rglob("*")):
        if p.is_file():
            digest.update(p.read_bytes())
    return digest.hexdigest()[:8]


def film_preload(scene):
    # the first small sheet of the set this screen will use; `as=fetch` matches the player's fetch()
    return [
        {"href": f"frames/{scene}/desktop-small-0.jpg", "media": "(min-aspect-ratio: 85/100)"},
        {"href": f"frames/{scene}/mobile-small-0.jpg", "media": "(max-aspect-ratio: 85/100)"},
    ]


# ---------- structured data ----------

ORG_ID = BASE + "#business"
DAYS = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"]


def business_ld():
    return {
        "@type": "LocalBusiness",
        "@id": ORG_ID,
        "name": f"{b['name']} .. {b['tagline']}",
        "alternateName": b["name_en"],
        "description": b["about_short"],
        "url": BASE,
        "logo": BASE + "assets/img/logo-color.png",
        "image": BASE + "assets/img/og.jpg",
        "telephone": b["phone"],
        "email": b["email"],
        "address": {"@type": "PostalAddress", "addressLocality": b["city"], "addressRegion": b["region"], "addressCountry": "SA"},
        "areaServed": [{"@type": "City", "name": b["city"]}, {"@type": "AdministrativeArea", "name": b["region"]}],
        "openingHoursSpecification": [{"@type": "OpeningHoursSpecification", "dayOfWeek": DAYS,
                                       "opens": b["hours"]["open"], "closes": b["hours"]["close"]}],
        "sameAs": [f"https://www.instagram.com/{b['instagram']}/"],
        "contactPoint": {"@type": "ContactPoint", "telephone": b["phone"], "contactType": "customer service",
                         "availableLanguage": ["ar", "en"]},
        "makesOffer": [{"@type": "Offer", "itemOffered": {"@type": "Service", "name": p["name"],
                        "url": BASE + f"products/{p['slug']}/"}} for p in products],
    }


def crumbs_ld(trail):
    return {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": name, "item": BASE + href} for i, (name, href) in enumerate(trail)]}


def jsonld(*nodes):
    return json.dumps({"@context": "https://schema.org", "@graph": list(nodes)}, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")


# ---------- pages ----------

def render(template, path, ctx):
    depth = path.count("/") if path.endswith("/") else 0
    root = SITE_PATH if template == "404.html" else "../" * depth
    page = {
        "b": b, "nav": data["nav"], "products": products, "home": data["home"], "vision": data["vision2030"],
        "reviews": data["reviews"], "reviews_note": data["reviews_note"], "faq": data["faq"],
        "root": root, "path": path, "version": VERSION, "wa": wa, "cta": True, "preload": [],
        "og_image": "assets/img/og.jpg", "section": path.split("/", 1)[0] + "/" if "/" in path else "",
        "link": lambda href: (root + href) or "./",
    }
    page.update(ctx)
    html = env.get_template(template).render(**page)
    target = OUT / (path + "index.html" if path == "" or path.endswith("/") else path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(html, encoding="utf-8", newline="\n")
    PAGES.append(path)


def build_pages():
    home_trail = [("الرئيسية", "")]
    render("home.html", "", {
        "title": f"{b['name']} | {b['tagline']} في {b['city']}",
        "description": "مطبعة في الدمام لطباعة الكروت الشخصية وبوكسات البخور والحلويات والأكياس الفاخرة ودعوات الزفاف والأكواب الورقية والملصقات، بتشطيبات فاخرة.",
        "preload": film_preload("story"),
        "jsonld": jsonld(business_ld(), {"@type": "WebSite", "@id": BASE + "#site", "url": BASE, "name": b["name"],
                                         "inLanguage": "ar-SA", "publisher": {"@id": ORG_ID}}),
    })

    render("products.html", "products/", {
        "title": f"منتجاتنا | {b['name']}",
        "description": "كروت شخصية، بوكسات بخور وحلويات، أكياس فاخرة، دعوات زفاف، أكواب ورقية مطبوعة وملصقات من مطابع روعة التصاميم في الدمام.",
        "jsonld": jsonld(crumbs_ld(home_trail + [("منتجاتنا", "products/")]),
                         {"@type": "ItemList", "itemListElement": [
                             {"@type": "ListItem", "position": i + 1, "name": p["name"], "url": BASE + f"products/{p['slug']}/"}
                             for i, p in enumerate(products)]}),
    })

    for i, p in enumerate(products):
        path = f"products/{p['slug']}/"
        acts = [dict(act, a=w[0], b=w[1], cta=k == len(p["acts"]) - 1) for k, (act, w) in enumerate(zip(p["acts"], PRODUCT_FILM["windows"]))]
        related = [products[(i + k) % len(products)] for k in (1, 2, 3)]
        render("product.html", path, {
            "title": f"{p['name']} في {b['city']} | {b['name']}",
            "description": p["description"],
            "p": p, "acts": acts, "related": related, "film": PRODUCT_FILM,
            "og_image": f"gallery/{p['scene']}/01.jpg",
            "preload": film_preload(p["scene"]),
            "jsonld": jsonld(
                crumbs_ld(home_trail + [("منتجاتنا", "products/"), (p["name"], path)]),
                {"@type": "Service", "name": p["name"], "description": p["description"], "url": BASE + path,
                 "image": [BASE + f"gallery/{p['scene']}/{n:02d}.jpg" for n in range(1, 7)],
                 "serviceType": "طباعة", "provider": {"@id": ORG_ID}, "areaServed": b["region"]}),
        })

    render("works.html", "works/", {
        "title": f"أعمالنا | {b['name']}",
        "description": "معرض أعمال مطابع روعة التصاميم في الدمام: كروت، علب بخور وحلويات، أكياس، دعوات، أكواب ورقية وملصقات.",
        "og_image": "gallery/incense/01.jpg",
        "jsonld": jsonld(crumbs_ld(home_trail + [("أعمالنا", "works/")])),
    })

    render("about.html", "about/", {
        "title": f"من نحن | {b['name']}",
        "description": b["about_short"] + " ندعم رؤية المملكة ٢٠٣٠ بالصناعة المحلية.",
        "og_image": "gallery/cards/01.jpg",
        "jsonld": jsonld(crumbs_ld(home_trail + [("من نحن", "about/")]),
                         {"@type": "AboutPage", "url": BASE + "about/", "about": {"@id": ORG_ID}}),
    })

    render("reviews.html", "reviews/", {
        "title": f"آراء العملاء | {b['name']}",
        "description": "آراء عملاء مطابع روعة التصاميم في الدمام في الكروت والعلب والأكياس والدعوات والأكواب والملصقات.",
        "jsonld": jsonld(crumbs_ld(home_trail + [("آراء العملاء", "reviews/")])),
    })

    render("contact.html", "contact/", {
        "title": f"تواصل معنا | {b['name']}",
        "description": f"تواصل مع مطابع روعة التصاميم في الدمام عبر واتساب {b['phone_display']}، {b['hours']['label']}.",
        "cta": False,
        "jsonld": jsonld(crumbs_ld(home_trail + [("تواصل معنا", "contact/")]), business_ld(),
                         {"@type": "FAQPage", "mainEntity": [
                             {"@type": "Question", "name": f["q"], "acceptedAnswer": {"@type": "Answer", "text": f["a"]}}
                             for f in data["faq"]]}),
    })

    render("404.html", "404.html", {
        "title": f"الصفحة غير موجودة | {b['name']}",
        "description": "الصفحة المطلوبة غير موجودة.",
        "cta": False, "section": None, "jsonld": jsonld(),
    })


def write_meta():
    today = datetime.date.today().isoformat()
    urls = "".join(f"<url><loc>{BASE}{p}</loc><lastmod>{today}</lastmod></url>\n" for p in PAGES if p != "404.html")
    (OUT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n'
                                     '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + "</urlset>\n", encoding="utf-8")
    (OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {BASE}sitemap.xml\n", encoding="utf-8")
    (OUT / ".nojekyll").write_text("", encoding="utf-8")

    lines = [f"# {b['name']} .. {b['tagline']}", "", f"> {b['about_short']}", "",
             f"- الموقع: {b['city']}، {b['region']}، {b['country']}",
             f"- واتساب واتصال: {b['phone_display']}",
             f"- البريد: {b['email']}",
             f"- إنستغرام: https://www.instagram.com/{b['instagram']}/",
             f"- ساعات العمل: {b['hours']['label']}", "", "## المنتجات", ""]
    lines += [f"- [{p['name']}]({BASE}products/{p['slug']}/): {p['description']}" for p in products]
    lines += ["", "## الصفحات", ""]
    lines += [f"- [{n['label']}]({BASE}{n['href']})" for n in data["nav"]]
    lines += ["", "## أسئلة شائعة", ""]
    lines += [f"- {f['q']} {f['a']}" for f in data["faq"]]
    (OUT / "llms.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    PAGES = []
    VERSION = copy_assets()
    build_pages()
    write_meta()
    print(f"built {len(PAGES)} pages into {OUT} (v{VERSION})")
