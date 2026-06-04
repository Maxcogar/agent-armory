import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import * as readline from "node:readline";
import * as path from "node:path";

import { buildSubagentEnv } from "./env.js";
import type { UsageStats } from "../types.js";

export interface CodexRunResult {
  final_response: string;
  usage: UsageStats | null;
  ok: boolean;
  error_message: string | null;
}

export interface CodexRunOptions {
  prompt: string;
  workingDirectory: string;
  /** True allows fully unsandboxed shell — only when caller opts in. */
  dangerous: boolean;
  /**
   * If true, tells codex to skip its "is this dir inside a git repo"
   * check. Required when isolation='cwd' and the working_dir isn't a
   * git repo — the user opted out of isolation, so we honor that.
   */
  skipGitRepoCheck: boolean;
  /** Override codex's default model (passed through to codex CLI's --model). */
  model?: string;
  /**
   * AbortSignal for the wrapper-level timeout. When aborted, Node.js
   * sends SIGTERM to the child process.
   */
  signal: AbortSignal;
}

/**
 * Resolve the absolute path to the bundled codex binary.
 *
 * Replicates @openai/codex-sdk's findCodexPath() (dist/index.js:368-434)
 * because that function is not exported. Resolution chain:
 *   @openai/codex (anchor) → @openai/codex-win32-x64 (platform) →
 *   vendor/x86_64-pc-windows-msvc/codex/codex.exe
 *
 * We create the require from our own import.meta.url so Node's normal
 * node_modules resolution finds the packages in this project's tree.
 */
function findCodexBinary(): string {
  const tripleByPlatform: Record<string, Record<string, string>> = {
    linux:   { x64: "x86_64-unknown-linux-musl",  arm64: "aarch64-unknown-linux-musl"  },
    android: { x64: "x86_64-unknown-linux-musl",  arm64: "aarch64-unknown-linux-musl"  },
    darwin:  { x64: "x86_64-apple-darwin",         arm64: "aarch64-apple-darwin"         },
    win32:   { x64: "x86_64-pc-windows-msvc",     arm64: "aarch64-pc-windows-msvc"     },
  };
  const triple = tripleByPlatform[process.platform]?.[process.arch];
  if (!triple) {
    throw new Error(`Unsupported platform: ${process.platform}/${process.arch}`);
  }

  const platformPkgByTriple: Record<string, string> = {
    "x86_64-unknown-linux-musl":  "@openai/codex-linux-x64",
    "aarch64-unknown-linux-musl": "@openai/codex-linux-arm64",
    "x86_64-apple-darwin":        "@openai/codex-darwin-x64",
    "aarch64-apple-darwin":       "@openai/codex-darwin-arm64",
    "x86_64-pc-windows-msvc":     "@openai/codex-win32-x64",
    "aarch64-pc-windows-msvc":    "@openai/codex-win32-arm64",
  };
  const platformPkg = platformPkgByTriple[triple];

  const moduleRequire = createRequire(import.meta.url);
  let vendorRoot: string;
  try {
    // @openai/codex is the anchor package that itself depends on the
    // platform-specific binary packages. Resolve through it exactly as
    // the SDK does (dist/index.js:421-424).
    const codexPkgJsonPath = moduleRequire.resolve("@openai/codex/package.json");
    const codexRequire = createRequire(codexPkgJsonPath);
    const platformPkgJsonPath = codexRequire.resolve(`${platformPkg}/package.json`);
    vendorRoot = path.join(path.dirname(platformPkgJsonPath), "vendor");
  } catch {
    throw new Error(
      "Unable to locate codex CLI binaries. Ensure @openai/codex-sdk is installed " +
      "with optional dependencies (`npm install`).",
    );
  }

  const binaryName = process.platform === "win32" ? "codex.exe" : "codex";
  return path.join(vendorRoot, triple, "codex", binaryName);
}

/**
 * Run codex one-shot and return its final response.
 *
 * Auth: uses cached subscription credentials at ~/.codex/auth.json
 * (populated by `codex login` with ChatGPT). Env is scrubbed of
 * OPENAI_API_KEY / CODEX_API_KEY so the CLI can't silently fall back
 * to API billing (Codex issue #20099).
 *
 * Why we bypass @openai/codex-sdk's Thread.run():
 *   On Windows, codex spawns a sandbox subprocess at startup (even for
 *   prompts that don't execute any shell commands). When that subprocess
 *   is killed at exit, Windows prints:
 *     "SUCCESS: The process with PID X (child process of PID Y) has
 *      been terminated."
 *   to codex's stdout. This is the output of codex's internal taskkill
 *   call during sandbox cleanup. The --experimental-json IPC channel
 *   uses codex's stdout; a non-JSON line on that channel causes the
 *   SDK (dist/index.js:83) to throw "Failed to parse item: SUCCESS: ..."
 *   This happens for both `[windows] sandbox = "elevated"` and
 *   `= "unelevated"` — both modes spawn a subprocess that is killed at
 *   exit.
 *
 *   Spawning the binary directly and filtering non-JSON lines before
 *   the JSON parser sees them is the correct fix. The SDK's abstraction
 *   doesn't expose a hook for this.
 */
