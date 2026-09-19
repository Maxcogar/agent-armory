// human_facts DAO (Step 9). Facts the owner stated about a target. ULID id;
// provenance required (these are the canonical human-provenance records).
import type { Store } from '../adapter.js';
import { provCreateValues, type Provenance } from '../../security/trust.js';
import { ulid } from '../../util/ulid.js';

export interface HumanFactCreate {
  statement: string;
  targetKind: string;
  targetRef: string;
  statedAt: number;
  prov: Provenance;
}

export interface HumanFactRecord {
  id: string;
  statement: string;
  target_kind: string;
  target_ref: string;
  stated_at: number;
  prov_kind: string;
  prov_ref: string;
  trust: string;
  injection_suspect: number;
  created_at: number;
  updated_at: number;
}

export interface HumanFactsDao {
  create(row: HumanFactCreate): string;
  forTarget(kind: string, ref: string): HumanFactRecord[];
}

export function humanFactsDao(store: Store): HumanFactsDao {
  return {
    create(row) {
      const now = Date.now();
      const prov = provCreateValues(row.prov, now, now);
      const id = ulid(now);
      store
        .prepare(
          `INSERT INTO human_facts(id, statement, target_kind, target_ref, stated_at,
             prov_kind, prov_ref, trust, injection_suspect, created_at, updated_at)
           VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(id, row.statement, row.targetKind, row.targetRef, row.statedAt, ...prov);
      return id;
    },
    forTarget(kind, ref) {
      return store
        .prepare('SELECT * FROM human_facts WHERE target_kind = ? AND target_ref = ? ORDER BY id')
        .all(kind, ref) as HumanFactRecord[];
    },
  };
}
