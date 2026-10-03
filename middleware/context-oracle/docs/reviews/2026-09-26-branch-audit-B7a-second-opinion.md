# Branch audit — batch 7, part a (Step 13, the co-change miner): second opinion

This file gives an independent second opinion on
`2026-09-26-branch-audit-B7a.md` (E-1 … E-29; commits `a02adc0`, `e903eda`,
`9823853`, `277b0a2`, `57bdd4a`). It judges every first-audit `keep` (E-2, E-7,
E-9, E-11, E-12, E-13, E-15, E-17, E-18, E-20, E-21, E-25, E-27, E-28) and
E-1, E-6, E-16, E-22. It follows the auditor brief
`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/BRIEF.md`,
with batches 1–6 settled; batch 5's ruling 1 (watermark) and ruling 2 (recency)
and batch 4's history-rewrite items govern here.

**How the work was done.**
- Scratch extractions of `57bdd4a` and `HEAD` (`c864510`) were made with
  `git archive <commit> middleware/context-oracle/ctxoracle | tar -x`, with this
  checkout's `node_modules` symlinked, then built.
- Baselines: `node --test dist/test/unit/miner*.test.js` gives 23/23 on
  `57bdd4a` and 49/49 on `HEAD`.
- Every planted fault was made on a copy of the built `dist/` (`mut.sh` /
  `mutpy.sh`, which copy `dist`, `src`, `test` and apply one textual change)
  and run against the miner suite.
- Scenarios ran on throwaway git repositories under the scratchpad. A driver,
  `mine.mjs <build> <repo> <tag> [chunk_ms]`, runs one `mineCochange` pass
  against fresh stores and prints the result, watermark, `commits`, `files`
  counts, pairs and fault codes.
- Tool versions: git 2.43.0, Node v22.22.2.
- This repository was never checked out, modified or committed.

### E-1
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree, and I reproduced the data-loss path independently on both builds.

The raise was real. The final-transaction watermark and the already-mined skip are sound. The retained per-chunk watermark with its `watermark..HEAD` resume is what ruling 1 replaced, and it loses a commit under clock skew. One point to add: the completeness check that `HEAD` added (`commitsSeen === rangeCount`) does not catch this loss, because the lost commit lies outside the resumed range, so the range count and the stream agree.

**Evidence:**
- The hunk keeps the chunk watermark [[middleware/context-oracle/docs/architecture-phase-a.md@a02adc0:L1499-L1501]] "mine only `watermark..HEAD`, committed in bounded chunks, each chunk advancing the watermark to its own last commit (AD-26)."
- The ruling it must meet [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B5-verification.md@HEAD:L96-L98]] "The watermark is the `HEAD` resolved once when the pass starts, merge or not. It is keyed to the mined ref (batch 4) and written only in the pass's final transaction."
- git's default order is by date, and only the ordering options promise children first [[https://git-scm.com/docs/git-log]] "By default, the commits are shown in reverse chronological order." and [[https://git-scm.com/docs/git-log]] "Show no parents before all of its children are shown, but otherwise show commits in the commit timestamp order."
- My own repository `k`:
  - `root` (2024-01-01), then `p` (2024-03-01, `pf`, `shared`) on `main`.
  - `c`, a child of `p` dated 2024-01-15 (`cf`, `shared`), on `side`.
  - `q` (2024-04-01, `qf`) on `main`, then the merge `M`.
  - [[ran]] `git log --no-merges --reverse --format='%h %s' HEAD` → `a1a6333 root`, `c2691bf c-child-dated-before-p`, `1cccf79 p`, `031a7c6 q`. The child streams before its parent.
- The resume, on both builds:
  - Steps: a clone reset to `root` is mined first; it is then reset to `M`; the pass is stopped with the build's own worker (`miner_chunks_worker.js mine-stop … c2691bf`, `miner.chunk_ms` 0); then it is resumed with `mine.mjs`.
  - [[ran]] 57bdd4a → `injected stop after c2691bf`; the resume gives `"commitsSeen":1 … "watermark":"f6297c3","commits":["031a7c6","a1a6333","c2691bf"],"files":["cf:1","qf:1","r:1","shared:1"],"pairs":["cf+shared:1"],"faults":[]`.
  - [[ran]] HEAD → byte-identical output.
  - The uninterrupted reference gives `"commits":["031a7c6","1cccf79","a1a6333","c2691bf"],"files":["cf:1","pf:1","qf:1","r:1","shared:2"],"pairs":["cf+shared:1","shared+pf:1"]`.
  - Commit `p` is lost. The pair `shared+pf` is lost. The watermark reads `HEAD` (`f6297c3` = `M`). No fault is written.
- `HEAD` still carries the chunk watermark and the incremental range [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@HEAD:L593-L593]] "meta.set('last_mined_commit', (pending[next - 1] as PendingCommit).hash);" and [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@HEAD:L462-L462]] "const range = full ? head : `${watermark as string}..${head}`;"
- Its completeness check compares only against the resumed range [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@HEAD:L551-L551]] "const complete = result.commitsSeen === rangeCount;". The resumed range `c2691bf..M` holds one non-merge commit, `q`, and the stream yielded one (`"commitsSeen":1` above).

**Correct verdict:** replace. Keep the already-mined skip, the final-transaction watermark and the provenance rule. Replace the per-chunk watermark and the `watermark..HEAD` resume with ruling 1's design. This is not fixed at `HEAD`: the loss reproduces there.

### E-2
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree. One addition: the first audit asserted that the gate cross-checks declarations without running it; I ran it and planted faults against it.

The file-table rows are a generated region, derived from the step declarations. The declarations (`modify`, `tests`) are the decisions, and each is true.

**Evidence:**
- `indexer.ts` calls the miner at this commit [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@e903eda:L276-L276]] "const mine = mineCochange(store, repoPath, { diagnosticsDir: opts.diagnosticsDir, global: opts.global });"
- The gate passes on this commit's plan (run with the commit's own script, on a `git archive e903eda middleware/context-oracle/docs/plans` extraction) [[ran]] `node dps.mjs --check middleware/context-oracle/docs/plans/plan-phase-a.md` → `OK: 40 steps, 13 elements, 158 test specs, 27 probes cited, regions current`.
- Planted: `indexer.ts` removed from Step 13's `modify` list (plan line 3086) [[ran]] same command → `STALE: regions out of date: files — run without --check to regenerate`. The file-table row is generated from the declaration, so the declaration is what the gate holds.
- Planted: `T-13-6` removed from Step 13's `tests` list (line 3089) [[ran]] → `ERROR: test T-13-6 is specified but no step references it — orphan spec or missing tests: entry`.

