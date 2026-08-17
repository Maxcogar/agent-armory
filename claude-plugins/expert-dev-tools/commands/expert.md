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

## 0. Intake classification — questions are not work orders

Before initializing or advancing anything, classify the owner's turn: **INTERROGATIVE**
(asks why/what/how/whether, explores an option, requests status or explanation) or
**DIRECTIVE** (explicitly instructs work). An interrogative gets an answer — from
already-gathered evidence, read-only tools permitted — and initializes **no** segment,
edits **no** artifact, dispatches **no** phase. Only a directive starts or resumes the
lifecycle, and only for the work it names. If classification is ambiguous, ask one
clarifying question before touching anything.

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
(artifact paths from the ledger's `artifact_index` only — omit any path the
`artifact_index` does not carry). **Do not supply a project default under `docs/`.**
The artifact's location has one source of truth: the path the authoring agent
returns, which the workflow consumes and which outranks anything passed in here.
A default supplied at this point always wins on a fresh run, because the
`artifact_index` is empty then — which is exactly how every review dispatch in
the A-3 run came to cite a path that did not exist.

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
  signature, **upsert** it on the matched signature record, keyed on
  `(project, session_file)`: append a new `occurrences[]` entry (with its
  `plugin_version`) **only when no existing occurrence on that record shares both
  values**; otherwise update that existing entry's `date` and `plugin_version` in
  place. Both key fields are already required on every occurrence by
  `ledger.schema.json`, so no schema change is involved. Re-reading the same
  transcript is not a new occurrence — one diagnostician reported four
  occurrences where another correctly deduped identical input to two, and the
  occurrence count is what drives the repeat-complaint signal. A
  `feedback_marker` reset re-reads history that is already recorded; it **must
  not** double-count it. This is what makes a corrected-then-recurred signature
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
  `failed_correction`, spec A-9(b)); **or `state: "corrected"` with an
  `occurrences[]` entry whose `plugin_version` is *below* that record's
  `correction.fixed_in_version` — that is a `stale_deployment` (D15), and it is
  surfaced as an open item reading "your plugin is behind; update it"**. The
  stale branch is a separate predicate because a stale record's occurrences sit
  below `fixed_in_version` and so match neither of the other two branches, which
  is why the verdict was computed and then went nowhere; the transient sweep verdicts
  (`systemic_defect` / `failed_correction`) are never stored on the record, so this
  predicate keys on `state`, `occurrences`, and `correction` — so a feedback
  escalation stays visible here, not only when first presented** (F-14); budget;
  the next action. STATUS.md is generated, never hand-edited.

## 4b. Gate-discussion authorization rule — governs step 5 and all conversation while any `escalations` entry is unresolved

- While an owner gate is open, this command tier's write authority is **exactly and
  exclusively** the ledger, `.claude/expert/reviews/*`, and STATUS.md. No edits to project
  code, specs, architectures, plans, tests, or any other artifact — regardless of what the
  discussion surfaces.
- An owner reply at a gate that asks a question, requests explanation, or explores options
  is **neither approval nor a change request**: answer from already-gathered evidence
  (read-only tools permitted), change no artifact, dispatch no phase, mark no escalation
  resolved, and re-present the gate afterward with its options unchanged. Ambiguous replies
  are treated as questions, not decisions.
- Only an explicit decision utterance (approve / request changes with the changes stated /
  a named gate option) exits the gate. Changes it authorizes are executed by re-invoking
  `/expert resume` so the reviewed workflow phases perform them — never inline here.
- Catching yourself about to edit outside the three owned files while a gate is open is a
  **stop condition**: state the proposed change and ask.
- **Checkpoint on approval:** when the owner approves a phase artifact and its sha256 is
  recorded, commit that artifact in the target project's repo (or, where committing is not
  permitted, record the full file inventory with hashes as the segment baseline) before the
  next `/expert resume` — an approved artifact left uncommitted becomes false scope-check
  residue in the next phase.

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

**Feedback dispositions (F-14).** Present the report's plain `feedback` array —
every disposition the sweep returned, with its signature, occurrence count and
verdict — not only the single `feedback_escalation`. A `course_correction` never
builds an escalation, so presenting escalations alone hides everything the sweep
found that did not rise to one.

**Feedback escalations (F-14).** When the report carries a `feedback_escalation`,
present it to the owner as an owner-owned item alongside whatever gate or
completion the segment produced (it is not one of the six gate types):
- `systemic_defect` — present the attached `diagnosis` (root cause + correction
  draft) so the owner approves or rejects a proposed fix.
- `stale_deployment` — the fix for this signature exists, but the running plugin
  predates it. State plainly that **the plugin is behind and needs updating**,
  naming the signature's `correction.fixed_in_version` and the `plugin_version`
  on the recurring occurrence. Dispatch **no** remediation: the machine does not
  modify its own deployment.
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
