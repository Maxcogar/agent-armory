import { z } from "zod";

import {
  DEFAULT_PARALLEL_CONCURRENCY,
  DEFAULT_TIMEOUT_S,
  MAX_PARALLEL_JOBS,
} from "../constants.js";

/**
 * Input schema for subagent_dispatch.
 *
 * Note: working_dir is optional in the schema but is resolved to
 * process.cwd() before the orchestrator sees it, so the post-validation
 * shape always has a string.
 */
export const DispatchInputSchema = z
  .object({
    backend: z
      .enum(["codex", "gemini"])
      .describe(
        "Which subagent CLI to dispatch to. 'codex' is OpenAI's gpt-5-codex via @openai/codex-sdk; 'gemini' is Google's gemini-cli.",
      ),
    prompt: z
      .string()
      .min(1, "prompt must not be empty")
      .max(200_000, "prompt exceeds 200K characters")
      .describe(
        "The full instruction for the subagent. The subagent has zero context beyond this prompt — be specific about goals, constraints, and what you want returned.",
      ),
    persona: z
      .string()
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "persona must be alphanumeric with hyphens/underscores only",
      )
      .optional()
      .describe(
        "Optional persona name (e.g. 'rust-reviewer'). Loaded from ~/.subagent-mcp/personas/<name>.md and prepended to the prompt.",
      ),
    working_dir: z
      .string()
      .optional()
      .describe(
        "Absolute path the subagent runs in. Defaults to the MCP server's process.cwd() (typically the project root when launched by Claude Code).",
      ),
    isolation: z
      .enum(["worktree", "cwd"])
      .default("worktree")
      .describe(
        "'worktree' (default) creates a disposable git worktree at HEAD, runs there, captures the diff, and discards. 'cwd' runs in working_dir directly with live file edits.",
      ),
    timeout_s: z
      .number()
      .int()
      .min(10)
      .max(3_600)
      .default(DEFAULT_TIMEOUT_S)
      .describe(
        "Hard cutoff in seconds. On timeout the subagent receives SIGTERM (gemini) or its run promise is abandoned (codex) and exit_status='timeout' is returned.",
      ),
    model: z
      .string()
      .min(1)
      .optional()
      .describe(
        "Override the backend's default model. Examples: 'gpt-5-codex', 'gpt-5', 'gemini-2.5-pro', 'gemini-3-pro-preview'.",
      ),
    dangerous_mode: z
      .boolean()
      .default(false)
      .describe(
        "When true, codex runs with sandboxMode='danger-full-access' and gemini runs with --yolo (auto-approves all shell commands). When false (default), codex limits writes to the workspace and gemini cannot execute any tool that requires approval — text-only effectively. Note: gemini in non-dangerous mode will hang and timeout if the model tries to use a tool.",
      ),
  })
  .strict();

export type DispatchInput = z.infer<typeof DispatchInputSchema>;

/**
 * Output schema for subagent_dispatch — describes the structuredContent
 * returned to the MCP client.
 */
export const DispatchOutputSchema = z
  .object({
    backend: z.enum(["codex", "gemini"]),
    exit_status: z.enum([
      "ok",
      "timeout",
      "error",
      "auth_not_configured",
      "not_a_git_repo",
    ]),
    final_response: z
      .string()
      .describe("The subagent's final text response."),
    files_changed: z
      .array(
        z.object({
          path: z.string(),
          status: z.enum([
            "added",
            "modified",
            "deleted",
            "renamed",
            "untracked",
          ]),
        }),
      )
      .describe(
        "Files modified by the subagent (worktree mode only; empty in cwd mode).",
      ),
    diff: z
      .string()
      .describe(
        "Unified git diff of files_changed (worktree mode only; empty in cwd mode). Truncated if longer than the character limit.",
      ),
    diff_truncated: z.boolean(),
    duration_s: z.number(),
    usage: z
      .object({
        input_tokens: z.number().optional(),
        output_tokens: z.number().optional(),
        cached_input_tokens: z.number().optional(),
        reasoning_tokens: z.number().optional(),
      })
      .nullable()
      .describe("Backend-reported token usage. May be null if unavailable."),
    stderr_tail: z.string().nullable(),
    worktree_path: z.string().nullable(),
    error_message: z.string().nullable(),
  })
  .strict();

/**
 * Input schema for subagent_dispatch_parallel.
 */
export const DispatchParallelInputSchema = z
  .object({
    jobs: z
      .array(DispatchInputSchema)
      .min(1, "jobs must contain at least one dispatch")
      .max(
        MAX_PARALLEL_JOBS,
        `jobs may contain at most ${MAX_PARALLEL_JOBS} dispatches`,
      )
      .describe("Array of dispatch options, each with the same shape as subagent_dispatch's input."),
    max_concurrency: z
      .number()
      .int()
      .min(1)
      .max(MAX_PARALLEL_JOBS)
      .default(DEFAULT_PARALLEL_CONCURRENCY)
      .describe(
        `Maximum simultaneous subagents. Default ${DEFAULT_PARALLEL_CONCURRENCY}. Both Codex (ChatGPT) and Gemini (Google AI Pro) share rate limits with your interactive use — keep conservative.`,
      ),
  })
  .strict();

export type DispatchParallelInput = z.infer<typeof DispatchParallelInputSchema>;

export const DispatchParallelOutputSchema = z
  .object({
    results: z.array(DispatchOutputSchema),
  })
  .strict();
