# Python MCP Server Build Specification

## Codebase RAG Enforcer - Complete Rebuild in Python

### Why Python

The TypeScript MCP server is broken because the JS `chromadb` package (`ChromaClient`) is HTTP-only -- it requires a running Chroma server. There is no embedded/persistent mode in the JS client. The original Python scripts used `chromadb.PersistentClient` which works embedded (no server process needed). We are rebuilding in Python to get `PersistentClient` back.

---

## 1. Server Identity

- **Server name**: `codebase_rag_mcp` (follows Python `{service}_mcp` convention)
- **Transport**: stdio (local tool, single-user, runs as subprocess of Claude Code)
- **Language**: Python 3.10+
- **Framework**: FastMCP from `mcp.server.fastmcp`

---

## 2. File Structure

```
mcp-server/
  server.py              # Main entry point: FastMCP init, tool registration, lifespan, run()
  config.py              # ProjectContext, ProjectConfig, PersistedConfig, defaults, read/write config.json
  setup.py               # Project detection (frontend/backend), pattern scanning, ARCHITECTURE.yml generation
  indexer.py             # File discovery, chunking, metadata extraction, ChromaDB indexing
  query.py               # check_constraints and query_impact implementations
  health.py              # health_check and status implementations
  utils/
    __init__.py
    paths.py             # normalize_path, safe_relative_path, directory_exists, file_exists, ensure_dir
    chunker.py           # chunk_content with function-boundary detection, SHA-256 IDs
    metadata.py          # extract_imports, extract_exports, extract_api_endpoints, extract_ws_events, detect_language
  requirements.txt       # Dependencies
```

---

## 3. Dependencies (requirements.txt)

```
mcp>=1.0.0
chromadb>=0.5.0
pyyaml>=6.0
pydantic>=2.0
```

**Key decisions:**
- `chromadb` provides `PersistentClient` (embedded, no server) and a built-in default embedding function (uses `onnxruntime` + `all-MiniLM-L6-v2` internally). No need for `sentence-transformers` or PyTorch.
- `pyyaml` for ARCHITECTURE.yml generation (replaces the `yaml` npm package).
- `pydantic` for input validation (FastMCP integrates with it natively).
- NO `sentence-transformers`, NO `torch`. ChromaDB's built-in embedder handles everything.

---

## 4. Server Initialization (server.py)

```python
from contextlib import asynccontextmanager
from mcp.server.fastmcp import FastMCP

@asynccontextmanager
async def app_lifespan():
    """Manage server-wide state."""
    state = {"current_project": None}
    yield state

mcp = FastMCP("codebase_rag_mcp", lifespan=app_lifespan)
```

### Server State

A single `current_project: ProjectContext | None` held in lifespan state. Tools access it via `ctx.request_context.lifespan_state["current_project"]`.

### Response Helpers

```python
import json

CHARACTER_LIMIT = 25_000

def ok_response(data: dict) -> str:
    text = json.dumps(data, indent=2, default=str)
    if len(text) > CHARACTER_LIMIT:
        text = text[:CHARACTER_LIMIT] + (
            f"\n\n... [Response truncated at {CHARACTER_LIMIT} characters. "
            "Use filters or smaller num_results to reduce output.]"
        )
    return text

def err_response(message: str) -> str:
    return f"Error: {message}"
```

All tools return `str`. Errors are returned as `"Error: ..."` strings (not raised), following MCP best practices where tool errors are in the result content, not protocol-level errors.

### Logging

Use `sys.stderr.write()` for all logging. stdio transport means stdout is reserved for MCP protocol messages.

---

## 5. Configuration (config.py)

### Types

```python
from dataclasses import dataclass, field
from typing import Optional

@dataclass
class ProjectConfig:
    include_extensions: list[str]
    exclude_dirs: list[str]
    chunk_size: int          # ~300 tokens target
    chunk_overlap: int       # ~50 tokens overlap
    default_results: int
    max_results: int
    weights: dict[str, float]

@dataclass
class ProjectContext:
    project_root: str
    frontend_path: Optional[str]
    backend_path: Optional[str]
    chroma_db_path: str
    last_indexed_at: Optional[str]
    config: ProjectConfig
```

### Defaults

