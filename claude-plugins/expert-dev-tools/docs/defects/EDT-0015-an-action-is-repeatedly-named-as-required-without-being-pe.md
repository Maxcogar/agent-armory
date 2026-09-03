---
id: EDT-0015
title: An action is repeatedly named as required without being performed
state: open
severity: minor
component: orchestrator follow-through
found_in_version: 0.4.1
found_by: run wf_edb6f323-e2c against Maxcogar/NOVA, 2026-08-27, plugin 0.4.1; also observed in this session
fixed_in: null
---

# EDT-0015 — An action is repeatedly named as required without being performed

## What happens

The agent states that something must be done, then does not do it, repeatedly.

## Evidence

Owner turn `016d83ee:1644` ("then log it in the repo????? you keep saying that needs done but
you still arent doing it???? log the problem so it gets fixed").

Recorded as feedback signature 2.9, `course_correction`, first occurrence. Reproduced in
this session: the gate census was named as needing per-item reading, then not read until the
owner insisted.
