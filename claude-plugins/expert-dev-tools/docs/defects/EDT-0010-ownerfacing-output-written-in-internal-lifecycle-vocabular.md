---
id: EDT-0010
title: Owner-facing output written in internal lifecycle vocabulary
state: open
severity: moderate
component: orchestrator owner-gate presentation
found_in_version: 0.4.1
found_by: run wf_edb6f323-e2c against Maxcogar/NOVA, 2026-08-27, plugin 0.4.1
fixed_in: null
---

# EDT-0010 — Owner-facing output written in internal lifecycle vocabulary

## What happens

Gate and confirmation messages emit ledger and phase jargon (retained set, findings, intent
gate) without defining terms or stating the decision in the owner's own language. The owner
has to ask more than once for a plain walkthrough.

## Evidence

Owner turns: `016d83ee:194` ("i have absolutely no idea what youre asking... i dont know what
you mean by self healing"), `016d83ee:797` ("i am asking you for a second time to help me go
through what all youre talking about"), `016d83ee:957` ("okay hold up im getting confused by
all this").

Recorded as feedback signature 1.4, `systemic_defect` x3.
