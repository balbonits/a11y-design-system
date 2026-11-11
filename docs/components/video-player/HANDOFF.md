# R-4 VideoPlayer HANDOFF (neo identity)

Status: **draft for Chief Architect sign-off.** Coders build from this file plus the prototype; nothing here is final until CA signs.

- Prototype: [`index.html`](index.html) (open through a server that supports HTTP Range requests, e.g. `npx serve` or GitHub Pages; Python's `http.server` can't seek video).
- Annotated shots: [`handoff/`](handoff/), made by [`annotate.cjs`](annotate.cjs) (neo pattern).
- Core it is designed against: FSD's [PR #33](https://github.com/balbonits/a11y-design-system/pull/33), `feat/r4-video` at `8f4eb06` (`src/video/player.ts`, `src/video/vtt.ts`, adapters), and its heads `acd2f93` and `f8070f9` (adds `pauseWhileReading` to the prefs) with `docs/components/video-player/CORE-API.md` sections 5a (tracks, descriptions, voicing) and 5b (`waiting`/`resumed`, `bufferedchange`, `getBuffered()` → `{ fraction, ranges }`, `canReportBuffering`, `canReportBufferedRanges`, `providerCaptions`, `VideoAdapterUnavailable`, `descriptions.setTrack`, `readVideoPrefs`/`writeVideoPrefs`, `pauseWhileReading`). Read with `gh`/`git show` only.
- Copy: `R4-PLAYER-COPY.md` from UI Copywriter (final, approved by Chief of Creatives). Every string in the prototype comes from it; none is left as `[COPY-TBD]`.
- Identity: neo tokens only (`docs/directions/v3/neo/tokens.css`), locked Addendum 5 and 7 names, no aliases, no new tokens. `--scrim` from `e48047a`. `--target-min` is 44px.
- Media: the shipped demo (Storybook) reads `stories/media/sintel/` (captions.vtt, ad.vtt, transcript.txt, ATTRIBUTION.md are there). FSD copies `sintel-excerpt.mp4` (52s, 1126×480, under 10 MB per R-4) and this folder's `media/captions-fr.vtt` (the official French Sintel subtitles from `reference/sintel_fr.srt`, re-timed to the excerpt, for the Caption language picker) into it during the player build (CA ruling). `tools/transcribe/samples/sintel/` is only the generator's input; this prototype plays from it because the mp4 isn't in `stories/` yet. Sintel © Blender Foundation, CC BY 3.0.

Checks at this commit (from `annotate.cjs`): 320 / 375 / 768 / 1024 / 1440 × light / dark: horizontal overflow 0, axe serious+critical 0, WCAG 1.4.12 text spacing overflow 0 and clipped 0, 200% zoom (640 css px) overflow 0, targets under 44px: none, page errors: none. Keyboard smoke test passes: End, Home, arrows, J/L, `<`/`>` speed steps, Shift+M ignored, M (aria-pressed and "Muted" valuetext), D, C, T (focus to the transcript), Esc returns focus, caption language switch (French cue renders with `lang=fr`), Caption settings dialog (focus to the checked size, live preview, Reset announces "Caption settings reset.", Esc closes and focus returns to More), prefs written as one `ember:video:v1` object, a corrupt stored value falls back silently, transcript search count, Enter / Shift+Enter, no-results text, Clear search.

