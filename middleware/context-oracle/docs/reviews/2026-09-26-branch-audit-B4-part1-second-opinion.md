# Branch audit — batch B4, part 1: second opinion

Second opinion (Opus 5.5) on `2026-09-26-branch-audit-B4-part1.md` (E-1 … E-17, commit `2331baf`, hunks h1–h117 of `docs/plans/plan-phase-a.md`). Judged under the same brief (`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/BRIEF.md`), with batches 1–3 settled (`…-B1-verification.md`, `…-B2-verification.md`, `…-B3-verification.md`). Every entry was re-derived from the plan at `2331baf` and its parent `ec3b057`, the architecture at `ec3b057`, the spec, and the code at `2331baf`. Web quotes were fetched with `curl` and checked with `webquote.py` (exit 0). Experiments ran on Node v22.22.2, git 2.43.0 and TypeScript 5.9.3 in the session scratchpad. Where this file cites a later review record, that record is a claim I checked, not backing.

### E-1
**Agree/Disagree:** Agree with the verdict. Agree with the reasoning.
- The header's two commits are the only architecture commits before `2331baf` on that day.
- The commit changes only the plan.
- §14.5 has a row for every gap-list item. G29 has no row of its own; it is listed as `G23/G29`. The review names G29 as G23's source, so that row covers it.
- The two hunks date and scope the revision. They decide nothing.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L5-L9]] "revised twice on 2026-09-26 by the skeleton-gap-list pass — commits `0fab6d7` and `ec3b057`)"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L12714]] "| G23/G29 | S6, S20, S22, S25, S27, S28 | T-6-4, T-20-1, T-22-1, T-25-3, T-27-1 | fork premise closed by V22 (no parent id) |"
- [[middleware/context-oracle/docs/reviews/2026-09-25-skeleton-gap-list-review.md@2331baf:L518]] "### G23 — dedup identity is too coarse (and G29, its source)"
- [[ran]] `git show --stat 2331baf | tail -1` → ` 1 file changed, 3420 insertions(+), 685 deletions(-)`
- [[ran]] `git log --format=%h --before=2026-09-26T01:43Z -1 -- middleware/context-oracle/docs/architecture-phase-a.md` → `ec3b057`
- [[ran]] a loop over G1–G36 and N1–N16 checking that each ID has a row in the §14.5 table (plan L12683 to the next section) → the only one missing is `G29`, which is in the `G23/G29` row.
**Correct verdict:** keep. Both records are true of the documents they describe.

### E-4
**Agree/Disagree:** Agree with the verdict. Disagree with reasoning step (3).
- **The verdict.** The 46 rows are inside the generated region. I re-ran the plan's generator on a checkout of `2331baf` and it reports the regions current, so each row is exactly what the declarations produce. The brief says a generated region is backed by its generator and that the decision under test is the declaration it came from. The declarations are judged in their step entries: Steps 1–12 here, the rest in parts 2 and 3. So the table stands as it is.
- **Step (3) is not true as written.** It says the G6 fix puts "a `modify` row for `generate.ts` on every consuming step". Three steps consume a fixture but do not declare `generate.ts`:
  - Step 29's `T-29-1` replays `coupling-nonobvious`, and Step 29 declares `modify: []`.
  - Steps 31 and 32 run on `pristine-tree`, and they declare only `dispatch.ts`.
- **What does hold is the weaker claim.** I mapped each of the 21 `trivial(...)` stubs to the tests that use it, and every stub has at least one consuming step that declares `generate.ts` (S13, S14, S18, S30 or S38). The defect is in the wording of the Step 1 rule, which is E-7's unit. It is not in this table, so it does not change E-4's verdict.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L492]] "<!-- generated:files begin -->"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L825]] "<!-- generated:files end -->"
- [[ran]] `git archive 2331baf middleware/context-oracle/docs/plans middleware/context-oracle/.claude/skills/expert-plan | tar -x -C <scratch>`, then in `<scratch>/middleware/context-oracle` `node .claude/skills/expert-plan/scripts/derive-plan-sections.mjs --check docs/plans/plan-phase-a.md` → `OK: 40 steps, 13 elements, 156 test specs, 27 probes cited, regions current`, exit 0
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L5136]] "modify: []" (Step 29's declaration)
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L11146]] "A fixture hook stream on `coupling-nonobvious` replayed with" (`T-29-1`'s Data)
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L5545]] "modify: [middleware/context-oracle/ctxoracle/src/cli/dispatch.ts]" (Step 32)
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L5522]] "**Verification.** `T-31-1` (fresh `pristine-tree` repo with and without a"
- [[ran]] a script over `generate.ts@2331baf` and the plan listing, for each of the 21 `trivial(dir, …)` generators, the `T-n-m` sections that name it → `miner-hygiene` T-13-1; `indexer-small` T-14/T-15/T-28; `coupling-nonobvious` T-18/T-28/T-29/T-38; the other Step 18 fixtures T-18/T-38; `pristine-tree` T-31-1, T-32-1, T-38-25; `regret-*` T-30-1; the remaining seven T-38 only. Each has a declaring consumer among S13, S14, S18, S30 and S38.
**Correct verdict:** keep. The rows are generator output from the declarations. The over-broad sentence about consuming steps is E-7's to correct.

### E-5
**Agree/Disagree:** Disagree with the verdict. Agree with part of the reasoning.
- **What I agree with:**
  - The reopening is warranted. The defects are in the built code at `2331baf`.
  - Correcting Steps 1–12 before Step 13 is the order the dependencies force.
  - The §6 delta list and the reworded tail are accurate.
