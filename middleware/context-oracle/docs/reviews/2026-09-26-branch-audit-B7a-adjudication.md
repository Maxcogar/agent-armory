# Branch audit — batch 7, part a (Step 13, the co-change miner): adjudication

This file adjudicates batch 7 part a of the branch audit: commits `a02adc0`,
`e903eda`, `9823853`, `277b0a2` and `57bdd4a`. Its inputs are the first audit
`2026-09-26-branch-audit-B7a.md` (E-1 … E-29) and the second opinion
`2026-09-26-branch-audit-B7a-second-opinion.md` (18 entries). The adjudicator
made none of the changes and wrote neither review. The test applied is the
auditor brief
`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/BRIEF.md`.

Settled and not re-litigated: the B1–B6 verification files. Batch 5's ruling 1
(watermark) and ruling 2 (recency) govern this part. Batch 4's rule governs
`merge-base`: exit 128 is a git fault with no purge, and a branch switch is
`branch_changed`.

**How the work was done.**
- Scratch extractions of `57bdd4a` and `HEAD` (`13d5050`) were made with
  `git archive <commit> middleware/context-oracle/ctxoracle | tar -x`. This
  checkout's `node_modules` was symlinked in, and both were built.
- Baselines: `node --test dist/test/unit/miner*.test.js` gives `# pass 23 # fail 0`
  on `57bdd4a` and `# pass 49 # fail 0` on `HEAD`.
- The miner source and tests are unchanged between the second opinion's `HEAD`
  (`c864510`) and `13d5050`: `git diff --stat c864510 HEAD -- middleware/context-oracle/ctxoracle`
  is empty.
- Scenarios ran on throwaway git repositories under the adjudicator's scratch
  directory. `GIT_DIR`, `GIT_WORK_TREE`, `GIT_INDEX_FILE` and the
  `GIT_CONFIG_*` channel were unset, and global and system configuration were
  `/dev/null`. A driver, `mine.mjs <build> <repo> <db-prefix> [fresh=1]
  [full=1] [tune.<key>=<v>]`, runs one `mineCochange` pass and prints the
  result, the watermark, `mining_in_progress`, the `commits` rows, the
  non-zero `change_count`s, the pairs and the fault codes.
- Planted faults were made on copies of a built tree (`dist/` edited by one
  `sed`), never on the repository.
- Tool versions: git 2.43.0, Node v22.22.2. This repository was not checked
  out, modified or committed.

Entries the second opinion did not judge, and that no verified fact here
changes, are listed at the end and not re-ruled.

### E-1
**Ruling:** Both reviews say replace. Upheld. The second opinion adds one fact,
and it holds: `HEAD`'s completeness check does not catch the skew loss. The
lost commit lies before the resumed range, so the range count and the stream
agree.

**Evidence:**
- The hunk keeps the chunk watermark [[middleware/context-oracle/docs/architecture-phase-a.md@a02adc0:L1499-L1501]] "mine only `watermark..HEAD`, committed in bounded chunks, each chunk advancing the watermark to its own last commit (AD-26)."
- The settled design [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B5-verification.md@HEAD:L96-L98]] "The watermark is the `HEAD` resolved once when the pass starts, merge or not. It is keyed to the mined ref (batch 4) and written only in the pass's final transaction." and [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B5-verification.md@HEAD:L100-L101]] "A crashed pass re-runs its recorded range and skips hashes already in `commits`."
- `HEAD` still writes the watermark per chunk [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@HEAD:L593-L593]] "meta.set('last_mined_commit', (pending[next - 1] as PendingCommit).hash);" and resumes from it [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@HEAD:L462-L462]] "const range = full ? head : `${watermark as string}..${head}`;"
- The completeness check compares against that range only [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@HEAD:L551-L551]] "const complete = result.commitsSeen === rangeCount;"
- My own repository `k`. `root` (2024-01-01) is mined first, into two stores
  per build. Then `p` (2024-03-01; `pf`, `shared`) is committed on `main`. `c`,
  a child of `p` dated 2024-01-15 (`cf`, `shared`), goes on `side`. `q`
  (2024-04-01; `qf`) goes on `main`, then the merge `M`.
  [[ran]] `git log --no-merges --reverse --format='%h %s' HEAD` → `2561267 root`, `36606cd c-child-dated-before-p`, `58a18cb p`, `4782783 q`. The child streams before its parent.
- For each build, one store was stopped with that build's own worker and
  resumed; the other was mined uninterrupted.
  [[ran]] `node <build>/dist/test/unit/miner_chunks_worker.js mine-stop k k-<build>.db k-<build>-g.db k-<build>-diag <36606cd…>` (`miner.chunk_ms` 0) → `injected stop after 36606cd`, on both builds. Then `node mine.mjs <build> k k-<build>` gives:
  - 57bdd4a → `{"res":{"commitsSeen":1,"included":1,"excluded":0},"watermark":"e32c70f","mip":"0","commits":["2561267","36606cd","4782783"],"files":["cf:1","qf:1","r:1","shared:1"],"pairs":["cf+shared:1"],"faults":[]}`
  - HEAD → the identical line.
  - The uninterrupted reference, on both builds → `{"res":{"commitsSeen":3,…},"watermark":"e32c70f","mip":"0","commits":["2561267","36606cd","4782783","58a18cb"],"files":["cf:1","pf:1","qf:1","r:1","shared:2"],"pairs":["cf+shared:1","shared+pf:1"],"faults":[]}`
  - Commit `p` (`58a18cb`) and the pair `shared+pf` are lost. The watermark
    reads `HEAD` (`e32c70f` = `M`). No fault is written on either build.

**Final verdict:** replace.

**Correction:** Keep the already-mined skip, the final-transaction watermark and
the provenance re-point/sweep rule. Replace "each chunk advancing the watermark
to its own last commit" and the `watermark..HEAD` resume with batch 5 ruling 1:
- the watermark is `HEAD` resolved at pass start, keyed to the mined ref, and
  written only in the final transaction;
- the pass's range is recorded when it starts;
- a crashed pass re-runs that range and skips hashes already in `commits`.

Cite the executed skew case as the reason. Add it to T-13-5 or T-13-6 as a test
that fails on the current code.

**Still at HEAD:** yes. The skew loss reproduces byte-for-byte on the `HEAD`
build, and the completeness check stays silent.

**Owner question:** none.

### E-2
**Ruling:** Both reviews say keep. Upheld. The second opinion's added fact, that
the gate holds each declaration, is reproduced: the gate fails when either
declaration is dropped. The first audit asserted that without running it; the
verdict does not change.

**Evidence:**
- The declarations [[middleware/context-oracle/docs/plans/plan-phase-a.md@e903eda:L3086-L3086]] "modify: [middleware/context-oracle/ctxoracle/test/fixtures/generate.ts, middleware/context-oracle/ctxoracle/src/index/indexer.ts]" and [[middleware/context-oracle/docs/plans/plan-phase-a.md@e903eda:L3089-L3089]] "tests: [T-13-1, T-13-2, T-13-3, T-13-4, T-13-5, T-13-6]"
- `indexer.ts` is the miner's caller at this commit [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@e903eda:L276-L276]] "const mine = mineCochange(store, repoPath, { diagnosticsDir: opts.diagnosticsDir, global: opts.global });"
- The gate, run with the commit's own script on a `git archive e903eda` extraction of the plan and the script:
  - [[ran]] `node derive-plan-sections.mjs --check middleware/context-oracle/docs/plans/plan-phase-a.md` → `OK: 40 steps, 13 elements, 158 test specs, 27 probes cited, regions current`, exit 0.
  - `indexer.ts` deleted from line 3086 [[ran]] same command → `STALE: regions out of date: files — run without --check to regenerate`, exit 1.
  - `T-13-6` deleted from line 3089 [[ran]] same command → `ERROR: test T-13-6 is specified but no step references it — orphan spec or missing tests: entry`, exit 1.

**Final verdict:** keep.

**Correction:** none.

**Still at HEAD:** not a defect.

**Owner question:** none.

### E-6
**Ruling:** Both reviews say replace. The verdict is upheld on the second
opinion's reasoning, not the first audit's. The first audit's central fact
is false. It said a 404 on the unpinned branch URLs prints `SKIPPED: network`
and the runner passes the probe. The runner honours `SKIPPED:` only as the first
line of the output. Fetches `b`, `c` and `d` come after two lines are already
printed, so a failure on any of them fails the probe as drift. Three
defects remain:
- the commit's stated intent, that a network failure skips, holds only for fetch
  `a`;
- an HTTP error is labelled `SKIPPED: network`, so the drift report names the
  wrong cause;
- the only masked 404 is on `a`, the URL pinned to a commit.

The diagnosis (an `exit` inside `$(...)` ends only the subshell) is correct.

