# Branch audit — batch 8, part b (the Step 14 review and its fixes): second opinion

This file is the second opinion on the first audit `2026-09-26-branch-audit-B8b.md`
(E-1 … E-27) of commits `8a234d6`, `bfe8d3b`, `0528470`, `221a1bc`, `42dbbd0`, `7fdbd7e`
and `fbb9052`. The author wrote neither the changes nor the first audit. It judges the
twelve entries assigned: the keeps E-9, E-12, E-13, E-15, E-16, E-17, E-19, E-24 and the
replaces E-3, E-7, E-14, E-25. The test applied is the auditor brief
`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/BRIEF.md`.
Settled and not re-litigated: the B1–B7 verification files and the coordinator rulings of
2026-09-28. Those that govern here: batch 3's ≥ 25 ms inter-chunk yield; batch 5 ruling 3
(fallback token tables only under `fallback`) and item 10 (an unresolved `HEAD` sets the
handler's two staleness flags true); batch 7 item 5 (remove the miner's `GIT_CONFIG_*`
inheritance); the schema-checksum ruling (applied migrations are fixed). The B8a first audit
(the build `177e59f`) is provisional and nothing here rests on it.

**How the work was done.**
- Own scratch extractions under the scratchpad folder `b8b2/`: `git archive <commit>
  middleware/context-oracle/ctxoracle | tar -x`, this checkout's `node_modules` symlinked,
  `npm run build`. Builds: `7fdbd7e` and `HEAD` (`9f273be`; batch 9's Step 15 commits
  `059dc86` … `1b8b47a` are inside it). Node 22.22.2, git 2.43.0.
- `b8b2/exp/h.mjs` is a harness over a build's `dist` (chosen by `DIST=`): fresh stores
  seeded as the tests seed them, throwaway repositories made with every `GIT_*` variable
  removed from the child environment, and `runIndex` called directly. The experiment
  scripts beside it are named in each entry.
- `b8b2/mut.py <ctxoracle dir> <test files> [ids]` plants one mutant at a time in a copy of
  the `7fdbd7e` build (`b8b2/mut/`), by an exact substring replacement on a named line of the
  compiled `dist/src` file (it asserts the text is there), runs `node --test` on each named
  compiled test file with `GIT_*` removed, and restores the file. A mutant is killed when any
  file exits non-zero. The file set, called FILES below, is `indexer_inputs.test.js`,
  `indexer_reads.test.js`, `indexer_review.test.js`, `indexer_stale.test.js`,
  `indexer.test.js`, `indexer_walk.test.js`, `repo_key.test.js`, `miner_git_env.test.js`.
  Baseline: all eight exit 0 on the unmutated copy. `mut2.py` and `mut3.py` are the same
  harness with other mutant lists. Outputs: `b8b2/mut-out.txt`, `mut2-out.txt`, `mut3-out.txt`.
- Primary sources were fetched with `curl` and stripped of markup: git-scm.com `reftable`
  and `BreakingChanges`, git's own source at `v2.45.0` and `v2.51.0`
  (raw.githubusercontent.com), SQLite's `func.c` and `lang_expr.html`, man7.org open(2),
  cwe.mitre.org CWE-59, the Ninja manual.
- The repository was never checked out or modified; `git status --short` was empty before
  and after the one real-repository run (E-15).

`HEAD` above means the code at `9f273be` when it was extracted. `0e7ad2c` (the B8a first
audit) landed during this work and changes one review file only (`git diff --stat 9f273be
0e7ad2c` → `1 file changed, 536 insertions(+)`), so every `HEAD` source citation holds at
both.

### E-3
**Agree/Disagree:**
- Verdict: **agree**, replace.
- Reasoning: agree that the S1 fingerprint half is the root-cause fix, and that the S2 half
  narrows "every input" to file presence. I reproduced all three stale-row cases on a `HEAD`
  build, plus two more. One piece of the backing needs correcting, and one case is missing.
  - **The `.js` case is a Step 15 order, not a 221a1bc rule.** At `221a1bc` the plan's
    TypeScript rule tries "the written path if it exists" first; a `.js` specifier only
    "also tries" its `.ts` source. Under that text, an importer resolved to `b.js` would not
    change when `b.ts` appears. The gap in the first audit's `ts` run exists because `HEAD`'s
    resolver (batch 9) tries the source extensions before the written path.
  - **The same gap exists under the 221a1bc wording.** An extensionless specifier tries
    `.ts` before `.js` in both the plan and the code. So `./b` resolved to `b.js` goes stale
    when `b.ts` appears (my `tsext` run). "Name exactly" was false when it was written.
  - **Rule (b) also misses a disappearance.** At `HEAD`, deleting the only in-repo module
    with a top-level name turns an importer's `unresolved` into `external`. No edge pointed
    at the deleted file, so rule (b) forces nothing and the count stays stale until `--full`
    (my `pydel` run). The first audit's three cases are all appearances or edits. This one
    shows that (b), not only (a), is incomplete.
  - The root cause is that the pass caches resolution results but not the inputs the
    resolver actually read. The standard remedy is the one build tools use for
    discovered dependencies: record what the consumer read, and rebuild when any of it
    changes. For resolution those reads are `RepoFiles` queries: the probed candidate paths,
    whether present or absent, the `package.json` consulted, and (at `HEAD`) the
    `hasTopLevelModule` names.
  - Agree that the h24 half (the final transaction writes `frontend_fingerprint` and
    `walk_errors`) stands.
  - The first audit's untested read-time forcing and worklist (B2, B3) are re-planted in my
    own run below.

**Evidence:**
- AD-12's claim [[middleware/context-oracle/docs/architecture-phase-a.md@0528470:L1428-L1430]] "files with `unresolved_imports > 0` when a file appears, the sources of the dropped edges when one disappears"
- The plan's exactness claim [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L3857-L3859]] "The rule needs no stored specifiers: (a) and (b) name exactly the files whose resolution can change."
- The 221a1bc TypeScript rule, written path first [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L4213-L4213]] "the written path if it exists; a `.js`/`.jsx`/" and the extensionless order [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L4215-L4216]] "an extensionless one tries `.ts`, `.tsx`, `.js`, `.jsx`, then `/index.` + those; first existing file wins"
- The 221a1bc interface already hands resolvers a second input [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L3594-L3594]] "nearestPackageJsonDeps(fromPath: string): ReadonlySet<string>;"
- The rules as coded [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@7fdbd7e:L585-L586]] "if (listed.some((p) => stored.get(p)?.in_tree !== 1)) { for (const r of storedInTree) if (r.unresolved_imports > 0 && presentSet.has(r.path)) forced.add(r.path);" and [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@7fdbd7e:L589-L589]] "for (const r of storedInTree) if (!presentSet.has(r.path)) forceSourcesOf(r.path);"
- `HEAD`'s resolver reads more than presence [[middleware/context-oracle/ctxoracle/src/index/resolvers.ts@HEAD:L53-L53]] "'.js': ['.ts', '.tsx']," and [[middleware/context-oracle/ctxoracle/src/index/resolvers.ts@HEAD:L95-L95]] "return repo.nearestPackageJsonDeps(fromPath).has(name) ? EXTERNAL : UNRESOLVED;" and [[middleware/context-oracle/ctxoracle/src/index/resolvers.ts@HEAD:L139-L139]] "return repo.hasTopLevelModule(rest.split('.')[0] as string) ? UNRESOLVED : EXTERNAL;"
- Five runs on the `HEAD` build with `defaultFrontends` (index, change, index, then `--full`) [[ran]] `DIST=<HEAD dist> node exp/s2.mjs <case>` →
  - `ts` (`./b.js`, then `src/b.ts` added): `pass2 1 {"edges":["src/a.ts->src/b.js"]`, `full  3 {"edges":["src/a.ts->src/b.ts"]`
  - `tsext` (`./b`, then `src/b.ts` added): `pass2 1 {"edges":["src/a.ts->src/b.js"]`, `full  3 {"edges":["src/a.ts->src/b.ts"]`
  - `py` (`import helper`, then `app/helper.py` added): `pass2 1 {"edges":[]`, `full  3 {"edges":["app/main.py->app/helper.py"]`
  - `pkg` (`lodash` declared in `package.json`): `pass2 1 {"edges":[],"unres":["package.json:0","src/a.ts:1"]}`, `full  2 {"edges":[],"unres":["package.json:0","src/a.ts:0"]}`
  - `pydel` (`lib/helper.py` deleted): `pass1 2 {"edges":[],"unres":["app/main.py:1","lib/helper.py:0"]}`, `pass2 0 {"edges":[],"unres":["app/main.py:1"]}`, `full  1 {"edges":[],"unres":["app/main.py:0"]}`
