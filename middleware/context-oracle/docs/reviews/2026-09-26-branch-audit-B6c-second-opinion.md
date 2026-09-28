# Branch audit — batch 6, part c: second opinion

Second opinion on `2026-09-26-branch-audit-B6c.md` (first audit of commits `bcb87cb`, `ca67af7`, `c3a25f0`, `95de037`, `e77c768`). The brief followed is `/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/BRIEF.md`. Settled and not re-litigated: `…-B1-verification.md` through `…-B5-verification.md` and `…-B6a-adjudication.md`. Judged here: every keep of the first audit (E-1–E-10, E-14–E-16, E-22–E-27, E-29–E-31) and E-13, E-20, E-33.

Method. Own extractions under `<scratch>/b6cso/<commit>` (`<scratch>` = `/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad`), made with `git archive <commit> middleware/context-oracle/ctxoracle | tar -x -C <scratch>/b6cso/<commit>` for `b229c04`, `bcb87cb` and `c3a25f0`, this checkout's `ctxoracle/node_modules` symlinked in, built with `npm run build`; Node v22.22.2. Mutants were planted by my own harness `<scratch>/b6cso/mut.py <tree> <name> <file> <old> <new> <tests|ALL>`: one exact, unique text replacement, `npx tsc -p tsconfig.json`, then either `node --test dist/test/unit/<file>.test.js` or the whole `npm test`, then the file restored and rebuilt. `<T>` below is the `ctxoracle` directory of the named tree. After all runs, `diff -r` of both trees' `src/` and `test/` against fresh `git archive` extractions was empty and `git status --short` in this repository was empty. Baseline at `c3a25f0`: `npm test` → `# tests 168` / `# pass 167` / `# fail 0` / `# skipped 0` / `# todo 1`.

### E-1
**Agree/Disagree:** Agree with the verdict (keep): the record is a genuine, executed, written-once review, and its errors belong on the editable units that carry them. Disagree with the reasoning in three places. (a) The disposition list is incomplete. The review judged the builder's reported plan flaw 5 ("Seven" fixture names vs the eighth, `recency-weighting`) as *Holds*. `ca67af7`'s message scopes its §9 work to "builder flaws 1-3", and the plan at `e77c768` still says "Seven fixture names" and "grows by these seven". That is a second silent drop beyond the Step 7 sentence, charged to `ca67af7`. (b) The record contradicts itself on its headline number. The Verdict and M4 say "31 of 54" survived, but its own table and score give 21 killed of 54 non-equivalent, so 33 survived; counted from the table here. STATUS carries the table's 21/54, so the wrong figure lives only in the record. The first audit's "as far as sampled, true" misses it. (c) S1's depth-0 half ("The depth-0 path has the same problem") was narrowed, not fixed: `c3a25f0` still swallows a failed `ROLLBACK` (see E-20). None of these changes the verdict on a written-once record.
**Evidence:**
- [[middleware/context-oracle/docs/reviews/2026-09-26-steps-1-12-build-review.md@bcb87cb:L215-L217]] "5. **\"Seven\" fixture names versus the eighth, `recency-weighting`.** *Holds.* §5.1 (plan line 690) and Step 1's `create:` list carry `recency-weighting`,"
- [[ran]] `git show -s --format=%B ca67af7 | sed -n 11,13p` → `- §9 Checkpoint 1R table lists the indexer FTS inserts and search.ts` / `  stand-ins (so init/index run at 1R) and the other stand-ins the build` / `  needed (M1, builder flaws 1-3)`
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@e77c768:L1205]] "that exercises `rebuild_recovered_nothing`. (b) Seven fixture names are"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@e77c768:L1211]] "(Step 18). `T-1-3`'s `FIXTURE_NAMES` literal grows by these seven."
- [[middleware/context-oracle/docs/reviews/2026-09-26-steps-1-12-build-review.md@bcb87cb:L17-L18]] "The suite's pass count was hollow in one respect: **31 of 54 non-equivalent hand mutations of the delta behaviour survived the builder's"
- [[middleware/context-oracle/docs/reviews/2026-09-26-steps-1-12-build-review.md@bcb87cb:L233]] "- **Before this review's tests:** 21 killed / 54 non-equivalent (38.9%)."
- [[ran]] `python3` count over the review's 56 table rows (`| S<n>-<n> |`), Before column, excluding the two rows the review marks equivalent → `before killed 21 before survived (non-eq) 33 equiv-ish ['S3-2', 'S12-10']`
- [[middleware/context-oracle/docs/reviews/2026-09-26-steps-1-12-build-review.md@bcb87cb:L39-L40]] "The depth-0 path has the same problem at :204-212."
- [[middleware/context-oracle/docs/STATUS.md@e77c768:L289-L291]] "Before its 30 added tests, the suite caught 21 of 54 realistic planted faults; after them, 54 of 54."
**Correct verdict:** keep — a genuine executed record. Its errors are the SQLite and CWE mis-citations, the 31/33 miscount and two unapplied items (Step 7's sentence, flaw 5's "seven"), and they are routed to the plan and code units that carry them.

### E-2
**Agree/Disagree:** Agree with the verdict and the reasoning. Re-planted the review's S3-8 at the first guard: T-3-3b fails. I also planted a mutant the first audit did not try: the callback fires after the second busy attempt instead of between the attempts. It still fires exactly once, so T-3-3b alone would pass it. The existing T-3-3 kills it, because its case B blocks inside the callback. The contract "between the two attempts" is therefore pinned by the pair of tests.
**Evidence:**
- [[middleware/context-oracle/ctxoracle/test/unit/concurrency.test.ts@bcb87cb:L155]] "assert.equal(calls, 1, 'onBusyRetry fires once, between the two attempts');"
- [[ran]] `python3 mut.py <T:bcb87cb> S3-8-first-guard src/stores/adapter.ts "if (attempt === 0) opts?.onBusyRetry?.();\n          continue;" → "opts?.onBusyRetry?.();\n          continue;" concurrency` → `KILLED … # tests 2 # pass 1 # fail 1` / `not ok 2 - T-3-3b (review): a write contended through both attempts fires onBusyRetry exactly once, then raises StoreBusy and writes nothing`
- [[ran]] `python3 mut.py <T:bcb87cb> C-late-callback … "if (attempt === 0) …" → "if (attempt === 1) …" concurrency` → `KILLED … # tests 2 # pass 1 # fail 1` / `not ok 1 - T-3-3: contended writers — retry-then-succeed (B) and give-up (C), by construction`
**Correct verdict:** keep — discriminating, and together with T-3-3 it pins both "once" and "between".

