# STORYBOOK-BRAND: Ember UI Storybook manager branding (HANDOFF, extends #45)

Status: design spec, dev-ready. The builder implements it as-is. This card changes no `.storybook/` or `src/` file.

**Extends #45, doesn't compete with it.** [#45](https://github.com/balbonits/a11y-design-system/pull/45) (SB-MANAGER-AA, `fix/sb-manager-aa` @ `79f89b7`) already gives the manager an accessible neo-palette theme and runs axe on the manager page. This HANDOFF is a diff on top of #45:
- The builder starts from #45's `.storybook/manager.ts` and `manager-head.html` on a new branch off main after #45 merges.
- Every #45 contrast pass stays at or above its #45 ratio. The gate checks this pair by pair: 46 shared pairs, 11 up, 35 the same, 0 down.
- #45's own axe check (`scripts/a11y-manager.mjs`) runs against this spec built on #45: 8 runs, 0 failing (section 3).

Target: the live Storybook at https://jdilig.me/ux/design-system/storybook/ (Storybook 8.6.19, @storybook/core 8.6.19).
Identity: Ember's neo theme (`src/tokens.json` `themes.neo`, the same values as `src/themes/neo.css` that #45 mirrors). No new colors, fonts or logo.

Files in this folder:
- `pr45/manager.ts` and `pr45/manager-head.html` are verbatim copies of #45's files at `79f89b7`, the base of this diff.
- `pr45/extract.mjs` reads `pr45/manager.ts` and writes `pr45/baseline.json`, #45's resolved values per field.
- `mock/manager.ts` and `mock/manager-head.html` are the exact files to ship (#45's files plus this card).
- `mock/manager.ts.diff` and `mock/manager-head.html.diff` are unified diffs from #45's files.
- `theme-map.json` is the field-to-token map, the single source the gate reads.
- `contrast.mjs` writes `CONTRAST.md` and exits 1 on any of: a ratio under the minimum, a pair below its #45 ratio, a token that doesn't resolve, or drift between `mock/manager.ts` and `theme-map.json`.
- `shoot.cjs` and `mock/build.sh` produce the annotated `handoff/` shots from a scratch build of #45 plus `mock/`.

## 1. Theme spec: `create()` fields as a diff against #45

Mode follows `prefers-color-scheme`, like #45. New: it now re-themes live when the OS setting changes (#45 read it once at load). The preview's Mode toolbar still drives only the stories and docs, not the manager.

Non-color fields:

| Field | #45 | New | Reason |
|---|---|---|---|
| `base` | `'light'` / `'dark'` | same | |
| `brandTitle` | Storybook default | `'<span class="ember-brand"><span class="ember-brand__blob" aria-hidden="true"></span>Ember UI</span>'` | The brand mark (section 2): neo's `.logo` markup, `docs/directions/v3/neo/index.html:135`, without the version tag. |
| `brandUrl` | default | `'https://jdilig.me/ux/design-system'` | card |
| `brandImage` | default (Storybook logo) | `null` (must be null, not undefined) | Storybook 8.6 Brand.tsx: `image === null` renders `brandTitle` as HTML inside the brand link. `undefined` renders the Storybook logo, and a string renders an `<img>`. Neo has no SVG logo. |
| `brandTarget` | default | `'_self'` | card |
| `fontBase` | `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` | `'Archivo', system-ui, sans-serif` (`--font-body`) | Neo's body font. No contrast effect. |
| `fontCode` | default | `'JetBrains Mono', ui-monospace, monospace` (`--font-mono`) | Neo's mono font. |
| `appBorderRadius` | `4` | `12` (`--radius-md`) | Neo's radius. |
| `inputBorderRadius` | `4` | `12` (`--radius-md`) | Neo's radius. |

Color fields: #45's value (its `NEO` name and hex) next to the new neo token and hex, written light / dark. 15 of the 20 are the same value, now read from the token. 5 change, and every one raises contrast or has no contrast pair.

| Field | #45 (light / dark) | New token and hex (light / dark) | Changes | Reason |
|---|---|---|---|---|
| `colorPrimary` | blue700 `#1530d0` / lime400 `#c6f432` | `--accent-hover` `#1530d0` / `--accent` `#c6f432` | none | Same value, now read from the token. |
| `colorSecondary` | blue600 `#1f3dff` / lime400 `#c6f432` | `--accent` `#1f3dff` / `--accent` `#c6f432` | none | Same value, now read from the token. |
| `appBg` | cream `#fdf8e9` / ink `#111111` | `--color-bg` `#fdf8e9` / `--color-bg` `#111111` | none | Same value, now read from the token. |
| `appContentBg` | paper `#ffffff` / ink2 `#1c1c1c` | `--surface` `#ffffff` / `--surface` `#1c1c1c` | none | Same value, now read from the token. |
| `appPreviewBg` | paper `#ffffff` / paper `#ffffff` | `--surface` `#ffffff` / `--color-bg` `#111111` | **dark** | Dark: neo's dark page color. No dark neo token is #ffffff (paper is only `--highlight-contrast` there, which means text on blue). There's no contrast pair, since this only shows behind the preview iframe. Needs a Creatives OK (see Open call). |
| `appBorderColor` | gray `#6b6b6b` / gray2 `#8c8c8c` | `--border` `#111111` / `--border` `#fdf8e9` | **light + dark** | Neo's `--border` (ink in light, cream in dark). UI contrast goes up: light 5.02 to 17.79 on appBg, dark 5.62 to 17.79. |
| `textColor` | ink `#111111` / cream `#fdf8e9` | `--text` `#111111` / `--text` `#fdf8e9` | none | Same value, now read from the token. |
| `textInverseColor` | paper `#ffffff` / ink `#111111` | `--surface` `#ffffff` / `--color-bg` `#111111` | none | Same value, now read from the token. |
| `textMutedColor` | inkSoft `#3d3d3d` / sand `#cfc8b0` | `--text-muted` `#3d3d3d` / `--text-muted` `#cfc8b0` | none | Same value, now read from the token. |
| `barTextColor` | inkSoft `#3d3d3d` / sand `#cfc8b0` | `--text-muted` `#3d3d3d` / `--text-muted` `#cfc8b0` | none | Same value, now read from the token. |
| `barSelectedColor` | blue700 `#1530d0` / lime400 `#c6f432` | `--accent-hover` `#1530d0` / `--accent` `#c6f432` | none | Same value, now read from the token. |
| `barHoverColor` | blue700 `#1530d0` / lime400 `#c6f432` | `--accent-hover` `#1530d0` / `--accent-hover` `#d7ff5a` | **dark** | Dark: neo's own hover token (`--accent-hover`, lime-300) instead of lime-400. 13.30 to 14.88 on barBg. |
| `barBg` | paper `#ffffff` / ink2 `#1c1c1c` | `--surface` `#ffffff` / `--surface` `#1c1c1c` | none | Same value, now read from the token. |
| `buttonBg` | paper `#ffffff` / ink3 `#272727` | `--surface` `#ffffff` / `--surface-muted` `#272727` | none | Same value, now read from the token. |
| `buttonBorder` | gray `#6b6b6b` / gray2 `#8c8c8c` | `--border` `#111111` / `--border` `#fdf8e9` | **light + dark** | Same as appBorderColor: neo ink borders. Light 5.33 to 18.88, dark 4.44 to 14.07. |
| `booleanBg` | cream2 `#f3ecd2` / ink `#111111` | `--surface-muted` `#f3ecd2` / `--color-bg` `#111111` | none | Same value, now read from the token. |
| `booleanSelectedBg` | paper `#ffffff` / ink3 `#272727` | `--surface` `#ffffff` / `--surface-muted` `#272727` | none | Same value, now read from the token. |
| `inputBg` | paper `#ffffff` / ink `#111111` | `--surface` `#ffffff` / `--color-bg` `#111111` | none | Same value, now read from the token. |
| `inputBorder` | gray `#6b6b6b` / gray2 `#8c8c8c` | `--border` `#111111` / `--border` `#fdf8e9` | **light + dark** | Same as appBorderColor: neo ink borders. Light 5.33 to 18.88, dark 5.62 to 17.79. |
| `inputTextColor` | ink `#111111` / cream `#fdf8e9` | `--text` `#111111` / `--text` `#fdf8e9` | none | Same value, now read from the token. |

**Open call for Creatives:** dark `appPreviewBg`. #45 uses paper `#ffffff` in both modes. Neo's dark theme has no semantic token at `#ffffff` that means a background, so the options are:
- **A (in this spec):** `--color-bg` `#111111`, neo's dark page color.
- **B:** keep #45's `#ffffff` via `--highlight-contrast`, which resolves to `#ffffff` in dark but means "text on highlight".

Neither has a contrast pair, because this background only shows behind the preview iframe (axe excludes the iframe, and the gate stays 0 down either way). I recommend A, because B borrows a text token for a background.

Storybook keeps hard-coding the selected sidebar row text as `#FFFFFF`. #45 overrides it to `#111111` in dark only, and this spec sets it from `--accent-contrast` in both modes. Light is `#ffffff`, so nothing changes there; dark is `#111111`, the same as #45 (14.74, not the 15.1 #45's comment says).

CSS custom properties (`manager.ts` sets them on `<html>` from `src/tokens.json` at load and on every mode change; `manager-head.html` uses them, so there are no hex literals in CSS):

| Var | Used for | Token | Light | Dark |
|---|---|---|---|---|
| `--eb-text` | Wordmark text | `--text` | `#111111` | `#fdf8e9` |
| `--eb-border` | Blob outline | `--border` | `#111111` | `#fdf8e9` |
| `--eb-blob` | Blob fill (neo .blob uses --highlight) | `--highlight` | `#c6f432` | `#1f3dff` |
| `--eb-focus` | Brand link focus ring | `--focus-ring-color` | `#e0217a` | `#e0217a` |
| `--eb-selected-text` | Selected sidebar row text and icon (#45 set #111111 in dark only; light stays Storybook's #ffffff) | `--accent-contrast` | `#ffffff` | `#111111` |

## 2. Brand mark (new; #45 kept Storybook's)

- Neo has no SVG logo; `docs/directions/v3/neo` draws it in CSS (`.logo` and `.blob`, index.html:27-28). Per the card, it ships as a text wordmark plus neo's existing blob, with no new logo.
- **Wordmark:** "Ember UI" in `--font-display` (Archivo Black 400), 1.2rem (19.2px), line-height 1, `--text`, no wrap.
- **Blob:** 30x30px, `border-radius: 40% 60% 55% 45%`, fill `--highlight` (light lime `#c6f432`, dark blue `#1f3dff`), 2px `--border` outline. It's `aria-hidden` and decorative. The gap to the wordmark is .45rem.
- **Accessible name:** with `brandImage: null` Storybook renders no `<img>`, so there's no alt attribute; the link's name is its text, "Ember UI". Verified in the build: name "Ember UI", href https://jdilig.me/ux/design-system, target _self.
- **Link target:** at least 44x44px. Measured 219x44 at 1280 in both modes and 208x44 in the 320 drawer. `a:has(> .ember-brand)` replaces Storybook's own brand link styles (margin -3px -4px, a 1px transparent border, 3px radius, and a 1px `colorSecondary` border on focus).
- **Focus ring:** neo's ring, 3px solid `--focus-ring-color` `#e0217a` with a 3px offset and a 12px corner, on `:focus-visible` only. Light is 4.24 vs `#fdf8e9` and 4.20 vs the wordmark; dark is 4.20 vs `#111111` and 4.24 vs the wordmark (3:1 min).

## 3. Contrast and axe

`node docs/storybook-brand/contrast.mjs` uses neo's contrast.mjs math. Text needs 4.5:1 and UI and focus need 3:1, and each pair #45 has must be at or above its #45 ratio (the #45 column comes from `pr45/baseline.json`). "new" marks the brand pairs #45 doesn't have. The hover backgrounds Storybook derives itself (`lighten(.45)` / `darken(.35)` of `colorSecondary`) are computed with the same polished functions @storybook/core uses, for both columns.

Output:
```
52 pairs checked, 0 failures; 46 pairs compared with #45: 11 up, 35 same, 0 down
```
Exit 0. Full table with both columns: [CONTRAST.md](CONTRAST.md).

Negative controls (scratch copies):
- `theme-map.json` and `manager.ts` out of sync: FAIL drift, exit 1.
- `textMutedColor` set to `--accent-soft` in both modes: 2 FAIL rows per mode (4 total), exit 1.
- `textMutedColor` set to `--border-subtle` (5.02 to 5.62, so it clears 4.5 but is under #45's 10.18 to 11.28): 4 "FAIL below #45" rows, exit 1.
- A token that doesn't exist: a FAIL lint line, exit 1, with no stack trace.

axe: #45's `scripts/a11y-manager.mjs` runs on a build of `fix/sb-manager-aa` @ `79f89b7` with `mock/` copied in (light and dark, 1280 and 375, story and docs page). Result: "axe manager: 8 runs (light + dark x 1280/375 x story + docs page), 0 failing", the same as #45.

## 4. Layout per breakpoint

Storybook's layout doesn't change; only the theme and brand do.

| Width | Behavior | Brand |
|---|---|---|
| 320-599 | Storybook's mobile layout: preview full width, and a bottom bar with the menu button and the current story's breadcrumb. The sidebar opens as a full-height drawer from the menu button. | The bottom bar keeps Storybook's breadcrumb, unchanged. The brand is the first item in the drawer, top-left (blob plus wordmark, a 44px tall link), with the settings and close buttons at right. At 320 the link is 208x44 and the wordmark doesn't wrap. Shots: `sb-brand-320-*.png`. |
| 600-1023 | The sidebar starts collapsed (`navSize: 0`); that block from main and #45 is kept verbatim. The toolbar's "Show sidebar" button brings it back. | Hidden while the sidebar is collapsed; with it shown, the same as at 1024+. Shots: `sb-brand-768-*.png`. |
| 1024+ | Sidebar open at Storybook's default width, toolbar on top. | Top-left of the sidebar, a 219x44 link. Shots: `sb-brand-1280-*.png`, with the brand link in its focus-visible state. |

Touch targets: the brand link is at least 44x44 at every width. Storybook's own toolbar buttons are 28x28 (Known issue 3).

## 5. Motion

Nothing new moves. The brand mark doesn't animate, and the focus ring appears instantly.

Storybook 8.6's manager has no `prefers-reduced-motion` handling (#45 didn't add any), so its drawer slide, sidebar and control transitions always run. `manager-head.html` adds a reduce rule that zeroes transition and animation durations and delays. Verified at 1280 in both modes: 29 elements with a transition under no-preference, 0 under reduce.

## 6. Shots (`handoff/`, RGB 8-bit truecolor PNG straight from Chrome, from the #45 + `mock/` build)

| File | What it shows |
|---|---|
| `sb-brand-320-light.png`, `sb-brand-320-dark.png` | Mobile drawer open: 1 the brand link (208x44) with its focus ring, 2 the selected row, 3 the search field |
| `sb-brand-768-light.png`, `sb-brand-768-dark.png` | Collapsed sidebar: 1 the toolbar, 2 Show sidebar (28x28, Known issue 3) |
| `sb-brand-1280-light.png`, `sb-brand-1280-dark.png` | Desktop: 1 the brand link (219x44) with its focus ring, 2 the search field, 3 the selected row, 4 the toolbar |

The annotation boxes (green for targets, purple for color callouts) are an overlay added at capture time, not part of the design. The docs content inside the preview iframe isn't part of this card (Known issue 4).

## 7. For the builder (BED, a new branch off main after #45 merges)

1. Start from #45's merged `.storybook/manager.ts` and `.storybook/manager-head.html`. Make them byte-identical to `docs/storybook-brand/mock/manager.ts` and `mock/manager-head.html`. The change is exactly `mock/manager.ts.diff` and `mock/manager-head.html.diff`. If #45's files changed before it merged, re-run `pr45/extract.mjs` and `contrast.mjs` against the merged copy, and ask me before resolving any difference. Don't change `main.ts`, `preview.tsx`, `scripts/a11y-manager.mjs` or `src/`.
2. **`manager.ts`, against #45's file:**
   - **Kept:** the imports of `addons` and `create` (from `@storybook/theming`), the 600-1023 `navSize: 0` block verbatim and first, and #45's SB-MANAGER-AA comment.
   - **Replaced:** #45's `NEO` hex object, `shared`, and the two `create()` literals become `MAP` (field to `[lightToken, darkToken]`, read from `src/tokens.json` `themes.neo`, an esbuild JSON import) and `build(mode)`, which returns `create({ base, brand…, fonts and radii from themes.neo.shape, ...colors })`. Then `themes = { light: build('light'), dark: build('dark') }`. This also fixes #45's own note that the hexes had to be hand-mirrored.
   - **Added:**
     - the 4 `@fontsource` CSS imports (archivo-black 400, archivo 400 and 700, jetbrains-mono 400). They're already dependencies, used by preview.tsx, and the 8.6 manager build bundles them; verified that "Archivo Black" loads.
     - `CSS_VARS` and `applyVars(mode)`, which set the five `--eb-*` vars on `document.documentElement`.
     - the dark-mode switch: `mq = matchMedia('(prefers-color-scheme: dark)')`. At load it calls `applyVars(mode)` and `addons.setConfig({ theme: themes[mode] })`, which replaces #45's one-shot `prefersDark` line. On `mq`'s `change` event it calls `applyVars(mode)` and `addons.setConfig({ theme: themes[mode] })` again, so the manager re-themes without a reload.
3. **`manager-head.html`, against #45's file:**
   - **Kept:** the title, and #45's selector `#storybook-explorer-tree [data-selected="true"]` (plus its `svg`).
   - **Changed:** that rule's color moves out of the dark-only media query to `var(--eb-selected-text)` in both modes, with `!important`. Light resolves to `#ffffff`, so it's unchanged.
   - **Added:** `.ember-brand`, `.ember-brand__blob`, the `a:has(> .ember-brand)` 44px target and focus ring, and the reduced-motion block.
4. Keep `theme-map.json` and `MAP`/`CSS_VARS` identical, because `contrast.mjs` fails on drift. If the builder adds it to CI, the command is `node docs/storybook-brand/contrast.mjs`.
5. Check the real build:
   - `npm run test:a11y`, including #45's manager axe: 8 runs, 0 failing.
   - The brand shows the blob plus "Ember UI" in Archivo Black.
   - The selected row is white on blue in light and ink on lime in dark.
   - Toggling the OS dark mode re-themes without a reload.
   - Tab reaches the brand link with a pink 3px ring, and the link is 44px tall.
   - At 600-1023 the sidebar starts collapsed.

Reproduce: `bash docs/storybook-brand/mock/build.sh <installed node_modules> [base-ref]`. The base ref defaults to `origin/fix/sb-manager-aa`; use `origin/main` once #45 merges. Serve the printed `out` on 127.0.0.1:8961, then run:
- `node scripts/a11y-manager.mjs http://127.0.0.1:8961` from the scratch dir
- `NODE_PATH=<playwright-core dir> node docs/storybook-brand/shoot.cjs http://127.0.0.1:8961/`

## Known issues (Storybook internals `create()` can't reach; the same under #45; for a Creatives and CA ruling)

1. **Sidebar node-type icons:** Storybook colors them itself: document `#ff8300`, story `#37d5d3`, component `--text-muted` at 60% opacity. On light cream, document is 2.33 and story is 1.70; on dark ink they pass (6.45 to 10.45 measured earlier). Each sits next to a text label that carries the meaning, so they're treated as decorative (1.4.11 doesn't require them), and #45's axe passes with them. They're not in the gate. A fix, if wanted, is one `manager-head.html` rule mapping them to `--text-muted`.
2. **Boolean control (Controls panel, canvas view only):** Storybook hard-codes the unselected label as `textColor` at 50% alpha. Light is `#827f72` on `#f3ecd2`, 3.39 (fails 4.5); dark is `#87857d` on `#111111`, 5.11. The selected segment vs its track is 1.18 in light and 1.26 in dark, where a 1px `appBorderColor` ring (cream on `#272727`, 14.07) marks the selected segment. These are #45's values too (`booleanBg` and `booleanSelectedBg` are unchanged), so this card doesn't make them worse. A fix, if wanted, is a `manager-head.html` override on the unselected span (`color: var(--eb-text)`). Not in the gate.
3. **Toolbar and Show sidebar buttons** are 28x28, Storybook's size. That passes WCAG 2.5.8 AA (24px) but is under neo's 44px `--target-min`. Enlarging them means overriding Storybook's toolbar layout, which is outside this card.
4. **The preview iframe's docs and canvas content** keeps the preview's styling (Ember components plus Storybook's default docs theme, which stays light in dark mode). Theming it is `preview.tsx` `parameters.docs.theme`, a separate card.
