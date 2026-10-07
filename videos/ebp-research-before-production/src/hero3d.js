// The hero: a real 3D clapperboard (Three.js). A board with thickness and a chalk slate face whose WHO · HOOK · FORMAT
// fields are written in chalk ON the VO cues, two striped sticks, and a metal hinge. The top stick's angle is
// PHYS.clap(t) (src/physics.js), the same closed form the SFX are exported from. Rendered from film time only:
// window.__hero3d.render(t) is called by film.js's render(t) while a 3D shot is on screen.
// Camera: screen-space intents (film.js → window.__HERO_CFG.CAM) blended with springs, per shot:
//   F1 hook (macro → wide pull-back) · F5 slate (push per chalk field + slow orbit) · F7–F9 gap macro → clap → exit down.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const CFG = window.__HERO_CFG, { W, H } = CFG, C = CFG.CAM, PHYS = window.PHYS, TL = window.TL, M = TL.marks, Q = TL.cues;
const D2R = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const PRE = { snappy: [0.22, 0.8], default: [0.4, 0.86], heavy: [0.5, 1.0], soft: [0.75, 1.0] };
function step(tau, p = 'default') {
  if (!(tau > 0)) return 0;
  const [resp, z] = PRE[p], w = (2 * Math.PI) / resp;
  if (z < 1) { const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + ((z * w) / wd) * Math.sin(wd * tau)); }
  return 1 - Math.exp(-w * tau) * (1 + w * tau);
}
const sp = (t, t0, p) => step(t - t0, p);

// ---------------------------------------------------------------- camera intents (screen-space) → perspective camera
const KEYS = ['sx', 'sy', 'pitch', 'yaw', 'roll', 'fov'];
function mix(a, b, k) {
  const o = { T: a.T.map((v, i) => v + (b.T[i] - v) * k), spx: Math.exp(Math.log(a.spx) + (Math.log(b.spx) - Math.log(a.spx)) * k) };
  for (const key of KEYS) o[key] = (a[key] || 0) + ((b[key] || 0) - (a[key] || 0)) * k;
  return o;
}
function chain(t, base, keys) {           // base, then [t0, target, preset] springs superposed (velocity carries)
  const cur = { T: base.T.slice(), spx: Math.log(base.spx) }; for (const k of KEYS) cur[k] = base[k] || 0;
  let prev = base;
  for (const [t0, st, p] of keys) {
    const k = sp(t, t0, p);
    for (let i = 0; i < 3; i++) cur.T[i] += (st.T[i] - prev.T[i]) * k;
    cur.spx += (Math.log(st.spx) - Math.log(prev.spx)) * k;
    for (const key of KEYS) cur[key] += ((st[key] || 0) - (prev[key] || 0)) * k;
    prev = st;
  }
  cur.spx = Math.exp(cur.spx); return cur;
}
function applyCam(cam, s) {
  cam.fov = s.fov || 30;
  const d = H / (2 * Math.tan((cam.fov * D2R) / 2) * s.spx), p = s.pitch * D2R, y = s.yaw * D2R;
  cam.position.set(s.T[0] + d * Math.sin(y) * Math.cos(p), s.T[1] + d * Math.sin(p), s.T[2] + d * Math.cos(y) * Math.cos(p));
  cam.up.set(Math.sin((s.roll || 0) * D2R), Math.cos((s.roll || 0) * D2R), 0);
  cam.lookAt(s.T[0], s.T[1], s.T[2]);
  cam.setViewOffset(W, H, W / 2 - s.sx, H / 2 - s.sy, W, H);
  cam.near = Math.max(0.01, d * 0.05); cam.far = d * 8 + 20; cam.updateProjectionMatrix();
}
// seeded shake after the impact (sum of sines, decays in ~0.25 s)
const shake = (t) => { const x = t - M.drop; if (x < 0 || x > 0.5) return [0, 0, 0]; const e = Math.exp(-x / 0.09);
  return [e * 16 * Math.sin(x * 97 + 0.4), e * 22 * Math.sin(x * 83 + 1.9), e * 1.4 * Math.sin(x * 71 + 0.8)]; };

