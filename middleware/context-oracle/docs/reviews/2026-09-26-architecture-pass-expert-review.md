# Expert review: the architecture pass from the skeleton gap-list review (commit `0fab6d7`)

*Review of record, written once. Reviewer: a fresh neutral subagent. It did not
write the change or the decision record. Run 2026-09-26 against the working tree
at `0fab6d7`. Nothing outside this file was edited.*

**What was reviewed.** `git show 0fab6d7`: `docs/architecture-phase-a.md` (+484/−81)
and `docs/specs/spec-context-oracle.md` (one FR-O2 sentence). The change records the
architecture-level decisions of `docs/reviews/2026-09-25-skeleton-gap-list-review.md`
(the "decision record").

**What it was judged against.** `docs/specs/spec-context-oracle.md`,
`OWNER-LEDGER.md`, `middleware/context-oracle/CLAUDE.md`, the repository-root
`.claude/rules/raise-flaws.md`, and the external standards each finding names. I
re-derived external premises from primary sources during this review. I did not
copy them from the decision record.

**Phase goal (CLAUDE.md rule 3).** Phase A is an honest deterministic foundation,
running on the owner's real repositories, that measures its own floor, with clean
seams for later phases. Each finding below was also judged by whether it
corrupts that measurement. S2, M5, and M6 do.

## Scope and Inventory

- [x] `docs/architecture-phase-a.md`: the full diff Read (the 990-line `git show`
  output, all hunks). Surrounding context Read at lines 136–146 (V12, V17–V22), 205–212,
  440–500, 655–775 (AD-5), 1155–1235 (AD-12), 1250–1290 (AD-13), 1365–1445 (AD-15),
  1455–1520 (AD-16), 1522–1605 (AD-17), 1715–1745 (AD-20), 1815–1860 (AD-23),
  2014–2045 (AD-26), 2410–2430 (L12).
- [x] `docs/specs/spec-context-oracle.md`: diff Read. Also Read: lines 150–205 (§4 genre
  table, FR-D1–FR-D5), 455–500 (FR-B3, FR-O2), 531 (C-4), 612–640 (FR-J5),
  920–940 (AC-1a–AC-2). I grepped the spec for other before-the-tool timing phrases
  (`before the tool|before the edit|before an edit|before editing|about to edit`)
  and found 0 spec hits.
- [x] `OWNER-LEDGER.md`: Read in full (86 lines).
- [x] `middleware/context-oracle/CLAUDE.md`: Read in full.
- [x] `.claude/rules/raise-flaws.md`: Read in full (30 lines).
- [x] `docs/reviews/2026-09-25-skeleton-gap-list-review.md`: Read in full (983 lines).
- [x] Claude Code hooks reference, `https://code.claude.com/docs/en/hooks.md`, fetched
  2026-09-26 with `curl` (331,440 bytes). Lines 820, 1002, 1019, 1037, 1136,
  1150–1158, and 1815 were read for V20–V22.
- [x] `sqlite.org/lang_vacuum.html` and `sqlite.org/lang_savepoint.html`, fetched
  2026-09-26. I grepped them for the sentences the change quotes, and both matched
  verbatim.
- [x] `pkg.go.dev/cmd/go` ("Test packages"), fetched 2026-09-26 (M5).
- [x] Executed probes, in the session scratchpad:
  - A git 2.43.0 repository for `ls-files` / `check-ignore` behaviour (M3, M4).
  - A `node:sqlite` single-transaction upsert benchmark on Node 22.22.2 (S2).
  - `typeof require('node:sqlite').backup` on Node 22.22.2, which printed `function`.
  - `tools/check_docs.py`, which printed `context-oracle doc-consistency check passed.`
    with exit 0.

Out of scope: `docs/plans/plan-phase-a.md` and the code. The decision record assigns
their changes to later steps, and this commit does not touch them. The independent
collapse-hunt required by CLAUDE.md rule 2 is a separate pass and is not this
review.

