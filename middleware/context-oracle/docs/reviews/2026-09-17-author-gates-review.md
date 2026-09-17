# Author's compliance review (Gate A/B/C walk) — plan-phase-a.md after the round-6 S1 correction

**Date:** 2026-09-17
**Author of the plan (same person as this reviewer):** the session that applied
the round-6 collapse-hunt's S1 finding to `docs/plans/plan-phase-a.md` through the
hook-enforced correction loop, then applied the restating-surface re-derivation
this walk found.
**What is being reviewed:** `docs/plans/plan-phase-a.md` as installed in the
working tree after the S1 correction (40 steps; 124 test specifications; 27
probes).
**Input closed by this pass:** `docs/reviews/2026-09-16-round-6-collapse-hunt.md`
finding **S1** (the co-change miner mis-keyed non-ASCII paths). The round-6
expert-review returned PASS with zero findings; nothing to close there.
**What this review is NOT:** the independent post-fix collapse-hunt and
expert-review (round 7). Those are dispatched to fresh subagents; this file — the
author's own walk — must exist *before* that independent pass is what closes the
round, and this pass does not itself close round 6.
**Why it exists:** Max Cogar requires the author's Gate A/B/C walk after each
correction pass and before any review. This pass was initially skipped — the S1
fix was applied through the correction loop and then declared closed without this
walk, and the independent pass was dispatched out of order (recorded in §7 below
as a process error). This file corrects that.

---

## 1. The correction, and the second-order surface it required

