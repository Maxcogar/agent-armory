# Independent collapse-hunt — Phase A implementation plan, round 11 (2026-09-07)

**Artifact:** `docs/plans/plan-phase-a.md` (7450 lines) and
`docs/architecture-phase-a.md` (2058 lines), at their current state on
branch `claude/plan-correction-strategy-57ot28`, commit
`26c2ec16a26757834e978324ec877553a66a3178` ("context-oracle: fix
round-10 collapse-hunt and expert-review findings"), confirmed via
`git log -1 --format="%H %ci"` this session before any line citation
below. Working tree clean.

**Reviewer:** independent subagent, no prior context on this session,
not the author of either document, any prior fix pass, or any prior
review of them.

**Axis:** mission-fidelity (`CLAUDE.md` dominating rule 2's collapse
test and rule 3's phase-goal-governs); literal re-execution of round
10's own fix mechanisms — the atomic rename-based lock reclaim, and
the `web-tree-sitter@0.25.10`/`tree-sitter-wasms@0.1.13` grammar load —
against the exact scenarios round 10's own findings named, per the
task brief and per round 10's own closing lesson (re-verifying a claim
along an axis a prior round already checked is not the same as
checking a new axis); architecture-phase-a.md attacked as an in-scope
target this round, not merely a citation source, since round 10 edited
it for the first time this session.

**Read in full before the attack:** `middleware/context-oracle/CLAUDE.md`
(full); `docs/collapse-log.md` (full 2026-09-07 entry set, rounds 3
through 10 read closely; earlier entries sampled for pattern history);
`docs/STATUS.md` (full); `OWNER-LEDGER.md` (full);
`docs/specs/spec-context-oracle.md` §8, §11.5, §12, §13, §14 in full
(plus §9/§10 for citation cross-checks); `docs/architecture-phase-a.md`
**read end to end, in full, this session** (not spot-checked) —
Goal/Scope, all 19 verified premises (V1–V19), the full component map
and data flow, AD-1 through AD-26 in full, the numbered reasoning
chain, Gate A, the full threat model (T1–T4), the ASVS mapping, the
full traceability matrix, Limitations L1–L11, and the standards table;
both round-10 review documents in `docs/reviews/` in full
(`2026-09-07-round-10-plan-collapse-hunt.md`,
`2026-09-07-round-10-plan-expert-review.md`); `docs/plans/plan-phase-a.md`
read via the following method: every section touched by the
`ed9f917..26c2ec1` diff (526 lines changed) read in full at its current
text — Step 1, Step 20, Step 21, Step 22, Step 23, Step 37, §10
D-plan-1/D-plan-2, §10A D-plan-2/N3-N4/N7, §11.4, §12 (T20-1, T22-1,
T22-3, T37-3, the Step→T-ID and file-skeleton entries for both steps),
§13 R11, §14.1 Q1, §14.2, §14.4 — plus a full-document grep sweep for
every citation pattern relevant to this round's findings (`0.26.13`,
`0.25.10`, `six number`/`seven number`, `reindex.lock_stale_ms`,
`not data corruption`/`redundant`, `Pass [A-Z]`, `T37-3`, `T22-3`) to
confirm no other site silently duplicates a stale claim; the remaining
sections of §7 (Steps 2–19, 24–36, 38–43) and §9/§10/§10A/§12/§13/§15
outside the diff were **not** re-read line-by-line this round — round
10's own expert-review attests a full sequential read of the entire
7196-line document at the prior commit, and no commit between that
attestation and this round's target touched anything outside the diff
listed above (confirmed by `git diff --stat` against the two
intervening commits). This is a scope choice, disclosed here rather
than silently assumed, matching round 10's own disclosed-scope
precedent for rounds 6/7's semver and `SqliteError` findings.

**Verification instruments used beyond reading.** A live shell,
Node.js v22.22.2, npm 10.9.7, git. Specifically:

- A fresh `npm install web-tree-sitter@0.25.10 tree-sitter-wasms@0.1.13`
  in a scratch directory, followed by `Parser.init()` +
  `Language.load()` + `parser.setLanguage()` + `parser.parse()` against
  **six** real grammars — `javascript`, `typescript`, `python`, `go`,
  `java`, `c_sharp` (the exact set named in the plan's §11.4 claims
  registry) — each fed a real, syntactically valid source sample in
  that language, not an empty string, and each result checked for
  `hasError: false` and a sane root-node type.
