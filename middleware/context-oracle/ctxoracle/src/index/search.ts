// The one search interface (Step 14, AD-2, D-plan-28): FTS5 MATCH when the store's
// fts_state is 'fts5', indexed LIKE otherwise; same result shape either way.
import type { Store } from '../stores/adapter.js';
import { schemaMetaDao } from '../stores/dao/schema_meta.js';

export interface SymbolHit {
  name: string;
  kind: string;
  fileId: number;
}
export interface PathHit {
  path: string;
  fileId: number;
}

function ftsOn(store: Store): boolean {
  return schemaMetaDao(store).get('fts_state') === 'fts5';
}

/** Quote each term as an FTS5 string so user text cannot inject query syntax. */
function ftsQuery(terms: string[]): string {
  return terms.map((t) => `"${t.replace(/"/g, '""')}"`).join(' OR ');
}

export function symbolSearch(store: Store, terms: string[]): SymbolHit[] {
  const ts = terms.filter((t) => t.length > 0);
  if (ts.length === 0) return [];
  if (ftsOn(store)) {
    return (
      store.prepare('SELECT name, kind, file_id FROM fts_symbols WHERE fts_symbols MATCH ?').all(ftsQuery(ts)) as {
        name: string;
        kind: string;
        file_id: number;
      }[]
    ).map((r) => ({ name: r.name, kind: r.kind, fileId: Number(r.file_id) }));
  }
  const where = ts.map(() => 'name LIKE ?').join(' OR ');
  return (
    store.prepare(`SELECT name, kind, file_id FROM symbols WHERE ${where}`).all(...ts.map((t) => `${t}%`)) as {
      name: string;
      kind: string;
      file_id: number;
    }[]
  ).map((r) => ({ name: r.name, kind: r.kind, fileId: r.file_id }));
}

export function pathSearch(store: Store, terms: string[]): PathHit[] {
  const ts = terms.filter((t) => t.length > 0);
  if (ts.length === 0) return [];
  if (ftsOn(store)) {
    return (
      store.prepare('SELECT path, file_id FROM fts_paths WHERE fts_paths MATCH ?').all(ftsQuery(ts)) as {
        path: string;
        file_id: number;
      }[]
    ).map((r) => ({ path: r.path, fileId: Number(r.file_id) }));
  }
  const where = ts.map(() => 'path LIKE ?').join(' OR ');
  return (
    store.prepare(`SELECT path, id FROM files WHERE ${where}`).all(...ts.map((t) => `%${t}%`)) as {
      path: string;
      id: number;
    }[]
  ).map((r) => ({ path: r.path, fileId: r.id }));
}
