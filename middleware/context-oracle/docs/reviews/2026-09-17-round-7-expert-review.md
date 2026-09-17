# Round 7 — Independent post-fix expert-review of `docs/plans/plan-phase-a.md`

**Date:** 2026-09-17
**Reviewer:** independent fresh session; I did not author this plan or the S1 fix.
**Artifact under review:** `docs/plans/plan-phase-a.md` and the two new probe
files, as installed in the working tree, diffed against `033f5de` (the pre-fix
revision the round-6 collapse-hunt attacked).
**Nature:** Post-fix review after the round-6 collapse-hunt finding **S1** (the
co-change miner silently mis-keyed non-ASCII paths). The round-6 expert-review
returned PASS with zero findings; the round-6 collapse-hunt returned one Serious
(S1). This pass verifies S1's remediation and runs a fresh full review over the
changed surfaces.
**Standards this review evaluates against:** the plan's own named sources for the
changed step — `AD-13` (miner: "each exclusion recorded … never guess"),
`FR-K2` (hygiene), the Phase A goal (`spec §11.5`: an *honest* measurement of the
floor, never a silently biased substrate) — plus the discipline's test-design
standard (equivalence partitioning: every partition a spec claims must be
populated by data that exercises it; an assertion no input can trigger is not
coverage).

---

## Scope and Inventory

**Round number:** 7 (first post-fix round following the round-6 independent pass).

**Post-fix inventory sources (Step 2 rule):**
1. *Prior review's inventory* — round-6 expert-review (`2026-09-16-round-6-expert-review.md`, PASS/0) and round-6 collapse-hunt (`2026-09-16-round-6-collapse-hunt.md`, 1 Serious).
2. *Fix-diff files* — the three files named in the dispatch.
3. *Fix-diff dependents (restating surfaces)* — every surface `--impact 033f5de` and the author's walk name for S6/S13: §2.1 command line, §6 fault list, §11.4 probe catalog, T-13-1, §14.1 fault-code list, Q56.
4. *Prior findings as closure items* — CH-R6 **S1**.

**File checklist:**

