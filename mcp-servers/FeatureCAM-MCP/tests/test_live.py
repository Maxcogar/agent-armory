"""Integration test suite for the FeatureCAM MCP server.

Requires FeatureCAM to be running (not elevated) with a document loaded.
Run from the project root: python tests/test_live.py
"""

import os
import sys
import json
import traceback

# Make the server module importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import featurecam_mcp_server as srv

PASS = 0
FAIL = 0
FAILURES = []


def check(name, condition, detail=""):
    global PASS, FAIL
    if condition:
        print(f"  PASS  {name}")
        PASS += 1
    else:
        print(f"  FAIL  {name}: {detail}")
        FAIL += 1
        FAILURES.append((name, detail))


def run_suite(name, fn):
    print(f"\n--- {name} ---")
    try:
        fn()
    except Exception as e:
        print(f"  FAIL  {name} (suite crashed): {type(e).__name__}: {e}")
        traceback.print_exc()
        FAILURES.append((name, str(e)))


def test_connection():
    """COM connection returns both app and IFMDocument."""
    app, doc = srv.get_featurecam()
    check("connection returns app", app is not None)
    check("connection returns doc", doc is not None)
    check("doc.Name accessible", bool(doc.Name))
    # IFMDocument must expose Setups (IMFGDocument does not)
    check(
        "doc is IFMDocument (has Setups)",
        hasattr(doc, "Setups"),
        "doc does not have Setups attribute — CastTo may have failed",
    )


def test_constants():
    """Hardcoded constants match type library values."""
    check("setup type Milling = 1", 1 in srv.SETUP_TYPES)
    check("setup type Turning = 2", 2 in srv.SETUP_TYPES)
    check("setup type Wire = 4", 4 in srv.SETUP_TYPES)
    check("tool group EndMill = 32", srv.TOOL_GROUPS.get(32) == "EndMill")
    check("tool group TwistDrill = 1", srv.TOOL_GROUPS.get(1) == "TwistDrill")
    check("tool group FaceMill = 4096", srv.TOOL_GROUPS.get(4096) == "FaceMill")
    check("tool group TurnOD present", 4 in srv.TOOL_GROUPS)
    check("tool group TurnThread present", 8 in srv.TOOL_GROUPS)
    check("18 tool groups total", len(srv.TOOL_GROUPS) == 18)


def test_document_info():
    """get_document_info returns valid JSON with required fields."""
    result = srv.get_document_info()
    data = json.loads(result)
    check("document_name present", "document_name" in data)
    check("document_name non-empty", bool(data.get("document_name")))
    check("setups list present", isinstance(data.get("setups"), list))
    check("setups count > 0", len(data.get("setups", [])) > 0)
    check("operation_count > 0", data.get("operation_count", 0) > 0)
    check("stock dict present", isinstance(data.get("stock"), dict))


def test_setups():
    """list_setups returns valid data and types resolve correctly."""
    result = srv.list_setups()
    data = json.loads(result)
    check("list_setups returns dict", isinstance(data, dict))
    setups = data.get("setups", [])
    check("at least one setup", len(setups) > 0)

    for setup in setups:
        check(
            f"setup '{setup['name']}' has valid type",
            setup.get("type") in ("Milling", "Turning", "Wire"),
            f"got: {setup.get('type')}",
        )
        check(
            f"setup '{setup['name']}' has numeric feature_count",
            isinstance(setup.get("feature_count"), int),
        )


def test_setup_details():
    """get_setup_details returns UCS, machine location, features."""
    # Get first setup name
    result = json.loads(srv.list_setups())
    setup_name = result["setups"][0]["name"]

    details = json.loads(srv.get_setup_details(setup_name=setup_name))
    check("details.name matches", details.get("name") == setup_name)
    check("details has features list", isinstance(details.get("features"), list))
    check("details has fixture_id", "fixture_id" in details)


def test_setup_not_found():
    """get_setup_details raises ToolError for nonexistent setup."""
    try:
        srv.get_setup_details(setup_name="__NONEXISTENT__")
        check("get_setup_details raises on nonexistent", False, "did not raise")
    except srv.ToolError as e:
        check("get_setup_details raises ToolError", True)
        check(
            "error message lists available setups",
            "Available setups:" in str(e),
            f"error: {e}",
        )


