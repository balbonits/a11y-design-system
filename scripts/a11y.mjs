// Runs axe on every Storybook story in all 6 theme x mode combos, plus a reduced-motion check.
// Usage: node scripts/a11y.mjs [baseUrl]   (default http://127.0.0.1:6007, a served storybook-static)
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const COMBOS = ['editorial', 'bold', 'tactile'].flatMap((t) => ['light', 'dark'].map((m) => `${t}-${m}`));

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
for (const motion of ['no-preference', 'reduce']) {
  const ctx = await browser.newContext({ reducedMotion: motion, viewport: { width: 1024, height: 768 } });
  const page = await ctx.newPage();
  const targets = motion === 'reduce' ? stories.filter((s) => /modal|toast|button--loading/.test(s.id)) : [...stories, ...docs];
  for (const theme of COMBOS) {
    const [th, md] = theme.split('-');
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
      results.push({ theme, id: s.id, violations: v });
      if (bad.length) { failures++; console.log(`FAIL ${theme} ${s.id}`, JSON.stringify(bad)); }
    }
  }
  await ctx.close();
}
await browser.close();
const minor = results.flatMap((r) => r.violations.filter((x) => x.impact !== 'serious' && x.impact !== 'critical').map((x) => `${r.theme} ${r.id} ${x.impact} ${x.id}`));
console.log(`axe: ${results.length} runs (${stories.length} stories + ${docs.length} docs pages x 6 theme/mode combos), ${failures} failing. Minor/moderate: ${minor.length}`);
if (minor.length) console.log(minor.join('\n'));
process.exit(failures ? 1 : 0);