```python
DEFAULT_CONFIG = ProjectConfig(
    include_extensions=[
        ".js", ".jsx", ".mjs", ".cjs",
        ".ts", ".tsx",
        ".py",
        ".go", ".rs", ".java", ".rb", ".php",
        ".yml", ".yaml", ".md", ".json",
    ],
    exclude_dirs=[
        "node_modules", ".git", "dist", "build", "__pycache__",
        ".venv", "venv", ".next", ".rag", "coverage",
        ".turbo", ".cache",
    ],
    chunk_size=300,
    chunk_overlap=50,
    default_results=5,
    max_results=20,
    weights={
        "ARCHITECTURE.yml": 10.0,
        "CONSTRAINTS.md": 10.0,
        "CLAUDE.md": 10.0,
        "docs/patterns/": 8.0,
    },
)
```

### Persistence

Config is stored at `{project_root}/.rag/config.json` as a JSON file (NOT as generated Python code). The `read_config()` and `write_config()` functions handle serialization.

```python
import json, os

def rag_dir(project_root: str) -> str:
    return os.path.join(project_root, ".rag")

def config_file_path(project_root: str) -> str:
    return os.path.join(rag_dir(project_root), "config.json")

def chroma_db_path(project_root: str) -> str:
    return os.path.join(rag_dir(project_root), "collections")

def write_config(ctx: ProjectContext) -> None:
    # Serialize to JSON, write to .rag/config.json
    ...

def read_config(project_root: str) -> dict | None:
    # Read from .rag/config.json, return None if not found
    ...

def restore_context(project_root: str) -> ProjectContext | None:
    # Rebuild ProjectContext from persisted config
    ...
```

---

## 6. Tool Definitions

### Tool 1: `rag_setup`

**Pydantic input model:**

```python
class RagSetupInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    project_root: str = Field(
        ...,
        description="Absolute path to the project root directory",
        min_length=1,
    )
    frontend_path: Optional[str] = Field(
        default=None,
        description="Override: frontend directory path (relative to project_root or absolute)",
    )
    backend_path: Optional[str] = Field(
        default=None,
        description="Override: backend directory path (relative to project_root or absolute)",
    )
    force: bool = Field(
        default=False,
        description="If true, overwrite existing generated files (default: false)",
    )
```

**Tool decorator:**

```python
@mcp.tool(
    name="rag_setup",
    annotations={
        "title": "Initialize RAG Project",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def rag_setup(params: RagSetupInput, ctx: Context) -> str:
    """Initializes a project for RAG-based constraint enforcement. This MUST be called first before using any other rag_ tools.

    Scans the project directory to auto-detect frontend and backend paths, analyzes code patterns, and generates:
      - ARCHITECTURE.yml with detected constraints and patterns
      - docs/patterns/*.md with documented code patterns from your actual codebase
      - ChromaDB collections directory at {project_root}/.rag/collections

    Auto-detection logic:
      - Frontend: looks for package.json with react/vue/angular/svelte/vite in frontend/, src/, client/ directories
      - Backend: looks for package.json with express/fastify/koa, requirements.txt, or go.mod in backend/, server/, api/ directories

    You can override auto-detection by providing explicit frontend_path and backend_path arguments.

    After setup, call rag_index to populate the search collections.

    Args:
        params (RagSetupInput): Validated input parameters containing:
            - project_root (str): Absolute path to the project root directory
            - frontend_path (Optional[str]): Override auto-detected frontend directory
            - backend_path (Optional[str]): Override auto-detected backend directory
            - force (bool): If true, overwrite existing generated files

    Returns:
        str: JSON containing:
        {
            "status": "success",
            "projectRoot": "/abs/path/to/project",
            "frontendDetected": "frontend" | null,
            "backendDetected": "backend" | null,
            "chromaDbPath": "/abs/path/.rag/collections",
            "filesGenerated": ["ARCHITECTURE.yml", "docs/patterns/api-endpoints.md"],
            "patternsDetected": { "middleware": [...], "responseFormat": "..." },
            "message": "Project initialized. Call rag_index to build search collections."
        }

    Examples:
        - Use when: "Set up RAG for my project" -> project_root="/path/to/project"
        - Use when: "Re-initialize with custom paths" -> project_root="/path", frontend_path="web", force=true
        - Don't use when: Project is already set up and you just need to re-index (use rag_index instead)

    Error Handling:
        - Returns error if project_root does not exist or is not a directory
        - Returns error if frontend_path/backend_path are provided but do not exist
    """
```

### Tool 2: `rag_index`

**Pydantic input model:**

```python
class RagIndexInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    project_root: Optional[str] = Field(
        default=None,
        description="Absolute path to project root. Uses current project context if omitted.",
    )
```

**Tool decorator:**

