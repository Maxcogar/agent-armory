# Round-6 independent review of the Phase A architecture (revision `bab8430`)

**Verdict: FAIL.** One Serious finding is open (R6-1). There is no Critical finding. 3 Moderate and 8 Minor findings are written down below, each with its required change.

Reviewed: `middleware/context-oracle/docs/architecture-phase-a.md` at `bab8430` (`HEAD`). I read the last revision's diff in full (`git diff -U2 HEAD^ HEAD`, 36 hunks), then read at `HEAD` all of AD-4, and every other section the diff touches: the intro, data flow step 3, AD-5's purge and import, AD-12's reproduction notes, AD-13's crash rule and tolerance, AD-17's codes, AD-20's purge, AD-23's inventory and binding lookup, AD-24's rebuild case, AD-26's F5-10 table, L15 and L18. I read these inputs before judging: `middleware/context-oracle/CLAUDE.md`, `OWNER-LEDGER.md` CONFIRMED, and the spec. In `docs/reviews/` I read the store-recovery and human-rows rulings, the two coordinator fact files (the 2026-09-29 file corrects the 2026-09-28 one), rounds 4 and 5, the collapse hunt's M-1 to M-3, and the gap settlements' crash rule. I read the whole rebuild evidence directory: README, `rebuild.mjs`, `test-rebuild.mjs`, `synth.mjs`, the build scripts, both benches, and `out/`. I skimmed the other listed review files for rulings on the rebuild, the purge and the recompute. I wrote none of the document and no earlier review. I changed no repository file, made no commit and changed no git state.

What I ran, in `scratchpad/archr6/` (Node v22.22.2):
- `build-builds.sh`, `build-stores.sh` and `test-rebuild.mjs`. Result: `exit 0`, `stores exit 0`, `1400 checks passed, 0 failed`.
- `mutants.sh`: all 7 mutants make the test exit 1.
- `bench-epoch.mjs` and `pow-samples.mjs | pow-check.py`: the recorded figures reproduce.
- `archr6/extra.mjs`, my added cases, run against the committed prototype, unchanged:
  - X1: an unread legacy file and what the purge's counters see;
  - X2: two repositories on one home, with mixed layouts and an orphan legacy store;
  - X3: a legacy-build `tune` after the rebuild.
- Web pages, fetched with `curl` into `archr6/web/` and matched by the checker's fetcher: `sqlite.org/c3ref/wal_hook.html`, `c3ref/wal_autocheckpoint.html`, `wal.html` and `tc39.es/ecma262`.

## Findings

