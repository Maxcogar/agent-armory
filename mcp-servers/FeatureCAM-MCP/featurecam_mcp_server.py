"""
FeatureCAM MCP Server

Connects Claude to Autodesk FeatureCAM via COM automation.
Uses the IFMDocument interface (obtained via CastTo) to access the full API.
Verified against FeatureCAM 7.27 on 2026-04-09.

Requirements:
- Windows OS
- FeatureCAM installed and running with a document open
- Python packages: mcp, pydantic, pywin32
"""

import json
import os
from typing import Optional, Annotated
from enum import Enum

from mcp.server.fastmcp import FastMCP
from mcp.server.fastmcp.exceptions import ToolError
from pydantic import Field

import win32com.client
import pythoncom
import pywintypes

mcp = FastMCP("featurecam")

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

# tagFMSaveNCFileType
NC_FILE_TYPE_NCCODE = 8


class SetupTypeFilter(str, Enum):
    ALL = "all"
    MILLING = "milling"
    TURNING = "turning"
    WIRE = "wire"


# ==========================================================================
# COM CONNECTION — Cached, with liveness check and IFMDocument CastTo
# ==========================================================================

_app = None


def get_featurecam():
    """Get cached connection to FeatureCAM, returning (app, IFMDocument).

    Uses EnsureDispatch for early binding, then CastTo IFMDocument to access
    the full API (Setups, Solids, Stock, UCSs). The default IMFGDocument
    interface lacks these collections.
    """
    global _app
    pythoncom.CoInitialize()

    # Check if cached app connection is still alive
    if _app is not None:
        try:
            _ = _app.Name  # cheap liveness check
        except pywintypes.com_error:
            _app = None

    if _app is None:
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

    doc = win32com.client.CastTo(raw_doc, "IFMDocument")
    return _app, doc


def handle_com_error(e: pywintypes.com_error, context: str) -> ToolError:
    """Convert COM error to ToolError with actionable message.

    Invalidates the cached connection on disconnection errors so the next
    call will reconnect.
    """
    global _app
    hr = e.hresult
    # RPC_E_DISCONNECTED or RPC_S_SERVER_UNAVAILABLE
    if hr in (-2147417848, -2147023174):
        _app = None
        return ToolError(
            f"FeatureCAM connection lost during {context}. "
            f"The application may have been closed. Restart FeatureCAM and try again."
        )
    return ToolError(
        f"COM error during {context}: {e.strerror} (HRESULT: 0x{hr & 0xFFFFFFFF:08X})"
    )


def _holder_name(tool) -> str:
    """Get the effective holder name for a tool.

    tool.Holder is a string (may be empty). tool.DefaultHolder is an
    IFMToolHolder COM object with a .Name property.
    """
    holder_str = tool.Holder
    if holder_str:
        return holder_str
    try:
        return tool.DefaultHolder.Name
    except (AttributeError, pywintypes.com_error):
        return ""


def _as_name(obj) -> str:
    """Convert a COM object-or-string to a string. Returns the .Name property
    if obj is a COM object, or the string itself if already a string."""
    if obj is None:
        return ""
    if isinstance(obj, str):
        return obj
    try:
        return obj.Name
    except (AttributeError, pywintypes.com_error):
        return str(obj)