export async function runCodex(
  opts: CodexRunOptions,
): Promise<CodexRunResult> {
  let binaryPath: string;
  try {
    binaryPath = findCodexBinary();
  } catch (err) {
    return {
      final_response: "",
      usage: null,
      ok: false,
      error_message: classifyCodexError(err),
    };
  }

  const args: string[] = [
    "exec",
    "--experimental-json",
    "--sandbox",
    opts.dangerous ? "danger-full-access" : "workspace-write",
    "--cd",
    opts.workingDirectory,
    "--config",
    `approval_policy="never"`,
  ];
  if (opts.model) {
    args.push("--model", opts.model);
  }
  if (opts.skipGitRepoCheck) {
    args.push("--skip-git-repo-check");
  }

  return new Promise<CodexRunResult>((resolve) => {
    let settled = false;
    const finalize = (
      ok: boolean,
      errorMessage: string | null,
      finalResponse: string,
      usage: UsageStats | null,
    ): void => {
      if (settled) return;
      settled = true;
      rl.close();
      resolve({ final_response: finalResponse, usage, ok, error_message: errorMessage });
    };

    const child = spawn(binaryPath, args, {
      env: buildSubagentEnv(),
      stdio: ["pipe", "pipe", "pipe"],
      signal: opts.signal,
    });

    let finalResponse = "";
    let usage: UsageStats | null = null;
    let turnFailed = false;
    let turnFailMessage = "";
    const stderrChunks: string[] = [];

    child.stderr.setEncoding("utf-8");
    child.stderr.on("data", (chunk: string) => stderrChunks.push(chunk));

    // Write the prompt to stdin and close. The binary reads the full
    // prompt from stdin when no [PROMPT] positional arg is provided.
    child.stdin.write(opts.prompt, "utf-8");
    child.stdin.end();

    const rl = readline.createInterface({ input: child.stdout, crlfDelay: Infinity });

    rl.on("line", (line: string) => {
      // Filter: on Windows, codex's sandbox subprocess cleanup prints
      // "SUCCESS: The process with PID X (child process of PID Y) has
      // been terminated." to stdout via taskkill. Skip any line that is
      // not a JSON object — these are not part of the --experimental-json
      // protocol and must not reach the JSON parser.
      if (!line.trimStart().startsWith("{")) return;
      let event: Record<string, unknown>;
      try {
        event = JSON.parse(line) as Record<string, unknown>;
      } catch {
        return;
      }
      switch (event.type) {
        case "item.completed": {
          const item = event.item as Record<string, unknown> | undefined;
          if (item?.type === "agent_message" && typeof item.text === "string") {
            finalResponse = item.text;
          }
          break;
        }
        case "turn.completed": {
          const u = event.usage as Record<string, unknown> | undefined;
          if (u) usage = extractUsage(u);
          break;
        }
        case "turn.failed": {
          const err = event.error as Record<string, unknown> | undefined;
          turnFailed = true;
          turnFailMessage =
            typeof err?.message === "string" ? err.message : JSON.stringify(event);
          break;
        }
      }
    });

    child.on("error", (err) => {
      const e = err as NodeJS.ErrnoException;
      if (e.name === "AbortError") {
        finalize(false, "Codex run timed out", "", null);
        return;
      }
      finalize(false, `Codex spawn error: ${e.message}`, "", null);
    });

    child.on("close", (code, signal) => {
      if (signal === "SIGTERM" || signal === "SIGKILL") {
        finalize(false, "Codex run timed out (process killed)", "", null);
        return;
      }
      if (turnFailed) {
        finalize(false, classifyCodexError(new Error(turnFailMessage)), "", null);
        return;
      }
      if (code !== 0) {
        const stderr = stderrChunks.join("");
        finalize(false, classifyCodexError(new Error(stderr || `exit ${code}`)), "", null);
        return;
      }
      finalize(true, null, finalResponse, usage);
    });
  });
}

/**
 * Extract token counts from a turn.completed usage object.
 * Field names observed in @openai/codex-sdk@0.128.0:
 *   input_tokens, cached_input_tokens, output_tokens, reasoning_output_tokens
 */
function extractUsage(obj: Record<string, unknown>): UsageStats | null {
  const out: UsageStats = {};
  if (typeof obj.input_tokens === "number") out.input_tokens = obj.input_tokens;
  if (typeof obj.output_tokens === "number") out.output_tokens = obj.output_tokens;
  if (typeof obj.cached_input_tokens === "number") out.cached_input_tokens = obj.cached_input_tokens;
  if (typeof obj.reasoning_output_tokens === "number") out.reasoning_tokens = obj.reasoning_output_tokens;
  return Object.keys(out).length === 0 ? null : out;
}

/**
 * Turn an arbitrary error from codex into a useful message.
 */
function classifyCodexError(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message;
    const lower = msg.toLowerCase();
    if (
      lower.includes("login") ||
      lower.includes("not authenticated") ||
      lower.includes("401") ||
      lower.includes("unauthorized")
    ) {
      return `Codex auth missing or expired. Run \`codex login\` and sign in with ChatGPT. Original error: ${msg}`;
    }
    if (lower.includes("rate limit") || lower.includes("quota") || lower.includes("429")) {
      return `Codex rate-limited. Original error: ${msg}`;
    }
    if (lower.includes("unable to locate codex cli binaries")) {
      return `Codex binary not found. Reinstall deps (\`npm install\`). Original error: ${msg}`;
    }
    return msg;
  }
  return String(err);
}
