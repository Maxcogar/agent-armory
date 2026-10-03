# Independent expert review — the 2026-09-26 plan pass

*Review of record, written once. Reviewer: a fresh neutral subagent that did not
write the plan or the architecture. Written against the working tree at
`64f710a`. The plan and architecture files were compared with `git show
64f710a:…` and were identical. No other file was edited.*

## Scope, authorities, method

**Reviewed.** `git diff e20d001..64f710a -- docs/plans/plan-phase-a.md` (the
plan pass, 5,881 diff lines), and `git diff 2331baf..db9ecf9 --
docs/architecture-phase-a.md` (the architecture changes the plan pass led to).

**Judged against.** `docs/specs/spec-context-oracle.md`;
`docs/architecture-phase-a.md` at `64f710a`; the CONFIRMED rows of
`OWNER-LEDGER.md`; `docs/reviews/2026-09-25-skeleton-gap-list-review.md`; the
binding rules in `CLAUDE.md` (the three dominating rules and the engineering
standard); the project's `expert-implement` skill, which is what will execute
this plan; and the current hooks reference
(`https://code.claude.com/docs/en/hooks.md`, 331,440 bytes, fetched 2026-09-26
for this review).

**Method.** I read Steps 1–39 in full, §6, §7's build-order and conventions
paragraphs, §9, the new decisions D-plan-33 to D-plan-44, §10A, the 2026-09-26
§11.4 entries, §12 for Steps 13–39 (read closely where a finding turned on
it), §14.5, §15, and §16. Against those I read architecture decisions AD-4,
AD-13, AD-14, AD-15 (labels and derivation), and AD-17 in full, and the rest
where a plan line cited them. `.claude/skills/` has no plan-review or
expert-review skill, so I applied the expert-standard frame directly.

**Premises re-executed in this review** (Node v22.22.2, git 2.43.0, throwaway
scratchpad scripts):

1. *`LIKE` index use with a bound parameter and `ESCAPE`* (the plan's §11.4
   probe used a literal only). `EXPLAIN QUERY PLAN SELECT name FROM symbols
   WHERE name LIKE ? ESCAPE '\'` with `'help%'` and `'user\_%'`, over `CREATE
   INDEX symbols_name ON symbols(name COLLATE NOCASE)`, returned `SEARCH
   symbols USING COVERING INDEX symbols_name (name>? AND name<?)`. **The
   premise holds.**
2. *FTS and `LIKE` agree on non-ASCII case* (the plan does not test this). The
   same table held `Über` and `über_x`. `LIKE 'über%'` returned
   `['über_x']`. `fts5(… unicode61 remove_diacritics 0 tokenchars '_$')`
   `MATCH '"über"*'` returned `['Über', 'über_x']`. **The two paths
   disagree.** This contradicts D-plan-36 (finding M3).
3. *`mode=rw` URI open.* A missing path threw `unable to open database file`
   and created no file. An existing WAL store under `dir with #?` opened with
   `journal_mode: wal`, and `typeof backup` was `function`. **Holds.**
4. *`git log -z` layout.* For an empty-body commit the bytes were `…subject
   \0 \0 \0 \n1\t0\ta.txt\0`. For a `git revert --no-edit` commit they were
   `…Revert "fix a again" \0 This reverts commit <40hex>.\n \0 \0 \n0\t1\ta.txt\0`.
   **Holds exactly as Step 13 states.**
5. *T-13-3's rewrite scenario can be built.* The sequence was: amend a `HEAD`
   that reverts X, then `git rebase --onto X^ X`. git 2.43 printed "dropping
   … Revert "X adds x" (amended) -- patch contents already upstream" and
   completed. **The scenario can be built on git 2.43.**
6. *Stop-time `additionalContext` continues the conversation.* Hooks
   reference line 2620: "The conversation continues so Claude can act on it",
   within the loop protections of "the `stop_hook_active` input and the
   8-consecutive-continuation cap". **Holds.** It is also the premise of
   finding S2.
