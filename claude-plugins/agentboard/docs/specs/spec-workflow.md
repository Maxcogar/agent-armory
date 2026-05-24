# Spec Workflow

## Purpose

This document defines the workflow for repairing and finalizing the correction-loop spec without repeating the failure modes that corrupted earlier drafts.

This workflow exists to prevent:

- decisions being lost inside long prose;
- local reasoning being upgraded into fake authority;
- duplicates, overlaps, and conflicts being hidden by wording changes;
- review comments being written back into source text as if already approved;
- implementation work starting from unstable or contradictory design material.

## Core Rule

The final Markdown spec is a derived artifact, not the primary source of truth.

The primary source of truth is the approved decision set as captured in the current authoritative artifact layer for the active phase.

## End-to-End Goal

This workflow is only complete if a new agent can enter cold, follow a fixed entry sequence, determine the current state from named sources, do one bounded task safely, and leave the next agent enough durable state to continue without drift.
CORE is required for this workflow and must be used exactly as CORE requires. It is not optional, and it is not interchangeable with any other memory source.

## Artifact Set

The workflow uses distinct artifacts with distinct roles.

### 1. `spec-chunk.md`

Protected human decision record.

Role:

- stores primary decision chunks;
- stores approved section text as amendments;
- preserves traceability and reversibility;
- must not be edited without direct owner approval.

### 2. `spec-inventory.md`

Snapshot of what the current real spec contains.

Role:

- inventories existing sections, DDs, acceptance criteria, scope statements, and sign-off claims;
- does not reconcile, correct, approve, or rewrite;
- gives a stable map of the current spec so later analysis is grounded.

### 3. `spec-ledger.yaml`

Atomic source of truth for decisions.

Role:

- captures one decision per record;
- removes dependence on paragraph-shaped authority;
- becomes the machine-readable SSOT for later conformance and prose generation.

### 4. `spec-conflicts.yaml`

Conflict and redundancy register.

Role:

- records duplicates, overlaps, conflicts, and unresolved ambiguities;
- tracks status of each issue until resolved;
- prevents rediscovery of the same problem across sessions.

### 5. `spec-evidence.md` or `spec-evidence.yaml`

Evidence collection artifact.

Role:

- stores repo findings gathered through search, RAG, direct file reads, and deterministic extraction;
- documents where the codebase, plans, contracts, profiles, hooks, and prior specs mention a design concept;
- never acts as authority by itself.

### 6. Final spec Markdown

Derived artifact only.

Role:

- expresses the reconciled decision set in readable prose;
- must trace back to ledger items;
- is written only after the decision set is stable enough to support prose safely.

### 7. Session handoff record

Durable session-close state record.

For this workflow, the dedicated handoff/status artifact is:

- `docs/specs/spec-session-status.md`

## Decision Classes

Every decision must be classified before it is allowed into the ledger.

### A. Owner decision

A decision explicitly made by the owner.

### B. Existing technical invariant

A surviving rule from the codebase, contract, plan, or architecture boundary that is still valid and not under amendment.

### C. New synthesis

A new design conclusion introduced during this process.

Rule:

- new synthesis must be labeled as new synthesis;
- it must never be attributed to the owner, a handoff, a standard, or a prior spec unless that attribution is explicitly true.

## Artifact Status Classes

Every artifact touched by this workflow should be treated as having an explicit working status.

Suggested statuses:

- `protected` — cannot be edited without direct owner approval
- `inventory_only` — descriptive snapshot only; no reconciliation allowed
- `working` — safe to update in the current phase
- `frozen` — intentionally stable for now; do not change without deliberate reopen
- `derived` — generated from more authoritative material

At session start, the agent should identify the status of every artifact it intends to touch.

## Review Standard

When reviewing any source text, every statement must be classified as one of:

1. `clear_and_acceptable`
2. `unclear_requires_owner_clarification`
3. `contradictory_or_nonfunctional_cannot_stay`

No statement may remain in source text merely because a plausible interpretation can be imagined for it.

## Conformance Inspection Scope

When the workflow reaches conformance or remediation work against the current
governing spec, the inspection list must be built from affected-surface
membership.

Rules:

- inspect every file that participates in the behavior, boundary, artifact
  surface, or routing path the governing spec constrains;
- do not omit a file because it is merely predicted to need no edits;
- do not treat uncertainty as a valid reason to narrow the inspection list;
- every exclusion must be justified explicitly from the governing spec and the
  owner-approved scope;
- if that justification is weak, absent, or speculative, the file remains in
  scope for inspection.

Inspection and editing are separate decisions. A file may remain in scope for
inspection and still end the pass as no-change after direct review.

## Session Start

The session-start and session-end rules live in this workflow file because this workflow has no separate protocol document. The status file records current state only.

Before making new design claims or changing workflow artifacts, the agent must follow this exact entry sequence:

1. Read `AGENTS.md`.
   This tells the agent whether this workflow applies and which files must be read first.
2. Read `docs/specs/spec-workflow.md`.
   This defines the workflow rules, artifact roles, and phase model.
3. Read `docs/specs/spec-session-status.md`.
   This is where the current phase, current state, open issues, and next safe step are recorded.
4. Use CORE exactly as CORE requires for this workflow.
   CORE is required. Do not substitute another memory source. Do not infer that CORE can be skipped because repo files exist.
5. Read `docs/specs/spec-chunk.md`.
   This is the protected decision record.
6. Read `docs/specs/spec-inventory.md`.
   This is the inventory-only map of the current real spec.

After those reads, the agent must derive the session inputs from explicit sources:

1. Current phase:
   Read it from `docs/specs/spec-session-status.md` under `Current Workflow State`.
   Do not guess the phase from file contents.
2. Current authoritative artifact layer:
   Determine it from the current phase using this mapping:
   - Phase 1: `docs/specs/spec-chunk.md`
   - Phase 2: `docs/specs/spec-inventory.md`
   - Phase 3: `docs/specs/spec-ledger.yaml`
   - Phase 4: `docs/specs/spec-conflicts.yaml`
   - Phase 5: `docs/specs/spec-evidence.md` or `docs/specs/spec-evidence.yaml`
   - Phase 6: `docs/specs/spec-ledger.yaml` plus deterministic extraction outputs
   - Phase 7: `docs/specs/spec-ledger.yaml` and `docs/specs/spec-conflicts.yaml`
   - Phase 8: final spec Markdown derived from the ledger
   - Phase 9: final spec Markdown plus ledger-backed verification results
3. Protected artifacts:
   Read them from this workflow file's `Artifact Set` and from `docs/specs/spec-session-status.md`.
   If `spec-chunk.md` is the artifact in question, treat it as protected unless the owner explicitly approved a change.
4. Bounded task for the session:
   Read it from `docs/specs/spec-session-status.md` under `Next Safe Step`.
   If the user gives a narrower instruction, that instruction may further narrow the task but must not silently broaden it.
5. Out-of-scope work:
   Read it from `docs/specs/spec-session-status.md` and from any explicit owner constraints in chat.

For conformance sessions, determining out-of-scope work does not authorize
predictive narrowing of the inspection list. A file is excluded only when the
governing spec and current scope provide a concrete reason to exclude it.

If any of those cannot be determined from the named sources above, the workflow state is incomplete and must be repaired before new design work continues.

### Exact CORE Protocol For This Workflow

### RULE: APPROVAL REQUIRED BEFORE ANY WRITE TO CORE

Before calling ANY tool that writes data into or through CORE, you MUST
present what you intend to do and get explicit approval.

Tools that require approval before use:
- `memory_ingest` - show the full ingestion text first
- `add_reminder` - show the reminder text and schedule first
- `update_reminder` - show what will change first
- `execute_integration_action` - show the action and parameters first

Present the exact content, not a summary of it. Max must see the actual text
that will be stored. Then wait for approval before calling the tool.

This is not optional. A single incorrect write to CORE can propagate bad data
into every future session.

### RULE: ALL DATA MUST HAVE COMPLETE ENTITY CONNECTIONS

Every piece of data that enters CORE must contain everything CORE needs to
build correct graph connections. CORE extracts entities by name from the text
it receives. If a name is missing, abbreviated, or vague, the entity either
doesn't get created or doesn't connect to existing entities in the graph.

