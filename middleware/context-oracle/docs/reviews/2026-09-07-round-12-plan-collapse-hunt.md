# Independent collapse-hunt — Phase A implementation plan, round 12 (2026-09-07)

**Artifact:** `docs/plans/plan-phase-a.md` (7735 lines) and
`docs/architecture-phase-a.md` (2076 lines), at commit
`90bae157cf7f29ce7dc3b7e0fdc5e4da353d5c78` ("context-oracle: fix
round-11 collapse-hunt and expert-review findings") on branch
`claude/plan-correction-strategy-57ot28`, confirmed via `git log -1
--format="%H %ci"` and `git status --short` (clean) this session,
before any line citation below.

**Reviewer:** independent subagent, no prior context on this session,
not the author of either document or of any prior fix pass or review
of them.

**Axis:** mission-fidelity (`CLAUDE.md` dominating rule 2's collapse
test and rule 3's phase-goal-governs rule); literal re-execution of
round 11's own fix mechanism — the content-token identity verification
added to Step 37's stale-lock reclaim — against every interleaving this
round could construct, not only the ones round 11 constructed, per the
task brief and per this document's own now-repeated lesson (collapse-log
rounds 9 and 11: a fix's own closure claim, its own collapse-test, and
its own unit test are not independent verification of it if all three
were authored against the same scenario its author had in mind).

**Read in full before the attack:** `middleware/context-oracle/CLAUDE.md`
(full, with particular attention to dominating rules 2 and 3);
`docs/STATUS.md` (full, current, post-round-11); `OWNER-LEDGER.md`
(full); `docs/collapse-log.md` (full 2026-09-07 entry set, rounds 6
through 11 read closely for method and pattern history; earlier entries
sampled); both round-11 review documents in full
(`docs/reviews/2026-09-07-round-11-plan-collapse-hunt.md`,
`docs/reviews/2026-09-07-round-11-plan-expert-review.md`); Step 37 in
full at its current text (`docs/plans/plan-phase-a.md:2947-3111`); the
new §10A entry N7 in full (`:4315-4383`); `T37-3`'s corrected spec in
full (`:5546-5611`); §13 R11 in full (`:6711-6758`); the relevant
`§14.4` sweep-record entries, specifically Pass M through Pass R
(`:7149-7279`); `docs/architecture-phase-a.md` AD-26 in full
(`:1650-1689`) plus its cross-references (lines 771, 1483, 1901, 1911,
2059); a full-document grep sweep for every citation pattern relevant
to round 11's fix (`0\.26\.13`, `reclaiming-`, `content.?token`,
`renameSync`, `no new failure mode`, `race-safe`, `Pass [A-Z]`,
`vacant|third process|fourth process|uninvolved`) to confirm nothing
outside the read scope silently duplicates or contradicts a claim under
test; a targeted sample of material outside round 11's own diff, per
this round's brief (§2.3's coverage-reconciliation table, Step 20's
disclosed brace-in-filename residual, Step 23's `reindex.lock_stale_ms`
seeding text) to check for staleness unrelated to round 11's fix — none
found.

**Verification instruments used beyond reading.** A live shell,
Node.js v22.22.2, npm 10.9.7. Specifically:

- A **literal, unmodified transcription of Step 37's full current
  (round-11) reclaim algorithm**
  (`docs/plans/plan-phase-a.md:2962-3076`) as runnable JavaScript
  (`lockalgo.mjs`, written fresh this session, not reusing any prior
  round's script), executed against a real filesystem three ways:
  1. A single-process, hand-interleaved reproduction of round 11's own
     targeted scenario (one reclaimer completing its entire cycle
     before a second, independently-delayed reclaimer acts on its own
     stale reading) — to independently confirm round 11's fix
     genuinely closes the exact case round 11 built it to close, before
     attacking anything further.
  2. A single-process, hand-interleaved reproduction of a **new**
     scenario this round constructed: a completely uninvolved third
     process acquiring the lock during the brief but real window the
     fix's own mismatch-handling branch leaves the lock path vacant.
  3. A **real two-OS-process** reproduction of the same new scenario
     (`child_process.spawn`-based: two genuinely separate, concurrently
     running `node` processes, synchronized by plain-file barriers
     placed only at the exact gap the algorithm's own text leaves
     unsynchronized), run three times with zero variance.

## Verdict: DOES NOT SURVIVE (one new Serious collapse, silent with a self-revealing side effect; round 11's own two closure claims otherwise hold; one new Minor disclosed-nowhere residual; two candidate concerns from the task brief checked and dismissed with reasoning)

- **Round 11's own headline fix, re-verified genuinely closed for the
  exact scenario round 11 built it to close** (two actors only: a
  faster reclaimer that completes its full cycle, and a delayed
  reclaimer acting on a stale decision made before the faster one ran).
  Independently re-executed from a fresh transcription of the current
  text, not reused from round 11's own scripts. See "Round 11's closure
  items re-attacked directly," Scenario A.
- **One new Serious collapse (silent, with a self-revealing side
  effect): the mismatch branch's own remediation — restoring the live
  lock to `lockPath` via an unconditional `fs.renameSync` — is itself
  an unguarded, non-exclusive write into a path that, during the exact
  window that action occupies, is legitimately available for anyone to
  acquire.** A third process's ordinary, non-adversarial lock
  acquisition landing in that window is silently annihilated — not by
  the original stale-lock confusion the content-token check exists to
  prevent, but by the content-token check's own "safe" cleanup action.
  Reproduced by direct execution, single-process and by two genuinely
  separate, concurrently running OS processes, three runs, zero
  variance. See Collapse 1.
- **One new Minor finding: a process that crashes between step (c)'s
  rename and step (d)'s resolution (match-delete or mismatch-restore)
  leaves an orphaned `.reclaiming-<pid>` file behind forever**, with no
  mechanism anywhere in Step 37 that ever inspects or cleans paths
  other than `lockPath` itself. Disclosed nowhere. See Finding 2.
- **Two candidate concerns from the task brief, checked by direct
  execution or by argument and dismissed as non-issues**, recorded
  honestly rather than silently discarded: `crypto.randomUUID()`
  collisions (negligible at 122 bits of entropy per token, discussed
  under "Concerns checked and dismissed"); a third reclaimer of the
  *same* original stale file racing the two already covered by
  `T37-3`(d) (generalizes safely — the `ENOENT` branch already covers
  arbitrarily many losers against one winner, verified by extending the
  hand-interleaved script to three racers).
- **No regression found in the round-11 fix's sweep to its
  cross-referencing sites** (Step 37 body, N7, `T37-3`, §13 R11,
  §14.4, architecture AD-26) — all six sites are mutually consistent
  with each other about what they claim is closed and what remains
  open. The defect this round found is not a *sweep* failure (the
  sites do not contradict each other); it is a *substantive* gap that
  every one of those six mutually-consistent sites shares, because none
  of them constructed the interleaving that exposes it. This is worth
  stating precisely, since this project's own history could make "no
  sweep failure found" read as "the mechanism is now fully verified,"
  which is not what this round is reporting.
- A targeted sample outside round 11's own diff (§2.3's coverage table,
  Step 20's disclosed brace-in-filename residual, Step 23's
  `reindex.lock_stale_ms` seeding text) found no new staleness
  unrelated to round 11's fix.

---

## Collapse 1 (Serious, silent with a self-revealing side effect) — the content-token fix's own mismatch-restore step is an unguarded, non-exclusive write that a completely uninvolved third process's ordinary lock acquisition can land inside, reproducing the identical "two live, unlocked reindexes" defect the token check exists to prevent

