# Plan Review — Round 2

**Artifact:** `docs/plans/plan-aps-fusion-mcp-server.md`
**Date:** 2026-07-30
**Reviewer:** independent (expert-review protocol), fresh — not the round-1 reviewer, not the author
**Scope:** full round over the whole artifact, not a closure check against round 1
**Verdict:** NEEDS FIXES — 10 findings (1 Serious-Systemic, 6 Moderate, 1 Moderate-Systemic, 2 Minor)

## Findings

| # | Severity | Finding |
|---|---|---|
| R2-1 | Serious, Systemic | Coverage reconciliation table inconsistent with the plan's own step `Source` annotations, in **both** directions: 6 rows pointed at steps that neither declare nor implement the requirement (S-14→S23, R-PROTO-1→S23, R-PROTO-2→S23, S-5→S7, R-REL-5→S11, S-13→S11), and 8 steps declared requirements their row omitted. No work was missing — the mechanism meant to *prove* that returned a false result. |
| R2-2 | Moderate, Systemic | Four factual claims asserted in steps had no §11 entry: `package.json:6` (`main`), `package.json:5` (`type: module`), `aps-auth.ts:45-49` (`env()` throwing at call time), `aps-auth.ts:31` (`{mode:0o600}`). All four verified **true** — audit-trail defect. |
| R2-3 | Moderate | AC-24's seam justification was contradicted by the plan's own evidence: T-17 already stages an over-cap call with zero spend, and spec AC-6 establishes the observable. A seam run verifies SpendGuard's logic, not that it sits in the live request path — which is what spec AC-24's "human-out-of-the-loop invocation path" demands. |
| R2-4 | Moderate | AC-25's "writes bytes before parsing" limb had no observation and no failure condition anywhere in §12 — on the criterion guarding the one asset the build can destroy unrecoverably. |
| R2-5 | Moderate | S0's premise and verification were stale: written in present tense with verification pinned to `git show --stat HEAD`, which stopped returning the five files once later commits landed. Failure direction was safe (blocks S1) but it halted execution at step zero. |
| R2-6 | Moderate | D-P5 rejected `z.object` on a premise false at the pinned version. Per v1.29.0 `mcp.ts`, `z.object` is the **primary** generic overload (`InputArgs extends StandardSchemaWithJSON`, `cb: ToolCallback<InputArgs>`); the raw shape is normalized and pairs with `LegacyToolCallback<ZodRawShape>`. Both work — the plan had committed 37 tools to the legacy path on wrong reasoning. |
| R2-7 | Moderate | D1's stdio-mode auxiliary listener — route set exactly `/auth/login` + `/auth/callback`, `/mcp` prohibited — was specified in no plan step, only inside S25's README text. A security-relevant restriction handed over by reference. |
| R2-8 | Moderate | Three §12 doubles carried a Meszaros kind but no named justification (T-25 spy, T-26 fake, T-27/T-28 fake). |
| R2-9 | Minor | Five tests omitted the ISO 29119-4 technique the plan commits every §12 spec to name (T-32/33/34, T-35/36). |
| R2-10 | Minor | S16–S21's group header claimed verification and impact were "per step"; only dependencies were. |

## Disposition

All ten applied. R2-1 and R2-10 were fixed **structurally rather than by
correction**: the coverage table is now generated from the step `Source`
annotations (the derivation §5 already used), and the six tool-module steps were
given individual `Source` lines — which is what made generation possible and was
the root cause beneath both findings. A mapping gap is now impossible by
construction rather than by inspection.

R2-6 was re-derived from the SDK type signature rather than accepted on the
reviewer's word; the signature confirmed the finding, and all 37 tools moved to
`z.object`.

## Convergence Record

- **Round:** 2
- **Trajectory:** R1 = 9 → R2 = 10. Not comparable as a simple count: round 2 was
  a full independent round, not a closure check, and found a different class of
  defect (cross-reference surfaces) than round 1 (missing sections).
- **Provenance:** not computable at the time — round 1's list was not on disk.
  This file and `plan-round-01-review.md` exist so round 3 can compute it.
- **Tripwire:** NOT EVALUABLE at round 2. Explicitly neither fired nor cleared.

## What this review confirmed as sound

~30 premises re-derived, every one exact: 17 predecessor `file:line` ranges, all
8 GraphQL schema assertions, the SDK annotation defaults, the Express body-limit
default, the vitest timer API. Line citations were precise where a near-miss was
easy (S5 cites `aps-auth.ts:31`, the `persistTokens` write — not `:40`, where an
identical literal sits inside `clearTokens`).

§5's Created table was generated from the step set and reconciled cleanly — the
direct contrast with R2-1, and the reason generation was adopted as the fix.

S15's probe gate was judged the correct structural answer to an unverifiable
premise: architecture Limitations 8(b)/8(c) become plan steps gating only
`md-gateway`, with both failure branches pre-specified. A pre-specified
conditional resolved by observation is **not** a deferred decision under Gate C.
