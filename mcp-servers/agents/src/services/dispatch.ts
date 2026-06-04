import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

import type { CodexRunResult } from "./codex.js";
import { runCodex } from "./codex.js";
import { runGemini } from "./gemini.js";
import {
  captureDiff,
  cleanupWorktree,
  createWorktree,
  isGitRepo,
} from "./worktree.js";
import { DIFF_TRUNCATION_BYTES } from "../constants.js";
import type { DispatchOptions, DispatchResult, FileChange } from "../types.js";

async function loadPersona(name: string): Promise<string | null> {
  const path = join(homedir(), ".subagent-mcp", "personas", `${name}.md`);
  try {
    return await readFile(path, "utf-8");
  } catch {
    return null;
  }
}

function classifyExitStatus(
  error: string | null,
): DispatchResult["exit_status"] {
  if (!error) return "ok";
  const lower = error.toLowerCase();
  if (lower.includes("timed out") || lower.includes("timeout")) return "timeout";
  if (
    lower.includes("auth") ||
    lower.includes("login") ||
    lower.includes("not authenticated") ||
    lower.includes("unauthorized") ||
    lower.includes("credentials") ||
    lower.includes("401")
  ) {
    return "auth_not_configured";
  }
  return "error";
}

export async function dispatch(opts: DispatchOptions): Promise<DispatchResult> {
  const startMs = Date.now();

  let prompt = opts.prompt;
  if (opts.persona) {
    const personaText = await loadPersona(opts.persona);
    if (personaText) {
      prompt = `${personaText}\n\n---\n\n${prompt}`;
    }
  }

  if (opts.isolation === "worktree") {
    const isRepo = await isGitRepo(opts.working_dir);
    if (!isRepo) {
      return {
        backend: opts.backend,
        exit_status: "not_a_git_repo",
        final_response: "",
        files_changed: [],
        diff: "",
        diff_truncated: false,
        duration_s: (Date.now() - startMs) / 1000,
        usage: null,
        stderr_tail: null,
        worktree_path: null,
        error_message: `Not inside a git repository: ${opts.working_dir}. Use isolation='cwd' or run from within a git repo.`,
      };
    }
  }

  let worktreePath: string | null = null;
  if (opts.isolation === "worktree") {
    try {
      worktreePath = await createWorktree(opts.working_dir);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        backend: opts.backend,
        exit_status: "error",
        final_response: "",
        files_changed: [],
        diff: "",
        diff_truncated: false,
        duration_s: (Date.now() - startMs) / 1000,
        usage: null,
        stderr_tail: null,
        worktree_path: null,
        error_message: `Failed to create git worktree: ${msg}`,
      };
    }
  }

  const effectiveDir = worktreePath ?? opts.working_dir;
  const signal = AbortSignal.timeout(opts.timeout_s * 1000);

  try {
    let runResult: CodexRunResult | Awaited<ReturnType<typeof runGemini>>;

    if (opts.backend === "codex") {
      runResult = await runCodex({
        prompt,
        workingDirectory: effectiveDir,
        dangerous: opts.dangerous_mode,
        skipGitRepoCheck: opts.isolation === "cwd",
        ...(opts.model ? { model: opts.model } : {}),
        signal,
      });
    } else {
      runResult = await runGemini({
        prompt,
        workingDirectory: effectiveDir,
        dangerous: opts.dangerous_mode,
        ...(opts.model ? { model: opts.model } : {}),
        signal,
      });
    }

    let diff = "";
    let files_changed: FileChange[] = [];
    let diff_truncated = false;

    if (worktreePath) {
      try {
        const captured = await captureDiff(worktreePath);
        diff = captured.diff;
        files_changed = captured.files;
        if (diff.length > DIFF_TRUNCATION_BYTES) {
          diff = diff.slice(0, DIFF_TRUNCATION_BYTES);
          diff_truncated = true;
        }
      } catch {
        // Non-fatal — diff unavailable, files_changed stays empty
      }
    }

    const exit_status = classifyExitStatus(runResult.error_message);
    const stderr_tail =
      "stderr_tail" in runResult ? runResult.stderr_tail : null;

    return {
      backend: opts.backend,
      exit_status,
      final_response: runResult.final_response,
      files_changed,
      diff,
      diff_truncated,
      duration_s: (Date.now() - startMs) / 1000,
      usage: runResult.usage,
      stderr_tail,
      worktree_path: worktreePath,
      error_message: runResult.error_message,
    };
  } finally {
    if (worktreePath) {
      await cleanupWorktree(opts.working_dir, worktreePath);
    }
  }
}
