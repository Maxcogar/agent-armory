# codegraph-mcp — Implementation Plan

> Execution plan for the findings in `REVIEW-2026-06.md`. Finding IDs (C1, S4,
> M6 …) refer to that document. This file is the *how* and *in what order*; the
> review is the *what* and *why*.
>
> **Branch model:** one branch per work package (WP), each independently
> reviewable and mergeable. Cut from the integration branch
> `claude/nifty-cerf-44hyO`. WPs within a phase are ordered; WP-1 (the shared
> helper) is a hard dependency for several later WPs and must land first.
>
> **Definition of done (every WP):**
> 1. `npm run build` clean (no new `tsc` errors).
> 2. New regression test(s) that **fail on `main`, pass on the branch** — named
>    in the WP. Coverage theater (asserting current behavior) does not count.
> 3. Full suite green (`npm test`, currently 148 → grows each WP).
> 4. No behavior change outside the WP's stated scope.
> 5. `README.md` updated when the WP changes observable behavior (noted per WP).

Working dir for all commands: `mcp-servers/codegraph-mcp/`.

---

## Phase 1 — Soundness (restore "never a false dead")

### WP-1 — Single `deadVerdict()` helper + real `ambiguous` *(keystone — land first)*
Closes **S4, M11**; unblocks WP-2…WP-6 by giving them one place to special-case.

**Why first:** today three tools (`find_dead_exports`, `get_symbol`,
`verify_doc`) each decide "is this dead?" differently. Every later soundness fix
would otherwise have to be applied in three places. Centralize first, fix once.

**Steps**
1. New file `src/tools/deadVerdict.ts` exporting:
   ```ts
   export type DeadVerdict = "unused" | "used" | "ambiguous";
   export function deadVerdict(
     node: FileNode, sym: SymbolInfo, ctx: GraphContext
   ): { verdict: DeadVerdict; reason: string };
   ```
2. Move into it, verbatim, the carve-outs currently inline in
   `find_dead_exports` at `src/tools/query.ts:833-859`: `PRECISE_DEAD_LANGS`
   gate, method exclusion, FQN-type-only, C++-header, C++-ODR. These become the
   single source of truth.
3. Define when the result is `ambiguous` (vs silently `used`): name-resolved
   language + non-covered symbol, namespace/dynamic re-export, star-barrel
   (until WP-4 makes it precise). Return `ambiguous`, not `unused`.
4. Rewrite the call sites to delegate:
   - `find_dead_exports` (`query.ts:833`) → `deadVerdict(...)`; `ambiguousCount`
     (`query.ts:862`) now increments off the real `ambiguous` returns instead of
     being hard-0.
   - `get_symbol` (`query.ts:755-768`) → `deadVerdict(...)`.
   - `verify_doc` (`query.ts:1262-1278`) → `deadVerdict(...)`.

**Test** `test/deadVerdict.spec.ts`: same symbol queried through all three tools
returns the *same* verdict; a Ruby (name-resolved) export reports `ambiguous`,
never `unused`, in `verify_doc`; `ambiguousCount > 0` for a constructed
namespace case.

**README:** correct the `ambiguous` bucket description to match real behavior.

---

### WP-2 — C1: null TS Program must not mark the world dead
Closes **C1** (Critical). Tiny change, highest blast radius — do immediately
after WP-1.

**Steps**
1. `src/tscompiler/liveness.ts:76-81`: on the `if (!program)` branch return
   `{ usedExternally, covered: new Set() }` (empty `covered`) so `livenessFor`
   falls through to the safe syntactic verdict instead of "everything unused".
2. Confirm `livenessFor`'s downstream handles empty `covered` as "no precise
   info" (it should after WP-1).

**Test** `test/liveness-null-program.spec.ts`: stub `createTsProgram` → `null`;
assert **no** TS/JS symbol returns `unused` from `find_dead_exports`.

---

### WP-3 — S3: parse-error files can't downgrade a symbol to dead
Closes **S3**.

**Steps**
1. In `src/treesitter/analyze.ts`, after parsing, record
   `fileNode.hasParseError = tree.rootNode.hasError`.
2. In `deadVerdict()` (WP-1): if the *defining* file `hasParseError`, or any
   candidate reference site is inside an `ERROR` node, return `ambiguous` with
   reason `"parse-error"` — never `unused`.
