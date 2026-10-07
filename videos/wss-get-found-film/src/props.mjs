// Static DOM for the film (build-time, deterministic): shards, the platform network, growth-path cards, web chips,
// the editor's code and the real WSS lockup split into glyphs. tools/build.mjs inlines {{props:<name>}}.
import fs from 'node:fs';

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// real platform marks (assets/logos, CC0 set, unmodified) on white tiles so their own colours read on any ground
export const tile = (name, size, inner = 0.64, cls = '') =>
  `<span class="tile ${cls}" role="img" aria-label="${name}" style="width:${size}px;height:${size}px;border-radius:${Math.round(size * 0.24)}px;` +
  `background-image:url(assets/logos/${name}.svg);background-size:${Math.round(size * inner)}px ${Math.round(size * inner)}px"></span>`;

// ---------------------------------------------------------------- 1–3: shards (three sets, one per word)
const SHARDS = {
  A: [['pill', 'Agency #1 · Ads'], ['pill', 'Agency #2 · SEO'], ['mono', 'invoice_0042.pdf'], ['tab', 'Monthly report v7'], ['badge', '3'],
      ['mono', '₹18,400 / month'], ['pill', 'Kick-off call · 4 pm'], ['mono', 'brief_final_v3.docx'], ['stars', '★★★☆☆'], ['glyph', '/'],
      ['glyph', '+'], ['pill', 'Retainer renewal'], ['mono', 'password: ••••••'], ['glyph', '×']],
  B: [['tab', 'Campaigns', 'google-ads'], ['tab', 'Reports', 'google-analytics'], ['tab', 'Ads Manager', 'meta'], ['tab', 'Inbox (99+)'], ['tab', 'Reviews', 'google'],
      ['tab', 'Leads sheet'], ['tab', 'Dashboard', 'wordpress'], ['tab', 'Messages', 'whatsapp'], ['badge', '12'], ['glyph', '‹'], ['glyph', '›'],
      ['tab', 'Coverage', 'google-search-console'], ['glyph', '/'], ['badge', '7']],
  C: [['tab', 'Studio', 'youtube'], ['tab', 'Insights', 'instagram'], ['pill', 'Scheduler'], ['pill', 'CRM'], ['pill', 'Heatmaps'], ['pill', 'Link checker'],
      ['mono', 'api_key=••••'], ['pill', 'Call tracking'], ['glyph', '{ }'], ['badge', '5'], ['mono', 'export_final(2).csv'], ['glyph', '*']],
};
function shards() {
  const r = rng(7); let h = '';
  for (const set of ['A', 'B', 'C']) {
    SHARDS[set].forEach(([type, text, mark], i) => {
      const n = SHARDS[set].length, a = (i / n) * Math.PI * 2 + (r() - 0.5) * 0.5;
      const r0 = 120 + r() * 120, r1 = 330 + r() * 520, z = 0.55 + r() * 1.25, spin = (r() - 0.5) * 24, dl = r() * 0.12;
      const inner = type === 'tab' ? (mark ? `${tile(mark, 30, 0.7, 'fav')}${esc(text)}` : `<i></i>${esc(text)}`) : esc(text);
      h += `<div class="sh ${type}" data-layout-allow-occlusion data-layout-allow-overlap data-set="${set}" data-a="${a.toFixed(4)}" data-r0="${r0.toFixed(1)}" data-r1="${r1.toFixed(1)}" data-z="${z.toFixed(3)}" data-spin="${spin.toFixed(2)}" data-dl="${dl.toFixed(3)}">${inner}</div>`;
    });
  }
  return h;
}

