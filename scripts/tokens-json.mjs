// Exports src/tokens.css (the one source of truth) to src/tokens.json for non-CSS consumers.
import fs from 'node:fs';
const css = fs.readFileSync(new URL('../src/tokens.css', import.meta.url), 'utf8');
const block = (re) => Object.fromEntries([...(css.match(re)?.[1] ?? '').matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
const light = block(/:root \{([\s\S]*?)\n\}/);
const dark = block(/\[data-theme="dark"\] \{([\s\S]*?)\n\}/);
const resolve = (v, scope) => v.replace(/var\(--([\w-]+)\)/g, (_, k) => resolve(scope[k] ?? light[k] ?? '', scope));
const out = { light: {}, dark: {} };
for (const [k, v] of Object.entries(light)) out.light[k] = resolve(v, light);
for (const [k, v] of Object.entries(dark)) out.dark[k] = resolve(v, { ...light, ...dark });
fs.writeFileSync(new URL('../src/tokens.json', import.meta.url), JSON.stringify(out, null, 2) + '\n');
console.log(`tokens.json: ${Object.keys(out.light).length} light, ${Object.keys(out.dark).length} dark`);
