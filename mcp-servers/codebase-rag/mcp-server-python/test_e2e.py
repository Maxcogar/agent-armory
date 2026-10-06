#!/usr/bin/env python3
"""End-to-end test for the Python MCP RAG server.

Tests the underlying functions directly:
  1. setup_project
  2. index_project
  3. check_constraints (wired behind rag_search)
  4. query_impact (wired behind rag_query_impact)
  5. health_check
  6. get_status
  7. index_file (per-file incremental update)
"""

import json
import os
import shutil
import sys
import traceback

# Add server directory to path
SERVER_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SERVER_DIR)

from config import ProjectContext, restore_context, rag_dir as cache_dir_for_project
from bootstrap import setup_project
from indexer import index_project, index_file
from query import check_constraints, query_impact
from health import health_check, get_status
from utils.chroma import reset_cache as reset_chroma_cache

TEST_PROJECT = os.path.abspath(
    os.path.join(SERVER_DIR, "..", "test-project")
)

# Track results
results = {}
PASS = "PASS"
FAIL = "FAIL"


def section(name: str):
    print(f"\n{'=' * 60}")
    print(f"  TEST: {name}")
    print(f"{'=' * 60}")


def check(label: str, condition: bool, detail: str = ""):
    status = PASS if condition else FAIL
    msg = f"  [{status}] {label}"
    if detail:
        msg += f" -- {detail}"
    print(msg)
    return condition


# ============================================================
# Clean up cache for this test project to start fresh
# ============================================================

cache_dir = cache_dir_for_project(TEST_PROJECT)
if os.path.isdir(cache_dir):
    print(f"[cleanup] Removing cache dir: {cache_dir}")
    shutil.rmtree(cache_dir, ignore_errors=True)
    reset_chroma_cache()

# Also clean up any legacy .rag dir inside the project (left over from old layout)
legacy_rag = os.path.join(TEST_PROJECT, ".rag")
if os.path.isdir(legacy_rag):
    print(f"[cleanup] Removing legacy .rag dir: {legacy_rag}")
    shutil.rmtree(legacy_rag, ignore_errors=True)

# ============================================================
# 1. rag_setup
# ============================================================

section("1. rag_setup")
try:
    output = setup_project(TEST_PROJECT, force=True)
    result = output["result"]
    context = output["context"]

    print(f"  Result keys: {list(result.keys())}")
    print(f"  Status: {result.get('status')}")
    print(f"  Frontend detected: {result.get('frontendDetected')}")
    print(f"  Backend detected: {result.get('backendDetected')}")
    print(f"  ChromaDB path: {result.get('chromaDbPath')}")
    print(f"  Files generated: {result.get('filesGenerated')}")
    print(f"  Patterns detected: {json.dumps(result.get('patternsDetected', {}), indent=4)}")

    t1 = all([
        check("status is success", result.get("status") == "success"),
        check("frontend detected", result.get("frontendDetected") is not None, result.get("frontendDetected", "")),
        check("backend detected", result.get("backendDetected") is not None, result.get("backendDetected", "")),
        check("chromaDbPath set", result.get("chromaDbPath") is not None),
        check("cache dir created", os.path.isdir(cache_dir)),
        check("config.json exists in cache", os.path.isfile(os.path.join(cache_dir, "config.json"))),
        check("no .rag/ created in project tree", not os.path.isdir(legacy_rag)),
        check("ARCHITECTURE.yml generated or exists",
              os.path.isfile(os.path.join(TEST_PROJECT, "ARCHITECTURE.yml"))),
        check("docs/patterns/ exists",
              os.path.isdir(os.path.join(TEST_PROJECT, "docs", "patterns"))),
        check("context object valid", isinstance(context, ProjectContext)),
    ])
    results["rag_setup"] = PASS if t1 else FAIL
except Exception as e:
    print(f"  [FAIL] Exception: {e}")
    traceback.print_exc()
    results["rag_setup"] = FAIL
    context = None

# ============================================================
# 2. rag_index
# ============================================================

section("2. rag_index")
if context is None:
    print("  [SKIP] No context from rag_setup")
    results["rag_index"] = FAIL