// ---------------------------------------------------------------- 1–3: the platform network (world coordinates)
export const NODES = [
  { x: 2480, y: 300, mk: 'google-ads', lb: 'Google Ads', sb: 'agency #1 · no call tracking' },
  { x: 2860, y: 430, mk: 'meta', lb: 'Meta Ads', sb: 'agency #2 · separate report' },
  { x: 2520, y: 790, mk: 'google-search-console', lb: 'Search Console', sb: '214 pages not indexed' },
  { x: 2900, y: 900, mk: 'google', lb: 'Google Business Profile', sb: '9 reviews unanswered' },
  { x: 3260, y: 260, mk: 'instagram', lb: 'Instagram', sb: 'last post 41 days ago' },
  { x: 3320, y: 680, mk: 'wordpress', lb: 'Website', sb: 'loads in 6.2 s' },
];
export const J = { x: 2100, y: 540 }, B = { x: 1500, y: 540 };
export function threadD(n) {   // a soft S from the junction to a node's dot
  const dx = n.x - J.x, dy = n.y - J.y;
  return `M${J.x} ${J.y} C${(J.x + dx * 0.42).toFixed(1)} ${(J.y + dy * 0.02).toFixed(1)} ${(J.x + dx * 0.55).toFixed(1)} ${(n.y - dy * 0.02).toFixed(1)} ${n.x} ${n.y}`;
}
const DECO = ['M2100 540 C2320 520 2420 640 2700 610 S3150 560 3500 600', 'M2100 540 C2300 560 2380 420 2640 460 S3000 520 3450 470'];
function net() {
  let p = `<svg id="net" width="4000" height="1400" viewBox="0 0 4000 1400" data-layout-allow-overflow>`;
  p += `<path id="net-wave" d="M${B.x} ${B.y}"/>`;
  DECO.forEach((d, i) => { p += `<path id="th-d${i}" class="thin" d="${d}"/>`; });
  NODES.forEach((n, i) => { p += `<path id="th${i}" d="${threadD(n)}"/>`; });
  NODES.forEach((n, i) => { p += `<circle id="nd${i}" class="nd" cx="${n.x}" cy="${n.y}" r="7"/>`; });
  p += `<circle id="nd-j" class="nd" cx="${J.x}" cy="${J.y}" r="8"/><circle id="nd-b" class="bz" cx="${B.x}" cy="${B.y}" r="11"/></svg>`;
  NODES.forEach((n, i) => {
    p += `<div class="node" id="node${i}" style="left:${n.x + 18}px;top:${n.y - 64}px"><div class="ic">${tile(n.mk, 60, 0.66)}</div>` +
         `<div class="lb" data-layout-allow-occlusion>${esc(n.lb)}</div><div class="sb" data-layout-allow-occlusion>${esc(n.sb)}</div></div>`;
  });
  return p;
}

