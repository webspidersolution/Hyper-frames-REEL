# Review rounds

Frames judged from `npx hyperframes snapshot --no-browser-gpu` contact sheets (software WebGL), then from the draft.

## Round 1 (36 frames, every shot)
| # | criterion | score | evidence |
|---|---|---|---|
| 1 | Hook | 8 | f0 shows "Too many" rising over the search hairline; "agencies," + box by 0.7 s |
| 2 | Readability | 5 | 12.5 s: push crops "Tell us your goal" and the typed goal; 13.1 s goal runs into the chip; 16.3 s caption pill empty |
| 3 | Motion | 7 | network camera + wave + logo build read well; push in shot 6 starts too early |
| 4 | Rhythm | 7 | cuts on the reference frames; VO lines land on their shots |
| 5 | Hero craft | 8 | glossy spring-green torus with sweep; bars in the preview pane |
| 6 | Brand + look | 8 | cream/slate/one green accent, real lockup glyph build, real platform marks |
| 7 | Sound sync | — | judged on the draft |
| 8 | Payoff + CTA | 6 | end line read "One team to and grow." |

Worst three → fixes: (1) shot 14 crashed every frame — `.chip` selector also matched the brief's "Growth plan" chip;
scoped to `#chips .chip`. (2) caption pills stacked and always visible → each pill shows only in its window.
(3) shot 6 push moved to f381, goal shortened, the fan caption's words arrive together.

## Round 2
Network headline in an ink pill (threads pass behind it); wide shot 0.62 → 0.68. End line rebuilt as two lines with
one hopping sticker. New problems: fan caption invisible (`tout = Infinity` made the pill opacity NaN), pills shown at
full width while words were still rising, hub W invisible (`#web path { fill: none }` beat the attribute), chip labels
colliding (Google Ads/Reviews, Instagram/YouTube), AI-answers marks over their label, sticker drawn as a blob (a
scaled 1 px rounded box).

## Round 3
Pills grow word by word (clip to the newest word's right edge, opening 0.09 s ahead of the word); sticker is a
full-size box clipped with real 14 px corners; chip layout relaxed to 0 overlaps (bigger rings, hub moved left);
drift chips scaled up for a stronger rack-focus pass. All frames clean.

## Gate
`npx hyperframes check`: first run 26 errors (rotated cards' title/subtitle boxes, depth-pass chip overlaps) + 11
contrast warnings (line numbers 2.2–3.0:1). Fixed: card text line-height + spacing, intentional layering flagged,
line numbers #848a90 on the plain gutter (highlight now starts at the code column), logo tiles as CSS backgrounds.
Second run: **Check passed** (0 errors).

## Round 4 (draft 1, frames ±1 around every cut)
Draft 1: 35.0 s, 1920×1080, 30 fps, −14.0 LUFS, −2.5 dB peak. Flash frames (f39, f59), the ring match cut, the
ripples, the fan and the editor handoffs all land on the reference frames. Four defects: (1) at 8.75 s the ring's ink
disc faded to a muddy grey as it opened → the disc stays opaque and a cream iris opens from its centre; (2) the logo
blurred out early and left a blank frame before the 11.3 s cut → exit window moved to f331–f340; (3) the fan caption
pill popped in as a blob → the pill eases in behind its first word; (4) the web shot opened on empty cream (its chips
started transparent) → chips pre-roll, already fading up and blurred at the cut.

## Round 5 (draft 2)
Iris, logo exit and web pre-roll clean. Left: "connected?" stayed green over the cream iris (low contrast) → the
question lifts out from f252, before the iris opens; the fan pill still flashed a grey sliver before "See" → the pill
starts 0.03 s into its window, its opacity ramps ×14, and its first segment is the full first word.

## Round 6 (draft 3)
At 17.12 s the outgoing and incoming editor captions overlapped, and the web shot's three caption lines did the same →
every handoff moved into the VO gap (editor pills 15.72–16.82, 17.08–18.60, 18.84–20.95 s; web lines out at 24.5 and
25.95 s), so each line clears before the next arrives. Draft 4: all handoffs clean.

## Final gate (`check --samples 30`)
First run: 1 error. At 18.08–20.42 s the ✓ on code line 4 (`#ln3`) sat under the preview pane: the 52-character line
put its ✓ at x ≈ 755 px and the pane starts at 760 px. The line now reads `syncProfile(goal.city)`, and every ✓ is
at or before 700 px. Shot 1's word masks are flagged `data-layout-allow-overflow`: their 0.1 em side padding is
deliberate room for glyph overhang.
Second run: **Check passed**, with 0 errors and 0 layout warnings. Remaining warnings: the shared blurred plate
(duplicate media), the single-file composition size (one root file by design of `tools/build.mjs`) and SwiftShader's
"GPU stall due to ReadPixels" console messages (software WebGL only). Draft 5 renders from this state.

## Round 7 (draft 5, script fidelity)
Every caption was compared against the user's script and the VO take's words. Two chunks had drifted:
`See multiple growth paths` → `and see multiple growth paths`, and `Bring ads, SEO and social together.` /
`Connect the dots,` → `Bring ads, SEO, and social together,` / `connect the dots,`. These now match the script and the
VO word for word, the same way the editor captions already did. Draft 6 renders from this state. The gate still passes:
0 errors, 0 layout warnings.

## Cut timing against the reference
The same luma-difference detector ran on both videos at 30 fps. Hard cuts in the reference: 40 (the frame after the f39
flash), 59, 233, 339, 468, 523, 534, 591, 632, 797. In draft 6: 40, 60, 233, 339, 400, 437, 468, 523, 534, 591, 632,
840. The flash frames are identical, full white on f39 and f59 in both; at f59 the detector peaked on the flash's
other edge. f400 is the reference's soft burst cut, landing on the same frame. f437 is the hub zoom peak (the
reference's motion peak is also f437). f840 replaces f797 by design (the VO is longer, so shot 14 was stretched).
f70 in the reference is the camera pan starting, not a cut.

## Final scores (draft 6)
| # | criterion | score | evidence |
|---|---|---|---|
| 1 | Hook | 8 | frame 0 is already moving: "Too many" rises over the hairline; the slot swaps agencies → tabs → tools by 2.2 s |
| 2 | Readability | 8 | each caption is one chunk of the script, alone in its window; the network headline sits on an ink pill; every ✓ clears the pane |
| 3 | Motion | 8 | springs on every settle, camera keys on the reference frames, iris → ripples → zoom-through, rack-focus web |
| 4 | Rhythm | 9 | hard cuts on the reference frames (above); the VO lines land on their shots |
| 5 | Hero craft | 8 | glossy torus with a sweep light and ripples; bars spring up in the preview pane |
| 6 | Brand + look | 8 | WSS lockup built from its own glyph paths; cream, slate and one green; real platform marks |
| 7 | Sound sync | measured | VO at measured pauses, SFX on cut and cue times, −14.0 LUFS, −2.5 dB peak; not judged by ear (no playback here) |
| 8 | Payoff + CTA | 8 | "One team to / plan, launch, and grow." with the hopping sticker → white lockup → URL, held to the end |
