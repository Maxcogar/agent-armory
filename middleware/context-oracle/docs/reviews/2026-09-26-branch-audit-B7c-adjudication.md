# Branch audit — batch 7, part c (the Step 13 fixes and the "built and reviewed" record): adjudication

This file adjudicates batch 7 part c of the branch audit, commits 50–51:
`6bbda1d` (the Step 13 code fixes from its build review, and the CI lock-wait
defect) and `7800246` (STATUS "Step 13 built and reviewed", and a collapse-log
entry). Its inputs are the first audit `2026-09-26-branch-audit-B7c.md` (E-1 …
E-18: 9 keep, 9 replace) and the second opinion
`2026-09-26-branch-audit-B7c-second-opinion.md` (13 entries). The adjudicator
made none of the changes and wrote neither review. The test applied is the
auditor brief
`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/BRIEF.md`.

Settled and not re-litigated: the B1–B6 verification files and the B7a and B7b
adjudications. Batch 5 ruling 1 (watermark) and ruling 2 (recency) govern.
Batch 4: `git` exit 128 is a git fault with no purge. Batch 3: a writer leaves
at least 25 ms between chunks, and the event handler never waits.

**How the work was done.**
- My own scratch extractions under the scratchpad folder `b7cadj/`, made with
  `git archive <commit> middleware/context-oracle/ctxoracle | tar -x`, for
  `6bbda1d` and `HEAD` (`6b8af75`, which adds only audit files after
  `6bbda1d`'s code). This checkout's `ctxoracle/node_modules` was symlinked in,
  and each was built with `npx tsc -p tsconfig.json`. Baselines:
  `node --test dist/test/unit/miner*.test.js` → `6bbda1d` `# tests 48 # pass 48
  # fail 0`; `HEAD` `# tests 49 # pass 49 # fail 0`.
- The miner at `HEAD` differs from `6bbda1d` only by `gitChildEnv()` on its git
  calls. `spawn.ts`, `adapter.ts`, `context.ts` and every test file ruled here
  except `miner_chunks.test.ts` (a `runIndex` leg added to T-13-5c) are
  unchanged: [[ran]] `git diff --stat 6bbda1d HEAD -- …/src/miner/ …/src/util/spawn.ts …/src/stores/adapter.ts …/src/cli/context.ts …/test/unit/` → `…/src/miner/cochange.ts | 6 +-`, `…/test/unit/miner_chunks.test.ts | 30 +-`, and new files only.
- Tools, copied into `b7cadj/` from the second opinion's `b7cso/` and read
  before use: `drv.mjs` (one `mineCochange` pass into seeded stores; prints the
  result, error, watermark `wm`, `mining_in_progress` `mip`, `weight_epoch`,
  `ref_ts`, rows and faults), `mut.sh <build> <name> <dist file> <sed> <tests…>`
  (copies a built tree, applies one `sed`, refuses a no-op, runs the tests), and
  the `PATH` git shim `shim/git` (for the `log … --numstat` call only, rewrites
  the `0x1e` before chosen hashes to `X`). Copied trees fail the four
  build-environment cases T-1-1, T-1-2a, T-1-2b, T-1-2c whatever the mutant is:
  [[ran]] `./mut.sh HEAD nullmut src/cli/context.js '1s/^/\/\/ null mutant\n/' "dist/test/unit/*.test.js" "dist/test/conventions/*.test.js"` → `nullmut: exit=1 # pass 321 # fail 4`, those four only. So on `HEAD`, a whole-suite
  `# pass 321 # fail 4` means the mutant survived.
- Throwaway repositories under `b7cadj/repos/`, with `GIT_DIR`,
  `GIT_WORK_TREE` and `GIT_INDEX_FILE` unset, `GIT_CONFIG_GLOBAL=/dev/null` and
  `GIT_CONFIG_NOSYSTEM=1`. Malformed commit objects were written with
  `git hash-object -t commit -w --stdin --literally` (script `mkbad.sh`).
- The real-repository run used the second opinion's scratch clone `b7cso/aa`
  (detached at `277b0a2`), only read by the miner; its `git status
  --porcelain` was empty before and after.
- Web quotes were fetched with `curl` and checked with the audit folder's
  `webquote.py`. Tool versions: git 2.43.0, Node v22.22.2. No repository file
  other than this one was written; no git state was changed.

Entries neither second-opinioned nor changed by a verified fact are listed at
the end and not re-ruled.

### E-1
**Ruling:** Replace stands; both reviews agree. The second opinion is upheld on
every disputed and added point.

*The `--no-textconv` fact does not hold.* The first audit said the flag is "a
real pin" that changes the numstat bytes. That is wrong. On a repository of the
first audit's shape, the bytes change because of `diff.foo.binary=false`, and
`--no-textconv` does not undo it. A textconv filter alone changes nothing.
git's source shows why: `builtin_diffstat`, which produces `--numstat`, reads
the blobs with `fill_mmfile` and never asks for a textconv. Only `builtin_diff`,
the patch path, consults `allow_textconv`. A line-count-changing converter on a
text file shows in `-p` and leaves the numstat bytes identical. So the
`notextconv` mutant is equivalent on git 2.43.0, and the first audit's call
for a test that kills `notextconv` is dropped. The flag itself is harmless. The
code's reason for the flags (that every byte-changing setting is pinned) is
false for other reasons already in the correction:
`i18n.logOutputEncoding` (agreed by both reviews). And `diff.<driver>.binary`
changes the bytes, but in the count columns only. I mined that repository with
and without the setting, and the stored rows were identical.

*The four added miner defects reproduce on both builds.*
1. **An undatable commit gives a full mine with no end.** git prints an empty
   `%at` for a commit whose author date is malformed (`fsck` `badDate`). The m5
   check rightly refuses it. Then the completeness check fails on every pass.
   `mining_in_progress` stays `'1'`, so every later pass is again a purged full
   re-mine, and each pass adds two faults (2, 4, 6). The code has no terminal
   state for a commit that stays unreadable. The review's premise for m5, "git
   never emits these", is false for `''`.
2. **A 20-digit author date crashes every pass.** git prints it as-is in `%at`
   (`fsck` `badDateOverflow`). It passes `/^[0-9]+$/`, `Number` makes it
   `1e20`, and the STRICT `commits.ts INTEGER` insert throws. Nothing is mined,
   `mining_in_progress` stays `'1'` and no fault row is written. Under the
   detached reindex the thrown error reaches no one (B7b adjudication E-24,
   settled).
3. **An empty `%ct` on `HEAD` erases recency silently.** `Number('')` is `0`.
   So `ref_ts` is `0`, every commit is capped to `0`, and every weight is
   exactly 2^500. The pass completes with `mining_in_progress` `'0'` and no
   fault. This is the same unvalidated `refTs` read the first audit found under
   `i18n.logOutputEncoding` (there it gives `NaN`), in a second, silent form.
4. **An incomplete full pass leaves the watermark at `HEAD`.** When the
   unreadable commit is not the newest, the last chunk writes the newest
   commit's hash, which is `HEAD`. `mining_in_progress` stays `'1'`, so no data
   is lost (the next pass purges and re-mines). But the store claims `HEAD`,
   which T-13-6e's own title denies, and the chunk loop's comment that the
   watermark is "never ahead of its data" is false here. Ruling 1's correction (no chunk writes the
   watermark) removes it. The new fact adds a test case, not a new design.

