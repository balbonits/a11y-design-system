# R-4 VideoPlayer HANDOFF (neo, kinetic and dusk)

Status: **draft for Chief Architect sign-off.** Coders build from this file plus the prototype; nothing here is final until CA signs.

- Prototype: [`index.html`](index.html) (open through a server that supports HTTP Range requests, e.g. `npx serve` or GitHub Pages; Python's `http.server` can't seek video).
- Annotated shots: [`handoff/`](handoff/), made by [`annotate.cjs`](annotate.cjs) (neo pattern), named `vp-<theme>-<width>-<light|dark>[-annotated[-top]].png` for all three themes.
- Core it is designed against: FSD's [PR #33](https://github.com/balbonits/a11y-design-system/pull/33), `feat/r4-video` at `8f4eb06` (`src/video/player.ts`, `src/video/vtt.ts`, adapters), and its current head `acd2f93` with `docs/components/video-player/CORE-API.md` sections 5a (tracks, descriptions, voicing) and 5b (`waiting`/`resumed`, `bufferedchange`, `getBuffered()` → `{ fraction, ranges }`, `canReportBuffering`, `canReportBufferedRanges`, `providerCaptions`, `VideoAdapterUnavailable`, `descriptions.setTrack`, `readVideoPrefs`/`writeVideoPrefs`). Read with `gh`/`git show` only.
- Copy: `R4-PLAYER-COPY.md` from UI Copywriter (final, approved by Chief of Creatives). Every string in the prototype comes from it except the ones still marked `[COPY-TBD]` (see Copy).
- Identity: one component, three themes. It uses only the locked Addendum 5 and 7 semantic names, which neo, kinetic and dusk each define (`docs/directions/v3/<theme>/tokens.css`), with no aliases and no new tokens. The prototype loads all three and picks one with `?theme=neo|kinetic|dusk` or the Theme buttons at the top (saved as `ember:vp-theme`, a prototype-only key); neo is the default. See H-0. `--scrim` from `e48047a`. `--target-min` is 44px.
- Media for the demo: `tools/transcribe/samples/sintel/` (52s excerpt, 1126×480, captions.vtt, ad.vtt, transcript.txt) and `media/captions-fr.vtt` (the official French Sintel subtitles from `reference/sintel_fr.srt`, re-timed to the excerpt, so the Caption language picker has two real tracks). Sintel © Blender Foundation, CC BY 3.0.

Checks at this commit (from `annotate.cjs`): neo / kinetic / dusk × 320 / 375 / 768 / 1024 / 1440 × light / dark (30 runs): horizontal overflow 0, axe serious+critical 0, WCAG 1.4.12 text spacing overflow 0 and clipped 0, 200% zoom (640 css px) overflow 0 in each theme, targets under 44px: none, page errors: none. Keyboard smoke test passes: End, Home, arrows, J/L, `<`/`>` speed steps, Shift+M ignored, M (aria-pressed and "Muted" valuetext), D, C, T (focus to the transcript), Esc returns focus, caption language switch (French cue renders with `lang=fr`), Caption settings dialog (focus to the checked size, live preview, Reset announces "Caption settings reset.", Esc closes and focus returns to More), prefs written as one `ember:video:v1` object, a corrupt stored value falls back silently, transcript search count, Enter / Shift+Enter, no-results text, Clear search.

---

## H-0 Themes

The layout, states, keyboard, copy and targets in H-1 to H-7 are the same in every theme. Only token values change, plus each theme's own press and hover behavior. Nothing in the component names a theme except the press and hover rules in the last row.

