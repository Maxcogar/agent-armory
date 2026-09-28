# Branch audit — batch B4, part 1: adjudication

Adjudication of `2026-09-26-branch-audit-B4-part1.md` (first audit, Fable 5.1, E-1 … E-17; commit `2331baf`, plan hunks h1–h117) against `…-B4-part1-second-opinion.md` (Opus; E-1, E-4–E-10, E-12–E-17). The adjudicator made none of the changes and wrote neither review. The test applied is the brief's test for an acceptable decision (`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/BRIEF.md`). Batches 1–3 are settled (`…-B1-verification.md`, `…-B2-verification.md`, `…-B3-verification.md`) and are built on, not re-argued. Every repo quote below was printed from `git show <rev>:<path>` at the cited lines; every web quote was checked with `webquote.py` (exit 0); every `[[ran]]` result was executed here on Node v22.22.2, git 2.43.0, TypeScript 5.9.3 (from `ctxoracle/node_modules`). The coordinator's verified fact is taken as given: `new DatabaseSync('file:<p>?mode=rw')` fails with errcode 14 identically for a missing file, a missing directory and a directory path.

### E-1
**Ruling:** Both auditors: keep. No difference to rule on. The header and the §3 authority line are true of the documents (the two architecture commits of 2026-09-26 are `0fab6d7` and `ec3b057`; the commit changes only the plan; §14.5 has a row for every gap-list item, G29 inside the `G23/G29` row). No new fact changes this.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L5-L9]] "revised twice on 2026-09-26 by the skeleton-gap-list pass — commits `0fab6d7` and `ec3b057`)"
- [[ran]] `git show --stat 2331baf | tail -1` → ` 1 file changed, 3420 insertions(+), 685 deletions(-)`
**Final verdict:** keep
**Correction:** none.
**Owner question:** none.

### E-2
**Ruling:** Not second-opinioned. No verified fact in this adjudication changes it. The first audit's `replace` (h5 and h6 must state the ≥ 25 ms inter-chunk yield batch 3 ruled AD-26 must add) stands; no re-ruling.
**Evidence:**
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B3-verification.md@HEAD:L159-L160]] "2. **AD-26 and the miner.** - Add an inter-chunk yield of at least 25 ms."
**Final verdict:** replace (as the first audit states it)
**Correction:** as the first audit: state the miner's chunking as chunks separated by the ≥ 25 ms inter-chunk yield.
**Owner question:** none.

### E-3
**Ruling:** Not second-opinioned. No verified fact in this adjudication changes it. The first audit's `replace` (add the source for the interface segregation principle) stands; no re-ruling.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L346-L347]] "the interface segregation principle (a component receives the narrow reader it uses, never the store behind it) — Step 12 (G8, G17)."
**Final verdict:** replace (as the first audit states it)
**Correction:** as the first audit: name the source (Martin, *Agile Software Development: Principles, Patterns, and Practices*, 2002, ch. 12, or the 1996 C++ Report article).
**Owner question:** none.

### E-4
**Ruling:** Verdict: both say keep, and keep is right. The 46 rows lie inside the generated region and the generator, re-run here on a checkout of `2331baf`, reports the regions current, so each row is exactly what the declarations produce; the brief judges generated regions through their declarations. Reasoning step (3) of the first audit is false as written: "a `modify` row for `generate.ts` on every consuming step" is not what the table shows. Step 29 consumes `coupling-nonobvious` (T-29-1) and declares `modify: []`; Steps 31 and 32 consume `pristine-tree` (T-31-1, T-32-1) and declare only `dispatch.ts`. The §5.1 row lists S13, S14, S15, S18, S28, S30 and S38 only. The second opinion is right on step (3). The defect is in the wording of Step 1's rule (c), which is E-7's unit, not in the generated table, so the verdict is unchanged.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L492]] "<!-- generated:files begin -->"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L825]] "<!-- generated:files end -->"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L643]] "| middleware/context-oracle/ctxoracle/test/fixtures/generate.ts | modify | S13, S14, S15, S18, S28, S30, S38 |"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L5136]] "modify: []"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L11146]] "- **Data.** A fixture hook stream on `coupling-nonobvious` replayed with"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L5392]] "modify: [middleware/context-oracle/ctxoracle/src/cli/dispatch.ts]"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L5522]] "**Verification.** `T-31-1` (fresh `pristine-tree` repo with and without a"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L5545]] "modify: [middleware/context-oracle/ctxoracle/src/cli/dispatch.ts]"
- [[ran]] `git archive 2331baf middleware/context-oracle/docs/plans middleware/context-oracle/.claude/skills/expert-plan | tar -x -C <scratch>` then, in `<scratch>/middleware/context-oracle`, `node .claude/skills/expert-plan/scripts/derive-plan-sections.mjs --check docs/plans/plan-phase-a.md` → `OK: 40 steps, 13 elements, 156 test specs, 27 probes cited, regions current`, exit 0
**Final verdict:** keep
**Correction:** none to the table. The first audit's reasoning step (3) is corrected on this record: the `generate.ts` row shows the steps that build fixtures out, not every step that consumes one. The rule wording is corrected under E-7.
**Owner question:** none.

