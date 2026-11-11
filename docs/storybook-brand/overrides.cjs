// Checks the manager-head.html overrides in a real build (Storybook 8.6.19 internals; re-run on any Storybook bump).
// 1. Selected sidebar row text = --eb-selected-text. 2. Boolean control labels (KI-2), both states, light and dark, >= 4.5:1.
// 3. FU-SB-TOOLBAR-44: below 600px every toolbar control has a 44x44 hit area that isn't clipped and doesn't overlap a neighbour,
//    the visual control size is unchanged, and the focus ring isn't clipped; at 600px and up nothing changes (28px, 40px bars).
// Usage: NODE_PATH=<dir with playwright-core> node docs/storybook-brand/overrides.cjs http://127.0.0.1:8961/   (exit 1 on any failure)
const { chromium } = require('playwright-core');
const base = (process.argv[2] || 'http://127.0.0.1:8961/').replace(/\/?$/, '/');
const rgbHex = s => '#' + s.match(/\d+/g).slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join('');
// Composite an rgb()/rgba() color onto a hex background, so a 50%-alpha label measures what's actually painted.
const onBg = (c, bg) => { const n = c.match(/[\d.]+/g).map(Number), a = n.length > 3 ? n[3] : 1; return '#' + [0, 1, 2].map(i => Math.round(n[i] * a + parseInt(bg.slice(1 + 2 * i, 3 + 2 * i), 16) * (1 - a)).toString(16).padStart(2, '0')).join(''); };
const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(x => x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };
let fail = 0; const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) fail++; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome' });
  for (const scheme of ['light', 'dark']) {
    const p = await (await b.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: scheme })).newPage();
    await p.goto(base + '?path=/story/components-button--disabled');
    const sel = 'label:has(> input[role="switch"])'; await p.waitForSelector(sel); await p.waitForTimeout(400);
    const row = await p.evaluate(() => { const e = document.querySelector('#storybook-explorer-tree [data-selected="true"]'); return [getComputedStyle(e).color, getComputedStyle(document.documentElement).getPropertyValue('--eb-selected-text').trim()]; });
    ok(rgbHex(row[0]) === row[1].toLowerCase(), `${scheme} selected sidebar row text ${rgbHex(row[0])} = --eb-selected-text ${row[1]}`);
    for (let k = 0; k < 2; k++) {
      const r = await p.evaluate(s => { const l = document.querySelector(s), i = l.querySelector('input'), [f, t] = l.querySelectorAll(':scope > span'); const [on, off] = i.checked ? [t, f] : [f, t];
        return { checked: i.checked, track: getComputedStyle(l).backgroundColor, onC: getComputedStyle(on).color, onBg: getComputedStyle(on).backgroundColor, offC: getComputedStyle(off).color, offBg: getComputedStyle(off).backgroundColor, v: getComputedStyle(document.documentElement).getPropertyValue('--eb-boolean-label').trim() }; }, sel);
      const track = rgbHex(r.track), segBg = rgbHex(r.onBg), on = onBg(r.onC, segBg), off = onBg(r.offC, track);
      ok(!/rgba\(.*, 0\)$/.test(r.offBg) ? false : true, `${scheme} ${r.checked ? 'True' : 'False'} selected: unselected label sits on the track (transparent span)`);
      ok(off === r.v.toLowerCase() && cr(off, track) >= 4.5, `${scheme} ${r.checked ? 'True' : 'False'} selected: unselected label ${off} on track ${track} ${cr(off, track).toFixed(2)} (--eb-boolean-label ${r.v})`);
      ok(cr(on, segBg) >= 4.5, `${scheme} ${r.checked ? 'True' : 'False'} selected: selected label ${on} on ${segBg} ${cr(on, segBg).toFixed(2)}`);
      await p.click(sel); await p.waitForTimeout(300);
    }
    await p.context().close();
  }
  for (const w of [320, 599, 600, 1280]) {
    const p = await (await b.newContext({ viewport: { width: w, height: 640 } })).newPage();
    await p.goto(base + '?path=/story/components-button--primary'); await p.waitForSelector('#storybook-preview-iframe'); await p.waitForTimeout(1500);
    const r = await p.evaluate(() => {
      const bars = [...document.querySelectorAll('.sb-bar')].filter(x => x.getBoundingClientRect().height);
      return { docOverflow: document.documentElement.scrollWidth > innerWidth, bars: bars.map(bar => { const br = bar.getBoundingClientRect(); const sx = bar.scrollWidth;
        const c = [...bar.querySelectorAll('button[title], a[title]')].filter(x => x.getBoundingClientRect().width).map(x => {
          x.focus({ focusVisible: true }); // focus first (it may scroll the bar), then measure everything in the bar's scroll coordinates
          const fv = x.matches(':focus-visible'), o = getComputedStyle(x), ring = parseFloat(o.outlineWidth) + parseFloat(o.outlineOffset), outline = o.outlineStyle, focusColor = o.outlineColor;
          const r = x.getBoundingClientRect(), b2 = bar.getBoundingClientRect(), s = getComputedStyle(x, '::before'), has = s.content !== 'none' && s.position === 'absolute';
          const t = has ? parseFloat(s.top) : 0, l = has ? parseFloat(s.left) : 0, left = r.left - b2.left + bar.scrollLeft; x.blur();
          return { t: x.title, w: r.width, h: r.height, fv, hit: [left + l, r.top + t, left + r.width - l, r.top + r.height - t], ring: [r.top - ring, r.bottom + ring, left - ring, left + r.width + ring], outline, focusColor, has }; });
        return { top: br.top, bottom: br.bottom, h: br.height, sx, c }; }), focus: getComputedStyle(document.documentElement).getPropertyValue('--eb-focus').trim() };
    });
    if (w < 600) {
      ok(!r.docOverflow, `${w}: no page-level horizontal overflow`);
      for (const bar of r.bars) {
        ok(bar.h === 48, `${w}: bar ${bar.c.map(c => c.t)[0]}... height ${bar.h} (48 below 600)`);
        let prev = null;
        for (const c of bar.c) {
          const hw = c.hit[2] - c.hit[0], hh = c.hit[3] - c.hit[1];
          const inside = c.hit[1] >= bar.top - .5 && c.hit[3] <= bar.bottom + .5 && c.hit[0] >= -.5 && c.hit[2] <= bar.sx + .5;
          const overlap = prev && c.hit[0] < prev[2] - .5;
          const ringIn = c.ring[0] >= bar.top - .5 && c.ring[1] <= bar.bottom + .5 && c.ring[2] >= -.5 && c.ring[3] <= bar.sx + .5;
          ok(hw >= 44 && hh >= 44 && inside && !overlap, `${w}: "${c.t}" visual ${Math.round(c.w)}x${Math.round(c.h)}, hit ${Math.round(hw)}x${Math.round(hh)}, ${inside ? 'not clipped' : 'CLIPPED'}, ${overlap ? 'OVERLAPS previous' : 'no overlap'}`);
          ok(c.fv && c.outline === 'solid' && rgbHex(c.focusColor) === r.focus.toLowerCase() && ringIn, `${w}: "${c.t}" focus ring (${c.fv ? ':focus-visible' : 'NOT focus-visible'}) ${c.outline} ${rgbHex(c.focusColor)}, ${ringIn ? 'not clipped' : 'CLIPPED'}`);
          prev = c.hit;
        }
      }
      // The drawer header and the addon panel (opened from the bottom bar); the drawer is scrolled to the top first.
      const panel = async (open, ctrls) => {
        await p.click(open); await p.waitForTimeout(900);
        return p.evaluate(ctrls => ctrls.map(([sel, box]) => { const x = document.querySelector(sel); if (!x) return { sel, missing: true };
          let e = x; while (e && !(getComputedStyle(e).overflowY === 'scroll' || getComputedStyle(e).overflowY === 'auto')) e = e.parentElement; if (e) e.scrollTop = 0;
          x.focus({ focusVisible: true }); const fv = x.matches(':focus-visible'), o = getComputedStyle(x), ring = parseFloat(o.outlineWidth) + parseFloat(o.outlineOffset);
          const r = x.getBoundingClientRect(), c = x.closest(box).getBoundingClientRect(), b4 = getComputedStyle(x, '::before'), t = parseFloat(b4.top) || 0, l = parseFloat(b4.left) || 0;
          const hit = [r.left + l, r.top + t, r.right - l, r.bottom - t];
          return { sel, fv, outline: o.outlineStyle, color: o.outlineColor, w: r.width, h: r.height, hw: hit[2] - hit[0], hh: hit[3] - hit[1], inside: hit[0] >= c.left - .5 && hit[2] <= c.right + .5 && hit[1] >= c.top - .5 && hit[3] <= c.bottom + .5, ringIn: r.top - ring >= c.top - .5 && r.bottom + ring <= c.bottom + .5 && r.left - ring >= c.left - .5 && r.right + ring <= c.right + .5, hits: hit }; }), ctrls);
      };
      const rep = list => { let prev = null; for (const c of list) { if (c.missing) { ok(false, `${w}: ${c.sel} not found`); continue; }
        const overlap = prev && c.hits[0] < prev[2] - .5 && Math.abs(c.hits[1] - prev[1]) < 1;
        ok(c.hw >= 44 && c.hh >= 44 && c.inside && !overlap, `${w}: ${c.sel} visual ${Math.round(c.w)}x${Math.round(c.h)}, hit ${Math.round(c.hw)}x${Math.round(c.hh)}, ${c.inside ? 'not clipped' : 'CLIPPED'}, ${overlap ? 'OVERLAPS previous' : 'no overlap'}`);
        ok(c.fv && c.outline === 'solid' && rgbHex(c.color) === r.focus.toLowerCase() && c.ringIn, `${w}: ${c.sel} focus ring (${c.fv ? ':focus-visible' : 'NOT focus-visible'}) ${c.outline} ${rgbHex(c.color)}, ${c.ringIn ? 'not clipped' : 'CLIPPED'}`); prev = c.hits; } };
      rep(await panel('button[title="Open navigation menu"]', [['button[title="About Storybook"]', '.sidebar-header'], ['button[title="Close menu"]', '.sidebar-header']]));
      await p.goto(base + '?path=/story/components-button--primary'); await p.waitForSelector('#storybook-preview-iframe'); await p.waitForTimeout(1500);
      rep(await panel('button[title="Open addon panel"]', [['button[title="Close addon panel"]', '.sb-bar']]));
    } else {
      for (const bar of r.bars) ok(bar.h === 40 && bar.c.every(c => !c.has && c.h === 28), `${w}: bar unchanged (height ${bar.h}, ${bar.c.length} controls at 28px tall, no hit overlay)`);
    }
    await p.context().close();
  }
  await b.close(); console.log(fail ? `${fail} failures` : 'all override checks pass'); process.exit(fail ? 1 : 0);
})();
