// T-13-5 — Chunked commits: crash safety and the lock-hold bound (Step 13,
// AD-26; expert review S3).
//
// Real git over `miner-large` (2,000 commits x 20 files, via git fast-import);
// real stores; real processes (worker: miner_chunks_worker.ts); no doubles. The
// test sequences on store observables (`schema_meta.last_mined_commit`,
// `schema_meta.mining_in_progress`) read through its own connection while the
// worker writes (WAL readers never block), never on a fixed sleep.
//
//   (a) a crashed full pass: `miner.chunk_ms` tuned to 0 (one commit per
//       chunk); SIGKILL after the watermark first advances past commit 500;
//       the invariant is checked; then a completing mine (a crash
//       continuation: a purged full re-mine).
//   (b) at the seeded 50 ms, a full mine in a worker while a second process
//       performs 200 single-row observed_actions appends through
//       store.transaction: none may raise StoreBusy.
//   (c) a repeated full mine: mineCochange({full: true}) twice on a completed
//       store.
//   (d) a crashed incremental pass: a store mined to commit 1,000 (a clone
//       checked out there), the rest made reachable, an incremental mine
//       killed after its watermark first advances past commit 1,500, then a
//       completing mine. `miner.chunk_ms` is tuned to 0 here too, so the
//       watermark advances one commit at a time and the kill point is
//       reachable before the pass completes (a harness setting, not an
//       asserted value).
//
// "A single uninterrupted mine" is one completed mine of the same repository
// into a fresh store at the seeded tuning. Rows are compared by path.
//
// Not covered here (reported to the builder): (c)'s "`runIndex(…, {full:
// true})` once more on it" — Step 14's declared runIndex options
// ({full, frontends, tuning, diagnosticsDir}) do not exist before Step 14, and
// the skeleton's (which require a raw global store) are the ones Step 14
// replaces, so the call cannot be written at Step 13 without guessing a
// signature.

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { openStore, probeFts5, type Store } from '../../src/stores/adapter.js';
import { applyMigrations } from '../../src/stores/migration_runner.js';
import { seedDefaults, tuning as tuningDao, tuningReader } from '../../src/stores/dao/tuning.js';
import { filesDao } from '../../src/stores/dao/files.js';
import { mineCochange } from '../../src/miner/cochange.js';
import { generateFixture, fixtureGit, LARGE } from '../fixtures/generate.js';

const workerPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'miner_chunks_worker.js');
const root = mkdtempSync(path.join(tmpdir(), 'ctxoracle-miner-chunks-'));
process.on('exit', () => rmSync(root, { recursive: true, force: true }));
const repo = path.join(root, 'repo');
const diag = path.join(root, 'diagnostics');
generateFixture('miner-large', repo);
/** Commit hashes oldest first; ordinal = index + 1. */
const ordered = fixtureGit(repo, ['rev-list', '--reverse', 'HEAD']).trim().split('\n');
const ordinal = new Map(ordered.map((h, i) => [h, i + 1]));

interface Dbs {
  project: string;
  global: string;
}

/** A migrated project store and a seeded global store (optionally with miner.chunk_ms overridden). */
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

async function mineInProcess(dbs: Dbs, repoPath: string, full?: boolean): Promise<void> {
  const store = openStore(dbs.project);
  const global = openStore(dbs.global);
  try {
    const tuning = tuningReader(global, 'miner-large', () => {});
    await mineCochange(store, repoPath, full === true ? { tuning, diagnosticsDir: diag, full: true } : { tuning, diagnosticsDir: diag });
  } finally {
    store.close();
    global.close();
  }
}

interface Worker {
  child: ChildProcess;
  exited: boolean;
  stderr: string;
  exit: Promise<{ code: number | null; signal: NodeJS.Signals | null }>;
}

function startWorker(args: string[]): Worker {
  const child = spawn(process.execPath, [workerPath, ...args], { stdio: ['ignore', 'ignore', 'pipe'] });
  const w: Worker = { child, exited: false, stderr: '', exit: Promise.resolve({ code: null, signal: null }) };
  child.stderr?.on('data', (d: Buffer) => {
    w.stderr += d.toString('utf8');
  });
  w.exit = new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      w.exited = true;
      resolve({ code, signal });
    });
  });
  return w;
}

function meta(reader: Store, key: string): string | undefined {
  const row = reader.prepare('SELECT value FROM schema_meta WHERE key = ?').get(key) as { value: string | null } | undefined;
  return row?.value ?? undefined;
}