**Evidence:**
- The intent [[middleware/context-oracle/docs/plans/plan-phase-a.probes/14_docker_node_git.optional.sh@9823853:L3-L5]] "# g runs inside $(...), a subshell, so its own exit cannot end the probe; each # fetch is checked by need() in the main shell instead, so a network failure or # an empty body skips the whole probe rather than reading as drift."
- The helpers [[middleware/context-oracle/docs/plans/plan-phase-a.probes/14_docker_node_git.optional.sh@9823853:L6-L7]] "g(){ curl -sS --fail --max-time 30 \"$1\" 2>/dev/null; } need(){ [ -n \"$1\" ] || { echo \"SKIPPED: network\"; exit 0; }; }"
- Two lines print before fetch `b` [[middleware/context-oracle/docs/plans/plan-phase-a.probes/14_docker_node_git.optional.sh@9823853:L9-L11]] "echo \"22/bookworm Dockerfile at d073523: $(printf '%s' \"$a\" | grep -m1 'NODE_VERSION' | tr -s ' ')\" echo \"node:22.16.0-bookworm FROM: $(printf '%s' \"$a\" | grep -m1 '^FROM')\" b=$(g https://raw.githubusercontent.com/docker-library/buildpack-deps/master/debian/bookworm/Dockerfile); need \"$b\";"
- The runner tests the start of the whole output, with no `m` flag [[middleware/context-oracle/.claude/skills/expert-plan/scripts/run-plan-probes.mjs@9823853:L120-L120]] "if (name.includes('.optional') && /^SKIPPED:/.test(out)) {"
- Executed with the commit's own runner and expectation file, in an isolated
  copy (`plan.md`, `plan.probes/` holding this probe and
  `expected/14_docker_node_git.optional.txt`):
  - [[ran]] `node run.mjs plan.md --only 14_docker_node_git.optional` (as committed) → `ok 14_docker_node_git.optional`, exit 0.
  - Fetch `b`'s path changed to `…/bookworm/MOVED/Dockerfile` (a 404) [[ran]] → `--- actual`, `22/bookworm Dockerfile at d073523: ENV NODE_VERSION 22.16.0`, `node:22.16.0-bookworm FROM: FROM buildpack-deps:bookworm`, `SKIPPED: network`, `1 probe(s) failed`, exit 1.
  - The `docker-library` host changed to `nonexistent.invalid` (a network failure on `b` and `c`) [[ran]] → the same three `actual` lines and `1 probe(s) failed`, exit 1.
  - Fetch `a`'s pinned path changed to `…/22/bookworm/MOVED/Dockerfile` (a 404) [[ran]] → `skip 14_docker_node_git.optional: SKIPPED: network`, `all probes match their recorded expectations`, exit 0.
- Unchanged at `HEAD` [[ran]] `git diff --stat 9823853 HEAD -- <probe> <runner>` → empty, exit 0.

**Final verdict:** replace.

**Correction:**
- Keep the main-shell check.
- Fetch all four bodies before printing anything, so a skip is always the first
  line.
- Print `SKIPPED: network` only on curl's transport exits (6, 7, 28, 35).
- On an HTTP error (curl exit 22), print a line naming the HTTP failure, so the
  runner reports drift with its true cause. This applies to the pinned URL `a`
  too.
- Pin the two branch URLs to commits.

**Still at HEAD:** yes. The probe and runner are byte-identical to `9823853`.

**Owner question:** none.

### E-7
**Ruling:** Both reviews say keep. Upheld. The rows are true and the build
modifies both files. One correction to the second opinion's backing: the gate
checks the `modify` list but not the `provides` list. The `provides` entry
stands because it is true, not because a gate holds it. That does not change
the verdict.

**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@277b0a2:L3088-L3088]] "modify: [middleware/context-oracle/ctxoracle/test/fixtures/generate.ts, middleware/context-oracle/ctxoracle/src/index/indexer.ts, middleware/context-oracle/ctxoracle/src/util/spawn.ts, middleware/context-oracle/ctxoracle/src/stores/dao/files.ts]"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@277b0a2:L3090-L3090]] "provides: [mineCochange, parseNumstatZ, isRevertLabelled, isFixLabelled, files.repointStaleCommitProv]"
- The seam before the step had no piped stdout [[middleware/context-oracle/ctxoracle/src/util/spawn.ts@277b0a2:L74-L74]] "stdio: opts.detached === true ? 'ignore' : 'inherit',"
- The build changes both files [[ran]] `git show 57bdd4a --stat | grep -E "spawn.ts|files.ts|indexer.ts"` → `…/src/index/indexer.ts | 20 +-`, `…/src/stores/dao/files.ts | 16 +`, `…/src/util/spawn.ts | 10 +-`. The method exists [[middleware/context-oracle/ctxoracle/src/stores/dao/files.ts@57bdd4a:L57-L57]] "repointStaleCommitProv(id: number, commitHash: string): boolean;"
- The gate on a `git archive 277b0a2` extraction:
  - [[ran]] `node derive-plan-sections.mjs --check …/plan-phase-a.md` → `OK: 40 steps, 13 elements, 158 test specs, 27 probes cited, regions current`.
  - `spawn.ts` deleted from line 3088 [[ran]] → `STALE: regions out of date: files — run without --check to regenerate`, exit 1.
  - `files.repointStaleCommitProv` deleted from line 3090 [[ran]] → `OK: 40 steps, 13 elements, 158 test specs, 27 probes cited, regions current`, exit 0. The gate does not hold `provides`.

**Final verdict:** keep.

**Correction:** none.

**Still at HEAD:** not a defect.

**Owner question:** none.

### E-9
**Ruling:** Both reviews say keep. Upheld. The second opinion's added fact is
reproduced: at `57bdd4a` no test pins the `--no-merges` count, and at `HEAD`
R-1 and T-13-6a kill its reversal. That is a test-coverage fact about the build
(E-22's territory), not a flaw in this plan sentence.

**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@277b0a2:L3144-L3146]] "oldest first). Before the stream, `git rev-list --count --no-merges <range>` (through `oracleRunSync`) gives the range size — `--no-merges` so the count matches the stream's positions (builder preflight); commits older than the newest"
- Executed on repository `k` (E-1; four non-merge commits and the merge `M`) with `miner.horizon_commits` = 2:
  - [[ran]] `node mine.mjs <57bdd4a> k kh fresh=1 tune.miner.horizon_commits=2` → `"included":2,"excluded":2`, `"commits":["2561267:x-horizon","36606cd:x-horizon","4782783","58a18cb"]`. The newest two non-merge commits (`q`, `p`) are kept.
  - The same on a copy whose count omits `--no-merges` [[ran]] → `"included":1,"excluded":3`, `"commits":["2561267:x-horizon","36606cd:x-horizon","4782783","58a18cb:x-horizon"]`. `p` is wrongly aged out.
- The reversal against the suites [[ran]] `mut.sh <build> count-merges src/miner/cochange.js "s/'rev-list', '--count', '--no-merges', range/'rev-list', '--count', range/" "dist/test/unit/miner*.test.js"`:
  - 57bdd4a → `count-merges: exit=0 # pass 23 # fail 0`;
  - HEAD → `exit=1 # pass 47 # fail 2`, `not ok 17 - T-13-6a: …`, `not ok 37 - R-1: miner.horizon_commits keeps exactly the newest N non-merge commits of the pass range, merges not counted`.

**Final verdict:** keep.

**Correction:** none to this unit. The missing test at `57bdd4a` is recorded
under E-22.

**Still at HEAD:** the test gap is closed at `HEAD` (R-1).

**Owner question:** none.

### E-10
**Ruling:** The second opinion did not judge E-10 by number. Its E-16 item (b)
raises a settled fact that changes the first audit's correction. The first
audit's verdict (replace) stands, and so does its keep of "The skeleton caller".
Its correction offered two options: (a) a full-mine trigger, or (b) amend AD-13
so the cap holds exactly only at a full mine, and accept the drift. Option (b)
is foreclosed. Batch 4 settled that both horizons are enforced on incremental
passes too. So the drift is not a choice left open, and the correction must
enforce the horizons on every pass. The mis-citation of "not recency pruning"
is confirmed, as the first audit found.

**Evidence:**
- The hunk [[middleware/context-oracle/docs/plans/plan-phase-a.md@277b0a2:L3154-L3158]] "**The horizon is judged per pass, over the pass's range:** an incremental pass never ages out commits an earlier pass included — the counts are not pruned (AD-13: \"not recency pruning\"; recency acts through the weights) — and the next full mine applies the horizon to the whole history afresh (builder preflight: this was unstated)."
- AD-13's horizon is over the history [[middleware/context-oracle/docs/architecture-phase-a.md@a02adc0:L1462-L1463]] "history horizon default 5 years or 10,000 commits, whichever first (tunable, `FR-K2`"
- The settled rule [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B4-verification.md@HEAD:L109-L109]] "Both horizons are enforced on incremental passes too."
- `HEAD` still cuts per pass range [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@HEAD:L466-L466]] "const firstInHorizon = rangeCount - horizonCommits; // stream positions below this are horizon-excluded"
- Executed. Repository `hz` has four commits `c1`–`c4`, each touching its own
  file and `x`. It is mined with `miner.horizon_commits` = 3; then `c5` and `c6`
  are added and the store is mined again incrementally.
  - [[ran]] first pass, both builds → `"included":3,"excluded":1`, `x:3`.
  - [[ran]] incremental pass, both builds → `"commitsSeen":2,"included":2`; the store holds five included commits, `"files":["f2:1","f3:1","f4:1","f5:1","f6:1","x:5"]`, and five pairs, with `"faults":[]`.
  - [[ran]] a fresh `HEAD`-build mine of the same history → `"included":3,"excluded":3`, `"files":["f4:1","f5:1","f6:1","x:3"]`, three pairs.
  - The incremental store exceeds the cap by two commits and differs from a
    fresh mine. Nothing records this.

