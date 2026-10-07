// hyperreel starter: HTML layer + timeline. Pure function of time. Replace the demo shots with the approved shotlist.
(() => {
  const root = document.getElementById('root');
  const W = +root.dataset.width, H = +root.dataset.height, TALL = H > W;
  const TL = window.TL || {}, M = TL.marks || {};
  const $ = (id) => document.getElementById(id);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const pick = (tall, wide) => (TALL ? tall : wide);
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
  const px = (v) => `${v}px`;
  function put(el, x, y, w, h) { el.style.left = px(x); el.style.top = px(y); if (w != null) el.style.width = px(w); if (h != null) el.style.height = px(h); }
  const font = (el, size) => { el.style.fontSize = px(size); };

  // ---- the 3D hero's camera intents, per format (screen px of the target, px per world unit, angles)
  const cam = (sx, sy, spx, pitch = 0, yaw = 0, T = [0, 0, 0], roll = 0) => ({ T, sx, sy, spx, pitch, yaw, roll, fov: 30 });
  window.__HERO_CFG = { W, H, TALL, CAM: pick({
    macro: cam(540, 1150, 1400, 28, -24, [0, 0.9, 0.05], 4), front: cam(540, 1180, 420), end: cam(540, 1500, 300, 12, -10),
  }, {
    macro: cam(1380, 620, 1300, 28, -24, [0, 0.9, 0.05], 4), front: cam(1380, 560, 380), end: cam(1500, 560, 300, 12, -10),
  }) };
  // the runtime waits for this before capturing (resolved by hero3d.js once textures are in and frame 0 is drawn)
  window.__hf = window.__hf || {}; window.__hf.buildReady = window.__hf.buildReady || {};
  window.__hf.buildReady['hero3d'] = new Promise((res) => { window.__hero3dReady = res; });

  // ---- layout (computed once)
  put($('s1-head'), pick(72, 120), pick(300, 330)); font($('s1-head'), pick(100, 108));
  put($('s2-eye'), pick(72, 120), pick(760, 380)); font($('s2-eye'), pick(28, 30));
  put($('s2-title'), pick(72, 120), pick(808, 430)); font($('s2-title'), pick(120, 150));
  for (const [g, d] of [[$('s1-glow'), 2000], [$('s2-glow'), 1800]]) put(g, -d / 2, -d / 2, d, d);

  // ---- per-frame render: anything continuous (glows, counters, props, particles) + the 3D hero
  const G1 = $('s1-glow'), G2 = $('s2-glow'), grain = $('grain');
  function render(t) {
    window.__lastT = t;
    if (window.__hero3d) window.__hero3d.render(t);
    const s = window.__hero3d && window.__hero3d.screen;              // the hero's projected centre, if drawn
    if (s) G1.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px) scale(${(0.95 + 0.06 * Math.sin(t * 1.6)).toFixed(4)})`;
    G2.style.transform = `translate(${W / 2}px, ${H * 0.45}px) scale(${(1 + 0.05 * Math.sin(t * 1.2)).toFixed(4)})`;
    const f = Math.floor(t * 60); grain.style.backgroundPosition = `${(f * 37) % 256}px ${(f * 91) % 256}px`;
  }

  // ---- timeline + helpers
  const tl = gsap.timeline({ paused: true });
  // masked rise / lift: words start 140 % below and transparent, so nothing peeks or reads while hidden
  const rise = (els, at, o = {}) => {
    tl.fromTo(els, { yPercent: 140 }, { yPercent: 0, duration: o.d || 0.62, ease: o.ease || 'expo.out', stagger: o.stagger ?? 0.09 }, at);
    return tl.fromTo(els, { opacity: 0 }, { opacity: 1, duration: 0.06, ease: 'none', stagger: o.stagger ?? 0.09 }, at);
  };
  const lift = (els, at, o = {}) => {
    const d = o.d || 0.26;
    tl.fromTo(els, { yPercent: 0 }, { yPercent: -140, duration: d, ease: 'power3.in', stagger: o.stagger ?? 0.025, immediateRender: false }, at);
    return tl.fromTo(els, { opacity: 1 }, { opacity: 0, duration: 0.04, ease: 'none', stagger: o.stagger ?? 0.025, immediateRender: false }, at + d - 0.04);
  };
  // iris out of a point into the next scene, a constant-width ring riding the edge (works with WebGL layers).
  // (cx, cy) must be the hero's point ON SCREEN at that moment (a lifted/tilted part sits away from its camera target —
  // measure it on a snapshot). Frame the next scene's hero centred on the same point so the hole reveals it, then spring
  // it to its own framing. R just clears the farthest corner, so the wipe never idles off-screen.
  // This clips scene divs only. With ONE full-frame canvas shared by every scene, drive the same circle from render(t)
  // instead: canvas clipped to the hole + ~24 px, outgoing front type layers get the inverse (hyperframes-contract.md).
  function iris(fromSel, toSel, at, cx, cy, dur = 0.6) {
    const R = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) + 30, ring = $('t-ring');
    put(ring, 0, 0, W, H); ring.setAttribute('viewBox', `0 0 ${W} ${H}`);
    $$('circle', ring).forEach((c) => { c.setAttribute('cx', cx); c.setAttribute('cy', cy); });
    tl.set(toSel, { opacity: 1, clipPath: `circle(0px at ${cx}px ${cy}px)` }, at - 0.03);
    tl.fromTo(toSel, { clipPath: `circle(0px at ${cx}px ${cy}px)` }, { clipPath: `circle(${R}px at ${cx}px ${cy}px)`, duration: dur, ease: 'power2.in', immediateRender: false }, at);
    tl.set(toSel, { clipPath: 'none' }, at + dur + 0.01);
    tl.fromTo('#t-ring circle', { attr: { r: 0 } }, { attr: { r: R }, duration: dur, ease: 'power2.in' }, at);
    tl.fromTo('#t-ring', { opacity: 0 }, { opacity: 1, duration: 0.04, ease: 'none' }, at);
    tl.to('#t-ring', { opacity: 0, duration: 0.08, ease: 'none' }, at + dur - 0.08);
    tl.fromTo(fromSel, { scale: 1, filter: 'blur(0px)' }, { scale: 1.16, filter: 'blur(6px)', duration: dur, ease: 'power2.in', transformOrigin: `${cx}px ${cy}px`, immediateRender: false }, at);
    tl.set(fromSel, { opacity: 0 }, at + dur + 0.03);
  }
  // warm light sweep that over-exposes into the next scene
  function lightSweep(fromSel, toSel, at) {
    put($('t-light'), -0.8 * W, -0.6 * H, 2.6 * W, 2.2 * H);
    tl.fromTo('#t-light', { opacity: 0, x: -0.55 * W, y: -0.3 * H, scale: 0.85 }, { opacity: 1, x: 0, y: 0, scale: 1, duration: 0.38, ease: 'power2.in' }, at);
    tl.to('#t-light', { opacity: 0, x: 0.5 * W, y: 0.28 * H, scale: 1.1, duration: 0.55, ease: 'power2.out' }, at + 0.38);
    tl.fromTo(fromSel, { filter: 'brightness(1)' }, { filter: 'brightness(1.85)', duration: 0.36, ease: 'power2.in', immediateRender: false }, at + 0.02);
    tl.set(toSel, { opacity: 1 }, at + 0.36);
    tl.fromTo(toSel, { filter: 'brightness(1.85)' }, { filter: 'brightness(1)', duration: 0.6, ease: 'power2.out', immediateRender: false }, at + 0.36);
    tl.set(fromSel, { opacity: 0 }, at + 0.4);
  }

  // ---- demo shots (replace)
  const hw = $$('#s1-head .wi');
  tl.fromTo(hw[0], { yPercent: 55 }, { yPercent: 0, duration: 0.5, ease: 'expo.out' }, 0);     // frame 0 already reads
  rise(hw.slice(1, 3), 0.25, { stagger: 0.25 });
  rise(hw.slice(3), 1.0, { stagger: 0.25 });
  iris('#s1', '#s2', M.end ?? 13, pick(540, 1380), pick(1180, 560));
  rise($$('#s2-eye .wi'), (M.end ?? 13) + 0.2, { d: 0.5 });
  rise($$('#s2-title .wi'), (M.end ?? 13) + 0.3, { stagger: 0.12 });

  // ---- clock: drives render(t) on every seek
  const D = TL.duration || 15, CLK = { t: 0 };
  tl.fromTo(CLK, { t: 0 }, { t: D, duration: D, ease: 'none', onUpdate: () => render(CLK.t) }, 0);
  window.addEventListener('hf-seek', (e) => render(e.detail.time));
  render(0);
  window.__timelines['main'] = tl;
})();
