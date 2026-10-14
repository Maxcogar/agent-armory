---
id: EDT-0004
title: A pattern hit that is not a class member has no honest disposition
state: open
severity: serious
component: PHASE_SCHEMA class_sweep contract + expert-correct/SKILL.md
found_in_version: 0.4.1
found_by: run wf_edb6f323-e2c against Maxcogar/NOVA, 2026-08-27, plugin 0.4.1
fixed_in: null
---

# EDT-0004 — A pattern hit that is not a class member has no honest disposition

## What happens

A class sweep declares a regex `pattern` and a `found` list. The class is usually semantic,
so the operationalizing regex necessarily over-matches. The corrector's only outlets for a
`found` entry it does not edit are `open_sites` designations, which the schema comment
(`expert-lifecycle.js:161-163`) and `skills/expert-correct/SKILL.md:100-103` both define as
"the escalation" or "an explicitly-open item" — both assert an UNFIXED DEFECT.

There is no way to report "the pattern matched here and this text is correct." So a
corrector acting honestly omits false-positive hits from `found`, and that omission is
byte-for-byte the `sweep_underreported` signature.

## Impact

The contract forces a corrector to choose between a false confession and an omission that
fails the gate. Verified against a real artifact: of 19 matches of one finding's pattern,
two matched verbatim quoted specification text and six matched required traceability
content whose removal would reintroduce a prior Serious finding.

## Evidence

- `workflows/expert-lifecycle.js:161-163` — schema comment defining `open_sites`
- `skills/expert-correct/SKILL.md:100-103` — same definition in the skill contract
- Diagnosis 3 of the NOVA run, recorded verbatim in PR #66
