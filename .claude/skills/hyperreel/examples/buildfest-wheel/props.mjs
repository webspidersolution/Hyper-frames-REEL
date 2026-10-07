// Festive props from the client's Build Fest landing page, drawn procedurally as SVG (seeded, deterministic):
// fairy-light strands, red flower garlands with pearls, scalloped corner flowers with mandala line-art,
// diyas, sparkle stars, confetti dashes, pink bokeh, and the marigold petals for the win burst.
// defs() goes once at the root; props(scene, fmt, W, H) goes inside each scene (ids prefixed per scene).

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const f = (v) => +v.toFixed(1);

export function defs() {
  // scalloped 12-petal flower outline (unit radius 100)
  const scallop = (r, depth, n) => {
    let d = '';
    for (let i = 0; i <= 360; i += 2) {
      const a = (i * Math.PI) / 180, rr = r * (1 - depth + depth * Math.abs(Math.cos((n / 2) * a)));
      d += `${i ? 'L' : 'M'}${f(rr * Math.cos(a))} ${f(rr * Math.sin(a))}`;
    }
    return d + 'Z';
  };
  let mandala = '';
  for (let k = 0; k < 12; k++) {
    const a = (k * 30 * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
    mandala += `<path d="M${f(30 * c)} ${f(30 * s)} Q${f(60 * Math.cos(a + 0.22))} ${f(60 * Math.sin(a + 0.22))} ${f(78 * c)} ${f(78 * s)} Q${f(60 * Math.cos(a - 0.22))} ${f(60 * Math.sin(a - 0.22))} ${f(30 * c)} ${f(30 * s)}Z"/>`;
  }
  let dots = '';
  for (let k = 0; k < 24; k++) { const a = (k * 15 * Math.PI) / 180; dots += `<circle cx="${f(88 * Math.cos(a))}" cy="${f(88 * Math.sin(a))}" r="2.2"/>`; }
  // red flower ball (carnation): ruffled layers
  let ruffle = '';
  for (let k = 0; k < 9; k++) { const a = (k * 40 * Math.PI) / 180; ruffle += `<ellipse cx="${f(7 * Math.cos(a))}" cy="${f(7 * Math.sin(a))}" rx="7" ry="4.2" transform="rotate(${k * 40 + 90} ${f(7 * Math.cos(a))} ${f(7 * Math.sin(a))})"/>`; }
  return `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <radialGradient id="pg-bulb"><stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/><stop offset="0.35" stop-color="#ffe9e4" stop-opacity="0.55"/><stop offset="1" stop-color="#ffd6cf" stop-opacity="0"/></radialGradient>
  <radialGradient id="pg-rf" cx="0.38" cy="0.35" r="0.7"><stop offset="0" stop-color="#ff6b5e"/><stop offset="0.55" stop-color="#e3262b"/><stop offset="1" stop-color="#a5121b"/></radialGradient>
  <radialGradient id="pg-pearl" cx="0.35" cy="0.3" r="0.75"><stop offset="0" stop-color="#ffffff"/><stop offset="0.6" stop-color="#fbe9e4"/><stop offset="1" stop-color="#e2bdb4"/></radialGradient>
  <radialGradient id="pg-flame" cx="0.5" cy="0.6" r="0.6"><stop offset="0" stop-color="#fff6c2" stop-opacity="1"/><stop offset="0.4" stop-color="#ffc24a" stop-opacity="0.75"/><stop offset="1" stop-color="#ff8a1e" stop-opacity="0"/></radialGradient>
  <radialGradient id="pg-bokeh"><stop offset="0" stop-color="#ffd3d6" stop-opacity="0.55"/><stop offset="0.8" stop-color="#ffc0c6" stop-opacity="0.38"/><stop offset="1" stop-color="#ffc0c6" stop-opacity="0.08"/></radialGradient>
  <symbol id="ps-flower" viewBox="-100 -100 200 200" overflow="visible">
    <path d="${scallop(100, 0.16, 12)}" fill="#ffb03c"/>
    <path d="${scallop(74, 0.2, 12)}" fill="#ffc04f"/>
    <g fill="none" stroke="#fff0cc" stroke-width="2" stroke-opacity="0.9">${mandala}<circle r="24"/><circle r="94"/></g>
    <g fill="#ffe2a6" fill-opacity="0.7">${dots}</g>
  </symbol>
  <symbol id="ps-rose" viewBox="-14 -14 28 28" overflow="visible">
    <circle r="13" fill="url(#pg-rf)"/>
    <g fill="#c4161f" fill-opacity="0.55">${ruffle}</g>
    <circle r="3.6" fill="#ff7d6e"/><ellipse cx="-4" cy="-5" rx="3.4" ry="2" fill="#ffffff" fill-opacity="0.25"/>
  </symbol>
  <symbol id="ps-pearl" viewBox="-6 -6 12 12" overflow="visible"><circle r="5.2" fill="url(#pg-pearl)"/></symbol>
  <symbol id="ps-star" viewBox="-10 -10 20 20" overflow="visible"><path d="M0 -10 Q1.6 -1.6 10 0 Q1.6 1.6 0 10 Q-1.6 1.6 -10 0 Q-1.6 -1.6 0 -10Z"/></symbol>
  <symbol id="ps-petal" viewBox="-10 -16 20 32" overflow="visible"><path d="M0 -15 C9 -9 10 6 0 15 C-10 6 -9 -9 0 -15Z"/><path d="M0 -12 L0 12" stroke="#000" stroke-opacity="0.12" stroke-width="1.2"/></symbol>
</defs></svg>`;
}

// one wavy fairy-light strand hanging from the top: returns string path + bulb groups
function strand(id, x0, len, amp, wave, phase, gap, scene, si) {
  let d = `M${x0} -10`, bulbs = '';
  for (let y = 0; y <= len; y += 8) d += ` L${f(x0 + amp * Math.sin((y / wave) * Math.PI * 2 + phase))} ${y}`;
  let k = 0;
  for (let y = 26; y <= len; y += gap, k++) {
    const x = x0 + amp * Math.sin((y / wave) * Math.PI * 2 + phase);
    bulbs += `<g class="fb" data-s="${si}" data-k="${k}" transform="translate(${f(x)} ${f(y)})"><circle r="28" fill="url(#pg-bulb)"/><circle r="8.5" fill="#fff8f5"/></g>`;
  }
  return `<path d="${d}" fill="none" stroke="#fff1ea" stroke-opacity="0.55" stroke-width="1.6"/>${bulbs}`;
}
// a garland strand: red flower balls separated by three pearls, along a straight-ish sagging line
function garland(x0, y0, x1, y1, sag, scene, gi) {
  const n = 46; let items = '', d = '';
  const P = (u) => [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u + sag * Math.sin(Math.PI * u)];
  for (let i = 0; i <= 40; i++) { const [x, y] = P(i / 40); d += `${i ? 'L' : 'M'}${f(x)} ${f(y)}`; }
  for (let i = 0; i <= n; i++) {
    const [x, y] = P(i / n);
    if (i % 4 === 0) items += `<use href="#ps-rose" x="${f(x - 14)}" y="${f(y - 14)}" width="28" height="28"/>`;
    else items += `<use href="#ps-pearl" x="${f(x - 5.5)}" y="${f(y - 5.5)}" width="11" height="11"/>`;
  }
  const [ex, ey] = P(1);
  const tassel = `<use href="#ps-rose" x="${f(ex - 17)}" y="${f(ey + 4)}" width="34" height="34"/><path d="M${f(ex)} ${f(ey + 36)} l-6 26 m6 -26 l0 30 m0 -30 l6 26" stroke="#d01f26" stroke-width="2.4" fill="none"/>`;
  return `<g class="gar" data-g="${gi}" data-cx="${f(x0)}" data-cy="${f(y0)}"><path d="${d}" stroke="#7a1010" stroke-opacity="0.5" stroke-width="1.4" fill="none"/>${items}${tassel}</g>`;
}

export function props(scene, fmt, W, H, opt = {}) {
  const r = rng(fmt === 'tall' ? 1201 + scene : 4401 + scene);
  const tall = fmt === 'tall';
  let out = `<svg class="props" id="s${scene}-props" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" data-layout-allow-overflow>`;
  // pink bokeh, top-left
  for (const [x, y, rr] of tall ? [[40, 70, 46], [8, 190, 34], [150, 26, 24]] : [[40, 60, 52], [12, 190, 38], [170, 24, 26]])
    out += `<circle class="bok" cx="${x}" cy="${y}" r="${rr}" fill="url(#pg-bokeh)"/>`;
  // corner flowers
  const FL = tall ? [[-40, -30, 250], [W + 60, 30, 230]] : [[-50, -40, 290], [W + 70, 50, 270]];
  FL.forEach(([x, y, rr], i) => { out += `<g class="cf" data-i="${i}" data-cx="${x}" data-cy="${y}"><use href="#ps-flower" x="${x - rr}" y="${y - rr}" width="${2 * rr}" height="${2 * rr}"/></g>`; });
  // garlands from the top-left corner
  const G = tall ? [[-30, 26, W * 0.56, 14, 112], [W * 0.44, 10, W + 30, 34, 118]] : [[-30, 14, W * 0.52, 8, 84], [W * 0.48, 6, W + 30, 18, 90]];
  if (opt.garlands !== false) G.forEach(([a, b, c, d, s], i) => { out += garland(a, b, c, d, s, scene, i); });
  // diyas on the right-hand flower
  const DY = tall ? [[W - 168, 40, 92], [W - 78, 160, 74]] : [[W - 190, 54, 104], [W - 92, 176, 84]];
  DY.forEach(([x, y, s], i) => {
    out += `<g class="dy" data-i="${i}"><circle class="dyg" cx="${x + s / 2}" cy="${y + s * 0.18}" r="${s * 0.62}" fill="url(#pg-flame)"/><image href="assets/brand/diya.png" x="${x}" y="${y}" width="${s}" height="${s * 218 / 214}"/></g>`;
  });
  // fairy-light strands down both sides (clear of the text column)
  const ST = tall
    ? [[20, 0.52], [52, 0.33], [W - 26, 0.62], [W - 64, 0.40], [W - 104, 0.74]]
    : [[24, 0.55], [64, 0.82], [100, 0.38], [W - 30, 0.66], [W - 76, 0.44], [W - 128, 0.86]];
  ST.forEach(([x, l], si) => { out += strand('', x, l * H, 9 + r() * 7, 170 + r() * 70, r() * 6.28, 74 + r() * 10, scene, si); });
  // sparkle stars + confetti dashes, sparse, seeded
  const N = tall ? 14 : 18;
  for (let i = 0; i < N; i++) {
    const x = r() * W, y = r() * H, s = 10 + r() * 14, col = r() < 0.5 ? '#ffe08a' : '#fff4d6';
    out += `<use class="spk" data-p="${f(r() * 6.28)}" data-cx="${f(x)}" data-cy="${f(y)}" href="#ps-star" x="${f(x - s / 2)}" y="${f(y - s / 2)}" width="${f(s)}" height="${f(s)}" fill="${col}"/>`;
  }
  for (let i = 0; i < N; i++) {
    const x = r() * W, y = r() * H, a = r() * 180;
    out += `<rect x="${f(x)}" y="${f(y)}" width="22" height="6" rx="3" fill="#ffc35a" fill-opacity="0.7" transform="rotate(${f(a)} ${f(x)} ${f(y)})"/>`;
  }
  return out + '</svg>';
}
// marigold petals for the win burst, a layer above the wheel; positioned per frame by film.js
export function petals(W, H) {
  const cols = ['#ff9f1a', '#ffc21f', '#ff7a12', '#e3262b', '#ffd54a', '#fff1c9'];
  let out = `<svg class="props" id="s2-petals" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" data-layout-allow-overflow>`;
  for (let i = 0; i < 96; i++) out += `<use class="ptl" href="#ps-petal" x="-10" y="-16" width="20" height="32" fill="${cols[i % 6]}" style="opacity:0"/>`;
  return out + '</svg>';
}
