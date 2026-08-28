---
id: EDT-0002
title: CORRECTION_FAILED_TEXT is read in its temporal dead zone, so gate escalation throws
state: open
severity: critical
component: workflows/expert-lifecycle.js gate escalation
found_in_version: 0.4.1
found_by: run wf_edb6f323-e2c against Maxcogar/NOVA, 2026-08-27, plugin 0.4.1; independently reproduced in skill eval iteration-1, 2026-08-28 (workspace outside the repo)
fixed_in: null
---

# EDT-0002 — CORRECTION_FAILED_TEXT is read in its temporal dead zone, so gate escalation throws

## What happens

`const CORRECTION_FAILED_TEXT` is declared at `expert-lifecycle.js:1046`. The hoisted
`gateEscalation()` (`:1055`) reads it at `:1058`. The main flow calls `gateEscalation()` at
`:716` — 330 lines before the declaration is evaluated — so the read hits the temporal dead
zone and throws `ReferenceError: Cannot access 'CORRECTION_FAILED_TEXT' before initialization`.

The throw happens before the diagnostician is dispatched, so a failed run produces no root
cause at all.

## Impact

Every `CORRECTION_FAILED` verdict and every `NON_CONVERGENCE` from all three document gates
routes through `gateEscalation()`. The lifecycle therefore completes only when an artifact
passes review cleanly; any correction failure crashes the run instead of escalating it.

## Evidence

- `workflows/expert-lifecycle.js:1046` — declaration site
- `workflows/expert-lifecycle.js:1055-1058` — hoisted function, guarded by `gate.verdict === 'CORRECTION_FAILED'`
- `workflows/expert-lifecycle.js:716` — `await gateEscalation(gate, 'Spec', 'spec', specPath, ledger)` in the main flow
- Mechanism reproduced by execution: a hoisted function reading a later top-level `const` throws `ReferenceError` under Node

## Found twice, independently

Diagnosed by the plugin's own diagnostician during a live NOVA run, and rediscovered from a
different angle by a baseline eval agent a day later. The diagnostic machinery found this
correctly in the field.
