# Plan Review — Round 1

**Artifact:** `docs/plans/plan-aps-fusion-mcp-server.md`
**Date:** 2026-07-30
**Reviewer:** independent (expert-review protocol), not the plan's author
**Verdict:** NEEDS FIXES — 9 findings (1 Systemic, 2 Serious, 6 Moderate)

Recorded so later rounds can compute trajectory, provenance, and the
non-convergence tripwire. Round 2 could not: this list existed only in session
context, so its Convergence Record is explicitly marked NOT EVALUABLE.

## Findings

| # | Severity | Finding |
|---|---|---|
| R1-1 | Serious | The 27 acceptance tests carry no specification — §1 defines success as AC-1..AC-27 passing, §12 gave them a 3-line paragraph with none of the five required fields. S26 additionally routed AC-11/19/24/25 to D26 doubles with the real/double decision justified nowhere. |
| R1-2 | Serious | S1's "Impact if wrong: fully recoverable — the files are in git history" was false. Four of the seven files it deletes carried uncommitted changes (257 insertions vs HEAD, no stash); ~9 of §11's own premise citations pointed at working-tree-only content that S1 would destroy with no preservation step. |
| R1-3 | Systemic | §11 contained zero entries for any external-API or library fact the steps assert (MFG schema, DM, Model Derivative, DA, Webhooks, SDK `allowedOrigins` deprecation, zod `.merge()` semantics). The schema claims were independently verified **true** — an auditability failure, not a correctness one. |
| R1-4 | Moderate | S26 had zero of the four Gate-3 parts. |
| R1-5 | Moderate | §5 claimed 25 created files, listed 24, and omitted `src/services/errors.ts`. |
| R1-6 | Moderate | S12 named no file path anywhere. |
| R1-7 | Moderate | §11 claim 26's vitest evidence was a `resolve-library-id` listing, not a documentation read. |
| R1-8 | Moderate | No checkpoint after the two named foundation corrections. |
| R1-9 | Moderate | 8 of 28 test specifications named no ISO 29119-4 technique, against the plan's own §3 commitment. |

## Disposition

All nine applied before round 2, by **re-deriving the affected sections from
their sources** rather than editing the flagged spots — the standing rule that a
finding is a symptom and the correction must sweep its class.

Re-deriving §5 from the step set surfaced a defect this review did not find:
`src/gateways/da-gateway.ts` appeared in the file list and in the architecture's
module layout but **no step created it**. Assigned to S20.

R1-2 was additionally acted on outside the document: commit `6e5f00b` preserved
the 257 uncommitted lines, and a new step S0 now gates S1 on that preservation.

## What this review confirmed as sound

Every predecessor-source claim re-derived (17) was exact to the line. Annotation
defaults and zod `.merge()` `unknownKeys` semantics verified verbatim against
Context7. All 60 spec requirements present. A grep of ten deferral patterns
across all 841 step lines found zero deferred decisions or option sets.
