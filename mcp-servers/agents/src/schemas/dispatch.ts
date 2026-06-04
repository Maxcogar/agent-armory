import { z } from "zod";

export const DispatchInputSchema = z.object({
  backend: z
    .enum(["codex", "gemini"])
    .describe("Which subagent CLI to dispatch to."),
  prompt: z
    .string()
    .min(1)
    .describe(
      "The full instruction for the subagent. It has no context beyond this — be specific.",
    ),
  persona: z
    .string()
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional()
    .describe("Persona name from ~/.subagent-mcp/personas/<name>.md"),
  working_dir: z
    .string()
    .optional()
    .describe("Absolute path to run in. Defaults to server cwd."),
  isolation: z
    .enum(["worktree", "cwd"])
    .default("worktree")
    .describe(
      "worktree creates a fresh git worktree at HEAD and captures a diff. cwd runs with live edits.",
    ),
  timeout_s: z
    .number()
    .int()
    .min(10)
    .max(3600)
    .default(300)
    .describe("Hard cutoff in seconds (10–3600)."),
  model: z
    .string()
    .optional()
    .describe(
      "Override default model. Examples: 'gpt-5-codex', 'gemini-2.5-pro'.",
    ),
  dangerous_mode: z
    .boolean()
    .default(false)
    .describe(
      "When true, codex uses danger-full-access and gemini uses --yolo. " +
        "Without this, gemini cannot use tools that need approval and will hang.",
    ),
});

export type DispatchInput = z.infer<typeof DispatchInputSchema>;

export const DispatchParallelInputSchema = z.object({
  jobs: z
    .array(DispatchInputSchema)
    .min(1)
    .max(8)
    .describe("Array of dispatch options, 1–8 items."),
  max_concurrency: z
    .number()
    .int()
    .min(1)
    .max(8)
    .default(2)
    .describe(
      "Maximum simultaneous subagents. Subscription rate limits are shared with interactive use — keep this conservative.",
    ),
});

export type DispatchParallelInput = z.infer<typeof DispatchParallelInputSchema>;
