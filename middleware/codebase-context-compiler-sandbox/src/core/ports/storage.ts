/**
 * Storage port (Architecture D1/D4). The SQLite adapter implements this; the
 * core services depend only on this interface.
 */
import type {
  RepositorySnapshot, FileRecord, SymbolRecord, EdgeRecord, EdgeKind,
} from '../domain/repository-map.js';
import type { ContextPackage } from '../domain/context-package.js';
import type { ReviewResult } from '../domain/review-finding.js';
import type { ContextExpansionResult } from '../domain/context-expansion.js';
import type { StaticAnalysisFinding } from '../domain/static-analysis.js';

export interface AuditEntry {
  ts: string;
  actor: string;
  action: string;
  detail: string;
}

export interface Storage {
  // --- snapshots ---
  createSnapshot(s: RepositorySnapshot): void;
  getSnapshot(id: string): RepositorySnapshot | null;
  getLatestSnapshot(repoRoot: string): RepositorySnapshot | null;

  // --- map writes (batched per snapshot) ---
  putFiles(files: FileRecord[]): void;
  putSymbols(symbols: SymbolRecord[]): void;
  putEdges(edges: EdgeRecord[]): void;

  // --- map queries ---
  getFile(snapshotId: string, path: string): FileRecord | null;
  listFiles(snapshotId: string): FileRecord[];
  symbolsInFile(snapshotId: string, path: string): SymbolRecord[];
  findSymbolsByName(snapshotId: string, name: string): SymbolRecord[];
  /** Edges where from_path === path (outgoing). */
  outgoingEdges(snapshotId: string, path: string, kinds?: EdgeKind[]): EdgeRecord[];
  /** Edges where to_path === path (incoming). */
  incomingEdges(snapshotId: string, path: string, kinds?: EdgeKind[]): EdgeRecord[];
  /** Full-text search over file content (FTS5). Returns matching paths. */
  searchText(snapshotId: string, query: string, limit: number): string[];
  /** Raw file content as indexed (used for evidence spans + lexical search). */
  getFileContent(snapshotId: string, path: string): string | null;
  putFileContent(snapshotId: string, path: string, content: string): void;
  putStaticFindings(findings: StaticAnalysisFinding[]): void;
  staticFindingsForFile(snapshotId: string, path: string): StaticAnalysisFinding[];
  listStaticFindings(snapshotId: string): StaticAnalysisFinding[];

  // --- package + review history ---
  savePackage(pkg: ContextPackage): void;
  getPackage(packageId: string): ContextPackage | null;
  saveReview(r: ReviewResult): void;
  saveExpansion(r: ContextExpansionResult): void;

  // --- audit (SR5) ---
  appendAudit(e: AuditEntry): void;
  listAudit(limit: number): AuditEntry[];

  close(): void;
}