- **Is "no store has shipped" true?** As far as it can be checked here, yes.
  - The gap-list review's runs used a temporary `CTXORACLE_HOME`.
  - CI runners are ephemeral.
  - No settings file in the repository's history ever referenced `ctxoracle`.
  - `~/.ctxoracle` does not exist in this container.
  - Steps 1–12 being built, and CI having run them, does not change this. Those stores lived in temporary homes on throwaway machines.
- **Is the premise sufficient? No, for two reasons.**
- **(a) The backing supports a different operation (test 4).** The entry cites Django's squashing guide.
  - Squashing produces migrations "which still represent the same changes".
  - Django says to "leave the old ones in place" until every instance has applied them.
  - The plan's in-place edit changes the schema and deletes nothing old. It is not squashing, and the guide's own procedure is the opposite of editing an applied migration.
  - The practice that does govern is the Rails migrations guide.
    - Once a migration has been run, "Rails thinks it has already run the migration and so will do nothing".
    - Editing a migration "already committed to source control is not a good idea".
    - It is common only when the migration "has not been propagated beyond your development machine".
  - 001 was added in `4dd0f00` (2026-09-19) and is in the merged base `de66831`, so it has been committed and propagated.
  - So in-place editing rests entirely on the claim that no database anywhere ever ran it. That claim can be checked only on machines we can see. The first auditor says so in "Would be wrong if".
- **(b) A false premise would fail silently.**
  - The runner leaves any store at `schema_version >= 1` untouched.
  - It writes `'1'` for both the old and the edited schema.
  - The plan says "The runner (`applyMigrations`) is unchanged".
  - So a store built from the old 001, 001b or 002 on any machine is taken as current. It would keep the cascading `cochange_pairs`, the window-keyed `whisper_stats` and the one-token `fts_paths` under code that expects the new shapes.
  - The same identical version number would also defeat the `schema_version` refusal that batch 3 part B E-10 requires of `import`.
  - This is the fail-fast case the brief names: a premise nobody can fully check, with no visible failure if it is wrong.
