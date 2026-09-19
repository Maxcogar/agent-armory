// import_edges DAO (Step 9). Directed file->file import edges, replaced per
// source file. No provenance block (a structural, non-knowledge table).
import type { Store } from '../adapter.js';

export interface ImportEdgeInput {
  dstFile: number;
  kind: string;
}

export interface ImportEdgesDao {
  replaceForFile(srcFileId: number, edges: ImportEdgeInput[]): void;
  inDegree(fileId: number): number;
  importersOf(fileId: number): number[];
}

export function importEdgesDao(store: Store): ImportEdgesDao {
  return {
    replaceForFile(srcFileId, edges) {
      store.transaction(() => {
        store.prepare('DELETE FROM import_edges WHERE src_file = ?').run(srcFileId);
        const ins = store.prepare('INSERT INTO import_edges(src_file, dst_file, kind) VALUES(?, ?, ?)');
        for (const e of edges) ins.run(srcFileId, e.dstFile, e.kind);
      });
    },
    inDegree(fileId) {
      const row = store
        .prepare('SELECT count(*) AS n FROM import_edges WHERE dst_file = ?')
        .get(fileId) as { n: number };
      return row.n;
    },
    importersOf(fileId) {
      return (
        store.prepare('SELECT DISTINCT src_file FROM import_edges WHERE dst_file = ? ORDER BY src_file').all(fileId) as {
          src_file: number;
        }[]
      ).map((r) => r.src_file);
    },
  };
}
