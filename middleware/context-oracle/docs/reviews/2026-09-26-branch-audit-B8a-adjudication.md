# Branch audit — batch 8, part a (Step 14, the structural indexer): adjudication

This file adjudicates batch 8 part a of the branch audit of `claude/context-oracle-vkho4p`:
commits `37ea382` (Step 14 plan fixes raised by its test writer), `6f5ceb8` (skeleton-caller
rows and three plan silences) and `177e59f` (the Step 14 build). Inputs: the first audit
`2026-09-26-branch-audit-B8a.md` (E-1 to E-30: keep 7, replace 23) and the second opinion
`2026-09-26-branch-audit-B8a-second-opinion.md` (15 sections). The test applied is the
auditor brief (`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/BRIEF.md`).
The adjudicator made none of the changes and wrote neither review.

Settled and not re-litigated: the B1–B7 verification files and the coordinator rulings of
2026-09-28 (schema checksum; edit-warning timing). The rulings that bear on this part are
batch 3's `generated`-from-ignore ruling (B3 part B E-12) and its ≥ 25 ms inter-chunk yield,
batch 4 item 5 (resolvers), batch 5 ruling 3 (search storage) and ruling 4 (stale-claim
recovery by written comparison), and batch 6 item 5 (spawn wrapper) and item 9 (init order).

**How the work was done.**
- Scratch extractions of `177e59f` and `HEAD` (`e1a2484`) in the adjudicator's own scratch
  folder `adjb8a/`, made with `git archive <commit> middleware/context-oracle/ctxoracle | tar -x -C <scratch>`.
  This checkout's `ctxoracle/node_modules` was symlinked in, and each tree was built with
  `npx tsc -p tsconfig.json`. Every run below has every `GIT_*` variable unset.
- Planted faults use the adjudicator's own `adjb8a/mut.py`. It copies a built tree and
  replaces exactly one string in one `dist/src` file, refusing when the string does not occur
  exactly once. It then runs the named compiled tests. KILLED means a non-`# TODO` subtest failed.
- Throwaway git repositories were made in `adjb8a/` with git 2.43.0 and Node v22.22.2.
- Web sources were fetched with `curl` and each quote was checked with `webquote.py`, exit 0:
  git `setup.c` and `Documentation/gitignore.txt` at `v2.43.0`, and GitHub Linguist's
  `lib/linguist/vendor.yml`.
- No repository file other than this one was edited, and git state was not changed.

**Coordinator-verified facts used here.**
- A `.git` holding only `HEAD` makes `git ls-files` exit 128.
- git 2.43.0 rejects a gitfile of the form `gitdir: <path>` followed by a second line.
  It reads the path through the newline, so it prints `fatal: not a git repository: <path>`
  followed by `extra`.

Both were re-run here (E-13).

### E-2
**Ruling:** The second opinion is right, and the keep is overturned. The conflict was real, and `todo` is Node's form for a pending test; the first audit's reasoning (1)–(4) stands. But the hunks do more than mark the subtests `todo`. They tell the Step 14 test writer to run those subtests with "Step 15's `defaultFrontends(tuning)`", and at Step 14 that export has a different signature. The only way to follow that text is a cast. The cast makes each subtest fail on a `TypeError` inside `defaultFrontends`, never on its "Fails when" clause. By the plan's own red-state rule, that red state does not count. The subtests therefore never showed that they fail for the right reason before Step 15 made them pass. The first audit found the `TypeError` (E-25, E-28) but charged it only to the test files. The plan text dictated it, so the plan hunks are the source and must change too. This is an engineering decision.
**Evidence:**
- The hunk dictates the call for Step 15's retirement [[middleware/context-oracle/docs/plans/plan-phase-a.md@37ea382:L4037-L4038]] "`todo` option removed and must pass at this step with `runIndex` given Step 15's `defaultFrontends(tuning)`" and for Step 14's own run [[middleware/context-oracle/docs/plans/plan-phase-a.md@37ea382:L11590-L11592]] "`runIndex` with an empty frontend list at Step 14 — D-plan-29 — and with Step 15's `defaultFrontends(tuning)` for the subtests Step 15 retires)."
- At Step 14 the export takes other arguments [[middleware/context-oracle/ctxoracle/src/index/frontends.ts@177e59f:L13]] "export function defaultFrontends(global: Store, diagnosticsDir: string): LanguageFrontend[] {" so the test casts it [[middleware/context-oracle/ctxoracle/test/unit/indexer_walk.test.ts@177e59f:L56]] "const defaultFrontendsFromTuning = defaultFrontends as unknown as (tuning: TuningReader) => LanguageFrontend[];"
- [[ran]] `node --test dist/test/unit/indexer_walk.test.js` (adjudicator's `177e59f` build) → `not ok 7 - T-14-3 (Step 15): test_map holds the import_edge rows of the TypeScript and Python test files # TODO needs Step 15 frontends; retired by Step 15` / `error: 'store.prepare is not a function'` / `name: 'TypeError'` / `defaultFrontends (…/dist/src/index/frontends.js:7:10)`; `not ok 8 - T-14-3 (Step 15): src/k.ts has symbols rows before its deletion # TODO …` fails the same way.
- The red-state rule [[middleware/context-oracle/docs/plans/plan-phase-a.md@37ea382:L1044-L1047]] "3. *The red state counts only for the named reason.* A test over a stubbed export must fail at run time on that stub's `not implemented: <name>` error; a test over an export the skeleton already has must fail on its \"Fails when\" clause."
- D-plan-29's reason [[middleware/context-oracle/docs/plans/plan-phase-a.md@37ea382:L8023-L8025]] "input of the indexer, not something it hard-wires; and a step consumes only what exists when it is built (output-contract item 7, D-plan-1), which an indexer that names a module two steps later violates."
- Node's meaning of `todo` [[https://nodejs.org/docs/latest-v22.x/api/test.html]] "TODO tests are executed, but are not treated as test failures, and therefore do not affect the process exit code."
**Final verdict:** replace.
**Correction:**
- Keep the split between Step 14 and Step 15 clauses (h21, h23–h25, h27) and the retirement guard in `T-37-1`.
- Move the clauses that depend on frontends (the `import_edge` `test_map` rows, the `symbols` precondition for `src/k.ts`, and T-14-5's symbol hits) into Step 15's own test specifications over the same fixtures. Their red state is then Step 15's stubbed `defaultFrontends(tuning)` failing with `not implemented`, or their own "Fails when" clause, as rule 3 requires.
- Drop "with Step 15's `defaultFrontends(tuning)`" from Step 14's Level fields.
- h22's nongit sentence is untouched (E-1 governs it).
**Still at HEAD:**
- The `todo` marks are retired, and the subtests now run on Step 15's real `defaultFrontends(tuning)`: [[middleware/context-oracle/ctxoracle/test/unit/indexer_walk.test.ts@HEAD:L9]] "// Step 15 subtests (their `todo` marks retired by Step 15): the assertions". So the wrong red state no longer affects the suite.
- The plan text that dictated it is unchanged: [[middleware/context-oracle/docs/plans/plan-phase-a.md@HEAD:L4355-L4356]] "`todo` option removed and must pass at this step with `runIndex` given Step 15's `defaultFrontends(tuning)` (Step 14 test writer, 2026-09-26)."
- No executed evidence shows that these clauses were ever red for their own reason.
**Owner question:** none.

### E-3
**Ruling:** The second opinion is right, and the keep is overturned narrowly.
- The two exports and the owner-conditional release inside one transaction are correct, and they fill a real gap (first audit reasoning (1), (2)).
- The declared acquire result carries the holder's pid but not its start time. The plan requires every refusal surface to report "when it started": the `index` verb (L5714), `init` (L6127–L6130) and the fault.
- Only the start time read inside acquire's `BEGIN IMMEDIATE` belongs to the holder whose liveness was checked. The declared type drops it, so every caller must read `reindex_started_at` again after the transaction has ended.
- The holder deletes that row on release. A reclaiming process rewrites it with its own time.
- So each second read can return nothing, or another run's time. The build does exactly this: `runIndex` for the fault, then both verbs.
- The first audit's reasoning (3) says `ownerPid` is enough for the fault detail. It is not, because the fault's `startedAt` comes from the same unguarded read.
- This is an engineering decision.

**Evidence:**
- The declared result [[middleware/context-oracle/docs/plans/plan-phase-a.md@37ea382:L3768-L3769]] "`acquireReindexClaim(store): {acquired: true} | {acquired: false; ownerPid: number}`: the mutual exclusion `runIndex` takes"
- Acquire reads the owner inside the transaction, and returns without the start time [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@177e59f:L254-L260]] "export function acquireReindexClaim(store: Store): { acquired: true } | { acquired: false; ownerPid: number } { const meta = schemaMetaDao(store); return store.transaction(() => { const owner = Number(meta.get('reindex_owner_pid') ?? '0'); // A live owner — including this process, whose earlier call has not // released — holds the claim; a dead one's claim is taken over. if (Number.isInteger(owner) && owner > 0 && alive(owner)) return { acquired: false as const, ownerPid: owner };"
- The start time is read after that transaction has returned [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@177e59f:L344-L347]] "const claim = acquireReindexClaim(store); if (!claim.acquired) { const startedAt = schemaMetaDao(store).get('reindex_started_at') ?? null; recordFault(store, opts.diagnosticsDir, { code: 'reindex_locked', detail: { ownerPid: claim.ownerPid, startedAt } });"
- The holder's release deletes it [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@177e59f:L270-L272]] "if (meta.get('reindex_owner_pid') !== String(process.pid)) return; meta.delete('reindex_owner_pid'); meta.delete('reindex_started_at');"
- A reclaim writes a new one [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@177e59f:L261-L262]] "meta.set('reindex_owner_pid', String(process.pid)); meta.set('reindex_started_at', String(Date.now()));"
- Derivation:
  1. Acquire's transaction commits at L264.
  2. Between that commit and L346, the holder's `finally` may run L270–L272, or a stale-claim takeover may run L261–L262. Both are separate processes with their own transactions.
  3. L346's read then returns `null` or the new holder's time.
  4. The fault records that value, and the `index` and `init` verbs repeat the same read later again (E-12, E-14).