Two interactions the correction must state:
- Item 1 and the first audit's "count entry-less commits as unread" give the
  same end state: a range that can never complete. So the terminal rule must
  cover both a commit that cannot be dated and one whose entries cannot be read.
- The terminal rule must be visible. A commit that stays unreadable is recorded
  with a counted exclusion reason and a fault, and the range completes. Silently
  dropping it is not acceptable, and neither is re-mining it forever.

The first audit's other items were agreed by both reviews and are not
re-litigated: the middle-commit loss, the TAB drift, `NaN` under
`i18n.logOutputEncoding`, zero weights when `refTs` moves back, the wrong-commit
attribution, the missing yield, and the dropped review items.

**Evidence:**
- The first audit's claim [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B7c.md@a4264e8:L45-L45]] "`--no-textconv` is a real pin"
- Repository `tc` (`.gitattributes` `f.bin diff=foo`; two commits of a binary `f.bin`), with `L="log --no-merges -M -z --numstat --reverse --format=%x1e%H%x00 HEAD"`:
  - [[ran]] `git $L | md5sum` → `ebd08f47a8b0e6c84ec9d4e23e388632`
  - [[ran]] `git -c diff.foo.textconv='sed s/x/QQ/' -c diff.foo.binary=false $L | md5sum` → `c4ca2056854de9dada7a7535438cd766`
  - [[ran]] the same with `--no-textconv` appended → `c4ca2056854de9dada7a7535438cd766`
  - [[ran]] `git -c diff.foo.binary=false $L | md5sum` → `c4ca2056854de9dada7a7535438cd766`
  - [[ran]] `git -c diff.foo.textconv='sed s/x/QQ/' $L | md5sum` → `ebd08f47a8b0e6c84ec9d4e23e388632` (textconv alone: no change)
  - [[ran]] the three streams with `tr '\0\036' '|#'` → plain and textconv-only `-	-	f.bin`; `binary=false` `1	0	f.bin` and `2	0	f.bin`. Only the count columns differ.
