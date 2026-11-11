// R-4: persisted player preferences (Creatives ruling): one JSON object under ember:video:v1,
// host-overridable with a storageKey. Any storage failure (blocked, quota, bad JSON) falls back
// to defaults silently; a bad field is dropped on its own, never the whole object.
import { RATES } from './player';
import type { DescriptionsMode } from './descriptions';

export const VIDEO_PREFS_KEY = 'ember:video:v1';

export interface CaptionStyle {
  [k: string]: string | number | boolean;
}

export interface VideoPrefs {
  volume: number; // 0..1
  muted: boolean;
  rate: number; // one of RATES
  /** Caption track lang, or 'off'. null = never chosen (use the browser language). */
  captions: string | null;
  descriptions: DescriptionsMode;
  /** Shape is set by the handoff's caption settings; stored as given. */
  captionStyle: CaptionStyle | null;
}

export const DEFAULT_VIDEO_PREFS: Readonly<VideoPrefs> = Object.freeze({
  volume: 1,
  muted: false,
  rate: 1,
  captions: null,
  descriptions: 'off',
  captionStyle: null,
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
  if (r.captionStyle === null || (typeof r.captionStyle === 'object' && !Array.isArray(r.captionStyle))) out.captionStyle = r.captionStyle as CaptionStyle | null;
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
export function writeVideoPrefs(patch: Partial<VideoPrefs>, storageKey = VIDEO_PREFS_KEY, storage: StorageLike | null = defaultStorage()): VideoPrefs {
  const next = { ...readVideoPrefs(storageKey, storage), ...clean(patch) };
  try {
    storage?.setItem(storageKey, JSON.stringify(next));
  } catch {
    // Blocked or full storage: keep working with the in-memory value.
  }
  return next;
}
