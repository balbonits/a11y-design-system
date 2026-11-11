// The theme contract (ARCH-REVIEW Addendum 5 plus the semantic colors). Every registered theme must
// define every name here (0 or none when unused). Shared by tokens-json.mjs, contrast.mjs and the tests.
import fs from 'node:fs';

export const COLOR_TOKENS = [
  '--color-bg', '--surface', '--surface-muted', '--text', '--text-muted', '--border', '--border-subtle',
  '--accent', '--accent-hover', '--accent-soft', '--accent-contrast', '--focus-ring-color',
  '--success', '--warning', '--danger', '--danger-hover', '--danger-contrast', '--info',
  '--highlight', '--highlight-contrast', '--scrim',
];
export const SHAPE_TOKENS = [
  '--radius-sm', '--radius-md', '--radius-lg', '--radius-xl', '--radius-full',
  '--border-width', '--border-width-strong',
  '--shadow-raised', '--shadow-press',
  '--focus-ring-width', '--focus-ring-offset', '--focus-ring-style',
  '--control-height', '--control-padding-x', '--control-gap', '--target-min',
  '--divider-shape', '--tilt', '--lift', '--press-offset',
];
export const TYPE_MOTION_TOKENS = [
  '--font-display', '--font-body', '--font-mono', '--weight-display',
  '--duration-fast', '--duration-base', '--duration-slow', '--ease-standard', '--ease-press',
];
/** Addendum 7 (a): registered theme extras. Every theme defines them, with neutral defaults (0 or none) when unused.
 *  --rule is decorative only; a boundary that identifies a control uses --border. */
export const EXTRA_TOKENS = [
  '--rule', '--shadow-overlay', '--weight-display-min', '--weight-display-max', '--weight-shift',
  '--duration-reveal', '--duration-ticker', '--stagger', '--blur-glass', '--parallax-scale', '--hue-shift',
];
/** Motion tokens that must resolve to 0 under prefers-reduced-motion (Addendum 5 tilt/lift, Addendum 7 motion extras,
 *  Addendum 8 --press-offset). */
export const REDUCED_ZERO = ['--tilt', '--lift', '--press-offset', '--parallax-scale', '--hue-shift', '--stagger', '--weight-shift', '--duration-reveal'];
/** Every name a component token may read (R-2a: one level deep, only Addendum 5/7 names). */
export const CONTRACT = () => [...COLOR_TOKENS, ...SHAPE_TOKENS, ...TYPE_MOTION_TOKENS, ...EXTRA_TOKENS];
/** Names retired by Addendum 5. Zero uses allowed anywhere in src/, stories/ or scripts/ output. */
export const RETIRED = ['--radius', '--focus', '--radius-field', '--radius-control', '--radius-surface', '--shadow-1', '--shadow-2', '--focus-offset', '--focus-ring'];

export const registry = () => JSON.parse(fs.readFileSync(new URL('../src/themes/registry.json', import.meta.url), 'utf8'));

/** Parses one theme file into its blocks: palette (:root), base, light, dark, reduced (reduced motion). */
export function parseTheme(css, id) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const decls = (body) => Object.fromEntries([...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
  const out = { palette: {}, base: {}, light: {}, dark: {}, reduced: {}, osDark: {} };
  let i = 0; const stack = [];
  while (i < css.length) {
    const open = css.indexOf('{', i); const close = css.indexOf('}', i);
    if (close === -1) break;
    if (open !== -1 && open < close) {
      const sel = css.slice(i, open).trim(); const next = css.indexOf('{', open + 1); const end = css.indexOf('}', open + 1);
      if (sel.startsWith('@media')) { stack.push(sel); i = open + 1; continue; }
      if (next !== -1 && next < end) throw new Error(`${id}: nested rule inside ${sel}`);
      const body = decls(css.slice(open + 1, end)); const media = stack.join(' ');
      if (sel === ':root') Object.assign(out.palette, body);
      else if (!sel.includes(`[data-theme="${id}"]`)) throw new Error(`${id}: selector ${sel} is not scoped to the theme`);
      else if (media.includes('reduced-motion')) Object.assign(out.reduced, body);
      else if (media.includes('prefers-color-scheme: dark')) Object.assign(out.osDark, body);
      else if (sel.includes('[data-mode="dark"]')) Object.assign(out.dark, body);
      else if (sel.includes('[data-mode="light"]')) Object.assign(out.light, body);
      else Object.assign(out.base, body);
      i = end + 1;
    } else { stack.pop(); i = close + 1; }
  }
  return out;
}

/** Resolves var(--palette-*) and other var() references inside one theme+mode to plain values. */
export function resolver(t, mode) {
  const scope = { ...t.palette, ...t.base, ...(mode === 'dark' ? t.dark : t.light) };
  const res = (v, depth = 0) => {
    if (depth > 10) throw new Error(`var() cycle in ${v}`);
    return v.replace(/var\((--[\w-]+)\)/g, (_, k) => {
      if (!(k in scope)) throw new Error(`unknown ${k}`);
      return res(scope[k], depth + 1);
    });
  };
  return (name) => (name in scope ? res(scope[name]) : undefined);
}

/** Parses a flat CSS file into { name: value } (comments stripped). */
export const declsOf = (css) => Object.fromEntries([...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));

/** R-2a component-layer rules. Returns a list of problems (empty = pass):
 *  - each component token is exactly var(--<contract name>) or a calc() of only contract names;
 *  - no literals, no var() fallbacks, no component token reading another component token;
 *  - no theme sets a component token. */
export function componentLayerProblems(components, themes) {
  const names = new Set(CONTRACT()); const comp = new Set(Object.keys(components)); const out = [];
  for (const [k, v] of Object.entries(components)) {
    const single = v.match(/^var\((--[\w-]+)\)$/);
    const refs = [...v.matchAll(/var\(([^)]*)\)/g)].map((m) => m[1].trim());
    if (refs.some((r) => r.includes(','))) { out.push(`${k}: var() fallback in "${v}"`); continue; }
    if (!single) {
      const calc = /^calc\((.*)\)$/.exec(v);
      const rest = calc ? calc[1].replace(/var\(--[\w-]+\)/g, '').replace(/[\s()*/+-]/g, '') : 'x';
      if (!calc || rest !== '') { out.push(`${k}: must be var(--name) or calc() of names only, got "${v}"`); continue; }
    }
    for (const r of refs) {
      if (comp.has(r)) out.push(`${k}: reads component token ${r} (one level deep only)`);
      else if (!names.has(r)) out.push(`${k}: reads ${r}, which is not an Addendum 5/7 name`);
    }
  }
  for (const [id, t] of Object.entries(themes)) for (const block of Object.values(t)) for (const k of Object.keys(block)) if (comp.has(k)) out.push(`theme ${id} sets component token ${k}`);
  return out;
}
