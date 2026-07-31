# Plan Review — Round 5

**Artifact:** `docs/plans/plan-aps-fusion-mcp-server.md`
**Date:** 2026-07-31
**Reviewer:** independent, fresh; full round over the whole artifact
**Verdict:** NEEDS FIXES — 8 findings (1 Moderate-Systemic, 6 Moderate, 1 Minor)

## Findings

| # | Severity | Finding | Provenance |
|---|---|---|---|
| R5-1 | Moderate, Systemic | Four self-referential counts wrong, in four sections whose function is to prove completeness: §5 said 27 rows for 28; §11 claim 10 said "all five call sites" when six exist; T-18 said three legal combinations for five; G-4's arithmetic said six for eight. | recurring (R1-5, same standard, fourth round) |
| R5-2 | Moderate | `tsconfig.test.json`, created by S2, appeared in neither §5's Created table nor its Modified list. | regression from the R4-4 fix |
| R5-3 | Moderate | `pino` and `@vitest/coverage-v8` ordered "exact-pinned" with no version, and S2's pin-to-the-lockfile rule cannot reach them — they are absent from the lockfile until installed. | **recurring — R4-7 named all three; only vitest was fixed and all three were recorded as corrected** |
| R5-4 | Moderate | S2/T-18 asserted `typecheck.include` must be set because the runtime `include` would not match. False — they are separate options and the documented default already matches `*.test-d.ts`. Three vitest defaults asserted with no §11 entry. | regression from the R4-4 fix |
| R5-5 | Moderate | Architecture D26 requires SpendGuard to take a clock; the plan gave it none, leaving the per-UTC-day counter reset unspecified and undeterministically untestable on the control guarding metered spend. | new |
| R5-6 | Moderate | Checkpoints A and B gate on a `fetch(` grep with no path scope. Run as written it returns hits from `docs/apsq.mjs` — which S15 requires — so a correct build fails the gate. | new |
| R5-7 | Moderate | Ten of 27 steps omit the "what this step unblocks" half of Dependencies entirely; §7's preamble disclaimed the surviving notes rather than making them correct. | new; S16–S21 half from the R4-6 fix |
| R5-8 | Minor | §11 claims 25 (pino) and 29 (express) omit the library version the evidence format requires. | new |

## Disposition

All eight applied.

**R5-3 is the one to carry forward as method.** It was named in round 4, one third of it was
fixed, and the disposition recorded all three as corrected. A fix note is not evidence of a fix.
Round 5's reviewer made re-checking prior dispositions against source its first recommendation,
and that is now the standing rule for this project's fix rounds.

**R5-1 fixed structurally, not corrected.** §5's count was **deleted** rather than fixed to 28 —
a count asserting the completeness of a list printed directly beneath it is a hand-maintained
index with no generator, which is what the plan rejects at §2 and §5 and what has now been wrong
in three separate rounds. The other three instances were corrected against their referents, and
the sixth `fetch` call site claim 10 had missed (`model-derivative.ts:110`, the `aps_get_thumbnail`
handler bypassing `aps-client`) is now recorded, with the grep that defines the scope.

**R5-4 verified rather than accepted.** The reviewer's correction was itself checked against
Context7 (`TypecheckConfig` JSDoc, `docs/config/typecheck.md`) before being applied — the same
propagation failure that produced R4-2 would otherwise have repeated in the opposite direction.
`typecheck.include` default confirmed as `['**/*.{test,spec}-d.?(c|m)[jt]s?(x)']`, which does
match the fixture. Recorded as §11 claim 46.

**R5-7 resolved as a single derived reverse index** in §7 rather than 27 per-step notes, with the
backward edges remaining normative — one place to be wrong instead of 27.

## Convergence Record

- **Trajectory:** R1 = 9 → R2 = 10 → R3 = 9 → R4 = 8 → R5 = 8.
- **Flow, round 5:** closed 7; recurring 2; new 4; regression 2.
- **Tripwire: NOT FIRED.** (a) new+regression (6) ≥ closed (7) is **false**, breaking round 4's
  run. (b) R5 = 8 vs R4 = 8 is not a strict decrease, but R4 < R3 was, so the run is one round.
- **Margins are one, on both conditions.** The next round fires the tripwire if new+regression ≥
  closed, **or** if the total fails to fall below 8.
- **Severity improved materially:** 0 Serious this round against 5 in round 4. Set against that,
  three of eight findings were produced by round-4's own fixes, and the R5-1 class is in its
  fourth round.

## What this review confirmed as sound

Coverage table re-derived in both directions from step `Source` annotations: 0 of 60 rows differ.
All eight MFG schema claims exact against the on-disk introspection. Every S0 git value reproduces
exactly, including the documented `grep -c` ambiguity. Every predecessor `file:line` citation
checked was precise, including `aps-auth.ts:31` over the byte-identical literal at `:40`. D14
conformance exact across all 11 W-class tools. Claim 42 independently re-derived, closing round
4's propagated-fact failure.
