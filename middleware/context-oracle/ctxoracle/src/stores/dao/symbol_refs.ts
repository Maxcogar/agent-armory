// symbol_refs DAO (Step 9). Per-source-file counts of references to a symbol,
// replaced per source file. No provenance block (structural).
import type { Store } from '../adapter.js';

export interface SymbolRefInput {
  symbolId: number;
  refCount: number;
}

export interface SymbolRefsDao {
  replaceForFile(srcFileId: number, rows: SymbolRefInput[]): void;
  refCount(symbolId: number): number;
}

export function symbolRefsDao(store: Store): SymbolRefsDao {
  return {
    replaceForFile(srcFileId, rows) {
      store.transaction(() => {
        store.prepare('DELETE FROM symbol_refs WHERE src_file = ?').run(srcFileId);
        const ins = store.prepare('INSERT INTO symbol_refs(symbol_id, src_file, ref_count) VALUES(?, ?, ?)');
        for (const r of rows) ins.run(r.symbolId, srcFileId, r.refCount);
      });
    },
    refCount(symbolId) {
      const row = store
        .prepare('SELECT COALESCE(SUM(ref_count), 0) AS n FROM symbol_refs WHERE symbol_id = ?')
        .get(symbolId) as { n: number };
      return row.n;
    },
  };
}
