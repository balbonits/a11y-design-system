// Button hover e2e (ARCH-REVIEW Addendum 10, video-player HANDOFF:47, 57, 94-96, 210). Real pointer hover on every
// Button variant, every registered theme, light and dark, at 320, 375 and 1280px:
//  (d) themes that don't define the optional --hover-fill/--hover-label keep their hover bg and fg computed-identical
//      to the baseline captured before Addendum 10 (scripts/hover.baseline.json, from feat/switch 1b4b3a2);
//  - themes that define them fill with --hover-fill and label with --hover-label, with no lift and no tilt;
//  (e) disabled and aria-disabled buttons never change on hover;
//  (f) forced colors: the hovered button's colors are system colors, not the hover tokens (shot per theme that defines them).
// Usage: node scripts/hover.mjs [baseUrl] [--write-baseline] [--shots]   (default http://127.0.0.1:6007)
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { OPTIONAL_CONTRACT, parseTheme, registry, resolver } from './theme-contract.mjs';

const args = process.argv.slice(2);
const writeBaseline = args.includes('--write-baseline');
const shots = args.includes('--shots');
const base = args.find((a) => !a.startsWith('--')) ?? 'http://127.0.0.1:6007';
const exe = process.env.CHROME_PATH ?? '/usr/bin/google-chrome';
const BASELINE = new URL('./hover.baseline.json', import.meta.url);
const SHOTS = new URL('../docs/screenshots/hover/', import.meta.url);
const VARIANTS = ['primary', 'secondary', 'ghost', 'danger'];
const WIDTHS = [320, 375, 1280];
const baseline = writeBaseline ? {} : JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
if (shots) fs.mkdirSync(SHOTS, { recursive: true });

// Normalise a CSS color through the browser so token values and computed values compare as rgb().
const browser = await chromium.launch({ executablePath: exe });
let runs = 0; let failing = 0;
const fail = (msg) => { failing++; console.log(`FAIL ${msg}`); };
const read = (loc) => loc.evaluate((el) => {
  const cs = getComputedStyle(el); const tf = cs.transform === 'none' ? new DOMMatrix() : new DOMMatrix(cs.transform);
  return { bg: cs.backgroundColor, fg: cs.color, tx: tf.e, ty: tf.f, rot: Math.atan2(tf.b, tf.a) };
});

