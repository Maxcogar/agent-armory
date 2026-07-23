# Plan — expert-dev-tools round-1 remediation

**Inputs:** `docs/review-round-1.md` (the finding set), `docs/specs/spec-expert-dev-tools.md`,
`docs/arch/architecture-expert-dev-tools.md`, `docs/plans/plan-expert-dev-tools.md` (all owner-approved).
**Produced under:** the expert-plan process; output-contract §16 sections; testing-standards.
**Date:** 2026-07-23.
**Reasoning traces this session:** two `sequentialthinking` chains (S-2 tool-scoping; the
command↔workflow ledger contract), Clear-Thought thoughtHistoryLength 12.

---

## 1. Goal

Remediate all ten round-1 independent-review findings in the `expert-dev-tools` plugin
(`claude-plugins/expert-dev-tools/`), plus one gap the owner surfaced during planning (review
results are recorded only as a count and are visible to no one — **RV**), so the implementation
matches its owner-approved spec and architecture and passes a re-run independent review at zero
findings. The fixes: the `.mcp.json` wrapper (S-1); per-agent least-privilege tool scoping without
degrading any agent (S-2); the dead feedback-escalation routing (S-3); ledger
`artifact_index`/escalation registration and D9 integrity (S-4); the lifecycle stall at the intent
gate (S-5); the structural test's real-linter substitution and its masking of S-1 (M-1); the invalid
ledger `phase` value on non-convergence (M-2); the missing A-4b/A-4c fixtures (M-3); the
under-specified feedback-sweep dispatch paths (Mn-1); the scalar `skills:` frontmatter (T-1); and
making every review's findings durable and visible in STATUS.md and to the owner (RV). Success:
`node tests/structural/check-structure.mjs` and `node tests/unit/run-unit-tests.mjs` pass with the
corrected assertions, and the changed behaviors are verifiable by re-review against current source.

## 2. Scope

**In scope:** the ten findings plus RV, and every artifact they touch — `.mcp.json`,
`workflows/expert-lifecycle.js`, `commands/expert.md`, the nine `agents/*.md`,
`scripts/ledger.schema.json` (one additive `role` enum value for review records — RV),
`scripts/validate-ledger.mjs` + `tests/unit/run-unit-tests.mjs` (one added case for that value),
`tests/structural/check-structure.mjs`, two new fixtures under `tests/fixture/`,
`tests/ACCEPTANCE.md`, and an amendment in `docs/arch/architecture-expert-dev-tools.md`.

**Out of scope, with authority:**
- **The behavioral acceptance tier (A-3, A-4, A-5, A-8, A-9 live runs).** Owner-established deferral:
  it dispatches real agents through the installed plugin and needs install + token authorization
  (register Q-1; `tests/ACCEPTANCE.md` §"Behavioral tier"; the round-1 handoff). This plan creates the
  A-4b/A-4c fixtures and verifies they parse/exist; running the behavioral criteria is the owner-gated
  step after review PASS.
- **The review-confirmed-correct components, except the minimal additive touches RV requires**
  (register Q-2): the R-1 skill repairs and `scripts/extract-owner-turns.mjs` (T-U2 6/6) are **not**
  touched at all. `scripts/ledger.schema.json` and `scripts/validate-ledger.mjs` + its unit suite are
  touched **only additively** for RV (a new `review` role value and one test case); the existing
  fields and the 16 passing cases are unchanged. M-2 and S-4 are fixed in the workflow/command that
  *write* the ledger, never in the schema that *defines* it.
- **Everything outside `claude-plugins/expert-dev-tools/`** (repo standing rule).

**Coverage reconciliation** — every finding → its remediation step(s):

| Finding | Step(s) |
|---|---|
| S-1 `.mcp.json` bare map | R1 |
| S-2 nine agents not least-privilege / degrade risk | R2 |
| S-3 dead `feedbackEscalation`; F-14 routing | R4 (workflow), R5 (command surfaces) |
| S-4 delta omits artifacts; `artifact_index` never populated; D9 inert | R4 (delta.artifacts), R5 (hash+upsert, record escalation) |
| S-5 lifecycle stalls at intent gate | R4 (return intent w/o phase claim), R5 (advance on approval) |
| M-1 structural test weaker oracle; masks S-1 | R6 |
| M-2 `phase='implementation'` not in enum | R4 |
| M-3 A-4b/A-4c fixtures missing | R7 |
| Mn-1 feedback-sweep dispatch under-specifies paths | R4 (forward), R5 (resolve+inject) |
| T-1 scalar `skills:` frontmatter | R2 |
| RV review findings recorded only as a count; visible to no one | R3 (schema role), R4 (workflow carries findings), R5 (command persists+surfaces) |
| (divergence record for S-2 + RV note) | R8 |

## 3. Standards that govern this plan

Inherited from the spec/architecture standards tables plus the platform facts verified this session (§11):

- **OWASP ASVS V1 (trust boundaries, least privilege, deny-by-default)** — governs R2 (per-agent
  scoping) and the single-writer discipline preserved in R4/R5.
- **Claude Code plugin / sub-agents / permissions reference** (Context7 `/websites/code_claude`,
  https://code.claude.com/docs/en/{mcp,sub-agents,permissions}, 2026-07-23) — governs R1 (`mcpServers`
  wrapper), R2 (agent `tools`/`disallowedTools` semantics, MCP tool naming, `skills:` sequence), R6
  (strict `.mcp.json` read).
- **Workflow tool determinism contract** (in-session + vetted `skills/workflow-creator/`) — governs
  R4: no `require`/`fs`/`crypto`/`Date`/`Math.random` in the orchestrator; this is *why* hashing and
  file writes (R5) are command-side.
- **IEEE 1028 review independence** — governs R2's reviewer scoping (it must not edit what it judges)
  and RV (review results are a first-class record).
- **ISO/IEC/IEEE 29119 + SWE-at-Google + Meszaros** (testing-standards, read this session) — governs
  R6/R7 test specifications.
- **JSON Schema draft 2020-12** — governs the M-2/S-4 conformance to the ledger schema and the single
  additive `role` value (RV).
- **Root-cause-before-correction (systematic debugging; ISO 9001 §10.2)** — governs R4's S-3 routing.
- **Single source of truth (no duplicate system of record)** — governs Mn-1 (command resolves host
  paths the workflow cannot see) and RV (review records are artifacts indexed in the ledger, not a
  second store).
- **Transparency / honesty of state (spec §8 NFR)** — governs RV: the record must show what reviews
  found, not merely that they found N things.

