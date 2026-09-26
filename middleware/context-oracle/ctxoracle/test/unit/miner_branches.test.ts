// T-13-6 — Merge `HEAD` and branching histories: the watermark reaches `HEAD`
// and a resume never double-counts (Step 13; AD-13 at a02adc0).
//
// Real git, real store, no doubles in the miner's path. The repositories are
// built here with the generator's exported helpers (pinned identity, dates, and
// isolated git config) — the spec's Data names no §5.1 fixture, so none is
// registered.
//
// (a)/(b) share one shape (timeline in fixture days):
//     m1 (d1: a.txt, b.txt)            main, the fork point
//     s1 (d2: a.txt, s.txt)            side
//     s2 (d3: b.txt, s.txt)            side
//     m2 (d4: a.txt, b.txt)            main — dated after the side commits
//     m3 (d5: a.txt, b.txt)            main
//     M  (d6: git merge --no-ff side)  HEAD, a merge
//   `--reverse` (oldest first by date) streams m1, s1, s2, m2, m3. The pass in
//   (b) stops after the first chunk whose newest commit is a main commit
//   mined after side-branch commits, i.e. m2 (m1 is the fork point, an
//   ancestor of both branches): its watermark m2 does not reach s1/s2, so a
//   resume from `m2..HEAD` alone would count them twice. The stop is a thrown
//   error injected through T-13-5's worker (role `mine-stop`), with
//   `miner.chunk_ms` = 0 (one commit per chunk).
//
// (c) base B (keep.txt); D (dropped-only.txt, shared.txt); K (shared.txt,
//   keep.txt). After a first mine, `git rebase --onto B D` drops D; K is
//   replayed as K' (its modify/delete conflict on shared.txt resolved by
//   keeping K's version), so dropped-only.txt is touched only by the dropped
//   commit and shared.txt is first touched by the dropped commit and again by
//   a kept one.

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openStore, probeFts5, type Store } from '../../src/stores/adapter.js';
import { applyMigrations } from '../../src/stores/migration_runner.js';
import { seedDefaults, tuning as tuningDao, tuningReader } from '../../src/stores/dao/tuning.js';
import { filesDao } from '../../src/stores/dao/files.js';
import { commitsDao } from '../../src/stores/dao/commits.js';
import { schemaMetaDao } from '../../src/stores/dao/schema_meta.js';
import { mineCochange } from '../../src/miner/cochange.js';
import { fixtureCommit, fixtureGit, fixtureInit } from '../fixtures/generate.js';

const workerPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'miner_chunks_worker.js');
const root = mkdtempSync(path.join(tmpdir(), 'ctxoracle-miner-branches-'));
process.on('exit', () => rmSync(root, { recursive: true, force: true }));
const diag = path.join(root, 'diagnostics');

interface Dbs {
  project: string;
  global: string;
}

function newDbs(name: string, chunkMs?: string): Dbs {
  const project = path.join(root, `${name}.db`);
  const global = path.join(root, `${name}-global.db`);
  const p = openStore(project);
  applyMigrations(p, { fts: probeFts5(p) });
  p.close();
  const g = openStore(global);
  applyMigrations(g, { fts: false, scope: 'global' });
  seedDefaults(g);
  if (chunkMs !== undefined) tuningDao.set(g, 'miner.chunk_ms', chunkMs, 'owner');
  g.close();
  return { project, global };
}

async function mine(dbs: Dbs, repo: string): Promise<void> {
  const store = openStore(dbs.project);
  const global = openStore(dbs.global);
  try {
    await mineCochange(store, repo, { tuning: tuningReader(global, 'miner-branches', () => {}), diagnosticsDir: diag });
  } finally {
    store.close();
    global.close();
  }
}

function withStore<T>(dbs: Dbs, f: (s: Store) => T): T {
  const s = openStore(dbs.project);
  try {
    return f(s);
  } finally {
    s.close();
  }
}

/** The merge-HEAD shape of (a)/(b); returns the commit hashes by name. */
function buildMergeRepo(dir: string): Record<'m1' | 's1' | 's2' | 'm2' | 'm3' | 'merge', string> {
  fixtureInit(dir);
  const head = (): string => fixtureGit(dir, ['rev-parse', 'HEAD']).trim();
  fixtureCommit(dir, [{ path: 'a.txt', content: 'a1\n' }, { path: 'b.txt', content: 'b1\n' }], { message: 'm1', day: 1 });
  const m1 = head();
  fixtureGit(dir, ['checkout', '-q', '-b', 'side']);
  fixtureCommit(dir, [{ path: 'a.txt', content: 'a-side\n' }, { path: 's.txt', content: 's1\n' }], { message: 's1', day: 2 });
  const s1 = head();
  fixtureCommit(dir, [{ path: 'b.txt', content: 'b-side\n' }, { path: 's.txt', content: 's2\n' }], { message: 's2', day: 3 });
  const s2 = head();
  fixtureGit(dir, ['checkout', '-q', 'main']);
  fixtureCommit(dir, [{ path: 'a.txt', content: 'a2\n' }, { path: 'b.txt', content: 'b2\n' }], { message: 'm2', day: 4 });
  const m2 = head();
  fixtureCommit(dir, [{ path: 'a.txt', content: 'a3\n' }, { path: 'b.txt', content: 'b3\n' }], { message: 'm3', day: 5 });
  const m3 = head();
  // `-X ours`: the side edits of a.txt/b.txt conflict with main's; the merge keeps main's.
  fixtureGit(dir, ['merge', '-q', '--no-ff', '-X', 'ours', '-m', 'merge side', 'side'], { day: 6 });
  const merge = head();
  return { m1, s1, s2, m2, m3, merge };
}

