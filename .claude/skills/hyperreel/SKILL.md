---
name: hyperreel
description: >
  Make a premium, "go all out" motion-graphics video in HyperFrames — showreel, product launch, campaign promo,
  brand/sizzle reel, festival/offer ad, Instagram Reel (9:16) plus landscape (16:9) — with a real-time Three.js 3D hero,
  kinetic HTML type, procedural props, an original score synthesized in code, physically-synced sound effects, a
  -14 LUFS master and GPU renders (draft first, then final). Use this whenever the user asks for a reel, promo, launch
  video, showreel, motion graphics, an ad with 3D, "make it cinematic", "go all out", or names /hyperreel — even if they
  don't mention HyperFrames, Three.js, music or SFX. Prefer it over plain /motion-reel or /general-video when the piece
  should feel premium or needs a 3D hero object.
---

# Hyperreel

Three proven sources fused into one pipeline:
- **HyperFrames** renders it: one root composition per format, one paused GSAP timeline, every frame a pure function of time.
- **Three.js** draws the hero (a product, a logo coin, a prize wheel, a device) in a WebGL layer that also renders from film time.
- **HTML** carries every word, card and CTA, so type stays crisp and accessible.
- **Sound** is composed, not picked: a code-synthesized score on a beat grid, plus SFX placed per event (physics-synced where
  something physical moves), then mastered to -14 LUFS.
- **Motion feel** follows measured rules (launch-video-clone); the **review loop** scores frames before anyone sees a video
  (motion-reel).

"Go all out" means: every frame designed (no template look), a hero object with real depth and light, cuts locked to the
music, a sound for every visual event, and a draft the user approves before the final.

