# Production-Grade RAG MCP Overhaul Spec (Choose-Your-Own-Adventure)

**Date:** 2026-02-25  
**Inputs used:** 2026-02-24 audit findings + production RAG/MCP reliability criteria  
**Target:** `codebase-rag` MCP server + `codebase-rag-enforcer` skill workflow

---

## 1) Decision Summary

Given the audit, this is **not a patch-level hardening job**. It is a **platform reliability correction** with architectural implications.  

**Recommendation:** execute a **full overhaul in phases** (not a rewrite-from-zero), with an explicit quality gate between each phase.

Why:
- Core trust blockers exist (broken E2E, stale docs/hooks, mismatch between claim and retrieval behavior).
- Operational model has structural risks (duplicate source trees, weak failure contracts, memory-only state).
- Security/governance and scalability controls are under-specified for production use.

---

## 2) Production Criteria Baseline (What “solid production-grade RAG MCP” should meet)

Use these as non-negotiable acceptance criteria:

1. **Reliability & Correctness**
   - Deterministic setup/index/query behavior.
   - Retrieval contract matches product claims (e.g., weighted constraints-first actually enforced in ranking).
   - Typed failure envelopes (no silent degradation for critical paths).

2. **Evaluation & Regression Safety**
   - CI quality gates: unit + integration + deterministic E2E.
   - Retrieval metrics tracked over fixture datasets (e.g., Recall@k, MRR, nDCG).

3. **Operability**
   - Scriptable CLI/admin surface (`setup`, `index`, `health`, `status`, `migrate`).
   - Structured logs + basic latency/error telemetry.
   - Health model distinguishes partial vs full outage.

4. **Security & Governance**
   - Secret-aware filtering/redaction before indexing.
   - File/token/byte budgets and denylist/allowlist controls.
   - Clear local data retention behavior and wipe semantics.

5. **Scalability & Lifecycle**
   - Incremental indexing with dirty-file detection.
   - Single-writer lock and resumable index jobs.
   - Versioned index schema + forward migration path.

6. **Maintainability**
   - Single source of truth for server implementation.
   - Documented architecture decisions (ADRs) and release process.

---

## 3) Gap-to-Criteria Mapping (from your audit)

- **Broken E2E path** → fails Reliability + Regression Safety.
- **Weighted retrieval claim not enforced** → fails Correctness.
- **Stale auto-index docs/hooks** → fails Operability.
- **Duplicate server trees** → fails Maintainability.
- **Broad exception suppression** → fails Reliability/Operability.
- **Memory-only session state** → fails Reliability UX.
- **No caps / no secret filtering / full rebuild only** → fails Security + Scalability.

Conclusion: **the gaps are cross-cutting, not isolated**.

---

## 4) Choose Your Own Adventure (Overhaul Paths)

## Path A — “Trust First in 2–3 Weeks” (Minimum viable production hardening)

**Best if:** you need near-term safe usage with bounded scope and can defer performance maturity.

### Scope
1. Fix E2E fixture and make it CI-blocking.
2. Align docs/scripts/hooks to actual commands (or remove unsupported flows).
3. Implement true weighted reranking at query time.
4. Replace broad `except Exception` with typed error outcomes.
5. Consolidate duplicate trees to one source + drift check in CI.

### Tradeoffs
- Faster delivery, lower risk.
- Still lacks full incremental indexing and advanced observability.

### Exit criteria
- Claims in docs match behavior.
- Green deterministic CI on clean clone.
- No silent critical failures.

---

## Path B — “Production Core in 4–6 Weeks” (Recommended)

**Best if:** this will be a shared dependency for multiple agents/teams.

### Includes Path A plus:
1. **Index lifecycle redesign**
   - Dirty-file incremental indexing.
   - Locking + resumable job metadata.
2. **State model upgrade**
   - Auto-discovery of `.rag/config.json` from cwd/project root.
   - Project context persistence across restarts.
3. **Security guardrails**
   - Secret/credential pattern filtering.
   - Configurable byte/file/token budgets.
