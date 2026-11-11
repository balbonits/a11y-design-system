# v3 design directions

v3 is three distinct identities built on the Ember token set (ARCH-REVIEW Addendum 5, plus Addendum 7's `--scrim` and `--radius-xl`), one for each UX project.

## Directions

| Direction | Project | HANDOFF | Live prototype | CA-signed sha | VQA PASS sha | Ember registration | App builder | App repo and branch |
|---|---|---|---|---|---|---|---|---|
| neo | Ember UI + Storybook | [neo/HANDOFF.md](neo/HANDOFF.md) ([for the builder](neo/HANDOFF.md#for-the-builder)) | [neo prototype](https://raw.githack.com/balbonits/a11y-design-system/main/docs/directions/v3/neo/index.html) | `d8e1f93` | `d8e1f93` | FSD, `feat/r2-themes` | none | none |
| kinetic | Dev dashboard, Deploys page | [kinetic/HANDOFF.md](kinetic/HANDOFF.md) ([for the builder](kinetic/HANDOFF.md#for-the-builder)) | [kinetic prototype](https://raw.githack.com/balbonits/a11y-design-system/main/docs/directions/v3/kinetic/index.html) | `938e642` | `938e642` | FSD. Planned for Ember v0.3.1, after R-2 (`feat/r2-themes`, PR #16) merges. Not released yet. | Front End Developer (FED) | `balbonits/devtool-dashboard`, `feat/kinetic-theme` |
| dusk | Job tracker, Board page | [dusk/HANDOFF.md](dusk/HANDOFF.md) ([for the builder](dusk/HANDOFF.md#for-the-builder)) | [dusk prototype](https://raw.githack.com/balbonits/a11y-design-system/main/docs/directions/v3/dusk/index.html) | `eec5773` | `6be00f5` (HANDOFF current at `748d492`) | FSD, `feat/r2-themes` | Full Stack Developer (FSD) | `balbonits/job-app-tracker`, `feat/dusk-theme` |

Each HANDOFF has H-1 to H-8 (layout per breakpoint, fluid rules, nav, component states, touch targets, motion, tokens, annotated screenshots), then "For the builder" and its Known issues.

## Shared files

- [BRIEF.md](BRIEF.md): the v3 brief from Chief of Creatives (what is banned, what is kept, and the three directions).
- [shared/annotate.cjs](shared/annotate.cjs): the check and screenshot script (axe, overflow, text spacing, 200% zoom, annotated shots). To run it, start `python3 -m http.server 8942` in `docs/directions/v3`. Then, from `docs/directions`, run `node v3/shared/annotate.cjs <id> http://127.0.0.1:8942/<id>/index.html`, where `<id>` is `neo`, `kinetic` or `dusk`. neo's HANDOFF also documents its original `neo/annotate.cjs` (port 8931).
- VQA gate (box-internal, not in this repo): `/workspace/ux-projects/visual-qa/v3/gate.cjs`.

## Out of scope for v1.0 (v1.1 candidates)

- kinetic: the dashboard stats row, the build-time chart and the recent deploys list (Known issue 2, RULED by Chief of Creatives 2026-11-10).
- kinetic and dusk: the views other than the direction's own project page (Deploys for kinetic, Board for dusk) are a style sampler only, not for build.

## Known issues

- neo: the "Known issues" bullet in [For the builder](neo/HANDOFF.md#for-the-builder).
- kinetic: [Known issues and open questions](kinetic/HANDOFF.md#known-issues-and-open-questions-each-has-a-proposal-so-nothing-is-left-to-guess).
- dusk: [Known issues and open questions](dusk/HANDOFF.md#known-issues-and-open-questions-each-has-a-proposal-so-nothing-is-left-to-guess).
