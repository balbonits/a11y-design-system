// Native <video> adapter: the default and the first choice for every source it can play.
import { Emitter, RATES, canFullscreen, canSetVolume, bufferedFraction, rangesOf, throttle, type Player, type PlayerEvent } from '../player';

const EVENTS: PlayerEvent[] = ['play', 'pause', 'timeupdate', 'durationchange', 'ended', 'ratechange', 'volumechange', 'error'];

export function createNativePlayer(video: HTMLVideoElement, kind: 'native' | 'hls' = 'native'): Player {
  const em = new Emitter();
  const offs = EVENTS.map((e) => {
    const fn = () => em.emit(e);
    video.addEventListener(e, fn);
    return () => video.removeEventListener(e, fn);
  });
  const ready = () => em.emit('ready');
  video.addEventListener('loadedmetadata', ready);
  // Buffering (CTE shape): waiting/stalled start a stall, playing/canplay end it (once); progress is throttled.
  let stalled = false;
  const onWait = () => {
    if (!stalled) {
      stalled = true;
      em.emit('waiting');
    }
  };
  const onResume = () => {
    if (stalled) {
      stalled = false;
      em.emit('resumed');
    }
  };
  const progress = throttle(() => em.emit('bufferedchange'));
  const media: [string, () => void][] = [['waiting', onWait], ['stalled', onWait], ['playing', onResume], ['canplay', onResume], ['progress', progress]];
  media.forEach(([e, fn]) => video.addEventListener(e, fn));
  // 1-VP: never autoplay.
  video.autoplay = false;
  return {
    kind,
    capabilities: { rate: true, rates: RATES, volume: canSetVolume(), fullscreen: canFullscreen(), canReportBuffering: true, canReportBufferedRanges: true, providerCaptions: false },
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
    getBuffered: () => ({ fraction: bufferedFraction(video.buffered, video.currentTime, video.duration), ranges: rangesOf(video.buffered) }),
    on: (e, fn) => em.on(e, fn),
    destroy: () => {
      offs.forEach((o) => o());
      video.removeEventListener('loadedmetadata', ready);
      media.forEach(([e, fn]) => video.removeEventListener(e, fn));
      progress.cancel();
      em.clear();
    },
  };
}