else:
    try:
        stats = index_project(context)

        print(f"  Files indexed: {stats.get('filesIndexed')}")
        print(f"  Chunks created: {stats.get('chunksCreated')}")
        print(f"  Collection stats: {json.dumps(stats.get('collectionStats', {}), indent=4)}")
        print(f"  Errors: {stats.get('errors')}")
        print(f"  Duration: {stats.get('duration')}s")

        t2 = all([
            check("filesIndexed > 0", stats.get("filesIndexed", 0) > 0,
                  str(stats.get("filesIndexed"))),
            check("chunksCreated > 0", stats.get("chunksCreated", 0) > 0,
                  str(stats.get("chunksCreated"))),
            check("codebase collection populated",
                  stats.get("collectionStats", {}).get("codebase", 0) > 0,
                  str(stats.get("collectionStats", {}).get("codebase"))),
            check("constraints collection populated",
                  stats.get("collectionStats", {}).get("constraints", 0) > 0,
                  str(stats.get("collectionStats", {}).get("constraints"))),
            check("patterns collection populated",
                  stats.get("collectionStats", {}).get("patterns", 0) > 0,
                  str(stats.get("collectionStats", {}).get("patterns"))),
            check("no errors", len(stats.get("errors", [])) == 0,
                  str(stats.get("errors")) if stats.get("errors") else ""),
            check("duration is numeric", isinstance(stats.get("duration"), (int, float))),
        ])

        # Refresh context after indexing (it updates last_indexed_at)
        context = restore_context(TEST_PROJECT)
        results["rag_index"] = PASS if t2 else FAIL
    except Exception as e:
        print(f"  [FAIL] Exception: {e}")
        traceback.print_exc()
        results["rag_index"] = FAIL

# ============================================================
# 3. rag_check_constraints
# ============================================================

section("3. rag_check_constraints")
if context is None:
    print("  [SKIP] No context")
    results["rag_check_constraints"] = FAIL
else:
    try:
        query_text = "Add a new POST /api/users/profile endpoint"
        result = check_constraints(context, query_text, num_results=5)

        print(f"  Query: {result.get('query')}")
        print(f"  Constraints returned: {len(result.get('constraints', []))}")
        print(f"  Patterns returned: {len(result.get('patterns', []))}")
        print(f"  Examples returned: {len(result.get('examples', []))}")
        print(f"  Summary: {result.get('summary')}")

        # Show first constraint if any
        if result.get("constraints"):
            c = result["constraints"][0]
            print(f"  First constraint relevance: {c.get('relevance')}")
            print(f"  First constraint filePath: {c.get('filePath')}")
            print(f"  First constraint keyRules: {c.get('keyRules', [])[:3]}")

        # Show first pattern if any
        if result.get("patterns"):
            p = result["patterns"][0]
            print(f"  First pattern relevance: {p.get('relevance')}")
            print(f"  First pattern filePath: {p.get('filePath')}")

        # Show first example if any
        if result.get("examples"):
            ex = result["examples"][0]
            print(f"  First example relevance: {ex.get('relevance')}")
            print(f"  First example filePath: {ex.get('filePath')}")

        t3 = all([
            check("query matches", result.get("query") == query_text),
            check("constraints list returned", isinstance(result.get("constraints"), list)),
            check("patterns list returned", isinstance(result.get("patterns"), list)),
            check("examples list returned", isinstance(result.get("examples"), list)),
            check("at least 1 constraint", len(result.get("constraints", [])) >= 1),
            check("at least 1 pattern", len(result.get("patterns", [])) >= 1),
            check("at least 1 example", len(result.get("examples", [])) >= 1),
            check("relevance scores present",
                  all(
                      0.0 <= c.get("relevance", -1) <= 1.0
                      for c in result.get("constraints", [])
                  )),
            check("summary present", bool(result.get("summary"))),
        ])
        results["rag_check_constraints"] = PASS if t3 else FAIL
    except Exception as e:
        print(f"  [FAIL] Exception: {e}")
        traceback.print_exc()
        results["rag_check_constraints"] = FAIL

# ============================================================
# 4. rag_query_impact
# ============================================================

section("4. rag_query_impact")
if context is None:
    print("  [SKIP] No context")
    results["rag_query_impact"] = FAIL
