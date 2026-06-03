/**
 * Minimal unified-diff parser. Extracts per-file change records (path, created,
 * deleted, added/removed lines) from `git diff` output so the patch reviewer can
 * reason about scope and content without a git dependency.
 */
export interface FileDiff {
  path: string;
  created: boolean;
  deleted: boolean;
  addedLines: string[];
  removedLines: string[];
}

export function parseUnifiedDiff(diff: string): FileDiff[] {
  const files: FileDiff[] = [];
  let cur: FileDiff | null = null;
  const lines = diff.split('\n');

  for (const line of lines) {
    if (line.startsWith('diff --git')) {
      if (cur) files.push(cur);
      const m = line.match(/ b\/(.+)$/);
      cur = { path: m ? m[1]! : 'unknown', created: false, deleted: false, addedLines: [], removedLines: [] };
    } else if (!cur) {
      continue;
    } else if (line.startsWith('new file mode')) {
      cur.created = true;
    } else if (line.startsWith('deleted file mode')) {
      cur.deleted = true;
    } else if (line.startsWith('+++ b/')) {
      cur.path = line.slice(6).trim();
    } else if (line.startsWith('+++ ') && line.includes('/dev/null')) {
      cur.deleted = true;
    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      cur.addedLines.push(line.slice(1));
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      cur.removedLines.push(line.slice(1));
    }
  }
  if (cur) files.push(cur);
  return files;
}