- **The fix is small.**
  - Keep the in-place edit.
  - Back it with the Rails criterion and the executed checks, not the squashing guide.
  - Make a store from before the edit detectable and refused. Either the edited migrations record a new `schema_version` value, or a schema fingerprint is stored. On mismatch the runner, and the `import` check, raise a fault that names the recovery the runner already documents (`deinit --purge` + `init`).
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L920-L924]] "No store has shipped to any user (the skeleton ran only against scratch and this repository's own throwaway stores), so migrations 001, 001b, and 002 are **edited in place**, not superseded by forward migrations; AD-25's forward-only rule governs shipped stores"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L2210]] "The runner (`applyMigrations`) is unchanged."
- [[middleware/context-oracle/ctxoracle/src/stores/migration_runner.ts@2331baf:L8]] "Forward-only: an already-migrated store (version >= 1) is left untouched"
- [[middleware/context-oracle/ctxoracle/src/stores/migration_runner.ts@2331baf:L60]] "if (currentVersion(store, 'schema_meta') >= 1) return; // forward-only"
- [[middleware/context-oracle/ctxoracle/src/stores/migration_runner.ts@2331baf:L74]] "store.prepare(\"INSERT OR REPLACE INTO schema_meta(key, value) VALUES('schema_version', '1')\").run();"
- [[middleware/context-oracle/ctxoracle/src/stores/migration_runner.ts@2331baf:L11]] "wrong fts_state is deinit --purge + init, AD-25/Q7"
- [[https://docs.djangoproject.com/en/5.1/topics/migrations/]] "migrations which still represent the same changes"
- [[https://docs.djangoproject.com/en/5.1/topics/migrations/]] "You should commit this migration but leave the old ones in place"
- [[https://guides.rubyonrails.org/active_record_migrations.html]] "Rails thinks it has already run the migration and so will do nothing when you run bin/rails db:migrate"
- [[https://guides.rubyonrails.org/active_record_migrations.html]] "In general, editing existing migrations that have been already committed to source control is not a good idea."
- [[https://guides.rubyonrails.org/active_record_migrations.html]] "has not been propagated beyond your development machine"
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B3b.md@HEAD:L206]] "add the `repo_key`/`schema_version` check the finding named, or reject it on the record"
- [[middleware/context-oracle/docs/reviews/2026-09-25-skeleton-gap-list-review.md@2331baf:L22-L25]] "the real `dist/src/cli/dispatch.js` binary with `CTXORACLE_HOME` pointed at a temp dir) on throwaway git repositories created for the purpose."
- [[ran]] `git log --diff-filter=A --format=%h -- middleware/context-oracle/ctxoracle/src/stores/migrations/001_phase_a_project.sql | tail -1` → `4dd0f00`; `git merge-base --is-ancestor 4dd0f00 de66831; echo $?` → `0`; `git log --format='%h %ci' -1 4dd0f00` → `4dd0f00 2026-09-19 16:38:07 +0000`
- [[ran]] `git log --all --oneline -S ctxoracle -- '*settings*.json' | wc -l` → `0`; `test -e ~/.ctxoracle; echo $?` → `1`
**Correct verdict:** replace. Keep the in-place edit. Replace the squashing citation with the Rails propagation criterion and the executed checks. Make a store from before the edit fail visibly: a new `schema_version` value or a schema fingerprint, refused by the runner and by `import` with the `deinit --purge` + `init` recovery.

### E-6
**Agree/Disagree:** Agree with the verdict (replace). Disagree with the central factual claim of the reasoning, and with one of its examples.
- **What I agree with:**
  - The conventions are faithful to AD-26 and to the gap-list decisions.
  - The test-first contract states an observation the toolchain cannot give for a test over an export the step adds. "Each must fail for the reason its 'Fails when' clause names" is not what happens.
- **The whole-build claim is only half true.** The entry says a missing export "produces a `tsc` error that fails the build for every test, not a failure of that test". I reproduced the project's setup: same compiler options, TypeScript 5.9.3, no `noEmitOnError`, and a runner that runs the emitted `dist/test/*.test.js` with `node --test`. Two things happen:
  - `tsc` reports `TS2305` and exits 2, but still emits every file.
  - Running the emitted tests fails only the red file, with `SyntaxError: The requested module … does not provide an export named 'missing'`. The other test passes.
- **So the whole suite is blocked only by CI's step order.** `npm run build` fails, so `npm test` never runs. The runner itself does not block. It only checks that source and compiled counts match, and they do.
- **The actual defect is narrower.** The red test does fail, but for a module-link or compile reason, never for its "Fails when" reason. The contract's rewrite rule covers only a test that *passes* against the skeleton, so the test writer has nothing to go on and must decide on the fly.
- **One example is wrong.** `parseNumstatZ` is already exported by the skeleton at `2331baf`, so it is not a case. `walkRepository`, `decodePathBytes`, `oracleRunSync`, `checkTuningWrite`, `consumerKey`, `ensureHome` and `backupFile` are not exported, so the problem is real.
- **The correction should say:**
  - For a test over a new export, a missing-export diagnostic (TS2305 or the ESM link error) is the recorded red state.
  - Or the test writer adds a declared throwing stub, so the test fails at its assertion.
  - The CI job is expected to be red between the test commit and the step's code.
- **One consequence for the tuning convention.** The line "a missing key is re-seeded by the reader and recorded as `tuning_missing`" follows whatever E-17 settles for the reader on the event path's read-only global handle. There, the key is recorded and the seed is served without a write.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L987-L991]] "and runs them against the skeleton before the step's code changes; each must fail for the reason its \"Fails when\" clause names (a test that passes against the skeleton is either pinning behaviour the skeleton already has — recorded in the implementation log with that evidence — or is not testing the decision, and is rewritten)."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L1000]] "key is re-seeded by the reader and recorded as `tuning_missing`."
- [[middleware/context-oracle/ctxoracle/scripts/run-tests.mjs@2331baf:L3-L4]] "Compiles-then-runs discipline: `tsc` emits every test to dist/; this runner // enumerates the compiled *.test.js files and executes them with `node --test`."
- [[middleware/context-oracle/ctxoracle/scripts/run-tests.mjs@2331baf:L64]] "execFileSync(process.execPath, ['--test', ...compiled], { stdio: 'inherit' });"
- [[.github/workflows/context-oracle-ctxoracle.yml@2331baf:L27-L28]] "- run: npm run build - run: npm test"
- [[ran]] in the scratchpad, a project with `src/m.ts` exporting only `a`, `test/red.test.ts` importing `missing` from `../src/m.js`, and `test/green.test.ts` importing `a`, using the compiler options of `ctxoracle/tsconfig.json@2331baf` (`strict`, `NodeNext`, `verbatimModuleSyntax`, `types: ["node"]`, no `noEmitOnError`): `node …/ctxoracle/node_modules/typescript/bin/tsc -p tsconfig.json` → `test/red.test.ts(3,10): error TS2305: Module '"../src/m.js"' has no exported member 'missing'.`, exit 2, `dist/test/` holds `green.test.js` and `red.test.js`; `node --test dist/test/red.test.js dist/test/green.test.js` → `ok 1 - green`, `# SyntaxError: The requested module '../src/m.js' does not provide an export named 'missing'`, `not ok 2 - dist/test/red.test.js`, `# pass 1`, `# fail 1`, exit 1 (Node v22.22.2)
- [[ran]] `git grep -c "export .*\bparseNumstatZ\b" 2331baf -- middleware/context-oracle/ctxoracle/src | wc -l` → `1`; the same for `walkRepository`, `decodePathBytes`, `oracleRunSync`, `checkTuningWrite`, `consumerKey`, `ensureHome`, `backupFile` → `0` each
**Correct verdict:** replace. Keep the build order, the `SKELETON:` rule and the three conventions. State the red state for a test over a new export: the recorded missing-export diagnostic, or a declared throwing stub so it fails at its assertion. Say that CI is red between the test commit and the step's code.

### E-7
**Agree/Disagree:** Disagree with the verdict. Agree with the reasoning on (a) and (b), not on (c).
- **(a) and (b) stand.**
  - The marker fixture at `2331baf` has no `origin` field.
  - There are 21 `trivial` stubs; `grep -c "trivial("` gives 22, the definition plus 21 calls.
  - The seven baselines are tied to named gaps, and `T-1-3` keeps the generator and §5.1 in lockstep.
- **(c) is not true of the plan it governs.** The rule reads "Every step whose §12 test consumes a fixture scenario declares `modify: …generate.ts`". Step 29 (`T-29-1` on `coupling-nonobvious`), Step 31 (`T-31-1` on `pristine-tree`) and Step 32 (`T-32-1`) consume fixtures and do not declare it.
- **None of the three needs to.** `coupling-nonobvious` is built out by Step 18, and `pristine-tree` is a single-commit baseline that the tests extend themselves.
- **So the rule overstates what it means.** It means "the step that builds a fixture out declares the edit and names it", which is what G6's root cause (no owner for the build-out) needs. As written, a builder or reviewer applying it to Steps 29, 31 and 32 finds a violation that is not one, or adds `generate.ts` edits nobody needs.
- **The first auditor's reasoning (3) calls this "the root-cause fix for G6" without checking the rule against the declarations.** Under the brief, a line that must change is not a keep.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L1157-L1160]] "(c) **Fixture build-out is declared (G6).** Every step whose §12 test consumes a fixture scenario declares `modify: middleware/context-oracle/ctxoracle/test/fixtures/generate.ts` and names in its \"What changes\" the fixtures it builds out"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L5136]] "modify: []" (Step 29)
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L11146]] "A fixture hook stream on `coupling-nonobvious` replayed with"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L5522]] "**Verification.** `T-31-1` (fresh `pristine-tree` repo with and without a"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L5545]] "modify: [middleware/context-oracle/ctxoracle/src/cli/dispatch.ts]" (Step 32)
- [[middleware/context-oracle/ctxoracle/test/fixtures/generate.ts@2331baf:L93-L96]] "function trivial(dir: string, marker = 'fixture'): void { initRepo(dir); commit(dir, [{ path: 'README.md', content: `# ${marker}\n` }], { message: 'init', day: 0 }); }"
- [[middleware/context-oracle/docs/reviews/2026-09-25-skeleton-gap-list-review.md@2331baf:L202-L204]] "Every step whose §12 test consumes a fixture declares `modify: middleware/context-oracle/ctxoracle/test/fixtures/generate.ts` and names the fixture it builds out."
- [[ran]] a scan of each step's `modify:` declaration for `generate.ts` → declared by S13, S14, S15, S18, S28, S30 and S38; not by S29 (`modify: []`), S31 or S32 (`modify: [middleware/context-oracle/ctxoracle/src/cli/dispatch.ts]`)
**Correct verdict:** replace. Keep (a), (b) and the seven baselines. Reword (c) so the step that *builds out* a fixture declares the `generate.ts` edit and names it, and later consumers of a built-out fixture declare nothing. The same fix goes into the G6 row of §14.5 if that row carries the wording.

