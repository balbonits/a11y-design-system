// axe on every docs page at 375 and 1280, neo Light, Dark, and Auto under OS dark. Fails on serious or critical.
// Usage: NODE_PATH=<dir with playwright-core and axe-core> node axe-docs.cjs <baseUrl>
const { chromium } = require('playwright-core'); const fs = require('fs');
const axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const base = (process.argv[2] || 'http://127.0.0.1:6007').replace(/\/$/, '');
(async () => {
  const docs = Object.values((await (await fetch(`${base}/index.json`)).json()).entries).filter((e) => e.type === 'docs');
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome' }); let runs = 0, failing = 0, minor = 0;
  for (const w of [375, 1280]) for (const [mode, scheme] of [['light', 'light'], ['dark', 'light'], ['auto', 'dark']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: scheme }); const p = await ctx.newPage();
    for (const d of docs) {
      await p.goto(`${base}/iframe.html?id=${d.id}&viewMode=docs&globals=theme:neo;mode:${mode}`, { waitUntil: 'load' });
      await p.waitForSelector('#storybook-docs .sbdocs-wrapper'); await p.waitForTimeout(1200); await p.addScriptTag({ content: axeSrc });
      const v = await p.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] })).violations.map((x) => ({ id: x.id, impact: x.impact, n: x.nodes.length, t: String(x.nodes[0]?.target) })));
      runs++; const bad = v.filter((x) => x.impact === 'serious' || x.impact === 'critical'); minor += v.length - bad.length;
      if (bad.length) { failing++; console.log(`FAIL ${w} ${mode}${mode === 'auto' ? '/OS-dark' : ''} ${d.id}`, JSON.stringify(bad)); }
    }
    await ctx.close();
  }
  await b.close(); console.log(`axe-docs ${base}: ${runs} runs (docs pages x 2 widths x 3 modes), ${failing} failing, ${minor} minor/moderate`); process.exit(failing ? 1 : 0);
})();