For every write to CORE:
- Repos: Owner and name - "Maxcogar/syndicatecnc-weekly-web-brief", never
  "the repo" or "the project"
- Files: Full paths from repo root - "src/api/handlers/auth.ts", never
  "the auth file" or "that handler"
- Packages/Dependencies: Full name and version when relevant -
  "python-fastmcp 2.0", never "the MCP library"
- APIs/Services: Proper name and endpoint when relevant -
  "ERPNext REST API /api/resource/Sales Order", never "the ERP endpoint"
- MCP Servers: Full name - "Engineering Design Navigator MCP server", never
  "the MCP server" or "the navigator"
- Infrastructure: Named - "Google Cloud Run", "Firebase Hosting",
  "HP t740 Docker host", never "the server" or "the cloud"
- Skills/Configs: With identifiers - "integration-builder skill at
  /mnt/skills/user/integration-builder/SKILL.md", never "that skill"
- People: Full name - "Max Cogar", never just "Max" or "the user"
- Organizations: Proper name - "CNC Syndicate", "Anthropic", never
  "the company"

Never use: "the repo", "the project", "the file", "that function", "the bug",
"the thing we fixed"

### START OF EVERY SESSION

**Step 1:** Call `initialize_conversation_session` (`new: true`). Store the
`sessionId` for the entire session.

**Step 2:** Identify the repo and work context. Determine:
- Which repository is being worked on (owner/name)
- What feature, bug, or task is the focus

**Step 3:** Call `memory_search` with a complete semantic question about the
repo or work being done.

CORE classifies every query into one of 5 types (aspect, entity lookup,
temporal, exploratory, relationship) and routes to the optimal search
strategy. The query must be a full natural-language question so CORE can
determine intent.

**Step 4:** If the session involves external services or integrations, call
`get_integrations` to verify connection status.

### END OF EVERY SESSION

**Step 1:** Write the full ingestion message.

**Step 2:** Present the ingestion message to Max for review. Do not call
`memory_ingest` until Max approves the content.

**Step 3:** Once approved, call `get_labels`, select the appropriate
label(s), and call `memory_ingest` with the approved text, `sessionId`, and
label ID(s).

If no label fits, ingest without a label. Do NOT guess.

### HOW TO WRITE THE INGESTION MESSAGE

Write as if the next Claude Code session has zero context and needs to pick
up exactly where this session left off. If a detail would be needed to
continue the work - find the right file, understand why a decision was made,
reproduce a bug, or know what's left to do - it must be in the message.

Format:

```text
<user>Max Cogar is working on {repo} - {what the session goal was, with enough context to understand why}</user>
<assistant>{What was done, decided, built, fixed, and what state the work is in}</assistant>
```

## Session Execution

During the session, the agent must:

1. operate on one bounded task at a time;
2. change only the artifact layer appropriate to the current phase;
3. keep source-of-truth work separate from prose work;
4. record decisions in durable artifacts, not only in conversation;
5. stop immediately if a protected artifact would need to change without approval.
6. use CORE exactly as CORE requires. This workflow depends on CORE.
7. when building a conformance inspection list, include files by affected-surface
   membership first and decide edit-versus-no-edit only after inspection.

## Session End

At session end, the agent must update `docs/specs/spec-session-status.md` with:

1. the current phase;
2. the task completed this session;
3. the artifacts changed;
4. the artifacts intentionally not touched;
5. unresolved issues;
6. the next safe step;
7. whether owner approval is required before further change.

The session is not correctly closed until those facts exist in that durable record.

## Operating Loop

Every session should follow this loop:

1. **Orient** — identify phase, authority, status, and scope
2. **Read** — inspect the relevant artifact(s)
3. **Act** — perform one bounded task in the correct artifact layer
4. **Record** — write the result into durable workflow state
5. **Close** — leave a handoff that lets the next agent repeat the loop

## Phase Workflow

### Phase 1 — Capture Known Decisions

Goal:

- get known decisions out of unstable prose and into protected records.

Steps:

1. record owner decisions as primary chunks in `spec-chunk.md`;
2. append approved section text as amendments without overwriting primary chunks;
3. preserve exact wording where owner-approved wording exists.