### E-8
**Agree/Disagree:** Agree with the verdict (replace). Agree with the reasoning, with one correction and two additions.
- **What I agree with:**
  - The re-entrant transaction is AD-26 verbatim.
  - Opening with the `mode=rw` URI is the right guard, with no check-then-open race.
  - The defect is the relabel. "When SQLite reports it cannot open the file, throws the typed `StoreMissing`" maps every `SQLITE_CANTOPEN` to one diagnosis, and Step 6 books that diagnosis as `repo_not_bound` / `reason: 'store_missing'`.
- **Correction.** The entry lists "a missing parent directory" among the misdiagnosed causes. It is not one. If `projects/<key>/` is gone, the store *is* missing. The entry's own fix, a post-failure `stat` returning `ENOENT`, classifies that case as `StoreMissing`, correctly.
- **The real misdiagnoses are the ones where the path exists:**
  - the path is a directory;
  - the file is unreadable.
- **Addition 1: the permission case, which the entry asserted "by its documentation" with no citation.** I ran it as an unprivileged user (uid 65534) against a mode-000 store:
  - it returns the same `errcode` 14, "unable to open database file";
  - a post-failure `stat` succeeds there, as it does for the directory case;
  - a missing file or a missing directory gives `ENOENT`.
  So a `stat` separates the causes exactly as the fix proposes.
- **Addition 2: the Node floor.** The plan's evidence for the URI open was executed only on 22.22.2, while the floor is 22.16.0. Node's `src/node_sqlite.cc` at tag `v22.16.0` opens with `SQLITE_OPEN_URI` in its default flags, so `file:…?mode=rw` is honoured on the floor too. This is not a defect, but the plan's "executed on Node 22.22.2" alone did not establish it.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L1367-L1369]] "and, when SQLite reports it cannot open the file, throws the typed `StoreMissing` (the path is in its `message`) instead of creating a"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L1789-L1790]] "`repo_not_bound`'s detail is `{cwd, root, reason: 'no_binding'|'store_missing'}` (`root` null when the walk found none)"
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L1870-L1873]] "Not a fault system that only counts (each fault carries detail_json sufficient to reproduce the diagnosis — `FR-M5`'s readback intent)."
- [[ran]] in `/tmp/so4perm`, as `setpriv --reuid=65534 --regid=65534 --clear-groups node p.mjs /tmp/so4perm`, each case opened with `new DatabaseSync(pathToFileURL(p).href + '?mode=rw')` and then `statSync(p)` on failure → `["missing file","unable to open database file",14,"ERR_SQLITE_ERROR","stat:ENOENT"]`, `["missing dir","unable to open database file",14,"ERR_SQLITE_ERROR","stat:ENOENT"]`, `["path is a directory","unable to open database file",14,"ERR_SQLITE_ERROR","stat:exists"]`, `["no read permission","unable to open database file",14,"ERR_SQLITE_ERROR","stat:exists"]` (the last on a root-owned mode-000 `locked.db`; Node v22.22.2)
- [[https://raw.githubusercontent.com/nodejs/node/v22.16.0/src/node_sqlite.cc]] "int default_flags = SQLITE_OPEN_URI;"
**Correct verdict:** replace. Keep the re-entrant transactions, the `mode=rw` open, `backupFile` and both tests. On `errcode` 14, `stat` the path: `ENOENT` becomes `StoreMissing`, and an existing path (a directory, or a permission failure) becomes a distinct typed error carrying the errno. Add the directory and permission cases to `T-3-5`.

### E-9
**Agree/Disagree:** Agree with the verdict (replace). Agree with the reasoning, and add one piece of evidence.
- **The conflict is real.**
  - `ensureHome` creates `<home>/global/`, and the handler calls it on the miss path.
  - AD-23 allows only the fault after a miss: "creates nothing — no store layout".
  - `T-28-7`(e) fails any run that creates "anything but `<home>/diagnostics/` and its fault".
  - A test writer cannot satisfy both, and the delta widened the gap-list's `<home>/diagnostics/`-only decision without a reason.
- **The additional evidence.** The plan's own §6 summary of this delta says "`ensureHome` creates `<home>/diagnostics/`". That matches the gap-list and `T-28-7`, not the Step 4 text. So the widening is also an internal inconsistency within this commit, not only a conflict with Step 28.
- **The duplicated phrase** ("the replay harness's the replay harness's") is real.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L1471-L1472]] "Add `ensureHome(home: string): { homeDiagnostics: string; looseMode: string[] }` — creates `<home>/`, `<home>/global/`, and `<home>/diagnostics/` at `0o700`"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L1480-L1481]] "`ensureHome` alone — the handler's home-channel fault path (Step 28), which must be able to write `repo_not_bound` or a pre-repository fault on a machine"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L898]] "- Step 4 — `ensureHome` creates `<home>/diagnostics/` (AD-17, G35)."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L11063]] "(e) creates anything but `<home>/diagnostics/` and its fault, OR any"
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L2162-L2165]] "A miss means not initialized: the handler fails open silent and creates nothing — no store layout, no project directory — except the fault `repo_not_bound` on the home-level channel (AD-17)"
- [[middleware/context-oracle/docs/reviews/2026-09-25-skeleton-gap-list-review.md@2331baf:L741-L743]] "`ensureHome` (Step 4) creates `<home>/diagnostics/` (0700) as part of the home layout, and the handler's pre-repository fallback writes there."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L1477-L1478]] "before. **Callers:** `ensureLayout` — `init` (Step 31), the replay harness's the replay harness's store preparation (Step 28), and the store-creating"
**Correct verdict:** replace. The helper the handler calls on the miss path creates only `<home>/` and `<home>/diagnostics/`, and `global/` is left to `ensureLayout`, `init` and `import`, so Step 4, §6 and `T-28-7`(e) agree. Fix the duplicated phrase.

