# Review record — reopened Steps 1–12 build deltas + Checkpoint 1R (commit `b229c04`)

*Point-in-time review record. Written once, never edited. Independent reviewer:
wrote neither the tests nor the code under review. Scope: `git diff
c41265c..b229c04 -- ctxoracle/ docs/implementation-log.md`, judged against the
"Reopened 2026-09-26 — build delta" paragraphs of plan Steps 1, 3, 4, 5, 6, 7,
8, 9, 10, 12, §6, §7's cross-cutting conventions, §9 Checkpoint 1R and the §12
test specifications they name.*

## Verdict

**Conforms to the deltas, with one Serious code defect open.** The built code
does what the ten delta paragraphs and §9's placeholder table state. I found no
place where the code contradicts a delta sentence. The migrations match the plan
DDL line for line, the DAO surface matches the Step 9 `provides:` list, and the
§9 stand-ins are the ones the table names (plus the unlisted ones the builder
reported). The suite's pass count was hollow in one respect: **31 of 54
non-equivalent hand mutations of the delta behaviour survived the builder's
tests**. This review added 30 tests, and all 54 are now killed. One Serious
defect stays open, because the review may not change `src/`. Under SQLite's
auto-rollback errors, a nested transaction can make a unit of work that reported
failure leave a partial write durable. Fix it before Step 13 adds the first
callers that nest and catch. Three Moderate plan-level gaps go to the plan's
owner.

Phase-goal check (CLAUDE.md rule 3): the one Serious finding and M3 are
integrity problems in the foundation that every later step and the Phase A exit
measurement read through. They serve the "honest deterministic foundation" goal
directly and are not review polish.

## Findings

### Serious

