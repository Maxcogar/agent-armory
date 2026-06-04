# PowerMill MCP Integration Tests

These tests exercise the MCP server against a **real running PowerMill instance**. They are gated by an environment variable so CI and local builds skip them.

## Prerequisites

- Windows with PowerMill installed and licensed.
- PowerMill running with a fresh empty session (no project loaded). The fixture attaches to the running instance.
- A writable directory for test artifacts.

## Run

```cmd
set POWERMILL_INTEGRATION=1
set POWERMILL_PROJECT_ROOTS=C:\TEMP\powermill-integration
mkdir C:\TEMP\powermill-integration
dotnet test PowerMillMcpServer.IntegrationTests
```

When `POWERMILL_INTEGRATION` is unset (the default in CI), every `[IntegrationFact]` test reports as skipped and the build stays green.

Expected runtime: ~5-10 minutes, depending on machine speed and PowerMill startup latency. The fixture pays the COM-attach cost once and shares it across all tests via `[Collection("Live")]`.

## Tool coverage matrix

Every one of the 38 v1 tools is exercised by at least one integration test. If a row says "validation only", the unit-test suite covers the happy path through `FakePowerMillSession` and the integration test exercises the security gate.

| Tool | Coverage |
|---|---|
| connect_powermill | T01 (via fixture init) |
| get_status | T01 |
| open_project | T02 |
| new_project | T02 |
| save_project | T02 |
| save_project_as | T02 |
| close_project | T02 |
| import_project | manual checklist (requires existing project on disk) |
| import_template | manual checklist (requires .ptf in test fixtures) |
| import_model | T03 |
| create_block | T03 (cylinder) |
| delete_block | T03 |
| create_workplane | manual checklist (requires meaningful axes) |
| set_units | T03 |
| create_tool | T04 (end_mill, tip_radiused, drill) |
| update_tool | T04 (tip_radius mismatch — validates #11) |
| list_tools | T04 |
| get_tool_details | T04 |
| create_boundary | T05 (empty) |
| list_boundaries | T05 |
| create_pattern | T06 |
| list_patterns | T06 |
| delete_entity | T10 |
| list_toolpaths | T07 |
| create_toolpath | T07 (allowlist + injection rejection — validates #1) |
| create_toolpath_from_template | manual checklist (requires .ptf) |
| set_toolpath_links | manual checklist (requires calculated toolpath) |
| calculate_toolpath | manual checklist (requires fully-parameterized toolpath) |
| verify_toolpath | manual checklist |
| create_nc_program | T08 |
| add_toolpaths_to_nc_program | manual checklist (requires real toolpaths) |
| configure_nc_program | manual checklist (requires .pmoptz post on disk) |
| set_nc_tool_handling | T08 |
| write_nc_program | manual checklist (requires configured NC program) |
| batch_post | manual checklist |
| list_post_processors | T08 (validates #3 default path) |
| run_macro | T09 (gate + happy path) |
| query_parameter | T09 |

## Manual checklist

Items marked "manual checklist" require external prerequisites (a real `.ptf`, a calculated toolpath, a configured post). Run the existing tests as a foundation, then walk through the manual list with a real CAM job. Document the manual run in the project tracker.

For each manual item:
1. Open a real PowerMill project that has the prerequisites.
2. Run the tool via Claude Code (the registered MCP) or directly through the MCP harness.
3. Verify the result matches expectation.
4. If a tool produces an output file (e.g., `write_nc_program`), inspect the file.

## What success looks like

- All `[IntegrationFact]` tests pass with `POWERMILL_INTEGRATION=1`.
- The startup log file at `%LOCALAPPDATA%\PowerMillMcp\logs\powermill-mcp-<today>.log` contains a line like:
  `[INFO] Startup self-check OK (4 probes passed)`
- No tool returns "RPC_E_WRONG_THREAD" or similar COM threading errors.
- Path-rejection tests (T07 injection, T10 confirm) reject before reaching PowerMill.

## What failure looks like (and what to do)

- **Fixture init throws on connect**: PowerMill isn't running, or the COM registration is wrong. Open PowerMill manually first; check that `pmill.exe` is in the registry.
- **Self-check FAILED in log**: a Delcam DLL didn't load. Look for missing assemblies next to `PowerMillMcpServer.exe`.
- **A test fails with a path error**: `POWERMILL_PROJECT_ROOTS` doesn't include the path the test wrote to. Check the env var.
- **Tests pass but the visible PowerMill GUI doesn't update**: that's expected during automation; the GUI doesn't always refresh between rapid macro commands.