The round-6 collapse-hunt found S1: Step 13's miner ran `git log --numstat` and
read the path field verbatim, but git's `core.quotePath` defaults ON, so a
non-ASCII path is C-quoted (`café.txt` → `"caf\303\251.txt"`) and stored mis-keyed
against the structural indexer's raw-UTF-8 `readdir` key — silently, no fault
raised — biasing the Phase A floor. The fix (applied through the correction loop,
`state/done.json` round 6, commit `bb67254`): Step 13 runs
`git -c core.quotePath=false log …` so path fields arrive as raw UTF-8, and routes
any field or rename identity still beginning with a double-quote (a residual
C-quote of a literal `"`/`\`/tab/newline path) to the existing
`miner_unparsed_numstat` diagnostic, never guessed. Supporting edits: §2.1 command
form, Step 6 fault description, T-13-1 (a `café.txt` fixture path and a guard
clause), §11.4 (`probe:27_git_numstat_quotepath`).

The correction-loop pass marked the register entry **Q56 "no change"** on the
reasoning that Q56 is rename-scoped. This walk's `--impact` step (below) shows that
reasoning was too narrow — Q56 restates Step 13's rename reading, which the fix
touched (renames now run under `core.quotePath=false`, and a rename identity still
C-quoted is routed to the diagnostic) — so Q56 was re-derived. This is exactly the
class of restating-surface drift the author's walk exists to catch and the loop's
per-issue judge does not: the judge checks the diff implements the proposal, not
whether the author's "no change" reasoning on a restating surface was correct.

## 2. The `--impact` restating-surface walk (re-derive each; a hand-kept copy is where prior rounds regressed)

`node .claude/skills/expert-plan/scripts/derive-plan-sections.mjs --impact 033f5de docs/plans/plan-phase-a.md`
(033f5de is the pre-fix revision) reports the steps whose text changed as **S6**
and **S13**, and lists every surface restating them. Each is re-derived or
confirmed unaffected:

**S13 (miner command + residual-quote routing):**
- `T-13-1` — edited by the fix (fixture + guards). ✓
- **Q56 (register, line ~9841)** — **re-derived**: now states the miner runs
  `git log` under `core.quotePath=false` (raw-UTF-8 path fields and rename
  identities, `probe:27`), and that an ambiguous field *or either rename identity
  still C-quoted* is skipped with `miner_unparsed_numstat`. This is the one surface
  the loop pass left stale.
- Standards §3 line 288 (confidence-computation grounding of Step 13/16) — about
  the confidence math, not path encoding. No change.
- Step S5 line 1258 ("the miner's `git log` (Step 13) … goes through [the spawn
  wrapper]") — a reference to the subprocess, not a restatement of the command
  form. No change.
- Steps S14:2262 (`mineCochange`), S16:2496 (`age_days`/`last_ts`), S30:3838/3876
  (`revert_chain`) — reference miner *outputs*, whose semantics the fix does not
  change (a correctly-keyed pair is still a pair). No change.
- Test spec at line 9128 (Step 13 corpus floor + Step 18 through the pipeline,
  AC-6) — exercises the corpus floor, not path encoding. No change.
- §14.1 line 9687 (fault-code list naming `miner_unparsed_numstat`) — the code is
  unchanged. No change.

**S6 (`miner_unparsed_numstat` description broadened):**
- `T-6-1` (Data, line ~7606) — enumerates the fault-code *names* (`store_busy`,
  …, `miner_unparsed_numstat`, …). The fix broadened the code's *trigger
  description*, not the code set; `miner_unparsed_numstat` was already listed. No
  change. `T-6-2` (JSONL writer) — unrelated. No change.
- Q30/Q31 (register), decisions at 408 (D-plan-32) and 5642 (`head_unresolved`),
  and the S9/S10/S11/S12/S14/S15/S28 mentions of "Step 6's" types/codes — all
  reference the code or Step 6's types generally, none restates the
  `miner_unparsed_numstat` trigger wording. No change.
- §4 line 365 and §14.1 lines 9689/9693 (`frontend_parse_failed`, the code set) —
  unaffected. No change.

## 3. Closure of the S1 finding

| Finding | Where closed | Re-derived beyond its own location | Check |
|---|---|---|---|
| CH round 6 **S1** — miner reads `--numstat` path fields verbatim; `core.quotePath` (default ON) mis-keys every non-ASCII path against the indexer's `readdir` key, silently | Step 13 runs `git -c core.quotePath=false log …`; any field/rename-identity still beginning with `"` → `miner_unparsed_numstat`, never guessed | §2.1 command form; Step 6 fault description; T-13-1 (fixture `café.txt` + two Fails-when guards); §11.4 new `probe:27` claim; **Q56** (this walk) | `probe:27_git_numstat_quotepath` (executed, `--repeat 3 --load 2`); `--check` (27 probes cited, regions current); `--impact 033f5de` walk (this §2); read of each surface |

## 4. Author's collapse-test on the load-bearing decision the fix introduces

The fix introduces one load-bearing choice: **read raw UTF-8 via
`core.quotePath=false` and route residually-quoted fields to
`miner_unparsed_numstat`, rather than `-z` or octal-decoding in the miner.**

1. **Job (mission terms).** Keep the miner's stored co-change keys byte-equal to
   the paths the indexer and genres look up, so the honest Phase A floor is not
   silently biased by any repo that has a non-ASCII path.
2. **Hardest question a skeptic asks.** *"`core.quotePath=false` still C-quotes a
   path with a literal `"`, `\`, tab, or newline; and it does nothing about
   Unicode NFC/NFD — so the miner can still store a key the indexer never
   produces. The 'fix' just narrows the leak."*
3. **Answer, with citation.** For the residual-quote case, the miner does not
   guess: any field (or either rename identity) still beginning with `"` is
   recorded as `miner_unparsed_numstat` (Step 6; AD-13's "each exclusion recorded
   … never guess"), so it is a *visible* omission, not a silent mis-key — which is
   what the Phase A goal requires (spec §11.5: measure the floor honestly,
   including what it does not catch). It is executed, not asserted
   (`probe:27_git_numstat_quotepath`). The NFC/NFD question is real and is the one
   thing this walk cannot close from the author's seat: on Linux (Phase A's target
   container) `readdir` returns the exact bytes git emits, so they match; a
   cross-platform NFC/NFD mismatch is out of Phase A's executed surface. It is
   named here explicitly so the **independent round-7 pass** attacks it rather than
   the author waving it through — the author must not be the one who closes it.
4. **Steers toward.** Recording what cannot be decoded and measuring it (the
   diagnostic count is a floor number), never inferring a path. **Guide, not
   gate.**

## 5. Gate A / B / C walk (`references/output-contract.md`) on the amended plan

**Gate A — enables downstream work.** The changed steps carry no open question,
option set, or deferred choice: Step 13 states the exact command and the exact
disposition of every path-field shape; T-13-1 states the fixture and the failure
conditions; §11.4 carries the executed evidence. An implementer can execute Step
13 with no decision on the fly, and a reviewer can check it against `probe:27` and
T-13-1. ✓

**Gate B — compliance auditable from the document.** The S1 fix's governing
standard is named (AD-13 / FR-K2, §3); its factual premise has a §11.4 entry with
read-level (executed-probe) evidence (`probe:27`); the decision and its rejected
alternative (`-z`) are surfaced in Step 13's prose and in §4 above; the test
(T-13-1) names its behavior, level, real/double boundary, data, and failure
condition. Each is answerable by pointing to a section. ✓

**Gate C — final checklist (items the fix touches).** Every changed step keeps its
`step-decl`; `--check` exits 0 (generated regions current, step↔test and
step↔step references resolve, `probe:27` cited both ways); `run-plan-probes.mjs`
exits 0 (`--repeat 3 --load 2`, so probe 27 is not timing-dependent); the §11.4
entry carries an executed probe, not a transcription; Q56 and the other authored
restating surfaces were re-derived from the current step set (this §2), not
patched. No scratchpad or option set remains. ✓

## 6. Gate runs (this pass)

```
$ derive-plan-sections.mjs docs/plans/plan-phase-a.md --check
OK: 40 steps, 13 elements, 124 test specs, 27 probes cited, regions current      (exit 0)

$ derive-plan-sections.mjs --self-check
self-check passed: 34 checks                                                     (exit 0)

$ run-plan-probes.mjs docs/plans/plan-phase-a.md --repeat 3 --load 2
… ok 27_git_numstat_quotepath (3 runs)
all probes match their recorded expectations                                     (exit 0)

$ tools/check_docs.py
context-oracle doc-consistency check passed.                                     (exit 0)

$ derive-plan-sections.mjs --impact 033f5de docs/plans/plan-phase-a.md
steps whose text changed since 033f5de: S6, S13   (surfaces walked in §2)          (exit 0)
```

## 7. Process error recorded (per dominating rule 1 / OL-C7)

The author-gates walk is required *before* any independent review; on this
correction it was skipped, closure was declared, and the independent round-7 pass
(two fresh subagents) was dispatched *before* this walk existed. Max Cogar caught
the skip. This file is the belated walk. Consequence for round 7: the independent
pass began on the plan at `bb67254` (the S1 fix) and does not include this walk's
one further change, the Q56 re-derivation — a register-entry restating-surface
sync that `--impact` surfaced and `--check` validates mechanically, outside the
load-bearing surface (Step 13 command, `probe:27`, T-13-1) the independent hunt
attacks. The round-7 findings are processed against the current plan when they
return; if either reviewer's result turns on a surface this walk changed, the
independent pass is re-dispatched on the final plan rather than salvaged. Round 6
is not closed, and the plan is not the build contract, until the independent
round-7 pass is clean on the current plan.