## 4. Spec issues

None open. One design-vs-reality tension, **closed** (not deferred):

- **S-2 vs architecture D11.** D11 (owner-approved) specifies "tool allowlists scoped to its phase"
  for every agent. A verified platform constraint (§11 V3/V4) makes a pure allowlist impossible for
  the three agents whose skills use the host-provided CodeGraph/codebase-RAG servers (§11 V22),
  because those servers' tool names are unknowable at plugin-authoring time and the `tools` allow side
  has no all-MCP wildcard. **Resolution (owner directive, this session):** the owner directed this is
  an engineering call — *"the tools are required, so that's your only option"* — and, specifically,
  that the reviewer must **not** be degraded ("i want it to do its job"). Recorded as Decision D-R2
  and amendment R8. Not an open bin-2 item; a resolved divergence with its authority named.

(RV is a gap the owner surfaced, not a spec conflict — it is grounded in spec F-6/F-7/§8 and handled
as a plan step, not here.)

## 5. Files affected

All **modified** (no new code files; two new fixture files; no deletions). Blast radius of the
graph-tracked code files (`workflows/expert-lifecycle.js`, `tests/structural/check-structure.mjs`,
`scripts/validate-ledger.mjs`, `scripts/extract-owner-turns.mjs`) is **0 dependents** (§11 V26).

- `.mcp.json` (R1)
- `agents/*.md` × 9 (R2)
- `scripts/ledger.schema.json` (R3 — additive `review` role value)
- `scripts/validate-ledger.mjs`, `tests/unit/run-unit-tests.mjs` (R3 — one added case; no logic change)
- `workflows/expert-lifecycle.js` (R4)
- `commands/expert.md` (R5)
- `tests/structural/check-structure.mjs` (R6)
- `tests/fixture/agents/forced-fabricating-implementer.md` **(new)**,
  `tests/fixture/spec/spec-contradictory.md` **(new)** (R7)
- `tests/ACCEPTANCE.md` (R7 — doc-sync)
- `docs/arch/architecture-expert-dev-tools.md` (R8 — amendment)

**Documentation sync** (`codegraph_find_related_docs`, §11 V27): the 15 docs referencing the changed
files are the nine agents, the command, ACCEPTANCE.md, and the spec/arch/plan/review-round-1 records.
Agents/command/ACCEPTANCE are edited by R2/R5/R7; the architecture gets the R8 amendment; the spec,
original plan, and review-round-1 need no edit (the code is being brought into conformance with them).

**Not modified:** the R-1 packaged `skills/`, `scripts/extract-owner-turns.mjs`,
`.claude-plugin/plugin.json`.

## 6. Foundation corrections

None separate from the findings. Every problem this plan touches is inside the plugin's own
deliverable; there is no upstream dependency to correct first.

## 7. Plan

Ordered so independent leaves precede the structural test that asserts the corrected shapes. R1, R2,
R3 are mutually independent; R4 depends on R3 (the `review` role it registers); R5 depends on R4
(shared delta/report contract); R6 depends on R1+R2+R4; R7 depends on R4 (sampler); R8 depends on R2.

---

### R1 — `.mcp.json`: wrap the server map in `mcpServers` (S-1, and unmask M-1)

**What changes:** replace the bare top-level server map with the documented wrapper —
`{ "mcpServers": { "context7": {…}, "clear-thought": {…} } }`. The two server definitions are
unchanged; only the wrapping object is added.
**Source:** spec F-2/D-8; architecture C6/D8; Claude Code plugin MCP reference (§11 V2).
**Why this approach — Gate 3:**
1. *Decision:* nest both servers under a top-level `"mcpServers"` key.
2. *Standard:* Claude Code plugin `.mcp.json` reference — every documented example, including the
   plugin-specific one, uses the `mcpServers` wrapper (§11 V2).
3. *Why here:* the plugin's MCP servers must load for the architect/planner phases (spec §7); the
   wrapper is the documented form, and building to an undocumented bare-map that "may happen to load"
   is the unverified premise the Expert Standard forbids.
4. *NOT — and why:* NOT keeping the bare map because some official plugins ship it (pattern-matching
   to an unverified precedent — S-1 left "does the bare form load" unverified); NOT a redundant
   `plugin.json`-inline MCP block (two sources of truth).
**Dependencies:** none. Unblocks R6.
**Verification:** T-M1 reads `mcp.mcpServers` strictly and asserts both servers present.
**Impact if wrong:** if servers still fail to load, architect/planner halt at preflight (F-2) rather
than silently. Contained; caught by R6's strict read and by preflight.

---

### R2 — Per-agent tool scoping and `skills:` sequence (S-2 + T-1) — no agent degraded

**What changes:** in every `agents/*.md`, (a) convert `skills:` from scalar to a YAML sequence, and
(b) scope tools by the partition below. The partition is decided by one verified fact (§11 V22): the
agents whose skills use the host-provided CodeGraph/codebase-RAG servers are `expert-reviewer`
(expert-review, 5 refs), `expert-architect` (expert-architecture, 20), and `expert-planner`
(expert-plan, 19). Those three must retain full host MCP — which a `tools` allowlist cannot name
(§11 V3/V4) — so they use denylists; the other six need no host MCP and are cleanly allowlisted with
no loss of capability.

**Allowlist agents (6)** — complete required toolset is nameable, so `tools:` (deny-by-default) with
`disallowedTools: mcp__claude_ai_CORE_Memory__memory_ingest` (belt-and-suspenders):

| Agent | `tools:` allowlist |
|---|---|
| `expert-spec-writer` | `Read, Grep, Glob, Write, Skill, mcp__plugin_expert-dev-tools_context7` |
| `expert-implementer` | `Read, Grep, Glob, Write, Edit, NotebookEdit, Bash, Skill, mcp__plugin_expert-dev-tools_context7` |
| `expert-verifier` | `Read, Grep, Glob, Bash, Skill, mcp__plugin_expert-dev-tools_context7` |
| `expert-acceptance` | `Read, Grep, Glob, Bash, Skill` |
| `expert-diagnostician` | `Read, Grep, Glob, Bash, Skill, mcp__plugin_expert-dev-tools_context7` |
| `expert-closeout` | `Read, Grep, Glob, Write, Bash, Skill` |

(verifier/acceptance/diagnostician run `expert-standard`, which does **not** reference host
CodeGraph/RAG (§11 V22), so their allowlist is their *full* toolset — not a reduced one.)