```python
@mcp.tool(
    name="rag_index",
    annotations={
        "title": "Index Codebase Into RAG Collections",
        "readOnlyHint": False,
        "destructiveHint": True,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def rag_index(params: RagIndexInput, ctx: Context) -> str:
    """Indexes (or re-indexes) the project codebase into ChromaDB collections for semantic search. Scans all matching files, chunks them, computes embeddings, and stores them in three collections:

      - "codebase": Code files chunked with metadata (imports, exports, endpoints)
      - "constraints": ARCHITECTURE.yml, CONSTRAINTS.md, CLAUDE.md (high weight)
      - "patterns": docs/patterns/*.md files (high weight)

    Constraint and pattern documents are given higher weight multipliers so they appear first in search results, ensuring agents see architectural rules before random code examples.

    Uses ChromaDB's built-in embedding function (no external model download needed).

    This performs a FULL re-index (drops and recreates collections). Incremental indexing is not currently supported.

    Args:
        params (RagIndexInput): Validated input parameters containing:
            - project_root (Optional[str]): Absolute path to project root. Uses current context if omitted.

    Returns:
        str: JSON containing:
        {
            "status": "success",
            "projectRoot": "/abs/path",
            "filesIndexed": 142,
            "chunksCreated": 387,
            "collectionStats": { "codebase": 372, "constraints": 3, "patterns": 12 },
            "errors": [],
            "duration": 12.4,
            "message": "Indexed 142 files (387 chunks). Use rag_check_constraints to query."
        }

    Examples:
        - Use when: "Index my codebase" -> (no args, uses current project)
        - Use when: "Index a different project" -> project_root="/other/project"
        - Don't use when: You haven't run rag_setup yet (run that first)

    Error Handling:
        - Returns error if no project context and no project_root provided
        - Returns error if project_root has no .rag/ directory (suggest running rag_setup)

    Prerequisite: rag_setup must be called first.
    """
```

### Tool 3: `rag_check_constraints`

**Pydantic input model:**

```python
class RagCheckConstraintsInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    change_description: str = Field(
        ...,
        description="Natural language description of the planned change",
        min_length=3,
        max_length=2000,
    )
    num_results: int = Field(
        default=5,
        description="Maximum results to return per collection (default: 5)",
        ge=1,
        le=20,
    )
```

**Tool decorator:**

```python
@mcp.tool(
    name="rag_check_constraints",
    annotations={
        "title": "Check Constraints for a Planned Change",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def rag_check_constraints(params: RagCheckConstraintsInput, ctx: Context) -> str:
    """The PRIMARY tool for agents. Queries the RAG system to find all architectural constraints, patterns, and code examples relevant to a planned change.

    Returns results from three collections, ordered by relevance:
      1. CONSTRAINTS: Rules from ARCHITECTURE.yml, CONSTRAINTS.md, CLAUDE.md that the change MUST follow. These have 10x weight and appear first.
      2. PATTERNS: Documented patterns from docs/patterns/ showing HOW to implement correctly. These have 8x weight.
      3. EXAMPLES: Actual code from the codebase showing existing implementations of similar functionality.

    Each result includes a relevance score (0-1, higher is better) and the source file path.

    Use this BEFORE making any change to understand what rules apply.

    Args:
        params (RagCheckConstraintsInput): Validated input parameters containing:
            - change_description (str): Natural language description of the planned change.
              Good: "Add a new POST /api/users/profile endpoint with auth middleware"
              Bad: "change something"
            - num_results (int): Max results per collection (1-20, default: 5)

    Returns:
        str: JSON containing:
        {
            "status": "success",
            "query": "add new REST API endpoint",
            "constraints": [{ "content": "...", "filePath": "ARCHITECTURE.yml", "type": "constraint", "relevance": 0.87, "keyRules": ["ALL endpoints MUST validate input"] }],
            "patterns": [{ "content": "...", "filePath": "docs/patterns/api-endpoints.md", "type": "pattern", "relevance": 0.82 }],
            "examples": [{ "content": "...", "filePath": "backend/routes/users.js", "type": "code", "relevance": 0.74 }],
            "summary": "Found 2 constraints, 1 pattern, 3 examples for this change."
        }

    Examples:
        - Use when: "What rules apply to adding a new API endpoint?" -> change_description="add new REST API endpoint"
        - Use when: "Constraints for modifying auth?" -> change_description="modify authentication middleware"
        - Don't use when: You need to analyze impact on a specific file (use rag_query_impact instead)

    Error Handling:
        - Returns error if no project context (not initialized)
        - Warns in stderr if collections are empty or queries fail

    Prerequisite: rag_setup and rag_index must be called first.
    """
```

### Tool 4: `rag_query_impact`

**Pydantic input model:**

