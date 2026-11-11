// Raw color lint (R-2): only src/tokens/primitives.css may hold raw colors or name --palette-* tokens.
// Component CSS and the component token layer must use semantic or component tokens.
// color-mix(in srgb, ...) over tokens is fine.
import fs from 'node:fs';
const files = ['src/ember.css', 'src/tokens/components.css'];
const raw = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|--palette-/;
let bad = 0;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
  src.split('\n').forEach((line, i) => { if (raw.test(line)) { bad++; console.log(`FAIL ${f}:${i + 1}: ${line.trim()}`); } });
}
console.log(`raw color lint: ${files.length} files, ${bad} failures`);
process.exit(bad ? 1 : 0);
