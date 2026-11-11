// R4-TESTS-FIRST: VideoPlayer gates written before the component (HANDOFF docs/components/video-player/HANDOFF.md,
// "Builder Hard DONE" H-9). Each test names the DONE line it proves. Runs against a served storybook-static and the
// Media/VideoPlayer stories (ids media-videoplayer--*), with playwright-core and axe-core only (no new deps).
//
// Switch: the tests stay 'fixme' (each prints SKIP with its reason, exit 0) until the component exists.
// To turn them on, change the next line to 'on' (FSD, in the player PR). With 'on', a missing story is a FAIL.
const VP_GATES = 'fixme';
//
// Usage: node scripts/vp-gates.mjs [baseUrl]            (default http://127.0.0.1:6007, a served storybook-static)
//        VP_GATES=on node scripts/vp-gates.mjs [baseUrl]  (run them now, without editing the switch)
//        node scripts/vp-gates.mjs --proto <url of docs/components/video-player/index.html>
//            Runs the same tests against the R-4 prototype (same data-act names), proving them before the component lands.
//            The prototype predates the caption tokens, so the token checks report n/a there.
// Env: WIDTHS=320,1440 to narrow the widths; GREP=<regex> to run tests whose name matches; ONLY=KB,AXE to run some groups (KB, OVERFLOW, TARGETS, SPACING, ZOOM, AXE, CONTRAST).
// Selectors are the ones FSD agreed for the component: root section[aria-label^="Video player: "], controls [data-act=...],
// slots [data-slot=...], the Seek slider, the Volume range, the "More options" / "Playback speed" groups, the caption
// settings <dialog>, the transcript section and its cue buttons. No test invents a selector HANDOFF or FSD didn't name.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { measure } from './lib/measure.mjs';

const require = createRequire(import.meta.url);
const axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const args = process.argv.slice(2);
const protoAt = args.indexOf('--proto');
const PROTO = protoAt >= 0 ? args[protoAt + 1] : null;
const base = (args.find((a, i) => !a.startsWith('--') && (protoAt < 0 || i !== protoAt + 1)) ?? 'http://127.0.0.1:6007').replace(/\/$/, '');
const mode = PROTO ? 'on' : (process.env.VP_GATES ?? VP_GATES);
const exe = process.env.CHROME_PATH ?? '/usr/bin/google-chrome';
const WIDTHS = process.env.WIDTHS ? process.env.WIDTHS.split(',').map(Number) : [320, 375, 768, 1024, 1440];
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
const REGISTRY = JSON.parse(fs.readFileSync(new URL('../src/themes/registry.json', import.meta.url), 'utf8'));
const THEMES = PROTO ? ['neo'] : REGISTRY.map((t) => t.id); // the prototype is neo only
const MODES = ['light', 'dark'];
const ROOT = 'section[aria-label^="Video player: "]';

// H-4 states as stories (FSD: one story per state, Storybook title Media/VideoPlayer).
// Story ids confirmed by FSD (Nov 10): one per H-4 state, plus Storybook's --docs page, which isn't a state.
const STORIES = ['default', 'poster', 'loading', 'stalled', 'playing', 'paused', 'error', 'ended', 'no-captions',
  'caption-settings', 'limited', 'audio-description-on', 'unavailable', 'provider-captions', 'transcript-search', 'transcript-empty'];
// Prototype gallery demo key for each story ('default' is the live player).
const PROTO_DEMO = { poster: 'poster', loading: 'loading', stalled: 'buffering', error: 'error', ended: 'ended',
  playing: 'playing', paused: 'paused', 'audio-description-on': 'adon', 'no-captions': 'nocc', limited: 'limited', unavailable: 'unavailable', 'provider-captions': 'provcc',
  'transcript-search': 'txsearch', 'transcript-empty': 'txempty', 'caption-settings': 'capset' };

// The test list, with the H-9 DONE line each one proves.
const DONE = {
  keys: 'H-9 "every H-6 row has an e2e" (HANDOFF H-6 key table)',
  overflow: 'H-9 "horizontal overflow 0 at 320/375/768/1024/1440, light and dark"',
  targets: 'H-9 "no target under 44px" (the #34 effective hit-area measure)',
  spacing: 'H-9 "WCAG 1.4.12 text spacing: 0 overflow and 0 clipped" (captions on, H-8)',
  zoom: 'H-9 "200% zoom: 0 overflow"',
  axe: 'H-9 "axe 0 violations at all impacts"',
  contrast: 'H-9 "contrast.mjs, with the caption pairs (--caption-text on --caption-bg, Solid and Translucent), is green"',
};
const tests = [];
const test = (id, done, fn) => tests.push({ id, done, fn });

let fails = 0, passes = 0, na = 0;
const log = (s) => console.log(s);

