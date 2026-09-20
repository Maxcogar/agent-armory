# Independent collapse-hunt — Checkpoint-1 fix set (Round 2 / convergence)

*Independent collapse-hunt, neutral general-purpose subagent, mechanical dispatch
(CLAUDE.md dominating rule 2). Convergence round after the prior round's two
findings were applied. Scope = `git diff origin/main` (13 files); HEAD `b5d1d07`.
Written once, never edited.*

## Verdict

**PASS — zero findings.** Both load-bearing decisions (M1, M2) survive a harder
independent attack; no new hollowness of consequence. The two prior-round
findings are confirmed genuinely applied (the STATUS ledger reword rests solely
on `OL-11`; the seed-literal test pins all 20 §10 scalars). Two minor
**observations** (below) are explicitly non-blocking — not findings.

## Decisions re-attacked — both SURVIVE

- **M1** — the reject-`'mechanical'` side is the spec-grounded one (FR-X2 ties
  `'mechanical'` to mechanically-generated content; §11.5 makes Phase A a
  model-free core that composes none), the gate is fail-closed, and it is
  structurally non-bypassable: all seven prov-carrying DAOs funnel through
  `provCreateValues → assertProvenance`; no DAO writes the prov columns around
  the gate. The schema CHECK (accepts `'mechanical'`) vs DAO gate (rejects it)
  two-layer design is coherently tested at both layers.
- **M2** — the `onBusyRetry` seam controls only *when* the retry runs; the loop,
  BEGIN/COMMIT/ROLLBACK, busy detection, the `attempt<2` bound, and the
  `StoreBusy` throw are unchanged production code; strict no-op when `opts`
  omitted; `attempt===0` bounds it to one fire. Determinism confirmed 8/8.

## Observations (non-blocking, not findings)

1. The M2 seam is the sole test-only production surface, and the
   `busy_timeout`-mediated mid-window retry sub-path is not exercised (the test
   forces lock-free-on-retry). Honestly declared and aligned with the phase
   goal ("measure its own floor"); a defensible, minimal, documented trade-off.
2. STATUS asserts "CI is green on the PR head"; the reviewer confirmed no merge
   conflict but recommends STATUS assert CI-green only from an observed run. (The
   main session observed CI-green via the head's check-suite events; low
   materiality.)

## Verification (run independently)

`npm run build` clean; `npm test` 41/41; T-3-3 isolation 8/8; all four plan gates
green; no merge conflict vs origin/main (`git merge-tree` clean); entropy of the
redactor negative recomputed = 3.9677 bits/char < 4.0; all 20 `PLAN_SCALARS`
match plan §10 and `SCALAR_SEEDS` keys exactly; `OL-11` CONFIRMED in the ledger.