### E-5
**Ruling:** The second opinion's `replace` is accepted over the first audit's `keep`.
(1) *The Django citation backs a neighbouring practice (brief test 4).* Django's squashing guide describes producing new migrations "which still represent the same changes" and tells the reader to "leave the old ones in place" until every instance has applied them. That is a procedure for consolidating migrations while keeping deployed databases valid. The plan's change edits an applied migration to a different schema and removes nothing. The quote does not back that operation; both guides were fetched here and read in context (Django's sentence sits inside the `squashmigrations` procedure for existing installs).
(2) *The practice that governs is Rails' editing rule, and it does not back the plan unconditionally.* The Rails guide: once run, "Rails thinks it has already run the migration and so will do nothing"; editing a migration "already committed to source control is not a good idea"; the exception is one that "has not been propagated beyond your development machine". Migration 001 was added in `4dd0f00` (2026-09-19) and is an ancestor of the merged base `de66831`, so it has been committed and propagated. In-place editing therefore rests entirely on the premise that no database anywhere ran the old migration. That premise is checkable only on machines the agents can see (the gap-list runs used a temporary `CTXORACLE_HOME`; `~/.ctxoracle` is absent here; no settings file in history names `ctxoracle`). The first audit itself says so in its "Would be wrong if". A premise that cannot be established must fail visibly if false.
(3) *A false premise fails silently under the plan as written.* The runner returns at `schema_version >= 1` and writes `'1'` for both the old and the edited schema (`migration_runner.ts` L60, L74; `applyGlobal` L79, L82 likewise). The plan keeps the runner unchanged (L2210) and elsewhere claims the runner "re-validates `schema_version` on open" (L7567), which cannot detect a same-numbered schema. A store built from the old 001/001b/002 would be taken as current and run under code expecting the new shapes: some failures would be loud at an arbitrary point (`no such column`), others silent (the old cascading `cochange_pairs`, the one-token `fts_paths`). The same identical version defeats the `schema_version` refusal batch 3 part B E-10 requires of `import`. This is the fail-fast case in the brief: a premise nobody can fully check, with no diagnosis when it is wrong.
(4) The reopening, its ordering before Step 13, the delta list and the reworded tail are all true and stand.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L920-L924]] "No store has shipped to any user (the skeleton ran only against scratch and this repository's own throwaway stores), so migrations 001, 001b, and 002 are **edited in place**, not superseded by forward migrations; AD-25's forward-only rule governs shipped stores (the gap-list review's G16 decision states the same reasoning for 001b)."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L2210]] "The runner (`applyMigrations`) is unchanged."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L7567]] "migration runner re-validates `schema_version` on open. The ordering"
- [[middleware/context-oracle/ctxoracle/src/stores/migration_runner.ts@2331baf:L8]] "// Forward-only: an already-migrated store (version >= 1) is left untouched, so a"
- [[middleware/context-oracle/ctxoracle/src/stores/migration_runner.ts@2331baf:L11]] "// wrong fts_state is deinit --purge + init, AD-25/Q7)."
- [[middleware/context-oracle/ctxoracle/src/stores/migration_runner.ts@2331baf:L60]] "if (currentVersion(store, 'schema_meta') >= 1) return; // forward-only"
- [[middleware/context-oracle/ctxoracle/src/stores/migration_runner.ts@2331baf:L74]] "store.prepare(\"INSERT OR REPLACE INTO schema_meta(key, value) VALUES('schema_version', '1')\").run();"
- [[middleware/context-oracle/ctxoracle/src/stores/migration_runner.ts@2331baf:L79]] "if (currentVersion(store, 'global_meta') >= 1) return; // forward-only"
- [[middleware/context-oracle/ctxoracle/src/stores/migration_runner.ts@2331baf:L82]] "store.prepare(\"INSERT OR REPLACE INTO global_meta(key, value) VALUES('schema_version', '1')\").run();"
- [[middleware/context-oracle/docs/reviews/2026-09-25-skeleton-gap-list-review.md@2331baf:L22-L25]] "the real `dist/src/cli/dispatch.js` binary with `CTXORACLE_HOME` pointed at a temp dir) on throwaway git repositories created for the purpose."
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B3b.md@HEAD:L206]] "add the `repo_key`/`schema_version` check the finding named, or reject it on the record."
- [[https://docs.djangoproject.com/en/5.1/topics/migrations/]] "Squashing is the act of reducing an existing set of many migrations down to one (or sometimes a few) migrations which still represent the same changes."
- [[https://docs.djangoproject.com/en/5.1/topics/migrations/]] "You should commit this migration but leave the old ones in place"
- [[https://guides.rubyonrails.org/active_record_migrations.html]] "Rails thinks it has already run the migration and so will do nothing when you run bin/rails db:migrate"
- [[https://guides.rubyonrails.org/active_record_migrations.html]] "In general, editing existing migrations that have been already committed to source control is not a good idea."
- [[https://guides.rubyonrails.org/active_record_migrations.html]] "has not been propagated beyond your development machine"
- [[ran]] `python3 webquote.py <url> "<quote>"` for each of the five quotes above → exit 0 each
- [[ran]] `git log --diff-filter=A --format=%h -- middleware/context-oracle/ctxoracle/src/stores/migrations/001_phase_a_project.sql | tail -1` → `4dd0f00`; `git merge-base --is-ancestor 4dd0f00 de66831; echo $?` → `0`; `git log --format='%h %ci' -1 4dd0f00` → `4dd0f00 2026-09-19 16:38:07 +0000`
- [[ran]] `test -e ~/.ctxoracle; echo $?` → `1`
**Final verdict:** replace
**Correction:** Keep the reopening, the per-step delta list, the Checkpoint 1R ordering, the reworded tail and the in-place edit of 001, 001b and 002. In §6: replace the squashing citation with the Rails editing criterion (a migration may be edited only while it has not been propagated beyond machines whose databases are known) plus the executed checks that establish the premise here (temporary `CTXORACLE_HOME` in the gap-list runs; no `~/.ctxoracle`; no settings file naming `ctxoracle`), and state that the premise is unverifiable off these machines. Make a store from before the edit fail visibly: the edited migrations record a new `schema_version` value (or a schema fingerprint in `schema_meta`/`global_meta`), and the runner refuses a store whose recorded version is below the current one with a fault naming the recovery it already documents (`deinit --purge` + `init`); the `import` validation batch 3 part B E-10 requires uses the same value. Consequently the sentence "The runner (`applyMigrations`) is unchanged" (L2210, hunk h102, E-13's unit) and the claim at L7567 are corrected with it.
**Owner question:** Has Max Cogar run `ctxoracle init` on any machine of his before this correction lands? If yes, a store exists off the agents' machines, the in-place edit would destroy human-entered rows (`corrections`, `lessons`, `human_stated` landmines) on `deinit --purge`, and a forward migration is required instead. If no, the in-place edit with the version guard stands.

### E-6
**Ruling:** Verdict: both `replace`; the correction stands. The central factual claim differs and the second opinion is right on it. Reproduced here with the project's compiler options and a `"type": "module"` package: `tsc` reports `TS2305` and exits 2 but still emits every file (no `noEmitOnError` in `tsconfig.json`); `node --test` over the emitted files fails only the red file, with `SyntaxError: The requested module '../src/m.js' does not provide an export named 'missing'`, and the other test passes. `run-tests.mjs` does not block: it only checks that source and compiled counts match (L45) and then runs the compiled files (L64). The whole suite is blocked only by CI's step order (`npm run build` then `npm test`). So the first audit's "fails the build for every test" holds only in CI, and its example `parseNumstatZ` is wrong (it is exported at `2331baf`); `walkRepository`, `decodePathBytes`, `oracleRunSync`, `checkTuningWrite`, `consumerKey`, `ensureHome` and `backupFile` are not exported, so the problem is real. The actual defect is the narrower one: a test over a new export goes red for a compile or module-link reason, never for its "Fails when" reason, and the contract's rewrite rule covers only a test that *passes*, so the test writer must decide on the fly. The correction is the same in substance; its facts are the second opinion's.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L985-L988]] "**Test-first contract for Step 13 onward:** a separate agent writes each step's §12 tests from the test specification alone and runs them against the skeleton before the step's code changes; each must fail for the reason its \"Fails when\" clause names (a test that passes against"
- [[middleware/context-oracle/ctxoracle/scripts/run-tests.mjs@2331baf:L45]] "if (compiledFiles.length !== sourceFiles.length) {"
- [[middleware/context-oracle/ctxoracle/scripts/run-tests.mjs@2331baf:L64]] "execFileSync(process.execPath, ['--test', ...compiled], { stdio: 'inherit' });"
- [[.github/workflows/context-oracle-ctxoracle.yml@2331baf:L27-L28]] "- run: npm run build - run: npm test"
- [[middleware/context-oracle/ctxoracle/package.json@2331baf:L5]] "\"type\": \"module\","
- [[ran]] `git show 2331baf:middleware/context-oracle/ctxoracle/tsconfig.json | grep -c noEmitOnError` → `0`
- [[ran]] in the scratchpad, `src/m.ts` = `export const a = 1;`, `test/red.test.ts` importing `missing` from `../src/m.js`, `test/green.test.ts` importing `a`, `tsconfig.json` with `strict`, `ES2022`, `NodeNext`, `verbatimModuleSyntax`, `types: ["node"]`, `include: ["src","test"]`, `package.json` `{"type":"module"}`: `node …/ctxoracle/node_modules/typescript/bin/tsc -p tsconfig.json` → `test/red.test.ts(3,10): error TS2305: Module '"../src/m.js"' has no exported member 'missing'.`, `tsc exit 2`; `ls dist/test` → `green.test.js red.test.js`; `node --test dist/test/red.test.js dist/test/green.test.js` → `ok 1 - green`, `# SyntaxError: The requested module '../src/m.js' does not provide an export named 'missing'`, `not ok 2 - dist/test/red.test.js`, `# pass 1`, `# fail 1`, exit 1
- [[ran]] `for s in parseNumstatZ walkRepository decodePathBytes oracleRunSync checkTuningWrite consumerKey ensureHome backupFile; do git grep -c "export .*\b$s\b" 2331baf -- middleware/context-oracle/ctxoracle/src | wc -l; done` → `1 0 0 0 0 0 0 0`
**Final verdict:** replace
**Correction:** Keep the build order, the `SKELETON:` removal rule and the three conventions. In the test-first contract state the red state for a test over an export the step adds: the recorded missing-export diagnostic (`TS2305` at build, or the ESM link `SyntaxError` at run) is the red run, or the test writer adds a declared throwing stub for each new `provides` export so the test fails at its assertion; the "Fails when" reason is verified only where the export exists. State that the build (and so CI) is red between the test commit and the step's code. The tuning-convention line "a missing key is re-seeded by the reader" (L999–L1000) follows E-17's ruling on the read-only global handle.
**Owner question:** none.

### E-7
**Ruling:** The second opinion's `replace` is accepted over the first audit's `keep`. (a) and (b) stand: the marker fixture has no `origin` field at `2331baf`, the 21 stubs are real, and `T-1-3` keeps the generator and §5.1 in lockstep. Rule (c) as written — "Every step whose §12 test consumes a fixture scenario declares `modify: …generate.ts`" — is not true of the plan it governs: Step 29 (T-29-1 on `coupling-nonobvious`), Step 31 (T-31-1 on `pristine-tree`) and Step 32 (T-32-1) consume fixtures and declare no `generate.ts` edit (verified from their `step-decl` blocks). None of the three needs to: `coupling-nonobvious` is built out by Step 18, and `pristine-tree` is a single-commit `trivial` baseline. The §14.5 G6 row already carries the narrower meaning (S13, S14, S15, S18, S28, S30, S38 — the steps that build fixtures out). So the plan's own row and its rule disagree; a builder or reviewer applying (c) literally to Steps 29, 31 and 32 finds violations that are not violations or adds edits nobody needs. Under the brief a line that must change is not a keep. The first audit called (c) "the root-cause fix for G6" without checking the rule against the declarations.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L1157-L1160]] "(c) **Fixture build-out is declared (G6).** Every step whose §12 test consumes a fixture scenario declares `modify: middleware/context-oracle/ctxoracle/test/fixtures/generate.ts` and names in its \"What changes\" the fixtures it builds out"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L12697]] "| G6 | S1 delta (c); `modify: generate.ts` on S13, S14, S15, S18, S28, S30, S38; S13 provides `parseNumstatZ` | T-1-3, T-13-1 | |"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L5136]] "modify: []"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L11146]] "- **Data.** A fixture hook stream on `coupling-nonobvious` replayed with"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L5392]] "modify: [middleware/context-oracle/ctxoracle/src/cli/dispatch.ts]"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L5522]] "**Verification.** `T-31-1` (fresh `pristine-tree` repo with and without a"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L5545]] "modify: [middleware/context-oracle/ctxoracle/src/cli/dispatch.ts]"
- [[middleware/context-oracle/ctxoracle/test/fixtures/generate.ts@2331baf:L184]] "'pristine-tree': (dir) => trivial(dir, 'pristine-tree'),"
- [[ran]] `git show 2331baf:middleware/context-oracle/ctxoracle/test/fixtures/generate.ts | grep -c "trivial("` → `22`
**Final verdict:** replace
**Correction:** Keep (a), (b) and the seven baselines. Reword (c): the step that *builds out* a fixture scenario declares `modify: middleware/context-oracle/ctxoracle/test/fixtures/generate.ts` and names the fixture in its "What changes"; a later step that only consumes a built-out fixture, or a baseline as it stands, declares nothing. The §14.5 G6 row needs no change (it already lists the build-out steps).
**Owner question:** none.

### E-8
**Ruling:** Verdict: both `replace`; the correction stands with one fact corrected and one added. The re-entrant transactions, the `mode=rw` URI open and `backupFile` stand. The defect is the relabel: "when SQLite reports it cannot open the file, throws the typed `StoreMissing`" maps every `SQLITE_CANTOPEN` (errcode 14) to one diagnosis, which Step 6 books as `repo_not_bound` / `reason: 'store_missing'`. *The missing-parent-directory case:* the second opinion is right that it is not a misdiagnosis. The handler opens a project store only after the global-store binding lookup succeeded (AD-23), so if `projects/<key>/` is gone the store is missing; a post-failure `stat` returns `ENOENT` for a missing file and for a missing directory alike, and the fix classifies both as `StoreMissing` correctly. The real misdiagnoses are the cases where the path exists: a directory at the path, and a file the process cannot read. *The permission case*, which the first audit asserted "by its documentation" with no citation, is established here by execution as uid 65534 against a root-owned mode-000 store: errcode 14, "unable to open database file", and `stat` succeeds — so one `stat` separates the causes exactly as both auditors propose. *The Node floor:* the plan's evidence for the URI open was executed on 22.22.2 only; Node's `src/node_sqlite.cc` at tag `v22.16.0` passes `SQLITE_OPEN_URI` in its default flags to `sqlite3_open_v2`, so `file:…?mode=rw` is honoured on the floor. That citation belongs in the plan's evidence, since 22.22.2 execution alone did not establish the floor.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L1367-L1369]] "`mustExist: true` the adapter opens `pathToFileURL(path).href + '?mode=rw'` and, when SQLite reports it cannot open the file, throws the typed `StoreMissing` (the path is in its `message`) instead of creating a"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L1789-L1790]] "`repo_not_bound`'s detail is `{cwd, root, reason: 'no_binding'|'store_missing'}` (`root` null when the walk found none);"
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L2162-L2164]] "A miss means not initialized: the handler fails open silent and creates nothing — no store layout, no project directory — except the fault `repo_not_bound` on the"
- [[ran]] in `/tmp/adj-e8` (a root-owned mode-000 `locked.db`, an empty `dirpath/`), `setpriv --reuid=65534 --regid=65534 --clear-groups node p.mjs /tmp/adj-e8`, each case `new DatabaseSync(pathToFileURL(p).href + '?mode=rw')` then `statSync(p)` on failure → `["missing file","unable to open database file",14,"ERR_SQLITE_ERROR","stat:ENOENT"]`, `["missing dir","unable to open database file",14,"ERR_SQLITE_ERROR","stat:ENOENT"]`, `["path is a directory","unable to open database file",14,"ERR_SQLITE_ERROR","stat:exists"]`, `["no read permission","unable to open database file",14,"ERR_SQLITE_ERROR","stat:exists"]`
- [[https://raw.githubusercontent.com/nodejs/node/v22.16.0/src/node_sqlite.cc]] "int default_flags = SQLITE_OPEN_URI;"
- [[ran]] `curl -sS https://raw.githubusercontent.com/nodejs/node/v22.16.0/src/node_sqlite.cc | grep -n -A6 "default_flags = SQLITE_OPEN_URI"` → line 704 `int default_flags = SQLITE_OPEN_URI;` … line 708 `int r = sqlite3_open_v2(open_config_.location().c_str(),` … line 710 `flags | default_flags,`
**Final verdict:** replace
**Correction:** Keep the re-entrant transactions, the `mode=rw` open, `backupFile`, `T-3-5` and `T-3-6`. On errcode 14, `stat` the path after the failure (nothing was created, so there is no race): `ENOENT` (missing file or missing parent directory) → `StoreMissing`; an existing path (a directory, or a permission failure) → a distinct typed error carrying the `errno` and path, which Step 6/28 record under a distinct `repo_not_bound` reason (E-11). Add the directory and permission cases to `T-3-5`. Add the `v22.16.0` `node_sqlite.cc` citation beside the "executed on Node 22.22.2" evidence for the URI open.
**Owner question:** none.

### E-9
**Ruling:** Verdict: both `replace`; the second opinion's added evidence is verified and accepted. `ensureHome` as specified creates `<home>/global/` too, and the handler calls it on the miss path, so an event on a machine with no `init` creates a store directory — more than AD-23's "creates nothing … except the fault". The plan's own T-28-7(e) fails any run that creates anything but `<home>/diagnostics/` and its fault, and the plan's own §6 summary of this very delta says "`ensureHome` creates `<home>/diagnostics/`" — so the widening is also an inconsistency inside this commit, not only a conflict with Step 28. The duplicated phrase is real.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L1472]] "— creates `<home>/`, `<home>/global/`, and `<home>/diagnostics/` at `0o700`"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L1477-L1478]] "before. **Callers:** `ensureLayout` — `init` (Step 31), the replay harness's the replay harness's store preparation (Step 28), and the store-creating"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L1480]] "`ensureHome` alone — the handler's home-channel fault path (Step 28), which"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L898]] "- Step 4 — `ensureHome` creates `<home>/diagnostics/` (AD-17, G35)."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L11063]] "(e) creates anything but `<home>/diagnostics/` and its fault, OR any"
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L2162-L2164]] "A miss means not initialized: the handler fails open silent and creates nothing — no store layout, no project directory — except the fault `repo_not_bound` on the"
**Final verdict:** replace
**Correction:** Keep `ensureHome`, the split from `ensureLayout` and the caller list. The helper the handler calls on the miss path creates only `<home>/` and `<home>/diagnostics/`; `global/` is created by `ensureLayout`, `init` and `import`. Step 4, §6 and T-28-7(e) then agree. Fix the duplicated phrase at L1477–L1478.
**Owner question:** none.

