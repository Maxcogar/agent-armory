# Branch audit — batch 7, part b (the Step 13 build review and its follow-ups): adjudication

This file adjudicates batch 7 part b of the branch audit, commits 41–49:
`f39769a` (the independent review of the Step 13 build and its four test
files), then `c31d87e`, `55fe887`, `21b8721`, `821c835`, `876afa3`, `e4b4455`,
`e70536e` and `6d6f21d` (architecture and plan fixes). Its inputs are the first
audit `2026-09-26-branch-audit-B7b.md` (E-1 … E-25: 14 keep, 11 replace) and the
second opinion `2026-09-26-branch-audit-B7b-second-opinion.md` (18 entries). The
adjudicator made none of the changes and wrote neither review. The test applied
is the auditor brief
`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/BRIEF.md`.

Settled and not re-litigated: the B1–B6 verification files and the B7a
adjudication. Batch 5 ruling 1 (watermark) and ruling 2 (recency) govern. Batch
4: `git` exit 128 is a git fault with no purge. Batch 3: a writer leaves at least
25 ms between chunks, and the event handler never waits.

**How the work was done.**
- My own scratch extractions under the scratchpad folder `b7badj/`, made with
  `git archive <commit> middleware/context-oracle/ctxoracle | tar -x`, for
  `f39769a`, `6bbda1d` and `HEAD` (`0e51b99`). This checkout's
  `ctxoracle/node_modules` was symlinked in and each was built with
  `npx tsc -p tsconfig.json`. Baseline on `HEAD`:
  `node --test dist/test/unit/miner*.test.js` → `# pass 49 # fail 0`.
- During this adjudication `HEAD` moved to `a4264e8`. That commit adds only
  the batch 7 part c audit file (`git diff --stat 0e51b99 a4264e8` → `1 file
  changed, 405 insertions(+)`), so every "Still at HEAD" below holds for both.
- The miner at `HEAD` differs from `6bbda1d` only by `gitChildEnv()` on its git
  calls (`git diff 6bbda1d HEAD -- …/src/miner` → one import and two `env:`
  arguments).
- A driver `run.mjs <build> <repo> <tag> [h] [horizonYears]` runs one
  `mineCochange` pass into fresh stores (or the same stores with `KEEP=1`). It
  prints files, pairs with their paths, `schema_meta`, exclusion counts and
  faults. A mutation runner `mut.py` copies a build, replaces one exact string
  in `dist/` (it refuses unless the string occurs once) and runs the named
  tests.
- Throwaway git repositories under `b7badj/repos/`, with `GIT_DIR`,
  `GIT_WORK_TREE` and `GIT_INDEX_FILE` unset, `GIT_CONFIG_GLOBAL=/dev/null` and
  `GIT_CONFIG_NOSYSTEM=1`. The `CTXORACLE_HOME` of the one CLI run was a scratch
  folder.
- Web quotes were checked with the audit folder's `webquote.py`. Tool versions:
  git 2.43.0, Node v22.22.2. No repository file other than this one was
  written; no git state was changed.

Entries neither second-opinioned nor changed by a verified fact are listed at
the end and not re-ruled.

### E-2
**Ruling:** The second opinion is upheld: keep → replace. The first audit is
right that each of the three cases fails under a planted fault in the rule it
names. It did not ask whether what two of them pin is correct.

T-13-1m and T-13-1n pin a rule the plan did not state. The rule: after a
malformed field at an entry position, the parser keeps reading well-formed
entries into the current commit. The plan at `f39769a` says a header is
expected "after a commit's last entry". The parser cannot know which entry is
the last, so a damaged next header arrives where an entry may stand. It is read
as a malformed entry, and the damaged commit's later entries are credited to
the commit before it. That fabricates pairs no commit made. The plan's guard
for format drift forbids a guessed identity. T-13-1n's own stream is such a
damaged header (`0x1e` + 40 non-hex), and the test asserts that the entry after
it belongs to commit one.

I reproduced the leak in the parser on all three builds and through real git at
`HEAD`. Planted as a fix, the resynchronising rule removes the leak: a malformed
field at an entry position opens a skipped run to the next valid header, as a
header-position field already does. Only T-13-1m and T-13-1n fail against it.
T-13-1l is sound.

One point the second opinion left implicit must be stated in the correction.
Entries read before the malformed field stay with their commit. In the
damaged-header case they are the whole previous commit, which is correct data.
In the damaged-entry case they are a real but partial commit, and the fault
reports it. The `55fe887` wording "makes its record malformed: it contributes
nothing" can be read as dropping the whole commit, so the correction must say
which is meant.

**Evidence:**
- T-13-1n's stream and its assertion [[middleware/context-oracle/ctxoracle/test/unit/miner.test.ts@f39769a:L269-L270]] "`\x1e${'g'.repeat(40)}`, // 0x1e + 40 non-hex: not a header, a shape-less entry '1\t0\ttwo.txt'," and [[middleware/context-oracle/ctxoracle/test/unit/miner.test.ts@f39769a:L275-L275]] "assert.deepEqual(commits[0]?.paths.map((p) => String(p)), ['one.txt', 'two.txt'], 'a loose header split the first commit');"
- T-13-1m pins per-entry continuation [[middleware/context-oracle/ctxoracle/test/unit/miner.test.ts@f39769a:L259-L260]] "assert.equal(malformed.length, 2, 'each count-less entry is one malformed record'); assert.deepEqual(commits.flatMap((c) => c.paths.map((p) => String(p))), ['good.txt']);"
- The plan at the commit states where a header is expected, not what follows a malformed entry [[middleware/context-oracle/docs/plans/plan-phase-a.md@f39769a:L3126-L3127]] "**at a position where a header is expected** (after a commit's last entry, or at stream start)"; its guard [[middleware/context-oracle/docs/plans/plan-phase-a.md@f39769a:L10902-L10904]] "each of which must be recorded as `miner_unparsed_numstat` and contribute no pair (never a partial or guessed identity): the defensive guard against a future git output-format drift;"
- The code at `HEAD`: an entry position takes a header or an entry, and a shape-less entry is recorded and parsing continues [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@0e51b99:L229-L235]] "case 'entry': if (isHeader(f)) { // A header is expected here: after the separator or after an entry. this.startCommit(f); return; } this.entry(f);" and [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@0e51b99:L258-L260]] "this.malformed(f); // lacks the `<added>\t<deleted>\t` shape return;"
- My parser probe `leak.mjs`: the fields `\x1e<40×'2'>`, `1700000002`, `c2`, ``, ``, `\n1\t1\ta`, `1\t1\tb`, `X<40×'3'>`, `1700000003`, `c3`, ``, ``, `\n1\t1\tc`, `1\t1\td`, `\x1e<40×'4'>`, `1700000004`, `c4`, ``, ``, `\n1\t1\ta`. It prints the commits (first hash digit, paths) and the malformed items (commit digit, records).
  - [[ran]] `node leak.mjs <build>/middleware/context-oracle/ctxoracle` → on `f39769a`: `[["2",["a","b","d"]],["4",["a"]]] [["2",null],["2",null],["2",null],["2",null],["2",null],["2",null]]`
  - on `6bbda1d` and on `HEAD`: `[["2",["a","b","d"]],["4",["a"]]] [["2",1],["2",1],["2",1],["2",1],["2",1],["2",1]]`
  - `c3`'s `d` is credited to `c2` on every build.
