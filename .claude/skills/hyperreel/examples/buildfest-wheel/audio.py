# Score + sound design for the Shubh Griha spin reel, all synthesized here except the licensed library one-shots.
# Run from the project root:  python tools/audio.py
#   → assets/audio/music.wav, sfx.wav, mix.wav (-14 LUFS integrated, true peak <= -1 dBTP, 48 kHz 24-bit)
# 120 bpm, D mixolydian. Bar = 2.0 s. Timeline (film seconds):
#   0-4 intro (tanpura, sitar pluck, light dhol, bell) · 4 title drop · 8-16 rings groove · 16-21.5 build (wind-up, launch at 17,
#   dhol roll + riser) · 21.5-22 silence (only the last ratchet ticks) · 22 DROP on the landing · 22-28 groove · 28 final chord.
import json, os, subprocess
import numpy as np, soundfile as sf
from scipy import signal

SR, DUR = 48000, 30.0
N = int(SR * DUR)
BPM = 120; BEAT = 60 / BPM; BAR = 4 * BEAT; S16 = BEAT / 4
SFXLIB = r'D:\Hyperframes\sfx'
OUT = 'assets/audio'
rng = np.random.default_rng(2026)

def tt(d): return np.arange(int(d * SR)) / SR
def midi(m): return 440.0 * 2 ** ((m - 69) / 12)
NOTE = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}
def nm(s):   # 'F#4' → midi
    name, octv = (s[:-1], int(s[-1])); return 12 * (octv + 1) + NOTE[name]
def noise(n): return rng.standard_normal(n)
def bp(x, lo, hi, order=2): return signal.sosfilt(signal.butter(order, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def hp(x, f, order=2): return signal.sosfilt(signal.butter(order, f, 'highpass', fs=SR, output='sos'), x)
def lp(x, f, order=2): return signal.sosfilt(signal.butter(order, f, 'lowpass', fs=SR, output='sos'), x)
def buf(): return np.zeros((N, 2))
def place(dst, x, at, gain=1.0, pan=0.0):
    i = int(round(at * SR))
    if x.ndim == 1: x = np.stack([x * np.sqrt(0.5 * (1 - pan)), x * np.sqrt(0.5 * (1 + pan))], 1) * np.sqrt(2)
    if i < 0: x, i = x[-i:], 0
    j = min(N, i + len(x))
    if j > i: dst[i:j] += x[: j - i] * gain
def db(x): return 10 ** (x / 20)

# ------------------------------------------------------------------------------------------ instruments
def kick(big=False):
    t = tt(0.6 if big else 0.42)
    f = 46 + (130 if big else 105) * np.exp(-t * 26)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * (4.5 if big else 7.5))
    click = hp(noise(len(t)), 2500) * np.exp(-t * 900) * 0.28
    return np.tanh((body + click) * 1.7)

def dagga(g=1.0):          # dhol bass head: pitched thud with a slap overtone
    t = tt(0.5); f = 54 + 22 * np.exp(-t * 18)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t * 5.5) + 0.35 * np.sin(ph * 2.31) * np.exp(-t * 16) + 0.3 * lp(noise(len(t)), 500) * np.exp(-t * 45)
    return np.tanh(x * 1.4) * g

def tilli(g=1.0, bright=1.0):   # dhol treble side, stick crack
    t = tt(0.16); f = 410 * (1 + 0.18 * np.exp(-t * 70))
    x = 0.55 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 32) + 0.9 * bright * bp(noise(len(t)), 1700, 6500) * np.exp(-t * 60)
    return x * g

def clap(g=1.0):
    t = tt(0.32); n = bp(noise(len(t)), 900, 3600)
    env = sum(np.where(t >= o, np.exp(-(t - o) * 330), 0) for o in (0, 0.009, 0.019)) + np.where(t >= 0.022, np.exp(-(t - 0.022) * 18) * 0.45, 0)
    return n * env * g

def shaker(g=1.0):
    t = tt(0.07); n = hp(noise(len(t)), 6500, 4)
    return n * np.minimum(t / 0.006, 1) * np.exp(-t * 55) * g

def crash(g=1.0, d=2.2):
    t = tt(d); n = hp(noise(len(t)), 4200, 2) + 0.4 * bp(noise(len(t)), 3000, 9000)
    return n * np.exp(-t * 2.1) * np.minimum(t / 0.002, 1) * g

