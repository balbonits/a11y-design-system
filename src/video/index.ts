// ember-ui/video: a separate entry so the core bundle never carries player code (R-4).
// Adapters other than native load lazily, only when their source type is used.
export * from './vtt';
export * from './player';
export { createNativePlayer } from './adapters/native';

import { detectKind, vimeoId, youtubeId, type Player, type VideoSource } from './player';
import { createNativePlayer } from './adapters/native';

export interface CreatePlayerOptions {
  source: VideoSource;
  /** The <video> element used for native and HLS sources. */
  video?: HTMLVideoElement;
  /** Mount element for YouTube and Vimeo iframes. */
  mount?: HTMLElement;
  /** Accessible title for the embedded iframe. */
  title: string;
}

export async function createPlayer({ source, video, mount, title }: CreatePlayerOptions): Promise<Player> {
  const kind = detectKind(source);
  if (kind === 'youtube' || kind === 'vimeo') {
    if (!mount) throw new Error(`${kind} sources need a mount element.`);
    if (kind === 'youtube') return (await import('./adapters/youtube')).createYouTubePlayer(mount, youtubeId(source.src)!, title);
    return (await import('./adapters/vimeo')).createVimeoPlayer(mount, vimeoId(source.src)!, title);
  }
  if (!video) throw new Error(`${kind} sources need a <video> element.`);
  if (kind === 'hls') return (await import('./adapters/hls')).createHlsPlayer(video, source.src);
  video.src = source.src;
  return createNativePlayer(video);
}
export * from './tracks';
export * from './descriptions';