- Through real git on the `HEAD` build. Repository `mid`: `c1`, `c2` and `c4`
  touch `a` and `b`; `c3` (`4a6484d`) touches `c` and `d`. A `PATH` shim runs
  the real git and, on the `--numstat` call only, turns `\x1e<c3>` into
  `X<c3>`.
  - [[ran]] `PATH="$S/shim:$PATH" node run.mjs HEAD $S/repos/mid leak` → `"pairs":["a+b:3:9.820135849960186e+150","a+d:1:3.2733762183953577e+150","b+d:1:3.2733762183953577e+150"]`, faults `{"commit":"481ac28d…","records":6,"first":"X4a6484d…"}` and `{"expected":4,"read":3}`.
  - `c2` (`481ac28`) never touched `d`, so the pairs (a, d) and (b, d) are
    fabricated.
- The resynchronising rule, planted on a copy of the `HEAD` build.
  `this.malformed(f); // lacks the` becomes `this.startSkip(f, this.cur?.hash ?? null); // lacks the`,
  and `end()`'s `case 'skip':` emits the pending commit before `break`.
  - [[ran]] `node --test dist/test/unit/miner*.test.js` → `not ok 13 - T-13-1m: …`, `not ok 14 - T-13-1n: …`, `# pass 47`, `# fail 2`
  - [[ran]] `node leak.mjs $S/resync/middleware/context-oracle/ctxoracle` → `[["2",["a","b"]],["4",["a"]]] [["2",7]]`
  - [[ran]] `PATH="$S/shim:$PATH" node run.mjs resync $S/repos/mid leakfix` → `"pairs":["a+b:3:9.820135849960186e+150"]`, one `{"commit":"481ac28d…","records":7,…}` fault and `{"expected":4,"read":3}`.

**Final verdict:** replace.

**Correction:**
- Keep T-13-1l as it is.
- Keep T-13-1n's point that a non-hex field is not a header. Make it assert
  that `two.txt` is credited to no commit, and bring its title and plan quote to
  the 40-or-64 rule of `55fe887`.
- Make T-13-1m expect one skipped run (one item, `records` 2) opened at the
  first malformed entry, with `good.txt` kept.
- In Step 13's parser text, state the rule. A malformed field at an entry
  position opens a skipped run to the next valid header. Nothing after it is
  credited to any commit. Entries read before it stay with their commit.
- Add the executed damaged-header-after-entries stream as a case that fails on
  the current code.

**Still at HEAD:** yes. The leak reproduces on the `HEAD` parser and through
real git into the store.

**Owner question:** none.

### E-6
**Ruling:** Both reviews say replace. The verdict is upheld, and each of the
second opinion's four additions is upheld. Three were re-executed here, and the
fourth is a derivation checked step by step.

1. *The floor criterion is the normal limit.* The weights are read only as the
   ratio `pair_weight / change_weight`. A subnormal loses relative precision:
   `2**-1073.5 / 2**-1073` evaluates to 0.5, where the true ratio is 0.707. So
   the first audit's "about 1.16 days" answers the wrong question (non-zero).
   The criterion is "normal", which gives 1.1999 days under this design. Ruling
   2's "about 1.79" is the normal-limit figure for its own layout. The B5c
   adjudication derived it as "5 years / `h` ≤ 1022". Neither figure needs 37.
2. *The floor is a relation with `miner.horizon_years`, not a constant.* The
   underflow floor is h ≥ 365.25·Y/(1022 + offset). The offset is 500 under this
   design and 0 under ruling 2. `tune` checks no relation on
   `miner.horizon_years`. Executed at `HEAD`: `tune` accepts
   `miner.horizon_years` = 200 at h = 37, and an in-horizon commit then stores
   weight 0 and a 0/0 pair, with no fault. Ruling 2's 1.79 days is the Y = 5
   instance of this relation. Stating the relation applies the ruling; it does
   not reopen it.
3. *A zero weight needs a read rule.* The horizon is judged per pass, so an
   incrementally extended store keeps commits older than Y years. Under ruling
   2's rescale, every advance of the epoch shrinks such a term. It reaches 0
   once (E − ts)/h exceeds 1074, about 5.3 years after the commit at h = 1.79
   days. A file whose every term has aged out then reads 0/0. The plan's reader
   gates on `pair_weight / change_weight(file) ≥ bar.confidence_floor`, and
   `NaN ≥ x` is false, so the pair drops out silently. The same 0/0 already
   occurs under this design, in the first audit's executed `refTs`-moves-back
   case and in item 2's case. The floor cannot cover it, so the correction must
   state a read rule. No reader exists at `HEAD` yet, so this is a plan gap, not
   a code defect.
4. *`refTs` is as untrusted as `%at`.* The design caps `ts` at `refTs` because
   `%at` is "author-controlled, untrusted repository content". But `refTs` is
   `<head>`'s `%ct`, which any commit sets as freely. Executed at `HEAD`: one
   tip commit with committer time 40000000000 horizon-excludes all four
   commits. The store ends with no files and no pairs, and writes no fault.

The first audit's six parts stand: keep the cap; the epoch is re-based only by a
full mine; the `> 1000` trigger; the unsourced 37; the silent underflow when
`refTs` moves back; the dropped clamp count.

