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

## 2026-11-10 5:40 PM PT: transcripter (Card 1-VP, tools/transcribe)
- Offline faster-whisper 1.2.1 transcripter (`small.en`, CPU float32) built and run on a Grok Bot box. One cue list drives `cues.json`, `captions.vtt` and `transcript.txt`.
- Sample media: a 52 s Sintel excerpt (Blender Foundation, CC BY 3.0) at 480p, about 3 MB, credited in the README and `tools/transcribe/CREDITS.md`. Hand-written text audio description in `ad.vtt`, placed in the dialogue gaps.
- Findings: on int8 the transcript changed on every run and sometimes looped ("for for for"), so it runs on float32, which is repeatable across runs. VAD filtering garbled a quiet line, so it's off for decoding and used only to fix Whisper's early first-word starts.
- Checks: both `.vtt` files pass a stdlib validator and W3C's webvtt.js parser in strict mode. 14 unit tests pass. All 12 caption starts fall within 0.68 s early and 0.38 s late of Blender's hand-timed subtitles.

## 2026-11-10 6:05 PM PT: R-8 repo conventions
- Secret scan: gitleaks 8.28.0 over the full history (37 commits, up to 757da0c, before main merged #8 and #13), findings redacted: **no leaks found**. Re-scanned after merging main into this branch (50 commits): no leaks found. CI runs it on every push and PR (`.github/workflows/gitleaks.yml`).
- [Accessibility Conformance Report](docs/ACR.md) added (VPAT 2.5 Rev 508, self-assessed), linked from the README. Its numbers come from runs on 757da0c: axe 122 runs, 0 serious or critical; reduced-motion 0 running animations; mobile 110 runs, 0 failing; unit tests 9 pass. No screen-reader pass yet, so 4.1.3 and 302.1 are Partially Supports. 2.5.8 is Partially Supports until the Addendum 5 `--target-min` CI check exists, and 2.4.11 until a toasts-open focus check is run.
- Conventions confirmed: README, this PROGRESS.md, MIT LICENSE ("Copyright (c) 2026 John Dilig"), CI (typecheck, lint, test, build, test:a11y, test:mobile). History is real and unsquashed.

## 2026-11-10 6:12 PM PT: ACR fixes from Chief Architect's review
- 2.5.8 Target Size is now **Supports**: every control measures at least 44px in the mobile target scan, and the 24px criterion is met. The `--target-min` CI gate is our own process (ARCH-REVIEW Addendum 5) and is tracked separately.
- 2.4.11 Focus Not Obscured was tested with the new `scripts/focus-obscured.mjs`: 3 sticky toasts open, 60 controls behind them, Tab through every one at 320 and 1440px in light and dark. **At 320px, 26 of 120 focus stops were fully hidden behind the toast stack**; at 1440px, none. The row stays Partially Supports.
- **Fix logged (not built here):** at narrow widths the toast stack must not fully hide the focused element, for example by reserving scroll padding for the viewport's height while toasts are open, or by collapsing the stack. Re-run `node scripts/focus-obscured.mjs` after the fix. It needs a card.
- Page-level rows (2.4.1, 2.4.2, 2.4.5, 3.1.1, 3.2.3) now say they're owned by the consuming application and that the Storybook docs site is out of scope. The methods section explains that the 288 moderate findings come from isolated story iframes.

## 2026-11-10 6:23 PM PT: v0.3.0, theme registry with neo as the default (R-2, breaking)

John asked for switchable themes with the components shown in each. Chief Architect's R-2 and ARCH-REVIEW Addenda 5 and 6 set the rules, and Chief of Technology & Engineering set the scope: themes are registered data, not code, and the earlier three candidate directions are not shipped. neo (Chief of Creatives, CA-signed at main d8e1f93, docs/directions/v3/neo/) is the first registered theme and the default.

- **Theme registry.** `src/themes/registry.json` lists the themes, default first; each has one token file, `src/themes/<id>.css`, with its own palette and every token in the theme contract. `npm run tokens` checks the contract, builds `src/tokens/themes.css` (the first entry also applies when `<html>` has no `data-theme`) and exports `src/tokens.json`. **Adding a theme takes a token file and a registry entry, nothing else.** No component, ThemeSwitcher, Storybook or CI code names a theme.
- **Two axes.** `data-theme` takes a registered id, and `data-mode="light|dark"` picks the mode (absent follows the OS). Both work on `<html>` or any `.em-scope` element. **Breaking:** the old `data-theme="dark"` is gone; use `data-mode="dark"`.
- **Locked token names (Addendum 5), no aliases.** `--radius-sm/md/lg/full`, `--border-width(-strong)`, `--shadow-raised/press`, `--focus-ring-color/width/offset/style`, `--control-height/padding-x/gap`, `--target-min` (44px), `--divider-shape`, `--highlight(-contrast)`, `--tilt`, `--lift`. **Breaking:** `--radius`, `--focus`, `--radius-field/control/surface`, `--shadow-1/2`, `--focus-ring` and `--focus-offset` are removed.
- **Three layers.** Shared primitives (type and space ramps), the registered themes, and component tokens (`--button-*`, `--field-*`, `--card-*` and the rest) that are only `var()` of theme tokens. Themes never set component tokens.
- **CI gates.** `npm run lint:colors` fails on raw colors, on any literal border-radius, border width, box-shadow or outline in component CSS, on component tokens that aren't pure `var()`, and on any retired token name. `npm run contrast` checks every registered theme (and the stories-only test fixture) in light and dark, including the focus ring against the background and the border at 3:1 and `--highlight-contrast` on `--highlight` at 4.5:1, and asserts a focus ring style that is never `none`, a ring width of at least 2px, `--target-min` of at least 44px, and `--tilt`/`--lift` at 0 under reduced motion. Pressed buttons move and change fill as well as dropping their shadow, so shadow is never the only cue.
- **ThemeSwitcher** (exported): native radio groups for Theme and Color mode, persisted to `jdilig:theme` and `jdilig:mode`, announced politely, Auto following the OS live, and no cross-fade under reduced motion. It reads the registry, takes an app's own list through `themes`, and hides the Theme group when only one theme is registered. `prepaintScript(themes)` and `PREPAINT_SCRIPT` go inline in `<head>` (CSP-hashable).
- **Storybook.** The Theme toolbar is generated from the registry. Each component's "All themes" story and the Tokens page iterate every registered theme in light and dark. "Tokens/Theme registry" shows the same Button and Input in neo and in a test-fixture theme (stories and tests only, not shipped; it goes when the next CA-signed theme registers), different in both color and shape.
- **QA bug 1 fixed.** The Tokens page type specimens rendered cream on white in OS dark (1.16:1). They now sit on a themed surface, and `npm run test:a11y` adds an axe pass over every docs page with the OS set to dark.
- **Removed:** the three candidate directions' token files, specs, prototypes and screenshots (docs/themes, docs/directions v1/v2). Fonts are now Archivo Black, Archivo and JetBrains Mono, as neo names them.
- **Checks:** token lint 0 failures; contrast 128 pairs (all 64 of neo's CONTRAST.md pairs plus the fixture's) and 8 contract assertions, 0 failures; 14/14 unit tests; axe 160 runs (62 stories and 12 docs pages in neo light and dark, plus the 12 docs pages in OS dark), 0 serious or critical; mobile 216 runs (12 docs pages at 320/375/414/640/768/920/1024/1280/1440 in light and dark, with 640 standing in for a 1280px window at 200% zoom), each with axe, hit areas at `--target-min` and the 1.4.12 text-spacing overflow check, 0 failing; gitleaks clean; zero hits for the retired theme names and tokens outside this log.


## 2026-11-10 6:44 PM PT: R-2 follow-ups (R-2b label, commit identity)

- The proof-story fixture is now labelled "Test fixture, not a design" everywhere it appears (Theme registry story, Two registered themes story, unit tests), per ARCH-REVIEW R-2b. Its id stays `test-fixture`, and it stays out of the registry, THEMES, the Theme toolbar and the package build.
- Commit identity: from this commit on, commits are authored as John Dilig with an `Author-bot: Full Stack Developer` trailer (CTE ruling). Earlier pushed commits are left as they are, with no history rewrite.

## 2026-11-10 6:50 PM PT: ACR report version
- The ACR now has an explicit **Report version: 1.0** line (Chief Architect ruling). It goes up a minor version for any row or remark change, and a major version when the product version changes. The Version line stays the product version that was evaluated. The jdilig.me generator reads all three and fails if one is missing.
- The 2.4.11 remark now names the fix card, FU-FSD-TOAST. The row stays Partially Supports until that card ships and `scripts/focus-obscured.mjs` reports 0 hidden stops.

## 2026-11-10 7:10 PM PT: v0.3.1 (Addendum 7, kinetic, Switch, R-2a component layer)

- Addendum 7: `--scrim` and `--radius-xl` joined the theme contract. Neo backfill: `--radius-xl: var(--radius-lg)` and `--scrim: color-mix(in srgb, var(--text) 45%, transparent)`. `.em-modal::backdrop` reads `var(--scrim)`. The registered extras (`--rule`, `--shadow-overlay`, `--weight-display-min/max`, `--weight-shift`, `--duration-reveal/ticker`, `--stagger`, `--blur-glass`, `--parallax-scale`, `--hue-shift`) are required in every theme, with neutral defaults in neo. Under reduced motion, `--tilt`, `--lift`, `--parallax-scale`, `--hue-shift`, `--stagger`, `--weight-shift` and `--duration-reveal` must be 0 (contrast gate).
- kinetic registered (light and dark) from docs/directions/v3/kinetic/tokens.css at 938e642, as-is plus `--hue-shift: 0deg` (neutral default) and `--parallax-scale`/`--hue-shift` in its reduced-motion block. Storybook loads its fonts (Bricolage Grotesque 300/700/800, Instrument Sans 400/500/600, IBM Plex Mono 400).
- The stories-only test fixture is deleted: the Theme registry proof story, the Two registered themes story and the ThemeSwitcher unit tests now use the real registry (neo and kinetic), per R-2b.
- R-2a: `npm run tokens` (run by every build) now fails when a component token isn't exactly `var(--<contract name>)` or a `calc()` of only contract names, has a fallback, reads another component token, or when a theme sets a component token. `--hit-min` and `--focus-outline(-offset)` are removed; hit areas read `--target-min` directly (Button, Button sm, Checkbox row, Switch row, Tabs, Table sort button, ThemeSwitcher options) and focus outlines read the four focus-ring tokens.
- Contrast: the focus-ring-color vs border pair now applies only when `--focus-ring-offset` is 0 (the ring touches the border only then). Both themes use a 3px offset. Flagged to Chief Architect.
- Switch component (role="switch" checkbox, 44x24 track in a --target-min row, label and hint, forced-colors and reduced-motion rules) with stories for every state and a unit test.
- Gates: tokens and lint:colors 0; contrast 124 pairs and 8 assertions across 2 themes, 0 failures; vitest 15/15; axe 362 runs, 0 failing; mobile 468 runs (13 docs pages x 9 widths x 4 theme/mode combos), 0 failing.

## 2026-11-10 7:46 PM PT: kinetic fonts vendored (CTE ruling)
- Reverted 48d72ac (the three `@fontsource` devDependencies) with a new commit. Kinetic's fonts are now latin-subset woff2 files in `.storybook/fonts` (Bricolage Grotesque 300/700/800, Instrument Sans 400/500/600, IBM Plex Mono 400), each family's OFL.txt alongside, loaded by `@font-face` with `font-display: swap`. neo's fontsource setup is unchanged, and the Ember package still ships no fonts. Version stays 0.3.1.

## 2026-11-10 7:47 PM PT: Chief Architect's focus-ring rulings on v0.3.1
- Ruling 1 accepted with its condition: `npm run contrast` now fails a negative (or non-length) `--focus-ring-offset`, prints the offset per theme, and docs/CONTRAST.md states the rule. Focus ring vs `--color-bg`, `--surface` (cards and raised controls) and `--surface-muted` is required at 3:1 in light and dark at any offset; focus ring vs `--border` is required only at offset 0. Negative-tested with kinetic set to -2px.
- Ruling 2 accepted as built: kinetic's `--hue-shift: 0deg`, with `--parallax-scale` and `--hue-shift` at 0 in the reduced block.

## 2026-11-10 7:50 PM PT: v0.3.2, dusk registered (job tracker identity)
- Added `src/themes/dusk.css` from Creatives' `docs/directions/v3/dusk/tokens.css` (HANDOFF baseline 748d492) and a `Dusk` entry in `registry.json`. No component code changed.
- Copied as-is apart from three things: the registered extras dusk doesn't use (`--rule`, `--weight-display-min/max`, `--weight-shift`, `--stagger`) at neutral defaults, `--stagger` and `--weight-shift` added to the reduced-motion block, and the two shadows reading `--palette-plum-900` through `color-mix` at the same alpha so the token lint passes.
- Storybook vendors Young Serif 400 and Nunito Sans 400 to 800 (one latin variable woff2) in `.storybook/fonts` with their OFL files, same pattern as kinetic. The package ships no fonts.
- Contract: 186 pairs and 15 assertions across 3 themes, 0 failures. Stacked on v0.3.1 (#27).
