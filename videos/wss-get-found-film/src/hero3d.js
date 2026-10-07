// Two Three.js stages, rendered from film time only (window.__hero3d.render(t), called by film.js's clock and hf-seek):
//   #gl1 (full frame, shots 4–5): eight green arcs close into a glossy spring-green torus around the question, a light
//        sweeps round it, then it ripples into concentric rings while the camera dollies through (the brand reveal).
//   #gl2 (the editor's preview pane, shot 13): five glossy bars rise, the last one spring green.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const F = (f) => f / 30;
const D2R = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const oC = (x) => 1 - Math.pow(1 - clamp(x), 3);
const PRE = { snappy: [0.22, 0.8], default: [0.4, 0.86], heavy: [0.5, 1.0] };
function step(tau, p = 'default') {
  if (!(tau > 0)) return 0;
  const [resp, z] = PRE[p], w = (2 * Math.PI) / resp;
  if (z < 1) { const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + ((z * w) / wd) * Math.sin(wd * tau)); }
  return 1 - Math.exp(-w * tau) * (1 + w * tau);
}
function makeRenderer(canvas, w, h) {
  const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  r.setPixelRatio(1); r.setSize(w, h, false);
  r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.NeutralToneMapping; r.setClearColor(0x000000, 0);
  return r;
}
const SPRING = 0x92c131, SLATE = 0x5a5e64;

// ================================================================ stage 1: the ring
const W = 1920, H = 1080;
const r1 = makeRenderer(document.getElementById('gl1'), W, H);
const sc1 = new THREE.Scene();
sc1.environment = new THREE.PMREMGenerator(r1).fromScene(new RoomEnvironment(), 0.04).texture;
const cam1 = new THREE.PerspectiveCamera(30, W / H, 0.01, 100);
sc1.add(new THREE.AmbientLight(0xffffff, 0.35));
const key1 = new THREE.DirectionalLight(0xfff4e6, 1.7); key1.position.set(-2.4, 3.2, 4.5); sc1.add(key1);
const rim1 = new THREE.DirectionalLight(0xe6f0ff, 1.1); rim1.position.set(3, 1.5, -2); sc1.add(rim1);
const sweep = new THREE.PointLight(0xffffff, 0, 6, 1.6); sc1.add(sweep);
const lacquer = new THREE.MeshPhysicalMaterial({ color: SPRING, roughness: 0.24, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.07, envMapIntensity: 0.45 });
const ringG = new THREE.Group(); sc1.add(ringG);
const TUBE = 0.115;
const torus = new THREE.Mesh(new THREE.TorusGeometry(1, TUBE, 48, 256), lacquer); ringG.add(torus);
// the closing dashes: eight arcs at six pre-built lengths (no geometry rebuilt per frame)
const ARCS = [16, 24, 32, 39, 44, 46.5].map((deg) => new THREE.TorusGeometry(1, TUBE, 40, 48, deg * D2R));
const dashes = Array.from({ length: 8 }, () => { const m = new THREE.Mesh(ARCS[0], lacquer); ringG.add(m); return m; });
// dash centres match the HTML dots' ring in film.js (screen angles −π + (k + ½)·π/4, rotated by 10°), y flipped for 3D
const DASH_A = Array.from({ length: 8 }, (_, k) => -(-Math.PI + (k + 0.5) * (Math.PI / 4) + 10 * D2R));
// ripples
const rippleMat = Array.from({ length: 5 }, () => lacquer.clone());
rippleMat.forEach((m) => { m.transparent = true; });
const ripples = rippleMat.map((m, k) => { const r = new THREE.Mesh(new THREE.TorusGeometry(1, TUBE * (0.75 - k * 0.08), 32, 200), m); ringG.add(r); return r; });

function applyCam(cam, s, w, h) {   // world target T at screen (sx, sy), spx pixels per world unit
  cam.fov = s.fov;
  const d = h / (2 * Math.tan((s.fov * D2R) / 2) * s.spx), p = s.pitch * D2R, y = s.yaw * D2R;
  cam.position.set(s.T[0] + d * Math.sin(y) * Math.cos(p), s.T[1] + d * Math.sin(p), s.T[2] + d * Math.cos(y) * Math.cos(p));
  cam.up.set(0, 1, 0); cam.lookAt(s.T[0], s.T[1], s.T[2]);
  cam.setViewOffset(w, h, w / 2 - s.sx, h / 2 - s.sy, w, h);
  cam.near = Math.max(0.005, d * 0.02); cam.far = d * 10 + 10; cam.updateProjectionMatrix();
}

