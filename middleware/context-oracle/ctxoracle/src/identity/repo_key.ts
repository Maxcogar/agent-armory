// Repository identity resolver (Step 5, AD-3). Derives a stable per-repo key so
// one repository's knowledge lands in exactly one store, applying four rules in
// order. `init` performs NO `git fetch` (FR-X5); every git call goes through the
// guarded spawn seam.
//
// The four rules (first match wins):
//   1. Not inside a git work tree (probe fails, exit 128; or prints `false`
//      from inside a `.git` dir) -> rule 4.
//   2. Shallow repository -> the NORMALIZED origin URL when a remote exists
//      (mode 'url'); no remote (or a bare local origin) -> rule 4. Shallow
//      repos never key on history: the shallow commit set varies per clone
//      (V13), so keying on it would split one repo across clones.
//   3. Full history -> the lexicographically smallest root commit
//      (`git rev-list --max-parents=0 HEAD`; traversal order is not a specified
//      property of rev-list, so we sort) (mode 'commit').
//   4. Fallback -> SHA-256 of the real path (mode 'path'), always with a
//      diagnostic naming why history/URL could not be used.
//
// The key is the first 12 hex chars of SHA-256 over the identity string. `status`
// prints the mode and identity so any residual split (e.g. a case-sensitive host
// serving two clones written in different path case) is visible, not silent.

import { realpathSync } from 'node:fs';
import { sha256Hex } from '../util/hash.js';
import { oracleExecFileSync } from '../util/spawn.js';
import { gitChildEnv } from './git_layout.js';

export type RepoKeyMode = 'commit' | 'url' | 'path';

export interface RepoKey {
  /** First 12 hex chars of SHA-256 over `identity`. */
  key: string;
  mode: RepoKeyMode;
  /** The string the key hashes: root commit, normalized URL, or real path. */
  identity: string;
  /**
   * Present only when the resolver fell back to path mode because a git probe
   * failed or returned unusable output. `detail` carries the command and its
   * exit code so `init` (Step 31) can raise it as a fault. Full/URL keys carry
   * no diagnostic.
   */
  diagnostic?: { detail: string };
}

type GitResult = { ok: true; stdout: string } | { ok: false; code: number | null; stderr: string };

function gitProbe(cwd: string, args: string[]): GitResult {
  try {
    // env: the repository-selecting variables removed, so an inherited GIT_DIR
    // cannot bind the wrong store (Step 14 build review m1, plan Step 14).
    return { ok: true, stdout: oracleExecFileSync('git', args, { cwd, env: gitChildEnv() }) };
  } catch (e) {
    const err = e as { status?: number | null; stderr?: string | Buffer };
    const stderr =
      typeof err.stderr === 'string' ? err.stderr : err.stderr !== undefined ? err.stderr.toString() : '';
    return { ok: false, code: err.status ?? null, stderr };
  }
}

function firstLine(s: string): string {
  return s.split('\n', 1)[0]!.trim();
}

function keyOf(identity: string): string {
  return sha256Hex(identity).slice(0, 12);
}

function pathKey(repoPath: string, detail: string): RepoKey {
  const identity = realpathSync(repoPath);
  return { key: keyOf(identity), mode: 'path', identity, diagnostic: { detail } };
}