```python
class RagQueryImpactInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    file_path: str = Field(
        ...,
        description="File path relative to project root (e.g., 'backend/routes/auth.js')",
        min_length=1,
    )
    num_similar: int = Field(
        default=5,
        description="Maximum similar files to return (default: 5)",
        ge=1,
        le=20,
    )
```

**Tool decorator:**

```python
@mcp.tool(
    name="rag_query_impact",
    annotations={
        "title": "Analyze Change Impact (Blast Radius)",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def rag_query_impact(params: RagQueryImpactInput, ctx: Context) -> str:
    """Analyzes the blast radius of changing a specific file. Shows what the file exports, what other files depend on it, and semantically similar files that might need coordinated changes.

    Returns three categories:
      1. EXPORTS: Functions, classes, constants, API endpoints, and WebSocket events exported by the file.
      2. DEPENDENTS: Other files that import from this file. These will break if exports change.
      3. SIMILAR FILES: Files with semantically similar content that might need coordinated updates.

    Uses both metadata-based import tracking AND semantic similarity to find related files.

    Args:
        params (RagQueryImpactInput): Validated input parameters containing:
            - file_path (str): File path relative to project root (e.g., "backend/routes/auth.js"). Must use forward slashes.
            - num_similar (int): Max similar files to return (1-20, default: 5)

    Returns:
        str: JSON containing:
        {
            "status": "success",
            "filePath": "backend/routes/auth.js",
            "exports": ["loginHandler", "registerHandler"],
            "apiEndpoints": ["POST /auth/login", "POST /auth/register"],
            "websocketEvents": [],
            "dependents": [{ "filePath": "backend/routes/index.js", "imports": ["./auth"] }],
            "similarFiles": [{ "filePath": "backend/routes/users.js", "similarity": 0.85 }],
            "summary": "3 exports, 2 API endpoints, 2 dependents, 3 similar files."
        }

    Examples:
        - Use when: "What breaks if I change auth.js?" -> file_path="backend/routes/auth.js"
        - Use when: "Impact of modifying the user model?" -> file_path="backend/models/user.js"
        - Don't use when: You need to check architectural rules (use rag_check_constraints instead)

    Error Handling:
        - Returns error if file not found in index (suggests running rag_index or checking path)
        - Returns error if no project context

    Prerequisite: rag_setup and rag_index must be called first.
    """
```

### Tool 5: `rag_health_check`

**No input model needed (empty schema).**

```python
@mcp.tool(
    name="rag_health_check",
    annotations={
        "title": "Check RAG System Health",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def rag_health_check(ctx: Context) -> str:
    """Runs diagnostic checks on the RAG system and reports issues.

    Checks performed:
      1. ChromaDB connection: Can we connect and read collections?
      2. Collection existence: Do all three collections (codebase, constraints, patterns) exist?
      3. Collection sizes: Are collections populated? Flags empty collections.
      4. Constraint files: Do ARCHITECTURE.yml and CONSTRAINTS.md exist on disk?
      5. Test query: Can we perform a semantic search and get results?
      6. Staleness: How old is the index? Warns if > 7 days since last index.

    Returns a structured report with issues (critical) and warnings (non-critical).

    Returns:
        str: JSON containing:
        {
            "status": "success",
            "healthy": true,
            "collections": { "codebase": { "exists": true, "chunks": 372 }, ... },
            "constraintFiles": { "ARCHITECTURE.yml": true, "CONSTRAINTS.md": false, "CLAUDE.md": true },
            "queryTest": "passed",
            "lastIndexed": "2026-02-20T14:30:00.000Z",
            "issues": [],
            "warnings": ["Missing constraint file: CONSTRAINTS.md"]
        }

    Examples:
        - Use when: "Is the RAG system working?" -> (no args)
        - Use when: "Why am I getting no results?" -> check the issues array
        - Don't use when: You just need a quick status (use rag_status instead)

    Error Handling:
        - Returns error if no project context (not initialized)

    Prerequisite: rag_setup must have been called at some point.
    """
```

### Tool 6: `rag_status`

**No input model needed (empty schema).**

