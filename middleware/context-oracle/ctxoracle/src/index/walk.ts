// The repository walk (Step 14, AD-12; review G11/N7, ER M4).
//
// In a git work tree (`readGitPointer` non-null) the listing is git's own:
// `git ls-files -z --cached --others --exclude-standard` — git's
// implementation of gitignore(5), which a re-implementation would get subtly
// wrong — then the walked paths are piped to `git check-ignore --no-index
// --stdin -z`, whose printed paths are the tracked-and-ignored set (a zone
// signal; exit 1 means none). Outside git a recursive `readdir` walk, with the
// fixed exclusion of `.git` and `node_modules` directories AD-12 names, not
// following symlinks; no ignore file is consulted there, so `ignoredTracked`
// is empty. Paths arrive as bytes and are decoded by `decodePathBytes` (G7):
// a path that is not valid UTF-8 goes to `rejected`, never into `paths`.
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { readGitPointer } from '../identity/git_layout.js';
import { oracleRunSync } from '../util/spawn.js';
import { decodePathBytes, splitNul } from '../util/path_bytes.js';

export interface WalkResult {
  mode: 'git' | 'readdir';
  paths: string[];
  rejected: Buffer[];
  ignoredTracked: Set<string>;
}

/** The directory names the `readdir` walk never enters (AD-12's fixed exclusion). */
const READDIR_EXCLUDED = new Set(['.git', 'node_modules']);
const GIT_MAX_BUFFER = 256 * 1024 * 1024;

function gitWalk(repoPath: string): WalkResult {
  const ls = oracleRunSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
    cwd: repoPath,
    maxBuffer: GIT_MAX_BUFFER,
  });
  if (ls.status !== 0) {
    throw new Error(`git ls-files failed (exit ${ls.status}): ${ls.stderr.toString('utf8').trim()}`);
  }
  const seen = new Set<string>();
  const paths: string[] = [];
  const accepted: Buffer[] = [];
  const rejected: Buffer[] = [];
  const rejectedSeen = new Set<string>();
  for (const bytes of splitNul(ls.stdout)) {
    if (bytes.length === 0) continue;
    const p = decodePathBytes(bytes);
    if (p === null) {
      // An unmerged path is listed once per stage; count each byte string once.
      const hex = bytes.toString('hex');
      if (!rejectedSeen.has(hex)) {
        rejectedSeen.add(hex);
        rejected.push(Buffer.from(bytes));
      }
      continue;
    }
    if (seen.has(p)) continue;
    seen.add(p);
    paths.push(p);
    accepted.push(bytes);
  }
  const ignoredTracked = new Set<string>();
  if (accepted.length > 0) {
    const input = Buffer.concat(accepted.flatMap((b) => [b, Buffer.from([0])]));
    const ci = oracleRunSync('git', ['check-ignore', '--no-index', '--stdin', '-z'], {
      cwd: repoPath,
      input,
      maxBuffer: GIT_MAX_BUFFER,
    });
    // Exit 0: some path printed; 1: none is ignored; anything else is an error.
    if (ci.status !== 0 && ci.status !== 1) {
      throw new Error(`git check-ignore failed (exit ${ci.status}): ${ci.stderr.toString('utf8').trim()}`);
    }
    for (const bytes of splitNul(ci.stdout)) {
      const p = decodePathBytes(bytes);
      if (p !== null && p !== '') ignoredTracked.add(p);
    }
  }
  return { mode: 'git', paths, rejected, ignoredTracked };
}

function readdirWalk(repoPath: string): WalkResult {
  const paths: string[] = [];
  const rejected: Buffer[] = [];
  const visit = (absDir: string, relPrefix: string, relBytes: Buffer): void => {
    const entries = readdirSync(absDir, { withFileTypes: true, encoding: 'buffer' });
    for (const e of entries) {
      const nameBytes = e.name;
      const entryBytes = relBytes.length === 0 ? Buffer.from(nameBytes) : Buffer.concat([relBytes, Buffer.from('/'), nameBytes]);
      // Symlinks are not followed (a link can leave the tree or loop).
      if (e.isSymbolicLink()) continue;
      const name = decodePathBytes(nameBytes);
      if (e.isDirectory()) {
        if (name !== null && READDIR_EXCLUDED.has(name)) continue;
        if (name === null) {
          // A directory whose name is not UTF-8: one rejected entry, not descended
          // (no path beneath it could be decoded either).
          rejected.push(entryBytes);
          continue;
        }
        visit(path.join(absDir, name), relPrefix === '' ? name : `${relPrefix}/${name}`, entryBytes);
      } else if (e.isFile()) {
        if (name === null) {
          rejected.push(entryBytes);
          continue;
        }
        paths.push(relPrefix === '' ? name : `${relPrefix}/${name}`);
      }
    }
  };
  visit(repoPath, '', Buffer.alloc(0));
  paths.sort();
  return { mode: 'readdir', paths, rejected, ignoredTracked: new Set() };
}

export function walkRepository(repoPath: string): WalkResult {
  return readGitPointer(repoPath) === null ? readdirWalk(repoPath) : gitWalk(repoPath);
}
