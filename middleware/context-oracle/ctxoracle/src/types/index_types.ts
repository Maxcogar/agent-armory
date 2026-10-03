// Shared index types (Step 6, AD-12). Type-only (erased at build), declared
// ahead of the indexer (Step 14) and the tree-sitter frontends (Step 15) that
// produce them.

/** A symbol a frontend extracted from a file: its name, kind, and byte span. */
export interface SymbolRow {
  name: string;
  kind: string;
  spanStart: number;
  spanEnd: number;
}

/** An import edge a frontend extracted: its destination specifier and kind. */
export interface ImportEdge {
  dst: string;
  kind: string;
}

/**
 * What a frontend returns for one import (reopened Step 6 build delta), resolved
 * into an `ImportEdge` by the frontend's resolver (Step 14). Type-only.
 */
export interface CapturedImport {
  specifier: string;
  kind: string;
}
