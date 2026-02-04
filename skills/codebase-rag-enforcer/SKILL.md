---
name: codebase-rag-enforcer
description: Build and maintain a RAG system that enforces architectural constraints and prevents AI agents from breaking codebases. Use when setting up RAG for code search, when agents ignore API contracts or architectural patterns, when your existing RAG is unreliable, or when you need constraint enforcement (not just code search). Triggers on "set up RAG", "agents keep breaking my architecture", "build constraint enforcement", "my RAG keeps breaking", or "prevent agents from guessing".
---

# Codebase RAG Enforcer

Build a production-grade RAG system that forces AI agents to respect architectural constraints before making changes.

## One-Command Setup

```bash
# Copy scripts from this skill to rag/scripts/ in your project
# Then run:
python rag/scripts/setup_rag.py
```

The setup script will:
1. Auto-detect your project structure (frontend/backend paths)
2. Scan your existing code for actual patterns
3. Generate ARCHITECTURE.yml documenting your real constraints
4. Generate pattern docs (docs/patterns/) from your actual code
5. Create rag_config.py with correct paths
6. Ready to index

## What This Solves

**Problem:** Agents ignore your API map, break architectural patterns, reinvent things badly.

**Root cause:** Your RAG treats all files equally. Constraints get buried. Agents see random code first.

**Solution:** Weighted collections force constraints to appear FIRST. Auto-generated patterns from YOUR code, not templates.

## Setup Workflow

### 1. Copy Scripts

Copy all files from this skill's `scripts/` directory to `rag/scripts/` in your project:
- setup_rag.py (interactive setup)
- index_codebase.py (indexer with Windows/ChromaDB fixes)
- check_constraints.py (constraint checker)
- query_impact.py (impact analysis)
- health_check.py (system verification)

### 2. Run Setup

```bash
cd rag/scripts
python setup_rag.py
```

**Interactive prompts:**
```
Found frontend at frontend/ with package.json (React+Vite). Use this? [Y/n]: y
✅ Frontend: frontend

Found backend at backend/ with package.json (Node.js). Use this? [Y/n]: y
✅ Backend: backend

📊 Scanning codebase for patterns...
  Scanning backend/routes/...
    Found middleware: auth, validate, rateLimit
    Response format: success_data_error
  Scanning frontend/components/...
    Common imports: @/, ../hooks, react

📝 Generating constraint files...
  Created: ARCHITECTURE.yml
  Created: docs/patterns/api-endpoints.md

⚙️  Creating rag_config.py...
  Created: rag/scripts/rag_config.py

✅ Setup complete!
```

### 3. Install Dependencies

```bash
pip install chromadb sentence-transformers
```

### 4. Index Codebase

```bash
python rag/scripts/index_codebase.py
```

### 5. Test

```bash
python rag/scripts/check_constraints.py "add user profile endpoint"
```

You should see:
- Constraints from ARCHITECTURE.yml (your actual patterns)
- Pattern docs generated from your code
- Code examples from similar endpoints

## Orchestrator Integration

Add to your orchestration workflow:

**Before delegating any task:**

```bash
cd rag/scripts
python check_constraints.py "task description"
```

**Task template:**
```
Task: [Agent]: Read these constraints before proceeding:

CONSTRAINTS:
[paste output from check_constraints.py]

Then: [actual work]

Verify you followed ALL constraints after completion.
```

See `references/orchestration-integration.md` for complete guide.

## Auto-Indexing

Add to your post-session hook:

```bash
#!/bin/bash
# .claude/hooks/post-session.sh

echo "📦 Updating RAG index..."
cd rag/scripts
python index_codebase.py > /dev/null 2>&1 &
```

Runs in background after every session. Index stays fresh automatically.

## Scripts Reference

**setup_rag.py** - Interactive setup (run once)  
Auto-detects structure, scans patterns, generates files.

**index_codebase.py** - Index codebase into ChromaDB  
Fixed: Windows encoding, ChromaDB metadata, robust paths.  
Run after setup, then weekly or after major changes.

**check_constraints.py** - Query constraints (PRIMARY tool for agents)  
Returns relevant constraints, patterns, code examples.  
Usage: `python check_constraints.py "change description"`

**query_impact.py** - Show dependency blast radius  
Shows exports, imports, similar files.  
Usage: `python query_impact.py path/to/file.js`

**health_check.py** - Verify system health  
Run daily (automate via cron).  
Usage: `python health_check.py`

## Key Fixes from Feedback

1. **Windows Encoding:** All files read with `encoding='utf-8'`
2. **ChromaDB Metadata:** Lists converted to comma-separated strings
3. **Path Detection:** Robust auto-detection instead of assuming flat structure
4. **Pattern Generation:** Scans YOUR code, documents YOUR patterns (not templates)
5. **One-Command Setup:** `setup_rag.py` does everything interactively

## Troubleshooting

**"Collection not found"**  
Run `python index_codebase.py`

**"Query returns no results"**  
Run `python health_check.py` then `python index_codebase.py`

**"Agent ignored constraints"**  
Verify orchestrator ran `check_constraints.py` BEFORE delegation.  
Ensure Task included actual constraint text.

**"Setup failed to detect structure"**  
Manually specify paths when prompted.

## Why This Works

1. **Weighted collections:** Constraints (10x) appear before random code (1x)
2. **Auto-generated patterns:** Documents YOUR actual code, not generic templates
3. **Metadata extraction:** Tracks imports, exports, API endpoints, WebSocket events
4. **Impact analysis:** Shows blast radius before breaking things
5. **Health checks:** Catches degradation proactively
6. **Simple stack:** ChromaDB + sentence-transformers (no flaky external deps)
7. **Windows compatible:** Fixed encoding and metadata issues