## Summary

This review returns NEEDS FIXES. The change records every architecture-level
decision the decision record lists: AD-4, AD-5, AD-9/AD-16, AD-12, AD-13, AD-14,
AD-15, AD-17, AD-19, AD-20/AD-23, AD-26, and V20–V22. Most of it is well sourced.
V20–V22 quote the current hooks reference verbatim. The explicit `seq` key and the
`SAVEPOINT` nesting are grounded in SQLite's own documentation.

Two decisions are wrong by the standards the document names:

- The new "just edited" wording makes Warning and Consequence checkably false
  whenever the edit does not run (FR-D1).
- The new unit-of-work rule makes a whole mining or index pass one write
  transaction. That holds SQLite's single write lock longer than the event path's
  100 ms + one-retry tolerance. During a SessionStart-spawned refresh, the
  answer-drift deny is then silently disabled.

Beyond those two, several new mechanisms are half-specified:

- `in_tree` has no reader.
- The history-rewrite purge omits the new `labelled_touches` table.
- The `seq` watermark lives in a different store from the sequence it indexes.
- The fork delivered-set rebuild has no mapping from text to subject keys.
- The trust-cap ordering is unenforced.
- The fix-keyword match is undefined.

Two rationales contradict the change's own evidence:

- The dropped `.gitignore` signal "could never fire", yet the change's own check
  shows a tracked ignored file being listed.
- V17 still says import uses `VACUUM INTO`.

## Critical & Serious Findings

### S1: "just edited" wording makes Warning and Consequence checkably false when the edit does not run (Serious)

- **What the document does now.** AD-15's Warning row (architecture line 1382) prescribes
  the headline "⚠ `x.ts`, just edited, was reverted in 2 commits: …". The Consequence row
  says it is "worded as a fact about **the edit just made**". Both candidates are still
  generated on `PreToolUse` Edit/Write (AD-6 row, AD-15 trigger column). Their text is
  therefore composed and audited before the tool has run.
- **How verified.**
  - Read the AD-15 rows and the AD-6 `PreToolUse` row in the diff.
  - The spec's FR-O2, as edited by this very commit (spec lines 478–481), says the
    `PreToolUse` context "is preserved even if that tool call later fails".
  - The hooks reference (line 1019) places `PreToolUse` context "next to the tool
    result", and a failed tool also has a result.
  - V19 (architecture line 143) records that a failing tool fires
    `PostToolUseFailure`, and that pre-execution rejections (permission denials)
    fire nothing.
  - So a `PreToolUse` whisper is delivered in exactly the cases where no edit
    happened.