### E-10
**Ruling:** The second opinion's `replace` is accepted over the first audit's `keep`, with one qualification to its derivation. The seam, the fatal decoder, `escapeBytes`, the count and both tests stand. The exclusion of a non-UTF-8 path is a degraded outcome, specified and visible; what the plan lacks is written backing for *exclusion* over the alternative of keeping the bytes. Its *Why* cites POSIX ("a pathname is a byte string") and WHATWG `fatal`: those back "refuse rather than substitute"; POSIX, if anything, says such a name is a valid pathname. The first audit's reason — "cannot represent a non-UTF-8 key in a `TEXT` column without inventing an encoding" — is not in the plan and does not settle it: `files.path` is `TEXT` by the plan's own DDL, and SQLite has `BLOB`. Brief test 5 requires the plan to show why exclusion beats keeping the bytes. The second opinion's derivation (FR-D1's verifiable pointer; the hook channel is JSON, which RFC 8259 requires to be UTF-8; so a non-UTF-8 path cannot reach the agent as a pointer it can open) is verified at its sources and is a real reason that the *path* is unaddressable by the agent. Qualification: it does not by itself show that no fact about such a file could be a non-rumor, since a commit hash is also a verifiable pointer; so the plan must record the comparison (exclude and count, versus a `BLOB`-keyed row rendered escaped) and the reason the exclusion wins — the file can never be a whisper target or an openable pointer, and its loss is counted — rather than present exclusion as following from POSIX and WHATWG.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L1618-L1619]] "'buffer'}`) call `decodePathBytes` on every path and **exclude** a path it rejects, counting it for the `path_not_utf8` fault (Step 6) — one rule in"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L1623-L1625]] "`statSync`) and collapsed into one `bad\ufffd.txt` row by the miner. POSIX defines a pathname as a byte string; the WHATWG Encoding Standard's `fatal` flag is the documented way to refuse rather than substitute."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L1987]] "CREATE TABLE files(id INTEGER PRIMARY KEY, path TEXT NOT NULL UNIQUE,"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@2331baf:L187-L188]] "**at least one verifiable pointer** `[JOHNSON, P4]`. An uncheckable whisper is a rumor and is not emitted."
- [[https://www.rfc-editor.org/rfc/rfc8259.txt]] "JSON text exchanged between systems that are not part of a closed ecosystem MUST be encoded using UTF-8"
- [[https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap03.html]] "3.271 Pathname A string that is used to identify a file"
- [[ran]] `python3 webquote.py https://www.rfc-editor.org/rfc/rfc8259.txt "JSON text exchanged between systems that are not part of a closed ecosystem MUST be encoded using UTF-8"` → exit 0; the same for the POSIX quote → exit 0
- [[ran]] `grep -n -i "BLOB" <plan at 2331baf>` → no output (the plan never compares a byte-keyed row)
**Final verdict:** replace
**Correction:** Keep the seam, the decoder, `escapeBytes`, the counted exclusion and both tests. In Step 5's *Why*, give the exclusion its own backing and comparison: FR-D1's verifiable-pointer rule and the UTF-8-only hook channel (RFC 8259 §8.1) make a non-UTF-8 name unaddressable by the agent, so such a file can be neither a whisper target nor an openable pointer; keeping it as a `BLOB` key rendered escaped would keep a row no whisper may name, while excluding and counting under `path_not_utf8` makes the under-coverage visible (OL-10). Say that POSIX and WHATWG back only "refuse, don't substitute".
**Owner question:** none.

### E-11
**Ruling:** Not second-opinioned. The one fact it depends on — E-8's split of `store_missing` from the other `SQLITE_CANTOPEN` causes — is upheld here (with the parent-directory case classified as missing). The first audit's `replace` (verify and remove `MultiEdit`, or record the evidence; split the `repo_not_bound` reason) stands; no re-ruling.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L1789-L1790]] "`repo_not_bound`'s detail is `{cwd, root, reason: 'no_binding'|'store_missing'}` (`root` null when the walk found none);"
**Final verdict:** replace (as the first audit states it)
**Correction:** as the first audit; the added `reason` covers an existing-but-unopenable store (directory or permission) with the errno, per E-8.
**Owner question:** none.

