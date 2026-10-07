# Original score, synthesized in code, on a bar grid. Run from the project root:
#   python tools/score.py              → assets/audio/music.wav + assets/audio/beats.json
#   python tools/score.py --analyze    → beats.json from a supplied assets/audio/music.wav (librosa if present)
# Reads timeline.json: bpm, duration, music{style, key, chords[], sections[{at(s), kind}], accents[s], melody, seed}.
# Styles: modern | cinematic | festive | minimal. Section kinds: intro | full | build | gap | drop | outro.
import json, os, re, sys
import numpy as np, soundfile as sf
from scipy import signal

TL = json.load(open('timeline.json', encoding='utf-8'))
SR = 48000
DUR = float(TL['duration']); BPM = float(TL.get('bpm', 120))
BEAT = 60 / BPM; BAR = 4 * BEAT; S16 = BEAT / 4
N = int(SR * DUR); NBAR = int(np.ceil(DUR / BAR))
MU = TL.get('music', {}) or {}
STYLE = MU.get('style', 'modern')
rng = np.random.default_rng(int(MU.get('seed', 7)))
OUT = 'assets/audio'; os.makedirs(OUT, exist_ok=True)

def write_beats(src='synth'):
    beats = [round(i * BEAT, 5) for i in range(int(DUR / BEAT) + 1)]
    secs = [{'at': round(s['at'], 4), 'kind': s['kind']} for s in sections()]
    json.dump({'bpm': BPM, 'beat': BEAT, 'bar': BAR, 'beats': beats, 'bars': beats[::4], 'sections': secs, 'source': src},
              open(f'{OUT}/beats.json', 'w'), indent=1)

def sections():
    raw = MU.get('sections') or [{'at': 0, 'kind': 'full'}]
    out = []
    for s in raw:
        at = float(s['at']); k = s['kind']
        if k != 'gap':                                       # snap to the nearest beat; warn when off the bar grid
            at = np.floor(at / BEAT + 0.5) * BEAT
            if abs(at / BAR - round(at / BAR)) > 1e-6: print(f'note: section {k} at {at:g}s is not on a bar line')
        out.append({'at': at, 'kind': k})
    return sorted(out, key=lambda s: s['at'])

if '--analyze' in sys.argv:
    y, sr = sf.read(f'{OUT}/music.wav', always_2d=True)
    try:
        import librosa
        tempo, frames = librosa.beat.beat_track(y=y.mean(1).astype(np.float32), sr=sr)
        bt = librosa.frames_to_time(frames, sr=sr).tolist()
        json.dump({'bpm': float(np.atleast_1d(tempo)[0]), 'beats': bt, 'bars': bt[::4], 'source': 'analyzed'}, open(f'{OUT}/beats.json', 'w'), indent=1)
        print('analyzed', len(bt), 'beats at', float(np.atleast_1d(tempo)[0]), 'bpm')
    except Exception as e:
        print('librosa unavailable, nominal grid from timeline bpm:', e); write_beats('nominal')
    sys.exit(0)

# ------------------------------------------------------------------------------------------------ dsp helpers
def tt(d): return np.arange(int(d * SR)) / SR
def midi(m): return 440.0 * 2 ** ((m - 69) / 12)
NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}
def nm(s): m = re.match(r'^([A-G][#b]?)(-?\d)$', s); return 12 * (int(m[2]) + 1) + NOTE[m[1]]
def noise(n): return rng.standard_normal(n)
def bp(x, lo, hi, o=2): return signal.sosfilt(signal.butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def hp(x, f, o=2): return signal.sosfilt(signal.butter(o, f, 'highpass', fs=SR, output='sos'), x)
def lp(x, f, o=2): return signal.sosfilt(signal.butter(o, f, 'lowpass', fs=SR, output='sos'), x)
def buf(): return np.zeros((N, 2))
def place(dst, x, at, gain=1.0, pan=0.0):
    i = int(round(at * SR))
    if x.ndim == 1: x = np.stack([x * np.sqrt(1 - pan), x * np.sqrt(1 + pan)], 1)
    if i < 0: x, i = x[-i:], 0
    j = min(N, i + len(x))
    if j > i: dst[i:j] += x[: j - i] * gain
db = lambda x: 10 ** (x / 20)

# ------------------------------------------------------------------------------------------------ instruments
def kick(big=False):
    t = tt(0.6 if big else 0.42); f = 46 + (130 if big else 105) * np.exp(-t * 26)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * (4.5 if big else 7.5))
    return np.tanh((body + hp(noise(len(t)), 2500) * np.exp(-t * 900) * 0.28) * 1.7)
