# Branch audit — batch 7, part c (the Step 13 fixes and the "built and reviewed" record): second opinion

This file is the second opinion on the first audit
`2026-09-26-branch-audit-B7c.md` (E-1 … E-18) of commits `6bbda1d` and
`7800246`. The author wrote neither the changes nor the first audit. It judges
the thirteen entries assigned: the keeps E-2, E-3, E-4, E-6, E-7, E-8, E-9, E-13,
E-14 and the replaces E-1, E-5, E-15, E-16. The test applied is the auditor brief
`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/BRIEF.md`.
Settled and not re-litigated: the B1–B6 verification files and the B7a
adjudication. Batch 5 rulings 1 (watermark) and 2 (recency) govern. Batch 4: a
git exit 128 is a git fault, with no purge. Batch 3: a ≥ 25 ms inter-chunk
yield, and the event handler never waits. The B7b first audit and second opinion
are cited as provisional.

**How the work was done.**
- Own scratch extractions under the scratchpad folder `b7cso/`:
  `git archive <commit> middleware/context-oracle/ctxoracle | tar -x`, with this
  checkout's `node_modules` symlinked and `npx tsc -p tsconfig.json` run. Builds:
  `6bbda1d`, `6d6f21d` (the pre-fix source), `57bdd4a`, and `HEAD` (`a4264e8`).
- Baselines [[ran]] `node --test dist/test/unit/miner*.test.js` → `6bbda1d`: `# tests 48 # pass 48 # fail 0`; `HEAD`: `# tests 49 # pass 49 # fail 0`.
- `b7cso/mut.sh <build> <name> <dist file> <sed> <tests…>` copies a built tree,
  applies one `sed` to one compiled file (refusing a no-op), and runs the named
  tests. Copied trees fail four build-environment cases (T-1-1, T-1-2a, T-1-2b,
  T-1-2c) whatever the mutant is. A null mutant calibrates this:
  [[ran]] `./mut.sh 6bbda1d nullmut src/cli/context.js '1s/^/\/\/ null mutant\n/' "dist/test/unit/*.test.js" "dist/test/conventions/*.test.js"` → `nullmut: exit=1 # pass 209 # fail 4`, the four T-1 cases only.
  So in whole-suite runs, "`# pass 209 # fail 4`" with only those four failures
  means the mutant survived.
- `b7cso/drv.mjs <build> <repo> <db-prefix> [fresh=1] [h=<days>] [dump=1] [ex=1]`
  runs one `mineCochange` pass into seeded stores. It prints the result, the
  error if any, the watermark (`wm`), `mining_in_progress` (`mip`),
  `weight_epoch`, `ref_ts`, the rows, and the fault rows.
- A `PATH` git shim, `b7cso/shim/git`, runs the real git. For the `log …
  --numstat` call only, it rewrites the `0x1e` before chosen hashes to `X`
  (`CORRUPT=<hash prefix>`) or every TAB to a space (`TABS=1`).
- Throwaway repositories were made under `b7cso/repos/`, with `GIT_DIR` and
  `GIT_WORK_TREE` unset and `GIT_CONFIG_GLOBAL`/`GIT_CONFIG_SYSTEM` set to
  `/dev/null`. Malformed commit objects were written with `git hash-object -t
  commit -w --stdin --literally`.
- A scratch clone of this checkout was used for the real-repository run:
  `git clone -q --no-checkout file:///home/user/agent-armory b7cso/aa`, then a
  detached checkout at `277b0a2` inside the clone.
- Tool versions: git 2.43.0, Node v22.22.2. Web sources were fetched with `curl`.
  This repository was not checked out, modified or committed, and no other
  agent's tree was changed. The first auditor's repository `b7c/repos/tc` was
  only read (`git log`).

### E-1
**Agree/Disagree:**
- Verdict: **agree**, replace.
- Reasoning: agree in substance, with one fact that does not reproduce, two
  items that are sharper than stated, and two defects in the miner rewrite that
  the first audit did not reproduce.
  1. **Not reproduced: the `--no-textconv` byte change.** On the first auditor's
     own repository, the bytes change because of `diff.foo.binary=false`. Adding
     `--no-textconv` does not restore the plain output. So "`--no-textconv` is a
     real pin" and "`--no-textconv` is unpinned by any test" are not
     established. The `notextconv` survivor is equivalent on every input
     executed. Keeping the flag is harmless, but the test item built on that
     fact is dropped. The S1 class is still open through
     `i18n.logOutputEncoding` (reproduced).
  2. **Sharper: the `refTs` read.** An empty `%ct` is not `NaN`. `Number('')`
     is `0`, so the pass completes silently. `ref_ts` is `0`, every commit is
     capped to `0`, and every weight is the same 2^500. Recency is erased, and
     no fault is recorded. git prints an empty `%ct` for a commit whose
     committer date is malformed.
  3. **Sharper: M2 on a full pass.** The "never claims `HEAD`" failure is not
     limited to incremental passes. A full pass whose unreadable commit is not
     the newest ends with `last_mined_commit` = `HEAD` and
     `mining_in_progress` = `'1'`. No data is lost: `mining_in_progress` forces
     a re-mine. But the watermark claims `HEAD`, which T-13-6e's own title
     denies. Ruling 1's "mined tip ≠ `HEAD`" staleness test would read such a
     store as current.
  4. **New defect: no terminal state for a commit that stays unreadable.** git
     prints an empty `%at` for a commit object whose author date is malformed
     (`fsck` class `badDate`). The m5 check rightly refuses it. The
     completeness check then fails on every pass. On a full pass
     `mining_in_progress` stays `'1'`, so every later pass is again a purged
     full re-mine. Two more faults are written each time, and the pass never
     completes. The review's premise for m5, "git never emits these", is false
     for `''`.
  5. **New defect: m5 accepts digit strings the store cannot hold.** A
     20-digit author date (`fsck` class `badDateOverflow`, which git prints in
     `%at`) passes `/^[0-9]+$/`. `Number` gives `1e20`, and the STRICT
     `commits.ts INTEGER` insert throws. Every pass then throws before
     anything is mined, leaving `mining_in_progress` `'1'` and no fault row.
     Under the detached reindex the error reaches no one (B7b E-24,
     provisional).
- The first audit's other executed items reproduce exactly on both builds:
  - the middle-commit loss with the watermark at `HEAD`, and the fault
    attributed to `c2`;
  - the TAB drift, which completes with nothing mined;
  - `NaN` under `i18n.logOutputEncoding=UTF-16`;
  - zero weights when `refTs` moves back;
  - the surviving mutants `symhead`, `noepochundef`, `nostderrtail` and
    `nogroup`;
  - the missing ≥ 25 ms yield (coordinator-verified: no `setTimeout`).
- **Fixed at `HEAD`:** only the inherited `GIT_DIR` (`gitChildEnv()`). Every other
  item above reproduces on the `HEAD` build.

