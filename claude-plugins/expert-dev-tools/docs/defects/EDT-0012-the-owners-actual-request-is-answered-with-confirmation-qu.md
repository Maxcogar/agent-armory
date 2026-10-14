---
id: EDT-0012
title: The owner's actual request is answered with confirmation questions instead of the thing asked for
state: open
severity: moderate
component: owner-gate response construction
found_in_version: 0.4.1
found_by: run wf_edb6f323-e2c against Maxcogar/NOVA, 2026-08-27, plugin 0.4.1; also observed in this session
fixed_in: null
---

# EDT-0012 — The owner's actual request is answered with confirmation questions instead of the thing asked for

## What happens

Asked for a walkthrough, the agent emits a confirmation checklist and status framing rather
than engaging every point the owner raised.

## Evidence

Owner turns: `016d83ee:797` ("i dont know what that means i am asking you for a second time
to help me go through what all youre talking about and ofgure this out"), `016d83ee:304`
("already i have absolutely no idea what youre asking").

Recorded as feedback signature 2.7, `systemic_defect` x2. The owner names the recurrence
himself. Reproduced in this session repeatedly, in conversation rather than through the
lifecycle.
