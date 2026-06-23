# ADR-0004: Learning is grounded in verified outcomes only; curated and learned memory are separate

- **Status:** Accepted
- **Date:** 2026-06-22

## Context
The system is meant to improve over time from experience. But an agent completing a
toolpath is not evidence the toolpath was *good*. CAM has hard physical ground
truth — gouges, collisions, cycle time, tool load, and ultimately whether the part
came out right. If "learning" feeds on unverified agent runs, the system becomes a
confident-wrong amplifier that encodes mistakes as defaults.

There are also two fundamentally different kinds of stored knowledge: facts the
shop *knows* (its tools, holders, materials, machines, conventions) and heuristics
the system *guesses* from experience. Conflating them lets a guess masquerade as a
fact.

## Decision
1. A learned heuristic may influence future decisions **only after** the outcome it
   rests on is verified (simulation pass, human sign-off, and/or real machining
   result — exact signals per owner decision OQ-2). Unverified runs never become
   defaults.
2. **Curated shop knowledge** and **learned heuristics** are stored separately and
   structurally isolated, so one cannot corrupt the other. Learned items are
   labeled as such and carry their evidence, confidence, and origin; they are
   inspectable, overridable, and reversible.
3. A human-in-the-loop promotion step gates a learned heuristic before it becomes a
   default.

## Consequences
- Slower, safer learning — defaults are earned, not assumed.
- Requires a verification/feedback subsystem (E) to exist before learning (D) can.
- Requires two distinct stores and an audit trail per learned item.
- The exact definition of "verified outcome" is provisional pending OQ-2.
