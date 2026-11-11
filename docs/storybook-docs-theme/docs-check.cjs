// STORYBOOK-DOCS-THEME rendered gate. Loads a built Storybook's docs pages (the preview iframe) and checks:
//  A. fidelity: page, text, link and code-block colors equal the neo token for the active mode (theme-map.json)
//  B. text contrast: every text node in Storybook's docs chrome (outside the Ember stories), alpha composited
//     over its real background: 4.5:1, or 3:1 for large text (24px, or 18.66px bold)
//  C. UI contrast: Canvas border, code-block border, Copy/Show code borders, zoom icons, focus ring: 3:1
//  D. live mode: data-mode flips and an OS color-scheme flip (Mode Auto) re-theme the page without a reload
//  E. targets: every docs button (Copy, Show code, zoom) is at least 44x44 and elementFromPoint lands on it at
//     the centre, the 4 edge midpoints (1px inside) and the 4 corners (4px inside, past a 12px radius)
//  F. no sideways scroll at any width; G. no running animations or transitions under prefers-reduced-motion
// Usage: NODE_PATH=<dir with playwright-core> node docs-check.cjs <baseUrl>   exits 1 on any failure.
const { chromium } = require('playwright-core');
const tokens = require(process.env.TOKENS || require('path').resolve(__dirname, '../../src/tokens.json')).themes.neo;
const base = (process.argv[2] || 'http://127.0.0.1:6007').replace(/\/$/, '');
const PAGES = ['introduction--docs', 'tokens--docs', 'components-button--docs', 'components-table--docs'];
const WIDTHS = [320, 375, 599, 600, 1280];
const LINK = { light: '--accent-hover', dark: '--accent' };
const hex = (h) => { const n = parseInt(h.slice(1), 16); return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`; };
let fails = 0, passes = 0; const minText = {}, minUi = {};
const ok = (cond, msg) => { if (cond) passes++; else { fails++; console.log('FAIL', msg); } };

// Runs in the page: luminance, compositing and the element scans.
const PAGE_FNS = () => {
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const over = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
  const lum = (c) => { const ch = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const bgOf = (el) => { const stack = []; for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a >= 1) break; } } let acc = { r: 255, g: 255, b: 255, a: 1 }; for (let i = stack.length - 1; i >= 0; i--) acc = over(stack[i], acc); return acc; };
  const chrome = (el) => el.closest('.sbdocs') && !el.closest('.ember, #storybook-root, .docs-story > div:first-child');
  window.__dc = { parse, over, ratio, bgOf, chrome };
};

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome' });
  const open = async (ctx, id, mode) => {
    const page = await ctx.newPage(); await page.addInitScript(PAGE_FNS);
    await page.goto(`${base}/iframe.html?id=${id}&viewMode=docs&globals=theme:neo;mode:${mode}`, { waitUntil: 'load' });
    await page.waitForSelector('#storybook-docs .sbdocs-wrapper'); await page.waitForTimeout(1200); return page;
  };
  // A-C at 375 and 1280, in Light, Dark, and Auto under OS light and OS dark.
  for (const [mode, scheme] of [['light', 'light'], ['dark', 'light'], ['auto', 'light'], ['auto', 'dark']]) {
    const eff = mode === 'auto' ? scheme : mode; const T = tokens[eff];
    for (const w of [375, 1280]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, colorScheme: scheme });
      for (const id of PAGES) {
        const page = await open(ctx, id, mode); const tag = `${mode}${mode === 'auto' ? '/OS-' + scheme : ''} ${w} ${id}`;
        const r = await page.evaluate(({ link, surface, muted }) => {
          const { parse, ratio, bgOf, chrome, over } = window.__dc; const out = { text: [], ui: [], fid: {} };
          const wr = document.querySelector('.sbdocs-wrapper'); out.fid.page = getComputedStyle(wr).backgroundColor;
          out.fid.h1 = getComputedStyle(document.querySelector('.sbdocs h1')).color;
          const a = document.querySelector('.sbdocs-content a:not(.em-btn):not([aria-hidden])'); out.fid.link = a ? getComputedStyle(a).color : null;
          const src = document.querySelector('.docblock-source'); out.fid.code = src ? getComputedStyle(src).backgroundColor : null;
          for (const el of document.querySelectorAll('.sbdocs *')) {
            if (!chrome(el)) continue; const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
            const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()); if (!own) continue;
            const b = el.getBoundingClientRect(); if (!b.width || !b.height) continue;
            const bg = bgOf(el); const fg = over(parse(cs.color), bg); const px = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700;
            const large = px >= 24 || (bold && px >= 18.66);
            const cat = el.closest('.docblock-source') ? 'code block' : el.closest('code') ? 'inline code' : el.closest('a') ? 'link' : el.closest('h1,h2,h3,h4') ? 'heading' : el.closest('.docblock-argstable') ? 'ArgTypes table' : el.closest('table') ? 'table' : el.closest('button') ? 'docs button' : 'body text';
            out.text.push({ cat, r: ratio(fg, bg), min: large ? 3 : 4.5, t: el.textContent.trim().slice(0, 30) });
          }
          const ui = (cat, fgc, el) => { const bg = bgOf(el.parentElement || el); out.ui.push({ cat, r: ratio(parse(fgc), bg) }); };
          document.querySelectorAll('.sbdocs-preview').forEach((p) => ui('Canvas border', getComputedStyle(p).borderTopColor, p));
          document.querySelectorAll('.docblock-source').forEach((p) => ui('code-block border', getComputedStyle(p).borderTopColor, p));
          document.querySelectorAll('.docblock-code-toggle, .docblock-source > div > button').forEach((p) => ui('Copy/Show code border', getComputedStyle(p).borderTopColor, p.closest('.docs-story, .docblock-source')));
          document.querySelectorAll('.sbdocs-preview > .sb-bar button svg').forEach((s) => { const bar = s.closest('.sb-bar'); out.ui.push({ cat: 'zoom icon', r: ratio(parse(getComputedStyle(s).color), bgOf(bar)) }); });
          const fr = parse(getComputedStyle(document.documentElement).getPropertyValue('--focus-ring-color').trim().replace(/^#(..)(..)(..)$/, (m, r, g, b) => `rgb(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)})`));
          out.ui.push({ cat: 'focus ring on page', r: ratio(fr, parse(surface)) }); out.ui.push({ cat: 'focus ring on code block', r: ratio(fr, parse(muted)) });
          return out;
        }, { link: hex(T[LINK[eff]]), surface: hex(T['--surface']), muted: hex(T['--surface-muted']) });
        ok(r.fid.page === hex(T['--surface']), `${tag} A page bg ${r.fid.page} != --surface ${T['--surface']}`);
        ok(r.fid.h1 === hex(T['--text']), `${tag} A h1 ${r.fid.h1} != --text ${T['--text']}`);
        if (r.fid.link) ok(r.fid.link === hex(T[LINK[eff]]), `${tag} A link ${r.fid.link} != ${LINK[eff]} ${T[LINK[eff]]}`);
        if (r.fid.code) ok(r.fid.code === hex(T['--surface-muted']), `${tag} A code block ${r.fid.code} != --surface-muted ${T['--surface-muted']}`);
        for (const x of r.text) { const k = `${eff} ${x.cat}`; minText[k] = Math.min(minText[k] ?? 99, x.r); ok(x.r >= x.min - 1e-9, `${tag} B ${x.cat} "${x.t}" ${x.r.toFixed(2)} < ${x.min}`); }
        for (const x of r.ui) { const k = `${eff} ${x.cat}`; minUi[k] = Math.min(minUi[k] ?? 99, x.r); ok(x.r >= 3, `${tag} C ${x.cat} ${x.r.toFixed(2)} < 3`); }
        await page.close();
      }
      await ctx.close();
    }
  }
  // D. live switching through the manager's Mode global (the real toolbar path), no reload of the page under test.
  { const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' }); const page = await ctx.newPage();
    await page.goto(`${base}/?path=/docs/components-button--docs&globals=theme:neo;mode:light`, { waitUntil: 'load' });
    const frame = () => page.frames().find((f) => f.url().includes('iframe.html'));
    const bg = async () => { await page.waitForTimeout(800); await frame().waitForSelector('.sbdocs-wrapper'); return frame().evaluate(() => getComputedStyle(document.querySelector('.sbdocs-wrapper')).backgroundColor); };
    const setMode = (mode) => page.evaluate((m) => window.__STORYBOOK_ADDONS_CHANNEL__.emit('updateGlobals', { globals: { mode: m } }), mode);
    ok(await bg() === hex(tokens.light['--surface']), 'D start Light');
    await setMode('dark'); ok(await bg() === hex(tokens.dark['--surface']), 'D Mode -> Dark');
    await setMode('auto'); ok(await bg() === hex(tokens.light['--surface']), 'D Mode -> Auto under OS light');
    await page.emulateMedia({ colorScheme: 'dark' }); ok(await bg() === hex(tokens.dark['--surface']), 'D Auto, OS flips to dark');
    await setMode('light'); ok(await bg() === hex(tokens.light['--surface']), 'D Mode -> Light while OS dark');
    await ctx.close(); }
  // E-F at every width.
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 800 } });
    for (const id of PAGES) {
      const page = await open(ctx, id, 'light');
      const sw = await page.evaluate(() => document.documentElement.scrollWidth); ok(sw <= w, `F ${w} ${id} scrollWidth ${sw} > ${w}`);
      for (const e of await page.$$('.sbdocs button:not(.em-btn):not(.em-sort):not([role="tab"])')) {
        if (await e.evaluate((el) => !!el.closest('.ember, #storybook-root'))) continue;
        await e.scrollIntoViewIfNeeded();
        const r = await e.evaluate((el) => { const b = el.getBoundingClientRect(); const P = [[b.left + b.width / 2, b.top + b.height / 2], [b.left + b.width / 2, b.top + 1], [b.left + b.width / 2, b.bottom - 1], [b.left + 1, b.top + b.height / 2], [b.right - 1, b.top + b.height / 2], [b.left + 4, b.top + 4], [b.right - 4, b.top + 4], [b.left + 4, b.bottom - 4], [b.right - 4, b.bottom - 4]];
          return { t: (el.getAttribute('aria-label') || el.title || el.textContent).trim().slice(0, 16), w: b.width, h: b.height, hits: P.map(([x, y]) => { const h = document.elementFromPoint(x, y); return h && (h === el || el.contains(h)) ? 1 : 0; }).join('') }; });
        ok(r.w >= 44 && r.h >= 44 && r.hits === '111111111', `E ${w} ${id} "${r.t}" ${r.w.toFixed(1)}x${r.h.toFixed(1)} hits ${r.hits}`);
      }
      await page.close();
    }
    await ctx.close();
  }
  // G. reduced motion.
  { const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, reducedMotion: 'reduce' });
    for (const id of PAGES) { const page = await open(ctx, id, 'dark'); const n = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length); ok(n === 0, `G reduce ${id}: ${n} running`); await page.close(); }
    await ctx.close(); }
  await browser.close();
  console.log('\nLowest text contrast by mode and kind:'); for (const [k, v] of Object.entries(minText).sort()) console.log(`  ${k}: ${v.toFixed(2)}`);
  console.log('Lowest UI contrast by mode and kind:'); for (const [k, v] of Object.entries(minUi).sort()) console.log(`  ${k}: ${v.toFixed(2)}`);
  console.log(`\ndocs-check ${base}: ${passes} pass, ${fails} fail`); process.exit(fails ? 1 : 0);
})();