| | neo | kinetic | dusk |
|---|---|---|---|
| Fonts (`--font-display` / `-body` / `-mono`) | Archivo Black / Archivo / JetBrains Mono | Bricolage Grotesque / Instrument Sans / IBM Plex Mono | Young Serif / Nunito Sans / Nunito Sans |
| Player and panel corners (`--radius-lg`) | 18px | 0px (square) | 24px |
| Pills: big Play, status, chips (`--radius-full`) | 999px | 2px, so the big Play is a near-square block | 999px |
| Buttons and fields (`--radius-md`) | 12px | 2px | 999px (pill buttons and search field) |
| Elevation (`--shadow-raised` / `-press`) | 4px hard offset / 1px | none / none | soft 0 2px 6px / none |
| Borders (`--border-width` / `-strong`) | 2px / 2.5px (3px after [PR #41](https://github.com/balbonits/a11y-design-system/pull/41)) | 2px / 3px | 1.5px / 2.5px (1px / 2px after the dusk integer PR) |
| Error and ended dim (`--scrim`, light / dark) | `#11111173` / `#1111118c` | `#06123F66` / `#00000080` | `#1B0B1F80` / `#1B0B1F80` |
| Motion (`--duration-fast` / `-base`, `--ease-press`) | 120 / 220ms, overshoot | 140 / 260ms, no overshoot | 200 / 420ms, slow ease |
| `--tilt` / `--lift` on hover | -1.5deg / -3px | 0 / 0 | 0 / -2px |
| Press and hover (copied from each direction's own `.btn` rules in `docs/directions/v3/<theme>/index.html`) | Hover lifts 1px up-left with tilt; press moves 3px into `--shadow-press` | Hover inverts to `--text` on `--color-bg`, no movement; press moves 1px down, no shadow | Hover rises by `--lift` with `--shadow-overlay`; press settles flat with no shadow |

- The caption colors and bands (H-8) don't change by theme. Captions sit over video, not over a theme surface.
- Contrast: every themed pair the player uses (text, text-muted, accent and accent-contrast, borders at 3:1 for 1.4.11, focus ring, scrim under text-muted) is a pair that theme's `CONTRAST.md` already checks. The 30 axe runs above found 0 contrast issues in any theme or mode.
- Reduced motion: each theme's `prefers-reduced-motion` block sets its durations, `--tilt` and `--lift` to 0, and the player's own reduced-motion rule removes the press and hover transforms in every theme (H-7).
- For the builder: press and hover belong to the theme, not to the player. The player's buttons are Ember Buttons, and Ember Button gains the per-theme motion in **Button motion** below. Nothing is hard-coded in the player.

### Button motion

Ember Button today (CA, 2026-11-10) supports: primary hover with `--button-bg-hover` plus `translateY(var(--lift))`; press on every variant with a fixed 1px move plus `--shadow-press`; secondary and ghost hover and press on `--surface-muted` (plus the border on press); danger hover on `--danger-hover`. It doesn't support `--tilt`, a press depth that varies by theme, lift on secondary, ghost or danger, or `--hue-shift`.

**Gaps found against the three-theme prototype:**
1. **neo tilt.** Hover rotates by `--tilt` (-1.5deg). Button has no tilt.
2. **neo press depth.** The prototype presses 3px into `--shadow-press`, where Button uses a fixed 1px. Dusk presses 0px (it settles flat), so press depth varies by theme.
3. **Lift on every variant.** Neo and dusk lift secondary, ghost and danger too, not only primary. Kinetic lifts nothing, because its `--lift` is 0.
4. **Hover shadow.** Dusk hover adds `--shadow-overlay`. Button has no hover shadow token.
5. **Kinetic inverted hover.** Kinetic hover fills every variant with `--text` and sets the label to `--color-bg` (from kinetic's own `.btn:hover`). Button only has per-variant hover fills.
6. **Not a gap, but the prototype differs from Button.** The prototype's neo secondary hover is `--accent-soft`. The player follows Button's `--surface-muted`, so the prototype's value isn't a spec.

No row uses `--hue-shift`: dusk defines it, but no direction's buttons use it.

**Spec.** Move with `transform` only, so there's no layout shift. Hover is `translateY(var(--button-lift)) rotate(var(--button-tilt))`. Press is `translateY(var(--button-press-offset))` plus `--button-shadow-press`, with no tilt. Fills stay with each variant's existing tokens unless a row says otherwise.

| Theme | Primary | Secondary | Ghost | Danger | Press (all variants) |
|---|---|---|---|---|---|
| neo | Hover `--button-bg-hover`, lift `--lift` (-3px), tilt `--tilt` (-1.5deg) | Hover `--surface-muted`, the same lift and tilt | Hover `--surface-muted`, the same lift and tilt | Hover `--danger-hover`, the same lift and tilt | Offset 3px into `--shadow-press` (1px), no tilt |
| kinetic | Hover inverts: fill `--text`, label `--color-bg`, no lift or tilt (both are 0) | The same inversion | The same inversion | The same inversion (danger's red returns on press and focus) | Offset 1px, `--shadow-press` is none |
| dusk | Hover `--button-bg-hover`, lift `--lift` (-2px), shadow `--shadow-overlay`, no tilt (0) | Hover `--surface-muted`, the same lift and shadow | Hover `--surface-muted`, the same lift and shadow | Hover `--danger-hover`, the same lift and shadow | Offset 0 (settles flat), no shadow |

**New component tokens** go in `src/tokens/components.css`, each a `var()` of a theme token, as `lint:colors` requires:
- `--button-tilt: var(--tilt)`
- `--button-lift: var(--lift)` already exists and now applies to every variant.
- `--button-hover-shadow: var(--shadow-overlay)` for dusk. It's none in kinetic, and neo keeps `--shadow-raised` on hover.
- `--button-press-offset` for the press depth.
- Kinetic's inversion as `--button-hover-bg: var(--text)` and `--button-hover-fg: var(--color-bg)`, set only in kinetic.

**Open item for Chief Architect: `--button-press-offset` has no Addendum 5 source.** Press depth is 3px in neo, 1px in kinetic and 0 in dusk, and no theme token holds those values. A raw value in components.css breaks `lint:colors`. I see two options:
- **(a) My recommendation:** a new per-theme token `--press-offset` (3px, 1px, 0) next to `--lift` in each theme, so `--button-press-offset: var(--press-offset)`. It's honest and lint-clean, but it adds a name to Addendum 5.
- **(b)** Use one depth everywhere, `var(--border-width)` (2px, 2px, and 1px after #44). That adds no new name, but it loses neo's deep press and dusk's flat press.

**Rules for every theme:**
- **Reduced motion:** each theme's reduce block already zeroes `--tilt` and `--lift`. Under reduce, `--press-offset` (or whatever CA picks) and `--button-hover-shadow`'s movement must zero too, and durations go to 0ms. The color changes stay.
- **No layout shift:** transforms only, never margin, padding, top or size changes.
- **Hit area:** the 44px `--target-min` hit area is the untransformed box. A -1.5deg tilt on a 44px-tall button moves its corners under 1px, so the hit area still covers 44px.
- **Focus ring:** the ring follows the transform. Parents of Buttons don't clip (no `overflow: hidden` on the bar or popovers within ring offset + width + 3px of lift), so a tilted or lifted ring is never cut off.

## H-1 Layout, mobile-first

The player is a `section` (`aria-label="Video player: <title>"`) holding three parts top to bottom: **stage** (video, poster play button, status pill, captions, error, ended and adapter-unavailable overlays), the **audio-description line** (only when AD is on), and the **control bar**. The Caption settings `dialog` sits inside the section so it renders in full screen too. The transcript is its own `section` next to or under it.

| Page width | Player | Bar mode (container query) | Transcript |
|---|---|---|---|
| 320 | full width (~290px) | narrow | below the player, max-height 24rem, scrolls |
| 375 | full width (~340px) | narrow | below, 24rem |
| 768 | full width (~720px) | wide | below, 24rem |
| 1024 | ~2fr (~620px) | wide | **beside**, ~1fr (min 280px), same height as the player |
| 1440 | ~2fr (~880px) | wide | beside |

Decisions (pushback, with reasons):
1. **The bar docks below the frame at every width, not over the video.** The sample is 2.35:1, so at 320 the picture is about 121px tall; an overlay bar (≥96px with the scrubber) would cover most of it. Docking also means the controls always sit on solid `--surface` (contrast is guaranteed, not "depends on the frame") and captions never collide with controls. The bar overlays only in full screen (H-4, H-7).
2. **Bar mode is a container query on the player (`container: vp / inline-size`, switch at 560px), not a viewport breakpoint.** The same player can sit in a narrow card on a wide page (see the states gallery, two columns at 1024+, each ~410px, narrow mode). Viewport breakpoints would put wide controls in a 410px box.
3. **Transcript goes beside the player from 1024px.** Below 1024, a side panel would squeeze the player under 560px and the controls would drop to narrow mode on a big screen. At 1024 the split is ~620 / ~330, which keeps wide controls and a readable transcript line.
4. **Audio description line sits under the frame, not over it.** Creatives asked that AD text sit above the captions and never cover them. Docked under the frame it covers neither the picture nor the captions at any width, and at 320 there's no room inside a 121px-tall frame for two text bands. In full screen, where the frame is large, the AD line moves to the **top of the frame**, which puts it above the captions with the frame between them. It always shows the `AD` badge next to the full name "Audio description" (never the badge alone).
5. **Stage height:** `max(9.5rem, 100cqi × 480 / 1126)`, i.e. the video's ratio but never shorter than 9.5rem so the poster button, status pill and overlays fit at 320. Letterboxing is `--surface-muted`. Use the real video ratio per source (from metadata, or 16:9 for YouTube and Vimeo).

## H-2 Fluid rules

- Player: `width: 100%`, `min-width: 0` inside any grid. Never a fixed width.
- Side-by-side grid (≥1024): `grid-template-columns: minmax(0,2fr) minmax(280px,1fr)`. The transcript takes the player's height with `height:0; min-height:100%; overflow:hidden` and its list scrolls. Don't let the transcript set the row height.
- Captions: `max-width: 92%` of the stage, centered, `bottom: 6%`. Size uses `cqi` clamps so it scales with the player, not the viewport (H-8 table).
- Popovers: anchored above the bar's right edge, `max-width: calc(100cqi - 1.1rem)`, `max-height: min(36rem, 80vh)`, scroll inside. Chips wrap.
- Narrow bar: row 1 is current time, scrubber, duration (`.tnum`, tabular mono). Row 2 is Play, Mute, spacer, Captions, More, Full screen.
- Wide bar: row 1 is the scrubber alone. Row 2 is Play, `0:00 / 0:52`, Mute, Volume slider, spacer, Captions, Speed, Transcript, More, Full screen.
- Transcript button: icon only below a 720px player, icon plus visible "Transcript" from 720px. The copy says "from 480px"; on our layout the button is only in the bar from 560px, and at 560 to 720 the row can't fit the text without wrapping, so the visible text starts at 720 (player width, container query). Its name is "Transcript" at every size.
- Captions-unavailable hint: a third bar row (`.cchint`, `--text-muted`) only when there is no usable captions track.
- Transcript header: heading on the left, Download on the right, search on its own row. Downloads are an inline group (`Download` label, Text, Captions file) when the transcript is at least 440px wide, and collapse into a `Download` disclosure (button `aria-expanded` and a panel) below that. That covers 320 and 375 and the side column at 1024 to 1440.
- Caption settings dialog: `width: min(30rem, 100vw - 1.5rem)`, `max-height: 100dvh - 1.5rem`, scrolls inside. Chips wrap.
- Text spacing (1.4.12) and 200% zoom: nothing clips; chips and menu items wrap; the time label never truncates.

## H-3 Controls per mode

| Control | Narrow (<560 container) | Wide (≥560) | Hidden when (core `capabilities` and tracks) |
|---|---|---|---|
| Play / Pause | bar | bar | never |
| Time | flanks scrubber | inline `cur / dur` | never |
| Mute | bar, `aria-pressed` | bar | never (works even on iOS) |
| Volume slider | hidden | bar, **only with `(hover:hover) and (pointer:fine)`** | `capabilities.volume === false` (iOS) |
| Captions | bar, `aria-pressed` | bar | `capabilities.providerCaptions`. With no usable track it stays visible, `aria-disabled="true"`, `aria-describedby` the hint "No captions for this video." |
| Speed | inside More (radio chips) | bar button showing the value ("Normal", "1.5×"), name "Playback speed, {value}" | `rate === false` or `rates.length < 2`; otherwise only chips in `capabilities.rates` |
| Transcript | inside More, `aria-expanded` | bar button, `aria-expanded` | no transcript configured |
| Audio description | inside More, `aria-pressed`, `AD` badge plus full name | inside More | no descriptions track (a failed descriptions VTT hides it) |
| Read descriptions aloud | inside More, under Audio description, `aria-pressed` | inside More | no descriptions track, or no speech engine (`canVoice()` false). Disabled (`aria-disabled`, hint "Turn on Audio description to use this.") while AD is off |
| Pause video while reading `[COPY-TBD]` | sub-toggle under Read aloud, `aria-pressed`, default off | inside More | same as Read aloud. Disabled until Read aloud is on |
| Caption language | inside More, native `select` with Off first | inside More | fewer than 2 caption tracks, or `providerCaptions` |
| Caption settings | inside More, opens a modal dialog | inside More | `providerCaptions` |
| Full screen | bar, name "Full screen" / "Exit full screen" | bar | `capabilities.fullscreen === false` (iPhone Safari) |

- **More is a disclosure (`button aria-expanded` plus a `role=group` panel), not `role=menu`.** It mixes radio chips, toggles and a select; menu semantics would force arrow-key-only navigation and break the radios.
- **Caption settings is a native modal `dialog`** (Ember Modal pattern, `--scrim` backdrop): focus goes to the checked Text size chip, Esc or Close returns focus to More, settings apply live with a preview line, Reset announces "Caption settings reset." politely.
- **Tooltips:** every icon-only bar button shows its name above it on hover and on keyboard focus (`::after` from `data-tip`, kept in sync with the name, so "Pause" and "Exit full screen" update). Esc hides it until the pointer moves or focus moves (WCAG 1.4.13). The first and last buttons anchor their tooltip to the inside edge so it never leaves the player.
- **PiP is not in the product** (CTE ruling).
- A failed captions VTT drops out of the picker; if none is left, Captions goes to the disabled state above. No toast.

### Adapters × controls

From PR #33 and 5b. "Ours" means our UI renders it from the core.

| Control | native | hls | youtube | vimeo |
|---|---|---|---|---|
| Play, pause, seek, time | ours | ours | ours (iframe, provider controls off) | ours (iframe, provider controls off) |
| Mute | ours | ours | ours | ours |
| Volume slider | ours, except iOS (`volume:false`) | same as native | ours | ours |
| Speed | ours, `capabilities.rates` | ours | ours, YouTube's rate list | hidden unless the owner account allows it (`rate:false`) |
| Captions, language, settings | ours from VTT | ours from VTT | ours from VTT. Only when the host has no VTT and passes `providerCaptions`: our caption controls hide and More shows "Captions are shown by YouTube." | same: "Captions are shown by Vimeo." |
| Audio description, Read aloud | ours | ours | ours | ours |
| Transcript | ours | ours | ours | ours |
| Full screen | ours on the container, except iPhone (`fullscreen:false`) | same | ours on the container | ours on the container |
| Buffered fill | one segment per range (`ranges`) | one segment per range | one fill from `fraction` (`ranges` null) | one fill from `fraction`. On any adapter, no fill when `fraction` is 0 |
| Adapter can't load | Error state | **Unavailable state** when `hls.js` is missing on a browser without native HLS | Error state | **Unavailable state** when `@vimeo/player` is missing |

Unavailable state: the core rejects with `VideoAdapterUnavailable` (`adapter: 'vimeo' \| 'hls'`). The frame shows "This video can't play here." `[COPY-TBD]` and a text link to the video `[COPY-TBD]` (a plain `a` to the source page, focusable, 44px), with no bar and no big Play (CA ruling).

## H-4 States

All shown in the prototype's States gallery (static, no media load) and in `handoff/` shots.

| State | What shows | Notes |
|---|---|---|
| Poster | poster frame, big Play button "Play" with the duration chip, scrubber visible but inert | name is "Play Sintel (excerpt)" (visible "Play" plus visually hidden title; the duration chip is `aria-hidden`); the poster `img` has `alt=""`; it's the first tab stop, with a `--surface` halo so the focus ring reads on any frame |
| Loading | pill "Loading video" | appears only after about 1 second, the same moment the polite status announces it (no flash on fast loads); static text and a dotted ring, **no spinner** |
| Stalled (native, HLS) | the same pill, the same words; the lighter fill draws one segment per buffered range | pill from the core `waiting` until `resumed`; fill redrawn on `bufferedchange` (`canReportBufferedRanges` true) |
| Stalled (YouTube, Vimeo) | the same pill; one fill from 0 to `fraction` | `ranges` is null. No fill when `fraction` is 0 |
| No buffering report | no pill, no fill | `canReportBuffering` false (none of the four adapters today; kept for future adapters) |
| Playing | captions on by default, Pause icon | |
| Paused, More open | Playback speed, Audio description, Read descriptions aloud (disabled with hint), the pause sub-toggle (disabled), Caption language, Caption settings | |
| Audio description on | AD line under the frame; Read descriptions aloud enabled | when Read aloud is on, the AD text stops being a live region so the screen reader and speech engine don't talk at once |
| Caption settings dialog | preview line, Text size, Text color, Background, Font, Reset, Close | |
| Error | `--scrim` over the frame, "The video didn't load." and Retry | if it fails after the user started playback: `role=alert` and focus moves to Retry. A failure on first load shows the card without an alert |
| Ended | `--scrim`, card and Replay | `[COPY-TBD]` |
| No captions | Captions `aria-disabled`, hint "No captions for this video." under the bar | C does nothing |
| Limited source | no Speed, no volume slider, no Full screen | from `capabilities` |
| Adapter unavailable | `--scrim`, card with message and a text link to the video, no bar | Vimeo or hls.js module missing; `[COPY-TBD]` |
| Transcript search | count "1 of 3 matches" / "1 match", current match outlined, Previous match and Next match | buttons `aria-disabled` at 0 matches; Enter and Shift+Enter step |
| Transcript, no results | 'No lines match "zzz".' | |
| Transcript empty | "This video has no transcript." | search, downloads and Jump are hidden |
| Full screen | bar overlays the bottom as a floating solid bar, auto-hides (H-7), captions lift to `bottom: 8.5rem` while the bar shows, AD line at the top of the frame | not shot headless; see H-9 |

Transcript rows: dialogue and description cues in one list, in time order. A description row has a visible `Description` tag and italic text. Each row is a button whose name reads "{time in words}, {text}" (for a description, "{time in words}, Description, {text}") from a visually hidden time, so the visible text stays in the name. The current dialogue row has `aria-current="true"`, a "Now" label and a left border (not color alone). "Jump to current" (name "Jump to current line") appears when the user scrolls away while auto-follow is on.

### Live-region policy

| Region | Politeness | What it says, and when |
|---|---|---|
| Player status (`role=status`, visually hidden) | polite | "Loading video" after about 1s of loading or stalling; "Playback speed, {value}" after `<` or `>`. Cleared when playback resumes. **Never** the current time |
| Player alert (`role=alert`) | assertive | "The video didn't load." only when it fails after the user started playback |
| AD text | polite | each description cue's text as it starts. Turned off (`aria-live=off`) while Read descriptions aloud is on |
| Transcript search count (`role=status`) | polite | the count or no-results text, **debounced about 500ms** after typing stops; updated right away on Enter / Shift+Enter |
| Caption settings status | polite | "Caption settings reset." after Reset |
| Captions box | none (`aria-hidden`) | captions are visual; screen reader users get the transcript |

## H-5 Touch targets

- Every control is ≥ `--target-min` (44×44), checked at all 10 width × mode runs (0 under 44).
- Icon buttons: 44×44. Big Play: min-height 56px.
- Scrubber: **44px tall hit area**, 12px bordered track, 22px thumb. The whole 44px row is the slider, so a thumb drag anywhere in it works.
- Volume range: 44px tall, 6.5rem wide.
- Chips: the `label` around each radio is the target, ≥44px.
- Transcript cues: full-width buttons, ≥44px tall.
- Gaps between bar targets are `.3rem` (about 5px) so focus rings don't overlap.

## H-6 Keyboard and focus

Shortcuts work **only while focus is inside that player** (never global, WCAG 2.1.4), never in the search field, select or dialog, and never with Ctrl/Alt/Meta held. Shift is accepted only for `<` and `>`.

| Key | Action | Where it differs |
|---|---|---|
| K | play or pause | not inside the panels or dialog |
| Space | play or pause | only on the scrubber or the player frame; on a button it presses the button |
| ← / → | seek 5s | on the volume slider they change volume |
| J / L | seek 10s | |
| ↑ / ↓ | volume ±10% | on the scrubber they seek 5s (slider pattern); nothing when `capabilities.volume` is false |
| PgUp / PgDn | seek ±10% of duration | scrubber only |
| Home / End | start / end | anywhere in the player except the volume slider and fields |
| M | mute | |
| C | captions on/off | last-used track; nothing when there's no track |
| D | audio description on/off | nothing when there's no descriptions track |
| `<` / `>` | slower / faster, one step through `capabilities.rates` | announces "Playback speed, {value}" |
| F | full screen | nothing when the source has no full screen |
| T | open the transcript and focus the current row | falls back to the first row, then the heading |
| Esc | close the open panel or dialog, focus back to its button; with nothing open, hide a tooltip | in full screen the browser exits full screen |
| Enter / Shift+Enter | next / previous search match | in the transcript search field |

- Scrubber: `role=slider`, `aria-valuemin 0`, `aria-valuemax` = duration, `aria-valuenow` = floor(seconds), `aria-valuetext` per copy ("15 seconds of 52 seconds", "1 hour 2 minutes 5 seconds of 1 hour 30 minutes"; only the current time while the duration is unknown).
- Volume: `aria-valuetext` "{n}%", or "Muted" while muted.
- Tab order: big Play (poster only), scrubber, Play, Mute, Volume, Captions, Speed, Transcript, More, Full screen, then any open panel, then the transcript (Download, search, Clear search, Previous match, Next match, rows, Jump to current).
- Focus ring: neo `--focus-ring-*`. Bar padding is larger than ring offset + width so rings never clip.
- Panels: one open at a time. Opening a panel moves focus to its first control. The Download disclosure moves focus to its first link and Esc closes it.
- The player has `aria-describedby` pointing at a visually hidden keyboard hint (Copy).
- Captions box is `aria-hidden`; captions in another language get `lang` on the caption box.

## H-7 Motion

No `@keyframes` anywhere. Everything that moves, and what reduced motion does:

| Motion | Default | `prefers-reduced-motion: reduce` |
|---|---|---|
| Played fill width | `--duration-fast`, linear | instant |
| Full screen bar fade and auto-hide | `--duration-base`, `--ease-standard`; hides after 3s of no input while playing | **no auto-hide**, controls stay |
| Caption lift in full screen | `--duration-base` | instant |
| Button hover lift and press | translate, `--ease-press` | no transform |
| Big Play hover tilt | `--tilt` rotate | no transform |
| Transcript auto-follow | scrolls the current row to a third of the list | **off**; "Jump to current" still works |
| Search match stepping | jumps the list (no smooth scroll) | same |
| Loading and stalled pill | static text, no spinner | same |

Auto-hide never hides while any element has `:focus-visible`, while a panel is open, while the pointer is over the bar, or when paused. Any input shows the controls again.

## H-8 Tokens

Only these semantic tokens are used, in every theme (no new tokens, no aliases). The values below are neo's; H-0 lists kinetic's and dusk's:

| Use | Token |
|---|---|
| Player, bar, popovers, caption default background | `--surface`, `--text`, `--text-muted` |
| Letterbox, track | `--surface-muted` |
| Borders | `--border`, `--border-subtle`, `--border-width`, `--border-width-strong` |
| Played fill, active toggles, big Play | `--accent`, `--accent-contrast`, `--accent-hover`, `--accent-soft` |
| High-vis caption style | `--highlight`, `--highlight-contrast` |
| Error / ended dim | `--scrim` (light `#11111173`, dark `#1111118c`) |
| Radius | `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-full` |
| Shadows | `--shadow-raised`, `--shadow-press` |
| Type | `--font-body`, `--font-display`, `--font-mono`, `--weight-display` |
| Controls | `--control-height`, `--control-padding-x`, `--control-gap`, `--target-min` |
| Focus | `--focus-ring-width`, `--focus-ring-offset`, `--focus-ring-style`, `--focus-ring-color` |
| Motion | `--duration-fast`, `--duration-base`, `--ease-standard`, `--ease-press` |

Caption settings follow the approved copy (viewer overrides). This replaces the earlier token-pair presets.

| Setting | Values (stored value) | Rule |
|---|---|---|
| Text size | Small, Medium (default), Large, Extra large (`s`, `m`, `l`, `xl`); chips show S, M, L, XL with the full name as hidden text | `clamp(.875rem,.45rem+2cqi,1.6rem)` / `clamp(1rem,.55rem+2.4cqi,1.9rem)` / `clamp(1.2rem,.7rem+3cqi,2.3rem)` / `clamp(1.45rem,.85rem+3.8cqi,2.8rem)` |
| Text color | White (default), Yellow, Cyan, Black (`white`, `yellow`, `cyan`, `black`) | `#fff`, `#ffe600`, `#00e5ff`, `#000`. Black switches the band to white. Component-local values, pending CA (Known issue 7) |
| Background | None, Half, Solid (default) (`none`, `half`, `solid`) | band at 0 / 50% / 100% of black (white for Black text). None and Half add a 1px outline in the band color so text holds over bright frames |
| Font | Sans serif (default), Serif, Monospace (`sans`, `serif`, `mono`) | `--font-body` / `Georgia, serif` (no serif token) / `--font-mono` |

Contrast on Solid: white, yellow and cyan on black are 21:1, 19.6:1 and 15.6:1; black on white is 21:1.

**Saved prefs:** one JSON object in `localStorage["ember:video:v1"]` (override with the `storageKey` prop), the same shape as the core's `readVideoPrefs`/`writeVideoPrefs`: `{ volume, muted, rate, captions: lang | 'off' | null, descriptions: 'off' | 'text' | 'voice', pauseWhileReading, captionStyle: { size, color, background, font } }`. A bad field falls back to its default, and a storage error falls back silently. Only the main player saves; demos don't. Reset restores the caption style defaults only.

## H-9 Annotated screenshots

In [`handoff/`](handoff/): `vp-<theme>-<width>-<mode>.png` (full page), `-annotated.png` (full page) and `-annotated-top.png` (first screen) for themes neo, kinetic, dusk, widths 320, 375, 768, 1024, 1440 and modes light, dark (90 shots). Labels: green dashed = landmarks and the player section, purple = headings, pink = focusable targets numbered in tab order with size, red = under 44px (none). Full screen can't be captured headless; its rules are in H-4 and H-7.

Regenerate: serve the repo root with Range support, then `NODE_PATH=<node_modules with playwright-core and @axe-core/playwright> node annotate.cjs http://127.0.0.1:PORT/docs/components/video-player/index.html` from `docs/components/video-player/` (it writes relative `handoff/` paths and adds `?theme=` itself).

---

## For the builder

1. Build controls, caption renderer and transcript **only on the core `Player` interface** (PR #33). No adapter-specific UI code.
2. Read `player.capabilities` once after `ready` and hide controls per H-3. Show only `capabilities.rates` chips.
3. One cue model (`vtt.ts`) feeds captions (`activeCues`), transcript (`cueIndexAt` for the current cue, `searchCues`, `toTxt`/`toVtt` for downloads) and AD.
4. Seeks requested before metadata loads are kept and applied on `durationchange`/ready (the prototype does this on `loadedmetadata`).
5. Keyboard listener on the player root, not `document` (H-6). Ignore events from text inputs and with modifiers.
6. States from events: `play`/`pause`/`ended`/`error` map directly; Loading is "play requested, no `play` yet"; Stalled is `waiting` until `resumed`; redraw the fill on `bufferedchange`; catch `VideoAdapterUnavailable` into the Unavailable state. Start the 1s timer on entering either and clear it on leaving.
7. Overlay bar and auto-hide only under `:fullscreen` (H-7).
8. Copy: every string comes from `R4-PLAYER-COPY.md`; anything still marked `[COPY-TBD]` waits for UI Copywriter.
9. Prototype CSS is the reference for spacing and sizes; port it to the Ember component's CSS with the same token names.
10. Prefs through `readVideoPrefs`/`writeVideoPrefs` (5b) plus `pauseWhileReading`; validate `captionStyle` per field against H-8.
11. Voicing through `createDescriptions` and `browserSpeech()` (5a). `pauseWhileSpeaking` maps to `pauseWhileReading`, default false.
12. Audio description language: picking another AD track calls `descriptions.setTrack(cues, lang)`, which keeps the user's mode (text or voice); the picker appears only with 2 or more AD tracks (the demo has one).

## Copy

Strings are from `R4-PLAYER-COPY.md` (final). Still open with UI Copywriter (asked at 9:35 PM PT, cc Chief of Creatives):

| Where | Placeholder in the prototype |
|---|---|
| Ended card | `[COPY-TBD] Ended` / `[COPY-TBD] Replay` |
| Keyboard hint (screen readers, `aria-describedby`) | `[COPY-TBD] Keyboard: K or Space to play or pause, ...` (draft lists every key in H-6) |
| Pause sub-toggle | `[COPY-TBD] Pause video while reading` |
| Adapter unavailable | `[COPY-TBD] This video can't play here.` / `[COPY-TBD] Watch the video` |

Track labels in the language picker ("English", "Français") come from the track metadata, not UI copy.

## Known issues

1. ~~Buffering needs a core addition.~~ Resolved in the core (5b, FSD commit `1fa5c04`, pushed with the player PR): `waiting` and `progress` on all four adapters, `getBuffered()` 0..1 and `capabilities.buffered`.
2. **YouTube and Vimeo** run in iframes: our captions and transcript still work (they're ours), but the iframe takes focus when clicked, so our shortcuts stop until focus returns; the provider's own UI must be hidden (`controls=0` / Vimeo `controls:false`). Vimeo rate needs a paid owner account (core reports `rate:false`).
3. **iOS Safari:** volume level is read-only (slider hidden, Mute works); iPhone has no element full screen (button hidden).
4. Caption backgrounds Half and None are user choices and can drop below contrast over bright frames even with the outline; Solid is the default.
5. No hover time preview (thumbnails) on the scrubber.
6. Captions don't show in native full screen on iOS when the browser takes over the video element.
7. **Open with CA:** the four caption text colors aren't registered tokens. Either register them (e.g. `--palette-caption-*`) or keep them component-local as now.
8. **Open with CA:** embed captions. The copy and Creatives want a provider note when the provider shows captions; CA ruled provider captions only for a source with no VTT of ours (`providerCaptions`). The prototype follows CA: ours everywhere we have VTT, the note only with `providerCaptions`.
9. Speech voicing uses the browser's speech engine (`speechSynthesis`); voices and timing vary by OS, so Read aloud is hidden where `canVoice()` is false.

## Out of scope

PiP (core: out of scope per CTE), chapters, quality/resolution picker, playlists, live streams and DVR, casting, thumbnails preview, autoplay (core never autoplays).
