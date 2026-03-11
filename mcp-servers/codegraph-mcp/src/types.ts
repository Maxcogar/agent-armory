// ============================================================
// Core Graph Types
// ============================================================

export type Language = "javascript" | "typescript" | "python" | "cpp" | "arduino" | "unknown";

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
