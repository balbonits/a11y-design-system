// YouTube adapter: youtube-nocookie.com via the IFrame API, whose script loads only when a
// YouTube source is used. That page's CSP needs the exact frame-src and script-src hosts.
import { Emitter, RATES, canFullscreen, type Player } from '../player';

export const YT_SCRIPT = 'https://www.youtube.com/iframe_api';
export const YT_HOST = 'https://www.youtube-nocookie.com';

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(s: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  setPlaybackRate(r: number): void;
  getPlaybackRate(): number;
  getAvailablePlaybackRates(): number[];
  getVideoLoadedFraction(): number;
  setVolume(v: number): void; // 0..100
  getVolume(): number;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  destroy(): void;
}
interface YTNamespace {
  Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayer;
}
type YTWindow = Window & { YT?: YTNamespace; onYouTubeIframeAPIReady?: () => void };

let apiPromise: Promise<YTNamespace> | null = null;

export function loadYouTubeApi(w: YTWindow = window as YTWindow): Promise<YTNamespace> {
  if (w.YT?.Player) return Promise.resolve(w.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(w.YT!);
    };
    const s = w.document.createElement('script');
    s.src = YT_SCRIPT;
    s.async = true;
    s.onerror = () => {
      apiPromise = null;
      reject(new Error('Could not load the YouTube IFrame API.'));
    };
    w.document.head.appendChild(s);
  });
  return apiPromise;
}

const PLAYING = 1;
const ENDED = 0;
const BUFFERING = 3;

export interface YouTubeOptions {
  /** Turn on YouTube's own captions (only for a source with no VTT of ours, CA ruling). A language code or true. */
  providerCaptions?: string | boolean;
}

export async function createYouTubePlayer(mount: HTMLElement, videoId: string, title: string, { providerCaptions = false }: YouTubeOptions = {}): Promise<Player> {
  const YT = await loadYouTubeApi();
  const em = new Emitter();
  let timer: ReturnType<typeof setInterval> | undefined;
  // The 250ms tick is the throttle for bufferedchange (YouTube has no progress event).
  let loaded = -1;
  let buffering = false;
  const tick = () => {
    em.emit('timeupdate');
    const f = yt.getVideoLoadedFraction();
    if (f !== loaded) {
      loaded = f;
      em.emit('bufferedchange');
    }
  };
  let yt!: YTPlayer;
  await new Promise<void>((resolve) => {
    yt = new YT.Player(mount, {
      host: YT_HOST,
      videoId,
      // No autoplay; YouTube's own controls off, ours drive it; captions come from our VTT unless
      // the source has none, then YouTube's own (CA ruling).
      playerVars: {
        autoplay: 0, controls: 0, disablekb: 1, modestbranding: 1, rel: 0, playsinline: 1, iv_load_policy: 3,
        cc_load_policy: providerCaptions ? 1 : 0,
        ...(typeof providerCaptions === 'string' ? { cc_lang_pref: providerCaptions } : {}),
      },
      events: {
        onReady: () => {
          const iframe = mount.tagName === 'IFRAME' ? mount : mount.querySelector('iframe');
          (iframe ?? document.getElementById(mount.id))?.setAttribute('title', title);
          em.emit('ready');
          em.emit('durationchange');
          resolve();
        },
        onStateChange: (e: { data: number }) => {
          clearInterval(timer);
          if (buffering && e.data !== BUFFERING) {
            buffering = false;
            em.emit('resumed');
          }
          if (e.data === PLAYING) {
            timer = setInterval(tick, 250);
            em.emit('play');
          } else if (e.data === BUFFERING) {
            timer = setInterval(tick, 250);
            buffering = true;
            em.emit('waiting');
          } else if (e.data === ENDED) em.emit('ended');
          else em.emit('pause');
        },
        onPlaybackRateChange: () => em.emit('ratechange'),
        onError: (e: { data: number }) => em.emit('error', e.data),
      },
    });
  });
  const ytRates = new Set(yt.getAvailablePlaybackRates());
  const rates = RATES.filter((r) => ytRates.has(r));
  return {
    kind: 'youtube',
    capabilities: { rate: rates.length > 1, rates, volume: true, fullscreen: canFullscreen(), canReportBuffering: true, canReportBufferedRanges: false, providerCaptions: Boolean(providerCaptions) },
    play: async () => yt.playVideo(),
    pause: async () => yt.pauseVideo(),
    seek: async (s) => {
      yt.seekTo(Math.max(0, s), true);
      em.emit('timeupdate');
    },
    getTime: () => yt.getCurrentTime(),
    getDuration: () => yt.getDuration(),
    isPaused: () => yt.getPlayerState() !== PLAYING,
    setRate: async (r) => yt.setPlaybackRate(r),
    getRate: () => yt.getPlaybackRate(),
    setVolume: async (v) => {
      yt.setVolume(Math.round(Math.min(1, Math.max(0, v)) * 100));
      em.emit('volumechange');
    },
    getVolume: () => yt.getVolume() / 100,
    setMuted: async (m) => {
      if (m) yt.mute();
      else yt.unMute();
      em.emit('volumechange');
    },
    isMuted: () => yt.isMuted(),
    getBuffered: () => ({ fraction: Math.min(1, Math.max(0, yt.getVideoLoadedFraction() || 0)), ranges: null }),
    on: (e, fn) => em.on(e, fn),
    destroy: () => {
      clearInterval(timer);
      yt.destroy();
      em.clear();
    },
  };
}