---

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
2. **Bar mode is a container query on the player (`container: vp / inline-size`, switch at 560px of the player's content box, so 564px outer with the 2px border on each side), not a viewport breakpoint.** The same player can sit in a narrow card on a wide page (see the states gallery, two columns at 1024+, each ~410px, narrow mode). Viewport breakpoints would put wide controls in a 410px box.
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
| Captions | bar, `aria-pressed` | bar | `capabilities.providerCaptions`: replaced by the static note "Captions are shown by {provider}." under the bar. With no track at all (and no provider captions) it stays visible, `aria-disabled="true"`, `aria-describedby` the hint "No captions for this video." |
| Speed | inside More (radio chips) | bar button showing the value ("Normal", "1.5×"), name "Playback speed, {value}" | `rate === false` or `rates.length < 2`; otherwise only chips in `capabilities.rates` |
| Transcript | inside More, `aria-expanded` | bar button, `aria-expanded` | no transcript configured, or `providerCaptions` (the panel hides too) |
| Audio description | inside More, `aria-pressed`, `AD` badge plus full name | inside More | no descriptions track (a failed descriptions VTT hides it). **How AD reaches assistive tech, not only the visual line:** each description cue's text is put in a polite live region as it starts, so screen readers read it (see Live-region policy). With Read descriptions aloud on, the live region turns off and the speech engine speaks it instead, so it's heard once, never twice. It's also always in the transcript as a labeled Description row |
| Read descriptions aloud | inside More, under Audio description, `aria-pressed` | inside More | no descriptions track, or no speech engine (`canVoice()` false). Disabled (`aria-disabled`, hint "Turn on Audio description to use this.") while AD is off |
| Pause video for descriptions | sub-toggle under Read aloud, `aria-pressed`, default off. Disabled (`aria-disabled`, `aria-describedby` the hint "Turn on Read descriptions aloud to use this.") until Read aloud is on | inside More | same as Read aloud |
| Caption language | inside More, native `select` with Off first | inside More | fewer than 2 caption tracks, or `providerCaptions` |
| Caption settings | inside More, opens a modal dialog | inside More | `providerCaptions`: replaced by the static note "Caption settings are in the {provider} player." in More |
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
| Captions, language, settings | ours from VTT | ours from VTT | ours from VTT. Only when the source has no VTT of ours: the adapter turns on YouTube's captions (`cc_load_policy:1`), the core sets `providerCaptions`, our Captions, Caption language, Caption settings and Transcript hide, and the two fallback notes show | same, with Vimeo's text track |
| Audio description, Read aloud | ours | ours | ours | ours |
| Transcript | ours | ours | ours | ours |
| Full screen | ours on the container, except iPhone (`fullscreen:false`) | same | ours on the container | ours on the container |
| Buffered fill | one segment per range (`ranges`) | one segment per range | one fill from `fraction` (`ranges` null) | one fill from `fraction`. On any adapter, no fill when `fraction` is 0 |
| Adapter can't load | Error state | **Unavailable state** when `hls.js` is missing on a browser without native HLS | Error state | **Unavailable state** when `@vimeo/player` is missing |

Unavailable state: the core rejects with `VideoAdapterUnavailable` (`adapter: 'vimeo' \| 'hls'`). The frame shows "This video didn't load here." and a text link "Watch {title} on {provider}" (e.g. "Watch Sintel (excerpt) on Vimeo"; a plain `a` to the source page, same tab, 44px; if a host opens it in a new tab, the name adds "(opens in a new tab)"), with no bar and no big Play (CA ruling). It's static, or `role=alert` if it fails after the page has loaded.

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
| Ended | `--scrim`, "Video ended." and Replay | Replay's name is "Replay {title}" (visible "Replay" plus hidden title) and its `aria-describedby` is the message, so the message isn't also a live region. When playback ends after the user started it, focus moves to Replay |
| No captions | Captions `aria-disabled`, hint "No captions for this video." under the bar | C does nothing |
| Limited source | no Speed, no volume slider, no Full screen | from `capabilities` |
| Adapter unavailable | `--scrim`, "This video didn't load here." and "Watch {title} on {provider}", no bar | Vimeo or hls.js module missing |
| Provider captions | provider draws captions; "Captions are shown by {provider}." under the bar; More shows "Caption settings are in the {provider} player."; no Transcript button or panel | only when the source has no caption track of ours (`providerCaptions`). Both notes are static text, not live regions |
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
- Keyboard hint ("Keyboard shortcuts: ...", Copy) is visually hidden and is the `aria-describedby` of the big Play button and of Play/Pause, not of the `section`: a description on the region isn't read when focus lands on a child. A sentence drops when its feature is off (volume, captions when there's no caption track or `providerCaptions` is set, descriptions, speed with one rate, full screen, transcript).
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

Caption settings follow the approved copy (viewer overrides) in a native dialog. Colors are tokens per CA's ARCH-REVIEW 9:35 ruling (was Known issue 7), and they're **unthemed**: identical in neo, kinetic and dusk, because caption legibility mustn't change with the theme.

**Tokens (FSD adds them to the shared token layer, not to a theme):**

