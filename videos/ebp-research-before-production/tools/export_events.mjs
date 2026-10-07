// Export the physics events for the SFX. Run from the project root:  node tools/export_events.mjs
// Loads timeline.json as window.TL would be, evaluates src/physics.js, writes assets/audio/steps.json + clap.json.
import fs from 'node:fs';
import vm from 'node:vm';

globalThis.TL = JSON.parse(fs.readFileSync('timeline.json', 'utf8'));
vm.runInThisContext(fs.readFileSync('src/physics.js', 'utf8'), { filename: 'src/physics.js' });
const P = globalThis.PHYS;
const steps = P.STEPS.concat(P.END_STEPS).map((s) => ({ t: s.t, g: s.word ? 1 : s.mark ? 1.15 : 0.8 }));
fs.writeFileSync('assets/audio/steps.json', JSON.stringify(steps, null, 1));
fs.writeFileSync('assets/audio/clap.json', JSON.stringify(P.CLAP_EVENTS, null, 1));
console.log('steps', steps.map((s) => s.t).join(' '), '\nclap ', P.CLAP_EVENTS.map((e) => `${e.t}(${e.g})`).join(' '));