### E-12
**Ruling:** Both auditors: keep. The DDL is AD-4 as revised; every plan addition is marked `-- plan`, tied to a named need, and the two that depart from AD-4 (`corrections.genre`, `cochange_pairs.last_commit`) are raised in §16 item 5. The E-5 version guard changes the runner and the value it writes, not this DDL (`schema_version` is a row the runner writes, L74/L82 of `migration_runner.ts`). The sentence that must change under E-5 ("The runner (`applyMigrations`) is unchanged", L2210) sits in hunk h102, which is E-13's unit, not this entry's.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L2048-L2051]] "CREATE TABLE corrections(seq INTEGER PRIMARY KEY, id TEXT NOT NULL UNIQUE, whisper_id TEXT, deny_id TEXT, verdict TEXT NOT NULL CHECK(verdict IN ('false_fire','missed','confirm')),"
- [[middleware/context-oracle/ctxoracle/src/stores/migration_runner.ts@2331baf:L74]] "store.prepare(\"INSERT OR REPLACE INTO schema_meta(key, value) VALUES('schema_version', '1')\").run();"
- [[ran]] `python3 -c` over `units.json` for the hunk whose new range contains line 2210 → `B4-21-2331baf-docs/plans/plan-phase-a.md#h102 [2164, 48]`
**Final verdict:** keep
**Correction:** none.
**Owner question:** none.