### E-10
**Agree/Disagree:** Disagree with the verdict. Agree with the reasoning on the seam, the decoder and the tests, not on the exclusion's backing.
- **What stands:**
  - `oracleRunSync`'s raw bytes and returned `status`, with the git exit codes documented and executed.
  - One fatal decoder shared by both writers of `files`. This is the root-cause fix for the collapse G7 executed.
  - `T-5-4` and `T-5-5` would fail if the decoder substituted or the seam threw.
- **What lacks backing: excluding a non-UTF-8 path.** The brief allows a degraded outcome only when a requirement calls for it and it is specified and visible. It is specified and visible: the `path_not_utf8` count, escaped bytes, rendered by `status`. But the plan cites nothing that calls for *exclusion*.
  - Its *Why* cites POSIX ("a pathname is a byte string") and WHATWG `fatal`. Those back *refuse rather than substitute*.
  - POSIX, if anything, says such a name is a valid pathname.
  - OL-10 backs visibility, not exclusion.
  - The gap-list decision gives the same three sources.
- **The comparison the plan needed is with keeping the bytes.** The first auditor's reason, "cannot represent a non-UTF-8 key in a `TEXT` column without inventing an encoding", does not settle it. The column type is the plan's own choice, and SQLite has `BLOB`.
- **A real reason exists but is not written in the plan.** It is the first auditor's FR-D1 point, completed:
  - every whisper must carry "at least one verifiable pointer";
  - the hook output that carries a pointer to the agent is JSON, which RFC 8259 requires to be UTF-8;
  - so a non-UTF-8 name cannot reach the agent as a pointer it can open;
  - so a fact keyed on it could only ever be a rumor, and FR-D1 does not emit rumors.
  That derivation is what makes exclusion the correct floor. It must be in the step, next to the decision.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L1622-L1625]] "`bad\xfe.txt` were silently dropped by the indexer (the lossy string failed `statSync`) and collapsed into one `bad\ufffd.txt` row by the miner. POSIX defines a pathname as a byte string; the WHATWG Encoding Standard's `fatal` flag is the documented way to refuse rather than substitute."
