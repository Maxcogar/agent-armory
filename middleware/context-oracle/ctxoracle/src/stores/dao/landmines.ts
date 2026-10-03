// landmines DAO (Step 9; reopened 2026-09-26 build delta, G5/N5). Hazard markers
// on files. ULID id; provenance required. The miner kinds are keyed
// `(kind, file_id)` by the partial unique index `landmines_miner_key` and written
// only by `rebuildMinerKinds` (the former `upsert`, keyed on evidence, produced
// one row per mining pass); human_stated rows are written only by `createHuman`.
import type { Store } from '../adapter.js';
import { provCreateValues, type Provenance } from '../../security/trust.js';
import { ulid } from '../../util/ulid.js';

export type LandmineKind = 'revert_chain' | 'fix_chatter' | 'human_stated';

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

/** One miner-kind row; the miner key is `(kind, file_id)` (`landmines_miner_key`). */
export interface MinerLandmineRow {
  kind: 'revert_chain' | 'fix_chatter';
  fileId: number;
  evidence: string;
  support?: number | null;
  prov: Provenance;
}

/** The `human_stated` writer's row (`note --kind landmine`, Step 35). */
export interface HumanLandmineCreate {
  fileId: number;
  evidence: string;
  support?: number | null;
  prov: Provenance;
}

export interface LandminesDao {
  /** The file's landmines, human rows first (AC-23), then by id. */
  forFile(fileId: number): LandmineRecord[];
  /**
   * Delete every revert_chain/fix_chatter row and insert `rows` (one per
   * `(kind, file_id)`), atomically — inside the caller's transaction when there
   * is one. Never touches a human_stated row.
   */
  rebuildMinerKinds(rows: MinerLandmineRow[]): void;
  /** Delete every revert_chain/fix_chatter row (a full re-mine, AD-13). */
  deleteMinerKinds(): void;
  /** Write one human_stated row; returns its ULID. Human provenance only. */
  createHuman(row: HumanLandmineCreate): string;
}

export function landminesDao(store: Store): LandminesDao {
  const insert = (id: string, kind: LandmineKind, fileId: number, evidence: string, support: number | null, prov: Provenance, now: number): void => {
    store
      .prepare(
        `INSERT INTO landmines(id, kind, file_id, evidence, support,
           prov_kind, prov_ref, trust, injection_suspect, created_at, updated_at)
         VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(id, kind, fileId, evidence, support, ...provCreateValues(prov, now, now));
  };
  return {
    forFile(fileId) {
      return store
        .prepare("SELECT * FROM landmines WHERE file_id = ? ORDER BY (kind = 'human_stated') DESC, id")
        .all(fileId) as LandmineRecord[];
    },
    rebuildMinerKinds(rows) {
      const now = Date.now();
      store.transaction(() => {
        store.prepare("DELETE FROM landmines WHERE kind IN ('revert_chain','fix_chatter')").run();
        for (const r of rows) insert(ulid(now), r.kind, r.fileId, r.evidence, r.support ?? null, r.prov, now);
      });
    },
    deleteMinerKinds() {
      store.prepare("DELETE FROM landmines WHERE kind IN ('revert_chain','fix_chatter')").run();
    },
    createHuman(row) {
      // A human_stated row is the owner's statement; any other provenance would
      // relabel repo-derived text as owner-stated (FR-X4).
      if (row.prov.prov_kind !== 'human') {
        throw new Error(`landmines.createHuman: human_stated requires human provenance, not ${JSON.stringify(row.prov.prov_kind)} (FR-X4)`);
      }
      const now = Date.now();
      const id = ulid(now);
      insert(id, 'human_stated', row.fileId, row.evidence, row.support ?? null, row.prov, now);
      return id;
    },
  };
}
