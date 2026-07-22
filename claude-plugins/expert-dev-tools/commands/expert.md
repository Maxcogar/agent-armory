---
description: Run the Expert lifecycle (spec → architecture → plan → implement → review → ground truth → closeout) on a task, gated by independent reviews and stopping only at owner decisions.
argument-hint: <task description, or "resume">
---

You are operating the **expert-dev-tools** lifecycle as its command tier (C2).
You own input/output and owner-facing language only — **all lifecycle routing
and gating lives in the workflow**, never here. You never decide to skip a
phase, and you are the **sole writer** of the ledger.

Task / argument: `$ARGUMENTS`

Ledger path: `${CLAUDE_PROJECT_DIR}/.claude/expert/ledger.json`
Plugin scripts: `${CLAUDE_PLUGIN_ROOT}/scripts/`
Workflow: `${CLAUDE_PLUGIN_ROOT}/workflows/expert-lifecycle.js`

Execute these steps in order. Do not improvise past a failed step — report it.

## 1. Preflight (F-2)

Before spending any tokens on a phase, confirm the environment:

- **Required MCPs answer.** The plan and architecture phases hard-require
  CodeGraph, Clear-Thought, and Context7. Confirm each responds (a cheap probe
  call). If any is missing, STOP and report exactly which one, with how to
  enable it — do not start a phase that will halt mid-run.
- **Ledger valid.** If the ledger file exists, validate it:
  `node "${CLAUDE_PLUGIN_ROOT}/scripts/validate-ledger.mjs" "${CLAUDE_PROJECT_DIR}/.claude/expert/ledger.json"`.
  A non-zero exit is a structured halt — report the diagnostic and offer to
  reconstruct the ledger from the artifacts + git history; never proceed on an
  invalid ledger.
- **Repo workable.** Confirm the target project is a git repo on a working
  branch.

## 2. Read and integrity-check the ledger (D9)

- If the ledger is missing, initialize a fresh one at `intake` (revision 0,
  empty arrays, `budget.total_tokens` 0, `feedback_marker` `{session_file:null,
  line:0}`) and create the `.claude/expert/` directory.
- Otherwise read it, and **re-hash every `artifact_index` entry**: compute the
  SHA-256 of each artifact on disk and compare to the stored `sha256`. On any
  mismatch, mark that artifact **amended** (append to `amendments`) and, if the
  artifact's `approved_by_owner` was true, invalidate that approval. A **spec**
  hash change is an owner escalation (spec-traceable) — surface it in step 5.

## 3. Invoke the workflow

Call the Workflow tool once:

`Workflow({ scriptPath: "${CLAUDE_PLUGIN_ROOT}/workflows/expert-lifecycle.js", args: <snapshot> })`

where `<snapshot>` is a JSON object: `{ ledger: <the current ledger>, task:
"$ARGUMENTS", spec_path, arch_path, plan_path }` (artifact paths from the
ledger's `artifact_index`, or the project defaults under `docs/`).

The workflow runs in the background and returns a **SEGMENT_REPORT**. Wait for
it. It ran from the ledger's phase through the machine gates to the next owner
gate or completion; it did **not** write any file you own.

## 4. Write the ledger and regenerate STATUS.md (D3, D12) — you are the only writer

From the SEGMENT_REPORT's `ledger_delta`:

- Apply the delta to the ledger: set `phase`, append `gate_history`,
  `amendments`, `escalations`; add `budget.total_tokens` into the per-phase and
  total budget.
- Persist the advanced `feedback_marker` and any signature updates from the
  report's `feedback` dispositions. **Shared-machinery** signatures go to the
  plugin-data store `${CLAUDE_PLUGIN_DATA}/defect-history.json`; project-scoped
  signatures go to the ledger's `signature_history`. Record a signature
  `corrected` only after the owner approves the fix and it is committed with a
  bumped `plugin.json` version (record `fixed_in_version` + `commit`).
- **Bump `revision` by 1** and write the ledger.
- Regenerate `${CLAUDE_PROJECT_DIR}/.claude/expert/STATUS.md` from the ledger:
  current phase, gate history with verdicts, open escalations, budget, and the
  next action. STATUS.md is generated, never hand-edited.

## 5. Present the outcome to the owner (F-9) — plain language, no jargon

Read the SEGMENT_REPORT's `outcome`:

- **`owner_gate`** — present the `gate` in plain terms: what happened, the
  options, and your recommendation. If the gate carries a `diagnosis` and
  `correction_draft`, show the root cause and the proposed fix so the owner
  approves or rejects a solution, not a bare problem. The six gate types and
  what each asks:
  - `intent` — "Is this spec what you meant?" (the one intent gate)
  - `spec_traceable` — a downstream issue that traces to the spec; needs the
    owner because the machine can't know intent
  - `business` — a genuine product/scope/spend trade-off
  - `risk_override` — a STOP where amend-plan isn't viable; accepting risk is
    the owner's call (never auto-selected)
  - `non_convergence` — a review loop hit its round cap
  - `core_approval` — the drafted CORE ingestion message; **present it for
    approval and never ingest it yourself** (you have no CORE-ingest tool, and
    ingestion is the owner's decision alone, per the repo CORE protocol)
- **`complete`** — report the completion: the final report path, the PR, and
  present the drafted CORE ingestion for approval (`core_gate.draft`). Do not
  ingest it.
- **`failed`** — report the failure and the state; do not retry blindly.

When the owner answers a gate, re-invoke `/expert resume` to continue the next
segment from the ledger.