// ---------- page helpers ----------
const B = { browser: null }; // launched once the switch is on
async function open(story, { width = 1024, height = 800, theme = THEMES[0], md = 'light', scale = 1 } = {}) {
  const ctx = await B.browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, reducedMotion: 'reduce', colorScheme: md });
  const page = await ctx.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 120)));
  // Headless Chrome can't enter real full screen: record requestFullscreen calls instead (F key test).
  await page.addInitScript(() => {
    window.__fs = [];
    Element.prototype.requestFullscreen = function () { window.__fs.push(this); return Promise.resolve(); };
  });
  let root;
  if (PROTO) {
    await page.addInitScript((m) => { try { localStorage.clear(); localStorage.setItem('jdilig:mode', m); } catch { /* storage blocked */ } }, md);
    await page.goto(PROTO, { waitUntil: 'load' });
    await page.waitForSelector(`#gal ${ROOT}`, { timeout: 15000 });
    if (story === 'default') root = page.locator(`#live ${ROOT}`).first();
    else {
      const idx = await protoIndex(page, PROTO_DEMO[story]);
      root = page.locator(`#gal ${ROOT}`).nth(idx);
    }
  } else {
    await page.goto(`${base}/iframe.html?id=media-videoplayer--${story}&viewMode=story&globals=theme:${theme};mode:${md}`, { waitUntil: 'load' });
    await page.waitForSelector(ROOT, { timeout: 15000 });
    root = page.locator(ROOT).first();
  }
  await page.waitForTimeout(300);
  return { ctx, page, root, errors };
}
// Gallery order in the prototype source (the figure list), so a demo key maps to its player.
let protoOrder = null;
async function protoIndex(page, d) {
  if (!protoOrder) {
    const html = await (await fetch(PROTO)).text();
    protoOrder = [...html.slice(html.indexOf("[['poster',")).split('].forEach')[0].matchAll(/\['([a-z]+)','[^']*'\]/g)].map((m) => m[1]);
  }
  const i = protoOrder.indexOf(d);
  if (i < 0) throw new Error(`prototype has no demo ${d}`);
  return i;
}
// Observable state, all from public attributes (FSD-agreed): Seek aria-valuenow/max, Volume value, Mute aria-pressed,
// root data-cc / data-ad / data-state, the speed button's name, the status and search-count slots, the transcript.
const snap = (root) => root.evaluate((P) => {
  const q = (s) => P.querySelector(s);
  const vis = (e) => !!e && e.getClientRects().length > 0 && !e.closest('[hidden]');
  const sl = q('[role=slider][aria-label=Seek]'), vol = q('input[type=range][aria-label=Volume]');
  const tx = P.querySelector('section.em-vp-tx, section.tx') || document.getElementById(P.id + '-tx');
  const a = document.activeElement;
  return {
    now: sl ? Number(sl.getAttribute('aria-valuenow')) : null, max: sl ? Number(sl.getAttribute('aria-valuemax')) : null,
    vol: vis(vol) ? Number(vol.value) : null, muted: q('[data-act=mute]')?.getAttribute('aria-pressed'),
    cc: P.dataset.cc ?? null, ad: P.dataset.ad ?? null, state: P.dataset.state ?? null,
    speed: q('[data-act=speed]')?.getAttribute('aria-label') ?? null, status: q('[data-slot=status]')?.textContent.trim() ?? '',
    qs: (q('[data-slot=qs]') || tx?.querySelector('[data-slot=qs]'))?.textContent.trim() ?? '',
    hit: (() => { const h = tx?.querySelector('.em-vp-cue--hitcur, .cue.hitcur'); return h ? [...tx.querySelectorAll('.em-vp-cue, .cue')].indexOf(h) : -1; })(),
    inSearch: a?.matches?.('input[type=search]') ?? false,
    txShown: !!tx && vis(tx), ccShown: vis(q('[data-act=cc]')),
    groups: [...P.querySelectorAll('[role=group]')].filter(vis).map((g) => g.getAttribute('aria-label')),
    fs: (window.__fs || []).filter((e) => e === P).length,
    focus: a ? `${a.tagName.toLowerCase()}${a.dataset?.act ? '[data-act=' + a.dataset.act + ']' : ''}${a.classList?.contains('em-vp-cue') || a.classList?.contains('cue') ? '.cue' : ''}${a.getAttribute?.('aria-current') === 'true' ? '[aria-current]' : ''}` : '',
    focusInTx: !!tx && tx.contains(a),
  };
});
// The transcript belongs to the player: inside it (component) or linked by id (prototype: #{id}-tx).
async function txSearch(root) {
  const id = await root.getAttribute('id');
  const inside = root.locator('input[type=search]');
  return (await inside.count()) ? inside.first() : root.page().locator(`#${id}-tx input[type=search]`).first();
}
const act = (root, name) => root.locator(`[data-act=${name}]`).first();
async function focusIn(root, which) {
  if (which === 'seek') await root.locator('[role=slider][aria-label=Seek]').first().focus();
  else if (which === 'volume') await root.locator('input[type=range][aria-label=Volume]').first().focus();
  else await act(root, which).focus();
}
async function key(page, k, n = 1) { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await page.waitForTimeout(120); } }
async function ready(page, root) { // duration known and the media seekable before seek tests
  await page.waitForFunction((P) => Number(P.querySelector('[role=slider][aria-label=Seek]')?.getAttribute('aria-valuemax')) > 0, await root.elementHandle(), { timeout: 15000 });
}
const near = (a, b, tol = 1) => a !== null && Math.abs(a - b) <= tol;
function expect(cond, msg) { if (!cond) throw new Error(msg); }
async function waitState(page, root, states, ms = 8000) {
  await page.waitForFunction(([P, s]) => s.includes(P.dataset.state), [await root.elementHandle(), states], { timeout: ms })
    .catch(async () => { throw new Error(`state ${(await snap(root)).state}, expected ${states.join('/')}`); });
}

// ---------- H-6 keyboard: one test per key row ----------
const kt = (id, story, fn) => test(`KB ${id}`, DONE.keys, async () => {
  const o = await open(story);
  try { await fn(o); expect(!o.errors.length, `page errors: ${o.errors.join('; ')}`); } finally { await o.ctx.close(); }
});
kt('K plays and pauses (focus on a control in the bar)', 'default', async ({ page, root }) => {
  await focusIn(root, 'more'); await act(root, 'more').press('Escape').catch(() => {});
  await focusIn(root, 'mute'); await key(page, 'k'); await waitState(page, root, ['playing', 'loading', 'buffering']);
  await waitState(page, root, ['playing']); await key(page, 'k'); await waitState(page, root, ['paused']);
});
kt('K does nothing inside the More panel', 'default', async ({ page, root }) => {
  await act(root, 'more').click(); const s0 = await snap(root); expect(s0.groups.includes('More options'), 'More options did not open');
  await key(page, 'k'); const s1 = await snap(root); expect(s1.state === s0.state, `state changed ${s0.state} -> ${s1.state}`);
});
kt('Space plays on the Seek slider', 'default', async ({ page, root }) => {
  await focusIn(root, 'seek'); await key(page, 'Space'); await waitState(page, root, ['playing']);
});
kt('Space on a bar button only activates that button, never play', 'default', async ({ page, root }) => {
  const s0 = await snap(root); await focusIn(root, 'mute'); await key(page, 'Space'); const s1 = await snap(root);
  expect(s1.state === s0.state, `Space on Mute changed state ${s0.state} -> ${s1.state}`); expect(s1.muted !== s0.muted, 'Space did not press Mute');
});
kt('Left/Right seek 5 s', 'default', async ({ page, root }) => {
  await ready(page, root); await focusIn(root, 'mute'); await key(page, 'ArrowRight', 3); let s = await snap(root);
  expect(near(s.now, 15), `after 3x Right at ${s.now}, expected 15`); await key(page, 'ArrowLeft'); s = await snap(root); expect(near(s.now, 10), `after Left at ${s.now}, expected 10`);
});
kt('Left/Right on Volume change the volume, not the position', 'default', async ({ page, root }) => {
  await ready(page, root); const s0 = await snap(root); await focusIn(root, 'volume'); await key(page, 'ArrowLeft'); const s1 = await snap(root);
  expect(s1.vol < s0.vol, `volume ${s0.vol} -> ${s1.vol}`); expect(s1.now === s0.now, `position moved ${s0.now} -> ${s1.now}`);
});
kt('J/L seek 10 s', 'default', async ({ page, root }) => {
  await ready(page, root); await focusIn(root, 'mute'); await key(page, 'l', 2); let s = await snap(root);
  expect(near(s.now, 20), `after 2x L at ${s.now}, expected 20`); await key(page, 'j'); s = await snap(root); expect(near(s.now, 10), `after J at ${s.now}, expected 10`);
});
kt('Up/Down change volume by 10% (not on the slider)', 'default', async ({ page, root }) => {
  const s0 = await snap(root); await focusIn(root, 'mute'); await key(page, 'ArrowDown'); let s = await snap(root);
  expect(near(s.vol, s0.vol - 10, 0.5), `Down: volume ${s0.vol} -> ${s.vol}`); expect(s.now === s0.now, 'Down moved the position');
  await key(page, 'ArrowUp'); s = await snap(root); expect(near(s.vol, s0.vol, 0.5), `Up: volume back to ${s.vol}, expected ${s0.vol}`);
});
kt('Up/Down on the Seek slider seek instead', 'default', async ({ page, root }) => {
  await ready(page, root); const s0 = await snap(root); await focusIn(root, 'seek'); await key(page, 'ArrowUp'); const s = await snap(root);
  expect(s.now > s0.now, `Up on Seek: position ${s0.now} -> ${s.now}`); expect(s.vol === s0.vol, 'Up on Seek changed the volume');
});
kt('Up/Down do nothing with no volume (limited)', 'limited', async ({ page, root }) => {
  const s0 = await snap(root); await focusIn(root, 'more'); await act(root, 'more').evaluate((b) => b.blur());
  await root.locator('[data-act=play], [data-act=toggle]').first().focus(); await key(page, 'ArrowUp'); await key(page, 'ArrowDown');
  const s = await snap(root); expect(s.vol === null && s0.vol === null, 'limited story shows a Volume slider'); expect(s.now === s0.now, `position moved ${s0.now} -> ${s.now}`);
});
kt('PgUp/PgDn seek 10% on the Seek slider only', 'default', async ({ page, root }) => {
  await ready(page, root); await focusIn(root, 'seek'); const s0 = await snap(root); await key(page, 'PageUp'); let s = await snap(root);
  expect(near(s.now, s0.now + s0.max * 0.1), `PgUp: ${s0.now} -> ${s.now}, expected +${(s0.max * 0.1).toFixed(1)}`);
  await key(page, 'PageDown'); s = await snap(root); expect(near(s.now, s0.now), `PgDn: back to ${s.now}`);
  await focusIn(root, 'mute'); const s1 = await snap(root); await key(page, 'PageUp'); s = await snap(root); expect(s.now === s1.now, `PgUp off the slider moved ${s1.now} -> ${s.now}`);
});
kt('Home/End go to the start and the end', 'default', async ({ page, root }) => {
  await ready(page, root); await focusIn(root, 'mute'); await key(page, 'End'); let s = await snap(root);
  expect(near(s.now, s.max), `End at ${s.now}, expected ${s.max}`); await key(page, 'Home'); s = await snap(root); expect(s.now === 0, `Home at ${s.now}`);
});
kt('M mutes and unmutes, Shift+M is ignored', 'default', async ({ page, root }) => {
  await focusIn(root, 'more'); await act(root, 'more').evaluate((b) => b.blur()); await focusIn(root, 'speed').catch(() => focusIn(root, 'cc'));
  const s0 = await snap(root); await key(page, 'm'); let s = await snap(root); expect(s.muted === 'true' && s0.muted === 'false', `M: aria-pressed ${s0.muted} -> ${s.muted}`);
  await key(page, 'Shift+M'); s = await snap(root); expect(s.muted === 'true', 'Shift+M toggled mute'); await key(page, 'm'); s = await snap(root); expect(s.muted === 'false', 'second M did not unmute');
});
kt('C toggles captions', 'default', async ({ page, root }) => {
  await focusIn(root, 'mute'); const s0 = await snap(root); await key(page, 'c'); let s = await snap(root);
  expect(s.cc !== s0.cc, `C: data-cc stayed ${s0.cc}`); await key(page, 'c'); s = await snap(root); expect(s.cc === s0.cc, 'second C did not restore');
});
kt('C does nothing with no caption track', 'no-captions', async ({ page, root }) => {
  await focusIn(root, 'mute'); const s0 = await snap(root); await key(page, 'c'); const s = await snap(root);
  expect(s.cc === s0.cc || s.cc === 'off' || s.cc === null, `C changed data-cc ${s0.cc} -> ${s.cc}`);
  expect(!(await root.locator('[data-slot=cap]').first().evaluate((e) => (e.textContent || '').trim().length > 0 && e.getClientRects().length > 0).catch(() => false)), 'a caption is showing');
});
kt('C does nothing with providerCaptions (no Captions button)', 'provider-captions', async ({ page, root }) => {
  const s0 = await snap(root); expect(!s0.ccShown, 'Captions button is shown with providerCaptions');
  await focusIn(root, 'mute'); await key(page, 'c'); const s = await snap(root); expect(s.cc === s0.cc, `C changed data-cc ${s0.cc} -> ${s.cc}`);
});
kt('D toggles audio description', 'default', async ({ page, root }) => {
  await focusIn(root, 'mute'); const s0 = await snap(root); await key(page, 'd'); let s = await snap(root);
  expect(s.ad !== s0.ad, `D: data-ad stayed ${s0.ad}`); await key(page, 'd'); s = await snap(root); expect(s.ad === s0.ad, 'second D did not restore');
});
kt('< and > step the speed and announce "Playback speed, {value}"', 'default', async ({ page, root }) => {
  await focusIn(root, 'mute'); const s0 = await snap(root); await key(page, '>'); let s = await snap(root);
  expect(s.speed !== s0.speed && /^Playback speed, /.test(s.speed), `>: speed name ${s0.speed} -> ${s.speed}`);
  expect(s.status === s.speed, `status says "${s.status}", expected "${s.speed}"`);
  await key(page, '<'); s = await snap(root); expect(s.speed === s0.speed, `<: back to ${s.speed}, expected ${s0.speed}`); expect(s.status === s0.speed, `status says "${s.status}"`);
});
kt('F requests full screen on the player', 'default', async ({ page, root }) => {
  await focusIn(root, 'mute'); await key(page, 'f'); const s = await snap(root); expect(s.fs === 1, `requestFullscreen on the player called ${s.fs} times`);
});
kt('F does nothing with no full screen (limited)', 'limited', async ({ page, root }) => {
  await root.locator('[data-act=play], [data-act=toggle]').first().focus(); await key(page, 'f'); const s = await snap(root); expect(s.fs === 0, 'requestFullscreen called on a limited source');
});
kt('T opens the transcript and moves focus to the current line', 'default', async ({ page, root }) => {
  await focusIn(root, 'mute'); await key(page, 't'); const s = await snap(root);
  expect(s.txShown, 'transcript not shown'); expect(s.focusInTx && /\.cue/.test(s.focus), `focus is on ${s.focus}, expected a transcript line`);
});
kt('Esc closes More and Playback speed and returns focus to the opener', 'default', async ({ page, root }) => {
  for (const [opener, label] of [['more', 'More options'], ['speed', 'Playback speed']]) {
    await act(root, opener).click(); let s = await snap(root); expect(s.groups.includes(label), `${label} did not open`);
    await key(page, 'Escape'); s = await snap(root); expect(!s.groups.includes(label), `${label} still open after Esc`);
    expect(s.focus === `button[data-act=${opener}]`, `focus on ${s.focus} after Esc, expected the ${opener} button`);
  }
});
kt('Enter / Shift+Enter in transcript search step through matches', 'transcript-search', async ({ page, root }) => {
  const input = await txSearch(root); await input.focus(); await page.waitForTimeout(600);
  const s0 = await snap(root); const m0 = s0.qs.match(/^(\d+) of (\d+) matches$/); expect(m0 && Number(m0[2]) > 1, `search count "${s0.qs}", expected "1 of N matches" with N > 1`);
  await key(page, 'Enter'); let s = await snap(root); expect(s.qs === `${Number(m0[1]) + 1} of ${m0[2]} matches`, `Enter: "${s.qs}"`);
  // FSD: focus stays in the field, and the current match is marked .em-vp-cue--hitcur (aria-current stays the playback cue)
  expect(s.inSearch, `focus left the search field after Enter (${s.focus})`); expect(s.hit >= 0 && s.hit !== s0.hit, `current-match marker: ${s0.hit} -> ${s.hit}`);
  await key(page, 'Shift+Enter'); s = await snap(root); expect(s.qs === s0.qs, `Shift+Enter: "${s.qs}", expected "${s0.qs}"`);
  expect(s.inSearch, 'focus left the search field after Shift+Enter'); expect(s.hit === s0.hit, `Shift+Enter marker ${s.hit}, expected ${s0.hit}`);
});
kt('Shortcuts are scoped: not outside the player, not in search, not in panels or the dialog, not with Ctrl/Alt/Meta', 'default', async ({ page, root }) => {
  const keys = ['k', 'm', 'c', 'd', 'l', 'f', 't'];
  const quiet = async (where) => { const s0 = await snap(root); for (const k of keys) await key(page, k); const s = await snap(root);
    for (const f of ['now', 'vol', 'muted', 'cc', 'ad', 'state', 'speed', 'txShown', 'fs']) expect(s[f] === s0[f], `${where}: ${f} changed ${s0[f]} -> ${s[f]}`); };
  await page.evaluate(() => document.activeElement?.blur()); await page.evaluate(() => document.body.focus()); await quiet('focus outside the player');
  await focusIn(root, 'mute'); for (const mod of ['Control', 'Alt', 'Meta']) { const s0 = await snap(root); for (const k of ['k', 'm', 'c']) await key(page, `${mod}+${k}`); const s = await snap(root);
    for (const f of ['muted', 'cc', 'state']) expect(s[f] === s0[f], `${mod} held: ${f} changed ${s0[f]} -> ${s[f]}`); }
  await act(root, 'speed').click(); await quiet('focus in Playback speed'); await key(page, 'Escape');
  await act(root, 'more').click(); await quiet('focus in More options'); await key(page, 'Escape');
});
kt('Shortcuts are ignored while typing in transcript search', 'transcript-search', async ({ page, root }) => {
  const input = await txSearch(root); await input.fill(''); await input.focus(); const s0 = await snap(root);
  for (const k of ['k', 'm', 'c']) await key(page, k); const s = await snap(root); expect(await input.inputValue() === 'kmc', `search field holds "${await input.inputValue()}"`);
  for (const f of ['muted', 'cc', 'state', 'now']) expect(s[f] === s0[f], `typing changed ${f} ${s0[f]} -> ${s[f]}`);
});
kt('Shortcuts are ignored in the caption settings dialog', 'caption-settings', async ({ page, root }) => {
  const dlg = page.locator('dialog[open]').first(); await dlg.locator('input, button, select').first().focus(); const s0 = await snap(root);
  for (const k of ['k', 'm', 'c', 'd']) await key(page, k); const s = await snap(root);
  for (const f of ['muted', 'cc', 'ad', 'state']) expect(s[f] === s0[f], `in the dialog: ${f} changed ${s0[f]} -> ${s[f]}`);
});

// ---------- layout, targets, text spacing, zoom, axe: every story ----------
// H-9 overflow is the page's horizontal overflow. Also (CA ruling, Nov 10): any element inside the player whose border box
// (getBoundingClientRect, which never includes outlines) sticks out of the player's box sideways fails, except this list:
const CONTAIN_EXEMPT = [
  'visually hidden (sr-only): clip/clip-path set, or a 1x1 box',
  'inside a scroll container (overflow other than visible) that is itself inside the player, e.g. the transcript list or an overflow-x row',
  'top layer: an open <dialog> or :popover-open, and their contents',
  'anything under :fullscreen',
];
const overflowOf = (page, root) => root.evaluate((P) => { const pr = P.getBoundingClientRect();
  const exempt = (e) => {
    const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
    if ((cs.clip && cs.clip !== 'auto') || (cs.clipPath && cs.clipPath !== 'none') || (r.width <= 1 && r.height <= 1)) return true;
    if (e.closest('dialog[open]') || e.closest(':popover-open') || e.closest(':fullscreen')) return true;
    for (let a = e.parentElement; a && a !== P; a = a.parentElement) { const c = getComputedStyle(a);
      if (c.overflowX !== 'visible' || c.overflow !== 'visible') { const ar = a.getBoundingClientRect(); if (ar.left >= pr.left - 0.5 && ar.right <= pr.right + 0.5) return true; } }
    return false; };
  const out = [...P.querySelectorAll('*')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' && (r.right > pr.right + 0.5 || r.left < pr.left - 0.5) && !exempt(e); });
  return { doc: document.documentElement.scrollWidth - innerWidth, root: out.length, what: out.slice(0, 3).map((e) => e.dataset.act || e.dataset.slot || e.tagName.toLowerCase()).join(',') }; });
const clippedIn = (root) => root.evaluate((P) => [...P.querySelectorAll('button,a,label,h1,h2,h3,[data-slot],.tnum,.time')]
  .filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
    return r.width > 1 && r.height > 1 && e.offsetParent && cs.overflow !== 'visible' && cs.position !== 'absolute' && (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1); })
  .map((e) => `${e.tagName.toLowerCase()}${e.dataset.slot ? '[data-slot=' + e.dataset.slot + ']' : e.dataset.act ? '[data-act=' + e.dataset.act + ']' : ''}`));