### E-3
**Agree/Disagree:** Disagree with the verdict. Agree that T-6-4f and T-6-4g are correct and kill S6-1 and S6-2 (re-executed). The first audit claims B6b E-6's requested case is "covered in substance" because "S6-2 shows the prefix form is rejected". That is wrong. B6b asked for `consumerRole('s1#main#x')` to throw. A plausible parser that reads the role as the segment between the first `#` and the next `#` passes both added tests and the whole suite, and it reads the malformed key `s1#main#x` as `main`. That is exactly the "never silently reads as main" property the docstring and the plan state. The added tests do not pin it. The first audit's other premise, that the session-id-with-`#` question "is not yet settled", is stale: the B6a adjudication settled it as `replace` and routed the pin to `T-6-4` (batch 6 part b). That pin is not this unit's job.
**Evidence:**
- [[middleware/context-oracle/ctxoracle/src/types/consumer.ts@bcb87cb:L24-L25]] "Anything else throws, so a * malformed key never silently reads as main."
- [[middleware/context-oracle/ctxoracle/test/unit/consumer_key.test.ts@bcb87cb:L48-L50]] "assert.throws(() => consumerRole('s1#mainx')); assert.throws(() => consumerRole('s1#bogus'));"
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B6b.md@HEAD:L118]] "`consumerRole('s1#main#x')` throws"
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B6c.md@HEAD:L56]] "`s1#main#x` is not present but S6-2 shows the prefix form is rejected"
- [[ran]] `python3 mut.py <T:bcb87cb> K2-role-upto-next-hash src/types/consumer.ts "const role = hash === -1 ? null : key.slice(hash + 1);" → "const role = hash === -1 ? null : (key.slice(hash + 1).split('#')[0] ?? null);" ALL` → `SURVIVED … # tests 155 # pass 154 # fail 0 # skipped 0 # todo 1`
- [[ran]] `python3 mut.py <T:bcb87cb> S6-1 src/types/consumer.ts "key.indexOf('#')" → "key.lastIndexOf('#')" consumer_key` → `KILLED … not ok 6 - T-6-4f (review)…`
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B6a-adjudication.md@HEAD:L31]] "`consumerKey` throws on a session id containing `#`"
**Correct verdict:** replace — keep T-6-4f and T-6-4g, and add `assert.throws(() => consumerRole('s1#main#x'))` to T-6-4g, the datum B6b E-6 asked for; the K2 mutant survives without it.

### E-4
**Agree/Disagree:** Disagree with the verdict. Agree on r1–r11: they discriminate, and r6/r7 restore what B6b E-14 found lost. r12 does not pin the rule it names. The rule is FR-X4's kind-level gate (`human_stated` requires `prov_kind = 'human'`), but r12 tries only `commit`. A gate narrowed to `commit`/`repo_span` passes the whole suite. Executed on the real DAO, that narrowed gate accepts a `mechanical` or `session` provenance as an owner-stated landmine. Both kinds pass `provCreateValues` with `trust: 'untrusted_repo'`. That is the relabelling FR-X4 forbids, so the review's own S9-14 mutant family is only partly covered. The first audit's claim that the test "quotes its sentence" is true; the test still passes while the behaviour is wrong.
**Evidence:**
- [[middleware/context-oracle/ctxoracle/src/stores/dao/landmines.ts@bcb87cb:L87]] "if (row.prov.prov_kind !== 'human') {"
- [[middleware/context-oracle/ctxoracle/test/unit/dao_crud.test.ts@bcb87cb:L766]] "assert.throws(() => lm.createHuman({ fileId: f, evidence: 'from a commit message', prov: mined }));"
- [[ran]] `python3 mut.py <T:bcb87cb> D1-gate-commit-only src/stores/dao/landmines.ts "if (row.prov.prov_kind !== 'human') {" → "if (row.prov.prov_kind === 'commit' || row.prov.prov_kind === 'repo_span') {" dao_crud` → `SURVIVED … # tests 34 # pass 34 # fail 0`; the same mutant against `<T:c3a25f0>` with `ALL` → `SURVIVED … # tests 168 # pass 167 # fail 0 # skipped 0 # todo 1`
- [[ran]] `node d1.mjs <T:bcb87cb>` (fresh migrated store, one `files` row, `createHuman` with `{prov_kind: 'mechanical'|'session', trust: 'untrusted_repo'}`) → real code: `mechanical -> threw: landmines.createHuman: human_stated requires human provenance, not "mechanical" (FR-X4)` / `session -> threw: …`; under D1: `mechanical -> ACCEPTED as human_stated` / `session -> ACCEPTED as human_stated`
**Correct verdict:** replace — keep r1–r11; r12 asserts refusal for every non-human `prov_kind` (`repo_span`, `commit`, `mechanical`, `session`), not `commit` alone.

### E-5
**Agree/Disagree:** Agree with the verdict and the reasoning. The negative row goes through the constraint-only `rejects` helper, so wrong SQL cannot satisfy it, and the dropped CHECK fails only T-7-1n.
**Evidence:**
- [[middleware/context-oracle/ctxoracle/test/unit/migrations_phase_a.test.ts@bcb87cb:L422]] "rejects(store, insertSql('labelled_touches', cols), [f, 'h2', 'refactor', 1]);"
- [[ran]] `python3 mut.py <T:bcb87cb> S7-6 src/stores/migrations/001_phase_a_project.sql "label TEXT NOT NULL CHECK(label IN ('revert','fix'))," → "label TEXT NOT NULL," migrations_phase_a` → `KILLED … # tests 14 # pass 13 # fail 1` / `not ok 14 - T-7-1n (review): labelled_touches.label accepts revert and fix and rejects any other label`
**Correct verdict:** keep — the one CHECK the table lacked a row for is now pinned.

