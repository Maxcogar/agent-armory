# FeatureCAM MCP Server — Evaluation

> Generated: 2026-04-09
> Evaluated against: Autodesk/featurecam-api-examples, MCP spec 2025-11-25, FastMCP docs (Context7), pywin32 COM patterns
> Method: Static analysis scripts + API cross-reference + project document review
> Source documents read: featurecam_mcp_server.py (full), requirements.txt, README.md, PROJECT_SUMMARY.md, DEPLOYMENT.md

---

## 1. Purpose & Scope

This server connects Claude to Autodesk FeatureCAM via COM automation, enabling an LLM to inspect and control CAM operations. The target user is a manufacturing engineer or machinist who wants to use natural language to query document state, manage setups, inspect tools, check for errors, and generate NC code.

---

## 1.1 Critical Finding: Server Cannot Function As Written

**Verified against FeatureCAM 7.27, document "Fuel Bulkhead V2.fm", 2026-04-09.**

`win32com.client.Dispatch("FeatureCAM.Application")` returns an `IMFGDocument` interface that does NOT have `Setups`, `Solids`, `UCSs`, `Stock`, or `ActiveSetup`. These properties only exist on the `IFMDocument` interface, obtained via `win32com.client.CastTo(doc, "IFMDocument")`.

The `FMDocument` coclass implements two interfaces:
- `IMFGDocument` — what pywin32 resolves to by default (limited: Operations, ToolMaps, Save, SaveNC)
- `IFMDocument` — the DEFAULT interface per the type library, with full API (Setups, Solids, Stock, UCSs, Features, and 140+ attributes)

**15 of 21 tools access `doc.Setups`, `doc.Solids`, `doc.UCSs`, or `doc.Stock` and will raise `AttributeError` immediately.** The server was never tested against a running FeatureCAM instance.

Additionally, every hardcoded enum value is wrong:
- Setup types: server assumes `{0=Milling, 1=Turning, 2=Wire}`, actual values are `{1, 2, 4}` (bitmask)
- Tool groups: server assumes sequential `{0..13}`, actual values are bitmasks `{1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072}`

---

## 1.2 Documentation vs Implementation Contradictions

PROJECT_SUMMARY.md makes claims that contradict the source code:

| Claim (PROJECT_SUMMARY.md) | Reality (featurecam_mcp_server.py) |
|---|---|
| Line 9: "production-ready, fully-functional MCP server" | 5 of 21 tools are stubs that return placeholder strings |
| Line 23: "Did NOT create placeholder code" | Lines 635, 1059, 1341 contain literal `# placeholder` comments |
| Line 121: "27 professional-grade tools" | Actual tool count is 21 (script-verified via AST) |
| Line 358: "All 27 tools fully implemented" | 5 tools call no COM write method; NC gen builds paths but generates nothing |
| Line 399: "Deployable - Ready for production use" | Error handling non-compliant with MCP spec; threading model blocks event loop |

