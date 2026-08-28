---
id: EDT-0003
title: sweepDiscrepancy compares location strings lexically, so honest sweeps fail and narrow ones pass
state: open
severity: serious
component: workflows/expert-lifecycle.js sweepDiscrepancy
found_in_version: 0.4.1
found_by: run wf_edb6f323-e2c against Maxcogar/NOVA, 2026-08-27, plugin 0.4.1
fixed_in: null
---

# EDT-0003 — sweepDiscrepancy compares location strings lexically, so honest sweeps fail and narrow ones pass

## What happens

`sweepDiscrepancy` (`expert-lifecycle.js:433-435`) does exact-string set difference:
`const foundSet = new Set(found); const missed = reHits.filter(h => !foundSet.has(h))`.

The two sides are produced by two different agents from two different prompts, under a
grammar that admits multiple renderings of one site. `LOCATION_RE` (`:101`) accepts both
`path:19` and `path:19-20`, and `parseLocation` (`:366-373`) normalizes `path:19` to
`{start:19, end:19}` — the file's own code proves the two strings denote one site. A
corrector reporting the reviewer's range grammar (`:19-20`) is scored against a verifier
reporting `:19` and `:20`, producing spurious `missed` entries from a complete sweep.

`detectCorrectionFailure` in the same file compares the same location strings structurally
via `parseLocation` (`:396-402`). Only `sweepDiscrepancy` compares them lexically. That
inconsistency is the defect.

## Impact

Gates every correction round of all three document gates in every 0.4.1 run. It fails
honest, complete corrections on report shape rather than sweep completeness — and it
inverts: because `missed` is the only discriminator, a corrector that narrows its `pattern`
to its own fix sites passes cleanly. That is precisely the patching failure this control
was built to catch.

## Evidence

- `workflows/expert-lifecycle.js:433-435` — lexical set difference
- `workflows/expert-lifecycle.js:101` — `LOCATION_RE` admits both renderings
- `workflows/expert-lifecycle.js:366-373` — `parseLocation` normalizes them to one site
- `workflows/expert-lifecycle.js:396-402` — `detectCorrectionFailure` compares structurally
- `workflows/expert-lifecycle.js:726`, `:758`, `:782` — the three gates it guards