def find_setup(doc, setup_name: str):
    """Find a setup by name. Raises ToolError with available names if not found."""
    for i in range(1, doc.Setups.Count + 1):
        setup = doc.Setups.Item(i)
        if setup.Name == setup_name:
            return setup
    names = [doc.Setups.Item(i).Name for i in range(1, doc.Setups.Count + 1)]
    raise ToolError(
        f"Setup '{setup_name}' not found. "
        f"Available setups: {', '.join(names) if names else '(none)'}"
    )


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
    Returns name, path, units, setups, operation count, and stock info.
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
            "ucs_count": doc.UCSs.Count,
        }

        # Stock info
        try:
            stock = doc.Stock
            info["stock"] = {
                "name": stock.Name,
                "material": stock.Material,
                "index_type": INDEX_TYPES.get(stock.IndexType, f"Unknown({stock.IndexType})"),
                "single_program": stock.SingleProgram,
                "tool_dominant": stock.ToolDominant,
            }
        except pywintypes.com_error:
            info["stock"] = "Not available"

        return json.dumps(info, indent=2, default=str)

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
    filepath: Annotated[
        Optional[str],
        Field(description="Path to save to. If omitted, saves to current location."),
    ] = None,
) -> str:
    """Save the active FeatureCAM document. Can save to a new path via filepath.
    Marked destructive because SaveAs can overwrite files."""
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
    setup_type: Annotated[
        SetupTypeFilter,
        Field(description="Filter by type: 'all', 'milling', 'turning', or 'wire'"),
    ] = SetupTypeFilter.ALL,
    enabled_only: Annotated[
        bool,
        Field(description="If true, only return enabled setups"),
    ] = False,
) -> str:
    """List all setups in the document with type, status, feature count, and fixture ID.
    Use returned setup names with get_setup_details, list_features, or get_operations.
    The is_active flag shows which setup is currently active."""
    try:
        app, doc = get_featurecam()
        type_filter_map = {
            SetupTypeFilter.MILLING: 1,
            SetupTypeFilter.TURNING: 2,
            SetupTypeFilter.WIRE: 4,
        }

        active_name = None
        try:
            active_name = doc.ActiveSetup.Name
        except pywintypes.com_error:
            pass

        setups = []
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
    setup_name: Annotated[
        str,
        Field(description="Name of the setup", min_length=1),
    ],
) -> str:
    """Get detailed info about a setup including UCS position, machine sim location,
    cycle time, and feature list. Call list_setups first to get valid setup names."""
    try:
        app, doc = get_featurecam()
        setup = find_setup(doc, setup_name)

        active_name = None
        try:
            active_name = doc.ActiveSetup.Name
        except pywintypes.com_error:
            pass

        details = {
            "name": setup.Name,
            "type": SETUP_TYPES.get(setup.Type, f"Unknown({setup.Type})"),
            "enabled": setup.Enabled,
            "is_active": active_name == setup.Name,
            "fixture_id": setup.FixtureID,
            "spindle": SPINDLE_TYPES.get(setup.Spindle, f"Unknown({setup.Spindle})"),
            "feature_count": setup.Features.Count,
        }

        try:
            details["order"] = setup.Order
        except pywintypes.com_error:
            pass

        # Cycle time — TotalMachineTime returns (hours, minutes, seconds, tenth_second) out params
        try:
            t = setup.TotalMachineTime()
            if t and len(t) >= 4:
                hours, minutes, seconds, tenths = t[0], t[1], t[2], t[3]
                total_seconds = hours * 3600 + minutes * 60 + seconds + tenths / 10
                details["machine_time"] = {
                    "hours": hours,
                    "minutes": minutes,
                    "seconds": seconds,
                    "total_seconds": total_seconds,
                    "formatted": f"{hours:02d}:{minutes:02d}:{seconds:02d}",
                }
        except (pywintypes.com_error, TypeError, IndexError):
            pass

        # UCS
        try:
            ucs = setup.ucs
            details["ucs"] = {
                "name": ucs.Name,
                "origin": list(ucs.GetLocation()),
                "vectors": list(ucs.GetVectors()),
            }
        except pywintypes.com_error:
            details["ucs"] = "Not available"

        # Machine sim location
        try:
            details["machine_sim_location"] = list(setup.GetMachineSimLocation())
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
    setup_name: Annotated[
        str,
        Field(description="Name of setup to activate", min_length=1),
    ],
) -> str:
    """Change the active setup. Call list_setups first to see available names.
    Uses setup.Activate() which is the correct FeatureCAM API method."""
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
    setup_name: Annotated[
        str,
        Field(description="Name of the setup", min_length=1),
    ],
    enabled: Annotated[
        bool,
        Field(description="True to enable, False to disable"),
    ],
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


# ==========================================================================
# TOOL LIBRARY TOOLS
# ==========================================================================

