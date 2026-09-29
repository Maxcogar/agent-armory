# Round-7 independent review of the Phase A architecture (revision `550f7e5`)

**Verdict: FAIL.** One Serious finding is open (R7-1). There is no Critical finding. 2 Moderate and 7 Minor findings are written down below, each with its required change.

Reviewed: `middleware/context-oracle/docs/architecture-phase-a.md` at `550f7e5` (`HEAD`). I read the last revision's diff in full (`git diff -U3 HEAD^ HEAD`, 36 hunks). At `HEAD` I then read all of AD-4's legacy-store text, AD-5's purge and import, AD-13's recompute and crash rule, AD-17's home-level channel, AD-20's `deinit`, AD-23's miss path, AD-24's rebuild and purge cases, AD-26's lock and F5-10 table, and L18.

Inputs read before judging:
- `middleware/context-oracle/CLAUDE.md`, `OWNER-LEDGER.md` CONFIRMED, and the spec's FR-K, AC-19 and purge references.
- In `docs/reviews/`:
  - the store-recovery and human-rows rulings;
  - both coordinator fact files (the 2026-09-29 file corrects the 2026-09-28 one);
  - the gap settlements' C-3;
  - round 6 and its `extra.mjs`;
  - both evidence directories, READMEs first: the whole round-6 `rebuild.mjs`, `test-rebuild.mjs` and `mutants.sh`, and every file in its `results/`.
- I skimmed rounds 1–5 and the collapse hunt for rulings on the purge, the rebuild and the recompute.

I wrote none of the document and no earlier review. I changed no repository file, made no commit and changed no git state.

What I ran (Node v22.22.2). The work directory is `scratchpad/archr7/w`: the builds and stores copied (`cp -a`) from `scratchpad/verify-rb.pU4N/`.
- The round-6 test on those stores: `1502 checks passed, 0 failed`, exit 0 (`archr7/test-rebuild.out`).
- The round-6 `mutants.sh`: all 11 mutants make the test exit 1 (`archr7/mutants.out`).
- My added cases, against the committed round-6 prototype, unchanged. Outputs are in `archr7/extra7.out` and `archr7/y4-designed-validator.out`.
  - `archr7/extra7.mjs`:
    - **Y1:** an old build's `note` on the legacy project file after its rebuild, one case per layout: A with `b229c04`, C with `59cc05c`.
    - **Y2:** an in-place update of a carried `questions` row after the rebuild.
    - **Y3:** a legacy export made by `HEAD`'s `export` verb. Its layout is identified and it is rebuilt. Then the legacy-file rule is checked after an import of it.
    - **Y5:** a legacy file with one corrupt table page.
    - **Y6:** one migration file's checksum, with LF and with CRLF line endings.
  - `archr7/y4-designed-validator.sh`: **Y4**, the round-6 test run with a tuning validator whose half-life floor is AD-13's designed relation.
- Web pages fetched with `curl` through the checker's fetcher:
  - `git-scm.com/docs/gitattributes`;
  - Flyway's `ChecksumCalculator.java`;
  - `sqlite.org/howtocorrupt.html`;
  - POSIX `unlink`.

## Findings

