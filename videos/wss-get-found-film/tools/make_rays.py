# Procedural ground for the ring shot: cream with soft slate shadow rays radiating from the centre and a vignette.
# Run from the project root:  python -I tools/make_rays.py  → assets/tex/rays.jpg (1920x1080)
import numpy as np
from PIL import Image, ImageFilter
W, H = 1920, 1080
y, x = np.mgrid[0:H, 0:W].astype(np.float64)
dx, dy = x - W / 2, y - H / 2
ang = np.arctan2(dy, dx); r = np.hypot(dx, dy) / (W / 2)
rays = 0.5 + 0.5 * np.cos(ang * 7 + 0.4) * (0.6 + 0.4 * np.cos(ang * 3 - 1.1))
shadow = np.clip(rays, 0, 1) ** 2.2 * np.clip((r - 0.18) / 0.5, 0, 1) * np.exp(-r * 0.9) * 0.55
vign = np.clip((r - 0.55) / 0.9, 0, 1) ** 1.6 * 0.25
cream, slate = np.array([242, 243, 239.0]), np.array([90, 94, 100.0])
k = np.clip(shadow + vign, 0, 0.75)[..., None]
img = cream * (1 - k) + slate * k
im = Image.fromarray(img.clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(28))
im.save('assets/tex/rays.jpg', quality=92); print('wrote assets/tex/rays.jpg')
