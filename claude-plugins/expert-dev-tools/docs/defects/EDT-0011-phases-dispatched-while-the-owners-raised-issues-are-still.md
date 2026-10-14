---
id: EDT-0011
title: Phases dispatched while the owner's raised issues are still open
state: open
severity: moderate
component: expert-lifecycle orchestrator intake gate
found_in_version: 0.4.1
found_by: run wf_edb6f323-e2c against Maxcogar/NOVA, 2026-08-27, plugin 0.4.1
fixed_in: null
---

# EDT-0011 — Phases dispatched while the owner's raised issues are still open

## What happens

The orchestrator dispatches on inferred readiness rather than an explicit owner-confirmed
intake gate, launching segments while the owner's questions are unanswered.

## Evidence

Owner turns: `016d83ee:880` ("WOAH WOAH HOLD THE FUCK UP!!!! WAIT!!!!" immediately after a
run launched), `016d83ee:917` ("we werent done with the open issues. i haveno interest in
rushing to feel busy"), `016d83ee:1136` ("BUT TALK TO ME ABOUT IT FIRST BEFORE IMMEDIATLY
ACTING!!! I NEED TO ENSURE WE UNDERSTAND THIS THE SAME WAY BEFORE **ANY** CHANGES HAPPEN").

Recorded as feedback signature 2.3, `systemic_defect` x4 — the highest count in the sweep.
