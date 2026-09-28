# Branch audit — batch B7, coordinator verification and final verdicts

Batch 7 is commits 36–51 of `git rev-list --reverse de66831..HEAD`: Step 13, the
co-change miner. It covers the plan changes before the build, the build, its
independent review, and the fixes from that review. It has 113 units, in three
parts:

| Part | Commits | Content | Units |
|---|---|---|---|
| **7a** | `a02adc0`, `e903eda`, `9823853`, `277b0a2`, `57bdd4a` | plan changes; the Step 13 build | 36 |
| **7b** | `f39769a`, `c31d87e`, `55fe887`, `21b8721`, `821c835`, `876afa3`, `e4b4455`, `e70536e`, `6d6f21d` | independent review with hand mutation tests; architecture and plan fixes | 59 |
| **7c** | `6bbda1d`, `7800246` | code fixes; STATUS "Step 13 built and reviewed"; collapse-log entry | 18 |

**Models.**
- 7a's first audit ran on Fable 5.1, its second opinion on Opus 5.5.
- Fable 5.1 then ran out of usage credits (API 429).
  - Max Cogar directed on 2026-09-28: "then dont use fable. use 5.5 for the
    rest".
  - Every later role ran on Opus 5.5: 7a's adjudication, and all three roles
    for 7b and 7c.
- **The cost, stated to Max Cogar once:** the first audit and the second
  opinion no longer come from different models, so their errors are more
  likely to be shared.
  - Each role is still a fresh agent with only the earlier files as input.
  - The coordinator still re-checks every quote and reproduces key claims.

All execution ran on scratch extractions (`git archive <commit>`) and throwaway
repositories. This repository was never checked out or modified by an auditor.

## What the coordinator checked, and what it showed

**Checker runs on the first audits.** Every run passed coverage, fields,
verdicts and every quote:

| Part | Entries | Units covered |
|---|---|---|
| 7a | 29 | 36 of 36 |
| 7b | 25 | 59 of 59 |
| 7c | 18 | 18 of 18 |

**Quotes in second opinions and adjudications.** Checked with the checker's own
matching (`qcheck.py`). Every quote is exact.

| File | Repo quotes | Web quotes |
|---|---|---|
| 7a second opinion | 55 | 7 |
| 7a adjudication | 73 | 9 |
| 7b second opinion | 59 | 5 |
| 7b adjudication | 60 | 6 |
| 7c second opinion | 52 | 5 |
| 7c adjudication | 51 | 11 |

**Executed claims the coordinator reproduced** (git 2.43.0, Node 22.22.2):

- **`--reference` reverts (7a E-17).**
  - `git revert --reference --no-edit` on a real change writes the body "This
    reverts commit 5705ebf (add feature, 2026-09-28)."
  - The built `isRevertLabelled` returns `false` for it.
- **Log encoding (7b E-9, E-10).** With `-c i18n.logOutputEncoding=UTF-16`,
  `git log --format=%s` emits UTF-16 bytes (`377 376 h \0 …`).
  `--encoding=UTF-8` restores `h 303 251 l l o`.
- **Underflow floor (7b second opinion, E-6).**
  - 365.25·5/1022 = 1.787 days, ruling 2's layout, which matches "about 1.79".
  - 365.25·5/1522 = 1.1999 days.
  - `2**-1073.5/2**-1073` = 0.5, while `2**-1000.5/2**-1000` = 0.7071. So the
    subnormal limit loses the ratio, and the normal-double limit is the right
    criterion.
- **No inter-chunk yield (7c).**
  - `cochange.ts` at `HEAD` has no `setTimeout`; its only `await` is
    `streamGitLog`.
  - Batch 3's settled ≥ 25 ms yield is therefore absent.
- **STATUS timing (7c E-16).**
  - `6bbda1d` was committed at 06:32:01Z and `7800246` at 06:32:17Z.
  - STATUS's "2.4 s" (STATUS L308) has one source: the pre-fix entry's
    "2,398 ms" (implementation-log L1076).
- **Missing error channel (7b E-24).** `src/cli/index.ts` has `try`/`finally`
  and no `catch`.
- **Detached stderr (7c E-4).** `spawn.ts` L87–L92 sets `stdio: 'ignore'`
  whenever `detached` is true, so a requested `stderr: 'pipe'` is dropped.

## Coordinator errors, recorded

1. **The hooks claim.** On 2026-09-28 the coordinator told Max Cogar that the
   hooks documentation and a test disagree. The test had hit a validation
   rejection, not a permission denial. The correction and the further test are
   in `2026-09-28-branch-audit-hook-context-permission-denial.md`.
2. **Batch 3's yield, written as present.** 7b's adjudication (L376) says the
   miner yields at least 25 ms between chunks. 7c's first audit and its
   adjudication found this false: neither build has any yield. The coordinator
   passed that sentence without checking it against the code.

## Final verdicts