| ID | Severity and justification | Introduced by last revision | Location | Finding | Evidence | Required change |
|---|---|---|---|---|---|---|
| R7-1 | **Serious.** As written, the design cannot be built: AD-24's acceptance case for the rebuild demands two things that exclude each other. The implementation must pass the round-6 test "unchanged", and it must run it "with the build's own tuning validator", whose fixture must carry `bar.recency_half_life_days 10`. The test pins the opposite outcome, the refusal of that value by `HEAD`'s 37-day floor. Executed: with only the floor changed to the designed relation, 45 checks fail, and every failure is that pin. It is not Critical: no row is lost, and the conflict stops the build rather than letting a defect through. | Yes. The R6-4 fix added both the pin (the round-6 test) and the AD-24 wording. | AD-24 L5011–5014; AD-4 L1197–1210; round-6 `test-rebuild.mjs` L124–128 | (1) AD-24 says the round-6 test's checks "must pass unchanged" when run with the build's own validator, with 10 among the values carried and served. The test asserts, on every store and every kill run, that the tuning is unplaced with the reason "must be at least 37". Under the designed floor the value is carried, `u` is undefined, and the check fails (Y4: `1457 checks passed, 45 failed`, 3 stores × 15 runs). (2) AD-4 L1204–1205 says "The test accepts either outcome for a refused row, so it checks the merge's handling of a refusal, not which values are refused". The round-6 test's L126–128 does check which value is refused. | E-1 | State the rebuild case's test as the round-6 test with the 37-day pin replaced. The replacement is a check, made through the build's own validator, that `bar.recency_half_life_days 10` is carried and served and that `bar.no_such_key 1` is refused. Say this pin is `HEAD`-only evidence and is not part of the acceptance case. Correct L1204–1205 to say which checks are outcome-agnostic and which one pins an outcome. |
| R7-2 | **Moderate.** A correctness defect on a reachable path, against the standard the document names. A store or export that moves between an LF and a CRLF checkout of one commit is refused. The refusal is visible and deletes nothing. But the store stays refused, and every event on it is silent. The document says a refused store's "fix is the build's", and no build fixes this. It is not Serious because no FR, NF, AC or ruling names line-ending independence. | No. The byte-for-byte rule predates the revision. The revision's R6-9 text is what establishes that the shipped `.sql` text varies by checkout, and it did not carry that premise to the checksum. | AD-4 L918–941 (the schema check), L1028–1040 (R6-9), L1544–1545 (Flyway); AD-5 L1801 (`import`'s checksum check); round-6 `rebuild.mjs` L278 | The revision's R6-9 fix rests on this: the migration files the runtime reads come from the checkout, and git converts their line endings there. The schema check compares each applied migration's checksum with the shipped file "byte for byte". So a store built by a build from a CRLF checkout is refused by the same commit's build from an LF checkout or an LF package, and the reverse also holds. An export crossing the two is refused at `import` (M-12). Executed (Y6): `001_phase_a_project.sql` has two different SHA-256 values with LF and with CRLF. Flyway's `validate`, cited as "the standard", computes a checksum that is "encoding and line-ending independent". Also, the gitattributes quote at L1034 comes from the paragraph on setting `text`. The repository sets `text=auto`, where the fact that matters is the platform default: "the default is eol=crlf on windows". | E-2 | Compute every migration checksum over the file's text with CRLF read as LF, the same normalisation R6-9 applies to the DDL. That is Flyway's line-ending independence, and it keeps one rule for the two comparisons. Say so where the checksum is defined, and add an AD-24 case: a store built from CRLF migration text opens clean on a build whose files are LF. Cite gitattributes' `eol` default for `text=auto` at L1034. |
| R7-3 | **Moderate.** The document claims, twice, a property the design does not have. Owner rows are not lost, but the only recovery the design leaves destroys them. A legacy file whose schema reads but one of whose table pages is corrupt fails the rebuild the same way on every run. The store stays legacy, and every event in that repository is silent. `deinit --purge` refuses such a file as not rebuilt. So the owner's only way out is `--discard-human`, which deletes the rows the rebuild exists to carry. It is not Serious: the state is visible (`status` shows the error), and it needs a corrupt file. | Yes. The "Why no failure repeats deterministically" paragraph and the once-per-session retry are new. | AD-4 L1310–1333; round-6 `rebuild.mjs` L197; AD-20 L4431–4435 | "So what remains is a failure outside the build, which may clear". And then: "So a corrupt legacy file never leaves a store legacy and re-spawned forever". Only an unreadable *schema* is handled as unread. A data-page error during the copy (`SQLITE_CORRUPT`) is neither a constraint error nor unplaceable, so the prototype rethrows it and the rebuild fails. Executed (Y5): with store B's `session_log` root page overwritten, run 1 and run 2 both end `store_rebuild_failed`, "database disk image is malformed", and no `project.db` is written. By the new rule, each later session re-copies the file and fails again. | E-3 | Handle a read error inside the copy (`SQLITE_CORRUPT`, `SQLITE_NOTADB`) as a property of the file, not a failure. Record the table whose read failed as unplaced, with its error and row count unknown. Carry the tables that read, and complete. The file is then not fully carried, so the purge still refuses. Correct the two sentences. Add an AD-24 case: a legacy file with one corrupt table page is rebuilt, the table is named unplaced, and a second run is a no-op. |
| R7-4 | **Minor.** The rule reads another file's record. Owner rows stay safe, because their tables are digested and a kept import copy refuses the purge. But after an import, `status` and the rule judge the legacy file against the wrong record. | Yes (`legacyNotCarried` and the "fully carried" definition are new). | AD-20 L4431–4435; AD-4 L1256–1268; AD-5 L1808–1840; round-6 `rebuild.mjs` L438–455, L329–330 | *Fully carried* means "its rebuild record exists". The prototype takes the project store's latest `store_rebuilt` row, whatever file it describes. Importing a legacy export rebuilds the export into the `.import-tmp` copy, whose own record names the export, and then backs that copy into the live store. After that, the latest record is the export's. Executed (Y3): the local legacy file has one hand-added `schema_meta` key, which is unplaced. Its own record gives `unplacedRows` 1, so the file is not carried. After the import, the rule returns `null`, which means fully carried, while the key is still in the file. On a legacy file that is not a database, the rule throws "file is not a database" instead of returning not carried. Separately, a table that cannot be counted gets a string in `unreadRows` (`not counted: …`), not the `{table: rows}` shape AD-4 states. | E-4 | Select the record whose `legacyPath` is that file, and treat none as "no rebuild record" (not carried). Import's rebuild records its own event under another code or key, so it is never read as the local file's record. Make the rule return not carried, with the error, when the legacy file cannot be read. State `unreadRows`' entry for a table that cannot be counted. Add the Y3 shape to AD-24. |
| R7-5 | **Minor.** A settled ruling's message requirement is met only in part, and part of a review finding was dropped without a record (`CLAUDE.md`: "never silently dropped"). Rows are protected, since the refusal holds. The owner is only not told how many. | Yes | AD-20 L4457–4466; L18 L6049–6053; AD-4 L1215–1218; round-6 `rebuild.mjs` L440 | Store-recovery item 4: "Its message states how many rows would be lost." That holds for listed rows and unplaced rows. It does not hold in two cases. (1) A legacy file changed since its rebuild: counts were replaced by digests, and "A digest names the table, not how many rows changed". R6-2 asked for digests "not only counts" and to "keep counts for the other tables". The counts were dropped, and no reason is recorded. (2) A legacy file not yet rebuilt: the rule returns "not rebuilt yet", with no count, and the message list names nothing for that case. It also names no command that rebuilds it, though `status` and `log` do not. | E-5 | Keep per-table row counts in the record beside the digests. For a changed table, the message gives the counts at the rebuild and now, and says the content changed. For a file not yet rebuilt, it gives the per-table counts of its listed tables, read by the layout's mapping, and names the verb that runs the rebuild (for example `ctxoracle index`). Or record, with its reason, why item 4 is met without counts. |
| R7-6 | **Minor.** The miss path's new writes are too unclear to build without guessing, and they contradict AD-17. The first session in each upgraded repository also shows a false advisory. | Yes | AD-4 L978–986, L1338–1347; AD-23 L4795–4806; AD-17 L4093–4099 | (1) The spawn's dedupe is "a home-level marker keyed by `session_id` as `repo_not_bound` is". The text does not say whether that is `repo_not_bound`'s own marker or a second one. If it is the same marker, the `repo_not_bound` write and the spawn exclude each other, and which one runs depends on the order. AD-17 says `repo_not_bound` is the "only thing the handler may write after a binding miss". It also gives the marker's end of life as the same session's `SessionEnd`, "which misses the binding the same way", but after a successful rebuild the `SessionEnd` finds the binding. (2) The revision records `repo_not_bound` on the first miss of every upgraded repository, although its child then binds it. `repo_not_bound`'s meaning is "misses until `init` is re-run there". R6-3's required change was that "A child that finds its derived key not pending records `repo_not_bound`". So `status` would tell the owner to re-run `init` where nothing is needed. | E-6 | Name the spawn marker as its own file, with its key, and give it its own end of life: deleted by the child when it has bound the repository, and by `SessionEnd`. List it in AD-17 among what the handler writes after a miss. Record `repo_not_bound` for a miss while a legacy project store exists only when the child finds the derived key's store not legacy. Otherwise record `store_legacy`. |
| R7-7 | **Minor.** A reason given for a rejection rests on an order of use the design does not require. | Yes (R6-6's rejection is new) | AD-20 L4466–4480, L4442–4443 | R6-6's rejection says: "the refusal names each file and its counts before the flag is passed, so the owner decides with the files in view". That holds only for an owner who first runs `--purge` without the flag. The owner can pass `--discard-human` on the first run, and the design specifies no output for that path ("the flag lifts the refusal and changes nothing else"). The other three reasons stand. | E-7 | Have `--purge --discard-human` print the same list the refusal would (each file, its counts and paths) before it deletes, and say so in AD-20. Or drop the first reason. |
| R7-8 | **Minor.** The legacy file's deletion has no stated order and no stated residual. Neither loses an owner row the owner kept, since the refusal holds for every row present at the check. But a crash can bring a purged store back, and a concurrent old-build write can vanish. | Partly. The plain purge deleting a legacy file is new. The flag's deletion of it predates the revision. | AD-20 L4423–4436; AD-4 L1006–1007, L1367–1369; AD-26 L5303–5305 | (1) The purge "deletes every file in the project directory except `reindex.lock`", in no stated order. A crash after `project.db` is unlinked and before `store.db` is unlinked leaves exactly the definition of a legacy store, and the next claimant rebuilds it. The purged store is then back, rows passed with `--discard-human` included. (2) The check and the unlink are not atomic against a legacy build, which the document says "can keep writing the legacy file". No legacy build takes `reindex.lock`: `HEAD` has only a claim row. A write that lands after the digest check goes to the unlinked inode and is lost (POSIX: content removal "postponed until all references to the file are closed"). | E-8 | State the order. Delete the legacy file, its `-wal`/`-shm` and the kept copies first, and `project.db` last, so that an interrupted purge leaves a current store and re-running completes it. State the concurrent-writer residual in AD-20: rows an old build writes during the purge are lost with the file. Or refuse while an old-build process has the file open, if a portable test exists. |
| R7-9 | **Minor.** A review option was dropped without being weighed, and it leaves a known non-terminating path. The document's own crash-rule standard (C-3) treats that path as the defect to avoid. The exposure is small: the owner must tune `h`, or tune near the floor, and interruptions must repeat. It is visible under `mining_in_progress`. | Partly. The non-termination predates the revision. The revision's text accepting it is new. | AD-13 L2996–3009, L2948–2951; gap settlements C-3 L781–782, L800 | R6-11 offered two changes: say the full recompute restarts on each interruption, "or record a completed-range watermark beside `recompute_epoch` so that it resumes". The revision took the first. It now states that the recompute "need never complete" under repeated interruption, "and not bounded here", and does not say why resuming was not chosen. C-3 decided the crash rule on exactly this property: "only option 2 is guaranteed to complete under repeated interruption". Its duration is unmeasured ("No committed script measures its duration at the horizon's seeds"). | E-9 | Record a completed-range watermark in each recompute transaction (for example the last `commits` rowid whose weight is at `recompute_epoch`) so that the finish resumes, and extend C-3's termination claim to it. Or record why a resume is not worth its key, with the recompute's measured duration. |
| R7-10 | **Minor.** A new owner-visible sentence can be false. | Partly. The wording is new, and the stranding predates the revision. | AD-4 L1360–1365; AD-3 L562 | `status` is to say "a store whose repository is gone is kept as it is and holds rows no rebuild has read". The same paragraph names other ways a legacy store stops being derived: "moved while path-keyed, or re-rooted". In those cases the repository still exists, the owner's rows are stranded under the old key, and no route carries them. | E-10 | Say that the store's repository is gone, or no longer derives this key (moved while path-keyed, or history re-rooted). State the manual route (copy the notes from the kept file, which the tool never deletes), or record it as a limitation. |

Counts: Critical 0, Serious 1, Moderate 2, Minor 7 (10 findings). Introduced by the last revision: 6 wholly (R7-1, R7-3, R7-4, R7-5, R7-6, R7-7) and 3 partly (R7-8, R7-9, R7-10). R7-2 predates it; the revision's R6-9 text exposes it.

Serious finding, one line:
- **R7-1**: AD-24 requires the rebuild's implementation to pass the round-6 test unchanged, with the build's own validator carrying `bar.recency_half_life_days 10`. The test pins that value's refusal by `HEAD`'s 37-day floor. Executed with the designed floor: 45 failures, all that pin.

## 1. The round-6 fixes, each at its root cause

| Finding | Applied at the root cause? |
|---|---|
| R6-1 | **Yes.** There is one deletion set, stated once in AD-20. AD-4 L1010 and AD-5 L1789 point to it, and no sentence saying "only `--discard-human` deletes" remains (grep of "delet" with "legacy" in the document). A file of no known layout is not carried, whatever it holds, and its rows are counted. The mutant fails. Residuals: R7-4 (whose record), R7-8 (order and atomicity). |
| R6-2 | **Yes, for detection.** X3 reproduces. Y1 shows an old build's `note` named on both layouts (`changedSince ["human_facts"]`), and Y2 shows an in-place `questions` update named. The dropped counts: R7-5. |
| R6-3 | **Yes.** The file test is the definition of a legacy store, needs no end of life, and no export carries it (X2 reproduces). Residuals: the marker and the false `repo_not_bound` (R7-6). |
| R6-4 | **Text yes, test no.** AD-4 now names `HEAD`'s validator. AD-24's instruction and the round-6 pin exclude each other (R7-1). |
| R6-5 (text only) | **Yes.** The metric is named as the whole transaction, configuration 3 is named as round 4's option, and the residual now has both parts. I checked the inference against the bench. The waiter's lock wait is bounded by the pass's hold, at most 100.0 ms, since `busy` was 0 in every run. The excess over that differs between configurations 1 and 3 only in the checkpoint schedule. So "It still delays another connection's writes" is backed by the between-configuration difference, not by a direct timing, and the text does not claim a mechanism. |
| R6-6 (text only) | **Rejection recorded.** The first reason's premise is conditional (R7-7). |
| R6-7 | **Yes.** No `index_stale`, `legacy_unplaced` or `schema_version` key is written (the test checks it). The staleness spawn is attributed to `index_head`'s absence, and every unplaced entry carries `rows`. |
| R6-8 | **Refused rows: yes.** A row the new layout refuses is unplaced and kept, and the mutant fails. The claim that no failure repeats deterministically is false (R7-3). `stage` is removed consistently from AD-4, AD-17 and `status`. |
| R6-9 | **Yes for the layout test**, with the right scope (CRLF only, since no other transformation of the files is known). The same premise breaks the checksum rule (R7-2). |
| R6-10 (text only) | **Yes.** The message states that the export's repository cannot be verified and names its layout. The reason one override suffices holds: with a different `keying_mode`, the key differs as well (AD-3), so in both cases no identity can be checked. It is still not prototyped, as the README says. |
| R6-11 (text only) | **Text yes.** It is now true: the full recompute is outside the termination claim, and the bench is named as a model. The decision it records is unweighed (R7-9). |

## 2. The revision's own decisions

- **`--purge` deletes every project-directory file except `reindex.lock` once not refused.** Backed: R6-1 required one set, and this is AD-5's set. Minimal: the flag now only lifts the refusal. Consistent: AD-4, AD-5, AD-20 and AD-24 agree. The legacy file's deletion needs an order and a residual (R7-8).
- **"Fully carried" adds "digests unchanged".** Backed by X3 (a `tune` leaves the count equal) and by my Y1/Y2. It is conservative: digests cover every carried table, so an old build's session rows also refuse the purge. That is the safe direction, and it matches "rows no other file holds". The record it compares against: R7-4.
- **The `legacy_pending` rows replaced by a file test and a once-per-session marker.** The file test is backed, minimal and consistent. The marker is under-specified (R7-6).
- **A once-per-session retry for failures outside the build.** It is right for transient failures. Its premise, that every remaining failure is transient, is false (R7-3).
- **CRLF-only normalisation.** Backed: `.gitattributes` `* text=auto` is at the repository root, at `b229c04` and at `HEAD`, and on Windows the checkout default is CRLF. It is minimal, and the mutant fails. It is inconsistent with the checksum rule (R7-2).

## 3. Data safety of owner-typed rows, both layouts

- **Normal path.** Every owner-typed table arrives row for row on A, B and C (1502 checks). X2 covers mixed layouts on one home.
- **Crash.** The 14 kill points leave every legacy file byte-identical, and the next run completes.
- **Two repositories.** X2: each repository rebuilds and binds, and the file test names only the orphan afterwards. A moved path-keyed repository's legacy rows are stranded, not lost (R7-10).
- **Old build writing after the rebuild.**
  - Tested now for `tune` (X3), for `note` on both layouts (Y1) and for an in-place update (Y2). Each makes the file not carried, so the purge refuses and `status` names the table.
  - A write that races the purge: R7-8.
- **Purge without the flag.**
  - It refuses for listed rows, a legacy file that is not carried (unknown layout, not a database, not yet rebuilt, unplaced rows, or changed digests) and kept copies. D, E, R6-8 and X3 each refuse through the prototyped rule.
  - It does not refuse, and deletes, a legacy file whose record matches. The one wrong-record path is R7-4 (non-owner content in the executed case).
  - Owner rows are never deleted without the flag on the paths tested.
- **Purge with the flag.** It deletes everything but `reindex.lock` and never `global/global.db`. A crash mid-purge can bring the store back (R7-8).
- **Deterministic failure.** Owner rows are kept, but the store is stuck legacy, and the only way out destroys them (R7-3).
- **Import of a legacy export.**
  - Y3: `HEAD`'s `export` (`VACUUM INTO`) of store B is identified as `b229c04` for both files. Rebuilt, it carries `human_facts` 2, `corrections` 4, `questions` 3 and `invariants` 1, equal to the export.
  - After the import, the legacy-file rule reads the export's record (R7-4).
  - The import's own override and messages are not prototyped (README).
- **Result.** No path I ran deletes an owner-typed row without `--discard-human`. The open data-safety items are a crash-order resurrection and a concurrent-writer loss (R7-8), and the forced choice on a corrupt file (R7-3).

## 4. AD-4 against the round-6 prototype

**Matches, read against `rebuild.mjs` and re-run:**
- the CRLF-normalised layout test (L140);
- the unplaced refused rows with `rowid` (L180–199);
- `unreadRows` and `unreadable` (L298–331);
- `legacyDigests` in the read snapshot (L338);
- the record's fields (L291, L372–377);
- no pending rows or removed keys (L313–323, L371);
- the file test (L426–430);
- the legacy-file rule's reasons (L438–455).

**Stated in AD-4, AD-20 or AD-23 but not prototyped, each judged:**
- The handler's once-per-session spawn and its marker, and the `projects/` listing. The README names them as not prototyped. Under-specified: R7-6.
- The purge's other bullets, its deletion and its message. The README names them. The order and counts: R7-8, R7-5.
- The `status` text. It is acceptable as specified.
- The import's rebuild of a legacy export. The README names it. I prototyped its first two steps in Y3: identification and rebuild both work. Record selection: R7-4.
- The designed validator. The README names it. AD-24's instruction about it cannot be met: R7-1.
- "Executed: `CREATE TABLE u(\r\n a text…`". No record of this command is in either evidence directory. The same fact is recorded by the R6-9 case ("29 schema rows hold a CR"), so the claim is backed.

**Stated differently from the prototype:**
- "its rebuild record exists": the prototype reads the latest record, not the file's (R7-4).
- `unreadRows` `{table: rows}`: a table that cannot be counted holds a string (R7-4).
- "which may clear": R7-3.

## 5. Consistency, spec and backing

- **Contradictions found:**
  - AD-24 against the round-6 test, and AD-4 L1204 against the same test (R7-1);
  - AD-4's checksum rule against its own R6-9 premise (R7-2);
  - AD-4 L1330–1333 against the prototype's behaviour (R7-3);
  - AD-17's "only thing the handler may write after a binding miss" against the new spawn marker (R7-6).
- **Spec.** No new conflict with an FR, NF or AC. AC-19 is unaffected: it round-trips with one build.
- **Backing.**
  - Every figure I re-ran reproduced: 1502 checks and 11 mutants.
  - The gitattributes quote is on the page, from the paragraph for `text` set (R7-2).
  - Flyway's source contradicts the byte-for-byte rule it is cited for (R7-2).

## 6. What the last revision introduced

- Six findings are wholly the last revision's: R7-1, R7-3, R7-4, R7-5, R7-6 and R7-7.
- Three are partly the last revision's: R7-8, R7-9 and R7-10.
- One, R7-2, predates it; the revision's own R6-9 premise exposes it.
- The regressions sit where the revision added mechanism or reasons: the AD-24 test wording, the failure-classification reason, the legacy-file rule, the miss-path marker, and the archive rejection.

## Added test cases (in `scratchpad/archr7/`)

- `extra7.mjs <work>`, output `extra7.out`:
  - Y1: an old-build `note` after the rebuild, `b229c04` on A and `59cc05c` on C;
  - Y2: an in-place `questions` update;
  - Y3: a legacy export's identification and rebuild, and the legacy-file rule after an import of it;
  - Y5: a corrupt table page;
  - Y6: a checksum over LF and CRLF text.
- `y4-designed-validator.sh <work> <copy>`, output `y4-designed-validator.out`:
  - Y4: the round-6 test with the designed half-life floor.

## Evidence

### E-1 (R7-1)
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L5011-L5014]] "the test is the round-6 evidence's `test-rebuild.mjs`, whose checks the rebuild's implementation must pass unchanged, run with the build's own tuning validator; its fixture adds `bar.recency_half_life_days 10` to the values that must be carried and served (R6-4)."
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L1204-L1205]] "The test accepts either outcome for a refused row, so it checks the merge's handling of a refusal, not which values are refused."
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L1198-L1200]] "Under AD-13's designed relation, `365.25 × miner.horizon_years / 1022`, about 1.79 days at the seeds, 10 passes, so the implementation carries it;"
- [[middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r6/test-rebuild.mjs@550f7e5:L126-L126]] "the half-life refusal is HEAD's validator's 37-day floor"
- [[middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r6/test-rebuild.mjs@550f7e5:L128-L128]] "assert.equal(u.value, '10'); assert.match(u.reason, /must be at least 37/);"
- [[ran]] `sh y4-designed-validator.sh <work> <copy>` (in `scratchpad/archr7/`; the copy's `HEAD` build has `if (!(halfLife >= 37)) {` replaced by `if (!(halfLife >= 365.25 * 5 / 1022)) {` in `dist/src/stores/dao/tuning.js`, and nothing else changed) → `1457 checks passed, 45 failed` / `[test exit 1]`; the 45 `FAIL` lines are all `the half-life refusal is HEAD's validator's 37-day floor` (A, B and C, clean and each of 14 kills), the first `FAIL A clean the half-life refusal is HEAD's validator's 37-day floor: Cannot read properties of undefined (reading 'value')`

### E-2 (R7-2)
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L938-L940]] "the stored checksums are compared with the shipped files of that selected set: the migrations the store has applied must match them byte for byte"
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L1030-L1031]] "It read the `.sql` files from its checkout at run time"
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L1035-L1036]] "So a checkout on a CRLF platform builds a store whose DDL differs from the committed files only in line endings."
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L1544-L1545]] "Flyway's `validate` is the standard"
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L1801-L1801]] "a checksum mismatch is refused — M-12"
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L979-L980]] "A refused store is not spawned for: its fix is the build's (above)."
- [[middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r6/rebuild.mjs@550f7e5:L278-L278]] "sha(sql(dir, f))"
- [[https://raw.githubusercontent.com/flyway/flyway/main/flyway-core/src/main/java/org/flywaydb/core/internal/resolver/ChecksumCalculator.java]] "The checksum is encoding and line-ending independent."
- [[https://git-scm.com/docs/gitattributes]] "Setting the text attribute on a path enables end-of-line conversion on checkin and checkout"
- [[https://git-scm.com/docs/gitattributes]] "the default is eol=crlf on windows and eol=lf on all other platforms"
- [[ran]] `node --no-warnings extra7.mjs <work>` (case Y6) → `Y6: 001_phase_a_project.sql sha256 LF 91a6894ec0dc8523 CRLF 1bcf3052ab2eadc6 equal false`

### E-3 (R7-3)
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L1323-L1325]] "So what remains is a failure outside the build, which may clear, and a retry per session is its right cost."
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L1330-L1333]] "A legacy file that cannot be opened, or whose schema cannot be read, is not a failure."
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L1332-L1333]] "So a corrupt legacy file never leaves a store legacy and re-spawned forever."
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L287-L288]] "in each case the event is silent"
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L1217-L1218]] "`deinit --purge` refuses by AD-20's one rule (a legacy file not yet rebuilt is not fully carried)."
- [[middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r6/rebuild.mjs@550f7e5:L197-L197]] "if (!(e.unplaceable || (e.code === 'ERR_SQLITE_ERROR' && (e.errcode & 0xff) === 19 /* SQLITE_CONSTRAINT */))) throw e;"
- [[ran]] `node --no-warnings extra7.mjs <work>` (case Y5: store B's copy checkpointed to rollback mode, `session_log`'s root page overwritten with `0xa5`, then the committed rebuild run twice) → `Y5: session_log root page 38 overwritten; run 1 exit 1 {"scope":"project","state":"failed","code":"store_rebuild_failed","legacyPath":"<work>/r7/Y5/projects/c6d653fb7aac/store.db","error":"database disk image is malformed"}; run 2 exit 1 project state failed error "database disk image is malformed"; project.db exists false`