| ID | Severity and justification | Introduced by last revision | Location | Finding | Evidence | Required change |
|---|---|---|---|---|---|---|
| R6-1 | **Serious.** It contradicts a settled ruling without a recorded reason. Store-recovery item 4 says `deinit --purge` "refuses while the store holds human-provenance rows that have not been exported". Item 3 says an unknown schema's rows must be reported. AD-4's recorded departure claims both still hold ("every human-entered row is copied or ... named in `status`"). For an unread legacy file, neither holds. Under one of the document's own readings, a plain purge then deletes owner-typed rows. It is not rated Critical because the other reading is safe (AD-4 and AD-20 each say only `--discard-human` deletes a legacy file), and because no build writes an unknown-layout file: only a hand-edited, foreign or unreadable one reaches this path. | Yes. The unread path (exact layout match, "its rows are not read") and the purge's new rule "a legacy file whose rebuild carried everything is not a reason to refuse" (F5-7) are both new. | AD-4 L996–999, L1033–1037, L1322–1325, L1421–1430; AD-5 L1675–1680; AD-20 L4299–4311; `rebuild.mjs` L275–283, L317 | (1) **The deletion set of a plain purge is stated twice, differently.** AD-5 says a purge that is not refused "deletes the project directory's files, `reindex.lock` excepted", which includes a legacy `store.db`. AD-4 and AD-20 say the only path that deletes a legacy `store.db` is `--purge --discard-human`. F5-7's new sentence only makes sense under AD-5's reading. (2) **An unread legacy file is invisible to the refusal.** The refusal counts a legacy file only through `legacy_unplaced > 0` or rows gained against `legacyCounts`. For a file of no known layout, the prototype writes `legacy_unplaced` = `0` and records no `legacyCounts`. Executed (X1): the store D shape (one hand-added column) keeps 2 owner `human_facts` rows in the legacy file. The rebuilt store has 0 of them, `legacy_unplaced` is 0, and `legacyCounts` is absent. So neither counter refuses, and under AD-5's reading those rows are deleted without `--discard-human`. The store-recovery ruling also required that the rows of an unknown schema be reported. `status` says only that "nothing was carried", with no count. The cut `export-human` was the ruling's route, and no route now reads such rows. | E-1 | (a) Give one deletion set. A plain `--purge` deletes `project.db` and the replica rows and never a legacy file or a kept copy (fix AD-5 L1679), or the reverse, stated once. Then say which refusal bullets exist only because of that set. (b) Treat a legacy file of no known layout as holding uncarried rows. When it opens, record in `store_rebuilt` the row count of each table its `sqlite_master` lists, and set `legacy_unplaced` to their total. Then `status` and the purge's message give that count, and the refusal holds while the file exists. Say this in the store-recovery departure record (L1322–1325). (c) Add an AD-24 case: the store D shape, then `deinit --purge` without the flag refuses and names the count, and the legacy file survives. |
| R6-2 | **Moderate.** The owner-visible claim that rows an old build writes after the rebuild are reported is false for `tune`, the one owner verb that rewrites rather than appends. Nothing is lost: the legacy `global.db` is never deleted. But an owner tuning reverts with no report, which is the silent failure `OL-10` forbids. It is not rated Serious because no spec criterion or ledger line names this report. | Yes (F5-18 and L18 are new). | AD-4 L1275–1281; L18 (L5826–5837); AD-20 refusal bullet 2 | Detection compares **row counts** with the record's `legacyCounts`. Every build's `tune` deletes the key's rows and inserts one, so a scalar `tune` leaves the count unchanged. Executed (X3): after store A's rebuild, the `b229c04` build ran `tune bar.confidence_floor 0.7` on the legacy home. `legacyCounts.tuning` was 171 and the file still held 171 rows. The legacy file now serves 0.7 and the rebuilt store serves 0.65, and `status` would name nothing. L18 says the opposite: "Those rows — a `note`, a `tune`, the session history" are named "by table and count". An update to an existing row, such as a `questions` status change, is missed the same way. | E-2 | Record a content digest per table of the human-entered list at the snapshot, not only counts (for example a SHA-256 over the rows ordered by rowid), and keep counts for the other tables. `status`, the purge's bullet 2 and L18 compare the digests. Add an AD-24 case: a legacy-build `tune` after the rebuild is named by `status`. |
| R6-3 | **Moderate.** The new `legacy_pending:` rows have no end of life on several reachable paths. While any row remains, every binding miss on the machine is misreported and spawns a child. Nothing is lost, but the miss that AD-23 says "is visible" becomes a false `store_legacy` for good (`OL-10`), and the cost is a process on every prompt. | Yes | AD-4 L1200–1202, L1266–1273; AD-23 L4614–4626; data flow L264–277; AD-5 L1715–1716, L1746–1748 | A pending row is cleared only by that key's own rebuild (step 6). It is never cleared when: (a) the legacy store's repository no longer derives that key, because it was deleted, or it is a path-keyed checkout that moved, or its history was re-rooted (AD-3, L4); (b) it arrives in an imported global export, since `VACUUM INTO` carries `global_meta` and import phase 2 merges only bindings; (c) import phase 3 replaces the live global, which drops this machine's live pending rows, so that machine's un-rebuilt legacy project stores lose their automatic rebuild. Executed (X2): after both real repositories were rebuilt and bound, `legacy_pending:deadbeef0000` (a store whose repository is gone) remained. While such a row remains, every binding miss records `store_legacy` and "no `repo_not_bound`", and it spawns a child on each `SessionStart` and `UserPromptSubmit`. That child "exits having written nothing". A moved checkout, the case `repo_not_bound` exists to show, is then reported as a store awaiting its rebuild, forever. | E-3 | A child that finds its derived key not pending records `repo_not_bound` on the home-level channel, so the miss stays visible. `status` lists every pending key with its directory and states how to clear it. A pending row is deleted when its `projects/<key>/store.db` is gone or a `project.db` exists there. The pending-case spawn is made at most once per session, deduplicated like `repo_not_bound`. AD-5's global import keeps this machine's `legacy_pending:` rows and drops the imported ones, which name another machine's directories. |
| R6-4 | **Minor.** An executed claim describes `HEAD`'s validator, not the one AD-14 and AD-20 specify. | Yes | AD-4 L1136–1141, L1156–1162; AD-13 L3097–3098; AD-20 L4336–4337 | The merge is specified as "AD-14's validator exactly as `tune` checks a write". The evidence validated with `HEAD`'s `checkTuningWrite`, whose half-life floor is 37 days. The architecture's floor is `365.25 × miner.horizon_years / 1022`, about 1.79 days. The AD-4 claim that `bar.recency_half_life_days 10` is refused is therefore `HEAD`'s outcome. Under the designed validator, 10 is accepted and carried. The test is agnostic (it accepts either outcome), so nothing checks the designed rule on a carry. | E-4 | Say that the listed refusals are `HEAD`'s validator's. State that under AD-14's rules `bar.recency_half_life_days 10` is carried. Require the implementation's run of the test to use the build's own validator, and add a carried value that the designed rule accepts and `HEAD`'s refuses. |
| R6-5 | **Minor.** F5-10's rejection stands on the data, but its stated cause misreads the bench, and one claim is broader than the evidence. | Yes | AD-23 L4466–4470; AD-26 L5036–5047 | (1) The bench's "handler wait" times the whole handler transaction, its own `COMMIT` included, not the lock wait. In the second configuration, only the handler has automatic checkpointing on. By `wal.html`, it is then the handler's commits that run a checkpoint once the WAL passes 1,000 pages. The document instead attributes the 253.9–334.2 ms to "the gap's checkpoint writes the database while the handler commits". (2) The option round 4 actually named is the third configuration (checkpointing off on the handler, the pass checkpointing in its gap). The fair comparison is its 121.0–246.8 ms against the default's 80.1–158.9 ms, and on that comparison the rejection holds. (3) The third configuration also shows a PASSIVE checkpoint on another connection lengthening a handler write well past the pass's lock hold: the pass measured at most 100.0 ms, and the handler waited up to 246.8 ms. So "not the write lock another connection waits on" is true of the lock only. The residual is not only "the handler's own `COMMIT` running a checkpoint". A pass's automatic checkpoint also delays concurrent handler writes. That is latency, not a busy failure: none was seen. | E-5 | Say the waiter metric is the whole transaction, and attribute configuration 2's waits to the handler's own checkpoints. Name configuration 3 as round 4's option and rest the rejection on configurations 3 and 1. State that the residual includes the delay a concurrent checkpoint adds to handler writes. |
| R6-6 | **Minor.** A review finding was partly dropped without a recorded rejection (`CLAUDE.md`: "never silently dropped"). | Yes (the revision's application of F5-7) | AD-20 L4308–4311 | F5-7 required three things. The message was to say what `export` does not preserve (applied). A fully carried legacy file was not to count (applied). And with `--discard-human`, the legacy file and kept copies were to be moved to a named archive "rather than deleting them, or have `export` include them". The third is neither applied nor rejected: `--discard-human` still deletes both, and the document has no mention of an archive. | E-6 | Apply it, by moving the files to `~/.ctxoracle/archive/<repo-key>-<ts>/`, or reject it on the record with its reason, for example that the refusal message already names each file and the flag is explicit consent. |
| R6-7 | **Minor.** The rebuild writes and names `schema_meta` keys that AD-4's key list does not define. | Yes | AD-4 L595–634 (the key list), L1050 (mapping row), L1224–1228; AD-23 L4650–4653 | (1) `index_stale = '1'` is "Written fresh" and also "Not carried" in the same cell, but it is not a key of AD-4's list. F5-17's mechanism says the staleness check "sees `index_stale = '1'`", while AD-23's staleness spawn compares `index_head` with `HEAD`. The spawn still happens, because `index_head` is absent after a rebuild, but for a reason the text does not give. (2) `schema_version` is "Not carried (the first index and mine write them)", yet no step of the design writes it into a rebuilt store (the prototype does not), and AD-4 L595 lists it as a key. (3) `legacy_unplaced` is "the count of legacy rows the rebuild could not write", but the record counts unplaced *entries*: a no-writer table with n rows is one entry `{table, rows, reason}` (`rebuild.mjs` L306, L317). | E-7 | Define `index_stale`, or drop it and name `index_head`'s absence as the staleness trigger. State who writes `schema_version` in a rebuilt store, or that checksums replace it, as the global row says. Make `legacy_unplaced` a row count, and give the record's entry shape for a whole table. |
| R6-8 | **Minor.** A deterministic rebuild failure is re-run on every prompt. The same document stops spawning for a refused store because "its fix is the build's". | Partly. F5-11's text is new, and the re-spawn predates it. | AD-4 L972–973, L1246–1255; `rebuild.mjs` L280, L331–334 | A failure after step 1 — "a row the new layout refuses", or a legacy table with "no rule" — leaves the store legacy. "The next `SessionStart` or `UserPromptSubmit` spawns again." A deterministic failure therefore repeats the whole copy on every prompt, forever, and every event stays silent until the build changes. That is the refused store's situation, which is not re-spawned. Separately, the record's `stage` field, which `status` shows, is not produced by the prototype (its record is `{code, scope, legacyPath, error}`), so it is untested. | E-8 | Classify the failure. A deterministic one (a missing rule, a refused row) is recorded once and not re-spawned until the build's digest changes. A transient one (disk full, I/O) re-spawns. Name the stages, and assert `stage` in AD-24. |
| R6-9 | **Minor.** The layout test departs from the store-recovery ruling's "normalised" fingerprint without a recorded reason. | Yes | AD-4 L1008–1012; `rebuild.mjs` L124–127 | Layout identification compares `sqlite_master` rows exactly, as JSON strings. The ruling asked for "`sqlite_master.sql`, normalised". Every legacy runner executes the `.sql` files "read at runtime from the package's own src/ tree". So a store built from a checkout whose migration text differs only in line endings or whitespace (a `core.autocrlf` checkout, for example) matches no layout. Its owner rows are then unread (R6-1). This is not demonstrated on a real store. | E-9 | Normalise before comparing (line endings, and runs of whitespace outside string literals), or record why an exact match is chosen. |
| R6-10 | **Minor.** On a path that is not prototyped, one override now skips the only identity check, and the message does not say so. | Yes | AD-5 L1706–1710 | A legacy export has no `repo_key`, so with the `keying_mode` override it "takes the destination's key and mode". The override existed for "a copy whose `keying_mode` differs". It now also admits any repository's legacy export into this one, unchecked. The README lists "the rebuild of a legacy export inside `import`" as not prototyped. | E-10 | Make the import's message state that the export's repository cannot be verified and name the export's layout. Give it a separate flag, or state why the same one suffices. Add the AD-24 case for a legacy global export: which `projects/` directory its pending rows are computed from (see R6-3). |
| R6-11 | **Minor.** A reason given for a rejection rests on a property case 1 does not have, and an executed model is presented without saying it is a model. | Partly. The bullet and citation are new, and the termination claim predates them. | AD-13 L2810–2822, L2872–2878; AD-24 case (L4887–4891) | The alternative (a leftover `mining_in_progress` means a full recompute) is rejected partly because it would "give up the resume that makes repeated interruption terminate". But a full recompute, including the finish at `recompute_epoch`, keeps no range and restarts from its first transaction (the bench's finish calls `recompute(d, E)` from the start). Under repeated interruption it never completes. Near the half-life floor every branch switch starts one. So the "Why one rule" termination claim is false for case 1. Separately, AD-13 says "*Why a marker, executed*" without saying the bench is a 40-file, 400-commit model and not the miner, which the README states. | E-11 | Say that a full recompute restarts on each interruption and is outside the termination claim, or record a completed-range watermark beside `recompute_epoch` so that it resumes. In AD-13 and AD-24, say that `bench-epoch.mjs` models the recompute over a small synthetic store. |
| R6-12 | **Moderate.** The architecture's executed backing cites records that are not in the repository. The commands are committed and reproduce, which I checked by re-running them, so the claims are checkable and this is not Serious. But the cited records themselves (facts 1–7's `git` output, the per-column mapping table, the 1,400-check result, F5-16's re-run with the fetched files' sha256) do not survive the session. F5-16's fix, a provenance fix, points at one of them. | Yes | AD-4 L987, L1045, L1242, L1541; AD-12 L2455; AD-23 L4559; evidence `README.md` ("the recorded outputs in `out/`") | `out/` is ignored by the repository root `.gitignore` (`out/`), so none of the nine `out/*.out` files is in commit `bab8430`. `git show bab8430:…/out/bench-checkpoint.out` fails with "exists on disk, but not in 'bab8430'". A reader of `main` after the merge finds every `out/…` citation broken. | E-12 | Commit the outputs (add a negation such as `!middleware/context-oracle/docs/reviews/**/out/` to `.gitignore`, or rename the directory), in the same change that cites them. Otherwise cite each output's decisive line inline, in the architecture, where it is used. |

Counts: Critical 0, Serious 1, Moderate 3, Minor 8 (12 findings). Introduced by the last revision: 10 wholly (R6-1 to R6-7, R6-9, R6-10, R6-12) and 2 partly (R6-8, R6-11).

Serious finding, one line:
- **R6-1**: an unread (unknown-layout) legacy file's owner rows are counted by neither of the purge's refusal counters, and AD-5 and AD-20 give two different deletion sets for a plain purge. Under AD-5's reading, `deinit --purge` without `--discard-human` deletes owner-typed rows, against store-recovery items 3 and 4 and AD-4's own departure record. Executed: 2 owner rows kept, `legacy_unplaced` 0, no `legacyCounts`.

## 1. AD-4's rebuild against the prototype and the test

**Matches, read line by line against `rebuild.mjs` (and re-run):**
- Opening and snapshot:
  - the read-only open and one read transaction (L242–243);
  - identification by exact `sqlite_master` comparison with FTS objects aside (L124–136);
  - the temporary file in rollback-journal mode, with `-journal`, `-wal` and `-shm` discarded (L139–146).
- Fresh values:
  - the fresh FTS5 probe, `fts_state`, `repo_key`, `keying_mode`, checksums and `index_stale` (L255–261);
  - the seed rows and `legacy_pending:` per project directory (L263–273).
- Table rules:
  - every table rule in AD-4's tables, including the `4dd0f00`/`4e070ce` differences (`seq` by `(ts, rowid)`, `genre` and `subject_key` NULL, `segments_json` NULL; L71–78);
  - the per-key `schema_meta` lists (L91–102);
  - `files` rows created `in_tree = 0` with legacy provenance (L285–296);
  - `landmines` filtered to `human_stated`, `invariant_members` translated through the path;
  - `consumer_state` filtered to `path:` keys, and the dropped rows counted;
  - `whisper_audit.subject_key` NULL and counted;
  - `regret` recorded unplaced;
  - `whisper_stats` as-is or treated as a replica by layout.
- Tuning: owner rows grouped by key and validated against the temporary store's reader, then the key's rows deleted and the owner's inserted (L181–208).
- Record and rename:
  - the record written into the file before the rename (L316–322);
  - read transaction ended, file closed, renamed, then the JSONL copy (L324–329);
  - step 6's binding and pending delete in one transaction (L358–367).
- Crash: the 14 kill points (L236, 274, 308, 323, 326, 328, 352, 366).

Re-run: `1400 checks passed, 0 failed`. All 7 mutants make the test exit 1. The tuning figures reproduce: 0.65 served, `['who cares?']` served, two refusals, the untouched list at the seed, and no duplicated scalar.

**Stated in AD-4 but untested (not in the prototype or the test), each judged:**
- The locks, the re-check under them, and `rebuild_locked`. Sound as designed, and AD-24 names the case.
- The handler's spawn on a legacy global store or a pending row, and AD-23's range lookup. The range bound is right (`;` is 0x3B, one above `:`). The lifecycle is not: R6-3.
- `status` text, and the post-rebuild comparison: R6-2.
- The `stage` field of `store_rebuild_failed`: R6-8.
- The first index and mine after the rename. Only the path upsert's id is tested, with `HEAD`'s DAO. Acceptable, since the indexer does not exist yet.
- The import of a legacy export: R6-10 and R6-3 (b).
- The tuning validator: `HEAD`'s, not AD-14's (R6-4).
- `schema_version` and `index_stale`, as AD-4 names them: R6-7.
- The purge's treatment of an unread file: R6-1.

## 2. What the revision added beyond round 5

- **`legacy_pending:<key>` and step 6's binding (F5-5 extension).** Backed. Fact 4 (no legacy binding) is re-read in `out/facts.out`. Without a binding, the handler could not find any rebuilt project store. Minimal for the normal path, and tested (the `g7-global-done` kill checks the pending row; X2 shows two repositories bound and cleared). Its end of life is not: R6-3.
- **`recompute_epoch` (F5-6).** Backed by the model, which reproduces: error `1.000e+0` without the marker, `5.428e-14` with it. Consistent with the key list (L626–628), the crash rule and AD-24. Its termination and "executed" wording: R6-11.
- **New fault codes.** `store_rebuild_failed` and `rebuild_locked` are in AD-17 (L4030–4035) and AD-26. The deterministic-failure loop: R6-8.
- **L18.** Honest in scope. Its claim that `status` names a `tune` is false: R6-2.
- **Rollback-journal temporary build.** Correct: after a clean close nothing sits beside the renamed file, and step 1 removes a hot `-journal`. The opener's first read-write open sets WAL (persistent).

## 3. Round-5 findings as applied

| Finding | Applied at the root cause? |
|---|---|
| F5-1 | Yes. Subject keys are carried NULL. Non-`path:` consumer keys are dropped and counted. Deny `evidence_json` holds a target path and question ids (`answer_drift.ts` at `b229c04` L130), and question ids are carried as-is, so no id needs translation. |
| F5-2 | Yes. The key's rows are replaced. Mutant 1 fails 150 checks. |
| F5-3 | Yes. The validator runs before the write, and the list-key rule is withdrawn on fact 2. I re-read fact 2 at `59cc05c`: `addToList` and `removeFromList` have only seed callers. See R6-4. |
| F5-4 | Yes. |
| F5-5 | Yes, in the data flow and AD-23, plus the pending rows (R6-3). |
| F5-6 | Yes (R6-11). |
| F5-7 | Partly. R6-6 is the silent drop, and R6-1 is the gap the new rule opened. |
| F5-8 | Yes. The live-session tables are carried, and mutant 6 fails. |
| F5-9 | Specified, not prototyped (R6-10). |
| F5-10 | Weighed with measurement. The rejection's quotes are right, re-fetched: wal_hook "after the commit has taken place and the associated write-lock on the database released", and wal_autocheckpoint "a wrapper around sqlite3_wal_hook()". Its causal reading of configuration 2 is wrong (R6-5), but configuration 3 still supports the rejection. |
| F5-11 | Yes. A corrupt file is no longer a failure loop. R6-8 remains. |
| F5-12 | Yes. |
| F5-13 | Yes. |
| F5-14 | Yes. The bound is re-derived: `4·((n−1)·2^−53 + 1.6e−13)` gives 5.07e−12 at n = 10,000 and 4.5e−11 at n = 100,000. The ECMA-262 phrase was fetched and matches, and the worst `pow` error was 0.9507 ulp. |
| F5-15 | Yes. |
| F5-16 | Yes. The procedures are given, and `out/f5-16-bench-rerun.out` exists. |
| F5-17 | Yes, with the wrong key named (R6-7). |
| F5-18 | Mechanism defective (R6-2). |

## 4. Data safety of owner-typed rows, both layouts

- **Normal path.** Every owner-typed table arrives row for row, on A, B (`b229c04`) and C (`4dd0f00`/`4e070ce`). X2 shows the same on a home whose global store has the older layout and whose second project has the newer one: `human_facts` 2 and 3, `corrections` 4 and 4, `questions` 3 and 4, `lessons` 2, each equal to its legacy count. File references resolve to the same path.
- **Crash.** The kill at each of 14 steps leaves the legacy database files byte-identical, and the next run completes. No duplicates: the re-run is a no-op.
- **Two repositories.** Correct (X2). Keys are derived per repository and bound per repository. Two clones with one root commit share one key, which is AD-3's intent: the mkrepo stores A, B and C all derive `c6d653fb7aac`.
- **Wrong file.** Not found. Ids are translated by path, and a subject key is never carried.
- **Purge.** R6-1 (an unread file) and R6-6.
- **Old build still writing.** R6-2 (a `tune` goes unreported).
- **Import.** A checksummed export is as before. A legacy export: R6-10 and R6-3 (b)(c).
- **Result.** Nothing loses or duplicates an owner row on the paths the test covers. The one deletion of owner rows without `--discard-human` needs an unknown-layout legacy file and AD-5's reading of the purge (R6-1).

## 5. Consistency, spec, backing

- **Contradictions found.** AD-5 against AD-4 and AD-20 on the purge (R6-1). AD-4's executed tuning claim against AD-13 and AD-20's validator (R6-4). F5-17's `index_stale` against AD-23 (R6-7). No new conflict with an FR, NF or AC. AC-19's exclusion of legacy exports is consistent with AC-19's text, which exports and re-imports with the same build.
- **Backing.** The cited `out/` records are not committed (R6-12). Every figure in the revision that I re-ran reproduced: bench-epoch, pow, the F5-10 table's ranges (checked against `out/bench-checkpoint.out`, all 15 runs), and the test. The four web quotes match.

## 6. Regressions

Ten findings are wholly the last revision's (R6-1 to R6-7, R6-9, R6-10, R6-12) and two partly (R6-8, R6-11). The regressions sit where the revision added text: the purge rule, the pending rows, the post-rebuild comparison, and the explanatory text around new measurements.

## Evidence

### E-1 (R6-1)
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L997-L999]] "The only path that deletes one is"
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L998-L998]] "`deinit --purge --discard-human`, and it deletes only a project's `store.db`"
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L1033-L1035]] "A hand-edited, foreign or unreadable file lands here, and it is rebuilt from the repository: its rows are not read,"
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L1323-L1325]] "every human-entered row is copied or, where it cannot be placed, named in `status` and kept in that file."
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L1426-L1427]] "a legacy file holds rows the rebuild did not carry — `legacy_unplaced > 0`, or rows it gained after the rebuild;"
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L1430-L1430]] "A legacy file whose rebuild carried everything is not a reason to refuse."
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L1679-L1680]] "deletes the project directory's files, `reindex.lock` excepted, only while holding the reindex lock"
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L4310-L4310]] "It is the only path that deletes a legacy `store.db`."
- [[middleware/context-oracle/docs/reviews/2026-09-28-rebuild-mapping-evidence/rebuild.mjs@bab8430:L283-L283]] "report.legacyCounts = Object.fromEntries("
- [[middleware/context-oracle/docs/reviews/2026-09-28-rebuild-mapping-evidence/rebuild.mjs@bab8430:L276-L276]] "report.unread = true; // another layout: rebuilt from the repository; its rows are not read"
- [[middleware/context-oracle/docs/reviews/2026-09-28-rebuild-mapping-evidence/rebuild.mjs@bab8430:L317-L317]] "VALUES('legacy_unplaced', ?)`).run(String(report.unplaced.length));"
- [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-coordinator-ruling-correction-store-recovery.md@bab8430:L47-L48]] "**`deinit --purge` refuses** while the store holds human-provenance rows that have not been exported, unless `--discard-human` is passed."
- [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-coordinator-ruling-correction-store-recovery.md@bab8430:L44-L44]] "reports any row it could not read;"
- [[ran]] `node --no-warnings extra.mjs w` (in `scratchpad/archr6/`; case X1 copies store B, adds a column to the legacy `human_facts`, runs the committed `rebuild.mjs`) → `X1 exit 0 layout null unread true legacy_unplaced 0 legacyCounts absent legacy human_facts rows 2 new human_facts rows 0`

