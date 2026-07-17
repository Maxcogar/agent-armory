# agent-armory — Complete Tooling Inventory

> 👉 **Setting up a project? Start with [PROJECT-LIFECYCLE-COVERAGE.md](./PROJECT-LIFECYCLE-COVERAGE.md)** —
> it maps lifecycle slots → what to grab → reinforcement stacks → gaps. *This* file is the
> per-tool detail it links into.

> A categorized, use-case-oriented catalog of every agentic-coding asset in this
> repository: MCP servers, context-injection middleware, multi-component plugins,
> skills, slash commands, sub-agent definitions, hooks, role/profile harnesses,
> and workflows. Compiled from a full read of all ~1,093 tracked files (plus
> untracked work-in-progress) by a fan-out of reader sub-agents, with a
> deterministic md5 pass for byte-for-byte duplicate detection.

---

## How this catalog is organized

The repo is dominated by **one system, AgentBoard, ported across four host
runtimes**, surrounded by a library of **general-purpose, reusable** skills /
commands / agents / hooks, plus a cluster of **MCP servers** (some for dev
tooling, some for Autodesk CAM/CAD), and **context-injection middleware**.

Sections:

1. **MCP Servers** — long-running tool servers (dev/agent tooling + Autodesk CAM/CAD)
2. **Context-Injection Middleware** — pre-edit grounding layers
3. **Plugins & Profiles** — multi-component bundles (the AgentBoard ecosystem, gcp-iot, the Project-Manager config)
4. **Skills (standalone library)** — grouped by function
5. **Slash Commands (standalone)**
6. **Sub-agent Definitions (standalone)**
7. **Hooks (standalone)**
8. **Profiles, Roles & System Prompts**
9. **Workflows**
10. **Duplicate & Variant Analysis** — exact (byte-for-byte) + near-duplicate families
11. **Status Watchlist** — broken / stale / backup / archived items to know about

**Status legend:** `active` · `wip` (incomplete) · `experimental` · `stale`
(works but out-of-date) · `superseded` · `backup`/`broken` · `archived`
(packaged, not deployed) · `fixture` (test data).

---

## The big picture (read this first)

- **AgentBoard is the centerpiece.** It is an AI project-management app (a separate
  Node/Express + SQLite backend, plus a cloud-hosted MCP) wrapped by a Claude Code
  plugin that runs a rigorous **spec → architecture → plan → review → implement →
  audit** pipeline using many specialized sub-agents and a server-driven kanban
  ("workspace boards" of cards/artifacts). It exists in **five parallel copies**:
  `claude-plugins/agentboard` (source of truth), `codex-plugins/agentboard`,
  `gemini-extensions/agentboard`, `gemini-extensions/agentboard-gemini`, and the
  `Project-Claude-Configs/Project-Manager` profile. `PORT_MAP.md` is the contract
  that keeps the ports in sync; `PLUGIN-OVERVIEW.md` is the deep reference (both
  describe v0.3.0 and are slightly behind the current 0.6.1).
- **Heavy duplication is intentional but drifting.** 84 byte-for-byte duplicate
  groups and 14 near-duplicate families exist because skills/commands/hooks are
  vendored into multiple host trees. The `Project-Manager` profile is largely a
  *verbatim mirror* of the top-level `skills/`, `commands/`, and `hooks/`. See §10.
- **Two registries:** `.claude-plugin/marketplace.json` registers `gcp-iot` v1.0.0
  and `agentboard` v0.3.0 for Claude; `codex-plugins/.agents/plugins/marketplace.json`
  registers the Codex port; Gemini auto-discovers.
- **Root docs to trust / distrust:** `CLAUDE.md` (canonical project memory + rules)
  is authoritative. `AGENTS.md` is a *corrupted* find-replace clone of it (every
  "claude" became "Codex", breaking identifiers) — ignore it. `README.md` omits
  agentboard. Two `workflows/` git submodules (`agent-strategy`,
  `claude-systematic-debug`) are declared but **uninitialized**.

---

## 1. MCP Servers

Long-running Model Context Protocol servers. Two families: **(1A) agent/dev
tooling** and **(1B) Autodesk CAM/CAD domain**.

### 1A. Agent & dev-tooling MCP servers

#### codebase-rag — `mcp-servers/codebase-rag/` · Python · **active**
**Use:** Always-on semantic search over the current project, zero per-project setup.
Exposes exactly **2 read-only stdio tools**: `rag_search(query, num_results, source_type∈{all,docs,code,constraints})` and `rag_query_impact(file_path, num_similar)` (returns exports, API endpoints, websocket events, dependents/importers, similar files).
It auto-detects the project root (`.git`/`package.json`/`pyproject.toml`/… or `RAG_PROJECT_ROOT`), builds a **ChromaDB** index in a per-machine cache dir keyed by `sha1(abs_root)[:16]` (**never inside the project tree**), embeds with `all-MiniLM-L6-v2` (ONNX), and runs a **debounced filesystem watcher** for live incremental re-indexing. Three collections (codebase/constraints/patterns) with retrieval weighting (ARCHITECTURE.yml/CONSTRAINTS.md/CLAUDE.md ×10, docs/patterns ×8, code ×1).
**When to use:** Before editing unfamiliar code, finding callers/callees, or checking what depends on a file. This is the *real local Python RAG index* — distinct from the agentboard plugin's hosted `codebase-rag` skill and from `skills/codebase-rag-enforcer/` (a stale forked copy).
**Key details:** deps chromadb~0.5, watchdog, pathspec, pydantic; env overrides `RAG_PROJECT_ROOT`, `RAG_WATCHER_DEBOUNCE_MS`, `RAG_MAX_FILE_BYTES`. Result of a rewrite from a legacy 6-tool version (see `migration-prompt.txt`). 12/12 e2e passing per CLAUDE.md.
**Variants/dupes:** SKILL.md here is the canonical codebase-rag skill doc; a second full Python copy lives in `skills/codebase-rag-enforcer/mcp-server-python/` (older, has stale `setup.py`, lacks `bootstrap.py`/`scope.py`/`watcher.py`/`utils/chroma.py`); a trimmed 8-tool `codegraph`+RAG pair is bundled in the agentboard plugin.

#### codegraph-mcp — `mcp-servers/codegraph-mcp/` · TypeScript · **active**
**Use:** Deterministic (no-AI) static dependency-graph analysis exposing **18 query tools**.
Builds an in-memory file-level import/include graph plus a separate doc-reference index, then answers ground-truth structural questions. Tools include `codegraph_scan` (call first; full/incremental), `codegraph_get_dependencies`/`_get_dependents`, `codegraph_get_change_impact` (blast radius + coverage %), `codegraph_get_subgraph`, `codegraph_find_entry_points`, `codegraph_find_cycles` (Tarjan SCC), `codegraph_get_layers` (Kahn topo), `codegraph_get_path_between`, `codegraph_find_orphans`, `codegraph_export_mermaid`/`_export_dot`, `codegraph_list_files`/`_list_docs`, `codegraph_get_stats`, `codegraph_find_related_docs` (deterministic doc-sync), `codegraph_watch_start`/`_stop`.
**When to use:** When you need real (not guessed) answers about structure: imports/importers, blast radius before a change, cycles, layering, dead/orphan files, or which docs to review after a code change. Pairs with completion-verification and doc-sync.
**Key details:** `@modelcontextprotocol/sdk` + zod, Node ≥18, stdio. Languages: TS/JS, Python, C++/Arduino, plus npm/pip/Go manifests (local edges only — the package universe never leaks in). Out-of-tree JSON cache at `~/.cache/codegraph-mcp/<sha256>` (schema-versioned, mtime-incremental). `DEBUG_REPORT.md` records parser bugs found & fixed (guarded by `tests/parser-edge-cases.test.js`).
**Variants/dupes:** A trimmed **8-tool `codegraph`** is bundled inside the agentboard plugin. `codegraph-windows-config.json` points at *another built copy* outside the repo (`claude-code-ultimate/...`). Unrelated to the Python `codegraph.py` in `workflows/` (a different codegraph implementation — see §9/§10).

#### agentboard_mcp — `mcp-servers/agentboard_mcp/` · Python · **active (but divergent)**
**Use:** Agent-facing MCP wrapping the **local** AgentBoard project-management REST API.
A thin async httpx client (FastMCP, stdio, ~2,439 lines) over a *separate* Node/Express + SQLite backend at `http://localhost:3000/api` (override `AGENTBOARD_URL`); the MCP itself stores nothing. Exposes **30 tools** across two workflows: a strict **13-phase project lifecycle** (apps → projects → 8 phase documents → milestone/implementation tasks → activity log, with a guarded task state machine and a blocking "submit-and-wait" human-review gate) and **ad-hoc workspace boards** (apps → boards → cards across backlog/planning/review/implementation/audit/finished → append-only artifacts). Every mutating tool requires an explicit `agent_id`; also has `agentboard_start_server`/`_stop`/`_server_status` to manage the backend process.
**When to use:** Running/inspecting a **self-hosted** AgentBoard install on localhost. **Do not** treat it as the reference for the cloud plugin's tool surface.
**Status caveat:** Has drifted from its own `SPEC.md`/`DECISIONS.md` (26 vs 30 tools; App entity added; two near-duplicate "claim next card" tools `agentboard_get_workspace_task` and `agentboard_get_next_card`).
**Variants/dupes:** The **cloud** AgentBoard MCP that the plugins actually call exposes a *different, larger* tool family (`create_workspace_card`, `get_card`, `list_workspace_artifacts`, `resolve_artifact_prefix`, …) and omits the local server-lifecycle tools.