- Cost of rule (a) on this repository: the full index in E-15 leaves `"unresolvedFiles":60`, so any new path forces 60 re-parses.
- Build-tool practice for discovered inputs [[https://ninja-build.org/manual.html]] "The problem with headers is that the full list of files that a given source file depends on can only be discovered by the compiler: different preprocessor defines and include paths cause different files to be used."
- Mutants planted on `7fdbd7e` [[ran]] `python3 mut2.py <mut> FILES` → `B2x SURVIVED [read-time disappearance forces no edge source] by=[]`, `B3x SURVIVED [re-processing worklist removed] by=[]`: the read-time forcing and the worklist are unpinned, as the first audit found.

**Correct verdict:** replace — keep the fingerprint trigger and h24. Restate S2 as dependency tracking of each importer's `RepoFiles` queries: candidate paths probed, whether present or absent; the `package.json` read; and at `HEAD` the top-level-name queries. Re-parse the importer when any answer changes. Drop "covers every input" and "name exactly" until that holds, and add cases for the appearance, edit and disappearance kinds shown.

### E-7
**Agree/Disagree:**
- Verdict: **agree**, replace.
- Reasoning: agree on both defects, and both reproduce on my builds.
  - **The catch-all.** The plan names "unreadable" and `EACCES` as reasons to treat a
    directory's files as absent. Absent deletes their derived rows. With `readdirSync` made to
    fail `EIO` or `EMFILE` on one subdirectory (the container runs as root, so a permission
    failure cannot be produced; the failure is injected at the `node:fs` binding the walk
    uses), the file beneath it loses its `files` row and its symbol, and no fault is
    recorded. The only trace is the `schema_meta.walk_errors` row. So an environmental
    failure silently deletes rows of present files.
  - Agree that "as git mode treats a failed `lstat`" cites a catch-all as its precedent. The
    `lstat` loop swallows every error.
  - Agree that the no-fault reason is on the record. So that half of review m2 ("count the
    skipped directories into a fault") was rejected, not dropped. The reason itself argues
    for a new code, not for none.
  - **The symlinked tracked directory.** Reproduced: `git ls-files --cached` still lists
    `src/b.ts`, and `git check-ignore` exits 128. `gitWalk` then throws, so every later pass
    fails. The throw is visible on the CLI. Under the detached reindex it records nothing,
    because the `index` verb has no `catch` (batch 7 item 8). This defect is `177e59f`'s
    `gitWalk`, unchanged by `7fdbd7e`, and still present at `HEAD` (`walk.ts` is unchanged
    since `7fdbd7e`).
  - One addition to the first audit's alternative. Dropping listed paths that lie beneath a
    symlinked parent directory (an `lstat` of each distinct parent) also removes the only
    thing that stops a read through an intermediate link today; see E-9. So that check
    belongs in the walk whatever is decided about the throw.

**Evidence:**
- The plan rule [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L3673-L3676]] "is skipped and appended to `walkErrors` as `{path, code}` (the repository-relative path and the error's `code`, e.g. `ENOENT`, `EACCES`); the walk continues, and the files beneath it are not listed, so this pass treats them as absent — as git mode treats a failed `lstat`"
- The no-fault reason [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L3679-L3680]] "none of Step 6's codes means a skipped directory"
- Review m2's fix [[middleware/context-oracle/docs/reviews/2026-09-26-step-14-build-review.md@bfe8d3b:L236-L237]] "*Fix (code):* catch per directory, count the skipped directories into a fault, and continue."
- The code [[middleware/context-oracle/ctxoracle/src/index/walk.ts@7fdbd7e:L100-L101]] "if (relPrefix === '') throw e; walkErrors.push({ path: relPrefix, code: String((e as NodeJS.ErrnoException).code ?? 'UNKNOWN') });" and the precedent [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@7fdbd7e:L520-L523]] "if (lstatSync(path.join(repoPath, p)).isFile()) listed.push(p); } catch { // absent }"
- Injected subdirectory failure in a `readdir` root (`sub/x.ts`, `top.ts`) [[ran]] `DIST=<dist> node exp/walkerr.mjs EIO` → on `7fdbd7e` and on `HEAD`: `pass1 [{"path":"sub/x.ts","in_tree":1,"syms":1},{"path":"top.ts","in_tree":1,"syms":0}]`, `pass2 EIO absent 1 walkErrors 1 [{"path":"top.ts","in_tree":1,"syms":0}] faults []`; the same with `EMFILE`.
- The symlinked directory [[ran]] `sh exp/dirlink.sh <dir>` (git 2.43.0) → `git ls-files` prints `src`, `src/b.ts`, `top.ts`; `check-ignore` prints `fatal: pathspec 'src/b.ts' is beyond a symbolic link`. [[ran]] `DIST=<dist> node exp/dirlink.mjs` → on `7fdbd7e` and on `HEAD`: `pass2 threw: git check-ignore failed (exit 128): fatal: pathspec 'src/b.ts' is beyond a symbolic link`, `faults []`.
- The throwing branch [[middleware/context-oracle/ctxoracle/src/index/walk.ts@HEAD:L76-L77]] "if (ci.status !== 0 && ci.status !== 1) { throw new Error(`git check-ignore failed (exit ${ci.status}): ${ci.stderr.toString('utf8').trim()}`);"
- Unchanged since the fix [[ran]] `git diff --stat 7fdbd7e HEAD -- middleware/context-oracle/ctxoracle/src/index/walk.ts` → empty.
- The first audit's W1/W2 were not re-planted; the catch is shown above by execution, not by mutation.

**Correct verdict:** replace — keep the root throw and the skip-and-absent rule for `ENOENT`/`ENOTDIR`. For any other directory error, keep the stored rows beneath it and record a fault. Drop listed paths beneath a symlinked parent before `check-ignore`, so one such directory no longer fails every pass.

