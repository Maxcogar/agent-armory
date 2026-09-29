# Round-9 independent review of the Phase A architecture (revision `4375255`)

**Verdict: FAIL.** Two Serious findings are open (R9-1, R9-2). There is no Critical finding. 3 Moderate and 4 Minor findings are written down below, each with its required change.

Reviewed: `middleware/context-oracle/docs/architecture-phase-a.md` at `4375255` (`HEAD`). The last commit fixes round 8. I read its whole architecture diff (`git diff -U3 HEAD^ HEAD`, 764 lines) and, at `HEAD`, every passage it touches or depends on:
- the schema comment for `recompute_pending`;
- AD-4's legacy spawn, rebuild steps 3 to 6, crash, failure, the unreadable-file and table-by-table rules, the binding states, and `status`;
- AD-5's import;
- AD-13's mined-with rule, both cases, the recompute, epoch, cost, crash rule and C-3 claim;
- AD-17's home-level channel;
- AD-20's purge and its message;
- AD-23's miss path;
- AD-24's rebuild and recompute cases;
- AD-26's `store_busy` sentence;
- L19 and the standards table.

Inputs read before judging:
- `middleware/context-oracle/CLAUDE.md` and `OWNER-LEDGER.md` CONFIRMED.
- The whole spec.
- In `docs/reviews/`:
  - the correction register (its method, root causes, R-24, R-34, R-35);
  - the gap settlements (C-3 in full) and their review;
  - the store-recovery and human-rows rulings, the schema ruling, both coordinator fact files, and the two hook files;
  - rounds 1 to 8, and the 2026-09-28 collapse hunt (M-17 to M-20 in full);
  - the four evidence directories, READMEs first. For the round-8 directory I read the whole `rebuild.mjs`, `recompute.mjs`, `test-rebuild.mjs`, `test-recompute.mjs`, `mutants.sh` and `designed-build.sh`, and its `results/`.

I wrote none of the document and no earlier review. I changed no repository file, made no commit and changed no git state.

What I ran (Node v22.22.2, git 2.43.0). The work directory is `scratchpad/archr9/w`. Its builds, stores and repositories were copied (`cp -a`) from `scratchpad/verify-rb.pU4N/`, which I did not modify. The mutant run used a second copy, `scratchpad/archr9/wm`.
- The round-8 README's steps 3 to 7:
  - `designed-build.sh` gave the same one-line diff;
  - the acceptance run gave `1537 checks passed, 0 failed`, exit 0;
  - the `HEAD`-validator run gave `1492 checks passed, 45 failed`, exit 1, every failure the designed-outcome check;
  - `test-recompute.mjs` gave `105 checks passed, 0 failed`, exit 0;
  - `mutants.sh`: all 35 mutants make their test exit 1 and none is `NOT APPLIED`. Three end with an uncaught error (section 2).
- The three crash-ending mutants, each run once as committed and once with the test's three unguarded statements guarded (section 2).
- My added cases, against the committed round-8 prototype and model, unchanged. Each is named in the last section.
- Web sources fetched with `curl`: SQLite `src/pager.c` and `sqlite.org/wal.html`.

## Findings

