// session_log DAO (Step 9). The per-event diagnostic log. ULID id; append
// returns it. `livenessRows` feeds AD-17's hooks-firing detector (its exact
// consumer shape is finalized at Step 10/33).
import type { Store } from '../adapter.js';
import { ulid } from '../../util/ulid.js';

export interface SessionEventInput {
  session: string;
  consumer: string;
  seq: number;
  event_type: string;
  ts: number;
  latency_ms?: number | null;
  candidates_json?: string | null;
  outcome?: string | null;
  detail_json?: string | null;
}

export interface SessionLogRecord extends SessionEventInput {
  id: string;
  latency_ms: number | null;
  candidates_json: string | null;
  outcome: string | null;
  detail_json: string | null;
}

export interface LivenessRow {
  session: string;
  last_ts: number;
  last_event: string;
}

export interface SessionLogDao {
  append(row: SessionEventInput): string;
  forSession(session: string): SessionLogRecord[];
  lastEventTs(session: string): number | undefined;
  livenessRows(open?: boolean): LivenessRow[];
}

export function sessionLogDao(store: Store): SessionLogDao {
  return {
    append(row) {
      const id = ulid(row.ts);
      store
        .prepare(
          `INSERT INTO session_log(id, session, consumer, seq, event_type, ts,
             latency_ms, candidates_json, outcome, detail_json)
           VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          id,
          row.session,
          row.consumer,
          row.seq,
          row.event_type,
          row.ts,
          row.latency_ms ?? null,
          row.candidates_json ?? null,
          row.outcome ?? null,
          row.detail_json ?? null
        );
      return id;
    },
    forSession(session) {
      return store
        .prepare('SELECT * FROM session_log WHERE session = ? ORDER BY seq, id')
        .all(session) as SessionLogRecord[];
    },
    lastEventTs(session) {
      const row = store.prepare('SELECT max(ts) AS ts FROM session_log WHERE session = ?').get(session) as
        | { ts: number | null }
        | undefined;
      return row === undefined || row.ts === null ? undefined : row.ts;
    },
    livenessRows(open = true) {
      // Latest event per session; when `open`, only sessions whose latest event
      // is not a SessionEnd (still-firing sessions).
      const rows = store
        .prepare(
          `SELECT s.session AS session, s.ts AS last_ts, s.event_type AS last_event
           FROM session_log s
           JOIN (SELECT session, max(ts) AS mts FROM session_log GROUP BY session) m
             ON m.session = s.session AND m.mts = s.ts
           GROUP BY s.session
           ORDER BY s.session`
        )
        .all() as LivenessRow[];
      return open ? rows.filter((r) => r.last_event !== 'SessionEnd') : rows;
    },
  };
}