### E-9
**Agree/Disagree:**
- Verdict: **disagree** — replace, not keep.
- Reasoning: agree that M1 was real. Agree that one open with
  `O_NOFOLLOW | O_NONBLOCK`, an `fstat` of the descriptor, and a cap + 1 bounded read fix the
  size, final-link and FIFO halves at their root. Each of those clauses is sourced.
  - The keep fails on the part the first audit set aside, in its reasoning point (4).
  - open(2) says `O_NOFOLLOW` leaves "symbolic links in earlier components" followed. The
    first audit says such a case is stopped by the walk's `check-ignore` failure "before any
    read", so it is "a walk defect, not a leak". That holds only when the swap happens
    before the walk. M1 is about the window after the walk's `lstat`, and the plan's own
    CWE-367 citation says the tree changes while the detached reindex runs.
  - I did the swap inside that window, from a frontend's `parse` of an earlier file, the
    same technique the review and T-14-7 use for growth. The tracked `src/b.ts` was then read
    through the linked parent, and stored with a symbol taken from a file outside the
    repository. That is the out-of-tree read M1 exists to stop (CWE-59), through the helper
    the plan calls the fix.
  - The first audit's alternatives analysis is incomplete. It lists only `openat2`, which
    Node lacks, and `/proc/self/fd`, which is Linux-only. A portable post-open check exists:
    `realpath` the path, require it to lie under the checkout root, and require its `stat`
    `dev`/`ino` to equal the descriptor's `fstat`.
    - A swap back before the check changes the inode, so it is caught.
    - A link left in place makes the realpath fall outside the root, so it is caught.
  - So the plan's helper is the right shape, but it is not yet the fix for the defect class
    M1 names. It needs that clause, or at least a recorded residual.

