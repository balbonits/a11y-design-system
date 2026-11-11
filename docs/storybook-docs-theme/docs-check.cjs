// STORYBOOK-DOCS-THEME rendered gate. Loads a built Storybook's docs pages (the preview iframe) and checks:
//  A. fidelity: page, text, link and code-block colors equal the neo token for the active mode (theme-map.json)
//  B. text contrast: every text node in Storybook's docs chrome (outside the Ember stories), alpha composited
//     over its real background: 4.5:1, or 3:1 for large text (24px, or 18.66px bold)
//  C. UI contrast: Canvas border, code-block border, Copy/Show code borders, zoom icons, focus ring: 3:1
//  D. live mode: data-mode flips and an OS color-scheme flip (Mode Auto) re-theme the page without a reload
//  E. targets: every docs button (Copy, Show code, zoom) is at least 44x44 and elementFromPoint lands on it at
//     the centre, the 4 edge midpoints (1px inside) and the 4 corners (4px inside, past a 12px radius)
//  F. no sideways scroll at any width; G. no running animations or transitions under prefers-reduced-motion
//  H. heading anchor targets (FU-SB-DOCS-ANCHOR-KBD): at every width each [data-eb-anchor] link is at least 44x44,
//     elementFromPoint lands on it at the centre, 4 edge midpoints and 4 corners, and its box is inside the docs
//     content column and the viewport (x >= 0, right edge <= viewport): no clipping, no overflow; no other interactive
//     target (link, button, field, tabbable) intersects the box, nor does the block right after the heading. Widths include
//     641, 800, 900, 1040 and 1095, where the old gutter anchor sat at x -4..10 (VQA's follow-up on #58)
//  I. Canvas bar never covers its story: the story starts at or below the bar's bottom edge, every width
//  J. heading anchor placement (FU-SB-DOCS-ANCHOR-KBD, replaces the NITS gutter check): at every width the heading text
//     starts at the content's left edge (the anchor never indents it), the link sits on the same line as the heading's
//     last word and to its right (the target never covers letters), each heading has exactly one link, and Storybook's
//     own anchor is not rendered; on a wrapped heading the target may reach at most 8px into the line above's text box (KI-9), and the focus ring around the icon touches none of the heading's letters. H, J and K cover every heading that has a Storybook anchor (the autodocs Title h1 has none).
//  K. keyboard and name (FU-SB-DOCS-ANCHOR-KBD), at 375 and 1280 in light and dark: every link has
//     aria-label "Link to <heading text>" (text read without any anchor; no '#'), is not aria-hidden, is in the Tab
//     order, and Tab reaches the links in document order; on focus the icon is visible, the ring (drawn on the icon) is the
//     --focus-ring-color token, solid, at least 2px, and the icon stays visible after the pointer leaves; a click lands
//     on #<id>. An h1, h2 and h3 from the real pages and an injected h4 fixture (added after load, so the observer
//     path is tested) are asserted by exact name. Each heading's own accessible name is exactly its text (getByRole).
//  L. touch (Creatives): in a hasTouch + isMobile context ((hover: none)) at 320 and 375, light and dark, every link's icon
//     is shown at rest in --text-muted at 3:1 or more against its background; with a mouse at 1280 it stays hidden at rest.
// --no-has: strips every rule whose selector uses :has() from the served preview head (a browser without :has()), then
//     runs E, F, H, I and J (K and L are skipped) with the fallback floor for E: at least 24x24 and elementFromPoint lands on the button at the
//     centre and the 4 edge midpoints (corners may be clipped by the 12px radius there, as on main). A-D and G are skipped.
// Usage: NODE_PATH=<dir with playwright-core> node docs-check.cjs <baseUrl> [--no-has]   exits 1 on any failure.
//     Tokens default to the repo's src/tokens.json; TOKENS=<path> overrides it (resolved from the current directory).
const { chromium } = require('playwright-core');
const tokens = require(process.env.TOKENS ? require('path').resolve(process.env.TOKENS) : require('path').resolve(__dirname, '../../src/tokens.json')).themes.neo;
const base = (process.argv[2] || 'http://127.0.0.1:6007').replace(/\/$/, '');
const NO_HAS = process.argv.includes('--no-has');
// Removes each `selector { ... }` rule whose selector contains :has( from <style> blocks (comments must not contain that text).
const stripHas = (html) => html.replace(/<style[\s\S]*?<\/style>/g, (st) => st.replace(/[^{}]*:has\([^{}]*\{[^{}]*\}/g, ''));
const PAGES = ['introduction--docs', 'tokens--docs', 'components-button--docs', 'components-table--docs'];
const WIDTHS = [320, 375, 599, 600, 641, 800, 900, 1040, 1095, 1280]; // 641..1095: the 20px-gutter band (VQA's #58 follow-up; 641 and 900 per CA)
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
    if (NO_HAS) await page.route((u) => new URL(u).pathname.endsWith('/iframe.html'), async (r) => { const f = await r.fetch(); r.fulfill({ response: f, body: stripHas(await f.text()) }); });
    await page.goto(`${base}/iframe.html?id=${id}&viewMode=docs&globals=theme:neo;mode:${mode}`, { waitUntil: 'load' });
    await page.waitForSelector('#storybook-docs .sbdocs-wrapper'); await page.waitForTimeout(1200); return page;
  };
  if (!NO_HAS) {
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
          const a = document.querySelector('.sbdocs-content a:not(.em-btn):not([aria-hidden]):not([data-eb-anchor])'); out.fid.link = a ? getComputedStyle(a).color : null;
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
  } // end A-D
  // E-F (and I) at every width.
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
        if (NO_HAS) ok(r.w >= 24 && r.h >= 24 && r.hits.slice(0, 5) === '11111', `E(no-has) ${w} ${id} "${r.t}" ${r.w.toFixed(1)}x${r.h.toFixed(1)} hits ${r.hits}`);
        else ok(r.w >= 44 && r.h >= 44 && r.hits === '111111111', `E ${w} ${id} "${r.t}" ${r.w.toFixed(1)}x${r.h.toFixed(1)} hits ${r.hits}`);
      }
      for (const c of await page.evaluate(() => [...document.querySelectorAll('.sbdocs-preview > .sb-bar')].map((bar) => { const st = bar.parentElement.querySelector(':scope > .docs-story'); return st ? st.getBoundingClientRect().top - bar.getBoundingClientRect().bottom : null; })))
        if (c !== null) ok(c >= -0.5, `I ${w} ${id} Canvas bar covers the story's top ${(-c).toFixed(1)}px`);
      for (const j of await page.evaluate(() => { const col = document.querySelector('.sbdocs-content').getBoundingClientRect();
        return [...document.querySelectorAll('.sbdocs-content :is(h1, h2, h3, h4)')].filter((h) => h.querySelector('a[href^="#"]')).map((h) => { const links = h.querySelectorAll('a[data-eb-anchor]'); const el = links[0];
          const src = h.querySelector(':scope > a[data-eb-anchor-src]'); const out = { name: h.textContent.trim().slice(0, 24), n: links.length, srcShown: !!src && getComputedStyle(src).display !== 'none' };
          if (!el) return out; const r = document.createRange(); r.selectNodeContents(h); const all = [...r.getClientRects()].filter((q) => q.width > 0);
          const tr = document.createRange(); const tail = el.parentElement; const txt = [...tail.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
          const s = el.querySelector('svg').getBoundingClientRect(), b = el.getBoundingClientRect();
          let last = null; if (txt) { tr.selectNodeContents(txt); const q = [...tr.getClientRects()]; last = q[q.length - 1]; }
          const first = document.createRange(); first.selectNodeContents(h); const fr = [...first.getClientRects()].filter((q) => q.width > 0 && q.height > 0)[0];
          // Text boxes of the heading's own words that the 44px target overlaps (only the line above, on wrapped headings; KI-9).
          let ov = 0; const tw = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
          for (let n = tw.nextNode(); n; n = tw.nextNode()) { if (n.parentElement.closest('a') || !n.textContent.trim()) continue; const q0 = document.createRange(); q0.selectNodeContents(n);
            for (const q of q0.getClientRects()) if (q.width > 0 && q.bottom > b.top && q.top < b.bottom && q.right > b.left && q.left < b.right) ov = Math.max(ov, Math.min(q.bottom, b.bottom) - Math.max(q.top, b.top)); }
          out.ov = +ov.toFixed(1);
          // The focus ring (around the icon: 2px offset + 3px ring) must not touch any of the heading's letters.
          const R = { l: s.left - 5, r: s.right + 5, t: s.top - 5, b: s.bottom + 5 };
          out.ringHit = 0; const tw2 = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
          for (let n = tw2.nextNode(); n; n = tw2.nextNode()) { if (n.parentElement.closest('a') || !n.textContent.trim()) continue; const q0 = document.createRange(); q0.selectNodeContents(n);
            for (const q of q0.getClientRects()) if (q.width > 0 && q.right > R.l + 0.5 && q.left < R.r - 0.5 && q.bottom - 4 > R.t && q.top + 4 < R.b) out.ringHit++; }
          Object.assign(out, { t: +fr.left.toFixed(1), c: +col.left.toFixed(1), cr: +col.right.toFixed(1), bl: +b.left.toFixed(1), br: +b.right.toFixed(1), lastR: last ? +last.right.toFixed(1) : null, sameLine: last ? (s.top + s.height / 2 >= last.top && s.top + s.height / 2 <= last.bottom) : false });
          return out; }); }))
        ok(j.n === 1 && !j.srcShown && j.lastR !== null && Math.abs(j.t - j.c) <= 0.5 && j.bl >= j.lastR - 0.5 && j.sameLine && j.ov <= 8 && j.ringHit === 0, `J ${w} ${id} "${j.name}" links ${j.n}, storybook anchor shown ${j.srcShown}, text at ${j.t} (content ${j.c}), link ${j.bl}..${j.br} vs last word end ${j.lastR}, same line ${j.sameLine}, overlaps heading text by ${j.ov}px (max 8, KI-9), ring touches ${j.ringHit} text boxes`);
      for (const a of await page.$$('.sbdocs-content a[data-eb-anchor]')) {
        await a.scrollIntoViewIfNeeded();
        const r = await a.evaluate((el) => { const b = el.getBoundingClientRect(), col = document.querySelector('.sbdocs-content').getBoundingClientRect();
          const P = [[b.left + b.width / 2, b.top + b.height / 2], [b.left + b.width / 2, b.top + 1], [b.left + b.width / 2, b.bottom - 1], [b.left + 1, b.top + b.height / 2], [b.right - 1, b.top + b.height / 2], [b.left + 4, b.top + 4], [b.right - 4, b.top + 4], [b.left + 4, b.bottom - 4], [b.right - 4, b.bottom - 4]];
          return { t: el.getAttribute('aria-label'), w: b.width, h: b.height, inCol: b.left >= Math.max(0, col.left) - 0.5 && b.right <= col.right + 0.5 && b.right <= innerWidth + 0.5, hits: P.map(([x, y]) => { const h = document.elementFromPoint(x, y); return h && (h === el || el.contains(h)) ? 1 : 0; }).join(''),
            // No other interactive target (link, button, field, tabbable) may intersect the 44px box, e.g. a link in the paragraph below.
            near: [...document.querySelectorAll('a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])')].filter((o) => o !== el && !el.contains(o) && !o.contains(el) && o.offsetParent !== null && getComputedStyle(o).visibility !== 'hidden')
              .flatMap((o) => [...o.getClientRects()].filter((q) => q.width > 0 && q.height > 0 && q.left < b.right - 0.5 && q.right > b.left + 0.5 && q.top < b.bottom - 0.5 && q.bottom > b.top + 0.5).map(() => `${o.tagName.toLowerCase()}${o.getAttribute('aria-label') ? '[' + o.getAttribute('aria-label') + ']' : ''}`)).slice(0, 3).join(' '),
            // Nor may it reach the block right after the heading (the next paragraph, list or table).
            next: (() => { const h = el.closest('h1, h2, h3, h4'); const n = h.nextElementSibling || (h.parentElement.matches('.sb-anchor') ? h.parentElement.nextElementSibling : null); if (!n) return ''; const q = n.getBoundingClientRect();
              return q.height > 0 && q.left < b.right && q.right > b.left && q.top < b.bottom - 0.5 && q.bottom > b.top ? `${n.tagName.toLowerCase()} by ${(b.bottom - q.top).toFixed(1)}px` : ''; })(),
            miss: P.map(([x, y]) => { const h = document.elementFromPoint(x, y); return h && !(h === el || el.contains(h)) ? `${h.tagName.toLowerCase()}${h.id ? '#' + h.id : ''}.${String(h.className.baseVal ?? h.className).split(' ')[0]}@${Math.round(x)},${Math.round(y)}` : null; }).filter(Boolean).slice(0, 2).join(' ') }; });
        ok(r.w >= 44 && r.h >= 44 && r.hits === '111111111' && r.inCol && !r.near && !r.next, `H ${w} ${id} "${r.t}" ${r.w.toFixed(1)}x${r.h.toFixed(1)} hits ${r.hits} inside column ${r.inCol} overlaps targets [${r.near}] next block [${r.next}] ${r.miss}`);
      }
      await page.close();
    }
    await ctx.close();
  }
  // K. keyboard order, accessible names, focus reveal and ring.
  if (!NO_HAS) for (const mode of ['light', 'dark']) for (const w of [375, 1280]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 800 } }); const seen = { H1: 0, H2: 0, H3: 0, H4: 0 };
    for (const id of PAGES) {
      const page = await open(ctx, id, mode); const tag = `K ${mode} ${w} ${id}`;
      if (id === 'components-button--docs') { // h4 fixture, added after load: the observer must pick it up.
        await page.evaluate(() => { const h = document.createElement('h4'); h.id = 'eb-fixture-h4'; const a = document.createElement('a'); a.setAttribute('aria-hidden', 'true'); a.setAttribute('tabindex', '-1'); a.href = '#eb-fixture-h4';
          a.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14"><path d="M1 1h12v12H1z" fill="currentColor"/></svg>'; h.append(a, 'Fixture heading four'); document.querySelector('.sbdocs-content').append(h); });
        await page.waitForTimeout(200);
      }
      const names = await page.evaluate(() => [...document.querySelectorAll('.sbdocs-content :is(h1, h2, h3, h4)')].filter((h) => h.querySelector('a[href^="#"]')).map((h) => { const c = h.cloneNode(true); c.querySelectorAll('a').forEach((n) => n.remove());
        const a = h.querySelector('a[data-eb-anchor]'); return { tag: h.tagName, want: 'Link to ' + c.textContent.replace(/\s+/g, ' ').trim(), got: a && a.getAttribute('aria-label'), hidden: !!(a && a.closest('[aria-hidden="true"]')), tab: a ? a.tabIndex : null, href: a && a.getAttribute('href'), id: h.id }; }));
      for (const n of names) { seen[n.tag]++; ok(n.got === n.want && !/#|\s$/.test(n.got) && !n.hidden && n.tab === 0 && n.href === '#' + n.id, `${tag} ${n.tag} name "${n.got}" want "${n.want}" aria-hidden ${n.hidden} tabIndex ${n.tab} href ${n.href}`); }
      if (id === 'components-button--docs') ok(names.some((n) => n.tag === 'H4' && n.got === 'Link to Fixture heading four'), `${tag} h4 fixture not enhanced`);
      // Heading names (VQA): the heading's accessible name is its text alone, not "<text> Link to <text>".
      for (const n of names) { const want = n.want.slice('Link to '.length); const c = await page.getByRole('heading', { name: want, exact: true }).count();
        const dbl = await page.getByRole('heading', { name: `${want} Link to ${want}`, exact: true }).count();
        ok(c >= 1 && dbl === 0, `${tag} heading ${n.tag} accessible name "${want}" (exact, found ${c}; doubled "${want} Link to ${want}" found ${dbl})`); }
      // Tab order: from the top of the page, the anchors come in document order.
      const order = await page.evaluate(() => [...document.querySelectorAll('.sbdocs-content a[data-eb-anchor]')].map((a) => a.getAttribute('aria-label')));
      await page.evaluate(() => { document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0); }); const got = [];
      for (let i = 0; i < 400 && got.length < order.length; i++) { await page.keyboard.press('Tab'); const f = await page.evaluate(() => { const a = document.activeElement; return a && a.hasAttribute('data-eb-anchor') ? a.getAttribute('aria-label') : (a === document.body ? 'BODY' : null); }); if (f === 'BODY') break; if (f) got.push(f); }
      ok(JSON.stringify(got) === JSON.stringify(order), `${tag} Tab order ${got.length}/${order.length} ${got.find((g, i) => g !== order[i]) || ''}`);
      // Focus: ring token, icon visible, stays visible after the pointer leaves.
      const ring = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--focus-ring-color').trim());
      const want = hex(ring);
      for (const a of (await page.$$('.sbdocs-content a[data-eb-anchor]')).slice(0, 6)) {
        // Pointer over the heading first (hover reveal), then keyboard focus (a key press makes the next focus :focus-visible),
        // then the pointer leaves: the icon must stay visible while focused.
        await a.scrollIntoViewIfNeeded(); const box = await a.boundingBox(); await page.mouse.move(box.x - 20, box.y + box.height / 2);
        await page.keyboard.press('Shift'); await a.focus();
        await page.mouse.move(2, 2); await page.waitForTimeout(50);
        const f = await a.evaluate((el) => { const cs = getComputedStyle(el.querySelector('svg')); return { fv: el.matches(':focus-visible'), vis: getComputedStyle(el.querySelector('svg')).visibility, st: cs.outlineStyle, wd: parseFloat(cs.outlineWidth), col: cs.outlineColor, n: el.getAttribute('aria-label') }; });
        ok(f.fv && f.vis === 'visible' && f.st === 'solid' && f.wd >= 2 && f.col === want, `${tag} focus "${f.n}" focus-visible ${f.fv} icon ${f.vis} ring ${f.st} ${f.wd}px ${f.col} want ${want}`);
      }
      const first = await page.$('.sbdocs-content h2 > [data-eb-anchor-tail] > a[data-eb-anchor]');
      if (first) { const hid = await first.evaluate((el) => el.closest('h2').id); await first.scrollIntoViewIfNeeded(); await first.click(); await page.waitForTimeout(200); const hash = await page.evaluate(() => location.hash); ok(hash === '#' + hid, `${tag} click goes to #${hid}, got ${hash}`); }
      await page.close();
    }
    ok(seen.H1 > 0 && seen.H2 > 0 && seen.H3 > 0 && seen.H4 > 0, `K ${mode} ${w} named headings by level ${JSON.stringify(seen)}`);
    await ctx.close();
  }
  // L. touch (Creatives' condition 4): with (hover: none) there is no hover to reveal the icon, so it shows at rest in
  // --text-muted at 3:1 or more against the docs background; with a mouse it stays hidden at rest (hover unchanged).
  if (!NO_HAS) for (const mode of ['light', 'dark']) for (const [w, touch] of [[320, true], [375, true], [1280, false]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, ...(touch ? { hasTouch: true, isMobile: true } : {}) });
    for (const id of PAGES) {
      const page = await open(ctx, id, mode); const tag = `L ${mode} ${w} ${touch ? 'touch' : 'mouse'} ${id}`;
      await page.mouse.move(1, 1);
      const r = await page.evaluate(() => { const { parse, ratio, bgOf } = window.__dc; const muted = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim();
        return { hn: matchMedia('(hover: none)').matches, muted, icons: [...document.querySelectorAll('.sbdocs-content a[data-eb-anchor] > svg')].map((sv) => { const cs = getComputedStyle(sv); const c = parse(cs.color);
          return { n: sv.parentElement.getAttribute('aria-label'), vis: cs.visibility, col: cs.color, r: ratio(c, bgOf(sv)) }; }) }; });
      ok(r.hn === touch && r.icons.length > 0, `${tag} (hover: none) ${r.hn}, icons ${r.icons.length}`);
      for (const i of r.icons) {
        if (touch) { ok(i.vis === 'visible' && i.col === hex(r.muted) && i.r >= 3, `${tag} "${i.n}" icon ${i.vis} ${i.col} want ${hex(r.muted)} (--text-muted) contrast ${i.r.toFixed(2)}`); const k = `${mode} touch icon at rest`; minUi[k] = Math.min(minUi[k] ?? 99, i.r); }
        else ok(i.vis === 'hidden', `${tag} "${i.n}" icon ${i.vis} at rest (hover reveal unchanged)`);
      }
      await page.close();
    }
    await ctx.close();
  }
  // G. reduced motion.
  if (!NO_HAS) { const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, reducedMotion: 'reduce' });
    for (const id of PAGES) { const page = await open(ctx, id, 'dark'); const fa = await page.$('a[data-eb-anchor]'); if (fa) { await page.keyboard.press('Shift'); await fa.focus(); } const n = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length); ok(n === 0, `G reduce ${id}: ${n} running`); await page.close(); }
    await ctx.close(); }
  await browser.close();
  console.log('\nLowest text contrast by mode and kind:'); for (const [k, v] of Object.entries(minText).sort()) console.log(`  ${k}: ${v.toFixed(2)}`);
  console.log('Lowest UI contrast by mode and kind:'); for (const [k, v] of Object.entries(minUi).sort()) console.log(`  ${k}: ${v.toFixed(2)}`);
  console.log(`\ndocs-check ${base}${NO_HAS ? ' (--no-has)' : ''}: ${passes} pass, ${fails} fail`); process.exit(fails ? 1 : 0);
})();