7. *`MultiEdit` in the current hooks reference.* `grep MultiEdit hooks.md`
   found **0** matches. The documented file tools are `Write`, `Edit`, and
   `NotebookEdit` (line 295). See finding m6.
8. *The plan's mechanical gates at `64f710a`.* `derive-plan-sections --check`
   printed "OK: 40 steps … regions current". `--self-check` printed "34
   checks". `run-plan-probes` printed "all probes match their recorded
   expectations". `check_docs.py` printed "doc-consistency check passed".
   **All four pass.** They check structure only, and none of the findings
   below is structural.

Every other §11.4 premise of 2026-09-26 that I relied on is either a direct
read I repeated (the hooks reference) or consistent with the executions above.

---

## Verdict

**NEEDS FIXES — 3 Serious, 7 Moderate, 8 Minor.**

The plan pass does most of its job. The mapping from the architecture into the
plan is careful. I found no contradiction with an AD on fault codes, schema
columns, tuning keys and seed values, the AD-14 ordering, or the architecture's
wording rules. Every item in the gap-list review is present in the step that
owns it. The four rejections and the five refinements are justified by the
architecture as it now stands.

The problems are in what the plan asks the builder to do next:

- Checkpoint 1R rests on a compile claim that is false against the skeleton
  as it is (S1).
- One Stop-path ordering records whispers as delivered when they never reach
  the agent. That falsifies both the audit trail and the exit counts (S2).
- The miner's "full pass" rule, as written, doubles every count on a crash
  continuation, which is the defect AD-13 exists to prevent (S3).

None of the findings is an owner decision.

---

## Serious

### S1 — Checkpoint 1R's "compile-only, no behaviour decision" claim is false, and the edits it needs are declared nowhere

- **Plan lines.** §9, lines 6551–6570 ("the skeleton modules of Steps 13–39
  are edited only as far as needed to **compile** against the new Step
  3/6/9/12 signatures (argument and type renames, no behaviour decision — each
  such edit is marked `SKELETON:` …)"). §7, line 980. §13, lines 12221–12223.
  Every Step 1–12 declaration has `modify: []`.
- **Evidence (the skeleton, read at `64f710a`).** The Step 6 delta makes every
  `Candidate` field required. It also replaces `headline: string` with the
  structured `Headline`, and replaces the `Consumer` role type with
  `ConsumerKey`. The Step 9 delta removes `files.deleteMissing`,
  `landmines.upsert`, `whisper_stats.upsertFold`, and `corrections.sinceTs`.
  The skeleton uses all of these:
  - `src/types/candidate.ts:25` has `headline: string`.
  - String headlines are built in `src/genres/warning.ts:20`, `coupling.ts:25`,
    `orientation.ts:30`, and `completeness.ts:27`.
  - `landmines.upsert` is called in `src/miner/cochange.ts:261,271` and
    `src/cli/verbs_skeleton.ts:164`.
  - `p.a_count` appears in SQL in `src/genres/generator.ts:23`, a column the
    Step 7 delta drops.

  Making those modules compile is not a rename:
  - A genre must now choose `trust`, `obvious`, `crossFile`, `comparative`,
    `blastRadius`, `zone`, `incorporatedBy`, and a `Headline` built from
    `lit`/`slot`.
  - The composer must render a `Headline`.
  - The miner must pick what replaces `upsert`.

  Those are the Step 16/18/19/13 decisions the plan says Checkpoint 1R does
  not make. The column dropped from SQL strings compiles but fails at run
  time. Finally, no declaration lists these files, so §5.1 omits them. The
  project's own `expert-implement` skill
  (`.claude/skills/expert-implement/SKILL.md` line 124) requires a
  `BLAST-RADIUS-EXCEEDS-PLAN` stop when "implementing the step as written
  cascades into files outside the plan's 'Files affected'". The very next
  build stage (STATUS item 2) cannot be executed faithfully.
- **Standard.** The plan's own step-declaration contract (§5.1 is generated
  from declarations). The expert-implement blast-radius stop. Dominating rule
  1 (a claim that stands unverified — here that the skeleton "stays green"
  with no behaviour decision).
