// Closed-form motion shared by the picture and the sound (UMD: browser global PHYS, or Node via globalThis).
// Example: a hero that spins fast, coasts, and stops ON the drop; ticks every 12° for the SFX.
// Export events for sfx.py:  node --input-type=module -e "await import('./src/physics.js'); import fs from 'node:fs';
//   fs.writeFileSync('assets/audio/ticks.json', JSON.stringify(globalThis.PHYS.TICKS))"
(function (root, factory) {
  const M = factory();
  if (typeof module === 'object' && module.exports) module.exports = M;
  else root.PHYS = M;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const TL = (typeof window !== 'undefined' && window.TL) || {};
  const DROP = (TL.marks && TL.marks.drop) || 11, PEG = 12;
  // angle (deg): exponential coast from W0 °/s to a stop exactly at DROP, landing on TARGET (mod 360)
  const W0 = 900, T0 = 0, TARGET = 360 * 6 + 210;
  const shape = (t) => (t <= T0 ? 0 : t >= DROP ? 1 : 1 - Math.pow(1 - (t - T0) / (DROP - T0), 2.6));
  function angle(t) {
    if (t >= DROP) { const x = t - DROP; return TARGET - 1.4 * (x / 0.1) * Math.exp(1 - x / 0.1); }   // tiny rock back
    return TARGET * shape(t);
  }
  function omega(t, h = 1 / 240) { return (angle(t + h) - angle(t - h)) / (2 * h); }
  // events: every time the angle crosses a multiple of PEG
  const TICKS = [];
  { let prev = angle(0); for (let t = 1 / 4000; t <= DROP + 0.5; t += 1 / 4000) {
      const cur = angle(t), a = Math.floor(prev / PEG), b = Math.floor(cur / PEG);
      if (a !== b) TICKS.push({ t: +t.toFixed(5), dir: b > a ? 1 : -1 }); prev = cur; } }
  return { angle, omega, TICKS, DROP, W0 };
});
