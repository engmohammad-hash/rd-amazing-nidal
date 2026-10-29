"""The shop's own photos, from the folder the client sent, made ready for the site:
  src/static/img/photos/<n>.jpg        the whole photo, at most 1600 px on its long side (opens in the lightbox)
  src/static/img/photos/<n>-md.jpg     a 1200 x 900 crop around what matters in it (the large picture on a product page)
  src/static/img/photos/<n>-thumb.jpg  the same crop at 720 x 540 (cards and galleries)

usage: python -I tools/photos.py "<folder of photos>"
"""
import sys
from pathlib import Path

from PIL import Image, ImageOps

OUT = Path(__file__).resolve().parent.parent / "src" / "static" / "img" / "photos"
# how far down the photo its subject sits (0 top, 1 bottom), for the 4:3 crop; the rest are centred
FOCUS = {0: .3, 3: .55, 5: .5, 8: .62, 12: .6, 15: .62, 17: .62, 18: .66, 19: .6, 20: .45}

src = Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)
for f in sorted(src.glob("*.jpg"), key=lambda p: int(p.stem)):
    n = int(f.stem)
    im = ImageOps.exif_transpose(Image.open(f)).convert("RGB")
    full = im.copy()
    full.thumbnail((1600, 1600), Image.LANCZOS)
    full.save(OUT / f"{n}.jpg", "JPEG", quality=84, optimize=True, progressive=True)
    wide = min(1200, im.width, round(im.height * 4 / 3))   # never enlarged: a tall phone photo gives a smaller "md"
    for name, size, q in (("md", (wide, wide * 3 // 4), 84), ("thumb", (720, 540), 82)):
        crop = ImageOps.fit(im, size, Image.LANCZOS, centering=(.5, FOCUS.get(n, .5)))
        crop.save(OUT / f"{n}-{name}.jpg", "JPEG", quality=q, optimize=True, progressive=True)
    print(n, im.size, "->", full.size)
