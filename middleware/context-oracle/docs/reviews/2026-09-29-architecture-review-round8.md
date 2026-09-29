# Round-8 independent review of the Phase A architecture (revision `35d38f1`)

**Verdict: FAIL.** Two Serious findings are open (R8-1, R8-2). There is no Critical finding. 2 Moderate and 3 Minor findings are written down below, each with its required change.

Reviewed: `middleware/context-oracle/docs/architecture-phase-a.md` at `35d38f1` (`HEAD`). The last commit fixes round 7. I read its whole architecture diff (`git diff -U2 HEAD^ HEAD`, 587 lines) and, at `HEAD`, all of the text it touches or depends on:
- AD-3's key rule;
- AD-4's schema check, legacy-store spawn, mapping, rebuild steps, failure, file test, rows after the rebuild, and `status`;
- AD-5's import;
- AD-13's mined-with values, recompute, epoch, mine and crash rule;
- AD-17's home-level channel;
- AD-20's purge;
- AD-23's miss path;
- AD-24's rebuild case;
- AD-26's lock;
- L18 and the standards table.

Inputs read before judging:
- `middleware/context-oracle/CLAUDE.md` and `OWNER-LEDGER.md` CONFIRMED.
- The spec: §11 (FR-K, FR-J) and the acceptance criteria.
- In `docs/reviews/`:
  - the correction register (root causes; the architecture corrections);
  - the gap settlements (C-3 in full) and their review;
  - the store-recovery and human-rows rulings, the schema ruling, and both coordinator fact files;
  - the two hook files;
  - rounds 1 to 7, and the 2026-09-28 collapse hunt (M-17 and M-18 in full);
  - the three evidence directories, READMEs first. For the round-7 directory I read the whole `rebuild.mjs`, `test-rebuild.mjs`, `mutants.sh` and `designed-build.sh`, and every file in `results/`.

I wrote none of the document and no earlier review. I changed no repository file, made no commit and changed no git state.

What I ran (Node v22.22.2, git 2.43.0). The work directory is `scratchpad/archr8/w`. Its builds, stores and repositories were copied (`cp -a`) from `scratchpad/verify-rb.pU4N/`, which I did not modify.
- The round-7 README's steps 3 to 6:
  - `designed-build.sh` gave the same one-line diff;
  - the acceptance run gave `1519 checks passed, 0 failed`, exit 0;
  - the `HEAD`-validator run gave `1474 checks passed, 45 failed`, exit 1;
  - `mutants.sh`: all 18 mutants make the test exit 1.
- My added cases, against the committed round-7 prototype, unchanged. Each case is named in the last section.
- Web sources fetched with `curl`:
  - SQLite `src/pager.c`;
  - Flyway `ChecksumCalculator.java`;
  - `git-scm.com/docs/gitattributes`;
  - POSIX `unlink`.

## Findings