**Final verdict:** replace.

**Correction:**
- Keep "The skeleton caller".
- Rewrite the horizon paragraph to enforce both horizons on every pass,
  per batch 4. The mechanism is an engineering choice, made by written
  comparison. The obvious candidates:
  - subtract aged-out commits' contributions, re-deriving their touched sets
    from git by hash;
  - start a full mine when a pass would push the included set past either
    horizon.
- State the aggregate-storage reason: pair and file sums cannot drop a commit
  without its touched set.
- Drop the "not recency pruning" citation.
- Add a test: incremental passes past the cap leave a store equal to a fresh
  mine.

**Still at HEAD:** yes. It reproduces on the `HEAD` build.

**Owner question:** none.

### E-11
**Ruling:** Both reviews say keep. The verdict is upheld on the second opinion's
narrower reason. The first audit said that without the order rule a new row
"would read as stale", and that the rule "makes the re-point predicate sound".
Executed, the reversed order stores the same provenance. When a new row's own
commit is not yet in `commits`, the re-point rewrites `prov_ref` to the value it
already holds. What the rule secures is that `repointStaleCommitProv`'s "returns
whether it changed" is truthful, and that no redundant `updated_at` write
happens. No production code reads that flag at `HEAD`: the only call discards
it. The sentence claims only the literal ordering property, which is true and
costs nothing. It stands.

**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@277b0a2:L3186-L3188]] "is set when *either* writer creates the row, AD-19; a chunk writes its `commits` rows **before** its `ensureHistoryRow` calls, so a path's first-naming commit is always \"in `commits`\" when checked), its `change_count` is"
- A new row already carries the commit's hash [[middleware/context-oracle/ctxoracle/src/stores/dao/files.ts@57bdd4a:L50-L50]] "commit/untrusted_repo, prov_ref = commitHash); returns its id; never changes an existing row."
- The only call ignores the returned flag [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@HEAD:L572-L572]] "files.repointStaleCommitProv(id, c.hash);"
- Planted: in the compiled `57bdd4a` `writeCommit`, the `commits.upsert` was
  moved after the path loop. It stays before the early return for a pathless
  commit.
  [[ran]] `mut.sh 57bdd4a order src/miner/cochange.js "391s/.*//;397s/return;/{ <upsert> return; }/;406a\\ <upsert>" "dist/test/unit/miner*.test.js"` → `order: exit=0 # pass 23 # fail 0`.
- The same mutant and the unmutated build on repository `k`, fresh stores, with
  `files` provenance dumped [[ran]] → both
  `["cf:commit:36606cd","pf:commit:58a18cb","qf:commit:4782783","r:commit:2561267","shared:commit:36606cd"]`.

**Final verdict:** keep.

**Correction:** none.

**Still at HEAD:** not a defect.

**Owner question:** none.

### E-12
**Ruling:** Both reviews say keep. Upheld. The design is right: the stop was
real, and a separate method keeps Step 9's tested contract. The second
opinion's correction to the first audit's record is reproduced. The
`prov_kind = 'commit'` guard is what keeps the miner off indexed rows, and no
`57bdd4a` test pins it. R-12 pins it at `HEAD`. That is a gap in the build's
tests (recorded under E-18), not a flaw in the plan sentence.

**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@277b0a2:L3219-L3225]] "spans a `git` read. **Commit provenance after a purge:** a new DAO method this step adds, `files.repointStaleCommitProv(id, hash): boolean`, sets an existing row's `prov_ref` to `hash` when its `prov_kind = 'commit'` and its `prov_ref` is not in `commits`, and returns whether it changed; the miner calls it after each `ensureHistoryRow` (whose Step 9 contract — never change an existing row, `T-9-1r15` — stays as it is; builder preflight: re-pointing inside `ensureHistoryRow` would contradict that asserted test); the final transaction"
- The contract kept [[middleware/context-oracle/docs/plans/plan-phase-a.md@277b0a2:L2579-L2579]] "review m1; returns the id; never changes an existing row);"
- Planted on the `57bdd4a` build, miner suite:
  - call removed [[ran]] `mut.sh 57bdd4a rp-nocall src/miner/cochange.js "s/files.repointStaleCommitProv\(id, c.hash\);//" "dist/test/unit/miner*.test.js"` → `exit=1 # pass 22 # fail 1` (`T-13-6c`);
  - `NOT EXISTS` clause removed [[ran]] → `exit=1 # pass 22 # fail 1` (`T-13-6c`);
  - `prov_kind = 'commit'` removed [[ran]] `mut.sh 57bdd4a rp-nokind src/stores/dao/files.js "s/WHERE id = \? AND prov_kind = 'commit'/WHERE id = ?/" …` → `rp-nokind: exit=0 # pass 23 # fail 0`.
- The same `prov_kind` fault on `HEAD` [[ran]] → `exit=1 # pass 48 # fail 1`, `not ok 48 - R-12: the miner re-points only a commit-provenance row; an indexed row's prov_ref is never touched`.

**Final verdict:** keep.

**Correction:** none.

**Still at HEAD:** not a defect. The test gap is closed at `HEAD` (R-12).

**Owner question:** none.

### E-13
**Ruling:** Both reviews say keep. Upheld on the second opinion's corrected
reasoning. T-13-3 compares two stores mined by the same code, so it enforces
determinism only. Any fixed choice passes it, including the oldest hash, and
only a non-deterministic pick fails. The plan sentence claims determinism as
its reason, which is true. "The newest" is the row's first-cited hash and
conflicts with nothing. It was unpinned at `57bdd4a`, and T-13-4e pins it at
`HEAD`.

**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@277b0a2:L3280-L3282]] "first, provenance `commit`/`untrusted_repo` with `prov_ref` = the newest counted hash (the first in `evidence` — deterministic, so two stores mined from the same history agree, `T-13-3`), and `injection_suspect` = the"
- Planted on the compiled `prov_ref: evidence[0],` line:
  - oldest hash, `57bdd4a` [[ran]] `mut.sh 57bdd4a lm-oldest src/miner/cochange.js "s/prov_ref: evidence\[0\],/prov_ref: evidence[evidence.length - 1],/" "dist/test/unit/miner*.test.js"` → `exit=0 # pass 23 # fail 0`;
  - oldest hash, `HEAD` [[ran]] → `exit=1 # pass 48 # fail 1`, `not ok 35 - T-13-4e: every miner landmine is commit/untrusted_repo provenance whose prov_ref is the newest counted hash`;
  - random pick, `57bdd4a`, one run [[ran]] → `exit=1 # pass 22 # fail 1`, `not ok 23 - T-13-3: a history rewrite purges once, re-mines in full, and records history_rewritten`.

**Final verdict:** keep.

**Correction:** none.

**Still at HEAD:** not a defect. "Newest" is pinned at `HEAD` (T-13-4e).

**Owner question:** none.

### E-15
**Ruling:** Both reviews say keep. Upheld. The row names the file, the two
adaptations, the mark and the retiring step. The second opinion's added fact
is reproduced: the stand-in is retired from `indexer.ts` by `HEAD`.

**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@277b0a2:L7072-L7072]] "| `src/index/indexer.ts` — Step 13's skeleton caller (made during Step 13's build, after 1R) | the skeleton `runIndex` builds the miner's `TuningReader` as `tuningReader(global, resolveRepoKey(repoPath).key)` and maps `MineResult.included` onto its existing `IndexResult.mine.commitsIncluded`, so the skeleton `index`/`init` verbs compile unchanged; both marked `SKELETON: 13` (3) | Step 14 |"
- The marks at the build [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@57bdd4a:L45-L45]] "/** SKELETON: 13 — the skeleton's mine summary; Step 13's `MineResult.included`" and [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@57bdd4a:L280-L280]] "// SKELETON: 13 — the miner's TuningReader is bound here to"
- [[ran]] `git grep -n "SKELETON: 13" HEAD -- middleware/context-oracle/ctxoracle/src` → only `src/cli/context.ts:38`, which is a different stand-in and belongs to batch 7 b/c.

**Final verdict:** keep.

**Correction:** none.

**Still at HEAD:** not a defect. The stand-in is retired from `indexer.ts`.

**Owner question:** none.

