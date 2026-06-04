# FeatureCAM MCP Server Rewrite

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the FeatureCAM MCP server so every tool works against a real FeatureCAM instance, using the correct COM interface, verified enum values, and MCP-compliant error handling.

**Architecture:** Single Python file (`featurecam_mcp_server.py`). COM connection uses `EnsureDispatch` + `CastTo(doc, "IFMDocument")` to access the full API. Sync tool handlers (not async) with `pythoncom.CoInitialize()` per call. Connection cached at module level with liveness check. Errors raised via `ToolError`. All constants from verified Phase 0 results.

**Tech Stack:** Python 3.8+, FastMCP (`mcp` package), Pydantic v2, pywin32 (COM automation)

**Reference data:** `phase0_results.json` contains every verified attribute, enum value, and property name.

---

## File Structure

- **Rewrite:** `featurecam_mcp_server.py` (the entire server — new file from scratch)
- **Create:** `tests/test_live.py` (integration test against running FeatureCAM)
- **Modify:** `requirements.txt` (update mcp version)

---

### Task 1: COM Connection Layer + Constants + Server Init

**Files:**
- Create: `featurecam_mcp_server.py` (lines 1-150 approx — foundation)
- Modify: `requirements.txt`

- [ ] **Step 1: Update requirements.txt**

```
# FeatureCAM MCP Server Requirements

# MCP Server Framework
mcp>=1.20.0

# Input Validation
pydantic>=2.0.0

# Windows COM Automation (required for FeatureCAM integration)
pywin32>=300
```

- [ ] **Step 2: Write the server foundation**

Write the top of `featurecam_mcp_server.py`:

```python
"""
FeatureCAM MCP Server

Connects Claude to Autodesk FeatureCAM via COM automation (IFMDocument interface).
Verified against FeatureCAM 7.27 on 2026-04-09.
"""

import json
import os
from typing import Optional
from enum import Enum

from mcp.server.fastmcp import FastMCP
from mcp.server.fastmcp.exceptions import ToolError
from pydantic import BaseModel, Field, ConfigDict

import win32com.client
import pythoncom
import pywintypes

mcp = FastMCP("featurecam", mask_error_details=False)

# ==========================================================================
# CONSTANTS — Verified against FeatureCAM 7.27 type library (2026-04-09)
# ==========================================================================

# tagFMSetupType (bitmask values, NOT sequential)
SETUP_TYPES = {
    1: "Milling",
    2: "Turning",
    4: "Wire",
}

# tagFMToolGroup (bitmask values)
TOOL_GROUPS = {
    1: "TwistDrill",
    2: "SpotDrill",
    4: "TurnOD",
    8: "TurnThread",
    16: "Ream",
    32: "EndMill",
    64: "CounterSink",
    128: "Tap",
    256: "CounterBore",
    512: "BoringBar",
    1024: "ChamferMill",
    2048: "RoundingMill",
    4096: "FaceMill",
    8192: "SideMill",
    16384: "TurnID",
    32768: "TurnGroove",
    65536: "ThreadMill",
    131072: "PlungeRough",
}

# tagFMIndexType
INDEX_TYPES = {
    1: "None",
    2: "4thAxisX",
    3: "4thAxisY",
    4: "4thAxisZ",
    5: "5thAxis",
}

# tagFMSetupSpindleType
SPINDLE_TYPES = {
    0: "Main",
    1: "SubSpindle",
}

# ==========================================================================
# COM CONNECTION — Cached, with liveness check and IFMDocument CastTo
# ==========================================================================

_app = None
_doc = None


def get_featurecam():
    """Get cached connection to FeatureCAM, returning IFMDocument interface.

    Uses EnsureDispatch for early binding, then CastTo IFMDocument to access
    the full API (Setups, Solids, Stock, UCSs). The default IMFGDocument
    interface lacks these collections.
    """
    global _app, _doc
    pythoncom.CoInitialize()

    # Check if cached connection is still alive
    if _app is not None:
        try:
            _ = _app.Name  # cheap liveness check
            doc = _app.ActiveDocument
            if doc is not None:
                _doc = win32com.client.CastTo(doc, "IFMDocument")
                return _app, _doc
        except pywintypes.com_error:
            _app = None
            _doc = None

    # Fresh connection
    try:
        _app = win32com.client.gencache.EnsureDispatch("FeatureCAM.Application")
    except pywintypes.com_error as e:
        raise ToolError(
            f"Cannot connect to FeatureCAM. Ensure it is running. "
            f"HRESULT: 0x{e.hresult & 0xFFFFFFFF:08X}"
        )

    raw_doc = _app.ActiveDocument
    if raw_doc is None:
        raise ToolError("No active document. Open a FeatureCAM file first.")

    _doc = win32com.client.CastTo(raw_doc, "IFMDocument")
    return _app, _doc


def handle_com_error(e: pywintypes.com_error, context: str) -> ToolError:
    """Convert COM error to ToolError with actionable message."""
    global _app, _doc
    hr = e.hresult
    # RPC_E_DISCONNECTED or RPC_S_SERVER_UNAVAILABLE
    if hr in (-2147417848, -2147023174):
        _app = None
        _doc = None
        return ToolError(
            f"FeatureCAM connection lost during {context}. "
            f"The application may have been closed. Restart FeatureCAM and try again."
        )
    return ToolError(f"COM error during {context}: {e.strerror} (0x{hr & 0xFFFFFFFF:08X})")


def find_setup(doc, setup_name: str):
    """Find a setup by name. Raises ToolError if not found."""
    for i in range(1, doc.Setups.Count + 1):
        setup = doc.Setups.Item(i)
        if setup.Name == setup_name:
            return setup
    names = [doc.Setups.Item(i).Name for i in range(1, doc.Setups.Count + 1)]
    raise ToolError(
        f"Setup '{setup_name}' not found. "
        f"Available setups: {', '.join(names)}"
    )
```