#### subagent-mcp-server ("agents") — `mcp-servers/agents/` · TypeScript · **active**
**Use:** Dispatch one-shot prompts to **Codex (OpenAI)** and **Gemini (Google)** coding CLIs as sub-agents, with git-worktree isolation and diff capture.
**2 tools:** `subagent_dispatch` (backend codex|gemini, prompt, persona?, isolation worktree|cwd, timeout, model?, dangerous_mode) and `subagent_dispatch_parallel` (≤8 jobs). Default isolation runs each dispatch in a throwaway `git worktree`, captures `git diff --cached`, then removes it — so foreign-model edits never touch your tree until reviewed. Uses **cached subscription auth** and hard-scrubs API-key env vars so the CLIs can't silently fall back to billed API accounts.
**When to use:** When you want Claude Code to delegate to a *different* model (second opinions, parallel workers, boilerplate) on subscription billing, isolated.
**Key details:** stdio, Node ≥20, `@openai/codex-sdk` (bundles the codex binary), zod. Returns structured `exit_status`, `files_changed[]`, truncated `diff`, token usage.
**Variants/dupes:** A **stray partial copy** at `mcp-servers/mnt/user-data/outputs/subagent-mcp-server/` has only `schemas/dispatch.ts` + `services/dispatch.ts` (references missing siblings — non-buildable; appears to be a cleaner later draft).

#### implementation-plan-agent — `implementation-plan-agent/` · TypeScript (Genkit/Gemini) · **wip**
**Use:** A Genkit flow (an MCP *host/client*, not a server) that turns `{requirements, targetPath}` into a compliance-gated implementation plan + audit report.
Spins up three child MCP servers (codebase-rag, codegraph, sequential-thinking) and runs three Gemini passes: **DISCOVERY** (tool-using, forbidden from shell), **PLANNER** (emits a plan with compliance gates + cited standards), **AUDITOR** (PASS/FAIL/NEEDS_REVISION). `--serve` starts a flow server on :3400.
**When to use:** Automated, compliance-gated plan generation over a RAG/codegraph-indexed codebase — but it's environment-specific (hardcoded Windows paths, `GEMINI_API_KEY`, a speculative `gemini-3.1-pro-preview` model id) and has a test harness whose signature doesn't match the flow. Treat as a reference implementation.

### 1B. Autodesk CAM / CAD / metrology MCP servers

These four wrap Autodesk desktop apps via Windows COM (or APS cloud APIs). All
emphasize injection-hardened input validation before any COM call.

#### PowerMill-MCP — `mcp-servers/PowerMill-MCP/` · C#/.NET 4.8 · **wip (source missing)**
**Use:** Drive Autodesk **PowerMill** CAM (blocks, tools, boundaries, patterns, toolpaths, NC programs) via COM, exposing **38 v1 tools**.
Full CAM lifecycle: connect/status, project open/new/save/import, model+block+workplane setup, tool library, boundaries/patterns, toolpath create/calculate/verify (56-strategy allowlist), NC program assembly + posting, plus escape-hatch `run_macro`/`query_parameter`. Hardened: `SafePath` path-jail to `POWERMILL_PROJECT_ROOTS`, `EntityNameValidator`/`ToolpathStrategyAllowlist` reject macro-injection chars, destructive tools require explicit confirm. Single STA thread for COM (`StaWorker`).
**Status caveat:** The **production project (`PowerMillMcpServer/`) is NOT checked in** — only the two xUnit test suites (unit + COM-gated integration, T01–T13) and `INTEGRATION.md` are present. Not buildable from this checkout; architecture is recoverable from the tests.

#### PowerInspect-MCP — `mcp-servers/PowerInspect-MCP/files.zip` · TypeScript/Node (winax) · **archived**
**Use:** Author Autodesk **PowerInspect** CMM/OMV inspection programs (features, tolerances, probe paths, patterns), exposing **19 `powerinspect_*` tools**.
A *complete, finished* TS/Node server (index.ts ~1,066 lines, winax COM, optional `step_parser.py`) — but it ships **zipped** (39 KB, 14 files), unbuilt, and wired into no manifest. Must be unzipped + `npm install && npm run build` (needs VS Build Tools for winax) to run.
**Note:** the partition brief mistakenly called this an empty stub — it is actually a full v1.0.0 deliverable, just parked as an archive.

#### FeatureCAM-MCP — `mcp-servers/FeatureCAM-MCP/` · Python (pywin32 COM) · **active (verified rewrite)**
**Use:** Query/control a live Autodesk **FeatureCAM** document and generate NC code, exposing **23 tools** (e.g. `list_setups`, `get_setup_details`, `list_features`, `get_operations`, `check_operation_errors`, `export_stock`, `save_stl`, `simulate_toolpath`, `generate_nc_code`).
Single-file FastMCP server connecting via `EnsureDispatch` + `CastTo IFMDocument` (verified against FeatureCAM 7.27). Cached connection, COM errors → ToolError, verified bitmask enums.
**When to use:** Claude-driven CAM on Windows with FeatureCAM running. Read `EVALUATION.md` first — it documents why the *original* server was broken (15/21 tools failed) and which bundled marketing docs (README/PROJECT_SUMMARY/MANIFEST/QUICKSTART/EXAMPLES/DEPLOYMENT) are unreliable. `phase0_results.json` is the live COM type-library ground truth.

#### aps-fusion-mcp-server — `mcp-servers/aps-fusion-mcp-server/` · TypeScript · **active**
**Use:** Browse/access Autodesk **Fusion** 3D models (designs, component tree, physical properties, exports, thumbnails) via Autodesk Platform Services, exposing **19 `aps_*` tools** over an **HTTP** endpoint.
Wraps three APS APIs: Data Management (REST), Manufacturing Data Model (GraphQL — collapses multi-call traversals), Model Derivative (REST — viewables, properties, async export to STL/STEP/IGES/OBJ/…). 3-legged OAuth2, tokens in-memory, auto-refresh.
**When to use:** "Find the engine-block design, show its component tree, get mass/bounding box, generate a STEP." Prefer GraphQL tools for Fusion (1 call vs 3–5). **Deployment:** Dockerfile + `gcloud run deploy` to Cloud Run (the only HTTP/cloud MCP here; the rest are stdio).

---

## 2. Context-Injection Middleware

Layers that force an agent to see real codebase facts **before** it edits. Three
are working software; one is design docs only.

#### codebase-context-compiler ("ctxpack") — `middleware/codebase-context-compiler/` · TypeScript · **active**
**Use:** Compile (and *enforce*) the smallest complete, evidence-backed **Context Package** for a coding task before the agent edits.
A hexagonal (ports & adapters) CLI. **INDEX** snapshots the repo (Tree-sitter for TS/JS/TSX/Python, optional TypeScript LSP enrichment, SARIF import) into a per-repo **SQLite+FTS5** DB (`.ctxpack.db`, chmod 0600). **PACKAGE** classifies the task, picks a recipe/profile, expands through code relationships, and emits a JSON-Schema-2020-12-validated `task-context.json` (+ Markdown companion) where **known facts, unknowns, assumptions-not-allowed, allowed-creation-points, forbidden moves, and prompt-injection-flagged text are separate typed fields** so the agent can't blur fact with guess; every non-trivial fact carries an `EvidenceRef`.
**Enforcement (the point):** `ctxpack init` installs Claude Code hooks — UserPromptSubmit injects the package; **PreToolUse blocks Edit/Write until the transcript contains a `<CTXPACK_PLAN>` that passes the assumption firewall**, blocks stale packages, blocks generated/vendor/build-output edits, blocks Task/Explore delegation on codebase questions; Stop reports impact + verification commands. Hooks **fail closed**.
**CLI surface:** `init`, `index`, `package` (alias `generate`), `expand`, `override` (auditable human override), `check-plan` (run the firewall), `review` (diff review, `--sarif`), `run-agent` (secondary harness), `hook`.
**When to use:** When you want a regular Claude Code agent handed verified context and blocked from editing until it produces a repo-grounded, firewall-passing plan; or as a CLI to generate/inspect a package or review a diff.
**Notable subsystems:** the **security + assumption firewall** (secret redaction pre-storage, prompt-injection labeling, audit log; plus the pre-edit firewall classifying each plan reference as supported/allowed_creation/unsupported/contradicted/out_of_scope/forbidden); **retrieval-eval** (rubric-scored precision/recall of a package — *unique to this main copy*); **SARIF import/export**.
**Variants/dupes:** `middleware/codebase-context-compiler-sandbox/` is a near-identical fork (see below); the spec/architecture docs are triplicated (here, in -sandbox, and in `middleware/Gemini-context-compiler/`).

#### codebase-context-compiler-sandbox — `middleware/codebase-context-compiler-sandbox/` · TypeScript · **experimental**
**Use:** A container-portable fork of ctxpack for cold/offline/ephemeral environments (Claude on the web, CI, Docker).
Behaviorally identical to the main build (same package format, firewall, hooks) — the differences are **deployment-only**: storage uses Node's built-in `node:sqlite` (zero native deps, installs offline) instead of `better-sqlite3`; `scripts/sandbox-bootstrap.sh` + a `prepare` script install+build+wire hooks in one idempotent command; portable hook commands; `init` gitignores `.context/`/`.ctxpack.db`.
**When to use:** Running ctxpack where the native `better-sqlite3` build can't compile. The non-sandbox build is the reference for local use.
**Diff vs main:** ~100 source/test/doc files are byte-identical; the **main copy is ahead** — it has `retrieval-eval.ts`, `task-profiles.ts`, its test, and a `CLAUDE.md` that the sandbox lacks; the sandbox adds `sandbox-bootstrap.sh`, `cli/program.ts`, `suppress-experimental-warnings.ts`, a `.gitprobe`. (Only 20 shared files differ.)

#### RAG-injection (rag-context.py) — `middleware/RAG-injection/rag-context.py` · Python hook · **active**
**Use:** A Claude Code **UserPromptSubmit** hook that injects codebase-rag (ChromaDB) search results — CONSTRAINTS / PATTERNS / CODE blocks — into context on every prompt (skips prompts <10 chars; fails silent).
**When to use:** When a project has a codebase-rag index and you want every prompt auto-grounded without the agent explicitly calling the RAG tool.
**Key details:** Imports the codebase-rag server modules via a hardcoded `~/Documents/agent-armory/mcp-servers/codebase-rag/...` path (not portable). `NUM_RESULTS=3`.
**Dupes:** **byte-identical** to `hooks/rag-context.py` and `Project-Claude-Configs/Project-Manager/hooks/rag-context.py` (3 copies, md5 `cc250bdb…`).

