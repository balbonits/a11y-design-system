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
  const dec = await (await b.newContext()).newPage(); // decodes 1px screenshots for the scroll-affordance pixel checks
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
      // overflow: visible must change no pixels: with every ::before removed, each control's own content still fits its box.
      const spill = await p.evaluate(() => { const st = document.createElement('style'); st.textContent = '*::before { content: none !important; }'; document.head.append(st);
        const r = [...document.querySelectorAll('.sb-bar button[title], .sb-bar a[title], .sidebar-header button[title]')].filter(x => x.getBoundingClientRect().width && x.scrollWidth > x.clientWidth + 0.5 || x.scrollHeight > x.clientHeight + 0.5).map(x => x.title); st.remove(); return r; });
      ok(spill.length === 0, `${w}: control content fits its own box without the overlay (so overflow: visible changes no pixels)${spill.length ? ': ' + spill.join(', ') : ''}`);
      // elementFromPoint probes (Creatives): for every bar control, scroll its hit area fully into view, then the centre, the four edge midpoints and the
      // four corners (each 1px inside the 44x44 box) must all resolve to that control, and a point 1px outside its left and right edges must not.
      const probes = await p.evaluate(() => [...document.querySelectorAll('.sb-bar')].filter(x => x.getBoundingClientRect().height).flatMap(bar =>
        [...bar.querySelectorAll('button[title], a[title]')].filter(x => x.getBoundingClientRect().width).map(x => {
          const s = getComputedStyle(x, '::before'), t = parseFloat(s.top) || 0, l = parseFloat(s.left) || 0;
          let r = x.getBoundingClientRect(), br = bar.getBoundingClientRect();
          bar.scrollLeft += (r.left + l) - br.left - (br.width - (r.width - 2 * l)) / 2; r = x.getBoundingClientRect();
          const h = [r.left + l, r.top + t, r.right - l, r.bottom - t], cx = (h[0] + h[2]) / 2, cy = (h[1] + h[3]) / 2;
          const at = (px, py) => { const e = document.elementFromPoint(px, py); return !!e && e.closest('button, a') === x; };
          const ins = [[cx, cy], [h[0] + 1, cy], [h[2] - 1, cy], [cx, h[1] + 1], [cx, h[3] - 1], [h[0] + 1, h[1] + 1], [h[2] - 1, h[1] + 1], [h[0] + 1, h[3] - 1], [h[2] - 1, h[3] - 1]];
          const bad = ins.filter(([px, py]) => !at(px, py)).length, out = [[h[0] - 1, cy], [h[2] + 1, cy]].filter(([px]) => px > 0 && px < innerWidth).filter(([px, py]) => at(px, py)).length;
          return { t: x.title, bad, out, n: ins.length }; })));
      for (const q of probes) ok(q.bad === 0 && q.out === 0, `${w}: elementFromPoint "${q.t}": ${q.n - q.bad}/${q.n} points inside the 44x44 box hit it, ${q.out ? 'a point outside hits it' : 'points 1px outside do not'}`);
      // Scroll affordance on the top toolbar: read real pixels 2px below the bar's top edge (padding, no controls) and 1px in from each edge.
      // The 3px --eb-border rule shows only on an edge with off-screen tools; elsewhere the pixel is the --eb-surface bar colour.
      const tb = await p.$('main > .sb-bar');
      const vars = await p.evaluate(() => { const g = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim().toLowerCase(); return { border: g('--eb-border'), surface: g('--eb-surface') }; });
      const px = async (x, y) => { const png = (await p.screenshot({ clip: { x, y, width: 1, height: 1 } })).toString('base64');
        return dec.evaluate(async src => { const i = new Image(); i.src = src; await i.decode(); const c = document.createElement('canvas'); c.width = c.height = 1; const g = c.getContext('2d'); g.drawImage(i, 0, 0);
          return '#' + [...g.getImageData(0, 0, 1, 1).data.slice(0, 3)].map(v => v.toString(16).padStart(2, '0')).join(''); }, 'data:image/png;base64,' + png); };
      for (const [pos, wantL, wantR] of [['start', 'surface', 'border'], ['middle', 'border', 'border'], ['end', 'border', 'surface']]) {
        const bb = await tb.evaluate((bar, pos) => { bar.scrollLeft = pos === 'start' ? 0 : pos === 'end' ? bar.scrollWidth : (bar.scrollWidth - bar.clientWidth) / 2; const r = bar.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top }; }, pos);
        await p.waitForTimeout(100);
        const L = await px(Math.round(bb.l) + 1, Math.round(bb.t) + 2), R = await px(Math.round(bb.r) - 2, Math.round(bb.t) + 2);
        ok(L === vars[wantL] && R === vars[wantR], `${w}: toolbar scrolled to ${pos}: left edge ${L} (want ${wantL} ${vars[wantL]}), right edge ${R} (want ${wantR} ${vars[wantR]})`);
      }
      // The drawer header and the addon panel (opened from the bottom bar); the drawer is scrolled to the top first.
      const panel = async (open, ctrls) => {
        await p.click(open); await p.waitForTimeout(900);
        return p.evaluate(ctrls => ctrls.map(([sel, box]) => { const x = document.querySelector(sel); if (!x) return { sel, missing: true };
          let e = x; while (e && !(getComputedStyle(e).overflowY === 'scroll' || getComputedStyle(e).overflowY === 'auto')) e = e.parentElement; if (e) e.scrollTop = 0;
          x.focus({ focusVisible: true }); const fv = x.matches(':focus-visible'), o = getComputedStyle(x), ring = parseFloat(o.outlineWidth) + parseFloat(o.outlineOffset);
          const r = x.getBoundingClientRect(), c = x.closest(box).getBoundingClientRect(), b4 = getComputedStyle(x, '::before'), t = parseFloat(b4.top) || 0, l = parseFloat(b4.left) || 0;
          const hit = [r.left + l, r.top + t, r.right - l, r.bottom - t];
          const at = (px, py) => { const e = document.elementFromPoint(px, py); return !!e && e.closest('button, a') === x; }, cx = (hit[0] + hit[2]) / 2, cy = (hit[1] + hit[3]) / 2;
          const bad = [[cx, cy], [hit[0] + 1, cy], [hit[2] - 1, cy], [cx, hit[1] + 1], [cx, hit[3] - 1], [hit[0] + 1, hit[1] + 1], [hit[2] - 1, hit[1] + 1], [hit[0] + 1, hit[3] - 1], [hit[2] - 1, hit[3] - 1]].filter(([px, py]) => !at(px, py)).length;
          return { sel, fv, outline: o.outlineStyle, color: o.outlineColor, w: r.width, h: r.height, hw: hit[2] - hit[0], hh: hit[3] - hit[1], inside: hit[0] >= c.left - .5 && hit[2] <= c.right + .5 && hit[1] >= c.top - .5 && hit[3] <= c.bottom + .5, ringIn: r.top - ring >= c.top - .5 && r.bottom + ring <= c.bottom + .5 && r.left - ring >= c.left - .5 && r.right + ring <= c.right + .5, hits: hit, bad }; }), ctrls);
      };
      const rep = list => { let prev = null; for (const c of list) { if (c.missing) { ok(false, `${w}: ${c.sel} not found`); continue; }
        const overlap = prev && c.hits[0] < prev[2] - .5 && Math.abs(c.hits[1] - prev[1]) < 1;
        ok(c.hw >= 44 && c.hh >= 44 && c.inside && !overlap, `${w}: ${c.sel} visual ${Math.round(c.w)}x${Math.round(c.h)}, hit ${Math.round(c.hw)}x${Math.round(c.hh)}, ${c.inside ? 'not clipped' : 'CLIPPED'}, ${overlap ? 'OVERLAPS previous' : 'no overlap'}`);
        ok(c.bad === 0, `${w}: elementFromPoint ${c.sel}: ${9 - c.bad}/9 points inside the 44x44 box hit it`);
        ok(c.fv && c.outline === 'solid' && rgbHex(c.color) === r.focus.toLowerCase() && c.ringIn, `${w}: ${c.sel} focus ring (${c.fv ? ':focus-visible' : 'NOT focus-visible'}) ${c.outline} ${rgbHex(c.color)}, ${c.ringIn ? 'not clipped' : 'CLIPPED'}`); prev = c.hits; } };
      rep(await panel('button[title="Open navigation menu"]', [['button[title="About Storybook"]', '.sidebar-header'], ['button[title="Close menu"]', '.sidebar-header']]));
      await p.goto(base + '?path=/story/components-button--primary'); await p.waitForSelector('#storybook-preview-iframe'); await p.waitForTimeout(1500);
      rep(await panel('button[title="Open addon panel"]', [['button[title="Close addon panel"]', '.sb-bar']]));
      const gap = await p.evaluate(() => { const bar = document.querySelector('button[title="Close addon panel"]').closest('.sb-bar'), c = bar.nextElementSibling; return { bar: bar.getBoundingClientRect().bottom, top: c.getBoundingClientRect().top, bottom: c.getBoundingClientRect().bottom, pane: bar.parentElement.getBoundingClientRect().bottom }; });
      ok(gap.top >= gap.bar - .5 && Math.abs(gap.bottom - gap.pane) < .5, `${w}: addon content starts at the 48px bar's bottom (${Math.round(gap.top)} vs ${Math.round(gap.bar)}) and still ends at the panel bottom`);
    } else {
      for (const bar of r.bars) ok(bar.h === 40 && bar.c.every(c => !c.has && c.h === 28), `${w}: bar unchanged (height ${bar.h}, ${bar.c.length} controls at 28px tall, no hit overlay)`);
    }
    await p.context().close();
  }
  await b.close(); console.log(fail ? `${fail} failures` : 'all override checks pass'); process.exit(fail ? 1 : 0);
})();
