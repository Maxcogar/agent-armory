// cochange_pairs DAO (Step 9). File-pair co-change counts (a < b enforced by
// the DB CHECK). `bump` records one co-change of the pair; the miner (Step 13)
// owns the mining semantics that call it. No provenance block.
import type { Store } from '../adapter.js';

export interface CochangePairRecord {
  a: number;
  b: number;
  pair_count: number;
  pair_weight: number;
  last_ts: number;
  last_commit: string;
}

export interface CochangePartner {
  partnerId: number;
  pairCount: number;
  pairWeight: number;
  lastTs: number;
  lastCommit: string;
}

export interface CochangePairsDao {
  /**
   * Count one commit for the pair: `pair_count + 1`, `pair_weight + weight`
   * (AD-13's recency weight of that commit), and, when `ts >= last_ts`,
   * `last_ts = ts` and `last_commit = hash` (no per-file counters — G3).
   */
  bump(a: number, b: number, ts: number, hash: string, weight: number): void;
  /** The pairs containing `fileId`, read from both `a = x` and `b = x`. */
  partnersOf(fileId: number): CochangePartner[];
  pair(a: number, b: number): CochangePairRecord | undefined;
  deleteAll(): void;
}

/** Normalize a file-id pair to the (low, high) order the CHECK(a < b) requires. */
function order(a: number, b: number): [number, number] {
  return a < b ? [a, b] : [b, a];
}

export function cochangePairsDao(store: Store): CochangePairsDao {
  return {
    bump(a, b, ts, hash, weight) {
      const [lo, hi] = order(a, b);
      store
        .prepare(
          `INSERT INTO cochange_pairs(a, b, pair_count, pair_weight, last_ts, last_commit)
           VALUES(?, ?, 1, ?, ?, ?)
           ON CONFLICT(a, b) DO UPDATE SET
             pair_count = pair_count + 1,
             pair_weight = pair_weight + excluded.pair_weight,
             last_commit = CASE WHEN excluded.last_ts >= last_ts THEN excluded.last_commit ELSE last_commit END,
             last_ts = max(last_ts, excluded.last_ts)`
        )
        .run(lo, hi, weight, ts, hash);
    },
    partnersOf(fileId) {
      const rows = store
        .prepare(
          `SELECT a, b, pair_count, pair_weight, last_ts, last_commit FROM cochange_pairs
           WHERE a = ? OR b = ? ORDER BY pair_count DESC, last_ts DESC, a, b`
        )
        .all(fileId, fileId) as CochangePairRecord[];
      return rows.map((r) => ({
        partnerId: r.a === fileId ? r.b : r.a,
        pairCount: r.pair_count,
        pairWeight: r.pair_weight,
        lastTs: r.last_ts,
        lastCommit: r.last_commit,
      }));
    },
    pair(a, b) {
      const [lo, hi] = order(a, b);
      return store
        .prepare('SELECT a, b, pair_count, pair_weight, last_ts, last_commit FROM cochange_pairs WHERE a = ? AND b = ?')
        .get(lo, hi) as CochangePairRecord | undefined;
    },
    deleteAll() {
      store.prepare('DELETE FROM cochange_pairs').run();
    },
  };
}