```python
@mcp.tool(
    name="rag_status",
    annotations={
        "title": "Quick RAG Status Check",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def rag_status(ctx: Context) -> str:
    """Returns a quick summary of the RAG system state. Lighter than rag_health_check - does not run a test query or check constraint files on disk.

    Use this to quickly check if the system is initialized and has data before running queries. Returns in milliseconds.

    Returns:
        str: JSON containing:
        {
            "status": "success",
            "initialized": true,
            "projectRoot": "/abs/path/to/project",
            "indexed": true,
            "lastIndexed": "2026-02-20T14:30:00.000Z",
            "totalChunks": 387,
            "collectionCounts": { "codebase": 372, "constraints": 3, "patterns": 12 }
        }

    Examples:
        - Use when: "Is RAG set up?" -> check initialized field
        - Use when: "When was the last index?" -> check lastIndexed field
        - Don't use when: You need full diagnostics (use rag_health_check instead)
    """
```

---

## 7. ChromaDB Usage -- The Key Fix

### PersistentClient (Embedded, No Server)

This is the entire reason for the Python rebuild. The TS server used `ChromaClient` which is HTTP-only. Python's `PersistentClient` is embedded:

```python
import chromadb
from chromadb.config import Settings

client = chromadb.PersistentClient(
    path=chroma_db_path,
    settings=Settings(anonymized_telemetry=False),
)
```

**Critical**: The client is created fresh for each operation (NOT held in server state). PersistentClient handles its own file-level locking. This avoids stale connection issues if the server lives for hours.

### Collections

Three collections, all using cosine similarity:

```python
COLLECTION_CODEBASE = "codebase"
COLLECTION_CONSTRAINTS = "constraints"
COLLECTION_PATTERNS = "patterns"

# Create with cosine distance
collection = client.get_or_create_collection(
    name=COLLECTION_CODEBASE,
    metadata={"hnsw:space": "cosine"},
)
```

### Default Embedding Function

ChromaDB's Python client includes a default embedding function (uses `onnxruntime` + `all-MiniLM-L6-v2` under the hood). Do NOT manually instantiate `SentenceTransformer`. Just use the collection without specifying an embedding function -- ChromaDB handles it:

```python
# Adding documents -- ChromaDB auto-embeds
collection.add(
    ids=["id1", "id2"],
    documents=["text1", "text2"],
    metadatas=[{"filePath": "a.py"}, {"filePath": "b.py"}],
)

# Querying -- ChromaDB auto-embeds the query text
results = collection.query(
    query_texts=["my search query"],
    n_results=5,
)
```

### Metadata Constraints

ChromaDB metadata values must be `str`, `int`, `float`, or `bool`. No lists or nested objects. Lists (imports, exports, endpoints) are stored as comma-separated strings:

```python
metadata = {
    "filePath": "backend/routes/auth.js",    # str
    "chunkIndex": 0,                          # int
    "totalChunks": 3,                         # int
    "language": "javascript",                 # str
    "imports": "./db,../middleware/auth",      # comma-separated str
    "exports": "loginHandler,registerHandler", # comma-separated str
    "apiEndpoints": "POST /auth/login,POST /auth/register",  # comma-separated str
    "wsEvents": "",                           # comma-separated str
    "weight": 1.0,                            # float
    "type": "code",                           # str: "code" | "constraint" | "pattern"
}
```

---

## 8. Bug Fixes -- All 14 Issues from analysis/issues.md

### Bug 1: Interactive input() Calls (CRITICAL)
**Original**: `setup_rag.py` calls `input()` 4 times.
**Fix**: All interactive prompts become explicit tool parameters (`project_root`, `frontend_path`, `backend_path`) with auto-detection as the fallback default. No `input()` calls anywhere.

### Bug 2: Bare except: pass (HIGH)
**Original**: 6 instances of `except: pass` or `except: return []` across all scripts.
**Fix**: All exception handlers catch specific exceptions (`Exception`, `FileNotFoundError`, `UnicodeDecodeError`, etc.), log to stderr, and either propagate or include in the error report. No bare `except:` anywhere.

```python
# WRONG (original)
except:
    pass

# RIGHT (new)
except Exception as e:
    sys.stderr.write(f"[codebase_rag_mcp] Warning: {e}\n")
    errors.append({"file": relative_path, "error": str(e)})
```

### Bug 3: Generated Python Config + Wildcard Import (HIGH)
**Original**: `setup_rag.py` generates `rag_config.py` at runtime; all scripts do `from rag_config import *`.
**Fix**: Config is stored as `{project_root}/.rag/config.json`. No generated Python files. No wildcard imports. Config is read with `json.load()`.

### Bug 4: ChromaDB list_collections API (HIGH)
**Original**: `health_check.py` does `[c.name for c in client.list_collections()]` which fails on ChromaDB >= 0.4.x.
**Fix**: Use `client.list_collections()` which returns strings in modern ChromaDB. Or better, use try/except on `get_collection()` per collection name:

```python
for name in [COLLECTION_CODEBASE, COLLECTION_CONSTRAINTS, COLLECTION_PATTERNS]:
    try:
        col = client.get_collection(name)
        count = col.count()
        collections[name] = {"exists": True, "chunks": count}
    except Exception:
        collections[name] = {"exists": False, "chunks": 0}
```

### Bug 5: _find_importers Loads Entire Collection (HIGH)
**Original**: `query_impact.py` calls `collection.get()` with no filter, loading ALL documents and embeddings.
**Fix**: Use ChromaDB's `where_document` to search for the filename within document text, and only request metadatas:

```python
# Find files that import the target using whereDocument
file_stem = Path(file_path).stem
importers = collection.get(
    where_document={"$contains": file_stem},
    include=["metadatas"],  # Don't load documents or embeddings
)
```

Then filter in Python by checking the `imports` metadata field contains the filename. This avoids loading all documents into memory.

### Bug 6: Missing Error Handling and Recovery (MEDIUM)
**Original**: No connection checks, no collection existence checks, `sys.exit()` in library code.
**Fix**:
- Never call `sys.exit()`. All errors are returned as structured error responses.
- Check collection existence before querying (wrapped in try/except).
- Track `lastIndexedAt` in config.json for staleness detection.
- Return actionable error messages: "Collection 'codebase' does not exist. Run rag_index first."

### Bug 7: Windows Path Issues (MEDIUM)
**Original**: `str(file_path.relative_to(PROJECT_ROOT))` produces backslash paths on Windows. Path matching fails.
**Fix**: Always normalize paths to forward slashes in metadata:

```python
def normalize_path(p: str) -> str:
    return p.replace("\\", "/")

def safe_relative_path(root: str, target: str) -> str:
    return normalize_path(os.path.relpath(target, root))
```

All paths stored in ChromaDB metadata use forward slashes. All path comparisons use normalized paths.

### Bug 8: Path Handling Fragility (MEDIUM)
**Original**: `Path.cwd()` assumption, `Path(__file__).parent.parent` navigation, no validation.
**Fix**:
- `project_root` is always an explicit parameter (never derived from cwd).
- Config is stored as JSON at a known location (`{project_root}/.rag/config.json`), not relative to Python file location.
- All paths are resolved with `os.path.resolve()` before use.
- `relative_to()` calls are wrapped in try/except with fallback.

### Bug 9: Heavy sentence-transformers Dependency (MEDIUM)
**Original**: Every script loads `SentenceTransformer(EMBEDDING_MODEL)` -- 500+ MB install, 2-5s load time.
**Fix**: Use ChromaDB's built-in default embedding function. No `sentence-transformers`, no `torch`. Just `chromadb` which includes `onnxruntime` internally. When calling `collection.add(documents=...)` or `collection.query(query_texts=...)`, ChromaDB handles embedding automatically.

### Bug 10: Chunking Strategy (500 Lines Per Chunk) (LOW)
**Original**: `CHUNK_SIZE = 500` lines, no function boundary detection.
**Fix**: Port the TS chunker's boundary detection logic:
- Target ~30 lines per chunk (~300 tokens).
- Detect function/class boundaries using regex patterns.
- Respect boundaries where possible; fall back to line-based with 5-line overlap.
- Prepend `"# File: {path} (chunk {i}/{n})\n"` header to each chunk.
- Use SHA-256 (not MD5) for chunk IDs: `hashlib.sha256(f"{path}::chunk::{index}".encode()).hexdigest()[:32]`.

### Bug 11: Argument Parsing Bug in check_constraints.py (LOW)
**Original**: `planned_change = " ".join(sys.argv[1:])` includes the numeric arg in the query string.
**Fix**: Not applicable -- the MCP server uses Pydantic models for input, not CLI argument parsing. Each parameter is a separate field.

### Bug 12: No Concurrency Safety (LOW)
**Original**: Delete-then-create collections is not atomic.
**Fix**: ChromaDB's `PersistentClient` provides file-level locking. The server runs as a single-process stdio tool, so concurrent access is unlikely. The full re-index (drop + recreate) pattern is maintained but logged clearly.

### Bug 13: MD5 for Chunk IDs (LOW)
**Original**: `hashlib.md5(data.encode()).hexdigest()`.
**Fix**: Use SHA-256 truncated to 32 hex chars:

```python
import hashlib

def chunk_id(file_path: str, index: int) -> str:
    data = f"{file_path}::chunk::{index}"
    return hashlib.sha256(data.encode()).hexdigest()[:32]
```

