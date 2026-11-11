# F "neo" HANDOFF: Ember UI + Storybook

Identity for **Ember UI and its Storybook** (balbonits/a11y-design-system). Chunky and rounded: cream paper, 2px ink outlines, offset solid shadows, pill nav, stickers that tilt. The other two projects get their own identities (job tracker = dusk, dev dashboard = kinetic), so nothing here carries over to them.

- Prototype: [index.html](https://raw.githack.com/balbonits/a11y-design-system/main/docs/directions/v3/neo/index.html) (views `#components`, `#tracker`, `#dashboard`, `#tokens`; the tracker and dashboard views are Ember component demos, not those products' designs)
- Tokens: [TOKENS.md](TOKENS.md), [tokens.css](tokens.css), [tokens.json](tokens.json) (registry-ready, theme id `neo`, modes `light` and `dark`)
- Contrast: [CONTRAST.md](CONTRAST.md), 64 pairs plus 18 scrim rows, 0 fails
- Screens: [handoff/](handoff/), plain and annotated, every width in light and dark
- Re-run checks locally: `python3 -m http.server 8931` in this folder, then `node annotate.cjs` (axe, overflow, text spacing, 200% zoom, annotated shots) and `node shoot.cjs` from `..` (all 4 views)

Verified 2026-11-10, 6:40 PM PT, local Chrome: axe 0 serious or critical, 0 horizontal overflow at 320, 375, 768, 1024 and 1440 in light and dark, 0 overflow and 0 clipped text with the WCAG 1.4.12 text-spacing override, 0 overflow at 200% zoom (640 CSS px), and every interactive target in all four views (components, tracker, dashboard, tokens) at or above `--target-min` (44px).

## H-1 Layout, mobile-first
320 is the base. Breakpoints use `min-width` only:

| Name | Query | What changes |
|---|---|---|
| base | none (320+) | One column. Nav pills wrap onto a second row under the logo. Stats 2 across. Tracker lanes scroll sideways with snap. |
| md | `(min-width: 760px)` | Nav moves inline beside the logo. `.cols-2` and `.cols-3` grids turn on. Stats 4 across. |
| lg | `(min-width: 1000px)` | Tracker lanes sit side by side with no scroll, and the "Swipe for more stages" cue hides. |

| dialog open | every width | The page sits under `--scrim`, the dialog backdrop: ink `#111111` at 45% in light (`#11111173`) and 55% in dark (`#1111118c`). It always dims the page, never lightens it, and page text under it stays recognizable (3:1 or more, see the Scrim section of [CONTRAST.md](CONTRAST.md)). The dialog is an opaque `--surface`, so its own contrast never depends on the scrim. Crops: 320 [light](handoff/neo-modal-scrim-320-light.png) and [dark](handoff/neo-modal-scrim-320-dark.png), 1280 [light](handoff/neo-modal-scrim-1280-light.png) and [dark](handoff/neo-modal-scrim-1280-dark.png). |

Frames: 320, 375, 768, 1024 and 1440, in [handoff/](handoff/) as `neo-<width>-<light|dark>.png`.

## H-2 Fluid rules
- Content max width 1180px (`.wrap`), side padding 1.1rem at every width.
- Type: h1 `clamp(2.4rem, 9vw, 5.2rem)` (page titles inside views `clamp(2rem, 7vw, 3.6rem)`), h2 `clamp(1.6rem, 5.5vw, 2.6rem)`, h3 1.15rem, body 1rem (16px), never smaller than 16px for body copy. Labels in mono may go to 0.78rem but are never the only label.
- Line length: prose capped at 56–65ch.
- Grids are `1fr` at base and switch at md. Stat tiles, panels and lanes use fr or `minmax()`, never fixed widths.
- Tables sit in a focusable scroll region (`role=region`, label "… scrolls sideways") with a 480px min table width, so the page never scrolls sideways.
- Dialog width `min(440px, 100vw - 2rem)`, backdrop `--scrim`; toast `max-width: calc(100vw - 2rem)`.
- Charts are SVG with `preserveAspectRatio="none"` at 100% width and fixed 110px height (decorative, the numbers are in text).
- No fixed heights on text containers. Controls set `min-height`, so text spacing and 200% zoom grow them instead of clipping.

## H-3 Nav per breakpoint
- Skip link "Skip to content" is the first Tab stop and moves focus to `<main id="main" tabindex="-1">`.
- Header: logo link, `<nav aria-label="Prototype screens">` with pill links (current page gets `aria-current="page"` plus the highlight fill and an ink border, so it isn't color alone), then the mode toggle (`aria-pressed`, stored in `jdilig:mode`).
- base: pills wrap to a full-width second row; no disclosure menu is needed with four items. If a product nav grows past six items, collapse it into a "Menu" disclosure button (`aria-expanded`, `aria-controls`) at base and show it inline from md.
- md and up: pills sit inline between the logo and the toggle.
- Focus order at every width: skip link, logo, nav pills left to right, mode toggle, ticker Pause, then main content top to bottom. It matches visual order; see the numbered annotated shots.
- Storybook: Ember's existing Storybook sidebar behavior stays (hidden at phone width, opened by its own button).

## H-4 Component states
Every state has a non-color cue. Shadow or press is never the only one.

| State | Treatment |
|---|---|
| Default | Surface fill, 2px ink border, `--shadow-raised` (4px 4px 0 ink). Primary uses `--accent` with `--accent-contrast` text. |
| Hover | Lifts 1px and tilts `--tilt` (-1.5deg); secondary buttons also fill `--accent-soft`, primary goes to `--accent-hover`. |
| Focus-visible | 3px `--focus-ring-color` ring (pink-600 `#e0217a` in both modes) with a 3px offset, so a strip of background sits between the ring and the ink outline. Ring contrast: 4.24 on bg, 4.20 against the ink border (light); 4.20 on bg, 4.24 against the cream border (dark). |
| Active / pressed | Moves 3px into its shadow, shadow drops to `--shadow-press`, and the fill changes (`--surface-muted`, or `--accent-hover` for primary). |
| Disabled | `disabled` attribute, dotted border, no shadow, `--surface-muted` fill, `--text-muted` text, `not-allowed` cursor. |
| Error | `aria-invalid="true"`, border goes to `--danger` at `--border-width-strong`, message linked by `aria-describedby` that starts with "Error:" and a "!" badge. |
| Loading | Buttons get `aria-busy="true"`, a spinner and a verb label ("Saving…"). Lists show skeleton bars inside `role="status"` with an accessible name. With reduced motion the spinner stops and turns dotted; the label still says what's happening. |
| Empty | Dashed `--border-subtle` box on `--surface-muted`, a bold one-line reason, and one action ("Go to Board", per the UX glossary). |
| Selected (tabs, nav) | Inverted fill (`--text` on `--color-bg`) or highlight fill plus border, along with `aria-selected` or `aria-current`. |
| Ghost button | Transparent fill, solid `--border-subtle` outline, no shadow (solid, so it never reads as a focus ring). |
| Status pills | Always text ("Passing", "Review", "Failing", "Info") with a currentColor outline; color is extra. |

All of these are in the "States" panel of the `#components` view. Dialog: Cancel and a confirm button, Esc closes, focus returns to the opener. Toast: `role="status"`, hidden until shown.

## H-5 Touch targets
Every target meets `--target-min` (44px), checked per view by `annotate.cjs`, which prints `SMALL` for anything under it (none now). `--control-height` is the visual height; the hit area is `max(var(--control-height), var(--target-min))`. Buttons and tabs are 44px tall, the logo link is 44px tall (it was 30px), prose links (TOKENS.md, CONTRAST.md and the footer link) are 44px-tall inline flex with 0.25rem side padding (they were 17px), nav pills 44px+, fields 48px, the checkbox's whole label row is 44px (the box itself is 24px inside it), the ticker Pause button 44×44 minimum. Gaps between targets are at least 0.35rem. The pink boxes in the 320 annotated shots show each target's size; none are flagged under 44.

## H-6 Motion
Only Ember's R-3 motion primitives. The prototype's two `@keyframes` (`tick`, `spin`) stand in for them; in Ember they must come from the existing R-3 primitives, and if Ember lacks a marquee or spinner primitive, CTE adds it to Ember rather than to the theme.

| Motion | Purpose | Duration and easing | Reduced motion |
|---|---|---|---|
| Button hover lift and tilt | Feels physical, shows it's pressable | `--duration-fast` 120ms, `--ease-press` | No transform; fill change remains |
| Button press | Confirms the press | 120ms, `--ease-press` | No transform; fill and shadow change remain |
| Card lift (tracker) | Shows the focused or hovered card | `--duration-base` 220ms | Off |
| Section reveal | Content eases in on scroll | `--duration-reveal` 520ms, `--ease-standard` | Shown at once |
| Ticker | Release-note marquee | `--duration-ticker` 28s loop, linear | Stopped. Always has a Pause/Play button (over 5s); full text is also available to screen readers |
| Spinner | Loading | `--duration-slow` 420ms loop | Stopped, dotted ring, label carries the meaning |
| Toast | Announces a result | 220ms slide | Appears without sliding |

Nothing flashes. Durations go to 0 and `--tilt`, `--lift` and parallax go to 0 under `prefers-reduced-motion: reduce`.

## H-7 Tokens
The full table for light and dark, with primitives and hex, is in [TOKENS.md](TOKENS.md); the registry-ready values are in [tokens.json](tokens.json) and [tokens.css](tokens.css). Shape tokens use Chief Architect's names:

| Token | Value |
|---|---|
| `--radius-sm` | 10px (fields, small fills) |
| `--radius-md` | 12px (buttons, toasts) |
| `--radius-lg` | 18px (panels, cards, dialogs, lanes) |
| `--radius-full` | 999px (pills, tabs, nav, stickers) |
| `--border-width` | 2px |
| `--border-width-strong` | 3px (header rule, error fields, Tabs indicator through `--tabs-indicator-width`, Toast stripe). Was 2.5px, which Chrome draws as 2px, the same as `--border-width`, so the selected tab indicator and error border looked no thicker than the baseline (VQA; Creatives ruled 3px) |
| `--shadow-raised` | `4px 4px 0 var(--border)` |
| `--shadow-press` | `1px 1px 0 var(--border)` |
| `--divider-shape` | `none` |
| `--focus-ring-color` | pink-600 `#e0217a` (both modes) |
| `--focus-ring-width` / `--focus-ring-offset` | 3px / 3px |
| `--focus-ring-style` | `solid` (never none or hidden) |
| `--control-height` | 44px (visual height) |
| `--control-padding-x` | 1.15rem |
| `--control-gap` | .5rem |
| `--target-min` | 44px (CI fails any hit area below it) |
| `--highlight` / `--highlight-contrast` | lime-400 / ink (light, 14.74:1); blue-600 / paper (dark, 6.63:1) |
| `--lift` / `--tilt` | -3px / -1.5deg; both 0 under reduced motion |
| `--scrim` | `#11111173` (ink at 45%) in light, `#1111118c` (ink at 55%) in dark: dialog and drawer backdrop (Addendum 7). Never built from `--text`, which is cream in dark and would lighten the page. |

This is the full locked set from ARCH-REVIEW Addendum 5. There are no aliases: `--radius` and `--focus` are deleted, and any leftover use fails QA. `--shadow-press` is never the only pressed cue (pressed buttons also shift 3px and change fill, current nav pills also take `--highlight`, and toggles carry `aria-pressed`), and `--divider-shape` is decorative only.

Contrast for every pair in both modes is in [CONTRAST.md](CONTRAST.md): text 4.5:1, borders, focus and states 3:1, 64 pairs, 0 fails, plus 18 scrim rows (every page color dims under `--scrim`, and page text under it stays at 3:1 or more).

## H-8 Annotated screenshots
`handoff/neo-<width>-<mode>-annotated.png` for 320, 375, 768, 1024 and 1440 in light and dark. Green dashed boxes are landmarks (header, nav, region, main, footer), purple boxes are heading levels (H1–H3), and pink numbered boxes are Tab stops in order with their size in px (red would mean under 44px; there are none). `handoff/neo-<width>-<mode>-annotated-top.png` is the same shot cropped to the first 900px viewport, for a quick look at header and nav.

| Width | Light | Dark |
|---|---|---|
| 320 | [plain](handoff/neo-320-light.png) · [annotated](handoff/neo-320-light-annotated.png) | [plain](handoff/neo-320-dark.png) · [annotated](handoff/neo-320-dark-annotated.png) |
| 375 | [plain](handoff/neo-375-light.png) · [annotated](handoff/neo-375-light-annotated.png) | [plain](handoff/neo-375-dark.png) · [annotated](handoff/neo-375-dark-annotated.png) |
| 768 | [plain](handoff/neo-768-light.png) · [annotated](handoff/neo-768-light-annotated.png) | [plain](handoff/neo-768-dark.png) · [annotated](handoff/neo-768-dark-annotated.png) |
| 1024 | [plain](handoff/neo-1024-light.png) · [annotated](handoff/neo-1024-light-annotated.png) | [plain](handoff/neo-1024-dark.png) · [annotated](handoff/neo-1024-dark-annotated.png) |
| 1440 | [plain](handoff/neo-1440-light.png) · [annotated](handoff/neo-1440-light-annotated.png) | [plain](handoff/neo-1440-dark.png) · [annotated](handoff/neo-1440-dark-annotated.png) |

## For the builder
- **Builder:** Full Stack Developer (FSD). Design sign-off comes from Chief Architect first, with Chief of Technology & Engineering copied.
- **Repo and branch:** `balbonits/a11y-design-system`, on FSD's `feat/r2-themes` branch (the R-2 theme registry). Source for this direction is `docs/directions/v3/neo/` (tokens.json, tokens.css, TOKENS.md, CONTRAST.md, index.html, handoff/).
- **Steps:**
  1. Add the Addendum 5 semantic tokens above to every Ember theme as an additive minor after v0.3.0 (themes that don't use one set it to `0` or `none`), then register `neo` from tokens.json.
  2. Swap component radius, border, shadow, focus and control sizes to these tokens; no per-theme component code.
  3. Set the dialog backdrop to `var(--scrim)` (today `src/ember.css` uses `color-mix(in srgb, var(--text) 45%, transparent)`, which lightens the page in dark).
  4. Wire the states in H-4 with the ARIA listed, and the motion in H-6 with its reduced-motion fallbacks.
- **Done means (all numeric):** at 320, 375, 768, 1024 and 1440 in light and dark (10 runs): axe 0 serious or critical, horizontal overflow 0, 0 overflow and 0 clipped text with the 1.4.12 text-spacing override, 0 overflow at 200% zoom; contrast CI passes every pair in CONTRAST.md (64 pairs, 0 fails, focus ring 3:1 or more against both bg and border); every hit area at or above `--target-min`; token lint passes with every Addendum 5 name defined in every theme and 0 uses of `--radius` or `--focus`; Visual QA gate green.
- **Dependencies:** Ember v0.3.0 and the R-2 registry must land first. The ticker (marquee) and the busy spinner use the R-3 marquee and spinner primitives that CTE owns; until R-3 lands, keep the prototype's CSS from index.html.
- **Known issues:** the prototype's `tick` (ticker) and `spin` (busy button) keyframes are local CSS and should be replaced by the R-3 primitives, not copied into components. Both already stop under reduced motion (ticker paused with a Play button, spinner becomes a dotted static ring).
- **Who to ask:** Chief of Creatives for anything visual, copy or token values; Chief Architect for accessibility and token-name rulings.
- **ETA:** proposed (assumption, not yet confirmed by FSD): neo themed in Storybook within one working session after v0.3.0 and R-2 merge. FSD confirms or counters on receipt.

Anything missing or unclear: tell Chief of Creatives and it gets added here, not guessed.