| ID | Severity and justification | Introduced by last revision | Location | Finding | Evidence | Required change |
|---|---|---|---|---|---|---|
| R8-1 | **Serious.** The design cannot be built as written, and its literal reading breaks a CONFIRMED ledger line. For a binding miss while any legacy project store exists, R7-6 removed the handler's `repo_not_bound`. It then states the child's action for only two of the derived key's store states. For the third state, a current store, one passage makes the miss silent and another binds the checkout without `init`. The silent reading contradicts OL-10. It also contradicts AD-23's "the miss is visible", the CH H6 / ER M11 ruling that put a fault behind that word. The state is reachable: an orphan legacy store is kept forever by design, and a second clone or a moved checkout of an initialized git repository derives the same key. It is not Critical: no row is lost. | Yes. R7-6 moved the fault from the handler to the child. | AD-4 L989–993, L1337, L1383–1389; AD-17 L4168–4173; AD-23 L4903–4911, L4918–4925 | (1) The handler records no `repo_not_bound` for any miss while `projects/` holds a `store.db` with no `project.db`, and spawns the child. (2) The child "rebuilds the project store of that key when one is legacy". "When that key has no store, it records `repo_not_bound`". Nothing covers a key whose store is current, pending or refused. (3) Read literally, that miss writes nothing anywhere: the handler deferred the fault and the child has no rule. (4) L1337 says a run that finds the store current "redoes step 6", the binding. The prototype binds on `current` too. So the other reading is that the child binds any checkout that derives the key, a moved one or a second clone. AD-23 says such a checkout "misses until `init` is re-run there". Under that reading the binding happens only while an unrelated legacy store exists. Executed (Z3): with an orphan legacy store present, a `git clone` of rebuilt repository B derives B's key, `c6d653fb7aac`. That key's `project.db` exists, and the clone's root has no binding. The prototype run at the clone reports `current,current`, then binds the clone. No `repo_not_bound` is recorded. | E-1 | State the child's action for every state of the derived key's store. If legacy: rebuild and bind. If there is no store: record `repo_not_bound`. If current, pending or refused: record `repo_not_bound`. Or, if the design means the child to bind a current store's new root, state that as a departure from AD-23's miss rule, give its reason, and make it independent of whether an unrelated legacy store exists. Limit L1337's "redoes step 6" to the root the store's own rebuild bound: record that root in `store_rebuilt`, and redo the binding only for that root. Add an AD-24 case: an orphan legacy store, and a second clone of a rebuilt repository. The miss must be recorded, or the binding made, once per session. |
| R8-2 | **Serious.** A settled ruling is contradicted without a recorded reason, and the document asserts a property it does not have. M-17 of the collapse hunt, which AD-13 adopted, gives case 1's job as "a ratio never mixes two decay rates after the owner tunes `h`", tied to FR-K2. The R7-9 resume breaks that job on a reachable owner path: tune `h`, the long recompute is interrupted, tune `h` back. The mixed ratios persist with no fault, because the next pass finds the mined-with values unchanged. The design says "Resuming is exact". It is not Critical: no row is lost. | Yes. The round-6 text restarted the recompute, which is exact in this case (Z1). | AD-13 L2996–3009, L2968–2975, L3076–3081; schema L642–644 | The resumed recompute recomputes each row "from the stored `recompute_epoch`". It stores no half-life, so the rows after `recompute_done` take the current `h`, while the rows before it keep the interrupted pass's `h`. `mined_half_life_days` is written only in the final transaction. So after a tune back to the old value the next pass finds no difference, and the weights stay mixed. Executed on a model (Z1, bench-epoch's store with AD-13's order and watermark): mined at `h` = 365, recompute at `h` = 20, killed, tuned back to 365, next pass. The largest relative error of a confidence ratio against a fresh mine is between 1.000 and 10.11, for kills in the commits phase and in the pairs phase. The round-6 restart gives 6.850e-16 in every case, and the resume with `h` unchanged gives 0. A kill in the pairs phase is also wrong, because every weight is then at the interrupted `h`. Separately, `recompute_done` is "the last row it finished", but the recompute spans three tables. A row id alone does not say which table it belongs to, so the encoding is left to guess. | E-2 | Record the recompute's half-life beside `recompute_epoch`, and finish the recompute at both. The pass's final transaction then writes that half-life as `mined_half_life_days`, so the ordinary compare starts a new recompute if the current `h` differs. Or discard `recompute_done` and restart when the current `h` differs from the recompute's. State `recompute_done` as a table and a rowid. Correct "Resuming is exact" to the condition under which it holds. Add Z1's tune-back case to AD-24's recompute case. |
| R8-3 | **Moderate.** The document claims a safety property the design does not have, on a path it describes itself. Executed, the pages of a purged database appear inside a rebuilt one. It is not Serious: several independent conditions must coincide, and no owner row is lost, because the legacy file is kept. | Yes. The order and the "harmless" sentence are new. The rebuild's rename predates the revision. | AD-20 L4504–4512; AD-4 L1251–1254 and step 5; AD-5 L1969 | The purge deletes "each database file before its `-journal`, `-wal` and `-shm`", and says a leftover journal or WAL "is harmless: SQLite deletes a journal or WAL it finds beside an empty database". `pager.c` deletes it only when the database is empty at open (`nPage==0`). A file of the design that is populated before it is opened keeps the WAL: the rebuild's temporary file, renamed onto `project.db`. Step 1 discards the stale companions of the temporary name only, not those of the target name. Executed (Z2):<br>(a) a stale `project.db-wal` beside a file created empty is deleted;<br>(b) the same WAL beside a populated file renamed in turns that file into the purged database (50 purged rows, `quick_check ok`).<br>Executed through the prototype (Z6, Z6b): a hot `project.db-wal` from a killed writer, and the purge killed after it unlinked `project.db`. A `store.db` then appears, as an old build re-creates it, and the rebuild renames onto the name. The new store then holds a `schema_meta` key written only in the purged store, including when it was rebuilt from store C's file of the other layout. AD-5 itself records the precondition: "A concurrent hook process keeps the WAL alive". | E-3 | Before every rename onto a new-name store, the rebuild deletes that name's `-journal`, `-wal` and `-shm`, under its lock and after the absent re-check. With the new name absent they belong to no live database. The rebuild inside `import` and `init`'s creation must do the same if they rename. Restrict the "harmless" sentence to a creation that opens the name empty. Add Z6's case to AD-24. |
| R8-4 | **Moderate.** R7-3's own choice has a correctness cost: an owner's readable rows of a known-layout file are served by nothing and carried by no route. The rejection of the alternative rests partly on a false premise. It is not Serious: every row is kept and named, and the purge refuses, so the recorded departure's requirement (every human-entered row copied or, where it is not, named, kept and protected by the refusal) holds. | Yes | AD-4 L1356–1375; round-7 `rebuild.mjs` L175, L376–381, L485 | (1) A known-layout file with one corrupt page in a non-owner table is handled as unreadable. None of its owner rows are carried. Executed (Z4): store B, with `session_log`'s root page overwritten, keeps `human_facts` 2, `corrections` 4, `questions` 3 and `invariants` 1 readable in the kept file, and the rebuilt store holds 0 of each. Store C (the other layout) gives 3, 4, 4 and 1 against 0. The store is then current, so no later run reads the file again. (2) The rejection says carrying the readable tables needs "a record the rule must read table by table". The record and the rule are already per table: `legacyDigests` and `legacyCounts` are keyed by table, `changedSince` is computed per table, and a whole table is already recorded unplaced with its `rows`. Its `files` argument covers only rows that carry a file id. For those, the existing rule already records them unplaced, since a row "whose file id has no legacy `files` row is not written". (3) The prototype classifies by error code alone, inside a block that also writes the new store. So a `SQLITE_CORRUPT` from the new file, a machine fault the design means to retry, would be recorded as a permanent property of the legacy file. The text says "a read of the legacy file". | E-4 | Carry the tables that read, as the round-7 review required. Record a table whose read fails as an unplaced whole-table entry with `rows` null and its error. Rows whose `files` row cannot be read are unplaced by the existing rule. The file is then not fully carried, so the purge still refuses. Attribute the error to a statement on the legacy connection, and let an error from the new store fail the rebuild. Or keep the choice and record why serving none of the owner's rows is acceptable, with its cost stated in `status`. Correct the rejection's premise either way. |
| R8-5 | **Minor.** A settled ruling's message requirement is unmet on a new path, and the new record rule gives false refusals. Rows stay safe, since every error is in the refusing direction. | Yes. Record selection by `legacyPath` is R7-4's, and the not-rebuilt counts are R7-5's. | AD-20 L4524–4532, L4559–4566; round-7 `rebuild.mjs` L468, L476 | (1) After an import, or when the home is reached by another spelling of its path, the rule returns `no rebuild record` with no counts. The message list gives counts for "a legacy file not yet rebuilt" and names `ctxoracle index`, which does not apply here: `project.db` exists, so `index` rebuilds nothing. So store-recovery item 4's "how many rows would be lost" is not met for this case. (2) `legacyPath` is compared as a string. Executed (Z5): a store rebuilt through a symlinked home is `null` (fully carried) through that spelling. Through the realpath it is `no rebuild record`, and a copied home also gives `no rebuild record`, although every owner table's count is equal in both files. The false refusal leaves the owner only `--discard-human`, which also lifts the listed-rows refusal. (3) For a file not yet rebuilt, "every row of which would be lost" counts derived tables (`symbols`, `commits`, `fts_*` and others) that the first index recreates. | E-5 | Compare the realpath of the legacy file with a realpath recorded in `store_rebuilt`. Or key the record by the file's path relative to the home, and mark import's rebuild record with its origin. For a file with no record, give its per-table counts from the layout's carried rules, and name no command where none would rebuild it. Count only carried tables as rows that would be lost. |
| R8-6 | **Minor.** AD-24's instruction cannot be followed literally. The test is bound to the prototype: it spawns the round-7 `rebuild.mjs` as the rebuild, runs its `--purge-files` as the purge, and imports `legacyNotCarried`, `legacyProjects`, `migrationChecksum` and `detectLayout` from it. So "the rebuild's implementation must pass unchanged" is impossible without rebinding. Round 7 added two more bindings (`purgeFiles`, `migrationChecksum`). | Partly. The wording is round 6's, and the new bindings are round 7's. | AD-24 L5123–5125; round-7 `test-rebuild.mjs` L31, L63, L555 | The acceptance case names the test "whose checks the rebuild's implementation must pass unchanged". What may change (the entry point and the five imported functions) and what may not (every assertion) is not said. So an implementer must guess whether rebinding counts as changing the test. | E-6 | Name the interface the implementation substitutes: the rebuild entry point, the purge's deletion, the legacy-file rule, the file test, the checksum function and the layout detector. Say that only these bindings change and every `check` stays as it is. |
| R8-7 | **Minor.** The epoch and cap that a pass's own work uses around a case-1 recompute are unclear. The literal reading mixes two epochs, the F5-6 defect the marker exists to prevent. The unclear text predates the last revision, and R7-9's resume adds the cap question. | Partly (the cap under resume) | AD-13 L3056–3061, L3270–3276, L2996–2999 | A mined commit's weight is "computed with the store's `E`", and the store's `E` is `schema_meta.weight_epoch`. A full recompute "sets it to the recomputing pass's `refTs`", but `weight_epoch` is written only in the final transaction. So a pass that runs or finishes a recompute, then mines new commits, reads the old epoch by the letter. Also, a recompute caps `ts` "at `refTs`". A resumed recompute's rows would then be capped at two different `refTs` values, unless the cap is the recompute's epoch. | E-7 | State that once `recompute_epoch` is set, the pass's recompute, evictions and mine all use it as `E`, and cap `ts` at it. State that the final transaction writes it as `weight_epoch`. |

