// R-4: track loading and the cue follower. DOM-free so the UI layer (built from the signed
// player handoff) only renders; it never re-parses or re-scans cues itself.
import { activeCues, cueIndexAt, parseVtt, type Cue, type CueKind, type CueTrack } from './vtt';

export interface TrackSource {
  kind: CueKind;
  lang: string;
  label: string;
  /** URL of a WebVTT file. */
  src: string;
}

type Fetcher = (url: string) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;

/** Fetches and parses each track once. A track that fails to load is reported, not thrown, so one bad file never blocks playback. */
export async function loadTracks(
  sources: readonly TrackSource[],
  fetcher: Fetcher = (u) => fetch(u),
): Promise<{ tracks: CueTrack[]; errors: { src: string; message: string }[] }> {
  const errors: { src: string; message: string }[] = [];
  const results = await Promise.all(
    sources.map(async ({ src, kind, lang, label }) => {
      try {
        const res = await fetcher(src);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return { kind, lang, label, cues: parseVtt(await res.text()) } satisfies CueTrack;
      } catch (e) {
        errors.push({ src, message: e instanceof Error ? e.message : String(e) });
        return null;
      }
    }),
  );
  return { tracks: results.filter((t): t is CueTrack => t !== null), errors };
}

export const captionTracks = (tracks: readonly CueTrack[]) => tracks.filter((t) => t.kind === 'captions');
export const descriptionTracks = (tracks: readonly CueTrack[]) => tracks.filter((t) => t.kind === 'descriptions');

/** Picks a track by lang, else the first whose lang starts with the preferred base language, else the first track. */
export function pickTrack(tracks: readonly CueTrack[], lang?: string | null): CueTrack | undefined {
  if (lang === 'off') return undefined;
  if (lang) {
    const exact = tracks.find((t) => t.lang === lang);
    if (exact) return exact;
    const base = lang.split('-')[0];
    const near = tracks.find((t) => t.lang.split('-')[0] === base);
    if (near) return near;
  }
  return tracks[0];
}

export interface CueChange {
  /** Cues active at the new time, in start order. */
  active: Cue[];
  /** Cues that became active since the last update (what a live region announces). */
  entered: Cue[];
  /** Index of the cue at or before the time, for transcript highlight and scroll (-1 before the first cue). */
  index: number;
}

/**
 * Follows a cue list against player time. Call update(t) on every timeupdate and after a seek;
 * onChange fires only when the active set changes. A seek re-syncs without replaying cues that
 * were already showing; reset() forgets them (e.g. when the track changes).
 */
export function createCueFollower(cues: readonly Cue[], onChange: (c: CueChange) => void) {
  let shown = new Set<string>();
  let lastIndex = -2;
  return {
    update(t: number): void {
      const active = activeCues(cues, t);
      const ids = new Set(active.map((c) => c.id));
      const index = cueIndexAt(cues, t);
      const entered = active.filter((c) => !shown.has(c.id));
      const changed = entered.length > 0 || ids.size !== shown.size || index !== lastIndex;
      shown = ids;
      lastIndex = index;
      if (changed) onChange({ active, entered, index });
    },
    reset(): void {
      shown = new Set();
      lastIndex = -2;
    },
  };
}
