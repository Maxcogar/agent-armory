// `.git` pointer reading by bounded file reads (Step 14, AD-23; D-plan-30).
//
// `<dir>/.git` is either the git directory itself or a file whose `gitdir:`
// line names it (a linked worktree or a submodule); a worktree's git directory
// holds a `commondir` file naming the shared directory (refs, packed-refs)
// relative to itself (executed on git 2.43.0: `../..`). Every read here is a
// bounded file read — never a `git` subprocess, which AD-23's event-path
// inventory forbids — so `resolveHead` (Step 14) and the handler's repository
// walk (Step 28) can call it on the event path.
//
// A `.git` directory counts only when it is a real git directory: one holding a
// `HEAD` file. A `.git` directory with no `HEAD` (a stray `.git/config`) is
// treated as absent — git itself answers `fatal: not a git repository` there
// (executed on git 2.43.0; plan Step 14, the Step 14 test writer's note).
import { closeSync, openSync, readSync, statSync } from 'node:fs';
import path from 'node:path';

export type GitPointer = { kind: 'dir'; gitDir: string } | { kind: 'file'; gitDir: string; commonDir: string };

/** A pointer file (`.git`, `commondir`) is one short line; nothing legitimate comes near this. */
const POINTER_MAX_BYTES = 4096;

/** At most `max` bytes of `file` as UTF-8, or null when it cannot be read. */
function readBounded(file: string, max: number): string | null {
  let fd: number;
  try {
    fd = openSync(file, 'r');
  } catch {
    return null;
  }
  try {
    const buf = Buffer.alloc(max);
    let n = 0;
    while (n < max) {
      const got = readSync(fd, buf, n, max - n, null);
      if (got === 0) break;
      n += got;
    }
    return buf.subarray(0, n).toString('utf8');
  } catch {
    return null;
  } finally {
    closeSync(fd);
  }
}

function isFile(p: string): boolean {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}

export function readGitPointer(dir: string): GitPointer | null {
  const dotGit = path.join(dir, '.git');
  let st;
  try {
    st = statSync(dotGit);
  } catch {
    return null;
  }
  if (st.isDirectory()) {
    return isFile(path.join(dotGit, 'HEAD')) ? { kind: 'dir', gitDir: dotGit } : null;
  }
  if (!st.isFile()) return null;
  const text = readBounded(dotGit, POINTER_MAX_BYTES);
  if (text === null) return null;
  const m = /^gitdir:[ \t]*(.+?)[ \t]*$/m.exec(text);
  if (m === null) return null;
  const gitDir = path.resolve(dir, m[1] as string);
  const commondir = readBounded(path.join(gitDir, 'commondir'), POINTER_MAX_BYTES);
  const common = commondir === null ? '' : commondir.trim();
  const commonDir = common === '' ? gitDir : path.resolve(gitDir, common);
  return { kind: 'file', gitDir, commonDir };
}

/** The variables git exports to hooks that select a repository other than the working directory's. */
const REPO_SELECTING_ENV = ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_OBJECT_DIRECTORY', 'GIT_COMMON_DIR'] as const;

/**
 * `process.env` less the repository-selecting variables (Step 14 build review
 * m1). git exports `GIT_DIR`/`GIT_WORK_TREE` to hooks, and githooks(5) says a
 * hook invoking git on another repository "should clear these environment
 * variables"; every git child the indexer, the miner, and the repository-key
 * resolver start is passed this environment and `cwd` = the checkout root, so
 * git selects the repository from the directory the oracle chose.
 */
export function gitChildEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env };
  for (const name of REPO_SELECTING_ENV) delete env[name];
  return env;
}
