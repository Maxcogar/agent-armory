// T-12-2 — `tuningReader`: resolution order, re-seed, `tuning_missing`; and
// T-12-3 — the ordering validator (`checkTuningWrite`) and the re-mine notice
// (`tuningWriteNotice`). Reopened Step 12 build delta (G8, G17; AD-13, AD-14,
// AD-20; collapse-hunt H2).
//
// Real global store via migration 002 + seedDefaults. T-12-2's `onMissing` is a
// spy (Meszaros): a recording function, justified because the reader's contract
// is to call its sink — the fault writer behind it is Step 10's, tested there.
// Every threshold below is a Step 12 seed; every boundary is T-12-3's Data.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openStore, type Store } from '../../src/stores/adapter.js';
import { applyMigrations } from '../../src/stores/migration_runner.js';
import { checkTuningWrite, seedDefaults, tuningReader, tuningWriteNotice } from '../../src/stores/dao/tuning.js';

function withSeeded(fn: (g: Store) => void): void {
  const dir = mkdtempSync(path.join(tmpdir(), 'ctxoracle-treader-'));
  const g = openStore(path.join(dir, 'global.db'));
  try {
    applyMigrations(g, { fts: false, scope: 'global' });
    seedDefaults(g);
    fn(g);
  } finally {
    g.close();
    rmSync(dir, { recursive: true, force: true });
  }
}

function insertProjectRow(g: Store, key: string, projectKey: string, value: string): void {
  g.prepare("INSERT INTO tuning(key, project_key, value, source, updated_at) VALUES(?, ?, ?, 'owner', 1)").run(
    key,
    projectKey,
    value
  );
}

// ---- T-12-2 ----

test('T-12-2a: a project row is read before the NULL row; another project reads the NULL row', () => {
  withSeeded((g) => {
    insertProjectRow(g, 'bar.confidence_floor', 'k1', '0.7');
    const missing: string[] = [];
    assert.equal(tuningReader(g, 'k1', (k) => missing.push(k)).num('bar.confidence_floor'), 0.7);
    assert.equal(tuningReader(g, 'k2', (k) => missing.push(k)).num('bar.confidence_floor'), 0.6);
    assert.deepEqual(missing, [], 'no key was missing');
  });
});

test('T-12-2b: a key with no row is re-seeded, onMissing is called exactly once, and the seed value is returned', () => {
  withSeeded((g) => {
    g.prepare("DELETE FROM tuning WHERE key = 'bar.support_min' AND project_key IS NULL").run();
    const missing: string[] = [];
    const reader = tuningReader(g, 'k1', (k) => missing.push(k));
    assert.equal(reader.num('bar.support_min'), 3);
    assert.equal(reader.num('bar.support_min'), 3, 'a second read of the same reader');
    assert.deepEqual(missing, ['bar.support_min'], 'onMissing called exactly once with that key');
    const row = g
      .prepare("SELECT value, source FROM tuning WHERE key = 'bar.support_min' AND project_key IS NULL")
      .all() as { value: string; source: string }[];
    assert.deepEqual(row.map((r) => ({ ...r })), [{ value: '3', source: 'architecture_default' }], 'the seed row is re-written with its seed source');
  });
});

test('T-12-2c: a list key with project-level members reads those members, not the NULL-level ones', () => {
  withSeeded((g) => {
    insertProjectRow(g, 'lexicon.completion_claim', 'k1', 'shipped');
    insertProjectRow(g, 'lexicon.completion_claim', 'k1', 'landed');
    const reader = tuningReader(g, 'k1', () => {});
    assert.deepEqual([...reader.list('lexicon.completion_claim')].sort(), ['landed', 'shipped']);
    // Another project still reads the NULL-level (seeded) members.
    assert.ok(tuningReader(g, 'k2', () => {}).list('lexicon.completion_claim').includes('done'));
  });
});

test('T-12-2d: a key that is not in the seed module throws', () => {
  withSeeded((g) => {
    const reader = tuningReader(g, 'k1', () => {});
    // Known keys read first, so the throws below are the unknown-key rule, not an
    // unbuilt accessor.
    assert.equal(reader.num('bar.support_min'), 3);
    assert.ok(reader.list('lexicon.completion_claim').length > 0);
    assert.throws(() => reader.num('bar.no_such_key'));
    assert.throws(() => reader.list('lexicon.no_such_list'));
  });
});

// ---- T-12-3 ----

type Expect = 'ok' | 'refused';