**Independence-locked denylist agent (1)** — `expert-reviewer`: no `tools:` field;
`disallowedTools: Write, Edit, NotebookEdit, Agent, Task, mcp__claude_ai_CORE_Memory__memory_ingest`.
Retains the **full** expert-review instrument roster — Read, Grep, Glob, **Bash** (the test runner),
CodeGraph, codebase-RAG, Context7, Clear-Thought (host servers it cannot get any other way,
§11 V3/V4/V23). Denied only what independence forbids: Write/Edit/NotebookEdit, so it **cannot edit
the artifact it judges** (the review's own cited failure), plus Agent/Task/CORE-ingest. Bash is
**retained** — it is an expert-review instrument (§11 V23); denying it strips a core capability. The
reviewer is **not** degraded. (Retaining Bash diverges from architecture D5/D11's "reviewer pure
read-only, no Bash"; recorded at R8, on the owner's directive that the reviewer do its full job.)

**Write hardened-denylist agents (2)** — `expert-architect`, `expert-planner`: no `tools:` field;
`disallowedTools: Agent, Task, mcp__claude_ai_CORE_Memory__memory_ingest` (retain Write/Edit/Bash +
full host MCP their skills hard-require).

`skills:` becomes a sequence in every file, e.g.:
```yaml
skills:
  - expert-dev-tools:expert-review
```
**Source:** spec F-4/§3.4; architecture D5/D11 + amendment R8; OWASP ASVS V1; IEEE 1028; Claude Code
sub-agents reference (§11 V3/V4/V5/V8/V22/V23).
**Why this approach — Gate 3:**
1. *Decision:* partition by verified host-MCP need (§11 V22); allowlist the six nameable agents;
   denylist the three host-MCP agents, stripping only role-inappropriate nameable capabilities.
2. *Standard:* OWASP ASVS V1 least privilege / deny-by-default; IEEE 1028 independence; sub-agents
   `tools` semantics — allow side names a specific glob-free MCP server segment; no all-MCP allow
   wildcard (§11 V3/V4).
3. *Why here:* S-2's risk is an agent holding capabilities its role forbids by inheritance. For the
   six nameable agents an allowlist makes their role a capability boundary directly. The three
   host-MCP agents cannot be allowlisted (their servers are unnameable, §11 V3/V4; and unbundleable —
   codebase-RAG is not npm-launchable), and stripping those servers to fit an allowlist degrades them
   — the owner's explicit red line for the reviewer. So a denylist retains full MCP and removes only
   nameable role-inappropriate capabilities: reviewer loses edit power (independence) + Agent/Task/
   CORE-ingest but keeps every verification instrument incl. Bash; architect/planner lose Agent/Task/
   CORE-ingest. (Decision D-R2.)
4. *NOT — and why:* NOT `tools: mcp__*` (allow side rejects the all-MCP wildcard, §11 V4 — grants
   nothing); NOT bundling CodeGraph/RAG (codebase-RAG not npm-launchable — ships a required server
   that fails to start); NOT allowlisting the reviewer to Read/Grep/Context7 (strips CodeGraph/RAG
   and the Bash test runner — degrades the very agent whose job is rigorous verification); NOT denying
   the reviewer Bash "to keep it read-only" (Bash is an instrument, §11 V23; the independence that
   matters — cannot edit the artifact under review — comes from denying Write/Edit/NotebookEdit);
   NOT plain `disallowedTools: <CORE-ingest>` on any agent (leaves Agent/Task inherited — the S-2 defect).
**Dependencies:** none. Unblocks R6, R8.
**Verification:** T-M1 — every `skills:` sequence resolves to a packaged skill; the six allowlist
agents have a `tools` field with the expected tools and (read-only ones) no Write/Edit/NotebookEdit;
the reviewer's `disallowedTools` contains Write/Edit/NotebookEdit/Agent/Task/CORE-ingest and **not**
Bash; architect/planner `disallowedTools` contains Agent/Task/CORE-ingest; no agent can CORE-ingest.
**Impact if wrong:** an over-broad grant re-opens an isolation guarantee (a reviewer that can edit);
an over-narrow one degrades a phase. Both caught by T-M1; functional gaps by preflight/behavioral runs.

---

### R3 — Ledger schema: add the `review` artifact role (RV support)

**What changes:** in `scripts/ledger.schema.json`, add `"review"` to the `artifact_index[].role`
enum (currently `[spec, architecture, plan, implementation, report, status]`). Add one case to
`tests/unit/run-unit-tests.mjs` accepting an `artifact_index` entry with `role:"review"`. No other
schema or validator logic changes — the validator reads the schema, so the new value flows through.
**Source:** RV; spec F-6/F-7; architecture D9 (artifacts are hash-anchored, path-indexed); JSON Schema.
**Why this approach — Gate 3:**
1. *Decision:* model each persisted review record as an artifact (`role:"review"`) in the existing
   `artifact_index`, rather than inventing a new store or bloating `gate_history` with prose.
2. *Standard:* single source of truth + the architecture's own artifact model (artifacts live in
   files; the ledger indexes them by path + hash); minimal-diff schema evolution.
3. *Why here:* review records are exactly artifacts — durable files the owner reads — so the D9
   machinery S-4 is already fixing (hash + index) carries them for free; STATUS.md, generated from
   the ledger, can list them like any artifact.
4. *NOT — and why:* NOT a new top-level ledger store for findings (a second system of record — the
   D14 mistake); NOT putting finding prose inside `gate_history` items (bloats the state JSON and
   duplicates the record); NOT leaving findings unpersisted (the RV defect).
**Dependencies:** none. Unblocks R4/R5 (which register review records under this role).
**Verification:** T-U1' (the added unit case — a ledger with a `role:"review"` artifact validates;
the pre-existing 16 cases still pass).
**Impact if wrong:** a too-narrow enum would reject a valid ledger at preflight. Caught by T-U1'.

---

### R4 — Orchestrator: intent advance, delta artifacts, review findings, enum-valid resume, feedback routing, sweep paths (S-5, S-4, RV, M-2, S-3, Mn-1)

**What changes** in `workflows/expert-lifecycle.js` (one coherent SEGMENT_REPORT-contract change,
reasoned in §10 D-R1):

- **S-5:** on spec PASS, return the intent gate **without** claiming a phase move and **delete**
  `delta.spec_ready` (the schema is `additionalProperties:false`, §11 V15). The intent→architecture
  transition is the command's (R5), driven by the owner's answer.