### E-13
**Ruling:** Verdict: both `replace`; the correction stands; the second opinion's reading of AD-2 is accepted over the first audit's. The two executed fixes are real and at their cause (default `unicode61` separators for `fts_paths`; a `NOCASE` index the LIKE optimization can use). The plan's claim that the FTS prefix query and the indexed `LIKE 'x%'` "select the same symbols" is false outside lower-case ASCII identifiers — reproduced here: `über` matches `Über` under FTS and not under `LIKE`; `bar` matches `foo-bar` and `Foo::bar` under FTS only; `method` matches `my.method` under FTS only; `user` agrees — and `T-15-3`'s five ASCII tokens cannot catch it. *On the standard:* AD-2 does not require the fallback to return identical results. It says search "falls back to indexed `LIKE`/token-prefix queries behind the same interface, and `status` says so plainly", and a store runs in one state for its whole life (`fts_state` is recorded once at creation and never retried), so the two paths never answer for the same store. The first audit's "under AD-2 the fallback must say the same thing as the FTS path" reads a requirement into AD-2 that is not there, and its FR-J2/FR-J3 reference is the model-path degraded mode, not this one. The defect is therefore the false "executed" equivalence claim (brief test 3) and a test that passes while the claim is false, not a breach of AD-2. One further line in this entry's hunk h102 must change under E-5: "The runner (`applyMigrations`) is unchanged" (L2210).
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L2206-L2209]] "keeps an identifier (`_`, `$` included) as one token so an FTS prefix query and an indexed `LIKE 'x%'` over `symbols.name` select the same symbols (executed 2026-09-26: `\"user\"*` matches `user_name` and not `getUserName`, exactly as `LIKE 'user%'` does)."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L2210]] "The runner (`applyMigrations`) is unchanged."
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L353-L354]] "failure path, search falls back to indexed `LIKE`/token-prefix queries behind the same interface, and `status` says so plainly."
- [[middleware/context-oracle/ctxoracle/src/stores/migration_runner.ts@2331baf:L8-L9]] "// Forward-only: an already-migrated store (version >= 1) is left untouched, so a // store's fts_state — recorded once, from init's probeFts5 result at creation —"
- [[ran]] `node p13.mjs` (Node v22.22.2; `:memory:`; `s(name)` with `CREATE INDEX s_nc ON s(name COLLATE NOCASE)`; `f` = `fts5(name, tokenize = "unicode61 remove_diacritics 0 tokenchars '_$'")`; both holding `Über`, `über_x`, `foo-bar`, `my.method`, `user_name`, `user`, `getUserName`, `Foo::bar`) → `["user",{"like":["user","user_name"],"fts":["user","user_name"]}]`, `["über",{"like":["über_x"],"fts":["Über","über_x"]}]`, `["bar",{"like":[],"fts":["Foo::bar","foo-bar"]}]`, `["method",{"like":[],"fts":["my.method"]}]`, and `EXPLAIN QUERY PLAN SELECT name FROM s WHERE name LIKE 'user%'` → `["SEARCH s USING COVERING INDEX s_nc (name>? AND name<?)"]`
- [[ran]] `python3 -c` over `units.json` for the hunk whose new range contains line 2210 → `B4-21-2331baf-docs/plans/plan-phase-a.md#h102 [2164, 48]`
**Final verdict:** replace
**Correction:** Keep `path_tokens`, the `NOCASE` index, both tokenizers and the in-place edit. Replace "select the same symbols" with either a folded-token fallback that makes it true (a lower-cased, same-tokenised key searched by the same range query `path_tokens` uses) or the stated divergence (non-ASCII case folding; separator-bearing names), which `status` then discloses under AD-2. Add `Über`, `foo-bar`, `Foo::bar` and `my.method` to `T-15-3`'s data so the test discriminates. Say "as in AD-4" only of the four AD-4 tables. Replace "The runner (`applyMigrations`) is unchanged" with the version-guard change E-5 requires.
**Owner question:** none.