/** Each case: [key, value, expected, keys the refusal's reason must name]. */
const CASES: Array<[string, string, Expect, string[]]> = [
  // bar.confidence_floor <= bar.suspect_confidence_cap < bar.high_confidence_min
  ['bar.suspect_confidence_cap', '0.6', 'ok', []], // = floor
  ['bar.suspect_confidence_cap', '0.59', 'refused', ['bar.confidence_floor', 'bar.suspect_confidence_cap']],
  ['bar.suspect_confidence_cap', '0.8', 'refused', ['bar.suspect_confidence_cap', 'bar.high_confidence_min']], // = high
  ['bar.suspect_confidence_cap', '0.79', 'ok', []],
  // bar.confidence_floor <= bar.heuristic_confidence_cap < bar.high_confidence_min ("likewise")
  ['bar.heuristic_confidence_cap', '0.6', 'ok', []],
  ['bar.heuristic_confidence_cap', '0.59', 'refused', ['bar.confidence_floor', 'bar.heuristic_confidence_cap']],
  ['bar.heuristic_confidence_cap', '0.8', 'refused', ['bar.heuristic_confidence_cap', 'bar.high_confidence_min']],
  ['bar.heuristic_confidence_cap', '0.79', 'ok', []],
  // bar.untrusted_trust_factor in (0, 1]; tier invariant trust × stale >= high
  ['bar.untrusted_trust_factor', '0', 'refused', ['bar.untrusted_trust_factor']], // interval
  ['bar.untrusted_trust_factor', '0.0001', 'refused', ['bar.untrusted_trust_factor', 'bar.stale_factor', 'bar.high_confidence_min']], // 0.0001 × 0.9 < 0.8
  ['bar.untrusted_trust_factor', '0.889', 'ok', []], // 0.8001
  ['bar.untrusted_trust_factor', '0.888', 'refused', ['bar.untrusted_trust_factor', 'bar.stale_factor', 'bar.high_confidence_min']], // 0.7992
  ['bar.untrusted_trust_factor', '1', 'ok', []],
  ['bar.untrusted_trust_factor', '1.0001', 'refused', ['bar.untrusted_trust_factor']], // interval
  // bar.stale_factor in (0, 1]; tier invariant
  ['bar.stale_factor', '0', 'refused', ['bar.stale_factor']],
  ['bar.stale_factor', '1.0001', 'refused', ['bar.stale_factor']],
  ['bar.stale_factor', '0.888', 'refused', ['bar.untrusted_trust_factor', 'bar.stale_factor', 'bar.high_confidence_min']],
  ['bar.stale_factor', '0.9', 'ok', []],
  ['bar.stale_factor', '1', 'ok', []],
  // high 0.82: the tier invariant, 0.9 × 0.9 = 0.81 < 0.82
  ['bar.high_confidence_min', '0.82', 'refused', ['bar.untrusted_trust_factor', 'bar.stale_factor', 'bar.high_confidence_min']],
  // floor 0.71: above both caps
  ['bar.confidence_floor', '0.71', 'refused', ['bar.confidence_floor', 'bar.suspect_confidence_cap', 'bar.heuristic_confidence_cap']],
  // high 0.7: at the caps
  ['bar.high_confidence_min', '0.7', 'refused', ['bar.high_confidence_min', 'bar.suspect_confidence_cap', 'bar.heuristic_confidence_cap']],
  // bar.recency_half_life_days >= 37
  ['bar.recency_half_life_days', '37', 'ok', []],
  ['bar.recency_half_life_days', '36', 'refused', ['bar.recency_half_life_days']],
  ['bar.recency_half_life_days', '0', 'refused', ['bar.recency_half_life_days']],
];

for (const [key, value, expected, mustName] of CASES) {
  test(`T-12-3: checkTuningWrite(${key} = ${value}) is ${expected}`, () => {
    withSeeded((g) => {
      const reader = tuningReader(g, 'k1', () => {});
      const r = checkTuningWrite(reader, key, value);
      if (expected === 'ok') {
        assert.deepEqual(r, { ok: true });
      } else {
        assert.ok('refused' in r, `expected a refusal, got ${JSON.stringify(r)}`);
        for (const k of mustName) {
          assert.ok(r.refused.includes(k), `the reason must name ${k}: ${r.refused}`);
        }
      }
    });
  });
}

test('T-12-3: tuningWriteNotice names `ctxoracle index` for the half-life and is null for bar.support_min', () => {
  const notice = tuningWriteNotice('bar.recency_half_life_days');
  assert.notEqual(notice, null);
  assert.match(notice ?? '', /ctxoracle index/);
  assert.equal(tuningWriteNotice('bar.support_min'), null);
});

// ---- Added by the 2026-09-26 independent build review. Each case is a sentence
// of Step 12's build delta that T-12-2/T-12-3 above did not pin.

test('T-12-2e (review): a list key with no member at either level is re-seeded with its seed source, onMissing once, seed members returned', () => {
  // "A key with neither is re-seeded from `tuning_seeds.ts` (the seed row written with its seed `source`),
  //  `onMissing(key)` is called once for it, and the seed value is returned" — list keys included.
  withSeeded((g) => {
    const seeded = (g.prepare("SELECT value, source FROM tuning WHERE key = 'lexicon.completion_claim' AND project_key IS NULL ORDER BY rowid").all() as {
      value: string;
      source: string;
    }[]).map((r) => ({ ...r }));
    assert.ok(seeded.length > 0, 'precondition: the seed wrote members');
    g.prepare("DELETE FROM tuning WHERE key = 'lexicon.completion_claim'").run();
    const missing: string[] = [];
    const reader = tuningReader(g, 'k1', (k) => missing.push(k));
    assert.deepEqual(reader.list('lexicon.completion_claim'), seeded.map((r) => r.value));
    assert.deepEqual(reader.list('lexicon.completion_claim'), seeded.map((r) => r.value), 'a second read');
    assert.deepEqual(missing, ['lexicon.completion_claim'], 'onMissing called exactly once with that key');
    const rewritten = (g.prepare("SELECT value, source FROM tuning WHERE key = 'lexicon.completion_claim' AND project_key IS NULL ORDER BY rowid").all() as {
      value: string;
      source: string;
    }[]).map((r) => ({ ...r }));
    assert.deepEqual(rewritten, seeded, 'the members are re-written with the seed source');
  });
});

