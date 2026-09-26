// symbol_tokens DAO (Step 9 build delta, AD-2). AD-2's normalized symbol tokens
// for the FTS fallback: one row per distinct token of a symbol's name (a symbol
// row cascades its tokens away on its own delete). The indexer (Step 14) writes
// them in both FTS states.
import type { Store } from '../adapter.js';

export interface SymbolTokensDao {
  /** Delete the file's symbols' token rows, then insert one row per distinct token of each given symbol. */
  replaceForFile(fileId: number, rows: { symbolId: number; tokens: string[] }[]): void;
}

export function symbolTokensDao(store: Store): SymbolTokensDao {
  return {
    replaceForFile(fileId, rows) {
      store.transaction(() => {
        store
          .prepare('DELETE FROM symbol_tokens WHERE symbol_id IN (SELECT id FROM symbols WHERE file_id = ?)')
          .run(fileId);
        const ins = store.prepare('INSERT INTO symbol_tokens(token, symbol_id) VALUES(?, ?)');
        for (const r of rows) for (const t of new Set(r.tokens)) ins.run(t, r.symbolId);
      });
    },
  };
}
