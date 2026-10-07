# Prepare the real EBP logo for the film. Run from the project root:  python tools/prep_brand.py
# Source: assets/brand/ebp-logo-source.png (eshabargateproductions.com/images/assets/erp-logo-transparent.png, 534×772):
# red feet with WHITE circuit traces (part of the mark, kept as they are), a hard alpha mask, and the OUTER edge
# anti-aliased against white, which reads as a light halo on dark grounds. Only that outer ring is un-matted against
# white (coverage = (255 − G) / (255 − G_red), colour = the logo red); the inside of the mark is untouched.
# Then split the two feet (they separate cleanly at x = SPLIT) and record where each sits inside the full logo.
#   → assets/brand/ebp-logo.png, foot-l.png, foot-r.png, logo-meta.json
import json
import numpy as np
from PIL import Image
from scipy import ndimage

SRC, OUT, SPLIT, RING = 'assets/brand/ebp-logo-source.png', 'assets/brand', 262, 2
a = np.array(Image.open(SRC).convert('RGBA')).astype(np.float64)
opaque = a[:, :, 3] > 127
lab, _ = ndimage.label(~opaque)
edge_ids = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
exterior = np.isin(lab, list(edge_ids))                           # transparent area connected to the frame edge
ring = opaque & ndimage.binary_dilation(exterior, iterations=RING)
core = opaque & ~ring & (a[:, :, 1] < 60)
red = np.median(a[core][:, :3], axis=0)
cov = np.clip((255 - a[:, :, 1]) / (255 - red[1]), 0, 1)
out = a.copy()
out[ring, :3] = red; out[ring, 3] = np.round(cov[ring] * 255)
logo = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), 'RGBA')
logo.save(f'{OUT}/ebp-logo.png')

meta = {'size': list(logo.size), 'red': '#%02x%02x%02x' % tuple(int(round(v)) for v in red), 'feet': {}}
for name, box in (('l', (0, 0, SPLIT, logo.size[1])), ('r', (SPLIT, 0, logo.size[0], logo.size[1]))):
    part = logo.crop(box); bb = part.getchannel('A').point(lambda v: 255 if v > 4 else 0).getbbox()
    part.crop(bb).save(f'{OUT}/foot-{name}.png')
    meta['feet'][name] = {'x': box[0] + bb[0], 'y': bb[1], 'w': bb[2] - bb[0], 'h': bb[3] - bb[1]}
json.dump(meta, open(f'{OUT}/logo-meta.json', 'w'), indent=1)
print('logo red', meta['red'], '· outer-ring px un-matted', int(ring.sum()), '·', meta['feet'])
