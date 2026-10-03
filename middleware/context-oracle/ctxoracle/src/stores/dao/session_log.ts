// session_log DAO (Step 9; reopened 2026-09-26 build delta, N16). The per-event
// diagnostic log. ULID id; the engine assigns `seq` (INTEGER PRIMARY KEY — the
// former caller-supplied `Date.now()` collided within one millisecond), and
// `append` returns both. `livenessRows` feeds AD-17's hooks-firing detector (its exact
// consumer shape is finalized at Step 10/33).
import type { Store } from '../adapter.js';
import { ulid } from '../../util/ulid.js';

export interface SessionEventInput {
  session: string;
  consumer: string;
  event_type: string;
  ts: number;
  latency_ms?: number | null;
  candidates_json?: string | null;
  outcome?: string | null;
  detail_json?: string | null;
}

export interface SessionLogRecord extends SessionEventInput {
  seq: number;
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
  /** Append one row; returns its ULID and its engine-assigned `seq`. */
  append(row: SessionEventInput): { id: string; seq: number };
  forSession(session: string): SessionLogRecord[];
  lastEventTs(session: string): number | undefined;
  livenessRows(open?: boolean): LivenessRow[];
  /** The session of the largest-seq row, its first row's ts, and its newest row's ts (AD-18; collapse-hunt H5). */
  latestSession(): { session: string; startedTs: number; lastTs: number } | null;
  /** Whether the session has a `SessionEnd` row. */
  hasEnded(session: string): boolean;
}

export function sessionLogDao(store: Store): SessionLogDao {
  return {
    append(row) {
      const id = ulid(row.ts);
      const r = store
        .prepare(
          `INSERT INTO session_log(id, session, consumer, event_type, ts,
             latency_ms, candidates_json, outcome, detail_json)
           VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
           RETURNING seq`
        )
        .get(
          id,
          row.session,
          row.consumer,
          row.event_type,
          row.ts,
          row.latency_ms ?? null,
          row.candidates_json ?? null,
          row.outcome ?? null,
          row.detail_json ?? null
        ) as { seq: number };
      return { id, seq: r.seq };
    },
    forSession(session) {
      return store
        .prepare('SELECT * FROM session_log WHERE session = ? ORDER BY seq')
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
    latestSession() {
      const row = store
        .prepare(
          `SELECT l.session AS session,
             (SELECT ts FROM session_log WHERE session = l.session ORDER BY seq ASC LIMIT 1) AS startedTs,
             l.ts AS lastTs
           FROM session_log l ORDER BY l.seq DESC LIMIT 1`
        )
        .get() as { session: string; startedTs: number; lastTs: number } | undefined;
      return row === undefined ? null : { session: row.session, startedTs: row.startedTs, lastTs: row.lastTs };
    },
    hasEnded(session) {
      return (
        store.prepare("SELECT 1 AS n FROM session_log WHERE session = ? AND event_type = 'SessionEnd' LIMIT 1").get(session) !==
        undefined
      );
    },
  };
}
