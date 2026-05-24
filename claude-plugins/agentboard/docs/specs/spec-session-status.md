# Spec Session Status

## Purpose

This file is the durable session-close and next-session-entry artifact for the correction-loop spec rescue workflow.

It exists so a new agent can enter cold, understand the current state without reconstructing chat history, and continue the workflow safely.

This file records state only. Workflow rules live in `docs/specs/spec-workflow.md`.

This file must be updated at the end of every session that changes or meaningfully advances the spec-rescue workflow.

## Current Workflow State

- **Workflow phase:** Phase 9 remediation — runnable correction-path surfaces (`commands/architecture.md` + three compose profiles + `agents/architecture-research-agent.md` with `force_remeasure`) conformant to the short spec; support surfaces (hook scripts, fixtures, app-support spec, session-6-to-7 handoff) reconciled; older `contract` + `plan` surfaces reconciled to the short-spec correction path (2026-05-23 / 2026-05-24 audit + cleanup); hook validator extended with R-REVIEW-4 `audit_artifact_id` field check; new invalid fixtures `review_invalid_missing_audit_artifact_id` and `review_invalid_empty_audit_artifact_id` generated. Plugin-wide grep confirms no `ARCH_CORRECTIONS_V1`, `corrections_artifact_id`, or `DD-*` (old-spec labels) references survive in active surfaces; remaining hits are confined to historical handoffs, backups, inventory of the prior long spec, and rename-history footnotes. Verification still open: hook-suite end-to-end run blocked on `jq` availability.
- **Primary source of truth right now:** `docs/specs/2026-05-16-correction-loop-option-a-design.md` (the Phase-8 short prose draft) backed by `docs/specs/spec-ledger.yaml` CL-001..CL-029. `docs/specs/spec-conflicts.yaml` (all 8 issues resolved) plus `docs/specs/spec-chunk.md` remain governing inputs.
- **Inventory-only artifact:** `docs/specs/spec-inventory.md`
- **Workflow authority:** `docs/specs/spec-workflow.md`
- **Workflow skill:** `skills/spec-rescue/SKILL.md`
- **CORE memory:** CORE is required for this workflow and must be used exactly as CORE requires, both at session start and at session close/handoff. CORE was initialized at session start (2026-05-23 session id `0eaca4a6-dd19-434a-9852-02521585a759`) and `memory_search` was executed. End-of-session `memory_ingest` requires owner-approved ingestion text per the AGENTS.md protocol and has not yet been performed for this session's work.

## Current Artifact Statuses

- `AGENTS.md`: entrypoint
- `docs/specs/spec-workflow.md`: workflow authority
- `docs/specs/spec-session-status.md`: current-state handoff record
- `docs/specs/spec-chunk.md`: protected
- `docs/specs/spec-inventory.md`: inventory_only
- `docs/specs/spec-ledger.yaml`: reconciled
- `docs/specs/spec-conflicts.yaml`: reconciled
- `docs/specs/spec-evidence.md`: working
- `docs/specs/2026-05-16-correction-loop-option-a-design.md`: derived

## Completed This Session

1. Re-ran the governing correction-loop reads and continued from the recorded next safe step:
   - `AGENTS.md`
   - `docs/specs/spec-workflow.md`
   - `docs/specs/spec-session-status.md`
   - `docs/specs/spec-chunk.md`
   - `docs/specs/spec-inventory.md`
   - `docs/specs/2026-05-16-correction-loop-option-a-design.md`
   - repo-local `skills/spec-rescue/SKILL.md` was still not available in this session context, so the workflow was followed directly from the repo artifacts
2. Remediated the runnable correction-path surfaces against the short spec:
   - `commands/architecture.md` now carries an explicit `/architecture` correction-pause input, real-time source-trace routing, declared `correction_request_json`, retry cap `3`, external-investigator handoff at the cap, owner escalation only on spec-origin outcome, and no direct in-flow `spec_path` edit for substantive correction
   - `commands/architecture.md` now passes the design-reviewer seam as `audit_artifact_id`
   - `agents/architecture-compose-l1.md`, `agents/architecture-compose-l2.md`, and `agents/architecture-compose-l3.md` now declare correction-mode inputs and a revision-mode process distinct from create-from-scratch flow