- Repository `tc2` (`t.txt diff=foo`, a text file gaining one line) [[ran]] `git $L | md5sum`; `git -c diff.foo.textconv='od -c' $L | md5sum`; the same with `--no-textconv` → `13acfe323ee72fcf25dfe89c6f4198a4` all three; `git -c diff.foo.textconv='od -c' log -p -1 --format=` → `+0000000   a  \n   b  \n   c  \n` (textconv is active in the patch, absent from the numstat).
- git's source for `--numstat` [[https://raw.githubusercontent.com/git/git/v2.43.0/diff.c]] "static void builtin_diffstat(const char *name_a, const char *name_b," and [[https://raw.githubusercontent.com/git/git/v2.43.0/diff.c]] "if (fill_mmfile(o->repo, &mf1, one) < 0 ||"; the patch path alone [[https://raw.githubusercontent.com/git/git/v2.43.0/diff.c]] "if (o->flags.allow_textconv) {" and [[https://raw.githubusercontent.com/git/git/v2.43.0/diff.c]] "textconv_one = get_textconv(o->repo, one);" (`builtin_diffstat` spans lines 3768 onward of that file, and none of its lines names `textconv`: [[ran]] `awk '/^static void builtin_diffstat/,/^}/' diff.c | grep -n "fill_mmfile\|textconv\|is_binary"` → `32: if (diff_filespec_is_binary(o->repo, one) ||`, `33: …`, `34: data->is_binary = 1;`, `56: if (fill_mmfile(o->repo, &mf1, one) < 0 ||`, `57: …`).
- The byte change does not reach the store [[ran]] `node drv.mjs <HEAD> repos/tc db/tc fresh=1 dump=1` and the same on a copy `tcb` with `diff.foo.binary false` and the textconv set in its local config → both `2 [{'path': '.gitattributes', 'c': 1, …}, {'path': 'f.bin', 'c': 2, 'w': 6.546781215792284e+150}] [{'a': 1, 'b': 2, 'c': 1, …}] []`.
- The code's reason [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@6bbda1d:L510-L510]] "setting that changes the bytes parsed here is pinned by flag."
- The m5 check and the unbounded conversion [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@6bbda1d:L92-L92]] "/** `/^[0-9]+$/` over the field's bytes (m5: `Number` would accept '', ' 12', '1e3', '0x10'). */" and [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@6bbda1d:L211-L211]] "(this.cur as ParsedCommit).ts = Number(f.toString('latin1'));"
- The review's premise [[middleware/context-oracle/docs/reviews/2026-09-26-step-13-build-review.md@f39769a:L194-L194]] "git never emits these."
- The store column [[middleware/context-oracle/ctxoracle/src/stores/migrations/001_phase_a_project.sql@6bbda1d:L82-L82]] "CREATE TABLE commits(hash TEXT PRIMARY KEY, ts INTEGER NOT NULL,"
- git names both object classes [[https://git-scm.com/docs/git-fsck]] "Invalid date format in an author/committer line." and [[https://git-scm.com/docs/git-fsck]] "Invalid date value in an author/committer line."
- Repositories `bdempty` and `bdover` (`mkbad.sh`: a root, then a child written with author `abc +0000` or `99999999999999999999 +0000`, then a normal child):
  - [[ran]] `git log --format='%h [%at] [%ct] %s'` → `9805406 [] [1700000100] bad date [abc +0000]`; `8b19080 [99999999999999999999] [1700000100] bad date [99999999999999999999 +0000]`
  - [[ran]] `git fsck` → `error in commit 9805406b8f91e148731e0c2d95a635102f998994: badDate: invalid author/committer line - bad date`; `error in commit 8b19080ffe6a74aad83891f0e18c6ba93c34e050: badDateOverflow: invalid author/committer line - date causes integer overflow`
- Defect 1 [[ran]] `node drv.mjs <build> repos/bdempty db/bdempty-<build> fresh=1`, then twice without `fresh` → on `6bbda1d` and `HEAD` alike, first pass `{"commitsSeen":2,"included":2,…} … "wm":"8596f9c","mip":"1" … "faults":["miner_unparsed_numstat {\"commit\":\"9805406b8f91e148731e0c2d95a635102f998994\",\"records\":6,\"first\":\"\"}","miner_unparsed_numstat {\"expected\":3,\"read\":2}"]`; passes 2 and 3 `… None 8596f9c 1 2 4` and `… None 8596f9c 1 2 6` (error, watermark, `mip`, commits, faults). `8596f9c` is `HEAD`.
- Defect 2 [[ran]] `node drv.mjs <build> repos/bdover db/bdover-<build> fresh=1`, then twice more → on both builds every pass `err= cannot store REAL value in INTEGER column commits.ts wm= None mip= 1 commits= 0 faults= 0`; the diagnostics folder is empty.
- Defect 3: the read [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@HEAD:L421-L421]] "const refTs = Number(gitOk(repoPath, ['log', '-1', '--no-show-signature', '--format=%ct', head]));". Repository `bdhead`: three normal commits, then `HEAD` written with committer `abc +0000`.
  - [[ran]] `git log -1 --format=%ct HEAD | od -c` → `0000000  \n`
  - [[ran]] `node drv.mjs <build> repos/bdhead db/bdhead-<build> fresh=1 dump=1` → on both builds `"wm":"2de9834","mip":"0","epoch":"-15768000000","ref_ts":"0"`, files `{"path":"a","c":4,"w":1.3093562431584567e+151}`, `{"path":"c","c":1,"w":3.273390607896142e+150}`, every pair `"w":3.273390607896142e+150`, `"faults":[]`. [[ran]] `python3 -c "print(float(2**500))"` → `3.273390607896142e+150`; `python3 -c "print(4*float(2**500))"` → `1.3093562431584567e+151`.
- Defect 4: repository `mid`, `c1`…`c4` = `56799e6 0a79c81 557c520 fcf03f2`, each touching `a` and `b` [[ran]] `PATH="$A/shim:$PATH" CORRUPT=557c520 node drv.mjs <build> repos/mid db/midfull-<build> fresh=1` → on both builds `"commitsSeen":3 … "wm":"fcf03f2","mip":"1" … "faults":["miner_unparsed_numstat {\"commit\":\"0a79c812c3209afc4cfd76fe350f8191f791ee55\",\"records\":6,\"first\":\"X557c5209b1f10903abd1623454269ee37591f218\"}","miner_unparsed_numstat {\"expected\":4,\"read\":3}"]`. `fcf03f2` is `HEAD`.
- The chunk loop's comment [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@HEAD:L592-L592]] "// The watermark commits with its own rows: never ahead of its data."
- The line that writes it [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@HEAD:L593-L593]] "meta.set('last_mined_commit', (pending[next - 1] as PendingCommit).hash);" and the test title it contradicts [[middleware/context-oracle/ctxoracle/test/unit/miner_git_env.test.ts@6bbda1d:L295-L295]] "test('T-13-6e: a stream that yields fewer commits than the range holds never claims HEAD', async () => {"
- Ruling 1 [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B5-verification.md@HEAD:L96-L98]] "The watermark is the `HEAD` resolved once when the pass starts, merge or not. It is keyed to the mined ref (batch 4) and written only in the pass's final transaction."
- Fail-fast [[https://martinfowler.com/ieeeSoftware/failFast.pdf]] "The program continues working right after an error but fails in strange ways later on."

**Final verdict:** replace.

**Correction:** the first audit's correction list, with these changes:
- Drop the test that would kill `notextconv`. Keep `--no-textconv` and
  `--no-ext-diff` as harmless, and say in the comment that they do not change
  `--numstat` output on git 2.43.0 (`builtin_diffstat` does not use textconv).
  Replace the comment's claim that every byte-changing setting is pinned with
  the true list of pinned settings.
- Add a terminal rule for a commit that stays unreadable: it cannot be dated,
  or no entry of it can be read. Record it in `commits` with a counted exclusion
  reason and a fault, and count it toward completeness, so the range completes
  visibly.
- Reject a timestamp above `Number.MAX_SAFE_INTEGER` as malformed. It then
  falls under the terminal rule.
- Validate the `%ct` read with the m5 rule, and fail the pass with a fault on an
  empty or non-decimal value. This covers both `''` → 0 and the UTF-16 `NaN`.
- Add a T-13-6e case for a full pass with a middle commit unreadable. Under
  ruling 1, it asserts that the watermark is not `HEAD`.
- Add cases for the three timestamp defects (an empty `%at`, a 20-digit `%at`,
  an empty `%ct`), built from real malformed objects as above.

**Still at HEAD:** yes. The four added defects were each executed here on the
`HEAD` build. The first audit's items (the `i18n.logOutputEncoding` `NaN`
among them) were reproduced on `HEAD` by both reviews and were not re-run here.
The `HEAD` miner differs from `6bbda1d` only by the inherited-`GIT_DIR` fix
(`gitChildEnv()`). The `notextconv` equivalence is a property of git 2.43.0,
not of either build.

**Owner question:** none.

### E-2
**Ruling:** Keep stands; both reviews agree on the verdict. The second opinion
adds one fact, and it is upheld. The first audit credited the regex's exactness
to the pinning test ("is discriminating"; "rejects 41/63/65-hex bodies, which a
`{40,64}` range would accept"). The test pins only the 64-hex alternative. A
`{40,64}` range and an upper-case 64-hex alternative both survive the miner
suite on both builds. The 41/63/65-hex cases in T-13-1p test the parser's
header, not this trailer. The looser forms change nothing for bodies git
writes, which are lower-case and exactly 40 or 64 hex. So this is a gap in the
test, not a defect in this unit. The test belongs to T-13-1p, whose file E-11
corrects.

**Evidence:**
- The change [[middleware/context-oracle/ctxoracle/src/miner/labels.ts@6bbda1d:L11-L11]] "const REVERT_TRAILER = /^This reverts commit ([0-9a-f]{40}|[0-9a-f]{64})\.$/m;"
- Planted on each build against `dist/test/unit/miner*.test.js` [[ran]] `./mut.sh <build> t40only src/miner/labels.js '10s/\|\[0-9a-f\]\{64\}//' …` → `6bbda1d`: `t40only: exit=1 # pass 47 # fail 1`, `not ok 28 - T-13-1p: a SHA-256 repository mines with no faults`; `HEAD`: `t40only: exit=1 # pass 48 # fail 1`, `not ok 29 - T-13-1p: …`. [[ran]] `./mut.sh <build> t4064 src/miner/labels.js '10s/\(\[0-9a-f\]\{40\}\|\[0-9a-f\]\{64\}\)/([0-9a-f]{40,64})/' …` → `t4064: exit=0 # pass 48 # fail 0` and `# pass 49 # fail 0`. [[ran]] `./mut.sh <build> tupper src/miner/labels.js '10s/\[0-9a-f\]\{64\}/[0-9a-fA-F]{64}/' …` → `tupper: exit=0 # pass 48 # fail 0` and `# pass 49 # fail 0`.

**Final verdict:** keep.

**Correction:** none to this unit. E-11's correction adds a revert-trailer
case with a 41-, 63- or 65-hex name and an upper-case 64-hex name, each of which
must not label the commit.

**Still at HEAD:** the regex is unchanged; the test gap is still present (both
mutants survive on the `HEAD` build).

**Owner question:** none.

### E-3
**Ruling:** Keep stands; both reviews agree on the verdict. The second opinion's
three corrections to the backing are upheld.
1. **The guard accepts 0.** The first audit says the guard stops a value that
   would silently disable the handler, because "SQLite turns busy handling off
   at ≤ 0". But `busyTimeoutMs < 0` lets `0` through, and `0` turns the handler
   off. An explicit 0 means "never wait". That is a legitimate choice, so the
   guard is correct. The reason the first audit gave for it is not.
2. **The effective wait is two busy periods.** The adapter keeps its retry-once
   loop around `BEGIN IMMEDIATE`. Each attempt waits the full `busy_timeout`, so
   `busyTimeoutMs: 5000` gives up after about 10 s. I measured it: a 7 s hold
   commits, and an 11 s hold throws `StoreBusy` at 10,039 ms. The unit's own
   comment is honest about this ("The retry-once rule is unchanged"), and it
   states the value as 5000, not as a duration. So the 10 s wait does not change
   this unit. It changes E-5 and E-16, which state "5 s".
3. The first audit's alternative, the `DatabaseSync` `timeout` option, is
   equivalent, as it says. Nothing verified here changes that.

**Evidence:**
- The guard and the pragma [[middleware/context-oracle/ctxoracle/src/stores/adapter.ts@6bbda1d:L160-L160]] "if (!Number.isInteger(busyTimeoutMs) || busyTimeoutMs < 0) {" and [[middleware/context-oracle/ctxoracle/src/stores/adapter.ts@6bbda1d:L176-L176]] "db.exec(`PRAGMA busy_timeout = ${busyTimeoutMs}`);"
- The retry loop and the comment [[middleware/context-oracle/ctxoracle/src/stores/adapter.ts@6bbda1d:L269-L269]] "for (let attempt = 0; attempt < 2; attempt++) {" and [[middleware/context-oracle/ctxoracle/src/stores/adapter.ts@6bbda1d:L152-L152]] "The retry-once rule is unchanged."
- SQLite [[https://www.sqlite.org/c3ref/busy_timeout.html]] "Calling this routine with an argument less than or equal to zero turns off all busy handlers." and [[https://www.sqlite.org/c3ref/busy_timeout.html]] "After at least \"ms\" milliseconds of sleeping, the handler returns 0 which causes sqlite3_step() to return SQLITE_BUSY."
- The effective bound, in `b7cadj/lock/`. `holder.mjs` takes `BEGIN IMMEDIATE`, inserts, writes a marker, and holds for `HOLD` ms by `Atomics.wait`. `waiter.mjs` waits for the marker, opens `openStore(db, {busyTimeoutMs: 5000})` from the given build, and runs one `transaction` [[ran]] `HOLD=7000 node holder.mjs t.db m & node waiter.mjs t.db m <build> 5000` → `6bbda1d`: `committed after 7052 ms`; `HEAD`: `committed after 7076 ms`. [[ran]] `HOLD=11000 …` → `6bbda1d`: `threw StoreBusy after 10039 ms`; `HEAD`: `threw StoreBusy after 10039 ms`.
- The guard is untested [[ran]] `./mut.sh HEAD noguard src/stores/adapter.js '104s/if \(!Number.isInteger\(busyTimeoutMs\) \|\| busyTimeoutMs < 0\)/if (false)/' "dist/test/unit/*.test.js" "dist/test/conventions/*.test.js"` → `noguard: exit=1 # pass 321 # fail 4`, the four T-1 cases only (survived).

**Final verdict:** keep.

**Correction:** none to this unit. The first audit's stated reason for the
guard is corrected as above. The roughly 10 s effective wait goes into E-5's and
E-16's corrections. The guard's missing test goes into E-13's.

**Still at HEAD:** the unit is unchanged. The two-period wait and the untested
guard both hold on the `HEAD` build.

**Owner question:** none.

### E-4
**Ruling:** The second opinion is upheld: keep → replace. The first audit is
right that a per-stream option is the narrowest way to get a child's stderr, and
that every existing caller behaves as before. It missed a special case that
this diff extends to the new option. When `detached: true` is set, stdio is
`'ignore'`, whatever `stderr` asks for. The caller gets `child.stderr === null`
and no error.

The precedence itself is correct for a detached child. Node says a detached
long-running process stays alive after the parent exits only when its stdio is
not connected to the parent. So a detached child cannot have a pipe. The defect
is that asking for both is accepted silently:
- The option's comment says "`'pipe'`: stderr piped", and does not mention the
  exception.
- The one caller reads the stream through optional chaining
  (`child.stderr?.on`). If it ever combined the two, it would lose git's stderr
  tail with no sign.
- That tail is exactly what this option was added to keep (m2).

Fail-fast says a request the seam cannot honour is refused where it is made. No
caller combines the two today, so the defect is latent, and the fix is one
line. The same silent precedence already applied to `stdout: 'pipe'` before this
diff (from `57bdd4a`). It is fixed with it.

The new option also has no test. Ignoring it, or letting a piped stream beat
`detached`, both survive the whole unit and conventions suites on `HEAD`. The first audit filed that under E-1.
It belongs here, with R-11, which already pins this seam's other option.

**Evidence:**
- The stdio this diff builds [[middleware/context-oracle/ctxoracle/src/util/spawn.ts@6bbda1d:L88-L91]] "opts.detached === true ? 'ignore' : opts.stdout === 'pipe' || opts.stderr === 'pipe' ? ['ignore', opts.stdout ?? 'inherit', opts.stderr ?? 'inherit']"
- The option's contract [[middleware/context-oracle/ctxoracle/src/util/spawn.ts@6bbda1d:L56-L57]] "* `'pipe'`: stderr piped; the caller must drain it (an undrained pipe stalls * the child once its buffer fills)."
- The caller's optional chaining [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@HEAD:L361-L361]] "child.stderr?.on('data', (b: Buffer) => {"
- Node on detached stdio [[https://nodejs.org/docs/latest-v22.x/api/child_process.html]] "When using the detached option to start a long-running process, the process will not stay running in the background after the parent exits unless it is provided with a stdio configuration that is not connected to the parent."
- Executed on each build [[ran]] `node --input-type=module -e "const { oracleSpawn } = await import('<build>/dist/src/util/spawn.js'); const c1 = oracleSpawn('sh',['-c','echo err >&2'],{cwd:'.',detached:true,stderr:'pipe'}); console.log('<b> detached+stderr pipe -> child.stderr is', c1.stderr); c1.unref(); const c2 = oracleSpawn('sh',['-c','echo err >&2'],{cwd:'.',stderr:'pipe'}); let s=''; c2.stderr.on('data',b=>s+=b); c2.on('close',()=>console.log('<b> stderr pipe -> captured', JSON.stringify(s)));"` → `6bbda1d detached+stderr pipe -> child.stderr is null` and `HEAD detached+stderr pipe -> child.stderr is null`; without `detached` → `6bbda1d stderr pipe -> captured "err\n"` and `HEAD stderr pipe -> captured "err\n"`.
- Untested, on `HEAD`, against `"dist/test/unit/*.test.js" "dist/test/conventions/*.test.js"` [[ran]] `./mut.sh HEAD spawnstderr src/util/spawn.js "s/opts.stderr \?\? 'inherit'/'inherit'/" …` → `spawnstderr: exit=1 # pass 321 # fail 4`; `./mut.sh HEAD detachpipe src/util/spawn.js "s/opts.detached === true$/opts.detached === true \&\& opts.stderr !== 'pipe' \&\& opts.stdout !== 'pipe'/" …` → `detachpipe: exit=1 # pass 321 # fail 4`. Both show the four T-1 cases only (survived).
- Fail-fast [[https://martinfowler.com/ieeeSoftware/failFast.pdf]] "The program continues working right after an error but fails in strange ways later on."

**Final verdict:** replace.

**Correction:**
- Keep the `stderr` option, both `'inherit'` defaults and stdin ignored when a
  stream is piped.
- Make `oracleSpawn` throw when `detached: true` is combined with
  `stdout: 'pipe'` or `stderr: 'pipe'`, and say so in both options' comments.
- Add an R-11 leg that pins `stderr: 'pipe'` (the child's stderr arrives, and
  stdout stays inherited) and one that pins the refusal.

**Still at HEAD:** yes. `spawn.ts` is unchanged at `HEAD` (L87–L92 give
`'ignore'` whenever `detached` is true). The silent drop and both surviving
mutants are executed on the `HEAD` build.

**Owner question:** none.

### E-5
**Ruling:** Replace stands; both reviews agree. The second opinion's added fact
is upheld: the wait is not 5 s. Under the adapter's retry-once, a store opened
with `busyTimeoutMs: 5000` gives up after about 10 s (E-3, executed). The
comment and the §9 row say the miner "cannot abort" at 5000, and STATUS says it
"now waits 5 s". STATUS states half the real bound, and "cannot abort" states
no bound at all. Deriving the value, which the first audit's
correction asks for, has to start from the two-period bound.

One settled text must be read with care here. B7b adjudication E-21 says "the
miner yields at least 25 ms between chunks (batch 3)". That is the settled
requirement, not the code. Neither `6bbda1d` nor `HEAD` has any yield in the
chunk loop (coordinator-verified; re-checked below). So the first audit's root
cause stands: the miner itself is a no-gap writer. The 5 s wait does not fix
that, and it is the direction that starves the handler (batch 3's 1 of 15).

**Evidence:**
- The change [[middleware/context-oracle/ctxoracle/src/cli/context.ts@6bbda1d:L38-L43]] "busyTimeoutMs 5000), so the `index`/`init` verbs' miner cannot abort on" and [[middleware/context-oracle/ctxoracle/src/cli/context.ts@6bbda1d:L38-L43]] "const project = openStore(layout.project, { busyTimeoutMs: 5000 });"
- The retry loop that doubles it [[middleware/context-oracle/ctxoracle/src/stores/adapter.ts@6bbda1d:L269-L269]] "for (let attempt = 0; attempt < 2; attempt++) {"
- The effective bound (E-3's holder and waiter) [[ran]] `HOLD=7000 … 5000` → `committed after 7052 ms` (`6bbda1d`), `committed after 7076 ms` (`HEAD`); `HOLD=11000 …` → `threw StoreBusy after 10039 ms` on both. A 7 s hold, which "5 s" says would abort, commits.
- The settled text [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B7b-adjudication.md@HEAD:L376-L376]] "process, and the miner yields at least 25 ms between chunks (batch 3). Against"
- The requirement [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B3-verification.md@HEAD:L160-L160]] "Add an inter-chunk yield of at least 25 ms." and the chunk loop [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@HEAD:L591-L591]] "} while (next < pending.length && performance.now() - started < chunkMs);" [[ran]] `for c in 6bbda1d HEAD; do git show $c:…/src/miner/cochange.ts | grep -c 'setTimeout\|setImmediate\|await new Promise\|scheduler'; done` → `6bbda1d: 0`, `HEAD: 0`.

**Final verdict:** replace.

**Correction:** the first audit's correction, with the value derived and stated
as the effective bound. Under the adapter's retry-once that is two
`busy_timeout` periods, about 10 s at 5000. Reword "cannot abort" as that bound.
Batch 3's ≥ 25 ms inter-chunk yield goes into the miner (E-1's correction
carries it).

**Still at HEAD:** yes. `context.ts` is unchanged, the chunk loop has no yield,
and the 10 s bound is executed on the `HEAD` build.

**Owner question:** none.

### E-6
**Ruling:** The second opinion is upheld: keep → replace. The first audit is
right that T-13-1q separates the old and new rule at `1e3`, and that T-13-1r
catches the per-field flood (both kills reproduce). But each case pins less of
its rule than the rule states, and the part left open is the part real git
exercises.
1. **T-13-1q pins one of the four forms m5 names.** The code's comment names
   `''`, `' 12'`, `'1e3'` and `'0x10'`. A check that accepts `''` alone, or
   `0x…` alone, survives the miner suite on both builds and the whole unit and
   conventions suites on `HEAD`. `''` is the one form
   real git produces: it prints an empty `%at` for a malformed author date
   (E-1). An accepted `''` would read that commit at time 0, with no fault. The
   first audit's reason that the synthetic level is right, "real git does not
   emit these shapes", took the review's false premise as given.
2. **T-13-1r does not pin "until the next *valid* header".** A skip state that
   ends at any `0x1e`-led field survives. That field would then start a commit
   with a fabricated hash. T-13-1p's 41/63/65-hex cases cover the `header`
   state, not the `skip` state.

Each gap closes with more rows in the case that already exists. The plan's
test clause names only `1e3` and "exactly one diagnostic". So the tests meet a
narrower clause than the rule they are named for. The clause is widened with
them.

**Evidence:**
- The rule as the code states it [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@6bbda1d:L92-L92]] "/** `/^[0-9]+$/` over the field's bytes (m5: `Number` would accept '', ' 12', '1e3', '0x10'). */"
- T-13-1q's only data row [[middleware/context-oracle/ctxoracle/test/unit/miner.test.ts@6bbda1d:L286-L286]] "`\x1e${H1}`, '1e3', 'subject one', '', '', '\n1\t0\tone.txt',"
- The plan clause [[middleware/context-oracle/docs/plans/plan-phase-a.md@6d6f21d:L11148-L11150]] "`1e3`-timestamp record is read as a commit, OR the non-header record yields other than exactly one `miner_unparsed_numstat` diagnostic"
- The first audit's reason [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B7c.md@a4264e8:L172-L172]] "Both are pure parser tests over synthetic bytes, the right level, because real git does not emit these shapes."
- git's output for a malformed author date [[ran]] (repository `bdempty`) `git log --format='%h [%at] [%ct] %s'` → `9805406 [] [1700000100] bad date [abc +0000]`.
- The skip state ends only at a valid header [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@6bbda1d:L198-L200]] "case 'skip': if (isHeader(f)) this.startCommit(f); else (this.skipping as MalformedRecord).records += 1;" (compiled `dist/src/miner/cochange.js` L162–L166 on `6bbda1d`, one line later on `HEAD`; the mutants below edit those lines).
- Planted, against `dist/test/unit/miner*.test.js` [[ran]] `./mut.sh 6bbda1d tsemptyonly src/miner/cochange.js '169s/if \(!isDecimal\(f\)\)/if (f.length !== 0 \&\& !isDecimal(f))/' …` → `tsemptyonly: exit=0 # pass 48 # fail 0`; `tshex` (`'169s/if \(!isDecimal\(f\)\)/if (!isDecimal(f) \&\& !\/^0x[0-9a-f]+$\/.test(f.toString()))/'`) → `tshex: exit=0 # pass 48 # fail 0`; `skipany1e` (`'163s/isHeader\(f\)/(f[0] === 0x1e)/'`) → `skipany1e: exit=0 # pass 48 # fail 0`. On `HEAD` (lines 170 and 164) the same three → `exit=0 # pass 49 # fail 0` each, and against the whole unit and conventions suites → `exit=1 # pass 321 # fail 4` each, the four T-1 cases only (survived).
- The kill scheme works on `HEAD` [[ran]] `./mut.sh HEAD tsnumber src/miner/cochange.js "170s/!isDecimal\(f\)/!Number.isInteger(Number(f.toString('latin1')))/" "dist/test/unit/miner*.test.js"` → `tsnumber: exit=1 # pass 48 # fail 1`, `not ok 15 - T-13-1q: a record whose timestamp field is `1e3` is not read as a commit (m5)`.

**Final verdict:** replace.

**Correction:**
- Keep both cases.
- Add `''`, `' 12'` and `'0x10'` rows to T-13-1q, with `''` first, since it is
  git's own output for a malformed date.
- Put a `0x1e`-led field that is not a valid header inside T-13-1r's skipped
  run, and assert that no commit starts there.
- Widen the plan's clause for these two cases to match.

**Still at HEAD:** yes. `miner.test.ts` is unchanged, and all three mutants
survive the `HEAD` suite.

**Owner question:** none.

### E-9
**Ruling:** Keep stands; both reviews agree on the verdict. The second opinion
corrects one stated fact, and the correction is upheld. The first audit said
the global store can stay at the default because the tuning reader only reads,
and "in WAL mode a reader does not take the write lock". That is false. On a
missing key, the tuning reader writes the seed into the global store. This is
batch 6's settled defect, and it is still present. The product's opener also
opens the global store with 5000, so for that store the worker does not match
the product.

The difference is inert here. The harness seeds every key (`seedDefaults`), so
the reader never writes during the test. The diff also changes only the
project-store lines, which do match the product. So the verdict stands, with
its reason corrected.

**Evidence:**
- The worker, as changed [[middleware/context-oracle/ctxoracle/test/unit/miner_chunks_worker.ts@6bbda1d:L62-L63]] "const store = openStore(projectDb, { busyTimeoutMs: 5000 });" and [[middleware/context-oracle/ctxoracle/test/unit/miner_chunks_worker.ts@6bbda1d:L62-L63]] "const global = openStore(globalDb);"; the diff touches only the `store` lines [[ran]] `git show 6bbda1d -- …/test/unit/miner_chunks_worker.ts | grep "^[+-]"` → two `-    const store = openStore(projectDb);` and two `+    const store = openStore(projectDb, { busyTimeoutMs: 5000 });` with their comments.
- The first audit's reason [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B7c.md@a4264e8:L218-L218]] "in WAL mode a reader does not take the write lock, so leaving the global store at the default is consistent."
- The product's opener, both stores [[middleware/context-oracle/ctxoracle/src/cli/context.ts@6bbda1d:L43-L43]] "const global = openStore(layout.global, { busyTimeoutMs: 5000 });"
- The reader writes on a miss [[middleware/context-oracle/ctxoracle/src/stores/dao/tuning.ts@6bbda1d:L112-L114]] "if (v === null) { tuning.set(global, key, seed.value, seed.source); onMissing(key);"
- The harness seeds [[middleware/context-oracle/ctxoracle/test/unit/miner_chunks.test.ts@6bbda1d:L76-L76]] "seedDefaults(g);"

**Final verdict:** keep.

**Correction:** none to this unit. The first audit's reason for the global store
is corrected as above. If the worker later reads an unseeded key, it must open
the global store as the product does.

**Still at HEAD:** the unit is unchanged. The tuning reader's write on a miss is
still present at `HEAD` (batch 6's open item).

**Owner question:** none.

### E-11
**Ruling:** Not second-opinioned, but ruled here because two facts verified in
E-1 change it. Replace stands, and the correction changes.
1. **The `--no-textconv` leg is dropped.** The first audit said
   `--no-textconv` "changes the numstat bytes" and asked for T-13-1o to be
   extended to it. That fact does not hold (E-1): `--numstat` never runs a
   textconv. An external diff driver (`diff.external`, `diff.<driver>.command`)
   leaves the numstat bytes unchanged too. So T-13-1o cannot observe either flag
   through the stream it parses, and no test for them is possible at this level.
   The plan's test spec, though, says T-13-1o "Verifies" all four flags. That
   claims more than any test can show. The spec line must say that it verifies
   `--no-show-signature` and `--root`, and that the other two are defensive with
   no effect on `--numstat` output.
2. **T-13-6e gains a full-pass middle-commit case.** Case (a) corrupts only the
   newest header, where the chunk watermark happens to stop short of `HEAD`. A
   full pass with a middle commit unreadable ends with the watermark at `HEAD`
   (E-1, defect 4). The first audit's added cases were incremental only.
3. **E-2's trailer gap belongs to this file.** T-13-1p pins the 64-hex revert
   trailer but not its exactness (E-2).

The rest of the first audit's correction for this file is untouched: T-13-6e on
ruling 1, the entries-broken and fault-attribution cases, and the fixture
environments.

**Evidence:**
- The first audit's fact and correction [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B7c.md@a4264e8:L258-L258]] "`--no-textconv` changes the numstat bytes (E-1, executed)" and [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B7c.md@a4264e8:L277-L277]] "Extend T-13-1o to `--no-textconv` (and `--encoding` when pinned)."
- The spec's claim [[middleware/context-oracle/docs/plans/plan-phase-a.md@6d6f21d:L11157-L11158]] "**Verifies.** Step 13's pinned `git log` flags (`--no-show-signature --root --no-textconv --no-ext-diff`)"
- No textconv in `--numstat` (E-1's `tc`, `tc2` runs and git's `builtin_diffstat` source). External drivers, repository `tc2` [[ran]] `git $L | md5sum`; `git -c diff.external='echo EXT' $L | md5sum`; `git -c diff.foo.command='echo EXT' $L | md5sum` → `13acfe323ee72fcf25dfe89c6f4198a4` all three.
- Case (a)'s expected watermark [[middleware/context-oracle/ctxoracle/test/unit/miner_git_env.test.ts@6bbda1d:L314-L314]] "assert.equal(schemaMetaDao(s).get('last_mined_commit'), c3, \"(a) last_mined_commit is not c3's hash\");" against E-1's `midfull` run (`"wm":"fcf03f2","mip":"1"`, `fcf03f2` = `HEAD`, both builds).
- E-2's surviving mutants `t4064` and `tupper` (both builds).

**Final verdict:** replace.

**Correction:** the first audit's correction, with these changes:
- Drop "Extend T-13-1o to `--no-textconv`". Keep the `--encoding` leg for when
  E-1 pins it.
- Correct the plan's T-13-1o spec so that it claims only
  `--no-show-signature` and `--root`, and name the other two flags as defensive
  with no observable `--numstat` effect.
- Add a T-13-6e full-pass case with a middle header corrupted. Under ruling 1,
  it asserts that the watermark is not `HEAD` and that the next pass recovers
  every commit.
- Add E-2's trailer-exactness rows to T-13-1p: a 41-, 63- or 65-hex name, and an
  upper-case 64-hex name, none of which may label the commit.

**Still at HEAD:** yes. `miner_git_env.test.ts` is unchanged at `HEAD`, and the
`midfull` result and both trailer mutants reproduce on the `HEAD` build.

**Owner question:** none.

### E-13
**Ruling:** The second opinion is upheld: keep → replace. The first audit is
right that real processes and a marker make T-3-5j deterministic, and that an
ignored option is caught. The default side is pinned exactly elsewhere, by
T-3-1's read-back of 100.

But the patient side does not pin the value. Under the adapter's retry-once, a
store waits two `busy_timeout` periods (E-3). So any value from about 500 ms up
outlasts the 1 s hold. An adapter that caps the option at 600 ms passes. It
passes T-3-5j on both builds, and the whole unit and conventions suites on
`HEAD`. Only a
cap at 400 ms fails T-3-5j. The first audit's "both margins are wide" is exactly
why the case cannot tell 5000 from 600. That is wrong behaviour the test cannot
see, which fails the brief's test for a test. The guard added with the option
has no test anywhere (E-3's `noguard` survives). Both gaps close cheaply inside
this case.

**Evidence:**
- The hold and the patient assertion [[middleware/context-oracle/ctxoracle/test/unit/store_nesting.test.ts@6bbda1d:L399-L399]] "'Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);'," and [[middleware/context-oracle/ctxoracle/test/unit/store_nesting.test.ts@6bbda1d:L437-L437]] "assert.equal(outcome, 'committed', 'a store opened with busyTimeoutMs 5000 did not complete its write while the lock was held for 1 s');"
- The read-back already used for the default [[middleware/context-oracle/ctxoracle/test/unit/stores_adapter.test.ts@6bbda1d:L16-L16]] "assert.equal((store.prepare('PRAGMA busy_timeout').get() as { timeout: number }).timeout, 100);"
- The first audit's reason [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B7c.md@a4264e8:L308-L308]] "so the result does not depend on scheduling, and both margins are wide."
- Planted on each build [[ran]] `./mut.sh <build> cap600 src/stores/adapter.js '123s/\$\{busyTimeoutMs\}/${Math.min(busyTimeoutMs, 600)}/' dist/test/unit/store_nesting.test.js` → `cap600: exit=0 # pass 13 # fail 0` on `6bbda1d` and `HEAD`; `cap400` (`…600` → `…400`) → `cap400: exit=1 # pass 12 # fail 1`, `not ok 13 - T-3-5j: busyTimeoutMs 5000 waits out a 1 s lock and commits; the default raises StoreBusy` on both. [[ran]] `./mut.sh HEAD cap600 … "dist/test/unit/*.test.js" "dist/test/conventions/*.test.js"` → `cap600: exit=1 # pass 321 # fail 4`, the four T-1 cases only (survived).
- The two-period wait (E-3) [[ran]] `HOLD=7000 … 5000` → `committed after 7052 ms`.
- The guard untested (E-3) [[ran]] `noguard` → `# pass 321 # fail 4`, the four T-1 cases only.

**Final verdict:** replace.

**Correction:**
- Keep the two-process case as it is.
- Read back `PRAGMA busy_timeout` on the patient store and assert the value it
  was opened with, whatever E-5's derivation settles.
- Add a case that `busyTimeoutMs` values `1.5` and `-1` throw `RangeError` and
  that `0` is accepted.

**Still at HEAD:** yes. `store_nesting.test.ts` is unchanged, and `cap600` and
`noguard` survive the `HEAD` suite.

**Owner question:** none.

### E-15
**Ruling:** Replace stands; both reviews agree. The second opinion adds two
record lines that state a fix without its limit. Both are upheld, on E-1's
executed runs.
1. **The m5 line** says a malformed timestamp's record "is skipped as one
   malformed item that names its hash". Two limits go unsaid. First, such a
   commit is skipped on every later pass too: a full mine then never completes,
   and every pass is a purged re-mine that adds faults (E-1, defect 1). Second,
   a digit string beyond the INTEGER column passes the check and crashes every
   pass, with no fault (defect 2).
2. **The M2 line** says `last_mined_commit` "stays where the last chunk put
   it". On a full pass with a middle commit unreadable, the last chunk puts it
   at `HEAD` (defect 4). The first audit's M2 limit named only the incremental
   case.

The first audit's items reproduce, and neither review disputes them. They are
the heading's "uncommitted", the false `commitsSeen` sentence, the unstated M2
and m2 limits, and the separate-author claim that went unrecorded.

**Evidence:**
- The m5 line [[middleware/context-oracle/docs/implementation-log.md@6bbda1d:L1148-L1149]] "- **m5:** a timestamp must be all decimal digits. Otherwise the record is skipped as one malformed item that names its hash."
- The M2 line [[middleware/context-oracle/docs/implementation-log.md@6bbda1d:L1121-L1122]] "- `last_mined_commit` stays where the last chunk put it, and `mining_in_progress` stays set on a full pass;"
- E-1's runs, both builds [[ran]] `bdempty` → three passes with `mip` `1` each and faults `2`, `4`, `6`; `bdover` → `err= cannot store REAL value in INTEGER column commits.ts … faults= 0` on every pass; `midfull` → `"wm":"fcf03f2","mip":"1"`, with `fcf03f2` = `HEAD`.
- The heading, unchanged at `HEAD` [[middleware/context-oracle/docs/implementation-log.md@HEAD:L1096-L1096]] "## Step 13 — fixes after the build review — BUILT (2026-09-26, uncommitted, pending independent review)"

**Final verdict:** replace.

**Correction:** the first audit's corrections, plus:
- state m5's two limits: a commit that stays unreadable is refused on every
  pass, so a full mine never completes; and an out-of-range digit string crashes
  every pass with no fault;
- state M2's full-pass limit: the watermark can reach `HEAD` while a middle
  commit is missing.

Each stated limit stays until E-1's correction removes it.

**Still at HEAD:** yes. The log entry is unchanged at `HEAD`, and each limit is
executed on the `HEAD` build.

**Owner question:** none.

### E-16
**Ruling:** Replace stands; both reviews agree. The second opinion's two added
false statements in the same hunk are upheld.
1. **"now waits 5 s off the event path" is false.** The wait is about 10 s:
   two 5 s busy periods under the adapter's retry-once (E-3, executed). The
   same line counts the retry for the old value, since "200 ms" is 2 × 100, but
   not for the new one.
2. **"counted 376 in 2.4 s" is the pre-fix build's time.** The only source for
   the figure is the `57bdd4a` build entry, which records 2,398 ms. The fixes'
   own entry has no real-repository run. The line comes right after "The fixes
   are in", so it reads as the fixed build's result. The fixed build gives the
   same counts. Its time on my run was 3,010 ms (`HEAD` build 3,085 ms), and the
   two reviews measured 3,060 ms and 2,960 ms. Timing depends on the machine,
   so the defect is the attribution, not the number.

The first audit's items stand, and neither review disputes them. They are
"reviewed" (true only of `57bdd4a`), the two review items that were dropped,
and the shallow checkout.

**Evidence:**
- The hunk [[middleware/context-oracle/docs/STATUS.md@7800246:L300-L300]] "**Step 13 (the co-change miner) is built and reviewed (2026-09-26).** It was", [[middleware/context-oracle/docs/STATUS.md@7800246:L306-L307]] "- The fixes are in, including one found by CI: the miner gave up on a busy database after 200 ms, and now waits 5 s off the event path." and [[middleware/context-oracle/docs/STATUS.md@7800246:L308-L308]] "- On this repository the miner read 390 commits and counted 376 in 2.4 s."
- The figure's source, the pre-fix build entry [[middleware/context-oracle/docs/implementation-log.md@7800246:L1075-L1076]] "- First (full) pass: `commitsSeen 390, included 376, excluded 14` (all size), `chunks 1`, `pathsRejected 0`, 2,398 ms." The fixes' entry has no run [[ran]] `git show 7800246:…/docs/implementation-log.md | grep -n "2,398\|2.4 s\|390"` → only `1075:` and `1076:`, both in the `57bdd4a` entry, above the fixes' heading at line 1096.
- The wait (E-3) [[ran]] `HOLD=7000 … 5000` → `committed after 7052 ms`; `HOLD=11000 …` → `threw StoreBusy after 10039 ms`.
- The fixed builds on this checkout at `277b0a2` (the second opinion's clone `b7cso/aa`, read only) [[ran]] `node drv.mjs <6bbda1d> $S/b7cso/aa db/aa-6bbda1d fresh=1 ex=1` → `{"commitsSeen":390,"included":376,"excluded":14,"chunks":2,…},"err":null,"ms":3010,"wm":"277b0a2","mip":"0" … "nFiles":590,"nPairs":4376,"faults":[]`; `<HEAD>` → the same counts, `"ms":3085`.
- Unchanged at `HEAD` [[ran]] `git show HEAD:…/docs/STATUS.md | grep -n "now waits 5 s\|390 commits\|built and reviewed"` → `300:**Step 13 (the co-change miner) is built and reviewed (2026-09-26).** It was`, `307:  database after 200 ms, and now waits 5 s off the event path.`, `308:- On this repository the miner read 390 commits and counted 376 in 2.4 s.`

**Final verdict:** replace.

**Correction:** the first audit's corrections, plus:
- state the off-path wait as about 10 s (two 5 s busy periods under the
  retry-once), or as the value E-5's derivation settles, stated the same way;
- mark 2.4 s as the pre-fix build's (`57bdd4a`) time, or replace it with a run
  of the fixed build.

**Still at HEAD:** yes. STATUS lines 300, 307 and 308 are unchanged at `HEAD`.

**Owner question:** none.

## Entries not re-ruled

These entries were neither second-opinioned nor changed by a verified fact
here. The first audit's verdict stands, and wherever the second opinion judged
the entry, both reviews agree.

- Judged by both, agreed keep, no new fact changes them: E-7, E-8, E-14. The
  second opinion's added points refine the reasoning and change no verdict. In
  E-7 and E-8, its weight-only faults `wincr2` and `wincr1d` and a reversed
  factor sign are killed. In E-14, it measured about 240 B per added commit.
- Judged by the first audit only, replace stands: E-10, E-12, E-17, E-18.
  - Consequence for E-10: T-13-2a's cases sit beside the `%ct` validation that
    E-1's correction now adds (an empty `%ct` gives `ref_ts` 0). Those cases
    are listed in E-1's correction and do not change E-10's.
  - Consequence for E-17: it rests on E-16's "reviewed" claim. E-16's added
    corrections (the 10 s wait, the 2.4 s attribution) do not change E-17's.

## Summary

| Entry | First audit | Second opinion | Final verdict | Ruled here |
|---|---|---|---|---|
| E-1 | replace | replace | replace | yes |
| E-2 | keep | keep | keep | yes |
| E-3 | keep | keep | keep | yes |
| E-4 | keep | replace | replace | yes |
| E-5 | replace | replace | replace | yes |
| E-6 | keep | replace | replace | yes |
| E-7 | keep | keep | keep | no |
| E-8 | keep | keep | keep | no |
| E-9 | keep | keep | keep | yes |
| E-10 | replace | — | replace | no |
| E-11 | replace | — | replace | yes |
| E-12 | replace | — | replace | no |
| E-13 | keep | replace | replace | yes |
| E-14 | keep | keep | keep | no |
| E-15 | replace | replace | replace | yes |
| E-16 | replace | replace | replace | yes |
| E-17 | replace | — | replace | no |
| E-18 | replace | — | replace | no |

Counts, recounted from the sections and the table above:
- Ruled here: 11 entries (E-1, E-2, E-3, E-4, E-5, E-6, E-9, E-11, E-13, E-15,
  E-16).
  - 3 changed from the first audit, keep → replace: E-4, E-6, E-13.
  - 3 keeps stand with their stated reasons corrected: E-2, E-3, E-9.
  - 5 replaces stand with corrections amended: E-1, E-5, E-11, E-15, E-16.
- Final verdicts across all 18 entries:
  - keep 6: E-2, E-3, E-7, E-8, E-9, E-14;
  - replace 12: E-1, E-4, E-5, E-6, E-10, E-11, E-12, E-13, E-15, E-16, E-17,
    E-18;
  - remove 0; undetermined 0.
- The first audit's disputed fact: `--no-textconv` changes the numstat bytes. It
  does not reproduce and is withdrawn (E-1, E-11).
- New miner defects in `6bbda1d`, each executed on both builds, all in E-1:
  - an undatable commit leaves a full mine that never completes, with faults
    growing 2, 4, 6;
  - a 20-digit author date crashes every pass with no fault;
  - an empty `%ct` on `HEAD` silently gives `ref_ts` 0;
  - an incomplete full pass leaves the watermark at `HEAD`.
- Owner questions: none.
- Still at `HEAD` (`6b8af75`), for every defect ruled here: yes. The only fix
  after `6bbda1d` is the miner's inherited `GIT_DIR` (`gitChildEnv()`).