### E-2 (R6-2)
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L1277-L1279]] "`status` compares the legacy file's row counts with the record's `legacyCounts`. It names each table that gained rows, and by how many."
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L5830-L5831]] "Those rows — a `note`, a `tune`, the session history — stay in the kept legacy file"
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L5833-L5834]] "`status` names them by table and count, from the rebuild record's per-table legacy counts"
- [[middleware/context-oracle/ctxoracle/src/stores/dao/tuning.ts@bab8430:L33-L33]] "store.prepare('DELETE FROM tuning WHERE key = ? AND project_key IS NULL').run(key);"
- [[ran]] `HOME=$W/homeX3 CTXORACLE_HOME=$W/x3 node --no-warnings $W/b229c04/middleware/context-oracle/ctxoracle/dist/src/cli/dispatch.js tune bar.confidence_floor 0.7` (in `repoA`, on a copy of store A's rebuilt home) then a read of both global files → `bar.confidence_floor = 0.7` / `[exit 0]` / `tuning legacyCounts 171 now 171 legacy floor [{"value":"0.7","source":"owner"}] rebuilt floor [{"value":"0.65","source":"owner"}]`

### E-3 (R6-3)
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L1270-L1273]] "If not, it exits having written nothing, because the repository was never initialized. Once every legacy project store is rebuilt, no pending row remains and a miss is an ordinary miss."
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L4618-L4618]] "It records no `repo_not_bound`."
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L4621-L4622]] "**A binding miss while the global store holds a `legacy_pending:` row.** This is handled the same way."
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L1715-L1716]] "merge this machine's live bindings into the validated temporary global copy"
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L4633-L4636]] "So a moved checkout, or a fresh clone carrying a committed `.claude/settings.json`, misses until `init` is re-run there, and the miss is visible."
- [[middleware/context-oracle/docs/reviews/2026-09-28-rebuild-mapping-evidence/rebuild.mjs@bab8430:L270-L272]] "tmp.prepare('INSERT INTO global_meta(key, value) VALUES(?, ?)').run(`legacy_pending:${k}`, '1');"
- [[ran]] `node --no-warnings extra.mjs w` (case X2: store C's home, plus store B's project under a second repository's key, plus `projects/deadbeef0000/store.db`) → `X2 after repoC: 0 global:rebuilt:4dd0f00-4e070ce project:rebuilt:4dd0f00-4e070ce pending ["legacy_pending:2b9215453e99","legacy_pending:deadbeef0000"]` / `X2 after repoX: 0 global:current: project:rebuilt:b229c04 pending ["legacy_pending:deadbeef0000"] bindings 2`

### E-4 (R6-4)
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L1138-L1139]] "Each key's rows are checked with AD-14's validator exactly as `tune` checks a write"
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L1159-L1160]] "`bar.recency_half_life_days 10` and `bar.no_such_key 1` are refused, named with the reason"
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L3097-L3098]] "`bar.recency_half_life_days ≥ 365.25 × miner.horizon_years / 1022` (about 1.79 days at the seeded 5 years)"
- [[middleware/context-oracle/ctxoracle/src/stores/dao/tuning.ts@bab8430:L235-L235]] "if (!(halfLife >= 37)) {"
- [[ran]] reading store A's rebuilt `global_meta.store_rebuilt` (`archr6/w/test/A-clean`) → `"reason":"refused: setting bar.recency_half_life_days to 10 breaks: bar.recency_half_life_days (10) must be at least 37, or the co-change weights overflow for commits dated up to 2100"`

