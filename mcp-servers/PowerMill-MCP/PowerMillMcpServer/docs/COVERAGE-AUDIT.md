# PowerMill MCP — Coverage Audit

> Date: 2026-06-22
> Server version audited: v0.3.0 (46 tools)
>
> **Method.** Every registered tool (`Tools/*.cs`) was read and mapped against the
> **complete** public surface of `Autodesk.ProductInterface.PowerMILL` as declared
> in the shipped API doc (`Autodesk.ProductInterface.PowerMILL.xml`). The full
> surface was enumerated — not sampled:
>
> | Member kind | Count |
> |---|---|
> | Public types (`T:`) | 146 |
> | Methods (`M:`) | 552 |
> | Properties (`P:`) | 348 |
> | Fields / enum values (`F:`) | 138 |
>
> Every entity type's full property and method list was extracted and is
> reproduced below with per-member coverage marks. This audit measures what the
> wrapped API can do that the MCP does **not** expose.

Legend: ✓ wrapped by a typed tool · ◐ partial · ✗ absent (reachable only via
`run_macro` / `query_parameter`) · — out of scope for a headless server (GUI/view).

---

## Verdict

The MCP covers the **job spine** — open/create project, import model, define
stock and tools, scope with boundaries, create *default* toolpaths, calculate,
verify, post NC — completely and with good guardrails. What it does **not** do is
**configure** anything it creates. There is no tool to set a single machining
parameter on a toolpath, no tool to set leads/links or feeds/speeds, no tool axis
control, and no way to create the in-process and feature entities the API
supports (stock models, feature sets, levels, setups, groups).

Two corrections to the first draft of this audit, found by enumerating the full
property surface rather than the factory list alone:

1. **Per-strategy machining parameters are not typed.** The 61
   `CreateXxxToolpath` factories return typed subclasses, but those subclasses
   (`PMToolpathRasterAreaClearance`, `PMToolpathConstantZFinishing`, …) declare
   **zero** additional documented properties. Stepover, stepdown, thickness, and
   tolerance live only in the parameter tree — reachable via `GetParameter` /
   `SetParameter` / macro, never as typed members. A "proper" typed wrapper
   could not avoid the parameter tree for these.
2. **Leads/links and feeds/speeds *are* typed — and fully unwrapped.** The base
   `PMToolpath` exposes feeds/speeds and a `Connections` object
   (`PMConnections`, 32 properties, plus `PMLead` and `PMRamp`). This is a
   complete, typed configuration subsystem the MCP ignores entirely.

So the central gap is **configuration**, and it splits in two: a typed subsystem
that exists but is unwrapped (leads/links/feeds), and an untyped parameter tree
that has no typed write tool (`SetParameter`) wrapping it.

---

## Session level — `PMAutomation`

| API member | MCP | Notes |
|---|---|---|
| `LoadProject` | ✓ | open_project |
| `CloseProject` | ✓ | close_project |
| `Reset` | ✓ | new_project |
| `Save` / `SaveAs` (on PMProject) | ✓ | save_project / save_project_as |
| `Execute` / `ExecuteEx` / `DoCommand(Ex)` | ✓ | run_macro |
| `RecordMacro` / `StopMacroRecording` / `LoadMacro` / `RunMacro` | ◐ | start/stop_macro_recording (no load/run-file) |
| `GetPowerMillParameter` / `GetPowerMillEntityParameter` | ◐ | query_parameter (read only; string only) |
| `Units` | ✓ | set_units |
| `IsBusy` | ✓ | used internally for calculate/post polling |
| `CheckCollisionStatus` / `CollisionsOn` / `CollisionsOff` | ✗ | machine collision checking not exposed |
| `SetActivePlane` | ✗ | set active workplane not exposed |
| `SubstitutionTokens` | ✗ | output-name token substitution not exposed |
| `Quit` | ✗ | by design — server keeps PowerMill alive |
| `SetViewAngle` / `UndrawAll` / `DialogsOn/Off` / `IsGUIVisible` / `RefreshOn/Off` / `EchoCommands*` | — | GUI/view — out of scope headless |

---

## Per-entity coverage

### Project — `PMProject`
API: `CreateBlock` ✓, `CreateBlockFromBoundary` ✗, `CreateBlockFromBoundaryWithLimits` ✗,
`DeleteBlock` ✓ (delete_block), `ExportBlock` ✗, `GetBlockLimits` ✗,
`ImportProject` ✓, `ImportTemplateFile` ✓, `Save`/`SaveAs` ✓,
`AddEntityToCollection`/`RemoveEntityFromCollection` ✗, `ActiveWorkplane` (set) ✗.
Collection accessors (Models, Toolpaths, …) all read via list_* tools. ✓

### Models — `PMModelsCollection` / `PMModel`
API: `CreateModel` ✓, `CreateReferenceModel` ✓ (import_model as_reference),
`ExportModel` / `ExportAllModels` ✗, `Move` ✗, `Rotate` ✗, `MirrorInPlane` ✗,
`Reimport` ✗, `Delete` ◐ (generic delete_entity), `DeleteEmptyModels` ✗,
`DeleteSelectedSurfaces` ✗, selection methods ✗, `Level`/`Transparency`/`IsActive` ✗.
**Status: import-only.** No transform, export, reimport, or analysis.