- [ ] **Step 3: Verify connection works**

Run from admin prompt with FeatureCAM open:
```bash
python -c "
import sys; sys.path.insert(0, '.')
from featurecam_mcp_server import get_featurecam
app, doc = get_featurecam()
print(f'Connected: {doc.Name}')
print(f'Setups: {doc.Setups.Count}')
print(f'Operations: {doc.Operations.Count}')
"
```
Expected: prints document name, setup count, operation count without errors.

- [ ] **Step 4: Commit**

```bash
git add featurecam_mcp_server.py requirements.txt
git commit -m "feat: rewrite COM foundation with IFMDocument CastTo and verified constants"
```

---

### Task 2: Document Operation Tools

**Files:**
- Modify: `featurecam_mcp_server.py` (append document tools)

- [ ] **Step 1: Add Pydantic models and document tools**

Append to `featurecam_mcp_server.py`:

```python
# ==========================================================================
# PYDANTIC INPUT MODELS
# ==========================================================================

class SetupTypeFilter(str, Enum):
    ALL = "all"
    MILLING = "milling"
    TURNING = "turning"
    WIRE = "wire"


# ==========================================================================
# DOCUMENT TOOLS
# ==========================================================================

@mcp.tool(
    annotations={
        "title": "Get Document Info",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
def get_document_info() -> str:
    """Get an overview of the active FeatureCAM document.
    Call this first to understand the document structure.
    Returns name, path, units, setup count, operation count, and stock info.
    Use returned setup names with list_features or get_setup_details."""
    try:
        app, doc = get_featurecam()

        setups = []
        for i in range(1, doc.Setups.Count + 1):
            s = doc.Setups.Item(i)
            setups.append({
                "name": s.Name,
                "type": SETUP_TYPES.get(s.Type, f"Unknown({s.Type})"),
                "enabled": s.Enabled,
            })

        info = {
            "document_name": doc.Name,
            "document_path": doc.path,
            "part_name": doc.PartName,
            "units": "Metric" if doc.Metric else "Imperial",
            "setups": setups,
            "operation_count": doc.Operations.Count,
            "toolmap_count": doc.ToolMaps.Count,
        }

        # Stock info
        try:
            stock = doc.Stock
            info["stock"] = {
                "index_type": INDEX_TYPES.get(stock.IndexType, f"Unknown({stock.IndexType})"),
                "single_program": stock.SingleProgram,
                "tool_dominant": stock.ToolDominant,
                "material": stock.Material,
            }
        except pywintypes.com_error:
            info["stock"] = "Not available"

        return json.dumps(info, indent=2)

    except ToolError:
        raise
    except pywintypes.com_error as e:
        raise handle_com_error(e, "get_document_info")


@mcp.tool(
    annotations={
        "title": "Save Document",
        "readOnlyHint": False,
        "destructiveHint": True,
        "idempotentHint": True,
        "openWorldHint": True,
    }
)
def save_document(
    filepath: Optional[str] = Field(
        default=None,
        description="Path to save to. If omitted, saves to current location."
    ),
) -> str:
    """Save the active FeatureCAM document. Can save to a new path with filepath parameter."""
    try:
        app, doc = get_featurecam()
        if filepath:
            doc.SaveAs(filepath)
            return f"Document saved to: {filepath}"
        else:
            doc.Save()
            return f"Document saved to: {doc.path}"
    except ToolError:
        raise
    except pywintypes.com_error as e:
        raise handle_com_error(e, "save_document")


@mcp.tool(
    annotations={
        "title": "Invalidate Toolpaths",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
def invalidate_toolpaths() -> str:
    """Force all toolpaths to recalculate on next NC generation or simulation.
    Call this after making changes to setups, features, or operations."""
    try:
        app, doc = get_featurecam()
        doc.InvalidateToolpaths()
        return "Toolpaths invalidated. They will recalculate on next NC generation."
    except ToolError:
        raise
    except pywintypes.com_error as e:
        raise handle_com_error(e, "invalidate_toolpaths")
```

- [ ] **Step 2: Test document tools against live FeatureCAM**

```bash
npx @modelcontextprotocol/inspector python featurecam_mcp_server.py
```

Call `get_document_info` in the inspector. Expected: returns JSON with document name, setups, operation count.

- [ ] **Step 3: Commit**

```bash
git add featurecam_mcp_server.py
git commit -m "feat: add document info, save, and invalidate tools"
```

---

### Task 3: Setup Tools

**Files:**
- Modify: `featurecam_mcp_server.py` (append setup tools)

- [ ] **Step 1: Add setup tools**

Append to `featurecam_mcp_server.py`:

```python
# ==========================================================================
# SETUP TOOLS
# ==========================================================================

@mcp.tool(
    annotations={
        "title": "List Setups",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
def list_setups(
    setup_type: SetupTypeFilter = Field(
        default=SetupTypeFilter.ALL,
        description="Filter by type: 'all', 'milling', 'turning', or 'wire'"
    ),
    enabled_only: bool = Field(
        default=False,
        description="If true, only returns enabled setups"
    ),
) -> str:
    """List all setups in the document with type, status, feature count, and fixture ID.
    Use returned setup names with get_setup_details, list_features, or get_operations."""
    try:
        app, doc = get_featurecam()
        type_filter_map = {
            SetupTypeFilter.MILLING: 1,
            SetupTypeFilter.TURNING: 2,
            SetupTypeFilter.WIRE: 4,
        }

        setups = []
        active_name = doc.ActiveSetup.Name

        for i in range(1, doc.Setups.Count + 1):
            s = doc.Setups.Item(i)

            if enabled_only and not s.Enabled:
                continue
            if setup_type != SetupTypeFilter.ALL:
                if s.Type != type_filter_map[setup_type]:
                    continue

            setups.append({
                "name": s.Name,
                "type": SETUP_TYPES.get(s.Type, f"Unknown({s.Type})"),
                "enabled": s.Enabled,
                "is_active": s.Name == active_name,
                "feature_count": s.Features.Count,
                "fixture_id": s.FixtureID,
                "spindle": SPINDLE_TYPES.get(s.Spindle, f"Unknown({s.Spindle})"),
            })

        return json.dumps({"setups": setups, "count": len(setups)}, indent=2)

    except ToolError:
        raise
    except pywintypes.com_error as e:
        raise handle_com_error(e, "list_setups")


@mcp.tool(
    annotations={
        "title": "Get Setup Details",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
def get_setup_details(
    setup_name: str = Field(..., description="Name of the setup", min_length=1),
) -> str:
    """Get detailed info about a setup including UCS position, machine sim location,
    cycle time, and feature list. Call list_setups first to get valid setup names."""
    try:
        app, doc = get_featurecam()
        setup = find_setup(doc, setup_name)

        details = {
            "name": setup.Name,
            "type": SETUP_TYPES.get(setup.Type, f"Unknown({setup.Type})"),
            "enabled": setup.Enabled,
            "is_active": doc.ActiveSetup.Name == setup.Name,
            "fixture_id": setup.FixtureID,
            "spindle": SPINDLE_TYPES.get(setup.Spindle, f"Unknown({setup.Spindle})"),
            "feature_count": setup.Features.Count,
            "order": setup.Order,
        }

        # Cycle time
        try:
            details["machine_time_seconds"] = setup.TotalMachineTime
        except pywintypes.com_error:
            pass

        # UCS
        try:
            ucs = setup.ucs
            details["ucs"] = {
                "name": ucs.Name,
                "origin": ucs.GetLocation(),
                "vectors": ucs.GetVectors(),
            }
        except pywintypes.com_error:
            details["ucs"] = "Not available"

        # Machine sim location
        try:
            details["machine_sim_location"] = setup.GetMachineSimLocation()
        except pywintypes.com_error:
            pass

        # Feature names
        features = []
        for i in range(1, setup.Features.Count + 1):
            feat = setup.Features.Item(i)
            features.append(feat.Name)
        details["features"] = features

        return json.dumps(details, indent=2, default=str)

    except ToolError:
        raise
    except pywintypes.com_error as e:
        raise handle_com_error(e, "get_setup_details")


@mcp.tool(
    annotations={
        "title": "Get Active Setup",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
def get_active_setup() -> str:
    """Get the name of the currently active setup."""
    try:
        app, doc = get_featurecam()
        return json.dumps({"active_setup": doc.ActiveSetup.Name})
    except ToolError:
        raise
    except pywintypes.com_error as e:
        raise handle_com_error(e, "get_active_setup")


@mcp.tool(
    annotations={
        "title": "Set Active Setup",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
def set_active_setup(
    setup_name: str = Field(..., description="Name of setup to activate", min_length=1),
) -> str:
    """Change the active setup. Call list_setups first to see available names."""
    try:
        app, doc = get_featurecam()
        setup = find_setup(doc, setup_name)
        setup.Activate()
        return f"Active setup changed to: {setup_name}"
    except ToolError:
        raise
    except pywintypes.com_error as e:
        raise handle_com_error(e, "set_active_setup")


@mcp.tool(
    annotations={
        "title": "Enable or Disable Setup",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
def enable_setup(
    setup_name: str = Field(..., description="Name of the setup", min_length=1),
    enabled: bool = Field(..., description="True to enable, False to disable"),
) -> str:
    """Enable or disable a setup. Disabled setups are skipped during NC generation."""
    try:
        app, doc = get_featurecam()
        setup = find_setup(doc, setup_name)
        setup.Enabled = enabled
        status = "enabled" if enabled else "disabled"
        return f"Setup '{setup_name}' {status}."
    except ToolError:
        raise
    except pywintypes.com_error as e:
        raise handle_com_error(e, "enable_setup")
```

- [ ] **Step 2: Test setup tools**

In MCP Inspector, call `list_setups`. Expected: returns Setup1 with type=Milling, enabled=True, feature_count=63.

Call `get_setup_details` with `setup_name="Setup1"`. Expected: returns UCS position, fixture_id="54", machine_sim_location.

- [ ] **Step 3: Commit**

```bash
git add featurecam_mcp_server.py
git commit -m "feat: add setup management tools"
```

---

### Task 4: Tool Library Tools

**Files:**
- Modify: `featurecam_mcp_server.py` (append tool tools)

- [ ] **Step 1: Add tool library tools using ToolMaps**

Append to `featurecam_mcp_server.py`:

```python
# ==========================================================================
# TOOL LIBRARY TOOLS
# ==========================================================================

@mcp.tool(
    annotations={
        "title": "List Tools",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
def list_tools(
    setup_name: Optional[str] = Field(
        default=None,
        description="Filter by setup name. If omitted, returns all tools."
    ),
) -> str:
    """List all tools in the document with tool number, type, and offset registers.
    Uses ToolMaps for complete tool data including offset registers.
    Use tool names with get_tool_details for geometry info."""
    try:
        app, doc = get_featurecam()

        # If filtering by setup, get operation names for that setup first
        setup_op_names = None
        if setup_name:
            setup = find_setup(doc, setup_name)
            setup_op_names = set()
            for i in range(1, doc.Operations.Count + 1):
                op = doc.Operations.Item(i)
                try:
                    if op.FeatureName and any(
                        setup.Features.Item(j).Name == op.FeatureName
                        for j in range(1, setup.Features.Count + 1)
                    ):
                        tool = op.Tool
                        if tool:
                            setup_op_names.add(tool.Name)
                except pywintypes.com_error:
                    continue

        tools = []
        for i in range(1, doc.ToolMaps.Count + 1):
            tm = doc.ToolMaps.Item(i)
            try:
                tool = tm.Tool
                tool_name = tool.Name
            except pywintypes.com_error:
                continue

            if setup_op_names is not None and tool_name not in setup_op_names:
                continue

            tools.append({
                "name": tool_name,
                "tool_number": tm.ToolNumber,
                "tool_id": tm.ToolID,
                "group": TOOL_GROUPS.get(tool.ToolGroup, f"Unknown({tool.ToolGroup})"),
                "exposed_length": tool.ExposedLength,
                "metric": tool.Metric,
                "holder": tool.Holder or tool.DefaultHolder,
                "diameter_offset": tm.DiameterOffsetRegister,
                "length_offset": tm.LengthOffsetRegister,
            })

        return json.dumps({"tools": tools, "count": len(tools)}, indent=2)

    except ToolError:
        raise
    except pywintypes.com_error as e:
        raise handle_com_error(e, "list_tools")


@mcp.tool(
    annotations={
        "title": "Get Tool Details",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
def get_tool_details(
    tool_name: str = Field(..., description="Name of the tool", min_length=1),
) -> str:
    """Get detailed information about a specific tool including all available
    geometry properties. Call list_tools first to see available tool names."""
    try:
        app, doc = get_featurecam()

        # Find tool via ToolMaps
        target_tool = None
        target_tm = None
        for i in range(1, doc.ToolMaps.Count + 1):
            tm = doc.ToolMaps.Item(i)
            try:
                if tm.Tool.Name == tool_name:
                    target_tool = tm.Tool
                    target_tm = tm
                    break
            except pywintypes.com_error:
                continue

        if target_tool is None:
            names = []
            for i in range(1, doc.ToolMaps.Count + 1):
                try:
                    names.append(doc.ToolMaps.Item(i).Tool.Name)
                except:
                    pass
            raise ToolError(
                f"Tool '{tool_name}' not found. Available: {', '.join(names)}"
            )

        details = {
            "name": tool_name,
            "group": TOOL_GROUPS.get(target_tool.ToolGroup, f"Unknown({target_tool.ToolGroup})"),
            "tool_number": target_tm.ToolNumber,
            "tool_id": target_tm.ToolID,
            "metric": target_tool.Metric,
            "exposed_length": target_tool.ExposedLength,
            "holder": target_tool.Holder or target_tool.DefaultHolder,
            "material": target_tool.Material,
            "diameter_offset": target_tm.DiameterOffsetRegister,
            "length_offset": target_tm.LengthOffsetRegister,
        }

        # Try all possible geometry properties — availability depends on tool type
        for prop in ["Diameter", "OverallLength", "CutterLength", "ShankDiameter",
                      "CornerRadius", "EndRadius", "TipRadius", "Height", "Taper",
                      "NumberOfFlutes", "SpotTipAngle", "angle",
                      "BodyDiameter", "Length", "ArborDiameter", "CutterWidth",
                      "InsertTipRadius", "InsertLength"]:
            try:
                val = getattr(target_tool, prop)
                if val is not None:
                    details[prop] = val
            except (AttributeError, pywintypes.com_error):
                pass

        return json.dumps(details, indent=2)

    except ToolError:
        raise
    except pywintypes.com_error as e:
        raise handle_com_error(e, "get_tool_details")
```

- [ ] **Step 2: Test tool tools**

In MCP Inspector, call `list_tools`. Expected: returns 13 tools with tool numbers, groups (FaceMill, SpotDrill, TwistDrill, EndMill), offset registers.

Call `get_tool_details` with `tool_name="APKT Face Mill"`. Expected: returns group=FaceMill, exposed_length, holder info.

- [ ] **Step 3: Commit**

```bash
git add featurecam_mcp_server.py
git commit -m "feat: add tool library tools via ToolMaps"
```

---

### Task 5: Operation and Feature Tools

**Files:**
- Modify: `featurecam_mcp_server.py` (append operation/feature tools)

- [ ] **Step 1: Add operation and feature tools**

Append to `featurecam_mcp_server.py`:

```python
# ==========================================================================
# OPERATION & FEATURE TOOLS
# ==========================================================================

@mcp.tool(
    annotations={
        "title": "List Features in Setup",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
def list_features(
    setup_name: str = Field(..., description="Name of the setup", min_length=1),
) -> str:
    """List all features in a setup with name, type, and visibility.
    Use setup names from list_setups. Feature names can be used to filter get_operations."""
    try:
        app, doc = get_featurecam()
        setup = find_setup(doc, setup_name)

        features = []
        for i in range(1, setup.Features.Count + 1):
            feat = setup.Features.Item(i)
            features.append({
                "name": feat.Name,
                "model_type": feat.ModelType,
                "visible": feat.Visible,
                "layer": feat.Layer,
            })

        return json.dumps({
            "setup": setup_name,
            "features": features,
            "count": len(features),
        }, indent=2)

    except ToolError:
        raise
    except pywintypes.com_error as e:
        raise handle_com_error(e, "list_features")


@mcp.tool(
    annotations={
        "title": "Get Operations",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
def get_operations(
    setup_name: Optional[str] = Field(
        default=None,
        description="Filter by setup name. If omitted, returns all operations."
    ),
    feature_name: Optional[str] = Field(
        default=None,
        description="Filter by feature name. If omitted, returns all."
    ),
) -> str:
    """Get operations with tool, feed, speed, depth, errors, and machine time.
    Each operation links to its feature via feature_name. Use list_features to
    get valid feature names, or list_setups for setup names."""
    try:
        app, doc = get_featurecam()

        # Build set of feature names for setup filter
        setup_feature_names = None
        if setup_name:
            setup = find_setup(doc, setup_name)
            setup_feature_names = set()
            for i in range(1, setup.Features.Count + 1):
                setup_feature_names.add(setup.Features.Item(i).Name)

        operations = []
        for i in range(1, doc.Operations.Count + 1):
            op = doc.Operations.Item(i)
            op_feature = op.FeatureName

            # Apply filters
            if setup_feature_names is not None and op_feature not in setup_feature_names:
                continue
            if feature_name is not None and op_feature != feature_name:
                continue

            op_info = {
                "name": op.Name,
                "feature": op_feature,
                "errors": op.Errors,
                "has_errors": bool(op.Errors and op.Errors.strip()),
                "fixture_id": op.FixtureID,
            }

            # Tool
            try:
                tool = op.Tool
                if tool:
                    op_info["tool"] = tool.Name
            except pywintypes.com_error:
                pass

            # Feed, speed, depth, time
            for prop in ["Feed", "FeedText", "Speed", "SpeedText",
                         "Depth", "DepthText", "MachTimeSeconds", "MachTimeString"]:
                try:
                    val = getattr(op, prop)
                    if val is not None:
                        op_info[prop.lower()] = val
                except (AttributeError, pywintypes.com_error):
                    pass

            # Warnings
            try:
                w = op.Warnings
                if w and w.strip():
                    op_info["warnings"] = w
            except (AttributeError, pywintypes.com_error):
                pass

            operations.append(op_info)

        return json.dumps({
            "setup": setup_name,
            "feature": feature_name,
            "operations": operations,
            "count": len(operations),
        }, indent=2, default=str)

    except ToolError:
        raise
    except pywintypes.com_error as e:
        raise handle_com_error(e, "get_operations")


@mcp.tool(
    annotations={
        "title": "Check Operation Errors",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
def check_operation_errors(
    setup_name: Optional[str] = Field(
        default=None,
        description="Specific setup to check. If omitted, checks all."
    ),
) -> str:
    """Check all operations for errors. Call before generating NC code.
    Returns only operations with errors, plus a summary count."""
    try:
        app, doc = get_featurecam()

        setup_feature_names = None
        if setup_name:
            setup = find_setup(doc, setup_name)
            setup_feature_names = set()
            for i in range(1, setup.Features.Count + 1):
                setup_feature_names.add(setup.Features.Item(i).Name)

        errors = []
        total_checked = 0

        for i in range(1, doc.Operations.Count + 1):
            op = doc.Operations.Item(i)

            if setup_feature_names is not None and op.FeatureName not in setup_feature_names:
                continue

            total_checked += 1
            err = op.Errors
            if err and err.strip():
                error_info = {
                    "operation": op.Name,
                    "feature": op.FeatureName,
                    "error": err,
                }
                try:
                    tool = op.Tool
                    if tool:
                        error_info["tool"] = tool.Name
                except pywintypes.com_error:
                    pass
                errors.append(error_info)

        return json.dumps({
            "has_errors": len(errors) > 0,
            "error_count": len(errors),
            "operations_checked": total_checked,
            "errors": errors,
        }, indent=2)

    except ToolError:
        raise
    except pywintypes.com_error as e:
        raise handle_com_error(e, "check_operation_errors")
```

- [ ] **Step 2: Test operation/feature tools**

Call `list_features` with `setup_name="Setup1"`. Expected: 63 features starting with face1, hole1, hole2...

Call `get_operations` with `setup_name="Setup1"`. Expected: operations with feature names, tools, feed/speed.

Call `check_operation_errors`. Expected: returns error_count and checked count.

- [ ] **Step 3: Commit**

```bash
git add featurecam_mcp_server.py
git commit -m "feat: add operation and feature tools with verified API"
```

---

### Task 6: Stock, UCS, and Work Offset Tools

**Files:**
- Modify: `featurecam_mcp_server.py` (append stock/UCS/offset tools)

- [ ] **Step 1: Add stock, UCS, and work offset tools**

Append to `featurecam_mcp_server.py`:

