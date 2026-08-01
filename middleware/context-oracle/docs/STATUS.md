# Context Oracle — status

*Plain-language project status, updated at the end of every working
session. Newest entry first.*

## 2026-08-01 — two inherited premises came apart; no genres are being cut

**Where the project is.** Still design phase, no code. Nothing was built this
session. What changed is that three things every recent session had been treating
as settled turned out not to be, and the next step moved because of it.

**What you corrected, and what it cost.** `RETHINK.md` recorded your ruling that
the oracle should speak when an agent claims it's done. Around your actual words,
an agent had written that this is *"the single highest-value moment the oracle
has"* and *"the core problem the tool exists to solve."* Neither is yours. By the
time you caught it, it had spread to the spec, into the collapse log, into a
review pass that quoted it back as the standard it was reviewing against, and
into this session, where it was the argument for a decision about what the first
buildable version contains. All fixed, your words preserved, with a standing rule
now written down: no ranking claim about this tool's purposes or genres enters any
document unless you said it in those words. The lesson is that a superlative
placed in a *rationale* survives review, because reviewers check decisions against
sources and read rationale as prose. Four rounds read that line.

**Phase 0 is not degraded mode.** Degraded mode is what the tool does when it
can't reach the model at runtime. Phase 0 is the stage where that half isn't
built yet. The spec had fused them — and then put the test that verifies degraded
mode in Phase 2, which is the contradiction that gives it away. This matters
practically: as written, the first running version would have raised its own bar
to compensate for a model that was never meant to be there, announced "degraded
mode" to you when nothing had degraded, and produced its measurements against a
handicapped setting — and those measurements are what every later phase is tuned
from.

**A proposal was tried and killed.** The idea recorded here on 2026-07-31 —
narrow the first version to two genres — was worked out properly, came out as
three, and was then destroyed by the independent adversarial pass, which returned
fourteen findings. It was the reduction pattern again: every argument for cutting
a genre was really an argument that its content isn't worth saying, and *that is
the confidence bar's job*, computed per whisper and tunable from data. Deciding it
in the build plan makes it permanent and unmeasurable. Two of the three cuts also
rested on premises that were false or incomplete — one of them an error this file
had already caught and corrected a day earlier. **No genre is being cut.** The
mechanism worked as designed here: the hunt caught it, not you.

**A second proposal was tried and killed, and it found something bigger.** You
asked what the purpose of Phase 0 is. The honest answer was that the spec states
the phase *dependency* — each phase is gated on evidence only the previous one can
produce by running — but never a rule deciding what belongs in a phase. A rule was
drafted and written into the spec; the independent pass returned **seventeen
findings** and it was removed the same day
(`docs/reviews/2026-08-01-collapse-hunt-phase0-purpose.md`).

**A third attempt was also killed.** I then wrote a separate Phase 0 spec, on the
reasoning that your 07-31 question — *"3 phases in one spec. WHY?"* — had only ever
been half-answered. The hunt asked the one question that settles it: *name the file
from which a Phase 1 requirement was removed.* None. The problem you found was that
Phases 1 and 2 were being **specified against nothing**; writing Phase 0 out again
in a second file does not touch that, and creates a second place where
requirements live. Nineteen findings. The file is deleted, and the real remedy
turns out to be the one already written here on 07-31 — tag each requirement in
the spec with the phase it belongs to.

**A correction I owe you on the last thing I told you.** I reported that Phase 1 is
gated on a Phase 2 component and called it the session's real finding. That was
overstated, and I got it the same way as the other two: by reading one section and
not the two that answer it. §9.2 does say the distiller measures the metrics — but
§6.3 gives `ctxoracle status` the *"health metrics §9.2"*, NF-2 says overhead is
*"measured and reported by `ctxoracle status`"*, and `status` is Phase 0. The spec
contradicts itself about who computes them; it does not straightforwardly gate
Phase 1 on Phase 2. What is genuinely unassigned is narrower: recording whether a
whisper was acted on. That is real, and it is still step 1 — but it is a smaller
thing than I told you.

