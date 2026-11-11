// node --test scripts/check-devlog.test.mjs  (npm run test:devlog). Planted negatives for the PROC-8 guard and the renderer,
// each in a throwaway git repo under the OS temp dir (nothing in this repo is touched).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const CHECK = path.join(here, 'check-devlog.mjs');
const RENDER = path.join(here, 'devlog.mjs');
const frag = (date, card, title, body = '- did a thing', pr = '') => `---\ndate: ${date}\npr: ${pr}\ncard: ${card}\ntitle: ${title}\n---\n\n${body}\n`;

function repo() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'devlog-'));
  const g = (...a) => execFileSync('git', ['-C', d, ...a], { encoding: 'utf8' });
  g('init', '-q', '-b', 'main'); g('config', 'user.email', 't@example.invalid'); g('config', 'user.name', 'test'); g('config', 'commit.gpgsign', 'false');
  fs.writeFileSync(path.join(d, 'PROGRESS.md'), '# Progress\n\n## 2026-11-10\n\n- history\n');
  fs.mkdirSync(path.join(d, 'progress'));
  fs.writeFileSync(path.join(d, 'progress', '2026-11-11-seed.md'), frag('2026-11-11', 'SEED', 'Seed'));
  g('add', '-A'); g('commit', '-q', '-m', 'base'); g('checkout', '-q', '-b', 'pr');
  const write = (rel, text) => { fs.mkdirSync(path.dirname(path.join(d, rel)), { recursive: true }); fs.writeFileSync(path.join(d, rel), text); };
  const commit = () => { g('add', '-A'); g('commit', '-q', '--allow-empty', '-m', 'pr'); };
  return { d, g, write, commit };
}
function run(d, labels = '') {
  try { return { code: 0, out: execFileSync('node', [CHECK, '--root', d, '--base', 'main', '--labels', labels], { encoding: 'utf8' }) }; }
  catch (e) { return { code: e.status, out: String(e.stdout) }; }
}