else:
    try:
        file_path = "backend/routes/auth.js"
        result = query_impact(context, file_path, num_similar=5)

        print(f"  File path: {result.get('filePath')}")
        print(f"  Exports: {result.get('exports')}")
        print(f"  API endpoints: {result.get('apiEndpoints')}")
        print(f"  WebSocket events: {result.get('websocketEvents')}")
        print(f"  Dependents: {result.get('dependents')}")
        print(f"  Similar files count: {len(result.get('similarFiles', []))}")
        print(f"  Summary: {result.get('summary')}")

        if result.get("similarFiles"):
            for sf in result["similarFiles"][:3]:
                print(f"    Similar: {sf.get('filePath')} (similarity: {sf.get('similarity')})")

        t4 = all([
            check("filePath matches", result.get("filePath") == file_path),
            check("exports is list", isinstance(result.get("exports"), list)),
            check("apiEndpoints is list", isinstance(result.get("apiEndpoints"), list)),
            check("websocketEvents is list", isinstance(result.get("websocketEvents"), list)),
            check("dependents is list", isinstance(result.get("dependents"), list)),
            check("similarFiles is list", isinstance(result.get("similarFiles"), list)),
            check("at least 1 similar file", len(result.get("similarFiles", [])) >= 1),
            check("summary present", bool(result.get("summary"))),
        ])
        results["rag_query_impact"] = PASS if t4 else FAIL
    except Exception as e:
        print(f"  [FAIL] Exception: {e}")
        traceback.print_exc()
        results["rag_query_impact"] = FAIL

# ============================================================
# 5. rag_health_check
# ============================================================

section("5. rag_health_check")
if context is None:
    print("  [SKIP] No context")
    results["rag_health_check"] = FAIL
else:
    try:
        report = health_check(context)

        print(f"  Healthy: {report.get('healthy')}")
        print(f"  Collections: {json.dumps(report.get('collections', {}), indent=4)}")
        print(f"  Constraint files: {json.dumps(report.get('constraintFiles', {}), indent=4)}")
        print(f"  Query test: {report.get('queryTest')}")
        print(f"  Last indexed: {report.get('lastIndexed')}")
        print(f"  Issues: {report.get('issues')}")
        print(f"  Warnings: {report.get('warnings')}")

        t5 = all([
            check("healthy is True", report.get("healthy") is True),
            check("all 3 collections exist",
                  all(
                      report.get("collections", {}).get(c, {}).get("exists", False)
                      for c in ["codebase", "constraints", "patterns"]
                  )),
            check("all collections have chunks",
                  all(
                      report.get("collections", {}).get(c, {}).get("chunks", 0) > 0
                      for c in ["codebase", "constraints", "patterns"]
                  )),
            check("ARCHITECTURE.yml detected", report.get("constraintFiles", {}).get("ARCHITECTURE.yml", False)),
            check("CLAUDE.md detected", report.get("constraintFiles", {}).get("CLAUDE.md", False)),
            check("query test passed", report.get("queryTest") == "passed"),
            check("no critical issues", len(report.get("issues", [])) == 0,
                  str(report.get("issues")) if report.get("issues") else ""),
        ])
        results["rag_health_check"] = PASS if t5 else FAIL
    except Exception as e:
        print(f"  [FAIL] Exception: {e}")
        traceback.print_exc()
        results["rag_health_check"] = FAIL

# ============================================================
# 6. rag_status
# ============================================================

section("6. rag_status")
if context is None:
    print("  [SKIP] No context")
    results["rag_status"] = FAIL
