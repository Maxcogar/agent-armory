# Independent collapse-hunt: the 2026-09-26 plan pass (plan `2331baf` + `64f710a`, architecture delta `db9ecf9`)

*Review of record. Written once and never edited. Reviewer: a fresh subagent
that wrote none of the work under attack. Run on 2026-09-26 against
`git diff e20d001..64f710a -- docs/plans/plan-phase-a.md` and
`git diff 2331baf..db9ecf9 -- docs/architecture-phase-a.md`. This file is the
only file written. Nothing was committed.*

## Scope, method, and the goal it is judged against

**Test applied.** `CLAUDE.md` dominating rule 2, run on each load-bearing decision:
(1) its job in one sentence in mission terms; (2) the hardest question a
mission-literate skeptic would ask; (3) an answer with a spec, architecture, or
ledger citation, or "collapses"; (4) what it steers the builder toward, and
whether that is a guide or a gate. The hunt also lists load-bearing elements
nobody decided and text that serves review rather than the goal.

**Phase A goal (rule 3, spec §11.5).** An honest deterministic foundation, running
on Max Cogar's real repositories, that measures its own floor, with clean seams
for later phases, and never fake completeness. Phase A is the test bed whose data
Phase B is designed from. A mechanism that is dead or silently wrong on real
inputs therefore corrupts the exit data even when the plan text is consistent.

**Under attack.** D-plan-33 to D-plan-44 (plan §10). The gap-table rejections and
refinements in §14.5: G1(c) partly rejected; G11(c), G20's cap, G33's rows and
genre fallback, and the `PreToolUse` "just edited" wording rejected; G4, G5, G9,
G34, and N9 refined. The reopened Steps 1–12 with Checkpoint 1R (§6, §7, §9). The
new Step 16 confidence composition and the Step 12 seeds and ordering validator.
The architecture delta (V6, V14, V17, AD-2, AD-4, AD-5, AD-12, AD-14, AD-18,
AD-21, AD-23, AD-26, L6).