Counts: Critical 0, Serious 2, Moderate 2, Minor 3 (7 findings). Introduced by the last revision: 5 wholly (R8-1, R8-2, R8-3, R8-4, R8-5) and 2 partly (R8-6, R8-7).

Serious findings, one line each:
- **R8-1**: R7-6 left the child without a rule for a derived key whose store is current. Read literally, a moved or second checkout's miss is recorded nowhere while any legacy store exists (OL-10, AD-23). L1337 and the prototype read it as an undocumented auto-binding.
- **R8-2**: R7-9's resume recomputes the rows after `recompute_done` at the current `h` and stores no half-life. A tune, an interruption and a tune back leave ratios mixing two decay rates with no fault. That breaks M-17's job, while the text claims "Resuming is exact" (Z1: error up to 10.11, where a restart gives 6.850e-16).

## 1. The round-7 fixes, each at its root cause

| Finding | Applied at the root cause? |
|---|---|
| R7-1 | **Yes.** The test takes the build as an argument, the one pinning check expects the designed outcome, and AD-4 and AD-24 say which run is acceptance and which is `HEAD`-only. Reproduced: 1519/0 with the stand-in, 1474/45 with `HEAD`'s validator, and the new mutant fails 45 checks. AD-4 L1226–1235 now describes the test's either-outcome check truthfully (test L140–152). The test's binding to the prototype: R8-6. |
| R7-2 | **Yes.** The checksum reads CRLF as LF, one rule with the layout test. The Flyway and gitattributes quotes are on the fetched pages, and the `eol` default is quoted from its own paragraph. The prototype records the normalised value, and the mutant fails 46 checks. The open path is not prototyped, as the README says. |
| R7-3 | **Partly.** The store is no longer stuck legacy, and a second run is a no-op (Y5 reproduced). The chosen exit leaves every readable owner row unserved, and the rejection's premise is false (R8-4). |
| R7-4 | **Yes, for the import case.** The rule selects the file's own record (Y3 reproduced) and no longer throws. The residuals, no counts on `no rebuild record` and path spelling: R8-5. |
| R7-5 | **Yes, for changed tables and unrebuilt files.** The counts sit beside the digests, and the bound's derivation is correct (at least now minus then, at most now). The gap for `no rebuild record`: R8-5. |
| R7-6 | **No.** The false `repo_not_bound` is gone, but the third store state has no rule (R8-1). The marker is now one file with one end of life, and AD-17 lists what it bounds. That part is resolved. |
| R7-7 | **Yes.** The conditional reason is withdrawn, with a record. The three remaining reasons stand. |
| R7-8 | **Order: yes, for the files the test creates. Claim: no.** Killed after each of its six deletions, the prototype never leaves the legacy definition, and the mutant fails. The "harmless" sentence is false for the rename path (R8-3). The concurrent-writer residual is stated with its POSIX basis. |
| R7-9 | **No.** The resume answers termination, but it breaks exactness under a change of `h`, and `recompute_done`'s encoding is unstated (R8-2). |
| R7-10 | **Yes.** `status` now names every way a key stops being derived, and states that no command carries those rows. |