// camera state for film time t (one story per 3D shot; the shots are separated by cuts)
function camAt(t) {
  let c;
  if (t < 12) {                                                     // F1: macro → wide pull-back (log space), slow orbit
    const u = clamp(t / 2.6), lam = 1 - Math.pow(1 - u, 3.2);
    c = mix(C.macro, C.f1, lam); c.yaw += 4 * Math.sin(t * 0.42); c.pitch += 1.5 * Math.sin(t * 0.31);
  } else if (t < 36) {                                              // F5: the slate fills — one push per chalk field
    c = chain(t, C.slateIn, [[M.slate, C.slate, 'heavy'], [Q.who - 0.1, C.slate1, 'soft'], [Q.hooks - 0.1, C.slate2, 'soft'], [Q.vertical - 0.1, C.slate3, 'soft']]);
    c.yaw += 3 * Math.sin((t - M.slate) * 0.5);
  } else {                                                          // F7–F9: gap macro (creeping in) → clap → pull back → exit down
    const pre = clamp((t - M.gap) / (M.drop - M.gap));
    const base = { ...C.gap, spx: C.gap.spx * (1 + 0.07 * pre * pre) };
    c = chain(t, base, [[M.drop, C.clap, 'heavy'], [M.drop + 0.62, C.exit, 'default']]);
    const [dx, dy, dr] = shake(t); c.sx += dx; c.sy += dy; c.roll += dr;
  }
  return c;
}

// ---------------------------------------------------------------- stage
const canvas = document.getElementById('gl');
canvas.width = W; canvas.height = H;
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping; renderer.setClearColor(0x000000, 0);
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
const camera = new THREE.PerspectiveCamera(30, W / H, 0.02, 60);
scene.add(new THREE.AmbientLight(0xffffff, 0.32));
const key = new THREE.DirectionalLight(0xfff0dc, 1.7); key.position.set(-2.4, 3.2, 4.4); scene.add(key);
const rim = new THREE.DirectionalLight(0xd6e2ff, 1.1); rim.position.set(3.2, 1.8, -2.0); scene.add(rim);
const red = new THREE.DirectionalLight(0xff3a2a, 0.9); red.position.set(-3.5, -0.5, -2.5); scene.add(red);     // brand-red kicker

// readiness: async work bumps `pending`; at 0 the first frame is drawn and the runtime hold resolves
let pending = 0;
function ready() { render(window.__lastT || 0); window.__hero3dReady && window.__hero3dReady(); }
const done = () => { if (--pending === 0) ready(); };
const maxAniso = renderer.capabilities.getMaxAnisotropy();
function texFrom(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; return t; }
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// ---------------------------------------------------------------- slate face (chalk)
const FW = 2048, FH = 1696;
const FIELDS = [                                                   // label, chalk value, cue time, write duration
  { label: 'WHO', value: 'who you cast', at: Q.who, d: 0.55 },
  { label: 'HOOK', value: 'the first 3 seconds', at: Q.hooks, d: 0.6 },
  { label: 'FORMAT', value: '9:16  or  16:9', at: Q.vertical, d: 0.75 },
];
const ROWS = [[56, 316], [316, 776], [776, 1236], [1236, 1640]];   // y bands: top strip + three field rows
const LABEL_W = 600;
const base = document.createElement('canvas'); base.width = FW; base.height = FH;
const chalkLayer = FIELDS.map(() => { const c = document.createElement('canvas'); c.width = FW; c.height = FH; return c; });
const face = document.createElement('canvas'); face.width = FW; face.height = FH;
const faceTex = texFrom(face);