4. **Observability baseline**
   - Structured logs + operation IDs.
   - Latency/error counters for tools.
5. **Migration mechanics**
   - Schema version in index metadata.
   - Upgrade path and compatibility checks.

### Tradeoffs
- More refactor complexity.
- Higher long-term confidence and lower support burden.

### Exit criteria
- Meets all baseline criteria except “advanced SLO dashboards” (can be Phase 3).

---

## Path C — “Platform Rebuild in 8+ Weeks” (If multi-tenant / high-scale is imminent)

**Best if:** you expect large monorepos, strict governance, or multi-tenant service hosting.

### Includes Path B plus:
1. Pluggable retrieval/reranker architecture.
2. Dedicated evaluation service + offline benchmark packs.
3. Multi-tenant data isolation policy model.
4. Stronger policy engine for indexing controls and audit trails.

### Tradeoffs
- Largest investment and migration risk.
- Highest upside for enterprise posture.

---

## 5) Architecture Decisions to Lock Early

1. **Single source of truth location**
   - Decision: keep runtime server under `mcp-servers/codebase-rag/mcp-server-python`, and consume from skill docs by reference (not copy).
   - Reasoning: duplicated logic is already causing drift risk.

2. **Retrieval contract**
   - Decision: enforce **single merged ranked result stream** with explicit score composition:
     - `final_score = semantic_score * semantic_weight + source_prior + recency_boost(optional)`.
   - Reasoning: avoids “separate arrays + implied priority” ambiguity.

3. **Failure contract**
   - Decision: every MCP tool returns `{status, data?, error_code?, error_message?, partial?}`.
   - Reasoning: orchestrators need machine-readable retry/fallback behavior.

4. **Indexing mode**
   - Decision: default incremental, explicit `--full-rebuild` flag.
   - Reasoning: full rebuild as default does not scale and harms developer loop.

---

## 6) Expected Runtime Functionality (How it should actually work)

This section is the target operating contract for the overhauled server.

**Decisions locked for this section (and why):**
- **Usage model decision:** default usage is **agent-first, pre-edit guardrail + post-query impact loop**.
  - **Reasoning:** this tool’s unique value is constraint enforcement before edits, then blast-radius validation before merge; generic “search-only” flows underuse it.
- **State decision:** tools must be **restart-tolerant via config auto-discovery**, not memory-bound session state.
  - **Reasoning:** MCP agents often run in ephemeral sessions; requiring manual setup each restart is a reliability anti-pattern.
- **Ranking decision:** constraints are **preferential, not absolute**, via explicit priors and deterministic merge ranking.
  - **Reasoning:** hard-forcing constraints above all else can hide the exact implementation details needed to execute a safe change.
- **Failure decision:** **typed partial-failure contracts** are required for every tool.
  - **Reasoning:** orchestration layers need deterministic retry/fallback behavior instead of log-scraping warnings.

### 6.1 Tool lifecycle (happy path)

1. **`rag_setup`**
   - Validates `project_root`.
   - Detects frontend/backend roots (unless explicitly provided).
   - Writes `.rag/config.json` with effective settings and schema version.
   - Generates/updates architecture artifacts (unless `--no-generate` chosen).

2. **`rag_index`**
   - Acquires single-writer lock.
   - Builds file manifest (path, size, hash, parser version, last indexed).
   - Applies secret and budget filters before chunking.
   - Incrementally updates `codebase`, `constraints`, and `patterns` collections.
   - Persists index summary and releases lock.

   **Design reasoning (why Step 2 exists in this exact position):**
   - **Primary objective:** guarantee query-time trustworthiness by ensuring retrieval never runs against unknown/stale index state.
   - **Invariant introduced:** after `setup`, no agent retrieval call should execute unless a known index generation exists and schema is compatible.
   - **Risk being controlled:** without immediate index materialization, agents operate on partial/noisy context and can produce confidently-wrong edits.
   - **Why immediately after setup (instead of lazy-on-first-query):**
     1. lazy indexing shifts latency into interactive flows and creates non-deterministic first-query behavior,
     2. it hides side effects in read-like operations,
     3. it makes failure attribution harder (query failure vs indexing failure get conflated).
   - **Why incremental-by-default:** production agent loops are frequent and small-diff; full rebuild per iteration amplifies cost and increases lock contention.
   - **Why full rebuild still exists:** parser/schema/version transitions can invalidate chunk identity; a controlled rebuild path is required for correctness.
   - **Operational consequence:** Step 2 becomes the enforceable handoff from "project discovered" to "retrieval contract valid".

