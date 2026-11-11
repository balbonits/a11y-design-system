// Scrim (dialog backdrop) contrast rows, SCRIM-GATE. Same method as the design-side scripts on #43
// (docs/directions/v3/shared/contrast.mjs generic scrim block, kinetic/contrast-scrim.mjs, neo CONTRAST.md Scrim):
// the composite is the 8-digit --scrim over --color-bg, and for each theme and mode
//   1. the dialog border against the composite is 3:1 or better (WCAG 1.4.11, CA v0.3.1). The border token is a
//      parameter (default --border); when a width token resolves to 0 the dialog surface is measured instead;
//   2. --text-muted under the scrim, both composited, against the composite is 3:1 or better;
//   3. the composite never lightens --color-bg (light and dark, as the #27 inline check did);
// and a missing or non-8-digit --scrim fails.
// This is the one scrim gate: the inline check that #27 had in scripts/contrast.mjs moved here (SCRIM-GATE, CTE (X)).
// The stories-only test fixture is out of scope (CTE): only registered themes are gated.
// CLI, for parity with the design side: node scripts/lib/scrim.mjs --tokens <direction>/tokens.json
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export const SCRIM_MIN = 3;
const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const over = (s, b) => { const a = parseInt(s.slice(7, 9), 16) / 255;
  return '#' + [1, 3, 5].map((i) => Math.round(a * parseInt(s.slice(i, i + 2), 16) + (1 - a) * parseInt(b.slice(i, i + 2), 16)).toString(16).padStart(2, '0')).join(''); };
const six = (v) => /^#[0-9a-f]{6}$/i.test(v || '');

export const CHECKS = {
  scrim: '--scrim is an 8-digit hex',
  border: 'dialog border on scrim over color-bg (1.4.11)',
  surface: 'dialog surface on scrim over color-bg (1.4.11, border width 0)',
  muted: 'text-muted under scrim (both composited)',
  dims: 'scrim must not lighten color-bg',
};

// get(name) returns a token's resolved value or undefined. opts.border is the dialog border token (default --border;
// CA Addendum 9's --dialog-border is FSD's #30, a one-line change at the call site). opts.width and opts.surface,
// when given, switch the check to the dialog surface while the border width resolves to 0.
// Returns rows of { combo, check, fg, comp, min, value, pass }, where value is a ratio (number) or a word.
const px = (v) => { if (String(v).trim() === '0') return 0; const m = String(v).match(/^(-?[\d.]+)px$/); return m ? Number(m[1]) : NaN; };
export function scrimRows(combo, get, mode, { border: borderVar = '--border', width = null, surface = null } = {}) {
  const sc = get('--scrim');
  if (!/^#[0-9a-f]{8}$/i.test(sc || '')) return [{ combo, check: CHECKS.scrim, fg: sc ?? 'missing', comp: '', min: '8-digit', value: sc === undefined ? 'missing' : 'not 8-digit', pass: false }];
  const useSurface = width !== null && surface !== null && px(get(width)) === 0;
  const fgVar = useSurface ? surface : borderVar;
  const bg = get('--color-bg'); const border = get(fgVar); const muted = get('--text-muted');
  for (const [k, v] of [['--color-bg', bg], [fgVar, border], ['--text-muted', muted]]) if (!six(v)) throw new Error(`${combo}: ${k} is not a 6-digit hex (${v})`);
  const comp = over(sc, bg); const rows = [];
  const b = cr(border, comp); rows.push({ combo, check: useSurface ? CHECKS.surface : CHECKS.border, fg: border, comp, min: `${SCRIM_MIN}:1`, value: b, pass: b >= SCRIM_MIN });
  const mf = over(sc, muted); const m = cr(mf, comp); rows.push({ combo, check: CHECKS.muted, fg: mf, comp, min: `${SCRIM_MIN}:1`, value: m, pass: m >= SCRIM_MIN });
  { const ok = lum(comp) <= lum(bg) + 1e-9; rows.push({ combo, check: CHECKS.dims, fg: bg, comp, min: 'dims', value: ok ? 'dims' : 'LIGHTENS', pass: ok }); }
  return rows;
}
export const shown = (v) => (typeof v === 'number' ? v.toFixed(2) : v);

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const at = process.argv.indexOf('--tokens'); if (at < 0) { console.error('usage: node scripts/lib/scrim.mjs --tokens <tokens.json>'); process.exit(2); }
  const J = JSON.parse(fs.readFileSync(process.argv[at + 1], 'utf8'));
  let fail = 0;
  for (const [combo, t] of Object.entries(J.semantic)) for (const r of scrimRows(combo, (k) => t[k], combo.endsWith('-dark') ? 'dark' : 'light')) {
    if (!r.pass) fail++; console.log(`| ${r.combo} | ${r.check} | ${r.fg} | ${r.comp} | ${r.min} | ${shown(r.value)} ${r.pass ? 'pass' : 'FAIL'} |`);
  }
  process.exit(fail ? 1 : 0);
}

