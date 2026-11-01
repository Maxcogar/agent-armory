---
id: EDT-0018
title: The feedback sweep's read position never advances, so every sweep re-reads the whole transcript history
state: open
severity: serious
component: workflows/expert-lifecycle.js feedbackSweep return path + commands/expert.md step 4
found_in_version: 0.5.0
found_by: source reading, 2026-11-01, Claude app session, main @ 67e81aa
fixed_in: null
---

# EDT-0018 — The feedback sweep's read position never advances, so every sweep re-reads the whole transcript history

## What happens

`scripts/extract-owner-turns.mjs` returns `{ turns, marker }`, where `marker` is the advanced
read position. That return goes only to the diagnostician's own tool output. Nothing carries
the advanced marker back to the command:

- `FEEDBACK_SCHEMA` (`expert-lifecycle.js:300`) has one property, `feedback_dispositions`. No
  marker field.
- `feedbackSweep()` (`:567`) returns only `out.feedback_dispositions`.
- `report()` (`:578`) returns `ledger_delta`, `review_records`, `feedback`,
  `feedback_escalation`; `delta` (`:628`) holds `phase`, `artifacts`, `gate_history`,
  `amendments`, `budget`. No marker.
- `feedback_marker` appears in the workflow once, inside the sweep prompt text (`:571`).

`commands/expert.md:159` instructs the command to "Persist the advanced `feedback_marker`" from
the report. The report does not contain it. A ledger initialized at
`{session_file: null, line: 0}` (`commands/expert.md` step 2) therefore stays there.

## Impact

Spec F-14 requires the sweep to read "from the last processed position forward"
(`docs/specs/spec-expert-dev-tools.md:238`); architecture D14 specifies "a persisted
`{session_file, line}` marker" (`docs/arch/architecture-expert-dev-tools.md:502`). In the code,
every segment's sweep reads the project's full transcript history from the beginning:

- Owner turns already processed are read and counted again on every segment. Occurrence count
  is what promotes a signature to `systemic_defect`. The only guard against recount is the
  command's dedup rule, keyed on `(project, session_file)` (`commands/expert.md:162`), and the
  sweep does not return `session_file` (EDT-0020).
- The text handed to the diagnostician grows with every session the project accumulates, with
  no cap on turn count in the reader.

## Evidence

- `workflows/expert-lifecycle.js:300` — `FEEDBACK_SCHEMA`, single property `feedback_dispositions`
- `workflows/expert-lifecycle.js:567-576` — `feedbackSweep()` returns dispositions only
- `workflows/expert-lifecycle.js:578`, `:628` — `report()` and `delta` carry no marker
- `scripts/extract-owner-turns.mjs:91-94` — the reader does compute and return the advanced marker
- `commands/expert.md:159` — instruction to persist a value the report does not carry