### E-16
**Ruling:** Both reviews say replace. Upheld. Every first-audit item was
re-run here, and the second opinion's new items are ruled one by one below.
- **First-audit items, confirmed:** `log.showSignature`, `log.showRoot`,
  `GIT_DIR`, SHA-1 only, the per-chunk skew loss (E-1), and the silent
  `rev-parse` return. Each is fixed or not at `HEAD` exactly as the first audit
  states.
- **(a) `merge-base` 128: upheld as a defect, with a narrower reach than the
  second opinion gave it.**
  - The code maps every 128 to `history_rewritten` and purges. A corrupt
    watermark object that still exists (`cat-file -e` exit 0,
    `--is-ancestor` exit 128) is purged and reported as a rewrite, on both
    builds. Batch 4 calls that a git fault, with no purge.
  - The second opinion says R-7 "pins the opposite of batch 4". That is
    overstated. R-7's scenario is an amend plus `gc --prune=now`, so the old
    watermark object is gone and `cat-file -e` exits 1. On the same ref, batch
    4 calls exactly that `history_rewritten`. R-7's asserted outcome (fault,
    purge, full re-mine) is right for its scenario.
  - What is wrong in R-7 is its title and cited reason, "merge-base exit 128
    is a history rewrite". That claim is wider than the scenario, and the code
    behind it has the same over-reach.
- **(b) Horizon on incremental passes: upheld** (settled by batch 4; executed in
  E-10).
- **(c) Shallow-boundary and graft roots: upheld.** Executed below, with a
  sharper fixture than the second opinion's: the fabricated pairs join files
  that never co-changed.
- **(d) `i18n.logOutputEncoding`: upheld.**
- **(e) `--no-merges` untested: upheld.** Ruled in E-22.
- **The memory measurement: upheld.** Ruled in E-29.
- **The "not defects" (`-M` threshold, `diff.renames=copies`, `core.quotePath`
  under `-z`)** are the second opinion's own negative checks. They do not change
  any verdict and were not re-run.

**Evidence:**
- Configuration and environment, both builds (`node mine.mjs <build> <repo> <prefix> fresh=1`):
  - `log.showSignature=true` on repository `sg` (two commits signed through a
    stand-in `gpg.program`) [[ran]] `GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=log.showSignature GIT_CONFIG_VALUE_0=true node mine.mjs …` → 57bdd4a `{"res":{"commitsSeen":0,…},"watermark":"383038f","mip":"0","commits":[],"files":[],"pairs":[],"faults":["miner_unparsed_numstatx12"]}`; HEAD `{"res":{"commitsSeen":2,"included":2,…},"files":["f:2"],…,"faults":[]}`.
  - `log.showRoot=false` on repository `ra` (two commits, each touching `a` and `b`) [[ran]] → 57bdd4a `"files":["a:1","b:1"],"pairs":["a+b:1"],"faults":[]`; HEAD `"files":["a:2","b:2"],"pairs":["a+b:2"],"faults":[]`.
  - `GIT_DIR=<repo rb>/.git` with `cwd` `ra` [[ran]] → 57bdd4a `"commits":["0b8803e","67ee65f","88de1d3","caf643f"],"files":["zz:4"]` (repository `rb`'s commits); HEAD `"commits":["dbcc689","e5c8dc7"],"files":["a:2","b:2"]`.
  - `--object-format=sha256` repository [[ran]] → 57bdd4a `"commitsSeen":0 … "watermark":"8e2bb86" … "faults":["miner_unparsed_numstatx12"]`; HEAD `"commitsSeen":2 … "faults":[]`.
  - git's documentation [[https://git-scm.com/docs/git-config]] "log.showSignature If true, makes git-log[1], git-show[1], and git-whatchanged[1] assume --show-signature." and [[https://git-scm.com/docs/git]] "If the GIT_DIR environment variable is set then it specifies a path to use instead of the default .git for the base of the repository."
- The unpinned stream at the build [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@57bdd4a:L445-L445]] "['log', '--no-merges', '-M', '-z', '--numstat', '--reverse', '--format=%x1e%H%x00%at%x00%s%x00%b%x00', range]," and the pins at `HEAD` [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@HEAD:L516-L521]] "'log', '--no-show-signature', '--root', '--no-textconv', '--no-ext-diff', '--no-merges',"
- `rev-parse`, unchanged at `HEAD` [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@HEAD:L416-L417]] "const headProbe = git(repoPath, ['rev-parse', '--verify', '-q', 'HEAD']); if (headProbe.status !== 0) return result;"
  - [[ran]] `git rev-parse --verify -q HEAD; echo status=$?` → unborn repository `status=1`; plain directory `status=128` (`fatal: not a git repository …`); repository with `.git/objects` removed `status=128`.
  - Both builds on the last two [[ran]] → `{"res":{"commitsSeen":0,"included":0,"excluded":0},"commits":[],"files":[],"pairs":[],"faults":[]}`. No fault, no error.
  - Batch 2 settled the distinction [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B2-verification.md@HEAD:L88-L88]] "Fixes: `git rev-parse --verify --quiet HEAD` (unborn HEAD exits 1, a non-repo exits 128)"
- (a) The code at both commits [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@57bdd4a:L371-L372]] "if (anc.status === 1 || anc.status === 128) { // The watermark is not an ancestor (1) or the object is gone (128): G4." and [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@HEAD:L436-L440]] "if (anc.status === 1 || anc.status === 128) { // The watermark is not an ancestor (1) or the object is gone (128): G4. result.rewritten = true; full = true; recordFault(store, opts.diagnosticsDir, { code: 'history_rewritten', detail: { oldWatermark: watermark, newHead: head } });"
- (a) The settled rule [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B4-verification.md@HEAD:L106-L108]] "- Same ref, and `--is-ancestor` or `cat-file -e` exits 1: `history_rewritten`. - Different ref: a `branch_changed`-class diagnostic, with its cost stated. - Any other status: a git fault, with no purge."
- (a) Executed on repository `cb`. `base` on `main`, then `feat1` on `feat`, is
  mined with `feat` checked out (watermark `4b7a155`). Then `main` is checked
  out and `main2` committed. The watermark's loose object is overwritten with
  garbage.
  - [[ran]] `git cat-file -e <W>; echo $?` → `0`; `git merge-base --is-ancestor <W> HEAD; echo $?` → `128`.
  - [[ran]] both builds → `"watermark":"c4da410","commits":["7bc7ef5","c4da410"],"files":["a:2","b:2"],"pairs":["a+b:2"],"faults":["history_rewrittenx1"]`. A corrupt object on another branch is recorded as a history rewrite, and the store is purged and re-mined.
- (a) R-7's scenario is a pruned watermark on the same ref [[middleware/context-oracle/ctxoracle/test/unit/miner_review.test.ts@HEAD:L212-L214]] "fixtureGit(repo, ['commit', '-q', '--amend', '-m', 'c3 amended'], { day: 3, sec: 30 }); fixtureGit(repo, ['reflog', 'expire', '--expire=now', '--all']); fixtureGit(repo, ['gc', '-q', '--prune=now']);" and it asserts `cat-file -e` exit 1 [[middleware/context-oracle/ctxoracle/test/unit/miner_review.test.ts@HEAD:L221-L221]] "assert.equal(status, 1, 'fixture: the old HEAD object is gone');" Its title claims more [[middleware/context-oracle/ctxoracle/test/unit/miner_review.test.ts@HEAD:L201-L201]] "test('R-7: a watermark whose object is gone (merge-base exit 128) is a history rewrite: fault, purge, full re-mine', async () => {"
- (b) See E-10: an incremental pass leaves five included commits under a cap of
  three, `x:5` against a fresh mine's `x:3`, with no fault, on both builds.
- (c) The spec's design condition [[middleware/context-oracle/docs/specs/spec-context-oracle.md@HEAD:L54-L55]] "The tool must operate on repositories with **thin commit history** (new repos, shallow clones) as a design condition"
- (c) The architecture knows the boundary is not a root [[middleware/context-oracle/docs/architecture-phase-a.md@HEAD:L137-L137]] "A shallow clone's \"roots\" are boundary commits and vary per clone depth"
- (c) git's documentation: a shallow clone is truncated [[https://git-scm.com/docs/git-clone]] "Create a shallow clone with a history truncated to the specified number of commits." and a root is diffed against the empty tree [[https://git-scm.com/docs/git-config]] "log.showRoot If true, the initial commit will be shown as a big creation event. This is equivalent to a diff against an empty tree."
- (c) Executed, shallow clone. The source adds `a`, `b`, `c`, `d`, `e` in five
  separate commits, then four commits touch only `a`.
  `git clone --depth 2 file://…` gives boundary `06f37aa` (`a3`) and `be7f931`
  (`a4`).
  - [[ran]] `git log --numstat --format='%h %s'` in the clone → `a3` shows `4 0 a`, `1 0 b`, `1 0 c`, `1 0 d`, `1 0 e`.
  - [[ran]] both builds → `"commits":["06f37aa","be7f931"],"files":["a:2","b:1","c:1","d:1","e:1"],"pairs":["a+b:1","a+c:1","a+d:1","a+e:1","b+c:1","b+d:1","b+e:1","c+d:1","c+e:1","d+e:1"],"faults":[]`.
  - After `git fetch --unshallow` (`--is-shallow-repository` → `false`), an
    incremental pass [[ran]] on both builds → `"commitsSeen":0`, every row
    unchanged.
  - A fresh `HEAD`-build mine of the unshallowed clone [[ran]] → `"commitsSeen":9 … "files":["a:5","b:1","c:1","d:1","e:1"],"pairs":[],"faults":[]`.
  - The ten pairs are fabricated (no two of these files ever co-changed). They
    survive the unshallow, and no fault is written.
