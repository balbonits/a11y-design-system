// R-4: the one internal player interface. Controls, the caption renderer and the transcript
// panel are built only on this; every source adapter (native, HLS, YouTube, Vimeo) implements it.
export type PlayerEvent = 'ready' | 'play' | 'pause' | 'timeupdate' | 'durationchange' | 'ended' | 'ratechange' | 'volumechange' | 'error';

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