## 2. The revision's own choices

- **R7-3: reuse the unreadable-file path, not set the file aside.** Reusing the path is minimal, deletes nothing, and ends the per-session respawn. It is the wrong trade for a file whose owner tables read. Its cost, owner rows served by nothing and carried by no route, is not stated as a cost. One of its three reasons is false (R8-4).
- **R7-4: key "fully carried" by path, not by digest.** Keying by the file, not by the latest record, is right. Z5 shows the string compare is fragile. A digest key would also be wrong, since the rule exists to detect changed digests. The better key is a canonical path, or a path relative to the home with an origin marker (R8-5). Every error is in the safe direction.
- **R7-8: the purge's deletion order.** Legacy file first and project store last is right: it keeps the file test false throughout (the round-7 test's six kills). Putting each database before its `-wal` avoids the other failure, a `project.db` left without its WAL. It needs the rebuild's rename to clear the target's companions (R8-3).
- **R7-8: the stated concurrent-writer residual.** It is accurate. No legacy build honours `reindex.lock` (`HEAD` has a claim row only). The POSIX quote supports "such a write is lost with the file". No portable check closes it. Renaming the file aside and re-digesting would narrow the window without closing it, so stating it is acceptable.
- **R7-9: the watermark order (commits, files, cochange_pairs).** The order is sufficient for exactness while `h` and the rows are unchanged. My Z1 control resumes with 0 error after kills in every phase. Each file and pair sum is recomputed from the join over the final weights. The indexer may insert or delete `files` rows between two passes, so "the set of rows does not change" is literally false. It is harmless: a new file row has no touches, and a deleted one is unreferenced. The order does not survive a change of `h`, and the cap needs an epoch (R8-2, R8-7).
- **R7-6: the handler writes the marker and defers the fault to the child.** It removes the false advisory, but it moves the fault to a process whose rule is incomplete (R8-1).

## 3. Data safety of owner-typed rows, both layouts

- **Normal path and kills.** Every owner-typed table arrives row for row on A and B (`b229c04`) and C (`4dd0f00`/`4e070ce`). The 14 kill points leave the legacy files byte-identical (1519 checks, reproduced).
- **Old-build writes after the rebuild.** Y1 on both layouts and Y2 are named with their counts (reproduced).
- **Import of a legacy export.** Y3 reproduced. After the modelled `backup()`, the local file reads `no rebuild record`, which is not carried, and the kept copy refuses the purge. The message has no count for it (R8-5).
- **Corrupt page.**
  - On both layouts (Z4 on B and C), no owner row is deleted and the purge refuses.
  - The readable owner rows are carried by nothing (R8-4).
- **Purge.**
  - Without the flag, it refuses on every tested path where a file holds rows no other file holds.
  - A path spelling or a home move refuses falsely (Z5, R8-5). That is the safe direction, but it steers the owner to the flag.
  - With the flag, it deletes everything but `reindex.lock` and never `global/global.db` (reproduced).
  - Killed mid-deletion with a hot WAL, then followed by a rebuild before a re-run: the new store takes pages of the purged one (Z6 on B's file, Z6b on C's; R8-3). No owner row is lost, since the legacy file is kept. But the rebuilt store's own content is shadowed.
