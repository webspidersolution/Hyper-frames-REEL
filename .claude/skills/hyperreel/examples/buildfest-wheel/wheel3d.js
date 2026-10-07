// Three.js hero wheel — the real Figma wheel art on a physical 3D wheel (ring tiers with thickness, glossy rim,
// chrome pegs, bulb glows, extruded pointer). Two stages: s1 (hook macro → rising sun → exploded rings) and
// s2 (spin → landing → win → offer). Rendered from film time only: window.__wheel3d.render(t) is called by the
// composition clock and on hf-seek. Shares the spin physics with the sound (window.SPIN).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const SP = window.SPIN, CFG = window.__WHEEL_CFG;
const { W, H, TALL } = CFG;
const D2R = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, x) => a + (b - a) * x;
const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const PRE = { snappy: [0.22, 0.8], default: [0.4, 0.86], heavy: [0.5, 1.0], soft: [0.75, 1.0] };
function step(tau, p = 'default') {
  if (!(tau > 0)) return 0;
  const [resp, z] = PRE[p], w = (2 * Math.PI) / resp;
  if (z < 1) { const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + ((z * w) / wd) * Math.sin(wd * tau)); }
  return 1 - Math.exp(-w * tau) * (1 + w * tau);
}
const sp = (t, t0, p) => step(t - t0, p);
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
function noise1(seed) { const r = mulberry32(seed), v = Array.from({ length: 256 }, () => r() * 2 - 1);
  return (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(v[i & 255], v[(i + 1) & 255], u); }; }
const NX = noise1(11), NY = noise1(29);

// ------------------------------------------------------------------ geometry constants (wheel radius = 1 = 2160 master px)
const R = { hub: 424 / 2160, inner: 1000 / 2160, middle: 1520 / 2160, outer: 2024 / 2160, peg: 1045 / 2160 };
const IMG = { hub: 428 / 2160, inner: 1004 / 2160, middle: 1524 / 2160, outer: 2028 / 2160, rim: 1.0, full: 1.0 };
const DEPTH = { rim: 0.075, ring: 0.045, hub: 0.06 };

// ------------------------------------------------------------------ textures
const loader = new THREE.TextureLoader();
function tex(url, renderer) {
  const t = loader.load(url);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}
function radialTex(stops) {     // soft round sprite / shadow textures drawn once on a canvas
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  for (const [o, col] of stops) gr.addColorStop(o, col);
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// planar UVs: a vertex at (x, y) samples the layer image that covers [-Rimg, Rimg]
function planarUV(geo, Rimg) {
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) / Rimg + 1) / 2, (p.getY(i) / Rimg + 1) / 2);
  uv.needsUpdate = true; return geo;
}
function faceMat(map) {
  return new THREE.MeshPhysicalMaterial({ map, roughness: 0.42, metalness: 0, clearcoat: 0.55, clearcoatRoughness: 0.22, envMapIntensity: 0.55 });
}
// an annulus tier: printed face, outer wall, inner wall, back
function tier(r0, r1, depth, map, Rimg, sideColor) {
  const g = new THREE.Group();
  const face = new THREE.Mesh(planarUV(new THREE.RingGeometry(r0, r1, 256, 1), Rimg), faceMat(map));
  g.add(face);
  const side = new THREE.MeshPhysicalMaterial({ color: sideColor, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 0.8 });
  const outer = new THREE.Mesh(new THREE.CylinderGeometry(r1, r1, depth, 256, 1, true), side);
  outer.rotation.x = Math.PI / 2; outer.position.z = -depth / 2; g.add(outer);
  if (r0 > 0) {
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(r0, r0, depth, 256, 1, true), side.clone());
    inner.material.side = THREE.BackSide; inner.rotation.x = Math.PI / 2; inner.position.z = -depth / 2; g.add(inner);
  }
  const back = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 128, 1), new THREE.MeshStandardMaterial({ color: 0x0b0b0d, roughness: 0.8 }));
  back.rotation.y = Math.PI; back.position.z = -depth; g.add(back);
  g.userData = { face, side, sideBase: side.color.clone() };
  return g;
}

