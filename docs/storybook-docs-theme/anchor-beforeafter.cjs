// FU-SB-DOCS-ANCHOR-KBD (Creatives' condition 2): the same heading before (docs-theme spec at #58, Storybook's gutter anchor)
// and after (this card), hovered with a mouse so both show the icon, at 1280 and 320 in light. Captures the heading plus
// the block after it at 2x and records the heading's height and the next block's top, so "no layout shift" is measurable.
// Usage: NODE_PATH=<dir with playwright-core> node anchor-beforeafter.cjs <beforeUrl> <afterUrl> <outDir>
const { chromium } = require('playwright-core'); const fs = require('fs'); const path = require('path');
const [before, after, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const CASES = [['usage', 'components-button--docs', 'usage'], ['longest', 'tokens--docs', 'shape-the-theme-contract']];
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome' }); const meta = {};
  for (const w of [1280, 320]) for (const [label, id, hid] of CASES) for (const [which, base] of [['before', before], ['after', after]]) {
    const p = await br.newPage({ viewport: { width: w, height: 800 }, deviceScaleFactor: 2 });
    await p.goto(`${base}/iframe.html?id=${id}&viewMode=docs&globals=theme:neo;mode:light`); await p.waitForSelector('#storybook-docs .sbdocs-wrapper'); await p.waitForTimeout(1200);
    const h = await p.$(`.sbdocs-content [id="${hid}"]`); if (!h) { console.log('missing', w, label, which); await p.close(); continue; }
    await h.scrollIntoViewIfNeeded(); const hb = await h.boundingBox(); await p.mouse.move(hb.x + 4, hb.y + hb.height / 2); await p.waitForTimeout(100);
    const m = await h.evaluate((el) => { const b = el.getBoundingClientRect(); const n = el.nextElementSibling; const r = document.createRange(); r.selectNodeContents(el);
      const lines = new Set([...r.getClientRects()].filter((q) => q.width > 0).map((q) => Math.round(q.top))).size;
      return { top: b.top, h: +b.height.toFixed(2), nextTop: n ? +(n.getBoundingClientRect().top - b.top).toFixed(2) : null, lines }; });
    const name = `docs-${w}-light-anchor-${label}-${which}`;
    await p.screenshot({ path: path.join(out, name + '.png'), clip: { x: 0, y: Math.max(0, hb.y - 16), width: Math.min(w, 640), height: hb.height + 72 } });
    meta[name] = { w, label, which, ...m }; await p.close();
  }
  fs.writeFileSync(path.join(out, 'beforeafter.json'), JSON.stringify(meta, null, 1)); console.log(JSON.stringify(meta)); await br.close();
})();
