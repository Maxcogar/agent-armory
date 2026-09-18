---
id: EDT-0006
title: A determinable correction failure escalates to the owner instead of re-dispatching the correction
state: open
severity: serious
component: workflows/expert-lifecycle.js correction gate
found_in_version: 0.4.1
found_by: run wf_edb6f323-e2c against Maxcogar/NOVA, 2026-08-27, plugin 0.4.1
fixed_in: null
---

# EDT-0006 — A determinable correction failure escalates to the owner instead of re-dispatching the correction

## What happens

When a correction fails, the loop stops and asks the owner. The implement phase already
routes the analogous case back for re-work; the correction gate is the outlier.

## Impact

The owner has stated the required behavior directly: "there is literally zero reason to stop
and ask me anything. they jsut didnt make the corrections right, so obviously the only thing
ill ever say to that is to make the fucking correction right. that is the ONLY acceptable
outcome."

Every one of these stops also costs an artifact under EDT-0001, because the resume that
follows re-authors the document.

## Evidence

- Owner turns `016d83ee:1551` ("escelate to me? for what?") and `016d83ee:1588`
- Recorded as feedback signature 2.5, `systemic_defect` x2, in the NOVA run
