# Plan Review — Round 3

**Artifact:** `docs/plans/plan-aps-fusion-mcp-server.md`
**Date:** 2026-07-30
**Reviewer:** independent, fresh — not round 1, not round 2, not the author
**Scope:** full round over the whole artifact; prior-round files used only for convergence arithmetic
**Verdict:** NEEDS FIXES — 9 findings (1 Critical, 1 Systemic, 1 Serious, 3 Moderate, 3 Minor)

## Findings

| # | Severity | Finding | Provenance |
|---|---|---|---|
| R3-1 | Critical | Two opposite `registerTool` schema conventions in one document — 3 sites said `z.object`, 3 said raw shape. Gate C zero-tolerance: an implementer cannot begin S12. | recurring (R2-6 fix reached 3 of 6 sites) |
| R3-2 | Systemic | Round-2 corrections applied at flagged instances without sweeping the class each finding named. Three classes: ISO 29119-4 technique naming (8→5→1 across three rounds), §11 coverage of step-asserted claims, and the schema form. Three of round 3's findings were introduced by round-2 fixes. | recurring |
| R3-3 | Serious | S0's verification stated expected value 1 for two `grep -c` commands that return 2 — on the check gating the irreversible deletion of the owner's only copy of 257 lines. | regression from R2-5 |
| R3-4 | Moderate | §12 carried three mutually inconsistent counts of live vs seam criteria (22/5, 21, 6). | regression from R2-3 |
| R3-5 | Moderate | `.env.example` filed as Created for a file that already exists, with no step specifying its contents. | new |
| R3-6 | Moderate | Six external API/library facts consumed on the architecture's citations in a self-invented §11 sub-category rather than §15 Gaps. The zod item was demonstrably grounded in v3 docs while the project pins v4. | recurring (R1-3) |
| R3-7 | Minor | §11 numbering non-monotonic: 1–29, 38–41, 30–37. | regression from R2-2 |
| R3-8 | Minor | Dangling sentence fragment in S22 carrying a normative `serverInfo` requirement. | new |
| R3-9 | Minor | Checkpoint F present in §9 but with no inline marker in §7, the execution surface. | gap in the R1-8 fix |

## Disposition

All nine applied, with R3-2 treated as a **method** rather than three edits, per the reviewer's
recommendation. The three class sweeps were run mechanically and their result counts recorded:

- **Class 1 (§12 field coverage).** Scanned per **test id**, not per block — the per-block scan
  used initially was weaker than the reviewer's and could not see the defect, because a grouped
  block passes if the field appears anywhere in it. Per-id scan found T-24 lacking *Technique*,
  *Must NOT assert* and *Data*, and T-26 lacking *Must NOT assert*, inside the T-24/25/26 group.
  Fixed per id. Re-scan: **0 gaps across all ids in all 28 blocks.**
- **Class 2 (§11 coverage).** 14 distinct `file:line` citations before §11; **0 files absent**
  from §11. §11 renumbered monotonically 1–41.
- **Class 3 (schema form).** Every normative mention now `z.object`; remaining "raw shape"
  mentions are all descriptive (rejecting it). Re-scan: **0 normative raw-shape sites.**

R3-6 was resolved by moving the six facts to §15 as gap **G-4** with attempt evidence, and by
re-grounding S7's `.merge()` rejection on the v4 API reference (§11 claim 24, verified directly)
rather than on the v3-documented `unknownKeys` semantics.

## Convergence Record

- **Trajectory:** R1 = 9 → R2 = 10 → R3 = 9.
- **Flow, round 3:** closed 12 of 19 prior findings; 3 recurring; 3 new; 3 regressions introduced
  by round-2 fixes.
- **Tripwire: NOT FIRED**, arithmetic shown by the reviewer. Condition (a): new+regression (6) ≥
  closed (12) is false. Condition (b): round 3 strictly decreased (9 < 10), resetting the run.
- **Recorded alongside:** one class reached its third consecutive round before closing, and half
  of round 3's findings were fix-generated. That is the behavior R3-2 names.

## What this review confirmed as sound

Coverage table verified genuinely generated — scripted inverse-map of all 28 step `Source`
annotations against the declared table: **0 mismatches across 60 requirements, both directions.**
All eight §11 schema claims exact against the on-disk introspection, plus five further shapes the
step tables assert that §11 does not enumerate — all correct. Test-ID cross-reference complete
both ways (36 = 36, no orphans). Seventeen predecessor `file:line` citations precise, including
`aps-auth.ts:31` rather than the byte-identical literal at `:40`. S15's probe gate reaffirmed as
a pre-specified conditional, not a deferred decision.
