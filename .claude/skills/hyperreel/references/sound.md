# Sound: score, SFX, mix

The piece is cut to the music, so the score comes first; then every visual event gets a sound; then one master.

## Score (`tools/score.py`)
Reads `timeline.json` → `music` and writes `assets/audio/music.wav` + `assets/audio/beats.json`.
```jsonc
"bpm": 120, "duration": 30,
"music": {
  "style": "cinematic",            // modern | cinematic | festive | minimal  (instrument palette + patterns)
  "key": "D", "chords": ["D","D","C","G","D","Bm","A","A"],      // one per bar, cycled
  "sections": [ {"at": 0, "kind": "intro"}, {"at": 4, "kind": "full"}, {"at": 16, "kind": "build"},
                {"at": 21.5, "kind": "gap"}, {"at": 22, "kind": "drop"}, {"at": 28, "kind": "outro"} ],  // seconds, snap to bars
  "accents": [0, 4, 22, 28],       // bell (+ its fifth) + crash; the big kick comes with a drop section
  "melody": "auto",                // or {"<bar>": "0:D5 2:C5 4:A4 …"} (bar index 0-based; 16th positions 0–15)
  "seed": 7
}
```
Section kinds: `intro` (light percussion, motif, drone), `full` (groove), `build` (riser, accelerating roll, climbing
arp), `gap` (stop-time hit then silence — put it right before the payoff), `drop` (impact + full groove), `outro`
(final chord rings out). Every style's lead is a Karplus-Strong pluck. Styles: `modern` (kick/clap/16th hats, sine
bass, pad), `cinematic` (taiko-ish toms, low pulse, braam swells, pad; the kick/clap groove only in the drop),
`festive` (dhol toms/tilli, tanpura drone, the pluck with a sitar-like bridge buzz, mixolydian passing tones),
`minimal` (kick/clap, eighth-note hats, no pad or drone under the groove). Keep bars at 2 s (120 bpm) or 1.875 s
(128) so cuts land on round numbers. You can't listen: verify structurally — `score.py` prints section RMS (a gap as
its stop-time hit and its silence apart); sections should step up/down as designed and the gap's silence must measure
≥ 30 dB below the drop. Tell the user the score is unheard and ask them to listen to the draft.

## SFX (`tools/sfx.py`)
Declare every sound in `timeline.json` → `sfx`:
```jsonc
{"at": 4.0,  "lib": "boom-hit", "gain": -10, "maxlen": 1.6},          // library one-shot, onset on the cue
{"at": 16.0, "lib": "whoosh-cinematic", "gain": -9, "align": "peak"},  // whooshes PEAK on the cut
{"at": 1.5,  "synth": "shimmer", "gain": -14},                         // synthesized hit
{"ticks": "assets/audio/ticks.json", "synth": "tick", "gain": -6},     // physics series [{t, dir?, g?}] (rate-aware gain × g)
{"at": 10.0, "to": 12.0, "every": 0.125, "synth": "tick", "gain": -18} // repeats (typing, rolls)
```
Synth types: `tick` (plastic/metal clack), `click`, `pop`, `thump`, `whoosh`, `riser`, `bell` (temple bell), `shimmer`,
`count` (rising ticks). Library: `HYPERREEL_SFX_LIB` (default `D:\Hyperframes\sfx` with `index.json`; categories:
impact, whoosh, ui, riser, foley, crowd, time, glitch). Pick by role:
| Moment | Sound |
|---|---|
| hook frame 0 | a hit + the hero's own sound (ticks, motor, shimmer) |
| title/logo lands | bell or sub hit + crash from the score |
| card/word in | soft pop / text-pop at -18…-24 dB (texture, not hits) |
| cut / transition | whoosh peaking on the cut (-9…-14) |
| launch / spin-up | swish + fast-swipe; riser into the drop |
| payoff | boom + sub-drop + sparkle; a short crowd cheer at -22 if festive |
| count-up | one tick per digit change, exported from the counter's own curve as a physics series (the `count` synth eases on its own and ticks on after the digits stop), then a hit on the last digit |
| button press | click + ripple sparkle |
Rules: one sound per visual event; whooshes/risers peak on the cue, hits start on it; ≤ 2 sounds on one frame;
repeated sounds are individual events (never a loop) so they stay in sync.

**Physics-synced SFX.** Drive the moving thing with a closed-form function in `src/physics.js` (UMD: works in the
browser and in Node). Export its events (zero-crossings of `angle / pegSpacing`, impacts, bounces) to
`assets/audio/ticks.json` with a tiny Node one-liner, then let `sfx.py` place them (it warns and skips a series file
that doesn't exist yet). Each event is `{t}` plus optional `dir` (−1 plays at 0.8) and `g`, its own gain factor
(default 1): a decaying bounce exports `{t, g}` with g falling per impact, or every impact plays at the same level.
On top, gain falls with event rate (`min(1, (16 / rate) ** 0.55)`, × 0.75 above 8 events/s). There is no whirr layer:
when events blur together, put a whoosh or riser under them yourself.

## Mix + master (`tools/mix.py`)
`music × gain + sfx × gain (+ vo with side-chain ducking)` → `assets/audio/mix.wav`, normalized to -14 LUFS integrated
with a 4×-oversampled limiter at -1.9 dBFS. That leaves ~1 dB of true-peak headroom so the renderer's AAC mux doesn't
trim the level (it lowers audio to stay under -1 dBTP). Expect the rendered file at -14 ± 0.3 LUFS.

## Licensing
Free-tier AI generators (TTS/music/SFX) are commonly non-commercial; don't use them for a client ad without a paid
license. Code-synthesized sound is yours. Library files carry their own license (Pixabay: commercial OK, no attribution).
