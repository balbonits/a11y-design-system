// FU-SB-DOCS-ANCHOR-KBD shots: a heading anchor with keyboard focus (pointer away) at 320, 375 and 1280 in light and
// dark, plus the longest heading at 320 (wraps; the icon stays with the last word). Writes raw PNGs (2x) and a JSON of
// measured boxes (CSS px, relative to the clip) for anchor-compose.py to annotate.
// Usage: NODE_PATH=<dir with playwright-core> node anchor-shots.cjs <baseUrl> <outDir>
const { chromium } = require('playwright-core'); const fs = require('fs'); const path = require('path');
const base = (process.argv[2] || 'http://127.0.0.1:6007').replace(/\/$/, ''); const out = process.argv[3] || 'handoff';
const SHOTS = [];
for (const w of [320, 375, 1280]) for (const mode of ['light', 'dark']) SHOTS.push({ name: `docs-${w}-${mode}-anchor-focus`, w, mode, id: 'components-button--docs', h: 'usage' });
for (const mode of ['light', 'dark']) SHOTS.push({ name: `docs-320-${mode}-anchor-longest`, w: 320, mode, id: 'tokens--docs', h: 'longest' });
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome' }); const meta = {};
  for (const s of SHOTS) {
    const ctx = await b.newContext({ viewport: { width: s.w, height: 800 }, deviceScaleFactor: 2 }); const p = await ctx.newPage();
    await p.goto(`${base}/iframe.html?id=${s.id}&viewMode=docs&globals=theme:neo;mode:${s.mode}`, { waitUntil: 'load' });
    await p.waitForSelector('a[data-eb-anchor]'); await p.waitForTimeout(1200);
    const hid = s.h === 'longest' ? await p.evaluate(() => { let best = null; document.querySelectorAll('.sbdocs-content :is(h1,h2,h3,h4)').forEach((h) => { if (h.querySelector('a[data-eb-anchor]') && (!best || h.textContent.length > best.textContent.length)) best = h; }); return best.id; }) : s.h;
    const a = await p.$(`#${hid} a[data-eb-anchor]`); await a.scrollIntoViewIfNeeded();
    await p.evaluate((id) => window.scrollBy(0, document.getElementById(id).getBoundingClientRect().top - 120), hid);
    await p.keyboard.press('Shift'); await a.focus(); await p.mouse.move(1, 799); await p.waitForTimeout(150);
    const m = await p.evaluate((id) => { const h = document.getElementById(id), a = h.querySelector('a[data-eb-anchor]'); const R = (r) => ({ x: r.left, y: r.top, w: r.width, h: r.height });
      const col = document.querySelector('.sbdocs-content').getBoundingClientRect(); return { heading: R(h.getBoundingClientRect()), anchor: R(a.getBoundingClientRect()), icon: R(a.querySelector('svg').getBoundingClientRect()), col: R(col), name: a.getAttribute('aria-label'), ring: getComputedStyle(a.querySelector('svg')).outlineColor, ringW: getComputedStyle(a.querySelector('svg')).outlineWidth, ringOnBox: getComputedStyle(a).outlineStyle, fv: a.matches(':focus-visible'), sw: document.documentElement.scrollWidth }; }, hid);
    const top = Math.max(0, Math.floor(m.heading.y - 40)), height = Math.ceil(m.heading.h + 80);
    const clip = { x: 0, y: top, width: s.w, height };
    await p.screenshot({ path: path.join('/tmp/akshots', `${s.name}.raw.png`), clip });
    for (const k of ['heading', 'anchor', 'icon', 'col']) m[k].y -= top;
    meta[s.name] = { ...s, ...m, clip }; await ctx.close();
  }
  fs.writeFileSync(path.join('/tmp/akshots', 'anchor-shots.json'), JSON.stringify(meta, null, 1)); await b.close(); console.log(Object.keys(meta).length, 'shots');
})();
