export type Backend = "codex" | "gemini";
export type ExitStatus =
  | "ok"
  | "timeout"
  | "error"
  | "auth_not_configured"
  | "not_a_git_repo";
export type IsolationMode = "worktree" | "cwd";

export interface FileChange {
  path: string;
  status: "added" | "modified" | "deleted" | "renamed" | "untracked";
}

export interface UsageStats {
  input_tokens?: number;
  output_tokens?: number;
  cached_input_tokens?: number;
  reasoning_tokens?: number;
}

export interface DispatchOptions {
  backend: Backend;
  prompt: string;
  persona?: string;
  working_dir: string;
  isolation: IsolationMode;
  timeout_s: number;
  model?: string;
  dangerous_mode: boolean;
}

export interface DispatchResult {
  backend: Backend;
  exit_status: ExitStatus;
  final_response: string;
  files_changed: FileChange[];
  diff: string;
  diff_truncated: boolean;
  duration_s: number;
  usage: UsageStats | null;
  stderr_tail: string | null;
  worktree_path: string | null;
  error_message: string | null;
}
