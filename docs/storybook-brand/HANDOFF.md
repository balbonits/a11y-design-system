# STORYBOOK-BRAND: Ember UI Storybook manager branding (HANDOFF, extends #45)

Status: design spec, dev-ready. The builder implements it as-is. This card changes no `.storybook/` or `src/` file.

**Extends #45, doesn't compete with it.** [#45](https://github.com/balbonits/a11y-design-system/pull/45) (SB-MANAGER-AA, `fix/sb-manager-aa` @ `79f89b7`) already gives the manager an accessible neo-palette theme and runs axe on the manager page. This HANDOFF is a diff on top of #45:
- The builder starts from #45's `.storybook/manager.ts` and `manager-head.html` on a new branch off main after #45 merges.
- Every #45 contrast pass stays at or above its #45 ratio. The gate checks this pair by pair: 48 shared pairs, 13 up, 35 the same, 0 down.
- #45's own axe check (`scripts/a11y-manager.mjs`) runs against this spec built on #45: 8 runs, 0 failing (section 3).
- Revision 3 (`e7ba6ca`, superseding `f679274` and `1845ea6`): the boolean-control label fix (Known issue 2, now fixed and gated), the 44px hit areas below 600px (FU-SB-TOOLBAR-44, section 4a, which folds into this card), and the rulings on Known issues 1, 3 and 4.
- Revision 4 (this commit, superseding `e7ba6ca`): two defects in revision 3's hit areas, found with new `elementFromPoint` probes, are fixed. Storybook's buttons are `overflow: hidden`, which clipped the overlay so the 44px areas weren't tappable, and the addon panel content covered the bottom 8px of its 48px bar. Revision 4 also adds Creatives' toolbar scroll affordance and records Creatives' `appPreviewBg` ruling (section 4a).

Target: the live Storybook at https://jdilig.me/ux/design-system/storybook/ (Storybook 8.6.19, @storybook/core 8.6.19).
**Version pin.** The `manager-head.html` overrides target Storybook 8.6.19's internal markup and selectors (the selected tree row, the boolean control's spans, the toolbar and drawer controls' `title` attributes, `.sb-bar` and `.sidebar-header`). `package.json` has `"storybook": "^8.6.19"` and the installed version is 8.6.19 (`@storybook/addon-controls` 8.6.14). Any Storybook bump must re-run, before merge: the contrast gate (`contrast.mjs`, 66 pairs today; the count grows as pairs are added), both override checks (`overrides.cjs`: the selected-row and boolean-label colors, the hit areas with their `elementFromPoint` probes, and the toolbar scroll affordance), and #45's manager axe (`scripts/a11y-manager.mjs`).

Identity: Ember's neo theme (`src/tokens.json` `themes.neo`, the same values as `src/themes/neo.css` that #45 mirrors). No new colors, fonts or logo.

