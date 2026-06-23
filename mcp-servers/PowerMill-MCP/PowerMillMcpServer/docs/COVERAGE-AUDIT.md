# PowerMill MCP — Coverage Audit

> Date: 2026-06-22
> Server version audited: v0.3.0 (46 tools)
> Method: every registered tool (`Tools/*.cs`) was read and mapped against the
> **full public surface of `Autodesk.ProductInterface.PowerMILL`** as declared in
> the shipped API doc (`Autodesk.ProductInterface.PowerMILL.xml`, 145 public types).
> This audit measures what the wrapped API *can* do that the MCP does **not**
> expose — not merely the limits of the tools that already exist.

## Verdict

The MCP is a strong **job-setup-and-post** harness wrapped around a **thin
toolpath-authoring core**. It can open/create a project, import a model, define
stock and tools, scope with boundaries, create *default* toolpaths, calculate,
verify, and post NC — end to end. What it cannot do is **author a toolpath**: set
the machining parameters, leads/links, feeds/speeds, or tool axis that turn a
default strategy into a runnable operation. The single most important
architectural finding is that the API offers a large **strongly-typed** surface
(61 toolpath factories, 15 tool factories, 12 boundary factories, typed parameter
and lead objects) and the MCP **bypasses nearly all of it**, routing the central
operation — toolpath creation — through a generic macro that produces
default-parameter toolpaths.

## Coverage matrix

Legend: ✓ covered · ◐ partial · ✗ absent (reachable only via `run_macro`)

| Capability area | API typed surface | MCP typed tools | Status |
|---|---|---|---|
| Project lifecycle | full | open/new/save/save_as/close/import/import_template | ✓ |
| Model import | CreateModel / CreateReferenceModel | import_model (+ as_reference) | ✓ |
| Stock block | CreateBlock + CreateBlockFromBoundary(WithLimits) | create_block (from_file/around_model/cylinder) | ◐ no block-from-boundary |
| Units | LengthUnits | set_units | ✓ |
| Tool types | 15 factories | 5 (ball_nosed, end_mill, drill, tip_radiused, tap) | ◐ 10 unwrapped |
| Tool holder geometry | holder profile objects | holder *name* assignment only | ✗ |
| Boundaries | 12 factories | 5 (empty, from_file, block, silhouette, shallow) | ◐ 7 unwrapped |
| Boundary editing | offset/transform/insert | none | ✗ |
| Patterns | create + ReverseAll/ReverseSelected + edit | create (empty, from_file) | ◐ no editing |
| Workplanes | create + activate + from-geometry | create (explicit vectors only) | ◐ |
| **Toolpath creation (typed)** | **61 strategy factories** | **0** (generic `CREATE TOOLPATH` macro) | ✗ **core gap** |
| **Toolpath parameters** | typed props + `PMEntity.SetParameter` | none (macro only) | ✗ **core gap** |
| **Leads & links** | `PMLead`, `PMLeadExtension`, `PMRamp` | start/end *point* only (`set_toolpath_links`) | ✗ |
| **Feeds & speeds** | typed props | none | ✗ |
| **Tool axis / 5-axis** | typed props | none | ✗ |
| **Drilling cycles** | 13 typed cycles | 0 typed (generic `drill` strategy) | ✗ |
| Toolpath calculate | Calculate + IsBusy poll | calculate_toolpath | ✓ |
| Toolpath verify (gouge/holder) | DetectToolGouges / DetectHolderCollisions / SafetyReport | verify_toolpath | ✓ |
| Toolpath inspection | typed props | name/strategy/calculated/tool only (no `get_toolpath_details`) | ◐ |
| Toolpath edit/transform/copy/reorder | typed + collection ops | none (reorder only inside NC program) | ✗ |
| Stock models | CreateStockmodel + apply/rest | list_stock_models (read only) | ✗ create absent |
| Feature sets / hole machining | CreateFeatureset / FeatureFace / FeatureChamfer | none | ✗ |
| Feature groups | CreateFeaturegroup | none | ✗ |
| Levels / sets | CreateLevel / CreateSet | none | ✗ |
| Groups | PMGroupsCollection | none | ✗ |
| Setups (multi-axis/multi-op) | CreateSetup + config | list_setups (read only) | ✗ create absent |
| Machine tools | manage/import | list_machine_tools (read only) | ◐ list only |
| Model transforms | Move / Rotate / MirrorInPlane / Delete | import only (delete via generic delete_entity) | ◐ |
| NC program + posting | full chain | create/add/configure/tool-handling/write/batch/list_posts | ✓ |
| Entity deletion | per-type `.Delete()` | delete_entity (generic, confirm-gated) | ✓ |
| Introspection (read) | parameter tree | query_parameter | ✓ |
| Introspection (typed write) | `PMEntity.SetParameter` | none (raw macro only) | ✗ |
| Macro escape hatch | Execute / ExecuteEx | run_macro, start/stop_macro_recording | ✓ |

## The central architectural finding

