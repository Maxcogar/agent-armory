# Handoff — Architecture pipeline rework orchestration session (2026-05-16) — TASK FAILED

**Status:** FAILED. The owner ended the session and is assigning cleanup to someone else.
This document is an honest record of what was done, what is committed, what is
known-wrong, and what is unverified. No spin. Read all of it before touching anything.

**Branch:** `main`, not pushed. **HEAD:** `1112a22`.

---

## What this session was

An orchestration session that dispatched background subagents to execute the remaining
sessions of the 2026-05-12 architecture pipeline rework (plan:
`docs/plans/2026-05-12-architecture-pipeline-rework-plan.md`; contract:
`docs/specs/2026-05-12-architecture-pipeline-rework-contract.md`). Session 7
(design-reviewer) ran concurrently and separately and is committed.

## Commits produced this session (newest first)

- `1112a22` Apply Codex Session 9 review — **introduced new defects, see below**
- `9a58967` Rebuild Session 8 hook against reconciled plan §7
- `c4c4466` Revert erroneous codex-tree file mirror from Session 10
- `d3aae58` Session 10: codex sync + version 0.3.0 + verification report — **codex part reverted by c4c4466; verification report is unreliable, see below**
- `de39b12` Session 9: /architecture orchestration rewrite + agentboard app spec
- `2af2282` Session 8: hooks (V2 artifact validation, gate dispatch, synthetic tests)

Session 7 commits interleaved (NOT this session): `225ea0f`, `9828344`, `411b434`,
`47a1c14`, `c53523b`, and the `…round N…` series.

## Working tree

Clean with respect to the rework. The only uncommitted changes are pre-existing,
unrelated, owner-authored work and MUST NOT be touched:
`codex-plugins/agentboard/.codex-plugin/plugin.json`, `codex-plugins/agentboard/README.md`,
`codex-plugins/agentboard/skills/{agentboard,board-status,foundation,orchestrate,workspace-orchestration}/…`,
`codex-plugins/agentboard/skills/orchestrate/references/{planning-worker,review-worker}.md`,
`codex-plugins/agentboard/skills/architecture/` (untracked), `skills/expert-standards/` (untracked).

---

## KNOWN WRONG — fixable, NOT fixed

1. **Correction loop is a plan self-contradiction (UNFIXED).** Plan §9 step 17 mandates
   "re-spawn compose with corrections context"; the contract (~line 197) forbids passing
   subagents undeclared inputs; compose (§1.3–§1.5 + the three profiles) declares no
   corrections input. The three statements cannot coexist. The owner explicitly chose
   **Option A** (give compose a *declared* corrections input + per-level revision mode)
   and ordered it implemented. **It was never implemented.** This is the central unfinished
   work. Note: Option A is a *design* task (what the corrections input carries; how each
   compose level behaves in revision mode) and must be written as a reviewable design spec
   and approved BEFORE any code — see methodology note below.

2. **Live blocker committed in `1112a22`.** `commands/architecture.md` passes the bundle to
   compose as `verified_bundle_json`; all three compose profiles declare/parse the input as
   `arch_facts_bundle` (compose-l1/l2/l3 line 10/10/8 + their halt checks). Compose would
   not find its input. Found by independent Codex review of Session 9; the round-2 fix
   (`1112a22`) did not resolve it and introduced item 3.

3. **Auditability regression committed in `1112a22`.** The round-2 Session-9 fix made step 17
   amend `spec_path` then re-run, but step 18 commits only the architecture document — git
   ends up with an architecture generated from an uncommitted spec revision. (Implementing
   Option A removes spec-mutation and dissolves this.)

4. **Bundle passed inline, not by ID.** Plan mandates the orchestrator paste the full bundle
   into compose's prompt and forbids passing an artifact ID. Every other agent
   (design-reviewer, auditor) is given an ID and fetches it itself; compose already has
   `agentboard_get_workspace_artifact` in frontmatter. Preamble rule 3's "no codebase
   discovery" bans only `rag_search`/`codegraph_*`/`rag_query_impact` — artifact fetch is
   retrieval, not discovery, so the inline mandate has no surviving justification. Expensive
   and fragile. UNFIXED.

