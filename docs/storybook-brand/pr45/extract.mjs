// Pulls SB-MANAGER-AA's (#45) theme values out of its .storybook/manager.ts so contrast.mjs can compare against them.
// Usage: node docs/storybook-brand/pr45/extract.mjs   (reads pr45/manager.ts, a verbatim copy from #45 at 79f89b7; writes pr45/baseline.json)
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const ts = fs.readFileSync(path.join(here, 'manager.ts'), 'utf8');
const NEO = Object.fromEntries([...ts.match(/const NEO = \{([\s\S]*?)\};/)[1].matchAll(/(\w+): '(#[0-9a-f]{6})'/gi)].map(m => [m[1], m[2]]));
const theme = (name) => Object.fromEntries([...ts.match(new RegExp(`const ${name} = create\\(\\{([\\s\\S]*?)\\}\\);`))[1].matchAll(/(\w+): NEO\.(\w+)/g)].map(m => [m[1], NEO[m[2]]]));
// manager-head.html at #45: dark selected label #111111; light keeps Storybook's hard-coded #FFFFFF.
const out = { source: 'balbonits/a11y-design-system fix/sb-manager-aa @ 79f89b7 .storybook/manager.ts', light: { ...theme('light'), selectedText: '#ffffff' }, dark: { ...theme('dark'), selectedText: '#111111' } };
fs.writeFileSync(path.join(here, 'baseline.json'), JSON.stringify(out, null, 2) + '\n');
console.log(Object.keys(out.light).length, 'light and', Object.keys(out.dark).length, 'dark fields');
