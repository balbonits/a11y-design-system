# R-4 VideoPlayer HANDOFF (neo identity)

Status: **draft for Chief Architect sign-off.** Coders build from this file plus the prototype; nothing here is final until CA signs.

- Prototype: [`index.html`](index.html) (open through a server that supports HTTP Range requests, e.g. `npx serve` or GitHub Pages; Python's `http.server` can't seek video).
- Annotated shots: [`handoff/`](handoff/), made by [`annotate.cjs`](annotate.cjs) (neo pattern).
- Core it is designed against: FSD's [PR #33](https://github.com/balbonits/a11y-design-system/pull/33), `feat/r4-video` at `8f4eb06` (`src/video/player.ts`, `src/video/vtt.ts`, adapters). Read with `gh`/`git show` only.
- Identity: neo tokens only (`docs/directions/v3/neo/tokens.css`), locked Addendum 5 and 7 names, no aliases, no new tokens. `--scrim` from `e48047a`. `--target-min` is 44px.
- Media for the demo: `tools/transcribe/samples/sintel/` (52s excerpt, 1126×480, captions.vtt, ad.vtt, transcript.txt). Sintel © Blender Foundation, CC BY 3.0.

Checks at this commit (from `annotate.cjs`): 320 / 375 / 768 / 1024 / 1440 × light / dark: horizontal overflow 0, axe serious+critical 0, WCAG 1.4.12 text spacing overflow 0 and clipped 0, 200% zoom (640 css px) overflow 0, targets under 44px: none, page errors: none. Keyboard smoke test (End, Home, arrows, PgUp, Space, K, C, Esc returns focus, caption settings persist, transcript search and cue seek) passes.

---

## H-1 Layout, mobile-first

The player is a `section` (`aria-label="Video player: <title>"`) holding three parts top to bottom: **stage** (video, poster play button, status pill, captions, error and ended overlays), the **audio-description line** (only when AD is on), and the **control bar**. The transcript is its own `section` next to or under it.

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
4. **Stage height:** `max(9.5rem, 100cqi × 480 / 1126)`, i.e. the video's ratio but never shorter than 9.5rem so the poster button, status pill and overlays fit at 320. Letterboxing is `--surface-muted`. Use the real video ratio per source (from metadata, or 16:9 for YouTube and Vimeo).

## H-2 Fluid rules

- Player: `width: 100%`, `min-width: 0` inside any grid. Never a fixed width.
- Side-by-side grid (≥1024): `grid-template-columns: minmax(0,2fr) minmax(280px,1fr)`. The transcript takes the player's height with `height:0; min-height:100%; overflow:hidden` and its list scrolls. Don't let the transcript set the row height.
- Captions: `max-width: 92%` of the stage, centered, `bottom: 6%`. Size uses `cqi` clamps so it scales with the player, not the viewport (H-8 table).
- Popovers: anchored above the bar's right edge, `max-width: calc(100cqi - 1.1rem)`, `max-height: min(26rem, 80vh)`, scroll inside. Chips wrap.
- Narrow bar: row 1 is current time, scrubber, duration (`.tnum`, tabular mono). Row 2 is Play, Mute, spacer, Captions, More, Full screen.
- Wide bar: row 1 is the scrubber alone. Row 2 is Play, `0:00 / 0:52`, Mute, Volume slider, spacer, Captions, Speed, Transcript, More, Full screen.
- Text spacing (1.4.12) and 200% zoom: nothing clips; chips and menu items wrap; the time label never truncates.

## H-3 Controls per mode

| Control | Narrow (<560 container) | Wide (≥560) | Hidden when (core `capabilities`) |
|---|---|---|---|
| Play / Pause | bar | bar | never |
| Time | flanks scrubber | inline `cur / dur` | never |
| Mute | bar | bar | never (works even on iOS) |
| Volume slider | hidden | bar, **only with `(hover:hover) and (pointer:fine)`** | `capabilities.volume === false` (iOS) |
| Captions | bar, `aria-pressed` | bar | disabled, not hidden, when there's no captions track (`aria-disabled`, label "Captions, unavailable") |
| Speed | inside More | bar button showing current rate | `rate === false` or `rates.length < 2`; otherwise show only chips in `capabilities.rates` |
| Transcript | inside More | bar button, `aria-expanded` | no transcript configured |
| Audio description | inside More, `aria-pressed` | inside More | no descriptions track |
| Caption settings | inside More | inside More | never (captions are always ours) |
| Full screen | bar | bar | `capabilities.fullscreen === false` (iPhone Safari) |

