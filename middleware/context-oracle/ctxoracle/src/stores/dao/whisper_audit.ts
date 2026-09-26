// whisper_audit DAO (Step 9, AD-8; reopened 2026-09-26 build delta, N11/AD-16).
// Every whisper/deny the oracle emits. ULID id; `append` returns it
// SYNCHRONOUSLY (the deny emitter and composer depend on audit-log-before-emit
// ordering). The engine assigns `seq`, which the fold's watermark reads. Each
// whisper row carries its `subject_key` (NULL on deny rows). Append-only (AD-4,
// FR-X6): no update or delete method.
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
  /** The whisper's dedup subject (AD-16); NULL on deny rows. */
  subject_key?: string | null;
}

export interface WhisperAuditRecord {
  seq: number;
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
  subject_key: string | null;
  continuation: number;
}

export interface WhisperAuditDao {
  append(row: WhisperAuditInput): string;
  forSession(session: string): WhisperAuditRecord[];
  denies(consumer: string, sinceTs: number): WhisperAuditRecord[];
  lastKinds(consumer: string, n: number): WhisperKind[];
  /** The distinct `subject_key` values of the session's whisper rows. */
  deliveredSubjects(session: string): string[];
  /** Rows with `seq > sinceSeq`, in `seq` order. */
  since(sinceSeq: number): WhisperAuditRecord[];
  /** The largest `seq`, or 0 on an empty table. */
  maxSeq(): number;
  /** The newest whisper row whose `text` equals `text` — its `subject_key` (the fork reseed, AD-16). */
  subjectKeyForText(text: string): string | null;
}

export function whisperAuditDao(store: Store): WhisperAuditDao {
  return {
    append(row) {
      const id = ulid(row.ts);
      store
        .prepare(
          `INSERT INTO whisper_audit(id, session, consumer, kind, genre, ts, text,
             evidence_json, confidence, channel, subject_key, continuation)
           VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
          row.subject_key ?? null,
          row.continuation === true ? 1 : 0
        );
      return id;
    },
    forSession(session) {
      return store
        .prepare('SELECT * FROM whisper_audit WHERE session = ? ORDER BY seq')
        .all(session) as WhisperAuditRecord[];
    },
    denies(consumer, sinceTs) {
      return store
        .prepare("SELECT * FROM whisper_audit WHERE consumer = ? AND kind = 'deny' AND ts >= ? ORDER BY seq")
        .all(consumer, sinceTs) as WhisperAuditRecord[];
    },
    lastKinds(consumer, n) {
      return (
        store
          .prepare('SELECT kind FROM whisper_audit WHERE consumer = ? ORDER BY seq DESC LIMIT ?')
          .all(consumer, n) as { kind: WhisperKind }[]
      ).map((r) => r.kind);
    },
    deliveredSubjects(session) {
      return (
        store
          .prepare(
            `SELECT DISTINCT subject_key FROM whisper_audit
             WHERE session = ? AND kind = 'whisper' AND subject_key IS NOT NULL ORDER BY subject_key`
          )
          .all(session) as { subject_key: string }[]
      ).map((r) => r.subject_key);
    },
    since(sinceSeq) {
      return store.prepare('SELECT * FROM whisper_audit WHERE seq > ? ORDER BY seq').all(sinceSeq) as WhisperAuditRecord[];
    },
    maxSeq() {
      return (store.prepare('SELECT coalesce(max(seq), 0) AS m FROM whisper_audit').get() as { m: number }).m;
    },
    subjectKeyForText(text) {
      const row = store
        .prepare("SELECT subject_key FROM whisper_audit WHERE kind = 'whisper' AND text = ? ORDER BY seq DESC LIMIT 1")
        .get(text) as { subject_key: string | null } | undefined;
      return row?.subject_key ?? null;
    },
  };
}
