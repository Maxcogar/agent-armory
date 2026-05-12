# AgentBoard port map — Claude → Gemini → Codex

The AgentBoard plugin lives in three runtimes:

- **`claude-plugins/agentboard/`** — Claude Code plugin. **Source of truth.** All
  changes originate here.
- **`gemini-extensions/agentboard-gemini/`** — Gemini CLI extension. Follows Claude.
- **`codex-plugins/agentboard/`** — Codex plugin. Follows Claude.

This document is the contract that keeps the three in sync. After every Claude
change, an agent (in any runtime) reads this map and produces equivalent changes
in the other two ports.

---

## Sync workflow

After committing a Claude change, open a fresh agent session in any runtime and
send this prompt verbatim (substituting the commit hash):

> Read `PORT_MAP.md`. List the files changed on `claude-plugins/agentboard/`
> since commit `<hash>` (use `git log claude-plugins/agentboard/ <hash>..HEAD`).
> For each changed file, locate its Gemini and Codex equivalents from the
> mapping table, apply the translation rules, and produce per-target diffs.
> Stop and ask before doing anything in the "Ask, don't translate" section.
> Commit per target with a message referencing the originating Claude commit.

Review the diffs before committing. Don't trust the agent's summary —
inspect the actual file changes.

---

## 1. Top-level layout mapping

| Claude file/dir | Gemini file/dir | Codex file/dir | Notes |
|---|---|---|---|
| `.claude-plugin/plugin.json` | `gemini-extension.json` (at root) | `.codex-plugin/plugin.json` | Each manifest format is different — see §2 |
| `.claude/settings.local.json` | — | — | Claude-only |
| `.mcp.json` | `mcpServers` block inside `gemini-extension.json` | `.mcp.json` | Same shape on Claude and Codex; embedded in manifest on Gemini |
| `README.md` | `README.md` | `README.md` | Install instructions diverge per host |
| `commands/*.md` | `commands/*.toml` + `agents/<name>-agent.md` | `skills/<name>/SKILL.md` | Three different shapes — see §3 |
| `agents/audit-agent.md` (deprecated stub) | — | — | Don't port deprecation stubs |
| `agents/planning-agent.md` (deprecated stub) | — | — | Don't port deprecation stubs |
| `agents/planning-research-agent.md` + `agents/plan-compose-agent.md` (Claude split) | `agents/planning-agent.md` (single rigorous) | `skills/orchestrate/references/planning-worker.md` (single rigorous) | See §5 — non-Claude ports use the single-agent design from `reference/agent-profiles/` |
| `agents/audit-research-agent.md` + `agents/audit-compose-agent.md` (Claude split) | `agents/audit-agent.md` (single rigorous) | `skills/orchestrate/references/audit-worker.md` (single rigorous) | Same as above |
| `agents/review-agent.md` | `agents/review-agent.md` | `skills/orchestrate/references/review-worker.md` | Direct port with tool-name translation |
| `agents/implementation-agent.md` | `agents/implementation-agent.md` | `skills/orchestrate/references/implementation-worker.md` | Direct port with tool-name translation |
| `hooks/hooks.json` | `hooks/hooks.json` | Codex-specific (research before porting) | Schema differs — see §4 |
| `hooks/scripts/*.sh` | `hooks/scripts/*.py` | Codex-specific | Cross-platform Python on Gemini; bash on Claude |
| `skills/agentboard/SKILL.md` | `skills/agentboard/SKILL.md` | `skills/agentboard/SKILL.md` | Direct port with tool-name + install-section translation |
| `skills/codebase-rag/SKILL.md` | `skills/codebase-rag/SKILL.md` | `skills/codebase-rag/SKILL.md` | Direct port with tool-name translation |
| `skills/codebase-rag/references/orchestration-integration.md` | same path | same path | Direct port with tool-name translation |
| `skills/codebase-sweep/SKILL.md` | `skills/codebase-sweep/SKILL.md` | `skills/codebase-sweep/SKILL.md` | Direct port |
| `skills/expert-standards/SKILL.md` | `skills/expert-standard/SKILL.md` | `skills/expert-standards/SKILL.md` | Note dir name: Gemini drops the `s`, Codex keeps it. Internal `name:` is `expert-standard` everywhere |
| `skills/workspace-orchestration/SKILL.md` | `skills/workspace-orchestration/SKILL.md` | `skills/workspace-orchestration/SKILL.md` | Direct port; Gemini/Codex versions describe single-agent waves instead of haiku/opus split |
| `reference/agent-profiles/` | — | — | Reference docs for porting; not loaded by any runtime |
| — | `GEMINI.md` | — | Gemini-only context file (spec §13) |
| — | `package.json` | — | Gemini-only convention stub |
| — | — | `skills/<command-name>/SKILL.md` (one per slash command) | Codex command-as-skill pattern — see §3 |