**Evidence:**
- The design [[middleware/context-oracle/docs/architecture-phase-a.md@c31d87e:L1477-L1481]] "**Bound:** a weight must stay a finite, non-zero double. Each full mine sets the epoch to `refTs − 500·h` days (`schema_meta.weight_epoch`), and incremental passes keep it; a commit whose exponent `(ts − T0)/h` would exceed 1000 makes the pass a purged full re-mine, which re-bases." and [[middleware/context-oracle/docs/architecture-phase-a.md@c31d87e:L1484-L1484]] "`tune` still refuses `h` below 37 days."
- Ruling 2 [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B5-verification.md@HEAD:L106-L110]] "The root-cause design is a re-based epoch kept near `refTs`. When the epoch advances, stored sums are rescaled by the exact common factor 2^(−Δ/h). With whole half-lives that factor is a power of two. - It needs no re-mine and no calendar-derived floor on `h`. The only floor is underflow, h above about 1.79 days." and its derivation [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B5c-adjudication.md@HEAD:L51-L51]] "the only floor the mechanism itself needs is from underflow of the oldest in-horizon term (5 years / `h` ≤ 1022 for a normal double: `h` > 1.79 days)"
- Weights are read as a ratio [[middleware/context-oracle/docs/architecture-phase-a.md@0e51b99:L1494-L1494]] "`confidence(a→b) = pair_weight / change_weight(a)`; `support = pair_count`." and gated by comparison [[middleware/context-oracle/docs/plans/plan-phase-a.md@0e51b99:L4640-L4641]] "file's partners whose confidence `pair_weight / change_weight(file) ≥ bar.confidence_floor`"
- [[ran]] `node -e 'console.log(2**-1073.5 / 2**-1073, 2**-1000.5 / 2**-1000, 2**-1022, 2**-1074, 2**-1075)'` → `0.5 0.7071067811865475 2.2250738585072014e-308 5e-324 0`; [[ran]] `python3 -c "Y=5*365.25; print(Y/1522, Y/1574, Y/1022, Y/1074)"` → `1.1999014454664914 1.1602604828462515 1.7869373776908024 1.7004189944134078`; [[ran]] `node -e 'console.log(0/0 >= 0.3, (0/0) < 0.3)'` → `false false`.
- The floor derivation, step by step. Let d = 86400 s, h the half-life in days,
  and Y = `miner.horizon_years`. A horizon-included commit of a fresh pass has
  refTs − 365.25·Y·d ≤ ts ≤ refTs: the horizon rule below, the cap above.
  - Under this design, E = refTs − 500·h·d, so x = (ts − E)/(h·d) lies in
    [500 − 365.25·Y/h, 500]. 2^x is normal iff x ≥ −1022, that is
    h ≥ 365.25·Y/1522.
  - Under ruling 2, refTs − h·d < E ≤ refTs, so x lies in [−365.25·Y/h, 1),
    and 2^x is normal iff h ≥ 365.25·Y/1022.
  - At Y = 5 the two bounds are 1.1999 and 1.787 days (the arithmetic above).
- The only `h` relation `tune` checks, and none on the horizon [[middleware/context-oracle/ctxoracle/src/stores/dao/tuning.ts@0e51b99:L235-L237]] "if (!(halfLife >= 37)) { violated.push( `bar.recency_half_life_days (${halfLife}) must be at least 37, or the co-change weights overflow for commits dated up to 2100`"; the horizon is tunable [[middleware/context-oracle/docs/plans/plan-phase-a.md@55fe887:L2905-L2905]] "- `miner.max_transaction_entities` = `30`; `miner.horizon_years` = `5`;" and judged per pass [[middleware/context-oracle/docs/plans/plan-phase-a.md@55fe887:L3227-L3229]] "**The horizon is judged per pass, over the pass's range:** an incremental pass never ages out commits an earlier pass included"
- Item 2, executed. `tw.mjs` calls `checkTuningWrite` on a seeded global store:
  [[ran]] `node tw.mjs $S/HEAD/middleware/context-oracle/ctxoracle` → `miner.horizon_years 200 {"ok":true}`, `bar.recency_half_life_days 2 {"refused":…}`, `bar.recency_half_life_days 37 {"ok":true}`.
  Repository `hy`: a root commit at 1700000000 touches `old1` and `old2`. A tip
  written with `git hash-object -t commit -w`, author and committer time
  1700000000 + 190 × 31557600, touches `new1` and `new2`.
  [[ran]] `node run.mjs HEAD $S/repos/hy hy 37 200` → `"files":["new1:1:3.273390607896142e+150","new2:1:3.273390607896142e+150","old1:1:0","old2:1:0"]`, `"pairs":["new1+new2:1:3.273390607896142e+150","old1+old2:1:0"]`, `"excl":["null:2"]`, `"faults":[]`.
  [[ran]] `python3 -c "print(500-190*365.25/37)"` → `-1375.6081081081081`.
