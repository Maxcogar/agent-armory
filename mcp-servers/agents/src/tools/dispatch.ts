import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { runWithLimit } from "../services/concurrency.js";
import { dispatch } from "../services/dispatch.js";
import {
  DispatchInputSchema,
  DispatchParallelInputSchema,
} from "../schemas/dispatch.js";
import type { DispatchInput } from "../schemas/dispatch.js";
import type { DispatchOptions, DispatchResult } from "../types.js";

/**
 * Resolve a validated DispatchInput into the orchestrator's
 * DispatchOptions shape — fills in working_dir default and strips
 * undefined-vs-omitted ambiguity.
 */
function resolveOptions(input: DispatchInput): DispatchOptions {
  return {
    backend: input.backend,
    prompt: input.prompt,
    ...(input.persona !== undefined ? { persona: input.persona } : {}),
    working_dir: input.working_dir ?? process.cwd(),
    isolation: input.isolation,
    timeout_s: input.timeout_s,
    ...(input.model !== undefined ? { model: input.model } : {}),
    dangerous_mode: input.dangerous_mode,
  };
}

/**
 * Build a short human-readable summary of a DispatchResult for the
 * `content[0].text` slot. Claude Code shows this to the model, so it
 * should be terse and decision-relevant — not a full re-print of the
 * structured fields.
 */
function summarize(result: DispatchResult): string {
  const lines: string[] = [];
  lines.push(
    `${result.backend} → ${result.exit_status} (${result.duration_s}s)`,
  );
  if (result.error_message) {
    lines.push(`error: ${result.error_message}`);
  }
  if (result.files_changed.length > 0) {
    const counts: Record<string, number> = {};
    for (const f of result.files_changed) {
      counts[f.status] = (counts[f.status] ?? 0) + 1;
    }
    const summary = Object.entries(counts)
      .map(([k, v]) => `${v} ${k}`)
      .join(", ");
    lines.push(`files: ${result.files_changed.length} changed (${summary})`);
  }
  if (result.diff_truncated) {
    lines.push("diff: TRUNCATED — see structuredContent.diff");
  }
  if (result.final_response) {
    const preview = result.final_response.slice(0, 500);
    lines.push("---");
    lines.push(preview);
    if (result.final_response.length > 500) {
      lines.push(
        `[+${result.final_response.length - 500} more chars in structuredContent.final_response]`,
      );
    }
  }
  return lines.join("\n");
}

/**
 * Description for subagent_dispatch. The skill mandates concrete
 * examples, complete return-shape documentation, and explicit error
 * handling notes — all inline in the description.
 */
const DISPATCH_DESCRIPTION = `Dispatch a one-shot prompt to a Codex (OpenAI) or Gemini (Google) coding agent and return its result. The subagent runs in isolation (default: a disposable git worktree) so its file edits don't pollute your working tree until you review the diff.

Use this when you want a second opinion or a parallel worker: have Codex review a function while you write tests, have Gemini explore a bug in a separate worktree, generate boilerplate without context-switching the main agent, etc.

Auth: uses cached subscription auth (ChatGPT for Codex via \`codex login\`, Google AI Pro for Gemini via \`gemini\` interactive sign-in). The server scrubs OPENAI_API_KEY / GEMINI_API_KEY / GOOGLE_API_KEY etc. from the subprocess env to prevent silent fallback to API-billed accounts.

Args:
  - backend ('codex' | 'gemini'): Which subagent CLI to dispatch to.
  - prompt (string): The full instruction. Subagent has no context beyond this — be specific.
  - persona (string, optional): Persona name from ~/.subagent-mcp/personas/<name>.md, prepended to prompt.
  - working_dir (string, optional): Absolute path to run in. Defaults to server's cwd.
  - isolation ('worktree' | 'cwd', default 'worktree'): worktree creates a fresh git worktree at HEAD and captures the diff. cwd runs in place with live edits.
  - timeout_s (number, default 300, range 10-3600): Hard cutoff. Returns exit_status='timeout' if exceeded.
  - model (string, optional): Override default. Examples: 'gpt-5-codex', 'gemini-2.5-pro'.
  - dangerous_mode (boolean, default false): When true, codex uses 'danger-full-access' and gemini uses '--yolo'. When false, gemini cannot use any tool that needs approval and will hang+timeout if the model attempts one.

Returns (structuredContent):
  {
    "backend": "codex" | "gemini",
    "exit_status": "ok" | "timeout" | "error" | "auth_not_configured" | "not_a_git_repo",
    "final_response": string,                    // The subagent's text answer
    "files_changed": [{path, status}],           // Empty in cwd mode
    "diff": string,                              // Unified diff, may be truncated
    "diff_truncated": boolean,
    "duration_s": number,
    "usage": {input_tokens?, output_tokens?, ...} | null,
    "stderr_tail": string | null,
    "worktree_path": string | null,              // For debugging
    "error_message": string | null
  }

Examples:
  - Use when: "Have Codex review src/auth.ts for security bugs while I work on the test plan"
    → backend='codex', prompt='Review src/auth.ts for security bugs and report findings without modifying files.', isolation='worktree'
  - Use when: "Generate a React signup form matching the spec in docs/signup-spec.md"
    → backend='gemini' or 'codex', prompt with the spec contents inlined, isolation='worktree' so you can review the diff before merging
  - Use when: "Investigate why the build is failing and report root cause"
    → backend='codex', prompt with the error logs, dangerous_mode=true if you want it to run \`npm install\` etc.

Error Handling:
  - exit_status='auth_not_configured': run \`codex login\` (Codex) or \`gemini\` once interactively (Gemini) to refresh OAuth.
  - exit_status='not_a_git_repo': working_dir isn't in a git repo. Switch to isolation='cwd' or run from a repo.
  - exit_status='timeout': subagent exceeded timeout_s. Increase timeout_s or simplify the prompt. For gemini in non-dangerous mode, consider dangerous_mode=true if the model needs to use tools.
  - exit_status='error': see error_message and stderr_tail.`;