### E-4 (R7-4)
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L4432-L4433]] "means its rebuild record exists, its layout is known, the record has zero unplaced rows"
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L1813-L1814]] "AD-4's mapping rebuilds it into a fresh `.import-tmp` created with the current migrations"
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L1836-L1837]] "`backup()` the temporary project copy into the live project store"
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L1256-L1256]] "It records the rebuild **in the same file**"
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L1263-L1263]] "`unreadRows` (`{table: rows}`) where its schema can be read"
- [[middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r6/rebuild.mjs@550f7e5:L443-L443]] "SELECT detail_json AS r FROM faults WHERE code = 'store_rebuilt' ORDER BY ts DESC, rowid DESC LIMIT 1"
- [[middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r6/rebuild.mjs@550f7e5:L452-L452]] "try { l.exec('BEGIN'); now = carriedDigests(l, rec.layout, scope); l.exec('COMMIT'); } finally { l.close(); }"
- [[middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r6/rebuild.mjs@550f7e5:L330-L330]] "return [t, `not counted: ${e.message}`];"
- [[ran]] `node --no-warnings extra7.mjs <work>` (case Y3) → `Y3: HEAD export -> 0 exported to <work>/r7/Y3-export; layouts ["b229c04","b229c04"]; export rebuilt exit 0 global:rebuilt:b229c04 project:rebuilt:b229c04; export human_facts 2, corrections 4, questions 3, invariants 1; rebuilt human_facts 2, corrections 4, questions 3, invariants 1`
- [[ran]] same run → `Y3: local rebuild exit 0; own record: {"reason":"rows not carried","unplacedRows":1,"changedSince":[]}; after the import the latest record's legacyPath is Y3-export-home/projects/c6d653fb7aac/store.db (the file checked is Y3-local/projects/c6d653fb7aac/store.db); legacyNotCarried null; hand_added_key still in the legacy file: 1` / `Y3: after the import, a legacy file that is not a database: legacyNotCarried throws: file is not a database`