- [[middleware/context-oracle/docs/reviews/2026-09-25-skeleton-gap-list-review.md@2331baf:L222-L227]] "No silent drop, no collapse. Sources: POSIX (a pathname is a byte string); the WHATWG Encoding Standard (fatal decoding); `OL-10` (no silent failure)."
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@2331baf:L187-L188]] "**at least one verifiable pointer** `[JOHNSON, P4]`. An uncheckable whisper is a rumor and is not emitted."
- [[https://www.rfc-editor.org/rfc/rfc8259.txt]] "JSON text exchanged between systems that are not part of a closed ecosystem MUST be encoded using UTF-8"
- [[https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap03.html]] "3.271 Pathname A string that is used to identify a file"
**Correct verdict:** replace. Keep the seam, the decoder, `escapeBytes`, the counted exclusion and both tests. Give the exclusion its own backing in Step 5's *Why*: FR-D1's verifiable-pointer rule plus the UTF-8-only hook channel (RFC 8259) make a non-UTF-8 name unaddressable by the agent. That is why excluding and counting beats keeping the bytes as a `BLOB` key. POSIX and WHATWG back only "refuse, don't substitute".

### E-12
**Agree/Disagree:** Agree with the verdict. Agree with the reasoning.
- Every AD-4 column the revision names is present, with its SQL type.
- The plan additions are marked `-- plan` and tied to a named need:
  - `seq` on `session_log` and `observed_actions` (N16);
  - `segments_json`, the three event-path indexes and the `test_map.source` CHECK;
  - `corrections.genre` and `cochange_pairs.last_commit`, which are also raised to the architecture in §16 item 5, with the fix.
- I re-ran the constraints with the plan's DDL and they behave as the comments say:
  - a whisper-less `missed` with a genre inserts;
  - a whisper-less `confirm`, a row with both ids, and a genre on a whisper-bound row are rejected;
  - deleting a `files` row a pair references is refused under `foreign_keys=ON`.
- The Source line's "forward-only migrations for shipped stores" stands under my E-5 ruling, which keeps the in-place edit. The version-guard fix E-5 adds changes the runner, not this DDL.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L2048-L2051]] "CREATE TABLE corrections(seq INTEGER PRIMARY KEY, id TEXT NOT NULL UNIQUE, whisper_id TEXT, deny_id TEXT, verdict TEXT NOT NULL CHECK(verdict IN ('false_fire','missed','confirm')),"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L12881-L12883]] "(b) AD-15's Coupling/Consequence/Completeness headlines require a commit pointer, and AD-4's `cochange_pairs(a, b, pair_count, last_ts)` stores no commit — fix: add `last_commit` to AD-4 (D-plan-35)."
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L495-L497]] "cochange_pairs(a→files, b→files, pair_count, last_ts, PRIMARY KEY(a,b))"
- [[ran]] `node p12.mjs` (Node v22.22.2, `:memory:`, `PRAGMA foreign_keys=ON`, the plan's `corrections` DDL and a `cochange_pairs` referencing `files` without cascade) → `["missed-nowhisper-genre","ok"]`, `["confirm-nowhisper","rejected","CHECK constraint failed: whisper_id IS NOT NULL OR deny_id IS NOT NULL OR verdict = 'missed'"]`, `["both-ids","rejected","CHECK constraint failed: whisper_id IS NULL OR deny_id IS NULL"]`, `["whisper-with-genre","rejected","CHECK constraint failed: genre IS NULL OR (whisper_id IS NULL AND deny_id IS NULL)"]`, `["delete referenced parent","rejected","FOREIGN KEY constraint failed"]`
**Correct verdict:** keep. The DDL is AD-4 as revised, and every plan addition is marked, backed, and raised where it departs from the architecture.

### E-13
**Agree/Disagree:** Agree with the verdict (replace). Agree with the reasoning, with one correction to the standard it reads into AD-2.
- **The two executed fixes are real and fixed at their cause:**
  - the default `unicode61` separators for `fts_paths`;
  - a `NOCASE` index the LIKE optimization can use.
- **The claim that the two paths "select the same symbols" is false outside lower-case ASCII identifiers.** I re-ran it with the plan's tokenizer and a `NOCASE` index:
  - `über` matches `Über` under FTS but not under `LIKE`;
  - `bar` matches `foo-bar` and `Foo::bar` under FTS only;
  - `method` matches `my.method` under FTS only;
  - `user` agrees.
- **T-15-3 cannot catch this.** It asserts "the same hit sets under `fts: true` and `fts: false`" for five ASCII tokens, so it passes while the claim is false.
- **Correction to the standard.** AD-2 does not require the fallback to return the same results. It says the fallback sits "behind the same interface, and `status` says so plainly". A store also runs in one state for its whole life (`fts_state` is recorded once at `init`), so the two paths never answer for the same store.
- **So the defect is the false equivalence claim and the test built on it**, not a breach of AD-2. The fix is the one the first auditor named: make the equivalence true, with a folded-token key, or state the divergence and test it.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L2205-L2209]] "keeps an identifier (`_`, `$` included) as one token so an FTS prefix query and an indexed `LIKE 'x%'` over `symbols.name` select the same symbols (executed 2026-09-26: `\"user\"*` matches `user_name` and not `getUserName`, exactly as `LIKE 'user%'` does)."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L10202-L10204]] "`pathSearch` return the same hit sets under `fts: true` and `fts: false` for the fixture's token queries (`help`, `util`, `mod`, `schem`, `user` — each a prefix of a token, never a whole path — N6);"
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L353-L354]] "failure path, search falls back to indexed `LIKE`/token-prefix queries behind the same interface, and `status` says so plainly."
- [[ran]] `node p13.mjs` (Node v22.22.2; table `s(name)` with `CREATE INDEX s_nc ON s(name COLLATE NOCASE)` and `fts5(name, tokenize = "unicode61 remove_diacritics 0 tokenchars '_$'")`, both holding `Über`, `über_x`, `foo-bar`, `my.method`, `user_name`, `user`, `getUserName`, `Foo::bar`) → `["LIKE user%",["user","user_name"]]`, `["FTS \"user\"*",["user_name","user"]]`, `["LIKE über%",["über_x"]]`, `["FTS \"über\"*",["Über","über_x"]]`, `["LIKE bar%",[]]`, `["FTS \"bar\"*",["foo-bar","Foo::bar"]]`, `["LIKE method%",[]]`, `["FTS \"method\"*",["my.method"]]`, and `EXPLAIN QUERY PLAN … LIKE 'user%'` → `SEARCH s USING COVERING INDEX s_nc (name>? AND name<?)`
**Correct verdict:** replace. Keep `path_tokens`, the `NOCASE` index, both tokenizers and the in-place edit. Replace "select the same symbols" either with a folded-token fallback that makes it true or with the stated divergence (non-ASCII case folding and separator-bearing names), which `status` then discloses under AD-2. Add `Über`, `foo-bar`, `Foo::bar` and `my.method` to `T-15-3`'s data. Say "as in AD-4" only of the AD-4 tables.

