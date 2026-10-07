// WSS "Get found" film. render(t) owns everything: which scene is on, every word, the network camera, the fan, the editor,
// the web. Pure function of film time (seeded noise only, no layout reads after setup). Cut frames follow BREAKDOWN.md;
// word cues come from timeline.json → cues (the VO, placed by tools/vo.py).
(() => {
  const W = 1920, H = 1080;
  const TL = window.TL || {}, C = TL.cues || {}, D = TL.duration || 35;
  const F = (f) => f / 30;
  const $ = (id) => document.getElementById(id);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const oC = (x) => 1 - Math.pow(1 - clamp(x), 3);
  const oE = (x) => { x = clamp(x); return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x); };
  const iC = (x) => Math.pow(clamp(x), 3);
  const ioC = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const f1 = (v) => v.toFixed(1), f2 = (v) => v.toFixed(2), f3 = (v) => v.toFixed(3);
  const PRE = { snappy: [0.22, 0.8], default: [0.4, 0.86], heavy: [0.5, 1.0], soft: [0.75, 1.0] };
  function step(tau, p = 'default') {          // closed-form spring, 0 → 1
    if (!(tau > 0)) return 0;
    const [resp, z] = PRE[p], w = (2 * Math.PI) / resp;
    if (z < 1) { const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + ((z * w) / wd) * Math.sin(wd * tau)); }
    return 1 - Math.exp(-w * tau) * (1 + w * tau);
  }
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const show = (el, on) => { const v = on ? 'block' : 'none'; if (el.style.display !== v) el.style.display = v; };
  const rgb = (a, b, k) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * clamp(k))).join(',')})`;
  const GREEN = [146, 193, 49], INK = [20, 22, 24], INK2 = [21, 24, 27];

  // masked word: rise at tin (expo out), lift at tout. Hidden = 150 % below and transparent.
  function word(el, t, tin, tout = Infinity, din = 0.5, dout = 0.26) {
    let y, op;
    if (t < tin) { y = 150; op = 0; }
    else if (t < tout) { const u = (t - tin) / din; y = 150 * (1 - oE(u)); op = clamp(u * 8); }
    else { const v = (t - tout) / dout; y = -150 * iC(v); op = 1 - clamp((v - 0.6) / 0.4); }
    el.style.opacity = f3(op); el.style.transform = `translateY(${f2(y)}%)`;
  }
  const words = (els, t, tins, tout = Infinity, stagger = 0.03) => els.forEach((el, k) => word(el, t, tins[Math.min(k, tins.length - 1)] + (k >= tins.length ? (k - tins.length + 1) * 0.06 : 0), tout + k * stagger));
  const wipe = (el, t, t0, d = 0.14) => { el.style.clipPath = `inset(0 ${f2(100 * (1 - oC((t - t0) / d)))}% 0 0)`; };
  // a caption pill shows only in its own window and grows with its words: clipped to the right edge of the newest risen word
  function pill(el, t, tin, tout, x, y, tins = null) {
    const a = t - tin + 0.02, fade = Number.isFinite(tout) ? 1 - seg(t, tout + 0.12, tout + 0.3) : 1;
    el.style.opacity = f3(a < 0 ? 0 : clamp(a * 12) * fade);
    el.style.transform = `translate(${f1(x)}px, ${f1(y)}px)`;
    const P = M.pills && M.pills.get(el);
    if (!P || !tins) { el.style.clipPath = 'none'; return; }
    let w = P.edges[0] * oC((t - tins[0] + 0.02) / 0.2);
    for (let k = 1; k < P.edges.length; k++) w += (P.edges[k] - P.edges[k - 1]) * step(t - (tins[Math.min(k, tins.length - 1)] - 0.09), 'snappy');
    el.style.clipPath = `inset(0 ${f1(Math.max(0, P.w - w))}px 0 0 round ${P.r}px)`;
  }

  // ---------------------------------------------------------------- elements
  const S = {}; for (const id of ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9']) S[id] = $(id);
  const FR = { f2: $('f2'), f3: $('f3') };
  const GL1 = $('gl1'), GL2 = $('gl2'), FLASH = $('flash'), GRAIN = $('grain');
  const SC = { s1: [0, F(233)], s2: [F(233), F(268)], s3: [F(268), F(339)], s4: [F(339), F(400)], s5: [F(400), F(438)],
               s6: [F(438), F(468)], s7: [F(468), F(632)], s8: [F(632), 28.0], s9: [28.0, D + 1] };

  // ---- 1–3
  const PH = $('s1-phrase'), TOO = $('p-too'), PW = [$('p-w0'), $('p-w1'), $('p-w2')], PBOX = $('p-box'), PW2T = $('p-w2t');
  const CARET = $('s1-caret'), BOXR = $('s1-boxr'), HAIR = $('s1-hair'), GLOW1 = $('s1-glow'), WORLD = $('world'), NGLOW = $('net-glow');
  const WAVE = $('net-wave'), NDB = $('nd-b'), NDJ = $('nd-j');
  const TH = [0, 1, 2, 3, 4, 5].map((i) => $('th' + i)), THD = [$('th-d0'), $('th-d1')];
  const ND = [0, 1, 2, 3, 4, 5].map((i) => $('nd' + i)), NODE = [0, 1, 2, 3, 4, 5].map((i) => $('node' + i));
  const NODE_PARTS = NODE.map((n) => ({ ic: n.querySelector('.ic'), lb: n.querySelector('.lb'), sb: n.querySelector('.sb') }));
  const NODE_XY = [[2480, 300], [2860, 430], [2520, 790], [2900, 900], [3260, 260], [3320, 680]];
  const NODE_T = [F(126), F(130), F(151), F(154), F(167), F(169)];
  const HEAD1 = $('s1-head'), HEADW = $$('#s1-head .wi'), QW1 = $$('#s1-q .wi'), DOTS = $$('#s1-dots rect');
  const SHARDS = $$('.sh').map((el) => ({ el, set: el.dataset.set, a: +el.dataset.a, r0: +el.dataset.r0, r1: +el.dataset.r1,
                                          z: +el.dataset.z, spin: +el.dataset.spin, dl: +el.dataset.dl }));
  const SET_T = { A: [F(22), F(39)], B: [F(39), F(59)], C: [F(59), F(90)] };
  // ---- 4–5
  const DISC = $('s2-disc'), RAYS = $('s2-rays'), QF = $$('#f2-q .wi'), MEET = $$('#f3-meet .wi'), GUIDES = $$('#f3-guides .gd');
  const LB = $('lb-logo'), LE = $('le-logo');
  const GLY = (p) => ({ icon: $(`${p}-icon`), dot: $(`${p}-dot`), word: ['W', 'E', 'B', 'S', 'P', 'I', 'D', 'E2', 'R'].map((n) => $(`${p}-${n}`)),
                        sol: [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => $(`${p}-s${i}`)) });
  const LBG = GLY('lb'), LEG = GLY('le');
  // the ring's screen scale (px per world unit), shared with hero3d.js so the HTML disc rides inside the 3D ring
  const ringSpx = (t) => 262 * Math.pow(12, Math.pow(seg(t, F(259), F(285)), 2.2));
  window.__ringSpx = ringSpx;
  // ---- 6
  const P4 = $('s4-plate'), P4B = $('s4-blur'), UI4 = $('s4-ui'), HEAD4 = $$('#s4-head .wi'), BRIEF = $('brief'), TYPED = $('brief-typed'),
        CUR = $('brief-cur'), SEND = $('send'), SENDAR = $('send-ar');
  const GOAL = 'More patients for my clinic in Noida';
  const PH4 = document.createElement('span'); PH4.className = 'ph'; PH4.textContent = 'Describe your goal…'; TYPED.parentNode.insertBefore(PH4, TYPED);
  // ---- 7–8
  const P5 = $('s5-plate'), RINGS = $$('#s5-rings circle'), CARDS = $$('.card'), HUB = $('hub'), HUBBTN = $('hub-btn'), HUBAR = $('hub-ar'),
        CAP5 = $('s5-cap'), CAP5W = $$('#s5-cap .wi');
  // ---- 9
  const SEC = $('sec'), SELBOX = $('selbox');
  const SECTXT = 'in seconds.';
  SEC.innerHTML = SECTXT.split('').map((c) => `<span class="ch">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
  const SECCH = $$('#sec .ch');
  // ---- 10–13
  const P7 = $('s7-plate'), P7R = $('s7-red'), ED = $('ed'), EDWRAP = $('edwrap'), LINES = $('lines'), DIM7 = $('s7-dim');
  const LN = $$('.ln').map((el) => ({ el, tx: el.querySelector('.tx'), no: el.querySelector('.no'), hl: el.querySelector('.hl'),
                                      ck: el.querySelector('.ck'), x: el.querySelector('.x'), fx: el.querySelector('.fx') }));
  const ERRV = $('errv'), ERR = 5;
  const CAP7 = [$('s7-cap0'), $('s7-cap1'), $('s7-cap2')], CAP7W = CAP7.map((c) => $$('.wi', c));
  // ---- 14
  const WEBCAM = $('webcam'), WEB = $('web'), CHIPS = $$('#chips .chip'), MOTES = $('motes');
  const C8 = [$('c8-0'), $('c8-1'), $('c8-2')], C8W = C8.map((c) => $$(':scope > .w > .wi', c)), C8B = C8.map((c) => c.querySelector('.box'));
  const HUBXY = [1100, 480];
  const CH = CHIPS.map((el, i) => ({ el, i, x: +el.dataset.x, y: +el.dataset.y, ang: +el.dataset.ang, ring: +el.dataset.ring,
    fx: +el.dataset.fx, fy: +el.dataset.fy, fz: +el.dataset.fz, dg: el.querySelector('.dg'), vl: el.querySelector('.vl'), mk: el.querySelector('.mk') }));
  // the chips the VO names fly past the lens on their word: Google/Meta Ads on "ads", SEO on "SEO", Instagram on "social"
  const FOCUS = { 0: [700, 430, 1.0 + 0.5 * 0.52], 1: [1240, 640, 1.0 + 0.5 * 0.62], 2: [880, 560, 1.0 + 0.5 * 1.27], 3: [1100, 430, 1.0 + 0.5 * 2.45] };
  for (const k in FOCUS) Object.assign(CH[k], { fx: FOCUS[k][0], fy: FOCUS[k][1], fz: FOCUS[k][2] });
  const HILITE = [[0, 0.3, 1.1], [1, 0.4, 1.2], [2, 1.05, 1.95], [3, 2.25, 2.7]];
  const KEY = [5, 6, 7, 4];
  // ---- 15
  const P9 = $('s9-plate'), SCRIM = $('s9-scrim'), TAG = $('tag'), TAGW = $$('#tag .wi'), TAG2 = $('tag2'), TW = [$('tw0'), $('tw1'), $('tw2')],
        TBOX = $('tag2-box'), URLW = $$('#url .wi');

  // ---------------------------------------------------------------- the network camera (world px), springs superposed
  const CAMK = [[F(71), [1980, 540, 1], 'heavy'], [F(88), [2060, 540, 1], 'soft'], [F(104), [2320, 540, 1], 'default'],
                [F(119), [2690, 390, 1.38], 'heavy'], [F(150), [2730, 840, 1.38], 'default'], [F(167), [3250, 470, 1.32], 'snappy'],
                [F(176), [2400, 575, 0.68], 'snappy']];
  function cam(t) {
    let cx = 960, cy = 540, ls = 0, prev = [960, 540, 1];
    for (const [t0, k, p] of CAMK) { const e = step(t - t0, p); cx += (k[0] - prev[0]) * e; cy += (k[1] - prev[1]) * e; ls += (Math.log(k[2]) - Math.log(prev[2])) * e; prev = k; }
    const h = Math.max(0, t - F(181)); cx += 14 * h; ls += 0.03 * h;
    return { cx, cy, s: Math.exp(ls) };
  }
  const toScreen = (c, x, y) => [960 + (x - c.cx) * c.s, 540 + (y - c.cy) * c.s];

  // ---------------------------------------------------------------- setup measurements (after fonts load)
  const M = { ready: false };
  window.__hf = window.__hf || {}; window.__hf.buildReady = window.__hf.buildReady || {};
  window.__hf.buildReady['layout'] = new Promise((res) => { M.done = res; });
  window.__hf.buildReady['hero3d'] = new Promise((res) => { window.__hero3dReady = res; });
  async function measure() {
    try { await document.fonts.ready; } catch (e) { /* fall through with fallback metrics */ }
    for (const k in S) S[k].style.display = 'block';
    for (const k in FR) FR[k].style.display = 'block';
    // phrase: keep each variant centred
    const slot = $('p-slot'), tooW = TOO.parentNode;
    M.prefix = slot.offsetLeft - tooW.offsetLeft; M.pw = PW.map((el) => el.offsetWidth);
    M.phraseTop = 540 - PH.offsetHeight / 2;
    // fan caption, seconds word, tagline line
    M.cap5 = CAP5.offsetWidth;
    M.secTop = 540 - SEC.offsetHeight / 2;
    const a = SECCH[0], b = SECCH[SECCH.length - 1];
    M.secBox = [a.offsetLeft - 26, M.secTop + SEC.offsetHeight * 0.16, b.offsetLeft + b.offsetWidth - a.offsetLeft + 52, SEC.offsetHeight * 0.74];
    M.tw = TW.map((el) => [el.parentNode.offsetLeft, el.offsetWidth]); M.tagH = TAG2.offsetHeight;
    M.cap7 = CAP7.map((c) => c.offsetWidth);
    M.pills = new Map();
    for (const [el, r] of [[HEAD1, 22], [CAP5, 40], ...CAP7.map((c) => [c, 40])]) {
      const ws = $$(':scope > .w', el), pr = parseFloat(getComputedStyle(el).paddingRight) || 30;
      M.pills.set(el, { w: el.offsetWidth, r, edges: ws.map((w) => w.offsetLeft + w.offsetWidth + pr) });
    }
    // svg lengths and glyph centres
    M.th = TH.map((p) => p.getTotalLength()); M.thd = THD.map((p) => p.getTotalLength());
    M.gd = GUIDES.map((g) => g.getTotalLength());
    const cx = (g) => { const bb = g.getBBox(); return bb.x + bb.width / 2; };
    M.glb = { word: LBG.word.map(cx), sol: LBG.sol.map(cx), icon: cx(LBG.icon), dot: cx(LBG.dot) };
    M.ckFix = LN[ERR].ck ? parseFloat(LN[ERR].ck.style.left) - 4 * 12.6 : 0;
    buildWeb();
    M.ready = true;
    render(window.__lastT || 0);
    M.done();
  }

  // ---------------------------------------------------------------- 14: the web (built once)
  const NS = 'http://www.w3.org/2000/svg';
  const WEBP = { radial: [], ring: [], order: [] };
  function buildWeb() {
    const order = CH.slice().sort((p, q) => p.ring - q.ring || p.ang - q.ang);
    order.forEach((c, k) => { WEBP.order[c.i] = k; });
    let g = '';
    for (const c of CH) {
      const mx = (HUBXY[0] + c.x) / 2 + Math.sin(c.ang) * 26, my = (HUBXY[1] + c.y) / 2 - Math.cos(c.ang) * 26;
      g += `<path class="rd" data-i="${c.i}" d="M${HUBXY[0]} ${HUBXY[1]} Q${f1(mx)} ${f1(my)} ${f1(c.x)} ${f1(c.y)}" stroke-width="2.2"/>`;
    }
    const rings = [190, 340, 490];
    rings.forEach((R, ri) => {
      const rc = CH.filter((c) => c.ring === R).sort((p, q) => p.ang - q.ang);
      rc.forEach((c, k) => {
        const n = rc[(k + 1) % rc.length], mx = (c.x + n.x) / 2, my = (c.y + n.y) / 2, pull = 0.12;
        const qx = mx + (HUBXY[0] - mx) * pull, qy = my + (HUBXY[1] - my) * pull;
        g += `<path class="sp" data-r="${ri}" data-k="${k}" d="M${f1(c.x)} ${f1(c.y)} Q${f1(qx)} ${f1(qy)} ${f1(n.x)} ${f1(n.y)}" stroke-width="1.6"/>`;
      });
    });
    // hub: the real WSS icon (W + green dot) on an ink disc
    g += `<g id="webhub"><circle class="hub" cx="${HUBXY[0]}" cy="${HUBXY[1]}" r="40"/>` +
         `<g transform="translate(${HUBXY[0] - 44} ${HUBXY[1] - 44}) scale(0.44)"><path class="wsw" d="m 113.36139,72.877385 27.72319,62.652225 H 122.06811 L 101.55109,89.191033 81.034068,135.52961 H 71.02632 L 40.00001,65.471177 h 10.909018 c 4.60413,0 9.508235,3.202668 11.409891,7.406208 L 83.736543,121.41792 99.749884,85.187531 91.042482,65.471177 H 101.9515 c 4.60413,0 9.50824,3.202668 11.40989,7.406208 z"/>` +
         `<circle class="wsd" cx="150.99" cy="73.48" r="9"/></g></g>`;
    WEB.innerHTML = g;
    WEBP.radial = $$('#web path.rd').map((p) => ({ p, i: +p.dataset.i, L: p.getTotalLength() }));
    WEBP.ring = $$('#web path.sp').map((p) => ({ p, r: +p.dataset.r, k: +p.dataset.k, L: p.getTotalLength() }));
    WEBP.hub = $('webhub');
    let m = '';
    for (let i = 0; i < 26; i++) m += '<div class="mote"></div>';
    MOTES.innerHTML = m;
    WEBP.motes = $$('#motes .mote').map((el, i) => ({ el, x: 700 + hash(i + 1) * 1000, y: 260 + hash(i + 40) * 560, v: 30 + hash(i + 80) * 60,
                                                         ph: hash(i + 120) * 6.28, s: 0.5 + hash(i + 160) * 0.8, t0: 3.9 + hash(i + 200) * 1.6 }));
  }

  // ---------------------------------------------------------------- shots
  function shot1to3(t) {
    const c = cam(t), shiftX = (960 - c.cx) * c.s, shiftY = (540 - c.cy) * c.s;
    const v = cam(t - 1 / 60), speed = Math.hypot((c.cx - v.cx) * c.s, (c.cy - v.cy) * c.s);
    const k = t < F(39) ? 0 : t < F(59) ? 1 : 2;
    // phrase: "Too many" + agencies, / tabs, / tools. (sticker)
    const dx = M.ready ? (M.pw[0] - M.pw[k]) / 2 : 0;
    PH.style.top = f1(M.phraseTop || 498) + 'px';
    PH.style.transformOrigin = '960px 540px';
    PH.style.transform = `translate(${f1(dx + shiftX)}px, ${f1(shiftY)}px) scale(${f3(c.s)})`;
    PH.style.filter = speed > 0.4 ? `blur(${f2(Math.min(10, speed * 0.22))}px)` : 'none';
    PH.style.opacity = f3(1 - seg(t, F(80), F(90)));
    word(TOO, t, -0.18, Infinity, 0.45);
    PW.forEach((el, i) => {
      if (i !== k) { el.style.opacity = '0'; el.style.transform = 'translateY(150%)'; return; }
      const tin = [0.16, F(39) - 0.12, F(59) - 0.12][i];
      word(el, t, tin, Infinity, 0.4);
    });
    wipe(PBOX, t, F(62), 0.1); wipe(PW2T, t, F(62), 0.1);
    // search field outline + caret
    const lineW = (M.prefix || 330) + (M.ready ? M.pw[k] : 300), x0 = 960 - lineW / 2 - 50 + shiftX;
    const bw = lineW + 112, per = 2 * (bw + 126);
    BOXR.setAttribute('x', f1(x0)); BOXR.setAttribute('y', f1(540 - 63 + shiftY)); BOXR.setAttribute('width', f1(bw)); BOXR.setAttribute('height', '126');
    BOXR.setAttribute('rx', '63');
    BOXR.style.strokeDasharray = `${f1(per)} ${f1(per)}`; BOXR.style.strokeDashoffset = f1(per * (1 - oC(seg(t, 0.12, 0.62))));
    BOXR.style.opacity = f3(1 - seg(t, F(62), F(70)));
    const cOn = t < F(62) && Math.floor(t * 30 / 8) % 2 === 0 && t > 0.3;
    CARET.style.opacity = cOn ? '1' : '0';
    CARET.style.transform = `translate(${f1(960 + lineW / 2 + 16 + shiftX)}px, ${f1(540 - 39)}px)`;
    HAIR.style.opacity = f3(1 - seg(t, F(70), F(84)));
    HAIR.style.transform = `translateX(${f1(shiftX * 0.5)}px)`;
    // glow behind the word: pop on f20, bloom on the sticker
    const pop = Math.exp(-Math.pow((t - F(20)) / 0.1, 2)), bloom = Math.exp(-Math.pow((t - F(67)) / 0.12, 2));
    GLOW1.style.opacity = f3((0.55 + 0.35 * pop + 0.45 * bloom + 0.06 * Math.sin(t * 3.1)) * (1 - seg(t, F(76), F(90))));
    GLOW1.style.transform = `translate(${f1(960 + shiftX)}px, ${f1(540 + shiftY)}px) scale(${f3(0.62 + 0.3 * pop + 0.4 * bloom)})`;
    // shards: three sets, one per word
    for (const s of SHARDS) {
      const [ta, tb] = SET_T[s.set];
      if (t < ta || t >= tb) { if (s.el.style.opacity !== '0') s.el.style.opacity = '0'; continue; }
      const u = (t - ta - s.dl) / 0.7, r = s.r0 + (s.r1 - s.r0) * oC(u) + 40 * (t - ta);
      let x = 960 + Math.cos(s.a) * r * 1.55, y = 540 + Math.sin(s.a) * r * 0.82;
      if (Math.abs(y - 540) < 120 && Math.abs(x - 960) < 560) y = 540 + (Math.sin(s.a) >= 0 ? 1 : -1) * (120 + 40 * hash(s.a * 100));
      const par = 1 / s.z; x += shiftX * par; y += shiftY * par;
      const sc = 1.05 / s.z, blur = Math.min(7, Math.abs(s.z - 1) * 4.5 + (s.set === 'C' ? speed * 0.18 : 0));
      const op = clamp(u * 5) * (0.42 + 0.58 * clamp(1.5 - Math.abs(s.z - 1))) * (s.set === 'C' ? 1 - seg(t, F(76), F(88)) : 1);
      s.el.style.opacity = f3(op);
      s.el.style.transform = `translate(${f1(x)}px, ${f1(y)}px) translate(-50%, -50%) rotate(${f2(s.spin * (1 + 0.4 * (t - ta)))}deg) scale(${f3(sc)})`;
      s.el.style.filter = blur > 0.3 ? `blur(${f2(blur)}px)` : 'none';
    }
    // the network world
    WORLD.style.opacity = t < F(74) ? '0' : '1';
    WORLD.style.transform = `translate(${f1(960 - c.cx * c.s)}px, ${f1(540 - c.cy * c.s)}px) scale(${f3(c.s)})`;
    const x0w = 1500 + 600 * iC(seg(t, F(206), F(218))), x1w = 1500 + 600 * oC(seg(t, F(82), F(103)));
    if (t >= F(82) && x1w - x0w > 2) {
      let d = '';
      for (let x = x0w; x <= x1w + 0.01; x += 5) {
        const u = (x - 1500) / 600, A = 34 * Math.pow(Math.sin(Math.PI * clamp(u)), 1.3);
        d += (d ? 'L' : 'M') + f1(x) + ' ' + f1(540 + A * Math.sin(2 * Math.PI * (x - 1500) / 118 - t * 7.5));
      }
      WAVE.setAttribute('d', d); WAVE.style.opacity = '1';
    } else WAVE.style.opacity = '0';
    NDB.setAttribute('r', f2(11 * clamp(step(t - F(77), 'snappy'), 0, 1.2) * (t < F(212) ? 1 : 0)));
    NDJ.setAttribute('r', f2(8 * clamp(step(t - F(102), 'snappy'), 0, 1.2) * (t < F(212) ? 1 : 0)));
    NGLOW.style.opacity = f3(seg(t, F(76), F(86)) * (1 - seg(t, F(206), F(214))) * (0.75 + 0.15 * Math.sin(t * 2.4)));
    NGLOW.style.transform = `translate(1500px, 540px) scale(${f3(0.42 + 0.05 * Math.sin(t * 1.7))})`;
    const thread = (p, L, i, t0, deco) => {
      const ti = t0 + i * 0.035, grow = oC(seg(t, ti, ti + 0.55)), q = ioC(seg(t, F(206) + i * 0.02, F(219) + i * 0.02));
      p.style.strokeDasharray = `${f1(L)} ${f1(L)}`;
      p.style.strokeDashoffset = f1(q > 0 ? -L * q : L * (1 - grow));
      p.style.opacity = t < ti ? '0' : deco ? '0.6' : '1';
      return grow;
    };
    TH.forEach((p, i) => {
      const g = thread(p, M.th ? M.th[i] : 600, i, F(104), false);
      ND[i].setAttribute('r', f2(t < F(212) ? 7 * clamp(step(t - (F(104) + i * 0.035 + 0.5), 'snappy'), 0, 1.25) * (g > 0.9 ? 1 : 0) : 0));
    });
    THD.forEach((p, i) => thread(p, M.thd ? M.thd[i] : 1400, i + 6, F(106), true));
    NODE.forEach((n, i) => {
      const t0 = NODE_T[i], P = NODE_PARTS[i], out = 1 - seg(t, F(204) + i * 0.01, F(211) + i * 0.01);
      const e = step(t - t0, 'snappy');
      P.ic.style.opacity = f3(clamp((t - t0) * 12) * out);
      P.ic.style.transform = `scale(${f3(0.6 + 0.4 * e)})`;
      P.lb.style.opacity = f3(t >= t0 + 0.06 ? out : 0); P.lb.style.clipPath = `inset(0 ${f2(100 * (1 - seg(t, t0 + 0.06, t0 + 0.36)))}% 0 0)`;
      P.sb.style.opacity = f3(t >= t0 + 0.2 ? out : 0); P.sb.style.clipPath = `inset(0 ${f2(100 * (1 - seg(t, t0 + 0.2, t0 + 0.6)))}% 0 0)`;
    });
    // headline + question
    pill(HEAD1, t, 3.06, F(203), 120, 92, [3.06, 3.6, 3.95, 4.55]);
    words(HEADW, t, [3.06, 3.6, 3.95, 4.55], F(203));
    words(QW1, t, [7.13, 7.47, 7.54, 7.62]);
    // dots: the six nodes, the junction and the business fly to a ring around the question, then stretch into dashes
    const on = t >= F(212);
    DOTS.forEach((r, i) => {
      if (!on) { r.style.opacity = '0'; return; }
      const src = DOT_SRC[i], a0 = DOT_ANG[i] + (10 * seg(t, F(222), F(233)) * Math.PI) / 180;
      const e = step(t - (F(212) + i * 0.02), 'default');
      const tx = 960 + Math.cos(a0) * 262, ty = 540 + Math.sin(a0) * 262;
      const px = lerp(src[0], tx, e), py = lerp(src[1], ty, e);
      const wdt = 16 + 58 * oC(seg(t, F(227), F(232)));
      r.setAttribute('x', f1(-wdt / 2)); r.setAttribute('y', '-8'); r.setAttribute('width', f1(wdt)); r.setAttribute('height', '16'); r.setAttribute('rx', '8');
      r.setAttribute('transform', `translate(${f1(px)} ${f1(py)}) rotate(${f1((a0 * 180) / Math.PI + 90)})`);
      r.style.opacity = '1';
    });
  }
  // dot sources (screen) at f212 and their ring angles, assigned in angular order so nothing crosses
  const DOT_SRC = [], DOT_ANG = [];
  (() => {
    const c = cam(F(212)), pts = NODE_XY.concat([[2100, 540], [1500, 540]]).map(([x, y]) => toScreen(c, x, y));
    const order = pts.map((p, i) => [Math.atan2(p[1] - 540, p[0] - 960), i]).sort((a, b) => a[0] - b[0]);
    order.forEach(([, i], k) => { DOT_SRC[k] = pts[i]; DOT_ANG[k] = -Math.PI + (k + 0.5) * (Math.PI / 4); });
  })();

  function shot4(t) {
    const spx = ringSpx(t), r = 0.9 * spx;
    DISC.style.transform = `translate(960px, 540px) translate(-50%, -50%) scale(${f3((2 * r) / 200)})`;
    DISC.style.opacity = f3(1 - seg(t, F(259), F(266)));
    RAYS.style.transform = `scale(${f3(1.02 + 0.03 * seg(t, F(233), F(268)) + 0.3 * iC(seg(t, F(259), F(268))))})`;
    const qy = 540 - 58;
    $('f2-q').style.top = qy + 'px';
    QF.forEach((el, i) => word(el, t, i < 4 ? [7.13, 7.47, 7.54, 7.62][i] : 7.78, F(258) + i * 0.02, 0.4));
  }

  function shot5(t) {
    MEET.forEach((el) => word(el, t, 8.94, F(328)));
    const fade = 1 - seg(t, F(322), F(332));
    GUIDES.forEach((g, i) => {
      const L = M.gd ? M.gd[i] : 2000, p = oC(seg(t, 9.22 + i * 0.04, 9.67 + i * 0.04));
      g.style.strokeDasharray = `${f1(L)} ${f1(L)}`; g.style.strokeDashoffset = f1(L * (1 - p)); g.style.opacity = f3(fade);
    });
    // hold drift, then the glyphs spread apart and blur out
    const v = seg(t, F(330), F(338)), hold = 1 + 0.025 * seg(t, 9.9, 11.1);
    const spread = (cx) => (M.glb && v > 0 ? (cx - 512) * 0.6 * iC(v) : 0);
    logoReveal(LBG, t, { icon: 9.24, word: 9.33, wordGap: 0.052, dot: 9.85, sol: 9.9, solGap: 0.035 }, M.glb, spread);
    LB.style.transformOrigin = '50% 50%';
    LB.style.transform = `scale(${f3(hold)})`;
    LB.style.filter = v > 0 ? `blur(${f2(10 * iC(v))}px)` : 'none';
    LB.style.opacity = f3(1 - iC(v));
  }
  // the lockup builds glyph by glyph: icon pops, WEB SPIDER rises through its baseline, the dot pops, SOLUTIONS follows
  function logoReveal(G, t, T, cx = null, spread = () => 0) {
    const pop = (el, t0, dx) => {
      el.style.transformBox = 'fill-box'; el.style.transformOrigin = '50% 50%';
      const e = step(t - t0, 'snappy');
      el.style.opacity = t < t0 ? '0' : '1'; el.style.transform = `translate(${f1(dx)}px, 0px) scale(${f3(t < t0 ? 0 : 0.55 + 0.45 * e)})`;
    };
    pop(G.icon, T.icon, cx ? spread(cx.icon) : 0);
    G.word.forEach((g, i) => {
      const t0 = T.word + i * T.wordGap, dx = cx ? spread(cx.word[i]) : 0;
      g.style.opacity = t < t0 ? '0' : '1'; g.style.transform = `translate(${f1(dx)}px, ${f1(104 * (1 - oE((t - t0) / 0.42)))}px)`;
    });
    pop(G.dot, T.dot, cx ? spread(cx.dot) : 0);
    G.sol.forEach((g, i) => {
      const t0 = T.sol + i * T.solGap, dx = cx ? spread(cx.sol[i]) : 0;
      g.style.opacity = t < t0 ? '0' : '1'; g.style.transform = `translate(${f1(dx)}px, ${f1(52 * (1 - oE((t - t0) / 0.38)))}px)`;
    });
  }

  const plate = (el, t, S0, rot = 0, dx = 0, dy = 0) => {
    el.style.transform = `translate(${f1(960 + dx)}px, ${f1(540 + dy)}px) rotate(${f2(rot)}deg) scale(${f3(S0)}) translate(-1152px, -648px)`;
  };
  function shot6(t) {
    const eSet = step(t - F(339), 'default'), ePush = step(t - F(381), 'default');
    plate(P4, t, 0.86 * (1.1 - 0.08 * eSet + 0.06 * ePush + 0.01 * (t - F(339))), -3.5 * (1 - eSet));
    plate(P4B, t, 0.86 * (1.1 - 0.08 * eSet + 0.06 * ePush), -3.5 * (1 - eSet));
    P4B.style.opacity = f3(1 - ioC(seg(t, F(339), F(354))));
    const S0 = (1.06 - 0.06 * eSet) * Math.exp(Math.log(2.6) * ePush), rot = -4 * (1 - eSet);
    const px = lerp(1430, 960, ePush), py = lerp(522, 540, ePush);
    UI4.style.transform = `translate(${f1(px)}px, ${f1(py)}px) rotate(${f2(rot)}deg) scale(${f3(S0)}) translate(-1430px, -522px)`;
    UI4.style.filter = eSet < 0.97 ? `blur(${f2(6 * (1 - eSet))}px)` : 'none';
    const eB = step(t - F(341), 'snappy');
    BRIEF.style.opacity = f3(clamp((t - F(341)) * 10)); BRIEF.style.transform = `scale(${f3(0.94 + 0.06 * eB)})`;
    words(HEAD4, t, [11.8, 12.08, 12.22, 12.36]);
    const n = Math.floor(GOAL.length * seg(t, 11.98, 12.62));
    PH4.style.display = t < 11.98 ? 'inline' : 'none';
    TYPED.textContent = GOAL.slice(0, n);
    CUR.style.opacity = (t > 11.96 && t < 12.66) || Math.floor(t * 2.5) % 2 === 0 ? '1' : '0';
    const press = Math.exp(-Math.pow((t - 13.2) / 0.06, 2));
    SEND.style.transform = `scale(${f3(1 - 0.09 * press)})`;
    SENDAR.setAttribute('transform', `rotate(${f2(90 * step(t - 13.18, 'snappy'))} 34 34)`);
  }

  function shot78(t) {
    const t0 = F(400), T = t - t0;
    plate(P5, t, 0.86 * 1.2, 0); P5.style.opacity = '0.5';
    RINGS.forEach((c, k) => {
      const r = 140 + ((k * 130 + T * 320) % 780), fade = 1 - r / 920;
      c.setAttribute('cx', '960'); c.setAttribute('cy', '540'); c.setAttribute('r', f1(r));
      c.style.strokeWidth = f1(30 * fade); c.style.opacity = f3(0.9 * fade);
    });
    const grow = iC(seg(t, F(426), F(438)));
    const hs = (0.55 + 0.45 * step(T, 'snappy')) * Math.exp(Math.log(11) * grow);
    HUB.style.transform = `translate(960px, 540px) translate(-50%, -50%) scale(${f3(hs)})`;
    HUBBTN.style.transform = `translate(960px, 540px) translate(-50%, -50%) scale(${f3(1 + 0.3 * grow)})`;
    HUBBTN.style.opacity = f3(1 - seg(t, F(431), F(436)));
    const spin = 0.9 * (1 - Math.exp(-T / 0.35)) + 0.55 * T;
    HUBAR.setAttribute('transform', `rotate(${f2(90 + (spin * 180) / Math.PI)} 48 48)`);
    CARDS.forEach((el, i) => {
      const th = -Math.PI / 2 + (i * 2 * Math.PI) / CARDS.length + spin, R = i % 2 ? 455 : 330;
      const u = seg(t, t0 + (i % 5) * 0.012, t0 + 0.24 + (i % 5) * 0.012);
      const r = R * (0.15 + 0.85 * oC(u)) * (1 + 0.9 * grow), sc = 0.35 + 0.65 * oC(u);
      const x = 960 + Math.cos(th) * r * 1.25, y = 540 + Math.sin(th) * r * 0.92;
      el.style.opacity = f3(clamp(u * 6));
      el.style.transform = `translate(${f1(x)}px, ${f1(y)}px) translate(-50%, -50%) rotate(${f2((th * 180) / Math.PI)}deg) scale(${f3(sc)})`;
      el.style.filter = grow > 0.05 ? `blur(${f2(4 * grow)}px)` : 'none';
    });
    pill(CAP5, t, 13.34, Infinity, 960 - (M.cap5 || 700) / 2, 56, [13.36, 13.42, 13.48, 13.54]);
    words(CAP5W, t, [13.36, 13.42, 13.48, 13.54]);
  }

  function shot9(t) {
    const e = step(t - F(438), 'default');
    S.s6.style.transformOrigin = '960px 540px';
    S.s6.style.transform = `scale(${f3(1.18 - 0.18 * e)})`;
    SEC.style.top = f1(M.secTop || 455) + 'px';
    const out = 1 - seg(t, F(465), F(467));
    SECCH.forEach((el, k) => {
      const t0 = 14.63 + k * 0.034, u = (t - t0) / 0.32;
      el.style.opacity = f3(clamp(u * 6) * out);
      el.style.transform = `translateY(${f1(-110 * (1 - oE(u)))}px)`;
      el.style.filter = u < 1 ? `blur(${f2(6 * (1 - clamp(u)))}px)` : 'none';
      el.style.color = rgb(GREEN, INK, (t - t0) / 0.35);
    });
    // selection box: wipes over the word, then grows into the editor window
    const B = M.secBox || [600, 470, 720, 110];
    if (t < F(462)) { SELBOX.style.opacity = '0'; return; }
    SELBOX.style.opacity = '1';
    const g = ioC(seg(t, F(464.5), F(468)));
    const x = lerp(B[0], 370, g), y = lerp(B[1], 200, g), sx = lerp(B[2] / 1180, 1, g), sy = lerp(B[3] / 700, 1, g);
    SELBOX.style.transform = `translate(${f1(x)}px, ${f1(y)}px) scale(${f3(sx)}, ${f3(sy)})`;
    SELBOX.style.clipPath = t < F(465) ? `inset(0 ${f2(100 * (1 - oC(seg(t, F(462), F(465)))))}% 0 0)` : 'none';
    SELBOX.style.backgroundColor = rgb(GREEN, INK2, g);
  }

  function shot10to13(t) {
    const T = t - F(468);
    plate(P7, t, 0.86 * (1.05 + 0.012 * T), 0, -10 * T, 0);
    plate(P7R, t, 0.86 * (1.08 + 0.01 * T), 0, -10 * T, 0);
    P7R.style.opacity = t >= F(534) && t < F(591) ? '1' : '0';
    let tf;
    if (t < F(523)) {           // 10: window settles, drifts, lifts
      const sc = 0.985 + 0.015 * step(t - F(468), 'default'), u = seg(t, F(468), F(517));
      const lift = 760 * iC(seg(t, F(516), F(523)));
      tf = `translate(${f1(16 - 32 * u)}px, ${f1(6 - 12 * u - lift)}px) scale(${f3(sc)})`;
    } else if (t < F(534)) {    // 11: tilted close push
      const e = oC(seg(t, F(523), F(534)));
      tf = `translate(${f1(440 - 20 * e)}px, ${f1(330 - 30 * e)}px) rotateX(${f2(22 - 6 * e)}deg) rotateY(${f2(-16 + 4 * e)}deg) scale(${f3(2.25 - 0.3 * e)})`;
    } else if (t < F(591)) {    // 12: close-up on the AI-search line
      const u = seg(t, F(534), F(591)), e = oC(seg(t, F(534), F(540)));
      tf = `translate(${f1(274 - 20 * u)}px, ${f1(184 + 10 * (1 - e))}px) rotateX(7deg) rotateY(-9deg) scale(${f3(1.84 - 0.06 * e + 0.04 * u)})`;
    } else {                    // 13: springs up from below with the preview
      const e = step(t - F(591), 'default');
      tf = `translate(${f1(-8 * seg(t, F(591), F(632)))}px, ${f1(760 * (1 - e))}px) rotateX(${f2(10 * (1 - e))}deg) scale(1)`;
    }
    ED.style.transform = tf;
    const smear = iC(seg(t, F(627), F(632)));
    DIM7.style.opacity = f3(0.86 * smear);
    EDWRAP.style.filter = smear > 0.01 ? `blur(${f2(10 * smear)}px)` : 'none';
    LINES.style.transform = `translateY(${f1(-144 * step(t - F(581), 'default'))}px)`;
    const fixed = t >= F(582);
    LN.forEach((L, i) => {
      const ts = 15.66 + i * 0.055;
      L.tx.style.clipPath = `inset(0 ${f2(100 * (1 - seg(t, ts, ts + 0.14)))}% 0 0)`;
      L.no.style.opacity = t >= ts ? '1' : '0';
      let ok = false;
      if (i <= 3) ok = t >= F(524 + 2 * i);
      else if (i >= 7) ok = t >= F(583) + (i - 7) * 0.04;
      if (i === ERR) ok = fixed;
      if (t >= F(591)) ok = true;
      const has = CODE_NONEMPTY[i];
      L.hl.style.opacity = (ok && has && i !== ERR) || (i === ERR && fixed) ? '1' : '0';
      if (L.ck) { L.ck.style.opacity = ok && has ? '1' : '0'; L.ck.style.transform = `scale(${f3(ok ? 0.6 + 0.4 * step(t - (i <= 3 ? F(524 + 2 * i) : F(583)), 'snappy') : 1)})`; }
      if (i === ERR) {
        const bad = t >= F(543) && !fixed;
        L.hl.className = 'hl ' + (fixed ? 'ok' : 'bad');
        L.hl.style.opacity = bad || fixed ? '1' : '0';
        L.x.style.opacity = bad ? '1' : '0';
        L.fx.style.opacity = bad ? f3(0.55 + 0.45 * Math.sin(t * 9)) : '0';
        if (L.ck) L.ck.style.left = fixed ? f1(M.ckFix) + 'px' : L.ck.dataset.left || L.ck.style.left;
      }
    });
    if (t >= F(561) && t < F(582)) {
      const f = Math.floor(t * 30), chars = 'abcdefghijklmnopqrstuvwxyz#$%&/<>*';
      let s = '';
      for (let j = 0; j < 9; j++) s += chars[Math.floor(hash(f * 13 + j) * chars.length)];
      ERRV.textContent = `"${s}"`;
    } else ERRV.textContent = fixed ? '"cited"' : '"not cited"';
    // captions: Rank on Google, / show up in AI search, / and let WebSpider make it work.
    const CAPT = [[15.76, 16.08, 16.2], [17.07, 17.36, 17.52, 17.66, 17.86, 18.05], [18.82, 19.0, 19.16, 19.56, 19.78, 19.9]];
    [[15.72, 17.0], [17.04, 18.78], [18.8, 20.95]].forEach(([a, b], i) => pill(CAP7[i], t, a, b, 96, 64, CAPT[i]));
    words(CAP7W[0], t, CAPT[0], 17.0);
    words(CAP7W[1], t, CAPT[1], 18.78);
    words(CAP7W[2], t, CAPT[2], 20.95);
    GL2.style.display = t >= F(591) && t < F(632) ? 'block' : 'none';
  }
  const CODE_NONEMPTY = [];

  function shot14(t) {
    const T = t - F(632);
    const push = 1 + 0.06 * ioC(seg(T, 5.2, 6.9)), pulse = Math.sin(Math.PI * seg(T, 4.83, 5.05));
    WEBCAM.style.transform = `scale(${f3(push)})`;
    WEBCAM.style.filter = pulse > 0.01 ? `blur(${f2(3.5 * pulse)}px)` : 'none';
    const layout = T >= 2.78;
    for (const c of CH) {
      let x, y, sc, op, blur = 0, hi = 0;
      if (!layout) {
        const zc = c.fz - 0.5 * T;
        x = 960 + (c.fx - 960) / zc; y = 540 + (c.fy - 540) / zc; sc = clamp(1.25 / zc, 0.3, 3.0);
        blur = Math.min(9, Math.abs(zc - 1) * 5.5);
        op = oC(seg(T, (c.i % 7) * 0.03, 0.35 + (c.i % 7) * 0.03)) * clamp((zc - 0.35) / 0.2) * clamp((3.4 - zc) / 0.8) * (1 - seg(T, 2.6, 2.74));
        for (const [i, a, b] of HILITE) if (i === c.i && T >= a && T < b) hi = 1;
        sc *= 1 + 0.12 * hi;
      } else {
        const k = WEBP.order[c.i] || 0, ts = 2.8 + k * 0.028, e = step(T - ts, 'snappy');
        x = c.x; y = c.y; sc = 0.6 + 0.4 * e; op = clamp((T - ts) * 12);
        const kk = KEY.indexOf(c.i);
        if (kk >= 0) sc *= 1 + 0.28 * step(T - (5.25 + kk * 0.2), 'default');
      }
      c.el.style.opacity = f3(op);
      c.el.style.transform = `translate(${f1(x)}px, ${f1(y)}px) scale(${f3(sc)})`;
      c.el.style.filter = blur > 0.35 ? `blur(${f2(blur)}px)` : 'none';
      // connected: the green dot (or a green ring around the logo tile) lights when its thread arrives
      const k = WEBP.order[c.i] || 0, arrive = 3.73 + k * 0.03 + 0.33, lit = layout && T >= arrive ? 1 : hi;
      c.dg.style.opacity = f3(lit); c.dg.style.transform = `scale(${f3(c.mk ? 3.4 : 1)})`;
      const kk = KEY.indexOf(c.i), keyOn = layout && kk >= 0 && T >= 5.25 + kk * 0.2;
      c.vl.style.backgroundColor = keyOn ? '#92c131' : 'rgba(90,94,100,0.1)';
      c.vl.style.color = keyOn ? '#141618' : '#5a5e64';
    }
    for (const r of WEBP.radial) {
      const k = WEBP.order[r.i] || 0, p = oC(seg(T, 3.73 + k * 0.03, 4.06 + k * 0.03));
      r.p.style.strokeDasharray = `${f1(r.L)} ${f1(r.L)}`; r.p.style.strokeDashoffset = f1(r.L * (1 - p)); r.p.style.opacity = p > 0 ? '1' : '0';
    }
    for (const r of WEBP.ring) {
      const p = oC(seg(T, 4.15 + r.r * 0.12 + r.k * 0.02, 4.45 + r.r * 0.12 + r.k * 0.02));
      r.p.style.strokeDasharray = `${f1(r.L)} ${f1(r.L)}`; r.p.style.strokeDashoffset = f1(r.L * (1 - p)); r.p.style.opacity = p > 0 ? '1' : '0';
    }
    if (WEBP.hub) { const e = step(T - 2.78, 'snappy'); WEBP.hub.style.opacity = T >= 2.78 ? '1' : '0';
      WEBP.hub.style.transformBox = 'fill-box'; WEBP.hub.style.transformOrigin = '50% 50%'; WEBP.hub.style.transform = `scale(${f3(0.5 + 0.5 * e)})`; }
    if (WEBP.motes) for (const m of WEBP.motes) {
      const u = T - m.t0;
      if (u < 0) { m.el.style.opacity = '0'; continue; }
      m.el.style.opacity = f3(clamp(u * 2) * (0.25 + 0.4 * m.s) * (1 - seg(T, 6.6, 6.93)));
      m.el.style.transform = `translate(${f1(m.x + 14 * Math.sin(T * 1.3 + m.ph))}px, ${f1(m.y - m.v * u)}px) scale(${f3(m.s)})`;
    }
    // captions bottom-left: together. / dots, / matters.
    words(C8W[0], t, [21.2, 21.55, 22.25, 23.28, 23.5, 23.85], 24.62);
    wipe(C8B[0], t, 24.0);
    words(C8W[1], t, [24.75, 25.08, 25.25], 26.12);
    wipe(C8B[1], t, 25.35);
    words(C8W[2], t, [26.2, 26.42, 26.8, 27.0]);
    wipe(C8B[2], t, 27.12);
  }

  function shot15(t) {
    const T = t - 28.0;
    P9.style.transform = `translate(960px, ${f1(540 + 6 * T)}px) scale(${f3(0.86 * (1.0 + 0.016 * T))}) translate(-1152px, -648px)`;
    SCRIM.style.opacity = f3(seg(T, 0, 0.5) * (0.6 + 0.4 * seg(t, 32.1, 32.6)));
    // "One team to" / "plan, launch, and grow." build on the VO; one green sticker hops to the newest word
    TAG.style.top = '286px'; TAG2.style.top = '392px';
    words(TAGW, t, [28.17, 28.61, 28.99], 32.05);
    const tins = [29.11, 30.05, 31.15];
    TW.forEach((el, i) => { word(el, t, tins[i], 32.11 + i * 0.03, 0.45, 0.24); el.classList.toggle('on', t >= tins[i] + 0.06 && (i === 2 || t < tins[i + 1] + 0.06)); });
    if (M.ready) {
      const pad = 14, at = (i) => [M.tw[i][0] - pad, M.tw[i][1] + 2 * pad];
      let [x, w] = at(0);
      for (const i of [1, 2]) { const e = step(t - (tins[i] + 0.02), 'snappy'), [x2, w2] = at(i), [x1, w1] = at(i - 1); x += (x2 - x1) * e; w += (w2 - w1) * e; }
      const grow = oC(seg(t, tins[0] + 0.04, tins[0] + 0.16)), out = 1 - seg(t, 32.05, 32.25);
      TBOX.style.opacity = t >= tins[0] + 0.04 ? f3(out) : '0';
      TBOX.style.top = f1(M.tagH * 0.15) + 'px'; TBOX.style.height = f1(M.tagH * 0.8) + 'px';
      TBOX.style.clipPath = `inset(0 ${f1(1920 - x - w * grow)}px 0 ${f1(x)}px round 14px)`;
    }
    // end card: the white lockup + url
    logoReveal(LEG, t, { icon: 32.3, word: 32.36, wordGap: 0.03, dot: 32.62, sol: 32.66, solGap: 0.022 });
    LE.style.transformOrigin = '50% 50%'; LE.style.transform = `scale(${f3(1 + 0.02 * seg(t, 32.6, 35))})`;
    words(URLW, t, [32.95]);
  }

  // ---------------------------------------------------------------- frame
  function render(t) {
    window.__lastT = t;
    for (const k in SC) show(S[k], t >= SC[k][0] && t < SC[k][1]);
    show(FR.f2, t >= F(233) && t < F(268)); show(FR.f3, t >= F(268) && t < F(339));
    show(GL1, t >= F(233) && t < F(286));
    show(FLASH, (t >= F(39) && t < F(40)) || (t >= F(59) && t < F(60))); FLASH.style.opacity = '1';
    if (t < F(233)) shot1to3(t);
    else if (t < F(268)) shot4(t);
    else if (t < F(339)) shot5(t);
    else if (t < F(400)) shot6(t);
    else if (t < F(438)) shot78(t);
    else if (t < F(468)) shot9(t);
    else if (t < F(632)) shot10to13(t);
    else if (t < 28.0) shot14(t);
    else shot15(t);
    const f = Math.floor(t * 30); GRAIN.style.backgroundPosition = `${(f * 37) % 256}px ${(f * 91) % 256}px`;
    if (window.__hero3d) window.__hero3d.render(t);
  }

  // static layout
  LB.style.left = '470px'; LB.style.top = '352px'; LB.style.width = '980px'; LB.style.height = '393px';
  LE.style.left = '540px'; LE.style.top = '286px'; LE.style.width = '840px'; LE.style.height = '337px';
  $('url').style.top = '690px';
  SELBOX.style.width = '1180px'; SELBOX.style.height = '700px';
  $('s1-q').style.top = (540 - 58) + 'px';
  GL2.style.left = '0px';
  LN.forEach((L, i) => { CODE_NONEMPTY[i] = L.tx.textContent.trim().length > 0; if (L.ck) L.ck.dataset.left = L.ck.style.left; });

  // ---------------------------------------------------------------- clock
  const tl = gsap.timeline({ paused: true });
  const CLK = { t: 0 };
  tl.fromTo(CLK, { t: 0 }, { t: D, duration: D, ease: 'none', onUpdate: () => render(CLK.t) }, 0);
  window.addEventListener('hf-seek', (e) => render(e.detail.time));
  window.__timelines = window.__timelines || {};
  window.__timelines['main'] = tl;
  render(0);
  measure();
})();
