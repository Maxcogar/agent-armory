# Expert Review — Checkpoint-1 fix set (Post-fix, Round 2)

*Independent expert-review, dispatched to a neutral general-purpose subagent per
`.claude/skills/expert-implement/references/review-handoff.md` (mechanical-only
dispatch: file list + plan path + "run /expert-review", no steering). Reviews the
fix set for the 7 findings in `2026-09-19-checkpoint-1-implementation-review.md`.
Scope = `git diff origin/main -- middleware/context-oracle/` (11 files); base
`origin/main`, HEAD `8d53bf9`. Written once, never edited.*

## Verdict

**PASS.** All seven Round-1 findings (M1, M2, M3, m1–m4) are closed against their
originally named standards, verified against current source (not against STATUS's
claims). No new findings, no regressions introduced by the fix set. Independent
state confirmation (Node v22.22.2): `npm ci` clean, `npm run build` clean,
`npm test` = 41 pass / 0 fail; all four plan gates pass (`derive-plan-sections
--check` regions current, `--self-check` 34/34, `run-plan-probes` 27/27,
`check_docs.py`).

## Convergence record

- Round 2 (Round 1 = the 2026-09-19 checkpoint-1 review). A review attempt
  between Round 1 and this one was **retracted as protocol-contaminated** (steered
  dispatch) and is not counted as a round.
- Trajectory: R1 = 7 (3 Moderate, 4 Minor) → R2 = 0.
- Tripwire NOT fired: new+regression (0) ≥ closed (7) is false; findings strictly
  decreased (7 → 0).

## Finding closure (verified against current source)

- **M1** — `trust.ts:44-59` `assertProvenance` throws unless a non-human input is
  `untrusted_repo`; `files.ts:50` routes through `provCreateValues`. T-9-1 pins the
  non-human→`mechanical` rejection (green). Prose reconciled in Step 6/9/§12 and
  AD-4; grounded in FR-X2 (Phase A composes no mechanically-generated content).
  grep confirms no `src/` writer emits `trust='mechanical'`.
- **M2** — `adapter.ts:70-108` fires `onBusyRetry` only on `attempt===0` (exactly
  once; no-op when `opts` omitted). T-3-3 forces the retry-then-succeed path by
  construction (A holds through B's first attempt). Green.
- **M3** — the three files are in §5.1 and their step `create:` lists; derive
  `--check` regions current.
- **m1** — Step 1 prose states the fixture deliverable is intentionally partial;
  deep scenarios deferred to consuming Steps 13–38.
- **m2** — T-12-1 pins load-bearing seeds to §10 literals; T-1-3 pins
  `FIXTURE_NAMES` to a §5.1 literal list (27 names).
- **m3** — T-11-2 negative case is `getUserProfileByEmailAddress` (28 chars,
  independently computed 3.9677 bits/char, < 4.0 threshold → not redacted).
- **m4** — all seven interfaces declared in owning steps and match code.

## What the reviewer flagged as good

- M2's determinism-by-construction (the seam removes timing dependence entirely).
- M1's fail-closed single-entry-point gate (all learned-record writes funnel
  through `provCreateValues`→`assertProvenance`; structurally non-bypassable).