- **S-4:** extend the delta to `{ phase, artifacts:[{role,path}], gate_history, amendments, budget }`;
  after each phase agent returns, push `{role,path}` for its artifact. No hashing in the workflow (no
  `crypto`/`fs`, §11 V25). Escalations are command-derived from `report.gate` (D-R3), not carried in
  the delta.
- **RV:** stop discarding review findings. In `runGate`, retain each round's full `findings[]` (from
  `VERDICT_SCHEMA`), and carry them — per gate, per round — in the SEGMENT_REPORT (a
  `review_records:[{phase, round, verdict, findings[]}]` field) so the command can persist them. Also
  attach the findings to any review-derived owner gate (non-convergence) so the owner sees what did
  not converge.
- **M-2:** replace `delta.phase = phaseName.toLowerCase()` (workflow:464) with an explicit
  enum-valid resume phase passed by the caller: architecture→`'architecture'`, plan→`'plan'`,
  implementation→`'implement'` (each a routed enum member; `'implementation'` is neither, §11 V14).
- **S-3:** replace the dead `feedbackEscalation` (workflow:291) with real, boundary-only routing
  (F-14 corrections are owner_owned, never mid-phase): after the sweep, if a `systemic_defect` exists,
  dispatch the diagnostician (failure mode, `responsible_component` target) and attach the diagnosis;
  if a `failed_correction` exists, build an owner escalation carrying the original diagnosis + the
  applied correction + the new evidence and dispatch **no** remediation (spec F-14; A-9(b)). Thread
  `feedback` and, when present, `feedback_escalation` onto every terminal report.
- **Mn-1:** read `reader_script` (absolute `${CLAUDE_PLUGIN_ROOT}/scripts/extract-owner-turns.mjs`)
  and `transcript_dir` from `args` (the command injects them, R5) and pass both into the sweep
  dispatch in place of the bare relative path (workflow:258).

**Source:** architecture C3/D6/D9/D13/D14; spec §3.2, F-6/F-8/F-13/F-14; ledger schema `phase` enum.
**Why this approach — Gate 3:**
1. *Decision:* fix S-3/S-4/S-5/M-2/Mn-1/RV as one SEGMENT_REPORT-contract change split along the
   capability boundary: the workflow names data and declares transitions; the command persists.
2. *Standard:* Workflow determinism contract (no fs/crypto in the orchestrator) + single-writer (D3)
   + JSON Schema conformance (enum-valid `phase`) + transparency (RV carries findings, not counts).
3. *Why here:* these are facets of the same broken command↔workflow contract (review named S-4+S-5 as
   jointly blocking the loop), and RV is the same envelope (the report already flows to the command,
   which is the only tier that can write files). Designing them together makes the command's write
   total, advances the happy path, and makes review results durable.
4. *NOT — and why:* NOT hashing in the workflow (no crypto/fs, §11 V25); NOT advancing phase inside
   the workflow on spec PASS (mishandles "request changes" — the transition depends on an owner
   answer); NOT emitting `'implementation'`/`'implementation_review'` (not-in-enum / not-routed —
   strands a resumed segment); NOT interrupting a phase for a systemic_defect (F-14 boundary-only);
   NOT keeping only `findings_count` (the RV defect — the count is not the result).
**Dependencies:** R3 (the `review` role). Unblocks R5, R6, R7.
**Verification:** T-M1 — passes the real `validate-workflow.mjs` and `node --check`; grep-level
assertions that `feedbackEscalation` is no longer dead, no `phase*.toLowerCase()` assignment remains,
and the report carries `review_records`. Behavioral confirmation (A-3 advances; A-9(b) no remediation;
findings visible) is the deferred tier.
**Impact if wrong:** the orchestration core; a routing/contract defect mis-gates every task. Contained
by CP1 and the behavioral tier. Blast radius 0 (§11 V26).

---

### R5 — Command: advance on approval, hash+register artifacts, persist+surface review records, record escalations, inject sweep paths (S-5, S-4, RV, Mn-1)

**What changes** in `commands/expert.md`:

- **S-5:** in step 5, on owner **approval** of an `intent` gate, set `phase='architecture'` and mark
  the spec `artifact_index` entry `approved_by_owner=true` (`approval_segment`=revision); on request
  changes, keep `phase='spec'`.
- **S-4:** in step 4, for each `ledger_delta.artifacts` entry compute SHA-256 (Bash) and **upsert**
  `artifact_index` with `{role,path,sha256,approved_by_owner,approval_segment}`; record an
  `escalations` entry `{gate_type:report.gate.type, segment:revision, resolved:false}` when
  `outcome==='owner_gate'`; keep the step-2 re-hash-before-invoke ordering so D9 drift detection is live.
- **RV:** in step 4, for each `report.review_records` entry, write a human-readable review record file
  (e.g. `.claude/expert/reviews/<phase>.md`, appending each round: verdict + every finding's
  classification, standard, location, premise-evidence), register it in `artifact_index` with
  `role:"review"` (hashed like any artifact), and in step 4's STATUS.md regeneration render each
  gate's rounds **with a link/summary of its review record** (not just verdict + count). In step 5,
  when a review-derived gate reaches the owner, present the findings themselves.
- **Mn-1:** in step 3, resolve `reader_script=${CLAUDE_PLUGIN_ROOT}/scripts/extract-owner-turns.mjs`
  and `transcript_dir=~/.claude/projects/<sanitized-project-dir>/` (the project's absolute path with
  drive-colon and separators replaced by `-`, e.g. `C--Users-maxco-Documents-agent-armory`; resolve by
  that transform or by matching the single entry under `~/.claude/projects/`) and include both in the
  `args` snapshot.

**Source:** architecture C2/D3/D9/D12; spec F-2/F-6/F-7/F-9/F-14/§8.
**Why this approach — Gate 3:**
1. *Decision:* the command owns every fs/hash/file-write and every owner-answer-driven transition;
   the workflow supplies the data.
2. *Standard:* single-writer ledger (D3, ASVS V1) + content-addressed integrity (D9) + STATUS.md
   generated from the ledger (D12) + transparency of state (§8).
3. *Why here:* only the command has Bash/fs (§11 V24); D9 hashing, the intent advance, and writing
   the review records all require it, and populating `artifact_index` here is what makes the D9
   re-hash loop operate on real entries. Review records as artifacts make the results durable and
   surfaceable in STATUS.md via the same machinery.
