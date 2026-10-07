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
