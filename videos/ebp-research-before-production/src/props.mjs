// Seeded procedural props for body.html ({{props:<name>}}). Build-time only, so every render sees the same SVG.
//   circuit-<id> — the logo's circuit-trace motif: traces with 45° bends ending in pads, used as a faint background device.
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

function circuit(id, { W, H }, seed) {
  const r = rng(seed), traces = [];
  const n = Math.round((W * H) / 52000);
  for (let i = 0; i < n; i++) {
    let x = r() * W, y = r() * H;
    const pts = [[x, y]];
    let dir = Math.floor(r() * 8);                                   // 8 compass directions, 45° apart
    const segs = 2 + Math.floor(r() * 3);
    for (let k = 0; k < segs; k++) {
      const len = 60 + r() * 220, a = (dir * Math.PI) / 4;
      x += Math.cos(a) * len; y += Math.sin(a) * len; pts.push([x, y]);
      dir = (dir + (r() < 0.5 ? 1 : 7)) % 8;                         // bend 45° left or right
    }
    const d = pts.map(([px, py], k) => `${k ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`).join(' ');
    const [ex, ey] = pts[pts.length - 1], [sx, sy] = pts[0];
    traces.push(`<path d="${d}"/><circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="9"/><circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="5"/>`);
  }
  return `<svg class="circuit" id="${id}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" data-layout-allow-overflow>` +
    `<g fill="none" stroke="#ededed" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${traces.join('')}</g></svg>`
      .replace(/<circle /g, '<circle fill="#ededed" stroke="none" ');
}

export default function props(name, ctx) {
  const m = /^circuit-(\w+)$/.exec(name);
  if (m) return circuit(name, ctx, [...m[1]].reduce((a, c) => a * 31 + c.charCodeAt(0), 7));
  return '';
}
