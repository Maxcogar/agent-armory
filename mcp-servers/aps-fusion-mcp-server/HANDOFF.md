# HANDOFF — APS Fusion MCP server rebuild

## Where this stands

The specification phase is complete. The **architecture phase is not** — an architecture document
exists but **has never passed review**. Thirteen rounds of independent blinded review ran against
successive revisions of it; every round returned NEEDS FIXES. Do not treat the architecture as a
settled contract, and do not start planning or building from it until it passes.

## Read these, in order

1. **`docs/specs/spec-aps-fusion-mcp-server.md`** — the spec. 60 requirements (46 functional and
   non-functional, 14 security), an 8-attacker threat model, 27 acceptance criteria, and a
   governing-standards table. It passed five independent blinded rounds with zero findings, with
   one later change noted below.
2. **`docs/architectures/architecture-aps-fusion-mcp-server.md`** — the architecture. 28 design
   decisions, a 36-tool inventory, threat-control mapping, ASVS mapping, and a traceability matrix
   covering all 60 requirements. Unaccepted; see the open findings below.
3. **`docs/reviews/round-12-architecture-review.md`** — the most recent completed review. Its
   findings are the immediate work.
4. **`docs/aps-mfg-schema.json`** — the introspected Manufacturing Data Model GraphQL schema, 209
   types. Authoritative for every MFG field, query, and mutation shape; Autodesk's published prose
   proved wrong in several places. Read the schema, never recall it.
5. **`docs/apsq.mjs`** — a working authenticated MFG query client. It cannot run right now (see
   Blocked below).

## Open findings on the architecture

From round 12, unfixed:

- **Serious.** The webhook-to-poll join in D12 reads identity from `payload.resourceUrn`, but
  `resourceUrn` is a **top-level sibling of `payload`** in Autodesk's callback envelope, not a
  member of it — so the lookup resolves to nothing on every real callback. Worse, D11's journal
  entry schema persists only `payload`, so the field is discarded at write time and cannot be
  recovered at read time. Both the write schema and the read path need fixing; repairing only the
  path leaves the journal structurally unable to carry its own join key.
- **Moderate ×3.** D19's zod citation attributes a v4 sentence about `z.intersection` to `.merge()`
  and a v3-documented semantic to the v4 docs. D24's state-store table is malformed — its final row
  spills a fourth cell into a three-column table and runs a normative write-discipline rule into the
  table body, so the rule renders without its subject. D1 rejects in-process TLS with a bare
  revision annotation instead of a reason.
- **Tentative.** D27 assumes MFG `ItemVersion.id` is the Data Management version-URN form
  (`urn:adsk.wip…:fs.file:vf.…?version=N`). The schema types it only as `ID!`. Limitation 8(b)
  records the exact query that settles it. If the assumption is false, D27 needs an id-derivation
  step it does not currently specify.

A partially-applied fix for the Serious finding is in the committed document — the journal schema
and the read path were both edited, but that revision was never reviewed. Verify it rather than
trusting it.

## The spec was changed, and that change is unreviewed

`R-REL-7`'s crash clause and `AC-25` required that a crash between Autodesk's token rotation and the
server's durable persistence leave a usable credential. That is unsatisfiable: Autodesk invalidates
the prior refresh token when it issues the replacement — a process refreshing with a token a sibling
had already rotated receives `invalid_grant` (recorded in `prior-session-artifacts/FINDINGS.md`) —
and no client can persist a token it has not yet received. Both now state the achievable properties:
minimize the window (durably write the response bytes before parsing; refresh only when the access
token is near expiry) and make its outcome detected, non-destructive, and actionable. The
concurrency clause is unchanged and was always satisfiable.

This edit has not been through review, and the `expert-architecture` skill directs that the spec not
be modified during an architecture run. Treat the amendment as a spec change owing its own review.

## Blocked

The stored Autodesk credential is cleared — the predecessor server destroyed it on a benign refresh
error, and the spec's M-3 one-time browser re-authentication has not been performed. Until it is:
`docs/apsq.mjs` cannot run, no live APS call is possible from this repo, and the Limitation 8(b)
verification cannot be discharged. This is also a prerequisite for any acceptance run.

## Owner inputs on record

The APS app and the Fusion subscription are in the same Autodesk team, so the subscription-included
Manufacturing Data Model allowance applies — relevant because MFG became a priced API on
2026-08-17. The server is hosted on a computer the owner controls, reached through his existing
Tailscale tailnet, of which he is the sole user; there is no Cloudflare or Caddy in the stack. No
Fusion Automation job has been selected to build first, which blocks nothing.

## What went wrong with the process, and what to do differently

Thirteen rounds without a PASS was a method failure, not reviewer harshness. The pattern, in the
words of the reviewers who kept naming it: fixes were applied to the instance a finding named rather
than to the class it belonged to, and the fixes themselves introduced new defects at roughly the rate
they closed old ones. Three habits caused it, and all three are avoidable:

- **Edits were made without reading.** Searching for a flagged string, changing it, and moving on is
  how a table ends up with a fourth cell, a join key points at a field that does not exist, and an
  orphan reference survives. Read the section — and after editing, read it again to see what the
  edit broke. A successful edit tool call is not evidence of a correct edit.
- **Scripts were trusted over reading.** A grep or parser finds only what its author already
  suspected, and its failures are silent and confident. One parser here silently matched 18 of 28
  decisions and still reported zero gaps. Use mechanical checks to confirm a reading, never to
  replace one.
- **Reviewers were given direction.** The `expert-review` skill defines the review, including the
  convergence record and tripwire arithmetic. A dispatch supplies the artifact, its upstream
  artifacts, and — for a post-fix round — the prior review itself, which is why the reviews are now
  kept in `docs/reviews/`. Supplying a summary of prior findings instead of the review, or
  pre-computing the tripwire, contaminates the round.

Also relevant: the `expert-architecture` skill's Gate C forbids self-corrections and scratchpad
content in the delivered document. Per-round revision notes accumulated in this document for nine
rounds before being removed, and they were the surface where stale claims collected. Do not
reintroduce them; the git history is the record of what changed.

## Standard

The Expert Standard governs this work. Review is independent and blinded, a fresh reviewer each
round, all findings applied in full between rounds, and the verdict is binary — PASS requires zero
findings of any severity.