**The measurement question is half-answered, and the spec now says which half.**
Reading §9.2, §6.3, NF-2 and FR-L1 together settled the part that was a
misattribution: FR-L1 gives the per-event log — *"candidates considered, whisper
sent, and subsequent evidence of uptake"* — to the session service, which is a
Phase 0 component. §9.2's "measured by the distiller" was too broad, and it is
corrected. Recording, computing and learning are three jobs and only the third is
Phase 2. **Phase 0 emits silence rate, latency and continuation count.**

**Hit rate is still not established, and that is the live blocker.** FR-L1 records
*evidence* of uptake; the architecture assigns *detection* of uptake to the
distiller, and the store column for it is nullable — the shape of something
written later. Recording that a file was opened is Phase 0; deciding that opening
it counts as uptake of a particular whisper is a join, and the two documents put
that join in different phases. Phase 1's exit is gated on hit rate, so this is
what that exit currently rests on.

A phase table for every requirement was also written this session and removed:
its "verified by" column was wrong in twelve of forty-one rows, including the one
row the whole change existed to establish. The idea is right and still owed; that
execution asserted verification that does not exist, which is the thing this
project treats as worse than no work at all.

**One route to hit rate is now closed, on the substance.** The obvious move is to
say Phase 0 already has the detector, because FR-A4 forbids repeating what the
agent has *"visibly acted on"*. It doesn't work, and it's worth knowing why: that
phrase resolves to *"opened the pointed file, used the named helper"* — which is
exactly the test the design **threw out**, because it scores the tool's best
outcome as a failure. An agent told there's a second write-site, which then goes
and edits it directly, never opens the file the whisper pointed at. FR-A4 and
uptake share a key and a sentence and ask opposite questions: *has the agent
already got this* versus *did the agent take this*. This is written into §14 so
the next session doesn't spend a pass rediscovering it.

**I then overstated what was behind it, and the next pass caught me.** I reported
that Phase 1's exit states no pass condition and that every other phase exit
resolves to a testable criterion. Both wrong. Phase 1's exit lists seven criteria,
and *all three* phases end with the same kind of unmeasured trailing sentence —
Phase 0's is "the owner runs it on a real project without incident." I described
something all three do as a fault in one, without reading the other two. Same
mistake as earlier in the day, one screen away this time.

**And then I overstated the *replacement* finding too, and a seventh pass settled
it.** I said the spec and the project's build rule disagreed about that sentence —
entry gate or exit gate — and made it step 1. They don't disagree. The spec's own
"how to read" paragraph says both things: exit clauses are measurements, *and* a
phase's design-readiness runs through the measurements its own exit names. The
build rule was quoting the second half. What made them look like they conflicted
was that the build rule carried a full copy of the spec's sentence plus a claim
that Phase 0 produces both numbers — and that copy went stale when hit rate's
producibility became doubtful. **The whole thing was one duplicated sentence.** It
is now a pointer, four words shorter, and the spec is untouched.

That was worth ten minutes, not a step 1 — the pass that settled it said so, and
it was right. Two real defects did surface on the way, and they are in §14: the
spec's design-readiness rule is unsatisfiable at Phase 2 (it would require Phase 2
to have already run), and **nobody ever reviews Phase 0's numbers** — its exit
names a run but no measurement and no review, while the metrics start being
emitted the moment it runs.

**The list below was five steps and is now one.** A pass asked which of the open
items the spec has to answer and which belong to the architect — a question nobody
had asked — and most of what I had queued turned out not to gate anything. Settling
uptake detection is a *Phase 1* question, and the build rule forbids resolving
Phase 1 before Phase 0 has run; the phase table is owed but gates nothing; and the
bar finding (R4-4) is an architecture matter whose Phase 0 premise disappears once
the degraded-mode sentence below is fixed. Steps 4 and 5 were the real work, and
they merge.

**What is next, concretely:**

