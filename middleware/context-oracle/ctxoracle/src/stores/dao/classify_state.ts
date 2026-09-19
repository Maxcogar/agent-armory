// classify_state DAO (Step 9). Per-consumer transcript bookmark for catch-up.
import type { Store } from '../adapter.js';

export interface ClassifyState {
  bookmark_offset: number;
  bookmark_uuid: string | null;
  updated_at: number;
}

export interface ClassifyStateDao {
  get(consumer: string): ClassifyState | undefined;
  set(consumer: string, offset: number, uuid: string | null): void;
}

export function classifyStateDao(store: Store): ClassifyStateDao {
  return {
    get(consumer) {
      return store
        .prepare('SELECT bookmark_offset, bookmark_uuid, updated_at FROM classify_state WHERE consumer = ?')
        .get(consumer) as ClassifyState | undefined;
    },
    set(consumer, offset, uuid) {
      store
        .prepare(
          `INSERT INTO classify_state(consumer, bookmark_offset, bookmark_uuid, updated_at)
           VALUES(?, ?, ?, ?)
           ON CONFLICT(consumer) DO UPDATE SET
             bookmark_offset = excluded.bookmark_offset, bookmark_uuid = excluded.bookmark_uuid,
             updated_at = excluded.updated_at`
        )
        .run(consumer, offset, uuid, Date.now());
    },
  };
}
