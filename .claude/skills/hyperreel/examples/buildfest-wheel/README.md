# Worked example: Shubh Griha Build Fest 2026 (30 s, 9:16 + 16:9)

A campaign reel for Walls & Dreams' spin-wheel offer, built before /hyperreel existed. Its files are copied here
as reference implementations: copy the approach, not the numbers. Full project:
`D:\Suraj Documents\Walls & Dreams\videos\shubh-griha-spin-reel` (renders, src, tools, assets).

| File | What to learn from it |
|---|---|
| `wheel3d.js` | Two Three.js stages; the real Figma wheel split into tier textures with thickness; glossy rim, chrome pegs, additive bulb sprites with beat patterns; extruded pointer with the real art on its cap; screen-space camera intents + spring `chain()`; table-tilt exploded view with per-tier lift/dim; rotational-blur overlays; win-slice overlay; warm contact shadow; projected centre for HTML glows. |
| `spin.js` | Closed-form spin physics shared by picture and sound: an exponential hook spin, a launch → coast → slow crawl → stop exactly on the drop, peg-crossing ticks, flapper deflection summed from recent ticks. |
| `film.js` / `film.css` | Per-format layout tables, masked rise/lift with opacity snap, highlight stickers, ribbon banners, count-up from `render(t)`, iris + light-sweep transitions, props animation, a petal burst with drag + gravity + flutter. |
| `props.mjs` | Seeded procedural festive props: fairy-light strands (beat-chased bulbs), flower garland festoons with pearls, scalloped mandala corner flowers, diyas with flame glows, sparkles, bokeh. SVG `<symbol>` defs once at the root. |
| `audio.py` | Score (dhol, tanpura, sitar-ish pluck, temple bells, build → silence → drop) + SFX placement (library one-shots aligned by onset/peak, synthesized ticks from the physics) + master. |
| `prep_assets.py` | Splitting a flat Figma wheel into seamless annulus layers, baking rotational-blur variants, keying a diya off a dark ground, trimming product photos, cropping a render. |

Timeline: hook macro pull-back (0–4) → title on a rising-sun wheel (4–8) → exploded rings, one card per ring
(8–15.6) → iris into the spin (15.65) → ratchet crawl in silence → land on the drop (22.0) → win + petals →
offer count-up (24) → light sweep into the CTA (26.1) → end card (30).
Lessons it produced are in SKILL.md § Hard-won rules.
