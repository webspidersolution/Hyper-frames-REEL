# The Three.js hero layer (inside HyperFrames)

Original guidance (no text from third-party repos). Starter: `templates/src/hero3d.js`. Worked example:
`examples/buildfest-wheel/wheel3d.js` (a textured, tiered prize wheel with rim, pegs, bulbs, pointer, blur, explode).

## When to use 3D
Use a 3D hero when the story has an object: a product, a logo coin, a device, a wheel, a package, a key. Keep words,
cards and CTAs in HTML (crisp, accessible, checkable). A hybrid frame = scene background (CSS) → props (SVG) → glow/rays
(HTML) → **WebGL canvas** → text/cards (HTML) → transitions → grain.
- **One canvas shared by every scene** (a hero that travels between shots, an iris that must clip the 3D): put each
  scene's type in its own front layer ABOVE the canvas. `check` treats any canvas as opaque, so type below it fails as
  `text_occluded`; keep only deliberate depth-sandwich words behind, flagged on their own text spans
  (`hyperframes-contract.md` gotchas).
- The 3D renders behind front type: **route hero paths clear of the type**. A hop that crossed a collapsing sticker
  vanished behind it; raising the arc fixed it.

## Time contract
- The hero renders only from film time: `window.__hero3d.render(t)` is called by the composition clock tween
  (`onUpdate`) and by the `hf-seek` listener. Never use `requestAnimationFrame`, clocks or randomness without a seed.
- `renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true })`,
  `setPixelRatio(1)`, `setSize(W, H, false)`, clear alpha 0 so the CSS background shows through.
- Textures load through `THREE.TextureLoader` (the runtime waits on `DefaultLoadingManager`). Also register a build hold
  synchronously in the classic script: `window.__hf.buildReady['hero3d'] = new Promise(r => window.__hero3dReady = r)`,
  resolve it in `DefaultLoadingManager.onLoad` after the first render.
- Import via an importmap (`three` + `three/addons/`, same pinned version) in a `<script type="module">` that runs after
  the classic scripts.

## Camera: think in screen space
Describe each camera state as an *intent*: which world point `T` sits at which screen pixel `(sx, sy)`, at how many
pixels per world unit (`spx`), from which `pitch`/`yaw`/`roll`, with what `fov`. Convert per frame:
- distance `d = H / (2 tan(fov/2) · spx)`; position = `T + d·(sin yaw·cos pitch, sin pitch, cos yaw·cos pitch)`;
- `camera.setViewOffset(W, H, W/2 − sx, H/2 − sy, W, H)` puts `T` at `(sx, sy)` without breaking perspective.
Blend states with springs, `spx` in log space (`chain()` in the starter superposes one spring per change). This makes
layout per format trivial (different `sx/sy/spx` per format) and keeps the hero clear of the type.

Moves that sell 3D: a macro start (`spx` 3× the wide, pitched 25–30°, yawed −25°, slight roll) pulling back to frontal;
a slow orbit (yaw drift) during holds; a push of 5–8 % during builds; a short shake on impacts (seeded noise, decays in
~0.25 s). Tip an object back like a table (`world.rotation.x = −60°`) so exploded tiers stack *up* on screen.

## Look
- `renderer.toneMapping = THREE.NeutralToneMapping` keeps brand/print colors honest; `outputColorSpace = SRGB`.
- Environment: `PMREMGenerator.fromScene(new RoomEnvironment(), 0.04)` gives soft, believable reflections with no HDRI.
  Then a warm key (directional, top-left front), a cool rim from behind, low ambient, optional point light for flashes.
- Materials: printed art = `MeshPhysicalMaterial({ map, roughness ~0.42, clearcoat ~0.55 })`; lacquered plastic =
  clearcoat 1, roughness 0.3; chrome studs = metalness 1, roughness ~0.15. Color textures: `colorSpace = SRGB`,
  `anisotropy = renderer.capabilities.getMaxAnisotropy()`.
- Saturated lacquer under RoomEnvironment washes out to pastel (a deep ultramarine read as flat periwinkle, its engraving
  invisible): lacquer `envMapIntensity` ~0.4, key light ~1.6, a darker texture base, engraving lines with real contrast.
- Real thickness: build printed faces as `RingGeometry`/`CircleGeometry` with **planar UVs** you set yourself, plus
  open `CylinderGeometry` walls and a back cap. Extrude logos/pins with `ExtrudeGeometry` (bevel 0.01–0.012) and map the
  real artwork onto the front cap by rewriting its UVs from positions.
- Glows: additive `Sprite`s with a radial `CanvasTexture`; chase their opacity in `render(t)`.
- A soft contact/drop shadow: a plane behind/below with a radial texture tinted to the background (warm brown on
  saturated grounds, black on dark).