- **Fix (plan).** Choose one of two options and write it into §9 and the
  declarations:
  - (a) Name the exact skeleton files the adaptation touches (at least
    `types/candidate.ts`'s consumers in `genres/*.ts`, `hook/compose.ts`,
    `hook/handler.ts`, `hook/delivery.ts`, `miner/cochange.ts`,
    `index/indexer.ts`, `diag/whisper_stats_fold.ts`, `cli/verbs_skeleton.ts`,
    `genres/generator.ts`, `qa/state.ts`, `blocks/answer_drift.ts`). Add them
    as `modify:` on the Step 1–12 delta that forces each one. State the
    placeholder rule for each forced value, for example "headline =
    `[lit(<old string>)]`, flags = the Step 18 table, `trust:
    'untrusted_repo'`" — a written rule, not a judgement at build time.
  - (b) Drop the "stays green" requirement. Let the Step 6/9 deltas land
    together with Step 13's full build, and state that `npm run build` is red
    from the Step 6 delta until the owning steps are rebuilt.

  Either way, delete the words "no behaviour decision" and "argument and type
  renames", which do not hold.

### S2 — A Stop-time whisper under `stop_hook_active` is audited and marked delivered but never emitted

- **Plan lines.** Step 28, item 11, lines 5018–5031: audit-then-emit appends
  the `whisper_audit` row and `recordDelivered` for each surviving whisper,
  then "At Stop the text goes through `deliverStop` honoring
  `stop_hook_active`". Step 20, line 4018: `deliverStop` returns `null` when
  `stopHookActive` is true. Step 27: the backstop line is appended to "the
  Stop-time delivery". T-28-10 does not cover this case.
- **Evidence.** The current hooks reference (line 2620) says a Stop hook's
  `additionalContext` makes "the conversation continue[s]", within "the
  `stop_hook_active` input and the 8-consecutive-continuation cap". So every
  time the oracle speaks at `Stop`, the continuation ends in a second `Stop`
  with `stop_hook_active: true`. That can happen once per turn. At that
  second `Stop`, item 11 generates the Completeness and Verification
  candidates, and the backstop, for edits made during the continuation. It
  audits them and writes their `delivered` rows. Then `deliverStop` returns
  `null`.
  - The agent never sees them.
  - `consumer_state` withholds them for the rest of the session.
  - No `produced_but_undelivered` is recorded, because nothing threw.
  - The fold counts them as `sent`.

  This is the reverse of AD-19's "an unlogged intervention does not exist": a
  logged intervention that never happened. It feeds straight into the exit
  run's per-genre counts (dominating rule 3: faked data poisons Phase B's
  input).
- **Standard.** FR-X6 (the audit trail records what was delivered). AD-8 and
  AD-26 (audit-then-*emit*: the audit row is for a whisper that is then
  emitted). AD-17 (a produced-but-undelivered whisper is always visible).
- **Fix (plan).** In Step 28 item 11, check `ctx.stopHookActive` before
  candidate generation at `Stop`/`SubagentStop`. When it is true, generate
  nothing, write the session row with `detail_json.stop_hook_active = true`,
  and emit nothing. Candidates wait for the next turn's `Stop`, and dedup
  stays honest. Add a case to T-20-2 or T-28-10: a `Stop` with
  `stop_hook_active: true` after an edit writes no `whisper_audit` row and no
  `delivered` row. If the architecture intends something else, raise it in
  AD-16 in its own pass. AD-16 says only "once, honoring `stop_hook_active`",
  which the fix satisfies.

### S3 — A "full" pass over a populated store re-mines from `HEAD` without purging, doubling every count

- **Plan lines.** Step 13, line 2877 (`<range>` is `HEAD` for a full pass),
  and lines 2952–2957: "A pass is *full* when `opts.full` is true, when
  `last_mined_commit` is absent, when `schema_meta.mining_in_progress` is
  already `'1'` (a full pass that crashed: its continuation keeps the flag),
  or on a history rewrite". Only the rewrite case purges (lines 2958–2965).
  Also Step 14's `runIndex(…, {full})` then "`mineCochange` … runs",
  `index [--full]` (Step 28), and `runIndex(…, {full: true})` in `init`
  (Step 31 item 5, re-run idempotently per T-31-2) and in `prepareStore`.