**Evidence:**
- The m5 check and its stated reason [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@6bbda1d:L92-L95]] "/** `/^[0-9]+$/` over the field's bytes (m5: `Number` would accept '', ' 12', '1e3', '0x10'). */" and the unbounded conversion [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@6bbda1d:L211-L211]] "(this.cur as ParsedCommit).ts = Number(f.toString('latin1'));"
- The review's premise [[middleware/context-oracle/docs/reviews/2026-09-26-step-13-build-review.md@f39769a:L194-L194]] "git never emits these."
- The store column [[middleware/context-oracle/ctxoracle/src/stores/migrations/001_phase_a_project.sql@6bbda1d:L82-L84]] "CREATE TABLE commits(hash TEXT PRIMARY KEY, ts INTEGER NOT NULL,"
- git's own classes for such objects [[https://git-scm.com/docs/git-fsck]] "Invalid date format in an author/committer line." and [[https://git-scm.com/docs/git-fsck]] "Invalid date value in an author/committer line."
- Repository `bd`: a normal root; four children written with author dates `-100 +0000`, empty, `abc +0000` and `99999999999999999999 +0000`; then a normal commit.
  - [[ran]] `git log --format='%h [%at] %s'` → `e55cd0f [99999999999999999999] bad date […]`, `bb831bc [] bad date [abc +0000]`, `2c42e65 [] bad date []`, `66dac8c [] bad date [-100 +0000]`.
  - [[ran]] `git fsck` → `badDate: invalid author/committer line - bad date` (three commits) and `badDateOverflow: invalid author/committer line - date causes integer overflow`.
- Repository `bdempty` (root, one `abc +0000` child, one normal child), three passes per build [[ran]] `node drv.mjs <build> repos/bdempty db/bdempty-<build> fresh=1`, then twice without `fresh` → on `6bbda1d` and `HEAD` alike, each pass `{'commitsSeen': 2, 'included': 2, …} err= None wm= 4979d1c mip= 1 commits= 2`, faults `2`, `4`, `6`. `4979d1c` is `HEAD`. Every pass is a full purged re-mine, and `mining_in_progress` never clears.
- Repository `bdover` (root, one `99999999999999999999 +0000` child, one normal child), three passes per build [[ran]] `node drv.mjs <build> repos/bdover db/bdover-<build> fresh=1`, then twice more → on both builds, each pass `None err= cannot store REAL value in INTEGER column commits.ts wm= None mip= 1 commits= 0 faults= 0`.
- The `refTs` read [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@6bbda1d:L419-L419]] "const refTs = Number(gitOk(repoPath, ['log', '-1', '--no-show-signature', '--format=%ct', head]));"
- Repository `bdhead`: three normal commits, then `HEAD` written with committer `abc +0000`.
  - [[ran]] `git log -1 --format=%ct HEAD | od -c` → `0000000  \n` (empty).
  - [[ran]] `node drv.mjs <build> repos/bdhead db/bdhead-<build> fresh=1 dump=1` → on both builds `"wm":"36f7912","mip":"0","epoch":"-15768000000","ref_ts":"0"`, files `{"path":"a","c":4,"w":1.3093562431584567e+151}` (4 × 2^500), `{"path":"c","c":1,"w":3.273390607896142e+150}` (2^500), `"faults":[]`.
- M2 on a full pass: repository `mid` (`c1`…`c4` = `476f67d 9c3610a 8ca5892 c0a153f`, each touching `a` and `b`) [[ran]] `PATH="$S/shim:$PATH" CORRUPT=8ca5892 node drv.mjs <build> repos/mid db/midfull-<build> fresh=1` → on both builds `"commitsSeen":3 … "wm":"c0a153f","mip":"1"`. `c0a153f` is `HEAD`. The test that claims otherwise [[middleware/context-oracle/ctxoracle/test/unit/miner_git_env.test.ts@6bbda1d:L295-L295]] "test('T-13-6e: a stream that yields fewer commits than the range holds never claims HEAD', async () => {"
- M2 incremental, reproduced: `mid` mined detached at `c1`, then `main` through the shim with `c3` corrupted, then a plain pass [[ran]] → on both builds, second pass `"commitsSeen":2 … "wm":"c0a153f","mip":"0"` with fault `{"commit":"9c3610ae…","records":6,"first":"X8ca5892a…"}` (attributed to `c2`) and `{"expected":3,"read":2}`; third pass `"commitsSeen":0`, commits `476f67d`, `9c3610a`, `c0a153f` only. `c3` is lost.
- TAB drift, reproduced [[ran]] `PATH="$S/shim:$PATH" TABS=1 node drv.mjs <build> repos/tabs db/tabs-<build> fresh=1` → on both builds `"commitsSeen":4,"included":4 … "wm":"c0a153f","mip":"0" … "nFiles":0,"nPairs":0`, four per-commit faults, and no `{expected, read}` fault.
- Encoding, reproduced (`i18n.logOutputEncoding UTF-16` on a copy of `mid`) [[ran]] → on both builds `"commitsSeen":0 … "mip":"1","epoch":"NaN","ref_ts":"NaN"`; `git log -1 --format=%ct HEAD | od -c` → `377 376 1 \0 7 \0 8 \0 …`.
- `refTs` moving back, reproduced (repository `ru`: a root dated 7258118400 mined at `h=37`, then a child dated 2026-09-01) [[ran]] → on both builds `"epoch":"5659718400","ref_ts":"1788220800"`, files `c` and `d` `"w":0`, pair `{"c":1,"w":0}`, `"faults":[]`.
- The `--no-textconv` fact, re-run on the first auditor's own repository `b7c/repos/tc` (read-only) with `L="log --no-merges -M -z --numstat --reverse --format=%x1e%H%x00 HEAD"` [[ran]] `git $L | md5sum` → `6deec211…`; `git -c diff.foo.textconv='sed s/x/QQ/' -c diff.foo.binary=false $L | md5sum` → `5ef8af7a…`; the same with `--no-textconv` added → `5ef8af7a…`; `git -c diff.foo.binary=false $L | md5sum` → `5ef8af7a…`. The change is `diff.foo.binary`'s, and `--no-textconv` does not undo it. A line-count-changing converter (`od -c`) on repository `tc2` left the numstat bytes identical, with and without `--no-textconv`.
- Surviving mutants, re-run on `6bbda1d` against the eight miner test files [[ran]] `./mut.sh 6bbda1d <name> src/miner/cochange.js <sed> <miner tests>` → `symhead: exit=0 # pass 48 # fail 0`; `noepochundef: exit=0 # pass 48 # fail 0`; `nostderrtail: exit=0 # pass 48 # fail 0`; `nogroup: exit=0 # pass 48 # fail 0` (the first audit's `sed` expressions, same line numbers).
- The chunk loop has no yield [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@6bbda1d:L589-L591]] "} while (next < pending.length && performance.now() - started < chunkMs);" and batch 3 [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B3-verification.md@HEAD:L160-L160]] "Add an inter-chunk yield of at least 25 ms."
- Only the child environment changed after `6bbda1d` [[ran]] `git diff 6bbda1d HEAD -- middleware/context-oracle/ctxoracle/src/miner/cochange.ts` → the `gitChildEnv` import and `env: gitChildEnv()` on the `oracleRunSync` and `oracleSpawn` calls, nothing else.

