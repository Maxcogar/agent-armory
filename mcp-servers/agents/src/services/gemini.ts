import { execFileSync, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import * as path from "node:path";

import { STDERR_TAIL_BYTES } from "../constants.js";
import { buildSubagentEnv } from "./env.js";
import type { UsageStats } from "../types.js";

/**
 * Result of a single Gemini run. Parallel shape to CodexRunResult.
 */
export interface GeminiRunResult {
  final_response: string;
  usage: UsageStats | null;
  ok: boolean;
  error_message: string | null;
  stderr_tail: string | null;
}

export interface GeminiRunOptions {
  prompt: string;
  workingDirectory: string;
  /**
   * True passes --yolo, which auto-approves shell commands AND enables
   * Gemini's sandbox by default. Without it, Gemini will hang forever
   * if the model tries to use any tool that requires approval — the
   * wrapper-level timeout is the only escape hatch.
   * (See gemini-cli issue #19774.)
   */
  dangerous: boolean;
  /** Override default model (e.g. 'gemini-2.5-pro'). Optional. */
  model?: string;
  /** AbortSignal for wrapper-level timeout. Sends SIGTERM to child. */
  signal: AbortSignal;
}

/**
 * Resolve the command and argument list needed to spawn gemini-cli.
 *
 * On Linux/macOS, `gemini` is a regular executable on PATH — spawn it
 * directly.
 *
 * On Windows, the file at %APPDATA%\npm\gemini is a `#!/bin/sh` Unix
 * shell script. Node.js CreateProcess cannot execute shell scripts — it
 * has no shell interpreter and does not consult PATHEXT. The adjacent
 * gemini.cmd delegates to `node <prefix>\node_modules\@google\gemini-cli\
 * bundle\gemini.js` (verified from gemini.cmd line 17). We resolve the
 * prefix at runtime via `npm config get prefix` so user-configured
 * prefixes are honored rather than assuming %APPDATA%\npm.
 */
function buildGeminiCommand(geminiArgs: string[]): { command: string; args: string[] } {
  if (process.platform !== "win32") {
    return { command: "gemini", args: geminiArgs };
  }
  let prefix: string;
  try {
    prefix = execFileSync("npm", ["config", "get", "prefix"], {
      shell: true,
      encoding: "utf-8",
    }).trim();
  } catch (err) {
    throw new Error(
      `Could not resolve npm prefix (needed to locate gemini on Windows): ${String(err)}`,
    );
  }
  const scriptPath = path.join(
    prefix,
    "node_modules",
    "@google",
    "gemini-cli",
    "bundle",
    "gemini.js",
  );
  if (!existsSync(scriptPath)) {
    throw new Error(
      `gemini CLI not found at resolved path ${scriptPath}. ` +
        `Install with \`npm install -g @google/gemini-cli\`.`,
    );
  }
  return { command: "node", args: [scriptPath, ...geminiArgs] };
}

/**
 * Run gemini-cli one-shot and return its final response.
 *
 * - Uses subscription auth cached at ~/.gemini/google_accounts.json after
 *   `gemini` interactive sign-in. Env is scrubbed of API-key vars to
 *   prevent silent fallback to billable AI Studio API usage.
 * - Output format is JSON ({"response": "...", "stats": {...}}). Field
 *   names have varied across versions, so we parse defensively.
 * - When dangerous=false, Gemini cannot execute any tool that needs
 *   approval. Calls that would have used a tool will hang until the
 *   timeout fires. This is documented in the tool description.
 */
export async function runGemini(
  opts: GeminiRunOptions,
): Promise<GeminiRunResult> {
  const args: string[] = [
    "--output-format",
    "json",
    "-p",
    opts.prompt,
  ];
  if (opts.model) {
    args.push("-m", opts.model);
  }
  if (opts.dangerous) {
    args.push("--yolo");
  }

  const { command: spawnCommand, args: spawnArgs } = buildGeminiCommand(args);
  return new Promise<GeminiRunResult>((resolve) => {
    const child = spawn(spawnCommand, spawnArgs, {
      cwd: opts.workingDirectory,
      env: buildSubagentEnv(),
      stdio: ["ignore", "pipe", "pipe"],
      signal: opts.signal,
    });

    let stdout = "";
    let stderr = "";
    let stderrTotal = 0;

    child.stdout.setEncoding("utf-8");
    child.stderr.setEncoding("utf-8");

    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });

    // Cap stderr to the last STDERR_TAIL_BYTES to bound memory.
    child.stderr.on("data", (chunk: string) => {
      stderrTotal += chunk.length;
      stderr += chunk;
      if (stderr.length > STDERR_TAIL_BYTES * 2) {
        stderr = stderr.slice(-STDERR_TAIL_BYTES);
      }
    });

    const finalize = (
      ok: boolean,
      errorMessage: string | null,
      finalResponse: string,
      usage: UsageStats | null,
    ): void => {
      const tail = stderr.slice(-STDERR_TAIL_BYTES);
      resolve({
        final_response: finalResponse,
        usage,
        ok,
        error_message: errorMessage,
        stderr_tail: stderrTotal > 0 ? tail : null,
      });
    };

    child.on("error", (err) => {
      // ENOENT means gemini isn't installed.
      const e = err as NodeJS.ErrnoException;
      if (e.code === "ENOENT") {
        finalize(
          false,
          "gemini CLI not found on PATH. Install with `npm install -g @google/gemini-cli`.",
          "",
          null,
        );
        return;
      }
      // AbortError surfaces here when the AbortController fires.
      if (e.name === "AbortError") {
        finalize(false, "Gemini run timed out", "", null);
        return;
      }
      finalize(false, `Gemini spawn error: ${e.message}`, "", null);
    });

    child.on("close", (code, signal) => {
      // Already resolved by error handler if AbortError — guard.
      if (signal === "SIGTERM" || signal === "SIGKILL") {
        finalize(false, "Gemini run timed out (process killed)", "", null);
        return;
      }
      if (code === 0) {
        const parsed = parseGeminiJsonOutput(stdout);
        if (parsed === null) {
          finalize(
            false,
            "Gemini exited 0 but produced no parseable JSON. Stderr tail may have details.",
            stdout, // pass raw stdout through for debugging
            null,
          );
          return;
        }
        finalize(true, null, parsed.response, parsed.usage);
        return;
      }
      const lower = stderr.toLowerCase();
      if (
        lower.includes("auth") ||
        lower.includes("login") ||
        lower.includes("credentials") ||
        lower.includes("permission_denied")
      ) {
        finalize(
          false,
          `Gemini auth failed (exit ${code}). Run \`gemini\` interactively once and choose "Sign in with Google" to refresh subscription auth.`,
          "",
          null,
        );
        return;
      }
      finalize(false, `Gemini exited with code ${code}`, "", null);
    });
  });
}

