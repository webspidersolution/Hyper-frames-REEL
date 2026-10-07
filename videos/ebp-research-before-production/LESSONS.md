## Lessons
- RULE: Any projection between renders (`screenAt(t)` for an iris centre, a particle origin or frame-lines) must
  refresh the camera's view matrix (`camera.updateMatrixWorld()` after `applyCam`). `Vector3.project` otherwise uses
  the last *rendered* pose.
  EVIDENCE: the 9:16/16:9 frame-lines landed at the far left of the 16:9 frame at 30.9 s; after the fix they're centred on the slate.
  GOES IN: references/three-hero.md (Time contract) + templates/src/hero3d.js
- RULE: With a voiceover, solve the tempo for the VO instead of forcing the VO onto 120 bpm. Search bpm and VO offset
  so every scene-opening line starts 0.1–0.3 s after a bar line while each pause stays within 0.3–0.85 s. Here,
  134.5 bpm put all six scene cuts on bars with less than 0.6 s of total pause change.
  EVIDENCE: strict 2 s bars needed 53–58 s and up to 1.5 s dead air per scene; the solved grid gives 50 s.
  GOES IN: SKILL.md §4 + a scripts/vo.py (this project's tools/vo.py)
- RULE: A TTS read can run a short payoff line straight into the next sentence. Find the micro-gap (here ~40 ms at
  -60 dB between "roll" and "Esha"), cut there with 6 ms fades, and re-time the pieces. No re-record is needed.
  EVIDENCE: "Then roll. Esha…" had no silence; split at 39.835 s, the clap now lands in a real gap.
  GOES IN: SKILL.md §7 (VO)
- RULE: A CSS-3D tilted floor needs a plate that is wider and taller than the frustum, with feathered edges into the
  ground colour. Otherwise the plane reads as a trapezoid card.
  EVIDENCE: F4 round 1 showed the floor's borders; tools/prep_plates.py's extended plates removed them.
  GOES IN: references/look.md
- RULE: Don't crop a landscape plate into a full 9:16 frame under type. It zooms about 2×, and the bright subject
  (a page) lands under the headline. Use split halves where the plate keeps its aspect, and dim/wake a half instead of
  sliding it.
  EVIDENCE: 33.9 s "CHANGE IT ON PAPER?" over beige paper → readable over dark desk in the top half.
  GOES IN: references/look.md
- RULE: A logo cut out of white with a hard alpha has a white halo. Un-matte only the ring connected to the exterior
  (flood fill from the frame edge), never the interior, or white details (circuit traces) vanish.
  EVIDENCE: the first un-matte turned EBP's white traces transparent; the exterior-ring version keeps them.
  GOES IN: SKILL.md §2 (supplied logos)
- RULE: `check --samples 30` treats an idle canvas and a global vignette as occluders. Hide the fx canvas
  (opacity 0) outside its window, and flag text deliberately under a mostly clear overlay with
  `data-layout-allow-occlusion`.
  EVIDENCE: 4 `text_occluded` errors on the F4 tags only showed up at 30 samples; both fixes → 0 errors.
  GOES IN: references/hyperframes-contract.md (gotchas)
- RULE: Keep `heavy overlay` elements few: one global vignette, one shared hero glow, and scaleX stickers instead of
  clip-path wipes when the text colour doesn't flip.
  EVIDENCE: lint warned at 27 heavy overlays; after the change the warning is gone.
  GOES IN: references/look.md

## Skill feedback
- GOT IN THE WAY: no GPU in the cloud container (software WebGL ≈ 1.3 s/frame at 1080×1920), so the drafts were
  too slow to be worth running. FIX: SKILL.md §9 could say to probe render speed early and offer "finals on the
  user's GPU PC" as a first-class path (RENDER-ON-PC.md pattern).
- GOT IN THE WAY: the template timeline.json's library SFX names (cinematic-hit, boom-hit) only exist in
  D:\Hyperframes\sfx. FIX: fall back to the media-use bundle names (whoosh-cinematic, impact-bass-1, sparkle) by
  default.
