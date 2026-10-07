# Asset prep for the Shubh Griha spin reel. Run from the project root:  python tools/prep_assets.py
# Splits the real Figma wheel into concentric layers, bakes rotational-blur variants for the spin,
# trims product photos, crops the closing home render, and extracts the diya + logo.
import json, os
import numpy as np
from PIL import Image, ImageFont

ROOT = os.getcwd()
SRC = os.path.abspath(os.path.join(ROOT, '..', '..'))          # "Walls & Dreams" folder
A = lambda *p: os.path.join(ROOT, 'assets', *p)
os.makedirs(A('wheel'), exist_ok=True); os.makedirs(A('products'), exist_ok=True); os.makedirs(A('photos'), exist_ok=True)

# ---------------------------------------------------------------- wheel layers (4320 px master, centre 2160)
W = Image.open(A('brand', 'wheel-face.png')).convert('RGBA')
N = W.size[0]; C = N / 2
arr = np.asarray(W).astype(np.float32)
yy, xx = np.mgrid[0:N, 0:N].astype(np.float32)
r = np.hypot(xx + 0.5 - C, yy + 0.5 - C)

# radii in master px (Figma 2160 frame x2): hub base 212, inner 500, middle 760, outer 1010 (+ groove stroke), rim 1080
BANDS = [('hub', 0, 424), ('inner', 424, 1000), ('middle', 1000, 1520), ('outer', 1520, 2024), ('rim', 2024, 9999)]
OVER = 2.0   # each layer extends this far UNDER the layer drawn above it, so the assembled wheel has no seam
meta = {'size': N, 'layers': {}}
for name, r0, r1 in BANDS:
    inner_edge = np.clip(r - (r0 - OVER) + 0.5, 0, 1) if r0 > 0 else np.ones_like(r)   # hard-ish, hidden under the ring above
    outer_edge = np.clip((r1 + 0.5) - r, 0, 1) if r1 < 9999 else np.ones_like(r)        # anti-aliased visible edge
    m = inner_edge * outer_edge
    out = arr.copy(); out[..., 3] *= m
    half = int(min(C, r1 + 4)); x0 = int(C - half); x1 = int(C + half)
    crop = out[x0:x1, x0:x1]
    Image.fromarray(np.clip(crop, 0, 255).astype(np.uint8)).save(A('wheel', f'{name}.png'), optimize=True)
    meta['layers'][name] = {'r0': r0, 'r1': r1, 'box': [x0, x0, x1 - x0, x1 - x0]}
    print('layer', name, crop.shape[:2])

# ---------------------------------------------------------------- flat 2160 wheel + rotational blur variants (premultiplied)
small = W.resize((2160, 2160), Image.LANCZOS)
small.save(A('wheel', 'wheel-2160.png'), optimize=True)
s = np.asarray(small).astype(np.float32) / 255.0
pm = np.concatenate([s[..., :3] * s[..., 3:4], s[..., 3:4]], axis=2)       # premultiplied RGBA
pmimg = [Image.fromarray((pm[..., c] * 255).astype(np.uint8)) for c in range(4)]
def rotblur(deg, samples):
    acc = np.zeros_like(pm)
    for k in range(samples):
        a = -deg / 2 + deg * (k + 0.5) / samples      # symmetric shutter around the frame time
        for c in range(4):
            acc[..., c] += np.asarray(pmimg[c].rotate(a, resample=Image.BICUBIC, center=(1080, 1080))).astype(np.float32)
    acc /= samples * 255.0
    a = acc[..., 3:4]
    rgb = np.where(a > 1e-4, acc[..., :3] / np.maximum(a, 1e-4), 0)
    return Image.fromarray(np.clip(np.concatenate([rgb, a], 2) * 255 + 0.5, 0, 255).astype(np.uint8))
meta['blur'] = []
for deg in (5, 12, 26, 52):
    n = max(12, int(deg * 3))
    rotblur(deg, n).save(A('wheel', f'wheel-blur-{deg}.png'), optimize=True)
    meta['blur'].append(deg); print('blur', deg, 'deg', n, 'samples')

# ---------------------------------------------------------------- pointer: solid-body box (excludes the soft drop shadow)
P = Image.open(A('brand', 'pointer.png')).convert('RGBA')
pa = np.asarray(P)[..., 3]
ys, xs = np.where(pa > 200)
meta['pointer'] = {'w': P.size[0], 'h': P.size[1], 'body': [int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)]}
print('pointer body', meta['pointer'])