```python
# ==========================================================================
# STOCK TOOLS
# ==========================================================================

@mcp.tool(
    annotations={
        "title": "Get Stock Info",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
def get_stock_info() -> str:
    """Get stock configuration including material, dimensions, index type,
    and program settings."""
    try:
        app, doc = get_featurecam()
        stock = doc.Stock

        info = {
            "name": stock.Name,
            "material": stock.Material,
            "index_type": INDEX_TYPES.get(stock.IndexType, f"Unknown({stock.IndexType})"),
            "single_program": stock.SingleProgram,
            "single_program_with_stop": stock.SingleProgramWithProgramStop,
            "tool_dominant": stock.ToolDominant,
        }

        try:
            info["dimensions"] = stock.GetDimensions()
        except pywintypes.com_error:
            pass

        try:
            info["location"] = stock.GetLocation()
        except pywintypes.com_error:
            pass

        return json.dumps(info, indent=2, default=str)

    except ToolError:
        raise
    except pywintypes.com_error as e:
        raise handle_com_error(e, "get_stock_info")


@mcp.tool(
    annotations={
        "title": "Export Stock to STL",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": True,
    }
)
def export_stock(
    output_path: str = Field(
        ..., description="Full file path for the output STL file", min_length=1
    ),
) -> str:
    """Export stock geometry to STL file for use in simulation or verification."""
    try:
        app, doc = get_featurecam()
        stock = doc.Stock

        # Ensure parent directory exists
        parent = os.path.dirname(os.path.abspath(output_path))
        os.makedirs(parent, exist_ok=True)

        result = stock.ExportToSTL(output_path)
        return f"Stock exported to: {output_path}"

    except ToolError:
        raise
    except pywintypes.com_error as e:
        raise handle_com_error(e, "export_stock")


# ==========================================================================
# UCS TOOLS
# ==========================================================================

@mcp.tool(
    annotations={
        "title": "List UCS",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
def list_ucs() -> str:
    """List all User Coordinate Systems with origin position and orientation."""
    try:
        app, doc = get_featurecam()
        ucs_list = []

        for i in range(1, doc.UCSs.Count + 1):
            ucs = doc.UCSs.Item(i)
            entry = {"name": ucs.Name}
            try:
                entry["origin"] = ucs.GetLocation()
            except pywintypes.com_error:
                pass
            try:
                entry["vectors"] = ucs.GetVectors()
            except pywintypes.com_error:
                pass
            ucs_list.append(entry)

        return json.dumps({"ucs_list": ucs_list, "count": len(ucs_list)}, indent=2, default=str)

    except ToolError:
        raise
    except pywintypes.com_error as e:
        raise handle_com_error(e, "list_ucs")


@mcp.tool(
    annotations={
        "title": "Get UCS Details",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
def get_ucs_details(
    ucs_name: str = Field(..., description="Name of the UCS", min_length=1),
) -> str:
    """Get detailed UCS information including origin position (x,y,z) and
    orientation vectors (3x3 matrix). Call list_ucs to see available names."""
    try:
        app, doc = get_featurecam()

        target = None
        for i in range(1, doc.UCSs.Count + 1):
            ucs = doc.UCSs.Item(i)
            if ucs.Name == ucs_name:
                target = ucs
                break

        if target is None:
            names = [doc.UCSs.Item(i).Name for i in range(1, doc.UCSs.Count + 1)]
            raise ToolError(f"UCS '{ucs_name}' not found. Available: {', '.join(names)}")

        details = {"name": ucs_name}
        loc = target.GetLocation()
        details["origin"] = {"x": loc[0], "y": loc[1], "z": loc[2]}

        vecs = target.GetVectors()
        details["orientation"] = {
            "x_axis": {"x": vecs[0], "y": vecs[1], "z": vecs[2]},
            "y_axis": {"x": vecs[3], "y": vecs[4], "z": vecs[5]},
            "z_axis": {"x": vecs[6], "y": vecs[7], "z": vecs[8]},
        }

        return json.dumps(details, indent=2)

    except ToolError:
        raise
    except pywintypes.com_error as e:
        raise handle_com_error(e, "get_ucs_details")


# ==========================================================================
# WORK OFFSET TOOLS
# ==========================================================================

@mcp.tool(
    annotations={
        "title": "Get Work Offsets",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
def get_work_offsets(
    setup_name: Optional[str] = Field(
        default=None,
        description="Specific setup. If omitted, returns offsets for all setups."
    ),
) -> str:
    """Get work offset data for setups: fixture ID (G54/G55/etc), UCS origin,
    and machine simulation location."""
    try:
        app, doc = get_featurecam()

        offsets = []
        for i in range(1, doc.Setups.Count + 1):
            s = doc.Setups.Item(i)
            if setup_name and s.Name != setup_name:
                continue

            entry = {
                "setup": s.Name,
                "fixture_id": s.FixtureID,
                "fixture_code": f"G{s.FixtureID}" if s.FixtureID.isdigit() else s.FixtureID,
            }

            try:
                ucs = s.ucs
                loc = ucs.GetLocation()
                entry["ucs_origin"] = {"x": loc[0], "y": loc[1], "z": loc[2]}
            except pywintypes.com_error:
                pass

            try:
                msl = s.GetMachineSimLocation()
                entry["machine_sim_location"] = {"x": msl[0], "y": msl[1], "z": msl[2]}
            except pywintypes.com_error:
                pass

            offsets.append(entry)

        if setup_name and not offsets:
            find_setup(doc, setup_name)  # raises ToolError with available names

        return json.dumps({"offsets": offsets, "count": len(offsets)}, indent=2)

    except ToolError:
        raise
    except pywintypes.com_error as e:
        raise handle_com_error(e, "get_work_offsets")
```

- [ ] **Step 2: Test stock/UCS/offset tools**

Call `get_stock_info`. Expected: material, index_type, dimensions.

Call `list_ucs`. Expected: 3 UCSs (STOCK, UCS1, UCS_Setup1) with origins.

Call `get_ucs_details` with `ucs_name="UCS_Setup1"`. Expected: origin (0,0,0), identity orientation.

Call `get_work_offsets`. Expected: Setup1 with fixture_id="54", G54, UCS origin, machine sim location (0,0,-5).

- [ ] **Step 3: Commit**

```bash
git add featurecam_mcp_server.py
git commit -m "feat: add stock, UCS, and work offset tools"
```

---

### Task 7: Solid and STL Export Tools

**Files:**
- Modify: `featurecam_mcp_server.py` (append solid tools)

- [ ] **Step 1: Add solid tools**

Append to `featurecam_mcp_server.py`:

```python
# ==========================================================================
# SOLID TOOLS
# ==========================================================================

@mcp.tool(
    annotations={
        "title": "List Solids",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
def list_solids() -> str:
    """List all solid geometry in the document with name, type, and visibility."""
    try:
        app, doc = get_featurecam()
        solids = []

        for i in range(1, doc.Solids.Count + 1):
            solid = doc.Solids.Item(i)
            solids.append({
                "name": solid.Name,
                "model_type": solid.ModelType,
                "visible": solid.Visible,
                "layer": solid.Layer,
            })

        return json.dumps({"solids": solids, "count": len(solids)}, indent=2)

    except ToolError:
        raise
    except pywintypes.com_error as e:
        raise handle_com_error(e, "list_solids")


@mcp.tool(
    annotations={
        "title": "Save Document as STL",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": True,
    }
)
def save_stl(
    output_path: str = Field(
        ..., description="Full file path for the output STL file", min_length=1
    ),
) -> str:
    """Export document geometry to STL file. Uses doc.SaveSTL which exports
    the full model geometry for simulation or verification."""
    try:
        app, doc = get_featurecam()

        parent = os.path.dirname(os.path.abspath(output_path))
        os.makedirs(parent, exist_ok=True)

        doc.SaveSTL(output_path)
        return f"STL saved to: {output_path}"

    except ToolError:
        raise
    except pywintypes.com_error as e:
        raise handle_com_error(e, "save_stl")
```

- [ ] **Step 2: Test solid tools**

Call `list_solids`. Expected: body1 with model_type and visibility.

- [ ] **Step 3: Commit**

```bash
git add featurecam_mcp_server.py
git commit -m "feat: add solid listing and STL export tools"
```

---

### Task 8: NC Code Generation

**Files:**
- Modify: `featurecam_mcp_server.py` (append NC tools)

- [ ] **Step 1: Add NC generation and simulation tools**

Append to `featurecam_mcp_server.py`:

```python
# ==========================================================================
# NC GENERATION TOOLS
# ==========================================================================

@mcp.tool(
    annotations={
        "title": "Simulate Toolpaths",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": False,
    }
)
def simulate_toolpath() -> str:
    """Calculate/simulate toolpaths for the document. Must be called before
    generating NC code if toolpaths are invalid. Check toolpaths_valid first."""
    try:
        app, doc = get_featurecam()
        doc.SimToolpath(False)  # False = not active setup only
        return "Toolpath simulation complete."
    except ToolError:
        raise
    except pywintypes.com_error as e:
        raise handle_com_error(e, "simulate_toolpath")


@mcp.tool(
    annotations={
        "title": "Check Toolpaths Valid",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
def toolpaths_valid() -> str:
    """Check whether current toolpaths are valid or need recalculation.
    Call simulate_toolpath if they are invalid, before generating NC code."""
    try:
        app, doc = get_featurecam()
        valid = doc.ToolpathsAreValid
        return json.dumps({"toolpaths_valid": valid})
    except ToolError:
        raise
    except pywintypes.com_error as e:
        raise handle_com_error(e, "toolpaths_valid")


@mcp.tool(
    annotations={
        "title": "Generate NC Code",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": True,
    }
)
def generate_nc_code(
    output_directory: Optional[str] = Field(
        default=None,
        description="Directory to save NC files. If omitted, uses document directory."
    ),
    active_setup_only: bool = Field(
        default=False,
        description="If true, generates NC for active setup only."
    ),
) -> str:
    """Generate NC code files. Checks for errors first, then calls SaveNC.
    Call check_operation_errors first to see any issues. If toolpaths are
    invalid, call simulate_toolpath before this."""
    try:
        app, doc = get_featurecam()

        # Check for errors first
        error_ops = []
        for i in range(1, doc.Operations.Count + 1):
            op = doc.Operations.Item(i)
            err = op.Errors
            if err and err.strip():
                error_ops.append(f"{op.Name}: {err}")

        if error_ops:
            raise ToolError(
                f"Cannot generate NC code. {len(error_ops)} operation(s) have errors:\n"
                + "\n".join(error_ops)
                + "\nFix errors in FeatureCAM, then try again."
            )

        # Determine output directory
        if output_directory:
            out_dir = output_directory
        else:
            out_dir = os.path.dirname(doc.path) if doc.path else None
            if not out_dir:
                raise ToolError(
                    "Document has not been saved. Specify output_directory or save the document first."
                )

        os.makedirs(out_dir, exist_ok=True)

        filename = doc.PartName or doc.NameWithoutExtension or "output"

        # SaveNC signature: (filename, directory, activeSetupOnly, fileType, ?, out err, out ncNum, out ncNames, out docNum, out docNames, out macroNum, out macroNames)
        result = doc.SaveNC(
            filename,       # base filename
            out_dir,        # output directory
            active_setup_only,  # active setup only
            8,              # eNCFT_NCCode = 8
            False,          # unknown bool, always False in examples
        )

        # SaveNC returns a tuple with error message and file info
        # Parse what we can from the result
        return json.dumps({
            "success": True,
            "output_directory": out_dir,
            "filename": filename,
            "active_setup_only": active_setup_only,
            "result": str(result) if result else "NC code generated",
        }, indent=2)

    except ToolError:
        raise
    except pywintypes.com_error as e:
        raise handle_com_error(e, "generate_nc_code")
```

- [ ] **Step 2: Test NC tools**

Call `toolpaths_valid`. Expected: returns true/false.

Call `check_operation_errors`. If no errors, call `generate_nc_code`. Expected: generates NC files to document directory.

**Note:** `SaveNC` parameter handling may need adjustment based on what FeatureCAM returns. The out-params in C# map differently in Python COM — test and adjust the call signature.

- [ ] **Step 3: Commit**

```bash
git add featurecam_mcp_server.py
git commit -m "feat: add NC generation, simulation, and validation tools"
```

---

### Task 9: Server Entry Point + Final Assembly

**Files:**
- Modify: `featurecam_mcp_server.py` (add entry point at end)

- [ ] **Step 1: Add server entry point**