### E-5 (R6-5)
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L5043-L5045]] "it lengthens the wait the handler sees: the gap's checkpoint writes the database while the handler commits."
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L5045-L5047]] "The residual that stays is the handler's own `COMMIT` running a checkpoint, which is event latency"
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L4466-L4467]] "So a checkpoint lengthens the `COMMIT` call of the connection that runs it, but not the write lock another connection waits on"
- [[middleware/context-oracle/docs/reviews/2026-09-28-rebuild-mapping-evidence/bench-checkpoint.mjs@bab8430:L21-L21]] "single-row insert every 20 ms; handlerAuto 0 also sets wal_autocheckpoint = 0 on it."
- [[middleware/context-oracle/docs/reviews/2026-09-28-rebuild-mapping-evidence/bench-checkpoint.mjs@bab8430:L104-L106]] "try { s.transaction(() => ins.run(Date.now())); ok++; }"
- [[middleware/context-oracle/docs/reviews/2026-09-28-architecture-review-round4.md@bab8430:L13-L13]] "Either keep checkpoints off the event path (`wal_autocheckpoint = 0` on handler connections, the pass checkpointing in its gap)"
- [[https://sqlite.org/wal.html]] "then to run a checkpoint operation for each subsequent COMMIT until the WAL is reset to be smaller than 1000 pages."
- [[https://sqlite.org/c3ref/wal_autocheckpoint.html]] "is a wrapper around sqlite3_wal_hook() that causes any database on database connection D to automatically checkpoint after committing a transaction if there are N or more frames in the write-ahead log file."
- [[https://sqlite.org/c3ref/wal_hook.html]] "The callback is invoked by SQLite after the commit has taken place and the associated write-lock on the database released, so the implementation may read, write or checkpoint the database as required."
- [[/home/user/agent-armory/middleware/context-oracle/docs/reviews/2026-09-28-rebuild-mapping-evidence/out/bench-checkpoint.out@FILE:L12-L12]] "run 1 variant=gap handlerAuto=0 pass=" (a working-tree file, not committed: R6-12)
- [[ran]] `grep -o 'handlerAuto=0 pass=.*holdMax[^,]*\|waitMax[^,]*' out/bench-checkpoint.out` over the five configuration-3 runs → pass `holdMax` 100, 88.7, 85.6, 94.4, 88.7; waiter `waitMax` 246.8, 137.8, 139.3, 124.6, 121; `busy` 0 in each

### E-6 (R6-6)
- [[middleware/context-oracle/docs/reviews/2026-09-28-architecture-review-round5.md@bab8430:L19-L19]] "With `--discard-human`, move the legacy file and kept copies to a named archive directory outside `projects/<repo-key>/` rather than deleting them, or have `export` include them."
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L4308-L4309]] "With `--discard-human` it deletes every file in the project directory except `reindex.lock` (AD-26; M-32), the legacy file and the kept copies included."
- [[ran]] `grep -n archive middleware/context-oracle/docs/architecture-phase-a.md` → no output

### E-7 (R6-7)
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L1050-L1050]] "`index_stale = '1'`. **Not carried** (the first index and mine write them): `schema_version`, `index_head`, `index_stale`,"
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L1225-L1226]] "The next `SessionStart`'s staleness check sees `index_stale = '1'` and spawns the index"
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L4650-L4651]] "the reindex is spawned when `index_head` or the mined tip differs from a resolved `HEAD`"
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L595-L595]] "schema_meta(key TEXT PRIMARY KEY, value TEXT) -- schema_version, the per-migration"
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L599-L601]] "-- legacy_unplaced (the count of"
- [[middleware/context-oracle/docs/reviews/2026-09-28-rebuild-mapping-evidence/rebuild.mjs@bab8430:L306-L306]] "if (n > 0) report.unplaced.push({ table: t, rows: n, reason: r.why });"
- [[ran]] listing the rebuilt project store's `schema_meta` keys for store A (`archr6/w/test/A-clean`) → `["fts_state","index_stale","keying_mode","legacy_unplaced","migration_sha256:001_phase_a_project.sql","migration_sha256:001b_phase_a_fts.sql","pinned_interpreter","repo_key","store_created_at"]` (no `schema_version`)