4. *NOT — and why:* NOT letting the workflow or a phase agent write the ledger/records (self-grading;
   breaks D3); NOT deriving the transcript dir in the workflow (no env access); NOT summarizing review
   findings to a bare count in STATUS.md (the RV defect); NOT having the read-only reviewer write its
   own record (breaks independence — the command persists what the reviewer returns).
**Dependencies:** R4 (consumes `ledger_delta.artifacts`, `report.review_records`, `report.gate`).
Unblocks nothing downstream in code; feeds the behavioral tier.
**Verification:** command-content review that step 4 upserts `artifact_index`, records `escalations`,
writes+links review records, and renders findings in STATUS.md; step 5 advances phase on approval and
presents findings at review gates; step 3 injects the two resolved paths. Runtime confirmation
(single write per segment; findings visible; resume advances) is the deferred behavioral tier.
**Impact if wrong:** a mis-written ledger/record is the one non-deterministic tier; bounded by
`validate-ledger.mjs` and D9 re-hashing; recoverable via resume.

---

### R6 — Structural test: real linter, strict `.mcp.json` read, new scoping and sequence assertions (M-1 + S-2/T-1 coupling)

**What changes** in `tests/structural/check-structure.mjs`:
- **M-1a:** replace `node --check` + hand-rolled regex (check-structure.mjs:57–63) with an invocation
  of the real `validate-workflow.mjs`, resolved at
  `<repo-root>/skills/workflow-creator/scripts/validate-workflow.mjs` (three levels up, then
  `skills/workflow-creator/scripts/`); assert exit 0; **hard-fail** with a clear message if the linter
  is absent (a dev/CI test cannot silently substitute its specified oracle). `node --check` may remain
  as an extra syntax gate.
- **M-1b:** read `.mcp.json` strictly as `mcp.mcpServers` (drop `|| mcp`, check-structure.mjs:72).
- **S-2/T-1 coupling:** update the frontmatter parser to read a YAML **sequence** `skills:`
  (check-structure.mjs:14–24 cannot); replace the `disallowedTools`-shape assertions
  (check-structure.mjs:42–52) with: the six allowlist agents each have a `tools` field with expected
  tools and (read-only ones) no Write/Edit/NotebookEdit; the reviewer's `disallowedTools` includes
  Write, Edit, NotebookEdit, Agent, Task, CORE-ingest and **not** Bash; architect/planner
  `disallowedTools` includes Agent, Task, CORE-ingest; no agent can CORE-ingest.
**Source:** spec A-2; testing-standards (use the specified oracle); the R1/R2/R4 shapes it asserts.
**Why this approach — Gate 3:**
1. *Decision:* invoke the canonical linter, read config strictly, track the new hybrid scoping.
2. *Standard:* ISO/IEC/IEEE 29119 — a weaker oracle gives false assurance (the M-1 defect); an
   assertion must be falsifiable by the defect it targets.
3. *Why here:* A-2 names "the workflow-creator linter"; the hand-rolled regex passed the malformed
   `.mcp.json` (M-1); the strict read makes S-1 fail the test as it should.
4. *NOT — and why:* NOT vendoring a linter copy (a second source of truth that drifts); NOT keeping
   `mcp.mcpServers || mcp` (the fallback that masks S-1).
**Dependencies:** R1, R2, R4. Unblocks CP1.
**Verification:** `node tests/structural/check-structure.mjs` passes on the fixed artifacts and (by
construction) the pre-fix artifacts would fail. Test spec T-M1.
**Impact if wrong:** a still-masking test reports false green. Guarded by writing each assertion's
failure condition first (§12) and by the linter being authoritative.
**Assumption (documented):** the structural test runs inside the `agent-armory` repo checkout, where
`skills/workflow-creator/scripts/validate-workflow.mjs` exists (§11 V18) — the dev/CI context the
automated tier already assumes.

---

### R7 — Materialize the A-4b and A-4c fixtures (M-3) + ACCEPTANCE.md sync

**What changes:**
- **A-4b** — `tests/fixture/agents/forced-fabricating-implementer.md`: an implementer variant whose
  `evidence[]` contains one citation that will not reproduce, at an index the sampler selects
  (`sampleIndices(n, seed)`, `seed=ledger.revision+1`, §11 V20). The fixture fixes `n` and places the
  plant at `sampleIndices(n, revision+1)[0]`; worked example `n=5, revision=0` → `sampleIndices(5,1)=
  [1,3]` → plant at index 1; the derivation is documented inline (the M-3 gap).
- **A-4c** — `tests/fixture/spec/spec-contradictory.md`: a fixture spec with two requirements that
  cannot both hold, so the plan/spec phase surfaces the contradiction and escalates a `spec_traceable`
  gate.
- **ACCEPTANCE.md** — reference the committed fixtures; note A-3 advances past intent (S-5), A-9(b)
  asserts no remediation dispatch (S-3), and that review results are now visible in STATUS.md (RV).
**Source:** original plan §5/S11; spec A-4(b)(c); architecture Testing.
**Why this approach — Gate 3:**
1. *Decision:* commit both fixtures with the A-4b plant index **derived** from the sampler.
2. *Standard:* plan §5/S11 completeness; testing-standards — a forced-failure test must fire *because
   of* the plant (remove it → control does not fire), which requires the plant where the control looks.
3. *Why here:* the spot-re-run samples deterministically; a plant off the sampled set passes vacuously.
4. *NOT — and why:* NOT leaving A-4b/A-4c as prose (the M-3 defect); NOT a fixed index not derived
   from the sampler (may fall outside the sample).
**Dependencies:** R4 (the sampler contract). Unblocks CP2.
**Verification:** T-M1 asserts both fixtures exist and parse; the behavioral A-4b/A-4c runs are the
deferred tier. Test spec T-M3.
**Impact if wrong:** a mis-placed plant passes vacuously at the behavioral tier. Guarded by deriving
the index and by the behavioral test asserting "remove plant → no fire."

---

### R8 — Architecture amendment: the S-2 hybrid + reviewer-Bash + RV (divergences from D11/D5)

