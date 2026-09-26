# Independent collapse-hunt: the architecture pass from the skeleton gap-list review (commit `0fab6d7`)

*Review of record. Written once and never edited. Reviewer: a fresh subagent
that did not write the change. Run on 2026-09-26 against commit `0fab6d7`
(`docs/architecture-phase-a.md`, `docs/specs/spec-context-oracle.md`). This file
is the only file written. Nothing was committed.*

## Scope, method, and the goal it is judged against

**Test applied.** `CLAUDE.md` dominating rule 2. For each load-bearing decision:
(1) its job in one sentence in mission terms, (2) the hardest question a
mission-literate skeptic would ask, (3) an answer with a citation, or "collapses",
(4) whether it is a guide that informs or a gate that polices. The hunt also looks
for load-bearing decisions nobody tested and for text that serves passing review
rather than the goal.

**Phase A goal (rule 3, spec §11.5).** An honest deterministic foundation, running
on Max Cogar's real repositories, that measures its own floor (how little it
catches), with clean seams for later phases. It must never be fake completeness.
Phase A is also the test bed whose data Phase B is designed from, so any decision
that makes the exit data wrong without saying so fails the goal, even when the
document is internally correct.

**Sources read.** The full diff (`git show 0fab6d7`), and the surrounding text of
AD-4, AD-5, AD-13, AD-14, AD-15, AD-18, AD-23, and V17 in the post-change file.
Spec §4, §5, §7.2, §8 (FR-O2, FR-B3), §11.1, §11.3, and §11.5. `OWNER-LEDGER.md`
(OL-C4, OL-C5, OL-10, OL-R4). The review record
`docs/reviews/2026-09-25-skeleton-gap-list-review.md`, and
`ctxoracle/src/security/injection.ts`.

**External premises re-checked in this hunt.** Two primary sources were fetched on
2026-09-26 with `curl`, and the lines are cited by line number in the fetched file:

- Hooks reference, `https://code.claude.com/docs/en/hooks.md`:
  - line 1002: "inserts it into the conversation at the point where the hook fired.
    Claude reads the reminder on the next model request".
  - lines 1017–1018: PreToolUse context appears "next to the tool result".
  - line 1815: "String added to Claude's context alongside the tool result".
  - line 1037: "Claude Code saves the injected text in the session transcript".
  - lines 1150–1158: the SessionStart input table, which has no parent-session field.
  - line 820: exit-0 stderr goes to the debug log only.
  - line 2103: **"Permission denials fire `PreToolUse` but not this event"**.
- Tools reference, `https://code.claude.com/docs/en/tools-reference.md`:
  - line 221: read-before-edit. "Claude Opus 4.6, Claude Haiku 4.5, and older models
    always require the read. Newer models can edit an unread file when reading it
    wouldn't need a permission prompt".
  - line 227: Bash `cat`/`sed -n`/`grep` on a single file also satisfy the read
    requirement.

V20, V21, and V22 quote the hooks reference accurately. I found every sentence they
cite.

---

## Per-decision collapse test

Each entry gives the job, the skeptic's question, the answer, guide or gate, and a
result: **survives**, **survives with a hole** (the decision is sound, but a named
part of it is untested or unspecified), or **collapses** (the part named cannot be
answered from the spec or mission as written).

### D1: `files.in_tree` replaces cascade-delete and the empty-hash sentinel (AD-4, AD-12)

1. **Job.** A file's history evidence (pairs, landmines) does not depend on whether
   the indexer happened to see the file, so history facts spoken about files still
   in the tree are computed from complete history.
2. **Skeptic.** The rumor rule (AD-15) drops every pointer to a file that fails
   re-resolution, so no deleted file is ever spoken about. What decision does
   keeping its row change?
3. **Answer.** Confidence for a living file `a` is `pair_count / change_count(a)`
   (AD-13), and that is unaffected either way. The row is still needed because:
   - the miner must have a `files` row as the foreign-key target for every mined
     path (AD-4 DDL, `REFERENCES files(id)`);
   - a file deleted and later restored keeps its history instead of losing it;
   - "pruning deletes evidence" is AD-13 §4's own rule.

   The executed inconsistency is cited (review G2): the same fact was kept or lost
   depending on the order the index and the miner ran.
4. **Guide or gate.** Neither. It is internal data integrity feeding guides.