else:
    try:
        status = get_status(context)

        print(f"  Initialized: {status.get('initialized')}")
        print(f"  Project root: {status.get('projectRoot')}")
        print(f"  Indexed: {status.get('indexed')}")
        print(f"  Last indexed: {status.get('lastIndexed')}")
        print(f"  Total chunks: {status.get('totalChunks')}")
        print(f"  Collection counts: {json.dumps(status.get('collectionCounts', {}), indent=4)}")

        t6 = all([
            check("initialized is True", status.get("initialized") is True),
            check("projectRoot set", status.get("projectRoot") is not None),
            check("indexed is True", status.get("indexed") is True),
            check("lastIndexed set", status.get("lastIndexed") is not None),
            check("totalChunks > 0", status.get("totalChunks", 0) > 0,
                  str(status.get("totalChunks"))),
            check("codebase count > 0",
                  status.get("collectionCounts", {}).get("codebase", 0) > 0),
            check("constraints count > 0",
                  status.get("collectionCounts", {}).get("constraints", 0) > 0),
            check("patterns count > 0",
                  status.get("collectionCounts", {}).get("patterns", 0) > 0),
        ])
        results["rag_status"] = PASS if t6 else FAIL
    except Exception as e:
        print(f"  [FAIL] Exception: {e}")
        traceback.print_exc()
        results["rag_status"] = FAIL

# Also test rag_status with None context (no project initialized)
section("6b. rag_status (no context)")
try:
    status_none = get_status(None)
    t6b = all([
        check("initialized is False", status_none.get("initialized") is False),
        check("projectRoot is None", status_none.get("projectRoot") is None),
        check("indexed is False", status_none.get("indexed") is False),
        check("totalChunks is 0", status_none.get("totalChunks") == 0),
    ])
    results["rag_status_no_ctx"] = PASS if t6b else FAIL
except Exception as e:
    print(f"  [FAIL] Exception: {e}")
    results["rag_status_no_ctx"] = FAIL

# ============================================================
# 7. index_file (per-file incremental update)
# ============================================================

section("7. index_file (per-file)")
if context is None:
    print("  [SKIP] No context")
    results["index_file"] = FAIL
else:
    try:
        # Append a unique marker function to a tracked file, re-index just that
        # file, and verify the new chunk is in the collection.
        target = os.path.join(TEST_PROJECT, "backend", "routes", "auth.js")
        marker = "checkConstraintsQuokkaSignature"

        with open(target, "r", encoding="utf-8") as f:
            original = f.read()
        try:
            with open(target, "a", encoding="utf-8") as f:
                f.write(f"\n\nfunction {marker}() {{ return 'unique'; }}\n")

            outcome = index_file(context, target)
            print(f"  index_file outcome: {outcome}")

            # Verify directly against the collection: are there chunks for this
            # file, and does the new marker appear in any of them?
            import chromadb
            from chromadb.config import Settings

            client = chromadb.PersistentClient(
                path=context.chroma_db_path,
                settings=Settings(anonymized_telemetry=False),
            )
            col = client.get_collection("codebase")
            chunks = col.get(
                where={"filePath": "backend/routes/auth.js"},
                include=["documents"],
            )
            has_marker = any(marker in (d or "") for d in chunks["documents"])
            print(f"  chunks for auth.js after index_file: {len(chunks['documents'])}")
            print(f"  any chunk contains marker: {has_marker}")

            t7 = all([
                check("index_file status is 'indexed'", outcome.get("status") == "indexed"),
                check("collection is codebase", outcome.get("collection") == "codebase"),
                check("re-embedded chunks contain marker", has_marker),
            ])
            results["index_file"] = PASS if t7 else FAIL
        finally:
            with open(target, "w", encoding="utf-8") as f:
                f.write(original)
            # Re-index again so subsequent runs see a clean tree
            index_file(context, target)
    except Exception as e:
        print(f"  [FAIL] Exception: {e}")
        traceback.print_exc()
        results["index_file"] = FAIL

# ============================================================
# 8. ProjectWatcher (filesystem watcher integration test)
# ============================================================

section("8. ProjectWatcher")
if context is None:
    print("  [SKIP] No context")
    results["watcher"] = FAIL
