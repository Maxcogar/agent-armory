# Expert review (round 12, re-review) — `docs/plans/plan-phase-a.md` and `docs/architecture-phase-a.md`

**Date:** 2026-09-07
**Reviewer:** fresh independent `/expert-review` pass; not the author of either
document, any prior fix pass, or any of the twenty-two prior review documents
on this artifact; no prior context on this session.
**Artifacts:** `middleware/context-oracle/docs/plans/plan-phase-a.md` (7735
lines) and `middleware/context-oracle/docs/architecture-phase-a.md` (2076
lines), both at commit `90bae157cf7f29ce7dc3b7e0fdc5e4da353d5c78` on branch
`claude/plan-correction-strategy-57ot28` (`git log -1 --format="%H %ci"`:
`90bae15… 2026-09-07 10:27:35 +0000`; `git status` clean tree, confirmed this
session before any citation below).
**Round:** 12 (re-review of round 11's collapse-hunt and expert-review, both
fixed in commit `90bae15`, landed against round 10's output `26c2ec1`).
Rounds 1–11 history (from `docs/STATUS.md` and the twenty-two prior review
documents in `docs/reviews/`): round 1, 3 collapses/4 partials/6 missed
decisions + 10 expert-review findings; round 2, 1 collapse/3 partials/1
procedural gap + 9 expert-review findings incl. an overclaim; round 3, 2
collapses/2 partials + 1 Systemic×2 + 2 Moderate + 1 Minor; round 4, 2
collapses/0 partials + 1 Systemic×2; round 5, 2 collapses (one incomplete) +
1 Systemic×2 at 6 sites + 1 Minor; round 6, 1 collapse + 2 Moderate/2 Minor;
round 7, 1 Critical + 1 Moderate (expert-review) + 1 collapse + 3 Minor
(collapse-hunt); round 8, 1 Serious + 1 Moderate (expert-review) + 2
collapses (collapse-hunt); round 9, 2 Serious (expert-review) + 1 collapse +
2 findings (collapse-hunt); round 10, 1 Critical + 1 Moderate (expert-review)
+ 1 Serious collapse + 2 findings (collapse-hunt); round 11, 1 Serious
(expert-review) + 1 Serious collapse (both independently, one
hand-interleaved, one real two-OS-process) + 1 Moderate + 1 Minor
(collapse-hunt).

**This round independently re-executes round 11's own two headline claims by
direct execution against a real filesystem, per the task brief and per this
document's own now-four-times-repeated lesson that a fix's own prose,
collapse-test, and unit test are not independent verification of it.**
Claim (a) — the content-token identity check closes the delayed-reclaimer
race round 11 found — is **genuinely true for the exact two-actor scenario
round 11 constructed**, reproduced here with a real two-OS-process execution
(not merely single-process hand-interleaving) across multiple runs, zero
failures. Claim (b) — no other new race exists in the current algorithm —
is **false**: round 11's own remediation branch (the "mismatch → restore
the live lock" step, sub-step 2(d) of Step 37, added this round-11 fix pass
specifically to close the delayed-reclaimer race) opens a **third, distinct
race** that round 11 did not construct and its own `T37-3` case (e) does not
test — an entirely ordinary, unrelated `tryAcquire()` call (the single most
common code path in this whole mechanism, requiring no staleness reasoning
at all) can land in the brief window between the restoring reclaimer's
rename-away and its own restore-rename, acquire the now-vacant lock path
legitimately, and then be silently, unconditionally overwritten by the
restore's own `renameSync` call — which (unlike `fs.open(..., O_EXCL)`) has
no conflict-detection semantics and clobbers whatever currently occupies the
destination. The result, reproduced by three genuinely separate, real `node`
OS processes: two processes (the original winning reclaimer and the
just-clobbered third acquirer) both genuinely believe they hold the
exclusive reindex lock, unserialized, for the full remaining duration of
both their reindex runs — the identical consequence, and identical silence,
that round 9, round 10, and now round 11's own fix each found and believed
closed in this same mechanism. Classified **Serious**, matching this
project's own established Critical-vs-Serious threshold (a conditional,
concurrency-dependent failure of a load-bearing mechanism, not a total,
unconditional, every-invocation failure). Architecture `docs/architecture-phase-a.md`'s
`AD-26` — corrected this round-11 fix pass specifically to disclose the
residual — is itself **inaccurate**: it frames the narrowed window as
exploitable only by "two reclaimers of the same stale lock," when the
window this finding demonstrates is exploitable by any unrelated, ordinary
acquirer with a different and more severe consequence (an undetected,
unconditional overwrite, not a detected mismatch-and-stand-down). A
candidate fix (`fs.linkSync`, which fails `EEXIST` if the destination is
occupied, in place of the restore step's unconditional `fs.renameSync`) was
directly executed and verified to close this specific gap, at the cost of
introducing a smaller, disclosable residual (the original reclaimer can
silently lose its own restored lock without notification) that the plan
does not currently handle either. A full-document regression scan of the
round-11 fix-diff (10 hunks across both files, read in full, matched
byte-for-byte against `git diff 26c2ec1 90bae15`) found no other new
Critical, Serious, Systemic, or Moderate defect: `T37-3`'s case (e), `§13`
`R11`, and `§14.4`'s `Pass R` are each internally consistent with round 11's
own two headline claims and with each other; no stray `0.26.13` citation or
step-number misattribution was found in the fix-diff or in the sites this
round's targeted sweep covered.

---

## Scope and Inventory

### Tool-plan disclosure

`ToolSearch` for CodeGraph/Clear Thought was not invoked this round —
consistent with every prior round's disposition (§15 Q-gap-1/Q-gap-2 in the
plan itself); no finding below depends on either tool. Every claim below is
verified by Read (file:line, this session), Grep (query + result count, this
session), or direct executable checks — Node.js v22.22.2, npm not needed
this round (no new dependency claim), all scripts written and run fresh this
session in
`/tmp/claude-0/-home-user-agent-armory/219f38f1-6a91-59c0-9c65-0c0a8fbaa399/scratchpad/oracle_r12/`,
none reused from any prior round's transcript — never memory, never trust in
a prior review's or the plan's own attestation.

