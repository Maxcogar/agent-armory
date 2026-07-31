# Plan Review — Round 6

**Artifact:** `docs/plans/plan-aps-fusion-mcp-server.md`
**Date:** 2026-07-31
**Reviewer:** independent, fresh; full round. **First round dispatched with pointers only** — no
author-supplied direction on where to look, what to check, or which instruments to use. The five
prior rounds were steered to some degree, so their coverage reflects where the author pointed.
**Verdict:** NEEDS FIXES — 11 findings (1 Moderate-Systemic, 5 Moderate, 5 Minor)

## Findings

| # | Severity | Finding | Provenance |
|---|---|---|---|
| R6-1 | Moderate | **T-17b is an orphan.** The test round 5 added to close the SpendGuard UTC-day rollover gap appears exactly once — at its own definition. No step's Verification field and no checkpoint references it, so an implementer executing S8 never builds it. Its second case is the one that matters: a cap resetting at a *local* midnight silently grants a second day's billable spend. | regression from the R5-5 fix |
| R6-2 | Moderate | Checkpoint B still carries the unscoped `fetch(` grep. R5-6 named Checkpoints A **and** B; A was fixed, B was not, and the disposition recorded all eight applied. | recurring (R5-6, second site) |
| R6-3 | Moderate, Systemic | Seven test specifications name eleven doubles by Meszaros kind with **no justification**. R2-8 named this class at three sites, fixed those three, left these seven. Falsifies §14's pass-6 sweep attestation. | recurring (R2-8) |
| R6-4 | Moderate | Five fakes are specified; none is required to be checked against the real contract. T-26 and T-27/T-28 are load-bearing — the fake supplies the very pagination/boundary semantics under test, so both pass green while the real gateway loses BOM lines or drops a change window. | new |
| R6-5 | Moderate | Nine per-step "Unblocks" statements contradict the normative backward edges. The §7 reverse index is correct; the stale prose was disclaimed rather than deleted, leaving ten places to be wrong, nine of them wrong. | recurring (R4-6 / R5-7 class) |
| R6-6 | Moderate | The plan creates a fifth gateway (`webhooks-gateway.ts`) that the architecture's layout does not contain, and records it in neither §10 nor §14 — while Q-12, whose question is literally whether every tool has a backing gateway, never mentions it. D4 is the one architecture decision the plan never cites. | new |
| R6-7 | Minor | §11 numbering non-monotonic again: 1–29, 46, 30–45. R3-7 was exactly this, at this section, closed in round 3. | regression from the R5-4 fix |
| R6-8 | Minor | S16–S21's dependency block cites "line 891" as the binding referent; line 891 is inside S14. A raw line number cannot survive an insertion, and this one already has not. | new |
| R6-9 | Minor | Five self-correction and review-history artifacts remain in the delivered document, against Gate C's explicit prohibition. | new |
| R6-10 | Minor | Checkpoint F asserts "`src/` is empty"; `src/schemas/` is an empty directory S1 never deletes, so a correct build fails the gate. S1's retained-path list claims completeness and omits `package-lock.json` and `.env.example`. | new |
| R6-11 | Minor | S2 asserts the contents of two `.gitignore` files with no §11 entry. Round 3's Class-2 sweep counted `file:line` citations, and a citation-shaped scan cannot see a claim written without one. | new (R2-2 class) |

## Convergence Record

- **Trajectory:** R1 = 9 → R2 = 10 → R3 = 9 → R4 = 8 → R5 = 8 → **R6 = 11**.
- **Flow, round 6:** closed 5; recurring 2; regression 2; new 7.
- **TRIPWIRE FIRED — condition (b).** The total has not strictly decreased for two consecutive
  post-fix rounds: R5 = 8 against R4 = 8 (run 1), R6 = 11 against R5 = 8 (run 2).
  Condition (a): round 5 was 6 ≥ 7 false; round 6 is 9 ≥ 5 true — run length 1, so (a) has not
  fired, but round 7 fires it too if the condition holds again.

## What the tripwire is naming

Severity has improved and stayed improved — zero Critical and zero Serious for the second
consecutive round, against one Critical in round 3 and five Serious in round 4. Every **generated**
surface came through clean again: the §2 coverage table (0/60 mismatches both directions), the §5
Created table, and the §7 reverse index itself.

The count rises because one defect *shape* keeps reappearing in a new location: **a hand-maintained
cross-reference or enumeration with no generator, drifting on each edit.** Six rounds of instances
— the §5 file count (R1-5, R3, R5-1), §11's numbering (R3-7, R6-7), the coverage table before it
was generated (R2-1), the dependency asymmetries (R4-6, R5-7, R6-5), the step↔test binding
(R6-1), the double-justification field (R2-8, R6-3), the checkpoint grep scopes (R5-6, R6-2), the
"line 891" pointer (R6-8), the tree enumerations (R6-10), and §11 claim coverage (R2-2, R6-11).

Each fix round patches the named instances; the next round finds the class somewhere new. The two
surfaces that were **derived** rather than maintained — the coverage table and the §5 file list —
are the only two in this document that have never regressed.

## Recommended path

The reviewer's stated conclusion: **foundational rework, not a seventh fix round.** Four surfaces
need to become derived-from-a-single-source rather than hand-maintained and hand-verified:

1. **Step ↔ test-id binding** — derive each step's Verification field from the specifications'
   own step attributions, so an orphan like T-17b is impossible by construction.
2. **The dependency graph** — delete every per-step forward statement; the reverse index becomes
   the sole representation.
3. **Checkpoint gate commands** — state each command once with its scope; checkpoints reference it.
4. **§11 claim coverage** — re-derive from the plan's assertions rather than its `file:line`
   citations, and renumber monotonically.

Only then the remaining findings, in order: R6-3 (sweep all 29 blocks, not the seven named),
R6-4 (contract checks for the T-26 and T-27/T-28 fakes first), R6-6, then R6-8, R6-9, R6-10.

**Method note carried forward:** scripted checks over this document have found zero defects and
have introduced or concealed three. Every real defect has been found by reading. Scripts to
*generate* the derived surfaces are the fix; scripts to *audit* prose are not.
