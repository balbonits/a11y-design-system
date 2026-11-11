// R-3: motion lives in Ember only. @keyframes are allowed only in src/ember.css, and every animation or transition
// there takes its timing from a token (var(--...)). Apps run the same rule with their own source dirs.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOTS = process.argv.slice(2).length ? process.argv.slice(2) : ['src', 'stories', '.storybook'];
const ALLOWED = new Set(['src/ember.css']);
const problems = [];
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? (f === 'node_modules' ? [] : walk(p)) : [p]; });
for (const root of ROOTS) {
  let files = [];
  try { files = walk(root); } catch { continue; }
  for (const f of files.filter((x) => /\.(css|tsx?|jsx?|mdx|html)$/.test(x))) {
    const rel = relative('.', f).replaceAll('\\', '/');
    const lines = readFileSync(f, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (/@keyframes\b/.test(line) && !ALLOWED.has(rel)) problems.push(`${rel}:${i + 1} @keyframes outside Ember's motion primitives`);
      if (!ALLOWED.has(rel)) return;
      for (const m of line.matchAll(/(?:^|[{;])\s*(?:animation|transition)(?:-duration)?\s*:\s*([^;}]*)/g)) {
        const v = m[1].trim();
        if (v && !/^none\b/.test(v) && !/var\(--/.test(v)) problems.push(`${rel}:${i + 1} animation/transition timing must come from a token: ${v}`);
      }
    });
  }
}
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log(`lint:motion: 0 problems (${ROOTS.join(', ')})`);
