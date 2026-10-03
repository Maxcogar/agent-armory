// The one search interface (Step 14, AD-2, D-plan-28, D-plan-36): one
// tokenizer, token-prefix semantics on both paths (review N6/G16; expert review
// M3, collapse-hunt H4).
//
// The indexer writes `tokenize` output for every file path and symbol name in
// both FTS states — joined by one space into `fts_paths.tokens` /
// `fts_symbols.tokens` under `fts_state = 'fts5'`, one row per distinct token
// into `path_tokens` / `symbol_tokens` always — and each search passes its
// terms through the same `tokenize`. Each token is searched as a prefix: FTS5's
// quoted prefix query `"<token>"*` under 'fts5', the indexed range
// `token >= ? AND token < ? || char(0x10FFFF)` under 'fallback'. So the two
// paths select the same rows by construction. A term's hits are the
// intersection over its tokens; a term with no token matches nothing; the hits
// of several terms are their union. Only `in_tree = 1` files are returned.
import type { Store } from '../stores/adapter.js';

export interface SymbolHit {
  name: string;
  kind: string;
  fileId: number;
}
export interface PathHit {
  path: string;
  fileId: number;
}

/**
 * AD-2's tokenizer: NFKD, then lowercase, then every combining mark removed,
 * then a split on runs of non-letter/non-digit code points, empty pieces
 * dropped. The split runs last so a decomposed accent never splits a word, and
 * the lowercase runs before the mark removal so a mark lower-casing produces
 * (`İ` → `i` + U+0307) is removed too. Every token holds only letters and
 * digits — never `"`, `*`, or whitespace — so a token cannot carry FTS syntax.
 */
export function tokenize(text: string): string[] {
  return text
    .normalize('NFKD')
    .toLowerCase()
    .replace(/\p{M}/gu, '')
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t !== '');
}

function ftsOn(store: Store): boolean {
  const row = store.prepare("SELECT value FROM schema_meta WHERE key = 'fts_state'").get() as { value: string | null } | undefined;
  return row?.value === 'fts5';
}

/** The ids one token selects, as a prefix, under the store's FTS state. */
function idsForToken(store: Store, fts: boolean, kind: 'path' | 'symbol', token: string): Set<number> {
  let rows: { id: number }[];
  if (fts) {
    const sql =
      kind === 'path'
        ? 'SELECT DISTINCT file_id AS id FROM fts_paths WHERE fts_paths MATCH ?'
        : 'SELECT DISTINCT symbol_id AS id FROM fts_symbols WHERE fts_symbols MATCH ?';
    rows = store.prepare(sql).all(`"${token}"*`) as { id: number }[];
  } else {
    const sql =
      kind === 'path'
        ? 'SELECT DISTINCT file_id AS id FROM path_tokens WHERE token >= ? AND token < ? || char(1114111)'
        : 'SELECT DISTINCT symbol_id AS id FROM symbol_tokens WHERE token >= ? AND token < ? || char(1114111)';
    rows = store.prepare(sql).all(token, token) as { id: number }[];
  }
  return new Set(rows.map((r) => Number(r.id)));
}

/** Union over terms of (intersection over each term's tokens). */
function matchIds(store: Store, kind: 'path' | 'symbol', terms: string[]): number[] {
  const fts = ftsOn(store);
  const out = new Set<number>();
  for (const term of terms) {
    const tokens = [...new Set(tokenize(term))];
    if (tokens.length === 0) continue;
    let acc = idsForToken(store, fts, kind, tokens[0] as string);
    for (const t of tokens.slice(1)) {
      if (acc.size === 0) break;
      const ids = idsForToken(store, fts, kind, t);
      acc = new Set([...acc].filter((id) => ids.has(id)));
    }
    for (const id of acc) out.add(id);
  }
  return [...out].sort((a, b) => a - b);
}

export function symbolSearch(store: Store, terms: string[]): SymbolHit[] {
  const ids = matchIds(store, 'symbol', terms);
  if (ids.length === 0) return [];
  const rows = store
    .prepare(
      `SELECT s.name AS name, s.kind AS kind, s.file_id AS fileId
         FROM symbols s JOIN files f ON f.id = s.file_id
        WHERE f.in_tree = 1 AND s.id IN (SELECT value FROM json_each(?))
        ORDER BY s.id`
    )
    .all(JSON.stringify(ids)) as { name: string; kind: string; fileId: number }[];
  return rows.map((r) => ({ name: r.name, kind: r.kind, fileId: Number(r.fileId) }));
}

export function pathSearch(store: Store, terms: string[]): PathHit[] {
  const ids = matchIds(store, 'path', terms);
  if (ids.length === 0) return [];
  const rows = store
    .prepare(
      `SELECT path, id AS fileId FROM files
        WHERE in_tree = 1 AND id IN (SELECT value FROM json_each(?))
        ORDER BY id`
    )
    .all(JSON.stringify(ids)) as { path: string; fileId: number }[];
  return rows.map((r) => ({ path: r.path, fileId: Number(r.fileId) }));
}