5. **Misnamed parameter `verified_bundle_artifact_id`.** It carries the *audit* artifact's
   ID, not a bundle ID. The design-reviewer profile (~line 38) contains a warning sentence
   that exists only to apologize for the wrong name. Correct name: `audit_artifact_id`.
   Out-of-scope call sites that must be reconciled in the same rename:
   `docs/specs/2026-05-12-agentboard-app-arch-pipeline-support.md:106`,
   `docs/handoffs/2026-05-13-session-6-to-7.md` (lines 70, 96),
   `hooks/tests/build-fixtures.py:234`, `hooks/tests/fixtures/review_*.json`.
   (NOTE: the auditor's `audited_bundle_artifact_id` is a *different*, correctly-named input —
   do not conflate.) The validation hook does NOT validate this field name (confirmed), so
   `hooks/scripts/` does not need touching for the rename.

6. **Two names for one thing:** `arch_facts_bundle` (compose) vs `verified_bundle_json`
   (command) are the same data. Collapses out once item 4 is fixed (command passes an ID,
   not a blob).

Items 2–6 all converge: implementing fetch-by-ID (item 4) + Option A (item 1) makes the
names honest, kills the blocker (2), and removes the auditability regression (3).

## KNOWN UNVERIFIED — cannot be claimed correct

7. **Compose-l1/l2/l3, research-agent, classification-auditor were never independently
   audited** against the Session-7 defect patterns (CRLF/BOM, sentinel-strip,
   five-part-format contract mismatch, halt-completeness). Flagged in
   `docs/handoffs/2026-05-14-session-7-to-8.md`; still unscheduled. Largest unknown.

8. **`docs/plans/2026-05-12-rework-verification-report.md` is unreliable.** It claims
   20/20 acceptance via *directed self-review against a pre-reconciliation state*. Do not
   trust it.

9. **Rebuilt Session 8 hook (`9a58967`) has had no independent review.** Only directed
   self-review. Codex has not seen it. A prepared un-directed Codex prompt for it exists in
   the session transcript but was not run.

10. **Session 9 corrected state (`1112a22`) has not been re-reviewed.** Codex reviewed
    `de39b12`; the `1112a22` fix that followed has not been independently re-reviewed (and
    it introduced items 2 and 3).

## Codex tree

The Session-10 verbatim file mirror into `codex-plugins/agentboard/` was wrong (Codex plugin
is skills-based; it never had `agents/`/`commands/`) and was fully reverted in `c4c4466`.
The owner's actual ask — a *document* describing the rework for Codex to apply to its own
skills-based plugin — was never produced. The owner's in-progress skills-based codex
adaptation is the uncommitted working-tree work listed above; leave it alone.

---

## METHODOLOGY — why this failed; do not repeat

The repeating failure mode, in every round: a design decision got *invented inside an
implementation subagent*, committed, and blessed by that agent's own directed self-review;
the defect surfaced only when an independent un-directed review finally looked. The
§9-step-17 contradiction, the round-2 spec-amendment workaround, and the line-130 blocker
are all this same shape.

For whoever cleans this up:

- **Separate design from implementation.** Option A is a design decision. Write it as a
  short, reviewable spec and get the owner's approval on paper BEFORE any code is touched.
  Do not hand an implementation agent a design to invent.
- **Directed/seeded review is worthless here.** The only thing that caught real defects was
  an *un-directed* independent Codex pass ("here is the spec, here is the artifact, find
  defects" — no checklist). Never relay an agent's directed self-report as verified.
- **When spec and instruction conflict, STOP and surface it.** Do not improvise a substitute
  or bake in an explanatory sentence to paper over a contradiction.
- **Do not dispatch large entangled autonomous multi-file changes.** The consolidated
  fix (items 1–6) was attempted as one 7-file autonomous agent and was correctly aborted
  before it edited anything.
- The plan is the spec of record. Fix the plan to internal consistency FIRST, then conform
  code to it — never the reverse.

## Suggested order for cleanup (not authoritative — owner decides)

1. Write the Option A design spec; get owner approval on paper.
2. Implement items 1–6 as one coherent plan-first change (plan → contract → 3 compose
   profiles → design-reviewer → command), each surface conformed to the corrected plan.
3. Un-directed independent review of the whole change.
4. Then schedule the items 7–10 independent audit (separate, large).
5. Then (and only when the claude tree is final) write the Codex handoff *document*.
