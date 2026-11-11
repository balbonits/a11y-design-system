// PROC-8 CI guard: a PR never edits PROGRESS.md and adds exactly one progress/ fragment, unless it is labelled devlog-maintenance.
// Every fragment in the tree must also have valid front matter (date, pr, card, title), labelled or not.
// Usage: node scripts/check-devlog.mjs [--base <ref>] [--labels a,b] [--root <dir>]
//   base   defaults to origin/$GITHUB_BASE_REF, else origin/main. The diff is <base>...HEAD (from the merge base).
//   labels default to the PR labels in $GITHUB_EVENT_PATH (pull_request.labels[].name).
// Exit 0 pass, 1 fail, 2 usage/git error.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { isFragmentPath, readFragments } from './lib/devlog.mjs';

export const MAINT_LABEL = 'devlog-maintenance';

export function eventLabels(eventPath = process.env.GITHUB_EVENT_PATH) {
  if (!eventPath || !fs.existsSync(eventPath)) return [];
  const ev = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
  return (ev.pull_request?.labels || []).map((l) => l.name);
}

// changes: [{ status: 'A'|'M'|'D'|'R'|'C'|..., path, from? }]
export function checkChanges(changes, labels, fragments) {
  const fails = [];
  for (const f of fragments) for (const e of f.errors) fails.push(`bad front matter: ${e}`);
  if (labels.includes(MAINT_LABEL)) return { fails, notes: [`label ${MAINT_LABEL}: PROGRESS.md edits and fragment count allowed`] };
  const touchesProgress = changes.some((c) => c.path === 'PROGRESS.md' || c.from === 'PROGRESS.md');
  if (touchesProgress) fails.push('PROGRESS.md is modified: add your entry as a progress/YYYY-MM-DD-<slug>.md fragment instead (PROC-8)');
  const added = changes.filter((c) => /^[ARC]/.test(c.status) && isFragmentPath(c.path)).map((c) => c.path);
  if (added.length === 0) fails.push('no devlog fragment added: add exactly one progress/YYYY-MM-DD-<slug>.md (see progress/README.md)');
  if (added.length > 1) fails.push(`${added.length} devlog fragments added (${added.join(', ')}): a PR adds exactly one`);
  const removed = changes.filter((c) => (c.status === 'D' && isFragmentPath(c.path)) || (/^R/.test(c.status) && c.from && isFragmentPath(c.from) && !isFragmentPath(c.path)));
  for (const c of removed) fails.push(`devlog fragment removed: ${c.from || c.path} (history is append-only; use ${MAINT_LABEL} if this is intended)`);
  return { fails, notes: added.length === 1 ? [`fragment: ${added[0]}`] : [] };
}

export function gitChanges(root, base) {
  const out = execFileSync('git', ['-C', root, 'diff', '--name-status', '-M', `${base}...HEAD`], { encoding: 'utf8' });
  return out.split('\n').filter(Boolean).map((l) => { const p = l.split('\t'); return p.length === 3 ? { status: p[0], from: p[1], path: p[2] } : { status: p[0], path: p[1] }; });
}

function main() {
  const arg = (n) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : undefined; };
  const root = path.resolve(arg('--root') || '.');
  const base = arg('--base') || (process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'origin/main');
  const labelsArg = arg('--labels');
  const labels = labelsArg !== undefined ? labelsArg.split(',').map((s) => s.trim()).filter(Boolean) : eventLabels();
  let changes;
  try { changes = gitChanges(root, base); } catch (e) { console.log(`check-devlog: git diff against ${base} failed: ${e.message.split('\n')[0]}`); process.exit(2); }
  const { fails, notes } = checkChanges(changes, labels, readFragments(root));
  for (const n of notes) console.log(`note ${n}`);
  for (const f of fails) console.log(`FAIL ${f}`);
  console.log(`check-devlog: base ${base}, ${changes.length} changed file(s), labels [${labels.join(', ')}], ${fails.length} failure(s)`);
  process.exit(fails.length ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) main();
