// WCAG 2.4.11 Focus Not Obscured (Minimum) check for the Toast viewport.
// Opens 3 sticky toasts in the Toast/Error story, puts a tall page of focusable controls behind them,
// then Tabs through every control at 320px and 1440px in light and dark. A focused control fails
// only if it is fully hidden: every sample point on it lands on a toast. Usage: node scripts/focus-obscured.mjs [baseUrl]
import { chromium } from 'playwright-core';

const base = (process.argv[2] ?? 'http://127.0.0.1:6007').replace(/\/$/, '');
const exe = process.env.CHROME_PATH ?? '/usr/bin/google-chrome';
const browser = await chromium.launch({ executablePath: exe });
let hidden = 0;
let partly = 0;
let checked = 0;
for (const width of [320, 1440]) {
  for (const theme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width, height: 800 } });
    await page.goto(`${base}/iframe.html?id=components-toast--error&viewMode=story&globals=theme:${theme}`, { waitUntil: 'load' });
    await page.waitForSelector('.em-toast');
    // The story shows one error toast on mount; its trigger adds two more. Errors are sticky.
    await page.getByRole('button', { name: /show error toast/i }).click();
    await page.getByRole('button', { name: /show error toast/i }).click();
    await page.waitForFunction(() => document.querySelectorAll('.em-toast').length === 3);
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
      if (r.covered > 0 && r.covered + r.off === r.n) { hidden++; console.log(`HIDDEN ${width}px ${theme}: ${r.name}`); }
      else if (r.covered > 0) partly++;
    }
    console.log(`${width}px ${theme}: ${seen.size}/${total} controls focused, toasts open: 3`);
    await page.close();
  }
}
await browser.close();
console.log(`checked ${checked}, fully hidden ${hidden}, partly covered ${partly}`);
process.exit(hidden ? 1 : 0);