- (c) Executed, graft [[https://git-scm.com/docs/git-replace]] "Create a graft commit. A new commit is created with the same content as"
  - Repository `gr`: `r1` adds `a`, `r1b` adds `b`, `r2` touches only `b`, `r3`
    touches `a`. Then `git replace --graft HEAD~1` makes `r2` a root.
  - [[ran]] both builds → `"commits":["6f71524","7adcd33"],"files":["a:2","b:1"],"pairs":["a+b:1"],"faults":[]`.
  - With `GIT_NO_REPLACE_OBJECTS=1` [[ran]] → `"commitsSeen":4 … "files":["a:2","b:2"],"pairs":[]`.
- (d) git's documentation [[https://git-scm.com/docs/git-config]] "i18n.logOutputEncoding Character encoding the commit messages are converted to when running git log and friends." and the flag that pins it [[https://git-scm.com/docs/git-log]] "Commit objects record the character encoding used for the log message in their encoding header; this option can be used to tell the command to re-code the commit log message in the encoding preferred by the user."
- (d) Executed on `ra` with `GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=i18n.logOutputEncoding GIT_CONFIG_VALUE_0=UTF-16`:
  - [[ran]] 57bdd4a → `"commitsSeen":0 … "watermark":"e5c8dc7","mip":"0","commits":[] … "faults":["miner_unparsed_numstatx128"]`. Nothing is mined and the watermark is at `HEAD`.
  - [[ran]] HEAD → `"commitsSeen":0 … "mip":"1","commits":[] … "faults":["miner_unparsed_numstatx2"]`, no watermark. A second pass → the same, with `x4`. The failure is visible, but every pass fails.
  - [[ran]] `git -c i18n.logOutputEncoding=UTF-16 log -1 --format='%x1e%H%x00%s%x00' | od -c` → `377 376 036 \0 e \0 5 \0 …` (a BOM, then UTF-16); with `--encoding=UTF-8` added → `036 e 5 c 8 …`.

**Final verdict:** replace.

**Correction:**
- **Done at `HEAD`:** configuration and environment pins; the range-completeness
  check; the SHA-256 header; stderr carried into errors; the `refTs` cap and
  re-based epoch; the resolved hash used throughout.
- **Still to do:**
  - Ruling 1's watermark (E-1).
  - `rev-parse`: exit 1 means nothing to mine; exit 128 is recorded as a git
    fault and the pass fails visibly.
  - On `merge-base` 128, run `cat-file -e <watermark>`:
    - exit 1 on the same ref is `history_rewritten` (R-7's case, which keeps its
      assertions; its title and cited reason are corrected to "watermark object
      pruned");
    - anything else is a git fault with no purge;
    - a different ref is `branch_changed` (batch 4).
    - Add the corrupt-object case as a test.
  - Enforce the horizons on incremental passes (E-10).
  - Shallow and grafted roots. Detect them (`git rev-parse
    --is-shallow-repository` and `.git/shallow`; `git replace -l` or the
    `--no-replace-objects` choice stated). Exclude their diffs as
    `exclude_reason` `boundary`, and record the exclusion in a fault or in
    `status`. When the repository stops being shallow, force a full mine.
  - Pin `--encoding=UTF-8` on the stream.
  - A test that fails when `--no-merges` is removed (E-22).

**Still at HEAD:** partly.
- Fixed: `log.showSignature`, `log.showRoot`, `GIT_DIR`, SHA-256, stderr, the
  completeness check and the epoch.
- Still present, each reproduced on the `HEAD` build: the skew loss, the silent
  `rev-parse` return, the 128-as-rewrite purge, the per-pass horizon, the
  shallow and graft fabrication, the unpinned encoding, and the untested
  `--no-merges`.

**Owner question:** none. The first audit lists the rename design as an open
owner question. The message it cites puts renames under "What I'll do", not
under "Needs your yes":
[[/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/owner-messages.md@FILE:L343-L343]] "- **#6:** build rename-following into Step 13."
So renames are an engineering decision, announced and then not built (the plan
and code keep the split). They go to the correction pass as that divergence,
with a stated decision. Neither review disputed this item, and it is not
re-ruled here.

### E-17
**Ruling:** The second opinion is right: keep is overturned to replace. The
predicates implement the plan's two rules, and whole-token, case-insensitive
fix matching is correct. But AD-15 defines a revert-labelled commit as "a commit
git itself generated as a revert". git generates two documented revert
messages. The second, `--reference`, can be made the default by
`revert.reference`. Its body line is `This reverts commit <abbrev> (<subject>,
<date>).`, and its subject is a placeholder the user replaces. Neither rule
matches it, so on such a repository no `revert` label and no `revert_chain`
landmine is ever made, silently.
- This is not the trailer item batch 3 withdrew. That ruling settled that the
  *citation* of the default message is backed. It did not consider the second
  format.
- The plan narrowed AD-15's definition to one format without saying so, and the
  code inherits the narrowing.

**Evidence:**
- AD-15's definition at the build [[middleware/context-oracle/docs/architecture-phase-a.md@57bdd4a:L1747-L1747]] "**The labels.** *Revert-labelled* = a commit git itself generated as a revert:"
- The plan's rule [[middleware/context-oracle/docs/plans/plan-phase-a.md@277b0a2:L3169-L3171]] "`^This reverts commit [0-9a-f]{40}\.$` (git-revert(1)'s default message), or, as the fallback for a trailer-less message, the subject starts with `Revert \"` or `Reapply \"`"
- The code [[middleware/context-oracle/ctxoracle/src/miner/labels.ts@57bdd4a:L10-L10]] "const REVERT_TRAILER = /^This reverts commit [0-9a-f]{40}\.$/m;" and [[middleware/context-oracle/ctxoracle/src/miner/labels.ts@57bdd4a:L21-L23]] "if (REVERT_TRAILER.test(body)) return true; return subject.startsWith('Revert \"') || subject.startsWith('Reapply \"');"
- git's documentation [[https://git-scm.com/docs/git-revert]] "The revert.reference configuration variable can be used to enable this option by default."
- Executed with git's own `revert`, in throwaway repository `rv` (`change a`, `change b`, then three reverts):
  - [[ran]] `git revert --no-edit HEAD~1; git revert --no-edit HEAD; git revert --no-edit --reference HEAD~3; git log --format='%h|%s|%b'` → `ca7e6d9|# *** SAY WHY WE ARE REVERTING ON THE TITLE LINE ***|This reverts commit f936044 (change a, 2024-01-01).`, `d4dd226|Reapply "change a"|This reverts commit 11b610589b9a7dbfb39e947ed82321ab5b1c53ed.`, `11b6105|Revert "change a"|This reverts commit f936044573e008281ad0cd377744843dee41853c.`
  - The built predicate over each message [[ran]] `node lab.mjs <build> rv` → on both builds `"# *** SAY WHY WE ARE REVERTING ON THE TITLE LINE ***" false`, `"Reapply \"change a\"" true`, `"Revert \"change a\"" true`.
- At `HEAD` the trailer gained only the SHA-256 length [[middleware/context-oracle/ctxoracle/src/miner/labels.ts@HEAD:L11-L11]] "const REVERT_TRAILER = /^This reverts commit ([0-9a-f]{40}|[0-9a-f]{64})\.$/m;"

**Final verdict:** replace.

**Correction:**
- Keep both existing rules and the fix predicate.
- Add git's reference-format body line as a recognised revert line:
  `^This reverts commit [0-9a-f]{4,64} \(.+\)\.$`, multi-line.
- State it in AD-15's definition and in the plan's Step 13 rule, with this
  execution as the evidence.
- Add a T-13-4 case: a `--reference` revert with an edited subject is labelled.

**Still at HEAD:** yes. The predicate returns `false` for the reference-format
revert on the `HEAD` build.

**Owner question:** none.

### E-18
**Ruling:** Both reviews say keep. Upheld. The SQL is the plan's predicate. The
first audit's "Would be wrong if" said rows with other `prov_kind` values are
protected, and that "T-13-6c and the review's R-12 would fail". That is false
for the build: at `57bdd4a` T-13-6c passes with the guard removed, and R-12 does
not exist yet. The code needs no change. The missing test was the build's
gap, and R-12 closes it at `HEAD`.

**Evidence:**
- [[middleware/context-oracle/ctxoracle/src/stores/dao/files.ts@57bdd4a:L140-L142]] "`UPDATE files SET prov_ref = ?, updated_at = ? WHERE id = ? AND prov_kind = 'commit' AND NOT EXISTS (SELECT 1 FROM commits c WHERE c.hash = files.prov_ref)`"
- The returned flag [[middleware/context-oracle/ctxoracle/src/stores/dao/files.ts@57bdd4a:L145-L145]] "return Number(r.changes) > 0;"
- [[ran]] `mut.sh 57bdd4a rp-nokind …` → `exit=0 # pass 23 # fail 0`; on `HEAD` → `exit=1 # pass 48 # fail 1` (R-12). These are the runs in E-12.
- The build review's own row [[middleware/context-oracle/docs/reviews/2026-09-26-step-13-build-review.md@HEAD:L333-L333]] "| D2 | repoint ignores prov_kind | `src/stores/dao/files.ts:141` | survived | killed | R-12 |"

**Final verdict:** keep.

**Correction:** none.

**Still at HEAD:** not a defect. The test is added at `HEAD` (R-12).

**Owner question:** none.

### E-20
**Ruling:** Both reviews say keep. Upheld. The §9 row names a two-argument
`tuningReader(global, key)`. The build passes a third argument, `onMissing`,
which records `tuning_missing`. The reader's signature requires that argument,
so passing it is not scope creep. The diff has three hunks: the imports, the
`mine` type, and the miner block.

**Evidence:**
- [[middleware/context-oracle/ctxoracle/src/stores/dao/tuning.ts@57bdd4a:L102-L102]] "export function tuningReader(global: Store, projectKey: string, onMissing: (key: string) => void): TuningReader {"
- [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@57bdd4a:L284-L288]] "const mineTuning = tuningReader(opts.global, resolveRepoKey(repoPath).key, (k) => recordFault(store, opts.diagnosticsDir, { code: 'tuning_missing', detail: { key: k } }) ); const mined = await mineCochange(store, repoPath, { tuning: mineTuning, diagnosticsDir: opts.diagnosticsDir, full: opts.full }); const mine = { commitsIncluded: mined.included };"
- [[ran]] `git diff 277b0a2 57bdd4a -- middleware/context-oracle/ctxoracle/src/index/indexer.ts | grep "^@@"` → `@@ -15,13 +15,14 @@ import …`, `@@ -41,7 +42,10 @@ export interface IndexResult {`, `@@ -273,7 +277,15 @@ export async function runIndex(…`.
- The row writes the call in short form, with two arguments. The same plan
  gives the reader's full signature, so the third argument is not a departure
  from the plan [[middleware/context-oracle/docs/plans/plan-phase-a.md@277b0a2:L2954-L2954]] "- **`tuningReader(global: Store, projectKey: string, onMissing: (key:"

**Final verdict:** keep.

**Correction:** none.

**Still at HEAD:** not a defect.

**Owner question:** none.

### E-21
**Ruling:** The second opinion is right: keep is overturned to replace. The
generators' data is correct, and the tests pass on it. But this commit's diff
exports the fixture `git` helper as running with "isolated git config", and it
adds two more `env` spreads of the same shape (the merge and the fast-import).
That environment passes the runner's repository-selecting variables and the
command-line configuration channel straight through. git exports `GIT_DIR` and
`GIT_WORK_TREE` to hooks, so a suite run from a pre-commit or pre-push hook
aims the generator at the developer's own repository. Executed, the
generator re-initialised the outer repository and wrote five keys into its
local configuration, `commit.gpgsign=false` among them, before failing. The
first audit's own "Would be wrong if" ("a fixture depended on the runner's own
git configuration") is met. A second execution shows it: a command-line
`commit.gpgsign=true` overrides the fixture's local `false`, and generation
fails.

**Evidence:**
- The helper's claim, added by this commit [[middleware/context-oracle/ctxoracle/test/fixtures/generate.ts@57bdd4a:L118-L119]] "// mine; T-13-5 clones miner-large). Same pinned identity, dates, and isolated // git config as the generators, so a test's own commits are deterministic too."
- The environment it passes [[middleware/context-oracle/ctxoracle/test/fixtures/generate.ts@57bdd4a:L35-L38]] "env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null',", and the same shape added by this commit [[middleware/context-oracle/ctxoracle/test/fixtures/generate.ts@57bdd4a:L200-L200]] "env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null', ...dateEnv(10) },"
- The writes it makes [[middleware/context-oracle/ctxoracle/test/fixtures/generate.ts@57bdd4a:L48-L51]] "git(dir, ['init', '-q', '-b', 'main']); git(dir, ['config', 'user.name', AUTHOR_NAME]); git(dir, ['config', 'user.email', AUTHOR_EMAIL]); git(dir, ['config', 'commit.gpgsign', 'false']);"
- git's hook contract [[https://git-scm.com/docs/githooks]] "Environment variables, such as GIT_DIR, GIT_WORK_TREE, etc., are exported so that Git commands run by the hook can correctly locate the repository."
- Executed. The throwaway repository `outer` has one commit and only the four
  default local keys.
  - [[ran]] `GIT_DIR=<outer>/.git GIT_WORK_TREE=<outer> node -e "import('<57bdd4a>/dist/test/fixtures/generate.js').then(m=>m.generateFixture('miner-denominator','<fxout>'))"` → `warning: re-init: ignored --initial-branch=main`, `ERR Command failed: git commit -q -m a and b 0`.
  - Then [[ran]] `git -C outer config --list --local` → the four defaults plus `core.autocrlf=false`, `user.name=Ctxoracle Fixture`, `user.email=fixtures@ctxoracle.test`, `commit.gpgsign=false`, `gc.auto=0`.
  - The same on the `HEAD` build, on a fresh `outer2` [[ran]] → the same error, and the same `user.name`, `user.email`, `commit.gpgsign=false`, `gc.auto=0` keys written.
- The configuration channel [[ran]] `GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=commit.gpgsign GIT_CONFIG_VALUE_0=true node -e "…generateFixture('miner-denominator','<fx-sig>')…"` → `error: gpg failed to sign the data:` … `ERR Command failed: git commit -q -m a and b 0`. Then `git -C fx-sig config --local commit.gpgsign` → `false`. The local pin is overridden.
- Production git calls at `HEAD` already strip these variables [[middleware/context-oracle/ctxoracle/src/identity/git_layout.ts@HEAD:L79-L79]] "const REPO_SELECTING_ENV = ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_OBJECT_DIRECTORY', 'GIT_COMMON_DIR'] as const;"

**Final verdict:** replace.

**Correction:**
- Keep the generators and their data.
- Give the fixture `git` helper, and the two inline `env` objects, an
  environment built from `process.env` with these removed:
  - `GIT_DIR`, `GIT_WORK_TREE`, `GIT_INDEX_FILE`, `GIT_OBJECT_DIRECTORY`,
    `GIT_COMMON_DIR`;
  - `GIT_CONFIG_COUNT`, `GIT_CONFIG_PARAMETERS`, and every `GIT_CONFIG_KEY_*`
    and `GIT_CONFIG_VALUE_*`.
- Make the comment's "isolated" true.
- Add a test: generation under a set `GIT_DIR` leaves the named repository's
  configuration unchanged.

**Still at HEAD:** yes. It reproduces on the `HEAD` build.

**Owner question:** none.

### E-22
**Ruling:** Both reviews say replace. Upheld, with both of the second opinion's
additions confirmed:
- the `--no-merges` removal survives the whole `HEAD` suite (49/49), so the
  merge assertion is still missing there;
- the horizon count's `--no-merges` reversal survives T-13-1 at `57bdd4a` and is
  killed at `HEAD` by R-1 (see E-9).

On repository `k`, the `HEAD` mutant writes the merge as an included `commits`
row and leaves `mining_in_progress` at `'1'`. It also records a completeness
fault, and no test asserts that fault's absence.

**Evidence:**
- The merge check tests pair citation only [[middleware/context-oracle/ctxoracle/test/unit/miner.test.ts@57bdd4a:L113-L116]] "const cited = store .prepare('SELECT count(*) AS n FROM cochange_pairs WHERE last_commit IN (?, ?, ?)') .get(ancient, bulk, merge) as { n: number }; assert.equal(cited.n, 0, 'no pair row cites an excluded commit');"
- Planted, `--no-merges` removed from the stream:
  - [[ran]] `mut.sh 57bdd4a M3 src/miner/cochange.js "s#\['log', '--no-merges', '-M'#['log', '-M'#" "dist/test/unit/miner*.test.js"` → `M3: exit=0 # pass 23 # fail 0`;
  - [[ran]] `mut.sh HEAD M3 src/miner/cochange.js "446s#'--no-merges',##" …` → `M3: exit=0 # pass 49 # fail 0`.
- What the `HEAD` mutant does on repository `k` (four non-merge commits and the merge `e32c70f`), fresh store:
  - [[ran]] `node mine.mjs <HEAD-M3> k km3 fresh=1` → `{"res":{"commitsSeen":5,"included":5,"excluded":0},"watermark":"e32c70f","mip":"1","commits":["2561267","36606cd","4782783","58a18cb","e32c70f"],…,"faults":["miner_unparsed_numstatx1"]}`.
  - Unmutated `HEAD` [[ran]] → `{"res":{"commitsSeen":4,"included":4,"excluded":0},"watermark":"e32c70f","mip":"0","commits":["2561267","36606cd","4782783","58a18cb"],…,"faults":[]}`.
- The horizon count: [[ran]] `mut.sh <build> count-merges …` → 57bdd4a `exit=0 # pass 23 # fail 0`; HEAD `exit=1 # pass 47 # fail 2` (R-1, T-13-6a). These are the runs in E-9.

**Final verdict:** replace.

**Correction:**
- Keep every existing assertion.
- Add "the merge commit has no `commits` row" and "`commits.countIncluded()`
  equals the non-merge count". Not done at `HEAD`.
- Add a horizon-by-count case over a history with a merge. Done at `HEAD` by
  R-1.
- Name the `commits`-row absence in the plan's T-13-1 Fails-when.

**Still at HEAD:** the merge assertion is still missing (M3 survives 49/49). The
count case is closed by R-1.

**Owner question:** none.

### E-25
**Ruling:** Both reviews say keep. Upheld. The instrument's one load-bearing
property is that the stopped chunk is durable before the throw. It is pinned:
a planted pre-commit throw fails T-13-6b. The same worker stopped exactly after
the named chunk in E-1's skew reproduction, on both builds.

**Evidence:**
- [[middleware/context-oracle/ctxoracle/test/unit/miner_chunks_worker.ts@57bdd4a:L37-L48]] "transaction<T>(fn: () => T, opts?: { onBusyRetry?: () => void }): T { depth += 1; let out: T; try { out = inner.transaction(fn, opts); } finally { depth -= 1; } if (depth === 0) { const row = inner.prepare(\"SELECT value FROM schema_meta WHERE key = 'last_mined_commit'\").get() as { value: string | null } | undefined; if (row?.value === stopHash) throw new Error(`injected stop after ${stopHash}`); }"
- Planted in the compiled worker: the check moved inside `inner.transaction` at
  depth 1, so it throws before the commit, and the depth-0 check disabled.
  [[ran]] `mut.sh 57bdd4a worker-precommit test/unit/miner_chunks_worker.js "39s#…#…#;44s/depth === 0/false/" "dist/test/unit/miner_branches.test.js"` → `worker-precommit: exit=1 # pass 2 # fail 1`, `not ok 2 - T-13-6b: a pass stopped after the m2 chunk and resumed counts every commit once`.
- The assertion that kills it [[middleware/context-oracle/ctxoracle/test/unit/miner_branches.test.ts@57bdd4a:L164-L164]] "assert.equal(withStore(dbs, (s) => schemaMetaDao(s).get('last_mined_commit')), h.m2, 'the stopped pass left its watermark at m2');"
- E-1 [[ran]] (above): `injected stop after 36606cd` on both builds.

**Final verdict:** keep.

**Correction:** none.

**Still at HEAD:** not a defect.

**Owner question:** none.

### E-27
**Ruling:** The second opinion is right: keep is overturned to replace. The
brief asks whether a test fails when the behaviour is wrong. On `57bdd4a` four
behaviours that T-13-4 exists to pin can each be broken with the whole
23-test miner suite still passing:
- AD-15's primary revert signal (the trailer rule);
- the any-line reading of the trailer (the `m` flag);
- the `Reapply` fallback;
- the landmine's injection flag.

The fixture's reverts all carry `Revert "` subjects, so the subject rule alone
decides every case. This is the same situation the first audit itself replaced
in E-22 and E-23: a faithful build of a specification whose data cannot detect
the defect. All four are killed at `HEAD`. The first audit's two planted faults
are killed as it says; that is not in dispute.

**Evidence:**
- [[middleware/context-oracle/ctxoracle/src/miner/labels.ts@57bdd4a:L21-L23]] "if (REVERT_TRAILER.test(body)) return true; return subject.startsWith('Revert \"') || subject.startsWith('Reapply \"');"
- Planted on compiled copies, whole miner suite (`dist/test/unit/miner*.test.js`):
  - trailer rule disabled [[ran]] `mut.sh <build> L-notrailer src/miner/labels.js "s/if \(REVERT_TRAILER.test\(body\)\)/if (false)/" …` → 57bdd4a `L-notrailer: exit=0 # pass 23 # fail 0`; HEAD `exit=1 # pass 47 # fail 2` (`T-13-1p`, `T-13-4d`);
  - `m` flag dropped [[ran]] `mut.sh <build> L-nom …` → 57bdd4a `exit=0 # pass 23 # fail 0`; HEAD `exit=1 # pass 47 # fail 2`;
  - `Reapply` removed [[ran]] `mut.sh <build> L-noreapply …` → 57bdd4a `exit=0 # pass 23 # fail 0`; HEAD `exit=1 # pass 48 # fail 1`, `not ok 34 - T-13-4d: isRevertLabelled — the trailer is recognised as any whole body line; Reapply is the second subject fallback`;
  - `injection_suspect: false` in the landmine build [[ran]] `mut.sh <build> L-nosuspect src/miner/cochange.js …` → 57bdd4a `exit=0 # pass 23 # fail 0`; HEAD `exit=1 # pass 48 # fail 1`, `not ok 45 - R-9: a miner landmine carries the file row's path injection flag; revert_chain counts over the horizon, not the fix window`.

**Final verdict:** replace.

**Correction:**
- Keep every existing assertion.
- Add these cases: a trailer-only revert (a subject not starting `Revert "`); a
  trailer after an explanation line; a `Reapply` commit; an injection-suspect
  path's landmine flag. All are done at `HEAD` by T-13-4d, T-13-1p and R-9.
- Add E-17's reference-format revert case. Not done at `HEAD`.

**Still at HEAD:** the four gaps are closed at `HEAD`. The reference-format case
(E-17) is still missing.

**Owner question:** none.

### E-28
**Ruling:** The second opinion is right: keep is overturned to replace.
- **The pair clause is vacuous.** The fixture T-13-3 rewrites, `miner-labels`,
  has three multi-file commits. All three are 40-file commits, excluded by size,
  so a mine of it has zero `cochange_pairs` rows. The specification's
  "`cochange_pairs` (weights included)" clause cannot fail. Deleting the purge
  of `cochange_pairs` passes T-13-3 on both builds. Deleting the purge of
  `labelled_touches` fails it, which confirms the oracle works where it has
  data.
- **Batch 4's settled cases are absent.** Batch 4 settled that T-13-3 pins the
  branch-switch, pruned-watermark and git-fault cases, and none is in T-13-3.
  At `HEAD`:
  - the pruned-watermark case exists as R-7, whose outcome is right for its
    scenario (E-16);
  - no branch-switch case and no git-fault case exists anywhere (no
    `branch_changed` in `src` or `test`).
- **Correction to the second opinion:** its "R-7 pins the opposite of batch 4"
  is overstated, for the reason in E-16.

**Evidence:**
- The specification's clause [[middleware/context-oracle/docs/plans/plan-phase-a.md@277b0a2:L10964-L10967]] "- **NOT asserts.** Timing. **Fails when** any row of `commits`, `cochange_pairs` (weights included), `labelled_touches`, `files.change_count`/`change_weight`, or the miner-kind `landmines` differs from the from-scratch store's, OR any row"
- The fixture used [[middleware/context-oracle/ctxoracle/test/unit/miner_rewrite.test.ts@57bdd4a:L131-L131]] "generateFixture('miner-labels', repo);"
- Executed. `generateFixture('miner-labels', …)` from the `57bdd4a` build, then mined:
  - [[ran]] `node mine.mjs <57bdd4a> fxl fxl fresh=1` → `commits 18 pairs 0 []`, with `"202b642:x-size"`, `"5b2147e:x-size"`, `"9544492:x-size"` among the commits.
  - [[ran]] `git -C fxl log --numstat --format='@%h %s' | awk …` → the only multi-file commits are `5b2147e fix lint 40`, `9544492 Revert "add big" 40`, `202b642 add big 40`.
- Planted on the compiled purge, T-13-3 alone (`dist/test/unit/miner_rewrite.test.js`):
  - [[ran]] `mut.sh <build> R-pairs src/miner/cochange.js "s#pairs.deleteAll\(\);##" …` → 57bdd4a `R-pairs: exit=0 # pass 1 # fail 0`; HEAD `R-pairs: exit=0 # pass 1 # fail 0`.
  - [[ran]] `mut.sh <build> R-touches src/miner/cochange.js "s#touches.deleteAll\(\);##" …` → both builds `exit=1 # pass 0 # fail 1`.
- Batch 4's settled item [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B4-verification.md@HEAD:L112-L112]] "- T-13-3 pins the branch-switch, pruned-watermark and git-fault cases."
- [[ran]] `git grep -n "branch_changed\|symbolic-ref" HEAD -- middleware/context-oracle/ctxoracle/src middleware/context-oracle/ctxoracle/test` → no output. `miner_rewrite.test.ts` at `HEAD` still holds one `test(`.

**Final verdict:** replace.

**Correction:**
- Keep the from-scratch oracle, the dead-hash scan, and the fault and
  human-row assertions.
- Give the rewritten history at least one multi-file commit under the size cap
  that the rewrite drops, so the pair clause can fail.
- Add batch 4's three cases:
  - branch switch: a `branch_changed`-class diagnostic, no purge;
  - pruned watermark: `cat-file -e` exit 1 on the same ref is a rewrite (R-7
    may move here);
  - git fault: a corrupt watermark object, `cat-file -e` 0 and `--is-ancestor`
    128, is a fault with no purge (E-16's executed case).

**Still at HEAD:** yes. The pair clause is still vacuous (`R-pairs` passes on
`HEAD`), and the branch-switch and git-fault cases are absent.

**Owner question:** none.

### E-29
**Ruling:** The second opinion did not judge E-29 by number. Its memory
measurement is a verified fact on this entry. It confirms the first audit's
reading of the code, so replace stands.
- **Memory:** peak heap grows with the range at a fixed `miner.horizon_commits`,
  on both builds, so the record's "memory is bounded by `miner.horizon_commits`"
  is false.
- **At `HEAD`:** the implementation log corrects that sentence (build review M5,
  limit R16). The other two items are unchanged: the no-`HEAD` sentence still
  describes only the unborn case, and finding 1 still omits that the watermark
  is set to `HEAD`.

**Evidence:**
- The claim [[middleware/context-oracle/docs/implementation-log.md@57bdd4a:L1053-L1055]] "The stream is aggregated in memory before the chunk writes. No transaction is ever open across the async stream, and horizon-excluded commits keep only their row fields, so memory is bounded by `miner.horizon_commits`."
- `pending` receives every commit of the range [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@57bdd4a:L433-L433]] "pending.push({" and is drained only after [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@57bdd4a:L448-L448]] "parser.end();"
- Measured. Single-file linear histories of 20,000 and 200,000 commits were
  made with `git fast-import`. Each got one full pass with
  `miner.horizon_commits` = 100, with peak `heapUsed` sampled every 2 ms:
  - [[ran]] `node memmine.mjs <57bdd4a> big20000 … 100` → `{"seen":20000,"included":100,"excluded":19900,"peakHeapMB":11.9}`; `big200000` → `{"seen":200000,"included":100,"excluded":199900,"peakHeapMB":54.1}`.
  - [[ran]] the same on `HEAD` → `{"seen":20000,…,"peakHeapMB":14.3}`; `{"seen":200000,…,"peakHeapMB":54.8}`.