def bass(m, d=0.25, g=1.0):
    t = tt(d + 0.03); f = midi(m)
    x = np.sin(2 * np.pi * f * t) + 0.32 * np.sin(4 * np.pi * f * t) + 0.08 * np.sin(6 * np.pi * f * t)
    env = np.minimum(t / 0.004, 1) * np.exp(-t * (2.4 if d > 0.4 else 5.0)) * np.clip((d + 0.03 - t) / 0.03, 0, 1)
    return np.tanh(x * env * 1.5) * g

def ks(m, d, decay=0.996, bright=0.6, buzz=0.0):
    """Karplus-Strong pluck via lfilter; buzz adds a jawari-like bridge rattle (sitar / tanpura)."""
    f = midi(m); L = max(2, int(round(SR / f)))
    n = int(d * SR) + L
    exc = np.zeros(n); burst = noise(L) * np.hanning(L)
    exc[:L] = lp(burst, 1200 + 6000 * bright)
    a = np.zeros(L + 2); a[0] = 1; a[L] = -decay * 0.5; a[L + 1] = -decay * 0.5
    y = signal.lfilter([1.0], a, exc)[: int(d * SR)]
    y /= (np.abs(y).max() + 1e-9)
    if buzz > 0:   # bridge rattle: rectified, high-passed copy of the string, fading with it
        t = tt(d)
        rattle = hp(np.abs(y) - np.abs(y).mean(), 1500) * buzz
        sweep = bp(y, 900, 4200) * buzz * 0.6 * np.exp(-t * 3)
        y = y + rattle + sweep
    t = tt(d)
    return y * np.clip((d - t) / 0.02, 0, 1)

def pad(ms, d, g=1.0):
    t = tt(d); x = np.zeros_like(t)
    for m in ms:
        f = midi(m)
        for det in (-0.07, 0.0, 0.06):
            ff = f * 2 ** (det / 12)
            for h in range(1, 14):
                x += np.sin(2 * np.pi * ff * h * t + h * 0.7) / h * (0.92 ** h)
    x = lp(x, 1400, 2)
    env = np.minimum(t / 0.35, 1) * np.clip((d - t) / 0.4, 0, 1)
    return x / (len(ms) * 6) * env * g

def bell(f0, d=3.0, g=1.0):   # temple bell: inharmonic partials with beating
    t = tt(d); x = np.zeros_like(t)
    for ratio, amp, dec in ((1.0, 1.0, 1.1), (2.0, 0.55, 1.6), (2.72, 0.45, 2.2), (3.97, 0.32, 3.0), (5.38, 0.22, 4.2), (6.81, 0.14, 5.5), (0.5, 0.25, 0.9)):
        for beat in (-0.6, 0.6):
            x += amp * np.sin(2 * np.pi * (f0 * ratio + beat) * t) * np.exp(-t * dec)
    strike = bp(noise(len(t)), 2000, 9000) * np.exp(-t * 220) * 0.6
    return (x / 4 + strike) * np.minimum(t / 0.0015, 1) * g

def riser(d, g=1.0):
    t = tt(d); u = t / d; n = noise(len(t)); y = np.zeros_like(n); z = 0.0
    a = 1 - np.exp(-2 * np.pi * (300 + 7500 * u ** 2.3) / SR)
    for i in range(len(n)): z += a[i] * (n[i] - z); y[i] = z
    tone = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (2.2 * u)) / SR) * 0.25
    return (hp(y, 200) + tone) * u ** 2.4 * g

def reverb(x, secs=1.9, seed=7, wet=1.0):
    r = np.random.default_rng(seed); t = tt(secs); out = []
    for ch in range(2):
        ir = r.standard_normal(len(t)) * np.exp(-t * 6.5 / secs)
        ir = lp(ir, 5200); ir[: int(0.018 * SR)] = 0; ir /= np.sqrt((ir ** 2).sum())
        out.append(signal.fftconvolve(x[:, ch], ir)[:N])
    return np.stack(out, 1) * wet

