# Orchestration Integration Guide

## Add Constraint Checking to Your Workflow

### Pre-Task Protocol

Before delegating ANY task to an agent:

```
rag_search(query="task description", source_type="docs")
```

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

### Auto-Indexing

The codebase-rag MCP server runs a filesystem watcher in-process and keeps the index current automatically. No manual re-index step is required.

### Success Metrics

**After 1 week:**
- Agents query constraints before changes
- Zero architectural pattern violations
- Orchestrator catches violations before commit

**After 1 month:**
- Impact analysis prevents 5+ breaking changes
- Index stays fresh via the filesystem watcher
- Search returns relevant constraints on every query
