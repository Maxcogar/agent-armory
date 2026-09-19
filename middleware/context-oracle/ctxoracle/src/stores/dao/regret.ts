// regret DAO (Step 9, AD-18). Records a fact that would have helped but was held
// below the bar / deduped / never triggered. ULID id; read by status.
import type { Store } from '../adapter.js';
import { ulid } from '../../util/ulid.js';

export type RegretFactKind = 'cochange_pair' | 'landmine' | 'human_fact' | 'invariant';
export type RegretChurnKind = 're_edited' | 'reverted' | 'covering_test_failed';
export type RegretCandidateState = 'held_below_bar' | 'held_dedup' | 'never_triggered';

export interface RegretInput {
  session: string;
  factKind: RegretFactKind;
  factRef: string;
  churnKind: RegretChurnKind;
  candidateState: RegretCandidateState;
  ts: number;
}

export interface RegretRecord {
  id: string;
  session: string;
  fact_kind: string;
  fact_ref: string;
  churn_kind: string;
  candidate_state: string;
  ts: number;
}

export interface RegretDao {
  append(row: RegretInput): string;
  forSession(session: string): RegretRecord[];
  countsByState(): Record<RegretCandidateState, number>;
}

export function regretDao(store: Store): RegretDao {
  return {
    append(row) {
      const id = ulid(row.ts);
      store
        .prepare(
          `INSERT INTO regret(id, session, fact_kind, fact_ref, churn_kind, candidate_state, ts)
           VALUES(?, ?, ?, ?, ?, ?, ?)`
        )
        .run(id, row.session, row.factKind, row.factRef, row.churnKind, row.candidateState, row.ts);
      return id;
    },
    forSession(session) {
      return store.prepare('SELECT * FROM regret WHERE session = ? ORDER BY ts, id').all(session) as RegretRecord[];
    },
    countsByState() {
      const out: Record<RegretCandidateState, number> = {
        held_below_bar: 0,
        held_dedup: 0,
        never_triggered: 0,
      };
      for (const r of store
        .prepare('SELECT candidate_state, count(*) AS n FROM regret GROUP BY candidate_state')
        .all() as { candidate_state: RegretCandidateState; n: number }[]) {
        out[r.candidate_state] = r.n;
      }
      return out;
    },
  };
}