def tom(p=1.0, g=1.0):          # dhol bass head / taiko-ish tom
    t = tt(0.55); f = (54 + 22 * np.exp(-t * 18)) * p; ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t * 5.5) + 0.35 * np.sin(ph * 2.31) * np.exp(-t * 16) + 0.3 * lp(noise(len(t)), 500) * np.exp(-t * 45)
    return np.tanh(x * 1.4) * g
def tilli(g=1.0, bright=1.0):   # stick crack (dhol treble side / rim)
    t = tt(0.16); f = 410 * (1 + 0.18 * np.exp(-t * 70))
    return (0.55 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 32) + 0.9 * bright * bp(noise(len(t)), 1700, 6500) * np.exp(-t * 60)) * g
def clap(g=1.0):
    t = tt(0.32); n = bp(noise(len(t)), 900, 3600)
    env = sum(np.where(t >= o, np.exp(-(t - o) * 330), 0) for o in (0, 0.009, 0.019)) + np.where(t >= 0.022, np.exp(-(t - 0.022) * 18) * 0.45, 0)
    return n * env * g
def hat(g=1.0, open_=False):
    t = tt(0.22 if open_ else 0.06); n = hp(noise(len(t)), 7000, 4)
    return n * np.minimum(t / 0.004, 1) * np.exp(-t * (14 if open_ else 60)) * g
def crash(g=1.0, d=2.2):
    t = tt(d); n = hp(noise(len(t)), 4200) + 0.4 * bp(noise(len(t)), 3000, 9000)
    return n * np.exp(-t * 2.1) * np.minimum(t / 0.002, 1) * g
def bass(m, d=0.25, g=1.0):
    t = tt(d + 0.03); f = midi(m)
    x = np.sin(2 * np.pi * f * t) + 0.32 * np.sin(4 * np.pi * f * t) + 0.08 * np.sin(6 * np.pi * f * t)
    env = np.minimum(t / 0.004, 1) * np.exp(-t * (2.4 if d > 0.4 else 5.0)) * np.clip((d + 0.03 - t) / 0.03, 0, 1)
    return np.tanh(x * env * 1.5) * g
def ks(m, d, decay=0.996, bright=0.6, buzz=0.0):   # Karplus-Strong pluck; buzz = sitar/tanpura bridge rattle
    f = midi(m); L = max(2, int(round(SR / f))); n = int(d * SR) + L
    exc = np.zeros(n); exc[:L] = lp(noise(L) * np.hanning(L), 1200 + 6000 * bright)
    a = np.zeros(L + 2); a[0] = 1; a[L] = -decay * 0.5; a[L + 1] = -decay * 0.5
    y = signal.lfilter([1.0], a, exc)[: int(d * SR)]; y /= np.abs(y).max() + 1e-9
    t = tt(d)
    if buzz > 0: y = y + hp(np.abs(y) - np.abs(y).mean(), 1500) * buzz + bp(y, 900, 4200) * buzz * 0.6 * np.exp(-t * 3)
    return y * np.clip((d - t) / 0.02, 0, 1)
def pad(ms, d, g=1.0, bright=1400, attack=0.35):
    t = tt(d); x = np.zeros_like(t)
    for m in ms:
        for det in (-0.07, 0.0, 0.06):
            ff = midi(m) * 2 ** (det / 12)
            for h in range(1, 14): x += np.sin(2 * np.pi * ff * h * t + h * 0.7) / h * (0.92 ** h)
    x = lp(x, bright)
    return x / (len(ms) * 6) * np.minimum(t / attack, 1) * np.clip((d - t) / 0.4, 0, 1) * g
def bell(f0, d=3.0, g=1.0):
    t = tt(d); x = np.zeros_like(t)
    for r, a, dec in ((1, 1, 1.1), (2, .55, 1.6), (2.72, .45, 2.2), (3.97, .32, 3.0), (5.38, .22, 4.2), (6.81, .14, 5.5), (.5, .25, .9)):
        for beat in (-0.6, 0.6): x += a * np.sin(2 * np.pi * (f0 * r + beat) * t) * np.exp(-t * dec)
    return (x / 4 + bp(noise(len(t)), 2000, 9000) * np.exp(-t * 220) * 0.6) * np.minimum(t / 0.0015, 1) * g