// house-pin pointer: extruded teardrop, the real pointer art on its front cap
function pointer(renderer) {
  const head = [0, 1.176], rh = 0.14, tip = [0, 0.94];
  const dx = tip[0] - head[0], dy = tip[1] - head[1], d = Math.hypot(dx, dy), phi = Math.atan2(dy, dx), a = Math.acos(rh / d);
  const s = new THREE.Shape();
  s.moveTo(tip[0], tip[1]);
  s.lineTo(head[0] + rh * Math.cos(phi - a), head[1] + rh * Math.sin(phi - a));
  s.absarc(head[0], head[1], rh, phi - a, phi + a - 2 * Math.PI, true);
  s.lineTo(tip[0], tip[1]);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.045, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.009, bevelSegments: 5, curveSegments: 64 });
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {          // body box of pointer.png: [40,20]–[472,599] of 512×661
    const u = 40 / 512 + ((p.getX(i) + rh) / (2 * rh)) * (432 / 512);
    const v = 1 - (20 / 661 + ((1.316 - p.getY(i)) / 0.376) * (579 / 661));
    uv.setXY(i, u, v);
  }
  const map = tex('assets/brand/pointer.png', renderer);
  const cap = new THREE.MeshPhysicalMaterial({ map, roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.15, transparent: true });
  const side = new THREE.MeshPhysicalMaterial({ color: 0xd8221f, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1, transparent: true });
  const mesh = new THREE.Mesh(geo, [cap, side]);
  mesh.position.set(0, -head[1], 0);
  const pivot = new THREE.Group(); pivot.position.set(0, head[1], 0.05); pivot.add(mesh);
  pivot.userData = { mats: [cap, side] };
  return pivot;
}