## Speed reads as blur
At 60 fps a wheel spinning 1,000 °/s strobes. Pre-bake rotational blur textures (premultiplied average of N rotations,
e.g. 5°, 12°, 26°, 52°) in Python and cross-fade two adjacent levels on a disc just above the face by angular speed
(`blurDeg ≈ ω × 0.025`). Hide small 3D studs and the raised hub while blurred; add a light-ring for the bulbs.

### Accumulation motion blur (coin flips, fly-ins, particles, whip pans)
Pre-baked textures only cover in-plane spins. Everything else: render K sub-frames across the shutter, average them,
tone-map once. Working reference: `D:\Hyperframes\projects\hyperreel-showreel\src\hero3d.js` → `render()`.
- **Shutter 180°** = 1/120 s at 60 fps, centred on t.
- **K ≥ (pixel travel during the shutter) / 6.** Too few sub-frames read as stacked copies ("◆◆◆"), which looks worse
  than no blur: a chrome edge travelling ~275 px needed 24. Choose K per time window (`blurSamples(t)`); K = 1 when calm.
- **Clamp the window at cuts**: a window straddling a cut ends just before it (or starts on it), so no sub-frame shows
  the other shot.
- **Render targets skip tone mapping and colour space** and hold premultiplied colour, so the final pass converts once:
  un-premultiply → tone map → sRGB → re-premultiply (the canvas is premultiplied-alpha). HalfFloat targets keep the sum
  from banding or clipping; `samples: 4` keeps MSAA.
```js
const rtS = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });   // one sub-frame
const rtA = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });               // the running sum
const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const accMat = new THREE.ShaderMaterial({ uniforms: { tex: { value: rtS.texture }, w: { value: 1 } }, vertexShader: VS,
  fragmentShader: 'uniform sampler2D tex; uniform float w; varying vec2 vUv; void main(){ gl_FragColor = texture2D(tex, vUv) * w; }',
  blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
  blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor,
  depthTest: false, depthWrite: false, toneMapped: false, transparent: true });
const outMat = new THREE.ShaderMaterial({ uniforms: { tex: { value: rtA.texture } }, vertexShader: VS, fragmentShader: `
  uniform sampler2D tex; varying vec2 vUv;
  void main(){ vec4 a = texture2D(tex, vUv); float al = clamp(a.a, 0.0, 1.0);
    gl_FragColor = vec4(a.a > 1e-4 ? a.rgb / a.a : vec3(0.0), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    gl_FragColor = vec4(gl_FragColor.rgb * al, al); }`,
  blending: THREE.NoBlending, depthTest: false, depthWrite: false, toneMapped: true });
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), accMat); quad.frustumCulled = false;
const qScene = new THREE.Scene(); qScene.add(quad); const qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
function render(t) {                                   // stateAt(t) poses camera + objects for time t
  const K = blurSamples(t);
  if (K > 1) {
    let a = t - SHUTTER / 2, b = t + SHUTTER / 2;      // SHUTTER = 1 / 120
    for (const c of CUTS) { if (t < c && b > c) b = c - 1e-4; if (t >= c && a < c) a = c; }
    renderer.setRenderTarget(rtA); renderer.clear(); accMat.uniforms.w.value = 1 / K;
    for (let j = 0; j < K; j++) {
      stateAt(a + (b - a) * j / (K - 1));
      renderer.setRenderTarget(rtS); renderer.clear(); renderer.render(scene, camera);
      quad.material = accMat; renderer.setRenderTarget(rtA); renderer.autoClear = false; renderer.render(qScene, qCam); renderer.autoClear = true;
    }
    quad.material = outMat; renderer.setRenderTarget(null); renderer.render(qScene, qCam);
  }
  stateAt(t);                                          // back to t, so window.__hero3d.screen matches the frame
  if (K === 1) { renderer.setRenderTarget(null); renderer.render(scene, camera); }
}
```
Cost: a 15 s showreel with 10–24 sub-frames in its fast windows rendered in ~2m45s (9:16) / ~3m10s (16:9) at 60 fps
on an RTX 3050.

## Splitting real artwork into parts
A flat, layered design (rings, tiers, a badge) can be split by geometry in Python: annulus masks with an anti-aliased
outer edge and a 2 px hidden overlap under the next layer, so the assembled object has no seams and the exploded parts
don't show slivers. Crop each part to its box; record radii in a `meta.json` the hero reads.

## Shader transitions with a WebGL layer
HyperShader's layered compositing captured the scenes as black when they contained the Three.js canvas, and the
page-side path clones DOM (a canvas clone is blank). Use HTML transitions around the 3D layer instead
(`hyperframes-contract.md` § Transitions); they render reliably and ~7× faster.

## Performance
Large textures cost memory per render worker; 4K-ish textures for macro shots only. One renderer per scene canvas;
only render scenes that are visible at `t`. A 30 s 1080×1920 hybrid renders in ~2 min (draft, 30 fps) / ~4.5 min
(final, 60 fps) on an RTX 3050 with `--gpu --browser-gpu`.