- The no-`HEAD` sentence, unchanged at `HEAD` [[middleware/context-oracle/docs/implementation-log.md@HEAD:L1030-L1031]] "A repository with no `HEAD` (no commit): the pass writes nothing and returns a zero result." while exit 128 takes the same silent return (E-16: plain directory and removed object store → zero result, no fault, on both builds).
- The memory sentence corrected at `HEAD` [[middleware/context-oracle/docs/implementation-log.md@HEAD:L1055-L1058]] "(Step 13 build review M5):** this entry first claimed memory was \"bounded by `miner.horizon_commits`\". That was never checked and is false. The pass holds one record per commit of its whole range"
- Finding 1 at `HEAD` still stops at "nothing mined" [[middleware/context-oracle/docs/implementation-log.md@HEAD:L1088-L1091]] "sha256`, `%H` is 64 hex, so every field would be reported as a malformed record: one fault row per field, and nothing mined. Proposed fix: accept 40 or 64 hex in both, or detect the object format once and record a single fault." On the `57bdd4a` build the watermark is also set to `HEAD` (E-16: `"commitsSeen":0 … "watermark":"8e2bb86"`).

**Final verdict:** replace.

**Correction:**
- State that memory is O(commits in the range). Done at `HEAD`.
- Widen the no-`HEAD` sentence to "any `rev-parse` failure returns a zero
  result; exit 128 is not distinguished", and mark it open until E-16's
  `rev-parse` fix lands.
