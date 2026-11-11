// FU-EMBER-TOAST-MODAL e2e: toasts under a modal <dialog> (WCAG 4.1.3, 2.1.1, 2.2.1, 2.4.11).
// On the Toast "In a modal" story, at 320, 375 and 1280px in every registered theme in light and dark, with motion
// no-preference and reduce:
//  1. a toast fired with the modal open is in the accessibility tree inside the dialog's role=status outlet (announced),
//     visible (on screen, nothing paints over its centre), and dismissable by keyboard (Tab to Dismiss, Enter; focus stays in the dialog);
//  2. nested modals: a toast from the nested dialog renders in the nested dialog only; Esc closes only the nested one, and the
//     toast moves to the outer dialog;
//  3. closing the modal while a toast shows returns it to the page toaster, where it is in the accessibility tree and visible;
//  4. axe (serious/critical) is 0 with the dialog and a toast open, and no animation runs under reduced motion.
// Once per width (first theme, light): a toast doesn't auto-dismiss while the page toaster is unreachable (inert), then does.
// Usage: node scripts/toast-modal.mjs [baseUrl]   (default http://127.0.0.1:6007, a served storybook-static)
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const REGISTRY = JSON.parse(fs.readFileSync(new URL('../src/themes/registry.json', import.meta.url), 'utf8'));
const COMBOS = REGISTRY.flatMap(({ id }) => ['light', 'dark'].map((m) => [id, m]));
const require = createRequire(import.meta.url);
const axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const base = (process.argv[2] ?? 'http://127.0.0.1:6007').replace(/\/$/, '');
const exe = process.env.CHROME_PATH ?? '/usr/bin/google-chrome';
const STORY = 'components-toast--in-a-modal';
const browser = await chromium.launch({ executablePath: exe });
let fails = 0;
let checks = 0;
const check = (ok, label) => { checks++; if (!ok) { fails++; console.log(`  FAIL ${label}`); } };

// The toast's live region (role=status or role=alert) inside `scope` lists the text in the accessibility tree.
const announced = async (scope, role, text) => {
  const regions = scope.getByRole(role, { includeHidden: false });
  const n = await regions.count();
  for (let i = 0; i < n; i++) if ((await regions.nth(i).ariaSnapshot().catch(() => '')).includes(text)) return true;
  return false;
};
// On screen, and the element at its centre is the toast itself (not a backdrop or the dialog painting over it).
const visible = (page, loc) => loc.evaluate((el) => {
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height || r.bottom > innerHeight + 1 || r.right > innerWidth + 1 || r.top < -1 || r.left < -1) return false;
  const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return Boolean(hit && el.contains(hit));
});
const axe0 = async (page) => {
  await page.addScriptTag({ content: axeSrc });
  return page.evaluate(async () => {
    const r = await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] });
    return r.violations.filter((x) => x.impact === 'serious' || x.impact === 'critical').map((x) => `${x.id} ${x.nodes[0]?.target}`);
  });
};
const running = (page) => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);

