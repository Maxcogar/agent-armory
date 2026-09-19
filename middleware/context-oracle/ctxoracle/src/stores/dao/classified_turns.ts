// classified_turns DAO (Step 9, D-plan-27). The per-turn classification the
// deny-health detectors read across events. Keyed by (consumer, uuid); `record`
// upserts so a resume/fork/compact re-read updates rather than throws.
// `sinceQuestionOpened`'s exact consumer shape is finalized at Step 26.
import type { Store } from '../adapter.js';

export type ClassifiedReason = 'below_length_floor' | 'deferral_only';

export interface ClassifiedTurnRecord {
  consumer: string;
  uuid: string;
  ts: number;
  clears: number;
  reason: string | null;
}

export interface ClassifiedTurnsDao {
  record(consumer: string, uuid: string, ts: number, clears: boolean, reason: ClassifiedReason | null):
    | 'new'
    | 'updated';
  sinceQuestionOpened(consumer: string): ClassifiedTurnRecord[];
  between(consumer: string, fromTs: number, toTs: number): ClassifiedTurnRecord[];
}

export function classifiedTurnsDao(store: Store): ClassifiedTurnsDao {
  return {
    record(consumer, uuid, ts, clears, reason) {
      return store.transaction(() => {
        const existed =
          store
            .prepare('SELECT 1 AS n FROM classified_turns WHERE consumer = ? AND uuid = ?')
            .get(consumer, uuid) !== undefined;
        store
          .prepare(
            `INSERT INTO classified_turns(consumer, uuid, ts, clears, reason) VALUES(?, ?, ?, ?, ?)
             ON CONFLICT(consumer, uuid) DO UPDATE SET clears = excluded.clears, reason = excluded.reason`
          )
          .run(consumer, uuid, ts, clears ? 1 : 0, reason ?? null);
        return existed ? 'updated' : 'new';
      });
    },
    sinceQuestionOpened(consumer) {
      const q = store
        .prepare("SELECT max(opened_at) AS t FROM questions WHERE consumer = ? AND status = 'open'")
        .get(consumer) as { t: number | null } | undefined;
      if (q === undefined || q.t === null) return [];
      return store
        .prepare('SELECT * FROM classified_turns WHERE consumer = ? AND ts >= ? ORDER BY ts, uuid')
        .all(consumer, q.t) as ClassifiedTurnRecord[];
    },
    between(consumer, fromTs, toTs) {
      return store
        .prepare('SELECT * FROM classified_turns WHERE consumer = ? AND ts BETWEEN ? AND ? ORDER BY ts, uuid')
        .all(consumer, fromTs, toTs) as ClassifiedTurnRecord[];
    },
  };
}