/** change_count/change_weight per file and pair_count/pair_weight per pair, by path. */
function counts(store: Store): { files: string[]; pairs: string[] } {
  const pathOf = new Map(filesDao(store).all().map((f) => [f.id, f.path]));
  const p = (id: number): string => pathOf.get(id) ?? `#${id}`;
  const files = filesDao(store)
    .all()
    .filter((f) => f.change_count !== 0 || f.change_weight !== 0)
    .map((f) => `${f.path} count=${f.change_count} weight=${f.change_weight}`)
    .sort();
  const pairs = (store.prepare('SELECT a, b, pair_count, pair_weight FROM cochange_pairs').all() as { a: number; b: number; pair_count: number; pair_weight: number }[])
    .map((r) => `${[p(r.a), p(r.b)].sort().join(' | ')} count=${r.pair_count} weight=${r.pair_weight}`)
    .sort();
  return { files, pairs };
}

test('T-13-6a: after a full mine of a merge HEAD, last_mined_commit is HEAD and history reads fresh', async () => {
  const repo = path.join(root, 'merge-a');
  const h = buildMergeRepo(repo);
  const head = fixtureGit(repo, ['rev-parse', 'HEAD']).trim();
  assert.equal(head, h.merge, 'fixture: HEAD is the merge commit');
  assert.equal(fixtureGit(repo, ['rev-list', '--parents', '-n', '1', 'HEAD']).trim().split(' ').length, 3, 'fixture: HEAD has two parents');
  const dbs = newDbs('a');
  await mine(dbs, repo);
  const wm = withStore(dbs, (s) => schemaMetaDao(s).get('last_mined_commit'));
  assert.equal(wm, head, 'last_mined_commit is not HEAD (the merge)');
  // The index-free history staleness check (AD-14): stale iff last_mined_commit ≠ HEAD.
  assert.equal(wm !== head, false, 'history staleness reads stale on a merge HEAD');
});

