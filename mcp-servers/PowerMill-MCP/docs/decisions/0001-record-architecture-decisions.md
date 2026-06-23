# ADR-0001: Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-06-22

## Context
This is a long-lived, multi-session program. Decisions made now (decomposition,
platform path, the learning model) will shape work done in sessions that have no
access to this conversation. Without a durable record of *why*, future sessions
re-litigate settled decisions, often differently.

## Decision
Record every significant decision as an Architecture Decision Record (Nygard
format) in `docs/decisions/`, numbered `NNNN-title.md`. Each ADR has: Title,
Status (Proposed / Accepted / Superseded), Context, Decision, Consequences. ADRs
are **immutable** — a reversed decision is captured by a new ADR that supersedes
the old one; the old one is marked Superseded but never deleted.

## Consequences
- The history of *why* is preserved even as decisions change.
- A small ongoing cost: significant decisions must be written down, not just made.
- ADRs are the durable form of the decision-justification the lifecycle phases
  already require.

---

### Template for new ADRs

```
# ADR-NNNN: <short title>

- Status: Proposed | Accepted | Superseded by ADR-XXXX
- Date: YYYY-MM-DD

## Context
<the forces at play: the problem, constraints, what makes this non-trivial>

## Decision
<what we decided, stated plainly>

## Consequences
<what becomes easier, what becomes harder, what we accept>
```