| ID | Severity and justification | Introduced by last revision | Location | Finding | Evidence | Required change |
|---|---|---|---|---|---|---|
| R9-1 | **Serious.** A settled ruling is contradicted without a recorded reason. C-3 (gap settlements) decided that a crashed full pass resumes, and pinned it with a test that kills every pass after one chunk and asserts completion within `C` passes. Under this revision a killed *first* mine is resumed only behind a full recompute that restarts on each interruption, so that test cannot pass. The document states the opposite: C-3's claim "covers the evict and the mine", and at the seeded half-life a recompute follows "only a `tune`". It is not Critical: no row is lost, and the silence is shown under `mining_in_progress`. | Yes. Round 7's resume advanced the recompute on every pass, so a killed first mine still completed. Executed with `mutants.sh`'s R8-2a rule: 250 commits after 20 passes killed after one transaction, and complete after 6 passes killed after five. R8-2 removed that resume, and its reason considered only the `tune` and bound triggers. | AD-13 L3075, L3078–L3079, L3122, L3194–L3195, L3208–L3209, L3238, L3249–L3251; L19 L6438–L6439 | (1) A first mine writes weights at its own `refTs`, but writes `weight_epoch` and `mined_half_life_days` only in its final transaction. (2) So after a kill the store holds weighted commits and no mined-with value, which case 1 makes "a full recompute". (3) The recompute's first transaction sets `recompute_pending`. Every later pass then recomputes every stored row before it mines on, and an interruption during that restarts it. (4) Executed on the round-8 model, unchanged (K1): a first mine of 400 commits (`C` = 9) killed after 4 transactions leaves 200 commits and no mined-with values. Then 20 passes, each killed after 1 transaction (C-3's case) or after 5, leave 200 commits every time, with `recompute_pending` 1. One uninterrupted pass then completes (400 commits, ratio error 4.572e-16). (5) So "at the seeded half-life a recompute follows only a `tune`" is false. The recompute also follows every interrupted first mine, the longest pass there is. | E-1 | Let a crashed first mine resume as a mine. For example, a pass with `S = ∅` writes its `weight_epoch` and `mined_half_life_days` in its first transaction, since no earlier row exists to mix with. A later `tune` of `h` then still differs and starts case 1. Or record the reason for departing from C-3 for this case. Correct AD-13's and L19's trigger list either way. Add to AD-24 C-3's two cases on a first mine: killed after `k` chunks, and killed after one chunk on every pass, completing within `C` passes. |
| R9-2 | **Serious.** The same settled ruling is contradicted, and the document asserts a property it does not have. Case 2's reconcile with `D = S` is a full re-mine. Its crash rule does "the same work again", so each pass evicts the commits the crashed pass had already re-mined. Under repeated interruption it never completes. The text says C-3's claim covers the evict and mine, and AD-26 says the next pass "resumes". Neither states this exception. It is not Critical: no row is lost. | No. Case 2 is M-20's (adopted round 5). The last revision rewrote the claim's scope and left it out. | AD-13 L3088–L3089, L3099–L3101, L3249–L3250; AD-26 L5582–L5583 | (1) After a `tune` of `miner.max_transaction_entities` or `lexicon.fix_keywords`, the pass evicts every stored commit, then mines `T`. (2) The digest is written only in the final transaction, so a crash leaves it stale. The next pass then takes `D = S` again, which is now the commits the crashed pass mined at the new values. (3) Executed on a model of that rule (K2): 400 commits in chunks of 50 (an uninterrupted pass: 17 transactions), 30 passes each killed after 10. The commits at the new values alternate between 100 and 400, and the digest stays `old`. C-3's resume would complete within `C` passes. | E-2 | Write the case-2 mined-with values in the transaction that ends the eviction of `D = S`. From then on every stored commit was classified at the current values, so a crash during the mine resumes as an ordinary reconcile. A crash during the eviction still finds the digest stale and evicts the rest. Or record why case 2 restarts, as L19 records it for case 1. Correct the C-3 sentence and AD-26's "resumes". Add a kill-every-pass case for case 2 to AD-24. |
| R9-3 | **Moderate.** R8-1's fix is not reachable as written, and a claim R8-1 required is false. The recorded-root binding runs only in a child, and the handler spawns a child only while some store is legacy. After a kill between the rename and step 6 of the last legacy store, nothing spawns. The root then misses, while with an unrelated orphan legacy store present it is bound. The miss is recorded either way, and `init` repairs it. So it is not Serious. | Yes | AD-4 L1364–L1365, L1457–L1459, L1468–L1470, L1479; AD-23 L5108–L5111, L5120; round-8 `test-rebuild.mjs` L250 | (1) AD-4 says the next run after the kill "redoes step 6 for the root its record names". It also says "the outcome at a root does not depend on whether an unrelated legacy store is present". (2) The kill case's next run is the entry point invoked directly by the test, not a run the handler would make. (3) Executed (V2, stores A and C): after the kill at `p6-renamed`, `legacyProjects` is `[]`. The handler at the rebuilt root records `repo_not_bound` and spawns nothing, and the root stays unbound. With an orphan legacy store present, the handler spawns and the child binds the root with no fault. (4) Round 8's required change was to make the outcome "independent of whether an unrelated legacy store exists". | E-3 | Make the recorded root's binding independent of other stores. For example, record the binding (step 6) before the rename (step 5). A binding that names a still-legacy store is then handled by the ordinary legacy-store spawn, and a kill leaves nothing to complete. Or state that after this kill the root misses until `init` is re-run, and remove the independence sentence and "the next run redoes step 6". Add the kill-then-handler case, with and without an unrelated legacy store, to AD-24. |
| R9-4 | **Moderate.** The document classifies errors by two rules that contradict each other, and the open path's premise is false. A table read counts as the file's fault only on a content error (R8-4). The open and schema read count every error as the file's, stating that it "fails the same way on every run". A lock of the moment makes a known-layout file carry nothing, and nothing re-reads it. SQLite documents such locks in WAL mode, for example while an old build's hook process closes its last connection. It is not Serious: the rows are kept and named, and the purge refuses. That matches R8-4's calibration. | Partly. The catch-all is R6-1's. The revision restated its premise beside the new content-only rule. | AD-4 L1384–L1386, L1401–L1404; round-8 `rebuild.mjs` L364–L367 | (1) AD-4 says an error from a statement on the legacy connection is the file's only when it is a content error. Any other error fails the rebuild, which is retried. (2) The open path catches every error and records the file as of no known layout. (3) AD-4 expects old builds to "keep writing the legacy file", each hook event a short-lived process. `wal.html` names the last connection's close and recovery as times when a query "might get an SQLITE_BUSY error". (4) Executed (V1, on B and C): with the legacy file locked, the rebuild reports layout null with `database is locked`. After the lock is released, the file reads `human_facts` 2 (B) and 3 (C). A re-run is `current,current`, the rebuilt store holds 0 owner rows, and the rule still says "the file could not be read (database is locked)". | E-4 | Apply R8-4's rule at the open and the schema read too. Only `SQLITE_CORRUPT` or `SQLITE_NOTADB`, or a schema that reads but matches no layout, make the file one of no known layout. Any other error (`SQLITE_BUSY`, `SQLITE_CANTOPEN`, `SQLITE_IOERR`, `SQLITE_NOMEM`) is `store_rebuild_failed` and is retried. Correct the "fails the same way on every run" sentence. Add V1 to AD-24. |
| R9-5 | **Moderate.** R8-4's table-by-table carry drops a whole owner table whose rows all read, and the record says the table "could not be read". The copy counts the table with `count(*)`, which SQLite answers from the primary-key index. So a damaged index page alone discards the rows the copy has already read. The document also says such a table's digest and count are null, but the prototype records both. It is not Serious: the rows are kept and named, and the purge refuses. | Yes | AD-4 L1394–L1397; round-8 `rebuild.mjs` L224–L225, L329, L418 | (1) Executed (V4): with `sqlite_autoindex_human_facts_1`'s root page overwritten on store B, a table scan reads all 2 rows, and `count(*)` throws. The rebuild records `human_facts` unread with `rows` null, and its `legacyCounts` gives 2. The rebuilt store holds 0 rows. Store C with `sqlite_autoindex_corrections_1` gives 4 rows readable and 0 carried. (2) The round-8 evidence's Y5c shows the same mechanism on the no-writer `regret` table only. | E-5 | Count the rows the copy read (or count with `NOT INDEXED`), so that only a failure to read the table's own rows makes it unread. Carry the rows of a table whose index alone fails, and record the index fault. Make the record match the text: a table whose copy fails has a null digest and count, or say that they are kept. Add V4 to AD-24. |
| R9-6 | **Minor.** L19's visibility rests on a signal that looks like progress. A recompute that keeps restarting records no fault. `status` then shows `mining_in_progress`, the same as a pass that is running. AD-23's own rule for a pass that cannot finish is to record its fault again on each pass. It is only Minor: the condition is listed, and the lock's state is shown beside it. | Yes (L19 and the OL-10 sentence are new) | AD-13 L3193–L3194; AD-17 L4463–L4464; AD-23 L5157–L5159 | The document says OL-10's visibility is met because `mining_in_progress` is in `status`. A process that is killed cannot record anything. But the next pass finds `recompute_pending`, and it records nothing either, so the owner cannot tell a running recalculation from one that keeps restarting. OL-10 is the owner's "it could fail a hundred ways in front of me and I wouldn't know". | E-6 | The pass that finds `recompute_pending` set records `recompute_restarted` (`{attempts}`, carried in `schema_meta`). `status` then says, in plain words, that the history recalculation was interrupted and restarted that many times. |
| R9-7 | **Minor.** R8-6's named interface is incomplete, so "the implementation rebinds only these" cannot be followed. The test also imports four modules of the build argument at fixed paths, with fixed export names, and calls them in its checks. The prototype imports a fifth. | Yes | AD-24 L5344–L5356; round-8 `test-rebuild.mjs` L47–L50 | The list names the entry point, `--purge-files`, seven exports of `rebuild.mjs` and two hooks. The test also reads `tuningReader`, `checkTuningWrite`, `SCALAR_SEEDS`, `LIST_SEEDS`, `filesDao` and `resolveRepoKey` from `<build>/middleware/context-oracle/ctxoracle/dist/src/…`, and so does the prototype, with `probeFts5` and `seedDefaults`. | E-7 | Add the build argument's bindings to the list: those module paths and export names. Or say that the build must provide them at those paths. |
| R9-8 | **Minor.** A latent correctness hazard in the per-table rollback is left to the implementer. A table's savepoint rollback removes the `files` rows its copy created. The id translation's cache keeps them, so a later table can be given an id that names no row, or a row created later for another path. The prototype never reaches this, because each table's legacy rows are all read before its first write. The text does not require that order. | Yes (the per-table rollback is R8-4's) | AD-4 L1394; round-8 `rebuild.mjs` L224, L400–L412, L422 | A table's rows are read with `.all()` before any insert, and a content error in `fileIdFor`'s legacy read is caught per row. So no content error leaves `copyTable` after a `files` insert. A streaming implementation, reading rows while it writes, would roll back created `files` rows and keep their cached ids. | E-8 | State either that a table's legacy rows are read in full before its first write, or that a table's rollback also drops the translation entries created inside it. |
| R9-9 | **Minor.** An unstated departure from AD-23's miss rule. In the legacy state, the child binds whichever root fires first, a second clone included. The root where `init` ran then misses. It is visible and `init` repairs it, so it is only Minor. | No. It is F5-5's rule (round 5). The revision restated it without the consequence. | AD-4 L1452–L1453; AD-23 L5132–L5134 | Executed (V3): a `git clone` of repository B fires first while B's store is legacy. The child rebuilds, binds the clone and records the clone as `root`. A new session at B's own root then gets `repo_not_bound`. AD-23 says a fresh clone "misses until `init` is re-run there". | E-9 | State the departure and its reason: no legacy build recorded a binding, so the first root to fire is the only evidence. State its consequence: the root `init` ran at misses visibly until `init` is re-run there. Have `status` name the root the rebuild bound. |

