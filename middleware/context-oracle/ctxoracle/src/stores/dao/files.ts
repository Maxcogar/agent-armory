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
  /** The path's injection flag is `prov.injection_suspect` (AD-4, AD-19). */
  prov: Provenance;
  /** 1 for a file the index walk lists; 0 for a history-only row (AD-4). */
  in_tree: 0 | 1;
}

export interface FileRecord {
  id: number;
  path: string;
  lang: string;
  zone: Zone;
  zone_evidence: string | null;
  zone_evidence_suspect: number;
  entry_score: number;
  in_tree: number;
  change_count: number;
  change_weight: number;
  unresolved_imports: number;
  content_hash: string | null;
  mtime: number | null;
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
  all(): FileRecord[];
  /** Insert-if-absent a history-only row (in_tree 0, lang/zone 'unknown', NULL hash/mtime, commit/untrusted_repo, prov_ref = commitHash); returns its id; never changes an existing row. */
  ensureHistoryRow(path: string, injectionSuspect: boolean, commitHash: string): number;
  /** Set in_tree = 0 on every in_tree = 1 row whose id is not listed; returns those ids (ascending). */
  markAbsentExcept(listedPresentIds: number[]): number[];
  /** Delete in_tree = 0 rows with change_count = 0 that no history-derived row references; returns the count. */
  sweepUnreferenced(): number;
  /** Add `n` to change_count and `weight` to change_weight. */
  addChangeCount(id: number, n: number, weight: number): void;
  /** Set change_count and change_weight to 0 on every row (the purge set, AD-13). */
  resetChangeCounts(): void;
  setUnresolvedImports(id: number, n: number): void;
  /** An assignment that writes only when the value differs (N4). */
  setEntryScore(id: number, score: number): void;
}

export function filesDao(store: Store): FilesDao {
  return {
    upsert(row) {
      const now = Date.now();
      const prov = provCreateValues(row.prov, now, now);
      const r = store
        .prepare(
          `INSERT INTO files(path, lang, zone, zone_evidence, zone_evidence_suspect, entry_score,
             in_tree, content_hash, mtime, prov_kind, prov_ref, trust, injection_suspect,
             created_at, updated_at)
           VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(path) DO UPDATE SET
             lang = excluded.lang, zone = excluded.zone, zone_evidence = excluded.zone_evidence,
             zone_evidence_suspect = excluded.zone_evidence_suspect, entry_score = excluded.entry_score,
             in_tree = excluded.in_tree, content_hash = excluded.content_hash, mtime = excluded.mtime,
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
          row.in_tree,
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
    all() {
      return store.prepare('SELECT * FROM files ORDER BY id').all() as FileRecord[];
    },
    ensureHistoryRow(path, injectionSuspect, commitHash) {
      return store.transaction(() => {
        const existing = store.prepare('SELECT id FROM files WHERE path = ?').get(path) as { id: number } | undefined;
        if (existing !== undefined) return existing.id;
        const now = Date.now();
        // The row is history-derived: provenance commit / untrusted_repo (FR-X4).
        // prov_ref is the commit that first named the path: a `commit`
        // provenance references a commit (Steps 1-12 build review m1).
        const prov = provCreateValues(
          { prov_kind: 'commit', prov_ref: commitHash, trust: 'untrusted_repo', injection_suspect: injectionSuspect },
          now,
          now
        );
        const r = store
          .prepare(
            `INSERT INTO files(path, lang, zone, in_tree, content_hash, mtime,
               prov_kind, prov_ref, trust, injection_suspect, created_at, updated_at)
             VALUES(?, 'unknown', 'unknown', 0, NULL, NULL, ?, ?, ?, ?, ?, ?)
             RETURNING id`
          )
          .get(path, ...prov) as { id: number };
        return r.id;
      });
    },
    markAbsentExcept(listedPresentIds) {
      // json_each keeps the id list a single bound parameter, so a large tree
      // never meets SQLite's host-parameter limit.
      const rows = store
        .prepare(
          `UPDATE files SET in_tree = 0, updated_at = ?
           WHERE in_tree = 1 AND id NOT IN (SELECT value FROM json_each(?))
           RETURNING id`
        )
        .all(Date.now(), JSON.stringify(listedPresentIds)) as { id: number }[];
      return rows.map((r) => r.id).sort((a, b) => a - b);
    },
    sweepUnreferenced() {
      const r = store
        .prepare(
          `DELETE FROM files
           WHERE in_tree = 0 AND change_count = 0
             AND NOT EXISTS (SELECT 1 FROM cochange_pairs p WHERE p.a = files.id OR p.b = files.id)
             AND NOT EXISTS (SELECT 1 FROM landmines l WHERE l.file_id = files.id)
             AND NOT EXISTS (SELECT 1 FROM labelled_touches t WHERE t.file_id = files.id)
             AND NOT EXISTS (SELECT 1 FROM invariant_members m WHERE m.file_id = files.id)`
        )
        .run();
      return Number(r.changes);
    },
    addChangeCount(id, n, weight) {
      store
        .prepare('UPDATE files SET change_count = change_count + ?, change_weight = change_weight + ? WHERE id = ?')
        .run(n, weight, id);
    },
    resetChangeCounts() {
      store.prepare('UPDATE files SET change_count = 0, change_weight = 0').run();
    },
    setUnresolvedImports(id, n) {
      store.prepare('UPDATE files SET unresolved_imports = ? WHERE id = ?').run(n, id);
    },
    setEntryScore(id, score) {
      store.prepare('UPDATE files SET entry_score = ? WHERE id = ? AND entry_score <> ?').run(score, id, score);
    },
  };
}