### Tools — `PMToolsCollection` / `PMTool`
API factories (15): BallNosed ✓, EndMill ✓, Drill ✓, TipRadiused ✓, Tap ✓ —
Barrel ✗, Dovetail ✗, Form ✗, OffCentreTipRadiused ✗, Routing ✗,
TaperedSpherical ✗, TaperedTipped ✗, ThreadMill ✗, TippedDisc ✗,
GroovingTurning ✗.
Properties wrapped: Diameter ✓, Length ✓, TipRadius ✓, HolderName ✓,
ToolNumber ✓, NumberOfFlutes ✓, Overhang ✓, Description ✓, Coolant (read) ◐.
Holder/shank **geometry** (`HolderElement*`, `ShankElement*`, `GaugeLength`,
`HolderLength`, `ExportHolder/Shank/Tip`) ✗ — holders can be *named* only.
**Status: 5 of 15 types; holder geometry absent.**

### Boundaries — `PMBoundariesCollection` / `PMBoundary`
API factories (12): Empty ✓, fromFile ✓, Block ✓, Silhouette ✓, Shallow ✓ —
BooleanOperation ✗, CollisionSafe ✗, ContactConversion ✗, ContactPoint ✗,
Rest ✗, SelectedSurface ✗, StockModelRest ✗ (UserDefined type exists, no factory).
Editing (`InsertBoundary`, `InsertFile`, `InsertToolpath`, `Flat`, `Smash`,
`ToPolylines`, `ToSplines`, `WriteToFile`) ✗.
**Status: 5 of 12 kinds; no editing/export.**

### Patterns — `PMPatternsCollection` / `PMPattern`
API: `CreateEmptyPattern` ✓, `CreatePattern`(file) ✓ — create-from-model-edges ✗.
Editing (`ArcFit*`, `Close*`, `Merge*`, `Polygonise*`, `Reverse*`, `Spline*`,
`Split*`, `InsertFile`, `InsertToolpath`, `WriteToFile`) ✗.
**Status: 2 create modes; no editing/export.**

### Workplanes — `PMWorkplanesCollection` / `PMWorkplane`
API: `CreateWorkplane`(from frame) ✓. From-geometry creation ✗, activation
(`PMProject.ActiveWorkplane` / `PMAutomation.SetActivePlane`) ✗, reposition ✗.
**Status: explicit-vector create only.**

### Toolpaths — `PMToolpathsCollection` / `PMToolpath`(+61 subclasses)
- **Creation:** 61 typed `CreateXxxToolpath` factories — **0 wrapped.**
  `create_toolpath` uses a generic `CREATE TOOLPATH ; <STRATEGY>` macro against a
  56-name allowlist; `create_toolpath_from_template` applies `.ptf`.
- **13 of the 61 are drilling cycles** (BreakChip, CounterBore, DeepDrill,
  ExternalThread, FineBoring, Helical, Profile, Ream, RigidTapping, SinglePeck,
  Tap, ThreadMill, plus base Drilling) — **0 wrapped** (generic `drill` only).
- **Calculate** ✓ (calculate_toolpath), **verify** ✓ (verify_toolpath:
  DetectToolGouges + DetectHolderCollisions + SafetyReport).
- **Base `PMToolpath` properties (55):** wrapped only `Name`, `Strategy`,
  `IsCalculated`, `Tool*` (read in list_toolpaths/calculate), `TotalCutLength`,
  `TotalCuttingTime`, `StartPointMethod`/`EndPointMethod` (set_toolpath_links).
  **Unwrapped:** `CuttingFeed`, `PlungingFeed`, `SkimFeed`, `SpindleSpeed`,
  `SurfaceSpeed`, `FeedPerTooth`, `LeadInFactor`, `LeadOutFactor`,
  `Holder*Safety`, `Tool*Safety`, `StartPointApproach*`, `EndPointApproach*`,
  `NumberOfLeads`/`Links`, `Connections`, `ToolZAxisVector`, all timing
  breakdowns. ✗
- **Leads & links subsystem** — `Connections` → `PMConnections` (LeadIn,
  LeadOut, FirstLeadIn, LastLeadOut, ShortLink/LongLink/DefaultLink, Link1st–5th,
  ApproachDistance, RetractDistance, GougeCheck, ArcFitRadius, …32 props) plus
  `PMLead` (Angle/Distance/MoveType/Radius) and `PMRamp` (CircleDiameter,
  RampHeight, MaxZigAngle, …). **Entirely unwrapped.** ✗
- **Per-strategy machining params** (stepover/stepdown/thickness/tolerance):
  not typed anywhere — parameter tree only, no typed write tool. ✗
- **Edit/transform/copy/reorder:** `DeleteToolpath` ◐ (delete_entity),
  `OrderByExplorer` ✗, `Duplicate` (PMEntity) ✗, transform ✗.

**Status: create-default + calculate + verify + report. No configuration.**