else:
    try:
        # Use a short debounce so the test stays fast.
        os.environ["RAG_WATCHER_DEBOUNCE_MS"] = "100"
        from watcher import ProjectWatcher
        import time as _time

        target = os.path.join(TEST_PROJECT, "backend", "routes", "users.js")
        marker = "watcherIntegrationQuokka"
        with open(target, "r", encoding="utf-8") as f:
            original = f.read()

        seen_paths = []
        def _on_change(path, gitignore):
            seen_paths.append(path)
            index_file(context, path, gitignore=gitignore)

        watcher = ProjectWatcher(context, on_change=_on_change)
        watcher.start()
        try:
            _time.sleep(0.2)  # let observer settle
            with open(target, "a", encoding="utf-8") as f:
                f.write(f"\nfunction {marker}() {{ return 1; }}\n")
            _time.sleep(0.8)  # debounce + reindex slack

            # Verify chunk made it into the collection.
            import chromadb
            from chromadb.config import Settings
            client = chromadb.PersistentClient(
                path=context.chroma_db_path,
                settings=Settings(anonymized_telemetry=False),
            )
            col = client.get_collection("codebase")
            chunks = col.get(
                where={"filePath": "backend/routes/users.js"},
                include=["documents"],
            )
            has_marker = any(marker in (d or "") for d in chunks["documents"])
            print(f"  watcher saw {len(seen_paths)} change(s)")
            print(f"  any chunk contains marker: {has_marker}")

            t8 = all([
                check("watcher fired at least once", len(seen_paths) >= 1),
                check("watcher reindexed the touched file", has_marker),
            ])
            results["watcher"] = PASS if t8 else FAIL
        finally:
            watcher.stop()
            with open(target, "w", encoding="utf-8") as f:
                f.write(original)
            index_file(context, target)
            os.environ.pop("RAG_WATCHER_DEBOUNCE_MS", None)
    except Exception as e:
        print(f"  [FAIL] Exception: {e}")
        traceback.print_exc()
        results["watcher"] = FAIL

# ============================================================
# 9. scope.is_in_scope honors .gitignore
# ============================================================

section("9. .gitignore is respected")
if context is None:
    print("  [SKIP] No context")
    results["gitignore"] = FAIL
else:
    try:
        import scope
        gitignore_path = os.path.join(TEST_PROJECT, ".gitignore")
        gen_dir = os.path.join(TEST_PROJECT, "generated")
        os.makedirs(gen_dir, exist_ok=True)
        gen_file = os.path.join(gen_dir, "build.js")
        with open(gen_file, "w", encoding="utf-8") as f:
            f.write("export const X = 1;\n")
        with open(gitignore_path, "w", encoding="utf-8") as f:
            f.write("generated/\n")
        try:
            gi = scope.load_gitignore(TEST_PROJECT)
            in_scope_with = scope.is_in_scope(gen_file, context, gitignore=gi)
            in_scope_without = scope.is_in_scope(gen_file, context, gitignore=None)
            print(f"  in_scope (with gitignore): {in_scope_with}")
            print(f"  in_scope (without gitignore): {in_scope_without}")
            t9 = all([
                check("gitignored file excluded when gitignore is honored", in_scope_with is False),
                check("same file would be in scope without gitignore", in_scope_without is True),
            ])
            results["gitignore"] = PASS if t9 else FAIL
        finally:
            shutil.rmtree(gen_dir, ignore_errors=True)
            try:
                os.remove(gitignore_path)
            except OSError:
                pass
    except Exception as e:
        print(f"  [FAIL] Exception: {e}")
        traceback.print_exc()
        results["gitignore"] = FAIL

# ============================================================
# 10. Path-containment + excluded-dir on relative path
# ============================================================

section("10. scope path-containment regressions")
if context is None:
    print("  [SKIP] No context")
    results["scope_containment"] = FAIL
else:
    try:
        import scope
        # Sibling with shared prefix must NOT be in scope.
        # project_root = .../test-project
        # poison_root  = .../test-project-evil
        evil_dir = TEST_PROJECT + "-evil"
        os.makedirs(evil_dir, exist_ok=True)
        poison_file = os.path.join(evil_dir, "evil.js")
        with open(poison_file, "w", encoding="utf-8") as f:
            f.write("// poisoned\nexport const X = 1;\n")
        try:
            in_scope_sibling = scope.is_in_scope(poison_file, context)
        finally:
            shutil.rmtree(evil_dir, ignore_errors=True)

        # A project hosted under a path containing an excluded-dir name
        # (e.g., somewhere under a `.cache` directory) must still index.
        # Simulate by checking that the abs-path containing ".venv" anywhere
        # doesn't bork a relative path that itself doesn't have ".venv".
        # We can't easily move TEST_PROJECT, so just unit-test the helper.
        from scope import _matches_excluded_dir
        rel_ok = _matches_excluded_dir("backend/routes/auth.js", [".venv"])
        rel_excluded = _matches_excluded_dir("frontend/.venv/foo.js", [".venv"])

        t10 = all([
            check("sibling-prefix path NOT in scope", in_scope_sibling is False),
            check("relative path without excluded segment is allowed", rel_ok is False),
            check("relative path with excluded segment is rejected", rel_excluded is True),
        ])
        results["scope_containment"] = PASS if t10 else FAIL
    except Exception as e:
        print(f"  [FAIL] Exception: {e}")
        traceback.print_exc()
        results["scope_containment"] = FAIL

