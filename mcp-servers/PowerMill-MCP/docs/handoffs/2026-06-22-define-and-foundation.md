# Handoff — 2026-06-22 — Define phase + project foundation

> Continuity artifact. A competent agent should be able to continue from this file
> plus the ROADMAP without the prior conversation.

## Situation
Starting a ground-up redesign of the PowerMill MCP into a real program: a system
where an AI agent lets a non-PowerMill-expert get the full breadth of CNC
machining programmed safely, because the system carries the expertise. The owner
explicitly wants it built right and for the long term (modular, correct,
non-overfitted), not cobbled together.

## What was decided (with why → see ADRs)
- **Six-subsystem decomposition** (ADR-0002): A capability core, B shop knowledge
  (Fusion-synced), C judgment/skills, D learning, E verification, F governance.
- **.NET API primary, macros a contained fallback** (ADR-0003) — safety + agent
  reliability.
- **Verified-feedback-only learning + curated/learned memory separated** (ADR-0004).
- **Use ADRs** for all significant decisions (ADR-0001).

## What was done
- Brought the seed capability core (existing v0.3.0 .NET server, 46 tools) under
  version control at `PowerMillMcpServer/`; corrected its stale docs (v0.2.0/38 →
  v0.3.0/46).
- Wrote a full coverage audit (`PowerMillMcpServer/docs/COVERAGE-AUDIT.md`) against
  the complete `Autodesk.ProductInterface.PowerMILL` surface (146 types / 552
  methods / 348 properties). Key finding: the server can set up and post a job but
  cannot *configure* the toolpaths it creates (no parameters, leads/links,
  feeds/speeds, tool axis); leads/links and feeds/speeds *are* typed in the API and
  unwrapped; no stock models / feature sets / setups creation.
- Wrote the Define-phase program requirements spec
  (`docs/specs/2026-06-22-powermill-program-requirements.md`): ~40 ranked,
  sourced, testable requirements; threat model + derived security requirements;
  judgment calls; open questions.
- Set up the project foundation: this handoff, `README`, `ROADMAP`, `CONVENTIONS`,
  decision log.

## What's next
1. Owner reviews the requirements spec and marks up anything wrong.
2. Owner answers blocking open questions OQ-1 (shop scope/breadth), OQ-2 (what
   counts as a verified outcome), OQ-3 (autonomy vs. checkpoints).
3. On approval → **Design** phase: program architecture (module interfaces, data
   model, MCP↔skill↔memory contracts, governance harness). Then per-subsystem
   Define→Design→Build, in dependency order (A+B+E first).

## Blocked on
- OQ-1, OQ-2, OQ-3 — owner decisions. Design should not start without them.

## Context the next session needs
- The seed server's live source also exists outside the repo at
  `C:\Users\maxco\Documents\MCPs\PowerMillMcpServer\`, and that build is what the
  `powermill` MCP in `~/.claude.json` actually runs today. The repo copy and that
  copy are currently kept in sync by hand. Retiring the external copy (repoint the
  MCP config to a repo-built exe, then delete the external folder) is a pending
  decision, deferred — nothing about today's work changed how the live MCP runs.
- All PowerMill program work lives on the `main` branch (and GitHub
  `Maxcogar/agent-armory`), under `mcp-servers/PowerMill-MCP/`.