// ------------------------------------------------------------------ one stage = one canvas + renderer + wheel
function stage(canvasId, kind) {
  const canvas = document.getElementById(canvasId);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(32, W / H, 0.02, 60);
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xfff4e8, 1.55); key.position.set(-2.2, 3.0, 4.2); scene.add(key);
  const rimL = new THREE.DirectionalLight(0xdfe6ff, 0.9); rimL.position.set(3.0, 1.6, -1.5); scene.add(rimL);
  const flash = new THREE.PointLight(0xffc89a, 0, 6, 1.6); flash.position.set(0, 0.2, 1.4); scene.add(flash);

  const world = new THREE.Group(); scene.add(world);           // the standee: wheel + pointer
  const spinG = new THREE.Group(); world.add(spinG);          // everything that rotates with the face
  // contact/drop shadow on an invisible backdrop
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3.0), new THREE.MeshBasicMaterial({
    map: radialTex([[0, 'rgba(96,22,0,0.7)'], [0.45, 'rgba(96,22,0,0.4)'], [1, 'rgba(96,22,0,0)']]), transparent: true, depthWrite: false }));
  shadow.position.set(0.04, -0.09, -0.16); world.add(shadow);

  const tiers = {};
  if (kind === 'rings') {
    tiers.rim = tier(R.outer, 1.0, DEPTH.rim, tex('assets/wheel/rim.png', renderer), IMG.rim, 0xd8221f);
    tiers.outer = tier(R.middle, R.outer, DEPTH.ring, tex('assets/wheel/outer.png', renderer), IMG.outer, 0x1d1e24);
    tiers.middle = tier(R.inner, R.middle, DEPTH.ring, tex('assets/wheel/middle.png', renderer), IMG.middle, 0xc9ad85);
    tiers.inner = tier(R.hub, R.inner, DEPTH.ring, tex('assets/wheel/inner.png', renderer), IMG.inner, 0x1b3383);
  } else {
    // flat stage: one printed face (spin is always aligned) + the rim wall
    tiers.face = tier(0, 1.0, DEPTH.rim, tex('assets/wheel/wheel-2160.png', renderer), IMG.full, 0xd8221f);
  }
  for (const k in tiers) spinG.add(tiers[k]);
  // raised hub cap
  const hubMap = tex('assets/wheel/hub.png', renderer);
  const hub = new THREE.Group();
  const hubTop = new THREE.Mesh(planarUV(new THREE.CircleGeometry(R.hub, 128), IMG.hub), faceMat(hubMap));
  hubTop.position.z = DEPTH.hub; hub.add(hubTop);
  const hubSide = new THREE.Mesh(new THREE.CylinderGeometry(R.hub, R.hub * 1.04, DEPTH.hub, 128, 1, true),
    new THREE.MeshPhysicalMaterial({ color: 0xd8221f, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.12 }));
  hubSide.rotation.x = Math.PI / 2; hubSide.position.z = DEPTH.hub / 2; hub.add(hubSide);
  spinG.add(hub);
  // rotational-blur overlays (aligned states only)
  const blurTex = [5, 12, 26, 52].map((d) => tex(`assets/wheel/wheel-blur-${d}.png`, renderer));
  const blurGeo = planarUV(new THREE.CircleGeometry(1.0, 256), 1.0);
  const blurA = new THREE.Mesh(blurGeo, new THREE.MeshBasicMaterial({ map: blurTex[0], transparent: true, opacity: 0, depthWrite: false }));
  const blurB = new THREE.Mesh(blurGeo, new THREE.MeshBasicMaterial({ map: blurTex[1], transparent: true, opacity: 0, depthWrite: false }));
  blurA.position.z = 0.004; blurB.position.z = 0.005; blurA.renderOrder = 2; blurB.renderOrder = 3; spinG.add(blurA, blurB);
  // pegs: chrome studs + bulb glows
  const pegG = new THREE.Group(); spinG.add(pegG);
  const chrome = new THREE.MeshPhysicalMaterial({ color: 0xf2f2f2, metalness: 1, roughness: 0.16, envMapIntensity: 1.4 });
  const glowTex = radialTex([[0, 'rgba(255,250,236,1)'], [0.18, 'rgba(255,222,170,0.95)'], [0.45, 'rgba(255,110,70,0.5)'], [1, 'rgba(249,49,47,0)']]);
  const studs = [], glows = [];
  for (let k = 0; k < 30; k++) {
    const a = (90 - k * 12) * D2R, x = R.peg * Math.cos(a), y = R.peg * Math.sin(a), big = k % 6 === 3;
    const stud = new THREE.Mesh(new THREE.SphereGeometry(big ? 0.019 : 0.014, 24, 16), chrome);
    stud.position.set(x, y, 0.004); stud.scale.z = 0.8; pegG.add(stud); studs.push(stud);
    const gm = new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
    const g = new THREE.Sprite(gm); g.position.set(x, y, 0.03); g.scale.set(0.12, 0.12, 1); g.renderOrder = 5; pegG.add(g); glows.push(g);
  }
  const lightRing = new THREE.Mesh(new THREE.RingGeometry(0.95, 0.985, 256, 1), new THREE.MeshBasicMaterial({ color: 0xffd2a8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  lightRing.position.z = 0.012; lightRing.renderOrder = 4; spinG.add(lightRing);
  // winning slice (stage 2): dim the other 288°, light the 108°–180° wedge (clockwise from 12 o'clock)
  let win = null;
  if (kind === 'flat') {
    const dim = new THREE.Mesh(new THREE.RingGeometry(0, 0.94, 128, 1, -18 * D2R, 288 * D2R), new THREE.MeshBasicMaterial({ color: 0x050507, transparent: true, opacity: 0, depthWrite: false }));
    const wedge = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.94, 96, 1, -90 * D2R, 72 * D2R), new THREE.MeshBasicMaterial({ color: 0xffe2c4, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    const edge = new THREE.Mesh(new THREE.RingGeometry(0.915, 0.95, 96, 1, -90 * D2R, 72 * D2R), new THREE.MeshBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0, depthWrite: false }));
    for (const m of [dim, wedge, edge]) { m.position.z = 0.008; m.renderOrder = 6; spinG.add(m); }
    win = { dim, wedge, edge };
  }
  const ptr = pointer(renderer); world.add(ptr);
  return { canvas, renderer, scene, camera, world, spinG, tiers, hub, blurA, blurB, blurTex, studs, glows, lightRing, win, ptr, flash, shadow };
}

// ------------------------------------------------------------------ camera: screen-space intent → perspective camera
// state: T world target, sx/sy screen px of the target, spx px per world unit at the target, pitch/yaw/roll deg, fov deg
function applyCam(cam, s) {
  cam.fov = s.fov;
  const d = H / (2 * Math.tan((s.fov * D2R) / 2) * s.spx), p = s.pitch * D2R, y = s.yaw * D2R;
  cam.position.set(s.T[0] + d * Math.sin(y) * Math.cos(p), s.T[1] + d * Math.sin(p), s.T[2] + d * Math.cos(y) * Math.cos(p));
  cam.up.set(Math.sin((s.roll || 0) * D2R), Math.cos((s.roll || 0) * D2R), 0);
  cam.lookAt(s.T[0], s.T[1], s.T[2]);
  cam.setViewOffset(W, H, W / 2 - s.sx, H / 2 - s.sy, W, H);
  cam.near = Math.max(0.01, d * 0.05); cam.far = d * 8 + 10;
  cam.updateProjectionMatrix();
}
const KEYS = ['sx', 'sy', 'pitch', 'yaw', 'roll', 'fov'];
function mix(a, b, k) {   // superpose b - a with weight k (spx in log space)
  const o = { T: a.T.map((v, i) => v + (b.T[i] - v) * k), spx: Math.exp(Math.log(a.spx) + (Math.log(b.spx) - Math.log(a.spx)) * k) };
  for (const key of KEYS) o[key] = (a[key] || 0) + ((b[key] || 0) - (a[key] || 0)) * k;
  return o;
}
function chain(t, base, prev0, keys) {   // base state, then [t0, target, preset] springs superposed (velocity-preserving)
  const cur = { T: base.T.slice(), spx: Math.log(base.spx) };
  for (const key of KEYS) cur[key] = base[key] || 0;
  let prev = prev0;
  for (const [t0, st, p] of keys) {
    const k = sp(t, t0, p);
    for (let i = 0; i < 3; i++) cur.T[i] += (st.T[i] - prev.T[i]) * k;
    cur.spx += (Math.log(st.spx) - Math.log(prev.spx)) * k;
    for (const key of KEYS) cur[key] += ((st[key] || 0) - (prev[key] || 0)) * k;
    prev = st;
  }
  cur.spx = Math.exp(cur.spx);
  return cur;
}
const C = CFG.CAM;   // per-format screen positions/scales from film.js

// ------------------------------------------------------------------ bulbs
function bulbs(S, t, mode, dim) {
  for (let k = 0; k < 30; k++) {
    let b;
    if (mode === 'marquee8') { const q = Math.floor(t / 0.25), tq = q * 0.25; b = (q + k) % 2 === 0 ? 0.42 + 0.58 * Math.exp(-(t - tq) / 0.16) : 0.14; }
    else if (mode === 'marquee4') { const q = Math.floor(t / 0.5), tq = q * 0.5; b = (q + k) % 2 === 0 ? 0.4 + 0.6 * Math.exp(-(t - tq) / 0.22) : 0.13; }
    else if (mode === 'chase') { const head = (t * 11) % 30, dd = (head - k + 30) % 30; b = 0.12 + 0.88 * Math.exp(-dd / 2.4); }
    else if (mode === 'fast') { const head = (t * 26) % 30, dd = (head - k + 30) % 30; b = 0.2 + 0.8 * Math.exp(-dd / 4); }
    else if (mode === 'flash') { const x = (((t - 22) % 0.5) + 0.5) % 0.5; b = 0.3 + 0.7 * Math.exp(-x / 0.2); }
    else b = 0.1;
    S.glows[k].material.opacity = clamp(b * dim);
  }
}
const BL = [0, 5, 12, 26, 52];
function setBlur(S, bdeg) {
  bdeg = clamp(bdeg, 0, 52);
  let i = 0; while (i < 4 && bdeg >= BL[i + 1]) i++;
  const w = i < 4 ? (bdeg - BL[i]) / (BL[i + 1] - BL[i]) : 0;
  if (i === 0) { S.blurA.material.map = S.blurTex[0]; S.blurA.material.opacity = w; S.blurB.material.opacity = 0; }
  else { S.blurA.material.map = S.blurTex[i - 1]; S.blurA.material.opacity = 1; S.blurB.material.map = S.blurTex[Math.min(3, i)]; S.blurB.material.opacity = i < 4 ? w : 0; }
  const hide = clamp((bdeg - 3) / 6);
  S.studs.forEach((s) => (s.visible = hide < 0.5));
  S.hub.visible = bdeg < 6;
  S.lightRing.material.opacity = 0.55 * clamp((bdeg - 3) / 8);
  return 1 - clamp((bdeg - 2) / 8);
}
// HTML glow + rays follow the wheel's projected centre
const _v = new THREE.Vector3(), _w = new THREE.Vector3();
function follow(S, glow, rays, gk, rk) {
  S.world.updateMatrixWorld(); S.camera.updateMatrixWorld();
  _v.set(0, 0, 0).applyMatrix4(S.world.matrixWorld).project(S.camera);
  _w.set(1, 0, 0).applyMatrix4(S.world.matrixWorld).project(S.camera);
  const x = (_v.x + 1) * W / 2, y = (1 - _v.y) * H / 2, r = Math.hypot((_w.x - _v.x) * W / 2, (_w.y - _v.y) * H / 2);
  S.screen = { x, y, r };
  glow.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(r * gk).toFixed(4)})`;
  rays.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rk.toFixed(2)}deg) scale(${((r * 2.6) / 100).toFixed(4)})`;
}

