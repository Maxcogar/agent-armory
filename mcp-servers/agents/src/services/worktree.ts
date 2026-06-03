import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import type { FileChange } from "../types.js";

const execFileAsync = promisify(execFile);

/**
 * Run a git command in a given directory. Returns stdout. Throws on
 * non-zero exit, attaching stderr to the error message.
 */
async function git(
  cwd: string,
  args: readonly string[],
): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", args as string[], {
      cwd,
      maxBuffer: 50 * 1024 * 1024, // 50 MB — diffs can be large
    });
    return stdout;
  } catch (err) {
    const e = err as NodeJS.ErrnoException & { stderr?: string };
    const detail = e.stderr ? `: ${e.stderr.trim()}` : "";
    throw new Error(`git ${args.join(" ")} failed${detail}`);
  }
}

/**
 * Verify that `dir` is inside a git working tree. Returns true if so,
 * false if not (or if git isn't installed / dir doesn't exist).
 */
export async function isGitRepo(dir: string): Promise<boolean> {
  try {
    const out = await git(dir, ["rev-parse", "--is-inside-work-tree"]);
    return out.trim() === "true";
  } catch {
    return false;
  }
}

/**
 * Create a fresh git worktree from HEAD of the repo at `parentDir`.
 *
 * Strategy: `git worktree add --detach <tmp> HEAD`. The detached HEAD
 * means the worktree isn't tied to a branch — the subagent's commits
 * (if any) won't pollute branch history, and we can throw away the
 * whole thing without ceremony.
 *
 * Returns the absolute path of the new worktree.
 */
export async function createWorktree(parentDir: string): Promise<string> {
  // Make a unique temp directory first so we know the path is free.
  // mkdtemp returns the actual path with the random suffix appended.
  const stagingParent = await mkdtemp(join(tmpdir(), "subagent-"));
  // git worktree refuses to add to an existing non-empty dir, so we
  // ask it to create a sibling we own.
  const worktreePath = join(stagingParent, "wt");

  await git(parentDir, ["worktree", "add", "--detach", worktreePath, "HEAD"]);
  return worktreePath;
}

/**
 * Capture the diff produced by a subagent inside its worktree.
 *
 * Uses `git add -A` to stage every change (including new and deleted
 * files), then `git diff --cached HEAD` to get a complete unified diff,
 * and `git diff --cached --name-status HEAD` for the file list.
 *
 * We stage rather than diff-untracked because git's untracked diff
 * machinery is awkward; staging-then-resetting is simpler and the
 * worktree gets thrown away anyway.
 */
export async function captureDiff(
  worktreePath: string,
): Promise<{ diff: string; files: FileChange[] }> {
  // Stage every change so untracked files appear in the diff.
  await git(worktreePath, ["add", "-A"]);

  const diff = await git(worktreePath, ["diff", "--cached", "HEAD"]);
  const nameStatus = await git(worktreePath, [
    "diff",
    "--cached",
    "--name-status",
    "HEAD",
  ]);

  const files = parseNameStatus(nameStatus);
  return { diff, files };
}

/**
 * Parse the output of `git diff --name-status` into FileChange records.
 *
 * Format per line: <STATUS>\t<PATH> (or <STATUS>\t<OLD>\t<NEW> for
 * renames). Status codes: A = added, M = modified, D = deleted,
 * R### = renamed with similarity %, C### = copied.
 */
function parseNameStatus(raw: string): FileChange[] {
  const out: FileChange[] = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    const parts = line.split("\t");
    const code = parts[0] ?? "";
    const path = parts[parts.length - 1] ?? "";
    if (!code || !path) continue;

    const first = code[0];
    if (first === "A") {
      out.push({ path, status: "added" });
    } else if (first === "M") {
      out.push({ path, status: "modified" });
    } else if (first === "D") {
      out.push({ path, status: "deleted" });
    } else if (first === "R" || first === "C") {
      out.push({ path, status: "renamed" });
    } else {
      // Unknown — surface as untracked rather than silently drop.
      out.push({ path, status: "untracked" });
    }
  }
  return out;
}

/**
 * Tear down a worktree created by createWorktree. Always succeeds —
 * errors are swallowed because cleanup happens in finally blocks where
 * throwing would mask the real error.
 *
 * Strategy: `git worktree remove --force` to deregister, then rm -rf
 * the staging parent dir we created. Both are best-effort.
 */
export async function cleanupWorktree(
  parentDir: string,
  worktreePath: string,
): Promise<void> {
  try {
    await git(parentDir, ["worktree", "remove", "--force", worktreePath]);
  } catch {
    // ignore — we'll still try to rm the directory
  }
  try {
    // worktreePath is .../subagent-XXXX/wt — remove the parent so the
    // mkdtemp dir is also cleaned up.
    const stagingParent = join(worktreePath, "..");
    await rm(stagingParent, { recursive: true, force: true });
  } catch {
    // ignore — these temp dirs are tiny and OS will eventually clean
  }
}