**Evidence:**
- The plan rule [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L3783-L3784]] "goes through one helper that opens with `O_RDONLY | O_NOFOLLOW | O_NONBLOCK`, `fstat`s the descriptor, and reads at most its bound" and its own TOCTOU premise [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L3779-L3781]] "CWE-367: a check on a path and a later use of that path are not one operation, and the working tree changes while the detached reindex runs"
- M1 as the review stated it [[middleware/context-oracle/docs/reviews/2026-09-26-step-14-build-review.md@bfe8d3b:L117-L119]] "The byte cap is enforced on the `lstat` size, not on the read, so a file that grows (or is swapped for a link) between the two is read and parsed whole."
- open(2) [[https://man7.org/linux/man-pages/man2/open.2.html]] "If the trailing component (i.e., basename) of path is a symbolic link, then the open fails, with the error ELOOP" and [[https://man7.org/linux/man-pages/man2/open.2.html]] "Symbolic links in earlier components of the pathname will still be followed."
- CWE-59 [[https://cwe.mitre.org/data/definitions/59.html]] "The product attempts to access a file based on the filename, but it does not properly prevent that filename from identifying a link or shortcut that resolves to an unintended resource."
- The walk's `lstat` runs before any read [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@7fdbd7e:L520-L520]] "if (lstatSync(path.join(repoPath, p)).isFile()) listed.push(p);" and the read opens by path [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@7fdbd7e:L159-L159]] "fd = openSync(abs, OPEN_FLAGS);"
- [[ran]] `DIST=<dist> node exp/midlink.mjs` → on `7fdbd7e` and `HEAD`: `filesWritten 2 [{"path":"a.ts","name":"a"},{"path":"src/b.ts","name":"outsideSecret"}]`.
- The non-racy form is stopped by the walk, as the first audit said [[ran]] `DIST=<dist> node exp/dirlink.mjs` → `pass2 threw: git check-ignore failed (exit 128): fatal: pathspec 'src/b.ts' is beyond a symbolic link`.

**Correct verdict:** replace — keep the descriptor-bounded helper. Add a post-open containment check: the path's realpath lies under the checkout root and its `dev`/`ino` equal the descriptor's; otherwise the path is absent this pass. Or record the intermediate-link residual in §13 with its consequence. Add T-14-7 a parent-swap case.

### E-12
**Agree/Disagree:**
- Verdict: **agree**, keep.
- Reasoning: agree that committing each absent file's `in_tree = 0` with its derived-row
  deletes is the root-cause fix for M5. It removes the inconsistent state instead of
  sweeping it later.
  - I planted my own version of the old order: every `in_tree = 0` committed in one
    transaction before the chunks. `indexer_inputs.test.js` (T-14-6's `TEMP`-trigger case)
    kills it.
  - The reverse order (all deletes, then `in_tree = 0` afterwards) survives, and it should.
    A crash there leaves `in_tree = 1` rows with no derived rows, and the next pass finds
    them absent again and repeats the deletes. The rule forbids only the state no pass
    revisits.
  - Dropping the `AND in_tree = 1` guard survives. The guard is idempotence insurance, not
    behaviour.
  - Checked the claim behind "Would be wrong if": no other path sets `in_tree = 0`.
    `markAbsentExcept` still exists in the DAO but is not called from `src/index/`.
  - Found beyond the first audit, and not a defect in this rule: two of the deletes the rule
    lists have no test. Dropping the absent file's `symbol_refs` delete (A2) or its
    `test_map` delete (A3) survives FILES. The code does both. The gap belongs to the test
    entries (E-20, E-21), and E-25 records it.
  - Dropping the delete of edges into the file (A1) also survives. That one is redundant:
    rule (b) re-parses every source of those edges, and pass 2 rewrites their edges without
    the absent file.

**Evidence:**
- The rule [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L3874-L3877]] "`symbol_refs`, `test_map`, FTS, and `path_tokens` rows are deleted and `in_tree` set to 0 **in the same chunk transaction** — the `UPDATE files SET in_tree = 0 WHERE id = ?` and that file's derived-row deletes commit together"
- The code [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@7fdbd7e:L829-L829]] "const setAbsent = store.prepare('UPDATE files SET in_tree = 0, updated_at = ? WHERE id = ? AND in_tree = 1');"
- [[ran]] `grep -rn "in_tree = 0\|markAbsentExcept" <7fdbd7e>/src` → the `setAbsent` statement and comments in `index/indexer.ts`; `markAbsentExcept` only in `stores/dao/files.ts` (L59, L147).
- [[ran]] `python3 mut2.py <mut> FILES` → `A9 KILLED [old order: every in_tree=0 committed before the chunks (part 1)] by=['indexer_inputs.test.js']`, `B2x SURVIVED [read-time disappearance forces no edge source] by=[]`, `B3x SURVIVED [re-processing worklist removed] by=[]` (B2x and B3x are for E-3), `U1 KILLED [unresolved HEAD returns stale] by=['indexer_stale.test.js']` (for E-14).
- [[ran]] `python3 mut.py <mut> FILES` → `A7 SURVIVED [in_tree=0 committed after the chunks (part 1)] by=[]`, `A8 SURVIVED [setAbsent without the in_tree=1 guard] by=[]`, `A1 SURVIVED [absent chunk keeps edges into the file] by=[]`, `A2 SURVIVED [absent chunk keeps its symbol_refs] by=[]`, `A3 SURVIVED [absent chunk keeps its test_map rows] by=[]`, `A4 KILLED [absent chunk keeps path_tokens] by=['indexer_inputs.test.js', 'indexer_review.test.js']`, `A5 KILLED [absent chunk keeps fts_paths]`, `A6 KILLED [absent chunk keeps symbols] by=['indexer_inputs.test.js']`.

**Correct verdict:** keep — per-file atomic absence is the root-cause fix, and a planted old order is killed. The untested `symbol_refs`/`test_map` deletes are a test gap, recorded under E-25, not a change to this rule.

### E-13
**Agree/Disagree:**
- Verdict: **agree**, keep.
- Reasoning: agree. The globbing rules in SQLite's own source list `*`, `?`, `[...]` and
  `[^...]`, and no escape character; `[...]` matches one character from the enclosed list.
  So a one-character class is how a metacharacter is made literal.
  - `]` is literal outside a class and `^` is special only inside one, so escaping `[`, `*`
    and `?` is complete.
  - I ran the escape over paths containing `[`, `]`, `*`, `?`, `^` and `!`. Each escaped
    pattern matched its own path and rejected a near-miss.
  - My three mutants are all killed by `indexer_reads.test.js`: `[` not escaped, `*` not
    escaped, and the stored row unescaped. The first audit reports its `?` mutant (G1) killed as
    well.
  - The unchanged-tree comparison uses the escaped form, so a re-run writes nothing.

**Evidence:**
- The rule [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L3894-L3896]] "each SQL-GLOB metacharacter `[`, `*`, `?` in the path is wrapped in brackets (`[` → `[[]`, `*` → `[*]`, `?` → `[?]`)"
- The code [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@7fdbd7e:L450-L452]] "function globEscape(p: string): string { return p.replace(/[[*?]/g, '[$&]'); }"
- SQLite's globbing rules [[https://raw.githubusercontent.com/sqlite/sqlite/master/src/func.c]] "Matches one character from the enclosed list of" and [[https://www.sqlite.org/lang_expr.html]] "The GLOB operator is similar to LIKE but uses the Unix file globbing syntax for its wildcards."
- [[ran]] `node exp/glob.mjs` (Node 22.22.2 `node:sqlite`) → `"app/[id]/page.ts" GLOB "app/[[]id]/page.ts" 1`, `"app/i/page.ts" GLOB "app/[[]id]/page.ts" 0`, `"lib/aXYb.ts" GLOB "lib/a[*]b.ts" 0`, `"qz.ts" GLOB "q[?].ts" 0`, `"a]b[c.ts" GLOB "a]b[[]c.ts" 1`, `"a]bxc.ts" GLOB "a]b[[]c.ts" 0`, `"x^[!].ts" GLOB "x^[[]!].ts" 1`.
- [[ran]] `python3 mut.py <mut> FILES` → `G2 KILLED [[ not escaped] by=['indexer_reads.test.js']`, `G3 KILLED [* not escaped] by=['indexer_reads.test.js']`, `G4 KILLED [region_glob stored unescaped] by=['indexer_reads.test.js']`.

**Correct verdict:** keep — the correct GLOB escape, source-backed, executed and pinned.

### E-14
**Agree/Disagree:**
- Verdict: **agree**, replace.
- Reasoning: agree on three points: the transition-only fault is right; neither of M4's two
  remedies (read reftable, or a §15 record) was carried out; and the config scan is
  redundant. Disagree on where the first audit puts the batch 5 conflict. That changes the
  correction.
  - **`{stale: false}` is not what batch 5 overturned.** `refreshIfStale`'s result has one
    reader: the `SessionStart` item, which spawns the detached reindex when it is `true`.
    Confidence dampening does not read it. Step 28's `EventContext` computes `indexStale`
    and `historyStale` itself, from its own `resolveHead`, and at `221a1bc` it sets both
    false for an unresolved `HEAD`. That handler clause is what batch 5 item 10 replaced.
    The batch 5 adjudication says why: D-plan-30's ground for never-stale is the reindex
    storm, and a confidence dampener spawns nothing. So `refreshIfStale` returning
    `{stale: false}` for an unreadable layout matches the settled ruling. The first audit's
    step (2) ("every downstream reader treats the index as fresh") and its alternative (a)
    aim the fix at the wrong function. The same error carries into E-23's "make the
    reftable case expect dampening".
  - **The real reftable consequence is missing from both the plan and the first audit.**
    On a reftable repository no event ever spawns a reindex. The index therefore stays at
    whatever the last explicit `ctxoracle index` or `init` wrote, however far `HEAD` moves.
    Once batch 5 item 10 is built in the handler, confidence is dampened, but the index is
    never refreshed. With git's announced default change, that is a growing class of
    repositories. It is a known gap with a consequence, so §13/§15 must record it. At
    `221a1bc` and at `HEAD` neither section mentions reftable.
  - **The config scan is redundant, checked against git's own source.** The reftable
    backend writes the dummy `HEAD` whenever it creates a ref store (`init_db` at `v2.45.0`,
    `create_on_disk` at `v2.51.0`). `git worktree add` creates a linked worktree's store
    through the same call. `git refs migrate` creates the new store and then moves its files
    over the old gitdir. So every reftable layout git creates has
    `ref: refs/heads/.invalid` in the `HEAD` the resolver reads. The config scan, with its
    unsourced 64 KiB bound, catches no case the `HEAD` check misses. The first audit's
    "Would be wrong if" asked for exactly this check.
  - My own mutant `U1` (the unresolved branch returns `{stale: true}`) is under E-12's
    evidence line for `mut2.py`. It is killed, so `{stale: false}` is pinned.

**Evidence:**
- The plan rule [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L3969-L3971]] "The resolver does not read the reftable format; the staleness of such a repository is **unknown**, never stale and never spawning a reindex"
- The only reader of `refreshIfStale`'s result [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L5866-L5867]] "when stale **and not a worktree event** (AD-23: indexing another tree would overwrite the main checkout's index), the detached reindex child"
- The handler's own staleness, where the dampening lives [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L5842-L5843]] "an `{unresolved}` `HEAD` makes both false (the same direction `refreshIfStale` takes)."
- Batch 5 item 10 [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B5-verification.md@HEAD:L160-L161]] "Set both staleness flags true (dampen), with a bar-specific reason." and its ground [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B5b-adjudication.md@HEAD:L108-L108]] "D-plan-30's ground for never-stale is the reindex storm, and a confidence dampener spawns nothing."
- The code [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@7fdbd7e:L294-L295]] "// repository is unknown — never stale, never a reindex. if (h === REFTABLE_HEAD || configSaysReftable(path.join(commonDir, 'config'))) return { unresolved: 'reftable' };" and the bound [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@7fdbd7e:L211-L211]] "const CONFIG_MAX_BYTES = 64 * 1024;"
- The dummy `HEAD` [[https://git-scm.com/docs/reftable]] "a reftable-enabled repository must contain the following dummy files", the first being `.git/HEAD`, "a regular file containing" `ref: refs/heads/.invalid`.
- git's reftable backend writes it on every store creation [[https://raw.githubusercontent.com/git/git/v2.51.0/refs/reftable-backend.c]] "static int reftable_be_create_on_disk(struct ref_store *ref_store," then "ref: refs/heads/.invalid" (L464, L477); at `v2.45.0` [[https://raw.githubusercontent.com/git/git/v2.45.0/refs/reftable-backend.c]] "static int reftable_be_init_db(struct ref_store *ref_store," then "ref: refs/heads/.invalid" (L298, L311).
- A linked worktree's store is made the same way [[https://raw.githubusercontent.com/git/git/v2.51.0/builtin/worktree.c]] "ret = ref_store_create_on_disk(wt_refs, REF_STORE_CREATE_ON_DISK_IS_WORKTREE, &sb);" and [[https://raw.githubusercontent.com/git/git/v2.45.0/builtin/worktree.c]] "ret = refs_init_db(wt_refs, REFS_INIT_DB_IS_WORKTREE, &sb);"
- Migration creates the new store, then moves it over the old [[https://raw.githubusercontent.com/git/git/v2.51.0/refs.c]] "ret = ref_store_create_on_disk(new_refs, 0, errbuf);" and "ret = move_files(new_gitdir.buf, old_refs->gitdir, errbuf);"
- The default change [[https://git-scm.com/docs/BreakingChanges]] "The default storage format for references in newly created repositories will be changed from"
- No reftable here [[ran]] `git init -q --ref-format=reftable rt` (git 2.43.0) → git rejects the option (`unknown option`, then its usage text), exit 129.
- No §13/§15 record [[ran]] `grep -n -i reftable` over the `221a1bc` plan → last hit L12181, with §13 at L14245 and §15 at L14934; over the `HEAD` plan → last hit L12284, with §13 at L14393 and §15 at L15082.

**Correct verdict:** replace — keep the transition-only fault and `refreshIfStale`'s `{stale: false}` (never spawn from an unreadable layout). Drop the redundant config scan and its 64 KiB bound. In §13/§15, record that a reftable repository's index is never refreshed by events, and git's default change. The dampening correction stays where batch 5 item 10 put it, in Step 28's `EventContext`, not in `refreshIfStale`.

### E-15
**Agree/Disagree:**
- Verdict: **agree**, keep.
- Reasoning: agree on both halves.
  - **The miner clause is right.** The miner reads git history, not frontends, so a
    frontend change or an index crash flag is no reason to purge and re-mine. The miner has
    its own `mining_in_progress` for its crash case. The code passes the caller's `full`.
  - **The memory half is honestly stated.** It is written as a limit with its mechanism, a
    §13 residual, and the fix. The fix is optional in the review, and it conflicts with
    nothing: resolution needs the present set, not the held symbols.
  - I re-measured on a `HEAD` build with the real frontends: a full index of this repository
    peaks at 242 MB resident, with the tree-sitter runtime and the miner included. That
    matches the first audit's 239 MB, and it supports deferral at Phase A's scale.
  - One gap, which does not change this verdict. My mutant passing the computed `full` to
    the miner survives FILES, and no §12 test specification names the clause. The plan's
    decision stands, but it is unpinned. The missing case belongs to the test
    specifications (E-20) and is recorded under E-25.

**Evidence:**
- The miner clause [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L3932-L3934]] "a pass made full by `indexing_in_progress` or by the fingerprint passes the caller's own `full`."
- The code [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@7fdbd7e:L1000-L1000]] "walk.mode === 'git' ? await mineCochange(store, repoPath, { tuning: t, diagnosticsDir: opts.diagnosticsDir, full: opts.full }) : null;"
- The stated limit [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L3935-L3935]] "**Memory — a stated limit (Step 14 build review m4).** All parse output of" and its fix [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L14406-L14407]] "the recorded fix, if a bound is wanted, is to write pass 1 in chunks as files are parsed"
- [[ran]] `DIST=<HEAD dist> node exp/mem.mjs /home/user/agent-armory` (a full index into scratch stores, `defaultFrontends`) → `{"ms":18768,"filesWritten":1952,"symbols":5146,"edges":1226,"unresolvedFiles":60,"peakRssMB":242}`; `git status --short` empty before and after.
- [[ran]] `python3 mut.py <mut> FILES` → `N1 SURVIVED [miner gets the computed full] by=[]`.
- [[ran]] `grep -n "caller's own" <221a1bc plan>` → L3933 only, in Step 14's text; no §12 hit.

**Correct verdict:** keep — the miner clause is correct and the memory limit is stated with its residual and fix; measured at 242 MB peak here. The clause's missing test is recorded under E-25/E-20.

### E-16
**Agree/Disagree:**
- Verdict: **disagree** — replace, not keep.
- Reasoning: agree that the three keys are data in a key–value table, so no migration is
  needed. Agree that each key's decision is judged in its own entry. Two things fail the
  keep.
  1. **Where the registry lives.** The first audit says the listing is "the plan's copy of
     the migration" and that "the plan does not instruct that copy". But the block is Step
     7's specification of the shipped file itself: "Create
     `src/stores/migrations/001_phase_a_project.sql` containing … The DDL below".
     - Adding Step 14's keys to it states contents for `001` that the shipped file does not
       have. At `HEAD`, `001` lists keys only up to `walk_mode`, and has no
       `indexing_in_progress`, `frontend_fingerprint`, `head_unresolved_since` or
       `walk_errors`.
     - Under the settled checksum ruling, `001` can never gain them: applied migrations are
       fixed. The ruling records that these migration files were already edited in place
       once, which is the defect.
     - So h4 makes the plan's `001` specification permanently disagree with `001`. That
       conflicts with the ruling (brief test 6) and with one fact, one home.
     - The first audit's own "Would be wrong if" (the plan instructs bringing `001` in line
       with the listing) is met by Step 7's "containing … The DDL below".
  2. **The `frontend_fingerprint` line says "the frontends a pass parsed with".** The
     formula (Step 14 text and code) is every frontend passed, less those whose `init`
     rejected, which includes frontends never used. My `fpunused` run shows the difference
     has an effect: one new `.py` file re-parsed all 21 files (E-25).
  - The `head_unresolved_since` and `walk_errors` lines match the code. K2 (`walk_errors`
    never cleared) is killed. K3 (`runIndex` never clears `head_unresolved_since`) survives,
    which is a test gap, not an error in the listing.

**Evidence:**
- Step 7's instruction [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L2084-L2086]] "**What changes.** Create `src/stores/migrations/001_phase_a_project.sql` containing every table AD-4 names for Phase A. The DDL below is AD-4's abridged schema"
- The new entries inside that DDL [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L2141-L2142]] "-- frontend_fingerprint (Step 14: sha256 hex over the sorted -- [lang, symbols, imports, version] of the frontends a pass parsed with;"
- The shipped file [[middleware/context-oracle/ctxoracle/src/stores/migrations/001_phase_a_project.sql@HEAD:L28-L29]] "-- fold_watermark_audit, fold_watermark_corrections, mining_in_progress, -- ref_ts, corpus_floor_met, lang_capabilities, walk_mode (plan Step 7)"
- The ruling [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-coordinator-rulings-schema-and-edit-timing.md@HEAD:L33-L34]] "Applied migrations are fixed. A changed schema is a new migration, and the tool must detect a store whose applied migrations differ from the code's." and [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-coordinator-rulings-schema-and-edit-timing.md@HEAD:L14-L15]] "The three migration files were first committed in `4dd0f00` and then edited in place"
- The formula the line summarises [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L3815-L3817]] "one entry per frontend passed in `frontends` less any disabled by a rejected `init` this pass (m6)"
- [[ran]] `DIST=<dist> node exp/fpunused.mjs` → `pass3 (one .py added) written 21` on `7fdbd7e` and `HEAD`.
- [[ran]] `python3 mut.py <mut> FILES` → `K1 KILLED [fingerprint never written] by=['indexer_inputs.test.js', 'indexer.test.js']`, `K2 KILLED [walk_errors never cleared] by=['indexer_reads.test.js']`, `K3 SURVIVED [runIndex never clears head_unresolved_since] by=[]`.