test('pass: one valid fragment, PROGRESS.md untouched', () => {
  const r = repo(); r.write('src.txt', 'x'); r.write('progress/2026-11-12-feat-x.md', frag('2026-11-12', 'FEAT-X', 'Feature X')); r.commit();
  const o = run(r.d); assert.equal(o.code, 0, o.out); assert.match(o.out, /0 failure/);
});
test('fail: PROGRESS.md modified', () => {
  const r = repo(); r.write('PROGRESS.md', '# Progress\n\n## 2026-11-10\n\n- history\n- edited\n'); r.write('progress/2026-11-12-a.md', frag('2026-11-12', 'A', 'A')); r.commit();
  const o = run(r.d); assert.equal(o.code, 1); assert.match(o.out, /FAIL PROGRESS\.md is modified/);
});
test('fail: 0 fragments', () => {
  const r = repo(); r.write('src.txt', 'x'); r.commit();
  const o = run(r.d); assert.equal(o.code, 1); assert.match(o.out, /FAIL no devlog fragment added/);
});
test('fail: 2 fragments', () => {
  const r = repo(); r.write('progress/2026-11-12-a.md', frag('2026-11-12', 'A', 'A')); r.write('progress/2026-11-12-b.md', frag('2026-11-12', 'B', 'B')); r.commit();
  const o = run(r.d); assert.equal(o.code, 1); assert.match(o.out, /FAIL 2 devlog fragments added/);
});
test('pass: label devlog-maintenance allows PROGRESS.md edit and 0 or 2 fragments', () => {
  const r = repo(); r.write('PROGRESS.md', '# Progress\n> header\n'); r.write('progress/2026-11-12-a.md', frag('2026-11-12', 'A', 'A')); r.write('progress/2026-11-12-b.md', frag('2026-11-12', 'B', 'B')); r.commit();
  assert.equal(run(r.d).code, 1);
  const o = run(r.d, 'devlog-maintenance'); assert.equal(o.code, 0, o.out);
});
for (const [name, text, file, re] of [
  ['missing front matter', '- no front matter\n', '2026-11-12-a.md', /missing front matter/],
  ['missing card', '---\ndate: 2026-11-12\npr:\ntitle: T\n---\n\n- x\n', '2026-11-12-a.md', /missing "card"/],
  ['date does not match file name', frag('2026-11-13', 'A', 'A'), '2026-11-12-a.md', /does not match the file name/],
  ['impossible date', frag('2026-02-30', 'A', 'A'), '2026-02-30-a.md', /not a real YYYY-MM-DD/],
  ['pr not a number', frag('2026-11-12', 'A', 'A', '- x', 'soon'), '2026-11-12-a.md', /pr must be blank or a PR number/],
  ['bad file name', frag('2026-11-12', 'A', 'A'), 'feature-a.md', /file name must be/],
  ['empty body', frag('2026-11-12', 'A', 'A', ''), '2026-11-12-a.md', /body .* is empty/],
]) {
  test(`fail: bad front matter (${name}), even with the label`, () => {
    const r = repo(); r.write(`progress/${file}`, text); r.commit();
    for (const l of ['', 'devlog-maintenance']) { const o = run(r.d, l); assert.equal(o.code, 1, o.out); assert.match(o.out, re); }
  });
}
test('fail: deleting a fragment', () => {
  const r = repo(); fs.rmSync(path.join(r.d, 'progress/2026-11-11-seed.md')); r.write('progress/2026-11-12-a.md', frag('2026-11-12', 'A', 'A')); r.commit();
  const o = run(r.d); assert.equal(o.code, 1); assert.match(o.out, /fragment removed/);
});
test('pass: filling in pr on an existing fragment plus one new fragment', () => {
  const r = repo(); r.write('progress/2026-11-11-seed.md', frag('2026-11-11', 'SEED', 'Seed', '- did a thing', '7')); r.write('progress/2026-11-12-a.md', frag('2026-11-12', 'A', 'A')); r.commit();
  const o = run(r.d); assert.equal(o.code, 0, o.out);
});
test('render: PROGRESS.md verbatim, then fragments by date then file name', () => {
  const r = repo();
  r.write('progress/2026-11-12-b.md', frag('2026-11-12', 'B', 'Bee')); r.write('progress/2026-11-12-a.md', frag('2026-11-12', 'A', 'Ay', '- a', '9')); r.write('progress/2026-11-10-old.md', frag('2026-11-10', 'OLD', 'Old'));
  execFileSync('node', [RENDER, '--root', r.d]);
  const out = fs.readFileSync(path.join(r.d, 'dist/devlog/DEVLOG.md'), 'utf8');
  assert.ok(out.startsWith('# Progress\n\n## 2026-11-10\n\n- history\n'));
  const order = ['Old (card OLD)', 'Seed (card SEED)', 'Ay (card A, PR #9)', 'Bee (card B)'].map((t) => out.indexOf(t));
  assert.ok(order.every((i, k) => i > 0 && (k === 0 || i > order[k - 1])), out);
});
test('render: invalid fragment writes nothing and exits 1', () => {
  const r = repo(); r.write('progress/2026-11-12-a.md', '- no front matter\n');
  assert.throws(() => execFileSync('node', [RENDER, '--root', r.d], { stdio: 'pipe' }));
  assert.equal(fs.existsSync(path.join(r.d, 'dist/devlog/DEVLOG.md')), false);
});
test('pass: forward-merge of main that brings in other PRs\' fragments still counts only this PR\'s one', () => {
  const r = repo(); r.write('progress/2026-11-12-mine.md', frag('2026-11-12', 'MINE', 'Mine')); r.commit();
  r.g('checkout', '-q', 'main');
  r.write('progress/2026-11-12-other-a.md', frag('2026-11-12', 'OA', 'Other A')); r.write('progress/2026-11-12-other-b.md', frag('2026-11-12', 'OB', 'Other B')); r.commit();
  r.g('checkout', '-q', 'pr'); r.g('merge', '-q', '--no-ff', '--no-edit', 'main');
  const o = run(r.d); assert.equal(o.code, 0, o.out); assert.match(o.out, /fragment: progress\/2026-11-12-mine\.md/);
  r.write('progress/2026-11-12-second.md', frag('2026-11-12', 'S', 'Second')); r.commit();
  const o2 = run(r.d); assert.equal(o2.code, 1); assert.match(o2.out, /2 devlog fragments added \(progress\/2026-11-12-mine\.md, progress\/2026-11-12-second\.md\)/);
});