- **More is a disclosure (`button aria-expanded` + `role=group` panel), not `role=menu`.** It mixes radio chips and toggles; menu semantics would force arrow-key-only navigation and break the radios.
- **PiP is not in the product.** The core marks it out of scope (CTE), so the prototype has no PiP item.
- Speed chips are a radio group (0.5 / 0.75 / 1 / 1.25 / 1.5 / 2, the core's `RATES`). The wide Speed button reads "Speed, 1×".
- See the gallery state "Limited source" for the hidden-capability layout.

## H-4 States

All shown in the prototype's States gallery (static, no media load) and in `handoff/` shots.

| State | What shows | Notes |
|---|---|---|
| Poster | poster frame, big Play button with duration chip (`Play 0:52`), scrubber visible but inert | the big button is the first tab stop; it has a `--surface` halo so the focus ring reads on any frame |
| Loading | status pill "Loading video" (`role=status`) | static text and a dotted ring, **no spinner**, nothing moves |
| Buffering | status pill "Buffering" | same; shown only on the adapter's waiting signal (see Known issue 1) |
| Playing | captions on by default, Pause icon | |
| Paused | Play icon; More can be open | |
| Caption settings open | panel with Size, Style, Background, Font, Reset, Done | |
| Error | `--scrim` over the frame, card with message and Retry | `[COPY-TBD]` strings |
| Ended | `--scrim`, card "Ended" and Replay | `[COPY-TBD]` |
| No captions | Captions button `aria-disabled`, captions box hidden | C key does nothing |
| Limited source | no Speed, no volume slider, no Full screen | from `capabilities` |
| Full screen | bar overlays the bottom as a floating solid surface bar, auto-hides (H-7), captions lift to `bottom: 8.5rem` while the bar shows | not shot headless; see H-9 |

Transcript states: list of cues (time + text buttons), current cue marked with `aria-current="true"`, a "Now" label and a left border (not color alone); search results count in one `role=status` ("2 matches" / "No matches" `[COPY-TBD]`); "Jump to current" appears when the user scrolls away while auto-follow is on.

## H-5 Touch targets

- Every control is ≥ `--target-min` (44×44), checked at all 10 width × mode runs (0 under 44).
- Icon buttons: 44×44. Big Play: min-height 56px.
- Scrubber: **44px tall hit area**, 12px bordered track, 22px thumb. The whole 44px row is the slider, so a thumb drag anywhere in it works.
- Volume range: 44px tall, 6.5rem wide.
- Chips: the `label` around each radio is the target, ≥44px.
- Transcript cues: full-width buttons, ≥44px tall.
- Gaps between bar targets are `.3rem` (about 5px) so focus rings don't overlap.

## H-6 Keyboard and focus

Shortcuts work **only while focus is inside that player** (never global), never in text inputs, and never with Ctrl/Alt/Meta held.

| Key | Action | Where it differs |
|---|---|---|
| K | play or pause | not inside the settings panels |
| Space | play or pause | only on the scrubber or the player frame; on a button it presses the button |
| ← / → | seek 5s | on the volume slider they change volume |
| ↑ / ↓ | volume ±10% | on the scrubber they seek 5s (slider pattern) |
| PgUp / PgDn | seek ±10% of duration | scrubber only |
| Home / End | start / end | scrubber only |
| M | mute | |
| C | captions on/off | nothing when there's no track |
| F | full screen | nothing when the source has no full screen |
| Esc | close the open panel, focus back to the button that opened it | in full screen the browser exits full screen |

- Scrubber: `role=slider`, `aria-valuemin 0`, `aria-valuemax` = duration, `aria-valuenow` = floor(seconds), `aria-valuetext` in words ("15 seconds of 52 seconds"; minutes when ≥60s).
- Tab order: big Play (poster only), scrubber, Play, Mute, Volume, Captions, Speed, Transcript, More, Full screen, then any open panel, then the transcript.
- Focus ring: neo `--focus-ring-*`. Bar padding is larger than ring offset + width so rings never clip.
- Panels: one open at a time. Opening moves no focus (disclosure); Done in Caption settings returns focus to More.
- The player has `aria-describedby` pointing at a visually hidden keyboard hint (Copy table).
- Captions box is `aria-hidden` (screen reader users use the transcript or their own caption reading; duplicating live captions is noise). The AD line is `aria-live="polite"` and exists only while AD is on.

## H-7 Motion

- No `@keyframes` anywhere. Transitions only: played fill width (`--duration-fast`, linear), bar opacity in full screen and caption lift (`--duration-base`, `--ease-standard`), button press (`--ease-press`).
- **Reduced motion:** all transitions 0s, no hover/press transforms, transcript auto-follow **off** (no auto-scrolling; "Jump to current" still works), full screen auto-hide **off**.
- **Full screen auto-hide:** after 3s of no pointer, key or touch while playing. Never hides while any element has `:focus-visible` (keyboard users keep the controls; a mouse click focus doesn't block it), while a panel is open, while the pointer is over the bar, or when paused. Any input shows it again.
- Loading and buffering never animate (static text).

## H-8 Tokens

Only these neo tokens are used (no new tokens, no aliases):

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

Caption settings are **token-pair presets, not free color pickers** (free colors can fail contrast):

| Setting | Values | Rule |
|---|---|---|
| Style | Default, Inverted, High-vis | `--text` on `--surface` / `--surface` on `--text` / `--highlight-contrast` on `--highlight` |
| Background | Solid, 75%, 50% | `color-mix(in srgb, <bg> N%, transparent)`; Solid is the default and the only one with guaranteed contrast |
| Size | S, M (default), L, XL | `clamp(.875rem,.45rem+2cqi,1.6rem)` / `clamp(1rem,.55rem+2.4cqi,1.9rem)` / `clamp(1.2rem,.7rem+3cqi,2.3rem)` / `clamp(1.45rem,.85rem+3.8cqi,2.8rem)` |
| Font | Sans, Mono | `--font-body` / `--font-mono` |

Saved in `localStorage["jdilig:captions:v1"]` as `{on,size,style,bg,font}`; Reset restores defaults.

## H-9 Annotated screenshots

In [`handoff/`](handoff/): `vp-<width>-<mode>.png` (full page), `-annotated.png` (full page) and `-annotated-top.png` (first screen) for widths 320, 375, 768, 1024, 1440 and modes light, dark. Labels: green dashed = landmarks and the player section, purple = headings, pink = focusable targets numbered in tab order with size, red = under 44px (none). Full screen can't be captured headless; its rules are in H-4 and H-7.

Regenerate: serve the repo root with Range support, then `NODE_PATH=<node_modules with playwright-core and @axe-core/playwright> node docs/components/video-player/annotate.cjs http://127.0.0.1:PORT/docs/components/video-player/index.html` from `docs/components/video-player/`.

---

## For the builder

1. Build controls, caption renderer and transcript **only on the core `Player` interface** (PR #33). No adapter-specific UI code.
2. Read `player.capabilities` once after `ready` and hide controls per H-3. Show only `capabilities.rates` chips.
3. One cue model (`vtt.ts`) feeds captions (`activeCues`), transcript (`cueIndexAt` for the current cue, `searchCues`, `toTxt`/`toVtt` for downloads) and AD.
4. Seeks requested before metadata loads are kept and applied on `durationchange`/ready (the prototype does this on `loadedmetadata`).
5. Keyboard listener on the player root, not `document` (H-6). Ignore events from text inputs and with modifiers.
6. States from events: `play`/`pause`/`ended`/`error` map directly; Loading is "play requested, no `play` yet". Buffering waits on Known issue 1.
7. Overlay bar and auto-hide only under `:fullscreen` (H-7).
8. Copy: use the strings in the Copy table; anything marked `[COPY-TBD]` waits for UI Copywriter via Chief of Creatives.
9. Prototype CSS is the reference for spacing and sizes; port it to the Ember component's CSS with the same token names.

## Copy

All strings below are placeholders until UI Copywriter rules (routed through Chief of Creatives).

| Where | Placeholder |
|---|---|
| Error card | `[COPY-TBD] This video didn't load.` / button `[COPY-TBD] Retry` |
| Ended card | `[COPY-TBD] Ended` / button `Replay` |
| Status pill | `Loading video`, `Buffering` |
| Captions unavailable | button label `Captions, unavailable` |
| Transcript search | `2 matches` / `No matches` (`[COPY-TBD]`), `Jump to current`, `Now` |
| Keyboard hint (screen readers) | `Keyboard: K to play or pause, arrow keys to seek and change volume, M to mute, C for captions, F for full screen.` |

## Known issues

1. **Buffering and buffered range need a core addition.** `PlayerEvent` has no `waiting`/`playing`/`progress`, and `Player` has no buffered range. The design needs (a) a waiting/resumed signal for the Buffering pill and (b) `getBuffered(): number` (seconds buffered ahead) for the lighter fill. Asking FSD; until then hide the buffered fill and never show Buffering.
2. **YouTube and Vimeo** run in iframes: our captions and transcript still work (they're ours), but the iframe takes focus when clicked, so our shortcuts stop until focus returns; the provider's own UI must be hidden (`controls=0` / Vimeo `controls:false`). Vimeo rate needs a paid owner account (core reports `rate:false`).
3. **iOS Safari:** volume level is read-only (slider hidden, Mute works); iPhone has no element full screen (button hidden).
4. Caption backgrounds 75% and 50% are user choices and can drop below contrast over bright frames; Solid is the default.
5. No hover time preview (thumbnails) on the scrubber.
6. Captions don't show in native full screen on iOS when the browser takes over the video element.

## Out of scope

PiP (core: out of scope per CTE), chapters, quality/resolution picker, playlists, live streams and DVR, casting, thumbnails preview, autoplay (core never autoplays).
