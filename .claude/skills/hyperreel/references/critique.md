# Critique: score the frames before anyone sees a video

Run every round on real pixels: snapshot contact sheets (one frame per beat or per shot midpoint, every format) and,
from the draft on, frames pulled from the rendered MP4 (`tools/review.py`). Never judge from the code or from memory.

## The 8 criteria (1–10 each, with evidence: a time and what you saw)
1. **Hook (0–2 s)** — frame 0 already has motion and a readable word; the subject is clear by 2 s.
2. **Readability** — every line readable at phone size (look at a 360 px-wide copy); contrast; nothing under the
   9:16 platform UI zones; no hidden text peeking through masks.
3. **Motion quality** — springs/curves per `motion-feel.md`: no stop-and-go, no lockstep groups, long settles, log-space
   zooms, cuts on motion, nothing static for > 1 bar.
4. **Rhythm** — something new every 2–4 s; cuts on bars; hits lead the beat by ~3 frames; a breath before the payoff.
5. **Hero craft** — the 3D object has depth, light and believable material; camera moves are motivated; speed reads as
   blur, not strobing.
6. **Brand + look** — the client's own colors/props/fonts; one accent; none of the banned AI-template looks.
7. **Sound sync** — every visual event has its sound; physics events match the picture; the drop lands on the payoff;
   -14 LUFS, ≤ -1 dBTP. (From the draft render on; before that, judge the event list.)
8. **Payoff + CTA** — the climax is the strongest frame; the end card is designed, moving, and says what to do.

## Process
- Write the round into `REVIEW.md`: the table of scores with evidence, then the three worst problems and the fix for each.
- Fix the three worst; verify each fix with new frames; repeat. Stop when every score ≥ 8 and at least two rounds ran.
- A fix that touches layout gets re-checked in every format.
- From the draft on, also pull the real render at ±1 frame around every cut, not only beat midpoints:
  `python tools/review.py <draft.mp4> --at <the frames around each cut> --name cuts`. Ghost letters and a grey burst
  frame that per-beat sheets never caught were obvious in the cut sheet.
- Look specifically for: dead moments (nothing changes for > 2 s), words cut by masks, the hero colliding with type,
  props crossing text, transitions that flash or go black, an end card that just sits.

## LESSONS.md (end of every project)
```
## Lessons
- RULE: <do X / never Y — useful on a different video>
  EVIDENCE: <before → after, which shot/time>
  GOES IN: <SKILL.md | references/<file> | scripts/<file>>
## Skill feedback
- GOT IN THE WAY: <what slowed you down>  FIX: <the concrete change>
```
