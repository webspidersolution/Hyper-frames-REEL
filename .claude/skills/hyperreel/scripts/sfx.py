# Sound effects from timeline.json → assets/audio/sfx.wav. Run from the project root:  python tools/sfx.py
# Events (seconds):
#   {"at": 4.0, "lib": "boom-hit", "gain": -10, "align": "onset"|"peak", "maxlen": 1.6, "fade": 0.15, "pan": 0}
#   {"at": 1.5, "synth": "shimmer"|"pop"|"click"|"tick"|"thump"|"whoosh"|"riser"|"bell"|"count", "gain": -14, "pitch": 1, "dur": 0.6}
#   {"ticks": "assets/audio/ticks.json", "synth": "tick", "gain": -6}         # physics series: [{t, dir?, g?}] or {"key": [...]}
#                                                                              (g = the event's own gain factor, default 1)
#   {"at": 10, "to": 12, "every": 0.125, "synth": "tick", "gain": -18}        # repeats
# Library: env HYPERREEL_SFX_LIB (default D:\Hyperframes\sfx, with index.json) → fallback: media-use bundled sfx.
import json, os, sys, glob
import numpy as np, soundfile as sf
from scipy import signal

TL = json.load(open('timeline.json', encoding='utf-8'))
SR, DUR = 48000, float(TL['duration']); N = int(SR * DUR)
rng = np.random.default_rng(2026)
OUT = 'assets/audio'; os.makedirs(OUT, exist_ok=True)
LIB = os.environ.get('HYPERREEL_SFX_LIB', r'D:\Hyperframes\sfx')
FALLBACK = os.path.join(os.path.expanduser('~'), '.claude', 'skills', 'media-use', 'audio', 'assets', 'sfx')

def tt(d): return np.arange(int(d * SR)) / SR
def bp(x, lo, hi, o=2): return signal.sosfilt(signal.butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def hp(x, f, o=2): return signal.sosfilt(signal.butter(o, f, 'highpass', fs=SR, output='sos'), x)
def lp(x, f, o=2): return signal.sosfilt(signal.butter(o, f, 'lowpass', fs=SR, output='sos'), x)
db = lambda x: 10 ** (x / 20)
sfx = np.zeros((N, 2))
def place(x, at, gain=1.0, pan=0.0):
    i = int(round(at * SR))
    if x.ndim == 1: x = np.stack([x * np.sqrt(1 - pan), x * np.sqrt(1 + pan)], 1)
    if i < 0: x, i = x[-i:], 0
    j = min(N, i + len(x))
    if j > i: sfx[i:j] += x[: j - i] * gain

# ---------------------------------------------------------------- synth voices (each returns (signal, lead_seconds))
def tick(p=1.0, seed=0):
    r = np.random.default_rng(seed); t = tt(0.05); e = r.standard_normal(len(t)) * np.exp(-t * 2500)
    x = (bp(e, 1700 * p, 2300 * p) + bp(e, 2900 * p, 3500 * p) * 0.8 + bp(e, 4600 * p, 5600 * p) * 0.55) * 6
    return (x + np.sin(2 * np.pi * (780 + r.uniform(-30, 30)) * p * t) * np.exp(-t * 140) * 0.55) * np.minimum(t / 0.0004, 1), 0
def click(p=1.0, seed=0):
    t = tt(0.06); n = hp(hp(rng.standard_normal(len(t)), 3500), 3500)
    return n * np.exp(-t * 2600) * 0.9 + np.sin(2 * np.pi * 2300 * p * t) * np.exp(-t * 190) * 0.45 + np.sin(2 * np.pi * 520 * p * t) * np.exp(-t * 110) * 0.55, 0
def pop(p=1.0, seed=0):
    t = tt(0.1); f = (820 + 900 * (1 - np.exp(-t * 60))) * p
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 42) * np.minimum(t / 0.002, 1) * 0.8 + hp(rng.standard_normal(len(t)), 5000) * np.exp(-t * 3000) * 0.35, 0
def thump(p=1.0, seed=0):
    t = tt(0.6); f = (42 + 53 * np.exp(-t * 22)) * p
    return np.tanh((np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) + lp(rng.standard_normal(len(t)), 900) * np.exp(-t * 60) * 0.6) * 1.6), 0