- **Evidence (from the text; no code exists yet).**
  - A crashed full pass has committed chunks. Each chunk advanced
    `last_mined_commit` and incremented `change_count` and `pair_count`
    (lines 2944–2950). The continuation is "full", so its range is `HEAD`.
    It streams the already-mined commits again and bumps their pairs and
    change counts a second time. `commits` has a primary key, but
    `cochange_pairs.bump` and `files.addChangeCount` are not idempotent
    (Step 9).
  - `opts.full` on a populated store (a re-`init`, `index --full`) has the
    same effect, if `runIndex`'s `full` reaches the miner. The plan does not
    say whether it does.

  AD-13 names this exact defect as the reason for the purge set: "a re-mine
  over un-reset counts doubled every `change_count` (halving every
  confidence)". T-13-5(a) requires "the completed store [not to differ] from a
  single uninterrupted mine", so the test contradicts the step text. A test
  writer cannot tell which one governs.
- **Standard.** AD-13 and AD-26 (a chunked, crash-safe re-mine). Correctness
  of a derived aggregate (recompute from the source of truth after
  invalidation). The raise-flaws rule ("too unclear to act on without
  guessing").
- **Fix (plan).** State exactly two cases.
  - *Every* full pass starts with the purge transaction. That covers
    `opts.full`, a crash continuation, and a rewrite, and for an absent
    watermark the purge is a no-op. Then a full re-mine from `HEAD`.
  - **Or** a crash continuation with the flag `'1'` and a watermark present
    is incremental from the watermark with the flag kept.

  Whichever is chosen, state whether `runIndex`'s `full` propagates to
  `mineCochange`. Add to T-13-5 a case of `mineCochange({full: true})` twice
  on the same store, with counts equal to one mine.

---

## Moderate

### M1 — D-plan-33 to D-plan-44 have no author's collapse test (§10A)

- **Plan lines.** §10A (line 7478 onward) holds entries D-plan-1 to D-plan-32
  (last heading at line 8181). No entry exists for D-plan-33 to D-plan-44
  (lines 7376–7476).
- **Evidence.** `grep -n "^#### D-plan" plan` ends at `D-plan-32`. CLAUDE.md
  dominating rule 2 requires every load-bearing decision to pass the collapse
  test "in writing, before acceptance and again in review". The independent
  collapse hunt STATUS schedules is the *second* half, and it attacks the
  author's step-2 questions, which do not exist here. At least D-plan-34 (the
  hazard confidence), D-plan-36 (the search equivalence, which M3 shows is
  false), D-plan-37 (which session a missed question arms), D-plan-39 (the
  reseed key), and D-plan-43 (the import-home rule) are load-bearing.
  Separately, §15 PG-5 (line 12806) says each decision carries "reasoning and
  rejected alternatives". D-plan-38 and D-plan-41 carry no *Rejected*
  clause.
- **Fix (plan).** Add §10A entries (job, hardest question, cited answer,
  steers-toward) for each load-bearing decision among D-plan-33 to 44. Add
  the missing *Rejected* clauses, or correct PG-5's sentence.

### M2 — Import is not all-or-nothing across its two files

- **Plan lines.** Step 32, lines 5575–5585: "For each of the two files, in
  this order (global first, then project …): (1) backup to tmp; (2)
  `quick_check`; (3) on failure … leave both live stores untouched …; (4) on
  success `backupFile(tmp, <live path>)`".
- **Evidence.** When the global file passes and the project file then fails
  step (2), the global store was already replaced at the global file's step
  (4). "Leave both live stores untouched" is false, and the machine is left
  with imported bindings (which `--replace` swaps wholesale, D-plan-43)
  pointing at a project store that was never imported.
- **Standard.** AD-5's order rule ("checking after the overwrite destroys the
  store the check exists to protect"), applied across the unit the verb
  presents. Atomicity of a user-visible operation (the verb reports one
  outcome).