for (const width of [320, 375, 1280]) {
  for (const [theme, mode] of COMBOS) {
    for (const motion of ['no-preference', 'reduce']) {
      const tag = `${width}px ${theme}~${mode} motion:${motion}`;
      const ctx = await browser.newContext({ viewport: { width, height: 700 }, reducedMotion: motion });
      const page = await ctx.newPage();
      await page.goto(`${base}/iframe.html?id=${STORY}&viewMode=story&globals=theme:${theme};mode:${mode}`, { waitUntil: 'load' });
      await page.getByRole('button', { name: 'Open dialog' }).click();
      const dlg = page.getByRole('dialog', { name: 'Edit role' });
      await dlg.waitFor();
      await page.waitForTimeout(250);
      // 1. Toast fired with the modal open.
      await dlg.getByRole('button', { name: 'Show toast', exact: true }).click();
      const toast = dlg.locator('.em-toast').filter({ hasText: 'Draft saved' });
      await toast.waitFor({ timeout: 3000 }).catch(() => {});
      check(await toast.count() === 1, `${tag}: toast renders inside the dialog`);
      check(await page.locator('.em-toast-viewport:not(.em-toast-viewport--modal) .em-toast').count() === 0, `${tag}: page toaster is empty`);
      check(await announced(dlg, 'status', 'Draft saved'), `${tag}: toast is in the dialog's role=status region (accessibility tree)`);
      await page.waitForTimeout(400);
      check(await toast.count() === 1 && await visible(page, toast), `${tag}: toast is visible`);
      const bad = await axe0(page);
      check(bad.length === 0, `${tag}: axe 0 serious/critical with dialog and toast open ${bad.join(', ')}`);
      if (motion === 'reduce') check(await running(page) === 0, `${tag}: no running animations under reduced motion`);
      // Keyboard: Tab from the last dialog control reaches the toast's Dismiss; Enter dismisses; focus stays in the dialog.
      const dismiss = dlg.getByRole('button', { name: 'Dismiss: Draft saved' });
      let reached = false;
      await dlg.getByRole('button', { name: 'Done' }).focus();
      for (let i = 0; i < 6 && !reached; i++) {
        await page.keyboard.press('Tab');
        reached = await dismiss.evaluate((el) => el === document.activeElement).catch(() => false);
      }
      check(reached, `${tag}: Tab reaches "Dismiss: Draft saved"`);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(150);
      check(await toast.count() === 0, `${tag}: Enter dismisses the toast`);
      check(await page.evaluate(() => Boolean(document.activeElement?.closest('dialog[open]'))), `${tag}: focus stays in the dialog after dismiss`);
      // 2. Nested modals: the topmost wins.
      await dlg.getByRole('button', { name: 'Open nested dialog' }).click();
      const nested = page.getByRole('dialog', { name: 'Confirm' });
      await nested.waitFor();
      await page.waitForTimeout(250);
      await nested.getByRole('button', { name: 'Show toast from nested' }).click();
      const copied = nested.locator('.em-toast').filter({ hasText: 'Copied' });
      await copied.waitFor({ timeout: 3000 }).catch(() => {});
      check(await copied.count() === 1, `${tag}: nested toast renders in the nested dialog`);
      check(await page.locator('.em-toast').filter({ hasText: 'Copied' }).count() === 1, `${tag}: nested toast renders only once`);
      check(await announced(nested, 'status', 'Copied'), `${tag}: nested toast is announced in the nested dialog`);
      await page.waitForTimeout(400);
      check(await copied.count() === 1 && await visible(page, copied), `${tag}: nested toast is visible`);
      await nested.getByRole('button', { name: 'Show toast from nested' }).focus();
      await page.keyboard.press('Escape');
      await page.waitForTimeout(250);
      check(await page.locator('dialog[open]').count() === 1 && await dlg.isVisible(), `${tag}: Esc closes only the nested dialog`);
      const moved = dlg.locator('.em-toast').filter({ hasText: 'Copied' });
      await moved.waitFor({ timeout: 3000 }).catch(() => {});
      check(await moved.count() === 1, `${tag}: showing toast moves to the outer dialog`);
      check(await announced(dlg, 'status', 'Copied'), `${tag}: moved toast is in the outer dialog's role=status region`);
      // 3. Closing the modal returns a showing toast to the page toaster.
      await dlg.getByRole('button', { name: 'Show error toast' }).click();
      await page.waitForTimeout(250);
      await dlg.getByRole('button', { name: 'Done' }).click();
      await page.waitForTimeout(250);
      const back = page.locator('.em-toast-viewport:not(.em-toast-viewport--modal) .em-toast').filter({ hasText: 'Could not save' });
      check(await page.locator('dialog[open]').count() === 0, `${tag}: dialog closed`);
      check(await back.count() === 1, `${tag}: toast returns to the page toaster`);
      check(await announced(page.locator('body'), 'alert', 'Could not save'), `${tag}: returned toast is in the accessibility tree`);
      await page.waitForTimeout(400);
      check(await back.count() === 1 && await visible(page, back), `${tag}: returned toast is visible`);
      await ctx.close();
    }
  }
  // No auto-dismiss while unreachable (once per width).
  const [theme, mode] = COMBOS[0];
  const page = await browser.newPage({ viewport: { width, height: 700 } });
  await page.goto(`${base}/iframe.html?id=${STORY}&viewMode=story&globals=theme:${theme};mode:${mode}`, { waitUntil: 'load' });
  await page.getByRole('button', { name: 'Show page toast' }).click();
  await page.evaluate(() => document.querySelector('#storybook-root').setAttribute('inert', ''));
  await page.waitForTimeout(6500);
  const t = page.locator('.em-toast').filter({ hasText: 'Role saved' });
  check(await t.count() === 1, `${width}px: no auto-dismiss while the toaster is inert (6.5s > 5s)`);
  await page.evaluate(() => document.querySelector('#storybook-root').removeAttribute('inert'));
  await page.waitForTimeout(6000);
  check(await t.count() === 0, `${width}px: auto-dismiss resumes once reachable`);
  await page.close();
}
await browser.close();
console.log(`${checks} checks, ${fails} failed`);
process.exit(fails ? 1 : 0);