### E-6
**Agree/Disagree:** Agree with the verdict and the reasoning. All three mutants fail their tests when planted in code. My S5-1 edited the constructor itself, so the first audit's comment-line slip does not arise. T-5-4h also asserts the byte round-trip, so a decoder that kept the BOM as a different character would fail too.
**Evidence:**
- [[middleware/context-oracle/ctxoracle/test/unit/path_bytes.test.ts@bcb87cb:L66-L67]] "assert.notEqual(a, b, 'two byte strings are never keyed as one path'); assert.deepEqual([...Buffer.from(a ?? '', 'utf8')], [...withBom], 'the decode round-trips to the same bytes');"
- [[ran]] `python3 mut.py <T:bcb87cb> S5-1 src/util/path_bytes.ts "{ fatal: true, ignoreBOM: true })" → "{ fatal: true, ignoreBOM: false })" path_bytes` → `KILLED … not ok 8 - T-5-4h (review)…`; `S5-3` (`b <= 0x7e && b !== 0x5c)` → `b <= 0x7e)`) → `KILLED … not ok 7 - T-5-4g (review)…`; `S5-4` (push only when `i > start`) → `KILLED … not ok 6 - T-5-4f (review)…`
**Correct verdict:** keep — closes B6b E-7's three data.

### E-7
**Agree/Disagree:** Disagree with the verdict. Agree that T-5-5d kills the full swallow (S5-5) and is B6b E-9's requested case. But the wrapper's own contract names two failures that are thrown: "the command is missing" and "`maxBuffer` is exceeded". T-5-5d pins only the first. A wrapper that throws only on `ENOENT` passes the whole suite. Executed: under that mutant, a child writing 200000 bytes with `maxBuffer: 1000` returns `status null` with 65536 bytes of stdout, with no throw. That is the truncated read the review's own plan-silence table said "must not pass as output", and the miner's `git log` stream would take it as complete. By the brief's test rule, T-5-5d passes while half the stated behaviour is wrong.
**Evidence:**
- [[middleware/context-oracle/ctxoracle/src/util/spawn.ts@bcb87cb:L111-L112]] "A failure to run the child at all (the command * is missing, `maxBuffer` is exceeded) is not an exit status and is thrown."
- [[middleware/context-oracle/ctxoracle/test/unit/spawn_wrapper.test.ts@bcb87cb:L104]] "return (e as NodeJS.ErrnoException).code === 'ENOENT';"
- [[middleware/context-oracle/docs/reviews/2026-09-26-steps-1-12-build-review.md@bcb87cb:L197]] "A truncated `maxBuffer` read must not pass as output."
- [[ran]] `python3 mut.py <T:bcb87cb> K3-throw-enoent-only src/util/spawn.ts "if (r.error !== undefined) throw r.error;" → "if (r.error !== undefined && (r.error as NodeJS.ErrnoException).code === 'ENOENT') throw r.error;" ALL` → `SURVIVED … # tests 155 # pass 154 # fail 0 # skipped 0 # todo 1`
- [[ran]] `node k3.mjs <T:bcb87cb>` (`oracleRunSync(process.execPath, ['-e', 'process.stdout.write("x".repeat(200000))'], {cwd, maxBuffer: 1000})`) → real code `THREW ENOBUFS`; under K3 `RETURNED status null stdout bytes 65536`
- [[ran]] `python3 mut.py <T:bcb87cb> S5-5 src/util/spawn.ts "if (r.error !== undefined) throw r.error;" → "" spawn_wrapper` → `KILLED … not ok 5 - T-5-5d (review)…`
**Correct verdict:** replace — keep T-5-5d; add the `maxBuffer`-overrun case (a child that outputs more than a small `maxBuffer` makes `oracleRunSync` throw `ENOBUFS`), the other half of the wrapper's stated contract.

### E-8
**Agree/Disagree:** Agree with the verdict and the reasoning. The test compares the returned `{id, seq}` with the stored rows for two same-`ts` events, so dropping or faking `seq` fails.
**Evidence:**
- [[middleware/context-oracle/ctxoracle/test/unit/step10_session_writer.test.ts@bcb87cb:L31]] "assert.notEqual(a.seq, b.seq, 'the same millisecond never collides (N16)');"
- [[ran]] `python3 mut.py <T:bcb87cb> S10-1 src/diag/session_writer.ts "  return sessionLogDao(store).append(event);" → "  return { ...sessionLogDao(store).append(event), seq: 0 };" step10_session_writer` → `KILLED … # tests 1 # pass 0 # fail 1`
**Correct verdict:** keep — pins N16's return value; the missing §12 id is a plan gap, as the first audit says.

### E-9
**Agree/Disagree:** Agree with the verdict. Part of the reasoning is stale: the first audit calls `slot.human`'s acceptance of any string "a source-side question not yet settled". The B6a adjudication has since settled it as `replace`: `slot.human` must take a provenance-checked value, either a compile-time brand or a runtime provenance check. The added test passes a plain `{text}` object through an `as never` cast. Under the brand form the test is unaffected, because the cast defeats a type-level brand. Under the runtime form it would need a `human` provenance argument. The test pins shape, not the admission rule, and it is correct today. It stands until the correction pass chooses the form, and that choice decides whether the `human` row of the test changes.
**Evidence:**
- [[middleware/context-oracle/ctxoracle/test/unit/step6_headline_slots.test.ts@bcb87cb:L34]] "[slot.human({ text: 'owner note', ...extra } as never), { kind: 'human', text: 'owner note' }],"
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B6a-adjudication.md@HEAD:L48]] "`slot.human` accepts only a branded human-text value that a provenance-checked read produces"
- [[ran]] `python3 mut.py <T:bcb87cb> S6-5 src/types/headline.ts "    return { kind: 'human', text: v.text };" → "    return { ...v, kind: 'human', text: v.text };" step6_headline_slots` → `KILLED … # tests 2 # pass 1 # fail 1`
**Correct verdict:** keep — the runtime-shape test is right as written; the settled `slot.human` correction (B6a adjudication E-7) is a source change that may later add a provenance argument to its `human` row.

