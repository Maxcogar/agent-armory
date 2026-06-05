// ============================================================
// Core Graph Types
// ============================================================

export type Language = "javascript" | "typescript" | "python" | "cpp" | "arduino" | "config" | "unknown";

export interface FileNode {
  /** Normalized absolute path */
  path: string;
  /** Path relative to the scanned root */
  relativePath: string;
  /** Detected language */
  language: Language;
  /** Absolute paths of files this file imports/includes */
  dependencies: string[];
  /** Absolute paths of files that import/include this file */
  dependents: string[];
  /** File size in bytes */
  sizeBytes: number;
  /** Last modified timestamp */
  lastModified: number;
  /**
   * Rich import edges from the tree-sitter pass (kind + specifiers + resolution).
   * Supplements `dependencies` (which stays the resolved-internal file list every
   * existing algorithm reads). Optional until the symbol layer populates it.
   */
  imports?: ImportEdge[];
  /** Declared symbols in this file (exports + internals). Optional until populated. */
  symbols?: SymbolNode[];
  /** True when this file is classified as a test (see test/source partition). */
  isTest?: boolean;
}

export interface DependencyGraph {
  /** Root directory that was scanned */
  rootDir: string;
  /** When this graph was built */
  builtAt: number;
  /** All discovered file nodes, keyed by absolute path */
  nodes: Map<string, FileNode>;
  /** Total files scanned */
  totalFiles: number;
  /** Files that had parse errors */
  parseErrors: ParseError[];
  /** Documentation files with their code references */
  docNodes: Map<string, DocNode>;
}

export interface ParseError {
  file: string;
  error: string;
}

// ============================================================
// Tool Response Types
// ============================================================

export interface FileDependencies {
  [key: string]: unknown;
  file: string;
  relativePath: string;
  language: Language;
  dependencies: FileRef[];
  dependencyCount: number;
}

export interface FileDependents {
  [key: string]: unknown;
  file: string;
  relativePath: string;
  language: Language;
  dependents: FileRef[];
  dependentCount: number;
}

export interface FileRef {
  [key: string]: unknown;
  path: string;
  relativePath: string;
  language: Language;
}

export interface ChangeImpact {
  [key: string]: unknown;
  changedFiles: FileRef[];
  directlyAffected: FileRef[];
  transitivelyAffected: FileRef[];
  totalImpacted: number;
  blastRadius: number;
  /** Percentage of codebase affected */
  coveragePercent: number;
}

export interface SubGraph {
  [key: string]: unknown;
  centerFile: FileRef;
  depth: number;
  nodes: SubGraphNode[];
  edges: SubGraphEdge[];
}

export interface SubGraphNode {
  [key: string]: unknown;
  path: string;
  relativePath: string;
  language: Language;
  distanceFromCenter: number;
  direction: "dependency" | "dependent" | "center";
}

export interface SubGraphEdge {
  [key: string]: unknown;
  from: string;
  to: string;
  type: "imports";
}

export interface GraphStats {
  [key: string]: unknown;
  rootDir: string;
  builtAt: string;
  totalFiles: number;
  byLanguage: Record<string, number>;
  entryPoints: FileRef[];
  mostConnected: ConnectedFile[];
  mostDependedOn: ConnectedFile[];
  parseErrors: number;
  averageDependencies: number;
}

export interface ConnectedFile {
  [key: string]: unknown;
  path: string;
  relativePath: string;
  language: Language;
  count: number;
}

// ============================================================
// Graph Intelligence Types
// ============================================================

export interface CyclesResult {
  [key: string]: unknown;
  /** Each cycle as an ordered ring of files (normalized to start at the smallest path) */
  cycles: FileRef[][];
  count: number;
  hasCycles: boolean;
  /** True when more cycles existed than were returned (capped by max_cycles) */
  truncated: boolean;
}