3. Surface a count of parse-error files in the `find_dead_exports` response
   summary so callers know precision was reduced.

**Test** `test/parse-error-ambiguous.spec.ts`: fixture file with a syntax error
whose only use of `foo` sits in the broken region → `foo` is `ambiguous`, not
`unused`.

---

### WP-4 — S1 + S2: `export *` and `export default`
Closes **S1, S2**. Both are TS-compiler-pass export-shape gaps; do together.

**Steps**
1. **S1 (`export *`):** in the liveness visitor (`liveness.ts`), when visiting an
   `ExportDeclaration` that has a module specifier and **no** named clause,
   resolve `checker.getExportsOfModule(moduleSymbol)` and mark each re-exported
   symbol used (or propagate the re-export edge so transitive deadness uses the
   true public entry set).
2. **S2 (`export default`):**
   - `src/treesitter/symbols.ts:57-88`: emit a symbol for `export default
     function/class` (named and anonymous).
   - `liveness.ts:97`: key liveness on `"default"` when the declaration carries
     `SymbolFlags.Default`, so producer and consumer keys agree.

**Tests** `test/export-star.spec.ts` (symbol exposed only via a star-barrel is
`used`); `test/export-default.spec.ts` (named-fn default *and* anonymous default
both resolve; a used default is not `unused`, an unused one is).

---

### WP-5 — S5: Go aliased same-name imports
Closes **S5**.

**Steps**
1. `src/treesitter/connections.ts:281-284`: key the import registration on the
   import's **alias/local name**, not the bare package name.
2. On a key collision between two imports in one file, register **nothing** for
   that key and flag ambiguous, rather than last-writer-wins clobber.

**Test** `test/go-alias-collision.spec.ts`: two imports aliased to the same name
(or two packages with the same final segment) — `pkg.Member` resolves to the
correct package; the other symbol is not falsely dead.

**Phase 1 exit:** WP-1…WP-5 merged; new soundness specs green; 148 baseline
green. The "never a false dead" guarantee holds under null-program,
parse-error, star-barrel, default-export, and Go-alias conditions.

---

## Phase 2 — Resolution correctness (right file, no phantom edges)

### WP-6 — S6 + S7 + M5: Python import resolution
Closes **S6, S7, M5**. All in `src/parsers/python.ts`; one parser, do together.

**Steps**
1. **S7 (`from . import x`, `python.ts:112-143`):** capture the imported names;
   resolve each as a submodule of the relative base (`<name>.py`, then
   `<name>/__init__.py`); fall back to the package `__init__.py` only if the
   name is not a submodule.
2. **S6 (absolute-import fallback, `python.ts:145-164`):** resolve absolute
   imports against the discovered package root only, and only when `parts[0]` is
   a real top-level package/module; drop the unconditional `rootDir` probe so
   `import json` / `import requests` stay external.
3. **M5 (PEP 420, `python.ts:99-110`):** detect namespace packages (dir with
   submodules but no `__init__.py`) so package-root detection doesn't fall back
   to `rootDir` and over-resolve.
4. Memoize the computed package root per directory (also addresses M10's Python
   half).

**Tests** `test/python-resolution.spec.ts`: `from . import b` edges to `b.py`
not `__init__.py`; `import json` is external; a local `json.py` elsewhere is
*not* matched; a namespace package resolves correctly.

---

### WP-7 — M2 + M1: existence checks & uniform comment stripping
Closes **M2, M1**. Cross-parser hygiene; batch them.

**Steps**
1. **M2:** add `existsSync`/dir checks before edging — Ruby `require_relative`
   (`ruby.ts:23`), requirements `-r` targets (`requirementstxt.ts:31`); make Go
   internal-vs-external **tri-state** with a directory check (`golang.ts:40` →
   `edges.ts:68`) so a typo'd internal import is flagged, not assumed healthy.
2. **M1:** strip comments before regex matching in Go (`golang.ts:78`), Rust
   (`rust.ts:49`), and go.mod (`gomod.ts:33`) — match the JS/C++ parsers.

**Tests** `test/phantom-edges.spec.ts`: commented-out import in each language
produces no edge; a non-existent `require_relative` target produces no edge; a
typo'd Go internal import is flagged unresolved.

---

### WP-8 — M3 + M4: tsconfig JSONC & C++ scoped includes
Closes **M3, M4**.

