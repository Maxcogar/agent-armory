// whisper_audit DAO (Step 9, AD-8). Every whisper/deny the oracle emits. ULID
// id; `append` returns it SYNCHRONOUSLY (the deny emitter and composer depend on
// audit-log-before-emit ordering). `deliveredSubjects`'s subject notion is
// finalized at Step 19's composer.
import type { Store } from '../adapter.js';
import { ulid } from '../../util/ulid.js';

export type WhisperKind = 'whisper' | 'deny';

export interface WhisperAuditInput {
  session: string;
  consumer: string;
  kind: WhisperKind;
  genre?: string | null;
  ts: number;
  text: string;
  evidence_json?: string | null;
  confidence?: number | null;
  channel?: string | null;
  continuation?: boolean;
}

export interface WhisperAuditRecord {
  id: string;
  session: string;
  consumer: string;
  kind: string;
  genre: string | null;
  ts: number;
  text: string;
  evidence_json: string | null;
  confidence: number | null;
  channel: string | null;
  continuation: number;
}

export interface WhisperAuditDao {
  append(row: WhisperAuditInput): string;
  forSession(session: string): WhisperAuditRecord[];
  denies(consumer: string, sinceTs: number): WhisperAuditRecord[];
  lastKinds(consumer: string, n: number): WhisperKind[];
  deliveredSubjects(session: string): string[];
}

export function whisperAuditDao(store: Store): WhisperAuditDao {
  return {
    append(row) {
      const id = ulid(row.ts);
      store
        .prepare(
          `INSERT INTO whisper_audit(id, session, consumer, kind, genre, ts, text,
             evidence_json, confidence, channel, continuation)
           VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          id,
          row.session,
          row.consumer,
          row.kind,
          row.genre ?? null,
          row.ts,
          row.text,
          row.evidence_json ?? null,
          row.confidence ?? null,
          row.channel ?? null,
          row.continuation === true ? 1 : 0
        );
      return id;
    },
    forSession(session) {
      return store
        .prepare('SELECT * FROM whisper_audit WHERE session = ? ORDER BY ts, id')
        .all(session) as WhisperAuditRecord[];
    },
    denies(consumer, sinceTs) {
      return store
        .prepare("SELECT * FROM whisper_audit WHERE consumer = ? AND kind = 'deny' AND ts >= ? ORDER BY ts, id")
        .all(consumer, sinceTs) as WhisperAuditRecord[];
    },
    lastKinds(consumer, n) {
      return (
        store
          .prepare('SELECT kind FROM whisper_audit WHERE consumer = ? ORDER BY ts DESC, id DESC LIMIT ?')
          .all(consumer, n) as { kind: WhisperKind }[]
      ).map((r) => r.kind);
    },
    deliveredSubjects(session) {
      return (
        store
          .prepare(
            "SELECT DISTINCT genre FROM whisper_audit WHERE session = ? AND kind = 'whisper' AND genre IS NOT NULL ORDER BY genre"
          )
          .all(session) as { genre: string }[]
      ).map((r) => r.genre);
    },
  };
}
