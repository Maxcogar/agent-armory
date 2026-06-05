# codegraph-mcp — Build Spec: Phase 0 + Phase 1

> Companion to `UPGRADE-PLAN.md`. Implementation-level detail for the first two
> phases. Spec only — no code written yet. Every step is independently
> shippable and **gated on the existing 8 test suites staying green**.

## 0. Sequencing refinement (important)

The plan listed Phase 0 as "cheap, pre-symbol." In practice the clean order
introduces the parser foundation **first**, because Phase 0's edge-kind work and
Phase 1's symbols both come from the same parse:

1. **Step 1 — tree-sitter foundation (no behavior change).** Swap *how we find
   import strings* from regex to tree-sitter, **keeping the existing resolvers**
   (`resolveJsImport`, the Python/C++ resolvers) unchanged. tree-sitter extracts
   `(rawPath, specifiers, kind, line)`; the raw path feeds the *same* resolution
   logic as today, so `dependencies: string[]` comes out identical and all
   current tests pass unchanged. This is a pure quality upgrade (immune to the
   commented-out / in-string false positives regex still risks) that also yields
   the raw material for everything below.
2. **Step 2 — Phase 0 fixes** (edge kinds, diagnostics, externals, reachability,
   test split, clusters) — now mostly free from Step 1's richer parse.
3. **Step 3 — Phase 1 symbols** (declarations + the symbol tools).

Risk control: resolution is untouched, so the regression surface is "did
tree-sitter find the same import strings the regex did?" — covered by the
existing parser tests plus new fixtures (§5).

### Parsing stack — REVISED during Step 1 (native bindings, not WASM)

The plan chose `web-tree-sitter` (WASM) to avoid native-compile friction.
Implementing Step 1 surfaced a decisive fact the plan didn't account for: the
existing parsers **and their unit tests are synchronous**
(`parseJavaScriptDependencies(...)` returns `string[]` directly), while WASM
requires async `Parser.init()`. Forcing the parse path async would break that
contract and ripple through the build loop.

So the substrate is the **native `tree-sitter` bindings**
(`tree-sitter` + `tree-sitter-typescript` + `tree-sitter-python` +
`tree-sitter-cpp`, pinned exact), which parse **synchronously** and drop in
without an async refactor. Verified in this environment: they install via
**prebuilt binaries in ~2s with no node-gyp compile**, so the install-friction
concern that motivated WASM does not actually arise here. The `tsx` grammar
(a superset that parses JS/TS/JSX/TSX) covers the whole JS/TS family; one
`Parser` instance is cached per grammar and reused across files.

## 1. `types.ts` additions (all additive — nothing removed)

```ts
// ---- Imports (rich edge data; lives alongside the legacy string[]) ----
export type ImportKind =
  | "value" | "type" | "dynamic" | "re-export" | "side-effect";

export interface ImportSpecifier {
  imported: string;            // name in the source module; "default" | "*" (namespace)
  local: string;               // local binding
  kind: "named" | "default" | "namespace";
  isType: boolean;             // `import type {X}` or `import {type X}`
}

export interface ImportEdge {
  raw: string;                 // specifier as written ("./contracts", "express")
  to: string | null;          // resolved abs path, or external id, or null
  resolution: "internal" | "external" | "unresolved";
  kind: ImportKind;
  specifiers: ImportSpecifier[];
  line: number;
}

// ---- Symbols (Phase 1) ----
export type SymbolKind =
  | "function" | "class" | "interface" | "type"
  | "enum" | "const" | "variable" | "method";

export type LivenessVerdict = "used" | "unused" | "ambiguous";
export interface Liveness {
  verdict: LivenessVerdict;
  reason?: string;             // e.g. "reached only via `export * from` barrel"
}

export interface SymbolNode {
  name: string;
  kind: SymbolKind;
  exported: boolean;
  isType: boolean;             // type-space (interface/type/enum-as-type)
  line: number;
}

// ---- FileNode gains (all optional so old caches/algorithms are unaffected) ----
// imports?: ImportEdge[];
// symbols?: SymbolNode[];
// isTest?: boolean;

// ---- New separate indexes on DependencyGraph (mirrors how docNodes is separate)
// externalDeps: Map<string, { id: string; importers: string[] }>;
// diagnostics:  { unresolvedImports: { file: string; raw: string; line: number }[] };
```

