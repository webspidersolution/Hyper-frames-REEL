# Look: designing frames that don't look generated

## Banned defaults (the AI-template tells)
- Centered title on a gradient; everything fading in; identical card grids; floating cards sliding up from below.
- Glassmorphism / frosted panels, gradient blobs, cyan-purple neon on dark, glow on UI chrome.
- Default fonts, gradient text, corner labels, frame borders, generic particle bursts, light leaks as decoration,
  spins/glitches for their own sake.
- Pure #000 / #fff fields when the brand has a tinted neutral; full-frame linear gradients on dark (they band in H.264).
- Full-frame flash veils. At most a 1–2 frame pop (τ ≤ 0.03 s) on the single biggest hit; a τ 0.085 s flash turned
  the frames after three hits into flat grey.
Test every shot: if it could appear in any AI launch video, redo it.

## Color
- One accent hue (the brand's). Other strong colors only as *content* (a product's own colors, package tiers).
- Match the client's own campaign look when one exists (their landing page, standee, ads) — ask; it overrides house taste.
  Example: Build Fest wanted a saffron→coral gradient with Diwali props, not the dark look we first built.
- Saturated backgrounds: white or brand-red text often fails contrast. Use near-black display text and **highlight
  stickers** (white text on an accent box with a darker accent "lip" shadow) for accent words.
- Contrast is enforced by `npx hyperframes check` (4.5:1 body, 3:1 large text).

## Type
- One display face + at most one UI face; the brand's real files, or OFL (Poppins, Inter, Space Grotesk…), bundled.
- Display 84–140 px at 1080-wide for multi-word headlines; a single poster word may fill the safe width (230–380 px
  slams). Body ≥ 28 px; nothing under 22 px except legal lines.
- Poppins-like faces have a tall `normal` line-height (~1.4 em): give any line holding an inline-block highlight sticker
  an explicit `line-height` (~1.1), or the sticker box grows into the next line.
- Measure line widths from the real font (PIL `ImageFont.getlength`) and size headlines to the safe width.
- Masked rises: `.w { overflow:hidden; padding: .06em .12em .18em; margin: -.06em -.12em -.18em }`, words start
  ≥ 140 % below and are transparent while hidden.

## Layout and safe zones
- Anchor to edges; type left-aligned at x ≥ 72 (9:16) / 120 (16:9). Two focal points minimum.
- 9:16 Reels/Shorts UI covers the top ~14 %, bottom ~20 % and right ~12 % — keep text out; props and the hero may bleed.
- Re-block each format (don't letterbox): in 16:9 put type left, hero right; check the hero never touches the text.

## Background roles (2–5 per scene, each with ambient motion)
- A breathing glow behind the hero (warm white on saturated grounds, accent-tinted on dark).
- Brand devices: the logo's motif (sun rays, a grid, a pattern) at 6–20 % opacity, slowly rotating/drifting.
- Props from the client's world (festive: garlands, fairy lights, diyas; tech: HUD ticks, UI fragments; luxury: grain,
  light falloff). Draw them procedurally (SVG/canvas) from a seeded generator so they stay deterministic and on-brand.
- Fine grain (overlay blend, ~20–30 %) unifies HTML and WebGL and hides gradient banding.

## Props done right (procedural, seeded)
- Build them in a generator (`tools/props.mjs` pattern in `examples/buildfest-wheel/`): defs once at the root
  (`<symbol>`, gradients), `<use>` per scene, ids prefixed per scene.
- Animate in `render(t)`: chase lights on the beat, sway with explicit SVG pivots, twinkle with seeded phases.
- Keep props at the frame edges and clear of the text column.

## Product photos
- Show them as product tiles (white rounded card, soft warm shadow) when they're shot on white; trim to content
  (`ink` bbox) and drop screenshot debris. Hero product shots can sit in a framed photo card with a slow push.
- Crop out anything private (names on gates, faces) before it reaches the frame.
