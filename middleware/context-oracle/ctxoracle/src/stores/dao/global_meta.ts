// global_meta DAO (Step 9). Key/value metadata for the global store: the schema
// version and the repository bindings (`repo_path:<realpath>` -> repo key,
// AD-20). It holds no fold watermark (AD-5 as revised 2026-09-26: the
// watermarks live in the project store's schema_meta).
import type { Store } from '../adapter.js';

export interface GlobalMetaDao {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
  /** Keys starting with `prefix`, sorted — the bindings (`status`, `deinit --purge`). */
  keysWithPrefix(prefix: string): string[];
}

export function globalMetaDao(store: Store): GlobalMetaDao {
  return {
    get(key) {
      const row = store.prepare('SELECT value FROM global_meta WHERE key = ?').get(key) as
        | { value: string | null }
        | undefined;
      return row === undefined || row.value === null ? undefined : row.value;
    },
    set(key, value) {
      store.prepare('INSERT OR REPLACE INTO global_meta(key, value) VALUES(?, ?)').run(key, value);
    },
    delete(key) {
      store.prepare('DELETE FROM global_meta WHERE key = ?').run(key);
    },
    keysWithPrefix(prefix) {
      // substr comparison, not LIKE: a prefix holding `%` or `_` stays literal.
      return (
        store
          .prepare('SELECT key FROM global_meta WHERE substr(key, 1, length(?)) = ? ORDER BY key')
          .all(prefix, prefix) as { key: string }[]
      ).map((r) => r.key);
    },
  };
}
