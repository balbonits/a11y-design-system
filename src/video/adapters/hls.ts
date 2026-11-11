// HLS adapter: native HLS first (Safari, iOS). hls.js is an optional peerDependency, imported
// only when a browser lacks native HLS. Needs `media-src 'self' blob:` on that page only.
import type { Player } from '../player';
import { createNativePlayer } from './native';

interface HlsCtor {
  new (): { loadSource(src: string): void; attachMedia(v: HTMLVideoElement): void; destroy(): void };
  isSupported(): boolean;
}

export const canPlayHlsNatively = (v: HTMLVideoElement) => v.canPlayType('application/vnd.apple.mpegurl') !== '';

/** Module name kept in a variable so bundlers leave the optional peer out of every chunk. */
const HLS_MODULE = 'hls.js';

export async function createHlsPlayer(
  video: HTMLVideoElement,
  src: string,
  load: () => Promise<{ default: HlsCtor }> = () => import(/* @vite-ignore */ HLS_MODULE),
): Promise<Player> {
  if (canPlayHlsNatively(video)) {
    video.src = src;
    return createNativePlayer(video, 'hls');
  }
  let Hls: HlsCtor;
  try {
    Hls = (await load()).default;
  } catch {
    throw new Error('HLS needs the optional peer dependency hls.js on browsers without native HLS.');
  }
  if (!Hls.isSupported()) throw new Error('HLS is not supported in this browser.');
  const hls = new Hls();
  hls.loadSource(src);
  hls.attachMedia(video);
  const p = createNativePlayer(video, 'hls');
  const destroy = p.destroy;
  return { ...p, destroy: () => (destroy(), hls.destroy()) };
}
