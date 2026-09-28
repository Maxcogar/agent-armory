# Branch audit — batch 8, part b (the Step 14 review and its fixes): adjudication

This file adjudicates batch 8 part b of the branch audit, commits 55–61: `8a234d6`,
`bfe8d3b` (the independent review of the Step 14 build), `0528470` (the AD-12
amendment), `221a1bc` (the Step 14 plan fixes), `42dbbd0`, `7fdbd7e` (the Step 14 code
fixes) and `fbb9052` (STATUS "Step 14 built and reviewed"). Its inputs are the first
audit `2026-09-26-branch-audit-B8b.md` (E-1 … E-27: 8 keep, 19 replace) and the second
opinion `2026-09-26-branch-audit-B8b-second-opinion.md` (12 entries). The adjudicator
made none of the changes and wrote neither review. The test applied is the auditor brief
`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/BRIEF.md`.

Settled and not re-litigated: the B1–B7 verification files and the coordinator rulings
of 2026-09-28. Those that govern here: batch 3's ≥ 25 ms inter-chunk yield; batch 5
item 10 (an unresolved `HEAD` sets the handler's two staleness flags true); batch 7
item 5 (git behaviour) and item 8 (the `index` verb has no `catch`); the schema-checksum
ruling (applied migrations are fixed). The B8a first audit and its second opinion are
provisional, and nothing here rests on them.

Coordinator-verified facts taken as given: an `O_RDONLY|O_NOFOLLOW` open through a
symlinked parent directory succeeds and reads the target (Node 22.22.2); `indexer.ts`
L143 at `HEAD` uses `O_NOFOLLOW` alone for link protection; `git rev-parse
--local-env-vars` lists 15 variables and `gitChildEnv` clears 5.

**How the work was done.**
- My own scratch extractions under the scratchpad folder `b8badj/`: `git archive
  <commit> middleware/context-oracle/ctxoracle | tar -x`, this checkout's
  `ctxoracle/node_modules` symlinked, `npm run build` (exit 0 for both). Builds:
  `7fdbd7e` and `HEAD` (`aabdb52`). The code at `HEAD` is the code at `9f273be`, which
  the second opinion used: [[ran]] `git diff --stat 9f273be HEAD -- middleware/context-oracle/ctxoracle` → empty.
  Node 22.22.2, git 2.43.0.
- `b8badj/exp/h.mjs` is my own harness over a build's `dist` (chosen by `DIST=`): fresh
  stores seeded as the tests seed them, throwaway repositories made with every `GIT_*`
  variable removed from the child environment, and `runIndex` called directly. The
  experiment scripts beside it are named in each entry. Below, `<b>` is a build folder
  (`b8badj/7fdbd7e` or `b8badj/HEAD`) and `<dist>` is
  `<b>/middleware/context-oracle/ctxoracle/dist`.
- `b8badj/mut.py <tree> <test files> [ids]` plants one mutant at a time in a copy of the
  `7fdbd7e` build (`b8badj/mut/`), by an exact substring replacement in the compiled
  `dist/src/index/indexer.js` (it asserts the text occurs once), runs `node --test` on
  each named compiled test file with `GIT_*` removed, and restores the file. A mutant is
  killed when any file exits non-zero. FILES below is `indexer_inputs.test.js`,
  `indexer_reads.test.js`, `indexer_review.test.js`, `indexer_stale.test.js`,
  `indexer.test.js`, `indexer_walk.test.js`, `repo_key.test.js`, `miner_git_env.test.js`.
  The baseline line of every run is `BASELINE failing []`.
- `b8badj/fix/` is a copy of the `HEAD` build whose compiled `readTreeFile` carries two
  prototype containment checks, chosen by `CONTAIN=proc` or `CONTAIN=rp`, and a
  prototype fingerprint over only the frontends `init`-ed this pass, chosen by `FP=used`.
  With neither variable set it behaves as `HEAD`. `b8badj/mutH/` is a copy of the
  `HEAD` build with the absent chunk's `symbol_refs` and `test_map` deletes removed.
- Web quotes were taken from `curl`-fetched text and each was matched with `webquote.py`.
- This repository was never checked out or modified. The only file written in it is
  this one.

### E-3
**Ruling:** Both reviews say replace, and replace is upheld. The fingerprint half is the
root-cause fix for S1, and h24 stands. The S2 half narrows "every input" to file
presence. On the three points the second opinion adds or corrects:

1. **The `.js` case depends on batch 9. The second opinion is right.** At `221a1bc` the
   plan's TypeScript rule tries "the written path if it exists" first, and a `.js`
   specifier only "also tries" its source. Under that text an importer resolved to
   `b.js` keeps resolving to `b.js` when `b.ts` appears, so its resolution does not
   change. The first audit's `ts` run is stale at `HEAD` only because batch 9's resolver
   tries the source extensions before the written path (`resolvers.ts` L85). So the case
   is a live `HEAD` defect: batch 9 added an input that S2's rules do not track. It is
   not evidence that `221a1bc`'s "name exactly" was false when written. Whether batch 9's
   order is right is batch 9's question.
2. **The extensionless case holds under `221a1bc`'s own text.** An extensionless
   specifier tries `.ts` before `.js` in both the plan and the code. So `./b` resolved to
   `b.js` must move to `b.ts` when `b.ts` appears. The importer has
   `unresolved_imports = 0`, so rule (a) does not force it. Reproduced on my `HEAD`
   build. "Name exactly" was false at `221a1bc`.
3. **The disappearance case: the second opinion's conclusion stands, on different
   evidence.** Its `pydel` run (deleting the only in-repo module with a top-level name
   leaves `app/main.py:1` stale) reproduces. But it depends on batch 9's
   `hasTopLevelModule`. At `221a1bc` an absent absolute Python name is `external`, so
   there was no unresolved count to go stale. A disappearance that `221a1bc`'s own rules
   miss does exist: delete the `package.json` that declares a dependency. The import
   turns from `external` into `unresolved`. No edge pointed at `package.json`, so rule (b)
   forces nothing, and `src/a.ts` stays at `0` until `--full`. Removing the dependency
   from `package.json` (an edit, not a disappearance) is also stale. So rule (b), and
   not only rule (a), was incomplete when written.

The root cause is the one both reviews name. The pass caches resolution results without
the inputs the resolver read. Build systems fix this by recording the inputs a consumer
actually read and rebuilding when any of them changes (Ninja's discovered header
dependencies). For resolution, those inputs are the answers to `RepoFiles` queries:
- each probed candidate path, present or absent;
- which `package.json` the nearest-dependency lookup read, and its content;
- at `HEAD`, each `hasTopLevelModule` name.

**Evidence:**
- AD-12's claim [[middleware/context-oracle/docs/architecture-phase-a.md@0528470:L1428-L1430]] "files with `unresolved_imports > 0` when a file appears, the sources of the dropped edges when one disappears"
- The plan's exactness claim [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L3857-L3859]] "The rule needs no stored specifiers: (a) and (b) name exactly the files whose resolution can change."
- The `221a1bc` TypeScript rule, written path first [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L4213-L4214]] "the written path if it exists; a `.js`/`.jsx`/ `.mjs`/`.cjs` specifier also tries its source `.ts`/`.tsx`/`.mts`/`.cts`;"
- The extensionless order [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L4215-L4216]] "an extensionless one tries `.ts`, `.tsx`, `.js`, `.jsx`, then `/index.` + those; first existing file wins"
- The `221a1bc` bare-specifier rule reads `package.json` [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L4216-L4218]] "A bare specifier whose package name (`name` or `@scope/name`) is in the nearest `package.json`'s"
- The `221a1bc` Python rule makes an absent absolute name external [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L4227-L4228]] "→ `resolved` when it exists, otherwise `external`"
- `HEAD`'s resolver tries the source before the written path [[middleware/context-oracle/ctxoracle/src/index/resolvers.ts@HEAD:L85-L85]] "return firstPresent([...(SOURCE_FOR[ext] ?? []).map((e) => stem + e), base], repo);" and reads a top-level-name query [[middleware/context-oracle/ctxoracle/src/index/resolvers.ts@HEAD:L139-L139]] "return repo.hasTopLevelModule(rest.split('.')[0] as string) ? UNRESOLVED : EXTERNAL;"
- The rules as coded at `HEAD` [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@HEAD:L589-L589]] "for (const r of storedInTree) if (r.unresolved_imports > 0 && presentSet.has(r.path)) forced.add(r.path);" and [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@HEAD:L592-L592]] "for (const r of storedInTree) if (!presentSet.has(r.path)) forceSourcesOf(r.path);"
- Five cases on my `HEAD` build with `defaultFrontends` (index, change, index, then `--full`) [[ran]] `cd b8badj/exp; DIST=<dist of HEAD> node s2.mjs <case>` →
  - `js` (`./b.js`, then `src/b.ts` added): `pass2 1 {"edges":["src/a.ts->src/b.js"]`, `full 3 {"edges":["src/a.ts->src/b.ts"]`
  - `tsext` (`./b`, then `src/b.ts` added): `pass2 1 {"edges":["src/a.ts->src/b.js"]`, `full 3 {"edges":["src/a.ts->src/b.ts"]`
  - `pydel` (`lib/helper.py` deleted): `pass2 0 {"edges":[],"unres":["app/main.py:1"]}`, `full 1 {"edges":[],"unres":["app/main.py:0"]}`
  - `pkgrm` (the `package.json` declaring `lodash` deleted): `pass2 0 {"edges":[],"unres":["src/a.ts:0"]}`, `full 1 {"edges":[],"unres":["src/a.ts:1"]}`
  - `pkgdrop` (`lodash` removed from `package.json`): `pass2 1 {"edges":[],"unres":["package.json:0","src/a.ts:0"]}`, `full 2 {"edges":[],"unres":["package.json:0","src/a.ts:1"]}`