export function resolveRepoKey(repoPath: string): RepoKey {
  // Rule 1 — inside a work tree?
  const inside = gitProbe(repoPath, ['rev-parse', '--is-inside-work-tree']);
  if (!inside.ok) {
    const stderr = firstLine(inside.stderr);
    return pathKey(
      repoPath,
      `git rev-parse --is-inside-work-tree exited ${inside.code ?? 'null'}${stderr ? `: ${stderr}` : ''}`
    );
  }
  if (inside.stdout.trim() !== 'true') {
    return pathKey(
      repoPath,
      `git rev-parse --is-inside-work-tree printed ${JSON.stringify(inside.stdout.trim())} (not inside a work tree)`
    );
  }

  // Rule 2 — shallow?
  const shallow = gitProbe(repoPath, ['rev-parse', '--is-shallow-repository']);
  if (!shallow.ok) {
    return pathKey(repoPath, `git rev-parse --is-shallow-repository exited ${shallow.code ?? 'null'}`);
  }
  const shallowOut = shallow.stdout.trim();
  if (shallowOut === 'true') {
    const origin = gitProbe(repoPath, ['config', '--get', 'remote.origin.url']);
    if (origin.ok && origin.stdout.trim() !== '') {
      const raw = origin.stdout.trim();
      const identity = normalizeRemoteUrl(raw);
      if (identity !== null) return { key: keyOf(identity), mode: 'url', identity };
      return pathKey(repoPath, `shallow repository origin ${JSON.stringify(raw)} is a local path; path-keyed`);
    }
    return pathKey(repoPath, 'shallow repository has no origin remote; path-keyed');
  }
  if (shallowOut !== 'false') {
    return pathKey(
      repoPath,
      `git rev-parse --is-shallow-repository printed ${JSON.stringify(shallowOut)} (expected true/false)`
    );
  }

  // Rule 3 — full history: lex-smallest root commit.
  const roots = gitProbe(repoPath, ['rev-list', '--max-parents=0', 'HEAD']);
  if (!roots.ok) {
    return pathKey(repoPath, `git rev-list --max-parents=0 HEAD exited ${roots.code ?? 'null'}`);
  }
  const hashes = roots.stdout
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .sort();
  if (hashes.length === 0) {
    return pathKey(repoPath, 'git rev-list --max-parents=0 HEAD returned no root commit; path-keyed');
  }
  const identity = hashes[0]!;
  return { key: keyOf(identity), mode: 'commit', identity };
}

/**
 * Normalize a git remote URL to the identity string `host[:port]/path`, or
 * `null` for a bare local path (which routes to path mode). Axes, all stated:
 * accept the scheme form `scheme://[user@]host[:port]/path` and the scp-like
 * form `[user@]host:path`; drop user-info; lowercase scheme and host; keep an
 * explicit port; strip a trailing `/` and a trailing `.git`; keep path case.
 * The scheme itself is dropped, so an SSH and an HTTPS clone of the same remote
 * key identically. Path case is deliberately NOT folded — that would merge
 * distinct repositories on case-sensitive hosts (AD-3).
 */
export function normalizeRemoteUrl(raw: string): string | null {
  const url = raw.trim();

  const scheme = /^([a-zA-Z][a-zA-Z0-9+.-]*):\/\/(.*)$/.exec(url);
  if (scheme !== null) {
    if (scheme[1]!.toLowerCase() === 'file') return null; // local -> path mode
    const rest = scheme[2]!;
    const slash = rest.indexOf('/');
    let authority = slash === -1 ? rest : rest.slice(0, slash);
    const pathPart = slash === -1 ? '' : rest.slice(slash + 1);
    const at = authority.lastIndexOf('@');
    if (at !== -1) authority = authority.slice(at + 1); // drop user-info
    const colon = authority.indexOf(':');
    const host = (colon === -1 ? authority : authority.slice(0, colon)).toLowerCase();
    const port = colon === -1 ? '' : authority.slice(colon); // includes the ':'
    return `${host}${port}/${cleanPath(pathPart)}`;
  }

  // scp-like: [user@]host:path — no scheme, and not an absolute/relative local path.
  const scp = /^(?:[^/@]+@)?([^/:]+):(.+)$/.exec(url);
  if (scp !== null && !url.startsWith('/') && !url.startsWith('.')) {
    const host = scp[1]!.toLowerCase();
    return `${host}/${cleanPath(scp[2]!)}`;
  }

  return null; // bare local path -> path mode
}

/** Strip leading slashes, a trailing slash, and a trailing `.git`; keep case. */
function cleanPath(p: string): string {
  return p.replace(/^\/+/, '').replace(/\/+$/, '').replace(/\.git$/, '');
}
