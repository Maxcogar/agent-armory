# Collapse-hunt — `docs/specs/spec-context-oracle-phase0.md`, round 4 (2026-08-01, twelfth pass)

*Independent adversarial pass, fresh subagent, never the author. Mission-fidelity
axis only. **Written once, never edited.***

**Target:** `middleware/context-oracle/docs/specs/spec-context-oracle-phase0.md`
at commit `014bc26` (unchanged at `HEAD` = `2dfbc45`; the two commits since touch
only `docs/STATUS.md` and `docs/collapse-log.md`).

**Prior pass:** `docs/reviews/2026-08-01-collapse-hunt-phase0-spec-rebuild-2.md`
(23 findings + 6 minors, at `93de2c2`). Its findings are closure items here and
**every one was re-derived from the current file**, not assumed applied. The
changes since are `93de2c2..014bc26`: the round-3 collapse hunt (`7dacf29`), the
round-3 expert review (`c0fe0b1`, `0d281cc`), and the rebuild against both
(`014bc26`, 651 insertions / 531 deletions).

**Verdict: 16 findings — 5 collapse, 11 partial — plus 10 minors.**

**Of the prior 23: 17 closed, 2 partially closed (Q9, Q21), 4 neither applied nor
adjudicated (Q10, Q20, Q22, Q23).** Q2's class reopened in eight further rows, one
of which is a **regression** — FR-X5 was correctly in the narrowed table at
`93de2c2` and has been moved back to "unchanged." **Of the prior 6 minors: all 6
closed**, though M3's class reopened at FR-X3.

Q10 is the sharpest closure failure: §2's exclusion row is **byte-identical** to
the text the prior pass quoted and killed. `CLAUDE.md` — *"When a review surfaces
findings, apply **all** of them"* — and four passes of silence on Q22/Q23 is not
adjudication either.

**The dominant class this pass is one layer out from the last one.** Round 3's
lesson was that verifying a source establishes only the claims you aimed at it: the
document had checked every *positive* claim about the hooks contract and inherited
every *negative* one. That lesson was applied, and applied well — §4 now carries
`last_assistant_message`, the resume-replay semantics, `SessionStart`'s `source`,
and subagent hook firing, and its `StopFailure` claim (that the same field name
there holds the API error string) is exactly right and was the hardest of them to
get right. What nobody asked is **what the harness does with the value the hook
returns**. `additionalContext` from a `PreToolUse` hook is placed *next to the tool
result* — after the edit has run (**F1**). Three of §7's seven rows, including both
⚠ arms and the genre `RETHINK.md:166` calls *"the golden moment, the last cheap
point to alter course,"* do not arrive at the moment they are specified to arrive
at. It is one paragraph away, in the same file, in the section §4 already quotes
twice.

**The second class is the collapse log's own standing lesson, alive for the fourth
round running: the device installed to close a finding is the next round's
finding.** Q3 named six dropped source keys; all six returned, and **five of the
six carry a v1 line pointer that resolves to a different source** (**F4**). Q2
named eleven mis-filed §3 rows; ten moved, and §3 replaced its modest purpose
sentence with an attestation that *"each row's disposition is the right one — …
by diffing every 'unchanged' row against v1's text and against §13's decision
records"* — a check that fails in eight rows, three of them contradicted by this
document's own §13 (**F3**). Q5 said the silence rate mixed structurally different
causes; one component was added and four other suppressors are still folded into
"below the bar" (**F5**).

**The single heaviest finding is F1.** The mission sentence is *"at the moment of
that decision."* §1 restates it as a property of every whisper: *"Every whisper
carries a pointer, **arrives at a decision moment**, and blocks nothing."* For the
consequence genre and both warning arms, it does not.

---

## What survives, stated first so the findings read as exceptions

Each re-derived from primary source in this pass, not inherited from the prior
review or from commit messages:

- **Every ROSE quotation is verbatim, and the attribution split is correct.** I
  fetched the TSE 31(6) 2005 PDF (via `web.archive.org` from the author's copy —
  the direct URL now serves a JS lander; Semantic Scholar's copy under that paper's
  ID is a **lecture slide deck**, and the Kent State copy is the 6-page ICSE 2004
  short version, in which nine of the twelve quoted strings do not appear at all).
  The correct paper is 17 pages; `file(1)` reports 10, the exact discrepancy the
  collapse log records. All **twelve** quoted strings in §4, FR-K2, P0-5 and
  P0-D-8 match verbatim, and each was read in its surrounding paragraph. P0-5's
  §7.5 Prevention / §7.6 Closure split is drawn correctly, and its gloss *"one
  warning per 33 missing items"* is the paper's own sentence — *"for only one out
  of every 33 missing items … ROSE issues a warning."* Q12's fix landed by deleting
  the mis-attributed 0.30 figure from P0-D-8 rather than by re-hedging it.
- **§4's hook-contract quotations all resolve in current source.** I downloaded
  `code.claude.com/docs/en/hooks.md` — **242,078 bytes, byte-identical to §4's
  attested figure** — and `hooks-guide.md` (62,452 bytes), and string-matched every
  quotation. All present. The one string that failed a naive match
  (*"the hook can deny the call, but staying silent doesn't approve it"*) differs
  only by sentence-initial capitalisation.
- **§4's `StopFailure` claim is right, and it is a negative claim.** *"On
  `StopFailure` the same field name carries the API error string, not an assistant
  message."* The contract's own field table: *"Unlike `Stop` and `SubagentStop`,
  where this field holds Claude's conversational output, for `StopFailure` it
  contains the API error string itself."* This is the round-3 lesson executed
  correctly — a claim about what a source does *not* provide, aimed at the source.
- **§3's partition is arithmetically exact and no identifier is minted.** I
  extracted every `FR-*`/`NF-*`/`C-*` definition line from v1 by script: **65,
  no duplicates**, distributed 7/9/9/5/5/3/7/4/8/3/5. §3's three sets are
  27 + 21 + 17 = 65, with **zero overlap** and full coverage. Every
  `FR-*`/`NF-*`/`C-*`/`P0-*`/`AC-*` token in the Phase 0 spec was extracted: no
  new `FR-*`, `NF-*` or `C-*` is minted; `AC-1`–`AC-33` and `P0-D-1`–`P0-D-25` are
  each defined exactly once and each referenced.
- **Every `RETHINK.md` line citation resolves.** All twenty cited ranges plus the
  six short-form ones were read against current source (399 lines) and each
  supports the claim it is attached to — with one scoping caveat at C-3 (**m9**).
- **Q1 landed, and landed as capability rather than as a hedge.** P0-3 now
  recognises a completion claim from `last_assistant_message`; §4 records the
  field on both events and its different meaning on `StopFailure`; AC-12 tests the
  positive case, the negative case and the bound. This is the honest form, not the
  cheap one, and the prior pass explicitly priced both.
- **Q3's six source keys are all back, Q8's `ctxoracle log` exists with AC-30,
  Q11's confidence conjunct is restored with AC-4's negative case, Q13's
  declarative false-fire clause is in FR-D3 with AC-7 and AC-31, Q17's universal
  well-formedness criterion is AC-31, and Q18/F10 — open for three passes — is
  closed by FR-M2 and P0-D-22.** Six of the eight §3 rows the round-3 expert
  review's S1 named were moved, and C-3's harness-neutral event contract and
  FR-K1's entry points were genuinely restored to the requirement text.

---

## Part 1 — closure ledger for the prior pass's 23 findings and 6 minors

Re-derived from the current file. "Closed" means the defect is absent from the
current text, not that a commit says it was fixed.