`dependencies: string[]` is **derived** from `imports.filter(resolution ===
"internal")`, so every existing algorithm (cycles, layers, impact, orphans)
keeps operating on the same field with no change.

## 2. Phase 0 — tools & behavior

| Item | Tool / change | Output shape |
|---|---|---|
| F1 edge kind | enrich existing edges; new opt on impact | `codegraph_get_change_impact({ files, excludeTypeOnly?: bool })`; subgraph/dependents edges gain `kind` |
| F2 broken imports | `codegraph_find_broken_imports()` | `{ broken: {file, raw, line}[], count }` |
| F3 externals | `codegraph_list_external_dependencies({language?})` + `codegraph_get_external_users({name})` | `{ externals: {name, importerCount}[] }` / `{ name, users: FileRef[] }` |
| F4 dead code | `codegraph_find_unreachable({ entryPoints?, includeTests? })` | `{ unreachable: FileRef[], entryPointsUsed: FileRef[], count }` |
| F5 test split | `isTest` on nodes; `includeTests` opt (default false) on dead/orphan/impact | classification by path: `**/test/**`, `*.test.*`, `*.spec.*`, `**/__tests__/**`, `*_test.py`, `test_*.py` |
| F6 clusters | `codegraph_find_clusters({ minSize?, includeTests? })` | `{ clusters: {id, size, files: FileRef[]}[], count }` |

Notes:
- **F4 reachability semantics (fixed):** a file is *live* iff reachable by
  following `dependencies` forward (importer → imported) starting from the entry
  set. The entry set is exactly: files with zero internal dependents (graph
  roots) ∪ files classified `isTest` ∪ manifest entries (npm `package.json`
  `main`/`bin`, Python files with `if __name__ == "__main__"` or named
  `__main__.py`, C/C++ files defining `main(`, all Arduino `.ino`). When
  `includeTests:false`, test files are dropped from both the entry set and the
  result. A no-importer cycle has no zero-dependent member and no outside
  importer → unreachable → reported dead. An explicit `entryPoints` argument
  replaces the default set entirely.
- **F1:** `excludeTypeOnly` recomputes the blast radius ignoring `kind:"type"`
  edges — type-only imports are not runtime coupling. Default `false` (current
  behavior preserved).

## 3. Phase 1 — tools & behavior

```
codegraph_get_symbol({ symbol, file? })
  → { symbol: SymbolRef, definedAt, references: SymbolRef[],
      liveness: Liveness, siblings: { name, file, line, liveness }[] }

codegraph_find_symbol_dependents({ file, symbol })
  → { symbol: SymbolRef, dependents: { file: FileRef, via: ImportKind, line }[] }

codegraph_find_dead_exports({ file?, includeTests? })   // includeTests default false
  → { dead: { symbol: SymbolRef, liveness: Liveness }[], count,
      ambiguousCount }      // ambiguous never counted as dead

codegraph_find_unused_imports({ file? })
  → { unused: { file: FileRef, imported: string, local: string, line }[], count }

codegraph_diff_surface()    // compares the current scan to the previously
                            // persisted symbol snapshot in the on-disk cache
  → { added: SymbolRef[], removed: SymbolRef[],
      signatureChanged: { symbol: SymbolRef, before, after }[] }
```

New `SymbolRef = { file, relativePath, name, kind, line }`.