// ---------------------------------------------------------------- 7–8: growth-path cards (original mock-ups)
const CARDS = [
  { bg: '#141618', fg: '#f2f3ef', hd: 'Local SEO', sb: 'dentist near me · #1', viz: 'rank', mk: ['google'] },
  { bg: '#92c131', fg: '#141618', hd: 'Google Ads', sb: 'calls tracked', viz: 'bars', mk: ['google-ads'] },
  { bg: '#f8f6f0', fg: '#2b2f33', hd: 'Meta Ads', sb: '4 creatives · A/B', viz: 'grid', mk: ['meta'] },
  { bg: '#2f5d52', fg: '#f2f3ef', hd: 'AI search', sb: '“best dentist in Noida?”', viz: 'chat', mk: ['chatgpt', 'gemini', 'perplexity'] },
  { bg: '#ffffff', fg: '#2b2f33', hd: 'Business Profile', sb: '★★★★★ 4.9', viz: 'pin', mk: ['google'] },
  { bg: '#5a5e64', fg: '#f2f3ef', hd: 'Website revamp', sb: 'mobile-first', viz: 'page', mk: ['wordpress'] },
  { bg: '#a9503a', fg: '#fff7ef', hd: 'Reels plan', sb: '12 shorts / month', viz: 'reels', mk: ['instagram'] },
  { bg: '#eef1e6', fg: '#2b2f33', hd: 'Review engine', sb: 'ask · reply · repeat', viz: 'stars', mk: ['google'] },
  { bg: '#d9a441', fg: '#1f1a10', hd: 'Landing pages', sb: 'one offer per page', viz: 'page' },
  { bg: '#1f2a24', fg: '#e7e9e3', hd: 'WhatsApp follow-ups', sb: 'reply in 5 minutes', viz: 'chat', mk: ['whatsapp'] },
  { bg: '#f2f3ef', fg: '#2b2f33', hd: 'YouTube Shorts', sb: '3 uploads / week', viz: 'cal', mk: ['youtube'] },
  { bg: '#6b4a6e', fg: '#f6eef6', hd: 'Amazon Ads', sb: 'sponsored products', viz: 'bars' },
  { bg: '#15181b', fg: '#c8e08f', hd: 'Schema markup', sb: 'FAQ · LocalBusiness', viz: 'code', mk: ['google-search-console'] },
  { bg: '#7fa042', fg: '#141618', hd: 'Monthly report', sb: 'one page, plain words', viz: 'line', mk: ['google-analytics'] },
];
function viz(kind, fg) {
  const c = fg, f = 'fill="none"', s = `stroke="${c}"`;
  switch (kind) {
    case 'rank': return `<g opacity=".85"><rect x="22" y="104" width="200" height="16" rx="8" fill="${c}" opacity=".9"/><rect x="22" y="132" width="150" height="12" rx="6" fill="${c}" opacity=".4"/><rect x="22" y="156" width="170" height="12" rx="6" fill="${c}" opacity=".3"/><circle cx="270" cy="134" r="26" ${f} ${s} stroke-width="5"/><text data-layout-allow-overlap data-layout-allow-occlusion x="270" y="143" text-anchor="middle" font-family="Display" font-weight="600" font-size="26" fill="${c}">1</text></g>`;
    case 'bars': return [0.35, 0.5, 0.42, 0.68, 0.9].map((v, i) => `<rect x="${30 + i * 54}" y="${178 - v * 90}" width="34" height="${v * 90}" rx="6" fill="${c}" opacity="${0.35 + i * 0.15}"/>`).join('');
    case 'grid': return [0, 1, 2, 3].map((i) => `<rect x="${24 + i * 70}" y="96" width="60" height="78" rx="8" fill="${['#92c131', '#5a5e64', '#c8674a', '#d9a441'][i]}"/>`).join('');
    case 'chat': return `<rect x="22" y="96" width="210" height="34" rx="17" fill="${c}" opacity=".22"/><rect x="88" y="140" width="210" height="34" rx="17" fill="#92c131"/><circle cx="110" cy="157" r="4" fill="#141618"/><circle cx="124" cy="157" r="4" fill="#141618"/><circle cx="138" cy="157" r="4" fill="#141618"/>`;
    case 'pin': return `<path d="M60 178s-28-26-28-46a28 28 0 0 1 56 0c0 20-28 46-28 46z" fill="#92c131"/><circle cx="60" cy="132" r="10" fill="#ffffff"/><rect x="120" y="112" width="170" height="14" rx="7" fill="${c}" opacity=".3"/><rect x="120" y="138" width="120" height="14" rx="7" fill="${c}" opacity=".2"/>`;
    case 'page': return `<rect x="22" y="92" width="276" height="86" rx="10" ${f} ${s} stroke-opacity=".5" stroke-width="2"/><rect x="38" y="106" width="130" height="14" rx="7" fill="${c}" opacity=".85"/><rect x="38" y="128" width="100" height="10" rx="5" fill="${c}" opacity=".4"/><rect x="38" y="148" width="64" height="20" rx="10" fill="#92c131"/><rect x="190" y="104" width="94" height="62" rx="8" fill="${c}" opacity=".18"/>`;
    case 'reels': return [0, 1, 2].map((i) => `<rect x="${30 + i * 92}" y="88" width="78" height="96" rx="10" fill="${c}" opacity="${0.25 + i * 0.2}"/><path d="M${62 + i * 92} 124l18 12-18 12z" fill="${c}"/>`).join('');
    case 'stars': return `<text data-layout-allow-overlap data-layout-allow-occlusion x="24" y="150" font-size="44" fill="#d9a441" letter-spacing="6">★★★★★</text><rect x="24" y="164" width="150" height="12" rx="6" fill="${c}" opacity=".25"/>`;
    case 'cal': return Array.from({ length: 14 }, (_, i) => `<rect x="${24 + (i % 7) * 40}" y="${96 + Math.floor(i / 7) * 42}" width="32" height="34" rx="6" fill="${[2, 5, 9, 12].includes(i) ? '#92c131' : c}" opacity="${[2, 5, 9, 12].includes(i) ? 1 : 0.14}"/>`).join('');
    case 'code': return `<text data-layout-allow-overlap data-layout-allow-occlusion x="24" y="118" font-family="Mono" font-size="17" fill="${c}">"@type": "FAQPage",</text><text data-layout-allow-overlap data-layout-allow-occlusion x="24" y="146" font-family="Mono" font-size="17" fill="#e3c48f">"name": "Root canal cost?"</text><text data-layout-allow-overlap data-layout-allow-occlusion x="24" y="174" font-family="Mono" font-size="17" fill="${c}" opacity=".6">"acceptedAnswer": …</text>`;
    case 'line': return `<path d="M24 170 L84 150 L134 158 L190 120 L240 126 L296 92" ${f} stroke="#141618" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="296" cy="92" r="8" fill="#f2f3ef"/>`;
  }
  return '';
}
function cards() {
  return CARDS.map((c, i) => `<div class="card" id="card${i}" style="background-color:${c.bg};color:${c.fg}"><svg viewBox="0 0 320 196" data-layout-allow-overlap data-layout-allow-occlusion>${viz(c.viz, c.fg)}</svg>` +
    `<div class="hd" data-layout-allow-occlusion data-layout-allow-overlap>${esc(c.hd)}</div><div class="sb" data-layout-allow-occlusion data-layout-allow-overlap>${esc(c.sb)}</div>` +
    (c.mk ? `<div class="mks">${c.mk.map((m) => tile(m, 38, 0.66)).join('')}</div>` : '') + '</div>').join('');
}