**Correct verdict:** keep. The declarations are true, and the gate fails when either is dropped.

### E-6
**Agree/Disagree:** Verdict: agree (replace). Reasoning: disagree.

The first audit's central fact is false for the URLs it names. It says a 404 on the two unpinned branch URLs "now prints `SKIPPED: network`" and "the runner then passes the probe". The runner honours `SKIPPED:` only when it is the first line of the output. Fetches `b`, `c` and `d` run after two lines have already been printed. So a 404 or a network failure on any of them is reported as drift, and the probe fails. It is not masked.

The real defects run the other way:
- (1) The commit's stated intent, that a network failure skips the probe rather than reading as drift, holds only for the first fetch (`a`). A network failure on `b`–`d` still fails the probe as drift, which is the symptom the commit claimed to fix.
- (2) An HTTP error is labelled `SKIPPED: network` in the output, so the drift report names the wrong cause.
- (3) The one place a 404 is masked is fetch `a`, a URL pinned to a commit, where a 404 means the upstream repository or commit is gone.

The diagnosis (an `exit` inside `$(...)` ends only the subshell) is correct.

**Evidence:**
- The script's own stated intent [[middleware/context-oracle/docs/plans/plan-phase-a.probes/14_docker_node_git.optional.sh@9823853:L3-L5]] "# g runs inside $(...), a subshell, so its own exit cannot end the probe; each # fetch is checked by need() in the main shell instead, so a network failure or # an empty body skips the whole probe rather than reading as drift."
- The runner tests the start of the whole output (no `m` flag) [[middleware/context-oracle/.claude/skills/expert-plan/scripts/run-plan-probes.mjs@9823853:L120-L120]] "if (name.includes('.optional') && /^SKIPPED:/.test(out)) {"
- Fetch `b` comes after two printed lines [[middleware/context-oracle/docs/plans/plan-phase-a.probes/14_docker_node_git.optional.sh@9823853:L11-L11]] "b=$(g https://raw.githubusercontent.com/docker-library/buildpack-deps/master/debian/bookworm/Dockerfile); need \"$b\"; echo \"buildpack-deps:bookworm FROM: $(printf '%s' \"$b\" | grep -m1 '^FROM')\""
- Executed through the commit's own runner, in an isolated copy (`plan.md` plus `plan.probes/` holding this probe and its recorded expectation):
  - [[ran]] `node run.mjs plan.md --only 14_docker_node_git.optional` (as committed) → `ok 14_docker_node_git.optional`.
  - With `b`'s path changed to `…/bookworm/MOVED/Dockerfile` (a 404) [[ran]] same command → `--- actual`, `22/bookworm Dockerfile at d073523: ENV NODE_VERSION 22.16.0`, `node:22.16.0-bookworm FROM: FROM buildpack-deps:bookworm`, `SKIPPED: network`, `1 probe(s) failed`.
  - With the `docker-library` host changed to `nonexistent.invalid` (a network failure on `b` and `c`) [[ran]] same command → the same `SKIPPED: network` third line and `1 probe(s) failed`.
- The runner and the probe are unchanged at `HEAD` (`git diff 9823853 HEAD --stat` over both paths is empty).

**Correct verdict:** replace.
- Fetch all four bodies first and check them in the main shell before printing anything, so that a skip is always the first line.
- Print `SKIPPED: network` only on curl's transport exits.
- Let an HTTP error print a non-matching line naming the HTTP failure, so that the runner reports drift with its true cause.
- Pin the two branch URLs.

Not fixed at `HEAD`.

### E-7
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree. The same gate evidence as E-2 applies: the rows are generated from the declarations, and the gate passes on this commit's plan.

Both files do change in the `57bdd4a` build, and `repointStaleCommitProv` is a Step 13 export. E-8 and E-19's stderr correction changes the content of the `spawn.ts` change, not the fact that Step 13 modifies that file. So these rows stand whatever those entries decide.

**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@277b0a2:L3090-L3090]] "provides: [mineCochange, parseNumstatZ, isRevertLabelled, isFixLabelled, files.repointStaleCommitProv]"
- The seam before Step 13 had no piped stdout [[middleware/context-oracle/ctxoracle/src/util/spawn.ts@277b0a2:L74-L74]] "stdio: opts.detached === true ? 'ignore' : 'inherit',"
- The gate on a `git archive 277b0a2 middleware/context-oracle/docs/plans` extraction, run with the commit's own script [[ran]] `node dps.mjs --check middleware/context-oracle/docs/plans/plan-phase-a.md` → `OK: 40 steps, 13 elements, 158 test specs, 27 probes cited, regions current`.
- E-2's planted faults show the file table is regenerated from `modify` lists: dropping a declared file gives `STALE: regions out of date: files`.

**Correct verdict:** keep.

### E-9
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree on the decision, and I executed its effect. One thing the first audit did not report: at `57bdd4a` no test pins this decision. The reversal passes all 23 tests. A later review test (R-1) kills it at `HEAD`.

The plan sentence is correct and stands.

**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@277b0a2:L3144-L3146]] "oldest first). Before the stream, `git rev-list --count --no-merges <range>` (through `oracleRunSync`) gives the range size — `--no-merges` so the count matches the stream's positions (builder preflight); commits older than the newest"
- The positional cut it feeds [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@57bdd4a:L397-L398]] "const rangeCount = Number(gitOk(repoPath, ['rev-list', '--count', '--no-merges', range])); const firstInHorizon = rangeCount - horizonCommits; // stream positions below this are horizon-excluded"
- Executed on repository `k` (four non-merge commits and one merge) with `miner.horizon_commits` = 2:
  - [[ran]] `TUNE=miner.horizon_commits=2 node mine.mjs <57bdd4a> k t` → `"included":2,"excluded":2`, with `1cccf79` (`p`) and `031a7c6` (`q`) included.
  - The same run on a build with `--no-merges` removed from the count [[ran]] → `"included":1,"excluded":3`, with `p` wrongly horizon-excluded.
  - The newest two non-merge commits are `p` and `q`, so the plan's count is the right one.
- The reversal against the suite:
  - [[ran]] `mut.sh 57bdd4a count-merges … "s/'rev-list', '--count', '--no-merges', range/'rev-list', '--count', range/"` → `count-merges: exit=0 # pass 23 # fail 0`.
  - The same fault on `HEAD` [[ran]] → `exit=1 # pass 47 # fail 2` (`T-13-6a` and `R-1: miner.horizon_commits keeps exactly the newest N non-merge commits of the pass range, merges not counted`).

