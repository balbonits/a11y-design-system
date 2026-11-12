// FU-SB-DOCS-ANCHOR-KBD (Creatives' condition 4): touch screens ((hover: none)) show the heading-link icon at rest in
// --text-muted. Shoots Button "Usage" and the wrapped tokens heading at 320 in light and dark, 2x, in a touch context.
// Usage: NODE_PATH=<dir with playwright-core> node anchor-touch.cjs <baseUrl> <outDir>
const { chromium } = require('playwright-core'); const fs = require('fs'); const path = require('path');
const [base, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome' });
  for (const mode of ['light', 'dark']) {
    const ctx = await br.newContext({ viewport: { width: 320, height: 800 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const shots = [];
    for (const [id, hid] of [['components-button--docs', 'usage'], ['tokens--docs', 'shape-the-theme-contract']]) {
      const p = await ctx.newPage(); await p.goto(`${base}/iframe.html?id=${id}&viewMode=docs&globals=theme:neo;mode:${mode}`);
      await p.waitForSelector('#storybook-docs .sbdocs-wrapper'); await p.waitForTimeout(1200);
      const h = await p.$(`.sbdocs-content [id="${hid}"]`); await h.scrollIntoViewIfNeeded(); const b = await h.boundingBox();
      const f = path.join(out, `t-${mode}-${hid}.png`); await p.screenshot({ path: f, clip: { x: 0, y: Math.max(0, b.y - 12), width: 320, height: b.height + 40 } }); shots.push(f); await p.close();
    }
    await ctx.close(); console.log(mode, shots.join(' '));
  }
  await br.close();
})();