**Files in this skill** (read the reference the step names, when it names it):
| File | Read it when |
|---|---|
| `references/motion-feel.md` | before writing any motion; when something "looks AI" |
| `references/look.md` | before designing frames (banned defaults, props, stickers, safe zones, type) |
| `references/three-hero.md` | before writing `src/hero3d.js` |
| `references/sound.md` | before scoring and placing SFX |
| `references/hyperframes-contract.md` | before writing composition code; when lint/check/render misbehaves |
| `references/critique.md` | at every review round |
| `references/types.md` | when choosing the video's type and shot grammar |
| `examples/buildfest-wheel/` | a worked 30 s campaign reel (3D prize wheel, festive props, synced ratchet ticks) |
| `scripts/` | `scaffold.mjs`, `score.py`, `sfx.py`, `mix.py`, `review.py` (copied into each project's `tools/`) |
| `templates/` | the starter project: `src/` (film.css, body.html, film.js, hero3d.js), `tools/build.mjs`, `timeline.json` |

Let `<S>` be this skill's directory.

## 0. Intake: one round of questions

Read the user's message and memory first; never ask what they already said. Then ask everything still missing in ONE
AskUserQuestion round (max 4 questions; recommended option first):
- **Subject + source material**: product/brand, URL, Figma, photos, logo. No subject ("your call", a showreel) → you
  pick a concept and say so.
- **Length + formats**: default 15–30 s; 9:16 (Reels/Shorts) + 16:9.
- **Sound**: original score composed in code (default) / a supplied track / library. VO: none (default, sound-off
  friendly) or a provider the user has licensed. Check licensing: free-tier generator output is often non-commercial.
- **Look**: the brand's own look (capture/Figma) / a reference / "your call".

"Just build it", "go all out, don't ask", or an unattended run → skip the question round and the shotlist stop, and
record every default you chose in BRIEF.md under "Inferred".

## 1. Scaffold

```bash
node <S>/scripts/scaffold.mjs videos/<distinctive-slug> --formats 9x16,16x9 --duration 30 --bpm 120 --title "…"
```
It runs `npx hyperframes init`, copies the starter (`src/`, `tools/`, `timeline.json`), writes `BRIEF.md`, and copies
the audio/review scripts into `tools/`. The first format renders from the root `index.html`; every other format gets its
own folder (`16x9/index.html`, assets shared through a junction), because HyperFrames allows one root composition per
project. Work from the project root from here on. Never write into a folder you did not create.

## 2. Assets

Real material beats invented material. In order of preference:
- **Figma** (`/figma`, or the Framelink MCP if the user prefers it): export hero art at 2–4× (a 3D hero seen up close
  needs `texture px ≥ on-screen px × max zoom`).
- **Website**: `npx hyperframes capture <url> -o ./capture` for colors, fonts, logos, screenshots.
- **Supplied photos/logos**: trim, key and split them with a small PIL script in `tools/` (see `examples/` for layer
  splitting, background keying, auto-crop).
- **Fonts**: the brand's own, or an OFL face; bundle the files in `assets/fonts/` with `@font-face`.
Write provenance one line per asset in BRIEF.md § Assets.

## 3. Concept and design (before any HTML)

Write down, in STORYBOARD.md:
1. **Concept angle**, one sentence. The best ones make the hero object the camera's subject from the first frame to the
   payoff, and let it *transform* (reveal → explode → spin → land), not just appear.
2. **Type**: pick one from `references/types.md` and borrow its shot grammar.
3. **Palette** (one accent), **type pairing**, **focal element**, **edge anchors**, **background roles** (glow, rays,
   props, grain). Read `references/look.md`; it lists the AI-template looks that are banned.
4. **Arc**: biggest outcome in the first 2–3 s, no logo first, show don't explain, then proof, payoff, CTA.

## 4. Score and beat grid first

Music decides where cuts land, so compose before building. Fill `timeline.json`: bpm, bars, sections (intro / full /
build / gap / drop / outro), chords per bar, the drop where the payoff lands, and accents. Then:
```bash
python tools/score.py          # → assets/audio/music.wav + assets/audio/beats.json (beat/bar/section times)
```
Read `references/sound.md` § Score for the style presets (`modern`, `cinematic`, `festive`, `minimal`) and how to
write a melody. A supplied track instead: copy it to `assets/audio/music.wav` and set its bpm; `score.py --analyze`
writes the grid from the file.

## 5. Shotlist, then STOP for the OK

STORYBOARD.md: one `## Frame N` block per shot with time range (on bars), what moves (cite a rule from
`references/motion-feel.md`), the exact on-screen text, the transition in, the SFX cue, and 9:16 notes. Rules: the hook
reads within 2 s, something new every 2–4 s, nothing static, the end card is never a still frame. Send the user the
table plus palette, fonts and sound plan, and wait for an explicit OK (skip only when §0 said "just build it").

## 6. Build

- **`src/body.html` + `src/film.css`**: scenes as full-frame divs, each with its own background (no transparent scenes).
  Text uses the mask pattern (`.w > .wi`), accent words become **highlight stickers** when a colored word would fail
  contrast.
- **`src/film.js`**: per-format layout constants (`pick(tall, wide)`), GSAP tweens for text/cards (always `fromTo`),
  custom transitions, and `render(t)` for anything continuous (glows, props, counters, petals). A full-length clock
  tween with `onUpdate` and an `hf-seek` listener both call `render(t)`.
- **`src/hero3d.js`**: the Three.js stage(s). Read `references/three-hero.md` first: camera intents in screen space,
  PBR + room environment, real geometry with thickness, pre-baked rotational blur, loading holds.
- **Physics you can hear**: if something rotates, ticks, bounces or lands, drive it with a closed-form function of time
  in a shared file (`src/physics.js`), and export its events (peg crossings, impacts) to JSON for the SFX. Picture and
  sound then cannot drift.
- `node tools/build.mjs` assembles `index.html` (and one per extra format). Run `npx hyperframes lint` after every
  structural change.

## 7. Sound design

Declare every sound in `timeline.json` → `sfx` (library one-shots, synth hits, physics series), then:
```bash
python tools/sfx.py && python tools/mix.py   # → assets/audio/sfx.wav, assets/audio/mix.wav (-14 LUFS, ceiling -1.9 dBFS)
```
Rules (detail in `references/sound.md`): one sound per visual event, primary hits ~-6 to -10 dB, texture ~-18 to -24;
whooshes peak ON the cut; repeated sounds are placed one by one, never looped; silence before a drop is a sound too.
The composition plays `assets/audio/mix.wav` from one root `<audio id>` element.

## 8. Review loop (before the user sees anything)

Each round:
1. `npx hyperframes snapshot --browser-gpu --describe false --at <one time per beat or shot midpoint>` for every format;
   look at every contact sheet.
2. Score with `references/critique.md` (8 criteria, 1–10, with evidence). Fix the three worst, verify each fix with
   new snapshots.
3. Repeat until every score ≥ 8 (at least two rounds).
4. Gate: `npx hyperframes check` passes with **0 errors** on every format folder; run it once with `--samples 30`
   (the default sweep can miss a problem held within one bar).

## 9. Draft → user → final

```bash
npx hyperframes render --quality draft --fps 30 --gpu --browser-gpu -o renders/draft_<fmt>.mp4          # root format
npx hyperframes render <fmt-folder> --quality draft --fps 30 --gpu --browser-gpu -o <abs path>/renders/draft_<fmt>.mp4
python tools/review.py renders/draft_<fmt>.mp4                   # real frames + loudness, LOOK at the sheet
python tools/review.py renders/draft_<fmt>.mp4 --at <±1 frame around every cut> --name cuts   # where defects hide
```
Snapshots cannot show everything (render-only compositing paths, audio); the draft can. Give the user the paths and the
Studio preview (`npx hyperframes preview --background`), list anything knowingly imperfect, and ask: render the
final, or revise? Final: same commands with `--fps 60` and no `--quality draft`. Always render on the GPU
(`--gpu --browser-gpu`); if the GPU path fails, say so — never fall back to CPU silently.

## 10. Deliver and leave lessons

Report each final's path, duration, fps, loudness, and size; offer lighter upload copies. Then write `LESSONS.md`
(rule / evidence / where it belongs) so the next video starts smarter, and save durable user preferences to memory.

## Hard-won rules (each one broke a real render)

- **WebGL canvases + HyperShader shader transitions render black** on the layered compositing path. With a Three.js
  layer, build transitions yourself: an iris out of the hero (clip-path circle + a ring riding the edge, centred on the
  hero's projected position at that moment, `window.__hero3d.screen`), a light sweep
  (screen-blend glow + brightness), push/zoom-through. Recipes: `references/hyperframes-contract.md` § Transitions.
- **Mid-transition frames get judged too.** An iris whose ring is a scaled CSS border (a hairline while the hole is small)
  or whose centre misses the hero's on-screen point looks like a glitch. The ring is SVG strokes with `r` tweened, it is
  centred on the measured on-screen point, and the next hero waits centred in the hole. Snapshot T+0.1, T+0.2, T+0.3.
- **One root composition per project folder**; a second root `index.html` in the same folder is a lint error.
- **Masked text starts ≥ 140 % below its mask** (165 % for display numerals) **and is transparent while hidden**; else
  glyph tops peek through the padding and the checker flags hidden text as occluded or low contrast.
- **Visible "from" states leak backwards in time.** A ripple tweened `{opacity: 1} → {opacity: 0}` shows before it
  starts; use a 2-step `fromTo` (0 → 1 fast, then 1 → 0). Later tweens on the same element use `immediateRender: false`.
- **SVG children ignore CSS `transform-origin`.** Rotate/scale props with the SVG `transform` attribute and explicit
  pivots: `rotate(a cx cy)`.
- **Absolutely positioned text inside a zero-size container wraps word by word**; give text containers `white-space: nowrap`.
- **Never tween `letterSpacing`/`width`/`height`**; tween transforms, opacity, colors, clip-path, filter.
- Brand color on a saturated background often fails contrast: use stickers (white on accent) or dark text.
- `npx hyperframes snapshot` sends frames to Gemini when `GEMINI_API_KEY` is set; pass `--describe false`.
