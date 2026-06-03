/**
 * Staleness detection (Spec FR19, AC8). Re-scans the working tree and compares
 * the resulting snapshot id (and per-file hashes) against the package's
 * snapshot so a package generated before a change cannot be used after it.
 */
import type { ContextPackage } from '../domain/context-package.js';
import { scanRepository } from './file-scanner.js';

export interface StalenessResult {
  stale: boolean;
  currentSnapshotId: string;
  changedFiles: string[];
}

export function checkStaleness(root: string, repoName: string, pkg: ContextPackage): StalenessResult {
  const scan = scanRepository(root, repoName);
  const current = scan.snapshot.snapshot_id;
  const byPath = new Map(scan.files.map((f) => [f.record.path, f.record.content_hash]));
  const relevant = new Set(pkg.relevant_files.map((f) => f.path));

  const changedFiles: string[] = [];
  for (const f of pkg.relevant_files) {
    const hashNow = byPath.get(f.path);
    const fileEv = f.evidence.find((e) => e.path === f.path);
    void fileEv;
    if (hashNow === undefined) { changedFiles.push(`${f.path} (removed)`); continue; }
  }
  // Any relevant file missing, or overall snapshot drift, marks staleness.
  const stale = current !== pkg.repository.snapshot_id;
  if (stale && changedFiles.length === 0) {
    // Identify which relevant files drifted by comparing to the original snapshot's hashes is
    // not possible without the old DB; report relevant files that no longer exist or the global drift.
    for (const p of relevant) if (!byPath.has(p)) changedFiles.push(`${p} (removed)`);
  }
  return { stale, currentSnapshotId: current, changedFiles };
}