def riser(d, g=1.0):
    t = tt(d); u = t / d; n = noise(len(t)); y = np.zeros_like(n); z = 0.0
    a = 1 - np.exp(-2 * np.pi * (300 + 7500 * u ** 2.3) / SR)
    for i in range(len(n)): z += a[i] * (n[i] - z); y[i] = z
    return (hp(y, 200) + np.sin(2 * np.pi * np.cumsum(220 * 2 ** (2.2 * u)) / SR) * 0.25) * u ** 2.4 * g
def braam(ms, d, g=1.0):        # cinematic swell: low detuned saws opening up
    t = tt(d); x = np.zeros_like(t)
    for m in ms:
        for det in (-0.12, 0, 0.1):
            ff = midi(m) * 2 ** (det / 12)
            for h in range(1, 18): x += np.sin(2 * np.pi * ff * h * t) / h
    cut = 300 + 2500 * np.minimum(t / (d * 0.6), 1) ** 2
    y = np.zeros_like(x); z = 0.0; a = 1 - np.exp(-2 * np.pi * cut / SR)
    for i in range(len(x)): z += a[i] * (x[i] - z); y[i] = z
    return np.tanh(y / len(ms) * 0.4) * np.minimum(t / 0.6, 1) * np.clip((d - t) / 0.5, 0, 1) * g

# ------------------------------------------------------------------------------------------------ harmony
def chord(sym):
    m = re.match(r'^([A-G][#b]?)(m(?!aj))?(.*)$', sym); pc = NOTE[m[1]]; minor = bool(m[2]); ext = m[3]
    iv = [0, 3 if minor else 4, 7, 12]
    if 'sus4' in ext: iv[1] = 5
    if 'sus2' in ext: iv[1] = 2
    if 'maj7' in ext: iv[3] = 11
    elif '7' in ext: iv[3] = 10
    if 'add9' in ext: iv[3] = 14
    root_bass = 36 + ((pc - 0) % 12)              # C2..B2
    voicing = [60 + ((pc + i) % 12) if i < 12 else 72 + ((pc + i - 12) % 12) for i in iv]
    return root_bass, sorted(voicing), pc
CH = [chord(c) for c in (MU.get('chords') or ['C', 'G', 'Am', 'F'])]
KEY = NOTE[MU.get('key', 'C')]
SCALE = [(KEY + s) % 12 for s in ([0, 2, 4, 5, 7, 9, 10] if STYLE == 'festive' else [0, 2, 4, 5, 7, 9, 11])]
SECS = sections()
def kind_at(t):
    k = SECS[0]['kind']
    for s in SECS:
        if s['at'] <= t + 1e-9: k = s['kind']
    return k
GAPS = [(s['at'], next((x['at'] for x in SECS if x['at'] > s['at']), DUR)) for s in SECS if s['kind'] == 'gap']
in_gap = lambda t: any(a - 1e-6 <= t < b for a, b in GAPS)
next_sec = lambda t: next((s['at'] for s in SECS if s['at'] > t + 1e-6), DUR)

def auto_melody(bar, kind):
    _, voic, pc = CH[bar % len(CH)]
    tones = sorted({v for v in voic} | {v + 12 for v in voic[:2]})
    r = np.random.default_rng(1000 + bar)
    if kind == 'intro': pos = [0, 2, 4, 6, 8, 10, 12, 14]
    else: pos = [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15]
    out, i = [], int(r.integers(0, len(tones)))
    for p in pos:
        step = int(r.choice([-1, 1, 1, 2, -2, 0]))
        i = int(np.clip(i + step, 0, len(tones) - 1))
        n = tones[i]
        if p % 4 in (1, 3) and r.random() < 0.4:          # passing tone from the key's scale
            cands = [n + d for d in (-2, -1, 1, 2) if (n + d) % 12 in SCALE]
            if cands: n = cands[int(r.integers(0, len(cands)))]
        out.append((p, n + (12 if kind in ('drop',) else 0)))
    return out
def melody(bar, kind):
    m = MU.get('melody', 'auto')
    if isinstance(m, dict) and str(bar) in m: return [(int(a), nm(b)) for a, b in (x.split(':') for x in m[str(bar)].split())]
    return auto_melody(bar, kind)

