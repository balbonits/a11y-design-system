# Ember UI

A small, accessible React design system: tokens for light and dark themes, eight components, and a docs page for every one.

- **Storybook:** https://jdilig.me/ux/design-system/storybook/
- **Case study:** https://jdilig.me/ux/design-system
- **Author:** John Dilig

## What's inside

- Themes on two axes: `data-theme="editorial|bold|tactile"` (editorial when absent) and `data-mode="light|dark"` (follows the system when absent), on `<html>` or any `.em-scope` element. That's 6 combos, all checked for AA contrast and axe in CI.
- Tokens in three layers in `src/tokens/`: primitives (the only place raw colors live), semantic (per theme and mode), and components (`--button-*`, `--field-*` and so on). `src/tokens.css` imports all three, and `src/tokens.json` is generated from them. Reduced motion sets every duration to 0.
- `ThemeSwitcher`: two native radio groups (Theme, Color mode) that persist to `jdilig:theme` and `jdilig:mode`. Put `PREPAINT_SCRIPT` inline in `<head>` so there's no flash of the wrong theme. The Tactile theme uses Bricolage Grotesque (`@fontsource-variable/bricolage-grotesque`).
- Components: Button, Input, Select, Checkbox (and CheckboxGroup), Modal, Tabs, Table, Toast, ThemeSwitcher. Every state (default, hover, focus-visible, active, disabled, error, loading where it applies) has a story.
- Docs pages in a fixed order: usage, anatomy, variants, states, keyboard, accessibility notes, code.

## Accessibility checks

- `npm run test:a11y` builds nothing itself; run `npm run build` first, serve `storybook-static` on port 6007 (`npx http-server storybook-static -p 6007 -s`), then run it. It runs axe-core on every story and docs page in light and dark and fails on any serious or critical issue. It also checks that the modal, toast and loading stories run no animations under reduced motion.
- `npm test` runs unit tests for Modal focus return and focus trap, Tabs arrow/Home/End keys, and Toast roles.
- Storybook's interactive Controls block is replaced by the read-only ArgTypes table on docs pages, because its JSON editor fails axe. Docs-chrome link and code colors are darkened in `.storybook/preview-head.html` for AA contrast.

## Use it in an app
Ember UI installs from a git tag and builds itself on install (the `prepare` script runs the library build). It isn't on npm.

```sh
npm install github:balbonits/a11y-design-system#v0.2.0
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
| `npm run test:a11y` | axe sweep of the built Storybook |
| `node scripts/shots.mjs` | Milestone screenshots into `docs/screenshots/` |

## Progress

See [PROGRESS.md](PROGRESS.md) for the dated build log and `docs/screenshots/` for milestone shots.

## License

MIT
