// R-4: one WebVTT cue model. Parsed once; the caption renderer, the transcript panel
// (highlight, click-to-seek, search, .txt/.vtt download) and the AD track all read it.
export type CueKind = 'captions' | 'descriptions';

export interface Cue {
  id: string;
  start: number; // seconds
  end: number; // seconds
  text: string; // plain text, tags stripped, lines joined with \n
}

export interface CueTrack {
  kind: CueKind;
  lang: string;
  label: string;
  cues: Cue[];
}

const TIME = /^(?:(\d+):)?(\d{2}):(\d{2})\.(\d{3})$/;

export function parseTime(t: string): number {
  const m = TIME.exec(t.trim());
  if (!m) throw new Error(`Bad WebVTT timestamp: ${t}`);
  const [, h = '0', mm, ss, ms] = m;
  return Number(h) * 3600 + Number(mm) * 60 + Number(ss) + Number(ms) / 1000;
}

export function formatTime(s: number): string {
  const ms = Math.round(s * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  const r = ms % 1000;
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${p(h)}:${p(m)}:${p(sec)}.${p(r, 3)}`;
}

const stripTags = (s: string) =>
  s.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, '\u00a0').replace(/&amp;/g, '&');

/** Parse WebVTT text into cues. Ignores NOTE, STYLE and REGION blocks and cue settings. */
export function parseVtt(src: string): Cue[] {
  const text = src.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  if (!/^WEBVTT(?:[ \t].*)?(?:\n|$)/.test(text)) throw new Error('Not a WebVTT file (missing WEBVTT header)');
  const blocks = text.split(/\n{2,}/).slice(1);
  const cues: Cue[] = [];
  for (const block of blocks) {
    const lines = block.split('\n').filter((l, i) => i > 0 || l.trim() !== '');
    if (!lines.length || /^(NOTE|STYLE|REGION)\b/.test(lines[0])) continue;
    let i = 0;
    let id = '';
    if (!lines[0].includes('-->')) id = lines[i++].trim();
    const timing = lines[i++];
    if (!timing || !timing.includes('-->')) continue;
    const [a, rest] = timing.split('-->');
    const b = rest.trim().split(/\s+/)[0];
    const start = parseTime(a);
    const end = parseTime(b);
    const body = stripTags(lines.slice(i).join('\n')).trim();
    cues.push({ id: id || String(cues.length + 1), start, end, text: body });
  }
  return cues.sort((x, y) => x.start - y.start || x.end - y.end);
}

/** Cues active at time t (start <= t < end). */
export function activeCues(cues: readonly Cue[], t: number): Cue[] {
  return cues.filter((c) => c.start <= t && t < c.end);
}

/** Index of the last cue that has started at time t, or -1. Binary search; cues are sorted. */
export function cueIndexAt(cues: readonly Cue[], t: number): number {
  let lo = 0;
  let hi = cues.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (cues[mid].start <= t) {
      ans = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return ans;
}

/** Case-insensitive transcript search; returns matching cue indexes. */
export function searchCues(cues: readonly Cue[], q: string): number[] {
  const needle = q.trim().toLocaleLowerCase();
  if (!needle) return [];
  const out: number[] = [];
  cues.forEach((c, i) => {
    if (c.text.toLocaleLowerCase().includes(needle)) out.push(i);
  });
  return out;
}

export function toTxt(cues: readonly Cue[]): string {
  return cues.map((c) => c.text.replace(/\n/g, ' ')).join('\n') + '\n';
}

export function toVtt(cues: readonly Cue[]): string {
  return (
    'WEBVTT\n\n' +
    cues.map((c) => `${c.id}\n${formatTime(c.start)} --> ${formatTime(c.end)}\n${c.text}`).join('\n\n') +
    '\n'
  );
}