### E-10
**Agree/Disagree:** Agree with the verdict and the reasoning. The three assertions together (rejects, source not created, destination rows intact) pin the read-only open through its data-loss consequence.
**Evidence:**
- [[middleware/context-oracle/ctxoracle/test/unit/store_backup.test.ts@bcb87cb:L99]] "assert.deepEqual(rows, [42], 'the destination still holds its own rows');"
- [[ran]] `python3 mut.py <T:bcb87cb> S3-6 src/stores/adapter.ts "new DatabaseSync(sourcePath, { readOnly: true })" → "new DatabaseSync(sourcePath)" store_backup` → `KILLED … # tests 2 # pass 1 # fail 1` / `not ok 2 - T-3-6b (review): backupFile from a missing source rejects, creates no source file, and leaves the destination intact`
**Correct verdict:** keep — discriminating, and it guards batch 2's settled import data-loss class one layer down.

### E-13
**Agree/Disagree:** Agree with the verdict (replace) and with its correction of L1416–L1418's error list. The fetched page lists `SQLITE_FULL`, `SQLITE_IOERR`, `SQLITE_INTERRUPT`, `SQLITE_NOMEM`, which is the coordinator's verified fact. The reasoning misses a gap in case (i), which these hunks add. The rule at L1418–L1423 covers "any throw at depth > 0", and that includes a statement run directly inside the depth-0 unit, which is the common DAO shape. Case (i) specifies only the nested shape: the too-large insert happens inside an inner `transaction`. In that shape the nested frame detects the abandonment itself, and so does its undo-failure branch, so the statement-level detection in the adapter is never exercised. Executed: with the adapter's statement-level poison line deleted, the whole suite passes. The direct shape then reproduces S1's executed defect: row 1 lost, row 3 durable, the outer call throwing "cannot commit - no transaction is active". The real code handles the direct shape correctly (`TransactionAborted`, no rows). So the plan's own test specification leaves half of its rule unpinned. The rule is also silent on what the failing statement itself throws in the direct shape. The code rethrows the original error and poisons, and later statements throw `TransactionAborted`. The plan should say so, because "the call throws `TransactionAborted`" reads as the nested call only.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@ca67af7:L1416-L1418]] "whole transaction on its own after `SQLITE_FULL`, `SQLITE_IOERR`, `SQLITE_NOMEM`, or `SQLITE_BUSY` inside it"
- [[ran]] `curl -sS -L https://sqlite.org/lang_transaction.html` (tags stripped, whitespace normalised) → `The errors that can cause an automatic rollback include: SQLITE_FULL : database or disk full SQLITE_IOERR : disk I/O error SQLITE_INTERRUPT : operation interrupted by sqlite3_interrupt() or similar. SQLITE_NOMEM : out of memory`
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@ca67af7:L1418-L1421]] "After any throw at depth > 0 the adapter checks `db.isTransaction`: if the engine has ended the transaction, the `ROLLBACK TO` is skipped, the handle is marked aborted, and the call throws `TransactionAborted`"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@ca67af7:L10359-L10361]] "the outer inserts 1, an inner call inserts a row too large to fit (`SQLITE_FULL`), the outer catches that error, inserts 3, and returns."
- [[middleware/context-oracle/ctxoracle/src/stores/adapter.ts@c3a25f0:L200]] "if (depth > 0 && !db.isTransaction) aborted = true;"
- [[ran]] `python3 mut.py <T:c3a25f0> A1-guarded-nopoison src/stores/adapter.ts "      if (depth > 0 && !db.isTransaction) aborted = true;\n" → "" ALL` → `SURVIVED … # tests 168 # pass 167 # fail 0 # skipped 0 # todo 1`
- [[ran]] `node direct.mjs <T>` (`max_page_count` = page_count + 2; one depth-0 `transaction`: insert 1, `try { INSERT randomblob(200000) } catch {}` directly, insert 3) → real `c3a25f0`: `inner: database or disk is full` / `outer: TransactionAborted: transaction aborted at …: the unit of work's transaction was rolled back isTA true` / `rows: []`; with A1 applied: `ins3 returned` / `outer: Error: cannot commit - no transaction is active isTA false` / `rows: [3]`
- [[https://raw.githubusercontent.com/nodejs/node/v22.16.0/doc/api/sqlite.md]] "Whether the database is currently within a transaction."
**Correct verdict:** replace — keep the design, the export and case (i). Correct the error list to the page's four codes. Add a direct-statement case to T-3-5: the failing statement sits at depth 1 with no inner `transaction`, and the test asserts `TransactionAborted` at depth 0 and no rows. State in Step 3 that a failing statement at depth > 0 rethrows its own error after marking the handle aborted.

### E-14
**Agree/Disagree:** Agree with the verdict and the reasoning. The hunk's claim is true of the call it names: POSIX applies the umask to `mode`, so it can only narrow `0o700`, and the `chmod` then fixes the end state. The unstated ancestor rule and the `global/` line are rightly routed to E-28 and to batch 4's settled item. They are not text this hunk wrote.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@ca67af7:L1556-L1558]] "when missing (created with `mkdirSync(path, {mode: 0o700})`, so the umask can only narrow the mode and there is no window at a looser one, then `chmod` to `0o700` exactly — Steps 1–12 build review m3)"
- [[https://raw.githubusercontent.com/nodejs/node/v22.16.0/doc/api/fs.md]] "`mode` {string|integer} Not supported on Windows. **Default:** `0o777`."
**Correct verdict:** keep — the hunk states the documented primitive and a true consequence.

### E-15
**Agree/Disagree:** Agree with the verdict and the reasoning. One premise is confirmed beyond the first audit: "the commit that first named the path" is chronological, not "whichever commit the miner meets first". The miner streams `git log --reverse`, so on a full pass the insert-if-absent row takes the oldest naming commit. The later caller passes the hash it parsed.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@ca67af7:L2574-L2576]] "with `prov_ref` = the commit that first named the path — a `commit` provenance must reference a commit, Steps 1–12 build review m1; returns the id; never changes an existing row);"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@e77c768:L3104]] "`git log --no-merges -M -z --numstat --reverse --format=%x1e%H%x00%at%x00%s%x00%b%x00 <range>`"
- [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@HEAD:L571]] "const id = files.ensureHistoryRow(p, isSuspect(p), c.hash);"
**Correct verdict:** keep — the re-sign makes the stored provenance true, and its reason is stated at the line.

