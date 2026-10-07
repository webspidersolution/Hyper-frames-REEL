---
workflow: general-video
flow: automation
storyboard: yes
message: "Web Spider Solutions — Get found"
aspect: 1920x1080
length: 35s
---

## Intent

A 16:9 brand film for **Web Spider Solutions** (webspidersolutions.com), built with /hyperreel on the shot structure of a
reference motion piece the user supplied ("one to one clone this video"). We matched the reference's **15 cut frames,
camera moves, easing and transition types** (measured with launch-video-clone `burst.py`, see BREAKDOWN.md) and made
everything you see and hear new: the user's own script and ElevenLabs VO, the WSS brand, original scenes, original
photo plates, an original score. The reference's artwork, photos, copy, logo and music are not used, and the reference
file is not in this repo.

## Script (the user's, on screen and in the VO)

Too many agencies, tabs, tools. / Scattered across countless platforms. / What if it all connected? / Meet WebSpider
Solutions. / Tell us your goal and see multiple growth paths in seconds. / Rank on Google, show up in AI search, and let
WebSpider make it work. / Bring ads, SEO, and social together, connect the dots, and scale what matters. / One team to
plan, launch, and grow. / WebSpider Solutions.

## Assets

- `assets/audio/vo_take3.mp3` — the user's ElevenLabs read (Brian – Clean, Professional and Balanced; take 3 of 3,
  12:06:50) with `vo_take3.words.json` (the user's word timings). Take 3 was chosen: tightest (35.1 s) and its
  punctuation matches the script ("tools. Scattered…", "together. Connect…"). `tools/vo.py` cuts it into 14 phrases at
  measured pauses and places each on its shot → `assets/audio/vo.wav`.
- `assets/brand/wss-logo.svg`, `wss-icon.svg` — the real WSS lockup and icon from the WSS brand kit (identical to the
  `brandmark-design*.svg` files the user uploaded). The lockup is revealed glyph by glyph from its own paths, never
  retyped; white version on the photo end card (brand rule).
- `assets/logos/*.svg` — real platform marks (Google, Google Ads, Analytics, Search Console, Meta, Instagram, WhatsApp,
  WordPress, YouTube, Gemini, ChatGPT, Perplexity) from the CC0 "SVG Logos" set (gilbarbara/logos via
  `@iconify-json/logos`), extracted unmodified by `tools/extract_logos.py`; see `assets/logos/SOURCE.md`. Added at the
  user's request. Amazon and Google Business Profile marks are not in any open set: drop official files in to use them.
- `assets/photos/p1-sea*.jpg`, `p2-forest*.jpg`, `p3-mustard.jpg` — original text-free plates generated on OpenArt with
  **GPT Image 2.5 Flare**, text2image, 16:9, 2K, quality low (3 images × 5 credits = 15 credits; balance 4,673 before).
  Prompts are in `tools/plate_prompts.md`. `tools/prep_plates.py` grades them (pre-blurred sea, warm-red duotone forest).
- `assets/tex/rays.jpg` — procedural ground for the ring shot (`tools/make_rays.py`); `grain.png` from the starter.
- Fonts — Poppins 400–700 (OFL), Arimo 400/700 (OFL), JetBrains Mono 400/700 (OFL), from the @fontsource packages.
- Sound — original score synthesized by `tools/score.py`; SFX from the user's library (`sfx.zip` = their
  `D:\Hyperframes\sfx`: Pixabay one-shots + HeyGen catalog) plus synthesized ticks/pops (`tools/sfx.py`); VO ducked under
  music, mixed to −14 LUFS by `tools/mix.py`.

## Customizations

- Built with /hyperreel: Three.js (the glossy spring-green ring; the rising bars) + HTML type, original score,
  library + code SFX, −14 LUFS.
- Format: 16:9 only (1920×1080), 30 fps (the reference's rate).
- Tempo 148 bpm (74 half-time feel): every reference cut sits within ±2.3 frames of its eighth-note grid; the two
  payoff hits (ring lock 7.767 s, tagline 28.0 s) and the logo (32.45 s) are placed exactly.
- Shots 1–13 keep the reference cut frames exactly. Shots 14–15 were extended (+1.4 s, +2.6 s) because the VO is longer
  than the reference: 35.0 s total instead of 31.0 s.

## Notes

### Stated by the user
- Clone the reference 1:1 with /hyperreel; 16:9 only; photo plates from OpenArt GPT Image 2.5.
- The script above; the ElevenLabs VO takes; real platform logos (Google, Instagram, etc.); their SFX library.
- Asked to keep the reference's brand "1:1 as it is" — declined: the reference is another designer's piece built around
  a third party's brand; we matched its timing and motion and used WSS's own brand and content instead.

### Inferred (defaults chosen without asking)
- Brand look from the WSS Brandkit v1.1 (cream, slate, one spring-green accent; Poppins + Arimo).
- Original scenes per shot (search shards → platform network → 3D ring → logo build → brief over the sea → growth-path
  fan → "in seconds." → code fix + 3D bars → the spider web → tagline over a mustard field → logo).
- Platform marks sit on white tiles so their own colours read on dark and photo grounds; trademarks of their owners,
  used only to name the platforms WSS works with.
- No GPU in this container: drafts render with software WebGL; finals are best rendered on the user's GPU PC
  (RENDER-ON-PC.md).