**Where.** `docs/plans/plan-phase-a.md:3048-3061` (Step 37, sub-step
2(d), the mismatch branch's restore action); the same unguarded write
is asserted safe at `docs/plans/plan-phase-a.md:3061` ("no new failure
mode") and again at `docs/plans/plan-phase-a.md:4359-4362` (N7's Answer
field, "the same fallback shape... so no new failure mode is
introduced"); `T37-3`'s case (e)
(`docs/plans/plan-phase-a.md:5578-5599`) tests only a two-actor version
of the scenario and does not construct the interleaving below;
architecture `AD-26`'s disclosure
(`docs/architecture-phase-a.md:1658-1671`) states the residual window
is bounded to "the gap between one reclaimer's file-identity read and
its own rename call," which is not the window this finding uses.

**What the plan says (current text, quoted in full since the exact
wording is where the gap lives).** Step 37, sub-step 2(d):

> **Mismatch** — between (a)'s read and (c)'s rename, some other
> process replaced `lockPath` with a new, live lock (most plausibly the
> true owner of the *original* stale lock finishing its own reclaim and
> recreating it). The file this process just renamed away is that live
> lock, not the stale one: deleting it would silently evict a live
> reindex, reproducing the exact defect this mechanism exists to
> prevent. Instead, restore it —
> `fs.renameSync(lockPath + '.reclaiming-' + process.pid, lockPath)` —
> so its true owner's own `finally`-block release still finds it at the
> path it expects, close the descriptor, and skip this reindex attempt
> silently: this process lost the race, exactly as the plain `ENOENT`
> cases above already do — no new failure mode.

And N7's Answer field, written specifically to interrogate this
mechanism: "a mismatch restores the live lock to its original path and
skips silently, the same fallback shape the 'not stale' and plain
`ENOENT` cases already use, so no new failure mode is introduced."

**What's wrong.** The plan's own framing treats the restore action as
equivalent in kind to the algorithm's other "skip silently" branches
(not-stale; `ENOENT` on the initial rename). It is not. Every other
"skip silently" branch does nothing to the filesystem beyond closing a
descriptor — there is nothing to go wrong because no write happens.
The restore branch is the **only** branch in the entire algorithm that
performs a write into `lockPath` using a primitive with no
compare-and-swap semantics against its destination:
`fs.renameSync(reclaimPath, lockPath)` **unconditionally succeeds and
silently overwrites whatever currently occupies `lockPath`**, exactly
as the very first line of Step 37's own N7 narrative already establishes
about `rename(2)` in general ("moves whatever currently occupies the
source path, with no notion of 'the file I mean'") — but the plan never
applies that same observation to the *destination* side of this specific
rename, only to its source side.

Between the moment sub-step 2(c) executes (`fs.renameSync(lockPath,
reclaimPath)`, which necessarily leaves `lockPath` **vacant** — nothing
holds that path at that instant) and the moment sub-step 2(d)'s restore
executes, `lockPath` is a completely ordinary, empty path. Nothing in
the algorithm reserves it, marks it, or otherwise signals that a
resolution is pending. Any process — not necessarily another reclaimer;
an entirely ordinary, first-time `tryAcquire()` from any `refreshIfStale`
trigger that happens to fire in that instant — can legitimately create a
fresh, live lock there via the same `O_CREAT|O_EXCL` primitive Step 37
specifies for ordinary acquisition, exactly as designed. When the
delayed reclaimer then executes its restore, it does not check what (if
anything) is now at `lockPath`; it simply renames its own held file back
onto it, silently destroying the brand-new live lock a completely
uninvolved fourth actor just created, with that actor never informed.

**How verified.** Independently transcribed Step 37's current, full
algorithm (`lockalgo.mjs`) and ran it three ways, all fresh this
session:

1. **Sanity check — round 11's own targeted scenario, no interference**
   (`scenario_A_sanity_closed.mjs`): P1 and P2 both capture the same
   stale lock's state; P1 completes its entire reclaim cycle and begins
   "running"; P2, delayed, then acts on its stale decision. Result:
   P2's identity check correctly reports a mismatch, restores P1's
   live lock unchanged, and skips. **Confirmed: round 11's fix
   genuinely closes the two-actor scenario it was built and tested
   against** — this round did not stop here.
   ```
   [P2] outcome: { result: 'skip', reason: 'mismatch-detected-restored' }
   Final lock file content: P1-c6dcd09c-... (expect: still P1 token P1-c6dcd09c-...)
   P2 correctly detected mismatch and did NOT acquire: true
   P1's lock survived intact (content unchanged): true
   ```
2. **Single-process hand-interleaved reproduction of the new scenario**
   (`scenario_B_restore_clobber.mjs`): identical setup through the
   point where P2 executes sub-step 2(c) (`renameSync(lockPath,
   reclaimP2)`, leaving `lockPath` vacant). At exactly that point, a
   third process P4 executes an ordinary `tryAcquire()` — the same
   primitive every legitimate first-time acquisition uses — and
   succeeds, because the path is vacant. P2 then completes its identity
   check (correctly finds a mismatch, since the content at its own
   reclaim path is P1's token, not the stale token P2 captured) and
   executes its restore. Result:
   ```
   [P4] tryAcquire SUCCEEDED (lockPath was momentarily empty), token = P4-e656d23e-...
   [P2] (d) content at own reclaim path = P1-6560db69-...  captured (a) = crashed-pid-999-token-STALE
   [P2] match? false -> mismatch means "restore and skip silently, no new failure mode" (per plan text)
   [P2] restored reclaim-path file onto lockPath, skipping silently

   === SCENARIO B RESULT ===
   Lock file content after P2 "safely" skips: P1-6560db69-...
   Is it P4's token (i.e. P4's live lock survived)? false
   Is it P1's token (i.e. P4's live lock was silently clobbered)? true
   ```
   P4's live lock is gone, with no exception, no diagnostic, and no
   indication to P4 that anything happened. P1 (still genuinely
   running) and P4 (believing it acquired the lock, and now actually
   running unlocked) are both proceeding as if each holds exclusive
   ownership.
3. **Real two-OS-process reproduction** (`proc_P2.mjs`, `proc_P4.mjs`,
   `driver_two_process.mjs`): two independently launched `node`
   processes — not simulated interleaving in one process — synchronized
   by two plain-file barriers placed only at the gap between P2's own
   step-(c) rename and its step-(d) restore (nothing inside either
   process's own decision logic was altered, matching round 11's own
   established barrier-placement discipline). Run three times, zero
   variance:
   ```
   [P2] step (c) rename succeeded -> .../.reindex.lock.reclaiming-P2 (lockPath now vacant)
   [P4] tryAcquire SUCCEEDED (lockPath was vacant), token = 28876-e773c976-...
   [P2] step (d) content at own reclaim path = P1-18043265-...  captured (a) = crashed-pid-999-token-STALE
   [P2] MISMATCH -> restored reclaim-path file onto lockPath, skipping silently (per plan text)

   === TWO-REAL-PROCESS RESULT ===
   P4's live lock survived on disk? false
   P1's lock silently reappeared, clobbering P4's, via P2's restore-on-mismatch step? true
   ```
   Identical outcome across all three real dual-process runs.

**A further, self-revealing consequence found while constructing the
scenario (release-time crash).** Continuing scenario B/C to the release
step: whichever of the two genuinely-running processes (P1, the
original faster reclaimer; P4, the clobbered-in interloper) reaches its
own `finally`-block release first calls `fs.unlinkSync(lockPath)` with
no identity check — exactly as Step 37 sub-step 1 literally specifies
("unlink the lock file via `fs.unlinkSync(lockPath)`") — and succeeds,
deleting whichever file is actually there (by this point, always P1's
restored file, per the trace above, regardless of which of P1/P4 calls
it "believing" it is deleting its own). When the **other** of P1/P4
later reaches its own release and calls the identical
`fs.unlinkSync(lockPath)`, the file is already gone:
`unlinkSync` **throws `ENOENT`**, uncaught by anything Step 37's text
specifies for the release path. Verified directly:
```
[P4] release completed with no error (P4 has no way to know it just deleted a stranger's lock file)
lockPath exists now? false
[P1] release THREW: ENOENT -- an unhandled exception in the release path,
     which the plan's literal "finally block: unlink the lock file" text does not guard against.
```
This means the eventual failure is not always fully silent: one of the
two colliding processes crashes on an uncaught exception at the exact
moment it finishes its (corrupted) reindex — self-revealing in the
sense that *something* visibly breaks, but not in a way that identifies
the actual root cause (a lock race four steps and possibly minutes
earlier), and only for whichever process loses the release-order coin
flip; the other process's release succeeds silently, having deleted a
stranger's lock file with no diagnostic at all.

**Why this is a distinct gap from what round 11 already disclosed, not
a re-statement of it.** Round 11's own disclosure (Step 37's closing
paragraph, N7's "Steers toward" field, and `AD-26`) all describe the
residual identically: "the gap between step (a)'s read and step (d)'s
comparison — a handful of synchronous syscalls" — i.e., the risk that
**the reclaiming process itself** might, within that narrow window,
wrongly conclude a live lock is the stale one it inspected. This
round's finding is a different failure shape occupying a different,
adjacent window: not the reclaiming process being fooled by a changed
*source*, but the reclaiming process's own corrective *write* fooling
nobody about identity (the mismatch check is working correctly) while
still destroying an unrelated party's state, because the *write*
primitive used to correct the situation has no exclusivity guarantee at
all — unlike `tryAcquire()`'s `O_CREAT|O_EXCL`, which is exactly why the
"match" branch's own retry-acquisition (`docs/plans/plan-phase-a.md:3045-3047`)
does **not** have this problem: a third party landing in *that* window
just causes the retry to fail `EEXIST`, which the algorithm already
treats as a safe "skip silently" outcome. The mismatch branch's restore
is the one and only place in the whole mechanism where a non-exclusive,
destination-blind write is used for cleanup, and it is exactly the
place none of round 11's three review artifacts (Step 37's own prose,
N7, `T37-3`) constructed a scenario to test.

**Why it matters (mission-fidelity).** This is the third occurrence, in
three consecutive rounds (9, 10, 11 fixing round 10's gap; now round
12), of the identical shape `docs/collapse-log.md` has now named twice:
a fix for a silent concurrency defect leaves open a narrower,
differently-shaped instance of the same defect class, invisible to the
fix's own test because the test was constructed against the scenario
its author had in mind. The consequence is identical every time it
recurs: two full `runIndex` passes writing to `store.db` unlocked and
unserialized at the application level, which — per §13 R11's own
(correctly reconciled, this round confirms) framing — silently doubles
co-change evidence for the miner's overlapping commit range, corrupting
the exact measurement data Phase A's mission (spec §11.5, `docs/STATUS.md`'s
own "north star") depends on being an honest floor. Because a plain,
ordinary `tryAcquire()` — not an adversarial or contrived reclaim — is
sufficient to trigger this round's finding, the realistic frequency is
plausibly *higher* than round 11's own scenario: any `refreshIfStale`
trigger firing during the brief window a delayed reclaimer's mismatch
branch is active is sufficient, and that window recurs every single
time a stale-lock reclaim happens to encounter a race at all (i.e.,
precisely the situations this mechanism exists to handle).

**Silent or self-revealing?** Primarily silent — no exception, no log
line, and no diagnostic fires anywhere in the sequence up to the point
both processes are running unlocked. One release-time side effect (an
uncaught `ENOENT` in whichever of the two colliding processes releases
second) is self-revealing in the narrow sense that *something* crashes,
but it surfaces four-to-N steps after the actual defect, with nothing
in the crash pointing back at a lock race, and only 50% of the time by
process-order chance — the other process's release proceeds with no
error at all, having silently destroyed a stranger's lock file.

---

## Finding 2 (Minor, self-revealing on inspection, disclosed nowhere) — a crash between sub-step 2(c) and sub-step 2(d) leaks an orphaned `.reclaiming-<pid>` file that no part of Step 37 ever inspects again

**Where.** `docs/plans/plan-phase-a.md:3032-3061` (sub-steps 2(c)-2(d)).

**What's wrong.** If the reclaiming process crashes after
`fs.renameSync(lockPath, reclaimPath)` (sub-step (c)) but before
resolving sub-step (d) (deleting on match, or restoring on mismatch),
the file at `reclaimPath` (`lockPath + '.reclaiming-<pid>'`) is
permanently orphaned. Nothing in Step 37's staleness check ever
inspects any path other than `lockPath` itself, so this file is never
revisited, never cleaned up, and never contributes to or is checked
against any future staleness decision. Functionally this is close to
harmless — `lockPath` itself is left vacant by the crash, so the next
`tryAcquire()` succeeds cleanly and normal operation resumes
immediately — but it is a real, unbounded, silently-accumulating disk
artifact (one small file per crashed reclaim attempt, forever) that the
plan discloses nowhere, unlike its sibling residuals (N1's
scheme-normalization gap, Step 20's brace-in-filename residual, this
same Step 37's own read-to-rename window), all of which are explicitly
named as accepted rather than left unstated.

**Why Minor, not higher.** No data-correctness or lock-exclusivity
consequence — confirmed by the same execution used for Collapse 1
(interrupting the script between steps (c) and (d) leaves `lockPath`
vacant and a stray `.reclaiming-<pid>` file, and a fresh `tryAcquire()`
against `lockPath` immediately afterward succeeds normally). Purely a
disclosed-nowhere disk-hygiene gap.

**What the fix should be.** Either (a) disclose it in the same register
as Step 37's other named residuals, or (b) have `tryAcquire()`'s own
staleness path also glob for and clean any `.reclaiming-*` file whose
mtime is older than `reindex.lock_stale_ms` before proceeding — cheap,
and consistent with the mechanism's existing staleness vocabulary.

**How verified.** Direct execution: interrupted the transcribed
algorithm between sub-steps (c) and (d) and inspected the directory
listing afterward.

**Silent or self-revealing?** Silent in operation (no diagnostic, no
functional impact observed); self-revealing only to a human
inspecting the project's home directory over a long enough period.

---

## Concerns checked and dismissed (recorded per this project's own rule that a defect worth writing down mid-review is worth a numbered disposition, even a negative one)

- **`crypto.randomUUID()` collisions.** Not a plausible mechanism.
  `crypto.randomUUID()` produces a 122-bit-entropy random value (RFC
  4122 version 4); Step 37's token additionally prefixes it with
  `process.pid`. The birthday-bound collision probability across any
  realistic number of tokens a single project could ever generate
  (crash-and-reclaim events, not per-hook-event volume) is
  astronomically below any other risk in this mechanism. Not executed
  (no instrument can usefully falsify a 2^122-scale claim in a
  code-review timeframe); accepted as correct by the same standard
  round 6-11 have applied to other well-understood primitives (semver
  ranges, UUID entropy) once the underlying mechanism is confirmed to
  be what it claims (`crypto.randomUUID()` is a documented Node.js
  built-in with no history of non-uniform output).
- **Content-token comparison read racing a concurrent write.** Checked
  by construction, not executed: the path read in sub-step 2(d)
  (`reclaimPath = lockPath + '.reclaiming-' + process.pid`) is unique
  per live process, because two processes cannot share a PID on one
  host at the same time (POSIX). The only way a second process could
  ever write to that exact path is if it reused the same PID *after*
  the original process fully exited — which means the original
  reclaim attempt is already resolved (deleted or restored) by the time
  any such reuse could occur, since PID reuse only happens post-exit.
  No plausible interleaving found. This is explicitly a single-host
  claim, consistent with `AD-26`'s and N7's own stated single-host,
  single-user scope.
- **A third reclaimer racing the *same* original stale file (not the
  live-lock-clobber scenario above).** Extended the hand-interleaved
  script to three simultaneous readers of the same stale state, all
  three attempting sub-step (c)'s rename against the original file at
  nearly the same instant. Result: exactly one succeeds (as `T37-3`(d)
  already asserts for two), the other two both receive `ENOENT` and
  skip silently — the `ENOENT` branch generalizes to arbitrarily many
  simultaneous losers against one winner without modification, because
  `rename(2)`'s atomicity is a property of the single source path, not
  of any specific pair of racers. No new defect; `T37-3`(d)'s framing
  ("two simulated concurrent reclaim attempts") is representative of
  the wider N-way case, not a special case of it.

---

## Round 11's closure items re-attacked directly

- **The content-token identity-verification fix, for the two-actor
  scenario round 11 built it to close.** Re-derived from a fresh
  transcription of the current text (not reused from round 11's
  scripts). Genuinely closed — see Scenario A above. **Does not
  survive for the three-actor scenario this round constructed** — see
  Collapse 1.
- **The device+inode-vs-content-token comparison (round 11's own
  "what does not work" finding).** Not re-executed this round — round
  11's own reproduction (three repeated real two-process runs showing
  inode reuse produces false positives) is independently plausible on
  its face (documented POSIX/filesystem behavior, not a novel claim),
  and this round's own Collapse 1 does not depend on or interact with
  the inode-vs-token axis at all (the new gap is at the *write* side of
  the *restore* branch, orthogonal to what identity mechanism is used
  to *detect* a mismatch in the first place — a content token, an
  inode check, or any other identity mechanism would all still perform
  the same unconditional, non-exclusive `renameSync` back onto
  `lockPath` once a mismatch is detected). Disclosed as not
  independently re-verified this round, per this project's own
  attestation discipline.
- **§13 R11's reconciliation with Step 37's "silent index corruption"
  framing (round 11's Moderate collapse fix).** Re-read in full
  (`docs/plans/plan-phase-a.md:6711-6758`). Genuinely reconciled — R11
  now states the double-counting mechanism explicitly and cross-references
  Step 37's own "Impact if wrong," with no remaining contradiction
  found between the two sites.
- **§14.4's Pass M through Pass Q backfill plus Pass R (round 11's
  Minor collapse fix).** Re-read in full
  (`docs/plans/plan-phase-a.md:7149-7279`). All six entries present,
  each accurately summarizing its corresponding round's actual
  findings, cross-checked against `docs/STATUS.md`'s own round-by-round
  narrative and the corresponding `docs/reviews/2026-09-07-round-{6..11}-*`
  files (all twelve files present). Genuinely closed.
- **Architecture `AD-26`'s new disclosure of the reclaim residual
  (round 11's new content).** Re-read in full
  (`docs/architecture-phase-a.md:1650-1689`). Internally consistent
  with Step 37's and N7's own framing at the time it was written — but,
  per Collapse 1 above, the disclosed window ("the gap between one
  reclaimer's file-identity read and its own rename call") does not
  cover the failure shape this round found, so this text will need a
  further edit once Collapse 1 is fixed, not because it is
  inconsistent with anything else in the document today.

## Full-document regression scan (task item 2)

Grepped and read every site round 11's fix touches (Step 37 body, N7,
`T37-3`, §13 R11, §14.4, architecture AD-26) plus their neighboring
cross-references (§7's Step 23 seeding text for `reindex.lock_stale_ms`,
§12.5's Step→T-ID table row for Step 37, the file-skeleton comment for
`reindex_lock.test.ts`). Every site is **mutually consistent** — none
contradicts another about what is claimed closed, what remains
disclosed as open, or which round fixed what. This project's own
most-recurring defect class (a fix landing at its primary site without
sweeping every cross-referencing surface, `docs/collapse-log.md`
rounds 2-8) is **not** what this round found. What this round found is
a different class entirely: a substantive gap that every one of the
mutually-consistent sites shares, because all six were written and
verified against the same author's mental model of the fix, which
never constructed the three-actor interleaving Collapse 1 uses. A
reader who only checked for sweep-consistency (as several prior rounds'
"full-document regression scan" sections primarily did) would find
none, and would be wrong to conclude the mechanism is settled — the
sweep is clean and the mechanism is still broken, which is precisely
why this project's own rule is to independently re-execute rather than
re-read.

A targeted sample of content outside round 11's own diff (§2.3's
coverage-reconciliation table — checked against Step 25/21/30/33/36/38's
own headings, all consistent; Step 20's disclosed brace-in-filename
residual — checked against the current rename-handling logic, still
consistent; Step 23's `reindex.lock_stale_ms` seeding text — checked
against Step 37's cross-reference to it, still consistent) found no
staleness unrelated to round 11's fix. This was a sample, not an
exhaustive re-read of Steps 2-19, 24-36, 38-43 — a disclosed scope
choice, consistent with round 11's own precedent for unchanged
material and the git-diff-based reasoning that content untouched since
a fully-attested prior full read remains as it was.

## Mission-fidelity cross-trace

Phase A's goal (spec §11.5; `docs/STATUS.md`'s "north star") is an
honest deterministic foundation that measures its own floor, and is
also the test bed later phases' fixtures and thresholds are derived
from — so a silently-broken concurrency mechanism corrupts data nobody
can re-collect after the exit run. Collapse 1 is the fourth occurrence
of the identical mission-fidelity hit in this mechanism's four-round
history (round 9: unlink with no release; round 10: unlink-based
check-then-act race; round 11: rename-based check-then-act race one
level up; round 12: the round-11 fix's own remediation action
introduces a fifth, adjacent unguarded write). Each fix has correctly
closed the exact scenario its predecessor's finding named and each has
left open a narrower, differently-shaped instance of the same defect
class discoverable only by constructing an interleaving nobody
constructed yet — which is exactly the standing lesson
`docs/collapse-log.md`'s round-11 entry already states in general form
("construct the interleaving that maximizes the vulnerable window's
duration, not only the interleaving that maximizes apparent
simultaneity") and which this round sharpens one step further: the
interleaving that matters is not always a second instance of the *same*
operation racing the *original* one — here it is an *unrelated* third
operation racing the *fix's own cleanup step*, which no round yet had
constructed because every prior round's attention was on the reclaim
path's read side, never its own write side.

## Attestation

- **What was executed, and where.** All JavaScript and shell commands
  quoted above were run live this session in the session's own
  scratchpad directory
  (`/tmp/claude-0/-home-user-agent-armory/219f38f1-6a91-59c0-9c65-0c0a8fbaa399/scratchpad/r12/`),
  freshly authored this session (`lockalgo.mjs`,
  `scenario_A_sanity_closed.mjs`, `scenario_B_restore_clobber.mjs`,
  `proc_P2.mjs`, `proc_P4.mjs`, `driver_two_process.mjs`), not reused
  from any prior round's transcript or from any file already present in
  the scratchpad directory.
- **What was not independently re-verified this round, and why.** The
  device+inode-vs-content-token comparison (round 11's own execution)
  was not re-run — reasoned as orthogonal to this round's finding, see
  "Round 11's closure items re-attacked directly." The
  `web-tree-sitter`/`tree-sitter-wasms` dependency-floor fix (rounds
  10-11) was not re-executed this round — unchanged since round 11's
  own from-scratch re-derivation across eight grammars, and no plan
  text touching it changed since. Steps 2-19, 24-36, 38-43 were sampled,
  not re-read line-by-line, per the scope note above.
- **Confidence.** High on Collapse 1 — reproduced deterministically via
  a real two-OS-process execution of the plan's own literal current
  algorithm (three runs, zero variance), cross-checked against a
  single-process hand-interleaved version with the identical outcome,
  and the same instrument first confirmed round 11's own targeted
  scenario is genuinely closed before attacking further (Scenario A),
  establishing that the new finding is not an artifact of a
  mistranscribed algorithm. High on Finding 2 (directly observed by
  interrupting the script mid-sequence). Medium-high on the two
  dismissed concerns (`crypto.randomUUID()` collisions, content-token
  read races) — reasoned from documented primitive semantics rather
  than executed, disclosed as such, in the same register this
  project's own prior rounds use for claims beyond what a
  code-review-scale instrument can usefully falsify. This document's
  own claims are, per this project's standing rule, subject to the
  identical re-execution discipline by round 13 — the two-process
  restore-clobber script should be the first thing a future round
  re-runs against whatever fix lands for Collapse 1, exactly as this
  round re-ran round 11's own two-process script logic against round
  11's fix.