- A **literal, unmodified transcription of Step 37's full round-10
  reclaim algorithm** (`docs/plans/plan-phase-a.md:2980–3017`) as
  runnable JavaScript, executed three ways:
  1. A single-process, hand-interleaved reproduction (the same
     technique round 10 itself used and defended as logically
     equivalent to a real OS race for a check-then-act bug).
  2. A **real two-OS-process** reproduction (`child_process`-independent:
     two separately-launched `node` processes, `P1` and `P2`, each
     running the literal algorithm against a real filesystem, with two
     plain-file synchronization barriers placed **only** at the exact
     gap the algorithm's own text leaves unsynchronized — between one
     process's staleness *check* and its *act* — never inside either
     process's own decision logic).
  3. A candidate-fix variant re-executed the same way, to verify a
     proposed remediation before recommending it.
- `git log --numstat -M` was not re-executed this round (unchanged
  since round 9; the round-10 collapse-hunt already re-verified it
  fresh this session-lineage, and no plan text touching Step 20's
  detector changed since).

## Verdict: DOES NOT SURVIVE (one new Serious collapse, silent; one new Moderate internal-inconsistency finding, self-revealing once compared; one new Minor process-completeness finding; round 10's two closure items and architecture V14's correction otherwise hold)

- **Round 10's closure items independently re-verified genuinely
  closed, by re-execution against the exact scenarios round 10's own
  findings named:**
  - **(a) `web-tree-sitter@0.25.10` + `tree-sitter-wasms@0.1.13`
    load and parse correctly**, re-verified this round across the full
    six-language sample the plan's own §11.4 entry names (round 10
    verified the same six; this round re-derived it from scratch
    rather than trusting the citation) — every language loads,
    parses real (non-trivial) source, and produces no parse errors.
    `T22-1`'s own "Fails when `Language.load()` throws" assertion
    would pass against the pinned version, confirmed directly.
  - **(b) Step 21/Step 22's dispatch-and-fallback logic is internally
    consistent.** Step 21 dispatches per file to "the matching frontend
    or `generic_frontend` fallback"; Step 22 specifies the grammar-load
    try/catch as a property of the tree-sitter frontend itself (lazy,
    cached per `(lang, first-use)`), so a load failure demotes that
    language's `LanguageFrontend` internally without requiring any
    change to Step 21's per-file dispatch — the two steps describe one
    coherent mechanism, not two independently-evolving ones. No defect
    found here.
- **One new Serious collapse (silent): round 10's atomic
  rename-based lock reclaim closes the exact race round 10 constructed
  (two reclaimers colliding on the same rename call at the same
  instant), but does not close a wider, equally realistic
  check-then-act window one level up — a reclaimer that made its
  staleness decision early and is delayed before acting can still
  destroy a lock that a faster reclaimer has, in the interim,
  legitimately created and is actively holding.** Verified by a real
  two-OS-process reproduction of the plan's own literal algorithm (see
  Collapse 1).
