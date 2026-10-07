// Shubh Griha Build Fest 2026 — 30 s reel (hybrid). The hero wheel is Three.js (src/wheel3d.js, its own module);
// every word, card and the CTA is HTML animated on one paused GSAP timeline that HyperShader manages (2 shader cuts).
// render(t) is a pure function of film time, driven by a full-length clock tween and by hf-seek.
(() => {
  const root = document.getElementById('root');
  const TALL = !root.classList.contains('wide');
  const W = +root.dataset.width, H = +root.dataset.height;
  const $ = (id) => document.getElementById(id);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
  function mulberry32(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
  function noise1(seed) { const r = mulberry32(seed), v = Array.from({ length: 256 }, () => r() * 2 - 1);
    return (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return v[i & 255] + (v[(i + 1) & 255] - v[i & 255]) * u; }; }
  const FL = noise1(53);

  // ------------------------------------------------------------------ the 3D wheel's camera intents (screen px per format)
  const cam = (sx, sy, spx, pitch = 0, yaw = 0, T = [0, 0, 0], roll = 0) => ({ T, sx, sy, spx, pitch, yaw, roll, fov: 30 });
  const CAM = TALL ? {
    hook0: cam(540, 1150, 1500, 30, -26, [0, 0.95, 0.03], 4), front: cam(540, 1180, 480),
    sun: cam(540, 1830, 648, -9), rings: cam(540, 770, 395, 14, -8, [0, 0.22, 0.1]),
    front2: cam(540, 1190, 440, 7, -9), win2: cam(540, 1310, 378, 10, -4), off2: cam(540, 1880, 550, -8, 0),
  } : {
    hook0: cam(1440, 660, 1400, 30, -26, [0, 0.95, 0.03], 4), front: cam(1440, 600, 400),
    sun: cam(1460, 1240, 520, -9), rings: cam(1440, 580, 370, 14, -8, [0, 0.22, 0.1]),
    front2: cam(1380, 600, 400, 7, -9), win2: cam(1450, 612, 380, 10, -4), off2: cam(1500, 662, 390, 4, -6),
  };
  const G1d = (TALL ? 960 : 800) * 2.2, G2d = (TALL ? 880 : 800) * 2.3;
  window.__WHEEL_CFG = { W, H, TALL, CAM, G1: G1d, G2: G2d };
  window.__hf = window.__hf || {}; window.__hf.buildReady = window.__hf.buildReady || {};
  window.__hf.buildReady['wheel3d'] = new Promise((res) => { window.__wheel3dReady = res; });

  // ------------------------------------------------------------------ text + card layout (per format; computed once)
  const px = (v) => `${v}px`;
  function put(el, x, y, w, h) { el.style.left = px(x); el.style.top = px(y); if (w != null) el.style.width = px(w); if (h != null) el.style.height = px(h); }
  const font = (el, size) => { el.style.fontSize = px(size); };
  const T = TALL ? {
    hook: [72, 300, 100], diya: [72, 300, 66], eyebrow: [72, 394, 26], t1: [72, 434, 118], t2: [84, 570, 98], trule: [72, 704, 860], date: [96, 744, 80, 36],
    rhead: [72, 290, 84], card: [72, 1050, 878, null], cardPad: [34, 40], ctag: 22, ctitle: 46, row: 37, icon: 40, tile: [222, 150, -64, 26],
    steps: [72, 288, 104], weye: [72, 292, 26], wt: [72, 334, 84], tv: [72, 540, 420, 262], wcap: [528, 590, 27, 430],
    o1: [72, 296, 52], o30: [56, 380, 380], o2: [72, 742, 92], orule: [72, 864, 860], o3: [72, 900, 70], o4: [72, 986, 30], odate: [96, 1046, 80, 36],
    photo: [72, 250, 936, 770], logo: [72, 1064, 250], btn: [560, 1090, 390, 104, 44], phone: [72, 1232, 88], url: [72, 1344, 46],
    qr: null, tc: [72, 1432, 24],
  } : {
    hook: [120, 310, 96], diya: [120, 150, 76], eyebrow: [120, 248, 28], t1: [120, 304, 146], t2: [134, 464, 120], trule: [120, 626, 1040], date: [146, 670, 86, 40],
    rhead: [120, 172, 88], card: [120, 520, 860, null], cardPad: [36, 44], ctag: 22, ctitle: 48, row: 38, icon: 42, tile: [230, 156, -70, 30],
    steps: [120, 226, 140], weye: [120, 210, 28], wt: [120, 254, 96], tv: [120, 512, 450, 280], wcap: [600, 584, 28, 400],
    o1: [120, 196, 56], o30: [104, 290, 330], o2: [120, 600, 96], orule: [120, 724, 900], o3: [120, 760, 76], o4: [120, 850, 30], odate: [146, 896, 84, 38],
    photo: [1130, 130, 680, 820], logo: [120, 170, 400], btn: [120, 470, 400, 112, 48], phone: [120, 612, 104], url: [120, 740, 52],
    qr: [120, 830, 150], tc: [300, 922, 22],
  };
  put($('s1-hook'), T.hook[0], T.hook[1]); font($('s1-hook'), T.hook[2]);
  put($('s1-diya'), T.diya[0], T.diya[1], (T.diya[2] * 214) / 218, T.diya[2]);
  put($('s1-eyebrow'), T.eyebrow[0], T.eyebrow[1]); font($('s1-eyebrow'), T.eyebrow[2]);
  put($('s1-t1'), T.t1[0], T.t1[1]); font($('s1-t1'), T.t1[2]);
  put($('s1-t2'), T.t2[0], T.t2[1]); font($('s1-t2'), T.t2[2]);
  put($('s1-trule'), T.trule[0], T.trule[1], T.trule[2], 6);
  for (const [id, d] of [['s1-date', T.date], ['s2-odate', T.odate]]) {
    const el = $(id); put(el, d[0], d[1], null, d[2]); font(el, d[3]); el.style.padding = `0 ${Math.round(d[2] * 0.42)}px`;
  }
  put($('s1-rhead'), T.rhead[0], T.rhead[1]); font($('s1-rhead'), T.rhead[2]);
  for (const id of ['s1-cardA', 's1-cardB', 's1-cardC']) {
    const c = $(id); put(c, ...T.card);
    c.querySelector('.cin').style.padding = `${T.cardPad[0]}px ${T.cardPad[1]}px`;
    font(c.querySelector('.ctag'), T.ctag); font(c.querySelector('.ctitle'), T.ctitle);
    c.querySelector('.ctitle').style.margin = `6px 0 ${Math.round(T.ctitle * 0.42)}px`;
    $$('.row', c).forEach((r) => { font(r, T.row); r.style.gap = px(Math.round(T.row * 0.5)); r.style.marginTop = px(Math.round(T.row * 0.36)); });
    $$('.row svg', c).forEach((s) => { s.setAttribute('width', T.icon); s.setAttribute('height', T.icon); });
    Object.assign(c.querySelector('.tile').style, { width: px(T.tile[0]), height: px(T.tile[1]), top: px(T.tile[2]), right: px(T.tile[3]) });
  }
  put($('s2-steps'), T.steps[0], T.steps[1]); font($('s2-steps'), T.steps[2]); $('s2-steps').style.lineHeight = '1.06';
  put($('s2-weye'), T.weye[0], T.weye[1]); font($('s2-weye'), T.weye[2]);
  put($('s2-wt'), T.wt[0], T.wt[1]); font($('s2-wt'), T.wt[2]);
  put($('s2-tv'), T.tv[0], T.tv[1], T.tv[2], T.tv[3]);
  { const c = $('s2-wcap'); put(c, T.wcap[0], T.wcap[1], T.wcap[3]); font(c, T.wcap[2]); c.style.whiteSpace = 'normal'; c.style.lineHeight = '1.35'; }
  for (const k of ['o1', 'o30', 'o2', 'o3', 'o4']) { const el = $(`s2-${k}`); put(el, T[k][0], T[k][1]); font(el, T[k][2]); }
  put($('s2-orule'), T.orule[0], T.orule[1], T.orule[2], 6);
  put($('s3-photo'), ...T.photo);
  put($('s3-logo'), T.logo[0], T.logo[1], T.logo[2], (T.logo[2] * 287) / 448);
  { const b = $('s3-btn'); put(b, T.btn[0], T.btn[1], T.btn[2], T.btn[3]); font(b, T.btn[4]);
    put($('s3-ripple'), T.btn[0], T.btn[1], T.btn[2], T.btn[3]); $$('svg', b).forEach((s) => { s.setAttribute('width', T.btn[4]); s.setAttribute('height', T.btn[4]); }); }
  put($('s3-phone'), T.phone[0], T.phone[1]); font($('s3-phone'), T.phone[2]);
  put($('s3-url'), T.url[0], T.url[1]); font($('s3-url'), T.url[2]);
  put($('s3-tc'), T.tc[0], T.tc[1]); font($('s3-tc'), T.tc[2]);
  if (T.qr) { put($('s3-qr'), T.qr[0], T.qr[1], T.qr[2], T.qr[2]); put($('s3-qrcap'), T.qr[0] + T.qr[2] + 26, T.qr[1] + T.qr[2] * 0.36); font($('s3-qrcap'), 26); }
  else { $('s3-qr').style.display = 'none'; $('s3-qrcap').style.display = 'none'; }
  for (const [g, d] of [[$('s1-glow'), G1d], [$('s2-glow'), G2d], [$('s3-glow'), 1500]]) put(g, -d / 2, -d / 2, d, d);
  for (const r of [$('s1-rays'), $('s2-rays')]) put(r, -100, -100, 200, 200);
  for (const c of $$('canvas.gl')) { c.width = W; c.height = H; }
  const PH = [T.photo[0] + T.photo[2] / 2, T.photo[1] + T.photo[3] / 2];
  const E = { grain: $('grain'), count: $('s2-count'), img3: $('s3-img'), diya: $('s1-diya'), g3: $('s3-glow') };
  // festive props: fairy bulbs chase down their strands on the beat, garlands sway, flowers turn, sparkles twinkle
  const PROPS = [1, 2, 3].map((n) => {
    const svg = $(`s${n}-props`);
    const pivot = (e) => ({ e, x: +e.dataset.cx, y: +e.dataset.cy, p: +(e.dataset.p || 0) });
    return { fb: $$('.fb', svg).map((e) => ({ e, s: +e.dataset.s, k: +e.dataset.k })), gar: $$('.gar', svg).map(pivot), cf: $$('.cf', svg).map(pivot),
             spk: $$('.spk', svg).map(pivot), dyg: $$('.dyg', svg), bok: $$('.bok', svg) };
  });
  const PET = $$('#s2-petals .ptl').map((e, i) => {
    const r = mulberry32(900 + i * 7), a = ((-90 + (r() - 0.5) * 150) * Math.PI) / 180, v = (650 + r() * 950) * (W / 1080);
    return { e, vx: Math.cos(a) * v, vy: Math.sin(a) * v, d: r() * 0.12, r0: r() * 360, w: (r() - 0.5) * 900, ph: r() * 6.28, s: 0.8 + r() * 0.7 };
  });
  function animProps(P, t) {
    const beat = Math.exp(-(t % 0.5) / 0.12);
    for (const b of P.fb) {
      const head = (t * 5 + b.s * 1.7) % 12, dk = (((b.k - head) % 12) + 12) % 12;
      b.e.style.opacity = Math.min(1, 0.46 + 0.54 * Math.exp(-dk / 1.6) + 0.2 * beat).toFixed(3);
    }
    // SVG transforms with explicit pivots (CSS transform-origin is not reliable on SVG children)
    P.gar.forEach((g, i) => g.e.setAttribute('transform', `rotate(${(0.6 * Math.sin(t * 1.3 + i * 1.9)).toFixed(3)} ${g.x} ${g.y})`));
    P.cf.forEach((g, i) => g.e.setAttribute('transform', `rotate(${((i ? -1 : 1) * (t * 2.2) + 8 * Math.sin(t * 0.4 + i)).toFixed(2)} ${g.x} ${g.y})`));
    for (const s of P.spk) {
      const k = 0.5 + 0.5 * Math.sin(t * 3.1 + s.p * 3), sc = 0.5 + 0.55 * k;
      s.e.setAttribute('transform', `translate(${s.x} ${s.y}) rotate(${(t * 40 + s.p * 57).toFixed(1)}) scale(${sc.toFixed(3)}) translate(${-s.x} ${-s.y})`);
      s.e.style.opacity = (0.35 + 0.65 * k).toFixed(3);
    }
    P.dyg.forEach((g, i) => { g.style.opacity = (0.75 + 0.25 * FL(t * 8 + i * 5)).toFixed(3); });
    P.bok.forEach((g, i) => g.setAttribute('transform', `translate(0 ${(6 * Math.sin(t * 0.7 + i)).toFixed(2)})`));
  }
  function animPetals(t) {
    const c = (window.__wheel3d && window.__wheel3d.hub2) || { x: W / 2, y: H * 0.6 }, K = 2.1, G = 1150 * (W / 1080);
    for (const p of PET) {
      const tau = t - 22.0 - p.d;
      if (tau <= 0 || tau > 2.9) { p.e.style.opacity = '0'; continue; }
      const e = 1 - Math.exp(-K * tau);
      const x = c.x + (p.vx * e) / K + 22 * Math.sin(5 * tau + p.ph), y = c.y + (p.vy * e) / K + G * (tau / K - e / (K * K));
      const flip = Math.cos(6 * tau + p.ph);
      p.e.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${(p.r0 + p.w * tau).toFixed(1)}deg) scale(${(p.s * flip).toFixed(3)}, ${p.s.toFixed(3)})`;
      p.e.style.opacity = (tau < 2.3 ? 1 : 1 - (tau - 2.3) / 0.6).toFixed(3);
    }
  }

  // ------------------------------------------------------------------ per-frame render (pure function of t)
  function render(t) {
    window.__lastT = t;
    if (window.__wheel3d) window.__wheel3d.render(t);
    if (t < 16.6) animProps(PROPS[0], t);
    if (t > 15.4 && t < 27) { animProps(PROPS[1], t); animPetals(t); }
    if (t > 25.9) animProps(PROPS[2], t);
    const cu = clamp((t - 24.15) / 0.6);
    E.count.textContent = String(Math.round(30 * (1 - (1 - cu) * (1 - cu))));
    E.img3.style.transform = `scale(${(1.02 + 0.1 * smooth((t - 26.1) / 3.9)).toFixed(5)})`;
    E.g3.style.transform = `translate(${(PH[0] + 30 * Math.sin(t * 0.8)).toFixed(1)}px, ${PH[1]}px)`;
    const f = Math.floor(t * 60);
    E.grain.style.backgroundPosition = `${(f * 37) % 256}px ${(f * 91) % 256}px`;
    E.diya.style.filter = `brightness(${(1 + 0.08 * FL(t * 9)).toFixed(3)}) drop-shadow(0 0 ${(14 + 8 * FL(t * 7 + 3)).toFixed(1)}px rgba(255,180,70,0.55))`;
  }

  // ------------------------------------------------------------------ timeline
  const tl = gsap.timeline({ paused: true });
  // ---- T1 (15.65 s): an iris bursts out of the wheel hub into the spin; the wheel's own red rim rides the edge,
  //      the outgoing scene pushes past camera with a little blur.
  const IR = TALL ? { x: 540, y: 790, r: 2300 } : { x: 1440, y: 570, r: 2400 };
  put($('t1-ring'), IR.x - IR.r, IR.y - IR.r, 2 * IR.r, 2 * IR.r);
  tl.set('#s2', { opacity: 1, clipPath: `circle(0px at ${IR.x}px ${IR.y}px)` }, 15.62);
  tl.fromTo('#s2', { clipPath: `circle(0px at ${IR.x}px ${IR.y}px)` }, { clipPath: `circle(${IR.r}px at ${IR.x}px ${IR.y}px)`, duration: 0.62, ease: 'power3.in', immediateRender: false }, 15.65);
  tl.set('#s2', { clipPath: 'none' }, 16.3);
  tl.fromTo('#t1-ring', { scale: 0, opacity: 1 }, { scale: 1, opacity: 1, duration: 0.62, ease: 'power3.in' }, 15.65);
  tl.to('#t1-ring', { opacity: 0, duration: 0.12, ease: 'none' }, 16.2);
  tl.fromTo('#s1', { scale: 1, filter: 'blur(0px)' }, { scale: 1.16, filter: 'blur(6px)', duration: 0.62, ease: 'power2.in', transformOrigin: `${IR.x}px ${IR.y}px`, immediateRender: false }, 15.65);
  tl.set('#s1', { opacity: 0 }, 16.28);
  // ---- T2 (26.1 s): a warm festive light sweeps across, over-exposes the offer, and the home plate resolves out of it
  put($('t2-light'), -0.8 * W, -0.6 * H, 2.6 * W, 2.2 * H);
  tl.fromTo('#t2-light', { opacity: 0, x: -0.55 * W, y: -0.3 * H, scale: 0.85 }, { opacity: 1, x: 0, y: 0, scale: 1, duration: 0.38, ease: 'power2.in' }, 26.06);
  tl.to('#t2-light', { opacity: 0, x: 0.5 * W, y: 0.28 * H, scale: 1.1, duration: 0.55, ease: 'power2.out' }, 26.44);
  tl.fromTo('#s2', { filter: 'brightness(1)' }, { filter: 'brightness(1.85)', duration: 0.36, ease: 'power2.in', immediateRender: false }, 26.08);
  tl.set('#s3', { opacity: 1 }, 26.42);
  tl.fromTo('#s3', { filter: 'brightness(1.85)' }, { filter: 'brightness(1)', duration: 0.6, ease: 'power2.out' }, 26.42);
  tl.set('#s2', { opacity: 0 }, 26.46);
  // masked rise / lift. Hidden words are also transparent (snapping within ~4 frames, behind the mask) so nothing
  // off-mask can be read, sampled or peek through the padding.
  const rise = (els, at, o = {}) => {
    tl.fromTo(els, { yPercent: 140 }, { yPercent: 0, duration: o.d || 0.62, ease: o.ease || 'expo.out', stagger: o.stagger ?? 0.09 }, at);
    return tl.fromTo(els, { opacity: 0 }, { opacity: 1, duration: 0.06, ease: 'none', stagger: o.stagger ?? 0.09 }, at);
  };
  const lift = (els, at, o = {}) => {
    const d = o.d || 0.26;
    tl.fromTo(els, { yPercent: 0 }, { yPercent: -140, duration: d, ease: 'power3.in', stagger: o.stagger ?? 0.025, immediateRender: false }, at);
    return tl.fromTo(els, { opacity: 1 }, { opacity: 0, duration: 0.04, ease: 'none', stagger: o.stagger ?? 0.025, immediateRender: false }, at + d - 0.04);
  };

  // HOOK
  const hw = $$('#s1-hook .wi');
  tl.fromTo(hw[0], { yPercent: 55 }, { yPercent: 0, duration: 0.5, ease: 'expo.out' }, 0);
  rise(hw.slice(1, 3), 0.22, { stagger: 0.25 });
  rise(hw.slice(3, 6), 0.96, { stagger: 0.25 });
  tl.fromTo('#s1-dream', { color: '#1b120c', backgroundColor: 'rgba(249,49,47,0)', boxShadow: '0 0.06em 0 rgba(168,18,26,0)' },
    { color: '#ffffff', backgroundColor: 'rgba(249,49,47,1)', boxShadow: '0 0.06em 0 rgba(168,18,26,1)', duration: 0.12, ease: 'power2.out' }, 1.5);
  lift(hw, 3.72);
  // TITLE
  tl.fromTo('#s1-diya', { opacity: 0, scale: 0.55, y: 24 }, { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: 'back.out(1.8)' }, 4.02);
  tl.fromTo('#s1-eyebrow', { opacity: 0, x: -18 }, { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' }, 4.1);
  rise($$('#s1-eyebrow .wi'), 4.1, { d: 0.7 });
  rise($$('#s1-t1 .wi'), 4.44, { stagger: 0.1, d: 0.75 });
  rise($$('#s1-t2 .wi'), 4.94, { stagger: 0.08, d: 0.75 });
  tl.fromTo('#s1-trule', { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'power3.out' }, 5.45);
  tl.fromTo('#s1-date', { opacity: 0, scaleX: 0.82 }, { opacity: 1, scaleX: 1, duration: 0.45, ease: 'power3.out' }, 5.95);
  rise($$('#s1-date .wi'), 6.02, { d: 0.55 });
  tl.fromTo('#s1-title', { scale: 1 }, { scale: 1.025, duration: 3.2, ease: 'sine.inOut', transformOrigin: '0% 50%' }, 4.6);
  lift($$('#s1-t1 .wi, #s1-t2 .wi, #s1-eyebrow .wi, #s1-date .wi'), 7.7, { stagger: 0.015 });
  tl.fromTo(['#s1-diya', '#s1-trule', '#s1-date'], { opacity: 1, y: 0 }, { opacity: 0, y: -30, duration: 0.25, ease: 'power2.in', immediateRender: false }, 7.72);
  // RINGS
  rise($$('#s1-rhead .wi'), 8.08, { stagger: 0.1 });
  ['#s1-cardA', '#s1-cardB', '#s1-cardC'].forEach((id, i) => {
    const t0 = 9.98 + i * 2;
    tl.fromTo(id, { opacity: 0, y: 90, rotation: -2.5 }, { opacity: 1, y: 0, rotation: 0, duration: 0.6, ease: 'expo.out' }, t0);
    tl.fromTo(`${id} .ctag, ${id} .ctitle`, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.45, ease: 'power3.out', stagger: 0.06 }, t0 + 0.08);
    tl.fromTo(`${id} .row`, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.42, ease: 'power3.out', stagger: 0.12 }, t0 + 0.2);
    tl.fromTo(`${id} .tile`, { opacity: 0, scale: 0.55, rotation: -16 }, { opacity: 1, scale: 1, rotation: -5, duration: 0.6, ease: 'back.out(1.7)' }, t0 + 0.42);
    if (i < 2) tl.fromTo(id, { opacity: 1, y: 0 }, { opacity: 0, y: 70, duration: 0.22, ease: 'power2.in', immediateRender: false }, t0 + 1.8);
  });
  // SPIN: the three steps start dim and light up as the story happens
  const st = $$('#s2-steps .wi');
  rise(st, 15.95, { stagger: 0.25, d: 0.55 });
  tl.fromTo('#s2-book', { color: 'rgba(27,18,12,0.6)' }, { color: 'rgba(27,18,12,1)', duration: 0.3, immediateRender: false }, 16.5);
  tl.fromTo('#s2-spin', { color: 'rgba(27,18,12,0.6)' }, { color: 'rgba(27,18,12,1)', duration: 0.25, immediateRender: false }, 17.0);
  tl.fromTo('#s2-unlock', { color: 'rgba(27,18,12,0.6)', backgroundColor: 'rgba(249,49,47,0)', boxShadow: '0 0.06em 0 rgba(168,18,26,0)', scale: 1 },
    { color: 'rgba(255,255,255,1)', backgroundColor: 'rgba(249,49,47,1)', boxShadow: '0 0.06em 0 rgba(168,18,26,1)', scale: 1.1, duration: 0.14, ease: 'power2.out', immediateRender: false }, 22.0);
  tl.fromTo('#s2-unlock', { scale: 1.1 }, { scale: 1, duration: 0.4, ease: 'power3.out', immediateRender: false }, 22.14);
  lift(st, 22.42, { stagger: 0.04 });
  // WIN card
  rise($$('#s2-weye .wi'), 22.62, { d: 0.5 });
  rise($$('#s2-wt .wi'), 22.66, { stagger: 0.09, d: 0.65 });
  tl.fromTo('#s2-tv', { opacity: 0, scale: 0.7, y: 40, rotation: 4 }, { opacity: 1, scale: 1, y: 0, rotation: -2, duration: 0.7, ease: 'back.out(1.5)' }, 22.86);
  tl.fromTo('#s2-wcap', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 23.08);
  tl.fromTo('#s2-win', { opacity: 1, y: 0 }, { opacity: 0, y: -50, duration: 0.24, ease: 'power2.in', immediateRender: false }, 23.82);
  // OFFER
  rise($$('#s2-o1 .wi'), 24.06, { d: 0.5 });
  tl.fromTo('#s2-o30 .wi', { yPercent: 165, scale: 0.86 }, { yPercent: 0, scale: 1, duration: 0.6, ease: 'expo.out', transformOrigin: '0% 100%' }, 24.12);
  tl.fromTo('#s2-o30', { opacity: 0 }, { opacity: 1, duration: 0.06, ease: 'none' }, 24.12);
  rise($$('#s2-o2 .wi'), 24.7, { stagger: 0.1 });
  tl.fromTo('#s2-orule', { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: 'power3.out' }, 24.98);
  rise($$('#s2-o3 .wi'), 25.08, { d: 0.6 });
  tl.fromTo('#s2-o4', { opacity: 0 }, { opacity: 1, duration: 0.35 }, 25.25);
  tl.fromTo('#s2-odate', { opacity: 0, scaleX: 0.82 }, { opacity: 1, scaleX: 1, duration: 0.45, ease: 'power3.out' }, 25.46);
  rise($$('#s2-odate .wi'), 25.52, { d: 0.5 });
  // CTA
  tl.fromTo('#s3-photo', { scale: 1.08, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.1, ease: 'expo.out' }, 26.15);
  tl.fromTo('#s3-logo', { opacity: 0, y: 26, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'expo.out' }, 26.55);
  tl.fromTo('#s3-btn', { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.9)' }, 26.88);
  rise($$('#s3-phone .wi'), 27.1, { stagger: 0.08 });
  rise($$('#s3-url .wi'), 27.42, { d: 0.55 });
  if (T.qr) { tl.fromTo('#s3-qr', { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.6)' }, 27.62); tl.fromTo('#s3-qrcap', { opacity: 0 }, { opacity: 1, duration: 0.4 }, 27.8); }
  tl.fromTo('#s3-tc', { opacity: 0 }, { opacity: 1, duration: 0.5 }, 27.9);
  tl.fromTo('#s3-btn', { scale: 1 }, { scale: 0.94, duration: 0.09, ease: 'power2.in', immediateRender: false }, 28.52);
  tl.fromTo('#s3-btn', { scale: 0.94 }, { scale: 1, duration: 0.5, ease: 'back.out(2.2)', immediateRender: false }, 28.61);
  tl.fromTo('#s3-ripple', { opacity: 0, scale: 1 }, { opacity: 0.9, scale: 1.02, duration: 0.04, ease: 'none' }, 28.6);
  tl.to('#s3-ripple', { opacity: 0, scale: 1.35, duration: 0.8, ease: 'power2.out' }, 28.64);

  // clock: drives render(t) on every seek
  const CLK = { t: 0 };
  tl.fromTo(CLK, { t: 0 }, { t: 30, duration: 30, ease: 'none', onUpdate: () => render(CLK.t) }, 0);
  window.addEventListener('hf-seek', (e) => render(e.detail.time));
  render(0);
  window.__timelines['main'] = tl;
})();
