// lessons DAO (Step 9, AD-5). Global durable lessons. ULID id; provenance
// required (a knowledge table).
import type { Store } from '../adapter.js';
import { provCreateValues, type Provenance } from '../../security/trust.js';
import { ulid } from '../../util/ulid.js';

export interface LessonCreate {
  statement: string;
  evidenceJson?: string | null;
  prov: Provenance;
}

export interface LessonRecord {
  id: string;
  statement: string;
  evidence_json: string | null;
  prov_kind: string;
  prov_ref: string;
  trust: string;
  injection_suspect: number;
  created_at: number;
  updated_at: number;
}

export interface LessonsDao {
  create(row: LessonCreate): string;
  all(): LessonRecord[];
}

export function lessonsDao(store: Store): LessonsDao {
  return {
    create(row) {
      const now = Date.now();
      const prov = provCreateValues(row.prov, now, now);
      const id = ulid(now);
      store
        .prepare(
          `INSERT INTO lessons(id, statement, evidence_json, prov_kind, prov_ref, trust,
             injection_suspect, created_at, updated_at)
           VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(id, row.statement, row.evidenceJson ?? null, ...prov);
      return id;
    },
    all() {
      return store.prepare('SELECT * FROM lessons ORDER BY id').all() as LessonRecord[];
    },
  };
}