export interface PathBetweenResult {
  [key: string]: unknown;
  from: FileRef;
  to: FileRef;
  /** The dependency chain from->...->to, inclusive, or null if unreachable */
  path: FileRef[] | null;
  found: boolean;
  /** Number of hops (edges) in the path; 0 when from === to, null when not found */
  length: number | null;
  /** Set when there is no forward path but `to` depends on `from` instead */
  reverseExists?: boolean;
}

export interface OrphansResult {
  [key: string]: unknown;
  orphans: FileRef[];
  count: number;
}

export interface LayersResult {
  [key: string]: unknown;
  /** Layer 0 imports nothing in-project; each later layer depends only on earlier ones */
  layers: FileRef[][];
  depth: number;
  /** True when the graph contains at least one dependency cycle */
  cyclic: boolean;
  /** Files participating in a cycle (empty when acyclic) */
  cyclicNodes: FileRef[];
}

// ============================================================
// Documentation Graph Types
// ============================================================

export interface DocNode {
  /** Absolute path to the documentation file */
  path: string;
  /** Path relative to the scanned root */
  relativePath: string;
  /** Absolute paths of code files referenced in this doc's content */
  referencedCodeFiles: string[];
}

export interface DocRef {
  [key: string]: unknown;
  path: string;
  relativePath: string;
  /** Which code files in the blast radius this doc references */
  matchedCodeFiles: FileRef[];
  /** Why this doc was matched (e.g. "references auth/login.ts, utils/helpers.ts") */
  reason: string;
}

export interface DocListRef {
  [key: string]: unknown;
  path: string;
  relativePath: string;
  /** Number of code files in the graph this doc references */
  referencedCodeFileCount: number;
}

export interface RelatedDocsResult {
  [key: string]: unknown;
  /** The changed files that were analyzed */
  changedFiles: FileRef[];
  /** Full blast radius: changed + all transitively affected code files */
  blastRadius: FileRef[];
  /** All documentation files that reference any file in the blast radius */
  relatedDocs: DocRef[];
  /** Total doc files found that need review */
  totalDocsToReview: number;
  /** Total doc files in the project (for context) */
  totalDocsInProject: number;
}

// ============================================================
// Symbol & Import Layer (tree-sitter substrate)
// ============================================================

/** How an import couples the importer to its target. */
export type ImportKind = "value" | "type" | "dynamic" | "re-export" | "side-effect";

/** Whether an import's `raw` specifier resolved to an in-graph file. */
export type ImportResolution = "internal" | "external" | "unresolved";

/** One name brought in by an import or re-export. */
export interface ImportSpecifier {
  /** Name in the source module; "default" for a default import, "*" for a namespace. */
  imported: string;
  /** Local binding name (equals `imported` when not aliased). */
  local: string;
  kind: "named" | "default" | "namespace";
  /** True for `import type {X}` or `import {type X}` — TS type-only specifiers. */
  isType: boolean;
}

/**
 * A syntactic import as read straight from the parse tree, before path
 * resolution. `raw` is the module specifier exactly as written.
 */
export interface RawImport {
  raw: string;
  kind: ImportKind;
  specifiers: ImportSpecifier[];
  /** 1-based line of the import/require/re-export statement. */
  line: number;
}

/** A {@link RawImport} whose `raw` specifier has been resolved against the graph. */
export interface ImportEdge extends RawImport {
  /** Resolved absolute path (internal), an external package id, or null. */
  to: string | null;
  resolution: ImportResolution;
}

export type SymbolKind =
  | "function" | "class" | "interface" | "type"
  | "enum" | "const" | "variable" | "method";

export type LivenessVerdict = "used" | "unused" | "ambiguous";

export interface Liveness {
  verdict: LivenessVerdict;
  /** Why, when the verdict is `ambiguous` (e.g. "re-exported via barrel"). */
  reason?: string;
}

export interface SymbolNode {
  name: string;
  kind: SymbolKind;
  exported: boolean;
  /** True for type-space declarations (interface, type alias, etc.). */
  isType: boolean;
  /** 1-based line of the declaration. */
  line: number;
}
