# BREAKDOWN — the timing contract (measured from the reference)

Measured with launch-video-clone `burst.py` on the user's reference (1280×720, 30 fps, 930 frames ≈ 31.0 s,
15 hard cuts). The reference file stays outside the repo. This file keeps only what we copy: **cut frames, move
types, easing, camera energy and transition types**. Copy, artwork, photos, logos and music are all new and listed in
STORYBOARD.md.

Global: 1920×1080 (the reference is 1280×720, scaled ×1.5), **30 fps**, 930 frames. The music is original at
148 bpm (74 half-time feel). Every reference cut lies within ±2.3 frames of that eighth-note grid, so we keep the
reference cut frames exactly and the score follows them.

| # | frames | dur | role | in | main motion (frames, easing) | out |
|---|---|---|---|---|---|---|
| 1 | 0–38 | 1.30 s | dark kinetic hook | frame 0 already moving: hairline + ticks drift | f14 frame lines appear; f18 brackets snap; f19–21 word glow pop (ease-in-out, 3 f); f24–38 glyph shards scatter in | hard cut + 1-frame light flash (f39) |
| 2 | 39–58 | 0.67 s | word swap 2 | flash frame f39 | f40–44 shards burst outward (ease-out); f45 2nd layer of fragments pops in; f50 deeper layer + depth blur | hard cut + flash (f59) |
| 3 | 59–232 | 5.80 s | word swap 3 → signal → network → collapse | flash f59 | f62–68 sticker highlight on the word, then glow bloom; f71–83 camera pans right past the word (word blurs off left), a dot + wiggle line emerges; f86–101 wiggle grows; f104–119 line splits into ~8 threads (ease-out); f119–137 camera pushes up-right toward nodes; f128–149 node icons + labels type on; f152–167 camera re-frames lower nodes; f170–173 push to 2 more nodes; f176 pull back wide (fast); f176–206 hold wide (slow drift); f209–221 threads retract, labels fade, nodes become dots; f221–227 dots arrange on a ring (8); f230–232 dots stretch into dashes | hard cut to light ground |
| 4 | 233–267 | 1.17 s | ring reveal | dashes on a blurred light ground | f233–236 dashes close into a ring (ease-out, fast start); f235–245 word types inside the disc (1 char / 2 f); f241–259 ring shimmer rotates; f261–267 ring multiplies into concentric ripples expanding (ease-in) | zoom-through |
| 5 | 268–338 | 2.37 s | brand build | ripples rush past camera (f268–283, ease-out) | f283–289 small word fades; f289 construction guides draw; f292–304 wordmark builds L→R (1 glyph / ~3 f); f304–328 hold with guides; f331 guides fade; f334–338 wordmark spreads + blurs out (ease-in) | cut |
| 6 | 339–399 | 2.03 s | prompt over photo | tilted, blurred push settling (f339–352, ease-in-out) + light wash | f342–360 input box + typing (≈1 char / f); f360–372 hold; f370–387 camera push to the send button (log zoom, ease-out with overshoot); f387–399 hold + button arrow starts rotating | cut on the arrow turn |
| 7 | 400–407 | 0.27 s | burst start | arrow rotating | f400–407 cards fly out radially from the button (ease-in, 5 f) | cut |
| 8 | 408–437 | 1.00 s | card fan | cards already spinning | f408–413 fan settles (ease-out + overshoot); continuous rotation; arrow turns with it; f426–437 hub grows | zoom into the hub |
| 9 | 438–467 | 1.00 s | one-word punch | zoom through the hub (f438–450 ease-out + overshoot) | f442–452 word types with per-letter drop (1 letter / 2 f), colour settles; f452–462 hold; f462–464 selection box; f464–467 split/slice | selection box becomes the window |
| 10 | 468–522 | 1.83 s | code window over photo | window materialises (f468–472 ease-out) | f471–495 code types line by line; f480–520 slow camera drift; f517–522 window lifts fast (ease-in) | cut |
| 11 | 523–533 | 0.37 s | close-up | tilted close push from bottom (ease-out) | lines tick green one per ~2 f | cut |
| 12 | 534–590 | 1.90 s | error + fix | warm-red grade, close-up | f534–538 settle (ease-out); f543–560 error line + "fixing" label; f561–582 scramble on the bad value; f582–588 resolves; f581–590 scroll down (ease-in-out + overshoot) | cut |
| 13 | 591–631 | 1.37 s | result | window rises from the bottom over the photo (spring, f591–603) | 3D object turns in the right half of the window; slow drift | dark motion-blur smear (f631) |
| 14 | 632–796 | 5.50 s | data → structure | blurred labels fade up on warm paper (f632–641) | f641–676 drift + rack focus through big labels (ease-in-out); f677 dissolve; f680–700 labels reappear small in final layout; f700–725 structure grows linking labels (ease-out); f725–731 blur pulse; f731–796 settled, motes drifting, slow push | cut |
| 15 | 797–929 | 4.43 s | tagline over sky → end card | photo, slow drift | f800 word 1 in (blur-fade); f803 word 2; f821 word 3; f824 accent word A; f848 accent B (blur cross-fade); f867–874 accent C (ease-out + overshoot); f894–899 lockup in; hold to the end | end |

Hidden structure: shots 2–3 open on a single light flash frame (f39, f59). Shot 9 → 10 hands off through a selection
box, not a cut-to-black.

**As built:** shots 1–13 use these frames exactly. The user's VO (35 s) is longer than the reference (31 s), so shot
14 was stretched to 21.07–28.0 s (its drift, dissolve, structure growth and settle keep their order and easing) and
shot 15 to 28.0–35.0 s. Everything else stayed on the measured cut frames.