### E-14
**Ruling:** Both auditors: keep. The DDL is AD-5's revised `whisper_stats` replica with types resolved; it removes the skeleton's window key and running-sum publish; `T-8-1` asserts the columns. The `deinit --purge` question batch 3 part B E-8 routed to AD-5/AD-20 and Step 32 does not change this migration or its paragraph. "Migration 002 is edited in place to the DDL above" remains true under E-5: the version guard changes the runner and the `schema_version` value it writes (L82), not the DDL.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L2313-L2317]] "replaceable copy of each project's `stats_folds` totals, so an import, a purge, or a replaced store can neither strand nor double-count a row (AD-5 as revised 2026-09-26; review G33/N11 and the architecture pass's CH H8 / ER M6). **Reopened 2026-09-26 — build delta:** migration 002 is edited in place to the DDL above (§6)."
- [[middleware/context-oracle/ctxoracle/src/stores/migration_runner.ts@2331baf:L82]] "store.prepare(\"INSERT OR REPLACE INTO global_meta(key, value) VALUES('schema_version', '1')\").run();"
**Final verdict:** keep
**Correction:** none.
**Owner question:** none.

### E-15
**Ruling:** Both auditors: keep. Each removed DAO method carries an executed defect at this commit and each replacement states an architecture rule as an operation; the `sweepUnreferenced` guard list equals the set of tables that reference `files` without cascade; `MultiEdit` and the purge question reach this step only as consequences (E-11; batch 3 part B E-8). No new fact changes this.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L2475-L2477]] "- Every DAO method that writes more than one statement wraps them in `store.transaction` (a savepoint when a caller already holds one — Step 3), so a DAO call alone stays atomic and a caller can compose several."
**Final verdict:** keep
**Correction:** none.
**Owner question:** none.

