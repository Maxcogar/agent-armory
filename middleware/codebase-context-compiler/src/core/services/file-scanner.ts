/**
 * File scanner (Architecture build step 4). Walks a repository root, applies
 * exclude rules, and produces FileRecords plus indexed content. Snapshot
 * identity (FR18) is computed from the repo revision + a content digest so two
 * different working-tree states cannot collide.
 */
import fg from 'fast-glob';
import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { relative, sep } from 'node:path';
import { execSync } from 'node:child_process';
import type { FileRecord, RepositorySnapshot } from '../domain/repository-map.js';
import { DEFAULT_EXCLUDES, languageForPath, boundaryForPath } from '../../config/default-excludes.js';

export interface ScannedFile {
  record: Omit<FileRecord, 'snapshot_id'>;
  content: string;
}

export interface ScanResult {
  snapshot: RepositorySnapshot;
  files: ScannedFile[];
}

export interface ScanOptions {
  excludes?: string[];
  /** Max bytes to index per file; larger files are recorded but content truncated. */
  maxBytes?: number;
  /** Optional SARIF/static-analysis files to import into the snapshot. */
  staticAnalysis?: string[];
}

function sha256(s: string | Buffer): string {
  return createHash('sha256').update(s).digest('hex');
}

function gitRevision(root: string): { revision: string | null; dirty: boolean } {
  try {
    const revision = execSync('git rev-parse HEAD', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString().trim();
    const status = execSync('git status --porcelain', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString().trim();
    return { revision, dirty: status.length > 0 };
  } catch {
    return { revision: null, dirty: true };
  }
}

export function scanRepository(root: string, repoName: string, opts: ScanOptions = {}): ScanResult {
  const excludes = opts.excludes ?? DEFAULT_EXCLUDES;
  const maxBytes = opts.maxBytes ?? 512 * 1024;

  const entries = fg.sync(['**/*'], {
    cwd: root, ignore: excludes, dot: false, onlyFiles: true, followSymbolicLinks: false,
  }).sort();

  const files: ScannedFile[] = [];
  const digest = createHash('sha256');

  for (const rel of entries) {
    const abs = `${root}${sep}${rel}`;
    let size: number;
    try { size = statSync(abs).size; } catch { continue; }
    let content = '';
    try {
      const buf = readFileSync(abs);
      // Skip likely-binary files (NUL byte in first 4KB).
      if (buf.subarray(0, 4096).includes(0)) continue;
      content = buf.subarray(0, maxBytes).toString('utf8');
    } catch { continue; }

    const path = rel.split(sep).join('/');
    const contentHash = sha256(content);
    digest.update(path).update('\0').update(contentHash).update('\n');
    files.push({
      record: {
        path,
        language: languageForPath(path),
        content_hash: contentHash,
        size_bytes: size,
        boundary: boundaryForPath(path),
      },
      content,
    });
  }

  const { revision, dirty } = gitRevision(root);
  const treeDigest = digest.digest('hex').slice(0, 16);
  const snapshotId = `${(revision ?? 'nogit').slice(0, 12)}-${treeDigest}`;

  return {
    snapshot: {
      snapshot_id: snapshotId,
      repo_name: repoName,
      root,
      revision,
      dirty_state: dirty,
      created_at: new Date().toISOString(),
    },
    files,
  };
}

export { relative };