1. **One edit to the spec's build section, then the Phase 0 architecture.** The
   edit: say directly which genres Phase 0 builds instead of pointing at the
   degraded-mode list; delete the sentence saying Phase 0 *is* degraded mode; give
   degraded mode itself a phase (it has none, and your decision 2 makes it a
   promise); add the command-line tool to Phase 0's parts, since two of Phase 0's
   own exit tests require it; and fix one sentence whose wording makes the
   generated-file warning impossible to ever fire. Nothing is dropped from the
   tool. The adversarial pass on that edit is running now, before it is written.

2. **Then `docs/architecture-context-oracle-phase0.md`** — the first design
   document for the first buildable phase. That is the next artifact, and after
   today it is the first time the path to it has been clear.

**Deferred, with the reason** (these were steps 1–3 and gate nothing): where
uptake detection lives — Phase 1, per the build rule; the per-requirement phase
table — owed, and its real product is the acceptance-criteria gap already in §14;
finding R4-4 — an input to the new architecture, not a prerequisite.

*(For the record, the items below this line were the previous next-steps list:)*

1. **Settle where uptake detection lives**, knowing the FR-A4 route is closed:
   either the distiller keeps it and Phase 0 reports a *pointer-followed rate*
   under its own honest name, or detection moves and the cost of moving it is
   stated. Not a naming question — the two measure different things.
3. **Rebuild the per-requirement phase table** (the 07-31 step, still owed), with
   the "verified by" column built mechanically from §13 and `— none` written
   wherever a requirement has no criterion. That is the true answer for FR-L1,
   FR-X6, FR-O1, FR-K1, NF-2 and four of the five constraints.
2. **Fix the bar (finding R4-4).** The tool's measure of whether a fact is worth
   saying has three terms, and one of them — how easily the agent could have got
   the fact itself — is deleted in exactly the mode Phase 0 was set to run in.
   Restore it.
3. **Separate Phase 0 from degraded mode in the spec**, and give FR-J3's
   air-gap guarantee a phase of its own — it is a real promise (your decision 2)
   and currently no phase builds it.
4. **Then** derive Phase 0's contents, settling the two contested memberships
   (consequence, answer drift) rather than assuming them; then the remaining
   Phase 0 findings, then the Phase 0 architecture, then review, plan, build, and
   **run it**.

**A process note that belongs to you, not to the work.** Three proposals were
written this session and two were killed by the adversarial pass — both times for
the same underlying reason, and the second time after this session had already
written down the lesson it then broke. The mechanism is doing its job: neither
kill came from you. But the honest reading is that writing into the spec *before*
dispatching the pass is what produced both, and the next session should dispatch
first.

**What is broken or unknown.** The 32 round-4 findings are still open; the twelve
Phase 0 ones are listed in the 2026-07-31 entry below and that triage still
stands. The architecture document is still not signed off and is not a base to
edit — Phase 0 gets its own document. Nothing has ever been run, so every number
the later phases depend on is still unmeasured.

**Nothing needed from you.**

*(I earlier offered you a ruling on `RETHINK.md` line 112 — *"the single
highest-value signal"* — arguing the no-superlatives rule reached rankings of
purposes but not of signals. Withdrawn: the rule bans *"the single highest-value
X"* in those exact words, the line sits in RETHINK §4, which is agent-authored
analysis rather than §12 where your decisions live, and no record attributes it to
you. So it was already decided and I should have applied the rule instead of
handing you the question. It changes no phase, genre or requirement either way.)*

## 2026-07-31 — the fix cycle is over; next is a Phase 0 requirement set

**Where the project is.** Still design phase, no code — and the architecture
document cannot be repaired by more rounds of fixing. The process's own
stop-signal fired. The cause is structural and sits above the architecture, in
how the spec and the build phases relate to each other.

**What is next, concretely.** Three steps, in order, before any more design work:

1. **Work out which requirements belong to Phase 0.** The spec has 57
   requirements and none says which build phase it belongs to. The answer is
   already derivable: §12 lists Phase 0's components, and each of the nine
   Phase 0 exit criteria names its own requirements. Write those tags into the
   spec, so the boundary is settled once, in the spec, and can be checked.
