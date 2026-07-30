# HANDOFF — APS Fusion MCP server rebuild

## Where this stands

The specification phase is complete. The **architecture fix cycle is ended, without a formal
PASS**: the owner directed the cycle to stop on 2026-07-30, during round 20, after the findings
of rounds 13–19 had all been applied. Treat the architecture as the accepted, buildable design —
accepted by owner decision, not by a zero-findings verdict.

What that acceptance means, precisely: round 19's two findings were fixed after its review and
never re-reviewed, and the residual defect class the final five rounds kept surfacing was
documentation-accuracy items (a stale figure, an uncited default, a mislabeled class member) —
not design. The design substance re-derived clean under six consecutive independent reviews:
all 60 spec requirements satisfied, the threat-model control join mechanically consistent, and
roughly fifty-six MFG schema assertions machine-checked per round with zero discrepancies.

## Read these, in order

1. **`docs/specs/spec-aps-fusion-mcp-server.md`** — the spec: 60 requirements (46 functional and
   non-functional, 14 security), an 8-attacker threat model, 27 acceptance criteria. It passed
   five independent blinded rounds with zero findings. One later change: `R-REL-7`'s crash
   clause and `AC-25` were amended to state achievable properties under Autodesk's token
   rotation (durably write response bytes before parsing; refresh only near expiry; detected,
   non-destructive, actionable outcomes). **The amendment is unreviewed and owes its own review
   round.** The spec file's own `Status:` line still reads "Draft for review" — stale governance
   metadata the owner has not yet resolved.
2. **`docs/architectures/architecture-aps-fusion-mcp-server.md`** — the architecture: 28 design
   decisions, a 37-tool inventory (tool 37 `aps_md_get_derivative` closed the Model Derivative
   retrieval gap round 14 found), threat-control mapping, ASVS mapping, and a traceability
   matrix covering all 60 requirements with zero deferrals.
3. **`docs/reviews/round-12-architecture-review.md` through `round-19-…`** — the complete review
   record. Round 19 is the most recent completed round; its two findings (tool 8's resume
   cursor; the bounded retry/renewal-threshold relation) were applied afterward and are the
   unreviewed tail. The rounds' Systemic Patterns sections describe, precisely enough to re-run,
   every mechanical scan class the cycle accumulated — table integrity, partition set-equality
   and member-property conformance, the threat-join computation, config-key closure, named-bounds
   and citation sweeps, module-pointer walks.
4. **`docs/aps-mfg-schema.json`** — the introspected MFG GraphQL schema, 209 types. Authoritative
   for every MFG field, query, and mutation shape. Read the schema, never recall it. (Note for
   tooling: the dump has no `mutationType` pointer; `Mutation` exists as a plain type with 45
   fields.)
5. **`docs/apsq.mjs`** — the working authenticated MFG query client. It cannot run until the
   re-authentication below.

## Blocked, and first steps of the build

- **The M-3 one-time browser re-authentication is outstanding** — the stored credential file
  contains the literal string `null`. Until the owner performs the login, no live APS call is
  possible from this repo.
- The architecture names exactly two load-bearing facts it could not verify without a
  credential, and both are specified with the exact closing check: **Limitation 8(b)** (whether
  MFG `ItemVersion.id` is the Data Management version-URN form — the recorded `itemVersions`
  query through `docs/apsq.mjs` settles it) and **Limitation 8(c)** (whether the Model
  Derivative `signedcookies` endpoint accepts the whole-value percent-encoded `derivative_urn`
  — issue the request in the encoded form, fall back to literal if it 400s). **These two checks
  are the first two post-authentication verifications of the build**, scheduled ahead of
  everything else, because they are the only places the built server can diverge from the
  architecture with no document defect visible.

## Next

The plan phase: `expert-plan`, consuming the architecture and the spec. The plan's per-step
Source annotations point at the architecture's D-numbers and Standards table; its first
post-authentication steps are the 8(b)/8(c) checks above. The spec amendment's review round can
run in parallel with planning.

## Process record — why twenty rounds, and what to keep

Rounds 1–11 failed on patch-style corrections; that history is recorded in this file's prior
revision. Rounds 13–19 applied the corrected discipline — re-derive the affected section from
its sources, sweep the finding's class, re-read what the edit touched — and every closure was
verified by the following round. Three fix-site regressions still occurred (rounds 15, 16, 19),
each from the same root: verifying only the half of the record that supported the edit — the
accounting surfaces but not the governing decision; a worked example but not the normative
reference; an asserted quantitative relation with one term unbounded. The rules that ended
them: the normative reference is the contract and a worked example is only evidence; every term
of an asserted relation must be bounded somewhere in the document before the sentence asserting
it is written; and the class check extends to the passages an edit makes stale, not only the
passages edited.

The cycle did not terminate on its own for a structural reason worth remembering: the review
standard's PASS requires zero findings of any severity, and each fresh blinded reviewer added
new mechanical scan classes beyond the prior round's (the review skill's instrument list is
open-ended, and each reviewer inherits the previous round's roster through the post-fix
inventory rule). The verification frontier therefore expanded about as fast as findings closed.
The owner ended the cycle by direction, which the review skill itself defines as one of the
three legitimate exits.
