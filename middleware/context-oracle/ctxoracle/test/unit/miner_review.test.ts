// Step 13 build review (docs/reviews/2026-09-26-step-13-build-review.md) —
// tests that close the hand-mutation survivors no T-13 fixture reached. Each
// case is written from plan Step 13's text (quoted per case), with real git and
// a real store, no doubles. The repositories are built with the generator's
// exported helpers (pinned identity, dates, isolated git config).

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openStore, probeFts5, type Store } from '../../src/stores/adapter.js';
import { applyMigrations } from '../../src/stores/migration_runner.js';
import { seedDefaults, tuning as tuningDao, tuningReader } from '../../src/stores/dao/tuning.js';
import { filesDao } from '../../src/stores/dao/files.js';
import { cochangePairsDao } from '../../src/stores/dao/cochange_pairs.js';
import { schemaMetaDao } from '../../src/stores/dao/schema_meta.js';
import { mineCochange, type MineResult } from '../../src/miner/cochange.js';
import { oracleSpawn } from '../../src/util/spawn.js';
import { fixtureCommit, fixtureGit, fixtureInit, fixtureTs } from '../fixtures/generate.js';

const root = mkdtempSync(path.join(tmpdir(), 'ctxoracle-miner-review-'));
process.on('exit', () => rmSync(root, { recursive: true, force: true }));
const DAY_S = 86_400;

interface Env {
  store: Store;
  global: Store;
  diag: string;
  mine: (full?: boolean) => Promise<MineResult>;
}

/** A migrated project store and a seeded global store with `overrides` set as owner tuning. */
function env(name: string, repo: string, overrides: Record<string, string> = {}): Env {
  const store = openStore(path.join(root, `${name}.db`));
  applyMigrations(store, { fts: probeFts5(store) });
  const global = openStore(path.join(root, `${name}-global.db`));
  applyMigrations(global, { fts: false, scope: 'global' });
  seedDefaults(global);
  for (const [k, v] of Object.entries(overrides)) tuningDao.set(global, k, v, 'owner');
  const diag = path.join(root, `${name}-diagnostics`);
  const mine = (full?: boolean): Promise<MineResult> =>
    mineCochange(store, repo, {
      tuning: tuningReader(global, name, () => {}),
      diagnosticsDir: diag,
      ...(full === true ? { full: true } : {}),
    });
  return { store, global, diag, mine };
}

function head(repo: string): string {
  return fixtureGit(repo, ['rev-parse', 'HEAD']).trim();
}

/** `commits.exclude_reason` by commit subject ('-' for an included commit). */
function reasonsBySubject(store: Store, repo: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of fixtureGit(repo, ['log', '--no-merges', '--format=%H %s']).trim().split('\n')) {
    const sp = line.indexOf(' ');
    const row = store.prepare('SELECT excluded, exclude_reason FROM commits WHERE hash = ?').get(line.slice(0, sp)) as
      | { excluded: number; exclude_reason: string | null }
      | undefined;
    out[line.slice(sp + 1)] = row === undefined ? 'absent' : row.excluded === 0 ? '-' : String(row.exclude_reason);
  }
  return out;
}

function pairCount(store: Store, p: string, q: string): number {
  const a = filesDao(store).byPath(p)?.id;
  const b = filesDao(store).byPath(q)?.id;
  if (a === undefined || b === undefined) return 0;
  return cochangePairsDao(store).pair(a, b)?.pair_count ?? 0;
}

const pairEdit = (i: number): { path: string; content: string }[] => [
  { path: 'a.txt', content: `a ${i}\n` },
  { path: 'b.txt', content: `b ${i}\n` },
];

