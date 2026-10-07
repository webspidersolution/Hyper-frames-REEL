# HyperFrames contract — the parts that matter for hyperreel

Read `/hyperframes-core` for the full contract; this is the subset this pipeline relies on, plus fixes for what broke.

## Structure
- One **root composition per project folder**: `<div id="root" data-composition-id="main" data-start="0"
  data-duration="30" data-fps="60" data-width data-height>` directly in `<body>` (no `<template>`).
  Extra formats live in their own folders (`16x9/index.html`), assets shared through a junction; `tools/build.mjs`
  generates all of them from `src/` so the formats never diverge.
- Scenes are full-frame `div.scene` siblings with their own background; later scenes start `opacity: 0` and the
  timeline reveals them.
- One `gsap.timeline({ paused: true })` registered last: `window.__timelines['main'] = tl` (key = composition id).
- Audio: one `<audio id="bgm" src="assets/audio/mix.wav" data-start="0" data-duration="30" data-track-index="10">`
  inside the root. Every `<audio>` needs an `id`.
- Fonts: `@font-face` to files in `assets/fonts/` (a named family without a face is a lint error).

## Time
- A full-length clock tween drives continuous work: `tl.fromTo(CLK, {t: 0}, {t: D, duration: D, ease: 'none',
  onUpdate: () => render(CLK.t)}, 0)`; also `addEventListener('hf-seek', e => render(e.detail.time))`.
- `render(t)` must be pure: write every animated property every frame; seeded noise only; no layout reads at tween
  time (compute positions once at setup).
- Tweens: always `fromTo`. The first tween on a property may `immediateRender` (default); every later one on the same
  property gets `immediateRender: false`. Mixing GSAP tweens and `render(t)` on the same property = flicker; pick one.

## Lint / check gotchas we hit
| Finding | Fix |
|---|---|
| `multiple_root_compositions` | one root `index.html` per folder; other formats in subfolders |
| `gsap_non_transform_motion` (letterSpacing) | animate transforms/opacity, not letter-spacing/width/height |
| `gsap_cold_seek_hidden_fromto_missing_reveal` | an element hidden by CSS that a `fromTo` reveals needs `opacity: 1` in the destination |
| `gsap_repeated_fromto_without_baseline` | put the second property's tween on a parent element |
| `negative_z_index` | don't put decorations behind with `z-index: -1`; order the DOM |
| check: `text_occluded` / low contrast on hidden words | make hidden words transparent (opacity snaps with the rise) |
| check: `text_occluded` "… inside #gl" (any `<canvas>` counts as opaque) | put each scene's type in a front layer ABOVE the canvas; an intentional depth-sandwich word keeps its place and gets `data-layout-allow-occlusion` on its own text span (the checker reads the flag on the covered text, not on the cover) |
| check: `content_overlap` big numerals, labels near them | boxes are font content areas, not ink (Anton ≈ 1.5 em tall at line-height 1): trim the mask padding on display numerals; keep labels ≥ 0.25 em clear |
| lint: `composition_file_too_large` | expected: `tools/build.mjs` inlines everything into one file per format |
| check: `container_overflow` glows/props/canvas | `data-layout-allow-overflow` on decorative layers |
| check: `rotation_pivot_drift` on SVG props | rotate with SVG `transform="rotate(a cx cy)"` (may still warn; verify visually) |
| "Runtime did not become render-ready within 3000ms" | heavy WebGL setup; harmless if frames look right, use buildReady holds |

## Transitions (build these; don't use HyperShader with a WebGL layer)
- **Iris from the hero** (T, 0.6 s, `power2.in`; `iris()` in the starter film.js):
  `tl.set(next, {opacity: 1, clipPath: 'circle(0px at Xpx Ypx)'}, T−0.03)`;
  `tl.fromTo(next, {clipPath: circle(0)}, {clipPath: circle(R), immediateRender: false}, T)` with R = distance to the
  farthest corner + 30 (a bigger R makes the visible part of the wipe idle and then lurch); the outgoing scene
  `scale 1 → 1.16, filter blur(0→6px)` about the same point; then `clipPath: 'none'` and hide the old scene.
  Three things make the mid-frames read as designed (users DO look at them, and a bare hole reads as a bug):
  1. **The ring is SVG strokes** (white 46 under accent 30, a warm drop-shadow) with `attr: {r}` tweened — never a
     scaled CSS border, which is a hairline while the hole is small.
  2. **(X, Y) is the hero's point on screen at T**, measured on a snapshot: a lifted or tilted part (the top of an exploded
     stack) sits far from the camera intent's (sx, sy).
  3. **The next scene's hero starts centred in the hole** (a camera intent at (X, Y), similar scale), so the hole reveals it
     and its rim meets the ring; then spring it to its own framing.
  **One full-frame canvas shared by every scene** (scenes → `#gl` → front type layers): a GSAP clip on the next scene
  can't reach the 3D, and the outgoing type sits above the canvas. Drive the iris from `render(t)` with one radius
  function r(t) for everything: the incoming scene and its front layer clip to the hole; the canvas (now drawing the
  incoming 3D) clips to the same shape + a margin for 3D riding the edge (+24 px kept a shard ring whole); the outgoing
  scene's front layers get the inverse, a frame with a hole, so their words are wiped too instead of floating over the
  new hero: `polygon(evenodd, <frame corners>, <hole points>)` (the showreel's diamond) or, for a circle,
  `path(evenodd, 'M0 0H{W}V{H}H0Z M{X-r} {Y}a{r} {r} 0 1 0 {2r} 0a{r} {r} 0 1 0 {-2r} 0Z')`. The three rules above
  still hold: the ring's `r` attribute set from the same r(t), centred on the measured (X, Y), the next hero waiting in
  the hole. Reset every clip to `none` outside the window.
- **Light sweep** (0.8 s): a 2.6W × 2.2H radial warm-white div with `mix-blend-mode: screen` sweeps diagonally (opacity
  0 → 1 → 0); the outgoing scene's `brightness` rises to ~1.85; swap at the peak; the incoming scene settles from
  brightness 1.85 → 1.
- **Push / zoom-through / hard cut on the bar** for connective cuts (see `/hyperframes-animation` transitions).

## Commands
```bash
node tools/build.mjs                                   # regenerate every format from src/
npx hyperframes lint [fmt-folder]                      # fast feedback
npx hyperframes snapshot [fmt-folder] --browser-gpu --describe false --at 0.05,1.9,... # frame sheets
npx hyperframes check [fmt-folder]                     # final gate: 0 errors
npx hyperframes check [fmt-folder] --samples 30        # once before the final gate: the default 9 samples see a problem
                                                       # held within one bar once at most, and one sighting is only info
npx hyperframes preview --background                   # Studio for the user (stop with --stop)
npx hyperframes render [fmt-folder] --quality draft --fps 30 --gpu --browser-gpu -o <abs>/renders/draft_<fmt>.mp4
npx hyperframes render [fmt-folder] --fps 60 --gpu --browser-gpu -o <abs>/renders/<name>_<fmt>.mp4
```
Pipe CLI output through `tr -d '\000'` before grepping (it can contain NUL bytes on Windows).
