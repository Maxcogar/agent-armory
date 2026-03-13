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

The codebase-rag MCP server is configured by this plugin's `.mcp.json`. Ensure you have the server installed and dependencies available:

```bash
pip install httpx mcp[cli] pydantic chromadb
```

## Tools

### rag_setup (call first)
Initializes a project. Auto-detects frontend/backend, scans code for patterns, generates:
- `ARCHITECTURE.yml` with detected constraints
- `docs/patterns/*.md` with documented patterns from your actual code
- `.rag/` directory with config and ChromaDB collections

### rag_index (call after setup)
Indexes the codebase into three weighted ChromaDB collections:
- **constraints** (10x weight): ARCHITECTURE.yml, CONSTRAINTS.md, CLAUDE.md + custom constraint sources
- **patterns** (8x weight): docs/patterns/*.md + custom doc sources
- **codebase** (1x weight): all code files

Uses ChromaDB's default embedding function. No sentence-transformers or PyTorch needed.

### rag_check_constraints (primary tool for agents)
The main tool. Query before making any change. Returns:
- **Constraints** that apply to the planned change (highest weight, appear first)
- **Patterns** showing how to implement correctly
- **Code examples** from similar existing implementations

Supports a `source_type` filter to control which collections are searched:
- `"all"` (default): Search everything
- `"docs"`: Search only documentation (constraints + patterns). Best for planning and understanding architecture.
- `"code"`: Search only source code. Best when you need actual implementations.
- `"constraints"`: Search only constraint files. Best for focused rules checks.

### rag_query_impact (blast radius analysis)
Shows what breaks if you change a file:
- Exports (functions, classes, endpoints, WebSocket events)
- Dependents (files that import from the target)
- Similar files (semantically related, may need coordinated changes)

### rag_health_check (diagnostics)
Runs full diagnostics: collection health, constraint files on disk, test query, index staleness.

### rag_status (quick check)
Lightweight status: initialized, indexed, chunk counts, last indexed timestamp.

## Custom Document Sources

By default, the tool indexes 3 hardcoded constraint files and `docs/patterns/`. You can add your own document sources (ADRs, OpenAPI specs, style guides, RFCs, etc.) by editing `.rag/config.json`:

```json
{
  "customSources": [
    {
      "pattern": "docs/adr/*.md",
      "sourceType": "docs",
      "weight": 9.0
    },
    {
      "pattern": "openapi.yaml",
      "sourceType": "constraints",
      "weight": 10.0
    }
  ]
}
```

**Fields:**
- `pattern`: Glob pattern relative to project root
- `sourceType`: One of `"constraints"`, `"docs"`, or `"code"`
- `weight`: Retrieval weight (higher = appears earlier in results)

After editing, run `rag_index` to re-index with the new sources.

## Workflow for Agents

**Before any change:**
1. `rag_check_constraints("description of planned change")`
2. Read the returned constraints and patterns
3. Follow them when implementing

**Docs-first workflow (recommended):**
1. `rag_check_constraints("description of planned change", source_type="docs")` — read architecture docs and patterns first
2. `rag_check_constraints("description of planned change", source_type="code")` — then look at actual code when ready to implement
3. Follow constraints when implementing

**Before modifying a specific file:**
1. `rag_query_impact(file_path="path/to/file.js")`
2. Check dependents and similar files
3. Update related files if needed