test('R-1: miner.horizon_commits keeps exactly the newest N non-merge commits of the pass range, merges not counted', async () => {
  // Plan Step 13: "`git rev-list --count --no-merges <range>` ... gives the range
  // size — `--no-merges` so the count matches the stream's positions; commits
  // older than the newest `miner.horizon_commits` ... are horizon-excluded".
  const repo = path.join(root, 'r1');
  fixtureInit(repo);
  fixtureCommit(repo, pairEdit(1), { message: 'c1', day: 1 });
  fixtureCommit(repo, pairEdit(2), { message: 'c2', day: 2 });
  fixtureGit(repo, ['checkout', '-q', '-b', 'side']);
  fixtureCommit(repo, [{ path: 's.txt', content: 's\n' }], { message: 's1', day: 3 });
  fixtureGit(repo, ['checkout', '-q', 'main']);
  fixtureGit(repo, ['merge', '-q', '--no-ff', '-m', 'merge side', 'side'], { day: 4 });
  fixtureCommit(repo, pairEdit(3), { message: 'c3', day: 5 });
  fixtureCommit(repo, pairEdit(4), { message: 'c4', day: 6 });
  const e = env('r1', repo, { 'miner.horizon_commits': '3' });
  await e.mine();
  // Non-merge stream, oldest first: c1, c2, s1, c3, c4 -> the newest 3 are s1, c3, c4.
  assert.deepEqual(reasonsBySubject(e.store, repo), { c1: 'horizon', c2: 'horizon', s1: '-', c3: '-', c4: '-' });
  assert.equal(pairCount(e.store, 'a.txt', 'b.txt'), 2, 'only c3 and c4 count toward the pair');
});

test('R-2: the horizon instant is refTs − horizon_years × 365.25 days, a commit exactly at it included', async () => {
  // Plan Step 13: "with `ts < refTs − miner.horizon_years × 365.25 × 86400`, are
  // horizon-excluded".
  const repo = path.join(root, 'r2');
  fixtureInit(repo);
  const headDay = 2000;
  const span = 5 * 365.25 * DAY_S; // 157,788,000 s = 1826 days + 21,600 s
  // `at-boundary` is dated exactly refTs − span; `before-boundary` one second earlier.
  fixtureCommit(repo, pairEdit(1), { message: 'before-boundary', day: headDay - 1827, sec: 64_799 });
  fixtureCommit(repo, pairEdit(2), { message: 'at-boundary', day: headDay - 1827, sec: 64_800 });
  fixtureCommit(repo, [{ path: 'h.txt', content: 'h\n' }], { message: 'head', day: headDay });
  assert.equal(fixtureTs(headDay) - fixtureTs(headDay - 1827, 64_800), span, 'fixture: at-boundary sits exactly on the horizon instant');
  const e = env('r2', repo);
  await e.mine();
  assert.deepEqual(reasonsBySubject(e.store, repo), { 'before-boundary': 'horizon', 'at-boundary': '-', head: '-' });
});

test('R-3: the size exclusion is entity_count > max_transaction_entities (30 included, 31 excluded)', async () => {
  // Plan Step 13: "Commits with `entity_count > miner.max_transaction_entities`
  // are excluded with `exclude_reason = 'size'`".
  const repo = path.join(root, 'r3');
  fixtureInit(repo);
  const files = (n: number, tag: string): { path: string; content: string }[] =>
    Array.from({ length: n }, (_, i) => ({ path: `f${String(i).padStart(2, '0')}.txt`, content: `${tag}\n` }));
  fixtureCommit(repo, files(30, 'thirty'), { message: 'thirty', day: 1 });
  fixtureCommit(repo, files(31, 'thirty-one'), { message: 'thirty-one', day: 2 });
  const e = env('r3', repo);
  await e.mine();
  assert.deepEqual(reasonsBySubject(e.store, repo), { thirty: '-', 'thirty-one': 'size' });
});

