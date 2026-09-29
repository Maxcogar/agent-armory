# Spec audit — coordinator verification and final verdicts

**What was audited.** Every line of `docs/specs/spec-context-oracle.md` at
`ec3b057` (the current version).
- The spec was split into 269 units: headings, requirements, judgments, table
  rows and paragraphs.
- All 1,048 lines with content fall in exactly one unit, checked by script.
  Only blank lines and table separators fall in none.
- Three parts:
  - a: lines 1–276;
  - b: lines 277–672;
  - c: lines 673–1142.
- Each part had a first audit, a second opinion and an adjudication, every one
  on Opus 5.5.

**Briefs.** The branch-audit brief and a spec-audit brief, which says:
- which lines are Max Cogar's decisions and which are engineering lines;
- that a fix is always the correct line, never a narrowed claim, limitation,
  fallback or exclusion.

**Why the audit was run.** Max Cogar signed the spec off without reading it line
by line (`OL-C6`). He did not know whether it needed an audit. The question was
engineering, so the coordinator decided it.

## What the coordinator checked

**First audits.** The checker passed on all three: coverage, fields, verdicts,
and every repo and web quote matched.

| Part | Entries | Units covered |
|---|---|---|
| a | 85 | 90 of 90 |
| b | 90 | 90 of 90 |
| c | 87 | 89 of 89 |

**Second opinions and adjudications.** Every quote was checked with
`qcheck.py`; none was bad.

| File | Repo quotes | Web quotes |
|---|---|---|
| a second opinion | 124 | 46 |
| a adjudication | 106 | 42 |
| b second opinion | 152 | 71 |
| b adjudication | 97 | 57 |
| c second opinion | 140 | 28 |
| c adjudication | 203 | 42 |

**Facts the coordinator established from primary sources or by execution:**

- **A Stop hook can block the end of a turn.** The Claude Code hooks reference
  (`code.claude.com/docs/en/hooks.md`, fetched 2026-09-29) says:
  - Stop `decision` `"block"` "prevents Claude from stopping";
  - Stop hooks receive `stop_hook_active` and `last_assistant_message`.
- **A `MessageDisplay` event exists.** The same page lists it: "While assistant
  message text is displayed".
- **Hook context survives a failed tool call.** The Claude Code changelog
  (`code.claude.com/docs/en/changelog.md`), under 2.1.110, reads: "Fixed
  `PreToolUse` hook `additionalContext` being dropped when the tool call fails".
- **Compaction discards injected context.** The hooks reference says "After
  auto-compaction discards that copy, Claude Code injects the next run's context
  again". That sentence is about SubagentStart context. Part a's adjudication
  establishes the main-session case from the context-window page instead.
- **Python's standard `sqlite3` supports FTS5 here.** It created an FTS5 table
  in this container (SQLite 3.45.1).

## Errors, recorded

1. **The coordinator's 2026-09-28 ruling.** It called FR-O2's clause "that text
   is preserved even if the tool call later fails" unsourced
   (`2026-09-28-branch-audit-coordinator-rulings-schema-and-edit-timing.md` §2).
   - That was wrong. The coordinator searched only the hooks page. The 2.1.110
     changelog line above sources the clause.
   - Part c's second opinion confirmed it by execution on 2.1.284 (X3): a
     failing tool call still delivered the context.
2. **Part a's adjudication, E-3.** It removes the same clause as "unsourced"
   for the same reason: it searched only the hooks page.
   - **Overridden:** the clause stays, cited to changelog 2.1.110, as part b's
     adjudication E-33 writes it.
3. **The 2026-09-28 coordinator ruling's L85.** It says "Delivery at read time
   is FR-A2e / D-26's job". Part a's first audit (E-51) found that contradicts
   FR-A2e and D-26, which put the warning at the edit. The ruling file is a
   record and is not edited; this entry corrects it.

## Cross-part reconciliation (binding on the correction)

1. **One Stop-block line for answer drift** (a E-19, a E-59; b E-26, E-27, E-31,
   E-65; c E-34, E-55, E-56, E-68). Part b's adjudication E-26 is the wording.
   - **When it applies:** a turn that ends with the owner's question unanswered
     gets a `Stop` continuation.
   - **When it re-applies:** it is re-evaluated at every `Stop` while the
     question is open.
   - **What releases it:** the answer.
   - **What bounds it:** the harness's continuation cap, which the oracle never
     raises. A release at the cap with the question still open is an FR-M2
     fault.
   - **What text it reads:** all assistant text since the question.
   - **The continuation form** (`decision: "block"` or `additionalContext`) is
     the architect's choice.
   - **Correction to part a's adjudication:** its E-19 names `decision: "block"`
     as the form. Read it as "a `Stop` continuation", per this item.