def _get_setup_tool_names(doc, setup_name: str) -> set:
    """Get the set of tool names used by operations in a specific setup.

    Uses op.FeatureName to find operations belonging to features in the setup.
    """
    setup = find_setup(doc, setup_name)
    feature_names = set()
    for i in range(1, setup.Features.Count + 1):
        feature_names.add(setup.Features.Item(i).Name)

    tool_names = set()
    for i in range(1, doc.Operations.Count + 1):
        op = doc.Operations.Item(i)
        try:
            if op.FeatureName in feature_names:
                tool = op.Tool
                if tool:
                    tool_names.add(tool.Name)
        except pywintypes.com_error:
            continue
    return tool_names


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
    setup_name: Annotated[
        Optional[str],
        Field(description="Filter by setup name. If omitted, returns all tools."),
    ] = None,
) -> str:
    """List all tools in the document with tool number, type, and offset registers.
    Uses ToolMaps for complete tool data. Use tool names with get_tool_details
    for full geometry info."""
    try:
        app, doc = get_featurecam()

        setup_tool_names = None
        if setup_name:
            setup_tool_names = _get_setup_tool_names(doc, setup_name)

        tools = []
        for i in range(1, doc.ToolMaps.Count + 1):
            tm = doc.ToolMaps.Item(i)
            try:
                tool = tm.Tool
                tool_name = tool.Name
            except pywintypes.com_error:
                continue

            if setup_tool_names is not None and tool_name not in setup_tool_names:
                continue

            tools.append({
                "name": tool_name,
                "tool_number": tm.ToolNumber,
                "tool_id": tm.ToolID,
                "group": TOOL_GROUPS.get(tool.ToolGroup, f"Unknown({tool.ToolGroup})"),
                "exposed_length": tool.ExposedLength,
                "metric": tool.Metric,
                "holder": _holder_name(tool),
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
    tool_name: Annotated[
        str,
        Field(description="Name of the tool", min_length=1),
    ],
) -> str:
    """Get detailed information about a specific tool including all available
    geometry properties. Type-specific properties (Diameter, Flutes, etc.) are
    attempted via introspection. Call list_tools first to see available names."""
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
                except pywintypes.com_error:
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
            "holder": _holder_name(target_tool),
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
                if val is not None and not callable(val):
                    details[prop] = val
            except (AttributeError, pywintypes.com_error):
                pass

        return json.dumps(details, indent=2, default=str)

    except ToolError:
        raise
    except pywintypes.com_error as e:
        raise handle_com_error(e, "get_tool_details")


# ==========================================================================
# OPERATION & FEATURE TOOLS
# ==========================================================================

def _setup_feature_names(doc, setup_name: str) -> set:
    """Get the set of feature names in a setup."""
    setup = find_setup(doc, setup_name)
    names = set()
    for i in range(1, setup.Features.Count + 1):
        names.add(setup.Features.Item(i).Name)
    return names


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
    setup_name: Annotated[
        str,
        Field(description="Name of the setup", min_length=1),
    ],
) -> str:
    """List all features in a setup with name, model type, and visibility.
    Use setup names from list_setups. Feature names can be used to filter
    get_operations."""
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
                "layer": _as_name(feat.Layer),
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
    setup_name: Annotated[
        Optional[str],
        Field(description="Filter by setup name. If omitted, returns all operations."),
    ] = None,
    feature_name: Annotated[
        Optional[str],
        Field(description="Filter by feature name. If omitted, returns all."),
    ] = None,
) -> str:
    """Get operations with tool, feed, speed, depth, errors, and machine time.
    Each operation links to its feature via feature_name. Use list_features to
    get valid feature names, or list_setups for setup names."""
    try:
        app, doc = get_featurecam()

        # Build set of feature names for setup filter
        setup_feature_names = None
        if setup_name:
            setup_feature_names = _setup_feature_names(doc, setup_name)

        operations = []
        for i in range(1, doc.Operations.Count + 1):
            op = doc.Operations.Item(i)
            op_feature = op.FeatureName

            # Apply filters
            if setup_feature_names is not None and op_feature not in setup_feature_names:
                continue
            if feature_name is not None and op_feature != feature_name:
                continue

            errors_str = op.Errors or ""
            op_info = {
                "name": op.Name,
                "feature": op_feature,
                "errors": errors_str,
                "has_errors": bool(errors_str.strip()),
            }

            try:
                op_info["fixture_id"] = op.FixtureID
            except pywintypes.com_error:
                pass

            # Tool
            try:
                tool = op.Tool
                if tool:
                    op_info["tool"] = tool.Name
            except pywintypes.com_error:
                pass

            # Feed, speed, depth, time — use *Text versions which return display strings
            for prop, key in [
                ("FeedText", "feed"),
                ("SpeedText", "speed"),
                ("DepthText", "depth"),
                ("MachTimeString", "machine_time"),
                ("MachTimeSeconds", "machine_time_seconds"),
            ]:
                try:
                    val = getattr(op, prop)
                    if val is not None and not callable(val):
                        op_info[key] = val
                except (AttributeError, pywintypes.com_error):
                    pass

            # Warnings
            try:
                w = op.Warnings or ""
                if w.strip():
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
    setup_name: Annotated[
        Optional[str],
        Field(description="Specific setup to check. If omitted, checks all."),
    ] = None,
) -> str:
    """Check all operations for errors. Call before generating NC code.
    Returns only operations with errors, plus a summary count."""
    try:
        app, doc = get_featurecam()

        setup_feature_names = None
        if setup_name:
            setup_feature_names = _setup_feature_names(doc, setup_name)

        errors = []
        total_checked = 0

        for i in range(1, doc.Operations.Count + 1):
            op = doc.Operations.Item(i)

            if setup_feature_names is not None and op.FeatureName not in setup_feature_names:
                continue

            total_checked += 1
            err = op.Errors or ""
            if err.strip():
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

        # GetDimensions and GetLocation are methods that may return tuples or require out-params
        try:
            dims = stock.GetDimensions()
            info["dimensions"] = list(dims) if dims else None
        except (pywintypes.com_error, TypeError):
            pass

        try:
            loc = stock.GetLocation()
            info["location"] = list(loc) if loc else None
        except (pywintypes.com_error, TypeError):
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
    output_path: Annotated[
        str,
        Field(description="Full file path for the output STL file", min_length=1),
    ],
) -> str:
    """Export stock geometry to STL file for use in simulation or verification."""
    try:
        app, doc = get_featurecam()
        stock = doc.Stock

        # Ensure parent directory exists
        parent = os.path.dirname(os.path.abspath(output_path))
        os.makedirs(parent, exist_ok=True)

        stock.ExportToSTL(output_path)

        # Verify file was created
        if os.path.exists(output_path):
            size = os.path.getsize(output_path)
            return f"Stock exported to: {output_path} ({size} bytes)"
        else:
            return f"Stock export called, but file not found at: {output_path}"

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
                loc = ucs.GetLocation()
                entry["origin"] = list(loc)
            except (pywintypes.com_error, TypeError):
                pass
            try:
                vecs = ucs.GetVectors()
                entry["vectors"] = list(vecs)
            except (pywintypes.com_error, TypeError):
                pass
            ucs_list.append(entry)

        return json.dumps({"ucs_list": ucs_list, "count": len(ucs_list)}, indent=2)

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
    ucs_name: Annotated[
        str,
        Field(description="Name of the UCS", min_length=1),
    ],
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
            raise ToolError(
                f"UCS '{ucs_name}' not found. Available: {', '.join(names)}"
            )

        details = {"name": ucs_name}

        try:
            loc = list(target.GetLocation())
            details["origin"] = {"x": loc[0], "y": loc[1], "z": loc[2]}
        except (pywintypes.com_error, TypeError, IndexError):
            pass

        try:
            vecs = list(target.GetVectors())
            details["orientation"] = {
                "x_axis": {"x": vecs[0], "y": vecs[1], "z": vecs[2]},
                "y_axis": {"x": vecs[3], "y": vecs[4], "z": vecs[5]},
                "z_axis": {"x": vecs[6], "y": vecs[7], "z": vecs[8]},
            }
        except (pywintypes.com_error, TypeError, IndexError):
            pass

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
    setup_name: Annotated[
        Optional[str],
        Field(description="Specific setup. If omitted, returns offsets for all setups."),
    ] = None,
) -> str:
    """Get work offset data for setups: fixture ID (G54/G55/etc), UCS origin,
    and machine simulation location."""
    try:
        app, doc = get_featurecam()

        # Validate setup_name upfront if provided
        if setup_name:
            find_setup(doc, setup_name)

        offsets = []
        for i in range(1, doc.Setups.Count + 1):
            s = doc.Setups.Item(i)
            if setup_name and s.Name != setup_name:
                continue

            fid = s.FixtureID
            entry = {
                "setup": s.Name,
                "fixture_id": fid,
                "fixture_code": f"G{fid}" if fid and fid.isdigit() else fid,
            }

            try:
                ucs = s.ucs
                loc = list(ucs.GetLocation())
                entry["ucs_name"] = ucs.Name
                entry["ucs_origin"] = {"x": loc[0], "y": loc[1], "z": loc[2]}
            except (pywintypes.com_error, TypeError, IndexError):
                pass

            try:
                msl = list(s.GetMachineSimLocation())
                entry["machine_sim_location"] = {"x": msl[0], "y": msl[1], "z": msl[2]}
            except (pywintypes.com_error, TypeError, IndexError):
                pass

            offsets.append(entry)

        return json.dumps({"offsets": offsets, "count": len(offsets)}, indent=2)

    except ToolError:
        raise
    except pywintypes.com_error as e:
        raise handle_com_error(e, "get_work_offsets")


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
    """List all solid geometry in the document with name, model type, and visibility."""
    try:
        app, doc = get_featurecam()
        solids = []

        for i in range(1, doc.Solids.Count + 1):
            solid = doc.Solids.Item(i)
            solids.append({
                "name": solid.Name,
                "model_type": solid.ModelType,
                "visible": solid.Visible,
                "layer": _as_name(solid.Layer),
            })

        return json.dumps({"solids": solids, "count": len(solids)}, indent=2)

    except ToolError:
        raise
    except pywintypes.com_error as e:
        raise handle_com_error(e, "list_solids")