- **Fix (plan).** Split the loop into two phases. First back up and
  `quick_check` *both* temporary files. Write both live stores only when both
  pass. Record the residual non-atomicity between the two live writes, since
  there is no cross-file transaction, and its recovery (re-run `import`).
  Add that case to T-32-4.

### M3 — D-plan-36's "provably the same query" is false for non-ASCII identifiers

- **Plan lines.** D-plan-36, line 7418 ("make the two paths provably the same
  query"). Step 14 search semantics (the fallback uses `name LIKE ? ESCAPE
  '\'`). Step 7, 001b comment ("both FTS tables set `remove_diacritics 0` so
  the FTS path and the fallback compare the same characters"). T-14-5's data
  and T-15-3 hold ASCII-case identifiers only.
- **Evidence (executed, premise 2).** SQLite's `LIKE` folds case for ASCII
  only. unicode61 folds all of Unicode. `"über"*` matched `Über` under FTS5;
  `LIKE 'über%'` did not. C-6 asks for broad language coverage, and
  identifiers such as `Größe` or `Ärger` are legal in Java, Kotlin, Swift,
  Python, and others. T-14-5 would pass while the paths disagree.
- **Fix (plan).** Give the fallback a folded key, the same way `path_tokens`
  already works. Either add a `symbols.name_fold` column (the name
  lower-cased with the same JS `toLowerCase` the query terms use) with a
  BINARY index and a range query `name_fold >= ? AND name_fold < ? ||
  char(0x10FFFF)`, or a `symbol_tokens` table. Add `Über`/`über` to T-14-5.
  Correct D-plan-36's wording. The architecture's AD-2 wording ("the same
  token-prefix semantics") then holds as written, so no architecture change
  is needed.

### M4 — T-28-7(e) contradicts Step 4's `ensureHome`

- **Plan lines.** Step 4 delta, line 1472: `ensureHome` "creates `<home>/`,
  `<home>/global/`, and `<home>/diagnostics/`". The handler calls
  `ensureHome` on the home-channel fault path. T-28-7, line 11065: "Fails
  when … (e) creates anything but `<home>/diagnostics/` and its fault". Step
  28 item 4 also writes `repo_not_bound.<hash>.marker` files into the same
  directory.
- **Evidence.** An implementation that follows Step 4 fails T-28-7(e) by
  creating `global/`. A test writer working from the specification alone
  cannot tell whether the marker files count as "anything". The Step 13+
  test-first contract says every value a test asserts must be derivable from
  the spec. Here two specs disagree.
- **Fix (plan).** Choose one. Either the handler's fault path calls a
  diagnostics-only helper (`ensureHomeDiagnostics`) and `global/` is created
  only by `init`/`import`/`ensureLayout`, or T-28-7(e) allows `global/`. In
  both cases list the marker file as an expected artifact in T-28-7(d)/(e).

### M5 — The test-first contract cannot produce "fails for the named reason" in a single-`tsc` build

- **Plan lines.** §7, lines 985–993 ("a separate agent writes each step's
  §12 tests from the test specification alone and runs them against the
  skeleton … each must fail for the reason its 'Fails when' clause names").
- **Evidence.** `tsconfig.json` (Step 1) compiles `src` and `test` in one
  project, and `npm test` runs compiled output. Many Step 13+ tests import
  exports the skeleton lacks: `parseNumstatZ`, `isRevertLabelled`,
  `isFixLabelled` (S13), `walkRepository`, `matchesTestPattern`,
  `readGitPointer` (S14), `resolveTsImport` (S15), `blastRadiusOf` (S18),
  `oracleLines`, `successfulToolTargets` (S21), `findRepoRoot` (S28), and
  others. A missing export is a `tsc` error that fails the *whole build*,
  not that one test for its "Fails when" reason. So the red state the
  contract requires cannot be observed as specified, and one step's red
  tests block every other test in the suite.
- **Fix (plan).** Specify how the red test is produced. For example: before
  the tests are written, the test-writing agent adds to the step's `provides`
  exports a stub that throws `NotImplemented`, declared as a Step-N
  pre-change. Or: the red run for a new-export test is the `tsc` diagnostic
  naming the missing export, and the "Fails when" check applies only to
  tests over existing exports. State which reason counts as failing for the
  right reason in each case.

### M6 — Step 18's Verification strong claim silently diverges from AD-15

- **Plan lines.** Step 18, line 3722 (first bullet): "the strong 'not run'
  only when every observed command is class 1 or 2". Full-build bullet
  (Verification): "`; not run this session` when every observed Bash segment
  is class 2 (or none ran), else" the weaker claim.
- **Evidence.** AD-15 (line 1633) makes each class-1 runner segment
  subtract its *mapped* run, with unknown (class 3) as the only thing that
  forces the weak claim. The full-build rule forces the weak claim whenever
  *any* recognized runner ran, even one mapped to other targets. That is
  safe, but it contradicts the step's own first bullet and the
  architecture, and the plan gives no reason. The raise-flaws rule forbids
  exactly this silent divergence. It also depresses the Verification numbers
  in the exit run without saying so.
- **Fix (plan).** Adopt AD-15's rule (strong when every segment is class 1
  or 2, after mapped subtraction), or state the stricter rule with its
  reason and raise it against AD-15 in an architecture pass. Pin the chosen
  case in T-18-7.

### M7 — The index-time regret watermark repeats N11's wall-clock race

- **Plan lines.** Step 30, line 5313: `regret_index_ts` is "read and
  advanced to the current time … after every `runIndex` regret pass", and
  `writtenSince(path, sinceTs)` compares `observed_actions.ts`.
- **Evidence.** This is the race N11 found in the fold, and the plan fixed
  the fold by moving it to `seq`. A handler process stamps `ts` before
  "now" but commits after the regret pass reads. The watermark then moves
  past it, and that write is never examined, so the revert is missed. This
  is a regret *under*-count in exit data. `observed_actions` now has an
  engine-assigned `seq` (Step 7) that removes the race.
- **Fix (plan).** Key the index-time regret watermark on
  `observed_actions.seq` (`regret_index_seq`, the largest `seq` read). Change
  `writtenSince` to `writtenSinceSeq`. Add the "row committed after the
  pass's read is examined next time" case to T-30-1, mirroring T-30-3.

---

## Minor

- **m1 — Stale fallback wording (plan).** Step 3, line 1342 ("falls back to
  indexed `LIKE`/token-prefix queries"), and the Step 7 paragraph before 001b
  ("uses the indexed `LIKE` path"). The line near 7217 carries the same
  phrase. All three contradict the corrected AD-2 (a `NOCASE` name index plus
  `path_tokens`). *Fix:* reword them to AD-2's corrected text.
- **m2 — `compose` cannot call `ctx.recordDrop` (plan).** Step 19, line 3916:
  the signature is `compose(candidate, {store, checkoutRoot, tier})`, yet
  line 3950 says "every drop is reported through `ctx.recordDrop`". *Fix:*
  state that the handler records the returned `dropped` reason (Step 28
  item 11), or add `recordDrop` to the options object.
- **m3 — `index_stale` is recorded on every event while stale (plan).**
  Step 14, line 3235: `refreshIfStale` "on a differing commit records the
  `index_stale` fault". Every event until the reindex finishes writes a
  fault and a `schema_meta` row. *Fix:* record the fault only on the
  transition `index_stale` `'0'` → `'1'`.
- **m4 — T-14-3 fixture gap (plan).** Line 10105: `tests/test_b.py
  importing b` expects `test_map` `tests/test_b.py → b.py`, but the fixture
  list names no `b.py` (nor `src/a.ts`). *Fix:* list both files in the Data
  field.
- **m5 — T-28-11 file and premise (plan).** T-28-11 names
  `test/replay/audit_groups.test.ts` (T-28-10's file), and its transcript's
  "successful `Read`" does not say that the result block carries
  `is_error: false`, which `successfulToolTargets` requires (Step 21). *Fix:*
  give T-28-11 its own file and state the `is_error: false` field.
- **m6 — `MultiEdit` is not in the current hooks reference (architecture and
  plan).** The plan names `MultiEdit` in `EDIT_TOOLS`, the `context` mapping,
  the Consequence/Warning triggers, `updateReadSet`, and the adapter. AD-23
  line 2225 names it too. But `recognizeMove` (line 4369) and AD-9 (line
  1072) list only `Write`, `Edit`, `NotebookEdit`. The fetched reference has
  0 `MultiEdit` matches. The sets disagree with each other and name a tool
  that is not documented. *Fix:* drop `MultiEdit` everywhere (AD-23 in an
  architecture pass, then the plan), or verify it is live and add it to
  `recognizeMove` and AD-9.
- **m7 — Typo (plan).** Step 4 delta: "the replay harness's the replay
  harness's store preparation".
- **m8 — Step 37 `depends_on` omits S31, S33, S34, S35 (plan).** T-37-1
  asserts that "no module named `verbs_skeleton` exists", which only Steps
  31–35 make true. *Fix:* add them.

---

## Checks that held (reported so their absence is not read as unexamined)

1. **The plan consumes the architecture correctly on the named axes.**
   - `FAULT_CODES` in Step 6 equals AD-17's list plus AD-26 and the named
     plan codes.
   - Step 7's DDL carries every AD-4 column, including `in_tree`,
     `change_count`, `unresolved_imports`, `last_commit`, `corrections.genre`
     with its relaxed CHECKs, `seq`, `stats_folds`, `subject_key`,
     `labelled_touches`, and the miner key.
   - Step 12's new keys and seeds equal AD-14's, AD-12's, and AD-26's (0.8,
     0.9, 0.7, 0.7, 0.05, 50 ms), and `checkTuningWrite` encodes AD-14's
     ordering.
   - The label rules, derivation, purge set, and `mining_in_progress` match
     AD-13 and AD-15.
   - "The file this edit targets" wording matches AD-15.
   - The architecture delta (`2331baf..db9ecf9`) records each of the plan's
     raised flaws with a dated rationale, which is the routing the
     raise-flaws rule requires.
2. **Gap-list decisions.** Each §14.5 row points to text present in the
   named step. The four rejections hold against the architecture at
   `64f710a`:
   - G11(c): AD-12 line 1289 restores the signal as "a tracked file matching
     an ignore pattern".
   - G20's `untrusted_confidence_cap`: AD-14 replaced it with the trust
     dampener.
   - G33's windows and genre default: AD-4/AD-5 `stats_folds` and
     `unattributed`.
   - PreToolUse(c) "just edited": AD-15 §4.

   So do the five refinements: G1(c) fix-after-exclusion, G4 chunked
   re-mine, G5 final transaction, G9 chunked units, and G34 validate-first.
3. **Premises re-executed** (list above): all held except the non-ASCII
   agreement (M3).
4. **Ordering of the reopened deltas.** Each delta depends only on earlier
   ones (S3 → S4 → S5 → S6 → S7 → S9 → S10 → S12). The compile claim for
   Steps 13–39 does not hold (S1).
5. **Phase-goal service (dominating rule 3).** I found no mechanism that
   exists only to pass review. The pass's additions each close an executed
   measurement defect (G3, G4, G5, G23, N1, N3, N11). The honest disclosures
   (PG-5 to PG-8, the `lang_capabilities` record, "unrecognized search
   results" as a visible count) serve the "measures its own floor" clause.
   The two places where the plan could quietly distort exit data are S2
   (inflated `sent`) and M7 (a regret under-count), and both are reported
   above as defects. The one decision I weighed as possibly review-serving
   is the `lit` const-generic trick (Step 6/T-6-3). It is kept by T-19-3's
   scan, which does the real enforcement, but it costs little and catches
   the common case at compile time, so it is not a finding.

## Findings by owning layer

| ID | Layer |
|---|---|
| S1, S2, S3 | plan |
| M1–M7 | plan (M6 may raise an architecture item if the stricter rule is kept) |
| m1–m5, m7, m8 | plan |
| m6 | architecture (AD-23, AD-9) then plan |

No finding belongs to the spec or needs Max Cogar.
