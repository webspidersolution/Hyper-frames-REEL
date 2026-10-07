# Review a rendered MP4: stream probe, a frame sheet at key times, loudness.
#   python tools/review.py renders/draft_9x16.mp4 [--at 3.733,3.75,3.767] [--name cuts]
# Times default to: 0.05, every marks value in timeline.json, transition windows, and the last second.
# Each time shows its nearest frame (past the end → the last frame); --name writes <name>.jpg instead of sheet.jpg.
import json, os, subprocess, sys
from fractions import Fraction
from PIL import Image, ImageDraw

src = sys.argv[1]
arg = lambda k: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else None
out = os.path.splitext(src)[0] + '_review'; os.makedirs(out, exist_ok=True)
probe = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', src], capture_output=True, text=True).stdout)
for s in probe['streams']:
    print(s['codec_type'], s.get('codec_name'), s.get('width', ''), s.get('height', ''), s.get('r_frame_rate', ''), s.get('sample_rate', ''), s.get('duration', ''))
dur = float(probe['format']['duration'])
print('duration', round(dur, 3), 's  size', round(int(probe['format']['size']) / 1e6, 1), 'MB')
v = next(s for s in probe['streams'] if s['codec_type'] == 'video')
fps = float(Fraction(v['r_frame_rate'])); last = float(v.get('duration', dur)) - 1 / fps   # time of the last frame
if arg('--at'):
    T = [float(x) for x in arg('--at').split(',')]
else:
    T = [0.05]
    if os.path.exists('timeline.json'):
        tl = json.load(open('timeline.json', encoding='utf-8'))
        for m in (tl.get('marks') or {}).values():
            if isinstance(m, (int, float)) and 0 < m < dur: T.append(float(m) + 0.25)
    if len(T) < 12: T += [dur * k / 16 for k in range(1, 16)]
    T.append(dur - 0.5)
T = sorted({round(min(t, last), 3) for t in T if t >= 0})[:30]
ims = []
for t in T:
    f = os.path.join(out, f't{t:07.3f}.jpg')
    if os.path.exists(f): os.remove(f)                     # never show a stale frame from an earlier render
    # seek half a frame early: ffmpeg returns the first frame at/after -ss, so this picks the nearest frame even when
    # rounding pushed t a hair past a frame's timestamp
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{max(0.0, t - 0.5 / fps):.4f}', '-i', src, '-frames:v', '1', '-q:v', '3', f])
    if not os.path.exists(f): print(f'skipped {t:.3f}s: ffmpeg wrote no frame'); continue
    ims.append((t, Image.open(f).convert('RGB')))
if not ims: raise SystemExit('no frames extracted')
w0, h0 = ims[0][1].size
tw = 240 if h0 > w0 else 420; th = round(tw * h0 / w0); cols = 10 if h0 > w0 else 5; rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (tw + 6), rows * (th + 24)), (24, 24, 24)); d = ImageDraw.Draw(sheet)
for i, (t, im) in enumerate(ims):
    x, y = (i % cols) * (tw + 6), (i // cols) * (th + 24)
    sheet.paste(im.resize((tw, th)), (x, y + 20)); d.text((x + 4, y + 4), f'{t:.3f}s', fill=(255, 255, 255))
sp = os.path.join(out, f"{arg('--name') or 'sheet'}.jpg")
sheet.save(sp, quality=88)
e = subprocess.run(['ffmpeg', '-nostats', '-i', src, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
s = e[e.rfind('Summary'):]
print('loudness:', ' '.join(l.strip() for l in s.splitlines() if l.strip().startswith(('I:', 'Peak:'))))
print('sheet:', sp, '— LOOK at it')