- Item 4, the reason for the cap [[middleware/context-oracle/docs/plans/plan-phase-a.md@55fe887:L3291-L3292]] "and `%at` is author-controlled, untrusted repository content;". `refTs` is read unchecked from `%ct` and bounds the horizon [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@0e51b99:L421-L422]] "const refTs = Number(gitOk(repoPath, ['log', '-1', '--no-show-signature', '--format=%ct', head])); const horizonTs = refTs - horizonYears * YEAR_DAYS * DAY_S;" and [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@0e51b99:L493-L493]] "const horizonExcluded = pos < firstInHorizon || c.ts < horizonTs;". git lets any committer set the date [[https://git-scm.com/docs/git-commit-tree]] "The GIT_AUTHOR_DATE and GIT_COMMITTER_DATE environment variables support the following date formats".
- Item 4, executed. Repository `far`: three ordinary commits (1700000001–1700000003,
  touching `a` and `b`), then a tip written with `git hash-object`, author time
  1700000004 and committer time 40000000000.
  [[ran]] `git log --format='%h %at %ct %s'` → `d61a1ca 1700000004 40000000000 far tip` above three ordinary rows;
  [[ran]] `node run.mjs HEAD $S/repos/far farct` → `{"seen":4,"files":[],"pairs":[],"meta":{…,"ref_ts":"40000000000","weight_epoch":"24232000000"},"excl":["horizon:4"],"faults":[]}`.
- The `ts` cap is at `HEAD` [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@0e51b99:L568-L568]] "const w = 2 ** ((Math.min(c.ts, refTs) - epoch) / hS);". The review's clamp count is missing from it: [[middleware/context-oracle/docs/reviews/2026-09-26-step-13-build-review.md@f39769a:L125-L125]] "Count the clamped commits in a fault detail."
- Fail-fast [[https://martinfowler.com/ieeeSoftware/failFast.pdf]] "The program continues working right after an error but fails in strange ways later on."

**Final verdict:** replace.

**Correction:**
- Keep the `ts` cap at `refTs`, and count the capped commits in a fault
  detail, as the review asked.
- Replace the full-mine-only epoch at `refTs − 500·h`, the `> 1000` re-mine
  trigger and the 37-day floor with ruling 2. The epoch is kept near `refTs` and
  advanced in whole half-lives. Stored sums are rescaled by the exact power of
  two. No re-mine is needed.
- State the underflow floor as a `checkTuningWrite` relation:
  `bar.recency_half_life_days` ≥ 365.25 × `miner.horizon_years` / 1022 (the
  normal-double limit). Refuse a write to either key that breaks it. This is
  about 1.79 days at the seeded 5 years.
- State a read rule for a zero `change_weight`. Either the pair carries no
  recency evidence and is reported as such, or terms that leave the normal range
  are pruned with a recorded count. Test it. The ratio must never be read as
  `NaN` and compared.
- State and test the case where `refTs` moves back (the first audit's executed
  case). Under ruling 2 that means rescaling in both directions.
- Treat `refTs` as untrusted. A tip whose `%ct` is later than the wall clock by
  more than a stated tolerance is recorded as a fault naming the commit and its
  `%ct`. The pass then writes nothing and leaves the watermark unchanged, so
  a planted date cannot silently empty the store. The wall clock serves only as this
  plausibility guard, so G19's determinism of the value is kept. Test it with
  the executed `far` repository.

**Still at HEAD:** yes, every part. `EPOCH_HALF_LIVES = 500`,
`MAX_EXPONENT = 1000` and the `≥ 37` relation are in the `HEAD` source. The
horizon-relation underflow and the far-future `%ct` exclusion reproduce on the
`HEAD` build. The zero-weight read rule has no reader at `HEAD`; it is a plan
gap.

**Owner question:** none.

### E-10
**Ruling:** The second opinion is upheld: keep → replace. The four `<head>`
substitutions and `--no-show-signature` on the `refTs` read are correct, as both
reviews agree. The first audit's reason for keeping is not: it said the
`--no-show-signature` addition "closes the same S1 leak on the one other `git
log` call". It closes only the signature channel. The `refTs` read that h11
specifies is exposed to `i18n.logOutputEncoding`, the same setting E-9 found in
the stream. Its `%ct` is not held to the plan's own m5 rule, "must match
`/^[0-9]+$/` before it is read as a number".

I correct one statement of the second opinion. It says the completeness fault
fires, "so the pass is not silent". That holds only when the range has commits.
With no new commit, the common case for a hook-triggered reindex, an
incremental pass under that setting ran here with this result:
- `ref_ts` = `NaN` is stored with no fault at all;
- the `revert_chain` landmines are rebuilt from a `NaN` horizon, and the two that
  existed are erased;
- the handler then reads `refTs` as `NaN` on every event.

The second opinion's other two points are upheld:
- m1 is pinned by no test. Two planted regressions, back to the symbolic
  `HEAD` in the range and in the `refTs` read, each pass all 49 miner tests at
  `HEAD`.
- h11's "read before the full/incremental decision below, which needs it" is
  true only because of E-6's `> 1000` trigger. It must be re-checked when E-6 is
  corrected.

**Evidence:**
- The read h11 specifies [[middleware/context-oracle/docs/plans/plan-phase-a.md@55fe887:L3221-L3223]] "**reference instant** `refTs` is `<head>`'s committer timestamp (`git log -1 --no-show-signature --format=%ct <head>`, read before the full/incremental decision below, which needs it), never the wall clock"; the plan's strict-number rule covers only the stream's author timestamp [[middleware/context-oracle/docs/plans/plan-phase-a.md@55fe887:L3184-L3185]] "The **author timestamp** field must match `/^[0-9]+$/` before it is read as a number (Step 13 build review m5:"
- git documents the setting and the flag [[https://git-scm.com/docs/git-config]] "Character encoding the commit messages are converted to when running git log and friends." and [[https://git-scm.com/docs/git-log]] "this option can be used to tell the command to re-code the commit log message in the encoding preferred by the user."
- The code reads it with `Number()` and writes it and the handler reads it [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@0e51b99:L421-L421]] "const refTs = Number(gitOk(repoPath, ['log', '-1', '--no-show-signature', '--format=%ct', head]));", [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@0e51b99:L629-L629]] "meta.set('ref_ts', String(refTs));", [[middleware/context-oracle/ctxoracle/src/hook/handler.ts@0e51b99:L131-L131]] "refTs: Number(meta.get('ref_ts') ?? 0),"; the landmines are rebuilt from the horizon derived from it [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@0e51b99:L620-L622]] "build('revert_chain', 'revert', horizonTs, 2); build('fix_chatter', 'fix', refTs - fixWindowDays * DAY_S, fixK); landmines.rebuildMinerKinds(rows);"
- The encoding on this call [[ran]] `git log -1 --no-show-signature --format=%ct HEAD | od -c | head -2` (repository `enc`, `i18n.logOutputEncoding UTF-16`) → `0000000 377 376   1  \0   7  \0   0  \0   0  \0   0  \0   0  \0   0  \0` / `0000020   3  \0   0  \0   0  \0  \n`; with `--encoding=UTF-8` → `0000000   1   7   0   0   0   0   0   2   0   0  \n` (on the same repository before its third commit).
- With a commit to mine, on the `HEAD` build. Repository `enc`: two commits
  mined, then a third commit and the UTF-16 setting.
  [[ran]] `KEEP=1 node run.mjs HEAD $S/repos/enc enc` → `"seen":0`, `"ref_ts":"NaN"`, faults `{"commit":null,"records":63,"first":"\\xff\\xfe\\x1e"}` and `{"expected":1,"read":0}`.
  A first mine under the setting: [[ran]] `node run.mjs HEAD $S/repos/enc encfull` → `"meta":{"mining_in_progress":"1","ref_ts":"NaN","weight_epoch":"NaN"}`, with the same two fault kinds.
- With no new commit, on the `HEAD` build: silent.
  - Repository `enc0`: two commits mined, then only the setting.
    [[ran]] `KEEP=1 node run.mjs HEAD $S/repos/enc0 enc0` → `{"seen":0,…,"meta":{"last_mined_commit":"754af5b","mining_in_progress":"0","ref_ts":"NaN",…},…,"faults":[]}`.
  - Repository `lm`: `c1`, `c2`, `git revert --no-edit HEAD` twice (`Revert "c2"`,
    `Reapply "c2"`). `lmq.mjs` prints the landmine counts and `ref_ts`.
    [[ran]] `node run.mjs HEAD $S/repos/lm lm; node lmq.mjs dbs/lm.p.db` → `"faults":[]`, `[{"kind":"revert_chain","n":2}] [{"value":"1700000000"}]`.
    Then `git config i18n.logOutputEncoding UTF-16` and
    [[ran]] `KEEP=1 node run.mjs HEAD $S/repos/lm lm; node lmq.mjs dbs/lm.p.db` → `"faults":[]`, `[] [{"value":"NaN"}]`.
- m1 is unpinned. The review [[middleware/context-oracle/docs/reviews/2026-09-26-step-13-build-review.md@f39769a:L168-L169]] "*Fix (code):* use the resolved `head` hash in all five places (snapshot consistency)."
  Planted on copies of the `HEAD` build:
  [[ran]] `python3 mut.py HEAD m1-range src/miner/cochange.js 'const range = full ? head : `${watermark}..${head}`;' 'const range = full ? "HEAD" : `${watermark}..HEAD`;' "dist/test/unit/miner*.test.js"` → `m1-range: exit=0 # pass 49 # fail 0`;
  [[ran]] `python3 mut.py HEAD m1-refts src/miner/cochange.js "'--format=%ct', head]" "'--format=%ct', 'HEAD']" "dist/test/unit/miner*.test.js"` → `m1-refts: exit=0 # pass 49 # fail 0`.
- The decision needs `refTs` only through the epoch trigger [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@0e51b99:L433-L433]] "if (watermark !== undefined && (storedEpoch === undefined || (refTs - Number(storedEpoch)) / hS > MAX_EXPONENT)) full = true;"

**Final verdict:** replace.

**Correction:**
- Keep the four `<head>` substitutions and `--no-show-signature` on the `refTs`
  read.
- Add `--encoding=UTF-8` to that read.
- Hold its `%ct` to `/^[0-9]+$/`. A value that fails is a fault, and the pass
  then writes nothing, including `ref_ts` and the landmine rebuild.
- Add a Step 13 case for m1: a `PATH` git shim commits between two of the
  pass's git calls, and the case asserts that `ref_ts`, the range, the stream
  and the watermark all name the resolved `<head>`.
- Add a case for the encoding setting with an empty range, which must not store
  `NaN` or erase landmines.
- Re-check "read before the full/incremental decision below, which needs it"
  when E-6's correction removes the trigger.

**Still at HEAD:** yes. The `HEAD` build stores `ref_ts` = `NaN` and erases the
landmines silently under the setting. Both m1 regressions pass the `HEAD` suite.

**Owner question:** none.

### E-13
**Ruling:** Both reviews say replace. The verdict is upheld, and I reproduced it
on the `HEAD` build. The completeness check is right and cheap. Its fallback,
"leave `last_mined_commit` where the last chunk put it", is the per-chunk
watermark that ruling 1 replaced. The fallback defeats the check whenever the
unreadable commit is not the newest of an incremental range. The last chunk
then ends at `<head>`, so the incomplete pass records the watermark at `HEAD`,
and the next pass mines nothing. AD-13's "an incomplete read is never recorded
as a complete one" is false as written.

The two reviews differ on the attribution fix; the second opinion is upheld.
The first audit asks to attribute the run "to the hash it carries (or `null`)".
After an entry, the parser cannot tell a damaged header from a damaged entry
(E-2). A field such as `X<c3>` carries a hash only for that one damage shape.
Reading a commit identity out of a field the parser has just judged malformed
is the guessed identity the plan's guard forbids.

The correct detail says where the run began: `after: <hash>`, the last valid
header before it. It does not assert `commit: <hash>`. Two runs keep `commit`,
because it is true for them: a run at stream start (`null`), and a malformed
timestamp, whose header was valid and whose hash is known.

With E-2's resynchronising rule, a run opened at an entry position is exactly
the case that gets `after`. With ruling 1, the check also holds when the drift
is permanent: each pass re-runs its range and faults again, and `historyStale`
("mined tip ≠ HEAD") reports it.

One further observation from the same runs: on a full pass under drift, the
last chunk also writes the watermark at `HEAD` while `mining_in_progress` stays
`'1'`. The set flag forces the next pass full, so nothing is lost there. It is
the same per-chunk write that ruling 1 removes.

**Evidence:**
- The rule [[middleware/context-oracle/docs/architecture-phase-a.md@21b8721:L1513-L1516]] "only when the stream delivered every commit the range count expected; otherwise it keeps the last chunk's watermark and records the shortfall as a fault, so an incomplete read is never recorded as a complete one" and [[middleware/context-oracle/docs/plans/plan-phase-a.md@55fe887:L3418-L3419]] "leaves `last_mined_commit` where the last chunk put it (absent or unchanged when no chunk was written)"
- The code at `HEAD` writes the watermark per chunk [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@0e51b99:L593-L593]] "meta.set('last_mined_commit', (pending[next - 1] as PendingCommit).hash);" and in the final transaction only when complete [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@0e51b99:L623-L626]] "if (complete) { // The HEAD mined to, including a merge HEAD no chunk can name (AD-13) — // only when the stream yielded every commit of the range (M2). meta.set('last_mined_commit', head);"
- Ruling 1 [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B5-verification.md@HEAD:L96-L101]] "The watermark is the `HEAD` resolved once when the pass starts, merge or not. It is keyed to the mined ref (batch 4) and written only in the pass's final transaction. - The next range is `<tip>..<new HEAD>`, or `HEAD --not <tips>`. - A crashed pass re-runs its recorded range and skips hashes already in `commits`."
- The attribution field as the plan defines it [[middleware/context-oracle/docs/plans/plan-phase-a.md@e70536e:L3207-L3208]] "detail `{commit, records, first}`, with `commit` the record's hash (`null` when no valid header precedes it)," — the parser's `commit` is whatever commit is open [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@0e51b99:L171-L171]] "this.onMalformed({ commit: this.cur?.hash ?? null, detail: escapeBytes(record.subarray(0, DETAIL_BYTES)), records: 1 });"
- My run on the `HEAD` build, repository `mid` (`c1` `11c954e`, `c2` `481ac28`,
  `c3` `4a6484d` touching `c` and `d`, `c4` `0cded7e`; the others touch `a` and
  `b`), with the E-2 shim that damages `c3`'s header.
  - Mined with the checkout detached at `c1`: [[ran]] `node run.mjs HEAD $S/repos/mid wm` → `"seen":1`, `"last_mined_commit":"11c954e"`.
  - `master` checked out, one incremental pass through the shim: [[ran]] `PATH="$S/shim:$PATH" KEEP=1 node run.mjs HEAD $S/repos/mid wm` → `"seen":2`, `"files":["a:3:…","b:3:…","d:1:…"]`, `"last_mined_commit":"0cded7e","mining_in_progress":"0"`, faults `{"commit":"481ac28d…","records":6,"first":"X4a6484d…"}` and `{"expected":3,"read":2}`.
  - A plain pass: [[ran]] `KEEP=1 node run.mjs HEAD $S/repos/mid wm` → `"seen":0`, `a:3`, watermark `0cded7e` = `HEAD`.
  - So `c3` is lost for good (`a`'s `change_count` is 3 of 4), and the fault's
    `commit` names `c2`. E-2's fabricated pairs `a+d` and `b+d` stay in the
    store.
- The full-pass observation: E-2's run `PATH="$S/shim:$PATH" node run.mjs HEAD $S/repos/mid leak` → `"last_mined_commit":"0cded7e","mining_in_progress":"1"`.

**Final verdict:** replace.

**Correction:**
- Keep the completeness check and its `{expected, read}` fault.
- Replace "keeps the last chunk's watermark" with ruling 1. No chunk writes the
  watermark. An incomplete pass leaves the previous tip and its recorded range,
  and the next pass re-runs that range with the already-mined skip.
- For a skipped run opened at an entry position, record the run's position as
  `after: <last valid header>`, not `commit`. Keep `commit` for a run at stream
  start (`null`) and for a malformed timestamp, whose header was valid. Update
  Step 6's detail-shape line to match.
- Add the middle-commit incremental case to T-13-6e.

**Still at HEAD:** yes. Both the watermark loss and the attribution reproduce on
the `HEAD` build.

**Owner question:** none.

### E-21
**Ruling:** Both reviews say replace. The verdict is upheld, and the second
opinion's sharpening is upheld on my own probe. The coordinator asked for the
root cause and the correct fix; both follow.

*Root cause.* T-13-5b's append role writes single-row transactions back to
back, with no gap. SQLite's busy timeout is a sleep-and-retry handler with no
queue, so a waiter attempts the lock only at fixed points. Batch 3 settled
these: 0, 1, 3, 8, 18, 33, 53, 78 and 100 ms within 100 ms. A writer that
re-takes the lock within microseconds can make every attempt miss.

*The product has no such writer.* A handler performs one write group per hook
process, and the miner yields at least 25 ms between chunks (batch 3). Against
a writer that leaves even 1 ms, a 100 ms waiter never failed in 40 of 40
attempts on either probe.

*The 5,000 ms wait does not fix starvation.* It outlasts a bounded burst. The
5,000 ms waiter waited 1,434 ms, until the 1.5 s burst ended. A 2,000 ms waiter
against a 4 s no-gap burst was starved for its full 2,006 ms.

So the recorded reason, a pass that "would abort whenever a live session's
handler held the lock for one short write group", is false. One short write
group cannot outlast a 100 ms waiter with its retry.

*Correct fix.* The fix sits on the writer's side, the side batch 3 already fixed
for the miner. T-13-5b's append role must model a writer the product has. The
off-path wait is then a separate engineering choice. It is justified by cost:
an aborted full pass leaves `mining_in_progress` at `'1'`, and the next pass
purges and starts again. Its value must be derived from the longest bounded
write activity of the handlers AD-26 allows to run at once; 5,000 has no
derivation.

Batch 3's rulings are untouched. The handler keeps 100 ms and one retry, and a
waiting connection holds no lock. The split sentence in Step 13's "What
changes" is still broken at `HEAD`.

**Evidence:**
- The recorded reason and the concurrency it must be derived from [[middleware/context-oracle/docs/architecture-phase-a.md@876afa3:L2532-L2533]] "Hooks can run in parallel (multiple matching hooks; overlapping events), so multiple handler processes may touch one store concurrently:" and [[middleware/context-oracle/docs/architecture-phase-a.md@876afa3:L2536-L2540]] "**Off the event path the wait is long:** the miner, the indexer, and the CLI verbs open the store with `busy_timeout` 5,000 ms, because nothing there has a latency budget to protect, and a background pass that gave up after 200 ms would abort whenever a live session's handler held the lock for one short write group."
- The busy handler's schedule (settled) [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B3-verification.md@HEAD:L46-L48]] "Within the design's 100 ms `busy_timeout` it is true: lock attempts fall at 0, 1, 3, 8, 18, 33, 53, 78 and 100 ms, and the 50 ms steps begin only after 103 ms." and the contract [[https://www.sqlite.org/c3ref/busy_timeout.html]] "The handler will sleep multiple times until at least \"ms\" milliseconds of sleeping have accumulated."
- The starving writer is the test's [[middleware/context-oracle/ctxoracle/test/unit/miner_chunks_worker.ts@821c835:L92-L94]] "for (let i = 0; i < Number(countArg); i++) { try { store.transaction(() => oa.append({ session: 'T-13-5', consumer: 'main', tool: 'Read', path: `p${i}.txt`, outcome: 'ok', ts: i }));"
- My probe (Node 22.22.2 `node:sqlite`, WAL; scripts in the scratchpad folder
  `b7badj/lock/`). `hammer.mjs` runs single-row `BEGIN IMMEDIATE`/insert/`COMMIT`
  transactions with a gap of `g` ms. `waiter.mjs` makes 40 single-row write
  transactions 20 ms apart at `busy_timeout` `w`.
  - With a 1.5 s burst [[ran]] `./run.sh <g> <w>`:
    - g 0, w 100 → `{"busyMs":100,"ok":30,"busy":10,"maxWaitMs":102}`
    - g 0, w 5000 → `{"busyMs":5000,"ok":40,"busy":0,"maxWaitMs":1434}`
    - g 1, w 100 → `{"busyMs":100,"ok":40,"busy":0,"maxWaitMs":35}`
    - g 1, w 5000 → `{"busyMs":5000,"ok":40,"busy":0,"maxWaitMs":8}`
    - g 25, w 100 → `{"busyMs":100,"ok":40,"busy":0,"maxWaitMs":7}`
    - g 25, w 5000 → `{"busyMs":5000,"ok":40,"busy":0,"maxWaitMs":4}`
  - With a 4 s burst [[ran]] `./run4.sh 0 2000` → `{"busyMs":2000,"ok":39,"busy":1,"maxWaitMs":2006}`.
- Still at `HEAD`: the split sentence [[middleware/context-oracle/docs/plans/plan-phase-a.md@0e51b99:L3155-L3157]] "**What changes.** Create `src/miner/cochange.ts` exposing The caller opens `store` with `busyTimeoutMs: 5000` (Step 3; AD-26's off-path wait)."; the worker's reliance on the 5 s wait [[middleware/context-oracle/ctxoracle/test/unit/miner_chunks_worker.ts@0e51b99:L61-L62]] "// Off the event path, the miner's caller opens with busyTimeoutMs 5000 (Step 3; T-13-5b). const store = openStore(projectDb, { busyTimeoutMs: 5000 });"

**Final verdict:** replace.

**Correction:**
- Keep the `busyTimeoutMs` option and the event path's 100 ms plus one retry.
- Correct AD-26's and Step 3's reason: a no-gap writer starves SQLite's
  sleeping, unordered busy handler, and one short write group does not.
- Make T-13-5b's append role model the product's writers: one write group per
  process, or gaps of at least 25 ms. Stop relying on the worker's 5 s wait to
  pass it.
- Derive the off-path value from the concurrent handlers' bounded write
  activity, with the aborted-full-pass cost as its reason, or drop it to the
  default if the derivation shows 100 ms plus a retry suffices.
- Repair Step 13's split "What changes" sentence.

**Still at HEAD:** yes. The worker opens with 5,000 ms, the sentence is split,
and the reason is unchanged.

**Owner question:** none.

### E-23
**Ruling:** The second opinion is upheld: keep → replace. The first audit is
right that the sentence reconciles T-13-1m with T-13-1r and matches the code.
But the split it settles is the defective one. "One item per malformed entry
inside a commit whose header is valid" means parsing continues after a
malformed entry, and that is the rule that credits a damaged commit's entries to
the commit before it (E-2, executed on all three builds and through real git).
The first audit filed the symptom it saw, `commit` naming `c2`, as a grouping
defect under E-13. The cause is this parser rule.

The framing-safe split is one item per run. Any malformed field, at a header
position or an entry position, opens a run to the next valid header. It keeps
the one-fault-per-commit grouping and the entries read before the fault, and it
credits nothing after it. Planted, that rule removes the leak, and T-13-1m and
T-13-1n are the only tests that pin the old one.

**Evidence:**
- The sentence [[middleware/context-oracle/docs/plans/plan-phase-a.md@e70536e:L3214-L3218]] "**What the parser returns vs what is recorded:** `parseNumstatZ`'s `malformed` list holds one item per malformed entry inside a commit whose header is valid (`T-13-1m`: two bad entries, two items) and **one** item for a whole run of fields skipped after a field where a header was expected (`T-13-1r`);"
- The guard it conflicts with [[middleware/context-oracle/docs/plans/plan-phase-a.md@e70536e:L11111-L11113]] "each of which must be recorded as `miner_unparsed_numstat` and contribute no pair (never a partial or guessed identity): the defensive guard against a future git output-format drift;"
- The same commit's wording that the correction must disambiguate [[middleware/context-oracle/docs/plans/plan-phase-a.md@e70536e:L3203-L3207]] "A leading field that is not a valid header, a malformed timestamp, an entry lacking the `<added>\t<deleted>\t` shape, or a rename marker missing its two identity fields makes its record malformed: it contributes nothing, and the pass records **one** `miner_unparsed_numstat` fault per malformed commit record"
- The leak and the fix, executed (E-2's evidence): on the `HEAD` parser
  [[ran]] `node leak.mjs $S/HEAD/middleware/context-oracle/ctxoracle` → `[["2",["a","b","d"]],["4",["a"]]] …`;
  with the resynchronising rule [[ran]] `node leak.mjs $S/resync/middleware/context-oracle/ctxoracle` → `[["2",["a","b"]],["4",["a"]]] [["2",7]]`;
  the suite against it → `not ok 13 - T-13-1m`, `not ok 14 - T-13-1n`, `# pass 47`, `# fail 2`.
- The rule at `HEAD` [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@0e51b99:L66-L71]] "A record the parser could not read; reported as `miner_unparsed_numstat`, * never guessed. One item per malformed entry inside a commit whose header is * valid, and one item for a whole run of fields skipped after a field where a * header was expected (plan Step 13, m3); the pass groups items by commit into * one fault per commit."

**Final verdict:** replace.

**Correction:** State the parser/fault split as one item per skipped run. Any
malformed field, at a header position or an entry position, opens a run to the
next valid header. Nothing after it is credited to any commit. Entries read
before it stay with their commit, and that must be said explicitly, because
"makes its record malformed: it contributes nothing" can be read as the whole
commit. The pass groups runs into one fault each, with the attribution E-13's
correction gives (`after` for a run opened at an entry position). Change
T-13-1m and T-13-1n to match (E-2).

**Still at HEAD:** yes. The `HEAD` parser and its doc comment implement the
per-entry split.

**Owner question:** none.

### E-24
**Ruling:** Both reviews say replace. The verdict is upheld, and I executed it
at `HEAD`. When the hook's detached reindex runs and the miner's git stream
fails:
- the child exits 1;
- the store gains no fault;
- the diagnostics folder stays empty;
- the stderr tail goes only to the child's stderr, which is `'ignore'`.

"The error — which the calling verb or the detached reindex reports" is false
for the detached reindex.

The two reviews differ on the fix; the second opinion's ordering is upheld. The
root cause is that the detached reindex has no error channel at all. The `index`
verb has `try … finally` with no `catch`, and the dispatcher's only report is
stderr. So a catch at the verb's entry that records any thrown error as a fault
closes the gap for every background failure, not only the miner's git reads.
The fault carries the escaped, bounded stderr tail when the error is a git
failure. After recording, the verb still exits non-zero (fail-fast: record and
fail, never continue).

A git-failure code in the miner alone, the first audit's first alternative,
would leave the indexer's own throws on that path equally silent. The first
audit named the general catch only as its second alternative.

**Evidence:**
- The sentence [[middleware/context-oracle/docs/plans/plan-phase-a.md@6d6f21d:L3173-L3176]] "rejects the pass with an error whose message carries that tail (a git failure has no fault code of its own, so the error — which the calling verb or the detached reindex reports — is where the tail goes; builder's stop report, 2026-09-26)."
- The review's finding [[middleware/context-oracle/docs/reviews/2026-09-26-step-13-build-review.md@f39769a:L173-L175]] "Under the hook's detached reindex (`stdio: 'ignore'`, `src/hook/handler.ts:164`) the reason is lost entirely. *Fix (plan):* pipe stderr, keep its first bounded bytes, and put them in the error or a fault."
- The path at `HEAD`:
  - the hook spawns the reindex detached [[middleware/context-oracle/ctxoracle/src/hook/handler.ts@0e51b99:L164-L164]] "oracleSpawn(process.execPath, [dispatch, 'index'], { cwd: repoPath, detached: true }).unref();"
  - a detached child's stdio is discarded [[middleware/context-oracle/ctxoracle/src/util/spawn.ts@0e51b99:L86-L89]] "detached: opts.detached === true, stdio: opts.detached === true ? 'ignore'"
  - the miner is awaited with no catch [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@0e51b99:L1029-L1030]] "const mine = walk.mode === 'git' ? await mineCochange(store, repoPath, { tuning: t, diagnosticsDir: opts.diagnosticsDir, full: opts.full }) : null;"
  - the verb has only a `finally` [[middleware/context-oracle/ctxoracle/src/cli/index.ts@0e51b99:L42-L45]] "return 0; } finally { r.project.close(); r.global.close();"
  - the dispatcher's only report is stderr [[middleware/context-oracle/ctxoracle/src/cli/dispatch.ts@0e51b99:L44-L46]] "(e: unknown) => { process.stderr.write(`ctxoracle: ${String(e)}\n`); process.exit(1);"