| Part | Keep | Replace | Remove | Undetermined | Entries |
|---|---|---|---|---|---|
| 7a | 10 — E-2, E-7, E-9, E-11, E-12, E-13, E-15, E-18, E-20, E-25 | 19 | 0 | 0 | 29 |
| 7b | 11 — E-4, E-8, E-12, E-14, E-15, E-16, E-17, E-18, E-20, E-22, E-25 | 14 | 0 | 0 | 25 |
| 7c | 6 — E-2, E-3, E-7, E-8, E-9, E-14 | 12 | 0 | 0 | 18 |
| **Batch** | **27** | **45** | **0** | **0** | **72** |

## Defects still present at HEAD (for the correction pass)

The adjudications state each item as reproduced on a scratch build of `HEAD`.

1. **Watermark and pass completion** (ruling 1 is not built).
   - The per-chunk watermark loses a commit under clock skew (7a E-1).
   - An unreadable middle commit of an incremental range is lost for good
     while the watermark claims `HEAD` (7b E-13).
   - An incomplete full pass leaves the watermark at `HEAD` with
     `mining_in_progress` still `'1'` (7c E-1).
   - The completeness check counts headers, not entries.
   - Fault attribution records `after: <hash>`.
2. **Unreadable and out-of-range commits** (7c E-1).
   - A commit with an empty `%at` makes every pass a purged full re-mine, with
     faults growing 2, 4, 6. It needs a visible end rule.
   - A 20-digit `%at` crashes every pass with no fault. Reject values above
     `MAX_SAFE_INTEGER`.
3. **Parser leak** (7b E-2, E-23; 7c E-6).
   - A malformed header credits the next commit's entries to the previous one,
     fabricating pairs. Resynchronise at the next valid header.
   - Entries read before the fault stay with their commit.
   - One fault item per skipped run.
   - Add test rows for `''` and `0x…` dates.
4. **Recency** (ruling 2 is only partly built; 7b E-6, E-7, E-10; 7c E-10).
   - The `refTs − 500·h` and exponent-1000 constants go.
   - The floor is the relation h ≥ 365.25·`horizon_years`/1022, enforced by
     `tune`.
   - A zero weight needs a read rule, because 0/0 is NaN and the confidence
     gate drops it silently.
   - Weights reach 0 silently when `refTs` moves back.
   - `refTs` comes from `%ct`: an empty value reads as 0, and a far-future value
     horizon-excludes all history. Both must be validated, with a fault.
5. **git behaviour** (7a E-16, E-17, E-22; 7b E-9, E-10).
   - `--encoding=UTF-8` on every log call, including the `refTs` read.
   - Remove the `GIT_CONFIG_*` inheritance.
   - The silent `rev-parse` exit.
   - `merge-base` exit 128 must be a git fault, not a purge.
   - Horizons on incremental passes.
   - Shallow and graft roots fabricate pairs.
   - `--reference` revert messages.
   - A test pinning `--no-merges`.
6. **Fixture isolation** (7a E-21). The generator inherits `GIT_DIR`,
   `GIT_WORK_TREE` and `GIT_CONFIG_*`, and wrote five keys into the outer
   repository's config.
7. **Locking.**
   - The ≥ 25 ms inter-chunk yield is absent.
   - The 5,000 ms off-path wait is unsourced and is really about 10 s, through
     the adapter's retry-once (7b E-21; 7c E-3, E-5).
   - Root cause: T-13-5b's append loop writes with no gap, which starves
     SQLite's busy handler. The writer should model the handler's cadence,
     and the off-path timeout should be derived.
   - `busyTimeoutMs` is untested: add a `PRAGMA busy_timeout` read-back and
     `RangeError` cases (7c E-13).
8. **Error channels.**
   - The `index` verb has no `catch`, so a failed detached reindex records no
     fault (7b E-24).
   - `detached: true` silently drops a requested stderr pipe. Throw on that
     combination (7c E-4).
9. **Tests that pass while wrong.**
   - T-13-3's pair clause is vacuous (7a E-28).
   - T-13-6e asserts the per-chunk watermark.
   - T-13-1o claims four flags; the `--no-textconv` leg is dropped, because
     textconv never runs for `--numstat` (7c E-11).
   - The trailer regex's exactness is untested.
   - The m1 snapshot rule is untested.
   - R-6's unrelated 500-constant assertion.
   - R-7's title.
10. **Records.**
    - STATUS "Step 13 built and reviewed" is false: `6bbda1d` was never
      independently reviewed (7c E-16, E-17).
    - "Waits 5 s" is really about 10 s.
    - "2.4 s" is the pre-fix build's time.
    - The implementation log's "pending independent review" heading and its
      false `commitsSeen` sentence (7c E-15).
    - The review's dropped M3 clamp count, m3 per-pass cap, M1 object-format
      read and `--no-relative` (7b E-1).
    - The collapse-log's "the fix was right for its purpose" (7c E-18).
    - The first audit's off-by-one cross-references (7b).

**Fixed at HEAD:** the miner's inherited `GIT_DIR` (`gitChildEnv`, `7fdbd7e`,
judged in batch 8), and the items each adjudication names.

## Questions for Max Cogar

None new. The earlier "has Max Cogar run `init`" question is withdrawn; see
`2026-09-28-branch-audit-coordinator-rulings-schema-and-edit-timing.md`. Still
open: his sign-off on the FR-O2 / FR-A2d / AC-1c wording.
