// Focus-visible e2e (WCAG 2.4.7). For every registered theme in light, dark and forced colors: open every story, press
// Tab through it, and at each focus stop compare a screenshot of the focused control (plus a margin for the ring) with
// the same control blurred. Identical pixels mean focus is invisible there. Where the indicator is an outline, its
// width must be at least 2px (the thickness the focus ring tokens promise).
// Stories named *--focus-visible are skipped: storybook-addon-pseudo-states forces their ring on, so blur can't remove it.
// Usage: node scripts/focus-visible.mjs [baseUrl]   (default http://127.0.0.1:6007, a served storybook-static)
//        node scripts/focus-visible.mjs [baseUrl] --negative-control   (strips every focus style; exits 0 only if the gate catches it)
import { chromium } from 'playwright-core';
import { registry } from './theme-contract.mjs';

const args = process.argv.slice(2);
const negative = args.includes('--negative-control');
const base = (args.find((a) => !a.startsWith('--')) ?? 'http://127.0.0.1:6007').replace(/\/$/, '');
const exe = process.env.CHROME_PATH ?? '/usr/bin/google-chrome';
const MAX_STOPS = 12;
const MARGIN = 8;

const index = await (await fetch(`${base}/index.json`)).json();
const stories = Object.values(index.entries)
  .filter((e) => e.type === 'story' && !/--focus-visible$|--all-themes|^tokens-/.test(e.id))
  .map((e) => e.id);

const browser = await chromium.launch({ executablePath: exe });
let stops = 0; const failures = [];
for (const { id: theme } of registry()) {
  for (const mode of ['light', 'dark', 'forced']) {
    const ctx = await browser.newContext({
      viewport: { width: 1024, height: 768 },
      forcedColors: mode === 'forced' ? 'active' : 'none',
      reducedMotion: 'reduce',
    });
    const page = await ctx.newPage();
    for (const story of stories) {
      await page.goto(`${base}/iframe.html?id=${story}&viewMode=story&globals=theme:${theme};mode:${mode === 'dark' ? 'dark' : 'light'}`, { waitUntil: 'load' });
      await page.waitForSelector('#storybook-root > *', { timeout: 15000 });
      await page.addStyleTag({ content: `*,*::before,*::after{transition:none!important;animation:none!important}${negative ? '*:focus,*:focus-visible,*:focus-visible+span{outline:none!important;box-shadow:none!important}' : ''}` });
      await page.mouse.move(0, 0);
      const seen = new Set();
      for (let i = 0; i < MAX_STOPS; i++) {
        await page.keyboard.press('Tab');
        const el = await page.evaluate(() => {
          const e = document.activeElement;
          if (!e || e === document.body) return null;
          const r = e.getBoundingClientRect();
          // A visually hidden input (opacity 0, e.g. ThemeSwitcher's radios) draws its ring on the next sibling.
          const ring = getComputedStyle(e).opacity === '0' && e.nextElementSibling ? e.nextElementSibling : e;
          const cs = getComputedStyle(ring);
          return { tag: e.outerHTML.slice(0, 80), x: r.x, y: r.y, w: r.width, h: r.height, outlineStyle: cs.outlineStyle, outlineWidth: parseFloat(cs.outlineWidth) || 0 };
        });
        if (!el || seen.has(el.tag)) break;
        seen.add(el.tag);
        if (el.w < 1 || el.h < 1) continue; // visually hidden inputs (e.g. radios) are measured through their label below
        stops++;
        const clip = { x: Math.max(0, el.x - MARGIN), y: Math.max(0, el.y - MARGIN), width: el.w + 2 * MARGIN, height: el.h + 2 * MARGIN };
        const focused = await page.screenshot({ clip });
        await page.evaluate(() => { window.__emFocus = document.activeElement; window.__emFocus.blur(); });
        const blurred = await page.screenshot({ clip });
        await page.evaluate(() => window.__emFocus.focus({ focusVisible: true }));
        const where = `${theme} ${mode} ${story} ${el.tag}`;
        if (focused.equals(blurred)) failures.push(`${where}: no visible change on focus`);
        else if (el.outlineStyle !== 'none' && el.outlineWidth > 0 && el.outlineWidth < 2) failures.push(`${where}: outline ${el.outlineWidth}px < 2px`);
      }
    }
    await ctx.close();
  }
}
await browser.close();
if (!negative) for (const f of failures) console.log(`FAIL ${f}`);
console.log(`focus-visible: ${stops} focus stops in ${stories.length} stories x ${registry().length} themes x light/dark/forced colors, ${failures.length} failing${negative ? ' (negative control)' : ''}`);
if (negative) {
  if (!failures.length) { console.log('FAIL negative control: stripping every focus style was not caught'); process.exit(1); }
  console.log('negative control: caught, OK');
  process.exit(0);
}
process.exit(failures.length ? 1 : 0);
