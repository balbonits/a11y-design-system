// Runs axe on every Storybook story and docs page in every registered theme in light and dark, plus:
//  - an OS-dark pass: docs pages with mode Auto under prefers-color-scheme: dark (QA bug 1, Tokens specimens),
//  - a reduced-motion check (no running animations).
// Usage: node scripts/a11y.mjs [baseUrl]   (default http://127.0.0.1:6007, a served storybook-static)
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { runManager } from './a11y-manager.mjs';
// Every registered theme (src/themes/registry.json) in light and dark. No theme names here.
const REGISTRY = JSON.parse(fs.readFileSync(new URL('../src/themes/registry.json', import.meta.url), 'utf8'));
const COMBOS = REGISTRY.flatMap(({ id }) => ['light', 'dark'].map((m) => `${id}~${m}`));

const require = createRequire(import.meta.url);
const axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const base = process.argv[2] ?? 'http://127.0.0.1:6007';
const exe = process.env.CHROME_PATH ?? '/usr/bin/google-chrome';
const index = await (await fetch(`${base}/index.json`)).json();
const stories = Object.values(index.entries).filter((e) => e.type === 'story');
const docs = Object.values(index.entries).filter((e) => e.type === 'docs');

const browser = await chromium.launch({ executablePath: exe });
let failures = 0;
const results = [];
const OS_DARK = REGISTRY.map(({ id }) => `${id}~auto`);
for (const motion of ['no-preference', 'reduce', 'os-dark']) {
  const ctx = await browser.newContext({ reducedMotion: motion === 'reduce' ? 'reduce' : 'no-preference', colorScheme: motion === 'os-dark' ? 'dark' : 'light', viewport: { width: 1024, height: 768 } });
  const page = await ctx.newPage();
  const targets = motion === 'reduce' ? stories.filter((s) => /modal|toast|button--loading/.test(s.id)) : motion === 'os-dark' ? docs : [...stories, ...docs];
  for (const theme of motion === 'os-dark' ? OS_DARK : COMBOS) {
    const [th, md] = theme.split('~');
    for (const s of targets) {
      const mode = s.type === 'docs' ? 'docs' : 'story';
      await page.goto(`${base}/iframe.html?id=${s.id}&viewMode=${mode}&globals=theme:${th};mode:${md}`, { waitUntil: 'load' });
      await page.waitForSelector('#storybook-root > *, #storybook-docs > *', { timeout: 15000 });
      await page.waitForTimeout(mode === 'docs' ? 1200 : 400); // let entry animations (toast pop) finish so axe measures settled colors
      if (motion === 'reduce') {
        const anim = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);
        if (anim) { failures++; console.log(`FAIL reduced-motion ${theme} ${s.id}: ${anim} running animations`); }
        continue;
      }
      await page.addScriptTag({ content: axeSrc });
      const v = await page.evaluate(async () => {
        const r = await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] });
        return r.violations.map((x) => ({ id: x.id, impact: x.impact, n: x.nodes.length, target: String(x.nodes[0]?.target) }));
      });
      const bad = v.filter((x) => x.impact === 'serious' || x.impact === 'critical');
      const label = motion === 'os-dark' ? `${theme}(OS dark)` : theme;
      results.push({ theme: label, id: s.id, violations: v });
      if (bad.length) { failures++; console.log(`FAIL ${label} ${s.id}`, JSON.stringify(bad)); }
    }
  }
  await ctx.close();
}
failures += await runManager(browser); // the manager page itself, light + dark (SB-MANAGER-AA)
await browser.close();
const minor = results.flatMap((r) => r.violations.filter((x) => x.impact !== 'serious' && x.impact !== 'critical').map((x) => `${r.theme} ${r.id} ${x.impact} ${x.id}`));
console.log(`axe: ${results.length} runs (${stories.length} stories + ${docs.length} docs pages x ${COMBOS.length} theme/mode combos, plus ${docs.length} docs pages x ${OS_DARK.length} theme(s) in OS dark), ${failures} failing. Minor/moderate: ${minor.length}`);
if (minor.length) console.log(minor.join('\n'));
process.exit(failures ? 1 : 0);