### E-14
**Agree/Disagree:** Agree with the verdict. Agree with the reasoning.
- The DDL is AD-5's revised `whisper_stats`, with types resolved.
- It removes the skeleton's window key and its running-sum publish.
- `T-8-1` asserts the new columns.
- The prose sentence "an import, a purge, or a replaced store can neither strand nor double-count a row" restates AD-5's own "no replacement can inflate or strand a count". Batch 3 part B kept that property. It routed only the separate question of what `deinit --purge` does to a purged project's replica rows to AD-5/AD-20 and then to Step 32, so this paragraph inherits nothing that changes it.
- "Migration 002 is edited in place" stands under my E-5 ruling. E-5's version guard applies to the global store as well, but that is a runner change, not a change to this DDL.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L2313-L2315]] "replaceable copy of each project's `stats_folds` totals, so an import, a purge, or a replaced store can neither strand nor double-count a row (AD-5 as"
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L817-L819]] "import, and purge carry or remove together; the global row is then a replaceable copy of that unit's totals, so no replacement can inflate or strand a count."
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B3b.md@HEAD:L168]] "state what `deinit --purge` does to the project's `whisper_stats` replica rows so AD-5's \"removes that project's efficacy history\" and AD-20's \"deletes the project store\" agree."
- [[middleware/context-oracle/ctxoracle/src/stores/migrations/002_phase_a_global.sql@2331baf:L11-L15]] "window_start INTEGER NOT NULL, window_end INTEGER NOT NULL, PRIMARY KEY(genre, project_key, window_start)) STRICT;"
**Correct verdict:** keep. It is AD-5's replica schema as revised, and the purge question stays with AD-5/AD-20 and Step 32.

### E-15
**Agree/Disagree:** Agree with the verdict. Agree with the reasoning.
- Each removed method carries an executed defect at this commit.
- Each replacement is an architecture rule stated as an operation.
- I checked `sweepUnreferenced`'s reference list against Step 7's DDL. The tables that reference `files` *without* cascade are exactly `cochange_pairs` (`a`, `b`), `landmines`, `labelled_touches` and `invariant_members`, which is the list the method guards. Every other `files` reference is `ON DELETE CASCADE`. So the sweep can remove only rows no history points at, and the engine's foreign-key refusal backs it (E-12's probe).
- `MultiEdit` does not appear in these hunks. It enters Step 9 only through the unchanged `EDIT_TOOLS` sentence that `okEditedPaths` references. So E-11's `MultiEdit` correction reaches this step as a consequence, as the entry says, not as a defect in h109–h111.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L2422-L2424]] "`sweepUnreferenced(): number` (deletes `in_tree = 0` rows with `change_count = 0` that no `cochange_pairs`, `landmines`, `labelled_touches`, or `invariant_members` row references)"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L2021-L2022]] "a INTEGER NOT NULL REFERENCES files(id), b INTEGER NOT NULL REFERENCES files(id),"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L2403]] "in-code sets — `EDIT_TOOLS = {Edit, Write, MultiEdit, NotebookEdit}` (the"
- [[ran]] a scan of Step 7's DDL (plan L2002–L2201 at `2331baf`) for `REFERENCES files` → with `ON DELETE CASCADE`: `symbols`, `import_edges` (both columns), `symbol_refs`, `test_map`, `path_tokens`; without: `cochange_pairs` (a, b), `landmines`, `labelled_touches`, `invariant_members`
- [[ran]] `python3 -c` over `units.json` → h111 is new lines 2407–2479; the `EDIT_TOOLS` sentence at new L2403 lies outside every Step 9 hunk (unchanged from `ec3b057`)
**Correct verdict:** keep. The DAO surface realises AD-4, AD-5, AD-15 and AD-16 as operations. The `MultiEdit` and purge items reach it only as consequences.

### E-16
**Agree/Disagree:** Agree with the verdict. Agree with the reasoning.
- The skeleton's `seq: Date.now()` is not a sequence.
- Engine assignment through Step 7's `seq INTEGER PRIMARY KEY`, returned as `{id, seq}`, is the N16 fix at its cause.
- Routing faults raised before a repository is known to the home channel is AD-17.
- One dependency to note. This hunk names "Step 4's `ensureHome`" as the source of the home `diagnostics/` directory. My E-9 ruling keeps that helper and narrows what it creates on the handler's path. If the Step 4 correction is instead made as a separately named helper, this sentence must be renamed with it. As written it is correct against E-9's fix, which keeps `ensureHome`.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L2536-L2539]] "the caller no longer passes `seq`; the engine assigns it (Step 7's `seq INTEGER PRIMARY KEY`; the handler's `Date.now()` sequence collided within one millisecond — review N16), and the writer returns it."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L2539-L2542]] "`recordFault(store | null, diagnosticsDir, fault)` is unchanged; the handler passes the home-level `diagnostics/` directory (Step 4's `ensureHome`) whenever no repository is known (AD-17, G35)."
- [[middleware/context-oracle/ctxoracle/src/hook/handler.ts@2331baf:L233]] "seq: Date.now(),"
**Correct verdict:** keep. The change is the N16 and AD-17 fix, placed where the value and the directory are decided.