### E-5 (R7-5)
- [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-coordinator-ruling-correction-store-recovery.md@550f7e5:L47-L49]] "Its message states how many rows would be lost."
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L6051-L6052]] "A digest names the table, not how many rows changed"
- [[middleware/context-oracle/docs/reviews/2026-09-29-architecture-review-round6.md@550f7e5:L22-L22]] "not only counts (for example a SHA-256 over the rows ordered by rowid), and keep counts for the other tables."
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L4457-L4460]] "The message gives the counts per listed table, the legacy file's unplaced rows, a file of no known layout's per-table counts (or that it could not be read), each table whose carried rows changed since the rebuild, and each kept file's path"
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L1216-L1218]] "`status` and `log` only report the legacy store"
- [[middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r6/rebuild.mjs@550f7e5:L440-L440]] "if (!existsSync(newPath)) return { reason: 'not rebuilt yet' };"

### E-6 (R7-6)
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L981-L982]] "deduplicated by a home-level marker keyed by `session_id` as `repo_not_bound` is (AD-23)"
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L4093-L4095]] "and is the only thing the handler may write after a binding miss (AD-23): the `repo_not_bound` fault, once per `session_id`."
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L4097-L4098]] "the same session's `SessionEnd` event, which misses the binding the same way"
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L1341-L1343]] "A binding miss is then recorded as the ordinary miss is, `repo_not_bound` once per session (AD-23), because the repository is not bound."
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L4814-L4815]] "misses until `init` is re-run there, and the miss is visible."
- [[middleware/context-oracle/docs/reviews/2026-09-29-architecture-review-round6.md@550f7e5:L23-L23]] "A child that finds its derived key not pending records `repo_not_bound` on the home-level channel, so the miss stays visible."

