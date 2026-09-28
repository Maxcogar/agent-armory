# Branch audit — batch B8, coordinator verification and final verdicts

Batch 8 is commits 52–61 of `git rev-list --reverse de66831..HEAD`: Step 14, the
structural indexer. It covers the plan changes before the build, the build, its
independent review, and the fixes from that review. It has 108 units, in two
parts:

| Part | Commits | Content | Units |
|---|---|---|---|
| **8a** | `37ea382`, `6f5ceb8`, `177e59f` | plan fixes raised by the test writer; skeleton-caller rows; the build | 49 |
| **8b** | `8a234d6`, `bfe8d3b`, `0528470`, `221a1bc`, `42dbbd0`, `7fdbd7e`, `fbb9052` | the review with hand mutation tests; AD-12 amendment; plan fixes; code fixes; STATUS "Step 14 built and reviewed" | 59 |

**Models and roles.** Every role ran on Opus 5.5, per Max Cogar's direction of
2026-09-28 ("use 5.5 for the rest"): the first audit, the second opinion, and
the adjudication, each by a fresh agent. The cost is recorded in the B7
verification: without two different models, the audits' errors are more
likely to be shared. The two parts' first audits ran in parallel. Each second
opinion and adjudication read the other part's files as provisional.

All execution ran on scratch extractions and throwaway repositories. This
repository was never checked out or modified by an auditor.

## What the coordinator checked, and what it showed

**Checker runs on the first audits.**

| Part | Entries | Units covered | Exit |
|---|---|---|---|
| 8a | 30 | 49 of 49 | 0 |
| 8b | 27 | 59 of 59 | 0 |

