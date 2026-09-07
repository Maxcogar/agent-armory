# Independent collapse-hunt — Phase A implementation plan, round 10 (2026-09-07)

**Artifact:** `docs/plans/plan-phase-a.md` (7196 lines, read in full this
session across sequential `Read`/`Grep` passes with no gaps in the
sections load-bearing on this round's scope: 1–500 (file skeleton), 935–1024
(Step 5), 1450–1470 (Step 14 length-floor cross-ref), 1868–2150 (Steps
20–23, tuning defaults), 2900–3040 (Steps 37–38), 3461–3600 (§10
D-plan-1..8), 3602–4170 (§10A D-plan-1..8, plan-level entries, N1–N6),
4186–4510 (§11.1–11.5, including the full §11.4 external-claims list),
5020–5280 (T20-1, T21-*, T37-*, T38-1 test specs), 6379–6760 (§14
question register, §14.4 reconciliation sweep, §15 gap-register head)
— plus targeted `Grep` sweeps across the full 7196 lines for every
"six numbers"/"seven number"/`lock_stale_ms`/`ulid`/step-citation
pattern relevant to this round's findings — at its current state on
branch `claude/plan-correction-strategy-57ot28`, commit `ed9f917`
("context-oracle: fix round-9 collapse-hunt and expert-review
findings"), confirmed via `git log --oneline -5` and `git log -1
--format="%H %ci"` this session before any line citation below.

**Axis:** mission-fidelity (`CLAUDE.md` dominating rule 3 and rule 2's
collapse test); re-verification of round 9's own closure claims by
literal re-execution of round 9's fix mechanisms against the exact
scenarios round 9's own findings named (per the task brief and per
round 9's own closing lesson: "a fix-pass annotation claiming closure
is itself an unverified claim until the exact scenario the original
finding named is re-executed against the fix's literal text");
continued generalization of the execute-don't-assume method,
prioritized toward silent defects over self-revealing ones; attack on
every §10A collapse-test; a check for new load-bearing decisions in §7
lacking a formal §10A entry (the brief's named candidate:
`reindex.lock_stale_ms`, added round 9).

**Reviewer:** independent subagent, no prior context on this session,
not the author of the plan, any prior fix pass, or any prior review of
it.

**Read in full before the attack:** `middleware/context-oracle/CLAUDE.md`
(full); `docs/collapse-log.md` (full, both pages — all 2026-09-07
entries read closely, rounds 3 through 9 especially; 2026-07/2026-08
entries read for pattern history); `docs/STATUS.md` (full);
`OWNER-LEDGER.md` (full); `docs/specs/spec-context-oracle.md` §8,
§11.5, §12, §13, §14 (in full, plus §9's standards table and §10's
decision list for citation cross-checks); `docs/architecture-phase-a.md`
AD-2, AD-3, AD-4, AD-5, AD-9 (partial — the state schema and Phase-B
seam), AD-10, AD-13, AD-14, AD-20, AD-24, AD-25, AD-26 (all in full);
both round-9 review documents in `docs/reviews/` in full
(`2026-09-07-round-9-plan-collapse-hunt.md`,
`2026-09-07-round-9-plan-expert-review.md`); `docs/plans/plan-phase-a.md`
end to end per the read ranges above, which is every section this
round's method touches — Steps 1–43's bodies were spot-read via grep
for every citation this round's findings depend on (confirmed no
additional occurrence of the patterns searched below), rather than
re-read line-by-line where round 9's own two review documents already
attest to a full sequential read at the prior commit and no
intervening commit besides round 9's fix pass touched those sections.

**Verification instruments used beyond reading.** A live shell, git
2.43 (this sandbox's system git), Node.js v22.22.2. Specifically:

- Three real git repositories constructed from scratch and executed
  against with `git log --no-merges --numstat -M` to reproduce, from
  real command output (not recalled from memory or from round 9's own
  citations), the exact three rename scenarios the task brief names:
  a same-directory rename (`a.txt`→`b.txt`), a cross-directory rename
  (`src/utils/`→`src/other/`), and a plain dissimilar-name rename
  moved to a different, unrelated path (`src/other/b.txt`→
  `renamed_totally.txt`). Two further constructed scenarios beyond the
  brief's three: a multi-level rename with both a common prefix and a
  divergent multi-segment middle (`a/b/c/d.txt`→`a/x/c/e.txt`), and a
  rename of a file whose name literally contains `{`/`}` characters
  (a legal, if unusual, POSIX filename).
- A literal, unmodified transcription of Step 20's own two-step
  detector (`^(.*)\{(.*) => (.*)\}(.*)$` then `^(.*) => (.*)$`) as
  runnable JavaScript, executed against every one of the above real
  `--numstat` output lines — not a paraphrase of the regex, the exact
  patterns quoted in the plan text.
- A literal, unmodified transcription of Step 37's full described lock
  sequence (`O_CREAT|O_EXCL` acquire; `finally`-block `unlinkSync`
  release on completion; `EEXIST`→`stat` mtime check→conditional
  unlink-and-retry-once on staleness) as runnable JavaScript against a
  real filesystem, executed through four scenarios: (1) acquire a
  fresh lock; (2) a completed run releases it; (3) a second attempt
  while the first still holds a *fresh* (non-stale) lock is correctly
  refused, not stolen; (4) a lock abandoned by a simulated crashed
  process (mtime backdated past the threshold) is correctly detected
  as stale and reclaimed.
- A fifth, hand-interleaved execution of the same literal lock
  sequence, run as two "processes'" operations manually ordered to
  reproduce a specific race: both processes observe the same stale
  lock, both pass the staleness check, and both then run the
  unlink-and-retry-once reclaim step in an order chosen to test
  whether the algorithm *as specified* is race-safe, not whether
  Node's single-threadedness happens to serialize it by accident (it
  does not — the two syscall sequences interleave exactly as two real
  OS processes' would, since nothing in the specified algorithm
  synchronizes them against each other).
- `git rev-parse --is-inside-work-tree` re-executed against a freshly
  constructed non-git directory and a freshly constructed bare
  repository, to re-verify round 9's new §11.4 entry on this exact
  claim from scratch rather than trusting the citation.

## Verdict: DOES NOT SURVIVE (one new Serious collapse, silent; one new missing-collapse-test finding tightly coupled to it; one new Minor residual; round 9's four closure items otherwise hold)

- **Round 9's closure items independently re-verified genuinely
  closed, by re-execution against the exact scenarios round 9's own
  findings named — not by re-reading round 9's "corrected this fix
  pass" prose:**
  - **(a) Step 20's two-step brace/plain rename detector**
    (`docs/plans/plan-phase-a.md:1881–1890`) correctly resolves all
    three scenarios the task brief and round 9's own fixture (`T20-1`,
    §12) name: a same-directory rename, a cross-directory rename, and
    a plain dissimilar-name rename with no shared prefix/suffix — each
    produces the real pre-rename and post-rename paths, verified by
    executing the plan's literal two regexes against real
    `git log --numstat -M` output from three freshly constructed
    repositories (see Collapse 3 below for where this genuinely closed
    fix nonetheless has an unclosed residual on a narrower input).
  - **(b) Step 37's lock mechanism** (`docs/plans/plan-phase-a.md:2915–2951`)
    correctly executes acquire → completed-run release → fresh-lock-
    not-stolen → stale-lock-reclaimed as four independent, literal
    executions against a real filesystem — every one passes exactly as
    specified (see Collapse 1 below for the race the *staleness
    reclaim* step itself introduces when two such sequences overlap in
    time, which is a different scenario from any of round 9's four
    named acceptance cases and from `T37-3`'s three fixture cases).
  - **(c) Both of round 9's new §11.4 entries**
    (`docs/plans/plan-phase-a.md:4452–4482`) are accurate: re-executing
    `git rev-parse --is-inside-work-tree` against a fresh non-git
    directory reproduced `fatal: not a git repository…`, exit 128, no
    stdout — never the literal string `false` — and against a fresh
    bare repository reproduced stdout `false`, exit 0, exactly as
    claimed; re-executing `git log --numstat -M` against three fresh
    rename scenarios reproduced the exact brace/plain shapes the entry
    cites, including the same-directory case triggering brace
    compaction.
  - **(d) `T20-1`'s fixture spec** (`docs/plans/plan-phase-a.md:5027–5065`)
    matches what round 9's fix actually requires: it plants both a
    plain-form rename (`aaa_file.txt`→`bbb_file.txt`, no shared
    prefix/suffix) and a brace-form rename, and its "Fails when" clause
    explicitly names both "ingested as a literal path" and "silently
    dropped" as failure modes for either renamed commit. **`T37-3`'s
    fixture spec does *not* match what round 9's fix actually
    requires** — see the missing-collapse-test finding below, which is
    the direct consequence of this gap.

- **One new Serious collapse (silent), in round 9's own new content:**
  round 9's fix for "the lock is never released" (correctly closing
  round 8's finding) introduced a staleness-reclaim step that itself
  contains an unsynchronized check-then-act race: when two
  `refreshIfStale` triggers encounter the *same* abandoned, stale lock
  within the same narrow window, both can pass the staleness check,
  both unlink-and-recreate, and both end up believing they hold the
  exclusive lock — after which the first one's own `finally`-block
  release (working exactly as round 9 specified) deletes the *second*
  process's lock file out from under it, allowing a third trigger to
  acquire cleanly while the second reindex is still actually running.
  Verified by literal, hand-interleaved execution of round 9's own
  described algorithm, not by inspection. Silent: no error anywhere in
  the sequence; `AD-26`'s stated invariant ("the detached reindex
  takes a directory lock; the handler never waits on it") is violated
  without any of the participants observing it.

- **A second finding, structurally tied to the first: the new
  `reindex.lock_stale_ms` load-bearing decision (added round 9) has no
  §10A collapse-test of its own, and the one entry that could plausibly
  cover it (N3/N4) was not updated to include it despite Step 23's own
  body text being corrected in the same fix pass to say "seven" not
  "six."** This is the exact "fix landed at its primary site, not
  swept to every cross-referencing surface" pattern `docs/collapse-log.md`
  has logged in six of the last seven rounds (rounds 2–8), now
  recurring inside round 9's *own* new content, on the exact decision
  the task brief flagged as a candidate. Had this collapse-test been
  written, its "hardest question" is very plausibly the race found
  above — a staleness-threshold value's only real job is arbitrating
  concurrent reclaim attempts, and no other place in the document asks
  what happens when two reclaim attempts land inside that window.

- **One new Minor residual** (not a re-opened collapse — round 9's fix
  is genuinely correct for every scenario it was built to close): the
  brace-form regex, when a filename contains a literal `{` or `}`
  character (rare but legal on POSIX filesystems), can mis-parse and
  silently produce a corrupted new-path string. Below the threshold of
  a Serious finding given its rarity, but silent and outside `T20-1`'s
  fixture set.

Round 8's and round 9's fixes are otherwise correctly closed. Every
other §10A collapse-test re-attacked this round survives; no third
new collapse was found.

---

## Collapse 1 (Serious, silent) — round 9's stale-lock reclaim step is not race-safe against a second concurrent reclaim of the same abandoned lock, and can hand two live reindex processes the belief that each holds sole ownership

**Where.** `docs/plans/plan-phase-a.md:2938–2948` (Step 37's numbered
release/staleness sub-steps, added round 9); the same gap is present
in `T37-3`'s fixture spec at `docs/plans/plan-phase-a.md:5242–5266`
and in `AD-26`'s stated invariant
(`docs/architecture-phase-a.md:1656–1657`: "The detached reindex takes
a directory lock; the handler never waits on it").

**What the plan says.** Step 37, sub-step 2 (as corrected round 9):

> If lock acquisition fails with `EEXIST`, read the existing lock
> file's mtime. If it is older than `reindex.lock_stale_ms` (default
> 600000ms / 10 minutes)… treat it as abandoned by a crashed process:
> unlink it and retry acquisition once. If the retry also fails, or
> the lock is not stale, skip this reindex attempt silently… no PID
> liveness check is needed beyond the mtime threshold, since this is
> a single-host, single-user tool with no cross-machine lock
> contention to distinguish "still running" from "crashed" more
> precisely than elapsed time.

And sub-step 1: "On completion of the detached reindex… unlink the
lock file via `fs.unlinkSync(lockPath)` before the process exits."

**What's wrong.** The reclaim sequence is a classic unsynchronized
check-then-act (TOCTOU): "read mtime, decide stale, unlink, recreate"
has no step that verifies, at unlink time, that the file being removed
is *still the same stale lock just inspected* rather than a lock a
concurrent reclaimer already recreated a moment earlier. When two
`refreshIfStale` triggers arrive close together (plausible in this
tool's own architecture: multiple hook events across possibly
overlapping sessions, per `AD-26`'s own opening sentence — "Hooks can
run in parallel") and both find the *same* abandoned lock inside the
staleness window, the following literal interleaving of the plan's own
specified steps is possible and was reproduced by direct execution
(script: see Attestation):

1. A crashed process's lock is present, mtime older than
   `reindex.lock_stale_ms`.
2. P1's `tryAcquire()` → `EEXIST`. P2's `tryAcquire()` → `EEXIST`.
3. P1 `stat`s the lock, sees it stale. P2 `stat`s the same lock, also
   sees it stale (neither has changed the file yet).
4. P1 `unlinkSync`s it, then `tryAcquire()`s → succeeds. **P1 now
   believes it holds the exclusive lock.**
5. P2 `unlinkSync`s the path — but the file at that path is no longer
   the original stale lock; it is the one P1 created one line ago in
   step 4. P2's unlink succeeds anyway (the syscall has no way to
   distinguish "the lock I inspected" from "whatever is at this path
   now"), silently deleting P1's live lock. P2 then `tryAcquire()`s →
   succeeds. **P2 now *also* believes it holds the exclusive lock.**
6. P1 finishes its reindex and runs its `finally`-block release exactly
   as specified: `closeSync` + `unlinkSync(lockPath)`. This deletes
   the file P2 is depending on — **while P2's reindex is still
   actually running**, and P2 has no way to detect this (its own file
   descriptor from step 5 stays open; nothing signals the deletion).
7. A third trigger, P3, now arrives. `tryAcquire()` succeeds cleanly
   (no lock file exists). **P2 and P3 now run their reindexes
   concurrently, fully unlocked, for however long P2's run has left.**

Executed directly (Node v22.22.2, real `fs` calls against a real
tempdir, hand-interleaved to force exactly this ordering): both P1 and
P2 successfully acquire (`fd !== null`) at step 4/5; after P1's release
the lock file is absent (`fs.existsSync` → `false`) while P2's own file
descriptor is still open and P2 believes it is mid-run; P3's
subsequent `tryAcquire()` succeeds. This is not a hypothetical — it is
the literal algorithm from Step 37's own text, executed.

**Why "single-host, single-user, no cross-machine contention" does
not close this.** The plan's own stated reason for skipping a PID
liveness check ("no cross-machine lock contention to distinguish
'still running' from 'crashed' more precisely than elapsed time") is
answering a different question than the one this race asks. The race
above needs no cross-machine anything: it is two processes *on the
same host*, both legitimately triggered by the tool's own normal
operation (two `PostToolUse`/`refreshIfStale` events close together,
per `AD-26`'s "hooks can run in parallel"), both encountering the same
already-abandoned lock inside the same staleness window. A PID
liveness check would not close this gap either — the race is not
about telling a live process from a dead one, it is about two
reclaimers of the *same* dead lock stepping on each other. The correct
fix is a reclaim primitive that only removes the lock it actually
inspected — e.g. `rename()` the suspected-stale lock to a
reclaim-specific temp path first (an atomic operation that only one
racer can win) and only proceed to recreate if that rename succeeded,
or write a token (owner-scoped identifier + timestamp) into the lock
file and re-verify that exact token is still present immediately
before unlinking it. Neither exists in the current text.

**What the fix should be.** Either: (a) make the reclaim atomic by
using `fs.renameSync(lockPath, lockPath + '.reclaiming-' + pid)`
instead of a plain `unlinkSync` — `rename` on the same filesystem is
atomic and only one concurrent renamer can succeed against a given
source path, so only the winner proceeds to `tryAcquire()`, and the
loser's rename throws `ENOENT` (the lock is already gone — meaning
another process is reclaiming or has reclaimed it) and correctly skips
silently, matching the plan's own existing "skip silently" fallback
semantics with no new failure mode; or (b) write a random reclaim
token into the lock file's content at inspection time and re-check
that exact byte content immediately before unlinking (more code, same
effect). Either requires a `T37-3` scenario that actually races two
reclaim attempts against the same stale lock (see the second finding
below — none of `T37-3`'s three cases do this).

**How verified.** Direct, literal execution of Step 37's own described
sequence, hand-interleaved in the exact order a real race could
produce (script retained; see Attestation). Not inferred from reading
the prose, and not assuming Node's single-threadedness would somehow
prevent it — the two sequences of real, blocking `fs` syscalls
interleave in this script exactly as two OS processes' would, because
nothing in the specified algorithm imposes any ordering between them.

**Why it matters.** This is precisely the class of defect this
project's own review lineage has repeatedly named as the most
dangerous: silent, not self-revealing (`docs/collapse-log.md`, round
8's entry: "a mishandled rename does not throw… corrupting the… signal
with no diagnostic, no crash, and… no test" — the identical shape
here, for the *lock*, not the miner). Two reindex processes racing
unlocked against the same `store.db` is a data-integrity risk
`AD-26`'s WAL/`busy_timeout`/retry-once machinery was designed to
handle for *ordinary* concurrent single-writes, not for two full
`runIndex` tree-walks each performing many writes over an extended
window with no serialization between them at the application level —
exactly the scenario the directory lock exists to prevent, and exactly
the scenario `AD-26`'s own sentence ("the handler never waits on it")
assumes cannot happen because the lock already prevents concurrent
detached reindexes. The failure mode this opens (index corruption
under concurrent rebuild) would surface, if at all, as unexplained
`symbols`/`import_edges` inconsistencies far downstream — the "false
floor reads identically to a true floor" shape the collapse-log's
round 8 entry already named for a different mechanism.

**Silent or self-revealing?** Silent. No exception, no log line, no
diagnostic fires anywhere in the sequence above; both processes
proceed as if uncontended.

---

## Collapse 2 — the new `reindex.lock_stale_ms` decision (round 9) has no §10A collapse-test, and the nearest existing entry (N3/N4) was not swept to include it despite its own primary site being corrected in the same fix pass

**Where.** §10A, entry `N3/N4` (`docs/plans/plan-phase-a.md:4056–4084`),
versus Step 23's own corrected body
(`docs/plans/plan-phase-a.md:2114–2141`).

**What the plan says.** Step 23's tuning-defaults list was corrected,
round 9, to read: *"Every one of these **seven** numbers is still a
Phase A calibration input… corrected this fix pass, round 9:
previously said 'six numbers,' now seven with `reindex.lock_stale_ms`
added"* (line 2133) — and explicitly notes `reindex.lock_stale_ms` is
*not* part of the exit-run calibration loop the other six are ("an
operational timeout, not a bar-tier signal," line 2135-2136). `T23-1`
(§12) was correctly swept to assert all seven (line 5141: *"all seven
defaults (six through round 8; `reindex.lock_stale_ms` added round
9)"*). But §10A's `N3/N4` — titled "Step 23 — bar defaults and
clearing length floor," the collapse-test whose whole job is to
interrogate exactly this class of unsourced tuning value — still reads,
unchanged since before round 9:

> Four of six numbers are AD-14 "illustrative" defaults and two
> (`reuse_dominance_k`, `clear_length_floor`) have no source at all —
> if the exit-run's per-genre counts are a function of **six**
> largely-unvalidated constants, how is Phase A's measurement anything
> other than an artifact of arbitrary starting values dressed as a
> finding?

`reindex.lock_stale_ms` is named nowhere in `N3/N4`'s four fields.

**What's wrong, and why simply re-counting to "seven" would not
actually fix it.** This is the exact "fix landed at its primary site
(Step 23's body, `T23-1`), not swept to every cross-referencing
surface" pattern `docs/collapse-log.md` has now logged in rounds 2, 3,
4, 5, 6 (6 instances at 8+ sites total, prior to this round) —
recurring here for the first time *inside a round's own new content*
rather than in older material that round's fix pass never touched.
But updating `N3/N4`'s count from "six" to "seven" would not actually
close the gap, because `N3/N4`'s own "Answer" field is scoped to the
exit-run calibration loop ("Step 42's exit-run is what actually
calibrates the four bar-tier values… the exit-run's per-genre counts
are conditional on these starting values until the first real-repo
tune") — and Step 23's own text says `reindex.lock_stale_ms` is
explicitly *not* part of that loop. A number outside the calibration
loop has no calibration mechanism at all, and `N3/N4`'s existing
"hardest question" and "answer" do not apply to it even in principle.
`reindex.lock_stale_ms` needed — and still needs — its *own* §10A
entry, not a bigger denominator in someone else's.

**What that entry's hardest question should have been, and why its
absence let Collapse 1 through.** A staleness threshold's only job is
arbitrating what happens when a reclaim attempt meets an already-held
lock. The single hardest question a mission-literate skeptic would
ask is exactly: *"What happens when two reclaim attempts land inside
the same staleness window?"* — because that is the one case the value
exists to govern and the one case single-process reasoning ("is 10
minutes long enough that a real index run never triggers a false
reclaim") does not cover. Writing this collapse-test honestly would
have required tracing that question to an actual answer, and the
actual answer — as Collapse 1 shows — is that the current mechanism
does not have one. This is not a hypothetical connection: it is the
same shape `docs/collapse-log.md`'s 2026-09-03 round-7 entry already
named generally ("when a round widens the deny-capable set, audit the
new members… not only the gap the change was made to close") — here,
a round that added a *new mechanism* (staleness reclaim) to close one
gap (lock never released) without writing the collapse-test that would
have forced asking whether the new mechanism itself is sound.

**How verified.** Read `N3/N4` in full at its current text (lines
4056–4084); grepped the full 7196-line document for every
occurrence of "six number"/"seven number"/"Four of six" (2 hits, both
inside `N3/N4` itself) to confirm no other surface silently duplicates
or corrects the stale count; cross-read against `T23-1`'s and Step
23's already-corrected text to confirm the sweep failure is isolated
to `N3/N4` and not also present elsewhere (it is not — `T23-1`, the
Step 23 body, and the Standards Registry line at §11.4's neighboring
text all correctly say "seven").

**Why it matters.** This is a second, independent instance of the
project's single most persistently recurring defect class (six
consecutive prior rounds), now demonstrated to be not merely a
paperwork gap but the actual reason a real, silent, load-bearing
concurrency defect (Collapse 1) went unasked. The standing lesson this
adds: **when a fix pass introduces a genuinely new mechanism (not just
a corrected fact) to close a finding, the new mechanism needs its own
fresh §10A collapse-test — not an update to an existing entry's
denominator — because an existing entry's "hardest question" was
authored against a different decision's failure modes and will not
organically extend to cover the new one.**

**Silent or self-revealing?** The missing-collapse-test finding itself
is a process gap (self-revealing to anyone auditing §10A's
completeness against Step 23's own body, as this review did); the
substantive defect it left unasked (Collapse 1) is silent.

---

## Finding 3 (Minor, residual — not a re-opened collapse) — Step 20's round-9 brace detector mis-parses a filename that literally contains `{`/`}`, producing a silently corrupted path

**Where.** `docs/plans/plan-phase-a.md:1881–1883` (the brace-form
regex, `^(.*)\{(.*) => (.*)\}(.*)$`).

**What's wrong.** Round 9's fix is genuinely correct for every scenario
it names and every scenario `T20-1`'s fixture exercises (re-verified
above). Stress-testing it further, beyond the task brief's three named
scenarios, against a rename of a file whose name legally contains a
literal `{`/`}` character (e.g. `lit/{legacy}old.txt` →
`lit/{legacy}new.txt`, which git renders as `--numstat`'s
`lit/{{legacy}old.txt => {legacy}new.txt}`) shows the greedy regex
backtracks to the wrong brace pair: executed directly, it correctly
recovers the old path (`lit/{legacy}old.txt`) but produces a corrupted
new path (`lit/{{legacy}new.txt`, with a stray leading brace) — a
silent, wrong string written into `cochange_pairs`/`files`, not an
exception.

**Why this does not reopen round 9's fix, and is scoped as Minor.**
Round 9's finding, and the task brief's, concerned the *dominant, every
day* case (an ordinary rename with no unusual characters); that case is
now genuinely and correctly handled, confirmed by direct execution
against three real scenarios plus a fourth (multi-level prefix+suffix)
this round constructed independently. A file whose *name itself*
contains a curly brace is legal but rare, and — unlike the round 8/9
finding, which affected the single most ordinary refactor a developer
performs — this is a narrow input class most real repositories will
never present. It does not warrant reopening Collapse-status, but it
is a genuine, silent, uncaught mis-parse and `T20-1`'s fixture does not
exercise it.

**What the fix should be, if picked up.** Either escape/detect literal
braces before applying the compaction regex (check whether the
substring between the outermost `{`/`}` boundaries contains a nested
`{`or `}` and, if so, fall back to treating the field as ambiguous —
skip the pair-add and log a diagnostic rather than guess), or match
non-greedy on the inner groups and validate that the reconstructed
`prefix+oldPart+suffix`/`prefix+newPart+suffix` actually exist as
paths in the commit's other numstat lines before trusting them. Not
proposing this as a required Phase A fix — flagging it as a disclosed,
owner-visible residual, in the same spirit as N1's scheme-normalization
residual (`docs/plans/plan-phase-a.md:3998-4009`) — a known gap named
honestly rather than silently left unstated.

**How verified.** Direct execution: constructed a real repository with
a file literally named `{legacy}old.txt`, renamed it to
`{legacy}new.txt`, ran `git log --numstat -M`, confirmed git's actual
output (`lit/{{legacy}old.txt => {legacy}new.txt}`), then ran Step
20's own literal two regexes against that exact string.

**Silent or self-revealing?** Silent — no error; a syntactically
plausible but wrong path is written to the store.

---

## Round 9's other closure items re-attacked directly (all survive)

- **§11.4's two new entries** (git-invocation exit-code distinction;
  rename `--numstat` output shape) — both independently reproduced
  from scratch this round (see Verdict (c) above); accurate as stated.
- **Section 11 claims registry sweep** (round 9's Finding 2: round 8's
  own two collapse-hunt findings were fixed at their primary sites but
  never logged in §11) — spot-checked: both entries are present at
  lines 4452–4482, correctly attributed to "round 9" as the logging
  pass (they document round-8-discovered facts, logged round 9 — the
  document's own framing is internally consistent on this point, not a
  new mislabel).
- **`T37-3`'s existence and its three stated cases** — present at
  `test/unit/reindex_lock.test.ts`, and its three cases (completed run
  → lock absent; stale lock → reclaimed; fresh lock → not reclaimed)
  are each individually correct and were each individually
  re-executed and confirmed to pass against the literal mechanism.
  What `T37-3` does *not* cover is the concurrent-reclaim race
  (Collapse 1) — and its own "NOT asserts" line
  (`docs/plans/plan-phase-a.md:5262-5263`, *"Cross-process contention
  timing (that is `T37-1`'s concern for the SQLite-level lock; this
  test is filesystem-only)"*) reads as though that gap is covered
  elsewhere. It is not: `T37-1` (line 5216 area, `T37-1` — concurrent
  *SQLite writes* to `store.db` via WAL/`busy_timeout`) is a
  structurally different mechanism from the reindex *directory lock
  file* Step 37 also introduces in the same step; nothing in the
  document tests the directory lock under concurrent contention. This
  cross-reference is itself a small, additional instance of the
  "reads as covered, isn't" shape — flagged here rather than as a
  fourth separate finding, since fixing Collapse 1/2 (adding an actual
  concurrent-reclaim test case to `T37-3`) resolves this cross-reference
  too.

## Collapse-tests re-attacked (all survive except the gap named above)

Every §10A entry was re-read and attacked with a question at least as
hard as its own stated "hardest question," per the task brief's
instruction to attack harder than the plan's own text:

- **D-plan-1** (build order / write-time predicate cap). Re-attacked:
  does the write-time cap (`T18-3`, `T14-3`) actually prevent *this
  round's* new mechanism (the staleness reclaim) from silently growing
  without its own collapse-test? No — the cap governs recognizer
  *predicates* (the deny-eligible move set, the bypass-suspect pattern
  list), a narrower class than "any new load-bearing mechanism
  anywhere in the plan." This is not a defect in D-plan-1 itself (its
  stated scope was always the recognizer-growth class specifically,
  and it says so), but it explains structurally why Collapse 2 was
  possible: no existing mechanized gate in this plan catches "a new
  §7 mechanism shipped without its own §10A entry" in general; only
  the independent collapse-hunt does, round over round. Recorded as
  context for Collapse 2, not a new finding against D-plan-1.
- **D-plan-2** (dependency floor). Re-verified `semver.satisfies
  ('0.27.0', '^0.26.13')` is still `false` conceptually unchanged since
  round 6/7 (no npm registry state affecting this pin was checked
  again this round — out of this round's scope, and no plan text
  changed here since round 7). Survives.
  - **D-plan-3** (`node:test`). Re-attacked: does the `tsconfig.test.json`
  compile step, once it exists, change anything about `const enum
  FaultCode`'s round-8-identified requirement? No new information
  this round; the two-reason argument (sub-version stripping boundary
  + `const enum` requiring transformation regardless of version)
  still holds structurally and nothing in round 9's fix pass touched
  this step's content. Survives.
- **D-plan-4 through D-plan-8, and the three plan-level entries**
  (checkpoints, test-tier split, exit-run report shape) — re-read and
  attacked; no new crack found this round. D-plan-6's retraction
  record is internally consistent with §15 Q-gap-4's disposition.
- **N1** (URL-normalization scheme residual) — re-attacked with a
  harder framing than its own text: if `status` displays the full
  normalized key, does an owner who never runs `status` unprompted
  ever actually see a scheme-split? The plan's own §11.5 framing
  ("Phase A measures its own floor honestly, not eliminates every
  residual") is the correct register for this, and `status` remains
  the disclosure surface named in every other Phase A limitation of
  this shape (regret proxy noise, generic-frontend weakness) — no
  double standard found; N1 survives on the same terms as its siblings.
- **N2** (`deny_bypass_suspect` coverage bound) — re-attacked;
  both-direction disclosure (over-count and under-count) is present at
  both Step 18 and Step 33/`status`, verbatim, matching AD-9's
  requirement. Survives.
- **N3/N4** — does not survive; see Collapse 2.
- **N5** (`oracleSpawn` placement) — re-attacked against this round's
  own finding: is `oracleSpawn` itself subject to the same kind of
  unsynchronized-reclaim race as the lock file? No — `oracleSpawn` is
  a pure wrapper around `child_process.spawn` with an environment-
  variable guard, not a shared mutable resource two processes can
  race over; the analogy does not transfer. Survives.
- **N6** (confinement-grep scope) — re-read; no new information this
  round changes its `dist`/`dist-test` scoping. Survives.
- **Plan-level: Exit-run report shape** — re-attacked against this
  round's finding: would a concurrent-reindex corruption (Collapse 1)
  surface in Step 42's mandatory metrics, or would it silently deflate
  a genre count the same way a rename-corrupted miner would (the
  round-8 lesson)? Plausibly the latter — a corrupted index would most
  likely manifest as *lower* Coupling/Reuse counts, indistinguishable
  inside the exit report's own success criteria from an honest low
  floor, the identical shape round 8's collapse-log entry already
  named for the miner. This is not a new finding against the report
  shape (which was never meant to catch every possible root cause) but
  it sharpens why Collapse 1 matters: the exit report cannot tell a
  concurrency-corrupted floor from an honest one any more than it
  could tell a rename-corrupted one, and Phase A's stated mission
  (spec §11.5, "measures its own floor" honestly) depends on the floor
  actually being honest input to the report, not corrupted input that
  happens to look like an honest low floor.

## New load-bearing decisions in §7 checked against §10A coverage

Beyond the task brief's named candidate (`reindex.lock_stale_ms` —
confirmed missing, Collapse 2), every other numbered decision
introduced or materially changed by round 8 or round 9 was checked
for §10A coverage:

- **Step 5's git-invocation exit-code distinction** (round 8) — not a
  new *decision* requiring its own §10A entry; it is a bug fix to an
  existing algorithm's branch logic, already covered by `N1`'s
  parent decision (repo-identity resolution) and by the plan's §11.4
  evidence entry. No gap.
- **Step 20's two-step rename detector** (round 8, corrected round 9)
  — same reasoning: a bug fix to an existing mechanism (the miner),
  not a new decision. `AD-13`'s existing rationale already covers the
  miner as a whole. No gap.
- **`T18-3`'s CI-mechanized predicate-count check** (round 2) — already
  covered inside D-plan-1's own §10A entry (it *is* the mechanization
  D-plan-1's answer names). No gap.
- **`reindex.lock_stale_ms`** — confirmed missing; Collapse 2.

No other new load-bearing decision without §10A coverage was found
this round.

## What survives

- Round 9's two Serious expert-review findings (Step 20 brace
  expansion for the exact scenarios it names; Step 37 lock release) —
  genuinely closed, independently re-executed, confirmed correct for
  every scenario each was built to close.
- Round 9's collapse-hunt findings (the fourth same-directory rename
  scenario; the section-11 claims-registry sweep) — genuinely closed.
- Both of round 9's new §11.4 entries — accurate, independently
  reproduced from scratch.
- `T20-1`'s fixture spec — matches what round 9's fix requires.
- Every §10A entry except `N3/N4` (which needed, and still needs, a
  new sibling entry for `reindex.lock_stale_ms` rather than a bigger
  denominator) — survives a harder attack than its own stated
  question.
- The document's overall structure, citation discipline, and the
  now-nine-round-deep convergence on every previously-found defect
  class (semver, `SqliteError`, `npm ci`, `flock`(2), the repo-identity
  branch, the rename-collapsing miner) — all independently
  re-confirmed closed and not regressed by round 9's own edits.

## Mission-fidelity cross-trace

Phase A's goal (spec §11.5; `docs/STATUS.md`'s "north star") is an
**honest deterministic foundation that measures its own floor** —
Phase A is also the test bed the later phases' fixtures and thresholds
are derived from, so a faked or silently-broken mechanism corrupts
data nobody can re-collect after the exit run. Collapse 1 is a direct
mission-fidelity hit on exactly this axis: a concurrency defect in the
reindex lock does not throw, does not appear in any diagnostic named
in the current plan, and would manifest — if it manifests during the
real exit run on Max Cogar's real repos (Step 42) — as index data that
*looks like* an honestly-measured low floor rather than what it
actually is (a corrupted one from an unlocked concurrent rebuild).
This is the same shape `docs/collapse-log.md`'s round-8 entry named for
the co-change miner ("a false floor and a true floor read identically
… only a fixture exercising the exact defect can tell them apart
before the exit run runs on data nobody can re-collect after the
fact") — recurring here in a different mechanism (the lock, not the
miner), introduced by the *fix* for a different mechanism's defect,
which is exactly round 9's own closing lesson applied one round
further: a fix for a silent defect can introduce a new silent defect
in the same area, and only re-executing the fix's own literal
mechanism against a scenario the fix itself makes newly possible (here:
two concurrent reclaims, a scenario that did not exist before round 9
added the reclaim step) surfaces it.

Collapse 2's mission-fidelity angle is narrower but real: `CLAUDE.md`
rule 2 exists specifically so that a load-bearing decision's hardest
question gets asked *before* the decision ships, not discovered later
by an independent hunt after the gap it would have caught has already
shipped. That is exactly what happened here — the collapse-test that
should have existed would very plausibly have surfaced Collapse 1
directly, at write time, rather than requiring a tenth review round to
find it by execution.

## Attestation

- **What was executed, and where the scripts are.** All JavaScript and
  git commands quoted above were run live this session against
  Node.js v22.22.2 and git 2.43 in the session's own scratchpad
  directory (`/tmp/claude-0/-home-user-agent-armory/
  219f38f1-6a91-59c0-9c65-0c0a8fbaa399/scratchpad/`) — not recalled
  from training data, not inferred from the plan's prose, and not
  copied from any prior round's cited output. The rename-scenario
  repositories, the literal two-regex transcription, the four-scenario
  lock-mechanism script, and the hand-interleaved race script were all
  freshly authored this session for this review; none reused a prior
  round's script verbatim (this round had no access to any such
  script beyond what is quoted in the two round-9 review documents'
  prose, which contain no runnable script, only described commands and
  results).
- **What was not independently re-verified this round, and why:**
  round 6/7's semver and `node:sqlite`/`SqliteError` findings were not
  re-executed from scratch this round (no plan text touching them
  changed since round 7's fix pass, and this round's brief scoped
  re-execution to round 9's own two closure items specifically, plus
  continued generalization toward *new* unchecked claims) — this is a
  scope choice, not an oversight, and is disclosed here rather than
  silently assumed. If a future round wants zero-trust re-verification
  of every prior round's execution claims in one pass, that is a
  larger, explicitly different brief than this one.
- **Confidence.** High on Collapse 1 and its reproduction — the race
  was reproduced deterministically via hand-interleaved literal
  execution of the plan's own described syscalls, not inferred or
  probabilistic; a real two-process reproduction (two actual Node
  processes racing via `setTimeout`-jittered starts) was not
  additionally attempted, since the hand-interleaved version already
  demonstrates the algorithm itself (not merely an unlucky OS
  scheduling accident) permits the bad outcome — the two are logically
  equivalent for this class of bug (a TOCTOU race that exists in the
  algorithm's logic will manifest under some real interleaving; only
  the algorithm's logic was in question, not the OS's fairness).
  High on Collapse 2 (a direct textual comparison, not a judgment
  call). Medium-high on Finding 3 (a genuine, verified defect, but
  intentionally scoped as a disclosed residual rather than a blocking
  finding, which is itself a judgment call about severity that a
  future round or the owner could reasonably weigh differently).
  This document's own claims are, per this project's own standing
  rule, themselves subject to the identical re-execution discipline by
  round 11 — the race script and the brace-filename script should be
  the first thing a future round re-runs against whatever fix lands
  for Collapse 1/2, exactly as this round re-ran round 9's.
