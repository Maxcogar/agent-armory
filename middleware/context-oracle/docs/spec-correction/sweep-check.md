# Spec correction — independent re-execution of each part's class sweeps

Each correction record's sweep patterns are re-run by an agent that did not perform that
correction, over a frozen snapshot of the artifact as the record left it (the expert-correct
return contract). Verdict PASS requires every pattern to reproduce its `found` list and every
found site to be changed or designated.

## Part a — snapshot at commit `0473a3e` — PASS (2026-10-14)

- Checked: 24 entry sweeps with their own pattern (E-59, E-62, E-70, E-77 and E-84's OL-11 part
  point to another entry's sweep), the OL-C12/OL-C11 sweep, and the pattern in record-a's
  escalation item 1. Patterns run with `rg -n -e '<pattern>'`, no flags (the record states none).
- Every pattern returned exactly the record's `found` lines; no site is undesignated.
- At least one changed site per sweep was read in context; each carries the correction the
  record states.
- One loose designation: E-64, line 703 is in `open_sites` with a reason (FR-K2's `[HERZIG]` is
  the one use verification reconciliation item 3 keeps) but without the label "not-in-class".
  The reason holds (lines 702–705 cite `[HERZIG]` only for FR-K2's tangled-change cap), so it
  was not counted as undesignated.
