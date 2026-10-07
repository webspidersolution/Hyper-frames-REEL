// Scaffold a hyperreel project:
//   node <skill>/scripts/scaffold.mjs videos/<slug> [--formats 9x16,16x9] [--duration 30] [--bpm 120] [--fps 60] [--title "…"]
// Creates the HyperFrames project (npx hyperframes init), copies the starter (src/, tools/, timeline.json),
// copies the audio + review scripts into tools/, and writes BRIEF.md. Refuses an existing non-empty folder.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const dest = argv[0];
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
if (!dest || dest.startsWith('--')) { console.error('usage: node scaffold.mjs videos/<slug> [--formats 9x16,16x9] [--duration 30] [--bpm 120] [--title "…"]'); process.exit(1); }
if (fs.existsSync(dest) && fs.readdirSync(dest).length) { console.error(`REFUSING: ${dest} exists and is not empty. Pick a new slug.`); process.exit(2); }

const formats = opt('formats', '9x16,16x9').split(',').map((s) => s.trim()).filter(Boolean);
const duration = +opt('duration', 30), bpm = +opt('bpm', 120), fps = +opt('fps', 60);
const title = opt('title', path.basename(dest));

// 1. HyperFrames project
const r = spawnSync(`npx hyperframes init ${JSON.stringify(dest)} --non-interactive --example=blank --skill=general-video`, { stdio: 'inherit', shell: true });
if (r.status) { console.error('hyperframes init failed'); process.exit(r.status || 1); }

// 2. starter files
const cp = (from, to) => { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.cpSync(from, to, { recursive: true }); };
cp(path.join(SKILL, 'templates', 'src'), path.join(dest, 'src'));
cp(path.join(SKILL, 'templates', 'tools'), path.join(dest, 'tools'));
for (const f of ['score.py', 'sfx.py', 'mix.py', 'review.py']) cp(path.join(SKILL, 'scripts', f), path.join(dest, 'tools', f));
for (const d of ['fonts', 'brand', 'photos', 'audio', 'tex', 'icons']) fs.mkdirSync(path.join(dest, 'assets', d), { recursive: true });
cp(path.join(SKILL, 'templates', 'assets'), path.join(dest, 'assets'));   // starter fonts (OFL) + grain texture

const tl = JSON.parse(fs.readFileSync(path.join(SKILL, 'templates', 'timeline.json'), 'utf8'));
// template times sit on a 120 bpm grid (2 s bars): scale them by the bar-length ratio so they stay on this bpm's bars
const k = (60 / bpm * 4) / 2, fit = (v) => +Math.min(v * k, duration).toFixed(4);
for (const m in tl.marks) tl.marks[m] = fit(tl.marks[m]);
for (const s of tl.music.sections) s.at = fit(s.at);
tl.music.accents = tl.music.accents.map(fit);
for (const e of tl.sfx) if ('at' in e) e.at = fit(e.at);
Object.assign(tl, { title, duration, bpm, fps, formats });
fs.writeFileSync(path.join(dest, 'timeline.json'), JSON.stringify(tl, null, 2));

fs.writeFileSync(path.join(dest, 'BRIEF.md'), `---
workflow: general-video
flow: automation
storyboard: no
message: "${title}"
aspect: ${formats[0] === '16x9' ? '1920x1080' : formats[0] === '1x1' ? '1080x1080' : '1080x1920'}
length: ${duration}s
---

## Intent

<what the video is, for whom, the user's own words>

## Assets

- <path> — <what it is, where it belongs>

## Customizations

- Built with /hyperreel: Three.js hero + HTML type, original synthesized score, code + library SFX, -14 LUFS, GPU renders.
- Formats: ${formats.join(', ')}

## Notes

### Stated by the user
### Inferred (defaults chosen without asking)
`);
fs.writeFileSync(path.join(dest, 'STORYBOARD.md'), `---\nformat: ${formats[0]}\nmessage: "${title}"\nduration: ${duration}s\nbpm: ${bpm}\n---\n\n## Design\n\n- Concept angle:\n- Type:\n- Palette / type / focal element / background roles:\n\n## Frame 1 — Hook (0.0–2.0 s)\n\n- scene:\n- transition_in: cut (frame 0 already moving)\n- rules:\n- sfx:\n- status: outline\n`);
console.log(`\nscaffolded ${dest}\n  formats ${formats.join(', ')} · ${duration}s · ${bpm} bpm · ${fps} fps\nnext:\n  cd ${dest}\n  python tools/score.py && node tools/build.mjs && npx hyperframes lint`);
