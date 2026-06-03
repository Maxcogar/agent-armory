/**
 * Context cards — the continuous-assistance core.
 *
 * For any file the agent touches, produce a compact orientation card from the
 * repository graph already built by the indexer: what the file is, what it
 * provides, what it depends on, WHAT DEPENDS ON IT (the blast radius of a
 * change), and which tests cover it. On an edit we additionally surface existing
 * capabilities the change could reuse instead of reinventing.
 *
 * This is help, not enforcement: the agent gets the knowledge it needs to act
 * well at the moment it acts, every time — instead of reading a file cold.
 */
import type { Storage } from '../ports/storage.js';
import type { ParserAdapter } from '../ports/parser-adapter.js';
import { findReuseConflicts, describeConflict } from './reuse-check.js';

function uniq(xs: string[]): string[] { return [...new Set(xs)]; }

export function buildReadCard(storage: Storage, snapshotId: string, path: string): string | null {
  const file = storage.getFile(snapshotId, path);
  if (!file) return null; // not indexed (new/external) — nothing to orient on

  const exports = storage.symbolsInFile(snapshotId, path).filter((s) => s.exported);
  const deps = uniq(storage.outgoingEdges(snapshotId, path, ['imports'])
    .filter((e) => storage.getFile(snapshotId, e.to_path) !== null)
    .map((e) => e.to_path));
  const incoming = storage.incomingEdges(snapshotId, path, ['imports']);
  const dependents = uniq(incoming.map((e) => e.from_path));
  const tests = dependents.filter((p) => storage.getFile(snapshotId, p)?.boundary === 'test');
  const codeDependents = dependents.filter((p) => !tests.includes(p));

  const L: string[] = [];
  L.push(`ctxpack — orientation for ${path} (${file.boundary}):`);
  if (exports.length) L.push(`• Provides: ${exports.slice(0, 8).map((s) => `${s.name} (${s.kind})`).join(', ')}`);
  if (deps.length) L.push(`• Depends on: ${deps.slice(0, 8).join(', ')}`);
  if (codeDependents.length) {
    L.push(`• Used by ${codeDependents.length} file(s) — changing its exports affects: ${codeDependents.slice(0, 8).join(', ')}`);
  } else if (file.boundary === 'source') {
    L.push(`• Used by: nothing imports it yet (no internal dependents found).`);
  }
  if (tests.length) L.push(`• Covered by tests: ${tests.join(', ')}`);
  if (file.boundary === 'generated' || file.boundary === 'vendor') L.push(`• NOTE: ${file.boundary} file — usually should not be hand-edited.`);

  return L.length > 1 ? L.join('\n') : null;
}

export async function buildEditCard(
  storage: Storage, snapshotId: string, parser: ParserAdapter, path: string, content: string,
): Promise<string | null> {
  const parts: string[] = [];
  const read = buildReadCard(storage, snapshotId, path);
  if (read) parts.push(read.replace('orientation for', 'before you change'));

  // existing capabilities this edit could reuse instead of rebuilding
  const conflicts = await findReuseConflicts(storage, snapshotId, parser, path, content);
  if (conflicts.length) {
    parts.push(`• Reuse check: this edit ${conflicts.map(describeConflict).join('; also ')}.`);
  }

  // who depends on the symbols being changed (impact awareness)
  const incoming = storage.incomingEdges(snapshotId, path, ['imports']).filter((e) => e.symbol);
  if (incoming.length) {
    const bySym = new Map<string, Set<string>>();
    for (const e of incoming) { if (!e.symbol) continue; (bySym.get(e.symbol) ?? bySym.set(e.symbol, new Set()).get(e.symbol)!).add(e.from_path); }
    const lines = [...bySym.entries()].slice(0, 5).map(([sym, users]) => `${sym} (${users.size} call site(s))`);
    if (lines.length) parts.push(`• Dependents to account for if you change these symbols: ${lines.join(', ')}. Changing or replacing them is fine — just update the call sites.`);
  }

  return parts.length ? parts.join('\n') : null;
}
