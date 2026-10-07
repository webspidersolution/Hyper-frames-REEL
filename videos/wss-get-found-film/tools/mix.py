# Mix music + sfx (+ vo, ducked) → assets/audio/mix.wav at -14 LUFS, limiter ceiling -1.9 dBFS (renderer-safe).
# Run from the project root:  python tools/mix.py      Levels: timeline.json "mix": {"music": -2, "sfx": 0, "vo": 0, "lufs": -14, "ceiling_db": -1.9}
import json, os, subprocess
import numpy as np, soundfile as sf

TL = json.load(open('timeline.json', encoding='utf-8'))
M = {'music': -2.0, 'sfx': 0.0, 'vo': 0.0, 'lufs': -14.0, 'ceiling_db': -1.9, **(TL.get('mix') or {})}
SR, DUR = 48000, float(TL['duration']); N = int(SR * DUR); A = 'assets/audio'
def load(name):
    p = f'{A}/{name}.wav'
    if not os.path.exists(p): return None
    x, sr = sf.read(p, always_2d=True)
    if sr != SR: raise SystemExit(f'{p}: expected 48 kHz')
    x = np.repeat(x, 2, 1) if x.shape[1] == 1 else x[:, :2]
    out = np.zeros((N, 2)); out[: min(N, len(x))] = x[:N]; return out
db = lambda x: 10 ** (x / 20)
music, sfx, vo = load('music'), load('sfx'), load('vo')
if music is None: raise SystemExit('assets/audio/music.wav missing — run tools/score.py first')
mix = music * db(M['music'])
if vo is not None:   # duck the music under the voice (envelope follower)
    e = np.abs(vo).max(1); w = int(0.02 * SR); e = np.convolve(e, np.ones(w) / w, 'same')
    duck = 1 - 0.6 * np.clip(e / (e.max() * 0.2 + 1e-9), 0, 1)
    mix *= duck[:, None]; mix += vo * db(M['vo'])
if sfx is not None: mix += sfx * db(M['sfx'])
fade = int(0.3 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
sf.write(f'{A}/mix_raw.wav', mix.astype(np.float32), SR, subtype='FLOAT')

def ff(args):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-y', *args], capture_output=True, text=True)
    if r.returncode: raise SystemExit(r.stderr[-1500:])
    return r.stderr
def measure(p):
    e = ff(['-nostats', '-i', p, '-af', 'ebur128=peak=true', '-f', 'null', '-']); s = e[e.rfind('Summary'):]
    get = lambda k: float(next(l.split()[1] for l in s.splitlines() if l.strip().startswith(k)))
    return get('I:'), get('Peak:')
I0, _ = measure(f'{A}/mix_raw.wav'); gain = M['lufs'] - I0; lim = db(M['ceiling_db'])
for _ in range(4):
    ff(['-i', f'{A}/mix_raw.wav', '-af', f'volume={gain:.2f}dB,aresample=192000,alimiter=limit={lim:.3f}:attack=1:release=50:level=false,aresample=48000',
        '-ar', '48000', '-c:a', 'pcm_s24le', f'{A}/mix.wav'])
    I, TP = measure(f'{A}/mix.wav')
    if abs(I - M['lufs']) <= 0.15: break
    gain += M['lufs'] - I
print(f"mix.wav  {I:.1f} LUFS (target {M['lufs']})  true peak {TP:.1f} dBTP  stems: music{'' if vo is None else ' + vo'}{'' if sfx is None else ' + sfx'}")
if abs(I - M['lufs']) > 0.5 or TP > -1: print('WARNING: off target — lower the loudest stem (usually sfx) and rerun')