**Correct verdict:** keep. The plan text is right. The missing test at `57bdd4a` belongs to T-13-1 (see E-22) and is fixed at `HEAD` by R-1.

### E-11
**Agree/Disagree:** Verdict: agree (keep). Reasoning: partly disagree.

The first audit says that without the order rule, a row created in the chunk "would read as stale", and that the rule "closes that window" and "makes the re-point predicate sound". Executed, the reversed order changes no stored provenance. When a new row's own commit is not yet in `commits`, `repointStaleCommitProv(id, c.hash)` rewrites `prov_ref` to the value it already holds, `c.hash`.

What the rule actually secures:
- the method's returned "changed" flag is truthful (it would otherwise report `true` for every new row);
- no spurious `updated_at` write.

The plan sentence claims only the literal property ("always 'in `commits`' when checked"), which is true. So the unit stands, but on a weaker reason than the first audit gave. No test pins the order: the reversal passes 23/23.

**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@277b0a2:L3186-L3188]] "is set when *either* writer creates the row, AD-19; a chunk writes its `commits` rows **before** its `ensureHistoryRow` calls, so a path's first-naming commit is always \"in `commits`\" when checked), its `change_count` is"
- The re-point writes the hash it is given [[middleware/context-oracle/ctxoracle/src/stores/dao/files.ts@57bdd4a:L140-L142]] "`UPDATE files SET prov_ref = ?, updated_at = ? WHERE id = ? AND prov_kind = 'commit' AND NOT EXISTS (SELECT 1 FROM commits c WHERE c.hash = files.prov_ref)`"
- The new row's `prov_ref` is already that hash [[middleware/context-oracle/ctxoracle/src/stores/dao/files.ts@57bdd4a:L50-L50]] "commit/untrusted_repo, prov_ref = commitHash); returns its id; never changes an existing row."
- Planted fault: the `commits.upsert` moved after the path loop in the compiled `writeCommit` [[ran]] `mutpy.sh 57bdd4a order src/miner/cochange.js m_order.py "dist/test/unit/miner*.test.js"` → `order: exit=0 # pass 23 # fail 0`. This includes T-13-3's whole-store provenance comparison with a from-scratch mine, and T-13-6c.

**Correct verdict:** keep. The sentence is true and harmless. Its value is the truthful return flag, not the soundness of the stored provenance.

### E-12
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree on the design.

One correction to the record the first audit relied on. The separate method's `prov_kind = 'commit'` guard is essential, because the miner calls it on every touched path, including rows the indexer created. But no `57bdd4a` test pins the guard: dropping it passes 23/23. It is pinned only at `HEAD`, by R-12. The plan design is right. The test gap belongs to the build (see E-18).

**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@277b0a2:L3219-L3225]] "spans a `git` read. **Commit provenance after a purge:** a new DAO method this step adds, `files.repointStaleCommitProv(id, hash): boolean`, sets an existing row's `prov_ref` to `hash` when its `prov_kind = 'commit'` and its `prov_ref` is not in `commits`, and returns whether it changed; the miner calls it after each `ensureHistoryRow` (whose Step 9 contract — never change an existing row, `T-9-1r15` — stays as it is; builder preflight: re-pointing inside `ensureHistoryRow` would contradict that asserted test); the final transaction"
- The contract kept [[middleware/context-oracle/docs/plans/plan-phase-a.md@277b0a2:L2579-L2579]] "review m1; returns the id; never changes an existing row);"
- Planted faults on the `57bdd4a` build (miner suite):
  - call removed [[ran]] `mut.sh 57bdd4a rp-nocall … "s/files.repointStaleCommitProv(id, c.hash);//"` → `exit=1 # pass 22 # fail 1` (`T-13-6c`);
  - `NOT EXISTS` guard removed [[ran]] → `exit=1 # pass 22 # fail 1` (`T-13-6c`);
  - `prov_kind = 'commit'` guard removed [[ran]] `mut.sh 57bdd4a rp-nokind src/stores/dao/files.js "s/WHERE id = ? AND prov_kind = 'commit'/WHERE id = ?/"` → `exit=0 # pass 23 # fail 0`.
- The same `prov_kind` fault on `HEAD` [[ran]] → `exit=1 # pass 48 # fail 1` (`R-12: the miner re-points only a commit-provenance row; an indexed row's prov_ref is never touched`).

**Correct verdict:** keep.

### E-13
**Agree/Disagree:** Verdict: agree (keep). Reasoning: partly disagree.

The first audit says an unstated `prov_ref` "would fail T-13-3". T-13-3 compares two stores mined by the same code, so it enforces determinism only. Any fixed choice passes it:
- the oldest hash passes;
- only a non-deterministic pick fails.

So "the newest" was unpinned at `57bdd4a`. A later case (T-13-4e) pins it at `HEAD`. The plan sentence's own stated reason is determinism, and that is true. The choice of the newest hash is natural (the row cites it first) and conflicts with nothing. The sentence stands.

**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@277b0a2:L3280-L3282]] "first, provenance `commit`/`untrusted_repo` with `prov_ref` = the newest counted hash (the first in `evidence` — deterministic, so two stores mined from the same history agree, `T-13-3`), and `injection_suspect` = the"
- Planted on the `57bdd4a` build:
  - [[ran]] `mut.sh 57bdd4a lm-oldest … "s/prov_ref: evidence\[0\],/prov_ref: evidence[evidence.length - 1],/"` → `exit=0 # pass 23 # fail 0`;
  - a random pick [[ran]] → `exit=1 # pass 22 # fail 1` (T-13-3).
- On `HEAD` the oldest-hash fault [[ran]] → `exit=1 # pass 48 # fail 1` (`T-13-4e: every miner landmine is commit/untrusted_repo provenance whose prov_ref is the newest counted hash`).

**Correct verdict:** keep. The plan text is right. That "newest" was untested at `57bdd4a` is a test-coverage fact, fixed at `HEAD` by T-13-4e.

### E-15
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree.

The row names:
- the file;
- the two adaptations;
- the mark;
- the retiring step.

The built code carries exactly two `SKELETON: 13` marks in `indexer.ts`. By `HEAD` the stand-in is retired from `indexer.ts`: no `SKELETON: 13` remains there. The only remaining `SKELETON: 13` is in `src/cli/context.ts`, which is later work for batch 7 b/c.