| # | Prior finding | Status | Evidence in the current file |
|---|---|---|---|
| Q1 | `last_assistant_message` available; P0-3's stated blindness false | **Closed** | §4 carries the field on `Stop`/`SubagentStop` and its `StopFailure` meaning; P0-3 states the recognition test; §2's deferral row now excludes *"the final message of the turn that just ended"*; AC-12 tests it. New residual is **F2** — the gate it became. |
| Q2 | §3's "unchanged" false in eleven rows | **Closed for those eleven; reopened in eight others, one a regression** | Ten moved to the narrowed table, C-3's clause restored. Eight further rows are not unchanged, and **FR-X5 was moved *out* of the narrowed table** (**F3**). |
| Q3 | Six source keys dropped while their requirements stayed in force | **Closed as membership; the confirmation column is wrong in five of six** | `[COVERITY-10]`, `[HERZIG-13]`, `[CHI-25]`, `[JOHNSON-13]`, `[OWASP-SM]`/`[LLM02]`, `[ASI-26]` are all in §4. Five of their *"Carried from v1 `:n`"* pointers resolve to a different source (**F4**). |
| Q4 | Resume replays past whispers; compaction inverts dedup | **Closed for the delivered-set; the read set and the budget are not** | §4 records both facts; FR-O1 gives `source` a job; AC-26 tests resume and compact; NF-2 includes the replay. FR-A4's *other* set is unhandled on resume and the budget inherits the prior session's spend (**F6**); `"fork"` and `"clear"` get nothing (**F7**). |
| Q5 | Subagent events land in the silence-rate denominator | **Closed for that component; the decomposition is still not one** | FR-O6, P0-4 and AC-23 record the undeliverable component and AC-2 is scoped to deliverable events. Four other suppressors remain merged into "below the bar" (**F5**). |
| Q6 | Orientation promised entry points "for the task" with no mechanism | **Closed** | §7 says *"structural"*; P0-D-17 states the lexical mechanism; §2's arm table records the narrowing; AC-9 carries the negative case. Residual is where the marginal value lives (**F8**). |
| Q7 | `materiality` constant ⇒ fixed genre precedence inside the bar | **Closed as stated; relocated one term over** | FR-A5: *"all base weights are equal and decision-impact reduces to structural weight"*; P0-D-18 gives the reason; §7's sentence corrected. `structural_weight` is now the sole carrier and is undefined here (**F12**). |
| Q8 | FR-X6's audit trail had no reader | **Closed** | §12 provides `ctxoracle log`; P0-D-21 states why; AC-30 reads back every whisper with evidence, pointer and token count. |
| Q9 | Historical-breakage arm deferred on evidence Phase 0 does not collect | **Partially closed** | The internal contradiction is gone: the return moved to Phase 2 and the blocker to FR-L3, also Phase 2. The substituted reason — *"P0-5's floor is defined over co-change pairs, not over the pair-to-test join"* — is falsified by the row's own first sentence (**F9**). |
| Q10 | §2's exclusion table gives one reason for seven items | **Neither applied nor adjudicated** | The row is byte-identical to the text the prior pass quoted (**F5b**, carried as its own finding). |
| Q11 | Suggestion-grade floor dropped v1's confidence conjunct | **Closed** | P0-5: *"never below support ≥ 2 together with a configured confidence threshold — both dimensions"*; AC-4 carries the negative case. |
| Q12 | P0-D-8 attributed precision 0.30 to the wrong operating point | **Closed** | The figure is deleted from P0-D-8; P0-5's correct statement carries it. |
| Q13 | Mandatory false-fire clause vs the no-imperative criterion | **Closed** | FR-D3's clause is declarative; AC-7 requires *"no imperative construction"*; AC-31 makes it universal. |
| Q14 | FR-D3's clause had no Phase 0 listener and no consumer | **Closed in the requirement; not in §3** | FR-D3 names the CLI receiver and FR-L3/Phase 2; P0-D-24 records it. Q14's second half — *"then §3's 'unchanged' becomes a narrowing"* — was not done, and FR-D3 is still filed unchanged (**F3**, Group A). |
| Q15 | FR-X5 absolute vs C-4's settings write | **Closed** | FR-X5 names the single write exception and P8; AC-15 says *"beyond the settings file"*. |
| Q16 | §2's subagent-delivery Reason cell held no reason (third pass) | **Closed** | The cell now states the contract fact, that the events arrive, and what Phase 1 adds. |
| Q17 | No universal whisper well-formedness criterion | **Closed** | AC-31. |
| Q18 | F10 — no announcement when the oracle self-suppresses (third pass) | **Closed** | FR-M2's suppressing-condition clause and P0-D-22. Its enumeration omits one suppressor (**F5**). |
| Q19 | FR-X2's harness-mechanical justification misread the source | **Closed** | FR-X2 grounds on `[OWASP-PI]` with the harness as a second reason correctly scoped; P0-D-19 states it. |
| Q20 | §2's answer-drift reason misidentifies the producer | **Not applied** | The cell was reworded and still asserts *"the transcript reader writes the open questions"* (**F13b**, carried). |
| Q21 | C-1's re-verification pointed at documentation that lacks the fact | **Partially closed** | *"verifies it by execution on the target runtime"* + P0-D-25 closes the instruction half. v1's fallback obligation — *"the architecture must not be unable to fall back if it moves"* — is still absent (**m-carried**, see Minors). |
| Q22 | P0-3's per-session bound of 3 has no decision entry | **Not applied** | P0-D-23 justifies having a bound, never the value; P0-D-4's enumeration still omits it (**F14**). |
| Q23 | The exit run's relation to FR-A7's window is unstated | **Not applied** | §14's opening and AC-33 still say nothing; AC-21 states it for its own fixture (**F5**, and the remedy set is also incomplete). |
| M1 | AC-33 required a quantity P0-4 omits | **Closed** | P0-4 leads with *"the **whisper count**"*. |
| M2 | FR-A3 dropped *"orientation counts against it"* | **Closed** | Restored, and P0-D-4 ties it to the 400-token bound. |
| M3 | FR-X1/FR-M1 lost model-call clauses without record | **Closed for both; reopened at FR-X3** | Both are in the narrowed table. FR-X3's identical removal is filed unchanged (**m4**). |
| M4 | §14's FR-D4 inspection item stricter than FR-D4 | **Closed** | *"inspection confirms no human-notice path writes to the context-injection channel."* |
| M5 | `SubagentStart` unobserved and unexplained | **Closed** | FR-O1 states the reason. |
| M6 | §4 omitted the plugin-timeout caveat | **Closed** | §4 carries it and C-4's settings-file choice now rests on it. |

---

## Part 2 — new findings

### F1 — `PreToolUse` `additionalContext` is placed **next to the tool result**. The consequence genre and both ⚠ arms are specified to fire on a pending edit and are delivered after it has run. COLLAPSES.

**Decisions attacked:** §7's Consequence, Warning (generated) and Warning
(vendored) rows and the paragraph beneath them; §4's contract-fact bullet on
`PreToolUse`; §1's *"Every whisper … arrives at a decision moment"*; AC-7; AC-8.

**Mission sentence available:** the mission verbatim — *"deliver the fact that
would change the agent's next decision, **at the moment of that decision**."*
`RETHINK.md:166` names this exact moment: *"Edit / Write about to run | What is
about to change — **the golden moment, the last cheap point to alter course**."*

**The collapse question:** *§7 says three genres fire on a **pending** edit. Open
the 242,078-byte reference §4 attests to having downloaded and find where the
string a `PreToolUse` hook returns is placed in the conversation.*

Verified against current source this pass:

> The `additionalContext` field passes a string from your hook into Claude's
> context window. Claude Code wraps the string in a system reminder and inserts it
> into the conversation **at the point where the hook fired. Claude reads the
> reminder on the next model request**, but it doesn't appear as a chat message in
> the interface.
>
> Where the reminder appears depends on the event:
> …
> * **`PreToolUse`, `PostToolUse`, `PostToolUseFailure`, and `PostToolBatch`:
>   next to the tool result**
> * `UserPromptSubmit` … alongside the submitted prompt
> * `Stop` and `SubagentStop`: at the end of the turn
> — `code.claude.com/docs/en/hooks.md`, "Add context for Claude"