3. **`rag_query` / `rag_check_constraints` / `rag_query_impact`**
   - Auto-loads project context from `.rag/config.json` if setup was not called in current process.
   - Retrieves candidate chunks across collections.
   - Produces one merged ranked stream using weighted scoring.
   - Returns typed response envelope with `partial` marker if any non-fatal subsystem degraded.

4. **`rag_health` / `rag_status`**
   - `health`: fast health (availability + collection presence + schema compatibility).
   - `status`: deeper diagnostics (index age, skipped files by reason, last failures, lock state).

### 6.1.1 Step-2 decision matrix (indexing strategy)

| Option | Why it was considered | Why it was not selected as default | Decision |
|---|---|---|---|
| Full rebuild every run | Simpler implementation and easy mental model | Too slow for iterative agent workflows; increases contention; unnecessary recomputation | Keep as explicit fallback only |
| Lazy build on first query | Lower upfront setup cost | Unpredictable interactive latency; hidden write side effects; confusing failure semantics | Rejected |
| Scheduled periodic indexing only | Works for batch pipelines | Staleness window too large for active coding sessions | Rejected |
| Incremental index right after setup, then incremental updates | Balances correctness, speed, and deterministic behavior | Requires manifest + lock complexity | **Selected default** |

**Acceptance conditions tied to Step 2:**
- Query tools must fail with typed error if index generation is missing or incompatible.
- Incremental run must report `files_scanned`, `files_indexed`, `files_skipped`, and skip reasons.
- Full rebuild must be explicit (`--full-rebuild`) or policy-triggered by schema/parser change.

### 6.2 Query/ranking behavior (enforced, not implied)

Target scoring contract per result:

```text
semantic_score = 1 - normalized_distance
source_prior = {constraints: +0.35, patterns: +0.20, codebase: +0.00}
recency_boost = optional small positive factor (default 0 unless enabled)

final_score = semantic_score * semantic_weight + source_prior + recency_boost
```

- Results are returned as **one ordered list** with explicit fields:
  - `rank`, `final_score`, `semantic_score`, `source_type`, `path`, `chunk_id`, `excerpt`, `metadata`.
- Collection-specific arrays may be included as optional debug payload, but ranking authority is the merged list.
- If two items tie, deterministic tiebreakers apply: source priority → shorter path depth → stable chunk id.

### 6.3 Failure behavior (machine-usable)

All tools should return this envelope:

```json
{
  "status": "success | error",
  "data": {},
  "error_code": "OPTIONAL_MACHINE_CODE",
  "error_message": "Human-readable explanation",
  "partial": false,
  "degraded_scopes": []
}
```

Error examples:
- `PROJECT_NOT_INITIALIZED`
- `INDEX_SCHEMA_MISMATCH`
- `COLLECTION_UNAVAILABLE`
- `INDEX_LOCK_ACTIVE`
- `BUDGET_LIMIT_EXCEEDED`

### 6.4 Operational CLI mode (non-interactive)

Add a supported CLI entrypoint for automation:

```bash
rag-server setup --project-root /repo
rag-server index --project-root /repo [--full-rebuild]
rag-server health --project-root /repo
rag-server status --project-root /repo
rag-server migrate --project-root /repo
```

This is required so hooks, CI, and user docs reference real behavior (not internal implementation assumptions).

### 6.5 Minimal end-to-end expected session