# ------------------------------------------------------------------------------------------ arrangement
CHORDS = ['D', 'D', 'D', 'C', 'G', 'D', 'Bm', 'Asus4', 'G', 'Asus4', 'Asus4', 'D', 'G', 'Asus4', 'D']
ROOT = {'D': nm('D2'), 'C': nm('C2'), 'G': nm('G2'), 'Bm': nm('B1'), 'Asus4': nm('A2')}
PADV = {'D': ['D3', 'F#3', 'A3', 'D4'], 'C': ['C3', 'E3', 'G3', 'C4'], 'G': ['G2', 'B2', 'D3', 'G3'], 'Bm': ['B2', 'D3', 'F#3', 'B3'], 'Asus4': ['A2', 'D3', 'E3', 'A3']}
MEL = {
    0: '0:D4 2:A4 4:D5 6:A4 8:C5 10:A4 12:G4 14:A4',
    1: '0:F#4 2:A4 4:D5 6:E5 8:F#5 10:E5 12:D5 14:A4',
    2: '0:D5 2:C5 3:D5 4:A4 6:G4 7:A4 8:F#4 10:G4 11:A4 12:C5 14:B4 15:A4',
    3: '0:C5 2:G4 3:C5 4:E5 6:D5 7:C5 8:G4 10:A4 11:B4 12:C5 14:E5 15:D5',
    4: '0:D5 2:B4 3:D5 4:G5 6:F#5 7:E5 8:D5 10:B4 11:C5 12:D5 14:E5 15:D5',
    5: '0:F#5 2:E5 3:D5 4:A4 6:D5 7:E5 8:F#5 10:A5 11:G5 12:F#5 14:E5 15:D5',
    6: '0:D5 2:B4 3:D5 4:F#5 6:E5 7:D5 8:B4 10:A4 11:B4 12:D5 14:E5',
    7: '0:E5 2:D5 3:E5 4:A5 6:G5 7:E5 8:D5 10:E5 11:G5 12:A5 14:G5 15:E5',
    11: '0:F#5 2:E5 3:D5 4:A4 6:D5 7:E5 8:F#5 10:A5 11:G5 12:F#5 14:E5 15:D5',
    12: '0:D5 2:B4 3:D5 4:G5 6:F#5 7:E5 8:D5 10:B4 11:C5 12:D5 14:E5 15:D5',
    13: '0:E5 2:D5 3:E5 4:A5 6:G5 7:E5 8:D5 10:E5 11:G5 12:A5 14:B5 15:A5',
}
def parse(s): return [(int(a), nm(b)) for a, b in (p.split(':') for p in s.split())]

kickb, dhol, perc, bassb, lead, drone, padb, fx = (buf() for _ in range(8))
GAP0, GAP1 = 21.5, 22.0
in_gap = lambda t: GAP0 - 1e-6 <= t < GAP1

def sect(bar):
    if bar <= 1: return 'intro'
    if bar <= 7: return 'full'
    if bar <= 10: return 'build'
    if bar <= 13: return 'drop'
    return 'outro'