**Result: survives.** Minor, not blocking: rows with `in_tree = 0` are never garbage
collected. Growth is bounded by the mining horizon's path set, so this is not a
finding.

### D2: `files.change_count` as support(A); pair counters removed (AD-4, AD-13)

1. **Job.** Every Coupling, Completeness, and Consequence confidence the agent reads
   is the real ratio, so the confidence floor actually filters coincidences.
2. **Skeptic.** Is this the right denominator, and does it count the same population
   as `pair_count`?
3. **Answer.** Yes. Zimmermann et al., TSE 31(6) 2005 define support(A) as the
   number of transactions containing A (spec `[ROSE]`, §9). The rule says "every
   *included* commit", which is the same filter as the pairs. The defect is
   executed: 4/7 = 0.57 was stored as 1.0 (review G3). This is a measurement fix
   that the goal directly requires: without it, every exit-run confidence is 1.0.
4. **Guide or gate.** It informs (the confidence stated in the whisper).

**Result: survives.**

### D3: `labelled_touches` plus a per-pass rebuild of miner landmines, keyed `(kind, file_id)` (AD-4, AD-15)

1. **Job.** A Warning states each hazard once, with support equal to its true count
   over the window. Hazards that have aged out disappear.
2. **Skeptic.** After a history rewrite, does the rebuild still cite commits that no
   longer exist? That was N5, the defect this decision was written to kill.
3. **Answer.** Not from the text. AD-15 rebuilds landmines *from*
   `labelled_touches`. AD-13's rewrite rule says only "full re-mine + diagnostic",
   and nothing in the change says `labelled_touches` (or `files.change_count`) is
   cleared when the watermark is unreachable. Rows written for rewritten-away
   commits would survive in `labelled_touches`, and every rebuild would bring
   `revert_chain` rows citing them back. That is N5 again, through the new table.
   The review's G4 decision named the tables to clear, but it predates
   `labelled_touches` and was routed "Architecture: none". The re-mine is
   load-bearing for this decision, and its scope is now incomplete.
4. **Guide or gate.** It informs.

**Result: survives with a hole (H1).** AD-13's rewrite sentence must name every
table derived from history: `commits`, `cochange_pairs`, `files.change_count`,
`labelled_touches`, and the miner-kind landmines, cleared in one transaction.

### D4: revert and fix labels, detected before the transaction-size exclusion (AD-15)

1. **Job.** A Warning points at files that history shows were reverted or
   repeatedly fixed, so the agent knows the edit is in fragile territory.
2. **Skeptic.** The stated reason for running detection before the size exclusion
   is "a revert of a large commit is still a revert". Why does the same rule apply
   to *fix* labels? A 200-file "fix lint" or "fix formatting" sweep would label 200
   files as fix-chatter. Spec FR-K2 and FR-D3 cite `[HERZIG]` precisely because
   tangled or large commits inject that noise.
3. **Answer.**
   - **For reverts it holds.** A git-generated revert trailer is not tangled
     evidence about a file.
   - **For fix labels it collapses.** No citation supports admitting large
     keyword-matched commits. The only argument given is about reverts, and HERZIG
     (spec §9) argues against it. The consequence reaches the exit data: Warning
     false fires inflated by sweep commits would be read as "the floor fires
     wrongly" when they are an input-hygiene defect.
   - **The matching rule is also unspecified.** "A subject matching a member of
     `lexicon.fix_keywords`" does not say whether matching is whole-word or
     substring, or case-sensitive. Under substring matching, `fix` matches
     "fixture", "prefix", and "suffix". This repository's own history is full of
     "fixture" and "fix-set" subjects. SZZ-style keyword matching is whole-token.
4. **Guide or gate.** It informs.

**Result: collapses for the fix-label half (C1).** The fix is to run revert
detection before the size exclusion and fix-keyword detection after it (only
included commits), and to state whole-token, case-insensitive matching. The
revert half survives.

### D5: the consumer key is `(session_id, agent_id | 'main')`; the role is derived (AD-4, AD-9)

1. **Job.** A question Max asked in one session denies only that session's
   non-answering move, and whispers are deduplicated per agent that actually
   received them.
2. **Skeptic.** Is splitting by session a reading of OL-C5, or an agent's
   preference? Could it let an agent in a second session ignore Max's question?
