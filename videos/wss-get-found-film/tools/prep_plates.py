# Prepare the OpenArt plates for the composition. Run from the project root:
#   python -I tools/prep_plates.py <dir with p1-sea.png p2-forest.png p3-mustard.png>
# Writes assets/photos/*.jpg: the plates at full size (2304x1296, headroom for slow pushes), a pre-blurred sea for the
# focus pull (cheaper than a CSS blur on a big image), and a warm-red grade of the forest for the error moment.
import os, sys
from PIL import Image, ImageFilter, ImageEnhance

src = sys.argv[1] if len(sys.argv) > 1 else '.'
out = 'assets/photos'; os.makedirs(out, exist_ok=True)
def save(im, name): im.save(f'{out}/{name}', quality=92, optimize=True, progressive=True); print('wrote', name, im.size)

sea = Image.open(f'{src}/p1-sea.png').convert('RGB')
save(sea, 'p1-sea.jpg')
save(sea.filter(ImageFilter.GaussianBlur(22)), 'p1-sea-blur.jpg')

forest = Image.open(f'{src}/p2-forest.png').convert('RGB')
save(forest, 'p2-forest.jpg')
# warning grade: a duotone gradient map (ink-red shadows -> warm coral highlights) with extra contrast, so the trees
# keep their shape and the dark editor still reads in front of the mist
lum = ImageEnhance.Contrast(forest.convert('L')).enhance(1.35)
lo, mid, hi = (26, 6, 8), (150, 26, 24), (238, 150, 136)
def ramp(c):
    return [int(lo[c] + (mid[c] - lo[c]) * v / 128) if v < 128 else int(mid[c] + (hi[c] - mid[c]) * (v - 128) / 127) for v in range(256)]
graded = Image.merge('RGB', [lum.point(ramp(c)) for c in range(3)])
save(graded, 'p2-forest-red.jpg')

mustard = Image.open(f'{src}/p3-mustard.png').convert('RGB')
save(mustard, 'p3-mustard.jpg')
