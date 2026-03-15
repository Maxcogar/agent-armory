# Codebase Sweep — Design Document

**Date:** 2026-03-15
**Status:** Approved

## Summary

A new workflow for systematically discovering and fixing quality issues in existing codebases — particularly vibe-coded apps where problems are varied, interconnected, and inconsistently distributed. Built on top of the existing workspace board and orchestration pipeline.

## Problem

Vibe-coded apps share consistent problem patterns: no separation of concerns, copy-pasted logic, missing error handling, inconsistent naming, dead code, scattered state management, no tests. These issues are interconnected — you can't add tests until code is structured enough to be testable, you can't standardize error handling until business logic is separated from UI.

The current AgentBoard workflow handles building new features well but doesn't address the "take this working-but-messy app and make it good" use case.

## Design

### Workflow

```
/sweep  →  findings doc  →  triage  →  board cards  →  /orchestrate  →  clean codebase
```

One new command (`/sweep`), one new skill (`codebase-sweep`). Everything else reuses existing infrastructure: workspace boards, `/orchestrate`, `/board-status`.

### The /sweep Command

Five steps executed in sequence:

**Step 1: Setup**
Load tools (agentboard, codegraph, codebase-rag), verify server health, select or create app and board, identify target codebase path.

**Step 2: Reconnaissance**
Build a structural map before reading code:
- `codegraph_scan` → `codegraph_get_stats` for size, most-connected files, entry points
- `rag_setup` + `rag_index` if not already indexed
- Scan config files (package.json, etc.) for stack and dependencies

This produces a reading order: start with entry points and most-connected files, work outward by importance.

**Step 3: Broad Sweep**
Read the codebase following the reading order. For each file or logical group, note issues in a findings document at `docs/sweep/YYYY-MM-DD-findings.md`.

Each finding is a short raw entry:
```markdown
### [file path]
- **[severity]** — [what's wrong, 1-2 sentences]
```

The agent does NOT create cards, categorize findings, fix anything, or recommend fixes. Pure discovery with single focus: what's wrong and how bad is it.

**Step 4: Triage**
After the sweep, the agent reads its own findings and:
1. Groups related findings (e.g., "missing error handling" across 5 route files → one group)
2. Lets categories emerge naturally from what was found
3. Sets priority based on severity and dependency ordering
4. Identifies dependencies between groups (what must be fixed before what)
5. Creates workspace cards — one per group, with description, priority, and `depends_on`

**Step 5: Summary**
Shows the user what was found: file count, finding count, cards created, emerged categories, priority distribution, and recommended order of attack.

### The codebase-sweep Skill

Teaches the agent how to read code critically. Three sections:

**What to look for** — types of signals, not categories:
- Code doing the same thing in different ways
- Error paths that silently swallow failures
- Files that import everything or are imported by everything
- Functions that do multiple things
- Comments that contradict the code
- State modified from multiple uncoordinated places
- Patterns that start strong and fall apart in other files

**How to calibrate severity:**
- Critical: data loss, security issues, crashes in normal use
- High: breaks functionality in edge cases, or blocks other improvements
- Medium: makes codebase harder to work with but doesn't break things
- Low: style, naming, minor duplication

**How to write good findings:**
- State what's wrong, not what to do about it
- Reference specific files and functions
- Note when the same issue appears across multiple files

### Key Design Decisions

1. **No predefined categories.** Categories emerge from the codebase. A voice dashboard will produce different clusters than a Genkit migration app. Predefined passes waste time on empty categories and miss app-specific patterns.

2. **Broad sweep, not focused passes.** Inattentional blindness is real — telling an agent "look for error handling issues" makes it read past duplicated functions. The agent's only instruction is "what's wrong here?" so everything is fair game.

3. **Findings first, cards second.** Writing raw findings is cheap (no tool calls, no card formatting). Creating cards during discovery causes context switching, overlapping cards, and consolidation overhead. The triage step produces clean, well-scoped cards.

4. **Reuses existing orchestration.** After `/sweep` creates cards, `/orchestrate` runs them through planning → review → implementation → audit. No new fix/verify workflow needed.

5. **Discovery doesn't have to be perfect.** The audit wave in `/orchestrate` catches adjacent issues when fixing a card. The sweep finds the major problems; the fix cycle catches stragglers.

## Components

| Component | Type | Status |
|-----------|------|--------|
| `codebase-sweep` skill | Skill (SKILL.md) | New |
| `/sweep` command | Command (.md) | New |
| Workspace boards | Infrastructure | Existing |
| `/orchestrate` command | Command (.md) | Existing |
| `/board-status` command | Command (.md) | Existing |

## File Locations (in plugin)

```
agentboard/
├── skills/
│   └── codebase-sweep/
│       └── SKILL.md
└── commands/
    └── sweep.md
```
