// The default frontend list (Step 15, D-plan-29): one tree-sitter frontend per
// grammar, then the generic frontend last.
// SKELETON: G8 — the grammar table is a `tuning` list in the global store, so
// this needs the store the plan's `defaultFrontends()` signature does not take.
// SKELETON: G13 — only grammars with a query get a tree-sitter frontend.
import type { Store } from '../stores/adapter.js';
import type { LanguageFrontend } from './frontend.js';
import { tuning } from '../stores/dao/tuning.js';
import { recordFault } from '../diag/fault_writer.js';
import { treeSitterFrontend, QUERIES } from './tree_sitter_frontend.js';
import { genericFrontend } from './generic_frontend.js';

export function defaultFrontends(global: Store, diagnosticsDir: string): LanguageFrontend[] {
  const langs = new Set(
    tuning
      .list(global, 'index.ext_to_grammar')
      .map((m) => m.slice(m.indexOf('=') + 1))
      .filter((l) => l in QUERIES)
  );
  const onFail = (lang: string, path: string, error: unknown): void =>
    recordFault(null, diagnosticsDir, {
      code: 'frontend_parse_failed',
      detail: { lang, path, error: error instanceof Error ? error.constructor.name : String(error) },
    });
  return [...[...langs].sort().map((l) => treeSitterFrontend(l, onFail)), genericFrontend];
}
