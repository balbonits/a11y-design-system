import { describe, expect, it, vi } from 'vitest';
import { VideoAdapterUnavailable, bufferedFraction, rangesOf, throttle } from './player';
import { createYouTubePlayer } from './adapters/youtube';
import { createHlsPlayer } from './adapters/hls';
import { createNativePlayer } from './adapters/native';
import { createVimeoPlayer } from './adapters/vimeo';
import { DEFAULT_VIDEO_PREFS, VIDEO_PREFS_KEY, readVideoPrefs, writeVideoPrefs } from './prefs';

const ranges = (...r: [number, number][]) => ({ length: r.length, start: (i: number) => r[i][0], end: (i: number) => r[i][1] });

describe('buffering (CTE shape)', () => {
  it('bufferedFraction uses the range holding the playhead, else the furthest end', () => {
    expect(bufferedFraction(ranges([0, 20], [50, 80]), 10, 100)).toBe(0.2);
    expect(bufferedFraction(ranges([0, 20], [50, 80]), 60, 100)).toBe(0.8);
    expect(bufferedFraction(ranges([0, 20], [50, 80]), 30, 100)).toBe(0.8);
    expect(bufferedFraction(ranges(), 0, 100)).toBe(0);
    expect(bufferedFraction(ranges([0, 5]), 0, Infinity)).toBe(0);
    expect(bufferedFraction(ranges([0, 5]), 0, NaN)).toBe(0);
    expect(rangesOf(ranges([0, 5], [9, 12]))).toEqual([[0, 5], [9, 12]]);
  });
  it('throttle runs at most once per window and always delivers the trailing call', () => {
    vi.useFakeTimers();
    let t = 0;
    const fn = vi.fn();
    const th = throttle(fn, 250, () => t);
    th(); // leading
    t = 100; th(); th(); // folded into one trailing call
    expect(fn).toHaveBeenCalledTimes(1);
    t = 250; vi.advanceTimersByTime(150);
    expect(fn).toHaveBeenCalledTimes(2);
    th.cancel();
    vi.useRealTimers();
  });
  it('native: waiting/stalled start one stall, playing/canplay end it once; ranges come from TimeRanges', () => {
    const v = document.createElement('video');
    Object.defineProperty(v, 'buffered', { value: ranges([0, 30]) });
    Object.defineProperty(v, 'duration', { value: 60 });
    const p = createNativePlayer(v);
    const seen: string[] = [];
    for (const e of ['waiting', 'resumed', 'bufferedchange'] as const) p.on(e, () => seen.push(e));
    for (const e of ['waiting', 'stalled', 'playing', 'canplay', 'progress', 'canplay']) v.dispatchEvent(new Event(e));
    expect(seen).toEqual(['waiting', 'resumed', 'bufferedchange']);
    expect(p.capabilities).toMatchObject({ canReportBuffering: true, canReportBufferedRanges: true, providerCaptions: false });
    expect(p.getBuffered()).toEqual({ fraction: 0.5, ranges: [[0, 30]] });
    p.destroy();
  });
  it('youtube: BUFFERING (3) emits waiting, leaving it to 1 or 2 emits resumed; ranges are null', async () => {
    let ev: { onReady: () => void; onStateChange: (e: { data: number }) => void } | undefined;
    let vars: Record<string, unknown> = {};
    const yt = { getAvailablePlaybackRates: () => [1, 2], getVideoLoadedFraction: () => 0.25, getPlayerState: () => 2, destroy: () => {} };
    (window as unknown as { YT: unknown }).YT = {
      Player: class {
        constructor(_el: HTMLElement, o: { playerVars: Record<string, unknown>; events: typeof ev }) {
          vars = o.playerVars;
          ev = o.events;
          queueMicrotask(() => ev!.onReady());
          return yt as never;
        }
      },
    };
    const p = await createYouTubePlayer(document.createElement('div'), 'abcdefghijk', 't');
    const seen: string[] = [];
    for (const e of ['waiting', 'resumed', 'play', 'pause'] as const) p.on(e, () => seen.push(e));
    ev!.onStateChange({ data: 3 });
    ev!.onStateChange({ data: 1 });
    ev!.onStateChange({ data: 3 });
    ev!.onStateChange({ data: 2 });
    expect(seen).toEqual(['waiting', 'resumed', 'play', 'waiting', 'resumed', 'pause']);
    expect(p.getBuffered()).toEqual({ fraction: 0.25, ranges: null });
    expect(p.capabilities).toMatchObject({ canReportBuffering: true, canReportBufferedRanges: false, providerCaptions: false });
    expect(vars.cc_load_policy).toBe(0);
    await createYouTubePlayer(document.createElement('div'), 'abcdefghijk', 't', { providerCaptions: 'en' });
    expect(vars).toMatchObject({ cc_load_policy: 1, cc_lang_pref: 'en' });
    p.destroy();
  });
  it('vimeo: bufferstart/bufferend map to waiting/resumed, progress to a throttled bufferedchange; provider captions only when asked', async () => {
    const handlers: Record<string, (d: Record<string, number>) => void> = {};
    let opts: Record<string, unknown> = {};
    class Fake {
      constructor(_el: HTMLElement, o: Record<string, unknown>) { opts = o; }
      ready = async () => {};
      play = async () => {};
      pause = async () => {};
      setCurrentTime = async (s: number) => s;
      getDuration = async () => 100;
      setPlaybackRate = async (r: number) => r;
      setVolume = async (v: number) => v;
      setMuted = async (m: boolean) => m;
      on = (e: string, fn: (d: Record<string, number>) => void) => void (handlers[e] = fn);
      destroy = async () => {};
    }
    const mount = document.createElement('div');
    const p = await createVimeoPlayer(mount, '1', 't', async () => ({ default: Fake as never }));
    expect(opts.texttrack).toBeUndefined();
    expect(p.capabilities).toMatchObject({ canReportBuffering: true, canReportBufferedRanges: false, providerCaptions: false });
    const seen: string[] = [];
    for (const e of ['waiting', 'resumed', 'bufferedchange'] as const) p.on(e, () => seen.push(e));
    handlers.bufferstart({});
    handlers.progress({ percent: 0.4 });
    handlers.progress({ percent: 0.5 }); // within 250ms: trailing, not immediate
    handlers.bufferend({});
    expect(seen).toEqual(['waiting', 'bufferedchange', 'resumed']);
    expect(p.getBuffered()).toEqual({ fraction: 0.5, ranges: null });
    p.destroy();
    const p2 = await createVimeoPlayer(mount, '1', 't', async () => ({ default: Fake as never }), { providerCaptions: 'en' });
    expect(opts.texttrack).toBe('en');
    expect(p2.capabilities.providerCaptions).toBe(true);
    p2.destroy();
  });
  it('a missing optional peer rejects with VideoAdapterUnavailable (vimeo and hls)', async () => {
    const mount = document.createElement('div');
    const missing = async () => { throw new TypeError('Failed to resolve module specifier'); };
    const e1 = await createVimeoPlayer(mount, '1', 't', missing).catch((e) => e);
    expect(e1).toBeInstanceOf(VideoAdapterUnavailable);
    expect(e1).toMatchObject({ name: 'VideoAdapterUnavailable', adapter: 'vimeo', module: '@vimeo/player' });
    expect(e1.cause).toBeInstanceOf(TypeError);
    const e2 = await createVimeoPlayer(mount, '1', 't', async () => ({ default: undefined as never })).catch((e) => e);
    expect(e2).toBeInstanceOf(VideoAdapterUnavailable);
    const v = document.createElement('video');
    v.canPlayType = () => '';
    const e3 = await createHlsPlayer(v, '/x.m3u8', missing).catch((e) => e);
    expect(e3).toMatchObject({ name: 'VideoAdapterUnavailable', adapter: 'hls', module: 'hls.js' });
  });
});

