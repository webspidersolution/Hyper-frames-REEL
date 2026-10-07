# Place the ElevenLabs read on the beat grid. Run from the project root:  python tools/vo.py
# Reads timeline.json → vo{src, transcript, units[{id, src:[a, b], at}], script[]} (unit times in seconds; `at` is where
# the unit's src start lands in the film). Writes assets/audio/vo.wav (48 kHz mono), assets/audio/words.json (every
# script word with film times, for the kinetic type) and assets/audio/captions.srt.
# Word times: Parakeet transcript aligned to the script, word starts snapped to the measured speech onsets after pauses
# (the ASR runs ~0.1 s early there); the remaining words get the ASR time + BIAS.
import json, re, subprocess, difflib
import numpy as np, soundfile as sf

TL = json.load(open('timeline.json', encoding='utf-8'))
VO = TL['vo']; SR = 48000; DUR = float(TL['duration']); OUT = 'assets/audio'
BIAS = 0.08            # ASR lead inside phrases
FADE = 0.006

raw = subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-i', VO['src'], '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                     capture_output=True, check=True).stdout
x = np.frombuffer(raw, dtype=np.float32).astype(np.float64)

# ---- speech onsets: ends of ≥ 120 ms stretches under -50 dB (20 ms RMS, 5 ms hop)
hop, win = int(0.005 * SR), int(0.02 * SR)
rms = np.array([np.sqrt(np.mean(x[i:i + win] ** 2)) + 1e-9 for i in range(0, len(x) - win, hop)])
quiet = 20 * np.log10(rms) < -50
onsets, run = [], 0
for k, q in enumerate(quiet):
    if q: run += 1
    else:
        if run * hop / SR >= 0.12: onsets.append(k * hop / SR)
        run = 0
units = VO['units']
for u in units:                       # a unit that starts mid-breath (cut at a micro-gap) is an onset too
    if all(abs(u['src'][0] - o) > 0.05 for o in onsets): onsets.append(u['src'][0])
onsets.sort()

# ---- align the transcript to the script
tr = json.load(open(VO['transcript'], encoding='utf-8'))
asr = tr if isinstance(tr, list) else tr['words']
norm = lambda s: re.sub(r"[^a-z0-9]", '', s.lower())
script = []                           # (word as written, line index)
for li, line in enumerate(VO['script']):
    for w in line.split(): script.append((w, li))
A = [norm(w['text']) for w in asr]; Sn = [norm(w) for w, _ in script]
t0 = [None] * len(script); t1 = [None] * len(script)
for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(a=A, b=Sn, autojunk=False).get_opcodes():
    if tag in ('equal', 'replace') and (i2 - i1) == (j2 - j1):
        for k in range(i2 - i1): t0[j1 + k], t1[j1 + k] = asr[i1 + k]['start'], asr[i1 + k]['end']
    elif tag == 'replace' and i2 > i1:  # unequal spans: spread the ASR span over the script words
        a, b = asr[i1]['start'], asr[i2 - 1]['end']
        for k in range(j2 - j1): t0[j1 + k] = a + (b - a) * k / (j2 - j1); t1[j1 + k] = a + (b - a) * (k + 1) / (j2 - j1)
for j in range(len(script)):          # anything still missing: interpolate from neighbours
    if t0[j] is None:
        p = next((t1[k] for k in range(j - 1, -1, -1) if t1[k] is not None), 0.0)
        n = next((t0[k] for k in range(j + 1, len(script)) if t0[k] is not None), p + 0.3)
        t0[j], t1[j] = p, n

# snap starts to onsets (each onset used once), bias the rest
used = set(); snapped = 0
for j in range(len(script)):
    cands = [o for o in onsets if o not in used and t0[j] - 0.10 <= o <= t0[j] + 0.35]
    if cands: o = min(cands, key=lambda o: abs(o - t0[j] - 0.12)); used.add(o); t0[j] = o; snapped += 1
    else: t0[j] = t0[j] + BIAS
for j in range(len(script)):
    nxt = t0[j + 1] if j + 1 < len(script) else len(x) / SR
    t1[j] = min(max(t1[j] + BIAS, t0[j] + 0.08), nxt)

# ---- place the units
vo = np.zeros(int(SR * DUR))
def unit_of(t):
    for u in units:
        if u['src'][0] <= t < u['src'][1]: return u
    return min(units, key=lambda u: min(abs(t - u['src'][0]), abs(t - u['src'][1])))
