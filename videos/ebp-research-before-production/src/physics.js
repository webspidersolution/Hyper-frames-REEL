// Closed-form motion shared by the picture and the sound (UMD: browser global PHYS, or Node via globalThis).
// Export the events for sfx.py:  node tools/export_events.mjs   → assets/audio/steps.json, assets/audio/clap.json
//   CLAP  — the clapstick hinge angle (deg, 0 = shut): swings at frame 0, freezes an inch before contact, is re-armed
//           on the slate scene, raised in the gap and snaps shut ON the drop with two decaying bounces.
//   STEPS — the audience's footprints: four steps on the beat, four ON the spoken words (search · save · skip · share),
//           the last one landing on the T-mark; then two steps into the logo after the clap.
(function (root, factory) {
  const M = factory();
  if (typeof module === 'object' && module.exports) module.exports = M;
  else root.PHYS = M;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const TL = (typeof window !== 'undefined' && window.TL) || globalThis.TL || {};
  const M = TL.marks || {};
  const BEAT = 60 / (TL.bpm || 134.5);
  const FREEZE = 0.45, SLATE = M.slate ?? 24.98141, GAP = M.gap ?? 40.14843, DROP = M.drop ?? 41.04089;
  const SNAP = 0.11, E = 0.3;                                   // closing time, bounce restitution
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

  // seeded tremble (sum of sines, decaying after the freeze)
  const tremble = (t, t0, amp) => amp * Math.exp(-(t - t0) / 0.9) * (0.7 * Math.sin(2 * Math.PI * 9.3 * (t - t0)) + 0.3 * Math.sin(2 * Math.PI * 14.1 * (t - t0) + 1.3));

  // bounce train after the impact at DROP: first rebound lasts B0, each next one E times as long and E² as high
  const B0 = 0.07, H0 = 3.2;
  const BOUNCES = [];
  { let t = DROP, d = B0, h = H0; for (let k = 0; k < 3; k++) { BOUNCES.push({ t0: t, d, h }); t += d; d *= E * 1.6; h *= E * E * 2.6; } }

  function clap(t) {
    if (t < FREEZE) { const u = clamp(t / FREEZE); return 34 - 28 * Math.pow(u, 1.35); }        // swinging, accelerating
    if (t < SLATE - 0.2) return 6 + tremble(t, FREEZE, 0.9);                                     // frozen an inch above
    if (t < GAP) return 30 + 0.6 * Math.sin((t - SLATE) * 1.9);                                  // re-armed, breathing
    if (t < DROP - SNAP) return 38 + tremble(t, GAP, 1.4) * 0.8;                                 // raised high in the silence
    if (t < DROP) { const u = clamp((t - (DROP - SNAP)) / SNAP); return 38 * (1 - Math.pow(u, 2.2)); }   // the snap
    for (const b of BOUNCES) if (t < b.t0 + b.d) return b.h * Math.sin(Math.PI * (t - b.t0) / b.d);
    return 0;
  }
  const CLAP_EVENTS = [{ t: +DROP.toFixed(5), g: 1 }].concat(BOUNCES.map((b, i) => ({ t: +(b.t0 + b.d).toFixed(5), g: +(0.32 / (i + 1) ** 1.5).toFixed(3) })));

  // footprints: [time, foot, sticker word?]
  const beatAfter = (t0, n) => +(t0 + n * BEAT).toFixed(5);
  const FP = M.footprints ?? 16.05948;
  const W = TL.cues || {};                                      // spoken-word times (timeline.json → cues, from words.json)
  const STEPS = [
    { t: beatAfter(FP, 1), foot: 'l' }, { t: beatAfter(FP, 3), foot: 'r' }, { t: beatAfter(FP, 5), foot: 'l' }, { t: beatAfter(FP, 7), foot: 'r' },
    { t: W.search ?? 20.09, foot: 'l', word: 'SEARCH' }, { t: W.save ?? 20.74, foot: 'r', word: 'SAVE' },
    { t: W.skip ?? 21.56, foot: 'l', word: 'SKIP' }, { t: W.share ?? 22.47, foot: 'r', word: 'SHARE' },
    { t: beatAfter(FP, 17), foot: 'l' }, { t: beatAfter(FP, 19), foot: 'r', mark: true },
  ];
  const END_STEPS = [{ t: beatAfter(DROP, 2), foot: 'l' }, { t: beatAfter(DROP, 3), foot: 'r' }];

  return { clap, CLAP_EVENTS, STEPS, END_STEPS, BEAT, FREEZE, SLATE, GAP, DROP };
});