- [x] `docs/plans/plan-phase-a.md` — Read at 92 (§2.1), 1354–1357 (§6 fault), 2116–2175 (Step 13), 7133–7151 (§11.4 probes 24+27), 7408 (fixtures-are-real-repos), 7818–7859 (T-13-1), 924 (miner-hygiene fixture def), 9841–9849 (Q56); grep `quotePath|numstat|miner_unparsed_numstat` (49 hits, enumerated at the relevant lines); grep for an embedded-double-quote/backslash **fixture** file (0 fixture hits — only the probe-catalog `a\b.txt` at 7147–7150).
- [x] `docs/plans/plan-phase-a.probes/27_git_numstat_quotepath.sh` — Read (full, via diff) and **executed** in this environment.
- [x] `docs/plans/plan-phase-a.probes/expected/27_git_numstat_quotepath.txt` — Read (full) and **diff-matched byte-for-byte** against the live probe run.
- [x] `docs/reviews/2026-09-16-round-6-collapse-hunt.md` — Read (S1 finding, incl. its "Concrete fix" paragraph) as the closure item.
- [x] `docs/reviews/2026-09-17-author-gates-review.md` — Read (the author's Q56 re-derivation and the NFC/NFD deferral flagged for this pass to attack).

**Tool plan (Step 3):**

| Claim type in this review | Instrument | Used |
|---|---|---|
| Literal plan text ("line N says Z") | Read at file:line | ✓ (ranges above) |
| Absence ("no fixture plants a quoted path") | grep + Read of scope | ✓ (grep counts recorded) |
| git behavior ("`core.quotePath` C-quotes …", "rename identities quoted independently") | **direct execution** in this env (git 2.43.0) | ✓ (pasted below) — stronger than a docs lookup, so Context7 not required |
| Structural consistency (probes cited both ways, regions current) | plan tooling `derive-plan-sections.mjs` + `tools/check_docs.py` | ✓ |
| Multi-perspective pre-delivery check | `collaborativereasoning` | infra not invoked; performed manually (standards / downstream / implementer personas) and recorded here as a procedural note |

No instrument class was unavailable for any load-bearing claim category; the
git-behavior category — the core of this review — was verified by execution, not
memory or docs. No rigor waivers were requested or taken.

## Summary

**This review returns NEEDS FIXES (1 finding: 1 Moderate).** The S1 fix is, on its
load-bearing half, correct and well-reasoned: the miner now runs
`git -c core.quotePath=false log …`, so a non-ASCII path (`café.txt`) arrives as
raw UTF-8 that byte-matches the indexer's `readdir` key — the silent mis-key S1
named is closed and is exercised by a positive T-13-1 guard and by an executed
probe I reproduced exactly. The residual-quote *detection* the fix adds ("any path
field, or either rename identity, that still begins with a double-quote → route to
`miner_unparsed_numstat`, never guess") is also correct, and I confirmed by
execution that git makes it complete — quoted renames always print as the fully
quoted `"old" => "new"` form, never a quoted brace form, so a leading-`"` test on
each split identity catches every quoted case. The one defect: that new
routing branch — the safety half of the fix, and the half S1's own "Concrete fix"
paragraph asked to be exercised with a control-char/quoted fixture file — has a
`Fails when …` guard in T-13-1 but **no fixture data that can trigger it**, so the
branch ships untested. That is a real coverage hole on the exact branch whose job
is to keep the Phase A floor honest, and I demonstrate below the concrete
implementer error it would fail to catch.

## Upstream Contract Verification

Upstream references governing this scope: the plan's named sources (AD-13, FR-K2),
the Phase A goal (spec §11.5), and CH-R6 **S1** as the closure item.

- **AD-13 "each exclusion recorded … never guess" — happy path (raw-UTF-8 keying).**
  **Honored.** Step 13 (`:2123`) runs under `core.quotePath=false`; `café.txt` is
  stored under its raw-UTF-8 key. *Verified:* executed probe 27 (below) + T-13-1
  positive guard (`:7844–7846`).
- **AD-13 "never guess" — residual-quote branch (literal `"`/`\`/tab/newline).**
  **Honored in specification** (`:2132–2137`, `:9847–9849`), and the detection is
  *complete* per git's output contract (verified by execution below). **But not
  exercised by any test** — see M1. The routing is stated correctly; nothing in the
  plan's test set proves an implementation of it fires.
- **Phase A goal (spec §11.5) — honest floor, no silent bias.** **Advanced.** The
  fix removes the silent non-ASCII under-count that biased the floor; the residual
  case is converted from a silent mis-key to a *visible* diagnostic count. The
  untested state of that diagnostic branch (M1) is the residual risk to this
  contract.
- **CH-R6 S1 closure.** **Core defect closed, remediation test-half incomplete.**
  The Serious defect (silent mis-key of every non-ASCII path) is closed and tested.
  S1's "Concrete fix" paragraph asked for two test-side items: (a) a T-13-1 clause
  "Fails when a quoted or escaped path lands in `cochange_pairs`" — **done**
  (`:7846–7848`); and (b) "Add a non-ASCII (**and ideally a control-char**)
  filename to the `miner-hygiene` fixture" — **only the non-ASCII half was added**
  (`café.txt`); no control-char/quoted fixture file exists. M1 is that gap.
  *Verified:* Read of the S1 "Concrete fix" paragraph + grep across the whole plan
  for an embedded-quote/backslash fixture file (0 hits).

## Critical & Serious Findings

No Critical or Serious findings — the full post-fix inventory above was Read or
executed/grep-verified, and no violation of Critical or Serious classification was
observed. The Serious closure item (S1's silent mis-key) is fixed and exercised;
the residual defect is Moderate (M1).

## Systemic Patterns

No systemic patterns — the changed surface is a single fix across §2.1, §6,
Step 13, §11.4, T-13-1, and Q56. I looked for a second instance of the M1 pattern
("a `Fails when` guard with no fixture data to trigger it") *within the fix's own
changed surfaces*: grep for the residual-quote/embedded-quote signature across the
plan returned the branch's prose and guard only (lines 2134, 7144, 7150,
7846–7848) and **0** fixture-data occurrences — one instance, not two. I did not
scan all 124 test specs for the pattern (out of this fix's scope), so no systemic
claim is made or implied; extrapolating one instance to systemic would fail the
Step 8 scan rule.

## Moderate & Minor Findings

### M1 — The residual-quote → `miner_unparsed_numstat` branch (the fix's safety half) has a `Fails when` guard but no fixture data that can trigger it, so it ships untested

**What the plan does now.** The S1 fix adds a new miner branch: under
`core.quotePath=false`, "any path field — or either rename identity — that still
begins with a double-quote cannot be taken as a literal and is skipped with a
`miner_unparsed_numstat` diagnostic (Step 6), never guessed" (`:2132–2137`).
T-13-1 adds the matching guard: "**Fails when** … any C-quoted or escaped path
field — one beginning with a double-quote — lands in `files` or `cochange_pairs`
instead of being recorded as `miner_unparsed_numstat`" (`:7846–7848`), and its
Data claims "equivalence partitioning over … path encodings" (`:7836–7838`). But
T-13-1's `miner-hygiene` fixture Data (`:7825–7838`) plants only `café.txt`, whose
bytes are ≥ 0x80 and are therefore **not** quoted under `core.quotePath=false`
(they come through raw). No planted file contains a literal double-quote,
backslash, tab, or newline — the only inputs git *still* C-quotes under the flag —
so no numstat field in the fixture ever begins with `"`. The guard is structurally
unable to fire: the assertion passes vacuously.

**How this was verified.**
- Read T-13-1 Data + `Fails when` (`plan-phase-a.md:7825–7849`) and the
  `miner-hygiene` fixture definition (`:924`, "planted pair, merge commit, 45-file
  commit, beyond-horizon commit") — neither specifies a quoted-path file.
- grep across the whole plan for an embedded-double-quote or backslash **fixture**
  filename: 0 fixture hits (the only `a\b.txt` is in the §11.4 *probe catalog* at
  `:7147–7150`, which is a git-behavior probe, not a miner test input); grep
  `residual|literal double-quote|control-char`: hits only at `:2134`, `:7144`,
  `:7150`, `:7846–7848` — prose and the guard, never fixture data.
- The branch it guards is real and easy to get wrong. Executed in this environment
  (git 2.43.0), git quotes each rename identity **independently**, not the whole
  field:
  ```
  $ git -c core.quotePath=false log --no-merges --numstat -M --format=%x00 -1
  0    0    aqb.txt => "a\"q.txt"          # old side unquoted; new side quoted
  0    0    src/{utils => other}/café.txt  # non-ascii: raw, brace form, NO quote
  ```
  and when any component needs quoting git abandons the brace form for the full
  quoted form (verified with the quote in one side, both sides, and the shared
  prefix):
  ```
  $ git -c core.quotePath=false log --no-merges --numstat -M --format=%x00 -1
  0    0    "src/utils/a\"b.txt" => "src/other/a\"b.txt"
  ```
  So the field `aqb.txt => "a\"q.txt"` does **not** begin with `"` — only its
  second split identity does. An implementer who reads "begins with a double-quote"
  and tests the *whole field's* first char (instead of each split identity's) would
  store `"a\"q.txt"` verbatim in `cochange_pairs` — the exact S1 defect, back
  through the rename door — and **T-13-1 would pass**, because its fixture never
  produces this line.

**Standard it violates.** Test-design equivalence partitioning (named by the test
itself at `:7836–7838`): a partition a spec claims must be populated by data that
exercises it; a `Fails when` assertion no fixture input can trigger is not
coverage, it is the "test that cannot fail" anti-pattern. Compounded by AD-13's
"never guess" being the *load-bearing* safety property of this fix and by the
Phase A goal (spec §11.5) — an unverified honest-floor mechanism is precisely what
this project's dominating rule 3 warns "passes review without serving the goal."
S1's own "Concrete fix" paragraph asked for exactly this fixture file ("and ideally
a control-char filename"); it was the one requested item omitted.

**What correct looks like.** Add one file to the `miner-hygiene` fixture whose path
is residually C-quoted under `core.quotePath=false` — e.g. a filename containing a
literal double-quote or backslash (`a"b.txt` or `a\b.txt`), co-changing with the
planted pair's partner in one commit — and, to cover the rename door I demonstrate
above, ideally rename it so numstat emits `partner => "a\"b.txt"`. Then the
existing `Fails when` guard (`:7846–7848`) becomes live: the run proves the field
is recorded as `miner_unparsed_numstat` and never reaches `cochange_pairs`, and it
would fail a whole-field-first-char implementation. The fixture-definition line
(`:924`) and the Data paragraph (`:7825–7838`) should name the added file so the
"path encodings" partition claim is honestly populated.

**Classification.** Moderate. **Provenance.** Recurring — the residual-quote
routing S1's fix note specified is present and correct in prose, but the fixture
exercise S1 explicitly requested is still absent, so S1's remediation is
test-incomplete rather than a newly introduced defect.

## Tentative Findings

No tentative findings — every premise above was verified: plan text by Read at
file:line, absence by grep with recorded counts, and all git-behavior claims by
direct execution in this environment (git 2.43.0). Nothing rests on memory, a prior
document's assertion, or an in-artifact comment.

## Observations

- **NFC/NFD normalization (flagged by the author's walk §4 for this pass to
  attack).** No standard violation for Phase A: on Linux (the Phase A target
  container, spec §11.5) neither git nor `readdir` normalizes Unicode — both return
  the exact on-disk bytes for the same file — so a file committed and checked out on
  Linux yields byte-identical miner and indexer keys regardless of NFC/NFD form.
  `core.precomposeUnicode` is macOS-only and out of Phase A's executed surface. The
  deferral is correctly scoped, not a hidden gap; recorded here because the author
  asked the independent pass to confirm rather than wave it through. (Verified by
  reasoning from Linux filesystem/git behavior; not executed cross-platform, which
  is why this is an Observation and not a positive assessment.)
- **Multi-perspective check (procedural).** `collaborativereasoning` was not invoked
  at the infrastructure level; the three-persona check was performed manually.
  Standards persona: M1's named standard and premises hold. Downstream persona:
  NEEDS FIXES with one concrete, mechanical fix is actionable and does not gate the
  build contract on anything vague. Implementer persona: the fix note gives the
  exact fixture file and the rename trap it must catch. No perspective-unique gap
  remained.

## What's Actually Good

- **The residual-quote *detection* is complete, not merely plausible.** Step 13's
  rule keys on "either rename identity that still begins with a double-quote"
  (`:2134–2136`) rather than the whole field. *Standard:* correctness against git's
  actual output contract (not memory). *Verified by execution:* git quotes rename
  identities independently and always falls back from the brace form to the fully
  quoted `"old" => "new"` form when any component needs quoting (three cases run:
  quote in the new side, in both sides, in the shared prefix — all produced full
  quoted identities each beginning with `"`). The per-identity leading-`"` test
  therefore catches every quoted case; there is no quoted-brace form that could slip
  through. This is a genuinely well-reasoned choice, and the prose is precise about
  the distinction that makes it correct.
- **probe 27 is executed evidence with an exact, reproducing oracle.** *Standard:*
  the plan's evidence discipline (§11.4 entries are executed, not transcribed).
  *Verified:* I ran `27_git_numstat_quotepath.sh` and diffed its output against
  `expected/27_git_numstat_quotepath.txt` — byte-for-byte identical, on git 2.43.0
  as the §11.4 claim states; the claim text at `:7141–7151` matches what the probe
  prints (café.txt `"caf\303\251.txt"` default / raw under the flag; `a\b.txt`
  `"a\\b.txt"` under both; `plain.txt` raw under both).
- **The `-z` rejection carries a real rationale.** `:2131–2132` explains `-z` is not
  used because the record framing already spends `%x00` on the `--format` header and
  the parse is line-by-line. *Standard:* no unexplained option choices (dominating
  rule 2). The rationale is sound: `-z` would make numstat records NUL-terminated,
  colliding with the `%x00` field separators the header already uses, so the
  line-by-line parse the miner relies on stays unambiguous only without it. Verified
  by reasoning about git's `-z` framing against the chosen `--format`.

## Convergence Record

- **Round number:** 7 (first post-fix round after the round-6 independent pass).
- **Trajectory (findings by severity, independent pass per round):** R6 → 1 Serious
  (CH-R6 S1; the R6 expert-review returned 0) → R7 → 1 Moderate.
- **Flow counts (this round):** prior findings closed: 1 (S1's core silent-mis-key
  defect, closed against AD-13 and exercised by the café.txt positive guard + probe
  27); new: 0; recurring: 1 (M1 — S1's requested residual-quote fixture exercise
  still absent); regressions: 0.
- **Tripwire evaluation (arithmetic shown):**
  - Condition (a) new + regression ≥ closed for **two consecutive** post-fix rounds:
    this round 0 + 0 = 0, closed = 1, so 0 ≥ 1 is **false** this round, and this is
    the **first** post-fix round — two consecutive cannot hold. **Not fired.**
  - Condition (b) total findings not strictly decreased for **two consecutive**
    post-fix rounds: R6 = 1 → R7 = 1 (not a strict decrease), but this is the first
    post-fix round, so two consecutive cannot hold. **Not fired.**
  - **Tripwire not fired.** No foundational-rework signal; the fix is on the right
    approach and needs one bounded test-data addition, not a rebuild.

## Recommended Priority

Fix M1 before closing round 6: add the residually-quoted fixture file (a filename
with a literal `"` or `\`) to `miner-hygiene`, co-changing with the planted pair's
partner and ideally on the rename side, and name it at `:924` and in T-13-1's Data.
This is the single item that turns the fix's safety branch from asserted to
executed, and it is the item S1's own concrete-fix note requested. It is small,
mechanical, and load-bearing for the Phase A goal — an honest floor whose
"never guess" guard is unexercised is exactly the "passes review without serving
the goal" trap this project names. Everything else in the changed surface is sound
and needs no rework.

Verdict: NEEDS FIXES (1 finding: 1 Moderate)
