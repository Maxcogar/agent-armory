# Codebase RAG Enforcer - Issue Report

Comprehensive audit of all scripts in `scripts/`. Each issue is categorized by severity and script.

---

## 1. Interactive `input()` Calls Block Non-Interactive Usage

**Severity:** CRITICAL
**Script:** `setup_rag.py` (lines 69, 78, 93, 100)
**Impact:** Completely unusable by AI agents or any non-interactive caller.

`setup_rag.py` calls `input()` four times during `detect_structure()`:

```python
confirm = input(f"Found frontend at {candidate.relative_to(self.project_root)}. Use this? [Y/n]: ")
custom = input("Enter frontend directory path (or press Enter to skip): ")
confirm = input(f"Found backend at {candidate.relative_to(self.project_root)}. Use this? [Y/n]: ")
custom = input("Enter backend directory path (or press Enter to skip): ")
```

An MCP tool cannot prompt the user. These must become explicit parameters (`project_root`, `frontend_path`, `backend_path`) with auto-detection as the fallback default.

---

## 2. Bare `except: pass` Swallowing All Errors

**Severity:** HIGH
**Scripts:** `setup_rag.py` (lines 74, 143, 181, 207), `index_codebase.py` (lines 54-55), `check_constraints.py` (line 39)

Multiple instances of bare `except:` or `except: pass`:

| File | Line | Context |
|------|------|---------|
| `setup_rag.py` | 74 | `except: pass` in `detect_structure` while reading `package.json` |
| `setup_rag.py` | 143 | `except: pass` in `scan_backend_patterns` while reading route files |
| `setup_rag.py` | 181 | `except: pass` in `scan_frontend_patterns` while reading component files |
| `setup_rag.py` | 207 | `except: pass` in `generate_architecture_yml` while reading `package.json` |
| `index_codebase.py` | 54-55 | `except: pass` in `_reset_collections` (silently ignores delete failures) |
| `check_constraints.py` | 39 | `except: return []` in `_query_collection` (masks ChromaDB connection errors, missing collections, encoding issues) |

These make debugging impossible. A user sees "no results" with zero indication that the ChromaDB connection failed, a collection is missing, or files are unreadable.

---

## 3. Generated `rag_config.py` + `from rag_config import *` Anti-Pattern

**Severity:** HIGH
**Scripts:** `index_codebase.py` (line 17), `check_constraints.py` (line 9), `query_impact.py` (line 10), `health_check.py` (line 8)

The architecture is:

1. `setup_rag.py` generates `rag/scripts/rag_config.py` at runtime (line 419-422)
2. All other scripts do `from rag_config import *` and exit if it fails

Problems:
- **Circular dependency:** You must run `setup_rag.py` to generate the config that all other scripts need. But if setup fails partway through, you have no config and no way to diagnose.
- **Wildcard import:** `from rag_config import *` pollutes the namespace and makes it impossible to know which names come from where. Linters flag this.
- **Working directory dependency:** `from rag_config import *` only works if `sys.path` includes the directory containing `rag_config.py`. The scripts must be invoked from `rag/scripts/` or the import fails. The SKILL.md instructions say `cd rag/scripts` before running.
- **Not a package:** `rag_config.py` is a generated Python file with no `__init__.py`, making it fragile.
- **Config is code:** The generated file uses `Path(__file__)` relative paths which break if the file is moved, copied, or the project is renamed.

The MCP replacement should store config as JSON or in ChromaDB metadata, never as generated executable Python.

---

## 4. ChromaDB API Compatibility (`list_collections`)

**Severity:** HIGH
**Script:** `health_check.py` (line 27)

```python
collections = client.list_collections()
collection_names = [c.name for c in collections]
```

In ChromaDB >= 0.4.x, `list_collections()` returns a list of strings (collection names), not `Collection` objects. Accessing `.name` on a string raises `AttributeError`. This breaks the health check on any recent ChromaDB version.

