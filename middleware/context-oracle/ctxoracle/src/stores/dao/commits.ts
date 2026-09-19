// commits DAO (Step 9). The mined commit index (no provenance block).
import type { Store } from '../adapter.js';

export interface CommitUpsert {
  hash: string;
  ts: number;
  entityCount: number;
  excluded?: boolean;
  excludeReason?: string | null;
}

export interface CommitsDao {
  upsert(row: CommitUpsert): void;
  exists(hash: string): boolean;
  tsOf(hash: string): number | undefined;
  countIncluded(): number;
}

export function commitsDao(store: Store): CommitsDao {
  return {
    upsert(row) {
      store
        .prepare(
          `INSERT INTO commits(hash, ts, entity_count, excluded, exclude_reason)
           VALUES(?, ?, ?, ?, ?)
           ON CONFLICT(hash) DO UPDATE SET
             ts = excluded.ts, entity_count = excluded.entity_count,
             excluded = excluded.excluded, exclude_reason = excluded.exclude_reason`
        )
        .run(row.hash, row.ts, row.entityCount, row.excluded === true ? 1 : 0, row.excludeReason ?? null);
    },
    exists(hash) {
      return store.prepare('SELECT 1 AS n FROM commits WHERE hash = ?').get(hash) !== undefined;
    },
    tsOf(hash) {
      const row = store.prepare('SELECT ts FROM commits WHERE hash = ?').get(hash) as { ts: number } | undefined;
      return row?.ts;
    },
    countIncluded() {
      const row = store.prepare('SELECT count(*) AS n FROM commits WHERE excluded = 0').get() as { n: number };
      return row.n;
    },
  };
}