README.md line 527 credits `jlowin/fastmcp` (standalone package), but the code imports from `mcp.server.fastmcp` (Anthropic SDK's bundled FastMCP). These are different packages with different APIs.

DEPLOYMENT.md Test 5 (line 174) hedges: "file creation may depend on FeatureCAM API version" — implicitly acknowledging the export tool doesn't create files.

These contradictions matter because a user relying on the documentation will believe the server is production-ready when it is not. The evaluation below assesses the code, not the documentation claims.

---

## 2. Requirements Baseline

A FeatureCAM MCP server must support what the COM API exposes and what a machinist actually needs:

### Read Operations (inspect document state)
- Document metadata (name, path, units, counts)
- Setup listing and detail (type, UCS, spindle, fixture ID, enabled status)
- Feature and operation listing per setup
- Operation error detection
- Tool listing with full geometry (diameter, length, flutes, angles, holder)
- Solid listing with type classification
- UCS data (origin position, orientation vectors)
- Work offset data (fixture ID, UCS location, machine sim location)
- Stock configuration

### Write Operations (modify state and generate output)
- NC code generation via `doc.SaveNC()` / `doc.SaveNC2()`
- Toolpath simulation via `doc.SimToolpath()`
- STL export via `solid.ExportToSTL()` / `stock.ExportToSTL()`
- Document save
- Toolpath invalidation
- Setup activation via `setup.Activate()`
- Setup enable/disable

### Available in API but not in server

The following are confirmed present in the Autodesk/featurecam-api-examples repo. "Confirmed" means the method/property appears in the C# source code of an official Autodesk example plugin. Items not confirmed in the examples but plausible from the COM type library are excluded — they require runtime verification with `EnsureDispatch` against a live FeatureCAM instance.

| API Capability | Source File in Examples | Relevance |
|---|---|---|
| `doc.SaveNC()` / `doc.SaveNC2()` | FeatureCAMExporter.cs, Exporter.cs | NC code generation — core workflow |
| `doc.SimToolpath(false)` | FeatureCAMExporter.cs:49 | Toolpath calculation before NC gen |
| `solid.ExportToSTL(path, out err)` | Confirmed in examples | Geometry export for verification |
| `stock.ExportToSTL(path, out err)` | Confirmed in examples | Stock geometry export |
| `setup.Activate()` | Confirmed in examples | Setup activation (server uses wrong method) |
| `ucs.GetLocation(out x,y,z)` | Confirmed in examples | UCS origin position |
| `ucs.GetVectors(out 9 components)` | Confirmed in examples | UCS orientation matrix |
| `setup.GetMachineSimLocation(out x,y,z)` | Confirmed in examples | Machine sim offset |
| `doc.ToolMaps` collection | Confirmed in examples | Proper tool enumeration with ToolNumber, ToolID, offset registers |
| `doc.get_ActiveToolCrib()` | Confirmed in examples | Typed tool sub-collections (EndMills, TwistDrills, etc.) |
| `eTG_TurnOD`, `eTG_TurnID`, `eTG_TurnGroove`, `eTG_TurnThread` | Confirmed in examples | Turning tool groups |
| `FMEndMill.CutterLength`, `.ShankDiameter`, `.Taper` | Confirmed in examples | Detailed mill geometry |
| `FMTwistDrill.SpotTipAngle` | Confirmed in examples | Correct drill angle property |

The following are plausible manufacturing needs but NOT confirmed in the official examples. They require runtime verification before adding to the roadmap:
- Post processor selection/listing
- Feeds and speeds per operation (SpindleSpeed, FeedRate, DepthOfCut)
- Cycle time estimation
- Material/stock material specification
- Document open by path

---

## 3. Implementation Assessment

### 3.1 COM API Correctness

#### Verified Correct (22 properties)
ActiveDocument, ActiveSetup, CornerRadius, Diameter, Enabled, Errors, ExposedLength, Features, FixtureID, IndexType, InvalidateToolpaths, Metric, Name, Operations, PartName, Save, SaveAs, Setups, SingleProgram, SingleProgramWithProgramStop, Solids, Spindle, Stock, Tool, ToolDominant, ToolGroup, Type, UseAsClamp, path, ucs

#### Wrong Property Names
| Used in Server | Correct API Name | Location |
|---|---|---|
| `PointAngle` | `SpotTipAngle` (FMSpotDrill), `angle` (FMCounterSink) | line 1207 |
| `NumberOfFlutes` | Not found in official examples; unverified | line 1202 |

#### Wrong Method Usage
| Server Code | Correct API | Location |
|---|---|---|
| `doc.ActiveSetup = target_setup` | `setup.Activate()` | line 918 |

#### Resolved by Runtime Verification (Phase 0, 2026-04-09)

All previously unverified items have been resolved against FeatureCAM 7.27:

| Item | Server assumes | Actual (verified) | Impact |
|---|---|---|---|
| `doc.Setups` | Exists on default interface | Only on `IFMDocument`, not `IMFGDocument` | **15 tools crash with AttributeError** |
| `doc.Solids` | Exists on default interface | Only on `IFMDocument` | Tools crash |
| `doc.UCSs` | Exists on default interface | Only on `IFMDocument` | Tools crash |
| `doc.Stock` | Exists on default interface | Only on `IFMDocument` | Tools crash |
| `doc.ActiveSetup` | Exists on default interface | Only on `IFMDocument` | Tool crashes |
| Setup type `0=Milling` | Integer 0 | Integer **1** | Wrong type comparisons |
| Setup type `1=Turning` | Integer 1 | Integer **2** | Wrong type comparisons |
| Setup type `2=Wire` | Integer 2 | Integer **4** | Wrong type comparisons |
| Tool group `0=EndMill` | Integer 0 | Integer **32** | All tool type lookups return "Unknown" |
| All 14 tool groups | Sequential 0-13 | Bitmask values (1,2,4,8,...,131072) | Every tool group lookup fails |
| `NumberOfFlutes` | Exists on tool | **NOT on base tool interface** | Property access fails silently |
| `Diameter` | Exists on tool | **NOT on base tool interface** | Diameter never returned |
| `CornerRadius` | Exists on tool | **NOT on base tool interface** | Property access fails silently |
| `PointAngle` | Exists on tool | **NOT on any tool interface** | Property access fails silently |
| `feature.Enabled` | Exists on feature | **NOT on feature interface** | Filter logic broken |
| `feature.Operations` | Collection on feature | **NOT on feature interface** | Operations per feature inaccessible via this path |
| `solid.UseAsClamp` | Exists on solid | **NOT on solid interface** | Property access fails silently |
| `solid.ExportToSTL` | Method on solid | **NOT on solid interface** — exists on `Stock` and as `doc.SaveSTL` | Export approach wrong |

**Tool interface properties actually available:** `Name`, `ToolGroup`, `ExposedLength`, `Metric`, `Holder`, `DefaultHolder`, `Material`, `Comment`, `FeedPercentage`, `SpeedPercentage`, `ToolFinish`, `ToolOperation`, `CoolantOverride`, `CompatibleHolders`. Type-specific properties (Diameter, Flutes, etc.) require casting to typed interfaces (FMEndMill, FMTwistDrill, etc.).

**Feature interface properties actually available:** `Name`, `BoundingBox`, `Color`, `Layer`, `ModelType`, `Selected`, `Visible`, `IsPlanar`. No `Enabled`, no `Operations`. Operations are accessed via `doc.Operations` globally or `setup.Features` → but feature.Operations is not available.

**Setup properties confirmed working:** `Name`, `Type`, `Enabled`, `FixtureID` ("54" = G54), `Spindle` (0 = Main), `Features.Count` (63), `ucs`, `Activate()`, `GetMachineSimLocation()`, `TotalMachineTime`, `Order`, `Delete`, `AddFeature`.

#### Stubs (claim success but call no COM method)

**featurecam_generate_nc_code** (lines 564-663)
- Builds file path strings and returns "NC code generation initiated successfully"
- Never calls `doc.SimToolpath()` or `doc.SaveNC()`
- Real API: `doc.SaveNC(filename, dir, activeOnly, fileType, false, out err, out ncNum, out ncNames, out docNum, out docNames, out macroNum, out macroNames)`
- Contains comments: "placeholder", "actual generation would use the FeatureCAM API"

**featurecam_export_stock** (lines 1036-1065)
- Creates output directory, returns "Stock export initiated to: {path}"
- Never calls `stock.ExportToSTL(path, out err_msg)`
- Contains comments: "placeholder", "Actual export depends on FeatureCAM API availability"

**featurecam_export_solid** (lines 1308-1346)
- Finds solid object, creates output directory, returns success string
- Never calls `solid.ExportToSTL(path, out err_msg)`
- Contains comments: "Actual export depends on FeatureCAM API availability"

**featurecam_get_work_offsets** (lines 1707-1738)
- Connects to document then ignores it entirely
- Returns hardcoded static string
- Should use: `setup.FixtureID`, `setup.ucs.GetLocation()`, `setup.GetMachineSimLocation()`

**featurecam_get_ucs_details** (lines 1407-1445)
- Finds UCS object then extracts zero data from it
- Returns "Transformation data available through FeatureCAM API"
- Should use: `ucs.GetLocation(out x, y, z)`, `ucs.GetVectors(out x1, x2, x3, y1, y2, y3, z1, z2, z3)`

#### Incomplete Tool Groups
Server defines 14 groups (indices 0-13). Missing from `TOOL_GROUPS` dict:
- `TurnOD`
- `TurnID`
- `TurnGroove`
- `TurnThread`

These are required for turning operations. A document with lathe tools will show "Unknown" for their group.

---

### 3.2 Unused Parameters (script-verified)

These parameters are declared in input models, accepted from the LLM, but silently ignored in the function body:

| Tool | Unused Parameter | Impact |
|---|---|---|
| `featurecam_export_stock` (line 1036) | `setup_name` | LLM passes setup filter, server ignores it |
| `featurecam_list_tools` (line 1081) | `setup_name` | LLM passes setup filter, server ignores it |
| `featurecam_list_solids` (line 1252) | `solid_type` | LLM passes type filter, server ignores it |
| `featurecam_check_operation_errors` (line 1633) | `setup_name` | LLM passes setup filter, server ignores it |
| `featurecam_get_work_offsets` (line 1707) | `setup_name` | LLM passes setup filter, server ignores it (entire tool is stub) |

#### Unused Definition
- `ExportFormat` enum (line 128): defined but never referenced anywhere

---

### 3.3 MCP Protocol Compliance

#### Error Handling — Non-compliant

Every tool uses this pattern:
```python
except Exception as e:
    return format_error_message(e, "tool_name")  # returns isError: false
```

Script found:
- **0** imports of `ToolError`
- **0** raises of `ToolError`
- **22** calls to `format_error_message` (return error as success string)
- **32** bare `except Exception` blocks
- **0** catches of `pywintypes.com_error`

Per MCP spec 2025-11-25: "Any errors that originate from the tool SHOULD be reported inside the result object, with `isError` set to true, not as an MCP protocol-level error response. Otherwise, the LLM would not be able to see that an error occurred and self-correct."

Per FastMCP docs: raise `ToolError` from `fastmcp.exceptions` for expected errors. Use `mask_error_details=True` in production.

**Result:** The LLM cannot distinguish a failed tool call from a successful one. Error recovery is unreliable.

#### Dependency Version
- Server requires `mcp>=1.1.0`
- Current version is v1.27.0
- Missing access to newer protocol features (outputSchema, structuredContent, Tasks)

#### Annotations
- `title` is placed inside `annotations` dict — should also be top-level `@mcp.tool(title=...)` per 2025-11-25 spec
- Raw dicts used instead of `ToolAnnotations` from `mcp.types`
- `save_document` marked `destructiveHint: False` despite being able to overwrite files via `SaveAs`
- No tool has `destructiveHint: True` (0 out of 21)

---

### 3.4 Runtime Architecture

#### COM Threading — Broken

Script found:
- `pythoncom` imported: **yes**
- `CoInitialize()` called: **no**
- `run_in_executor` used: **no**
- `ThreadPoolExecutor` used: **no**
- Async tool handlers: **21**
- Sync tool handlers: **0** (tool handlers)

All 21 handlers are `async def` making synchronous blocking COM calls directly on the asyncio event loop. FeatureCAM is an STA COM server (confirmed by `[STAThread]` in all official C# examples).

**Issues:**
1. Blocks the event loop on every COM call — no concurrent request handling
2. No `CoInitialize()` — will crash if COM calls land on a non-main thread
3. STA COM objects can only be used from the thread that created them

**Fix options (both require runtime testing to confirm behavior):**
- Switch to sync `def` handlers. FastMCP docs state sync handlers are dispatched to a threadpool via `anyio.to_thread.run_sync()` (confirmed in MCP Python SDK PR #1909, merged Jan 2026). Each thread would need `pythoncom.CoInitialize()`.
- Or: keep `async def` but push all COM work to a dedicated single-thread `ThreadPoolExecutor` with `CoInitialize` as the initializer, called via `run_in_executor`. This guarantees all COM objects stay on one STA thread.

**What I have NOT verified:** Whether the current server actually crashes or silently works due to pywin32 auto-initializing COM on the main thread where asyncio happens to run. This depends on how `mcp.run()` sets up its event loop. Testing against a live instance would confirm.

#### Connection Management — No Caching

Script found:
- `Dispatch()` in codebase: **1 definition** (called from every tool via `get_featurecam_application()`)
- Cached connection variable: **no**
- Liveness check: **no**

Every tool invocation does a fresh `win32com.client.Dispatch("FeatureCAM.Application")` — registry lookup + ROT check + cross-process marshaling each time. No liveness check means stale references after FeatureCAM crash are never detected.

#### COM Error Specificity — None

`pywintypes.com_error` carries HRESULT codes that distinguish:
- `RPC_E_DISCONNECTED` (FeatureCAM crashed) — needs reconnection
- `DISP_E_MEMBERNOTFOUND` (property doesn't exist) — needs code fix
- `DISP_E_EXCEPTION` (application error) — needs user action

All of these are caught as generic `Exception` and formatted identically.

---

### 3.5 Tool Design for LLM Consumption

#### Descriptions
Tool docstrings include `Args:` and `Returns:` sections that duplicate the JSON schema the LLM already receives. They don't explain when to use the tool, what tools to call first, or what tools to call next. Per Anthropic's guidance, descriptions should be 3-4 sentences of agent-oriented guidance.

#### Response Format
Every read tool has a `response_format` parameter (json/markdown). The markdown format includes headers, bullet formatting, and emoji that cost tokens. The LLM processes JSON more efficiently and reformats for the user anyway.

#### get_operations silently skips disabled features
Line 1571: `if not safe_com_property(feature, "Enabled", False): continue` — disabled feature operations are excluded with no opt-out flag. LLM cannot inspect operations on disabled features.

---

### 3.6 Security & Safety

Script found:
- `os.makedirs` with unvalidated paths: **3** (lines 611, 1056, 1338)
- `SaveAs` with unvalidated path: **1** (line 515)
- Path validation/sanitization: **none**
- `mask_error_details`: **not used**

Any file path parameter can write to or create directories anywhere on the filesystem. No allowlisting, no path resolution, no traversal protection.

---

## 4. Priority Matrix

### Server Cannot Run (verified 2026-04-09)

| # | Finding | Effort | Location |
|---|---|---|---|
| 1 | **Wrong COM interface** — `Dispatch()` gives `IMFGDocument` which lacks Setups, Solids, Stock, UCSs. Must `CastTo(doc, "IFMDocument")`. **15 of 21 tools crash.** | Small (1 line fix) | `get_active_document()` line 88 |
| 2 | **All setup type constants wrong** — server has {0,1,2}, actual is {1,2,4} | Small | lines 48-50 |
| 3 | **All tool group constants wrong** — server has {0..13} sequential, actual is bitmask values | Small | lines 53-68 |
| 4 | **`feature.Enabled` doesn't exist** — feature interface has no Enabled property | Moderate (rearchitect) | lines 1493, 1571 |
| 5 | **`feature.Operations` doesn't exist** — operations not accessible per-feature this way | Moderate (rearchitect) | lines 1501, 1574 |
| 6 | **Tool properties don't exist on base interface** — Diameter, NumberOfFlutes, CornerRadius, PointAngle not on base tool | Moderate (need typed casting) | lines 1117-1120, 1192-1207 |
| 7 | **`solid.UseAsClamp` doesn't exist** — not on solid interface | Small | line 1274 |
| 8 | **`solid.ExportToSTL` doesn't exist** — use `stock.ExportToSTL` or `doc.SaveSTL` | Small | line 1340 |

### Stubs (tools that claim success without doing work)

| # | Finding | Effort | Location |
|---|---|---|---|
| 9 | NC generation — no `doc.SaveNC()` call, returns fake success | Moderate | lines 564-663 |
| 10 | STL export stubs — no export calls | Small | lines 1036-1065, 1308-1346 |
| 11 | Work offsets — returns static string | Small | lines 1707-1738 |
| 12 | UCS details — extracts no data despite `GetLocation`/`GetVectors` existing | Small | lines 1407-1445 |

### Protocol/Infrastructure Broken

| # | Finding | Effort | Location |
|---|---|---|---|
| 13 | Error handling returns errors as success (`isError: false`) | Moderate | all 21 tools |
| 14 | `set_active_setup` uses `doc.ActiveSetup =` instead of `setup.Activate()` | Small | line 918 |
| 15 | 5 unused filter parameters silently ignored | Small | see 3.2 |

### Degrades Quality / Reliability

| # | Finding | Effort | Location |
|---|---|---|---|
| 9 | All handlers async but blocking COM — blocks event loop | Moderate | all 21 tools |
| 10 | No `CoInitialize()` — crash risk on non-main threads | Small | global |
| 11 | No COM connection caching — unnecessary overhead per call | Small | `get_featurecam_application()` |
| 12 | No `pywintypes.com_error` handling — loses HRESULT diagnostics | Moderate | all 21 tools |
| 13 | Missing turning tool groups (TurnOD/ID/Groove/Thread) | Small | line 53 |
| 14 | No path validation on file operations | Small | lines 515, 611, 1056, 1338 |
| 15 | `save_document` `destructiveHint` should be `True` for `SaveAs` | Small | line 489 |
| 16 | Unverified integer constants for setup types and tool groups | Small | lines 48-68 |
| 17 | Tool descriptions not agent-oriented | Moderate | all 21 tools |

### Improvement Opportunities

| # | Finding | Effort | Location |
|---|---|---|---|
| 18 | Add `doc.SimToolpath()` tool | Small | new tool |
| 19 | Add feeds/speeds reading per operation | Moderate | new tool |
| 20 | Add post processor listing/selection | Moderate | new tool |
| 21 | Use `doc.ToolMaps` for tool access instead of iterating Operations | Moderate | `list_tools`, `get_tool_details` |
| 22 | Add tool crib access (`get_ActiveToolCrib`) | Moderate | new tool |
| 23 | Add cycle time estimation | Moderate | new tool |
| 24 | Add open document tool | Small | new tool |
| 25 | Add NC code content reading | Small | new tool |
| 26 | Use `EnsureDispatch` for early binding | Small | `get_featurecam_application()` |
| 27 | Update `mcp` dependency to `>=1.20.0` | Small | requirements.txt |
| 28 | Use `ToolAnnotations` from `mcp.types` | Small | all tool decorators |
| 29 | Add `mask_error_details=True` | Small | FastMCP init |
| 30 | Expose more tool properties (OverallLength, CutterLength, ShankDiameter, Holder, Taper) | Moderate | `get_tool_details` |

---

## 5. Implementation Roadmap

### Phase 0: Runtime Verification — COMPLETE (2026-04-09)

Verified against FeatureCAM 7.27, document "Fuel Bulkhead V2.fm". Results in `phase0_results.json`.

**Key findings that change everything:**
1. Server must use `CastTo(doc, "IFMDocument")` after `Dispatch()` — the default `IMFGDocument` interface lacks Setups, Solids, UCSs, Stock
2. All enum values are bitmasks, not sequential integers
3. Feature objects don't have `Enabled` or `Operations` — operations accessed differently
4. Tool base interface lacks `Diameter`, `NumberOfFlutes`, `CornerRadius` — needs typed tool casting
5. `solid.ExportToSTL` doesn't exist — use `stock.ExportToSTL` or `doc.SaveSTL`
6. `setup.Activate()` confirmed correct; `doc.ActiveSetup` exists on `IFMDocument`
7. `setup.TotalMachineTime` exists (cycle time)
8. `stock.Material`, `stock.GetDimensions`, `stock.GetLocation` exist
9. `doc.Post` exists (post processor access)
10. `doc.AddSetup`, `doc.AddHole`, `doc.AddPocket`, `doc.AddBoss` exist (feature creation)

### Phase 1: Make the server functional (it currently cannot run)

**The server needs a near-complete rewrite of its COM layer. The following are ordered by dependency.**

1. **Fix the COM interface** — After `Dispatch("FeatureCAM.Application")` and getting `ActiveDocument`, call `win32com.client.CastTo(doc, "IFMDocument")`. This is the single change that makes Setups, Solids, Stock, UCSs, ActiveSetup accessible. Without this, 15 of 21 tools crash.

2. **Fix all enum constants** — Replace every hardcoded integer:
   ```
   Setup types: {0,1,2} → {1,2,4} (eST_Milling=1, eST_Turning=2, eST_Wire=4)
   Tool groups: {0..13} → bitmask values:
     TwistDrill=1, SpotDrill=2, TurnOD=4, TurnThread=8, Ream=16,
     EndMill=32, CounterSink=64, Tap=128, CounterBore=256, BoringBar=512,
     ChamferMill=1024, RoundingMill=2048, FaceMill=4096, SideMill=8192,
     TurnID=16384, TurnGroove=32768, ThreadMill=65536, PlungeRough=131072
   ```
   Add the 4 missing turning groups.

3. **Fix feature/operation access** — `feature.Enabled` and `feature.Operations` don't exist on the feature interface. Operations are accessed via `doc.Operations` or through setup-level traversal. The `list_features`, `get_operations` tools need rearchitecting based on what the feature interface actually provides (`Name`, `BoundingBox`, `Color`, `Layer`, `ModelType`, `Selected`, `Visible`).

4. **Fix tool property access** — Base tool interface only has `ExposedLength`, `Metric`, `Holder`, `DefaultHolder`, `ToolGroup`, `Material`. `Diameter`, `NumberOfFlutes`, `CornerRadius`, `PointAngle` are NOT on the base interface. Need to cast tools to typed interfaces (FMEndMill, FMFaceMill, FMTwistDrill, etc.) based on ToolGroup to access type-specific geometry.

5. **Fix solid operations** — `solid.UseAsClamp` and `solid.ExportToSTL` don't exist. Solid interface is a geometry model with: `Name`, `BoundingBox`, `Color`, `Layer`, `ModelType`. STL export is via `stock.ExportToSTL` (confirmed on Stock) and `doc.SaveSTL` (confirmed on document).

6. **Fix `set_active_setup`** — `setup.Activate()` confirmed to exist. `doc.ActiveSetup` also exists on `IFMDocument` for reading. Use `setup.Activate()` for setting.

7. **Fix error handling** — Replace all `except Exception: return format_error_message()` with `raise ToolError()`.
   - Standard: MCP spec 2025-11-25 — "errors SHOULD be reported with isError set to true"
   - Standard: FastMCP docs — `raise ToolError()` from `fastmcp.exceptions`

8. **Fix COM threading** — Switch all 21 handlers from `async def` to `def`. Add `pythoncom.CoInitialize()`.
   - Standard: Microsoft COM STA threading model

9. **Fix connection management** — Use `EnsureDispatch` + `CastTo("IFMDocument")`. Cache the connection. Add liveness check. Invalidate on `RPC_E_DISCONNECTED`.

10. **Wire up unused parameters** — Implement the 5 silently-ignored filter params.

11. **Fix annotations** — `destructiveHint: True` on `save_document`. Use `ToolAnnotations` from `mcp.types`.
    - Standard: MCP spec 2025-11-25

12. **Add path validation** — All file path params.
    - Standard: OWASP Path Traversal; MCP security best practices

13. **Update dependency** — `mcp>=1.1.0` → compatible with `ToolError` and `ToolAnnotations`.

### Phase 2: Complete the stubs (using confirmed COM methods from Phase 0)

11. **Implement NC generation** — Call `doc.SimToolpath(false)` then `doc.SaveNC()` with the 12-parameter signature confirmed in the Autodesk examples. Handle out params for generated file paths and error messages.

12. **Implement STL export** — Call `solid.ExportToSTL(path, out err)` and `stock.ExportToSTL(path, out err)`. Confirmed in examples. Return error message from out param if export fails.

13. **Implement work offsets** — Query `setup.FixtureID`, `setup.ucs.GetLocation()`, `setup.GetMachineSimLocation()` for each setup. All confirmed in examples.

14. **Implement UCS details** — Call `ucs.GetLocation()` and `ucs.GetVectors()`. Both confirmed in examples. Return origin (x,y,z) and 3x3 orientation matrix.

### Phase 3: Expand coverage (scope depends on Phase 0e results)

Only items confirmed available in the type library during Phase 0 should be implemented. The following are confirmed in the examples repo:

15. **Switch tool access to ToolMaps** — Use `doc.ToolMaps` collection. Confirmed in examples. Exposes ToolNumber, ToolID, offset registers.

16. **Add richer tool properties** — OverallLength, CutterLength, ShankDiameter, Holder, Taper. Confirmed in examples per tool type.

17. **Add SimToolpath tool** — Expose `doc.SimToolpath()`. Confirmed in examples.

The following require Phase 0e confirmation before planning:

18. **Feeds/speeds reading** — Unconfirmed. Implement only if properties found in type library.

19. **Post processor tool** — Unconfirmed. Implement only if API found.

20. **Open document tool** — Unconfirmed. Implement only if API found.

21. **NC code content reading** — Filesystem read of generated NC files. No COM API needed, but depends on Phase 2 step 11 producing actual files.

22. **Rewrite tool descriptions** — Agent-oriented, 3-4 sentences each: what it does, when to use it, what to call next.
   - Standard: Anthropic "Writing Tools for Agents" — tool descriptions are prompts; 3-4 sentences minimum with trigger conditions and workflow hints

---

## Appendix: Script Output

### Tool-by-Tool Analysis (AST-verified)

```
featurecam_get_document_info     | COM calls: NONE        | Unused params: none      | Stub: no  | Error: catch-return
featurecam_save_document         | COM calls: Save,SaveAs | Unused params: none      | Stub: no  | Error: catch-return
featurecam_invalidate_toolpaths  | COM calls: Invalidate  | Unused params: none      | Stub: no  | Error: catch-return
featurecam_generate_nc_code      | COM calls: NONE        | Unused params: none      | Stub: YES | Error: catch-return
featurecam_list_setups           | COM calls: NONE        | Unused params: none      | Stub: no  | Error: catch-return
featurecam_get_setup_details     | COM calls: NONE        | Unused params: none      | Stub: no  | Error: catch-return
featurecam_get_active_setup      | COM calls: NONE        | Unused params: none      | Stub: no  | Error: catch-return
featurecam_set_active_setup      | COM calls: NONE        | Unused params: none      | Stub: no  | Error: catch-return
featurecam_enable_setup          | COM calls: NONE        | Unused params: none      | Stub: no  | Error: catch-return
featurecam_get_stock_info        | COM calls: NONE        | Unused params: none      | Stub: no  | Error: catch-return
featurecam_export_stock          | COM calls: NONE        | Unused params: setup_name| Stub: YES | Error: catch-return
featurecam_list_tools            | COM calls: NONE        | Unused params: setup_name| Stub: no  | Error: catch-return
featurecam_get_tool_details      | COM calls: NONE        | Unused params: none      | Stub: no  | Error: catch-return
featurecam_list_solids           | COM calls: NONE        | Unused params: solid_type| Stub: no  | Error: catch-return
featurecam_export_solid          | COM calls: NONE        | Unused params: none      | Stub: YES | Error: catch-return
featurecam_list_ucs              | COM calls: NONE        | Unused params: none      | Stub: no  | Error: catch-return
featurecam_get_ucs_details       | COM calls: NONE        | Unused params: none      | Stub: YES | Error: catch-return
featurecam_list_features         | COM calls: NONE        | Unused params: none      | Stub: no  | Error: catch-return
featurecam_get_operations        | COM calls: NONE        | Unused params: none      | Stub: no  | Error: catch-return
featurecam_check_operation_errors| COM calls: NONE        | Unused params: setup_name| Stub: no  | Error: catch-return
featurecam_get_work_offsets      | COM calls: NONE        | Unused params: setup_name| Stub: YES | Error: catch-return
```

### Infrastructure Summary

```
COM Threading:    21 async handlers, 0 CoInitialize calls, 0 thread management
Connection:       Fresh Dispatch() per invocation, no caching, no liveness check
Error Handling:   0 ToolError, 0 com_error catches, 32 bare except Exception, 22 format_error_message
Security:         3 unvalidated makedirs, 1 unvalidated SaveAs, 0 path checks
Annotations:      0 destructiveHint=True, 7 readOnlyHint=False
Unused:           ExportFormat enum defined but never referenced
```
