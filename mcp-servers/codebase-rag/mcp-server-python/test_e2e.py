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
from setup import setup_project
from indexer import index_project, index_file
from query import check_constraints, query_impact
from health import health_check, get_status

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
                check("index_file returned indexed", outcome.get("indexed") is True),
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
