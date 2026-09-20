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

    // Every scalar seed pinned to its plan §10 literal value AND source label —
    // asserted against the plan, NOT against the SCALAR_SEEDS module the seeder
    // reads, so a silent drift between that module and the plan (a quietly
    // changed default) is caught here, which the module-vs-store loop above
    // cannot see. This is the full §10 scalar set (all 20); the completeness
    // assertion below fails if a seed is ever added to the module without a
    // matching plan literal here (m2 + collapse-hunt Finding 2).
    const PLAN_SCALARS: Array<[string, string, string]> = [
      // architecture_default (§10, AD-14/AD-13/AD-9)
      ['bar.confidence_floor', '0.6', 'architecture_default'],
      ['bar.support_min', '3', 'architecture_default'],
      ['bar.noise_floor_support_min', '2', 'architecture_default'],
      ['bar.impact_read_min_coupled', '2', 'architecture_default'],
      ['miner.max_transaction_entities', '30', 'architecture_default'],
      ['miner.horizon_years', '5', 'architecture_default'],
      ['miner.horizon_commits', '10000', 'architecture_default'],
      ['miner.corpus_floor_commits', '30', 'architecture_default'],
      ['deny.loop_threshold', '3', 'architecture_default'],
      // plan_seed (§10, D-plan-7)
      ['bar.reuse_dominance_k', '3', 'plan_seed'],
      ['deny.despite_answer_text_threshold', '3', 'plan_seed'],
      ['qa.clear_length_floor_chars', '2', 'plan_seed'],
      ['landmine.fix_chatter_k', '3', 'plan_seed'],
      ['landmine.fix_chatter_window_days', '90', 'plan_seed'],
      ['security.entropy_bits_per_char', '4.0', 'plan_seed'],
      ['security.entropy_min_token_length', '20', 'plan_seed'],
      ['qa.done_claim_trailing_turns_k', '3', 'plan_seed'],
      ['bar.recency_half_life_days', '365', 'plan_seed'],
      ['bar.stale_index_factor', '0.8', 'plan_seed'],
      ['diag.hooks_not_firing_gap_s', '600', 'plan_seed'],
    ];
    for (const [key, value, source] of PLAN_SCALARS) {
      assert.equal(tuning.get(store, key), value, `${key} literal value (plan §10)`);
      assert.equal(sourceOf(store, key), source, `${key} literal source (plan §10)`);
    }
    // Completeness: the pinned set must equal the seeder's scalar-key set, so a
    // new scalar seed cannot be added to the module without a plan-§10 pin here.
    assert.deepEqual(
      PLAN_SCALARS.map(([k]) => k).sort(),
      SCALAR_SEEDS.map((s) => s.key).sort(),
      'every SCALAR_SEEDS key must have a plan-§10 literal pin here (and vice versa)'
    );

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