**Final verdict:** replace.
**Correction:**
- Declare `acquireReindexClaim(store): {acquired: true} | {acquired: false; ownerPid: number; startedAt: number | null}`.
- Read `startedAt` in the same `BEGIN IMMEDIATE` as the liveness check.
- Keep the owner-conditional release as written.
- The missing test of that release (a planted unconditional release survives at `177e59f`) belongs to T-14-1 (E-7, E-23), not to this hunk.
**Still at HEAD:** yes. The unchanged type [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@HEAD:L355]] "export function acquireReindexClaim(store: Store): { acquired: true } | { acquired: false; ownerPid: number } {" and the re-read [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@HEAD:L477]] "const startedAt = schemaMetaDao(store).get('reindex_started_at') ?? null;"
**Owner question:** none.

### E-4
**Ruling:** The second opinion is right, and the keep is overturned. The tagged result, the replay-harness throw and exit 75 stand, backed as the first audit says; sysexits.h was re-checked. But the same hunks require the `index` verb, and `init` (h17), to print when the holder started. `{refused: 'reindex_locked'}` gives them nothing to print it from, so the verbs must re-read a row another process owns (the E-3 derivation). The first audit's own E-14 says that "the `{refused}` result shape in the plan (E-4) would gain the two fields". A unit that must change is not a keep. This is an engineering decision.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@37ea382:L3657-L3661]] "Promise<IndexResult | {refused: 'reindex_locked'}>` (async — G14). It first takes the reindex claim (`acquireReindexClaim`, below); when the claim is held by a live process it records the `reindex_locked` fault (through `recordFault(store, diagnosticsDir, …)`) and resolves to `{refused: 'reindex_locked'}` instead of an `IndexResult`"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@37ea382:L5714]] "on `{refused: 'reindex_locked'}` it prints, in plain language, that another index run is in progress and when it started, changes nothing, and exits 75"
- The verb's resulting re-read [[middleware/context-oracle/ctxoracle/src/cli/index.ts@177e59f:L34-L35]] "const started = Number(schemaMetaDao(r.project).get('reindex_started_at') ?? NaN); const when = Number.isFinite(started) ? ` (started ${new Date(started).toISOString()})` : '';"
- [[ran]] `grep -n "EX_TEMPFAIL" /usr/include/sysexits.h` → `80: *	EX_TEMPFAIL -- temporary failure, indicating something that` / `107:#define EX_TEMPFAIL	75	/* temp failure; user is invited to retry */`
**Final verdict:** replace.
**Correction:**
- Make the result `{refused: 'reindex_locked'; ownerPid: number; startedAt: number | null}`, with both values taken from acquire's transaction (E-3).
- `runIndex` records the fault from those values. The `index` verb prints from the result and never reads `schema_meta` again.
- The harness throw and exit 75 stay.
- `init`'s handling of a refusal is E-5's (first audit, `replace`, not re-ruled).
**Still at HEAD:** yes. [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@HEAD:L114]] "export type RunIndexResult = IndexResult | { refused: 'reindex_locked' };" and [[middleware/context-oracle/ctxoracle/src/cli/index.ts@HEAD:L36]] "const started = Number(schemaMetaDao(r.project).get('reindex_started_at') ?? NaN);"
**Owner question:** none.

