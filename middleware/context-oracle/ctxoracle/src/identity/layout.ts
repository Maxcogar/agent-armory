// Create the on-disk layout under the ctxoracle home (Step 4, AD-3, FR-X5,
// FR-X7). Directories are created owner-only (0o700) so the stores — which hold
// the owner's corrections, session logs, and mined history — are not
// world-readable (OWASP ASVS 5.0 V14; the 0o700 mode is the last-line control
// per threat T3). A directory that already exists with looser permissions is
// left untouched and reported, never `chmod`ed: it may already hold the owner's
// data, and silently altering its mode is an out-of-scope change (AD-3). This
// step returns the store/diagnostics paths; the `.db` files themselves are
// created by the migration steps, not here.

import { chmodSync, mkdirSync, statSync, type Stats } from 'node:fs';
import path from 'node:path';

export interface Layout {
  /** Absolute path to the shared global store file (`<home>/global/global.db`). */
  global: string;
  /** Absolute path to this repo's project store file (`.../store.db`). */
  project: string;
  /** Absolute path to this repo's diagnostics directory (created). */
  diagnostics: string;
  /**
   * Pre-existing layout directories whose mode is looser than 0o700. Never
   * `chmod`ed; surfaced so `status` can report them (AD-3).
   */
  looseMode: string[];
}

const OWNER_ONLY = 0o700;
/** Group + other rwx bits — any set means the directory is looser than 0o700. */
const NON_OWNER_MASK = 0o077;

/**
 * Create each missing directory of `dirs` (ordered parent-first) at 0o700 and
 * return the pre-existing ones whose mode is looser than 0o700 (never chmod-ed).
 */
function ensureDirs(dirs: string[]): string[] {
  const looseMode: string[] = [];
  for (const dir of dirs) {
    let existing: Stats | undefined;
    try {
      existing = statSync(dir);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
    }
    if (existing === undefined) {
      // Newly created with the restrictive mode in the creating call, so the
      // umask can only narrow it and no directory this call creates (including
      // a missing ancestor the recursive create makes) exists at a looser mode
      // even briefly (OWASP ASVS V14 / CWE-379; Steps 1-12 build review m3).
      // Then chmod to exactly 0o700, so the result does not depend on the
      // process umask (T-4-1 asserts the mode, not umask policy).
      mkdirSync(dir, { recursive: true, mode: OWNER_ONLY });
      chmodSync(dir, OWNER_ONLY);
    } else if ((existing.mode & NON_OWNER_MASK) !== 0) {
      looseMode.push(dir);
    }
  }
  return looseMode;
}

/**
 * Ensure the home-level layout exists: `<home>/`, `<home>/global/`, and
 * `<home>/diagnostics/` (the home-level fault channel AD-17 names), each at
 * 0o700 when created. Returns `<home>/diagnostics/` and any of the three that
 * pre-existed looser than 0o700 (Step 4 build delta, AD-3, AD-17; G35).
 *
 * Callers: `ensureLayout` (first), the handler's home-channel fault path, which
 * must be able to record `repo_not_bound` or a pre-repository fault on a
 * machine where no `init` has created a home yet, and `status`. It creates no
 * per-repository directory (AD-23, N15).
 */
export function ensureHome(home: string): { homeDiagnostics: string; looseMode: string[] } {
  const homeDiagnostics = path.join(home, 'diagnostics');
  const looseMode = ensureDirs([home, path.join(home, 'global'), homeDiagnostics]);
  return { homeDiagnostics, looseMode };
}

/**
 * Ensure the ctxoracle layout for `repoKey` exists under `home` — `ensureHome`
 * first, then the per-project directories — creating any missing directory at
 * 0o700, and return the store/diagnostics paths plus the list of pre-existing
 * directories that are looser than 0o700. Callers: `init`, the replay harness's
 * store preparation, and the store-creating verbs; never the handler.
 */
export function ensureLayout(home: string, repoKey: string): Layout {
  const globalDir = path.join(home, 'global');
  const projectsDir = path.join(home, 'projects');
  const projectDir = path.join(projectsDir, repoKey);
  const diagnostics = path.join(projectDir, 'diagnostics');

  const looseMode = ensureHome(home).looseMode;
  // Ordered parent-first so a non-recursive create always finds its parent.
  looseMode.push(...ensureDirs([projectsDir, projectDir, diagnostics]));

  return {
    global: path.join(globalDir, 'global.db'),
    project: path.join(projectDir, 'store.db'),
    diagnostics,
    looseMode,
  };
}