The `PreToolUse` hook *fires* before the tool runs — that is real, and it is what
lets the oracle compute against pre-edit state and the proposed `tool_input`. But
the model does not see the text until the next model request, and the text sits
next to the tool result. By then the write has happened. §4 already records the
half of this that suits the design (*"`PreToolUse` may inject context without a
permission decision"*) and not the half that decides whether the genre serves its
moment.

Four consequences:

1. **§1's whisper property is false for three of seven rows.** *"Every whisper
   carries a pointer, arrives at a decision moment, and blocks nothing"* — the
   third holds, the first holds, the second does not for consequence, generated
   and vendored.
2. **The ⚠ channel is the one the owner personally ruled on.** `[OWNER-3]`
   (`RETHINK.md:314–323`): every intervention, *"including generated-file
   protection, is a **loud warning whisper**."* The whole force of accepting a
   whisper instead of the one permitted hard block (`RETHINK.md:201–207`) is that
   it arrives in time to change the edit. FR-D3's own consequence sentence —
   *"Hand edits will be overwritten … the editable source is `src/schema.ts`"* —
   is written to be read *before* the hand edit exists.
3. **Consequence loses more than the warnings do.** A zone warning delivered after
   the write is still actionable (undo, re-target). *"Call-site count and spread
   for the thing being changed"* delivered after the write is a fact about a
   decision already committed to — and `RETHINK.md:166` calls that moment the
   *last cheap* point precisely because the next one is not cheap.
4. **AC-7 and AC-8 cannot see it.** Both assert that a whisper is *received*;
   neither asserts *when*, and no criterion in §14 does. The property the mission
   sentence turns on has no test.

The collapse log's entry from the round before, written about `[OWNER-12]`:
*"When an owner ruling names a moment, record the mechanism that recognises that
moment."* This is the same defect on the delivery side rather than the recognition
side — the mechanism reaches the right *event* and the wrong *moment*, and nothing
in the document distinguishes the two.

**Class: unverified.**
**Fix:** record the placement rule in §4 for all four event classes — it is one
list and it decides four of §7's rows. Then either state in §7 that Phase 0's
`PreToolUse` whispers reach the agent alongside the tool result and justify each of
the three genres on that basis (for the warnings, that undo is cheap; for
consequence, say why post-write is still worth a whisper), or move consequence to
`PostToolUse` where its delivery position is honest and its trigger row says so.
What may not stand is a genre table whose Fires-on column asserts a moment the
contract places elsewhere, in a document whose §4 attests to having read that
contract.

### F2 — P0-3 makes the completion-claim test the **only** gate on stop delivery, so verification and completeness are silent at every other stop. `[OWNER-12]` says in terms that the ruling is *not* a ranking of this moment against the others. COLLAPSES.

**Decisions attacked:** P0-3's first bullet; §7's Completeness and Verification
rows; §3's FR-A2 narrowing; §2's arm table.

**Mission sentence available:** `RETHINK.md:167` — *"Edit completed / session
stopping | The change so far | **Completeness** … **Verification**: 'the suite for
this region is `npm test -- settings`.'"* The moment named there is the session
stopping, not a claim about it.

**The collapse question:** *`[OWNER-12]` ruled that speaking at a completion claim
is a must-have. Read the last sentence of that ruling, then read P0-3's first
bullet, and say whether Phase 0 implemented the ruling or inverted it.*

`RETHINK.md:374–379`, verbatim:

> **The owner's ruling: keep it.** … A completion claim is one of the moments at
> which an unregistered conflict … becomes actionable. The ruling is that the
> capability stays and its turn cost is accepted. **It is *not* a ranking of this
> moment against the others.**

P0-3's first bullet: *"A stop-grade whisper fires only at a stop whose
`last_assistant_message` matches the completion-claim test."* Verification's only
trigger in §7 is `Stop`. So verification now speaks **only** when a lexical test
over the agent's closing sentence fires. Completeness keeps a `PostToolUse` arm and
loses its stop arm on the same condition.

Round 2 found `[OWNER-12]`'s accepted cost being spent at every turn boundary. The
remedy taken was a volume cap; round 3 correctly killed that and supplied
recognition. The remedy taken *this* round converts recognition into a gate — and
a ruling that a moment must be served became a rule that only that moment is
served. `RETHINK.md:386–389` names this failure class in the owner's own words:
*"agents keep collapsing a deliberately broad tool onto one purpose, and … doing so
guarantees what gets built is not the tool he asked for."*

Three further breaks:

1. **The narrowing is recorded nowhere.** §3 files FR-A2's narrowing as *"Six are
   built; six deferred per §2's table; six arms narrowed and one retained per §2's
   arm table."* A trigger moving from *stop* to *completion-claim stop* is not in
   §2's arm table and is not in §3. A builder reading §3 builds v1's trigger.
2. **The test has no content and its false negatives are unbounded.** P0-D-23
   reasons only about false positives — *"A lexical test still over-fires"* — and
   the cap addresses those. A false *negative* silences two genres for that stop,
   and P0-4's *"count of stops where the completion-claim test did not match"*
   cannot separate a correct non-match from a missed claim. P0-D-17 set the
   standard for exactly this case: *"a genre whose computation is left to the
   architect is an unfilled requirement wearing a reference."* P0-3 names the
   mechanism's *class* and leaves the discriminator unstated while making two
   genres depend on it entirely.
3. **§7 names the wrong exposure.** *"Verification is the genre most exposed to
   losing the stop"* — to competition with completeness. Its larger exposure is
   losing every stop the test does not match, which the paragraph does not mention
   and no criterion measures.

**Class: reduction** (an owner ruling that a moment counts, implemented as the
moment that counts).
**Fix:** decouple the two. `[OWNER-12]`'s capability is *that a completion claim
draws a whisper*; the ordinary bar plus FR-O4a's one-continuation bound is what
governs whether any other stop does. If the design intends to gate all stop
delivery on the claim test, that is a narrowing of FR-A2's trigger column and it
belongs in §3 and §2's arm table with its own reason — and the test's
discriminator belongs in P0-3, at P0-D-17's standard, with AC-12 given a
false-negative case.

### F3 — §3 now attests that it diffed every "unchanged" row against v1 **and against §13**. Eight rows fail that diff, three of them contradicted by this document's own decision records, and one is a regression out of the narrowed table. COLLAPSES.

**Decision attacked:** §3's opening — *"Two separate claims are made here and both
were checked: that the three sets partition v1's 65 exactly once, and that each
row's disposition is the right one — **the second by diffing every 'unchanged' row
against v1's text and against §13's decision records**."*

**The collapse question:** *The attestation names the exact check. Run it.*

I extracted every v1 requirement body by script and read each of the 27 declared
"unchanged" rows against it, and against §13.

**Group A — §3 says unchanged; this document's §13 says changed.** Unarguable: the
document contradicts itself between two of its own sections, which is the class §3
now claims to have swept for.

| Row | v1 | Phase 0 | This document's own record |
|---|---|---|---|
| **FR-D3** | *"an explicit false-fire clause **inviting correction in narration**"*; *"The false-fire clause is the feedback channel FR-L3 consumes"* | *"a **declarative** false-fire clause — a statement that the warning may be wrong and that `ctxoracle` records corrections, **not an instruction**"*; *"Its receiver in Phase 0 is **the CLI**"* | **P0-D-24**, in full: the clause is declarative and its Phase 0 receiver is the CLI |
| **FR-X5** | *"no network access **beyond the §6.2 model call**"* | *"**no network access at all**"* + *"The single write exception is `init`'s harness settings file"* | **P0-D-11** — and it was **in the narrowed table at `93de2c2`** with the narrowing spelled out |
| **FR-A4** | dedup + orientation decay | + delivered-set reseeded on `"resume"`, read set cleared on `"compact"` | **P0-D-20** |
| **NF-2** | *"total injected tokens per session within the FR-A3 budget; measured and reported"* | + *"On a resumed session the figure includes the harness's replay of prior injections"* | **P0-D-20** |

FR-X5 is the one to look at twice. It was **correctly filed as narrowed** in the
version this pass's predecessor reviewed, with the narrowing written out —
*"v1 permits network for the §6.2 model call; Phase 0 makes none, so the allowance
is removed and the constraint tightens to no network at all."* The rebuild deleted
that row and moved the requirement into "unchanged." A disposition table that can
lose a correct entry while being rewritten to close a finding about its entries is
not a device a builder can trust; it is a fourth thing to diff.

**Group B — clauses dropped with no record anywhere.**

| Row | What is gone | Why it is not bookkeeping |
|---|---|---|
| **FR-X4** | *"a learned record derived from repo text cannot acquire human **or mechanical** provenance"*, and *"**Whispers built on untrusted-origin records obey FR-X2/X3 exactly as live text does**"* | The second clause is the control the 2026-07-30 collapse log records as the fix for *"the injection defence didn't cover paraphrase"*. AC-17 covers the record half; nothing covers the whisper half. |
| **FR-X3** | *"never quoted into a whisper **or a judgment prompt**"* | Identical in kind to FR-X1's model-call removal, which §3 *does* record as a narrowing. Same edit, two dispositions. |
| **FR-K8** | *"per-repository (**keyed by repository identity**)"* | The clause with a known failure history — the 2026-07-30 expert review found *"six root commits on this repository, two contradictory selection rules, and shallow clones silently key a different store."* |
| **FR-M4** | *"a broken oracle degrades to silence in the agent's session (FR-O3) **while saying exactly what broke on its own channel**"* | The half that makes FR-M4 a positive obligation rather than a prohibition. |

(FR-K7 and FR-D2 also lose their v1 rationale sentences; those are genuinely
bookkeeping and are in Minors.)

Nine of the prior round's eleven carried a `[P0-D-n]`; four of these eight do. The
generator has not changed and the collapse log named it on the day this document
was rebuilt: *"For every whole-document attestation, write down the check that
would falsify the substantive claim and run that one."* This round the attestation
**names** that check and asserts it was run.

The round-3 expert review's S1 ended with the instruction that would have caught
all eight: *"Then re-derive the remaining 31 rows the same way."* Eight of its
named rows moved. The sentence after them did not.

**Class: unverified.**
**Fix:** move the eight into the narrowed table with their narrowing and its
location — Group A is mechanical, since §13 already contains the text. Then restore
FR-X4's whisper clause and FR-K8's repository-identity clause to the requirement
text, because those two are controls rather than citations. And replace §3's
attestation with the partition claim alone: the partition is checkable by script
and holds; the disposition claim is the one that has now been false in three
consecutive rounds, and asserting it in the document is what stops it being
re-derived.

### F4 — §4's confirmation column resolves to the wrong source in five of the six rows added to close Q3. COLLAPSES.

**Decision attacked:** §4's Confirmation column, and its closing attestation —
*"No source outside this table is cited by this document."*

**Mission sentence available:** none is needed; this is `CLAUDE.md`'s standard —
*"Every non-trivial new requirement carries a source annotation"* — and the
annotation's only value is that it resolves.

**The collapse question:** *Six rows were added to close last round's Q3, each with
a pointer of the form "Carried from v1 `:n`". Open v1 at each `n`.*

| §4 row | Cited | What is actually at that v1 line | |
|---|---|---|---|
| `[MSR-04]` | `:105` | `[MSR-04]` | ✓ |
| `[HH-04]` | `:104` | `[HH-04]` | ✓ |
| `[COVERITY-10]` | `:106` | **`[HERZIG-13]`** | ✗ (it is at `:102`) |
| `[HERZIG-13]` | `:107` | **`[CHI-25]`** | ✗ (it is at `:106`) |
| `[CHI-25]` | `:109` | **`[LLM02]`** | ✗ (it is at `:107`) |
| `[JOHNSON-13]` | `:110` | **`[ASI-26]`** | ✗ (it is at `:99`) |
| `[ASI-26]` | `:103` | **`[ROSE-05]`** | ✗ (it is at `:110`) |
| OWASP `[LLM01]`/`[LLM02]`/`[OWASP-PI]`/`[OWASP-SM]` | `:108`, `:111`, `:112` | LLM01 ✓, OWASP-PI ✓, OWASP-SM ✓ | `[LLM02]` (`:109`) uncited |
| `[NODE]` | `:113` | `[NODE]` | ✓ |

Five wrong, one incomplete, and the errors are not random — `[ASI-26]` points at
ROSE, `[JOHNSON-13]` points at ASI-26, `[CHI-25]` points at OWASP LLM02. They read
as written from a remembered ordering rather than resolved.

Why this is a collapse and not a typo class:

- **The pointer is the entire content of the row.** *"Carried from v1 `:n`"* is not
  a description of the source; it is the confirmation that the source exists where
  the document says it does. Five of them confirm the wrong thing, and the two rows
  a reader would most want to check — `[CHI-25]`, the *measured* result behind
  FR-O5's no-timers rule, and `[ASI-26]`, the only ground under threat T2 and
  FR-K6's trust label — are both wrong.
- **It is the fix for Q3, and Q3 was the fix for N4.** Three rounds, one section,
  three fixes, each verified along the axis that is cheap (is the key present?) and
  not along the axis it asserts (does the pointer resolve?). This is the collapse
  log's 2026-08-01 lesson verbatim: *"The mechanical proxy passing is not evidence;
  it is the reason nobody looked."*
- **The 2026-08-01 lesson about carried quotations applies directly.** *"Re-deriving
  a fact from source means opening the source, not copying the sentence a sibling
  document attributes to it."* Here the sentence was not even copied — only its
  address was, and wrongly.

**Class: unverified.**
**Fix:** resolve all nine pointers. `[COVERITY-10]` → `:102`, `[HERZIG-13]` →
`:106`, `[CHI-25]` → `:107`, `[JOHNSON-13]` → `:99`, `[ASI-26]` → `:110`, and add
`[LLM02]` → `:109`. Then, since v1 line numbers are a moving target across edits of
a sibling document, consider citing v1's **source key** rather than its line — the
key is stable and the line is not, and a pointer whose only failure mode is silent
is the wrong shape for a confirmation column.

### F5 — P0-4's "three-way silence decomposition" is not a decomposition: four further suppressors are all reported as "below the bar", and AC-33's remedy set requires exactly the distinction that is not reported. COLLAPSES.

**Decisions attacked:** P0-4; AC-2; AC-20; AC-33; FR-M2's suppressing-condition
list; §1's *"running it is the only way to obtain evidence about how often the
oracle should speak."*

**Mission sentence available:** §1's, above — this is the phase whose entire
justification is the number it produces.

**The collapse question:** *P0-4 reports silence as three components. A coupling
candidate exists, clears the bar, and is not delivered because FR-A4 says the agent
already read the file. Which component does it land in?*

None of the three. P0-4's decomposition is *"events with no candidate, events with
a candidate below the bar, and events on a consumer Phase 0 does not deliver to."*
At least four suppressors produce a candidate that is neither absent nor below the
bar:

- **FR-A4** — already seen, already told, or visibly incorporated; plus orientation
  decay. This is the mission's own relevance metric (`RETHINK.md:59–61`), and AC-3
  is the criterion for it.
- **FR-A6** — below the 200-transaction corpus floor or the 20-transaction region
  floor. AC-4 fixtures both.
- **FR-A7** — inside the first-3-sessions window. AC-13 fixtures it.
- **FR-A3** — the session token budget is spent. AC-28 fixtures it.

Every one of these has a criterion asserting that it silences. None has a reported
counter. So they are either miscounted as "below the bar" — the reading the
enumeration forces — or not counted at all.

Three things break on it:

1. **The bar cannot be tuned from a number that is not about the bar.** §1: Phase 1
   is tuned from this run. If FR-A6's floors and FR-A7's window are reported as
   below-bar events, Phase 1 lowers a bar that was never the binding constraint.
2. **AC-33's remedy set is unchoosable.** *"A run that produced none does not pass:
   it obligates re-setting **FR-A7's session count or FR-A6's floors** from that
   run's data."* Choosing between those two requires knowing which one suppressed
   — the counter that does not exist. And the remedy set omits the third
   possibility entirely: **the bar**, which FR-A5 says *"ships high"* and P0-D-16
   hands to the architect as a scalar. A zero-whisper exit run caused by a
   high bar is remedied by neither FR-A7 nor FR-A6, and AC-33 does not admit the
   case. This is also **Q23 unclosed** — §14 still never says which side of FR-A7's
   window the exit run is on, while AC-21 states it for its own fixture.
3. **FR-M2's push notice enumerates three suppressing conditions and omits the
   budget.** *"below FR-A6's corpus or region floor, inside FR-A7's first-sessions
   window, or every candidate below the bar."* An exhausted budget is the one
   suppressing condition that is *self-inflicted and recoverable*, and it is the
   one the owner is not told about. P0-D-22's own reason applies word for word:
   *"correct silence and a broken oracle are indistinguishable to the owner."*

Q5 established that a silence rate mixing structurally different causes *"is not
one number short of interpretable; it is not a measurement of the bar at all."* The
fix added the one component Q5 named.

**Class: wrong-check.**
**Fix:** report silence by suppressor — no candidate, dedup (FR-A4), corpus/region
floor (FR-A6), first-sessions window (FR-A7), budget exhausted (FR-A3), below the
bar, undeliverable consumer. That is the enumeration the criteria already assert
one by one; P0-4 is the only place it is missing. Add the budget to FR-M2's
suppressing-condition list. Then give AC-33 the third remedy (the bar) and one
sentence in §14 stating whether the exit run sits inside FR-A7's window.

### F5b — Q10 is unapplied: §2's exclusion table still gives one reason for seven items and it is false for at least two, contradicted by §2's own arm table four rows above. COLLAPSES (carried).

**Decision attacked:** §2's last exclusion row, verbatim and unchanged since
`93de2c2` — *"Distiller, learning loop, false-fire ladder, automated
landmine/invariant/recipe mining, self-report, export/import | Phase 2 | **Each
consumes measurements Phase 0 produces**."*

**The collapse question, unchanged:** *Name the measurement `ctxoracle export`
consumes.*

There is none. FR-K9 round-trips a store to a file; it consumes a store. Automated
landmine/invariant/recipe mining consumes git history — and §2's **own arm table**,
four rows up, says so in the reason column of three separate arms: *"requires the
exemplar registry (FR-K3), which has no Phase 0 writer at all"*, *"Phase 2 mining,
or an owner-entered landmine."* P0-1 states it a section later: *"FR-L6 promotion
is Phase 0's only writer."* One table's reason is contradicted by the other table's
reason for the same items, in the same section, at a distance of four rows.

I am recording this as a finding rather than a ledger line because the text is
byte-identical to the text the prior pass quoted, and because `CLAUDE.md` is
explicit: *"When a review surfaces findings, apply **all** of them. Do not propose a
prioritized subset unless the user explicitly asks."* Nothing in §13 records a
rejection. Four items are in this position after this round — Q10, Q20, Q22, Q23 —
and a hunt whose findings can be silently declined is a hunt with no closure
mechanism.

**Class: unverified.**
**Fix:** as the prior pass wrote it. Split the row: distiller, learning loop,
false-fire ladder and self-report do consume Phase 0 measurements; automated mining
consumes history and is blocked on a writer, which is the arm table's reason;
export/import consumes a store and gets its own reason plus a pointer to v1 §14's
open format decision.

### F6 — On resume, FR-A4's delivered-set is restored and its read set is not, and FR-A3's budget inherits the prior session's spend with no bound across successive resumes. PARTIAL.

**Decisions attacked:** FR-O1's `source` clause; FR-A4; FR-A3; NF-2; P0-D-20;
AC-26.

**Mission sentence available:** `RETHINK.md:59–61` — marginal value over the
agent's own abilities is the only relevance metric that matters — of which FR-A4 is
the implementation.

**The collapse question:** *FR-A4 rests on two sets: what the agent has been told,
and what it has read. P0-D-20 restores one of them on resume. Where does the other
one come from?*

It does not. `RETHINK.md:136–139` defines Tier 3 as *"What the agent has already
read (never tell it what it has seen) … which whispers were sent."* C-2 tears the
service down at `SessionEnd`; both sets die. FR-O1 reseeds the delivered-set from
the FR-X6 audit log on `"resume"` and says nothing about the read set. So a resumed
session re-delivers coupling and consequence facts about files the agent read
before the resume — and whose content the harness has just replayed into its
context. That is FR-A4's prohibition, in the same event the fix was written for,
against the other one of its two sets. P0-D-20's own framing — *"Session boundaries
are not context boundaries, and FR-A4 accounts for both"* — is the sentence that
makes this a finding rather than an omission: it claims completeness over exactly
the pair it half-covers.

**The budget half is worse, because it ratchets.** FR-O1: on `"resume"` the seeding
happens *"so FR-A4 and **FR-A3's budget** account for the harness's replay."* NF-2:
*"On a resumed session the figure includes the harness's replay of prior
injections."* So a resumed session starts with the prior session's spend already
charged against 2,000 tokens. Resume that session and the audit log now holds two
sessions' whispers. Nothing caps the accumulation, and the terminal state — a long
line of resumed work in which the oracle can never speak again — is:

- **not reported as a suppressing condition** (F5): FR-M2's list omits the budget;
- **indistinguishable in `status`** from a healthy session that spent its budget:
  P0-4 reports *"the session injected-token total against FR-A3's budget"*, which
  reads 2,000/2,000 either way;
- **the exact shape the collapse log killed in 2026-07-22**: *"the tool can
  converge to near-total silence and measure as healthy."*

Charging the replay is defensible — the tokens really are in the agent's context.
Charging it against a budget that never resets, without saying so, is not a
decision anyone made in writing.

**Class: wrong-check.**
**Fix:** state in FR-A4 or P0-D-20 what happens to the read set on `"resume"` —
either it is reconstructed (FR-L1's per-event log already records the candidates
considered) or it is not, and AC-26 gains the case. For the budget, state whether
the replayed tokens are charged against the resumed session's budget or accounted
separately in NF-2, and if charged, add budget exhaustion to FR-M2's
suppressing-condition list so the terminal state announces itself.

### F7 — `SessionStart.source` has five values; FR-O1 gives two of them a job. `"fork"` is the resume case with a flag — the contract's own sentence pairs them. PARTIAL.

**Decisions attacked:** FR-O1's `source` clause; P0-D-20; AC-26.

**The collapse question:** *§4 enumerates five values of `source`. FR-O1 handles
`"resume"` and `"compact"`. What does the oracle do on `"fork"`?*

Nothing is stated. From the same paragraph of the contract that supplies the
resume-replay fact P0-D-20 rests on:

> `SessionStart` hooks run again on resume with `source` set to `"resume"`, **or
> `"fork"` if you added `--fork-session`**, so they can refresh their context.
> — `code.claude.com/docs/en/hooks.md`, "Add context for Claude"

A fork inherits the parent session's transcript, including every whisper the oracle
sent into it, and starts with a fresh `session_id` and therefore no oracle state —
the precise condition P0-D-20 was written for, under a different value of the same
field, named in the same sentence of the same source.

`"clear"` is the mirror case and is safe **by accident**: the contract states that
`SessionEnd`'s budget *"applies to session exit, `/clear`, and switching sessions
via interactive `/resume`"*, so C-2's teardown fires and the next session starts
clean. That is the right behaviour and nothing in the document says why, so a
future change to C-2's teardown trigger silently breaks it.

This is the round's dominant generator once more: the fix was applied to the two
values the finding named, not to the field.

**Class: unverified.**
**Fix:** state FR-O1's behaviour for all five values in one place — `"startup"`
nothing, `"resume"` and `"fork"` seed the delivered-set, `"compact"` clears the read
set, `"clear"` needs nothing because C-2 has already torn down (and say that). Give
AC-26 the `"fork"` case; it is the same assertion it already makes for `"resume"`.

### F8 — Orientation's Phase 0 entry-point arm is a lexical match of the prompt's own terms against indexed names. `RETHINK.md` §2.3 is the marginal-value clause, and it names grep and glob as what the agent is already good at. PARTIAL.

**Decisions attacked:** §7's Orientation row; P0-D-17; AC-9; AC-3.

**Mission sentence available:** `RETHINK.md:53–60`, quoted in full because it is
the clause FR-A5's third term implements:

> **2.3 — It competes with what agents are already good at.** Modern agents grep,
> glob, and read well. Handing them thousands of tokens of material they could
> surface themselves in three tool calls is noise that crowds out the signal. …
> **Marginal value over the agent's own abilities is the only relevance metric
> that matters.**

**The collapse question:** *The agent has just submitted the prompt. Name what an
orientation whisper tells it that its own `Glob` on the prompt's nouns would not.*

There is an answer, and the document does not give it. P0-D-17's mechanism is *"a
lexical match of the prompt's terms against indexed symbol, file and directory
names"* — which is what `Glob`/`Grep` on the prompt's nouns does, at a cost of one
tool call. What the oracle adds is the two things the mechanism sentence mentions
only in passing: the **entry-point classification** (the index knows which of the
matched names are entry points; a name match does not) and the **structural-weight
ranking**. Those are Tier 2 facts a cold grep does not produce, and they are the
whole marginal value of the arm.

Why this is a finding rather than a quibble:

- **v1's P5 is in force unchanged** (§3, principles) — *"The oracle does not say
  what the agent can trivially discover with its own tools."* Nothing in §7,
  P0-D-17 or AC-9 says which part of the arm survives P5.
- **AC-9's positive case is satisfied by the name match alone.** *"A submitted
  prompt whose terms lexically match indexed entry-point names yields an
  orientation whisper naming 2–4 of them."* An implementation that ranks by raw
  string-match score and ignores structural weight passes AC-9.
- **AC-3, the marginal-value criterion, never exercises orientation.** It tests the
  read set — *"where the fact is already in the consumer's read set the oracle stays
  silent"* — and at `UserPromptSubmit` the read set is empty by construction. So
  the one genre that fires before the agent has done anything is the one genre the
  marginal-value criterion structurally cannot reach.

This is the "unfilled requirement wearing a reference" tell that P0-D-17 was itself
written to close, one level in: the reference now lands on a *computation*, and the
term that makes the computation worth performing is the one left implicit.

**Class: reduction.**
**Fix:** one clause in §7 or P0-D-17 stating that the arm's marginal value is the
entry-point classification and structural ranking, not the name match — and one
case in AC-9 or AC-3 that a prompt term matching a non-entry-point name of equal
lexical score does not displace an entry point. That is the difference between the
genre and a grep, and it is currently untested.

### F9 — §2's historical-breakage row is falsified by its own first sentence: P0-5's floor is defined over co-change pairs, and the pair-to-test join *is* a co-change pair. PARTIAL (Q9 carried).

**Decision attacked:** §2's arm table, historical-breakage row — *"**Not a
record-type gap** — it joins the co-change graph (FR-K2) against test topology
(FR-K1), both of which Phase 0 builds and populates. It is deferred because it is
warn-grade and **P0-5's floor is defined over co-change pairs, not over the
pair-to-test join; no floor for it exists**."*

**The collapse question:** *The row says the arm joins the co-change graph against
test topology. In that join, what is the edge between the source file and the test
file?*

A co-change pair. Test topology selects *which* pairs are interesting (the ones
whose partner is a test); it does not create a new evidence type. P0-5's floor —
*"A ⚠ whisper on history-derived evidence requires co-change support ≥ 3 **and**
confidence ≥ 0.9"* — is evaluated per pair and applies to this pair verbatim. So
the stated blocker, *"no floor for it exists,"* is false by the row's own
construction, and the completeness genre already ships on exactly that floor over
exactly that graph.

Q9's fix suggestion named the reason that would have held: *"If the real blocker is
that a breakage claim asserts causation where coupling asserts correlation, that is
a defensible reason and it is the one to write."* The rebuild fixed the row's
internal contradiction — the blocker and the return are both Phase 2 now, which was
the sharper half of Q9 — and substituted a different false reason for the true one.

`RETHINK.md:166` gives the whisper verbatim: *"Edits here historically break
`tests/settings.test.ts`."*

**Class: mechanism-not-mission.**
**Fix:** write the causation/correlation reason, or build the arm. What may not
stand is a deferral whose stated blocker the row's own first sentence removes.

### F10 — FR-A7 suppresses orientation's landmine arm for a project's first 3 sessions on a *confidence* criterion, and an owner-entered landmine is the highest-trust record class the store has. AC-22 states no window. PARTIAL.

**Decisions attacked:** FR-A7; P0-D-8; AC-13; AC-22; §2's *"it **ships silent until
the owner enters one**."*

**Mission sentence available:** FR-K6's trust label separates *"repository-derived
text from human-stated origin"*, and FR-L6 (`RETHINK.md:241–244`) is explicit:
*"no override ritual; the user saying it **is** the authority."*

**The collapse question:** *FR-A7 admits "only the highest-confidence candidates".
The owner types a landmine into the CLI on day one. Name a higher-confidence record
class in the Phase 0 store than a fact the owner stated himself.*

There is none, and FR-A7 excludes it. Its admitted set is the two zone warnings and
warn-grade coupling; AC-13 makes it explicit — *"an event that would otherwise draw
**orientation**, consequence, completeness or verification draws none."* So the one
arm in §7 that carries human provenance is silent in exactly the window in which a
new user, having just run `init` and been told the tool records what he says, would
enter one and look for it.

`[COVERITY-10]`'s ground cuts the other way here. P0-D-8's argument is that early
reports set credibility, so the loosest evidence must not be first. A fact the
owner himself asserted is not evidence the tool is asking him to trust — it is his
own sentence handed back at the moment it applies, which is the strongest first
impression the tool can make.

**And AC-22 cannot be run inside the window it does not name.** *"A landmine
statement entered through the CLI becomes a retrievable record carrying human
provenance, and a subsequent prompt matching its task shape draws an orientation
whisper naming it."* AC-21 explicitly states its own window (*"outside FR-A7's
first-sessions window and above FR-A6's floors"*); AC-22 does not, so the criterion
for the human-fact path is satisfiable only by an unstated assumption about the
fixture's session count — a criterion that will be argued with rather than run.

**Class: wrong-check** (a confidence gate applied by genre rather than by the trust
label the store already carries).
**Fix:** admit human-provenance records into FR-A7's set with the trust label as
the reason, and adjust AC-13's exclusion of orientation to *orientation's
entry-point arm*; or state in P0-D-8 why an owner-stated fact is withheld from the
owner for three sessions. Either way AC-22 needs its window stated, as AC-21's
does.

### F11 — Warning's landmine arm is dropped with a circular reason, and it is the arm that would deliver an owner-entered landmine at the edit that trips it. PARTIAL.

**Decision attacked:** §2's arm table, warning-landmine row — *"Dropped from §7's
content; v1 §14 additionally leaves this arm's phase unresolved."*

**The collapse question:** *§2 concedes that orientation's landmine arm "reads the
same owner-written FR-K4 records that warning's landmine arm would." Both arms have
their records, their writer (FR-L6 promotion) and their reader. Name what the
warning arm lacks.*

The reason given is that it was dropped from §7 — which is the thing being
justified. The second clause, *"v1 §14 additionally leaves this arm's phase
unresolved,"* is an observation that v1 has an open item; this document resolves v1
open items throughout §2 (it closes the subagent hook question in §4), so an
unresolved upstream phase is a reason to decide, not a reason to drop.

What is actually lost is the moment. `RETHINK.md:166` puts landmine-shaped facts at
the pending edit — *"the golden moment, the last cheap point to alter course"* —
and `RETHINK.md:121–124` describes landmines as *"places where changes historically
went wrong."* With the warning arm dropped, an owner-entered landmine can be spoken
only at prompt time, keyed to "task shape," and never at the edit that trips it.
That is a genre's moment traded for the genre's cheapest arm.

The usual obstacle does not apply: an owner-entered landmine's evidence is a human
statement, not history, so P0-5's floors do not bind it — the same argument P0-6
makes for zone markers, in the same sentence shape.

**Class: reduction.**
**Fix:** either build the arm (its records, writer, reader, floor disposition and
delivery format all already exist) or give the row a reason that is not its own
conclusion — and if the reason is F1's, that a `PreToolUse` whisper lands next to
the tool result, say so, because that reason is real and it applies to the two zone
arms too.

### F12 — `structural_weight` is now the sole carrier of decision-impact, and the only definition of it this project has ever recorded contains a genre factor. PARTIAL.

**Decisions attacked:** FR-A5; P0-D-18; P0-D-16; P0-D-15.

**The collapse question:** *P0-D-18 removes genre precedence from `materiality` by
making every base weight equal, so decision-impact reduces to `structural_weight`.
Define `structural_weight`.*

The document does not — FR-A5 says only that it *"is deterministic"*, and P0-D-16
assigns *"the score scheme's internals"* to the architect. The one place this
project has ever defined it is `docs/collapse-log.md`, 2026-07-22, recording the
architecture's fix: *"structural weight (**genre** × edit-vs-read × blast-radius ×
zone)."* That document is retained as *"input to Phase 1's architecture"*
(`CLAUDE.md`), so it is what a Phase 0 architect will read.