---

## 2. Manifest format mapping

### Claude `.claude-plugin/plugin.json`

```json
{
  "name": "agentboard",
  "version": "...",
  "description": "...",
  "author": { "name": "..." },
  "hooks": "./hooks/hooks.json"
}
```

### Gemini `gemini-extension.json`

```json
{
  "name": "agentboard-gemini",
  "version": "...",
  "description": "...",
  "contextFileName": "GEMINI.md",
  "mcpServers": { ... }
}
```

No `author`, no `commands`/`agents`/`skills`/`hooks` keys — those are all
auto-discovered by directory presence. `mcpServers` is embedded, not external.

### Codex `.codex-plugin/plugin.json`

```json
{
  "name": "agentboard",
  "version": "...",
  "description": "...",
  "author": { "name": "...", "url": "..." },
  "skills": "./skills/",
  "mcpServers": "./.mcp.json",
  "interface": { ... }
}
```

Has a rich `interface` block (`displayName`, `defaultPrompt`, `brandColor`, etc.)
that Claude/Gemini don't.

**Rule:** Manifest-level metadata changes (name, version, description) propagate
1:1 across all three. Structural changes (adding `hooks`, adding a new key) need
per-manifest evaluation.

---

## 3. Commands / agents / skills mapping

The three runtimes have fundamentally different ways of expressing slash commands
and worker agents. A single Claude command file maps to **different file
structures per port.**

### Claude: command = `.md` file with prompt body inline

```markdown
---
name: kickoff
description: Onboard ...
---

# AgentBoard Kickoff
[full prompt body inline]
```

### Gemini: command = `.toml` (description + prompt) + `agents/<name>-agent.md` (the body)

`commands/kickoff.toml`:
```toml
description = "Onboard ..."
prompt = """
Invoke the `kickoff-agent` subagent to onboard ...
{{args}}
"""
```

`agents/kickoff-agent.md`:
```markdown
---
name: kickoff-agent
description: Onboard ...
tools: ["mcp_agentboard_*", ...]
---

[full prompt body — same content as Claude's command body]
```

**Why split:** Gemini TOML commands only carry a description and prompt — the
substantive content has to live somewhere callable. Subagents are the clean
home. The TOML prompt's only job is to dispatch.

**Exception: `/orchestrate`.** Cannot be wrapped in a subagent (Gemini's
recursion protection forbids subagent → subagent dispatch). The full orchestration
logic lives inline in `commands/orchestrate.toml`'s prompt body.

### Codex: command = `skills/<name>/SKILL.md`

```markdown
---
name: kickoff
description: ...
---

# Kickoff
[full prompt body]
```

**Why:** Codex doesn't have a slash command primitive — everything is a skill
the agent invokes.

**Worker agents** (planning, review, implementation, audit) in Codex live as
`skills/orchestrate/references/<role>-worker.md` rather than top-level entities.
The `skills/orchestrate/SKILL.md` loads them as references.

---

## 4. Hooks mapping

| Aspect | Claude | Gemini | Codex |
|---|---|---|---|
| File path | `hooks/hooks.json` | `hooks/hooks.json` | Verify against Codex docs before porting |
| Top-level shape | Event names as top-level keys | Events nested under top-level `"hooks"` key | Verify |
| Event names | `SessionStart`, `PreToolUse`, `PostToolUse`, etc. | `SessionStart`, `BeforeTool`, `AfterTool`, etc. | Verify |
| Hook types | `"command"` and `"prompt"` | `"command"` only (no prompt-type hooks) | Verify |
| Tool matchers | `mcp__server__tool` (double underscore) | `mcp_server_tool` (single underscore) | Verify |
| Hook I/O | `$TOOL_INPUT`/`$TOOL_OUTPUT` env vars | stdin JSON / stdout JSON / exit 2 to block | Verify |
| Script language | bash `.sh` | Python `.py` (cross-platform) | Verify — Codex may need a third variant |