// Gate over the registered themes, called once from scripts/contrast.mjs. Known fails come from
// scripts/contrast.known.json ({ "scrim": [{ combo, check, value, card, owner, cause }] }), the target-size.known.json
// pattern: a matching row is reported as KNOWN instead of failing, but only at its pinned value. If the value changes,
// or the row starts passing, or the entry matches no row, the gate fails, so the entry is removed with the token fix.
export function scrimGate(themes, knownUrl) {
  const known = fs.existsSync(knownUrl) ? (JSON.parse(fs.readFileSync(knownUrl, 'utf8')).scrim ?? []) : [];
  const key = (combo, check) => `${combo}\u0000${check}`; const byKey = new Map(known.map((k) => [key(k.combo, k.check), k])); const seen = new Set();
  const rows = []; const fails = []; const knowns = [];
  for (const { name, get, mode, opts } of themes) for (const r of scrimRows(`${name}.${mode}`, get, mode, opts)) {
    const k = byKey.get(key(r.combo, r.check)); rows.push(r);
    if (k) { seen.add(key(r.combo, r.check));
      if (r.pass) fails.push(`${r.combo}: ${r.check} now passes (${shown(r.value)}); remove its scripts/contrast.known.json entry (${k.card})`);
      else if (shown(r.value) !== String(k.value)) fails.push(`${r.combo}: ${r.check} is ${shown(r.value)}, known entry pins ${k.value} (${k.card}); the value changed`);
      else knowns.push(`${r.combo}: ${r.check} ${shown(r.value)} (${k.card}, ${k.owner}: ${k.cause})`);
    } else if (!r.pass) fails.push(`${r.combo}: ${r.check} ${shown(r.value)}${typeof r.value === 'number' ? ` < ${SCRIM_MIN}` : ''}`);
  }
  for (const k of known) if (!seen.has(key(k.combo, k.check))) fails.push(`known entry ${k.combo} / ${k.check} (${k.card}) matches no row; remove it`);
  const result = (r) => { const k = byKey.get(key(r.combo, r.check)); return `${shown(r.value)} ${r.pass ? 'pass' : k ? `KNOWN (${k.card})` : 'FAIL'}`; };
  const md = ['', '## Scrim (dialog backdrop)', '',
    `Generated by \`npm run contrast\` (scripts/lib/scrim.mjs) from \`--scrim\` in every registered theme and mode: ${rows.length} rows, ${fails.length} failures, ${knowns.length} known. The composite is \`--scrim\` over \`--color-bg\`. The dialog border on it needs 3:1 (WCAG 1.4.11), \`--text-muted\` under the scrim (both composited) needs 3:1, the scrim never lightens \`--color-bg\`, and a missing or non-8-digit \`--scrim\` fails.`, '',
    '| Theme.mode | Check | Foreground | Composite | Min | Result |', '|---|---|---|---|---|---|',
    ...rows.map((r) => `| ${r.combo} | ${r.check} | ${r.fg} | ${r.comp} | ${r.min} | ${result(r)} |`)].join('\n');
  return { rows, fails, knowns, md };
}
