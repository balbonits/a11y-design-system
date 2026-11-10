# jdilig.me UX themes: token spec v1.0 (Chief of Creatives, 2026-11-10)

John (1:59 PM PT): ship A, B and C as three switchable themes. One token layer, same token names in every theme; switching is only attributes on `<html>`.

- **Live prototype:** https://raw.githack.com/balbonits/a11y-design-system/main/docs/themes/index.html
- **Drop-in CSS:** [`tokens.css`](tokens.css) (generated from `pal.py`; edit there).
- Structure is a proposal; Chief Architect's required changes win and get retrofitted (names can be namespaced, e.g. `--jd-*`, without changing values).

## Selectors
- `html[data-theme="editorial|bold|tactile"]` sets shape, type and motion tokens.
- `html[data-theme][data-mode="light|dark"]` sets color tokens and `color-scheme`.
- `html[data-pref="system|light|dark"]` records the user's choice; `data-mode` is resolved from it.
- Default: theme `editorial`, mode `system` (follows `prefers-color-scheme`, and live-updates when the OS changes).
- Persist in `localStorage` keys `jd-theme` and `jd-mode`. Set the attributes in an inline `<head>` script before CSS paints (no flash of the wrong theme).

## Switcher (accessibility requirements)
- Two native radio groups in `<fieldset>`s with `<legend>`s "Theme" (Editorial, Bold, Tactile) and "Color mode" (Auto, Light, Dark). Native radios give Tab into the group and arrow keys between options for free.
- Visible focus ring; each option is at least 40px tall, and 44px wide or more.
- Announce the change in a polite live region, e.g. "Theme Bold, automatic (dark) mode".
- The theme crossfade uses `document.startViewTransition` only when reduced motion is off; otherwise it swaps instantly.
- In the prototype it sits in the sticky header and wraps under the nav on mobile. FSD can move it into a header menu, but it must stay reachable within 2 Tab stops of the nav.

## Color tokens (per theme x mode)

| Token | editorial light | editorial dark | bold light | bold dark | tactile light | tactile dark |
|---|---|---|---|---|---|---|
| `--bg` | `#f7f3ec` | `#1a1714` | `#f6f5fa` | `#0b0a10` | `#f3ead9` | `#1f1a14` |
| `--surface` | `#fffdf9` | `#24201b` | `#ffffff` | `#15131c` | `#fcf5e8` | `#2a231b` |
| `--surface2` | `#f1ebe1` | `#332d25` | `#e9e7f2` | `#24202e` | `#f6d9a6` | `#4a3a26` |
| `--ink` | `#1c1a17` | `#f3ede4` | `#13111a` | `#f4f1fa` | `#2a1f14` | `#f6ecdc` |
| `--muted` | `#5c554b` | `#bdb3a4` | `#565068` | `#b3adc2` | `#5e4c38` | `#cbbba4` |
| `--accent` | `#b23c0c` | `#ff8a5c` | `#c2410c` | `#ff7a3d` | `#2f6b4f` | `#86c9a2` |
| `--on-accent` | `#ffffff` | `#1a0d05` | `#ffffff` | `#1a0d05` | `#ffffff` | `#10251a` |
| `--line` | `rgba(28,26,23,.12)` | `rgba(243,237,228,.14)` | `rgba(19,17,26,.10)` | `rgba(255,255,255,.10)` | `#2a1f14` | `#f6ecdc` |
| `--glass` | `rgba(247,243,236,.72)` | `rgba(26,23,20,.7)` | `rgba(246,245,250,.7)` | `rgba(11,10,16,.6)` | `rgba(243,234,217,.8)` | `rgba(31,26,20,.8)` |
| `--blob1` | `#f4b58f` | `#8a3a17` | `#ffb38f` | `#ff7a3d` | `#efb67a` | `#7a5226` |
| `--blob2` | `#c9d6c0` | `#3c4a37` | `#b9a8ff` | `#7c5cff` | `#9fc7aa` | `#2f5a40` |
| `--blob3` | `#cdd0ee` | `#3a3d63` | `#8fdcff` | `#20c3ff` | `#e8a19e` | `#6b3533` |

## Contrast (WCAG 2.2 AA; computed, all pass)
Text pairs need 4.5:1; accent on surface2 is used for non-text and large text only (3:1).

