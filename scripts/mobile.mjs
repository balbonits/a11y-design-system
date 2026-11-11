// Mobile-first sweep of every Storybook docs page: page-level overflow, --target-min (44px) hit areas and axe,
// at 320/375/414/640/768/920/1024/1280/1440px (640 is a 1280px window at 200% zoom) in every registered theme in light and dark. Usage: node scripts/mobile.mjs [baseUrl]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { createRequire } from 'node:module';
// Every registered theme (src/themes/registry.json) in light and dark. No theme names here.
const REGISTRY = JSON.parse(fs.readFileSync(new URL('../src/themes/registry.json', import.meta.url), 'utf8'));
const COMBOS = REGISTRY.flatMap(({ id }) => ['light', 'dark'].map((m) => `${id}~${m}`));

const require = createRequire(import.meta.url);
const axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const base = (process.argv[2] ?? 'http://127.0.0.1:6007').replace(/\/$/, '');
const exe = process.env.CHROME_PATH ?? '/usr/bin/google-chrome';
const index = await (await fetch(`${base}/index.json`)).json();
const docs = Object.values(index.entries).filter((e) => e.type === 'docs');
const widths = process.env.WIDTHS ? process.env.WIDTHS.split(',').map(Number) : [320, 375, 414, 640, 768, 920, 1024, 1280, 1440];

const browser = await chromium.launch({ executablePath: exe });
let failures = 0;
let runs = 0;
for (const width of widths) {
  const ctx = await browser.newContext({ viewport: { width, height: 800 }, bypassCSP: true });
  const page = await ctx.newPage();
  for (const theme of COMBOS) {
    const [th, md] = theme.split('~');
    for (const d of docs) {
      runs++;
      await page.goto(`${base}/iframe.html?id=${d.id}&viewMode=docs&globals=theme:${th};mode:${md}`, { waitUntil: 'load' });
      await page.waitForSelector('#storybook-docs > *', { timeout: 15000 });
      await page.waitForTimeout(1000);
      const r = await page.evaluate(() => {
        const de = document.documentElement;
        const overflow = Math.max(de.scrollWidth, document.body.scrollWidth) - window.innerWidth;
        const small = [];
        const sel = 'a[href], button, input, select, textarea, summary, [role="tab"], [role="button"]';
        for (const el of document.querySelectorAll(sel)) {
          const rc = el.getBoundingClientRect();
          if (!rc.width || !rc.height) continue;
          const cs = getComputedStyle(el);
          if (cs.visibility === 'hidden' || el.closest('[aria-hidden="true"], [hidden]')) continue;
          // WCAG 2.5.8 inline exception: links inside running text.
          if (el.tagName === 'A' && el.closest('p, li, td, th, span') && cs.display === 'inline') continue;
          let w = rc.width, h = rc.height;
          const b = getComputedStyle(el, '::before');
          if (b.content !== 'none' && b.position === 'absolute') {
            const n = (v) => (v === 'auto' ? 0 : Math.max(0, -parseFloat(v) || 0));
            h += n(b.top) + n(b.bottom);
            w = Math.max(w + n(b.left) + n(b.right), parseFloat(b.minWidth) || 0);
          }
          // A checkbox or radio whose label covers its row (label::before) is targeted by that row.
          if (el.labels?.length && getComputedStyle(el.labels[0], '::before').position === 'absolute') {
            const row = el.labels[0].offsetParent?.getBoundingClientRect();
            if (row) { w = Math.max(w, row.width); h = Math.max(h, row.height); }
          }
          const min = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--target-min')) || 44;
          if (Math.round(w) < min || Math.round(h) < min) {
            small.push(`${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : ''} "${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 24)}" ${Math.round(w)}x${Math.round(h)}`);
          }
        }
        return { overflow, small };
      });
      await page.addScriptTag({ content: axeSrc });
      const bad = await page.evaluate(async () => {
        const res = await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] });
        return res.violations.filter((x) => x.impact === 'serious' || x.impact === 'critical').map((x) => `${x.id}:${x.nodes.length} ${x.nodes[0]?.target}`);
      });
      const msgs = [];
      if (r.overflow > 0) msgs.push(`overflow ${r.overflow}px`);
      if (r.small.length) msgs.push(`small targets: ${[...new Set(r.small)].slice(0, 6).join('; ')}`);
      if (bad.length) msgs.push(`axe: ${bad.join('; ')}`);
      // WCAG 1.4.12: with the text-spacing override, the page still has no horizontal overflow.
      await page.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-bottom: 2em !important; }' });
      await page.waitForTimeout(100);
      const spaced = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth);
      if (spaced > 0) msgs.push(`overflow ${spaced}px with the 1.4.12 text-spacing override`);
      if (msgs.length) { failures++; console.log(`FAIL ${width} ${theme} ${d.id}: ${msgs.join(' | ')}`); }
    }
  }
  await ctx.close();
}
await browser.close();
console.log(`mobile: ${runs} runs, each with axe, --target-min and a 1.4.12 text-spacing overflow check (${docs.length} docs pages x ${widths.join('/')} x ${COMBOS.length} theme/mode combos), ${failures} failing`);
process.exit(failures ? 1 : 0);
