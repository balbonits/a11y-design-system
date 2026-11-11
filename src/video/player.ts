// R-4: the one internal player interface. Controls, the caption renderer and the transcript
// panel are built only on this; every source adapter (native, HLS, YouTube, Vimeo) implements it.
export type PlayerEvent = 'ready' | 'play' | 'pause' | 'timeupdate' | 'durationchange' | 'ended' | 'ratechange' | 'volumechange' | 'error' | 'waiting' | 'resumed' | 'bufferedchange';

export interface Player {
  readonly kind: SourceKind;
  readonly capabilities: Capabilities;
  play(): Promise<void>;
  pause(): Promise<void>;
  seek(seconds: number): Promise<void>;
  getTime(): number;
  getDuration(): number;
  isPaused(): boolean;
  setRate(rate: number): Promise<void>;
  getRate(): number;
  setVolume(v: number): Promise<void>; // 0..1
  getVolume(): number;
  setMuted(m: boolean): Promise<void>;
  isMuted(): boolean;
  /** What's loaded: fraction of the duration (0..1, 0 when unknown) and ranges in seconds where the source reports them. */
  getBuffered(): Buffered;
  on(e: PlayerEvent, fn: (detail?: unknown) => void): () => void;
  destroy(): void;
}

export type SourceKind = 'native' | 'hls' | 'youtube' | 'vimeo';

export interface VideoSource {
  src: string;
  /** Optional MIME type, e.g. video/mp4 or application/vnd.apple.mpegurl. */
  type?: string;
}

/** Playback rates offered by the speed control (1-VP: 0.5x to 2x). */
export const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

/**
 * What a source can do, so the UI can hide or disable a control instead of offering one that fails.
 * Captions, descriptions and the transcript are always ours (rendered from the cue model), so they
 * are not flags. PiP is out of scope (CTE).
 */
export interface Capabilities {
  /** Rate changes work (Vimeo needs a paid owner account; YouTube supports its own list). */
  rate: boolean;
  /** Rates this source accepts, a subset of RATES. */
  rates: readonly number[];
  /** Volume level is settable (iOS Safari: native volume is read-only, mute still works). */
  volume: boolean;
  /** Fullscreen API is available for the player container. */
  fullscreen: boolean;
  /** 'waiting'/'resumed' and getBuffered().fraction carry real data; when false the UI hides the Buffering pill and the fill. */
  canReportBuffering: boolean;
  /** getBuffered().ranges is an array (native, HLS); when false it's null and the UI draws one fill from fraction. */
  canReportBufferedRanges: boolean;
  /** The provider renders its own captions (YouTube/Vimeo source with no VTT of ours, CA ruling); the UI hides our caption controls. */
  providerCaptions: boolean;
}


export interface Buffered {
  fraction: number;
  ranges: Array<[number, number]> | null;
}

/** A source adapter whose optional peer module (hls.js, @vimeo/player) isn't installed or failed to load. The UI shows a text link to the video instead of a blank box. */
export class VideoAdapterUnavailable extends Error {
  readonly name = 'VideoAdapterUnavailable';
  constructor(readonly adapter: 'hls' | 'vimeo', readonly module: string, options?: { cause?: unknown }) {
    super(`The ${adapter} adapter needs the optional peer dependency ${module}.`, options);
  }
}

/** Calls fn at most once per `ms`, with a trailing call so the last change always lands. */
export function throttle(fn: () => void, ms = 250, now: () => number = () => Date.now()): (() => void) & { cancel(): void } {
  let last = -Infinity;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const run = () => {
    last = now();
    timer = undefined;
    fn();
  };
  const t = () => {
    const wait = last + ms - now();
    if (wait <= 0) {
      clearTimeout(timer);
      run();
    } else timer ??= setTimeout(run, wait);
  };
  return Object.assign(t, { cancel: () => clearTimeout(timer) });
}

export function rangesOf(r: Pick<TimeRanges, 'length' | 'start' | 'end'>): Array<[number, number]> {
  return Array.from({ length: r.length }, (_, i) => [r.start(i), r.end(i)] as [number, number]);
}

/**
 * Fraction loaded from TimeRanges: the end of the range holding the playhead (else the furthest end)
 * over the duration. Returns 0 for an unknown or infinite duration.
 */
export function bufferedFraction(ranges: Pick<TimeRanges, 'length' | 'start' | 'end'>, time: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0 || ranges.length === 0) return 0;
  let end = 0;
  for (let i = 0; i < ranges.length; i++) {
    if (ranges.start(i) <= time && time <= ranges.end(i)) {
      end = ranges.end(i);
      break;
    }
    end = Math.max(end, ranges.end(i));
  }
  return Math.min(1, Math.max(0, end / duration));
}

/** Small event hub shared by the adapters. */
export class Emitter {
  private map = new Map<PlayerEvent, Set<(d?: unknown) => void>>();
  on(e: PlayerEvent, fn: (d?: unknown) => void): () => void {
    let set = this.map.get(e);
    if (!set) this.map.set(e, (set = new Set()));
    set.add(fn);
    return () => set!.delete(fn);
  }
  emit(e: PlayerEvent, d?: unknown): void {
    this.map.get(e)?.forEach((fn) => fn(d));
  }
  clear(): void {
    this.map.clear();
  }
}

const YT = /^(?:https?:)?\/\/(?:www\.)?(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/;
const VIMEO = /^(?:https?:)?\/\/(?:www\.|player\.)?vimeo\.com\/(?:video\/)?(\d+)/;

export function youtubeId(src: string): string | null {
  return YT.exec(src)?.[1] ?? null;
}
export function vimeoId(src: string): string | null {
  return VIMEO.exec(src)?.[1] ?? null;
}

/** Pick the adapter for a source. HLS only when the type or extension says so. */
export function detectKind(s: VideoSource): SourceKind {
  if (youtubeId(s.src)) return 'youtube';
  if (vimeoId(s.src)) return 'vimeo';
  if (s.type === 'application/vnd.apple.mpegurl' || s.type === 'application/x-mpegURL' || /\.m3u8(?:$|\?)/.test(s.src)) return 'hls';
  return 'native';
}

/** Volume is settable unless the platform ignores writes (iOS). Probe once on a scratch element. */
export function canSetVolume(doc: Document = document): boolean {
  const v = doc.createElement('video');
  try {
    v.volume = 0.5;
  } catch {
    return false;
  }
  return v.volume === 0.5;
}

export function canFullscreen(doc: Document = document): boolean {
  return Boolean(doc.fullscreenEnabled);
}
