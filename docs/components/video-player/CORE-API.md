# R-4 VideoPlayer core API (for the player UI handoff)

Owner: Full Stack Developer. Source of truth: balbonits/a11y-design-system PR #33 (`feat/r4-video`), files `src/video/*`.
Status: draft core; the UI (controls, caption renderer, transcript panel) waits on the CA-signed handoff.
Last updated: 2026-11-10 (see git history of PR #33 for exact code).

Scope (CTE ruling): IN = play/pause, seek with time and cue events, mute/volume, captions toggle + track picker,
descriptions VTT (text, optional voicing), transcript (highlight, click-to-seek, search, .txt/.vtt download),
fullscreen, speed. OUT = Picture-in-Picture. Every control works on all four adapters or is gated by a capability flag.

## 1. Entry and creation

```ts
import { createPlayer } from 'ember-ui/video';   // separate entry; core 'ember-ui' never includes it
const player = await createPlayer({
  source: { src: '/media/sintel/sintel-excerpt.mp4', type?: 'video/mp4' },
  video,   // <video> element for native/HLS sources
  mount,   // element replaced by the iframe for YouTube/Vimeo
  title: 'Sintel trailer excerpt',  // accessible name for the iframe
});
```

Adapter is picked from the source (`detectKind`):

| kind | when | loads |
|---|---|---|
| `native` | anything else (mp4, webm) | nothing extra; default |
| `hls` | `.m3u8` or HLS MIME type | native HLS where supported (Safari/iOS); else lazy `hls.js` (optional peer, install pending John) |
| `youtube` | youtube.com / youtu.be / youtube-nocookie URL | YouTube IFrame API script, only then; plays from youtube-nocookie.com, YouTube's own controls and captions off |
| `vimeo` | vimeo.com / player.vimeo.com URL | lazy `@vimeo/player` (install pending John); Vimeo's controls off |

Never autoplays on any adapter.

## 2. Player interface (what the UI binds to)

All async methods resolve after the source accepted the change.

| member | type | notes |
|---|---|---|
| `kind` | `'native' \| 'hls' \| 'youtube' \| 'vimeo'` | |
| `capabilities` | `Capabilities` (section 3) | read once after `ready` |
| `play()` / `pause()` | `Promise<void>` | `play()` can reject if the browser blocks it; UI shows paused state |
| `seek(seconds)` | `Promise<void>` | clamped to 0..duration |
| `getTime()` / `getDuration()` | `number` (s) | duration is 0 until known |
| `isPaused()` | `boolean` | |
| `setRate(r)` / `getRate()` | | only values in `capabilities.rates` |
| `setVolume(0..1)` / `getVolume()` | | no-op where `capabilities.volume` is false |
| `setMuted(b)` / `isMuted()` | | works everywhere |
| `on(event, fn)` | returns an unsubscribe function | |
| `destroy()` | | removes listeners and the adapter |

Events: `ready`, `play`, `pause`, `timeupdate` (native: browser cadence ~4/s; YouTube: polled every 250 ms while playing; Vimeo: SDK cadence), `durationchange`, `ended`, `ratechange`, `volumechange`, `error` (detail = adapter error code/object).

Fullscreen is done by the UI on the player container (`element.requestFullscreen()`), not by the adapter, so our controls, captions and transcript stay visible in fullscreen. Gated by `capabilities.fullscreen`.

## 3. Capability flags

```ts
interface Capabilities {
  rate: boolean;              // false: hide/disable the speed control
  rates: readonly number[];   // subset of RATES this source accepts
  volume: boolean;            // false (iOS Safari): hide the slider, keep Mute
  fullscreen: boolean;        // document.fullscreenEnabled
}
```

| | native | hls | youtube | vimeo |
|---|---|---|---|---|
| rate | yes | yes | yes, YouTube's list ∩ RATES | only if the video owner's account allows (probed); else `rates=[1]` |
| volume | no on iOS | no on iOS | yes | yes |
| fullscreen | if the browser allows | same | same | same |

Captions, descriptions and the transcript come from our own VTT. The exception is `providerCaptions`, and the buffering flags are in 5b.

## 4. Speeds

`RATES = [0.5, 0.75, 1, 1.25, 1.5, 2]`, default 1.

## 5. Cue model (captions, descriptions, transcript)

WebVTT only. Parsed once with `parseVtt(text)`; the same cues drive the caption renderer, the transcript panel and the descriptions track.

```ts
interface Cue { id: string; start: number; end: number; text: string }   // seconds; tags stripped; lines joined by \n
interface CueTrack { kind: 'captions' | 'descriptions'; lang: string; label: string; cues: Cue[] }
```

Helpers the UI uses:

| helper | for |
|---|---|
| `activeCues(cues, t)` | caption renderer: cues with start ≤ t < end (can be more than one) |
| `cueIndexAt(cues, t)` | transcript highlight and auto-scroll: last cue started at t, or -1 |
| `searchCues(cues, q)` | transcript search: case-insensitive, returns cue indexes |
| `toTxt(cues)` / `toVtt(cues)` | the .txt and .vtt downloads |
| `formatTime(s)` | `HH:MM:SS.mmm` (UI may shorten to `m:ss` for display) |

Click-to-seek = `player.seek(cue.start)`.

Track list: the component takes `tracks: { kind, lang, label, src }[]` (VTT URLs), fetches and parses each once, and offers captions tracks in the picker plus "Off". Descriptions tracks are a separate toggle. Sintel ships `captions.vtt` (en) and `ad.vtt` (descriptions).

Descriptions: shown as text in a live region (polite) when a description cue becomes active; optional voicing through `speechSynthesis` when the user turns "Voice descriptions" on (pause-while-speaking is a UI decision for the handoff). No alternate audio track in scope.

### 5a. Built helpers (feat/r4-video 343198e)

| API | What the UI does with it |
| --- | --- |
| `loadTracks(tracks)` returns `{ tracks, errors }` | Fetches and parses each VTT once. A failed file lands in `errors` (show it, keep playing); it never throws. |
| `captionTracks(t)` / `descriptionTracks(t)` | The captions picker list (plus "Off"), and the descriptions toggle's track. |
| `pickTrack(tracks, lang)` | Saved or browser language: exact match, then base language (`en-US` matches `en-GB`), then the first track. `'off'` returns none. |
| `createCueFollower(cues, onChange)` with `.update(t)` and `.reset()` | Call on `timeupdate`. `onChange({ active, entered, index })` fires only when something changes: `active` is the caption text to render, `entered` is what a live region announces, `index` is the transcript row to highlight and scroll to (-1 before the first cue). |
| `createDescriptions({ player, cues, lang, onText, speech, pauseWhileSpeaking })` | `setMode('off' \| 'text' \| 'voice')` returns the mode actually set (voice falls back to text without speech). `onText(text)` feeds the polite live region, and `''` clears it. `canVoice` tells you whether to show "Voice descriptions". `pauseWhileSpeaking` defaults to false; **the handoff decides it**. A user pause cancels speech. |
| `browserSpeech()` | A wrapper over `speechSynthesis`, or `null` where it's unsupported. |

### 5b. Buffering, provider captions, prefs, adapter errors (feat/r4-video)

**Buffering (the CTE and Creatives shape)**

- Events:
  - `'waiting'` means a stall started (show the Buffering pill), and `'resumed'` means it ended (hide it). They come as a pair, and `'resumed'` fires once per `'waiting'`.
  - Native and HLS: `waiting` and `stalled` start a stall; `playing` and `canplay` end it.
  - YouTube: state 3 (BUFFERING) starts a stall, and leaving 3 for PLAYING (1) or PAUSED (2) ends it.
  - Vimeo: `bufferstart` and `bufferend`.
- `'bufferedchange'`: the loaded amount changed. It's throttled to at most once every 250 ms (about 4 a second), and the last change always lands. On YouTube it comes from the 250 ms tick while playing or buffering.
- `getBuffered()` returns `{ fraction, ranges }`:
  - `fraction` is 0..1, or 0 when unknown.
  - `ranges` is `Array<[start, end]>` in seconds on native and HLS (from `TimeRanges`), and `null` on YouTube (`getVideoLoadedFraction`) and Vimeo (`progress.percent`).
  - The UI draws one fill from `fraction` when `ranges` is null.
- Capability flags (these replace `buffered`):
  - `canReportBuffering`: the waiting/resumed pair and `fraction` are real. When false, hide the pill and the fill. It's true on all four adapters.
  - `canReportBufferedRanges`: true on native and HLS only.

**Provider captions**

`capabilities.providerCaptions` is true only when the host passed `providerCaptions: '<lang>'` to `createPlayer` for a YouTube or Vimeo source that has no VTT of ours (CA ruling). The UI then hides our caption controls.

**Adapter errors**

A missing or broken optional peer (`@vimeo/player`, or `hls.js` on browsers without native HLS) rejects with `VideoAdapterUnavailable` (`name`, `adapter: 'vimeo' | 'hls'`, `module`, and `cause`). The UI catches it and shows a text link to the video in place of the player (CA). Tests cover a failed import and a module with no default export.

**Audio description track switching**

`descriptions.setTrack(cues, lang?)` swaps the AD track (another language or variant) and keeps the current mode. It cancels any speech in flight (and resumes playback if speech had paused it), then re-syncs the live region at the current time. Picking a new AD language in the menu calls `setTrack` with that track's cues.

**Prefs**

- `readVideoPrefs(storageKey?)` and `writeVideoPrefs(patch, storageKey?)` use `VIDEO_PREFS_KEY = 'ember:video:v1'`. Only the main player persists; demos don't call them (UX/UI).
- They hold `{ volume, muted, rate, captions, descriptions, pauseWhileReading, captionStyle }`:
  - `captions` is a language, `'off'`, or `null` when never chosen. With `null`, the UI shows captions on with the first track. **C** turns captions back on with the first track when the stored value is `'off'`.
  - `descriptions` is `'off'`, `'text'` or `'voice'`.
  - `pauseWhileReading` is a boolean, default false. It's the sub-toggle under "Read descriptions aloud" and only counts when `descriptions` is `'voice'`. It feeds `createDescriptions({ pauseWhileSpeaking })`.
  - `captionStyle` is `{ size: 's'|'m'|'l'|'xl', color: 'white'|'yellow'|'cyan'|'black', background: 'none'|'half'|'solid', font: 'sans'|'serif'|'mono' }`, with defaults m, white, solid and sans (`DEFAULT_CAPTION_STYLE`). Each field falls back to its default on its own (`cleanCaptionStyle`), and a `writeVideoPrefs({ captionStyle: { color } })` patch changes only the fields it names.
- A bad field is dropped and the rest are kept. A storage error falls back to the defaults silently.
- `toVtt` escapes `&`, `<` and `>`, so the .vtt download always parses back to the same text (BED).

**Media asset**

The Sintel excerpt comes from BED's assets card (PR #38), served as `/media/sintel/sintel-excerpt.mp4` from `stories/media/sintel/`. The player stories reference that path and don't copy the file.

### 5c. CSP plan, per path (only pages that mount the player need these)

| Source | Directives the page adds |
| --- | --- |
| native MP4/WebM, VTT | none beyond `'self'` (`media-src 'self'`, `connect-src 'self'` for the VTT fetch) |
| HLS native (Safari, iOS) | `media-src` plus the stream host |
| HLS via hls.js | `media-src 'self' blob:`, and `connect-src` plus the stream host |
| YouTube | `script-src https://www.youtube.com`, `frame-src https://www.youtube.com https://www.youtube-nocookie.com` (the embed host is youtube-nocookie) |
| Vimeo | `frame-src https://player.vimeo.com`; `@vimeo/player` is bundled (no third-party script), and it posts messages to the iframe only |

The Storybook and site defaults stay strict. A page opts in only to the rows for the sources it mounts.

## 6. Keyboard (UI layer, not the core)

The core handles no keys. Proposed map for the handoff (CA to confirm). Single-key shortcuts work only while focus is inside the player (WCAG 2.1.4) and never while focus is in the transcript search field:

| key | action |
|---|---|
| Space / K | play / pause (Space only when focus is not on another button) |
| ← / → | seek −5 s / +5 s |
| J / L | seek −10 s / +10 s |
| Home / End | start / end |
| ↑ / ↓ | volume ±10% (when `capabilities.volume`) |
| M | mute toggle |
| C | captions on/off (last-used track) |
| D | descriptions on/off |
| F | fullscreen toggle |
| < / > | speed down / up through `capabilities.rates` |
| T | focus the transcript |

Every control is also a real, labeled button or slider, so no shortcut is the only way to do anything.

## 7. Persisted preferences (superseded: see 5b, Creatives ruled ember:video:v1)

localStorage, same prefix style as the theme switcher (`jdilig:theme`):

| key | value |
|---|---|
| `jdilig:video:volume` | `0..1` |
| `jdilig:video:muted` | `"true"` / `"false"` |
| `jdilig:video:rate` | one of RATES |
| `jdilig:video:captions` | track `lang` or `"off"` |
| `jdilig:video:descriptions` | `"text"`, `"voice"` or `"off"` |
| `jdilig:video:caption-style` | JSON (size, background) only if the handoff defines caption settings |

Never autoplay is not a preference; it is fixed.

## 8. Not in the core

PiP (out). Caption styling, control layout, transcript layout and all visuals come from the signed handoff. Per-path CSP comes with the demo page.
