# Codebase RAG Enforcer - MCP Server Design Spec

Server name: `rag-enforcer-mcp-server`
Transport: stdio
Language: TypeScript
Pattern reference: `codegraph-mcp` server

---

## Architecture Overview

### Server State

```typescript
// Mirrors codegraph's `currentGraph` pattern
let currentProject: ProjectContext | null = null;

interface ProjectContext {
  projectRoot: string;
  frontendPath: string | null;
  backendPath: string | null;
  chromaDbPath: string;       // defaults to {projectRoot}/.rag/collections
  lastIndexedAt: string | null;
  config: ProjectConfig;
}

interface ProjectConfig {
  includeExtensions: string[];
  excludeDirs: string[];
  chunkSize: number;         // tokens, not lines
  chunkOverlap: number;
  defaultResults: number;
  maxResults: number;
  weights: Record<string, number>;
}
```

### Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "chromadb": "^1.9.0",
    "glob": "^13.0.5",
    "yaml": "^2.4.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.3.0"
  }
}
```

ChromaDB's JS client includes a default embedding function (Transformers.js with `Xenova/all-MiniLM-L6-v2`), eliminating the need for a separate sentence-transformers dependency.

### Response Helpers

Same pattern as codegraph-mcp:

```typescript
function okResponse(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function errResponse(message: string) {
  return {
    isError: true as const,
    content: [{ type: "text" as const, text: message }],
  };
}

function noProjectError() {
  return errResponse(
    "No project initialized. Call rag_setup first with the project root directory."
  );
}
```

---

## Tool Definitions

### 1. `rag_setup`

**Title:** Initialize RAG Project

**Description:**
```
Initializes a project for RAG-based constraint enforcement. This MUST be called
first before using any other rag_ tools.

Scans the project directory to auto-detect frontend and backend paths, analyzes
code patterns, and generates:
  - ARCHITECTURE.yml with detected constraints and patterns
  - docs/patterns/*.md with documented code patterns from your actual codebase
  - ChromaDB collections directory at {project_root}/.rag/collections

Auto-detection logic:
  - Frontend: looks for package.json with react/vue/angular/svelte/vite in
    frontend/, src/, client/ directories
  - Backend: looks for package.json, requirements.txt, or go.mod in
    backend/, server/, api/ directories

You can override auto-detection by providing explicit frontend_path and
backend_path arguments.

After setup, call rag_index to populate the search collections.

Args:
  - project_root (string, required): Absolute path to the project root directory
  - frontend_path (string, optional): Override auto-detected frontend directory
    (relative to project_root or absolute)
  - backend_path (string, optional): Override auto-detected backend directory
    (relative to project_root or absolute)
  - force (boolean, optional): If true, overwrite existing ARCHITECTURE.yml and
    pattern docs. Default: false.

Returns:
  - status: "success" or "error"
  - projectRoot: Resolved absolute path
  - frontendDetected: Path or null if not found
  - backendDetected: Path or null if not found
  - filesGenerated: List of files created/updated
  - patternsDetected: Summary of detected middleware, response formats, imports

Example use cases:
  - "Set up RAG for my project" -> project_root="/path/to/project"
  - "Re-initialize with custom paths" -> project_root="/path", frontend_path="web", backend_path="api", force=true
```

**Input Schema (Zod):**
```typescript
{
  project_root: z.string().describe(
    "Absolute path to the project root directory"
  ),
  frontend_path: z.string().optional().describe(
    "Override: frontend directory path (relative to project_root or absolute)"
  ),
  backend_path: z.string().optional().describe(
    "Override: backend directory path (relative to project_root or absolute)"
  ),
  force: z.boolean().default(false).describe(
    "If true, overwrite existing generated files (default: false)"
  ),
}
```

**Output Format:**
```json
{
  "status": "success",
  "projectRoot": "/abs/path/to/project",
  "frontendDetected": "frontend",
  "backendDetected": "backend",
  "chromaDbPath": "/abs/path/to/project/.rag/collections",
  "filesGenerated": [
    "ARCHITECTURE.yml",
    "docs/patterns/api-endpoints.md"
  ],
  "patternsDetected": {
    "middleware": ["auth", "validate", "rateLimit"],
    "responseFormat": "success_data_error",
    "frontendImports": ["@/", "../hooks"]
  },
  "message": "Project initialized. Call rag_index to build search collections."
}
```

**Error Cases:**
- `project_root` does not exist or is not a directory
- `frontend_path`/`backend_path` provided but do not exist
- ARCHITECTURE.yml already exists and `force` is false (returns warning, not error, listing existing files)
- File system permission errors writing generated files

**Annotations:**
```typescript
{
  readOnlyHint: false,    // Creates files on disk
  destructiveHint: false, // Does not delete; force=true overwrites
  idempotentHint: true,   // Same inputs produce same outputs
  openWorldHint: false,
}
```

---

### 2. `rag_index`

**Title:** Index Codebase Into RAG Collections

**Description:**
```
Indexes (or re-indexes) the project codebase into ChromaDB collections for
semantic search. Scans all matching files, chunks them, computes embeddings,
and stores them in three collections:

  - "codebase": Code files chunked with metadata (imports, exports, endpoints)
  - "constraints": ARCHITECTURE.yml, CONSTRAINTS.md, CLAUDE.md (high weight)
  - "patterns": docs/patterns/*.md files (high weight)

Constraint and pattern documents are given higher weight multipliers so they
appear first in search results, ensuring agents see architectural rules before
random code examples.

Uses ChromaDB's built-in embedding function (no external model download needed).

This performs a FULL re-index (drops and recreates collections). Incremental
indexing is not currently supported.

Args:
  - project_root (string, optional): Absolute path to project root. If omitted,
    uses the project from the most recent rag_setup call.

Returns:
  - filesIndexed: Number of files processed
  - chunksCreated: Total chunks across all collections
  - errors: Array of files that failed with error messages
  - collectionStats: Chunk count per collection
  - duration: Time taken in seconds

Example use cases:
  - "Index my codebase" -> (no args, uses current project)
  - "Re-index after major refactor" -> (no args)
  - "Index a different project" -> project_root="/other/project"

Prerequisite: rag_setup must be called first (or project_root must have been
set up previously with .rag/ directory present).
```

**Input Schema (Zod):**
```typescript
{
  project_root: z.string().optional().describe(
    "Absolute path to project root. Uses current project context if omitted."
  ),
}
```

**Output Format:**
```json
{
  "status": "success",
  "projectRoot": "/abs/path/to/project",
  "filesIndexed": 142,
  "chunksCreated": 387,
  "collectionStats": {
    "codebase": 372,
    "constraints": 3,
    "patterns": 12
  },
  "errors": [
    { "file": "src/legacy/old.js", "error": "UnicodeDecodeError" }
  ],
  "duration": 12.4,
  "message": "Indexed 142 files (387 chunks). 1 error. Use rag_check_constraints to query."
}
```

**Error Cases:**
- No project context and no `project_root` provided
- `project_root` has no `.rag/` directory (not initialized - suggest running `rag_setup`)
- ChromaDB connection/persistence failure
- All files failed to index (0 chunks created)
- High error rate (> 10% of files failed)

**Annotations:**
```typescript
{
  readOnlyHint: false,    // Writes to ChromaDB collections on disk
  destructiveHint: true,  // Drops and recreates all collections
  idempotentHint: true,   // Same codebase produces same index
  openWorldHint: false,
}
```

---

### 3. `rag_check_constraints`

**Title:** Check Constraints for a Planned Change

**Description:**
```
The PRIMARY tool for agents. Queries the RAG system to find all architectural
constraints, patterns, and code examples relevant to a planned change.

Returns results from three collections, ordered by relevance:
  1. CONSTRAINTS: Rules from ARCHITECTURE.yml, CONSTRAINTS.md, CLAUDE.md that
     the change MUST follow. These have 10x weight and appear first.
  2. PATTERNS: Documented patterns from docs/patterns/ showing HOW to implement
     correctly. These have 8x weight.
  3. EXAMPLES: Actual code from the codebase showing existing implementations
     of similar functionality.

Each result includes a relevance score (0-1, higher is better) and the source
file path.

Use this BEFORE making any change to understand what rules apply. Include the
results in task instructions to agents.

Args:
  - change_description (string, required): Natural language description of the
    planned change. Be specific for better results.
    Good: "Add a new POST /api/users/profile endpoint with auth middleware"
    Bad: "change something"
  - num_results (number, optional): Max results per collection (1-20, default: 5)

Returns:
  - constraints: Array of matching constraint documents with relevance scores
  - patterns: Array of matching pattern documents with relevance scores
  - examples: Array of matching code chunks with relevance scores and file paths

Example use cases:
  - "What rules apply to adding a new API endpoint?" ->
    change_description="add new REST API endpoint for user profiles"
  - "Constraints for modifying auth?" ->
    change_description="modify authentication middleware to add JWT refresh"
  - "How should I structure a new React component?" ->
    change_description="create new React component for user dashboard"

Prerequisite: rag_setup and rag_index must be called first.
```

**Input Schema (Zod):**
```typescript
{
  change_description: z.string().min(3).describe(
    "Natural language description of the planned change"
  ),
  num_results: z.number().int().min(1).max(20).default(5).describe(
    "Maximum results to return per collection (default: 5)"
  ),
}
```

**Output Format:**
```json
{
  "status": "success",
  "query": "add new REST API endpoint for user profiles",
  "constraints": [
    {
      "content": "ALL endpoints MUST validate input\nALL responses MUST use consistent format...",
      "filePath": "ARCHITECTURE.yml",
      "type": "constraint",
      "relevance": 0.87,
      "keyRules": [
        "ALL endpoints MUST validate input",
        "ALL responses MUST use consistent format",
        "ALL errors MUST be logged"
      ]
    }
  ],
  "patterns": [
    {
      "content": "# API Endpoint Pattern\n\n## Standard Pattern...",
      "filePath": "docs/patterns/api-endpoints.md",
      "type": "pattern",
      "relevance": 0.82
    }
  ],
  "examples": [
    {
      "content": "router.post('/users',\n  auth,\n  validate(userSchema),\n  async (req, res) => {...",
      "filePath": "backend/routes/users.js",
      "lines": "15-45",
      "type": "code",
      "relevance": 0.74
    }
  ],
  "summary": "Found 2 constraints, 1 pattern, 3 examples for this change."
}
```

**Error Cases:**
- No project context (not initialized)
- Collections are empty (suggest running `rag_index`)
- ChromaDB query failure
- `change_description` too short to be meaningful (< 3 chars)

**Annotations:**
```typescript
{
  readOnlyHint: true,     // Only queries, no writes
  destructiveHint: false,
  idempotentHint: true,   // Same query returns same results (until re-index)
  openWorldHint: false,
}
```

---

### 4. `rag_query_impact`

**Title:** Analyze Change Impact (Blast Radius)

**Description:**
```
Analyzes the blast radius of changing a specific file. Shows what the file
exports, what other files depend on it, and semantically similar files that
might need coordinated changes.

Returns three categories:
  1. EXPORTS: Functions, classes, constants, API endpoints, and WebSocket events
     exported by the file (extracted from metadata at index time).
  2. DEPENDENTS: Other files that import from this file. These will break if
     exports change.
  3. SIMILAR FILES: Files with semantically similar content that might need
     coordinated updates (e.g., similar route handlers, parallel components).

Unlike codegraph_get_change_impact which uses static import analysis, this tool
uses both metadata-based import tracking AND semantic similarity to find related
files that might not have direct import relationships.

Args:
  - file_path (string, required): Path of the file to analyze, relative to
    project root (e.g., "backend/routes/auth.js"). Must match the path format
    used during indexing.
  - num_similar (number, optional): Max similar files to return (1-20, default: 5)

Returns:
  - exports: Functions/classes/constants exported by the file
  - apiEndpoints: API endpoints defined in the file (if any)
  - websocketEvents: WebSocket events emitted by the file (if any)
  - dependents: Files that import from this file
  - similarFiles: Semantically similar files with similarity scores

Example use cases:
  - "What breaks if I change auth.js?" -> file_path="backend/routes/auth.js"
  - "Impact of modifying the user model?" -> file_path="backend/models/user.js"
  - "What's related to this component?" -> file_path="frontend/components/Dashboard.jsx"

Prerequisite: rag_setup and rag_index must be called first.
```

**Input Schema (Zod):**
```typescript
{
  file_path: z.string().describe(
    "File path relative to project root (e.g., 'backend/routes/auth.js')"
  ),
  num_similar: z.number().int().min(1).max(20).default(5).describe(
    "Maximum similar files to return (default: 5)"
  ),
}
```

**Output Format:**
```json
{
  "status": "success",
  "filePath": "backend/routes/auth.js",
  "exports": ["loginHandler", "registerHandler", "validateToken"],
  "apiEndpoints": ["POST /auth/login", "POST /auth/register", "GET /auth/verify"],
  "websocketEvents": [],
  "dependents": [
    {
      "filePath": "backend/routes/index.js",
      "imports": ["./auth"]
    },
    {
      "filePath": "backend/middleware/requireAuth.js",
      "imports": ["../routes/auth"]
    }
  ],
  "similarFiles": [
    {
      "filePath": "backend/routes/users.js",
      "similarity": 0.85,
      "reason": "Similar route handler structure"
    }
  ],
  "summary": "3 exports, 2 API endpoints, 2 dependents, 3 similar files."
}
```

**Error Cases:**
- No project context (not initialized)
- File not found in the index (suggest running `rag_index` or check file path)
- ChromaDB query failure
- Collections empty

**Annotations:**
```typescript
{
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
}
```

**Implementation Note:** The current Python `_find_importers` loads the entire collection with `collection.get()` (no filter). The MCP version MUST use ChromaDB's `where` clause or build a reverse-import lookup at index time to avoid O(N) memory usage. Consider storing a `dependents` metadata field during indexing, or using a `where` filter like:
```typescript
collection.get({ where: { imports: { $contains: fileName } } })
```

---

### 5. `rag_health_check`

**Title:** Check RAG System Health

**Description:**
```
Runs diagnostic checks on the RAG system and reports issues.

Checks performed:
  1. ChromaDB connection: Can we connect and read collections?
  2. Collection existence: Do all three collections (codebase, constraints,
     patterns) exist?
  3. Collection sizes: Are collections populated? Flags empty collections.
  4. Constraint files: Do ARCHITECTURE.yml and CONSTRAINTS.md exist on disk?
  5. Test query: Can we perform a semantic search and get results?
  6. Staleness: How old is the index? Warns if > 7 days since last index.

Returns a structured report with issues (critical) and warnings (non-critical).

Args: None

Returns:
  - healthy: boolean - true if no critical issues
  - collections: Status of each collection (exists, chunk count)
  - constraintFiles: Status of each expected constraint file
  - queryTest: Whether a test query succeeded
  - lastIndexed: ISO timestamp of last index, or null
  - issues: Array of critical problems that must be fixed
  - warnings: Array of non-critical concerns

Example use cases:
  - "Is the RAG system working?" -> (no args)
  - "Why am I getting no results?" -> check issues array
  - "Automated daily health check" -> (no args)

Prerequisite: rag_setup must have been called at some point.
```

**Input Schema (Zod):**
```typescript
{}  // No inputs
```

**Output Format:**
```json
{
  "status": "success",
  "healthy": true,
  "collections": {
    "codebase": { "exists": true, "chunks": 372 },
    "constraints": { "exists": true, "chunks": 3 },
    "patterns": { "exists": true, "chunks": 12 }
  },
  "constraintFiles": {
    "ARCHITECTURE.yml": true,
    "CONSTRAINTS.md": false,
    "CLAUDE.md": true
  },
  "queryTest": "passed",
  "lastIndexed": "2026-02-20T14:30:00.000Z",
  "issues": [],
  "warnings": [
    "Missing constraint file: CONSTRAINTS.md"
  ]
}
```

**Error Cases:**
- No project context (not initialized)
- ChromaDB directory missing or corrupt
- All collections missing (suggest running `rag_index`)

**Annotations:**
```typescript
{
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
}
```

---

### 6. `rag_status`

**Title:** Quick RAG Status Check

**Description:**
```
Returns a quick summary of the RAG system state. Lighter than rag_health_check
- does not run a test query or check constraint files on disk.

Use this to quickly check if the system is initialized and has data before
running queries. Returns in milliseconds.

Args: None

Returns:
  - initialized: boolean - whether rag_setup has been called
  - projectRoot: string or null
  - indexed: boolean - whether rag_index has been run
  - lastIndexed: ISO timestamp or null
  - totalChunks: number across all collections
  - collectionCounts: chunk count per collection

Example use cases:
  - "Is RAG set up?" -> check initialized
  - "When was the last index?" -> check lastIndexed
  - "How much data is indexed?" -> check totalChunks
```

**Input Schema (Zod):**
```typescript
{}  // No inputs
```

**Output Format:**
```json
{
  "status": "success",
  "initialized": true,
  "projectRoot": "/abs/path/to/project",
  "indexed": true,
  "lastIndexed": "2026-02-20T14:30:00.000Z",
  "totalChunks": 387,
  "collectionCounts": {
    "codebase": 372,
    "constraints": 3,
    "patterns": 12
  }
}
```

**Error Cases:**
- No project context (returns `initialized: false` with null fields, not an error)

**Annotations:**
```typescript
{
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
}
```

---

## State Management

### Project Context Persistence

The server holds `currentProject` in memory (like codegraph's `currentGraph`). Additionally, project configuration is persisted to `{project_root}/.rag/config.json` so that:

1. `rag_setup` writes the config to disk
2. `rag_index` and other tools can reload it if the server restarts
3. No generated Python files, no wildcard imports

```typescript
// Config file: {project_root}/.rag/config.json
interface PersistedConfig {
  projectRoot: string;
  frontendPath: string | null;
  backendPath: string | null;
  lastIndexedAt: string | null;
  setupAt: string;
  includeExtensions: string[];
  excludeDirs: string[];
  chunkSize: number;
  chunkOverlap: number;
  weights: Record<string, number>;
}
```

### ChromaDB Path

Default: `{project_root}/.rag/collections`

This keeps the RAG data colocated with the project and avoids global state conflicts. The `.rag/` directory should be added to `.gitignore`.

### Index Metadata

Store `lastIndexedAt` both in `config.json` and as metadata on the ChromaDB collections, so `rag_status` can return it without reading the filesystem.

---

## Key Design Decisions

### 1. No `input()` - All Parameters Explicit

Every value that `setup_rag.py` prompted for becomes an explicit tool parameter with auto-detection as the default. The agent decides; the user confirms via MCP tool approval.

### 2. No Generated Python Config

Replace `rag_config.py` with `{project_root}/.rag/config.json`. This is language-neutral, readable, and does not require being on `sys.path`.

### 3. ChromaDB Default Embedding Function

Use ChromaDB's built-in default embedder instead of requiring sentence-transformers + PyTorch. This eliminates a 500+ MB dependency and avoids model download on first use.

### 4. Forward-Slash Paths in Metadata

Always normalize paths to forward slashes in ChromaDB metadata, regardless of OS. This prevents the Windows path-matching bugs identified in the issue report.

```typescript
const normalizedPath = relativePath.split(path.sep).join("/");
```

### 5. No `sys.exit()` - Structured Errors

All errors return via `errResponse()`. The server process never exits due to a tool call failure.

### 6. Proper `_find_importers` Implementation

Instead of loading the entire collection, either:
- Build a reverse-import index at index time (stored in collection metadata)
- Use ChromaDB's `where` clause to filter by metadata fields
- At minimum, use `collection.get()` with `include: ["metadatas"]` to avoid loading documents and embeddings when only metadata is needed

### 7. Smarter Chunking

Replace line-count chunking with token-aware or function-boundary chunking:
- Respect function/class boundaries where possible
- Target 200-400 tokens per chunk (not 500 lines)
- Ensure chunks are self-contained with file path context headers

---

## File Structure

```
mcp-servers/rag-enforcer-mcp/
  package.json
  tsconfig.json
  src/
    index.ts          # Server setup, tool registration (like codegraph)
    types.ts          # ProjectContext, ProjectConfig, etc.
    setup.ts          # Project detection, file generation
    indexer.ts         # Codebase indexing logic
    query.ts          # Constraint checking, impact analysis
    health.ts         # Health check and status
    utils/
      paths.ts        # Path normalization, resolution
      chunker.ts      # Content chunking strategies
      metadata.ts     # Metadata extraction (imports, exports, endpoints)
```