### E-16
**Agree/Disagree:** Agree with the substance: the three re-signs and the `pathWrites` outcome rule are right, and E-24/E-27 execute them. Disagree with the verdict, over one sentence these hunks wrote: "Every per-session reader takes the consumer". It is false for two readers in the same bullet's DAO: `okEdits(session)` and `okReads(session)` are per-session and take no consumer, in the plan's Step 9 `provides:` list and in the code built from it. Neither has a planned caller, so there is no behaviour to fix today. But the sentence gives a later builder a false invariant, and it is exactly the kind of sentence a reader would rely on to skip checking a new caller of `okEdits`. The brief's `keep` means the unit stands exactly as written, and this sentence does not.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@ca67af7:L2632-L2635]] "Every per-session reader takes the consumer, so a subagent's actions never appear in the main agent's `ObservedActionsReader`"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@ca67af7:L2501]] "observed_actions.okEdits, observed_actions.okEditedPaths, observed_actions.okReads"
- [[middleware/context-oracle/ctxoracle/src/stores/dao/observed_actions.ts@c3a25f0:L37-L38]] "okEdits(session: string): number; okReads(session: string): number;"
- [[ran]] `git grep -n "okEdits\|okReads" HEAD -- middleware/context-oracle/ctxoracle/src | grep -v "dao/observed_actions.ts"` → no output (no caller)
**Correct verdict:** replace — keep the three re-signs, the `outcome = 'ok'` rule and their reasons. Narrow the sentence to "every reader backing `ObservedActionsReader` takes the consumer", or give `okEdits`/`okReads` the consumer too, or remove them, since they have no caller.

### E-20
**Agree/Disagree:** Agree with the verdict (replace) and with two of its three corrections: the comment's error list, and the fact that the swallowed `ROLLBACK` has no backing. Disagree that the proposed fix is sufficient. I checked the design's completeness myself.
- **Coverage.** Every statement path is guarded: `prepare().run/get/all`, `exec`, `SAVEPOINT`/`RELEASE`, `integrityCheck`, `exportTo`, and `prepare` refuses while aborted.
- **Both shapes.** The nested shape and the direct-statement shape both end in `TransactionAborted` with no rows, both executed.
- **Clearing.** The mark is cleared only in the depth-0 catch, and the handle commits normally afterwards (T-3-5i2).
- **Redundancy.** The nested frame's `isTransaction` check is backed up by the undo-failure branch: removing the check still yields `TransactionAborted`, executed.

So the poison design is complete and correct. The flaw is the depth-0 swallow, and it is worse than the first audit states. If `ROLLBACK` fails while `isTransaction` is true, the frame sets `depth = 0` with the engine still inside the transaction. Every later statement run outside `transaction()` then joins that orphaned transaction. It is invisible to other connections and silently lost at `close`. The next `transaction()` fails with "cannot start a transaction within a transaction". I simulated the failure by making the `ROLLBACK` line throw (a simulation, not a reachability proof). The result: a later autocommit-style insert returned normally, another connection saw nothing, and after close the table was empty. The first audit's fix, rethrowing with the original error as `cause`, surfaces the failure once but leaves the handle in that state. A correct fix also takes the handle out of service: a non-clearing broken mark, so every later call throws, or closing the handle. After a failed `ROLLBACK` the connection's transaction state cannot be trusted. SQLite documents `ROLLBACK` failing only after an automatic rollback, which the guard excludes, so this branch is improbable. It is not shown impossible: an I/O error during rollback is one route.
**Evidence:**
- [[middleware/context-oracle/ctxoracle/src/stores/adapter.ts@c3a25f0:L284-L295]] "depth = 0; // The depth-0 unwind clears the abort mark and rethrows. aborted = false; // Skip ROLLBACK when the engine has already ended the transaction // (auto-rollback); otherwise undo everything the unit wrote. if (db.isTransaction) { try { db.exec('ROLLBACK'); } catch { /* the original error is what the caller needs */ } }"
- [[middleware/context-oracle/ctxoracle/src/stores/adapter.ts@c3a25f0:L313-L316]] "exec: (sql: string): void => guarded(() => db.exec(sql)),"
- [[middleware/context-oracle/ctxoracle/src/stores/adapter.ts@c3a25f0:L20-L21]] "whole transaction back on its own (after SQLITE_FULL, SQLITE_IOERR, * SQLITE_NOMEM or SQLITE_BUSY"
- [[ran]] `node rbfail.mjs <T:c3a25f0>` (a unit inserts 1 then throws; then `store.prepare('INSERT INTO t VALUES(7)').run()`; a second connection reads; then a new unit inserts 8; then close and re-read) → real code: `other connection sees: [7]` / `next unit committed` / `after close: [7,8]`; with `db.exec('ROLLBACK');` replaced by `throw new Error('simulated ROLLBACK failure');`: `autocommit-style insert of 7 returned` / `other connection sees: []` / `next unit threw: cannot start a transaction within a transaction` / `after close: []`
- [[ran]] `python3 mut.py <T:c3a25f0> C1-guard-and-nested-off src/stores/adapter.ts "      if (aborted || !db.isTransaction) {" → "      if (aborted) {" store_nesting` → `SURVIVED … # tests 12 # pass 12` (the undo-failure branch poisons the unit instead: redundant, not a hole)
- [[ran]] `node direct.mjs <T:c3a25f0>` → `outer: TransactionAborted: … isTA true` / `rows: []` (direct shape handled; see E-13, E-30)
- [[https://sqlite.org/lang_transaction.html]] "If the transaction has already been rolled back automatically by the error response, then the ROLLBACK command will fail with an error, but no harm is caused by this."
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B6c.md@HEAD:L327]] "rethrow a failed `ROLLBACK` with the original error as its cause instead of swallowing it"
**Correct verdict:** replace — keep `TransactionAborted`, `guarded`, the poison rule and the depth-0 refusal. On a failed `ROLLBACK`, throw with the original error as `cause` and put the handle into a non-clearing broken state (every later call throws) or close it. Correct the comment's error list to `SQLITE_FULL`, `SQLITE_IOERR`, `SQLITE_INTERRUPT`, `SQLITE_NOMEM`.

