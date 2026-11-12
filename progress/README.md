# Devlog fragments (PROC-8)

Every PR adds **exactly one** file here and **never edits `PROGRESS.md`** (that file is the history up to 2026-11-11 and stays verbatim). This stops every main merge from conflicting with every open PR on PROGRESS.md.

## Add your entry

Create `progress/YYYY-MM-DD-<slug>.md`, where the date is the day you write it and the slug is your branch or card id in lowercase (`feat-r4-video`, `fu-sb-collapsed-sidebar-inert`):

```markdown
---
date: 2026-11-11
pr:
card: DEVLOG-FRAGMENTS
title: Devlog fragments instead of PROGRESS.md edits
---

- What changed, why, and the gate results, as bullets (same style as PROGRESS.md entries).
```

- `date` must match the file name date. `pr` stays blank until the PR exists; you may fill it in later in the same PR or a follow-up (editing an existing fragment is allowed, deleting one is not).
- `card` and `title` are required; no other keys.
- More progress on the same PR goes in the same fragment, not a second one.

## Check and render

- `npm run check:devlog` (CI on every PR): fails on a PROGRESS.md edit, 0 or 2+ new fragments, a deleted fragment, or bad front matter. A PR labelled `devlog-maintenance` may edit PROGRESS.md and add any number of fragments; front matter is still checked.
- `npm run devlog` writes `dist/devlog/DEVLOG.md` (gitignored, never committed): PROGRESS.md, then every fragment sorted by date, then file name. The case-study site reads that output.
- `npm run test:devlog` runs the guard's planted negatives.
