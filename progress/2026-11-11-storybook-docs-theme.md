---
date: 2026-11-11
pr: 64
card: STORYBOOK-DOCS-THEME
title: Neo docs theme (light and dark) for Storybook docs pages
---

- Built from the spec's own diffs (HANDOFF rev 2, merged as #54 at 716f512): `git apply` of `docs/storybook-docs-theme/diffs/preview.tsx.diff` and `preview-head.html.diff`. The resulting `.storybook/preview.tsx` and `.storybook/preview-head.html` are byte-identical to `docs/storybook-docs-theme/mock/`. Token values come from `src/tokens.json`; nothing else in the repo changed.
- Spec gates on 127.0.0.1:6064: `docs/storybook-docs-theme/contrast.mjs` 46 token pairs, 0 failures (syntax floor 4.5; rendered kinds vs main: 22 up, 4 same, 2 down); `docs-check.cjs` 4353 pass, 0 fail; `docs-check.cjs --no-has` 488 pass, 0 fail; `axe-docs.cjs` 78 runs, 0 failing.
- Screenshots re-shot from a scratch copy of `shoot.cjs` match the committed `handoff/` shots pixel for pixel.
- This is the first entry written as a devlog fragment (PROC-8) instead of a PROGRESS.md edit.
