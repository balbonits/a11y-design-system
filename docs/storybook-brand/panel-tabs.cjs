// FU-SB-PANEL-TABS-44 gate (HANDOFF section 4a). Usage: node docs/storybook-brand/panel-tabs.cjs <base-url> [--strip]
// Runs at 320, 599 and 600 with the addon panel open. --strip removes the PANEL-TABS-44 block from the served manager head
// (the negative control: hits must fail, collapse and geometry must match). Exits 1 on any failure.
// Needs playwright-core and Chrome (/usr/bin/google-chrome or CHROME env).
const { chromium } = require('playwright-core');
const base = (process.argv[2] || 'http://127.0.0.1:8961/').replace(/\/?$/, '/'), STRIP = process.argv.includes('--strip');
// Baseline = the same build with the PANEL-TABS-44 block stripped (what main renders). Collapse, tab widths and the tablist's x and width
// must equal the baseline; only the hit areas change. Expected collapse in 8.6.19 with Ember UI's addons is also pinned below.
const EXPECT = { 320: 'Controls|Addons', 599: 'Controls|Actions|Accessibility' };
let pass = 0, fail = 0, ok0 = true; const ok = (c, m) => { c ? pass++ : (fail++, console.log('FAIL ' + m)); };
const strip = (html) => html.replace(/\/\* PANEL-TABS-44 start[\s\S]*?\/\* PANEL-TABS-44 end \*\//, '');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome' });
  const baseG = {};
  for (const pass0 of (STRIP ? ['test'] : ['baseline', 'test'])) for (const mode of ['light', 'dark']) for (const w of [320, 599, 600]) {
    const doStrip = pass0 === 'baseline' || STRIP;
    const ctx = await b.newContext({ viewport: { width: w, height: 800 }, colorScheme: mode }); const p = await ctx.newPage();
    if (doStrip) await p.route(u => { const q = new URL(u).pathname; return q === '/' || q.endsWith('/index.html'); }, async r => { const f = await r.fetch(); r.fulfill({ response: f, body: strip(await f.text()) }); });
    await p.goto(base + '?path=/story/components-button--primary'); await p.waitForSelector('#storybook-preview-iframe'); await p.waitForTimeout(1500);
    const tag = `${mode} ${w}`;
    if (w < 600) { await p.click('button[title="Open addon panel"]'); await p.waitForTimeout(900); }
    const r = await p.evaluate(() => {
      const tl = document.querySelector('[role="tablist"]'); if (!tl) return null;
      const bar = tl.closest('.sb-bar'), br = bar.getBoundingClientRect(), tr = tl.getBoundingClientRect();
      // DOM pin (8.6.19): the addon content is the bar's next element sibling and its only div sibling, absolutely positioned at the bar's bottom.
      const sibs = [...bar.parentElement.children].filter(e => e !== bar && e.tagName === 'DIV'), nx = bar.nextElementSibling;
      const pin = { next: !!nx && nx.tagName === 'DIV', only: sibs.length === 1 && sibs[0] === nx, abs: nx && getComputedStyle(nx).position === 'absolute', top: nx ? Math.round(nx.getBoundingClientRect().top - br.top) : -1, barH: Math.round(br.height) };
      const tabs = [...tl.querySelectorAll('.tabbutton')].map(t => { const q = t.getBoundingClientRect(), s = getComputedStyle(t); const vis = s.visibility === 'visible';
        const ys = [q.top - 1.5, q.top + .5, q.top + q.height / 2, q.bottom - .5, q.bottom + 1.5], xs = [q.left + 1, q.left + q.width / 2, q.right - 1]; let hits = 0;
        for (const y of ys) for (const x of xs) { const e = document.elementFromPoint(x, y); if (e && e.closest('.tabbutton') === t) hits++; }
        return { label: t.textContent.trim().replace(/\d+$/, '') || '(addons)', vis, w: Math.round(q.width), h: Math.round(q.height), hits, before: getComputedStyle(t, '::before').content }; });
      return { pin, tl: { x: Math.round(tr.left), w: Math.round(tr.width), h: Math.round(tr.height) }, tabs, sx: document.documentElement.scrollWidth - innerWidth };
    });
    if (pass0 === 'baseline') { baseG[tag] = r; await ctx.close(); continue; }
    ok(r, `${tag} tablist found`); if (!r) { await ctx.close(); continue; }
    const B = baseG[tag] || r;
    const visible = r.tabs.filter(t => t.vis).map(t => t.label).join('|');
    ok(r.sx <= 0, `${tag} page sideways overflow ${r.sx}`);
    if (w >= 600) { ok(r.pin.barH === 40, `${tag} addon bar ${r.pin.barH}, want 40 (nothing applies at 600+)`); ok(r.tabs.every(t => t.before === 'none'), `${tag} ::before present at 600+`); await ctx.close(); continue; }
    ok(visible === EXPECT[w], `${tag} collapse "${visible}", want "${EXPECT[w]}"`);
    for (const [i, t] of r.tabs.entries()) { const bt = B.tabs[i] || {}; ok(t.label === bt.label && t.w === bt.w && t.vis === bt.vis, `${tag} ${t.label} ${t.w}px vis=${t.vis}, baseline ${bt.label} ${bt.w}px vis=${bt.vis}`); ok(t.h === 40, `${tag} ${t.label} height ${t.h}, want 40`);
      if (t.vis) ok(t.hits === 15, `${tag} ${t.label} hits ${t.hits}/15`); else ok(t.hits === 0, `${tag} hidden ${t.label} hits ${t.hits}, want 0`); }
    ok(r.tl.x === B.tl.x && r.tl.w === B.tl.w, `${tag} tablist x ${r.tl.x} w ${r.tl.w}, baseline ${B.tl.x} / ${B.tl.w} (Storybook's horizontal margin must be untouched)`);
    ok(B.tl.h === 40 && r.tl.h === 48, `${tag} tablist height ${r.tl.h} (baseline ${B.tl.h}), want 48 (40)`);
    ok(r.pin.next && r.pin.only && r.pin.abs, `${tag} DOM pin: addon content is not the bar's only next div sibling (Storybook DOM changed; re-spec)`);
    ok(r.pin.barH === 48 && r.pin.top === 48, `${tag} addon bar ${r.pin.barH} content top +${r.pin.top}, want 48 / 48`);
    // Resize recompute: 320 -> 599 -> 320 must give the same collapse as a fresh load.
    if (w === 320) for (const ww of [599, 320]) { await p.setViewportSize({ width: ww, height: 800 }); await p.waitForTimeout(700);
      const v = await p.evaluate(() => [...document.querySelectorAll('[role="tablist"] .tabbutton')].filter(t => getComputedStyle(t).visibility === 'visible').map(t => t.textContent.trim().replace(/\d+$/, '') || '(addons)').join('|'));
      ok(v === EXPECT[ww], `${mode} resize to ${ww} collapse "${v}", want "${EXPECT[ww]}"`); }
    await ctx.close();
  }
  await b.close(); console.log(`panel-tabs ${base}${STRIP ? ' (--strip)' : ''}: ${pass} pass, ${fail} fail`); process.exit(fail ? 1 : 0);
})();
