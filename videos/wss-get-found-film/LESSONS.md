## Lessons
- RULE: When a supplied VO is longer than the reference being rebuilt, keep the reference's cut frames for every shot
  the VO fits and stretch only the shots it overflows (inner beats keep their order and easing); place the VO phrase by
  phrase at measured pauses (RMS < −48 dB for ≥ 100 ms), not from the aligner's word times.
  EVIDENCE: the user's words.json ran 0.1–0.8 s off the audio; measured pauses gave 14 clean units, shots 1–13 stayed
  on the reference frames, only shots 14–15 grew (+1.4 s, +2.6 s → 35.0 s).
  GOES IN: launch-video-clone SKILL.md §6 (Sound) + hyperreel SKILL.md §7 (VO)
- RULE: A caption pill (a box with words inside) must be shown and sized by its own words: hide it outside its window
  and clip it to the right edge of the newest risen word. Never leave several pills stacked at one position.
  EVIDENCE: round 1, three editor captions at (96, 64) — the later pills' empty boxes covered "Rank on Google,".
  GOES IN: hyperreel references/look.md (Type)
- RULE: Scope every selector that builds per-item state to its container (`#chips .chip`), never a bare class: a
  shared class elsewhere in the film throws on the missing dataset and silently kills that shot's whole render path.
  EVIDENCE: `.chip` also matched the brief box's "Growth plan ▾" — shot 14 rendered as a fully drawn web with every chip at (0, 0).
  GOES IN: hyperreel references/hyperframes-contract.md (gotchas)
- RULE: Probe the page headless before the first snapshot round (puppeteer-core from the hyperframes npx cache:
  load index.html, dispatch hf-seek at a few times, print pageerror) — a thrown exception inside render(t) never shows
  in snapshots or lint.
  EVIDENCE: the NaN path and the TypeError above were invisible to lint; one probe found both in 20 s.
  GOES IN: hyperreel SKILL.md §8 (Review loop)
- RULE: A sticker that moves between words is a full-size box clipped with `inset(… round Npx)`, not a 1 px box scaled
  by (w, h): scaling turns the corner radius into an elliptical blob.
  EVIDENCE: shot 15 round 2 blob → round 3 crisp 14 px corners.
  GOES IN: hyperreel references/motion-feel.md (Sticker highlight)
- RULE: Real platform logos go in as CSS background images on white tiles (unmodified files), not repeated `<img>`
  tags: the renderer flags repeated images as duplicate media.
  EVIDENCE: 4 duplicate_media_discovery_risk warnings → 1 (the remaining one is the shared blurred plate).
  GOES IN: hyperreel references/look.md (Props)
- RULE: Rotated card fans and depth-pass text will trip `content_overlap`; give card/chip text real spacing first
  (line-height 1.2 so titles and subtitles don't touch), then flag the intentional layering on the text itself.
  EVIDENCE: check 26 errors → 0.
  GOES IN: hyperreel references/hyperframes-contract.md (gotchas)
- RULE: Run the gate with `check --samples 30` before calling a draft final. The default sampling can step over a
  short occlusion inside a 2 s shot.
  EVIDENCE: the default check passed on the same editor layout; at 30 samples it found a ✓ under the preview pane
  (18.08–20.42 s).
  GOES IN: hyperreel SKILL.md §8 (Review loop, gate)
- RULE: In a split-pane prop (code beside a preview), keep each line's end marker inside its own pane:
  chars × advance + gutter ≤ pane left − margin. Shorten the line; don't clamp the marker, or it lands on the text.
  EVIDENCE: a 52-character line put its ✓ at x ≈ 755 px, under the pane at 760 px; with `goal.city` every ✓ is at
  or before 700 px.
  GOES IN: hyperreel references/look.md (Props)
- RULE: Word masks padded for glyph overhang (`padding: … 0.1em`, matching negative margin) overflow a fixed-width
  slot by exactly 0.1 em per side and trip `container_overflow`. Flag the masks with `data-layout-allow-overflow`.
  EVIDENCE: shot 1's swap slot warned at 7.59 px per side (0.1 em at 76 px); after flagging, 0 layout warnings.
  GOES IN: hyperreel references/hyperframes-contract.md (gotchas)

## Skill feedback
- GOT IN THE WAY: github raw downloads (Google Fonts) are blocked in the cloud box. FIX: fetch fonts from the
  @fontsource npm packages (npm registry is reachable) — say so in hyperreel SKILL.md §2.
- GOT IN THE WAY: scaffold pinned a newer hyperframes (0.8.140) than the skill's notes (0.8.139). FIX: read the pin
  from the scaffolded package.json in every command example.
- Tools written for this project: `tools/vo.py` (phrase placement), `tools/prep_plates.py` (plate grades),
  `tools/make_rays.py` (procedural ground), `tools/extract_logos.py` (CC0 platform marks), `src/props.mjs` (static
  DOM incl. a label-overlap relaxer for radial chip layouts).

## Reviewer notes
- "use platforms's real logo svg file so like google, instagram and etc..." → real CC0 marks on white tiles across the
  network, cards, chips, tab shards and captions.