### E-22
**Agree/Disagree:** Agree with the substance: both reductions are §9's amended rows, marked and attributed to Step 14. Restoring one FTS insert makes the checkpoint test fail, and no caller of the search functions remains. Disagree with the verdict, over one line the diff left standing. `c3a25f0` rewrote `search.ts`'s bodies and dropped its `schemaMetaDao` import two lines below the header, but kept the header: "FTS5 MATCH when the store's fts_state is 'fts5', indexed LIKE otherwise". At 1R both functions return `[]`. The file's own new marks say the `LIKE` body "is not AD-2's fallback (the symbol_tokens range path)". So the header contradicts the body beneath it and batch 5's settled fallback design. A stale description of behaviour at the top of the module is a line that must change. It is the same test the B6a adjudication applied to the `TuningReader` comment (its E-8).
**Evidence:**
- [[middleware/context-oracle/ctxoracle/src/index/search.ts@c3a25f0:L1-L2]] "// The one search interface (Step 14, AD-2, D-plan-28): FTS5 MATCH when the store's // fts_state is 'fts5', indexed LIKE otherwise; same result shape either way."
- [[middleware/context-oracle/ctxoracle/src/index/search.ts@c3a25f0:L16-L18]] "its LIKE body still ran but // is not AD-2's fallback (the symbol_tokens range path)."
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B5-verification.md@HEAD:L119-L120]] "Store one row per token in both `symbol_tokens` and `path_tokens`, with paths tokenized, not segmented."
- [[ran]] `python3 mut.py <T:c3a25f0> C8-fts-insert-back src/index/indexer.ts (the fts_paths insert restored after the two DELETEs) checkpoint_1r_init` → `KILLED … # tests 1 # pass 0 # fail 1` / `not ok 1 - Checkpoint 1R (review M1): \`ctxoracle init\` then \`ctxoracle index\` exit 0 on an FTS5 build`
**Correct verdict:** replace — keep both reductions and their marks; reword `search.ts` L1–L2 to say the module is Step 14's search interface, reduced to `[]` at 1R, with no FTS/`LIKE` claim.

### E-23
**Agree/Disagree:** Agree with the verdict and the reasoning. A one-parameter re-sign, the reason at the line, and the mutant restoring `prov_ref: path` fails T-9-1r15.
**Evidence:**
- [[middleware/context-oracle/ctxoracle/src/stores/dao/files.ts@c3a25f0:L116]] "{ prov_kind: 'commit', prov_ref: commitHash, trust: 'untrusted_repo', injection_suspect: injectionSuspect },"
- [[ran]] `python3 mut.py <T:c3a25f0> C6-provref-path src/stores/dao/files.ts "prov_ref: commitHash," → "prov_ref: path," dao_crud` → `KILLED … # tests 39 # pass 38 # fail 1` / `not ok 39 - T-9-1r15 (review m1): files.ensureHistoryRow(path, injectionSuspect, commitHash) stores prov_ref = commitHash`
**Correct verdict:** keep — resolves B6a E-13 exactly.

### E-24
**Agree/Disagree:** Agree with the verdict and the reasoning. I planted consumer-blind forms of all three re-signed queries, plus the dropped outcome filter. Each fails its own r-test.
**Evidence:**
- [[middleware/context-oracle/ctxoracle/src/stores/dao/observed_actions.ts@c3a25f0:L113]] "WHERE session = ? AND consumer = ? AND seq > ? AND outcome = 'ok' AND path IS NOT NULL"
- [[ran]] `python3 mut.py <T:c3a25f0> <name> src/stores/dao/observed_actions.ts … dao_crud` with `consumer = ?` → `(consumer = ? OR 1)` in `pathWrites` (C4), `firstHash` (O1), `hashesFor` (O2), and `AND outcome = 'ok'` dropped from `pathWrites` (C5) → `KILLED` ×4: `not ok 35 - T-9-1r13a`, `not ok 36 - T-9-1r13b`, `not ok 37 - T-9-1r13c`, `not ok 38 - T-9-1r14`
**Correct verdict:** keep — the reader's declared scope is now honoured by its three backers.

