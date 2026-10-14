---
id: EDT-0009
title: Claims about the plugin's own behavior asserted without reading its source or manifest
state: open
severity: moderate
component: expert-standard verification discipline, applied to tooling
found_in_version: 0.4.1
found_by: run wf_edb6f323-e2c against Maxcogar/NOVA, 2026-08-27, plugin 0.4.1
fixed_in: null
---

# EDT-0009 — Claims about the plugin's own behavior asserted without reading its source or manifest

## What happens

An agent asserts what a plugin or tool does, does not do, or that the owner's workflow is
broken, without verifying against the tool's actual source or manifest. The observation
ladder added in 0.4.0 is applied to code but not to the agent's own tooling surface.

## Evidence

Owner turns: `016d83ee:294` ("no its at 0.4.1 youre looking at the wrong thing"),
`016d83ee:382` ("are you actually using the plugin correctly???"), `016d83ee:450` ("why are
you saying the workflow is borken??? it works. ive used it. what EXACTLY is not working???
highly likely youre still making assumptions about it"), `016d83ee:1052`.

Recorded as feedback signatures 1.3 and 2.4, `systemic_defect` x3 each.
