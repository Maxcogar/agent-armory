# Orchestration Integration Guide

## Add Constraint Checking to Your Workflow

### Pre-Task Protocol

Before delegating ANY task to an agent:

```bash
cd rag/scripts
python check_constraints.py "task description"
```

### Task Template

```
Task: [Agent]: Read these constraints before proceeding:

CONSTRAINTS:
[paste relevant constraints from check_constraints.py]

IMPACT RADIUS:
[paste from query_impact.py if modifying files]

Then: [actual work]

Verify you followed ALL constraints after completion.
```

### Auto-Indexing Hook

Add to `.claude/hooks/post-session.sh`:

```bash
#!/bin/bash
echo "📦 Updating RAG index..."
cd rag/scripts
python index_codebase.py > /dev/null 2>&1 &
echo "✅ RAG indexing started in background"
```

Or integrate with existing haiku diff script:

```bash
# After haiku updates CLAUDE.md, add:
cd rag/scripts && python index_codebase.py &
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
