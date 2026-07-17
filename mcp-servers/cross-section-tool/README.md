# Cross-Section Tool (`xsect`)

An MCP server for building **dimension-driven 2D cross sections** with
provenance you can trust on the shop floor. Every magnitude in a drawing is a
named dimension or an expression over dimensions — never a bare number — and
every dimension carries a tier: **measured > derived > recalled > assumed**.
The render tells you, loudly, when geometry rests on anything weaker than a
measurement. Sections compose from profiles through a real 2D constraint
solver (SolveSpace), render to exact-arc SVG (inline via MCP Apps on hosts
that support it), and export DXF R2010 that Fusion 360 ingests as native
lines and arcs — no polyline approximations anywhere in the pipeline.

Built with Python 3.11, FastMCP 3.4.3, python-solvespace 3.0.8, ezdxf 1.4.4.

---

## Why this exists

Sketching a section of a bore stack, a shaft fit, or a weldment throat by
hand mixes three kinds of numbers: things you measured, things you computed,
and things you half-remember. CAD treats them all identically. This tool
does not. A dimension defined as `recalled` or `assumed` poisons everything
derived from it (effective tier = weakest link in the chain), and any render
whose *driving* dimensions include a weak tier carries a visible
**SKETCH — NOT MEASURED** banner plus a per-dimension evidence table. You can
hand the SVG to someone at the machine and they know exactly which numbers to
re-verify before cutting.

## The seven tools

| Tool | Purpose |
| --- | --- |
| `xsect_create_document` | New document (mm only in v1). Returns `doc_id`. |
| `xsect_define_dimensions` | Named dimensions with tier + provenance. `derived` takes a `relation` expression, never a value. |
| `xsect_update_inputs` | Change input values; every dependent rederives in topological order. Targeting a derived dim is rejected. |
| `xsect_add_profile` | Relative drawing ops (`start`, `line`, `line_to`, `arc`, `arc_to`, `fillet`, `close`, `half_section`, `symmetry_axis`) compiled to exact line/arc loops. Magnitudes are strings — dimension names or expressions. JSON numbers are rejected. |
| `xsect_compose` | Place components with constraints (`concentric`, `coincident`, `distance`, `axis_align`). WELL applies transforms; UNDER/OVER return diagnostics, never geometry. |
| `xsect_render` | SVG + evidence report + constraint state. Carries the MCP Apps view (`ui://xsect/view.html`) for hosts with the apps capability; text-only hosts get the same facts as text. |
| `xsect_export_dxf` | DXF R2010, `$INSUNITS=4` (mm), LINE/ARC/CIRCLE only, per-component `XSECT_<NAME>` layers, centerlines on `XSECT_CENTER`. Content-addressed filename inside the server's export directory. |

`xsect_inspect` (read-only) dumps dimensions with tiers and derivation
chains, profiles, and composition state for any document.

## A complete example: shaft in housing

```text
xsect_create_document  name="Shaft Fit"
xsect_define_dimensions  doc_id=... dimensions=[
  {"name":"housing_l","unit":"mm","tier":"measured","value":50.0,"source":"caliper"},
  {"name":"housing_h","unit":"mm","tier":"measured","value":30.0,"source":"caliper"},
  {"name":"shaft_d","unit":"mm","tier":"recalled","value":12.0,"source":"print, from memory"},
  {"name":"shaft_l","unit":"mm","tier":"measured","value":40.0,"source":"caliper"},
  {"name":"stickout","unit":"mm","tier":"assumed","value":15.0,"basis":"assembly guess"}]
xsect_add_profile  name="housing" ops=[
  {"op":"start"},
  {"op":"line_to","x":"housing_l*0","y":"housing_h/2"},
  {"op":"line_to","x":"housing_l","y":"housing_h/2"},
  {"op":"line_to","x":"housing_l","y":"housing_h*0"},
  {"op":"half_section","axis":"X"}]           # open path, ends on axis; mirrored + closed
xsect_add_profile  name="shaft"  ops=[ ...same shape with shaft_l / shaft_d... ]
xsect_compose  components=[
  {"name":"H","profile":"housing","fixed":true},
  {"name":"S","profile":"shaft"}]
 constraints=[
  {"id":"coax","kind":"axis_align","a":"S.axis.X","axis":"X"},
  {"id":"stick","kind":"distance","a":"H.origin","b":"S.origin",
   "dim":"stickout","along":"X"}]
xsect_render      # SKETCH banner: shaft_d is recalled, stickout is assumed
xsect_export_dxf  # -> exports/shaft-fit-....dxf, open directly in Fusion 360
```