test('R-4: a non-UTF-8 path is excluded from every count but still counted in entity_count, and reported once as path_not_utf8', async () => {
  // Plan Step 13: "a rejected path is excluded from every count, counted, and
  // reported once per pass as `path_not_utf8` (writer `'miner'`); the commit's
  // `entity_count` still counts it".
  const repo = path.join(root, 'r4');
  fixtureInit(repo);
  const valid = Array.from({ length: 30 }, (_, i) => ({ path: `v${String(i).padStart(2, '0')}.txt`, content: 'v\n' }));
  writeFileSync(Buffer.concat([Buffer.from(`${repo}/bad`), Buffer.from([0xff]), Buffer.from('.txt')]), 'bad\n');
  fixtureCommit(repo, valid, { message: 'thirty valid plus one invalid', day: 1 });
  fixtureCommit(repo, pairEdit(1), { message: 'pair', day: 2 });
  const e = env('r4', repo);
  const r = await e.mine();
  const row = e.store.prepare('SELECT entity_count, exclude_reason FROM commits WHERE hash = ?').get(fixtureGit(repo, ['rev-parse', 'HEAD~1']).trim()) as {
    entity_count: number;
    exclude_reason: string | null;
  };
  assert.equal(row.entity_count, 31, 'entity_count counts the rejected path');
  assert.equal(row.exclude_reason, 'size', '31 entities > 30: size-excluded');
  assert.equal(r.pathsRejected, 1);
  const faults = e.store.prepare("SELECT detail_json FROM faults WHERE code = 'path_not_utf8'").all() as { detail_json: string }[];
  assert.equal(faults.length, 1, 'path_not_utf8 reported once per pass');
  assert.equal((JSON.parse(faults[0]?.detail_json ?? 'null') as { writer?: string }).writer, 'miner');
  assert.ok(
    filesDao(e.store).all().every((f) => !f.path.includes('�')),
    'the rejected path never lands in files under a substituted key'
  );
});

test('R-5: corpus_floor_met is \'1\' exactly when countIncluded() ≥ miner.corpus_floor_commits', async () => {
  // Plan Step 13: "`schema_meta.corpus_floor_met` = `'1'` when
  // `commits.countIncluded() ≥ miner.corpus_floor_commits` else `'0'`".
  const repo = path.join(root, 'r5');
  fixtureInit(repo);
  for (let i = 1; i <= 3; i++) fixtureCommit(repo, pairEdit(i), { message: `c${i}`, day: i });
  const at = env('r5-at', repo, { 'miner.corpus_floor_commits': '3' });
  await at.mine();
  assert.equal(schemaMetaDao(at.store).get('corpus_floor_met'), '1', '3 included commits meet a floor of 3');
  const above = env('r5-above', repo, { 'miner.corpus_floor_commits': '4' });
  await above.mine();
  assert.equal(schemaMetaDao(above.store).get('corpus_floor_met'), '0', '3 included commits do not meet a floor of 4');
});

test('R-6: a changed bar.recency_half_life_days makes the next pass a purged full re-mine at the new h', async () => {
  // Plan Step 13: a full pass happens "when `schema_meta.mined_half_life_days`
  // differs from `bar.recency_half_life_days` (the stored weights were mined
  // under another half-life — AD-13's 'changing `h` requires a re-mine')".
  const repo = path.join(root, 'r6');
  fixtureInit(repo);
  for (let i = 1; i <= 3; i++) fixtureCommit(repo, pairEdit(i), { message: `c${i}`, day: i });
  const e = env('r6', repo);
  await e.mine();
  tuningDao.set(e.global, 'bar.recency_half_life_days', '730', 'owner');
  await e.mine(); // no new commits: only the half-life changed
  const fresh = env('r6-fresh', repo, { 'bar.recency_half_life_days': '730' });
  await fresh.mine();
  assert.equal(schemaMetaDao(e.store).get('mined_half_life_days'), '730');
  const a = filesDao(e.store).byPath('a.txt');
  const aFresh = filesDao(fresh.store).byPath('a.txt');
  assert.equal(a?.change_count, 3, 'the re-mine does not double change_count');
  assert.equal(a?.change_weight, aFresh?.change_weight, 'change_weight is the one mined at h = 730');
  const expected = [1, 2, 3].reduce((s, d) => s + 2 ** ((fixtureTs(d) - 946_684_800) / (730 * DAY_S)), 0);
  assert.ok(Math.abs((a?.change_weight ?? 0) - expected) / expected <= 1e-9, 'AD-13 weight at h = 730');
});