### E-18
**Ruling:** The second opinion is right, and the keep is overturned.
- The wrapper does what the §9 row says and changes nothing else. The first audit is right on that.
- Being faithful to the row does not make the declaration true.
- The indexer copies `capabilities.symbols` into `lang_capabilities` for every language the generic frontend handles. At this commit that is every grammar except the four with a skeleton query. Go and C are among them.
- The skeleton's patterns have no Go `func` or C function-definition form. So a Go file and a C file index to zero symbols, while the record says `symbols: true`.
- `capabilities` exists to keep "observed zero" apart from "never counted". Here a never-counted zero is recorded as an observed zero.
- The first audit held the tree-sitter stand-in to this standard in E-16 but did not apply it here. Its "Would be wrong if" ("the skeleton's regexes do attempt") is false for these languages.
- The §9 row that prescribes `{symbols: true}` carries the same defect.
- This is an engineering decision.
**Evidence:**
- [[middleware/context-oracle/ctxoracle/src/index/generic_frontend.ts@177e59f:L19-L22]] "export const genericFrontend: LanguageFrontend = { lang: '*', capabilities: { symbols: true, imports: false }, async init() {},"
- The purpose [[middleware/context-oracle/ctxoracle/src/index/frontend.ts@177e59f:L6-L8]] "// - `capabilities` is the frontend's declaration per language (AD-12, G13): //   recorded per language in `schema_meta.lang_capabilities` and shown in //   `status`, so \"observed zero\" is told apart from \"never counted\"."
- The copy into the record [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@177e59f:L735-L737]] "caps[r.lang] = { frontend: fe === undefined ? 'path-only' : fe.lang === '*' ? 'generic' : 'tree-sitter', symbols: fe?.capabilities.symbols ?? false,"
- Only four grammars have a query [[middleware/context-oracle/ctxoracle/src/index/tree_sitter_frontend.ts@177e59f:L41-L46]] "export const QUERIES: Record<string, string> = { typescript: TS_QUERY, tsx: TS_QUERY, javascript: JS_QUERY, python: PY_QUERY, };" while the table maps [[middleware/context-oracle/ctxoracle/src/stores/dao/tuning_seeds.ts@177e59f:L76]] "['.go', 'go'],"
- The row [[middleware/context-oracle/docs/plans/plan-phase-a.md@6f5ceb8:L7319]] "`capabilities` (`{symbols: true, imports: false}` for generic; the tree-sitter one's declared capability)"
- [[ran]] `node gocap.mjs 177e59f <gorepo>; node gocap.mjs HEAD <gorepo>` (a git repository with `a.go` = `func Foo() int` and `m.c` = `int main(void)`, indexed with the default frontends) → `177e59f symbols 0` / `177e59f go {"frontend":"generic","symbols":true,"imports":false,"resolved":0,"unresolved":0,"files":1} c {"frontend":"generic","symbols":true,"imports":false,"resolved":0,"unresolved":0,"files":1}` / `HEAD symbols 2` / `HEAD go {"frontend":"tree-sitter",…} c {"frontend":"tree-sitter",…}`
**Final verdict:** replace.
**Correction:**
- The stand-in and its §9 row declare only what the patterns cover.
- Two forms are acceptable: a per-language `symbols` value (true only where a skeleton pattern applies), or a distinct `heuristic` or `generic` marker in `lang_capabilities` that `status` renders as "not counted by a grammar".
- The first audit's "Would be wrong if" is withdrawn.
**Still at HEAD:**
- The stand-in is retired. Go and C are `tree-sitter` at `HEAD` (run above).
- The same pattern remains in Step 15's generic frontend for the grammars `HEAD` gives no query.
- [[ran]] `node q.mjs` (HEAD build: seeded `index.ext_to_grammar` grammars minus `QUERIES` keys) → `grammars 31 without query css,embedded_template,html,json,toml,vue`.
- [[ran]] `node cap2.mjs HEAD <repo with a.css, b.toml>` → `HEAD symbols 0` / `HEAD {"css":{"frontend":"generic","symbols":true,…},"toml":{"frontend":"generic","symbols":true,…}}`.
- Whether that is the same defect in Step 15's code is for the Step 15 audit. It is recorded here as an observed fact and is not ruled on.
**Owner question:** none.

### E-13
**Ruling:** The replace stands. The first audit found the core defect: a `.git` file that git rejects is read as "no repository", and the tree then goes to the `readdir` walk with nothing recorded. That was re-executed here at both commits. The second opinion's three corrections all hold against git 2.43.0's `setup.c`, and the correction is ruled as follows.
1. **Stat failures.** git itself treats any failed `stat` of `.git` as "no gitfile here" and carries on. Only errors after a successful stat make discovery fail. So the first audit's "only ENOENT is absent" is not git's reference behaviour. Its stated standard does not back that half of the fix.
   - git's own source marks the lumping as a known gap ("NEEDSWORK: discern between ENOENT vs other errors"). Copying a behaviour the reference itself flags as deficient is the "matching a bad pattern" failure.
   - So the correction adopts fail-fast on its own backing (Shore 2004, the brief): ENOENT/ENOTDIR are "absent"; any other stat error is reported.
2. **The bound.** git's gitfile limit is 1 MiB, refused as "too large". The first audit's "`PATH_MAX` plus prefix" is its own number, not the reference's. The defect the first audit names does exist: a longer file is silently truncated to 4096 bytes, not refused.
3. **The format (missed by the first audit).** The pointer regex is multiline and allows any whitespace after `gitdir:`, so it takes a `gitdir:` line anywhere in the file. git requires the file to start with `gitdir: `. It strips only trailing CR/LF, and it takes the rest, internal newlines included, as the path.
   - Both two-line forms are accepted by `readGitPointer`. On the event path `resolveHead` then returns a commit for a checkout git refuses.
   - On the message: the coordinator's observed text is right for `gitdir: <path>` followed by `extra`. git reads the path through the newline and prints `fatal: not a git repository: <path>` then `extra`.
   - The second opinion's own case began with `junk`. For that case git 2.43.0 does print `invalid gitfile format`, re-run below. Each message is right for its own input, and both exit 128.

