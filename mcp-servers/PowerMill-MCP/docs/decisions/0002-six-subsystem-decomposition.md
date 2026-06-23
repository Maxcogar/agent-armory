# ADR-0002: Decompose the program into six subsystems

- **Status:** Accepted
- **Date:** 2026-06-22

## Context
The goal — a non-expert gets full-breadth CNC programming because the system
carries the expertise — spans capability, data, judgment, learning, verification,
and lifecycle governance. Trying to specify or build it as one undifferentiated
thing produces exactly the "patches on patches" outcome the owner wants to avoid.
A single spec for everything also can't be precise (an assembly drawing is not a
substitute for part drawings).

## Decision
Treat the work as a **program of six subsystems**, each with its own
Define→Design→Build cycle, built in dependency order:

- **A. Capability core** — typed, safe MCP coverage of the in-scope machining space.
- **B. Shop knowledge base** — curated, authoritative data, Fusion-synced.
- **C. Judgment layer** — the machining-expertise skill system.
- **D. Learning loop** — improvement from verified outcomes.
- **E. Verification/feedback** — the ground-truth signal D depends on.
- **F. Lifecycle/governance** — how the system is extended, tested, versioned, promoted.

Dependencies: A+B+E foundation; C needs A+B; D needs E+C; F wraps all.

## Consequences
- Each subsystem stays small enough to specify precisely and test in isolation.
- A program-level architecture (Design phase) must still define the interfaces
  between subsystems so they compose, not just exist.
- More upfront documents (one spec per subsystem) — accepted, because the owner
  has prioritized correctness and longevity over speed.
