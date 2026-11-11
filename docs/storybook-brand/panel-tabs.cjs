// FU-SB-PANEL-TABS-44 gate (HANDOFF section 4a). Usage: node docs/storybook-brand/panel-tabs.cjs <base-url> [--strip]
// Runs at 320, 599 and 600 with the addon panel open. --strip removes the PANEL-TABS-44 block from the served manager head
// (the negative control: hits must fail, collapse and geometry must match). Exits 1 on any failure.
// FU-SB-PANEL-TABS-FOCUS rows run at 320, 599 and 1280 (focus section below). --strip-focus removes the PANEL-TABS-FOCUS block and runs
// only those rows (the negative control: the focused selected tab must show no ring and no change, so it must fail).
// --shots <dir> also writes the focused-selected-tab bar crops for the HANDOFF.
// Needs playwright-core and Chrome (/usr/bin/google-chrome or CHROME env).
const { chromium } = require('playwright-core');
const base = (process.argv[2] || 'http://127.0.0.1:8961/').replace(/\/?$/, '/'), STRIP = process.argv.includes('--strip');
const STRIP_FOCUS = process.argv.includes('--strip-focus'), SHOTS = process.argv.includes('--shots') ? process.argv[process.argv.indexOf('--shots') + 1] : null;
// Baseline = the same build with the PANEL-TABS-44 block stripped (what main renders). Collapse, tab widths and the tablist's x and width
// must equal the baseline; only the hit areas change. Expected collapse in 8.6.19 with Ember UI's addons is also pinned below.
const EXPECT = { 320: 'Controls|Addons', 599: 'Controls|Actions|Accessibility' };
let pass = 0, fail = 0, ok0 = true; const ok = (c, m) => { c ? pass++ : (fail++, console.log('FAIL ' + m)); };
const strip = (html) => html.replace(/\/\* PANEL-TABS-44 start[\s\S]*?\/\* PANEL-TABS-44 end \*\//, '');
const stripFocus = (html) => html.replace(/\/\* PANEL-TABS-FOCUS start[\s\S]*?\/\* PANEL-TABS-FOCUS end \*\//, '');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome' });
  const baseG = {};
  for (const pass0 of (STRIP_FOCUS ? [] : STRIP ? ['test'] : ['baseline', 'test'])) for (const mode of ['light', 'dark']) for (const w of [320, 599, 600]) {
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

  // ---- FU-SB-PANEL-TABS-FOCUS (HANDOFF section 4b). Ring = 3px solid --eb-focus, offset -3px, on :focus-visible, every addon tab.
  if (!STRIP) {
    const RING = [0xe0, 0x21, 0x7a], near = (d, i) => Math.abs(d[i] - RING[0]) + Math.abs(d[i + 1] - RING[1]) + Math.abs(d[i + 2] - RING[2]) < 60;
    const lum = (c) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
    const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
    const dec = await (await b.newContext()).newPage();
    const pixels = async (buf) => dec.evaluate(async (b64) => { const i = new Image(); i.src = 'data:image/png;base64,' + b64; await i.decode(); const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return { w: i.width, h: i.height, d: Array.from(x.getImageData(0, 0, i.width, i.height).data) }; }, buf.toString('base64'));
    // Ring coverage per side, by pixels (not computed style). The clip is the tab's border box rounded outward, so a tab edge on a
    // fractional x (tabs sit at e.g. 423.8px) still has its whole ring in frame. For each side, look at the 4 pixel lines just inside the
    // edge (corners excluded) and count the lines that are at least 90% ring colour. A 3px ring covers at least 2 of them, whatever the
    // subpixel offset. A clipped or missing side scores 0 or 1.
    const sides = (px) => { const { w, h, d } = px, at = (x, y) => (y * w + x) * 4, cov = (xs, ys) => { let n = 0, k = 0; for (const y of ys) for (const x of xs) { k++; if (near(d, at(x, y))) n++; } return n / k; };
      const R = (a, z) => Array.from({ length: Math.max(0, z - a) }, (_, i) => a + i), X = R(5, w - 5), Y = R(5, h - 5);
      const lines = (arr, f) => arr.filter(i => f(i) >= .9).length;
      return { top: lines(R(0, 4), y => cov(X, [y])), bottom: lines(R(h - 4, h), y => cov(X, [y])), left: lines(R(0, 4), x => cov([x], Y)), right: lines(R(w - 4, w), x => cov([x], Y)) }; };
    const diff = (a, c) => { let n = 0; for (let i = 0; i < a.d.length; i += 4) if (Math.abs(a.d[i] - c.d[i]) + Math.abs(a.d[i + 1] - c.d[i + 1]) + Math.abs(a.d[i + 2] - c.d[i + 2]) > 30) n++; return n; };
    const effBg = (p, sel) => p.evaluate((s) => { for (let n = document.querySelector(s); n; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor.match(/[\d.]+/g).map(Number); if (c.length < 4 || c[3] > 0) return c.slice(0, 3); } return [255, 255, 255]; }, sel);
    for (const mode of ['light', 'dark']) for (const w of [320, 599, 1280]) {
      const tag = `focus ${mode} ${w}`;
      const ctx = await b.newContext({ viewport: { width: w, height: 800 }, colorScheme: mode }); const p = await ctx.newPage();
      if (STRIP_FOCUS) await p.route(u => { const q = new URL(u).pathname; return q === '/' || q.endsWith('/index.html'); }, async r => { const f = await r.fetch(); r.fulfill({ response: f, body: stripFocus(await f.text()) }); });
      await p.goto(base + '?path=/story/components-button--primary'); await p.waitForSelector('#storybook-preview-iframe'); await p.waitForTimeout(1500);
      if (w < 600) { await p.click('button[title="Open addon panel"]'); await p.waitForTimeout(900); }
      await p.addStyleTag({ content: '*,*::before,*::after{transition:none!important}' });
      const SEL = '.sb-bar [role="tablist"] .tabbutton.tabbutton-active', UNSEL = '.sb-bar [role="tablist"] .tabbutton:not(.tabbutton-active)';
      // The first visible unselected tab (at 320 that's the "Addons" menu tab). Marked with a data attribute; no css-* hashes.
      await p.evaluate((u) => { const t = [...document.querySelectorAll(u)].find(e => getComputedStyle(e).visibility === 'visible'); if (t) t.setAttribute('data-gate-unsel', ''); }, UNSEL);
      const UN = '[data-gate-unsel]';
      const shot = async (sel) => { const q = await p.locator(sel).boundingBox(), x = Math.floor(q.x), y = Math.floor(q.y); return pixels(await p.screenshot({ clip: { x, y, width: Math.ceil(q.x + q.width) - x, height: Math.ceil(q.y + q.height) - y } })); };
      const kbFocus = async (sel) => { await p.keyboard.press('Shift'); await p.evaluate((s) => document.querySelector(s).focus(), sel); return p.evaluate((s) => document.querySelector(s).matches(':focus-visible'), sel); };
      const blur = () => p.evaluate(() => document.activeElement && document.activeElement.blur());
      const eb = await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--eb-focus').trim().toLowerCase());
      ok(STRIP_FOCUS || eb === '#e0217a', `${tag} --eb-focus is ${eb}, want #e0217a`);
      // Selected tab: unfocused vs keyboard-focused.
      await p.mouse.move(0, 0); const s0 = await shot(SEL);
      if (SHOTS && !STRIP_FOCUS) await p.locator('.sb-bar:has([role="tablist"])').first().screenshot({ path: `${SHOTS}/sb-panel-tabs-focus-${w}-${mode}-unfocused.png` }); const fv = await kbFocus(SEL); const s1 = await shot(SEL); const sd = sides(s1), dn = diff(s0, s1);
      ok(fv, `${tag} selected tab not :focus-visible after keyboard focus`);
      ok(Object.values(sd).every(v => v >= 2), `${tag} selected focused ring lines per side ${JSON.stringify(sd)}, want >= 2 on every side (unclipped, over the underline)`);
      ok(dn >= (s1.w + s1.h) * 2 * 3 * .5, `${tag} focused selected tab changed ${dn} px, want a visible change`);
      if (SHOTS && !STRIP_FOCUS) { const bar = p.locator('.sb-bar:has([role="tablist"])').first(); await bar.screenshot({ path: `${SHOTS}/sb-panel-tabs-focus-${w}-${mode}.png` }); }
      const bgSel = await effBg(p, SEL); await blur();
      // Unselected tab, keyboard-focused.
      const u0 = await shot(UN); const fu = await kbFocus(UN); const u1 = await shot(UN); const ud = sides(u1);
      ok(fu && Object.values(ud).every(v => v >= 2), `${tag} unselected focused ring sides ${JSON.stringify(ud)}`);
      const bgUn = await effBg(p, UN); await blur();
      // Hovered + focused (unselected).
      await p.hover(UN); const bgHov = await effBg(p, UN); const fh = await kbFocus(UN); const hd = sides(await shot(UN));
      ok(fh && Object.values(hd).every(v => v >= 2), `${tag} hovered focused ring sides ${JSON.stringify(hd)}`); await blur(); await p.mouse.move(0, 0);
      // 3:1 against the tab's own (effective) background, selected / unselected / hovered.
      for (const [k, bg] of [['selected', bgSel], ['unselected', bgUn], ['hovered', bgHov]]) { const c = cr(RING, bg); ok(c >= 3, `${tag} ring vs ${k} bg rgb(${bg}) ${c.toFixed(2)} < 3`); if (!STRIP_FOCUS && w === 1280) console.log(`  ${mode} ring #e0217a vs ${k} tab bg rgb(${bg.join(',')}) = ${c.toFixed(2)}:1`); }
      // Negative: a mouse click focuses the tab but must not show the ring.
      await p.click(UN); await p.waitForTimeout(300); const cv = await p.evaluate((s) => { const t = document.querySelector(s); return { focused: document.activeElement === t, fv: t.matches(':focus-visible') }; }, UN);
      const cd = sides(await shot(UN)); ok(!cv.fv && Object.values(cd).every(v => v === 0), `${tag} mouse click shows a ring (focus-visible ${cv.fv}, sides ${JSON.stringify(cd)})`);
      await ctx.close();
    }
  }
  await b.close(); console.log(`panel-tabs ${base}${STRIP ? ' (--strip)' : STRIP_FOCUS ? ' (--strip-focus)' : ''}: ${pass} pass, ${fail} fail`); process.exit(fail ? 1 : 0);
})();