**What changes:** add a dated amendment to `docs/arch/architecture-expert-dev-tools.md` recording:
(1) agent tool scoping is a hybrid — `tools` allowlists for the six nameable agents; denylists for
`expert-reviewer`/`expert-architect`/`expert-planner` — because host-provided CodeGraph/codebase-RAG
are not nameable in a `tools` allowlist (§11 V3/V4) and codebase-RAG is not npm-launchable; (2) the
reviewer retains Bash (its test-runner instrument), diverging from D5/D11's "reviewer pure read-only,
no Bash", with independence preserved by denying Write/Edit/NotebookEdit — per the owner directive
that the reviewer do its full job; (3) review results are persisted as `role:"review"` artifacts and
surfaced in STATUS.md (RV), refining D12's STATUS.md content.
**Source:** architecture D5/D11/D12; Decisions D-R2/D-R6; §4.
**Why this approach:** a design record must reflect the design; divergences belong where D5/D11/D12
live so a future reader does not read them as oversights.
**Dependencies:** R2 (records its decision). Unblocks nothing.
**Verification:** the amendment states the hybrid, the three denylist agents, the reviewer-Bash
divergence, the RV record model, and the authority. No test; a documentation record.
**Impact if wrong:** a stale architecture misleads the next builder.

## 8. Divergences from existing patterns

- **R2 diverges from architecture D11's "tool allowlists scoped to its phase"** for
  `expert-reviewer`, `expert-architect`, `expert-planner`, which use hardened `disallowedTools`.
  Standard: OWASP ASVS V1 least-privilege *as achievable under the verified platform constraint* — the
  `tools` allow side cannot name host-provided MCP servers and has no all-MCP wildcard (§11 V4), so
  for agents that require those servers a denylist is the tightest boundary over the *nameable* tool set (the un-nameable host MCP namespace cannot be enumerated to deny); the reviewer additionally denies the nameable WebFetch/WebSearch it does not use. Introduced
  R2; recorded R8.
- **R2 diverges from architecture D5/D11's "reviewer pure read-only (no Bash)"** — the reviewer
  retains Bash. Standard: IEEE 1028 independence is satisfied by preventing edits to the artifact
  under review (Write/Edit/NotebookEdit denied), not by removing the test-runner instrument
  expert-review needs (§11 V23). Authority: owner directive. Introduced R2; recorded R8.
- **R3/R5 refine architecture D12** — STATUS.md now surfaces per-round review findings (via
  `role:"review"` artifacts), not just verdicts and counts (RV). Introduced R3/R5; recorded R8.

## 9. Checkpoints

- **CP1 — after R6** (R1–R4, R6 landed): run `node tests/structural/check-structure.mjs` and
  `node tests/unit/run-unit-tests.mjs`. Expect structural all-pass (real linter green; strict
  `.mcp.json` read; agent scoping + `skills:` sequence assertions) and unit **17/17** (16 prior + the
  R3 review-role case). Trigger: structural-to-behavioral boundary. R5 is a command-markdown change
  whose oracle is its content review (R5 Verification).
- **CP2 — after R7:** both fixtures exist and parse; ACCEPTANCE.md reflects them. Trigger:
  deliverable-completeness for M-3.

## 10. Decisions made during planning

- **D-R1 — Fix S-3/S-4/S-5/M-2/Mn-1/RV as one command↔workflow contract.** They are facets of one
  contract split across the sandboxed workflow (no fs/crypto → names data, declares transitions) and
  the command (sole writer → hashes, writes files, persists). Trace: `sequentialthinking` chain,
  thoughts 1–5 (thoughtHistoryLength 8–12).
- **D-R2 — Tool scoping partitioned by verified host-MCP need (allowlist 6 / denylist 3), no agent
  degraded.** An allowlist is deny-by-default and ideal but can only name authoring-time-stable tools;
  the three agents whose skills use host CodeGraph/codebase-RAG (§11 V22) cannot be allowlisted
  (unnameable, unbundleable) and must not be degraded, so they use denylists that retain full MCP and
  strip only role-inappropriate nameable capabilities (reviewer: edit power + WebFetch/WebSearch + Agent/Task/CORE-ingest,
  keeping Bash; architect/planner: Agent/Task/CORE-ingest). Authority for diverging from D11/D5: the
  owner's directives this session (engineering call; reviewer not degraded; reviewer does its full
  job). Trace: `sequentialthinking` chain, thoughts 1–5 (thoughtHistoryLength 3–7).
- **D-R3 — Escalations command-derived from `report.gate`, not carried in the delta.** A segment
  returns exactly one gate; the command records `{gate_type, segment}` on `owner_gate`, keeping the
  delta aligned with the architecture's SEGMENT_REPORT protocol.
- **D-R4 — Implementation non-convergence resume phase is `'implement'`.** The enum member the router
  routes; `'implementation'` is not in the enum, `'implementation_review'` has no router branch.
- **D-R5 — The structural test references the canonical repo-root linter and hard-fails if absent,**
  not a vendored copy (single source of truth; dev/CI runs inside the repo).
- **D-R6 — Review results persisted as `role:"review"` artifacts, surfaced in STATUS.md and at review
  gates (RV).** Review findings are durable readable records the owner can inspect; modeling them as
  artifacts reuses the D9 index/hash machinery (single source of truth) rather than a second store or
  prose in the state JSON, and keeps the read-only reviewer from writing its own record (independence
  — the command writes what the reviewer returns).
- **Tooling note (not a plan decision):** the Clear-Thought `sequentialthinking` calls initially
  failed; root cause was an over-long `thought` string colliding with the boolean parameter in this
  harness's serialization. Resolved by using concise thoughts (the tool's intended usage); both
  decision chains ran. No degraded substitute was used.

## 11. Verification of factual claims

Each claim carries read-level evidence gathered this session (2026-07-23).

- **V1** — `.mcp.json` is a bare top-level server map, no `mcpServers`. Read `.mcp.json:1–11`. R1, R6.
- **V2** — Documented plugin `.mcp.json` nests servers under `"mcpServers"`. Context7
  `/websites/code_claude`, /mcp "Configure Plugin MCP Server in .mcp.json" + "Example .mcp.json for
  Project Scope", 2026-07-23. R1.
- **V3** — Plugin-bundled MCP tools are named `mcp__plugin_<plugin>_<server>__<tool>`; that full name
  must be used in a subagent `tools` field. Context7, /mcp "Plugin MCP tool names" + "Reference Plugin
  MCP Tool Name", 2026-07-23. R2.
- **V4** — The `tools` allow side requires a specific glob-free server segment; `mcp__*` all-MCP
  wildcard is denylist/permissions-deny only. Context7, /permissions "Tool name wildcards" +
  /sub-agents "Available tools", 2026-07-23. R2, §4, D-R2.
- **V5** — Both `tools` and `disallowedTools` accept `mcp__<server>`/`mcp__<server>__*`;
  `disallowedTools` applied first; both may coexist. Context7, /sub-agents "Available tools",
  2026-07-23. R2.
