# PowerMill MCP — Roadmap (living source of truth)

> This is the single source of truth for program state. Keep it current: update it
> at every phase transition and session boundary. Phase tags follow the
> project-lifecycle skill (Define → Design → Build → Verify → Operate → Maintain).
> Last updated: 2026-06-27.

## Where the program is right now

**Define complete; gate to Design cleared (2026-06-27).** The program requirements
are recorded ([spec](specs/2026-06-22-powermill-program-requirements.md)) and the
three blocking owner questions — OQ-1 (shop profile), OQ-2 (learning policy), OQ-3
(plan/checkpoints) — are answered and folded in (see ADR-0005, ADR-0006). The
foundation (roadmap, conventions, decision log, handoffs) is in place. Next up: the
**Design** phase (program architecture). OQ-4/5 remain open but are scoped to
subsystem B and posting, not program Design.

## Subsystem status

| | Subsystem | Phase | Status | Depends on |
|---|---|---|---|---|
| A | Capability core | Define | Seed server exists (v0.3.0, 46 tools); gap documented in coverage audit; full requirements pending its own Define | — |
| B | Shop knowledge base (Fusion sync) | Not started | — | A |
| C | Judgment layer (skills) | Not started | — | A, B |
| D | Learning loop | Not started | — | C, E |
| E | Verification / feedback | Not started | Partial gouge/holder checks exist in A | A |
| F | Lifecycle / governance | Define | Bootstrapped: this roadmap, conventions, ADRs, handoffs | — |

## Phase log (program level)

- **Define — in progress (2026-06-22).** Program requirements drafted; foundation
  scaffolded.
- **Define — complete (2026-06-27).** OQ-1/2/3 answered and recorded (shop profile
  §3.1, learning policy R-LEARN-3, checkpoints §6.12; ADR-0005/0006). Gate to
  Design cleared.

## Immediate next actions

1. Begin the **Design** phase — program architecture: the interfaces between the six
   subsystems, the data model, the MCP↔skill↔memory contracts, and the governance
   harness. Then per-subsystem Define→Design→Build in dependency order (A+B+E first).
2. When subsystem B is taken up: answer OQ-4 (Fusion tool-library export/shape).
3. When the posting end is taken up: answer OQ-5 (machine controls / posts).

## Blocked on

- Nothing blocking program-level Design. (OQ-4/OQ-5 remain open but are scoped to
  subsystem B and the posting end, not Design.)

## How to update this file

When you finish a unit of work or end a session: update the subsystem table, add a
dated line to the phase log, refresh next-actions and blocked-on, and write a
handoff in `handoffs/`. This file plus the latest handoff should let a fresh
session continue without reading prior conversation.