- Primitives: `--palette-caption-white: #ffffff`, `--palette-caption-yellow: #ffe600`, `--palette-caption-cyan: #00e5ff`, `--palette-caption-black: #000000`.
- Two registered extras the component reads, and nothing else: `--caption-text` and `--caption-bg`. Neutral defaults are the White pair (`--caption-text: var(--palette-caption-white)`, `--caption-bg: var(--palette-caption-black)`).
- Mapping in the token layer: `[data-caption-color=white|yellow|cyan|black]` sets both extras, and `[data-caption-bg=none|half|solid]` sets the band opacity. The component sets those attributes on the player root from the saved prefs. No raw values in the component.

| Text color (`data-caption-color`) | `--caption-text` | `--caption-bg` | Solid | Translucent (70%) over the worst frame |
|---|---|---|---|---|
| White (default) | `--palette-caption-white` | `--palette-caption-black` | 21.00:1 | 8.45:1 over a white frame |
| Yellow | `--palette-caption-yellow` | `--palette-caption-black` | 16.57:1 | 6.67:1 over a white frame |
| Cyan | `--palette-caption-cyan` | `--palette-caption-black` | 13.65:1 | 5.50:1 over a white frame |
| Black | `--palette-caption-black` | `--palette-caption-white` (light band) | 21.00:1 | 9.90:1 over a black frame |

