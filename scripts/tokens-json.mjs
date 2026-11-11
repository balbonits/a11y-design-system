// Generates src/tokens.json from the three token layers in src/tokens/ (R-2), for non-CSS consumers
// and for the contrast gate. Shape: primitives, semantic colors as resolved hex per theme.mode,
// semantic shape per theme, and component tokens.
import fs from 'node:fs';
const read = (f) => fs.readFileSync(new URL(`../src/tokens/${f}`, import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const decls = (body) => Object.fromEntries([...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
const blocks = (css) => [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1].trim(), body: decls(m[2]) }));

const prim = decls(read('primitives.css'));
const primitives = Object.fromEntries(Object.entries(prim).filter(([k]) => k.startsWith('palette-')).map(([k, v]) => [k.slice(8), v]));
const sem = blocks(read('semantic.css')).filter((b) => !b.sel.startsWith('@media'));
const resolve = (v) => v.replace(/var\(--palette-([\w-]+)\)/g, (_, k) => primitives[k] ?? (() => { throw new Error(`unknown palette ${k}`); })());

const themes = ['editorial', 'bold', 'tactile'];
const semantic = {};
const semantic_shape = {};
for (const t of themes) {
  const own = sem.filter((b) => b.sel.includes(`[data-theme="${t}"]`) && !b.sel.startsWith('@'));
  const shape = own.find((b) => !b.sel.includes('data-mode'));
  const light = own.find((b) => b.sel.includes(':not([data-mode="dark"])'));
  const dark = own.find((b) => b.sel.includes('[data-mode="dark"]') && !b.sel.includes(':not([data-mode="dark"])'));
  if (!shape || !light || !dark) throw new Error(`missing blocks for ${t}`);
  semantic_shape[t] = Object.fromEntries(Object.entries(shape.body).map(([k, v]) => [`--${k}`, v]));
  for (const [m, b] of [['light', light], ['dark', dark]]) semantic[`${t}.${m}`] = Object.fromEntries(Object.entries(b.body).map(([k, v]) => [`--${k}`, resolve(v)]));
}
const components = Object.fromEntries(Object.entries(decls(read('components.css'))));
const out = { primitives, semantic, semantic_shape, components };
fs.writeFileSync(new URL('../src/tokens.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
console.log(`tokens.json: ${Object.keys(primitives).length} primitives, ${Object.keys(semantic).length} theme x mode combos, ${Object.keys(components).length} component tokens`);