3. **Answer.** OL-C5 (CONFIRMED) says "their next move": the agent that was asked.
   An agent in another session never saw the question, so denying it would be a
   deny with no deviation, which is the pre-emptive gate FR-B3 forbids. Spec FR-D5
   and FR-A4 say "per consumer", and FR-O6 keys delivery by `agent_id`. The
   cross-session deny and the cross-session silence were both executed on the
   real binary (review G23).
4. **Guide or gate.** The deny is a gate, one of the two confirmed ones. This
   decision *narrows* it to the asked agent, which is the direction the gate rule
   requires. The dedup half informs.

**Result: survives.**

### D6: SessionStart reconciliation acts only on the event's own consumer (AD-9, AD-16)

1. **Job.** One session starting never wipes another live session's dedup or
   question state.
2. **Skeptic.** FR-A4 says `startup`/`clear` → "clean". Clean *what*?
3. **Answer.** FR-A4 is per consumer ("A per-consumer delivered-set and
   read-set"), so "clean" is scoped to that consumer. The cross-session wipe is
   executed (review G23).
4. **Guide or gate.** It informs.

**Result: survives.**

### D7: the fork reseed reads the forked transcript (AD-16, AD-9, V22)

1. **Job.** After a fork, the agent is not re-told facts its transcript already
   holds, and its open questions stay open (FR-A4 "reseed").
2. **Skeptic.** V22 infers "no parent pointer" from a field list. Is the premise
   true, and does the rebuild actually recover the delivered set?
3. **Answer.**
   - **The premise holds as documented.** The SessionStart input table (hooks.md
     lines 1150–1158, re-fetched here) has no parent field. Line 1037 confirms the
     injected text is saved in the transcript and replayed on resume/fork.
   - **The recovery mechanism is not specified.** "Rebuilt from the
     oracle-injected text the transcript carries" does not say how a rendered
     whisper becomes a *subject key*. Parsing the rendered text (the template plus
     slots of G24), or matching it against `whisper_audit.text`, are both possible,
     and neither is chosen.
   - **A failed recovery is silent.** The read-set half states its failure
     direction ("under-seeds"). The delivered-set half states none, and it records
     no diagnostic when it recovers nothing. AD-9 has `rebuild_recovered_nothing`
     for questions. The delivered set has no counterpart, so a silent recovery
     failure would inflate the exit run's delivery counts with repeats.
4. **Guide or gate.** It informs.

**Result: survives with a hole (H2).** Name the text-to-subject-key mapping, and
record a fault when a fork or resume rebuild over a non-empty transcript recovers
zero delivered keys.

### D8: incorporation is defined per fact (`incorporatedBy`); history facts have none (AD-16)

1. **Job.** A fact is withheld only when the agent can already see it, so no fact
   is lost just because the agent read a related file.
2. **Skeptic.** Candidates are withheld by subject key, for example
   `coupling:<target>:<partner>`. A Read of A delivers `coupling:A:B`. A later Read
   of B produces `coupling:B:A`, which is a different key. Is that a repeat of "A
   and B change together", which FR-A4 ("Never repeat") forbids?
3. **Answer.**
   - **The incorporation half holds.** Reading a partner does not reveal a history
     fact (AD-14's marginal-value classes). The executed key mismatch is cited
     (review G25).
   - **Direction is untested.** Nothing in the change says whether subject keys for
     symmetric history facts are canonical (`a<b`, as `cochange_pairs` already is)
     or directional. The two confidences differ numerically (`pair/change(A)`
     versus `pair/change(B)`), so "a different fact" is arguable. But the headline
     the agent reads is the same co-change claim with the same commit pointer.
     Nobody decided this.
4. **Guide or gate.** It informs.

**Result: survives with a hole (H3).** Decide whether Coupling and Completeness
subject keys are canonical-pair or directional, give the reason, and pin it with a
fixture.

### D9: the file walk is `git ls-files --cached --others --exclude-standard`, or a `readdir` walk outside git (AD-12)

1. **Job.** The index sees exactly the files the owner's repository considers
   source, on git and non-git repositories alike, so no genre is silent because
   of the walk.
2. **Skeptic.** Why not one walk everywhere?
3. **Answer.** gitignore(5) semantics (negation, nested files, `core.excludesFile`,
   `info/exclude`) are git's own. AD-3 rule 3 requires path-keyed repositories to
   work. The non-git throw is executed (review G11/N7). The fixed exclusions are
   disclosed in `status`.
4. **Guide or gate.** Neither. It is an input.

**Result: survives.**

### D10: "`.gitignore` membership" dropped as a zone signal (AD-12)

- **Skeptic.** Does dropping it lose a real signal?
- **Answer.** No. The walk never admits an untracked ignored file. A tracked file
  under an ignored path is still zoned by path pattern. Both were executed and
  recorded (git 2.43.0), and the gitignore(5) sentence is quoted.
- **Guide or gate.** Neither.

**Result: survives.** Cutting a signal that could never fire is the rule-3 kind of
cut.

### D11: frontend capability declaration `{symbols, imports}`; the Reuse discriminator keys on `imports` (AD-12, AD-15, L6)

1. **Job.** Reuse never crowns a rival because another candidate's references were
   never counted.
2. **Skeptic.** A boolean says a language's imports are counted or not. The
   review's own G12 decision says bare and package specifiers "produce no edge".
   Real TypeScript repositories import through `tsconfig` path aliases (`@/util`).
   Those resolve to no edge, yet the language declares `imports: true`. Is that
   not the same observed-zero-versus-never-counted confusion, one level down?
3. **Answer.** The change answers the table-membership case (G13, cited) and nothing
   finer. Partial capability, meaning some import forms captured and others not, is
   not representable. So a helper imported mostly through aliases reads as
   "observed 0" and can lose the crown to a relative-import rival. This is the L6
   failure the rule exists to prevent, on the owner's likely TypeScript
   repositories.
4. **Guide or gate.** It informs.

**Result: survives with a hole (H4).** At minimum, count unresolved import
specifiers per file (a `status` figure and an input to the evidence caveat), so
incomparability can be detected where resolution failed, not only where a query is
absent. Otherwise disclose the alias blind spot in L6 in those words.

### D12: `test_map` from `lexicon.test_path_patterns` plus test-file import edges; route-registration dropped from `entry_score` (AD-12)

- **Job.** Consequence and Verification name the tests that really cover the edited
  file.
- **Skeptic.** Is the seed list evidence or invention?
- **Answer.** It is labelled "a seed, not a claim of completeness", is tunable, and
  its members are the named runners' conventions. Dropping route-registration
  ("a heuristic nobody wrote down cannot be built") is a cut in the rule-3
  direction.
- **Guide or gate.** Neither.

**Result: survives.** Note: in `imports: false` languages, test files produce no
`import_edges`, so `test_map` is empty and Consequence and Verification are silent
there by construction. `status` should show that per language, as D11's
capability display already implies.

### D13: the high-confidence tier and the trust caps (AD-14)

1. **Job.** The agent can tell a fact to lean on from one to double-check (FR-D1
   "confidence stated whenever not high"; OL-C4 option B).
2. **Skeptic.** Every Phase A mined fact is `untrusted_repo` (M1), and
   `bar.untrusted_confidence_cap < bar.high_confidence_min`. So *every* mined
   whisper is flagged `[confidence: uncertain]`: a 19-of-20 pairing and a
   13-of-20 pairing carry the same flag. If the flag is on every whisper, what
   does it tell the agent, and what does Phase A's exit data learn about flagged
   versus unflagged false-fire rates?
3. **Answer.**
   - **What the flag tells the agent.** Nothing that the evidence ratio in the
     headline does not already say. OL-C4 chose "voice uncertain warnings
     *clearly flagged*", which is a distinction between uncertain and sure. A
     flag that is constant across all mined facts erases that distinction for the
     whole phase.
   - **What the citations support.** FR-X4 says low trust "lowers confidence"
     (spec §7.2). It does not say low trust caps every fact below the tier FR-D1
     treats as "high". The change chose the strongest reading without saying why a
     weaker one (a trust dampener that lets a strong-evidence fact stay high) fails
     FR-X4.
   - **The measurement cost.** Exit data cannot compare false-fire rates between
     tiers, because in Phase A there is only one tier for mined facts.
   - **Two further gaps:**
     - The change does not say whether the whisper *displays* the capped value or
       the raw ratio. Displaying the capped value next to "17 of its last 20"
       states a confidence that contradicts its own evidence.
     - `bar.suspect_confidence_cap` is fixed only as "strictly below the untrusted
       cap". Its position against `bar.confidence_floor` is unstated. Below the
       floor it silently drops suspect non-hazard facts; above it, it is a second
       flag with no distinct rendering. How the three caps combine (the
       `symbol_refs` heuristic cap in the Limitations section is a third) is also
       unstated.
4. **Guide or gate.** It informs. None of these is a gate.

**Result: collapses in its universal-cap form (C2).** Either:

- (a) cite why FR-X4 requires *every* `untrusted_repo` fact below "high", and
  accept a constant flag for the phase, stated plainly as "every Phase A mined
  whisper is marked uncertain" (the change does say this) together with an
  explicit statement that the flag therefore carries no per-fact information in
  Phase A; or
- (b) make trust a stated dampener, so the tier still separates facts by
  evidence.

In either case, state what is displayed, place the suspect cap relative to the
floor, and state how the caps combine.

### D14: `PreToolUse` whispers are read after the tool runs (V20, L12); Warning and Consequence worded as "the edit just made"; the `PreToolUse` channel kept (AD-6, AD-15, spec FR-O2)

1. **Job.** A Warning or Consequence reaches the agent while it decides whether to
   revise, re-run, or proceed, and says only true things about what happened.
2. **Skeptic.** The whisper is worded "`x.ts`, **just edited**, was reverted…". The
   hooks reference says **"Permission denials fire `PreToolUse` but not
   [`PostToolUseFailure`]"** (hooks.md line 2103). The spec itself says a
   `PreToolUse` whisper "is preserved even if that tool call later fails". So when
   Max rejects the permission prompt, or the Edit fails (`old_string` not found),
   the whisper states an edit that never happened. By V20 a `PreToolUse` whisper is
   read at exactly the point a `PostToolUse` one is ("next to the tool result").
   So what does keeping the `PreToolUse` channel give that `PostToolUse` (which is
   success-only, V19) does not, apart from the false-wording cases?
3. **Answer.**
   - **The timing fact holds.** V20 is quoted correctly and was re-checked here.
   - **The spec edit holds.** It is a factual correction; no requirement text
     changed.
   - **The wording collapses.** "Just edited" is checkably false on the
     permission-denied and failed paths. FR-D1 treats a checkably false whisper as
     the worst output.
   - **"The channel is kept" is not justified.** No sentence says why `PreToolUse`
     is kept over `PostToolUse`. The only behavioral difference is that
     `PreToolUse` also fires on edits that did not run.
   - **L12 is stated too absolutely.** "No fact reaches the model before an edit
     runs" ignores a pre-edit channel the change did not consider. The Read that
     usually precedes an Edit is required outright for "Claude Opus 4.6, Claude
     Haiku 4.5, and older models", and newer models may skip it only in some cases
     (tools-reference line 221). Coupling already fires on that Read. Firing a
     Warning on the Read of a landmine file would put the hazard in front of the
     edit decision, which is the mission's "at the moment of that decision". It is
     not a gate. That alternative may be wrong (the spec binds Warning to "an edit
     in a landmine zone", FR-A2e, and D-26 puts landmines at the edit), but L12
     asserts it does not exist instead of rejecting it with a reason.
4. **Guide or gate.** It informs. It rightly refuses to use a deny to get ahead of
   the edit (FR-B3, OL-R4).

**Result: collapses in the wording and the channel choice (C3). L12 needs its
alternative addressed (H5).** Fix: either move Warning and Consequence to
`PostToolUse` Edit/Write, where "just edited" is true by construction (V19), or
keep `PreToolUse` and word them about "the file this edit targets", which is true
whether or not the edit ran. Then either narrow L12 to "no fact can be attached to
the Edit event itself before it runs" and record why a Read-time Warning is or is
not adopted (a spec FR-A2e/D-26 question), or adopt it.

### D15: no stderr warning suppression (V21, AD-7)

- **Skeptic.** Is "Claude never sees exit-0 stderr" current?
- **Answer.** Yes. It is verbatim at hooks.md line 820, re-fetched here. The handler
  always exits 0 (AD-7).
- **Guide or gate.** Neither.

**Result: survives.** Declining to build machinery against a hazard that does not
exist is the rule-3 kind of cut.

### D16: the home-level diagnostics channel (AD-17, AD-3 layout)

- **Job.** A failure before the repository is known is still visible to Max (OL-10).
- **Skeptic.** Who reads it?
- **Answer.** `status` reads both channels. The lost fault is executed (review G35).
- **Guide or gate.** Neither.

**Result: survives.** Its single most important use is D17's binding miss, and D17
never names that fault (see H6).

### D17: repository resolution by a bounded upward walk plus the `init`-recorded binding; a miss is silent (AD-23, AD-20)

1. **Job.** The oracle finds the right store on every event within the latency
   budget, and does not create state for repositories Max never initialized.
2. **Skeptic.** The text says "A moved checkout misses until `init` is re-run,
   **visibly**". Visible where? A miss "fails open silent and creates nothing —
   except a fault on the home-level channel". Does a miss *write* that fault, and
   under which code? Also: a git worktree has its own root and realpath, so is
   every worktree of an `init`-ed repository silent until `init` runs in it? And a
   fresh clone that carries a committed `.claude/settings.json` fires hooks at an
   unbound path.
3. **Answer.**
   - **The NF-1 half holds.** AD-23 forbids a `git` subprocess on the event path,
     and `rev-list --max-parents=0` is unbounded. The per-event layout creation is
     executed (review N15).
   - **The "visibly" half is not backed.** No fault code for a binding miss is
     named, and whether a miss writes one is ambiguous. Worktrees are not
     addressed; the repository key (AD-3) would match, but the path binding would
     not.
   - **The measurement cost.** An owner session in a moved checkout or a worktree
     produces zero whispers, and the exit data would read that as a low floor.
     That is the same class as N3.
4. **Guide or gate.** Neither.

**Result: survives with a hole (H6).** Name the fault. For example, `repo_not_bound`
fires when a wired hook fires at an unbound root, which means the hook wiring
exists but no binding does. It is written once per session to the home-level
channel, and `status` shows it. Also decide worktrees: either `init` records each
one, or the lookup falls back to the repository key read from the worktree's
`.git` file pointer to the common directory, which is a bounded file read.

### D18: the post-write content-hash read (AD-23, AD-4 `observed_actions.content_hash`)

- **Job.** FR-L4's regret proxy has its input.
- **Skeptic.** Is a file read on the event path allowed?
- **Answer.** It is added to AD-23's inventory and bounded by the AD-12 cap, with
  NULL stored above the cap. FR-L4 requires the regret measurement (spec §11.3).
- **Guide or gate.** Neither.

**Result: survives.**

### D19: filenames are injection-flagged; a flagged path renders as `path#<file_id>` (AD-19, threat T1)

1. **Job.** A repository-authored filename cannot put an instruction into the
   agent's context.
2. **Skeptic.** FR-D1 requires "at least one verifiable pointer", and says an
   uncheckable whisper "is a rumor and is not emitted". The agent cannot open
   `path#<file_id>`. `file_id` is an internal store id, and "no agent-required
   rituals" forbids asking it to run a CLI to resolve one. Is a whisper whose
   pointer is masked still a whisper, or a rumor? And when the flagged path is the
   target of the agent's own Edit, the name is already in the agent's context, so
   what does masking protect?
3. **Answer.** The threat is real (OWASP LLM01, spec §7.2 FR-X2/FR-X3). Pointer-only
   composition leaves names as the one repository-authored text a whisper carries.
   But the rule does not reconcile with FR-D1. It must say whether a whisper stays
   emittable when a masked path is its only pointer (some whispers also carry a
   commit hash, which stays verifiable). Masking the agent's own tool target
   protects nothing. The flagger (`injection.ts`) is a narrow phrase lexicon, so
   false positives on real paths are unlikely; this is a correctness gap, not a
   noise gap.
4. **Guide or gate.** It informs.

**Result: survives with a hole (H7).** State that a whisper with no verifiable
pointer left after masking is dropped under the rumor rule and counted in
diagnostics. State that the agent's own tool target is never masked.

### D20: the `whisper_stats` fold watermark is `seq` (an explicit INTEGER PRIMARY KEY), not `ts` (AD-4, AD-5)

1. **Job.** Per-genre sent and corrected counts, the efficacy data Phase B
   calibrates from, never drop rows.
2. **Skeptic.** The watermark lives in the **global** store
   (`global_meta whisper_stats_watermark:<key>`, AD-5). `seq` lives in the
   **project** store. What happens when the project store is replaced but the
   global store is not? Three cases:
   - `deinit --purge` then `init`;
   - `import` of an older export;
   - rebuild after `store_corrupt`.

   `seq` restarts at or below the old watermark, and every new row with
   `seq <= watermark` is never folded. The skipped-row defect D20 fixes comes back
   through a different door. Separately, the monotonicity premise cites
   "`whisper_audit` and `corrections` rows are never deleted (AD-4)". AD-4 states
   non-droppability for `whisper_audit` only (line 580). It says nothing like that
   for `corrections`.
3. **Answer.** The concurrency race (review N11) is answered correctly. Under
   SQLite's single writer, rows become visible in `seq` order. The VACUUM rowid
   rule is cited correctly, which is why `seq` is explicit. The store-replacement
   case is not addressed, and the `corrections` premise cites a sentence that
   does not exist.
4. **Guide or gate.** Neither.

**Result: survives with a hole (H8).** Bind the watermark to a store generation.
For example, write a ULID into the project store's `schema_meta` at creation or
import, store it beside the watermark, and reset the watermark when it differs. Add
the non-deletion rule for `corrections` to AD-4, or cite where it lives.

### D21: import via `node:sqlite` `backup()`, never a file copy (AD-5)

- **Job.** Restoring Max's accumulated store never corrupts it.
- **Skeptic.** Is it proven?
- **Answer.** The corruption was executed with `copyFileSync` and the clean result
  with `backup()`, with a live WAL holder (review G34). The SQLite "How To Corrupt"
  sections are cited.
- **Guide or gate.** Neither.

**Result: survives.** A stale premise was left behind (see R1).

### D22: fold attribution of corrections (AD-5)

1. **Job.** Each correction is counted against the genre it corrects, so the
   efficacy data is per-genre true.
2. **Skeptic.** "A `missed` / `--missed-question` correction with no whisper goes
   to **the genre its verb names**, or to answer_drift." Which verb names a genre?
3. **Answer.** None does. AD-18's `ctxoracle correct` takes a verdict
   (`false_fire`/`missed`/`confirm`) against a whisper or deny id, plus
   `--missed-question`. No CLI form carries a genre. So as written, every
   whisper-less `missed` goes to `answer_drift`, and a missed Coupling or Warning
   that Max reports would be booked as an answer-drift miss.
4. **Guide or gate.** Neither.

**Result: collapses as written (C4).** Either add a genre argument to
`correct … missed` (for example `--genre coupling`) and cite it, or state that a
whisper-less `missed` without `--missed-question` is booked as `unattributed`,
never to `answer_drift`.

### D23: transactions nest through SAVEPOINT; the caller owns the unit of work (AD-26)

1. **Job.** A mining pass or an event is recorded completely or not at all, so
   the store never holds a half-applied pass that the exit data then reads.
2. **Skeptic.** The units of work listed include "**the handler's event**". If the
   whole event is one `BEGIN IMMEDIATE`, the write lock is held across catch-up,
   candidate generation, and compose (AD-1 estimates about 100–200 ms). Now that
   D5 explicitly supports concurrent sessions on one repository, the second
   session's handler hits the 100 ms `busy_timeout` plus one retry, then gives up
   with `StoreBusy` (AD-26). Is the event path's lock span bounded anywhere?
3. **Answer.**
   - **The nesting half holds.** SQLite `SAVEPOINT` semantics were executed here
     (the recorded probe), the Unit of Work pattern is cited, and the
     watermark-before-landmines crash window was executed (review G9).
   - **The event-scoped transaction's lock span is unbounded.** AD-23's inventory
     bounds each call, not how long the lock is held. An event that holds the
     lock through its reads turns concurrency into give-ups, and those give-ups
     are the whispers the exit run would count as not delivered.
4. **Guide or gate.** Neither.

**Result: survives with a hole (H9).** State that the handler's unit of work spans
only its writes: questions and bookmark, audit-then-emit, and `observed_actions`.
Reads and compose run outside the write transaction.

### D24: the spec FR-O2 wording correction

- **Skeptic.** Did a requirement change under cover of wording?
- **Answer.** No. Only the description of when the model reads the context
  changed. The quoted phrases match hooks.md lines 1002 and 1815. The sentence is
  now a run-on with nested dashes, but that is style, not a finding.
- **Guide or gate.** It informs.

**Result: survives.**

---

## Load-bearing decisions the change introduced that nobody tested

Each item below is an unspecified or unexamined element that a later plan step
will have to decide inline. That is what the architecture skill forbids.

- **H1.** The history-rewrite clearing scope omits `labelled_touches` and
  `change_count` (D3).
- **H2.** The fork delivered-set recovery has no mechanism and no fault (D7).
- **H3.** Directionality of the subject key for symmetric history facts (D8).
- **H4.** Partial import capability, such as path aliases or unresolved specifiers,
  is invisible to a boolean (D11).
- **H5.** L12's absolute claim; a Read-time Warning was never considered (D14).
- **H6.** No fault for a binding miss; worktrees are unaddressed (D17).
- **H7.** A masked-path whisper against FR-D1's verifiable-pointer rule (D19).
- **H8.** The watermark and `seq` live in different stores, and project-store
  replacement desyncs them. The `corrections` non-deletion premise is uncited
  (D20).
- **H9.** The handler-event transaction's lock span is unbounded (D23).

## Text that serves review rather than the goal

- **R1: a stale premise row contradicts the decision it supports.** V17's
  implication column (unchanged by this commit) still says "Export/import (AD-5)
  uses `VACUUM INTO` … the chosen one does not depend on the floor". AD-5 now
  imports through `backup()`, which *does* depend on the 22.16.0 floor. The change
  added "V20–V22 added 2026-09-26" to the knowledge-state baseline, but did not
  correct the V-row whose premise it reversed. This is the "correct and
  well-cited, but not true" pattern rule 3 names: a reader who checks V17 learns
  the opposite of the design.
- **R2: a review record is listed as a governing standard.** The Standards table
  gains the row "Review record `docs/reviews/2026-09-25-skeleton-gap-list-review.md`
  | … | the 2026-09-26 architecture changes", under the table's claim that "Every
  standard above drives at least one named decision; none is decorative." A review
  record is evidence, not a standard. Listing it makes every new decision look
  anchored to a standard while adding no external ground. The executed probes are
  already cited in each AD's premise-verification item, which is their proper
  place. The row should be removed.
- No other review-serving padding was found. The "Superseded 2026-09-26" passages
  and the executed-defect narratives are rationale and premise evidence, which is
  what the routing table assigns to `docs/architecture-*.md`. Each passage I read
  changes a design choice rather than decorating one.

---

## Verdict

**NEEDS FIXES. The change does not pass the collapse test as a whole.**

**Survives outright (12):**

| Decision | What it covers |
|---|---|
| D1 | `in_tree` |
| D2 | `change_count` denominator |
| D5 | consumer key |
| D6 | own-consumer reconciliation |
| D9 | walk rule |
| D10 | `.gitignore` signal dropped |
| D12 | `test_map` conventions |
| D15 | no stderr suppression |
| D16 | home-level channel |
| D18 | post-write hash |
| D21 | import via backup |
| D24 | spec wording |

The measurement-critical fixes, meaning the confidence denominator, per-session
consumers, landmine dedup, SAVEPOINT atomicity, and import safety, are real and
serve the Phase A goal directly.

**Collapse (the part named cannot be answered from the spec or mission as
written):**

- **C1 (D4).** Fix-keyword labels are admitted from oversize sweep commits, and
  keyword matching is unspecified. This contradicts HERZIG as spec FR-K2/FR-D3
  cite it, and inflates the Warning false-fire data.
- **C2 (D13).** The universal trust cap makes the OL-C4 uncertainty flag constant
  across every Phase A mined whisper. FR-X4 ("lowers") does not require a
  universal cap. Display value, suspect-cap placement, and cap composition are
  unstated.
- **C3 (D14).** "Just edited" wording on a `PreToolUse` whisper is checkably false
  when the edit is permission-denied (hooks.md line 2103) or fails. Keeping
  `PreToolUse` over `PostToolUse` has no stated reason, since V20 makes their read
  timing identical.
- **C4 (D22).** The fold attributes whisper-less `missed` corrections to "the genre
  its verb names", and no verb names a genre. Missed-whisper reports would be
  booked as answer-drift.

**Holes to close (untested load-bearing elements):** H1–H9 above.

**Review-serving text:** R1 (the stale V17 premise) and R2 (the review record
listed as a standard).

**Owner routing.** Every item is engineering (`OL-11`) except one. The Read-time
Warning alternative in H5 touches the spec's FR-A2e trigger and judgment D-26.
Whether a landmine Warning may fire at the Read that precedes an edit is a spec
change, and it goes through the spec's normal revision path with its reasoning.
It is not a question for Max Cogar unless it touches a CONFIRMED ledger decision,
and none was found (OL-R4 and OL-C2 bar gates, not Read-time whispers). Any
decision that collapses is logged in `docs/collapse-log.md` by the author, not
by this review.