### E-8 (R6-8)
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L972-L973]] "A refused store is not spawned for: its fix is the build's (above)."
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L1246-L1247]] "A failure after step 1 — a full disk, an I/O error, or a row the new layout refuses:"
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L1253-L1253]] "The next `SessionStart` or `UserPromptSubmit` spawns again"
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L1248-L1248]] "records `store_rebuild_failed` (`{legacyPath, stage, error}`) on the JSONL"
- [[middleware/context-oracle/docs/reviews/2026-09-28-rebuild-mapping-evidence/rebuild.mjs@bab8430:L332-L332]] "const detail = { code: 'store_rebuild_failed', scope, legacyPath, error: String(e?.message ?? e) };"
- [[middleware/context-oracle/docs/reviews/2026-09-28-rebuild-mapping-evidence/rebuild.mjs@bab8430:L280-L280]] "if (!(t in rules)) throw new Error(`${t}: no rule for this table`);"

### E-9 (R6-9)
- [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-coordinator-ruling-correction-store-recovery.md@bab8430:L30-L30]] "fingerprint of the store's own DDL (`sqlite_master.sql`, normalised)"
- [[middleware/context-oracle/docs/reviews/2026-09-28-rebuild-mapping-evidence/rebuild.mjs@bab8430:L127-L127]] "const have = JSON.stringify(legacy.prepare(MASTER).all());"
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L1008-L1011]] "A legacy file's layout is found by exact comparison."
- [[ran]] `git show b229c04:middleware/context-oracle/ctxoracle/src/stores/migration_runner.ts | sed -n 14,15p` → `// 'global' (002). The \`.sql\` files are read at runtime from the package's own` / `// src/ tree (shipped beside dist/), so tsc — which emits no .sql — needs no copy`