# ------------------------------------------------------------------------------------------------ arrangement
drums, perc, bassb, lead, padb, drone, fx = (buf() for _ in range(7))
festive, cine = STYLE == 'festive', STYLE == 'cinematic'
for bar in range(NBAR):
    t0 = bar * BAR; root, voic, pc = CH[bar % len(CH)]
    for s in range(16):
        t = t0 + s * S16
        if t >= DUR or in_gap(t): continue
        k = kind_at(t)
        if k == 'intro':
            if festive and s in (0, 10): place(perc, tom(1, 0.55), t, pan=-0.1)
            if cine and s in (0,): place(perc, tom(0.8, 0.7), t)
            if s % 4 == 2: place(perc, hat(0.25), t, pan=0.3)
            if festive and s % 2 == 0: place(perc, tilli(0.2, 0.8), t, pan=0.2)
        elif k in ('full', 'drop') or (k == 'outro' and t < next_sec(t) - BAR):
            if not cine or k == 'drop':
                if s % 4 == 0: place(drums, kick(), t)
                if s in (4, 12): place(perc, clap(0.62), t, pan=0.05)
            if cine:
                if s in (0, 8): place(perc, tom(0.8, 0.85), t, pan=-0.1)
                if s in (6, 14): place(perc, tom(1.15, 0.5), t, pan=0.15)
            if festive:
                if s in (0, 6, 8, 11, 14): place(perc, tom(1, 0.75 if s in (0, 8) else 0.5), t, pan=-0.12)
                if s in (2, 4, 7, 10, 12, 15): place(perc, tilli(0.55 if s in (4, 12) else 0.32), t, pan=0.18)
            if STYLE != 'minimal' or s % 2 == 0: place(perc, hat([0.34, 0.16, 0.26, 0.16][s % 4]), t, pan=0.3 if s % 2 else -0.28)
            if s in (0, 6, 8, 11, 12, 14):
                m = root + (12 if s in (6, 14) else (7 if s == 11 else 0))
                place(bassb, bass(m, 0.32 if s in (0, 8) else 0.12, 0.85), t)
        elif k == 'build':
            s0 = [x['at'] for x in SECS if x['at'] <= t + 1e-9][-1]
            u = float(np.clip((t - s0) / max(1e-3, next_sec(t) - s0), 0, 1))
            if s % 4 == 0: place(drums, kick(), t)
            stepn = 2 if u < 0.5 else 1
            if s % stepn == 0: place(perc, (tom(1.1, 0.25 + 0.4 * u) if cine else tilli(0.25 + 0.45 * u, 1 + 0.6 * u)), t, pan=0.15)
            if u > 0.75: place(perc, tilli(0.3 + 0.4 * u, 1.4), t + S16 / 2, pan=-0.15)
            if s % 2 == 0: place(bassb, bass(root, 0.1, 0.55 + 0.35 * u), t)
            place(perc, hat(0.18 + 0.2 * u), t, pan=0.3)
    k0 = kind_at(t0 + 1e-3)
    if k0 in ('full', 'drop', 'outro') and STYLE != 'minimal':
        place(padb, pad(voic, BAR + 0.3, 1.0 if not cine else 1.4), t0)
    if k0 in ('intro', 'full', 'drop'):
        for s, m in melody(bar, k0):
            t = t0 + s * S16
            if t >= DUR or in_gap(t): continue
            place(lead, ks(m, 0.9, 0.9965, 0.55, buzz=0.35 if festive else 0.0), t, 0.6, pan=-0.18 + 0.03 * (s % 4))
    if k0 == 'build':
        arp = [voic[0], voic[1], voic[2], voic[1]]
        for s in range(16):
            t = t0 + s * S16
            if t >= DUR or in_gap(t): continue
            place(lead, ks(arp[s % 4] + (12 if s >= 8 else 0), 0.35, 0.993, 0.7, buzz=0.25 if festive else 0), t, 0.45, pan=0.12)