Counts: Critical 0, Serious 2, Moderate 3, Minor 4 (9 findings). Introduced by the last revision: 6 wholly (R9-1, R9-3, R9-5, R9-6, R9-7, R9-8) and 1 partly (R9-4). Two predate it (R9-2, R9-9).

Serious findings, one line each:
- **R9-1**: R8-2's restart makes a killed first mine, which case 1 turns into a recompute, never complete under repeated interruption (K1: 200 of 400 commits after 20 passes killed after one transaction). That contradicts C-3's settled resume and its kill-every-pass test, while AD-13 and L19 say a recompute follows "only a `tune`".
- **R9-2**: case 2's reconcile with `D = S` redoes its eviction after every crash, so under repeated interruption it never completes (K2: the re-mined commits alternate between 100 and 400 of 400). That contradicts C-3, and AD-13 and AD-26 say the evict and mine resume.

## 1. The round-8 fixes, each at its root cause

| Finding | Applied at the root cause? |
|---|---|
| R8-1 | **Partly.** The three states are stated and prototyped. A second clone of a current store misses visibly with or without an unrelated legacy store (Z3 reproduced). Binding the recorded root after a kill is not a silent `init` under the spec. D-9 governs writes inside the repository tree, and the binding is written in the global store. Step 6 already binds without `init`, with its reason recorded, and completing it binds no new root. But that completion is reachable only while an unrelated legacy store exists (R9-3). Every miss I ran was recorded, apart from a bound root. The legacy state's binding of a second clone is an unstated departure (R9-9). |
| R8-2 | **Yes, for the defect.** The resume watermark is removed. The restart is exact: Z1 gives 6.115e-16 after every kill point with a tune back, reproduced. L19 is acceptable against FR-K2 and OL-10 for the triggers it names. FR-K2 asks for a recency-weighted horizon, which the restart keeps exact, and no spec line requires completion under repeated interruption. OL-10 is met only weakly (R9-6). But the restart removes termination from a trigger L19 does not name, the killed first mine, which C-3 settled (R9-1). |
| R8-3 | **Yes.** `publishStore` deletes the name's `-journal`, `-wal` and `-shm` under the lock, after the absent re-check. Z2 (a/b/c), Z6 and Z6b were reproduced, and the mutant fails. `pager.c` re-fetched: the WAL and journal are deleted only when `nPage==0`. The "harmless" sentence is now scoped to creations that delete the companions first. `import` does not rename onto a live name: it uses `backup()` (AD-5). |
| R8-4 | **Partly.** Readable tables are carried, error attribution is by connection on table reads, and the savepoint rollback is per table. Z4 B/C, Y5b, Y5c, the `files` page and the injected new-file fault were reproduced. Two gaps remain. An index-only failure discards a whole owner table (R9-5). The open and schema read still class every error as the file's (R9-4). |
| R8-5 | **Yes.** `legacyRel` with `origin` selects the file's own record, whatever the path spelling. Z5 (link, realpath, copy) is `[null, null, null]`, and Y3 gives `no rebuild record` with the carried tables' counts and `command` null. Both were reproduced. Derived tables are not counted. |
| R8-6 | **Partly.** The interface is named, but it omits the build argument's module bindings (R9-7). |
| R8-7 | **Yes.** One `E` per pass, the recompute's own `refTs` used for the cap and the mine, and `weight_epoch` written finally. The R8-7 case gives 6.073e-16, and the two mutants fail. |