Append to end of `featurecam_mcp_server.py`:

```python
# ==========================================================================
# SERVER ENTRY POINT
# ==========================================================================

if __name__ == "__main__":
    mcp.run()
```

- [ ] **Step 2: Run full server test**

```bash
npx @modelcontextprotocol/inspector python featurecam_mcp_server.py
```

In the inspector, run through this workflow:
1. `get_document_info` — verify document loads
2. `list_setups` — verify setups with correct types
3. `get_setup_details` with Setup1 — verify UCS, fixture, features
4. `list_tools` — verify tool groups resolve correctly
5. `list_features` with Setup1 — verify feature listing
6. `get_operations` with Setup1 — verify operations with feed/speed
7. `check_operation_errors` — verify error check
8. `get_stock_info` — verify stock data
9. `list_ucs` — verify UCS with real positions
10. `get_work_offsets` — verify fixture IDs and positions
11. `list_solids` — verify solid listing
12. `toolpaths_valid` — verify toolpath status

- [ ] **Step 3: Commit**

```bash
git add featurecam_mcp_server.py
git commit -m "feat: complete FeatureCAM MCP server rewrite"
```

---

### Task 10: Integration Test Script

**Files:**
- Create: `tests/test_live.py`

- [ ] **Step 1: Write integration test**

```python
"""Integration test — run with FeatureCAM open and a document loaded.
Usage: python tests/test_live.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from featurecam_mcp_server import get_featurecam, SETUP_TYPES, TOOL_GROUPS

def test_connection():
    app, doc = get_featurecam()
    assert doc.Name, "Document has no name"
    assert doc.Operations.Count > 0, "No operations"
    print(f"  PASS: Connected to {doc.Name}, {doc.Operations.Count} operations")

def test_setups():
    app, doc = get_featurecam()
    count = doc.Setups.Count
    assert count > 0, "No setups"
    for i in range(1, count + 1):
        s = doc.Setups.Item(i)
        assert s.Name, f"Setup {i} has no name"
        assert s.Type in SETUP_TYPES, f"Setup type {s.Type} not in SETUP_TYPES"
    print(f"  PASS: {count} setup(s), all types valid")

def test_tools():
    app, doc = get_featurecam()
    count = doc.ToolMaps.Count
    assert count > 0, "No tool maps"
    for i in range(1, count + 1):
        tm = doc.ToolMaps.Item(i)
        tool = tm.Tool
        assert tool.Name, f"ToolMap {i} tool has no name"
        assert tool.ToolGroup in TOOL_GROUPS, f"Tool group {tool.ToolGroup} not in TOOL_GROUPS"
    print(f"  PASS: {count} tool(s), all groups valid")

def test_operations():
    app, doc = get_featurecam()
    count = doc.Operations.Count
    assert count > 0, "No operations"
    op = doc.Operations.Item(1)
    assert op.Name, "First operation has no name"
    assert op.FeatureName, "First operation has no feature name"
    print(f"  PASS: {count} operations, first: {op.Name} -> {op.FeatureName}")

def test_ucs():
    app, doc = get_featurecam()
    count = doc.UCSs.Count
    assert count > 0, "No UCSs"
    ucs = doc.UCSs.Item(1)
    loc = ucs.GetLocation()
    assert len(loc) == 3, "GetLocation should return 3 values"
    vecs = ucs.GetVectors()
    assert len(vecs) == 9, "GetVectors should return 9 values"
    print(f"  PASS: {count} UCS(s), first origin: {loc}")

def test_stock():
    app, doc = get_featurecam()
    stock = doc.Stock
    assert stock.Name, "Stock has no name"
    assert stock.Material is not None, "Stock has no material"
    print(f"  PASS: Stock material={stock.Material}")

def test_work_offsets():
    app, doc = get_featurecam()
    setup = doc.Setups.Item(1)
    fid = setup.FixtureID
    assert fid, "No fixture ID"
    loc = setup.GetMachineSimLocation()
    assert len(loc) == 3, "GetMachineSimLocation should return 3 values"
    print(f"  PASS: FixtureID={fid}, MachineSimLoc={loc}")


if __name__ == "__main__":
    tests = [
        test_connection, test_setups, test_tools,
        test_operations, test_ucs, test_stock, test_work_offsets,
    ]
    passed = 0
    failed = 0
    for test in tests:
        name = test.__name__
        try:
            test()
            passed += 1
        except Exception as e:
            print(f"  FAIL: {name}: {e}")
            failed += 1

    print(f"\n{passed} passed, {failed} failed out of {len(tests)} tests")
    sys.exit(1 if failed else 0)
```

- [ ] **Step 2: Run integration tests**

```bash
python tests/test_live.py
```

Expected: all 7 tests pass.

- [ ] **Step 3: Commit**

```bash
git add tests/test_live.py
git commit -m "feat: add integration test suite for live FeatureCAM"
```

---

## Verification Checklist

Before declaring the rewrite complete:

- [ ] All tools load in MCP Inspector without errors
- [ ] `get_document_info` returns real data from FeatureCAM
- [ ] `list_setups` shows correct type (Milling=1, not 0)
- [ ] `list_tools` shows correct groups (EndMill=32, FaceMill=4096, etc.)
- [ ] `get_operations` returns feed, speed, depth, machine time
- [ ] `get_ucs_details` returns real origin and orientation vectors
- [ ] `get_work_offsets` returns fixture ID and positions
- [ ] `get_stock_info` returns material and dimensions
- [ ] `export_stock` creates an actual STL file on disk
- [ ] `generate_nc_code` creates actual NC file(s) on disk
- [ ] Error cases return `isError: true` (not success strings)
- [ ] Integration test suite passes