The correct code for newer versions:
```python
collection_names = client.list_collections()  # Already strings
```

---

## 5. `_find_importers` Loads Entire Collection Into Memory

**Severity:** HIGH
**Script:** `query_impact.py` (line 117)

```python
results = collection.get()  # No filter - loads ALL documents, embeddings, metadata
```

This calls `collection.get()` with no `where` clause, no `limit`, and no `ids` filter. For a codebase with thousands of files and 500-line chunks, this loads the entire codebase's text plus embeddings into Python memory. On a project with 10,000 chunks, this could be 50-100 MB just for the text, plus embedding vectors.

It then does a linear scan checking `if file_name in imports_str` (line 125). This is O(N) on every call.

The MCP version should use ChromaDB's `where` clause to filter, or build a proper reverse-import index at index time.

---

## 6. Missing Error Handling and Recovery

**Severity:** MEDIUM
**Scripts:** All scripts

No script validates its prerequisites before proceeding:

- **No ChromaDB connection check:** Scripts instantiate `PersistentClient` and assume it works. If the `collections/` directory is locked, corrupt, or missing, the error is opaque.
- **No collection existence check before query:** `check_constraints.py` and `query_impact.py` call `get_collection()` which throws if the collection does not exist. The bare `except` in `check_constraints.py` masks this; `query_impact.py` has no protection at all.
- **No stale index detection:** There is no metadata tracking when the index was last built. If files have changed since indexing, results are silently stale.
- **No re-index capability:** `_reset_collections` deletes and recreates. There is no incremental update path - every re-index is a full rebuild.
- **`sys.exit(1)` in library code:** `health_check.py` and `index_codebase.py` call `sys.exit()` which kills the entire process. Unusable when called as a library.

---

## 7. Windows-Specific Issues

**Severity:** MEDIUM
**Scripts:** `index_codebase.py`, `setup_rag.py`

While the scripts add `encoding='utf-8'` to most file reads (noted as a fix in comments), there are remaining issues:

- **Path separators in metadata:** `str(file_path.relative_to(PROJECT_ROOT))` produces backslash paths on Windows (`backend\routes\auth.js`). When `query_impact.py` does string matching (`if file_name in imports_str`), it compares Windows paths against forward-slash import strings, which never match.
- **ChromaDB persist directory:** `CHROMA_PERSIST_DIR = str(RAG_ROOT / "collections")` uses `str()` which produces backslash paths on Windows. ChromaDB may or may not handle this correctly depending on version.
- **Console encoding:** `print()` statements with emoji characters can fail on Windows terminals without UTF-8 support (`cp1252` default). This is cosmetic but confusing.

---

## 8. Path Handling Fragility

**Severity:** MEDIUM
**Scripts:** `setup_rag.py`, `index_codebase.py`, `query_impact.py`

- **`self.project_root = Path.cwd()`** (setup_rag.py line 14): Assumes the script is run from the project root. If run from any other directory, all paths are wrong.
- **Relative path assumptions in config:** The generated `rag_config.py` uses `Path(__file__).parent.parent` to navigate up. This breaks if the config file is not exactly two levels below the project root.
- **`file_path.relative_to(PROJECT_ROOT)`** (multiple files): Throws `ValueError` if the file is not under `PROJECT_ROOT`. No exception handling around these calls.
- **query_impact.py takes string path:** `analyze(file_path)` takes a string like `backend/routes/auth.js` and compares it directly against metadata strings. No normalization, no resolution, no validation that the path exists.

---

## 9. sentence-transformers Dependency is Heavy

**Severity:** MEDIUM
**Scripts:** `index_codebase.py`, `check_constraints.py`, `query_impact.py`, `health_check.py`

Every script that touches ChromaDB also loads `SentenceTransformer(EMBEDDING_MODEL)`. This:

- Downloads a 90 MB model on first use
- Takes 2-5 seconds to load on every invocation
- Requires PyTorch (500+ MB install)
- Makes the stack fragile (PyTorch version conflicts are common)