Exit condition:

- all currently known owner decisions are captured in `spec-chunk.md`.

Session-safe task examples:

- add one owner decision chunk
- attach one approved section amendment
- update chunk notes after a new amendment

### Phase 2 — Inventory The Real Spec

Goal:

- document exactly what the current spec says before trying to fix it.

Steps:

1. inventory all numbered sections in `spec-inventory.md`;
2. inventory all explicit DDs, route rules, scope claims, ACs, and sign-off claims;
3. keep this file descriptive only, with no reconciliation.

Exit condition:

- the real spec is fully broken down into reviewable units.

Session-safe task examples:

- inventory one numbered section
- inventory one DD cluster
- inventory sign-off claims separately from design claims

### Phase 3 — Build The Atomic Ledger

Goal:

- convert decisions from chunks and approved sections into atomic machine-readable records.

Steps:

1. create `spec-ledger.yaml`;
2. create one record per decision or rule;
3. attach source basis to every record;
4. classify each record as owner decision, existing technical invariant, or new synthesis.

Exit condition:

- the decision set exists independent of long-form prose.

Session-safe task examples:

- convert one chunk into ledger records
- classify one section's statements by source type
- add traceability to one set of records

### Phase 4 — Register Duplicates, Overlaps, Conflicts

Goal:

- make structural issues explicit instead of letting them hide in different wording.

Steps:

1. create `spec-conflicts.yaml`;
2. record duplicate intent;
3. record overlapping intent;
4. record conflicting intent;
5. record unresolved ambiguity.

Definitions:

- duplicate: different text, same intent
- overlap: shared intent plus extra distinct material
- conflict: incompatible or competing intent

Exit condition:

- every known redundancy or contradiction is tracked by ID and status.

Session-safe task examples:

- register one duplicate pair
- register one overlap cluster
- register one conflict and its competing intents

### Phase 5 — Gather Evidence

Goal:

- collect evidence about how the repo currently behaves.

Steps:

1. use direct file reads, search, and RAG to gather all relevant mentions;
2. collect findings into `spec-evidence.md` or `spec-evidence.yaml`;
3. distinguish evidence from authority at all times.

Exit condition:

- evidence exists for every mechanically important concept under review.

Session-safe task examples:

- gather all mentions of one parameter
- gather all surfaces for one correction-mode behavior
- gather all references to one retry-cap rule

### Phase 6 — Deterministic Conformance Extraction

Goal:

- compare current repo reality against ledger truth where possible.

Steps:

1. write deterministic extraction scripts for mechanically checkable facts;
2. extract facts from commands, profiles, hooks, tests, plans, and contracts;
3. compare extracted facts against `spec-ledger.yaml`;
4. record mismatches as evidence, not as rewritten prose.

Examples:

- declared inputs
- retry-cap values
- route enums
- parameter names
- artifact names
- presence or absence of revision-mode sections
- direct `spec_path` mutation

Exit condition:

- mechanically checkable mismatches are known and recorded.

Session-safe task examples:

- write one extractor for one fact
- compare one extracted fact against the ledger
- record one mismatch set in the evidence artifact

### Phase 7 — Reconcile The Ledger

Goal:

- resolve duplicates, overlaps, and conflicts before prose generation.

Steps:

1. review `spec-conflicts.yaml`;
2. resolve duplicate records by merge or replacement;
3. resolve overlap by splitting or consolidating boundaries;
4. resolve conflict by explicit decision;
5. mark every resolved issue in the conflict register.

Exit condition:

- the ledger is stable enough to support prose safely.

Session-safe task examples:

- resolve one duplicate cluster
- split one overloaded record
- decide one conflict and mark it resolved

### Phase 8 — Generate Or Write Final Prose

Goal:

- create the final spec from stable decision material.

Steps:

1. map ledger items to target sections;
2. write section prose from the ledger, not from memory;
3. keep traceability from prose to ledger IDs;
4. avoid introducing new synthesis unless explicitly marked and approved.

Exit condition:

- final spec prose exists and every section can be traced back to ledger items.

Session-safe task examples:

