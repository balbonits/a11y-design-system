// Vimeo adapter: @vimeo/player, imported only when a Vimeo source is used.
// Pending John's install OK (ARCH-REVIEW R-4 wants it bundled); until then it resolves at runtime.
import { Emitter, RATES, canFullscreen, type Player } from '../player';

interface VimeoPlayer {
  ready(): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  setCurrentTime(s: number): Promise<number>;
  getDuration(): Promise<number>;
  setPlaybackRate(r: number): Promise<number>;
  setVolume(v: number): Promise<number>;
  setMuted(m: boolean): Promise<boolean>;
  on(e: string, fn: (d: { seconds?: number; duration?: number; playbackRate?: number; volume?: number }) => void): void;
  destroy(): Promise<void>;
}
type VimeoCtor = new (el: HTMLElement, opts: Record<string, unknown>) => VimeoPlayer;

const VIMEO_MODULE = '@vimeo/player';

export async function createVimeoPlayer(
  mount: HTMLElement,
  id: string,
  title: string,
  load: () => Promise<{ default: VimeoCtor }> = () => import(/* @vite-ignore */ VIMEO_MODULE),
): Promise<Player> {
  const Ctor = (await load()).default;
  const vp = new Ctor(mount, { id: Number(id), autoplay: false, controls: false, dnt: true, title: false, byline: false, portrait: false, playsinline: true });
  await vp.ready();
  mount.querySelector('iframe')?.setAttribute('title', title);
  const em = new Emitter();
  // Rate changes need a Vimeo Plus/Pro owner account; probe once and report it.
  const rateOk = await vp.setPlaybackRate(1).then(() => true, () => false);
  const s = { time: 0, duration: await vp.getDuration(), paused: true, rate: 1, volume: 1, muted: false };
  vp.on('timeupdate', (d) => {
    s.time = d.seconds ?? s.time;
    em.emit('timeupdate');
  });
  vp.on('play', () => ((s.paused = false), em.emit('play')));
  vp.on('pause', () => ((s.paused = true), em.emit('pause')));
  vp.on('ended', () => ((s.paused = true), em.emit('ended')));
  vp.on('durationchange', (d) => ((s.duration = d.duration ?? s.duration), em.emit('durationchange')));
  vp.on('playbackratechange', (d) => ((s.rate = d.playbackRate ?? s.rate), em.emit('ratechange')));
  vp.on('volumechange', (d) => ((s.volume = d.volume ?? s.volume), em.emit('volumechange')));
  vp.on('error', (d) => em.emit('error', d));
  queueMicrotask(() => em.emit('ready'));
  return {
    kind: 'vimeo',
    capabilities: { rate: rateOk, rates: rateOk ? RATES : [1], volume: true, fullscreen: canFullscreen() },
    play: () => vp.play(),
    pause: () => vp.pause(),
    seek: async (t) => {
      s.time = await vp.setCurrentTime(Math.max(0, t));
      em.emit('timeupdate');
    },
    getTime: () => s.time,
    getDuration: () => s.duration,
    isPaused: () => s.paused,
    setRate: async (r) => void (s.rate = await vp.setPlaybackRate(r)),
    getRate: () => s.rate,
    setVolume: async (v) => void (s.volume = await vp.setVolume(Math.min(1, Math.max(0, v)))),
    getVolume: () => s.volume,
    setMuted: async (m) => {
      s.muted = await vp.setMuted(m);
      em.emit('volumechange');
    },
    isMuted: () => s.muted,
    on: (e, fn) => em.on(e, fn),
    destroy: () => {
      void vp.destroy();
      em.clear();
    },
  };
}