function renderRing(t) {
  const spx = window.__ringSpx ? window.__ringSpx(t) : 262;
  applyCam(cam1, { T: [0, 0, 0], sx: 960, sy: 540, spx, pitch: 2.5 * Math.sin(t * 1.3), yaw: 3.5 * Math.sin(t * 0.9), fov: 30 }, W, H);
  ringG.rotation.set(0.05 * Math.sin(t * 1.7), 0.06 * Math.sin(t * 1.1), 0);
  // dashes close into the ring over f233–f236, then the whole torus takes over
  const closing = t < F(237);
  torus.visible = !closing;
  const lvl = Math.round(5 * oC(seg(t, F(233), F(236.5))));
  dashes.forEach((m, k) => {
    m.visible = closing;
    if (!closing) return;
    m.geometry = ARCS[lvl];
    const arc = [16, 24, 32, 39, 44, 46.5][lvl] * D2R;
    m.rotation.set(0, 0, DASH_A[k] - arc / 2);
  });
  // a light orbits the ring: the specular sweep
  const a = (t - F(238)) * 5.2;
  sweep.position.set(Math.cos(a) * 1.45, Math.sin(a) * 1.45, 0.9);
  sweep.intensity = 9 * seg(t, F(238), F(242)) * (1 - seg(t, F(258), F(264)));
  // ripples: concentric copies swell outward while the camera dollies through
  ripples.forEach((r, k) => {
    const t0 = F(259) + k * 0.045, u = seg(t, t0, t0 + 0.6);
    r.visible = t >= t0;
    const s = 1 + (1.2 + k * 0.55) * oC(u);
    r.scale.set(s, s, 1);
    r.position.z = -0.12 * k * oC(u);
    rippleMat[k].opacity = 1 - Math.pow(u, 2.2) * 0.5;
  });
  torus.scale.setScalar(1 + 0.12 * oC(seg(t, F(259), F(275))));
  r1.render(sc1, cam1);
}

// ================================================================ stage 2: growth bars in the editor's preview pane
const W2 = 420, H2 = 560;
const r2 = makeRenderer(document.getElementById('gl2'), W2, H2);
const sc2 = new THREE.Scene();
sc2.environment = new THREE.PMREMGenerator(r2).fromScene(new RoomEnvironment(), 0.04).texture;
const cam2 = new THREE.PerspectiveCamera(30, W2 / H2, 0.05, 50);
sc2.add(new THREE.AmbientLight(0xffffff, 0.4));
const key2 = new THREE.DirectionalLight(0xfff4e6, 1.8); key2.position.set(-2, 4, 3); sc2.add(key2);
const rim2 = new THREE.DirectionalLight(0xdfe9ff, 1.0); rim2.position.set(3, 2, -3); sc2.add(rim2);
const slateMat = new THREE.MeshPhysicalMaterial({ color: SLATE, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.2, envMapIntensity: 0.6 });
const greenMat = new THREE.MeshPhysicalMaterial({ color: SPRING, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 0.5 });
const baseMat = new THREE.MeshPhysicalMaterial({ color: 0x24292e, roughness: 0.6, clearcoat: 0.3, envMapIntensity: 0.4 });
const barsG = new THREE.Group(); sc2.add(barsG);
const base = new THREE.Mesh(new RoundedBoxGeometry(3.3, 0.08, 1.15, 4, 0.03), baseMat); base.position.y = -0.04; barsG.add(base);
const HEIGHTS = [0.8, 1.25, 1.7, 2.2, 3.0];
const bars = HEIGHTS.map((h, k) => {
  const g = new RoundedBoxGeometry(0.46, h, 0.46, 5, 0.06); g.translate(0, h / 2, 0);
  const m = new THREE.Mesh(g, k === 4 ? greenMat : slateMat); m.position.x = -1.28 + k * 0.64; barsG.add(m); return m;
});

function renderBars(t) {
  const yaw = (30 + 5 * Math.sin((t - F(591)) * 0.8)) * D2R, pitch = 22 * D2R, dist = 8.2;
  cam2.position.set(Math.sin(yaw) * Math.cos(pitch) * dist, 1.35 + Math.sin(pitch) * dist, Math.cos(yaw) * Math.cos(pitch) * dist);
  cam2.lookAt(0.1, 1.25, 0);
  bars.forEach((b, k) => {
    const e = step(t - (F(597) + k * 0.09), 'default');
    b.scale.y = Math.max(0.02, e);
  });
  r2.render(sc2, cam2);
}

// ================================================================ frame
function render(t) {
  if (t >= F(233) && t < F(286)) renderRing(t);
  if (t >= F(591) && t < F(632)) renderBars(t);
}
window.__hero3d = { render };
render(window.__lastT || 0);
if (window.__hero3dReady) window.__hero3dReady();
