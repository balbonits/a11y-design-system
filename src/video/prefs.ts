// R-4: persisted player preferences (Creatives ruling): one JSON object under ember:video:v1,
// host-overridable with a storageKey. Any storage failure (blocked, quota, bad JSON) falls back
// to defaults silently; a bad field is dropped on its own, never the whole object. Only the main
// player persists (UX/UI): demos pass persist={false} in the UI and never call these.
import { RATES } from './player';
import type { DescriptionsMode } from './descriptions';

export const VIDEO_PREFS_KEY = 'ember:video:v1';

/** Caption settings (UX/UI, R4-PLAYER-COPY "Caption settings" and HANDOFF H-8). */
export interface CaptionStyle {
  size: 's' | 'm' | 'l' | 'xl';
  /** 'black' switches the band to light in the UI. */
  color: 'white' | 'yellow' | 'cyan' | 'black';
  /** 'none' and 'half' add a text outline in the UI. */
  background: 'none' | 'half' | 'solid';
  font: 'sans' | 'serif' | 'mono';
}

export const DEFAULT_CAPTION_STYLE: Readonly<CaptionStyle> = Object.freeze({ size: 'm', color: 'white', background: 'solid', font: 'sans' });

const CAPTION_CHOICES: { [K in keyof CaptionStyle]: readonly CaptionStyle[K][] } = {
  size: ['s', 'm', 'l', 'xl'],
  color: ['white', 'yellow', 'cyan', 'black'],
  background: ['none', 'half', 'solid'],
  font: ['sans', 'serif', 'mono'],
};

/** Each field is checked on its own; an unknown or missing value falls back to its default. */
export function cleanCaptionStyle(raw: unknown): CaptionStyle {
  const r = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const pick = <K extends keyof CaptionStyle>(k: K): CaptionStyle[K] =>
    (CAPTION_CHOICES[k] as readonly unknown[]).includes(r[k]) ? (r[k] as CaptionStyle[K]) : DEFAULT_CAPTION_STYLE[k];
  return { size: pick('size'), color: pick('color'), background: pick('background'), font: pick('font') };
}

export interface VideoPrefs {
  volume: number; // 0..1
  muted: boolean;
  rate: number; // one of RATES
  /** Caption track lang, or 'off'. null = never chosen (use the browser language). */
  captions: string | null;
  descriptions: DescriptionsMode;
  /** "Pause while reading", the sub-toggle under "Read descriptions aloud"; only counts when descriptions is 'voice'. */
  pauseWhileReading: boolean;
  captionStyle: CaptionStyle;
}

export const DEFAULT_VIDEO_PREFS: Readonly<VideoPrefs> = Object.freeze({
  volume: 1,
  muted: false,
  rate: 1,
  captions: null,
  descriptions: 'off',
  pauseWhileReading: false,
  captionStyle: DEFAULT_CAPTION_STYLE,
});

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;
const defaultStorage = (): StorageLike | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
};

function clean(raw: unknown): Partial<VideoPrefs> {
  if (!raw || typeof raw !== 'object') return {};
  const r = raw as Record<string, unknown>;
  const out: Partial<VideoPrefs> = {};
  if (typeof r.volume === 'number' && r.volume >= 0 && r.volume <= 1) out.volume = r.volume;
  if (typeof r.muted === 'boolean') out.muted = r.muted;
  if (typeof r.rate === 'number' && (RATES as readonly number[]).includes(r.rate)) out.rate = r.rate;
  if (r.captions === null || (typeof r.captions === 'string' && r.captions.length > 0 && r.captions.length <= 35)) out.captions = r.captions as string | null;
  if (r.descriptions === 'off' || r.descriptions === 'text' || r.descriptions === 'voice') out.descriptions = r.descriptions;
  if (typeof r.pauseWhileReading === 'boolean') out.pauseWhileReading = r.pauseWhileReading;
  if (r.captionStyle !== undefined) out.captionStyle = cleanCaptionStyle(r.captionStyle);
  return out;
}

export function readVideoPrefs(storageKey = VIDEO_PREFS_KEY, storage: StorageLike | null = defaultStorage()): VideoPrefs {
  try {
    const text = storage?.getItem(storageKey);
    return { ...DEFAULT_VIDEO_PREFS, ...(text ? clean(JSON.parse(text)) : {}) };
  } catch {
    return { ...DEFAULT_VIDEO_PREFS };
  }
}

/** Merges a change into the stored object and returns the result (what the UI should now show). */
export function writeVideoPrefs(patch: Partial<Omit<VideoPrefs, 'captionStyle'>> & { captionStyle?: Partial<CaptionStyle> }, storageKey = VIDEO_PREFS_KEY, storage: StorageLike | null = defaultStorage()): VideoPrefs {
  const prev = readVideoPrefs(storageKey, storage);
  // A captionStyle patch changes only the fields it names.
  const merged = patch.captionStyle ? { ...patch, captionStyle: { ...prev.captionStyle, ...patch.captionStyle } } : patch;
  const next = { ...prev, ...clean(merged) };
  try {
    storage?.setItem(storageKey, JSON.stringify(next));
  } catch {
    // Blocked or full storage: keep working with the in-memory value.
  }
  return next;
}
