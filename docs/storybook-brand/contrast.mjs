// STORYBOOK-BRAND contrast gate (neo's contrast.mjs method: WCAG 2.x relative luminance, text 4.5:1, UI and focus 3:1).
// Usage: node docs/storybook-brand/contrast.mjs   (run from the repo root or anywhere). Writes CONTRAST.md here; exits 1 on any fail.
// Colors come from src/tokens.json (themes.neo) through theme-map.json, so this gates the exact values manager.ts ships.
// Storybook-derived colors (tree hover) are computed with the same polished lighten/darken that @storybook/core 8.6 uses.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url)); const root = path.resolve(here, '../..');
const neo = JSON.parse(fs.readFileSync(path.join(root, 'src/tokens.json'), 'utf8')).themes.neo;
const M = JSON.parse(fs.readFileSync(path.join(here, 'theme-map.json'), 'utf8'));
let fail = 0; const out = [];
// 1. manager.ts MAP and CSS_VARS must equal theme-map.json (no drift between the spec and the code shape).
const ts = fs.readFileSync(path.join(here, 'mock/manager.ts'), 'utf8');
const grab = (name) => { const m = ts.match(new RegExp(`const ${name} = \\{([\\s\\S]*?)\\}( as const)?;`)); return m ? m[1] : ''; };
const mapTs = Object.fromEntries([...grab('MAP').matchAll(/(\w+): \['(--[\w-]+)', '(--[\w-]+)'\]/g)].map(m => [m[1], [m[2], m[3]]]));
const varsTs = Object.fromEntries([...grab('CSS_VARS').matchAll(/'(--[\w-]+)': '(--[\w-]+)'/g)].map(m => [m[1], m[2]]));
if (JSON.stringify(mapTs) !== JSON.stringify(M.fields)) { fail++; out.push('FAIL drift: mock/manager.ts MAP differs from theme-map.json fields'); }
if (JSON.stringify(varsTs) !== JSON.stringify(M.cssVars)) { fail++; out.push('FAIL drift: mock/manager.ts CSS_VARS differs from theme-map.json cssVars'); }
// 2. Every mapped token resolves to a hex color in both modes.
const HEX = /^#[0-9a-f]{6}$/i;
for (const [mode, i] of [['light', 0], ['dark', 1]]) {
  for (const [f, pair] of Object.entries(M.fields)) if (!HEX.test(neo[mode][pair[i]] || '')) { fail++; out.push(`FAIL lint ${mode} ${f} ${pair[i]} does not resolve to a color`); }
  for (const [v, t] of Object.entries(M.cssVars)) if (!HEX.test(neo[mode][t] || '')) { fail++; out.push(`FAIL lint ${mode} ${v} ${t} does not resolve to a color`); }
}
// A token that doesn't resolve stops here: FAIL lines and exit 1, never a stack trace.
if (out.some(l => l.startsWith('FAIL lint'))) { for (const l of out) console.log(l); console.log('lint failed, pairs not checked,', fail, 'failures'); process.exit(1); }
const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(x => x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };
// polished lighten/darken (HSL lightness +/- amount, clamped), as in @storybook/core/dist/manager/runtime.js
const toHsl = h => { const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; if (mx === mn) return [0, 0, l]; const d = mx - mn, s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); const hh = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [hh * 60, s, l]; };
const fromHsl = ([h, s, l]) => { const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2; const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; return '#' + [r, g, b].map(v => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join(''); };
const shift = (amt, h) => { const [a, s, l] = toHsl(h); return fromHsl([a, s, Math.max(0, Math.min(1, l + amt))]); };
const rows = [];
for (const [mode, i] of [['light', 0], ['dark', 1]]) {
  const F = Object.fromEntries(Object.entries(M.fields).map(([f, p]) => [f, neo[mode][p[i]]]));
  const V = Object.fromEntries(Object.entries(M.cssVars).map(([v, t]) => [v, neo[mode][t]]));
  const hover = mode === 'light' ? shift(.45, F.colorSecondary) : shift(-.35, F.colorSecondary); // TreeNode hover: lighten(.45) / darken(.35) of colorSecondary
  const P = [
    ['text', 'Sidebar tree text, brand wordmark', 'textColor', F.textColor, 'appBg', F.appBg],
    ['text', 'Panel and content text', 'textColor', F.textColor, 'appContentBg', F.appContentBg],
    ['text', 'Sidebar subheadings (TOKENS, COMPONENTS)', 'textMutedColor', F.textMutedColor, 'appBg', F.appBg],
    ['text', 'Muted text in panels', 'textMutedColor', F.textMutedColor, 'appContentBg', F.appContentBg],
    ['text', 'Toolbar labels and icons', 'barTextColor', F.barTextColor, 'barBg', F.barBg],
    ['text', 'Toolbar selected tab or tool', 'barSelectedColor', F.barSelectedColor, 'barBg', F.barBg],
    ['text', 'Toolbar hover', 'barHoverColor', F.barHoverColor, 'barBg', F.barBg],
    ['text', 'Search and control input text', 'inputTextColor', F.inputTextColor, 'inputBg', F.inputBg],
    ['text', 'Search input text (sidebar field is transparent on appBg)', 'inputTextColor', F.inputTextColor, 'appBg', F.appBg],
    ['text', 'Selected sidebar row text and icon (--eb-selected-text, manager-head.html)', '--eb-selected-text', V['--eb-selected-text'], 'colorSecondary', F.colorSecondary],
    ['text', 'Sidebar row text on hover (derived)', 'textColor', F.textColor, 'tree hover ' + (mode === 'light' ? 'lighten(.45)' : 'darken(.35)'), hover],
    ['text', 'Inverse text (tooltips, inverse surfaces)', 'textInverseColor', F.textInverseColor, 'textColor', F.textColor],
    ['text', 'Accent text and links in panels (colorSecondary)', 'colorSecondary', F.colorSecondary, 'appContentBg', F.appContentBg],
    ['text', 'Boolean control selected label', 'textColor', F.textColor, 'booleanSelectedBg', F.booleanSelectedBg],
    ['ui', 'Sidebar and panel borders', 'appBorderColor', F.appBorderColor, 'appBg', F.appBg],
    ['ui', 'Panel borders on content', 'appBorderColor', F.appBorderColor, 'appContentBg', F.appContentBg],
    ['ui', 'Input border', 'inputBorder', F.inputBorder, 'inputBg', F.inputBg],
    ['ui', 'Search field border on sidebar', 'inputBorder', F.inputBorder, 'appBg', F.appBg],
    ['ui', 'Button border', 'buttonBorder', F.buttonBorder, 'buttonBg', F.buttonBg],
    ['ui', 'Selected sidebar row fill', 'colorSecondary', F.colorSecondary, 'appBg', F.appBg],
    ['ui', 'Toolbar selected indicator', 'barSelectedColor', F.barSelectedColor, 'barBg', F.barBg],
    ['ui', 'Brand mark outline (blob border)', '--eb-border', V['--eb-border'], 'appBg', F.appBg],
    ['focus', 'Brand link focus ring', '--eb-focus', V['--eb-focus'], 'appBg', F.appBg],
    ['focus', 'Brand link focus ring vs wordmark', '--eb-focus', V['--eb-focus'], '--eb-text', V['--eb-text']],
    ['focus', "Storybook's own focus border (colorSecondary) in toolbar", 'colorSecondary', F.colorSecondary, 'barBg', F.barBg],
    ['focus', "Storybook's own focus border (colorSecondary) in sidebar", 'colorSecondary', F.colorSecondary, 'appBg', F.appBg],
  ];
  for (const [kind, use, fn, fh, bn, bh] of P) { const min = kind === 'text' ? 4.5 : 3; const r = cr(fh, bh); rows.push([mode, kind, use, fn, fh, bn, bh, min, r]); if (r < min) { fail++; out.push(`FAIL ${mode} ${use}: ${fn} ${fh} on ${bn} ${bh} ${r.toFixed(2)} < ${min}`); } }
}
const md = ['# Storybook brand contrast', '', `${rows.length} pairs checked, ${fail} failures. Text 4.5:1, UI and focus 3:1 (WCAG 2.2 AA 1.4.3, 1.4.11). Generated by contrast.mjs from src/tokens.json (themes.neo) via theme-map.json; mock/manager.ts is checked against the same map.`, '',
  '| Mode | Kind | Where | Foreground | Background | Min | Ratio | Result |', '|---|---|---|---|---|---|---|---|',
  ...rows.map(([m, k, u, fn, fh, bn, bh, min, r]) => `| ${m} | ${k} | ${u} | ${fn} \`${fh}\` | ${bn} \`${bh}\` | ${min} | ${r.toFixed(2)} | ${r >= min ? 'pass' : 'FAIL'} |`)].join('\n') + '\n';
fs.writeFileSync(path.join(here, 'CONTRAST.md'), md);
for (const l of out) console.log(l);
console.log(rows.length, 'pairs checked,', fail, 'failures');
process.exit(fail ? 1 : 0);