// ------------------------------------------------------------------ build + per-frame
const S1 = stage('s1-gl', 'rings'), S2 = stage('s2-gl', 'flat');
const G1 = document.getElementById('s1-glow'), G2 = document.getElementById('s2-glow');
const RAYS1 = document.getElementById('s1-rays'), RAYS2 = document.getElementById('s2-rays');
const RING_ORDER = ['rim', 'outer', 'middle', 'inner'];
const Z = { rim: 0, outer: 0.07, middle: 0.27, inner: 0.47, hub: 0.6 };

function render1(t) {
  const S = S1;
  // camera: macro on the pointer → log-scale pull back to frontal → rising sun → elevated orbit over the exploded rings
  const u = clamp(t / 3.6), lam = 1 - Math.pow(1 - u, 3.2);
  const hook = mix(C.hook0, C.front, lam);
  const cam = chain(t, hook, C.front, [[3.95, C.sun, 'heavy'], [7.85, C.rings, 'default']]);
  cam.yaw += -12 * smooth((t - 9.2) / 6.4);
  cam.sy += -14 * smooth((t - 5) / 3) * (1 - sp(t, 7.85, 'default'));
  applyCam(S.camera, cam);
  // the standee tips back like a table so the tiers stack UP (a tiered cake), then explode along its axis
  S.world.rotation.x = -64 * sp(t, 8.35, 'heavy') * D2R;
  // rotation + exploded tiers + per-card lift
  const th = SP.wheel1(t);
  const lifts = [9.95, 11.95, 13.95], dimOn = sp(t, 9.95, 'default') * (1 - sp(t, 15.4, 'default'));
  const act = { rim: 2, outer: 2, middle: 1, inner: 0, hub: 0 };
  const ringZ = (n, i) => {
    let lift = 0; for (let k = 0; k < 3; k++) { const s = sp(t, lifts[k], 'default'); lift += ((k === act[n] ? 1 : 0) - (k > 0 && k - 1 === act[n] ? 1 : 0)) * s; }
    return { z: Z[n] * sp(t, 8.9 + i * 0.08, 'default') + 0.2 * lift, lift: clamp(lift) };
  };
  RING_ORDER.forEach((n, i) => {
    const g = S.tiers[n], { z, lift } = ringZ(n, i);
    g.position.z = z; g.rotation.z = -(th + SP.ringOffset(n, t)) * D2R;
    const dv = dimOn * (1 - lift), c = 1 - 0.6 * dv;
    g.userData.face.material.color.setRGB(c, c, c); g.userData.side.color.copy(g.userData.sideBase).multiplyScalar(c);
  });
  { const { z, lift } = ringZ('hub', 4); S.hub.position.z = z; S.hub.rotation.z = -(th + SP.ringOffset('hub', t)) * D2R;
    const c = 1 - 0.6 * dimOn * (1 - lift); S.hub.children[0].material.color.setRGB(c, c, c); }
  // aligned overlays (blur, light ring) and the pegs ride with the rim
  const rimRot = -(th + SP.ringOffset('rim', t)) * D2R;
  for (const o of [S.blurA, S.blurB, S.lightRing]) o.rotation.z = rimRot;
  S.studs[0].parent.position.z = ringZ('rim', 0).z; S.studs[0].parent.rotation.z = rimRot;
  const bdeg = t < 8 ? clamp(SP.omega1(t) * 0.025, 0, 52) : 0;
  const glowDim = setBlur(S, bdeg);
  bulbs(S, t, t < 8 ? 'marquee8' : 'chase', glowDim);
  // pointer: ratchet flapper, lifts off as the wheel tilts
  const pk = sp(t, 7.9, 'snappy');
  S.ptr.rotation.z = SP.flap(SP.TICKS1, t) * D2R;
  S.ptr.position.y = 1.176 + 0.35 * pk;
  S.ptr.userData.mats.forEach((m) => (m.opacity = 1 - pk)); S.ptr.visible = pk < 0.995;
  S.shadow.material.opacity = 1 - 0.6 * sp(t, 8.3, 'default');
  S.renderer.render(S.scene, S.camera);
  follow(S, G1, RAYS1, 2.2 * (0.92 + 0.08 * Math.sin((t * Math.PI * 2) / 4)) / (CFG.G1 / 2), t * 4);
  RAYS1.style.opacity = (0.03 + 0.2 * sp(t, 4.0, 'soft') - 0.12 * sp(t, 8.0, 'soft')).toFixed(3);
}