- Build-tool practice for discovered inputs [[https://ninja-build.org/manual.html]] "The problem with headers is that the full list of files that a given source file depends on can only be discovered by the compiler: different preprocessor defines and include paths cause different files to be used."
- The read-time forcing and the worklist are unpinned: both audits' mutants survive (first audit B2, B3; second opinion B2x, B3x). I did not re-plant them, because the two runs agree.

**Final verdict:** replace.

**Correction:**
- Keep the fingerprint trigger (the per-language keying E-25 adds goes with it) and h24.
- Restate S2 in AD-12 and plan Step 14 as dependency tracking. Per importer, store the
  resolution queries its resolver made:
  - each candidate path probed, and whether it was present;
  - the path of the `package.json` the nearest-dependency lookup read, with its content
    hash;
  - at `HEAD`, each top-level name queried and its answer.
- Re-resolve an importer when any stored answer would now differ. Store paths, not
  specifiers, so AD-19's no-specifier storage stands.
- Drop "covers every input" and "name exactly" until that holds.
- Add T-14-6 cases that fail under the current rules:
  - appearance: `tsext`, and at `HEAD` `js`;
  - edit: the first audit's `pkg`, and `pkgdrop`;
  - disappearance: `pkgrm`, and at `HEAD` `pydel`;
  - the read-time disappearance and the worklist (B2, B3).

**Still at HEAD:** yes. All five cases above were run on the `HEAD` build.

**Owner question:** none.

### E-7
**Ruling:** Both reviews say replace, and replace is upheld. The two reviews agree on
both defects:
- a subdirectory read failure for any code other than absence (`EIO`, `EMFILE`,
  `EACCES`) is treated as absence, so present files lose their rows with no fault;
- a tracked directory replaced by a symlink fails every pass.

The second opinion adds one point, and it holds. Dropping listed paths that lie beneath
a symlinked parent directory is required in the walk, whatever is decided about the
throw. The reasons:
- If the `check-ignore` throw were only caught, the pass would go on to open
  `src/b.ts` through the link. `O_NOFOLLOW` does not stop that (E-9). So the walk's
  failure is, today, the only thing that stops the non-racy read through the link.
- git's own view of such a path is that it is gone. `git status` reports the tracked
  `src/b.ts` as deleted (` D`) and `src` as untracked, while `git ls-files --cached`
  still lists it. So dropping it matches git.
- It closes the static case only. The swap during a pass is E-9's.

The cited precedent, "as git mode treats a failed `lstat`", is itself a catch-all at
`HEAD`, so the same split applies there.

**Evidence:**
- The plan rule [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L3673-L3676]] "is skipped and appended to `walkErrors` as `{path, code}` (the repository-relative path and the error's `code`, e.g. `ENOENT`, `EACCES`); the walk continues, and the files beneath it are not listed, so this pass treats them as absent — as git mode treats a failed `lstat`"
- The code at `HEAD` [[middleware/context-oracle/ctxoracle/src/index/walk.ts@HEAD:L100-L101]] "if (relPrefix === '') throw e; walkErrors.push({ path: relPrefix, code: String((e as NodeJS.ErrnoException).code ?? 'UNKNOWN') });"
- The git-mode precedent at `HEAD` [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@HEAD:L523-L526]] "if (lstatSync(path.join(repoPath, p)).isFile()) listed.push(p); } catch { // absent }"
- The throwing branch [[middleware/context-oracle/ctxoracle/src/index/walk.ts@HEAD:L76-L77]] "if (ci.status !== 0 && ci.status !== 1) { throw new Error(`git check-ignore failed (exit ${ci.status}): ${ci.stderr.toString('utf8').trim()}`);"
- git's view, in a throwaway repository with tracked `src/b.ts` and `top.ts`, `src` moved away and replaced by a symlink to an outside directory, `GIT_*` unset [[ran]] `git ls-files --cached; git status --porcelain; git check-ignore -q --no-index --stdin <<< "src/b.ts"; echo "check-ignore exit $?"` → `src/b.ts`, `top.ts`, ` D src/b.ts`, `?? src`, `fatal: pathspec 'src/b.ts' is beyond a symbolic link`, `check-ignore exit 128`.
- The pass [[ran]] `cd b8badj/exp; DIST=<dist> node dirlink.mjs` → on `7fdbd7e` and `HEAD`: `pass1 written 2`, `pass2 threw: git check-ignore failed (exit 128): fatal: pathspec 'src/b.ts' is beyond a symbolic link faults []`.
- Fail-fast [[https://martinfowler.com/ieeeSoftware/failFast.pdf]] "The program continues working right after an error but fails in strange ways later on."
- The `EIO`/`EMFILE` deletion was executed by both reviews (the first audit by reasoning from the absent-file rule, the second opinion by injection at the `node:fs` binding, `walkerr.mjs`). The catch-all it rests on is quoted above, so I did not re-run it.

**Final verdict:** replace.

**Correction:**
- Keep the root throw.
- Keep skip-and-absent for `ENOENT` and `ENOTDIR` (the directory is gone).
- For any other directory error, keep the stored rows beneath it untouched this pass
  (unknown, not absent) and record a fault. Step 6 gains a code for it. The plan's "a
  new code is not added" reason goes.
- Apply the same split to git mode's `lstat` catch, the precedent the rule cites.
- In git mode, before `check-ignore`, `lstat` each distinct leading directory of the
  listed paths. Drop every path beneath a symbolic link, as `git status` does, so such
  a directory no longer fails every pass. Record which rule dropped them.
- The race during a pass is closed by E-9's post-open check, not here.
- Add a T-14-7 case for the symlinked tracked directory (E-22 already asks for one).

**Still at HEAD:** yes. `walk.ts` is unchanged since `7fdbd7e`, and `dirlink.mjs` fails
the same way on the `HEAD` build.

**Owner question:** none.

### E-9
**Ruling:** The second opinion's overturn, keep → replace, is upheld. M1 was real. One
open with `O_NOFOLLOW | O_NONBLOCK`, an `fstat` of the descriptor and a cap + 1 bounded
read fix the size, final-link and FIFO halves at their root. The keep fails on the half
the first audit set aside.
- open(2) says `O_NOFOLLOW` acts on the trailing component only.
- The coordinator verified that an open through a symlinked parent reads the target.
- The first audit said the walk's `check-ignore` failure stops such a case "before any
  read". That holds only when the swap happens before the walk (E-7).
- M1 is about the window after the walk's `lstat`. The plan's own CWE-367 premise is
  that the tree changes while the detached reindex runs.
- I swapped the tracked `src` for a link to an outside directory inside that window,
  from a frontend's `parse` of an earlier file. `src/b.ts` was then stored with
  `outsideSecret`, a symbol read from a file outside the repository. That is CWE-59
  link following through the helper the plan calls the fix.

**The correct containment fix.** CWE-367's basic advice is not to check before the use.
So the check must come after the open and be derived from the descriptor, not from the
path. The options:
1. **`openat2` with `RESOLVE_BENEATH`** is the kernel's complete fix. It refuses a
   resolution in which any component leaves the directory. It is Linux-only (from
   Linux 5.6), and Node 22 does not expose it: `fs.constants` has no `RESOLVE_*` member
   and `fs` has no `openat`. A native addon would bring it in, but C-3 and the spec
   exclude native code ("no native toolchain and no prebuilt-binary download"). So it
   is not available here. Record it as the alternative not taken, with that reason.
2. **The descriptor's own path, on Linux.** proc_pid_fd(5) says each
   `/proc/self/fd/<n>` entry "is a symbolic link to the actual file". So
   `readlinkSync('/proc/self/fd/' + fd)` names the file actually opened. Require it to
   lie under `realpath(checkoutRoot)`. Nothing the tree does after the open can change
   which file the descriptor refers to, so this check has no race.
   - Prototyped in the compiled helper, it turns the swap into `src/b.ts` absent.
   - It stays absent under an adversarial schedule too.
3. **Portable fallback: `realpath` plus `dev`/`ino`**, the second opinion's check. Take
   `realpath(path)`, require it under the root, and require that path's `stat` `dev`/`ino`
   to equal the descriptor's `fstat`.
   - It catches the single swap.
   - It is still two path lookups made after the open. A schedule that restores the real
     directory before the `realpath` and re-links it before the `stat` passes the check.
     Executed with an instrumented schedule: the outside symbol is stored.
   - So on a platform without `/proc/self/fd` it narrows the race but does not close it.
     The spec names no platform, so the helper cannot assume Linux, and that residual
     must be recorded in §13 with its consequence.

The second opinion's "or record the intermediate-link residual in §13" is not an
acceptable alternative on Linux. There the race-free check costs one `readlink` per
read, and without it the defect is an out-of-tree read. Recording applies only to the
fallback's residual.

**Evidence:**
- The plan's helper [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L3783-L3784]] "goes through one helper that opens with `O_RDONLY | O_NOFOLLOW | O_NONBLOCK`, `fstat`s the descriptor, and reads at most its bound" and its premise [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L3779-L3781]] "CWE-367: a check on a path and a later use of that path are not one operation, and the working tree changes while the detached reindex runs"
- The code [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@HEAD:L143-L143]] "const OPEN_FLAGS = fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW ?? 0) | (fsConstants.O_NONBLOCK ?? 0);" and the open by path [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@HEAD:L162-L162]] "fd = openSync(abs, OPEN_FLAGS);"
- open(2) [[https://man7.org/linux/man-pages/man2/open.2.html]] "Symbolic links in earlier components of the pathname will still be followed."
- Node's flag [[https://nodejs.org/docs/latest-v22.x/api/fs.html]] "Flag indicating that the open should fail if the path is a symbolic link."
- CWE-59 [[https://cwe.mitre.org/data/definitions/59.html]] "The product attempts to access a file based on the filename, but it does not properly prevent that filename from identifying a link or shortcut that resolves to an unintended resource."
- CWE-367 [[https://cwe.mitre.org/data/definitions/367.html]] "The most basic advice for TOCTOU vulnerabilities is to not perform a check before the use."
- openat2(2) [[https://man7.org/linux/man-pages/man2/openat2.2.html]] "Do not permit the path resolution to succeed if any component of the resolution is not a descendant of the directory indicated by dirfd" and [[https://man7.org/linux/man-pages/man2/openat2.2.html]] "The primary use case for these flags is to allow trusted programs to restrict how untrusted paths (or paths inside untrusted directories) are resolved." and [[https://man7.org/linux/man-pages/man2/openat2.2.html]] "Linux 5.6."
- Node 22 has no binding [[ran]] `node -e "const fs=require('fs');console.log(Object.keys(fs.constants).filter(k=>/RESOLVE|BENEATH|OPENAT/.test(k)), typeof fs.openat2, typeof fs.openatSync, fs.constants.O_NOFOLLOW)"` → `[] undefined undefined 131072`
- The spec's exclusion [[middleware/context-oracle/docs/specs/spec-context-oracle.md@HEAD:L518-L518]] "with **no native toolchain and no prebuilt-binary download**, which"
- proc_pid_fd(5) [[https://man7.org/linux/man-pages/man5/proc_pid_fd.5.html]] "This is a subdirectory containing one entry for each file which the process has open, named by its file descriptor, and which is a symbolic link to the actual file."
- The defect (tracked `a.ts`, `src/b.ts`; `parse` of `a.ts` moves `src` away and links `src` to an outside directory holding `b.ts` with `export function outsideSecret() {}`) [[ran]] `cd b8badj/exp; DIST=<dist> node midlink.mjs` → on `7fdbd7e` and `HEAD`: `filesWritten 2 [{"path":"a.ts","name":"a"},{"path":"src/b.ts","name":"outsideSecret"}] [{"path":"a.ts","in_tree":1},{"path":"src/b.ts","in_tree":1}]`
- The prototypes [[ran]] `cd b8badj/exp; CONTAIN=<mode> DIST=b8badj/fix/dist node midlink.mjs` → `none`: `filesWritten 2 [{"path":"a.ts","name":"a"},{"path":"src/b.ts","name":"outsideSecret"}]`; `proc`: `filesWritten 1 [{"path":"a.ts","name":"a"}] [{"path":"a.ts","in_tree":1},{"path":"src/b.ts","in_tree":0}]`; `rp`: the same as `proc`.
- The fallback's race (the real directory restored before the `realpath`, the link again before the `stat`, through hooks in the prototype) [[ran]] `cd b8badj/exp; CONTAIN=<mode> DIST=b8badj/fix/dist node midlink_race.mjs` → `rp`: `filesWritten 2 [{"path":"a.ts","name":"a"},{"path":"src/b.ts","name":"outsideSecret"}]`; `proc`: `filesWritten 1 [{"path":"a.ts","name":"a"}]`. The `proc` check makes no path lookup after the open, so the schedule has nothing to act on.

**Final verdict:** replace.

**Correction:**
- Keep the descriptor-bounded helper and every clause of it.
- After the `fstat`, add a containment check derived from the descriptor. On failure the
  path is absent this pass, as the `ELOOP` rule already does.
  - Where `/proc/self/fd` exists: `readlink('/proc/self/fd/<fd>')` must lie under
    `realpath(checkoutRoot)`, computed once per pass.
  - Elsewhere: `realpath(path)` under the root, and its `stat` `dev`/`ino` equal to the
    descriptor's. Record in §13 the two-lookup race this leaves, and that it is an
    out-of-tree read.
- State in the plan that `O_NOFOLLOW` covers the trailing component only, citing open(2).
- Record `openat2` `RESOLVE_BENEATH` as the alternative not taken: no Node 22 binding,
  and C-3 excludes native code.
- Add a T-14-7 parent-swap case (`midlink.mjs`'s shape): it expects `src/b.ts` absent
  and no symbol from outside the repository.
- E-7's walk check closes the static form. This check closes the race.

**Still at HEAD:** yes. `midlink.mjs` stores `outsideSecret` on the `HEAD` build.

**Owner question:** none.

### E-14
**Ruling:** Both reviews say replace, and replace is upheld. The correction follows the
second opinion, which moves the dampening out of `refreshIfStale` and adds the refresh
gap. Both reviews agree on three points, and they stand:
- the transition-only fault is right;
- neither of M4's two remedies (read reftable, or a §15 record) was carried out;
- the config scan is redundant.

On the points where they differ:
1. **`refreshIfStale`'s `{stale: false}` is not what batch 5 overturned. The second
   opinion is right.** Its result has one reader: the `SessionStart` item, which spawns
   the detached reindex when it is `true`. That holds in the plan, and in the code at
   `HEAD` it is the only call outside `indexer.ts`.
   - Confidence is computed by Step 28's `EventContext`, from its own `resolveHead`. Its
     clause "an `{unresolved}` `HEAD` makes both false" is what batch 5 item 10
     replaced.
   - Batch 5's reason: D-plan-30's never-stale ground is the reindex storm, and a
     dampener spawns nothing.
   - So returning `{stale: false}` for an unreadable layout is the settled spawn
     behaviour. The first audit's "every downstream reader treats the index as fresh",
     and its fix "make an unresolved or reftable `HEAD` dampen instead of reading as
     fresh", aim at the wrong function. The same error is in E-23's correction, re-ruled
     below.
2. **The refresh gap is real, and neither the plan nor the first audit records it.**
   - For a reftable repository, `resolveHead` returns `{unresolved: 'reftable'}`, and
     `refreshIfStale` returns `{stale: false}`.
   - The `SessionStart` spawn is the only event-driven reindex.
   - So no event ever refreshes such a repository's index. It stays at whatever the last
     explicit `ctxoracle index` or `init` wrote, however far `HEAD` moves. Once batch 5
     item 10 is built, every event's confidence is dampened, indefinitely.
   - git's BreakingChanges announces reftable as the default for new repositories, so
     this is a growing class, not an edge case.
   - That is a known gap with a consequence. §13 or §15 must say so. At `221a1bc` and at
     `HEAD` neither section mentions reftable.
3. **The config scan is redundant, checked against git's source.**
   - The reftable document makes the dummy `HEAD` mandatory.
   - git's reftable backend writes `ref: refs/heads/.invalid` to `<gitdir>/HEAD` on every
     store creation (`reftable_be_create_on_disk`).
   - `git worktree add` creates a linked worktree's store through the same call.
   - `git refs migrate` creates the new store in a temporary gitdir, then moves every
     file in it, `HEAD` included, over the old one.
   - So every reftable layout git makes carries the dummy `HEAD` that the resolver
     already checks. The scan and its unsourced 64 KiB bound catch no further case.

The complete fix for the gap is to read the one ref `HEAD` names from the reftable
stack: `tables.list`, then bounded block reads, as the reftable document's "Readers"
section describes. That is a bounded read, not a subprocess, so AD-23 and D-plan-30
permit it. Whether Phase A builds it is an engineering call for the correction pass. If
it is deferred, the §13/§15 record is required, with its consequence.

**Evidence:**
- The plan rule [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L3969-L3971]] "The resolver does not read the reftable format; the staleness of such a repository is **unknown**, never stale and never spawning a reindex"
- The only reader of the result [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L5866-L5867]] "when stale **and not a worktree event** (AD-23: indexing another tree would overwrite the main checkout's index), the detached reindex child"
- The handler's own flags, where the dampening lives [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L5842-L5843]] "an `{unresolved}` `HEAD` makes both false (the same direction `refreshIfStale` takes)."
- Batch 5 item 10 [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B5-verification.md@HEAD:L160-L161]] "Set both staleness flags true (dampen), with a bar-specific reason." and its ground [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B5b-adjudication.md@HEAD:L108-L108]] "D-plan-30's ground for never-stale is the reindex storm, and a confidence dampener spawns nothing."
- The code's one reader at `HEAD` [[middleware/context-oracle/ctxoracle/src/hook/handler.ts@HEAD:L162-L162]] "if (refreshIfStale(store, repoPath, diagnosticsDir).stale) {" and [[ran]] `grep -rn "refreshIfStale(" src --include=*.ts | grep -v "^src/index/indexer.ts"` (in `ctxoracle/`) → `src/hook/handler.ts:162:      if (refreshIfStale(store, repoPath, diagnosticsDir).stale) {`
- The reftable branch and the scan at `HEAD` [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@HEAD:L298-L298]] "if (h === REFTABLE_HEAD || configSaysReftable(path.join(commonDir, 'config'))) return { unresolved: 'reftable' };" and [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@HEAD:L214-L214]] "const CONFIG_MAX_BYTES = 64 * 1024;" and the unresolved result [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@HEAD:L330-L330]] "return { stale: false };"
- The dummy `HEAD` [[https://git-scm.com/docs/reftable]] "a reftable-enabled repository must contain the following dummy files" and [[https://git-scm.com/docs/reftable]] "ref: refs/heads/.invalid"
- git's backend at `v2.51.0` [[https://raw.githubusercontent.com/git/git/v2.51.0/refs/reftable-backend.c]] "static int reftable_be_create_on_disk(struct ref_store *ref_store," then, in that function (L476–L477 of the fetched file), [[https://raw.githubusercontent.com/git/git/v2.51.0/refs/reftable-backend.c]] "ref: refs/heads/.invalid"
- The linked worktree [[https://raw.githubusercontent.com/git/git/v2.51.0/builtin/worktree.c]] "ret = ref_store_create_on_disk(wt_refs, REF_STORE_CREATE_ON_DISK_IS_WORKTREE, &sb);"
- Migration [[https://raw.githubusercontent.com/git/git/v2.51.0/refs.c]] "ret = ref_store_create_on_disk(new_refs, 0, errbuf);" and [[https://raw.githubusercontent.com/git/git/v2.51.0/refs.c]] "ret = move_files(new_gitdir.buf, old_refs->gitdir, errbuf);". `move_files` (L3033 of the fetched file) renames every directory entry but `.` and `..`.
- The default change [[https://git-scm.com/docs/BreakingChanges]] "The default storage format for references in newly created repositories will be changed from"
- No reftable here [[ran]] `git init -q --ref-format=reftable rt` (git 2.43.0) → `error: unknown option `ref-format=reftable'`, exit 129. The layouts in the tests are planted, as both reviews say.
- No record [[ran]] `grep -n -i reftable docs/plans/plan-phase-a.md` at `HEAD` → the last hit is L12284, and §13 starts at L14393, §15 at L15082. The architecture and the spec have no hit.
- Transition-only recording is pinned and the `runIndex` clear is not: first audit H1/H2 killed and H3 survived; my K3 (the same mutant) survived (E-25).

**Final verdict:** replace.

**Correction:**
- Keep the transition-only fault, and keep `refreshIfStale`'s `{stale: false}` for an
  unresolved or reftable `HEAD`: an unreadable layout never spawns.
- The dampening stays where batch 5 item 10 put it, in Step 28's `EventContext`. It is
  not a change to `refreshIfStale`.
- Drop the config scan and its 64 KiB bound. The `HEAD` check covers every layout git
  makes. Cite the three git source sites above.
- In §13/§15, record:
  - that a reftable repository's index is never refreshed by events, only by an explicit
    `index` or `init`;
  - that its confidence is dampened on every event;
  - git's announced default change.
- Or build the bounded reftable read of `HEAD`'s target, and record which was chosen and
  why.
- Add the missing test that `runIndex` clears `head_unresolved_since` (H3/K3).

**Still at HEAD:** yes. The scan is at L298, and no §13/§15 record exists.

**Owner question:** none.

### E-16
**Ruling:** The second opinion's overturn, keep → replace, is upheld on both of its
grounds. The two reviews agree that the three keys are data in a key–value table, so no
migration is needed to add them.

1. **The listing is Step 7's specification of the shipped file.** Step 7 says "Create
   `src/stores/migrations/001_phase_a_project.sql` containing every table", and "The
   DDL below" is that file's content, comments included. Adding Step 14's keys to the
   block therefore states contents for `001` that the shipped file lacks.
   - The shipped `001` lists keys only up to `walk_mode`.
   - It has none of `indexing_in_progress`, `frontend_fingerprint`,
     `head_unresolved_since` or `walk_errors`.
   - It has not changed since `221a1bc`.
   - Under the checksum ruling, `001` can never gain them, even as comment lines: a
     checksum is taken over the file's content, and applied migrations are fixed.
   - So h4 makes the plan's specification of `001` permanently disagree with `001`. That
     conflicts with the ruling (brief test 6) and with one fact, one home.
   - The first audit's own "Would be wrong if" (the plan instructs bringing `001` in line
     with the listing) is met, because Step 7's text is that instruction.
2. **The `frontend_fingerprint` line says "the frontends a pass parsed with". The
   formula counts every frontend passed**, less those whose `init` rejected. That
   includes frontends never `init`-ed, because no file of their language exists. My
   `fpunused` run shows the effect: a Python frontend that no pass used is in the
   fingerprint, and the first `.py` file re-parses all 21 files (E-25). The line
   describes a rule the code does not implement.

The `head_unresolved_since` and `walk_errors` lines match the code. That `runIndex`'s
clearing of `head_unresolved_since` is untested (K3) is a test gap (E-25), not an error
in the listing.

**Evidence:**
- Step 7's instruction [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L2084-L2086]] "**What changes.** Create `src/stores/migrations/001_phase_a_project.sql` containing every table AD-4 names for Phase A. The DDL below is AD-4's abridged schema with its"
- The new entry inside that DDL [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L2141-L2142]] "-- frontend_fingerprint (Step 14: sha256 hex over the sorted -- [lang, symbols, imports, version] of the frontends a pass parsed with;"
- The shipped file [[middleware/context-oracle/ctxoracle/src/stores/migrations/001_phase_a_project.sql@HEAD:L28-L29]] "-- fold_watermark_audit, fold_watermark_corrections, mining_in_progress, -- ref_ts, corpus_floor_met, lang_capabilities, walk_mode (plan Step 7)"
- [[ran]] `grep -c "frontend_fingerprint\|head_unresolved_since\|walk_errors\|indexing_in_progress" ctxoracle/src/stores/migrations/001_phase_a_project.sql` (at `HEAD`) → `0`; [[ran]] `git diff --stat 221a1bc HEAD -- middleware/context-oracle/ctxoracle/src/stores/migrations/001_phase_a_project.sql` → empty.
- The ruling [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-coordinator-rulings-schema-and-edit-timing.md@HEAD:L33-L34]] "Applied migrations are fixed. A changed schema is a new migration, and the tool must detect a store whose applied migrations differ from the code's." and its mechanism [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-coordinator-rulings-schema-and-edit-timing.md@HEAD:L44-L44]] "When a migration runs, store a checksum of each migration file's content in"
- The formula the line summarises [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L3815-L3817]] "one entry per frontend passed in `frontends` less any disabled by a rejected `init` this pass (m6)"
- [[ran]] `cd b8badj/exp; DIST=<dist> node fpunused.mjs` → on `7fdbd7e` and `HEAD`: `pass1 written 20 pyInits 0`, `pass2 unchanged written 0 pyInits 0`, `pass3 one .py added written 21 pyInits 1`, with the fingerprint changing between pass 2 and pass 3.

**Final verdict:** replace.

**Correction:**
- Move the `schema_meta` key registry out of Step 7's `001` DDL block into one home that
  no applied migration carries: a DAO key constant, or Step 14's text. Step 7's block
  then matches the shipped `001` as it stands.
- The same applies to every key line added to that block after `001` shipped, not only
  h4's three. `indexing_in_progress` (`8a234d6`, E-1) is one.
- Word `frontend_fingerprint` as E-25's corrected rule defines it: a per-language entry
  for the frontend actually used.

**Still at HEAD:** yes. The block at `HEAD` still carries the lines (the plan's L2157 is
`-- frontend_fingerprint (Step 14: sha256 hex over the sorted`), and `001` still lacks
them.

**Owner question:** none.

### E-17
**Ruling:** The second opinion's overturn, keep → replace (for h6, and h1–h3 through
regeneration), is upheld. Both reviews agree that h1–h3 and h33 are generated and
current at `221a1bc`. I re-ran `221a1bc`'s generator on `221a1bc`'s plan, and it reports
the regions current. The keep fails on what the declaration leaves out:
- `7fdbd7e` changes `src/index/generic_frontend.ts` and
  `src/index/tree_sitter_frontend.ts`.
- `177e59f` changed `src/cli/index.ts` and `src/cli/init.ts`.
- Review m7 asked for all four to be listed.
- h8 gives the reason for leaving them out: "the plan checker refuses a declaration
  that names a later step's file". That is false. With all four appended to h6's
  `modify:` list, `221a1bc`'s checker first reports the files region stale, regenerates
  it, and then passes. §5.1 then shows each of the four under S14.

So the first audit's "The declaration must list what the step changes, and it does" is
wrong, and E-17's keep of h6 cannot stand beside E-18's replace. E-18's correction
edits h6. The §9 rows still authorise the change, but they do not make the generated
§5.1 table show which step changes a file. h7 (the provides/tests line) and h33 (the
generated tests region) stand as they are.

**Evidence:**
- The declaration [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L3565-L3565]] "modify: [middleware/context-oracle/ctxoracle/test/fixtures/generate.ts, middleware/context-oracle/ctxoracle/src/miner/cochange.ts, middleware/context-oracle/ctxoracle/src/identity/repo_key.ts]"
- h8's reason [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L3577-L3578]] "the plan checker refuses a declaration that names a later step's file, and those §9 rows are the authorization for the change."
- The §9 row [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L7558-L7558]] "`src/index/generic_frontend.ts`, `src/index/tree_sitter_frontend.ts` — Step 14's skeleton frontends (made during Step 14's build)"
- [[ran]] `git show --stat --format= 7fdbd7e` → includes `.../ctxoracle/src/index/generic_frontend.ts        |   1 +` and `.../ctxoracle/src/index/tree_sitter_frontend.ts    |   1 +`, `14 files changed, 1547 insertions(+), 198 deletions(-)`; [[ran]] `git show --stat --format= 177e59f -- middleware/context-oracle/ctxoracle/src/cli` → `.../context-oracle/ctxoracle/src/cli/index.ts      | 29 ++++++++++++++++++----`, `.../context-oracle/ctxoracle/src/cli/init.ts       | 25 ++++++++++++++++---`.
- On `git archive 221a1bc middleware/context-oracle/docs/plans middleware/context-oracle/.claude/skills/expert-plan` extracted to `b8badj/p221/` [[ran]] `node .claude/skills/expert-plan/scripts/derive-plan-sections.mjs --check docs/plans/plan-phase-a.md` → `OK: 40 steps, 13 elements, 165 test specs, 27 probes cited, regions current`, exit 0.
- The same extraction with `src/cli/index.ts`, `src/cli/init.ts`, `src/index/generic_frontend.ts` and `src/index/tree_sitter_frontend.ts` appended to Step 14's `modify:` [[ran]] `--check` → `STALE: regions out of date: files — run without --check to regenerate`, exit 1; without `--check` → `regenerated: files (40 steps)`, exit 0; `--check` → `OK: 40 steps, 13 elements, 165 test specs, 27 probes cited, regions current`, exit 0; §5.1 then has `| middleware/context-oracle/ctxoracle/src/cli/index.ts | modify | S14 |`, and the same row for the other three.

**Final verdict:** replace.

**Correction:** h6's `modify:` list gains the four stand-in files, and h1–h3 are
regenerated from it. h7 and h33 stand. This is E-18's correction applied to the hunk it
changes, and h8's false reason goes with it (E-18).

**Still at HEAD:** yes. Step 14's `modify:` list at `HEAD` is unchanged [[middleware/context-oracle/docs/plans/plan-phase-a.md@HEAD:L3584-L3584]] "modify: [middleware/context-oracle/ctxoracle/test/fixtures/generate.ts, middleware/context-oracle/ctxoracle/src/miner/cochange.ts, middleware/context-oracle/ctxoracle/src/identity/repo_key.ts]", and so is h8's reason [[middleware/context-oracle/docs/plans/plan-phase-a.md@HEAD:L3596-L3596]] "the plan checker refuses a declaration that names a later step's file, and".

**Owner question:** none.

### E-24
**Ruling:** The second opinion's overturn, keep → replace, is upheld, for RV-12 only.
`tsLike`'s `version: 'v1'` and RV-24's re-induction stand. Both reviews show RV-24 kills
its release-on-success mutant (first audit C4, second opinion C6). The `TEMP` trigger
is real fault injection, and `assert.rejects(… /injected/)` proves it fired.

RV-12's title is "a byte-cap file changed at the same size but a new mtime is
re-recorded". The mechanism under test is the `stat:<size>:<mtime>` key in the skip
decision.
- The skip check compares zone as well as key.
- The amended rewrite header `# @generated\n` changes the file's zone from `source` to
  `generated`, so the zone difference alone re-records the file.
- A mutant whose byte-cap skip ignores the stat key entirely (R12b) survives every
  FILES test.
- With a same-size header that leaves the zone at `source` (`plain HEADER\n`), the
  unmutated test passes and R12b is killed, by the key assertion.

The first audit's I4 (a key without `mtime`) is killed only by RV-12's last assertion,
on the stored key's text. That pins the key's format, not its use in the skip.

The weakness predates `7fdbd7e`. The reviewer's `bfe8d3b` header `@generated!!` also
changed the zone. But this commit rewrote exactly that line and chose another
zone-changing header, so the amended line must change again, and a keep cannot hold. The
same defect in `bfe8d3b`'s test file belongs with E-5, whose replace is unchanged.

**Evidence:**
- The amended line [[middleware/context-oracle/ctxoracle/test/unit/indexer_review.test.ts@7fdbd7e:L329-L329]] "writeFileSync(path.join(dir, 'big.txt'), `# @generated\n${body}`); // 13 bytes, the same size as `plain header\n` (T-14-7 M3 note)" and the zone assertion it relies on [[middleware/context-oracle/ctxoracle/test/unit/indexer_review.test.ts@7fdbd7e:L333-L333]] "assert.equal(row(env.store, 'big.txt')?.zone, 'generated', 'the same-size rewrite with a new mtime was skipped as unchanged');"
- The skip check compares zone [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@7fdbd7e:L609-L610]] "prior.zone === zone.zone && prior.zone_evidence === zone.evidence;" and the byte-cap branch [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@7fdbd7e:L621-L622]] "const key = `stat:${read.bytes}:${read.mtime}`; if (unchanged(key, zone)) {"
- The reviewer's header [[middleware/context-oracle/ctxoracle/test/unit/indexer_review.test.ts@bfe8d3b:L328-L328]] "writeFileSync(path.join(dir, 'big.txt'), `@generated!!\n${body}`); // same size as `plain header\n`"
- R12b (`unchanged(key, zone)` → `unchanged(prior?.content_hash, zone)` in the byte-cap branch) [[ran]] `cd b8badj; python3 mut.py b8badj/mut FILES R12b` → `BASELINE failing []`, `R12b SURVIVED [byte-cap skip ignores the stat key] by=[]`.
- RV-12 alone, committed and with the header `plain HEADER\n` and zone `'source'` (compiled copy edited, then restored) [[ran]] `cd b8badj; python3 rv12.py b8badj/mut` → `committed RV-12, unmutated: exit 0 ['# pass 1', '# fail 0']`, `committed RV-12, R12b: exit 0 ['# pass 1', '# fail 0']`, `same-zone RV-12, unmutated: exit 0 ['# pass 1', '# fail 0']`, `same-zone RV-12, R12b: exit 1 ['# pass 0', '# fail 1'] ['the byte-cap key is not stat:<size>:<mtime_ms>']`.

**Final verdict:** replace.

**Correction:**
- Keep the `version` member and RV-24's re-induction.
- Give RV-12 a same-size rewrite that leaves the zone unchanged (for example
  `plain HEADER\n`), and assert zone `source`, so that only the stat key can cause the
  re-record.
- Keep the key-format assertion.

**Still at HEAD:** yes. `indexer_review.test.ts` L329 and L333 at `HEAD` are the lines
quoted above: [[middleware/context-oracle/ctxoracle/test/unit/indexer_review.test.ts@HEAD:L329-L329]] "writeFileSync(path.join(dir, 'big.txt'), `# @generated\n${body}`);"

**Owner question:** none.

### E-25
**Ruling:** Both reviews say replace, and replace is upheld.
- The defects both reviews name stand; both executed them on `7fdbd7e` and `HEAD`:
  - open and read errors become absence, with no fault;
  - a throwing resolver becomes an unresolved count, with no fault;
  - there is no inter-chunk yield;
  - fallback token tables are written under `fts5`;
  - S2 covers presence only (E-3);
  - `7fdbd7e` was not reviewed before STATUS.
- The M4 item is corrected as in E-14: `{stale: false}` stays in `refreshIfStale`, and
  the dampening belongs to Step 28.

The three defects the second opinion adds are each re-verified on my own builds:

1. **The M1 read follows a link in a parent directory.** Confirmed: `midlink.mjs`
   stores `outsideSecret` for `src/b.ts` on both builds. The fix is E-9's
   descriptor-derived check. The second opinion's realpath plus `dev`/`ino` check is
   the portable fallback only, because a two-swap schedule passes it.
2. **The fingerprint counts frontends the pass never used.** Confirmed: a Python
   frontend with no `.py` file in the tree is never `init`-ed but is in the fingerprint.
   When the first `.py` file appears and its `init` rejects, the fingerprint changes
   and all 21 files re-parse. The formula matches the plan's text, so this is a plan
   defect as well as a code one. The plan's reason, "stores the list it actually parsed
   with", is not what the formula computes.
   - The second opinion's primary fix, "take the fingerprint over the frontends
     actually `init`-ed and used", is wrong as a whole-tree key. I built it as a
     prototype. The first `.py` file with a working Python frontend then changes the
     fingerprint and re-parses all 21 files. Today that case writes 1. So it moves the
     defect instead of removing it.
   - Its secondary suggestion is the correct fix: key the fingerprint per language. The
     cache key of a file's derived rows is the entry of the frontend used for its
     language (tree-sitter, generic, or path-only). A pass re-parses the files of each
     language whose entry changed, and only those. That also stops a recovered grammar
     from re-parsing every other language.
3. **Rules without a test.** Confirmed with my own mutants on `7fdbd7e`, against FILES:
   - dropping the absent file's `symbol_refs` delete (A2) survives;
   - dropping its `test_map` delete (A3) survives;
   - passing the computed `full` to the miner (N1) survives, so a fingerprint change
     would start a purged full re-mine;
   - `runIndex` never clearing `head_unresolved_since` (K3) survives.

   A2 and A3 are not equivalent mutants. On a `HEAD` copy without both deletes, deleting
   an importer and a test file leaves their `symbol_refs` rows and the `test_map` row,
   with `in_tree 0`. The DAO's `coveringTests` then still returns the deleted test file
   for `src/b.ts`. The files row survives the sweep because mined history references
   it.

**Evidence:**
- The read's catches at `HEAD` [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@HEAD:L163-L165]] "} catch { // ENOENT (vanished), ELOOP (a symlink), EACCES …: not a present file. return { kind: 'absent' };" and [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@HEAD:L200-L201]] "} catch { return { kind: 'absent' };"
- The resolve catch [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@HEAD:L754-L754]] "r = { kind: 'unresolved' };"
- The fallback table written whatever `fts_state` is [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@HEAD:L819-L819]] "pathTokens.replaceForFile(id, pt);"
- The fingerprint's input [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@HEAD:L565-L566]] "const enabled = [...opts.frontends].filter((f) => !disabled.has(f)); const fingerprint = fingerprintOf(enabled);" and the plan's reason [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L3827-L3828]] "disabled by `init` (m6), so a pass whose grammar failed stores the list it actually parsed with"
- The miner clause N1 breaks [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L3931-L3934]] "`runIndex`'s `full` reaches the miner, so a full index is a purged full re-mine (Step 13; expert review S3); a pass made full by `indexing_in_progress` or by the fingerprint passes the caller's own `full`."
- The absent chunk's two deletes [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@HEAD:L869-L870]] "refs.replaceForFile(id, []); testMap.replaceForFile(id, [], prov);"
- The DAO readers [[middleware/context-oracle/ctxoracle/src/stores/dao/symbol_refs.ts@HEAD:L26-L26]] ".prepare('SELECT COALESCE(SUM(ref_count), 0) AS n FROM symbol_refs WHERE symbol_id = ?')" and [[middleware/context-oracle/ctxoracle/src/stores/dao/test_map.ts@HEAD:L35-L35]] ".prepare('SELECT DISTINCT test_file FROM test_map WHERE ? GLOB region_glob ORDER BY test_file')"
- Defect 1 [[ran]] `cd b8badj/exp; DIST=<dist> node midlink.mjs` → on `7fdbd7e` and `HEAD`: `filesWritten 2 [{"path":"a.ts","name":"a"},{"path":"src/b.ts","name":"outsideSecret"}]` (E-9).
- Defect 2 (20 `.ts` files; frontends `[ts, pyBroken, generic]`, where `pyBroken`'s `init` rejects) [[ran]] `cd b8badj/exp; DIST=<dist> node fpunused.mjs` → on `7fdbd7e`: `pass1 written 20 pyInits 0 fp d8c7a16147f1`, `pass2 unchanged written 0 pyInits 0 fp d8c7a16147f1`, `pass3 one .py added written 21 pyInits 1 fp ca5d3b07e176`, `pass4 unchanged written 0 pyInits 2 fp ca5d3b07e176 faults ["frontend_parse_failed","frontend_parse_failed"]`; on `HEAD` the same counts, with `fp 3f81dc788aeb` then `b1bf21fe85a6`.
- The used-only prototype (a working `py` frontend) [[ran]] `cd b8badj/exp; FP=<mode> DIST=b8badj/fix/dist node fpused.mjs` → `passed` (as `HEAD`): `pass1 written 20`, `pass2 one .py added written 1`; `used`: `pass1 written 20`, `pass2 one .py added written 21`.
- Defect 3 [[ran]] `cd b8badj; python3 mut.py b8badj/mut FILES` → `BASELINE failing []`, `A2 SURVIVED [absent chunk keeps its symbol_refs] by=[]`, `A3 SURVIVED [absent chunk keeps its test_map rows] by=[]`, `N1 SURVIVED [miner gets the computed full] by=[]`, `K3 SURVIVED [runIndex never clears head_unresolved_since] by=[]`.
- The same four mutants on a copy of the `HEAD` build, against every compiled unit test file (Step 15's tests included) [[ran]] `cd b8badj; python3 mutall.py b8badj/mutHH` → `BASELINE failing [] of 55`, `A2 SURVIVED [absent chunk keeps its symbol_refs] by=[]`, `A3 SURVIVED [absent chunk keeps its test_map rows] by=[]`, `N1 SURVIVED [miner gets the computed full] by=[]`, `K3 SURVIVED [runIndex never clears head_unresolved_since] by=[]`.
- A2/A3 non-equivalence (`src/b.ts` exports `foo`; `src/a.ts` and `src/b.test.ts` import it; both deleted from the working tree) [[ran]] `cd b8badj/exp; DIST=<dist> node absentrows.mjs` → `HEAD`: `pass2 (a.ts, b.test.ts deleted) {"refRows":[],"tm":[],"covering":[]}`; `b8badj/mutH` (both deletes removed): `pass2 (a.ts, b.test.ts deleted) {"refRows":[{"path":"src/a.ts","ref_count":3,"in_tree":0},{"path":"src/b.test.ts","ref_count":2,"in_tree":0}],"tm":[{"path":"src/b.test.ts","region_glob":"src/b.ts","in_tree":0}],"covering":[2]}`.

**Final verdict:** replace.

**Correction:** As the first audit states, with these changes:
- Drop "dampen on an unresolved `HEAD`" from this file's list. It belongs to Step 28's
  `EventContext` (E-14).
- Add E-9's descriptor-derived containment check to `readTreeFile`.
- Replace the whole-tree fingerprint with a per-language one, in plan Step 14 and in
  the code. Store `{lang: entry of the frontend used}`, and on a difference re-parse
  only the files of the changed languages.
- Add tests that kill A2, A3, N1 and K3.
- The rest stays as the first audit states it:
  - absence only for `ENOENT`, `ENOTDIR` or `ELOOP`, or a non-regular descriptor; any
    other open, `fstat` or read error keeps the stored rows and records a fault;
  - a throwing resolver records `frontend_parse_failed` with `phase: 'resolve'`;
  - the ≥ 25 ms inter-chunk yield;
  - fallback token tables only under `fallback`;
  - S2 as dependency tracking (E-3).

**Still at HEAD:** yes, every defect. `midlink.mjs`, `fpunused.mjs` and `absentrows.mjs` were
run on the `HEAD` build, and A2, A3, N1 and K3 survive all 55 unit test files at `HEAD`.

**Owner question:** none.

### E-23
**Ruling:** Not second-opinioned, but E-14's verified facts change its correction, so it
is re-ruled here. Replace stands, with a different correction. The first audit's "make
the reftable case expect dampening (batch 5 item 10)" rests on the premise E-14 rejects:
the premise that `refreshIfStale`'s result feeds confidence. Its one reader is the
`SessionStart` spawn. Dampening is Step 28's `EventContext`, so the case that expects
dampening belongs in Step 28's tests, not in T-14-2. So:
- T-14-2's reftable case expecting `{stale: false}` and one `head_unresolved` fault with
  reason `reftable` pins the correct behaviour. It stays, for the `HEAD`-dummy layout.
- The config-only layout tests the scan E-14 removes. It is a state git never creates,
  so it goes.
- The first audit's point on the `reindex_owner_pid` assertion stands: `refreshIfStale`
  writes no such key in any branch, so the assertion cannot fail. The "never spawns"
  property lives in the handler, which is the only spawner.

**Evidence:**
- The reftable case [[middleware/context-oracle/ctxoracle/test/unit/indexer_stale.test.ts@7fdbd7e:L225-L225]] "assert.deepEqual(refreshIfStale(store, repo, diag), { stale: false }, `reftable call ${i} returns {stale: true}`);"
- The config-only layout [[middleware/context-oracle/ctxoracle/test/unit/indexer_stale.test.ts@7fdbd7e:L214-L214]] "'config extensions.refStorage = reftable': (repo) => appendFileSync(path.join(repo, '.git', 'config'), '[extensions]\n\trefStorage = reftable\n'),"
- The vacuous assertion [[middleware/context-oracle/ctxoracle/test/unit/indexer_stale.test.ts@7fdbd7e:L226-L226]] "assert.equal(meta(store, 'reindex_owner_pid'), undefined, `reftable call ${i} writes a reindex_owner_pid row`);"
- The only spawner [[middleware/context-oracle/ctxoracle/src/hook/handler.ts@HEAD:L162-L162]] "if (refreshIfStale(store, repoPath, diagnosticsDir).stale) {"
- The handler clause batch 5 item 10 replaced, where the dampening lives [[middleware/context-oracle/docs/plans/plan-phase-a.md@221a1bc:L5842-L5843]] "an `{unresolved}` `HEAD` makes both false (the same direction `refreshIfStale` takes)."
- Unchanged at `HEAD` [[ran]] `git diff --stat 7fdbd7e HEAD -- test/unit/indexer_stale.test.ts` (in `ctxoracle/`) → empty.

**Final verdict:** replace.

**Correction:**
- Keep the transition cases, and the `HEAD`-dummy reftable case expecting
  `{stale: false}` and one `reftable` fault.
- Drop the config-only layout and the vacuous `reindex_owner_pid` assertion.
- Add a Step 28 handler case: a reftable `HEAD` spawns no reindex on `SessionStart`, and
  its `EventContext` flags are true (batch 5 item 10).
- Add the `runIndex`-clears-`head_unresolved_since` case (K3).

**Still at HEAD:** yes. The test file is unchanged.

**Owner question:** none.

## Entries not re-ruled

Neither second-opinioned into dispute nor changed by a verified fact here. The first
audit's verdict stands.

- **Judged by both reviews, agreed keep, no new fact changes them: E-12, E-13, E-15,
  E-19.** The second opinion's additions change no verdict.
  - E-12: the untested `symbol_refs`/`test_map` deletes (A2, A3) are test gaps, ruled
    under E-25.
  - E-15: the untested miner clause (N1) is ruled under E-25, and the 242 MB re-measure
    matches the first audit's 239 MB.
  - E-19: the equivalent mutant I7 is moot at `HEAD`, and the fingerprint over-count
    it names is E-25's defect 2.
- **Judged by the first audit only, replace stands: E-1, E-2, E-4, E-5, E-6, E-8, E-10,
  E-11, E-18, E-20, E-21, E-22, E-26, E-27.** Consequences of the rulings above, which
  add to their corrections without changing their verdicts:
  - E-2 (the review record): the later record that corrects the review should also
    name its two further misses: the parent-directory link read (E-9) and the
    fingerprint over-count (E-25).
  - E-5: RV-12's zone-changing header (E-24) was first written at `bfe8d3b`.
  - E-6: the coordinator-verified facts (15 listed variables, 5 cleared) are the ones
    it rests on. Its correction is unchanged.
  - E-16's correction reaches E-1's `indexing_in_progress` line in Step 7's block.
  - E-18: its correction is the same change as E-17's.
  - E-20 and E-21 gain the A2, A3 and N1 cases (H3 is K3, already listed) and E-3's
    `tsext`, `pkgdrop`, `pkgrm` cases, plus `js` and `pydel` at `HEAD`.
  - E-22 gains the parent-swap case (E-9).

## Summary

| Entry | First audit | Second opinion | Final verdict | Ruled here |
|---|---|---|---|---|
| E-1 | replace | — | replace | no |
| E-2 | replace | — | replace | no |
| E-3 | replace | replace | replace | yes |
| E-4 | replace | — | replace | no |
| E-5 | replace | — | replace | no |
| E-6 | replace | — | replace | no |
| E-7 | replace | replace | replace | yes |
| E-8 | replace | — | replace | no |
| E-9 | keep | replace | replace | yes |
| E-10 | replace | — | replace | no |
| E-11 | replace | — | replace | no |
| E-12 | keep | keep | keep | no |
| E-13 | keep | keep | keep | no |
| E-14 | replace | replace | replace | yes |
| E-15 | keep | keep | keep | no |
| E-16 | keep | replace | replace | yes |
| E-17 | keep | replace | replace | yes |
| E-18 | replace | — | replace | no |
| E-19 | keep | keep | keep | no |
| E-20 | replace | — | replace | no |
| E-21 | replace | — | replace | no |
| E-22 | replace | — | replace | no |
| E-23 | replace | — | replace | yes (correction changed by E-14) |
| E-24 | keep | replace | replace | yes |
| E-25 | replace | replace | replace | yes |
| E-26 | replace | — | replace | no |
| E-27 | replace | — | replace | no |

Counts, recounted from the sections and the table above:
- Ruled here: 9 entries (E-3, E-7, E-9, E-14, E-16, E-17, E-23, E-24, E-25), each
  replace.
  - 4 changed from the first audit, keep → replace: E-9, E-16, E-17, E-24.
  - 5 replaces stand with corrections amended: E-3, E-7, E-14, E-23, E-25.
- Final verdicts across all 27 entries:
  - keep 4: E-12, E-13, E-15, E-19;
  - replace 23: E-1 … E-11, E-14, E-16, E-17, E-18, E-20 … E-27;
  - remove 0; undetermined 0.
- Where this adjudication departs from the second opinion:
  - E-3: the `pydel` disappearance depends on batch 9. `221a1bc`'s own rules miss a
    `package.json` deletion (`pkgrm`) and edit (`pkgdrop`).
  - E-9: realpath plus `dev`/`ino` is only the portable fallback. It passes a two-swap
    schedule, as executed. The race-free fix on Linux is the descriptor's own path
    (`/proc/self/fd`), and a §13 record alone is not acceptable there.
  - E-25: a fingerprint over the frontends actually used re-parses the whole tree on
    the first file of any new language (prototype: 21 written instead of 1). The fix is
    a per-language key.
  - E-23 is re-ruled: the dampening case moves to Step 28's tests.
- New defects in `7fdbd7e`, each re-verified on my own `7fdbd7e` and `HEAD` builds:
  - the parent-directory link read (`outsideSecret` stored);
  - the fingerprint over-count (21 re-parsed for one new `.py` file);
  - the untested rules A2, A3, N1 and K3 (all survive all 55 unit test files at `HEAD`).
    A2 and A3 are shown to be non-equivalent.
- Still at `HEAD` (`aabdb52`): every defect ruled here.
- Owner questions: none.
