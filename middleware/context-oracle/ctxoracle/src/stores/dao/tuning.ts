// tuning DAO + default seeding (Step 12, AD-5, AD-20). Scalar keys are one row
// (project_key NULL); list keys are one row per member. `seedDefaults` is
// idempotent — it seeds only a key that is entirely absent, so an owner `tune`
// edit (a changed scalar, an added/removed list member) is never reset by a
// later re-seed.
import type { Store } from '../adapter.js';
import type { TuningReader } from '../../types/candidate.js';
import { LIST_SEEDS, SCALAR_SEEDS, type ListSeed, type ScalarSeed, type TuningSource } from './tuning_seeds.js';

export type { TuningSource } from './tuning_seeds.js';

export const tuning = {
  /**
   * The scalar value for `key`: the row with `project_key = projectKey` when one
   * is given and exists, else the project-global (NULL) row; null when neither.
   */
  get(store: Store, key: string, projectKey?: string): string | null {
    if (projectKey !== undefined) {
      const own = store
        .prepare('SELECT value FROM tuning WHERE key = ? AND project_key = ? ORDER BY rowid LIMIT 1')
        .get(key, projectKey) as { value: string } | undefined;
      if (own !== undefined) return own.value;
    }
    const row = store
      .prepare('SELECT value FROM tuning WHERE key = ? AND project_key IS NULL ORDER BY rowid LIMIT 1')
      .get(key) as { value: string } | undefined;
    return row === undefined ? null : row.value;
  },

  /** Set the scalar `key` to `value` with `source` (replaces the existing row). */
  set(store: Store, key: string, value: string, source: TuningSource): void {
    store.transaction(() => {
      store.prepare('DELETE FROM tuning WHERE key = ? AND project_key IS NULL').run(key);
      store
        .prepare('INSERT INTO tuning(key, project_key, value, source, updated_at) VALUES(?, NULL, ?, ?, ?)')
        .run(key, value, source, Date.now());
    });
  },

  /** All member values for a list `key`, in insertion order. */
  list(store: Store, key: string): string[] {
    return (
      store
        .prepare('SELECT value FROM tuning WHERE key = ? AND project_key IS NULL ORDER BY rowid')
        .all(key) as { value: string }[]
    ).map((r) => r.value);
  },

  /** Add `value` to a list `key` if not already present. */
  addToList(store: Store, key: string, value: string, source: TuningSource): void {
    store.transaction(() => {
      const exists = store
        .prepare('SELECT 1 AS n FROM tuning WHERE key = ? AND project_key IS NULL AND value = ?')
        .get(key, value);
      if (exists === undefined) {
        store
          .prepare('INSERT INTO tuning(key, project_key, value, source, updated_at) VALUES(?, NULL, ?, ?, ?)')
          .run(key, value, source, Date.now());
      }
    });
  },

  /** Remove `value` from a list `key`. */
  removeFromList(store: Store, key: string, value: string): void {
    store.prepare('DELETE FROM tuning WHERE key = ? AND project_key IS NULL AND value = ?').run(key, value);
  },
};

/** Seed every default that is entirely absent from the store (idempotent). */
export function seedDefaults(store: Store): void {
  for (const s of SCALAR_SEEDS) {
    if (tuning.get(store, s.key) === null) tuning.set(store, s.key, s.value, s.source);
  }
  for (const l of LIST_SEEDS) {
    if (tuning.list(store, l.key).length === 0) {
      for (const v of l.values) tuning.addToList(store, l.key, v, l.source);
    }
  }
}

const SCALAR_BY_KEY = new Map<string, ScalarSeed>(SCALAR_SEEDS.map((x) => [x.key, x]));
const LIST_BY_KEY = new Map<string, ListSeed>(LIST_SEEDS.map((x) => [x.key, x]));

