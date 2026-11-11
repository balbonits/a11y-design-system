# STORYBOOK-BRAND: Ember UI Storybook manager branding (HANDOFF)

Status: design spec, dev-ready. The builder implements it as-is. This card changes no `.storybook/` or `src/` file; the exact files to copy are in `mock/`.
Target: the live Storybook at https://jdilig.me/ux/design-system/storybook/ (Storybook 8.6.19, @storybook/core 8.6.19, from package-lock.json on main 1a57bd1).
Identity: Ember's neo theme (`src/tokens.json` `themes.neo`, which equals `docs/directions/v3/neo/tokens.json`). No new colors, fonts or logo.

Files in this folder:
- `mock/manager.ts`, the exact `.storybook/manager.ts` to ship (replaces main's, keeps its navSize rule).
- `mock/manager-head.html`, the exact `.storybook/manager-head.html` to ship (keeps main's title).
- `theme-map.json`, the field-to-token map, the single source the gate reads.
- `contrast.mjs` writes `CONTRAST.md` and exits 1 on any failure, any token that doesn't resolve, or any drift between `mock/manager.ts` and `theme-map.json`.
- `shoot.cjs` and `mock/build.sh` produce the annotated `handoff/` shots from a scratch build.

## 1. Theme spec: `create()` fields, light and dark

Mode follows `prefers-color-scheme` live (section 7). The preview's Mode toolbar (Auto, Light, Dark) still drives only the stories and docs, not the manager; that's intended, since the manager is site chrome.

Fields that are the same in both modes:

| Field | Value | Source |
|---|---|---|
| `base` | `'light'` / `'dark'` | the mode |
| `brandTitle` | `'<span class="ember-brand"><span class="ember-brand__blob" aria-hidden="true"></span>Ember UI</span>'` | neo `.logo` markup (`docs/directions/v3/neo/index.html:135`) minus the version tag |
| `brandUrl` | `'https://jdilig.me/ux/design-system'` | card |
| `brandImage` | `null` (must be null, not undefined) | Storybook 8.6 Brand.tsx: `image === null` renders `brandTitle` as HTML inside the brand link. `undefined` renders the Storybook logo. A string renders an `<img>`, and neo has no SVG logo. |
| `brandTarget` | `'_self'` | card |
| `fontBase` | `'Archivo', system-ui, sans-serif` | `--font-body` |
| `fontCode` | `'JetBrains Mono', ui-monospace, monospace` | `--font-mono` |
| `appBorderRadius` | `12` | `--radius-md` 12px |
| `inputBorderRadius` | `12` | `--radius-md` 12px |

Color fields (token, then resolved hex):

| Field | Used for | Light | Dark |
|---|---|---|---|
| `colorPrimary` | Storybook primary accents | `--accent` `#1f3dff` | `--accent` `#c6f432` |
| `colorSecondary` | Selected sidebar row fill, Storybook focus borders, links, active controls | `--accent` `#1f3dff` | `--accent` `#c6f432` |
| `appBg` | Sidebar and app background | `--color-bg` `#fdf8e9` | `--color-bg` `#111111` |
| `appContentBg` | Panels (addons, docs chrome) | `--surface` `#ffffff` | `--surface` `#1c1c1c` |
| `appPreviewBg` | Canvas behind the preview iframe | `--color-bg` `#fdf8e9` | `--color-bg` `#111111` |
| `appBorderColor` | Sidebar, toolbar and panel dividers | `--border` `#111111` | `--border` `#fdf8e9` |
| `textColor` | Main manager text | `--text` `#111111` | `--text` `#fdf8e9` |
| `textInverseColor` | Text on inverse surfaces (tooltips) | `--color-bg` `#fdf8e9` | `--color-bg` `#111111` |
| `textMutedColor` | Subheadings, secondary text | `--text-muted` `#3d3d3d` | `--text-muted` `#cfc8b0` |
| `barTextColor` | Toolbar icons and labels | `--text-muted` `#3d3d3d` | `--text-muted` `#cfc8b0` |
| `barSelectedColor` | Selected toolbar tab or tool | `--accent` `#1f3dff` | `--accent` `#c6f432` |
| `barHoverColor` | Toolbar hover | `--accent-hover` `#1530d0` | `--accent-hover` `#d7ff5a` |
| `barBg` | Toolbar background | `--surface` `#ffffff` | `--surface` `#1c1c1c` |
| `buttonBg` | Storybook buttons | `--surface` `#ffffff` | `--surface` `#1c1c1c` |
| `buttonBorder` | Storybook button borders | `--border` `#111111` | `--border` `#fdf8e9` |
| `booleanBg` | Boolean control track | `--surface-muted` `#f3ecd2` | `--surface-muted` `#272727` |
| `booleanSelectedBg` | Boolean control selected segment | `--surface` `#ffffff` | `--surface` `#1c1c1c` |
| `inputBg` | Search and control inputs | `--surface` `#ffffff` | `--surface` `#1c1c1c` |
| `inputBorder` | Input borders | `--border` `#111111` | `--border` `#fdf8e9` |
| `inputTextColor` | Input text | `--text` `#111111` | `--text` `#fdf8e9` |

Storybook 8.6's `ThemeVars` also has `buttonBg`, `buttonBorder`, `booleanBg` and `booleanSelectedBg`, which weren't on the card's list. They're mapped above so no Storybook default color leaks through. `gridCellSize` keeps Storybook's default.

Why `colorSecondary` is `--accent`: Storybook fills the selected sidebar row with it and uses it for its own focus borders. Storybook hard-codes the selected row text as `#FFFFFF`, which fails on dark lime (1.28:1). So `manager-head.html` sets the selected row text to neo's `--accent-contrast`, giving neo's own button pair (light white on blue 6.63, dark ink on lime 14.74).

CSS custom properties (`manager.ts` sets them on `<html>` from `src/tokens.json` at load and on every mode change; `manager-head.html` uses them, so there are no hex literals in CSS):

| Var | Used for | Token | Light | Dark |
|---|---|---|---|---|
| `--eb-text` | Wordmark text | `--text` | `#111111` | `#fdf8e9` |
| `--eb-border` | Blob outline | `--border` | `#111111` | `#fdf8e9` |
| `--eb-blob` | Blob fill (neo .blob uses --highlight) | `--highlight` | `#c6f432` | `#1f3dff` |
| `--eb-focus` | Brand link focus ring | `--focus-ring-color` | `#e0217a` | `#e0217a` |
| `--eb-selected-text` | Selected sidebar row text and icon | `--accent-contrast` | `#ffffff` | `#111111` |

## 2. Brand mark

- Neo has no SVG logo; `docs/directions/v3/neo` and the prototype draw the mark in CSS (`.logo` and `.blob`, index.html:27-28). Per the card, it ships as a text wordmark plus neo's existing blob, with no new logo.
- **Wordmark:** "Ember UI" in `--font-display` (Archivo Black 400), 1.2rem (19.2px), line-height 1, `--text`, no wrap.
- **Blob:** 30x30px, `border-radius: 40% 60% 55% 45%`, fill `--highlight` (light lime `#c6f432`, dark blue `#1f3dff`), 2px `--border` outline. It's `aria-hidden` and decorative. The gap to the wordmark is .45rem.
- **Alt and name:** the link's accessible name is its text, "Ember UI" (with `brandImage: null` Storybook renders no `<img>`, so there's no alt attribute to set; the name comes from the text). Verified in the scratch build: name "Ember UI", href https://jdilig.me/ux/design-system, target _self.
- **Link target:** at least 44x44px. Measured 219x44 at 1280 and 208x44 in the 320 drawer. Storybook's own brand link styles (margin -3px -4px, a 1px transparent border, 3px radius, and a 1px `colorSecondary` border on focus) are replaced via `a:has(> .ember-brand)`.
- **Focus ring:** neo's ring, 3px solid `--focus-ring-color` `#e0217a` with a 3px offset and a 12px (`--radius-md`) corner, on `:focus-visible` only. Contrast: light 4.24 vs `#fdf8e9` and 4.20 vs the wordmark, dark 4.20 vs `#111111` and 4.24 vs the wordmark (3:1 min).

## 3. Contrast

The gate runs `node docs/storybook-brand/contrast.mjs` and writes `CONTRAST.md`, using the same luminance and ratio math as `docs/directions/v3/neo/contrast.mjs`. Text needs 4.5:1, UI and focus need 3:1. Hover backgrounds Storybook derives itself (`lighten(.45)` / `darken(.35)` of `colorSecondary`) are computed with the same polished functions @storybook/core uses, and match the scratch build's computed styles (light `#ffffff`, dark `#556e06`).

Output:
```
52 pairs checked, 0 failures
```
Exit 0. Full table: [CONTRAST.md](CONTRAST.md).

Negative controls (scratch copies):
- `theme-map.json` and `manager.ts` out of sync: FAIL drift, exit 1.
- `textMutedColor` set to `--accent-soft`: 2 FAIL rows, exit 1.
- A token that doesn't exist: a FAIL lint line, exit 1, with no stack trace.

## 4. Layout per breakpoint

Storybook's layout itself doesn't change; only the theme and brand do.

| Width | Behavior | Brand |
|---|---|---|
| 320-599 | Storybook's mobile layout: preview full width, bottom bar with the menu button and the current story's breadcrumb, and the sidebar opens as a full-height drawer from the menu button. | Not in the bottom bar (Storybook shows the breadcrumb there; unchanged). It's the first item in the drawer, top-left: blob plus wordmark, a 44px tall link, and the settings and close buttons at right. At 320 the link is 208x44 and the wordmark doesn't wrap (`white-space: nowrap`). Shots: `sb-brand-320-*.png`. |
| 600-1023 | Sidebar starts collapsed (`navSize: 0`), unchanged from main's `manager.ts`, which this keeps verbatim. The toolbar's "Show sidebar" button brings it back. | Hidden while collapsed. With the sidebar shown, it's as at 1024+. Shots: `sb-brand-768-*.png`. |
| 1024+ | Sidebar open at Storybook's default width; toolbar on top. | Top-left of the sidebar, 219x44 link. Shots: `sb-brand-1280-*.png`, with the brand link shown in its focus-visible state. |

Touch targets: the brand link is at least 44x44 at every width. Storybook's own toolbar buttons are 28x28 (Known issue 3).

## 5. Motion

Nothing beyond Storybook's defaults: the brand mark doesn't animate, and there are no transitions on the link besides the focus ring, which appears instantly.

Storybook 8.6's manager has no `prefers-reduced-motion` handling. Its mobile drawer slide, sidebar and control transitions all run regardless. `manager-head.html` adds a reduce rule that zeroes transition and animation duration and delay. Verified in the scratch build at 320: 7 elements with transitions (0.15s) under no-preference, 0 under reduce.

## 6. Shots (`handoff/`, RGB truecolor PNG straight from Chrome, no re-save)

| File | What it shows |
|---|---|
| `sb-brand-320-light.png`, `sb-brand-320-dark.png` | Mobile drawer open: 1 brand link 208x44 with its focus ring, 2 the selected row, 3 the search field |
| `sb-brand-768-light.png`, `sb-brand-768-dark.png` | Collapsed sidebar: 1 the toolbar, 2 Show sidebar (28x28, Known issue 3) |
| `sb-brand-1280-light.png`, `sb-brand-1280-dark.png` | Desktop: 1 brand link 219x44 with its focus ring, 2 the search field, 3 the selected row, 4 the toolbar |

Annotation boxes (green for targets, purple for color callouts) are an overlay added at capture time, not part of the design. The docs content inside the preview iframe isn't part of this card (Known issue 4).

## 7. For the builder

1. Copy `docs/storybook-brand/mock/manager.ts` to `.storybook/manager.ts` and `docs/storybook-brand/mock/manager-head.html` to `.storybook/manager-head.html`, byte for byte. Don't change `main.ts`, `preview.tsx` or `src/`.
2. The code shape (in `mock/manager.ts`):
   - `MAP` gives each field its `[lightToken, darkToken]`, resolved from `src/tokens.json` `themes.neo` (an esbuild JSON import), so a token change flows through with no edit here.
   - `build(mode)` returns `create({ base, brand…, fonts and radii from themes.neo.shape, ...colors })`, and `themes = { light: build('light'), dark: build('dark') }`.
   - Dark-mode switch: `matchMedia('(prefers-color-scheme: dark)')` picks the theme at load: `addons.setConfig({ theme: themes[mode], ...navSize rule })`. On its `change` event it calls `applyVars(mode)` and `addons.setConfig({ theme: themes[mode] })`, so the manager re-themes live without a reload.
   - `applyVars(mode)` sets the five `--eb-*` vars on `document.documentElement`.
   - Fonts: `manager.ts` imports `@fontsource/archivo-black/400.css`, `archivo/400.css`, `archivo/700.css` and `jetbrains-mono/400.css`. These are already dependencies (used by preview.tsx), and the 8.6 manager build bundles them (`sb-addons/…/manager-bundle.css`; verified: "Archivo Black" loaded).
3. Keep `theme-map.json` and `MAP`/`CSS_VARS` in `manager.ts` identical. `contrast.mjs` fails on drift. If the builder adds a CI step, it's `node docs/storybook-brand/contrast.mjs`.
4. Check in a real build (`npm run build`, or `storybook dev`):
   - the brand shows blob plus "Ember UI" in Archivo Black;
   - the selected row is blue with white text (light) or lime with ink text (dark);
   - toggling the OS dark mode re-themes without a reload;
   - Tab reaches the brand link with a pink 3px ring;
   - the brand link is 44px tall;
   - at 600-1023 the sidebar starts collapsed.

Reproduce the shots: `bash docs/storybook-brand/mock/build.sh <installed node_modules>`, serve the printed `out` on 127.0.0.1:8961, then `NODE_PATH=<playwright-core dir> node docs/storybook-brand/shoot.cjs http://127.0.0.1:8961/`.

## Known issues (Storybook internals the `create()` API can't reach; for a Chief of Creatives and CA ruling)

1. **Sidebar node-type icons:** Storybook colors them itself. Document icons are `#ff8300`, story icons `#37d5d3`, component icons `--text-muted` at 60% opacity. On light cream: document 2.33, story 1.70. On dark ink they all pass (6.45 to 10.45 as measured in the scratch build). Each sits next to a text label that carries the meaning, so they're treated as decorative (1.4.11 doesn't require them), and they're not in the gate. A fix, if wanted, is one CSS rule in `manager-head.html` mapping them to `--text-muted`.
2. **Boolean control (Controls panel, canvas view only):** the unselected label is `defaultText` at 50% alpha, which Storybook hard-codes: light 3.39 (fails 4.5), dark 4.67. In light, the selected segment against its track is 1.18. Dark adds a 1px `appBorderColor` ring (14.07), light only a faint shadow. No `booleanBg`/`booleanSelectedBg` choice from neo's tokens fixes both, because the label alpha is fixed. A fix, if wanted, is a `manager-head.html` override on the addon-controls Label (unselected span `color: var(--eb-text)` plus a 2px `--border` ring on the selected span). Not in the gate.
3. **Toolbar and Show sidebar buttons** are 28x28 (Storybook's size). That passes WCAG 2.5.8 AA (24px), but it's under neo's 44px `--target-min`. Enlarging them means overriding Storybook's toolbar layout, which is outside this card.
4. **The docs and canvas content in the preview iframe** keep the preview's current styling (Ember components plus Storybook's default docs theme, which stays light in dark mode at 768 and 1280). Theming the preview's docs is `preview.tsx` `parameters.docs.theme`, a separate card.