#### codegraph-context-injection — `middleware/codegraph-context-injection/` · Python (LiteLLM proxy) · **active**
**Use:** A **LiteLLM proxy** callback that injects a structured codegraph context block into *every* LLM API call — provider-agnostic (Anthropic + Gemini).
On each call it RAKE-extracts keywords, runs an external `codegraph.py --trace` per keyword (5-min TTL cache), and prepends a "CODEGRAPH CONTEXT (auto-injected — DO NOT IGNORE)" block listing relevant files, API endpoints, cross-language PRODUCES/CONSUMES bridges, and broken connections, with hard "don't duplicate / don't change signatures" constraints; optionally rewrites the prompt for clarity via a fast model.
**When to use:** When you want codebase-graph grounding applied transparently to **any** agent/tool that speaks the Anthropic/OpenAI API, by routing traffic through a local proxy instead of installing per-host hooks — especially polyglot repos where cross-language connections matter.
**Key details:** Depends on an external `codegraph.py` (the regex-based Python one) + `rake-nltk` (has fallback). Config via env vars; run the proxy on :4000 and point agents via `ANTHROPIC_BASE_URL`.

#### Gemini-context-compiler — `middleware/Gemini-context-compiler/` · docs only · **design-stage**
**Use:** The **spec + architecture** for a Gemini-targeted port of the Context Compiler — reference material, no code.
`spec-…(1).md` (588 lines: FR1–FR24, NFRs, SR1–SR5, threat model, package schema, 7 unresolved decisions) and `architecture-…(2).md` (427 lines: ISO 42010-style, decisions D1–D13, chooses a TS/Node CLI named "ctxpack"). Despite the "Gemini" name, the architecture targets the same TS stack as the real compiler — this directory is the **design lineage** the two implementations descend from.
**Dupes:** both files are byte-identical to the `docs/specs/` + `docs/architecture/` copies inside both compiler builds (3-way identical).

---

## 3. Plugins & Profiles (multi-component bundles)

### 3.1 AgentBoard — the system (the repo's centerpiece)

**What it is:** AgentBoard is an AI project-management application with a *separate*
Node/Express + SQLite backend and a **cloud-hosted MCP** (`https://mcp.agent-board.app/mcp`,
app at `agent-board.app`). The Claude Code plugin (`claude-plugins/agentboard/`,
**v0.6.1**) wraps it to run rigorous, multi-agent software delivery. It exposes two
parallel workflows on one backend:

- **Phase-based projects** — a strict **13-phase lifecycle** (Init → Codebase Survey
  → Requirements → Constraints → Risk → Architecture → Contracts → Test Strategy →
  Task Breakdown → Implementation → Verification → Review → Complete); each of phases
  1–9 produces an *approved document* as its deliverable, gated by a blocking
  human-review ("submit-and-wait") step. Driven by the lifecycle skills (kickoff /
  pickup / status / wrap-up).
- **Workspace boards** — ad-hoc kanban: cards flow `backlog → planning → review →
  implementation → audit → finished` with **append-only artifacts** and
  **verdict-driven** rejection loops. Driven by the pipeline skills (foundation →
  architecture → orchestrate, plus sweep).

**The end-to-end pipeline:** `/foundation` (write an architecturally-silent spec) →
`/architecture` (level-aware: classify L1/L2/L3, write the architecture doc, slice
into cards) → `/orchestrate` (run planning → review → implementation → audit waves of
parallel sub-agents over the cards). All card movement is **server-enforced and
verdict-driven** — agents never move cards; the server reads the `## Verdict:` heading
on `review_note`/`audit_report` artifacts (illegal transitions return HTTP 422).

**Companion MCP servers** (wired in `.mcp.json`): the cloud **agentboard** (HTTP),
local **codegraph** (stdio, 8-tool trimmed build) and **codebase-rag** (stdio, 2 tools)
for grounding, and **clear-thought** (npx) for structured reasoning in the heavy compose
agents.

**Reference docs:** `PLUGIN-OVERVIEW.md` (1,486-line deep reference) and `PORT_MAP.md`
(cross-runtime sync contract) — both describe v0.3.0 and are slightly behind 0.6.1.

> The same toolset is ported into four other trees (Codex, two Gemini variants, and
> the Project-Manager profile). See §3.5–3.6 and the duplicate analysis in §10.

### 3.2 AgentBoard sub-agents — `claude-plugins/agentboard/agents/` (14, claude-code)

These are dispatched automatically by the pipeline skills; **never invoke directly**.
All activate the `expert-standards` frame; routing is verdict-driven. Three pipelines
follow a **research (cheap model) → compose (opus)** split, plus reviewers and two
board-level cross-card barriers.

| Agent | Model | Role |
|---|---|---|
| `architecture-research-agent` | sonnet* | **Arch Phase A:** gather 8 classification + 7 design facts into `ARCH_FACTS_BUNDLE_V2`; apply v1.0 rules to compute the level |
| `architecture-classification-auditor` | sonnet (ext. thinking) | **Arch Phase A audit:** independently re-derive every bundle field *before* seeing the research bundle, correct it, emit `verified_level` |
| `architecture-compose-l1` | opus | **Arch Phase B (L1):** slim doc + card slices for trivial work (1–3 cards, no new contracts) |
| `architecture-compose-l2` | opus | **Arch Phase B (L2):** doc + slices for coupled work introducing internal contracts |
| `architecture-compose-l3` | opus | **Arch Phase B (L3):** comprehensive doc for substantial work (external systems/migration/security); wires in Clear Thought + threat model + ASVS |
| `architecture-design-reviewer` | sonnet (ext. thinking) | **Arch Phase B review:** advisory `ARCH_DESIGN_REVIEW_V1` findings (coverage gaps, unjustified slices, contract mismatches, decision-hiding) |
| `planning-research-agent` | haiku | **Plan Phase A (per card):** RAG-then-codegraph facts → `FACTS_BUNDLE_V1` |
| `plan-compose-agent` | opus | **Plan Phase B:** 14-section audit-grade implementation plan, Gates A/B/C, Context7-verified |
| `review-agent` | opus | **Per-card review:** validate a plan vs standards + slice + source; PASS/FAIL `review_note` (**default FAIL**) |
| `implementation-agent` | sonnet | **Per-card implementation:** execute the plan, write code, build/lint → `implementation_note` |
| `audit-research-agent` | haiku | **Audit Phase A:** git-diff + codegraph facts → `AUDIT_FACTS_BUNDLE_V1` |
| `audit-compose-agent` | opus | **Audit Phase B:** PASS / PASS WITH NOTES / FAIL `audit_report` |
| `cross-card-plan-reviewer` | opus | **Board-level Review barrier:** hold *all* plans at once, catch cross-card contract/dependency/coverage inconsistencies before per-card review |
| `cross-card-implementation-auditor` | opus | **Board-level Audit barrier:** hold *all* implementations at once, catch realized signature/shared-file/cycle integration drift before per-card audit |

\* *Known inconsistency:* the architecture-research-agent frontmatter pins `claude-sonnet-4-6`,
but its body and sibling profiles call it "the haiku research agent" (require
`claude-haiku-4-5`).

### 3.3 AgentBoard skills — `claude-plugins/agentboard/skills/` (17, claude-code)

**Session lifecycle (thin MCP wrappers):**
- **`kickoff`** — onboard a fresh agent + create a new phase-based project (OAuth bootstrap, health check, create_project). *Use to start.*
- **`pickup`** — resume existing work in a continuation session (find in-progress/next task, recent activity). *Use to continue.*
- **`status`** — read-only snapshot of a **phase-based project** (phase N/13, task counts, blockers, next action).
- **`board-status`** — read-only snapshot of a **workspace board** (per-column card counts, % finished, cards needing attention).
- **`wrap-up`** — cleanly end a session, write progress notes + a handoff for the next agent.

**Pipeline drivers:**
- **`foundation`** — interactive spec-building session → architecturally-silent spec at `docs/specs/`, hands off to `/architecture`. (Delegates rigor to `spec-writing`.)
- **`architecture`** — 21-step orchestrator: research → classification audit → L1/L2/L3 compose → design review → user approval → commit doc + create one card per slice. *Run only on an approved spec.*
- **`orchestrate`** — run the 4-wave parallel pipeline (planning→review→implementation→audit) across a board's cards, with cross-card barriers and checkpoint pauses. *Run only when cards exist.*
- **`correction-loop`** — the **single source of truth** for how a rework inside the architecture pipeline is source-traced, routed (to doc / facts / spec), bounded (3-attempt cap), and escalated. A policy/decision skill the architecture stages defer to. *(MEMORY.md flags its design lineage as historically disputed.)*

**Spec authoring/repair:**
- **`spec-writing`** — rigorous grounded-requirement spec authoring (named standards, three-test discipline, threat-model-first, auditable derivation).
- **`spec-rescue`** — rebuild a corrupted/drifted spec via a **ledger workflow** (atomic decision records → conflict register → derived prose) instead of prose-first rewriting; integrates the CORE memory protocol.

**Codebase survey & search:**
- **`codebase-sweep`** — read-only methodology to survey a codebase and write a prioritized findings doc (no card creation).
- **`sweep`** — same survey methodology **plus** triaging findings into workspace cards for `/orchestrate`.
- **`codebase-rag`** — thin always-on wrapper telling the agent when/how to call `rag_search`/`rag_query_impact` (hosted-backend framing; cf. the standalone MCP in §1A).

**Cross-cutting frame:**
- **`expert-standards`** — the foundational "judge against named engineering standards, not against the existing codebase" mindset. Activated by nearly every other agent/skill as the governing frame.

**Fixture:** `correction-loop-workspace/` is a skill-eval/benchmark dump (with-skill vs without-skill runs, grading, timing) — generated data, not a tool.

### 3.4 AgentBoard plugin infrastructure — `claude-plugins/agentboard/`