- Executed on the `HEAD` build. Repository `det` was initialized with
  `CTXORACLE_HOME=$S/home24` (`init` → `1 commits mined`), then a second commit
  was made. A `PATH` shim makes the `--numstat` call print
  `fatal: planted stream failure` and exit 128.
  - The reindex spawned as the handler spawns it (detached, `stdio: 'ignore'`):
    [[ran]] `PATH="$S/shim24:$PATH" node -e "const {spawn}=require('child_process'); const c=spawn(process.execPath,['$D','index'],{cwd:'$R',detached:true,stdio:'ignore'}); c.on('exit',(code)=>console.log('child exit',code));"` (`$D` the `HEAD` build's `dist/src/cli/dispatch.js`, `$R` the repository) → `child exit 1`.
  - The same verb in the foreground: [[ran]] `PATH="$S/shim24:$PATH" node <dispatch.js> index` → `ctxoracle: Error: git log --no-show-signature --root --no-textconv --no-ext-diff --no-merges -M -z --numstat --reverse --format=%x1e%H%x00%at%x00%s%x00%b%x00 0710a95f3d978ab739b3f0731c8be581c21780db..a70ea50dbfb8499f27494e1d7d7c0f3b239350c1 exited 128; stderr: fatal: planted stream failure`, exit 1.
  - [[ran]] `SELECT code, detail_json FROM faults` on `home24/projects/1354102b1ca7/store.db` → `[]`; `ls` of its `diagnostics/` → empty.
- Fail-fast [[https://martinfowler.com/ieeeSoftware/failFast.pdf]] "The program continues working right after an error but fails in strange ways later on."

**Final verdict:** replace.

**Correction:**
- Keep the tail in the error.
- Give the `index` verb an error channel. A `catch` at its entry records any
  thrown error as a fault, with the escaped, 2 KB-bounded stderr tail when it is
  a git failure, then rethrows so the exit stays non-zero. That needs one new
  fault code in Step 6's list.
- Remove the false "or the detached reindex reports" clause.
- Add a case that runs the detached reindex against a failing git and asserts
  the fault.

**Still at HEAD:** yes. The detached run records nothing.

**Owner question:** none.

## Off-by-one cross-references in the first audit

The first audit is a review file and is not edited (project `CLAUDE.md`: written
once, never edited). Its cross-references are corrected here. The second
opinion found five. I read every `E-n` reference in the first audit and found
two more, both pointing the common-epoch comparison at E-24 instead of E-25.

- The m2 narrowing to error-only is E-24, not E-23:
  - E-1 [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B7b.md@4c292b8:L42-L42]] "then narrowed to error-only by `6d6f21d` h1 (E-23)"
  - E-9 [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B7b.md@4c292b8:L175-L175]] "`6d6f21d` h1 later removed the fault half (E-23)."
- The parser/fault split is E-23, not E-22:
  - E-2 [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B7b.md@4c292b8:L62-L62]] "records the parser/fault split these assertions rely on (E-22)."
  - E-11 [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B7b.md@4c292b8:L212-L212]] "`e70536e` h1 (E-22) states the parser/fault split this relies on;"
  - E-17 [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B7b.md@4c292b8:L302-L302]] "states the parser-item vs fault split these clauses rely on (E-22)."