### E-25
**Agree/Disagree:** Agree that the two refusals are right: they are placed before the relations, the numeric check derives from the seed, and they are consistent with `parseNum`. Disagree with the verdict, over one choice the diff made with no backing: the unknown-key branch admits every list key (`!LIST_BY_KEY.has(key)`). `checkTuningWrite` returns only `ok`/`refused` and does not know the write's form. Step 33 names it as the check a *scalar* write passes, and list keys use `+<v>`/`-<v>`. So a scalar write naming a list key passes the gate. The scalar setter deletes every NULL-level row of the key and inserts one. Executed: `checkTuningWrite(reader, 'lexicon.stoplist', 'foo')` → `{"ok":true}`, and one `tuning.set` on that key replaced the eight seeded members with `["foo"]`. This is the same "a write nothing reads as intended" class the refusal was added to stop, and it destroys the list silently. No test pins the list-key admission either way: a mutant that refuses list keys survives the whole suite. The first audit's "Would be wrong if" treats admitting list keys as correct without asking whether a scalar gate should admit them.
**Evidence:**
- [[middleware/context-oracle/ctxoracle/src/stores/dao/tuning.ts@c3a25f0:L194-L196]] "const scalarSeed = SCALAR_BY_KEY.get(key); if (scalarSeed === undefined && !LIST_BY_KEY.has(key)) {"
- [[middleware/context-oracle/ctxoracle/src/stores/dao/tuning.ts@c3a25f0:L31-L36]] "store.prepare('DELETE FROM tuning WHERE key = ? AND project_key IS NULL').run(key);"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@e77c768:L6131-L6134]] "`tune <key> <value>` for scalars, `tune <key> +<v>` / `-<v>` for list keys, `tune` alone lists keys, current values (list keys show members), sources, and defaults. A scalar write is first checked with Step 12's `checkTuningWrite`;"
- [[ran]] `node k1.mjs <T:c3a25f0>` (fresh global store, `applyMigrations(g, {fts: false, scope: 'global'})`, `seedDefaults(g)`) → `members before: 8` / `checkTuningWrite(lexicon.stoplist, "foo"): {"ok":true}` / `members after one scalar set: ["foo"]`
- [[ran]] `python3 mut.py <T:c3a25f0> K1-list-key-refused src/stores/dao/tuning.ts "if (scalarSeed === undefined && !LIST_BY_KEY.has(key)) {" → "if (scalarSeed === undefined) {" ALL` → `SURVIVED … # tests 168 # pass 167 # fail 0 # skipped 0 # todo 1`
- [[ran]] `python3 mut.py <T:c3a25f0> C7a-unknown-ok … "if (false) {" tuning_reader` → `KILLED … not ok 35 - T-12-3c`; `C7b-nonnumeric-ok` → `KILLED … not ok 36 - T-12-3d`
**Correct verdict:** replace — keep both refusals and their reasons. Refuse a scalar write that names a list key (`refused: <key> is a list; use +<v>/-<v>`), with a T-12-3 case, and state the rule in plan Step 12 (E-17's hunk).

### E-26
**Agree/Disagree:** Agree with the verdict and the reasoning. The test drives the built CLI on a real repository, asserts FTS5 as a precondition instead of skipping, and forces new work between `init` and `index`. Restoring one FTS insert fails it.
**Evidence:**
- [[middleware/context-oracle/ctxoracle/test/unit/checkpoint_1r_init.test.ts@c3a25f0:L32]] "assert.equal(probeFts5(probeStore), true, 'precondition: the runtime is an FTS5 build');"
- [[ran]] `python3 mut.py <T:c3a25f0> C8-fts-insert-back … checkpoint_1r_init` → `KILLED … # tests 1 # pass 0 # fail 1`
**Correct verdict:** keep — pins the owner-visible 1R property B6a E-23 found broken.

### E-27
**Agree/Disagree:** Agree with the verdict and the reasoning. In the fixture the subagent writes the shared path first, so a consumer-blind query returns the wrong hash or path. All five new tests fail on their mutants (E-24's four plus C6).
**Evidence:**
- [[middleware/context-oracle/ctxoracle/test/unit/dao_crud.test.ts@c3a25f0:L805]] "assert.equal(oa.firstHash(S, C, 'shared.ts'), 'main1', \"main's first hash, not the subagent's earlier one\");"
- [[ran]] the four `observed_actions` mutants of E-24 and `C6-provref-path` against `dao_crud` → `KILLED` ×5, failing `T-9-1r13a`, `T-9-1r13b`, `T-9-1r13c`, `T-9-1r14`, `T-9-1r15` respectively
**Correct verdict:** keep — discriminating, and closes batch 4's `firstHash` item.

### E-29
**Agree/Disagree:** Agree that the `todo` cause string is now true and that dropping the FTS clause was right. Disagree with the verdict: the rewritten comment states an observed stop point that is false, and the first audit accepted it without running the test. The comment says "the first PreToolUse prints nothing to parse". Executed, the test gets past both PreToolUse steps: the deny parses and matches, the read is not denied, and the edit is allowed after the answer. It fails at the first PostToolUse, the coupling whisper, whose `JSON.parse` receives empty output. That failure does follow from the stated cause, since the generators return no candidates. A manual replay of the same hook sequence prints the deny JSON on the first PreToolUse. The implementation log for this commit repeats the false stop point, which is E-32's unit. A record that names the wrong failing step sends the Step 28 builder to look at the deny path, which works.
**Evidence:**
- [[middleware/context-oracle/ctxoracle/test/unit/skeleton_e2e.test.ts@c3a25f0:L17-L20]] "the first PreToolUse // prints nothing to parse, because every generator returns no candidates and // the 4-commit repository meets no corpus floor."
- [[middleware/context-oracle/ctxoracle/test/unit/skeleton_e2e.test.ts@c3a25f0:L89]] "const whisper = JSON.parse(hook('PostToolUse', read)) as { hookSpecificOutput: { additionalContext: string } };"
- [[ran]] `node --test dist/test/unit/skeleton_e2e.test.js` in `<T:c3a25f0>` → `not ok 1 - skeleton: … # TODO …` / `error: 'Unexpected end of JSON input'` / stack `TestContext.<anonymous> (…/dist/test/unit/skeleton_e2e.test.js:70:30)`; `sed -n 70p dist/test/unit/skeleton_e2e.test.js` → `        const whisper = JSON.parse(hook('PostToolUse', read));`
- [[ran]] manual replay in a fresh 4-commit repository with `CTXORACLE_HOME` in scratch (`init`, `SessionStart`, `UserPromptSubmit` "where do we store the schema version?", the human transcript line, then `PreToolUse` Edit of `src/api/handler.ts`) → `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"answer Max's question first: \"where do we store the schema version?\""}}`
- [[middleware/context-oracle/docs/implementation-log.md@c3a25f0:L961-L963]] "test now stops at the first PreToolUse, which prints nothing because no generator yields candidates"
**Correct verdict:** replace — keep the `todo` mark and its cause string; correct the comment to say the test stops at the first PostToolUse (the coupling whisper), which prints nothing because no generator yields candidates.

### E-30
**Agree/Disagree:** Agree that T-3-5i is plan case (i) exactly, that the conditional skip is visible rather than a silent pass, and that the `b229c04` behaviour fails both tests. Disagree with the verdict. Both tests produce the abandonment inside an inner `transaction`, so they exercise only the nested frame's detection. That detection is itself doubly redundant: removing the nested `isTransaction` check still yields `TransactionAborted` through the undo-failure branch. The adapter's one guard for the direct shape is the statement-level mark in `guarded`: a statement failing at depth 1, caught by the unit, followed by another write. Nothing pins it. Deleting that line passes the whole suite, and in the direct shape the mutant reproduces S1's executed defect: rows `[3]` durable, row 1 lost. T-3-5i2's title claims "every statement … throws `TransactionAborted`", but it covers `prepare().run/get/all`, `exec` and a nested call, not `integrityCheck` or `exportTo`. Those two are read-only or export-only, so their gap carries no atomicity risk, but the title overclaims.
**Evidence:**
- [[middleware/context-oracle/ctxoracle/test/unit/store_nesting.test.ts@c3a25f0:L295-L304]] "store.transaction(() => { ins(store, 1); try { store.transaction(() => { insertTooLarge(store); }); } catch (e) { innerErr = e; // the unit of work catches the inner error and continues } ins(store, 3);"
- [[middleware/context-oracle/ctxoracle/test/unit/store_nesting.test.ts@c3a25f0:L343-L348]] "store.transaction(() => { ins(store, 1); try { store.transaction(() => { insertTooLarge(store); });"
- [[middleware/context-oracle/ctxoracle/src/stores/adapter.ts@c3a25f0:L200]] "if (depth > 0 && !db.isTransaction) aborted = true;"
- [[ran]] `python3 mut.py <T:c3a25f0> A1-guarded-nopoison src/stores/adapter.ts (L200 deleted) ALL` → `SURVIVED … # tests 168 # pass 167 # fail 0 # skipped 0 # todo 1`; `node direct.mjs` with A1 applied → `outer: Error: cannot commit - no transaction is active isTA false` / `rows: [3]`; real code → `outer: TransactionAborted: … isTA true` / `rows: []`
- [[ran]] `python3 mut.py <T:c3a25f0> A3-depth0-noclear … "        aborted = false;\n" → "" ALL` → `KILLED … not ok 126 - T-3-5i…` / `not ok 127 - T-3-5i2…`; `A2-depth0-norefuse` → `KILLED … not ok 127 - T-3-5i2…`; `A5-integrity-unguarded` and `A6-export-unguarded` → `SURVIVED … # fail 0`
- [[ran]] `npm test` in `<T:c3a25f0>` → `# skipped 0` (the skip branch is not taken on Node 22.22.2)
**Correct verdict:** replace — keep T-3-5i and T-3-5i2. Add a direct-statement case: the too-large insert runs at depth 1 with no inner `transaction`, is caught, and is followed by another insert, asserting `TransactionAborted` at depth 0 and no rows. Either cover `integrityCheck`/`exportTo` in T-3-5i2 or narrow its title.

### E-31
**Agree/Disagree:** Agree with the verdict and the reasoning. Each refusal has its own test, fails when its branch is removed, and the accept case guards against over-refusal. One assertion is vacuous for one datum and changes nothing: `includes('')` is always true for the empty value, and the key-name assertion beside it still discriminates. The list-key case that E-25's correction requires is an addition to this file, not a defect in these three tests.
**Evidence:**
- [[middleware/context-oracle/ctxoracle/test/unit/tuning_reader.test.ts@c3a25f0:L235]] "for (const value of ['abc', 'Infinity', '', '3 apples']) {"
- [[ran]] `python3 mut.py <T:c3a25f0> C7a-unknown-ok … tuning_reader` → `KILLED … not ok 35 - T-12-3c (review M3)…`; `C7b-nonnumeric-ok` → `KILLED … not ok 36 - T-12-3d (review M3)…`
**Correct verdict:** keep — discriminating as written; E-25's list-key refusal adds its own case here.

### E-33
**Agree/Disagree:** Agree with the verdict (replace) and with the first audit's correction: STATUS must say that `c3a25f0` was not independently reviewed. Disagree with its finding that "every checkable claim is true" as a statement about the record when it was written. "CI is green" was asserted before any CI test run on the fixed code had finished. The STATUS commit `e77c768` was created at 04:18:49Z. `c3a25f0` itself carries only the two Socket checks. The first CI test jobs on a tree containing the fixes ran on `95de037` and completed at 04:19:13Z and 04:19:17Z. `e77c768`'s own test jobs completed at 04:19:30Z and 04:19:33Z, and its `check-plan` at 04:21:22Z. The last CI result that existed at 04:18:49Z was `ca67af7`'s, whose tree has the 155-test suite, not the 168 the same sentence reports. The claim turned out true, but CLAUDE.md rule 1 and the repository's verify-before-assert rule forbid stating a result before the check has run; a later success does not make the claim backed when it was made. The rest of "Checkpoint 1R reached" holds against §9's exit as written. The counts reproduce, the only `todo` is `skeleton_e2e`, `init`/`index` run on FTS5, and the owner-visible sanity check was run and recorded at `b229c04`, whose migrations `c3a25f0` does not change.
**Evidence:**
- [[middleware/context-oracle/docs/STATUS.md@e77c768:L295-L296]] "`npm test`: 168 tests, 167 pass, 0 fail, 1 `todo`, and CI is green."
- [[ran]] `git log --format='%h %cI %s' c3a25f0^..e77c768` → `e77c768 2026-09-26T04:18:49+00:00 context-oracle: STATUS — Checkpoint 1R reached; next is Step 13` / `95de037 2026-09-26T04:18:37+00:00 …` / `c3a25f0 2026-09-26T04:18:35+00:00 …`
- [[ran]] `curl -sS -H "Accept: application/vnd.github+json" https://api.github.com/repos/Maxcogar/agent-armory/commits/<sha>/check-runs` → `c3a25f0`: `total 2` (`Socket Security: Pull Request Alerts | completed | neutral`, `Socket Security: Project Report | completed | success`); `95de037`: `test (22.x) | completed | success | 2026-09-26T04:18:45Z | 2026-09-26T04:19:13Z`, `test (22.16.0) | … | 2026-09-26T04:19:17Z`; `e77c768`: `test (22.16.0) | completed | success | 2026-09-26T04:18:58Z | 2026-09-26T04:19:33Z`, `test (22.x) | … | 2026-09-26T04:19:30Z`, `check-plan | … | 2026-09-26T04:21:22Z`; `ca67af7`: `test (22.16.0) | completed | success | … | 2026-09-26T04:07:35Z`
- [[middleware/context-oracle/docs/implementation-log.md@c3a25f0:L920]] "## Fixes after the Steps 1–12 build review — BUILT (2026-09-26, uncommitted, pending independent review)"
- [[middleware/context-oracle/docs/implementation-log.md@c3a25f0:L865]] "- Owner-visible sanity check (script over the built `dist/`, fresh stores,"
- [[ran]] `grep -ln "c3a25f0\|TransactionAborted" middleware/context-oracle/docs/reviews/*.md | grep -v branch-audit` → no output (no review covers the fix commit)
**Correct verdict:** replace — keep the checkpoint claim and the removed step. Add in plain words that the code-fix commit `c3a25f0` was not independently reviewed. Replace "CI is green" with the CI result observed after the push (the run and its outcome), never a result asserted before the run.