test('R-7: a watermark whose object is gone (merge-base exit 128) is a history rewrite: fault, purge, full re-mine', async () => {
  // Plan Step 13: "when the watermark exists and `git merge-base --is-ancestor
  // <watermark> HEAD` exits 1 (not an ancestor) or 128 (unknown commit — the
  // watermark object is gone), the pass records `history_rewritten` ... and
  // runs as a full pass".
  const repo = path.join(root, 'r7');
  fixtureInit(repo);
  for (let i = 1; i <= 3; i++) fixtureCommit(repo, pairEdit(i), { message: `c${i}`, day: i });
  const e = env('r7', repo);
  await e.mine();
  const oldHead = head(repo);
  fixtureGit(repo, ['commit', '-q', '--amend', '-m', 'c3 amended'], { day: 3, sec: 30 });
  fixtureGit(repo, ['reflog', 'expire', '--expire=now', '--all']);
  fixtureGit(repo, ['gc', '-q', '--prune=now']);
  let status = 0;
  try {
    fixtureGit(repo, ['cat-file', '-e', oldHead]);
  } catch {
    status = 1;
  }
  assert.equal(status, 1, 'fixture: the old HEAD object is gone');
  const r = await e.mine();
  assert.equal(r.rewritten, true);
  const faults = e.store.prepare("SELECT detail_json FROM faults WHERE code = 'history_rewritten'").all() as { detail_json: string }[];
  assert.ok(
    faults.some((f) => (JSON.parse(f.detail_json) as { oldWatermark?: string }).oldWatermark === oldHead),
    'no history_rewritten fault names the vanished watermark'
  );
  assert.equal(e.store.prepare('SELECT 1 FROM commits WHERE hash = ?').get(oldHead), undefined, 'the vanished commit is purged');
  assert.equal(filesDao(e.store).byPath('a.txt')?.change_count, 3, 'a full re-mine, not doubled');
  assert.equal(schemaMetaDao(e.store).get('mining_in_progress'), '0');
});

test('R-8: an incremental pass streams only <watermark>..HEAD', async () => {
  // Plan Step 13: "`<range>` is `<watermark>..HEAD` for an incremental pass";
  // T-13-5(d): the completing mine never "re-reads a commit at or before the
  // ... watermark (its `git log` range is `<watermark>..HEAD`)".
  const repo = path.join(root, 'r8');
  fixtureInit(repo);
  for (let i = 1; i <= 3; i++) fixtureCommit(repo, pairEdit(i), { message: `c${i}`, day: i });
  const e = env('r8', repo);
  assert.equal((await e.mine()).commitsSeen, 3);
  for (let i = 4; i <= 5; i++) fixtureCommit(repo, pairEdit(i), { message: `c${i}`, day: i });
  const r = await e.mine();
  assert.equal(r.commitsSeen, 2, 'the incremental pass read commits at or before its watermark');
  assert.equal(schemaMetaDao(e.store).get('mining_in_progress'), '0');
});

test('R-9: a miner landmine carries the file row\'s path injection flag; revert_chain counts over the horizon, not the fix window', async () => {
  // Plan Step 13 final transaction: "`injection_suspect` = the file row's path
  // flag"; "a `revert_chain` row for every file with ≥ 2 distinct
  // revert-labelled commits with `ts ≥ refTs − horizon`".
  const repo = path.join(root, 'r9');
  fixtureInit(repo);
  const suspect = 'jailbreak.txt'; // isSuspect: /\bjailbreak\b/i
  const headDay = 400;
  // Two git-generated reverts of q.txt edits, 200 and 150 days before HEAD
  // (inside the 5-year horizon, outside the 90-day fix window).
  fixtureCommit(repo, [{ path: 'q.txt', content: 'q1\n' }], { message: 'edit q one', day: headDay - 201 });
  fixtureGit(repo, ['revert', '--no-edit', 'HEAD'], { day: headDay - 200 });
  fixtureCommit(repo, [{ path: 'q.txt', content: 'q2\n' }], { message: 'edit q two', day: headDay - 151 });
  fixtureGit(repo, ['revert', '--no-edit', 'HEAD'], { day: headDay - 150 });
  for (let i = 0; i < 3; i++) fixtureCommit(repo, [{ path: suspect, content: `j${i}\n` }], { message: `fix j ${i}`, day: headDay - 10 + i });
  fixtureCommit(repo, [{ path: 'h.txt', content: 'h\n' }], { message: 'head', day: headDay });
  const e = env('r9', repo);
  await e.mine();
  const rows = e.store
    .prepare("SELECT l.kind, f.path, l.support, l.injection_suspect FROM landmines l JOIN files f ON f.id = l.file_id WHERE l.kind IN ('revert_chain','fix_chatter') ORDER BY l.kind")
    .all() as { kind: string; path: string; support: number; injection_suspect: number }[];
  assert.deepEqual(
    rows.map((r) => ({ ...r })),
    [
      { kind: 'fix_chatter', path: suspect, support: 3, injection_suspect: 1 },
      { kind: 'revert_chain', path: 'q.txt', support: 2, injection_suspect: 0 },
    ]
  );
});