function drawBase() {
  const x = base.getContext('2d'), r = rng(11);
  x.fillStyle = '#121212'; x.fillRect(0, 0, FW, FH);
  for (let i = 0; i < 1400; i++) {                                 // old chalk dust and smudges
    const a = r() * 0.018, px = r() * FW, py = r() * FH, s = 20 + r() * 160;
    const g = x.createRadialGradient(px, py, 0, px, py, s); g.addColorStop(0, `rgba(230,230,225,${a})`); g.addColorStop(1, 'rgba(230,230,225,0)');
    x.fillStyle = g; x.fillRect(px - s, py - s, s * 2, s * 2);
  }
  x.strokeStyle = 'rgba(237,237,237,0.86)'; x.lineWidth = 7; x.lineCap = 'round';
  x.strokeRect(56, 56, FW - 112, FH - 112);
  for (const [a] of ROWS.slice(1)) { x.beginPath(); x.moveTo(56, a); x.lineTo(FW - 56, a); x.stroke(); }
  x.beginPath(); x.moveTo(56 + LABEL_W, ROWS[1][0]); x.lineTo(56 + LABEL_W, FH - 56); x.stroke();
  for (const fx of [56 + (FW - 112) / 3, 56 + 2 * (FW - 112) / 3]) { x.beginPath(); x.moveTo(fx, 56); x.lineTo(fx, ROWS[0][1]); x.stroke(); }
  x.fillStyle = 'rgba(237,237,237,0.92)'; x.textBaseline = 'alphabetic';
  x.font = '600 58px UI, sans-serif';
  ['ROLL', 'SCENE', 'TAKE'].forEach((s, i) => x.fillText(s, 96 + i * (FW - 112) / 3, 140));
  x.font = '700 124px Display, sans-serif';
  FIELDS.forEach((f, i) => { const [a, b] = ROWS[i + 1]; x.fillText(f.label, 100, (a + b) / 2 + 44); });
  // the strip's numbers are already chalked in
  x.font = '700 150px Chalk, cursive'; x.fillStyle = 'rgba(240,240,236,0.9)';
  ['01', '1', '1'].forEach((s, i) => x.fillText(s, 300 + i * (FW - 112) / 3, 268));
  chalkify(x, 0, 160, FW, 150, 3);
}
function chalkify(x, x0, y0, w, h, seed) {                         // knock speckles out of whatever chalk sits in a band
  const r = rng(seed); x.save(); x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < w * h / 260; i++) { x.fillStyle = `rgba(0,0,0,${0.35 + r() * 0.65})`; x.fillRect(x0 + r() * w, y0 + r() * h, 1 + r() * 4, 1 + r() * 3); }
  x.restore();
}
function drawChalk() {
  FIELDS.forEach((f, i) => {
    const x = chalkLayer[i].getContext('2d'), [a, b] = ROWS[i + 1];
    x.clearRect(0, 0, FW, FH); x.font = '700 168px Chalk, cursive'; x.textBaseline = 'alphabetic';
    const r = rng(40 + i);
    for (let k = 0; k < 3; k++) {                                  // three slightly offset passes = a chalk stroke's width
      x.fillStyle = `rgba(242,242,238,${0.55 + 0.15 * k})`; x.fillText(f.value, 56 + LABEL_W + 70 + (r() - 0.5) * 3, (a + b) / 2 + 58 + (r() - 0.5) * 3);
    }
    chalkify(x, 56 + LABEL_W, a, FW - LABEL_W - 112, b - a, 90 + i);
  });
}
let lastSig = '';
function updateFace(t) {
  const prog = FIELDS.map((f) => clamp((t - f.at + 0.04) / f.d));
  const sig = prog.map((p) => p.toFixed(3)).join(',');
  if (sig === lastSig) return; lastSig = sig;
  const x = face.getContext('2d'); x.drawImage(base, 0, 0);
  FIELDS.forEach((f, i) => {
    const p = prog[i]; if (p <= 0) return;
    const [a, b] = ROWS[i + 1], x0 = 56 + LABEL_W + 40, ww = (FW - 112 - LABEL_W - 40) * (1 - Math.pow(1 - p, 1.6));
    x.save(); x.beginPath(); x.rect(x0, a, ww + 30, b - a); x.clip(); x.drawImage(chalkLayer[i], 0, 0); x.restore();
  });
  faceTex.needsUpdate = true;
}

