# Codex Remediation Audit — 2026-05-23

**Auditor:** Claude (Opus 4.7).
**Repo:** `Maxcogar/agent-armory`.
**Plugin:** `claude-plugins/agentboard/`.
**Branch:** `session/2026-05-19-correction-loop`. HEAD: `38c9eae`. Codex remediation is uncommitted in the working tree on top of HEAD.

## Baseline

- **Governing spec (audit baseline):** `docs/specs/2026-05-16-correction-loop-option-a-design.md` (the Phase-8 short prose draft).
- **SSOT ledger:** `docs/specs/spec-ledger.yaml` records CL-001..CL-029.
- **Workflow authority:** `docs/specs/spec-workflow.md`.
- **Protected decision record:** `docs/specs/spec-chunk.md` (CH-01..CH-14). Not modified.
- **Inventory snapshot of the prior long spec:** `docs/specs/spec-inventory.md`.
- **Conflicts register:** `docs/specs/spec-conflicts.yaml` (all 8 issues `resolved`).
- **Evidence record:** `docs/specs/spec-evidence.md` (E-001..E-012, X-001..X-008, V-001..V-005).
- **Bounded remediation scope:** `docs/specs/spec-session-status.md` "Artifacts Changed This Session" + "Open Issues" + "Blocked / Sensitive Points".

## Method

- Read every governing input in full before evaluating any changed surface.
- Compared each in-scope changed file against the short spec section(s) its ledger records cover.
- Classified findings only as **Add / Correct / Remove / Unclear** per the audit method recorded in CORE Episode 4 ("every finding tied to an exact spec section or sentence").
- Did not grade, weight, or filter findings; flagged everything noticed.
- Distinguished "Codex remediation" from "Max's own concurrent work" using the git-status convention (only `claude-plugins/agentboard/` files are in remediation scope; `codex-plugins/agentboard/` and `skills/spec-rescue/` are out-of-bounds by standing pattern).

## CONFORMANT (Codex got it right)

### `commands/architecture.md`

| ID | Finding | Spec basis |
|---|---|---|
| C1 | Step 17 declares `correction_request_json` with explicit 5-field shape (`round`, `origin`, `routed_target`, `requested_change`, `provenance`); auditable, not free-form prompt context. | CL-023, CL-028 |
| C2 | Step 17 routes by real-time source-trace across three origins, with the explicit prohibition "Do not use a fixed mapping from problem type to route." | CL-008, CL-009 |
| C3 | Step 17 enforces a finite retry cap of 3 on the same scaffold card; at the cap, hands off to the external investigator and stops the local loop instead of dead-halting. | CL-011, CL-018, CL-019 |
| C4 | Step 17: "Escalate to the user only when the external source-trace process determines that the issue is spec-origin." | CL-020 |
| C5 | No in-flow `spec_path` edit anywhere — Step 17's three route bullets all forbid it (`instead of editing spec_path`, `Do not edit spec_path inside /architecture`, `hand it off to the external spec-modification path rather than using /foundation or an in-flow spec edit`); reinforced by Operating rule line 263 ("never through a silent `spec_path` edit"). | CL-012 |
| C6 | Three explicit routes (architecture-document, verified-bundle, spec) are handled distinctly. Spec route hands off to an external spec-modification path, not `/foundation` or an in-flow edit. | CL-013, CL-014, CL-015 |
| C7 | Inputs section line 13 declares the opt-in pause; Step 4 sets `architecture_correction_pause`; Step 17 honors it; line 65 and Operating rule line 267 both state the `/architecture` pause is distinct from AgentBoard board blocking gates and does not mutate board settings. Off by default. | CL-010 |
| C8 | Investigator handoff at the cap is automatic, with scaffold-card note + activity log entry naming the round cap and routed evidence. | CL-021 |
| C9 | Operating rule: "Do not let the design reviewer own repeated-failure investigation or source-trace beyond the findings it already surfaced." | CL-017 |
| C10 | `audit_artifact_id` naming is clean in the file: zero `verified_bundle_artifact_id` references; auditor's input `audited_bundle_artifact_id` correctly preserved as a distinct name. | (rename) |

### Compose profiles `architecture-compose-l1.md`, `-l2.md`, `-l3.md`

