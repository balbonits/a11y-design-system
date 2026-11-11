---
date: 2026-11-11
pr:
card: DEVLOG-FRAGMENTS
title: Devlog fragments instead of PROGRESS.md edits (PROC-8)
---

- Why: every main merge made every open PR conflict on PROGRESS.md, which cost a QA and CA re-sign cycle each time. From now on a PR never edits PROGRESS.md and adds exactly one `progress/YYYY-MM-DD-<slug>.md` fragment instead (CA ruling on the CTE proposal, `STANDARDS.md` PROC-8). Not `.gitattributes merge=union`, because GitHub server-side merges ignore it.
- `npm run devlog` (`scripts/devlog.mjs`) renders PROGRESS.md verbatim followed by every fragment sorted by date, then file name, into `dist/devlog/DEVLOG.md`. That's gitignored build output and is never committed. Plain Node, with no new packages.
- `npm run check:devlog` (`scripts/check-devlog.mjs`, run in CI on every PR including label changes) fails a PR that edits PROGRESS.md, adds 0 or more than 1 fragment, deletes a fragment, or has bad front matter. The `devlog-maintenance` label lifts the PROGRESS.md and count rules (this PR uses it for the one header line), but front matter is always checked.
- `npm run test:devlog` holds 17 planted cases in throwaway git repos: PROGRESS.md edit, 0 fragments, 2 fragments, 7 kinds of bad front matter and a deleted fragment all fail, while the label, a valid fragment, filling in `pr` and a forward-merge of main that brings in other PRs' fragments pass. Fragments are counted from this PR's added files only (status A in `git diff --name-status <base>...HEAD`, so from the merge base). The renderer's order and refusal to write are also tested.
- PROGRESS.md history is unchanged except for one header line pointing to `progress/`. README, docs/ACR.md and docs/components/video-player/CORE-API.md no longer tell anyone to edit PROGRESS.md.
