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
