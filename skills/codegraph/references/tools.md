# codegraph tool reference

Exact parameters and return shapes for all 18 codegraph tools, verified against
the server source (`mcp-servers/codegraph-mcp/src`). Read this when you need a
precise field name, are wiring codegraph into a hook/script, or a return shape
in `SKILL.md`'s workflows isn't enough.

Every query tool requires a prior `codegraph_scan`; without it they return a
"no graph loaded" error. All file arguments accept an absolute path, a path
relative to the project root, or a bare unique filename (fuzzy-resolved).

## Contents

- [Setup & lifecycle](#setup--lifecycle): `scan`, `watch_start`, `watch_stop`
- [Navigation](#navigation): `get_dependencies`, `get_dependents`, `get_subgraph`, `get_path_between`
- [Impact & doc-sync](#impact--doc-sync): `get_change_impact`, `find_related_docs`
- [Architecture](#architecture): `get_stats`, `get_layers`, `find_cycles`, `find_orphans`, `find_entry_points`
- [Inventory](#inventory): `list_files`, `list_docs`
- [Export](#export): `export_mermaid`, `export_dot`

The `language` filter, where present, accepts: `javascript`, `typescript`,
`python`, `cpp`, `arduino`, `unknown`.

---

## Setup & lifecycle

### codegraph_scan
**Call first.** Scans `root_dir` and builds the graph. Reuses the on-disk cache
for an incremental rescan when one exists; `force: true` does a full rebuild.

| Param | Type | Required | Notes |
|---|---|---|---|
| `root_dir` | string | yes | **Absolute** path to the project root. |
| `ignore_patterns` | string[] | no | Glob patterns that **replace** the defaults entirely. |
| `additional_ignore_patterns` | string[] | no | Extra globs **appended** to the defaults (e.g. `["**/test/**"]`). |
| `force` | boolean | no | Bypass cache + in-memory graph for a full rebuild. |

Default ignores: `node_modules`, `.git`, `dist`, `build`, `__pycache__`,
`.venv`, `.pio`, `*.min.js`.

Returns: `{ status, mode ("full"|"incremental"), delta?, rootDir, totalFiles,
totalDocFiles, byLanguage, parseErrors, parseErrorDetails?, message }`.

Incremental rescans are mtime-based — see the caveat in `SKILL.md` ("scan
first"). Use `force: true` after editing `tsconfig.json` or to recover from a
stale incremental result.

### codegraph_watch_start
Watches the scanned project and keeps the graph current via debounced
incremental rescans. One watcher per server; calling again restarts it on the
current root. No params. Returns `{ status, watching, rootDir, message }`.

### codegraph_watch_stop
Stops the active watcher. Safe to call when nothing is watching. No params.
Returns `{ status, wasWatching, message }`.

---

## Navigation

### codegraph_get_dependencies
What a file **imports/includes** (its direct dependencies).

| Param | Type | Required |
|---|---|---|
| `file` | string | yes |

Returns the queried file plus a list of imported files with their languages.

### codegraph_get_dependents
What **imports** a file (who breaks if it changes).

| Param | Type | Required |
|---|---|---|
| `file` | string | yes |

Returns: `{ file, relativePath, language, dependents: FileRef[], dependentCount }`.
`dependentCount: 0` ⇒ nothing imports it (deletion candidate — but confirm it
isn't a legitimate entry point first).

### codegraph_get_subgraph
Local neighborhood around a file in **both** directions (dependencies and
dependents).

| Param | Type | Required | Notes |
|---|---|---|---|
| `file` | string | yes | Center of the neighborhood. |
| `depth` | number | no | Hops in each direction, 1–5, default 2. |

Returns nodes annotated with distance from center and direction.

### codegraph_get_path_between
Shortest import chain `from → … → to`, following import direction.

| Param | Type | Required |
|---|---|---|
| `from` | string | yes |
| `to` | string | yes |

Returns: `{ from, to, path | null, found, length (0 if from===to, null if not
found), reverseExists }`. When `found: false`, `reverseExists` tells you whether
the reverse dependency exists instead.

---

## Impact & doc-sync

### codegraph_get_change_impact
Full blast radius (direct + transitive dependents) of changing one or more files.

| Param | Type | Required | Notes |
|---|---|---|---|
| `files` | string[] | yes | 1–20 file paths. |

Returns: `{ changedFiles, directlyAffected, transitivelyAffected, totalImpacted,
blastRadius, coveragePercent }`.

> **`blastRadius` here is a NUMBER** = `changedFiles.length + totalImpacted`
> (verified in source). It is *not* the array of files. `coveragePercent` is
> `blastRadius / totalFiles * 100`.

### codegraph_find_related_docs
Given changed code files, the **complete** set of docs that reference anything
in their blast radius — for enforcing doc-sync. Deterministic, no judgment calls.

| Param | Type | Required | Notes |
|---|---|---|---|
| `files` | string[] | yes | 1–50 changed file paths. |

Returns: `{ changedFiles, blastRadius, relatedDocs, totalDocsToReview,
totalDocsInProject }`.

> **`blastRadius` here is an ARRAY** of affected code FileRefs (contrast with
> `get_change_impact`, where it's a count). Each `relatedDocs[]` entry has
> `matchedCodeFiles` and a human-readable `reason` (e.g. `"references
> src/util.ts, src/service.ts"`).

---

## Architecture

### codegraph_get_stats
Codebase overview. No params. Returns: `{ totalFiles, byLanguage, entryPoints,
mostConnected, mostDependedOn, averageDependencies, parseErrors }`.
`mostDependedOn` = the critical shared modules.

### codegraph_get_layers
Topological tiers. No params. Layer 0 = files importing nothing in-project; each
later layer's deps all live in earlier layers. Returns: `{ layers (array of
arrays), depth, cyclic, cyclicNodes }`. Cycle members are condensed into
`cyclicNodes`; layering still completes (never hangs).

### codegraph_find_cycles
Circular dependencies via strongly-connected-component analysis. Each ring is
reported once, normalized to start at the lexicographically smallest path.

| Param | Type | Required | Notes |
|---|---|---|---|
| `max_cycles` | number | no | 1–500, default 50. |

Returns: `{ cycles (array of ordered rings), count, hasCycles, truncated }`.

### codegraph_find_orphans
Files with **zero dependents AND zero dependencies** — dead-code candidates.
Distinct from entry points (which import things but have no dependents).

| Param | Type | Required |
|---|---|---|
| `language` | string | no |

Returns: `{ orphans: FileRef[], count }`. A file may be legitimately isolated
(standalone script) — review before deleting.

### codegraph_find_entry_points
Roots — files nothing imports (main files, CLI scripts, tests, route handlers).
Excludes orphans.

| Param | Type | Required |
|---|---|---|
| `language` | string | no |

Returns: `{ entryPoints: FileRef[], count }`.

---

## Inventory

### codegraph_list_files
All **code** files in the graph (the dependency-graph nodes), sorted by path.

| Param | Type | Required | Notes |
|---|---|---|---|
| `language` | string | no | |
| `limit` | number | no | 1–500, default 200. |
| `offset` | number | no | ≥0, default 0 (pagination). |

Returns: `{ files, total, has_more }`. In a docs-only directory this returns no
files and a `note` pointing to `codegraph_list_docs`.

### codegraph_list_docs
All **documentation** files (`.md`, `.mdx`, `.rst`, `.txt`) scanned, sorted by
path.

| Param | Type | Required | Notes |
|---|---|---|---|
| `limit` | number | no | 1–500, default 200. |
| `offset` | number | no | ≥0, default 0. |

Returns: `{ docs, total, has_more }`. Each doc entry includes
`referencedCodeFileCount` — `0` flags an orphaned doc; high counts flag
heavily cross-linked docs.

---

## Export

Both exporters share one schema. Output is deterministic; file paths go in node
**labels**, never IDs (IDs are synthetic `n0`, `n1`, …), so slashes/dots render
correctly.

| Param | Type | Required | Notes |
|---|---|---|---|
| `file` | string | no | Center on this file's neighborhood. Omit ⇒ whole graph. |
| `depth` | number | no | Neighborhood radius 1–5, default 2 (ignored without `file`). |
| `language` | string | no | Only include this language. |
| `max_nodes` | number | no | 1–2000, default 200. Over the cap, highest-degree nodes are kept and `truncated: true`. |

### codegraph_export_mermaid
Mermaid flowchart — paste into Markdown, GitHub, or a Mermaid live editor.
Returns: `{ format, diagram, nodeCount, edgeCount, truncated }`.

### codegraph_export_dot
Graphviz DOT — render with `dot`/`graphviz` into SVG/PNG.
Returns: `{ format, diagram, nodeCount, edgeCount, truncated }`.
