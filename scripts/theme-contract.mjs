// The theme contract (ARCH-REVIEW Addendum 5 plus the semantic colors). Every registered theme must
// define every name here (0 or none when unused). Shared by tokens-json.mjs, contrast.mjs and the tests.
import fs from 'node:fs';

export const COLOR_TOKENS = [
  '--color-bg', '--surface', '--surface-muted', '--text', '--text-muted', '--border', '--border-subtle',
  '--accent', '--accent-hover', '--accent-soft', '--accent-contrast', '--focus-ring-color',
  '--success', '--warning', '--danger', '--danger-hover', '--danger-contrast', '--info',
  '--highlight', '--highlight-contrast',
];
export const SHAPE_TOKENS = [
  '--radius-sm', '--radius-md', '--radius-lg', '--radius-full',
  '--border-width', '--border-width-strong',
  '--shadow-raised', '--shadow-press',
  '--focus-ring-width', '--focus-ring-offset', '--focus-ring-style',
  '--control-height', '--control-padding-x', '--control-gap', '--target-min',
  '--divider-shape', '--tilt', '--lift',
];
export const TYPE_MOTION_TOKENS = [
  '--font-display', '--font-body', '--font-mono', '--weight-display',
  '--duration-fast', '--duration-base', '--duration-slow', '--ease-standard', '--ease-press',
];
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