// ---------------------------------------------------------------- 14: chips for the web (final layout around the hub)
export const HUB = { x: 1100, y: 480 };
const CHIPS = [
  ['Google Ads', 'CTR ↑', ['google-ads']], ['Meta Ads', '3 audiences', ['meta']], ['SEO', '28 keywords', ['google']], ['Instagram', '3 posts / wk', ['instagram']],
  ['Reviews', '4.9 ★', ['google']], ['Calls', 'tracked'], ['Leads', 'one sheet'], ['Bookings', 'online'], ['Keywords', 'top 3'],
  ['Landing pages', '4 live'], ['YouTube', 'Shorts', ['youtube']], ['Website', '1.1 s load', ['wordpress']], ['AI answers', 'cited', ['chatgpt', 'gemini', 'perplexity']],
  ['Search Console', 'clean', ['google-search-console']], ['Schema', 'FAQ'], ['Retargeting', 'on'], ['Content', 'weekly'],
  ['Analytics', 'one view', ['google-analytics']], ['Backlinks', 'local'], ['WhatsApp', 'replies', ['whatsapp']],
];
export const KEY_CHIPS = [5, 6, 7, 4];      // what matters: calls, leads, bookings, reviews
const RINGS = [[0, 4, 190], [4, 11, 340], [11, 20, 490]];
function chipLayout() {   // place chips on three elliptical rings, then nudge angles until no two label boxes overlap
  const box = (i, ang, R) => {
    const [lb, , mk] = CHIPS[i], x = HUB.x + Math.cos(ang) * R * 1.12, y = HUB.y + Math.sin(ang) * R * 0.6;
    const lead = mk ? 20 + (mk.length > 1 ? mk.length * 34 : 34) : 18, w = lead + lb.length * 16 + 20;
    return { x, y, x0: x - 24, x1: x + w, y0: y - 34, y1: y + 40 };
  };
  const ang = [];
  for (const [a, b, R] of RINGS) for (let i = a; i < b; i++) ang[i] = ((i - a) / (b - a)) * Math.PI * 2 + (R === 340 ? 0.35 : R === 490 ? 0.12 : 0.6);
  const ringOf = (i) => RINGS.find(([a, b]) => i >= a && i < b)[2];
  for (let it = 0; it < 400; it++) {
    let moved = false;
    for (let i = 0; i < CHIPS.length; i++) for (let j = 0; j < CHIPS.length; j++) {
      if (i === j) continue;
      const A = box(i, ang[i], ringOf(i)), B = box(j, ang[j], ringOf(j));
      if (A.x0 < B.x1 && B.x0 < A.x1 && A.y0 < B.y1 && B.y0 < A.y1) { ang[i] += 0.02 * (i < j ? -1 : 1); moved = true; }
    }
    if (!moved) break;
  }
  return CHIPS.map((_, i) => ({ ang: ang[i], R: ringOf(i), ...box(i, ang[i], ringOf(i)) }));
}
export const CHIP_LAYOUT = chipLayout();
function chips() {
  const r = rng(21); let h = '';
  CHIPS.forEach(([lb, vl, mk], i) => {
    const { x, y, ang, R } = CHIP_LAYOUT[i];
    const fx = 960 + (r() - 0.5) * 2600, fy = 540 + (r() - 0.5) * 1300, fz = 0.6 + r() * 2.6;   // the drift field
    const lead = mk ? (mk.length > 1 ? mk.length * 34 + 8 : 34) : 18;
    const marks = mk ? `<div class="mk">${mk.map((m) => tile(m, mk.length > 1 ? 30 : 40, 0.66)).join('')}</div>` : '';
    h += `<div class="chip${mk ? ' has-mk' : ''}" id="chip${i}" data-x="${x.toFixed(1)}" data-y="${y.toFixed(1)}" data-ang="${ang.toFixed(4)}" data-ring="${R}" data-fx="${fx.toFixed(1)}" data-fy="${fy.toFixed(1)}" data-fz="${fz.toFixed(3)}">` +
         `<div class="dt"></div><div class="dg"></div>${marks}<div class="lb" data-layout-allow-occlusion data-layout-allow-overlap style="left:${lead}px">${esc(lb)}</div><div class="vl" data-layout-allow-occlusion data-layout-allow-overlap style="left:${lead + 2}px">${esc(vl)}</div></div>`;
  });
  return h;
}