@mcp.tool(
    annotations={
        "title": "Save Simulation as STL",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": True,
    }
)
def save_stl(
    output_path: Annotated[
        str,
        Field(
            description="Full file path for the output STL file. Directory and filename will be split.",
            min_length=1,
        ),
    ],
    create_sub_folder: Annotated[
        bool,
        Field(description="If true, creates a subfolder for the STL output."),
    ] = False,
) -> str:
    """Save the 3D simulation results as an STL file. Note: this exports the
    simulated toolpath result, NOT raw geometry. For raw stock geometry, use
    export_stock instead. Toolpaths must have been simulated first —
    call simulate_toolpath if needed."""
    try:
        app, doc = get_featurecam()

        # SaveSTL takes separate filename and directory arguments
        abs_path = os.path.abspath(output_path)
        directory = os.path.dirname(abs_path)
        filename = os.path.basename(abs_path)

        os.makedirs(directory, exist_ok=True)

        result = doc.SaveSTL(filename, directory, create_sub_folder)
        # Result is (err_msg, stl_file_name)
        err_msg = result[0] if result and len(result) > 0 else ""
        actual_file = result[1] if result and len(result) > 1 else ""

        if err_msg:
            raise ToolError(f"SaveSTL error: {err_msg}")

        # The actual output file may be in the specified directory or a subfolder
        final_path = actual_file if actual_file else abs_path
        if os.path.exists(final_path):
            size = os.path.getsize(final_path)
            return f"STL saved to: {final_path} ({size} bytes)"
        # Try to find it anywhere in the target directory
        for root, _, files in os.walk(directory):
            for f in files:
                if f.lower().endswith(".stl"):
                    found = os.path.join(root, f)
                    if os.path.getmtime(found) > os.path.getmtime(directory) - 5:
                        size = os.path.getsize(found)
                        return f"STL saved to: {found} ({size} bytes)"
        return f"SaveSTL returned without error but output file not located. Result: {result}"

    except ToolError:
        raise
    except pywintypes.com_error as e:
        raise handle_com_error(e, "save_stl")