const SPACING_CSS = '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}';
async function captionsOn(page, root) { // H-8: the text-spacing scan runs with a caption showing
  const s = await snap(root); if (!s.ccShown) return false;
  if (s.cc !== 'on') await act(root, 'cc').click();
  const shown = () => root.locator('[data-slot=cap]').first().evaluate((e) => e.textContent.trim().length > 0 && e.getClientRects().length > 0).catch(() => false);
  await focusIn(root, 'mute'); await key(page, 'k'); // play, so the poster gives way to the frame and its captions
  for (let i = 0; i < 40 && !(await shown()); i++) await page.waitForTimeout(250);
  await key(page, 'k'); await page.waitForTimeout(200);
  return shown();
}
const combos = () => THEMES.flatMap((th) => MODES.map((md) => [th, md]));
const groupFor = (name) => ({ KB: 'KB', OVERFLOW: 'OVERFLOW', TARGETS: 'TARGETS', SPACING: 'SPACING', ZOOM: 'ZOOM', AXE: 'AXE', CONTRAST: 'CONTRAST', ACR: 'ACR' })[name.split(' ')[0]];

test('OVERFLOW + TARGETS + SPACING every story', `${DONE.overflow}; ${DONE.targets}; ${DONE.spacing}`, async () => {
  const bad = [];
  for (const w of WIDTHS) for (const [th, md] of combos()) for (const story of STORIES) {
    const o = await open(story, { width: w, theme: th, md });
    try {
      const at = `${story} ${w} ${th}~${md}`;
      if (!ONLY || ONLY.includes('OVERFLOW')) { const ov = await overflowOf(o.page, o.root); if (ov.doc > 0 || ov.root > 0) bad.push(`OVERFLOW ${at}: page ${ov.doc}px, ${ov.root} element(s) outside the player ${ov.what}`); }
      if (!ONLY || ONLY.includes('TARGETS')) { const { out } = await o.page.evaluate(measure); for (const t of out) bad.push(`TARGETS ${at}: ${t.covered ? `${t.name} covered at its centre` : `${t.name} ${t.w}x${t.h} < ${t.min}`}`); }
      if (!ONLY || ONLY.includes('SPACING')) {
        const capped = story === 'default' ? await captionsOn(o.page, o.root) : null;
        if (story === 'default' && !capped) bad.push(`SPACING ${at}: could not show a caption for the scan`);
        await o.page.addStyleTag({ content: SPACING_CSS }); await o.page.waitForTimeout(200);
        const ov = await overflowOf(o.page, o.root); const clip = await clippedIn(o.root);
        if (ov.doc > 0 || ov.root > 0) bad.push(`SPACING ${at}: overflow page ${ov.doc}px, ${ov.root} element(s) outside the player ${ov.what}`);
        if (clip.length) bad.push(`SPACING ${at}: clipped ${clip.slice(0, 5).join(', ')}`);
      }
      if (o.errors.length) bad.push(`ERRORS ${at}: ${o.errors.join('; ')}`);
    } finally { await o.ctx.close(); }
  }
  if (bad.length) throw new Error(`${bad.length} problems (containment exemptions: ${CONTAIN_EXEMPT.join('; ')})\n    ${bad.slice(0, 40).join('\n    ')}`);
});
// Panels the repo-wide target-size gate never opens. HANDOFF control table: below a 560px container, Speed is radio chips
// inside More (so the More case covers it) and Transcript is a More item; at 560 and up both are bar buttons.
const PANELS = [['More options'], ['Playback speed'], ['caption settings'], ['transcript']];
const visAct = async (root, a) => { const all = root.locator(`[data-act=${a}]`); for (let i = 0; i < await all.count(); i++) if (await all.nth(i).isVisible()) return all.nth(i); return null; };
async function openPanel(o, label) {
  const click = async (a) => { const b = await visAct(o.root, a); if (!b) return false;
    // one retry: the prototype's tooltip can keep a button 'unstable' for a moment
    await b.click().catch(async () => { await o.page.mouse.move(0, 0); await o.page.waitForTimeout(300); await b.click(); });
    await o.page.waitForTimeout(150); return true; };
  if (label === 'More options') return click('more');
  if (label === 'caption settings') return (await click('more')) && click('capset');
  if (label === 'Playback speed') return (await visAct(o.root, 'speed')) ? click('speed') : 'in-more';
  if (label === 'transcript') return (await visAct(o.root, 'tx')) ? click('tx') : (await click('more')) && click('tx');
  return false;
}
test('TARGETS with every panel open (More, Playback speed, caption settings, transcript)', DONE.targets, async () => {
  const bad = [];
  for (const w of WIDTHS) for (const [th, md] of combos()) {
    for (const [label] of PANELS) {
      const o = await open('default', { width: w, theme: th, md });
      try {
        const how = await openPanel(o, label);
        if (how === 'in-more') { log(`  note: ${label} at ${w}px sits inside More (HANDOFF control table), covered by the More options case`); continue; }
        if (!how) { bad.push(`TARGETS ${w} ${th}~${md}: couldn't open ${label}`); continue; }
        const { out } = await o.page.evaluate(measure);
        for (const t of out) bad.push(`TARGETS ${label} ${w} ${th}~${md}: ${t.covered ? `${t.name} covered at its centre` : `${t.name} ${t.w}x${t.h} < ${t.min}`}`);
      } finally { await o.ctx.close(); }
    }
  }
  if (bad.length) throw new Error(`${bad.length} problems\n    ${bad.slice(0, 40).join('\n    ')}`);
});
test('ZOOM 200% (640 css px at scale 2) every story', DONE.zoom, async () => {
  const bad = [];
  for (const [th, md] of combos()) for (const story of STORIES) {
    const o = await open(story, { width: 640, height: 400, scale: 2, theme: th, md });
    try { const ov = await overflowOf(o.page, o.root); if (ov.doc > 0 || ov.root > 0) bad.push(`ZOOM ${story} ${th}~${md}: page ${ov.doc}px, ${ov.root} element(s) outside the player ${ov.what}`); } finally { await o.ctx.close(); }
  }
  if (bad.length) throw new Error(`${bad.length} problems\n    ${bad.join('\n    ')}`);
});
// CA ruling (Nov 10): minor and moderate fail too. A rule is exempt only by a named entry here with a reason and CA's sign.
const AXE_EXEMPT = [ /* { rule: 'rule-id', reason: '...', signedBy: 'Chief Architect, date' } */ ];
test('AXE all impacts every story, plus each panel open', DONE.axe, async () => {
  const bad = []; for (const x of AXE_EXEMPT) expect(x.rule && x.reason && x.signedBy, `AXE_EXEMPT entry missing rule/reason/signedBy: ${JSON.stringify(x)}`);
  const run = async (o, at) => {
    await o.page.addScriptTag({ content: axeSrc });
    const v = await o.page.evaluate(async (sel) => (await window.axe.run(sel ? { include: [[sel]] } : document, { resultTypes: ['violations'] })).violations
      .map((x) => `${x.impact} ${x.id} (${x.nodes.length}) ${String(x.nodes[0]?.target)}`), o.scope);
    for (const x of v) if (!AXE_EXEMPT.some((e) => x.split(' ')[1] === e.rule)) bad.push(`AXE ${at}: ${x}`);
  };
  for (const [th, md] of combos()) {
    for (const story of STORIES) { const o = await open(story, { theme: th, md }); o.scope = PROTO ? await scopeSel(o) : null; try { await run(o, `${story} ${th}~${md}`); } finally { await o.ctx.close(); } }
    for (const [label] of PANELS) {
      const o = await open('default', { theme: th, md }); o.scope = PROTO ? await scopeSel(o) : null;
      try { if (!(await openPanel(o, label))) bad.push(`AXE ${th}~${md}: couldn't open ${label}`); else await run(o, `default + ${label} ${th}~${md}`); } finally { await o.ctx.close(); }
    }
  }
  if (bad.length) throw new Error(`${bad.length} violations\n    ${bad.slice(0, 40).join('\n    ')}`);
});
// In the prototype the page holds many players, so axe is scoped to the one under test (its id); Storybook stories are just the player.
async function scopeSel(o) { const id = await o.root.getAttribute('id'); return id ? `#${id}` : null; }

