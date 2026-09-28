# Branch audit — batch B9, coordinator verification and final verdicts

Batch 9 is commits 62–70 of `git rev-list --reverse de66831..HEAD`, the last
batch: Step 15, the language frontends. It has 66 units, audited as one part.

| Commit | Content |
|---|---|
| `059dc86` | AD-12/L6: 31 usable grammars, Lua excluded |
| `42653ae` | Step 15 plan fixes raised by its test writer |
| `bfe963f` | the build ("unreviewed; Python resolver flaw open") |
| `d616f1f`, `115d176`, `f22ce6b` | the Python resolver plan changes |
| `feb37c9` | the Python resolver code |
| `ff99487` | the independent review, with hand mutation tests |
| `64f46fd` | AD-12 generic frontend scope and AD-19 identifier redaction |

**Models.** Every role ran on Opus 5.5 (see the B7 verification for the
direction and its cost): the first audit, the second opinion and the
adjudication, each by a fresh agent.

**Scope at HEAD.** `HEAD`'s ctxoracle source equals `64f46fd`'s. So every code
defect found in this batch is present in `HEAD`.

## What the coordinator checked, and what it showed

**Checker run on the first audit:** 39 entries, 66 of 66 units, exit 0.

**Quotes**, checked with `qcheck.py`. Every one is exact.

| File | Repo quotes | Web quotes |
|---|---|---|
| second opinion | 57 | 12 |
| adjudication | 54 | 12 |

**Facts the coordinator established from primary sources:**

- **The Lua grammar actually shipped.**
  - `tree-sitter-wasms` depends on `tree-sitter-lua ^2.1.3`.
  - Its npm `gitHead` is `6b02dfd7f07f36c223270e97eb0adf84e15a4cef`.
  - `src/scanner.c` at that commit is byte-identical to the `master` copy the
    first audit cited.
  - L53: `return malloc(sizeof(struct ScannerState));`, with no
    initialisation.
  - L71: `deserialize` restores state only when `length == 2`.
- **The Swift grammar actually shipped.**
  - `tree-sitter-wasms` 0.1.13's npm `gitHead` is `3e88dc9`.
  - Its `pnpm-lock.yaml` resolves `tree-sitter-swift` `^0.4.0` to `0.4.3`.
  - 0.4.3's npm `gitHead` is `47abc88`.
  - Its `src/scanner.c` L232: `return calloc(0, sizeof(struct ScannerState));`
    — no space for the state it then writes.
- **Executed claims.** The second opinion and the adjudication each reproduced
  the Lua cause independently, by zeroing the scanner's allocation and changing
  nothing else:
  - as shipped, 19 of 24 parses err;
  - zeroed, 0 of 24;
  - filled with `0xff`, 20 of 24.

## Final verdicts

| Keep | Replace | Remove | Undetermined | Entries |
|---|---|---|---|---|
| 10 — E-4, E-5, E-10, E-11, E-12, E-13, E-20, E-22, E-25, E-31 | 29 | 0 | 0 | 39 |

## Defects still present at HEAD (for the correction pass)

1. **Grammars with an uninitialised scanner** (E-1, E-2, E-3, E-18, E-21).
   - **Lua** was excluded as a patch, and the exclusion is invisible: `.lua`
     files are recorded as `unknown`, with no fault.
   - **Swift** is in the "usable" table with the same defect class. A raw
     string after the first parse returns an ERROR tree and loses its symbols
     (`[]` instead of `["f","P","g"]`), while the frontend returns `ok: true`.
   - **The plan's claim is false:** "31 grammars … parse error-free on every
     repeated parse".
   - **The fix:**
     - vendor the Lua WASM from `@tree-sitter-grammars/tree-sitter-lua`
       0.4.1 as a file, with integrity, sha256 and the MIT notice;
     - rebuild Swift 0.4.3's WASM with `calloc(1, …)` and a length-0 reset;
     - have the loader take a per-grammar WASM path from the table;
     - amend AD-25 to allow vendored grammars.
     - Neither grammar can be an npm dependency: C-3 and AD-25 rule out
       install scripts and native builds.
   - **Checks:** a scanner-initialisation check when the plan is written; a
     per-file ERROR-tree signal at runtime; a raw-string Swift sample; a
     `hasError` assertion in T-15-6.
