import captionsVtt from '../../stories/media/sintel/captions.vtt?raw';
import adVtt from '../../stories/media/sintel/ad.vtt?raw';
import { describe, expect, it, vi } from 'vitest';
import { captionTracks, createCueFollower, descriptionTracks, loadTracks, pickTrack } from './tracks';
import { createDescriptions, type SpeechLike } from './descriptions';
import { Emitter, type PlayerEvent } from './player';
import { parseVtt, type Cue } from './vtt';

const files: Record<string, string> = { '/c.vtt': captionsVtt, '/ad.vtt': adVtt };
const fetcher = async (u: string) => ({ ok: u in files, status: u in files ? 200 : 404, text: async () => files[u] ?? '' });
const CUES: Cue[] = [
  { id: 'a', start: 1, end: 3, text: 'one' },
  { id: 'b', start: 2, end: 4, text: 'two' },
  { id: 'c', start: 6, end: 7, text: 'three' },
];

describe('loadTracks / pickTrack', () => {
  it('loads each track once and reports a failed one without throwing', async () => {
    const spy = vi.fn(fetcher);
    const { tracks, errors } = await loadTracks(
      [
        { kind: 'captions', lang: 'en', label: 'English', src: '/c.vtt' },
        { kind: 'descriptions', lang: 'en', label: 'Descriptions', src: '/ad.vtt' },
        { kind: 'captions', lang: 'fr', label: 'Français', src: '/missing.vtt' },
      ],
      spy,
    );
    expect(spy).toHaveBeenCalledTimes(3);
    expect(captionTracks(tracks)).toHaveLength(1);
    expect(descriptionTracks(tracks)[0].cues.length).toBeGreaterThan(0);
    expect(errors).toEqual([{ src: '/missing.vtt', message: 'HTTP 404' }]);
  });
  it('picks exact, then base language, then first; off picks none', () => {
    const t = [
      { kind: 'captions' as const, lang: 'en-GB', label: 'UK', cues: [] },
      { kind: 'captions' as const, lang: 'es', label: 'ES', cues: [] },
    ];
    expect(pickTrack(t, 'es')?.label).toBe('ES');
    expect(pickTrack(t, 'en-US')?.label).toBe('UK');
    expect(pickTrack(t, 'de')?.label).toBe('UK');
    expect(pickTrack(t, 'off')).toBeUndefined();
    expect(pickTrack([], 'en')).toBeUndefined();
  });
});

describe('createCueFollower', () => {
  it('fires only on change, reports entered cues once, and re-syncs after a seek', () => {
    const calls: { active: string[]; entered: string[]; index: number }[] = [];
    const f = createCueFollower(CUES, (c) => calls.push({ active: c.active.map((x) => x.id), entered: c.entered.map((x) => x.id), index: c.index }));
    f.update(0.5);
    f.update(1.5);
    f.update(1.8); // no change
    f.update(2.5);
    f.update(5); // gap: nothing active, index stays on b
    f.update(6.5); // seek-like jump
    expect(calls).toEqual([
      { active: [], entered: [], index: -1 },
      { active: ['a'], entered: ['a'], index: 0 },
      { active: ['a', 'b'], entered: ['b'], index: 1 },
      { active: [], entered: [], index: 1 },
      { active: ['c'], entered: ['c'], index: 2 },
    ]);
    f.reset();
    f.update(6.6);
    expect(calls.at(-1)!.entered).toEqual(['c']);
  });
});

function fakePlayer() {
  const em = new Emitter();
  let t = 0;
  return {
    on: (e: PlayerEvent, fn: (d?: unknown) => void) => em.on(e, fn),
    getTime: () => t,
    pause: vi.fn(async () => {}),
    play: vi.fn(async () => {}),
    at(s: number) {
      t = s;
      em.emit('timeupdate');
    },
    emit: (e: PlayerEvent) => em.emit(e),
  };
}
function fakeSpeech() {
  const said: string[] = [];
  let end: (() => void) | undefined;
  const s: SpeechLike = { speak: ({ text, onend }) => (said.push(text), (end = onend)), cancel: vi.fn() };
  return { s, said, finish: () => end?.() };
}

describe('createDescriptions', () => {
  it('shows text only when on, and clears the live region when turned off', () => {
    const p = fakePlayer();
    const text: string[] = [];
    const d = createDescriptions({ player: p, cues: CUES, onText: (x) => text.push(x) });
    p.at(1.5);
    expect(text).toEqual([]);
    expect(d.setMode('text')).toBe('text');
    expect(text.at(-1)).toBe('one');
    p.at(2.5);
    expect(text.at(-1)).toBe('one\ntwo');
    d.setMode('off');
    expect(text.at(-1)).toBe('');
    d.destroy();
  });
  it('switches the AD track in place: keeps the mode, re-syncs the text, voices in the new language', () => {
    const p = fakePlayer();
    const text: string[] = [];
    const langs: (string | undefined)[] = [];
    const s: SpeechLike = { speak: ({ lang }) => void langs.push(lang), cancel: vi.fn() };
    const d = createDescriptions({ player: p, cues: CUES, lang: 'en', onText: (x) => text.push(x), speech: s });
    d.setMode('voice');
    p.at(1.5);
    expect(langs).toEqual(['en']);
    d.setTrack([{ id: 'es1', start: 1, end: 3, text: 'uno' }], 'es');
    expect(d.mode).toBe('voice');
    expect(text.slice(-2)).toEqual(['', 'uno']);
    expect(langs).toEqual(['en', 'es']);
    d.setMode('off');
    d.setTrack(CUES, 'en');
    expect(text.at(-1)).toBe('');
    d.destroy();
  });
  it('falls back to text when voicing is unavailable', () => {
    const d = createDescriptions({ player: fakePlayer(), cues: CUES, onText: () => {} });
    expect(d.canVoice).toBe(false);
    expect(d.setMode('voice')).toBe('text');
  });
  it('voices only newly entered cues, and pauses then resumes when asked to', () => {
    const p = fakePlayer();
    const { s, said, finish } = fakeSpeech();
    const d = createDescriptions({ player: p, cues: CUES, onText: () => {}, speech: s, pauseWhileSpeaking: true });
    d.setMode('voice');
    p.at(1.5);
    p.at(1.9);
    p.at(2.5);
    expect(said).toEqual(['one', 'two']);
    expect(p.pause).toHaveBeenCalledTimes(2);
    p.emit('pause'); // our own pause must not cancel the speech
    finish();
    expect(p.play).toHaveBeenCalledTimes(1);
    expect(s.cancel).toHaveBeenCalledTimes(3); // setMode + one before each utterance
    p.emit('pause'); // a user pause cancels speech
    expect(s.cancel).toHaveBeenCalledTimes(4);
  });
  it('voices the Sintel AD track', () => {
    const p = fakePlayer();
    const { s, said } = fakeSpeech();
    const cues = parseVtt(adVtt);
    const d = createDescriptions({ player: p, cues, onText: () => {}, speech: s });
    d.setMode('voice');
    p.at(cues[0].start + 0.01);
    expect(said).toEqual([cues[0].text]);
  });
});
