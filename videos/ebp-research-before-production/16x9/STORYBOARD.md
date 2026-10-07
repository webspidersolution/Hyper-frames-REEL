---
format: 9x16 (+ 16x9 re-blocked)
message: "Research Before Production"
duration: 50s
bpm: 134.5   # bar = 1.7844 s; every cut lands on a bar except the gap (on a beat, into silence)
---

## Design

- **Concept angle:** the clapperboard can't clap until the slate knows who's watching. A 3D clapperboard freezes an inch
  before "action". The audience's footprints (the real EBP logo, split into its two feet) walk a trail of signals to the
  actor's mark. The slate fills in WHO · HOOK · FORMAT, and the clap lands on the music drop. The feet then step
  together into the EBP logo.
- **Type:** `3d-product` shot grammar (macro → wide pull-back, slow orbit, snap-and-land). Photo plates sit in
  `editorial-collage` frames.
- **Palette:** ink `#0A0A0A` · surface `#141414` · chalk `#EDEDED` · accent EBP red `#A81A1D` (logo) with lip `#7A1418`
  and glint `#DC2626` (lines and glows only) · muted `#A1A1AA` (sources). Red words become stickers: chalk text on a red
  box.
- **Type pairing:** Space Grotesk 700 (display) and Inter 500/600 (UI, sources, captions). These are EBP's site fonts.
- **Focal element:** the clapperboard (F1, F5, F7–F8), the 49 % count (F3), the footprints (F4, F9).
- **Background roles:** graded photo plates with slow pushes; a breathing warm glow behind the hero; the logo's
  circuit-trace motif (procedural SVG, 8–12 %); projector haze (F2); grain about 22 % over everything.
- **Safe zones (9:16):** no text above y 269 (14 %), below y 1536 (20 %) or right of x 950 (12 %). Type is
  left-aligned at x ≥ 72. In 16:9, type sits left at x ≥ 120 and the hero right.

## Frame 1 — Hook (0.000–5.353 s · bars 0–3)
- scene: macro on the clapstick hinge, already swinging shut at frame 0 (it cuts in on motion). At 0.45 s it
  **freezes an inch before contact** (`PHYS.clap`) with a decaying tremble, while the camera keeps pulling back
  (macro → wide pull-back in log space over 3.5 s). Slate fields are empty chalk lines.
- text: eyebrow `BEFORE ANYONE YELLS "ACTION"` rises at 0.75 (VO). Headline `WHO IS THIS` / `FOR?` rises at 1.4,
  where FOR? is a red sticker that wipes on with the VO word "for" (4.75). So the hook reads by about 1.9 s.