**Correct verdict:** replace — move the `schema_meta` key registry out of Step 7's `001` DDL block into one home that no applied migration carries (Step 14's text or a DAO key constant), and leave `001`'s specified comment as shipped. Word `frontend_fingerprint` as the formula computes it, or fix the formula (E-25).

### E-17
**Agree/Disagree:**
- Verdict: **disagree** — replace (h6 only), not keep.
- Reasoning: agree that h1–h3 and h33 are generated and current. I ran `221a1bc`'s own
  generator on `221a1bc`'s plan and it reports the regions current. Agree that every file
  h6/h7 add is changed by `7fdbd7e` for a decision judged elsewhere.
  - The keep fails on the omission, which the first audit handed to E-18 and then relied on
    here. `7fdbd7e` also changes `src/index/generic_frontend.ts` and
    `src/index/tree_sitter_frontend.ts`, and `177e59f` changed the two CLI verb files.
    Review m7 asked for all four to be added to the declaration.
  - h8's reason for leaving them out, "the plan checker refuses a declaration that names a
    later step's file", is false: I added all four to h6's `modify:` list and regenerated,
    and `221a1bc`'s checker passed. §9's rows can authorise the change. They do not make
    the generated §5.1 table say who changes a file.
  - The first audit's "The declaration must list what the step changes, and it does" is
    therefore wrong. E-17's keep of h6 and E-18's replace ("add the four stand-in files to
    Step 14's `modify:` list") cannot both stand, because the line E-18 changes is h6.
  - h1–h3 follow h6 when the generator is rerun. h7 and h33 stand as they are.

**Evidence:**
- The declaration [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L3565-L3565]] "modify: [middleware/context-oracle/ctxoracle/test/fixtures/generate.ts, middleware/context-oracle/ctxoracle/src/miner/cochange.ts, middleware/context-oracle/ctxoracle/src/identity/repo_key.ts]"
- h8's reason [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L3577-L3578]] "the plan checker refuses a declaration that names a later step's file, and those §9 rows are the authorization for the change."
- The §9 row naming the frontends [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L7558-L7558]] "`src/index/generic_frontend.ts`, `src/index/tree_sitter_frontend.ts` — Step 14's skeleton frontends (made during Step 14's build)"
- [[ran]] `git show --stat --format= 7fdbd7e` → includes `.../ctxoracle/src/index/generic_frontend.ts | 1 +` and `.../ctxoracle/src/index/tree_sitter_frontend.ts | 1 +`, `14 files changed, 1547 insertions(+), 198 deletions(-)`.
- [[ran]] `node .claude/skills/expert-plan/scripts/derive-plan-sections.mjs --check docs/plans/plan-phase-a.md` on a `git archive 221a1bc` extraction → `OK: 40 steps, 13 elements, 165 test specs, 27 probes cited, regions current`, exit 0.
- The same extraction with `src/cli/index.ts`, `src/cli/init.ts`, `src/index/generic_frontend.ts`, `src/index/tree_sitter_frontend.ts` appended to Step 14's `modify:` [[ran]] `--check` → `STALE: regions out of date: files — run without --check to regenerate` (exit 1); then regenerate → `regenerated: files (40 steps)`; then `--check` → `OK: 40 steps, 13 elements, 165 test specs, 27 probes cited, regions current` (exit 0); §5.1 then has `| middleware/context-oracle/ctxoracle/src/cli/index.ts | modify | S14 |`.

