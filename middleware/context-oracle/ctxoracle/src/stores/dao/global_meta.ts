// global_meta DAO (Step 9). Key/value metadata for the global store, including
// the per-project fold watermarks (keys `whisper_stats_watermark:<repo-key>`).
import type { Store } from '../adapter.js';

export interface GlobalMetaDao {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
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
  };
}
