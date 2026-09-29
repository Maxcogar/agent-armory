# Not applied: partial round-10 fix work, kept as a record only

This directory holds the partial output of the agent that was applying the
round-10 findings (`2026-09-29-architecture-review-round10.md`) when Max Cogar
stopped the work on 2026-09-29. **None of it is applied to
`docs/architecture-phase-a.md`, and none of it is reviewed.**

## Why it was stopped

The coordinator's instruction to that agent carried two errors that Max Cogar
named:

1. **It applied findings because a rule says so.** The instruction was to apply
   all six findings "because the project's standing rule is to apply every
   finding that holds up". Applying findings by rule was decided to be wrong.
   Each finding is judged on its merits against the design and its sources.
2. **It invoked a rule that does not exist.** The instruction carried "remove
   before you add", "the least text" and "add no mechanism". Max Cogar raised
   that idea about the workflow; it is not a design rule. It gives no
   permission to narrow a claim, state a limitation, or build a fallback in
   place of the correct design.

## What is here

- `architecture-edit-NOT-APPLIED.patch`: the agent's uncommitted edit to the
  architecture (133 insertions, 44 deletions). The architecture was put back to
  its round-10 text, `053f35c`.
- The agent's prototypes, tests, cases and `results/`, exactly as it left them.

Treat all of it as unverified input, never as a settled design.