test("T-12-2f (review): values are cached for the reader's lifetime; a new reader sees a later write", () => {
  // "values are cached for the reader's lifetime (one event, or one verb run)"
  withSeeded((g) => {
    const reader = tuningReader(g, 'k1', () => {});
    assert.equal(reader.num('bar.confidence_floor'), 0.6);
    g.prepare("UPDATE tuning SET value = '0.65' WHERE key = 'bar.confidence_floor' AND project_key IS NULL").run();
    assert.equal(reader.num('bar.confidence_floor'), 0.6, 'the same reader keeps the value it read');
    assert.equal(tuningReader(g, 'k1', () => {}).num('bar.confidence_floor'), 0.65, 'a new reader reads the new value');
  });
});

test('T-12-2g (review): num(key) throws on a value that is not a finite number', () => {
  // "`num(key)` parses a finite number or throws"
  withSeeded((g) => {
    g.prepare("UPDATE tuning SET value = 'abc' WHERE key = 'bar.support_min' AND project_key IS NULL").run();
    assert.throws(() => tuningReader(g, 'k1', () => {}).num('bar.support_min'));
    g.prepare("UPDATE tuning SET value = 'Infinity' WHERE key = 'bar.support_min' AND project_key IS NULL").run();
    assert.throws(() => tuningReader(g, 'k1', () => {}).num('bar.support_min'));
  });
});

test('T-12-3b (review): the tier invariant admits equality — untrusted_trust_factor 1 × stale_factor 0.8 = high_confidence_min 0.8 is ok', () => {
  // "`bar.untrusted_trust_factor × bar.stale_factor ≥ bar.high_confidence_min`"
  withSeeded((g) => {
    g.prepare("UPDATE tuning SET value = '1' WHERE key = 'bar.untrusted_trust_factor' AND project_key IS NULL").run();
    const reader = tuningReader(g, 'k1', () => {});
    assert.deepEqual(checkTuningWrite(reader, 'bar.stale_factor', '0.8'), { ok: true });
    assert.ok('refused' in checkTuningWrite(reader, 'bar.stale_factor', '0.79'), '0.79 < 0.8 is refused');
  });
});

// ---- Added for the fixes that follow the Steps 1–12 build review
// (docs/reviews/2026-09-26-steps-1-12-build-review.md M3), written from plan
// Step 12 as amended by commit ca67af7: "It also refuses a key that has no seed
// in `tuning_seeds` (a typo would otherwise write a row nothing reads) and, for
// a key whose seed is numeric, a value that is not a finite number (`num()`
// throws on one, so `tune bar.support_min abc` would make every event fail open
// silently). Otherwise the plain-language reason names the violated relation
// and every value in it."

test('T-12-3c (review M3): checkTuningWrite refuses a key with no seed in tuning_seeds, naming the key', () => {
  withSeeded((g) => {
    const reader = tuningReader(g, 'k1', () => {});
    const r = checkTuningWrite(reader, 'bar.suport_min', '3'); // a typo of bar.support_min
    assert.ok('refused' in r, `an unknown key must be refused, got ${JSON.stringify(r)}`);
    assert.ok(r.refused.includes('bar.suport_min'), `the reason names the key: ${r.refused}`);
  });
});

test('T-12-3d (review M3): checkTuningWrite refuses a non-finite value for a key whose seed is numeric (bar.support_min)', () => {
  withSeeded((g) => {
    const reader = tuningReader(g, 'k1', () => {});
    assert.equal(reader.num('bar.support_min'), 3, 'precondition: the seed is numeric');
    for (const value of ['abc', 'Infinity', '', '3 apples']) {
      const r = checkTuningWrite(reader, 'bar.support_min', value);
      assert.ok('refused' in r, `bar.support_min = ${JSON.stringify(value)} must be refused, got ${JSON.stringify(r)}`);
      assert.ok(r.refused.includes('bar.support_min'), `the reason names the key: ${r.refused}`);
      assert.ok(r.refused.includes(value), `the reason names the value ${JSON.stringify(value)}: ${r.refused}`);
    }
  });
});

test('T-12-3e (review M3): checkTuningWrite accepts a finite numeric value for a numeric seed outside the ordering relations', () => {
  withSeeded((g) => {
    const reader = tuningReader(g, 'k1', () => {});
    assert.deepEqual(checkTuningWrite(reader, 'bar.support_min', '5'), { ok: true });
    assert.deepEqual(checkTuningWrite(reader, 'bar.support_min', '2.5'), { ok: true });
  });
});
