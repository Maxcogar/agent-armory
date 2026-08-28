---
id: EDT-0008
title: Content written into the first plausible file without reading the target or the structure
state: open
severity: moderate
component: write-destination selection during correction application
found_in_version: 0.4.1
found_by: run wf_edb6f323-e2c against Maxcogar/NOVA, 2026-08-27, plugin 0.4.1
fixed_in: null
---

# EDT-0008 — Content written into the first plausible file without reading the target or the structure

## What happens

Destination chosen by name match, with no read of the target file's existing contents or of
the surrounding directory structure.

## Evidence

Owner turns: `016d83ee:1757` ("well that isnt where i wanted it. i wanted it in the goddamn
plugin where it will actually be seen"), `016d83ee:1795` ("IS IT THOUGH?????? WHAT ELSE IS IN
THERE???? YOU CANT KEEP DUMPING SHIT INTO THE FIORST THING YOU FUCKING SEE"),
`016d83ee:1851` ("I DONT KNOW THE STRUCTURE!!! ... MAKE A FUCKING FILE THEN IF NOTHING FITS!!!").

Recorded as feedback signature 2.6, `systemic_defect` x3.
