---
id: EDT-0001
title: Resuming a document phase re-authors its artifact from scratch
state: open
severity: critical
component: workflows/expert-lifecycle.js document-phase routing
found_in_version: 0.4.1
found_by: this session, 2026-08-28, reading source after an agent reported the lifecycle could not be resumed
fixed_in: null
---

# EDT-0001 — Resuming a document phase re-authors its artifact from scratch

## What happens

`let cursor = ledger.phase || 'intake'` (`expert-lifecycle.js:677`) routes to a phase block.
Each document-phase block dispatches its authoring agent as the FIRST statement, with no
check for an already-registered artifact:

- spec `:689-693` — "Write the specification for this task."
- architecture `:730-732` — "Produce the architecture from the approved spec"
- plan `:754-756` — "Produce the implementation plan"

Every gate return inside those phases sets `delta.phase` back to that same phase. So any
escalation during spec, architecture or plan leaves the cursor there, and `/expert resume`
re-enters at the top of the block — the author, not the review gate. The reviewed artifact
on disk is overwritten by a fresh authoring pass.

`artifact_index` is read for implementation artifacts (`:622`), ground-truth preconditions
(`:1096`) and hash checks (`:1118`). It is never consulted to decide whether a document
phase still needs authoring.

## Impact

Every owner gate raised in a document phase costs that artifact's entire authoring and
review history. This compounds with the gate count (see EDT-0007): the more often the
lifecycle stops, the more finished work a resume destroys. It also makes the review loop's
output unstable — rounds of corrections are discarded by the resume that follows them.

Observed live: the NOVA ledger sits at `phase: spec`, `revision: 14`, with one registered
spec artifact (`docs/specs/spec-mcp-integration-layer.md`) and one open gate. Resuming it
would re-author a spec that has already been through review rounds.

## Evidence

- `workflows/expert-lifecycle.js:677` — `let cursor = ledger.phase || 'intake'`
- `workflows/expert-lifecycle.js:689` — `if (cursor === 'spec') {` immediately followed by the authoring dispatch at `:691-693`
- `workflows/expert-lifecycle.js:730`, `:754` — architecture and plan blocks, same shape
- `workflows/expert-lifecycle.js:697` — a spec-phase gate return setting `delta.phase = 'spec'`
- No occurrence of `artifact_index` guards a document-phase authoring dispatch

## Note

An agent working in another session reported that the workflow could not be resumed without
rewriting the spec. That report was correct and was initially doubted here.
