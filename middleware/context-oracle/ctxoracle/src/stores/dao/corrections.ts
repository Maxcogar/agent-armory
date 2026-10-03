// corrections DAO (Step 9; reopened 2026-09-26 build delta, AD-4/AD-5, N11).
// Owner corrections of a whisper or a deny, or a whisper-less `missed` report
// attributed by `genre` (the CHECKs are the DB's). ULID id; the engine assigns
// `seq` (an explicit INTEGER PRIMARY KEY), which the fold's watermark reads —
// never the wall-clock `ts`. Append-only (AD-4): no update or delete method.
import type { Store } from '../adapter.js';
import { ulid } from '../../util/ulid.js';

export type CorrectionVerdict = 'false_fire' | 'missed' | 'confirm';

export interface CorrectionCreate {
  whisperId?: string | null;
  denyId?: string | null;
  verdict: CorrectionVerdict;
  /** A whisper-less, deny-less `missed` row's genre (the --genre value, or 'answer_drift'). */
  genre?: string | null;
  note?: string | null;
  ts: number;
}

export interface CorrectionRecord {
  seq: number;
  id: string;
  whisper_id: string | null;
  deny_id: string | null;
  verdict: string;
  genre: string | null;
  note: string | null;
  ts: number;
}

export interface CorrectionsDao {
  /** Append one row; returns its ULID (the engine assigns `seq`). */
  create(row: CorrectionCreate): string;
  /** Rows with `seq > sinceSeq`, in `seq` order. */
  since(sinceSeq: number): CorrectionRecord[];
  /** The largest `seq`, or 0 on an empty table. */
  maxSeq(): number;
  forDeny(id: string): CorrectionRecord[];
  forWhisper(id: string): CorrectionRecord[];
}

export function correctionsDao(store: Store): CorrectionsDao {
  return {
    create(row) {
      const id = ulid();
      store
        .prepare('INSERT INTO corrections(id, whisper_id, deny_id, verdict, genre, note, ts) VALUES(?, ?, ?, ?, ?, ?, ?)')
        .run(id, row.whisperId ?? null, row.denyId ?? null, row.verdict, row.genre ?? null, row.note ?? null, row.ts);
      return id;
    },
    since(sinceSeq) {
      return store.prepare('SELECT * FROM corrections WHERE seq > ? ORDER BY seq').all(sinceSeq) as CorrectionRecord[];
    },
    maxSeq() {
      return (store.prepare('SELECT coalesce(max(seq), 0) AS m FROM corrections').get() as { m: number }).m;
    },
    forDeny(id) {
      return store.prepare('SELECT * FROM corrections WHERE deny_id = ? ORDER BY seq').all(id) as CorrectionRecord[];
    },
    forWhisper(id) {
      return store.prepare('SELECT * FROM corrections WHERE whisper_id = ? ORDER BY seq').all(id) as CorrectionRecord[];
    },
  };
}