test('CONTRAST caption pairs in contrast.mjs (4 Solid, 4 Translucent), all 4.5:1+', DONE.contrast, async () => {
  const r = spawnSync(process.execPath, [new URL('./contrast.mjs', import.meta.url).pathname], { encoding: 'utf8' });
  expect(r.status === 0, `contrast.mjs exited ${r.status}: ${(r.stdout || '').split('\n').filter((l) => l.startsWith('FAIL')).slice(0, 5).join('; ')}`);
  const rows = fs.readFileSync(new URL('../docs/CONTRAST.md', import.meta.url), 'utf8').split('\n')
    .filter((l) => /^\|/.test(l)).map((l) => l.split('|').map((c) => c.trim()).filter(Boolean)).filter((c) => /^captions\./.test(c[0] || '')); // FSD: first column 'captions.{color}'
  const ratios = rows.map((c) => Number(c[c.length - 1])).filter((n) => !Number.isNaN(n));
  expect(ratios.length >= 8, `docs/CONTRAST.md has ${ratios.length} caption rows, expected 8 (4 Solid, 4 Translucent over the worst frame)`);
  expect(ratios.every((n) => n >= 4.5), `caption rows under 4.5: ${rows.filter((c) => Number(c[c.length - 1]) < 4.5).map((c) => c.join(' ')).join('; ')}`);
});
test('CONTRAST rendered caption tokens follow data-caption-color (H-8 mapping)', DONE.contrast, async () => {
  if (PROTO) return 'n/a';
  const expectMap = { white: ['#ffffff', '#000000'], yellow: ['#ffe600', '#000000'], cyan: ['#00e5ff', '#000000'], black: ['#000000', '#ffffff'] };
  const o = await open('caption-settings'); // FSD: the story for the rendered check
  try {
    for (const [c, [fg, bg]] of Object.entries(expectMap)) {
      const got = await o.root.evaluate((P, c) => { P.setAttribute('data-caption-color', c); const cs = getComputedStyle(P);
        const probe = (v) => { const e = document.createElement('span'); e.style.color = `var(${v})`; P.append(e); const out = getComputedStyle(e).color; e.remove(); return out; };
        void cs; return [probe('--caption-text'), probe('--caption-bg')]; }, c);
      const hex = (rgb) => '#' + (rgb.match(/\d+/g) || []).slice(0, 3).map((n) => Number(n).toString(16).padStart(2, '0')).join('');
      expect(hex(got[0]) === fg && hex(got[1]) === bg, `data-caption-color=${c}: --caption-text ${hex(got[0])} on --caption-bg ${hex(got[1])}, expected ${fg} on ${bg}`);
    }
  } finally { await o.ctx.close(); }
});
// CA hardening (Nov 10): don't depend on exact TODO wording. A row can't say 'Supports' while that row carries a TODO
// about a pending human pass (ACR_PENDING); 1.2.2 for the listening/caption pass and 4.1.3 for the screen-reader pass.
const ACR_PENDING = /listening|screen[- ]?reader|SR pass|caption review/i;
test('ACR 1.2.x rows present; 1.2.2 and 4.1.3 not Supports while a pending-pass TODO is open (CA)', 'CA ruling: ACR 1.2.x is a docs review item, plus this static check', async () => {
  const acr = fs.readFileSync(new URL('../docs/ACR.md', import.meta.url), 'utf8').split('\n');
  const row = (sc) => acr.find((l) => l.startsWith(`| ${sc} `));
  for (const sc of ['1.2.1', '1.2.2', '1.2.3', '1.2.4', '1.2.5', '4.1.3']) expect(row(sc), `docs/ACR.md has no ${sc} row`);
  for (const sc of ['1.2.2', '4.1.3']) { const r = row(sc) || ''; const level = r.split('|').map((c) => c.trim())[3];
    expect(!(level === 'Supports' && /TODO/.test(r) && ACR_PENDING.test(r)), `${sc} says Supports while its row has an open pending-pass TODO`); }
});