- **Standard violated.**
  - FR-D1: "An uncheckable whisper is a rumor and is not emitted."
  - Spec line 636 calls a checkably-false whisper "the worst output for a provenance
    tool".
  - The architecture already treats a false claim about the agent's own actions as an
    FR-D1 breach (AD-6's `PostToolUseFailure` row: the checkably-false "not run").
  - "x.ts, just edited" after a failed or denied Edit is a false statement about the
    agent's own action, placed next to the evidence that refutes it.
- **Correct form.** Choose one of these and record the reason in AD-15:
  - (a) Keep the `PreToolUse` trigger (spec FR-A2d: "An edit / write about to run")
    and word the headline so it is true whether or not the tool then runs. For
    example: "⚠ `x.ts` (this edit's target) was reverted in 2 commits: …". It still
    informs the next move (V20).
  - (b) Generate Warning and Consequence on `PostToolUse` Edit/Write instead.
    `PostToolUse` is success-only (V19), so "just edited" is guaranteed true. Per V20,
    the model reads the text at the same moment either way, next to the tool result.
    This option changes FR-A2d's "Fires on" column. That is a spec edit, so it must be
    raised as one, not made silently.

  Either way, add one line to L12 stating which option was chosen.

### S2: the whole-pass unit of work holds the write lock past the event path's tolerance, and silently disables the answer-drift deny during a refresh (Serious)

- **What the document does now.**
  - AD-26 (line 2029 ff.) says demarcation "belongs to the unit of work, meaning
    the mining pass, the index pass, or the handler's event". It also says "A mining
    pass's watermark, per-file counts, pairs, `labelled_touches`, and landmine
    rebuild commit together or not at all". That makes each pass one `BEGIN
    IMMEDIATE` transaction.
  - AD-26 (line 2018) gives the event path `busy_timeout=100ms` + retry-once, then
    whisper-less fail-open.
  - Architecture line 210: "If the audit write fails, no deny is emitted".
  - The miner and indexer run in the detached refresh that `SessionStart` spawns on
    staleness (AD-6 `SessionStart` row, AD-12 line 1155, AD-13 "in `ctxoracle
    index`"). So the long transaction runs concurrently with the session's first
    events. After a rebase or amend (AD-13's "full re-mine"), that is a
    whole-horizon pass.
- **How verified.** Read at the cited lines. I also executed a benchmark on Node
  22.22.2 `node:sqlite` (WAL, STRICT table shaped like `cochange_pairs`): 10,000
  synthetic commits, 2–14 files each, gave 349,905 pair upserts in one `BEGIN
  IMMEDIATE` … `COMMIT`, in **414 ms**. That is the write phase alone, with no `git log`
  streaming inside the transaction. It already exceeds the ~200 ms the event path
  waits. The synthetic shape is not a measurement of a real repository, but the
  order of magnitude is enough to show the conflict.
- **Standard violated.** NF-1 and AD-26's own give-up design assume short writers.
  Standard practice is to keep write transactions short, because SQLite has one
  writer. OL-C3 (a confirmed owner block) is silently off while the refresh runs.
  Every `PreToolUse` in that window fails its audit write, so no deny is emitted, and
  the only trace is `store_busy`.
- **Correct form.** Keep atomicity per bounded chunk, not per pass:
  - Stream and aggregate `git log` outside any transaction.
  - Commit in chunks, each with a stated duration budget well under 100 ms. Each
    chunk commits its commits, `change_count` increments, pairs, and
    `labelled_touches` rows together with the watermark advanced to that chunk's last
    commit. The watermark is then never ahead of its data, which is the invariant G9
    was about.
  - Run the landmine rebuild, which is idempotent and derived, as its own short final
    transaction.
  - For a full re-mine, set `schema_meta.mining_in_progress` in the purge transaction.
    History genres treat it like an unmet corpus floor (no candidates) until the last
    chunk clears it. Readers then never see partial counts.
  - Apply the same rule to the index pass.

  State the chunk budget in AD-26 and add the lock-hold bound to AD-23's inventory
  reasoning.

## Systemic Patterns

No systemic patterns. I scanned for three candidate patterns:

- **A new stored value whose reader or reset is never written down** (S2's pass
  transaction, M1, M2, M6).
  - `grep -n "in_tree"` over the architecture: 7 hits. All are in AD-4 and AD-12
    (definition and writer). None is in AD-15 or AD-23 (a reader).
  - `grep -n "labelled_touches"`: 6 hits. None is in AD-13's rewrite rule.
  - `grep -n "purge\|watermark"` (excluding the miner watermark): 21 hits. None pairs
    `--purge` or `import` with the fold watermark.

  These are four distinct mechanisms with four different fixes. They are one authoring
  habit, but the named standards differ per instance: completeness of a derived
  aggregate's invalidation, FR-D1, and FR-M1. So I recorded them as separate Moderate
  findings rather than one Systemic finding, which the Gate A rule "the named standard
  applies across the instances" does not support.
- **Stale cross-references to superseded mechanisms.** Grep for `VACUUM INTO` in the
  V-table found 1 stale row (V17, M13). Grep for `a_count` found only
  supersession notes. Grep for `grammar-covered` in live rules found 0 remaining.
  That is a single instance, so it is not systemic.

## Moderate & Minor Findings

### History-derived state

**M1: the history-rewrite purge omits `labelled_touches` and `files.change_count`, so the stale-citation fix AD-15 claims does not hold (Moderate).**
- AD-15 (lines 1417–1429) says the per-pass rebuild fixes "a row [that] kept citing a
  commit that history rewriting had removed".
- But the rebuild reads `labelled_touches`. AD-13 (line 1269) says only "full
  re-mine + diagnostic", and names no purge set.
- The decision record's G4 purge list (commits, pairs, per-file counts, miner
  landmines) predates `labelled_touches` and omits it.
- So a rewrite leaves the rewritten-away labelled commits in `labelled_touches`, and
  the rebuild re-creates the stale citation. A full re-mine without resetting
  `change_count` doubles every support(A) and halves every confidence.
- Verified by Read of AD-13 and AD-15. `grep -n "rewrit"` gave 3 hits, none naming a
  purge set.
- Standard: invalidating a derived aggregate means recomputing all of it from the
  source of truth (the decision record's own G4 source).
- Fix: AD-13 names the purge set, in the purge transaction: `commits`,
  `cochange_pairs`, `files.change_count := 0`, `labelled_touches`, and miner-kind
  `landmines` (never `human_stated`).

**M2: `in_tree` has no reader, and history-only paths escape the filename flagger (Moderate).**
- The decision record's G2 relies on "pointers to `in_tree = 0` files are already dropped
  by the rumor rule at compose time".
- The architecture's rumor rule (line 1371; AD-23 line 1822) re-resolves spans and
  commit hashes only. `grep -n "in_tree"` gave 7 hits, all definition or writer.
- So Coupling, Completeness ("you changed X but not Y"), and Consequence can name a
  deleted partner. That is a pointer the agent cannot check (FR-D1).
- Separately, AD-19 (line 1672) flags paths "at index time". Miner-created rows are
  never walked by the indexer, so their names are never flagged, yet they can be
  rendered.
- Fix, in AD-15's common properties:
  - A file pointer re-resolves as `files.in_tree = 1`. This is an indexed store read,
    already inside AD-23's inventory.
  - A candidate whose target or partner has `in_tree = 0` is dropped and counted.
  - AD-19 flags every path when its `files` row is created, by either writer.

**M3: the walk lists tracked files deleted from the working tree, so `in_tree = 1` can mean "absent" (Moderate).**
- Executed on git 2.43.0: after `rm src/del.ts` (unstaged), `git ls-files -z --cached
  --others --exclude-standard` still printed `src/del.ts`.
- AD-4 defines `in_tree = 1` as "listed by the current index walk", and AD-12 (line
  1218) deletes rows only for a file "gone from the walk". So a deleted-but-unstaged
  file keeps `in_tree = 1` and stale symbols. Or the implementer's `stat` drops it
  silently, which is the skeleton behaviour G7 criticised.
- Fix: define `in_tree = 1` as "listed by the walk **and** present on disk". The
  indexer already stats every file to hash it. Treat a listed-but-absent path
  exactly like one gone from the walk.

**M4: the dropped `.gitignore` zone signal's rationale contradicts the change's own check (Moderate).**
- AD-12 says the signal "could never fire as defined". It also records that
  `--cached` lists a force-added `dist/a.js` under an ignored `dist/`.
- Executed: with `.gitignore` = `dist/` and `*.gen.ts`, and tracked
  `src/api.gen.ts`, the walk listed `src/api.gen.ts`.
  `printf 'dist/a.js\0src/api.gen.ts\0src/k.ts\0' | git check-ignore --no-index -z --stdin`
  printed `dist/a.js` and `src/api.gen.ts`.
- A committed generated file that matches a project ignore pattern outside
  `dist/`/`build/` is exactly the `generated` zone case. The path patterns miss it,
  and dropping the signal loses it.
- Standard: gitignore(5) (tracked files are unaffected by *ignoring*, but still
  *match* patterns); premise-correctness of a stated rationale.
- Fix: keep the signal, defined as "a walked path that matches an ignore pattern". It is
  computed once per index pass with `git check-ignore --no-index -z --stdin`, off the
  event path.

**M5: the `test_map` rule can never map a Go test, although `**/*_test.go` is seeded (Moderate).**
- AD-12 (lines 1187–1195): "A test file's `import_edges` targets are the files it
  covers."
- Per `go help test` (pkg.go.dev/cmd/go, fetched 2026-09-26), `*_test.go` files are
  compiled with their package. In-package tests reference the code under test with no
  import at all. External `_test` packages import a package path (a directory), not a
  file. The decision record's G12 gives Go no resolver.
- So Consequence and Verification (FR-A2d, FR-A2g, AC-8) are structurally silent for
  Go, and the exit data would read that silence as a low floor.
- Fix: add a second listed convention to `test_map`, same-directory stem pairing
  (`foo_test.go` → `foo.go`, `foo.test.ts` → `foo.ts`, `test_foo.py` → `foo.py`). Also
  record a per-language `test_map` capability shown in `status`, as the change already
  does for `imports`.

**M10: the fix-keyword match is undefined (Moderate).**
- AD-15 (line 1408): "a subject matching a member of `lexicon.fix_keywords`".
- Substring matching counts `prefix`, `suffix`, `fixture`, and `debug`. Word matching
  does not. The choice sets FR-K3 landmine precision and the exit numbers, and the
  implementer would have to decide it inline.
- Standard: SZZ (Śliwerski, Zimmermann, Zeller, MSR 2005) matches keywords as words.
- Fix: case-insensitive whole-token match over the subject split on
  non-alphanumerics, stated in AD-15.

### Fold, import, and premises

**M6: the `seq` watermark lives in the global store, but `seq` restarts per project-store instance, so rows can be skipped silently (Moderate).**
- AD-5 keeps `whisper_stats_watermark:<key>` in `global_meta` (line 663 ff.).
  `whisper_audit.seq` and `corrections.seq` are per project store.
- `deinit --purge` (AD-20, line 1723) deletes the project store. `grep` over the
  architecture found no watermark reset on purge or import.
- After a purge and re-`init`, or an `import` of an export older than the watermark,
  new rows get `seq` values at or below the surviving watermark and are never folded.
  The old `ts` watermark did not have this failure, so the change introduced it.
- Standard: FR-L4/FR-M1 ("efficacy counts must not drop rows", the change's own cited
  source); OL-10.
- Fix: keep the fold watermarks in the project store's `schema_meta`, so they travel
  with the `seq` space they index (export and import carry them; a purge resets them).
  Make the global `whisper_stats` write idempotent, keyed by (project_key, fold id).
  Then a crash between the global write and the watermark advance re-folds without
  double counting.

**M7: the watermark key scheme contradicts itself (Moderate).**
- `global_meta`'s comment still says "ONE PER PROJECT (`whisper_stats_watermark:<key>`)".
- The new WATERMARK comment says "two values per project" (audit `seq` and
  corrections `seq`).
- `whisper_stats` has single `window_start` / `window_end` columns for two independent
  watermarks.
- An implementer has to guess the key names and which `seq` the window records.
- Verified by Read of lines 663–705.
- Fix: name both keys (or both `schema_meta` rows, per M6), and give the window two
  column pairs or define it on the audit `seq` alone, with corrections attributed by
  `whisper_id`.

**M12: import validates after it has overwritten the destination, and the failure branch is undefined (Moderate).**
- AD-5 (line 747): backup into the destination, "then runs `quick_check` on the
  result". Only the busy case "changes nothing".
- A corrupt, foreign-repo, or wrong-schema export is written over the live store
  before anything checks it.
- Standard: validate input before an irreversible write (OWASP ASVS input
  validation); FR-K9 round-trip safety.
- Fix, in this order:
  1. Open the source read-only and run `quick_check`.
  2. Check `schema_meta.schema_version` and `repo_key` against the destination.
     Refuse on mismatch.
  3. `backup()` the current destination to `store.db.pre-import`.
  4. Back up the source into the destination and run `quick_check`.
  5. On failure, restore from `pre-import` with the same API.

**M13: V17 now states a false design fact (Moderate).**
- V17's consequence column (line 141) still says "Export/import (AD-5) uses `VACUUM
  INTO` … the chosen one does not depend on the floor".
- AD-5 now builds import on `backup()`, which exists only from Node v22.16.0. That is
  the V17 fact itself. So import does depend on AD-2's floor.
- An implementer reading the premise table builds the wrong import.
- Fix: rewrite V17's consequence as follows. Export uses `VACUUM INTO`. Import uses
  `backup()` and rests on the 22.16.0 floor, and AD-2's floor is therefore
  load-bearing for import.

### Delivery, binding, and trust

**M8: the fork delivered-set rebuild has no text-to-key mapping and no stated failure direction (Moderate).**
- AD-16 (lines 1487–1489): "The `delivered` set is rebuilt from the oracle-injected
  text the transcript carries".
- The delivered set holds subject keys (for example `coupling:<target>:<partner>`).
  The transcript holds rendered text in an undocumented layout (V12).
- The `read`-set half of the same paragraph states its safe direction. The delivered
  half states none.
- Standard: raise-flaws ("too unclear to act on without guessing"); FR-A4/FR-D5.
- Fix: store the subject key on `whisper_audit`. Recover keys by matching the
  transcript's `[oracle]` texts against `whisper_audit.text` in this project store.
  An unmatched text is not admitted: it may repeat, which is the safe direction.
  Count unmatched texts in `session_log`.

**M9: the trust-cap ordering is unenforced and the suspect cap is under-specified (Moderate).**
- AD-14 (line 1303) requires floor < `bar.untrusted_confidence_cap` <
  `bar.high_confidence_min`, and suspect cap < untrusted cap. It calls "no Phase A
  mined whisper is presented as high-confidence" an explicit property.
- `tune <key> <n>` (AD-20, lines 1726–1735) accepts any number. `tune
  bar.untrusted_confidence_cap 0.95` breaks the property silently.
- The suspect cap's relation to the floor is unstated. Below the floor, suspect facts
  are never delivered. Above it, they are delivered flagged. That is a behavioural
  choice left to the implementer.
- No seed values are given.
- Standard: CLAUDE.md "Numbers without sources don't go in"; an invariant needs an
  enforcement point.
- Fix:
  - `tune` rejects, in plain language, any value that breaks the ordering.
  - The `TuningReader` raises a fault and uses the seeds on a violating stored set.
  - AD-14 states whether the suspect cap sits above the floor.
  - Seeds are named with their source (or explicitly handed to plan Step 12 with the
    ordering as the constraint).

**M11: a binding miss is described as "visible" but nothing makes it visible (Moderate).**
- AD-23 (lines 1829–1836) and AD-20: "A moved checkout misses until `init` is re-run,
  visibly". A miss "fails open silent and creates nothing".
- There is no fault code for a miss. `grep -c` for a binding-miss code gave 0.
- Hooks fire in a moved checkout, or in any clone that carries a committed
  `.claude/settings.json`, and do nothing. The only way to see it is to run `status`
  in that directory, and `hooks_not_firing` lives in a project store that does not
  exist.
- Standard: OL-10.
- Fix: on a miss, write one `repo_unbound` fault per session to the home-level
  channel (AD-17). `status`, run anywhere, lists home-level faults.

**M14: `path#<file_id>` is not a verifiable pointer (Moderate).**
- AD-19 (line 1672) and the threat-model paragraph render a flagged path as
  `path#<file_id>`.
- No surface lets the agent resolve a `file_id`. `grep -n "path#"` gave 2 hits, both
  the rule itself.
- A whisper whose only pointer is that token fails FR-D1 ("at least one verifiable
  pointer … an uncheckable whisper is a rumor and is not emitted").
- Fix: such a whisper is emitted only when it carries another verifiable pointer (a
  commit hash). Otherwise it is withheld and counted as a suspect-path withhold in
  `session_log`. State this in AD-19.

### Minor

- **m1: the post-write hash cap cannot be checked without reading.** AD-23 says NULL
  "above the cap and no read made". The AD-12 cap is "> 1 MB **or** > 20k lines"
  (line 1220), and a line count needs a read. Fix: `stat` size > 1 MB → no read. Check
  the line cap during the bounded read and store NULL if it is exceeded.
- **m2: the spec's FR-O2 sentence is hard to parse.** Three chained dash asides now
  leave "and it is preserved even if that tool call later fails" attached
  ambiguously (spec lines 478–481). FR-O2's heading and C-4 (line 531) still say
  "verified 2026-08-25". Fix: split it into two sentences and update the dates.
- **m3: the test-path glob dialect is unstated.** `lexicon.test_path_patterns` does
  not say whether it uses gitignore-style or minimatch globs (for example, whether
  `test/**` is root-anchored). Fix: name the dialect in AD-12.

## Tentative Findings

No tentative findings. Every candidate's premise was verified per Compliance Gate B.
S2's magnitude rests on a synthetic benchmark, and it is stated as such. The finding
does not depend on the exact figure, only on the pass exceeding ~200 ms, and 414 ms
for the write phase alone already does.

## What's Actually Good

- **V20–V22 are primary-source premises, quoted verbatim.** Checked against the
  fetched hooks reference:
  - Line 1815: "String added to Claude's context alongside the tool result."
  - Line 1002: "Claude reads the reminder on the next model request".
  - Line 820: the exit-0 stderr sentence.
  - Line 1037: "saves the injected text in the session transcript".
  - Lines 1150–1158: the `SessionStart` input table, with no parent field.

  This is the standard CLAUDE.md sets for external facts ("verify … against current
  primary sources").
- **The explicit `INTEGER PRIMARY KEY` for `seq`.** The quoted VACUUM rule ("may
  change the ROWIDs of entries in any tables that do not have an explicit INTEGER
  PRIMARY KEY") matched `sqlite.org/lang_vacuum.html` verbatim. Choosing an explicit
  key over the decision record's implicit `rowid` is a correct refinement, grounded
  in engine documentation.
- **Reuse's comparability discriminator is keyed on declared `imports` capability.**
  I Read the AD-15 Reuse row and L6. The rule now separates "never counted" from
  "observed zero" by a recorded property, not by table membership. This is the L6
  rationale applied correctly, and the fixture wording in AD-24 was updated in step.
- **The spec edit changes no requirement.** I Read the spec diff: one sentence in
  FR-O2, a factual correction with its date. That is consistent with OL-C6's
  signed-off spec as the authority.

## Recommended Priority

1. **S1.** It is a correctness defect in delivered text, and it is FR-D1's worst class.
2. **S2.** It silently disables a confirmed owner block during every refresh.
3. **M1, M2, M3.** They are history and `in_tree` correctness, and they feed every
   history genre.
4. **M5, M6.** They corrupt the Phase A exit measurement.
5. **M12, M13.** They are import safety, the one data-loss path.
6. **M4, M7–M11, M14.** These are specification gaps an implementer would otherwise
   decide inline.
7. **The Minor findings.**

Verdict: NEEDS FIXES (19 findings: 2 Serious, 14 Moderate, 3 Minor)
