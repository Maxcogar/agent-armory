// cochange_pairs DAO (Step 9). File-pair co-change counts (a < b enforced by
// the DB CHECK). `bump` records one co-change of the pair; the miner (Step 13)
// owns the mining semantics that call it. No provenance block.
import type { Store } from '../adapter.js';

export interface CochangePairRecord {
  a: number;
  b: number;
  pair_count: number;
  a_count: number;
  b_count: number;
  last_ts: number;
}

export interface CochangePartner {
  partner: number;
  pairCount: number;
  aCount: number;
  bCount: number;
  lastTs: number;
}

export interface CochangePairsDao {
  bump(a: number, b: number, ts: number): void;
  partnersOf(fileId: number): CochangePartner[];
  pair(a: number, b: number): CochangePairRecord | undefined;
}

/** Normalize a file-id pair to the (low, high) order the CHECK(a < b) requires. */
function order(a: number, b: number): [number, number] {
  return a < b ? [a, b] : [b, a];
}

export function cochangePairsDao(store: Store): CochangePairsDao {
  return {
    bump(a, b, ts) {
      const [lo, hi] = order(a, b);
      store
        .prepare(
          `INSERT INTO cochange_pairs(a, b, pair_count, a_count, b_count, last_ts)
           VALUES(?, ?, 1, 1, 1, ?)
           ON CONFLICT(a, b) DO UPDATE SET
             pair_count = pair_count + 1, a_count = a_count + 1, b_count = b_count + 1,
             last_ts = max(last_ts, excluded.last_ts)`
        )
        .run(lo, hi, ts);
    },
    partnersOf(fileId) {
      const rows = store
        .prepare(
          `SELECT a, b, pair_count, a_count, b_count, last_ts FROM cochange_pairs
           WHERE a = ? OR b = ? ORDER BY pair_count DESC, last_ts DESC`
        )
        .all(fileId, fileId) as CochangePairRecord[];
      return rows.map((r) => ({
        partner: r.a === fileId ? r.b : r.a,
        pairCount: r.pair_count,
        aCount: r.a_count,
        bCount: r.b_count,
        lastTs: r.last_ts,
      }));
    },
    pair(a, b) {
      const [lo, hi] = order(a, b);
      return store.prepare('SELECT a, b, pair_count, a_count, b_count, last_ts FROM cochange_pairs WHERE a = ? AND b = ?').get(lo, hi) as
        | CochangePairRecord
        | undefined;
    },
  };
}
