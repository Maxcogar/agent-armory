# Orchestration Integration Guide

## Add Constraint Checking to Your Workflow

### Pre-Task Protocol

Before delegating ANY task to an agent:

```
rag_check_constraints(change_description="task description")
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
[paste relevant constraints from rag_check_constraints]

IMPACT RADIUS:
[paste from rag_query_impact if modifying files]

Then: [actual work]

Verify you followed ALL constraints after completion.
```

### Auto-Indexing

The Stop hook automatically re-indexes the codebase after each session. You can also manually re-index via:

```
rag_index()
```

### Success Metrics

**After 1 week:**
- Agents query constraints before changes
- Zero architectural pattern violations
- Orchestrator catches violations before commit

**After 1 month:**
- Impact analysis prevents 5+ breaking changes
- Auto-indexing keeps system fresh
- RAG health check passes daily