**Correct verdict:** replace — h6's `modify:` list gains the four stand-in files, and h1–h3 are regenerated from it. h7 and h33 stand. This is E-18's correction, applied to the hunk it changes.

### E-19
**Agree/Disagree:**
- Verdict: **agree**, keep.
- Reasoning: agree. A rejected `init` lands the language on the mode AD-12 already
  specifies for a grammar that has no usable query: the generic frontend, or path-only. It
  is visible in three places:
  - a redacted `frontend_parse_failed` fault with `phase: 'init'`;
  - a `lang_capabilities` entry naming the frontend actually used;
  - a fingerprint change, so the first pass after the grammar loads re-parses.
  - That is a specified, visible degraded mode, which is the brief's test. Aborting every
    language's index over one missing grammar file would have been fail-fast only in form:
    the owner would see nothing but a stale index.
  - My own mutants: `lang_capabilities` naming the disabled frontend instead of the one
    used (I3) and a wrong fault phase (I6) are both killed by `indexer_inputs.test.js`.
  - Not initialising the generic frontend when a language's own frontend is disabled (I7)
    survives. It is equivalent at `7fdbd7e`, because the skeleton generic frontend's `init`
    is a no-op. At `HEAD`, batch 9 initialises the generic frontend whenever anything is
    walked, so the case is moot there.
  - One related defect sits in the fingerprint, not in this rule: a frontend that is passed
    but never needed is counted, so its first `init` failure forces a whole-tree re-parse
    (E-25). It does not change this degraded mode's correctness.

**Evidence:**
- The rule [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L3603-L3605]] "**An `init` that rejects disables that frontend for the pass** (Step 14 build review m6): its files fall to the generic frontend (`'*'`)" and its visibility [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L3611-L3613]] "`lang_capabilities` records the frontend actually used for each language in that pass (the generic one's capabilities, or `path-only`), so the record never declares a capability over rows it did not produce (G13)."
- AD-12's floor [[middleware/context-oracle/docs/architecture-phase-a.md@221a1bc:L1396-L1396]] "with no written query at all takes the generic frontend." and its confidence [[middleware/context-oracle/docs/architecture-phase-a.md@221a1bc:L1448-L1449]] "the generic frontend is a fallback whose facts carry lower confidence by construction"
- The code [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@7fdbd7e:L545-L546]] "disabled.add(f); initFaults.push({ lang: f.lang, error: errorText(e), phase: 'init' });" and [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@7fdbd7e:L953-L953]] "frontend: fe === undefined ? 'path-only' : fe.lang === '*' ? 'generic' : 'tree-sitter',"
- The skeleton generic `init` [[middleware/context-oracle/ctxoracle/src/index/generic_frontend.ts@7fdbd7e:L23-L23]] "async init() {},"
- [[ran]] `python3 mut.py <mut> FILES` → `I3 KILLED [lang_capabilities names the disabled frontend] by=['indexer_inputs.test.js']`, `I6 KILLED [init fault phase wrong] by=['indexer_inputs.test.js']`, `I7 SURVIVED [generic not init-ed for a disabled language] by=[]` (equivalent, above).

**Correct verdict:** keep — a specified, visible degraded mode on AD-12's generic-frontend floor, and pinned.

### E-24
**Agree/Disagree:**
- Verdict: **disagree** — replace, not keep.
- Reasoning: agree on `tsLike`'s `version: 'v1'` and on RV-24.
  - My own release-on-success-only mutant (C6) is killed by `indexer_review.test.js` and
    `indexer_inputs.test.js`. Run alone, RV-24 fails under it with "the claim survives a
    failed run".
  - The `TEMP` trigger is real fault injection, and `assert.rejects(… /injected/)` proves it
    fired, so RV-24 cannot pass vacuously.