// ---------------------------------------------------------------- 10–13: the editor's code (original)
const CODE = [
  ['<span class="k">async function</span> <span class="f">growClinic</span>(goal) {'],
  ['  <span class="k">const</span> site    = <span class="k">await</span> <span class="f">audit</span>(goal.website);'],
  ['  <span class="k">const</span> pages   = <span class="k">await</span> <span class="f">optimise</span>(site.pages);'],
  ['  <span class="k">const</span> profile = <span class="k">await</span> <span class="f">syncProfile</span>(goal.location);'],
  [''],
  ['  <span class="k">const</span> aiSearch = <span class="s" id="errv">"not cited"</span>;', 'err'],
  [''],
  ['  <span class="k">for</span> (<span class="k">const</span> keyword <span class="k">of</span> goal.keywords) {'],
  ['    <span class="k">const</span> page = pages.<span class="f">match</span>(keyword);'],
  ['    page.schema = <span class="f">addFAQSchema</span>(page);'],
  ['    page.rank   = <span class="k">await</span> <span class="f">track</span>(keyword);'],
  ['    <span class="k">if</span> (page.rank &gt; 3) <span class="f">improve</span>(page);'],
  ['  }'],
  ['  <span class="k">return</span> <span class="f">report</span>(site, profile);'],
  ['}'],
];
export const CODE_PLAIN = CODE.map(([h]) => h.replace(/<[^>]+>/g, '').replace(/&gt;/g, '>').replace(/&lt;/g, '<'));
function code() {
  return CODE.map(([h, kind], i) => {
    const w = CODE_PLAIN[i].length * 12.6 + 82 + 18;      // JetBrains Mono 21px ≈ 12.6 px per char
    return `<div class="ln" id="ln${i}"><div class="hl ${kind === 'err' ? 'bad' : 'ok'}"></div><span class="no">${i + 1}</span><span class="tx" data-layout-allow-occlusion>${h || ' '}</span>` +
      (h ? `<span class="ck" style="left:${w.toFixed(0)}px">✓</span>` : '') +
      (kind === 'err' ? `<span class="x" style="left:${w.toFixed(0)}px">✕</span><span class="fx" style="left:${(w + 44).toFixed(0)}px">fixing…</span>` : '') + '</div>';
  }).join('');
}

