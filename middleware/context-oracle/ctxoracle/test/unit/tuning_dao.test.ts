// T-12-1 — the tuning DAO seeds with provenance, round-trips scalar/list values,
// and re-seeding is idempotent (Step 12). Real node:sqlite via migration 002.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openStore, type Store } from '../../src/stores/adapter.js';
import { applyMigrations } from '../../src/stores/migration_runner.js';
import { tuning, seedDefaults } from '../../src/stores/dao/tuning.js';
import { SCALAR_SEEDS, LIST_SEEDS } from '../../src/stores/dao/tuning_seeds.js';

function sourceOf(store: Store, key: string): string | undefined {
  const row = store
    .prepare('SELECT source FROM tuning WHERE key = ? AND project_key IS NULL ORDER BY rowid LIMIT 1')
    .get(key) as { source: string } | undefined;
  return row?.source;
}

function snapshot(store: Store): string {
  const rows = store
    .prepare('SELECT key, value, source FROM tuning WHERE project_key IS NULL ORDER BY key, value')
    .all() as { key: string; value: string; source: string }[];
  return JSON.stringify(rows);
}

test('T-12-1: seedDefaults seeds every key with its value and source', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ctxoracle-tuning-'));
  const store = openStore(path.join(dir, 'global.db'));
  try {
    applyMigrations(store, { fts: false, scope: 'global' });
    seedDefaults(store);

    for (const s of SCALAR_SEEDS) {
      assert.equal(tuning.get(store, s.key), s.value, `${s.key} value`);
      assert.equal(sourceOf(store, s.key), s.source, `${s.key} source`);
    }
    for (const l of LIST_SEEDS) {
      assert.deepEqual(tuning.list(store, l.key), l.values, `${l.key} members`);
      assert.equal(sourceOf(store, l.key), l.source, `${l.key} source`);
    }

    // A scalar set (owner) round-trips.
    tuning.set(store, 'bar.confidence_floor', '0.7', 'owner');
    assert.equal(tuning.get(store, 'bar.confidence_floor'), '0.7');
    assert.equal(sourceOf(store, 'bar.confidence_floor'), 'owner');

    // A list add + remove round-trips.
    tuning.addToList(store, 'lexicon.completion_claim', 'shipped', 'owner');
    assert.ok(tuning.list(store, 'lexicon.completion_claim').includes('shipped'));
    tuning.removeFromList(store, 'lexicon.completion_claim', 'shipped');
    assert.equal(tuning.list(store, 'lexicon.completion_claim').includes('shipped'), false);

    // Re-seeding changes nothing (including the owner-edited scalar).
    const before = snapshot(store);
    seedDefaults(store);
    assert.equal(snapshot(store), before, 'second seedDefaults is a no-op');
    assert.equal(tuning.get(store, 'bar.confidence_floor'), '0.7', 'owner edit not reset by re-seed');
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
