# Orchestration Integration Guide

## Add Constraint Checking to Your Workflow

### Pre-Task Protocol

Before delegating ANY task to an agent:

```
rag_search(query="task description", source_type="constraints")
```

For broader context (constraints + patterns), use `source_type="docs"`. For full-codebase semantic search, use the default `"all"`.

### Impact Analysis

If modifying specific files, check blast radius:

```
rag_query_impact(file_path="path/to/file.ts")
```

### Task Template

```
Task: [Agent]: Read these constraints before proceeding:

CONSTRAINTS:
[paste relevant constraints from rag_search]

IMPACT RADIUS:
[paste from rag_query_impact if modifying files]

Then: [actual work]

Verify you followed ALL constraints after completion.
```

### Indexing

The MCP server auto-detects the project root, builds the index in a per-machine cache on first run, and runs a filesystem watcher to keep the index current as files change. The Stop hook also re-indexes after each session as a safety net for any final edits made after the watcher tears down. There is no manual index command — just call `rag_search` or `rag_query_impact` directly.

### Success Metrics

**After 1 week:**
- Agents query constraints before changes
- Zero architectural pattern violations
- Orchestrator catches violations before commit

**After 1 month:**
- Impact analysis prevents 5+ breaking changes
- Auto-indexing keeps the system fresh