function render2(t) {
  const S = S2;
  const kw = sp(t, 22.35, 'default'), ko = sp(t, 23.95, 'heavy');
  const cam = chain(t, C.front2, C.front2, [[22.35, C.win2, 'default'], [23.95, C.off2, 'heavy']]);
  cam.spx *= 1 + 0.07 * smooth((t - 18) / 3.5) * (1 - sp(t, 22.0, 'default'));
  if (t > 22) { const x = t - 22; cam.spx *= 1 + 0.05 * Math.exp(-x / 0.12) * Math.min(1, x / 0.02);
    cam.sx += 10 * Math.exp(-x / 0.22) * NX(x * 40); cam.sy += 10 * Math.exp(-x / 0.22) * NY(x * 40); cam.roll += 1.2 * Math.exp(-x / 0.25) * NX(x * 30 + 7); }
  applyCam(S.camera, cam);
  const th = SP.wheel2(t);
  S.spinG.rotation.z = -th * D2R;
  const bdeg = clamp(Math.abs(SP.omega2(t)) * 0.025, 0, 52);
  const glowDim = setBlur(S, bdeg);
  bulbs(S, t, t < 17 ? 'marquee4' : t < 21.5 ? 'fast' : t < 22 ? 'dim' : t < 24.5 ? 'flash' : 'marquee4', glowDim);
  // landing: winning slice lit, the rest dims, a warm flash
  const w = sp(t, 22.0, 'snappy') * (1 - sp(t, 23.9, 'default'));
  const pulse = 0.55 + 0.45 * Math.exp(-((((t - 22) % 0.5) + 0.5) % 0.5) / 0.18);
  S.win.dim.material.opacity = 0.6 * w; S.win.wedge.material.opacity = 0.16 * w * pulse; S.win.edge.material.opacity = w * pulse;
  S.flash.intensity = t > 22 ? 6 * Math.exp(-(t - 22) / 0.35) : 0;
  const land = t > 22 ? Math.exp(-(t - 22) / 0.18) * Math.sin(((t - 22) / 0.16) * Math.PI * 2) : 0;
  S.ptr.rotation.z = SP.flap(SP.TICKS2, t) * D2R;
  S.ptr.position.y = 1.176 + 0.02 * land; S.ptr.scale.setScalar(1 + 0.05 * Math.abs(land));
  S.renderer.render(S.scene, S.camera);
  const burst = t > 22 ? Math.exp(-(t - 22) / 0.7) : 0;
  follow(S, G2, RAYS2, (0.9 + 0.12 * smooth((t - 18) / 3.5) + 0.25 * burst) * 2.3 / (CFG.G2 / 2), -t * 6);
  RAYS2.style.opacity = (0.06 + 0.06 * smooth((t - 18) / 3.5) + 0.42 * burst + 0.1 * ko).toFixed(3);
  window.__wheel3d.hub2 = S.screen;
}

window.__wheel3d = {
  render(t) { if (t < 16.6) render1(t); if (t > 15.4) render2(t); },
};
// first frame once every texture has arrived, then release the runtime's build hold
THREE.DefaultLoadingManager.onLoad = () => { window.__wheel3d.render(window.__hfThreeTime || window.__lastT || 0); if (window.__wheel3dReady) window.__wheel3dReady(); };
window.__wheel3d.render(window.__lastT || 0);
