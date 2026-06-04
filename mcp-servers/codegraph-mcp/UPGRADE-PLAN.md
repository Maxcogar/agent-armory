# codegraph-mcp — Upgrade Plan

> Status: **proposal / for review.** No code written yet.
> Scope: `mcp-servers/codegraph-mcp/` only. The Python `codegraph.py`, its
> duplicate copy, and the LiteLLM middleware are **out of scope** — we may pull
> *ideas* from them, not code or coupling.

## 1. Where the tool is today

codegraph-mcp is a **deterministic, file-level import graph** exposed as MCP
tools. Nodes are files; edges are `imports`. It is mature where it is scoped:
on-disk cache, incremental rescans, file watch, 8 test suites, careful cycle/
layer/blast-radius math. It is consumed interactively by Claude Code.

What it cannot do (verified against source):

- **It has no symbols.** Parsers capture the import *path* and discard the
  specifiers (`src/parsers/javascript.ts:153` keeps only capture group 1). So it
  can answer "is this *file* used" but never "is this *export* used."
- **It cannot distinguish edge kinds.** `import type { X }` is matched by the
  same regex as a runtime import and counted as a normal edge — so type-only
  coupling **inflates every blast-radius number**.
- **It silently drops what it can't resolve.** `src/graph.ts:254`
  (`rawDeps.filter(dep => nodes.has(dep))`) discards both broken imports (a bug)
  and external packages (fine) — indistinguishably.
- **Its "dead code" misses cycles.** `findOrphans` (`src/graph.ts:674`) only
  catches degree-zero files; a clump `A→B→C→A` that nothing outside imports is
  invisible to *both* orphans and entry-points, yet it is dead.

## 2. The use case this serves (north star)

