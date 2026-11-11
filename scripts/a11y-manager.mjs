// Axe on the Storybook manager page itself (toolbar, sidebar, addon panel), not only the story iframe (SB-MANAGER-AA).
// The manager follows the OS color scheme (.storybook/manager.ts), so it runs once with prefers-color-scheme light and
// once dark, on a story page (toolbar + addon panel) and a docs page. The preview iframe is excluded: a11y.mjs covers it.
// Usage: node scripts/a11y-manager.mjs [baseUrl]   (default http://127.0.0.1:6007, a served storybook-static)
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const base = process.argv[2] ?? 'http://127.0.0.1:6007';
const exe = process.env.CHROME_PATH ?? '/usr/bin/google-chrome';
const index = await (await fetch(`${base}/index.json`)).json();
const entries = Object.values(index.entries);
const story = entries.find((e) => e.type === 'story');
const doc = entries.find((e) => e.type === 'docs');
const paths = [`/story/${story.id}`, `/docs/${doc.id}`];

export async function runManager(browser) {
  let failures = 0, runs = 0;
  for (const scheme of ['light', 'dark']) for (const width of [1280, 375]) {
    const ctx = await browser.newContext({ colorScheme: scheme, viewport: { width, height: 800 } });
    const page = await ctx.newPage();
    for (const p of paths) {
      await page.goto(`${base}/?path=${p}`, { waitUntil: 'load' });
      await page.waitForSelector('#storybook-preview-iframe', { timeout: 20000 });
      await page.waitForTimeout(1500);
      await page.addScriptTag({ content: axeSrc });
      const v = await page.evaluate(async () => {
        const r = await axe.run({ exclude: [['#storybook-preview-iframe']] }, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] });
        return r.violations.map((x) => ({ id: x.id, impact: x.impact, n: x.nodes.length, nodes: x.nodes.slice(0, 4).map((n) => `${n.target} ${n.any[0]?.message ?? ''}`) }));
      });
      runs++;
      const bad = v.filter((x) => x.impact === 'serious' || x.impact === 'critical');
      if (bad.length) { failures++; console.log(`FAIL manager ${scheme} ${width} ${p}`, JSON.stringify(bad, null, 1)); }
    }
    await ctx.close();
  }
  console.log(`axe manager: ${runs} runs (light + dark x 1280/375 x story + docs page), ${failures} failing`);
  return failures;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const browser = await chromium.launch({ executablePath: exe });
  const f = await runManager(browser);
  await browser.close();
  process.exit(f ? 1 : 0);
}