If `structural_weight` carries a genre factor, the genre precedence P0-D-18 removed
from `materiality` is live one term over, and P0-D-18's own conclusion — *"leave
ordering to evidence rather than to genre"* — is false. That is precisely the
relocation Q7 found in P0-D-15 (*"the decision entry written to avoid converting an
unsourced genre ranking into a build-time invariant resolves it into a build-time
invariant one layer down"*), applied to the term one place along.

The standing directive from the collapse log, 2026-08-01: *"no ranking claim about
this tool's purposes, genres, triggers or moments enters any document unless the
owner stated it in those words."* Equal base weights satisfy it. An undefined
second factor that the project's own archive defines with genre in it does not.

**Class: mechanism-not-mission.**
**Fix:** one clause in FR-A5 or P0-D-18 — `structural_weight` is computed from
per-candidate properties only (edit-vs-read, blast radius, zone) and carries no
genre term — with a pointer noting that the retained architecture's definition
includes one and is not inherited. AC-11's per-genre delivered counts remain the
right detector.

### F13 — Orientation's entire mechanism rests on `UserPromptSubmit`'s `prompt` field, which §4's contract-fact list and §12's consumed-input list both omit. PARTIAL.

**Decisions attacked:** §4's contract-fact bullets; §12's *"Consumed"* list.

**The collapse question:** *§12 names three harness inputs explicitly —
`last_assistant_message`, `SessionStart`'s `source`, and "the inputs identifying the
session, the tool call and the consumer." Orientation matches "the prompt's terms."
Where does the prompt come from?*

From a field neither section names. Verified this pass:

> In addition to the common input fields, **`UserPromptSubmit` hooks receive the
> `prompt` field containing the text the user submitted.**
> — `code.claude.com/docs/en/hooks.md`, UserPromptSubmit input

The fact is true and available, so this is a bookkeeping defect rather than a false
premise — but it is bookkeeping in the one section whose job is to make every
contract dependency checkable, and it is the *only* contract dependency of the only
genre that fires before the agent acts. §4 records the `prompt` field's *sibling*
(*"`UserPromptSubmit` accepts it too"*, of `additionalContext`) and not the field
the genre reads. C-5 makes the contract re-verified at implementation and shims
degrade to silence on drift; a dependency absent from §4 is a dependency nobody
re-verifies.

**Class: unverified.**
**Fix:** one bullet in §4 and one clause in §12's consumed list. While there,
`PreToolUse`'s `tool_input` and `PostToolUse`'s tool result are in the same
position behind §12's *"the tool call"* — name them, since three genres read them.

### F13b — §2's answer-drift reason still misidentifies the producer. PARTIAL (Q20 carried).

**Decision attacked:** §2's exclusion row — *"Answer drift (FR-A9) | Phase 1 |
Requires tracking a user question across successive turns; **the transcript reader
writes the open questions**, not the single last message P0-3 reads."*

v1 FR-A9: *"**Direct user questions** are tracked as open items in Tier 3."* A
direct user question arrives in the user's prompt. Phase 0 observes
`UserPromptSubmit` (FR-O1) and the harness supplies the `prompt` field (**F13**).
So the open questions are written by an event Phase 0 already handles. The first
half of the new cell is true and sufficient; the second half repeats the false
claim the prior pass identified, in a cell that was rewritten to fix it.

The deferral is almost certainly right — deciding whether a turn *addressed* a
question is judgment work. Recording the wrong blocker is how a genre gets
re-deferred in Phase 1 for a reason that was never true.

**Class: unverified.**
**Fix:** as Q20 wrote it — *"answer drift's open questions are observable in Phase
0 from `UserPromptSubmit`, but deciding whether a turn addressed one requires model
judgment."*

### F14 — P0-3's per-session bound of 3 is still a number with no entry, and P0-D-4's enumeration of "which stated values are this document's" is incomplete. PARTIAL (Q22 carried).

**Decisions attacked:** P0-3's third bullet; `[P0-D-4]`; `[P0-D-23]`.

P0-D-23 now explains why a bound exists — *"A lexical test still over-fires"* —
and does not explain why the bound is three. P0-D-4's heading is a claim about the
whole document (*"**Which** stated values are v1's and which are this document's"*)
and its content is two items: FR-A6's floors and FR-A7's session count. The
stop-grade bound is in neither set, and P0-D-16 carves out only the bar's scalar.

`CLAUDE.md`: *"Numbers without sources don't go in."* Q22's fix was one clause and
was not applied.

There is a second half now that Q22 did not have: P0-D-4 is itself a
whole-document attestation, and the collapse log's standing instruction is to treat
those as the first thing to verify. Beyond the stop bound it also omits AC-2's 10%
(covered separately by P0-D-14, so the *reader* is fine but the enumeration is
not), FR-K2's 30-entity cap and P0-5's 3/0.9 (both `[ROSE-05]`'s, and §4 carries
them — but P0-D-4 claims to sort the stated values and does not mention them).

**Class: unverified.**
**Fix:** add the stop bound to P0-D-4 as a judgment expected to move on §14's
exit-run data, which is what AC-33 already obligates for the other two, and either
complete P0-D-4's enumeration or narrow its heading to the values it actually
sorts.

---

## Minors

- **m1 — §2 and P0-4 disagree on where the undeliverable share is reported.** §2:
  *"P0-4 reports the undeliverable-event share **rather than folding it into the
  silence rate**."* P0-4 and AC-23: it is a labelled component **of** the silence
  decomposition. The behaviour is right in P0-4; §2's sentence describes a
  different one.
- **m2 — FR-K8 drops v1's *"keyed by repository identity"*.** The clause with the
  known failure history (2026-07-30 expert review: six root commits, two selection
  rules, shallow clones keying a different store). Filed unchanged; see **F3**.
- **m3 — FR-X4 drops the clause that whispers built on untrusted-origin records
  obey FR-X2/X3.** The control the collapse log records as the fix for the
  paraphrase-injection collapse. AC-17 covers the record half only.
- **m4 — FR-X3's model-call clause vanished without record while FR-X1's identical
  removal is in the narrowed table.** M3's inconsistency of treatment, one row
  over.
- **m5 — AC-6 drops v1 AC-4's *"and `deinit` restores it"*.** C-4 requires `deinit`
  to *"remove the wiring cleanly"* and no criterion asserts the settings file is
  restored, which is the half of the pristine-tree promise that outlives the
  session.
- **m6 — FR-K5 appears in no criterion's requirement list.** AC-30's body names the
  invariant schema; its parenthetical is *(P0-1, FR-K3, FR-X6, P0-D-21)*. The
  parentheticals are what a closure ledger indexes on.
- **m7 — three AC cross-references point at criteria that no longer say what the
  citing sentence claims.** §2:91 — the landmine arm *"ships silent until the owner
  enters one **(AC-27, AC-21)**"*: AC-27 is mining hygiene, AC-21 is zero ceremony;
  the intended pair is AC-30 and AC-22. §3:145 — *"P3 (zero ceremony) is carried as
  **AC-20**"*: AC-20 is the measurements criterion; zero ceremony is AC-21. §9:429 —
  FR-D3's declarative clause *"so FR-D2 and **AC-26** both hold"*: AC-26 is resume
  and compaction; the no-imperative criterion is AC-31. All three are consistent
  with criteria having been renumbered without re-resolving the in-body pointers.
- **m8 — three genres compete at `PreToolUse` and §7 states the competition rule
  for stop-class genres only.** A pending edit in a generated zone can produce a
  warning candidate and a consequence candidate at one event; FR-A3 permits one;
  P0-D-15 deleted the warning-priority clause and P0-D-18 equalised the base
  weights, so the ⚠ channel is displaceable at its own event. That may be the right
  design, but §7 names only verification's exposure, and the ⚠ channel is the one
  `[OWNER-3]` ruled must carry generated-file protection.
- **m9 — C-3's citation supports half its claim.** `RETHINK.md:291–292` reads
  *"Thin hook shims: forward harness events to the daemon; relay whispers back as
  injected context. Shims contain no logic."* The harness-neutral event contract is
  not in those lines (v1's C-3 cites `[RETHINK §11]`, the whole sketch). Raised as
  the round-3 expert review's m1; the clause was restored and the citation was not.
- **m10 — §4 declares an upstream open question settled and the upstream document
  still lists it open.** *"This also settles v1 §14's open question about subagent
  hook firing"* — v1 §14 still carries *"Subagent hook contract (FR-O6, AC-21):
  whether tool hooks fire inside subagent contexts"* as unresolved, while §2's
  Unknown-genre row treats v1 §14 as authoritative for a different item.
  `CLAUDE.md`: *"Keep documents in sync."*
- **carried — Q21's fallback obligation.** C-1 now verifies FTS5 by execution
  (correct), and v1's *"the architecture must not be unable to fall back if it
  moves"* is still absent. It is the falsifiable half: it tells an architect what to
  do on the day the build-config fact changes, which AC-32 detects only after the
  architecture rests on it.
- **carried — FR-K7 and FR-D2 lose their v1 rationale sentences** (`[ROSE-05]`'s
  decay result; *"keeps the agent the decision-maker"* and the `[LLM01]`
  injection-defence framing). Genuine bookkeeping, listed so **F3**'s row list is
  complete rather than selective.

---

## Self-serving check (mandatory — the inclusive direction has nothing watching it)

Collapse log 2026-08-01, lesson 10: *"after a run of kills the authoring instinct
learns that inclusive proposals survive — every safeguard here points at exclusion,
so an inclusive error has nothing watching for it."* This pass against itself:

- **F3, F4, F5b, F7, F13, F13b, F14 and all twelve minors cost nothing but
  accuracy.** Each says the document states something about itself, its sources or
  its terms that is not so. None adds capability. Apply without argument. F4 in
  particular is nine line-number lookups.
- **F5, F6, F9, F12 are statements or counters over things already required.** F12
  and F9 are one clause each. F5 and F6 add counters and one enumeration item; they
  cost implementation work and are the ones to argue about. Neither proposes a new
  requirement.
- **F2 is the finding most likely to be read as additive and is not.** Decoupling
  stop delivery from the claim test does not add a genre; it restores v1's trigger
  for two genres the document already builds. The *cheaper* form — keep the gate,
  record it as a narrowing in §3 and §2, state the test's discriminator — closes the
  finding at zero capability cost and is the honest minimum. I state it because
  `[OWNER-12]` must not be reopened in either direction: the capability stays; what
  is at issue is whether it became an exclusion.
- **F1 can shrink Phase 0 or grow it, and I have priced both.** Recording the
  placement rule and re-justifying the three genres on post-write delivery is *no*
  capability and closes the finding. Moving consequence to `PostToolUse` is a
  simplification. Neither adds anything. I flag this explicitly because F1 is the
  heaviest finding and the direction nothing watches.
- **F10 and F11 are the two findings that would make Phase 0 larger**, and I state
  their cheaper forms as the alternatives rather than burying them: F10 closes
  equally well by stating in P0-D-8 why an owner-stated fact waits three sessions;
  F11 closes equally well by writing a non-circular reason for the deferral. Both
  cheaper forms run against this pass's own direction and are the ones to take if
  the substantive argument does not land.
- **F8 argues for *less*, not more** — it says the entry-point arm's marginal value
  is narrower than §7 implies. Priced here so it is visible as the exception.
- **Nothing in this pass proposes a new requirement, a new genre or a new document.**
  Q10, Q20, Q22 and Q23 are carried forward unchanged rather than re-argued.

---

## The single most dangerous unexamined assumption

**That a contract is verified by checking what it provides.**

Round 2's assumption was that the devices installed to stop the document lying
about itself were not themselves claims. Round 3's was that string-matching a
quotation verifies the contract — corrected, and the correction worked: §4 now
carries the three fields whose absence was assumed, and its hardest claim (that
`last_assistant_message` means something different on `StopFailure`) is exactly
right.

What replaced it is one layer out again. Every contract fact §4 records is a fact
about an **input** — what the harness hands the hook. Not one is a fact about the
**output** — what the harness does with the value the hook returns. And the
document's genre table is a set of claims about output placement: seven rows whose
"Fires on" column asserts a moment. Three of them are wrong, and the sentence that
settles all seven is a five-line list in the same section §4 quotes twice (**F1**).

The generalisation, and it is the same shape as the last two rounds: **a source is
verified only along the axis the question was asked on.** Round 2 asked "does this
string exist?" Round 3 asked "does this field exist?" Neither asked "what happens
to what we send?"

**What would test it, and is writable today:** §4's contract-fact list is currently
organised by event. Organise it by direction instead — *what the harness gives us*
and *what the harness does with what we give it* — and require the second list to
be non-empty for every channel §7 uses. A whisper's moment is a property of the
second list, and the mission sentence is about the moment. As of this round, the
second list has one entry (`Stop`'s continuation semantics) and it is there only
because `[OWNER-12]` forced it.

Secondarily, and cheaply: **four of the prior round's findings were neither applied
nor adjudicated**, and one of them (Q10) is byte-identical text. `CLAUDE.md`
requires all findings applied. Whatever mechanism produced the round-3 rebuild
tracked the findings it acted on and did not track the ones it did not; a closure
ledger that only lists closures is the next round's first finding, every round.

---

## Method note

Premises re-derived from primary source in this pass, not inherited from the prior
review, the round-3 expert review, or commit messages:

- **Claude Code hooks contract** — `code.claude.com/docs/en/hooks.md` fetched
  2026-08-01, HTTP 200, **242,078 bytes** (byte-identical to §4's attested figure),
  plus `hooks-guide.md` (62,452 bytes). Every quotation in §4 string-matched: the
  `Stop`/`StopFailure` descriptions, `last_assistant_message` on both stop events
  and its `StopFailure` meaning (read in the full field table, not just the
  sentence), `additionalContext` for *"non-error feedback that continues the
  conversation"*, the `PreToolUse` exit-0 sentence and *"staying silent doesn't
  approve it"* (matches modulo sentence-initial capitalisation), `PostToolUse`'s
  *"String added to Claude's context alongside the tool result"*, subagent hook
  firing with `agent_id`/`agent_type`, the resume-replay sentence, `SessionStart`'s
  five `source` values, the per-handler timeout defaults (600/30/60 with
  `UserPromptSubmit`'s lowering), the `SessionEnd` 1.5-second budget with its
  raise-to-60 s clause and the plugin caveat, and the prompt-injection-defence
  sentence. All verbatim. **Additionally read and not in the document**: the
  `additionalContext` placement list — *"next to the tool result"* for `PreToolUse`
  (**F1**); `UserPromptSubmit`'s `prompt` field (**F13**); *"`SessionStart` hooks
  run again on resume with `source` set to `"resume"`, or `"fork"` if you added
  `--fork-session`"* (**F7**); that the `SessionEnd` budget *"applies to session
  exit, `/clear`, and switching sessions via interactive `/resume`"* (**F7**); the
  10,000-character output cap (no finding — FR-A3's whole-session budget is below
  it); *"the transcript file isn't guaranteed to include the final message at Stop
  time on all versions"* (no finding — P0-3 uses the field, which is the behaviour
  that sentence recommends).
- **ROSE (TSE 31(6), 2005)** — the direct author URL now serves a JavaScript
  lander; Semantic Scholar's PDF under this paper's corpus ID is a 9-page **lecture
  slide deck**; the Kent State copy is the 6-page ICSE 2004 short version, against
  which nine of the twelve quoted strings fail. The correct 17-page TSE PDF was
  retrieved through `web.archive.org` from the author's copy. `file(1)` reports it
  as 10 pages — the discrepancy the collapse log records, reproduced. All twelve
  quoted strings matched verbatim with `pypdf`, each read in its surrounding
  paragraph: the 30-entity cap, the stale-history sentence, the 0.9/3 warn
  operating point, *"The average precision is above 66 percent"*, *"Only 2 percent
  of all transactions cause a false alarm"* (confirmed to sit in §7.6 Closure, as
  P0-5 says), the 3%-feedback/75%-recall pair and its *"one out of every 33 missing
  items"* gloss (the paper's own words), the *"However, for those cases…"* clause,
  *"a feedback of 0.64 and a precision of 0.30"* (confirmed at support 1 and
  confidence 0.1, as P0-5 says and P0-D-8 no longer contradicts), and both Fig. 6
  sentences.
- **v1 identifier set and §3's partition** — every `FR-*`/`NF-*`/`C-*` definition
  line extracted from `spec-context-oracle.md` by script: **65, no duplicates**,
  distributed 7 FR-O / 9 FR-K / 9 FR-A / 5 FR-D / 5 FR-J / 3 FR-S / 7 FR-L /
  4 FR-M / 8 FR-X / 3 NF / 5 C. §3's three sets (27 + 21 + 17) confirmed to
  partition it exactly, with zero overlap. Every one of the 27 "unchanged" rows was
  then read clause by clause against its v1 text and against §13 (**F3**).
- **v1 source-table line numbers** — v1 lines 96–115 read directly; each of §4's
  nine *"Carried from v1 `:n`"* pointers resolved against that reading (**F4**).
- **Identifier minting and criterion indexing** — every
  `FR-*`/`NF-*`/`C-*`/`P0-*`/`AC-*`/`P0-D-*` token in the Phase 0 spec extracted
  programmatically: no `FR-*`, `NF-*` or `C-*` minted; `AC-1`–`AC-33` and
  `P0-D-1`–`P0-D-25` each defined once and each referenced; every in-force
  requirement named in at least one criterion parenthetical except FR-D4 (covered
  by §14's inspection block) and FR-K5 (**m6**). Every in-body `AC-n` reference
  before §14 was resolved against the criterion it names (**m7**).
- **`RETHINK.md` citations** — all twenty long-form and six short-form line ranges
  cited by the Phase 0 spec read against current source (399 lines). All resolve to
  text supporting their claim, with the scoping caveat at C-3 (**m9**).
- **Prior-version comparison** — §3 at `93de2c2` extracted with `git show` and
  diffed against the current §3 to establish the FR-X5 regression (**F3**), rather
  than inferring it from the prior review's ledger.