**A process finding first.** Plan §10A ("Author's collapse-test on each
load-bearing decision") has entries for D-plan-1 to D-plan-32 and **none** for
D-plan-33 to D-plan-44. Checked by listing every `#### D-plan-` heading after line
7478: the last is D-plan-32 (line 8181). Rule 2 requires the test "in writing,
before acceptance". The §10 bullets give reasoning and rejected alternatives, but
no job sentence, no skeptic question, and no guide/gate check. The steps below
are therefore the first four-step tests these twelve decisions have had.

**Probes executed in this hunt** (Node v22.22.2, git 2.43.0, Claude Code 2.1.283,
this container):

- **P1: fallback search vs FTS.** One `:memory:` store with the plan's exact DDL:
  `symbols(name)` + `CREATE INDEX … (name COLLATE NOCASE)`, and
  `fts5(name, tokenize = "unicode61 remove_diacritics 0 tokenchars '_$'")`. The
  same names went into both: `user_name`, `getUserName`, `helper`, `CAFÉ`,
  `Émile`, `foo-bar`, `valid?`, `my.method`, `Foo::Bar`, `userXname`. Queries
  used the plan's two forms: `LIKE ? ESCAPE '\'` with `<escaped>%`, and
  `MATCH '"<t>"*'`. Results:
  - `café`: LIKE `[]`, FTS `[CAFÉ]`.
  - `émile`: LIKE `[]`, FTS `[Émile]`.
  - `bar`: LIKE `[]`, FTS `[foo-bar, Foo::Bar]`.
  - `method`: LIKE `[]`, FTS `[my.method]`.
  - `user_`, `user`, `foo`, and `valid`: the two paths agree.
  - `EXPLAIN QUERY PLAN`, with and without `ESCAPE`, bound or literal: `SEARCH
    symbols USING COVERING INDEX symbols_name`. The index claim holds.
- **P2: `mode=rw` failure classes.** `new DatabaseSync(pathToFileURL(p).href +
  '?mode=rw')` on three paths: a missing file, a file in a missing directory,
  and a path that is a directory. All three fail with the same error:
  `ERR_SQLITE_ERROR`, errcode 14, "unable to open database file".
- **P3: git revert subjects.** A fix commit, then `git revert` of it, then of
  that revert, then of that one. git wrote these subjects:
  - `Revert "fix: handle null"`
  - `Reapply "fix: handle null"`
  - `Revert "Reapply "fix: handle null""`

  Each has the body `This reverts commit <40-hex>.`. Step 13 handles all three:
  the trailer match, and the `Revert "`/`Reapply "` subject prefixes.
- **P4: `is_error` by tool in real transcripts.** Every `tool_result` block in
  all 24 transcripts under `/root/.claude/projects/-home-user-agent-armory/`,
  paired to its `tool_use` by id and counted by tool:
  - **Bash:** `is_error: false` 845, `true` 9.
  - **Read:** field absent 373, `true` 1.
  - **Edit:** absent 89.
  - **Write:** absent 12.
  - **Grep:** absent 3.
  - **Glob:** absent 1.
  - **Every other tool:** absent.

  So `is_error: false` appears **only on Bash results**. No successful Read,
  Edit, or Write carries the field.
- **P5: Grep/Glob structured output in the installed Claude Code.** `strings` on
  `/opt/claude-code/bin/claude` (2.1.283), plus the npm `cli.js` 2.1.42:
  - The Grep output schema is `{mode?, numFiles, filenames: string[], content?,
    numLines?, numMatches?, …}`.
  - The `content` branch returns `{mode:"content", numFiles:0, filenames:[],
    content:…}`.
  - The `count` branch returns `{mode:"count", numFiles:<n>, filenames:[],
    content:…}`.
  - Only `files_with_matches` fills `filenames`. Glob returns `{filenames,
    durationMs, numFiles, truncated}`.
  - *Premise not verified here:* that the hook's `tool_response` is this `data`
    object. No hook in this container emits a payload to capture.
- **P6: confidence arithmetic under the seeds.** Step 16's composition is `c =
  ratio × 0.5^(age/365) × 0.9 (trust) × 0.8 (if indexStale)`, with floor 0.6
  and high tier 0.8.
  - ratio 1, age 0 → 0.90, high.
  - ratio 0.85, age 0 → 0.765, uncertain.
  - ratio 1, index stale → 0.72, uncertain.
  - ratio 1, age 213 d → 0.601, which passes the floor, uncertain.
  - ratio 1, age 365 d → 0.45, **below the floor, silent**.
- **P7: `node:test` todo.** A failing test marked `{todo: '…'}` reports `todo 1`
  and `fail 0`, and the run exits 0.

---

## Per-decision results

### D-plan-33: the reopened substrate is built first, migrations edited in place, Checkpoint 1R

1. **Job.** Build the whisper path on a substrate that records history truthfully.
   The old one gave every pair ratio 1.00 (G3), so every Coupling whisper would
   have stated a false ratio.
2. **Skeptic.** "In-place edits of 001/001b/002 are safe only if no store with the
   old shape exists anywhere. What stops the new code from opening one at
   `schema_version` 1 and treating it as current?"
3. **Answer.** The plan's premise: no store has shipped, and the skeleton ran only
   against scratch and throwaway stores (§6). Checked: `~/.ctxoracle` does not
   exist in this container, and no `.claude/` settings file in the repository
   references `ctxoracle`. AD-25's forward-only rule governs shipped stores. The
   premise holds.
4. **Steer.** It steers the builder to correct each artifact where it lives. It is
   a guide.

**Survives, with two holes in Checkpoint 1R** (H12, H13 below).

### D-plan-34: a miner landmine's evidence ratio is `min(1, support / bar.support_min)`

1. **Job.** Give a Warning's `[confidence: uncertain]` flag a defined meaning, as
   FR-A5a/FR-D1 require for hazards ("delivered with its confidence flagged").
2. **Skeptic.** "Does this ratio carry evidence strength, or is it a count that
   saturates at 3? And under the other factors in the composition, does support
   decide the tier at all?"
3. **Answer, in part.**
   - The saturating count is defensible as FR-A5a's "real vs coincidental" test.
     It has no base-rate term: 3 reverts in 4 changes and 3 in 400 changes read
     the same.
   - Past support 3, the tier is decided by recency and index staleness, not by
     support (P6). A support-3 landmine reaches `high` only when its evidence is
     under about 62 days old (0.9 × 0.5^(62/365) = 0.80) and the index is fresh.
   - The §10 claim that "'high' means 'as supported as a whispered pair'" is
     loose. A whispered pair is `high` only at ratio ≥ 0.889 (0.8 / 0.9). A
     landmine with support ≥ 3 always has ratio 1.
4. **Steer.** It steers `passesBar` to compute a number for hazards. It is a guide.

**Survives, with a hole.** The flag carries per-fact information on young evidence
only. See H1: the defect is in the composition, not in this ratio. The exit report
should record each landmine's `support` and its file's `change_count`, so that
Phase B can judge whether a base-rate term is needed. Layer: plan (Step 39 report
fields).

### D-plan-35: `cochange_pairs.last_commit` and `corrections.genre` (adopted into AD-4)

1. **Job.** Give every pair headline a commit the agent can check (FR-D1's
   verifiable pointer). Book each whisper-less miss against the genre Max names,
   so the per-genre efficacy data is not corrupted (the C4 lesson).
2. **Skeptic.** "Is `last_commit` really the newest co-change after chunking and a
   rewrite? And can a typo in `--genre` create a phantom genre in the fold?"
3. **Answer.**
   - The stream is `--reverse` (oldest first, Step 13), so each bump overwrites
     `last_commit` with a newer commit.
   - A rewrite purges and re-mines.
   - Step 34 refuses a genre outside the eight names.
   - The CHECKs (`genre IS NULL OR (whisper_id IS NULL AND deny_id IS NULL)`)
     match AD-4's comment.
4. **Steer.** It steers the builder to carry facts in columns, not subprocesses.
   It is a guide.

**Survives.**

### D-plan-36: the fallback search is token-prefix over indexes that can serve it

1. **Job.** A machine without FTS5 must see the same Reuse, Orientation, and
   Completeness facts as one with it. Degraded mode must not quietly change what
   the oracle says.
2. **Skeptic.** "You claim the two paths are 'provably the same query'. Are they,
   for any symbol that is not a lower-case ASCII `[\p{L}\p{N}_$]` identifier?"
3. **Answer. No, as executed (P1).** SQLite's `NOCASE` and `LIKE` fold ASCII
   only; `unicode61` folds Unicode case. FTS also splits `foo-bar`, `my.method`,
   and `Foo::Bar` into tokens, while LIKE matches only from the start of the
   whole name. The generic frontend exists to index "everything else" (AD-12):
   kebab-case, dotted, and `::` names. So those languages see different hits
   under the two states. `T-14-5`'s data (`helper`, `user_name`, `getUserName`,
   `$store`, all lower-case ASCII apart from their first letters) passes while
   the claim is false. The path side is sound: the plan lower-cases path tokens
   in JS on both paths.
4. **Steer.** It is a guide.

**Survives, with a hole (H4).** The index choice survives; "provably the same"
does not.

### D-plan-37: `--missed-question` arms the latest session (or `--session`)

1. **Job.** When Max reports a question the agent ignored, the block (OL-C3/OL-C5)
   must engage in the session where he is talking to that agent, and in no other
   session (the G23 defect).
2. **Skeptic.** "'The session with the newest liveness row' is the most recently
   *started* session. Liveness is written at `SessionStart`, Step 28 item 6. Max
   runs two sessions, or the newest one has ended. Which session gets armed, and
   does anyone find out?"
3. **Answer, in part.**
   - OL-C5's "their next move" does name the agent Max is working with. OL-11
     rules out requiring session ids from him.
   - "Newest started" is not "the one he is working in". A session started later
     than the active one, or already ended (a `SessionEnd` row exists), gets the
     question.
   - Step 34 says nothing about printing which session was armed. The report
     then arms nothing that can fire, and no one is told.
   - The DAO already has `session_log.lastEventTs`, which answers "most recently
     active".
4. **Steer.** It arms a reactive block only after a reported deviation, so it is
   not a pre-emptive gate (OL-R4 respected).

**Survives, with a hole (H5).**

### D-plan-38: the AC-8a backstop line is a whisper-shaped candidate that skips the bar and the rumor rule but not dedup or audit

1. **Job.** At a completion claim the work doesn't back (OL-12), remind the agent
   of Max's unanswered question, and log it (N2; FR-X6).
2. **Skeptic.** "Dedup stops the line at the second 'done' while the same
   question is still ignored. Doesn't that let the second unbacked completion
   claim through?"
3. **Answer.**
   - FR-A4: a fact already delivered to that consumer is not repeated. AC-8a
     requires the line at a completion claim, and "delivery, not a block".
   - `compact` keeps `delivered` (AC-5), so a compacted-away line stays
     suppressed. That is the spec's own rule, not this decision's.
   - Skipping the bar is grounded: the line is the block's backstop, not a
     repository fact (AD-9).
   - It quotes Max's own text, the only verbatim text, which carries human
     provenance.
4. **Steer.** It is a guide.

**Survives.**

### D-plan-39: the fork reseed recovers oracle text by its `[oracle] ` prefix and admits only `is_error: false` tool results

1. **Job.** A forked session must neither repeat facts the parent was already
   told nor withhold facts it never saw (FR-A4, D-20, AC-5 "fork reseed dedup").
2. **Skeptic (read-set half).** "The rule admits a Read, Edit, Write, MultiEdit,
   or NotebookEdit target only when its `tool_result` says `is_error: false`.
   Do those tools' results ever carry that field?"
3. **Answer. No (P4).**
   - In 24 real transcripts here, `is_error: false` appears only on Bash results
     (845).
   - Of the successful file-tool results, 0 of 373 Reads, 0 of 89 Edits, and 0
     of 12 Writes carry the field. The one failed Read carries `is_error: true`.
   - `successfulToolTargets` therefore returns `[]` on every real transcript, and
     the reseeded read set is always empty. It is empty silently:
     `rebuild_recovered_nothing` fires only for the *delivered* set.
   - The plan's evidence ("227 of 320 results carry it") was a total across all
     tools, never split by tool.
   - `T-21-3`'s fixture gives a Read `is_error: false`, a shape real transcripts
     do not have, and requires a Write with no field to be excluded, which is
     what every real successful Write looks like. The test pins the dead
     behavior. This is the G26 defect class again: a fixture that contradicts
     the real layout it stands in for.
   - It is also collapse-log 2026-09-26 lesson (4): the rule reads a field no
     supplying interface provides.
4. **Steer.** The failure direction is the safe one (under-seeding: facts may
   repeat). But the plan presents an active mechanism that does nothing.

   **Skeptic (delivered-set half).** "The claim is that it fails loudly
   otherwise. What if the prefix is not found at all?"

   Then `injectedLines` is empty, `carriedOracleText` is false, and no fault is
   raised. Only the case "prefix found, no exact match" is loud. PG-6's "fails
   loudly otherwise" is overstated for the case most likely under an unknown
   wrapper: the text is not saved as a plain string.

**The read-set half collapses; the delivered-set half survives with a hole
(H6).** Fix (plan, Steps 21 and 28, and `T-21-3`):
- Admit a file-tool target when its result does **not** carry `is_error: true`.
  The observed failures are all marked `true`; the observed successes carry no
  field.
- Rewrite `T-21-3`'s fixture to the observed shapes.
- Correct §11.4's "227 of 320" entry to the per-tool split.
- If the builder cannot accept that premise, drop the read-set reseed. Record in
  AD-16's disclosure that it is not implemented, rather than shipping a dead
  path.

Log this collapse in `docs/collapse-log.md` (rule 2).

### D-plan-40: Grep/Glob result paths are read from `tool_response.filenames`

1. **Job.** Let Coupling fire when the agent finds files by searching (G21;
   AD-15's Grep/Glob trigger).
2. **Skeptic.** "A Grep in `content` or `count` mode: what is `filenames`?"
3. **Answer (P5).**
   - In the installed Claude Code 2.1.283, both modes return `filenames: []`.
   - Step 28 treats "an array of strings" as a recognized response. An empty
     array is one, so it yields no touched files and records **no**
     `search_results = 'unrecognized'`. That is exactly the silent zero the plan
     says it prevents.
   - Step 28 even names "Grep in `files_with_matches` mode" as the working case,
     so the mode dependence was known and left unhandled.
   - `files_with_matches` (the default) and Glob do fill `filenames`. The
     field-name choice itself survives.
4. **Steer.** It is a guide.

**Survives, with a hole (H3).**

### D-plan-41: a single-file history fact passes the marginal axis

1. **Job.** Let Warning's hazards reach the agent at the edit (FR-A2e, AC-3a).
2. **Skeptic.** "P5: 'a fact one `grep` returns is not a whisper'. `git log --
   <file>` is one call. Why is 'invisible from a cold checkout' true, when the
   checkout holds `.git`?"
3. **Answer.** The stated reason is the weak one. History *is* visible in one call
   in a full clone. The decision stands on a different citation:
   - **AD-14's aggregative clause.** A revert-chain or fix-chatter label comes
     from classifying commits the agent has not enumerated, which is not "one
     call returns it".
   - **FR-A5a.** The hazard path's "only floor is a noise floor".
4. **Steer.** It is a guide.

**Survives, with a hole (H9).** The rationale text in AD-14 and Step 16 should
carry the aggregative reason. "Visibility" as written does not hold.

### D-plan-42: the handler opens stores `mode=rw` and never creates one

1. **Job.** An event must never create per-repository state without `init`, and a
   store deleted outside the tool must read as a reported condition, not as a
   fresh empty store.
2. **Skeptic.** "SQLite gives one error for 'missing'. Does everything that error
   covers really mean 'deleted outside the tool'?"
3. **Answer (P2).** No. A missing file, a missing directory, and a path that is a
   directory all return errcode 14. SQLITE_CANTOPEN also covers EACCES and
   EMFILE; that part is from the SQLite docs, not executed here, since the
   container runs as root. Every one of these becomes `StoreMissing` and
   `repo_not_bound reason 'store_missing'`, which misdiagnoses the case. The
   no-create guarantee itself survives, and so does the race argument.
4. **Steer.** It is a guide.

**Survives, with a hole (H8).**

### D-plan-43: a global import replaces bindings; the owner's exports go into a separate home

1. **Job.** AC-19 round-trips the global store. The exit run must not overwrite
   the leg-2 measurement with Max's imported store.
2. **Skeptic.** "Replace drops this machine's bindings for repositories the export
   never knew. Who tells Max those repositories are now unbound?"
3. **Answer, in part.**
   - Step 32 lists imported bindings whose roots are missing here.
   - It does not list live bindings that the replace deletes. Those repositories
     then emit `repo_not_bound` at their next event, with no word from `import`.
   - The separate-home rule has a tool backstop: a non-empty live store is
     refused without `--replace` (Step 32).
4. **Steer.** It is a guide.

**Survives, with a hole (H7).**

### D-plan-44: a revert-labelled commit is never fix-labelled; `index.entry_marker_points` = 1

1. **Job.**
   - Revert rule: count an undone fix as a revert, never as fix chatter, so
     Warning states the right hazard.
   - Marker weight: let Orientation name a real entry file (`main`/`cli`) that
     nothing imports (AC-1a's first shape).
2. **Skeptic.**
   - Revert: "Does `Reapply` get handled?"
   - Marker: "With weight 1, `main.ts` (in-degree 0) scores like any file
     imported once. Orientation ranks by match × hub × `entry_score`, so a shared
     utility imported by 20 files scores 20× on the same match. On a real
     repository, does a marker file ever reach the top four?"
3. **Answer.**
   - Revert: yes (P3). The trailer covers all three subjects git writes. The rule
     survives.
   - Marker: there is no evidence either way. "1 is the skeleton's value" is a
     mechanism reason. "Without outranking a real hub" concedes that entry
     points lose to hubs. It is a printed `plan_seed` (D-plan-7's
     conditional-measurement discipline), so the exit run can decide it, but
     only if the report measures it.
4. **Steer.** It is a guide.

**Survives, with a hole (H11).**

### §14.5 rejections

| Item | Result | Reason |
|---|---|---|
| G1(c): fix detection after the size exclusion | Survives | Grounded in collapse C1 (HERZIG via FR-K2/FR-D3). The residual case, reverting a large sweep, labels each file once, which is below the noise floor (2) unless the revert itself is reverted. |
| G11(c): ignored-tracked signal restored | Survives | AD-12's second pass was executed (ER M4). |
| G20: `bar.untrusted_confidence_cap` not seeded | Survives | The C2 reasoning holds. **But its replacement is re-creating C2's defect on common paths: H1.** |
| G33: window rows and the "verb's genre / answer_drift" fallback | Survives | Superseded by `stats_folds`, the replaced replica, and `--genre`/`unattributed`. The replay idempotence lesson is honored. |
| `PreToolUse` "just edited" | Survives | C3; the hooks reference says permission denials fire `PreToolUse`. |

### §14.5 refinements

| Item | Result | Reason |
|---|---|---|
| G4: purge in one transaction, chunked re-mine | Survives | `mining_in_progress` silences history genres while partial counts exist (Step 13), so no ratio is read from a half-mined store. |
| G5: one short final landmine transaction | Survives | AD-26 (the executed 414 ms lock hold). |
| G9: chunked units instead of wrapping passes | Survives | SAVEPOINT nesting as executed in the review. |
| G34: validate a temporary copy before writing the live store | Survives | ER M12; checking after the overwrite destroys what the check protects. |
| N9: "list it in the implementation log" replaced by `T-37-1` | Survives | A failing test is a stronger guide than a log line, and the implementation log is not a plan artifact. |

### Architecture delta (`db9ecf9`)

- **V6 corrected to fail-open silently.** Survives. The AD-23 text now says what
  the deadline buys: a `latency_breach` record before the harness discards the
  output.
- **V14, AD-12, L6 (32 of 36; the 0.25.10 pin).** Survive. They were executed in
  2026-09-11 probes 20 and 21.
- **V17 import via `backup()`.** Survives. `typeof backup === 'function'` was
  re-checked in the plan.
- **AD-2 fallback wording.** Survives, with H4. "The same token-prefix semantics
  as the FTS path" is false for the symbol inputs in P1.
- **AD-4, AD-5, AD-14, AD-18 additions.** Covered under D-plan-35, 43, 34/41,
  and 37 above.
- **AD-21 scrub list.** Survives for now, with a minor hole (H15).
- **AD-26 claim row (D-plan-32, executed 200/200).** Survives.

---

## Holes: load-bearing elements that are wrong or that nobody decided

Each hole has a layer that owns the fix. None is an owner decision: none touches
a CONFIRMED ledger row's content, and none is a scope or preference call. H1 and
H2 bear on OL-C4, and their fixes *restore* its sure/uncertain split rather than
change it.

- **H1: recency × trust × the floor silences old couplings; the high tier is
  mostly unreachable.** Owner: **architecture** (AD-14: does recency dampen the
  value compared against the *floor*, or only the tier?) then **plan** (seeds;
  Step 16).
  - Executed (P6) under the seeds (half-life 365 d, trust 0.9, stale 0.8,
    floor 0.6, high 0.8):
    - Every pair or history fact with ratio 1 whose last co-change is more than
      about 213 days before `HEAD` fails the confidence floor. A perfect 20-of-20
      coupling last touched a year ago is **silent**.
    - `high` needs a ratio of at least 0.889, evidence under about 62 days old,
      and a fresh index.
    - While the index is stale (every moved `HEAD` until the next reindex, and
      every worktree whose head differs), every mined fact is flagged uncertain,
      whatever its evidence.
  - Why it matters:
    - Hidden couplings in *stable* code are where the history channel matters
      most, and that is the path it silences.
    - The flag again carries no per-fact information on common paths: C2's
      defect through a different factor.
    - Plan D-plan-7's claim that a one-year half-life "keeps a five-year-horizon
      pair alive at 1/32 rather than cutting it off" is false against the floor
      (1/32 × 0.9 = 0.028 < 0.6). This pass carried it forward into Step 16's
      new composition without checking it end to end. No test asserts the
      cutoff age.
  - Also: applying *index* staleness to *mined* history facts is a wrong-check.
    Co-change history does not go stale when the structural index does. FR-K7
    says only that staleness lowers confidence.
  - Fix: decide in AD-14 which axis each dampener acts on and at what age a
    history fact should stop speaking. Then set the seeds so the floor cutoff
    matches that age, and add a test that pins the cutoff.
- **H2: `checkTuningWrite` does not enforce AD-14's own reachability property.**
  Owner: **plan** (Steps 12 and 33), with the invariant stated in the
  **architecture** (AD-14). AD-14 says "a strong-evidence repo fact can still
  reach the high tier". The validator checks only the caps and that the trust
  factor lies in (0, 1]. `tune bar.untrusted_trust_factor 0.75` passes, and
  every mined fact is then flagged uncertain: C2 re-created through `tune`. Add
  `bar.untrusted_trust_factor ≥ bar.high_confidence_min`, together with H1's
  decision on the other dampeners.
- **H3: a content- or count-mode Grep is a silent zero.** Owner: **plan** (Step 28;
  PG-7).
  - `tool_response.mode ∈ {content, count}` carries `filenames: []` (P5), which
    Step 28 counts as recognized.
  - Fix: when `mode` is present and not `files_with_matches`, record
    `search_results = 'mode_unsupported'`, counted in `status` like
    `unrecognized`. Parsing paths out of `content` is also undocumented, so a
    visible zero is the honest Phase A floor.
  - Update PG-7 with the binary evidence and the unverified
    `tool_response == data` premise.
- **H4: "provably the same query" is false.** Owner: **plan** (Step 14,
  `T-14-5` data) and the **architecture** sentence in AD-2.
  - Either make the fallback use the same tokens as FTS: a `symbol_tokens` table
    split by the unicode61 rule with `_$` as token characters and lower-cased in
    JS, searched by the same range query as `path_tokens`.
  - Or state the divergence (non-ASCII case, separator-bearing names) as a
    disclosed limitation.
  - Either way, add `CAFÉ`, `foo-bar`, and `my.method` to `T-14-5`.
- **H5: `--missed-question` can arm the wrong session or a dead one.** Owner:
  **plan** (Step 34), and the **architecture** sentence in AD-18. Choose the
  session by `session_log.lastEventTs`, not by the newest liveness row. Print
  the armed session's start time and last activity in plain language. Say so
  when that session has ended, and arm nothing then, or require `--session`.
- **H6: the reseed's prefix-absent case is silent.** Owner: **plan** (Steps 20
  and 28; §15 PG-6 wording).
  - PG-6 and D-plan-39 say "fails loudly otherwise". Only "prefix found, no
    exact match" is loud.
  - Either reword the claim to what is true, or add a loud case. A candidate: if
    entries in the forked transcript carry parent `sessionId` values that have
    `whisper_audit` rows, but no oracle line is found, raise
    `rebuild_recovered_nothing`.
  - *That premise, that fork transcripts keep the parent's `sessionId` on copied
    entries, is unverified here* and must be observed first (leg 2).
- **H7: a global import drops live bindings with no word.** Owner: **plan**
  (Step 32), and **architecture** AD-5's "replaces this machine's repository
  bindings". Before the replace, compute the live bindings absent from the
  import and list them too ("these repositories are no longer connected; run
  `ctxoracle init` in each"). Or keep the live bindings whose roots exist.
- **H8: `StoreMissing` swallows every CANTOPEN cause.** Owner: **plan** (Steps 3
  and 28). On errcode 14, `stat` the path after the failure. There is no race,
  because nothing is created. `ENOENT` gives `store_missing`; anything else
  gives a distinct reason carrying the errno, so `status` does not tell Max his
  store was deleted when it is a permission or descriptor problem.
- **H9: D-plan-41's rationale.** Owner: **architecture** (AD-14 class list) and
  **plan** (Step 16 prose). Replace "invisible from a cold checkout / the test is
  visibility" with the aggregative clause and FR-A5a (see D-plan-41).
- **H10: the landmine ratio's `bar.support_min` coupling.** Owner:
  **architecture** (AD-14 hazard path). The pair floor and the landmine
  saturation point share one row, so `tune bar.support_min 5` re-tiers every
  Warning as a side effect. Either state this as intended, or give landmines
  their own row. Minor.
- **H11: the marker weight is unmeasured.** Owner: **plan** (Step 39 report
  fields). The exit report should print, per Orientation whisper, how many named
  files came in by marker rather than by in-degree. Without that, AC-1a's
  first shape is only ever shown on its fixture.
- **H12: Checkpoint 1R lets tests be red and still calls it passed.** Owner:
  **plan** (§9).
  - "A skeleton test of a later step … may be red here". But Checkpoint 1R runs
    `npm test`, and the ctxoracle CI job runs `npm test`, so the checkpoint's own
    command, and the PR's CI, fail.
  - The builder would have to decide inline: skip, delete, or leave CI red.
  - Fix: mark each such test `{ todo: '<cause>; retired by Step <n>' }`. P7:
    `node:test` then reports it as todo, and the run exits 0. The count guard
    counts it, and `T-37-1` (or a sibling check) fails on any remaining `todo`
    at Checkpoint 4.
- **H13: "compile-only, no behaviour decision" is under-specified.** Owner:
  **plan** (§9).
  - Several reopened signatures gain inputs the skeleton does not have:
    `consumerKey(session, agentId)`, a `TuningReader` in place of a raw `Store`,
    and `openStore(…, {mustExist})`.
  - Passing them changes behavior. Keying consumers by session fixes G29 in the
    skeleton. `mustExist` changes what an unbound event does.
  - State the rule. Pass the value the new signature requires where the skeleton
    has it. Where it does not, pass a marked placeholder (`SKELETON: G<n>`).
    Record each behavior change in the implementation log.
- **H14: no author collapse-tests for D-plan-33 to D-plan-44.** Owner: **plan**
  (§10A). Add the twelve four-step entries, from this record or the author's
  own. Log the omission in `docs/collapse-log.md`: rule 2's "before acceptance"
  test was skipped, and only the independent hunt caught it.
- **H15: AD-21's scrub list is a snapshot of one execution.** Owner:
  **architecture** (AD-21; Phase B seam). This container also exports
  `CLAUDE_CODE_MESSAGING_SOCKET`, `CLAUDE_CODE_MESSAGING_TOKEN`,
  `CLAUDE_SESSION_INGRESS_TOKEN_FILE`, `SESSION_INGRESS_URL`, and
  `CLAUDE_CODE_WORKER_EPOCH` (names only, listed by `env`). Whether any of them
  attaches a `claude -p` child to the parent session was **not executed**, and
  Phase A makes no model call. Record the list as the observed set as of
  2026-09-07, and make the Phase B seam verify non-attachment by execution
  rather than trust the list. Minor; not Phase A-blocking.

## Text that serves review rather than the goal

- **R1: §14.5's Notes column.** The Item → Step → Test mapping helps the builder.
  The "rejected … (CH C1 / ER M10 …)" notes are second copies of rationale
  already in AD-14, AD-15, and AD-5 and in the owning steps, kept so a reviewer
  can audit coverage ("one fact, one home"). Owner: **plan**. Cut them to a
  pointer, or drop them.
- **R2: §16 item 5, "Resolved 2026-09-26 (architecture commit db9ecf9): …".** A
  change log inside the post-completion section. The architecture rows already
  carry their own "Corrected 2026-09-26" notes. Owner: **plan**. Keep only
  "Still open".
- **R3: review provenance in step text.** Parentheticals like "(the architecture
  pass's CH C4 — 'the genre its verb names' named nothing …)" and "(review N2 —
  executed, the skeleton emitted …)" are review history inside build
  instructions. The rule they justify is enough for a builder. Owner: **plan**.
  Minor; trim when the step is next edited, not as a separate pass.

## Verdict

**Does not pass as it stands.**
- **One collapse:** D-plan-39's read-set admission. The admitted tools never
  carry `is_error: false` in real transcripts, so the mechanism is dead, and its
  test pins a shape that does not occur.
- **Survive with a hole:** D-plan-33 (through H12/H13), D-plan-34, D-plan-36,
  D-plan-37, D-plan-39's delivered half, D-plan-40, D-plan-41, D-plan-42,
  D-plan-43, and D-plan-44's marker half.
- **Survive clean:** D-plan-35, D-plan-38, D-plan-44's revert half, all ten
  §14.5 rejections and refinements, and the architecture delta apart from
  AD-2's sentence (H4) and AD-21's list (H15).

**The most consequential finding is H1.** It is not one of the twelve new
decisions. It is the composition Step 16 now writes out. Under the seeds, it
silences every coupling older than about seven months and flags nearly every
mined whisper uncertain on common paths. That repeats C2's defect, through
recency and staleness this time. The seeds are printed, so it would not be
hidden in the exit data. But the exit data would then measure a seed interaction,
not the recognizer's floor, which is what the Phase A goal asks for.

**Owner decisions:** none. Every item is an engineering fix in the layer named,
architecture before plan where both are named, one layer per pass as STATUS
requires.
