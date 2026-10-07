// Research Before Production — HTML layer + timeline. Pure function of time.
// render(t) owns everything continuous: which scene/front is on, plate moves, the footprints, the count-up, the
// transitions (iris out of the slate, light sweep, push-through the T-mark, cover, split), chalk dust, captions and the
// 3D hero. GSAP owns the word rises/lifts and sticker wipes. Times come from timeline.json (marks = bar lines, cues =
// spoken words from assets/audio/words.json).
(() => {
  const root = document.getElementById('root');
  const W = +root.dataset.width, H = +root.dataset.height, TALL = H > W;
  const TL = window.TL, M = TL.marks, Q = TL.cues, P = window.PHYS, CAPS = window.CAPS || [];
  const $ = (id) => document.getElementById(id);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const pick = (tall, wide) => (TALL ? tall : wide);
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const px = (v) => `${v}px`;
  const f2 = (v) => v.toFixed(2);
  function put(el, x, y, w, h) { el.style.left = px(x); el.style.top = px(y); if (w != null) el.style.width = px(w); if (h != null) el.style.height = px(h); }
  const font = (el, size) => { el.style.fontSize = px(size); };
  const out3 = (u) => 1 - Math.pow(1 - clamp(u), 3), in2 = (u) => clamp(u) * clamp(u);
  const io3 = (u) => { u = clamp(u); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
  const PRE = { snappy: [0.22, 0.8], default: [0.4, 0.86], heavy: [0.5, 1.0], soft: [0.75, 1.0] };
  function spring(tau, p = 'default') {
    if (!(tau > 0)) return 0;
    const [resp, z] = PRE[p], w = (2 * Math.PI) / resp;
    if (z < 1) { const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + ((z * w) / wd) * Math.sin(wd * tau)); }
    return 1 - Math.exp(-w * tau) * (1 + w * tau);
  }
  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  // ================================================================ the 3D hero's camera intents, per format
  const cam = (T, sx, sy, spx, pitch = 0, yaw = 0, roll = 0) => ({ T, sx, sy, spx, pitch, yaw, roll, fov: 30 });
  const CEN = [0, -0.8, 0], SL = [0, -1.05, 0], TIP = [0.6, 0.9, 0.06], MAC = [0.9, 0.75, 0.06];
  window.__HERO_CFG = { W, H, TALL, CAM: pick({
    macro: cam(MAC, 560, 1000, 760, 10, -30, -6), f1: cam(CEN, 540, 1300, 250, 8, -14),
    slateIn: cam(SL, 540, 1220, 380, 4, -24), slate: cam(SL, 540, 1240, 290, 3, -10),
    slate1: cam(SL, 540, 1240, 300, 3, -6), slate2: cam(SL, 540, 1244, 310, 3, -2), slate3: cam(SL, 540, 1250, 320, 3, 2),
    gap: cam(TIP, 560, 1300, 360, 8, -24, -3), clap: cam(CEN, 540, 1220, 265, 6, -8), exit: cam(CEN, 540, 3100, 240, 6, -6),
  }, {
    macro: cam(MAC, 1320, 540, 560, 10, -30, -6), f1: cam(CEN, 1380, 600, 225, 8, -14),
    slateIn: cam(SL, 1360, 600, 320, 4, -24), slate: cam(SL, 1370, 610, 240, 3, -12),
    slate1: cam(SL, 1370, 610, 250, 3, -8), slate2: cam(SL, 1370, 612, 260, 3, -4), slate3: cam(SL, 1370, 616, 270, 3, 0),
    gap: cam(TIP, 1340, 640, 260, 8, -24, -3), clap: cam(CEN, 1380, 590, 220, 6, -8), exit: cam(CEN, 1380, 1800, 200, 6, -6),
  }) };
  // the runtime waits for this before capturing (resolved by hero3d.js once the slate is drawn)
  window.__hf = window.__hf || {}; window.__hf.buildReady = window.__hf.buildReady || {};
  window.__hf.buildReady['hero3d'] = new Promise((res) => { window.__hero3dReady = res; });

  // ================================================================ timing
  const IRIS = M.stakes, IRIS_D = 0.6;                 // F1 → F2: iris out of the slate
  const SWEEP = M.footprints - 0.36;                   // F3 → F4: light sweep, swap ON the bar
  const PUSH0 = M.slate - 0.36;                        // F4 → F5: push through the T-mark
  const COV0 = M.cost - 0.3, COV1 = M.cost + 0.3;      // F5 → F6: cover from below, half-way ON the bar
  const SPLIT0 = Q.change2 - 0.12, SPLIT1 = Q.change2 + 0.5;
  const HERO_ON = (t) => t < IRIS + IRIS_D || (t >= M.slate && t < COV1) || (t >= M.gap && t < M.logo + 0.2);

  // ================================================================ layout (computed once)
  const S = {}, F = {};
  for (const k of ['s1', 's2', 's3', 's4', 's5', 's6', 's7']) { S[k] = $(k); F[k] = $(`${k}-front`); }
  const GL = $('gl'), FX = $('fx'); FX.width = W; FX.height = H; const fx = FX.getContext('2d');
  const X0 = pick(72, 120);
  for (const id of ['s1-plate', 's5-plate', 's7-plate']) $(id).style.opacity = '0.7';

  // F1 hook
  put($('s1-eye'), X0, pick(300, 300)); font($('s1-eye'), pick(30, 26));
  put($('s1-head'), X0, pick(352, 340)); font($('s1-head'), pick(140, 118));
  font($('s1-for'), pick(230, 196));
  // F2 stakes
  put($('s2-l1'), X0, pick(300, 380)); font($('s2-l1'), pick(96, 80));
  put($('s2-l2'), X0, pick(410, 474)); font($('s2-l2'), pick(96, 80));
  put($('s2-scrim'), pick(-260, -280), pick(120, 180), pick(1300, 1300), pick(620, 520));
  put($('s2-haze'), ...pick([-420, 160, 1100, 1100], [1250, -520, 1300, 1300]));
  // F3 proof
  put($('s3-num'), X0, pick(310, 230)); font($('s3-num'), pick(400, 320));
  put($('s3-cap'), X0, pick(770, 600)); font($('s3-cap'), pick(52, 44));
  put($('s3-tags'), X0, pick(960, 760)); font($('s3-tags'), pick(40, 32));
  $$('#s3-tags .pill').forEach((p, i) => { p.style.marginRight = px(pick(18, 16)); p.style.marginBottom = px(14); });
  put($('s3-src'), X0, pick(1420, 870)); font($('s3-src'), pick(24, 21));
  put($('s3-glow'), ...pick([-500, -300, 1700, 1700], [-400, -500, 1600, 1600]));
  // F4 footprints (head + follow share the top band)
  put($('s4-head'), X0, pick(300, 200)); font($('s4-head'), pick(88, 76));
  put($('s4-follow'), X0, pick(300, 200)); font($('s4-follow'), pick(112, 96));
  font($$('#s4-follow .line')[1], pick(210, 180));
  put($('s4-scrim'), pick(-300, -300), pick(150, 60), pick(1500, 1500), pick(700, 560));
  // F5 slate
  put($('s5-eye'), X0, pick(300, 220)); font($('s5-eye'), pick(32, 30));
  put($('s5-head'), X0, 300); font($('s5-head'), 112); if (TALL) $('s5-head').style.display = 'none'; else $('s5-eye').style.display = 'none';
  // F6 cost
  put($('s6-a1'), X0, pick(300, 110)); font($('s6-a1'), pick(104, 84));
  put($('s6-a2'), X0, pick(560, 330)); font($('s6-a2'), pick(54, 44));
  put($('s6-b1'), X0, pick(1080, 600)); font($('s6-b1'), pick(104, 84));
  put($('s6-b2'), X0, pick(1330, 810)); font($('s6-b2'), pick(62, 50));
  put($('s6-fin'), X0, pick(700, 520)); font($('s6-fin'), pick(170, 150));
  font($$('#s6-fin .line')[1], pick(250, 210));
  put($('s6-a-scrim'), ...pick([-420, 40, 1500, 860], [-420, -160, 1500, 760]));
  put($('s6-b-scrim'), ...pick([-300, 900, 1400, 700], [-420, 420, 1500, 720]));
  // F7–F9 clap + end card
  put($('s7-head'), X0, pick(300, 380)); font($('s7-head'), pick(150, 130));
  const LOGO = window.TL.logo || { size: [534, 772], feet: { l: { x: 0, y: 152, w: 256, h: 620 }, r: { x: 278, y: 0, w: 256, h: 620 } } };
  const LH = pick(420, 540), LK = LH / LOGO.size[1], LWd = LOGO.size[0] * LK;
  const LC = pick([540, 690], [1380, 500]);            // logo centre: where the slate was
  const LX = LC[0] - LWd / 2, LY = LC[1] - LH / 2;
  put($('s9-logo'), LX, LY, LWd, LH);
  const FT = {};
  for (const k of ['l', 'r']) { const f = LOGO.feet[k], el = $(`s9-f${k}`); put(el, f.x * LK, f.y * LK, f.w * LK, f.h * LK); FT[k] = el; }
  if (TALL) {
    for (const [id, y, size] of [['s9-name', 960, 96], ['s9-tag', 1205, 40], ['s9-cta', 1330, 34], ['s9-url', 1452, 34]]) {
      const el = $(id); el.style.left = '0px'; el.style.width = px(W); el.style.textAlign = 'center'; el.style.top = px(y); font(el, size);
    }
  } else {
    for (const [id, y, size] of [['s9-name', 290, 100], ['s9-tag', 540, 40], ['s9-cta', 690, 32], ['s9-url', 800, 32]]) { put($(id), X0, y); font($(id), size); }
  }
  put($('s9-glow'), LC[0] - 650, LC[1] - 650, 1300, 1300); put($('hero-glow'), -800, -800, 1600, 1600);
  // 16:9 burned captions
  const CAP = $('caps'), CAPT = $('caps-t');
  if (TALL) CAP.style.display = 'none'; else { CAP.style.top = px(H - 120); font(CAPT, 34); }

  // ---------------------------------------------------------------- F4: the tilted floor, the footprints, the standing stickers
  // extended floor plates (tools/prep_plates.py): the plate sits in a wider near-black canvas, so the plane's borders never show
  const FL = pick({ persp: 1400, ox: 540, oy: 600, tilt: 50, bottom: 2040, plate: [2620, 2060], T: [503 + 806, 418 + 268], pk: 1.339,
                    foot: [104, 252], lat: 92, start: [0, -120], ctrl: [-170, -900], endBack: 175 },
                  { persp: 1700, ox: 1300, oy: 300, tilt: 50, bottom: 1200, plate: [4300, 1512], T: [1350 + 1254, 378 + 504], pk: 1.587,
                    foot: [100, 242], lat: 88, start: [-700, -100], ctrl: [90, -300], endBack: 165 });
  FL.pw = FL.plate[0] * FL.pk; FL.ph = FL.plate[1] * FL.pk;
  FL.start = [FL.pw / 2 + FL.start[0], FL.ph + FL.start[1]]; FL.ctrl = [FL.pw / 2 + FL.ctrl[0], FL.ph + FL.ctrl[1]];
  const stage = $('s4-stage'), plane = $('s4-plane'), plateEl = $('s4-plate');
  stage.style.perspective = px(FL.persp); stage.style.perspectiveOrigin = `${FL.ox}px ${FL.oy}px`;
  put(plane, (W - FL.pw) / 2, FL.bottom - FL.ph, FL.pw, FL.ph);
  plane.style.transformOrigin = '50% 100%'; plane.style.transform = `rotateX(${FL.tilt}deg)`;
  put(plateEl, 0, 0, FL.pw, FL.ph);
  const TM = [FL.T[0] * FL.pk, FL.T[1] * FL.pk];                    // T-mark crossbar (top) centre, plane px
  put($('s4-mark'), TM[0], TM[1] + 60);
  const end = [TM[0], TM[1] + FL.endBack];
  const bez = (s) => { const a = FL.start, c = FL.ctrl; return [(1 - s) ** 2 * a[0] + 2 * (1 - s) * s * c[0] + s * s * end[0], (1 - s) ** 2 * a[1] + 2 * (1 - s) * s * c[1] + s * s * end[1]]; };
  const STEPS = P.STEPS, feet = [];
  STEPS.forEach((st, i) => {
    const s = 0.08 + 0.92 * (i / (STEPS.length - 1)), [cx, cy] = bez(s), [ax, ay] = bez(Math.max(0, s - 0.02)), [bx, by] = bez(Math.min(1, s + 0.02));
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;            // right-hand normal (y down)
    const side = st.foot === 'l' ? -1 : 1, ang = Math.atan2(dx, -dy) * 180 / Math.PI;
    const x = cx + nx * FL.lat * side, y = cy + ny * FL.lat * side;
    const el = document.createElement('div'); el.className = 'foot';
    const im = document.createElement('img'); im.src = `assets/brand/foot-${st.foot}.png`; im.alt = ''; el.appendChild(im);
    put(el, x - FL.foot[0] / 2, y - FL.foot[1] / 2, FL.foot[0], FL.foot[1]); plane.appendChild(el);
    let tag = null;
    if (st.word) {
      tag = document.createElement('div'); tag.className = 'tag'; tag.textContent = st.word; font(tag, pick(84, 80));
      tag.setAttribute('data-layout-allow-occlusion', '');   // under the (mostly clear) global vignette on purpose
      tag.style.transformOrigin = '50% 100%'; tag.style.opacity = '0';
      const off = FL.foot[0] * 0.55 + 18, tx = x + nx * off * side, ty = y + ny * off * side;
      tag.style.left = px(tx); tag.style.top = px(ty); plane.appendChild(tag);
    }
    feet.push({ el, tag, t: st.t, ang, word: !!st.word, mark: !!st.mark, shift: side < 0 ? '-100%' : '0%' });   // left-foot tags grow leftward
  });
  plane.style.transformStyle = 'preserve-3d';
  // the T-mark's point on screen (layout read once, at setup) = the centre of the dolly and the push-through
  const mr = $('s4-mark').getBoundingClientRect(), rr = root.getBoundingClientRect();
  const TS = [(mr.left + mr.right) / 2 - rr.left, (mr.top + mr.bottom) / 2 - rr.top];
  stage.style.transformOrigin = `${TS[0]}px ${TS[1]}px`; F.s4.style.transformOrigin = `${TS[0]}px ${TS[1]}px`;

  // ---------------------------------------------------------------- F6: split-screen framing
  const P45 = pick({ a: [1280, 1024, 0.70, 0.50], b: [1280, 1024, 0.52, 0.55] }, { a: [1280, 1024, 0.72, 0.45], b: [1280, 1024, 0.55, 0.52] });
  function frameImg(img, box, spec, zoom, at = [0.5, 0.5]) {   // cover `box`; the focus point lands at `at` (box-relative) where possible
    const [iw, ih, fx0, fy0] = spec, s = Math.max(box[2] / iw, box[3] / ih) * zoom, w = iw * s, h = ih * s;
    const x = clamp(box[0] + box[2] * at[0] - fx0 * w, box[0] + box[2] - w, box[0]), y = clamp(box[1] + box[3] * at[1] - fy0 * h, box[1] + box[3] - h, box[1]);
    img.style.width = px(iw); img.style.height = px(ih); img.style.transformOrigin = '0 0';
    img.style.transform = `translate(${f2(x)}px, ${f2(y)}px) scale(${s.toFixed(5)})`;
  }
  const A_HALF = [0, 0, W, H / 2], B_HALF = [0, H / 2, W, H / 2];                 // top / bottom in both formats
  const inset = (b) => `inset(${f2(b[1])}px ${f2(W - b[0] - b[2])}px ${f2(H - b[1] - b[3])}px ${f2(b[0])}px)`;
  for (const id of ['s6-a', 's6-b']) put($(id), 0, 0, W, H);
  put($('s6-bdim'), ...B_HALF);

  // ---------------------------------------------------------------- F5: frame-lines (placed once the hero can project)
  let framesPlaced = false;
  function placeFrames() {
    if (framesPlaced || !window.__hero3d || !window.__hero3d.screenAt) return;
    const p = window.__hero3d.screenAt(Q.vertical + 0.5, 'slate');
    const a = pick([560, 996], [430, 764]), b = pick([920, 518], [960, 540]);
    put($('s5-f916'), p.x - a[0] / 2, p.y - a[1] / 2 - pick(40, 20), a[0], a[1]);
    put($('s5-f169'), p.x - b[0] / 2, p.y - b[1] / 2, b[0], b[1]);
    framesPlaced = true;
  }

  // ================================================================ per-frame render
  const HG = $('hero-glow'), G9 = $('s9-glow'), grain = $('grain');
  const RING = $('t-ring'), RC = $$('#t-ring circle'), LIGHT = $('t-light');
  put(RING, 0, 0, W, H); RING.setAttribute('viewBox', `0 0 ${W} ${H}`);
  put(LIGHT, -0.8 * W, -0.6 * H, 2.6 * W, 2.2 * H);
  const CIRC = ['circuit-sa', 'circuit-sb', 'circuit-sc'].map($);
  const N3 = $('s3-n'), PCT = $('s3-pct'), NUM = $('s3-num');
  let irisC = null, dustP = null, lastCap = -1;

  // chalk dust: launched ON the downbeat from the clap point, drag + gravity + flutter, ≤ 2.4 s
  function dust(t) {
    fx.clearRect(0, 0, W, H);
    const x = t - M.drop + 0.035, live = x >= 0 && x <= 2.4;
    FX.style.opacity = live ? '1' : '0';                       // an idle canvas would read as an occluder to the layout check
    if (!live || !window.__hero3d) return;
    if (!dustP) {
      const o = window.__hero3d.screenAt(M.drop, 'tip'), r = rng(2026); dustP = [];
      for (let i = 0; i < 110; i++) {
        const a = -Math.PI / 2 + (r() - 0.5) * 2.6, v = 260 + r() * 900;
        dustP.push({ x: o.x + (r() - 0.5) * 120, y: o.y + (r() - 0.5) * 30, vx: Math.cos(a) * v * (r() < 0.5 ? 1 : 0.6), vy: Math.sin(a) * v,
                     r: 1.5 + r() * r() * 9, life: 0.9 + r() * 1.5, ph: r() * 6.28, fl: 18 + r() * 40 });
      }
    }
    for (const p of dustP) {
      if (x > p.life) continue;
      const k = 3.2, e = (1 - Math.exp(-k * x)) / k;                                  // drag
      const px_ = p.x + p.vx * e + Math.sin(x * 7 + p.ph) * p.fl * x, py_ = p.y + p.vy * e + 140 * x * x;
      const a = Math.pow(1 - x / p.life, 1.6) * 0.85;
      fx.fillStyle = `rgba(236,234,228,${a.toFixed(3)})`; fx.beginPath(); fx.arc(px_, py_, p.r * (1 + 0.6 * x), 0, Math.PI * 2); fx.fill();
    }
  }

  function render(t) {
    window.__lastT = t;
    // ---- which scenes / fronts are on
    const on = { s1: t < IRIS + IRIS_D, s2: t >= IRIS && t < M.proof, s3: t >= M.proof && t < M.footprints, s4: t >= M.footprints && t < M.slate,
                 s5: t >= M.slate && t < COV1, s6: t >= COV0 && t < M.gap, s7: t >= M.gap };
    for (const k in on) { const v = on[k] ? '1' : '0'; S[k].style.opacity = v; F[k].style.opacity = v; }

    // ---- the 3D hero
    const heroOn = HERO_ON(t) && window.__hero3d;
    GL.style.opacity = heroOn ? '1' : '0';
    if (heroOn) window.__hero3d.render(t);
    const hs = heroOn && window.__hero3d.screen;
    HG.style.opacity = hs ? '1' : '0';
    if (hs) HG.style.transform = `translate(${f2(hs.x)}px, ${f2(hs.y)}px) scale(${(0.95 + 0.06 * Math.sin(t * 1.6)).toFixed(4)})`;
    placeFrames();

    // ---- F1 → F2 iris out of the slate
    if (t >= IRIS && t < IRIS + IRIS_D) {
      if (!irisC) irisC = window.__hero3d ? window.__hero3d.screenAt(IRIS, 'slate') : { x: W / 2, y: H * 0.65 };
      const { x: cx, y: cy } = irisC, R = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) + 30;
      const u = (t - IRIS) / IRIS_D, r = Math.max(0.5, R * in2(u));
      const hole = `circle(${f2(r)}px at ${f2(cx)}px ${f2(cy)}px)`;
      const inv = `path(evenodd, "M0 0H${W}V${H}H0Z M${f2(cx - r)} ${f2(cy)}a${f2(r)} ${f2(r)} 0 1 0 ${f2(2 * r)} 0a${f2(r)} ${f2(r)} 0 1 0 ${f2(-2 * r)} 0Z")`;
      S.s2.style.clipPath = hole; F.s2.style.clipPath = hole; GL.style.clipPath = inv; F.s1.style.clipPath = inv;
      S.s1.style.transformOrigin = `${f2(cx)}px ${f2(cy)}px`; S.s1.style.transform = `scale(${(1 + 0.12 * in2(u)).toFixed(4)})`;
      RC.forEach((c) => { c.setAttribute('cx', f2(cx)); c.setAttribute('cy', f2(cy)); c.setAttribute('r', f2(r)); });
      RING.style.opacity = u > 0.9 ? f2((1 - u) / 0.1) : '1';
    } else {
      S.s2.style.clipPath = 'none'; F.s2.style.clipPath = 'none'; F.s1.style.clipPath = 'none'; S.s1.style.transform = 'none';
      RING.style.opacity = '0';
    }

    // ---- F2: projector haze + push
    if (on.s2) {
      $('s2-plate').style.transform = `scale(${(1 + 0.07 * clamp((t - IRIS) / (M.proof - IRIS))).toFixed(4)})`;
      $('s2-haze').style.opacity = f2(0.55 + 0.3 * Math.sin(t * 2.3) * Math.sin(t * 0.9));
    }
    // ---- F3: count-up slam (number and scale share one curve; the % lands after)
    if (on.s3) {
      const u = clamp((t - (M.proof + 0.05)) / 0.82), e = 1 - Math.pow(1 - u, 3);
      N3.textContent = String(Math.round(49 * e));
      NUM.style.transformOrigin = '0% 70%'; NUM.style.transform = `scale(${(0.86 + 0.14 * e).toFixed(4)})`;
      const pu = t - (M.proof + 0.87), ps = pu < 0 ? 0 : spring(pu, 'snappy');
      PCT.style.display = 'inline-block'; PCT.style.opacity = pu < 0 ? '0' : '1'; PCT.style.transform = `scale(${(0.5 + 0.5 * ps).toFixed(4)})`; PCT.style.transformOrigin = '0% 80%';
      $('s3-plate').style.transform = `scale(${(1.06 + 0.04 * clamp((t - M.proof) / 5.4)).toFixed(4)})`;
      $('s3-glow').style.opacity = f2(0.7 + 0.25 * Math.sin(t * 1.7));
    }
    // ---- F3 → F4 light sweep (overexposes into the floor; swap ON the bar)
    if (t >= SWEEP && t < SWEEP + 0.96) {
      const a = t - SWEEP;
      if (a < 0.38) { const k = in2(a / 0.38); LIGHT.style.opacity = f2(k); LIGHT.style.transform = `translate(${f2(lerp(-0.55 * W, 0, k))}px, ${f2(lerp(-0.3 * H, 0, k))}px) scale(${f2(lerp(0.85, 1, k))})`; }
      else { const k = out3((a - 0.38) / 0.58); LIGHT.style.opacity = f2(1 - k); LIGHT.style.transform = `translate(${f2(lerp(0, 0.5 * W, k))}px, ${f2(lerp(0, 0.28 * H, k))}px) scale(${f2(lerp(1, 1.1, k))})`; }
      S.s3.style.filter = `brightness(${f2(1 + 0.85 * in2(clamp((a - 0.02) / 0.34)))})`;
      S.s4.style.filter = `brightness(${f2(1.85 - 0.85 * out3(clamp((a - 0.36) / 0.6)))})`;
    } else { LIGHT.style.opacity = '0'; S.s3.style.filter = 'none'; S.s4.style.filter = 'none'; }

    // ---- F4: floor dolly, footprints, stickers, push through the T-mark
    if (on.s4) {
      const dolly = 1 + 0.1 * clamp((t - M.footprints) / (PUSH0 - M.footprints)); let push = 1, blur = 0;
      if (t >= PUSH0) { const u = (t - PUSH0) / (M.slate - PUSH0); push = Math.exp(2.3 * Math.pow(u, 2.1)); blur = u > 0.45 ? 0.3 + 9 * in2((u - 0.45) / 0.55) : 0; }
      stage.style.transform = `scale(${(dolly * push).toFixed(4)})`; F.s4.style.transform = push > 1 ? `scale(${push.toFixed(4)})` : 'none';
      stage.style.filter = blur ? `blur(${f2(blur)}px)` : 'none'; F.s4.style.filter = stage.style.filter;
      feet.forEach((f, i) => {
        const a = t - f.t;
        if (a < -0.16) { f.el.style.opacity = '0'; if (f.tag) f.tag.style.opacity = '0'; return; }
        const d = clamp((a + 0.16) / 0.16), drop = 1 - out3(d);               // the foot presses down onto the floor
        const later = feet.filter((g) => t >= g.t && g.t > f.t).length;         // steps landed after this one
        const op = Math.min(clamp((a + 0.16) / 0.03), later >= 2 ? 0.42 + 0.58 * Math.exp(-(later - 1) * 0.9) : 1);
        const glow = a >= 0 ? Math.exp(-a / 0.45) : 0;
        f.el.style.opacity = f2(op);
        f.el.style.transform = `rotate(${f2(f.ang)}deg) translateY(${f2(-40 * drop)}px) scale(${(1 + 0.16 * drop).toFixed(4)})`;
        f.el.style.filter = glow > 0.02 ? `drop-shadow(0 0 ${f2(4 + 16 * glow)}px rgba(255,70,60,${f2(0.85 * glow)}))` : 'none';
        if (f.tag) {
          const k = a < 0 ? 0 : spring(a, 'snappy');
          f.tag.style.opacity = a < 0 ? '0' : f2(Math.min(1, a / 0.05));
          f.tag.style.transform = `translate(${f.shift}, -100%) rotateX(${-FL.tilt}deg) scale(${(0.55 + 0.45 * k).toFixed(4)})`;
        }
      });
    } else { stage.style.filter = 'none'; F.s4.style.filter = 'none'; }

    // ---- F5 → F6 cover from below (the canvas and the slate type are clipped above the incoming edge)
    if (t >= COV0 && t < COV1) {
      const e = io3((t - COV0) / (COV1 - COV0)), edge = (1 - e) * H;
      S.s6.style.transform = `translateY(${f2(edge)}px)`; F.s6.style.transform = S.s6.style.transform;
      const up = `translateY(${f2(-0.18 * e * H)}px)`; S.s5.style.transform = up; F.s5.style.transform = up; GL.style.transform = up;
      const clip = `inset(0px 0px ${f2(H - edge)}px 0px)`; GL.style.clipPath = clip; F.s5.style.clipPath = clip;
    } else if (!(t >= IRIS && t < IRIS + IRIS_D)) {
      S.s6.style.transform = 'none'; F.s6.style.transform = 'none'; S.s5.style.transform = 'none'; F.s5.style.transform = 'none'; GL.style.transform = 'none';
      GL.style.clipPath = 'none'; F.s5.style.clipPath = 'none';
    }
    // ---- F6: P4 full frame → the split (P4 pulls back into its half, P5 arrives), slow drift
    if (on.s6) {                                       // both halves from the start; the shoot half wakes up when it's named
      const z = 1.02 + 0.05 * clamp((t - M.cost) / 8), zb = 1.03 + 0.06 * io3((t - SPLIT0) / 3);
      $('s6-a').style.clipPath = inset(A_HALF); frameImg($('s6-a-plate'), A_HALF, P45.a, z, [pick(0.68, 0.8), 0.5]);
      $('s6-b').style.clipPath = inset(B_HALF); frameImg($('s6-b-plate'), B_HALF, P45.b, zb);
      $('s6-bdim').style.opacity = f2(0.84 * (1 - io3((t - SPLIT0) / (SPLIT1 - SPLIT0))));
    }

    // ---- F7–F9: chalk dust, the feet stepping into the logo, the end card breathing
    dust(t);
    if (on.s7) {
      const ES = P.END_STEPS;
      ['l', 'r'].forEach((k, i) => {
        const a = t - ES[i].t, el = FT[k];
        if (a < -0.3) { el.style.opacity = '0'; return; }
        const d = out3(clamp((a + 0.3) / 0.3));
        el.style.opacity = f2(clamp((a + 0.3) / 0.05));
        el.style.transform = `translateY(${f2((1 - d) * pick(260, 220))}px) scale(${(1 + 0.18 * (1 - d)).toFixed(4)})`;
      });
      const lg = t - M.logo, lk = lg < 0 ? 0 : spring(lg, 'heavy');
      const beat = P.BEAT, pulse = lg < 0 ? 0 : Math.exp(-((lg % beat) / 0.18));
      $('s9-logo').style.transform = `scale(${(1 + 0.035 * clamp(lg / 7) + 0.01 * lk).toFixed(4)})`;
      $('s9-logo').style.transformOrigin = '50% 50%';
      $('s9-logo').style.filter = lg < 0 ? 'none' : `drop-shadow(0 0 ${f2(6 + 10 * pulse + 18 * Math.exp(-lg / 0.5))}px rgba(255,80,70,${f2(0.35 + 0.35 * pulse)}))`;
      G9.style.opacity = f2(lg < 0 ? 0 : clamp(lg / 0.6) * (0.75 + 0.25 * Math.sin(t * 1.4)));
      $('s7-plate').style.opacity = f2(0.7 - 0.35 * clamp(lg / 1.2));
    }

    // ---- ambient: circuit motif drift, grain
    CIRC.forEach((c, i) => { if (c) c.style.transform = `translate(${f2(Math.sin(t * 0.11 + i) * 26)}px, ${f2(-t * 3.2 % 60)}px)`; });
    const fr = Math.floor(t * 60); grain.style.backgroundPosition = `${(fr * 37) % 256}px ${(fr * 91) % 256}px`;

    // ---- 16:9 captions
    if (!TALL) {
      let idx = -1; for (let i = 0; i < CAPS.length; i++) if (t >= CAPS[i].t0 && t < CAPS[i].t1) { idx = i; break; }
      if (idx !== lastCap) { CAPT.textContent = idx >= 0 ? CAPS[idx].text : ''; lastCap = idx; }
      CAP.style.opacity = idx >= 0 ? '1' : '0';
    }
  }

  // ================================================================ timeline (word rises, lifts, stickers)
  const tl = gsap.timeline({ paused: true });
  const W_ = (sel) => $$(`${sel} .wi`);
  const rise = (els, at, o = {}) => {
    tl.fromTo(els, { yPercent: 140 }, { yPercent: 0, duration: o.d || 0.62, ease: o.ease || 'expo.out', stagger: o.stagger ?? 0.07 }, at);
    return tl.fromTo(els, { opacity: 0 }, { opacity: 1, duration: 0.05, ease: 'none', stagger: o.stagger ?? 0.07 }, at);
  };
  const lift = (els, at, o = {}) => {
    const d = o.d || 0.26;
    tl.fromTo(els, { yPercent: 0 }, { yPercent: -140, duration: d, ease: 'power3.in', stagger: o.stagger ?? 0.025, immediateRender: false }, at);
    return tl.fromTo(els, { opacity: 1 }, { opacity: 0, duration: 0.04, ease: 'none', stagger: o.stagger ?? 0.025, immediateRender: false }, at + d - 0.04);
  };
  const stick = (id, at, d = 0.3) => tl.fromTo(`#${id} .box`, { scaleX: 0 }, { scaleX: 1, duration: d, ease: 'power3.out' }, at);

  // F1
  rise(W_('#s1-eye'), 0.68, { d: 0.5 });
  rise(W_('#s1-head .line:first-child'), 1.28, { stagger: 0.08 });
  rise(W_('#s1-for'), 1.62, { d: 0.7 });
  stick('s1-stk', Q.for - 0.06, 0.32);
  // F2
  rise(W_('#s2-l1'), Q.beautiful - 0.25, { stagger: 0.08 });
  rise(W_('#s2-l2'), 8.6, { stagger: 0.1 });
  stick('s2-stk', Q.empty - 0.05, 0.36);
  // F3
  rise(W_('#s3-num'), M.proof + 0.02, { d: 0.55 });
  ['s3-t1', 's3-t2', 's3-t3'].forEach((id, i) => {
    const at = [Q.edit, Q.grade, Q.soundtrack][i] - 0.05;
    tl.fromTo(`#${id}`, { opacity: 0, scale: 1.35 }, { opacity: 1, scale: 1, duration: 0.32, ease: 'back.out(2.2)' }, at);
    tl.fromTo(`#${id} .strike`, { scaleX: 0 }, { scaleX: 1, duration: 0.22, ease: 'power2.out' }, at + 0.3);
  });
  rise(W_('#s3-cap'), 12.0, { stagger: 0.12 });
  tl.fromTo('#s3-src', { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'none' }, 13.5);
  // F4
  rise(W_('#s4-head'), Q.audience1 - 0.35, { stagger: 0.07 });
  lift(W_('#s4-head'), 19.25);
  rise(W_('#s4-follow'), Q.follow - 0.06, { stagger: 0.08 });
  stick('s4-stk', Q.first - 0.05, 0.28);
  // F5
  if (TALL) rise(W_('#s5-eye'), Q.tells - 0.5, { d: 0.5 }); else rise(W_('#s5-head'), Q.tells - 0.5, { stagger: 0.12 });
  tl.fromTo('#s5-f916', { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(1.6)' }, Q.vertical);
  tl.fromTo('#s5-f916', { opacity: 1 }, { opacity: 0, duration: 0.12, ease: 'none', immediateRender: false }, Q.wide - 0.04);
  tl.fromTo('#s5-f169', { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(1.6)' }, Q.wide);
  // F6
  rise(W_('#s6-a1'), Q.paper - 0.72, { stagger: 0.07 });
  rise(W_('#s6-a2'), Q.afternoon - 0.98, { d: 0.55 });
  rise(W_('#s6-b1'), Q.change2 + 0.12, { stagger: 0.08 });
  rise(W_('#s6-b2'), Q.that2 - 0.04, { d: 0.55 });
  stick('s6-stk', Q.reshoot - 0.04, 0.3);
  lift(['#s6-a1', '#s6-a2', '#s6-b1', '#s6-b2'].flatMap(W_), Q.research2 - 0.34, { stagger: 0.015 });
  tl.fromTo('#s6-dim', { opacity: 0 }, { opacity: 0.6, duration: 0.4, ease: 'power2.out' }, Q.research2 - 0.12);
  rise(W_('#s6-fin'), Q.research2 - 0.05, { stagger: 0.14, d: 0.7 });
  stick('s6-fstk', Q.research2 + 0.62, 0.3);
  // F7–F9
  rise(W_('#s7-head'), Q.then - 0.06, { stagger: 0.12, d: 0.55 });
  stick('s7-stk', M.drop - 0.03, 0.18);
  lift(W_('#s7-head'), M.logo - 0.22);
  rise(W_('#s9-name'), M.logo + 0.05, { stagger: 0.09, d: 0.7 });
  rise(W_('#s9-tag'), Q.lets - 0.06, { stagger: 0.14 });
  rise(W_('#s9-cta'), M.outro - 0.02, { d: 0.6, ease: 'back.out(1.4)' });
  rise(W_('#s9-url'), M.outro + 0.25, { d: 0.6 });

  // ================================================================ clock: drives render(t) on every seek
  const D = TL.duration, CLK = { t: 0 };
  tl.fromTo(CLK, { t: 0 }, { t: D, duration: D, ease: 'none', onUpdate: () => render(CLK.t) }, 0);
  window.addEventListener('hf-seek', (e) => render(e.detail.time));
  render(0);
  window.__timelines['main'] = tl;
})();
