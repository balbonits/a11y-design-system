// Press-offset e2e (ARCH-REVIEW Addendum 8, video-player HANDOFF:57, 94, 98-117). For every registered theme, light
// and dark, at 320, 375 and 1280px, with and without prefers-reduced-motion: press each Button variant (primary,
// secondary, ghost, danger) with a real pointer and check it moves down by exactly the theme's --press-offset
// (0 under reduced motion), with no layout shift (its layout box doesn't change).
// Usage: node scripts/press-offset.mjs [baseUrl]   (default http://127.0.0.1:6007, a served storybook-static)
//        node scripts/press-offset.mjs [baseUrl] --negative-control   (pins every press to 0: the gate must fail)
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { parseTheme, registry } from './theme-contract.mjs';

const args = process.argv.slice(2);
const negative = args.includes('--negative-control');
const base = args.find((a) => !a.startsWith('--')) ?? 'http://127.0.0.1:6007';
const exe = process.env.CHROME_PATH ?? '/usr/bin/google-chrome';
const VARIANTS = ['primary', 'secondary', 'ghost', 'danger'];
const px = (v) => { const m = String(v ?? '').trim().match(/^(-?[\d.]+)px$/); return m ? Number(m[1]) : NaN; };

const browser = await chromium.launch({ executablePath: exe });
let runs = 0; let failing = 0;
for (const { id } of registry()) {
  const t = parseTheme(fs.readFileSync(new URL(`../src/themes/${id}.css`, import.meta.url), 'utf8'), id);
  for (const reduced of [false, true]) {
    const expected = reduced ? px(t.reduced['--press-offset'] ?? t.base['--press-offset']) : px(t.base['--press-offset']);
    for (const mode of ['light', 'dark']) for (const width of [320, 375, 1280]) {
      const ctx = await browser.newContext({ viewport: { width, height: 700 }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
      const page = await ctx.newPage();
      for (const v of VARIANTS) {
        runs++;
        const story = `components-button--${v}`;
        await page.goto(`${base}/iframe.html?id=${story}&viewMode=story&globals=theme:${id};mode:${mode}`, { waitUntil: 'load' });
        const btn = page.locator('#storybook-root .em-btn').first();
        await btn.waitFor({ timeout: 15000 });
        // Transitions off so the pressed transform is measured at its end value, not mid-animation.
        await page.addStyleTag({ content: `*,*::before,*::after{transition:none!important}${negative ? '.em-btn:active{transform:none!important}' : ''}` });
        const box = await btn.boundingBox();
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        const m = await btn.evaluate((el) => {
          const tf = getComputedStyle(el).transform; const mx = tf === 'none' ? new DOMMatrix() : new DOMMatrix(tf);
          return { ty: mx.f, tx: mx.e, w: el.offsetWidth, h: el.offsetHeight, active: el.matches(':active') };
        });
        await page.mouse.up();
        const ok = m.active && Math.abs(m.ty - expected) < 0.01 && Math.abs(m.tx) < 0.01 && Math.abs(m.w - box.width) < 1 && Math.abs(m.h - box.height) < 1;
        if (!ok) { failing++; console.log(`FAIL ${story} ${id}.${mode} ${width}px${reduced ? ' reduced' : ''}: pressed ty ${m.ty}px (expected ${expected}px), tx ${m.tx}px, active ${m.active}, box ${box.width}x${box.height} -> ${m.w}x${m.h}`); }
      }
      await ctx.close();
    }
  }
}
await browser.close();
console.log(`press-offset: ${runs} runs (${VARIANTS.length} variants x ${registry().length} themes x light/dark x 320/375/1280px x motion/reduced), ${failing} failing${negative ? ' (negative control)' : ''}`);
if (negative) { if (!failing) { console.log('FAIL negative control: pinning the press to 0 was not caught'); process.exit(1); } process.exit(0); }
process.exit(failing ? 1 : 0);
