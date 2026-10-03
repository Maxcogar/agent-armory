# Branch audit — batch B5, coordinator verification and final verdicts

Batch 5 is commits 22–29 of `git rev-list --reverse de66831..HEAD`: the plan
pass's architecture fixes and their reviews, then the fixes applied from those
reviews. It is 325 units. The batch was audited in timeline order, in three
parts:

| Part | Commits | What the commits did | Units |
|---|---|---|---|
| **5a** | `db9ecf9`, `64f710a`, `6779cd5`, `893b9cd`, `6cff0ce` | architecture fixes raised by the plan pass; plan following them; the plan pass's two reviews; architecture fixes from those reviews | 46 |
| **5b** | `8162f00` | plan fixes from the plan-pass reviews | 270 |
| **5c** | `0676431`, `c41265c` | architecture adopting the plan's three raised flaws; §16, STATUS and collapse-log | 9 |

5b's 270 hunks were split into two halves and audited in parallel. The halves
are called H1 (h1–h135) and H2 (h136–h270).

Every part has a first audit (Fable 5.1), a second opinion (Opus 5.5) and an
adjudication (a fresh Fable 5.1). 5b has one adjudication covering both halves.
Each part was adjudicated with the earlier parts settled.

## What the coordinator checked, and what it showed

- **Mechanical checker.** Every run passed coverage, fields, verdicts, every
  repo quote, and every web quote fetched and matched:

  | File | Entries | Units covered |
  |---|---|---|
  | 5a | 27 | 46 of 46 |
  | 5b H1 | 27 | 135 of 135 |
  | 5b H2 | 32 | 135 of 135 |
  | 5c | 8 | 9 of 9 |

- **Quotes in the second opinions and adjudications.** Checked with the
  checker's own matching. Every one is exact and none is invented.

  | File | Repo quotes | Web quotes |
  |---|---|---|
  | 5a second opinion | 71 | 14 |
  | 5a adjudication | 50 | 16 |
  | 5b H1 second opinion | 66 | 12 |
  | 5b H2 second opinion | 96 | 4 |
  | 5b adjudication | 71 | 7 |
  | 5c second opinion | 48 | 3 |
  | 5c adjudication | 57 | 4 |

- **Two miscounted reports.** Two second-opinion hand-backs miscounted their own
  overturns. Each commit message records the count taken from the file's
  sections:
  - 5a said 7; its sections overturn 5 (`62b81d2`).
  - The earlier batch-4 part 3 case is recorded in `cedddd3`.

- **Executed claims the coordinator reproduced** (git 2.43.0, Node 22.22.2,
  SQLite 3.51.2):
  - **Tokenizer order.** NFKD normalises `x⑴y` to `x(1)y` and `x¼y` to
    `x1⁄4y`. FTS5's `unicode61` and `ascii` tokenizers both re-split `x(1)y`
    into `1, x, y`. So split-then-normalise lets the fallback and FTS paths
    disagree; the fix is normalise first, then split.
  - **Watermark at a merge.** The repo is `a` → side `c2` → main `b` → merge
    `M` → `d`.
    - A full `--no-merges` stream reads `b c2 a`, so the newest non-merge
      commit is `b` and never equals `HEAD` (`M`): history stays "stale" for
      ever.
    - The next range `b..HEAD` reads `d c2`: `c2` is counted twice.
    - The range `M..HEAD` reads `d` only.
  - **Clock skew.** A child `b` is dated before its parent `a`. The default
    stream reads `b a r`, so a crashed pass that resumes from `b..HEAD` gets
    nothing, and `a` is never mined.
  - **Half-life claim.** Twenty co-changes a year old, then five solo changes,
    leave a weighted ratio of 0.667. The plan's "outweighed within about a
    year" is false.
  - **Exact re-base.** Moving the epoch forward three whole half-lives
    multiplies every stored sum by exactly 0.125. The rescaled sum equals the
    re-based sum bit for bit, and a confidence ratio is unchanged.
    - The epoch sat at the newest commit, with a 5-year horizon and h = 20 days.
    - The coordinator's first run put the epoch 40,000 days from the commits
      and raised `OverflowError`. That is the failure a fixed, distant epoch
      produces, and it is why the epoch belongs near `refTs`.

## Final verdicts

| Part | Keep | Replace | Remove | Undetermined | Entries |
|---|---|---|---|---|---|
| 5a | 6 — E-2, E-4, E-13, E-15, E-16, E-26 | 21 | 0 | 0 | 27 |
| 5b H1 | 15 | 12 | 0 | 0 | 27 |
| 5b H2 | 11 | 21 | 0 | 0 | 32 |
| 5c | 2 — E-3, E-8 | 6 | 0 | 0 | 8 |
| **Batch** | **34** | **60** | **0** | **0** | **94** |

Each part's adjudication file gives, for every contested entry, the ruling and
the correction it implies.

## Rulings that settle a design question for the correction pass