- **`.claude-plugin/plugin.json`** — manifest (name agentboard, **v0.6.1**; hooks → `./hooks/hooks.json`; commands/skills/agents auto-discovered). *Not yet in marketplace.json (which still says v0.3.0).*
- **`.mcp.json`** — wires 4 MCP servers (cloud agentboard HTTP + local codegraph/codebase-rag stdio with hardcoded Windows paths + clear-thought via npx). **Byte-identical** to the Codex port's `.mcp.json`.
- **3 hook events / 4 scripts** (`hooks/`):
  - **SessionStart** (prompt) — OAuth bootstrap + health check.
  - **PreToolUse** on `submit_workspace_artifact` chains three scripts: `artifact-quality-gate.sh` (block non-arch artifacts with TODO/TBD/placeholder language), `validate-architecture-artifact.sh` (structurally validate the 4 architecture artifact types against rule sets R-DOC/BUNDLE/AUDIT/REVIEW, recompute the level), `inject-quality-gate-prompt.sh` (inject the submission checklist for non-arch artifacts).
  - **PostToolUse** on card fetch/claim — `workspace-card-guidance.sh` injects phase-appropriate standards.
  - `hooks/tests/` — 47-fixture pass/block test harness (`run-tests.sh` + `build-fixtures.py`).
  - *Known gap:* matchers use `mcp__agentboard__*` but plugin-bundled tools are `mcp__plugin_agentboard_agentboard__*` (namespace mismatch noted in `user-notes.txt`).
- **`reference/agent-profiles/`** — *not loaded* by Claude Code. The pre-refactor single-phase `planning-agent.md`/`audit-agent.md` (superseded by the two-phase split, kept for porting), an `expert-implement.md` dispatch reference (formatting-damaged), and a README.
- **`docs/`** — project history (not tools): `handoffs/` (14 dated session handoffs incl. the 2026-05-16 **FAILED** architecture-rework), `plans/` (design/rework plans; the 2026-05-12 rework plan §7 is the spec of record for the validation hook), `specs/` (the spec-rescue ledger working set + draft specs for remediation-project-type and transcript-capture-hook), `ideation/`.
- **`dev-work-resources/`** — working copies of `spec-rescue`/`spec-writing` SKILLs (one is byte-identical to the plugin skill) + duplicate handoffs.
- **`AGENTS.md`** / **`user-notes.txt`** — correction-loop guardrails + a raw bug/feature backlog (documents the namespace breakage, HTTP 500 on add_log_entry, 25k artifact truncation, etc.).

### 3.5 AgentBoard ports — Codex & Gemini

The same AgentBoard toolset is re-packaged for three other hosts. `PORT_MAP.md`
declares **`claude-plugins/agentboard` as the source of truth**; the others are
adaptations. The skills/agents are functionally the same as §3.2–3.3 — what differs
is **packaging and host conventions**, summarized here.

| Tree | Host | Version | Packaging notes |
|---|---|---|---|
| `claude-plugins/agentboard` | Claude Code | **0.6.1** | Source of truth: `.md` commands, `.sh` hooks (SessionStart/PreToolUse/PostToolUse), `agents/` sub-agents with `model:` pins |
| `codex-plugins/agentboard` | OpenAI Codex CLI | 0.1.0 | No `agents/` dir, **no hook model** — sub-agents become reusable **worker reference prompts** (`skills/*/references/*-worker.md`) fed to runtime `spawn_agent`; hook-enforced gates become written instructions inside `workspace-orchestration` |
| `gemini-extensions/agentboard-gemini` | Gemini CLI | 0.1.0 | True Gemini extension: `gemini-extension.json`, `.toml` commands (thin dispatchers → `*-agent.md` subagents), **Python** hooks (`BeforeTool`/`AfterTool`), snake_case `mcp_*` tool names, no model pins, **adds clear-thought** MCP |
| `gemini-extensions/agentboard` | Claude Code (**mislocated**) | 0.1.0 | A Claude-convention plugin sitting *inside* `gemini-extensions/` — the upstream baseline the Gemini port was adapted from; not actually a Gemini extension |
| `Project-Claude-Configs/Project-Manager` | Claude Code profile | — | A profile (not a plugin) that vendors the AgentBoard skills/commands alongside much else — see §3.6 |

**Codex-specific design** (`codex-plugins/agentboard`): because Codex has no hooks and
no sub-agent dispatch, the four orchestration workers (`planning/review/implementation/audit-worker.md`)
and the five architecture workers (`research`, `classification-auditor`, `compose-l1/l2/l3`)
live as **reference prompt templates** under `skills/orchestrate/references/` and
`skills/architecture/references/`. A dedicated **`workspace-orchestration`** skill carries
the wave/retry/quality-gate rules that the Claude side puts in hooks + sub-agent defs.
The `architecture/` skill tree is **untracked (WIP)** and not yet in the Codex README skill map.
Also: the Codex `foundation` skill creates cards directly from the spec, which is in tension
with the Codex `architecture` skill's rule that cards should come from approved slices.

**Gemini-specific design** — and a critical content (not just syntax) divergence:
`GEMINI_EXTENSION_SPEC.md` (1,186-line source-cited reference) governs the port. Because
Gemini forbids subagent-spawns-subagent, **`/orchestrate` runs in the main agent context**
and dispatches per-card calls in one turn. The genuine extension (`agentboard-gemini`) has
**no SessionStart auth hook** (Gemini lacks prompt-type SessionStart), so every command
re-checks auth. **Importantly, the gemini-gemini `planning-agent` (400 lines) and `audit-agent`
(163 lines) were rewritten to carry the full Expert-Standard / Gate A-B-C audit-grade rigor
inline, while the Claude-plugin copies of those two are the shorter pre-rigor templates** — but
the Claude-plugin `review-agent` is the more rigorous one there. So "which copy is best" varies
per agent. Quirk: `gemini-extensions/agentboard/skills/expert-standard.md/` is a directory
literally named with a `.md` suffix (a bug fixed on the gemini side, not the claude side).

### 3.6 Project-Manager profile — `Project-Claude-Configs/Project-Manager/`

A **complete checked-in Claude Code profile** (settings + agents + commands + hooks + skills
+ memory) purpose-built to run the deployment-readiness program for the AgentBoard app on
Google Cloud Run. It is largely a **vendored mirror** of the repo's top-level `skills/`,
`commands/`, and `hooks/` (dozens of byte-identical files — see §10) **plus** a set of
**profile-unique** pieces:

**Unique sub-agents** (`agents/`) — all AgentBoard-project-specific:
- **`production-code-auditor`** (opus) — opinionated enterprise pre-deployment audit (OWASP, error handling, infra readiness) that also produces refactored code; REJECTs on any security/secret/error-handling gap. *(Byte-identical to `commands/production-code-auditor.md` at the top level — same file, agent vs command role.)*
- **`contract-drift-detector`** — three-way comparison across 11 hardcoded AgentBoard contract pairs (source ↔ `docs/contracts/*` ↔ CLAUDE.md section); findings only.
- **`state-machine-validator`** — focused pass/fail gate on the AgentBoard task state machine that actually runs `npm test --prefix server`.

**Unique commands** (`commands/`):
- **Expert lifecycle** — `/expert-spec`, `/expert-plan` (~390 lines, codegraph+Context7+Clear-Thought-backed), `/expert-review` (frame- + premise-correctness, findings-only), `/code-review` (Principal-Engineer diff review, inline-comment format). *(These four are byte-identical to the top-level `commands/Expert-Commands/` set — see §5/§10.)*
- **AgentBoard lifecycle** — `/kickoff`, `/pickup`, `/wrap-up`, `/foundation`, `/orchestrate`, `/board-status` (mirror the agentboard skills; `wrap-up`/`orchestrate` are byte-identical to the gemini-plugin copies).
- **Legacy "Planning/" quartet** — `/setup` → `/implement` → `/verify` → `/status`: a file-based Step-1-4 workflow (STATUS.md + PLAN_step*.md, DB backups, git checkpoints) **superseded** in practice by the expert lifecycle + AgentBoard orchestration.
- **Session bookends** — `/session-start` (invoke expert-standard + rag-enforcer, read latest handoff, init CORE Memory, state locked decisions before any code) and `/session-end` (completion audit, doc updates, **CORE Memory ingestion** following the exact approval protocol). These wire in the CORE Memory MCP per the global memory rules.
- **`/team-review`** — orchestrate a 2-agent Team (code-tracer + doc-reviewer) to verify an AgentBoard document against code via `TeamCreate`/`SendMessage`. **`/ideation`** — lightweight checklist spec. **`/workflow-violation`** — a one-line hard "re-invoke expert-standard now" escalation.

**The "superpowers" discipline-skill family** (`skills/`, mostly profile-local — these have
*no* top-level standalone copy and are a distinct, reusable engineering-rigor library):
- **`using-superpowers`** — meta-router: invoke any relevant skill *before* acting (even before clarifying questions).
- **`brainstorming`** — hard-gated: no code until a design doc is written and user-approved; hands off to `writing-plans`.
- **`writing-plans`** → **`executing-plans`** (batch execution with review checkpoints) / **`subagent-driven-development`** (one fresh subagent per task with spec-then-quality review).
- **`dispatching-parallel-agents`** — one subagent per independent problem domain.
- **`requesting-code-review`** (+ `code-reviewer.md` template) / **`receiving-code-review`** (no performative agreement; verify before implementing).
- **`finishing-a-development-branch`** — present exactly 4 integration options (merge/PR/keep/discard) and execute safely.
- **`test-driven-development`** (+ `testing-anti-patterns.md`) — Iron Law: no production code without a failing test first.
- **`systematic-debugging`** — Iron Law: no fixes without root-cause investigation; ships technique docs (condition-based-waiting, defense-in-depth, root-cause-tracing) + eval fixtures.
- **`verification-before-completion`** — no completion claim without fresh verification-command evidence in the current message.

**AgentBoard-specific skills** (`skills/`): `agentboard` (older/leaner usage guide), `codebase-rag`
(diverged copy), `source-of-truth-sync` / `verify-alignment` (the writer/verifier pair for the
contract map), `workspace-orchestration` (board pipeline).

**Mirrored skills** (byte-identical to top-level `skills/`): `app-user-docs`, `audit-swarm`
(7 specialist auditors + synthesizer), `frontend-standards`, `mcp-builder`, plus the canonical
copies of `systematic-debugging`/`verification-before-completion`/`verify-alignment`/`source-of-truth-sync`.

**Config/memory:** `settings.json` (enabled marketplace plugins incl. superpowers) +
`settings.local.json` (the operational config — wires codebase-rag/codegraph/agentboard MCP,
the full hook stack, permission allowlist). `memory/deployment-readiness.md` (live program
state + locked decisions) and `memory/pending-core-memory-ingestion.md` (a staged CORE Memory
write awaiting a CORE-capable session). `scheduled_tasks.lock` is a runtime lock artifact.