# ---------------------------------------------------------------- logo (white lockup) → RGBA, trimmed
L = Image.open(os.path.join(SRC, 'brand-assets', 'logo-white-transparent.png')).convert('RGBA')
L = L.crop(L.getbbox()); L.save(A('brand', 'logo-white.png'), optimize=True); meta['logo'] = list(L.size); print('logo', L.size)

# ---------------------------------------------------------------- diya, keyed off the standee column's #111 ground
col = Image.open(A('brand', 'stand-column.png')).convert('RGBA')
d = np.asarray(col.crop((560, 1080, 880, 1400))).astype(np.float32)
dist = np.abs(d[..., :3] - np.array([17, 17, 17], np.float32)).max(2)
alpha = np.clip((dist - 6) / 40, 0, 1)
d[..., 3] = alpha * 255
# un-mix the dark ground from edge pixels so the diya sits cleanly on any background
rgb = d[..., :3]; a = np.maximum(alpha[..., None], 1e-3)
d[..., :3] = np.clip((rgb - (1 - a) * 17) / a, 0, 255)
diya = Image.fromarray(d.astype(np.uint8)); diya = diya.crop(diya.getbbox()); diya.save(A('brand', 'diya.png')); print('diya', diya.size)

# ---------------------------------------------------------------- closing plate: the dusk elevation render without the IG logo / black bars
H = Image.open(os.path.join(SRC, 'instagram-reference', 'wd-ig-03-european-elevation-evening.jpg')).convert('RGB')
h = np.asarray(H).astype(np.float32).mean(2)
cols = np.where(h.mean(0) > 12)[0]; x0, x1 = int(cols.min()) + 2, int(cols.max()) - 1
home = H.crop((x0, 196, x1, H.size[1]))
home.save(A('photos', 'home-dusk.jpg'), quality=95); meta['home'] = list(home.size); print('home', home.size, (x0, x1))

# ---------------------------------------------------------------- product photos: trim the white ground + screenshot margins
PROD = {'tv75': 'sony-bravia-75.png', 'tv55': 'sony-bravia-55.png', 'ac': 'ac-lg-1.5t.png', 'fridge': 'lg-650l-fridge.png',
        'fridge2': 'fridge-haier-325l.png', 'chimney': 'chimney-beyond-asteria.png', 'ro': 'ro-aquaguard-glow.png',
        'hob': 'hob-faber-4b.png', 'soundbar': 'sony-ht-s60.png', 'airfryer': 'airfryer-philips.png'}
meta['products'] = {}
for key, fn in PROD.items():
    im = Image.open(os.path.join(SRC, 'shubh-griha-build-fest-2026', 'product-photos', fn)).convert('RGB')
    g = np.asarray(im).astype(np.float32)
    ink = (255 - g.min(2)) > 18
    ys, xs = np.where(ink)
    if len(xs):
        # drop sparse rows/cols (screenshot specks) by trimming to the dense core
        rows = ink.sum(1); colsum = ink.sum(0)
        rr = np.where(rows > ink.shape[1] * 0.02)[0]; cc = np.where(colsum > ink.shape[0] * 0.02)[0]
        im = im.crop((int(cc.min()), int(rr.min()), int(cc.max()) + 1, int(rr.max()) + 1))
    im.save(A('products', f'{key}.png'), optimize=True); meta['products'][key] = list(im.size); print('product', key, im.size)

# ---------------------------------------------------------------- type measurement (Poppins), so layout constants are computed, not guessed
F = lambda w, px: ImageFont.truetype(A('fonts', f'Poppins-{w}.ttf'), px)
def width(text, w='ExtraBold', px=100, track=0.0):
    f = F(w, px); return f.getlength(text) + track * px * (len(text) - 1)
LINES = {
    'Book your home.': ('ExtraBold', -0.02), 'Spin your dream.': ('ExtraBold', -0.02), 'SHUBH GRIHA': ('ExtraBold', 0.0),
    'BUILD FEST 2026': ('ExtraBold', 0.0), 'Your package': ('ExtraBold', -0.02), 'decides your ring.': ('ExtraBold', -0.02),
    'Private Cinema Experience': ('ExtraBold', -0.01), 'eligible families': ('ExtraBold', -0.02), '+91 81303 77070': ('ExtraBold', -0.01),
    'Book.': ('ExtraBold', -0.02), 'Unlock.': ('ExtraBold', -0.02), '30': ('ExtraBold', -0.04),
}
meta['em100'] = {t: round(width(t, w, 100, tr), 1) for t, (w, tr) in LINES.items()}
print(json.dumps(meta['em100'], indent=1))
json.dump(meta, open(A('wheel', 'meta.json'), 'w'), indent=1)
print('wrote assets/wheel/meta.json')
