# subagent-mcp-server

An MCP server that lets Claude Code dispatch one-shot prompts to **Codex** (OpenAI) and **Gemini** (Google) coding agents as subagents. Mirrors the shape of Claude Code's built-in `Task` tool, but with a different model on the other end.

## What it gives you

- `subagent_dispatch` — fire one prompt at codex or gemini, get back the response plus a diff of any files the subagent edited
- `subagent_dispatch_parallel` — fan-out N jobs at once with a concurrency cap

The default isolation mode runs every dispatch inside a disposable `git worktree` so the subagent's edits don't touch your working tree until you decide to apply the diff. Switch to `cwd` mode if you want live edits.

## How it differs from existing options

- **vs `codex mcp-server`**: that exposes Codex's full session-aware MCP interface. This is one-shot fire-and-forget, with worktree isolation, plus Gemini.
- **vs `kky42/codex-as-mcp` etc.**: those wrap a single CLI. This wraps both, scrubs API-key env leakage that would silently bill subscription accounts, and captures a structured diff for review.

## Auth — subscriptions, not API keys

Both backends use **cached subscription credentials**, not API keys.

- **Codex**: `~/.codex/auth.json`, populated by running `codex login` once and signing in with ChatGPT.
- **Gemini**: `~/.gemini/google_accounts.json`, populated by running `gemini` once and choosing "Sign in with Google".

The server **scrubs** `OPENAI_API_KEY`, `CODEX_API_KEY`, `GEMINI_API_KEY`, `GOOGLE_API_KEY`, and `GOOGLE_APPLICATION_CREDENTIALS` from the subprocess environment before spawning either CLI. This is non-optional. Both CLIs silently prefer API-key auth over OAuth when both are available (Codex issue #20099, Gemini auth docs); without scrubbing, your subscription work would silently bill API accounts.

If those vars are present in the parent env, the server logs a one-line note to stderr at startup so you can see what was scrubbed.

## Install

```bash
git clone <this repo> subagent-mcp-server
cd subagent-mcp-server
npm install
npm run build
```

This will install `@openai/codex-sdk`, which bundles its own platform-specific codex binary as an optional dependency. You do not need a global `npm install -g @openai/codex` — though if you have one, that's where you ran `codex login`, so its auth.json is the one this server will use.

You **do** need `gemini` on `PATH` for the Gemini backend:

```bash
npm install -g @google/gemini-cli
```

## Configure Claude Code

Add to your `~/.claude.json` or project `.mcp.json`:

```json
{
  "mcpServers": {
    "subagent": {
      "command": "node",
      "args": ["/absolute/path/to/subagent-mcp-server/dist/index.js"]
    }
  }
}
```

Restart Claude Code. The two tools should appear in `claude mcp` output.

## First-time auth setup

Before the server can dispatch anything, you need cached auth on disk:

```bash
# Codex — sign in with ChatGPT, NOT API key
codex login
# (browser opens, you sign in with your ChatGPT subscription account)

# Gemini — run interactively once, choose "Sign in with Google"
gemini
# (browser opens, you sign in with the Google account that has AI Pro)
# /quit when done
```

Verify both:

```bash
codex login status   # should exit 0
ls ~/.gemini/google_accounts.json   # should exist
```

## Usage

From inside Claude Code:

```
Use the subagent_dispatch tool to have codex review src/auth.ts for security bugs.
```

Claude Code will call:

```json
{
  "name": "subagent_dispatch",
  "arguments": {
    "backend": "codex",
    "prompt": "Review src/auth.ts for security bugs. Report findings without modifying files.",
    "working_dir": "/abs/path/to/project",
    "isolation": "worktree",
    "timeout_s": 300
  }
}
```

And get back:

```json
{
  "backend": "codex",
  "exit_status": "ok",
  "final_response": "Found 3 issues: ...",
  "files_changed": [],
  "diff": "",
  "diff_truncated": false,
  "duration_s": 47.2,
  "usage": {"input_tokens": 1820, "output_tokens": 412, ...},
  "stderr_tail": null,
  "worktree_path": "/tmp/subagent-XYZ/wt",
  "error_message": null
}
```

## Personas

Drop a markdown file at `~/.subagent-mcp/personas/<name>.md` and reference it via the `persona` arg. Its contents get prepended to your prompt with a separator. Useful for stable role definitions like `rust-reviewer.md` or `sql-expert.md` that you don't want to copy-paste into every dispatch.

Persona names must match `[a-zA-Z0-9_-]+` (path traversal protection).

## Isolation modes

**`worktree` (default)** — Server creates `git worktree add --detach <tmp> HEAD` from `working_dir`, runs the subagent there, captures the diff via `git add -A && git diff --cached HEAD`, then `git worktree remove --force` and rms the staging dir. Your working tree is never touched. The diff comes back in `structuredContent.diff` for you to apply or discard.

**`cwd`** — Server runs the subagent directly in `working_dir`. Edits are live. Use when you want a subagent to make changes you'll inspect with your normal git workflow, or when `working_dir` isn't a git repo at all (logs investigation, etc.).

## Dangerous mode

Both backends, by default, run with restricted shell access:

- **Codex**: `sandboxMode: "workspace-write"` — file writes confined to working directory, no shell escape.
- **Gemini**: no `--yolo` flag — Gemini will hang if the model attempts any tool that requires approval (gemini-cli issue #19774). The wrapper-level `timeout_s` is the only safety. **Effectively text-only** without dangerous mode.

Pass `dangerous_mode: true` to give the subagent unrestricted shell access (codex `danger-full-access`, gemini `--yolo`). Worktree isolation contains filesystem damage but **not** network calls or destructive commands inside the worktree. Don't pass this casually.

## Rate limits

Subscription rate limits are **shared with your interactive use**. A `subagent_dispatch_parallel` call with 8 concurrent codex jobs can chew through a 5-hour ChatGPT limit fast. Default `max_concurrency` is 2 for that reason.

Codex ChatGPT sessions go stale after roughly 8 days of inactivity. The server detects this as `exit_status: "auth_not_configured"` with an error message pointing you to `codex login`.

## Tested and not tested

What I verified end-to-end while building:

- Server boots over stdio, both tools register with correct schemas and annotations
- Zod validation surfaces structured errors on bad input
- Real codex invocation via the SDK (verified with a 401 from `api.openai.com`)
- `not_a_git_repo` and `timeout` exit paths return clean structured errors
- Worktree creation, diff capture path, and cleanup all run without leaking temp dirs
- Parallel dispatch preserves order and isolates per-job failures
- Env scrubbing removes API-key vars from subagent processes

What I did **not** verify because the test environment lacks them:

- A successful end-to-end dispatch with real subscription auth
- The Gemini backend (no `gemini` CLI in test env — code follows documented flags but I haven't seen it return real output)
- That codex SIGTERM cleanup actually kills the underlying subprocess promptly on timeout (the SDK code suggests it does, but I didn't observe a real timeout-during-streaming case)
- The persona loader against real persona files

If something behaves unexpectedly in any of those areas, file an issue with the `stderr_tail` and `error_message` from the result.

## License

MIT