### Liveness algorithm (Phase 1, syntactic tier)
For exported symbol `S` in file `F`:
1. Collect every `ImportEdge` whose `to === F`. If any specifier's `imported ===
   S.name` (or alias resolves to it) and is used → **used**.
2. If `F` is re-exported (`export * from F` / `export {S} from F` in some `G`),
   or imported via namespace (`import * as ns from F`) anywhere → **ambiguous**,
   reason names the mechanism. (Phase 2 resolves these to used/unused.)
3. Else **unused**.
The rule is asymmetric on purpose: we only ever emit **unused** when there is no
path *even through* barrels/namespaces. False "dead" is the failure we refuse.

### Sibling surfacing (S5)
Siblings = symbols whose name shares the stem after stripping a known suffix set
(`Response|Request|Result|Dto|Model|Type|Interface|Props|Args`) **or** whose
declared member-name set overlaps ≥ threshold. Each returned with its own
liveness, so "`XResponse` unused" arrives next to "`XResult` used at …".

## 4. Cache & compatibility

- Bump `CACHE_SCHEMA_VERSION`; the existing versioned cache self-invalidates on
  mismatch (`src/cache.ts`) — no manual migration.
- New fields are optional; a graph built before symbols still loads (symbol
  tools report "rescan needed" if `symbols` absent).
- No existing tool's output shape changes except *additive* fields (`kind` on
  edges). Existing tests assert current fields and stay green.

## 5. Test fixtures (the cases that break naïve implementations)

A new fixture project `tests/fixtures/symbols/` plus suites:

| Fixture | Asserts |
|---|---|
| `barrel/` — `index.ts` does `export * from './contracts'`, consumer imports from `index` | re-exported symbol → Phase 1 returns **ambiguous** (reason: barrel); Phase 2 returns **used**. Never **unused**. |
| `namespace/` — `import * as ns; ns.Foo()` | `Foo` → Phase 1 **ambiguous** (reason: namespace import); Phase 2 **used** |
| `type-only/` — `import type {T}` + `import {type U}` | edges `kind:"type"`; `excludeTypeOnly` drops them from impact |
| `dynamic/` — `await import('./x')` | edge `kind:"dynamic"` |
| `side-effect/` — `import './polyfill'` | edge `kind:"side-effect"`, no specifiers |
| `alias/` — `import {A as B}` | specifier `imported:"A", local:"B"` |
| `dead-cycle/` — `a→b→c→a`, nothing else imports them | `find_unreachable` returns all three |
| `commented/` — a commented-out and an in-string import | not counted (tree-sitter immunity) |
| `unused-import/` — imported `X`, never referenced | `find_unused_imports` flags `X` |
| `sibling/` — `FooResponse` (dead) + `FooResult` (used) | `get_symbol(FooResponse)` lists `FooResult` as a live sibling |

Plus: re-run the existing 8 suites unchanged after Step 1 (regression gate).

## 6. Build order (each a reviewable unit)

1. tree-sitter foundation + `ImportEdge`; derive `dependencies[]`; existing tests green. *(no new tools)*
2. F1 edge kinds + `excludeTypeOnly`; F2 broken imports.
3. F3 externals; F5 test classification.
4. F4 reachability dead-code; F6 clusters.
5. S1/S2 symbol + specifier extraction; `get_symbol`, `find_symbol_dependents`.
6. S3/S4 dead-exports + unused-imports + calibrated verdicts; S5 siblings.
7. S6 surface diff.

Phase 2 (TS-compiler enrichment) upgrades step 6's `ambiguous` verdicts and is
specced separately once these land.

## 7. Decisions (resolved)

- **Grammars are native npm packages, pinned to exact versions** (no WASM, no
  vendored files — superseded; see the revised Parsing-stack note in §0).
  Determinism comes from exact version pins in `package.json` +
  `package-lock.json`.
- **`diff_surface` compares against the previously persisted symbol snapshot**
  in the on-disk cache (i.e. "what changed since the last scan"). Git-ref
  baselines are out of scope for Phase 1 and are a named later item.
- **F4 entry set is fixed as defined in §2** (roots ∪ tests ∪ manifest entries);
  no further confirmation needed before coding.
- **Test exclusion is the default** for dead-code/orphan/diff results, via
  `includeTests` (default `false`).