// ---------- runner ----------
const GREP = process.env.GREP ? new RegExp(process.env.GREP, 'i') : null;
const selected = tests.filter((t) => !GREP || GREP.test(t.id)).filter((t) => !ONLY || ONLY.includes(groupFor(t.id)) || (t.id.startsWith('OVERFLOW') && ONLY.some((g) => ['OVERFLOW', 'TARGETS', 'SPACING'].includes(g))));
if (mode !== 'on') {
  for (const t of selected) { log(`SKIP(fixme) ${t.id} [${t.done}]: VideoPlayer not built yet (R-4). Turn on: set VP_GATES = 'on' in scripts/vp-gates.mjs`); }
  log(`vp-gates: ${selected.length} tests, all fixme (switch is '${mode}'), 0 run`);
  process.exit(0);
}
if (!PROTO) {
  const index = await (await fetch(`${base}/index.json`)).json();
  const have = new Set(Object.keys(index.entries));
  const missing = STORIES.filter((s) => !have.has(`media-videoplayer--${s}`));
  if (missing.length) { log(`FAIL stories missing from ${base}/index.json: ${missing.map((s) => `media-videoplayer--${s}`).join(', ')}`); process.exit(1); }
}
B.browser = await chromium.launch({ executablePath: exe, args: ['--autoplay-policy=no-user-gesture-required'] });
for (const t of selected) {
  const t0 = Date.now();
  try { const r = await t.fn(); if (r === 'n/a') { na++; log(`N/A  ${t.id}: the prototype predates the caption tokens`); } else { passes++; log(`PASS ${t.id} (${((Date.now() - t0) / 1000).toFixed(1)}s)`); } }
  catch (e) { fails++; log(`FAIL ${t.id} [${t.done}]\n    ${String(e.message).split('\n').join('\n    ')}`); }
}
await B.browser.close();
log(`vp-gates${PROTO ? ' (prototype)' : ''}: ${selected.length} tests, ${passes} passed, ${fails} failed, ${na} n/a, widths ${WIDTHS.join('/')}, ${THEMES.length} theme(s) x light/dark`);
process.exit(fails ? 1 : 0);