**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@277b0a2:L7072-L7072]] "| `src/index/indexer.ts` — Step 13's skeleton caller (made during Step 13's build, after 1R) | the skeleton `runIndex` builds the miner's `TuningReader` as `tuningReader(global, resolveRepoKey(repoPath).key)` and maps `MineResult.included` onto its existing `IndexResult.mine.commitsIncluded`, so the skeleton `index`/`init` verbs compile unchanged; both marked `SKELETON: 13` (3) | Step 14 |"
- The marks at the build [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@57bdd4a:L45-L45]] "/** SKELETON: 13 — the skeleton's mine summary; Step 13's `MineResult.included`" and [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@57bdd4a:L280-L280]] "// SKELETON: 13 — the miner's TuningReader is bound here to"
- Retirement [[ran]] `git grep -n "SKELETON: 13" HEAD -- ctxoracle/src` → only `ctxoracle/src/cli/context.ts:38`.

**Correct verdict:** keep.

### E-16
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree on every item. I reproduced each one independently: `log.showSignature`, `log.showRoot`, `GIT_DIR`, the skew loss, the silent `rev-parse` return and SHA-1 only. Each is fixed at `HEAD` or not, as the first audit states.

The first audit's list is incomplete. It missed:
- two settled batch-4 rulings the source contradicts;
- three git behaviours the miner depends on that it did not test.

**What the first audit missed:**
- **(a) `merge-base` exit 128 treated as a rewrite.** Batch 4 settled that any status other than 0 or 1 is a git fault with no purge. The source treats 128 as a rewrite: it records a fault, purges and does a full re-mine. It is still so at `HEAD`, and `HEAD`'s R-7 pins the purge.
- **(b) The horizon applied only per pass.** Batch 4 settled that both horizons are enforced on incremental passes too. The source applies the horizon only per pass range. Still so at `HEAD`.
- **(c) Shallow clones.** The spec makes shallow clones a design condition. On a shallow clone the boundary commit streams as a root commit, so its diff is the whole tree:
  - The miner credits it with touching every file and fabricates every pair among them. This happens whenever the tree is at or under the 30-entity cap.
  - After `git fetch --unshallow` the incremental pass mines nothing: the fabricated rows stay, and the older history is never read.
  - A `git replace --graft` root behaves the same way.
  - No fault is written, on either build. `HEAD`'s pinned `--root` makes the boundary diff unconditional.
- **(d) `i18n.logOutputEncoding` is unpinned.** With UTF-16:
  - `57bdd4a` mines nothing and still sets the watermark to `HEAD`, so the loss is silent and permanent.
  - `HEAD`'s completeness check makes the failure visible, with faults and `mining_in_progress` left at `'1'`, but every pass then fails. The pin is `--encoding=UTF-8`.
- **(e) The `--no-merges` pin is untested at `HEAD` too.** E-22's missing assertion is still missing there.

**The memory claim** (E-29's record) is false by measurement. Peak heap grows with the range at a fixed `miner.horizon_commits`.

**Checked and found not to be defects:**
- `-M`'s threshold and `diff.renames=copies` change no path set the miner records. A rename below the threshold is a delete plus an add, and names the same two paths.
- `core.quotePath` has no effect under `-z`.

**Evidence:**
- Configuration and environment, both builds:
  - `log.showSignature=true` over two signed commits (a stand-in `gpg.program`) [[ran]] `GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=log.showSignature GIT_CONFIG_VALUE_0=true node mine.mjs <build> sg7 t` → 57bdd4a `"commitsSeen":0 … "watermark":"eb0dcdc","commits":[],"files":[]` with `miner_unparsed_numstat` faults; HEAD `"commitsSeen":2 … "files":["f:2"],"faults":[]`.
  - `log.showRoot=false` [[ran]] → 57bdd4a `"files":["a:1","b:1"]`; HEAD `"files":["a:2","b:2"]`.
  - `GIT_DIR=<other repo>/.git` [[ran]] → 57bdd4a mined the other repository's four commits; HEAD mined the target's two.
- SHA-256: on a `--object-format=sha256` repository [[ran]] → 57bdd4a `"commitsSeen":0 … "watermark":"a69f9a3"` with faults; HEAD `"commitsSeen":2 … "faults":[]`.
- The pins at `HEAD` [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@HEAD:L516-L521]] "'log', '--no-show-signature', '--root', '--no-textconv', '--no-ext-diff', '--no-merges',"
- `rev-parse` statuses:
  - [[ran]] `git rev-parse --verify -q HEAD` → unborn `1`, non-repository `128`, `.git/objects` removed `128`.
  - Both builds on the last two [[ran]] → `"commitsSeen":0 … "commits":[],"files":[],"faults":[]`.
  - Unchanged at `HEAD` [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@HEAD:L416-L417]] "const headProbe = git(repoPath, ['rev-parse', '--verify', '-q', 'HEAD']); if (headProbe.status !== 0) return result;"
  - Batch 2 settled the distinction [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B2-verification.md@HEAD:L88-L88]] "Fixes: `git rev-parse --verify --quiet HEAD` (unborn HEAD exits 1, a non-repo exits 128)"
