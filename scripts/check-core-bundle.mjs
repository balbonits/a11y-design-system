// R-4 CI check: the core entry must not carry video player code. Fails if dist/index.js
// (or any chunk it statically imports) references hls.js, the YouTube or Vimeo players.
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

const FORBIDDEN = [/hls\.js/i, /youtube(?:-nocookie)?\.com/i, /iframe_api/i, /@vimeo\/player/i, /player\.vimeo\.com/i, /createNativePlayer|parseVtt/];
const entry = 'dist/index.js';
if (!existsSync(entry)) {
  console.error('core bundle check: dist/index.js missing; run npm run build:lib first');
  process.exit(1);
}
const seen = new Set();
const queue = [entry];
const failures = [];
while (queue.length) {
  const f = queue.shift();
  if (seen.has(f)) continue;
  seen.add(f);
  const src = readFileSync(f, 'utf8');
  for (const re of FORBIDDEN) if (re.test(src)) failures.push(`${f}: matches ${re}`);
  for (const m of src.matchAll(/(?:import|export)[^'"]*?from\s*['"](\.{1,2}\/[^'"]+)['"]|import\s*\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g)) {
    queue.push(join(dirname(f), m[1] ?? m[2]));
  }
}
if (failures.length) {
  console.error(`core bundle check: ${failures.length} failure(s)\n` + failures.join('\n'));
  process.exit(1);
}
console.log(`core bundle check: ${seen.size} file(s) scanned, 0 video references`);
