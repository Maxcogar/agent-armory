# HANDOFF — APS Fusion MCP server rebuild

## Where this stands

The APS Fusion MCP server — which wraps Autodesk Platform Services (APS) to reach Fusion design
data and drive Fusion — is being rebuilt from a broken predecessor. **The specification phase is
complete.** A reviewed, passing spec now defines what to build.

The spec is `docs/specs/spec-aps-fusion-mcp-server.md`. It is the authoritative, self-contained
definition of the target server. It passed independent blinded review — five rounds, a fresh
reviewer each round, every finding applied in full before the next round — ending in PASS with
zero findings.

## Read these, in order

1. **`docs/specs/spec-aps-fusion-mcp-server.md`** — the spec. Everything the build must satisfy:
   27 functional and non-functional requirements, an 8-attacker threat model tied to 14 security
   requirements, 27 acceptance criteria (each exercising a specific requirement), and a
   governing-standards table tracing every requirement to a named source.
2. **`docs/aps-mfg-schema.json`** — the live introspected Manufacturing Data Model (MFG) GraphQL
   schema, 209 types. It is the authoritative source for MFG GraphQL field/query/mutation shapes;
   the published documentation prose proved wrong in several places during the spec work.
3. **`docs/apsq.mjs`** — a working authenticated MFG query client that auto-refreshes its token,
   usable for live verification against the real API.

## What the server is

A hosted, single-owner MCP server wrapping APS, covering: reading Fusion design data (BOM,
physical properties, assembly structure, where-used, revision state, custom properties, drawings);
writing metadata back onto designs; geometry export (STEP/STL/OBJ free via MFG derivatives; other
formats and foreign CAD via Model Derivative); headless Fusion automation (submit / track /
retrieve WorkItems); and change notification (webhooks plus a polling fallback). Deployment is
hosted (internet-reachable) with a local stdio path for development.

## What's next

The next phase is architecture, working from this spec. The spec states its requirements as
properties and, in §14, names the decision categories it leaves to architecture. The architect
makes those decisions from the spec; this handoff does not pre-empt or frame them.

The spec is grounded: §3 and §13 record every external Autodesk fact it rests on, each verified
against source, so those are established rather than open.

## Owner inputs still outstanding (facts as of 2026-07-28)

- The owner has not chosen where the hosted server will run, and has not confirmed whether the APS
  app sits in the same Autodesk team as the Fusion subscription. That team placement determines the
  included Manufacturing-Data-Model allowance, which becomes a metered/priced API on 2026-08-17.
- No specific Fusion Automation job has been selected to build first. Each job is a separate
  authored TypeScript deliverable that feeds the submission subsystem the spec covers; the
  subsystem is fully specified without any job chosen.

## Critical context

- The old server's `src/` is the broken predecessor being replaced. Per this repo's standing rule,
  a server under rebuild is evidence of what was built, not a precedent for the new design.
- The old server contained a defect that destroyed the stored Autodesk credential on a benign
  refresh error: a widened OAuth scope set returned `invalid_scope` on refresh, and the handler
  wiped the credential. The spec addresses this class in R-REL-2 (transient failures must not
  destroy credentials), R-REL-3 (scope changes must not silently invalidate), and R-REL-7 (token
  rotation must be atomic and serialized).
- APS access is 3-legged OAuth requiring user context; client-credentials cannot see a user's
  hubs. The stored credential was invalidated during the spec work, so a one-time browser
  re-authentication is needed before live API calls succeed.

## Standard

This session's work was held to the Expert Standard. The spec was validated by independent, blinded
review — a fresh reviewer each round, all findings applied in full between rounds; a revised
artifact was never returned to the reviewer that produced its findings.
