# Plan Review — Round 4

**Artifact:** `docs/plans/plan-aps-fusion-mcp-server.md`
**Date:** 2026-07-31
**Reviewer:** independent, fresh; full round over the whole artifact
**Verdict:** NEEDS FIXES — 8 findings (1 Serious-Systemic, 5 Serious, 1 Moderate, 1 Minor)

## Findings

| # | Severity | Finding | Provenance |
|---|---|---|---|
| R4-1 | Serious | Tools 31/32/33 (Webhooks v1 REST) had no backing gateway — none of the four gateways covers Webhooks, and tool modules are forbidden from constructing HTTP requests. §14 Q-12 asserted the opposite. | new |
| R4-2 | Serious | D-P5 and Q-2 asserted the SDK "documents the raw-shape overload as deprecated." It does not — the `@deprecated` markers are on `.tool()`, not on `registerTool`'s raw-shape path. §11 claim 22 never carried the deprecation; the decision record escalated beyond its own evidence. | regression from the R2-6 fix |
| R4-3 | Serious | S26's Gate-3 part 4 said "*Not* live execution of AC-24" while S26's own procedure runs AC-24 live — part 4 rejecting the decision its step made. | recurring (R3-4 class) |
| R4-4 | Serious | T-18 and Checkpoint A's compile-time assertion could not execute: vitest `typecheck.enabled` defaults false, `typecheck.include` defaults to `*.test-d.ts` (not the plan's `test/**/*.test.ts`), and `tsconfig.json`'s `rootDir: "./src"` puts a `test/` fixture outside the program. | new |
| R4-5 | Serious | G-4 disqualified itself: its own attempt evidence said the six facts "were reachable and were not blocked." Under the earned-gap rule those are open bin-1 questions, making §14's "zero entries are open" false and the plan undeliverable. | recurring (R3-6, R1-3 — third round) |
| R4-6 | Serious, Systemic | 25 asymmetric dependency pairs across the step set. The consequential instance: none of S16–S21 declared S11 or S12, so the declared graph let a scheduler start a tool module before `registerGuardedTool` existed — exactly what Checkpoint D exists to prevent. | new |
| R4-7 | Moderate | S2's pinning instruction named three deps but `package.json` carries three more on carets, so executing S2 literally fails S2's own verification; and no version was named for `pino`, `vitest`, or `@vitest/coverage-v8`. | new |
| R4-8 | Minor | S0 said the five files "existed nowhere in git history" while its own figures show 93 deletions against prior committed content. | new |

## Disposition

All eight applied.

**R4-1** — added `src/gateways/webhooks-gateway.ts`, created by S21, with the register/list/delete
operations, per-hook secret generation, and `pageState`/`next` paging. Q-12 re-opened and closed
correctly.

**R4-5** — four of the six facts were read directly and promoted to §11 as claims 42–45 (SDK
deprecation markers; DM `lastModifiedTimeRollup`; MD `properties:query` pagination; Webhooks
`pageState`). The zod item was dropped rather than resolved — S7's rejection of `.merge()` now
rests on the v4 reference (claim 24), so the v3 semantics is no longer a premise. G-4 rewritten to
cover the three that genuinely remain, with the attempt recorded per item.

**R4-6** — the consequential half fixed by giving S16–S21 per-step dependency lists including S11
and S12. The remaining asymmetries were resolved **structurally rather than reconciled**: §7 now
states that backward edges are normative and the "Unblocks" notes are informational and derivable,
so a duplicated index with no generator stops being a second source of truth.

**R4-2, R4-3, R4-4, R4-7, R4-8** — corrected at their sites, each verified by reading the file
rather than by scanning it.

## Method note carried forward

Two of this round's findings trace to the author's own verification being unsound rather than
absent. Q-12's "scripted check confirms zero uncovered tools" was **circular** — the coverage sets
were hardcoded into the script from assumption, so it confirmed what it was told. R4-2's false
deprecation claim was **propagated from a prior reviewer's message without being checked**. In the
fix round, a further sweep script matched prose ranges and reported the wrong tools entirely.

Every defect in this project has been found by reading; no script has found one, and three have
introduced or concealed defects. The owner's direction — read the file, do not script it — is
recorded here as the method for subsequent rounds.

## Convergence Record

- **Trajectory:** R1 = 9 → R2 = 10 → R3 = 9 → R4 = 8.
- **Flow, round 4:** 6 of 9 prior findings closed; 5 new; 2 recurring; 1 regression.
- **Tripwire: NOT FIRED.** Condition (a) — new+regression ≥ closed — is **true this round**
  (6 ≥ 6) and was false last round, so the two-consecutive requirement is unmet. Condition (b) —
  no strict decrease for two consecutive rounds — is unmet, both recent rounds decreased.
  **One further round where new+regression ≥ closed fires the tripwire.**
- **Recorded alongside:** the severity profile rose this round (5 Serious vs 1 in round 3) even as
  the count fell, so the declining total should not be read as convergence on quality.

## What this review confirmed as sound

The §2 coverage table re-derived from step `Source` annotations: **0 of 60 rows differ, both
directions.** All eight MFG schema claims exact against the on-disk introspection, plus five
further shapes spot-checked. 36 test IDs cross-referencing completely both ways. Every predecessor
`file:line` citation precise, including `aps-auth.ts:31` rather than the byte-identical literal at
`:40`. Every S0 git value reproduced exactly, including the documented `grep -c` ambiguity.

Every defect this round sat in hand-written prose that no derivation covers, while every generated
surface came through clean.