def sweep_bp(nz, fc, q=0.55):
    x = np.zeros_like(nz); lo = band = 0.0
    for i in range(len(nz)):
        f = 2 * np.sin(np.pi * min(fc[i], SR / 6) / SR); lo += f * band; hi = nz[i] - lo - q * band; band += f * hi; x[i] = band
    return x
def whoosh(p=1.0, seed=0, dur=0.44):   # builds, PEAKS on the cue
    pre = dur * 0.7; t = tt(dur); u = np.minimum(1, t / pre)
    x = sweep_bp(rng.standard_normal(len(t)), (350 + 6500 * u ** 2) * p)
    return x * np.where(t < pre, u ** 2.2, np.exp(-(t - pre) * 24)) * 0.62, pre
def riser(p=1.0, seed=0, dur=2.0):
    t = tt(dur); u = t / dur
    x = sweep_bp(rng.standard_normal(len(t)), (300 + 7000 * u ** 2.4) * p, 0.8) * 0.8 + np.sin(2 * np.pi * np.cumsum(220 * p * 2 ** (2 * u)) / SR) * 0.18
    return x * u ** 2.6, dur
def bell(p=1.0, seed=0, dur=3.0):
    t = tt(dur); f0 = 587.33 * p; x = np.zeros_like(t)
    for r, a, dec in ((1, 1, 1.1), (2, .55, 1.6), (2.72, .45, 2.2), (3.97, .32, 3.0), (5.38, .22, 4.2), (.5, .25, .9)):
        for beat in (-0.6, 0.6): x += a * np.sin(2 * np.pi * (f0 * r + beat) * t) * np.exp(-t * dec)
    return (x / 4 + bp(rng.standard_normal(len(t)), 2000, 9000) * np.exp(-t * 220) * 0.6) * np.minimum(t / 0.0015, 1), 0