- **V6** — All nine agents currently scope with `disallowedTools` and no `tools`. Read the nine
  frontmatters (`agents/*.md:5`). R2.
- **V7** — All nine use scalar `skills:`. Read the nine frontmatters (`agents/*.md:4`). R2.
- **V8** — `skills:` is documented as a YAML sequence. Context7, /sub-agents "Preloading Skills",
  2026-07-23. R2.
- **V9** — `feedbackEscalation` computed once, never read again. Read `workflows/expert-lifecycle.js:291`;
  no later reference through :468. R4.
- **V10** — The delta omits `artifacts[]`/`escalations[]`:
  `const delta = { phase, gate_history:[], amendments:[], budget:{…} }`. Read `…:282`. R4, R5.
- **V11** — On spec PASS: `delta.phase='spec'`, dead `delta.spec_ready=true`, returns intent gate.
  Read `…:320–322`. R4, R5.
- **V12** — On resume `cursor=ledger.phase||'intake'` then re-enters the spec block. Read
  `…:293–294, 297`. R4, R5.
- **V13** — `maybeNonConvergence` writes `delta.phase=phaseName.toLowerCase()`, `'Implementation'`→
  `'implementation'`. Read `…:462–464` and the call at `:390`. R4.
- **V14** — Ledger `phase` enum is `[intake, spec, architecture, plan, implement,
  implementation_review, ground_truth, closeout, complete]` — no `implementation`. Read
  `scripts/ledger.schema.json:33–43`. R4.
- **V15** — Ledger schema is `additionalProperties:false`. Read `scripts/ledger.schema.json:7`. R4.
- **V16** — Structural test checks the workflow with `node --check`, not `validate-workflow.mjs`. Read
  `tests/structural/check-structure.mjs:55–63`. R6.
- **V17** — Structural test reads `Object.keys(mcp.mcpServers || mcp)` (bare map passes). Read
  `…check-structure.mjs:71–73`. R6.
- **V18** — Real linter at repo `skills/workflow-creator/scripts/validate-workflow.mjs`; CLI
  `node validate-workflow.mjs <path>`; exit 0/1. Read that file `:1–17, 152–159`; Glob confirmed path. R6.
- **V19** — `tests/fixture/agents/` has only `forced-fail-reviewer.md` + `forced-unauthorized-implementer.md`.
  Glob. R7.
- **V20** — Sample uses `seed=(ledger.revision|0)+1`, `sampleIndices(n, seed)`
  (`count=max(2,ceil(0.1n))`, `stride=max(1,(|seed|%n)+1)`). Read `…:280, 205–218`; ACCEPTANCE.md:48. R7.
- **V21** — Feedback-sweep dispatch says "via `scripts/extract-owner-turns.mjs`", no
  `${CLAUDE_PLUGIN_ROOT}`, no transcript dir. Read `…:256–264`. R4, R5.
- **V22** — Skills referencing codegraph/codebase-rag: expert-review (5), expert-architecture (20),
  expert-plan (19); expert-spec/expert-implement/expert-standard do **not** appear. Grep
  `codegraph|codebase-rag|rag_search|rag_query` over `skills/`. R2 (partition).
- **V23** — expert-review enumerates the instruments "actually available in this session" — grep,
  Read, Context7, CodeGraph, codebase RAG, **test runner**, Clear Thought — mapping claim types to
  them (absence/content → grep/Read; structural → CodeGraph); it adapts, and a test runner (Bash) is a
  listed instrument. Read `skills/expert-review/SKILL.md:247, 251, 293`. R2 (reviewer keeps Bash +
  full MCP, not degraded).
- **V24** — The command is sole ledger writer and runs Bash. Read `commands/expert.md:8–9, 27–28, 60–73`.
  R5.
- **V25** — The orchestrator is sandboxed (no `require`/`fs`/`Date`/`Math.random`), enforced by
  `validate-workflow.mjs`. Read `skills/workflow-creator/scripts/validate-workflow.mjs:107–132`; spec §7.
  R4 (workflow cannot hash/write), R5 (command does).
- **V26** — Blast radius of the graph-tracked changed files is 0 dependents. `codegraph_get_change_impact`
  (this session), totalImpacted 0. R4, R6.
- **V27** — 15 docs reference the changed code set (nine agents, command, ACCEPTANCE.md,
  spec/arch/plan/review-round-1). `codegraph_find_related_docs` (this session). §5 doc-sync.
- **V28 (RV)** — The ledger `artifact_index[].role` enum is `[spec, architecture, plan,
  implementation, report, status]` — no `review`; `gate_history` items carry `findings_count` but no
  finding content; `runGate` keeps only `findings_count`; the command regenerates STATUS.md from
  verdicts/counts. Read `scripts/ledger.schema.json:53–55, 68–86`; `workflows/expert-lifecycle.js:238,
  284`; `commands/expert.md:74`. R3, R4, R5.

## 12. Test specifications

- **T-M1 — structural suite (integration/structural).** *Behavior:* the static contract after
  remediation — the workflow passes the canonical linter and carries `review_records`; `.mcp.json` is
  a valid `mcpServers` map with context7 + clear-thought; every `skills:` sequence resolves to a
  packaged skill; the six allowlist agents carry their `tools` field (read-only ones no
  Write/Edit/NotebookEdit); the reviewer denylist has Write/Edit/NotebookEdit/Agent/Task/CORE-ingest
  and **not** Bash; architect/planner deny Agent/Task/CORE-ingest; both fixtures parse; scripts
  present. Traces R1/R2/R4/R6/R7, spec A-2. *Level:* integration/structural (real loaders/validators,
  no tokens). *Real/double:* all real; **no doubles**. *Data:* the repaired artifacts. *Must NOT /
  fail:* must not re-introduce `mcp.mcpServers || mcp` or a weaker workflow oracle; **fails** if the
  workflow fails the real linter, the strict `.mcp.json` read lacks a server, any agent scoping or
  `skills:` shape is wrong, either fixture is missing, or the linter path cannot resolve. *Technique:*
  equivalence partitioning over artifact classes.
- **T-U1' — review-role ledger case (unit).** *Behavior:* `validate-ledger.mjs` accepts a ledger with
  an `artifact_index` entry `role:"review"` and the 16 prior cases still pass/fail as before. Traces
  R3. *Level:* unit. *Real/double:* all real (script + fixture ledgers; no double). *Data:* one
  known-good ledger carrying a `role:"review"` artifact, forward-derived from the extended schema.
  *Must NOT / fail:* must not assert on internal calls; **fails** if a review-role ledger is rejected
  or if any prior case regresses. *Technique:* equivalence partitioning (new valid class).
