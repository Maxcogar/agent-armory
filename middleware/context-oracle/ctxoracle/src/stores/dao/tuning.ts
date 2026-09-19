// tuning DAO + default seeding (Step 12, AD-5, AD-20). Scalar keys are one row
// (project_key NULL); list keys are one row per member. `seedDefaults` is
// idempotent — it seeds only a key that is entirely absent, so an owner `tune`
// edit (a changed scalar, an added/removed list member) is never reset by a
// later re-seed.
import type { Store } from '../adapter.js';
import { LIST_SEEDS, SCALAR_SEEDS, type TuningSource } from './tuning_seeds.js';

export type { TuningSource } from './tuning_seeds.js';

export const tuning = {
  /** The scalar value for `key` (project-global row), or null. */
  get(store: Store, key: string): string | null {
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
