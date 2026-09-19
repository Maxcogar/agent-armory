// The ONLY file in the codebase that imports node:child_process (Step 5, AD-21,
// FR-J4). Every process the oracle starts goes through this seam: the git
// subprocesses in the resolver, the miner's `git log` (Step 13), the detached
// reindex/integrity child (Steps 14, 28), and the future host-CLI model call.
//
// Two structural properties live here so no call site can forget them:
//   1. Every child carries CTXORACLE_INTERNAL=1 — the recursion guard (AD-21):
//      a child that is itself a coding-agent invocation must not re-trigger the
//      oracle's hooks. Making it a property of the single spawn seam means the
//      first forgotten call site cannot turn the Phase B piggyback into a hook
//      recursion.
//   2. With `scrub: true`, the child's environment drops exactly the
//      session-identity set (SCRUBBED_ENV) — the variables that make a
//      `claude -p` child attach to the parent's session. Authentication and
//      routing variables (ANTHROPIC_*, credentials) are inherited untouched:
//      the piggyback is the host's own access (OL-7, spec §10).
//
// A convention test (child_process_single_importer.test.ts) enforces that this
// is the sole importer under either specifier spelling.

import {
  execFileSync,
  spawn,
  type ChildProcess,
  type SpawnOptions,
} from 'node:child_process';

/**
 * The session-identity variables scrubbed from a child's environment on
 * `scrub: true`. Removing exactly this set makes a `claude -p` child report a
 * fresh session_id while still authenticating (verified 2026-09-07, §11.4).
 */
export const SCRUBBED_ENV = [
  'CLAUDECODE',
  'CLAUDE_CODE_SESSION_ID',
  'CLAUDE_CODE_REMOTE_SESSION_ID',
  'CLAUDE_CODE_CHILD_SESSION',
  'CLAUDE_PID',
  'CLAUDE_CODE_ENTRYPOINT',
] as const;

export interface OracleSpawnOptions {
  cwd: string;
  env?: NodeJS.ProcessEnv;
  detached?: boolean;
  scrub?: boolean;
}

export interface OracleExecOptions {
  cwd: string;
  env?: NodeJS.ProcessEnv;
  scrub?: boolean;
  maxBuffer?: number;
}

/** Build the child environment: base (given or inherited), scrubbed on request,
 *  with the recursion guard always set. */
function childEnv(opts: { env?: NodeJS.ProcessEnv; scrub?: boolean }): NodeJS.ProcessEnv {
  const out: NodeJS.ProcessEnv = { ...(opts.env ?? process.env) };
  if (opts.scrub === true) {
    for (const name of SCRUBBED_ENV) delete out[name];
  }
  out.CTXORACLE_INTERNAL = '1';
  return out;
}

/** Start a child process through the guarded seam. */
export function oracleSpawn(cmd: string, args: string[], opts: OracleSpawnOptions): ChildProcess {
  const spawnOpts: SpawnOptions = {
    cwd: opts.cwd,
    env: childEnv(opts),
    detached: opts.detached === true,
    stdio: opts.detached === true ? 'ignore' : 'inherit',
  };
  return spawn(cmd, args, spawnOpts);
}

/**
 * Run a child synchronously through the guarded seam and return its stdout.
 * Throws the standard `execFileSync` error on a non-zero exit; the error carries
 * `.status` (exit code) and `.stderr`, which callers that expect failure (the
 * repo-key resolver's git probes) catch and inspect.
 */
export function oracleExecFileSync(cmd: string, args: string[], opts: OracleExecOptions): string {
  return execFileSync(cmd, args, {
    cwd: opts.cwd,
    env: childEnv(opts),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: opts.maxBuffer ?? 64 * 1024 * 1024,
  });
}
