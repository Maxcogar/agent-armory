# Expert review (round 11, re-review) — `docs/plans/plan-phase-a.md` and `docs/architecture-phase-a.md`

**Date:** 2026-09-07
**Reviewer:** fresh independent `/expert-review` pass; not the author of either
document, any prior fix pass, or any of the twenty prior review documents on
this artifact; no prior context on this session.
**Artifacts:** `middleware/context-oracle/docs/plans/plan-phase-a.md` (7450
lines) and `middleware/context-oracle/docs/architecture-phase-a.md` (2058
lines), both at commit `26c2ec16a26757834e978324ec877553a66a3178` on branch
`claude/plan-correction-strategy-57ot28` (`git log -1 --format="%H %ci"`:
`26c2ec1… 2026-09-07 09:57:00 +0000`; `git status` clean tree, confirmed this
session before any citation below).
**Round:** 11 (re-review of round 10's collapse-hunt commit `1fbfe3c` and
round 10's expert-review commit `26c2ec1`, both landed against round 9's
output `ed9f917`). Rounds 1–10 history (from `docs/STATUS.md` and the twenty
prior review documents in `docs/reviews/`): round 1, 3 collapses/4
partials/6 missed decisions + 10 expert-review findings; round 2, 1
collapse/3 partials/1 procedural gap + 9 expert-review findings incl. an
overclaim (S3); round 3, 2 collapses/2 partials + 1 Systemic×2 + 2 Moderate +
1 Minor; round 4, 2 collapses/0 partials + 1 Systemic×2; round 5, 2 collapses
(one incomplete) + 1 Systemic×2 at 6 sites + 1 Minor; round 6, 1 collapse + 2
Moderate/2 Minor; round 7, 1 Critical + 1 Moderate (expert-review) + 1
collapse + 3 Minor (collapse-hunt); round 8, 1 Serious + 1 Moderate
(expert-review) + 2 collapses (collapse-hunt); round 9, 2 Serious
(expert-review) + 1 collapse + 2 findings (collapse-hunt); round 10, 1
Critical + 1 Moderate (expert-review) + 1 Serious collapse + 2 findings
(collapse-hunt). **This round independently re-executes round 10's two
headline fix mechanisms from scratch — the `web-tree-sitter@0.25.10` +
`tree-sitter-wasms@0.1.13` functional pairing, and Step 37's atomic-rename
lock-reclaim fix — rather than trusting the corrected prose. The dependency
fix is genuinely closed (re-verified across 8 sampled languages, more than
round 10's 6, plus re-confirmed `0.26.13` still fails identically). The
lock-reclaim fix is NOT closed: direct, literal execution of Step 37's own
described algorithm shows the "atomic rename" only protects the instant of
the rename call itself — once one reclaimer completes its full
rename→unlink→recreate cycle (which, on a local filesystem, takes
microseconds), a second reclaimer's rename call, arriving at any point during
that reclaimer's entire subsequent reindex run (seconds to minutes), silently
renames away the first reclaimer's live, freshly-created lock and both
processes end up believing they hold exclusive ownership — the identical
shape, and identical consequence (two concurrent unlocked writers to
`store.db`), that round 10 itself found and rated Serious in round 9's
original unlink-based mechanism. Round 10's own new test case, `T37-3`(d), as
literally specified ("their `renameSync` calls issued back-to-back with no
serialization between them"), tests only the microsecond-scale sub-window the
fix actually closes and would pass under the still-broken algorithm, giving
false confidence. A full-document regression scan of both files otherwise
found no new Critical/Serious/Systemic/Moderate defect: architecture
`docs/architecture-phase-a.md` was read in full for the first time this
review lineage as a primary target (not a citation source) and is internally
consistent post-V14-correction; every remaining `0.26.13` citation in the
plan is correctly framed as historical/failed, never as the current pin; the
N3/N4 vs. N7 tuning-value scoping split is internally consistent, not a
regression.**

---

## Scope and Inventory

### Tool-plan disclosure

`ToolSearch` for CodeGraph/Clear Thought was not invoked this round —
consistent with every prior round's disposition (§15 Q-gap-1/Q-gap-2 in the
plan itself); no finding below depends on either tool. Every claim below is
verified by Read (file:line, this session), Grep (query + result count, this
session), or direct executable checks (git 2.43 available in this
environment via the sandboxed proxy — not invoked this round, no new git
scenario was needed; Node.js v22.22.2, npm 10.9.7, all run fresh this session
in `/tmp/claude-0/…/scratchpad/oracle_r11/`, none reused from any prior
round's transcript) — never memory, never trust in a prior review's or the
plan's own attestation.

### Scope 1 — Round 10's finding-groups, as closure items (re-executed independently, not re-read)

- [x] **Round-10 expert-review Critical Finding 1 (`web-tree-sitter@0.26.13`
  cannot load any `tree-sitter-wasms@0.1.13` grammar; re-floor to
  `web-tree-sitter@0.25.10`).** Read current `docs/plans/plan-phase-a.md:646–657`
  (Step 1 deps), `docs/plans/plan-phase-a.md:2034–2085` (Step 22 error
  handling + `T22-3`), `docs/architecture-phase-a.md:138` (V14 row, corrected).
  **Independently re-executed from scratch, not reused from round 10's
  transcript:** fresh `npm install web-tree-sitter@0.25.10
  tree-sitter-wasms@0.1.13` in a new scratch directory
  (`/tmp/claude-0/…/scratchpad/oracle_r11/working/`); ran `Parser.init()` +
  `Language.load()` + `parser.parse()` against **eight** sampled grammars
  (`javascript`, `typescript`, `python`, `go`, `java`, `c_sharp`, `rust`,
  `ruby` — two more than round 10's six) with a real, language-appropriate
  source snippet parsed for each: all eight succeed, each producing a
  sensible root node (`program`/`module`/`source_file`/`compilation_unit`
  per language) with a non-trivial child count. **Separately re-confirmed
  `web-tree-sitter@0.26.13` still fails identically** (a fresh install in a
  second scratch directory, `working026/`, against the same
  `tree-sitter-wasms@0.1.13`): all four re-sampled grammars
  (`javascript`/`typescript`/`python`/`go`) throw the identical
  `getDylinkMetadata`/`failIf` stack trace round 10 recorded — ruling out a
  transient npm-registry state change as the task brief explicitly asked.
  **Genuinely closed** — more robustly than round 10's own scenario required,
  and the "not a registry fluke" check the task named was independently
  re-run and reproduced.
- [x] **Round-10 expert-review Moderate Finding 1
  (`reindex.lock_stale_ms`'s 600000ms default reworded from a confident,
  unmeasured magnitude claim to an honest calibration-pending framing, plus
  §13 R11).** Read current `docs/plans/plan-phase-a.md:2151–2167` (Step 23)
  and `docs/plans/plan-phase-a.md:6588–6606` (§13 R11): the "well beyond any
  real index run's duration" claim is gone, replaced with "a starting guess,
  not measured against any real index run's actual duration," and R11 states
  the failure mode (redundant concurrent reindex, not corruption — a claim
  this round's own new finding below partially revises, see Serious Finding
  1) and the mitigation (measure at Step 42's exit run). **Genuinely closed
  as a wording-honesty matter** — the specific value is still unverified
  (unavoidably, per round 10's own disclosed reason: Phase A's indexer does
  not exist yet), which round 10 itself disclosed rather than hid, and this
  round found no new textual overclaim at either site.
- [x] **Round-10 collapse-hunt Serious collapse (Step 37's round-9
  stale-lock reclaim is an unsynchronized check-then-act race; fixed via
  atomic `fs.renameSync`).** Read current
  `docs/plans/plan-phase-a.md:2962–3020` (Step 37 body), `:4254–4300` (new
  §10A entry N7), and `:5450–5488` (`T37-3`'s corrected spec). **Independently
  transcribed Step 37's own literal algorithm as runnable JavaScript** (not
  reusing round 10's script — round 10's collapse-hunt document contains no
  runnable script, only described commands and results) and executed it
  against a real filesystem in a fresh scratch directory. **This finding is
  NOT genuinely closed — see Serious Finding 1 below**, which reproduces,
  by direct hand-interleaved execution of the plan's own current text, a
  distinct concurrent-reclaim corruption exactly like the one round 10 found
  and believed it had fixed.
- [x] **Round-10 collapse-hunt Minor residual (Step 20's brace-form regex
  mis-parses a filename literally containing `{`/`}`; disclosed, not
  fixed).** Read current `docs/plans/plan-phase-a.md:1901–1917`: the
  disclosure is present, worded honestly ("This is outside `T20-1`'s fixture
  and is not fixed in Phase A"), in the same register as N1's sibling
  disclosure. **Genuinely closed as a disclosure matter** (no re-execution
  needed — round 10's own finding was that this is an accepted, disclosed
  residual, not a claimed fix; the disclosure text is present and accurate).

**Scope 1 result: three of round 10's four finding-groups are genuinely
closed. The fourth — the atomic-rename lock-reclaim fix — is not closed:
independent re-execution of its own literal, current text reproduces a
concurrent-reclaim corruption of the same shape and consequence as the
defect it was written to fix. See Serious Finding 1.**

### Scope 2 — Fix-diff regression scan + full-document scrutiny

**Fix-diff** (`git diff ed9f917 26c2ec1 -- middleware/context-oracle/docs/plans/plan-phase-a.md middleware/context-oracle/docs/architecture-phase-a.md`,
734 lines combined, read in full this session before drawing any
conclusion): confirms the diff touches exactly the sites round 10's own two
review documents already enumerate — Step 1's dependency pin, Step 22's
grammar-load error handling + `T22-3`, Step 23/Step 37's `reindex.lock_stale_ms`
wording and lock-reclaim rewrite + `T37-3`(d), the new §10A entry N7, §13 R11,
D-plan-2's decision text and collapse-test, §11.4's two new claims-registry
entries, §14.1/§14.2's Q1/bin-2 wording, and architecture V14's row plus its
Standards-registry citation. No other plan or architecture content changed
between round 9's and round 10's commits.

- [x] `docs/plans/plan-phase-a.md` front matter + §1–§9 (lines 1–3450) —
  Read via targeted `Read`/`Grep` passes covering every site the fix-diff
  touches (Step 1 lines 636–685; §3 Standards registry lines 200–260; file
  skeleton line 421; Step 20 lines 1868–1926; Step 22 lines 2005–2090; Step
  23 lines 2092–2205; Step 37 lines 2947–3050) plus a full grep sweep for
  every remaining `0.26.13`/`0.27.0`/`six number`/`seven number`/`reclaiming-`/
  `renameSync`/`Step 30`/`Step 31`/`Step 32`/`Step 37` occurrence across the
  full 7450 lines (result counts and every hit enumerated below and in
  Systemic Patterns) to confirm nothing outside the fix-diff silently regressed.
  Content outside the fix-diff is byte-identical to round 10's own full
  sequential read of the same lines at `ed9f917` (`git diff` confirms zero
  bytes changed there) — round 10's expert-review document explicitly
  attests a gapless sequential read of the full 7196-line document at that
  commit (`1–900, 901–1800, …, 7001–7196`); this round relies on the
  mechanical diff (not on trusting round 10's narrative) to establish that
  unchanged content is unchanged, and independently re-executes or re-derives
  every claim this round's own findings depend on rather than importing
  round 10's conclusions about that content. No new defect found in this
  scope.
- [x] §10 Decisions D-plan-1..8 (lines 3556–3760) — Read in full, including
  D-plan-2's corrected text (lines 3556–3580). Internally consistent: the
  version named (`^0.25.10`), the reasoning, and the parenthetical
  retraction note all agree with §11.4 and V14. No defect.
- [x] §10A collapse-tests D-plan-2 (lines 3762–3822) and the new N7 (lines
  4254–4300) — Read in full. D-plan-2's re-sharpened hardest question
  ("does `Language.load()` actually load and parse... not 'is the caret
  range written correctly'") is honored by this round's own re-execution.
  **N7's own "Answer" field is where this round's Serious Finding 1
  originates** — see below; every other field of every other §10A entry
  re-read for this round's scope (N1–N6, D-plan-1/3–8, the three plan-level
  entries) shows no textual regression since round 10 (unchanged, confirmed
  by the diff).
- [x] Coverage attestation paragraph, "N1–N7" (lines 4300–4320) — Read in
  full; the "N1–N7" renumbering is applied consistently at both of its two
  occurrences (line 4300, line 4318). No defect.
- [x] §11.4 external-claims registry, both new entries (lines 4455–4470,
  4547–4583) — Read in full. Both entries' evidence matches this round's own
  independent re-execution (Scope 1 above) exactly: the `dylink`-vs-`dylink.0`
  mechanism, the six-then-eight-language reproduction, the `0.25.9`-then-`0.25.10`
  isolation. (Round 10's entry cites `web-tree-sitter@0.25.9`; the plan's
  Step 1 and D-plan-2 pin `^0.25.10`. Both versions were independently
  installed and executed this round — see Systemic Patterns for why this is
  not a defect.) No new defect in this scope's citation text.
- [x] §12.1 Unit-tier test specs `T20-1`, `T22-1`–`T22-3`, `T23-1`, `T37-1`–`T37-3`
  (lines 5295–5490) — Read in full. `T22-3`'s spec is internally consistent
  with Step 22's own try/catch text (same diagnostic code, same fallback
  target, same "never aborts `runIndex`" claim) — independently confirmed
  buildable: Node's built-in `node:test` `mock` module can intercept a
  named export's method (`mock.method(Language, 'load', …)`) without a
  bespoke injection seam, so no missing-seam finding is raised here.
  **`T37-3`(d)'s spec is where this round's Serious Finding 1 is grounded** —
  its own literal wording ("issued back-to-back with no serialization
  between them") is the sub-case this round's execution shows the fix
  actually closes, and is not the sub-case that remains open.
- [x] §12.5 Coverage attestation tables, both mapping tables (lines
  6440–6480) — Read in full; `T22-3` and `T37-3` both correctly appear in the
  Step→T-ID table (line 6454, 6469) and `T22-3` correctly does not appear in
  the AC→T-ID table (no corresponding Phase A acceptance criterion, same
  pattern as `T2.5-1`/`T21-2`/`T18-3`/`T41-1d`/`T37-3` itself — confirmed by
  grep, none of these five appear in the AC-mapping table). No defect.
- [x] §13 Risks, R11 (lines 6588–6606) — Read in full. R11's own text
  ("not data corruption ... the manual `ctxoracle index` verb bypasses this
  lock entirely and is unaffected") is now **partially superseded** by this
  round's Serious Finding 1: the redundant-work-only characterization was
  correct for the *scenario R11 and round 10's Moderate Finding 1 addressed*
  (a legitimately-long-running reindex whose lock is prematurely reclaimed by
  a slow threshold), but this round's finding is a different scenario (two
  *reclaimers* of an *already-abandoned* lock racing each other) whose
  consequence is the one AD-26's own concurrency model was not built to
  absorb at scale (two full re-index passes, not one hook event's single-row
  write, contending for the SQLite writer role over an extended window) —
  see Serious Finding 1's own impact analysis. R11's text is not wrong for
  what it addresses; it does not address this round's scenario, and should
  be read alongside the new finding, not in its place.
- [x] §14.1 Q1 (lines 6725–6740), §14.2 web-tree-sitter bin-2 entry (lines
  6820–6850) — Read in full. Both correctly restate the corrected `0.25.10`
  floor and the re-verification requirement for any future bump. No defect.
- [x] `docs/architecture-phase-a.md` — **read in full, end to end, this
  session** (2058 lines, across two sequential `Read` calls with no gaps:
  1–1649, 1650–2058, following an initial focused read of 1–550), per the
  task's explicit instruction that this file has never been reviewed as a
  primary target rather than a citation source. Findings from this full read:
  - V14's row (line 138) and its "How verified" cell are internally
    consistent with this round's own re-execution (Scope 1) and with every
    plan-side citation of it (cross-checked by grep, see Systemic Patterns).
  - The V1–V19 table's neighboring rows (V13, V15) were re-read for any
    stale cross-reference to V14's old value: none found.
  - AD-12 (§ "Structural indexer", lines 997–1041), the architecture
    decision Critical Finding 1 (round 10) and Serious Finding 1 (this
    round) both ultimately trace to, was re-read in full: its own text
    never names a specific version (it cites V14 by reference only), so the
    correction did not require any AD-12 textual change, and none was made
    — confirmed by the diff (AD-12's own paragraph text is byte-identical
    across `ed9f917`→`26c2ec1`).
  - AD-25 (packaging, lines 1630–1649) still states "runtime deps exactly
    `web-tree-sitter` + `tree-sitter-wasms` ... V14 confirms both deps
    comply" — accurate: the corrected fix kept the two-dependency floor
    (option (a)/(c) from round 10's own disposition menu, not the
    per-language-packages alternative (b)), so AD-25's "exactly two"
    invariant is honored, not disturbed, by the fix. Confirmed this was the
    path actually taken by re-reading Step 1's `package.json` block
    (`docs/plans/plan-phase-a.md:648–657`): still exactly
    `{"web-tree-sitter": "^0.25.10", "tree-sitter-wasms": "0.1.13"}`, two
    entries.
  - AD-26 (concurrency, lines 1650–1674) — re-read in full. Its stated
    invariant ("The detached reindex takes a directory lock; the handler
    never waits on it") is not textually falsified by this round's finding
    (the *handler* still never waits on the lock; the finding is that the
    *lock itself* does not always exclude a second reindexer), but the
    document does not currently disclose that residual anywhere in AD-26's
    own text — consistent with, not a duplicate of, Serious Finding 1's own
    "why this survived" analysis.
  - The Standards-registry table (line 2036) and every other Verified-premises
    citation of the tree-sitter packages were re-read; no stray reference to
    the old `0.26.13`/`tree-sitter-wasms` verification method survives
    anywhere in the file.
  - No other AD, Limitation (L1–L11), or Traceability-matrix row references
    tree-sitter, `reindex.lock_stale_ms`, or the reindex lock in a way this
    round's findings disturb. Full read confirms no other passage anywhere
    in the 2058-line document needed correction as a consequence of round
    10's V14 fix, and this round's own new finding (the lock race) requires
    no architecture-level correction beyond the AD-26 disclosure gap named
    above (the lock's *existence and purpose* are still correctly described;
    only its *robustness under concurrent reclaim* is now known to be
    narrower than AD-26's prose implies).
- [x] `docs/reviews/2026-09-07-round-10-plan-collapse-hunt.md` (713 lines)
  and `2026-09-07-round-10-plan-expert-review.md` (821 lines) — both Read in
  full, first, before touching either target file.
- [x] `docs/specs/spec-context-oracle.md` §14 (lines 908–1131) — re-read in
  full this session. No AC↔T-ID mapping regression from this round's
  findings; the acceptance criterion most exposed by Serious Finding 1 is
  AC-13 ("store hygiene... a stale fact lowers confidence without
  blocking") and, indirectly, the honest-measurement mandate underlying
  §11.5 (a corrupted index is a false floor, not a measured one) — the same
  mission-fidelity axis round 10's own Collapse 1 traced to.
- [x] `docs/STATUS.md` (current, post-round-10, 572 lines), `OWNER-LEDGER.md`
  (81 lines), `middleware/context-oracle/CLAUDE.md` (full),
  `middleware/context-oracle/.claude/commands/expert-review.md` (226 lines,
  read first, in full) — all Read in full this session.
- [x] `docs/collapse-log.md` — the full 2026-09-07 entry set (rounds 3
  through 10, read in full this session; earlier 2026-07/2026-08 entries
  read for pattern-history context).
- [x] `web-tree-sitter@0.25.10` `Parser.init()`/`Language.load()`/`parser.parse()`
  against eight sampled `tree-sitter-wasms@0.1.13` grammars — executed
  fresh this session (`/tmp/claude-0/…/scratchpad/oracle_r11/working/test_multi.mjs`).
- [x] `web-tree-sitter@0.26.13` `Language.load()` against four re-sampled
  grammars — executed fresh this session
  (`/tmp/claude-0/…/scratchpad/oracle_r11/working026/test_fail.mjs`) to rule
  out a transient npm-registry effect, per the task's explicit instruction.
- [x] Step 37's full described lock sequence (acquire, release, staleness
  mtime check, atomic-rename reclaim) — independently transcribed as literal
  JavaScript and executed against a real filesystem, twice: once reproducing
  round 10's own narrow scenario (renames issued back-to-back against the
  same still-present file — **passes**, matching `T37-3`(d)'s literal
  wording) and once reproducing the wider, realistic scenario (one
  reclaimer's full rename→unlink→recreate cycle completing before the
  second reclaimer's rename call — **fails**, both processes believe they
  hold the lock) — `/tmp/claude-0/…/scratchpad/oracle_r11/lock_race_narrow.mjs`
  and `lock_race.mjs`.

**Rigor waivers:** none. **Instrument unavailability:** CodeGraph/Clear
Thought not invoked, unchanged from every prior round's disposition, no
finding depends on either. A real two-OS-process reproduction of the lock
race (two actual Node processes racing via forked child processes rather
than hand-interleaved function calls in one process) was not additionally
attempted — the hand-interleaved version demonstrates the algorithm's logic
itself (not an OS-scheduling accident) permits the bad outcome, which is
the same disclosed-equivalence reasoning round 10's own collapse-hunt used
for its original Collapse 1 reproduction, and is sufficient to establish
that the specified algorithm, as text, does not have the property it claims.

---

## Summary

**This review returns NEEDS FIXES.** Round 10's two headline
execute-don't-assume fixes were re-verified this round by independent,
from-scratch execution rather than by re-reading the corrected prose, per
the task's explicit instruction and per this document's own standing lesson
("a fix-pass annotation claiming closure is itself an unverified claim until
the exact scenario the original finding named is re-executed against the
fix's literal text," collapse-log round 9). The dependency-floor fix
(`web-tree-sitter@0.25.10` + `tree-sitter-wasms@0.1.13`) is genuinely and
robustly closed: this round independently loaded and parsed eight sampled
grammars (two more than round 10 tested), and separately re-confirmed
`web-tree-sitter@0.26.13` still fails identically, ruling out a transient
npm-registry state as the cause. The lock-reclaim fix is **not** closed.
Round 10's collapse-hunt correctly found that round 9's plain
`unlinkSync`-then-recreate reclaim was an unsynchronized check-then-act race
and prescribed an atomic `fs.renameSync` in its place; direct, literal
execution of the plan's own current text for that prescribed fix
(`docs/plans/plan-phase-a.md:2992–3017`) shows the atomic rename closes only
the sub-window in which two reclaimers' rename calls land against the
*same, still-present* original stale-lock file (exactly what the plan's own
new `T37-3`(d) fixture tests, "issued back-to-back with no serialization
between them," and exactly what this round's own narrow re-execution
confirms passes). It does not close — and the plan's own prose does not
disclose — the much wider window in which the *first* reclaimer completes
its entire rename→unlink→recreate cycle (a handful of synchronous syscalls,
microseconds on a local filesystem) before the *second* reclaimer's rename
call ever executes: at that point the second reclaimer's `renameSync` call
targets whatever now exists at the lock path — the first reclaimer's fresh,
live lock — and renames it away exactly as blindly as the original,
already-fixed `unlinkSync` bug did. Both processes then believe they hold
exclusive ownership, for the full remaining duration of the first
reclaimer's reindex run (seconds to minutes, not microseconds) — the
identical consequence (two unlocked, concurrent, extended-duration writers
to `store.db`) and identical silence (no exception, no diagnostic anywhere
in the sequence) that round 10's own collapse-hunt named as its most
consequential concern for this mechanism. This is classified **Serious**,
matching this project's own precedent classification of the identical
defect shape (round 10's original Collapse 1, before its attempted fix).
Round 10's own new §10A entry (N7) and its own new `T37-3`(d) fixture both
assert the fix is complete and race-free in language this round's execution
disproves — the collapse-test and the test spec meant to interrogate this
exact mechanism both graded the fix's homework and both missed the wider
window, because both were written and verified against the narrower
scenario round 10 happened to construct rather than a scan of every
interleaving the algorithm's own text permits. A full-document regression
scan otherwise found no new Critical, Serious, Systemic, or Moderate defect
in either file: `docs/architecture-phase-a.md` was read end to end for the
first time this review lineage as a primary target and is internally
consistent post-correction; the plan's remaining `0.26.13` references are
all correctly framed as historical; the N3/N4-vs-N7 tuning-value scoping is
internally consistent, not a regression; round 10's Moderate finding
(`reindex.lock_stale_ms`'s unmeasured magnitude) is genuinely closed as a
wording matter.

---

## Critical Findings

No Critical findings — the full inventory was Read, Grep-verified, or
directly executed per Compliance Gate B; the one defect found at Serious
severity (below) is a conditional, concurrency-dependent failure of a
load-bearing mechanism, not a total, unconditional, every-invocation failure
of the kind round 10's own Critical Finding 1 was (every `Language.load()`
call failed, unconditionally, for the pinned version) — the distinction this
project's own prior rounds have used to separate the two classifications.

---

## Serious Findings

### Serious Finding 1 (silent) — Step 37's round-10 "atomic rename" lock-reclaim fix closes only the narrow rename-vs-rename race it was tested against; the wider, dominant reclaim-vs-recreate race it does not close reproduces the identical concurrent-ownership defect the fix exists to prevent

**Where.** `docs/plans/plan-phase-a.md:2985–3017` (Step 37's numbered
staleness-reclaim sub-steps, added round 9, "made race-safe" round 10); the
same unclosed gap is present in the new §10A entry N7
(`docs/plans/plan-phase-a.md:4254–4300`, specifically its "Answer" field at
`:4267–4279`) and in `T37-3`'s corrected spec
(`docs/plans/plan-phase-a.md:5450–5488`, specifically case (d) at
`:5471–5480`) — all three sites assert or test the fix's completeness in
language this finding's execution contradicts.

**What the plan says (current text).** Step 37, sub-step 2:

> …call `fs.renameSync(lockPath, lockPath + '.reclaiming-' + process.pid)` —
> `rename` on the same filesystem is atomic, so only one concurrent
> reclaimer's rename can succeed against the stale lock's path. If the
> rename succeeds, this process owns the reclaim: delete the renamed file
> and retry acquisition once. If the rename throws `ENOENT` (another process
> already renamed or removed it a moment earlier), this process lost the
> race: skip this reindex attempt silently, exactly as the "not stale" case
> already does — no new failure mode.

And N7's own "Answer" field, written specifically to interrogate this
mechanism: "Fixed by making the reclaim atomic… a losing reclaimer's rename
throws `ENOENT` and it skips silently… with no new failure mode."

**What's wrong.** "Only one concurrent reclaimer's rename can succeed
against the stale lock's path" is true only for two rename calls racing
against the *same, unmodified* source file at the *same instant*. It is not
true across the full reclaim sequence, because the winning reclaimer's own
subsequent actions — `delete the renamed file and retry acquisition once`,
i.e. `fs.unlinkSync` on the temp path followed by a fresh
`fs.open(lockPath, O_CREAT|O_EXCL)` — **recreate a new, live file at the
exact same `lockPath`** the second reclaimer is about to target. `rename()`'s
atomicity guarantees only that it operates correctly on *whatever currently
exists* at the source path; it has no way to verify that the file being
renamed is *the specific stale file the caller inspected earlier* rather
than a completely different, live file some other process created a moment
before. The plan's own text supplies no such verification (no inode check,
no content token, no re-stat immediately before the rename) — the staleness
check (`read the existing lock file's mtime… if older than
reindex.lock_stale_ms`) and the rename call are two separate, unsynchronized
steps with nothing tying the rename's target identity back to what the
staleness check actually observed. This is the exact same class of defect —
an unsynchronized check-then-act — that round 10's collapse-hunt found in
round 9's plain `unlinkSync`, merely shifted one syscall later.

**How this was verified.** Independently transcribed Step 37's literal,
current algorithm as runnable JavaScript (not reusing round 10's own
described-but-not-scripted reproduction) and executed it against a real
filesystem in two configurations, both fresh this session:

1. **The narrow case `T37-3`(d) actually specifies** ("issued back-to-back
   with no serialization between them"): call P1's `renameSync` against the
   original stale-lock path, then immediately call P2's `renameSync` against
   the same, still-untouched path, before P1 does anything else.

   ```
   $ node lock_race_narrow.mjs
   P1 renameSync -> renamed
   P2 renameSync (immediately after, same original path) -> ENOENT
   ```

   This passes exactly as the plan and `T37-3`(d) claim: P2 correctly
   detects it lost the race.

2. **The wider case neither the plan's prose, N7, nor `T37-3` construct**:
   let P1 complete its *entire* reclaim cycle — `renameSync` (rename the
   stale lock away), `unlinkSync` (delete the renamed temp file), then
   `tryAcquire` (`fs.open(lockPath, O_CREAT|O_EXCL)`, which succeeds because
   the path is now empty) — **before** P2 ever calls its own `renameSync`:

   ```
   $ node lock_race.mjs
   === Race scenario: P1 and P2 both encounter the same stale lock ===
   P1.tryAcquire -> EEXIST
   P2.tryAcquire -> EEXIST
   P1.checkStale -> true
   P2.checkStale -> true
   P1.attemptReclaim -> won: true
   P2.attemptReclaim -> won: true

   Lock file exists after both attempts: true
   P1 won: true | P2 won: true

   *** RACE STILL PRESENT: both P1 and P2 believe they hold the lock ***
   P1 released. Lock file exists now: false
   P3.tryAcquire after P1 release -> ACQUIRED (correct — no live reindex was running)
   ```

   P2's `renameSync` call succeeds — not against the original stale lock
   (which no longer exists at that point), but against **P1's own
   freshly-created, live lock**, because `renameSync` cannot and does not
   distinguish the two: it operates on whatever is currently at the path.
   P2 then proceeds to its own `tryAcquire`, which also succeeds (the path
   is again empty), and P2 now genuinely believes it holds the lock — while
   P1's own reindex, which P2 just silently evicted from its lock file, is
   still actually running. When P1's own (correctly-specified) `finally`
   release eventually fires, it deletes the file P2 is depending on, exactly
   as round 10's original reproduction showed for the pre-fix `unlinkSync`
   algorithm — the fix moved the vulnerable operation from `unlink` to
   `rename`, but did not close the window the operation is exposed to.

**Why the "back-to-back, no serialization" framing in `T37-3`(d) and this
round's own narrow test both pass, and why that is not evidence of
closure.** The genuinely safe sub-case — two rename calls landing within the
same vanishing instant, before either process has done anything else — is a
real property of `rename()`'s atomicity and is correctly protected. But it
is also the *least likely* real-world interleaving: a full
rename→unlink→open cycle on a local filesystem completes in low
microseconds, while the *vulnerable* window (from the moment P1's cycle
completes to the moment P1's reindex itself finishes and releases) spans the
entire duration of a real full-repository index pass — plausibly seconds to
minutes on Max Cogar's real repos, per the same Step 20–22 indexer this
round's sibling Moderate concern (round 10's still-partially-open
`reindex.lock_stale_ms` magnitude question) already flags as unmeasured. A
second `refreshIfStale` trigger arriving at essentially any point during
that entire window — not a rare microsecond coincidence — reproduces the
corruption. The fix therefore closes the *rare* sub-case and leaves the
*dominant* one open, the inverse of what "made race-safe" claims.

**Why this matters (mission-fidelity, the same axis round 10's own Collapse
1 traced to).** Two full `runIndex` tree-walks writing to `store.db`
concurrently, unlocked at the application level, is exactly the scenario the
directory lock exists to prevent and exactly the scenario `AD-26`'s
WAL/`busy_timeout`/retry-once discipline was designed for *ordinary,
single-row, per-hook-event* contention, not for two extended, many-write
reindex passes contending repeatedly over the SQLite writer role — a
mismatch this document's own AD-26 language ("the handler never waits on
it") implicitly assumes cannot arise because the lock already prevents
concurrent detached reindexes. A partially-interleaved double reindex would
most plausibly manifest as an incomplete or internally inconsistent index —
lower or corrupted `files`/`symbols`/`import_edges`/`cochange_pairs` counts,
`SQLITE_BUSY` failures on individual statements after their one retry is
exhausted — indistinguishable, inside Step 42's exit-run report, from the
honest low floor Phase A is supposed to measure. This is the identical "a
false floor and a true floor read identically" concern
`docs/collapse-log.md`'s round-8 entry named for the co-change miner and
round 10's own Collapse 1 named for this very lock — recurring a third time,
in the *fix* for the second occurrence.

**What the fix should be.** The fundamental problem is that `rename()`'s
atomicity guarantees exclusivity only against the exact source path at the
instant of the call; it cannot verify the *identity* of what is being
renamed against what a separate, earlier `stat()` observed. A robust fix
needs one of:
1. **Identity verification immediately before finalizing the reclaim.**
   Open the lock file (not merely `stat` it) to obtain a file descriptor,
   record its device+inode pair, perform the staleness check on that open
   descriptor's `fstat`, attempt the rename, and — critically — after a
   successful rename, `fstat` the renamed file and compare its device+inode
   pair to what was captured at open time. A mismatch means another process
   already replaced the file between the open and the rename; in that case,
   do not proceed to delete-and-recreate (the file now at the reclaim path
   might be live) — instead treat it as a lost race and skip silently. This
   narrows the vulnerable window from "the winner's entire reindex duration"
   to "the gap between one `open`+`fstat` pair and one `rename`+`fstat`
   pair" — a few syscalls, not a multi-minute run — though it does not
   eliminate the window entirely (no filesystem-only primitive can, without
   a true compare-and-swap on rename, which POSIX does not provide).
2. **Disclose the residual honestly, in the same register the plan already
   uses for its other narrow, accepted races** (e.g. N1's scheme-normalization
   gap, Step 20's brace-in-filename residual), if the narrowed window from
   (1) is judged an acceptable residual for a single-host, single-user tool
   — but this requires actually building (1) first; the current text, with
   no identity check at all, has a window measured in the duration of a full
   reindex, not a few syscalls, and is not an acceptable residual as
   currently specified.
3. Either way, `T37-3`(d) needs a second concurrent-reclaim case that forces
   the interleaving this finding demonstrates (one reclaimer's full cycle
   completing before the second reclaimer's rename call), not only the
   narrow same-instant case it currently tests — otherwise a correct-looking
   green test suite continues to certify a mechanism that does not have the
   property it claims.

**Silent or self-revealing?** Silent — identical to round 10's own
classification of the pre-fix defect. No exception, no diagnostic, no log
line fires anywhere in the sequence; both processes proceed exactly as if
uncontended, and the eventual symptom (an incomplete or inconsistent index)
would not be traceable to this cause without deducing it from first
principles.

---

## Systemic Patterns

**Proactive scan run before classifying.** Checked whether Serious Finding
1's shape — a fix asserted complete in multiple places (Step 37's body, N7,
`T37-3`) that a single narrow test scenario does not actually establish —
recurs elsewhere in round 10's own new content, and whether the
`0.26.13`-vs-`0.25.10` version correction left any stray citation.

- **The "asserted complete, narrow test only" pattern.** Grepped
  `race-safe|no new failure mode|exactly one succeeds|exactly one winner`
  across the full 7450-line document: **5 hits**, at
  `docs/plans/plan-phase-a.md:2993, 3009, 3038, 4279, 5474/5480` — all five
  are restatements of the same single claim about the same single mechanism
  (Step 37's body, twice; N7's Answer field; `T37-3`'s Verifies and Data
  fields), not five independently-drifted instances of a broader pattern
  across different mechanisms. **Result: not a Systemic finding** — this is
  one defect (Serious Finding 1) echoed at its own primary site and its own
  two natural cross-references (the collapse-test that was supposed to
  interrogate it, and the test that was supposed to verify it), which is the
  expected shape of one finding fully propagated through a document with
  good citation discipline, not a pattern recurring at independently-drifted
  sites the way rounds 2–5's Systemic findings were.
- **Stray `0.26.13` citation check.** Grepped `0\.26\.13|0\.27\.0` across the
  full plan (18 hits, enumerated in this round's earlier verification pass)
  and `0\.26\.13|0\.27\.0|0\.25\.10` across the full architecture (0 hits for
  `0.26.13`/`0.27.0` outside the corrected V14 row and Standards table, which
  correctly describe it as the failed prior version). **Result: no stray
  citation presents `0.26.13` as the current or recommended pin anywhere in
  either document — not a Systemic finding.**
- **"Fix landed at primary site, not swept everywhere" check (this
  document's most persistently recurring class, rounds 2–9).** Checked
  whether round 10's V14 correction or its lock-reclaim fix left any
  cross-reference stale. All sites this round's Scope 2 inventory covers
  (D-plan-2, §11.4, §14.1/§14.2, the Standards registry, AD-25, AD-12,
  AD-26) are internally consistent and correctly updated — **no sweep
  failure found this round**, the first round since round 6 in which this
  specific recurring class was checked for and not found.

**Conclusion: no Systemic finding delivered this round.** Serious Finding 1
is confined to one mechanism (Step 37's reclaim sequence) and its three
direct textual echoes, not a pattern recurring across independently-drifted
sites.

---

## Moderate & Minor Findings

No new Moderate or Minor findings — verified by the full architecture read,
the fix-diff regression scan, the T-ID cross-checks in §12.1/§12.5, and the
targeted grep scans described in Scope 2 and Systemic Patterns above. Every
citation-drift class rounds 2–10 found (step-number misattribution, stale
collapse-test fields, malformed table rows, duplicated paragraphs, six-vs-
seven tuning-value miscounts) was re-checked at its previously-fixed site
and found to still be fixed; no new instance of any of those specific defect
classes was found anywhere in this round's inventory.

One residual is worth naming without raising it to a finding: `docs/architecture-phase-a.md`'s
AD-26 (concurrency) does not currently disclose the narrowed-but-real
reclaim-window residual Serious Finding 1 identifies (see Scope 2's AD-26
entry above). This is not classified as a separate finding because it is the
direct, mechanical consequence of Serious Finding 1 itself — fixing Serious
Finding 1 (per its own "What the fix should be" section) is what determines
what, if anything, AD-26 needs to disclose; writing an architecture-level
disclosure before the plan-level fix is chosen would be documenting a moving
target.

---

## Tentative Findings

No tentative findings — every candidate finding's premise was verified by
direct execution this session, per Compliance Gate B. Serious Finding 1's
"what the fix should be" section names an unresolved design choice (accept a
narrowed residual window vs. eliminate it entirely), but the finding itself
— that the current text does not have the race-safety property it
claims — is fully verified, not tentative; only the *remedy's exact shape*
is left open, and that is a design decision for the next fix pass, not a
gap in this round's verification.

---

## What's Actually Good

- **Round 10's dependency-floor fix is genuinely robust, not merely patched
  to the specific grammars round 10 happened to sample.** Independently
  installing `web-tree-sitter@0.25.10` fresh and loading/parsing eight
  different grammars (two beyond round 10's six), each with a real
  language-appropriate source snippet actually parsed (not merely loaded),
  produced correct results in every case, and a fresh, separate install of
  `web-tree-sitter@0.26.13` against the same `tree-sitter-wasms@0.1.13`
  reproduced the identical failure this round, ruling out a registry-state
  explanation. **Verified by:** direct execution, this session, in two
  independent scratch directories (Scope 1). **Standard:** the same
  execute-don't-assume discipline this review applies to its own findings,
  credited here because the fix generalizes correctly beyond its own
  original test coverage and beyond a transient-cause alternative
  explanation.
- **The plan's citation discipline around the V14 correction held up under
  a full, dedicated grep sweep.** Eighteen occurrences of `0.26.13`/`0.27.0`
  across the plan, and the architecture's own Standards-registry and
  V1–V19-table citations, were checked individually; every one correctly
  frames `0.26.13` as the failed, historical version rather than presenting
  it as current — a genuine improvement over this document's own six-round
  history of exactly this failure mode (Step-number and version citations
  drifting after a correction). **Verified by:** grep, this session, full
  document scope, every hit read in context. **Standard:** the citation
  discipline `docs/collapse-log.md`'s rounds 2–5 repeatedly found this
  document failing at — met here, on this specific correction, for the
  first time checked end to end in one pass.
- **The N3/N4-vs-N7 scoping split, while initially confusing on a surface
  read, is correct and deliberate, not a regression.** N3/N4's own text
  still says "six" numbers because its scope (the exit-run bar-tier
  calibration loop) genuinely excludes `reindex.lock_stale_ms` by Step 23's
  own explicit statement; giving `reindex.lock_stale_ms` its own N7 entry
  rather than inflating N3/N4's denominator is the correct resolution round
  10 chose, and it holds up under a fresh read that specifically checked for
  the "misleading unchanged count" shape this document's history is full
  of. **Verified by:** Read of both entries plus Step 23's own body, this
  session (Scope 2). **Standard:** the "a fix landed at its primary site" —
  in this case, the *decision not to touch* N3/N4 was itself the correct
  call, verified rather than assumed.

---

## Recommended Priority

1. **Serious Finding 1 (Step 37's lock-reclaim fix does not close the
   concurrent-reclaim race).** Fix before Step 37 is built — this is a
   correctness property of the mechanism whose entire job is preventing
   concurrent unlocked writes to `store.db`, and the current text would ship
   a mechanism that looks race-safe (passes its own `T37-3`(d)) while
   remaining vulnerable across the dominant real-world window. Requires
   either an identity-verification step (device+inode comparison
   immediately before finalizing a reclaim) or an honest disclosure of the
   narrowed residual after that step is added — not a disclosure of the
   current, unnarrowed window, which spans a full reindex duration and is
   not a defensible residual as specified. `T37-3`(d) needs a second case
   that forces the wider interleaving this finding demonstrates.
2. **Update `docs/architecture-phase-a.md`'s AD-26** to disclose whatever
   residual remains once (1) is resolved, consistent with AD-26's own
   existing practice of stating what a mechanism does and does not
   guarantee.
3. **Log this in §11.4 / §13 as part of the fix**, per the plan's own
   stated discipline, and add a collapse-log entry generalizing this
   round's lesson: **a collapse-test and a test spec written to interrogate
   a specific fix are not independent verification of that fix if both are
   authored against the same narrow scenario the fix's author had in mind —
   the "hardest question" a collapse-test poses is only as hard as the
   interleaving its author thought to construct, and a test suite that
   passes against a self-selected scenario is not evidence the mechanism
   lacks a wider one. The standing prescription: when a fix targets a
   concurrency defect, construct the interleaving that maximizes the
   vulnerable window's *duration*, not only the interleaving that maximizes
   apparent simultaneity — the widest window is usually not the one where
   two operations appear to happen "at the same instant," but the one where
   the first operation's entire remaining work happens to fall inside the
   second operation's decision window.**

---

## Verdict

Verdict: NEEDS FIXES (1 finding: 1 Serious)
