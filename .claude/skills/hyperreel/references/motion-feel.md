# Motion feel: what makes motion read as designed, not generated

Adapted from launch-video-clone `references/motion-feel.md` (MIT, see NOTICE.md) and the motion-reel house rules,
plus what the Build Fest reel taught.

## The mistakes that make motion look AI-made
1. **Stopping between keys.** Easing every keyframe in and out makes things decelerate to zero and restart. Real moves
   keep travelling through the middle and ease only at the very start and end. Model a move as one curve, e.g.
   `p(t) = A(1 − e^(−t/τ)) + B·t` (fast ease-out plus steady drift), not a chain of ease-in-outs.
2. **Lockstep.** Separate objects start, peak and stop on the same frames. Give each its own timing: one arrives late,
   one counter-rotates, one settles slower (exploded rings drift at +22, −14, +6 °/s, not all at once).
3. **Settling too fast.** Premium motion has a long, soft tail: the last 5 % of travel takes about a third of the time
   (≈ 30 frames at 30 fps for a UI settle).
4. **Linear scale.** A big scale change interpolated linearly spends its time big, then lurches. Interpolate in log
   space: `s = S0 ** ((1 − u) ** k)` with k ≈ 3–4. Same for camera distance and pixels-per-unit.
5. **One start frame for a group.** Stagger rows 2–3 frames apart; containers ~1 frame before their content.
6. **Easing in at a cut.** Shots cut in ON motion, already moving (speed at the cut 4–10× the shot average). For
   simulated bursts too: an effect that begins on a cut starts 30–40 ms pre-rolled, so the shot's first frame already
   shows it expanding (a shatter born on the cut showed a tiny cluster there).
7. **Everything inside the camera.** Only what zooms belongs in the camera transform; backgrounds, chrome and HUD stay
   outside or drift on their own curve.
8. **Crossfading solid shapes of the same color** reads as a grey flash. Reveal the real layer underneath instead.
9. **Stepping into blur.** blur(0) → blur(1px) is a visible jump; start ramps around 0.3 px.
10. **Guessing.** Measure: frame sheets per beat, per-object positions over time, a donor video's cut rhythm.

## Springs and curves (use these, not generic eases)
| Preset | response / damping | For |
|---|---|---|
| snappy | 0.22 s / 0.8 (≈1.5 % overshoot) | buttons, pills, selection, pops |
| default | 0.4 s / 0.86 | cards, panels, containers, camera |
| heavy | 0.5 s / 1.0 (no overshoot) | display type, logo lockups, big camera moves |
| playful | 0.5 s / 0.45 | mascots only — never type or UI |

Closed form (pure function of time): `step(τ) = 1 − e^(−ζωτ)(cos ω_dτ + (ζω/ω_d) sin ω_dτ)`, ω = 2π/response.
A value with several targets = the SUM of one spring per change, each released at its own time (velocity carries
through retargets). `templates/src/film.js` and `hero3d.js` ship `step`, `sp`, and a camera `chain()`.

## Entrances and exits
- Enters: rise through a mask; grow out of something (0.85 → 1 with opacity snapping in within ≤ 4 frames); type on;
  build (skeleton → content); a card rising with a slight rotation settling to 0.
- Exits: lift through the mask; get covered; get pushed past camera; collapse into what replaces it; a hard cut on a bar.
- A pure opacity fade is never an enter or exit (only tiny eyebrows/captions may fade).
- Swaps are sequential: the outgoing line is gone before the incoming one lands.
- Visual hits lead the beat by ~3 frames (or half a spring) so they READ on the beat; the audio stays on the grid.

## Rhythm
- Hook reads in the first 2 s; frame 0 is never empty (start the first word partly risen).
- Something new every 2–4 s; nothing holds longer than a bar without a new element or a camera drift (1.00 → 1.03–1.08).
- Hard cuts land on bar lines; inner events on beats or half-beats from the measured grid, not hard-coded seconds.
- Silence is a tool: a 0.3–0.6 s gap before the drop makes the payoff land twice as hard.

## Signature moves that worked
- **Macro → wide pull-back** (log-space zoom over ~3.5 s) on the hero, already moving at frame 0.
- **Exploded view** in real 3D: tip the object back like a table so tiers stack UP, then lift one tier per beat while the
  others defocus/dim.
- **Physical spin with a ratchet**: closed-form velocity profile (push, exponential coast, slow crawl, stop on the drop),
  ticks at peg crossings, flapper deflection summed from recent ticks.
- **A bounce that settles on the bar**: after a first fall of T, restitution e makes the bounces last 2eT/(1−e) after
  the first impact; T = 1 beat and e = 0.6 rest exactly 3 beats later, so a fall from a bar line settles on the next
  one. Export the impacts with a falling `g` for `sfx.py` (`sound.md`).
- **Iris out of the hero** into the next scene with the hero's rim color riding the edge.
- **Count-up slam**: number and scale share one curve, the unit lands after the count, a hit on the last digit.
- **Sticker highlight**: ONE clip-path wipe shared by the box and a light copy of the word laid exactly over the dark
  word, so the colour flips at the box's leading edge (a tweened text colour passes through grey). Exit: the letters
  lift out first, then the empty box rolls up from its top edge (box first leaves light-on-light ghost letters).
- **Themed particle burst** (petals, confetti, sparks) launched from the hero at the payoff with drag + gravity +
  flutter, in front of the hero, lifetime ≤ 3 s. Launch every particle ON the downbeat and stagger the arrivals with a
  per-particle flight time (e.g. `0.36 + 0.36·x` s, ease `1 − (1 − u)^3.5`); staggered births leave the hit half empty.
