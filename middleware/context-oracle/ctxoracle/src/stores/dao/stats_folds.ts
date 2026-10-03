// stats_folds DAO (Step 9 build delta, AD-4/AD-5). The per-fold ledger in the
// project store: each SessionEnd fold appends one row per genre with the seq
// ranges it read, so an import, a purge, or a replaced store can neither strand
// nor double-count a row. Append-only: no update or delete method exists.
import type { Store } from '../adapter.js';

export interface StatsFoldRow {
  genre: string;
  sent: number;
  correctedFalse: number;
  correctedMissed: number;
  auditFrom: number;
  auditTo: number;
  correctionsFrom: number;
  correctionsTo: number;
  ts: number;
}

export interface StatsFoldRecord {
  seq: number;
  genre: string;
  sent: number;
  corrected_false: number;
  corrected_missed: number;
  audit_from: number;
  audit_to: number;
  corrections_from: number;
  corrections_to: number;
  ts: number;
}

export interface StatsFoldsDao {
  append(rows: StatsFoldRow[]): void;
  /** SUM per genre over every fold. */
  totals(): { genre: string; sent: number; correctedFalse: number; correctedMissed: number }[];
  /** Every fold row in seq order (the trend `status` renders). */
  all(): StatsFoldRecord[];
}

export function statsFoldsDao(store: Store): StatsFoldsDao {
  return {
    append(rows) {
      store.transaction(() => {
        const ins = store.prepare(
          `INSERT INTO stats_folds(genre, sent, corrected_false, corrected_missed,
             audit_from, audit_to, corrections_from, corrections_to, ts)
           VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );
        for (const r of rows) {
          ins.run(
            r.genre,
            r.sent,
            r.correctedFalse,
            r.correctedMissed,
            r.auditFrom,
            r.auditTo,
            r.correctionsFrom,
            r.correctionsTo,
            r.ts
          );
        }
      });
    },
    totals() {
      return store
        .prepare(
          `SELECT genre, sum(sent) AS sent, sum(corrected_false) AS correctedFalse,
             sum(corrected_missed) AS correctedMissed
           FROM stats_folds GROUP BY genre ORDER BY genre`
        )
        .all() as { genre: string; sent: number; correctedFalse: number; correctedMissed: number }[];
    },
    all() {
      return store.prepare('SELECT * FROM stats_folds ORDER BY seq').all() as StatsFoldRecord[];
    },
  };
}