**Correct verdict:** replace — the first audit's correction list, without the
`--no-textconv` test item (no byte effect was shown). Add these:
- a stated terminal rule for a commit that stays unreadable, so that a range
  can complete visibly rather than re-mine forever (for example, record the
  commit with a counted exclusion reason and a fault);
- reject a timestamp outside the safe-integer range as malformed;
- fail the pass visibly on an empty or non-decimal `%ct`;
- a T-13-6e case for a full pass with a middle commit unreadable.

### E-2
**Agree/Disagree:**
- Verdict: **agree**, keep.
- Reasoning: agree that the defect was real and that the fix matches git's
  output. One point is overstated. The first audit says the pinning test "is
  discriminating" and credits the regex's exactness ("rejects 41/63/65-hex
  bodies, which a `{40,64}` range would accept"). Only the 64-hex alternative is
  pinned:
  - A `{40,64}` range survives the whole miner suite.
  - So does an upper-case 64-hex alternative.
  - T-13-1p's 41/63/65 cases test the parser's header, not this trailer.
- The looser forms change nothing for bodies git generates, so this is a test
  gap and not a defect in the unit. git writes lower-case 64-hex (executed
  below).

**Evidence:**
- The change [[middleware/context-oracle/ctxoracle/src/miner/labels.ts@6bbda1d:L11-L11]] "const REVERT_TRAILER = /^This reverts commit ([0-9a-f]{40}|[0-9a-f]{64})\.$/m;"
- git's own body in a SHA-256 repository [[ran]] `git init -q --object-format=sha256 -b main repos/s256; … git revert --no-edit HEAD; git log -1 --format=%B` → `This reverts commit 9fdfcf1b8cf86626b11f083ca3ddff19421114e5ba009c579493f04d920c8b5e.`
- Planted on `6bbda1d` against the eight miner test files [[ran]] `./mut.sh 6bbda1d t40only src/miner/labels.js '10s/\|\[0-9a-f\]\{64\}//' <miner tests>` → `t40only: exit=1 # pass 47 # fail 1`, `not ok 28 - T-13-1p: a SHA-256 repository mines with no faults`; `./mut.sh 6bbda1d t4064 src/miner/labels.js '10s/\(\[0-9a-f\]\{40\}\|\[0-9a-f\]\{64\}\)/[0-9a-f]{40,64}/' <miner tests>` → `t4064: exit=0 # pass 48 # fail 0`; `./mut.sh 6bbda1d tupper src/miner/labels.js '10s/\[0-9a-f\]\{64\}/[0-9a-fA-F]{64}/' <miner tests>` → `tupper: exit=0 # pass 48 # fail 0`.
- Unchanged at `HEAD` [[ran]] `git diff --stat 6bbda1d HEAD -- middleware/context-oracle/ctxoracle/src/miner/labels.ts` → empty.

**Correct verdict:** keep — the regex is right. Its exactness is unpinned; that
belongs to E-11's test correction.

### E-3
**Agree/Disagree:**
- Verdict: **agree**, keep.
- Reasoning: agree on the mechanism, with three corrections to the backing.
  1. **The guard does accept 0.** The first audit says the guard stops a value
     that would silently disable the handler, because "SQLite turns busy
     handling off at ≤ 0". But `busyTimeoutMs < 0` accepts `0`, and `0` turns
     the handler off. That is a legitimate explicit choice ("never wait"), not a
     defect, but the reason as stated is inaccurate.
  2. **The wait is two busy periods, not one.** The adapter keeps its
     retry-once loop, and each attempt's `BEGIN IMMEDIATE` sleeps the full
     `busy_timeout`. So `busyTimeoutMs: 5000` waits about 10 s before
     `StoreBusy` (executed below). The adapter's comment says so honestly
     ("The retry-once rule is unchanged"). The consequence falls on E-5 and
     E-16, which state 5 s.
  3. **The first audit's alternative is equivalent, as it says.** The
     `DatabaseSync` constructor's `timeout` option would set the wait before
     `PRAGMA journal_mode`. Executed, the order is harmless: `PRAGMA
     journal_mode = WAL` returns at once while another process holds `BEGIN
     IMMEDIATE` or `BEGIN EXCLUSIVE`.
- Against batch 6's transaction item: this diff touches none of the ROLLBACK
  paths. The swallowed depth-0 `ROLLBACK` failure (batch 6 item 4) is inherited,
  not widened.
- The guard has no test (`noguard` survives, reproduced). That is carried in
  E-13.