This is an engineering decision.
**Evidence:**
- The parse [[middleware/context-oracle/ctxoracle/src/identity/git_layout.ts@177e59f:L66-L71]] "if (!st.isFile()) return null; const text = readBounded(dotGit, POINTER_MAX_BYTES); if (text === null) return null; const m = /^gitdir:[ \t]*(.+?)[ \t]*$/m.exec(text); if (m === null) return null; const gitDir = path.resolve(dir, m[1] as string);" and the stat catch [[middleware/context-oracle/ctxoracle/src/identity/git_layout.ts@177e59f:L57-L62]] "let st; try { st = statSync(dotGit); } catch { return null; }" and the bound [[middleware/context-oracle/ctxoracle/src/identity/git_layout.ts@177e59f:L21]] "const POINTER_MAX_BYTES = 4096;"
- git 2.43.0 `read_gitfile_gently`:
  - [[https://raw.githubusercontent.com/git/git/v2.43.0/setup.c]] "const int max_file_size = 1 << 20;  /* 1MB */"
  - [[https://raw.githubusercontent.com/git/git/v2.43.0/setup.c]] "error_code = READ_GITFILE_ERR_TOO_LARGE;"
  - [[https://raw.githubusercontent.com/git/git/v2.43.0/setup.c]] "NEEDSWORK: discern between ENOENT vs other errors"
  - [[https://raw.githubusercontent.com/git/git/v2.43.0/setup.c]] "error_code = READ_GITFILE_ERR_STAT_FAILED;"
  - [[https://raw.githubusercontent.com/git/git/v2.43.0/setup.c]] "if (!starts_with(buf, \"gitdir: \"))"
  - [[https://raw.githubusercontent.com/git/git/v2.43.0/setup.c]] "while (buf[len - 1] == '\n' || buf[len - 1] == '\r')"
  - [[https://raw.githubusercontent.com/git/git/v2.43.0/setup.c]] "error_code = READ_GITFILE_ERR_NOT_A_REPO;"
- git 2.43.0 discovery:
  - [[https://raw.githubusercontent.com/git/git/v2.43.0/setup.c]] "} else if (error_code != READ_GITFILE_ERR_STAT_FAILED)"
  - [[https://raw.githubusercontent.com/git/git/v2.43.0/setup.c]] "return GIT_DIR_INVALID_GITFILE;"
- [[ran]] In `adjb8a/gl/`: `real` is a one-commit repository. `w2/.git` = `junk` then `gitdir: <real>/.git`. `w3/.git` = `garbage` plus `w3/a.txt`. `w4/.git` = `gitdir: <real>/.git` then `extra`. `w5/.git` = `gitdir: <real>/.git`. The command was `cd <w>; GIT_CEILING_DIRECTORIES=<gl> git rev-parse --git-dir` →
  - `w2`: `fatal: invalid gitfile format: …/gl/w2/.git` / `exit 128`
  - `w3`: `fatal: invalid gitfile format: …/gl/w3/.git` / `exit 128`
  - `w4`: `fatal: not a git repository: …/gl/real/.git` / `extra` / `exit 128`
  - `w5`: `…/gl/real/.git` / `exit 0`
- [[ran]] `node gl.mjs` (`readGitPointer` kind, `resolveHead`, `walkRepository` on both builds) →
  - `177e59f w2 "file" {"commit":"575c26de67dc24d4209393cf38063213e890ff9f"} throws: git ls-files failed (exit 128): fatal: invalid gitfile format: <S>/gl/w2/.git`
  - `177e59f w3 null {"unresolved":"no git directory at the checkout root"} readdir [".git","a.txt"]`
  - `177e59f w4 "file" {"commit":"575c26de67dc24d4209393cf38063213e890ff9f"} throws: git ls-files failed (exit 128): fatal: not a git repository: <S>/gl/real/.git`
  - The three `HEAD` lines are identical.
- The coordinator-verified fact bears on E-1, which is unchanged: [[ran]] `mkdir -p h1/.git; echo 'ref: refs/heads/main' > h1/.git/HEAD; cd h1; GIT_CEILING_DIRECTORIES=<gl> git ls-files -z --cached --others --exclude-standard` → `fatal: not a git repository (or any of the parent directories): .git` / `exit 128`.
**Final verdict:** replace.
**Correction:**
- Read a `.git` file as git 2.43.0 does. Refuse any file over 1 MiB; never truncate it. The file must start with `gitdir: `. Strip only trailing CR/LF, resolve a relative path against the file's directory, and apply `is_git_directory` (HEAD, `objects/`, `refs/`) to the target.
- Return a distinct invalid result, never `null`, for each of these: an unopenable file, an unreadable file, a malformed file, a file with no path, a file that is too large, and a target that is not a git directory. `resolveHead` reports it as `head_unresolved`, and the walk refuses it with a fault.
- For the `stat` of `.git`: ENOENT and ENOTDIR mean absent. Any other error is reported. Record why: the reference itself flags lumping them as NEEDSWORK, and the brief's fail-fast standard governs.
- Drop "`PATH_MAX` plus prefix".
**Still at HEAD:** yes, unchanged. [[middleware/context-oracle/ctxoracle/src/identity/git_layout.ts@HEAD:L69]] "const m = /^gitdir:[ \t]*(.+?)[ \t]*$/m.exec(text);" and [[middleware/context-oracle/ctxoracle/src/identity/git_layout.ts@HEAD:L21]] "const POINTER_MAX_BYTES = 4096;"; the `HEAD` runs above match `177e59f`.
**Owner question:** none.

### E-16
**Ruling:** The replace stands, and the second opinion's extension holds. Step 14's own interface text backs it more directly than the second opinion argued.
- **Resolver and capability defects** (first audit). Re-executed: `from .util import x` beside `pkg/util.py` is `unresolved`; `import b` and `from b import y` are never captured; a bare `b` in the repository is `external`; `./a.js` resolves to `a.js` although `a.ts` exists. Each contradicts batch 4 item 5, or declares an import capability the frontend does not deliver.
- **Thrown parses** (extension). Plan Step 14 says a parse failure is a returned value, never a throw, so that the indexer, which holds the store, records `frontend_parse_failed` through `recordFault(store, …)` and it appears in `status`. The stand-in does none of this:
  - it catches the throw itself;
  - it records the fault with `recordFault(null, …)`, so the fault reaches the JSONL mirror only, never the store's `faults` table;
  - it returns the generic frontend's output as `{ok: true}`, so the indexer's own failure path never runs.
- Executed with a planted throw: the file's import edge vanishes, the store holds no fault, and `lang_capabilities` still reads `tree-sitter`, `imports: true`, `resolved 0`, `unresolved 0`, which is a clean-looking observation. This is the fallback-that-hides-a-failure pattern the brief names. It was live at this commit, because the `index` and `init` verbs pass these frontends (first audit's fact on `cli/index.ts` L29).
- **The null check.** web-tree-sitter 0.25.10 declares that `parse` returns `null` only when no language is set or a progress callback cancels. The stand-in sets the language and passes no callback, so its `tree === null` branch cannot fire. That is dead code, not a defect.
- **Syntax errors.** A syntactically broken file returns `{ok: true}` with zero symbols (re-run below). No Step 14 plan line requires `hasError` to be reported, so this adjudication does not rule it a defect.

This is an engineering decision.
**Evidence:**
- Batch 4 item 5 [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B4-verification.md@HEAD:L130-L131]] "TypeScript tries `.ts`/`.tsx`/`.d.ts` before the written `.js`, following the handbook."
- The resolver [[middleware/context-oracle/ctxoracle/src/index/tree_sitter_frontend.ts@177e59f:L61-L62]] "function skeletonResolve(fromPath: string, spec: string, repo: RepoFiles): ImportResolution { if (!spec.startsWith('.')) return { kind: 'external' };" and the Python query [[middleware/context-oracle/ctxoracle/src/index/tree_sitter_frontend.ts@177e59f:L38]] "(import_from_statement module_name: (relative_import) @import)"
- [[ran]] `node ts6.mjs` (the adjudicator's `177e59f` build; repository `{pkg/util.py, pkg/m.py, b.py, src/a.ts, src/a.js, src/m.ts}`) → `[{"specifier":".util","kind":"import"}] {"symbols":true,"imports":true}` / `pkg/m.py .util {"kind":"unresolved"}` / `pkg/m.py b {"kind":"external"}` / `src/m.ts ./a.js {"kind":"resolved","dst":"src/a.js"}` / `syntax-error parse ok true symbols 0`
- Step 14's contract [[middleware/context-oracle/docs/plans/plan-phase-a.md@177e59f:L3569-L3571]] "return promises). A parse failure is a returned value, never a throw, so the indexer — which holds the store — records `frontend_parse_failed` through `recordFault(store, …)` and it appears in `status`."
- The catch [[middleware/context-oracle/ctxoracle/src/index/tree_sitter_frontend.ts@177e59f:L111-L116]] "} catch (e) { // A parser that threw is dead afterwards (probe:20_grammar_inventory): // discard it so the next file gets a fresh instance. parser = null; onParseFailed(lang, path, e); return genericFrontend.parse(path, content);" and its sink [[middleware/context-oracle/ctxoracle/src/index/frontends.ts@177e59f:L20-L22]] "const onFail = (lang: string, path: string, error: unknown): void => recordFault(null, diagnosticsDir, { code: 'frontend_parse_failed',"
- [[ran]] `node pf.mjs 177e59f <tsrepo>; node pf.mjs pf <tsrepo>`. `pf` is a copy of the `177e59f` build with `parser ??= new Parser();` replaced by `throw new Error('planted');`. `<tsrepo>` holds `a.ts`, which imports `./g`, beside `g.ts`, and the diagnostics directory exists. Output →
  - `177e59f symbols 2 import_edges 1` / `177e59f store faults []` / `177e59f jsonl []`
  - `pf symbols 2 import_edges 0` / `pf lang_capabilities {"typescript":{"frontend":"tree-sitter","symbols":true,"imports":true,"resolved":0,"unresolved":0,"files":2}}` / `pf store faults []` / `pf jsonl ["session.jsonl:frontend_parse_failed,frontend_parse_failed"]`
- In an earlier run of the same script, the diagnostics directory did not exist. There the `pf` line read `jsonl []`: the fault was lost entirely, because Step 10's `recordFault` swallows the JSONL error. That behaviour belongs to Step 10's writer, not to this unit.
- web-tree-sitter 0.25.10, `ctxoracle/node_modules/web-tree-sitter/web-tree-sitter.d.ts` L165–L167 (outside the repository tree, read directly, paraphrased): `Parser.parse` returns a `Tree` on success, and returns `null` only when no language was assigned with `setLanguage` or when the progress callback returned true.
**Final verdict:** replace.
**Correction:**
- The stand-in's resolver follows batch 4 item 5: a bare specifier is `unresolved` until Step 15's resolvers, and `.ts`/`.tsx` are tried before the written `.js`.
- Python declares `imports: false`, or captures absolute imports.
- `parse` returns `{ok: false, error}` on any throw, as Step 14's interface says. The indexer then records `frontend_parse_failed` with the store, and `lang_capabilities` does not count the file as a clean tree-sitter parse.
**Still at HEAD:**
- The stand-in is retired.
- At `HEAD` a thrown parse returns `{ok: false}` and reaches the store. [[ran]] The same planted throw in a copy of the `HEAD` build (`pfH`, `defaultFrontends(tuning)`) → `pfH symbols 2 import_edges 0` / `pfH store faults ["frontend_parse_failed","frontend_parse_failed"]`.
- In that run `lang_capabilities` still read `{"typescript":{"frontend":"tree-sitter","symbols":true,"imports":true,"resolved":0,"unresolved":0,"files":2}}` for two files that both fell back to the generic frontend. Judging that belongs to the Step 15 audit; it is recorded here as observed and not ruled.
**Owner question:** none.

### E-9
**Ruling:** The replace stands, and the second opinion's extension holds. The order makes the ignore match a source of `generated`, and puts it first. Its only backing is that T-14-3 expects the result, and a test pinning a rule is never backing. The rule is the one batch 3 replaced (B3 part B E-12). The 2 KB head read stays. Extension, re-executed: at `HEAD` the replaced rule is pinned by T-14-3 and also by the review's `RV-9` and `RV-13`. The correction pass must change all three, not only `zone.ts` and T-14-3. This is an engineering decision (settled by batch 3).
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@6f5ceb8:L3649-L3653]] "**Precedence, first match wins:** `ignoredTracked` membership → the marker comment → the `vendor/`/`node_modules/` segments (`vendored`) → the `dist/`/`build/`/lockfile patterns (`build_output`) → `source` (the Step 14 builder's preflight: T-14-3 expects a tracked `dist/a.js` that matches an ignore pattern to be `generated`, not `build_output`)."
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B3-verification.md@HEAD:L137-L138]] "E-12: record the ignore-pattern signal as such; it does not set `generated` alone."
- [[middleware/context-oracle/ctxoracle/src/index/zone.ts@HEAD:L74]] "if (ignoredTracked) return result('generated', IGNORED_TRACKED_EVIDENCE);"
- [[ran]] `python3 mut.py <tag> Z7 index/zone.js "if (ignoredTracked)…" "if (false)…" <tests>`, which stops the ignore match from setting a zone, as the corrected rule requires →
  - `177e59f`: `KILLED Z7 -- … indexer_walk.test.js: exit 1 pass 6 fail 1 todo 2 FAILED['1 - T-14-3: tracked-and-ignored files are zone generated with the ignore-match evidence; an untracked ignored file is not indexed']`
  - `HEAD`: `KILLED Z7 -- … indexer_review.test.js: exit 1 pass 25 fail 2 todo 0 FAILED['9 - RV-9: zone precedence and signals — ignored-tracked beats the marker, vendored beats build_output, lockfiles, evidence flagged (Z1, Z2, Z5, Z6)', '13 - RV-13: an unchanged file whose ignore status changes is re-recorded with its new zone (I5)'] | … indexer_walk.test.js: exit 1 pass 8 fail 1 todo 0 FAILED['1 - T-14-3: …']`
**Final verdict:** replace.
**Correction:**
- Keep the 2 KB head read.
- Order the zone-setting signals marker → vendored → build_output → source.
- Record the tracked-and-ignored match as its own signal (an evidence field or flag) that never sets `generated` alone.
- Change T-14-3, `RV-9` and `RV-13` so they assert the recorded signal rather than `generated`.
**Still at HEAD:** yes. The code is at `zone.ts` L74, and three tests pin the rule (run above).
**Owner question:** none.

### E-10
**Ruling:** The replace stands, and the second opinion's refinements hold.
1. The parenthesis "the change check git's own index uses" was false on two counts. git compares seven stat fields, not two, and git also refuses to trust a stat match when the file is as new as the index (racy-git). The parenthesis is corrected at `HEAD`.
2. The skip condition the plan states (key and `in_tree`) is too weak, and this is now shown by execution rather than argued. A build keyed exactly as the plan says passes every Step 14 test at `177e59f`, and at `HEAD` it is killed only by the review's `RV-13`.
3. The plan still states that weak condition at `HEAD`. The language, zone and evidence inputs exist only in the code.

The first audit's point that a missed same-size, same-mtime edit leaves only `content_hash` stale (because the zone head is re-read on every run) stands. This is an engineering decision.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@6f5ceb8:L3681-L3685]] "file is skipped:** a byte-cap file is keyed by its `stat` size and mtime (the change check git's own index uses), stored in `files.content_hash` as `stat:<size>:<mtime_ms>`, and a line-cap file by the SHA-256 of the bounded bytes read; when the key and `in_tree = 1` are unchanged the file is not"
- [[https://raw.githubusercontent.com/git/git/v2.43.0/Documentation/technical/racy-git.txt]] "Currently, Git compares the file type (regular files vs symbolic links) and executable bits (only for regular files) from st_mode member, st_mtime and st_ctime timestamps, st_uid, st_gid, st_ino, and st_size members." and [[https://raw.githubusercontent.com/git/git/v2.43.0/Documentation/technical/racy-git.txt]] "When the cached stat information says the file has not been modified, and the st_mtime is the same as (or newer than) the timestamp of the index file itself"
- The build compares more [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@177e59f:L443-L450]] "const unchanged = (key: string, zone: ZoneResult): boolean => !full && prior !== undefined && prior.in_tree === 1 && prior.content_hash === key && prior.lang === lang && prior.zone === zone.zone && prior.zone_evidence === zone.evidence;"
- [[ran]] `python3 mut.py <tag> K1 index/indexer.js "<the lang/zone/evidence comparison>" "true;" <tests>` →
  - `177e59f`: `SURVIVED K1 -- indexer.test.js: exit 0 pass 5 fail 0 todo 0 | indexer_walk.test.js: exit 0 pass 7 fail 0 todo 2 | indexer_stale.test.js: exit 0 pass 6 fail 0 todo 0 | search_semantics.test.js: exit 0 pass 2 fail 0 todo 1`
  - `HEAD`: `KILLED K1 -- … indexer_review.test.js: exit 1 pass 26 fail 1 todo 0 FAILED['13 - RV-13: an unchanged file whose ignore status changes is re-recorded with its new zone (I5)']`
- The parenthesis is fixed at `HEAD` [[middleware/context-oracle/docs/plans/plan-phase-a.md@HEAD:L3818]] "(a size-and-mtime check, a subset of git's own — git also compares ctime" and the condition is not [[middleware/context-oracle/docs/plans/plan-phase-a.md@HEAD:L3821]] "bytes read; when the key and `in_tree = 1` are unchanged the file is not"
**Final verdict:** replace.
**Correction:**
- Keep the skip and the one-fault rule.
- State the skip in the plan as: the key, the language, the zone and its evidence (recomputed from the 2 KB head and the ignore set), and `in_tree = 1` are all unchanged.
- State that a same-size, same-mtime edit leaves only `content_hash` stale.
- The git parenthesis is already corrected.
**Still at HEAD:** partly. The parenthesis is fixed. The plan's skip condition is still missing language, zone and evidence (L3821).
**Owner question:** none.

### E-17
**Ruling:** The replace stands. The second opinion's measurement reproduces in substance, and its demand that the fix state its cost is upheld. One of its words is too strong. Re-executed here:
- **Without a pause**, a concurrent event-path writer fails with `StoreBusy` on 406 of 616 attempts at `177e59f` and on 410 of 552 at `HEAD`.
- **With a 25 ms pause** planted after each chunk transaction, and nothing else changed, there were 3 of 2,310 failures in one run and 0 of 2,430 in a second. That is near zero, not the second opinion's flat "0".
- **The cost** is 98.2 s against 148.4 s for the pass, +51 %. That is consistent with the second opinion's +53 %.
- **The residual failures.** The second run logged every write transaction longer than 90 ms. There was exactly one, a 92 ms chunk from `writeChunked`. `chunk_ms` is a target the do-while loop checks after each write, so it is not a ceiling. The cause of the first run's 3 failures was not established.

Reconciled with batch 3:
- Batch 3 settled a yield of at least 25 ms between miner chunks. It derived this from SQLite's busy-handler attempt times inside the 100 ms `busy_timeout` (0, 1, 3, 8, 18, 33, 53, 78, 100 ms).
- The indexer's `writeChunked` has the same shape, and it contends with the same event-path writer. So batch 3's ruling applies here unchanged, and the measurement above confirms it.
- The derivation also bounds the chunk. The waiter's first try can only land in a gap that opens within about 100 ms of the try starting. So a chunk (or any write transaction in the pass) that runs past about 100 ms can outlast a whole try.
- **Cost derivation.** Each boundary adds the gap g to a chunk of about c ms, so the write phase grows by g/c. At the seeded c = 50 ms and g = 25 ms that is +50 %, matching the measured +51 %.
- Raising c lowers the cost: c = 75 ms gives +33 %. But c can rise only up to the roughly 100 ms bound, so the correction must state the trade with these numbers.

The other defects the first audit named were re-checked and hold:
- the both-tables write under `fts5` (re-run);
- the absent-on-error rule, the loose-ref fall-through, and the missing yield (all at `HEAD`, per the second opinion's runs).
The absent-on-error and loose-ref items were not re-run here; the second opinion's executed results stand for them.

This is an engineering decision.
**Evidence:**
- The chunk loop [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@177e59f:L299-L310]] "function writeChunked<T>(store: Store, items: readonly T[], chunkMs: number, write: (item: T) => void): void { let next = 0; while (next < items.length) { store.transaction(() => { const started = performance.now(); do { write(items[next] as T); next += 1; } while (next < items.length && performance.now() - started < chunkMs); }); } }" and [[middleware/context-oracle/ctxoracle/src/stores/dao/tuning_seeds.ts@177e59f:L58]] "{ key: 'miner.chunk_ms', value: '50', source: 'architecture_default' },"
- Batch 3 [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B3-verification.md@HEAD:L49-L50]] "So a gap of at least 25 ms between miner chunks guarantees an attempt lands in it." and [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B3-verification.md@HEAD:L160]] "Add an inter-chunk yield of at least 25 ms."
- [[ran]] `adjb8a/run.sh`. `<big>` is 20,000 one-line `.ts` files in one commit. `idx.mjs` runs `runIndex` with `[]`, `fts: true` and `busyTimeoutMs: 5000`. `app.mjs` opens the store with `openStore` defaults (100 ms, retry once) and appends one `observed_actions` row every 20 ms until the index ends. `gap` is a copy of the `177e59f` build with `if (next < items.length) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 25);` inserted after each chunk transaction. Output →
  - `177e59f appends ok 210 StoreBusy 406 other 0 ms 98167` / `177e59f index ms 98169 written 20000`
  - `gap appends ok 2307 StoreBusy 3 other 0 ms 148435` / `gap index ms 148436 written 20000`
  - `HEAD appends ok 142 StoreBusy 410 other 0 ms 96959` / `HEAD index ms 96954 written 20000`
- [[ran]] `adjb8a/runI.sh` (the same `gap` run, with every store transaction over 90 ms logged) → `gap appends ok 2430 StoreBusy 0 other 0 ms 152228` / `gap index ms 152217 written 20000` / `gap long transactions (>90 ms) 1` / `gap long 1790609108661 92 index/indexer.js:254:15) < index/indexer.js:506:5)` (`dist` L254 is the `store.transaction` inside `writeChunked`).
- [[ran]] `node fts.mjs <tag> <tsrepo>` (`fts: true`, empty frontend list) → `177e59f fts_state fts5 path_tokens 4 fts_paths 2` / `HEAD fts_state fts5 path_tokens 4 fts_paths 2`; the ruling [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B5-verification.md@HEAD:L121]] "Write fallback tables only under `fts_state = 'fallback'`."
**Final verdict:** replace.
**Correction:** the first audit's list, with the yield item stated as follows.
- Yield at least 25 ms between write transactions of the pass (batch 3).
- Bound every write transaction in the pass, chunked or not, below the waiter's roughly 100 ms first-try window. Check the elapsed time before each write, not after it.
- State the measured cost: about +50 % pass time at `chunk_ms` = 50, from g/c. State the c-versus-cost trade with its ceiling.
- The fix's test is the contention run above, which must show 0 `StoreBusy`.
- Unchanged from the first audit:
  - fallback tables only under `fallback`;
  - a fault, with the rows kept, for any read error other than a vanished file;
  - a fault for an unreadable importer or `package.json`;
  - `unresolved` for a present but unreadable loose ref;
  - the cap's unit stated.
**Still at HEAD:**
- Still present: the missing yield (re-run above: 410 of 552), the both-tables write (re-run), the absent-on-error rule, the loose-ref fall-through, and the silent catches (the last three per the second opinion's runs, not re-run).
- Fixed: the frontend re-parse, the importer re-resolution and the unbounded read (per the first audit).
**Owner question:** none.

### E-21
**Ruling:** The replace stands, and both extensions hold, with one refinement on the backing.
1. At `HEAD` the review's `RV-9` catches a classifier with `vendored` or the lockfile rule disabled; both survive every Step 14 test at `177e59f`. So the test gap the first audit reported is closed at `HEAD`, and its "still present" list must say so.
2. `dist`, `build`, `vendor` and `node_modules` are matched as a directory segment at any depth, with no stated rule. The plan names "path patterns" and "path segments" without saying where they anchor.
   - Established practice does back any-depth matching for some of these names. GitHub Linguist's `vendor.yml` anchors `dist/`, `node_modules/` and `vendors?/` at any depth, and gitignore reads a slash-terminated pattern with no other slash at any level.
   - No source found backs an any-depth `build/`. Linguist has no general `build/` rule. Executed, `src/build/plan.ts` is `build_output`, so Step 18 drops it, at both commits.
   - So the defect is the missing, unsourced rule. The any-depth reading is not wrong for every name.

The marker defect (fixed at `HEAD`), the false lockfile rationale and the unsourced 200-character cut stand as the first audit ruled. This is an engineering decision.
**Evidence:**
- The plan [[middleware/context-oracle/docs/plans/plan-phase-a.md@6f5ceb8:L3646-L3647]] "EDIT`), `dist/`/`build/`/lockfile path patterns, `vendor/`/`node_modules/` path segments, and membership of `walkRepository`'s `ignoredTracked` set"
- The code [[middleware/context-oracle/ctxoracle/src/index/zone.ts@177e59f:L61-L66]] "const segs = path.split('/'); const dirs = segs.slice(0, -1); const vendor = dirs.find((s) => VENDOR_SEGMENTS.has(s)); if (vendor !== undefined) return result('vendored', `path segment ${vendor}/`); const build = dirs.find((s) => BUILD_SEGMENTS.has(s)); if (build !== undefined) return result('build_output', `path segment ${build}/`);"
- Linguist [[https://raw.githubusercontent.com/github-linguist/linguist/main/lib/linguist/vendor.yml]] "- (^|/)dist/" and [[https://raw.githubusercontent.com/github-linguist/linguist/main/lib/linguist/vendor.yml]] "- (^|/)node_modules/" and [[https://raw.githubusercontent.com/github-linguist/linguist/main/lib/linguist/vendor.yml]] "- (^|/)vendors?/". A grep of the fetched file for `build` gives only `(^|/)ace-builds/`, `(^|/)docs?/_?(build|themes?|templates?|static)/` and `(^|/)extjs/builds/`: [[ran]] `grep -n "dist\|build\|node_modules\|vendor" vendor.yml` → `22:- (^|/)dist/` / `45:- (^|/)node_modules/` / `113:- (^|/)vendors?/` / `204:- (^|/)ace-builds/` / `245:- (^|/)docs?/_?(build|themes?|templates?|static)/` / `332:- (^|/)extjs/builds/` (plus two comment lines).
- gitignore [[https://raw.githubusercontent.com/git/git/v2.43.0/Documentation/gitignore.txt]] "match at any level below the `.gitignore` level."
- [[ran]] `node zb.mjs` (`classifyZone(p, 'x\n', false)` on both builds) → `177e59f src/build/plan.ts build_output "path segment build/"` / `177e59f tools/dist/release.ts build_output "path segment dist/"` / `177e59f packages/a/dist/index.js build_output …` / `177e59f lib/vendor/v.js vendored …`; the `HEAD` lines are identical.
- [[ran]] `python3 mut.py <tag> Z3 index/zone.js "if (vendor !== undefined)" "if (false)" <tests>` and `Z5` (`if (LOCKFILES.has(base))` → `if (false)`) →
  - `177e59f`: `SURVIVED Z3 -- indexer.test.js: exit 0 pass 5 fail 0 todo 0 | indexer_walk.test.js: exit 0 pass 7 fail 0 todo 2 | …`, and `SURVIVED Z5` the same.
  - `HEAD`: `KILLED Z3 -- … indexer_review.test.js: exit 1 pass 26 fail 1 todo 0 FAILED['9 - RV-9: zone precedence and signals — ignored-tracked beats the marker, vendored beats build_output, lockfiles, evidence flagged (Z1, Z2, Z5, Z6)']`, and `KILLED Z5` the same.
**Final verdict:** replace.
**Correction:** the first audit's list, plus two items.
- The first audit's list: markers as comment lines (done at `HEAD`), E-9's precedence, a lockfile list that matches its stated rationale, and a sourced or removed evidence cut.
- New: state the anchoring rule with its source. For example: `dist/`, `vendor(s)/` and `node_modules/` at any depth, per Linguist. Then either anchor `build/` (at the root, or beside a package manifest) or record it as an unsourced heuristic with its known false-positive class, `src/build/`.
- New: correct the "still present at `HEAD`" statement. The zone-class test gap is closed by `RV-9`.
**Still at HEAD:**
- Present: the ignore-first rule, the lockfile list and the 200-character cut (first audit), and the any-depth `build/` match (run above; `HEAD` `zone.ts` L53–L54 is unchanged: [[middleware/context-oracle/ctxoracle/src/index/zone.ts@HEAD:L54]] "const BUILD_SEGMENTS = new Set(['dist', 'build']);").
- Fixed: the marker test. Closed: the untested zone classes.
**Owner question:** none.

### E-24
**Ruling:** The replace stands, and both extensions hold, re-executed at both commits.
- **The spec line.** The "spawns nothing" scan is prescribed by T-14-2's own specification text, not merely chosen by the test writer. So the correction changes the spec line as well as the test.
- **The JSONL mirror.** A `refreshIfStale` that writes its `index_stale` mirror to the wrong directory passes every test, at `177e59f` and at `HEAD`. `diagnosticsDir` exists only to say where that mirror goes (E-6).
- **The first audit's two gaps** reproduce:
  - a `refreshIfStale` that runs `walkRepository`, which starts two git subprocesses, passes;
  - a packed-refs scan that ignores the ref name passes.

This is an engineering decision.
**Evidence:**
- The spec [[middleware/context-oracle/docs/plans/plan-phase-a.md@177e59f:L11568-L11571]] "- **Real/doubles.** Real `node:sqlite`; real `git`; no doubles — no child process is expected, and the test establishes that none can be started by an import scan of `dist/src/index/indexer.js` (it imports neither `dist/src/util/spawn.js` nor `child_process` under either spelling, the"
- The transitive path [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@177e59f:L37]] "import { walkRepository } from './walk.js';" and [[middleware/context-oracle/ctxoracle/src/index/walk.ts@177e59f:L16]] "import { oracleRunSync } from '../util/spawn.js';"
- [[ran]] `python3 mut.py <tag> R4 index/indexer.js "<refreshIfStale head>" "<same, with walkRepository(checkoutRoot); first>" <tests>` →
  - `177e59f`: `SURVIVED R4 -- indexer.test.js: exit 0 pass 5 fail 0 todo 0 | indexer_walk.test.js: exit 0 pass 7 fail 0 todo 2 | indexer_stale.test.js: exit 0 pass 6 fail 0 todo 0 | search_semantics.test.js: exit 0 pass 2 fail 0 todo 1`
  - `HEAD`: `SURVIVED R4 -- … indexer_review.test.js: exit 0 pass 27 fail 0 todo 0 | indexer_stale.test.js: exit 0 pass 9 fail 0 todo 0 | …`
- [[ran]] `python3 mut.py <tag> R1 index/indexer.js "return line.slice(sp + 1).trimEnd() === refPath && HASH_LINE.test(hash) ? hash : null;" "return HASH_LINE.test(hash) ? hash : null;" <tests>` → `SURVIVED R1` at `177e59f` and at `HEAD`.
- [[ran]] `python3 mut.py <tag> D1 index/indexer.js "recordFault(store, diagnosticsDir, { code: 'index_stale'" "recordFault(store, diagnosticsDir + '-elsewhere', { code: 'index_stale'" <tests>` → `SURVIVED D1` at `177e59f` and at `HEAD`.
- Unchanged at `HEAD` [[middleware/context-oracle/docs/plans/plan-phase-a.md@HEAD:L11906]] "by an import scan of `dist/src/index/indexer.js` (it imports neither"
**Final verdict:** replace.
**Correction:**
- In T-14-2's specification and in its test, establish "no subprocess" by observing spawns: a preload that throws on every `child_process` entry point while `refreshIfStale` runs. A scan of the transitive import closure is the alternative.
- Pack a second branch with a different hash.
- Assert that the `index_stale` and `head_unresolved` JSONL mirror lands in the passed `diagnosticsDir`.
**Still at HEAD:** yes, all three gaps (runs above).
**Owner question:** none.

### E-12
**Ruling:** Not second-opinioned. It is re-ruled only because a fact verified under E-3 changes its correction, and the verdict does not change. The first audit's reasoning (4) says the fault `runIndex` records "carries `startedAt` read under the refusal". That is false. `runIndex` reads `startedAt` after acquire's transaction has ended, in the same unguarded way the verb does (E-3 evidence). So the notice cannot be repaired by reusing the fault's value. It needs the value from acquire's transaction.
**Evidence:** [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@177e59f:L344-L346]] "const claim = acquireReindexClaim(store); if (!claim.acquired) { const startedAt = schemaMetaDao(store).get('reindex_started_at') ?? null;" and the verb's own re-read [[middleware/context-oracle/ctxoracle/src/cli/init.ts@177e59f:L51]] "const started = Number(schemaMetaDao(r.project).get('reindex_started_at') ?? NaN);"
**Final verdict:** replace (unchanged).
**Correction:**
- As the first audit says: exit 75, and no prediction that the index will be produced.
- Print the holder's pid and start time from the `{refused}` result of E-4. Those values are read inside acquire's `BEGIN IMMEDIATE` (E-3), not taken from the fault and not re-read from `schema_meta`.
**Still at HEAD:** yes. [[middleware/context-oracle/ctxoracle/src/cli/init.ts@HEAD:L53]] "const started = Number(schemaMetaDao(r.project).get('reindex_started_at') ?? NaN);"
**Owner question:** none.

### E-14
**Ruling:** Not second-opinioned. It is re-ruled only because the same verified fact changes its correction; the verdict stands. The first audit's reasoning (3) and its Alternatives treat the fault's `startedAt` as "the value read under the refusal". It is a post-transaction read (E-3), with the same race as the verb's.
**Evidence:** as E-12, and [[middleware/context-oracle/ctxoracle/src/cli/index.ts@177e59f:L34]] "const started = Number(schemaMetaDao(r.project).get('reindex_started_at') ?? NaN);"
**Final verdict:** replace (unchanged).
**Correction:**
- Print from `ownerPid` and `startedAt` in the `{refused}` result (E-4).
- Both values are read in acquire's transaction (E-3).
- The fault records the same values.
**Still at HEAD:** yes (`cli/index.ts` L36, quoted under E-4).
**Owner question:** none.

## Entries not re-ruled

These entries were neither second-opinioned nor changed by a verified fact, or the second opinion agreed with them without changing their correction. Their first-audit verdicts stand as written.
- **E-1** (replace). The coordinator-verified fact, re-run under E-13, confirms it.
- **E-5** (replace). Its "holder pid and start time" now come from E-4's result.
- **E-6** (keep). The second opinion agreed. Its planted misdirected mirror is ruled under E-24.
- **E-7**, **E-8**, **E-11** (replace).
- **E-15** (replace). The second opinion agreed and re-ran it, and noted `hasTopLevelModule` at `HEAD`, whose completeness is not established.
- **E-19**, **E-20** (replace).
- **E-22** (keep). The second opinion agreed.
- **E-23**, **E-25**, **E-26**, **E-27**, **E-28** (replace).
- **E-29** (keep). The second opinion agreed.
- **E-30** (replace).

## Summary

| Entry | First audit | Second opinion | Final verdict | Still at HEAD | Owner question |
|---|---|---|---|---|---|
| E-2 | keep | replace | replace | plan text yes; `todo` marks retired | none |
| E-3 | keep | replace | replace | yes | none |
| E-4 | keep | replace | replace | yes | none |
| E-9 | replace | replace (extended) | replace | yes (code + T-14-3, RV-9, RV-13) | none |
| E-10 | replace | replace (extended) | replace | parenthesis fixed; skip condition in plan not | none |
| E-12 | replace | — | replace (correction amended) | yes | none |
| E-13 | replace | replace (corrected) | replace | yes | none |
| E-14 | replace | — | replace (correction amended) | yes | none |
| E-16 | replace | replace (extended) | replace | stand-in retired; thrown parse reaches the store at HEAD | none |
| E-17 | replace | replace (extended) | replace | yield, both-tables, absent-on-error, loose ref: yes | none |
| E-18 | keep | replace | replace | stand-in retired; same pattern in Step 15's generic frontend (not ruled) | none |
| E-21 | replace | replace (extended) | replace | ignore-first, lockfiles, cut, any-depth `build/`: yes; marker fixed | none |
| E-24 | replace | replace (extended) | replace | yes, all three gaps | none |

**Counts, recounted from the sections above:**
- 13 entries are ruled in this file: E-2, E-3, E-4, E-9, E-10, E-12, E-13, E-14, E-16, E-17, E-18, E-21, E-24.
- All 13 are final `replace`. None is keep, remove or undetermined.
- The four overturns (E-2, E-3, E-4, E-18) are upheld.
- The seven extensions (E-9, E-10, E-13, E-16, E-17, E-21, E-24) are upheld, with two qualifications:
  - E-13: the "invalid gitfile format" message is right only for a file that does not begin with `gitdir: `. A trailing second line gives the coordinator's observed `not a git repository: <path>` / `extra`.
  - E-17: the planted 25 ms pause took `StoreBusy` to 3 of 2,310 and 0 of 2,430 across two runs, not a flat 0. The cost is +51 % here.
- E-12 and E-14 have amended corrections.
- 17 entries are not re-ruled.
- Batch 8a overall (E-1 to E-30), with the first audit's verdicts for the entries not re-ruled: keep 3 (E-6, E-22, E-29), replace 27, remove 0, undetermined 0.