- write one numbered section from the ledger
- revise one prose section after conflict resolution
- attach traceability to one prose section

### Phase 9 — Final Verification

Goal:

- confirm the final prose is faithful to the ledger and mechanically safe.

Steps:

1. compare each prose section against its ledger source;
2. verify no section introduces untracked authority or hidden decisions;
3. rerun deterministic conformance checks where applicable;
4. flag unresolved issues before sign-off.

Exit condition:

- final spec is ready for owner sign-off.

Session-safe task examples:

- verify one section against ledger records
- rerun one deterministic check group
- flag one unsupported sentence and trace why it cannot stay

## Handoff Requirements

Every session status update must include:

1. current phase
2. completed task
3. changed artifacts
4. intentionally unchanged artifacts
5. unresolved issues
6. blocked issues
7. next safe step
8. owner-approval requirement, if any

If a handoff omits these, the next agent will be forced to infer state and the workflow will drift.

## Entry Questions For A New Agent

A new agent should be able to answer these from the artifacts alone:

1. What phase is the work in?
2. What is the primary source of truth right now?
3. Which file is inventory-only?
4. Which file is protected?
5. What one bounded task is next?
6. What unresolved conflicts remain?
7. Is final prose allowed yet, or is the work still upstream of that?

If important answers depend on CORE, that dependency must be explicit in `docs/specs/spec-session-status.md`.

## Exit Questions For The Current Agent

Before ending the session, the agent should be able to answer:

1. What exactly did I change?
2. Why was this the correct artifact layer to change?
3. What did I deliberately leave untouched?
4. What is the next safe move?
5. What must not be done next without owner approval?
6. Have I used CORE exactly as CORE requires before considering the session actually closed?

If those answers are not written down durably, the session is not properly closed.

## Mandatory Rules

### Rule 1 — No silent synthesis

If a sentence is not traceable to an owner decision, existing invariant, or explicitly labeled new synthesis, it must not be treated as settled truth.

### Rule 2 — No fake authority

Do not attribute local reasoning to:

- the owner
- a handoff
- a standard
- the current spec

unless that attribution is directly supported.

### Rule 3 — No prose-first conflict resolution

Conflicts must be resolved in the ledger or conflict register before they are “smoothed over” in Markdown.

### Rule 4 — No implementation from unstable prose

No implementation work begins from unresolved or contradictory design prose.

### Rule 5 — Smallest safe correction

When fixing prose, prefer:

1. delete unsafe statement
2. narrow unsafe statement
3. split overloaded statement
4. only then rewrite larger passages

### Rule 6 — One bounded task per session unit

Do not mix unrelated tasks from different artifact layers into one change set.

### Rule 7 — Protected artifacts stay protected

If an artifact is marked protected, do not modify it without direct owner approval, even if the intended correction seems obvious.

### Rule 8 — Final prose is last

Do not treat fluent Markdown as the stabilizing layer. Stabilize the decision set first.

## Suggested Ledger Schema

Each record in `spec-ledger.yaml` should contain fields like:

- `id`
- `title`
- `status`
- `type`
- `statement`
- `rationale`
- `source_basis`
- `scope`
- `inputs`
- `outputs`
- `constraints`
- `related`
- `notes`

## Suggested Conflict Schema

Each record in `spec-conflicts.yaml` should contain fields like:

- `id`
- `kind` (`duplicate`, `overlap`, `conflict`, `ambiguity`)
- `left`
- `right`
- `description`
- `status`
- `resolution`
- `notes`

## Suggested Working Principle For RAG

RAG is a retrieval layer, not an authority layer.

Use it to:

- find references;
- locate surfaces;
- gather evidence;
- reduce omission.

Do not use it to:

- decide authority;
- resolve conflicts by itself;
- replace the ledger.

## Completion Condition

This workflow is complete only when:

1. the known decisions are captured;
2. the real spec is inventoried;
3. the atomic ledger is reconciled;
4. evidence and deterministic checks have been applied;
5. final prose is generated from the stable decision set;
6. the owner signs off on the resulting spec.

## Operational Completion Condition

This workflow is operationally complete only when a new agent can use the durable artifacts correctly, perform one bounded task, and leave valid state for the next agent.
