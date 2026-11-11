# Progress

Dated log of how Ember UI was built. Screenshots are in `docs/screenshots/`.

## 2026-11-10

- Project picked as UX case study 1 of 3: an accessible design system starter.
- Plan and DONE criteria written: tokens in one file (light and dark), 8 components with every state, live Storybook with usage, keyboard and WCAG notes on each docs page, axe 0 serious or critical on every story, unit tests for Modal focus return, Tabs keys and Toast roles.
- Design spec v1.0: tokens seeded from jdilig.me so the system and the site match; native-first components (`<dialog>`, `<select>`); fixed docs page order.
- Tokens built: raw palette plus a semantic layer. Status colors chosen for AA contrast in both themes. The Tokens page computes live contrast ratios for every documented pair.
- Components built: Button, Input, Select, Checkbox, Modal, Tabs, Table, Toast. Shared field shell for labels, hints, required markers and errors wired with `aria-describedby`.
- Unit tests: 6 passing (Modal Esc and close-button focus return, Tab trap, Tabs keys, Toast roles, Toast hover pause).
- First full axe sweep found serious issues only on docs pages (Storybook chrome contrast, the Controls JSON editor, and the token table picking up docs-page styles). Fixed: read-only ArgTypes table, darker docs link and code colors, `sb-unstyled` on the token sheet, themed story backgrounds in docs. Result: 120 runs (49 stories and 11 docs pages, light and dark), 0 serious or critical; reduced-motion check passes.
- Milestone screenshots taken (tokens, Button, Tabs and Table docs, Modal light and dark).
- Repo made public after a gitleaks secret scan; Storybook deployed.
- Repo renamed from ember-ui to a11y-design-system (the approved name). Storybook moved to https://jdilig.me/ux/design-system/storybook/, served by the jdilig.me site, instead of a separate host.
- Case study published at https://jdilig.me/ux/design-system, linking to this repo and the Storybook. Live checks: Storybook axe 0 serious or critical (120 runs); case study Lighthouse accessibility 100, axe 0 serious or critical at 1280px and 320px in light and dark.

## Design log (Chief of Creatives)
- 2026-11-10 - Project picked. John chose an accessible design system starter as UX project 1 of 3 (from 8 ideas).
- 2026-11-10 - Plan + DONE criteria written (8 components, tokens light/dark, Storybook, axe 0 serious/critical on every story).
- 2026-11-10 - Design spec v1.0: tokens seeded from jdilig.me so system and site match; native-first components (dialog, select); docs page order fixed (usage, anatomy, variants, states, keyboard, a11y notes, code).
- 2026-11-10 - Case study copy v1.0 drafted; assumptions about users labeled as assumptions (no user research yet).
- 2026-11-10 - John's feedback: boxy look reads stiff; Tokens page breaks on his phone. Mobile fixes handed to FSD. Three visual directions (soft editorial, bold with motion, warm and tactile) mocked at 375 and 1280 in docs/directions/, all axe 0 serious/critical. Waiting on John's pick.

## 2026-11-10 — Storybook moved to jdilig.me subpath
- Storybook now served from https://jdilig.me/ux/design-system/storybook/ via jdilig-me-v3 (merge ecd5306). No separate Vercel project; the old ember-ui-storybook project is paused pending John's call on deletion.
- Live axe: 120 runs (49 stories + 11 docs pages, light/dark), 0 serious/critical. Manager loads stories in its iframe under the subpath headers (SAMEORIGIN, scoped CSP).

## 2026-11-10 2:15 PM PT: library build, v0.2.0 (Chief Architect R-1)
- Apps now install Ember UI as a built package from a git tag, not from `src/`. Vite library mode builds `dist/index.js` (ESM, about 3.5 kB gzipped), `dist/types/*.d.ts` and one `dist/ember.css`. React is a peer dependency.
- `package.json` has an `exports` map (`.`, `./styles.css`, `./tokens.json`), plus a `prepare` script, so `npm install github:balbonits/a11y-design-system#v0.2.0` builds on install.
- Added GitHub Actions CI. On push and PR it runs typecheck, lint, unit tests and the build, then the axe sweep against the built Storybook.
- The Modal close button is now 44px, the default size, to meet the mobile-first touch-target rule. Also added the MIT LICENSE file.

## 2026-11-10 2:23 PM PT: v0.2.1, modal focus return on unmount
- The tracker's keyboard e2e found a bug. When an app unmounts an open Modal instead of setting `open={false}`, which is a common React pattern, focus fell back to `<body>` after Esc. The Modal now returns focus to its opener in that case too. A unit test covers it: it fails without the fix and passes with it.

## 2026-11-10 3:05 PM PT: Architecture review, v0.2.2 (mobile-first docs, B-1, B-2)

