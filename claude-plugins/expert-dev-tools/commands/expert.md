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

First resolve two paths for the feedback sweep (Mn-1): `reader_script` =
`${CLAUDE_PLUGIN_ROOT}/scripts/extract-owner-turns.mjs` (absolute), and
`transcript_dir` = this project's transcript directory
`~/.claude/projects/<sanitized-project-dir>/` — the project's absolute path with
its drive-colon and path separators replaced by `-` (e.g.
`C--Users-maxco-Documents-agent-armory`); if that transform does not match an
existing directory, use the single entry under `~/.claude/projects/` for this
project.

where `<snapshot>` is a JSON object: `{ ledger: <the current ledger>, task:
"$ARGUMENTS", spec_path, arch_path, plan_path, reader_script, transcript_dir }`
(artifact paths from the ledger's `artifact_index`, or the project defaults under
`docs/`).

The workflow runs in the background and returns a **SEGMENT_REPORT**. Wait for
it. It ran from the ledger's phase through the machine gates to the next owner
gate or completion; it did **not** write any file you own.

## 4. Write the ledger, artifacts, and review records; regenerate STATUS.md (D3, D9, D12) — you are the only writer

From the SEGMENT_REPORT's `ledger_delta` and its top-level fields:

- **Register artifacts (S-4 / D9).** For each entry in `ledger_delta.artifacts`
  (`{role, path}`), compute the artifact's SHA-256 (`node`/`shasum`/`certutil`
  via Bash) and **upsert** it into the ledger `artifact_index` as
  `{role, path, sha256, approved_by_owner, approval_segment}` — preserving the
  prior `approved_by_owner`/`approval_segment` for that path unless the hash
  drifted (a drift invalidates the approval, per step 2 / D9). This is what
  makes the step-2 re-hash loop operate on real entries.
- **Persist review records (RV) — review results are never discarded.** For each
  entry in the report's `review_records` (`{phase, round, verdict, findings[]}`),
  append a human-readable record to
  `${CLAUDE_PROJECT_DIR}/.claude/expert/reviews/<phase>.md` (create the
  directory), one section per round giving the verdict and every finding's
  `classification`, `standard`, `location`, and `premise_evidence`. Register each
  review file in `artifact_index` with `role: "review"` (hashed like any
  artifact).
- **Record escalations (S-4).** If `outcome` is `owner_gate`, append an
  `escalations` entry `{gate_type: <report.gate.type>, segment: <revision>,
  resolved: false}`.
- Apply the rest of the delta: set `phase`, append `gate_history` and
  `amendments`; add `budget.total_tokens` into the per-phase and total budget.
- **Feedback (F-14).** Persist the advanced `feedback_marker` and any signature
  updates from the report's `feedback` dispositions and `feedback_escalation`.
  When a disposition or escalation reports a **recurrence** of an existing
  signature, append it as a new `occurrences[]` entry (with its `plugin_version`)
  on the matched signature record, so a corrected-then-recurred signature is
  detectable from stored data (used by the STATUS predicate below).
  **Shared-machinery** signatures go to
  `${CLAUDE_PLUGIN_DATA}/defect-history.json`; project-scoped signatures go to the
  ledger's `signature_history`. Record a signature `corrected` only after the
  owner approves the fix and it is committed with a bumped `plugin.json` version
  (`fixed_in_version` + `commit`).
- **Bump `revision` by 1** and write the ledger.
- Regenerate `${CLAUDE_PROJECT_DIR}/.claude/expert/STATUS.md` from the ledger:
  current phase; gate history where each review gate shows its verdict **and a
  link to (with a short summary of) its `.claude/expert/reviews/<phase>.md`
  record — never a bare finding count**; **open escalations — only entries whose
  `resolved` is false** (F2); **any open feedback signatures — `signature_history`
  entries and the read-only shared-machinery defect-store entries that are either
  `state: "open"`, or `state: "corrected"` with an `occurrences[]` entry whose
  `plugin_version` is at or above that record's `correction.fixed_in_version`
  (compared as semantic versions — this second case is exactly a
  `failed_correction`, spec A-9(b)); the transient sweep verdicts
  (`systemic_defect` / `failed_correction`) are never stored on the record, so this
  predicate keys on `state`, `occurrences`, and `correction` — so a feedback
  escalation stays visible here, not only when first presented** (F-14); budget;
  the next action. STATUS.md is generated, never hand-edited.

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

When a gate carries `findings` (a review-derived gate), present those findings —
the standard each was judged against and where it is — not merely that the review
did not pass; the full set is in that phase's `.claude/expert/reviews/` record.

**Feedback escalations (F-14).** When the report carries a `feedback_escalation`,
present it to the owner as an owner-owned item alongside whatever gate or
completion the segment produced (it is not one of the six gate types):
- `systemic_defect` — present the attached `diagnosis` (root cause + correction
  draft) so the owner approves or rejects a proposed fix.
- `failed_correction` — a fix that did not hold. Present the **original diagnosis,
  the applied correction, and the new evidence, and dispatch NO remediation.**
  Assemble the content by looking up `feedback_escalation.disposition.signature`
  in the store that holds it — the ledger `signature_history` for project-scoped
  signatures, or `${CLAUDE_PLUGIN_DATA}/defect-history.json` for shared-machinery
  signatures — and reading that record's `description` (the original diagnosis /
  problem) and `correction` (`{change, fixed_in_version, commit}` = the applied
  fix); the new evidence is the most recent entry in the matched signature record's
  `occurrences` array (the recurrence) — `disposition.occurrences` is the recurrence
  count, not a record.
  State plainly that the fix did not hold and no automatic correction is attempted.

**Advancing past the intent gate (S-5).** When the owner **approves** an `intent`
gate, before the next `/expert resume` set the ledger `phase` to `architecture`
and mark the spec `artifact_index` entry `approved_by_owner: true` with
`approval_segment` = the current revision; the next segment's snapshot then
carries `phase: architecture` and the workflow proceeds to design. If the owner
**requests changes**, keep `phase: spec` so the next segment re-runs the spec
against the feedback. This transition is the command's — the workflow returns the
intent gate without claiming it. Mark the intent `escalations` entry
`resolved: true` whenever the owner answers the intent gate — on **approval** and
on **request changes** — and, on approval, mark **all** prior unresolved `intent`
`escalations` entries for this lifecycle `resolved: true` (a multi-round intent
flow accumulates one per spec PASS), before the next ledger write (F2).

When the owner answers any other gate, mark that gate's `escalations` entry
`resolved: true` (F2) and re-invoke `/expert resume` to continue the next segment
from the ledger.
