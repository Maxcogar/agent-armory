/**
 * SQLite + FTS5 storage adapter (Architecture D4). Implements the Storage port.
 *
 * Local-first (SR1): the DB is a single file under the user's control. Secret
 * redaction happens upstream in the indexer before content reaches FTS, so the
 * stored index does not become a secret-exfiltration surface (T1).
 */
import Database from 'better-sqlite3';
import type { Database as DB } from 'better-sqlite3';
import { readFileSync, readdirSync, chmodSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { Storage, AuditEntry } from '../../core/ports/storage.js';
import type {
  RepositorySnapshot, FileRecord, SymbolRecord, EdgeRecord, EdgeKind,
} from '../../core/domain/repository-map.js';
import type { ContextPackage } from '../../core/domain/context-package.js';
import type { ReviewResult } from '../../core/domain/review-finding.js';
import type { ContextExpansionResult } from '../../core/domain/context-expansion.js';
import type { StaticAnalysisFinding } from '../../core/domain/static-analysis.js';

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), 'migrations');

export class SqliteStorage implements Storage {
  private db: DB;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.migrate();
    // SR1: restrict the index file to the owner where the FS supports it.
    if (dbPath !== ':memory:') {
      try { chmodSync(dbPath, 0o600); } catch { /* best-effort on non-POSIX */ }
    }
  }

  private migrate(): void {
    const current = this.db.pragma('user_version', { simple: true }) as number;
    const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
    files.forEach((file, i) => {
      const version = i + 1;
      if (version > current) {
        this.db.exec(readFileSync(join(migrationsDir, file), 'utf8'));
        this.db.pragma(`user_version = ${version}`);
      }
    });
  }

  createSnapshot(s: RepositorySnapshot): void {
    this.db.prepare(
      `INSERT INTO snapshots (snapshot_id, repo_name, root, revision, dirty_state, created_at)
       VALUES (@snapshot_id, @repo_name, @root, @revision, @dirty, @created_at)`
    ).run({ ...s, dirty: s.dirty_state ? 1 : 0 });
  }

  getSnapshot(id: string): RepositorySnapshot | null {
    const row = this.db.prepare(`SELECT * FROM snapshots WHERE snapshot_id = ?`).get(id) as any;
    return row ? this.mapSnapshot(row) : null;
  }

  getLatestSnapshot(repoRoot: string): RepositorySnapshot | null {
    const row = this.db.prepare(
      `SELECT * FROM snapshots WHERE root = ? ORDER BY created_at DESC LIMIT 1`
    ).get(repoRoot) as any;
    return row ? this.mapSnapshot(row) : null;
  }

  private mapSnapshot(row: any): RepositorySnapshot {
    return {
      snapshot_id: row.snapshot_id, repo_name: row.repo_name, root: row.root,
      revision: row.revision, dirty_state: !!row.dirty_state, created_at: row.created_at,
    };
  }

  putFiles(files: FileRecord[]): void {
    const stmt = this.db.prepare(
      `INSERT OR REPLACE INTO files (snapshot_id, path, language, content_hash, size_bytes, boundary)
       VALUES (@snapshot_id, @path, @language, @content_hash, @size_bytes, @boundary)`
    );
    this.db.transaction((rows: FileRecord[]) => rows.forEach((r) => stmt.run(r)))(files);
  }

  putSymbols(symbols: SymbolRecord[]): void {
    const stmt = this.db.prepare(
      `INSERT INTO symbols (snapshot_id, name, kind, path, start_line, end_line, exported)
       VALUES (@snapshot_id, @name, @kind, @path, @start_line, @end_line, @exp)`
    );
    this.db.transaction((rows: SymbolRecord[]) =>
      rows.forEach((r) => stmt.run({ ...r, exp: r.exported ? 1 : 0 }))
    )(symbols);
  }

  putEdges(edges: EdgeRecord[]): void {
    const stmt = this.db.prepare(
      `INSERT INTO edges (snapshot_id, from_path, to_path, kind, symbol, from_line)
       VALUES (@snapshot_id, @from_path, @to_path, @kind, @symbol, @from_line)`
    );
    this.db.transaction((rows: EdgeRecord[]) => rows.forEach((r) => stmt.run(r)))(edges);
  }

  getFile(snapshotId: string, path: string): FileRecord | null {
    const row = this.db.prepare(
      `SELECT * FROM files WHERE snapshot_id = ? AND path = ?`
    ).get(snapshotId, path) as any;
    return row ? this.mapFile(row) : null;
  }

  listFiles(snapshotId: string): FileRecord[] {
    return (this.db.prepare(`SELECT * FROM files WHERE snapshot_id = ?`).all(snapshotId) as any[])
      .map((r) => this.mapFile(r));
  }

  private mapFile(row: any): FileRecord {
    return {
      snapshot_id: row.snapshot_id, path: row.path, language: row.language,
      content_hash: row.content_hash, size_bytes: row.size_bytes, boundary: row.boundary,
    };
  }

  symbolsInFile(snapshotId: string, path: string): SymbolRecord[] {
    return (this.db.prepare(`SELECT * FROM symbols WHERE snapshot_id = ? AND path = ?`)
      .all(snapshotId, path) as any[]).map((r) => this.mapSymbol(r));
  }

  findSymbolsByName(snapshotId: string, name: string): SymbolRecord[] {
    return (this.db.prepare(`SELECT * FROM symbols WHERE snapshot_id = ? AND name = ?`)
      .all(snapshotId, name) as any[]).map((r) => this.mapSymbol(r));
  }

  private mapSymbol(row: any): SymbolRecord {
    return {
      snapshot_id: row.snapshot_id, name: row.name, kind: row.kind, path: row.path,
      start_line: row.start_line, end_line: row.end_line, exported: !!row.exported,
    };
  }

  outgoingEdges(snapshotId: string, path: string, kinds?: EdgeKind[]): EdgeRecord[] {
    return this.queryEdges('from_path', snapshotId, path, kinds);
  }

  incomingEdges(snapshotId: string, path: string, kinds?: EdgeKind[]): EdgeRecord[] {
    return this.queryEdges('to_path', snapshotId, path, kinds);
  }

  private queryEdges(col: 'from_path' | 'to_path', snapshotId: string, path: string, kinds?: EdgeKind[]): EdgeRecord[] {
    let sql = `SELECT * FROM edges WHERE snapshot_id = ? AND ${col} = ?`;
    const params: unknown[] = [snapshotId, path];
    if (kinds && kinds.length) {
      sql += ` AND kind IN (${kinds.map(() => '?').join(',')})`;
      params.push(...kinds);
    }
    return (this.db.prepare(sql).all(...params) as any[]).map((r) => ({
      snapshot_id: r.snapshot_id, from_path: r.from_path, to_path: r.to_path,
      kind: r.kind, symbol: r.symbol, from_line: r.from_line,
    }));
  }

  searchText(snapshotId: string, query: string, limit: number): string[] {
    // Sanitise the query into an FTS5-safe disjunction of quoted terms so that
    // arbitrary task text never produces an FTS syntax error (or injection).
    const terms = query.toLowerCase().match(/[a-z0-9_]+/g) ?? [];
    if (terms.length === 0) return [];
    const match = terms.map((t) => `"${t}"`).join(' OR ');
    try {
      return (this.db.prepare(
        `SELECT path FROM file_content WHERE snapshot_id = ? AND file_content MATCH ? LIMIT ?`
      ).all(snapshotId, match, limit) as any[]).map((r) => r.path);
    } catch {
      return [];
    }
  }

  getFileContent(snapshotId: string, path: string): string | null {
    const row = this.db.prepare(
      `SELECT content FROM file_content_lookup WHERE snapshot_id = ? AND path = ?`
    ).get(snapshotId, path) as any;
    return row ? row.content : null;
  }

  putFileContent(snapshotId: string, path: string, content: string): void {
    this.db.prepare(
      `INSERT INTO file_content (snapshot_id, path, content) VALUES (?, ?, ?)`
    ).run(snapshotId, path, content);
    this.db.prepare(
      `INSERT OR REPLACE INTO file_content_lookup (snapshot_id, path, content) VALUES (?, ?, ?)`
    ).run(snapshotId, path, content);
  }

  putStaticFindings(findings: StaticAnalysisFinding[]): void {
    if (findings.length === 0) return;
    const deleteStmt = this.db.prepare(
      `DELETE FROM static_findings WHERE snapshot_id = ? AND source = ?`
    );
    const stmt = this.db.prepare(
      `INSERT INTO static_findings (snapshot_id, source, rule_id, severity, message, path, start_line, end_line)
       VALUES (@snapshot_id, @source, @rule_id, @severity, @message, @path, @start_line, @end_line)`
    );
    this.db.transaction((rows: StaticAnalysisFinding[]) => {
      const groups = new Set(rows.map((r) => `${r.snapshot_id}\0${r.source}`));
      for (const group of groups) {
        const [snapshotId, source] = group.split('\0');
        deleteStmt.run(snapshotId, source);
      }
      rows.forEach((r) => stmt.run(r));
    })(findings);
  }

  staticFindingsForFile(snapshotId: string, path: string): StaticAnalysisFinding[] {
    return (this.db.prepare(
      `SELECT * FROM static_findings WHERE snapshot_id = ? AND path = ?`
    ).all(snapshotId, path) as any[]).map(mapStaticFinding);
  }

  listStaticFindings(snapshotId: string): StaticAnalysisFinding[] {
    return (this.db.prepare(
      `SELECT * FROM static_findings WHERE snapshot_id = ?`
    ).all(snapshotId) as any[]).map(mapStaticFinding);
  }

  savePackage(pkg: ContextPackage): void {
    this.db.prepare(
      `INSERT OR REPLACE INTO packages (package_id, snapshot_id, generated_at, json)
       VALUES (?, ?, ?, ?)`
    ).run(pkg.package_id, pkg.repository.snapshot_id, pkg.generated_at, JSON.stringify(pkg));
  }

  getPackage(packageId: string): ContextPackage | null {
    const row = this.db.prepare(`SELECT json FROM packages WHERE package_id = ?`).get(packageId) as any;
    return row ? (JSON.parse(row.json) as ContextPackage) : null;
  }

  saveReview(r: ReviewResult): void {
    this.db.prepare(
      `INSERT INTO reviews (package_id, snapshot_id, reviewed_at, json) VALUES (?, ?, ?, ?)`
    ).run(r.package_id, r.repository_snapshot_id, r.reviewed_at, JSON.stringify(r));
  }

  saveExpansion(r: ContextExpansionResult): void {
    const pkg = r.updated_package;
    const snapshotId = pkg?.repository.snapshot_id ?? '';
    this.db.prepare(
      `INSERT INTO expansions (package_id, snapshot_id, created_at, request_json, result_json)
       VALUES (?, ?, ?, ?, ?)`
    ).run(r.package_id, snapshotId, new Date().toISOString(), JSON.stringify(r.request), JSON.stringify(r));
  }

  appendAudit(e: AuditEntry): void {
    this.db.prepare(`INSERT INTO audit (ts, actor, action, detail) VALUES (?, ?, ?, ?)`)
      .run(e.ts, e.actor, e.action, e.detail);
  }

  listAudit(limit: number): AuditEntry[] {
    return (this.db.prepare(`SELECT ts, actor, action, detail FROM audit ORDER BY id DESC LIMIT ?`)
      .all(limit) as any[]).map((r) => ({ ts: r.ts, actor: r.actor, action: r.action, detail: r.detail }));
  }

  close(): void {
    this.db.close();
  }
}

function mapStaticFinding(row: any): StaticAnalysisFinding {
  return {
    snapshot_id: row.snapshot_id,
    source: row.source,
    rule_id: row.rule_id,
    severity: row.severity,
    message: row.message,
    path: row.path,
    start_line: row.start_line,
    end_line: row.end_line,
  };
}
