# HANDOFF: v3 direction D "kinetic", Kinetic Swiss

From UX/UI Designer, 2026-11-10, 5:58 PM PT. Card from Chief of Creatives (John's order, relayed by ECOS at 5:09 PM PT).

## Goal and John's ask
A completely new design direction for all 3 UX projects (Ember UI sampler, job tracker board, dev dashboard overview), clearly unlike A, B, C, v1, v2 and the other v3 directions. D is Kinetic Swiss: big variable-weight type on an asymmetric 12-column grid, no cards, cobalt on warm white with a signal red accent, and type-led motion. Only token values and art direction change; the R-2 token structure stays.

John's words, quoted in BRIEF.md: "make the design way different across all 3 UX projects (Ember UI + Storybook, job tracker, dev dashboard)."

## DONE criteria for this card (Chief of Creatives)
- index.html: a clickable mobile-first prototype with the Ember sampler, job tracker board and dev dashboard overview, linked, with a light/dark toggle.
- tokens.css in R-2 shape using the semantic names from docs/themes/r2/semantic.css, plus TOKENS.md as a swatch sheet.
- CONTRAST.md from the docs/themes/r2/contrast.mjs logic, with 0 fails in light and dark.
- PNGs at 375 and 1280 px, light and dark.
- axe at 0 serious/critical and 0 horizontal overflow.
- Branch and PR in balbonits/a11y-design-system, merged once its own checks pass, viewable at the raw.githack link below, and the link sent to Chief of Creatives and Visual QA. Nits go to follow-ups.

## Links
- Prototype: https://raw.githack.com/balbonits/a11y-design-system/main/docs/directions/v3/kinetic/index.html (screens: #components, #tracker, #dashboard, #tokens)
- Token sheet: https://raw.githack.com/balbonits/a11y-design-system/main/docs/directions/v3/kinetic/TOKENS.md
- Contrast report: https://raw.githack.com/balbonits/a11y-design-system/main/docs/directions/v3/kinetic/CONTRAST.md
- PR: https://github.com/balbonits/a11y-design-system/pull/9 (branch design/v3-kinetic)
- Brief: /workspace/ux-projects/directions/v3/BRIEF.md on the shared bot computer
- Sibling direction F (Chief of Creatives): /workspace/ux-projects/directions/v3/neo

## Files in this folder
- index.html, the prototype. It loads tokens.css and ../shared/proto.js.
- gen.py writes tokens.json, tokens.css and TOKENS.md via ../shared/tokgen.py. Edit colors there, never in tokens.css by hand.
- CONTRAST.md, written by `node ../shared/contrast.mjs .` (60 pairs).
- kinetic-<components|tracker|dashboard>-<light|dark>-<m|d>.png: m is 375x812 and d is 1280x800.
- handoff_data.py writes this file via ../shared/handoff.py.
- Shared tooling in ../shared, used by every v3 direction (rule of three): tokgen.py, contrast.mjs, shoot.cjs (axe, overflow and screenshots; run from docs/directions with NODE_PATH set to /workspace/ux-projects/directions/node_modules) and proto.js (mode toggle, routing, ticker pause, toast, modal, tabs, swatches).

## Art direction as built
- Type: Bricolage Grotesque, variable 300 to 800, for display; Instrument Sans for body (17 px base); IBM Plex Mono for labels and data. All from Google Fonts, with system fallbacks.
- Color: warm white #FBF8F1 paper, cobalt #0A1B5C text, #1434B8 rules and focus, signal red #C21807 for primary actions and the second headline line. Dark mode is a cobalt night (#070F33) with warm white text and a #FF6B57 red.
- Layout: a 12-column grid with a 3-column label rail and a 9-column body offset to column 5. There are no cards, shadows or rounded boxes: sections are split by 1 px rules, fields are underlined, and tabs and nav use a red underline. The only solid band is the cobalt ticker.
- Motion, all from tokens: headlines reveal line by line (--duration-reveal 700ms, --stagger 90ms), the hero headline lightens from 800 to 300 weight over the first 600 px of scroll (--weight-shift), and a marquee ticker runs on --duration-ticker 36s.
- Tracker: 5 stage columns split by vertical rules at 1000 px and up; stacked stages on mobile. Dashboard: oversized numerals in a ruled 4-up grid (2-up on mobile), a hairline line chart and a ruled deploy log.

## Accessibility decisions
- Reduced motion: every duration is 0, the weight stays at 800, line reveals show at once and the ticker starts paused.
- The ticker has a visible "Pause ticker" button (aria-pressed) per WCAG 2.2.2. Its text is aria-hidden, with one sr-only copy that is read once.
- Focus is a 3 px outline in --focus. Inside the cobalt ticker band, --focus is set locally to --highlight-contrast, because cobalt focus on cobalt would be 1:1. That pair is not in the contrast gate.
- Status is never color only: each status has text plus a different glyph shape (square, circle, diamond, bar).
- Route hashes (#components and the rest) select sections with ids prefixed v-, so the page never scroll-jumps under the sticky header.
- Modal: native dialog, focus starts on Cancel, Esc closes it and focus returns to the opener. Tabs use arrow keys, Home and End. Toasts are role=status.
- Targets are at least 44 px; buttons are 48 px.

## Self-check results
- Contrast: 60 pairs, 0 fails (text 4.5:1, UI and focus 3:1) in kinetic-light and kinetic-dark.
- shoot.cjs at 375 and 1280, light and dark, on all 4 screens: axe 0 serious/critical and 0 horizontal overflow ("kinetic bad 0").
- I looked at all 12 PNGs.

## Prior decisions this follows
- BRIEF.md: banned A/B/C and v1/v2 palettes, type, layouts, blobs, glass and reference sites; R-2 structure kept.
- --highlight and --highlight-contrast are proposed additions, the same names direction F uses.
- Microcopy follows UI Copywriter's V3-STATE-COPY.md (pasted below): tracker h1 "Board", the delete dialog, button samples and toasts.
- Mode is stored under the existing jdilig:mode key.

## Known issues and open questions
- The dashboard overview shows stats, a chart and a deploy list, which DASH-SPEC v1.0 does not include (it is one Deploys table). The values are labeled example data. Chief of Creatives needs to decide whether those blocks belong in the spec; until then, treat them as art-direction samples, not spec.
- Fonts load from Google Fonts. Offline, the system fallbacks show and the variable-weight scroll shift is lost.
- Nit for a follow-up: at 375 the "Dark mode" button wraps under the logo, so the header takes 2 rows plus the nav.
- Not drawn: tracker empty, loading and error states, and the dashboard log drawer. The prototype covers default screens only, as the brief asks.

## Dependencies
- Chief of Creatives signs off on art direction and tokens.
- Visual QA reviews axe, contrast and visuals once the link lands.
- FSD maps the chosen tokens into R-2 after John picks a direction.
- Direction F lives in the box folder /workspace/ux-projects/directions/v3/neo, not yet in the repo. It can use ../shared too.
- The v3 README that links D, E and F is owned by Chief of Creatives.

## Who to ask
- Prototype screens, layout or a11y in this file: UX/UI Designer.
- Art direction, palette and tokens: Chief of Creatives (5f6ac1e2-23a1-42d9-9f0d-1e93e47f6686).
- A11y rulings and standards: Chief Architect.
- Copy: UI Copywriter (a607b34c-a81f-46c8-8292-a4d70ba322c0).

## ETA and next steps
- D merged by 6:15 PM PT, ahead of the 7:30 PM PT target.
- Next: direction E "dusk" on branch design/v3-dusk, target 8:00 PM PT.

## State microcopy (pasted from /workspace/ux-projects/copy/V3-STATE-COPY.md, UI Copywriter, 2026-11-10)
The prototype uses these strings where its screens show the same component. The dashboard stats, builds list and chart rows are left out on purpose: they are pending a Chief of Creatives decision because DASH-SPEC v1.0 doesn't include them.

## 1. Dev dashboard (/ux/dev-dashboard/)

Terms: the page is **Deploys**. One row is a **run**. The statuses are **Succeeded, Failed, Running, In progress and Canceled**, which are the code's set. The wireframe's "Passed" is retired.

| Component | State | Exact text | aria-live / notes |
|---|---|---|---|
| Prototype note | Default | "Prototype with fictional services and runs. Nothing here is real data." | Static `aside`, label "About this prototype". Already in the code. |
| Prototype note | Previewing a state | "Previewing the {state} state." + link "Exit preview" | Static |
| Header | Default | h1 "Deploys"; Button "Keyboard shortcuts" (icon-only at 320 px with aria-label "Keyboard shortcuts") | aria-keyshortcuts="?" |
| Environment Tabs | Default | "Production", "Staging", "Preview" | Tabs label "Environments"; the table caption is "{Env} runs" |
| Search Input | Default | Label "Search runs"; hint "Service, commit, branch or author" | aria-keyshortcuts="/" |
| Alert banner | Failures on load | Heading "Failed deploys"; text "{n} {Env} deploys failed in the last hour." (singular: "1 {Env} deploy failed in the last hour."); Button "View failing deploy" | Static region with a heading, no live role (CA ruling 3). {n} is counted from the data, never hard-coded. |
| Alert banner | New failure after load | Same text as above | role=status (polite). It's info, not a load error. |
| Filter bar | Default | Selects "Status" ("All statuses") and "Service" ("All services"); Input "Branch"; Button "Clear filters" | Group label "Filters" |
| Filter bar | Clear filters with no filters set | Button "Clear filters" disabled; hint "No filters to clear." | The hint sits next to the button, so the reason is visible |
| Result count | Default | "{n} of {total} runs shown" (singular: "1 of {total} runs shown") | Polite. It updates after filtering. Debounce while typing in search. |
| Table | Sorted | Column header buttons "Status", "Service", "Commit", "Branch", "Author", "Started", "Duration"; the Actions column header is "Actions" (sr-only) | aria-sort on the sorted header. No extra announcement. |
| Row action | Default | Button "Open log" with aria-label "Open log for {service} {sha}" | Enter opens it |
| Status cell | Each status | Icon + "Succeeded" / "Failed" / "Running" / "In progress" / "Canceled" | Text is always shown. Never color only. |
| All green | No failures in env | "All deploys healthy in {Env}." | Static. No banner. Already in the code. |
| No results | Filters match nothing | "No runs match these filters." + Button "Clear filters" | The result count announces "0 of {total} runs shown" |
| Loading | First load or Retry | Skeleton rows; status text "Loading runs" | Table aria-busy="true"; skeleton aria-hidden; one polite status (CA ruling 4). **The code currently says "Loading deploys", so change it to "Loading runs".** |
| Load error | Fetch failed | Banner heading "Couldn't load deploys"; text "Check your connection, then try again."; Button "Retry" | role=alert (assertive), present only after the failure. Focus stays put. |
| Load error | Retrying | Button "Retrying…" disabled; aria-busy on the table | The polite status "Loading runs" plays again |
| No data yet | Env has zero runs (not filtered) | "No runs in {Env} yet. Runs show up here after the first deploy." | Static. No Clear filters button, because no filter caused it. **The code's "No runs to show until deploys load." is replaced by this.** |
| Log drawer / Modal | Open | Heading "{service} run {sha}"; status line "{Status} · started {time} · {duration}"; Buttons "Close", "Jump to first error", "Copy link to this run"; log region label "Log output" | Focus goes to the heading on open. Esc closes it and focus returns to the row. |
| Log drawer | No errors in log | Button "Jump to first error" disabled; hint "No errors in this log." | Visible hint |
| Log drawer | Log loading | "Loading log" | Polite |
| Log drawer | Log failed | "Couldn't load this log." + Button "Retry" | Assertive (role=alert) inside the drawer |
| Toast | Link copied | "Link copied" | Polite (success) |
| Toast | Copy failed | "Couldn't copy the link. Select it and copy it by hand." | Assertive (error toast). The link is also shown as selectable text. |
| Shortcuts Modal | Default | Title "Keyboard shortcuts"; Checkbox "Single-key shortcuts" with hint "Turn off if they clash with your screen reader or speech input. Enter and Esc always work."; key list "/ Search", "f Filters", "j Next run", "k Previous run", "Enter Open log", "Esc Close log", "? Show this list"; Button "Close" | The list must match the keymap (a test checks it) |
| Shortcuts Modal | Storage blocked | Hint under the Checkbox: "This setting won't be saved on this device." | Static. The setting still works for this visit. |
| Toast | Shortcuts toggled | "Single-key shortcuts on" / "Single-key shortcuts off" | Polite |


---

### 2. Job tracker (/ux/job-tracker/)

These include the review fixes F4 to F6 and the glossary terms. The text is final for the v3 retrofit.

| Component | State | Exact text | aria-live / notes |
|---|---|---|---|
| Prototype note | Default | "Prototype with fictional demo data, saved only in this browser." | Static |
| Prototype note | Previewing a state | "Previewing the {state} state." + "Exit preview" | Static |
| Nav | Default | "Board", "Reminders" (badge "{n}" with sr-only ", {n} due"), "Settings" | nav aria-label "Main" |
| Board | Default | h1 "Board"; Button "Add role"; mobile tabs "{Stage} ({n})" | |
| Board | Loading | Skeleton cards; status "Loading roles" | Polite. No shimmer under reduced motion. |
| Board | Empty | "No roles yet. Add the first one you're interested in." + Button "Add role" | Static |
| Column | Empty | "No roles in {Stage}." | Static |
| Save error banner | Storage blocked or full | "Can't save changes on this device right now. Export your data to keep a copy." + Button "Export data" | role=alert when it appears after a failed save; a static region when present on load |
| Role card | Default | Company; title link; age "Saved / Applied / Started interviewing / Got an offer / Closed {today / yesterday / N days ago}"; chip "Reminder: {text}, {date}" | |
| Move or edit | Default | Button "Move or edit" with aria-label "Move or edit {title} at {company}"; Select "Move to stage"; Buttons "Edit", "Delete" | aria-expanded on the button |
| Move or edit | Moved | Toast "Moved to {Stage}" with message "{title} at {company}." | Polite |
| Delete confirm | Dialog | Title "Delete this role?"; body "{title} at {company} and its reminders will be removed."; Buttons "Cancel", "Delete role" | Focus starts on Cancel |
| Delete confirm | Deleted | Toast "Role deleted" + action "Undo" | Polite. It stays until dismissed (Ember v0.2.2). |
| Delete confirm | Undone | Toast "Role restored" | Polite |
| Add role | Default | Title "Add role"; "Job link" (hint "Optional. Paste the posting URL."), "Company", "Title", "Stage", Checkbox "Set a reminder", "Reminder date"; Buttons "Cancel", "Save role" | |
| Add role | Errors | "Enter the company name." / "Enter the job title." / "Enter a full link that starts with https://" / "Pick a date for the reminder." | Tied with aria-describedby. Focus moves to the first invalid field. |
| Add role | Saved | Toast "Role saved" with message "{title} at {company}." | Polite |
| Edit role | Default / saved | Title "Edit role"; Buttons "Cancel", "Save changes"; toast "Role updated" | Polite |
| Role detail | Default | Back link "← Board"; "Stage"; "Open posting" (sr-only " (opens in a new tab)") or "No posting link saved."; tabs "Overview", "Notes", "Timeline" | |
| Role detail | Loading | "Loading role" | Polite |
| Role detail | Not found | h1 "Role not found"; "This role was deleted or never existed on this device." + "Go to Board" | Static |
| Overview | Fields | "Applied" ("Not yet"), "Last updated", "Open reminders" ("None"); "Salary range" (hint "Optional. For example, $120k to $140k."); "Contacts" (hint "Optional. Recruiter or hiring manager name.") | The salary hint is an input format example, not data |
| Notes | Autosave | "Notes save as you type." / "Saving…" / "Saved" / "Not saved on this device" | Polite (role=status on the hint) |
| Reminders | Default | h1 "Reminders"; groups "Overdue", "Today", "This week", "Later"; Buttons "Mark done", "Snooze 3 days" | aria-labels "Mark done: {text}" and "Snooze 3 days: {text}" |
| Reminders | Loading | "Loading reminders" | Polite |
| Reminders | Empty | "Nothing due. You're caught up." + "Go to Board" | Static |
| Reminders | Done / snoozed | Toast "Marked done" + "Undo"; toast "Snoozed for 3 days" | Polite |
| Reminders | Role gone | "Deleted role" | Static |
| Export data | Default | Heading "Export"; "Download every role and reminder as a JSON file. Your data lives only in this browser."; Button "Export data" | |
| Export data | Nothing to export | Button disabled; hint "Nothing to export yet." | Visible hint |
| Export data | Downloaded | Toast "Export downloaded" | Polite |
| Export data | Failed | Toast "Couldn't export. Try again." | Assertive (error toast) |
| Demo data | Default / done | "Replace everything with the fictional sample roles."; Button "Reset demo data"; toast "Demo data restored" | Polite |
| Preview states | Links | "Empty board", "Loading", "Can't save", "Exit preview" | |
| Clear all data | Default | Heading "Clear all data"; "Delete every role and reminder on this device."; Button "Clear all data" | |
| Clear all data | Dialog | Title "Clear all data?"; body "This removes {n} roles and their reminders from this device. It can't be undone, so export first if you want a copy." (singular: "1 role and its reminders"); Buttons "Cancel", "Clear all data" | Focus starts on Cancel |
| Clear all data | Cleared | Toast "All data cleared" | Polite |
| Clear all data | Nothing to clear | Button disabled; hint "Nothing to clear." | Visible hint |

---

### 3. Ember UI Storybook showcase (/ux/design-system/storybook/)

Story sample text is generic and labeled as an example. Every docs page uses the same intro line: "Example content. Swap in your own copy."

| Component | State | Exact text | aria-live / notes |
|---|---|---|---|
| Button | Default / variants | "Save changes" (primary), "Cancel" (secondary), "Learn more" (ghost), "Delete" (danger) | |
| Button | Loading | "Saving…" | aria-busy="true"; the label change is enough, with no extra live region |
| Button | Disabled | "Save changes" + hint "Fill in the required fields to save." | Story note: "Say why it's disabled in visible text." |
| Button | Icon-only | aria-label "Close" / "Settings" | |
| Input | Default | Label "Email"; hint "We'll only use this to reply to you." | Example story |
| Input | Required | Label "Email" + marker "(required)" | |
| Input | Error | "Enter an email address like name@example.com." | aria-describedby; aria-invalid |
| Input | Disabled | Label "Account ID"; hint "Set by your admin." | |
| Select | Default / error | Label "Country"; placeholder option "Choose a country"; error "Choose a country." | |
| Checkbox | Default / error | "Email me about updates"; required example "I agree to the terms" with error "Check this box to continue." | |
| Modal | Confirm | Title "Discard changes?"; body "Your edits on this page will be lost."; Buttons "Cancel", "Discard changes" | Focus trap; Esc closes; focus returns to the opener |
| Modal | Destructive | Title "Delete this item?"; body "This can't be undone."; Buttons "Cancel", "Delete item" | Focus starts on Cancel |
| Tabs | Default | "Overview", "Details", "History" | Arrow keys, Home and End |
| Table | Default | Caption "Example orders" | Sample rows are fictional |
| Table | Empty | "No rows to show." | Static |
| Table | Loading | "Loading rows" | aria-busy on the table + one polite status |
| Table | Error | "Couldn't load rows." + Button "Retry" | role=alert |
| Table | Sorted | Header button text unchanged | aria-sort only |
| Toast | Success | Title "Saved" | role=status (polite) |
| Toast | Info + action | Title "Item deleted"; action "Undo" | Polite; stays until dismissed |
| Toast | Error | Title "Couldn't save"; message "Check your connection, then try again." | role=alert (assertive). Never the only place an error is shown. |
| Theme toolbar | Default | "Theme" and "Mode" ("Light", "Dark") | Storybook toolbar labels |
| Tokens story | Default | "Each text and background pair, with its contrast ratio." | Ratios come from contrast.mjs output, never typed in by hand |

---
