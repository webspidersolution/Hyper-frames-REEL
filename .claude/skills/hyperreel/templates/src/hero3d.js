// hyperreel starter hero: a thick lacquered medallion with a printed face (procedural texture, no assets needed),
// a chrome bezel with studs, glow sprites, a macro → wide pull-back, a spin that stops ON the drop (PHYS), and a slow
// orbit. Rendered from film time only: window.__hero3d.render(t) (called by film.js's clock and hf-seek).
// Replace buildHero() with the real object (see references/three-hero.md and examples/buildfest-wheel/wheel3d.js).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const CFG = window.__HERO_CFG, { W, H } = CFG, C = CFG.CAM, PHYS = window.PHYS;
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
function chain(t, base, prev0, keys) {     // base, then [t0, target, preset] springs superposed (velocity carries)
  const cur = { T: base.T.slice(), spx: Math.log(base.spx) }; for (const k of KEYS) cur[k] = base[k] || 0;
  let prev = prev0;
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
  cam.fov = s.fov;
  const d = H / (2 * Math.tan((s.fov * D2R) / 2) * s.spx), p = s.pitch * D2R, y = s.yaw * D2R;
  cam.position.set(s.T[0] + d * Math.sin(y) * Math.cos(p), s.T[1] + d * Math.sin(p), s.T[2] + d * Math.cos(y) * Math.cos(p));
  cam.up.set(Math.sin((s.roll || 0) * D2R), Math.cos((s.roll || 0) * D2R), 0);
  cam.lookAt(s.T[0], s.T[1], s.T[2]);
  cam.setViewOffset(W, H, W / 2 - s.sx, H / 2 - s.sy, W, H);
  cam.near = Math.max(0.01, d * 0.05); cam.far = d * 8 + 10; cam.updateProjectionMatrix();
}

// ---------------------------------------------------------------- stage
const canvas = document.getElementById('s1-gl');
canvas.width = W; canvas.height = H;
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping; renderer.setClearColor(0x000000, 0);
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
const camera = new THREE.PerspectiveCamera(30, W / H, 0.02, 60);
scene.add(new THREE.AmbientLight(0xffffff, 0.45));
const key = new THREE.DirectionalLight(0xfff1e2, 1.6); key.position.set(-2.2, 3, 4.2); scene.add(key);
const rim = new THREE.DirectionalLight(0xd8e4ff, 1.0); rim.position.set(3, 1.6, -1.5); scene.add(rim);

// readiness: every async asset bumps `pending`; when it reaches 0 the first frame is drawn and the runtime hold resolves
let pending = 0;
function ready() { render(window.__lastT || 0); window.__hero3dReady && window.__hero3dReady(); }
const done = () => { if (--pending === 0) ready(); };
function loadTex(url) {                   // real artwork: sRGB + max anisotropy
  pending++;
  const t = new THREE.TextureLoader().load(url, done, undefined, done);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t;
}
function canvasTex(draw, size = 2048) {   // procedural texture; redrawn once the brand fonts are loaded
  const c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  pending++; document.fonts.ready.then(() => { draw(c.getContext('2d'), size); t.needsUpdate = true; done(); });
  return t;
}
function planarUV(geo, R) { const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) / R + 1) / 2, (p.getY(i) / R + 1) / 2); uv.needsUpdate = true; return geo; }

function buildHero() {
  const g = new THREE.Group(), spin = new THREE.Group(); g.add(spin);
  const face = canvasTex((x, s) => {
    const c = s / 2; x.fillStyle = '#16151b'; x.beginPath(); x.arc(c, c, c, 0, 7); x.fill();
    for (let i = 0; i < 12; i++) { x.fillStyle = i % 2 ? '#24222c' : '#ff4b2b'; x.beginPath(); x.moveTo(c, c);
      x.arc(c, c, c * 0.93, (i / 12) * Math.PI * 2, ((i + 1) / 12) * Math.PI * 2); x.fill(); }
    x.fillStyle = '#0d0d10'; x.beginPath(); x.arc(c, c, c * 0.42, 0, 7); x.fill();
    x.fillStyle = '#f2efe9'; x.font = `800 ${s * 0.09}px Display, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('HYPERREEL', c, c);
  });
  const faceMesh = new THREE.Mesh(planarUV(new THREE.CircleGeometry(1, 256), 1),
    new THREE.MeshPhysicalMaterial({ map: face, roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 0.6 }));
  spin.add(faceMesh);
  const lacquer = new THREE.MeshPhysicalMaterial({ color: 0xff4b2b, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 });
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.09, 256, 1, true), lacquer);
  wall.rotation.x = Math.PI / 2; wall.position.z = -0.045; spin.add(wall);
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.035, 24, 256), new THREE.MeshPhysicalMaterial({ color: 0xeeeeee, metalness: 1, roughness: 0.18 }));
  spin.add(bezel);
  const chrome = new THREE.MeshPhysicalMaterial({ color: 0xf2f2f2, metalness: 1, roughness: 0.16, envMapIntensity: 1.4 });
  for (let k = 0; k < 30; k++) { const a = (90 - k * 12) * D2R, s = new THREE.Mesh(new THREE.SphereGeometry(0.016, 20, 14), chrome);
    s.position.set(0.965 * Math.cos(a), 0.965 * Math.sin(a), 0.01); spin.add(s); }
  // pointer: a small extruded pin at 12 o'clock (does not spin)
  const pin = new THREE.Shape(); pin.moveTo(0, 0.9); pin.lineTo(-0.09, 1.12); pin.absarc(0, 1.16, 0.1, Math.PI * 1.2, Math.PI * -0.2, true); pin.lineTo(0, 0.9);
  const pointer = new THREE.Mesh(new THREE.ExtrudeGeometry(pin, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.008, bevelSegments: 4 }), lacquer);
  pointer.position.z = 0.05; g.add(pointer);
  return { g, spin, pointer };
}
const hero = buildHero(); scene.add(hero.g);

// ---------------------------------------------------------------- per frame
const _v = new THREE.Vector3(), _w = new THREE.Vector3();
function render(t) {
  // camera: macro on the pointer → log-scale pull back by 3.6 s → slow orbit → end framing
  const u = clamp(t / 3.6), lam = 1 - Math.pow(1 - u, 3.2);
  // keep the hero where the iris opens (film.js iris() uses the 'front' framing); add camera keys with chain() as needed:
  //   chain(t, base, C.front, [[t0, C.someIntent, 'heavy'], ...])
  const c = chain(t, mix(C.macro, C.front, lam), C.front, []);
  c.yaw += 6 * Math.sin(t * 0.35); c.pitch += 2 * Math.sin(t * 0.27);
  applyCam(camera, c);
  hero.spin.rotation.z = -(PHYS ? PHYS.angle(t) : t * 40) * D2R;          // CSS-style clockwise degrees → Three.js
  renderer.render(scene, camera);
  hero.g.updateMatrixWorld(); _v.set(0, 0, 0).applyMatrix4(hero.g.matrixWorld).project(camera);
  window.__hero3d.screen = { x: (_v.x + 1) * W / 2, y: (1 - _v.y) * H / 2 };
}
window.__hero3d = { render };
render(window.__lastT || 0);
if (pending === 0) ready();