**Evidence:**
- The guard and the pragma [[middleware/context-oracle/ctxoracle/src/stores/adapter.ts@6bbda1d:L159-L161]] "if (!Number.isInteger(busyTimeoutMs) || busyTimeoutMs < 0) {" and [[middleware/context-oracle/ctxoracle/src/stores/adapter.ts@6bbda1d:L176-L176]] "db.exec(`PRAGMA busy_timeout = ${busyTimeoutMs}`);"
- The retry-once loop it keeps [[middleware/context-oracle/ctxoracle/src/stores/adapter.ts@6bbda1d:L269-L269]] "for (let attempt = 0; attempt < 2; attempt++) {" and the comment [[middleware/context-oracle/ctxoracle/src/stores/adapter.ts@6bbda1d:L152-L152]] "The retry-once rule is unchanged."
- SQLite on a zero argument [[https://www.sqlite.org/c3ref/busy_timeout.html]] "Calling this routine with an argument less than or equal to zero turns off all busy handlers."
- The effective bound. A holder process takes `BEGIN IMMEDIATE`, inserts, signals, and holds for `HOLD` ms; the waiter opens `openStore(db, {busyTimeoutMs: 5000})` from the `6bbda1d` build and runs one `transaction` [[ran]] `HOLD=7000 node holder.mjs t.db & node adapt.mjs t.db <6bbda1d> 5000` → `committed after 7056 ms`; `HOLD=11000 …` → `threw StoreBusy after 10036 ms`.
- Pragma order [[ran]] `node holder.mjs t.db & node opener.mjs t.db` (a fresh `DatabaseSync` runs `PRAGMA journal_mode = WAL` with no busy timeout while the lock is held) → `journal_mode ok {"journal_mode":"wal"} 1 ms`; with `BEGIN EXCLUSIVE` → `journal_mode ok {"journal_mode":"wal"} 0 ms`.
- Guard behaviour [[ran]] `openStore(p, {busyTimeoutMs: v})` for `1.5`, `-1`, `'5000; DROP TABLE x'`, `Infinity` → each `RangeError openStore: busyTimeoutMs must be a non-negative integer, not …`.
- Guard untested [[ran]] `./mut.sh 6bbda1d noguard src/stores/adapter.js '104s/if \(!Number.isInteger\(busyTimeoutMs\) \|\| busyTimeoutMs < 0\)/if (false)/' "dist/test/unit/*.test.js" "dist/test/conventions/*.test.js"` → `noguard: exit=1 # pass 209 # fail 4`, the four T-1 cases only (survived).
- Batch 6's open item [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B6-verification.md@HEAD:L125-L126]] "A failed depth-0 ROLLBACK must leave the handle refusing every later call,"
- Unchanged at `HEAD` [[ran]] `git diff --stat 6bbda1d HEAD -- middleware/context-oracle/ctxoracle/src/stores/adapter.ts` → empty.

**Correct verdict:** keep — the option, its default and its guard are correct.
The two-period effective wait is a fact for E-5 and E-16, not a change here.

### E-4
**Agree/Disagree:**
- Verdict: **disagree** — replace, not keep.
- Reasoning: the first audit is right that a per-stream option is the narrowest
  way to obtain the child's stderr, and that the existing defaults are
  unchanged. It missed a special case this diff extends: `detached: true` wins
  over any piped stream, silently.
  - A caller that asks for `stderr: 'pipe'` together with `detached: true` gets
    `stdio: 'ignore'` and `child.stderr === null`, with no error (executed).
  - The option's comment does not mention it.
  - The one caller reads the stream through optional chaining
    (`child.stderr?.on`), so a dropped pipe would lose the tail without a sign.
- No caller combines the two today. But a requested option that is silently
  dropped is the error-hiding shape that fail-fast forbids. The first audit's
  own standard applies, and the fix is one line.
- The new option is also untested: no test fails when it is ignored
  (`spawnstderr`, reproduced) or when detached stops overriding it
  (`detachpipe`). The first audit files that gap under E-1. Its natural home is
  R-11, which pins this seam's other option.
- Against batch 6's `maxBuffer` item: this diff does not touch `oracleRunSync`,
  so the item is inherited, not widened. The miner's synchronous git calls
  (`rev-parse`, `rev-list --count`, `log -1`, `merge-base`) have small outputs.

**Evidence:**
- The stdio this diff builds [[middleware/context-oracle/ctxoracle/src/util/spawn.ts@6bbda1d:L88-L91]] "opts.detached === true" and [[middleware/context-oracle/ctxoracle/src/util/spawn.ts@6bbda1d:L88-L91]] "? ['ignore', opts.stdout ?? 'inherit', opts.stderr ?? 'inherit']"
- The option's documented contract [[middleware/context-oracle/ctxoracle/src/util/spawn.ts@6bbda1d:L56-L57]] "* `'pipe'`: stderr piped; the caller must drain it (an undrained pipe stalls"
- The caller's optional chaining [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@6bbda1d:L359-L359]] "child.stderr?.on('data', (b: Buffer) => {"
- Executed on the `6bbda1d` build [[ran]] `oracleSpawn('sh',['-c','echo err >&2'],{cwd:'.',detached:true,stderr:'pipe'})` → `detached+stderr pipe -> child.stderr is null`; `oracleSpawn('sh',['-c','echo err >&2'],{cwd:'.',stderr:'pipe'})` → `captured "err\n" stdout null`.
- Untested [[ran]] `./mut.sh 6bbda1d spawnstderr src/util/spawn.js "54s/opts.stderr \?\? 'inherit'/'inherit'/" "dist/test/unit/*.test.js" "dist/test/conventions/*.test.js"` → `spawnstderr: exit=1 # pass 209 # fail 4` (the four T-1 cases only: survived); `./mut.sh 6bbda1d detachpipe src/util/spawn.js "51s/opts.detached === true/opts.detached === true \&\& opts.stderr !== 'pipe' \&\& opts.stdout !== 'pipe'/" …` → `detachpipe: exit=1 # pass 209 # fail 4` (survived).
- Fail-fast [[https://martinfowler.com/ieeeSoftware/failFast.pdf]] "The program continues working right after an error but fails in strange ways later on."
- Batch 6's item [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B6-verification.md@HEAD:L127-L129]] "5. **Spawn wrapper** (6c E-7). A wrapper that throws only on a missing command"
- Unchanged at `HEAD` [[ran]] `diff 6bbda1d/…/src/util/spawn.ts HEAD/…/src/util/spawn.ts` → no difference.

**Correct verdict:** replace — keep the option and the defaults. Make
`oracleSpawn` throw when `detached: true` is combined with a piped stream (or
state the precedence in the option's comment), and add an R-11 leg that pins
`stderr: 'pipe'`.

### E-5
**Agree/Disagree:**
- Verdict: **agree**, replace.
- Reasoning: agree with all three counts (the root cause is left unfixed, the
  number is unsourced, and "cannot abort" is false). One fact is missing, and it
  sharpens the third count: the wait is not 5 s.
  - The adapter retries a busy `BEGIN IMMEDIATE` once, and each attempt sleeps
    the full `busy_timeout`. So `busyTimeoutMs: 5000` gives up after about
    10 s (executed: 10036 ms).
  - The comment, the §9 row and AD-26's "5 s" all state half the real bound.
    STATUS counts the retry for the old value ("200 ms", which is 2 × 100) but
    not for the new one ("5 s").
  - Deriving the value, which the first audit asks for, has to start from the
    two-period bound.
- The first audit's "no test covers the opener's wait" reproduces (`ctx100`
  survives).
- Nothing in this unit changed at `HEAD`.

**Evidence:**
- The change [[middleware/context-oracle/ctxoracle/src/cli/context.ts@6bbda1d:L38-L43]] "// busyTimeoutMs 5000), so the `index`/`init` verbs' miner cannot abort on" and [[middleware/context-oracle/ctxoracle/src/cli/context.ts@6bbda1d:L38-L43]] "const project = openStore(layout.project, { busyTimeoutMs: 5000 });"
- The retry loop that doubles it [[middleware/context-oracle/ctxoracle/src/stores/adapter.ts@6bbda1d:L269-L269]] "for (let attempt = 0; attempt < 2; attempt++) {"
- Executed (E-3's holder and waiter, `6bbda1d` build) [[ran]] `HOLD=7000 node holder.mjs t.db & node adapt.mjs t.db <6bbda1d> 5000` → `committed after 7056 ms`; `HOLD=11000 …` → `threw StoreBusy after 10036 ms`. A 7 s hold, which "5 s" says aborts, commits.
- The record's two figures [[middleware/context-oracle/docs/STATUS.md@7800246:L306-L307]] "database after 200 ms, and now waits 5 s off the event path."
- SQLite's bound is per blocked call [[https://www.sqlite.org/c3ref/busy_timeout.html]] "This routine sets a busy handler that sleeps for a specified amount of time when a table is locked." Each `BEGIN IMMEDIATE` attempt gets its own full wait.
- No test pins the opener [[ran]] `./mut.sh 6bbda1d ctx100 src/cli/context.js 's/, \{ busyTimeoutMs: 5000 \}//g' "dist/test/unit/*.test.js" "dist/test/conventions/*.test.js"` → `ctx100: exit=1 # pass 209 # fail 4`, the four T-1 cases only (survived).
- The settled root cause [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B3-verification.md@HEAD:L58-L59]] "Chunked mining with no gap: the handler succeeded 1 of 15 times. With a 25 ms"
- Unchanged at `HEAD` [[ran]] `git diff --stat 6bbda1d HEAD -- middleware/context-oracle/ctxoracle/src/cli/context.ts` → empty.

**Correct verdict:** replace — the first audit's correction, with the value
derived and stated as the effective bound: two `busy_timeout` periods under the
adapter's retry-once, about 10 s at 5000.

### E-6
**Agree/Disagree:**
- Verdict: **disagree** — replace, not keep.
- Reasoning: the first audit is right that T-13-1q discriminates `1e3` and that
  T-13-1r catches the per-field flood. But each case pins less of its rule than
  the rule says, and the part left open is the part real git exercises.
  1. **T-13-1q pins one of the four forms m5 names.** The code's comment names
     `''`, `' 12'`, `'1e3'` and `'0x10'`. Planted faults that accept `''` alone
     (read as time 0) or `0x…` alone survive the whole miner suite.
     - `''` is not hypothetical. git prints an empty `%at` for a commit whose
       author date is malformed (E-1, executed), so it is the one form a real
       repository produces.
     - The review's "git never emits these" is false for it. The first audit
       took that premise as given ("real git does not emit these shapes").
  2. **T-13-1r does not pin "until the next *valid* header".** A skip state that
     ends on any `0x1e`-led field survives. That field then starts a commit with
     a fabricated hash. T-13-1p's 41/63/65-hex cases cover only the `header`
     state, not the skip state.
- Both are cheap additions to these two cases' data. The spec clause they follow
  names only `1e3` and "exactly one diagnostic", and that is the gap: the tests
  meet a narrower clause than the rule they are named for.

**Evidence:**
- The rule as the code states it [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@6bbda1d:L92-L92]] "/** `/^[0-9]+$/` over the field's bytes (m5: `Number` would accept '', ' 12', '1e3', '0x10'). */"
- T-13-1q's only data row [[middleware/context-oracle/ctxoracle/test/unit/miner.test.ts@6bbda1d:L286-L286]] "`\x1e${H1}`, '1e3', 'subject one', '', '', '\n1\t0\tone.txt',"
- The review's premise [[middleware/context-oracle/docs/reviews/2026-09-26-step-13-build-review.md@f39769a:L194-L194]] "git never emits these."
- git's output for a malformed author date [[ran]] (repository `bd`) `git log --format='%h [%at] %s'` → `bb831bc [] bad date [abc +0000]`, `2c42e65 [] bad date []`.
- Planted on `6bbda1d` against the eight miner test files [[ran]] `./mut.sh 6bbda1d tsemptyonly src/miner/cochange.js '169s/if \(!isDecimal\(f\)\)/if (f.length !== 0 \&\& !isDecimal(f))/' <miner tests>` → `tsemptyonly: exit=0 # pass 48 # fail 0`; `./mut.sh 6bbda1d tshex src/miner/cochange.js '169s/if \(!isDecimal\(f\)\)/if (!isDecimal(f) \&\& !\/^0x[0-9a-f]+$\/.test(f.toString()))/' <miner tests>` → `tshex: exit=0 # pass 48 # fail 0`; `./mut.sh 6bbda1d skipany1e src/miner/cochange.js '163s/isHeader\(f\)/(f[0] === RS)/' <miner tests>` → `skipany1e: exit=0 # pass 48 # fail 0`.
- The first audit's kills reproduce, plus two of mine [[ran]] `./mut.sh 6bbda1d tsnocurnull src/miner/cochange.js '173s/this.cur = null;//' <miner tests>` → `tsnocurnull: exit=1 # pass 47 # fail 1`, `not ok 15 - T-13-1q: …`; `./mut.sh 6bbda1d hdrnoskip src/miner/cochange.js '160s/this.startSkip\(f, null\);/this.malformed(f);/' <miner tests>` → `hdrnoskip: exit=1 # pass 47 # fail 1`, `not ok 16 - T-13-1r: …`.
- Red before the fix [[ran]] (`6bbda1d`'s tests compiled against `6d6f21d`'s source) `node --test --test-name-pattern="T-13-1o|T-13-1p|T-13-1q|T-13-1r|…" …` → `not ok 1 - T-13-1q: …`, `not ok 2 - T-13-1r: …`.
- Unchanged at `HEAD` [[ran]] `git diff --stat 6bbda1d HEAD -- middleware/context-oracle/ctxoracle/test/unit/miner.test.ts` → empty.

**Correct verdict:** replace — keep both cases. Add `''`, `' 12'` and `'0x10'`
rows to T-13-1q (`''` first: it is git's own output for a malformed date), and
put a `0x1e`-led non-header field inside T-13-1r's skipped run.

### E-7
**Agree/Disagree:**
- Verdict: **agree**, keep.
- Reasoning: agree. The derivation holds: a store's weight times
  2^((E_s − E_r)/h) is the reference's sum over the same commits.
- I planted my own faults in the miner that change weights but not counts, only
  on incremental passes:
  - a factor of 2;
  - a one-day shift of `ts`.
- Both fail T-13-6d, so the weight half of the comparison carries the load, not
  only the exact counts.
- A reversed sign in the test's factor also fails, so the factor cannot be
  vacuous.
- The helper hard-codes h = 365. A changed seed would make it fail loudly, never
  pass wrongly, as the first audit says.

**Evidence:**
- The factor [[middleware/context-oracle/ctxoracle/test/unit/miner_branches.test.ts@6bbda1d:L298-L298]] "const factor = 2 ** ((actual.epoch - reference.epoch) / (365 * 86400));" and the tolerance check [[middleware/context-oracle/ctxoracle/test/unit/miner_branches.test.ts@6bbda1d:L308-L309]] "assert.ok(rel <= 1e-9, `${what}: ${kind} ${key} weight on the common epoch differs by ${rel} relative (> 1e-9)`);"
- Planted on `6bbda1d` [[ran]] `./mut.sh 6bbda1d wincr2 src/miner/cochange.js '492s/const w = 2 \*\*/const w = (full ? 1 : 2) * 2 **/' dist/test/unit/miner_branches.test.js dist/test/unit/miner_chunks.test.js` → `wincr2: exit=1 # pass 6 # fail 2`, `not ok 4 - T-13-6d: …`, `not ok 8 - T-13-5d: …`; `./mut.sh 6bbda1d wincr1d src/miner/cochange.js '492s/Math.min\(c.ts, refTs\)/Math.min(c.ts, refTs) + (full ? 0 : 86400)/' …` → `wincr1d: exit=1 # pass 6 # fail 2` (the same two); `./mut.sh 6bbda1d signflip test/unit/miner_branches.test.js '257s/\(actual.epoch - reference.epoch\)/(reference.epoch - actual.epoch)/' dist/test/unit/miner_branches.test.js` → `signflip: exit=1 # pass 3 # fail 1`, `not ok 4 - T-13-6d: …`.
- The specification it implements [[middleware/context-oracle/docs/plans/plan-phase-a.md@6d6f21d:L11428-L11429]] "store differs from a single uninterrupted mine. (Weights are compared **on a common epoch**: each store's weight × 2^((E_store − E_ref)/(h × 86400)) must equal the reference's within 1e-9 relative, E being each store's `weight_epoch`; counts are compared exactly."
- Unchanged at `HEAD` [[ran]] `git diff --stat 6bbda1d HEAD -- middleware/context-oracle/ctxoracle/test/unit/miner_branches.test.ts` → empty.

**Correct verdict:** keep — the comparison is the right invariant and survives
my weight-only faults.

### E-8
**Agree/Disagree:**
- Verdict: **agree**, keep.
- Reasoning: agree.
  - Every non-weight row set of `fullSnapshot` (`commits`, `lastCommits`,
    `touches`, `landmines`) is still compared exactly.
  - Only `pairs` and `files` moved to the epoch-aware comparison. `epochRows`
    carries the same count and weight columns for them.
  - `referenceEpoch` is set inside the memoised reference builder that the
    destructuring awaits, so it cannot be unset when read.
- My weight-only faults (E-7) fail T-13-5d too, and a reversed factor sign in
  this file's copy fails it.
- The only change to this file at `HEAD` adds a `runIndex` leg to T-13-5c
  (`177e59f`). It does not touch T-13-5d.

**Evidence:**
- The split comparison [[middleware/context-oracle/ctxoracle/test/unit/miner_chunks.test.ts@6bbda1d:L313-L318]] "assert.deepEqual(rest, refRest, 'the completed store differs from a single uninterrupted mine');" and [[middleware/context-oracle/ctxoracle/test/unit/miner_chunks.test.ts@6bbda1d:L313-L318]] "assertCommonEpoch(snapshotOf(dbs, epochRows) as EpochRows, referenceEpoch, 'T-13-5d');"
- What `rest` keeps [[middleware/context-oracle/ctxoracle/test/unit/miner_chunks.test.ts@6bbda1d:L190-L191]] "return { commits, pairs, lastCommits, files, touches, landmines };"
- Planted [[ran]] `./mut.sh 6bbda1d signflipc test/unit/miner_chunks.test.js '299s/\(actual.epoch - reference.epoch\)/(reference.epoch - actual.epoch)/' dist/test/unit/miner_chunks.test.js` → `signflipc: exit=1 # pass 3 # fail 1`, `not ok 4 - T-13-5d: …`; `wincr2` and `wincr1d` (E-7) → `not ok 8 - T-13-5d: …`.
- The later change [[ran]] `git diff 6bbda1d HEAD -- middleware/context-oracle/ctxoracle/test/unit/miner_chunks.test.ts` → the header note rewritten, the `runIndex` import, and `test('T-13-5c (runIndex leg): …')` added; T-13-5d is unchanged.

**Correct verdict:** keep — nothing is narrowed, and the case fails on a wrong
store.

### E-9
**Agree/Disagree:**
- Verdict: **agree**, keep.
- Reasoning: agree with the decision, "open the miner's store as the product's
  caller does". One stated fact is wrong. The first audit says the global store
  can stay at the default because the tuning reader only reads, and "in WAL mode
  a reader does not take the write lock".
  - The tuning reader writes: on a missing key it stores the seed into the
    global store. That is batch 6's settled defect, still present.
  - The product's opener also opens the global store with 5000, so the worker
    does not match the product for that store.
  - The difference is inert here, because the harness seeds every key and the
    reader then never writes. So the verdict stands.
- The literal duplicates the opener's value. Sharing one constant would stop
  drift, as the first audit says.

**Evidence:**
- The worker [[middleware/context-oracle/ctxoracle/test/unit/miner_chunks_worker.ts@6bbda1d:L62-L63]] "const store = openStore(projectDb, { busyTimeoutMs: 5000 });" and [[middleware/context-oracle/ctxoracle/test/unit/miner_chunks_worker.ts@6bbda1d:L62-L63]] "const global = openStore(globalDb);"
- The product's opener, both stores [[middleware/context-oracle/ctxoracle/src/cli/context.ts@6bbda1d:L42-L43]] "const global = openStore(layout.global, { busyTimeoutMs: 5000 });"
- The reader writes on a miss [[middleware/context-oracle/ctxoracle/src/stores/dao/tuning.ts@6bbda1d:L112-L114]] "tuning.set(global, key, seed.value, seed.source);"
- Batch 6's settled item [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B6-verification.md@HEAD:L113-L115]] "- The reader writes seeds on the event path (6a E-17, 6b E-16, 6c E-12). It"
- Unchanged at `HEAD` [[ran]] `git log --oneline 6bbda1d..HEAD -- middleware/context-oracle/ctxoracle/test/unit/miner_chunks_worker.ts` → empty.

**Correct verdict:** keep — it matches the product's opener for the store the
miner writes. The global-store reasoning is corrected as above.

### E-13
**Agree/Disagree:**
- Verdict: **disagree** — replace, not keep.
- Reasoning: the first audit is right that real processes and a marker make the
  case deterministic, and that ignoring the option is caught. The default side
  is also pinned exactly, by T-3-1's read-back of 100: a planted default of 400
  fails T-3-1.
- But the patient side does not pin the value. Because of the adapter's
  retry-once, a store waits two `busy_timeout` periods (E-3). Any value from
  about 500 ms up outlasts the 1 s hold. So a planted cap of the option at
  600 ms survives the whole suite, and only a cap at 400 ms fails T-3-5j.
- The first audit's "the margins are wide" is exactly why the case cannot tell
  5000 from 600.
- The guard added with the option (E-3) has no test anywhere (`noguard`
  survives).
- Both gaps close cheaply in this case:
  - read back `PRAGMA busy_timeout` on the patient store and assert 5000, as
    T-3-1 already does for 100;
  - assert that `busyTimeoutMs: 1.5` and `-1` throw `RangeError`.

**Evidence:**
- The hold and the patient assertion [[middleware/context-oracle/ctxoracle/test/unit/store_nesting.test.ts@6bbda1d:L399-L399]] "'Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);'," and [[middleware/context-oracle/ctxoracle/test/unit/store_nesting.test.ts@6bbda1d:L437-L437]] "assert.equal(outcome, 'committed', 'a store opened with busyTimeoutMs 5000 did not complete its write while the lock was held for 1 s');"
- The exact read-back pattern already used for the default [[middleware/context-oracle/ctxoracle/test/unit/stores_adapter.test.ts@6bbda1d:L16-L16]] "assert.equal((store.prepare('PRAGMA busy_timeout').get() as { timeout: number }).timeout, 100);"
- Planted on `6bbda1d` [[ran]] `./mut.sh 6bbda1d cap600 src/stores/adapter.js '123s/\$\{busyTimeoutMs\}/${Math.min(busyTimeoutMs, 600)}/' dist/test/unit/store_nesting.test.js` → `cap600: exit=0 # pass 13 # fail 0`; the same tree against `"dist/test/unit/*.test.js" "dist/test/conventions/*.test.js"` → `# pass 209 # fail 4`, the four T-1 cases only (survived); `cap400` → `cap400: exit=1 # pass 12 # fail 1`, `not ok 13 - T-3-5j: …`.
- The default side is pinned elsewhere [[ran]] `./mut.sh 6bbda1d dflt400all src/stores/adapter.js 's/opts\?\.busyTimeoutMs \?\? 100/opts?.busyTimeoutMs ?? 400/' …`, then `node --test "dist/test/unit/*.test.js" "dist/test/conventions/*.test.js"` in that tree → `not ok 174 - T-3-1: openStore yields WAL, foreign_keys, busy_timeout, STRICT, and round-trips` beside the four T-1 cases.
- The two-period wait [[ran]] E-3's `HOLD=7000 … 5000` → `committed after 7056 ms`.
- Guard untested [[ran]] E-3's `noguard` → `# pass 209 # fail 4`, the four T-1 cases only.
- Unchanged at `HEAD` [[ran]] `git diff --stat 6bbda1d HEAD -- middleware/context-oracle/ctxoracle/test/unit/store_nesting.test.ts` → empty.

**Correct verdict:** replace — keep the two-process case as it is. Add a
`PRAGMA busy_timeout` read-back of 5000 on the patient store, and a
`RangeError` case for a non-integer and a negative `busyTimeoutMs`.

### E-14
**Agree/Disagree:**
- Verdict: **agree**, keep.
- Reasoning: agree. I measured the claim myself on the `6bbda1d` build. At a
  fixed `miner.horizon_commits` of 100, peak heap growth rises with the range:
  about 9.8 MB at 20,000 commits and 29.1 MB at 100,000. That is roughly 240 B
  per added commit, including the transient parse buffers and chunk writes.
  - This matches the review's order of magnitude (168 B for the pending
    record alone).
  - It matches the code: every read commit is pushed to `pending`, and a
    horizon-excluded commit keeps `paths: []`.
- The hunk names the false claim, its origin and the limit's new home (R16),
  which exists in the plan.

**Evidence:**
- The hunk [[middleware/context-oracle/docs/implementation-log.md@6bbda1d:L1055-L1061]] "the range. The review measured about 168 B per commit on Node 22 (100,000"
- The code [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@6bbda1d:L498-L498]] "const writesPaths = !horizonExcluded && (!sizeExcluded || revert);"
- The limit exists [[middleware/context-oracle/docs/plans/plan-phase-a.md@6d6f21d:L13773-L13773]] "- **R16 — The co-change miner's memory grows with the mined range.** A pass"
- Measured on linear single-file histories built with `git fast-import` [[ran]] `node --expose-gc mem.mjs <6bbda1d> repos/big20000 db/mem20000 100` → `{"seen":20000,"included":100,"excluded":19900,"baseMB":4.9,"peakMB":14.7,"growthMB":9.8}`; `… repos/big100000 db/mem100000 100` → `{"seen":100000,"included":100,"excluded":99900,"baseMB":4.9,"peakMB":33.9,"growthMB":29.1}`.

**Correct verdict:** keep — the corrected sentence is true and backed.

### E-15
**Agree/Disagree:**
- Verdict: **agree**, replace.
- Reasoning: agree with every item. I reproduced them:
  - the red run: 11 named cases fail on the pre-fix source;
  - `npm test` 217/216/0/1;
  - the false `commitsSeen` sentence (E-1's TAB drift);
  - the "uncommitted" heading;
  - the unstated M2 and m2 limits.
- Two more of the record's lines state a fix without its limit, both executed in
  E-1:
  1. The m5 line: "Otherwise the record is skipped as one malformed item". It
     does not say that such a commit is skipped on every later pass too. On a
     full pass, `mining_in_progress` then never clears, and every pass is a
     purged re-mine. Nor does it say that a digit string beyond the INTEGER
     column crashes every pass.
  2. The M2 line: "`last_mined_commit` stays where the last chunk put it". On a
     full pass, where the last chunk put it can be `HEAD`.
- "Built test-first" holds for the failing-first part. The separate-author claim
  remains unrecorded, as the first audit says.

**Evidence:**
- The m5 line [[middleware/context-oracle/docs/implementation-log.md@6bbda1d:L1148-L1149]] "- **m5:** a timestamp must be all decimal digits. Otherwise the record is"
- The M2 lines [[middleware/context-oracle/docs/implementation-log.md@6bbda1d:L1117-L1118]] "- **M2:** completeness check. `commitsSeen` counts well-formed records," and [[middleware/context-oracle/docs/implementation-log.md@6bbda1d:L1121-L1122]] "- `last_mined_commit` stays where the last chunk put it, and"
- The heading [[middleware/context-oracle/docs/implementation-log.md@6bbda1d:L1096-L1096]] "## Step 13 — fixes after the build review — BUILT (2026-09-26, uncommitted, pending independent review)"
- Red run [[ran]] (`6bbda1d`'s `test/` compiled against `6d6f21d`'s `src`; `tsc` emits despite three `busyTimeoutMs` type errors) `node --test --test-name-pattern="T-13-1o|T-13-1p|T-13-1q|T-13-1r|T-13-2|T-13-6e|T-3-5j|T-13-6d|T-13-5d|R-6" dist/test/unit/miner*.test.js dist/test/unit/store_nesting.test.js` → `not ok` for T-13-1q, 1r, 6d, 5d, 2, 2a, 1o, 1p, 6e, R-6 and T-3-5j; `# pass 2 # fail 11`.
- Verification block [[ran]] `npm test` on the `6bbda1d` scratch tree → `# tests 217`, `# pass 216`, `# fail 0`, `# skipped 0`, `# todo 1`.
- The limits, executed in E-1 [[ran]] `bdempty` → three passes, `mip= 1` each, faults `2`, `4`, `6`; `bdover` → `err= cannot store REAL value in INTEGER column commits.ts` each pass; `midfull` → `"wm":"c0a153f","mip":"1"` with `c0a153f` = `HEAD`.
- Unchanged at `HEAD` [[ran]] `git show HEAD:middleware/context-oracle/docs/implementation-log.md | grep -n "^## Step 13"` → line 1096, the same heading.

**Correct verdict:** replace — the first audit's corrections. Also state m5's
two limits (a commit that stays unreadable forever, and an out-of-range digit
string that crashes every pass), and M2's full-pass watermark at `HEAD`.

### E-16
**Agree/Disagree:**
- Verdict: **agree**, replace.
- Reasoning: agree. I checked every count claim:
  - 390 read, 376 counted, 14 excluded, all 14 for size;
  - this checkout is shallow, with six boundary commits;
  - all six are ancestors of `277b0a2`, and each is among the size exclusions,
    with `entity_count` 1,152–1,617;
  - `57bdd4a` and `6bbda1d` give the same counts.
- The first audit missed two false statements in the same hunk:
  1. "now waits 5 s off the event path" is false. The adapter's retry-once makes
     the wait about 10 s (executed: a 7 s hold commits, an 11 s hold fails at
     10,036 ms). The same line counts the retry for the old value: "200 ms" is
     2 × 100.
  2. "counted 376 in 2.4 s" is the pre-fix build's time (the `57bdd4a` entry's
     2,398 ms). It is placed after "The fixes are in", so it reads as the fixed
     build's. My fixed-build run took 2,960 ms. Timing is machine-dependent, so
     the defect is the attribution, not the number.
- The "reviewed" point stands: the review file reviews `57bdd4a`, and
  `6bbda1d`'s own heading says "pending independent review".

**Evidence:**
- The hunk [[middleware/context-oracle/docs/STATUS.md@7800246:L300-L300]] "**Step 13 (the co-change miner) is built and reviewed (2026-09-26).** It was" and [[middleware/context-oracle/docs/STATUS.md@7800246:L306-L308]] "database after 200 ms, and now waits 5 s off the event path." and [[middleware/context-oracle/docs/STATUS.md@7800246:L306-L308]] "- On this repository the miner read 390 commits and counted 376 in 2.4 s."
- The pre-fix figure [[middleware/context-oracle/docs/implementation-log.md@6bbda1d:L1073-L1076]] "size), `chunks 1`, `pathsRejected 0`, 2,398 ms."
- Shallow [[ran]] `git rev-parse --is-shallow-repository` → `true`; `git rev-list --count --no-merges 277b0a2` → `390`; `wc -l < .git/shallow` → `6`. In the clone, `sort -u .git/shallow`, each checked with `git merge-base --is-ancestor <h> HEAD` → `257291e`, `54d757a`, `6e5f00b`, `6ffa822`, `b5ebe9c`, `f0b573c`: all six are ancestors.
- Fixed and pre-fix runs [[ran]] `node drv.mjs <6bbda1d> b7cso/aa db/aa-6bbda1d fresh=1 ex=1` → `"commitsSeen":390,"included":376,"excluded":14,"chunks":2 … "ms":2960,"wm":"277b0a2","mip":"0" … "nFiles":590,"nPairs":4376,"faults":[],"ex":[{"r":null,"n":376},{"r":"size","n":14}]`; `<57bdd4a>` → the same counts, `"ms":2984`.
- The boundary commits in the fixed build's store [[ran]] `SELECT exclude_reason, entity_count FROM commits WHERE hash=?` per boundary hash → `6ffa822 {"exclude_reason":"size","entity_count":1152}`, `b5ebe9c … 1388`, `6e5f00b … 1387`, `257291e … 1402`, `f0b573c … 1492`, `54d757a … 1617`; per reason → `{"exclude_reason":null,"n":376,"mn":1,"mx":30},{"exclude_reason":"size","n":14,"mn":32,"mx":1617}`.
- The wait [[ran]] E-3's `HOLD=7000 … 5000` → `committed after 7056 ms`; `HOLD=11000 …` → `threw StoreBusy after 10036 ms`.
- Timing of the two commits [[ran]] `for c in 6bbda1d 7800246; do git log -1 --format='%h %cI' $c; done` → `6bbda1d 2026-09-26T06:32:01+00:00`, `7800246 2026-09-26T06:32:17+00:00`.
- Unchanged at `HEAD` [[ran]] `git show HEAD:middleware/context-oracle/docs/STATUS.md | grep -n "now waits 5 s\|390 commits"` → lines 307 and 308, the same text.

**Correct verdict:** replace — the first audit's corrections. Also state the wait
as about 10 s (two 5 s busy periods under the retry-once), and mark 2.4 s as the
pre-fix build's time or replace it with a fixed-build measurement.

## Summary (recounted from the sections above)

| Entry | First audit | This opinion | Changed? |
|---|---|---|---|
| E-1 | replace | replace | reasoning: `--no-textconv` fact not reproduced; adds the unreadable-commit loop, the out-of-range timestamp crash, the silent `ref_ts` 0, and M2's full-pass watermark at `HEAD` |
| E-2 | keep | keep | reasoning: the regex's exactness is unpinned |
| E-3 | keep | keep | reasoning: the guard accepts 0; the wait is two busy periods |
| E-4 | keep | **replace** | `detached` silently drops a piped stream; the option is untested |
| E-5 | replace | replace | adds the ≈ 10 s effective bound |
| E-6 | keep | **replace** | `''` (git's real output) and the valid-header skip end are unpinned |
| E-7 | keep | keep | — |
| E-8 | keep | keep | — |
| E-9 | keep | keep | reasoning: the tuning reader writes seeds (inert here) |
| E-13 | keep | **replace** | a cap at 600 ms survives; the guard is untested |
| E-14 | keep | keep | — |
| E-15 | replace | replace | adds m5's and M2's unstated limits |
| E-16 | replace | replace | adds "waits 5 s" (≈ 10 s) and the pre-fix 2.4 s |

**Counts, 13 entries:**
- keep 6: E-2, E-3, E-7, E-8, E-9, E-14;
- replace 7: E-1, E-4, E-5, E-6, E-13, E-15, E-16;
- remove 0; undetermined 0.

Of the first audit's nine keeps judged here, six stand and three are overturned
to replace: E-4, E-6, E-13. All four of its replaces stand.

**Fixed at `HEAD`** (checked on the `HEAD` build `a4264e8`): only the inherited
`GIT_DIR` in the miner's git calls (`gitChildEnv()`, from `7fdbd7e`). Every other
defect named here reproduces on the `HEAD` build. The `HEAD` records (STATUS
lines 300–308 and the implementation-log heading at line 1096) are unchanged.

**New defects in the `6bbda1d` miner rewrite that the first audit did not
reproduce:**
- A commit git prints with an empty `%at` (a malformed author date) is refused on
  every pass. A full mine then never completes: `mining_in_progress` stays `'1'`
  and two more faults are written per pass.
- A 20-digit author date passes m5 and throws `cannot store REAL value in
  INTEGER column commits.ts` on every pass, with no fault row.
- An empty `%ct` on `HEAD` gives `ref_ts` 0 and equal weights, silently.
- An incomplete full pass leaves the watermark at `HEAD`.

**Questions for Max Cogar:** none.
