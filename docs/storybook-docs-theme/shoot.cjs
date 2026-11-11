// Annotated shots of the docs page (preview iframe) from a scratch build with mock/preview.tsx + mock/preview-head.html
// applied (HANDOFF "Reproduce"). Usage: NODE_PATH=<dir with playwright-core> node shoot.cjs <baseUrl> [prefix]
// Then run: python3 compose.py (adds the legends and writes 8-bit RGB PNGs).
// A prefix of "main" shoots an unmodified main build for the before/after pair (no annotations).
const { chromium } = require('playwright-core'); const path = require('path');
const base = (process.argv[2] || 'http://127.0.0.1:6007').replace(/\/$/, ''); const prefix = process.argv[3] || 'docs'; const dir = path.join(__dirname, 'handoff');
// Each annotated element gets a dashed outline and a numbered badge; the legend (number: note) is drawn under the
// shot by compose.py, so labels never cover the UI.
const ANN = (items) => { const legend = []; let n = 0;
  for (const [sel, txt, bg] of items) { const e = document.querySelector(sel); if (!e) continue; const r = e.getBoundingClientRect(); if (!r.width || r.bottom < 0 || r.top > innerHeight) continue; n++;
    const d = document.createElement('div'); Object.assign(d.style, { position: 'fixed', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', outline: `2px dashed ${bg}`, zIndex: 2147483647, pointerEvents: 'none' });
    const t = document.createElement('span'); t.textContent = String(n); Object.assign(t.style, { position: 'absolute', left: '-2px', top: r.top > 20 ? '-18px' : '-2px', background: bg, color: '#fff', font: '700 11px/16px monospace', minWidth: '16px', textAlign: 'center' }); d.appendChild(t); document.body.appendChild(d);
    legend.push([n, txt.replace('{wh}', Math.round(r.width) + 'x' + Math.round(r.height)), bg]); }
  return legend; };
const G = '#008a5a', P = '#7a2bd6';
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome' }); const out = []; const legends = {};
  const widths = prefix === 'main' ? [375] : [320, 375, 599, 600, 1280];
  for (const w of widths) for (const mode of ['light', 'dark']) {
    const p = await b.newPage({ viewport: { width: w, height: 800 } }); let legend = [];
    const go = async (id) => { await p.goto(`${base}/iframe.html?id=${id}&viewMode=docs&globals=theme:neo;mode:${mode}`, { waitUntil: 'load' }); await p.waitForSelector('.sbdocs-wrapper'); await p.waitForTimeout(1200); };
    // A: Introduction top: headings, link + focus ring, inline code, code block + Copy.
    await go('introduction--docs');
    if (prefix !== 'main') {
      await p.evaluate(() => { const a = [...document.querySelectorAll('.sbdocs-content a')].find((x) => x.textContent.trim() === 'Tokens'); a.focus({ focusVisible: true }); });
      await p.evaluate(() => { const s = document.querySelector('.docblock-source'); const y = s.getBoundingClientRect().bottom + scrollY - innerHeight + 16; if (y > 0) scrollTo(0, Math.min(y, document.querySelector('h1').getBoundingClientRect().top + scrollY - 8)); });
      legend = await p.evaluate(ANN, [['.sbdocs h1', '1 h1 --font-display, --text on --surface', P, 'below'],
        ['.sbdocs-content a:focus', '2 link --accent-hover/--accent, focus 3px --focus-ring-color', G],
        ['.sbdocs-content p code', '3 inline code: --surface-muted, 1px --border-subtle', P, 'below'],
        ['.docblock-source', '4 code block: --surface-muted, 2px --border, radius 12; syntax = tokens', P],
        ['.docblock-source > div:has(> button) > button', '5 Copy {wh}, inset 4px', G]]);
    }
    await p.waitForTimeout(150); let f = path.join(dir, `${prefix}-${w}-${mode}-intro.png`); await p.screenshot({ path: f }); out.push(f); legends[path.basename(f)] = legend; legend = [];
    // B: Button docs: Canvas toolbar + Show code + ArgTypes.
    await go('components-button--docs');
    await p.evaluate(() => { const pr = document.querySelector('.sbdocs-preview'); scrollTo(0, pr.getBoundingClientRect().top + scrollY - 120); });
    if (prefix !== 'main') legend = await p.evaluate(ANN, [['.sbdocs-preview', '1 Canvas: 2px --border, no shadow', P],
      ['.sbdocs-preview > .sb-bar', '2 Canvas toolbar 48px: barBg --surface, icons --text-muted', P, 'below'],
      ['.sbdocs-preview > .sb-bar button', '3 zoom {wh}, all of it tappable', G, 'below'],
      ['.docblock-code-toggle', '4 Show code {wh}, inset 4px', G, 'below'],
      ['.docblock-argstable', '5 ArgTypes: --text, rules --border-subtle', P, 'below']]);
    await p.waitForTimeout(150); f = path.join(dir, `${prefix}-${w}-${mode}-canvas.png`); await p.screenshot({ path: f }); out.push(f); legends[path.basename(f)] = legend;
    await p.close();
  }
  await b.close(); require('fs').writeFileSync(path.join(dir, `${prefix}-legends.json`), JSON.stringify(legends, null, 1)); console.log(out.join('\n'));
})();
