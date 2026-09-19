// corrections DAO (Step 9). Owner corrections of a whisper or a deny (the
// whisper/deny exclusive-or is a DB CHECK). ULID id; no provenance block.
import type { Store } from '../adapter.js';
import { ulid } from '../../util/ulid.js';

export type CorrectionVerdict = 'false_fire' | 'missed' | 'confirm';

export interface CorrectionCreate {
  whisperId?: string | null;
  denyId?: string | null;
  verdict: CorrectionVerdict;
  note?: string | null;
  ts: number;
}

export interface CorrectionRecord {
  id: string;
  whisper_id: string | null;
  deny_id: string | null;
  verdict: string;
  note: string | null;
  ts: number;
}

export interface CorrectionsDao {
  create(row: CorrectionCreate): string;
  sinceTs(ts: number): CorrectionRecord[];
  forDeny(id: string): CorrectionRecord[];
  forWhisper(id: string): CorrectionRecord[];
}

export function correctionsDao(store: Store): CorrectionsDao {
  return {
    create(row) {
      const id = ulid();
      store
        .prepare('INSERT INTO corrections(id, whisper_id, deny_id, verdict, note, ts) VALUES(?, ?, ?, ?, ?, ?)')
        .run(id, row.whisperId ?? null, row.denyId ?? null, row.verdict, row.note ?? null, row.ts);
      return id;
    },
    sinceTs(ts) {
      return store.prepare('SELECT * FROM corrections WHERE ts >= ? ORDER BY ts, id').all(ts) as CorrectionRecord[];
    },
    forDeny(id) {
      return store.prepare('SELECT * FROM corrections WHERE deny_id = ? ORDER BY ts, id').all(id) as CorrectionRecord[];
    },
    forWhisper(id) {
      return store.prepare('SELECT * FROM corrections WHERE whisper_id = ? ORDER BY ts, id').all(id) as CorrectionRecord[];
    },
  };
}