- RV-12 does not survive my attempt. Its title is "a byte-cap file changed at the same size
  but a new mtime is re-recorded". The mechanism under test is the `stat:<size>:<mtime>` key
  in the skip decision.
  - Both the old and the new rewrite header change the file's zone (`source` →
    `generated`). The skip check compares zone as well as key, so the zone difference alone
    re-records the file.
  - My mutant R12b makes the byte-cap skip ignore the stat key entirely. It survives FILES
    plus `path_glob` and `search_semantics`.
  - The first audit's I4 is killed only by RV-12's last assertion, on the stored key's text.
  - With a same-size header that leaves the zone `source` (`plain HEADER\n`), the unmutated
    test passes and R12b is killed by that same key assertion.
  - The weakness predates `7fdbd7e`: `bfe8d3b`'s skip check also compares zone. But the
    amendment rewrote exactly this line and chose another zone-changing header. So the
    amended line has to change again, and a keep does not hold.

**Evidence:**
- The amended line [[middleware/context-oracle/ctxoracle/test/unit/indexer_review.test.ts@7fdbd7e:L329-L329]] "writeFileSync(path.join(dir, 'big.txt'), `# @generated\n${body}`); // 13 bytes, the same size as `plain header\n` (T-14-7 M3 note)" and the zone assertion it relies on [[middleware/context-oracle/ctxoracle/test/unit/indexer_review.test.ts@7fdbd7e:L333-L333]] "assert.equal(row(env.store, 'big.txt')?.zone, 'generated', 'the same-size rewrite with a new mtime was skipped as unchanged');"
- The skip check compares zone [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@7fdbd7e:L609-L610]] "prior.zone === zone.zone && prior.zone_evidence === zone.evidence;" and the byte-cap branch [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@7fdbd7e:L621-L622]] "const key = `stat:${read.bytes}:${read.mtime}`; if (unchanged(key, zone)) {"
- The same at the reviewer's commit [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@bfe8d3b:L449-L449]] "prior.zone === zone.zone &&"
- The plan's note [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L12148-L12149]] "its rewrite becomes `# @generated\n` — the same 13 bytes as `plain header\n`, so the same-size key it tests is unchanged"
- [[ran]] `python3 mut3.py <mut> indexer_review.test.js,indexer_reads.test.js,indexer.test.js,indexer_inputs.test.js` → `R12b SURVIVED [byte-cap skip ignores the stat key] by=[]`, `C6 KILLED [release on success only (part 1)] by=['indexer_review.test.js', 'indexer_inputs.test.js']`; [[ran]] `python3 mut3.py <mut> indexer_stale.test.js,indexer_walk.test.js,repo_key.test.js,miner_git_env.test.js,path_glob.test.js,search_semantics.test.js R12b` → `R12b SURVIVED [byte-cap skip ignores the stat key] by=[]`.
- RV-24 alone under C6 (compiled copy, then restored) [[ran]] `node --test --test-name-pattern="RV-24" dist/test/unit/indexer_review.test.js` → `the claim survives a failed run`, `# pass 0 # fail 1`; unmutated `# pass 1 # fail 0`.
- RV-12 with the header `plain HEADER\n` and the zone assertion `'source'` (edited in the compiled copy, then restored) [[ran]] `node --test --test-name-pattern="RV-12" dist/test/unit/indexer_review.test.js` → unmutated `# pass 1 # fail 0`; under R12b `the byte-cap key is not stat:<size>:<mtime_ms>`, `# pass 0 # fail 1`; the committed RV-12 under R12b `# pass 1 # fail 0`.

**Correct verdict:** replace — keep the `version` member and RV-24's re-induction. Give RV-12 a same-size header that leaves the zone unchanged (for example `plain HEADER\n`) and assert zone `source`, so that the stat key alone must cause the re-record.

### E-25
**Agree/Disagree:**
- Verdict: **agree**, replace.
- Reasoning: agree with every defect the first audit names. I reproduced each on the
  `7fdbd7e` and `HEAD` builds, and none is fixed at `HEAD` by batch 9.
  - **Read errors become absence.** An `EMFILE` or `EIO` from `openSync`, or an `EIO` from
    `readSync` (injected at the `node:fs` binding), turns a present, tracked `b.ts` into
    `in_tree 0` with its symbol deleted, and records no fault. The plan names only `ELOOP`
    and a non-regular descriptor. This is the error-hiding pattern with a data-loss effect.
    The root-cause fix: absence only for `ENOENT`/`ENOTDIR`/`ELOOP` or a non-regular
    descriptor; any other error keeps the stored rows and records a fault.
  - **A throwing resolver becomes an unresolved count.** A `TypeError` from `resolve` shows
    as `u: 1` with `faults []`. The fix: record `frontend_parse_failed` with
    `phase: 'resolve'`, and keep the import out of the unresolved count.
  - The remaining named defects hold as the first audit states them: no inter-chunk yield
    (`writeChunked` is unchanged at `HEAD`, and `indexer.ts` has no `setTimeout`); fallback
    token tables written under `fts5`; `{stale: false}` plus the redundant config scan for
    M4; S2 presence-only (E-3); no review of `7fdbd7e` before STATUS.
  - **One correction, for M4** (see E-14). `refreshIfStale` returning `{stale: false}` is
    consistent with batch 5. The dampening item belongs in Step 28's `EventContext`, so
    "dampen on an unresolved `HEAD`" is not a change to this file.
- **Defects in `7fdbd7e` the first audit did not find:**
  1. **The M1 read still follows a link in a parent directory.** open(2): `O_NOFOLLOW` acts
     only on the last component, and "Symbolic links in earlier components of the pathname
     will still be followed". The walk's `lstat` runs before any read. So a tracked
     directory swapped for a symlink after the `lstat` is read through the link. My run
     does the swap inside the frontend's `parse` of an earlier file, which is T-14-7's own
     growth technique. The tracked path `src/b.ts` is then stored with `outsideSecret`, a
     symbol from a file outside the repository. This is CWE-59 link following, the class
     of M1 itself.
     - A portable fix exists. After the open, `realpath` the path, check that it is under
       the checkout root, and check that its `stat` `dev`/`ino` equal the descriptor's
       `fstat`. Otherwise treat the path as absent.
     - Checking parent directories in the walk (E-7) closes the non-racy form.
  2. **The fingerprint counts frontends the pass never used.** It is taken over every
     frontend passed, less any whose `init` rejected. A frontend for a language with no
     files is never `init`-ed, so it is counted even if its `init` would fail. The first
     file of that language disables it, the fingerprint changes, and the whole tree
     re-parses. In my run, adding one `.py` file re-parsed all 21 files. At `HEAD` the list is
     `defaultFrontends`, 26 frontends with the seeded tuning, most of them for languages a
     given repository does not have. The plan's reason for the rule ("stores the list
     it actually parsed with") is not what the formula computes. The fix is to take the
     fingerprint over the frontends actually `init`-ed and used. Keying it per language
     would also stop one language's change from re-parsing every other language.
  3. **Rules without a test.** My own mutants on `7fdbd7e`, run against FILES:
     - The absent chunk's `symbol_refs` delete (A2) and `test_map` delete (A3) both
       survive. Their DAO readers do not filter on `in_tree`
       (`SUM(ref_count) … WHERE symbol_id = ?`, `DISTINCT test_file … WHERE ? GLOB
       region_glob`), so a mutant that drops either would report references from, or
       coverage by, a deleted file.
     - Passing the computed `full` to the miner survives (N1). So the clause "a pass made
       full by `indexing_in_progress` or by the fingerprint passes the caller's own `full`"
       is untested. Under the mutant, a frontend change triggers a purged full re-mine.
     - `runIndex` never clearing `head_unresolved_since` survives (K3), matching the first
       audit's H3.