2. **Settle the contradictions that exercise turns up.** At least one exists
   already: exit criterion AC-2 belongs to Phase 0 but depends on the model
   judgment, which is Phase 1 and does not exist yet. Each is quick to settle
   once visible; none can be settled while invisible.
3. **Design the Phase 0 architecture. This is design work, not assembly.**
   *(Corrected 2026-07-31: this step previously said "assemble from the parts
   that already survived — those parts were attacked four times and held." That
   was false, and it was the justification for treating Phase 0 as nearly done.
   Round 3's own traversal table shows **four of Phase 0's five genres break**:
   orientation at retrieval, warning at the bar, completeness at delivery,
   verification at the bar and again at delivery. Only **coupling** survives end
   to end. The claim came from generalising "the findings split along the phase
   boundary" — which was about which *decisions* collapsed — into "Phase 0 is
   solid", and never re-deriving it.)*

   **What genuinely survived adversarial re-execution**, and can be carried
   forward on that basis: D5 (repo identity — re-run, exact to the digit), D3/D4
   (`node:sqlite` capabilities — executed), D24 (audit ordering — read complete
   in both directions). Three mechanisms.

   **What was never seriously attacked** — the genre traversal only began in
   round 3, so the infrastructure decisions were reviewed for internal
   correctness and not against the genres they serve: D2, D6/D7, D8, D9, D13's
   mechanical path, D16, D17, D19, D21, D22, D23, D26's Phase 0 fixtures, and
   D10's deterministic subset. **Not attacked is not verified.** Carry them as
   drafts to re-derive, not as settled work.

   **The four genre gaps, each with one nameable blocker:**
   Each blocker below was re-read against its source on 2026-07-31; the source
   is cited so the next session can check rather than inherit.

   - *Orientation* — **it has a v1 writer.** D18: *"v1's only writers are:
     `human_facts` promotion (FR-L6 …) and **the literal-match landmine path for
     orientation** (FR-J3's degraded set needs literal-match landmines)."* What
     is Phase 2 is *automated* mining, which is a different claim. So the work is
     to specify that literal-match path, not to wait for Phase 2.
     *(This entry first said the opposite — "no writer until Phase 2" — which is
     the defect round-4 finding R4-5 raised, reproduced here as fact while R4-5
     sat open in the register below. Corrected after Max Cogar asked whether the
     next session had enough to work from.)*
   - *Warning* — a real ambiguity, not a design problem. FR-A5: *"History-backed
     genres **additionally** respect evidence floors"* — the generated-file
     warning is not history-backed, but D10 step 5 restates the floors against
     "warn-grade" without that qualifier. One sentence decides it. Blocks AC-5.
   - *Verification* — the mapping does not exist. D16 sources verify-commands
     from *"package.json scripts per workspace dir; pytest/tox presence"*, and
     extracts test topology separately. A command list from `package.json` is one
     `Read` away and does not clear the bar; a region→command mapping would, and
     nothing builds one.
   - *Completeness* — FR-A2 gives it *"edit completed / stop"*; D10 step 4 routes
     only *"stop → untouched partners + verify command"*. The free arm was
     dropped, so its whole output now costs a turn.

   Also blocking: `cochange_file_pairs`, `ref_edges` and `open_questions` carry
   no provenance block, which breaks AC-1 and AC-6 as written.

   **Worth evaluating first, unvalidated:** coupling works today and warning is
   one decision away. A Phase 0 of those two would be a real running tool
   producing the measurements everything downstream waits on, without designing
   three more genres against nothing. That is a reading of the traversal table,
   not a conclusion any review reached — check it before acting on it.

Then review it, plan it, build it, and **run it** — because everything still
undecided is waiting on measurements only a running Phase 0 can produce.

**Why the old path failed, in one line.** Everything for phases 2 and 3 was being
designed against measurements nobody has taken, because nothing has ever been
run — so the *decisions* belonging to those phases collapsed in every review
round. (Phase 0's decisions collapsed less often, which is not the same as
holding: four of its five genres still fail traversal — see step 3.) You found it, by asking why three build phases live
in one spec. The full account, and the lesson future sessions inherit from it, is
the 2026-07-31 entry in `docs/collapse-log.md`.

**What changed in the project this session, beyond the review work.**
- The build rules now say the design is written **one phase at a time** instead
  of all three up front. That is the fix for the cause above.
- The spec now says plainly that the phase-2 and phase-3 requirements are
  provisional until the measurements they depend on exist.
- Project status was being duplicated in a repo-wide file, which is how the
  outside copy went two weeks stale while the inside one stayed current. That
  duplicate is removed. **This file is the state of record.** Handoffs describe
  what a session did; they do not set state.

**Open findings — 32 from round 4, triaged against the Phase 0 re-scope.** The
tripwire fired before these were applied, so all 32 are open. They were recorded
only inside the two round-4 review files, which is a pointer, not tracking — and
the re-scope changes which of them still matter. Triage by the decision each one
targets:

**Bears on Phase 0 — must be resolved during the Phase 0 assembly (12):**

| # | What it blocks |
|---|---|
| R4-4 | D20 deletes `self_serve_cost` in degraded mode — so **Phase 0 ships the exact bar round 2 collapsed**, with no term for what the agent could get itself |
| R4-6 / R4-C3 | Coupling's grounding pointer (`commit hash`) does not exist in the schema and D17 refuses to store it — **blocks AC-1 and AC-6, both Phase 0 exits** |
| R4-5 / R4-C11 | Orientation's landmine arm marked "no v1 writer" when D18 names two, one built for Phase 0 — and the `genre_dark` check it defers to does not exist |
| R4-C7 | Verification's bound fact cites test-topology mining D16 does not do; on a single-package repo it maps everything to one command |
| R4-C13 | Completeness lost FR-A2's free `edit-completed` trigger, so its whole output now spends a turn |
| R4-C10 | Answer-drift was moved into Phase 0 in a table note, contradicting spec FR-J3 and §12 |
| R4-3 / R4-C14 / R4-C6 | D24's write classes do not enumerate every table, and the anti-ratchet's only evidence sits in the droppable class |
| R4-C1 | The FR-A5 evidence floor's applicability to the generated-file warning is undecided — blocks AC-5, a Phase 0 exit |
| R4-C2 | `self_serve_class` asserted per genre for a per-candidate function |
| R4-1 | `prov_kind` pointer shape stated two incompatible ways (the D6 half is Phase 0 schema) |
| R4-9 | **Systemic, fifth round** — cross-references certifying what their targets do not carry. A process defect, not a Phase defect; it applies to whatever gets written next |
| R4-C4 | Warning's uptake predicate measures compliance, inverting the rule it cites (Warning is a Phase 0 genre) |

**Phase 1 or 2 — deferred until those phases are architected (20):** R4-2, R4-7,
R4-8, R4-10, R4-11, R4-12, R4-13, R4-14, R4-15, R4-16, R4-C5, R4-C8, R4-C9,
R4-C12, R4-C15, R4-C16, and the Phase-1 halves of R4-1, R4-3, R4-C1, R4-C14.
These target the judgment core, the conduct genres, the learning loop and D10a —
none of which Phase 0 contains. **Deferred is not closed.** They return when
Phase 1 is architected, against measurements that exist by then.

*(R4-7 and R4-8 — the Spike 1 evidence and the D11 timeout — were corrected in
place during this session; they are listed as deferred because D11 itself is
Phase 1, not because the corrections are pending.)*

**What survives.** Your decisions in RETHINK; the spec's Phase 0 material; the
store design, the event contract, the shim, the indexer, the security scanner and
the repo-identity mechanism — several held up under reviewers actively trying to
break them; and everything proved by running it (the login trick, the tool
lock-down, the timings, the turn behaviour). The four reviews and the collapse log
are a genuinely useful record of how this fails.

**What does not survive.** The design for the thinking half — the judgment core,
the two conduct nudges you asked for, the "when to speak" dial, the learning loop.
Not because the work was careless, but because it could not be done yet.

**A correction I owe you, the second on the same point.** I told you the tool's
model command "fails every time", then that it "depends on the wording". Both
wrong. Under the setting the design actually uses it succeeds 10 out of 10.
Nothing about the tool changes; what changes is that you were handed a confident
wrong answer twice by me.

**Nothing needed from you.**

## 2026-07-30

**Where the project is:** still design phase, no code — still correct. The
architecture went through its round-2 review this session and **failed it**, hard.
Nineteen problems were found across two independent reviewers. All nineteen are
now fixed. The document is in genuinely better shape than it has ever been, and
it has **not** been re-reviewed since the fixes, so it is not signed off.

**The headline: the tool would not have worked at all.**

The command the design uses to ask the AI model a question was tested this
session by actually running it. The design allowed the model "one turn" to reply,
but the structured answer it asks for is delivered *as a second step*.

**A correction I owe you — the second one on this same point, and I got it wrong
twice.** I first told you the command "fails, every time." Then I told you it
"depends on the wording of the instructions." **Both were wrong**, and the fourth
review caught it by running the one test I had been told to run and hadn't.

Here is what is actually true. All my failing runs used an *old* setting the
design no longer uses. Under the setting it actually ships, the command succeeds
**10 out of 10** — with short instructions or long, it makes no difference. There
was never a wording effect. There was a leftover flag in my test that isn't in
the product.

The design decision (allow two turns) is still right and costs nothing, so
nothing about the tool changes. What changes is that you were told a confident
mechanism twice, by me, and neither was real. Both times the error was the same
shape: I ran a handful of tests and reported the pattern instead of running the
specific test that would have shown me I was wrong.

**The other serious one: the "no tools" promise was not true.** The design claimed
the model it consults has no tools available, "enforced by construction". Run
live, eight tools were still available to it — including ones that can schedule
work and write files out. The fix (`--tools ""`, which is documented and which I
verified returns "none") turned out to be *better on every axis*: it's genuinely
empty, it's one step shorter, and it's about 40% faster. The two worst findings
of the round fixed each other.

**What you decided, and what I did with it.** You said the oracle speaking when an
agent claims it's done is a must-have. It's locked in as your decision #12, and
the spec now says out loud what the review discovered: speaking at that moment
*does* cost the agent an extra turn — it isn't free the way the rest of the tool
is. Rather than pretend otherwise, the oracle is now hard-limited to **one** extra
turn ever, it can never chain them, and every time it spends one it gets logged so
you can see how often it happened.

**The rest, briefly.** The tool had no way to tell "you couldn't have known this"
from "you could have found that in one second" — which your own founding document
calls the only measure that matters, and which had never been built. The two
"conduct" nudges you asked for (did the AI actually run the tests it says it ran?)
were designed in one place and made impossible in another, so they'd have been
quietly dropped at build time. The oracle spends *your* Claude subscription while
helping — with no limit on how much. In a fan-out, the 5th and 6th helpers got
nothing because the first three spent the budget. And the check meant to stop the
tool inventing things only checked that the fact it cited *exists*, not that its
sentence actually followed from it — I reproduced that live, watching the model
claim a coupling was "stable" and "a standard pattern, not accidental" from a
fact that said nothing of the kind.

**Something I want to flag about my own conduct.** Two of this round's problems
were caught by *you*, not by the machinery that exists so you don't have to: I
told a reviewer a required tool was unavailable (guaranteeing it would never try
it), and I used text-search results as proof — which produced one false alarm and
one near-miss where I almost accused a reviewer of fabricating a quote from your
own document. Both are written up as durable rules so future sessions inherit
them rather than repeat them. That's the mechanism working, but it worked one
step later than it should have.

**What's broken / not trustworthy yet:** nothing known-broken in the design right
now — but this is the same sentence I'd have written last round, and last round it
was wrong. What's *different* is that the document no longer certifies itself: the
four self-assessment blocks that kept producing false "all verified" claims are
deleted, replaced by evidence attached to each individual claim, with a standing
instruction that any future summary attestation is to be treated as a defect on
sight. Three rounds running, those blocks were the least reliable text in the file.

**Nothing needed from you right now.** Next step is a round-3 review of the fixed
document before any code gets written.

## 2026-07-22

**Where the project is:** still design phase, no code — still correct. The
architecture document was **rebuilt** this session and then hardened by two
independent checks. It is now in much better shape than the version the last
session flagged as not-trustworthy, but it has **not yet been through a final
review of the rebuilt version**, so treat it as "strong draft," not "signed off."

**What got done this session:**
- The broken heart of the tool — how it decides what to say — was **rebuilt** on
  the spec's own rule (FR-A1). The old version could only pick from a pre-made
  list; the new one lets the tool actually reason and compose a whisper, while
  strict machine checks make sure every claim it makes points at real evidence and
  no repo text can sneak in as an instruction.
- Every fact the design leans on was **re-checked by actually running it** this
  session (not taken on trust). That caught a real, serious problem the old draft
  had hidden: the exact command the tool would use to reach the model included a
  flag (`--bare`) that **silently breaks login** on machines like yours (and this
  one). Proven live — it failed 3 times out of 3 — and fixed by removing the flag.
- The design was then attacked on purpose by **two independent reviewers** (one
  hunting for "sounds-right-but-hollow" decisions, one checking every fact and
  standard). They found the login bug above plus several more real issues — the
  "when to speak" dial was under-defined, the tool could quietly go silent and look
  healthy, the "answer a question" feature was weaker than claimed, and the record
  of what the tool said could be dropped under load. **All of them were fixed** and
  written down so future sessions inherit the lessons.

**What's broken / not trustworthy yet:**
- Nothing known-broken in the design right now — but the *rebuilt* document has not
  had its own final clean review pass yet. The honest state is "all found problems
  fixed; a fresh reviewer should still confirm the fixes hold together."
- I chased down the loose ends this session instead of leaving them vague. Two that
  I'd earlier called "unknown" are now settled by looking them up: the login trick is
  **documented** to work with your Claude subscription (a headless call uses your
  plan; there's just a quick confirm on your own machine at install), and the
  user-facing notice **stays on your channel, not the AI's**, by how the harness
  splits those two channels. The last one — an undisclosed internal file layout the
  subagent-watching feature reads — genuinely can't be *guaranteed* (it's not a
  documented thing), so instead of letting it fail quietly I made the tool **tell you
  out loud** if it ever breaks, which is the whole point of the self-watching design.
  Nothing here is a silent unknown anymore.

**A correction I owe you (no decision needed from you):** during this session I
briefly asked whether the "conduct" nudges — the tool watching whether the AI
followed the steps of a skill it loaded, or ignored a question you asked — should be
*off* by default, because one of the automated reviewers called them "supervising."
You pushed back, and you were right: that was me reflexively over-narrowing a feature
**you specifically asked for**. Supervising by a gentle, non-blocking note is exactly
what this tool is for — it never blocks anything, and pointing out "you said the
tests pass but I never saw you run them" is precisely a *fact the AI didn't realize*,
which is the whole mission. These two nudges are **on by default**, as you intended.
The only real thing to watch is that they don't get *chatty* — and the tool already
has an automatic dial-down for that, plus a planned check-in where you look at how
often they fire wrongly *after* it's run for real. Nothing for you to decide now.

**State of the work:** everything this session is committed and pushed (draft
PR #49). Nothing is merged. The architecture is marked "strong draft, fixes
applied."

## 2026-07-17

**Where the project is:** still design phase, no code — and that's still
correct. The architecture document was written this session, but a rigorous
review found it isn't trustworthy yet and needs a proper rebuild before
anything is built from it. The spec underneath it is sound; the problem is
in *how the architecture document was written*, not in what the tool is
meant to be.

**What got done this session (and is worth keeping):**
- The two cheap experiments the design depended on were run for real, with
  the actual results saved:
  - Borrowing the already-logged-in Claude *worked* — a background call
    completed with no separate credentials. (Caveat: proven in this cloud
    environment; the same check still has to be repeated on your own
    machine.)
  - Whispers *can* reach a subagent's context — confirmed, with the harness
    even telling us which subagent is asking. This was the biggest open
    unknown, and the answer is yes.
  - Bonus: the transcript the oracle reads lags one step behind the live
    turn — measured, so the design now accounts for it instead of guessing.
- The core of the tool — how it decides what to say — was corrected. The
  first draft made it too weak (it could only pick from a pre-made list and
  only checked that a fact was *real*, not whether it was worth saying). The
  corrected version, written in `docs/judgment-layer-corrected-foundation.md`,
  is anchored on the spec's own rule (FR-A1) and lets the tool actually
  reason — while still never inventing or obeying anything.
- A durable safeguard was added to the project's rules (`CLAUDE.md`): every
  important decision now has to survive one hard question about whether it
  serves the mission, checked by a fresh independent pass — *not by you*.
  Past failures of this exact kind are recorded in `docs/collapse-log.md`.

**What's broken / not trustworthy yet:**
- The architecture document (`docs/architecture-context-oracle.md`) is **not**
  ready to build from. A review found 11 real problems, including one at the
  heart of the tool. More important than the count: they share one cause —
  the document repeatedly *claims* something is correct or complete without
  doing the check that would make it true (a total never added up, a
  coverage never enumerated, a control asserted with no mechanism, the core
  design never checked against the mission). So the fix is not to patch the
  11; it is to rebuild the document so every claim is actually *established*,
  not asserted. The spec is the trustworthy starting point.

**The one decision for you:** whether to do that rebuild now, pick it up in a
later session, or step back from the project for a while. All three are
legitimate — nothing is lost by waiting. The spikes, the corrected
foundation, the new safeguard, and this honest record are all saved and
pushed.

**State of the work:** everything this session is committed and pushed on the
working branch (draft PR #48). Nothing is merged, and the architecture is
explicitly marked not-ready.

## 2026-07-15

**Where the project is:** design phase, no code yet. The foundational
rethink (`RETHINK.md`) and the v1 specification
(`docs/specs/spec-context-oracle.md`) are written, externally
fact-checked, adversarially reviewed, and pushed on PR #42.

**What happened this session:**
- The spec was rewritten so every requirement traces to a verified source,
  an owner decision, or a recorded judgment call — and an adversarial
  review pass caught and fixed 14 problems in it, including claims that
  were stated more confidently than the evidence allowed.
- The owner rejected the API-key fallback. The oracle now has exactly two
  modes: borrow the already-logged-in Claude Code, or run in the no-model
  degraded mode. It never has credentials of its own.
- The owner expanded the scope with five new decisions (recorded in
  RETHINK §12 addendum): whispers reach subagents in v1; the oracle watches
  whether agents actually follow the skills/workflows they load; it watches
  for the "user asked X, agent keeps answering Y" pattern; it must diagnose
  its own failures instead of relying on the owner to notice; and the
  project is formally agent-led, with the working rules in `CLAUDE.md`.

**What works right now:** nothing is built yet — that's expected. PR #42
(rethink + spec + governance) was merged by the owner on 2026-07-15.

**Next step — and it is not building.** The lifecycle is spec →
architecture → plan → build (now written into `CLAUDE.md`). The next
session's job is the architecture document plus the two cheap validation
experiments the design depends on (does the borrowed-login trick work in
the sandboxes; can whispers reach subagent contexts). Building Phase 0
starts only after that document survives its own adversarial review.
The complete handoff for that session is
`docs/handoffs/2026-07-16-architecture-phase.md`.

**Broken / unknown:**
- Two things the design assumes are still unverified and are Phase 1's
  first checks: whether the borrowed-login trick works in every sandbox,
  and whether whispers can actually be injected into subagent contexts.
- Whether the two new "conduct" whisper types will fire falsely too often
  is unknown; they ship with an automatic self-disable ladder as the
  safety net.

**Questions for the owner:** none open — all questions raised this session
were answered and recorded.
