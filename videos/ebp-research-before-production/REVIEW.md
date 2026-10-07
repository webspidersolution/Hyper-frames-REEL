# Review — Research Before Production (EBP)

Scored on real pixels: snapshot contact sheets for both formats, one frame per shot plus the transition mid-frames.
Scores are 1–10 per `references/critique.md`. Sound and motion are scored from the event list and snapshots until
the draft MP4 exists.

## Round 1 (first build, 9:16 and 16:9)

| # | Criterion | Score | Evidence |
|---|---|---|---|
| 1 | Hook (0–2 s) | 7 | Frame 0 already shows the clapstick swinging. "WHO IS THIS FOR?" reads by 1.9 s, but at 1.0 s the pull-back still crops the slate labels ("HO", "OOK"). |
| 2 | Readability | 5 | 33.9 s: "CHANGE IT ON PAPER?" sits on the bright script page. 24.6 s (16:9): the headline drifts off the left edge with the floor dolly. |
| 3 | Motion quality | 7 | Masked rises, log-space pull-back, iris and push-through all work. The F4 footprints overlap each other into a chain. |
| 4 | Rhythm | 8 | Cuts land on bar lines; something new every 1–3 s; silence before the clap. |
| 5 | Hero craft | 6 | The clapperboard has real thickness and light, but the slate face reads as cloudy grey and the hinge plate is a flat grey square. |
| 6 | Brand + look | 7 | EBP red, Space Grotesk/Inter, the real logo. The F4 floor shows its trapezoid borders, which reads as a template look. |
| 7 | Sound sync | 8 | Steps and clap come from `src/physics.js`; one sound per event. |
| 8 | Payoff + CTA | 8 | Clap ON the drop with chalk dust; the feet step into the logo; the CTA lands at 46.4 s. |

**Three worst → fixes**
1. Floor borders + crowded feet → extended, feathered floor plates (`tools/prep_plates.py`), smaller feet with wider
   spacing on a longer S-curve, T-mark lowered under the headline.
2. Text over bright paper → both split halves are on screen from the start (top: page right, dark desk under the
   type). The shoot half wakes up from a dim when it's named. 16:9 uses the same top/bottom split.
3. Grey slate and text collisions → darker chalk slate with less dust and less environment reflection; a smaller dark
   hinge plate; F5 and F7 camera intents re-framed so the raised stick clears the type.

## Round 2

| # | Criterion | Score | Evidence |
|---|---|---|---|
| 1 | Hook | 8 | The pull-back is now 2.6 s, so the whole slate is in frame by 1.2 s. |
| 2 | Readability | 8 | Type sits on dark areas in every shot. `check --samples 30` reports 23/23 (9:16) and 27/27 (16:9) text checks passing WCAG AA. |
| 3 | Motion quality | 8 | The feet press down, glow and fade to a trail. The push-through carries the type only for the last 0.36 s. |
| 4 | Rhythm | 8 | Unchanged. |
| 5 | Hero craft | 8 | A black chalk slate with legible chalk, a metal hinge, a brand-red kicker light, and the clap with bounces. |
| 6 | Brand + look | 8 | No visible plate borders; one accent hue. 16:9 F5 gets a "RESEARCH DECIDES:" headline instead of an empty left column. |
| 7 | Sound sync | 8 | Unchanged (verify in the draft). |
| 8 | Payoff + CTA | 8 | Unchanged. |

**Other fixes this round:** the frame-lines were misplaced because `screenAt()` projected with a stale camera
matrix (`camera.updateMatrixWorld()` is now called in `pose()`). The 16:9 floor perspective origin moved toward
the T-mark (it no longer looks skewed). Sticker offsets were tightened to stay inside the safe area.

## Gate
- `npx hyperframes check --samples 30`: **0 errors** in 9:16 and 16:9. Warnings: the file-size note (expected; build
  inlines everything) and SwiftShader "GPU stall due to ReadPixels" console messages (software GL only).
- Known, accepted: the F4 sticker tags carry `data-layout-allow-occlusion`, because they sit under the mostly clear
  global vignette on purpose.

## Draft (pending)
- Pull real frames and ±1 frame around every cut with `tools/review.py` once `renders/draft_*.mp4` exist; check
  loudness.