John flagged the Tokens page on his foldable phone (about 920px wide, dark preview). The contrast table ran past the docs column, the page's white edge showed through as a bar over the Needs column, and the sidebar took a third of the screen. Chief Architect's accessibility gate also listed two blockers in the components.

- **Contrast tables** now scroll inside their own box, which you can focus and which has a name ("Dark theme contrast table"), so the page itself never scrolls sideways and the white bar is gone.
- **Code samples** scroll on their own too, and each scroll box can be reached by keyboard. The props table wraps long values instead of scrolling.
- **Sidebar:** from 600 to 1023px it starts collapsed, and the toolbar's Show sidebar button brings it back. Below 600px Storybook's own mobile nav stays.
- **B-1, target size:** the small button looks 36px but its hit area is 44px, through `::before`. The same goes for the Modal close and Toast dismiss icon buttons, and for the Table sort buttons. A whole checkbox row, 44px tall, now toggles the box. Storybook's own docs buttons (Copy, Show code) are 44px as well.
- **B-2, toast timing (WCAG 2.2.1):** a toast with an action, such as Undo, or an error toast no longer goes away on its own. It stays until it's dismissed. There's a new test for it.
- **New check:** `npm run test:mobile` (scripts/mobile.mjs) loads every docs page at 320, 375, 414, 768 and 920px, light and dark: 110 runs with 0 page-level overflow, 0 targets under 44px and 0 serious or critical axe issues. It runs in CI. `npm run test:a11y` is still 122 runs with 0 failing, and unit tests are 9 out of 9.
- **Screenshots:** before and after at 920, 768 and 375px in both themes are in docs/screenshots/ (2026-11-10-mobile-before-* and -after-*).
- **Still open:** the docs pages keep Storybook's light page background in dark preview. That gets fixed by the theme work (R-2, v0.3.0). The visual restyle waits for John to pick a direction.

## 2026-11-10 TIME_PLACEHOLDER PT: Architecture review, v0.3.0 (R-2 themes, breaking)

John asked for all three visual directions to ship as switchable themes (1:59 PM), and for the Storybook to show the components library in each one (2:07 PM). Chief Architect's R-2 set the rules: two axes, three token layers, a raw-color lint and contrast CI over all 6 combos. Chief of Creatives' token spec v1.1 (docs/themes/r2) supplied the values.

- **Two axes.** `data-theme="editorial|bold|tactile"` (editorial when absent) sets shape, type and motion. `data-mode="light|dark"` (follows the system when absent) sets color. They work on `<html>` or on any `.em-scope` element, so one page can show all 6 combos side by side. **Breaking:** the old `data-theme="dark"` is gone; use `data-mode="dark"`.
- **Three layers** in `src/tokens/`: primitives (the only place raw colors live), semantic (per theme and mode, with the same token names as before, so app code that reads `--text` or `--accent` keeps working), and components (`--button-*`, `--field-*`, `--card-*`, `--modal-*`, `--table-*`, `--tabs-*`, `--toast-*`). Component CSS now reads only component and semantic tokens.
- **CI gates added:** `npm run lint:colors` fails on any raw color or palette token in component CSS (0 found). `npm run contrast` checks 174 pairs across the 6 combos (0 failures) and writes docs/CONTRAST.md. Carried over Creatives' fix: editorial-light `--success` measured 4.45:1, so it's now green-800.
- **ThemeSwitcher** (new, exported): two native radio groups, Theme and Color mode, each with a legend. Arrow keys move within a group. Every change is announced politely (for example "Theme Bold, automatic (dark) mode"). The choice persists to `jdilig:theme` and `jdilig:mode`, Auto follows the OS live, and the cross-fade is skipped under reduced motion. `PREPAINT_SCRIPT` goes inline in `<head>` so there's no flash of the wrong theme. Every option is at least 44x44px. 2 new unit tests (11 of 11 pass).
- **Storybook:** the toolbar has Theme and Mode menus that switch the whole Storybook, docs pages included. Every component has an "All themes" story showing it in all 6 combos at once. The Tokens page shows swatches and a contrast table for each combo.
- **Checks:** A11Y_PLACEHOLDER
- **Before and after:** before is the v0.2.2 look in docs/screenshots/2026-11-10-modal-light.png, -modal-dark.png and -tokens-light.png. After is docs/screenshots/2026-11-10-r2-<component>-all-themes.png for each component, plus 2026-11-10-r2-switcher-<theme>-<mode>.png.
- **Notes for consumers:** the Tactile theme uses Bricolage Grotesque, so apps that offer Tactile need `@fontsource-variable/bricolage-grotesque` (now a dependency). Removed a self-referencing `--parallax-scale` line from the spec's components.css (it resolved to nothing); reduced motion still sets it to 0.
- **Follow-ups (not blocking):** the docs page body keeps Storybook's light background in dark preview (only the component previews change), and Chief of Creatives does the visual pass on all 6 combos after release.