for bar in range(15):
    t0 = bar * BAR; kind = sect(bar); ch = CHORDS[bar]; root = ROOT[ch]
    for s in range(16):
        t = t0 + s * S16
        if in_gap(t): continue
        if kind == 'intro':
            if s in (0, 10): place(dhol, dagga(0.55), t, pan=-0.1)
            if s % 2 == 0: place(dhol, tilli(0.22 if s % 4 else 0.32, 0.8), t, pan=0.2)
            if s in (6, 14): place(perc, shaker(0.25), t, pan=0.35)
        elif kind in ('full', 'drop') or (kind == 'outro' and t < 28.0):
            if s % 4 == 0: place(kickb, kick(), t)
            if s in (0, 6, 8, 11, 14): place(dhol, dagga(0.75 if s in (0, 8) else 0.5), t, pan=-0.12)
            if s in (2, 4, 7, 10, 12, 15): place(dhol, tilli(0.55 if s in (4, 12) else 0.32), t, pan=0.18)
            if s in (4, 12): place(perc, clap(0.62), t, pan=0.05)
            place(perc, shaker([0.34, 0.16, 0.26, 0.16][s % 4]), t, pan=0.32 if s % 2 else -0.28)
            if s in (0, 6, 8, 11, 12, 14):
                m = root + (12 if s in (6, 14) else (7 if s == 11 else 0))
                place(bassb, bass(m, 0.32 if s in (0, 8) else 0.12, 0.85), t)
        elif kind == 'build':
            if t < 17.0:   # wind-up: the floor drops out, dagga on the beats, suspense
                if s % 4 == 0: place(dhol, dagga(0.6), t, pan=-0.1)
                if s % 2 == 0: place(dhol, tilli(0.18), t, pan=0.25)
                continue
            u = (t - 17.0) / (GAP0 - 17.0)
            if s % 4 == 0: place(kickb, kick(), t)
            step = 2 if t < 19.0 else 1
            if s % step == 0: place(dhol, tilli(0.25 + 0.45 * u, 1.0 + 0.6 * u), t, pan=0.15)
            if t >= 20.5: place(dhol, tilli(0.3 + 0.4 * u, 1.4), t + S16 / 2, pan=-0.15)   # 32nds into the gap
            if s in (0, 8): place(dhol, dagga(0.7), t, pan=-0.1)
            if s % 2 == 0: place(bassb, bass(ROOT[ch], 0.1, 0.55 + 0.35 * u), t)
            place(perc, shaker(0.18 + 0.2 * u), t, pan=0.3)
    # pad (warmth) under title / rings / drop / outro
    if kind in ('full', 'drop') or bar == 13:
        place(padb, pad([nm(x) for x in PADV[ch]], BAR + 0.3, 1.0), t0)
    # melody: sitar-ish pluck
    if bar in MEL:
        for s, m in parse(MEL[bar]):
            t = t0 + s * S16
            if in_gap(t): continue
            g = 0.55 if bar <= 1 else 0.62
            place(lead, ks(m, 0.9, 0.9965, 0.55, buzz=0.35), t, g, pan=-0.18 + 0.03 * (s % 4))
    if kind == 'build' and bar >= 8:   # climbing arpeggio into the gap
        arp = {8: ['G4', 'B4', 'D5', 'B4'], 9: ['A4', 'D5', 'E5', 'D5'], 10: ['A4', 'D5', 'E5', 'A5']}[bar]
        for s in range(16):
            t = t0 + s * S16
            if t < 17.0 or in_gap(t) or t >= GAP0: continue
            m = nm(arp[s % 4]) + (12 if (bar == 10 and s >= 8) else 0)
            place(lead, ks(m, 0.35, 0.993, 0.7, buzz=0.25), t, 0.45, pan=0.12)

# tanpura drone (Pa Sa Sa Sa), every string every 2 s; intro, rings, build, outro
for t in np.arange(0, 30, BEAT):
    if in_gap(t) or (4.0 <= t < 8.0) or (22.0 <= t < 26.0): continue
    k = int(round(t / BEAT)) % 4
    m = [nm('A2'), nm('D3'), nm('D3'), nm('D2')][k]
    place(drone, ks(m, 2.4, 0.9992, 0.35, buzz=0.55), t, 0.32, pan=[-0.5, -0.15, 0.15, 0.5][k])

# accents: bells, crashes, impacts, risers
for t, g in ((0.0, 0.9), (4.0, 0.8), (22.0, 1.0), (28.0, 0.85)):
    place(fx, bell(midi(nm('D5')), 3.2, g), t, pan=0.0)
    place(fx, bell(midi(nm('A5')), 2.6, g * 0.35), t + 0.002, pan=0.25)
for t in (4.0, 8.0, 17.0, 22.0):
    place(fx, crash(0.42 if t in (4.0, 22.0) else 0.3), t, pan=0.2)
place(kickb, kick(True), 4.0, 1.1); place(kickb, kick(True), 17.0, 1.0); place(kickb, kick(True), 22.0, 1.35)
place(bassb, bass(nm('D1') + 0, 1.8, 1.0), 22.0)       # sub on the drop
place(fx, riser(1.0, 0.35), 3.0); place(fx, riser(GAP0 - 18.0, 0.5), 18.0)
# stop-time choke at the gap: one hit, then silence
place(kickb, kick(), GAP0 - 0.001, 0.9); place(perc, clap(0.7), GAP0 - 0.001); place(bassb, bass(ROOT['Asus4'], 0.12, 0.9), GAP0 - 0.001)
# final chord at 28: strummed pluck + pad ringing out
for k, n in enumerate(['D3', 'A3', 'D4', 'F#4', 'A4', 'D5']):
    place(lead, ks(nm(n), 2.0, 0.9985, 0.5, buzz=0.3), 28.0 + k * 0.018, 0.55, pan=-0.3 + k * 0.12)
