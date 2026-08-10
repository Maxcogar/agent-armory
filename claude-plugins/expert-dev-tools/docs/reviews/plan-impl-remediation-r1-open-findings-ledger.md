# Open Findings Ledger — plan-impl-remediation-r1.md

**Status:** review loop ended by operator-directed stop, 2026-08-09, after round 4 fired both
tripwire conditions (`plan-impl-remediation-r1-round-04.md`). This ledger is the record the
round-4 review requires for that path: the findings below are **open, unremediated, and known**.

## Why the stop, and on whose authority

Owner precedent from the same session and the same failure class: when the review loop for
`plan-expert-dev-tools-behavioral-remediation.md` fired its tripwire at round 8 with all residual
findings confined to hand-maintained bookkeeping surfaces and zero findings against the buildable
content, the owner (Max Cogar, 2026-08-09) approved the plan's substance and directed execution,
with the open findings recorded as errata. This plan is in the identical position at smaller
scale: trajectory 6 → 2 → 2 → 2; the nine engineering steps were independently re-executed and
verified correct by four separate reviewers (rounds 1–4, each from scratch, each on Node
v22.16.0); every open finding is in the §11 claim registry or §14 attestation, none in what any
step builds. The alternative — Gate 8 rework of §11/§14 followed by more review rounds — spends
tokens on a self-referential registry for a nine-step plan whose entire purpose is already
quadruple-verified.

The engineering-vs-bookkeeping asymmetry is not incidental; it is this session's central measured
result, recorded in `docs/SKILL-CHANGELOG.md` entries 6–15 and every review record in this
directory: executable claims converge under review, hand-attested registries do not.

## Open findings (from round 4, verbatim summaries)

- **F-K (Moderate, Systemic)** — the §11 registration class survives: pass 8 swept cross-document
  citations for exactly the two documents round 3 named and no others, leaving unregistered:
  twelve assertions about the plan's own review records (plan lines 84, 115, 432, 445, 457, 476,
  490, 512, 566, 603, 604, 606 — one inside step S1), §8's three D-B line-reads at
  `check-structure.mjs:254/:255/:376` (evidence pointer resolves to claim 28, a different
  document), §15 G-2's `:74–135`, and rounds 02/03 absent from Citation identity.
- **F-L (Moderate)** — §14's attestation self-contradicts on two counts: "nine passes, four
  confirming" vs. a table showing three confirming; Q-32's "eleven of thirteen accurate" vs.
  claims 28+29 attesting twelve of thirteen (Q-31 miscounted into the population).

## What a reader of the plan must therefore know

- §11 and §14 are **not complete** as attested. Claims 1–29 that ARE registered were
  independently re-verified across the four rounds and reproduce; the omissions above are
  unregistered, not wrong — the round-4 reviewer re-derived the named ones and found the
  underlying facts accurate except as corrected in the round-3 pass (which fixed two genuinely
  false claims in §2 and §8).
- Steps S1–S9, the touch set, and the four test specifications carry **zero open findings**
  across all four rounds.

## Effect on execution

None on what is built. The implementer executes S1–S9 as written. The §11/§14 gaps do not alter
any step's content, order, verification, or touch set.
