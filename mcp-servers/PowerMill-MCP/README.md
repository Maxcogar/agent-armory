# PowerMill MCP — Program

A system that lets an AI agent drive **Autodesk PowerMill** through an MCP so that
someone who is **not** a PowerMill expert can get the full range of real CNC
machining programmed, safely — because the system carries the machining expertise,
not the user.

This is a **program**, not a single tool. It is being built deliberately, across
sessions, to a defined lifecycle so it stays coherent as it grows.

## Status

**Phase: Define (requirements).** The program requirements are drafted and awaiting
owner review plus answers to the open questions. No architecture or subsystem code
is committed yet beyond the seed capability core (the existing .NET MCP server).

→ **New session? Start with [`docs/ROADMAP.md`](docs/ROADMAP.md) and the latest file in [`docs/handoffs/`](docs/handoffs/).**

## The map — six subsystems

| | Subsystem | Responsibility | Lives in |
|---|---|---|---|
| **A** | Capability core | Complete, typed, *safe* MCP coverage of the in-scope machining space | `PowerMillMcpServer/` (seed; .NET 4.8 MCP server) |
| **B** | Shop knowledge base | Curated, authoritative data — tools, holders, materials, machines, feeds/speeds — synced from Fusion 360 | TBD (Design) |
| **C** | Judgment layer | The machining-expertise skill system (strategy/parameter/ordering decisions) | TBD (Design — placement affects skill discovery) |
| **D** | Learning loop | Improvement grounded in *verified* outcomes only | TBD (Design) |
| **E** | Verification/feedback | The ground-truth signal D depends on (sim, sign-off, real results) | partly in A; TBD |
| **F** | Lifecycle/governance | How capability, skills, and learnings get added, tested, versioned, promoted | `docs/` + TBD harness |

Dependency order: **A + B + E** are the foundation; **C** needs A+B; **D** needs
E+C; **F** wraps all and is bootstrapped here in `docs/`.

## Navigate

- **Requirements (the contract):** [`docs/specs/2026-06-22-powermill-program-requirements.md`](docs/specs/2026-06-22-powermill-program-requirements.md)
- **Live status & next actions:** [`docs/ROADMAP.md`](docs/ROADMAP.md)
- **How we work (git, docs, decisions):** [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md)
- **Why things are the way they are:** [`docs/decisions/`](docs/decisions/) (ADRs)
- **Session handoffs (continuity):** [`docs/handoffs/`](docs/handoffs/)
- **What the seed server can/can't do:** [`PowerMillMcpServer/docs/COVERAGE-AUDIT.md`](PowerMillMcpServer/docs/COVERAGE-AUDIT.md)
- **Changelog:** [`docs/CHANGELOG.md`](docs/CHANGELOG.md)

## The seed: capability core (A)

`PowerMillMcpServer/` is the existing v0.3.0 .NET MCP server (46 tools). It is the
starting point for subsystem A — not the finished program. The coverage audit
documents the large gap between what it does (set up a job and post it) and what a
great system must do (configure the toolpaths it creates). Closing that gap is the
bulk of subsystem A's work.