place(padb, pad([nm(x) for x in PADV['D']], 2.0, 1.2), 28.0)
place(bassb, bass(nm('D2'), 1.9, 0.9), 28.0)

# ------------------------------------------------------------------------------------------ music mix
kenv = np.abs(kickb[:, 0]); duck = np.ones(N); L_ = int(0.3 * SR)
for i in np.where((kenv[1:] > 0.3) & (kenv[:-1] <= 0.3))[0]:
    e = 1 - 0.5 * np.exp(-np.arange(L_) / (0.06 * SR)); seg = duck[i:i + L_]; seg[:] = np.minimum(seg, e[:len(seg)])
bassb *= (0.35 + 0.65 * duck)[:, None]; padb *= (0.55 + 0.45 * duck)[:, None]
send = lead * 0.5 + perc * 0.25 + fx * 0.35 + drone * 0.4 + dhol * 0.15
music = (kickb * db(-4) + dhol * db(-5) + perc * db(-8) + bassb * db(-6) + lead * db(-7) + drone * db(-12)
         + padb * db(-15) + fx * db(-6) + reverb(send, 2.1, 11, 0.32))
music = hp(music.T, 25).T
gi0, gi1 = int(GAP0 * SR), int(GAP1 * SR)          # hard silence in the gap (reverb tails cut short, like a stop)
music[gi0 + int(0.12 * SR): gi1] *= 0.0
fade = int(0.35 * SR); music[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 2

# ------------------------------------------------------------------------------------------ SFX
sfx = buf()
def tick_sound(speed, seed):
    r = np.random.default_rng(seed); t = tt(0.05)
    exc = r.standard_normal(len(t)) * np.exp(-t * 2500)
    x = (bp(exc, 1700, 2300) * 1.0 + bp(exc, 2900, 3500) * 0.8 + bp(exc, 4600, 5600) * 0.55) * 6
    body = np.sin(2 * np.pi * (780 + r.uniform(-30, 30)) * t) * np.exp(-t * 140) * 0.55
    return (x + body) * np.minimum(t / 0.0004, 1)
T = json.load(open(f'{OUT}/ticks.json'))
for name, lst in (('ticks1', T['ticks1']), ('ticks2', T['ticks2'])):
    times = [e['t'] for e in lst]
    for i, e in enumerate(lst):
        if in_gap(e['t']) and name == 'ticks2': pass    # the last ticks live in the silence: keep them, they are the drama
        rate = 1 / max(1e-3, (times[i] - times[i - 1])) if i else 10
        g = min(1.0, (16 / rate) ** 0.55) * (0.95 if rate < 8 else 0.75)
        if e['dir'] < 0: g *= 0.8
        place(sfx, tick_sound(e['speed'], 100 + i), e['t'], g * 0.55, pan=0.08)
# whirr bed under the fastest part of each spin (ticks too dense to hear individually)
def whirr(t0, t1, peak):
    t = tt(t1 - t0); u = t / (t1 - t0)
    env = np.sin(np.pi * np.clip(u, 0, 1)) ** 1.5
    return bp(noise(len(t)), 1400, 5200) * env * peak
place(sfx, whirr(0.0, 1.4, 0.10), 0.0); place(sfx, whirr(17.05, 19.6, 0.09), 17.05)

def load(name):
    meta = json.load(open(os.path.join(SFXLIB, 'index.json'), encoding='utf-8'))[name]
    x, sr = sf.read(os.path.join(SFXLIB, meta['file'].replace('sfx/', '').replace('/', os.sep)), always_2d=True)
    if sr != SR: x = signal.resample_poly(x, SR, sr, axis=0)
    if x.shape[1] == 1: x = np.repeat(x, 2, 1)
    return x[:, :2]
def env_of(x):
    e = np.abs(x).max(1); w = int(0.005 * SR); return np.convolve(e, np.ones(w) / w, 'same')
def put(name, at, gain_db, align='onset', maxlen=None, fade_out=0.15):
    x = load(name)
    if maxlen: n = int(maxlen * SR); x = x[:n].copy(); f = int(fade_out * SR); x[-f:] *= np.linspace(1, 0, f)[:, None]
    e = env_of(x); pk = int(np.argmax(e))
    off = int(np.argmax(e > 0.25 * e[pk])) if align == 'onset' else pk
    place(sfx, x, at - off / SR, db(gain_db))

put('sparkle', 1.5, -15)
put('swoosh-up', 3.86, -14, align='peak')
put('boom-hit', 4.0, -11, maxlen=1.6)
put('drum-hit', 4.5, -15); put('drum-hit', 5.0, -14)
put('swish', 5.5, -16, align='peak'); put('text-pop', 6.0, -15)
put('swoosh-up', 7.88, -15, align='peak'); put('swoosh-down', 8.5, -14, align='peak')
put('whoosh-cinematic', 9.4, -13, align='peak')
for t in (10.0, 12.0, 14.0):
    put('paper-swipe', t, -13, align='peak'); put('swish', t + 0.05, -17, align='peak')
    for i in range(4): put('text-pop', t + 0.2 + i * 0.12, -24)
put('whoosh-cinematic', 16.0, -9, align='peak')
for t in (16.0, 16.25, 16.5): put('text-pop', t, -20)
put('swish', 17.0, -10, align='peak'); put('fast-swipe', 17.02, -12, align='peak')
put('tension-drone', 18.0, -24, maxlen=3.5, fade_out=0.05)
put('boom-hit', 22.0, -6, maxlen=3.0); put('sub-drop', 22.0, -9)
put('crowd-cheer', 22.08, -22, maxlen=2.6, fade_out=0.9)
put('sparkle', 22.3, -12); put('bubble-pop', 22.9, -15)
put('swoosh-down', 24.0, -14, align='peak')
# count-up ticks: the number follows power2.out from 24.15 for 0.6 s; a tick on every increment
CU0, CUD = 24.15, 0.6
last = 0
for i in range(1, int(CUD * SR / 64)):
    tq = CU0 + i * 64 / SR; u = (tq - CU0) / CUD; v = int(round(30 * (1 - (1 - u) ** 2)))
    if v > last:
        last = v; place(sfx, tick_sound(0, 900 + v) * (0.8 + 0.4 * v / 30), tq, 0.3)
put('cinematic-hit', 24.75, -10)
put('swish', 25.1, -16, align='peak'); put('text-pop', 25.5, -15)
put('whoosh-cinematic', 26.5, -10, align='peak')
put('bubble-pop', 26.9, -14)
for t in (27.1, 27.18, 27.26): put('text-pop', t, -21)
put('click', 28.6, -9); put('sparkle', 28.65, -16)

# ------------------------------------------------------------------------------------------ write + master to -14 LUFS / -1 dBTP
os.makedirs(OUT, exist_ok=True)
sf.write(f'{OUT}/music.wav', music.astype(np.float32), SR, subtype='FLOAT')
sf.write(f'{OUT}/sfx.wav', sfx.astype(np.float32), SR, subtype='FLOAT')
mix = music * db(-2) + sfx * db(0)
sf.write(f'{OUT}/mix_raw.wav', mix.astype(np.float32), SR, subtype='FLOAT')

def ff(args):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-y', *args], capture_output=True, text=True)
    if r.returncode: raise SystemExit(r.stderr[-1500:])
    return r.stderr
def measure(p):
    e = ff(['-nostats', '-i', p, '-af', 'ebur128=peak=true', '-f', 'null', '-']); s = e[e.rfind('Summary'):]
    get = lambda k: float(next(l.split()[1] for l in s.splitlines() if l.strip().startswith(k)))
    return get('I:'), get('Peak:')
I0, _ = measure(f'{OUT}/mix_raw.wav'); gain = -14 - I0
for _ in range(4):
    ff(['-i', f'{OUT}/mix_raw.wav', '-af', f'volume={gain:.2f}dB,aresample=192000,alimiter=limit=0.78:attack=1:release=50:level=false,aresample=48000',
        '-ar', '48000', '-c:a', 'pcm_s24le', f'{OUT}/mix.wav'])
    I, TP = measure(f'{OUT}/mix.wav')
    if abs(I + 14) <= 0.15: break
    gain += -14 - I
print(f'mix.wav  integrated {I:.1f} LUFS  true peak {TP:.1f} dBTP  (gain {gain:+.1f} dB)')
if abs(I + 14) > 0.5 or TP > -1: print('WARNING: off target')