2. **The skill block has the same end-of-turn gap** (c E-34, found by part b's
   adjudication).
   - A skill's last step can be skipped only by ending the turn, and a
     `PreToolUse` deny cannot catch that.
   - The skill clauses therefore gain the same `Stop` landing, under the same
     bound: §2.1 (part a), FR-B1 (part b), AC-2b (part c).
3. **FR-D3's citation.**
   - `[HERZIG]` does not back FR-D3's evidence-display requirement: HERZIG is
     about noisy change data (a E-64; b E-58).
   - `[JOHNSON]` is the source. FR-D3 cites JOHNSON; `[HERZIG]` stays only where
     it governs FR-K2.
4. **Calibration** (a E-80, b E-90, c E-22).
   - The inputs are part c's adjudication E-22 wording: agent-reviewed runs, the
     AC-18 seeded run and the FR-L4 regret proxy, with a human correction
     outranking them when given. It does not depend on replaying the owner's
     transcripts, which waits on question 7 below.
   - Whether the owner will correct whispers is asked once (question 1).
   - "Ships high" is removed throughout.

## Final verdicts

| Part | Keep | Replace | Remove | Undetermined | Entries |
|---|---|---|---|---|---|
| a | 57 | 28 | 0 | 0 | 85 |
| b | 45 | 39 | 0 | 6 | 90 |
| c | 44 | 39 | 2 | 2 | 87 |
| **Spec** | **146** | **106** | **2** | **8** | **262** |

**The eight undetermined entries:**
- b E-36 (C-1, runtime);
- b E-38 (C-3, sandbox);
- b E-41 (NF-1, latency numbers);
- b E-77 (FR-K8, stores);
- b E-78 (FR-K9, export and import);
- b E-90 (FR-L6, the calibration comparison);
- c E-33 (D-31, latency);
- c E-35 (D-33, runtime).

Five of them wait on owner questions 5 and 6. The latency numbers (b E-41,
c E-33) need a measurement or a cited source. b E-90 needs an engineering
comparison.

**Every changed line needs Max Cogar's sign-off before the spec changes,**
because he signed the spec (M38). The correct lines are written in each part's
adjudication, or in its first audit where no reviewer disputed it.

## Questions for Max Cogar (plain language)

1. **Will you check the oracle's warnings yourself?** For example, by running
   `ctxoracle correct` when a warning was wrong. The warnings don't appear in
   your chat.
   - If yes: your corrections outrank everything else.
   - If no: agents check the warnings.

   (a E-80)
2. **The automatic check for skipped skill steps.** You called the skill feature
   "JUST A SMALL FEATURE". The spec builds a full automatic check of whether
   each skill step was done. Is that what you want, or smaller? (a E-58)
3. **The skill block.** Your words were that it blocks when a skill is not
   followed "OR STEERING ISNT WORKING". The spec dropped the second half. Should
   it be restored? (b E-24, E-27)
4. **"A more deterministic trigger"** for spotting when a skill should be in
   use. Should that be:
   - (a) decided only from what the agent does (which tools it uses, which files
     it opens);
   - (b) also allowed to use a model, limited to the skill's own steps;
   - (c) something else?

   (c E-6)
5. **Where must the oracle work?** Your words: "Sandbox compatibility is
   required." Which of these did you mean?
   - your own computer;
   - Claude Code cloud sessions like this one;
   - a computer with no internet at all.

   The answer decides the runtime and the parser. (b E-38; also b E-36, c E-21,
   c E-35)
6. **Where the oracle's memory lives.** You chose to keep it outside the
   repository. In a cloud session that memory is lost when the session ends.
   - Is that acceptable?
   - Or should it be kept somewhere that survives (for example, synced
     elsewhere)? No decision of yours rules that out; your words were "no team
     sharing".

   (b E-77, E-78)
7. **Your projects and your conversation records as test material.** Before the
   later phases are designed:
   - Should the oracle's test run use your own projects?
   - Should your Claude Code conversation records be used as test data?

   (c E-10)
8. **Skill steps done only "in the agent's head"** leave no trace, so they
   can't be checked. Should you:
   - (a) accept that;
   - (b) change your skills so those steps leave a trace?

   (c E-5)
9. **A sentence written in your name.** One spec line calls the skill failure
   "the recurring failure this project exists to prevent". That phrase is an
   agent's, not yours. May it be replaced with your own recorded words? (a E-43)
