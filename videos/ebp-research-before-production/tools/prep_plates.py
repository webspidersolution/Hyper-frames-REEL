# Derived plates for the film. Run from the project root:  python tools/prep_plates.py
# Blurred, darkened copies so no full-frame CSS blur/filter runs per frame in the render:
#   p1-room-<fmt>-blur.jpg (F3 proof background), p3-set-<fmt>-blur.jpg (F1/F5 backdrop behind the 3D clapperboard)
from PIL import Image, ImageEnhance, ImageFilter
for fmt in ('9x16', '16x9'):
    for name, r, b in (('p1-room', 22, 0.42), ('p3-set', 9, 0.62)):
        im = Image.open(f'assets/photos/{name}-{fmt}.jpg').convert('RGB')
        im = im.filter(ImageFilter.GaussianBlur(r)); im = ImageEnhance.Brightness(im).enhance(b)
        im.save(f'assets/photos/{name}-{fmt}-blur.jpg', quality=90); print('wrote', f'{name}-{fmt}-blur.jpg')

# Extended floor plates for the tilted F4 floor: the plate sits in a wider, taller near-black canvas with feathered
# edges, so the tilted plane never shows its borders. Writes p2-floor-<fmt>-ext.jpg and the paste offset to
# assets/photos/floor-meta.json (the T-mark moves by that offset).
import json, numpy as np
from PIL import ImageDraw
meta = {}
for fmt, fx, fy in (('9x16', 2.6, 1.15), ('16x9', 2.4, 1.5)):
    im = Image.open(f'assets/photos/p2-floor-{fmt}.jpg').convert('RGB'); w, h = im.size
    W2, H2 = int(w * fx), int(h * fy); ox, oy = (W2 - w) // 2, H2 - h          # extend sideways and upward (far side)
    rng = np.random.default_rng(5)
    base = (np.full((H2, W2, 3), 11.0) + rng.normal(0, 2.2, (H2, W2, 1))).clip(0, 255).astype(np.uint8)
    canvas = Image.fromarray(base, 'RGB')
    m = np.ones((h, w))
    fw, fh = int(w * 0.22), int(h * 0.18)
    ramp = lambda n: (np.linspace(0, 1, n) ** 1.6)
    m[:, :fw] *= ramp(fw)[None, :]; m[:, -fw:] *= ramp(fw)[::-1][None, :]; m[:fh, :] *= ramp(fh)[:, None]
    mask = Image.fromarray((m * 255).astype(np.uint8), 'L')
    canvas.paste(im, (ox, oy), mask)
    canvas.save(f'assets/photos/p2-floor-{fmt}-ext.jpg', quality=90)
    meta[fmt] = {'size': [W2, H2], 'offset': [ox, oy]}; print('wrote', f'p2-floor-{fmt}-ext.jpg', W2, H2, 'offset', ox, oy)
json.dump(meta, open('assets/photos/floor-meta.json', 'w'), indent=1)
