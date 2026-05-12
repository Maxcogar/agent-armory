# Gemini CLI Extensions — Canonical Reference

Compiled from the official Gemini CLI documentation at `geminicli.com` and the
`ExtensionConfig` interface in the `google-gemini/gemini-cli` source code.
Source URLs and last-updated dates are stamped per section. Where the docs and
the source code disagree, the source code wins (and the discrepancy is noted).

Verified against the docs as of May 10, 2026. The Gemini CLI moves fast — if
behavior diverges, re-verify the section's source URL.

---

## Table of contents

1. [What an extension is](#1-what-an-extension-is)
2. [Directory layout](#2-directory-layout)
3. [The manifest (`gemini-extension.json`)](#3-the-manifest-gemini-extensionjson)
4. [Variables and substitution](#4-variables-and-substitution)
5. [MCP servers in extensions](#5-mcp-servers-in-extensions)
6. [Extension settings (user-supplied values)](#6-extension-settings-user-supplied-values)
7. [Custom commands (`commands/*.toml`)](#7-custom-commands-commandstoml)
8. [Subagents (`agents/*.md`)](#8-subagents-agentsmd)
9. [Agent Skills (`skills/<name>/SKILL.md`)](#9-agent-skills-skillsnameskillmd)
10. [Hooks (`hooks/hooks.json`)](#10-hooks-hookshookjson)
11. [Policy Engine (`policies/*.toml`)](#11-policy-engine-policiestoml)
12. [Themes (in manifest)](#12-themes-in-manifest)
13. [Context loading and `GEMINI.md`](#13-context-loading-and-geminimd)
14. [Conflict resolution and precedence](#14-conflict-resolution-and-precedence)
15. [Lifecycle: install, develop, update, release](#15-lifecycle-install-develop-update-release)
16. [Best practices and troubleshooting](#16-best-practices-and-troubleshooting)
17. [Source map](#17-source-map)

---

## 1. What an extension is

An extension is a directory containing a `gemini-extension.json` manifest at
its root. That directory is loaded from one of two locations:

- User scope: `~/.gemini/extensions/<extension-name>/`
- Workspace scope: `<workspace>/.gemini/extensions/<extension-name>/`

The directory name **must match the `name` field** in the manifest. The name
must be kebab-case (lowercase letters, numbers, hyphens) — invalid names are
rejected by the loader.

The minimum valid extension is just a manifest with two required fields:

```json
{
  "name": "my-extension",
  "version": "1.0.0"
}
```

Everything else is optional — but the rest of this document covers what those
optional pieces look like and how they wire together.

---

## 2. Directory layout

The extension directory may contain any of the following. Most are
auto-discovered by directory presence rather than declared in the manifest:

```
my-extension/
├── gemini-extension.json    REQUIRED — manifest
├── .env                     auto-managed — non-sensitive setting values
├── GEMINI.md                auto-loaded if present (or filename from manifest)
├── commands/                slash commands (TOML files)
│   ├── deploy.toml          → /deploy
│   └── gcs/sync.toml        → /gcs:sync (colon-namespaced)
├── agents/                  subagents (Markdown + YAML frontmatter)
│   └── security-auditor.md
├── skills/                  agent skills
│   └── code-reviewer/
│       ├── SKILL.md         REQUIRED for the skill
│       ├── scripts/
│       ├── references/
│       └── assets/
├── hooks/
│   └── hooks.json           hook event registrations
├── policies/                Policy Engine rules (TOML)
│   └── safety.toml
└── src/, dist/, package.json, tsconfig.json
                             your MCP server code, if any
```

The `.env` file is created and managed by the CLI when a user installs the
extension and supplies values for `settings` declared in the manifest. You do
not write it by hand; sensitive values bypass it entirely and go to the
system keychain.

Source: `geminicli.com/docs/extensions/reference/` (Apr 10, 2026); DeepWiki
index of `packages/cli/src/config/extension-manager.ts` at commit `237864eb`
(Mar 2026).

---

## 3. The manifest (`gemini-extension.json`)

The full schema, with required vs optional flags from the `ExtensionConfig`
TypeScript interface in `packages/cli/src/config/extension.ts`:

| Field             | Type                              | Req | Purpose                                                   |
|-------------------|-----------------------------------|-----|-----------------------------------------------------------|
| `name`            | `string`                          | Yes | Kebab-case identifier; must match directory name          |
| `version`         | `string`                          | Yes | Semantic version                                          |
| `description`     | `string`                          | No  | Shown on geminicli.com/extensions                         |
| `mcpServers`      | `Record<string, MCPServerConfig>` | No  | MCP server configurations (see §5)                        |
| `contextFileName` | `string \| string[]`              | No  | Context file(s) to load; defaults to `GEMINI.md`          |
| `excludeTools`    | `string[]`                        | No  | Tools to exclude; supports per-command restrictions       |
| `settings`        | `ExtensionSetting[]`              | No  | User-configurable values (see §6)                         |
| `themes`          | `CustomTheme[]`                   | No  | Custom UI themes (see §12)                                |
| `plan`            | `{ directory?: string }`          | No  | Fallback directory for plan artifacts                     |
| `migratedTo`      | `string`                          | No  | URL of new repo; CLI auto-migrates installs to it         |

Full example showing every field:

```json
{
  "name": "my-extension",
  "version": "1.0.0",
  "description": "Does the thing.",
  "mcpServers": {
    "main": {
      "command": "node",
      "args": ["${extensionPath}${/}dist${/}server.js"],
      "cwd": "${extensionPath}",
      "env": { "API_KEY": "$MY_API_KEY" }
    }
  },
  "contextFileName": "GEMINI.md",
  "excludeTools": ["run_shell_command(rm -rf)"],
  "settings": [
    {
      "name": "API Key",
      "description": "Your API key.",
      "envVar": "MY_API_KEY",
      "sensitive": true
    }
  ],
  "themes": [
    {
      "name": "shades-of-green",
      "type": "custom",
      "background": { "primary": "#1a362a" },
      "text": { "primary": "#a6e3a1", "secondary": "#6e8e7a", "link": "#89e689" },
      "status": { "success": "#76c076", "warning": "#d9e689", "error": "#b34e4e" },
      "border": { "default": "#4a6c5a" },
      "ui": { "comment": "#6e8e7a" }
    }
  ],
  "plan": { "directory": ".gemini/plans" },
  "migratedTo": "https://github.com/new-owner/new-repo"
}
```

Notes per field:

- `name`: enforced kebab-case at load time; **must** match the directory name.
- `description`: optional but used by the public extension directory.
- `excludeTools`: this is the manifest's coarse-grained exclusion list. Tools
  that support sub-pattern restrictions (notably `run_shell_command`) accept
  the form `"run_shell_command(<pattern>)"` to block specific invocations.
  Distinct from per-MCP-server `excludeTools` inside an `mcpServers` entry,
  which restricts that server's exposed tools.
- `plan.directory` falls back to `~/.gemini/tmp/<project>/<session-id>/plans/`
  if neither extension nor user setting provides one.
- `migratedTo` is how you move an extension between repos without forcing
  every installed user to reinstall.

There is no `commands`, `agents`, `skills`, `hooks`, or `policies` key in the
manifest. Those are all auto-discovered by directory presence — covered in
the relevant sections below.

Source: `geminicli.com/docs/extensions/reference/`; `ExtensionConfig` in
`packages/cli/src/config/extension.ts` lines 24–45.

---

## 4. Variables and substitution

Variable substitution is supported in `gemini-extension.json` and
`hooks/hooks.json` only. It does **not** apply to TOML command files,
SKILL.md files, or subagent .md files.

Built-in variables:

| Variable           | Resolves to                                                    |
|--------------------|----------------------------------------------------------------|
| `${extensionPath}` | Absolute path to the extension's directory                     |
| `${workspacePath}` | Absolute path to the current workspace                         |
| `${/}`             | Platform-specific path separator (`/` on Unix, `\` on Windows) |

For `link`-installed extensions, `${extensionPath}` resolves to the original
source directory, not the symlink in `~/.gemini/extensions/`. This matters
for dev workflows where your code lives outside the install path.

Environment variables in manifest values (especially under `mcpServers.*.env`)
are resolved using two syntaxes:

| Syntax     | Example      |
|------------|--------------|
| `$VAR`     | `$API_KEY`   |
| `${VAR}`   | `${API_KEY}` |

Both forms resolve from these sources, in priority order (later wins):

1. The extension's `.env` file (workspace scope, then user scope)
2. The system keychain (for `sensitive: true` settings)
3. `process.env`

If a referenced env var is not found in any source, the literal reference
(e.g. `$MISSING`) is left unchanged in the output. Missing variables are
not errors — they just don't substitute.

Source: `geminicli.com/docs/extensions/reference/` and DeepWiki section
"Variable Resolution System" / "Environment Variable Resolution".

---

## 5. MCP servers in extensions

The `mcpServers` map in the manifest has the same shape as the one in
`settings.json`, with one constraint: the `trust` field is silently stripped
by the loader. Extensions cannot grant themselves elevated MCP permissions.

A complete server entry:

```json
"mcpServers": {
  "my-server": {
    "command": "node",
    "args": ["${extensionPath}${/}dist${/}server.js"],
    "cwd": "${extensionPath}",
    "env": { "API_KEY": "$MY_API_KEY" },
    "excludeTools": ["dangerous_tool"]
  }
}
```

Rules:

- **Use `${extensionPath}` for portability.** Hardcoded paths break across
  installs.
- **Separate executable from arguments** — put the binary in `command` and
  arguments in `args`. Don't shove everything into `command`.
- The per-server `excludeTools` blocks tools the server itself exposes.
  Distinct from the manifest's top-level `excludeTools` which blocks
  built-in CLI tools.
- If both an extension and a `settings.json` define an MCP server with the
  same name, **the `settings.json` definition wins.** This means user/project
  config can override an extension's server config — useful when you need to
  point an extension at a different backend without forking it.

Source: `geminicli.com/docs/extensions/reference/`.

---

## 6. Extension settings (user-supplied values)

If your extension needs API keys, URLs, toggles, etc., declare them via the
`settings` array in the manifest. The CLI prompts the user during install
and stores values in the right place based on sensitivity.

```json
"settings": [
  {
    "name": "API Key",
    "description": "Your API key for the service.",
    "envVar": "MY_API_KEY",
    "sensitive": true
  },
  {
    "name": "Endpoint URL",
    "description": "Base URL for the API.",
    "envVar": "API_ENDPOINT"
  }
]
```

`ExtensionSetting` fields:

| Field         | Type      | Purpose                                                |
|---------------|-----------|--------------------------------------------------------|
| `name`        | `string`  | Display label shown to the user                        |
| `description` | `string`  | Explanation shown during configuration                 |
| `envVar`      | `string`  | Env var the value is bound to (visible to MCP server)  |
| `sensitive`   | `boolean` | If true: input obfuscated; stored in system keychain   |

Storage matrix:

| Scope     | Sensitive | Storage location                                              |
|-----------|-----------|---------------------------------------------------------------|
| User      | No        | `~/.gemini/extensions/<name>/.env`                            |
| User      | Yes       | System keychain (`<extension-name>:<envVar>`)                 |
| Workspace | No        | `<workspace>/.gemini/extensions/<name>/.env`                  |
| Workspace | Yes       | System keychain (workspace-scoped)                            |

Workspace settings only load when the workspace is trusted. User-scope
settings load first, then workspace-scope settings override them.

User-facing management commands:

```bash
gemini extensions config <name>                # interactive editor
gemini extensions config <name> [setting]      # edit specific setting
gemini extensions config <name> --scope <scope>  # user or workspace
```

Source: `geminicli.com/docs/extensions/reference/` and DeepWiki section
"Extension Settings".

---

## 7. Custom commands (`commands/*.toml`)

TOML files in the extension's `commands/` directory become slash commands.
The directory structure determines the command path:

- `commands/deploy.toml` → `/deploy`
- `commands/gcs/sync.toml` → `/gcs:sync` (colon-namespaced)

### TOML schema

| Field         | Type     | Req | Purpose                                                        |
|---------------|----------|-----|----------------------------------------------------------------|
| `prompt`      | `string` | Yes | The prompt sent to the model                                   |
| `description` | `string` | No  | Help text in `/help`; auto-generated from filename if omitted  |

That's it for the schema. The power is in what you can put inside `prompt`.

### Argument handling — four mechanisms

**1. `{{args}}` raw injection.** If the prompt contains `{{args}}`, the user's
text after the command name is substituted in literally:

```toml
description = "Generates a fix for an issue."
prompt = "Provide a code fix for: {{args}}."
```

`/git:fix "Button is misaligned"` →
`Provide a code fix for: "Button is misaligned".`

**2. `{{args}}` inside `!{...}` shell blocks — automatically shell-escaped.**
Same `{{args}}` token, but inside a shell-execution block, the value is
shell-escaped to prevent injection:

```toml
prompt = """
Summarize findings for `{{args}}`.

Search Results:
!{grep -r {{args}} .}
"""
```

The CLI escapes the shell-context substitution and confirms the resolved
command before running it.

**3. Default argument handling (no `{{args}}` token).** If `prompt` doesn't
contain `{{args}}`, the user's full command line is appended to the prompt
with two newlines between them. If the user provides no arguments, nothing
is appended.

**4. `!{...}` shell command execution.** Inject the stdout of a shell
command into the prompt:

```toml
prompt = """
Generate a Conventional Commit message for this diff:

```diff
!{git diff --staged}
```
"""
```

The CLI prompts the user to confirm the resolved shell command before
running it. If the command fails, stderr is injected followed by
`[Shell command exited with code N]`. Braces inside `!{...}` must balance —
if you need unbalanced braces, wrap in an external script.

**5. `@{...}` file/directory injection.** Inject file content or directory
listings:

```toml
prompt = """
Review {{args}} using these best practices:

@{docs/best-practices.md}
"""
```

Behavior:
- `@{path/to/file.txt}` — file content
- `@{path/to/dir}` — recursive directory listing (respects `.gitignore` and
  `.geminiignore` if enabled)
- Multimodal: PNG, JPEG, PDF, audio, video are encoded as multimodal input;
  unsupported binaries are skipped
- Workspace-aware: looks in current dir and configured workspace dirs
- Processed **before** `!{...}` and `{{args}}`

### Reload without restart

```bash
/commands reload    # picks up new/modified TOML files
/commands list      # see what's loaded
```

This is one of the few extension features that doesn't require a full CLI
restart. Most other changes (manifest edits, hooks, agents) do require a
restart.

### Conflict resolution

Extension commands have the lowest precedence. If a user or project command
has the same name, the extension version is reachable as
`/<extension-name>.<command>` (dot separator, not colon — colon is for
namespacing within a single source).

Sources: `geminicli.com/docs/cli/custom-commands/` (Apr 30, 2026);
`geminicli.com/docs/extensions/reference/`.

---

## 8. Subagents (`agents/*.md`)

Subagents are specialists with isolated context windows. The main agent
delegates to them as if they were tools. Extensions ship them as Markdown
files with YAML frontmatter in an `agents/` directory.

### File format

The file **must** start with YAML frontmatter delimited by `---`. The body
of the markdown becomes the subagent's system prompt.

```markdown
---
name: security-auditor
description: Specialized in finding security vulnerabilities in code.
kind: local
tools:
  - read_file
  - grep_search
model: gemini-3-flash-preview
temperature: 0.2
max_turns: 10
timeout_mins: 10
---

You are a ruthless Security Auditor. Your job is to analyze code for
potential vulnerabilities.

Focus on:
1. SQL Injection
2. XSS (Cross-Site Scripting)
3. Hardcoded credentials
4. Unsafe file operations

When you find a vulnerability, explain it clearly and suggest a fix. Do not
fix it yourself; just report it.
```

### Frontmatter schema

| Field          | Type     | Req | Purpose                                                                |
|----------------|----------|-----|------------------------------------------------------------------------|
| `name`         | `string` | Yes | Slug used as the tool name; lowercase, numbers, hyphens, underscores   |
| `description`  | `string` | Yes | What the agent does — used by the main agent to decide when to call it |
| `kind`         | `string` | No  | `local` (default) or `remote` (A2A protocol)                           |
| `tools`        | `string[]` | No | Allowed tool names; supports wildcards (see below)                    |
| `mcpServers`   | `object` | No  | Inline MCP servers isolated to this agent only                         |
| `model`        | `string` | No  | Model override; defaults to inheriting the session model               |
| `temperature`  | `number` | No  | 0.0 – 2.0; default 1                                                   |
| `max_turns`    | `number` | No  | Max conversation turns before the agent must return; default 30        |
| `timeout_mins` | `number` | No  | Max execution time in minutes; default 10                              |

### Tool wildcards

In the `tools` array:
- `*` — all built-in and discovered tools
- `mcp_*` — all tools from all MCP servers
- `mcp_<server-name>_*` — all tools from a specific server

If `tools` is omitted, the agent inherits **all** parent session tools. To
restrict, you must explicitly enumerate.

### Inline MCP servers (per-agent isolation)

Define `mcpServers` in the frontmatter and the server is launched only for
that agent's context. This isolates state between agents:

```markdown
---
name: my-isolated-agent
tools:
  - grep_search
  - read_file
mcpServers:
  my-custom-server:
    command: node
    args: [path/to/server.js]
---
```

### Isolation rules

- Each subagent has its own context loop — its history doesn't bloat the
  main agent's tokens
- Subagents only see tools you explicitly grant them
- **Subagents cannot call other subagents.** Even with `tools: ["*"]`, agent
  tools are not visible to sibling agents. This is recursion protection.

### Invocation

Two paths:

1. **Automatic** — the main agent calls a subagent as a tool when the user's
   request matches the subagent's `description`. The quality of the
   description determines how reliably this works.
2. **Forced** — the user prefixes the prompt with `@<agent-name>`:
   ```
   @security-auditor Audit src/auth.ts for credential leaks
   ```
   The CLI injects a system note telling the main agent to use that
   specific subagent immediately.

### Subagent locations

- Workspace: `<workspace>/.gemini/agents/<name>.md` or in an extension's
  `agents/` directory
- User: `~/.gemini/agents/<name>.md`

### Built-in subagents (for reference)

The CLI ships these by default — your custom ones live alongside them:

- `codebase_investigator` — code analysis and dependency mapping
- `cli_help` — Q&A about Gemini CLI itself
- `generalist` — general-purpose isolated execution (full inherited tools)
- `browser_agent` — web automation (preview, opt-in)

### Subagent-specific policies

The Policy Engine can match on subagent name. In a `.toml` policy file:

```toml
[[rule]]
name = "Allow pr-creator to push code"
subagent = "pr-creator"
description = "Permit pr-creator to push branches automatically."
action = "allow"
toolName = "run_shell_command"
commandPrefix = "git push"
```

(Note: extension-supplied `allow` policies are silently ignored — see §11.)

Source: `geminicli.com/docs/core/subagents/` (Apr 14, 2026).

---

## 9. Agent Skills (`skills/<name>/SKILL.md`)

Skills are bundled expertise — instructions plus optional scripts and
references. The main agent activates a skill when the user's request matches
its `description`.

### Required structure

```
skills/
└── code-reviewer/
    ├── SKILL.md       (Required) Instructions and metadata
    ├── scripts/       (Optional) Executable scripts
    ├── references/    (Optional) Static documentation
    └── assets/        (Optional) Templates and other resources
```

Only `SKILL.md` is required. The other directories are conventional but the
model gets access to whatever you ship in the skill folder.

### `SKILL.md` format

YAML frontmatter for metadata, markdown body for the system prompt that
runs when the skill activates:

```markdown
---
name: code-reviewer
description:
  Expertise in reviewing code changes for correctness, security, and style.
  Use when the user asks to "review" their code or a PR.
---

# Code Reviewer Instructions

You act as a senior software engineer specialized in code quality. When this
skill is active, you MUST:

1. **Analyze**: Review the provided code for logical errors, security
   vulnerabilities, and style violations.
2. **Review**: Use the bundled `scripts/review.js` utility to perform an
   automated check.
3. **Feedback**: Provide constructive feedback, clearly distinguishing
   between critical issues and minor improvements.
```

### Frontmatter fields

- `name` — unique identifier; should match the directory name
- `description` — **critical** — this is how the main agent decides when to
  activate the skill. Be specific about tasks and trigger keywords.

### Discovery tiers (lowest to highest precedence)

1. Built-in skills (shipped with Gemini CLI)
2. Extension skills (bundled in extensions)
3. User skills (`~/.gemini/skills/` or `~/.agents/skills/` alias)
4. Workspace skills (`<workspace>/.gemini/skills/` or `.agents/skills/` alias)

The `.agents/skills/` alias exists for compatibility with the cross-tool
[Agent Skills standard](https://agentskills.io). Both paths are scanned.

### Activation

When the user's prompt matches a skill's description, the main agent asks
permission to activate it. On approval, the skill's full directory is
accessible to the model, and the SKILL.md body becomes part of context.
Bundled scripts can be executed by the model.

### Listing and debugging

```bash
/skills            # list loaded skills in the current session
```

Source: `geminicli.com/docs/cli/creating-skills/` (Apr 30, 2026).

---

## 10. Hooks (`hooks/hooks.json`)

Hooks intercept and customize CLI behavior at specific events. Extensions
ship them in a `hooks/hooks.json` file at the extension root.

### Communication contract

This is the part that silently breaks if you get it wrong:

- **stdin** — JSON input (event-specific schema; common base fields below)
- **stdout** — JSON output **only**. No other text. Plain stdout output
  corrupts parsing.
- **stderr** — logs and rejection reasons
- **Exit codes**:
  - `0` — success; stdout parsed as JSON. Preferred for all logic.
  - `2` — system block; action blocked, stderr used as the rejection reason
    sent to the agent
  - any other — non-fatal warning; CLI continues

### Configuration schema

The top level of `hooks/hooks.json` is an object with a single `"hooks"` key.
Event names (`BeforeTool`, `AfterTool`, etc.) live **inside** that wrapper —
not at the root of the file. The loader rejects files where the event names
appear directly at the top level.

```json
{
  "hooks": {
    "BeforeTool": [
      {
        "matcher": "run_shell_command|write_file",
        "sequential": true,
        "hooks": [
          {
            "type": "command",
            "command": "node ${extensionPath}${/}hooks${/}validate.js",
            "name": "validate-shell",
            "timeout": 60000,
            "description": "Block destructive operations"
          }
        ]
      }
    ]
  }
}
```

**Hook definition** (top-level array entry per event):

| Field        | Type      | Req | Purpose                                                       |
|--------------|-----------|-----|---------------------------------------------------------------|
| `matcher`    | `string`  | No  | Regex (tools) or exact string (lifecycle); filters when fires |
| `sequential` | `boolean` | No  | If true, hooks in the group run one after another, not parallel |
| `hooks`      | `array`   | Yes | Array of hook configurations                                  |

**Hook configuration** (entry inside `hooks[]`):

| Field         | Type     | Req | Purpose                                                       |
|---------------|----------|-----|---------------------------------------------------------------|
| `type`        | `string` | Yes | Currently only `"command"` is supported                       |
| `command`     | `string` | Yes | Shell command to execute (when `type` is `"command"`)         |
| `name`        | `string` | No  | Friendly name for logs                                        |
| `timeout`     | `number` | No  | Execution timeout in ms; default 60000                        |
| `description` | `string` | No  | Brief explanation                                             |

### Base input every hook receives via stdin

```json
{
  "session_id": "string",
  "transcript_path": "string",
  "cwd": "string",
  "hook_event_name": "string",
  "timestamp": "string"
}
```

Each event adds its own fields on top of these.

### Common output fields (in stdout JSON)

| Field                | Type      | Effect                                                              |
|----------------------|-----------|---------------------------------------------------------------------|
| `decision`           | `string`  | `"allow"` or `"deny"` (alias `"block"`); meaning depends on event   |
| `reason`             | `string`  | Required when denying; sent to agent as feedback or replaces output |
| `continue`           | `boolean` | If false, kills the entire agent loop                               |
| `stopReason`         | `string`  | Shown when `continue: false`                                        |
| `systemMessage`      | `string`  | Displayed to user in terminal                                       |
| `suppressOutput`     | `boolean` | Hides hook metadata from logs/telemetry                             |
| `hookSpecificOutput` | `object`  | Event-specific overrides — see each event                           |

### The 11 events

#### Tool hooks
Match `tool_name`. Built-in tools use their plain names (e.g. `read_file`).
MCP tools follow `mcp_<server_name>_<tool_name>`. Matchers are regex.

**`BeforeTool`** — before tool invocation. Validate args, deny, rewrite.
- Input: `tool_name`, `tool_input`, `mcp_context?`, `original_request_name?`
- Output: `decision: "deny"` blocks; `hookSpecificOutput.tool_input` merges
  with and overrides model args; `continue: false` kills the loop.
- Exit 2 = block tool; turn continues, stderr becomes reason.

**`AfterTool`** — after tool execution. Audit, transform, hide, or chain.
- Input: `tool_name`, `tool_input`, `tool_response` (`{llmContent, returnDisplay, error?}`), `mcp_context?`, `original_request_name?`
- Output: `decision: "deny"` hides real output, `reason` replaces it;
  `hookSpecificOutput.additionalContext` appends to the result;
  `hookSpecificOutput.tailToolCallRequest` (`{name, args}`) chains another
  tool whose result replaces the original — deterministic agent routing.
- Exit 2 = block result; turn continues with stderr as replacement.

#### Agent hooks

**`BeforeAgent`** — after user prompt, before planning. Inject context,
validate, block.
- Input: `prompt`
- Output: `hookSpecificOutput.additionalContext` appends to prompt;
  `decision: "deny"` blocks turn AND discards the message from history;
  `continue: false` blocks but saves to history.
- Exit 2 = block turn, erase prompt.

**`AfterAgent`** — after model's final response. Validate, force retry.
- Input: `prompt`, `prompt_response`, `stop_hook_active`
- Output: `decision: "deny"` rejects response and retries with `reason`
  as new prompt; `continue: false` stops session without retry;
  `hookSpecificOutput.clearContext: true` wipes LLM history while
  preserving display.
- Exit 2 = retry with stderr as feedback prompt.

#### Model hooks

**`BeforeModel`** — before LLM call. Override model/params or skip the call.
- Input: `llm_request` (`{model, messages, config}`)
- Output: `hookSpecificOutput.llm_request` overrides parts of the request;
  `hookSpecificOutput.llm_response` returns a synthetic response and skips
  the LLM entirely; `decision: "deny"` blocks.
- Exit 2 = block turn, skip LLM.

**`BeforeToolSelection`** — before LLM picks tools. Filter the toolset.
- Input: `llm_request`
- Output: `hookSpecificOutput.toolConfig.mode` (`"AUTO"` | `"ANY"` |
  `"NONE"`) — `NONE` wins over other hooks; `ANY` forces a tool call;
  `hookSpecificOutput.toolConfig.allowedFunctionNames` whitelists tools;
  multiple hooks' whitelists union.
- **Limitations**: no `decision`, `continue`, or `systemMessage` support.

**`AfterModel`** — after each model response chunk. Redact, replace, abort.
- Input: `llm_request`, `llm_response`
- Output: `hookSpecificOutput.llm_response` replaces the chunk;
  `decision: "deny"` discards chunk and blocks turn; `continue: false`
  kills the loop.
- **Fires per chunk** during streaming.
- Exit 2 = block response, abort turn.

#### Lifecycle / system hooks (mostly observational)

**`SessionStart`** — startup, resume, or after `/clear`. Load initial context.
- Input: `source: "startup" | "resume" | "clear"`
- Output: `hookSpecificOutput.additionalContext` (interactive: first turn
  in history; non-interactive: prepended to prompt); `systemMessage`.
- **Advisory only** — `continue` and `decision` ignored. Startup never blocks.

**`SessionEnd`** — exit or session clear. Cleanup, telemetry.
- Input: `reason: "exit" | "clear" | "logout" | "prompt_input_exit" | "other"`
- Output: `systemMessage`.
- **Best effort** — CLI does not wait for completion. Flow control ignored.

**`Notification`** — system alerts (e.g. tool permission requests).
- Input: `notification_type: "ToolPermission"`, `message`, `details`
- Output: `systemMessage`.
- **Observability only** — cannot block alerts or grant permissions.

**`PreCompress`** — before history compression to save tokens.
- Input: `trigger: "auto" | "manual"`
- Output: `systemMessage`.
- **Advisory only** — fires asynchronously, cannot block or modify
  compression.

### Stable Model API (for hooks that touch LLM I/O)

Used by `BeforeModel`, `BeforeToolSelection`, `AfterModel`. SDK-agnostic so
hooks don't break across SDK updates.

```text
LLMRequest:
{
  "model": string,
  "messages": [{ "role": "user"|"model"|"system", "content": string }],
  "config": { "temperature": number, ... },
  "toolConfig": { "mode": string, "allowedFunctionNames": string[] }
}

LLMResponse:
{
  "candidates": [{
    "content": { "role": "model", "parts": string[] },
    "finishReason": string
  }],
  "usageMetadata": { "totalTokenCount": number }
}
```

Source: `geminicli.com/docs/hooks/reference/` (Apr 10, 2026).

---

## 11. Policy Engine (`policies/*.toml`)

Extensions can ship `.toml` policy files in a `policies/` directory. They
contribute rules and safety checkers to the CLI's Policy Engine.

```toml
[[rule]]
mcpName = "my_server"
toolName = "dangerous_tool"
decision = "ask_user"
priority = 100

[[safety_checker]]
mcpName = "my_server"
toolName = "write_data"
priority = 200

[safety_checker.checker]
type = "in-process"
name = "allowed-path"
required_context = ["environment"]
```

### Tier hierarchy

Extensions run in **tier 2**, alongside workspace-defined policies:

- Tier 0: admin policies
- Tier 1: user policies
- Tier 2: extension and workspace policies (**this is you**)
- Tier 3: built-in defaults

Higher-tier rules override lower-tier ones when matching.

### Critical security restrictions

The CLI **silently filters out** these from extension policies:

- `allow` decisions
- `yolo` mode configurations

This means extensions cannot grant auto-approval or bypass user confirmation
under any circumstance. If you need that behavior, it must come from user
or admin policy.

Source: `geminicli.com/docs/extensions/reference/` (Policy Engine section);
`geminicli.com/docs/reference/policy-engine/`.

---

## 12. Themes (in manifest)

Themes are declared inline in the manifest, not as files in a directory.
Each theme is a `CustomTheme` object in the `themes` array.

```json
"themes": [
  {
    "name": "shades-of-green",
    "type": "custom",
    "background": { "primary": "#1a362a" },
    "text": {
      "primary": "#a6e3a1",
      "secondary": "#6e8e7a",
      "link": "#89e689"
    },
    "status": {
      "success": "#76c076",
      "warning": "#d9e689",
      "error": "#b34e4e"
    },
    "border": { "default": "#4a6c5a" },
    "ui": { "comment": "#6e8e7a" }
  }
]
```

Users select via `/theme` or by setting `ui.theme` in `settings.json`. When
referencing a theme from an extension, the qualified name is
`<theme-name> (<extension-name>)`.

Source: `geminicli.com/docs/extensions/reference/`.

---

## 13. Context loading and `GEMINI.md`

The CLI loads context files hierarchically and concatenates them into the
prompt. The order is:

1. **Global**: `~/.gemini/GEMINI.md`
2. **Workspace**: `GEMINI.md` files in configured workspace directories and
   their parent directories
3. **Just-in-time (JIT)**: When a tool accesses a file or directory, the CLI
   automatically scans for `GEMINI.md` files in that directory and its
   ancestors up to a trusted root

Extensions contribute their own `GEMINI.md` (or whatever `contextFileName`
specifies). It loads at extension load time, not in the JIT pass.

The CLI footer shows the count of loaded context files.

### The import processor

`GEMINI.md` files can import other markdown using `@file.md` syntax:

```markdown
# Main GEMINI.md

@./components/instructions.md

@../shared/style-guide.md
```

Both relative and absolute paths work.

### Customizing the context filename

In `settings.json`:

```json
{
  "context": {
    "fileName": ["AGENTS.md", "CONTEXT.md", "GEMINI.md"]
  }
}
```

In an extension manifest, use `contextFileName` (string or string array)
instead.

### Managing context at runtime

- `/memory show` — inspect concatenated context
- `/memory reload` — re-scan all context files
- `/memory add <text>` — append to global `~/.gemini/GEMINI.md`

Source: `geminicli.com/docs/cli/gemini-md/` (Mar 7, 2026).

---

## 14. Conflict resolution and precedence

When multiple sources define the same thing, these rules decide who wins.

### MCP servers
If an extension and a `settings.json` both define a server with the same
name, **`settings.json` wins.** Lets users override extension server config.

### Slash commands
Extension commands have the lowest precedence. If a user or project command
has the same name, the extension version is reachable as
`/<extension-name>.<command>` (dot, not colon — colon is for sub-namespacing
within a single source).

### Skills
Discovery order, lowest to highest precedence: built-in → extension → user
→ workspace.

### Themes
Extension theme names get qualified with the extension name to avoid clash:
`<theme> (<extension>)`.

### Policies
Tiered: admin > user > extension/workspace > built-in. Same-tier rules use
explicit `priority` field.

### Settings (extension-declared user values)
Workspace-scope values override user-scope values, when the workspace is
trusted.

Source: `geminicli.com/docs/extensions/reference/`.

---

## 15. Lifecycle: install, develop, update, release

### Management commands

```bash
# Scaffold from a template
gemini extensions new <path> [template]
# Templates: mcp-server, context, custom-commands, exclude-tools

# Develop with live changes (symlink, no reinstall on every change)
gemini extensions link <path>

# Install (creates a copy of the extension)
gemini extensions install <github-url-or-path> \
  [--ref <branch>] [--auto-update] [--pre-release] \
  [--consent] [--skip-settings]

# Update
gemini extensions update <name>
gemini extensions update --all

# Disable / enable per scope
gemini extensions disable <name> [--scope <user|workspace>]
gemini extensions enable <name> [--scope <user|workspace>]

# Configure user-supplied settings
gemini extensions config <name> [setting] [--scope <scope>]

# Uninstall
gemini extensions uninstall <name...>

# Inside an interactive session
/extensions list   # see what's loaded
```

### Restart rules

Most management operations — including any change to the manifest, hooks,
agents, skills, or policies — take effect only after **restarting the CLI
session.** Custom commands are the exception: `/commands reload` picks up
TOML changes without a restart.

When developing with `gemini extensions link`, you still need to restart
the session to pick up changes in most cases. The link saves you from
having to reinstall, not from having to restart.

### Releasing

For releases via GitHub:
- Tag releases with semver (major: breaking, minor: features, patch: fixes)
- Use git branches as release channels:
  ```bash
  gemini extensions install github.com/user/repo            # default branch
  gemini extensions install github.com/user/repo --ref dev  # dev channel
  ```
- In GitHub Release archives, include `dist/`, `gemini-extension.json`,
  `package.json`. Exclude `node_modules/` and `src/` to keep download size
  down.

Source: `geminicli.com/docs/extensions/reference/`;
`geminicli.com/docs/extensions/best-practices/`.

---

## 16. Best practices and troubleshooting

### Recommended structure for non-trivial extensions

```
my-extension/
├── package.json
├── tsconfig.json
├── gemini-extension.json
├── src/
│   ├── index.ts
│   └── tools/
└── dist/
```

- TypeScript is strongly recommended.
- Bundle dependencies with `esbuild` or similar to avoid install-time
  conflicts.
- Use `gemini extensions link .` from the dev directory.
- Restart the CLI after rebuilds to pick up changes.

### `GEMINI.md` for extensions

- Focus on the high-level purpose and how the model should use your tools.
- Be concise. Don't dump exhaustive documentation.
- Include brief usage examples.

### Security

- Apply minimum permissions. If `run_shell_command` is too broad, restrict
  patterns in the manifest:
  ```json
  "excludeTools": ["run_shell_command(rm -rf *)"]
  ```
- Validate all tool inputs in your MCP server. The MCP server runs on the
  user's machine — treat all input as untrusted.
- For path-handling tools, check that resolved paths are inside an allowed
  directory:
  ```javascript
  if (!path.resolve(inputPath).startsWith(path.resolve(allowedDir) + path.sep)) {
    throw new Error('Access denied');
  }
  ```
- Mark API keys and tokens `"sensitive": true` so they go to the keychain,
  not a plaintext `.env`.

### Troubleshooting checklist

**Extension not in `/extensions list`:**
- `gemini-extension.json` must be valid JSON at the root
- The `name` field must match the directory name **exactly**
- The CLI was restarted after install or link

**Tools not working:**
- Check CLI logs for MCP server start failure
- Run the server's `command` and `args` directly in a terminal — does it
  start outside the CLI?
- Press **F12** in interactive mode to open the debug console; inspect
  tool calls and responses

**Custom command not responding:**
- User/project commands take precedence; try `/<extension-name>.<command>`
- `/help` lists all commands and where they came from
- After modifying a TOML file: `/commands reload`

Source: `geminicli.com/docs/extensions/best-practices/` (Apr 10, 2026).

---

## 17. Source map

Authoritative pages used to compile this reference:

| Section                     | URL                                                                         | Last updated  |
|-----------------------------|-----------------------------------------------------------------------------|---------------|
| Extension reference         | `https://geminicli.com/docs/extensions/reference/`                          | Apr 10, 2026  |
| Build extensions guide      | `https://geminicli.com/docs/extensions/writing-extensions/`                 | (live)        |
| Best practices              | `https://geminicli.com/docs/extensions/best-practices/`                     | Apr 10, 2026  |
| Releasing                   | `https://geminicli.com/docs/extensions/releasing/`                          | (live)        |
| Hooks reference             | `https://geminicli.com/docs/hooks/reference/`                               | Apr 10, 2026  |
| Custom commands             | `https://geminicli.com/docs/cli/custom-commands/`                           | Apr 30, 2026  |
| Subagents                   | `https://geminicli.com/docs/core/subagents/`                                | Apr 14, 2026  |
| Creating Agent Skills       | `https://geminicli.com/docs/cli/creating-skills/`                           | Apr 30, 2026  |
| Project context (GEMINI.md) | `https://geminicli.com/docs/cli/gemini-md/`                                 | Mar 7, 2026   |
| Policy Engine               | `https://geminicli.com/docs/reference/policy-engine/`                       | (not fetched) |
| Memory import processor     | `https://geminicli.com/docs/reference/memport/`                             | (not fetched) |
| `ExtensionConfig` source    | `packages/cli/src/config/extension.ts` @ `237864eb`                         | Mar 8, 2026   |
| Extension manager source    | `packages/cli/src/config/extension-manager.ts` @ `237864eb`                 | Mar 8, 2026   |

Sections marked "not fetched" — Policy Engine and Memory import processor —
were referenced from other pages but their dedicated reference pages were
not pulled into this document. If you need exhaustive detail on either,
fetch them directly.

End of canonical reference.