# Plan: "Why Audience Research Should Begin Before Production"

**Client:** Esha Bargate Productions (EBP), https://eshabargateproductions.com/
**Pipeline:** `/hyperreel` (HyperFrames + Three.js + code-scored music), with ElevenLabs voiceover, the real EBP logo, and
OpenArt GPT Image 2.5 for photo plates (1K, low quality), prompted per `/chatgpt-images-2-5-prompting`.
**Status:** PLAN, waiting for approval. Nothing has been built or generated yet. Prepared 2026-10-07.

---

## 0. Decisions needed before we build

| # | Decision | Recommendation |
|---|---|---|
| D1 | **How the ElevenLabs VO gets made** | **Decided: you generate it manually** in the ElevenLabs app from §4 and upload it here. The ElevenLabs plan must be paid (Starter or higher), because free-plan output can't be used commercially. |
| D2 | **Voice** | **Sarah – Mature, Reassuring, Confident** (premade), with Lily or George as alternates. Settings are in §4. |
| D3 | **Hook** | H1, "the frozen clap" (§3). |
| D4 | **Render path.** This container has **no GPU**. Hyperreel renders on the GPU (`--gpu --browser-gpu`), and the skill forbids a silent fallback to CPU. | Build and render the drafts here with software WebGL (slower, same pixels), then render the 60 fps finals on your GPU PC (`git pull` and run 2 commands), or here on CPU if you accept roughly 1–2 h per format. |
| D5 | **Length and formats** | 9:16 (Reels/Shorts) and 16:9 (YouTube, LinkedIn, website), **about 44 s**, locked to whole music bars once the VO is recorded. |
| D6 | Captions | **9:16:** designed kinetic key-phrases, plus Instagram's own captions. Instagram reduces reach for "majority text" reels, so we don't add full subtitles. **16:9:** full burned-in captions, because LinkedIn recommends subtitles. Plus an `.srt` for YouTube. |

---

## 1. Research snapshot

### 1a. The client (observed on eshabargateproductions.com, 2026-10-07)
- **Esha Bargate Productions, LLC**: "Media Productions & Marketing Agency". Based in San Francisco, Los Angeles and
  Mumbai, est. 2024. Founded by **Esha Bargate** (showrunner, TV show creator, global media strategist).
- Three verticals: **Digital & AI Frontier**, **Cinematic Legacy** and **Vertical Drama**. The listed services already
  include *"Audience targeting and placement"*, *"Strategy and consulting"*, *"Campaign architecture"*, *"Social-first
  content creation"* and *"Pre and post-production"*, so this video sells a real service.
- Credits: *Sarhadain* (streaming on Apple TV / Google TV, India) and *The Mediator* (2025 short, on IMDb). Covered by
  Deadline.
- Site CTAs: **"BOOK A CALL"**, "START A STORY", "SCHEDULE A MEETING". Tagline: *"Where cutting-edge AI meets
  timeless storytelling meets scroll-stopping drama marketing. Three verticals. One vision."*
- **Brand system** (from the site CSS): background `#0A0A0A`, surface `#141414`, text `#EDEDED`, brand red `#DC2626`
  (site) and **`#A81E22`** (median red of the logo); headings in **Space Grotesk**, body in **Inter**.
- **Logo** (`/images/assets/erp-logo-transparent.png`, 534×772, transparent PNG): **two red footprints filled with
  circuit-board traces**. It has no wordmark, so we set the name in type. The two feet separate cleanly at x≈262 px,
  so they can walk on their own.
- **Inference:** the logo is literally a set of *digital footprints*. Audience research means following your audience's
  footprints, which gives a brand-native metaphor for the whole video.

### 1b. Topic evidence (checked 2026-10-07)
The three on-screen candidates were opened and quoted by me. The rest come from the research ledger (sources opened
by the research agent).

