// files DAO (Step 9). Structural file records; provenance required at the type
// level (T-9-2) and validated at runtime (FR-X4).
import type { Store } from '../adapter.js';
import { provCreateValues, type Provenance } from '../../security/trust.js';

export type Zone = 'source' | 'generated' | 'vendored' | 'build_output' | 'unknown';

export interface FileUpsert {
  path: string;
  lang: string;
  zone: Zone;
  zoneEvidence?: string | null;
  zoneEvidenceSuspect?: boolean;
  entryScore?: number;
  contentHash: string;
  mtime: number;
  prov: Provenance;
}

export interface FileRecord {
  id: number;
  path: string;
  lang: string;
  zone: Zone;
  zone_evidence: string | null;
  zone_evidence_suspect: number;
  entry_score: number;
  content_hash: string;
  mtime: number;
  prov_kind: string;
  prov_ref: string;
  trust: string;
  injection_suspect: number;
  created_at: number;
  updated_at: number;
}

export interface FilesDao {
  upsert(row: FileUpsert): number;
  byPath(path: string): FileRecord | undefined;
  byId(id: number): FileRecord | undefined;
  deleteMissing(presentPaths: string[]): void;
  all(): FileRecord[];
}

export function filesDao(store: Store): FilesDao {
  return {
    upsert(row) {
      const now = Date.now();
      const prov = provCreateValues(row.prov, now, now);
      const r = store
        .prepare(
          `INSERT INTO files(path, lang, zone, zone_evidence, zone_evidence_suspect, entry_score,
             content_hash, mtime, prov_kind, prov_ref, trust, injection_suspect, created_at, updated_at)
           VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(path) DO UPDATE SET
             lang = excluded.lang, zone = excluded.zone, zone_evidence = excluded.zone_evidence,
             zone_evidence_suspect = excluded.zone_evidence_suspect, entry_score = excluded.entry_score,
             content_hash = excluded.content_hash, mtime = excluded.mtime,
             prov_kind = excluded.prov_kind, prov_ref = excluded.prov_ref, trust = excluded.trust,
             injection_suspect = excluded.injection_suspect, updated_at = excluded.updated_at
           RETURNING id`
        )
        .get(
          row.path,
          row.lang,
          row.zone,
          row.zoneEvidence ?? null,
          row.zoneEvidenceSuspect === true ? 1 : 0,
          row.entryScore ?? 0,
          row.contentHash,
          row.mtime,
          ...prov
        ) as { id: number };
      return r.id;
    },
    byPath(path) {
      return store.prepare('SELECT * FROM files WHERE path = ?').get(path) as FileRecord | undefined;
    },
    byId(id) {
      return store.prepare('SELECT * FROM files WHERE id = ?').get(id) as FileRecord | undefined;
    },
    deleteMissing(presentPaths) {
      if (presentPaths.length === 0) {
        store.exec('DELETE FROM files');
        return;
      }
      const placeholders = presentPaths.map(() => '?').join(', ');
      store.prepare(`DELETE FROM files WHERE path NOT IN (${placeholders})`).run(...presentPaths);
    },
    all() {
      return store.prepare('SELECT * FROM files ORDER BY id').all() as FileRecord[];
    },
  };
}