**S1 — A failed savepoint undo is swallowed. After SQLite auto-rolls-back the
transaction, later writes autocommit and a unit of work that reports failure
leaves a partial write durable.** `ctxoracle/src/stores/adapter.ts:162-181`
(`nested`, the `catch {}` at :173-176 whose comment says "the outer
transaction's own rollback covers a failed savepoint undo"). The depth-0 path
has the same problem at :204-212.
- *Standard / evidence.* SQLite, "Response To Errors Within A Transaction": on
  `SQLITE_FULL`, `SQLITE_IOERR`, `SQLITE_BUSY`, `SQLITE_NOMEM` (and interrupt),
  SQLite may roll back the whole transaction, and the application must detect
  this. AD-26 and the Step 3 delta require that "a caller wrapping several DAO
  calls in one outer `transaction` makes them one atomic unit". T-3-5(b) makes
  "inner throws, outer catches and continues" a supported pattern.
- *Executed here* through the real adapter, the HEAD copy of
  `src/stores/adapter.ts` run with `node --experimental-strip-types` on Node
  22.22.2. Setup: `max_page_count` = page_count + 2. The outer transaction
  inserts 1. The inner transaction inserts a 200 kB blob and fails with
  `SQLITE_FULL`, and the outer catches that error. The outer then inserts 3.
  Output:
  `inner error caught by the unit of work: database or disk is full` /
  `outer transaction threw: cannot commit - no transaction is active` /
  `rows durable after the failed unit of work: [ 3 ]`.
  So row 1 is lost, row 3 is committed, and the caller sees an error. What
  happens: after `SQLITE_FULL`, `db.isTransaction` is `false`, `ROLLBACK TO sp1`
  fails with "no such savepoint" (swallowed), `depth` stays 1, and every later
  statement runs in autocommit mode.
- *Fix (code).* After any throw inside `nested`, and after a throw from `fn` at
  depth 0, read `db.isTransaction`. If it is `false`, the transaction is gone.
  Mark the handle so that every `prepare(...).run/get/all` and `exec` issued
  while `depth > 0` throws a typed error, for example `StoreTransactionLost`.
  The depth-0 frame then rethrows that error instead of attempting `COMMIT`.
  Replace the false comment. Add a T-3-5 case (i) with the `max_page_count`
  reproduction above. `isTransaction` exists on 22.22.2 (executed: `typeof
  db.isTransaction === 'boolean'`). Whether it exists on the 22.16.0 floor must
  be checked before relying on it; if it does not, fall back to comparing
  `PRAGMA` state or to issuing `SAVEPOINT` probes.
- *Owning layer.* Code, plus a new T-3-5 row in the plan's §12.
- *Latent, not yet triggered.* No caller at 1R catches an inner error. Steps 13,
  14, 28 and 30 introduce the nesting units of work, so the fix belongs before
  Step 13.

### Moderate

**M1 — The builder's plan flaw #1 holds. The build also continued past §9's
stop rule, so at 1R `ctxoracle init` / `index` throws on every FTS5-capable
host.** `ctxoracle/src/index/indexer.ts:229-231` and `:246` (`INSERT INTO
fts_paths(path, file_id)`, `INSERT INTO fts_symbols(name, kind, file_id)`), and
`ctxoracle/src/index/search.ts:30,52`. Plan Step 7 (plan line 2341) claims "the
one skeleton statement this schema breaks at run time".
- *Evidence (executed).* Applying `001b_phase_a_fts.sql` to an empty engine
  and running the two skeleton inserts gives `table fts_paths has no column
  named path` and `table fts_symbols has no column named name`. The Step 7
  premise is therefore false. No §9 placeholder covers the indexer's FTS
  writes. `search.ts` is broken but is in no `modify:` list. §9 (plan
  lines 6976-6977) says "a file the build finds broken that is not listed is
  expert-implement's `BLAST-RADIUS-EXCEEDS-PLAN` stop". The builder logged the
  break (implementation log, finding 1) and did not stop. It then widened the
  `todo` reason of `skeleton_e2e.test.ts` to cover a cause §9 had not
  sanctioned.
- *Fix (plan).* Add §9 rows for these two stand-ins, both retired by Step 14:
  - the indexer's FTS writes removed at 1R (rule 2);
  - `search.ts` reduced to return `[]`, or declared unreachable with a mark.

  Correct Step 7's "one run-time break" sentence.
- *Owning layer.* Plan (the skipped stop is a process finding against the
  build).

**M2 — `ObservedActionsReader` is scoped to "this session and consumer", but
three of its DAO backers take only a session.** Plan Step 6 (line 1916)
declares the reader "(this session and consumer)". Step 9 re-signs
`runs(session, consumer)` and `okEditedPaths(session, consumer)` but leaves
`pathWrites(session, sinceSeq)`, `firstHash(session, path)` and
`hashesFor(session, path)` session-wide. The code follows the plan:
`ctxoracle/src/stores/dao/observed_actions.ts:105,116,126` and
`ctxoracle/src/types/events.ts:63`.
- *Standard / evidence.* AD-4 and the §7 consumer convention ("Every
  consumer-keyed read and write uses the consumer key"). With these signatures
  the Step 28 reader cannot honour its declared scope, so a subagent's edits
  would appear in the main agent's `hashesFor` / `pathWrites`. That is the G23
  cross-consumer class the consumer key was introduced to close.
- *Fix (plan).* Either add `consumer` to the three DAO methods, or restate the
  reader's contract as session-scoped for those members, with the reason.
- *Owning layer.* Plan.

**M3 — `tune` can store a value that the reader then refuses on every read.**
`ctxoracle/src/stores/dao/tuning.ts:181` (`checkTuningWrite` returns `{ok:
true}` for every key outside AD-14's relations) and `:85-88` (`num` throws on a
non-finite value).
- *Evidence.* Plan Step 33 (lines 6104-6107) makes `checkTuningWrite` the only
  check a scalar write passes. So `tune bar.support_min abc` is accepted, and
  every later `reader.num('bar.support_min')` throws. The handler fails open,
  which means the oracle goes silent with only `handler_exception` faults.
  T-12-2g, added by this review, pins that `num` throws. The builder's
  plan-silence decision ("`{ok: true}` for keys outside AD-14's relations")
  matches the letter of the delta. The gap is in the plan.
- *Standard.* ISO/IEC 25010 fault tolerance and input validation at the trust
  boundary (OWASP ASVS V5: validate input against the expected type before
  persisting it).
- *Fix (plan Step 12/33).* `checkTuningWrite` should refuse:
  - a scalar value that does not parse as a finite number when the key's seed
    value does;
  - a key absent from `tuning_seeds.ts`, which the reader already treats as a
    bug.
- *Owning layer.* Plan, then code.

**M4 — Test gaps: 31 of 54 non-equivalent mutations of delta behaviour
survived the builder's suite.** See the mutation table. The gaps cover every
step reviewed:
- `mustExist`'s ENOTDIR and other-errno branches;
- `backupFile`'s read-only source;
- "onBusyRetry exactly once";
- the BOM, backslash and empty-field rules of the path decoder;
- `consumerRole`'s first-`#` rule;
- `labelled_touches`' CHECK;
- 14 of the Step 9 DAO sentences, including the re-signs the brief named:
  `runs` returning rows and `session_log.append` returning `{id, seq}`;
- `writeSessionEvent`'s return value;
- four `tuningReader` sentences (list re-seed, cache, `num` throws, tier
  equality).

*Standard.* §7's test-first contract ("A test that passes before the step's
code changes ... is not testing the decision") and the §12 "Fails when" clauses.
*Fix.* Applied: the 30 tests listed below. *Owning layer.* Code (tests).
**Closed by this review.**

### Minor

**m1 — `ensureHistoryRow` writes `prov_ref = path` under `prov_kind =
'commit'`.** `ctxoracle/src/stores/dao/files.ts:115`. A provenance reference
that is not of its declared kind does not identify the source entity (FR-K6;
W3C PROV-DM: provenance identifies the entity a record derives from). The only
caller has the hash in hand: the Step 13 miner. The skeleton's own placeholder
wrote `prov_ref: hash` (`ctxoracle/src/miner/cochange.ts:201`). The builder's
choice was forced by the plan's signature `ensureHistoryRow(path,
injectionSuspect)`, so as a plan-silence decision it does not hold as the final
answer. *Fix (plan).* Re-sign it as `ensureHistoryRow(path, injectionSuspect,
commitHash)`. *Owning layer.* Plan. Nothing reads `prov_ref` yet.

**m2 — `pathWrites` counts failed edits.**
`ctxoracle/src/stores/dao/observed_actions.ts:105-115`. It has no `outcome =
'ok'` filter, while `okEditedPaths`, `hashesFor`, `firstHash` and
`writtenSinceSeq` all filter. G22 says "a failed Edit is not a change", and the
Step 9 table (a) groups `pathWrites` with the change consumers. The plan says
nothing on this point, and the old code had the same behaviour. *Fix (plan).*
State the outcome rule for `pathWrites`. *Owning layer.* Plan.

**m3 — Directory creation leaves a window at the umask mode.**
`ctxoracle/src/identity/layout.ts:48-49`. The code calls `mkdirSync(dir,
{recursive: true})` and only then `chmodSync(dir, 0o700)`. Between the two
calls the new directory has the umask mode, and `ensureHome` extends this to
`diagnostics/`. OWASP ASVS V14 / CWE-379: create restrictive resources with the
restrictive mode in the creating call. *Fix.* `mkdirSync(dir, {mode: 0o700})`
for the last component, keeping the `chmod` as the umask backstop. *Owning
layer.* Code. The pattern predates the delta.

## The builder's plan-silence decisions — judged

| Decision | Holds? | Evidence |
|---|---|---|
| `decodePathBytes` uses `ignoreBOM: true` | **Holds** | WHATWG Encoding: with the flag unset, a leading BOM is stripped. Executed: the default decoder turns `EF BB BF 61` into `"a"`, which would key two byte strings as one path (the G7 class). Now pinned by T-5-4h. |
| `markAbsentExcept` / `consumer_state.hasAny` bind lists through `json_each(?)` | **Holds** | Keeps one host parameter, so SQLite's `SQLITE_MAX_VARIABLE_NUMBER` limit is never met. JSON integers come back as INTEGER and compare correctly with `files.id` (T-9-1 markAbsentExcept cases pass). |
| `ensureHistoryRow`'s `prov_ref` is the path | **Does not hold as the final answer** (forced by the plan's signature) | m1 |
| `landmines.createHuman` refuses non-`human` provenance | **Holds** | `provCreateValues` alone accepts `commit`/`untrusted_repo`, which would record repo-derived text as owner-stated (FR-X4). Pinned by T-9-1r12. |
| `oracleRunSync` throws on a spawn failure | **Holds** | The declared return type cannot represent a child that never started: `status: null` already means a signal, and `spawnSync` then returns `stdout` as `undefined` (executed: `ENOENT null undefined null` for error code, status, stdout, signal). A truncated `maxBuffer` read must not pass as output. Pinned by T-5-5d. |
| Indexer's inline `DELETE FROM files` loop removed | **Holds** | Under the no-cascade schema it would throw for any history-referenced file, and §9's stated effect is "a file gone from the tree keeps its row at 1R". |
| `runs().segments` typed `unknown[] \| null` | **Holds** | `SegmentClass` is Step 17's. |
| `checkTuningWrite` returns `{ok: true}` outside AD-14's relations | **Letter-compliant; exposes a plan gap** | M3 |

## The builder's reported plan flaws — judged

1. **Step 7's "one run-time break" premise is false.** *Holds*, verified by
   execution (M1). The build should have issued §9's stop instead of continuing.
2. **§9's indexer row names a call the skeleton does not make.** *Holds*
   (`git diff` shows the inline `DELETE` loop, not `files.deleteMissing`). This
   is a documentary flaw only: the removal achieves the row's stated effect.
3. **Stand-ins the §9 table does not enumerate.** *Holds.* Each one is in a
   listed file. The `consumerRole(consumer)` replacement is required for
   correctness: `consumer === 'main'` on a `ConsumerKey` (`s#main`) never
   matches and would have silently disabled the block (handler diff, steps 5–6
   of the pipeline).
4. (Plan silences, judged above.)
5. **"Seven" fixture names versus the eighth, `recency-weighting`.** *Holds.*
   §5.1 (plan line 690) and Step 1's `create:` list carry `recency-weighting`,
   and T-1-3's literal pins §5.1.

## Hand mutation testing

Method: one textual mutation per run to `src/` (TypeScript or migration SQL),
then `npm run build && npm test`, and a mutation counts as killed on a non-zero
exit (a compile error counts as killed only when the mutation is a realistic
edit). The harness reverted each mutation with `git checkout -- <file>`.
Afterwards, `git diff --stat -- ctxoracle/src` was empty. Two first-draft
mutations (S9-13, S12-5) did not compile and were rewritten into compiling
forms before being scored. The table reports only the compiling forms. The
failing test named for the "after" column is the first non-`todo` failure the
run reported.

**Score.** 56 mutations: Step 3 ×9, 4 ×1, 5 ×5, 6 ×5, 7 ×7, 8 ×1, 9 ×17, 10 ×1,
12 ×10. Two are equivalent (see below).
- **Before this review's tests:** 21 killed / 54 non-equivalent (38.9%).
- **After:** 54 / 54 (100%).

| # | Mutation | File:line | Before | After | Test that kills it (after) |
|---|---|---|---|---|---|
| S3-1 | nested throw: drop ROLLBACK TO (keep RELEASE) | `src/stores/adapter.ts:172` | killed | killed | T-3-5b |
| S3-2 | nested success: drop RELEASE | `src/stores/adapter.ts:179` | survived | survived | — (equivalent; see note) |
| S3-3 | mustExist: open without mode=rw | `src/stores/adapter.ts:137` | killed | killed | T-3-5f |
| S3-4 | ENOTDIR classified StoreUnreadable, not StoreMissing | `src/stores/adapter.ts:111` | survived | killed | T-3-5g2 (review) |
| S3-5 | every stat errno classified StoreMissing | `src/stores/adapter.ts:111` | survived | killed | T-3-5h2 (review) |
| S3-6 | backupFile source opened read-write | `src/stores/adapter.ts:278` | survived | killed | T-3-6b (review) |
| S3-7 | no savepoint at depth>0 (BEGIN again) | `src/stores/adapter.ts:187` | killed | killed | T-3-5a |
| S3-8 | onBusyRetry fired on every busy BEGIN, not once | `src/stores/adapter.ts:196` | survived | killed | T-3-3b (review) |
| S3-9 | depth>0 runs fn with no savepoint (inner throw not rolled back) | `src/stores/adapter.ts:187` | killed | killed | T-3-5b |
| S4-1 | ensureHome does not create diagnostics/ | `src/identity/layout.ts:70` | killed | killed | T-4-1a |
| S5-1 | decoder strips a leading BOM | `src/util/path_bytes.ts:14` | survived | killed | T-5-4h (review) |
| S5-2 | decoder substitutes U+FFFD | `src/util/path_bytes.ts:14` | killed | killed | T-5-4b |
| S5-3 | escapeBytes keeps backslash literal | `src/util/path_bytes.ts:43` | survived | killed | T-5-4g (review) |
| S5-4 | splitNul drops empty middle fields | `src/util/path_bytes.ts:22` | survived | killed | T-5-4f (review) |
| S5-5 | oracleRunSync swallows a spawn failure | `src/util/spawn.ts:126` | survived | killed | T-5-5d (review) |
| S6-1 | consumerRole reads after the last # | `src/types/consumer.ts:28` | survived | killed | T-6-4f (review) |
| S6-2 | consumerRole accepts any main* suffix | `src/types/consumer.ts:30` | survived | killed | T-6-4g (review) |
| S6-3 | empty agent id keyed as subagent | `src/types/consumer.ts:18` | killed | killed | T-6-4a |
| S6-4 | fault code handler_exception dropped | `src/diag/fault_codes.ts:47` | killed | killed | T-6-1 |
| S6-5 | slot.path carries any extra field it is handed | `src/types/headline.ts:36` | survived | killed | Step 6 (review) slot builders |
| S7-1 | drop files.in_tree CHECK | `src/stores/migrations/001_phase_a_project.sql:36` | killed | killed | T-7-1e |
| S7-2 | cochange_pairs cascade on files delete | `src/stores/migrations/001_phase_a_project.sql:87` | killed | killed | T-7-1h |
| S7-3 | miner key not partial (covers human_stated) | `src/stores/migrations/001_phase_a_project.sql:109` | killed | killed | T-7-1i |
| S7-4 | drop corrections genre CHECK | `src/stores/migrations/001_phase_a_project.sql:148` | killed | killed | T-7-1j |
| S7-5 | session_log.seq not a rowid alias | `src/stores/migrations/001_phase_a_project.sql:184` | killed | killed | T-7-1k |
| S7-6 | drop labelled_touches.label CHECK | `src/stores/migrations/001_phase_a_project.sql:114` | survived | killed | T-7-1n (review) |
| S7-7 | labelled_touches cascade on files delete | `src/stores/migrations/001_phase_a_project.sql:113` | killed | killed | T-7-1h |
| S8-1 | whisper_stats keyed by genre only | `src/stores/migrations/002_phase_a_global.sql:17` | killed | killed | T-8-1 |
| S9-1 | markAbsentExcept also returns history-only rows | `src/stores/dao/files.ts:136` | survived | killed | T-9-1r1 (review) |
| S9-2 | sweepUnreferenced ignores change_count | `src/stores/dao/files.ts:146` | survived | killed | T-9-1r2 (review) |
| S9-3 | sweepUnreferenced deletes in-tree rows | `src/stores/dao/files.ts:146` | survived | killed | T-9-1r2 (review) |
| S9-4 | bump tie keeps old last_commit | `src/stores/dao/cochange_pairs.ts:52` | survived | killed | T-9-1r4 (review) |
| S9-5 | ensureHistoryRow drops the path's injection flag | `src/stores/dao/files.ts:115` | survived | killed | T-9-1r3 (review) |
| S9-6 | runs returns no rows | `src/stores/dao/observed_actions.ts:101` | survived | killed | T-9-1r6 (review) |
| S9-7 | runs ignores the consumer | `src/stores/dao/observed_actions.ts:101` | survived | killed | T-9-1r6 (review) |
| S9-8 | session_log.append returns a wrong seq | `src/stores/dao/session_log.ts:69` | survived | killed | T-9-1r8 (review) |
| S9-9 | pathWrites ignores sinceSeq | `src/stores/dao/observed_actions.ts:110` | survived | killed | T-9-1r7 (review) |
| S9-10 | pathWrites ordered by path, not seq | `src/stores/dao/observed_actions.ts:111` | survived | killed | T-9-1r7 (review) |
| S9-11 | rebuildMinerKinds not atomic | `src/stores/dao/landmines.ts:76` | survived | killed | T-9-1r9 (review) |
| S9-12 | setEntryScore writes an unchanged value | `src/stores/dao/files.ts:167` | survived | killed | T-9-1r5 (review) |
| S9-13 | keysWithPrefix via LIKE (wildcards live) | `src/stores/dao/global_meta.ts:33` | survived | killed | T-9-1r11 (review) |
| S9-14 | createHuman accepts non-human provenance | `src/stores/dao/landmines.ts:87` | survived | killed | T-9-1r12 (review) |
| S9-15 | replaceForProject deletes every project's rows | `src/stores/dao/whisper_stats.ts:34` | killed | killed | T-9-1 (2026-09-26) whisper_stats.replaceForProject twice |
| S9-16 | okEditedPaths includes failed edits | `src/stores/dao/observed_actions.ts:143` | killed | killed | T-9-1 (2026-09-26) observed_actions okEditedPaths |
| S9-17 | replaceForProject not atomic | `src/stores/dao/whisper_stats.ts:33` | survived | killed | T-9-1r10 (review) |
| S10-1 | writeSessionEvent drops the id/seq | `src/diag/session_writer.ts:14` | survived | killed | Step 10 (review) writeSessionEvent |
| S12-1 | skip the tier invariant | `src/stores/dao/tuning.ts:212` | killed | killed | T-12-3 |
| S12-2 | tier invariant strict (> not >=) | `src/stores/dao/tuning.ts:212` | survived | killed | T-12-3b (review) |
| S12-3 | list re-seed does not call onMissing | `src/stores/dao/tuning.ts:134` | survived | killed | T-12-2e (review) |
| S12-4 | scalar values not cached for the reader's lifetime | `src/stores/dao/tuning.ts:117` | survived | killed | T-12-2f (review) |
| S12-5 | project row ignored (NULL row only) | `src/stores/dao/tuning.ts:21` | killed | killed | T-12-2a |
| S12-6 | num accepts a non-finite value | `src/stores/dao/tuning.ts:87` | survived | killed | T-12-2g (review) |
| S12-7 | list re-seed written with the wrong source | `src/stores/dao/tuning.ts:134` | survived | killed | T-12-2e (review) |
| S12-8 | half-life guard strict | `src/stores/dao/tuning.ts:218` | killed | killed | T-12-3 |
| S12-9 | list reads NULL-level members over project members | `src/stores/dao/tuning.ts:131` | killed | killed | T-12-2c |
| S12-10 | trust factor interval admits 0 | `src/stores/dao/tuning.ts:206` | survived | survived | — (equivalent; see note) |

**Equivalent mutations.**
- **S3-2** (no `RELEASE` after a successful savepoint): SQLite's `COMMIT`
  releases every open savepoint. A later `ROLLBACK TO sp<n>` targets the
  innermost savepoint of that name. So no row set differs, and none of T-3-5's
  observables can tell the two apart.
- **S12-10** (`trust >= 0` instead of `> 0`): at `trust = 0`, the tier
  invariant `0 × stale ≥ high` also fails for any positive
  `bar.high_confidence_min` (the seed is 0.8). The write is refused either
  way, with a reason that names `bar.untrusted_trust_factor`, which is
  everything T-12-3 asserts. Telling the two apart needs a stored
  `high_confidence_min ≤ 0`. The ordering relations do not strictly forbid
  that, but it is a degenerate configuration, so I did not pursue it. The
  mutation is equivalent in every non-degenerate configuration and is
  excluded from the score on that basis.

**Kill-check for each added test.** Every test added below fails against the
surviving mutation it targets (the "after" column). It passes on the real code:
the final run below has `fail 0`.

## Tests added (30)

Each one is written from the plan sentence it quotes in its comment. None
changes `src/`, and none changes a value an existing test asserts.

- `test/unit/store_nesting.test.ts`:
  - T-3-5g2 — ENOTDIR gives StoreMissing.
  - T-3-5h2 — ELOOP gives StoreUnreadable `{pathKind: null, errno: 'ELOOP'}`.
- `test/unit/store_backup.test.ts`:
  - T-3-6b — a missing source rejects, is not created, and the destination is
    intact.
- `test/unit/concurrency.test.ts`:
  - T-3-3b — onBusyRetry fires exactly once, then StoreBusy, and no row is
    written.
- `test/unit/path_bytes.test.ts`:
  - T-5-4f — splitNul keeps an empty middle field.
  - T-5-4g — backslash and the 0x1f/0x7f bytes are escaped; the range ends
    are kept.
  - T-5-4h — a BOM is kept, and the decode round-trips.
- `test/unit/spawn_wrapper.test.ts`:
  - T-5-5d — a command that cannot be started throws ENOENT.
- `test/unit/consumer_key.test.ts`:
  - T-6-4f — an agent id containing `#`.
  - T-6-4g — `s1#mainx` and `s1#bogus` throw.
- `test/unit/step6_headline_slots.test.ts` (new, Step 6):
  - `lit` shape.
  - Every slot builder carries exactly its kind's fields.
- `test/unit/migrations_phase_a.test.ts`:
  - T-7-1n — the labelled_touches.label CHECK.
- `test/unit/dao_crud.test.ts`:
  - T-9-1r1 — markAbsentExcept affects only `in_tree = 1` rows.
  - T-9-1r2 — sweepUnreferenced's `in_tree` / `change_count` conditions.
  - T-9-1r3 — ensureHistoryRow's injection flag.
  - T-9-1r4 — bump's tie rule.
  - T-9-1r5 — setEntryScore writes nothing on an unchanged value, checked via
    `changes()`.
  - T-9-1r6 — `runs(session, consumer)` returns rows.
  - T-9-1r7 — pathWrites' `sinceSeq` and seq order.
  - T-9-1r8 — `session_log.append` returns `{id, seq}`.
  - T-9-1r9 — rebuildMinerKinds is atomic.
  - T-9-1r10 — replaceForProject is atomic.
  - T-9-1r11 — keysWithPrefix is literal.
  - T-9-1r12 — createHuman refuses commit/untrusted_repo.
- `test/unit/step10_session_writer.test.ts` (new, Step 10):
  - `writeSessionEvent` returns `{id, seq}`; two events in one millisecond get
    distinct seqs.
- `test/unit/tuning_reader.test.ts`:
  - T-12-2e — list re-seed: source, onMissing once, members.
  - T-12-2f — the reader-lifetime cache.
  - T-12-2g — `num` throws on `abc` and `Infinity`.
  - T-12-3b — the tier invariant's equality boundary.

Not added: a test for S1. It is a code defect, and a test for it would fail
until the fix lands. The executed reproduction is recorded under S1 for the
fixer to turn into T-3-5(i).

## Verification actually run (2026-09-26)

- `cd ctxoracle && npm run build && npm test` →
  - build: `tsc -p tsconfig.json`, no diagnostics;
  - test: `# tests 155`, `# pass 154`, `# fail 0`, `# todo 1`. The one `todo`
    is the pre-existing `skeleton_e2e` Checkpoint 1R mark. Before this review
    the run was `# tests 125`, `# pass 124`, `# todo 1`.
- `node middleware/context-oracle/.claude/skills/expert-plan/scripts/derive-plan-sections.mjs --check middleware/context-oracle/docs/plans/plan-phase-a.md`
  → `OK: 40 steps, 13 elements, 157 test specs, 27 probes cited, regions current`.
- `(cd middleware/context-oracle && python3 tools/check_docs.py)` →
  `context-oracle doc-consistency check passed.`
- `git diff --stat -- ctxoracle/src` → empty (every mutation reverted).