test('R-10: a git log that fails mid-stream fails the pass and never advances the watermark over data it did not mine', async () => {
  // Plan Step 13: each chunk sets the watermark "so a crash never leaves the
  // watermark ahead of its data"; the final transaction sets it to "the `HEAD`
  // the pass mined to". A git log that exits non-zero has not mined to HEAD.
  const repo = path.join(root, 'r10');
  fixtureInit(repo);
  for (let i = 1; i <= 3; i++) fixtureCommit(repo, [{ path: `f${i}.txt`, content: `f${i}\n` }], { message: `c${i}`, day: i });
  // Remove the second commit's blob: `rev-parse`/`rev-list` still succeed, and
  // `git log --numstat` streams c1 then exits 128 ("unable to read").
  const blob = fixtureGit(repo, ['rev-parse', 'HEAD~1:f2.txt']).trim();
  unlinkSync(path.join(repo, '.git', 'objects', blob.slice(0, 2), blob.slice(2)));
  const e = env('r10', repo);
  await assert.rejects(e.mine(), 'a failing git log must fail the pass');
  assert.notEqual(schemaMetaDao(e.store).get('last_mined_commit'), head(repo), 'the watermark claims HEAD over a truncated stream');
});

test('R-11: oracleSpawn({stdout: \'pipe\'}) ignores stdin, pipes stdout, inherits stderr; the default stays inherit', async () => {
  // Plan Step 13: "its new option `stdout: 'pipe'` (... stdin ignored, stdout
  // piped, stderr inherited; the default stays `'inherit'`)".
  const quiet = [process.execPath, ['-e', '']] as const;
  const piped = oracleSpawn(quiet[0], [...quiet[1]], { cwd: root, stdout: 'pipe' });
  assert.equal(piped.stdin, null, 'stdin is ignored (no pipe)');
  assert.notEqual(piped.stdout, null, 'stdout is piped');
  assert.equal(piped.stderr, null, 'stderr is inherited (no pipe)');
  piped.stdout?.resume();
  const byDefault = oracleSpawn(quiet[0], [...quiet[1]], { cwd: root });
  assert.equal(byDefault.stdout, null, 'the default stays inherit');
  await Promise.all([piped, byDefault].map((c) => new Promise((resolve) => c.on('close', resolve))));
});

test('R-12: the miner re-points only a commit-provenance row; an indexed row\'s prov_ref is never touched', async () => {
  // Plan Step 13: `files.repointStaleCommitProv(id, hash)` "sets an existing
  // row's `prov_ref` to `hash` when its `prov_kind = 'commit'` and its
  // `prov_ref` is not in `commits`".
  const repo = path.join(root, 'r12');
  fixtureInit(repo);
  fixtureCommit(repo, pairEdit(1), { message: 'c1', day: 1 });
  const e = env('r12', repo);
  const indexed = filesDao(e.store).upsert({
    path: 'a.txt',
    lang: 'text',
    zone: 'unknown',
    contentHash: 'h',
    mtime: 0,
    prov: { prov_kind: 'repo_span', prov_ref: 'a.txt', trust: 'untrusted_repo' },
    in_tree: 1,
  });
  await e.mine();
  const row = filesDao(e.store).byPath('a.txt');
  assert.equal(row?.id, indexed);
  assert.equal(row?.prov_kind, 'repo_span');
  assert.equal(row?.prov_ref, 'a.txt', 'an indexed row was re-pointed to a commit');
  assert.equal(filesDao(e.store).byPath('b.txt')?.prov_ref, head(repo), 'the history-only row names its first commit');
});