### Bug 14: Weight Substring Matching Returns First Match (LOW)
**Original**: Iterates weight patterns in insertion order, returns first match.
**Fix**: Sort patterns by length descending (longest/most specific first) before matching:

```python
def compute_weight(relative_path: str, weights: dict[str, float]) -> float:
    sorted_patterns = sorted(weights.items(), key=lambda x: len(x[0]), reverse=True)
    for pattern, weight in sorted_patterns:
        if pattern in relative_path:
            return weight
    return 1.0
```

---

## 9. What to Port from the TypeScript MCP Server

### Port Directly (Translate to Python)

1. **Tool descriptions** (from `index.ts`): All 6 tool descriptions are excellent and comprehensive. Port them verbatim into Python docstrings.

2. **Input schemas** (from `schemas.ts`): Translate Zod schemas to Pydantic models with the same constraints (min_length, max_length, ge, le, defaults).

3. **Type definitions** (from `types.ts`): Translate interfaces to Python dataclasses or TypedDicts:
   - `ProjectContext`, `ProjectConfig`, `PersistedConfig`
   - `IndexStats`, `HealthReport`, `CollectionHealth`
   - `ConstraintResult`, `PatternResult`, `ExampleResult`
   - `CheckConstraintsResult`, `QueryImpactResult`
   - `ChunkMetadata` (the metadata shape stored in ChromaDB)

4. **Response helpers** (from `index.ts`): `ok_response()`, `err_response()`, character limit truncation.

5. **Setup logic** (from `setup.ts`):
   - Frontend/backend auto-detection: `detect_frontend()`, `detect_backend()`
   - Pattern scanning: `scan_backend_patterns()`, `scan_frontend_patterns()`
   - ARCHITECTURE.yml generation (use `pyyaml`)
   - Pattern doc generation: `generate_api_endpoint_pattern()`, `generate_component_pattern()`

6. **Metadata extraction** (from `utils/metadata.ts`):
   - `extract_imports()` with JS and Python patterns
   - `extract_exports()` with JS and Python patterns
   - `extract_api_endpoints()` (Express, Flask, FastAPI)
   - `extract_ws_events()` (Socket.IO patterns)
   - `detect_language()` (extension-based lookup)

7. **Chunking** (from `utils/chunker.ts`):
   - `chunk_content()` with function-boundary detection
   - `detect_boundaries()` regex patterns
   - SHA-256 chunk ID generation
   - File path header prepending

8. **Path utilities** (from `utils/paths.ts`):
   - `normalize_path()` (forward slashes)
   - `safe_relative_path()`
   - `directory_exists()`, `file_exists()`, `ensure_dir()`

9. **Config persistence** (from `config.ts`):
   - `read_config()`, `write_config()`, `restore_context()`
   - `.rag/config.json` format

10. **Query logic** (from `query.ts`):
    - `check_constraints()`: Query all 3 collections, format results with relevance scores
    - `query_impact()`: Get file metadata, find dependents via `where_document`, find similar files
    - `extract_key_rules()`: Regex-based rule extraction (MUST, NEVER, ALWAYS patterns)
    - `chroma_distance_to_relevance()`: `max(0, 1 - distance / 2)`

11. **Health check logic** (from `health.ts`):
    - `health_check()`: Collection checks, constraint file checks, test query, staleness
    - `get_status()`: Lightweight status (collection counts, initialized state)

### Do NOT Port

1. **`ChromaClient` usage**: The TS server uses `new ChromaClient({ path: undefined })` which is HTTP-only. Replace ALL of this with `chromadb.PersistentClient(path=...)`.

2. **`DefaultEmbeddingFunction` instantiation**: The TS server explicitly creates `new DefaultEmbeddingFunction()`. In Python, just don't pass an embedding function -- ChromaDB's Python client defaults to its built-in embedder automatically.

3. **`glob` npm package usage**: Replace with Python's `pathlib.Path.rglob()` or `glob.glob()`.

4. **TypeScript-specific patterns**: `as const`, generics, `process.stderr.write` (replace with `sys.stderr.write`).

---

## 10. Key Implementation Details

### Indexing Flow (indexer.py)

```
1. Create PersistentClient at ctx.chroma_db_path
2. Delete and recreate all 3 collections
3. Discover code files (glob with include_extensions, exclude exclude_dirs)
4. For each code file:
   a. Read content (UTF-8, skip on decode error)
   b. Extract metadata (imports, exports, endpoints, ws events, language)
   c. Compute weight from config weights
   d. Chunk content (boundary-aware, ~30 lines/chunk)
   e. Add chunks to "codebase" collection (ids, documents, metadatas)
5. Find constraint files (ARCHITECTURE.yml, CONSTRAINTS.md, CLAUDE.md)
6. For each constraint file:
   a. Read, chunk, add to "constraints" collection with type="constraint"
7. Find pattern files (docs/patterns/*.md)
8. For each pattern file:
   a. Read, chunk, add to "patterns" collection with type="pattern"
9. Update lastIndexedAt in config.json
10. Return stats
```

