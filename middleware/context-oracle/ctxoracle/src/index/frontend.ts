// The LanguageFrontend seam (Step 14, AD-12, FR-K1). A frontend turns one file's
// bytes into symbols and import specifiers; the indexer owns everything else
// (resolution, storage, FTS). Adding a language is adding a frontend.
//
// WALKING SKELETON (2026-09-25): `init` is added to the plan's interface.
// SKELETON: G14 — web-tree-sitter loads grammars asynchronously
// (`Parser.init`, `Language.load` return promises), so a synchronous `parse`
// needs its grammar loaded first; the plan's "lazy per first use" loading cannot
// sit behind a synchronous `parse`.
import type { ImportEdge, SymbolRow } from '../types/index_types.js';

export interface LanguageFrontend {
  readonly lang: string;
  /** Load whatever the frontend needs before `parse` can run. */
  init?(): Promise<void>;
  parse(path: string, content: Buffer): { symbols: SymbolRow[]; imports: ImportEdge[] };
}