- transition_in: none (frame 0 already moving)
- rules: cut in on motion (#6); masked rise (Entrances); sticker highlight (Signature moves).
- sfx: swing whoosh peaking at 0.40, then a **freeze** tape-stop at 0.45 and the music sits on a drone.
- 9:16: hero centred low (y ≈ 1180), type top-left at y 300–700. 16:9: hero right (x ≈ 1380), type left.

## Frame 2 — Stakes (5.353–10.706 s · bars 3–6)
- scene: **iris out of the slate** into P1, the empty screening room. The SVG ring is centred on the slate's projected
  point. Slow push 1.00 → 1.06, and the projector beam breathes (screen-blend haze).
- text: `A beautiful film.` (5.45) then `An empty room.` as a sticker (8.66, on "plays…room").
- rules: iris out of the hero; something new every 2–4 s; masked rise.
- sfx: whoosh-cinematic peaking on the cut.
- 9:16: type in the dark top band (y 300–620). 16:9: type in the dark left third.

## Frame 3 — Proof (10.706–16.059 s · bars 6–9)
- scene: hard cut on the bar, on motion. P1 is blurred and darkened behind. **49%** count-up slam (number and scale
  share one curve, the % lands after, 10.76 → 11.63). Then `of advertising's sales lift` / `comes down to the
  creative.` (12.0).
- text: three post tags `EDIT` `GRADE` `SOUNDTRACK` stamp on and get struck through in red, ON the VO words (11.36,
  12.32, 13.20). Source line (Inter 24 px, muted): `NCSolutions · Five Keys to Advertising Effectiveness (2023) · ~450
  CPG campaigns`.
- rules: count-up slam; stagger 2–3 frames; visual hits lead by about 3 frames.
- sfx: count ticks (-24), a pop on the %, a click per tag.

## Frame 4 — Footprints (16.059–24.981 s · bars 9–14)
- scene: light sweep into P2 (top-down sound-stage floor, red T-mark). The **two logo feet walk up the floor** toward
  the mark: steps on the beat (16.51, 17.40, 18.29, 19.18), then **ON the spoken words** search 20.09 · save 20.74 ·
  skip 21.56 · share 22.47 (each step prints its sticker word beside it), then 23.64, and the last step **lands on the
  T-mark at 24.54** with "first.". Each print lights its circuit traces and then fades to a dim trail.
- text: `YOUR AUDIENCE` / `LEAVES FOOTPRINTS.` (16.2). Stickers `SEARCH` `SAVE` `SKIP` `SHARE`. Then `FOLLOW THEM` /
  `FIRST.` as a sticker (23.74).
- rules: physics you can hear (`PHYS.STEPS` → steps.json); stagger; nothing static.
- sfx: whoosh into the sweep; one footstep per landing (physics series); a pop per sticker.

## Frame 5 — The slate fills (24.981–32.119 s · bars 14–18)
- scene: push through the T-mark into the **3D clapperboard** in front of P3 (defocused set, blurred further). The
  clapstick is re-armed at about 30°. Slow orbit, with a 5 % push on each field. Chalk writes, one field per VO cue:
  **WHO** → `who you cast` (26.31) · **HOOK** → `the first 3 seconds` (27.59) · **FORMAT** → `9:16 or 16:9` (30.39).
  On "vertical" a 9:16 frame-line snaps over the set, then a 16:9 frame-line on "wide" (31.35).
- text: eyebrow `RESEARCH DECIDES` (25.3). The fields themselves are chalk on the slate (3D texture).
- rules: push / zoom-through; one camera intent per beat (`chain()`); slow orbit during holds.
- sfx: whoosh peaking on the cut, chalk scratches per field, a click per frame-line.

## Frame 6 — The cost (32.119–40.149 s · bars 18–22½)
- scene: push into P4 (script page on a desk, warm and calm): `CHANGE IT ON PAPER?` (32.2) → `= an afternoon.`
  (33.6). At about 36.4 the frame **splits**: P5 (big set, cold) slides up into the bottom half (9:16; the right half in
  16:9) with `AFTER THE SHOOT?` (35.6) → `= a reshoot.` as a red sticker (37.92). The build riser starts at 35.69.
  Then `RESEARCH FIRST.` lands over both halves, which dim (38.81).
- rules: masked rise; sequential swaps; 1.00 → 1.05 drift on both halves.
- sfx: whoosh-short on the cut and on the split, a thump on "a reshoot", the riser from the score.

## Frame 7 — The gap (40.149–41.041 s · 2 beats of silence)
- scene: hard cut ON the stop-time hit to a macro of the clapperboard. The clapstick is raised high (38°) and
  trembling, and the slate is full. **Silence**, apart from the VO "Then roll." (40.28).
- text: `THEN ROLL.` rises with the VO.
- rules: silence before the drop; frame 0 of the shot already moving.

## Frame 8 — The clap (41.041–42.825 s · bar 23)
- scene: **the clapstick snaps shut ON the drop** (closed-form hinge, two bounces), with an impact shake (seeded,
  ~0.25 s) and a chalk-dust burst launched on the downbeat. `THEN ROLL.` flips into a red sticker on the clap. The
  camera pulls back and the clapperboard slides down out of frame while the two feet step in (41.93 L, 42.38 R).
- rules: bounce that settles; themed particle burst launched ON the downbeat; spring `heavy` for the lockup.
- sfx: slate clap (-4 dB) + impact-bass-1 + sparkle; the music drops in D major.

## Frame 9 — End card (42.825–50.000 s · bars 24–28)
- scene: the feet settle side by side into the **real EBP logo** (exact layout from `logo-meta.json`) at 42.83, and
  their circuit traces light up (shimmer). `ESHA BARGATE PRODUCTIONS` sets in Space Grotesk with the VO name. Then
  `Let's find your audience` / `before we frame a single shot.` (44.1). A CTA sticker `BOOK A STRATEGY CALL` with
  `eshabargateproductions.com` lands at 46.39 (outro). Camera drift 1.00 → 1.04, a breathing glow and pulsing traces,
  so the card is never a still frame.
- sfx: bell + crash accent on the lockup, shimmer, a pop on the CTA, and the final D-major chord rings out.

## Sound plan
- Score: `cinematic`, D minor, one chord per bar. It lifts to F for the footprints and builds on Gm → A, then stops
  (a 0.12 s hit and silence) and **drops in D major on the clap**. Sections: intro 0 · full 5.35 · build 35.69 ·
  gap 40.15 · drop 41.04 · outro 46.39.
- VO is placed on bar lines (`tools/vo.py`). Music is ducked -9 dB under the voice (30 ms attack, 450 ms release), and
  the voice sits about 10 dB above the bed.
- Master -14 LUFS, ceiling -1.9 dBFS. The score is unheard (composed in code), so please listen to
  `review/audio-bed-preview.mp3`.