for (const { id } of registry()) {
  const t = parseTheme(fs.readFileSync(new URL(`../src/themes/${id}.css`, import.meta.url), 'utf8'), id);
  for (const mode of ['light', 'dark']) {
    const r = resolver(t, mode);
    const optional = OPTIONAL_CONTRACT.every((k) => r(k) !== undefined);
    for (const width of WIDTHS) {
      const ctx = await browser.newContext({ viewport: { width, height: 700 } });
      const page = await ctx.newPage();
      const toRgb = (c) => page.evaluate((c) => { const d = document.createElement('i'); d.style.color = c; document.body.append(d); const v = getComputedStyle(d).color; d.remove(); return v; }, c);
      for (const v of VARIANTS) {
        runs++;
        const key = `${id}.${mode}.${v}`; const where = `${key} ${width}px`;
        await page.goto(`${base}/iframe.html?id=components-button--${v}&viewMode=story&globals=theme:${id};mode:${mode}`, { waitUntil: 'load' });
        const btn = page.locator('#storybook-root .em-btn').first();
        await btn.waitFor({ timeout: 15000 });
        await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important}' });
        await btn.hover();
        const hov = await read(btn);
        if (writeBaseline) { if (width === 1280) baseline[key] = { bg: hov.bg, fg: hov.fg }; }
        else if (!optional) {
          const b = baseline[key];
          if (!b) fail(`${where}: no baseline entry`);
          else if (b.bg !== hov.bg || b.fg !== hov.fg) fail(`${where}: hover changed from baseline bg ${b.bg} fg ${b.fg} to bg ${hov.bg} fg ${hov.fg}`);
        } else {
          const [fill, label] = [await toRgb(r('--hover-fill')), await toRgb(r('--hover-label'))];
          if (hov.bg !== fill || hov.fg !== label) fail(`${where}: hover bg ${hov.bg} fg ${hov.fg}, expected --hover-fill ${fill} and --hover-label ${label}`);
          if (Math.abs(hov.ty) > 0.01 || Math.abs(hov.tx) > 0.01 || Math.abs(hov.rot) > 1e-6) fail(`${where}: hover moved (tx ${hov.tx}, ty ${hov.ty}, rot ${hov.rot})`);
          if (shots && (width === 320 || width === 1280)) {
            const bb = await btn.boundingBox();
            await page.screenshot({ path: new URL(`${id}-${mode}-${width}-hover-${v}.png`, SHOTS).pathname, clip: { x: Math.max(0, bb.x - 16), y: Math.max(0, bb.y - 16), width: bb.width + 32, height: bb.height + 32 } });
          }
        }
        // (e) disabled and aria-disabled never take a hover fill or label.
        if (!writeBaseline) for (const attr of ['disabled', 'aria-disabled']) {
          await page.mouse.move(0, 0);
          await btn.evaluate((el, a) => (a === 'disabled' ? (el.disabled = true) : el.setAttribute('aria-disabled', 'true')), attr);
          const dRest = await read(btn); await btn.hover({ force: true }); const dHov = await read(btn);
          if (dRest.bg !== dHov.bg || dRest.fg !== dHov.fg || dRest.ty !== dHov.ty) fail(`${where} ${attr}: hover changed bg ${dRest.bg} -> ${dHov.bg}, fg ${dRest.fg} -> ${dHov.fg}, ty ${dRest.ty} -> ${dHov.ty}`);
          await btn.evaluate((el, a) => (a === 'disabled' ? (el.disabled = false) : el.removeAttribute('aria-disabled')), attr);
        }
      }
      await ctx.close();
    }
    // (f) forced colors: system colors win and no hover token leaks.
    if (!writeBaseline && optional) {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 700 }, forcedColors: 'active' });
      const page = await ctx.newPage();
      for (const v of VARIANTS) {
        runs++;
        await page.goto(`${base}/iframe.html?id=components-button--${v}&viewMode=story&globals=theme:${id};mode:${mode}`, { waitUntil: 'load' });
        const btn = page.locator('#storybook-root .em-btn').first(); await btn.waitFor({ timeout: 15000 });
        await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important}' });
        await btn.hover(); const hov = await read(btn);
        const sys = await page.evaluate(() => { const o = {}; for (const c of ['ButtonFace', 'ButtonText', 'Canvas', 'CanvasText', 'Highlight', 'HighlightText', 'LinkText', 'GrayText']) { const d = document.createElement('i'); d.style.color = c; document.body.append(d); o[c] = getComputedStyle(d).color; d.remove(); } return o; });
        const sysSet = new Set([...Object.values(sys), 'rgba(0, 0, 0, 0)']);
        const toks = await page.evaluate(([f, l]) => [f, l].map((c) => { const d = document.createElement('i'); d.style.color = c; document.body.append(d); const x = getComputedStyle(d).color; d.remove(); return x; }), [r('--hover-fill'), r('--hover-label')]);
        if (!sysSet.has(hov.bg) || !sysSet.has(hov.fg)) fail(`${id}.${mode}.${v} forced-colors: hover bg ${hov.bg} fg ${hov.fg} is not a system color`);
        if ((hov.bg === toks[0] && !sysSet.has(toks[0])) || (hov.fg === toks[1] && !sysSet.has(toks[1]))) fail(`${id}.${mode}.${v} forced-colors: hover token leaked`);
        if (shots) await page.screenshot({ path: new URL(`${id}-${mode}-1280-forced-colors-hover-${v}.png`, SHOTS).pathname, clip: await btn.boundingBox().then((b) => ({ x: Math.max(0, b.x - 16), y: Math.max(0, b.y - 16), width: b.width + 32, height: b.height + 32 })) });
      }
      await ctx.close();
    }
  }
}
await browser.close();
if (writeBaseline) { fs.writeFileSync(BASELINE, JSON.stringify(baseline, null, 1) + '\n'); console.log(`hover baseline: ${Object.keys(baseline).length} entries written`); process.exit(0); }
console.log(`hover: ${runs} runs (${VARIANTS.length} variants x ${registry().length} themes x light/dark x ${WIDTHS.join('/')}px, plus forced colors for themes with --hover-fill), ${failing} failing`);
process.exit(failing ? 1 : 0);