3. Reconciled the first support surfaces needed by that remediation:
   - `hooks/tests/build-fixtures.py` and the generated `hooks/tests/fixtures/review_*.json` fixtures now use `audit_artifact_id` instead of the stale `verified_bundle_artifact_id` seam
   - `docs/specs/2026-05-12-agentboard-app-arch-pipeline-support.md` now describes the design reviewer seam as `audit_artifact_id`
   - `docs/handoffs/2026-05-13-session-6-to-7.md` now describes the design reviewer seam as `audit_artifact_id`
   - `hooks/scripts/validate-architecture-artifact.sh`, `hooks/scripts/artifact-quality-gate.sh`, and `hooks/scripts/inject-quality-gate-prompt.sh` now explicitly document that the current runtime still has four submitted architecture artifact types and that the correction-loop path uses declared stage inputs rather than a fifth submitted correction artifact
4. Performed available verification:
   - regenerated hook fixtures with `python hooks/tests/build-fixtures.py`
   - confirmed the regenerated `hooks/tests/fixtures/review_*.json` fixtures now carry `audit_artifact_id`
   - confirmed the updated runnable and support surfaces contain the new correction-path language by direct read and `rg`
5. Identified the current verification blocker:
   - `hooks/tests/run-tests.sh` exists and is the correct synthetic test runner for the hook scripts
   - the full hook-suite run did not execute in this environment because `jq` was not available on `PATH` and no working `AGENTBOARD_JQ_BIN` was available in-session