/** A finite number, or throw naming the key (an unparsable tunable is a bug, not a default). */
function parseNum(key: string, v: string): number {
  const n = v.trim() === '' ? NaN : Number(v);
  if (!Number.isFinite(n)) throw new Error(`tuning: ${key} = ${JSON.stringify(v)} is not a finite number`);
  return n;
}

/**
 * The concrete `TuningReader` (Step 12 build delta; G8, G17), bound to the
 * global store and one project. Resolution per key: the row with
 * `project_key = projectKey`, else the `project_key IS NULL` row; for a list key,
 * the member rows of whichever level has any. A key with neither is re-seeded
 * from `tuning_seeds.ts` (written with its seed `source`), `onMissing(key)` is
 * called once for it, and the seed value is returned. A key that is not in the
 * seed module throws (a typo is a bug, not a tunable). Values are cached for
 * the reader's lifetime (one event, or one verb run). No consumer carries a
 * fallback literal.
 */
export function tuningReader(global: Store, projectKey: string, onMissing: (key: string) => void): TuningReader {
  const scalars = new Map<string, string>();
  const lists = new Map<string, string[]>();

  function str(key: string): string {
    const cached = scalars.get(key);
    if (cached !== undefined) return cached;
    const seed = SCALAR_BY_KEY.get(key);
    if (seed === undefined) throw new Error(`tuning: unknown scalar key ${JSON.stringify(key)} (not in tuning_seeds)`);
    let v = tuning.get(global, key, projectKey);
    if (v === null) {
      tuning.set(global, key, seed.value, seed.source);
      onMissing(key);
      v = seed.value;
    }
    scalars.set(key, v);
    return v;
  }

  function list(key: string): string[] {
    const cached = lists.get(key);
    if (cached !== undefined) return [...cached];
    const seed = LIST_BY_KEY.get(key);
    if (seed === undefined) throw new Error(`tuning: unknown list key ${JSON.stringify(key)} (not in tuning_seeds)`);
    let members = (
      global
        .prepare('SELECT value FROM tuning WHERE key = ? AND project_key = ? ORDER BY rowid')
        .all(key, projectKey) as { value: string }[]
    ).map((r) => r.value);
    if (members.length === 0) members = tuning.list(global, key);
    if (members.length === 0) {
      global.transaction(() => {
        for (const m of seed.values) tuning.addToList(global, key, m, seed.source);
      });
      onMissing(key);
      members = [...seed.values];
    }
    lists.set(key, members);
    return [...members];
  }

  return {
    num: (key) => parseNum(key, str(key)),
    str,
    list,
  };
}

/** A candidate numeric value for `key`: the one being written, else the reader's. */
function valueOf(reader: TuningReader, key: string, value: string, k: string): number {
  return k === key ? parseNum(k, value) : reader.num(k);
}

const RELATION_KEYS = new Set([
  'bar.confidence_floor',
  'bar.suspect_confidence_cap',
  'bar.heuristic_confidence_cap',
  'bar.high_confidence_min',
  'bar.untrusted_trust_factor',
  'bar.stale_factor',
  'bar.recency_half_life_days',
]);

/** Whether `v` parses as a finite number (the rule `parseNum`, and so `num()`, applies). */
function isFiniteNumber(v: string): boolean {
  return v.trim() !== '' && Number.isFinite(Number(v));
}

