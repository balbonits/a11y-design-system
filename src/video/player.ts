// R-4: the one internal player interface. Controls, the caption renderer and the transcript
// panel are built only on this; every source adapter (native, HLS, YouTube, Vimeo) implements it.
export type PlayerEvent = 'ready' | 'play' | 'pause' | 'timeupdate' | 'durationchange' | 'ended' | 'ratechange' | 'volumechange' | 'error';

export interface Player {
  readonly kind: SourceKind;
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
export const RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;

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
