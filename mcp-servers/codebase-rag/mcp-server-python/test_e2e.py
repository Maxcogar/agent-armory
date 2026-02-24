#!/usr/bin/env python3
"""End-to-end test for the Python MCP RAG server.

Tests all 6 tools by calling the underlying functions directly:
  1. rag_setup (setup_project)
  2. rag_index (index_project)
  3. rag_check_constraints (check_constraints)
  4. rag_query_impact (query_impact)
  5. rag_health_check (health_check)
  6. rag_status (get_status)
"""

import json
import os
import shutil
import sys
import traceback

# Add server directory to path
SERVER_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SERVER_DIR)

from config import ProjectContext, restore_context
from setup import setup_project
from indexer import index_project
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
# Clean up any prior .rag directory to start fresh
# ============================================================

rag_dir = os.path.join(TEST_PROJECT, ".rag")
if os.path.isdir(rag_dir):
    print(f"[cleanup] Removing existing .rag directory: {rag_dir}")
    def on_rm_error(func, path, exc_info):
        """Handle read-only files on Windows."""
        import stat
        os.chmod(path, stat.S_IWRITE)
        func(path)
    shutil.rmtree(rag_dir, onexc=on_rm_error)

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
        check(".rag directory created", os.path.isdir(rag_dir)),
        check(".rag/config.json exists", os.path.isfile(os.path.join(rag_dir, "config.json"))),
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
