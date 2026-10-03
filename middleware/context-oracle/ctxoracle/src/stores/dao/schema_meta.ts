// schema_meta DAO (Step 9). Key/value metadata for the project store.
import type { Store } from '../adapter.js';

export interface SchemaMetaDao {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
}

export function schemaMetaDao(store: Store): SchemaMetaDao {
  return {
    get(key) {
      const row = store.prepare('SELECT value FROM schema_meta WHERE key = ?').get(key) as
        | { value: string | null }
        | undefined;
      return row === undefined || row.value === null ? undefined : row.value;
    },
    set(key, value) {
      store.prepare('INSERT OR REPLACE INTO schema_meta(key, value) VALUES(?, ?)').run(key, value);
    },
    delete(key) {
      store.prepare('DELETE FROM schema_meta WHERE key = ?').run(key);
    },
  };
}