function mem() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: vi.fn((k: string, v: string) => void m.set(k, v)), m };
}

describe('video prefs (ember:video:v1)', () => {
  it('defaults when empty, round-trips a change, and honours a host storageKey', () => {
    const s = mem();
    expect(readVideoPrefs(VIDEO_PREFS_KEY, s)).toEqual(DEFAULT_VIDEO_PREFS);
    expect(writeVideoPrefs({ rate: 1.5, captions: 'en', descriptions: 'voice' }, VIDEO_PREFS_KEY, s)).toMatchObject({ rate: 1.5, captions: 'en', descriptions: 'voice', volume: 1 });
    expect(JSON.parse(s.m.get('ember:video:v1')!)).toMatchObject({ rate: 1.5 });
    writeVideoPrefs({ muted: true }, 'host:player', s);
    expect(readVideoPrefs('host:player', s).muted).toBe(true);
    expect(readVideoPrefs(VIDEO_PREFS_KEY, s).muted).toBe(false);
  });
  it('drops bad fields one by one and survives bad JSON and throwing storage', () => {
    const s = mem();
    s.m.set(VIDEO_PREFS_KEY, JSON.stringify({ volume: 7, rate: 1.75, muted: true, descriptions: 'loud', captions: 'off' }));
    expect(readVideoPrefs(VIDEO_PREFS_KEY, s)).toEqual({ ...DEFAULT_VIDEO_PREFS, muted: true, captions: 'off' });
    s.m.set(VIDEO_PREFS_KEY, '{nope');
    expect(readVideoPrefs(VIDEO_PREFS_KEY, s)).toEqual(DEFAULT_VIDEO_PREFS);
    const bad = { getItem: () => { throw new Error('SecurityError'); }, setItem: () => { throw new Error('QuotaExceeded'); } };
    expect(readVideoPrefs(VIDEO_PREFS_KEY, bad)).toEqual(DEFAULT_VIDEO_PREFS);
    expect(writeVideoPrefs({ volume: 0.3 }, VIDEO_PREFS_KEY, bad).volume).toBe(0.3);
    expect(readVideoPrefs(VIDEO_PREFS_KEY, null)).toEqual(DEFAULT_VIDEO_PREFS);
  });
});
