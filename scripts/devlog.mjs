// npm run devlog: renders the combined devlog (PROC-8) to dist/devlog/DEVLOG.md (gitignored build output; never committed).
// = PROGRESS.md verbatim (the history up to the switch) + every progress/ fragment, oldest first (date, then file name).
// Usage: node scripts/devlog.mjs [--root <dir>] [--out <file>]. Exit 1 if any fragment is invalid.
import fs from 'node:fs';
import path from 'node:path';
import { readFragments, sortFragments, renderFragment } from './lib/devlog.mjs';

const arg = (name, dflt) => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : dflt; };
const root = path.resolve(arg('--root', '.'));
const out = path.resolve(root, arg('--out', 'dist/devlog/DEVLOG.md'));
const history = fs.readFileSync(path.join(root, 'PROGRESS.md'), 'utf8').replace(/\s+$/, '');
const frags = readFragments(root);
const errors = frags.flatMap((f) => f.errors);
if (errors.length) { for (const e of errors) console.log(`FAIL ${e}`); console.log(`devlog: ${errors.length} fragment error(s), nothing written`); process.exit(1); }
const text = [history, ...sortFragments(frags).map(renderFragment)].join('\n\n').replace(/\s+$/, '') + '\n';
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, text);
console.log(`devlog: PROGRESS.md history + ${frags.length} fragment(s) -> ${path.relative(root, out)}`);