# ============================================================
# 11. write_config atomic + max-size cap on index_file
# ============================================================

section("11. atomic config write + max file size cap")
if context is None:
    print("  [SKIP] No context")
    results["robustness"] = FAIL
else:
    try:
        from config import config_file_path
        from indexer import index_file as _index_file

        cfg_path = config_file_path(TEST_PROJECT)
        # The atomic-write should never leave a partial file behind. After a
        # call, there must be no leftover .tmp file in the cache dir.
        cache_root = os.path.dirname(cfg_path)
        leftovers_before = [f for f in os.listdir(cache_root) if f.endswith(".json.tmp")]

        # Force a file to exceed the cap and verify it's reported as empty.
        target = os.path.join(TEST_PROJECT, "backend", "routes", "projects.js")
        with open(target, "r", encoding="utf-8") as f:
            original = f.read()
        try:
            os.environ["RAG_MAX_FILE_BYTES"] = "10"  # tiny cap
            # Re-import indexer to pick up new env var? No — env is read at
            # import time. Instead, monkeypatch the constant.
            import indexer as _indexer
            saved_cap = _indexer._MAX_FILE_BYTES
            _indexer._MAX_FILE_BYTES = 10
            outcome = _indexer.index_file(context, target)
            _indexer._MAX_FILE_BYTES = saved_cap
        finally:
            with open(target, "w", encoding="utf-8") as f:
                f.write(original)

        leftovers_after = [f for f in os.listdir(cache_root) if f.endswith(".json.tmp")]

        t11 = all([
            check("no leftover .tmp from atomic write", leftovers_before == leftovers_after),
            check("oversized file reported as empty",
                  outcome.get("status") == "empty" and outcome.get("chunks") == 0,
                  str(outcome)),
        ])
        results["robustness"] = PASS if t11 else FAIL
    except Exception as e:
        print(f"  [FAIL] Exception: {e}")
        traceback.print_exc()
        results["robustness"] = FAIL

# ============================================================
# Shared fixture for the corruption tests: a collection large enough
# (2500 > chroma's 1000-record sync threshold) that its HNSW segment is
# persisted to disk and reloaded from header.bin on open.
# ============================================================

import atexit
import struct
import subprocess
import tempfile

_TEMP_DIRS = []


def _temp_dir(prefix: str) -> str:
    path = tempfile.mkdtemp(prefix=prefix)
    _TEMP_DIRS.append(path)
    return path


atexit.register(lambda: [shutil.rmtree(d, ignore_errors=True) for d in _TEMP_DIRS])

_FIXTURE_DIR = _temp_dir("rag-hnsw-fixture-")
_HEADER_OFFSETS = {"cur_element_count": 20, "size_data_per_element": 28}


def _build_persisted_fixture(path: str) -> None:
    import random
    import chromadb
    from chromadb.config import Settings
    client = chromadb.PersistentClient(path=path, settings=Settings(anonymized_telemetry=False))
    col = client.get_or_create_collection("fixture", metadata={"hnsw:space": "cosine"})
    rng = random.Random(7)
    for i in range(0, 2500, 100):
        col.add(
            ids=[str(j) for j in range(i, i + 100)],
            embeddings=[[rng.random() for _ in range(384)] for _ in range(100)],
        )


