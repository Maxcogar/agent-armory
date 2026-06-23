# PowerMill MCP — Roadmap (living source of truth)

> This is the single source of truth for program state. Keep it current: update it
> at every phase transition and session boundary. Phase tags follow the
> project-lifecycle skill (Define → Design → Build → Verify → Operate → Maintain).
> Last updated: 2026-06-22.

## Where the program is right now

**Define phase, in owner review.** The program requirements are drafted
([spec](specs/2026-06-22-powermill-program-requirements.md)). The project's
foundation (this roadmap, conventions, decision log, handoffs) is set up. Nothing
moves to Design until the requirements are approved and the blocking open questions
are answered.

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
  scaffolded. Gate to Design: owner approves requirements + answers OQ-1/2/3.

## Immediate next actions

1. **Owner review** of the requirements spec — mark up anything wrong.
2. **Owner answers blocking open questions** (from spec §10):
   - OQ-1 — what the shop runs/makes (sets breadth).
   - OQ-2 — what counts as a "verified outcome" (sets the learning signal).
   - OQ-3 — default autonomy vs. checkpoints (sets gate placement).
3. On approval → begin **Design** (program architecture: module interfaces, data
   model, MCP↔skill↔memory contracts, governance). Then per-subsystem Define→Design→Build.

## Blocked on

- **OQ-1, OQ-2, OQ-3** (owner decisions) — Design should not begin without these.

## How to update this file

When you finish a unit of work or end a session: update the subsystem table, add a
dated line to the phase log, refresh next-actions and blocked-on, and write a
handoff in `handoffs/`. This file plus the latest handoff should let a fresh
session continue without reading prior conversation.
