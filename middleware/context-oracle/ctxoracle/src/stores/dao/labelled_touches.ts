// labelled_touches DAO (Step 9 build delta, G5, AD-4). One row per (file,
// commit, label): a revert- or fix-labelled commit's touch of a file. The miner
// (Step 13) records every labelled touch and rebuilds the miner landmines from
// this table on each pass, so an incremental pass can recount earlier labelled
// commits (the executed defect: two fix_chatter rows, support 4 and 3, for one
// file). No provenance block (a history index, like commits).
import type { Store } from '../adapter.js';

export type TouchLabel = 'revert' | 'fix';

export interface LabelledTouchesDao {
  /** Record one labelled touch; a repeat is a no-op (`ON CONFLICT DO NOTHING`). */
  add(fileId: number, hash: string, label: TouchLabel, ts: number): void;
  /** Touches with `ts >= sinceTs`, grouped by file: distinct hashes (in ts order) and their count. */
  touchesSince(label: TouchLabel, sinceTs: number): { fileId: number; hashes: string[]; count: number }[];
  deleteAll(): void;
}

export function labelledTouchesDao(store: Store): LabelledTouchesDao {
  return {
    add(fileId, hash, label, ts) {
      store
        .prepare(
          `INSERT INTO labelled_touches(file_id, commit_hash, label, ts) VALUES(?, ?, ?, ?)
           ON CONFLICT DO NOTHING`
        )
        .run(fileId, hash, label, ts);
    },
    touchesSince(label, sinceTs) {
      const rows = store
        .prepare(
          `SELECT file_id, commit_hash FROM labelled_touches
           WHERE label = ? AND ts >= ? ORDER BY file_id, ts, commit_hash`
        )
        .all(label, sinceTs) as { file_id: number; commit_hash: string }[];
      const byFile = new Map<number, string[]>();
      for (const r of rows) {
        const hashes = byFile.get(r.file_id);
        if (hashes === undefined) byFile.set(r.file_id, [r.commit_hash]);
        else if (!hashes.includes(r.commit_hash)) hashes.push(r.commit_hash);
      }
      return [...byFile.entries()].map(([fileId, hashes]) => ({ fileId, hashes, count: hashes.length }));
    },
    deleteAll() {
      store.prepare('DELETE FROM labelled_touches').run();
    },
  };
}