test('T-13-6b: a pass stopped after the m2 chunk and resumed counts every commit once', async () => {
  const repo = path.join(root, 'merge-b');
  const h = buildMergeRepo(repo);
  const order = fixtureGit(repo, ['log', '--no-merges', '--reverse', '--format=%H', 'HEAD']).trim().split('\n');
  assert.deepEqual(order, [h.m1, h.s1, h.s2, h.m2, h.m3], 'fixture: the side commits stream between m1 and m2');

  const reference = newDbs('b-reference');
  await mine(reference, repo);

  const dbs = newDbs('b', '0');
  const child = spawn(process.execPath, [workerPath, 'mine-stop', repo, dbs.project, dbs.global, diag, h.m2], {
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  let stderr = '';
  child.stderr?.on('data', (d: Buffer) => {
    stderr += d.toString('utf8');
  });
  const code = await new Promise<number | null>((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', (c) => resolve(c));
  });
  assert.ok(stderr.includes(`injected stop after ${h.m2}`), `the pass did not stop after the m2 chunk; worker exit ${code}, stderr:\n${stderr}`);
  assert.equal(withStore(dbs, (s) => schemaMetaDao(s).get('last_mined_commit')), h.m2, 'the stopped pass left its watermark at m2');

  await mine(dbs, repo); // the resume
  assert.deepEqual(withStore(dbs, counts), withStore(reference, counts), 'counts after the resume differ from one uninterrupted mine');
});

test('T-13-6c: after a rewrite, a path only a dropped commit touched is swept and a re-touched path is re-pointed', async () => {
  const repo = path.join(root, 'rewrite-c');
  fixtureInit(repo);
  const head = (): string => fixtureGit(repo, ['rev-parse', 'HEAD']).trim();
  fixtureCommit(repo, [{ path: 'keep.txt', content: 'k0\n' }], { message: 'base', day: 1 });
  const base = head();
  fixtureCommit(
    repo,
    [
      { path: 'dropped-only.txt', content: 'd\n' },
      { path: 'shared.txt', content: 'shared d\n' },
    ],
    { message: 'dropped', day: 2 }
  );
  const dropped = head();
  fixtureCommit(
    repo,
    [
      { path: 'shared.txt', content: 'shared k\n' },
      { path: 'keep.txt', content: 'k1\n' },
    ],
    { message: 'kept', day: 3 }
  );

  const dbs = newDbs('c');
  await mine(dbs, repo);
  withStore(dbs, (s) => {
    assert.equal(filesDao(s).byPath('shared.txt')?.prov_ref, dropped, 'fixture: shared.txt was first named by the dropped commit');
    assert.ok(filesDao(s).byPath('dropped-only.txt') !== undefined, 'fixture: the first mine created dropped-only.txt');
  });

  // Drop D; K's replay conflicts (modify/delete on shared.txt) — keep K's version.
  try {
    fixtureGit(repo, ['rebase', '-q', '--onto', base, dropped], { day: 4 });
    assert.fail('fixture: expected the replay of `kept` to conflict on shared.txt');
  } catch (e) {
    if (e instanceof assert.AssertionError) throw e;
  }
  fixtureGit(repo, ['add', 'shared.txt']);
  fixtureGit(repo, ['-c', 'core.editor=true', 'rebase', '--continue'], { day: 4 });
  const kept = head();
  assert.equal(fixtureGit(repo, ['log', '-1', '--format=%s', kept]).trim(), 'kept', 'fixture: HEAD is the replayed kept commit');
  assert.equal(fixtureGit(repo, ['rev-parse', `${kept}~1`]).trim(), base, 'fixture: the dropped commit is gone from history');

  await mine(dbs, repo);
  withStore(dbs, (s) => {
    assert.equal(filesDao(s).byPath('dropped-only.txt'), undefined, 'the history-only row of a path only the dropped commit touched survived');
    const shared = filesDao(s).byPath('shared.txt');
    assert.ok(shared !== undefined, 'shared.txt row is missing');
    assert.equal(shared.prov_ref, kept, "shared.txt's prov_ref is not the kept commit");
    assert.ok(commitsDao(s).exists(shared.prov_ref), "shared.txt's prov_ref names a commit not in commits");
  });
});

// Step 13 build review (2026-09-26): T-13-6b's stopped pass is the store's
// first mine — a full pass — so its resume is a purged full re-mine (plan Step
// 13: "a full pass that crashed"), and it counts every commit once whether or
// not the already-mined skip exists (hand mutation C4 survived). The skip
// matters only to an incremental continuation, which this case exercises.
test('T-13-6d: an incremental pass over a branching history, stopped after the m2 chunk and resumed, counts every commit once', async () => {
  // Plan Step 13: "A commit already in `commits` is skipped ... so a resumed
  // pass never counts a commit twice, even on a branching history whose
  // side-branch commits were mined before the chunk's last commit without being
  // its ancestors"; an incremental pass that crashed "resumes from
  // `<watermark>..HEAD` and never sets the flag".
  const repo = path.join(root, 'merge-d');
  const h = buildMergeRepo(repo);
  const reference = newDbs('d-reference');
  await mine(reference, repo);

  // A store mined incrementally-ready to m1 (a clone checked out there), then HEAD back at the merge.
  const dbs = newDbs('d', '0');
  fixtureGit(repo, ['checkout', '-q', '--detach', h.m1]);
  await mine(dbs, repo);
  assert.equal(withStore(dbs, (s) => schemaMetaDao(s).get('last_mined_commit')), h.m1, 'fixture: the store is mined to m1');
  fixtureGit(repo, ['checkout', '-q', 'main']);

  // The incremental pass streams s1, s2, m2, m3 (m1..HEAD) and stops after the m2 chunk.
  const child = spawn(process.execPath, [workerPath, 'mine-stop', repo, dbs.project, dbs.global, diag, h.m2], {
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  let stderr = '';
  child.stderr?.on('data', (d: Buffer) => {
    stderr += d.toString('utf8');
  });
  await new Promise<void>((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', () => resolve());
  });
  assert.ok(stderr.includes(`injected stop after ${h.m2}`), `the pass did not stop after the m2 chunk; stderr:\n${stderr}`);
  withStore(dbs, (s) => {
    assert.equal(schemaMetaDao(s).get('mining_in_progress'), '0', 'fixture: the stopped pass was incremental');
    assert.ok(commitsDao(s).exists(h.s1) && commitsDao(s).exists(h.s2), 'fixture: the side commits were mined before the stop');
  });

  await mine(dbs, repo); // the resume: m2..HEAD still reaches s1 and s2 through the merge
  assert.deepEqual(withStore(dbs, counts), withStore(reference, counts), 'counts after the incremental resume differ from one uninterrupted mine');
});
