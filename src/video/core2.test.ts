import { describe, expect, it, vi } from 'vitest';
import { bufferedFraction } from './player';
import { createNativePlayer } from './adapters/native';
import { createVimeoPlayer } from './adapters/vimeo';
import { DEFAULT_VIDEO_PREFS, VIDEO_PREFS_KEY, readVideoPrefs, writeVideoPrefs } from './prefs';

const ranges = (...r: [number, number][]) => ({ length: r.length, start: (i: number) => r[i][0], end: (i: number) => r[i][1] });

describe('buffering', () => {
  it('bufferedFraction uses the range holding the playhead, else the furthest end', () => {
    expect(bufferedFraction(ranges([0, 20], [50, 80]), 10, 100)).toBe(0.2);
    expect(bufferedFraction(ranges([0, 20], [50, 80]), 60, 100)).toBe(0.8);
    expect(bufferedFraction(ranges([0, 20], [50, 80]), 30, 100)).toBe(0.8);
    expect(bufferedFraction(ranges(), 0, 100)).toBe(0);
    expect(bufferedFraction(ranges([0, 5]), 0, Infinity)).toBe(0);
    expect(bufferedFraction(ranges([0, 5]), 0, NaN)).toBe(0);
  });
  it('native forwards waiting and progress, and playing ends a stall', () => {
    const v = document.createElement('video');
    const p = createNativePlayer(v);
    const seen: string[] = [];
    for (const e of ['waiting', 'progress', 'play'] as const) p.on(e, () => seen.push(e));
    v.dispatchEvent(new Event('waiting'));
    v.dispatchEvent(new Event('progress'));
    v.dispatchEvent(new Event('playing'));
    expect(seen).toEqual(['waiting', 'progress', 'play']);
    expect(p.capabilities).toMatchObject({ buffered: true, providerCaptions: false });
    expect(p.getBuffered()).toBe(0);
    p.destroy();
  });
  it('vimeo maps bufferstart/bufferend/progress and passes provider captions only when asked', async () => {
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
    expect(p.capabilities.providerCaptions).toBe(false);
    const seen: string[] = [];
    for (const e of ['waiting', 'progress', 'play'] as const) p.on(e, () => seen.push(e));
    handlers.bufferstart({});
    handlers.progress({ percent: 0.4 });
    handlers.bufferend({}); // paused: no play
    handlers.play({});
    handlers.bufferend({});
    expect(seen).toEqual(['waiting', 'progress', 'play', 'play']);
    expect(p.getBuffered()).toBe(0.4);
    const p2 = await createVimeoPlayer(mount, '1', 't', async () => ({ default: Fake as never }), { providerCaptions: 'en' });
    expect(opts.texttrack).toBe('en');
    expect(p2.capabilities.providerCaptions).toBe(true);
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
