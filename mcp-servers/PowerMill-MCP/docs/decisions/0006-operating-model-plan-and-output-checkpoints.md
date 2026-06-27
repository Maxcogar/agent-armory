# ADR-0006: Operating model — plan-approval and verified-output approval checkpoints

- **Status:** Accepted
- **Date:** 2026-06-27

## Context
The owner is non-expert and the consequences of error are physical (metal, tools,
the machine). Resolving OQ-3: the agent should run autonomously where the owner
can't meaningfully supervise the internals, but must stop at the points the owner
*can* judge and where mistakes get expensive.

## Decision
Two default checkpoints, autonomous in between:

1. **Plan approval (before building).** The agent presents a machining plan and
   waits for approval. The plan is an **output contract** (R-PLAN-1): approach
   summary, setups/orientations (incl. angle-head tilt + spindle-orient clocking),
   an ordered operation scaffold with per-op what/where, strategy-and-why,
   tool-and-why, orientation, and stock left; an explicit areas-of-concern/risk
   section; and assumptions + decisions needed. Enough to judge the *approach*
   without knowing PowerMill.
2. **Verified-output approval (after programming + verification).** Verification
   (gouge/holder/collision) is a hard gate that must pass first; then the agent
   presents the verified result and holds the NC as not-ready-to-run until the
   owner approves. First physical cut is always the owner's call.

Between the two, the agent works on its own (create toolpaths, dial parameters,
run checks, retry failures) and returns only when stuck or a check won't pass.
Strictness is adjustable per job and may loosen as trust builds; this conservative
model is the default.

## Consequences
- The owner steers at the plan level (their main lever) and gates physical risk at
  output, without having to review toolpath internals.
- Requires the judgment layer (C) to produce a rich, plain-language plan artifact
  and the capability layer (A) to enforce the verification-before-ready gate.
- The "areas of concern" element is a hard requirement, not a nicety — it is what
  makes the system supervisable.