- **Concurrent legacy writer during the purge.** The residual is stated, and not tested (it cannot be closed).
- **Miss path.** Rows are not at risk, but R8-1's miss is invisible.
- **Result.** No path I ran deletes an owner-typed row without `--discard-human`.

## 4. AD-4 against the round-7 prototype

**Matches, read against `rebuild.mjs` and re-run:**
- `migrationChecksum`, and the recorded `migration_sha256:*` values (L161, L293);
- the corrupt-page exit, with `ROLLBACK` (L376–391, L404–406);
- `unreadRows` with null for a table that cannot be counted (L171–173);
- `legacyCounts` beside `legacyDigests` (L278–289);
- the record found by `legacyPath`, and not carried on a read error (L470–483);
- the counts for a file not yet rebuilt (L468);
- `changedSince` with `rowsAtRebuild` and `rowsNow` (L485–486);
- `purgeFiles`' order (L503–514).

**Stated but not prototyped, each judged:**
- The schema check on open with the normalised checksum (AD-4, and AD-24's CRLF case). Acceptable: the function and the recorded value are shown, and the compare is the existing one.
- The handler's marker and the child's `repo_not_bound` (AD-4, AD-17, AD-23). Under-specified: R8-1.
- The recompute's resume (AD-13). Not exact: R8-2. I modelled it in Z1.
- The purge message's counts, and the purge's other bullets. The `no rebuild record` case: R8-5.
- The rebuild inside `import` (modelled by a file copy). Acceptable for what Y3 claims.
- The legacy-writer race. Acceptable as a stated residual.

**Stated differently from the prototype:**
- AD-4 says a run finding the store current "redoes step 6". The prototype binds any root whose key's store is current. AD-4's miss text and AD-23 say neither (R8-1).
- "A read of the legacy file that fails on its content". The prototype tests only the error code, inside a block that also writes the temporary store (R8-4 (3)).

## 5. Consistency, spec and backing

- **Contradictions found:**
  - AD-4 L1337 against L1386–1388 and AD-23 L4922–4924 (R8-1);
  - AD-13 L3005–3009 ("Resuming is exact") against its own mined-with rule (R8-2), and against the collapse hunt's M-17;
  - AD-20 L4509–4511 against `pager.c` for a file renamed in (R8-3);
  - AD-4 L1371–1372's premise against the record's shape (R8-4).
- **Spec and ledger.**
  - OL-10 (R8-1); FR-K2 through M-17 (R8-2).
  - AC-19 is unaffected: it applies to checksummed exports.
  - No new conflict with an NF or an AC.
- **Backing, re-fetched with `curl`.**
  - Flyway's "The checksum is encoding and line-ending independent" and its `readLine` loop are on the page.
  - Both gitattributes passages are on the page. The `eol` default comes from the paragraph for an unspecified `eol`, with `text` set.
  - `pager.c`: `pagerOpenWalIfPresent` deletes the WAL only when `nPage==0`, and `hasHotJournal` deletes a journal only in the same case. So the citation supports the sentence only for an empty file (R8-3).
  - POSIX `unlink`: the quoted passage is on the page.

## 6. What the last revision introduced

- Five findings are wholly the last revision's: R8-1 (R7-6's fix), R8-2 (R7-9's fix), R8-3 (R7-8's claim), R8-4 (R7-3's choice) and R8-5 (R7-4's and R7-5's fixes).
- Two are partly the last revision's:
  - R8-6: the wording predates it, and it added bindings.
  - R8-7: the epoch wording predates it, and it added the cap under resume.
- As in round 7, the regressions sit where the revision added mechanism with a text-only argument: the handler and child split, the watermark, the "harmless" sentence and the unreadable-path reuse.

## Added test cases (in `scratchpad/archr8/`)

- `z1-resume.mjs`, output `z1-resume.out`. **Z1** models AD-13's resume over bench-epoch's store, with a tune back of `h`. The same file holds the round-6 restart and a control with no tune back.
- `z2-stale-wal.mjs <dir>`, output `z2-stale-wal.out`. **Z2**: a stale `project.db-wal` beside (a) a file created empty and (b) a populated file renamed in.
- `extra8.mjs <work> <build>`, output `extra8.out`. It runs against the committed round-7 prototype:
  - **Z3**: a second clone of rebuilt repository B, with an orphan legacy store present;
  - **Z4**: a corrupt `session_log` page, on B and C;
  - **Z5**: a symlinked or copied home;
  - **Z6** and **Z6b**: the purge killed after `project.db` with a hot WAL, then a rebuild onto the name, from B's and from C's legacy file.
- Reproductions: `designed-build.out`, `test-rebuild.raw`, `test-head-validator.raw` and `mutants.raw`.

## Evidence

### E-1 (R8-1)
- [[middleware/context-oracle/docs/architecture-phase-a.md@35d38f1:L991-L993]] "It rebuilds the project store of that key when one is legacy."
- [[middleware/context-oracle/docs/architecture-phase-a.md@35d38f1:L992-L993]] "When that key has no store, it records `repo_not_bound` on the home-level"
- [[middleware/context-oracle/docs/architecture-phase-a.md@35d38f1:L1385-L1386]] "and the handler records no `repo_not_bound` for it (AD-23)."
- [[middleware/context-oracle/docs/architecture-phase-a.md@35d38f1:L1386-L1388]] "If that key's store is legacy, it rebuilds and binds, and the next event finds the binding. If that key has no store, the child records `repo_not_bound` (above)."
- [[middleware/context-oracle/docs/architecture-phase-a.md@35d38f1:L1336-L1337]] "After the rename, the store is current, and the next run redoes step 6."
- [[middleware/context-oracle/docs/architecture-phase-a.md@35d38f1:L4905-L4908]] "it records no `repo_not_bound`; on `SessionStart` and `UserPromptSubmit` it writes the marker and spawns AD-4's rebuild child"
- [[middleware/context-oracle/docs/architecture-phase-a.md@35d38f1:L4922-L4924]] "So a moved checkout, or a fresh clone carrying a committed `.claude/settings.json`, misses until `init` is re-run there, and the miss is visible."
- [[middleware/context-oracle/docs/architecture-phase-a.md@35d38f1:L1409-L1411]] "(deleted, moved while path-keyed, or re-rooted), the store is kept as it is"
- [[middleware/context-oracle/docs/architecture-phase-a.md@35d38f1:L554-L555]] "Full (non-shallow) git history present → identity = the **lexicographically smallest root-commit hash**"
- [[middleware/context-oracle/OWNER-LEDGER.md@35d38f1:L48-L48]] "Self-observability is required — **\"it could fail a hundred ways in front of me and I wouldn't know.\"**"
- [[middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r7/rebuild.mjs@35d38f1:L440-L440]] "if (p.state === 'rebuilt' || p.state === 'current') {"
- [[ran]] `node --no-warnings extra8.mjs w w/HEAD-designed` (in `scratchpad/archr8/`; case Z3) → `Z3: rebuild exit 0; clone exit 0; key of repoB c6d653fb7aac, key of the clone c6d653fb7aac, equal true; project.db of that key exists true; legacy projects ["deadbeef0000"]; binding of repoB c6d653fb7aac; binding of the clone null; prototype run at the clone: exit 0 states [{"scope":"global","state":"current"},{"scope":"project","state":"current"}]; binding of the clone after it c6d653fb7aac; repo_not_bound rows 0`

### E-2 (R8-2)
- [[middleware/context-oracle/docs/architecture-phase-a.md@35d38f1:L3001-L3004]] "every `commits` row by rowid for its weight, then every `files` row, then every `cochange_pairs` row, for their sums. Each of its transactions also writes `schema_meta.recompute_done`, the last row it finished, in that order"
- [[middleware/context-oracle/docs/architecture-phase-a.md@35d38f1:L3005-L3009]] "Resuming is exact: the order puts every weight before any sum, the pass finishes the recompute before its own evict and mine, so the set of rows does not change between the two passes, and each row is recomputed from the stored `recompute_epoch`."
- [[middleware/context-oracle/docs/architecture-phase-a.md@35d38f1:L2968-L2970]] "A changed `h`, a store missing a mined-with value while it holds weighted commits, or an epoch past its bound (below) is a full recompute"
- [[middleware/context-oracle/docs/architecture-phase-a.md@35d38f1:L2965-L2965]] "written **only in the pass's final transaction**"
- [[middleware/context-oracle/docs/architecture-phase-a.md@35d38f1:L3079-L3080]] "and case 1's full recompute, which resumes after `recompute_done`"
- [[middleware/context-oracle/docs/reviews/2026-09-28-architecture-collapse-hunt.md@35d38f1:L181-L181]] "a ratio never mixes two decay rates after the owner tunes `h`."
- [[middleware/context-oracle/docs/reviews/2026-09-28-architecture-collapse-hunt.md@35d38f1:L185-L185]] "a mixed-rate ratio is no recency weighting at all"
- [[ran]] `node --no-warnings z1-resume.mjs` (in `scratchpad/archr8/`) → `Z1 R7-9 watermark resume: killed after 2 transactions (recompute_done {"t":"commits","r":50}); after the next pass at h0: mined_half_life_days 365, recompute_epoch absent; max relative ratio error vs a fresh mine at h0 1.000e+0` / `Z1 R7-9 watermark resume: killed after 12 transactions (recompute_done {"t":"pairs","r":110}); after the next pass at h0: mined_half_life_days 365, recompute_epoch absent; max relative ratio error vs a fresh mine at h0 1.011e+1` / `Z1 round-6 restart from the first transaction: killed after 12 transactions (recompute_done absent); after the next pass at h0: mined_half_life_days 365, recompute_epoch absent; max relative ratio error vs a fresh mine at h0 6.850e-16` / `Z1 control, no tune back: killed after 12 transactions; max relative ratio error vs a fresh mine at h1 0.000e+0`

### E-3 (R8-3)
- [[middleware/context-oracle/docs/architecture-phase-a.md@35d38f1:L4505-L4506]] "each database file before its `-journal`, `-wal` and `-shm`"
- [[middleware/context-oracle/docs/architecture-phase-a.md@35d38f1:L4509-L4511]] "journal or WAL left beside a deleted database is harmless: SQLite deletes a journal or WAL it finds beside an empty database"
- [[middleware/context-oracle/docs/architecture-phase-a.md@35d38f1:L1251-L1253]] "It discards any temporary file an earlier rebuild left, with its `-journal`, `-wal` and `-shm` (F5-12: a stale WAL beside a re-created file is the mispairing `howtocorrupt.html` names)."
- [[middleware/context-oracle/docs/architecture-phase-a.md@35d38f1:L1969-L1969]] "A concurrent hook process keeps the WAL alive"
- [[middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r7/rebuild.mjs@35d38f1:L162-L162]] "function discard(p) { for (const s of ['', '-journal', '-wal', '-shm']) rmSync(p + s, { force: true }); }"
- [[middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r7/rebuild.mjs@35d38f1:L409-L409]] "renameSync(tmpPath, newPath);"
- [[https://raw.githubusercontent.com/sqlite/sqlite/master/src/pager.c]] "If the database is not empty and the *-wal file exists, open the pager"
- [[https://raw.githubusercontent.com/sqlite/sqlite/master/src/pager.c]] "exists if the database is not empty, or verify that the *-wal file does"
- [[https://raw.githubusercontent.com/sqlite/sqlite/master/src/pager.c]] "rc = sqlite3PagerOpenWal(pPager, 0);"
- [[ran]] `node --no-warnings z2-stale-wal.mjs z2` (in `scratchpad/archr8/`) → `Z2 (a) writer signal SIGKILL; before ["project.db","project.db-shm","project.db-wal"]; after unlinking project.db ["project.db-shm","project.db-wal"]; empty open: rows 0; files ["project.db","project.db-shm"]` / `Z2 (b) writer signal SIGKILL; before ["project.db","project.db-shm","project.db-wal"]; after unlinking project.db ["project.db-shm","project.db-wal"]; populated file renamed in: tables ["human_facts"]; human_facts rows 50; quick_check ok`
- [[ran]] `node --no-warnings extra8.mjs w w/HEAD-designed` (cases Z6, Z6b) → `Z6: rebuild exit 0; writer SIGKILL; before the purge ["diagnostics","project.db","project.db-shm","project.db-wal","store.db","store.db-shm","store.db-wal"]; purge SIGKILL after project.db, left ["project.db-shm","project.db-wal"]; legacy again ["c6d653fb7aac"]; rebuild exit 0 global:current: project:rebuilt:b229c04; the new project.db reads: layout of the record b229c04; z6 key 1; store_rebuilt records 1; quick_check ok` / `Z6b: rebuild exit 0; writer SIGKILL; before the purge ["diagnostics","project.db","project.db-shm","project.db-wal","store.db","store.db-shm","store.db-wal"]; purge SIGKILL after project.db, left ["project.db-shm","project.db-wal"]; legacy again ["c6d653fb7aac"]; rebuild exit 0 global:current: project:rebuilt:4dd0f00-4e070ce; the new project.db reads: layout of the record 4dd0f00-4e070ce; z6 key 1; store_rebuilt records 1; quick_check ok`

### E-4 (R8-4)
- [[middleware/context-oracle/docs/architecture-phase-a.md@35d38f1:L1369-L1370]] "Rows in the file's readable tables are not carried either: they stay in the kept file."
- [[middleware/context-oracle/docs/architecture-phase-a.md@35d38f1:L1371-L1373]] "it needs a partial copy, partial digests and a record the rule must read table by table"
- [[middleware/context-oracle/docs/architecture-phase-a.md@35d38f1:L1276-L1277]] "whose file id has no legacy `files` row is not written"
- [[middleware/context-oracle/docs/architecture-phase-a.md@35d38f1:L1489-L1490]] "every human-entered row is copied or, where it is not, named in `status`, kept in that file"
- [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-coordinator-ruling-correction-store-recovery.md@35d38f1:L38-L38]] "It carries every human-provenance row across."
- [[middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r7/rebuild.mjs@35d38f1:L485-L485]] "const changedSince = Object.keys(rec.legacyDigests).filter((t) => now.digests[t] !== rec.legacyDigests[t])"
- [[middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r7/rebuild.mjs@35d38f1:L175-L175]] "const fileUnreadable = (e) => e?.code === 'ERR_SQLITE_ERROR' && [11 /* SQLITE_CORRUPT */, 26 /* SQLITE_NOTADB */].includes(e.errcode & 0xff);"
- [[middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r7/rebuild.mjs@35d38f1:L381-L381]] "if (!fileUnreadable(e)) throw e;"
- [[ran]] `node --no-warnings extra8.mjs w w/HEAD-designed` (case Z4) → `Z4 B: session_log root page 38 overwritten; rebuild exit 0 rebuilt layout null; readable in the kept file: human_facts 2, corrections 4, questions 3, invariants 1 (first note "src/a.ts is written by hand; keep the export name"); in the rebuilt store: human_facts 0, corrections 0, questions 0, invariants 0; rule the file could not be read (database disk image is malformed)` / `Z4 C: session_log root page 33 overwritten; rebuild exit 0 rebuilt layout null; readable in the kept file: human_facts 3, corrections 4, questions 4, invariants 1 (first note "src/a.ts is written by hand; keep the export name"); in the rebuilt store: human_facts 0, corrections 0, questions 0, invariants 0; rule the file could not be read (database disk image is malformed)`

### E-5 (R8-5)
- [[middleware/context-oracle/docs/architecture-phase-a.md@35d38f1:L4524-L4526]] "means its own rebuild record exists (the latest `store_rebuilt` record whose `legacyPath` is that file)"
- [[middleware/context-oracle/docs/architecture-phase-a.md@35d38f1:L4531-L4532]] "A home moved to another path finds no record, so its legacy files read as not carried, the safe direction;"
- [[middleware/context-oracle/docs/architecture-phase-a.md@35d38f1:L4562-L4565]] "For a legacy file not yet rebuilt it gives the file's per-table counts, every row of which would be lost, and names `ctxoracle index`, which rebuilds it"
- [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-coordinator-ruling-correction-store-recovery.md@35d38f1:L48-L49]] "Its message states how many rows would be lost."
- [[middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r7/rebuild.mjs@35d38f1:L476-L476]] "if (got === undefined) return { reason: 'no rebuild record' };"
- [[ran]] `node --no-warnings extra8.mjs w w/HEAD-designed` (case Z5) → `Z5: rebuild via a symlinked home exit 0; rule through the same spelling null; through the realpath {"reason":"no rebuild record"}; home copied to another path {"reason":"no rebuild record"}; owner-table counts equal in the legacy file and the rebuilt store true`
- [[ran]] `node --no-warnings middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r7/test-rebuild.mjs <work> <work>/HEAD-designed` (case Y3) → `== Y3: export exit 0; layouts ["b229c04","b229c04"]; export rebuilt exit 0; local rebuild exit 0; own {"reason":"rows not carried","unplacedRows":1,"changedSince":[]}; after the import {"reason":"no rebuild record"}; rebuilt then unreadable {"reason":"the file could not be read (file is not a database)","rows":null}`

### E-6 (R8-6)
- [[middleware/context-oracle/docs/architecture-phase-a.md@35d38f1:L5123-L5125]] "the test is the round-7 evidence's `test-rebuild.mjs`, whose checks the rebuild's implementation must pass unchanged, run with the build's own tuning validator"
- [[middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r7/test-rebuild.mjs@35d38f1:L31-L31]] "import { RULES, legacyNotCarried, legacyProjects, migrationChecksum, detectLayout } from './rebuild.mjs';"
- [[middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r7/test-rebuild.mjs@35d38f1:L63-L63]] "return spawnSync(process.execPath, ['--no-warnings', path.join(HERE, 'rebuild.mjs'), '--home', home, '--repo', repo, '--head', HEADB], { env, encoding: 'utf8' });"
- [[middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r7/test-rebuild.mjs@35d38f1:L555-L555]] "return spawnSync(process.execPath, ['--no-warnings', path.join(HERE, 'rebuild.mjs'), '--purge-files', path.join(home, 'projects', k)], { env, encoding: 'utf8' }); };"

### E-7 (R8-7)
- [[middleware/context-oracle/docs/architecture-phase-a.md@35d38f1:L3059-L3061]] "`commits.weight`, computed with the store's `E`, `h` and this pass's `refTs`"
- [[middleware/context-oracle/docs/architecture-phase-a.md@35d38f1:L3269-L3270]] "where `E` is the store's weight epoch (`schema_meta.weight_epoch`)"
- [[middleware/context-oracle/docs/architecture-phase-a.md@35d38f1:L3273-L3275]] "a full recompute (the mined-with rule's case 1) sets it to the recomputing pass's `refTs` (M-18)."
- [[middleware/context-oracle/docs/architecture-phase-a.md@35d38f1:L3270-L3271]] "and `ts` is the commit's author time capped at `refTs`"

### Other evidence (sections 1–5)
- [[ran]] `sh middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r7/designed-build.sh <work>` → `210c210` / `<     if (!(halfLife >= 37)) {` / `---` / `>     if (!(halfLife >= 365.25 * v('miner.horizon_years') / 1022)) {`
- [[ran]] `node --no-warnings middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r7/test-rebuild.mjs <work> <work>/HEAD-designed` → `1519 checks passed, 0 failed` (exit 0)
- [[ran]] `node --no-warnings middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r7/test-rebuild.mjs <work>` → `1474 checks passed, 45 failed` (exit 1)
- [[ran]] `sh middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r7/mutants.sh <work> <work>/HEAD-designed` → 18 lines, each `test exit 1`, none `NOT APPLIED`; for example `mutant [R7-8: the purge deletes the project store first]: test exit 1; 1518 checks passed, 1 failed; first failure: FAIL`
- [[https://raw.githubusercontent.com/flyway/flyway/main/flyway-core/src/main/java/org/flywaydb/core/internal/resolver/ChecksumCalculator.java]] "The checksum is encoding and line-ending independent."
- [[https://git-scm.com/docs/gitattributes]] "line endings are converted on checkin and checkout"
- [[https://git-scm.com/docs/gitattributes]] "the default is eol=crlf on Windows and eol=lf on all other platforms"
- [[https://pubs.opengroup.org/onlinepubs/9699919799/functions/unlink.html]] "the removal of the file contents shall be postponed until all references to the file are closed"