`PMToolpathsCollection` exposes **61 strongly-typed `CreateXxxToolpath`
factories** (e.g. `CreateOffsetAreaClearanceToolpath`,
`CreateConstantZFinishingToolpath`, `CreateAdaptiveAreaClearanceToolpath`), each
returning a typed `PMToolpathXxx` object whose properties are the machining
parameters. The MCP uses **none** of them. Instead, `create_toolpath`
(`Tools/ToolpathTools.cs`) issues a raw macro `CREATE TOOLPATH ; <STRATEGY>`
against a 56-name allowlist and accepts defaults — its own description states the
result "usually still needs editing via run_macro."

Consequence: the typed parameter surface the API was designed to provide is
entirely unreachable through typed tools. Every parameter that defines a real
toolpath — stepover, stepdown, thickness (machining allowance), tolerance, cut
direction, feeds, speeds, lead-in/out, tool axis — can only be set by hand-writing
PowerMill macro commands. For an LLM-driven client this is the worst position:
the model must know PowerMill's macro syntax (and will hallucinate it), there is
no schema validation, and each call must pass `confirm_destructive: true` through
the macro-injection surface the allowlists exist to contain.

## Gaps by severity

### Critical — blocks the core value
- **Typed toolpath parameters** (stepover/stepdown/thickness/tolerance/cut
  direction) — no `set_toolpath_parameters`, and no `get_toolpath_details` to
  read them back. Every toolpath is created at defaults.

### Serious — common, safety-relevant workflows are macro-only
- **Leads & links** — only start/end *points* are typed; approach/retract moves
  (ramp/arc/plunge), link types, and rapid/safe-Z clearance heights are not,
  despite `PMLead`/`PMRamp`/`PMLeadExtension` existing in the API.
- **Feeds & speeds** — feed rate, plunge feed, spindle RPM, coolant on the toolpath.
- **Tool axis / 5-axis** — lead/lean, fixed direction, toward-point, automatic.
  A large surface for multi-axis work (e.g. turbocharger/impeller jobs) is absent.
- **Stock models / rest machining** — `CreateStockmodel` exists; the MCP only
  lists. Rest roughing — a core efficiency workflow — cannot be created.

### Moderate — frequent but workaroundable
- **Drilling cycles** — 13 typed cycles (peck, deep-drill, tap, ream, bore,
  thread-mill, …) reduced to a single generic `drill` strategy.
- **Tool library** — 10 of 15 tool types unwrapped (barrel, dovetail, form,
  thread-mill, routing, tapered, tipped-disc, off-centre, grooving-turning);
  holders can only be *named*, not geometrically defined.
- **Boundaries & patterns** — 7 of 12 boundary kinds unwrapped (rest,
  selected-surface, collision-safe, contact, boolean, stock-model-rest,
  user-defined); no boundary editing; patterns can't be created from model edges.
- **Workplanes & setups** — workplanes are explicit-vectors-only (no
  from-geometry, no activate); setups are read-only (no multi-op job creation).
- **Feature-based machining** — no feature sets/groups, no hole recognition.
- **Levels / sets / groups** — no organization-layer management.
- **Model operations** — no transform (Move/Rotate/Mirror), export, or analysis
  (draft/thickness/min-radius) that normally drives tool selection.
- **Template authoring** — templates can be *applied* but not *saved* or listed;
  the "production via templates" story is consume-only.
- **Typed parameter write** — `query_parameter` reads the parameter tree, but
  there is no typed counterpart wrapping `PMEntity.SetParameter`; writes go
  through raw macros.

### Minor / likely out-of-scope for a headless server
- ViewMill material-removal simulation and machine kinematic (collision)
  simulation. Note the safety-critical subset — gouge + holder-collision
  detection — *is* covered by `verify_toolpath`.
- DNC/machine connection, setup-sheet generation.

## What is genuinely well covered
- Project lifecycle — complete and well-guarded.
- Model/block/units setup.
- The NC-program/posting chain (create → add toolpaths → configure post →
  tool-handling → write/preview → batch → list posts) — thorough.
- Discovery/listing across every entity type.
- A real safety gate (`verify_toolpath`) and a complete, confirmation-gated
  macro escape hatch.

## Recommended priority order
1. **`get_toolpath_details` + `set_toolpath_parameters`** (stepover, stepdown,
   thickness, tolerance, cut direction, feeds/speeds) — moves the server from
   "creates default toolpaths you must fix by hand" to "produces runnable
   toolpaths." Build these on the typed `PMToolpathXxx` properties /
   `PMEntity.SetParameter`, not on macros.
2. **Leads & links** (`PMLead`/`PMRamp`) — required for safe real-world output.
3. **Tool axis / 5-axis** — unblocks multi-axis work.
4. **Stock-model creation + rest machining**, then **typed drilling cycles**.
5. Fill out tool types and boundary kinds from their existing factories
   (mechanical, low-risk, high-coverage-per-effort).

## Caveat on "reachable via macro"
`run_macro` can reach everything above — PowerMill's macro language is complete.
But "reachable via macro" is not "covered" for an LLM-driven tool: it sacrifices
schema validation, requires the model to author correct PowerMill macro syntax,
and routes through the injection surface the typed tools exist to avoid. The
typed tools are the product; the macro hatch is the fallback.