- **T-M3 — forced-failure fixtures (structural half of a system test).** *Behavior:* the A-4b and A-4c
  fixtures exist, parse, and (A-4b) document the sampler-derived plant index. Traces R7, spec A-4(b)(c).
  *Level:* structural existence/parse now; the behavioral runs are the deferred system tier. *Real/
  double:* the forced-failure agents are **not** doubles of the SUT — real adversarial-input agent
  definitions; the orchestrator runs real at the behavioral tier. *Data:* the two fixtures. *Must NOT
  / fail:* the A-4b plant must sit at a sampled index; **fails** (behavioral tier) if removing the
  plant still fires the control or the plant is never re-run. *Technique:* the sampler is the placement
  oracle.
- **RV behavioral verification (deferred, system):** at the behavioral tier, a review round producing
  findings results in a `role:"review"` record on disk and a STATUS.md entry showing those findings;
  fails if STATUS.md shows only a count. Specified here; run under the owner-gated tier.

The behavioral tier (A-3/A-4/A-5/A-8/A-9 live runs) is specified in `tests/ACCEPTANCE.md`, updated by
R7, and owner-gated (install + tokens); this plan does not run it.

## 13. Risks

- **R-1 — R4/R5 is the highest-blast-radius change (orchestration core + its writer + RV).** A
  routing/delta-contract defect mis-gates every task. Mitigate: CP1 (linter + structural + unit green);
  one contract designed together (D-R1).
- **R-2 — Behavioral consequences (A-3 advances; A-9(b) no remediation; A-4b/A-4c fire; review
  findings visible) are not confirmed by the automated tier.** They need the deferred owner-gated runs.
  Mitigate: each expected behavior and its criterion is stated so the deferred run is a checklist.
- **R-3 — R6's linter path assumes the repo checkout.** Outside the repo the linter is absent — by
  design a loud hard-fail, not a silent skip.
- **R-4 — The Mn-1 transcript-dir transform is derived from the observed path, not a documented
  algorithm.** Mitigate: the command resolves it by transform *or* by matching the single
  `~/.claude/projects/` entry (R5), degrading to a directory match rather than a wrong path. (Q-9.)
- **R-5 — RV grows the ledger's `artifact_index` and adds review files.** Bounded (round cap 5,
  finite phases); review records are concise finding lists, and modeling them as hashed artifacts keeps
  them under the same integrity machinery. No unbounded growth.
- **R-6 — No coupling-hotspot risk:** the graph-tracked files have 0 dependents (§11 V26).

## 14. Question register

- **Q-1 (bin-2) — behavioral tier scope.** *Disposition:* deferred, owner-established (ACCEPTANCE.md;
  handoff). This plan creates A-4b/A-4c and stops at the automated tier. Closed.
- **Q-2 (bin-1) — what not to re-do.** *Disposition:* R-1 skills and the transcript reader are
  untouched; the schema/validator/unit-tests are touched only additively for RV (§2). Closed.
- **Q-3 (bin-1) — does M-2/S-4 need a schema change?** *Disposition:* no for M-2/S-4 (workflow/command
  bugs); the only schema change is RV's additive `review` role (R3). Closed.
- **Q-4 (bin-1) — where does the intent→architecture transition belong?** *Disposition:* the command,
  on the owner's answer (D-R1; R5). Closed.
- **Q-5 (bin-1) — enum value for implementation non-convergence resume?** *Disposition:* `'implement'`
  (D-R4). Closed.
- **Q-6 (bin-1) — escalations in the delta or command-derived?** *Disposition:* command-derived from
  `report.gate` (D-R3). Closed.
- **Q-7 (bin-1; mis-escalated then resolved) — least privilege for the CodeGraph/RAG agents, incl. the
  reviewer, given the unnameable host namespace.** *Disposition:* the owner directed it is an
  engineering call and the reviewer must not be degraded; resolved as the allowlist-6/denylist-3
  hybrid with the reviewer keeping Bash + full MCP (D-R2; §4; R2; R8). Premises resolved from source
  (§11 V3/V4/V22/V23). Closed.
- **Q-8 (bin-1) — must S-1 prove the bare map fails?** *Disposition:* no — build to the documented
  wrapper (§11 V2). Closed.
- **Q-9 (bin-1) — transcript-dir sanitization transform.** *Disposition:* command resolves by
  transform or by matching the single `~/.claude/projects/` entry (R5; risk R-4). Closed.
- **Q-10 (bin-1) — must the structural parser change for the `skills:` sequence?** *Disposition:* yes
  (R6). Closed.
- **Q-11 (bin-1; owner-surfaced) — review results are recorded only as a count and visible to no
  one.** *Disposition:* the RV correction — workflow carries full findings, command persists them as
  `role:"review"` artifacts and surfaces them in STATUS.md and at review gates (D-R6; R3/R4/R5; §11
  V28). Closed.

**Reconciliation sweep:** three passes. Pass 1 surfaced Q-1…Q-10. Pass 2 (after the owner surfaced
review visibility) added Q-11 and propagated it into R3/R4/R5/§2/§5/§11/§12. Pass 3 walked every step,
decision, test spec, verification entry, and the coverage table and added zero new entries. Zero open
bin-1/bin-2 items.

## 15. Gaps acknowledged

No gaps. Every decision is grounded in a named standard from §3, and every factual claim carries a §11
read-level entry. The two premises the round-1 review flagged as unverified are resolved from current
documentation (§11 V2 for the wrapper; V3/V4 for the plugin MCP namespace), not deferred.

## 16. Post-completion

- Run `node tests/structural/check-structure.mjs` and `node tests/unit/run-unit-tests.mjs`; expect
  structural all-pass and unit 17/17 (CP1).
- Dispatch the independent review (neutral subagent, expert-review) against the remediated branch and
  loop to PASS before the owner merges.
- After PASS, the owner-gated behavioral tier (A-3, A-4a–d incl. the new A-4b/A-4c, A-5, A-8, A-9, plus
  the RV visibility check) is the remaining verification; it requires install + token authorization.
- `codegraph_diff_surface` is not applicable — no exported code surface changes (the workflow exports
  only `meta`; the scripts' CLIs are unchanged). The equivalent completeness check is CP1's structural
  pass plus the §5 doc-sync.
- Follow-up this plan may create: none beyond the standing deferred behavioral tier.