- Add to finding 1 that the pass still set the watermark to `HEAD`, so the loss
  was permanent.

**Still at HEAD:** partly. The memory sentence is corrected. The no-`HEAD`
sentence and finding 1's omission remain.

**Owner question:** none.

## Entries not re-ruled

The second opinion did not judge these, and no fact verified here changes them.
Their first-audit verdicts stand:
- **E-3** replace. The plan text of the per-chunk watermark; E-1's skew loss is
  reconfirmed above.
- **E-4** replace.
- **E-5** replace.
- **E-8** replace.
- **E-14** replace.
- **E-19** replace.
- **E-23** replace.
- **E-24** replace.
- **E-26** replace.

## Summary (recounted from the sections above)

| Entry | First audit | Second opinion | Final | Defect still at `HEAD`? |
|---|---|---|---|---|
| E-1 | replace | replace | **replace** | yes — skew loss reproduces; completeness check silent |
| E-2 | keep | keep | **keep** | — |
| E-3 | replace | — | replace (not re-ruled) | not re-checked here beyond E-1 |
| E-4 | replace | — | replace (not re-ruled) | not re-checked |
| E-5 | replace | — | replace (not re-ruled) | not re-checked |
| E-6 | replace | replace (reasoning corrected) | **replace** (second opinion's reasoning) | yes — probe and runner unchanged |
| E-7 | keep | keep | **keep** | — |
| E-8 | replace | — | replace (not re-ruled) | not re-checked |
| E-9 | keep | keep | **keep** | test gap closed by R-1 |
| E-10 | replace | (E-16 b) | **replace** (option (b) foreclosed by batch 4) | yes — per-pass horizon |
| E-11 | keep | keep (narrower reason) | **keep** | — |
| E-12 | keep | keep | **keep** | test gap closed by R-12 |
| E-13 | keep | keep (reasoning corrected) | **keep** | "newest" pinned by T-13-4e |
| E-14 | replace | — | replace (not re-ruled) | not re-checked |
| E-15 | keep | keep | **keep** | stand-in retired |
| E-16 | replace | replace (extended) | **replace** | partly — skew loss, `rev-parse` 128, 128-as-rewrite purge, per-pass horizon, shallow/graft fabrication, unpinned encoding, untested `--no-merges` remain |
| E-17 | keep | replace | **replace** | yes — reference-format revert unlabelled |
| E-18 | keep | keep (reasoning corrected) | **keep** | test gap closed by R-12 |
| E-19 | replace | — | replace (not re-ruled) | not re-checked |
| E-20 | keep | keep | **keep** | — |
| E-21 | keep | replace | **replace** | yes — fixture writes the outer repository's configuration |
| E-22 | replace | replace | **replace** | merge assertion: yes; count case: closed by R-1 |
| E-23 | replace | — | replace (not re-ruled) | not re-checked |
| E-24 | replace | — | replace (not re-ruled) | not re-checked |
| E-25 | keep | keep | **keep** | — |
| E-26 | replace | — | replace (not re-ruled) | not re-checked |
| E-27 | keep | replace | **replace** | the four gaps closed at `HEAD`; E-17's reference-format case missing |
| E-28 | keep | replace | **replace** | yes — pair clause vacuous; branch-switch and git-fault cases absent |
| E-29 | replace | (memory measured) | **replace** | partly — memory sentence corrected; no-`HEAD` sentence and finding 1 unchanged |

**Counts.**
- The 20 sections ruled here:
  - keep 10: E-2, E-7, E-9, E-11, E-12, E-13, E-15, E-18, E-20, E-25;
  - replace 10: E-1, E-6, E-10, E-16, E-17, E-21, E-22, E-27, E-28, E-29;
  - remove 0; undetermined 0.
- The 9 entries not re-ruled: replace 9 (E-3, E-4, E-5, E-8, E-14, E-19, E-23,
  E-24, E-26).
- The batch, 29 entries: **keep 10, replace 19, remove 0, undetermined 0.**
- Of the first audit's 14 keeps, 10 stand and 4 are overturned to replace:
  E-17, E-21, E-27, E-28.
- Second-opinion points corrected here, with verdicts unchanged:
  - E-7: the gate does not hold `provides`.
  - E-16 and E-28: R-7's outcome is right for its pruned-watermark scenario. The
    defect is the code's blanket 128-as-rewrite and R-7's over-wide title.
- First-audit points corrected here:
  - E-6's central fact;
  - E-10's option (b);
  - E-11's, E-13's and E-18's stated backing;
  - E-16's reading of the rename item as an owner question.

**Questions for Max Cogar:** none new from this part.
