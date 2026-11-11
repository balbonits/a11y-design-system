// Token lint (R-2, Addendum 5). Fails on:
//  1. raw colors (hex, rgb(), hsl()) or --palette-* in component CSS or the component token layer;
//     theme files may hold raw colors only in --palette-* declarations;
//  2. any literal border-radius, border width, box-shadow or outline in component CSS (only var(), 0,
//     none, keywords, and calc() over var() are allowed);
//  3. component tokens that are anything but var() of other tokens;
//  4. any retired token name (--radius, --focus, --radius-field/control/surface, --shadow-1/2, ...)
//     anywhere in src/, stories/ or .storybook/.
import fs from 'node:fs';
import path from 'node:path';
import { RETIRED } from './theme-contract.mjs';

const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
let bad = 0;
const fail = (f, i, line, why) => { bad++; console.log(`FAIL ${f}:${i + 1} (${why}): ${line.trim()}`); };
const rawColor = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;

// 1 + 2: component CSS
const SHAPE_PROPS = /^\s*(border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-width)?|border-radius|border-(top|bottom)-(left|right)-radius|box-shadow|outline(-width|-offset)?)\s*:\s*(.+)$/;
const KEYWORDS = new Set(['0', 'none', 'solid', 'dashed', 'dotted', 'double', 'transparent', 'currentColor', 'currentcolor', 'inherit', 'initial', 'unset', 'CanvasText', 'Highlight', 'ButtonText']);
const shapeOk = (v) => {
  let s = v.replace(/!important/, '');
  while (/var\(/.test(s)) s = s.replace(/var\([^()]*\)/g, ' ');
  s = s.replace(/calc\(|min\(|max\(|[()*/+,]/g, ' ').replace(/(^|\s)-(?=\s)/g, ' ');
  return s.split(/\s+/).filter(Boolean).every((t) => KEYWORDS.has(t) || /^-?\d*\.?\d+$/.test(t));
};
for (const f of ['src/ember.css']) {
  strip(fs.readFileSync(f, 'utf8')).split('\n').forEach((line, i) => {
    if (rawColor.test(line) || line.includes('--palette-')) fail(f, i, line, 'raw color');
    for (const decl of line.split(/[;{}]/)) {
      const m = decl.match(SHAPE_PROPS);
      if (m && !shapeOk(m[m.length - 1])) fail(f, i, decl, `literal ${m[1]}`);
    }
  });
}
// 3: component token layer
{
  const f = 'src/tokens/components.css';
  strip(fs.readFileSync(f, 'utf8')).split('\n').forEach((line, i) => {
    const m = line.match(/(--[\w-]+):\s*([^;]+);/);
    if (m && !/^(var\(--[\w-]+\)\s*)+$/.test(m[2].trim()) && !/^var\(--[\w-]+\)( var\(--[\w-]+\))*$/.test(m[2].trim())) fail(f, i, line, 'component token is not var() only');
    if (rawColor.test(line) || line.includes('--palette-')) fail(f, i, line, 'raw color');
  });
}
// theme files: raw colors only in --palette-* declarations
for (const f of fs.readdirSync('src/themes').filter((n) => n.endsWith('.css')).map((n) => `src/themes/${n}`)) {
  strip(fs.readFileSync(f, 'utf8')).split('\n').forEach((line, i) => {
    if (rawColor.test(line) && !/^\s*--palette-[\w-]+:/.test(line)) fail(f, i, line, 'raw color outside a --palette-* primitive');
  });
}
// 4: retired names
const retired = new RegExp(`(${RETIRED.map((n) => n.replace(/-/g, '\\-')).join('|')})(?![\\w-])`);
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
for (const f of ['src', 'stories', '.storybook'].flatMap(walk).filter((f) => /\.(css|tsx?|mdx|json|html)$/.test(f))) {
  if (f === 'src/tokens.json') continue;
  fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => { if (retired.test(line)) fail(f, i, line, 'retired token name'); });
}
console.log(`token lint: ${bad} failures`);
process.exit(bad ? 1 : 0);