### E-16
**Ruling:** Both auditors: keep. Engine-assigned `seq` through Step 7's `INTEGER PRIMARY KEY` is the N16 fix at its cause, and routing pre-repository faults to the home channel is AD-17. The hunk names "Step 4's `ensureHome`" as the source of the home `diagnostics/` directory; E-9's ruling keeps that name and narrows what the handler's call creates, so the sentence stays correct.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L2539-L2542]] "`recordFault(store | null, diagnosticsDir, fault)` is unchanged; the handler passes the home-level `diagnostics/` directory (Step 4's `ensureHome`) whenever no repository is known (AD-17, G35)."
**Final verdict:** keep
**Correction:** none.
**Owner question:** none.

### E-17
**Ruling:** Verdict: both `replace`. The parts agreed — (a) the stored-set ordering check is neither implemented nor rejected on the record; (c) `lexicon.fix_keywords` and `miner.chunk_ms` inherit batch 3's AD-15 and AD-26 corrections — stand. Three points are ruled.
*(b) — the `trust ≥ high` clause — is withdrawn as a plan correction, on three grounds.* First, batch 3 part B E-13 ruled "keep … `tune`'s refusal" as AD-14/AD-20 specify it (the two cap orderings and the trust factor in (0, 1]) and changed only the stored-set check; Step 12's validator encodes exactly that list. Adding a clause AD-14 does not state would make the plan diverge from the architecture it consumes, which the plan pass may not do: its own rule is that a flaw found in the architecture "is raised, not patched in the same pass" (STATUS@ec3b057, kept by batch 3 part B E-24). The right route is the §16 raise, and the plan's validator then follows whatever AD-14 decides. Second, the arithmetic: AD-14 dampens by staleness and recency before trust, so confidence = ratio × s × r × t with s, r ≤ 1. `t ≥ h` is *necessary* for any `untrusted_repo` fact to reach the high tier (confidence ≤ t), but not sufficient for "a strong-evidence repo fact can still reach" it — at t = h = 0.8 only a perfect, undampened fact reaches it — and "strong-evidence" has no numeric definition in AD-14, so no validator invariant can be derived from that sentence without inventing a threshold. The first audit's "a ratio ≥ 0.889 reaches it" holds only with no staleness or recency dampening. Third, `t < h` is not a silent failure: confidence "decides only whether the `[confidence: uncertain]` flag is shown", FR-A5a speaks uncertain facts flagged, and the trust seed is "illustrative" and "calibrated on Phase A data (`D-6bar`)". Whether `tune` should refuse, warn on, or allow a trust factor below the high tier — which would flag every mined `untrusted_repo` whisper uncertain, the state AD-14's second pass moved away from for the seed — is a decision for AD-14 with a defined reachability target, and it sits inside batch 3 part A E-15's open AD-14 item ("decide the cap and the dampener with reasons … and `tune` ordering enforcement"). The observation is recorded there as input; it is not added to `checkTuningWrite` or `T-12-3`.
*The read-only re-seed conflict is real and is added.* The reader writes on a miss ("re-seeded from `tuning_seeds.ts` (the seed row written with its seed `source`)"), and Step 28 at `2331baf` builds the reader on every event over the handler's global handle (`tuning = tuningReader(global, key, onMissing → tuning_missing)`). Batch 3's settled correction opens the handler's global store read-only. On that handle the re-seed write fails; on a writable one it takes the global write lock inside the event budget and undoes the correction. The plan could not know the ruling at `2331baf`, but it now builds on it, so the reader must state its behaviour on a read-only handle.
*The 0.9 seed.* Batch 3 part B E-13 also rules the 0.9 trust seed "stated as unsourced"; this step seeds `bar.untrusted_trust_factor` = 0.9 as `architecture_default` "marked illustrative there", so it inherits that correction. The first audit's (c) omitted it.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L2772-L2776]] "— AD-14's ordering invariant, enforced where `tune` writes (Step 33): after the write, `bar.confidence_floor ≤ bar.suspect_confidence_cap < bar.high_confidence_min` and `bar.confidence_floor ≤ bar.heuristic_confidence_cap < bar.high_confidence_min` must hold and `bar.untrusted_trust_factor` must lie in (0, 1]; otherwise the plain-language"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L2779-L2781]] "- **New `architecture_default` scalars** (values AD-14, AD-12, AD-26 state, each marked illustrative there): `bar.high_confidence_min` = `0.8`, `bar.untrusted_trust_factor` = `0.9`, `bar.suspect_confidence_cap` = `0.7`,"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L2761-L2763]] "list key, the member rows of whichever level has any. A key with neither is re-seeded from `tuning_seeds.ts` (the seed row written with its seed `source`), `onMissing(key)` is called once for it, and the seed value is"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L4979-L4980]] "index describes the main checkout); `tuning = tuningReader(global, key, onMissing → tuning_missing)` (G8); `observed` over this session and"
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L1467-L1468]] "`confidence` from `cochange_pairs`, dampened by staleness (`FR-K7`) and recency, then dampened by trust (`FR-X4`: low trust lowers confidence)."
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L1474-L1477]] "`[confidence: uncertain]`. For an `untrusted_repo` fact, confidence = evidence ratio × `bar.untrusted_trust_factor` (seed 0.9, in (0, 1]), so a strong-evidence repo fact can still reach the high tier and a weaker one cannot."
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L1484]] "**Composition:** dampen first (staleness, recency, trust), then take the"
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L1487-L1488]] "never printed — it decides only whether the `[confidence: uncertain]` flag is shown, so no whisper states a number that contradicts its own"
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L1489-L1491]] "`tune` (AD-20) rejects any write that breaks `bar.confidence_floor` ≤ each cap < `bar.high_confidence_min`, or puts the trust factor outside (0, 1]."
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L1494-L1495]] "requires; the trust-factor seed is likewise illustrative, and all of them are calibrated on Phase A data (`D-6bar`)."
- [[middleware/context-oracle/docs/STATUS.md@ec3b057:L262-L263]] "pass changes the plan only; a flaw it finds in the architecture is raised, not patched in the same pass."
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B3b.md@HEAD:L268]] "**Verdict:** replace — keep the dampener, the two caps in [floor, high), composition, display, the marked seeds and `tune`'s refusal; add the check on a stored set that violates the ordering (fault and use the seeds), or reject M9's second item on the record."
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B3-verification.md@HEAD:L118-L119]] "- E-15: decide the cap and the dampener with reasons, storage, display, the suspect-cap placement, and `tune` ordering enforcement."
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B3-verification.md@HEAD:L140]] "- E-13: the stored-set ordering check; the 0.9 seed stated as unsourced."
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B3-verification.md@HEAD:L165]] "- Open the global store read-only."
- Derivation: confidence = ratio × s × r × t with ratio, s, r ≤ 1 (AD-14's order). Then confidence ≤ t, so t < h makes the high tier unreachable for every `untrusted_repo` fact (t = 0.75, h = 0.8: 1 × 0.75 < 0.8); t ≥ h is necessary. Sufficiency for a "strong-evidence" fact needs ratio × s × r ≥ h / t, and the plan and AD-14 define no ratio, s or r for "strong-evidence", so no threshold follows from the sentence.
- [[ran]] `grep -n "untrusted_trust_factor" <plan at 2331baf>` → lines 2776, 2781, 3529, 9830, 11404 only (no plan line adds a `trust ≥ high` relation; L11404 is `tune`'s test of `0` and `1.2` refused, `1` accepted)
**Final verdict:** replace
**Correction:** Keep the reader, the validator, the seeds and the three tests. Add the stored-set ordering check (at reader construction: on a violating stored set, fault and serve the seeds), or reject ER M9's second item on the record. Mark the 0.9 trust seed unsourced, per batch 3. Let `lexicon.fix_keywords` and `miner.chunk_ms` follow batch 3's AD-15 and AD-26 corrections. State the reader's behaviour on the read-only global handle batch 3 requires on the event path: serve the seed value and call `onMissing` without writing; re-seed only on a writable verb run (`init`, `tune`, `status`). Do **not** add the `bar.untrusted_trust_factor ≥ bar.high_confidence_min` clause to `checkTuningWrite` or `T-12-3`; record the reachability observation (t < h flags every mined `untrusted_repo` whisper uncertain, through `tune`, with no refusal or warning) as input to batch 3 part A E-15's AD-14 item, where the dampener is decided with reasons and a reachability target, and the plan's validator follows that decision.
**Owner question:** none.

## Summary

| Entry | First audit | Second opinion | Adjudication | Correction in one line |
|---|---|---|---|---|
| E-1 | keep | keep | **keep** | none |
| E-2 | replace | — | **replace** (not re-ruled) | h5/h6 name the ≥ 25 ms inter-chunk yield |
| E-3 | replace | — | **replace** (not re-ruled) | source the interface segregation principle |
| E-4 | keep | keep (step 3 wrong) | **keep** | none to the table; step (3)'s claim corrected on this record, rule wording fixed under E-7 |
| E-5 | keep | replace | **replace** | Rails criterion + executed checks replace the squashing citation; new `schema_version` value (or fingerprint) refused by the runner and `import` with the `deinit --purge` + `init` recovery; L2210/L7567 follow |
| E-6 | replace | replace (facts corrected) | **replace** | red state for a new export = missing-export diagnostic or a declared throwing stub; CI red between test commit and code; `parseNumstatZ` example dropped |
| E-7 | keep | replace | **replace** | (c) reworded: the step that builds a fixture out declares `generate.ts`; consumers declare nothing |
| E-8 | replace | replace (parent dir corrected; permission executed) | **replace** | `stat` after errcode 14: `ENOENT` (file or parent) → `StoreMissing`; existing path → distinct typed error with errno; add cases to `T-3-5`; cite `node_sqlite.cc@v22.16.0` for the floor |
| E-9 | replace | replace (+ §6 line) | **replace** | handler's miss-path helper creates only `<home>/` and `<home>/diagnostics/`; fix duplicated phrase |
| E-10 | keep | replace | **replace** | write the exclusion's own backing (FR-D1 + RFC 8259 UTF-8 channel) and the comparison with a `BLOB`-keyed row; POSIX/WHATWG back only refuse-not-substitute |
| E-11 | replace | — | **replace** (not re-ruled) | as the first audit; reason split per E-8 |
| E-12 | keep | keep | **keep** | none (L2210 is h102, E-13's unit) |
| E-13 | replace | replace (AD-2 reading corrected) | **replace** | make the equivalence true or state the divergence; add non-ASCII and separator cases to `T-15-3`; "as in AD-4" only of AD-4 tables; L2210 runner sentence changes with E-5 |
| E-14 | keep | keep | **keep** | none |
| E-15 | keep | keep | **keep** | none |
| E-16 | keep | keep | **keep** | none |
| E-17 | replace | replace ((b) withdrawn; read-only reader; 0.9 seed) | **replace** | stored-set check or rejection on record; 0.9 seed unsourced; batch-3 AD-15/AD-26 seeds; reader serves seed without writing on the read-only handle; no `trust ≥ high` clause — reachability routed to AD-14 under batch 3 part A E-15 |

Totals: keep 6 (E-1, E-4, E-12, E-14, E-15, E-16); replace 11; remove 0; undetermined 0.

Owner questions: one (E-5) — has Max Cogar run `ctxoracle init` on any machine of his? If yes, a forward migration replaces the in-place edit; if no, the in-place edit with the version guard stands.