> Paths inside this profile (`.claude/...`, repo `Maxcogar/Project-Manager`) indicate it is a
> **snapshot/template of a profile deployed elsewhere**, checked into agent-armory for reference.

### 3.7 gcp-iot plugin — `claude-plugins/gcp-iot/` · v1.0.0 · **active**

A self-contained Claude Code plugin for debugging/operating one specific GCP IoT
architecture: **ESP32 → HTTPS → Cloud Run → Pub/Sub → WebSocket/Firestore/BigQuery →
React on Firebase Hosting**. Pure `gcloud`/`firebase`/`curl` CLI — **no MCP server, no
code**. Per-project config via `.claude/gcp-iot.local.md`.

**6 sub-agents** (autonomous, one per layer): `iot-telemetry-tracer` (end-to-end data-loss
trace), `cloud-run-debugger` (backend 500/503/cold-start/deploy), `pubsub-inspector`
(backlog/push/dead-letter), `websocket-debugger` (realtime/React sync), `esp32-diagnostics`
(firmware/WiFi/HTTPS), and **`gcp-architect`** (the only **opus** agent — architecture review,
scaling, security, cost).

**8 `/gcp:*` commands** (the command-form counterparts): `status` (light health dashboard),
`diagnose` (full cross-layer pass), `trace` (end-to-end telemetry trace), `logs` (filtered
log fetch/analysis), `deploy` (the only mutating command — gated by the PreToolUse deploy
hook), `pubsub` (hands-on topic/sub/message ops), `test-sensor` (inject synthetic telemetry),
`websocket` (WS config + frontend code grep).

**4 reference skills** (the doc-form counterparts to the agents): `gcp-iot-patterns`,
`cloud-run-debugging`, `pubsub-troubleshooting`, `esp32-gcp-integration`.

**Hooks:** two *prompt* hooks (no scripts) — SessionStart gcloud-auth reminder + PreToolUse
deploy-safety guard on `gcloud run deploy`/`firebase deploy`.

> **When to use which form:** the **command** for a quick scripted check, the **agent** for
> autonomous multi-step investigation, the **skill** as a reference playbook to consult or
> hand to the user. The three forms deliberately overlap per layer.

---

## 4. Skills — standalone library (`skills/`), grouped by function

These are reusable Claude Code skills not tied to a plugin. Many have byte-identical
copies inside the Project-Manager profile (§3.6) and/or the AgentBoard plugins — noted
inline and consolidated in §10. The **"superpowers" discipline family** (brainstorming,
writing-plans, executing-plans, subagent-driven-development, dispatching-parallel-agents,
finishing-a-development-branch, requesting/receiving-code-review, TDD, using-superpowers)
lives only under the Project-Manager profile — see §3.6.