if festive or cine:   # tanpura-like drone (festive) / low pulse (cinematic) under intro, build and outro
    for t in np.arange(0, DUR, BEAT):
        k = kind_at(t)
        if in_gap(t) or k in ('full', 'drop'): continue
        i = int(round(t / BEAT)) % 4
        if festive:
            m = [KEY + 43, KEY + 48, KEY + 48, KEY + 36][i] if KEY < 6 else [KEY + 31, KEY + 36, KEY + 36, KEY + 24][i]   # Pa Sa Sa Sa
            place(drone, ks(m, 2.4, 0.9992, 0.35, buzz=0.55), t, 0.32, pan=[-.5, -.15, .15, .5][i])
        else:
            place(drone, bass(CH[int(t // BAR) % len(CH)][0], 0.18, 0.5), t)
for s in SECS:            # section punctuation
    if s['kind'] in ('drop',): place(drums, kick(True), s['at'], 1.3); place(fx, crash(0.45), s['at'], pan=0.2); place(bassb, bass(CH[int(s['at'] // BAR) % len(CH)][0] - 12, 1.8, 1.0), s['at'])
    if s['kind'] == 'build':
        d = next_sec(s['at']) - s['at']; place(fx, riser(max(0.6, d - 0.08), 0.5), s['at'])
    if s['kind'] == 'gap':
        place(drums, kick(), s['at'] - 0.001, 0.9); place(perc, clap(0.7), s['at'] - 0.001)
    if cine and s['kind'] in ('full', 'drop'): place(fx, braam([CH[int(s['at'] // BAR) % len(CH)][0] + 12], 2.4, 0.5), s['at'])
for a in MU.get('accents', []):
    a = float(a); f0 = midi(60 + KEY + 12)
    place(fx, bell(f0, 3.0, 0.9), a); place(fx, bell(f0 * 1.5, 2.4, 0.3), a + 0.002, pan=0.25); place(fx, crash(0.3), a, pan=0.2)
outro = [s for s in SECS if s['kind'] == 'outro']
if outro:                 # the final chord rings out
    t = outro[-1]['at']; _, voic, _ = CH[int(t // BAR) % len(CH)]
    for k, n in enumerate([voic[0] - 12] + voic): place(lead, ks(n, min(2.4, DUR - t), 0.9985, 0.5, buzz=0.3 if festive else 0), t + k * 0.018, 0.5, pan=-0.3 + k * 0.12)
    place(padb, pad(voic, max(0.5, DUR - t), 1.2), t); place(bassb, bass(CH[int(t // BAR) % len(CH)][0], max(0.4, DUR - t - 0.1), 0.9), t)

# ------------------------------------------------------------------------------------------------ mix the score
kenv = np.abs(drums[:, 0]); duck = np.ones(N); L_ = int(0.3 * SR)
for i in np.where((kenv[1:] > 0.3) & (kenv[:-1] <= 0.3))[0]:
    e = 1 - 0.5 * np.exp(-np.arange(L_) / (0.06 * SR)); seg = duck[i:i + L_]; seg[:] = np.minimum(seg, e[:len(seg)])
bassb *= (0.35 + 0.65 * duck)[:, None]; padb *= (0.55 + 0.45 * duck)[:, None]
def reverb(x, secs=2.0, seed=11):
    r = np.random.default_rng(seed); t = tt(secs); out = []
    for ch in range(2):
        ir = lp(r.standard_normal(len(t)) * np.exp(-t * 6.5 / secs), 5200); ir[: int(0.018 * SR)] = 0; ir /= np.sqrt((ir ** 2).sum())
        out.append(signal.fftconvolve(x[:, ch], ir)[:N])
    return np.stack(out, 1)
send = lead * 0.5 + perc * 0.25 + fx * 0.35 + drone * 0.4
music = (drums * db(-4) + perc * db(-6) + bassb * db(-6) + lead * db(-7) + drone * db(-12) + padb * db(-15) + fx * db(-6)
         + reverb(send) * 0.32)
music = hp(music.T, 25).T
HIT = 0.12                                                                       # a gap = this much stop-time hit, then silence
for a, b in GAPS: music[int((a + HIT) * SR): int(b * SR)] = 0.0                  # a true stop before the payoff
fade = int(0.35 * SR); music[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 2
music /= np.abs(music).max() / db(-1)
sf.write(f'{OUT}/music.wav', music.astype(np.float32), SR, subtype='FLOAT')
write_beats()
rms = lambda a, b: 20 * np.log10(np.sqrt((music[int(a * SR):int(b * SR)] ** 2).mean()) + 1e-9)
print(f'music.wav  {DUR:g}s  {BPM:g} bpm  style={STYLE}  bars={NBAR}')
for i, s in enumerate(SECS):
    e = SECS[i + 1]['at'] if i + 1 < len(SECS) else DUR
    if e - s['at'] < 0.05: print(f"  WARNING: section {s['kind']} at {s['at']:g}s has no length"); continue
    if s['kind'] == 'gap' and e - s['at'] > HIT:   # the silence is what must sit >= 30 dB under the drop, so report it apart
        print(f"  {s['at']:6.2f}-{e:6.2f}s  gap     hit {rms(s['at'], s['at'] + HIT):6.1f} / silence {rms(s['at'] + HIT, e):6.1f} dBFS rms"); continue
    print(f"  {s['at']:6.2f}-{e:6.2f}s  {s['kind']:6s}  {rms(s['at'], e):6.1f} dBFS rms")
