import { SCRUBBED_ENV_VARS } from "../constants.js";

/**
 * Build the environment variables for a subagent subprocess.
 *
 * This is the most important security/correctness function in the
 * server. The user is on ChatGPT/Google AI Pro subscriptions and does
 * NOT want to bill API-key accounts for subagent work.
 *
 * Both Codex and Gemini CLIs silently prefer API keys when present in
 * env (see Codex issue #20099, Gemini auth docs). If we passed
 * `process.env` straight through, any `OPENAI_API_KEY` or
 * `GOOGLE_API_KEY` set elsewhere in the user's shell would override
 * their subscription auth — silently, with the next ChatGPT bill.
 *
 * So: start from process.env, delete every entry in SCRUBBED_ENV_VARS,
 * preserve everything else (PATH, HOME, CODEX_HOME, GEMINI_HOME, etc.).
 *
 * Returns a plain object suitable for child_process.spawn's `env`
 * option or @openai/codex-sdk's Codex({ env }) constructor option.
 */
export function buildSubagentEnv(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value === undefined) continue;
    if (SCRUBBED_ENV_VARS.includes(key)) continue;
    out[key] = value;
  }
  return out;
}

/**
 * Returns the list of scrubbed variables that were actually present
 * in process.env. Useful for diagnostics — if a dispatch fails with
 * an auth error, we can tell the user which leaked keys we removed.
 */
export function detectScrubbedKeys(): string[] {
  return SCRUBBED_ENV_VARS.filter((key) => process.env[key] !== undefined);
}
