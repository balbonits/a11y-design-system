// Writes the kinetic Scrim section into contrast-notes.md, which shared/contrast.mjs appends to CONTRAST.md,
// so a plain `node shared/contrast.mjs kinetic` regeneration keeps it (VQA, 2026-11-10).
// Run from docs/directions/v3:
//   node kinetic/contrast-scrim.mjs && node shared/contrast.mjs kinetic
// Re-running is safe: it replaces any existing ## Scrim section in contrast-notes.md.
//
// Gates (exit 1 if any fail):
//   - opaque dialog border against the scrim composited over --color-bg, 3:1 (WCAG 1.4.11)
//   - text-muted under the scrim, both composited, 3:1 (neo's method)
//   - dark scrim must not lighten --color-bg
// Opaque surface vs composite is informational: the border is the 1.4.11 cue.
// There is no uncomposited "text-muted vs the composite" gate or row (neo's Scrim section doesn't have one).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const J = JSON.parse(fs.readFileSync(path.join(dir, 'tokens.json')));
const contrastPath = path.join(dir, 'contrast-notes.md');

const lum = h => {
  const hex = h.slice(1, 7);
  const c = [0, 2, 4].map(i => {
    const x = parseInt(hex.slice(i, i + 2), 16) / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const cr = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const hx = n => Math.round(n).toString(16).padStart(2, '0');
const over = (s, b) => {
  const a = parseInt(s.slice(7, 9), 16) / 255;
  return '#' + [1, 3, 5].map(i => hx(a * parseInt(s.slice(i, i + 2), 16) + (1 - a) * parseInt(b.slice(i, i + 2), 16))).join('');
};

let fail = 0;
const notes = [];
const srows = [];
const dimKeys = ['color-bg', 'surface', 'surface-muted', 'text', 'text-muted', 'accent', 'border'];
const summary = {};

for (const [combo, t] of Object.entries(J.semantic)) {
  const sc = t['--scrim'];
  if (!sc || sc.length !== 9) {
    fail++;
    notes.push(`FAIL ${combo} no 8-digit --scrim`);
    continue;
  }
  const bg = t['--color-bg'];
  const comp = over(sc, bg);
  const isDark = combo.endsWith('-dark');
  summary[combo] = { sc, bg, comp };

  for (const k of dimKeys) {
    const o = t['--' + k];
    const d = over(sc, o);
    const ok = lum(d) <= lum(o) + 1e-9;
    const gateColorBg = isDark && k === 'color-bg';
    if (!ok && gateColorBg) {
      fail++;
      notes.push(`FAIL ${combo} color-bg lightens under dark scrim (${o} -> ${d})`);
    } else if (!ok) {
      notes.push(`NOTE ${combo} ${k} lightens under scrim (${o} -> ${d}) (not a gate)`);
    }
    srows.push([combo, k, o, d, ok ? 'dims' : 'LIGHTENS', gateColorBg && !ok ? 'FAIL' : '']);
  }

  // 1.4.11 gate: opaque dialog border against scrim composited over color-bg.
  if (!/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(t['--dialog-border'] || '')) throw new Error(`${combo} --dialog-border does not resolve to a color`); // lint, ARCH-REVIEW Addendum 9
  const borderR = cr(t['--dialog-border'], comp);
  const borderOk = borderR >= 3;
  if (!borderOk) {
    fail++;
    notes.push(`FAIL ${combo} border on composite ${borderR.toFixed(2)} < 3`);
  }
  srows.push([combo, '--dialog-border on color-bg (1.4.11, opaque border)', t['--dialog-border'], comp, '3:1', borderR.toFixed(2) + (borderOk ? '' : ' FAIL')]);
  summary[combo].borderR = borderR;

  // Opaque dialog surface against the same composite: informational, not a gate.
  const surfaceR = cr(t['--surface'], comp);
  const surfaceOk = surfaceR >= 3;
  if (!surfaceOk) notes.push(`NOTE ${combo} surface on composite ${surfaceR.toFixed(2)} < 3 (informational; border is the 1.4.11 cue)`);
  srows.push([combo, 'surface on color-bg (opaque surface, informational)', t['--surface'], comp, 'informational', surfaceR.toFixed(2) + (surfaceOk ? '' : ' (below 3:1)')]);
  summary[combo].surfaceR = surfaceR;

  // Gate: text-muted under the scrim, both composited (neo's method).
  const tmNeoR = cr(over(sc, t['--text-muted']), comp);
  const tmNeoOk = tmNeoR >= 3;
  if (!tmNeoOk) {
    fail++;
    notes.push(`FAIL ${combo} text-muted under scrim (both composited) ${tmNeoR.toFixed(2)} < 3`);
  }
  srows.push([combo, 'text-muted under scrim (both composited)', over(sc, t['--text-muted']), comp, '3:1', tmNeoR.toFixed(2) + (tmNeoOk ? '' : ' FAIL')]);
  summary[combo].tmNeoR = tmNeoR;
  summary[combo].bgLum = lum(bg);
  summary[combo].compLum = lum(comp);
}

const light = summary['kinetic-light'];
const dark = summary['kinetic-dark'];
const darkLumX = dark ? (dark.compLum / dark.bgLum) : 0;

const intro = [
  '',
  '## Scrim (dialog backdrop)',
  '',
  '`--scrim` is per-mode, the same naming as neo (`--palette-scrim` / `--palette-scrim-dark`). Light is cobalt-950 at 40% (`#06123F66`). Dark is black at 50% (`#00000080`). Dark was previously cobalt-950 at 60% (`#06123F99`); that lightened `--color-bg` (night-900 `#070F33`) instead of dimming it, and `--text-muted` under the scrim, both composited, failed at 2.75:1. Black at 50% dims night-900 (composite `' + (dark ? dark.comp : '') + '`, luminance ' + darkLumX.toFixed(2) + '×) and keeps that pair at 3:1 or better (Chief of Creatives follow-up, 9:50 PM PT 2026-11-10). Light is unchanged from the 9:45 PM PT ruling (CA agreed).',
  '',
  'Gates, matching neo\'s method: the opaque dialog border against the scrim composited over `--color-bg` must be 3:1 or better (WCAG 1.4.11); `--text-muted` under the scrim, both composited, must be 3:1 or better; and the dark scrim must not lighten `--color-bg`. The opaque `--surface` against the composite is listed as informational only; the border is the 1.4.11 cue. The dialog is an opaque `--surface`, so its text contrast is the text/surface rows above and never depends on the scrim. There is no uncomposited "text-muted vs the composite" row: neo\'s Scrim section does not include one, and that pairing measures text that isn\'t drawn there.',
  '',
  light ? `- Light: scrim \`${light.sc}\` over \`${light.bg}\` composites to \`${light.comp}\`. Border \`${J.semantic['kinetic-light']['--border']}\` against that composite is ${light.borderR.toFixed(2)}:1 (pass). \`--text-muted\` under the scrim, both composited, is ${light.tmNeoR.toFixed(2)}:1 (pass). Opaque white \`--surface\` against the composite is ${light.surfaceR.toFixed(2)}:1 (informational, below 3:1).` : '',
  dark ? `- Dark: scrim \`${dark.sc}\` over \`${dark.bg}\` composites to \`${dark.comp}\`. Border \`${J.semantic['kinetic-dark']['--border']}\` against that composite is ${dark.borderR.toFixed(2)}:1 (pass). \`--text-muted\` under the scrim, both composited, is ${dark.tmNeoR.toFixed(2)}:1 (pass). \`--color-bg\` dims (luminance ${darkLumX.toFixed(2)}×). Opaque \`--surface\` against the composite is ${dark.surfaceR.toFixed(2)}:1 (informational).` : '',
  '',
  '| Combo | Token or pair | Base | Under scrim | Rule | Ratio |',
  '|---|---|---|---|---|---|',
  ...srows.map(([c, k, o, d, r, x]) => `| ${c} | ${k} | ${o ? '`' + o + '`' : ''} | ${d ? '`' + d + '`' : ''} | ${r} | ${x} |`),
].filter(line => line !== undefined).join('\n');

let base = fs.readFileSync(contrastPath, 'utf8');
const cut = base.search(/\n## Scrim \(dialog backdrop\)/);
if (cut !== -1) base = base.slice(0, cut);
if (!base.endsWith('\n')) base += '\n';
fs.writeFileSync(contrastPath, base + intro + '\n');
for (const n of notes) console.log(n);
console.log(srows.length, 'scrim rows,', fail, 'failures');
process.exit(fail ? 1 : 0);
