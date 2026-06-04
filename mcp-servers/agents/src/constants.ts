export const SCRUBBED_ENV_VARS: string[] = [
  "OPENAI_API_KEY",
  "CODEX_API_KEY",
  "GEMINI_API_KEY",
  "GOOGLE_API_KEY",
  "GOOGLE_APPLICATION_CREDENTIALS",
];

export const STDERR_TAIL_BYTES = 4096;

// Diffs larger than this are returned truncated with diff_truncated=true.
export const DIFF_TRUNCATION_BYTES = 200 * 1024;
