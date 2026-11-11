// Focus ring contrast rows, FOCUS-RING-GATE. Same style as scripts/lib/scrim.mjs: pure row function, one gate call
// from scripts/contrast.mjs, known fails pinned in scripts/contrast.known.json.
// For every registered theme and mode, --focus-ring-color must reach 3:1 (WCAG 1.4.11 non-text contrast, and the
// 2.4.13 focus appearance contrast part) against
//   1. --color-bg, the page a focused control sits on, and
//   2. --tabs-track, the track behind Tabs and the ThemeSwitcher options (a component token, src/tokens/components.css,
//      resolved through the theme), where a focused tab or option draws its ring.
// A ring or background token that is missing or doesn't resolve to a 6-digit hex fails (no silent skip).
// The rows for --surface and --surface-muted stay in the main pair table (scripts/contrast.mjs UI list).
// CLI, for parity with the design side: node scripts/lib/focus-ring.mjs --tokens <direction>/tokens.json
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { declsOf } from '../theme-contract.mjs';

export const FOCUS_MIN = 3;
export const RING = '--focus-ring-color';
export const BACKGROUNDS = ['--color-bg', '--tabs-track'];
const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const six = (v) => /^#[0-9a-f]{6}$/i.test(v || '');
const bare = (k) => k.slice(2);

// get(name) returns a token's resolved value, or undefined when it is missing or doesn't resolve.
// Returns rows of { combo, fg, bg, label, ring, back, min, value, pass }, where fg and bg are token names without the
// leading dashes (the main pair table's labels) and value is a ratio (number) or a word (missing / unresolved).
// opts.via maps a component token to the contract name it reads (from src/tokens/components.css); the Background
// label then reads like the #27 row, e.g. tabs-track (--surface-muted). Known entries key on the bare token (tabs-track).
export function focusRingRows(combo, get, mode, { ring = RING, backgrounds = BACKGROUNDS, via = {} } = {}) {
  const word = (v) => (v === undefined ? 'missing' : 'unresolved');
  const rv = get(ring); const rows = [];
  for (const b of backgrounds) {
    const bv = get(b); const row = { combo, fg: bare(ring), bg: bare(b), label: via[b] ? `${bare(b)} (${via[b]})` : bare(b), ring: rv ?? 'missing', back: bv ?? 'missing', min: `${FOCUS_MIN}:1` };
    if (!six(rv)) { rows.push({ ...row, value: `${bare(ring)} ${word(rv)}`, pass: false }); continue; }
    if (!six(bv)) { rows.push({ ...row, value: `${bare(b)} ${word(bv)}`, pass: false }); continue; }
    const v = cr(rv, bv); rows.push({ ...row, value: v, pass: v >= FOCUS_MIN });
  }
  return rows;
}
export const shown = (v) => (typeof v === 'number' ? v.toFixed(2) : v);

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const at = process.argv.indexOf('--tokens'); if (at < 0) { console.error('usage: node scripts/lib/focus-ring.mjs --tokens <tokens.json>'); process.exit(2); }
  const J = JSON.parse(fs.readFileSync(process.argv[at + 1], 'utf8'));
  // Design token files carry only semantic names, so a component token (--tabs-track) falls back to its
  // src/tokens/components.css definition, exactly var(--<semantic name>), the way the shipped CSS resolves it.
  const comp = declsOf(fs.readFileSync(new URL('../../src/tokens/components.css', import.meta.url), 'utf8'));
  const target = (k) => String(comp[k] ?? '').match(/^var\((--[\w-]+)\)$/)?.[1];
  const viaMap = Object.fromEntries(BACKGROUNDS.filter(target).map((k) => [k, target(k)]));
  const via = (t, k) => (target(k) ? t[target(k)] : undefined);
  let fail = 0;
  for (const [combo, t] of Object.entries(J.semantic)) for (const r of focusRingRows(combo, (k) => t[k] ?? via(t, k), combo.endsWith('-dark') ? 'dark' : 'light', { via: viaMap })) {
    if (!r.pass) fail++; console.log(`| ${r.combo} | ${r.fg} | ${r.label} | ${r.ring} | ${r.back} | ${r.min} | ${shown(r.value)} ${r.pass ? 'pass' : 'FAIL'} |`);
  }
  process.exit(fail ? 1 : 0);
}

// Gate over the registered themes, called once from scripts/contrast.mjs. Known fails come from
// scripts/contrast.known.json ({ "focusRing": [{ combo, bg, value, card, owner, cause }] }, bg without dashes), the
// same rules as the scrim gate: a matching row is KNOWN only at its pinned value; a changed value, a row that now
// passes, or an entry that matches no row fails the gate, so the entry is removed with the token fix.
export function focusRingGate(themes, knownUrl) {
  const known = fs.existsSync(knownUrl) ? (JSON.parse(fs.readFileSync(knownUrl, 'utf8')).focusRing ?? []) : [];
  const key = (combo, bg) => `${combo}\u0000${bg}`; const byKey = new Map(known.map((k) => [key(k.combo, k.bg), k])); const seen = new Set();
  const rows = []; const fails = []; const knowns = [];
  for (const { name, get, mode, opts } of themes) for (const r of focusRingRows(`${name}.${mode}`, get, mode, opts)) {
    const k = byKey.get(key(r.combo, r.bg)); rows.push(r);
    if (k) { seen.add(key(r.combo, r.bg));
      if (r.pass) fails.push(`${r.combo}: ${r.fg} on ${r.bg} now passes (${shown(r.value)}); remove its scripts/contrast.known.json entry (${k.card})`);
      else if (shown(r.value) !== String(k.value)) fails.push(`${r.combo}: ${r.fg} on ${r.bg} is ${shown(r.value)}, known entry pins ${k.value} (${k.card}); the value changed`);
      else knowns.push(`${r.combo}: ${r.fg} on ${r.bg} ${shown(r.value)} (${k.card}, ${k.owner}: ${k.cause})`);
    } else if (!r.pass) fails.push(`${r.combo}: ${r.fg} on ${r.bg} ${shown(r.value)}${typeof r.value === 'number' ? ` < ${FOCUS_MIN}` : ''}`);
  }
  for (const k of known) if (!seen.has(key(k.combo, k.bg))) fails.push(`known entry ${k.combo} / ${k.bg} (${k.card}) matches no row; remove it`);
  const result = (r) => { const k = byKey.get(key(r.combo, r.bg)); return `${shown(r.value)} ${r.pass ? 'pass' : k ? `KNOWN (${k.card})` : 'FAIL'}`; };
  const md = ['', '## Focus ring', '',
    `Generated by \`npm run contrast\` (scripts/lib/focus-ring.mjs) for every registered theme and mode: ${rows.length} rows, ${fails.length} failures, ${knowns.length} known. \`--focus-ring-color\` needs 3:1 against \`--color-bg\` and against \`--tabs-track\` (the Tabs and ThemeSwitcher track, resolved from src/tokens/components.css), WCAG 1.4.11 and 2.4.13. A ring or background token that is missing or doesn't resolve fails. The ring against \`--surface\` and \`--surface-muted\` is in the pair table above.`, '',
    '| Theme.mode | Foreground | Background | Ring | Background value | Min | Result |', '|---|---|---|---|---|---|---|',
    ...rows.map((r) => `| ${r.combo} | ${r.fg} | ${r.label} | ${r.ring} | ${r.back} | ${r.min} | ${result(r)} |`)].join('\n');
  return { rows, fails, knowns, md };
}
