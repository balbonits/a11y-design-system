# R-4 VideoPlayer HANDOFF (neo, kinetic and dusk)

Status: **draft for Chief Architect sign-off.** Coders build from this file plus the prototype; nothing here is final until CA signs.

- Prototype: [`index.html`](index.html) (open through a server that supports HTTP Range requests, e.g. `npx serve` or GitHub Pages; Python's `http.server` can't seek video).
- Annotated shots: [`handoff/`](handoff/), made by [`annotate.cjs`](annotate.cjs) (neo pattern), named `vp-<theme>-<width>-<light|dark>[-annotated[-top]].png` for all three themes.
- Core it is designed against: FSD's [PR #33](https://github.com/balbonits/a11y-design-system/pull/33), `feat/r4-video` at `8f4eb06` (`src/video/player.ts`, `src/video/vtt.ts`, adapters), and its heads `acd2f93` and `f8070f9` (adds `pauseWhileReading` to the prefs) with `docs/components/video-player/CORE-API.md` sections 5a (tracks, descriptions, voicing) and 5b (`waiting`/`resumed`, `bufferedchange`, `getBuffered()` → `{ fraction, ranges }`, `canReportBuffering`, `canReportBufferedRanges`, `providerCaptions`, `VideoAdapterUnavailable`, `descriptions.setTrack`, `readVideoPrefs`/`writeVideoPrefs`, `pauseWhileReading`). Read with `gh`/`git show` only.
- Copy: `R4-PLAYER-COPY.md` from UI Copywriter (final, approved by Chief of Creatives). Every string in the prototype comes from it; none is left as `[COPY-TBD]`.
- Identity: one component, three themes. It uses only the locked Addendum 5 and 7 semantic names, which neo, kinetic and dusk each define (`docs/directions/v3/<theme>/tokens.css`), with no aliases and no new tokens. The prototype loads all three and picks one with `?theme=neo|kinetic|dusk` or the Theme buttons at the top (saved as `ember:vp-theme`, a prototype-only key); neo is the default. See H-0. `--scrim` from `e48047a`. `--target-min` is 44px. `--scrim` comes from each theme (neo `e48047a`). `--target-min` is 44px.
- Media: the shipped demo (Storybook) reads `stories/media/sintel/` (captions.vtt, ad.vtt, transcript.txt, ATTRIBUTION.md are there). FSD copies `sintel-excerpt.mp4` (52s, 1126×480, under 10 MB per R-4) and this folder's `media/captions-fr.vtt` (the official French Sintel subtitles from `reference/sintel_fr.srt`, re-timed to the excerpt, for the Caption language picker) into it during the player build (CA ruling). `tools/transcribe/samples/sintel/` is only the generator's input; this prototype plays from it because the mp4 isn't in `stories/` yet. Sintel © Blender Foundation, CC BY 3.0.

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
| neo | Hover `--button-bg-hover`, lift `--lift` (-3px), tilt `--tilt` (-1.5deg) | Hover `--surface-muted`, the same lift and tilt | Hover `--surface-muted`, the same lift and tilt | Hover `--danger-hover`, the same lift and tilt | `--press-offset` 3px into `--shadow-press` (1px), no tilt |
| kinetic | Hover inverts: fill `--text`, label `--color-bg`, no lift or tilt (both are 0). Label 14.95:1 in light, 17.60:1 in dark (4.5:1 needed). Focus ring: see below | The same inversion | The same inversion | The same inversion (danger's red returns on press and focus) | `--press-offset` 1px, `--shadow-press` is none |
| dusk | Hover `--button-bg-hover`, lift `--lift` (-2px), shadow `--shadow-overlay`, no tilt (0), plus the inset hover ring in `--color-bg` (see Dusk hover ring) | Hover `--surface-muted`, the same lift and shadow, plus the inset ring in `--accent` | Hover `--surface-muted`, the same lift and shadow, plus the inset ring in `--accent` | Hover `--danger-hover`, the same lift and shadow, plus the inset ring in `--color-bg` | `--press-offset` 0 (settles flat), no shadow |

**Kinetic inverted hover and contrast.** The numbers below come from `docs/directions/v3/kinetic/tokens.json`. The label pair is already one of `shared/contrast.mjs`'s TEXT pairs, `['color-bg','text']`, at 4.5:1, so it's reported in `kinetic/CONTRAST.md` (lines 29 and 59). FSD's token PR carries the same pair into `scripts/contrast.mjs`.

| Mode | `--color-bg` label on `--text` fill (4.5:1) | Focus ring on the band it sits on, `--color-bg` / `--surface` (3:1) | Focus ring against the `--text` fill |
|---|---|---|---|
| Light | 14.95:1 pass | 8.95:1 / 9.49:1 pass | 1.67:1, not adjacent |
| Dark | 17.60:1 pass | 12.14:1 / 11.10:1 pass | 1.45:1, not adjacent |

The ring-against-fill pair applies only where the ring offset is 0, and that never happens on a kinetic Button. Kinetic's `--focus-ring-offset` is 3px, so a 3px band of `--color-bg` or `--surface` always sits between the ring and the fill. `shared/contrast.mjs` records it anyway, through `kinetic/contrast-notes.md`, as a "Recorded, not gated" table in `kinetic/CONTRAST.md`. That table lists 1.67:1 in light and 1.45:1 in dark, marked "not adjacent by rule". The label pair and both ring-to-band pairs are gated rows there. Chief of Creatives ruled on 2026-11-10 to keep these rules and not add an inverted ring.
- **Rules that keep it that way:** in kinetic, `--focus-ring-offset` stays at 2px or more on Buttons, and a hovered, focused kinetic Button never gets an inset ring (`outline-offset` at or below 0). Tilt, lift and press never reduce `--focus-ring-offset` below 2px on kinetic. They move the button and its ring together with `transform`, and the offset is never animated or recomputed per state.
- **There is no offset-0 or inverted ring color.** Per CA, these rules are enforced, not advisory: lint or the contrast test fails any kinetic Button whose `--focus-ring-offset` resolves under 2px, or whose focus ring is drawn inset (`outline-offset` at or below 0, or an inset `box-shadow` used as the focus indicator). FSD builds that check; it's a DONE criterion below.

**Dusk hover ring** (Chief of Creatives' ruling, CA signed, 2026-11-10). `--shadow-overlay` can't be the only hover cue, and no dusk hover fill reaches 3:1 against its resting fill (light 1.11 to 1.33:1, dark 1.11 to 1.27:1), so dusk hover adds a ring:
- **How it's drawn:** an inset `box-shadow`, `inset 0 0 0 var(--button-hover-border-width) <color>`, with `--button-hover-border-width: var(--border-width-strong)`. It's 2px once #44 lands (2.5px on this branch until then). It's never an `outline`, so it can't collide with the focus outline, and it never changes `border-width`, so there's no layout shift. It's listed before `--shadow-overlay` in the same `box-shadow`.
- **Color by variant:** secondary and ghost use `--accent`. Primary uses `--color-bg` against `--accent-hover`, and danger uses `--color-bg` against `--danger-hover`. An `--accent` ring would vanish on primary's accent fill.
- **Reduced motion:** the ring stays, because it's a state cue, not motion. Only lift goes to 0.
- **Forced colors:** box-shadow isn't drawn, so on hover the border takes the system color (`border-color: Highlight`), at the same width.
- **Focus:** the focus ring stays outside the button with its offset (`--focus-ring-offset` 3px). Hover and focus together show both rings, with the hover ring inside the edge and the focus ring outside it (H-4, "Hover + focus").
- **Over video:** the player's halo (`.stage :focus-visible` box-shadow) and the hover ring share one `box-shadow` on a hovered, focused big Play, so neither drops the other.

Ring against the hover fill it sits on, 3:1 needed (WCAG 1.4.11). All six pass. They're gated in `shared/contrast.mjs`, which now reads `dusk/contrast-pairs.json` for the two new pairs; `--accent` on `--surface-muted` was already a shared UI pair. They're reported in `dusk/CONTRAST.md`.

| Variant | Ring on hover fill | Light | Dark |
|---|---|---|---|
| Secondary | `--accent` on `--surface-muted` | 7.72:1 pass | 9.04:1 pass |
| Ghost | `--accent` on `--surface-muted` | 7.72:1 pass | 9.04:1 pass |
| Primary | `--color-bg` on `--accent-hover` | 11.14:1 pass | 12.49:1 pass |
| Danger | `--color-bg` on `--danger-hover` | 8.76:1 pass | 12.19:1 pass |

**Neo secondary hover** is `--surface-muted`, per Button. Chief of Creatives' ruling stands, and the prototype's `--accent-soft` isn't spec.

**Component tokens** go in `src/tokens/components.css`, each a `var()` of a theme token, as `lint:colors` requires:
- `--button-tilt: var(--tilt)`
- `--button-lift: var(--lift)` already exists and now applies to every variant.
- `--button-hover-shadow: var(--shadow-overlay)` for dusk. It's none in kinetic, and neo keeps `--shadow-raised` on hover.
- `--button-press-offset: var(--press-offset)`
- `--button-hover-border-width: var(--border-width-strong)`, set only in dusk, for the hover ring.
- Kinetic's inversion as `--button-hover-bg: var(--text)` and `--button-hover-fg: var(--color-bg)`, set only in kinetic.

**`--press-offset`** (Chief Architect, ARCH-REVIEW Addendum 8, 2026-11-10 10:34 PM PT): a locked per-theme semantic length, defined in each theme's token file next to `--lift`.

| Theme | Value |
|---|---|
| neo | 3px |
| kinetic | 1px |
| dusk | 0 |
| Registered default | 1px |
| Reduced motion | 0 |

Lint rejects negative and unitless values. It stays separate from `--border-width` on purpose, so border changes like #41 and #44 don't change the press depth.

**Rules for every theme:**
- **Reduced motion:** each theme's reduce block zeroes neo's `--tilt`, every `--lift` and `--press-offset`, and durations go to 0ms. Fill, label and border changes stay, so state is still visible without motion.
- **No layout shift:** transforms and shadows only, never margin, padding, top, border-width or size changes.
- **Hit area:** the 44px `--target-min` hit area moves with the button. Translate and a -1.5deg rotation don't shrink it, so it's 44px or more in both directions while tilted, lifted or pressed. The hover lift never moves the box out from under the pointer, because `--lift` is at most 3px.
- **Focus ring:** the ring follows the transform. A Button's parents mustn't clip within ring offset + ring width + 3px of lift, plus about 2px of tilt overhang on a wide button: no `overflow: hidden` that close on the bar, popovers or cards. A tilted or lifted ring is never cut off.

**DONE criteria for Button motion:**
1. Per theme, hover and press match the table above, `--press-offset` comes from the theme (neo 3px, kinetic 1px, dusk 0), and reduced motion zeroes tilt, every lift and the press offset.
2. FSD's check fails the build for any kinetic Button whose `--focus-ring-offset` is under 2px or whose focus ring is inset. It's in lint or the contrast test, and it's in CI.
3. `shared/contrast.mjs` (and FSD's `scripts/contrast.mjs` port) gates the kinetic label pair and the six dusk hover-ring pairs, with 0 failures.
4. Hover + focus shows both rings on dusk and kinetic, light and dark, at 320 and 1280, as in the `-hoverfocus-` shots (H-9).
5. No layout shift on hover or press. The 44px hit area holds, and no focus ring is clipped while tilted or lifted.

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
| Hover + focus (Buttons) | both rings at once: the theme's hover (dusk's inset ring, kinetic's inversion) inside the edge, and the focus ring outside with its offset | dusk and kinetic, light and dark, 320 and 1280 in the `-hoverfocus-` shots (H-9); neither ring replaces the other |
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

In [`handoff/`](handoff/): `vp-<theme>-<width>-<mode>.png` (full page), `-annotated.png` (full page) and `-annotated-top.png` (first screen) for themes neo, kinetic, dusk, widths 320, 375, 768, 1024, 1440 and modes light, dark (90 shots). Hover + focus: `vp-<theme>-<width>-<mode>-hoverfocus-<primary|secondary>.png` for dusk and kinetic at 320 and 1280, light and dark (16 shots), made by `hoverfocus.cjs` (run from this folder, the same way as `annotate.cjs`). Each is clipped to the hovered, focused button with a label, and `hoverfocus.cjs` prints `:hover`, `:focus-visible`, the outline and the box-shadow for each so you can check both rings are drawn. Labels: green dashed = landmarks and the player section, purple = headings, pink = focusable targets numbered in tab order with size, red = under 44px (none). Full screen can't be captured headless; its rules are in H-4 and H-7.

Regenerate: serve the repo root with Range support, then `NODE_PATH=<node_modules with playwright-core and @axe-core/playwright> node annotate.cjs http://127.0.0.1:PORT/docs/components/video-player/index.html` from `docs/components/video-player/` (it writes relative `handoff/` paths and adds `?theme=` itself).

---

## For the builder

**Build card (PROC-5/6)**
- **Builder:** Full Stack Developer (FSD, 336762ab). Target is a new branch `feat/r4-player-ui` off `main`, cut after #33, #38 and Ember #27 merge.
- **Dependencies (pinned):**
  - Core player API: PR #33 at `130b6d4`, including CORE-API.md 5a to 5c.
  - Media: PR #38 at `c42941e`, `stories/media/sintel/` (`sintel-excerpt.mp4`, captions, AD and transcript; French captions follow from FSD).
  - Ember v0.3.1: PR #27 at `d963cbd`, for tokens and the per-theme scrim.
  - Copy: `R4-PLAYER-COPY.md` (final), at `/workspace/ux-projects/copy/R4-PLAYER-COPY.md`.
  - Themes (this PR, #43): neo, kinetic and dusk tokens from `docs/directions/v3/<theme>/tokens.css`. Dusk's 1px/2px borders come from #44 (`design/dusk-integer-borders`, open at `1f86410`); until it merges, dusk's `--border-width-strong` is 2.5px. The new per-theme `--press-offset` and the Button component tokens (H-0, Button motion) go into Ember with FSD's token PR.
- **Hard DONE, with numbers:**
  - axe: 0 violations at every impact, not just serious and critical.
  - Every number below holds in each theme (neo, kinetic, dusk), not only neo.
  - Horizontal overflow: 0 at 320, 375, 768, 1024 and 1440, in light and dark.
  - Touch targets: no target under 44px.
  - WCAG 1.4.12 text spacing: 0 overflow and 0 clipped. 200% zoom: 0 overflow.
  - `contrast.mjs`, with the caption pairs (`--caption-text` on `--caption-bg`, Solid and Translucent), is green.
  - Every keyboard row in H-6 is an e2e test.
  - Button motion DONE criteria 1 to 5 (H-0) pass, including the kinetic focus-ring check failing CI on an offset under 2px or an inset ring, and the six dusk hover-ring pairs at 3:1 or above.
  - ACR rows 1.2.x are updated. 1.2.2 for the demo stays "Partially Supports" until the listening pass.
- **Who to ask:**
  - UX/UI Designer for the spec and layout.
  - Chief of Creatives for visuals and creative rulings.
  - Chief Architect for accessibility and architecture.
- **ETA:** FSD starts once CA signs this HANDOFF and FSD's current cards ship (the #27 kinetic scrim, then SB-MANAGER-AA). The player-UI PR is open for QA, CA and VQA by Wed Nov 11, 6:00 PM PT. If it slips, escalate to CTE. The ETA was set by CTE on 2026-11-10.


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
| Keyboard hint (visually hidden, `aria-describedby` of big Play and Play/Pause) | "Keyboard shortcuts: K or Space plays or pauses. Left and Right arrows skip 5 seconds, and J and L skip 10 seconds. Up and Down arrows change the volume. Home and End go to the start or the end. M mutes. C turns captions on or off. D turns audio description on or off. The less-than and greater-than keys slow down or speed up. F goes full screen. T opens the transcript. Escape closes a panel." Drop the Up/Down sentence when `capabilities.volume` is false, D with no descriptions track, the speed sentence with one rate, F with no full screen, T with no transcript, and C with no caption track or under `providerCaptions` |
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
