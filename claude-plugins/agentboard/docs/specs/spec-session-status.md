# Spec Session Status

## Purpose

This file is the durable session-close and next-session-entry artifact for the correction-loop spec rescue workflow.

It exists so a new agent can enter cold, understand the current state without reconstructing chat history, and continue the workflow safely.

This file records state only. Workflow rules live in `docs/specs/spec-workflow.md`.

This file must be updated at the end of every session that changes or meaningfully advances the spec-rescue workflow.

## Current Workflow State

- **Workflow phase:** Phase 9 remediation in progress - runnable correction-path surfaces updated, support-surface seam reconciliation started, plugin skill surfaces still unreconciled, verification still open
- **Primary source of truth right now:** `docs/specs/2026-05-16-correction-loop-option-a-design.md` for the bounded conformance pass, with `docs/specs/spec-ledger.yaml` plus `docs/specs/spec-conflicts.yaml` still governing the rescue workflow state
- **Inventory-only artifact:** `docs/specs/spec-inventory.md`
- **Workflow authority:** `docs/specs/spec-workflow.md`
- **Workflow skill:** `skills/spec-rescue/SKILL.md`
- **CORE memory:** CORE is required for this workflow and must be used exactly as CORE requires, both at session start and at session close/handoff. CORE tools were not available in this session context, so the repo-local durable record was updated but CORE actions were not executed here.

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
6. Performed a late-session direct check of the plugin skill surfaces after the runnable and first support passes:
   - `skills/workspace-orchestration/SKILL.md` is still stale relative to current repo reality
   - it still references old orchestration agents:
     - `planning-research-agent`
     - `plan-compose-agent`
     - `review-agent`
     - `implementation-agent`
     - `audit-research-agent`
     - `audit-compose-agent`
   - it still references old artifact names:
     - `FACTS_BUNDLE_V1`
     - `AUDIT_FACTS_BUNDLE_V1`
   - it still describes the older `/architecture` dependency on `/foundation` for workspace-board setup
   - `skills/agentboard/SKILL.md` still routes workspace-board orchestration users to `skills/workspace-orchestration/SKILL.md`, so that stale orchestration skill remains a live plugin-facing invocation surface

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
- `skills/workspace-orchestration/SKILL.md`
- `skills/agentboard/SKILL.md`
- `docs/specs/spec-session-status.md`

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
- `agents/architecture-research-agent.md`
- `agents/architecture-classification-auditor.md`
- `agents/architecture-design-reviewer.md`
- `hooks/hooks.json`
- `docs/specs/2026-05-12-architecture-pipeline-rework-contract.md`
- `docs/plans/2026-05-12-architecture-pipeline-rework-plan.md`

Those artifacts were either governing inputs, outside the bounded remediation slice, or intentionally left for a later reconciliation pass.

## Open Issues

1. The runnable correction-path remediation is in place, but end-to-end hook verification is still open because the synthetic hook suite could not run without a working `jq` binary.
2. The plugin skill surfaces are not reconciled:
   - `skills/workspace-orchestration/SKILL.md` still describes old agents, old bundle artifact names, and an older orchestration shape
   - `skills/agentboard/SKILL.md` still points users at that stale orchestration skill for workspace-board orchestration
3. Older contract/plan surfaces outside this bounded support pass still contain pre-short-spec correction-path assumptions, including declared correction-artifact language (`ARCH_CORRECTIONS_V1`) that was not adopted in this remediation slice.
4. The current support-surface pass reconciled the design-reviewer seam and clarified the four-artifact hook runtime, but it did not broaden into a full rewrite of every older planning, contract, or skill artifact that predates the short-spec decision.
5. CORE-required session-start and session-close actions were not executable in this session context because CORE tools were unavailable.
6. Owner sign-off has not occurred, and this repo state must not be treated as fully conforming just because the runnable files now encode the short-spec path.

## Blocked / Sensitive Points

1. `spec-chunk.md` is protected and should not be modified without direct owner approval.
2. The final spec must not be rewritten from memory or chat.
3. The next agent must not re-import the older correction-artifact shape into runnable surfaces unless the owner explicitly expands scope and approves that broader reconciliation.
4. The next agent must keep the short spec authoritative for this bounded pass: declared correction input on the affected stage, real-time source-trace routing, no silent/automatic `spec_path` mutation, opt-in `/architecture` pause, retry cap `3`, and external-investigator handoff.
5. The next agent must not treat the lack of a fifth submitted artifact type in the current hooks as a defect by itself; for this remediation slice, the correction path is carried by declared stage inputs rather than a submitted correction artifact.
6. The next agent must still preserve the three-bucket standard when reading residual drift:
   - direct finding
   - implementation implication
   - truly unclear / no current finding

## Next Safe Step

Reconcile the plugin skill surfaces before treating this remediation as complete, then run the hook-suite verification with a working `jq` binary available to the shell.

Immediate remediation targets:
- `skills/workspace-orchestration/SKILL.md`
- `skills/agentboard/SKILL.md`

Required skill-surface goals:
- remove stale references to old wave agents that no longer match the current plugin surface
- remove stale references to `FACTS_BUNDLE_V1` and `AUDIT_FACTS_BUNDLE_V1`
- reconcile the orchestration skill's `/architecture` dependency language to current repo reality
- ensure the plugin-facing skill layer says the same thing as the current runnable correction-path surfaces and does not route users into stale orchestration instructions

Verification target:
- `bash hooks/tests/run-tests.sh` with `AGENTBOARD_JQ_BIN` set if needed

After the skill surfaces are reconciled and the hook suite passes, the next bounded follow-up is a residual-drift read of the older contract/plan surfaces that were intentionally left untouched in this session:
- `docs/specs/2026-05-12-architecture-pipeline-rework-contract.md`
- `docs/plans/2026-05-12-architecture-pipeline-rework-plan.md`

That residual pass should decide whether the owner wants those older design artifacts reconciled to the short-spec remediation, or intentionally left as historical pre-remediation documents.

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
