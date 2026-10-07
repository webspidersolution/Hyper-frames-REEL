# Place the ElevenLabs read phrase by phrase on the film. Run from the project root:  python tools/vo.py
# Reads timeline.json → vo{src, units[{src: [a, b], at, text}]}: each unit is cut from the source at [a, b] seconds
# (cut points sit in measured pauses, see BRIEF.md) with 6 ms fades and lands at film time `at`.
# Writes assets/audio/vo.wav (48 kHz mono) and prints each unit's film range and the gaps between units.
import json, subprocess
import numpy as np, soundfile as sf

TL = json.load(open('timeline.json', encoding='utf-8'))
VO = TL['vo']; SR = 48000; DUR = float(TL['duration']); FADE = int(0.006 * SR)
raw = subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-i', VO['src'], '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                     capture_output=True, check=True).stdout
x = np.frombuffer(raw, dtype=np.float32).astype(np.float64)
out = np.zeros(int(DUR * SR))
prev_end = None
for u in VO['units']:
    a, b = (int(round(v * SR)) for v in u['src'])
    seg = x[a:b].copy()
    seg[:FADE] *= np.linspace(0, 1, FADE); seg[-FADE:] *= np.linspace(1, 0, FADE)
    i = int(round(u['at'] * SR)); j = min(len(out), i + len(seg))
    if j <= i: raise SystemExit(f"unit '{u['text']}' lands after the end of the film")
    if np.abs(out[i:j]).max() > 0: raise SystemExit(f"unit '{u['text']}' overlaps the previous unit")
    out[i:j] += seg[: j - i]
    end = u['at'] + len(seg) / SR
    gap = '' if prev_end is None else f'  (gap {u["at"] - prev_end:+.2f}s)'
    print(f"  {u['at']:6.2f}–{end:6.2f}s  {u['text']}{gap}")
    if end > DUR: print('  WARNING: runs past the end of the film')
    prev_end = end
sf.write('assets/audio/vo.wav', out.astype(np.float32), SR, subtype='FLOAT')
print(f'vo.wav  {len(VO["units"])} units  peak {20 * np.log10(np.abs(out).max() + 1e-12):.1f} dBFS')
