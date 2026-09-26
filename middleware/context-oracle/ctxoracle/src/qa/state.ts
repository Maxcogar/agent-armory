// QA state (Step 22, AD-9, D-plan-27): the read interface Phase B's writer keeps.
// WALKING SKELETON. Rows are keyed by consumer only (see G23).
import type { Store } from '../stores/adapter.js';
import { questionsDao, type QuestionRecord } from '../stores/dao/questions.js';
import { classifyStateDao } from '../stores/dao/classify_state.js';
import { recordFault } from '../diag/fault_writer.js';

export type Question = QuestionRecord;

export function openQuestion(
  store: Store,
  q: { consumer: string; questionText: string; contentHash: string; askedUuid?: string; askedOffset?: number }
): string | 'already_open' {
  try {
    return questionsDao(store).insertOpen(q);
  } catch (e) {
    if (String((e as Error).message).includes('UNIQUE')) return 'already_open';
    throw e;
  }
}

/** The Phase B seam: this signature does not change. */
export function getOpenQuestions(store: Store, consumer: string): Question[] {
  return questionsDao(store).openFor(consumer);
}

export function answerQuestions(
  store: Store,
  consumer: string,
  closedByUuid: string,
  closedByKind: 'generic_text_all_prior',
  clearingOffset: number,
  clearingTs: number
): number {
  const r = store
    .prepare(
      `UPDATE questions SET status = 'answered', closed_by_uuid = ?, closed_by_kind = ?, closed_at = ?
        WHERE consumer = ? AND status = 'open'
          AND ((asked_offset IS NOT NULL AND asked_offset < ?) OR (asked_offset IS NULL AND opened_at <= ?))`
    )
    .run(closedByUuid, closedByKind, Date.now(), consumer, clearingOffset, clearingTs);
  return Number(r.changes);
}

export function voidQuestion(store: Store, id: string, diagnosticsDir: string, denyFired: boolean): void {
  questionsDao(store).setStatus(id, 'expired', 'intake_invalidated');
  recordFault(store, diagnosticsDir, { code: 'intake_invalidated', detail: { question: id, denyFired } });
}

export function expireOnStartup(store: Store, consumer: string): void {
  questionsDao(store).expireOpen(consumer);
}

export function advanceBookmark(store: Store, consumer: string, offset: number, uuid: string | null): void {
  classifyStateDao(store).set(consumer, offset, uuid);
}

export function getBookmark(store: Store, consumer: string): { offset: number; uuid: string | null } | null {
  const s = classifyStateDao(store).get(consumer);
  return s === undefined ? null : { offset: s.bookmark_offset, uuid: s.bookmark_uuid };
}
