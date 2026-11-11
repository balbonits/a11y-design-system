// Appends the kinetic Scrim section to CONTRAST.md.
// Run after ../shared/contrast.mjs, from docs/directions/v3:
//   node shared/contrast.mjs kinetic && node kinetic/contrast-scrim.mjs
// Re-running is safe: it replaces any existing ## Scrim section.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const J = JSON.parse(fs.readFileSync(path.join(dir, 'tokens.json')));
const contrastPath = path.join(dir, 'CONTRAST.md');

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

for (const [combo, t] of Object.entries(J.semantic)) {
  const sc = t['--scrim'];
  if (!sc || sc.length !== 9) {
    fail++;
    notes.push(`FAIL ${combo} no 8-digit --scrim`);
    continue;
  }
  const bg = t['--color-bg'];
  const comp = over(sc, bg);
  for (const k of dimKeys) {
    const o = t['--' + k];
    const d = over(sc, o);
    const ok = lum(d) <= lum(o) + 1e-9;
    if (!ok) {
      fail++;
      notes.push(`FAIL ${combo} ${k} lightens under scrim (${o} -> ${d})`);
    }
    srows.push([combo, k, o, d, ok ? 'dims' : 'LIGHTENS', '']);
  }
  // 1.4.11: opaque dialog border against scrim composited over color-bg.
  const borderR = cr(t['--border'], comp);
  const borderOk = borderR >= 3;
  if (!borderOk) {
    fail++;
    notes.push(`FAIL ${combo} border on composite ${borderR.toFixed(2)} < 3`);
  }
  srows.push([combo, 'border on color-bg (1.4.11, opaque border)', t['--border'], comp, '3:1', borderR.toFixed(2) + (borderOk ? '' : ' FAIL')]);
  // Opaque dialog surface against the same composite (reported, not a 1.4.11 gate: the border is the edge).
  const surfaceR = cr(t['--surface'], comp);
  const surfaceOk = surfaceR >= 3;
  if (!surfaceOk) notes.push(`NOTE ${combo} surface on composite ${surfaceR.toFixed(2)} < 3 (listed, border is the 1.4.11 cue)`);
  srows.push([combo, 'surface on color-bg (opaque surface)', t['--surface'], comp, 'reported', surfaceR.toFixed(2) + (surfaceOk ? '' : ' (below 3:1)')]);
  // text-muted against the composite (token, not itself composited).
  const tmTokenR = cr(t['--text-muted'], comp);
  const tmTokenOk = tmTokenR >= 3;
  if (!tmTokenOk) {
    fail++;
    notes.push(`FAIL ${combo} text-muted against composite ${tmTokenR.toFixed(2)} < 3 (${t['--text-muted']} on ${comp})`);
  }
  srows.push([combo, 'text-muted against composite', t['--text-muted'], comp, '3:1', tmTokenR.toFixed(2) + (tmTokenOk ? '' : ' FAIL')]);
  // neo method: both text-muted and the page composited under the scrim.
  const tmNeoR = cr(over(sc, t['--text-muted']), comp);
  const tmNeoOk = tmNeoR >= 3;
  if (!tmNeoOk) {
    fail++;
    notes.push(`FAIL ${combo} text-muted under scrim (both composited) ${tmNeoR.toFixed(2)} < 3`);
  }
  srows.push([combo, 'text-muted under scrim (both composited)', over(sc, t['--text-muted']), comp, '3:1', tmNeoR.toFixed(2) + (tmNeoOk ? '' : ' FAIL')]);
}

const intro = [
  '',
  '## Scrim (dialog backdrop)',
  '',
  '`--scrim` is cobalt-950 `#06123F` plus alpha (40% light `#06123F66`, 60% dark `#06123F99`), composited over the page. This is per-mode, the same naming as neo (`--palette-scrim` / `--palette-scrim-dark`). Light is 40% so the dialog border (`--border`, cobalt-700 `#1434B8`) against the scrim over `--color-bg` (warm-50 `#FBF8F1`, composite `#999caa`) meets WCAG 1.4.11 at 3.47:1. The opaque white `--surface` against that composite is 2.73:1, below 3:1; the cobalt border is the 1.4.11 cue and stays as it is (Chief of Creatives ruling, 9:45 PM PT 2026-11-10; CA agreed). Dark border against the composite is 8.73:1.',
  '',
  'Page colors should dim or stay equal, never lighten, and text-muted under a scrim stays at least 3:1 so it stays recognizable. The dialog is an opaque `--surface`, so its text contrast is the text/surface rows above and never depends on the scrim.',
  '',
  'Known results below 3:1 or against the dim rule, listed here and not hidden:',
  '',
  '- Light: `--text-muted` (slate-600 `#45507A`) against the 40% composite `#999caa` is 2.87:1, below 3:1. If both the text and the page are composited under the scrim (neo\'s method), the same pair is 4.20:1.',
  '- Light: the opaque white `--surface` against `#999caa` is 2.73:1, below 3:1. The border is the 1.4.11 cue.',
  '- Dark: `--text-muted` (slate-300) composited under the 60% scrim against the composited page is 2.75:1, below 3:1. The uncomposited token against the dark composite is 11.10:1.',
  '- Dark: `--color-bg` (night-900 `#070F33`) slightly lightens under the 60% scrim (composite `#06113a`).',
  '',
  '| Combo | Token or pair | Base | Under scrim | Rule | Ratio |',
  '|---|---|---|---|---|---|',
  ...srows.map(([c, k, o, d, r, x]) => `| ${c} | ${k} | ${o ? '`' + o + '`' : ''} | ${d ? '`' + d + '`' : ''} | ${r} | ${x} |`),
].join('\n');

let base = fs.readFileSync(contrastPath, 'utf8');
const cut = base.search(/\n## Scrim \(dialog backdrop\)/);
if (cut !== -1) base = base.slice(0, cut);
if (!base.endsWith('\n')) base += '\n';
fs.writeFileSync(contrastPath, base + intro + '\n');
for (const n of notes) console.log(n);
console.log(srows.length, 'scrim rows,', fail, 'failures');
process.exit(fail ? 1 : 0);