## 2. Test strength: the three mutants that end with an uncaught error

I ran each of the three with the test as committed, then with its three unguarded statements made non-throwing (`crash/guard.py`: two `JSON.parse(….get().…)` and `n()`), each in its own work copy. Nothing else changed.

| Mutant | Why it throws | With the throw guarded |
|---|---|---|
| `store_rebuilt` record missing | `contentChecks` parses the record outside any `check`: test L121, `TypeError: Cannot read properties of undefined (reading 'detail_json')`, in store A's clean run. | 168 checks fail, first `A clean the rebuild's records are in the new stores`. The run then throws again at L665, which reads Z6's record the same way. |
| R7-3 (a digest content error fails the rebuild) | Y5/Z4 B's rebuild fails, so `project.db` is absent. The Y5 loop's `carried` line, L551, opens it outside any `check`: `unable to open database file`. | 9 checks fail: the Y5/Z4 B, Z4 C and Y5b cases (rebuilt, owner rows carried, unread entry). |
| R8-4d (a copy content error fails the rebuild) | The digest does not read `regret`, so only Y5c reaches the copy's failure. It crashes the same way at L551. | 3 checks fail, all Y5c's. |

Each defect is caught by a check once the throw is removed, so there is no finding. Two notes follow. R8-4d is caught only through a no-writer table, and R9-5's owner-table variant is untested. And a crash ends the run before the later cases, so a first defect can hide later ones.

## 3. Data safety of owner-typed rows, both layouts

- **Normal path and kills.** Every owner-typed table arrives row for row on A and B (`b229c04`) and C (`4dd0f00`/`4e070ce`). The 14 kill points leave the legacy files byte-identical (1537 checks, reproduced).
- **Old-build writes after the rebuild** (Y1 on A and C, Y2). Named with their counts (reproduced).
- **Import of a legacy export** (Y3). `no rebuild record`, with the carried tables' counts and no command. The kept copy also refuses the purge (reproduced).
- **Corrupt table page** (Z4 B and C, Y5b, Y5c, the `files` page). The readable owner tables are carried, and the rest are unplaced and named (reproduced).
- **Corrupt index page of an owner table** (V4, B and C). Every row reads, but none is carried (R9-5).
- **A lock of the moment at the open** (V1, B and C). Nothing is carried and nothing re-reads the file (R9-4).
- **Purge.** On every path I ran it refuses while a file holds rows no other file holds: V1 gives "could not be read", and V4 lists `unreadTables`. Z6 and Z6b show the rebuilt store holds none of the purged store's keys (reproduced).
- **Binding paths** (V2, V3, Z3). No row is at risk.
- **Result.** No path I ran deletes an owner-typed row without `--discard-human`. Two paths leave readable owner rows uncarried (R9-4, R9-5), kept in the legacy file and named.

## 4. AD-4 against the round-8 prototype

**Matches, read against `rebuild.mjs` and re-run:**
- `publishStore`;
- `legacyReader` and the per-table savepoints;
- the `unread` entries;
- `legacyRel` and `origin` in the record and in the rule;
- `carriedCounts` with `command`;
- `childBinding`'s three states and `handlerMiss`'s marker, `wait` and spawn;
- the recompute model's restart and single epoch.

**Stated differently from the prototype:**
- A table whose copy fails keeps a non-null digest and count in the prototype, where AD-4 says both are null (R9-5).
- "The next run redoes step 6": the prototype's next run is the entry point, called directly, which the designed handler does not make without another legacy store (R9-3).
- "Fails the same way on every run": the prototype classes a lock as the file's (R9-4).
- "Only these" bindings: the prototype also binds the build's modules (R9-7).

**Stated but not prototyped, each judged:**
- `init`'s companion deletion. Acceptable: `init` opens the name empty, where `pager.c` deletes a WAL or journal anyway, and the README says it is not prototyped.
- The lock databases and the re-check. Acceptable: AD-26 executes them.
- The handler's dispatch, spawn and `SessionEnd` marker deletion. Not acceptable as it stands: the spawn condition is where R9-3 lies.
- `status` and the purge message text. Acceptable: the rule's result is prototyped.
- `import`'s rebuild beyond `--origin import`. Acceptable for what Y3 claims.
- The schema check on open, and the legacy-writer race. Acceptable, as stated in round 8.
- The miner. The model has no eviction and no case 2. K1 is reachable in the model but untested, and K2 is not modelled: R9-1, R9-2.

## 5. Consistency, spec and backing

- **Contradictions found:**
  - AD-13 L3194–L3195 and L3249–L3250, and L19 L6438–L6439, against AD-13's own case-1 trigger L3078–L3079 (R9-1);
  - AD-13 L3249–L3250 and AD-26 L5582–L5583 against case 2's crash rule L3099–L3101 (R9-2);
  - AD-4 L1468–L1470 against AD-23 L5108–L5111 (R9-3);
  - AD-4 L1384–L1386 against L1401–L1404 (R9-4);
  - AD-4 L1397 against the prototype (R9-5).
- **Settled rulings.** C-3 (R9-1, R9-2). M-17's "does the same work again" is how case 1 and case 2 restart. The document must choose between it and C-3 on the record, as it did for the tune trigger.
- **Spec and ledger.**
  - OL-10 (R9-6, Minor).
  - FR-K2 holds, since the restart is exact.
  - No FR, NF or AC line is contradicted. R-1…R-5 and AC-3's over-cap case were not reviewed, as instructed.
- **Backing, re-fetched with `curl`.**
  - `pager.c`: the WAL is deleted only `if( nPage==0 )` in `pagerOpenWalIfPresent`, and the journal only `if( nPage==0 && !jrnlOpen )`. This supports R8-3's sentence.
  - `wal.html`: SQLite states when a WAL-mode query can return `SQLITE_BUSY` (R9-4).
  - The model bench's figure (25.8 s) was not re-run. It is a model's figure, stated as such.

## 6. What the last revision introduced

- Six findings are wholly the last revision's:
  - R9-1: R8-2's removal of the resume;
  - R9-3: R8-1's completion rule and its independence claim;
  - R9-5: R8-4's per-table count;
  - R9-6: L19's OL-10 sentence;
  - R9-7: R8-6's list;
  - R9-8: R8-4's per-table rollback.
- R9-4 is partly the last revision's: the catch-all is round 6's, restated beside R8-4's rule.
- R9-2 and R9-9 predate it. Rounds 5 to 8 did not raise either.
- As in rounds 7 and 8, the regressions sit where the revision reasoned about one trigger or one path and stated a general property. R8-2's reason weighed the `tune` trigger, not the killed first mine. R8-1's independence sentence was tested with the entry point, not the handler.

## Added test cases (in `scratchpad/archr9/`)

- `k-termination.mjs <round-8 recompute.mjs>`, output `k-termination.out`:
  - **K1**: a first mine killed after 4 transactions, then 20 passes each killed after 1, and after 5, on the round-8 model unchanged;
  - **K2**: case 2's reconcile with `D = S`, 30 passes each killed after 10, on a minimal model of AD-13's rule;
  - `k-termination-r7resume.out`: K1 run against `r7resume/recompute.mjs`, the model with `mutants.sh`'s R8-2a replacements (round 7's resume), as the control for R9-1's "introduced" column.
- `extra9.mjs <work> <build>`, output `extra9.out`, against the committed round-8 prototype:
  - **V1** / **V1 C**: the legacy file locked (`PRAGMA locking_mode = EXCLUSIVE`, a write transaction open) during the rebuild, on B and C, then released and re-run;
  - **V2** / **V2 C**: the kill at `p6-renamed` on A and C, then `handlerMiss` at the root, alone and with an orphan legacy store;
  - **V3**: a second clone fires first while B's store is legacy.
- `extra9b.mjs <work> <build>`, output `extra9b.out`. **V4**: the primary-key index's root page of `human_facts` (B) and of `corrections` (C) overwritten.
- `crash/`: `mk.sh` (the three mutants), `guard.py`, and outputs `rec|r73|r84d.orig.out` and `.guarded.out`.
- Reproductions: `designed-build.out`, `test-rebuild.raw`, `test-head-validator.raw`, `test-recompute.raw` and `mutants.raw`.

## Evidence

### E-1 (R9-1)
- [[middleware/context-oracle/docs/architecture-phase-a.md@4375255:L3075-L3075]] "written **only in the pass's final transaction**"
- [[middleware/context-oracle/docs/architecture-phase-a.md@4375255:L3078-L3079]] "a store missing a mined-with value while it holds weighted commits, or an epoch past its bound (below) is a full"
- [[middleware/context-oracle/docs/architecture-phase-a.md@4375255:L3122-L3122]] "An interrupted recompute starts again from its first row"
- [[middleware/context-oracle/docs/architecture-phase-a.md@4375255:L3194-L3195]] "C-3's termination claim covers the evict and the mine (below), not the recompute."
- [[middleware/context-oracle/docs/architecture-phase-a.md@4375255:L3208-L3209]] "So at the seeded 365 days a recompute follows only a `tune` of `h`"
- [[middleware/context-oracle/docs/architecture-phase-a.md@4375255:L3238-L3238]] "A **full mine is this pass with `S = ∅`**."
- [[middleware/context-oracle/docs/architecture-phase-a.md@4375255:L3249-L3251]] "The claim covers the evict and mine transactions. It does not cover case 1's full recompute"
- [[middleware/context-oracle/docs/architecture-phase-a.md@4375255:L6438-L6439]] "at the seeded half-life a recompute follows only a `tune` of it"
- [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-gap-settlements.md@4375255:L795-L796]] "a second case kills every pass after one chunk and asserts the store completes within `C` passes"
- [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-gap-settlements.md@4375255:L800-L800]] "only option 2 is guaranteed to complete under repeated interruption"
- [[middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r8/recompute.mjs@4375255:L76-L76]] "const recompute = stored > 0 && (pending || minedH === undefined || Number(minedH) !== h || pastBound(refTs, Number(storedE), h));"
- [[ran]] `node --no-warnings k-termination.mjs /home/user/agent-armory/middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r8/recompute.mjs` (in `scratchpad/archr9/`) → `K1 first mine (h 365, refTs unchanged) killed after 4 transactions: killed; store {"commits":200,"mined_half_life_days":"absent","weight_epoch":"absent"}` / `K1 then 20 passes, each killed after 1 transactions: commits after each [200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200]; store {"commits":200,"recompute_pending":1,"mined_half_life_days":"absent"}; an uninterrupted first mine needs C = 9 transactions` / `K1 one uninterrupted pass then: 23 transactions, commits 400, max relative ratio error vs a fresh mine 4.572e-16` (and the same with `killed after 5 transactions`)
- [[ran]] `node --no-warnings k-termination.mjs r7resume/recompute.mjs` (in `scratchpad/archr9/`; `r7resume/recompute.mjs` is the round-8 model with `mutants.sh`'s four R8-2a replacements, round 7's resume) → `K1 then 20 passes, each killed after 1 transactions: commits after each [200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,250,250]; store {"commits":250,"recompute_pending":1,"mined_half_life_days":"absent"}` / `K1 then 20 passes, each killed after 5 transactions: commits after each [200,200,200,300,350,"completed"]; store {"commits":400,"recompute_pending":"absent","mined_half_life_days":365}`

### E-2 (R9-2)
- [[middleware/context-oracle/docs/architecture-phase-a.md@4375255:L3088-L3089]] "(M-20): the existing eviction of every stored commit, then the existing mine of `T`"
- [[middleware/context-oracle/docs/architecture-phase-a.md@4375255:L3099-L3101]] "For a changed `h`, a changed digest or a missing value, the difference is stored, so the next pass finds it and does the same work again"
- [[middleware/context-oracle/docs/architecture-phase-a.md@4375255:L3249-L3250]] "The claim covers the evict and mine transactions."
- [[middleware/context-oracle/docs/architecture-phase-a.md@4375255:L5582-L5583]] "and the next pass resumes (AD-13), except a full recompute, which starts again"
- [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-gap-settlements.md@4375255:L787-L788]] "Under G-1's reconcile a crashed full pass needs no special case"
- [[middleware/context-oracle/docs/reviews/2026-09-28-architecture-collapse-hunt.md@4375255:L186-L186]] "A crash leaves the mined-with values stale and `mining_in_progress` set, so the next pass does the same work again"
- [[ran]] `node --no-warnings k-termination.mjs /home/user/agent-armory/middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r8/recompute.mjs` (in `scratchpad/archr9/`; case K2) → `K2 lexicon.fix_keywords tuned (digest old -> new), a reconcile with D = S of 400 commits in chunks of 50 (an uninterrupted pass: 17 transactions); 30 passes each killed after 10: commits at the new values after each [100,400,100,400,100,400,100,400,100,400,100,400,100,400,100,400,100,400,100,400,100,400,100,400,100,400,100,400,100,400]; digest old` / `K2 one uninterrupted pass then: 17 transactions, digest new`

### E-3 (R9-3)
- [[middleware/context-oracle/docs/architecture-phase-a.md@4375255:L1364-L1365]] "the next run redoes step 6 for the root its record names, and for no other"
- [[middleware/context-oracle/docs/architecture-phase-a.md@4375255:L1457-L1459]] "That is the run after a kill between step 5's rename and step 6, which completes that rebuild's own binding"
- [[middleware/context-oracle/docs/architecture-phase-a.md@4375255:L1468-L1470]] "So the outcome at a root does not depend on whether an unrelated legacy store is present: without one the handler records the same `repo_not_bound` itself (AD-23)."
- [[middleware/context-oracle/docs/architecture-phase-a.md@4375255:L1479-L1479]] "the kill after the rename is followed by a run that binds B"
- [[middleware/context-oracle/docs/architecture-phase-a.md@4375255:L5108-L5110]] "When a directory there holds a `store.db` and no `project.db`, it records no `repo_not_bound`; on `SessionStart` and `UserPromptSubmit` it writes the marker and spawns AD-4's rebuild child"
- [[middleware/context-oracle/docs/architecture-phase-a.md@4375255:L5120-L5120]] "Otherwise the miss is recorded as below."
- [[middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r8/rebuild.mjs@4375255:L556-L556]] "const legacy = legacyProjects(home).length > 0;"
- [[middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r8/rebuild.mjs@4375255:L568-L568]] "existsSync(path.join(projects, k, 'store.db')) && !existsSync(path.join(projects, k, 'project.db'))).sort();"
- [[middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r8/test-rebuild.mjs@4375255:L250-L250]] "const rn = run(k, repo);"
- [[middleware/context-oracle/docs/reviews/2026-09-29-architecture-review-round8.md@4375255:L47-L47]] "make it independent of whether an unrelated legacy store exists"
- [[ran]] `node --no-warnings extra9.mjs w w/HEAD-designed` (in `scratchpad/archr9/`; cases V2, V2 C) → `V2 A (kill at p6-renamed): no other legacy store: kill SIGKILL; legacy projects []; handler repo_not_bound; second event marked; binding of the root null; faults ["repo_not_bound"] | with an unrelated orphan legacy store: kill SIGKILL; legacy projects ["deadbeef0000"]; handler spawn, child exit 0 binding bound; second event marked; binding of the root c6d653fb7aac; faults []` / `V2 C (kill at p6-renamed): no other legacy store: kill SIGKILL; legacy projects []; handler repo_not_bound; second event marked; binding of the root null; faults ["repo_not_bound"] | with an unrelated orphan legacy store: kill SIGKILL; legacy projects ["deadbeef0000"]; handler spawn, child exit 0 binding bound; second event marked; binding of the root c6d653fb7aac; faults []`

### E-4 (R9-4)
- [[middleware/context-oracle/docs/architecture-phase-a.md@4375255:L1384-L1386]] "A legacy file that cannot be opened, or whose schema cannot be read, is not a failure (R6-1, R7-3). The error is a property of the file, and it fails the same way on every run."
- [[middleware/context-oracle/docs/architecture-phase-a.md@4375255:L1401-L1404]] "only an error raised by a statement on the legacy connection is classed as the file's content. The same error code from the new store, a fault of the new file or the machine, fails the rebuild, which is retried"
- [[middleware/context-oracle/docs/architecture-phase-a.md@4375255:L1511-L1511]] "design can keep writing the legacy file, because hooks are wired to the build"
- [[middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r8/rebuild.mjs@4375255:L364-L367]] "} catch (e) { // A file that cannot be opened or whose schema cannot be read is of no known // layout: rebuilt from the repository, unread, never a failure that repeats. report.unreadable = String(e?.message ?? e);"
- [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-coordinator-ruling-correction-store-recovery.md@4375255:L38-L38]] "It carries every human-provenance row across."
- [[https://www.sqlite.org/wal.html]] "When the last connection to a particular database is closing, that connection will acquire an exclusive lock for a short time while it cleans up the WAL and shared-memory files."
- [[https://www.sqlite.org/wal.html]] "the second connection might get an SQLITE_BUSY error."
- [[https://www.sqlite.org/wal.html]] "An exclusive lock is held during recovery."
- [[ran]] `node --no-warnings extra9.mjs w w/HEAD-designed` (cases V1, V1 C) → `V1 B: rebuild while locked exit 0: project rebuilt, layout null, unreadable "database is locked"; lock released: owner rows readable in the legacy file {"human_facts":2,"corrections":4,"questions":3,"invariants":1}; re-run exit 0 states current,current; owner rows in the rebuilt store {"human_facts":0,"corrections":0,"questions":0,"invariants":0}; legacy-file rule {"reason":"the file could not be read (database is locked)","rows":null}` / `V1 C: rebuild while locked exit 0: project rebuilt, layout null, unreadable "database is locked"; lock released: owner rows readable in the legacy file {"human_facts":3,"corrections":4,"questions":4,"invariants":1}; re-run exit 0 states current,current; owner rows in the rebuilt store {"human_facts":0,"corrections":0,"questions":0,"invariants":0}; legacy-file rule {"reason":"the file could not be read (database is locked)","rows":null}`

### E-5 (R9-5)
- [[middleware/context-oracle/docs/architecture-phase-a.md@4375255:L1394-L1397]] "rolls back that table's copy alone, under its own savepoint. The table is recorded as an unplaced whole-table entry with `unread`, its row count where it can still be counted (else `rows` null) and the error, and its digest and count are null."
- [[middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r8/rebuild.mjs@4375255:L225-L225]] "const total = legacy.prepare(`SELECT count(*) AS n FROM ${t}`).get().n;"
- [[middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r8/rebuild.mjs@4375255:L329-L329]] "digests[t] = null; counts[t] = null; unreadable[t] = e.message;"
- [[middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r8/rebuild.mjs@4375255:L418-L418]] "const unreadTable = (t, message) => report.unplaced.push({ table: t, rows: countOrNull(legacy, t), reason: `the table could not be read (${message})`, unread: true });"
- [[ran]] `node --no-warnings extra9b.mjs w w/HEAD-designed` (in `scratchpad/archr9/`) → `V4 B: sqlite_autoindex_human_facts_1 (root page 25) overwritten; in the legacy file a table scan of human_facts reads 2 rows, count(*) "throws: database disk image is malformed"; rebuild exit 0 project rebuilt layout b229c04; unread entries [{"table":"human_facts","rows":null,"reason":"the table could not be read (database disk image is malformed)","unread":true}]; digest recorded non-null, count recorded 2; human_facts rows in the rebuilt store 0; legacy-file rule {"reason":"rows not carried","unplacedRows":0,"unreadTables":[{"table":"human_facts","rows":null}],"changedSince":[]}` / `V4 C: sqlite_autoindex_corrections_1 (root page 24) overwritten; in the legacy file a table scan of corrections reads 4 rows, count(*) "throws: database disk image is malformed"; rebuild exit 0 project rebuilt layout 4dd0f00-4e070ce; unread entries [{"table":"corrections","rows":null,"reason":"the table could not be read (database disk image is malformed)","unread":true}]; digest recorded non-null, count recorded 4; corrections rows in the rebuilt store 0; legacy-file rule {"reason":"rows not carried","unplacedRows":0,"unreadTables":[{"table":"corrections","rows":null}],"changedSince":[]}`

### E-6 (R9-6)
- [[middleware/context-oracle/docs/architecture-phase-a.md@4375255:L3193-L3194]] "OL-10 requires the failure to be visible, which `mining_in_progress` in `status` is."
- [[middleware/context-oracle/docs/architecture-phase-a.md@4375255:L4463-L4464]] "and `mining_in_progress` — whose suppressed events are counted)"
- [[middleware/context-oracle/docs/architecture-phase-a.md@4375255:L5157-L5159]] "a pass that cannot finish, such as a refused `refTs`, records its fault again on each such pass, so the condition stays visible"
- [[middleware/context-oracle/OWNER-LEDGER.md@4375255:L48-L48]] "it could fail a hundred ways in front of me and I wouldn't know."
- [[ran]] `node --no-warnings middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r8/test-recompute.mjs` → `REP: 20 passes each killed after 5 transactions: 20 killed; after them recompute_pending 1, mining_in_progress 1, mined_half_life_days 365; one uninterrupted pass: max relative ratio error 5.185e-16` / `105 checks passed, 0 failed`

### E-7 (R9-7)
- [[middleware/context-oracle/docs/architecture-phase-a.md@4375255:L5355-L5356]] "The implementation rebinds only these, to its own entry points, and every `check` stays as it is."
- [[middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r8/test-rebuild.mjs@4375255:L47-L47]] "const { tuningReader, checkTuningWrite } = await import(path.join(D, 'stores/dao/tuning.js'));"
- [[middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r8/test-rebuild.mjs@4375255:L48-L48]] "const { SCALAR_SEEDS, LIST_SEEDS } = await import(path.join(D, 'stores/dao/tuning_seeds.js'));"
- [[middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r8/test-rebuild.mjs@4375255:L49-L50]] "const { filesDao } = await import(path.join(D, 'stores/dao/files.js')); const { resolveRepoKey } = await import(path.join(D, 'identity/repo_key.js'));"

### E-8 (R9-8)
- [[middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r8/rebuild.mjs@4375255:L224-L224]] "const rows = legacy.prepare(`SELECT rowid AS __rowid, * FROM ${t}${where} ORDER BY ${orderBy}`).all();"
- [[middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r8/rebuild.mjs@4375255:L400-L400]] "const ids = new Map();"
- [[middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r8/rebuild.mjs@4375255:L410-L410]] "ids.set(legacyId, id);"
- [[middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r8/rebuild.mjs@4375255:L422-L422]] "try { tmp.transaction(fn); } catch (e) {"

### E-9 (R9-9)
- [[middleware/context-oracle/docs/architecture-phase-a.md@4375255:L1452-L1453]] "it rebuilds, and step 6 binds this root."
- [[middleware/context-oracle/docs/architecture-phase-a.md@4375255:L5132-L5134]] "So a moved checkout, or a fresh clone carrying a committed `.claude/settings.json`, misses until `init` is re-run there, and the miss is visible."
- [[ran]] `node --no-warnings extra9.mjs w w/HEAD-designed` (case V3) → `V3: clone exit 0, key c6d653fb7aac = B's c6d653fb7aac: true; handler at the clone spawn, child exit 0 project rebuilt binding bound, record root "<clone>"; binding of the clone c6d653fb7aac, of the root init ran at null; a new session at that root: handler repo_not_bound; faults [["repo_not_bound","<init root>"]]`