def _corrupt_copy(field: str, value: int) -> str:
    """Copy the fixture and overwrite one u64 header field. Returns the copy's path."""
    dst = _temp_dir("rag-hnsw-corrupt-")
    shutil.copytree(_FIXTURE_DIR, dst, dirs_exist_ok=True)
    seg = next(d for d in os.listdir(dst) if os.path.isfile(os.path.join(dst, d, "header.bin")))
    header = os.path.join(dst, seg, "header.bin")
    raw = bytearray(open(header, "rb").read())
    struct.pack_into("<Q", raw, _HEADER_OFFSETS[field], value)
    with open(header, "wb") as f:
        f.write(raw)
    return dst


_build_persisted_fixture(_FIXTURE_DIR)


# ============================================================
# 12. HNSW segment structural check
# ============================================================

section("12. HNSW segment structural check")
try:
    from utils.hnsw_check import find_corrupt_segments

    clean = find_corrupt_segments(_FIXTURE_DIR)
    bad_size = find_corrupt_segments(_corrupt_copy("size_data_per_element", 2_500_000))
    bad_count = find_corrupt_segments(_corrupt_copy("cur_element_count", 1_000_000))

    truncated_dir = _corrupt_copy("size_data_per_element", 1676)
    seg = next(d for d in os.listdir(truncated_dir) if os.path.isdir(os.path.join(truncated_dir, d)))
    with open(os.path.join(truncated_dir, seg, "header.bin"), "r+b") as f:
        f.truncate(60)
    bad_trunc = find_corrupt_segments(truncated_dir)

    t12 = all([
        check("persisted fixture segment exists",
              any(os.path.isfile(os.path.join(_FIXTURE_DIR, d, "header.bin")) for d in os.listdir(_FIXTURE_DIR))),
        check("sound segment passes", clean == [], str(clean)),
        check("corrupt size_data_per_element flagged", len(bad_size) == 1, str(bad_size)),
        check("corrupt cur_element_count flagged", len(bad_count) == 1, str(bad_count)),
        check("truncated header flagged", len(bad_trunc) == 1, str(bad_trunc)),
    ])
    results["hnsw_check"] = PASS if t12 else FAIL
except Exception as e:
    print(f"  [FAIL] Exception: {e}")
    traceback.print_exc()
    results["hnsw_check"] = FAIL


# ============================================================
# 13. Memory cap turns a runaway allocation into an in-process error
#
# Loads a corrupt segment directly (bypassing the structural check) in a
# child process: size_data_per_element = 2.5 MB makes hnswlib request
# ~5 GB. Under a 2 GB cap the load must fail with an exception.
# ============================================================

section("13. memory cap contains a corrupt-index allocation")
if not sys.platform.startswith("linux") and sys.platform != "win32":
    print(f"  [SKIP] memory cap not enforced on {sys.platform}")
    results["memory_cap"] = PASS
else:
    try:
        corrupt = _corrupt_copy("size_data_per_element", 2_500_000)
        child = (
            "import sys; sys.path.insert(0, %r)\n"
            "from utils.memlimit import apply_memory_limit\n"
            "assert apply_memory_limit(2 * 2**30)\n"
            "import chromadb\n"
            "from chromadb.config import Settings\n"
            "c = chromadb.PersistentClient(path=%r, settings=Settings(anonymized_telemetry=False))\n"
            "try:\n"
            "    c.get_collection('fixture').query(query_embeddings=[[0.1] * 384], n_results=1)\n"
            "    print('LOADED')\n"
            "except Exception as e:\n"
            "    print('CONTAINED', type(e).__name__, e)\n"
        ) % (SERVER_DIR, corrupt)
        proc = subprocess.run([sys.executable, "-c", child], capture_output=True, text=True, timeout=120)
        out = proc.stdout.strip().splitlines()
        last = out[-1] if out else proc.stderr.strip()[-300:]
        t13 = all([
            check("child exited normally", proc.returncode == 0, f"rc={proc.returncode}"),
            check("allocation failed inside the process", last.startswith("CONTAINED"), last),
        ])
        results["memory_cap"] = PASS if t13 else FAIL
    except Exception as e:
        print(f"  [FAIL] Exception: {e}")
        traceback.print_exc()
        results["memory_cap"] = FAIL


# ============================================================
# 14. Corrupt persisted index is discarded and rebuilt
# ============================================================