- (a) The source treats 128 as a rewrite [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@57bdd4a:L371-L372]] "if (anc.status === 1 || anc.status === 128) { // The watermark is not an ancestor (1) or the object is gone (128): G4." Still so at `HEAD` [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@HEAD:L436-L436]] "if (anc.status === 1 || anc.status === 128) {"
- (a) The settled rule [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B4-verification.md@HEAD:L48-L49]] "`git merge-base --is-ancestor` exits 128 for a missing object, a non-repository and a removed object store. So 128 is not \"watermark" and [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B4-verification.md@HEAD:L108-L108]] "Any other status: a git fault, with no purge."
- (b) The settled rule [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B4-verification.md@HEAD:L109-L109]] "Both horizons are enforced on incremental passes too." The code cuts per pass range [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@HEAD:L466-L466]] "const firstInHorizon = rangeCount - horizonCommits; // stream positions below this are horizon-excluded"
- (c) The spec condition [[middleware/context-oracle/docs/specs/spec-context-oracle.md@HEAD:L54-L55]] "The tool must operate on repositories with **thin commit history** (new repos, shallow clones) as a design condition"
- (c) The architecture already knows the boundary is not a real root [[middleware/context-oracle/docs/architecture-phase-a.md@HEAD:L137-L137]] "A shallow clone's \"roots\" are boundary commits and vary per clone depth"
- (c) git shows a root as a whole-tree creation [[https://git-scm.com/docs/git-config]] "log.showRoot If true, the initial commit will be shown as a big creation event. This is equivalent to a diff against an empty tree."
- (c) Executed, shallow clone:
  - The source has files `a`–`e` added in `base`, then four commits touching only `a`. `git clone --depth 2` gives boundary `aa970f2` (`a3`) plus `a4`.
  - [[ran]] 57bdd4a and HEAD → `"commits":["34e8416","aa970f2"],"files":["a:2","b:1","c:1","d:1","e:1"],"pairs":["a+b:1","a+c:1","a+d:1","a+e:1","b+c:1","b+d:1","b+e:1","c+d:1","c+e:1","d+e:1"],"faults":[]`. `a3` really touched only `a`.
  - After `git fetch --unshallow` (`--is-shallow-repository` → `false`), an incremental HEAD-build pass on the same store [[ran]] → `"commitsSeen":0` and unchanged rows, with `change_count(a)` 2 where the history holds 5.
- (c) Executed, `git replace --graft HEAD~1` on `r1`→`r2`→`r3` (`r2` touched only `b`) [[ran]] both builds → `"commits":["4a475b9","7ff0bce"],"files":["a:2","b:1"],"pairs":["a+b:1"]`. With `GIT_NO_REPLACE_OBJECTS=1` → `"pairs":[]`.
- (d) git re-encodes messages to the configured encoding [[https://git-scm.com/docs/git-config]] "i18n.logOutputEncoding Character encoding the commit messages are converted to when running git log and friends." The flag that pins it [[https://git-scm.com/docs/git-log]] "Commit objects record the character encoding used for the log message in their encoding header; this option can be used to tell the command to re-code the commit log message in the encoding preferred by the user."
- (d) Executed with `GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=i18n.logOutputEncoding GIT_CONFIG_VALUE_0=UTF-16` on `r1` [[ran]]:
  - 57bdd4a → `"commitsSeen":0 … "watermark":"a28991c","commits":[]` plus 150+ `miner_unparsed_numstat` faults;
  - HEAD → `"commitsSeen":0 … "mip":"1","commits":[]` with two faults, and no watermark.
- (e) Executed: `--no-merges` removed from the stream [[ran]] `mut.sh HEAD M3 …` → `M3: exit=0 # pass 49 # fail 0`. On repository `k` the mutant writes the merge as an included `commits` row (`"included":5`) and still sets the watermark to `HEAD` through the merge's chunk.
- Rename and copy detection:
  - A rename plus a 30-line edit [[ran]] `git log -M -z --numstat` → `30 0 |old.txt|new.txt|`; with `-M90%` and with `--no-renames` → `80 0 new.txt|0 50 old.txt|`. The same two paths either way.
  - `-c diff.renames=copies` with `-M` [[ran]] → the copy is shown as an add (`50 0 copy.txt`), identical to the plain run.
  - Both builds give identical stores with and without that configuration.
- Memory: `pending` receives every commit of the range [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@57bdd4a:L433-L433]] "pending.push({" and is drained only after [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@57bdd4a:L448-L448]] "parser.end();"
  - Measured with `miner.horizon_commits` = 100 on fast-imported single-file histories [[ran]] `node memmine.mjs <57bdd4a> big20k` → `{"seen":20000,"included":100,"excluded":19900,"peakHeapMB":16.7}`; `big200k` → `{"seen":200000,"included":100,"excluded":199900,"peakHeapMB":54.2}`.

**Correct verdict:** replace.

Done at `HEAD`:
- configuration and environment pins;
- the range-completeness check;
- the SHA-256 header;
- stderr carried into errors;
- the `refTs` cap and re-based epoch;
- the resolved hash used throughout.

Not done at `HEAD`:
- ruling 1's watermark;
- a fault on `rev-parse` 128;
- `merge-base` 128 as a git fault with no purge (batch 4);
- the horizon on incremental passes (batch 4);
- shallow-boundary and graft-root commits excluded and recorded;
- `--encoding=UTF-8`;
- a test that kills the `--no-merges` removal.

### E-17
**Agree/Disagree:** Verdict: disagree (keep → replace). Reasoning: disagree in part.

The predicates do implement the plan's two rules, and whole-token, case-insensitive fix matching is correct. But `isRevertLabelled` recognises only one of the two revert messages git itself writes:
- git-revert documents a second format, `--reference`, which can be made the default by `revert.reference`;
- in that format the body is `This reverts commit <abbrev> (<subject>, <date>).`, and the subject is a placeholder the user is told to replace.

Neither rule matches that message, so a developer with `revert.reference = true` gets no `revert` label and no `revert_chain` landmine, silently. The first audit's "Would be wrong if" asked whether git's revert message could sit where the trailer match cannot see it. This is that case, in a documented git format.

The plan's rule names only "git-revert(1)'s default message", so this is a plan-level gap that the code inherits. The code still has to change, so the unit cannot stand as it is.

**Evidence:**
- [[middleware/context-oracle/ctxoracle/src/miner/labels.ts@57bdd4a:L10-L10]] "const REVERT_TRAILER = /^This reverts commit [0-9a-f]{40}\.$/m;"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@277b0a2:L3169-L3171]] "`^This reverts commit [0-9a-f]{40}\.$` (git-revert(1)'s default message), or, as the fallback for a trailer-less message, the subject starts with `Revert \"` or `Reapply \"`"
- git's documentation of the second format [[https://git-scm.com/docs/git-revert]] "The revert.reference configuration variable can be used to enable this option by default."
- Executed with git's own revert command, in a throwaway repository:
  - `git revert --no-edit HEAD` [[ran]] → subject `Revert "change a"`, body `This reverts commit 304ff5472b32218aa5440e9afd3c4e8c2075964d.`
  - Reverting that revert [[ran]] → `Reapply "change a"`.
  - `git revert --no-edit --reference HEAD~2` [[ran]] → subject `# *** SAY WHY WE ARE REVERTING ON THE TITLE LINE ***`, body `This reverts commit 304ff54 (change a, 2026-09-28).`
- The built predicate over those messages [[ran]] `node lab.mjs <57bdd4a> rv7` → `"# *** SAY WHY WE ARE REVERTING ON THE TITLE LINE ***" false`, `"Reapply \"change a\"" true`, `"Revert \"change a\"" true`.
- Still so at `HEAD` [[middleware/context-oracle/ctxoracle/src/miner/labels.ts@HEAD:L11-L11]] "const REVERT_TRAILER = /^This reverts commit ([0-9a-f]{40}|[0-9a-f]{64})\.$/m;"

**Correct verdict:** replace.
- Keep both existing rules and the fix predicate.
- Add git's reference-format trailer (`^This reverts commit [0-9a-f]{4,64} \(.+\)\.$`) as a recognised revert line, and state it in the plan's Step 13 rule.

Not fixed at `HEAD`. The SHA-256 length is fixed at `HEAD`.

### E-18
**Agree/Disagree:** Verdict: agree (keep). Reasoning: partly disagree.

