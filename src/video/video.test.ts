import captionsVtt from '../../stories/media/sintel/captions.vtt?raw';
import adVtt from '../../stories/media/sintel/ad.vtt?raw';
import { describe, expect, it, vi } from 'vitest';
import { activeCues, cueIndexAt, formatTime, parseTime, parseVtt, searchCues, toTxt, toVtt } from './vtt';
import { detectKind, vimeoId, youtubeId } from './player';
import { createNativePlayer } from './adapters/native';
import { createHlsPlayer } from './adapters/hls';

const SAMPLE = `WEBVTT - demo

NOTE ignored

1
00:00:01.000 --> 00:00:03.500 align:start
<v Sintel>Hello &amp; welcome</v>

00:04.000 --> 00:06.000
Second <i>line</i>
continues
`;

describe('WebVTT cue model', () => {
  it('parses timestamps both ways', () => {
    expect(parseTime('01:02:03.004')).toBeCloseTo(3723.004);
    expect(parseTime('02:03.500')).toBe(123.5);
    expect(formatTime(3723.004)).toBe('01:02:03.004');
    expect(() => parseTime('1:2')).toThrow();
  });
  it('parses cues, strips tags, skips NOTE and settings', () => {
    const cues = parseVtt(SAMPLE);
    expect(cues).toEqual([
      { id: '1', start: 1, end: 3.5, text: 'Hello & welcome' },
      { id: '2', start: 4, end: 6, text: 'Second line\ncontinues' },
    ]);
    expect(() => parseVtt('nope')).toThrow(/WEBVTT/);
  });
  it('finds active cues, the current index and search hits', () => {
    const cues = parseVtt(SAMPLE);
    expect(activeCues(cues, 2).map((c) => c.id)).toEqual(['1']);
    expect(activeCues(cues, 3.5)).toEqual([]);
    expect(cueIndexAt(cues, 0.5)).toBe(-1);
    expect(cueIndexAt(cues, 3.7)).toBe(0);
    expect(cueIndexAt(cues, 10)).toBe(1);
    expect(searchCues(cues, 'LINE')).toEqual([1]);
    expect(searchCues(cues, '  ')).toEqual([]);
  });
  it('round-trips to .vtt and writes a .txt transcript', () => {
    const cues = parseVtt(SAMPLE);
    expect(parseVtt(toVtt(cues))).toEqual(cues);
    expect(toTxt(cues)).toBe('Hello & welcome\nSecond line continues\n');
  });
  it('parses the committed Sintel captions and AD tracks', () => {
    for (const src of [captionsVtt, adVtt]) {
      const cues = parseVtt(src);
      expect(cues.length).toBeGreaterThan(0);
      cues.forEach((c) => expect(c.end).toBeGreaterThan(c.start));
    }
  });
});

describe('source detection', () => {
  it('routes each source to one adapter', () => {
    expect(detectKind({ src: '/m/clip.mp4' })).toBe('native');
    expect(detectKind({ src: '/m/master.m3u8' })).toBe('hls');
    expect(detectKind({ src: '/m/x', type: 'application/vnd.apple.mpegurl' })).toBe('hls');
    expect(detectKind({ src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })).toBe('youtube');
    expect(detectKind({ src: 'https://vimeo.com/76979871' })).toBe('vimeo');
    expect(youtubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(youtubeId('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(vimeoId('https://player.vimeo.com/video/76979871')).toBe('76979871');
  });
});

describe('native adapter', () => {
  it('drives the <video> element and relays events', async () => {
    const v = document.createElement('video');
    v.autoplay = true;
    const p = createNativePlayer(v);
    expect(v.autoplay).toBe(false);
    const onPause = vi.fn();
    const off = p.on('pause', onPause);
    v.dispatchEvent(new Event('pause'));
    expect(onPause).toHaveBeenCalledTimes(1);
    off();
    v.dispatchEvent(new Event('pause'));
    expect(onPause).toHaveBeenCalledTimes(1);
    await p.setRate(1.5);
    expect(p.getRate()).toBe(1.5);
    await p.setVolume(2);
    expect(p.getVolume()).toBe(1);
    await p.setMuted(true);
    expect(p.isMuted()).toBe(true);
    await p.seek(-5);
    expect(p.getTime()).toBe(0);
    p.destroy();
  });
});

describe('HLS adapter', () => {
  it('uses native HLS when the browser has it, without loading hls.js', async () => {
    const v = document.createElement('video');
    v.canPlayType = () => 'maybe';
    const load = vi.fn();
    const p = await createHlsPlayer(v, '/m/master.m3u8', load);
    expect(load).not.toHaveBeenCalled();
    expect(p.kind).toBe('hls');
    expect(v.getAttribute('src') ?? v.src).toContain('master.m3u8');
  });
  it('lazy-loads hls.js only when native HLS is missing, and cleans it up', async () => {
    const v = document.createElement('video');
    v.canPlayType = () => '';
    const inst = { loadSource: vi.fn(), attachMedia: vi.fn(), destroy: vi.fn() };
    const Hls = Object.assign(vi.fn(() => inst), { isSupported: () => true });
    const p = await createHlsPlayer(v, '/m/master.m3u8', async () => ({ default: Hls as never }));
    expect(inst.loadSource).toHaveBeenCalledWith('/m/master.m3u8');
    expect(inst.attachMedia).toHaveBeenCalledWith(v);
    p.destroy();
    expect(inst.destroy).toHaveBeenCalled();
  });
  it('says plainly when hls.js is not installed', async () => {
    const v = document.createElement('video');
    v.canPlayType = () => '';
    await expect(createHlsPlayer(v, '/m/x.m3u8', () => Promise.reject(new Error('x')))).rejects.toThrow(/hls\.js/);
  });
});
