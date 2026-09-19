// consumer_state DAO (Step 9). Per-consumer 'delivered'/'read' subject markers
// (dedup of whispers across events).
import type { Store } from '../adapter.js';

export type ConsumerStateKind = 'delivered' | 'read';

export interface ConsumerStateDao {
  has(consumer: string, kind: ConsumerStateKind, key: string): boolean;
  add(consumer: string, kind: ConsumerStateKind, key: string): void;
  clear(consumer: string, kind: ConsumerStateKind): void;
}

export function consumerStateDao(store: Store): ConsumerStateDao {
  return {
    has(consumer, kind, key) {
      return (
        store
          .prepare('SELECT 1 AS n FROM consumer_state WHERE consumer = ? AND kind = ? AND subject_key = ?')
          .get(consumer, kind, key) !== undefined
      );
    },
    add(consumer, kind, key) {
      store
        .prepare(
          `INSERT INTO consumer_state(consumer, kind, subject_key, ts) VALUES(?, ?, ?, ?)
           ON CONFLICT(consumer, kind, subject_key) DO UPDATE SET ts = excluded.ts`
        )
        .run(consumer, kind, key, Date.now());
    },
    clear(consumer, kind) {
      store.prepare('DELETE FROM consumer_state WHERE consumer = ? AND kind = ?').run(consumer, kind);
    },
  };
}