- Found here, missed by the second opinion: the common-epoch comparison is
  E-25, not E-24:
  - E-3 [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B7b.md@4c292b8:L78-L78]] "`6bbda1d` changed the final comparison to a common epoch (E-24)"
  - E-6 [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B7b.md@4c292b8:L128-L128]] "`6d6f21d`'s common-epoch comparisons (E-24) stay valid under ruling 2."
- The file is unchanged since that commit:
  [[ran]] `git diff --stat 4c292b8 HEAD -- middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B7b.md` → (empty).

None of these changes a verdict. Every other `E-n` reference in the first
audit points at the entry it names.

## Entries not re-ruled

These entries were neither second-opinioned nor changed by a verified fact
here. The first audit's verdict stands, and both reviews agree wherever the
second opinion judged the entry.

- Judged by both, agreed keep, no new defect: E-4, E-8, E-12, E-14, E-15, E-16,
  E-17, E-18, E-20, E-22, E-25. The second opinion's added points in E-4 (order
  pinned by T-13-4a–c, not T-13-4e), E-8 (the stated reason for not reading the
  object format), E-12 (the whole pass costs about 262 bytes per commit) and
  E-18 (`--no-textconv` and `--no-ext-diff` are equivalent mutants) refine the
  reasoning and change no verdict.
  - Consequence for E-14: when E-13's correction adds the `after` field, Step
    6's detail-shape line changes with it. The line was true at `821c835`.
