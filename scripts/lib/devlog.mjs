// PROC-8 devlog fragments: shared parsing for scripts/devlog.mjs (render) and scripts/check-devlog.mjs (CI guard).
// A fragment is progress/YYYY-MM-DD-<slug>.md with front matter: date, pr (blank until known), card, title.
// Plain Node only (no packages): the front matter is a flat `key: value` block between two `---` lines.
import fs from 'node:fs';
import path from 'node:path';

export const FRAGMENT_DIR = 'progress';
export const FRAGMENT_RE = /^progress\/(\d{4}-\d{2}-\d{2})-([a-z0-9][a-z0-9._-]*)\.md$/;
export const REQUIRED = ['date', 'pr', 'card', 'title'];
export const isFragmentPath = (p) => p.startsWith(`${FRAGMENT_DIR}/`) && p.endsWith('.md') && path.basename(p) !== 'README.md';

const validDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(`${d}T00:00:00Z`)) && new Date(`${d}T00:00:00Z`).toISOString().slice(0, 10) === d;

// Returns { meta, body, errors }. `rel` is the repo-relative path (used for the file-name checks).
export function parseFragment(rel, text) {
  const errors = []; const meta = {};
  const m = FRAGMENT_RE.exec(rel);
  if (!m) errors.push(`${rel}: file name must be progress/YYYY-MM-DD-<slug>.md (lowercase slug)`);
  const src = text.replace(/\r\n/g, '\n');
  const fm = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(src);
  if (!fm) { errors.push(`${rel}: missing front matter (--- block with ${REQUIRED.join(', ')})`); return { meta, body: '', errors }; }
  for (const line of fm[1].split('\n')) {
    if (!line.trim()) continue;
    const kv = /^([a-z]+):(.*)$/.exec(line);
    if (!kv) { errors.push(`${rel}: bad front matter line "${line}"`); continue; }
    let v = kv[2].trim();
    if (/^(["']).*\1$/.test(v)) v = v.slice(1, -1);
    meta[kv[1]] = v;
  }
  for (const k of REQUIRED) if (!(k in meta)) errors.push(`${rel}: front matter is missing "${k}"`);
  for (const k of Object.keys(meta)) if (!REQUIRED.includes(k)) errors.push(`${rel}: unknown front matter key "${k}"`);
  if ('date' in meta && !validDate(meta.date)) errors.push(`${rel}: date "${meta.date}" is not a real YYYY-MM-DD date`);
  if (m && meta.date && m[1] !== meta.date) errors.push(`${rel}: date ${meta.date} does not match the file name date ${m[1]}`);
  if ('pr' in meta && meta.pr !== '' && !/^[1-9]\d*$/.test(meta.pr)) errors.push(`${rel}: pr must be blank or a PR number, got "${meta.pr}"`);
  if ('card' in meta && !meta.card) errors.push(`${rel}: card is empty`);
  if ('title' in meta && !meta.title) errors.push(`${rel}: title is empty`);
  const body = fm[2].replace(/^\n+/, '').replace(/\s+$/, '');
  if (!body) errors.push(`${rel}: body (the devlog entry) is empty`);
  return { meta, body, errors };
}

export function readFragments(root) {
  const dir = path.join(root, FRAGMENT_DIR);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md') && f !== 'README.md').sort()
    .map((f) => { const rel = `${FRAGMENT_DIR}/${f}`; return { rel, file: f, ...parseFragment(rel, fs.readFileSync(path.join(dir, f), 'utf8')) }; });
}

// Sorted by date, then file name (PROC-8).
export const sortFragments = (frags) => [...frags].sort((a, b) => (a.meta.date < b.meta.date ? -1 : a.meta.date > b.meta.date ? 1 : a.file < b.file ? -1 : a.file > b.file ? 1 : 0));

export function renderFragment(f) {
  const tags = [`card ${f.meta.card}`]; if (f.meta.pr) tags.push(`PR #${f.meta.pr}`);
  return `## ${f.meta.date}: ${f.meta.title} (${tags.join(', ')})\n\n${f.body}\n`;
}