ChromaDB has a built-in default embedding function that avoids this entirely. The MCP version in TypeScript can use ChromaDB's JS client with its default embedder, or use a lightweight alternative.

---

## 10. Chunking Strategy Issues

**Severity:** LOW
**Script:** `index_codebase.py` (lines 99-108)

```python
CHUNK_SIZE = 500  # lines
CHUNK_OVERLAP = 50  # lines
```

- **500 lines per chunk is very large.** Most semantic search systems use 200-500 *tokens*, not lines. A 500-line chunk of code could be 5,000+ tokens, well beyond what embedding models handle meaningfully.
- **Line-based chunking splits functions arbitrarily.** A function definition may be split across chunks, losing semantic coherence.
- **No language-aware chunking.** The chunker does not understand function/class boundaries, so related code gets separated while unrelated code gets grouped.

---

## 11. Argument Parsing Bug in check_constraints.py

**Severity:** LOW
**Script:** `check_constraints.py` (lines 119-120)

```python
planned_change = " ".join(sys.argv[1:])
num_results = int(sys.argv[-1]) if sys.argv[-1].isdigit() else 5
```

If the user passes `python check_constraints.py "add auth endpoint" 10`:
- `planned_change` = `"add auth endpoint 10"` (includes the number)
- `num_results` = `10`

The number is included in both the query string and the results count. This corrupts the semantic query.

---

## 12. No Concurrency Safety

**Severity:** LOW
**Scripts:** `index_codebase.py`

`_reset_collections` deletes and recreates all collections without locking. If two processes index simultaneously (e.g., the auto-indexing hook fires while a manual index is running), data corruption is possible. ChromaDB's PersistentClient provides some file-level locking, but the delete-then-create sequence is not atomic.

---

## 13. MD5 for Chunk IDs

**Severity:** LOW
**Script:** `index_codebase.py` (line 204)

```python
return hashlib.md5(data.encode()).hexdigest()
```

MD5 is used for chunk ID generation. While collision risk is minimal for this use case, some environments flag MD5 usage in security scans. SHA-256 truncated to 32 chars would be just as fast and avoids false positives.

---

## 14. Weight System Only Checks Substring

**Severity:** LOW
**Script:** `index_codebase.py` (lines 147-152)

```python
for pattern, weight in WEIGHTS.items():
    if pattern in relative_path:
        return weight
```

This returns the weight of the *first* matching pattern, not the *highest*. Pattern iteration order in Python dicts is insertion order, but the intent seems to be "most specific match wins". A file at `docs/patterns/api-endpoints.md` would match `"docs/patterns/"` (weight 8.0) only if it appears before `".md"` patterns in the dict.

---

## Summary Table

| # | Issue | Severity | Scripts Affected |
|---|-------|----------|-----------------|
| 1 | Interactive `input()` calls | CRITICAL | setup_rag.py |
| 2 | Bare `except: pass` | HIGH | setup_rag.py, index_codebase.py, check_constraints.py |
| 3 | Generated config + wildcard import | HIGH | All 5 scripts |
| 4 | ChromaDB API compatibility | HIGH | health_check.py |
| 5 | `_find_importers` loads all chunks | HIGH | query_impact.py |
| 6 | Missing error handling/recovery | MEDIUM | All scripts |
| 7 | Windows path/encoding issues | MEDIUM | index_codebase.py, setup_rag.py |
| 8 | Path handling fragility | MEDIUM | setup_rag.py, index_codebase.py, query_impact.py |
| 9 | Heavy sentence-transformers dep | MEDIUM | All query scripts |
| 10 | Chunking strategy issues | LOW | index_codebase.py |
| 11 | Argument parsing bug | LOW | check_constraints.py |
| 12 | No concurrency safety | LOW | index_codebase.py |
| 13 | MD5 for chunk IDs | LOW | index_codebase.py |
| 14 | Weight substring matching | LOW | index_codebase.py |
