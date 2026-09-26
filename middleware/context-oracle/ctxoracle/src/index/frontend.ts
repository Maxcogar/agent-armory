// The LanguageFrontend seam (Step 14, AD-12, FR-K1, C-6; review G12/G13/G14).
// A frontend turns one file's bytes into symbols and captured import
// specifiers; the indexer owns everything else (storage, FTS, zones). Adding a
// language is adding a frontend or a config row, never a redesign.
//
// - `capabilities` is the frontend's declaration per language (AD-12, G13):
//   recorded per language in `schema_meta.lang_capabilities` and shown in
//   `status`, so "observed zero" is told apart from "never counted".
// - `init` is awaited once per frontend whose language occurs in the walked
//   file set (G14: web-tree-sitter's `Parser.init`/`Language.load` return
//   promises), so `parse` can stay synchronous; an `init` that rejects disables
//   that frontend for the pass (Step 14 build review m6).
// - `parse` never throws: a failure is a returned value, so the indexer — which
//   holds the store — records `frontend_parse_failed`.
// - A frontend with `capabilities.imports = true` provides `resolve`, which
//   classifies each captured specifier (AD-12, CH H4): `resolved` (an
//   `import_edges` row to `dst`), `external` (nothing), or `unresolved`
//   (counted into `files.unresolved_imports`). One with `imports = false`
//   returns no imports.
import type { CapturedImport, SymbolRow } from '../types/index_types.js';

export type ImportResolution = { kind: 'resolved'; dst: string } | { kind: 'external' } | { kind: 'unresolved' };

/** What a resolver may ask about the walked repository. */
export interface RepoFiles {
  /** Whether the repository-relative POSIX path is a present file of this walk. */
  has(path: string): boolean;
  /** The dependency names of the nearest `package.json` at or above `fromPath`'s directory. */
  nearestPackageJsonDeps(fromPath: string): ReadonlySet<string>;
}

export type ImportResolver = (fromPath: string, specifier: string, repo: RepoFiles) => ImportResolution;

export type ParseResult = { ok: true; symbols: SymbolRow[]; imports: CapturedImport[] } | { ok: false; error: string };

export interface LanguageFrontend {
  /** The grammar name this frontend handles (`index.ext_to_grammar`'s right side); `'*'` for the generic frontend. */
  readonly lang: string;
  readonly capabilities: { symbols: boolean; imports: boolean };
  /**
   * The frontend's identity: changes whenever the rows `parse`/`resolve` can
   * produce change — a grammar package version, a query text, a resolver rule
   * (Step 14 build review S1). One input of the pass's frontend fingerprint; a
   * frontend whose output changes without a new `version` is re-parsed only by
   * `--full`.
   */
  readonly version: string;
  /** Awaited before any parse. */
  init(): Promise<void>;
  /** Never throws. */
  parse(path: string, content: Buffer): ParseResult;
  resolve?(fromPath: string, specifier: string, repo: RepoFiles): ImportResolution;
}