The SQL is the plan's predicate and is correct. The first audit's backing claim is false for the build: "rows with `prov_kind` other than `commit` are excluded by the predicate … (T-13-6c and the review's R-12 would fail)". At `57bdd4a`:
- T-13-6c does not fail when the `prov_kind` guard is removed;
- R-12 does not exist yet.

At that commit nothing tested the guard that keeps the miner from rewriting indexed rows' provenance. R-12 closes this at `HEAD`. The code unit itself needs no change.

**Evidence:**
- [[middleware/context-oracle/ctxoracle/src/stores/dao/files.ts@57bdd4a:L140-L142]] "`UPDATE files SET prov_ref = ?, updated_at = ? WHERE id = ? AND prov_kind = 'commit' AND NOT EXISTS (SELECT 1 FROM commits c WHERE c.hash = files.prov_ref)`"
- [[ran]] `mut.sh 57bdd4a rp-nokind src/stores/dao/files.js "s/WHERE id = ? AND prov_kind = 'commit'/WHERE id = ?/" "dist/test/unit/miner*.test.js"` → `rp-nokind: exit=0 # pass 23 # fail 0`.
- [[ran]] the same on `HEAD` → `exit=1 # pass 48 # fail 1`, `not ok 48 - R-12: the miner re-points only a commit-provenance row; an indexed row's prov_ref is never touched`.
- The build review's own table [[middleware/context-oracle/docs/reviews/2026-09-26-step-13-build-review.md@HEAD:L333-L333]] "| D2 | repoint ignores prov_kind | `src/stores/dao/files.ts:141` | survived | killed | R-12 |"

**Correct verdict:** keep. The code is right. The missing test was the build suite's gap, closed at `HEAD` by R-12.

### E-20
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree.

The §9 row's text names a two-argument `tuningReader(global, key)`. The build passes a third argument, `onMissing`, which records `tuning_missing`. That is not scope creep: the reader's signature requires the callback, and its contract assigns the recording to the caller.

The diff touches only:
- the imports;
- the `IndexResult.mine` type;
- the miner block.

Batch 6's open item on the reader, that it writes seeds on the event path, is a defect in the reader, not in this caller.

**Evidence:**
- [[middleware/context-oracle/ctxoracle/src/stores/dao/tuning.ts@57bdd4a:L102-L102]] "export function tuningReader(global: Store, projectKey: string, onMissing: (key: string) => void): TuningReader {"
- [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@57bdd4a:L284-L288]] "const mineTuning = tuningReader(opts.global, resolveRepoKey(repoPath).key, (k) => recordFault(store, opts.diagnosticsDir, { code: 'tuning_missing', detail: { key: k } }) ); const mined = await mineCochange(store, repoPath, { tuning: mineTuning, diagnosticsDir: opts.diagnosticsDir, full: opts.full }); const mine = { commitsIncluded: mined.included };"
- [[ran]] `git diff 277b0a2 57bdd4a -- middleware/context-oracle/ctxoracle/src/index/indexer.ts` → three hunks (imports; the `mine` type with its `SKELETON: 13` mark; the miner block). `runIndex` was already `async` (`export async function runIndex(` at line 179).

**Correct verdict:** keep.

### E-21
**Agree/Disagree:** Verdict: disagree (keep → replace). Reasoning: disagree.

The generators' dates and subjects are right, and the tests pass on them. But the first audit's own "Would be wrong if", "a fixture depended on the runner's own git configuration", is met. The commit adds exported helpers documented as running with "isolated git config". The tests' own `rebase`, `amend`, `merge` and `clone` go through those helpers.

They run git with `{ ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null' }`. That leaves two things inherited from the runner:
- the repository-selecting variables (`GIT_DIR`, `GIT_WORK_TREE`, `GIT_INDEX_FILE`);
- the command-line configuration channel (`GIT_CONFIG_COUNT`/`GIT_CONFIG_PARAMETERS`).

git exports `GIT_DIR` and `GIT_WORK_TREE` to every hook. So running the suite from a pre-commit or pre-push hook points the generator at the developer's own repository. Executed:
- the generator re-initialised the outer repository;
- it wrote `user.name`, `user.email`, `commit.gpgsign=false`, `core.autocrlf=false` and `gc.auto=0` into that repository's local configuration, silently turning off commit signing there;
- then it failed.

The `git()` helper predates this commit (Step 1). This commit exports it with an isolation claim it does not meet, and routes Step 13's tests through it. It is unchanged at `HEAD`, which already has the right mechanism (`gitChildEnv`) for its production git calls.

**Evidence:**
- [[middleware/context-oracle/ctxoracle/test/fixtures/generate.ts@57bdd4a:L118-L119]] "// mine; T-13-5 clones miner-large). Same pinned identity, dates, and isolated // git config as the generators, so a test's own commits are deterministic too."
- [[middleware/context-oracle/ctxoracle/test/fixtures/generate.ts@57bdd4a:L35-L39]] "env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null', GIT_TERMINAL_PROMPT: '0',"
- [[middleware/context-oracle/ctxoracle/test/fixtures/generate.ts@57bdd4a:L48-L51]] "git(dir, ['init', '-q', '-b', 'main']); git(dir, ['config', 'user.name', AUTHOR_NAME]); git(dir, ['config', 'user.email', AUTHOR_EMAIL]); git(dir, ['config', 'commit.gpgsign', 'false']);"
- git's hook contract [[https://git-scm.com/docs/githooks]] "Environment variables, such as GIT_DIR, GIT_WORK_TREE, etc., are exported so that Git commands run by the hook can correctly locate the repository."
- Executed. The outer repository has one commit; the generator ran with `generateFixture('miner-denominator', <dir>)` from the `57bdd4a` build, under `GIT_DIR=<outer>/.git GIT_WORK_TREE=<outer>` [[ran]] → `warning: re-init: ignored --initial-branch=main`, then `Error: Command failed: git commit -q -m a and b 0`. Then `git -C <outer> config --list --local` [[ran]] → `user.name=Ctxoracle Fixture`, `user.email=fixtures@ctxoracle.test`, `commit.gpgsign=false`, `core.autocrlf=false`, `gc.auto=0`.
- The mechanism `HEAD` uses for production git calls [[middleware/context-oracle/ctxoracle/src/identity/git_layout.ts@HEAD:L79-L79]] "const REPO_SELECTING_ENV = ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_OBJECT_DIRECTORY', 'GIT_COMMON_DIR'] as const;". The fixture helper at `HEAD` still spreads `process.env` unfiltered (its lines 35–38 are unchanged).