Files in this folder:
- `pr45/manager.ts` and `pr45/manager-head.html` are verbatim copies of #45's files at `79f89b7`, the base of this diff.
- `pr45/extract.mjs` reads `pr45/manager.ts` and writes `pr45/baseline.json`, #45's resolved values per field.
- `mock/manager.ts` and `mock/manager-head.html` are the exact files to ship (#45's files plus this card).
- `mock/manager.ts.diff` and `mock/manager-head.html.diff` are unified diffs from #45's files.
- `theme-map.json` is the field-to-token map, the single source the gate reads.
- `overrides.cjs` checks the `manager-head.html` overrides in a real build and exits 1 on any failure: the selected-row text, the boolean-control labels in both states and both modes, and section 4a's hit areas (geometry plus `elementFromPoint` probes), focus rings, scroll affordance (real pixels) and no-change-at-600.
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
| `appPreviewBg` | paper `#ffffff` / paper `#ffffff` | `--surface` `#ffffff` / `--color-bg` `#111111` | **dark** | Dark: neo's dark page color. No dark neo token is #ffffff (paper is only `--highlight-contrast` there, which means text on blue). There's no contrast pair, since this only shows behind the preview iframe. Creatives picked this (see the ruling below). |
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

**Ruled by Creatives (2026-11-11): option A.** Dark `appPreviewBg`. #45 uses paper `#ffffff` in both modes. Neo's dark theme has no semantic token at `#ffffff` that means a background, so the options are:
- **A (in this spec):** `--color-bg` `#111111`, neo's dark page color.
- **B:** keep #45's `#ffffff` via `--highlight-contrast`, which resolves to `#ffffff` in dark but means "text on highlight".

Neither has a contrast pair, because this background only shows behind the preview iframe (axe excludes the iframe, and the gate stays 0 down either way). I recommend A, because B borrows a text token for a background. Chief Architect ruled that this doesn't block the card and needs no contrast pair, since it's a canvas behind stories that set their own background; Creatives picked A, because using a text token for a background is wrong. The spec ships A.

Storybook keeps hard-coding the selected sidebar row text as `#FFFFFF`. #45 overrides it to `#111111` in dark only, and this spec sets it from `--accent-contrast` in both modes. Light is `#ffffff`, so nothing changes there; dark is `#111111`, the same as #45 (14.74, not the 15.1 #45's comment says).

CSS custom properties (`manager.ts` sets them on `<html>` from `src/tokens.json` at load and on every mode change; `manager-head.html` uses them, so there are no hex literals in CSS):

| Var | Used for | Token | Light | Dark |
|---|---|---|---|---|
| `--eb-text` | Wordmark text | `--text` | `#111111` | `#fdf8e9` |
| `--eb-border` | Blob outline | `--border` | `#111111` | `#fdf8e9` |
| `--eb-blob` | Blob fill (neo .blob uses --highlight) | `--highlight` | `#c6f432` | `#1f3dff` |
| `--eb-focus` | Brand link focus ring | `--focus-ring-color` | `#e0217a` | `#e0217a` |
| `--eb-selected-text` | Selected sidebar row text and icon (#45 set #111111 in dark only; light stays Storybook's #ffffff) | `--accent-contrast` | `#ffffff` | `#111111` |
| `--eb-boolean-label` | Boolean control's unselected label (Known issue 2; #45 kept Storybook's 50% `textColor`) | `--text-muted` | `#3d3d3d` | `#cfc8b0` |
| `--eb-surface` | Toolbar background below 600px, and the covers that hide the scroll shade at an end the bar is scrolled to (equals `barBg`) | `--surface` | `#ffffff` | `#1c1c1c` |
| `--eb-surface-muted` | Toolbar scroll shade below 600px (section 4a) | `--surface-muted` | `#f3ecd2` | `#272727` |

## 2. Brand mark (new; #45 kept Storybook's)

- Neo has no SVG logo; `docs/directions/v3/neo` draws it in CSS (`.logo` and `.blob`, index.html:27-28). Per the card, it ships as a text wordmark plus neo's existing blob, with no new logo.
- **Wordmark:** "Ember UI" in `--font-display` (Archivo Black 400), 1.2rem (19.2px), line-height 1, `--text`, no wrap.
- **Blob:** 30x30px, `border-radius: 40% 60% 55% 45%`, fill `--highlight` (light lime `#c6f432`, dark blue `#1f3dff`), 2px `--border` outline. It's `aria-hidden` and decorative. The gap to the wordmark is .45rem.
- **Accessible name:** with `brandImage: null` Storybook renders no `<img>`, so there's no alt attribute; the link's name is its text, "Ember UI". Verified in the build: name "Ember UI", href https://jdilig.me/ux/design-system, target _self.
- **Link target:** at least 44x44px. Measured 219x44 at 1280 in both modes and 176x44 in the 320 drawer. `a:has(> .ember-brand)` replaces Storybook's own brand link styles (margin -3px -4px, a 1px transparent border, 3px radius, and a 1px `colorSecondary` border on focus).
- **Focus ring:** neo's ring, 3px solid `--focus-ring-color` `#e0217a` with a 3px offset and a 12px corner, on `:focus-visible` only. Light is 4.24 vs `#fdf8e9` and 4.20 vs the wordmark; dark is 4.20 vs `#111111` and 4.24 vs the wordmark (3:1 min).

## 3. Contrast and axe

`node docs/storybook-brand/contrast.mjs` uses neo's contrast.mjs math. Text needs 4.5:1 and UI and focus need 3:1, and each pair #45 has must be at or above its #45 ratio (the #45 column comes from `pr45/baseline.json`). "new" marks the brand pairs #45 doesn't have. The hover backgrounds Storybook derives itself (`lighten(.45)` / `darken(.35)` of `colorSecondary`) are computed with the same polished functions @storybook/core uses, for both columns.

Output:
```
66 pairs checked, 0 failures; 48 pairs compared with #45: 13 up, 35 same, 0 down
```
Exit 0. Full table with both columns: [CONTRAST.md](CONTRAST.md).

New in revision 3 (4 pairs, 2 per mode):

| Mode | Pair | #45 | New |
|---|---|---|---|
| light | Boolean unselected label, `--eb-boolean-label` `#3d3d3d` on `booleanBg` `#f3ecd2` | 3.39 (50% `#111111` composited, `#827f72`) | 9.18, pass, up |
| dark | Boolean unselected label, `--eb-boolean-label` `#cfc8b0` on `booleanBg` `#111111` | 5.11 (50% `#fdf8e9` composited, `#87857d`) | 11.28, pass, up |
| light | Toolbar control focus ring below 600px, `--eb-focus` `#e0217a` on `barBg` `#ffffff` | new | 4.50, pass |
| dark | Toolbar control focus ring below 600px, `--eb-focus` `#e0217a` on `barBg` `#1c1c1c` | new | 3.79, pass |

New in revision 4 (the toolbar scroll affordance, section 4a; 10 pairs, 5 per mode, all new):

| Pair | Light | Dark |
|---|---|---|
| Toolbar labels and icons over the shade, `barTextColor` on `--eb-surface-muted` (4.5) | `#3d3d3d` on `#f3ecd2` 9.18 | `#cfc8b0` on `#272727` 8.92 |
| Selected toolbar tool over the shade, `barSelectedColor` on `--eb-surface-muted` (4.5) | `#1530d0` on `#f3ecd2` 7.50 | `#c6f432` on `#272727` 11.66 |
| Focus ring over the shade, `--eb-focus` on `--eb-surface-muted` (3) | 3.80 | 3.32 |
| Focus ring over the edge rule, `--eb-focus` on `--eb-border` (3) | 4.20 (on `#111111`) | 4.24 (on `#fdf8e9`) |
| Edge rule, `--eb-border` on `barBg` (3) | 18.88 | 16.05 |

The boolean selected label was already in the gate and keeps Storybook's `textColor` (no override): 18.88 light (`#111111` on `#ffffff`) and 14.07 dark (`#fdf8e9` on `#272727`), the same as #45.

Measured in the real build (`overrides.cjs`, Button "Disabled" story, Controls panel, 1280, with the control in both states): light unselected `#3d3d3d` on `#f3ecd2` 9.18 and selected `#111111` on `#ffffff` 18.88; dark unselected `#cfc8b0` on `#111111` 11.28 and selected `#fdf8e9` on `#272727` 14.07. These match the gate.

`overrides.cjs` result on the #45 + `mock/` build: "all override checks pass", exit 0 (154 checks).

The same `overrides.cjs` against a build of revision 3 (`e7ba6ca`): exit 1, 44 failures. 36 are `elementFromPoint` probes: 18 controls at each of 320 and 599, where only the centre point hits and the 1px-inside edge and corner points hit the bar instead (only the menu button, which was already `overflow: visible`, passes). The other 8 are the six scroll-affordance pixel checks and the two addon-content checks (content at 411, under the 419 bar bottom). Revision 3's geometry-only check had passed these.

Negative controls (scratch copies):
- `theme-map.json` and `manager.ts` out of sync: FAIL drift, exit 1.
- `textMutedColor` set to `--accent-soft` in both modes: 2 FAIL rows per mode (4 total), exit 1.
- `textMutedColor` set to `--border-subtle` (5.02 to 5.62, so it clears 4.5 but is under #45's 10.18 to 11.28): 4 "FAIL below #45" rows, exit 1.
- A token that doesn't exist: a FAIL lint line, exit 1, with no stack trace.
- `overrides.cjs` against a copy of the build with the boolean override and the below-600 block removed: exit 1. The 4 boolean rows fail at exactly #45's values (`#827f72` on `#f3ecd2` 3.39 light, `#87857d` on `#111111` 5.11 dark), and every below-600 bar, hit-area, probe and scroll-affordance row fails (132 failures in total).

axe: #45's `scripts/a11y-manager.mjs` runs on a build of `fix/sb-manager-aa` @ `79f89b7` with `mock/` copied in (light and dark, 1280 and 375, story and docs page). Result: "axe manager: 8 runs (light + dark x 1280/375 x story + docs page), 0 failing", the same as #45.

## 4. Layout per breakpoint

Storybook's layout doesn't change; only the theme and brand do.

| Width | Behavior | Brand |
|---|---|---|
| 320-599 | Storybook's mobile layout: preview full width, and a bottom bar with the menu button and the current story's breadcrumb. The sidebar opens as a full-height drawer from the menu button. | The bottom bar keeps Storybook's breadcrumb, unchanged. The brand is the first item in the drawer, top-left (blob plus wordmark, a 44px tall link), with the settings and close buttons at right. At 320 the link is 176x44 (the 44px hit areas of the settings and close buttons, section 4a, take 32px more of the header) and the wordmark doesn't wrap. Shots: `sb-brand-320-*.png`. |
| 600-1023 | The sidebar starts collapsed (`navSize: 0`); that block from main and #45 is kept verbatim. The toolbar's "Show sidebar" button brings it back. | Hidden while the sidebar is collapsed; with it shown, the same as at 1024+. Shots: `sb-brand-768-*.png`. |
| 1024+ | Sidebar open at Storybook's default width, toolbar on top. | Top-left of the sidebar, a 219x44 link. Shots: `sb-brand-1280-*.png`, with the brand link in its focus-visible state. |

Touch targets: the brand link is at least 44x44 at every width. Below 600px every toolbar, bottom-bar, drawer-header and addon-panel control gets a 44x44 hit area (section 4a). At 600 and up Storybook's controls stay 28x28 (Known issue 3, waived there).

## 4a. 44px hit areas below 600px (FU-SB-TOOLBAR-44, folded into this card)

Scope: 44x44 hit areas at widths up to 599px only. At 600px and up nothing changes: the toolbar stays Storybook's 28px controls in a 40px bar, which passes WCAG 2.5.8 AA (24px), and Chief Architect waived neo's 44px there (Known issue 3). The visual size of every control stays the same at every width.

Controls present below 600 in Storybook 8.6.19 (measured in this build at 320 and 599). None has a role or `aria-label`; each has a `title`, which the selectors use:

| Where | Control (`title`) | Visual | Hit area | Method |
|---|---|---|---|---|
| Top toolbar (`main > .sb-bar`, scrolls sideways) | Remount component, Zoom in, Zoom out, Reset zoom, Change the background of the preview, Apply a grid to the preview, Change the size of the preview, Enable measure, Apply outlines to the preview, Vision simulator, Select CSS pseudo states, Open canvas in new tab (a link), Copy canvas link | 28x28 | 44x44 | `::before` overlay, `inset: -8px`, plus `margin-inline: 8px` and `overflow: visible` |
| Top toolbar | Theme ("Neo"), Color mode ("Auto (system)") | 60x28, 116x28 | 76x44, 132x44 | the same overlay; only the height needed it |
| Bottom bar (`.sb-bar` holding the menu button) | Open navigation menu (the drawer toggle, with the breadcrumb) | 216x40 | 216x44 | `::before` overlay, `inset: -2px 0` (it was `position: static`, so it gets `position: relative`) |
| Bottom bar | Open addon panel | 28x28 | 44x44 | `::before` overlay, `inset: -8px`, plus `margin-inline: 8px` and `overflow: visible` |
| Drawer header (`.sidebar-header`) | About Storybook, Close menu | 28x28 | 44x44 | the same as the 28px toolbar controls |
| Addon panel bar (`.sb-bar` holding the Close button) | Close addon panel | 28x28 | 44x44 | the same |

Not present below 600: Show sidebar and Go full screen (Storybook only renders them at 600 and up), so they keep 28px with the rest of the desktop toolbar.

Why a `::before` overlay, and not the other two methods:
- **min-size** would grow the button box itself, and Storybook paints the hover and active chip on that box, so the visible chip would grow from 28 to 44. That changes the visual size.
- **Padding with a negative margin** keeps the layout box the same, but the controls sit on a 34px pitch (28px plus a 6px gap), so 44px areas would overlap their neighbours, and an overlapping area makes a tap ambiguous.
- **The overlay** paints nothing and is part of the button for hit-testing, so a tap anywhere in the 44px square activates that control. In 8.6.19 none of these controls has a `::before` or `::after`, and all except the menu button are already `position: relative`. The 8px side margins move the pitch to 50px or more (Storybook's separators add space), so each 44x44 area has at least 6px of clear space to the next and neighbouring areas never overlap. The controls themselves stay 28px visually and widths aren't clamped.
- **`overflow: visible` is required (revision 4).** Storybook 8.6.19's IconButton is `overflow: hidden`, which clips the overlay to the 28px box, so revision 3's 44px areas were drawn but not tappable: `elementFromPoint` 1px inside the 44px edge returned the bar, not the button. Below 600 these controls get `overflow: visible !important`. Their own content fits the 28px box (`overrides.cjs` checks `scrollWidth` and `scrollHeight` against the client size with every `::before` removed), so no pixel of the controls changes.

Bars: the top bar scrolls sideways (`overflow-x: auto`, so `overflow-y` computes to `hidden`) and the addon panel bar is `overflow: hidden`, so a 44px overlay would be clipped in their 40px. Below 600 both bars, and the bottom bar for consistency, become 48px (`box-sizing: border-box`, plus 4px top and bottom padding on the top and addon bars to center the 40px content row). The preview gets 8px shorter at the top and the bottom; nothing reflows sideways and nothing clips. The top toolbar's scroll width goes from 680 to 920px, which it already scrolls.

Addon panel content (revision 4): in 8.6.19 the content under the addon bar is `position: absolute; top: 40px; height: calc(100% - 40px)`, so in revision 3 it covered the bottom 8px of the 48px bar and of the Close button's hit area. Below 600 it becomes `top: 48px; height: calc(100% - 48px)` (selector `.sb-bar:has(button[title="Close addon panel"]) + div`). `overrides.cjs` checks that the content starts at the bar's bottom edge and still ends at the panel's bottom.

Scroll affordance (Creatives, revision 4): the top toolbar scrolls sideways more than before, so off-screen tools have to be discoverable. Each edge that has tools past it shows a 3px `--eb-border` rule plus a `--eb-surface-muted` shade fading to transparent over 16px. An edge with nothing past it shows plain `--eb-surface`: at scroll start only the right edge is marked, in the middle both are, and at the end only the left is. It's all one multi-layer background on `main > .sb-bar`. The two shade layers use `background-attachment: scroll`, so they stay at the bar's edges. Two `--eb-surface` covers, solid for 16px and then fading out by 24px, use `local`, so they ride with the content and hide the shade at whichever end is reached. Because it's the bar's background, it sits under the controls: no control, label or focus ring is covered and no tap is intercepted. It uses neo tokens only (two new vars, section 1), and the contrast of everything that can sit over it is gated (section 3). There's no motion, since the shade follows the scroll position directly. This applies only to the top toolbar; the bottom bar doesn't scroll, and the addon tab row doesn't scroll either (FU-SB-PANEL-TABS-44, below).

Focus ring: neo's `--focus-ring-color` (via `--eb-focus`), 3px solid, an outer offset of 2px, on `:focus-visible`. On `barBg` it's 4.50 light and 3.79 dark, over the scroll shade 3.80 and 3.32, and over the edge rule 4.20 and 4.24 (3:1 or better, all in the gate). Ring plus offset is 5px, so a 28px control's ring is 38px tall and fits inside the 48px bar and the 44px drawer header. The 40px menu button uses offset 0 (a 46px ring in a 48px bar), so it isn't clipped either.

Verified by `overrides.cjs` at 320 and 599, and the same script is VQA's check on BED's build:
- **Geometry:** every control above has a hit area of at least 44x44 inside its bar or header, with no overlap between neighbours; every focus ring is `:focus-visible`, solid `#e0217a`, and unclipped; and there's no page-level sideways overflow.
- **`elementFromPoint` probes:** for every control, the bar is scrolled so its 44x44 box is fully in view. Then the centre, the four edge midpoints and the four corners, each 1px inside the box, must all resolve to that control (`elementFromPoint(x, y).closest('button, a')`). For the toolbar and bottom-bar controls, a point 1px outside the box's left and right edges must not.
- **Scroll affordance:** real screen pixels 2px below the top bar's top edge and 1px in from each side, with the bar scrolled to the start, the middle and the end. Each must be `--eb-border` where tools are off-screen and `--eb-surface` where none are.
- **Content fit:** with every `::before` removed, each control's content fits its own box, so `overflow: visible` changes nothing visible. At 600 and 1280 every bar is 40px with 28px controls and no overlay. #45's axe at 375 (story and docs page, both modes) still passes.

Selectors: Storybook 8.6.19 has no `[role=toolbar]` and no `aria-label` on these controls, so role and aria selectors aren't available. The spec uses `title` attributes, plus `.sb-bar` and `.sidebar-header`, which are Storybook's stable unhashed class names. It never uses the hashed `css-*` classes. All of it is pinned to 8.6.19 (see the version pin at the top).

**Addon panel tabs, FU-SB-PANEL-TABS-44 (specced from BED's spike, `/workspace/bed/.scratch/bed/sbtabs/REPORT.md`).** The tabs (Controls, Actions, Accessibility, and the "Addons" overflow menu that Storybook collapses tabs into from measured widths in JS) stay 40px visually and get a 44px-tall hit area below 600:

| Rule (inside the existing `@media (max-width: 599px)` block, marked `PANEL-TABS-44 start` and `end`) | Why |
|---|---|
| `.sb-bar:has(button[title="Close addon panel"]) [role="tablist"] { box-sizing: border-box; height: 48px; padding-block: 4px; margin-block: -4px; }` | A 48px row so the overlays aren't clipped by the tablist's `overflow: hidden`. **Block only:** `margin: -4px 0` would also zero Storybook's horizontal margin and move the tablist (BED measured x 0 to 3, width 236 to 233). |
| `... [role="tablist"] .tabbutton { position: relative; overflow: visible; }` | The overlay's containing block, and not clipped by the tab. |
| `... [role="tablist"] .tabbutton::before { content: ""; position: absolute; inset: -5px 0; }` | `.tabbutton` has 3px transparent top and bottom borders, and an absolute overlay is measured from the padding box, so `-2px` would end 1px inside the border box (no growth). `-5px` puts it 2px outside the 40px border box: 44px. Full tab width, so neighbouring tabs' areas touch but never overlap. |

The addon content's `top: 48px` (revision 4, above) is what keeps the bottom 4px of these areas and the active tab's 3px underline uncovered. Below 600 in #52 as-shipped the content covered that underline; with both rules it's visible again (shots). Tabs that Storybook collapses into "Addons" are `visibility: hidden`, so their overlay is hidden too and takes no taps. At 600 and up nothing applies.

Verified by `panel-tabs.cjs` (light and dark, 320, 599, 600). It loads the build twice, once as served and once with the `PANEL-TABS-44` block stripped (what main renders), and compares:
- **Collapse unchanged:** the visible tab set equals the baseline and the 8.6.19 pin (320: Controls, Addons; 599: Controls, Actions, Accessibility), including after resizing 320 to 599 to 320. Every tab's width and visibility, and the tablist's x and width, equal the baseline. Tabs stay 40px; the tablist goes from 40 to 48.
- **Hits:** `elementFromPoint` at 1.5px above the tab, 0.5px inside its top, the centre row, 0.5px inside its bottom and 1.5px below it, each at left, centre and right: 15/15 on every visible tab, 0 on every hidden tab.
- **DOM pin (8.6.19):** the addon content is the addon bar's next element sibling and its only `div` sibling, `position: absolute`, starting at the bar's bottom (48px). If Storybook changes that structure the check fails and the selector (main uses `+ div`; BED's `~ div` is equivalent only while this holds) has to be re-specced. At 600 the addon bar is 40px with no `::before`.
- No page-level sideways overflow.

Results: as served, **88 pass, 0 fail** (`results/panel-tabs-new.txt`). Negative control `--strip`: **14 fail** (`results/panel-tabs-strip.txt`): every visible tab misses (6 to 9 of 15 hits) and the tablist stays 40px, while collapse and geometry still match. `overrides.cjs` on the same build: all checks pass. Shots: `sb-panel-tabs-{320,599}-{light,dark}.png` (dashed = each visible tab's 44px area).

Builder (BED): the three rules are in `mock/manager-head.html` between the `PANEL-TABS-44` comments; build with `mock/build.sh <node_modules> origin/main`, then `node docs/storybook-brand/panel-tabs.cjs <url>` (exit 0) and `--strip` (exit 1).

- **The drawer's search field** (28px tall) and **sidebar tree rows**, and the Controls panel's own inputs, aren't toolbar controls and aren't in this card. They'd go in a separate follow-up if wanted.

## 5. Motion

Nothing new moves. The brand mark doesn't animate, and the focus ring appears instantly.

Storybook 8.6's manager has no `prefers-reduced-motion` handling (#45 didn't add any), so its drawer slide, sidebar and control transitions always run. `manager-head.html` adds a reduce rule that zeroes transition and animation durations and delays. Verified at 1280 in both modes: 29 elements with a transition under no-preference, 0 under reduce.

## 6. Shots (`handoff/`, RGB 8-bit truecolor PNG straight from Chrome, from the #45 + `mock/` build)

| File | What it shows |
|---|---|
| `sb-brand-320-light.png`, `sb-brand-320-dark.png` | Mobile drawer open: 1 the brand link (176x44) with its focus ring, 2 the selected row, 3 the search field |
| `sb-brand-768-light.png`, `sb-brand-768-dark.png` | Collapsed sidebar: 1 the toolbar, 2 Show sidebar (28x28, unchanged at 600 and up, Known issue 3) |
| `sb-brand-1280-light.png`, `sb-brand-1280-dark.png` | Desktop: 1 the brand link (219x44) with its focus ring, 2 the search field, 3 the selected row, 4 the toolbar |
| `sb-toolbar-hit-320-light.png`, `sb-toolbar-hit-320-dark.png`, `sb-toolbar-hit-599-light.png`, `sb-toolbar-hit-599-dark.png` | Section 4a, story view: dashed green boxes are each control's 44px hit area in the 48px top and bottom bars, on a 50px or wider pitch; 1 Zoom in with its focus ring; 2 the bars, 48px; 3 the scroll affordance at the right edge (the toolbar is at its scroll start) |
| `sb-toolbar-hit-320-drawer-light.png`, `sb-toolbar-hit-599-drawer-light.png` | Section 4a, drawer open: 1 About Storybook and Close menu with 44x44 hit areas |
| `sb-toolbar-hit-320-addons-light.png`, `sb-toolbar-hit-599-addons-light.png` | Section 4a, addon panel open: 1 the 48px addon bar with Close addon panel at 44x44 and the content starting under it; the tabs stay 40px visually; their 44px areas are in `sb-panel-tabs-*.png` (FU-SB-PANEL-TABS-44) |

The annotation boxes (green for targets and hit areas, purple for color callouts) are an overlay added at capture time, not part of the design. The docs content inside the preview iframe isn't part of this card (Known issue 4).

## 7. For the builder (BED, a new branch off main after #45 merges)

1. Start from #45's merged `.storybook/manager.ts` and `.storybook/manager-head.html`. Make them byte-identical to `docs/storybook-brand/mock/manager.ts` and `mock/manager-head.html`. The change is exactly `mock/manager.ts.diff` and `mock/manager-head.html.diff`. If #45's files changed before it merged, re-run `pr45/extract.mjs` and `contrast.mjs` against the merged copy, and ask me before resolving any difference. Don't change `main.ts`, `preview.tsx`, `scripts/a11y-manager.mjs` or `src/`.
2. **`manager.ts`, against #45's file:**
   - **Kept:** the imports of `addons` and `create` (from `@storybook/theming`), the 600-1023 `navSize: 0` block verbatim and first, and #45's SB-MANAGER-AA comment.
   - **Replaced:** #45's `NEO` hex object, `shared`, and the two `create()` literals become `MAP` (field to `[lightToken, darkToken]`, read from `src/tokens.json` `themes.neo`, an esbuild JSON import) and `build(mode)`, which returns `create({ base, brand…, fonts and radii from themes.neo.shape, ...colors })`. Then `themes = { light: build('light'), dark: build('dark') }`. This also fixes #45's own note that the hexes had to be hand-mirrored.
   - **Added:**
     - the 4 `@fontsource` CSS imports (archivo-black 400, archivo 400 and 700, jetbrains-mono 400). They're already dependencies, used by preview.tsx, and the 8.6 manager build bundles them; verified that "Archivo Black" loads.
     - `CSS_VARS` and `applyVars(mode)`, which set the eight `--eb-*` vars on `document.documentElement`.
     - the dark-mode switch: `mq = matchMedia('(prefers-color-scheme: dark)')`. At load it calls `applyVars(mode)` and `addons.setConfig({ theme: themes[mode] })`, which replaces #45's one-shot `prefersDark` line. On `mq`'s `change` event it calls `applyVars(mode)` and `addons.setConfig({ theme: themes[mode] })` again, so the manager re-themes without a reload.
3. **`manager-head.html`, against #45's file:**
   - **Kept:** the title, and #45's selector `#storybook-explorer-tree [data-selected="true"]` (plus its `svg`).
   - **Changed:** that rule's color moves out of the dark-only media query to `var(--eb-selected-text)` in both modes, with `!important`. Light resolves to `#ffffff`, so it's unchanged.
   - **Added:** `.ember-brand`, `.ember-brand__blob`, the `a:has(> .ember-brand)` 44px target and focus ring, the boolean-control label rule (`label:has(> input[role="switch"]…) > span[aria-hidden="true"]`, unselected span only, `color: var(--eb-boolean-label) !important`), the `@media (max-width: 599px)` block (section 4a: the hit areas with `overflow: visible`, the 48px bars, the addon content offset, the toolbar scroll affordance and the focus ring), and the reduced-motion block.
4. Keep `theme-map.json` and `MAP`/`CSS_VARS` identical, because `contrast.mjs` fails on drift. If the builder adds it to CI, the command is `node docs/storybook-brand/contrast.mjs`.
5. Check the real build:
   - `npm run test:a11y`, including #45's manager axe: 8 runs, 0 failing.
   - The brand shows the blob plus "Ember UI" in Archivo Black.
   - The selected row is white on blue in light and ink on lime in dark.
   - Toggling the OS dark mode re-themes without a reload.
   - Tab reaches the brand link with a pink 3px ring, and the link is 44px tall.
   - At 600-1023 the sidebar starts collapsed.
   - `NODE_PATH=<playwright-core dir> node docs/storybook-brand/overrides.cjs http://127.0.0.1:<port>/` passes ("all override checks pass", exit 0).
   - Below 600, every control in section 4a is tappable across its 44px square (the `elementFromPoint` probes in `overrides.cjs`), nothing in the bars is clipped, and the toolbar shows the edge rule only where tools are off-screen. At 600 and up the toolbar looks exactly as it does today.

Reproduce: `bash docs/storybook-brand/mock/build.sh <installed node_modules> [base-ref]`. The base ref defaults to `origin/fix/sb-manager-aa`; use `origin/main` once #45 merges. Serve the printed `out` on 127.0.0.1:8961, then run:
- `node scripts/a11y-manager.mjs http://127.0.0.1:8961` from the scratch dir
- `NODE_PATH=<playwright-core dir> node docs/storybook-brand/overrides.cjs http://127.0.0.1:8961/`
- `NODE_PATH=<playwright-core dir> node docs/storybook-brand/shoot.cjs http://127.0.0.1:8961/`

## Known issues and rulings (Storybook internals `create()` can't reach)

1. **Sidebar node-type icons, waived.** Storybook colors them itself: document `#ff8300`, story `#37d5d3`, component `--text-muted` at 60% opacity. On light cream, document is 2.33 and story is 1.70; on dark ink they pass (6.45 to 10.45). Each icon sits next to a text label that carries the meaning. Chief Architect waived this as decorative under WCAG 1.4.11 (Chief Architect review of #52, 2026-11-11 12:52 AM PT). Not in the gate, and #45's axe passes with them.
2. **Boolean control label, fixed in this revision.** Storybook 8.6.19 paints the unselected label as `transparentize(.5, textColor)`: `#827f72` on `#f3ecd2` is 3.39 in light (under 4.5) and `#87857d` on `#111111` is 5.11 in dark. #45 doesn't override it. `manager-head.html` now sets the unselected span to `var(--eb-boolean-label)` (neo `--text-muted`): 9.18 light and 11.28 dark. The selected span keeps Storybook's `textColor`, 18.88 light and 14.07 dark. I used `--text-muted` rather than `--text` so the selected label still reads as the stronger of the two. Both labels are in the gate in both modes and measured in the real build (section 3). The selector targets Storybook 8.6.19's `BooleanControl` markup (`label` > `input[role="switch"]`, then two `span[aria-hidden="true"]`, False then True), so it's covered by the version pin. The segment-vs-track difference (1.18 light, 1.26 dark) is unchanged from #45; the selected segment is also marked by Storybook's ring and the stronger label.
3. **Toolbar controls at 600px and up, waived; below 600, specced.** At 600 and up they stay Storybook's 28x28, which passes WCAG 2.5.8 AA (24px). Chief Architect waived neo's 44px `--target-min` there, tracked against the 44px aim as FU-SB-TOOLBAR-44. Below 600, FU-SB-TOOLBAR-44 now folds into this card (Creatives, from CTE): section 4a gives every control there a 44x44 hit area. The addon panel tabs keep their 40px look and get 44px-tall hit areas below 600 (FU-SB-PANEL-TABS-44, section 4a, from BED's spike).
4. **The preview iframe's docs and canvas content, out of scope; filed as FU-STORYBOOK-DOCS-THEME.** It keeps the preview's styling (Ember components plus Storybook's default docs theme, which stays light in dark mode). Theming it is `preview.tsx` `parameters.docs.theme`, a separate card.
