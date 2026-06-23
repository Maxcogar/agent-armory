# PowerMill MCP Server

An MCP server that drives **Autodesk PowerMill** from Claude. Wraps the Autodesk PowerShape/PowerMill .NET API (`Autodesk.ProductInterface.PowerMILL`) and exposes it over the Model Context Protocol via stdio.

## Status

**v0.3.0** — 46 tools spanning project lifecycle, setup, tooling, drive geometry, toolpaths, discovery, NC programs, and escape hatches.

## Tools by category

**Connection (2)** — `connect_powermill`, `get_status`

**Project lifecycle (7)** — `open_project`, `new_project`, `save_project`, `save_project_as`, `close_project`, `import_project`, `import_template`

**Setup (5)** — `import_model`, `create_block`, `delete_block`, `create_workplane`, `set_units`

**Tooling (4)** — `create_tool` (5 typed factories: ball_nosed, end_mill, drill, tip_radiused, tap), `update_tool`, `list_tools`, `get_tool_details`

**Drive geometry (5)** — `create_boundary` (5 kinds: empty, from_file, block, silhouette, shallow), `list_boundaries`, `create_pattern`, `list_patterns`, `delete_entity`

**Toolpaths (6)** — `list_toolpaths`, `create_toolpath`, `create_toolpath_from_template`, `set_toolpath_links`, `calculate_toolpath`, `verify_toolpath`

**Discovery (5)** — `list_models`, `list_workplanes`, `list_setups`, `list_stock_models`, `list_machine_tools`

**NC programs (8)** — `list_nc_programs`, `create_nc_program`, `add_toolpaths_to_nc_program`, `configure_nc_program`, `set_nc_tool_handling`, `write_nc_program`, `batch_post`, `list_post_processors`

**Escape hatches & macros (4)** — `run_macro`, `query_parameter`, `start_macro_recording`, `stop_macro_recording`

## Architecture

- **Single process .NET Framework 4.8 .exe.** net48 is forced by the upstream Delcam API. Pre-installed on Win10 1903+ and Win11 — no runtime bundle needed.
- **STA-pinned COM worker thread.** All `PMAutomation` calls marshal onto one dedicated `ApartmentState.STA` thread. Mandatory — concurrent JSON-RPC requests would otherwise hit `RPC_E_WRONG_THREAD`.
- **Global tool execution mutex.** PowerMill is one process; tools run one at a time.
- **Hand-rolled JSON-RPC over stdio.** The official C# MCP SDK targets net8+ and can't be referenced from net48; the protocol itself is simple enough that hand-rolling is correct here. Supports inbound requests, server-initiated outbound requests (e.g., `roots/list`), notifications, and progress reports.
- **Cancellation routing.** Per-request CTS keyed by id; `notifications/cancelled` looks it up and cancels. Long-running tools (`calculate_toolpath`, `write_nc_program`, `batch_post`) check the token between polls.
- **Outbound request timeout.** Server-initiated requests time out after 30s if the host doesn't respond.
- **`ILogger` abstraction + `FileLogger`** writing to `%LOCALAPPDATA%\PowerMillMcp\logs\powermill-mcp-{date}.log`. The startup self-check logs success/failure of the Delcam DLL load probes — if those don't appear, the WPF orphan refs failed to resolve.

## Security model

Local MCP — no platform-level sandbox. The defenses are in tool handlers.

- **Path roots:** every path-taking tool routes through `SafePath.Resolve`, which requires the resolved path to be inside an allowed root. Allowed roots come from the `POWERMILL_PROJECT_ROOTS` env var (semicolon-separated absolute paths) plus host-advertised roots via `roots/list`. Default: `My Documents`.
- **Read-only system roots:** `list_post_processors` auto-allowlists the inferred PowerMill install folder (`C:\Program Files\Autodesk\PowerMill <year>\file\post_processors`) for read-only directory scans only. Write-path tools never see these system roots.
- **Macro escape hatch — explicit confirmation required every call.** `run_macro` requires `confirm_destructive: true` on every invocation; without it the call is rejected before reaching PowerMill.
- **Generic deletion confirmation.** `delete_entity` requires `confirm: true`.
- **Strategy allowlist.** `create_toolpath` validates the `strategy` parameter against the 56 known PowerMill strategy names before interpolating it into a macro — closes the macro-injection vector.
- **Entity name validation.** `tool_name`, `boundary_name`, `pattern_name` parameters reject control characters, double quotes, and backslashes — these break out of macro quoting.
- **Vec3 strictness.** Every `{x, y, z}` input requires all three coordinates to be present and numeric. Missing or non-numeric fields are rejected with a clear message rather than silently defaulting to 0.
- **Output cap.** Tool responses (`run_macro`, `query_parameter`, `write_nc_program` G-code preview) are truncated at 100,000 chars with a `[truncated]` marker.

## Build / test

Requires .NET 8 SDK (`dotnet --version` ≥ 8.0).