### Stock models — `PMStockModelsCollection` / `PMStockModel`
API: `CreateStockmodel` ✗, properties `Stepover`/`Tolerance`/`RestThickness`/
`DetectOverhang`/`States`/`Workplane` ✗, `ApplyBlock`/`ApplyToolFirst|Last`/
`ApplyToolpathFirst|Last` ✗. list_stock_models reads only.
**Status: read-only. Rest-machining workflow uncreatable.**

### Feature sets / groups — `PMFeatureSetsCollection` / `PMFeatureGroupsCollection`
API: `CreateFeatureset` ✗, `CreateFeaturegroup` ✗; toolpath types
`PMToolpathFeatureFaceMachining` / `PMToolpathFeatureChamferMachining` ✗.
**Status: feature-based / hole machining entirely absent.**

### Levels & sets / Groups — `PMLevelOrSetsCollection` / `PMGroupsCollection`
API: `CreateLevel` ✗, `CreateSet` ✗, level select methods ✗, groups ✗.
**Status: organization layers absent.**

### Setups — `PMSetupsCollection` / `PMSetup`
API: create ✗, `Toolpaths` membership ✗. list_setups reads only.
**Status: read-only. Multi-op/multi-axis setup creation absent.**

### Machine tools — `PMMachineToolsCollection` / `PMMachineTool`
API: import/manage ✗. list_machine_tools reads only.
**Status: read-only.**

### NC programs — `PMNCProgramsCollection` / `PMNCProgram`
API: `CreateNCProgram` ✓, `AddToolpath`/`AddToolpathAtPosition` ✓,
`RemoveToolpath` ✗ (only via macro today), `Write` ✓, all config props
(MachineOptionFileName, OutputFileName, OutputWorkplaneName, PartName,
ProgramNumber, ToolChange, ToolChangePosition, ToolNumbering, ToolValue) ✓.
**Status: strong — the most complete subsystem. Only `RemoveToolpath` missing.**

### Entity base — `PMEntity` (inherited by all)
API: `SetParameter` ✗ (**typed write path — no tool wraps it**),
`GetParameterDoubleValue`/`GetParameterBooleanValue` ✗ (query_parameter returns
strings only), `Duplicate` ✗ (copy any entity), `IsActive`/activation ✗,
`Delete` ◐ (generic delete_entity), `Name`/`Exists` read ✓.

---

## Whole subsystems absent
- Toolpath **configuration** (parameters, leads/links, feeds/speeds, tool axis).
- **Stock models** + rest machining.
- **Feature sets / groups** + hole/feature machining + most drilling cycles.
- **Levels / sets / groups** (organization).
- **Setups** creation (multi-op / multi-axis jobs).
- **Model** transforms / export / analysis.
- **Boundary & pattern** editing; ~half their creation kinds.
- Typed **parameter write** (`SetParameter`) and typed reads.
- **Entity duplication** and **activation**.
- Machine **collision** checking (`CheckCollisionStatus`).

## Severity-ranked gaps
**Critical (blocks the core value):** toolpath parameter configuration —
nothing the server creates can be tuned. Needs a typed-write tool over
`SetParameter` (for stepover/stepdown/thickness/tolerance) plus a
`get_toolpath_details` reader.

**Serious (common, safety-relevant, and *already typed* in the API):**
leads & links (`PMConnections`/`PMLead`/`PMRamp`); feeds & speeds (base
`PMToolpath` props); tool axis (`ToolZAxisVector` + parameter tree); stock-model
creation + rest machining (`CreateStockmodel` + Apply*).

**Moderate:** typed drilling cycles (13); remaining tool types (10) and holder
geometry; remaining boundary kinds (7) and boundary/pattern editing; workplane
activation + from-geometry; setups; feature/hole machining; levels/sets/groups;
model transforms; template authoring (save/list `.ptf`); `RemoveToolpath`;
entity `Duplicate`; collision checking.

**Minor / out of scope:** ViewMill material simulation, machine kinematic
simulation (note: gouge + holder-collision detection *is* covered by
verify_toolpath), DNC, setup sheets, all GUI/view operations.

## Priority recommendations
1. **`get_toolpath_details` + `set_toolpath_parameters`** over `GetParameter*` /
   `SetParameter` — turns "creates default toolpaths you fix by hand" into
   "produces tunable toolpaths." Highest leverage by far.
2. **Leads & links + feeds/speeds** — wrap the *already-typed* `PMConnections` /
   `PMLead` / `PMRamp` and base feed/speed properties. Safety-critical, low risk.
3. **Tool axis** — unblocks multi-axis work.
4. **Stock-model creation + rest machining**, then **typed drilling cycles**.
5. Mechanical fill-ins from existing factories: remaining tool types and boundary
   kinds (high coverage per unit effort, low risk).

## Caveat on "reachable via macro"
`run_macro` + `query_parameter` reach everything above — the macro/parameter tree
is a superset of the typed API. But "reachable via macro" is not "covered" for an
LLM-driven client: it forfeits schema validation, requires the model to author
correct PowerMill macro/parameter syntax (which it will hallucinate), and routes
through the injection surface the typed tools exist to contain. The typed tools
are the product; the macro hatch is the fallback.
