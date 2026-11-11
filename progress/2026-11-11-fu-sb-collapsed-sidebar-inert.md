---
date: 2026-11-11
pr: 65
card: FU-SB-COLLAPSED-SIDEBAR-INERT
title: Collapsed Storybook sidebar no longer takes keyboard focus (600-1023px)
---

- Bug (VQA): at 600-1023px the sidebar starts collapsed (`navSize: 0`), so `nav.sidebar-container` is 0px wide, but its 25 controls stayed in the Tab order. A full-cycle Tab walk on the main build (53b37a6) found 6 off-screen stops at 600px, 10 at 768px and 9 at 1023px (WCAG 2.4.7 / 2.4.11).
- Fix in `.storybook/manager.ts`: a `ResizeObserver` sets `inert` on `nav.sidebar-container` while it is under 1px wide and removes it as soon as it has width. A `MutationObserver` attaches it whenever Storybook renders the nav. `docs/storybook-brand/mock/manager.ts` carries the same change byte for byte, `mock/manager.ts.diff` is regenerated from #45's file, and HANDOFF's 600-1023 row says the collapsed sidebar is inert.
- Tab walk on the fixed build: 0 off-screen stops at 600, 768, 800, 1023 and 1280px. At 600-1023 the first stop is the visible "Show sidebar" button. At 1280 the stops match the main build exactly (13 stops, all visible).
- After "Show sidebar" at 768px the nav is 299px wide, not inert, and Tab reaches its search box; same with reduced motion. The 375px drawer has no inert element and Tab reaches its search box, the same as on main, with and without reduced motion.
- CI (CA's ask, separate commit): a step `cmp`s `.storybook/manager.ts` and `.storybook/manager-head.html` against `docs/storybook-brand/mock/`, and a negative control appends one byte to a temp copy of each and must see `cmp` fail. Locally, a one-byte drift planted in `.storybook/manager.ts` made the step exit 1 (`EOF on docs/storybook-brand/mock/manager.ts after byte 5630`); the plant was not committed.
- Recorded as a devlog fragment; PROGRESS.md is not edited.
