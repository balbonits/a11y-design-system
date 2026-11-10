// Milestone screenshots of the built Storybook (served on :6007).
import { chromium } from 'playwright-core';
const base = process.env.SB_URL ?? 'http://127.0.0.1:6007';
const out = process.argv[2] ?? 'docs/screenshots';
const shots = [
  ['tokens--docs', 'docs', 'tokens'],
  ['components-button--docs', 'docs', 'button-docs'],
  ['components-tabs--docs', 'docs', 'tabs-docs'],
  ['components-table--docs', 'docs', 'table-docs'],
  ['components-modal--open', 'story', 'modal'],
];
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
for (const theme of ['light', 'dark']) {
  for (const [id, mode, name] of shots) {
    // Docs chrome is always light; only story canvases switch theme, so docs pages are shot once.
    if (theme === 'dark' && mode === 'docs') continue;
    await page.goto(`${base}/iframe.html?id=${id}&viewMode=${mode}&globals=theme:${theme}`, { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${out}/2026-11-10-${name}-${theme}.png`, fullPage: mode === 'docs' && name === 'tokens' });
  }
}
await browser.close();
