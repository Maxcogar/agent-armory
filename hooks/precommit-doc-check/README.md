# doc-sync

Mechanical enforcement of documentation updates when code changes. Built because no amount of prompting, hooks, or stern instructions will make coding agents reliably update docs during feature work.

## The Problem

Coding agents (Claude Code, Gemini, etc.) treat doc updates as secondary tasks they can drop when context gets crowded. You can add hooks, rules, reminders — they get ignored. The agent has 50 things competing for attention and docs always lose.

## The Solution

Stop asking the coding agent to do it. Instead:

1. **Detection** (`detect-stale-docs.sh`) — After code changes, scan all doc files for references to changed code. Any doc that mentions a changed file, function, class, route, or component is flagged as potentially stale.

2. **Remediation** (`sync-docs.sh`) — For each stale doc, spawn a *separate, single-purpose* Claude session whose only job is updating that one doc. No feature work in context, no competing priorities.

3. **Enforcement** (pre-commit hook) — When the agent commits, the hook runs detection, calls `sync-docs.sh` to update stale docs via focused Claude sessions, stages the updated docs, and lets the commit proceed with the updates included. The agent doesn't have to do anything — the hook handles it all.

## How Detection Works

The detection script:
- Runs `git diff` to find changed code files
- Extracts identifiers from the diff (function names, exports, class names, route paths, component names)
- Scans every `.md`, `.txt`, `.rst` file in the repo
- Flags any doc that references a changed filename, path, or identifier

## Limitations (honest)

- **Detection is grep-based.** If a doc describes a feature by behavior ("the dashboard shows filtered results") without ever mentioning the filename or function name, the detection script won't catch it. It catches references by name, not by semantic meaning.
- **False positives happen.** A doc mentioning `utils` will get flagged whenever any file with "utils" in the name changes. The sync script handles this gracefully — Claude will output the doc unchanged if the changes don't actually affect it.
- **The sync relies on Claude being available.** Either the `claude` CLI or the Anthropic API with a key. If neither is available, use `--report-only` and update manually.
- **The pre-commit hook can be bypassed** with `git commit --no-verify`. If the coding agent does this, the hook is useless. A workspace rule telling the agent not to use `--no-verify` may be needed depending on your agent's behavior.

## Installation

From inside any git repo:

```bash
bash /path/to/doc-sync/install.sh
```

This copies scripts to `./scripts/doc-sync/` and installs the pre-commit hook.

## Usage

```bash
# Check what's stale (no changes made)
scripts/doc-sync/detect-stale-docs.sh

# See what would be updated
scripts/doc-sync/sync-docs.sh --dry-run

# Auto-update stale docs
scripts/doc-sync/sync-docs.sh

# Use Anthropic API instead of claude CLI
ANTHROPIC_API_KEY=sk-... scripts/doc-sync/sync-docs.sh --api

# Check changes since a specific commit
scripts/doc-sync/sync-docs.sh --since HEAD~5

# Only check staged changes (what the pre-commit hook does)
scripts/doc-sync/detect-stale-docs.sh --staged
```

## Tuning

If detection is too noisy (too many false positives), edit `detect-stale-docs.sh`:
- Increase the minimum identifier length (currently 5 chars)
- Add common words to the skip list in `extract_identifiers`
- Adjust `DOC_EXTENSIONS` or `SKIP_DIRS`

If detection misses things, the docs probably don't reference the code by name. Two options:
- Add explicit file references to your docs (e.g., "Implemented in `src/dashboard/FilterPanel.jsx`")
- Create a `.doc-sync-manifest` mapping file (not yet implemented — would be a future addition if the grep approach proves insufficient)

## Workflow

The intended workflow:

1. The coding agent does its work normally
2. When the agent commits, the pre-commit hook automatically detects stale docs, spawns focused Claude sessions to update them, stages the updates, and lets the commit through
3. You can review the doc changes after the fact (`git log`, `git diff`)

No manual steps required. The hook handles everything at commit time.
