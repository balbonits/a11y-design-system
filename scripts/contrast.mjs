// CI contrast and theme-contract gate (R-2, ARCH-REVIEW Addendum 5 / V-2b). For every registered theme
// (src/themes/registry.json) in light and dark:
//  - every text/bg pair reaches 4.5:1, every UI/bg pair 3:1 (incl. focus ring vs bg, surface AND border,
//    and --highlight-contrast on --highlight at 4.5:1);
//  - the open modal is identifiable (1.4.11, CA v0.3.1): the dialog border, or its surface when the border width is 0,
//    reaches 3:1 against --scrim alpha-composited over --color-bg, in light and dark, with text-muted under the scrim
//    at 3:1, no lightening and an 8-digit --scrim (scripts/lib/scrim.mjs, SCRIM-GATE; table in the Scrim section);
//  - --focus-ring-color reaches 3:1 against --color-bg, --surface (and --card-bg if it differs), --tabs-track and,
//    where a theme defines it, --hover-fill, in light and dark (WCAG 1.4.11 AA requirement, 2.4.13 AAA house aim;
//    scripts/lib/focus-ring.mjs, FOCUS-RING-GATE; table in the Focus ring section);
//  - --focus-ring-style is never none/hidden and --focus-ring-width is at least 2px;
//  - --target-min is at least 44px;
//  - every contract name is defined (Addendum 5 and 7, incl. --scrim, --radius-xl and the registered extras);
//  - --tilt, --lift and the motion extras (REDUCED_ZERO) resolve to 0 under prefers-reduced-motion.
// (--shadow-press is never the only pressed cue: src/ember.css also moves and recolors pressed buttons.)
// Writes docs/CONTRAST.md and exits 1 on any failure.
import fs from 'node:fs';
import { BACKGROUNDS as FOCUS_BACKGROUNDS, focusRingGate } from './lib/focus-ring.mjs';
import { scrimGate } from './lib/scrim.mjs';
import { COLOR_TOKENS, EXTRA_TOKENS, REDUCED_ZERO, SHAPE_TOKENS, TYPE_MOTION_TOKENS, declsOf, parseTheme, registry, resolver } from './theme-contract.mjs';