/**
 * Parse the JSON output of `gemini --output-format json`.
 *
 * The schema documented in geminicli.com is "single JSON object
 * containing response and usage statistics", but exact field names
 * have varied across versions. We probe for the common ones:
 *   - response field: "response" | "finalResponse" | "content" | "text"
 *   - usage field: "stats" | "usage"
 *
 * Returns null if the output isn't a parseable single JSON object.
 */
function parseGeminiJsonOutput(
  raw: string,
): { response: string; usage: UsageStats | null } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    // Some gemini versions interleave non-JSON warnings before the
    // JSON object. Try to find the first { and parse from there.
    const start = trimmed.indexOf("{");
    if (start < 0) return null;
    try {
      parsed = JSON.parse(trimmed.slice(start));
    } catch {
      return null;
    }
  }

  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;

  let response = "";
  for (const key of ["response", "finalResponse", "content", "text"]) {
    const v = obj[key];
    if (typeof v === "string" && v.length > 0) {
      response = v;
      break;
    }
  }

  let usage: UsageStats | null = null;
  for (const key of ["stats", "usage"]) {
    const v = obj[key];
    if (v && typeof v === "object") {
      usage = extractUsageFromObject(v as Record<string, unknown>);
      if (usage) break;
    }
  }

  return { response, usage };
}

/**
 * Pull token counts out of a usage/stats object regardless of which
 * naming convention this gemini version uses.
 */
function extractUsageFromObject(
  obj: Record<string, unknown>,
): UsageStats | null {
  const out: UsageStats = {};
  // Common naming variants across gemini versions
  const inputKeys = ["input_tokens", "inputTokens", "promptTokenCount", "prompt_tokens"];
  const outputKeys = ["output_tokens", "outputTokens", "candidatesTokenCount", "completion_tokens"];
  const cachedKeys = ["cached_input_tokens", "cachedTokenCount", "cached_tokens"];

  for (const k of inputKeys) {
    const v = obj[k];
    if (typeof v === "number") {
      out.input_tokens = v;
      break;
    }
  }
  for (const k of outputKeys) {
    const v = obj[k];
    if (typeof v === "number") {
      out.output_tokens = v;
      break;
    }
  }
  for (const k of cachedKeys) {
    const v = obj[k];
    if (typeof v === "number") {
      out.cached_input_tokens = v;
      break;
    }
  }

  // Recurse into nested objects (gemini sometimes wraps under "tokens")
  if (Object.keys(out).length === 0) {
    for (const v of Object.values(obj)) {
      if (v && typeof v === "object") {
        const inner = extractUsageFromObject(v as Record<string, unknown>);
        if (inner) return inner;
      }
    }
  }

  return Object.keys(out).length === 0 ? null : out;
}
