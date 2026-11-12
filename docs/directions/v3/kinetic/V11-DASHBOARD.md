# Kinetic v1.1 addendum: stats row, Run duration chart, Recent deploys

Card KINETIC-V11-DASHBOARD-SPEC (Chief of Creatives, 2026-11-11). This is an addendum to [HANDOFF.md](HANDOFF.md). It does not change any signed v1.0 section, and it follows the same H-1 to H-8 structure. **Status: spec only. Nothing here is built until Chief Architect signs it and Chief of Technology & Engineering schedules v1.1.** Prototype: the "v1.1 candidates" area of `#dashboard` in [index.html](index.html).

## Data rules (Chief of Creatives rulings, 2026-11-11 7:28 AM PT)
Everything is derived from the app's existing `Run` model (devtool-dashboard `src/lib/types.ts`): `env`, `service`, `status` (`failed` | `running` | `succeeded` | `canceled`), `sha`, `message`, `branch`, `author`, `started`, `duration` (seconds, `null` while running). **No new data fields and no other sources.** Every number covers the selected env tab only.

- **Finished run** = status `succeeded`, `failed` or `canceled` with a non-null `duration`. **Not finished** = `running` (the prototype's extra "In progress" status counts here too; the app has no such status).
- **Removed from the v1.0 sampler, because the data model has no source for them:** "Builds today" (the data is a rolling window of runs, not a calendar day), "Open PRs", "a11y issues", "Flaky tests", and the "Build time, last 7 days, down 38%" line chart (there are no daily aggregates and no 7-day span). Don't bring them back without a data field that CTE and CA approve.
- Durations use the app's `duration()` format, "Xm YYs". Counts use the `en-US` thousands separator ("12,480").
- Median = the middle duration of the finished runs, sorted. With an even count it's the mean of the two middle values, rounded to the second.

## H-1 Layout per breakpoint
Kinetic breakpoints are unchanged: base 320, 480, 700, 900, 1024; page padding 1.25rem, and 2.5rem from 900; max width 1320. Proposed order in the app's env tab panel (CA to confirm, decision D-1): **stats row, then the existing failures banner, Recent deploys, Run duration, then the existing filters and runs table.** "View all {env} runs" at the end of Recent deploys moves focus to the runs table.

| Width | Stats row | Run duration | Recent deploys |
|---|---|---|---|
| 320 to 899 | 2 × 2 grid. Each tile: label, number, subline. 1px `--rule` divider between the columns, 2px `--border` top rule per row. | Rail (eyebrow, h2, subline) stacked over the body. Each bar row stacks: label (service, sha, status word for failed or canceled) on one line, then the bar with its value at the bar end. | One row per run, stacked: status and started age on the first line, then service and sha with the commit message, then branch, author and duration, then "Open log" (left aligned). |
| 375 | Same as 320. | Same. | Same. |
| 700 to 899 | Same as 320. | Same. | Row becomes a 3-column grid: status (9.5rem) · service, sha, message over branch, author, duration · age over "Open log" (right aligned). |
| 900 to 1023 | 4 tiles in one row, `--rule` dividers between them. | 12-column grid: rail in columns 1 to 3, body in 5 to 12. Each bar row is 2 columns: label (up to 15rem) and the bar track. | Same 3-column row as 700, inside the 5 to 12 body. |
| 1024, 1280 | Same as 900. | Same as 900. | Same as 900. |

**Fluid rules.**
- The stat number is `clamp(1.75rem, 20cqi, 6.5rem)` in `--font-display` 800, with each tile a `container-type: inline-size`, so "12,480" fits a 320px tile on one line. Longer values ("67m 01s") wrap at the space, never mid-number. `overflow-wrap: anywhere` is the last resort.
- Bar width = `(track − 8ch) × duration / max`, so the value label always fits at the bar end. Minimum bar width is 4px, so a very short run still shows a mark.
- Service names, branches, commit messages and authors wrap with `overflow-wrap: anywhere`. Nothing is truncated or clamped. The sha and the duration never wrap.
- **No horizontal scroll at any width, and there's no scroll region** (Chief of Creatives ruling). Gate: `v11gate.cjs` checks for h-scroll at 320, 375, 768, 1024 and 1280.

## H-2 Semantics and structure
- **Stats row:** `div role="group"` labelled by a visually hidden h3 "Run stats". Each tile is plain text: label, number, subline. Tiles aren't interactive, so there are no Tab stops.
- **Run duration:** h2 "Run duration" (no trend claim). A `figure` labelled by the h2, whose `figcaption` holds the text summary and the scale line, and then the view:
  - **Chart view (default):** an `ol` of up to 8 `li`. Each `li` carries the label text (service, sha, status word when failed or canceled), an `aria-hidden` bar, and the value as text. So a screen reader reads "checkout-api a41c9e2 FAILED 4m 12s" for every point, and the visual bar adds nothing that isn't in text.
  - **Table view:** a `table` with caption "Run duration, {env}, newest first" and columns Run (`th scope="row"`: service and sha), Status (icon plus text), Duration. It has 3 columns and fits 320 without scroll (the global table `min-width` is overridden to 0).
  - **Toggle:** a `button` "Show as table" with `aria-pressed` (false = chart, true = table) and `aria-controls` the view. The label doesn't change; the pressed state carries the meaning. It's hidden when there's nothing to chart.
- **Recent deploys:** h2 "Recent deploys", subline "Newest 5 in {env}." An **`ol`** (not a table), because the rows are a time-ordered sequence of 5 mixed-content items, read item by item on a phone, and the full sortable table already exists below. A list says "list, 5 items" and keeps the order. Each `li` is: status (icon plus text), started age, service (`b`), sha, message, then branch, author and duration with visually hidden prefixes ("Branch", "by", "Duration", "Started") so the mono values aren't anonymous. One row action, "Open log" (`aria-label` "Open log for {service} {sha}"). There's no whole-row click target and no nested interactives.
- "Open log" reuses the v1.0 log drawer as-is (native dialog, signed `--scrim`, `--dialog-border`, focus returns to the button that opened it).

## H-3 Navigation
No new navigation. The env tabs drive all three: switching tabs re-derives every number, bar and row for that env. "View all {env} runs" is a 44px link that scrolls to the runs table region and focuses it.

## H-4 States
Tokens and shapes are as in v1.0 H-4. Status shapes: Succeeded square, Failed diamond, Running thin bar, (prototype) In progress circle, Canceled hollow square, always with the word.

| State | Stats row | Run duration | Recent deploys |
|---|---|---|---|
| Populated | Runs: count, subline "in {env}". Failed: diamond icon plus count (never red alone), subline "Newest {age}" from the newest failed run. Running: count, subline "Not finished yet". Median duration: value, subline "of {n} finished". | Summary "Fastest {min}, slowest {max}, median {median} across {n} finished runs." Scale line "Scale: 0 to {max}, the longest run shown in {env}." Bars newest at the top, up to 8. Succeeded: solid `--text` bar. Failed: `--danger` 135° hatch, 2px `--danger` edge, plus the word FAILED. Canceled: `--text-muted` 45° hatch, 2px edge, plus CANCELED. | Newest 5 rows by `started`, then "View all {env} runs". |
| Loading | Each number is a `--surface-muted` skeleton bar (`aria-hidden`); the group gets `aria-busy="true"`. No shimmer. | 4 skeleton bars, view `aria-busy`, no summary, toggle hidden. | 3 skeleton rows (`aria-hidden`), list `aria-busy`, no "View all". |
| Load error | Every number is an em dash, every subline "Not available". | Static line "Run duration isn't available.", toggle hidden. | Static line "Recent deploys aren't available." |
| Empty env (0 runs) | Runs 0, Failed 0 (no icon, subline "None"), Running 0, Median em dash with "No finished runs". | "No finished runs in {env} yet. Durations show up here when a run finishes." Toggle hidden. | "No deploys in {env} yet." No "View all". |
| 0 finished (only running) | Median is an em dash with "No finished runs", **not "0m 00s"**. Running shows its count. | Same line as Empty env. | Rows show; duration reads "In progress". |
| Running is 0 | "0", subline "None now". No spinner, no motion. | n/a | n/a |
| 1 finished run | Median is that run's duration, "of 1 finished". | One bar at full track width. Summary "1 finished run, {duration}." (no fastest or slowest). Scale "0 to {duration}". | n/a |
| Long values | 5-digit counts ("12,480", "1,245") stay on one line at 320; "67m 01s" wraps at the space. | Long services ("notifications-worker-eu-west") wrap in the label; the bar and value stay on their line. | Long branches ("feature/checkout-3ds2-challenge-flow-fallback-for-legacy-cards"), 100-character messages and long authors wrap; nothing is cut off. |
| Focus | v1.0 ring: 3px solid `--focus-ring-color`, 3px offset, on the toggle, "Open log", "View all" and the preview buttons. | | |

**One alert per load (decision D-2).** All three read the same `runs` load as the v1.0 table, so a failed load must not raise four alerts. In the app, the table's existing `role="alert"` "Couldn't load deploys" with Retry is the only alert; the three v1.1 parts show their static not-available text. Loading likewise reuses the existing polite "Loading runs" status, and the parts just set `aria-busy`. The prototype's own alert ("Couldn't load the dashboard" with Retry) and its "Loading dashboard" status stand in only because its v1.1 preview buttons run independently of the table's preview links.

**Scale per env (Chief of Creatives).** Bars scale to the longest run shown in that env, so the same length means different times on different tabs. The scale line states the max as text, and the summary states the range, so switching tabs can't mislead.

Prototype preview buttons ("v1.1 states"): Populated, Loading, Load error, Empty, No finished runs, One finished run, Long values. They're prototype only, not for the app.

## H-5 Touch targets
Every target is at least 44px tall (`--target-min`): "Open log" 48px (`.btn`), "Show as table" 48px, "View all {env} runs" 44px inline-flex, preview buttons 44px, and the doc link 44px (`.doclinks`). Stat tiles and bars aren't targets. Gate: `v11gate.cjs` counts targets under 44px in the v1.1 area at every width and state, and finds 0.

## H-6 Motion
| Motion | Purpose | Duration and easing | Reduced motion |
|---|---|---|---|
| Bar draw-in | Bars grow from the left on render | `--duration-base` 260ms, `--ease-standard`, `transform: scaleX` from 0 | `animation: none`; bars render at full length at once (gated) |
| Line reveal on the blocks | Same as v1.0 sampler `.reveal` | `--duration-reveal`, `--ease-standard` | Opacity 1, no transform |
| Skeletons | Loading | Static, no shimmer | Same |

The numbers don't count up or animate. Nothing flashes.

## H-7 Tokens and contrast
**No new tokens.** It uses `--text`, `--text-muted`, `--danger`, `--success`, `--info`, `--warning`, `--border`, `--rule`, `--border-subtle`, `--surface-muted`, `--focus-ring-color`, `--target-min`, `--font-display`/`-body`/`-mono`, `--duration-base`, `--ease-standard`, `--border-width`. Bars use `--text`, not `--accent`: kinetic's accent is red (`#C21807` / `#FF6B57`) and would read as failure.

Contrast against `--color-bg`, from [v11-contrast.mjs](v11-contrast.mjs) (output in [handoff/v11/contrast.txt](handoff/v11/contrast.txt)): **22 pairs, 0 fail.**

| Pair | Use | Min | Light | Dark |
|---|---|---|---|---|
| `--text` | numbers, labels, bar values, table text | 4.5 | 14.95 | 17.60 |
| `--text-muted` | sublines, scale line, meta | 4.5 | 7.38 | 11.33 |
| `--danger` | FAILED word | 4.5 | 7.40 | 8.87 |
| `--success` | SUCCEEDED word | 4.5 | 6.24 | 11.42 |
| `--info` | RUNNING word | 4.5 | 8.95 | 8.91 |
| `--warning` | IN PROGRESS word (prototype) | 4.5 | 6.41 | 12.16 |
| `--text` | succeeded bar (mark) | 3 | 14.95 | 17.60 |
| `--danger` | failed hatch stripes and edge (mark) | 3 | 7.40 | 8.87 |
| `--text-muted` | canceled hatch stripes and edge (mark) | 3 | 7.38 | 11.33 |
| `--border` | chart baseline, stat and list top rules | 3 | 8.95 | 8.91 |
| `--focus-ring-color` | focus ring | 3 | 8.95 | 12.14 |

`--rule` / `--border-subtle` dividers are decorative (as in v1.0). The hatches aren't colour-only: failed and canceled differ by angle and stripe width, and both carry the status word.

## H-8 Annotated screenshots and gates
Shots are of the v1.1 area only, in `handoff/v11/`, lossless truecolor PNG. Green boxes are structure (group, figure, ol, table, alert), purple boxes are headings, and pink boxes are targets with their size in px.

| State | 320 | 1280 |
|---|---|---|
| Populated | [light](handoff/v11/kinetic-v11-populated-320-light-annotated.png) · [dark](handoff/v11/kinetic-v11-populated-320-dark-annotated.png) | [light](handoff/v11/kinetic-v11-populated-1280-light-annotated.png) · [dark](handoff/v11/kinetic-v11-populated-1280-dark-annotated.png) |
| Table view | [light](handoff/v11/kinetic-v11-table-320-light-annotated.png) | [light](handoff/v11/kinetic-v11-table-1280-light-annotated.png) |
| Loading | [light](handoff/v11/kinetic-v11-loading-320-light-annotated.png) | [light](handoff/v11/kinetic-v11-loading-1280-light-annotated.png) |
| Load error | [light](handoff/v11/kinetic-v11-error-320-light-annotated.png) | [light](handoff/v11/kinetic-v11-error-1280-light-annotated.png) |
| Empty | [light](handoff/v11/kinetic-v11-empty-320-light-annotated.png) | [light](handoff/v11/kinetic-v11-empty-1280-light-annotated.png) |
| No finished runs | [light](handoff/v11/kinetic-v11-nofin-320-light-annotated.png) | [light](handoff/v11/kinetic-v11-nofin-1280-light-annotated.png) |
| One finished run | [light](handoff/v11/kinetic-v11-one-320-light-annotated.png) | [light](handoff/v11/kinetic-v11-one-1280-light-annotated.png) |
| Long values | [light](handoff/v11/kinetic-v11-long-320-light-annotated.png) | [light](handoff/v11/kinetic-v11-long-1280-light-annotated.png) |

Plain shots drop `-annotated`. The v1.0 `handoff/kinetic-dashboard-*` shots are left as signed. They still show the old sampler, which this addendum replaces.

**Gate results** ([handoff/v11/gate.txt](handoff/v11/gate.txt)): **82 checks, 0 fail.** 5 widths × 2 modes × 8 states: h-scroll 0, targets under 44px 0, clipped text 0, axe (v1.1 area) 0, and no JS errors. Keyboard: Tab reaches "Show as table" and it swaps in the table (`aria-pressed` true); "Open log" opens the drawer and Close returns focus. Reduced motion: bar animation `none`.

**Rerun** (from `docs/directions/v3`, with playwright-core and @axe-core/playwright on `NODE_PATH`):
```
python3 -m http.server 8942
node kinetic/v11-contrast.mjs
node kinetic/v11gate.cjs http://127.0.0.1:8942/kinetic/index.html
```

## For the builder (when v1.1 is scheduled)
- **Builder:** FED, scheduled by CTE, after CA signs this addendum.
- Derive in one place from the already-loaded `runs` for the selected env (a small pure helper next to `format.ts`: `stats(runs)`, `durationBars(runs, 8)`, `recent(runs, 5)`), unit-tested for: 0 runs, 0 finished, 1 finished, even and odd median, and a 5-digit count.
- Reuse `StatusBadge` for every status (icon plus text) and the existing log drawer for "Open log".
- Don't add a chart library. The chart is an `ol` with CSS bars (H-2).
- **Decisions for CA:** D-1, the order of the parts in the tab panel (H-1); D-2, one alert per load (H-4).

## Copy (requested from UI Copywriter, 2026-11-11)
**The strings below are working strings, not final copy.** UI Copywriter supplies the final text, and it replaces these before CA's sign. `{env}`, `{n}`, `{age}`, `{min}`, `{max}`, `{median}`, `{duration}`, `{service}` and `{sha}` are variables.

| ID | Where | Working string |
|---|---|---|
| V11-1 | Stats group name (hidden) | Run stats |
| V11-2 | Stat labels | Runs · Failed · Running · Median duration |
| V11-3 | Runs subline | in {env} |
| V11-4 | Failed subline | Newest {age} · None |
| V11-5 | Running subline | Not finished yet · None now |
| V11-6 | Median subline | of {n} finished · No finished runs |
| V11-7 | Stat not available (error) | Not available |
| V11-8 | Chart eyebrow, h2, subline | Builds · Run duration · Newest 8 finished runs in {env}. |
| V11-9 | Chart summary | Fastest {min}, slowest {max}, median {median} across {n} finished runs. |
| V11-10 | Chart summary, 1 run | 1 finished run, {duration}. |
| V11-11 | Scale line | Scale: 0 to {max}, the longest run shown in {env}. |
| V11-12 | Toggle | Show as table |
| V11-13 | Table caption and headers | Run duration, {env}, newest first · Run · Status · Duration |
| V11-14 | Chart, nothing finished | No finished runs in {env} yet. Durations show up here when a run finishes. |
| V11-15 | Chart, error | Run duration isn't available. |
| V11-16 | List eyebrow, h2, subline | Log · Recent deploys · Newest 5 in {env}. |
| V11-17 | Row hidden prefixes | Started · Branch · by · Duration |
| V11-18 | Row action and its name | Open log · Open log for {service} {sha} |
| V11-19 | Running duration | In progress |
| V11-20 | Link to the table | View all {env} runs |
| V11-21 | List empty | No deploys in {env} yet. |
| V11-22 | List error | Recent deploys aren't available. |
| V11-23 | Prototype only: alert, Retry, status | Couldn't load the dashboard · Check your connection, then try again. · Retry · Retrying… · Loading dashboard |
