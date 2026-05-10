# Claude Code Roles System

Isolated, role-specific Claude Code instances launched via PowerShell. Each role gets its own CLAUDE.md, settings.json, MCP servers, and credentials — completely walled off from your main `~/.claude` setup using `CLAUDE_CONFIG_DIR`.

## Why This Exists

Skills say "you should." Roles say "you can only."

A skill can tell Claude to use codegraph for dependency analysis. Claude will ignore it and grep instead, because grep is easier and produces something that looks like progress. A role removes grep entirely and leaves codegraph as the only path. Enforcement through constraint, not instruction.

## Architecture

```
programmatic-claude-profiles/
├── roles/                          # Source of truth (version controlled)
│   ├── _shared/                    # Content injected into roles via {{PLACEHOLDER}}
│   │   └── expert-standard.md      # → {{EXPERT_STANDARD}}
│   ├── code-reviewer/              # Read-only review, Expert Standard evaluation
│   │   ├── CLAUDE.md
│   │   ├── settings.json
│   │   └── default-prompt.txt
│   └── codebase-auditor/           # Codegraph + RAG forensic audit
│       ├── CLAUDE.md
│       ├── settings.json
│       ├── default-prompt.txt
│       └── .mcp.json               # Wires codegraph + codebase-rag MCP servers
├── Setup-ClaudeRoles.ps1           # Reads roles/, injects shared content, installs to ~/claude-roles/
├── Invoke-ClaudeRole.ps1           # Launches a role against a target directory
├── New-ClaudeRole.ps1              # Interactive wizard to create new roles
└── README.md
```

**Separation:** `roles/` holds portable definitions (no credentials). `Setup-ClaudeRoles.ps1` reads from `roles/` and installs to `~/claude-roles/` with credentials wired. The repo is the source of truth; the install directory is a deployment target.

## First-Time Setup

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
cd C:\Users\maxco\Documents\agent-armory\programmatic-claude-profiles
Unblock-File .\Setup-ClaudeRoles.ps1
Unblock-File .\Invoke-ClaudeRole.ps1
Unblock-File .\New-ClaudeRole.ps1

.\Setup-ClaudeRoles.ps1
```

## Usage

```powershell
# Basic — run a review and wait
.\Invoke-ClaudeRole.ps1 -Role code-reviewer -TargetDir C:\projects\myapp

# Custom prompt
.\Invoke-ClaudeRole.ps1 -Role codebase-auditor -TargetDir C:\projects\myapp `
    -Prompt "Focus on dead API endpoints and duplicated logic in the backend."

# Background job
$job = .\Invoke-ClaudeRole.ps1 -Role codebase-auditor -TargetDir C:\projects\myapp -Async
Get-Job $job.Id              # check status
$job | Wait-Job | Receive-Job  # collect output
```

## Available Roles

### code-reviewer

Read-only code review with Expert Standard evaluation. Evaluates against engineering standards (SOLID, DRY, OWASP), not codebase patterns. Produces severity-classified findings.

**Permissions:** Read + Glob + git read-only. No Bash, no Edit, no web.
**Output:** `claude-review-report.md`

### codebase-auditor

Forensic codebase audit using codegraph (AST-parsed dependency graph) and codebase RAG (semantic constraint search). Finds dead code, duplicated logic, broken references, API mismatches, constraint violations, and dependency tangles.

**Permissions:** Read + Glob + git read-only + codegraph MCP + codebase-rag MCP. No Bash (no grep, no find, no cat for code discovery), no Edit, no web.
**MCP servers:** codegraph, codebase-rag
**Output:** `codebase-audit-report.md`

The key: Bash is denied as a catchall, so Claude cannot fall back to grep/find for code discovery. Codegraph and RAG are the only paths. This forces deterministic analysis instead of regex guessing.

## How Isolation Works

`CLAUDE_CONFIG_DIR` tells Claude Code to use the role's directory instead of `~/.claude/` for all user-level config:

- Your main `~/.claude/CLAUDE.md` is **not loaded**
- Your main `~/.claude/settings.json` is **not loaded**
- Your skills, commands, MCP servers — **none of it bleeds in**
- Only the role's own files are used

The role's `.mcp.json` wires in only the MCP servers that role needs. No Context7, no sequential-thinking, no other noise.

## Shared Content Injection

Files in `roles/_shared/` can be injected into any role's CLAUDE.md using `{{PLACEHOLDER}}` syntax.

`roles/_shared/expert-standard.md` → `{{EXPERT_STANDARD}}`

The filename (lowercased, hyphens replaced with underscores) becomes the placeholder name. Setup-ClaudeRoles.ps1 performs the injection at install time, so the source CLAUDE.md stays clean and the shared content is maintained in one place.

## Creating New Roles

### Interactive Wizard

```powershell
.\New-ClaudeRole.ps1
```

Walks you through: name, identity, task, output file, Expert Standard inclusion, permissions, MCP servers, and default prompt. Creates the role definition in `roles/`. Run `Setup-ClaudeRoles.ps1` after to install.

### Manual

1. Create a directory under `roles/` with the role name
2. Add `CLAUDE.md` (role identity and instructions)
3. Add `settings.json` (permissions)
4. Add `default-prompt.txt` (what it does when invoked without `-Prompt`)
5. Optionally add `.mcp.json` (MCP server configuration)
6. Run `.\Setup-ClaudeRoles.ps1`

## Permission Design Principles

**Deny the lazy path.** If you want Claude to use codegraph, deny Bash (which blocks grep/find/cat) and allow only the codegraph MCP tools. Now codegraph isn't optional — it's the only option.

**Deny-first evaluation.** Claude Code evaluates rules in order: deny → ask → allow. Specific allows carve exceptions from broad denies. `"deny": ["Bash"]` blocks everything; `"allow": ["Bash(git diff *)"]` carves git diff back in.

**Read/Edit deny rules don't block Bash.** A `Read(.env)` deny blocks the Read tool but not `cat .env` in Bash. If you allow Bash, Read/Edit denies are leaky. For real lockdown, deny Bash entirely and allow only specific safe commands.

## Credential Management

Setup symlinks credentials from `~/.claude/.credentials.json` into each role directory. If symlinks require admin (common on Windows without Developer Mode), it falls back to copying.

If you re-authenticate with Claude Code, re-run `Setup-ClaudeRoles.ps1` to refresh credentials in all roles.

## Troubleshooting

**"Role not found"** — Run `Setup-ClaudeRoles.ps1` first.

**MCP servers not connecting** — Check the paths in `.mcp.json`. Codegraph needs `npm run build` in its directory first. Codebase RAG needs `pip install -r requirements.txt`.

**Agent ignoring permissions** — Verify `--dangerously-skip-permissions` is set (required for headless mode). Permissions are still enforced via `settings.json` even with this flag — it just skips interactive prompts.

**Credentials stale** — Delete `.credentials.json` from the role's install directory and re-run `Setup-ClaudeRoles.ps1`.
