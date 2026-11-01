---
id: EDT-0021
title: Machine-applicable diagnoses are never applied automatically; every diagnosis stops for the owner
state: open
severity: serious
component: workflows/expert-lifecycle.js failure routing (F-13 router)
found_in_version: 0.5.0
found_by: source reading, 2026-11-01, Claude app session, main @ 67e81aa
fixed_in: null
---

# EDT-0021 — Machine-applicable diagnoses are never applied automatically; every diagnosis stops for the owner

## What happens

`diagnose()` (`expert-lifecycle.js:554`) returns a diagnosis whose `classification` is
`machine_applicable` or `owner_owned`. The workflow reads `classification` in exactly one
place, `:1017`, where it selects between `spec_traceable` and `non_convergence` for a
ground-truth failure. Both are owner gates. Every other `diagnose()` call attaches the
diagnosis to an owner-gate return without reading its classification.

The only automatic remediation in the workflow is the amend-plan path for an implementer
`PREMISE-FALSE` / `BLAST-RADIUS-EXCEEDS-PLAN` stop, which runs on the stop category regardless
of the diagnosis classification.

## Impact

The spec and architecture require the opposite:

- Spec F-13 (`docs/specs/spec-expert-dev-tools.md:223-224`): "machine-applicable ones route
  automatically through the normal amend → review path".
- Spec D-10 (`:350-353`): "machine-applicable corrections apply automatically through
  amend → review".
- Architecture router (`docs/arch/architecture-expert-dev-tools.md:124-130`):
  "`machine_applicable` routes into the standard amend → review path automatically (the
  correction draft becomes the remediation input)".

As built, the diagnostic layer diagnoses and the owner applies. D-10's stated rationale — the
owner's standing response to problems is "go figure it out" — is the behavior the code does
not have.

## Relationship to other entries

EDT-0006 and EDT-0007 are the owner-reported symptoms (stops that ask permission for an answer
the system already has). This entry is the spec-vs-code divergence beneath part of them; it is
recorded separately because it is located in the router, not the gate text.

## Evidence

- `workflows/expert-lifecycle.js:554-565` — `diagnose()`
- `workflows/expert-lifecycle.js:1017` — the sole read of `classification`
- `docs/specs/spec-expert-dev-tools.md:223-224`, `:350-353`
- `docs/arch/architecture-expert-dev-tools.md:124-130`