**Evidence:**
- The open catch [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@HEAD:L163-L165]] "} catch { // ENOENT (vanished), ELOOP (a symlink), EACCES …: not a present file. return { kind: 'absent' };" and the read catch [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@HEAD:L200-L201]] "} catch { return { kind: 'absent' };"
- The resolve catch [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@HEAD:L753-L755]] "} catch { r = { kind: 'unresolved' }; }"
- The chunk writer [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@HEAD:L403-L406]] "function writeChunked<T>(store: Store, items: readonly T[], chunkMs: number, write: (item: T) => void): void { let next = 0; while (next < items.length) { store.transaction(() => {"
- The fallback table written whatever `fts_state` is [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@HEAD:L819-L819]] "pathTokens.replaceForFile(id, pt);"
- The fingerprint's input [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@7fdbd7e:L562-L563]] "const enabled = [...opts.frontends].filter((f) => !disabled.has(f)); const fingerprint = fingerprintOf(enabled);" and the plan's reason [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L3827-L3828]] "disabled by `init` (m6), so a pass whose grammar failed stores the list it actually parsed with"
- [[ran]] `DIST=<dist> node exp/openerr.mjs <code> <open|read>` → on `7fdbd7e` and `HEAD`, for `EMFILE open`, `EIO open` and `EIO read`: `pass1 [{"path":"a.ts","in_tree":1,"syms":1},{"path":"b.ts","in_tree":1,"syms":1}]`, then `absent 1 [{"path":"a.ts","in_tree":1,"syms":1},{"path":"b.ts","in_tree":0,"syms":0}] faults []`.
- [[ran]] `DIST=<dist> node exp/resolvethrow.mjs` → on `7fdbd7e` and `HEAD`: `[{"path":"a.ts","u":1},{"path":"b.ts","u":0}] faults []`.
- open(2) [[https://man7.org/linux/man-pages/man2/open.2.html]] "Symbolic links in earlier components of the pathname will still be followed." CWE-59 [[https://cwe.mitre.org/data/definitions/59.html]] "The product attempts to access a file based on the filename, but it does not properly prevent that filename from identifying a link or shortcut that resolves to an unintended resource."
- [[ran]] `DIST=<dist> node exp/midlink.mjs` (tracked `a.ts`, `src/b.ts`; `parse` of `a.ts` renames `src` away and links `src` to an outside directory holding `b.ts` with `export function outsideSecret() {}`) → on `7fdbd7e` and `HEAD`: `filesWritten 2 [{"path":"a.ts","name":"a"},{"path":"src/b.ts","name":"outsideSecret"}]`.
- [[ran]] `DIST=<HEAD dist> node -e "const h=await import('./h.mjs'); const e=h.env(); console.log(h.frontendsMod.defaultFrontends(e.tuning).length)"` (run in `exp/`; seeded tuning) → `26`.
- [[ran]] `DIST=<dist> node exp/fpunused.mjs` (20 `.ts` files; frontends `[ts, pyBroken, generic]`, where `pyBroken`'s `init` rejects) → on `7fdbd7e` and `HEAD`: `pass1 written 20`, `pass2 (unchanged) written 0`, `pass3 (one .py added) written 21`, `pass4 (unchanged) written 0`.
- [[ran]] `python3 mut.py <mut> FILES` → `A2 SURVIVED [absent chunk keeps its symbol_refs]`, `A3 SURVIVED [absent chunk keeps its test_map rows]`, `N1 SURVIVED [miner gets the computed full]`, `K3 SURVIVED [runIndex never clears head_unresolved_since]`.
- The DAO readers [[middleware/context-oracle/ctxoracle/src/stores/dao/symbol_refs.ts@HEAD:L26-L26]] ".prepare('SELECT COALESCE(SUM(ref_count), 0) AS n FROM symbol_refs WHERE symbol_id = ?')" and [[middleware/context-oracle/ctxoracle/src/stores/dao/test_map.ts@HEAD:L35-L35]] ".prepare('SELECT DISTINCT test_file FROM test_map WHERE ? GLOB region_glob ORDER BY test_file')"
- Nothing in batch 9 changes these constructs [[ran]] `git diff 7fdbd7e HEAD -- middleware/context-oracle/ctxoracle/src/index/indexer.ts` → hunks only in the header comment, the generic `init` condition, the parse fallback, and `hasTopLevelModule`.

**Correct verdict:** replace — as the first audit states, with three changes. Drop "dampen on an unresolved `HEAD`" from this file's list (it belongs to Step 28, E-14). Add a post-open containment check (realpath under the root, with `dev`/`ino` equal to the descriptor's). Take the fingerprint over the frontends actually used, and add tests that kill A2, A3, N1 and K3.

## Summary

| Entry | First audit | This opinion | Agree? |
|---|---|---|---|
| E-3 | replace | replace | agree on the verdict; `.js` case re-attributed to Step 15's order; extensionless and disappearance cases added |
| E-7 | replace | replace | agree |
| E-9 | keep | replace | disagree: a parent-directory link swapped after the `lstat` is read out of tree |
| E-12 | keep | keep | agree |
| E-13 | keep | keep | agree |
| E-14 | replace | replace | agree on the verdict; the dampening belongs to Step 28's `EventContext`, not `refreshIfStale` |
| E-15 | keep | keep | agree |
| E-16 | keep | replace | disagree: the key list sits in `001`'s specified DDL, which the checksum ruling fixes |
| E-17 | keep | replace | disagree: h6 omits the four stand-in files, and the checker accepts them |
| E-19 | keep | keep | agree |
| E-24 | keep | replace | disagree: RV-12's zone-changing header lets a stat-key-blind skip pass |
| E-25 | replace | replace | agree, with the M4 item moved to Step 28 and three defects added |

Counted from the twelve sections above: **keep 4** (E-12, E-13, E-15, E-19); **replace 8**
(E-3, E-7, E-9, E-14, E-16, E-17, E-24, E-25); remove 0; undetermined 0. Four of the first
audit's eight keeps are overturned (E-9, E-16, E-17, E-24). All four replaces stand.

**Fixed at HEAD.** None of the defects in these twelve entries. Batch 9 leaves `walk.ts`,
`zone.ts` and `git_layout.ts` unchanged, and changes `indexer.ts` only in the header
comment, the generic `init` condition, the parse fallback and `hasTopLevelModule`. The one
batch 9 change that touches an item here is that the generic frontend is now always
initialised when anything is walked. That makes E-19's I7 moot at `HEAD`; I7 was
equivalent at `7fdbd7e` anyway.