### Scope 1 — Round 11's finding-groups, as closure items (re-executed independently, not re-read)

- [x] **Round-11 expert-review Serious Finding 1 / round-11 collapse-hunt
  Collapse 1 (both independently: Step 37's round-10 atomic-rename reclaim
  closes only the same-instant collision, not the wider delayed-reclaimer
  window; fixed round 11 with content-token identity verification).** Read
  current `docs/plans/plan-phase-a.md:2962–3076` (Step 37 body, full),
  `:4315–4389` (§10A entry N7, full, both its Job/Hardest-question/Answer/
  Steers-toward fields), `:5546–5612` (`T37-3`'s full spec, cases (a)–(e)).
  **Independently transcribed Step 37's current, literal algorithm as
  runnable JavaScript** (`lock.mjs`, not reusing any prior round's script —
  neither round 10's nor round 11's collapse-hunt/expert-review documents
  contain a checked-in script, only described commands and results) and
  executed it three ways:
  1. **Same-instant collision** (`test1_same_instant.mjs`) — reproduces
     `T37-3`(d)'s own literal scenario. **Passes**: exactly one of two
     back-to-back renames against the same still-present stale file
     succeeds; the other observes `ENOENT`. Genuinely closed, consistent
     with round 10's and round 11's own findings.
  2. **Delayed reclaimer, single-process hand-interleaved**
     (`test2_delayed_reclaimer.mjs`) — P1 completes its *entire* reclaim
     cycle (rename → verify → delete → recreate) before P2, which captured
     the *original* stale file's identity before P1 acted, resumes and
     executes its own rename. **Passes**: P2's post-rename content-token
     comparison against its own captured token detects the mismatch
     (P1's live token ≠ the original stale token P2 captured) and
     `renameSync`-restores P1's live lock to `lockPath` rather than
     deleting it; P1's content survives unaltered.
  3. **Delayed reclaimer, two genuinely separate real OS processes**
     (`p1_proc.mjs` + `p2_proc.mjs`, orchestrated by
     `run_two_process.mjs` via plain-file barriers placed only at the
     exact gap the plan's own text leaves unsynchronized — the same
     technique round 11's own collapse-hunt used) — re-run twice for
     determinism. **Passes both times**, identical result to (2).
  **Round 11's claim (a) is genuinely closed for the exact scenario it
  targeted and tested** — this round independently re-derived that result
  via real multi-process execution rather than trusting round 11's prose or
  round 11's own (unpublished) execution log.
- [x] **Round-11 collapse-hunt Collapse 2 / Moderate finding (`§13` `R11`'s
  "not data corruption… a redundant reindex" claim directly contradicted
  Step 37's own "silent index corruption" claim for the identical scenario;
  fixed by correcting R11 to match Step 37's framing).** Read current
  `docs/plans/plan-phase-a.md:6711–6760` (R11, full) side by side with
  `docs/plans/plan-phase-a.md:3098–3110` (Step 37's "Impact if wrong").
  Both now state the same conclusion — a concurrent unlocked double-reindex
  silently *doubles* co-change evidence via `AD-13`'s
  `INSERT … ON CONFLICT DO UPDATE` accumulation reading the same
  not-yet-advanced watermark, not merely duplicating idempotent work — with
  R11 explicitly citing Step 37's "Impact if wrong" rather than contradicting
  it, and correctly disclosing the double-counting argument as reasoned from
  `AD-13`'s stated mechanism, not executed (Phase A's miner does not exist
  yet). **Genuinely closed** — the contradiction is gone and the two entries
  now agree.
- [x] **Round-11 collapse-hunt Finding 3 / Minor (§14.4's sweep-record
  narrative had no entry for rounds 6–10's five fix passes).** Read current
  `docs/plans/plan-phase-a.md:6992–7128` (Pass M through Pass Q) and
  `:7251–7278` (Pass R, round 11's own entry). Grep `^\s*-\s\*\*Pass [A-Z]`
  across the full 7735-line document: **18 hits, A through R, no gaps**
  (round 11's own document reported 7 hits, A–L; this round's fresh count
  confirms M–R were genuinely added and none skipped a letter). Pass R's
  content matches, sentence for sentence, what round 11's two review
  documents actually found (cross-checked against
  `docs/reviews/2026-09-07-round-11-plan-collapse-hunt.md` and
  `2026-09-07-round-11-plan-expert-review.md`, both read in full this
  session). **Genuinely closed.**

**Scope 1 result: three of round 11's four finding-groups (R11/Step 37
reconciliation, §14.4 Pass R, and the content-token fix's closure of the
exact scenario it was built and tested against) are genuinely closed. The
fourth claim — that the content-token fix introduces no other new race —
is false: the fix's own remediation branch (the mismatch-restore step)
opens a new, different race. See Serious Finding 1.**

### Scope 2 — Fix-diff regression scan + targeted full-document sweep

**Fix-diff** (`git diff 26c2ec1 90bae15 -- middleware/context-oracle/docs/plans/plan-phase-a.md middleware/context-oracle/docs/architecture-phase-a.md`,
603 lines, 10 hunks, read in full this session before drawing any
conclusion): confirms the diff touches exactly six sites —
`docs/architecture-phase-a.md:1650–1692` (AD-26), and
`docs/plans/plan-phase-a.md:2962–3076` (Step 37 body),
`:4315–4389` (N7), `:5546–5612` (T37-3), `:6711–6760` (R11),
`:6992–7278` (§14.4 Pass M–R, including the five backfilled entries and the
new Pass R). No other plan or architecture content changed between round
10's and round 11's commits — confirmed mechanically by the diff itself, not
by trusting either round-11 review document's own attestation of its scope.

- [x] `docs/plans/plan-phase-a.md:2947–3113` (Step 37, full section) — Read
  in full. Home of Serious Finding 1: sub-step 2(d)'s mismatch branch
  (`:3048–3061`) is the site where the new race originates.
- [x] `docs/plans/plan-phase-a.md:4315–4389` (§10A entry N7, full,
  including Job/Hardest-question/Answer/Steers-toward) — Read in full. The
  Answer field's closing claim ("no new failure mode is introduced,"
  `:4362`) is the second site this round's finding contradicts.
- [x] `docs/plans/plan-phase-a.md:5546–5612` (`T37-3`, full spec) — Read in
  full. Case (e) (`:5578–5599`) exercises exactly the two-actor
  (R1-vs-delayed-R2) scenario Scope 1 confirmed closed; no case in (a)–(e)
  introduces a third, ordinary acquirer into the restore window — confirmed
  by re-reading each case's own Data description; this is the untested gap
  Serious Finding 1 occupies.
- [x] `docs/plans/plan-phase-a.md:6711–6774` (§13, R11, full through the end
  of the entry before §14's Question register begins) — Read in full;
  internally consistent with Step 37 (Scope 1, above) and not directly
  contradicted by this round's own new finding (R11 addresses a
  *legitimately-running* reindex's lock being prematurely reclaimed; this
  round's finding is a *different* scenario, an ordinary acquirer racing
  into a reclaim's own restore window — both are real, neither entry claims
  to cover the other, and neither needs to for this round's finding to
  stand).
- [x] `docs/plans/plan-phase-a.md:6992–7278` (§14.4, Pass M through Pass R)
  — Read in full; see Scope 1 above.
- [x] `docs/architecture-phase-a.md:1650–1692` (AD-26, full section) — Read
  in full, side by side with its immediate neighbors (AD-25 at
  `:1630–1649`, the numbered reasoning chain beginning at `:1693`) per the
  task's explicit instruction. **AD-26's own new disclosure text
  (`:1658–1673`) is the third site this round's finding shows to be
  inaccurate** — see Serious Finding 1's "Where" and its own dedicated
  paragraph below. No other AD, Limitation, or Traceability-matrix row in
  the file makes a claim about the reindex lock's exclusivity or
  concurrency safety that this round's finding disturbs — confirmed by
  `grep -n "reindex\|reclaim" docs/architecture-phase-a.md` (11 hits: 7
  inside AD-26 itself, lines 1656–1688; the remaining 4 — line 662's
  `SessionStart` hook-mapping table, lines 1430/1492 on `oracleSpawn`
  confinement, and line 1834's packaging spawn-set enumeration — each
  mention "reindex" only as a spawned subprocess, with no claim about the
  lock file's identity or race-safety properties, so none is disturbed by
  this finding).
- [x] `docs/reviews/2026-09-07-round-11-plan-collapse-hunt.md` (652 lines)
  and `2026-09-07-round-11-plan-expert-review.md` (745 lines) — both Read
  in full, first, before touching either target file.
- [x] `docs/specs/spec-context-oracle.md` §11.5, §12, §13, §14 (lines
  739–913) — Read in full this session. This round's finding bears on the
  same axis every round since round 8 has traced to: §11.5's mandate that
  Phase A "measures its own floor honestly" and is "the build's test bed" —
  a silently double-corrupted or silently-lost index from this round's race
  would corrupt the exit-run data Phase B and the `AD-24` fixtures are
  designed from, exactly as round 10's and round 11's own findings argued
  for their own scenarios.
- [x] `docs/STATUS.md` (639 lines, current, post-round-11),
  `OWNER-LEDGER.md` (80 lines), `middleware/context-oracle/CLAUDE.md` (238
  lines, full), `middleware/context-oracle/.claude/commands/expert-review.md`
  (226 lines, read first, in full) — all Read in full this session.
- [x] `docs/collapse-log.md` — the full 2026-09-07 entry set (rounds 3
  through 11, read in full this session; earlier 2026-07/2026-08 entries
  sampled for pattern-history context, consistent with round-11's own
  disclosed scope precedent).
- [x] Step 37's full described lock sequence (acquire, release, staleness
  check, identity-verified reclaim, mismatch-restore) — independently
  transcribed as literal JavaScript (`lock.mjs`) and executed against a
  real filesystem six ways: same-instant collision (`test1`), delayed
  reclaimer single-process (`test2`) and two-real-process
  (`run_two_process.mjs`, ×2 runs), the new third-party restore-window race
  single-process (`test3_restore_window.mjs`) and three-real-process
  (`p1_proc.mjs`+`p2_proc.mjs`+`p3_proc.mjs` via `run_three_process.mjs`,
  ×2 runs), the cascading-release consequence
  (`test5_cascading_release.mjs`), the match-path's own analogous window as
  a control showing it is *not* vulnerable (`test4_match_path_window.mjs`),
  and a candidate fix (`test6_candidate_fix.mjs`, `fs.linkSync` in place of
  the unconditional restore rename).

**Rigor waivers:** none. **Instrument unavailability:** CodeGraph/Clear
Thought not invoked, unchanged from every prior round's disposition, no
finding depends on either.

---

## Summary

**This review returns NEEDS FIXES.** Round 11's two headline
execute-don't-assume claims were re-verified this round by independent,
from-scratch execution — including, this round, a genuine multi-process
reproduction beyond round 11's own single-process hand-interleaving for the
scenario it targeted, and a genuine three-real-process reproduction for the
new scenario this round found. Claim (a) — the content-token identity check
closes the delayed-reclaimer race — is **genuinely, robustly closed**: two
separate real `node` processes, run twice, correctly detect a mismatch and
restore the live lock without destroying it, matching round 11's own
verified result exactly. Claim (b) — that this fix introduces no other new
failure mode (asserted verbatim at `docs/plans/plan-phase-a.md:3061` and
`:4362`) — is **false**. The mismatch branch's own remediation action
(`fs.renameSync(reclaimPath, lockPath)`, `docs/plans/plan-phase-a.md:3056`)
is an *unconditional* rename: POSIX `rename(2)` silently replaces whatever
currently occupies the destination, with no conflict detection. Between the
moment a delayed reclaimer vacates `lockPath` (its own step (c),
`renameSync(lockPath, reclaimPath)`) and the moment it restores what it
believes is the live lock (step (d)'s mismatch branch), `lockPath` does not
exist in the filesystem's namespace. Nothing in the plan's text bounds or
synchronizes this gap, and — critically — it is not gated behind any
staleness reasoning at all: an entirely ordinary `tryAcquire()` call, the
single most common code path in the whole mechanism (every
`refreshIfStale` trigger starts here, unconditionally), can land in this
window, legitimately succeed (the path really is vacant), and then be
silently overwritten the instant the delayed reclaimer's restore-rename
fires — with no exception, no `EEXIST`, no diagnostic. Reproduced with
three genuinely separate real OS processes (`p1_proc.mjs`, `p2_proc.mjs`,
`p3_proc.mjs`, synchronized only by plain-file barriers at the exact gap
the algorithm's own text leaves open, orchestrated by
`run_three_process.mjs`), run twice with identical results both times: the
original winning reclaimer and the clobbered third acquirer both end the
sequence genuinely believing they hold the exclusive reindex lock,
unserialized — the identical consequence, and identical silence, that round
9's original defect, round 10's atomic-rename fix, and round 11's
content-token fix each in turn found and believed closed in this same
mechanism. This is the fourth consecutive round (9, 10, 11, 12) to find a
new race in this exact mechanism, each time in the *specific remediation
code* the immediately-prior round added. `docs/architecture-phase-a.md`'s
`AD-26` — corrected this same round-11 fix pass specifically to disclose
the narrowed residual — is itself inaccurate as a result: it states the
residual is bounded to "two reclaimers of the same stale lock" colliding
within "a handful of synchronous syscalls," when the same window this round
demonstrates is reachable by an unrelated ordinary acquirer with a
different, more severe failure mode (a silent unconditional overwrite,
rather than a detected mismatch that safely stands down). Classified
**Serious**, per this project's own established Critical-vs-Serious
threshold: a conditional, concurrency-dependent failure of a load-bearing
mechanism requiring a specific (if not exotic) compound precondition — a
crashed process's abandoned lock, a delayed second reclaimer, and an
ordinarily-timed third acquirer within a several-syscall window — not a
total, unconditional, every-invocation failure. A candidate fix
(`fs.linkSync`, which fails `EEXIST` rather than silently overwriting, in
place of the restore step's `fs.renameSync`) was directly executed and
verified to close this specific gap; it shifts the residual to a smaller,
disclosable one (the original reclaimer can silently lose its own restored
lock, discoverable only when its own `finally`-block release later hits an
unexpected occupant) that the plan's current release logic does not handle
either. A full-document regression scan of the round-11 fix-diff (10
hunks, 603 lines, matched byte-for-byte against `git diff 26c2ec1 90bae15`)
found no other new Critical, Serious, Systemic, or Moderate defect: `T37-3`
case (e), `§13` `R11`, and `§14.4`'s `Pass R` are each internally consistent
with round 11's own two genuinely-closed claims and with each other; no
stray `0.26.13` citation or step-number misattribution recurred at any site
this round's targeted sweep covered.

---

## Critical Findings

No Critical findings — the full inventory was Read, Grep-verified, or
directly executed per Compliance Gate B; the defect found at Serious
severity below is a conditional, compound-precondition, concurrency-dependent
failure of a load-bearing mechanism, not a total, unconditional,
every-invocation failure of the kind this project's own round-10 Critical
Finding 1 was (every `Language.load()` call failed, unconditionally, for
the pinned version) — the same distinction round 11's own expert-review
used to classify its own analogous finding as Serious rather than Critical.

---

## Serious Findings

### Serious Finding 1 (silent) — round 11's own remediation branch for the delayed-reclaimer race (the mismatch-restore step) opens a new, different race: an ordinary third acquirer can be silently and unconditionally overwritten in the restore window, reproducing the identical concurrent-ownership defect this mechanism exists to prevent

**Where.** `docs/plans/plan-phase-a.md:3048–3061` (Step 37 sub-step 2(d),
the mismatch branch, added round 11) and its two direct textual echoes —
`docs/plans/plan-phase-a.md:4362` (§10A entry N7's Answer field: "no new
failure mode is introduced") and `docs/plans/plan-phase-a.md:5578–5599`
(`T37-3` case (e), which exercises the two-actor delayed-reclaimer scenario
this finding does not dispute, but never constructs a third actor); and
`docs/architecture-phase-a.md:1658–1673` (AD-26's own new disclosure
paragraph, added the same round-11 fix pass, which states a narrower
exploit surface than this finding demonstrates).

**What the plan says (current text, quoted in full since the exact wording
is where the gap lives).** Step 37, sub-step 2(d), the mismatch branch:

> **Mismatch** — between (a)'s read and (c)'s rename, some other process
> replaced `lockPath` with a new, live lock (most plausibly the true owner
> of the *original* stale lock finishing its own reclaim and recreating
> it). The file this process just renamed away is that live lock, not the
> stale one: deleting it would silently evict a live reindex, reproducing
> the exact defect this mechanism exists to prevent. Instead, restore it —
> `fs.renameSync(lockPath + '.reclaiming-' + process.pid, lockPath)` — so
> its true owner's own `finally`-block release still finds it at the path
> it expects, close the descriptor, and skip this reindex attempt
> silently: this process lost the race, exactly as the plain `ENOENT`
> cases above already do — **no new failure mode.**

And N7's own Answer field, written specifically to interrogate this
mechanism: "…a mismatch restores the live lock to its original path and
skips silently, the same fallback shape the 'not stale' and plain `ENOENT`
cases already use, so **no new failure mode is introduced.**"

**What's wrong.** The restore step's own text names exactly one intended
beneficiary of the restore — "its true owner," i.e. the process whose live
lock was mistakenly renamed away (P1 in round 11's own scenario). But
`fs.renameSync(reclaimPath, lockPath)` has no way to address only that
beneficiary: like every other use of `rename(2)` in this same mechanism, it
operates on *whatever currently occupies the destination path*, silently
and unconditionally replacing it. Nothing in the algorithm re-checks, at
the instant of the restore, whether `lockPath` is still vacant (the state
it was in the instant after step (c)'s rename-away) or has since been
legitimately re-occupied by an entirely different process's own ordinary
`tryAcquire()` — a call that requires no staleness reasoning, no
`EEXIST`-then-reclaim logic, nothing beyond the plain `fs.open(lockPath,
O_CREAT|O_EXCL|O_WRONLY)` every single reindex attempt starts with. The
gap between step (c)'s rename-away and step (d)'s restore is exactly the
kind of "path momentarily vacant" window this document's own review
lineage has now found exploitable three times in three different places in
this one mechanism (round 9's plain unlink, round 10's atomic-rename
recreate, and now round 11's own restore) — each time because a namespace
entry disappearing, even briefly, is visible and actionable by any other
process watching that same path, and POSIX's `rename(2)` provides no
"restore-only-if-still-vacant" primitive to close it.

**How this was verified.** Independently transcribed Step 37's full
current algorithm (acquire, release, staleness check, identity-verified
reclaim including the mismatch/restore branch) as runnable JavaScript
(`lock.mjs`, not reusing any prior round's script) and executed it against
a real filesystem in a single-process construction and, for the highest
rigor this document's lineage has established, a genuine three-real-process
construction:

1. **Single-process construction** (`test3_restore_window.mjs`): P1
   completes an entire reclaim cycle and holds a fresh live lock; P2 (the
   delayed reclaimer, holding the *original* stale file's identity
   captured before P1 acted) renames `lockPath` away to its reclaim path;
   an ordinary `tryAcquire('P3')` is issued into the now-vacant `lockPath`
   and succeeds; P2 then completes its identity check (correctly detects
   the mismatch — P1's live token ≠ P2's captured stale token) and restores
   via `renameSync`, which silently clobbers P3's just-created file with
   P1's content:

   ```
   $ node test3_restore_window.mjs
   P1 attemptReclaim: reclaimed
   P1 now holds live lock, token: P1-5888586b-...
   P2 renamed lockPath away to reclaim path. lockPath exists now? false
   P3 tryAcquire (during P2's restore window) result: { ok: true, token: 'P3-92983d55-...' }
   P2 identity check match? false (expected false: P2 captured the crashed process's token...)
   P2 restored what it believes is the live lock to lockPath (clobbering whatever is there now).
   Final lockPath content: P1-5888586b-...
   Equals P1 token? true  | Equals P3 token? false
   *** RESULT: P3 successfully created its lock file via O_CREAT|O_EXCL (believes it holds the lock): true ***
   *** RESULT: Do P1 and P3 BOTH now believe they hold the exclusive lock, unserialized? *** true
   ```

2. **Three genuinely separate real OS processes**
   (`p1_proc.mjs`/`p2_proc.mjs`/`p3_proc.mjs`, orchestrated by
   `run_three_process.mjs` via plain-file barriers placed only at the exact
   gaps the algorithm's own text leaves unsynchronized — the same technique
   round 11's own collapse-hunt validated for its own headline finding —
   never inside any process's own decision logic), run twice for
   determinism:

   ```
   $ node run_three_process.mjs
   P1 finished (entire cycle complete, holds fresh live lock): { reclaimResult: 'reclaimed', token: 'P1-7cfd81c2-...' }
   P2 finished (step d, identity check + action): { isMatch: false, action: 'mismatch-restored', reclaimedContent: 'P1-7cfd81c2-...' }
   P3 finished (ordinary tryAcquire, racing into the vacated path): { ok: true, token: 'P3-431fdd7d-...' }

   Final lockPath content: P1-7cfd81c2-...
   Equals P1 token? true
   Equals P3 token? false

   === VERDICT ===
   P3 (an ordinary, unrelated tryAcquire) succeeded during P2's restore window: true
   P2's identity check correctly detected the mismatch (P1 != P2's captured token): true
   P2's restore silently clobbered P3's live lock file with P1's content, no exception, no diagnostic.
   Do P1 AND P3 now both genuinely believe they hold the exclusive lock, unserialized? true
   ```

   Re-run a second time with fresh tokens: identical outcome both times,
   zero exceptions raised in either process.

3. **Control test** (`test4_match_path_window.mjs`): the *analogous*
   window on the *match* branch (delete the reclaim-path temp file, then
   "retry acquisition once") is exposed to the identical shape of
   third-party race but is **not vulnerable**, because the retry uses
   `tryAcquire()` — `fs.open(..., O_CREAT|O_EXCL)`, which fails `EEXIST`
   if a third party has already re-occupied the path — a
   conflict-detecting primitive. This confirms the defect is specific to
   the mismatch branch's choice of `renameSync` (unconditional-replace)
   over an `O_EXCL`-style (conflict-detecting) primitive for its restore,
   not an inherent property of "a path being briefly vacant":

   ```
   $ node test4_match_path_window.mjs
   P4 tryAcquire during the vacated window: { ok: true, token: 'P4-...' }
   P1 retry-acquire result (expected ok:false, EEXIST): { ok: false, code: 'EEXIST' }
   *** RESULT: is this window benign ...? *** true
   ```

4. **Cascading consequence** (`test5_cascading_release.mjs`): once P3
   falsely believes it holds the lock, its own correctly-specified
   `finally`-block release (`fs.unlinkSync(lockPath)`, Step 37 sub-step 1)
   later deletes whatever is *actually* at `lockPath` by then — in this
   run, P1's genuinely-still-live lock, which P3 has no way to know it
   never really held. A fourth, entirely fresh trigger can then acquire
   cleanly while P1's reindex is still running:

   ```
   $ node test5_cascading_release.mjs
   lockPath exists after P3's own "correct" release? false
   *** P1's live lock ... was just silently deleted by P3's own correctly-specified release ...
   P4 (a fresh, unrelated trigger) tryAcquire result: { ok: true, ... }
   ```

   This is reasoned-and-executed against the plan's own literal release
   text, not a separate speculative extension: Step 37 sub-step 1 applies
   to every process "success or failure," with no special case for a
   process whose lock was silently swapped out from under it.

**Why AD-26's own new disclosure is inaccurate, not merely incomplete
(direct answer to the task's item 3).** `docs/architecture-phase-a.md:1658–1667`,
added this same round-11 fix pass specifically to disclose the
content-token fix's residual, states:

> content-token comparison … prevents two reclaimers of the same stale
> lock from both believing they hold it, down to the gap between one
> reclaimer's file-identity read and its own rename call — a handful of
> synchronous syscalls, not the full duration of a reindex a plain atomic
> rename alone left open.

This sentence is accurate for the scenario it names — round 11's own
finding, which this round's Scope 1 independently reconfirmed closed. It
is not accurate as a complete statement of the mechanism's residual
exposure, because the "handful of synchronous syscalls" window it bounds
is not exploitable *only* by "two reclaimers of the same stale lock" — the
Test 2/3 comparison above shows the identical window is also exploitable
by a process that is not a reclaimer at all and is not reasoning about
staleness in any way, with a *different and more severe* consequence (a
silent, undetected overwrite, versus a detected mismatch that safely
stands down). AD-26's neighboring sentence in point 4 — "Not a lock whose
exclusivity is absolute under every stale-lock reclaim interleaving — see
point 1's disclosed, content-token-narrowed residual" — inherits the same
narrower framing and needs the identical correction. This is a real
architecture-accuracy defect, not merely a missing detail: a reader relying
on AD-26 to scope this mechanism's blast radius would conclude the only
remaining risk is a rare collision between two reclaimers of an already-rare
abandoned lock, when the third-party overwrite this round demonstrates
requires nothing rarer than an ordinarily-timed second `refreshIfStale`
trigger.

**Why this matters (mission-fidelity, the same axis every round since
round 8 has traced to).** Two full `runIndex` passes writing to `store.db`
concurrently, unlocked at the application level, is exactly the scenario
this entire directory-lock mechanism exists to prevent, and exactly the
scenario `AD-26`'s WAL/`busy_timeout`/retry-once discipline was designed
for *ordinary, single-row, per-hook-event* contention, not for two
extended, many-write reindex passes silently believing themselves
exclusive. Per spec §11.5, Phase A's mission is to "measure its own floor
honestly" and to serve as "the build's test bed" for Phase B and the
`AD-24` regression fixtures; a silently double-run or silently-orphaned
reindex would produce an incomplete or internally inconsistent index — a
false floor indistinguishable, inside Step 42's exit-run report, from an
honest low one. This is the fourth consecutive round (9, 10, 11, now 12)
in which the specific remediation code the immediately-prior round added
to this exact mechanism introduced a new instance of the same defect class
it was written to close — a standing pattern this review's Recommended
Priority section returns to below.

**What the fix should be.**
1. **Minimal fix, verified this round: replace the unconditional restore
   rename with a conflict-detecting primitive.** `fs.linkSync(reclaimPath,
   lockPath)` — which fails `EEXIST` if `lockPath` is already occupied,
   exactly like the acquire path's own `O_EXCL` semantics — followed by
   `fs.unlinkSync(reclaimPath)` on success, was directly executed against
   the identical three-process scenario and verified to leave a
   third-party occupant (P3) completely undisturbed:

   ```
   $ node test6_candidate_fix.mjs
   CANDIDATE FIX: link restore got EEXIST -- lockPath is occupied by someone else now.
   Correct next action: do NOT touch lockPath (a real lock now lives there); ...
   Equals P3 token (P3's lock survives intact, undisturbed)? true
   Equals P1 token (P1's "restored" lock was silently dropped instead of clobbering P3)? false
   ```

   This closes the specific defect this finding demonstrates, but shifts
   the residual: P1 (the process whose live lock was mistakenly renamed
   away and could not be restored because a third party had already
   re-occupied the path) now silently loses its own lock with no
   notification — discoverable only when P1's own `finally`-block release
   later calls `fs.unlinkSync(lockPath)` against a file it does not own
   (currently unhandled: the plan's release text specifies no try/catch
   around this call). Adopting this fix requires also specifying that the
   release path tolerate `ENOENT` (already lost) and tolerate deleting an
   unrelated occupant's file being an accepted, disclosed residual rather
   than an unhandled exception — a smaller, bounded gap than the one this
   fix closes, but a real one, and the plan should say so explicitly
   rather than leave it implicit.
2. **Structural fix, worth considering given this is the fourth round to
   find a new race in this exact mechanism.** Every fix applied to this
   mechanism across rounds 9–12 has treated the reindex lock as a bare
   POSIX filesystem-namespace object and progressively layered
   cleverer-but-still-incomplete identity checks onto rename/unlink/link
   primitives that fundamentally lack an atomic "compare, and only then
   swap" operation. Step 37 already relies on `store.db`'s own
   transactional guarantees (`BEGIN IMMEDIATE`) to correctly serialize the
   `whisper_stats` fold against exactly this class of race, elsewhere in
   the same step. Representing "a reindex is in progress" as a row inside
   `store.db` (checked and set inside one `BEGIN IMMEDIATE` transaction,
   with a `WHERE` clause on the current state) would give this mechanism
   the real compare-and-swap semantics no combination of `rename`/`link`/
   `unlink` on a bare filesystem path can provide, without adding any new
   runtime dependency (`AD-25`'s two-dependency floor is unaffected —
   `store.db` already exists and is already the arbiter of exactly this
   property for the fold). This is a design-level recommendation, not
   independently executed this round since it is a different mechanism
   than the one under test, but it is the fix this round's own finding —
   the fourth instance of "the filesystem-lock family cannot express this
   invariant" — argues for on its own terms.
3. Either way, `T37-3` needs a new case (f): an ordinary, unrelated
   `tryAcquire()` landing in the mismatch branch's own vacate-then-restore
   window, asserting the third party's lock is either left undisturbed (if
   fix 1 or 2 is adopted) or, at minimum, that the current unconditional
   overwrite is at least detected and diagnosed rather than silent — not
   only the two-actor delayed-reclaimer case (e) already covers.
4. `docs/architecture-phase-a.md`'s AD-26 needs its point-1 and point-4
   disclosure text corrected to state the residual's actual scope (any
   ordinary acquirer, not only a second reclaimer) once the plan-level fix
   is chosen.

**Silent or self-revealing?** Silent — identical to every prior round's
classification of this same mechanism's defects. No exception, no
`EEXIST`, no diagnostic fires anywhere in the sequence; both processes
proceed exactly as if uncontended, and the eventual symptom (an incomplete
or doubly-written index) would not be traceable to this cause without
deducing it from first principles, exactly as round 11's own Serious
Finding 1 said of its own scenario.

---

## Systemic Patterns

**Proactive scan run before classifying**, following this document's own
established discipline (round 11's own Systemic-Patterns section ran the
identical style of scan for its own finding).

- **The "asserted complete, narrow test only" pattern, re-scanned for this
  round's finding.** Grepped `no new failure mode` across the full
  7735-line plan: **2 hits**, at `docs/plans/plan-phase-a.md:3061` (Step
  37's own mismatch-branch text) and `:4362` (N7's Answer field) — the
  identical two sites round 11's own equivalent scan found for its own
  finding (round 11 found 5 hits across a broader phrase set for its
  finding; this round's narrower, exact phrase match finds the 2 sites
  that specifically assert *this* finding's contradicted claim). **Result:
  not a Systemic finding** — one defect (Serious Finding 1) echoed at its
  own primary site and its own direct cross-reference (N7), plus one
  architecture-level disclosure (AD-26) that inherits the same
  incompleteness — not a pattern independently recurring at drifted sites
  across the document the way rounds 2–5's Systemic findings were.
- **Stray citation check for this round's own new terms.** Grepped
  `linkSync|EEXIST.*restore|restore.*EEXIST` across the full plan: 0 hits
  outside this review's own recommendation — confirms the candidate fix
  language this round proposes does not already exist half-implemented or
  contradicted anywhere in the current text.
- **"Fix landed at primary site, not swept everywhere" check (this
  document's most persistently recurring class, rounds 2–9).** Checked
  whether round 11's fix-diff (the six sites enumerated in Scope 2) left
  any cross-reference stale relative to *itself* (not relative to this
  round's new finding, which is a fresh defect, not a sweep failure). All
  six sites are internally consistent with each other and with round 11's
  own two review documents — **no sweep failure found this round**, the
  second round in a row (after round 11 itself) in which this specific
  recurring class was checked for and not found.

**Conclusion: no Systemic finding delivered this round.** Serious Finding 1
is confined to one mechanism (Step 37's reclaim/restore sequence) and its
three direct textual echoes (Step 37 body, N7, AD-26), not a pattern
recurring across independently-drifted sites — the same conclusion round
11 reached for its own analogous finding, for the same reason.

---

## Moderate & Minor Findings

No new Moderate or Minor findings beyond what is folded into Serious
Finding 1 above (the AD-26 disclosure-accuracy defect and the
release-path's unhandled-occupant-mismatch gap under the candidate fix are
both presented there because both are direct, mechanical consequences of
the same defect, not independently-drifted issues — the same editorial
choice round 11 made for its own AD-26 residual note). Verified by: the
fix-diff regression scan (Scope 2), the `Pass [A-Z]` count (18, no gaps),
a targeted grep for `0.26.13` across the full plan (25 hits, all 25 lines
read inline via the grep match context this session — each phrased as
historical/failed framing: "cannot load," "throws for every grammar
under," "still fails identically," "originally verified," and similar —
none presents `0.26.13` as a current or recommended pin; this is a fresh
grep this round, not a re-trust of round 11's own full sweep of the same
sites, though it reaches the same conclusion), and the `N1–N7`
coverage-attestation count (unchanged, 2 occurrences, both consistent).

---

## Tentative Findings

No tentative findings — every candidate finding's premise was verified by
direct execution this session, per Compliance Gate B. The recommended
structural fix (moving reindex mutual exclusion into a `store.db`
transaction) is a design recommendation, explicitly disclosed as reasoned
rather than executed in "What the fix should be," but the finding itself —
that the current text's restore step does not have the "no new failure
mode" property it claims — is fully verified by direct, repeated,
multi-process execution, not tentative.

---

## What's Actually Good

- **Round 11's content-token identity check is genuinely robust for the
  exact scenario it was built and tested against.** Independently
  transcribing Step 37's algorithm from scratch and executing it — first
  single-process, then with two genuinely separate real OS processes, run
  twice — reproduced round 11's own result exactly: the delayed reclaimer
  correctly detects the identity mismatch and restores the live lock
  without destroying it, with zero false matches across every run.
  **Verified by:** direct execution, this session, single-process and
  multi-process (Scope 1). **Standard:** the execute-don't-assume
  discipline this project's own review lineage established at round 6 and
  has applied to every fix since — credited here because the fix
  genuinely generalizes beyond round 11's own narrower single-process
  reproduction to a fresh multi-process one.
- **§13 R11's reconciliation with Step 37's "silent index corruption"
  framing is accurate and internally consistent.** Reading both entries
  side by side confirms they now state the same conclusion about the same
  mechanism, with R11 correctly citing Step 37 rather than contradicting
  it, and correctly disclosing its own double-counting argument as
  reasoned rather than executed. **Verified by:** direct Read of both
  entries, this session (Scope 2). **Standard:** internal consistency
  across cross-referencing sections of the same document — the specific
  property this document's review lineage has repeatedly found violated
  (rounds 2–9) and, here, genuinely restored.
- **§14.4's Pass R entry accurately and completely reflects round 11's own
  two review documents.** A full grep for the section's own `Pass [A-Z]`
  convention found 18 consistent entries with no gap, and Pass R's content
  was checked sentence-for-sentence against the source review documents it
  summarizes. **Verified by:** grep (full-document, 18 hits) plus Read
  cross-check against both round-11 review documents, this session.
  **Standard:** the self-audit discipline this section's own convention
  requires — met here for the first time this round's inventory checked
  it directly against source documents rather than against `docs/STATUS.md`.

---

## Recommended Priority

1. **Serious Finding 1 (the mismatch-restore step's own unconditional
   rename opens a new race against an ordinary third acquirer).** Fix
   before Step 37 is built. Adopt either the minimal `fs.linkSync`-based
   fix (verified this round to close the specific gap, with its own
   smaller residual disclosed and the release path's `ENOENT` tolerance
   made explicit) or the structural fix (move reindex mutual exclusion
   into a `store.db` transaction, reusing the `BEGIN IMMEDIATE` discipline
   Step 37 already trusts for the `whisper_stats` fold) — the structural
   fix is worth serious consideration given this is the fourth consecutive
   round to find a new race in a fix applied to this exact mechanism, each
   time because a filesystem-namespace-only primitive was asked to provide
   an atomicity guarantee POSIX does not offer.
2. **Add `T37-3` case (f)**: an ordinary `tryAcquire()` landing in the
   mismatch branch's own restore window, asserting the chosen fix's actual
   guarantee (undisturbed third party, or at minimum a detected and
   diagnosed conflict rather than a silent overwrite).
3. **Correct `docs/architecture-phase-a.md`'s AD-26** (points 1 and 4) to
   state the residual's actual scope — any ordinary acquirer, not only a
   second reclaimer of the same stale lock — once the plan-level fix is
   chosen, and to reflect whichever primitive (filesystem-linkSync or
   store-transaction) is adopted.
4. **Log this in `docs/collapse-log.md`** as a further generalization of
   round 11's own already-logged lesson: a fix's *own remediation branch*
   (the code path that runs specifically to undo a detected problem) is
   itself a new critical section requiring the same adversarial
   construction discipline as the mechanism it was built to protect —
   "restore what I broke" is not automatically safe merely because it
   reads as a rollback. The standing prescription this round adds: when a
   concurrency fix's remediation path re-touches a shared namespace entry
   (a file path, a table row, a lock), construct the interleaving where an
   entirely unrelated, ordinary operation — not another instance of the
   bug being fixed — lands inside the remediation's own window, before
   trusting that the remediation "introduces no new failure mode."

---

## Verdict

Verdict: NEEDS FIXES (1 finding: 1 Serious)
