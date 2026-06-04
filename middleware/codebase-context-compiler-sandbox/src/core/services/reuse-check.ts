/**
 * Reuse / duplication detection — a sub-signal feeding the edit context card.
 *
 * Surfaces the compiles-fine "you rebuilt something that already exists" case:
 * an edit defines a symbol whose name already exists as an exported symbol
 * elsewhere. Name-level only (semantic equivalence needs a model); common/short
 * names are filtered to keep the signal clean.
 */
import type { Storage } from '../ports/storage.js';
import type { ParserAdapter } from '../ports/parser-adapter.js';

const DEDUP_KINDS = new Set(['function', 'class', 'component', 'interface', 'type']);
const COMMON = new Set([
  'index', 'main', 'run', 'handler', 'render', 'setup', 'config', 'app', 'default',
  'init', 'start', 'stop', 'create', 'update', 'remove', 'list', 'data', 'props',
  'state', 'value', 'item', 'name', 'type', 'model', 'view', 'page', 'route',
  'component', 'helper', 'utils', 'util', 'test', 'mock', 'options', 'context',
]);

export interface ReuseConflict {
  name: string;
  kind: string;
  existingPath: string;
  existingLine: number;
}

export async function findReuseConflicts(
  storage: Storage, snapshotId: string, parser: ParserAdapter, filePath: string, content: string,
): Promise<ReuseConflict[]> {
  if (!content) return [];
  let parsed;
  try { parsed = await parser.parse({ snapshotId, path: filePath, content }); } catch { return []; }
  const out: ReuseConflict[] = [];
  const seen = new Set<string>();
  for (const s of parsed.symbols) {
    if (!DEDUP_KINDS.has(s.kind)) continue;
    if (s.name.length <= 3 || COMMON.has(s.name.toLowerCase())) continue;
    if (seen.has(s.name)) continue;
    const matches = storage.findSymbolsByName(snapshotId, s.name).filter((m) => m.path !== filePath && m.exported);
    if (matches.length) { seen.add(s.name); const m = matches[0]!; out.push({ name: s.name, kind: s.kind, existingPath: m.path, existingLine: m.start_line }); }
  }
  return out;
}

export function describeConflict(c: ReuseConflict): string {
  return `defines ${c.kind} "${c.name}"; an export named ${c.name} already exists at ${c.existingPath}:${c.existingLine}. Flagging so you do not add a second parallel definition unaware — decide deliberately whether to reuse, refactor, or replace it (its existence is not evidence it is correct).`;
}
