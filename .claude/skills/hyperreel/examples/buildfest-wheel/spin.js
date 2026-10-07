// Wheel physics shared by the picture (inlined into the composition) and the sound (node tools/audio.mjs).
// Pure functions of film time t (seconds). Angles in degrees, clockwise positive (CSS rotate).
// Pegs sit every 12° on the rim; a peg passes the pointer whenever the wheel angle crosses a multiple of 12°.
(function (root, factory) {
  const M = factory();
  if (typeof module === 'object' && module.exports) module.exports = M; else root.SPIN = M;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const PEG = 12;

  // ---------------------------------------------------------------- scene 1: hook spin that settles into a slow drift
  // exponential decay from W0 to WEND; tuned so the Kitchen slice is back at 12 o'clock at t = 4 s
  const W0 = 640, WEND = 16, TAU = 0.72;
  const T0 = -(WEND * 4 + (W0 - WEND) * TAU * (1 - Math.exp(-4 / TAU)));
  function wheel1(t) { return T0 + WEND * t + (W0 - WEND) * TAU * (1 - Math.exp(-t / TAU)); }
  function omega1(t) { return WEND + (W0 - WEND) * Math.exp(-t / TAU); }
  // rings phase (t ≥ 8): every ring drifts at its own rate so the exploded stack never moves in lockstep
  const RING_RATE = { rim: 6, outer: 6, middle: -14, inner: 22, hub: -30 };
  function ringOffset(name, t) {
    if (t <= 8) return 0;
    const u = t - 8;
    return RING_RATE[name] * (u - 0.6 * (1 - Math.exp(-u / 0.6)));
  }

  // ---------------------------------------------------------------- scene 2: the spin that lands on the drop
  // Rest until 16.5, a 22° wind-up back, launch at 17.0, land at 22.0 on wheel angle ≡ 210° (mod 360):
  // the pointer then reads wheel-angle 150°, inside the "Experience" slice (Private Cinema Experience).
  const LAUNCH = 17.0, LAND = 22.0, WIND = 22, R0 = 22;
  const TARGET = 210 + 360 * 4;                 // total travel after the wind-up (4 full turns + 210°)
  const DT = 1 / 2000;
  // velocity profile (deg/s) before scaling: quick push, long exponential coast, slow ratchet crawl, stop
  function vShape(t) {
    if (t < LAUNCH || t >= LAND) return 0;
    const u = t - LAUNCH;
    const ramp = 1 - Math.exp(-u / 0.05);
    if (t < 20.8) return ramp * Math.exp(-u / 1.175);                // coast (fast part, scaled below)
    return null;                                                        // handled by the crawl
  }
  // crawl: 20.8 → 21.86 at 60 → 30 °/s, then 30 → 0 by 22.0 (smooth)
  function vCrawl(t) {
    if (t < 20.8 || t >= LAND) return 0;
    if (t < 21.86) return 60 - 30 * (t - 20.8) / 1.06;
    const x = (t - 21.86) / 0.14; return 30 * (1 - x) * (1 - x) * (1 + 2 * x) * (1 - x * 0.0);
  }
  // integrate once, scale the coast so the total lands exactly on TARGET
  const N = Math.round((LAND - LAUNCH) / DT);
  let coastSum = 0, crawlSum = 0;
  for (let i = 0; i < N; i++) {
    const t = LAUNCH + (i + 0.5) * DT, s = vShape(t);
    if (s != null) coastSum += s * DT; else crawlSum += vCrawl(t) * DT;
  }
  // continuity at 20.8: coast velocity there must equal 60 °/s → solve the scale from that, then fix the
  // remaining travel by stretching the coast amplitude slightly (the crawl stays exactly as designed)
  const K = (TARGET - crawlSum) / coastSum;
  const TABLE = new Float64Array(N + 1);
  { let a = 0; TABLE[0] = 0;
    for (let i = 0; i < N; i++) {
      const t = LAUNCH + (i + 0.5) * DT, s = vShape(t);
      a += (s != null ? K * s : vCrawl(t)) * DT; TABLE[i + 1] = a;
    }
    const fix = TARGET / TABLE[N]; for (let i = 0; i <= N; i++) TABLE[i] *= fix; }
  const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
  function wheel2(t) {
    if (t < 16.5) return R0;
    if (t < LAUNCH) return R0 - WIND * smooth((t - 16.5) / 0.5);
    const base = R0 - WIND;
    if (t < LAND) {
      const f = (t - LAUNCH) / DT, i = Math.floor(f), w = f - i;
      return base + TABLE[i] + (TABLE[Math.min(N, i + 1)] - TABLE[i]) * w;
    }
    // landing: the flapper nudges the wheel back a hair, then it settles
    const x = t - LAND, rock = 1.4 * (x / 0.1) * Math.exp(1 - x / 0.1);
    return base + TARGET - rock;
  }
  function omega2(t, h = 1 / 240) { return (wheel2(t + h) - wheel2(t - h)) / (2 * h); }

  // ---------------------------------------------------------------- ticks: every time a peg passes the pointer
  function ticks(fn, t0, t1, step = 1 / 4000) {
    const out = []; let prev = fn(t0);
    for (let t = t0 + step; t <= t1; t += step) {
      const cur = fn(t), a = Math.floor(prev / PEG), b = Math.floor(cur / PEG);
      if (a !== b) {
        const dir = b > a ? 1 : -1, n = Math.abs(b - a);
        for (let k = 0; k < n; k++) {
          const edge = (dir > 0 ? a + 1 + k : a - k) * PEG, f = (edge - prev) / (cur - prev);
          const tt = t - step + step * f;
          out.push({ t: +tt.toFixed(5), speed: Math.abs((cur - prev) / step), dir });
        }
      }
      prev = cur;
    }
    return out;
  }
  const TICKS1 = ticks(wheel1, 0, 8.0);              // the pointer leaves the shot once the wheel tilts at 8 s
  const TICKS2 = ticks(wheel2, 16.0, 24.0);

  // flapper deflection (deg, positive = pushed toward the direction of travel), sum of the recent pulses
  function flap(list, t) {
    let lo = 0, hi = list.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (list[m].t <= t) lo = m + 1; else hi = m; }
    let d = 0;
    for (let i = lo - 1; i >= 0 && i >= lo - 10; i--) {
      const x = t - list[i].t;
      if (x > 0.6) break;
      const amp = 9 * list[i].dir;
      d += x < 0.014 ? amp * (x / 0.014) : amp * Math.exp(-(x - 0.014) / 0.06) * Math.cos(((x - 0.014) / 0.19) * Math.PI * 2);
    }
    return Math.max(-14, Math.min(14, d));
  }

  return { PEG, wheel1, omega1, ringOffset, wheel2, omega2, TICKS1, TICKS2, flap, LAUNCH, LAND, TARGET, R0, WIND };
});