The user audits **documents** (migration audits, architecture/phase docs)
against a codebase. The dangerous failure is a **document that misdescribes the
code**: calling dead code live (or vice-versa), inventing field names/shapes, or
describing something under a name while the *live* equivalent sits under a
sibling name the doc never mentions. The motivating incident: an audit said a
nested `PlantIdentificationResponse` interface was the active flow and should be
removed; it is in fact dead — but the live flow uses a flat
`PlantIdentificationResult` sibling. Human intuition caught it ("those names are
too familiar to be a lost fragment"). The tool's job is to make that intuition
**checkable deterministically, at symbol granularity** — and to surface the live
sibling automatically.

Everything below ladders up to that, plus the broader goal: make codegraph a
tool a serious developer would praise.

## 3. Guiding principles

1. **Deterministic, no AI.** Same input → same output. (Unchanged.)
2. **Calibrated verdicts, never a bare boolean.** Every liveness answer is one
   of `used` / `unused` / `ambiguous(reason)`. A false "this is dead, delete it"
   is worse than no answer — that is the exact trap the audit fell into.
3. **Cross-language uniformity is the tool's identity.** The user's world is TS
   apps + Python agentic tooling + C++/Arduino IoT. A TS-only solution that
   regresses the other languages to file-level is unacceptable.
4. **Self-contained install.** `npm install` must stay clean on Windows/Mac/
   Linux (there is already a Windows config). No mandatory native compile.
5. **Backward compatible.** Existing tools and their outputs keep working;
   symbol data is additive. Cache schema version bumps and self-invalidates.

## 4. Engineering decision: the parsing stack

**Decision: `web-tree-sitter` (WASM grammars) as the universal extraction
substrate for all four language families, with the TypeScript compiler API as a
semantic *enrichment* layer for TS/JS only.**

Why:

- **Regex is disqualified.** The user's own standard from the incident — "grep
  isn't verification" — applies one level up. Regex can't separate declarations
  from usages, can't do scope, breaks on multi-line. The current parsers are
  regex; moving to real parse trees is itself the quality jump.
- **tree-sitter is the industry-standard answer** for fast, error-tolerant,
  incremental, multi-language parsing (it backs many LSPs and code-intel tools).
  It runs in-process and aligns with the existing incremental/watch design.
- **WASM over native bindings**: `web-tree-sitter` + prebuilt `.wasm` grammars
  install with zero node-gyp/native build — cross-platform clean. Native
  bindings are marginally faster but reintroduce install friction the Windows
  users would feel. Accept the small perf cost for a clean install.
- **tree-sitter is syntactic, not semantic.** It gives exact declarations and
  import specifiers with byte spans, but does **not** resolve which declaration
  a usage binds to, nor follow re-export barrels or namespace imports. That gap
  is precisely where false "dead" verdicts are born — and the audit incident was
  a TS codebase with a barrel (`index.ts` re-exporting `contracts.ts`). So for
  TS/JS we add the **TypeScript compiler** (module resolution + re-export
  following + namespace handling + true find-all-references — what `knip`/
  `ts-prune` use) to turn `ambiguous` verdicts into authoritative ones.

Rejected alternatives:

- *Regex, extended* — fails principle 2; the trap the incident was about.
- *TS compiler only* — best TS accuracy, but TS/JS only; regresses Python and
  C++/Arduino. Fails principle 3 and the user's domain.
- *Shell out to knip/ts-prune/vulture* — best per-language accuracy, least code,
  but fractures the single in-process deterministic graph and couples the MCP to
  external tool availability. Fails principles 1 and 4.

Net: tree-sitter gives every language a real symbol graph with **calibrated**
verdicts; the TS compiler upgrades TS/JS to **authoritative** verdicts where the
user's correctness-critical work lives. Phased so the substrate ships before the
enrichment.

## 5. Data-model changes (`src/types.ts`)

- `FileNode` gains `symbols: SymbolNode[]` and `imports: ImportRef[]`.
- New `SymbolNode`: `{ name, kind (function|class|interface|type|enum|const|
  method), exported, isType, span, references: SymbolRef[], liveness }`.
- New `ImportRef`: `{ from (resolved file|external|unresolved), specifiers:
  [{ imported, local, kind: value|type|namespace|default }] }`.
- Edges gain `kind: value | type | dynamic | re-export | side-effect` and an
  optional symbol list, so blast-radius can weight/ignore type-only edges.
- New `Liveness = { verdict: used | unused | ambiguous, reason?, evidence }`.
- New node classes for later phases: `external` (npm/PyPI/system), `endpoint`,
  and cross-language `channel` (mqtt/ws/http-contract/serial/env).

## 6. Phased roadmap

### Phase 0 — Foundation & correctness fixes (file graph)
Cheap, independently valuable, and prerequisites for trustworthy symbol work.
- **F1. Edge-kind metadata** (`value`/`type`/`dynamic`/`re-export`/
  `side-effect`). De-inflates blast radius; required for type liveness.
- **F2. Surface unresolved imports** — new report separating *broken* (resolved
  to nothing, likely a bug) from *external* (npm/PyPI). New: a `diagnostics`
  field on scan + `codegraph_find_broken_imports`.
- **F3. External-dependency nodes** — keep bare specifiers as leaf `external`
  nodes. Unlocks "which files import library X" and supply-chain blast radius.
- **F4. True dead-code via reachability** — `codegraph_find_unreachable
  (entryPoints?)`: files not reachable from any designated entry point; catches
  the no-importer-cycle blind spot.
- **F5. Test/source partition** — classify test files; dead-code/orphans/blast
  radius can exclude tests (a symbol used only by a test is prod-dead).

### Phase 1 — Symbol layer (tree-sitter substrate) — flagship
- **S1. Symbol extraction** per file (exported + internal declarations, kind,
  span, type-vs-value).
- **S2. Import-specifier capture** (named/default/namespace/type, with alias) —
  the data currently thrown away.
- **S3. Symbol tools:**
  - `codegraph_get_symbol(name | file:symbol)` → definition + references +
    verdict.
  - `codegraph_find_symbol_dependents(file, symbol)` → who imports/uses it (the
    thing impossible in the incident).
  - `codegraph_find_dead_exports(file?, { excludeTests })` → exported symbols
    with no live importer, each verdict-tagged with its reason.
- **S4. Calibrated verdicts** — barrels / namespace imports / dynamic access →
  `ambiguous` in this tier, with the reason named (never a false `unused`).
- **S5. Sibling / near-name surfacing** — when reporting on a symbol, also
  surface same-stem and structurally-similar symbols and their liveness. This is
  the feature that turns "`…Response` is dead" into "`…Response` is dead, but
  live sibling `…Result` exists at X" — the audit-catch the incident needed.

### Phase 2 — TS/JS semantic enrichment (TypeScript compiler)
Upgrade TS/JS verdicts from calibrated-syntactic to authoritative: follow
re-export barrels and namespace imports, run true find-all-references. Most
`ambiguous` TS/JS verdicts become `used`/`unused`. Python and C++ stay on the
calibrated substrate (honest about it).

### Phase 3 — Document ↔ code consistency
Builds on the existing doc index (`DocNode`) + the new symbol graph.
- **D1. Symbol-level doc references** — extend doc scanning to extract the
  *symbols/shapes* a doc claims about code, not just file paths.
- **D2. `codegraph_verify_doc(doc)`** — for each claim a doc makes: does the
  symbol exist? is it live or dead? does the described shape match a real one?
  If not found, return the nearest real symbol (the sibling). This is the
  deterministic backbone for catching a wrong audit before acting on it.

### Phase 4 — Interface / endpoint & cross-language surface
Ideas from the Python tool, rebuilt correctly on tree-sitter.
- **E1. Endpoint extraction** across frameworks (Express/Fastify/Nest, Flask/
  FastAPI/Django, Next route files) — method + path + handler + location, parsed
  from trees (not line-regex, not method-hardcoded-to-GET).
- **E2. Endpoint liveness = mounted/reachable** from a server entry point (join
  to file + symbol reachability), calibrated: `mounted` / `defined-but-unmounted`
  (dead) / `external-consumer-only` (can't prove from this repo) — *not* the
  Python tool's "called by an in-repo fetch()" model, which mislabels every API
  with an external client as dead.
- **E3. Cross-language bridges** (the genuinely novel Python idea, worth
  reviving for the IoT domain): MQTT topics (with `#`/`+` wildcard matching), WS
  events, HTTP contracts, serial, env vars — producer/consumer matched across
  languages, with explicit confidence.

## 7. Cross-cutting

- **Cache & migration:** bump the cache schema version (existing versioned cache
  self-invalidates on mismatch — `src/cache.ts`). Symbol data persists with the
  graph; incremental rescans re-parse only changed files (tree-sitter is
  incremental, fits the existing model).
- **Tests:** a new suite per phase, mirroring the existing 8. Symbol liveness
  needs fixtures for barrels, namespace imports, type-only imports, dynamic
  access — the exact false-positive sources.
- **Performance:** load WASM grammars once per process; reuse trees across the
  incremental path. TS compiler program built lazily, only when a TS/JS symbol
  query is made.
- **Docs:** README tools table + a short "what each verdict means / which tool
  proves what" section (the calibration is the selling point).

## 8. Honest limits

- The substrate tier (Python, C++) returns `ambiguous` for dynamic/namespace
  cases and says so; it will not pretend to semantic resolution it doesn't have.
- Endpoint/bridge detection is framework-pattern-based; novel frameworks need a
  matcher. It reports coverage rather than implying completeness.
- "External-consumer-only" endpoints and runtime-registered routes are
  inherently unprovable from static single-repo analysis; they are labeled, not
  guessed.

## 9. For the user to weigh in on (defaults in **bold**)

These are product calls, not engineering ones — I'll default unless you say
otherwise:
- Dead-code / dead-export: **exclude tests by default** (toggle available)?
- Phase order after Phase 1: **Phase 3 (doc verification) next**, since it's
  closest to your audit use case — or Phase 2 (max TS accuracy) first?
- Endpoint frameworks to prioritize first (**Express + FastAPI + Next**)?
- Should `codegraph_verify_doc` eventually run as a completion hook (like the
  existing doc-sync idea), or stay an on-demand tool (**on-demand first**)?