section("14. corrupt index is discarded and rebuilt")
try:
    from index_store import IndexUnavailable, open_index, open_or_rebuild

    collections_dir = os.path.join(cache_dir, "collections")
    corrupt = _corrupt_copy("size_data_per_element", 2_500_000)
    bad_seg = next(d for d in os.listdir(corrupt) if os.path.isfile(os.path.join(corrupt, d, "header.bin")))
    shutil.copytree(os.path.join(corrupt, bad_seg), os.path.join(collections_dir, bad_seg))

    try:
        open_index(TEST_PROJECT)
        refused = False
    except IndexUnavailable as e:
        refused = "corrupt HNSW segment" in str(e)

    rebuilt_ctx, rebuilt = open_or_rebuild(TEST_PROJECT)
    after = find_corrupt_segments(collections_dir)
    hits = check_constraints(rebuilt_ctx, "API endpoint route handler", 3, "all")
    reopened_ctx, reopened_rebuilt = open_or_rebuild(TEST_PROJECT)

    t14 = all([
        check("open_index refuses the corrupt index", refused),
        check("open_or_rebuild rebuilt it", rebuilt is True),
        check("corrupt segment removed", not os.path.isdir(os.path.join(collections_dir, bad_seg))),
        check("rebuilt index is sound", after == [], str(after)),
        check("search works after rebuild", len(hits.get("examples", [])) > 0),
        check("sound index reopens without rebuild", reopened_rebuilt is False),
    ])
    results["corrupt_recovery"] = PASS if t14 else FAIL
except Exception as e:
    print(f"  [FAIL] Exception: {e}")
    traceback.print_exc()
    results["corrupt_recovery"] = FAIL


# ============================================================
# 15. Single-writer lock: one owner per index, across processes
# ============================================================

section("15. single-writer lock")
try:
    from utils.writer_lock import WriterLock

    owner = WriterLock(cache_dir)
    other = WriterLock(cache_dir)
    got_owner = owner.try_acquire()
    got_other = other.try_acquire()

    probe = (
        "import sys; sys.path.insert(0, %r)\n"
        "from utils.writer_lock import WriterLock\n"
        "print('ACQUIRED' if WriterLock(%r).try_acquire() else 'REFUSED')\n"
    ) % (SERVER_DIR, cache_dir)
    child_view = subprocess.run([sys.executable, "-c", probe], capture_output=True, text=True, timeout=60).stdout.strip()

    sqlite_path = os.path.join(cache_dir, "collections", "chroma.sqlite3")
    mtime_before = os.path.getmtime(sqlite_path)
    reindex = subprocess.run(
        [sys.executable, os.path.join(SERVER_DIR, "scripts", "reindex.py"), "--project-root", TEST_PROJECT],
        capture_output=True, text=True, timeout=120,
    )
    mtime_after = os.path.getmtime(sqlite_path)

    owner.release()
    got_after_release = other.try_acquire()
    other.release()

    t15 = all([
        check("first lock acquired", got_owner),
        check("second in-process lock refused", not got_other),
        check("other process refused", child_view == "REFUSED", child_view),
        check("reindex.py exits 0 while the index is owned", reindex.returncode == 0, f"rc={reindex.returncode}"),
        check("reindex.py left the owned index untouched", mtime_before == mtime_after),
        check("lock is available after release", got_after_release),
    ])
    results["writer_lock"] = PASS if t15 else FAIL
except Exception as e:
    print(f"  [FAIL] Exception: {e}")
    traceback.print_exc()
    results["writer_lock"] = FAIL


# ============================================================
# Summary
# ============================================================

print(f"\n{'=' * 60}")
print("  FINAL RESULTS")
print(f"{'=' * 60}")
total_pass = 0
total_fail = 0
for tool, status in results.items():
    icon = "OK" if status == PASS else "XX"
    print(f"  [{icon}] {tool}: {status}")
    if status == PASS:
        total_pass += 1
    else:
        total_fail += 1

print(f"\n  Total: {total_pass} passed, {total_fail} failed out of {total_pass + total_fail}")
print(f"{'=' * 60}")

sys.exit(0 if total_fail == 0 else 1)
