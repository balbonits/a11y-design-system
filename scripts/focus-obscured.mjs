// WCAG 2.4.11 Focus Not Obscured (Minimum) check for the Toast viewport.
// Opens 3 sticky toasts in the Toast/Error story, puts a tall page of focusable controls behind them,
// then Tabs through every control at 320/375/768/1440px in every registered theme in light and dark, with the
// narrow-width stack collapsed (default) and expanded. A focused control fails only if it is fully hidden:
// every sample point on it lands on a toast. Expanded runs emulate reduced motion and fail on any running animation. Repro by QA (PR #15); widened for FU-FSD-TOAST.
// Usage: node scripts/focus-obscured.mjs [baseUrl]
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const REGISTRY = JSON.parse(fs.readFileSync(new URL('../src/themes/registry.json', import.meta.url), 'utf8'));
const COMBOS = REGISTRY.flatMap(({ id }) => ['light', 'dark'].map((m) => [id, m]));

const base = (process.argv[2] ?? 'http://127.0.0.1:6007').replace(/\/$/, '');
const exe = process.env.CHROME_PATH ?? '/usr/bin/google-chrome';
const browser = await chromium.launch({ executablePath: exe });
let hidden = 0;
let partly = 0;
let checked = 0;
for (const width of [320, 375, 768, 1440]) {
  for (const [theme, mode] of COMBOS) {
  for (const expand of width <= 480 ? [false, true] : [false]) {
    const page = await browser.newPage({ viewport: { width, height: 800 }, reducedMotion: expand ? 'reduce' : 'no-preference' });
    await page.goto(`${base}/iframe.html?id=components-toast--error&viewMode=story&globals=theme:${theme};mode:${mode}`, { waitUntil: 'load' });
    await page.waitForSelector('.em-toast');
    // The story shows one error toast on mount; its trigger adds two more. Errors are sticky.
    await page.getByRole('button', { name: /show error toast/i }).click();
    await page.getByRole('button', { name: /show error toast/i }).click();
    await page.waitForFunction(() => document.querySelectorAll('.em-toast').length === 3);
    if (expand) {
      await page.getByRole('button', { name: /more$/ }).click();
      // Reduced motion (the expanded runs emulate it): expanding the stack starts no animation.
      const anims = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);
      if (anims) { hidden++; console.log(`  FAIL ${width}px ${theme} ${mode}: ${anims} animation(s) running under reduced motion`); }
    }
    // Page content behind the toasts: 60 buttons and inputs, tall enough to scroll.
    await page.evaluate(() => {
      const main = document.createElement('main');
      for (let i = 0; i < 30; i++) {
        const b = document.createElement('button');
        b.textContent = `Behind button ${i + 1}`;
        b.style.cssText = 'display:block;width:100%;min-height:44px;margin:8px 0';
        const inp = document.createElement('input');
        inp.setAttribute('aria-label', `Behind input ${i + 1}`);
        inp.style.cssText = 'display:block;width:100%;min-height:44px;margin:8px 0';
        main.append(b, inp);
      }
      document.querySelector('#storybook-root').append(main);
      document.activeElement?.blur();
    });
    const total = await page.evaluate(() => document.querySelectorAll('#storybook-root main button, #storybook-root main input').length);
    const seen = new Set();
    for (let i = 0; i < 200 && seen.size < total; i++) {
      await page.keyboard.press('Tab');
      const r = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || !el.closest('#storybook-root main')) return null;
        const rc = el.getBoundingClientRect();
        let covered = 0, off = 0, n = 0;
        for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) {
          const px = rc.left + ((x + 0.5) / 5) * rc.width;
          const py = rc.top + ((y + 0.5) / 5) * rc.height;
          n++;
          const hit = document.elementFromPoint(px, py);
          // Points off screen count as not visible; points on screen count only if a toast is on top.
          if (px < 0 || py < 0 || px > innerWidth || py > innerHeight) off++;
          else if (hit?.closest('.em-toast')) covered++;
        }
        return { name: el.textContent || el.getAttribute('aria-label'), covered, off, n };
      });
      if (!r) continue;
      if (seen.has(r.name)) continue;
      seen.add(r.name);
      checked++;
      if (r.covered > 0 && r.covered + r.off === r.n) { hidden++; console.log(`HIDDEN ${width}px ${theme} ${mode}${expand ? ' expanded' : ''}: ${r.name}`); }
      else if (r.covered > 0) partly++;
    }
    console.log(`${width}px ${theme} ${mode}${expand ? ' expanded' : ''}: ${seen.size}/${total} controls focused, toasts open: 3`);
    if (seen.size < total) { hidden++; console.log('  FAIL: not every control was reached'); }
    await page.close();
  }
  }
}
await browser.close();
console.log(`checked ${checked}, fully hidden ${hidden}, partly covered ${partly}`);
process.exit(hidden ? 1 : 0);
