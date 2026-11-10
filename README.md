# Ember UI

A small, accessible React design system: tokens for light and dark themes, eight components, and a docs page for every one.

- **Storybook:** https://jdilig.me/ux/design-system/storybook/
- **Case study:** https://jdilig.me/ux/design-system
- **Author:** John Dilig

## What's inside

- `src/tokens.css`: one file of design tokens (raw palette, then semantic roles) for light and dark. Dark applies with `data-theme="dark"`, or follows the system when no theme is set. Reduced motion sets every duration to 0. `src/tokens.json` is generated from it.
- Components: Button, Input, Select, Checkbox (and CheckboxGroup), Modal, Tabs, Table, Toast. Every state (default, hover, focus-visible, active, disabled, error, loading where it applies) has a story.
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