/**
 * AD-14's ordering and tier invariants and the half-life guard, checked where
 * `tune` writes (Step 12 build delta; AD-14, AD-20; collapse-hunt H2). After the
 * write of `key = value`, all of these must hold:
 *   bar.confidence_floor <= bar.suspect_confidence_cap < bar.high_confidence_min
 *   bar.confidence_floor <= bar.heuristic_confidence_cap < bar.high_confidence_min
 *   bar.untrusted_trust_factor in (0, 1];  bar.stale_factor in (0, 1]
 *   bar.untrusted_trust_factor x bar.stale_factor >= bar.high_confidence_min
 *     (a fact with perfect evidence must reach the high tier under every
 *     dampener at once, or a dampener becomes a universal cap)
 *   bar.recency_half_life_days >= 37 (AD-13's weight 2^((ts-T0)/h) stays finite
 *     with headroom for commits dated up to 2100: h >= 36.5 days)
 * Otherwise the plain-language reason names each violated relation and every
 * value in it (AD-20).
 *
 * Before those relations (Steps 1-12 build review M3; OWASP ASVS V5, validate
 * against the expected type before persisting): a key with no seed in
 * `tuning_seeds` is refused (a typo would write a row nothing reads, and the
 * reader throws on it), and so is a value that is not a finite number for a
 * key whose seed is numeric (`num()` throws on one, so every event reading the
 * key would fail open). A seeded key outside the relations is otherwise not
 * constrained here.
 */
export function checkTuningWrite(reader: TuningReader, key: string, value: string): { ok: true } | { refused: string } {
  const scalarSeed = SCALAR_BY_KEY.get(key);
  if (scalarSeed === undefined && !LIST_BY_KEY.has(key)) {
    return { refused: `refused: ${key} is not a tunable setting (it has no default in tuning_seeds), so nothing would read it` };
  }
  const numericSeed = scalarSeed !== undefined && isFiniteNumber(scalarSeed.value);
  if (numericSeed && !isFiniteNumber(value)) {
    return { refused: `refused: ${key} must be a number; ${JSON.stringify(value)} is not one` };
  }
  if (!RELATION_KEYS.has(key)) return { ok: true };
  const v = (k: string): number => valueOf(reader, key, value, k);
  const floor = v('bar.confidence_floor');
  const suspect = v('bar.suspect_confidence_cap');
  const heuristic = v('bar.heuristic_confidence_cap');
  const high = v('bar.high_confidence_min');
  const trust = v('bar.untrusted_trust_factor');
  const stale = v('bar.stale_factor');
  const halfLife = v('bar.recency_half_life_days');

  const violated: string[] = [];
  if (!(floor <= suspect && suspect < high)) {
    violated.push(
      `bar.confidence_floor (${floor}) <= bar.suspect_confidence_cap (${suspect}) < bar.high_confidence_min (${high}) must hold`
    );
  }
  if (!(floor <= heuristic && heuristic < high)) {
    violated.push(
      `bar.confidence_floor (${floor}) <= bar.heuristic_confidence_cap (${heuristic}) < bar.high_confidence_min (${high}) must hold`
    );
  }
  if (!(trust > 0 && trust <= 1)) {
    violated.push(`bar.untrusted_trust_factor (${trust}) must be greater than 0 and at most 1`);
  }
  if (!(stale > 0 && stale <= 1)) {
    violated.push(`bar.stale_factor (${stale}) must be greater than 0 and at most 1`);
  }
  if (!(trust * stale >= high)) {
    violated.push(
      `bar.untrusted_trust_factor (${trust}) x bar.stale_factor (${stale}) = ${trust * stale} must be at least ` +
        `bar.high_confidence_min (${high}), or a fact with perfect evidence could never reach the high tier`
    );
  }
  if (!(halfLife >= 37)) {
    violated.push(
      `bar.recency_half_life_days (${halfLife}) must be at least 37, or the co-change weights overflow for commits dated up to 2100`
    );
  }
  if (violated.length === 0) return { ok: true };
  return { refused: `refused: setting ${key} to ${value} breaks: ${violated.join('; ')}` };
}

/**
 * The plain-language line `tune` prints after an accepted write whose effect
 * needs more than the write; null for every other key (AD-13: "Changing h
 * requires a re-mine, which tune states").
 */
export function tuningWriteNotice(key: string): string | null {
  if (key === 'bar.recency_half_life_days') {
    return "the stored co-change weights were mined under the old half-life; the next ctxoracle index re-mines this repository's history under the new one";
  }
  return null;
}