### E-10 (R6-10)
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L1708-L1709]] "It is refused unless the owner passes the same explicit override, and with it the rebuilt copy takes the destination's key and mode."
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L1692-L1693]] "whose `keying_mode` differs — a path-keyed store restored after a re-clone —"
- [[middleware/context-oracle/docs/reviews/2026-09-28-rebuild-mapping-evidence/README.md@bab8430:L173-L173]] "The rebuild of a legacy export inside `import`."

### E-11 (R6-11)
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L2819-L2821]] "into a whole-horizon recompute, which restarts from zero, and give up the resume that makes repeated interruption terminate"
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L2874-L2876]] "interrupted after `j ≥ 1` of them, resuming keeps the `j` and completes within `C` passes"
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L2810-L2810]] "*Why a marker, executed* (`bench-epoch.mjs` in the rebuild evidence):"
- [[middleware/context-oracle/docs/reviews/2026-09-28-rebuild-mapping-evidence/bench-epoch.mjs@bab8430:L86-L86]] "if (pending) recompute(d, Number(pending.value), { marker });"
- [[middleware/context-oracle/docs/reviews/2026-09-28-rebuild-mapping-evidence/README.md@bab8430:L176-L177]] "`bench-epoch.mjs` models the recompute's transactions over a small store. It"
- [[ran]] `node --no-warnings middleware/context-oracle/docs/reviews/2026-09-28-rebuild-mapping-evidence/bench-epoch.mjs` → `killed after 8 of 16 transactions; next pass at the newer tip: past bound false, recompute_epoch absent; max relative ratio error vs fresh 1.000e+0` / `killed after 8 of 16 transactions; next pass at the newer tip: past bound false, recompute_epoch set; max relative ratio error vs fresh 5.428e-14`

