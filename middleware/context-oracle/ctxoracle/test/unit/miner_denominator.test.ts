// T-13-2 — The `change_count` denominator (Step 13; AD-13, gap-list review G3),
// and T-13-2a — the weight epoch (Step 13 build review M3).
//
// support(A) — the number of included transactions containing A (Zimmermann
// et al., TSE 31(6) 2005) — is stored once per file (`files.change_count`),
// single-file commits included, never as a per-pair counter. Real git over the
// generated `miner-denominator` fixture: `a.txt` in 7 included commits, 4 of
// them with `b.txt`; `b.txt` only in those 4; one single-file commit on `c.txt`.
//
// The weights are AD-13's `w = 2^((min(ts, refTs) − E) / (h × 86400))`, with
// `E` the stored `schema_meta.weight_epoch` (a full mine writes
// `refTs − 500 × h × 86400`), `refTs` = `schema_meta.ref_ts`, and h = the
// seeded `bar.recency_half_life_days` 365, summed over the stated commits'
// author timestamps (`%at`, the timestamp the Step 13 stream reads), compared
// at 1e-9 relative (revised spec, Step 13 build review M3; the former fixed
// T0 = 946684800 is gone).

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openStore, probeFts5 } from '../../src/stores/adapter.js';
import { applyMigrations } from '../../src/stores/migration_runner.js';
import { seedDefaults, tuningReader } from '../../src/stores/dao/tuning.js';
import { filesDao } from '../../src/stores/dao/files.js';
import { cochangePairsDao } from '../../src/stores/dao/cochange_pairs.js';
import { schemaMetaDao } from '../../src/stores/dao/schema_meta.js';
import { mineCochange } from '../../src/miner/cochange.js';
import type { Store } from '../../src/stores/adapter.js';
import type { TuningReader } from '../../src/types/candidate.js';
import { generateFixture, fixtureCommit, fixtureGit, fixtureInit } from '../fixtures/generate.js';

const H_DAYS = 365;
const H_S = H_DAYS * 86400;
const weight = (ts: number, refTs: number, epoch: number): number => 2 ** ((Math.min(ts, refTs) - epoch) / H_S);

function authorTimes(repo: string, file: string): number[] {
  return fixtureGit(repo, ['log', '--format=%at', '--', file])
    .trim()
    .split('\n')
    .map(Number);
}

function assertRelClose(actual: number | undefined, expected: number, what: string): void {
  assert.ok(actual !== undefined, `${what} is missing`);
  const rel = Math.abs(actual - expected) / Math.abs(expected);
  assert.ok(rel <= 1e-9, `${what}: ${actual} differs from ${expected} by ${rel} relative (> 1e-9)`);
}