### E-7 (R7-7)
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L4470-L4471]] "the refusal names each file and its counts before the flag is passed, so the owner decides with the files in view, and can copy any of them first;"
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L4442-L4443]] "With `--discard-human` the purge deletes the same files without refusing: the flag lifts the refusal and changes nothing else."

### E-8 (R7-8)
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L4423-L4424]] "It deletes every file in the project directory except `reindex.lock`"
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L1006-L1007]] "A store is legacy while its new-name file is absent and its old-name file is present."
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L1367-L1369]] "A build that predates this design can keep writing the legacy file, because hooks are wired to the build that ran `init` (AD-20)."
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L5303-L5305]] "every claimant but `init`'s first creation opens the project store — for a rebuild, the legacy file it reads — with `mustExist`"
- [[https://pubs.opengroup.org/onlinepubs/9699919799/functions/unlink.html]] "the removal of the file contents shall be postponed until all references to the file are closed"
- [[ran]] `grep -rn "reindex.lock" middleware/context-oracle/ctxoracle/src` → 4 lines, all the `reindex_locked` code of the claim row (`diag/fault_codes.ts:42: 'reindex_locked', // reindex refused: a live process holds the claim row (Step 14)`, `index/indexer.ts:114`, `:478`, `:479`); no lock file is opened

### E-9 (R7-9)
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L3003-L3009]] "that recompute keeps no range and restarts from its first transaction after each interruption, so under repeated interruption it need never complete (R6-11; round-6 review)."
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L3009-L3009]] "that exposure is stated there and not bounded here."
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L2950-L2951]] "No committed script measures its duration at the horizon's seeds."
- [[middleware/context-oracle/docs/reviews/2026-09-29-architecture-review-round6.md@550f7e5:L31-L31]] "or record a completed-range watermark beside `recompute_epoch` so that it resumes."
- [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-gap-settlements.md@550f7e5:L781-L782]] "Under option 1 each restart begins again from zero, so if interruptions keep arriving before chunk `C` the store never completes"
- [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-gap-settlements.md@550f7e5:L800-L800]] "only option 2 is guaranteed to complete under repeated interruption"