/** Poll until `done()`; `onTick` sees every observation; fail with the worker's stderr if it exits first. */
async function pollUntil(w: Worker, done: () => boolean, onTick: () => void = () => {}, timeoutMs = 180_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    onTick();
    if (done()) return;
    if (w.exited) {
      await w.exit;
      throw new Error(`worker exited before the awaited condition; stderr:\n${w.stderr}`);
    }
    if (Date.now() > deadline) throw new Error('timed out waiting for the worker');
    await delay(1);
  }
}

function watermarkOrdinal(reader: Store): number {
  const wm = meta(reader, 'last_mined_commit');
  return wm === undefined ? 0 : (ordinal.get(wm) ?? -1);
}

/** Pair and per-file counts and weights, keyed by path. */
function countsSnapshot(store: Store): { pairs: string[]; files: string[] } {
  const pathOf = new Map(filesDao(store).all().map((f) => [f.id, f.path]));
  const p = (id: number): string => pathOf.get(id) ?? `#${id}`;
  const pairs = (
    store.prepare('SELECT a, b, pair_count, pair_weight FROM cochange_pairs').all() as {
      a: number;
      b: number;
      pair_count: number;
      pair_weight: number;
    }[]
  )
    .map((r) => `${[p(r.a), p(r.b)].sort().join(' | ')} count=${r.pair_count} weight=${r.pair_weight}`)
    .sort();
  const files = filesDao(store)
    .all()
    .filter((f) => f.change_count !== 0 || f.change_weight !== 0)
    .map((f) => `${f.path} count=${f.change_count} weight=${f.change_weight}`)
    .sort();
  return { pairs, files };
}

/** Every history-derived row (commits, pairs, labelled_touches, per-file counts, miner landmines), by path. */
function fullSnapshot(store: Store): Record<string, string[]> {
  const pathOf = new Map(filesDao(store).all().map((f) => [f.id, f.path]));
  const p = (id: number): string => pathOf.get(id) ?? `#${id}`;
  const commits = (
    store.prepare('SELECT hash, ts, entity_count, excluded, exclude_reason FROM commits').all() as Record<string, unknown>[]
  )
    .map((r) => JSON.stringify([r.hash, r.ts, r.entity_count, r.excluded, r.exclude_reason]))
    .sort();
  const lastCommits = (
    store.prepare('SELECT a, b, last_ts, last_commit FROM cochange_pairs').all() as { a: number; b: number; last_ts: number; last_commit: string }[]
  )
    .map((r) => `${[p(r.a), p(r.b)].sort().join(' | ')} ${r.last_ts} ${r.last_commit}`)
    .sort();
  const touches = (
    store.prepare('SELECT file_id, commit_hash, label, ts FROM labelled_touches').all() as { file_id: number; commit_hash: string; label: string; ts: number }[]
  )
    .map((r) => `${p(r.file_id)} ${r.commit_hash} ${r.label} ${r.ts}`)
    .sort();
  const landmines = (
    store
      .prepare("SELECT kind, file_id, evidence, support FROM landmines WHERE kind IN ('revert_chain','fix_chatter')")
      .all() as { kind: string; file_id: number; evidence: string; support: number | null }[]
  )
    .map((r) => `${r.kind} ${p(r.file_id)} ${r.support} ${r.evidence}`)
    .sort();
  const { pairs, files } = countsSnapshot(store);
  return { commits, pairs, lastCommits, files, touches, landmines };
}

function snapshotOf(dbs: Dbs, f: (s: Store) => unknown): unknown {
  const s = openStore(dbs.project);
  try {
    return f(s);
  } finally {
    s.close();
  }
}

// The single uninterrupted mine every case compares against.
let reference: Record<string, string[]> | undefined;
async function referenceSnapshot(): Promise<Record<string, string[]>> {
  if (reference === undefined) {
    const dbs = newDbs('reference');
    await mineInProcess(dbs, repo);
    reference = snapshotOf(dbs, fullSnapshot) as Record<string, string[]>;
  }
  return reference;
}

