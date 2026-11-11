// STORYBOOK-DOCS-THEME contrast gate (token level). Every docs-chrome color pair, from neo tokens (src/tokens.json),
// light and dark. Text 4.5:1 (large headings 3:1), UI and focus 3:1. Also checks that mock/preview.tsx's DOCS_MAP
// matches theme-map.json, and prints the rendered lows from docs-check.cjs on this design vs main (results/).
// Usage: node docs/storybook-docs-theme/contrast.mjs   (exits 1 on any failure or map mismatch)
import fs from 'node:fs';
const here = new URL('.', import.meta.url);
const neo = JSON.parse(fs.readFileSync(new URL('../../src/tokens.json', here), 'utf8')).themes.neo;
const map = JSON.parse(fs.readFileSync(new URL('theme-map.json', here), 'utf8'));
const lum = (h) => { const n = parseInt(h.slice(1), 16); const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
let fail = 0;
// Map check: mock/preview.tsx DOCS_MAP == theme-map.json fields.
const src = fs.readFileSync(new URL('mock/preview.tsx', here), 'utf8');
const block = src.slice(src.indexOf('const DOCS_MAP'), src.indexOf('} as const;', src.indexOf('const DOCS_MAP')));
const mock = Object.fromEntries([...block.matchAll(/(\w+): \['([^']+)', '([^']+)'\]/g)].map((m) => [m[1], [m[2], m[3]]]));
for (const [f, v] of Object.entries(map.fields)) if (JSON.stringify(mock[f]) !== JSON.stringify(v)) { fail++; console.log(`MAP MISMATCH ${f}: mock ${JSON.stringify(mock[f])} vs theme-map ${JSON.stringify(v)}`); }
if (Object.keys(mock).length !== Object.keys(map.fields).length) { fail++; console.log('MAP MISMATCH: field count'); }
// Pairs: [label, fg token (or {light,dark}), bg token, min]
const link = { light: '--accent-hover', dark: '--accent' };
const PAIRS = [
  ['Body text on page', '--text', '--surface', 4.5],
  ['Muted text (Stories label, ArgTypes header) on page', '--text-muted', '--surface', 4.5],
  ['Headings h1-h2 on page', '--text', '--surface', 4.5],
  ['Link on page', link, '--surface', 4.5],
  ['Link in a zebra table row', link, '--surface-muted', 4.5],
  ['Text in a zebra table row', '--text', '--surface-muted', 4.5],
  ['Inline code text on its chip', '--text', '--surface-muted', 4.5],
  ['Code: plain', '--text', '--surface-muted', 4.5],
  ['Code: keyword, tag, class-name', link, '--surface-muted', 4.5],
  ['Code: attr-name', '--warning', '--surface-muted', 4.5],
  ['Code: string, attr-value', '--success', '--surface-muted', 4.5],
  ['Code: punctuation, operator, comment', '--text-muted', '--surface-muted', 4.5],
  ['ArgTypes required asterisk', '--danger', '--surface', 4.5],
  ['Copy / Show code label', '--text', '--surface', 4.5],
  ['Canvas toolbar zoom icon (barTextColor on barBg)', '--text-muted', '--surface', 3],
  ['Canvas border on page', '--border', '--surface', 3],
  ['Code-block border on page', '--border', '--surface', 3],
  ['Copy / Show code border on story canvas', '--border', '--color-bg', 3],
  ['Copy border on code block', '--border', '--surface-muted', 3],
  ['Rules and table lines (appBorderColor)', '--border-subtle', '--surface', 3],
  ['Focus ring on page', '--focus-ring-color', '--surface', 3],
  ['Focus ring on code block / zebra row', '--focus-ring-color', '--surface-muted', 3],
  ['Focus ring on story canvas', '--focus-ring-color', '--color-bg', 3],
];
const rows = [];
for (const [label, fg, bg, min] of PAIRS) {
  const r = ['light', 'dark'].map((m) => { const f = typeof fg === 'string' ? fg : fg[m]; const v = ratio(neo[m][f], neo[m][bg]); if (v < min) { fail++; console.log(`FAIL ${m} ${label}: ${v.toFixed(2)} < ${min}`); } return v; });
  rows.push(`| ${label} | ${typeof fg === 'string' ? fg : `${fg.light} / ${fg.dark}`} on ${bg} | ${min} | ${r[0].toFixed(2)} | ${r[1].toFixed(2)} |`);
}
console.log('| Pair | Tokens (light / dark) | Min | Light | Dark |\n|---|---|---|---|---|\n' + rows.join('\n'));
// Rendered lows, this design vs main (from docs-check.cjs). On main the docs page ignores Mode, so its "dark" rows are the light page.
const lows = (f) => { const t = fs.readFileSync(new URL(`results/${f}`, here), 'utf8'); return Object.fromEntries([...t.matchAll(/^ {2}(light|dark) (.+): ([\d.]+)$/gm)].map((m) => [`${m[1]} ${m[2]}`, +m[3]])); };
const a = lows('docs-check-new.txt'), b = lows('docs-check-main-80f782d.txt'); let up = 0, same = 0, down = 0; const d = [];
for (const k of Object.keys(a)) { if (!(k in b)) continue; const s = a[k] > b[k] + 0.005 ? 'up' : a[k] < b[k] - 0.005 ? 'DOWN' : 'same'; if (s === 'up') up++; else if (s === 'same') same++; else down++; d.push(`| ${k} | ${b[k].toFixed(2)} | ${a[k].toFixed(2)} | ${s} |`); }
console.log('\nRendered lowest ratio by kind, main 80f782d vs this design:\n| Mode, kind | main | this | |\n|---|---|---|---|\n' + d.join('\n'));
console.log(`\n${PAIRS.length * 2} token pairs checked, ${fail} failures; rendered kinds vs main: ${up} up, ${same} same, ${down} down`);
process.exit(fail ? 1 : 0);
