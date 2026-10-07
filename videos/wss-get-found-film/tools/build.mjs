// Assemble one root composition per format from src/. Run from the project root:  node tools/build.mjs
//   first format  → index.html            (renders with `npx hyperframes render`)
//   other formats → <fmt>/index.html      (render with `npx hyperframes render <fmt>`; assets shared via a junction)
// Inlines src/film.css, src/body.html, window.TL (timeline.json), src/physics.js, src/film.js and, as a module,
// src/hero3d.js (Three.js). Placeholders in body.html: {{icon:name}} (assets/icons/name.svg), {{props:name}}
// (src/props.mjs default export: (name, {fmt, W, H}) => svg string), {{W}} {{H}} {{FMT}}.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SIZES = { '9x16': [1080, 1920], '16x9': [1920, 1080], '1x1': [1080, 1080], '4x5': [1080, 1350] };
const rd = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '');
const TL = JSON.parse(rd('timeline.json'));
const formats = TL.formats || ['9x16'];
const css = rd('src/film.css'), body = rd('src/body.html'), physics = rd('src/physics.js'), film = rd('src/film.js'), hero = rd('src/hero3d.js');
const propsMod = fs.existsSync('src/props.mjs') ? (await import(pathToFileURL(path.resolve('src/props.mjs')).href)).default : null;
const THREE_VER = TL.three || '0.181.2';

function icon(name) {
  const s = rd(`assets/icons/${name}.svg`);
  if (!s) throw new Error(`missing assets/icons/${name}.svg`);
  return s.replace(/<!--[\s\S]*?-->/g, '').replace(/\s*class="[^"]*"/, '').replace(/\s+/g, ' ').trim();
}

formats.forEach((fmt, i) => {
  const [W, H] = SIZES[fmt];
  const dir = i === 0 ? '.' : fmt;
  if (i > 0) {
    fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(path.join(dir, 'assets'))) fs.symlinkSync(fs.realpathSync('assets'), path.join(dir, 'assets'), 'junction');
    for (const f of ['hyperframes.json', 'package.json', 'BRIEF.md', 'STORYBOARD.md']) if (fs.existsSync(f)) fs.copyFileSync(f, path.join(dir, f));
  }
  const ctx = { fmt, W, H };
  const b = body
    .replace(/\{\{icon:([a-z0-9-]+)\}\}/g, (_, n) => icon(n))
    .replace(/\{\{props:([a-z0-9_-]+)\}\}/gi, (_, n) => (propsMod ? propsMod(n, ctx) : ''))
    .replaceAll('{{W}}', W).replaceAll('{{H}}', H).replaceAll('{{FMT}}', fmt);
  const audio = fs.existsSync('assets/audio/mix.wav')
    ? `\n      <audio id="bgm" src="assets/audio/mix.wav" data-start="0" data-duration="${TL.duration}" data-track-index="10" data-volume="1"></audio>` : '';
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <title>${TL.title || 'hyperreel'} · ${fmt}</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <script type="importmap">
      { "imports": { "three": "https://cdn.jsdelivr.net/npm/three@${THREE_VER}/build/three.module.js",
                     "three/addons/": "https://cdn.jsdelivr.net/npm/three@${THREE_VER}/examples/jsm/" } }
    </script>
    <style>
html, body { width: ${W}px; height: ${H}px; }
${css}
    </style>
  </head>
  <body>
    <div id="root" class="f${fmt}" data-composition-id="main" data-start="0" data-duration="${TL.duration}" data-fps="${TL.fps || 60}" data-width="${W}" data-height="${H}">
${b}${audio}
    </div>
    <script>
window.TL = ${JSON.stringify(TL)};
${physics}
    </script>
    <script>
${film}
    </script>${hero ? `
    <script type="module">
${hero}
    </script>` : ''}
  </body>
</html>
`;
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log('wrote', path.join(dir, 'index.html'), `${W}x${H}`, `${(html.length / 1024).toFixed(0)} KB`);
});
