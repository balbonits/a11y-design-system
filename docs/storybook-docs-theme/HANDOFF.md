# STORYBOOK-DOCS-THEME — HANDOFF

Card: STORYBOOK-DOCS-THEME (from Chief of Creatives). Author: UX/UI Designer. Builder: BED.
Route: VQA gates this exact head sha, CA signs this HANDOFF, CTE merges with `--no-ff`. Docs only; nothing under `src/` or `.storybook/` changes in this PR.

## Goal and scope

The Storybook **docs pages** (the preview iframe: MDX and autodocs) get the neo theme in **light and dark**:
page background, text, headings, links, inline code, code blocks and syntax, the ArgTypes table, the Canvas
block chrome (border, toolbar, Show code, Copy), and focus. Today main renders docs pages white in dark mode
and hard-codes light-only colours in `preview-head.html`.

Out of scope: the manager UI (that is #52, SB-MANAGER-AA / STORYBOOK-BRAND), component stories themselves, and motion (none added).

**Base.** Branched off current `main` **80f782d** (#47 merge). The card said `1a57bd1`; main moved with #47, which
changed `scripts/` only. `.storybook/preview.tsx` and `.storybook/preview-head.html` are byte-identical in
`1a57bd1`, `80f782d` and #45 (`79f89b7`), so the diff against #45 and against main is the same diff.

**Re-sync (FU-SB-DOCS-NITS, 2026-11-11).** Main's `.storybook/preview.tsx` gained `import './fonts/fonts.css';` (ebfc8c3,
vendored kinetic fonts) after this spec branched, so `mock/preview.tsx` is re-synced to main **bc84d67** (`.storybook/` is unchanged through b055b5d) and both `diffs/`
are regenerated against it. `git apply` of the two diffs on bc84d67 gives files byte-identical to `mock/`, so either
route in the builder steps gives the same result.

## Files in this folder

| File | What it is |
|---|---|
| `mock/preview.tsx` | Full target `.storybook/preview.tsx` (main + docs container) |
| `mock/preview-head.html` | Full target `.storybook/preview-head.html` (main with literals replaced by tokens + new rules) |
| `diffs/preview.tsx.diff`, `diffs/preview-head.html.diff` | Unified diffs main bc84d67 → mock, paths rewritten to `.storybook/` so `git apply` works |
| `theme-map.json` | Theme field → token map per mode, plus the CSS notes |
| `contrast.mjs` | Token-level contrast gate (46 pairs) + map check + rendered vs-main comparison |
| `docs-check.cjs` | Rendered gate on a built Storybook (checks A–G below) |
| `axe-docs.cjs` | axe on every docs page, 375 and 1280, light / dark / auto-with-OS-dark |
| `shoot.cjs`, `compose.py` | Annotated shots (badges + legend), 8-bit truecolor PNG |
| `results/` | Gate outputs on the final build and on main 80f782d |
| `handoff/` | 20 design shots (5 widths × 2 modes × 2 views) + 4 main-375 baseline shots |

## How the theme is applied (preview.tsx)

- `docsTheme(mode)` builds a Storybook theme with `create()` from `theme-map.json`'s map (inlined as `DOCS_MAP`)
  reading resolved values from `src/tokens.json`: `base` light/dark, `fontBase` = `--font-body`, `fontCode` =
  `--font-mono`, `appBorderRadius`/`inputBorderRadius` 12 (`--radius-md`). `DOCS_THEMES = { light, dark }`.
- `EmberDocsContainer` wraps Storybook's `DocsContainer` and passes `theme={DOCS_THEMES[mode]}`.
  `mode` = `<html data-mode>` (set by the existing `applyTheme`; removed for Auto), else
  `matchMedia('(prefers-color-scheme: dark)')`. It re-renders on a `MutationObserver` (data-mode) and a
  `matchMedia` change listener, both cleaned up on unmount.
- `parameters.docs.container = EmberDocsContainer`. Nothing else in preview.tsx changes.

Live switching was verified through the real path (the manager's `updateGlobals` on the addons channel), not by
poking `data-mode`, which the story decorator resets. Auto reloads the iframe; the container follows OS mode.

### Field map (both modes; [light, dark] where they differ)

| Field | Token | Where it shows on docs pages |
|---|---|---|
| appContentBg | --surface | Docs page, code-block Copy bar |
| appBorderColor | --border-subtle | h2 rules, table lines |
| textColor | --text | Body text, ArgTypes |
| textMutedColor | --text-muted | "Stories" heading |
| barBg / barTextColor | --surface / --text-muted | Canvas toolbar |
| colorPrimary / barSelectedColor | [--accent-hover, --accent] | Selected/active |
| appPreviewBg | --color-bg | Story canvas |
| others | see `theme-map.json` | Controls (not on docs pages) |

`appBorderColor` deliberately differs from the manager map in #52 (--border there): docs pages draw many rules
and table lines, and --border-subtle keeps them quiet while still passing 3:1 (5.33 light / 5.07 dark).

## CSS rules (preview-head.html)

All colours are `var(--token)`; neo vars are live on `:root` in the iframe and follow the mode.

| Selector | Rule |
|---|---|
| `.sbdocs h1, .sbdocs h2` | `--font-display`, `--weight-display`, `--text` |
| links | `--docs-link`: --accent-hover light, --accent dark (set per `data-mode` and per OS mode); underline 1px, 2px on hover |
| `.sbdocs :not(pre) > code` | bg --surface-muted, 1px --border-subtle, --text |
| `.docblock-source` | bg --surface-muted, 2px --border, --radius-md |
| syntax | plain --text; comment/punctuation/operator --text-muted; tag/class-name/keyword --docs-keyword (= link colour); attr-name --warning; string/attr-value --success |
| `.docblock-argstable span[title="Required"]` | --danger (was fixed #ff4400, 3.45:1) |
| `.docblock-argstable td div > span[class]:not([title])` | type chips: --surface-muted, 1px --border-subtle, --text, mono (descriptions are plain `<span>` and stay unstyled) |
| `.sbdocs-content table tr:nth-of-type(2n)` | zebra --surface-muted (was fixed blue-grey) |
| `.sbdocs-preview` | 2px --border, no shadow |
| `.sbdocs-preview > .sb-bar + .docs-story` | margin-top 8px: the story moves down by the bar's extra 8px (Storybook's preview padding-top is 40px for its 40px bar). A sibling selector, so it works without `:has()` (revision 2; revision 1 used `.sbdocs-preview:has(> .sb-bar) { padding-top: 48px }`, which without `:has()` let the 48px bar cover the story's top 8px) |
| `.sb-bar` and its nested divs (3 levels) | height 48px, align-items center (was 40px, clipping 44px zoom buttons) |
| `.docblock-source > div:has(> button)`, `.docs-story > div:has(> .docblock-code-toggle)` | action bars inset bottom 4px / right 4px, flex gap 4px; buttons 2px --border, --radius-sm, --surface, --text, body font 600 |
| links, buttons, code viewports `:focus-visible` | 3px --focus-ring-color, offset 2px |

Main's mobile/overflow rules and its 44px docs-button rule are kept unchanged.

## Layout per breakpoint

Docs pages are a single fluid column (Storybook's own max-width ~1000px, centred, 12px gutters below 600).
No layout changes between breakpoints beyond what main already does; what is pinned:

| Width | Behaviour |
|---|---|
| 320 | One column, 12px gutters. Canvas toolbar 48px, zoom 44×44, tools that don't fit scroll inside the bar (main's rule). ArgTypes table scrolls inside its own box. No page-level sideways scroll (F). |
| 375 | Same as 320. |
| 599 | Same as 320 (last width of the <600 band; 44px minimum applies). |
| 600 | Storybook's ≥600 docs layout; 44px rule still met by the 48px bar. |
| 1280 | Centred column; all toolbar tools visible. |

Touch targets: every docs control below 600 is ≥44×44 and **fully** tappable (9-point elementFromPoint probe:
centre, 4 edge midpoints 1px in, 4 corners 4px in). Exception: heading anchor links are `aria-hidden`,
`tabindex=-1`, ~24×18–26, and pass under the WCAG 2.5.8 spacing exception (not focusable, duplicate of the heading's own URL). See KI-2 and check H.

## Contrast (`node docs/storybook-docs-theme/contrast.mjs`, exit 1 on any failure)

46 token pairs (23 × 2 modes), **0 failures**. Lowest: syntax string 5.24 light; focus ring on --surface-muted 3.32 dark.
Full table: `results/contrast.txt`.

Rendered vs main 80f782d by kind: **22 up, 4 same, 2 down**.

**Syntax floor (CA ruling).** `contrast.mjs` names `SYNTAX_FLOOR = 4.5` and applies it to every syntax-token pair
(plain, keyword/tag/class-name, attr-name, string/attr-value, punctuation/operator/comment) in both modes, 10 pairs,
and to the two rendered code-block lows from `docs-check`. Any of them below 4.5 fails the gate.

See Known issues for KI-1 (the code-block low going down, accepted).

The 4 "same" rows are the focus ring, which is unchanged token-for-token.

## Rendered gate (`docs-check.cjs`)

Pages: introduction, tokens, components-button docs, components-table docs; widths 320/375/599/600/1280; light, dark, auto.

| Check | Covers |
|---|---|
| A | Fidelity: page bg, h1, link, code bg equal the token |
| B | Text contrast (alpha composited) |
| C | UI contrast |
| D | Live switching via the manager channel |
| E | 9-point probes, 44px minimum below 600 |
| F | No page-level sideways scroll |
| G | Reduced motion: 0 running animations |
| H | Heading anchors at 320 and 1280: the 24px circle centred on each anchor (centre + 16 points at 12px) overlaps no other target |
| I | Every Canvas bar: the story starts at or below the bar's bottom edge (no hidden content) |
| J | Heading anchors on-canvas, every width: the icon starts at x ≥ 0, ends at or before the heading text, and the heading text starts at the content's left edge (FU-SB-DOCS-NITS c) |

| Build | Pass | Fail |
|---|---|---|
| This design | **4353** | **0** |
| This design, `--no-has` (fallback, below) | **488** | **0** |
| This design without the anchor-gutter rule (negative for J, `results/docs-check-nits-negative.txt`) | 4177 | 176 (all J, at 320, 375, 599 and 600: icon x -12..2) |
| main 80f782d (negative control) | 3891 | 144 (A 37, B 12, D 2, E 30 — e.g. zoom 44×44 with probe hits `100111111`, clipped by the 40px bar) |

The main run is the negative control: the gate catches every defect this card fixes. (The main 80f782d row predates check J.)

## axe

- `axe-docs.cjs`: 78 runs (13 docs pages on main bc84d67 × 375/1280 × light/dark/auto-OS-dark), **0 failing**, 168 minor/moderate (`results/axe-docs-new.txt`).
- Repo `scripts/a11y.mjs` on the new build: 362 runs plus 8 manager runs, **0 failing**, exit 0 (`results/a11y-full-new.txt`).

## Fallback without `:has()` (SPIKE-DOCS-2, CA ruling)

Two rules use `:has()`, both for the Copy and Show code action bars:
- `.docblock-source > div:has(> button), .docs-story > div:has(> .docblock-code-toggle)` (the 4px inset, flex, gap)
- `.docblock-source > div:has(> button) > button, .docs-story > div:has(> .docblock-code-toggle) > button` (neo button look)

In a browser without `:has()` (for example Firefox before 121) both are dropped as a whole and Storybook's own action
bar returns, exactly as on main: Copy and Show code sit at bottom 0 / right 0, 44px tall (main's 44px docs-button rule
doesn't use `:has()`), with the far corner clipped by the 12px radius. The Canvas toolbar (48px bar, 44px zoom) and the
story offset don't use `:has()`, so they hold. Floor, gated by `docs-check.cjs --no-has` (strips every rule whose
selector contains `:has(` from the served preview head): every docs button at least 24x24 (they are 44 tall),
`elementFromPoint` hits at the centre and 4 edge midpoints, no Canvas bar covering its story, the anchor circles clear,
the anchors on-canvas (J), and no sideways scroll. Result: 488 pass, 0 fail (`results/docs-check-new-no-has.txt`). Colour checks A-C, D and G are
skipped in that mode; the action buttons there use Storybook's own colours, as on main.

## Version pin (Storybook 8.6.19)

These selectors depend on Storybook 8.6.19's docs DOM. On any Storybook upgrade, re-run `docs-check.cjs` (both modes),
`axe-docs.cjs` and `contrast.mjs`; a failure means re-spec, not a CSS patch:
- `.sbdocs-preview > .sb-bar` and its three nested `div` levels (bar height); `.sbdocs-preview > .sb-bar + .docs-story`
- `.docblock-source > div:has(> button)`, `.docs-story > div:has(> .docblock-code-toggle)` (action bars)
- `.docblock-argstable span[title="Required"]` (asterisk)
- **`.docblock-argstable td div > span[class]:not([title])`** (ArgTypes type chips: chips carry an emotion class, descriptions are a plain `<span>`; SPIKE-DOCS-1, now covered here)
- `.sbdocs-content table tr:nth-of-type(2n)` (zebra); `.docblock-source [data-radix-scroll-area-viewport]` (focus)
- `.sbdocs-content :is(h1, h2, h3, h4) a[aria-hidden="true"]` (heading anchors, check H)
- `.sbdocs-content :is(h1, h2, h3, h4) > a[aria-hidden="true"]` and its `> svg` (anchor gutter fit at 640px and below, check J; depends on Storybook floating the anchor with margin-left -24px and a 14px svg)

## Known issues and rulings

- **KI-1, code-block low goes down, accepted (Creatives' ruling, 2026-11-11).** Lowest code-block ratio: light 8.37 (main)
  to 5.24, dark 8.37 (main) to 7.81. Main used fixed light-only hex syntax colours; tokens drive syntax now and work in dark.
  Still AA, and CA added the 4.5 syntax floor to the gate.
- **KI-2, heading anchors are mouse-only (Storybook default, 2.1.1 gap), not blocking (CA's ruling).** The copy-link anchors
  are `aria-hidden="true"` and `tabindex="-1"`, about 24x18 to 26. Their size passes under the 2.5.8 spacing exception
  (check H: the 24px circle overlaps no other target at 320 and 1280). Headings and content stay fully keyboard-reachable.
  Follow-up **FU-SB-DOCS-ANCHOR-KBD**: make the anchor focusable with a name like "Link to <heading>" and drop `aria-hidden`.
  **Gutter fit (FU-SB-DOCS-NITS c, VQA's nit):** at 640px and below the docs gutter is 12px, but Storybook floats the anchor at
  margin-left -24px (14px icon + 10px padding-right), so it sat at x -12..12 with its icon at x -12..2, mostly off-canvas. In
  `mock/preview-head.html`, inside `@media (max-width: 640px)`: the anchor gets margin-left -12px and padding-right 2px, and its
  svg is 10x10. It now spans x 0..12, fully in the gutter, and the heading text stays at x 12, aligned with the body. Why shrink
  the icon instead of indenting the heading: a 14px icon can't fit a 12px gutter, and pushing every heading right would break
  the left edge the body text shares. It's still `aria-hidden`, `tabindex="-1"` and shown on hover only, so it stays mouse-only
  until FU-SB-DOCS-ANCHOR-KBD (which should start from these gutter values). Above 640px nothing changes (x 116..140 at 1280).
  Check H still passes, and check J gates the fit at every width. Shots: `handoff/docs-320-{light,dark}-anchor-hover.png`.
- Base 80f782d instead of 1a57bd1 (accepted by Creatives; the `.storybook` files are identical).

## Motion

No motion added. Link underline thickness change on hover is instant (no transition). G confirms 0 running
animations under `prefers-reduced-motion: reduce`. Nothing to fall back.

## Shots (`handoff/`, lossless 8-bit RGB PNG)

`docs-<width>-<light|dark>-<intro|canvas>.png` for 320/375/599/600/1280. Each has numbered badges and a legend
underneath (`docs-legends.json` has the same notes as data). `intro` = h1, focused link, inline code, code block, Copy.
`canvas` = Canvas border, 48px toolbar, zoom 44×44, Show code, ArgTypes. `main-375-*` are the baseline for comparison.
`docs-320-{light,dark}-anchor-hover.png` (FU-SB-DOCS-NITS c, 2x, heading hovered): before and after the anchor gutter fit,
with the 12px gutter edge dashed. The anchors only show on hover, so the other shots are unchanged.

## Builder steps (BED)

1. On a branch off main: `git apply docs/storybook-docs-theme/diffs/preview.tsx.diff docs/storybook-docs-theme/diffs/preview-head.html.diff`
   (or copy the two `mock/` files over `.storybook/`; they are complete files).
2. `npm run build-storybook`, serve `storybook-static`.
3. Gates, all must pass:
   - `node docs/storybook-docs-theme/contrast.mjs`
   - `node docs/storybook-docs-theme/docs-check.cjs http://127.0.0.1:<port>` → 0 fail
   - `node docs/storybook-docs-theme/docs-check.cjs http://127.0.0.1:<port> --no-has` → 0 fail
   - Tokens default to the repo's `src/tokens.json`. To point at another file, set `TOKENS=<path>`, resolved from the
     current directory (for example `TOKENS=./src/tokens.json` from the repo root).
   - `node docs/storybook-docs-theme/axe-docs.cjs http://127.0.0.1:<port>` → 0 failing
   - `node scripts/a11y.mjs http://127.0.0.1:<port>` → exit 0
4. Compare against `handoff/` shots (`node docs/storybook-docs-theme/shoot.cjs <base> docs && python3 docs/storybook-docs-theme/compose.py`).

Tooling used here: Storybook 8.6.19, playwright-core, axe-core, Chrome stable.

## BED spikes

None open. SPIKE-DOCS-1 is covered by the version pin, and SPIKE-DOCS-2 by the `:has()` fallback and its gate (both CA's rulings).

## Reproduce

Scratch: `git archive` main (bc84d67 or later) into a temp dir, then either `git apply` the two `diffs/` or copy
`mock/preview.tsx` and `mock/preview-head.html` to `.storybook/` (they give byte-identical files). Build, serve, and
run the gates above from the repo root (no `TOKENS` needed).

Negative for check J: serve a copy of the build whose `iframe.html` has the `FU-SB-DOCS-NITS (c)` comment and the
`@media (max-width: 640px)` block after it removed. docs-check then fails 176, all J, at 320, 375, 599 and 600.