1. Run `setup` once on a repo.
2. Run `index` (incremental thereafter).
3. During agent tasks, call `rag_check_constraints` before code edits.
4. Call `rag_query_impact` to estimate blast radius.
5. If health degrades, caller sees `partial=true` + degraded scopes and can choose fallback.

### 6.6 Expected usage modes (choose by operating context)

1. **Mode A — Local dev assistant (single engineer, local repo)**
   - Run `setup` once per repo; `index` on demand or via local hook.
   - `rag_check_constraints` called before each substantial edit plan.
   - `rag_health` called only on error paths.
   - **Why this mode:** minimizes latency and ceremony for individual workflows.

2. **Mode B — Team CI gate (recommended baseline)**
   - CI runs `rag-server index --project-root ...` incrementally on changed files.
   - PR validation calls `rag_check_constraints` on diff-sensitive queries.
   - `rag_status` artifacts published for visibility (skipped files, degraded scopes).
   - **Why this mode:** creates repeatable quality gates and shared confidence.

3. **Mode C — Shared MCP service (multi-agent)**
   - Persistent server process with per-project lock + schema checks.
   - Mandatory typed error handling at orchestrator level.
   - Periodic `health` polling + alert on schema mismatch or collection unavailability.
   - **Why this mode:** prevents cross-session drift and improves operability for many concurrent users.

### 6.7 Default behavioral decisions for unresolved choices

Until you override via policy/config, these are the default decisions:
- Constraints-first is **soft-priority** (source prior boost), not hard exclusion.
- Query returns top `k=12` merged results (3 constraints-targeted, 3 patterns-targeted, 6 codebase-targeted as candidate pool before merge).
- Incremental index runs by default; full rebuild only on schema/parser version change or explicit flag.
- If `partial=true`, callers should block autonomous code edits and request human/operator intervention for critical files.

### 6.8 Exact usage runbook (copy/paste)

If you are asking “how do I actually use this,” use this sequence exactly.

#### Day-1 setup (single repo)

```bash
# 1) Initialize project config and generated artifacts
rag-server setup --project-root /path/to/repo

# 2) Build initial index
rag-server index --project-root /path/to/repo

# 3) Verify service/index health before agent use
rag-server health --project-root /path/to/repo
```

Expected outcome:
- `.rag/config.json` exists.
- `codebase`, `constraints`, `patterns` collections exist.
- `health.status=success` and `partial=false`.

#### Before writing code (agent preflight)

Call `rag_check_constraints` with the intended change intent:

```json
{
  "tool": "rag_check_constraints",
  "arguments": {
    "query": "Add caching layer to project listing endpoint",
    "project_root": "/path/to/repo",
    "max_results": 12
  }
}
```

Usage rule:
- If top results include constraint violations or required patterns, revise implementation plan **before editing files**.

#### After drafting a change (blast radius check)

```json
{
  "tool": "rag_query_impact",
  "arguments": {
    "query": "Refactor auth middleware token validation",
    "project_root": "/path/to/repo",
    "max_results": 12
  }
}
```

Usage rule:
- If `partial=true` or critical dependents are missing, do not auto-merge; require manual review.

#### Ongoing operations

```bash
# Fast health check (for hooks/CI)
rag-server health --project-root /path/to/repo

# Deep diagnostics (for triage)
rag-server status --project-root /path/to/repo

# Force rebuild only when required
rag-server index --project-root /path/to/repo --full-rebuild
```

### 6.9 CI usage pattern (recommended baseline)

Use this minimal CI sequence per PR:

1. `rag-server index --project-root "$REPO"` (incremental).
2. Run one or more policy queries via `rag_check_constraints` mapped to changed subsystems.
3. Fail CI if:
   - tool returns `status=error`, or
   - `partial=true` for protected paths, or
   - required constraint doc confidence/rank threshold is not met.
4. Publish `rag-server status` artifact for debugging.

Reference CI pseudo-logic:

```text
if status == error: fail
if partial == true and touches_protected_paths: fail
if top_constraint_rank > allowed_rank_threshold: fail
else: pass
```

### 6.10 Shared MCP service usage pattern

When deployed as shared infrastructure:
- Keep one logical project context per repo path.
- Enforce single-writer lock for indexing; queue concurrent reindex requests.
- Require clients to branch on `error_code` and `partial` instead of parsing text.
- Alert on repeated `INDEX_SCHEMA_MISMATCH` / `COLLECTION_UNAVAILABLE`.

---

## 7) Proposed Work Breakdown Structure (for Path B)

### Phase 0: Stabilize trust (Week 1)
- Fix fixture path and parameterize test project path.
- CI job: run E2E in clean environment.
- Remove or fix stale hook and stale CLI references.

### Phase 1: Contract correctness (Week 1–2)
- Implement merged weighted ranking.
- Add ranking unit tests (including tie/edge cases).
- Update docs to exact scoring formula.

### Phase 2: Structural hardening (Week 2–3)
- Remove duplicate implementation tree.
- Introduce typed errors and partial-failure semantics.
- Rename ambiguous `setup.py` logic module to `project_setup.py`.

### Phase 3: Index lifecycle & security (Week 3–5)
- Add incremental indexing manifest (content hash + mtime + parser version).
- Add lock file + stale lock recovery.
- Add secret-aware filters and indexing budgets.

### Phase 4: Operability & migration (Week 5–6)
- Add CLI admin commands: `setup/index/health/status/migrate`.
- Add schema version + migration guardrails.
- Add structured logs with operation IDs.

---

## 8) Acceptance Test Matrix (must-pass)

1. **Correctness**
   - Constraint docs outrank generic code when semantically similar.
   - Query behavior deterministic given fixed index + seed fixtures.

2. **Failure Handling**
   - Missing collection returns typed failure (not warning-only success).
   - Partial availability is marked `partial=true` with degraded scopes listed.

3. **State Resilience**
   - Restart server, query succeeds via config auto-restore without manual setup.

4. **Security Controls**
   - `.env` secrets are excluded/redacted by policy tests.
   - Oversized file budget triggers explicit skip reason.

5. **Migration**
   - Older index schema upgrades or fails with clear remediation text.

---

## 9) Unanswered Questions (for your decision weighting)

1. **Priority of time-to-value vs long-term cost:**
   - Is 2–3 week “safe enough” (Path A) acceptable, or do you want Path B baseline now?

2. **Strictness of constraints-first behavior:**
   - Should constraints always hard-rank above code, or only when semantic delta is within threshold?

3. **Security posture target:**
   - Is best-effort secret filtering enough, or do you need policy-grade controls + auditability?

4. **Runtime model:**
   - Local-only developer tooling, or shared MCP service used by many agents/users?

5. **Backward compatibility tolerance:**
   - Can we break response shape once (with migration notes), or must we preserve compatibility throughout?

6. **Performance envelope:**
   - Typical repo size now and 12-month target? (drives whether Path C foundations are needed early)

---

## 10) Suggested Immediate Decision

If undecided, choose **Path B** with a checkpoint after Phase 1.  
That gives you fast trust recovery while preserving a route to true production maturity.

---

## 11) Sources for Decision Rationale

- Lewis et al., *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks* (NeurIPS 2020). https://arxiv.org/abs/2005.11401
- Microsoft, *RAG at Scale: Building and Operating Production RAG Systems* (architecture and ops guidance). https://learn.microsoft.com/azure/architecture/ai-ml/guide/rag/rag-at-scale
- LangChain, *RAG Evaluation* (retrieval quality metrics and regression testing patterns). https://python.langchain.com/docs/concepts/evaluation/
- OWASP, *LLM Top 10* (prompt/data leakage and governance risks). https://owasp.org/www-project-top-10-for-large-language-model-applications/
- NIST AI Risk Management Framework 1.0 (governance/measurement/monitoring framing). https://www.nist.gov/itl/ai-risk-management-framework
