// FU-BED-2: WCAG 2.5.8 target-size gate. Renders every Storybook story at 320 and 1280px in every registered
// theme in light and dark, and measures each interactive element's EFFECTIVE hit area: the region where a pointer
// press actually lands on that control (document.elementFromPoint hits the element, a descendant, or its <label>).
// So a B-1 ::before hit area counts, and a target covered by another element does not. Fails when any target's
// hit area is under var(--target-min) (44px) in width or height.
// Usage: node scripts/target-size.mjs [baseUrl]                       (default http://127.0.0.1:6007, a served storybook-static)
//        node scripts/target-size.mjs [baseUrl] --negative-control    (shrinks one button's target; exits 0 only if the gate catches it)
//        node scripts/target-size.mjs --calibrate                     (measures synthetic boxes of known size; no Storybook needed)
// Known under-sizes live in scripts/target-size.known.json (story + target + cause). They print as SKIP with their reason
// instead of failing (repo test rule: skip with a reason, never delete), and a known entry that no longer fails prints
// a STALE line so it gets removed once the component is fixed. Any target not on that list fails the gate.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { measure } from './lib/measure.mjs';

const REGISTRY = JSON.parse(fs.readFileSync(new URL('../src/themes/registry.json', import.meta.url), 'utf8'));
const COMBOS = REGISTRY.flatMap(({ id }) => ['light', 'dark'].map((m) => [id, m]));
const args = process.argv.slice(2);
const control = args.includes('--negative-control');
const calibrate = args.includes('--calibrate');
const base = (args.find((a) => !a.startsWith('--')) ?? 'http://127.0.0.1:6007').replace(/\/$/, '');
const exe = process.env.CHROME_PATH ?? '/usr/bin/google-chrome';
const widths = process.env.WIDTHS ? process.env.WIDTHS.split(',').map(Number) : [320, 1280];

// Negative control: one story, with the button's visible box and its B-1 ::before hit area both shrunk to 24px.
const CONTROL_STORY = 'components-button--primary';
const CONTROL_CSS = '.em-btn{min-height:24px!important;height:24px!important}.em-btn::before{display:none!important}';

if (calibrate) await runCalibration();
const KNOWN = JSON.parse(fs.readFileSync(new URL('./target-size.known.json', import.meta.url), 'utf8'));
const knownKey = (story, target) => `${story}\u0000${target}`;
const known = new Map(KNOWN.targets.map((k) => [knownKey(k.story, k.target), k]));
const seenKnown = new Set();
const Q_PIN = 0.25; // pinned sizes are 1/4px-grid measurements

// A fixture-theme exemption only holds while that theme never ships: fail if its id appears in the
// theme registry or anywhere in the built package (dist/, which `npm run build` writes before this runs).
{
  const root = new URL('../', import.meta.url);
  const distDir = new URL('dist/', root);
  if (!fs.existsSync(distDir)) { console.log('target-size: dist/ not found; run npm run build first (needed for the fixture-theme check)'); process.exit(2); }
  const files = [new URL('src/themes/registry.json', root), ...fs.readdirSync(distDir, { recursive: true }).map((f) => new URL(f, distDir)).filter((u) => fs.statSync(u).isFile())];
  const leaks = [];
  for (const id of KNOWN.fixtureThemes ?? []) {
    if (REGISTRY.some((t) => t.id === id)) leaks.push(`${id} is registered in src/themes/registry.json`);
    for (const u of files) if (fs.readFileSync(u, 'utf8').includes(id)) leaks.push(`${id} appears in ${u.pathname.slice(root.pathname.length)}`);
  }
  if (leaks.length) { for (const l of leaks) console.log(`FAIL fixture theme shipped: ${l}`); console.log('target-size: an exempt fixture theme must never ship'); process.exit(1); }
  console.log(`target-size: fixture themes not shipped (${(KNOWN.fixtureThemes ?? []).join(', ') || 'none'}; ${files.length} files checked)`);
}

const index = await (await fetch(`${base}/index.json`)).json();
let stories = Object.values(index.entries).filter((e) => e.type === 'story');
if (control) stories = stories.filter((s) => s.id === CONTROL_STORY);
if (!stories.length) { console.log('target-size: no stories found'); process.exit(2); }