const DISPATCH_PARALLEL_DESCRIPTION = `Dispatch multiple subagent jobs in parallel and return all results in input order. Use for fan-out tasks: "have codex and gemini both review this PR", "run the same prompt against five different files", "compare three model variants on the same task".

Each job has the same shape as subagent_dispatch's input. Failures of individual jobs do NOT fail the whole call — each result has its own exit_status.

Args:
  - jobs (array, 1-8 items): Array of dispatch options, each with the full subagent_dispatch input shape.
  - max_concurrency (number, default 2, range 1-8): Maximum simultaneous subagents. Codex and Gemini both share rate limits with your interactive use, so keep this conservative — 8 parallel codex calls can chew through ChatGPT 5-hour limits fast.

Returns (structuredContent):
  { "results": [<DispatchResult>, ...] }   // same order as input jobs

Examples:
  - Use when: "Get reviews from both codex and gemini on the same diff"
    → jobs=[{backend:'codex', prompt:...}, {backend:'gemini', prompt:...}]
  - Use when: "Have codex generate JSDoc for each of these 4 modules"
    → jobs=[4 dispatches, each with the file contents inlined and a different working_dir]

Error Handling:
  - Each result has its own exit_status; check per-result.
  - The whole call only fails if input validation fails (jobs empty, jobs > 8, etc.).`;

/**
 * Register the two dispatch tools on the given MCP server.
 */
export function registerDispatchTools(server: McpServer): void {
  server.registerTool(
    "subagent_dispatch",
    {
      title: "Dispatch a one-shot subagent",
      description: DISPATCH_DESCRIPTION,
      inputSchema: DispatchInputSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (input) => {
      const validated = DispatchInputSchema.parse(input);
      const opts = resolveOptions(validated);
      const result = await dispatch(opts);
      return {
        content: [{ type: "text", text: summarize(result) }],
        structuredContent: result as unknown as Record<string, unknown>,
        isError: result.exit_status !== "ok",
      };
    },
  );

  server.registerTool(
    "subagent_dispatch_parallel",
    {
      title: "Dispatch multiple subagents in parallel",
      description: DISPATCH_PARALLEL_DESCRIPTION,
      inputSchema: DispatchParallelInputSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (input) => {
      const validated = DispatchParallelInputSchema.parse(input);
      const tasks = validated.jobs.map((j) => () => dispatch(resolveOptions(j)));
      const results = await runWithLimit(tasks, validated.max_concurrency);

      const summary = results
        .map((r, i) => `[${i}] ${summarize(r).split("\n")[0]}`)
        .join("\n");
      const anyFailed = results.some((r) => r.exit_status !== "ok");

      return {
        content: [{ type: "text", text: summary }],
        structuredContent: { results } as unknown as Record<string, unknown>,
        isError: anyFailed,
      };
    },
  );
}
