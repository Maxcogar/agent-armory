// landmines DAO (Step 9). Hazard markers on files. ULID id; provenance required.
// `upsert` dedups on (kind, file_id, evidence): re-mining the same landmine
// updates its support rather than creating a duplicate (no natural unique key
// besides the ULID, so the dedup is done in code).
import type { Store } from '../adapter.js';
import { provCreateValues, type Provenance } from '../../security/trust.js';
import { ulid } from '../../util/ulid.js';

export type LandmineKind = 'revert_chain' | 'fix_chatter' | 'human_stated';

export interface LandmineUpsert {
  kind: LandmineKind;
  fileId: number;
  evidence: string;
  support?: number | null;
  prov: Provenance;
}

export interface LandmineRecord {
  id: string;
  kind: string;
  file_id: number;
  evidence: string;
  support: number | null;
  prov_kind: string;
  prov_ref: string;
  trust: string;
  injection_suspect: number;
  created_at: number;
  updated_at: number;
}

export interface LandminesDao {
  upsert(row: LandmineUpsert): string;
  forFile(fileId: number): LandmineRecord[];
}

export function landminesDao(store: Store): LandminesDao {
  return {
    upsert(row) {
      const now = Date.now();
      return store.transaction(() => {
        const existing = store
          .prepare('SELECT id FROM landmines WHERE kind = ? AND file_id = ? AND evidence = ?')
          .get(row.kind, row.fileId, row.evidence) as { id: string } | undefined;
        provCreateValues(row.prov, now, now); // validate provenance (FR-X4)
        if (existing !== undefined) {
          store
            .prepare(
              `UPDATE landmines SET support = ?, prov_kind = ?, prov_ref = ?, trust = ?,
                 injection_suspect = ?, updated_at = ? WHERE id = ?`
            )
            .run(
              row.support ?? null,
              row.prov.prov_kind,
              row.prov.prov_ref,
              row.prov.trust,
              row.prov.injection_suspect === true ? 1 : 0,
              now,
              existing.id
            );
          return existing.id;
        }
        const id = ulid(now);
        const prov = provCreateValues(row.prov, now, now);
        store
          .prepare(
            `INSERT INTO landmines(id, kind, file_id, evidence, support,
               prov_kind, prov_ref, trust, injection_suspect, created_at, updated_at)
             VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .run(id, row.kind, row.fileId, row.evidence, row.support ?? null, ...prov);
        return id;
      });
    },
    forFile(fileId) {
      return store
        .prepare('SELECT * FROM landmines WHERE file_id = ? ORDER BY id')
        .all(fileId) as LandmineRecord[];
    },
  };
}