// ---------------------------------------------------------------- the real lockup, glyph by glyph
const LOGO_SRC = fs.readFileSync('assets/brand/wss-logo.svg', 'utf8');
const pathOf = (id) => {
  const m = LOGO_SRC.match(new RegExp(`<path[^>]*?id="${id}"[^>]*?/>`, 's')) || LOGO_SRC.match(new RegExp(`<path(?:(?!/>).)*?id="${id}"(?:(?!/>).)*?/>`, 's'));
  if (!m) throw new Error('logo path missing: ' + id);
  return m[0].match(/\sd="([^"]+)"/)[1];
};
const WORD = [['W', ['path21']], ['dot', ['circle23']], ['E', ['path26']], ['B', ['path29', 'path31']], ['S', ['path34']], ['P', ['path37']],
              ['I', ['path40']], ['D', ['path43']], ['E2', ['path46']], ['R', ['path49']]];
const SOL = ['path522101', 'path522103', 'path522105', 'path522107', 'path522109', 'path522111', 'path522113', 'path522115', 'path522117'];
function lockup(p, white) {
  const slate = white ? '#ffffff' : '#5a5e64', green = white ? '#ffffff' : '#92c131';
  let s = `<svg class="logo" id="${p}-logo" viewBox="120 225 785 315" data-layout-allow-overflow><defs>` +
          `<clipPath id="${p}-cw"><rect x="100" y="395" width="830" height="104"/></clipPath>` +
          `<clipPath id="${p}-cs"><rect x="100" y="493" width="830" height="52"/></clipPath></defs>` +
          `<g transform="translate(-0.003265,-1.8261)">`;
  s += `<g id="${p}-icon"><path d="${pathOf('icon')}" fill="${green}"/></g>`;
  s += `<g clip-path="url(#${p}-cw)">`;
  for (const [n, ids] of WORD) s += `<g class="gl gw" id="${p}-${n}">${ids.map((id) => `<path d="${pathOf(id)}" fill="${n === 'dot' ? green : slate}"/>`).join('')}</g>`;
  s += `</g><g clip-path="url(#${p}-cs)">`;
  SOL.forEach((id, i) => { s += `<g class="gl gs" id="${p}-s${i}"><path d="${pathOf(id)}" fill="${green}"/></g>`; });
  return s + '</g></g></svg>';
}

export default function props(name) {
  switch (name) {
    case 'shards': return shards();
    case 'net': return net();
    case 'cards': return cards();
    case 'chips': return chips();
    case 'code': return code();
    case 'logo-brand': return lockup('lb', false);
    case 'logo-end': return lockup('le', true);
  }
  throw new Error('unknown props block ' + name);
}