```bash
./build.ps1
```

What it does:
1. `dotnet build -c Release` — server + tests + Delcam refs.
2. `dotnet test -c Release` — 93+ unit tests covering SafePath, OutputCap, JsonRpcEnvelope, RootsRegistry, MacroConfirm, Logger (file + in-memory), strategy allowlist, vec3 readers, ToolDeps wiring, ProtocolVersion negotiation, InitializationGate, McpServerCancellation, OutboundRequestTimeout, ToolRegistry serialization, plus the path-rejection tests for OpenProjectTool, CreateBlockTool, CreateToolpathTool, DeleteEntityTool.
3. Stdio smoke test — pipes `initialize` + `notifications/initialized` + `tools/list` through the built exe and asserts `protocolVersion` echoed and 46 tools registered.
4. Print artifact path + SHA256.

Output: `bin\Release\net48\win-x64\PowerMillMcpServer.exe` plus dependent DLLs.

## Install (local development)

```bash
claude mcp add powermill --scope user -- "C:\Users\maxco\Documents\MCPs\PowerMillMcpServer\bin\Release\net48\win-x64\PowerMillMcpServer.exe"
```

Then in any Claude Code session, the tools above will be available. Start with `connect_powermill` before anything else.

## Integration test (live PowerMill)

Unit tests don't exercise COM. The `PowerMillMcpServer.IntegrationTests` project does — see `INTEGRATION.md` in that project. Run with:

```
set POWERMILL_INTEGRATION=1
set POWERMILL_PROJECT_ROOTS=C:\TEMP\powermill-integration
dotnet test PowerMillMcpServer.IntegrationTests
```

When `POWERMILL_INTEGRATION` is unset, integration tests skip themselves; CI runs in this mode.

## Logs

`%LOCALAPPDATA%\PowerMillMcp\logs\powermill-mcp-YYYY-MM-DD.log`

Look here when the server doesn't behave as expected. The startup self-check writes a line confirming Delcam DLL load — if it isn't there, something failed at process start.

## Troubleshooting

- **`tools/list` returns 0 tools.** Likely a Delcam DLL load failure during startup. Check the log for `Self-check FAILED` lines. Verify all `Autodesk.*.dll` files are next to `PowerMillMcpServer.exe`.
- **`RPC_E_WRONG_THREAD` from a tool.** Shouldn't happen — STA worker should isolate. If it does, file a bug with the log.
- **`No allowed roots configured`.** Set `POWERMILL_PROJECT_ROOTS` (semicolon-separated absolute paths) or have your host (Claude Code) advertise roots via `roots/list`.
- **`Path is not under any allowed root`.** Compare the path you sent against the allowed roots in the error message. Paths are case-insensitive on Windows but must be absolute.
- **`run_macro requires confirm_destructive: true`.** That's by design — the escape hatch always requires explicit confirmation.

## Project layout

```
PowerMillMcpServer.csproj   SDK-style csproj targeting net48
Program.cs                  Entry: stdout-redirect → logger → self-check → STA worker → registry → server
Mcp/
  JsonRpc.cs                Request/response/error/notification types + error codes
  StdioTransport.cs         Newline-delimited JSON over Console streams + write lock
  McpServer.cs              Dispatcher: protocol negotiation, init gate, tools/call, progress, cancellation, outbound requests
  RootsRegistry.cs          Env-var roots + roots/list integration + system roots for inferred read-only paths
Com/StaWorker.cs            STA-pinned thread + work queue
PowerMill/
  IPowerMillSession.cs      Interface for tool dependencies
  PowerMillSession.cs       PMAutomation lifecycle, async wrapper for COM calls
Util/
  ILogger.cs, FileLogger.cs, InMemoryLogger.cs, NullLogger.cs, Logger.cs (static facade)
  SafePath.cs               Path containment helper (Resolve, ResolveReadOnly)
  OutputCap.cs              100K-char output truncation
Tools/
  ToolDeps.cs, ToolRegistry.cs, ToolRegistration.cs, Schemas.cs, Strategies.cs (allowlist)
  ConnectionTools.cs, ProjectTools.cs, SetupTools.cs, ToolingTools.cs,
  BoundaryTools.cs, PatternTools.cs, EntityTools.cs, ToolpathTools.cs,
  NCProgramTools.cs, ParameterTools.cs, MacroTools.cs
manifest.json               MCPB packaging manifest (binary type, win32 only)
build.ps1                   Build + test + smoke-test + SHA256
README.md                   This file
```

## Notes

- The Delcam API has `Execute` / `ExecuteEx` marked `[Obsolete]` — they're the only public path to raw macro commands and are still functional. `run_macro` uses them deliberately.
- `Microsoft.Expression.Interactions` and `System.Windows.Interactivity` produce build warnings from `Delcam.Utilities`. The startup self-check exercises `Delcam.Utilities.FileSystem.Directory` and confirms it loads — if those refs are needed at runtime, the self-check would surface the failure in the log.