### Query Flow (query.py -- check_constraints)

```
1. Create PersistentClient
2. For each collection (constraints, patterns, codebase):
   a. Get collection
   b. Query with query_texts=[change_description], n_results=num_results
   c. Format results: extract content, filePath, relevance, keyRules
3. Return combined results with summary
```

### Query Flow (query.py -- query_impact)

```
1. Create PersistentClient
2. Get "codebase" collection
3. Get file's own chunks: collection.get(where={"filePath": file_path})
4. Aggregate metadata across chunks: exports, apiEndpoints, wsEvents
5. Find dependents:
   a. collection.get(where_document={"$contains": file_stem}, include=["metadatas"])
   b. Filter by checking imports metadata contains the file name
6. Find similar files:
   a. Get file's first chunk text
   b. collection.query(query_texts=[chunk_text], n_results=num_similar + 5)
   c. Deduplicate, exclude self, limit to num_similar
7. Return combined results
```

### Relevance Score Computation

```python
def chroma_distance_to_relevance(distance: float) -> float:
    """Convert ChromaDB cosine distance to 0-1 relevance score."""
    return max(0.0, 1.0 - distance / 2.0)
```

### Key Rule Extraction

```python
import re

def extract_key_rules(content: str) -> list[str]:
    """Extract MUST/NEVER/ALWAYS rules from constraint text."""
    rules = []
    patterns = [
        r"(?:MUST|NEVER|ALWAYS|SHALL NOT|REQUIRED)[^.;\n]*",
        r"(?:All\s+\w+\s+must)[^.;\n]*",
        r"(?:No\s+\w+\s+(?:in|should|may))[^.;\n]*",
    ]
    for pattern in patterns:
        for match in re.finditer(pattern, content, re.IGNORECASE):
            rule = match.group(0).strip()
            if len(rule) > 10 and rule not in rules:
                rules.append(rule)
    return rules[:10]
```

---

## 11. Running and Testing

### Running the Server

```bash
# Install dependencies
pip install -r requirements.txt

# Verify syntax
python -m py_compile server.py

# Run via stdio (for Claude Code integration)
python server.py
```

### Claude Code Configuration

Add to `~/.claude/claude_desktop_config.json` or `.claude/settings.json`:

```json
{
  "mcpServers": {
    "codebase-rag": {
      "command": "python",
      "args": ["C:/path/to/mcp-server/server.py"],
      "env": {}
    }
  }
}
```

### Testing with MCP Inspector

```bash
npx @modelcontextprotocol/inspector python server.py
```

### Manual Test Sequence

1. Call `rag_setup` with a test project directory
2. Verify `.rag/config.json` and `ARCHITECTURE.yml` were created
3. Call `rag_index` (no args, uses current context)
4. Verify collections are populated via `rag_status`
5. Call `rag_check_constraints` with a change description
6. Verify results include constraints, patterns, and examples
7. Call `rag_query_impact` with a file path from the indexed project
8. Run `rag_health_check` and verify all checks pass

---

## 12. Summary of Architecture Changes from Original Scripts

| Aspect | Original Python Scripts | New Python MCP Server |
|--------|------------------------|----------------------|
| Interface | CLI scripts with `sys.argv` | MCP tools via FastMCP |
| Config | Generated `rag_config.py` + `from X import *` | `.rag/config.json` (JSON) |
| Embeddings | `sentence-transformers` (500MB) | ChromaDB built-in (lightweight) |
| ChromaDB | `PersistentClient` (correct) | `PersistentClient` (same) |
| Chunking | 500 lines, no boundaries | ~30 lines, function-boundary-aware |
| Chunk IDs | MD5 | SHA-256 |
| Paths | OS-native (backslash on Windows) | Always forward slashes |
| Error handling | `except: pass`, `sys.exit(1)` | Specific exceptions, structured errors |
| Input | `input()` prompts | Explicit tool parameters |
| State | Working directory + global imports | Lifespan state + config.json |
| Weight matching | First match wins | Longest (most specific) match wins |
| Import search | `collection.get()` (loads all) | `where_document` + metadata filter |
| API compat | Broken `list_collections` | `get_collection` with try/except |