test('T-13-2: change_count is support(file) over included commits; pair_count and the weights follow AD-13', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'ctxoracle-miner-denom-'));
  try {
    const repo = path.join(root, 'repo');
    generateFixture('miner-denominator', repo);
    const store = openStore(path.join(root, 'project.db'));
    applyMigrations(store, { fts: probeFts5(store) });
    const global = openStore(path.join(root, 'global.db'));
    applyMigrations(global, { fts: false, scope: 'global' });
    seedDefaults(global);
    const tuning = tuningReader(global, 'miner-denominator', () => {});
    assert.equal(tuning.num('bar.recency_half_life_days'), H_DAYS, 'the seeded half-life the formula uses');

    await mineCochange(store, repo, { tuning, diagnosticsDir: path.join(root, 'diagnostics') });

    const files = filesDao(store);
    const a = files.byPath('a.txt');
    const b = files.byPath('b.txt');
    const c = files.byPath('c.txt');
    assert.equal(a?.change_count, 7, 'change_count(a)');
    assert.equal(b?.change_count, 4, 'change_count(b)');
    assert.equal(c?.change_count, 1, 'change_count(c) — a single-file commit counts');
    assert.ok(a !== undefined && b !== undefined);
    const pair = cochangePairsDao(store).pair(a.id, b.id);
    assert.equal(pair?.pair_count, 4, 'pair(a, b).pair_count');

    const meta = schemaMetaDao(store);
    const refTs = Number(meta.get('ref_ts'));
    const epoch = Number(meta.get('weight_epoch'));
    assert.equal(meta.get('weight_epoch'), String(refTs - 500 * H_S), 'schema_meta.weight_epoch is not refTs − 500 × 365 × 86400');

    const aTimes = authorTimes(repo, 'a.txt');
    const bTimes = authorTimes(repo, 'b.txt'); // b.txt changed only in the 4 paired commits
    assert.equal(aTimes.length, 7, 'fixture: a.txt in 7 commits');
    assert.equal(bTimes.length, 4, 'fixture: b.txt in 4 commits');
    assertRelClose(a.change_weight, aTimes.reduce((s, t) => s + weight(t, refTs, epoch), 0), 'change_weight(a)');
    assertRelClose(pair?.pair_weight, bTimes.reduce((s, t) => s + weight(t, refTs, epoch), 0), 'pair(a, b).pair_weight');

    const cols = (store.prepare('PRAGMA table_info(cochange_pairs)').all() as { name: string }[]).map((r) => r.name);
    assert.ok(!cols.includes('a_count') && !cols.includes('b_count'), `cochange_pairs has a per-pair counter column: ${cols.join(', ')}`);
    store.close();
    global.close();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// ---- T-13-2a ----------------------------------------------------------------

function openProject(file: string): Store {
  const s = openStore(file);
  applyMigrations(s, { fts: probeFts5(s) });
  return s;
}

function seededTuning(file: string): TuningReader {
  const g = openStore(file);
  applyMigrations(g, { fts: false, scope: 'global' });
  seedDefaults(g);
  return tuningReader(g, 'miner-epoch', () => {});
}

/** commits, pairs (counts and weights), per-file counts and weights, labelled_touches — by path. */
function historyRows(store: Store): Record<string, string[]> {
  const pathOf = new Map(filesDao(store).all().map((f) => [f.id, f.path]));
  const p = (id: number): string => pathOf.get(id) ?? `#${id}`;
  const commits = (store.prepare('SELECT hash, ts, entity_count, excluded, exclude_reason FROM commits').all() as Record<string, unknown>[])
    .map((r) => JSON.stringify([r.hash, r.ts, r.entity_count, r.excluded, r.exclude_reason]))
    .sort();
  const pairs = (
    store.prepare('SELECT a, b, pair_count, pair_weight, last_ts, last_commit FROM cochange_pairs').all() as {
      a: number;
      b: number;
      pair_count: number;
      pair_weight: number;
      last_ts: number;
      last_commit: string;
    }[]
  )
    .map((r) => `${[p(r.a), p(r.b)].sort().join(' | ')} ${r.pair_count} ${r.pair_weight} ${r.last_ts} ${r.last_commit}`)
    .sort();
  const files = filesDao(store)
    .all()
    .filter((f) => f.change_count !== 0 || f.change_weight !== 0)
    .map((f) => `${f.path} ${f.change_count} ${f.change_weight}`)
    .sort();
  const touches = (
    store.prepare('SELECT file_id, commit_hash, label, ts FROM labelled_touches').all() as { file_id: number; commit_hash: string; label: string; ts: number }[]
  )
    .map((r) => `${p(r.file_id)} ${r.commit_hash} ${r.label} ${r.ts}`)
    .sort();
  return { commits, pairs, files, touches };
}

test('T-13-2a: a year-3237 author date yields finite weights, and an out-of-range epoch forces a purged full re-mine', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'ctxoracle-miner-epoch-'));
  try {
    // (a) c1: c.txt; c2: a.txt + b.txt, author date @40000000000 (year 3237),
    // committer date inside the timeline; c3: c.txt (HEAD, inside the timeline).
    const repo = path.join(root, 'repo');
    fixtureInit(repo);
    fixtureCommit(repo, [{ path: 'c.txt', content: 'c1\n' }], { message: 'c1', day: 1 });
    writeFileSync(path.join(repo, 'a.txt'), 'a\n');
    writeFileSync(path.join(repo, 'b.txt'), 'b\n');
    fixtureGit(repo, ['add', '-A']);
    fixtureGit(repo, ['commit', '-q', '-m', 'c2 far future', '--date=@40000000000 +0000'], { day: 2 });
    assert.equal(fixtureGit(repo, ['log', '-1', '--format=%at']).trim(), '40000000000', 'fixture: c2 is authored in year 3237');
    fixtureCommit(repo, [{ path: 'c.txt', content: 'c3\n' }], { message: 'c3', day: 3 });

    const diag = path.join(root, 'diagnostics');
    const store = openProject(path.join(root, 'project.db'));
    const tuning = seededTuning(path.join(root, 'global.db'));
    await mineCochange(store, repo, { tuning, diagnosticsDir: diag });

    const refTs = Number(fixtureGit(repo, ['log', '-1', '--format=%ct', 'HEAD']).trim());
    const meta = schemaMetaDao(store);
    const weights = [
      ...(store.prepare('SELECT path, change_weight AS w FROM files WHERE change_count > 0').all() as { path: string; w: unknown }[]),
      ...(store.prepare('SELECT a || \'-\' || b AS path, pair_weight AS w FROM cochange_pairs').all() as { path: string; w: unknown }[]),
    ];
    assert.ok(weights.length > 0, '(a) the mine stored no weights');
    for (const r of weights) {
      assert.ok(typeof r.w === 'number' && Number.isFinite(r.w) && r.w !== 0, `(a) weight of ${r.path} is ${String(r.w)} (NULL, not finite, or 0)`);
    }
    assert.equal(meta.get('weight_epoch'), String(refTs - 500 * H_S), '(a) weight_epoch is not refTs − 500 × 365 × 86400');
    const a = filesDao(store).byPath('a.txt');
    const b = filesDao(store).byPath('b.txt');
    assert.ok(a !== undefined && b !== undefined);
    const pairWeight = cochangePairsDao(store).pair(a.id, b.id)?.pair_weight;
    assertRelClose(pairWeight, 2 ** 500, "(a) the 3237 commit's contribution to pair(a, b).pair_weight (ts capped at refTs: 500 half-lives)");

    // (b) the stored epoch put 1001 half-lives before HEAD; one commit added; a pass without `full`.
    meta.set('weight_epoch', String(refTs - 1001 * H_S));
    fixtureCommit(repo, [{ path: 'a.txt', content: 'a4\n' }, { path: 'c.txt', content: 'c4\n' }], { message: 'c4', day: 4 });
    await mineCochange(store, repo, { tuning, diagnosticsDir: diag });
    const scratch = openProject(path.join(root, 'scratch.db'));
    await mineCochange(scratch, repo, { tuning: seededTuning(path.join(root, 'global2.db')), diagnosticsDir: diag });

    assert.deepEqual(historyRows(store), historyRows(scratch), '(b) the pass was not a purged full re-mine (rows differ from a from-scratch mine)');
    const newRefTs = Number(fixtureGit(repo, ['log', '-1', '--format=%ct', 'HEAD']).trim());
    assert.equal(meta.get('weight_epoch'), String(newRefTs - 500 * H_S), '(b) weight_epoch is not the new refTs − 500 × 365 × 86400');
    assert.equal(meta.get('mining_in_progress'), '0', "(b) mining_in_progress is not '0' afterwards");
    store.close();
    scratch.close();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
