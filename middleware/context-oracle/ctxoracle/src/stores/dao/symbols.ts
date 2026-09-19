// symbols DAO (Step 9). Symbols are replaced per file (the indexer re-parses a
// whole file). Provenance required at the type level and validated at runtime.
import type { Store } from '../adapter.js';
import { provCreateValues, type Provenance } from '../../security/trust.js';

export interface SymbolInput {
  name: string;
  kind: string;
  spanStart: number;
  spanEnd: number;
}

export interface SymbolRecord {
  id: number;
  file_id: number;
  name: string;
  kind: string;
  span_start: number;
  span_end: number;
  prov_kind: string;
  prov_ref: string;
  trust: string;
  injection_suspect: number;
  created_at: number;
  updated_at: number;
}

export interface SymbolsDao {
  replaceForFile(fileId: number, rows: SymbolInput[], prov: Provenance): void;
  byName(name: string, kind?: string): SymbolRecord[];
  byId(id: number): SymbolRecord | undefined;
}

export function symbolsDao(store: Store): SymbolsDao {
  return {
    replaceForFile(fileId, rows, prov) {
      const now = Date.now();
      const p = provCreateValues(prov, now, now);
      store.transaction(() => {
        store.prepare('DELETE FROM symbols WHERE file_id = ?').run(fileId);
        const ins = store.prepare(
          `INSERT INTO symbols(file_id, name, kind, span_start, span_end,
             prov_kind, prov_ref, trust, injection_suspect, created_at, updated_at)
           VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );
        for (const s of rows) ins.run(fileId, s.name, s.kind, s.spanStart, s.spanEnd, ...p);
      });
    },
    byName(name, kind) {
      if (kind === undefined) {
        return store.prepare('SELECT * FROM symbols WHERE name = ? ORDER BY id').all(name) as SymbolRecord[];
      }
      return store
        .prepare('SELECT * FROM symbols WHERE name = ? AND kind = ? ORDER BY id')
        .all(name, kind) as SymbolRecord[];
    },
    byId(id) {
      return store.prepare('SELECT * FROM symbols WHERE id = ?').get(id) as SymbolRecord | undefined;
    },
  };
}
