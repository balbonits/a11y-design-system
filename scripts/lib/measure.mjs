// Shared effective hit-area measure (FU-BED-2, a11y-design-system #34). Used by scripts/target-size.mjs and
// scripts/vp-gates.mjs. It runs inside the page via page.evaluate(measure), so it must stay self-contained:
// no imports or outer variables in its body.
// Runs in the page. Returns one row per target that is too small or covered.
export function measure(opts = {}) {
  const min = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--target-min')) || 44;
  const sel = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="tab"], [role="checkbox"], [role="switch"], [role="link"]';
  const dialog = document.querySelector('dialog[open], [aria-modal="true"]');
  const out = [];
  let checked = 0;
  for (const el of document.querySelectorAll(sel)) {
    const cs = getComputedStyle(el);
    const r0 = el.getBoundingClientRect();
    if (r0.width <= 1 || r0.height <= 1 || cs.visibility === 'hidden' || el.closest('[hidden], [aria-hidden="true"], [inert]')) continue;
    if (dialog && !dialog.contains(el)) continue; // behind an open modal: not a target until the modal closes
    // WCAG 2.5.8 inline exception: a link inside running text.
    if (el.tagName === 'A' && cs.display === 'inline' && el.closest('p, li, td, th')) continue;
    el.scrollIntoView({ block: 'center', inline: 'center' });
    const r = el.getBoundingClientRect();
    const own = (t) => !!t && (t === el || el.contains(t) || [...(el.labels ?? [])].some((l) => l === t || l.contains(t)));
    const hit = (x, y) => x >= 0 && y >= 0 && x < innerWidth && y < innerHeight && own(document.elementFromPoint(x, y));
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const name = `${el.tagName.toLowerCase()}${typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/)[0] : ''} "${(el.getAttribute('aria-label') || el.textContent || el.labels?.[0]?.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30)}"`;
    checked++;
    if (!hit(cx, cy)) { out.push({ name, covered: true }); continue; }
    // Effective size along one axis. Chrome hit-tests a point as a 1x1 CSS px box (same at any device
    // scale), so a lone box reads 1px too big and a box with a neighbour painted over its edge reads 1px
    // too small. Sample a fixed 1/4px grid offset by 1/8px (no sample sits on a layout edge, which falls
    // on 1/64px units), take the contiguous run of hits through the centre, then correct each end by
    // half a pixel: -0.5 when the first miss is past the target's own probe box (it isn't in
    // elementsFromPoint there), +0.5 when something painted on top took that point.
    // Calibrated: 40/43/43.5/43.75/44px boxes at 0, .3, .5 and .75px offsets, alone and with
    // neighbours painted over each edge, measure exactly. Inside a modal <dialog> (top layer) Chrome
    // skips the 1px probe box and only snaps the box to whole pixels, which can read up to 0.5px small,
    // so the gate allows 0.5px: a target fails below min - 0.5 (e.g. under 43.5px for 44).
    const Q = 0.25, TOL = 0.5;
    const span = (horizontal) => {
      const c = horizontal ? cx : cy;
      const start = Math.floor(c) + 0.125 + Q * Math.round((c - Math.floor(c) - 0.125) / Q);
      const pt = (v) => (horizontal ? [v, cy] : [cx, v]);
      const at = (v) => hit(...pt(v));
      if (!at(start)) return 0;
      const end = (dir) => {
        let v = start;
        while (Math.abs(v - start) < 160 && at(v + dir * Q)) v += dir * Q;
        const [x, y] = pt(v + dir * Q);
        const under = x >= 0 && y >= 0 && x < innerWidth && y < innerHeight && document.elementsFromPoint(x, y).some(own);
        return v + dir * (Q / 2) + dir * (under ? 0.5 : -0.5);
      };
      return end(1) - end(-1);
    };
    const w = span(true), h = span(false);
    if (opts.all || w < min - TOL || h < min - TOL) out.push({ name, w: +w.toFixed(2), h: +h.toFixed(2), min });
  }
  scrollTo(0, 0);
  return { out, checked };
}