### 4a. Engineering-standard & evaluation frames (change how Claude judges, not what it ships)
- **`expert-standard(s)`** — *the* foundational frame: judge work against named engineering standards (SOLID/OWASP/RFC/WCAG…), not against existing-codebase patterns; verify factual claims against source before asserting. Activates ambiently on any engineering judgment, especially before praise. **Five+ copies exist** under slightly different names — canonical pair: `skills/Expert-Skills/expert-standard/` (59-line "singular") and `skills/expert-standards/` (47-line "plural", untracked). For a *structured* review use the `/expert-review` command instead. See §10 for the full copy map.
- **`frontend-standards`** — the Expert Standard applied to UI/UX: judge interfaces against WCAG 2.2 / Nielsen heuristics / Gestalt / Core Web Vitals, not "what modern sites look like"; mandates a Design Decisions report. Ships `references/measurable-standards.md` (exact thresholds) + `wcag-checklist.md`. Triplicated (`skills/frontend-standards/`, `skills/Expert-Skills/frontend-standards/`, Project-Manager — all byte-identical).
- **`frontend-design`** (dir `skills/Design-Thinking/`) — the *generative* counterpart: push for a bold, distinctive aesthetic direction rather than the generic default look. Complements (doesn't duplicate) frontend-standards (which is the *evaluative* side).

### 4b. Spec, planning, lifecycle & project bootstrap
- **`expert-plan`** (`skills/Expert-Skills/expert-plan/`, new/staged) — produce an implementation plan executable with **zero on-the-fly decisions**: CodeGraph survey, named standards, Context7 verification, Clear Thought, a question register. Refs `output-contract.md`, `testing-standards.md`. (Skill form of the `/expert-plan` command; cf. PM `writing-plans`.)
- **`expert-implement`** (`skills/Expert-Skills/expert-implement/`, new/staged) — main-agent executor that turns an approved plan into code under the Expert Standard; preflight, in-order steps, halts on 4 categories (premise-false, hard-rule conflict, blast-radius exceeded, environment-blocked). Refs `verification-taxonomy.md`, `review-handoff.md`. (cf. PM `executing-plans`.)
- **`ideation`** (untracked) — develop a half-formed idea into a complete, testable feature spec via thinking-partner dialogue with a **mandatory running scratchpad** (Decided / Ruled out / Open questions / Current shape) in every reply. Requirements-only (no priority tiers).
- **`backend-spec-builder`** — question-driven backend architecture outline that documents **only confirmed answers**; refuses to propose tech/schemas/endpoints unprompted ("if the user didn't say it, don't write it").
- **`project-contractor`** — "KNOW BEFORE YOU DO": a 5-subagent parallel survey (Structure/Connections/Operations/State/Dependencies) → a validated `SOURCE-OF-TRUTH.md`, with red-flag stops and an assumptions log. Ships `references/` + `init-survey.sh`/`verify-survey.sh`. *(Older survey approach.)*
- **`project-lifecycle`** (untracked) — the **rigorous Expert-Standard successor** to project-contractor: a 6-phase lifecycle (Define→Design→Build→Verify→Operate→Maintain) on ISO/IEC/IEEE 12207, each phase with named governing standards + a binary quality gate + an output contract. Greenfield enters at Define; brownfield uses `adopting-on-an-existing-repo.md` (Strangler Fig). 8 phase/concern reference files.
- **`Project-Template`** — a scaffold (not a skill): `init-engineering-project.sh` + CONTEXT/TODO/decision/reference/sources templates for bootstrapping an engineering/CAD/R&D workspace.

### 4c. Audit, review & cleanup
- **`audit-swarm`** — spawn **7 specialist auditors in parallel** (security, error-handling, validation, performance, architecture, production-readiness, test-coverage) each writing to its own file, then a **synthesizer** re-verifies and consolidates into a prioritized `00-consolidated-report.md`. Opting in *is* the rigor switch. ⚠️ The SKILL.md is stored with literal backslash-escaped markdown (garbled); there's a stray byte-identical `TEST/SKILL.md`; and the whole tree is byte-identical to the Project-Manager copy.
- **`codebase-cleanup`** — methodical **5-phase React/Vite cleanup** (Discovery→Analysis→Validation→Planning→Execution) with named subagents A–K, backups, rollback, emergency-stop, and explicit approval before any delete/move. Real scripts: `find-unused-exports.js` (Babel AST), `validate-imports.js`, `init-cleanup.sh` (the SKILL.md-embedded versions are simplified stubs).

### 4d. Codebase understanding & retrieval
- **`codebase-rag-enforcer`** — RAG-powered **architectural-constraint enforcement** (surface contracts/patterns *before* edits). **Bundles its own full Python ChromaDB MCP server** (`mcp-server-python/`, 6 tools: `rag_setup`, `rag_index`, `rag_check_constraints`, `rag_query_impact`, `rag_health_check`, `rag_status`) — a self-contained copy of the `mcp-servers/codebase-rag` server (older fork). Includes design/audit docs in `analysis/`. Per project CLAUDE.md this is **out-of-scope/stale** relative to the active `mcp-servers/codebase-rag` rebuild.
- **`codebase-recon`** — **script-first** recon of unfamiliar code: 10 categories of grep/find/git probes; hard rule "max 5 file reads before synthesizing — scripts locate, the LLM interprets." (`files/SKILL.md` is an in-skill duplicate; ships a `files.zip`.)
- **`api-endpoint-mapper`** — map every backend route ↔ frontend API call, flag broken/unused/typo'd connections → `API-ENDPOINT-REPORT.md`. Engine: `scripts/scan_endpoint.py` (stdlib). ⚠️ WIP: SKILL.md references `scan_endpoints.py` (plural) but the file is singular; script is UTF-16 with corrupted emoji.
- **`engineering-design-navigator`** — workflow skill governing **when/how to call the external Design Navigator MCP** (a 16-tool decision-graph server) to track engineering decisions as a dependency graph with verification gates and cascade detection. `references/tool-quick-reference.md` documents all 16 tools. (Server lives outside the repo; nested `engineering-design-navigator/engineering-design-navigator/` dir.)
- **`app-user-docs`** — generate an honest user-facing app document via a **two-phase subagent pipeline** (Phase 1 surveyor → raw inventory; Phase 2 writer → readable doc) with ✅/⚠️/❌/❓ completeness flags and a blunt "What's Not Working Yet" section. (Byte-identical Project-Manager copy.)

### 4e. Debugging, testing, verification & contract sync
- **`systematic-debugging`** — Iron Law: **no fixes without root-cause investigation first**; 4 phases, architecture-question escalation after 3 failed fixes. Ships technique docs (`root-cause-tracing`, `defense-in-depth`, `condition-based-waiting`) + eval fixtures. (superpowers lineage; byte-identical Project-Manager copy.)
- **`testing-setup`** — stand up a test framework and run a prioritized plan (P0 services → P7 config) in any codebase. Deterministic runner choice (pytest/vitest/jest), `survey.py` static analyzer, and current `jest`/`pytest`/`vitest` reference docs.
- **`verification-before-completion`** — Iron Law: **no completion claim without fresh verification-command evidence** run in the current message. (superpowers lineage; byte-identical Project-Manager copy.)
- **`verify-alignment`** — read-only AgentBoard contract-drift verifier (tests + lint + codegraph + 7-pair contract comparison) that **reports drift but doesn't fix**. Project-specific paths. Hook-triggerable. (Byte-identical Project-Manager copy.)
- **`source-of-truth-sync`** — the **writer** counterpart: after editing a contract-paired source file, update its docs + CLAUDE.md to match (code is authority). Hook-triggered (contract-edit-guard). **3 byte-identical copies** (here, Project-Manager, `workflows/codebase-documentation/`).

### 4f. Meta — building agents / skills / MCP servers
- **`AGENT-CREATION`** (`skills/AGENT-CREATION.skill/`) — author/refactor sub-agent definition files reliably (template + 8 pitfalls + 5 test paths).
- **`mcp-builder`** — Anthropic's MIT-licensed 4-phase guide (research → implement → review → evaluate) to building production MCP servers in Python (FastMCP) or Node/TS; ships full language references (`node_mcp_server.md` 980L, `python_mcp_server.md` 719L), `mcp_best_practices.md`, and a runnable eval harness (`evaluation.py`). Byte-identical Project-Manager copy. *(Distinct from the `mcp-server-dev` plugin skills.)*
- **`SOLUTIONS-ARCHITECT`** (wip) — 5-phase skill for designing multi-agent Claude Code orchestrations (context-management, cascade, enforcement patterns); 6 reference docs, some stubbed.

### 4g. Domain-specific
- **`arduino-development`** — incremental Arduino/ESP32/ESP8266 firmware development (blink-test-first, component isolation, watchdog/error-recovery) with large C++ templates, `arduino_helper.sh` (arduino-cli menu), and ESP32/sensor/troubleshooting references.
- **`genkit-architect`** — patterns for building AI features with Google Genkit (defineFlow + Zod, configureGenkit, Dotprompt). *(References the older split `@genkit-ai/*` package API.)*

### 4h. Process / self-improvement
- **`feedback-improvement`** — turn a user-reported Claude failure into a durable fix: isolate → diagnose root cause → choose fix location (memory edit / skill-fix proposal / session-only) → execute → validate with the user.

---

## 5. Slash Commands — standalone (`commands/`)

14 command files. The **Expert pipeline** is the spine; the rest are reviewers and session
bookends. **Seven of these have byte-identical copies in the Project-Manager profile** (§3.6/§10).

**The Expert pipeline** (`commands/Expert-Commands/`) — `spec → architecture → plan → implement → review`,
all enforcing the Expert Standard (judge against named standards, verify every premise):
- **`/expert-spec`** — write a grounded spec where every requirement traces to a named standard / confirmed need / genuine constraint, passing the three tests (source, abstraction, downstream); threat-model-first; architecturally silent. → `docs/specs/`. *(Byte-identical PM copy.)*
- **`/expert-architecture`** — the flagship **brownfield** architecture command: 11+ phases, mandates codebase-RAG + CodeGraph + Context7 + the full Clear Thought suite, five-part design decisions, ISO 25010 + ASVS mapping, 5-trap audit. Two siblings:
  - **`/expert-architecture-greenfield`** — for new projects (drivers-from-spec + stack-selection-from-scratch; swaps in the "default-stack" trap).
  - **`/expert-architecture-greenfield-portable`** — same rigor **without Context7/Clear Thought**: replaces them with web-search premise verification + mandatory written reasoning templates. Use offline/tool-less.
- **`/expert-plan`** — executable plan with **zero on-the-fly decisions**: CodeGraph survey, Context7 verify, Clear Thought, 14-section output contract (decisions = frame proof, claim-verification = premise proof, gaps). STOPs if tools missing. → `docs/plans/`. *(Byte-identical PM copy + a skill-form copy in `skills/Expert-Skills/expert-plan/`.)*
- **`/expert-implement`** — thin **orchestrator** that dispatches the `expert-implementer` sub-agent (§6) to execute an approved plan, verifies any STOP report, routes to `/expert-review`. *(Skill-form copy in `skills/Expert-Skills/expert-implement/`.)*
- **`/expert-review`** — independent **binary PASS / NEEDS FIXES** gate; two axes (frame- + premise-correctness), exhaustive file inventory, Critical/Serious/Moderate/Minor/Systemic, no middle verdict. *(Byte-identical PM copy.)*
- **`Agent-Compliance-checklist.md`** — not a command but the **8-gate rubric** (read-before-write, scope, 4-part decision justification, completion-with-evidence, security primitives, output quality, communication, foundation-vs-patch) that the expert commands' decision format draws on.

**Lighter alternative:**
- **`/architecture`** (`commands/Spec-and-Architecture-Flow/`) — a prose-driven, judgment-first architecture command with **no** phase machinery / tool mandates / audit gates. Use when you want a readable implementation-path doc, not the heavy auditable artifact.

**Reviewers** (increasing rigor): **`/code-review`** (diff-scoped Principal-Engineer inline comments, byte-identical PM copy) < **`/expert-review`** (standards-anchored binary gate) ≈ **`production-code-auditor`** (enterprise pre-deploy audit, opus, *produces refactored code*, agent-style frontmatter) ≈ **`/team-review`** (two collaborating agents — code-tracer + doc-reviewer — verify an AgentBoard *document* vs code via `TeamCreate`/`SendMessage`; byte-identical PM copy).

**Session bookends** (Project-Manager/AgentBoard-specific, byte-identical PM copies): **`/session-start`** (load expert-standard + rag-enforcer, read latest handoff + source-of-truth docs, init CORE Memory, state locked decisions before any code) and **`/session-end`** (expert-standard recheck, completion audit, doc/memory updates, exact-protocol CORE Memory ingestion).

---

## 6. Sub-agent Definitions — standalone (`agents/`)

17 files = 13 sub-agent profiles + 1 dispatch command + 2 reference docs. **Two distinct clusters**, neither tied to AgentBoard:

**Cluster A — the CNC Syndicate Dashboard agent fleet** (hardcoded to a React 19 + Vite voice-first dashboard; note their MCP tool prefixes `mcp__core-memory__` / `mcp__upstash_context7__` differ from this environment's `mcp__claude_ai_*`, so they're project/environment-specific):
- **`backend-research`** (sonnet) — Context7-first research of libraries/APIs *before* implementation; writes findings to `docs/` + CORE Memory. The upstream step.
- **`plan-architect`** (opus) — context-gathering planner (CORE Memory search + real-code verification) producing multi-session plans with handoff checkpoints; has the Task tool. **Overlaps** `implementation-plan-architect` (sonnet, even more granular file:line plans, no memory/handoff).
- **`backend-architect`** (opus) — definitive backend *blueprints* (endpoints/schema/file structure); **`backend-engineer`** (sonnet) — *implements* Node/TS/Express + OAuth proxies; **`api-integration-specialist`** — frontend-facing type-safe API clients (Zod, retry, cancellation). (architect designs ↔ engineer builds ↔ specialist wires the client.)
- **`react-component-architect`** — React components/hooks/perf, built to preserve the dashboard's voice-command refs+state pattern.
- **`production-code-auditor`** (opus) — enterprise security/quality audit (writes report to file). *(Largely project-agnostic; same rubric as the `commands/production-code-auditor.md` command but a distinct file.)*
- **`web-error-inspector`** (haiku) — drives the chrome-devtools MCP to inspect a *running* app for runtime/console/network/visual errors. *(Its prompt says "plant health dashboard" — inconsistent with the CNC framing; depends on many MCP servers.)*
- **`mermaid-flow-visualizer`** (opus) — author accessible Mermaid diagrams on explicit request (largely project-agnostic).
- **`claudemd-maintainer`** (haiku) — surgically sync an existing `CLAUDE.md` to codebase reality (Edit-only, preserves user content).
- **`CORE-Agents/memory-ingest`** & **`memory-search`** (sonnet) — write/read CORE Memory subagents (single-tool each; hardcode a CNC project label).
- Reference docs: **`agent-quick-guide.md`** (roster + routing + workflow chains) and **`orchestration-strategy.md`** ("context addition, not interpretation" delegation playbook). Both reference a `MANDATORY-VERIFICATION-PROTOCOL.md` and a `feature-architect` agent that are **not present**.

**Cluster B — the Expert Standard execution pair** (`agents/Expert-Agents/Expert-Implementation/`, new/untracked, project-agnostic):
- **`expert-implement`** (dispatch command) + **`expert-implementer`** (the agent) — execute an approved plan under a strict preflight/verification-taxonomy contract with four STOP categories (premise-false, hard-rule-conflict, blast-radius-exceeds-plan, environment-blocked); the implementer never grades its own work (routes to `/expert-review`). Requires the `expert-standard` skill. Intended to deploy to `.claude/agents/` + `.claude/commands/`. Overlaps the `skills/Expert-Skills/expert-implement/` skill.

> See also the **14 AgentBoard pipeline sub-agents** (§3.2) and the **6 gcp-iot agents** (§3.7), which live inside their plugins rather than here.

---

## 7. Hooks — standalone (`hooks/`)

Standalone Claude Code / git hooks. **Most are byte-identical to the Project-Manager copies**
(§10); the plugin hooks are covered in §3.4/§3.5/§3.7. Grouped by purpose:

**RAG-first search gating** (a paired set — bind together):
- **`block-first-search.sh`** (PreToolUse on Grep|Glob) — denies the *first* Grep and first Glob each turn, telling the agent to use `rag_search`/`rag_query_impact` first; second call passes.
- **`reset-search-blocks.sh`** (UserPromptSubmit) — clears the per-turn flags so the gate re-arms next turn. *(Useless without the above.)*

**RAG context injection:**
- **`rag-context.py`** (UserPromptSubmit) — injects top-3 codebase-rag results (CONSTRAINTS/PATTERNS/CODE) into context each prompt. **Byte-identical to `middleware/RAG-injection/rag-context.py` and the PM copy** (3 copies).

**Contract / doc-sync enforcement** (AgentBoard-specific, hardcoded contract-file list):
- **`contract-edit-guard.sh`** (PostToolUse Edit|Write) — after editing a contract-paired file, demands running `source-of-truth-sync`.
- **`session-end-drift-check.sh`** (Stop) — at session end, flags changed contract-paired files and demands a `verify-alignment` / sync check. *(Edit-time vs Stop-time siblings, same file list.)*
- **`auto-lint.sh`** (PostToolUse Edit|Write) — run ESLint on edited `client/src/*.jsx|js` files.

**Plan-quality gating** (⚠️ **BROKEN** — both import a missing `_hooklib` module that exists nowhere in the repo):
- **`plan-delivery-gate.py`** (PreToolUse Write|Edit|submit_workspace_artifact) — would block delivering a plan that leaves implementer-discretion choices (Option A:, TBD, "decide at implementation time").
- **`pre-planning-advisory.py`** (PreToolUse Task) — would inject a no-implementer-choices directive before a planning subagent runs (fails open, so harmless when broken).

**Doc-sync at commit time** (a self-contained git-hook toolkit, generic/portable):
- **`precommit-doc-check/`** — a git `pre-commit` hook that detects docs made stale by staged code changes (grep-based identifier matching) and auto-rewrites them via one focused Claude session per doc (`detect-stale-docs.sh` + `sync-docs.sh` + `install.sh`). Needs the `claude` CLI or `ANTHROPIC_API_KEY`. **Byte-identical to the PM copy.**

> Also note `mcp-servers/codebase-rag/hooks/post-session.sh` (optional Stop reindex) and
> `skills/codebase-rag-enforcer/hooks/post-session.sh` (stale) — hooks bundled with those components.

---

## 8. Profiles, Roles & System Prompts

### Programmatic Claude Profiles — `programmatic-claude-profiles/` · PowerShell · **active**
A harness that spawns **isolated, role-scoped headless Claude Code instances** by setting
`CLAUDE_CONFIG_DIR` to a per-role config dir (walled off from your personal `~/.claude`).
A "role" bundles identity (`CLAUDE.md`), a permission profile (`settings.json`), a default
prompt, and optionally MCP servers (`.mcp.json`).
- **`New-ClaudeRole.ps1`** — interactive wizard to author a role (with Expert-Standard injection + MCP wiring).
- **`Setup-ClaudeRoles.ps1`** — installs each `roles/<name>/` to `~/claude-roles/<name>/`, injecting shared `roles/_shared/*.md` into `{{PLACEHOLDER}}` markers, and wires credentials.
- **`Invoke-ClaudeRole.ps1 -Role <name> -TargetDir <dir>`** — runs `claude -p … --dangerously-skip-permissions` against any project dir (permissions still enforced via `settings.json`; the flag only skips interactive prompts); supports `-Async`, `-AllowedTools`.

Design philosophy: **"skills say you should; roles say you can only"** — enforcement
through constraint (e.g. *deny* Bash so the agent can't grep instead of using codegraph).
Two shipped roles:
- **`code-reviewer`** — read-only standards-based review → `claude-review-report.md`; allows Read/Glob + read-only git + Write(report only); denies Edit/Bash/web/Agent. No MCP.
- **`codebase-auditor`** — forensic whole-codebase audit driven *only* by the **codegraph** + **codebase-rag** MCPs + Read (Bash denied so it **can't fall back to grep/find**); 4-phase workflow → `codebase-audit-report.md`. Wires both MCP servers via `.mcp.json` (hardcoded absolute Windows paths).

*(The top-level `programmatic-claude-profiles/{CLAUDE.md,default-prompt.txt,settings.json}` are an **orphaned older copy** of the code-reviewer role — scripts read only `roles/`.)*

### System Prompts — `system-prompts/` · **active**
**`ui-system-designer`** — one "AI Frontend Engineer & UX Designer" system prompt (React 19 +
TypeScript + `@google/genai`, strict a11y, single-XML-changeset output) ported to **three model
families**: `-claude` (verbose nested XML tags, loose output contract), `-codex` and `-gemini`
(terse plain-text, explicit priority ordering + anti-hallucination rule + a *hard* `<changes>`
output contract with full-file CDATA). All three keep `@google/genai` as the app's AI dependency
regardless of host model. Pick the file matching your target model.

### task-observer-setup — `task-observer-setup/` · **active (third-party, CC BY 4.0)**
A portable installer that wraps the upstream "task-observer" meta-skill (Eoghan Henn /
rebelytics) plus two custom Claude Code hooks so it **auto-activates every session**. The skill
(~1,525 lines) is a methodology for noticing skill-creation/improvement opportunities during real
work and logging them (it feeds, doesn't replace, skill-creator). `install.sh` copies the skill +
hooks user-wide and seeds `~/.claude/skill-observations/`. The **SessionStart** hook injects open-
observation counts + weekly-review-due status; the **Stop** hook gates on transcript-size delta and
only prompts an observation pass on substantive sessions. Deliberately avoids headless mode (no
extra metering).

---

## 9. Workflows — `workflows/`

Six standalone automation workflows (two are uninitialized submodules).

### code-review-swarm — `workflows/code-review-swarm/` · bash · **active**
A **multi-model, domain-routed parallel review swarm**. `review.sh` (~745 lines) detects which
agent CLIs are installed (`claude`/`gemini`/`codex`, or falls back to raw API curl), classifies the
codebase into domains (frontend/backend/iot/pi-hub/database/realtime), routes each domain to its
best+fallback model, runs one reviewer **per isolated git worktree** in parallel (throttled), then a
synthesis step (prefers Claude) dedups/resolves/prioritizes into `.code-review/REVIEW_REPORT.md`
with P0–P3 + an architecture health score. Nine domain prompt templates (`prompts/*.md`); config in
`.review-swarm.yaml`; strong IoT/embedded slant. Ships **`hooks/post-feature-review.sh`** (a PostTask
hook to auto-review a branch diff, Claude-only) and a bundled **`codegraph.py`** (see below) for
connectivity-based routing.
**When to use:** thorough multi-model review of a full codebase or feature diff, especially full-stack + IoT, when you have ≥1 CLI installed.

### codebase-documentation — `workflows/codebase-documentation/` · Claude skills + templates · **active**
A **source-of-truth contract-docs** workflow: **`init-contracts`** (skill) generates
`docs/contracts/{api-endpoints,database-schema,state-machine,websocket-events}.md` +
`docs/ARCHITECTURE.md` + `docs/patterns/` from real source (codegraph map → grep enumerate →
targeted reads → cross-check counts); **`source-of-truth-sync`** (skill, the maintenance
counterpart, byte-identical to the standalone one) keeps them aligned on every contract-affecting
edit. Ships rich Markdown templates for the five contract docs + two pattern docs.
**When to use:** once to bootstrap verifiable contract docs on an undocumented codebase, then wire the sync skill to keep them current.

### project-initializer — `workflows/project-initializer/` · Windows PowerShell · **active (template incomplete)**
A PowerShell system that **offers/copies project templates into new project dirs**, optionally
auto-prompted via rule2hook (a `PreToolUse(Task)` hook) or a PowerShell-profile snippet.
`Initialize-Project.ps1` is the core (smart detection of empty/non-project dirs); `setup.ps1`
installs + adds to PATH + guides rule2hook. The only bundled template is **`bmad-template/`** — a
**BMAD** Agile-AI framework bundle (v4.35.0) with 10 agents (analyst/architect/pm/po/qa/sm/dev/ux/
bmad-master/orchestrator), 4 agent-teams, and core config. ⚠️ **The on-disk BMAD template is
incomplete** (only ~20 `.bmad-core` files; the `workflows/tasks/templates/checklists/data` dirs its
own manifest promises are absent), and paths hardcode a OneDrive location, not agent-armory.
*(`setup.ps1.clean` is a cosmetic backup of `setup.ps1`; `setup-new.ps1` a simplified installer.)*

### scripts/codegraph — `workflows/scripts/codegraph/` · Python (stdlib) · **active**
**`codegraph.py`** (~1,333 lines, zero-deps) — a deterministic, cross-language dependency-graph +
**bridge** builder. Per-language regex parsers (JS/TS, Python, C++/Arduino, .env, package.json) and
**cross-language bridge detection**: matches MQTT topics (incl. `#`/`+` wildcards), HTTP endpoints,
WebSocket events, serial read/write pairs, and env define/use — flagging UNMATCHED HTTP calls and
UNDEFINED env vars. Exports markdown/json/mermaid/dot, `--trace`/`--depth` subgraphs, `--clusters`
(consumed by the review swarm). This is a **different implementation** from the `codegraph-mcp` TS
server (§1A) and the `codegraph-context-injection` proxy (§2) — three takes on "codegraph."
**Byte-identical** copy bundled inside `code-review-swarm/`.

### Uninitialized submodules (content not in this clone)
- **`workflows/agent-strategy`** → `github.com/Maxcogar/agent-strategy` (pinned `22f1abed`) — **uninitialized**.
- **`workflows/claude-systematic-debug`** → `github.com/Maxcogar/systematic-debug` (pinned `14f26019`; note path/repo-name mismatch) — **uninitialized**.
- Run `git submodule update --init` to fetch them; until then they contribute nothing locally.

---

## 10. Duplicate & Variant Analysis

Duplication here is **mostly intentional vendoring** with **real drift creeping in**. Two
mechanisms produce it: (1) the AgentBoard toolset is *ported* across Claude/Codex/Gemini hosts;
(2) the Project-Manager profile *mirrors* the top-level `skills/`, `commands/`, and `hooks/`.
Method: md5 of every text file → 84 exact groups; then `diff`/`cmp` on the instruction files to
quantify near-dup divergence.

### 10.1 Exact (byte-for-byte) duplicate groups — the families that matter

| Family | Identical copies | Notes |
|---|---|---|
| **middleware compiler ↔ sandbox** | **~100 source/test/doc files** identical | Only 20 shared files differ; main is ahead (has retrieval-eval/task-profiles/CLAUDE.md) |
| **codebase-rag `test-project/` fixture** | **~26 files** identical across `mcp-servers/codebase-rag` & `skills/codebase-rag-enforcer` | Sample app + generated docs |
| **audit-swarm full tree** | ~12 files (`SKILL.md`, `audit-swarm.md`, changelog, 7 auditors, synthesizer) identical: `skills/` ↔ `Project-Manager/skills/` | Plus a stray `skills/audit-swarm/TEST/SKILL.md` 3rd copy |
| **systematic-debugging tree** | ~10 files (SKILL + 3 techniques + example + bisect script + log + 4 fixtures) identical: `skills/` ↔ `Project-Manager/skills/` | superpowers lineage |
| **mcp-builder tree** | ~9 files (SKILL + 4 refs + 2 scripts + LICENSE + reqs) identical: `skills/` ↔ `Project-Manager/skills/` | Anthropic skill |
| **Expert pipeline commands** | `expert-spec`, `expert-plan`, `expert-review`, `code-review`, `team-review`, `session-start`, `session-end` identical: `commands/` ↔ `Project-Manager/commands/` | `expert-implement` identical `agents/Expert-Agents/…` ↔ `commands/Expert-Commands/` |
| **standalone hooks** | `auto-lint`, `block-first-search`, `contract-edit-guard`, `reset-search-blocks`, `session-end-drift-check` + all of `precommit-doc-check/` identical: `hooks/` ↔ `Project-Manager/hooks/` | |
| **`rag-context.py`** | 3 identical: `hooks/`, `middleware/RAG-injection/`, `Project-Manager/hooks/` | |
| **`source-of-truth-sync` SKILL** | 3 identical: `skills/`, `Project-Manager/skills/`, `workflows/codebase-documentation/` | |
| **AgentBoard `codebase-rag` SKILL** | 3 identical: claude/codex/gemini plugins | + `orchestration-integration.md` ×3 |
| **AgentBoard `codebase-sweep` SKILL** | 4 identical: claude/codex/gemini/gemini-gemini | + sweep-design doc ×4 |
| **`expert-standard(s)` SKILL — fork B** | 4 identical: codex, gemini, gemini-gemini, top-level `skills/expert-standards/` | see near-dup below |
| **`expert-standard` SKILL — fork A** | 2 identical: `Project-Manager/skills/expert-standard/`, `skills/Expert-Skills/expert-standard/` | |
| **`codegraph.py` + README** | 2 identical: `workflows/scripts/codegraph/` ↔ `workflows/code-review-swarm/` | |
| **`frontend-standards` (+2 refs)** | 3 identical: `skills/`, `skills/Expert-Skills/`, `Project-Manager/skills/` | |
| **`app-user-docs` (+3 refs)**, **`verify-alignment`**, **`verification-before-completion`** | 2 identical each: `skills/`/`Project-Manager/skills/` (or top-level/PM) | |
| **AgentBoard `.mcp.json`** | 2 identical: claude ↔ codex plugin | |
| **Context Compiler spec+arch docs** | 3 identical: compiler `docs/`, sandbox `docs/`, `Gemini-context-compiler/` | |

### 10.2 Near-duplicate families (same thing, NOT identical — how they differ)

- **agentboard core skill** — 5 versions, all distinct: claude (624 L, canonical) ≫ project-manager (509) ≈ gemini (500) ≈ gemini-gemini (474) ≫ **codex (234, heavily stripped)**. claude↔codex diff ≈ 863 lines (codex drops the mental-model table, actor separation, MCP pre-warm guidance).
- **orchestrate / workspace-orchestration** — same concept, renamed and rewritten per host (6 distinct md5s, 76–259 lines); claude calls it `orchestrate`, others `workspace-orchestration`; codex has both.
- **architecture skill** — claude (260 L, full) vs **codex (72 L, stub)**; both untracked.
- **sweep skill** — claude (136 L) vs **codex (26 L, stub)**. *(`codebase-sweep`, by contrast, is byte-identical across 4 trees.)*
- **expert-standard, two forks** — Fork A (59 L "singular") vs Fork B (47 L "plural") differ by ~76 lines; within Fork B the claude-plugin copy diverges ~9 lines from the other four.
- **codebase-rag SKILL, three tiers** — 127 L source doc (×2 identical) vs 161 L enforcer variant vs 45 L trimmed plugin doc (×3) vs 37 L gemini-gemini.
- **codebase-rag MCP server** — `mcp-servers/codebase-rag` (canonical, ahead) vs `skills/codebase-rag-enforcer/mcp-server-python` (older fork, stale `setup.py`, 6-tool era); 9 shared files differ.
- **codegraph** — 1 duplicated Python lib (2 identical copies) + 1 separate TS MCP server (`codegraph-mcp`, 18 tools) + 1 LiteLLM-proxy shim (`codegraph-context-injection`). Three independent implementations of the same idea.
- **planning-agent / audit-agent (gemini)** — the **gemini-gemini copies were upgraded** to full audit-grade rigor (planning 400 L, audit 163 L) while the **claude-plugin copies are the shorter pre-rigor templates** (89 L / 71 L). The claude `review-agent` is the more rigorous one there. "Best copy" varies per agent.
- **Context Compiler** — `codebase-context-compiler` (main, ahead) vs `-sandbox` (frozen fork: `node:sqlite` instead of `better-sqlite3`, adds bootstrap script, lacks retrieval-eval/task-profiles).

### 10.3 The AgentBoard ecosystem-port map

| What | claude-plugins | codex-plugins | gemini (genuine) | gemini (mislocated) | Project-Manager |
|---|---|---|---|---|---|
| Path | `claude-plugins/agentboard` | `codex-plugins/agentboard` | `gemini-extensions/agentboard-gemini` | `gemini-extensions/agentboard` | `Project-Claude-Configs/Project-Manager` |
| Version | **0.6.1 (truth)** | 0.1.0 | 0.1.0 | 0.1.0 | — |
| Sub-agents | `agents/*.md` (14) | reference worker prompts | `agents/*.md` + per-command agents | `agents/*.md` | mirrors + 3 unique |
| Hooks | `.sh` (3 events) | none (instructions) | Python (BeforeTool/AfterTool) | `.sh` | full stack |
| Commands | `.md` (via skills) | skills only | `.toml` dispatchers | `.md` | `.md` + legacy quartet |

---

## 11. Status Watchlist (things to know before relying on them)

**🔴 Broken / non-functional**
- `hooks/plan-delivery-gate.py` & `hooks/pre-planning-advisory.py` — import a missing `_hooklib` module (exists nowhere in the repo). The advisory one fails open; the gate one would error.
- `mcp-servers/PowerMill-MCP/` — the production server project (`PowerMillMcpServer/`) is **not committed**; only the test suites are present. Not buildable from this checkout.

**📦 Archived / not deployed**
- `mcp-servers/PowerInspect-MCP/files.zip` — a complete, finished v1.0.0 TS server shipped **zipped and unbuilt**, wired into no manifest.
- `skills/engineering-design-navigator` and `skills/codebase-recon` ship `files.zip` packaging copies.

**🟡 Stale / out-of-date (works or reads, but trust carefully)**
- `AGENTS.md` — a **corrupted** find-replace clone of `CLAUDE.md` (every "claude" → "Codex" broke identifiers). Ignore; use `CLAUDE.md`.
- `README.md` omits agentboard; `.claude-plugin/marketplace.json` & `PLUGIN-OVERVIEW.md` describe **v0.3.0** (current is 0.6.1).
- `orchestration-integration.md` (in `mcp-servers/codebase-rag/references/` and the enforcer) references a removed pre-MCP CLI layout.
- `skills/codebase-rag-enforcer/` — older forked RAG server + stale `hooks/post-session.sh`; per project `CLAUDE.md` it's **out-of-scope** vs the active `mcp-servers/codebase-rag` rebuild.
- `skills/genkit-architect` references the older split `@genkit-ai/*` package API.

**🗂️ Backups / superseded-in-place (don't run; know the canonical)**
- `middleware/codebase-context-compiler-sandbox/` (frozen fork of the main compiler).
- `workflows/project-initializer/setup.ps1.clean` (cosmetic backup of `setup.ps1`).
- `claude-plugins/agentboard/docs/specs/2026-05-16-correction-loop-option-a-design.BACKUP-…md` (a **rejected** design, kept as backup).
- `mcp-servers/mnt/user-data/outputs/subagent-mcp-server/` (stray partial copy of `mcp-servers/agents`).
- `claude-plugins/agentboard/reference/agent-profiles/{planning,audit}-agent.md` (pre-refactor single-phase agents, kept for porting).

**🧪 WIP / untracked (new, not yet committed)**
- Codex `architecture/` skill tree, `skills/Expert-Skills/{expert-implement,expert-plan}`, `skills/expert-standards`, `skills/ideation`, `skills/project-lifecycle`, `agents/Expert-Agents/…` pair, `PLUGIN-OVERVIEW.md`.
- `implementation-plan-agent/` — pins a speculative `gemini-3.1-pro-preview` model id; test harness signature mismatches the flow.
- `skills/api-endpoint-mapper` — SKILL.md names `scan_endpoints.py` but the file is `scan_endpoint.py`; script stored UTF-16 with corrupted emoji.

**⚠️ Known inconsistencies**
- `architecture-research-agent` frontmatter pins `claude-sonnet-4-6` but body/siblings call it the **haiku** research agent.
- AgentBoard hooks match `mcp__agentboard__*` but bundled tools are `mcp__plugin_agentboard_agentboard__*` (namespace gap, noted in `user-notes.txt`).
- `gemini-extensions/agentboard/skills/expert-standard.md/` — directory literally named with a `.md` suffix (fixed on the gemini side only).
- `skills/audit-swarm/SKILL.md` (and PM copy) — markdown stored with literal backslash escapes (garbled); two orchestrator files disagree on the auditor-prompt path.
- BMAD template under `project-initializer` is incomplete vs its own install manifest.

**🔌 Portability caveats** — many `.mcp.json` / role / config files hardcode absolute
`C:\Users\maxco\…` (or OneDrive) paths and project-specific tool prefixes
(`mcp__core-memory__`, `mcp__upstash_context7__`) that differ from this environment's
`mcp__claude_ai_*` servers; the CNC-fleet agents (`agents/`) target a *different* project
(CNC Syndicate Dashboard) than the AgentBoard work most of the repo centers on.

---

*Inventory compiled by a fan-out of reader sub-agents (one per subtree, reading instruction
files in full and code projects deeply) plus a deterministic md5 duplicate pass. Counts:
~1,093 tracked files across 9 MCP servers, 5 context-injection middleware components, 5
AgentBoard ports + 1 gcp-iot plugin, ~40 standalone skills, 14 standalone commands, 17
standalone agent files, ~12 standalone hooks, 1 PowerShell role harness, 3 system prompts,
and 6 workflows.*