# ==========================================================================
# NC GENERATION TOOLS
# ==========================================================================

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
        "title": "Simulate Toolpaths",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": False,
    }
)
def simulate_toolpath(
    show_animation: Annotated[
        bool,
        Field(description="If true, display the tool animation. If false, only show end results."),
    ] = False,
) -> str:
    """Run centerline toolpath simulation. Required before NC generation if
    toolpaths are invalid. Check toolpaths_valid first to see if this is needed."""
    try:
        app, doc = get_featurecam()
        doc.SimToolpath(show_animation)
        return "Toolpath simulation complete."
    except ToolError:
        raise
    except pywintypes.com_error as e:
        raise handle_com_error(e, "simulate_toolpath")


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
    output_directory: Annotated[
        Optional[str],
        Field(description="Directory to save NC files. If omitted, uses document directory."),
    ] = None,
    file_name: Annotated[
        Optional[str],
        Field(description="Base file name. If omitted, uses the part name."),
    ] = None,
    current_setup_only: Annotated[
        bool,
        Field(description="If true, generates NC for the current active setup only."),
    ] = False,
    create_sub_folder: Annotated[
        bool,
        Field(description="If true, creates a subfolder named after the part under output_directory."),
    ] = False,
) -> str:
    """Generate NC code files using doc.SaveNC. Checks for operation errors
    first. If toolpaths are invalid, warns to run simulate_toolpath first.
    Returns paths to all generated NC, doc, and macro files."""
    try:
        app, doc = get_featurecam()

        # Pre-flight: toolpaths must be valid
        if not doc.ToolpathsAreValid:
            raise ToolError(
                "Toolpaths are invalid. Call simulate_toolpath first to "
                "recalculate them, then try generate_nc_code again. "
                "Note: simulation on large documents can take several minutes."
            )

        # Pre-flight: check for operation errors
        error_ops = []
        for i in range(1, doc.Operations.Count + 1):
            op = doc.Operations.Item(i)
            err = op.Errors or ""
            if err.strip():
                error_ops.append(f"{op.Name}: {err}")

        if error_ops:
            raise ToolError(
                f"Cannot generate NC code. {len(error_ops)} operation(s) have errors:\n"
                + "\n".join(error_ops)
                + "\nFix these in FeatureCAM, then try again."
            )

        # Determine output directory
        if output_directory:
            out_dir = output_directory
        else:
            out_dir = doc.path if doc.path else None
            if not out_dir:
                raise ToolError(
                    "Document has not been saved to a directory. "
                    "Specify output_directory or save the document first."
                )

        os.makedirs(out_dir, exist_ok=True)

        # Determine base filename
        base_name = file_name or doc.PartName or doc.NameWithoutExtension or "output"

        # file_types: NC code = 8 (eNCFT_NCCode)
        result = doc.SaveNC(
            base_name,          # file_name
            out_dir,            # directory
            current_setup_only, # current_setup_only
            NC_FILE_TYPE_NCCODE, # file_types
            create_sub_folder,  # create_sub_folder
        )

        # Unpack out params: (err_msg, nc_file_cnt, nc_file_names, doc_file_cnt, doc_file_names, macro_file_cnt, macro_file_names)
        err_msg = result[0] if len(result) > 0 else ""
        nc_count = result[1] if len(result) > 1 else 0
        nc_names = list(result[2]) if len(result) > 2 and result[2] else []
        doc_count = result[3] if len(result) > 3 else 0
        doc_names = list(result[4]) if len(result) > 4 and result[4] else []
        macro_count = result[5] if len(result) > 5 else 0
        macro_names = list(result[6]) if len(result) > 6 and result[6] else []

        if err_msg:
            raise ToolError(f"NC generation error: {err_msg}")

        return json.dumps({
            "success": True,
            "output_directory": out_dir,
            "base_name": base_name,
            "nc_files": {"count": nc_count, "names": nc_names},
            "doc_files": {"count": doc_count, "names": doc_names},
            "macro_files": {"count": macro_count, "names": macro_names},
        }, indent=2, default=str)

    except ToolError:
        raise
    except pywintypes.com_error as e:
        raise handle_com_error(e, "generate_nc_code")


# ==========================================================================
# SERVER ENTRY POINT
# ==========================================================================

if __name__ == "__main__":
    mcp.run()
