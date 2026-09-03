---
id: EDT-0007
title: Most owner gates ask permission to retry or decline to state a recommendation
state: open
severity: serious
component: workflows/expert-lifecycle.js owner-gate policy
found_in_version: 0.4.1
found_by: this session, 2026-08-28, census of every gate return in the workflow
fixed_in: null
---

# EDT-0007 — Most owner gates ask permission to retry or decline to state a recommendation

## What happens

The workflow has 29 owner-gate returns. Only three are unambiguously the owner's:
`intent`, `core_approval`, `risk_override`.

- **10 of 29** recommend a re-run in their own recommendation text — the system diagnosed the
  problem, decided the answer, wrote the answer down, and then stopped to ask permission to
  do it. Verbatim examples: "re-run; an under-covered verifier return is an infrastructure or
  dispatch fault", "re-run the round", "re-run closeout", "re-run; the hash record is what
  keeps later scope checks honest".
- **6 of 29** have `"review the diagnosis"` as their ENTIRE recommendation. The system ran a
  diagnostician, got a root cause, and its advice to the owner is to read what it already
  read. These pass the A-6 acceptance criterion ("escalations contain what happened /
  options / recommendation") because the field is non-empty — a check on presence, not
  content.
- `control_fault` is 10 of the 29, and 8 of those 10 say re-run. That gate type was added to
  mean "a mechanical control could not run"; by its own definition the owner has nothing to
  contribute.

## Impact

This is the owner's most-reported complaint. Every unnecessary gate is also a forced
workflow restart, and under EDT-0001 a restart in a document phase destroys that artifact.

## Census

| type | count |
|---|---|
| spec_traceable | 13 |
| control_fault | 10 |
| non_convergence | 3 |
| intent | 1 |
| core_approval | 1 |
| risk_override | 1 |
