# Independent collapse-hunt — Checkpoint-1 fix set (Post-fix)

*Independent collapse-hunt, dispatched to a neutral general-purpose subagent per
CLAUDE.md dominating rule 2 (a fresh subagent — never the author — attacks each
load-bearing decision's hardest question and hunts for new hollowness). Mechanical
dispatch: file list + plan path + "run the collapse-hunt", not told which
decisions to attack. Scope = `git diff origin/main` (11 files); HEAD `8d53bf9`.
Written once, never edited.*

## Verdict

**PASS with two findings** (one Moderate process/ledger, one Minor test-coverage
residual). Both load-bearing *design* decisions survive the collapse test; all
seven review findings are genuinely applied (not cosmetic). Neither finding
invalidates any design work — the code substrate is clean for Step 13.
Independent verification: `npm run build` clean; `npm test` 41/41; T-3-3 in
isolation 5×5 PASS (deterministic); `check_docs.py` green; all four plan gates
match STATUS.

## Load-bearing decisions attacked — both SURVIVE

- **M1 — Phase A admits exactly two learned-record trusts; `'mechanical'` is
  runtime-rejected as reserved for later-phase content.** SURVIVES. Not a
  side-picking paper-over: FR-X2 (spec §7.2) ties `mechanical` to
  mechanically-generated content, which Phase A does not produce; no `src/` writer
  emits it (grep); `assertProvenance` rejects it; T-9-1 and the compile-time
  T-11-5 pin the rejection; the `mechanical` CHECK value pre-dates the diff. The
  fix moves code toward the well-grounded rule (security-tightening).
- **M2 — `onBusyRetry` observation seam so T-3-3 sequences the retry-then-succeed
  path deterministically.** SURVIVES. The seam controls only *when* attempt-1
  runs; the loop, BEGIN/COMMIT/ROLLBACK, busy detection and StoreBusy throw are
  the real production paths. Fires at most once (`attempt===0`), strict no-op when
  `opts` omitted. The test honestly declines the unpinnable mid-`busy_timeout`
  case (matches the phase goal "measures its own floor").

## Findings

- **Finding 1 — Moderate (process / owner-ledger).** STATUS justified the M1/M3
  plan edits partly on an owner-attributed claim ("Max Cogar's explicit
  this-session instruction") that is **not in OWNER-LEDGER** — the project's
  flagged most-damaging recurring failure (un-ledgered owner claims). Mitigation:
  `OL-11` (CONFIRMED) independently makes plan/doc revision the agent's job, so
  the design work stands regardless. Fix: rest the justification on OL-11 alone
  and drop the un-ledgered owner claim (or ledger it PENDING→sign-off).
  **Disposition:** applied in this fix set — STATUS now rests solely on OL-11 and
  asserts no un-ledgered owner instruction.
- **Finding 2 — Minor (test coverage).** `CRITICAL_SCALARS` in `tuning_dao.test.ts`
  pinned only 14 of the 20 plan-§10 scalars; the other six were still validated
  only against the implementation's own constant — the exact weakness m2 set out
  to close, left partially open. **Disposition:** applied in this fix set —
  extended to all 20 §10 scalars (renamed `PLAN_SCALARS`) plus a completeness
  assertion that the pinned set equals the seeder's scalar-key set.

## Observations (not findings)

- The `onBusyRetry` seam is the one piece of production code existing solely for
  test observability; minimal, documented, no-op in production, so defensible.
- Retaining `'mechanical'` in the Phase A CHECK is dead-in-Phase-A enum machinery,
  but it pre-dates this change, is forced by SQLite's inability to ALTER a CHECK
  without a table rebuild, is runtime-rejected, and is documented in AD-4.