- Judged by the first audit only, replace stands: E-1, E-3, E-5, E-7, E-9, E-11,
  E-19.
  - Consequence for E-7: T-13-2a gains the cases E-6's correction adds (the
    horizon relation, the zero-weight read rule, the far-future `%ct`).
  - Consequence for E-9: its `--encoding=UTF-8` applies to the `refTs` read
    too (E-10).
  - Consequence for E-19: T-13-6e's middle-commit case is the one E-13 executes
    here.

## Summary

| Entry | First audit | Second opinion | Final verdict | Ruled here |
|---|---|---|---|---|
| E-1 | replace | — | replace | no |
| E-2 | keep | replace | replace | yes |
| E-3 | replace | — | replace | no |
| E-4 | keep | keep | keep | no |
| E-5 | replace | — | replace | no |
| E-6 | replace | replace | replace | yes |
| E-7 | replace | — | replace | no |
| E-8 | keep | keep | keep | no |
| E-9 | replace | — | replace | no |
| E-10 | keep | replace | replace | yes |
| E-11 | replace | — | replace | no |
| E-12 | keep | keep | keep | no |
| E-13 | replace | replace | replace | yes |
| E-14 | keep | keep | keep | no |
| E-15 | keep | keep | keep | no |
| E-16 | keep | keep | keep | no |
| E-17 | keep | keep | keep | no |
| E-18 | keep | keep | keep | no |
| E-19 | replace | — | replace | no |
| E-20 | keep | keep | keep | no |
| E-21 | replace | replace | replace | yes |
| E-22 | keep | keep | keep | no |
| E-23 | keep | replace | replace | yes |
| E-24 | replace | replace | replace | yes |
| E-25 | keep | keep | keep | no |

Counts, recounted from the sections and the table above:
- Ruled here: 7 entries (E-2, E-6, E-10, E-13, E-21, E-23, E-24), all replace.
- Verdicts changed from the first audit: 3, keep → replace (E-2, E-10, E-23).
- Final verdicts across all 25 entries: keep 11 (E-4, E-8, E-12, E-14, E-15,
  E-16, E-17, E-18, E-20, E-22, E-25); replace 14 (E-1, E-2, E-3, E-5, E-6,
  E-7, E-9, E-10, E-11, E-13, E-19, E-21, E-23, E-24); remove 0;
  undetermined 0.
- Owner questions: none.
- Still at `HEAD`, for every defect ruled here: yes.