### E-12 (R6-12)
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L1242-L1242]] "`out/test-rebuild.out`: `1400 checks passed, 0 failed`)."
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L2455-L2455]] "The rebuild evidence's `out/f5-16-bench-rerun.out` records that run on"
- [[middleware/context-oracle/docs/architecture-phase-a.md@bab8430:L987-L987]] "it in `out/facts.out`)."
- [[ran]] `git check-ignore -v middleware/context-oracle/docs/reviews/2026-09-28-rebuild-mapping-evidence/out/facts.out` → `.gitignore:8:out/	middleware/context-oracle/docs/reviews/2026-09-28-rebuild-mapping-evidence/out/facts.out`
- [[ran]] `git show bab8430:middleware/context-oracle/docs/reviews/2026-09-28-rebuild-mapping-evidence/out/bench-checkpoint.out` → `fatal: path 'middleware/context-oracle/docs/reviews/2026-09-28-rebuild-mapping-evidence/out/bench-checkpoint.out' exists on disk, but not in 'bab8430'`

### Other evidence (sections 1, 3 and 5)
- [[ran]] `sh build-builds.sh $S/w "$PWD"; sh build-stores.sh $S/w; node --no-warnings test-rebuild.mjs $S/w` → `npm run build exit 0` (×3) / `stores exit 0` / `1400 checks passed, 0 failed` / `test exit 0`
- [[ran]] `sh mutants.sh $S/w` → 7 lines, each `test exit 1` (for example `mutant [owner tuning row inserted beside the seed (F5-2)]: test exit 1; 1250 checks passed, 150 failed`)
- [[ran]] `node --no-warnings pow-samples.mjs 100000 | python3 pow-check.py` → `samples 100000 worst error 0.9507 ulp at x = -76.48335844748858`
- [[https://tc39.es/ecma262/]] "returns an implementation-approximated value"
- [[https://sqlite.org/wal.html]] "which does as much work as it can without interfering with other database connections, and which might not run to completion if there are concurrent readers or writers."
- [[ran]] `git grep -nE "removeFromList|addToList" 59cc05c -- middleware/context-oracle/ctxoracle/src` → only `dao/tuning.ts` L40, L54 (definitions) and L66 (`seedDefaults`)