2. **Throw poisoning** (E-19).
   - Each throw leaks 864 bytes of wasm stack for the life of the process.
     TypeScript fails after throw 76.
   - The bound on throws is per process.
   - Two empty `catch` blocks sit around `delete()`, and the reason their
     comments give does not reproduce.
   - A failed `Parser.init()` stays cached.
   - `version` is not a content digest.
3. **Python resolution** (E-29, E-32, E-33).
   - The ancestor walk is not `sys.path[0]`.
   - An undeclared `requests` becomes external.
   - A stdlib `logging` or `json` becomes unresolved when any directory holds
     a same-named module.
   - A false edge `a/b/x.py → a/config.py` is recorded.
   - Fix: vendor the standard-library list with a stated Python version (it has
     303, 305, 300 and 290 names in 3.10–3.13), and take declared
     distributions and the project root as inputs (batch 4 item 5).
   - `hasTopLevelModule` goes.
4. **TypeScript resolution** (E-7, E-17, E-23).
   - Add `.d.ts`, `.d.mts` and `.d.cts` in the handbook's order.
   - Source goes before the written `.js` (tsc 5.9.3 `--traceResolution`).
   - Workspace packages are in-repo.
   - `.` and `..` are not files.
   - Settle `.json`.
5. **The generic frontend** (E-6, E-15, E-16, E-38, E-39).
   - Fallback files are missing from their language's unresolved share, and
     are never retried.
   - Symbols are extracted from Markdown and binary files.
   - Name length is unbounded.
   - "8 KB" has no source; git uses 8000 bytes.
   - The deny-list is not enumerated.
   - Redaction applies to generic-frontend names too: `T11_DiscoveryWorkflowTests`
     is redacted. The scope should read "any frontend".
6. **Step 14 items found here** (E-16).
   - The untuned `redact(s.name)` dates from `0e457c7`.
   - `redact(parsed.error)` and the raw-name `isSuspect` date from `177e59f`.
   - No earlier batch recorded them, so they go to the correction pass as
     findings of those commits.
7. **Frontend table** (E-14). A malformed member is skipped silently.
8. **Tests that pass while wrong:**
   - T-15-1's span check (E-9, E-26);
   - T-15-4: duplicate faults, a parser-reuse clause that cannot fail, and the
     share and many-throws cases — the many-throws test must run a second pass
     in the same process (E-27);
   - T-15-5's missing cells, and nearest-first order unpinned (E-23, E-30,
     E-34);
   - T-15-3's `unknown` expectation (E-8, E-24);
   - the review's test file (E-36).
9. **Records.**
   - The review `ff99487`: 15 of its 17 findings have no disposition on
     record. M3 and M4 were applied only in the architecture.
   - The review also missed:
     - the Python ruling conflict;
     - Lua's cause;
     - M60's settled order;
     - Swift and the 31-grammar claim;
     - the silent `defaultFrontends` skip;
     - S1's pass-scoped bound (E-37).
   - The implementation-log entries:
     - a false `sys.path[0]` premise;
     - omitted decisions;
     - a stale "uncommitted" (E-28, E-35).
   - STATUS was last rewritten at `fbb9052`, before Step 15, so none of Step
     15's state is recorded.

## Questions for Max Cogar

None new.

## The audit as a whole

With this batch, every change on the branch since `de66831` has been judged.

| Batch | Keep | Replace | Remove | Entries |
|---|---|---|---|---|
| B1 | 6 | 11 | 0 | 17 |
| B2 | 1 | 14 | 0 | 15 |
| B3 | 10 | 35 | 1 | 46 |
| B4 | 27 | 61 | 0 | 88 |
| B5 | 34 | 60 | 0 | 94 |
| B6 | 21 | 56 | 0 | 77 |
| B7 | 27 | 45 | 0 | 72 |
| B8 | 7 | 50 | 0 | 57 |
| B9 | 10 | 29 | 0 | 39 |
| **All** | **143** | **361** | **1** | **505** |

- The entries cover all 1,342 inventory units, commits 1–70.
- `1b8b47a`, which re-enabled the two Stop gates, is outside this project's
  tree and was not an audit unit.
- The later commits are the audit's own files.