const hex = (c) => { if (!/^#[0-9a-f]{6}$/i.test(c)) throw new Error(`not a 6-digit hex: ${c}`); return c; };
const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(hex(h).slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const TEXT = [
  ...['text', 'text-muted', 'accent', 'success', 'warning', 'danger', 'info'].flatMap((f) => ['color-bg', 'surface'].map((b) => [f, b])),
  ['text', 'surface-muted'], ['text-muted', 'surface-muted'], ['text', 'accent-soft'], ['accent', 'accent-soft'],
  ['accent-contrast', 'accent'], ['accent-contrast', 'accent-hover'], ['danger-contrast', 'danger'], ['danger-contrast', 'danger-hover'],
  ['color-bg', 'text'], ['highlight-contrast', 'highlight'],
];
const UI = [['border', 'color-bg'], ['border', 'surface'], ['border', 'surface-muted'], ['focus-ring-color', 'color-bg'], ['focus-ring-color', 'surface'],
  ['focus-ring-color', 'surface-muted'], ['focus-ring-color', 'border'], ['accent', 'surface-muted']];
// Component defaults (src/tokens/components.css) for the modal, unless a theme overrides them.
const CARD_DEFAULTS = { '--card-bg': 'var(--surface)', '--card-border-width': 'var(--border-width)', '--card-border-color': 'var(--border)' };
const px = (v) => { if (String(v).trim() === '0') return 0; const m = String(v).match(/^(-?[\d.]+)px$/); return m ? Number(m[1]) : NaN; };
const zero = (v) => /^-?0(\.0+)?(px|deg|rem|em|ms|s)?$/.test(String(v).trim());

// Component tokens (src/tokens/components.css, layer 3): each is exactly var(--<contract name>) and themes never set
// them, so a component token resolves as its contract name in the theme. Used by the focus ring gate for --tabs-track.
const COMPONENTS = declsOf(fs.readFileSync('src/tokens/components.css', 'utf8'));
const compTarget = (k) => String(COMPONENTS[k] ?? '').match(/^var\((--[\w-]+)\)$/)?.[1];
const viaComponent = (r, k) => (compTarget(k) ? (r(compTarget(k)) ?? 'unresolved') : undefined);
const FOCUS_VIA = Object.fromEntries([...FOCUS_BACKGROUNDS, '--card-bg'].filter(compTarget).map((k) => [k, compTarget(k)]));
const safe = (fn) => (k) => { try { return fn(k); } catch { return 'unresolved'; } };

let fail = 0; const rows = []; const checks = []; const scrimThemes = []; const focusThemes = [];
const bad = (msg) => { fail++; console.log('FAIL', msg); };
for (const { id } of registry()) {
  const t = parseTheme(fs.readFileSync(`src/themes/${id}.css`, 'utf8'), id);
  const name = id;
  for (const k of [...SHAPE_TOKENS, ...TYPE_MOTION_TOKENS, ...EXTRA_TOKENS]) if (!(k in t.base)) bad(`${name}: missing ${k}`);
  for (const mode of ['light', 'dark']) {
    const r = resolver(t, mode);
    for (const k of COLOR_TOKENS) if (r(k) === undefined) bad(`${name}.${mode}: missing ${k}`);
    // The ring only touches the control's border when --focus-ring-offset is 0; with a gap it sits on the background,
    // so focus-ring-color vs border is required only at offset 0 (WCAG 1.4.11 adjacent colors).
    const gap = px(r('--focus-ring-offset')) > 0;
    // Open modal (CA v0.3.1, WCAG 1.4.11): the scrim checks live in scripts/lib/scrim.mjs (SCRIM-GATE), run below.
    scrimThemes.push({ name, mode, get: (k) => r(k) ?? (CARD_DEFAULTS[k] ? r(CARD_DEFAULTS[k].slice(4, -1)) : undefined),
      opts: { border: '--card-border-color', width: '--card-border-width', surface: '--card-bg' } });
    // Focus ring (FOCUS-RING-GATE): the ring on --color-bg, --surface, --tabs-track and (where defined) --hover-fill, in
    // scripts/lib/focus-ring.mjs, run below. Cards, the dialog and the toast paint --card-bg (src/ember.css); it gets its
    // own row only when it resolves differently from --surface, so the dialog surface is always covered.
    const fget = safe((k) => r(k) ?? viaComponent(r, k));
    const dialogOwn = fget('--card-bg') !== fget('--surface');
    focusThemes.push({ name, mode, get: fget, opts: { via: FOCUS_VIA, backgrounds: [...FOCUS_BACKGROUNDS, ...(dialogOwn ? ['--card-bg'] : [])] } });
    for (const [list, min] of [[TEXT, 4.5], [UI, 3]]) for (const [f, b] of list) {
      if (gap && f === 'focus-ring-color' && b === 'border') continue;
      const ratio = cr(r(`--${f}`), r(`--${b}`)); rows.push([`${name}.${mode}`, f, b, min, ratio]);
      if (ratio < min) bad(`${name}.${mode}: ${f} on ${b} ${ratio.toFixed(2)} < ${min}`);
    }
  }
  const r = resolver(t, 'light');
  const offset = px(r('--focus-ring-offset'));
  if (!(offset >= 0)) bad(`${name}: --focus-ring-offset ${r('--focus-ring-offset')} is negative or not a length`);
  // --hue-shift is a unitless multiplier from 0 to 1; the angle lives in the consuming CSS (calc(var(--hue-shift) * 40deg)). CA ruling, v0.3.1.
  for (const [where, v] of [['base', t.base['--hue-shift']], ['reduced', t.reduced['--hue-shift']]]) {
    if (v === undefined) continue;
    const s = String(v).trim();
    if (!/^(0|1|0?\.\d+|1\.0+)$/.test(s)) bad(`${name}: --hue-shift ${s} (${where}) must be a unitless number from 0 to 1`);
  }
  const style = r('--focus-ring-style'); const width = px(r('--focus-ring-width')); const target = px(r('--target-min'));
  const okStyle = !['none', 'hidden'].includes(style); const okWidth = width >= 2; const okTarget = target >= 44;
  const rm = { ...t.base, ...t.reduced }; const notZero = REDUCED_ZERO.filter((k) => !zero(rm[k])); const okReduced = !notZero.length;
  checks.push([name, style, `${width}px`, `${offset}px`, `${target}px`, okReduced ? `all 0 (${REDUCED_ZERO.join(', ')})` : `not 0: ${notZero.join(', ')}`]);
  if (!okStyle) bad(`${name}: --focus-ring-style is ${style}`);
  if (!okWidth) bad(`${name}: --focus-ring-width ${width}px < 2px`);
  if (!okTarget) bad(`${name}: --target-min ${target}px < 44px`);
  if (!okReduced) bad(`${name}: not 0 under reduced motion: ${notZero.map((k) => `${k}=${rm[k]}`).join(', ')}`);
}
// ---- Scrim (dialog backdrop), SCRIM-GATE: one gate, all logic in scripts/lib/scrim.mjs. Registered themes only;
// the stories-only test fixture is out of scope (CTE). Known fails pin in scripts/contrast.known.json (empty). ----
const scrim = scrimGate(scrimThemes, new URL('./contrast.known.json', import.meta.url));
for (const f of scrim.fails) bad(`scrim ${f}`);
for (const k of scrim.knowns) console.log('KNOWN scrim', k);
// ---- Focus ring, FOCUS-RING-GATE: the ring on --color-bg, --surface, --tabs-track and optional --hover-fill, logic in
// scripts/lib/focus-ring.mjs (WCAG 1.4.11 AA requirement, 2.4.13 AAA house aim).
// Registered themes only; known fails pin in scripts/contrast.known.json ("focusRing", empty). ----
const focus = focusRingGate(focusThemes, new URL('./contrast.known.json', import.meta.url));
for (const f of focus.fails) bad(`focus ring ${f}`);
for (const k of focus.knowns) console.log('KNOWN focus ring', k);
const md = [
  '# Contrast and theme contract', '', 'Generated by `npm run contrast` from every registered theme (src/themes/registry.json). Text needs 4.5:1, UI (borders, focus ring) 3:1.', '',
  'Open-modal rule (Chief Architect, v0.3.1, WCAG 1.4.11): the dialog border (or the dialog surface when its border width is 0) reaches 3:1 against `--scrim` alpha-composited over `--color-bg`, in light and dark. Page text under the scrim: `--text-muted` composited under the scrim reaches 3:1 against the composited `--color-bg`, and the scrim never lightens `--color-bg` (the design CONTRAST Scrim sections). Dialog text sits on the dialog\'s own opaque surface, so it has no scrim check.', '', 'Focus ring rule (Chief Architect, v0.3.1): `--focus-ring-offset` must be 0 or more. The focus ring color must reach 3:1 against every surface a control can sit on (`--color-bg`, `--surface`, which cards and raised controls use, and `--surface-muted`) in light and dark, at any offset. When the offset is 0 the ring also touches the control border, so focus ring vs `--border` is required too; when the offset is above 0 the ring sits on the page and that pair is not required.', '', '`--hue-shift` rule (Chief Architect, v0.3.1): a unitless multiplier from 0 to 1, with any unit rejected. Neutral default 0, and 0 under reduced motion. The maximum angle lives in the consuming CSS, as `calc(var(--hue-shift) * 40deg)`.', '',
  '| Theme | Focus ring style | Focus ring width | Focus ring offset | Target min | Reduced motion |', '|---|---|---|---|---|---|', ...checks.map((c) => `| ${c.join(' | ')} |`), '',
  '| Theme.mode | Foreground | Background | Min | Ratio |', '|---|---|---|---|---|', ...rows.map(([c, f, b, m, r]) => `| ${c} | ${f} | ${b} | ${m} | ${r.toFixed(2)} |`),
].join('\n');
fs.writeFileSync(new URL('../docs/CONTRAST.md', import.meta.url), md + '\n' + scrim.md + '\n' + focus.md + '\n');
console.log(`${rows.length} pairs and ${checks.length * 5} contract assertions checked across ${registry().length} themes, ${scrim.rows.length} scrim rows (${scrim.knowns.length} known), ${focus.rows.length} focus ring rows (${focus.knowns.length} known), ${fail} failures`);
process.exit(fail ? 1 : 0);