// --calibrate: synthetic <button>s of known size at fractional offsets, alone and with neighbours painted over
// all four edges, must measure to within 0.01px of their real size. Proves the edge correction above.
async function runCalibration() {
  const b = await chromium.launch({ executablePath: exe });
  const page = await b.newPage({ viewport: { width: 320, height: 800 } });
  await page.setContent('<!doctype html><body style="margin:0"></body>');
  const cases = [];
  for (const size of [40, 43, 43.5, 43.75, 44]) for (const off of [10, 10.3, 10.5, 10.75]) for (const nb of [false, true]) cases.push({ size, off, nb });
  let bad = 0;
  for (const c of cases) {
    const row = await page.evaluate(([c, src]) => {
      document.body.innerHTML = '';
      const box = (tag, l, t, w, h, z) => { const e = document.createElement(tag); e.style.cssText = `position:absolute;left:${l}px;top:${t}px;width:${w}px;height:${h}px;margin:0;padding:0;border:0;z-index:${z}`; document.body.append(e); return e; };
      const btn = box('button', c.off + 40, c.off + 60, c.size, c.size, 1);
      btn.setAttribute('aria-label', 'cal');
      if (c.nb) for (const [l, t] of [[c.off + 40 + c.size, c.off + 60], [c.off + 10, c.off + 60], [c.off + 40, c.off + 60 + c.size], [c.off + 40, c.off + 30]]) box('div', l, t, 30, 30, 2);
      return (0, eval)(`(${src})`)({ all: true }).out[0];
    }, [c, measure.toString()]);
    const ok = Math.abs(row.w - c.size) <= 0.01 && Math.abs(row.h - c.size) <= 0.01;
    if (!ok) bad++;
    console.log(`${ok ? 'ok  ' : 'BAD '} ${c.size}px box at +${c.off}px${c.nb ? ' with neighbours on top' : ''}: measured ${row.w}x${row.h}`);
  }
  await b.close();
  console.log(`target-size calibration: ${cases.length - bad}/${cases.length} exact`);
  process.exit(bad ? 1 : 0);
}

const browser = await chromium.launch({ executablePath: exe });
let failing = 0, runs = 0, targets = 0, skipped = 0;
for (const width of widths) {
  const ctx = await browser.newContext({ viewport: { width, height: 800 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  for (const [th, md] of COMBOS) {
    for (const s of stories) {
      runs++;
      await page.goto(`${base}/iframe.html?id=${s.id}&viewMode=story&globals=theme:${th};mode:${md}`, { waitUntil: 'load' });
      await page.waitForSelector('#storybook-root > *', { timeout: 15000 });
      if (control) await page.addStyleTag({ content: CONTROL_CSS });
      await page.waitForTimeout(300);
      const { out, checked } = await page.evaluate(measure);
      targets += checked;
      const fails = [], skips = [];
      for (const o of out) {
        const k = !control && !o.covered && known.get(knownKey(s.id, o.name));
        // A known under-size is only skipped at or above its pinned size; if it shrinks further it fails.
        if (k) seenKnown.add(knownKey(s.id, o.name));
        if (k && (o.w < k.w - Q_PIN || o.h < k.h - Q_PIN)) fails.push(`${o.name} hit area ${o.w}x${o.h} < known ${k.w}x${k.h} (${k.cause}, got worse)`);
        else if (k) { skips.push(`${o.name} ${o.w}x${o.h} (${k.cause}, ${k.card}, ${k.owner}: ${KNOWN.causes[k.cause]})`); }
        else fails.push(o.covered ? `${o.name} covered at its centre` : `${o.name} hit area ${o.w}x${o.h} < ${o.min}`);
      }
      if (skips.length) { skipped += skips.length; console.log(`SKIP ${width} ${th}~${md} ${s.id}: ${skips.join('; ')}`); }
      if (fails.length) { failing++; console.log(`FAIL ${width} ${th}~${md} ${s.id}: ${fails.join('; ')}`); }
    }
  }
  await ctx.close();
}
await browser.close();
const summary = `target-size: ${runs} runs (${stories.length} stories x ${widths.join('/')}px x ${COMBOS.length} theme/mode combos), ${targets} targets measured, ${failing} runs failing`;
if (control) {
  // The control must fail on every run; otherwise the gate can't see a shrunk target.
  const ok = failing === runs;
  console.log(`${summary}\nnegative control (${CONTROL_STORY} shrunk to 24px): ${ok ? 'caught, OK' : 'NOT caught, the gate is broken'}`);
  process.exit(ok ? 0 : 1);
}
const stale = KNOWN.targets.filter((k) => !seenKnown.has(knownKey(k.story, k.target)));
for (const k of stale) console.log(`STALE ${k.story}: ${k.target} no longer fails, remove it from scripts/target-size.known.json (${k.card}, ${k.owner})`);
console.log(`${summary}, ${skipped} known under-sizes skipped, ${stale.length} stale known entries`);
process.exit(failing ? 1 : 0);