6. Performed a late-session direct check of the plugin skill surfaces and then a 2026-05-23 audit re-check that corrected the initial reading:
   - `skills/workspace-orchestration/SKILL.md` is consistent with current repo reality. Its references to `planning-research-agent`, `plan-compose-agent`, `review-agent`, `implementation-agent`, `audit-research-agent`, `audit-compose-agent` all exist in `agents/` and are the current wave-worker names. Its references to `FACTS_BUNDLE_V1` and `AUDIT_FACTS_BUNDLE_V1` are the current workspace pipeline bundle sentinels (a distinct namespace from the architecture pipeline's `ARCH_FACTS_BUNDLE_V2`), as defined by `agents/planning-research-agent.md` and `agents/audit-research-agent.md`. Its statement that `/architecture` depends on a spec from `/foundation` matches CL-014 and `commands/foundation.md`.
   - `skills/agentboard/SKILL.md` correctly routes workspace-board orchestration users to `skills/workspace-orchestration/SKILL.md`; that target skill is not stale.
   - Initial assessment in this section had flagged these skill files as stale; that assessment was incorrect and is superseded by the 2026-05-23 audit (`docs/handoffs/2026-05-23-codex-remediation-audit.md`).

## Artifacts Changed This Session

- `commands/architecture.md`
- `agents/architecture-compose-l1.md`
- `agents/architecture-compose-l2.md`
- `agents/architecture-compose-l3.md`
- `hooks/scripts/validate-architecture-artifact.sh`
- `hooks/scripts/artifact-quality-gate.sh`
- `hooks/scripts/inject-quality-gate-prompt.sh`
- `hooks/tests/build-fixtures.py`
- `hooks/tests/fixtures/review_invalid_bad_category.json`
- `hooks/tests/fixtures/review_invalid_bad_severity.json`
- `hooks/tests/fixtures/review_invalid_duplicate_ids.json`
- `hooks/tests/fixtures/review_invalid_empty_quoted_text.json`
- `hooks/tests/fixtures/review_invalid_id_f0.json`
- `hooks/tests/fixtures/review_invalid_id_f01.json`
- `hooks/tests/fixtures/review_invalid_noncontiguous_ids.json`
- `hooks/tests/fixtures/review_invalid_summary_mismatch.json`
- `hooks/tests/fixtures/review_invalid_wrong_sentinel.json`
- `hooks/tests/fixtures/review_valid_empty_findings.json`
- `hooks/tests/fixtures/review_valid_empty_findings_crlf.json`
- `hooks/tests/fixtures/review_valid_with_findings.json`
- `docs/specs/2026-05-12-agentboard-app-arch-pipeline-support.md`
- `docs/handoffs/2026-05-13-session-6-to-7.md`
- `docs/specs/spec-session-status.md`

(`skills/workspace-orchestration/SKILL.md` and `skills/agentboard/SKILL.md` were inspected but not modified; the initial entry that listed them under "Artifacts Changed" was an error corrected by the 2026-05-23 audit.)

## Artifacts Intentionally Not Created Yet

- No new workflow/process artifacts were created during this remediation session.

## Artifacts Intentionally Not Touched Further

- `docs/specs/spec-chunk.md`
- `docs/specs/spec-inventory.md`
- `docs/specs/2026-05-16-correction-loop-option-a-design.md`
- `docs/specs/spec-ledger.yaml`
- `docs/specs/spec-conflicts.yaml`
- `docs/specs/spec-evidence.md`
- `commands/foundation.md`
- `agents/architecture-classification-auditor.md`
- `agents/architecture-design-reviewer.md`
- `hooks/hooks.json`

Those artifacts are governing inputs, protected, or were verified consistent without edits. Note: `agents/architecture-research-agent.md`, `docs/specs/2026-05-12-architecture-pipeline-rework-contract.md`, and `docs/plans/2026-05-12-architecture-pipeline-rework-plan.md` were previously listed here but were edited in the 2026-05-23 / 2026-05-24 plugin-wide cleanup to reconcile them to the short spec — see the changed-list above.

## Open Issues

1. End-to-end hook verification is still open because the synthetic hook suite could not run in the prior session without a working `jq` binary. Fixtures (47 total, including the two new R-REVIEW-4 fixtures) regenerate cleanly via `python hooks/tests/build-fixtures.py`. Run `bash hooks/tests/run-tests.sh` with `AGENTBOARD_JQ_BIN` set to a working `jq` to close this.
2. `~~The plugin skill surfaces are not reconciled.~~` Superseded by the 2026-05-23 audit: `skills/workspace-orchestration/SKILL.md` and `skills/agentboard/SKILL.md` were inspected and found consistent with current repo reality; the original staleness claim conflated workspace-pipeline bundle names (`FACTS_BUNDLE_V1`, `AUDIT_FACTS_BUNDLE_V1`) with architecture-pipeline bundle names (`ARCH_FACTS_BUNDLE_V2`). No skill changes required.
3. `~~Older contract/plan surfaces still contain pre-short-spec correction-path assumptions.~~` Closed by the 2026-05-23 / 2026-05-24 cleanup: `docs/specs/2026-05-12-architecture-pipeline-rework-contract.md` and `docs/plans/2026-05-12-architecture-pipeline-rework-plan.md` were surgically reconciled — `ARCH_CORRECTIONS_V1` replaced with the declared `correction_request_json` input model; `corrections_artifact_id` replaced with `correction_request_json`; the four-submitted-artifact-type model documented as intentional; old `DD-*` labels translated to short-spec `CL-*` references; step 17 `spec_path` edit workaround replaced with source-trace routing + retry cap 3 + external-investigator handoff; AC-20/AC-21 rewritten against the short spec. `force_remeasure` wired end-to-end from `commands/architecture.md` step 17's verified-bundle route through `agents/architecture-research-agent.md` Step 2. Plugin-wide grep confirms zero active `ARCH_CORRECTIONS_V1` / `corrections_artifact_id` / old `DD-*` references in runnable or governing surfaces; remaining hits are historical handoffs, backup file, inventory of the prior long spec, and rename-history footnotes.
4. CORE end-of-session `memory_ingest` requires owner-approved ingestion text per the AGENTS.md protocol and has not yet been performed for the 2026-05-23 / 2026-05-24 session work.
5. Owner sign-off on the correction-loop design and the plugin-wide cleanup has not occurred. This repo state must not be treated as fully conforming just because the runnable + governing files now encode the short-spec path.

## Blocked / Sensitive Points

1. `spec-chunk.md` is protected and should not be modified without direct owner approval.
2. The final spec must not be rewritten from memory or chat.
3. The next agent must not re-import the older correction-artifact shape into runnable surfaces unless the owner explicitly expands scope and approves that broader reconciliation.
4. The next agent must keep the short spec authoritative: declared correction input on the affected stage (`correction_request_json`), real-time source-trace routing across three origins, no silent/automatic `spec_path` mutation, opt-in `/architecture` pause via the `--pause` / `pause` flag, retry cap `3` on the same scaffold card, external-investigator handoff at the cap, owner escalation only on spec-origin outcomes.
5. The lack of a fifth submitted artifact type in the current hooks is intentional, not a defect; the correction path is carried by the declared stage input `correction_request_json`, not by a submitted correction artifact.
6. The next agent must still preserve the three-bucket standard when reading residual drift:
   - direct finding
   - implementation implication
   - truly unclear / no current finding

## Next Safe Step

Run the hook-suite verification with a working `jq` binary available:

```
AGENTBOARD_JQ_BIN=<path-to-jq.exe> bash hooks/tests/run-tests.sh
```

The suite now includes two new R-REVIEW-4 invalid fixtures (`review_invalid_missing_audit_artifact_id` and `review_invalid_empty_audit_artifact_id`) that exercise the new field-level check on the design-reviewer top-level `audit_artifact_id` seam.

After the suite passes, present the CORE end-of-session ingestion text to the owner for approval and run `memory_ingest`.

Still out of scope unless the owner expands scope:
- unrelated plugin commands
- unrelated skills
- codex-plugin tree
- protected chunk / workflow artifacts except this status file

## Explicit Next-Session Entry Sequence

The next agent should do these steps in order:

1. Read `AGENTS.md`
2. Read `docs/specs/spec-workflow.md`
3. Read `docs/specs/spec-session-status.md`
4. Follow the CORE Memory Protocol exactly if the CORE tools are available in that session:
   - before any write to CORE, present the exact content and get explicit approval
   - every CORE write must preserve complete entity connections
   - start of session:
     - call `initialize_conversation_session` (`new: true`) and store the `sessionId`
     - identify the repo and work context
     - call `memory_search` with a complete semantic question about the repo or work being done
     - if the session involves external services or integrations, call `get_integrations` to verify connection status
5. Read `docs/specs/spec-chunk.md`
6. Read `docs/specs/spec-inventory.md`
7. Confirm the current phase from `Current Workflow State` in this file
8. Read `docs/specs/2026-05-16-correction-loop-option-a-design.md`
9. Read the currently remediated runnable, support, and plugin skill surfaces directly:
   - `commands/architecture.md`
   - `agents/architecture-compose-l1.md`
   - `agents/architecture-compose-l2.md`
   - `agents/architecture-compose-l3.md`
   - `hooks/scripts/validate-architecture-artifact.sh`
   - `hooks/scripts/artifact-quality-gate.sh`
   - `hooks/scripts/inject-quality-gate-prompt.sh`
   - `hooks/tests/build-fixtures.py`
   - `hooks/tests/fixtures/review_*.json`
   - `skills/workspace-orchestration/SKILL.md`
   - `skills/agentboard/SKILL.md`
10. Reconcile the stale plugin skill surfaces before calling the remediation complete
11. Run `hooks/tests/run-tests.sh` with a working `jq` binary available to the shell
12. Fix any verification failures in the bounded hook/test support surfaces before broadening into older contract/plan reconciliation
13. Do not reintroduce direct in-flow `spec_path` mutation or an undeclared correction path while doing support-surface cleanup

## Required CORE-Memory Action For Handoff

Before this session is considered correctly closed, the agent must:

1. update `docs/specs/spec-session-status.md` if the session changed or meaningfully advanced the workflow;
2. write the full ingestion message;
3. present the ingestion message to Max for review and do not call `memory_ingest` until Max approves the content;
4. once approved, call `get_labels`, select the appropriate label(s), and call `memory_ingest` with the approved text, `sessionId`, and label ID(s);
5. if no label fits, ingest without a label. Do NOT guess.

Use this ingestion format:

```text
<user>Max Cogar is working on {repo} - {what the session goal was, with enough context to understand why}</user>
<assistant>{What was done, decided, built, fixed, and what state the work is in}</assistant>
```

The message must preserve complete entity connections. For every write to CORE:
- Repos: Owner and name
- Files: Full paths from repo root
- Packages/Dependencies: Full name and version when relevant
- APIs/Services: Proper name and endpoint when relevant
- MCP Servers: Full name
- Infrastructure: Named
- Skills/Configs: With identifiers
- People: Full name
- Organizations: Proper name

Never use: "the repo", "the project", "the file", "that function", "the bug", "the thing we fixed"

This is mandatory, not optional, and repo artifacts do not replace CORE.

## Owner Approval Requirement

- Owner sign-off is required before treating the derived prose as the approved design of record.
- Direct owner approval is required before modifying protected chunk content in `spec-chunk.md`.