def test_tools():
    """list_tools returns valid tool data with correct groups."""
    result = json.loads(srv.list_tools())
    tools = result.get("tools", [])
    check("at least one tool", len(tools) > 0)

    valid_groups = set(srv.TOOL_GROUPS.values())
    for tool in tools:
        check(
            f"tool '{tool['name']}' has valid group",
            tool.get("group") in valid_groups,
            f"got: {tool.get('group')}",
        )
        check(
            f"tool '{tool['name']}' has tool_number",
            isinstance(tool.get("tool_number"), int),
        )


def test_tool_not_found():
    try:
        srv.get_tool_details(tool_name="__NONEXISTENT__")
        check("get_tool_details raises on nonexistent", False, "did not raise")
    except srv.ToolError as e:
        check("get_tool_details raises ToolError", True)


def test_operations():
    """get_operations returns operations with feature linkage."""
    result = json.loads(srv.get_operations())
    ops = result.get("operations", [])
    check("operations present", len(ops) > 0)

    sample = ops[0]
    check("operation has name", bool(sample.get("name")))
    check("operation has feature linkage", "feature" in sample)
    check("operation has errors field", "errors" in sample)


def test_check_errors():
    """check_operation_errors returns structured error report."""
    result = json.loads(srv.check_operation_errors())
    check("has_errors field present", "has_errors" in result)
    check("error_count is int", isinstance(result.get("error_count"), int))
    check("operations_checked > 0", result.get("operations_checked", 0) > 0)


def test_ucs():
    """list_ucs returns UCSs with origins and vectors."""
    result = json.loads(srv.list_ucs())
    ucs_list = result.get("ucs_list", [])
    check("at least one UCS", len(ucs_list) > 0)

    for ucs in ucs_list:
        check(
            f"UCS '{ucs['name']}' has origin",
            isinstance(ucs.get("origin"), list) and len(ucs["origin"]) == 3,
        )
        check(
            f"UCS '{ucs['name']}' has 9 vectors",
            isinstance(ucs.get("vectors"), list) and len(ucs["vectors"]) == 9,
        )


def test_work_offsets():
    """get_work_offsets returns fixture data for setups."""
    result = json.loads(srv.get_work_offsets())
    offsets = result.get("offsets", [])
    check("at least one offset", len(offsets) > 0)

    for offset in offsets:
        check(
            f"offset '{offset['setup']}' has fixture_id",
            "fixture_id" in offset,
        )


def test_stock():
    """get_stock_info returns stock data including material."""
    result = json.loads(srv.get_stock_info())
    check("stock has name", bool(result.get("name")))
    check("stock has material", "material" in result)


def test_stock_export():
    """export_stock creates an actual STL file."""
    out_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "tmp_test_stock.stl"
    )
    try:
        srv.export_stock(output_path=out_path)
        check("STL file created", os.path.exists(out_path))
        if os.path.exists(out_path):
            check("STL file non-empty", os.path.getsize(out_path) > 0)
    finally:
        if os.path.exists(out_path):
            os.remove(out_path)


def test_solids():
    result = json.loads(srv.list_solids())
    solids = result.get("solids", [])
    check("solids list present", isinstance(solids, list))


def test_toolpaths_valid():
    """toolpaths_valid returns a boolean."""
    result = json.loads(srv.toolpaths_valid())
    check(
        "toolpaths_valid returns bool",
        isinstance(result.get("toolpaths_valid"), bool),
    )


if __name__ == "__main__":
    print("=" * 60)
    print("FeatureCAM MCP Server Integration Tests")
    print("=" * 60)

    run_suite("connection", test_connection)
    run_suite("constants", test_constants)
    run_suite("document info", test_document_info)
    run_suite("setups", test_setups)
    run_suite("setup details", test_setup_details)
    run_suite("setup not found", test_setup_not_found)
    run_suite("tools", test_tools)
    run_suite("tool not found", test_tool_not_found)
    run_suite("operations", test_operations)
    run_suite("check errors", test_check_errors)
    run_suite("ucs", test_ucs)
    run_suite("work offsets", test_work_offsets)
    run_suite("stock", test_stock)
    run_suite("stock export", test_stock_export)
    run_suite("solids", test_solids)
    run_suite("toolpaths valid", test_toolpaths_valid)

    print("\n" + "=" * 60)
    print(f"RESULTS: {PASS} passed, {FAIL} failed")
    print("=" * 60)

    if FAIL > 0:
        sys.exit(1)
