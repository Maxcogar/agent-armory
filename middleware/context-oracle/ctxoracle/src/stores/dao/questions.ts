// questions DAO (Step 9). Outstanding-question lifecycle; the open-scoped dedup
// index (q_open_dedup) enforces one open question per (consumer, content_hash).
// ULID id. Composed by Step 22's seam module.
import type { Store } from '../adapter.js';
import { ulid } from '../../util/ulid.js';

export type QuestionStatus = 'open' | 'answered' | 'expired';
export type ClosedByKind = 'generic_text_all_prior' | 'expired' | 'intake_invalidated';

export interface QuestionInsert {
  consumer: string;
  questionText: string;
  contentHash: string;
  askedUuid?: string | null;
  askedOffset?: number | null;
}

export interface QuestionRecord {
  id: string;
  consumer: string;
  question_text: string;
  content_hash: string;
  asked_uuid: string | null;
  asked_offset: number | null;
  status: string;
  closed_by_uuid: string | null;
  closed_by_kind: string | null;
  opened_at: number;
  closed_at: number | null;
}

export interface QuestionsDao {
  insertOpen(row: QuestionInsert): string;
  openFor(consumer: string): QuestionRecord[];
  closeAll(consumer: string, uuid: string | null, kind: ClosedByKind): void;
  setStatus(id: string, status: QuestionStatus, kind: ClosedByKind | null): void;
  backfill(id: string, uuid: string, offset: number): void;
  expireOpen(consumer: string): void;
}

export function questionsDao(store: Store): QuestionsDao {
  return {
    insertOpen(row) {
      const now = Date.now();
      const id = ulid(now);
      store
        .prepare(
          `INSERT INTO questions(id, consumer, question_text, content_hash, asked_uuid, asked_offset,
             status, opened_at)
           VALUES(?, ?, ?, ?, ?, ?, 'open', ?)`
        )
        .run(id, row.consumer, row.questionText, row.contentHash, row.askedUuid ?? null, row.askedOffset ?? null, now);
      return id;
    },
    openFor(consumer) {
      return store
        .prepare("SELECT * FROM questions WHERE consumer = ? AND status = 'open' ORDER BY opened_at, id")
        .all(consumer) as QuestionRecord[];
    },
    closeAll(consumer, uuid, kind) {
      const status: QuestionStatus = kind === 'expired' ? 'expired' : 'answered';
      store
        .prepare(
          `UPDATE questions SET status = ?, closed_by_uuid = ?, closed_by_kind = ?, closed_at = ?
           WHERE consumer = ? AND status = 'open'`
        )
        .run(status, uuid, kind, Date.now(), consumer);
    },
    setStatus(id, status, kind) {
      store
        .prepare('UPDATE questions SET status = ?, closed_by_kind = ?, closed_at = ? WHERE id = ?')
        .run(status, kind, status === 'open' ? null : Date.now(), id);
    },
    backfill(id, uuid, offset) {
      store.prepare('UPDATE questions SET asked_uuid = ?, asked_offset = ? WHERE id = ?').run(uuid, offset, id);
    },
    expireOpen(consumer) {
      store
        .prepare(
          `UPDATE questions SET status = 'expired', closed_by_kind = 'expired', closed_at = ?
           WHERE consumer = ? AND status = 'open'`
        )
        .run(Date.now(), consumer);
    },
  };
}