**Steps**
1. **M3 (`javascript.ts:31`):** strip `/* */` block comments and trailing commas
   before `JSON.parse` (or swap in a JSONC parser); follow `extends` chains so
   `@/...` aliases resolve. Today a block comment throws → all aliases go
   external.
2. **M4 (`cpp.ts:55-71`):** restrict header search to the including file's
   directory + configured include roots; on multiple matches report ambiguity
   instead of returning the first arbitrary same-named header.

**Tests** `test/tsconfig-jsonc.spec.ts` (commented tsconfig with `extends` still
resolves aliases); `test/cpp-include-scope.spec.ts` (two `config.h` → correct one
or ambiguous, never silently wrong).

**Phase 2 exit:** per-language resolution fixtures green; no phantom edges; no
wrong-file edges in the covered cases.

---

## Phase 3 — Durability & concurrency (safe to run unattended)

### WP-9 — S8 + M17 + M18 + m11: cache integrity
Closes **S8, M17, M18, m11**. All in `src/cache.ts` (+ signal handler).

**Steps**
1. **S8 (`cache.ts:89`):** write to `${file}.${process.pid}.tmp`, then
   `fs.renameSync` onto the target (atomic same-fs). No more torn cache files.
2. **M17 (`cache.ts:69-84`):** on load, `if (path.resolve(rootDir) !==
   graph.rootDir) return null` — never adopt a foreign graph.
3. **M18 (`cache.ts:44-50`):** normalize the path (case/separator) before hashing
   the cache key, or document per-OS behavior.
4. **m11 (`index.ts:1626`):** make the signal handler await any in-flight cache
   write before `process.exit` (moot once S8 lands, but tidy).

**Test** `test/cache-atomicity.spec.ts`: simulate a torn write (truncated temp,
no rename) → loader returns null and a clean rescan recovers; a cache whose
`rootDir` differs is rejected.

---

### WP-10 — S9 + S10: watcher & parser concurrency
Closes **S9, S10**.

**Steps**
1. **S10 (`src/treesitter/parser.ts:59-83`):** cache the *language binding*
   (expensive), allocate a fresh `Parser` per `parseSource` (cheap). Removes the
   shared-mutable-Parser reentrancy hazard.
2. **S9 (`src/index.ts:931-940` + `src/watch.ts:58-68`):** add a single-flight
   guard around `rescanCurrentGraph` with a `dirty` re-run flag so overlapping
   debounced rescans coalesce; serialize `codegraph_scan` against an in-flight
   rescan so they can't clobber `currentGraph`.

**Test** `test/concurrency.spec.ts`: fire N overlapping rescans + a scan; assert
the final `currentGraph` equals a single clean scan (no dropped events, no
race-corrupted tree).

---

### WP-11 — S11: Node engine / watch platform support
Closes **S11**.

**Steps**
1. Raise `package.json` `engines.node` to `>=20` (recursive `fs.watch` on Linux
   needs it) and note it in README's requirements.
2. Optionally: detect platform at watch-start and, on unsupported combos, emit a
   clear cause-naming error or a polling fallback instead of an opaque
   `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`.

**Test** `test/watch-engine.spec.ts` (or CI matrix note): on an unsupported
platform the watcher reports a clear error, doesn't crash the server.

**Phase 3 exit:** torn-write recovery + overlapping-rescan convergence tests
green; engines/watch documented.

---

## Phase 4 — Performance at scale

### WP-12 — M6: kill O(n) `Array.shift()` BFS
Closes **M6**. Self-contained, high value, easy to benchmark.

**Steps**
1. `src/graph.ts` lines `659, 749, 789, 822, 916, 1226`: replace
   `queue.shift()` with a head-index pointer (`let head=0; queue[head++]`) or a
   small deque. Each traversal goes O(V²) → O(V+E).

**Test/bench** add `test/bench/large-graph.ts` building a synthetic ~10k-node
graph; record before/after wall-time in the WP description. Correctness: existing
traversal specs stay green.

---

### WP-13 — M7 + M8 + M9 + M10: precompute / index the per-call hot paths
Closes **M7, M8, M9, M10**.

**Steps**
1. **M7 (`query.ts:752-770`):** build `Map<targetFile, ImportEdge[]>` once per
   `get_symbol` call (or memoize on the graph) instead of calling
   `symbolImporters` per definition. O(K·N·E) → ~O(N·E + K).
