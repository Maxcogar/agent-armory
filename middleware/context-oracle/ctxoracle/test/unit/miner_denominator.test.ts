// T-13-2 — The `change_count` denominator (Step 13; AD-13, gap-list review G3).
//
// support(A) — the number of included transactions containing A (Zimmermann
// et al., TSE 31(6) 2005) — is stored once per file (`files.change_count`),
// single-file commits included, never as a per-pair counter. Real git over the
// generated `miner-denominator` fixture: `a.txt` in 7 included commits, 4 of
// them with `b.txt`; `b.txt` only in those 4; one single-file commit on `c.txt`.
//
// The weights are AD-13's `w = 2^((ts − T0) / (h × 86400))` with T0 = 946684800
// (2000-01-01T00:00:00Z) and h = the seeded `bar.recency_half_life_days` 365,
// summed over the stated commits' author timestamps (`%at`, the timestamp the
// Step 13 stream reads), compared at 1e-9 relative.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openStore, probeFts5 } from '../../src/stores/adapter.js';
import { applyMigrations } from '../../src/stores/migration_runner.js';
import { seedDefaults, tuningReader } from '../../src/stores/dao/tuning.js';
import { filesDao } from '../../src/stores/dao/files.js';
import { cochangePairsDao } from '../../src/stores/dao/cochange_pairs.js';
import { mineCochange } from '../../src/miner/cochange.js';
import { generateFixture, fixtureGit } from '../fixtures/generate.js';

const T0 = 946684800;
const H_DAYS = 365;
const weight = (ts: number): number => 2 ** ((ts - T0) / (H_DAYS * 86400));

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

    const aTimes = authorTimes(repo, 'a.txt');
    const bTimes = authorTimes(repo, 'b.txt'); // b.txt changed only in the 4 paired commits
    assert.equal(aTimes.length, 7, 'fixture: a.txt in 7 commits');
    assert.equal(bTimes.length, 4, 'fixture: b.txt in 4 commits');
    assertRelClose(a.change_weight, aTimes.reduce((s, t) => s + weight(t), 0), 'change_weight(a)');
    assertRelClose(pair?.pair_weight, bTimes.reduce((s, t) => s + weight(t), 0), 'pair(a, b).pair_weight');

    const cols = (store.prepare('PRAGMA table_info(cochange_pairs)').all() as { name: string }[]).map((r) => r.name);
    assert.ok(!cols.includes('a_count') && !cols.includes('b_count'), `cochange_pairs has a per-pair counter column: ${cols.join(', ')}`);
    store.close();
    global.close();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