- **Translucent is a 70% band, not 50%.** (It was labeled "Half"; Creatives renamed it at 70%, pending UI Copywriter's confirmation. The stored value stays `half`, so the prefs shape and FSD's validation don't change.) Checked over a bright frame as Creatives asked: at 50%, white text over a white frame is 3.95:1, yellow 3.12:1 and cyan 2.57:1, all under 4.5:1. 70% is the lowest round value where every pair passes (cyan is the worst at 5.50:1).
- **None** is a viewer opt-out: no band, only a 1px outline in `--caption-bg` (Translucent has it too). It can't guarantee 4.5:1 over every frame, so it's never the default (Known issue 4).
- For `scripts/contrast.mjs` (FSD adds these pairs, unthemed, checked once): the four Solid pairs above at 4.5:1 or better, plus the four Translucent pairs composited over the worst frame (white for White/Yellow/Cyan, black for Black).
- Captions on must still pass WCAG 1.4.12 text spacing (the prototype's text-spacing scan runs with captions on).

| Setting | Values (stored value) | Rule |
|---|---|---|
| Text size | Small, Medium (default), Large, Extra large (`s`, `m`, `l`, `xl`); chips show S, M, L, XL with the full name as hidden text | `clamp(.875rem,.45rem+2cqi,1.6rem)` / `clamp(1rem,.55rem+2.4cqi,1.9rem)` / `clamp(1.2rem,.7rem+3cqi,2.3rem)` / `clamp(1.45rem,.85rem+3.8cqi,2.8rem)` |
| Text color | White (default), Yellow, Cyan, Black (`white`, `yellow`, `cyan`, `black`) | the token pairs above |
| Background | None, Translucent, Solid (default) (`none`, `half`, `solid`) | band opacity 0 / 70% / 100% of `--caption-bg` |
| Font | Sans serif (default), Serif, Monospace (`sans`, `serif`, `mono`) | `--font-body` / `Georgia, serif` (no serif token) / `--font-mono` |

**Saved prefs:** one JSON object in `localStorage["ember:video:v1"]` (override with the `storageKey` prop), the same shape as the core's `readVideoPrefs`/`writeVideoPrefs`: `{ volume, muted, rate, captions: lang | 'off' | null, descriptions: 'off' | 'text' | 'voice', pauseWhileReading, captionStyle: { size, color, background, font } }`. `pauseWhileReading` is a boolean, default false; the core drops a non-boolean (FSD `f8070f9`) and feeds it to `createDescriptions({ pauseWhileSpeaking })`. `captionStyle` defaults are `m`, `white`, `solid`, `sans` (`DEFAULT_CAPTION_STYLE`), each field falls back on its own, and a patch changes only the fields it names. A bad field falls back to its default, and a storage error falls back silently. Only the main player saves; demos don't. Reset restores the caption style defaults only.

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
6. States from events: `play`/`pause`/`ended`/`error` map directly; Loading is "play requested, no `play` yet"; Stalled is `waiting` until `resumed`; redraw the fill on `bufferedchange`; catch `VideoAdapterUnavailable` into the Unavailable state. Start the 1s timer on entering either and clear it on leaving.
7. Overlay bar and auto-hide only under `:fullscreen` (H-7).
8. Copy: every string comes from `R4-PLAYER-COPY.md`.
9. Prototype CSS is the reference for spacing and sizes; port it to the Ember component's CSS with the same token names.
10. Prefs through `readVideoPrefs`/`writeVideoPrefs` (5b) plus `pauseWhileReading`; validate `captionStyle` per field against H-8.
11. Voicing through `createDescriptions` and `browserSpeech()` (5a). `pauseWhileSpeaking` maps to `pauseWhileReading`, default false.
12. Audio description language: picking another AD track calls `descriptions.setTrack(cues, lang)`, which keeps the user's mode (text or voice); the picker appears only with 2 or more AD tracks (the demo has one).

## Copy

Every string is from `R4-PLAYER-COPY.md` (final, approved by Chief of Creatives). The last ones filled in this revision:

| Where | String |
|---|---|
| Ended card | "Video ended." / "Replay" (name "Replay {title}") |
| Keyboard hint (visually hidden, `aria-describedby` of big Play and Play/Pause) | "Keyboard shortcuts: K or Space plays or pauses. Left and Right arrows skip 5 seconds, and J and L skip 10 seconds. Up and Down arrows change the volume. Home and End go to the start or the end. M mutes. C turns captions on or off. D turns audio description on or off. The less-than and greater-than keys slow down or speed up. F goes full screen. T opens the transcript. Escape closes a panel." Drop the Up/Down sentence when `capabilities.volume` is false, D with no descriptions track, the speed sentence with one rate, F with no full screen, T with no transcript |
| Pause sub-toggle | "Pause video for descriptions"; disabled hint "Turn on Read descriptions aloud to use this." |
| Adapter unavailable | "This video didn't load here." / "Watch {title} on {provider}" |
| Provider captions (fallback only) | "Captions are shown by {provider}." / "Caption settings are in the {provider} player." |

Track labels in the language picker ("English", "Français") come from the track metadata, not UI copy.

## Known issues

1. ~~Buffering needs a core addition.~~ Resolved in the core (CORE-API 5b, FSD's PR #33 at `acd2f93`): `waiting`/`resumed` events, a throttled `bufferedchange`, `getBuffered()` → `{ fraction, ranges | null }` (ranges on native and HLS, a fraction only on YouTube and Vimeo), and the `canReportBuffering` and `canReportBufferedRanges` flags (H-4 Buffering).
2. **YouTube and Vimeo** run in iframes: our captions and transcript still work (they're ours), but the iframe takes focus when clicked, so our shortcuts stop until focus returns; the provider's own UI must be hidden (`controls=0` / Vimeo `controls:false`). Vimeo rate needs a paid owner account (core reports `rate:false`).
3. **iOS Safari:** volume level is read-only (slider hidden, Mute works); iPhone has no element full screen (button hidden).
4. Caption background None is a viewer choice and can drop below contrast over bright frames even with the outline. Solid (default) and Translucent pass 4.5:1 over any frame (H-8).
5. No hover time preview (thumbnails) on the scrubber.
6. Captions don't show in native full screen on iOS when the browser takes over the video element.
7. ~~Caption colors aren't tokens.~~ Resolved (CA ARCH-REVIEW 9:35): `--caption-text`/`--caption-bg` from `--palette-caption-*`, unthemed (H-8).
8. ~~Embed captions.~~ Resolved (CA): our VTT captions on every adapter; provider captions and the two fallback notes only for a source with no VTT of ours. AD placement under the frame (H-1 point 4) is approved by CA, with the assistive-tech condition on the AD row (H-3).
9. Speech voicing uses the browser's speech engine (`speechSynthesis`); voices and timing vary by OS, so Read aloud is hidden where `canVoice()` is false.

## Out of scope

PiP (core: out of scope per CTE), chapters, quality/resolution picker, playlists, live streams and DVR, casting, thumbnails preview, autoplay (core never autoplays).