**Quotes in second opinions and adjudications**, checked with `qcheck.py` (the
checker's matching). Every one is exact.

| File | Repo quotes | Web quotes |
|---|---|---|
| 8a second opinion | 64 | 15 |
| 8a adjudication | 60 | 16 |
| 8b second opinion | 67 | 15 |
| 8b adjudication | 60 | 18 |

**Executed claims the coordinator reproduced** (git 2.43.0, Node 22.22.2):

- **A `.git` directory holding only `HEAD` (8a E-1).** `git ls-files` exits 128.
- **Environment scrub (8b E-6).**
  - `git rev-parse --local-env-vars` lists 15 variables.
  - `gitChildEnv` (`src/identity/git_layout.ts` L79) clears 5 of them.
- **Symlinked parent directory (8b E-9).**
  - An `O_RDONLY | O_NOFOLLOW` open through a symlinked parent succeeds and
    reads the file outside it.
  - `indexer.ts` L143 relies on `O_NOFOLLOW` alone.
  - After that open, `readlink /proc/self/fd/<fd>` names the real path outside
    the root. That is the basis of the adjudicated containment check.
  - Node 22.22.2 exposes no `openat2` and no `RESOLVE_BENEATH`.
- **Gitfile parsing (8a E-13).**
  - `gitdir: <path>` followed by `extra`: `fatal: not a git repository:
    <path>/.git`, then `extra`, exit 128.
  - `junk` followed by `gitdir: <path>`: `fatal: invalid gitfile format:
    <file>`, exit 128.
- **STATUS timing (8b E-27).** `7fdbd7e` was committed at 09:42:10Z, and
  `fbb9052` ("Step 14 built and reviewed") at 09:42:12Z.

## A coordinator error, recorded

When committing the 8a second opinion (`e1a2484`), the coordinator wrote that
its message "invalid gitfile format" "is not what 2.43.0 prints". The adjudicator
was then told to use the coordinator's message instead.

- The coordinator had tested a different input: a valid first line followed by
  `extra`.
- For the second opinion's own input, a junk first line, git prints exactly
  "invalid gitfile format". The coordinator re-ran both.
- So the second opinion was right, and the coordinator's correction was wrong.
  It came from generalising one input to another without running the second.
- The adjudication records both messages, each against its own input.

## Final verdicts

| Part | Keep | Replace | Remove | Undetermined | Entries |
|---|---|---|---|---|---|
| 8a | 3 — E-6, E-22, E-29 | 27 | 0 | 0 | 30 |
| 8b | 4 — E-12, E-13, E-15, E-19 | 23 | 0 | 0 | 27 |
| **Batch** | **7** | **50** | **0** | **0** | **57** |

## Defects still present at HEAD (for the correction pass)

The adjudications state each item as reproduced on a scratch build of `HEAD`.

1. **Containment (CWE-59)** (8b E-9, E-25).
   - A tracked directory swapped for a symlink mid-pass lets the indexer read
     and store a file outside the repository.
   - Fix: after the open, `/proc/self/fd/<fd>` must lie under
     `realpath(root)`.
   - The portable realpath plus `dev`/`ino` fallback has a two-swap residual,
     recorded in §13.
2. **Errors become deletions** (8a E-17; 8b E-7, E-25).
   - Any `lstat`, open, read or readdir error (`EACCES`, `EIO`, `EMFILE`) makes
     a present file "absent" and deletes its rows, with no fault.
   - Fix: only `ENOENT` means absent; every other error keeps the rows and
     records a fault.
   - A throwing resolver is counted as unresolved with no fault.
   - Silent catches for an unreadable importer and a malformed `package.json`.
   - An unreadable loose ref falls through to a possibly stale `packed-refs`
     value.
3. **A symlinked tracked directory** makes `git check-ignore` exit 128 and fails
   every pass. Drop listed paths beneath a symlinked leading directory before
   the call, as `git status` does (8b E-7).
4. **Incremental correctness** (8b E-3, E-25).
   - Stale rows persist until `--full` in these cases:
     - `.ts` next to `.js`;
     - an extensionless import;
     - a Python name first classed external;
     - a `package.json` dependency added, removed or deleted.
   - Fix: record, per importing file, every lookup its resolver made, and
     re-parse it when any answer changes.
   - Keep the frontend fingerprint per language, not global.
   - Untested rules: A2, A3, N1, K3.
5. **Search storage** (8a E-17, E-19). Fallback token tables are written under
   `fts5`, against batch 5 ruling 3. The `search.ts` header still states the
   replaced rule.
6. **Locking** (8a E-17).
   - There is no inter-chunk yield. StoreBusy hits: 406 of 616 at `177e59f`,
     410 of 552 at `HEAD`.
   - A 25 ms yield (batch 3's settled rule) takes it to 3 of 2,310 and 0 of
     2,430. It costs +51% pass time (98.2 s → 148.4 s).
   - The cause of the residual 3 is not established.
   - The fix also bounds every write transaction under about 100 ms, and
     states the cost.
7. **Zones** (8a E-9, E-21).
   - An ignore match is its own signal, never `generated`. T-14-3, RV-9 and
     RV-13 pin the replaced rule and change with it.
   - An any-depth `build/` match has no source; `src/build/plan.ts` is classed
     `build_output`.
   - Lockfile list and the 200-character cut, both unsourced.
8. **The git layout** (8a E-1, E-13).
   - Parse the `.git` file as git's `setup.c` does: a `gitdir: ` prefix, only
     trailing CR/LF stripped, the 1 MiB limit refused, the target passing
     `is_git_directory`.
   - A non-`ENOENT` stat error is reported.
9. **Environment** (8b E-6). Clear all of `git rev-parse --local-env-vars`, and
   `GIT_CONFIG_PARAMETERS`. The repo-key wiring is untested.
10. **Reftable** (8b E-14, E-23).
    - A reftable repository's index is never refreshed by events. Record it in
      §13 or §15, or build the bounded read.
    - Drop the config scan.
    - The dampening for an unresolved `HEAD` belongs in Step 28's
      `EventContext`.
11. **The claim result** (8a E-3, E-4, E-12, E-14).
    - A refused acquire must carry `ownerPid` and `startedAt`, read inside the
      acquire transaction.
    - `init` and `index` re-read a row the holder deletes.
    - `init` exits 0 on a refused first index. It should exit 75 like `index`.
    - `init` wires hooks before indexing (batch 6 item 9).
12. **Plan and migration** (8b E-16, E-17; 8a E-2, E-10, E-11).
    - The key list is specified inside the shipped `001` migration, which
      cannot gain it under the checksum ruling.
    - Step 14's `modify:` list lacks the four stand-in files. The checker
      accepts them after regeneration.
    - The `todo` red state fails on a `TypeError`.
    - The skip condition omits language, zone and evidence.
    - "git's own check" is false: git also runs a racy-clean content check.
13. **Tests that pass while wrong** (8a E-7, E-23–E-28; 8b E-20–E-24).
    - 9 of 35 mutants survive all tests in 8b's run.
    - The "spawns nothing" check scans direct imports only.
    - `**` is untested across two or more segments.
    - Normalise-before-split is untested.
    - The RV-12 zone-change masking.
    - The repeated-fault and unconditional-release gaps.
14. **Capability records** (8a E-18). A frontend declaring `symbols: true` while
    indexing 0. Retired at HEAD for Go and C, but the adjudication notes that
    Step 15's generic frontend shows the same pattern (css, html, json, toml,
    vue, embedded_template); batch 9 judges it.
15. **Records.**
    - STATUS "Step 14 built and reviewed" is false: the 1,547-line `7fdbd7e`
      was never reviewed, 2 s before STATUS. This is the same error batches 6
      and 7 recorded.
    - "Both fixed" is false for S2.
    - "1,881 files in 3.8 s" was a run with no parsers.
    - The implementation log presents the absent-on-error rule and the silent
      resolve catch as settled.
    - The review's silently dropped or narrowed findings: m1 (5 of 15
      variables), m3's key change, m7's false reason, M4's §15 record.

**Fixed at HEAD** (each adjudication names its item): the marker regex
matching anywhere; the frontend-change re-parse; re-resolution of unchanged
importers; the unbounded read after `lstat`; the walk's inherited
`GIT_DIR`/`GIT_WORK_TREE`; and the retirement of the tree-sitter stand-in.

## Questions for Max Cogar

None new. Still open: his sign-off on the FR-O2 / FR-A2d / AC-1c wording.