### E-10 (R7-10)
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L1364-L1365]] "a store whose repository is gone is kept as it is and holds rows no rebuild has read."
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L1352-L1353]] "a repository that no longer derives its key (deleted, moved while path-keyed, or re-rooted)"
- [[middleware/context-oracle/docs/architecture-phase-a.md@550f7e5:L562-L562]] "No git → SHA-256 of the realpath, mode `path-keyed`."

### Other evidence (sections 1–4)
- [[ran]] `node --no-warnings middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r6/test-rebuild.mjs <work>` → `1502 checks passed, 0 failed` (exit 0)
- [[ran]] `sh middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r6/mutants.sh <work>` → 11 lines, each `test exit 1`, for example `mutant [R6-2: the carried-rows digest reduced to a row count]: test exit 1; 1501 checks passed, 1 failed`
- [[ran]] `node --no-warnings extra7.mjs <work>` (cases Y1, Y2) → `Y1 A: rebuild exit 0; b229c04 note -> 0 fact recorded; legacy human_facts 2 -> 3, rebuilt 2; before null; after {"reason":"rows not carried","unplacedRows":0,"changedSince":["human_facts"]}` / `Y1 C: rebuild exit 0; 59cc05c note -> 0 fact recorded; legacy human_facts 3 -> 4, rebuilt 3; before null; after {"reason":"rows not carried","unplacedRows":0,"changedSince":["human_facts"]}` / `Y2: rebuild exit 0; questions rows updated 1; legacyNotCarried {"reason":"rows not carried","unplacedRows":0,"changedSince":["questions"]}`
- [[middleware/context-oracle/docs/reviews/2026-09-28-rebuild-mapping-evidence/bench-checkpoint.mjs@550f7e5:L20-L21]] "The waiter is the HEAD adapter's Store (busy_timeout 100 ms, one retry)"