for u in units:
    a, b = u['src']; pre = float(u.get('pre', 0.04)); post = float(u.get('post', 0.12))
    i, j = max(0, int((a - pre) * SR)), min(len(x), int((b + post) * SR))
    seg = x[i:j].copy(); f = int(FADE * SR)
    seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
    k = int(round((u['at'] - (a - i / SR)) * SR))
    if k < 0: seg, k = seg[-k:], 0
    vo[k:k + len(seg)] += seg[: len(vo) - k]
    u['_end'] = u['at'] + (b - a)
for p, q in zip(units, units[1:]):
    if q['at'] < p['_end'] + 0.2: print(f"WARNING: {q['id']} starts {q['at'] - p['_end']:.2f}s after {p['id']} ends")
sf.write(f'{OUT}/vo.wav', vo.astype(np.float32), SR, subtype='FLOAT')

words = []
for j, (w, li) in enumerate(script):
    u = unit_of(t0[j]); off = u['at'] - u['src'][0]
    words.append({'w': w, 'line': li, 'unit': u['id'], 't0': round(t0[j] + off, 3), 't1': round(min(t1[j], u['src'][1] + 0.12) + off, 3)})
json.dump({'units': [{'id': u['id'], 'at': u['at'], 'end': round(u['_end'], 3)} for u in units], 'words': words},
          open(f'{OUT}/words.json', 'w', encoding='utf-8'), indent=1)

# ---- captions: phrases split at punctuation / pauses / units; long phrases split into balanced chunks (≤ MAXC chars);
# short neighbours in the same unit merged. Each cue ends before the next one starts.
MAXC = 32
def ts(t): ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000); return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'
text = lambda ws: ' '.join(w['w'] for w in ws)
phrases, cur = [], []
for k, wd in enumerate(words):
    cur.append(wd); nxt = words[k + 1] if k + 1 < len(words) else None
    if not nxt or re.search(r'[.?!,]$|\.\.\.$', wd['w']) or nxt['unit'] != wd['unit'] or nxt['line'] != wd['line'] or nxt['t0'] - wd['t1'] > 0.35:
        phrases.append(cur); cur = []
same = lambda a, b: a[-1]['unit'] == b[0]['unit'] and a[-1]['line'] == b[0]['line'] and len(text(a + b)) <= MAXC
runs = []                     # runs of short phrases first ("Save. Skip. Share."), then short ones join a neighbour
for p in phrases:
    if runs and len(text(p)) < 12 and len(text(runs[-1][-1])) < 12 and same(sum(runs[-1], []), p): runs[-1].append(p)
    else: runs.append([p])
merged = []
for p in (sum(r, []) for r in runs):
    if merged and same(merged[-1], p) and (len(text(p)) < 12 or len(text(merged[-1])) < 12): merged[-1] = merged[-1] + p
    else: merged.append(p)
cues = []
for p in merged:
    if len(text(p)) <= MAXC: cues.append(p); continue
    n = int(np.ceil(len(text(p)) / MAXC))
    best = min((cuts for cuts in __import__('itertools').combinations(range(1, len(p)), n - 1)),
               key=lambda cuts: max(len(text(p[a:b])) for a, b in zip((0,) + cuts, cuts + (len(p),))))
    cues += [p[a:b] for a, b in zip((0,) + best, best + (len(p),))]
with open(f'{OUT}/captions.srt', 'w', encoding='utf-8') as fh:
    for n, c in enumerate(cues, 1):
        end = c[-1]['t1'] + 0.15
        if n < len(cues): end = min(end, cues[n][0]['t0'] - 0.03)
        fh.write(f"{n}\n{ts(c[0]['t0'])} --> {ts(end)}\n{text(c)}\n\n")
json.dump([{'t0': c[0]['t0'], 't1': round(min(c[-1]['t1'] + 0.15, cues[i + 1][0]['t0'] - 0.03) if i + 1 < len(cues) else c[-1]['t1'] + 0.15, 3),
            'text': text(c), 'unit': c[0]['unit']} for i, c in enumerate(cues)], open(f'{OUT}/captions.json', 'w', encoding='utf-8'), indent=1)

print(f"vo.wav {DUR:g}s · {len(units)} units · {len(words)} words ({snapped} snapped to onsets) · {len(cues)} caption cues")
for u in units: print(f"  {u['id']:11s} {u['at']:7.3f} → {u['_end']:7.3f}s")
