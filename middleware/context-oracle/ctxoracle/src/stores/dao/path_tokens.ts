// path_tokens DAO (Step 9 build delta, AD-2, N6). The indexed token-prefix path
// search of the FTS fallback: one row per (token, file). The indexer (Step 14)
// writes the in-house tokens in both FTS states.
import type { Store } from '../adapter.js';

export interface PathTokensDao {
  /** Replace the file's token rows with one row per distinct token. */
  replaceForFile(fileId: number, tokens: string[]): void;
}

export function pathTokensDao(store: Store): PathTokensDao {
  return {
    replaceForFile(fileId, tokens) {
      store.transaction(() => {
        store.prepare('DELETE FROM path_tokens WHERE file_id = ?').run(fileId);
        const ins = store.prepare('INSERT INTO path_tokens(token, file_id) VALUES(?, ?)');
        for (const t of new Set(tokens)) ins.run(t, fileId);
      });
    },
  };
}