### Other evidence (sections 1–5)
- [[ran]] `sh middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r8/designed-build.sh <work>` → `210c210` / `<     if (!(halfLife >= 37)) {` / `---` / `>     if (!(halfLife >= 365.25 * v('miner.horizon_years') / 1022)) {`
- [[ran]] `node --no-warnings middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r8/test-rebuild.mjs <work> <work>/HEAD-designed` → `1537 checks passed, 0 failed` (exit 0)
- [[ran]] `node --no-warnings middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r8/test-rebuild.mjs <work>` → `1492 checks passed, 45 failed` (exit 1), all 45 the check `the designed outcome: half-life 10 carried and served, bar.no_such_key refused`
- [[ran]] `node --no-warnings middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r8/test-recompute.mjs` → `Z1: 26 transactions in the recompute pass; killed after 1..25, tuned back to 365: max relative ratio error vs a fresh mine 6.115e-16; with no tune back (h 20): 6.340e-16` / `105 checks passed, 0 failed` (exit 0)
- [[ran]] `node --no-warnings rec/r8/test-rebuild.mjs <crash>/w-rec <crash>/w-rec/HEAD-designed` (in `scratchpad/archr9/crash/`, the record mutant, test as committed) → `file://<crash>/rec/r8/test-rebuild.mjs:121` / `TypeError: Cannot read properties of undefined (reading 'detail_json')` / `exit 1`
- [[ran]] the same for `r73` → `Error: unable to open database file` / `at ro (file://<crash>/r73/r8/test-rebuild.mjs:58:19)` / `at n (file://<crash>/r73/r8/test-rebuild.mjs:325:33)` / `at file://<crash>/r73/r8/test-rebuild.mjs:551:66` / `exit 1`; and for `r84d`, after the `== Y5b` line → `Error: unable to open database file` / `at file://<crash>/r84d/r8/test-rebuild.mjs:551:66` / `exit 1`
- [[ran]] the three again after `python3 guard.py <m>/r8/test-rebuild.mjs` → `rec`: 168 `FAIL` lines, first `FAIL A clean the rebuild's records are in the new stores`; `r73`: `1528 checks passed, 9 failed`; `r84d`: `1534 checks passed, 3 failed`, all three `Y5c`
- [[ran]] `sh middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r8/mutants.sh <work> <work>/HEAD-designed` → 35 lines, each `test exit 1`, none `NOT APPLIED`; three of them end `Node.js v22.22.2` (`store_rebuilt record missing from the new store`, `R7-3: a corrupt page in the digest fails the rebuild`, `R8-4d: a table that fails to read in the copy fails the rebuild`)
- [[https://raw.githubusercontent.com/sqlite/sqlite/master/src/pager.c]] "exists if the database is not empty, or verify that the *-wal file does"
- [[https://raw.githubusercontent.com/sqlite/sqlite/master/src/pager.c]] "If the database is not empty and the *-wal file exists, open the pager"