test('T-13-5a: a crashed full pass leaves no commit behind the watermark; the continuation re-mines without doubling', async () => {
  assert.equal(ordered.length, LARGE.commits, 'fixture: 2,000 commits');
  const dbs = newDbs('a', '0');
  const reader = openStore(dbs.project);
  try {
    const w = startWorker(['mine', repo, dbs.project, dbs.global, diag, 'auto']);
    await pollUntil(w, () => watermarkOrdinal(reader) > 500);
    w.child.kill('SIGKILL');
    await w.exit;

    const wm = meta(reader, 'last_mined_commit');
    assert.ok(wm !== undefined);
    const k = ordinal.get(wm);
    assert.ok(k !== undefined && k > 500, `the watermark ${wm} is a mined commit past 500`);
    const present = new Set((reader.prepare('SELECT hash FROM commits').all() as { hash: string }[]).map((r) => r.hash));
    const missing = ordered.slice(0, k).filter((h) => !present.has(h));
    assert.deepEqual(missing, [], `commits at or before the watermark (#${k}) are absent from commits`);
    assert.equal(meta(reader, 'mining_in_progress'), '1', "mining_in_progress is not '1' after the kill of a full pass");

    // A fresh mine of the history truncated at the watermark.
    const trunc = path.join(root, 'trunc-a');
    fixtureGit(root, ['clone', '-q', repo, trunc]);
    fixtureGit(trunc, ['reset', '-q', '--hard', wm]);
    const truncDbs = newDbs('trunc-a');
    await mineInProcess(truncDbs, trunc);
    const pairCounts = (s: Store): string[] => countsSnapshot(s).pairs.map((l) => l.replace(/ weight=.*$/, ''));
    assert.deepEqual(pairCounts(reader), snapshotOf(truncDbs, pairCounts), 'pair counts after the kill differ from a fresh mine truncated at the watermark');

    // The completing mine.
    await mineInProcess(dbs, repo);
    assert.equal(meta(reader, 'mining_in_progress'), '0', "mining_in_progress is not '0' after the completing mine");
    assert.deepEqual(snapshotOf(dbs, fullSnapshot), await referenceSnapshot(), 'the completed store differs from a single uninterrupted mine');
  } finally {
    reader.close();
  }
});

test('T-13-5b: 200 single-row appends during a full mine at the seeded chunk_ms never raise StoreBusy', async () => {
  const dbs = newDbs('b');
  const reader = openStore(dbs.project);
  try {
    const miner = startWorker(['mine', repo, dbs.project, dbs.global, diag, 'auto']);
    await pollUntil(miner, () => meta(reader, 'mining_in_progress') === '1' || meta(reader, 'last_mined_commit') !== undefined);
    assert.equal(miner.exited, false, 'the mine is still running when the appends start');
    const result = path.join(root, 'b-appends.json');
    const appender = startWorker(['append', dbs.project, '200', result]);
    const a = await appender.exit;
    assert.equal(a.code, 0, `appender failed: ${appender.stderr}`);
    const m = await miner.exit;
    assert.equal(m.code, 0, `the mine failed: ${miner.stderr}`);
    const r = JSON.parse(readFileSync(result, 'utf8')) as { ok: number; storeBusy: number; otherErrors: string[] };
    assert.equal(r.storeBusy, 0, `${r.storeBusy} of the 200 appends raised StoreBusy`);
    assert.deepEqual(r.otherErrors, []);
    assert.equal(r.ok, 200);
  } finally {
    reader.close();
  }
});

test('T-13-5c: a repeated full mine does not double any count or weight', async () => {
  const dbs = newDbs('c');
  await mineInProcess(dbs, repo);
  await mineInProcess(dbs, repo, true);
  await mineInProcess(dbs, repo, true);
  const ref = await referenceSnapshot();
  assert.deepEqual(snapshotOf(dbs, countsSnapshot), { pairs: ref.pairs, files: ref.files }, 'pair_count/pair_weight/change_count/change_weight differ from one mine');
});

test('T-13-5d: a crashed incremental pass resumes from its watermark and never sets mining_in_progress', async () => {
  const half = path.join(root, 'half');
  fixtureGit(root, ['clone', '-q', repo, half]);
  fixtureGit(half, ['reset', '-q', '--hard', ordered[999] as string]);
  const dbs = newDbs('d', '0');
  await mineInProcess(dbs, half);
  const reader = openStore(dbs.project);
  try {
    assert.equal(meta(reader, 'last_mined_commit'), ordered[999], 'the store is mined to commit 1,000');
    fixtureGit(half, ['reset', '-q', '--hard', ordered[LARGE.commits - 1] as string]);

    let sawInProgress = false;
    const watch = (): void => {
      if (meta(reader, 'mining_in_progress') === '1') sawInProgress = true;
    };
    const killed = startWorker(['mine', half, dbs.project, dbs.global, diag, 'auto']);
    await pollUntil(killed, () => watermarkOrdinal(reader) > 1500, watch);
    killed.child.kill('SIGKILL');
    await killed.exit;
    watch();

    const completing = startWorker(['mine', half, dbs.project, dbs.global, diag, 'auto']);
    await pollUntil(completing, () => completing.exited, watch);
    const r = await completing.exit;
    assert.equal(r.code, 0, `the completing mine failed: ${completing.stderr}`);
    watch();

    assert.equal(sawInProgress, false, "mining_in_progress was '1' during an incremental pass");
    assert.deepEqual(snapshotOf(dbs, fullSnapshot), await referenceSnapshot(), 'the completed store differs from a single uninterrupted mine');
  } finally {
    reader.close();
  }
});