**Correct verdict:** replace.
- Keep the generators and their data.
- Give the fixture `git()` an environment with the repository-selecting variables and `GIT_CONFIG_COUNT`/`GIT_CONFIG_PARAMETERS`/`GIT_CONFIG_KEY_*`/`GIT_CONFIG_VALUE_*` removed.
- Make the helper comment's "isolated" true.

Not fixed at `HEAD`.

### E-22
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree, with two additions.

1. The defect is **not fixed at `HEAD`**. The same `--no-merges` removal survives the whole 49-test `HEAD` suite. There the mutant's merge row even becomes the chunk watermark, `HEAD`, so T-13-6a's watermark check passes too.
2. At `57bdd4a` T-13-1 also does not observe E-9's decision: counting the horizon range with merges survives. `HEAD` pins it with R-1.

**Evidence:**
- [[middleware/context-oracle/ctxoracle/test/unit/miner.test.ts@57bdd4a:L113-L116]] "const cited = store .prepare('SELECT count(*) AS n FROM cochange_pairs WHERE last_commit IN (?, ?, ?)') .get(ancient, bulk, merge) as { n: number }; assert.equal(cited.n, 0, 'no pair row cites an excluded commit');"
- The `--no-merges` removal:
  - [[ran]] `mut.sh 57bdd4a M3 src/miner/cochange.js "s#\['log', '--no-merges', '-M'#['log', '-M'#" "dist/test/unit/miner*.test.js"` → `M3: exit=0 # pass 23 # fail 0`.
  - [[ran]] the same fault on `HEAD` (the `'--no-merges',` array element deleted) → `M3: exit=0 # pass 49 # fail 0`.
- Why no pair ever cites the merge: a merge prints a header and no numstat. [[ran]] `git log --format='%x1e%h %p' -z --numstat HEAD` on repository `k` → `^f6297c3 031a7c6 c2691bf|^031a7c6 1cccf79|` (the two-parent merge is followed directly by the next header).
- What a merge in the stream does change: the `HEAD` mutant on `k` [[ran]] → `"commitsSeen":5,"included":5 … "watermark":"f6297c3","mip":"1","commits":["031a7c6","1cccf79","a1a6333","c2691bf","f6297c3"]`. The merge `f6297c3` gets an included `commits` row, which inflates `countIncluded()` and the corpus floor.
- The horizon count: [[ran]] `mut.sh 57bdd4a count-merges …` → `exit=0 # pass 23 # fail 0` (see E-9).

**Correct verdict:** replace.
- Keep every existing assertion.
- Add "the merge commit has no `commits` row", so that the merge exclusion can fail. This is not fixed at `HEAD`.
- Add a horizon-by-count case over a history with a merge. This is fixed at `HEAD` by R-1.

### E-25
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree.

I planted the fault the first audit named as its overturning condition: the stop is thrown inside the outermost transaction, before it commits. T-13-6b kills it through its intermediate assertion that the stopped pass left the watermark at `m2`. So the instrument's one load-bearing property, that the stopped chunk is durable, is pinned.

The wrapper delegates every other method. It fires only at depth 0, so a DAO's nested savepoint cannot trigger it.

**Evidence:**
- [[middleware/context-oracle/ctxoracle/test/unit/miner_chunks_worker.ts@57bdd4a:L37-L48]] "transaction<T>(fn: () => T, opts?: { onBusyRetry?: () => void }): T { depth += 1; let out: T; try { out = inner.transaction(fn, opts); } finally { depth -= 1; } if (depth === 0) { const row = inner.prepare(\"SELECT value FROM schema_meta WHERE key = 'last_mined_commit'\").get() as { value: string | null } | undefined; if (row?.value === stopHash) throw new Error(`injected stop after ${stopHash}`); }"
- Planted: the check moved inside `inner.transaction` at depth 1, so it throws before the commit [[ran]] `mutpy.sh 57bdd4a worker-precommit test/unit/miner_chunks_worker.js m_worker.py "dist/test/unit/miner_branches.test.js"` → `worker-precommit: exit=1 # pass 2 # fail 1`, `not ok 2 - T-13-6b: a pass stopped after the m2 chunk and resumed counts every commit once`.
- The assertion that kills it [[middleware/context-oracle/ctxoracle/test/unit/miner_branches.test.ts@57bdd4a:L164-L164]] "assert.equal(withStore(dbs, (s) => schemaMetaDao(s).get('last_mined_commit')), h.m2, 'the stopped pass left its watermark at m2');"
- I used the same worker for E-1's skew reproduction; it stopped exactly after the named chunk on both builds.

**Correct verdict:** keep.

### E-27
**Agree/Disagree:** Verdict: disagree (keep → replace). Reasoning: disagree.

The first audit concedes that trailer position, `Reapply` and the injection flag are Data gaps. It then keeps the test because "no existing assertion is weak". The brief's test is whether the test would fail if the behaviour were wrong.

On `57bdd4a` the following behaviours can each be broken without any of the 23 tests failing:
- AD-15's primary revert signal: the whole trailer rule can be deleted;
- the trailer's any-line rule: the `m` flag can be dropped;
- the `Reapply` fallback can be removed;
- the landmine's injection flag can be forced to false.

This is the same situation as E-22 and E-23, which the first audit replaced: a faithful build of a specification whose Data cannot detect the defect. Every one of these faults is killed at `HEAD`, by T-13-4d, T-13-1p and R-9, so the correction is **fixed at `HEAD`**.

The first audit's planted faults (substring fix matching; revert after the size exclusion) are killed as it says, and I confirmed two more:
- evidence oldest-first is killed (`# fail 3`);
- a `revert_chain` threshold of 3 is killed (`# fail 4`).

Fix-labelling a revert is an equivalent mutant (`revert` takes precedence in the label), so it is not a gap.

**Evidence:**
- [[middleware/context-oracle/ctxoracle/src/miner/labels.ts@57bdd4a:L21-L23]] "if (REVERT_TRAILER.test(body)) return true; return subject.startsWith('Revert \"') || subject.startsWith('Reapply \"');"
- Planted on `57bdd4a`, whole miner suite:
  - trailer rule disabled (`if (false)`) [[ran]] → `L-notrailer: exit=0 # pass 23 # fail 0`;
  - `m` flag dropped [[ran]] → `L-nom: exit=0 # pass 23 # fail 0`;
  - `Reapply` removed [[ran]] → `L-noreapply: exit=0 # pass 23 # fail 0`;
  - `injection_suspect: false` in the landmine build [[ran]] → `L-nosuspect: exit=0 # pass 23 # fail 0`;
  - subject rule disabled [[ran]] → `L-nosubject: exit=1 # pass 20 # fail 3`. The fixture's reverts all carry `Revert "` subjects, so the subject rule alone decides every case.