### E-17
**Agree/Disagree:** Agree with the verdict (replace). Agree with reasoning (1)–(3), (4)(a) and (4)(c). Disagree with (4)(b), which should be withdrawn, and (4)(c) is missing one inherited item.
- **(a) stands.** The reader does no stored-set ordering check, and ER M9's second item is not rejected on the record. Batch 3 part B marked AD-14 `replace` on exactly this, and the reader is where that check runs.
- **(b) falls, for three reasons.**
  - **It re-litigates a settled item.** Batch 3 part B's AD-14 entry ruled "keep … `tune`'s refusal" as AD-14/AD-20 specify it: the cap ordering and the trust factor in (0, 1]. It changed only the stored-set check. Adding a clause to the refusal changes a settled keep, and nothing new is cited: the clause comes from a later hunt's claim.
  - **The proposed invariant does not express the property it is meant to protect.**
    - AD-14 dampens by staleness and recency *before* trust ("dampen first (staleness, recency, trust)").
    - So with `bar.untrusted_trust_factor ≥ bar.high_confidence_min`, a fact reaches the tier only when its evidence ratio is 1 *and* staleness and recency take nothing off. At trust = 0.8 and high = 0.8 the invariant passes, yet no real "strong-evidence" fact reaches the tier.
    - The entry's own arithmetic, "with the seed 0.9, a ratio ≥ 0.889 reaches it", has the same omission. It holds only with no staleness or recency dampening.
    - "Strong-evidence" has no numeric definition in AD-14. So there is no invariant a validator can derive from that sentence without inventing a threshold, and the sentence describes the seed's effect ("seed 0.9 … so …").
  - **Lowering trust below the high tier is not a silent failure.** The tier only decides whether a whisper carries `[confidence: uncertain]`; the value "decides only whether the … flag is shown". FR-A5a has uncertain facts spoken, with a flag. So a low trust factor flags every mined whisper visibly and silences nothing.
  - Setting it is a calibration the spec leaves to Phase A data (`D-6bar`; the seeds are "illustrative … calibrated on Phase A data"), and refusing it would block a legitimate calibration. This is a question for AD-14's architecture, not a plan defect. The plan followed AD-20's stated check list exactly.
- **(c) misses one inherited item.** It correctly carries batch 3's `lexicon.fix_keywords` vocabulary (part B E-14) and the `miner.chunk_ms` yield (part B E-7). Batch 3's verification also rules for AD-14 "the 0.9 seed stated as unsourced". This step seeds `bar.untrusted_trust_factor` = 0.9 as `architecture_default`, "values AD-14 … state, each marked illustrative", so it inherits that correction too.
- **Missed (a consequence of a batch-3 `replace`).** The reader writes on the event path. A missing key is "re-seeded from `tuning_seeds.ts` (the seed row written …)", and the handler builds and passes the reader for each event, per Step 6's `tuning: TuningReader` and this step's own `onMissing` wiring. Batch 3 settled that the handler opens the global store **read-only**, correction item 3.
  - On that handle the re-seed write fails.
  - On a writable handle it breaks the correction and takes the global write lock inside the event budget.
  - The plan could not know the batch-3 ruling at `2331baf`, but it now builds on it. The reader must say what it does on a read-only handle: return the seed value and call `onMissing` without writing. Re-seeding is left to writable verb runs.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L2771-L2778]] "AD-14's ordering invariant, enforced where `tune` writes (Step 33): after the write, `bar.confidence_floor ≤ bar.suspect_confidence_cap < bar.high_confidence_min` and `bar.confidence_floor ≤ bar.heuristic_confidence_cap < bar.high_confidence_min` must hold and `bar.untrusted_trust_factor` must lie in (0, 1];"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L2779-L2781]] "**New `architecture_default` scalars** (values AD-14, AD-12, AD-26 state, each marked illustrative there): `bar.high_confidence_min` = `0.8`, `bar.untrusted_trust_factor` = `0.9`,"
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L1467-L1468]] "`confidence` from `cochange_pairs`, dampened by staleness (`FR-K7`) and recency, then dampened by trust (`FR-X4`: low trust lowers confidence)."
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L1484]] "**Composition:** dampen first (staleness, recency, trust), then take the"
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L1474-L1477]] "evidence ratio × `bar.untrusted_trust_factor` (seed 0.9, in (0, 1]), so a strong-evidence repo fact can still reach the high tier and a weaker one cannot."
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L1486-L1489]] "raw evidence (\"17 of its last 20 changes\"); the confidence value itself is never printed — it decides only whether the `[confidence: uncertain]` flag is shown, so no whisper states a number that contradicts its own evidence."
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@2331baf:L242-L243]] "**FR-A5a — Uncertain hazards are spoken, with their confidence flagged `[OL-C4]`.**"
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B3b.md@HEAD:L268]] "**Verdict:** replace — keep the dampener, the two caps in [floor, high), composition, display, the marked seeds and `tune`'s refusal; add the check on a stored set that violates the ordering (fault and use the seeds), or reject M9's second item on the record."
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B3-verification.md@HEAD:L140]] "E-13: the stored-set ordering check; the 0.9 seed stated as unsourced."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L2761-L2764]] "list key, the member rows of whichever level has any. A key with neither is re-seeded from `tuning_seeds.ts` (the seed row written with its seed `source`), `onMissing(key)` is called once for it, and the seed value is"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L2766-L2767]] "The handler passes `onMissing = key => recordFault(projectStore, diagnosticsDir, {code:"
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B3-verification.md@HEAD:L165]] "- Open the global store read-only."
- Derivation: confidence = ratio × s × r × t, with staleness factor s ≤ 1, recency factor r ≤ 1 and trust t (AD-14's order). With t = h = 0.8 the invariant t ≥ h holds, but confidence ≥ 0.8 needs ratio × s × r = 1. With t = 0.9, confidence ≥ 0.8 needs ratio × s × r ≥ 0.889, not ratio ≥ 0.889. So t ≥ h is necessary for reachability and not sufficient for "a strong-evidence fact can reach the tier".
**Correct verdict:** replace. Keep the reader, the validator, the seeds and the three tests. Add the stored-set ordering check (fault and serve the seeds), or reject ER M9's second item on the record. Mark the 0.9 trust seed unsourced, and let `lexicon.fix_keywords` and `miner.chunk_ms` follow batch 3's AD-15 and AD-26 corrections. State the reader's behaviour on the read-only global handle batch 3 requires on the event path: serve the seed and call `onMissing` without writing, and re-seed only on a writable verb run. Do **not** add the `trust ≥ high` clause to `checkTuningWrite` or `T-12-3`. Whether a lower trust factor should be refusable is an AD-14 question for the architecture, and it needs a defined reachability target first.