| Theme | Mode | ink on bg | ink on surface | ink on surface2 | muted on bg | muted on surface | accent on bg | accent on surface | on_accent on accent | accent on surface2 |
|---|---|---|---|---|---|---|---|---|---|---|
| editorial | light | 15.7 | 17.1 | 14.6 | 6.6 | 7.2 | 5.4 | 5.8 | 5.9 | 5.0 |
| editorial | dark | 15.3 | 13.9 | 11.7 | 8.6 | 7.8 | 7.7 | 7.0 | 8.2 | 5.9 |
| bold | dark | 17.7 | 16.5 | 14.2 | 9.1 | 8.5 | 7.6 | 7.1 | 7.3 | 6.1 |
| bold | light | 17.2 | 18.7 | 15.3 | 7.1 | 7.7 | 4.8 | 5.2 | 5.2 | 4.2 |
| tactile | light | 13.5 | 14.8 | 11.8 | 6.8 | 7.5 | 5.3 | 5.8 | 6.3 | 4.6 |
| tactile | dark | 14.8 | 13.3 | 9.3 | 9.2 | 8.3 | 9.0 | 8.0 | 8.4 | 5.7 |


## Shape, type and motion tokens (per theme, same in light and dark)

| Token | editorial | bold | tactile |
|---|---|---|---|
| `--font-display` | `'Instrument Serif',serif` | `Geist,system-ui,sans-serif` | `'Bricolage Grotesque',sans-serif` |
| `--font-body` | `Geist,system-ui,sans-serif` | `Geist,system-ui,sans-serif` | `'Bricolage Grotesque',system-ui,sans-serif` |
| `--display-weight` | `400` | `800` | `800` |
| `--r-card` | `28px` | `22px` | `20px` |
| `--r-btn` | `999px` | `12px` | `14px` |
| `--r-input` | `14px` | `12px` | `12px` |
| `--gap` | `16px` | `12px` | `16px` |
| `--pad` | `24px` | `22px` | `22px` |
| `--elev` | `0 1px 2px rgb(0 0 0/.05),0 18px 40px -12px rgb(0 0 0/.16)` | `0 0 0 1px var(--line),0 24px 60px -20px rgb(0 0 0/.55)` | `4px 4px 0 var(--line)` |
| `--btn-shadow` | `none` | `0 8px 30px -6px color-mix(in srgb,var(--accent) 55%,transparent)` | `3px 3px 0 var(--line)` |
| `--tile-border` | `0` | `0` | `2px solid var(--line)` |
| `--dur-1` | `120ms` | `100ms` | `90ms` |
| `--dur-2` | `220ms` | `180ms` | `200ms` |
| `--dur-3` | `420ms` | `360ms` | `380ms` |
| `--dur-4` | `720ms` | `640ms` | `600ms` |
| `--ease-out` | `cubic-bezier(.22,1,.36,1)` | `cubic-bezier(.16,1,.3,1)` | `cubic-bezier(.34,1.56,.64,1)` |
| `--ease-press` | `cubic-bezier(.3,0,.5,1)` | `cubic-bezier(.4,0,.2,1)` | `cubic-bezier(.5,0,.5,1)` |
| `--ticker-loop` | `28s` | `22s` | `28s` |
| `--parallax-scale` | `1` | `1.4` | `.8` |
| `--blob-blur` | `60px` | `70px` | `0px` |
| `--blob-opacity` | `.55` | `.4` | `.35` |

How to use the motion tokens: `--dur-1` is for press, `--dur-2` for hover and toggles, `--dur-3` for route changes, theme swaps and tile lift, and `--dur-4` for scroll reveal and icon draw. `--ease-out` is for entering and hover, and `--ease-press` for the press-down. `--parallax-scale` multiplies each layer's depth.

## Motion and interactivity (all themes)
Route and view transitions, scroll reveal, hover and press micro-interactions, parallax background layers, a skills ticker, SVG icons that draw themselves in, interactive demos inside case studies, and skeleton loading states. Copy the behavior from the prototype.

## Reduced motion (`prefers-reduced-motion: reduce`, same in every theme)
- All durations go to 0.01ms with no iteration.
- The ticker stops and shows as static text, with its duplicated copy hidden.
- Parallax layers stay put, with no transform.
- Reveals and icons show immediately, and the skeleton shimmer stops.
- View transitions are skipped.

## Required in every theme
- WCAG 2.2.2: the ticker has a visible Pause/Play button (`aria-pressed`), and it also pauses on hover and focus.
- 2.3.1: nothing flashes.
- Decorative motion is `aria-hidden`.
- Animate only `transform` and `opacity`, which keeps 60fps on mobile.
- Parallax uses rAF with a passive scroll listener.

## DONE (for the build)
1. All 6 theme x mode combos: axe 0 violations and 0 horizontal overflow at 320, 375, 768 and 1280.
2. The switcher works by keyboard only, is announced, persists across reloads, and defaults to the system mode.
3. The reduced-motion checks above pass in a script.
4. The ticker pause works.
5. Before and after screenshots, plus a PROGRESS.md entry.

## Prototype verification (2026-11-10)
- All 6 combos at 375 and 1280: axe 0 violations and 0 overflow (`test.cjs`).
- With system dark and nothing saved, it starts as editorial dark.
- Pressing ArrowRight on the radio switches to bold, saves `jd-theme=bold`, announces "Theme Bold, automatic (dark) mode", and survives a reload.