def shimmer(p=1.0, seed=0, dur=1.2):   # glassy upward sparkle (FM bells, staggered)
    out = np.zeros(int(dur * SR) + SR // 2)
    for k, m in enumerate([0, 4, 7, 12, 16, 19, 24]):
        t = tt(0.6); f = 1046.5 * p * 2 ** (m / 12)
        y = np.sin(2 * np.pi * f * t + 1.6 * np.exp(-t * 18) * np.sin(2 * np.pi * 3 * f * t)) * np.exp(-t * 7) * 0.35
        i = int(k * 0.055 * SR); out[i:i + len(y)] += y[: len(out) - i]
    return out, 0
def count(p=1.0, seed=0, dur=0.6, n=30):  # n ticks, eased like a count-up (power2.out)
    out = np.zeros(int((dur + 0.1) * SR)); last = 0
    for i in range(1, int(dur * SR / 64)):
        u = i * 64 / SR / dur; v = int(round(n * (1 - (1 - u) ** 2)))
        if v > last:
            last = v; y, _ = tick(1.0 + 0.4 * v / n, 900 + v); j = int(i * 64); out[j:j + len(y)] += y[: len(out) - j] * (0.7 + 0.5 * v / n)
    return out, 0
SYN = {'tick': tick, 'click': click, 'pop': pop, 'thump': thump, 'whoosh': whoosh, 'riser': riser, 'bell': bell, 'shimmer': shimmer, 'count': count}

# ---------------------------------------------------------------- library
INDEX = {}
for root in (LIB, FALLBACK):
    ip = os.path.join(root, 'index.json')
    if os.path.exists(ip):
        for k, v in json.load(open(ip, encoding='utf-8')).items():
            INDEX.setdefault(k, os.path.join(root, v['file'].replace('sfx/', '', 1).replace('/', os.sep)))
    for f in glob.glob(os.path.join(root, '**', '*.mp3'), recursive=True):
        INDEX.setdefault(os.path.splitext(os.path.basename(f))[0], f)
def load(name):
    if name not in INDEX: raise SystemExit(f'sfx "{name}" not in library ({LIB}); have: {", ".join(sorted(INDEX)[:60])}')
    x, sr = sf.read(INDEX[name], always_2d=True)
    if sr != SR: x = signal.resample_poly(x, SR, sr, axis=0)
    return np.repeat(x, 2, 1) if x.shape[1] == 1 else x[:, :2]
def env_of(x):
    e = np.abs(x).max(1); w = int(0.005 * SR); return np.convolve(e, np.ones(w) / w, 'same')

# ---------------------------------------------------------------- place every declared event
placed = []
events = []
for ev in TL.get('sfx', []):
    if 'every' in ev:
        t = float(ev['at'])
        while t < float(ev['to']) - 1e-9: events.append({**ev, 'at': round(t, 5), 'every': None}); t += float(ev['every'])
    else: events.append(ev)
for k, ev in enumerate(events):
    g = db(float(ev.get('gain', -12))); pan = float(ev.get('pan', 0))
    if 'ticks' in ev:
        if not os.path.exists(ev['ticks']):   # not exported yet (fresh scaffold): the rest of the sound still builds
            print(f"WARNING: {ev['ticks']} missing — export the physics events (src/physics.js) and rerun; skipped"); continue
        data = json.load(open(ev['ticks'], encoding='utf-8'))
        if isinstance(data, dict): data = data[ev.get('key', next(iter(data)))]
        times = [d['t'] if isinstance(d, dict) else float(d) for d in data]
        for i, tm in enumerate(times):
            d = data[i] if isinstance(data[i], dict) else {}
            rate = 1 / max(1e-3, tm - times[i - 1]) if i else 10
            gg = min(1.0, (16 / rate) ** 0.55) * (0.95 if rate < 8 else 0.75) * (0.8 if d.get('dir', 1) < 0 else 1) * float(d.get('g', 1))
            y, lead = SYN[ev.get('synth', 'tick')](float(ev.get('pitch', 1)), 100 + i)
            place(y, tm - lead, g * gg, pan)
        placed.append((times[0] if times else 0, f"{len(times)} × {ev.get('synth', 'tick')} from {ev['ticks']}"))
        continue
    at = float(ev['at'])
    if 'lib' in ev:
        x = load(ev['lib'])
        if ev.get('maxlen'):
            n = int(float(ev['maxlen']) * SR); x = x[:n].copy(); f = int(float(ev.get('fade', 0.15)) * SR)
            if f and len(x) > f: x[-f:] *= np.linspace(1, 0, f)[:, None]
        e = env_of(x); pk = int(np.argmax(e))
        off = pk if ev.get('align') == 'peak' else int(np.argmax(e > 0.25 * e[pk]))
        place(x, at - off / SR, g, 0); placed.append((at, f"lib {ev['lib']} ({ev.get('align', 'onset')}) {ev.get('gain', -12)} dB"))
    else:
        kw = {k2: float(ev[k2]) for k2 in ('dur',) if k2 in ev}
        y, lead = SYN[ev['synth']](float(ev.get('pitch', 1)), 7 + k, **kw)
        place(y, at - lead, g, pan); placed.append((at, f"synth {ev['synth']} {ev.get('gain', -12)} dB"))

sf.write(f'{OUT}/sfx.wav', sfx.astype(np.float32), SR, subtype='FLOAT')
pk = np.abs(sfx).max()
print(f'sfx.wav  {len(placed)} events  peak {20 * np.log10(pk + 1e-12):.1f} dBFS')
for t, what in sorted(placed): print(f'  {t:7.3f}s  {what}')
