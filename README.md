# Ember UI

A small, accessible React design system: tokens for light and dark themes, eight components, and a docs page for every one.

- **Storybook:** https://jdilig.me/ux/design-system/storybook/
- **Case study:** https://jdilig.me/ux/design-system
- **Accessibility Conformance Report:** [docs/ACR.md](docs/ACR.md) (VPAT 2.5, 508 edition, self-assessed)
- **Author:** John Dilig

## What's inside

- **Themes are registered data.** `src/themes/registry.json` lists the themes, default first (Ember ships `neo`, the default, and `kinetic`). Each theme is one token file, `src/themes/<id>.css`, with its own palette and every token in the theme contract (ARCH-REVIEW Addendums 5 and 7: `--radius-sm/md/lg/xl/full`, `--border-width(-strong)`, `--shadow-raised/press`, `--focus-ring-color/width/offset/style`, `--control-height/padding-x/gap`, `--target-min`, `--divider-shape`, `--highlight(-contrast)`, `--tilt`, `--lift`, `--scrim` (the dialog backdrop), the semantic colors, and the registered extras `--rule`, `--shadow-overlay`, `--weight-display-min/max`, `--weight-shift`, `--duration-reveal/ticker`, `--stagger`, `--blur-glass`, `--parallax-scale` and `--hue-shift`, with neutral 0 or none defaults when a theme doesn't use them). **Optional contract tokens** (ARCH-REVIEW Addendum 10): `--hover-fill` and `--hover-label`, a pair a theme defines both or neither (kinetic defines them for its inverted Button hover). They're not `@property`-registered, so a theme without them keeps each Button variant's own hover. A theme that sets any other name outside the contract fails `npm run tokens`. **Adding a theme takes a token file and a registry entry, then `npm run tokens`.** No component, Storybook or CI code names a theme.
- Two axes: `data-theme` takes a registered id (absent = the default theme) and `data-mode="light|dark"` (absent = follows the system), on `<html>` or any `.em-scope` element. Every registered theme is checked in light and dark for AA contrast and axe in CI.
- Tokens in three layers: shared primitives (type and space), the registered themes (generated into `src/tokens/themes.css`), and component tokens (`--button-*`, `--field-*` and so on). Each component token is exactly `var()` of one contract name or a `calc()` of only contract names, never a literal, a fallback or another component token, and no theme sets them; `npm run tokens` fails otherwise. Hit areas (Button, Checkbox row, Switch row, Tabs, Table sort button, ThemeSwitcher options) read `--target-min` directly. `src/tokens.css` imports all three, and `src/tokens.json` is generated. Reduced motion sets every duration, `--tilt`, `--lift`, `--press-offset`, `--parallax-scale`, `--hue-shift`, `--stagger` and `--weight-shift` to 0.
- `ThemeSwitcher`: native radio groups (Theme, Color mode) that persist to `jdilig:theme` and `jdilig:mode`. It reads the registry, takes an app's own themes through `themes`, and hides the Theme group when only one theme is registered. Put `PREPAINT_SCRIPT` (or `prepaintScript(themes)`) inline in `<head>` so there's no flash of the wrong theme. neo uses Archivo Black, Archivo and JetBrains Mono; load them in your app (Storybook uses `@fontsource/archivo-black`, `@fontsource/archivo` and `@fontsource/jetbrains-mono`).
- Fonts are the app's to load: neo uses Archivo Black, Archivo and JetBrains Mono; kinetic uses Bricolage Grotesque (300, 700, 800), Instrument Sans (400, 500, 600) and IBM Plex Mono (400). Storybook loads neo's from `@fontsource` and kinetic's from latin woff2 files vendored in `.storybook/fonts` (OFL 1.1, licenses alongside). The Ember package ships no fonts. kinetic's stacks name a metric-matched fallback second (`'Bricolage Grotesque Fallback'`, `'Instrument Sans Fallback'`, `'IBM Plex Mono Fallback'`): an app that loads the web fonts should define those `@font-face` rules (local() Arial/Liberation Sans/Arimo or Courier New/Liberation Mono with size-adjust and ascent/descent overrides) so the font swap doesn't shift layout. If an app doesn't define them, the browser skips to the next family.
- Components: Button, Input, Select, Checkbox (and CheckboxGroup), Switch, Modal, Tabs, Table, Toast, ThemeSwitcher. Every state (default, hover, focus-visible, active, disabled, error, loading where it applies) has a story.
- Docs pages in a fixed order: usage, anatomy, variants, states, keyboard, accessibility notes, code.

## Accessibility checks

- `npm run test:a11y` builds nothing itself; run `npm run build` first, serve `storybook-static` on port 6007 (`npx http-server storybook-static -p 6007 -s`), then run it. It runs axe-core on every story and docs page in every registered theme in light and dark, plus every docs page with the OS in dark mode, and fails on any serious or critical issue. It also checks that the modal, toast and loading stories run no animations under reduced motion.
- `npm test` runs unit tests for Modal focus return and focus trap, Tabs arrow/Home/End keys, and Toast roles.
- Storybook's interactive Controls block is replaced by the read-only ArgTypes table on docs pages, because its JSON editor fails axe. Docs-chrome link and code colors are darkened in `.storybook/preview-head.html` for AA contrast.

## Use it in an app
Ember UI installs from a git tag and builds itself on install (the `prepare` script runs the library build). It isn't on npm.

```sh
npm install github:balbonits/a11y-design-system#v0.3.1
```

```tsx
import 'ember-ui/styles.css';
import { Button, ToastProvider } from 'ember-ui';
```

The package exports `ember-ui` (ESM and `.d.ts`), `ember-ui/styles.css` and `ember-ui/tokens.json`. React 19 is a peer dependency.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run build:lib` | Library build into `dist/`: ESM, `.d.ts` and one `ember.css` |
| `npm run build` | Library build, type-check, then Storybook into `storybook-static/` |
| `npm run typecheck` / `lint` / `test` | TypeScript, ESLint, Vitest |
| `npm run tokens` | Checks every registered theme against the contract, builds `src/tokens/themes.css` and `src/tokens.json` |
| `npm run lint:colors` | Token lint: raw colors, literal radius/border width/box-shadow/outline in component CSS, non-`var()` component tokens, retired token names |
| `npm run contrast` | Contrast and theme-contract gate for every registered theme; writes `docs/CONTRAST.md` |
| `npm run test:a11y` | axe sweep of the built Storybook (every theme and mode, OS dark, reduced motion) |
| `npm run test:mobile` | Docs pages at 320 to 1440px: overflow, `--target-min` hit areas, axe, 1.4.12 text spacing |
| `node scripts/shots.mjs` | Milestone screenshots into `docs/screenshots/` |

## Progress

See [PROGRESS.md](PROGRESS.md) for the dated build log and `docs/screenshots/` for milestone shots.

## License

MIT, see [LICENSE](LICENSE).
