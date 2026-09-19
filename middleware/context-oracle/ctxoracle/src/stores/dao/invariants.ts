// invariants DAO (Step 9). An invariant plus its member file spans. ULID id;
// provenance required. In Phase A invariants are written only by the human
// channel (note); Orientation joins invariant_members for a binding invariant.
import type { Store } from '../adapter.js';
import { provCreateValues, type Provenance } from '../../security/trust.js';
import { ulid } from '../../util/ulid.js';

export interface InvariantMember {
  fileId: number;
  span?: string | null;
}

export interface InvariantCreate {
  description: string;
  prov: Provenance;
}

export interface InvariantRecord {
  id: string;
  description: string;
  prov_kind: string;
  prov_ref: string;
  trust: string;
  injection_suspect: number;
  created_at: number;
  updated_at: number;
}

export interface InvariantsDao {
  create(row: InvariantCreate, members: InvariantMember[]): string;
  forFile(fileId: number): InvariantRecord[];
}

export function invariantsDao(store: Store): InvariantsDao {
  return {
    create(row, members) {
      const now = Date.now();
      const prov = provCreateValues(row.prov, now, now);
      const id = ulid(now);
      store.transaction(() => {
        store
          .prepare(
            `INSERT INTO invariants(id, description, prov_kind, prov_ref, trust,
               injection_suspect, created_at, updated_at)
             VALUES(?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .run(id, row.description, ...prov);
        const ins = store.prepare(
          'INSERT INTO invariant_members(invariant_id, file_id, span) VALUES(?, ?, ?)'
        );
        for (const m of members) ins.run(id, m.fileId, m.span ?? null);
      });
      return id;
    },
    forFile(fileId) {
      return store
        .prepare(
          `SELECT i.* FROM invariants i
           JOIN invariant_members m ON m.invariant_id = i.id
           WHERE m.file_id = ? ORDER BY i.id`
        )
        .all(fileId) as InvariantRecord[];
    },
  };
}