1. **Watermark** (5b H1 E-9, H1 E-16, H2 E-4, H2 E-32). This replaces every
   earlier watermark statement.
   - The watermark is the `HEAD` resolved once when the pass starts, merge or
     not. It is keyed to the mined ref (batch 4) and written only in the pass's
     final transaction.
   - The next range is `<tip>..<new HEAD>`, or `HEAD --not <tips>`.
   - A crashed pass re-runs its recorded range and skips hashes already in
     `commits`.
   - `historyStale` means "mined tip ≠ HEAD".
   - T-13-5 gains a merge-at-boundary case and a clock-skew case. Crash timing
     is taken from the `commits` row count.
2. **Recency weights** (5c E-4, 5b H1 E-15).
   - The root-cause design is a re-based epoch kept near `refTs`. When the epoch
     advances, stored sums are rescaled by the exact common factor
     2^(−Δ/h). With whole half-lives that factor is a power of two.
   - It needs no re-mine and no calendar-derived floor on `h`. The only floor
     is underflow, h above about 1.79 days.
   - Commit timestamps are capped at `refTs`, because the plan reads the author
     date (`%at`), which any commit can set.
   - "< 1000" and "before 2100" are dropped.
   - The later Step 13 review (`c31d87e`, batch 7) moved to a re-based epoch.
     Batch 7 judges that change against this ruling.
3. **Search storage** (5a E-18, 5c E-1, E-2).
   - Normalise before splitting, so tokens are letters and digits only.
   - Use a named pass-through FTS5 tokenizer (`ascii`).
   - Store one row per token in both `symbol_tokens` and `path_tokens`, with
     paths tokenized, not segmented.
   - Write fallback tables only under `fts_state = 'fallback'`.
   - Record the `_`/`$` reason.
4. **Stale recovery of the write claim** (5a E-10).
   - The claim row fixes the check-then-act race.
   - Stale recovery must be chosen by written comparison. One option is an
     OS-released lock on a separate SQLite database, reproduced as released on
     `SIGKILL`. The other is pid reclaim, stating its pid-reuse and `EPERM`
     cost.
   - AD-26's "the handler never waits on it" is reconciled (batch 3).

## Correction items this batch adds

These are for the single correction pass.

1. **Watermark and pass rule** — ruling 1.
2. **Recency** — ruling 2.
3. **Search** — ruling 3.
4. **Write claim** — ruling 4.
5. **AD-23.** Rewrite items 3–4 (5a E-1). "Fail-closed on PreToolUse" is false.
   Word the timeout as "output discarded; nothing the oracle wrote survives",
   not "silently / no trace".
6. **Host-CLI session isolation** (5a E-25). Verify non-attachment on each
   invocation: the child's `session_id` must differ from the parent's. Fall to
   degraded mode on a match.
7. **Session arming** (5a E-24, 5b H1 E-18, H2 E-17, H2 E-21).
   - Apply batch 4's settled rule everywhere: arm the single open session.
     When several are open, list them in plain language (last activity time and
     working directory) and ask for `--session`.
   - Always print which session was armed.
   - `latestSession()` and its T-9-1 clause go.
8. **Read-set report** (5a E-17, 5b H1 E-24, H2 E-5, H2 E-6, H2 E-7). Add
   `rebuild_recovered_nothing` for `set = 'read'`. Name the unestablishable
   cases: an unpaired `tool_use` and an orphan `tool_result`. T-28-11 gets a
   read-set fork case.
9. **Import** (5a E-23, 5b H2 E-18, H2 E-19).
   - The architecture states the phase-2 copy.
   - Crash detection reads surviving `.import-tmp` files at the next run.
   - Give the write order a reason.
   - Test `partial_write`.
10. **Unresolved HEAD** (5b H2 E-4). Set both staleness flags true (dampen),
    with a bar-specific reason.
11. **Regret pass** (5b H2 E-14). Add an `uptoSeq` bound, or use one read
    transaction.
12. **Tests that pass while wrong** (5b H2 E-3, E-26, E-32, H1 E-25):
    - T-28-9 exact listing paths;
    - T-18-1 Orientation evidence fields;
    - T-13-5 merge and skew cases;
    - Step 28 replay-coverage claims corrected.
13. **Records.**
    - §16 "now resolved" re-judged after the plan follow (5c E-5).
    - STATUS lists the owed plan-follow pass first (5c E-7).
    - Correct STATUS's "every finding held" and "follows the architecture" (5c
      E-6).
    - Mark seeds `bar.stale_factor` and `bar.hazard_full_support` as seeds
      (5a E-20, E-22; 5b H1 E-15).
    - Add §10A collapse tests to the schedule (5a E-12).
    - Correct the D-plan-39/42 records (5b H2 E-6, H2 E-24).
    - Record the collapse-log recurrence (5a E-27).
    - Correct PG-5 (5b H2 E-30).
    - Correct the D-plan-7 half-life clause (5b H2 E-16).
14. **Stop-time done-claim counter** (5b H2 E-9). Run the recogniser and record
    the counter at a continuation Stop, or state the reason.

## Questions for Max Cogar

None new from this batch. Still open from earlier batches:

1. Has Max Cogar ever run `ctxoracle init` on any of his own machines? (batch 4)
2. The FR-O2/C-4 wording and the "about to run" premise of FR-A2d, AC-1c and
   §5.1. (batch 3)