// ---------------------------------------------------------------- stick stripes
function stripes(flip) {
  const c = document.createElement('canvas'); c.width = 1536; c.height = 200; const x = c.getContext('2d');
  x.fillStyle = '#ececea'; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = '#121212';
  for (let i = -1; i < 8; i++) {
    const x0 = i * 220 + 40, s = flip ? -1 : 1;
    x.beginPath(); x.moveTo(x0, 0); x.lineTo(x0 + 110, 0); x.lineTo(x0 + 110 + 120 * s, 200); x.lineTo(x0 + 120 * s, 200); x.closePath(); x.fill();
  }
  const r = rng(flip ? 7 : 5); x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(0,0,0,${r() * 0.25})`; x.fillRect(r() * 1536, r() * 200, 1 + r() * 6, 1 + r() * 2); }
  x.globalCompositeOperation = 'destination-over'; x.fillStyle = '#9c9c98'; x.fillRect(0, 0, 1536, 200);
  return texFrom(c);
}

// ---------------------------------------------------------------- build the clapperboard
const BW = 3.0, BH = 2.5, BD = 0.1, SH = 0.42, SD = 0.12, PIV = [-BW / 2, 0.47, 0];
const mat = {
  board: new THREE.MeshPhysicalMaterial({ color: 0x0f0f0f, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.25 }),
  face: new THREE.MeshPhysicalMaterial({ map: faceTex, roughness: 0.7, clearcoat: 0.12, clearcoatRoughness: 0.5, envMapIntensity: 0.22 }),
  stick: new THREE.MeshPhysicalMaterial({ color: 0x151515, roughness: 0.34, clearcoat: 0.85, clearcoatRoughness: 0.18 }),
  metal: new THREE.MeshPhysicalMaterial({ color: 0xbdbdbd, metalness: 1, roughness: 0.24, envMapIntensity: 1.1 }),
  hingePlate: new THREE.MeshPhysicalMaterial({ color: 0x3a3a3a, metalness: 1, roughness: 0.38, envMapIntensity: 0.8 }),
};
const hero = new THREE.Group(); scene.add(hero);
const board = new THREE.Mesh(new RoundedBoxGeometry(BW, BH, BD, 4, 0.04), mat.board); board.position.set(0, -BH / 2, 0); hero.add(board);
const facePlane = new THREE.Mesh(new THREE.PlaneGeometry(BW - 0.08, BH - 0.08), mat.face); facePlane.position.set(0, -BH / 2, BD / 2 + 0.002); hero.add(facePlane);
function stick(flip) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(BW, SH, SD, 4, 0.03), mat.stick); g.add(body);
  const fm = new THREE.MeshPhysicalMaterial({ map: stripes(flip), roughness: 0.32, clearcoat: 0.9, clearcoatRoughness: 0.15, envMapIntensity: 0.5 });
  const f = new THREE.Mesh(new THREE.PlaneGeometry(BW - 0.06, SH - 0.06), fm); f.position.z = SD / 2 + 0.002; g.add(f);
  return g;
}
const low = stick(false); low.position.set(0, 0.02 + SH / 2, 0); hero.add(low);
const hinge = new THREE.Group(); hinge.position.set(...PIV); hero.add(hinge);       // the top stick turns about the hinge
const top = stick(true); top.position.set(BW / 2, SH / 2 + 0.005, 0); hinge.add(top);
const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, SD + 0.18, 40), mat.metal); pin.rotation.x = Math.PI / 2; pin.position.set(0.09, 0, 0); hinge.add(pin);
const plate = new THREE.Mesh(new RoundedBoxGeometry(0.24, 0.4, 0.02, 2, 0.01), mat.hingePlate); plate.position.set(PIV[0] + 0.16, 0.47, SD / 2 + 0.012); hero.add(plate);

pending++;
Promise.all(['600 58px UI', '700 124px Display', '700 150px Chalk'].map((f) => document.fonts.load(f))).then(() => document.fonts.ready).then(() => {
  drawBase(); drawChalk(); lastSig = ''; updateFace(window.__lastT || 0); done();
});

// ---------------------------------------------------------------- projection helpers
const PTS = { slate: new THREE.Vector3(0, -BH / 2, BD / 2), center: new THREE.Vector3(0, -0.8, 0), tip: new THREE.Vector3(BW, 0, SD / 2) };
const _v = new THREE.Vector3();
function project(name) {
  if (name === 'tip') { top.updateMatrixWorld(true); _v.set(BW / 2, -SH / 2, SD / 2).applyMatrix4(top.matrixWorld); }
  else { hero.updateMatrixWorld(true); _v.copy(PTS[name]).applyMatrix4(hero.matrixWorld); }
  _v.project(camera); return { x: (_v.x + 1) * W / 2, y: (1 - _v.y) * H / 2 };
}
function pose(t) {
  applyCam(camera, camAt(t)); camera.updateMatrixWorld(true);       // projections between renders need a fresh view matrix
  hinge.rotation.z = (PHYS ? PHYS.clap(t) : 6) * D2R;
}

// ---------------------------------------------------------------- per frame
function render(t) {
  pose(t); updateFace(t);
  renderer.render(scene, camera);
  window.__hero3d.screen = project('slate'); window.__hero3d.tip = project('tip');
}
function screenAt(t, name = 'slate') { pose(t); const p = project(name); pose(window.__lastT || 0); return p; }
function clear() { renderer.clear(); }
window.__hero3d = { render, screenAt, clear, screen: null, tip: null };
render(window.__lastT || 0);
if (pending === 0) ready();