| # | Finding (exact quote) | Source | Use |
|---|---|---|---|
| **E1** | "creative quality is responsible for almost half (49%) of the incremental sales driven by advertising" and "brands need to truly understand what motivates their target buyers" | NCSolutions, *Five Keys to Advertising Effectiveness* (2023; "nearly 450 CPG campaigns") — https://info.ncsolutions.com/hubfs/2023%20Five%20Keys%20to%20Advertising%20Effectiveness/NCS_Five_Keys_to_Advertising_Effectiveness_E-Book_08-23.pdf | **On screen in F3** as a 49 % count-up |
| **E2** | "only 25% of marketers say they understand their audiences 'very well'" | Brandwatch, *The Marketer of 2026* (17 Mar 2026; 1,028 marketers) — https://www.aap.com.au/aapreleases/cision20260317ae10995 | hook H4 and post caption |
| **E3** | "33% of the marketing budget goes to waste due to poor briefs and misdirected work" (a respondents' estimate) | IPA × BetterBriefs (13 Oct 2021; 1,700+ marketers and agency staff, 70+ countries) — https://ipa.co.uk/news/betterbriefs | post caption, worded as "marketers estimate…" |

Context only (not on screen):
- CMI 2025 says top B2B performers credit "understanding their audience (82%)".
- Kantar (2022, 970 cases) found that pre-tested top-third ads raised sales in 76 % of cases, against 28 % for the
  bottom third.
- Dove *Real Beauty Sketches* started from the finding that "only 4% of women believe that they are beautiful".
- Netflix *House of Cards*: data sized the audience before the commitment but didn't write the show. Don't repeat the
  "$100M" figure or "an algorithm made it".
- *Fatal Attraction*: test audiences were unsatisfied and the ending was reshot six months later, so late research
  meant a reshoot.
- India: IAMAI–Kantar 2025 counts 588 M short-form viewers, and 57 % of urban users prefer regional languages, so
  language is a pre-production decision too.

**Myths we never use:** the 8-second "goldfish" attention span (debunked); "visuals are processed 60,000× faster";
"1 minute of video = 1.8 M words"; "95 % of a video message is retained"; "an algorithm made House of Cards".

**Audience language:** "It looked beautiful. Nobody watched." and "Views. No leads." These match a 3 M-view YouTube
feature that drove poor sales (Candy Japan), HubSpot's "You're going after the wrong audience", and CMI 2026's top
challenge, "content that prompts a desired action" (40 %).

**Competitor scan:** the usual lines are "tell your story", "we craft", "resonate", "strategy first", "discover your
why", and demographics passed off as research. **Gap:** no studio shows what skipping research costs or tests a hook
before the shoot. This video owns both: "no edit… can fix the wrong message" and "after the shoot? That's a reshoot."

**Platform notes (official):**
- Instagram ranks on reshares, completion and likes, and *reduces* reach for reels that are "majority text" or have
  borders or watermarks. So: VO-led, key-phrase type only, no borders or watermarks.
- Instagram **Trial Reels** show a reel to non-followers first and report metrics after about 24 h. That's the place to
  A/B the hook.
- LinkedIn recommends subtitles and "the most impactful content in the first 10 seconds", so the 16:9 cut gets burned
  captions.

---

## 2. Concept

> **The clapperboard can't clap until the slate knows who's watching.**

- **Hero (Three.js):** a real 3D clapperboard with thickness, a chalk slate and a striped clapstick on a hinge. At
  frame 0 it is already swinging shut, and it **freezes an inch before the clap**. The slate's usual fields
  (SCENE / TAKE / ROLL) are replaced by **WHO · HOOK · FORMAT**.
- **Brand device:** the **audience's footprints**, which are the real EBP logo split into its left and right foot.
  They walk a trail of signals (searched · saved · skipped · shared) across a sound-stage floor to the actor's red tape
  mark, which is where the clapperboard waits.
- **Payoff:** once the slate is filled, the music drops to silence and the clap lands **on the music drop**, followed
  by *"Research first. Then roll."* The footprints then step together into the real EBP logo for the end card.
- **Type (references/types.md):** `3d-product` shot grammar (macro → wide pull-back, slow orbit, a snap and land).
  The photo plates sit in `editorial-collage` frames.
- **Arc:** question and stakes in the first 3 s → consequence → proof → mechanism (what research decides) → cost →
  payoff on the drop → CTA. No logo before the end card.

---

## 3. Hook variants

| | Hook (VO) | Mechanism | First visual | Objective | Evidence needed |
|---|---|---|---|---|---|
| **H1 ★** | "Before anyone yells 'action'… who is this video for?" | pattern break + concrete question | the 3D clapstick freezes an inch before the clap; the music cuts out | watch time, authority | none (a question) |
| H2 | "The most expensive video you'll ever make is the one nobody was waiting for." | stakes / pain | a premiere screening room, every seat empty, the film still playing | comments, saves | none (opinion) |
| H3 | "Most teams research their audience after launch. That's an autopsy, not research." | contrarian | a production timeline card "AUDIENCE RESEARCH" ripped from the end and slapped at the start | comments, debate | none (opinion; "most" would need a source, so the line becomes "Too many teams…" if no source is found) |
| H4 | "Only one in four marketers say they understand their audience 'very well.'" | proof first | "25%" slams in, with the source line Brandwatch 2026 | trust | E2 (verified) |
| H5 | "Your audience leaves footprints everywhere. Most productions never follow them." | curiosity + brand | circuit footprints walking toward a red tape mark | brand recall | none |

Optional A/B test: the same body with an alternate first 4 s (H1 vs H3 or H4), posted as Instagram **Trial Reels**
(shown to non-followers first, metrics after about 24 h). Judge it on 3-second hold and completion rate, not on views.
Each alternate hook needs one extra VO line generated with the same voice and settings.

---

## 4. Voiceover script (LOCKED 2026-10-07, 100 words, about 40 s of speech)

The VO is generated manually in the ElevenLabs app (D1). The script needs no statistic. The proof beat is a principle
line, and any verified stat goes **on screen only** in F3, so the VO never waits on research.

| # | Beat | VO line | On-screen type |
|---|---|---|---|
| 1 | Hook | "Before anyone yells "action"... who is this video for?" | WHO IS THIS **FOR?** |
| 2 | Stakes | "A beautiful film, made for the wrong audience, plays to an empty room." | A beautiful film. **An empty room.** |
| 3 | Proof | "And no edit, no grade, no soundtrack can fix the wrong message." | ⟨verified stat + source, if found⟩ / NO EDIT · NO GRADE · NO SOUNDTRACK |
| 4 | Footprints | "Your audience is already leaving footprints. What they search. Save. Skip. Share." | SEARCH · SAVE · SKIP · SHARE |
| 5 | Turn | "Follow them first." | FOLLOW THEM **FIRST.** |
| 6 | Mechanism | "Research tells you who to cast, what hooks them in three seconds, and whether to shoot vertical... or wide." | WHO → cast & voice · HOOK → first 3 s · FORMAT → 9:16 or 16:9 |
| 7 | Cost | "Change it on paper? That costs an afternoon. Change it after the shoot? That's a reshoot." | ON PAPER: an afternoon · AFTER THE SHOOT: **a reshoot** |
| 8 | Payoff | "Research first. Then roll." | RESEARCH FIRST. **THEN ROLL.** |
| 9 | CTA | "Esha Bargate Productions. Let's find your audience... before we frame a single shot." | logo lockup + **BOOK A STRATEGY CALL** · eshabargateproductions.com |

**ElevenLabs (manual, in the app):**
- Voice **Sarah – Mature, Reassuring, Confident** (premade, `EXAVITQu4vr4xnSDxMaL`). Alternates: **Lily – Velvety
  Actress** (`pFZP5JQG7iQjIQuC4Bku`, British, more cinematic) and **George – Warm, Captivating Storyteller**
  (`JBFqnCBsd6RMkjVDRZzb`, British male).
- Model **Eleven Multilingual v2**. Speed 1.00 · Stability 50 % · Similarity 75 % · Style exaggeration 5 % · Speaker
  boost ON.
- One full read with a blank line between paragraphs. Make 3 takes and keep the best. Regenerate any weak line on its
  own with the same settings so it splices invisibly. Download the highest quality the plan offers.
- **Pronunciation:** confirm with the client how "Esha Bargate" is said. If the voice gets it wrong, respell it **in
  the VO text only** (the screen keeps the real spelling).

**In the pipeline:** the VO is split at its pauses (ffmpeg `silencedetect`), each line is placed on a bar line, the
words are aligned for the kinetic type and the `.srt`, and the result is resampled to 48 kHz `assets/audio/vo.wav`.
`tools/mix.py` ducks the music under it.

---

## 5. Shotlist (120 bpm, 2 s bars; times are provisional until the VO is placed)

| # | Time (bars) | Picture and motion (rule from `motion-feel.md`) | Transition in | Sound |
|---|---|---|---|---|
| F1 Hook | 0–4 s (0–1) | Macro on the clapstick hinge, already swinging (it cuts in on motion). It freezes 1 inch before the clap with a seeded micro-tremble. Macro → wide pull-back in log space over 3.5 s. "WHO IS THIS **FOR?**" rises through a mask, and FOR? is a red highlight sticker. | frame 0 is never empty | swing whoosh → a pitched-down "freeze" sting → music drops to a drone |
| F2 Stakes | 4–8 s (2–3) | Iris **out of the slate** into plate P1, an empty screening room with a projector beam, with a slow push 1.00 → 1.06. Two-line headline; "An empty room." is a sticker. | iris from the hero (SVG ring, centred on the slate's projected point) | whoosh peaking on the cut, projector hum bed |
| F3 Proof | 8–12 s (4–5) | **"49%"** count-up slam (number and scale share one curve; the % lands after) + "of ad-driven sales come down to **the creative**". Source line in Inter: "NCSolutions, 2023 · ~450 CPG campaigns". P1 blurred behind. The VO here is line 3 ("no edit, no grade, no soundtrack…"). | hard cut on the bar, on motion | one tick per digit, a hit on the last digit |
| F4 Footprints | 12–18 s (6–8) | Plate P2, a top-down sound-stage floor. The logo's two feet walk up toward the red T-mark, one step per beat, and each step lights its circuit traces. Signal stickers pop beside the steps, staggered 2–3 frames apart. | light sweep | one footstep per landing, panned L/R and physics-synced; soft pops at -20 dB |
| F5 Slate fills | 18–28 s (9–13) | The last footprint hits the T-mark and we push through to the 3D clapperboard in front of plate P3 (a defocused film set). A slow orbit, with chalk writing **WHO / HOOK / FORMAT**, one field per bar, and a 5 % push on each. On FORMAT, 9:16 and 16:9 frame-lines snap over the set. | push / zoom-through | a chalk scratch per stroke, a soft hit per field |
| F6 Cost | 28–35.5 s (14–17) | A split screen: P4 (a script page, warm and calm) against P5 (a huge film set, cold and costly). "an afternoon" against "**a reshoot**" (sticker). A red strike-line crosses the shoot side. A riser builds from 32 s and the clapstick swings open again. | push | riser into the gap |
| — Gap | 35.5–36 s | Silence. The clapstick hangs open at the top of its swing. | — | silence (30 dB under the drop) |
| F8 Payoff | 36–40 s (18–19) | **CLAP on the drop.** A closed-form hinge with a bounce that settles on the next beat, an impact shake, and a chalk-dust burst launched on the downbeat. "RESEARCH FIRST." then "**THEN ROLL.**" slam in. | the clap is the cut | a wood clap + boom + sub drop, with chalk-dust shimmer |
| F9 End card | 40–44 s (20–21) | The two feet step off the slate and settle side by side as the **real EBP logo PNG**. "ESHA BARGATE PRODUCTIONS" sets in Space Grotesk. A CTA sticker "**BOOK A STRATEGY CALL**" with eshabargateproductions.com. Circuit traces pulse on the beat and the camera drifts 1.00 → 1.04, so the card is never a still frame. | footprint walk | bell + the score's final chord |

**9:16 safe zones:** no text in the top 14 %, the bottom 20 % or the right 12 %. The hero and plates may bleed.
**16:9 re-block:** type sits left from x ≥ 120 and the hero right. Each format gets its own blocking; nothing is letterboxed.

---

## 6. Look

- **Palette** (EBP's own): ink `#0A0A0A` · surface `#141414` · chalk `#EDEDED` · **accent EBP red `#A81E22`** with a
  lip of `#7A1418` and a glint of `#DC2626` (thin lines and glows only) · muted `#A1A1AA` for source lines.
  Red never sets body text on dark; red words become **highlight stickers** (chalk text on a red box, about 6.4:1
  contrast).
- **Type:** Space Grotesk (display 700/500) + Inter (UI, sources). Both are OFL and bundled in `assets/fonts/`.
  The slate writing is Space Grotesk with a chalk-noise mask.
- **Background roles:** a breathing warm glow behind the clapperboard; the logo's circuit-trace motif drawn
  procedurally at 8–12 % opacity and drifting; projector haze in P1; grain at about 22 % over everything; plates graded
  to the palette (crushed blacks, red-leaning highlights) with slow pushes.
- **Banned (look.md):** centred title on a gradient, everything fading in, glassmorphism, cyan/purple neon, generic
  particle bursts, full-frame flashes.

---

## 7. Sound

- **Score** (`tools/score.py`, composed in code, so the rights are clear): style `cinematic`, D minor,
  chords `Dm Dm Bb C | Dm Bb Gm A`, sections intro 0 → full 4 → build 32 → **gap 35.5** → **drop 36 (the clap)** →
  outro 40. Music is ducked under the VO.
- **SFX:** one sound per visual event (§5). The cloud container doesn't have your `D:\Hyperframes\sfx` library, so
  SFX are synthesized in code: tick, click, pop, thump, whoosh, riser, bell and shimmer. The clap and footsteps are
  physics-synced from `src/physics.js`. Optional: the same ElevenLabs key can generate a real clapper snap, chalk
  scratches and a tape-stop.
- **Master:** `tools/mix.py` → -14 LUFS integrated, -1.9 dBFS ceiling.
- **Licensing:** the score and synth SFX are ours. ElevenLabs output is commercial only on a paid plan.

---

## 8. Assets

### Real
| Asset | Source | Use |
|---|---|---|
| EBP logo (footprints) | `eshabargateproductions.com/images/assets/erp-logo-transparent.png` | split into L/R feet for the walk; the whole logo on the end card |
| Space Grotesk, Inter | Google Fonts (OFL) | display and UI type |
| *(optional)* EBP production stills / posters | the client's own site | could replace P3/P5 if you'd rather use real material and have the client's OK |

### AI plates: OpenArt **GPT Image 2.5 Flare**, `text2image`, `resolutionTier: "1k"`, `quality: "low"`
Price checked: **5 credits per image** at 1K/low. Five plates × 2 formats (9:16 + 16:9) = 10 images = **50
credits**, plus at most 50 for retries. The OpenArt balance is 4,778 credits.
Plates are background photography only. **All words are HTML**, so no AI-rendered text reaches the screen.
1K/low plates are soft at 1080×1920, so they are graded, pushed slowly, partly defocused or framed as cards, and never
shown as a full-sharp hero.

**P1 · Empty screening room** (Stakes)
```
PURPOSE
Background photo plate for a vertical 9:16 social video scene about a film made for the wrong audience. Headline text is added later in editing.

SCENE
A small private cinema screening room at night. Rows of empty deep-crimson velvet seats. A projector beam cuts through faint haze from the back wall toward the screen; dust motes drift in the beam.

COMPOSITION
9:16 portrait. Low camera behind the last row, looking toward the front. The beam enters upper-left and crosses diagonally. The top 35% is dark, quiet space reserved for headline text; the seats fill the lower half with strong depth.

VISUAL DIRECTION
Photorealistic cinematic still, 35mm look, low-key. Charcoal shadows near #0A0A0A, seats close to #A81E22, warm tungsten beam, subtle film grain. No neon.

TEXT
No text, letters, numbers, signage, logos or watermarks anywhere.

CONSTRAINTS
No people or silhouettes. The screen shows only soft white light, no image. Nothing but dark ceiling and beam haze in the top third.
```
16:9 version: the same, with the room on the right two-thirds and the left third dark for type.

**P2 · Sound-stage floor with a red T-mark** (Footprints)
```
PURPOSE
Top-down background plate for a 9:16 video scene in which animated footprints walk toward an actor's mark. Graphics are added later.

SCENE
The matte black concrete floor of a film sound stage seen from directly above: faint scuffs, traces of old tape residue, light dust. One clean T-shaped actor's mark made of red gaffer tape.

COMPOSITION
9:16 portrait, perfectly top-down, flat and even. The red T-mark sits about 40% from the top, centred horizontally. The lower 60% is open, empty floor.

VISUAL DIRECTION
Photorealistic, low-key. One soft warm pool of light centred on the T-mark, falling off to near-black edges (#0A0A0A). Subtle floor texture, not busy. Tape colour close to #A81E22. Fine grain.

TEXT
No text, numbers, letters, logos or watermarks.

CONSTRAINTS
No footprints, shoes, people, cables or equipment in frame. Keep the floor even so overlaid graphics read clearly.
```
16:9 version: the T-mark at the right third, with open floor on the left two-thirds.

**P3 · Defocused film set at night** (backdrop behind the 3D clapperboard)
```
PURPOSE
Out-of-focus backdrop plate for a 9:16 video. A 3D clapperboard is composited in front of it, so the centre must stay calm.

SCENE
A film set at night inside a dark studio: a cinema camera on a tripod, C-stands, a large softbox, a glowing director's monitor, practical bulbs far in the background.

COMPOSITION
9:16 portrait, eye level. Everything heavily out of focus with large round bokeh. Equipment at the frame edges; the central 50% stays dark and uncluttered.

VISUAL DIRECTION
Photorealistic cinematic bokeh, deep charcoal ambience, warm tungsten highlights with a few deep-red accents near #A81E22, light haze, film grain. No cyan or purple neon.

TEXT
No text, screen UI, numbers, logos or watermarks. The monitor shows only soft abstract light.

CONSTRAINTS
No people, faces or brand marks on equipment.
```

**P4 · Script page on a desk** ("on paper")
```
PURPOSE
Plate for the "change it on paper" half of a split screen in a 9:16 video. It should feel calm and inexpensive.

SCENE
Overhead view of a printed screenplay page on a dark walnut desk at night. A red pen lies across it, a warm desk-lamp pool falls on it, and a coffee cup sits at the edge.

COMPOSITION
9:16 top-down. The page fills the middle 60% at a slight angle. Shallow depth of field.

VISUAL DIRECTION
Warm and quiet. Off-white paper, red pen close to #A81E22, deep shadows, fine grain.

TEXT
The page's typed lines are soft, unreadable grey strokes. No legible words, letters, numbers, titles or logos anywhere.

CONSTRAINTS
No hands, people or brand marks.
```

**P5 · Big film set** ("after the shoot")
```
PURPOSE
Plate for the "after the shoot" half of a split screen in a 9:16 video. It must read as large and expensive.

SCENE
A large sound-stage film set: a camera crane, lighting rigs, a dolly track and a crew of 8–10 people seen from behind or in silhouette, working around a set piece.

COMPOSITION
9:16 portrait, high-angle wide shot. The crew is small in frame and the depth is strong. The lower third is calmer for type.

VISUAL DIRECTION
Photorealistic and cinematic: cool-neutral ambience, hot tungsten practicals, haze, deep shadows, a few red accents.

TEXT
No text, signage, numbers, logos or watermarks.

CONSTRAINTS
No identifiable faces (backs, silhouettes and motion only). No brand marks.
```
**Acceptance check per plate:** no letter-like artefacts; the reserved negative space is actually empty; the palette
sits within the EBP ink/red range; no faces (P5); the plate survives the 9:16 safe-zone overlay.

---

## 9. Execution steps (after approval)

1. `node .claude/skills/hyperreel/scripts/scaffold.mjs videos/ebp-research-before-production --formats 9x16,16x9 --duration 44 --bpm 120 --title "Research Before Production"`
   *(installs Chrome headless shell via `npx hyperframes browser ensure`, and `pip install soundfile`)*
2. **Assets:** logo split into L/R feet (PIL), fonts bundled, plates P1–P5 generated (10 images). I send you a
   contact sheet.
3. **VO:** you upload the ElevenLabs read → split at pauses, lines placed on bars, words aligned →
   `vo.wav` + `words.json` + `captions.srt`.
4. **Score + beat grid** (`score.py`); VO lines placed on bars; duration locked.
5. **STORYBOARD.md** with frame stills → your OK (the hyperreel shotlist stop).
6. **Build:** `body.html`, `film.css`, `film.js`, `hero3d.js` (the clapperboard), `physics.js` (hinge + footsteps →
   SFX events); `build.mjs`; `lint`.
7. **SFX + mix** (-14 LUFS).
8. **Review loop:** snapshots per beat in both formats, critique ≥ 8 on all 8 criteria (at least 2 rounds), `check`
   with 0 errors (once with `--samples 30`).
9. **Drafts** (30 fps) → you review → **finals** (60 fps): `renders/ebp_research_first_9x16.mp4` and `_16x9.mp4`,
   with `.srt` and lighter upload copies.
10. `LESSONS.md` and commit/push to `claude/zealous-wright-jhhan4`.

## 10. Risks and open items
- **No GPU in the cloud container.** Software WebGL works but is slower. The finals are best rendered on your RTX PC
  (see D4).
- **ElevenLabs key** (D1). Until it's added, I can do everything except the VO, including placeholder timing from the
  script.
- **Logo PNG edge fringe:** on a dark background the logo shows a thin light halo (anti-aliasing against white).
  Prep de-fringes the edges toward the logo red before use. The L/R split was test-cut: 256×620 px per foot, clean.
  The logo is 772 px tall, so it is never zoomed past about 1:1 on screen. For a bigger reveal it would be vectorised.
- **Stats:** only verified figures with a source go on screen. If a line can't be sourced, it becomes an
  opinion/principle line.
- **The score is unheard** (composed in code): please listen to the draft.
