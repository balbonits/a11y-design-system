// Native <video> adapter: the default and the first choice for every source it can play.
import { Emitter, RATES, canFullscreen, canSetVolume, bufferedFraction, type Player, type PlayerEvent } from '../player';

const EVENTS: PlayerEvent[] = ['play', 'pause', 'timeupdate', 'durationchange', 'ended', 'ratechange', 'volumechange', 'error', 'waiting', 'progress'];

export function createNativePlayer(video: HTMLVideoElement, kind: 'native' | 'hls' = 'native'): Player {
  const em = new Emitter();
  const offs = EVENTS.map((e) => {
    const fn = () => em.emit(e);
    video.addEventListener(e, fn);
    return () => video.removeEventListener(e, fn);
  });
  const ready = () => em.emit('ready');
  video.addEventListener('loadedmetadata', ready);
  // 'playing' ends a 'waiting' stall; the UI clears its Buffering state on the next 'play'.
  const playing = () => em.emit('play');
  video.addEventListener('playing', playing);
  // 1-VP: never autoplay.
  video.autoplay = false;
  return {
    kind,
    capabilities: { rate: true, rates: RATES, volume: canSetVolume(), fullscreen: canFullscreen(), buffered: true, providerCaptions: false },
    play: () => video.play(),
    pause: async () => video.pause(),
    seek: async (s) => {
      const d = Number.isFinite(video.duration) ? video.duration : Infinity;
      video.currentTime = Math.min(Math.max(0, s), d);
    },
    getTime: () => video.currentTime,
    getDuration: () => (Number.isFinite(video.duration) ? video.duration : 0),
    isPaused: () => video.paused,
    setRate: async (r) => {
      video.playbackRate = r;
    },
    getRate: () => video.playbackRate,
    setVolume: async (v) => {
      video.volume = Math.min(1, Math.max(0, v));
    },
    getVolume: () => video.volume,
    setMuted: async (m) => {
      video.muted = m;
    },
    isMuted: () => video.muted,
    getBuffered: () => bufferedFraction(video.buffered, video.currentTime, video.duration),
    on: (e, fn) => em.on(e, fn),
    destroy: () => {
      offs.forEach((o) => o());
      video.removeEventListener('loadedmetadata', ready);
      video.removeEventListener('playing', playing);
      em.clear();
    },
  };
}