2. **M8 (`query.ts:903-911`):** compute unused-imports during scan, store on
   `FileNode`; stop re-reading files from disk per `find_unused_imports` call
   (also fixes staleness).
3. **M9 (`graph.ts:515`):** replace per-(doc×node) regex with one combined scan
   (Aho-Corasick / single alternation) in `scanDocForCodeReferences`.
4. **M10:** single `statSync` in try/catch instead of `existsSync`+`statSync`;
   reuse the cached Python package root from WP-6.

**Test** existing functional specs stay green; bench numbers in WP description.

**Phase 4 exit:** benchmark fixture shows the BFS and `get_symbol` improvements;
no functional regressions.

---

## Phase 5 — Output consistency, safety, minors

### WP-14 — M12 + M13 + M14 + M15 + M16: correctness-of-output
Closes **M12, M13, M14, M15, M16**.

**Steps**
1. **M12:** incremental `removed` via set-difference, not subtraction
   (`graph.ts:418`); clear stale edges on reused importers across manifest
   renames (`graph.ts:447-451`); add a test pinning incremental == full-scan.
2. **M13:** normalize both `get_external_users` (`query.ts:542`) and
   `list_external_dependencies` (`query.ts:488`) through `externalName` so scoped
   packages round-trip.
3. **M14 (`graph.ts:1058`):** assert `ring.length === scc.length` in
   `orderCycle`; reconstruct a complete ring (SCC membership is already correct —
   fix the lossy display walk).
4. **M15:** validate `root_dir` in `index.ts:177` (exists, is a directory, not
   `/` or `$HOME`); document in README that scanned file contents are read into
   responses/cache.
5. **M16 (`export.ts:74-118`):** report dropped-edge count when the language
   filter removes edges, like the node-cap path already does.

**Tests** one spec per item; the M12 incremental-vs-full and M14
complete-ring assertions are the load-bearing ones.

---

### WP-15 — Minors (m1–m10, m12–m14)
Closes the remaining `m*` list in the review — every minor **except m11**, which
WP-9 owns (signal-safe cache write). Single cleanup PR; no behavior change beyond
each item's stated fix. Group by file. Each gets at most a one-line test or a
code comment; skip tests where the fix is a pure readability change (m1, m3, m4).

**Phase 5 exit:** full suite green; README reconciled with actual behavior
(ambiguous story from WP-1, watch platform from WP-11, root_dir read note from
WP-14).

---

## Sequencing summary

```text
Phase 1  WP-1 ─┬─ WP-2
               ├─ WP-3
               ├─ WP-4
               └─ WP-5         (WP-2..5 all depend on WP-1)
Phase 2  WP-6, WP-7, WP-8      (independent of each other; after Phase 1)
Phase 3  WP-9, WP-10, WP-11    (independent; can overlap Phase 2)
Phase 4  WP-12 (independent); WP-13 (depends on WP-6 cache-root memoization)
Phase 5  WP-14, WP-15          (last; WP-14 benefits from WP-1's helper)
```

Critical path to "trustworthy verdicts again": **WP-1 → WP-2 → WP-3**. Ship
those three first; everything else is incremental hardening.

## Tracking

Suggested checklist to paste into the tracking issue/PR description:

- [ ] WP-1 deadVerdict helper + real ambiguous (S4, M11)
- [ ] WP-2 null TS Program → empty covered (C1)
- [ ] WP-3 parse-error guard (S3)
- [ ] WP-4 export * + export default (S1, S2)
- [ ] WP-5 Go alias collisions (S5)
- [ ] WP-6 Python import resolution (S6, S7, M5)
- [ ] WP-7 existence checks + comment stripping (M2, M1)
- [ ] WP-8 tsconfig JSONC + C++ include scope (M3, M4)
- [ ] WP-9 cache integrity (S8, M17, M18, m11)
- [ ] WP-10 watcher + parser concurrency (S9, S10)
- [ ] WP-11 node engine / watch platform (S11)
- [ ] WP-12 O(n) BFS (M6)
- [ ] WP-13 hot-path indexing (M7, M8, M9, M10)
- [ ] WP-14 output consistency (M12–M16)
- [ ] WP-15 minors (m1–m10, m12–m14)