- The same four surviving faults on `HEAD`:
  - [[ran]] `L-notrailer` → `exit=1 # pass 47 # fail 2` (`T-13-1p`, `T-13-4d`);
  - `L-nom` → `exit=1 # pass 47 # fail 2`;
  - `L-noreapply` → `exit=1 # pass 48 # fail 1` (`T-13-4d: isRevertLabelled — the trailer is recognised as any whole body line; Reapply is the second subject fallback`);
  - `L-nosuspect` → `exit=1 # pass 48 # fail 1` (`R-9: a miner landmine carries the file row's path injection flag; revert_chain counts over the horizon, not the fix window`).

**Correct verdict:** replace.
- Keep every existing assertion.
- Add a trailer-only revert (a non-`Revert "` subject), a trailer after an explanation line, a `Reapply` commit, and an injection-suspect path's landmine flag.

Fixed at `HEAD`, by T-13-4d, T-13-1p and R-9.

### E-28
**Agree/Disagree:** Verdict: disagree (keep → replace). Reasoning: disagree.

1. **The pair comparison is vacuous.** The first audit's "Would be wrong if" asked whether `historySnapshot` omits a purge-set table. It covers all five, but the fixture T-13-3 rewrites (`miner-labels`) contains no multi-file commit. Mined, it has zero `cochange_pairs` rows. So the specification's "`cochange_pairs` (weights included)" clause cannot fail. Deleting the purge of `cochange_pairs` passes T-13-3, on both builds. Other tests kill that fault suite-wide, but not on the rewrite path this test claims.
2. **Batch 4's settled cases are absent.** Batch 4 settled that T-13-3 must pin the branch-switch, pruned-watermark and git-fault cases. At `57bdd4a` T-13-3 has none of them. The build review's R1 (exit 128) survived it. At `HEAD` R-7 pins exit 128 as a rewrite with a purge, which is the opposite of batch 4's "a git fault, with no purge". No branch-switch case exists at `HEAD`.

The test builds on a specification batch 4 marked for correction, and its pair clause is empty. It cannot stand as it is.

The rest holds. I confirmed these planted faults are killed by T-13-3 alone:
- purge keeps `labelled_touches`;
- purge keeps change counts;
- purge keeps `commits`;
- exit 1 not treated as a rewrite;
- fault detail swapped.

**Evidence:**
- The specification's clause [[middleware/context-oracle/docs/plans/plan-phase-a.md@277b0a2:L10964-L10967]] "- **NOT asserts.** Timing. **Fails when** any row of `commits`, `cochange_pairs` (weights included), `labelled_touches`, `files.change_count`/`change_weight`, or the miner-kind `landmines` differs from the from-scratch store's, OR any row"
- The fixture used [[middleware/context-oracle/ctxoracle/test/unit/miner_rewrite.test.ts@57bdd4a:L131-L131]] "generateFixture('miner-labels', repo);"
- Executed: `generateFixture('miner-labels', …)` from the `57bdd4a` build, then mined [[ran]] `node genfx.mjs <57bdd4a> fxl miner-labels; node mine.mjs <57bdd4a> fxl t` → `pairs 0 []`, `commits 18`.
- Planted, `57bdd4a`, T-13-3 alone:
  - [[ran]] `mut.sh 57bdd4a R-pairs src/miner/cochange.js "s#pairs.deleteAll();##" "dist/test/unit/miner_rewrite.test.js"` → `R-pairs: exit=0 # pass 1 # fail 0`;
  - `HEAD`, the same [[ran]] → `R-pairs-rw: exit=0 # pass 1 # fail 0`;
  - the other five faults (`touches.deleteAll`, `resetChangeCounts`, `commits.deleteAll` removed; status 1 not a rewrite; detail swapped) [[ran]] → each `exit=1 # pass 0 # fail 1`.
- Batch 4's settled items [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B4-verification.md@HEAD:L112-L112]] "- T-13-3 pins the branch-switch, pruned-watermark and git-fault cases." and [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B4-verification.md@HEAD:L108-L108]] "Any other status: a git fault, with no purge."
- The build review's row [[middleware/context-oracle/docs/reviews/2026-09-26-step-13-build-review.md@HEAD:L317-L317]] "| R1 | exit 128 (watermark object gone) not a rewrite | `src/miner/cochange.ts:371` | survived | killed | R-7 |"

**Correct verdict:** replace.
- Keep the from-scratch oracle, the dead-hash scan, the fault and human-row assertions.
- Give the rewritten history at least one multi-file commit, so the pair clause can fail.
- Add batch 4's branch-switch (a `branch_changed`-class diagnostic, no purge), pruned-watermark (`cat-file -e` exit 1: a rewrite) and git-fault (exit 128: a fault, no purge) cases.

Not fixed at `HEAD`: the pair clause is still vacuous, and R-7 pins the opposite of batch 4 for exit 128.

## Summary (recounted from the sections above)

| Entry | First audit | Second opinion | Fixed at `HEAD`? |
|---|---|---|---|
| E-1 | replace | replace (agree) | no — the skew loss reproduces on `HEAD` |
| E-2 | keep | keep | — |
| E-6 | replace | replace (verdict agreed; reasoning corrected) | no |
| E-7 | keep | keep | — |
| E-9 | keep | keep | its missing test is added at `HEAD` (R-1) |
| E-11 | keep | keep (weaker reason) | — |
| E-12 | keep | keep | the `prov_kind` guard's test is added at `HEAD` (R-12) |
| E-13 | keep | keep (reasoning corrected) | "newest" is pinned at `HEAD` (T-13-4e) |
| E-15 | keep | keep | retired at `HEAD` |
| E-16 | replace | replace (list extended) | partly — see the section |
| E-17 | keep | **replace** | no |
| E-18 | keep | keep (reasoning corrected) | test added at `HEAD` (R-12) |
| E-20 | keep | keep | — |
| E-21 | keep | **replace** | no |
| E-22 | replace | replace | merge assertion: no; count case: yes (R-1) |
| E-25 | keep | keep | — |
| E-27 | keep | **replace** | yes (T-13-4d, T-13-1p, R-9) |
| E-28 | keep | **replace** | no |

**Counts across the 18 entries judged:**
- keep 10: E-2, E-7, E-9, E-11, E-12, E-13, E-15, E-18, E-20, E-25;
- replace 8: E-1, E-6, E-16, E-17, E-21, E-22, E-27, E-28;
- remove 0;
- undetermined 0.

**Of the 14 first-audit keeps:**
- 10 stand;
- 4 are overturned to replace: E-17, E-21, E-27 and E-28.