- **A second, tightly-coupled finding: §13 R11's own safety claim about
  concurrent reindexes ("not data corruption… a second, redundant
  reindex") directly contradicts Step 37's own "Impact if wrong" text
  ("silent index corruption") for the identical scenario — both added
  in the same round-10 fix pass, neither cross-referencing the other**
  (see Collapse 2). Collapse 1 shows the scenario R11 waves off as
  merely "redundant work" is reachable in the first place, which makes
  the contradiction load-bearing, not decorative.
- **One new Minor process-completeness finding: the §14.4
  reconciliation-sweep-record narrative — a discipline this document
  itself enforces by name (Pass L was added specifically "per
  expert-review's Minor finding that this narrative had no entry for
  round 5's own fix pass") — has no entry for any of rounds 6 through
  10's five fix passes**, silently letting the exact defect class the
  document caught and fixed at round 6 recur, unnoticed, for four more
  rounds (see Finding 3).
- Every other §10A collapse-test re-attacked this round survives; no
  fourth new collapse was found. Architecture V14's correction (the
  round-10 fix) is internally consistent throughout
  `architecture-phase-a.md`, read in full this round — no stray
  `0.26.13` citation, no AD referencing a specific version number that
  contradicts V14's corrected text, and AD-25's "runtime deps exactly
  `web-tree-sitter` + `tree-sitter-wasms`" names the packages, not a
  version, so it needed no correction and received none.

---

## Collapse 1 (Serious, silent) — the round-10 atomic-rename reclaim fix closes the *simultaneous*-collision race it was built to close, but not a *delayed check-then-act* variant one level up, and a real two-process execution destroys a live, actively-held lock as a result

**Where.** `docs/plans/plan-phase-a.md:2985–3017` (Step 37's reclaim
sub-steps, corrected round 10); the same gap is present in `T37-3`'s
fixture spec at `docs/plans/plan-phase-a.md:5471–5480` (case (d)) and
in §10A's `N7` entry (`docs/plans/plan-phase-a.md:4254–4292`), whose
own "hardest question" — "what happens when two reclaim attempts land
inside the same staleness window" — is answered only for the narrower
sub-case its own Answer field actually describes.

**What the plan says (round 10's fix, quoted in full since the exact
wording is where the gap lives).** Step 37, sub-step 2:

> If lock acquisition fails with `EEXIST`, read the existing lock
> file's mtime. If it is older than `reindex.lock_stale_ms`… treat it
> as abandoned by a crashed process and attempt to reclaim it… call
> `fs.renameSync(lockPath, lockPath + '.reclaiming-' + process.pid)` —
> `rename` on the same filesystem is atomic, so only one concurrent
> reclaimer's rename can succeed against the stale lock's path. If the
> rename succeeds, this process owns the reclaim: delete the renamed
> file and retry acquisition once. If the rename throws `ENOENT`…,
> this process lost the race: skip this reindex attempt silently…

`T37-3`'s case (d), the test round 10 added to exercise exactly this:

> Two simulated concurrent reclaim attempts against the same stale
> lock, their `renameSync` calls issued **back-to-back with no
> serialization between them** — asserts exactly one succeeds… the
> other's rename throws `ENOENT`.

**What's wrong.** "Rename is atomic" is true and does close the case
`T37-3`(d) actually tests: two reclaimers whose `renameSync` calls
race **against each other**, issued back-to-back, colliding on the
*same original stale file object*. But the reclaim algorithm's
staleness *decision* (the `mtime` read) and its *action* (the rename
call) are two separate, adjacent-in-code but not temporally-adjacent
syscalls, executed by a process that has no way to know how much real
wall-clock time will elapse between them — a busy host, disk
contention, or ordinary OS scheduling can insert an arbitrary gap.
Nothing in the specified algorithm re-verifies, immediately before the
rename, that the file still occupying `lockPath` is the *same* file
that was inspected as stale. `rename(2)` itself provides no such
guarantee — it moves whatever currently occupies `oldpath`, with no
notion of "the file I mean," only "the path I mean." So the following
sequence, involving **three** independent actors reasoning correctly
about the algorithm as literally specified, is possible and was
reproduced by direct execution:

1. A crashed process's lock is present, `mtime` older than
   `reindex.lock_stale_ms`.
2. P1 and P2 both `tryAcquire()` → `EEXIST`. Both `stat` the lock and
   both correctly conclude it is stale (nothing has changed it yet).
3. P1 proceeds immediately: `renameSync` succeeds (it is racing no one
   at this instant), it deletes the renamed copy, and it recreates a
   **fresh, live** lock via `tryAcquire()`. P1 now genuinely,
   correctly holds the lock and begins its reindex.
4. P2 was delayed (scheduling, I/O, a slower host — nothing in the
   algorithm bounds this gap) between its own step-2 `stat` and its own
   `renameSync` call. When P2's `renameSync` finally runs, `lockPath`
   no longer holds the original stale file — it holds **P1's fresh,
   live lock**. `rename(2)` does not care: it succeeds anyway, because
   *some* file is present at that path. P2 deletes what it just
   renamed away — **P1's live lock, not the stale one P2 inspected** —
   and recreates its own lock. **P2 now also believes it holds the
   exclusive lock, while P1's reindex is still genuinely running.**
5. When P1 finishes and runs its `finally`-block release exactly as
   specified (`fs.unlinkSync(lockPath)`), it deletes **P2's** live
   lock — the file at that path is P2's now, not P1's, and `unlink(2)`
   has the same "whatever is there" semantics as `rename(2)`.

**How verified.** Two independent, real OS processes (`node` v22.22.2,
launched separately via the shell, not simulated in one process),
running the literal Step 37 algorithm transcribed as JavaScript, with
two plain-file barriers placed only at the exact gap between P2's own
`stat`-based decision and its own `renameSync` call — nothing inside
either process's decision logic was altered or skipped. Actual
execution log (paths abbreviated):

```
[P2] CHECK: age=1200060ms stale=true
[P1] CHECK: age=1200060ms stale=true
[P1] reclaim complete; P1 believes it holds the exclusive lock (fd=20)
[P2] ACT: proceeding on the staleness decision made before P1 ran, unrevalidated
[P2] rename SUCCEEDED (per spec: "this process owns the reclaim")
[P2] P2 now BELIEVES IT HOLDS THE EXCLUSIVE LOCK (fd=20)
[P1] about to release (finally block); lock file still present at that moment: true
[P1] P1 finished its finally-block release path
=== final lock file present? === no
```

P1's own `finally`-block release ran to completion with **no error**
and deleted what was, by then, P2's live lock — exactly the "two live
reindexes, unlocked, application-level" outcome round 10's Collapse 1
described for the *pre*-fix algorithm, now reproduced against the
*post*-fix (rename-based) algorithm under a different, wider timing
window. This is not the scenario `T37-3`(d) tests: that case issues
both `renameSync` calls "back-to-back with no serialization" —
i.e. both racing the *same original file* at nearly the same instant —
which the fix genuinely closes (confirmed: re-running the single-process
hand-interleaved version of exactly that narrower scenario shows only
one of two simultaneous renames ever succeeds). The gap is a **third**
timing shape `T37-3`(d)'s own wording does not describe: one reclaimer
completing its **entire** cycle (rename, delete, recreate, and
beginning real work) before a second, independently-delayed reclaimer
acts on a staleness decision it made *before* the first reclaimer ran.

**Why "single-host, single-user, no cross-machine contention" does not
close this (re-attacking N7's own answer harder than N7's own hardest
question).** N7's hardest question asks about "two reclaim attempts
[that] land inside the same staleness window" and its Answer treats
this as fully closed by the atomic rename. The question, asked harder:
does "atomic rename" mean *no two reclaimers can ever believe they
hold the same lock*, or does it mean only *no two reclaimers can
collide on renaming the exact same still-present file at the exact
same instant*? N7's own Answer proves only the second, narrower claim,
then states the conclusion as if it were the first, broader one ("only
one concurrent renamer can succeed against a given source path" is
true and irrelevant once the source path's *occupant* has changed
between one racer's check and its own act). The race this round found
needs no cross-machine anything, no adversary, and no unusual host —
only two `refreshIfStale` triggers close enough in time that one's
`stat`-to-`rename` gap outlasts the other's entire acquire-and-run
cycle, which is exactly the scenario `AD-26`'s own opening sentence
("Hooks can run in parallel") licenses as ordinary operation, not an
edge case.

**What the fix should be, and what does *not* work (verified, not
merely proposed).** Round 10's own N7 text names an alternative in
passing ("an implementer using a differently-shaped atomic reclaim,
e.g., a token-verify-before-unlink, satisfies the same job") without
verifying it — this round did verify it, and found the *obvious*
version of it insufficient:

- **Does not work (verified): inode-identity re-check.** Capturing the
  lock file's inode number (`fs.statSync(...).ino`) at check time and
  re-verifying it on the renamed file before deleting looks sound —
  filesystem inode numbers are usually treated as stable identity — but
  a real execution of this variant showed the filesystem **reused the
  just-freed inode number** for the reclaiming process's own freshly
  recreated file (`unlinkSync` immediately followed by `openSync`
  O_CREAT at the same path, on the same filesystem, in the same
  process, is exactly the pattern that triggers fast inode reuse on
  several common filesystems). The result: a second racer's
  post-rename inode check *passed* — reporting a false match — even
  though the file it had actually seized was a different process's
  brand-new live lock. Inode-based identity is not reliable here.
- **Works (verified across three repeated real dual-process runs, zero
  failures): a content token.** Write a random or PID-plus-nonce token
  into the lock file's own bytes at *every* creation (both the initial
  `tryAcquire()` and any reclaim's recreate), capture that token at
  check time, and re-read the renamed file's content — not its
  metadata — immediately after the rename, before deleting it. A
  legitimate concurrent recreate always writes a *different* token
  (never reused, unlike an inode number), so a mismatch is unambiguous:
  restore the file to its original path (`renameSync` back) and skip
  this reindex attempt silently — the same "skip silently" fallback the
  algorithm already uses for the plain `ENOENT` case, so this adds no
  new failure mode, only a narrower, now-genuinely-safe condition for
  when destruction is permitted. Verified: three independent real
  dual-process runs each correctly detected the mismatch, restored the
  live lock, and let the legitimate holder's own release proceed
  without corruption.

**Why it matters.** This is the identical mission-fidelity class round
10 itself named for the pre-fix version: a concurrency defect in the
mechanism that exists specifically to prevent two full `runIndex`
passes from writing to `store.db` unserialized at the application
level. Two reindexes racing unlocked is not merely "wasted CPU" (see
Collapse 2, directly below, on why the plan's own newer text disagrees
with itself about exactly this) — it is precisely the scenario
`AD-26`'s own sentence ("the detached reindex takes a directory lock;
the handler never waits on it") assumes cannot happen because the lock
already prevents it. The defect is silent: no exception, no log line,
and no diagnostic fires anywhere in the sequence above; both processes
proceed as if uncontended, and the losing process's belief that it
holds the lock is never corrected.

**Silent or self-revealing?** Silent. Nothing in the specified
algorithm, nor in any Phase A diagnostic named elsewhere in the plan,
observes or records that a live lock was destroyed out from under its
holder.

---

## Collapse 2 (Moderate, self-revealing once compared) — §13 R11's "not data corruption" claim about concurrent reindexes directly contradicts Step 37's own "silent index corruption" claim about the identical scenario, both introduced in the same round-10 fix pass

**Where.** `docs/plans/plan-phase-a.md:6588–6606` (§13, R11, added
round 10 — expert-review Moderate finding) versus
`docs/plans/plan-phase-a.md:3040–3049` (Step 37's own "Impact if
wrong," also touched round 10).

**What the plan says, side by side.**

- **R11:** "If a legitimately-running (not crashed) reindex exceeds the
  threshold, a concurrent `refreshIfStale` trigger would reclaim its
  lock and start a second, **redundant reindex — not data corruption**
  (Step 37's own WAL/`busy_timeout`/retry-once discipline, a separate
  mechanism, keeps the underlying `store.db` writes safe under
  concurrent contention…)."
- **Step 37, "Impact if wrong":** "Two concurrent reclaimers of the
  same stale lock both believing they hold it would let two detached
  reindexes run against `store.db` unlocked and unserialized at the
  application level — **silent index corruption**, not caught by
  `T37-1`/`T37-2`… — caught by `T37-3`'s round-10 concurrent-reclaim
  case."

**What's wrong.** Both sentences describe the same underlying event —
two detached reindexes running concurrently against `store.db` with no
lock serializing them — and reach opposite conclusions about whether
that event is safe. Step 37's own text calls it "silent index
corruption" **in the very same section, added in the very same
round-10 fix pass**, that R11 (added for a *different* finding, the
expert-review's Moderate finding about the *magnitude* of
`reindex.lock_stale_ms`) calls "not data corruption." Neither entry
cites or reconciles the other, despite sitting roughly 3,500 lines
apart in the same document and addressing the identical failure mode.
This is the "fix landed at its primary site, not swept to every
cross-referencing surface" pattern `docs/collapse-log.md` has logged
across rounds 2 through 8 — recurring here as two *separate* fixes
within round 10 itself writing incompatible characterizations of the
same mechanism, neither aware of the other.

**Why R11's version is the one that needs correcting, not Step 37's
(supporting analysis — reasoned from the architecture's own described
mechanism, not independently executed, since Steps 20–22's miner does
not exist yet to run against).** `AD-13`'s co-change aggregation is
described as `INSERT … ON CONFLICT DO UPDATE` accumulation of
`cochange_pairs.pair_count`, driven by `git log … <watermark>..HEAD`
read against a `last_mined_commit` watermark that Step 20's own text
says is *read* once at the top of a mining pass ("reads
`schema_meta.last_mined_commit` watermark; runs `git log`…"). If two
`runIndex`/`mineCochange` passes are both genuinely running because
Collapse 1 let a second one start against a lock the first legitimately
held, **both** read the *same*, not-yet-advanced watermark, both mine
the *identical* commit range, and both apply `pair_count = pair_count +
delta` for the *same* commits — silently doubling the counted evidence
for whatever pairs both passes touch. That is not "redundant work" in
the sense of wasted CPU with an identical, idempotent result; it is a
silent corruption of the exact measurement data spec §11.5 makes
Phase A's mission ("measures its own floor honestly") — the same
"false floor reads identically to a true floor" shape
`docs/collapse-log.md`'s round-8 entry already named for the
rename-collapsing miner, recurring here via the lock instead of the
parser. WAL + `busy_timeout` + retry-once (the mechanism R11 cites)
guarantees only that SQLite's on-disk format stays valid under
concurrent writers — it says nothing about whether the *values* two
independent writers compute and each durably commit are the *correct*
values, which is a strictly different, higher-level property this
plan's own R9 entry (a sibling risk about the same WAL/`busy_timeout`
mechanism) correctly does not conflate either.

**What the fix should be.** Reconcile the two entries: either (a)
correct R11 to match Step 37's own, more accurate characterization
("not merely redundant — a concurrent unlocked reindex can silently
double-count co-change evidence for the overlapping commit range,
which Collapse 1's residual race makes newly reachable even under a
correctly-calibrated threshold"), with a forward reference to Step 37's
"Impact if wrong" rather than a competing claim; or (b), if the
authors intend R11's narrower framing to survive, add the missing
argument for why the *miner's specific* accumulation logic is actually
safe under concurrent unserialized runs (e.g., if `mineCochange` is
in fact wrapped in one all-encompassing transaction per run, making a
second concurrent run's writes block or serialize behind the first —
nothing in Step 20's current text says this, and it would be a
significant, currently-undocumented design commitment holding a write
lock on `store.db` for the duration of a potentially large repository's
full mining pass). Either way, the two entries need to say the same
thing about the same mechanism.

**How verified.** Direct textual comparison of the two entries (high
confidence — this is not a judgment call). The double-counting
consequence is reasoned from Step 20's and `AD-13`'s own stated
mechanism, not independently executed against real code, since Phase A
is greenfield and the miner does not exist yet to run — disclosed
here, in the same spirit as round 10's own Moderate finding, as the
honest limit of what this round could settle by execution versus by
argument from the plan's own stated design.

**Silent or self-revealing?** The inconsistency itself is
self-revealing once the two passages are placed side by side (as this
finding does); the underlying data-corruption risk it downplays is
silent, for the same reason Collapse 1's own consequence is silent.

---

## Finding 3 (Minor, self-revealing, process-completeness) — the §14.4 reconciliation-sweep-record narrative has no entry for any of rounds 6 through 10's five fix passes, despite the document's own established rule that every fix pass gets one

**Where.** `docs/plans/plan-phase-a.md:6846–7004` (§14.4, the sweep
record narrative). The last entry is **Pass L**
(`docs/plans/plan-phase-a.md:6967–6994`), explicitly logging "round
5"'s fix pass — and, notably, Pass L's own text states it was "added
this fix pass, round 6, per expert-review's Minor finding that this
narrative had no entry for round 5's own fix pass." No `Pass M` (or
later letter) exists anywhere in the document.

**What's wrong.** The document itself treats "does §14.4 have an entry
for the fix pass that just landed" as a checked property — round 6
caught its own predecessor's omission and fixed it, explicitly framing
the fix as restoring a discipline the document is supposed to
maintain. But rounds 6, 7, 8, 9, and 10 each landed a real fix pass
(confirmed: each is independently documented in full in `docs/STATUS.md`
and in its own pair of `docs/reviews/2026-09-07-round-{6,7,8,9,10}-*`
files, and each corresponds to a real commit touching this plan) — and
none of the five added a `Pass M`/`N`/`O`/`P`/`Q` entry here. This is
the same "fix landed at its primary site (STATUS.md, the collapse-log,
the individual Step/§10A text), not swept to every cross-referencing
surface" pattern `docs/collapse-log.md` has logged in six of the last
eight rounds — recurring here not as a missing citation inside a
single sentence, but as an entire section of the document's own
self-audit trail going stale for five consecutive rounds without
anyone (including four intervening collapse-hunt/expert-review passes,
each of which read this section's neighborhood while checking §14's
other subsections) flagging it.

**Why this is Minor, not higher.** Nothing about the sweep record's
own staleness changes what got fixed, when, or how — every one of
rounds 6–10's findings is independently, accurately recorded in
`docs/STATUS.md` (which this project's own `CLAUDE.md` designates as
the authoritative "what to do next" / state document, not §14.4) and
in the dated `docs/reviews/` files themselves. §14.4 is a
convenience cross-index, not a second source of truth, and no reader
following `docs/STATUS.md` per `CLAUDE.md`'s own session-start
protocol would be misled by its staleness. It is nonetheless a real,
checkable gap in a document that explicitly polices this exact
property of itself.

**What the fix should be.** Add `Pass M` through `Pass Q` (or a single
consolidated entry, if the authors prefer not to reconstruct five
rounds retroactively in the original per-pass granularity) summarizing
rounds 6–10's fix passes, consistent with Pass L's own format, so a
future reader auditing §14.4 for completeness (as this round did) does
not have to cross-reference `docs/STATUS.md` to discover the gap.

**How verified.** Full read of §14.4's Pass A–L entries; grep for
`^\s*-\s\*\*Pass [A-Z]` across the full document (7 matches, A through
L, none beyond); cross-checked against `docs/STATUS.md`'s own
round-by-round narrative (rounds 6–10 all independently confirmed to
exist there) and against the file listing of `docs/reviews/`
(`2026-09-07-round-{6,7,8,9,10}-plan-{collapse-hunt,expert-review}.md`,
all ten files present).

**Silent or self-revealing?** Self-revealing to anyone who greps §14.4
for its own stated pattern (as this review did) — but it went
unnoticed by four intervening review rounds, each of which had reason
to read §14's neighborhood for its own targeted purposes without
checking this specific self-consistency property.

---

## Round 10's other closure items re-attacked directly

- **The `web-tree-sitter@^0.26.13` incompatibility fix.** Re-derived
  from scratch (fresh install, fresh scripts, not reusing any prior
  round's script) across all six of the plan's own §11.4-named
  languages — all six load and parse correctly under
  `web-tree-sitter@0.25.10`. Genuinely closed.
- **The `T22-3` grammar-load-failure-fallback test spec.** Read in
  full (`docs/plans/plan-phase-a.md:5307–5319`); its own text ("a
  doubled `Language.load` forced to reject… that language's files fall
  back to `generic_frontend.ts`; `runIndex` completes for the rest of
  the repository") is internally consistent with Step 22's prose and
  does not depend on anything this round found wrong. Survives.
- **`D-plan-2`'s corrected collapse-test.** Re-attacked with the
  question sharpened one step further than round 10's own framing:
  does "the pinned combination loads and parses" settle everything a
  future maintainer needs? No fresh gap found — the entry's own
  "Steers toward" already states that a future bump requires
  re-running *both* the semver check and the functional check, which
  is the correct generalization of this round's own method. Survives.
- **`N3`/`N4`'s "six numbers" framing.** Re-attacked given this round's
  suspicion (a bare grep for "six number" still finds two hits) that
  it might be a stale citation missed by round 9's "seven" correction.
  It is not: `N3`/`N4`'s own scope is explicitly the four exit-run
  calibration-loop values plus `reuse_dominance_k` and
  `clear_length_floor` — six values, correctly still six — and
  `reindex.lock_stale_ms` (the seventh overall tuning default) is
  correctly *excluded* from `N3`/`N4`'s scope and covered instead by
  `N7`'s own dedicated entry, exactly as round 10's Collapse 2 argued
  it should be. No defect; this round's own suspicion was wrong and is
  recorded honestly rather than silently discarded.

## Collapse-tests re-attacked (all survive except the two named above)

Every §10A entry touched by the round-10 diff, plus a sample of
untouched entries, was re-read and attacked with a question at least as
hard as its own stated "hardest question":

- **D-plan-1** (write-time predicate cap). Re-attacked: does the cap
  extend to a mechanism added mid-build via a *bug fix* (Step 37's
  reclaim logic) rather than a recognizer-growth request? No — as
  round 10 itself already found, the cap's stated scope is recognizer
  predicates specifically, and this round's Collapse 1/2 are further,
  independent confirmation that no existing mechanized gate in this
  plan catches "a new mechanism shipped without its own §10A entry
  or without its own new logic being safe" in general. Not a new
  defect in D-plan-1; recorded as context, as round 10 also did.
- **D-plan-2** (dependency floor). Survives, re-verified by execution
  this round (see above), not merely re-read.
- **N7** (`reindex.lock_stale_ms` staleness reclaim). **Does not
  survive** — see Collapse 1. N7's own "Steers toward" field's parting
  remark — that a "token-verify-before-unlink" alternative "satisfies
  the same job" — was itself an unverified claim until this round
  executed it; it does, but a naive inode-based version of it (a
  plausible reading of "token") does not, which this round also
  verified and which N7's own text gives no indication its author
  checked.
- **N1, N2, N5, N6** — re-read; no new crack found under the harder
  framing each was pushed with this round (does the scheme-residual
  disclosure in N1 change anything now that architecture V14 was
  corrected? No — unrelated axes. Does N5's `oracleSpawn` confinement
  interact with Step 21/22's grammar-load fallback? No — `oracleSpawn`
  wraps only the detached-reindex spawn, not the in-process frontend
  dispatch). Survive.
- **Plan-level: exit-run report shape.** Re-attacked against Collapse
  1/2 together: would a concurrent-reindex double-count (Collapse 2's
  consequence) surface in Step 42's mandatory metrics, or would it
  silently *inflate* a genre count instead of deflating one (the
  inverse of round 8's and round 10's own framing, both of which
  discussed a defect that *lowers* a count)? Plausibly the latter —
  an inflated `cochange_pairs.confidence` from double-counted evidence
  would make a Coupling or Consequence whisper's evidence ratio read
  as *stronger* than the real history supports, which is a different
  failure direction (a false positive dressed as strong evidence,
  rather than round 8's false negative dressed as an honest low
  floor) that the exit report's current success criteria are equally
  unequipped to distinguish from genuine evidence. Not a new finding
  against the report shape itself, but a sharper, previously-unstated
  angle on why Collapse 1/2 matter to the mission, parallel to round
  10's own treatment of this collapse-test.

## Mission-fidelity cross-trace

Phase A's goal (spec §11.5; `docs/STATUS.md`'s "north star") is an
**honest deterministic foundation that measures its own floor** — and
is also the test bed later phases' fixtures and thresholds are derived
from, so a silently-broken mechanism corrupts data nobody can
re-collect after the exit run. Collapse 1 is a direct hit on this axis
in the same shape round 10 itself found and round 9 and round 8 found
before it: a fix for a silent concurrency defect leaves open a
narrower, differently-timed instance of the identical defect class,
discoverable only by re-executing the fix's own literal mechanism
against a scenario the fix itself makes newly possible (here: one
racer completing an entire reclaim-and-recreate cycle while a second,
independently-delayed racer's earlier decision goes unrevalidated —
a scenario that did not exist before round 10 introduced the
recreate-at-the-same-path reclaim). Collapse 2 sharpens *why* this
matters beyond round 10's own framing: the plan's own newer content
disagrees with itself about whether the reachable failure mode is
"wasted CPU" or "corrupted measurement data," and the mission-relevant
answer — argued from the miner's own accumulation logic, though not
yet executable — is closer to the more alarming of the two
characterizations the plan itself already contains. Finding 3 is a
narrower, procedural instance of the same standing lesson
(`docs/collapse-log.md`, rounds 2–8): a documented self-check
discipline, once relaxed, does not self-repair — it takes an
independent, explicitly-scoped read to notice five rounds later.

## Attestation

- **What was executed, and where.** All JavaScript, `npm install`, and
  shell commands quoted above were run live this session in the
  session's own scratchpad directory
  (`/tmp/claude-0/-home-user-agent-armory/219f38f1-6a91-59c0-9c65-0c0a8fbaa399/scratchpad/`),
  freshly authored this session for this review. The scratchpad
  directory was found to already contain files from what appears to be
  a prior invocation of this same session container (`lock_race_test.js`,
  `/tmp/oracle_r10/`, etc.) — these were **not** read as evidence, not
  reused, and not treated as this round's own work; every script and
  every execution cited above was written and run fresh this session,
  under distinctly-named files, specifically to avoid any doubt about
  provenance.
- **What was not independently re-verified this round, and why.**
  `git log --numstat -M`'s rename-collapsing behavior (rounds 8–10's
  finding) was not re-executed fresh this round — no plan text
  touching Step 20's detector changed since round 9, and this round's
  brief prioritized round 10's own two newest fix mechanisms plus
  continued generalization toward unchecked claims. Steps 2–19,
  24–36, and 38–43 were not re-read line-by-line this round (see the
  scope note above); this is a disclosed scope choice, not a silent
  gap, consistent with round 10's own precedent for unchanged
  material.
- **Confidence.** High on Collapse 1 — reproduced deterministically
  via a real two-OS-process execution of the plan's own literal
  algorithm, not inferred, and cross-checked against a single-process
  hand-interleaved version (the technique round 10 itself validated)
  with the identical outcome; a candidate fix (content-token
  verification) was also executed and shown to close the gap across
  three repeated runs, and a plausible-looking but wrong alternative
  fix (inode-identity verification) was executed and shown to fail,
  which this review reports precisely so a future round does not have
  to rediscover that specific dead end. High on Collapse 2 (a direct
  textual comparison of two passages in the same document; the
  double-counting *consequence* argument is reasoned, not executed,
  and is disclosed as such). High on Finding 3 (a grep-verified
  absence, cross-checked against two independent sources —
  `docs/STATUS.md` and the `docs/reviews/` file listing — that both
  confirm the five missing rounds are real, documented fix passes).
  This document's own claims are, per this project's own standing
  rule, subject to the identical re-execution discipline by round 12 —
  the two-process reclaim script and the content-token candidate fix
  should be the first things a future round re-runs against whatever
  fix lands for Collapse 1, exactly as this round re-ran round 10's.