| ID | Finding | Spec basis |
|---|---|---|
| C11 | Each profile declares `correction_request_json`, `prior_architecture_document_path`, `prior_architecture_document_artifact_id` as correction-loop inputs in both the Preamble extension and the Subagent boundary contract. | CL-023, CL-028 |
| C12 | Each profile has a distinct `## Correction-mode process` section that switches the profile out of the create-from-scratch flow when `correction_request_json` is present. | CL-025, CL-026 |
| C13 | Correction-mode instructions explain interpretation, revision behavior (read prior doc, targeted re-derivation, preserve non-targeted material only if still correct), full-document re-validation, and halt-on-underspecified. | CL-027 |
| C14 | Per-level tailoring is appropriate: l1 = document write + gates + trap audit; l2 = + slice derivation + all gates; l3 = + collaborativereasoning synthesis + threat-model / quality / ASVS gates. | (implementation, no ledger record) |

### Hook scripts (comment-only updates)

| ID | Finding | Spec basis |
|---|---|---|
| C15 | All three scripts (`validate-architecture-artifact.sh`, `artifact-quality-gate.sh`, `inject-quality-gate-prompt.sh`) now document that the correction path uses declared stage inputs, not a fifth submitted artifact type. The four-type runtime is preserved deliberately per `spec-session-status.md` Blocked/Sensitive Points #5 — this is intentional, NOT the old "Serious 4" finding from the Codex review manifest. | (scope) |

### Fixtures, app-support spec, session-6-to-7 handoff

| ID | Finding | Spec basis |
|---|---|---|
| C16 | `hooks/tests/build-fixtures.py:234` and all 12 `hooks/tests/fixtures/review_*.json` files now use `audit_artifact_id`. Fixtures regenerated; field-name rename is clean across the set. | (rename) |
| C17 | `docs/specs/2026-05-12-agentboard-app-arch-pipeline-support.md:106` and `docs/handoffs/2026-05-13-session-6-to-7.md` lines 70 and 96 reflect "design reviewer takes `audit_artifact_id`, resolves the bundle from that audit." | (rename) |

### Design-reviewer profile (committed `38c9eae` before this session)

| ID | Finding | Spec basis |
|---|---|---|
| C18 | 8 occurrences of `audit_artifact_id` in `agents/architecture-design-reviewer.md`; 0 occurrences of `verified_bundle_artifact_id`; 0 conflations with the auditor's `audited_bundle_artifact_id`. Step 2(c) correctly fetches the audit by `audit_artifact_id` and resolves the verified bundle from it by branch logic. | (rename) |

## ADD (missing relative to the short spec; in scope)

| ID | Finding | Spec basis |
|---|---|---|
| A1 | **The `/architecture` correction-pause opt-in mechanism is undefined.** Inputs section line 13 says "Optional correction-pause intent for this `/architecture` run" and Step 4 says "if the user explicitly asked for a pause … set `architecture_correction_pause = true`", but no step describes the actual surface for that opt-in. There is no command-argument flag, no interactive prompt convention, no environment variable. The orchestrator has nothing concrete to detect the user's intent from. The short spec defines the orchestration-layer pause as opt-in; the runnable surface needs a defined way for the user to express the opt-in. | CL-010 |

## CORRECT (internally inconsistent)

| ID | Finding | Spec basis |
|---|---|---|
| Cr1 | **`docs/specs/spec-session-status.md` "Artifacts Changed This Session" list is wrong on two entries.** Lines 96–100 list `skills/workspace-orchestration/SKILL.md` and `skills/agentboard/SKILL.md` as changed. `git diff HEAD --` shows zero changes to either file. The same file's "Completed This Session" item 6 and "Open Issues" item 2 correctly describe them as checked, found stale, and NOT updated. Fix: remove these two file entries from the "Artifacts Changed This Session" list; they belong only in "Open Issues" and (optionally) "Artifacts Intentionally Not Touched Further". | (handoff integrity) |

## REMOVE

None in scope.

The 9 remaining files containing `verified_bundle_artifact_id` are all either historical handoffs / backups (correctly preserved as the record of what was misnamed) or older `contract` / `plan` artifacts explicitly deferred per `spec-session-status.md` Open Issues #3-4:

- `docs/handoffs/2026-05-16-architecture-rework-orchestration-FAILED.md` (committed historical record)
- `docs/handoffs/2026-05-17-correction-loop-design-session-end.md` (historical with USER EDITs)
- `docs/handoffs/2026-05-18-correction-loop-session-end.md` (historical)
- `docs/handoffs/2026-05-18-review-manifest-for-codex.md` (historical — Codex review manifest)
- `docs/specs/2026-05-16-correction-loop-option-a-design.BACKUP-pre-rework-2026-05-17.md` (diff target backup)
- `docs/specs/2026-05-12-architecture-pipeline-rework-contract.md` (deferred per Open Issue #3)
- `docs/plans/2026-05-12-architecture-pipeline-rework-plan.md` (deferred per Open Issue #3)
- `docs/specs/spec-evidence.md`, `docs/specs/spec-inventory.md`, `docs/specs/spec-session-status.md` (workflow artifacts that correctly describe the misnaming as observed evidence)

## UNCLEAR

| ID | Finding | Spec basis |
|---|---|---|
| U1 | **Correction-mode integration with the existing Process steps is implicit, not explicit.** Each compose profile says "switch into correction mode before Step 2 and treat that JSON as a declared auditable input" plus 5 behavioral bullets, but does not map those bullets onto the existing Process steps (Steps 2–10 in l1, 2–11 in l2, 2–17 in l3). A reader can infer that correction mode runs the normal process steps with targeted re-derivation, but the integration points are not enumerated. Workable in practice; might benefit from an explicit "correction mode runs the normal process with these modifications" mapping. | CL-026 |
| U2 | **l3 placement inconsistency.** `architecture-compose-l3.md` has no `## Preamble` heading; the new correction-mode preamble extension sits directly before the "You are Phase B of the architecture pipeline at level L3" paragraph. `architecture-compose-l1.md` and `-l2.md` both place the extension inside a `## Preamble` section. Functionally equivalent but structurally inconsistent across sibling profiles. | (cosmetic) |
| U3 | **`app-arch-pipeline-support.md` R1 may read ambiguously to a reader who arrives from the older plan/contract.** R1 (line 34) lists exactly 4 artifact types — correct in the bounded-remediation context, but the absence of a 5th type (which the older plan's `ARCH_CORRECTIONS_V1` would have added) is not explicitly explained on R1. A single sentence — e.g. "the correction-loop path uses declared stage inputs to the affected stage rather than a fifth submitted artifact type" — would close the ambiguity. | (clarity) |
| U4 | **Hook validator still does not gate-check the design-reviewer top-level seam field.** The original Codex review's Serious-2 finding ("validate-architecture-artifact.sh never gate-checks this top-level field at all") remains: the validator starts at `findings` / `summary`. The comment-only remediation didn't add field-level validation for `audit_artifact_id`. Per `spec-session-status.md` bounded scope this is acceptable today; flagged as a known coverage gap if Max wants it closed in a later pass. | (scope / coverage) |

## OUT OF SCOPE / NOT CODEX'S WORK

The working tree contains the following changes that are not part of the Codex remediation and were excluded from the audit:

- `dev-work-resources/expert-implement.md` deletion + `reference/agent-profiles/expert-implement.md` (untracked, dated 2026-05-11). A directory move pre-dating this session; not listed in `spec-session-status.md` "Artifacts Changed This Session". Not in Codex remediation scope.
- All `codex-plugins/agentboard/...` working-tree changes. Max's own concurrent work; standing out-of-bounds pattern.
- `claude-plugins/agentboard/skills/spec-rescue/` (untracked). Max's spec-rescue skill authoring; underlies the workflow this audit operates against.

## OPEN ISSUES FROM `spec-session-status.md` (acknowledged, not new findings)

1. End-to-end hook verification blocked: `jq` was not available on `PATH` in Codex's session; `AGENTBOARD_JQ_BIN` unset.
2. Plugin skill surfaces stale (`skills/workspace-orchestration/SKILL.md` and `skills/agentboard/SKILL.md`) — old wave-agent names (`planning-research-agent`, `plan-compose-agent`, etc.), old artifact names (`FACTS_BUNDLE_V1`, `AUDIT_FACTS_BUNDLE_V1`), older `/architecture → /foundation` dependency description.
3. Older `contract` + `plan` artifacts still on the pre-short-spec correction-path language, including declared correction-artifact language `ARCH_CORRECTIONS_V1`.
4. Bounded pass deliberately did not rewrite every older planning, contract, or skill artifact predating the short-spec decision.
5. CORE-required session-start and session-close actions were not executable in Codex's sessions because CORE tools were unavailable in that environment.
6. Owner sign-off on the correction-loop design has not occurred.

## Summary

Codex's bounded remediation is structurally sound. Every CL-record in scope is satisfied by the runnable correction path. The findings reduce to: one **Add** (A1: opt-in mechanism is undefined), one **Correct** (Cr1: stale-skill entries miscategorized in `spec-session-status.md`'s "Artifacts Changed" list), and four **Unclear** items that are workable but could be tightened. No **Remove** findings in scope. Everything else is either correct, intentionally bounded out per the spec-rescue workflow rules, or out of Codex's scope by the standing out-of-bounds pattern.

The "mangled" parts surfaced map cleanly to A1 + Cr1; the "left unupdated because no one explicitly told them" parts map to the `spec-session-status.md` Open Issues #1–6.
