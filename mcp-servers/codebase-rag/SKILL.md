---
name: codebase-rag-enforcer
description: MCP server that enforces architectural constraints and prevents AI agents from breaking codebases via RAG-powered semantic search. Use when setting up RAG for code search, when agents ignore API contracts or architectural patterns, when your existing RAG is unreliable, or when you need constraint enforcement (not just code search). Triggers on "set up RAG", "agents keep breaking my architecture", "build constraint enforcement", "my RAG keeps breaking", or "prevent agents from guessing".
---

# Codebase RAG Enforcer

MCP server that forces AI agents to respect architectural constraints before making changes. Uses ChromaDB with weighted semantic search so constraints always appear first.

## What This Solves

**Problem:** Agents ignore your API map, break architectural patterns, reinvent things badly.

**Root cause:** Your RAG treats all files equally. Constraints get buried. Agents see random code first.

**Solution:** Weighted collections force constraints to appear FIRST. Auto-generated patterns from YOUR code, not templates.

## Setup

### 1. Install Dependencies

```bash
cd skills/codebase-rag-enforcer/mcp-server-python
pip install -r requirements.txt
```

### 2. Add to Claude Code Config

Add to your Claude Code MCP settings (`.claude/settings.local.json` or global settings):

```json
{
  "mcpServers": {
    "codebase-rag": {
      "command": "python",
      "args": ["<path-to>/mcp-server-python/server.py"]
    }
  }
}
```

### 3. Use It

The agent calls the MCP tools directly. No scripts to copy, no manual commands.

```
Agent: rag_setup(project_root="/path/to/your/project")
Agent: rag_index()
Agent: rag_check_constraints(change_description="add user profile endpoint")
```

## Tools

### rag_setup (call first)
Initializes a project. Auto-detects frontend/backend, scans code for patterns, generates:
- `ARCHITECTURE.yml` with detected constraints
- `docs/patterns/*.md` with documented patterns from your actual code
- `.rag/` directory with config and ChromaDB collections

### rag_index (call after setup)
Indexes the codebase into three weighted ChromaDB collections:
- **constraints** (10x weight): ARCHITECTURE.yml, CONSTRAINTS.md, CLAUDE.md
- **patterns** (8x weight): docs/patterns/*.md
- **codebase** (1x weight): all code files

Uses ChromaDB's default embedding function. No sentence-transformers or PyTorch needed.

### rag_check_constraints (primary tool for agents)
The main tool. Query before making any change. Returns:
- **Constraints** that apply to the planned change (highest weight, appear first)
- **Patterns** showing how to implement correctly
- **Code examples** from similar existing implementations

### rag_query_impact (blast radius analysis)
Shows what breaks if you change a file:
- Exports (functions, classes, endpoints, WebSocket events)
- Dependents (files that import from the target)
- Similar files (semantically related, may need coordinated changes)

### rag_health_check (diagnostics)
Runs full diagnostics: collection health, constraint files on disk, test query, index staleness.

### rag_status (quick check)
Lightweight status: initialized, indexed, chunk counts, last indexed timestamp.

## Workflow for Agents

**Before any change:**
1. `rag_check_constraints("description of planned change")`
2. Read the returned constraints and patterns
3. Follow them when implementing

**Before modifying a specific file:**
1. `rag_query_impact(file_path="path/to/file.js")`
2. Check dependents and similar files
3. Update related files if needed

## Migrating from Old Script-Based Setup

If you had the old version set up in a project:
1. Delete `rag_config.py` from the project (old generated config)
2. Delete the `.rag/` folder (old collections use different embeddings, incompatible)
3. Run `rag_setup` and `rag_index` through the MCP server to recreate everything

## Auto-Indexing

Add to your post-session hook to keep the index fresh:

```bash
#!/bin/bash
# .claude/hooks/post-session.sh
python <path-to>/mcp-server-python/server.py --index > /dev/null 2>&1 &
```

## Why This Works

1. **Weighted collections:** Constraints (10x) appear before random code (1x)
2. **Auto-generated patterns:** Documents YOUR actual code, not generic templates
3. **Metadata extraction:** Tracks imports, exports, API endpoints, WebSocket events
4. **Impact analysis:** Shows blast radius before breaking things
5. **Health checks:** Catches degradation proactively
6. **Embedded ChromaDB:** PersistentClient runs in-process, no server needed
7. **No heavy deps:** ChromaDB default embeddings, no sentence-transformers/PyTorch
8. **Windows compatible:** Forward-slash path normalization, UTF-8 encoding

## Troubleshooting

**"No project initialized"**
Run `rag_setup` first with the project root path.

**"Collection not found" / "Query returns no results"**
Run `rag_index` to build or rebuild the collections.

**"Agent ignored constraints"**
Ensure the agent called `rag_check_constraints` BEFORE making changes and that the returned constraints were included in the task context.

**"Index is stale"**
Run `rag_index` again. The health check warns if the index is older than 7 days.