Constraint refs: `<component>.origin`, `<component>.edge<k>.start|end|center`,
op aliases `<component>.<ref>.start|end|center` (from an op's `"ref"` label),
`<component>.axis.X|Y` (declared via `symmetry_axis` / `half_section`), and
`section.origin`. `distance` takes a **dimension name**, never a literal.

## Guarantees

* **Determinism (SVG).** Same inputs produce byte-identical SVG — across
  repeat renders, across fresh interpreters, and across a snapshot
  save/reload. Enforced by `tests/determinism/`.
* **Determinism (DXF).** ezdxf stamps creation dates in the header, so the
  promise is entity-level: identical kinds, layers, and coordinates, and an
  identical content-addressed filename. Two exports of the same section
  produce the same name and the same decoded geometry.
* **Exact arcs end to end.** The model, the SVG (`A` path commands), and the
  DXF (ARC/CIRCLE entities) share one arc representation. Nothing is ever
  tessellated.
* **No silent placement.** UNDER returns remaining DOF; OVER returns the
  offending constraint ids; neither ever returns geometry. A render of an
  unplaced section carries diagnostics instead of a drawing.
* **Snapshots replay, never resurrect.** The store persists *inputs*
  (dimensions, ops, components, constraints). Loading re-runs the full
  validation and solve pipeline; a corrupt or hand-edited snapshot fails
  loudly at load.

## Honest limitations (v1)

* **Units:** mm only. Angle dimensions may be labeled `rad`/`deg`; internal
  math is radians (`deg(45)` in expressions).
* **Caps:** 40 dimensions (caller-named), 12 profiles, 8 components,
  24 constraints, 400 edges per profile. Exceeding any is a typed error.
* **One fixed component** per composition; everything else is placed by
  constraints relative to it (composing with no constraints requires the
  single component to be fixed).
* **Solver convergence envelope.** SolveSpace solves from a deterministic
  initial guess (components at identity). Constraint sets requiring large
  rotations to reach feasibility — e.g. a coincident plus a free distance
  whose solution sits ~90°+ away — can report `over_constrained /
  inconsistent` rather than converge. The robust idiom for coaxial parts is
  `axis_align` + a `distance` `along` the axis. Redundant-but-consistent
  sets (two coincidents pinning the same rigid body) are rejected by
  SolveSpace by design; the error message says which constraint to drop.
* **OVER attribution is "start here", not "only culprit."** The offender
  list comes from SolveSpace and empirically names a nondeterministic subset
  of the redundant set (~1% of identical runs return no attribution at all,
  in which case the server lists every constraint as a candidate). The list
  is never empty; treat it as where to begin relaxing.
* **Profile names** must match `[A-Za-z_][A-Za-z0-9_]*` — they prefix
  auto-registered geometry dimensions, which live in the expression
  namespace. Component names are free-form (hostile characters are escaped
  in SVG output).
* **MCP Apps** inline rendering requires a host with the apps capability
  (spec revision 2026-01-26). Text-only hosts receive the same summary,
  banner, and evidence as plain text — nothing load-bearing is lost.

## Install & run

Requires **CPython 3.11** (python-solvespace 3.0.8 ships Windows/macOS
wheels for 3.11; on Linux it builds from sdist and needs a C++ toolchain —
`cmake` + a compiler).

```bash
uv venv --python 3.11
uv sync            # runtime + dev groups
uv run xsect-server
```

Environment:

| Var | Default | Meaning |
| --- | --- | --- |
| `XSECT_HOST` | `127.0.0.1` | Bind address. Keep loopback; publish via Tailscale Serve. |
| `XSECT_PORT` | `8765` | HTTP port (Streamable HTTP transport). |
| `XSECT_DATA_DIR` | `~/.xsect` | Documents (`docs/`), exports (`exports/`), registry. |

### Private deployment (Windows + Tailscale)

The server binds loopback only and speaks Streamable HTTP at `/mcp`. Publish
it to your tailnet without any public exposure:

```powershell
tailscale serve --bg --https=443 --set-path /xsect http://127.0.0.1:8765
```

Run it as a native Windows service (survives reboot, no auto-login) with
[Shawl](https://github.com/mtkennerly/shawl):

```powershell
shawl add --name xsect -- uv --directory C:\path\to\cross-section-tool run xsect-server
sc.exe config xsect start= auto
sc.exe start xsect
```

Then register `https://<machine>.<tailnet>.ts.net/xsect/mcp` as a custom
connector. DXF exports land in `%USERPROFILE%\.xsect\exports` on the
machine running the server — a directory you can reach from Fusion 360.

## Development

```bash
uv run pytest            # 100 tests: unit, determinism, acceptance
uv run ruff check src tests
uv run mypy src          # strict
```

Test layout mirrors the guarantees: `tests/unit/` covers expressions,
dimensions/derivation, profiles, geometry, solver adapter, store, evidence/
render/export, and an AST-walk import contract; `tests/determinism/` proves
the byte-identity promises; `tests/acceptance/` drives the real FastMCP
server through the in-memory client (AC-1..AC-10 — inferred from the
architecture's FR/NFR set, since the original spec document was not
available in the build environment).

## Architecture

```
server (FastMCP tools, MCP Apps view, payload budget)
  └─ store (snapshot inputs, replay-on-load)   report (evidence, tiers, banner)
     render (SVG, hatch, centerlines, badges)  export (DXF R2010)
        └─ section (compose, normalize constraints, resolve)
             └─ solve (SolverAdapter protocol → python-solvespace)
                  └─ model (dimensions, expressions, derivation, profiles,
                            geometry — stdlib only)
```

The layering is enforced structurally by `tests/unit/test_import_contract.py`
(AST walk): the model layer imports nothing outside the stdlib, render/export
never touch the solver, the solver never touches upper layers, and `fastmcp`
appears only under `server`.