### Gemini's correct shape (the one I got wrong the first time)

```json
{
  "hooks": {
    "BeforeTool": [
      {
        "matcher": "mcp_agentboard_agentboard_submit_workspace_artifact",
        "hooks": [
          { "type": "command", "command": "python ${extensionPath}${/}hooks${/}scripts${/}foo.py", "timeout": 5000 }
        ]
      }
    ]
  }
}
```

The top-level `"hooks"` wrapper is mandatory. The loader rejects files where
event names appear at the root. Source: test fixture in
[google-gemini/gemini-cli PR #14460](https://github.com/google-gemini/gemini-cli/pull/14460/files).

### Gemini's hook script I/O contract

- **stdin:** JSON with `tool_name`, `tool_input`, (and `tool_response` for AfterTool).
- **stdout:** JSON only. Plain text on stdout corrupts parsing.
  - To block: `{"decision": "deny", "reason": "..."}`.
  - To inject context (AfterTool): `{"hookSpecificOutput": {"additionalContext": "..."}}`.
- **stderr:** logs only.
- **Exit:** 0 = success; 2 = block (stderr becomes the rejection reason); anything else = non-fatal warning.

The Python scripts under `agentboard-gemini/hooks/scripts/` are the working
reference implementation of this contract.

---

## 5. Architectural divergences — intentional, do NOT "fix"

These are differences by design. An agent doing a port sync MUST preserve them.

### 5a. Planning and audit pipeline shape

- **Claude:** Two-phase split. Wave 1 = `planning-research-agent` (haiku, cheap
  fact-gathering) + `plan-compose-agent` (opus, rigorous composition). Wave 4 =
  `audit-research-agent` + `audit-compose-agent`. The split exists to use cheap
  models for mechanical discovery and expensive models for judgment.
- **Gemini and Codex:** Single rigorous agent per wave. The Claude plugin's
  `reference/agent-profiles/README.md` explicitly says: *"single rigorous agent
  may be a better fit than the haiku-research / opus-compose split."* The
  `reference/agent-profiles/planning-agent.md` and `audit-agent.md` are the
  authoritative single-agent source for Gemini/Codex ports.

**Sync rule:** When Claude's `planning-research-agent.md` or `plan-compose-agent.md`
changes, the change has to be merged back into the *single* rigorous agent on
the other ports. Look at what the change is about — fact-gathering process
changes go into the discovery section of the single agent; rigor/output-contract
changes go into the planning/compose section. If you can't tell which, ask.

### 5b. `/orchestrate` execution context

- **Claude:** The orchestrate command is a prompt; Claude's main agent has access
  to `Task` and dispatches subagents freely.
- **Gemini:** The orchestrate command runs in the main agent context (no subagent
  wrapper). Gemini's recursion protection (§8 of the extension spec) forbids
  subagents from dispatching subagents — wrapping `/orchestrate` in a subagent
  breaks the whole pipeline.
- **Codex:** Verify per Codex's execution model; likely runs as a skill directly.

### 5c. Hook script language

- **Claude:** bash `.sh` (Claude assumes a POSIX shell).
- **Gemini:** Python `.py` (cross-platform, no jq dependency).
- **Codex:** verify.

### 5d. MCP server `clear-thought` launch

- **Claude:** `cmd /c npx -y -p @waldzellai/clear-thought mcp-server-clear-thought`
  (Windows-friendly).
- **Gemini:** same `cmd /c npx ...` form. Required because direct `npx` invocation
  fails through Gemini's MCP transport on Windows.
- **Codex:** verify.

### 5e. MCP server path conventions

- **Claude:** absolute paths in `.mcp.json`.
- **Gemini:** `${extensionPath}/../../mcp-servers/...` relative traversal in
  `gemini-extension.json`. Works as long as the extension stays inside the
  monorepo at `gemini-extensions/agentboard-gemini/`.
- **Codex:** verify against current `.mcp.json`.

---

## 6. Translation rules — mechanical rewrites the agent can do without asking

| What | Claude form | Gemini form | Codex form |
|---|---|---|---|
| MCP tool name in prose | `mcp__agentboard__agentboard_health_check` | `mcp_agentboard_agentboard_health_check` | Verify Codex convention |
| MCP tool name in `tools:` array | `mcp__agentboard__agentboard_*` | `mcp_agentboard_*` | Verify |
| Tool: read file | `Read` | `read_file` | Verify |
| Tool: grep | `Grep` | `grep_search` | Verify |
| Tool: shell | `Bash` | `run_shell_command` | Verify |
| Tool: skill loader | `Skill` | `activate_skill` | Verify |
| Skill: codebase-rag (rule changes) | rewrite tool prefixes | rewrite tool prefixes | rewrite tool prefixes |
| File: command body | `.md` with full body | `.toml` (dispatch) + `agents/<name>-agent.md` (body) | `skills/<name>/SKILL.md` |
| Hooks: event names | `PreToolUse`/`PostToolUse` | `BeforeTool`/`AfterTool` (wrapped in top-level `"hooks"`) | Verify |
| Hooks: scripts | bash | Python | Verify |

For prose content (instructions, decision rationales, output contracts), the
text is the same across ports — only the tool-name tokens and structural
wrappers change.

---

## 7. Ask, don't translate — stop and confirm before doing these

The agent must stop and ask the user before acting on any of these:

1. **A new event/hook type Claude added that the other runtimes don't support.**
   Don't pattern-match a non-existent equivalent. Surface the gap.
2. **A new MCP server in Claude's `.mcp.json`.** Confirm whether it exists for
   the target runtime and how to invoke it (Windows wrapping, env vars, etc.).
3. **A change that affects how a wave is split into phases.** This crosses
   §5a's intentional divergence — needs human judgment about how to fold the
   change into the single-agent design.
4. **Anything in `reference/agent-profiles/` changing.** Those docs are the
   porting source — a change there usually means the single-agent design itself
   is evolving, and the agent should ask before re-porting.
5. **A new top-level concept in any manifest** (e.g., Claude adds a new
   `.claude-plugin/plugin.json` field). Each port's manifest schema is fixed by
   its host; an analogous field may or may not exist.
6. **Anything labeled "experimental" or "preview"** in a commit message.

---

## 8. Lessons from earlier porting work (don't repeat these)

These are the specific mistakes that came up during the initial Gemini port.
A sync agent should treat them as known landmines:

1. **`hooks/hooks.json` requires a top-level `"hooks"` wrapper on Gemini.**
   Event names at the root level make the file invalid. Source: PR #14460.
2. **MCP tool names use single underscores on Gemini** (`mcp_server_tool`), not
   double (Claude's `mcp__server__tool`).
3. **Gemini subagents cannot dispatch subagents.** `/orchestrate` must run in
   the main agent, not be wrapped in an `orchestrate-agent` subagent.
4. **Subagents that use codegraph/codebase-rag/clear-thought must declare those
   MCP prefixes in their `tools:` array.** A `tools: ["mcp_agentboard_*"]` agent
   that calls `mcp_codegraph_codegraph_scan` will silently fail.
5. **Gemini's TOML commands use a `prompt` field — not `agent`.** There is no
   manifest mechanism for "command X runs subagent Y." The command's prompt body
   has to instruct the main agent to invoke the subagent.
6. **`commands`, `agents`, `skills`, `hooks` are not manifest keys on Gemini.**
   They're auto-discovered by directory presence. Adding them to the manifest
   does nothing.
7. **MCP server `trust` fields are silently stripped on Gemini.** Extensions
   cannot grant themselves elevated MCP permissions.
8. **Variable substitution (`${extensionPath}`, `${workspacePath}`, `${/}`) is
   manifest- and hooks-only on Gemini.** It does NOT work inside TOML commands,
   SKILL.md, or agent .md files.
9. **Always verify against the actual implementation,** not the spec doc.
   `GEMINI_EXTENSION_SPEC.md` is a digest — when it disagrees with the source
   code at `google-gemini/gemini-cli`, the source code wins. Item 1 above came
   from getting this wrong.

---

## 9. Update protocol for this document

When you make a Claude-side change that has no clean port (item 1–6 of §7),
or when you discover a new mismatch the map doesn't cover (item 1–9 of §8),
update this file in the same commit so the next sync run benefits from the
learning. The map is only useful if it's kept current.
