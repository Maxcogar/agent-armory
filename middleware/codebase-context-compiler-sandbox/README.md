# Codebase Context Compiler — sandbox build (`ctxpack`)

`ctxpack` builds a versioned, evidence-backed repository map and compiles the smallest complete task-specific Context Package that regular Claude Code needs before it edits. The package separates repository facts, unknowns, allowed creation points, forbidden moves, verification guidance, and checked-but-rejected context so Claude Code cannot quietly fill gaps with guesses.

**This is the sandbox build.** It is a fork of `../codebase-context-compiler` adapted to run in ephemeral, isolated, possibly network-restricted containers — Claude Code on the web, CI runners, Docker. The behavior, schemas, and enforcement model are identical to the local build; only the things that prevented a *cold container* from running it have changed. See [Differences from the local build](#differences-from-the-local-build). The local build remains the reference implementation.

This project implements the MVP described by:

- `docs/specs/spec-codebase-context-compiler(1).md`
- `docs/architecture/architecture-codebase-context-compiler(2).md`

Ongoing work and remaining gates are tracked in `docs/roadmap.md`.

## Quick start in a sandbox

One command installs (no native toolchain needed), builds, and wires the repo's Claude Code hooks:

```bash
sh scripts/sandbox-bootstrap.sh
```

Run it from a Claude Code web/CI **SessionStart** step so a fresh container is ready automatically. It is idempotent. `CTXPACK_INIT_ROOT` overrides which repo root is guarded (default: the git toplevel); set it empty to build without installing hooks.

## Install / Build

```bash
npm install   # also builds via the `prepare` lifecycle script
npm run build # (explicit; only needed if install ran with --ignore-scripts)
npm test
node dist/cli/main.js --help
```

Requires **Node >= 22.5** (for the built-in `node:sqlite` module). Installation needs no C/C++ toolchain or prebuilt-binary download, so it works offline. The core indexing and packaging path does not require a model call.

## Differences from the local build

Everything else — the Context Package format, the assumption firewall, patch review, the hook enforcement model — is unchanged. Only these were adapted for sandboxes:

| Concern | Local build | Sandbox build |
|---|---|---|
| Storage engine | native `better-sqlite3` (needs a compiler / prebuilt download at install) | Node's built-in **`node:sqlite`** — zero native deps, installs offline |
| Cold-container build | manual `npm install && npm run build` | `prepare` builds on install; `scripts/sandbox-bootstrap.sh` installs + builds + wires hooks |
| Hook commands (`ctxpack init`) | bakes this machine's absolute Node + CLI paths into `.claude/settings.json` | portable: `node` from PATH and a `$CLAUDE_PROJECT_DIR`-relative CLI path that resolves in any checkout (override with `CTXPACK_HOOK_COMMAND`) |
| Host repo hygiene | — | `init` adds `.context/` and `.ctxpack.db*` to the guarded repo's `.gitignore` so artifacts are never committed |
| `node:sqlite` warning | n/a | filtered so the experimental notice never leaks into CLI/hook stderr |

The repository ignores `package-lock.json` workspace-wide, so installs resolve dependency ranges fresh; `sandbox-bootstrap.sh` uses `npm ci` when a lockfile happens to be present and falls back to `npm install` otherwise.

## Regular Claude Code Integration

Run this once inside a repository:

```bash
ctxpack init
```

`ctxpack init` installs native Claude Code hooks in `.claude/settings.json`:

- `UserPromptSubmit` indexes the repository, generates `.context/task-context.json`, renders `.context/task-context.md`, and injects the package into regular Claude Code as hook context.
- `PreToolUse` blocks `Edit`, `Write`, `MultiEdit`, and notebook edits until the transcript contains a plan wrapped in `<CTXPACK_PLAN>...</CTXPACK_PLAN>` that passes the assumption firewall.
- For explanation/investigation prompts, `PreToolUse` blocks `Task` / `Explore` delegation so Claude Code inspects the relevant source directly in the current conversation.
- `PreToolUse` also blocks generated/vendor/build-output files from hand edits.
- `Stop` reports changed-file impact and likely verification commands.

This is the primary AIR1 enforcement path. Writing `.context/task-context.md` and merely telling Claude Code to read it does not satisfy the spec.

## Manual CLI

```bash
ctxpack index
ctxpack package "add dark mode to settings page"
ctxpack expand expansion-request.json
ctxpack override human-override.json
ctxpack check-plan plan.txt
ctxpack review change.diff --sarif --verification run_passed
ctxpack run-agent --plan plan.txt
```

`run-agent` is secondary and useful for deterministic harness demonstrations. Regular Claude Code uses the native hook path above.

An expansion request is JSON:

```json
{
  "missing": "related test coverage",
  "why_needed": "the implementation step is blocked until the relevant tests are known",
  "blocked_claim_or_step": "decide which test file must be updated",
  "candidate_paths": ["tests/settings.test.ts"]
}
```

If relevant context is found, `ctxpack expand` writes an updated package with a new `package_id`. If not, it returns a denial with checked paths and a reason.

Human override is explicit and auditable. It is for reviewer-confirmed information that is outside repository evidence, such as a product decision or a deliberate allowed creation point. Overrides write new package evidence with `source_type: "human_override"` rather than silently converting guesses into facts.

```json
{
  "action": "add_known_fact",
  "statement": "Max Cogar confirmed SettingsPage remains the target screen for this task.",
  "reason": "Human reviewer supplied product intent that is not inferable from repository code.",
  "path": "src/routes/SettingsPage.tsx"
}
```

## Configuration

`ctxpack` reads `ctxpack.config.json` or `.ctxpack.json` from the repository root:

```json
{
  "excludes": ["**/.cache/**"],
  "maxBytes": 524288,
  "tokenBudget": 12000,
  "enableTypeScriptEnrichment": true,
  "staticAnalysis": ["analysis.sarif"]
}
```

TypeScript enrichment is enabled by default when the `typescript` dependency is available. It adds semantic reference edges and reports TypeScript diagnostics as capability gaps. `staticAnalysis` points to SARIF 2.1.0 files; imported findings are stored in `.ctxpack.db` and surfaced as package key facts / known facts with `static_analysis` evidence.

## Artifacts

- `.ctxpack.db` - SQLite/FTS5 repository map, package history, review history, expansion audit trail, and audit log.
- `.context/task-context.json` - authoritative Context Package validated by JSON Schema 2020-12.
- `.context/task-context.md` - human-readable companion generated from JSON.
- `.context/review.json` - patch review findings.
- `.context/review.sarif` - optional SARIF 2.1.0 export.

## Architecture

```text
src/core/      domain types, ports, and services
src/adapters/  tree-sitter, sqlite, schema, markdown, SARIF, optional agent adapter
src/security/  secret redaction, prompt-injection labeling, audit log
src/cli/       commands and regular Claude Code hook bridge
```

Core services must not import adapters. Adapters depend inward on core ports.

## Current Scope

Implemented for the MVP:

- repository snapshots and staleness detection
- TypeScript/JavaScript/TSX/Python Tree-sitter indexing
- TypeScript semantic reference enrichment
- SARIF static-analysis ingestion
- SQLite + FTS5 storage
- task recipes and relationship expansion
- evidence-backed JSON/Markdown Context Packages
- context expansion request/update/denial
- explicit human override workflow
- assumption firewall
- patch review with optional SARIF export
- native regular Claude Code hook integration

Deferred by architecture:

- Codex and Gemini adapters
- MCP/HTTP/IDE/cloud/team surfaces
