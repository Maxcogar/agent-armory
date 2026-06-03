import { CHARACTER_LIMIT } from "../constants.js";
import { runCodex } from "./codex.js";
import { runGemini } from "./gemini.js";
import { applyPersona, loadPersona } from "./persona.js";
import {
  captureDiff,
  cleanupWorktree,
  createWorktree,
  isGitRepo,
} from "./worktree.js";
import type {
  DispatchOptions,
  DispatchResult,
  ExitStatus,
  FileChange,
} from "../types.js";

/**
 * Run a single dispatch end-to-end:
 *   1. Resolve persona (if any) → final prompt
 *   2. Set up isolation (worktree or in-place cwd)
 *   3. Run the chosen backend with a timeout
 *   4. Capture diff (worktree mode only)
 *   5. Clean up worktree
 *   6. Return unified DispatchResult
 *
 * Never throws — every failure mode is reflected in exit_status and
 * error_message so the MCP layer can surface a clean, structured
 * error rather than a stack trace.
 */
export async function dispatch(
  opts: DispatchOptions,
): Promise<DispatchResult> {
  const startedAt = Date.now();

  // Build the prompt first — fail fast on missing persona.
  let prompt: string;
  try {
    if (opts.persona) {
      const personaText = await loadPersona(opts.persona);
      prompt = applyPersona(opts.prompt, personaText);
    } else {
      prompt = opts.prompt;
    }
  } catch (err) {
    return errorResult(opts, "error", err, startedAt);
  }

  // Set up the run directory based on isolation mode.
  let runDir = opts.working_dir;
  let worktreePath: string | null = null;
  // skipGitRepoCheck only matters for codex; gemini doesn't have an
  // equivalent gate. We compute it here so all downstream paths agree:
  //   - worktree mode: always false (worktrees ARE git repos)
  //   - cwd mode + git repo: false (let codex enforce its own check)
  //   - cwd mode + non-git dir: true (user explicitly opted out of isolation)
  let skipGitRepoCheck = false;

  if (opts.isolation === "worktree") {
    const repoOk = await isGitRepo(opts.working_dir);
    if (!repoOk) {
      return {
        backend: opts.backend,
        exit_status: "not_a_git_repo",
        final_response: "",
        files_changed: [],
        diff: "",
        diff_truncated: false,
        duration_s: secondsSince(startedAt),
        usage: null,
        stderr_tail: null,
        worktree_path: null,
        error_message: `working_dir '${opts.working_dir}' is not inside a git repository. Use isolation='cwd' or run from a git repo.`,
      };
    }
    try {
      worktreePath = await createWorktree(opts.working_dir);
      runDir = worktreePath;
    } catch (err) {
      return errorResult(opts, "error", err, startedAt);
    }
  } else {
    // cwd mode — let codex skip its git check if we're not in a repo.
    skipGitRepoCheck = !(await isGitRepo(opts.working_dir));
  }

  // Run the backend with a timeout-bound AbortSignal.
  const ac = new AbortController();
  const timeoutMs = opts.timeout_s * 1000;
  const timer = setTimeout(() => ac.abort(), timeoutMs);

  let finalResponse = "";
  let usage = null;
  let stderrTail: string | null = null;
  let backendOk = false;
  let backendError: string | null = null;

  try {
    if (opts.backend === "codex") {
      const r = await runCodex({
        prompt,
        workingDirectory: runDir,
        dangerous: opts.dangerous_mode,
        skipGitRepoCheck,
        ...(opts.model ? { model: opts.model } : {}),
        signal: ac.signal,
      });
      finalResponse = r.final_response;
      usage = r.usage;
      backendOk = r.ok;
      backendError = r.error_message;
    } else {
      const r = await runGemini({
        prompt,
        workingDirectory: runDir,
        dangerous: opts.dangerous_mode,
        ...(opts.model ? { model: opts.model } : {}),
        signal: ac.signal,
      });
      finalResponse = r.final_response;
      usage = r.usage;
      backendOk = r.ok;
      backendError = r.error_message;
      stderrTail = r.stderr_tail;
    }
  } finally {
    clearTimeout(timer);
  }

  // Capture diff if we used worktree isolation.
  let files: FileChange[] = [];
  let diff = "";
  let diffTruncated = false;
  if (worktreePath !== null) {
    try {
      const captured = await captureDiff(worktreePath);
      files = captured.files;
      if (captured.diff.length > CHARACTER_LIMIT) {
        diff = captured.diff.slice(0, CHARACTER_LIMIT);
        diffTruncated = true;
      } else {
        diff = captured.diff;
      }
    } catch (err) {
      // Diff capture failure is non-fatal — we still have the response.
      // Surface it via stderr_tail so the caller can see what went wrong.
      const msg = err instanceof Error ? err.message : String(err);
      stderrTail = (stderrTail ?? "") + `\n[diff capture failed: ${msg}]`;
    } finally {
      await cleanupWorktree(opts.working_dir, worktreePath);
    }
  }

  // Map backend result to ExitStatus.
  let exitStatus: ExitStatus;
  if (backendOk) {
    exitStatus = "ok";
  } else if (ac.signal.aborted) {
    exitStatus = "timeout";
  } else if (backendError && /auth/i.test(backendError)) {
    exitStatus = "auth_not_configured";
  } else {
    exitStatus = "error";
  }

  // Truncate final_response if needed too.
  if (finalResponse.length > CHARACTER_LIMIT) {
    finalResponse = finalResponse.slice(0, CHARACTER_LIMIT) +
      `\n\n[truncated: response exceeded ${CHARACTER_LIMIT} chars]`;
  }

  return {
    backend: opts.backend,
    exit_status: exitStatus,
    final_response: finalResponse,
    files_changed: files,
    diff,
    diff_truncated: diffTruncated,
    duration_s: secondsSince(startedAt),
    usage,
    stderr_tail: stderrTail,
    worktree_path: worktreePath,
    error_message: backendError,
  };
}

/**
 * Build a DispatchResult representing a pre-run failure (persona load,
 * worktree setup, etc.).
 */
function errorResult(
  opts: DispatchOptions,
  exitStatus: ExitStatus,
  err: unknown,
  startedAt: number,
): DispatchResult {
  const msg = err instanceof Error ? err.message : String(err);
  return {
    backend: opts.backend,
    exit_status: exitStatus,
    final_response: "",
    files_changed: [],
    diff: "",
    diff_truncated: false,
    duration_s: secondsSince(startedAt),
    usage: null,
    stderr_tail: null,
    worktree_path: null,
    error_message: msg,
  };
}

function secondsSince(startedAt: number): number {
  return Math.round((Date.now() - startedAt) / 100) / 10;
}
