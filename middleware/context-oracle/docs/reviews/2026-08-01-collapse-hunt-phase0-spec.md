# Collapse-hunt — `docs/specs/spec-context-oracle-phase0.md` (2026-08-01, ninth pass)

*Independent adversarial pass, fresh subagent, never the author. Mission-fidelity
axis only — the citation/structure review runs in parallel and is not duplicated
here. **Written once, never edited.***

**Target:** `middleware/context-oracle/docs/specs/spec-context-oracle-phase0.md`
as it stands at 2026-08-01 17:10, governing Phase 0 over
`spec-context-oracle.md` wherever both address the same subject.

**Verdict: 16 findings — 9 collapse, 5 partial, 2 survive as attacked.** The
six-genre *membership* survives (it is parent §12 `[D-21]`, already hunted). What
does not survive is what happens **inside** the six: the bar loses the term that
decides whether a fact is worth saying at all, five of the six genres are
narrowed in their content cells with nothing recorded anywhere, and no acceptance
criterion tests the mission's load-bearing clause. The dominant class this pass
is **reduction one level below where every safeguard is aimed** — not the genre
list, which is guarded, but the arms inside a genre and the terms inside the bar.

**What survives, stated first so the findings are readable as exceptions:**
P0-D-1 (the three metrics match parent §9.2's Phase 0 column exactly);
P0-D-3/P0-4 (FR-A5's governing clause binds *history-backed* genres, so the zone
warning is genuinely exempt — the eighth pass's F11 established this and it holds
here); FR-O4/FR-O4a; the threat model and FR-X1/X5/X8; and the degraded-mode
exclusion **on the model axis** (F10 attacks a different axis, not this one).

---

## F1 — The bar has two terms where it needs three, and RETHINK §2.3 is not among the document's sources. COLLAPSES.

**Decision attacked:** FR-A4 — *"Each candidate carries confidence ×
decision-impact; only the top candidate above the bar is spoken."*

**Mission sentence available:** "speak only what would change the next decision."
**The collapse question:** *point at the term of Phase 0's bar that measures how
cheaply the agent could have got this itself.* There is none, and the words
`marginal`, `self-serve`, `non-obvious` and `obvious` do not occur anywhere in
this document.

This is **the round-2 collapse of 2026-07-30, item 1, reproduced verbatim** —
*"The send bar had no term for 'could the agent have got this itself?' …
`decision-impact` is materiality × structural_weight — every term measures how
much a fact MATTERS. Point at the term that measures how cheaply the agent could
have got it. Class: reduction."* That finding cost a round to fix. Parent §12's
"Phase 0's bar" paragraph carries the fix: *"`self_serve_cost` derives from
provenance class and what the consumer has already done"*, and states each term
is computable without a model. **This document omits that paragraph entirely.**

It is worse than an omission, because §3 is a closed source table: `RETHINK.md`
§1, §4, §5, §6 — **§2.3 is not in it**, and §2.3 is where the mission's own
relevance metric lives (*"Marginal value over the agent's own abilities is the
only relevance metric that matters"*). A builder holding only this document
implements a two-term bar and has no line telling him a third exists. FR-A3
(dedup) is not a substitute: STATUS.md records, on the substance, that
"already read" and "could self-serve" are different tests.

**Class: reduction (recurrence of a logged collapse).**
**Fix:** state the bar's three terms in FR-A4 with `self_serve_cost` named and
its Phase 0 derivation stated; add `RETHINK.md` §2.3 to §3 as a governing source.

## F2 — Five of the six admitted genres are narrowed in the content column, and the exclusion table says nothing was dropped. COLLAPSES.

**Decision attacked:** §5's genre table, and §2's attestation *"Nothing is
dropped from v1."*

**The collapse question:** *§2's table accounts for all twelve genres, so it
looks complete. Read the Content column against parent FR-A2 and name what left
the tool without appearing in any exclusion row.*

| Genre | Parent FR-A2 content | §5 content | Arm removed, unrecorded |
|---|---|---|---|
| Orientation | entry points, **the invariant that will matter**, landmines, ≤400 tokens | entry points; landmines | invariant arm; the token cap |
| Coupling | co-change partners; **canonical helper for the thing searched** | co-change partners + ratio | the reuse arm |
| Consequence | call-sites and spread, **historical breakage**, **existing implementation to reuse** | call-sites and spread | two arms |
| Warning ⚠ | generated/vendored zone, **or landmine with strong evidence** | generated/vendored zone only | the landmine arm |
| Completeness | paired file not yet touched, per co-change **/ invariants** | co-change partner not touched | the invariant arm |

Parent §14 already records *"Warning's landmine arm is likewise unphased"* as
open; this document neither phases it nor mentions it. Two of the removed arms
are **deterministically derivable in Phase 0 with the stores Phase 0 builds**:
consequence's historical breakage is a co-change (FR-K2) × test-topology (FR-K1)
join — it is RETHINK §5's own worked example — and the landmine warning arm reads
the same records orientation reads.

Parent §12 limit 2 is explicit about the honest form: *"An unpopulated or unbuilt
store row is **deferred content within a live genre**, never a membership test."*
Rewriting the genre's content cell so the arm is gone is neither — it is deletion
below the level at which the exclusion table, and every safeguard this project has
built, can see it. The collapse log's standing lesson from this same day applies
literally: *"A table is not a summary — every cell is a claim."*

**Class: reduction.**
**Fix:** restore each arm to its content cell, or record it in the cell as
deferred content with the condition that fills it. The attestation "Nothing is
dropped from v1" cannot stand over a table that drops five arms.

## F3 — Phase 0 writes a class of facts it has no genre able to speak, and the writer it names has no input channel. COLLAPSES.

**Decision attacked:** P0-3 (*"exactly two Phase 0 writers: FR-L6 promotion, and
literal-match landmine detection"*) together with FR-L6 (*"in force in Phase 0"*).

**Collapse question 1:** *name the Phase 0 genre that can speak a fact the owner
stated.* Human statements promote to landmine **or invariant** records. No §5
genre reads an invariant (F2). So an FR-L6-promoted invariant — the
highest-trust provenance class the store can hold (FR-K6) — is written and never
delivered. The only readable output is a landmine whose *literal terms* happen to
match a later prompt.

**Collapse question 2, harder:** *name the Phase 0 mechanism that turns a human
sentence into a typed store record, given that "narration reading and intent
tracking" is excluded to Phase 1 because it "requires the transcript reader".*
There is none. Human statements live in the transcript; `prompt_text` gives Phase 0
raw prompt strings and nothing that converts prose into a landmine or invariant
record — that conversion is language understanding, which is exactly what Phase 0
excludes. FR-L6's justification in §4 is circular on this point: it is in force
"because it is one of the two writers for the records orientation reads", and its
own input is out of scope.

This is the collapse log's named signature — *"the hard part is a named noun with
no producer"* — applied to the only writer Phase 0 has for its Tier 1 tables.

**Class: decision-hiding, crossing into reduction.**
**Fix:** either specify FR-L6's Phase 0 intake mechanism concretely (what event,
what text, what deterministic rule produces a typed record) or move FR-L6 to
Phase 1 with the transcript reader and say that Phase 0's Tier 1 tables ship
empty — which is what P0-D-2 already argues is visible and harmless.

## F4 — Two deliverable-fact gaps of record are closed by wording rather than by a mechanism. COLLAPSES.

**Decision attacked:** §5's orientation and verification rows, and P0-3's writer
claim.

The eighth pass (F5, this same day) recorded exactly two Phase 0 genres with
*"deliverable-fact gaps of record: verification's join does not exist;
orientation's landmine writer is unspecified"*, and prescribed the treatment:
deferred content within a live genre. This document instead closes both by
phrasing.

- **Orientation.** P0-3 names *"literal-match landmine detection"* as a **writer**.
  Matching a landmine record's literal terms against a prompt is a **read** — it
  selects an existing row, it creates none. Rename it correctly and the landmine
  table has one Phase 0 writer (FR-L6), which F3 shows has no input channel; the
  table is empty and orientation reduces to entry points. AC-7 is written to
  exactly the surviving arm — *"a prompt naming a task whose entry points are in
  the index"* — so nothing in the exit set would notice.
- **Verification.** §5 states the content as *"the verification command for the
  changed region"* against evidence *"per-region verification commands."* The
  missing thing was never the commands; it is the **join** from a changed region
  to its command. Stating the genre as a lookup does not create the join, and
  AC-8 requires it to fire.

**Class: unverified.**
**Fix:** name the join and the writer as mechanisms, or mark both arms deferred
content with their filling conditions — the treatment already applied and
recorded one pass earlier.

## F5 — The acceptance criteria test emission and harmlessness. The mission's load-bearing clause has no criterion at all. COLLAPSES.

**Decision attacked:** §12 as a set.

The mission has three clauses: *(a)* **the fact that would change the agent's
next decision**, *(b)* **at the moment of that decision**, *(c)* **without being
asked**. Walking all fifteen criteria:

- *(c)* is tested — AC-15.
- *(b)* is tested only as "the genre fires on its trigger", and for coupling it
  is tested on the **wrong** trigger: §5 fires coupling on *file read / symbol
  searched*, while AC-1 exercises *"an observed edit to one file"* — a trigger §5
  assigns to consequence and completeness. AC-1 is satisfiable without the
  coupling trigger ever running. (Inherited from parent AC-1; restated here as
  Phase 0's governing criterion, so it is this document's now.)
- *(a)* **has zero coverage.** No criterion tests that a whisper was non-obvious,
  unknown to the agent, or material. AC-2's 10% ceiling is a volume proxy: a
  build that whispers on 10% of events about files the agent read thirty seconds
  earlier passes it.

Requirements in force in Phase 0 with **no** Phase 0 criterion: FR-A2 (one per
event, token budget), FR-A3 (dedup — the marginal-value requirement), FR-A4 (the
bar), FR-D2 (informative never imperative — the property that makes it a guide
rather than a gate), FR-K6 (provenance and trust labels), FR-X6 (the audit trail,
which §1 names as the owner-consumer's entire interface), FR-L1 (the uptake log
Phase 1's design consumes). The parent's criteria for four of these — AC-6
provenance, AC-16 attention discipline — are **Phase 1 exits**, so splitting the
phases moved the requirement into Phase 0 and left its verification behind. The
document does not record that anywhere.

And FR-A5's floors have **no negative test**: AC-1 verifies that a known pair
fires. Nothing verifies that a support-2 pair does *not* fire warn-grade. A floor
is verified by non-firing; every criterion here verifies firing.

**Class: wrong-check.**
**Fix:** add (i) a dedup/self-serve criterion — replay in which the whisper's
fact is in the consumer's read set and the oracle stays silent; (ii) a negative
criterion for FR-A5's floors; (iii) a universal criterion that every emitted
whisper parses to FR-D1 and every pointer resolves (parent AC-6, pulled into
Phase 0 where the requirement is); (iv) a criterion that the FR-X6 audit record
and the FR-L1 uptake evidence are present and readable — Phase 1's design
consumes the latter and nothing checks it exists.

## F6 — P0-D-6: the evidence floors do not do the cold-start floor's job. They are per-pair; FR-A6 is per-corpus. COLLAPSES.

**Decision attacked:** P0-D-6 — *"There is no separate cold-start floor … a
region with fewer than two co-change observations cannot clear suggestion-grade,
and fewer than three cannot clear warn-grade. A second configurable minimum would
be an ungrounded knob."*

**The collapse question:** *support and confidence are properties of a rule
A→B — support counts the pair, confidence is support ÷ occurrences of A. Name
the corpus size at which they stop being reliable.* They don't have one, and that
is the entire point of parent FR-A6. Worked case: a file pair seen in three
commits, together every time — **support 3, confidence 1.0**, clears warn-grade —
in a repository with eight commits of history. FR-A5's floors pass it; FR-A6
silences it. The two are orthogonal, and P0-D-6's own sentence conflates them by
saying "a region with fewer than two co-change **observations**", which is not
what support counts.

The mission cost is concentrated exactly where Phase 0 lives. Phase 0's exit is
*the owner runs it on a real project*; C-1 is cold-container; the parent records
that shallow clones silently key a different store. Thin, truncated history is
the **modal** condition of the run that decides whether Phase 0 passed, and
first-impression precision is what the tool's credibility is set by.

FR-A6 is also not ungrounded: it carries `[ROSE-05]` `[HH-04]` in the governing
parent spec. It reads as ungrounded here only because §3 declares a closed source
table that does not include `[HH-04]` — the document's source list decided its
requirement set, rather than the other way round.

**Class: wrong-check, producing a reduction.**
**Fix:** restore a per-corpus history floor for history-backed genres in Phase 0,
with its parent sources, or move FR-A6 to Phase 1 with a named destination and a
statement that Phase 0's numbers are measured without it.

## F7 — P0-D-7: FR-O1 is not an exhaustive trigger enumeration, and this document proves it twice. COLLAPSES.

**Decision attacked:** P0-D-7 — *"FR-O1 enumerates the oracle's triggers
exhaustively, so anything absent from that list — a timer, an idle detector, a
polling loop — is already not a trigger."*

**The collapse question:** *is FR-O1 a list of triggers?* No, on both sides:

- It contains a **non-trigger**: `session start` is in FR-O1 and no §5 genre
  fires on it.
- Two events this document **acts on** are absent from it: `StopFailure` (P0-1)
  and `SubagentStop` (FR-O4a). If the enumeration were exhaustive, FR-O4a's
  `SubagentStop` clause would be dead text.

So the premise is false in both directions, and the deletion rests on it alone.
Parent FR-O5 exists, is sourced `[CHI-25]`, and constrains something FR-O1
cannot: FR-O1 governs **what is observed**; FR-O5 governs **whisper
opportunities**. A timer is not an observation. Phase 0 is also the first phase to
contain a background loop — FR-K7's background refresh, NF-3's incremental
indexer — so it is the first phase in which a background component could acquire
a voice, and the rule against it was removed in the same document that creates
the loop.

The stated reason ("its real source was a paper this document does not use") is
the F6 inversion again: a governing requirement was deleted because *this*
document chose not to cite the source that grounds it.

**Class: unverified.**
**Fix:** restore the requirement, sourced as parent FR-O5 is, or delete P0-D-7's
reasoning and say plainly that FR-O5 remains in force from the parent.

## F8 — FR-A7 vanishes with no treatment, and the document has three incompatible ways of handling an inherited requirement. PARTIAL.

Parent FR-A7 (first impressions: *"in a project's first sessions, only
highest-confidence genres speak"*, `[COVERITY-10]`) appears nowhere — not in
scope, not in the exclusion table, not in §11. Under the precedence rule
(*"where both address the same subject, this governs Phase 0"*) silence means the
parent governs and FR-A7 is in force — but the document also **negates** two
parent requirements it does address (FR-A6, FR-O5) and **renumbers** four others.
A builder cannot tell which of the three treatments any given parent requirement
received without diffing the two documents line by line.

FR-A7 also does the same job as F6's floor at the same moment — the phase whose
exit is a first real-project run — so its silent inheritance is the one place
where the safe direction happened to be taken by accident.

**Class: posture (the treatment is undeclared, not wrong).**
**Fix:** one sentence stating the rule — *parent requirements not addressed here
remain in force unchanged* — and an explicit line for every parent requirement
this document negates.

## F9 — P0-2: the fork it exists to resolve is left open, and nothing in Phase 0 exercises it. PARTIAL.

**Decision attacked:** P0-2 — *"Session state is keyed per consumer from the
first implementation, though Phase 0 delivers only to the consumer whose event
fired."*

**Mission sentence available:** none was written. The stated rationale is
*"a state model built for one consumer cannot acquire a second without being
rebuilt"* — a build-cost argument, which is legitimate (D18 sets that precedent)
but is not a mission sentence, and step 1 of the collapse test asks for one.

**The collapse question:** *name the Phase 0 event that produces a second
consumer key.* The document answers both ways and does not notice:

- If subagent tool events fire hooks, then Phase 0 observes them, and P0-2's own
  rule — deliver to *"the consumer whose event fired"* — puts a whisper into the
  subagent's context. **That is subagent delivery**, which §2 excludes to Phase 1.
- If they do not, Phase 0 has exactly one consumer, the keying is never
  exercised, and no acceptance criterion covers it.

Parent §14 lists this under *"Blocks the Phase 0 architecture"* and says
*"settle before the state model is designed."* Settling it is the agent's call
and this document settles it — but by asserting the keying, not by resolving the
fork, and parent §14 still carries it as open, so the two documents now disagree
about whether it is settled.

Two smaller defects in the same row: §2's subagent-delivery row cites **P0-3**
(the store schemas) where it means **P0-2**, and its Reason column contains no
reason — it is the only row in the table that does not say *why*. The real reason
exists in parent §14 (the subagent hook contract is unverified) and is not stated.

**Class: mechanism-not-mission.**
**Fix:** state the fork and which branch Phase 0 assumes; state the real reason
for the deferral; fix the cross-reference; add a criterion that exercises two
consumer keys, or say explicitly that none can exist until Phase 1.

## F10 — "Phase 0 needs no degraded mode" answers the model question and treats it as answering the owner question. COLLAPSES.

**Decision attacked:** §2 — *"Degraded mode | Phase 1 | It is the runtime
fallback for an unreachable model path and cannot precede that path."*

On the model axis this survives, and the eighth pass already established it.
**The question it does not answer:** FR-J3 bundles two things — a raised bar, and
*"announced once per session on the human channel and never into agent context."*
The **announcement's** mission job is not "a model is missing"; it is *the owner
learns the oracle is not delivering, without having to notice*. That is OWNER-10
in his own words: *"it could fail a hundred ways in front of me and I wouldn't
know."*

Phase 0 has states that are indistinguishable from correct operation and are not
correct operation: FR-O3 turns any service error, timeout or missing store into
silence; FR-K7 turns a stale index into silence; both look exactly like an oracle
correctly holding its tongue. FR-M2 and `ctxoracle status` are the answer — and
they are **pull**. AC-13's pass condition is that failures are *"surfaced by
`ctxoracle status`"*, i.e. surfaced when the owner thinks to ask. Nothing pushes,
on a channel FR-D4 already sanctions and Phase 0 already has.

**Class: wrong-check.**
**Fix:** a Phase 0 requirement that a self-detected condition suppressing
whispers for a session is announced once on the human-visible channel, never into
agent context, with AC-13 extended to assert the announcement — and keep the
FR-J3 exclusion exactly as written, which this does not disturb.

## F11 — The Unknown genre: a deferral with no destination, on a reason that is false. COLLAPSES.

**Decision attacked:** §2 — *"Unknown genre | **Unassigned in v1** | Its trigger
is a determining query returning empty — neither a store lookup nor a model
call."*

Two independent grounds:

1. **The destination is missing, and the table's header promises it isn't.** §2
   opens with *"Every exclusion names the phase that owns it. Nothing is dropped
   from v1."* "Unassigned in v1" names no phase and is, on its face, dropped from
   v1's phasing — the header is falsified by a row eleven lines below it. The
   collapse log's rule is unambiguous: *a deferral with no named destination phase
   is a descope, and scope is the owner's call, not the agent's* — recorded as F1
   of the genre-cut hunt this same day. Parent §14 carries it correctly as an open
   item (*"The Unknown genre has no phase"*); this document converts an open
   owner-facing question into a settled agent-made exclusion.
2. **The reason is false.** A bounded determining query that returns empty **is**
   a store lookup — that is precisely the mechanism this project already built for
   it (collapse log 2026-07-22, item 6: the genre was mechanized *"via a
   negative-evidence fact — a bounded determining-query that returns empty becomes
   a bindable fact whose pointer is the query + its empty result"*, class of the
   original defect: **reduction, mandated breadth silently dropped**). This is the
   second time the same genre has been dropped for the same reason.

**Class: reduction.**
**Fix:** restore the parent §14 formulation — the genre has no phase, it is an
open scope item, and the owner decides — or assign it to a phase. What it may not
be is settled here.

## F12 — §5's PreToolUse justification is weaker than the evidence the parent already holds, and §3 confirms a capability nothing uses while omitting one two genres need. PARTIAL.

**Decision attacked:** §5 — *"The hooks contract makes this structurally
available: `PreToolUseHookSpecificOutput` declares `permissionDecision` and
`additionalContext` as independently optional."*

**The collapse question:** *a schema saying a field is not required tells you what
you may emit. What tells you the harness delivers it?* The parent's §6.1 answers
directly, verified against `[HOOKS]`: *"each of the five whisper events supports
injecting model-visible text via `hookSpecificOutput.additionalContext` —
including `PreToolUse` without issuing any permission decision (exit 0 'doesn't
approve the tool call: the normal permission flow still applies')."* That is a
behavioral quote. This document's 2026-08-01 re-verification replaced it with a
schema-optionality inference and is silent on `PostToolUse` altogether — the
delivery path coupling and completeness's edit-completed arm both ride.

Meanwhile §3's confirmation list includes `"async": true`, which no requirement
uses. Confirming an unused capability while downgrading the evidence for the
load-bearing one is the tell; the collapse log's `--bare` entry is the same class
(*"a load-bearing premise self-certified but never actually run"*).

**Class: unverified.**
**Fix:** quote the behavioral sentence for `PreToolUse` and add `PostToolUse` to
§3's confirmed list, or route both to a spike. The claim itself is very likely
true — the defect is that the document's own evidence no longer establishes it.

## F13 — AC-7's threshold is a harness timeout value, in a document that decided no requirement depends on one. PARTIAL.

**Decision attacked:** AC-7 — orientation fires *"within the harness's
`UserPromptSubmit` budget"* — against P0-D-4 (*"No requirement depends on a
harness timeout value"*) and NF-1 (p95 ≤ 1.5 s, ceiling 3 s).

The harness budget is 30 s. AC-7 therefore tests the one genre on the one trigger
channel against a bound **twenty times looser** than the oracle's own, and is
nearly unfailable. The mission cost is direct: FR-O3's budget exists because
*"a hook that slows the agent is a gate by another name"*, and orientation is the
whisper that lands before the agent has done anything — the one most able to feel
like a gate.

**Class: wrong-check.**
**Fix:** AC-7's bound is NF-1, like every other genre's.

## F14 — P0-5 gives the owner a count of turns spent and no count of whispers suppressed, on the one capability he personally ruled must-have. PARTIAL.

**Decision attacked:** P0-5 — *"A stop-grade whisper clears a raised bar … each
such delivery is recorded as a continuation event so the owner can see how often a
turn was extended."*

The raised bar itself is inherited from parent §6.1 and is not an agent invention
— that half survives. What does not: the delta is unquantified, carries no
`[P0-D-n]`, and has no criterion; and the visibility is **one-sided**. P0-6 and
AC-14 surface the continuation count — the cost — and nothing surfaces the
suppression — the loss. FR-L1 already records *"the candidates considered"* per
event, so the datum exists; `status` is the owner's only view (§10) and does not
report it.

**The collapse question, which the genre-cut hunt asked and this document
inherits unanswered:** *behind the raised bar, what does the owner actually
hear?* OWNER-12's ruling is that the turn cost is **accepted** and that it is
*"not a ranking of this moment against the others"*. An unquantified,
unmeasured, one-sidedly-reported bar delta on that moment is a ranking made by
the mechanism rather than by the owner.

**Class: wrong-check.**
**Fix:** state the delta (or "tunable, default: no delta") with a `[P0-D-n]`, and
add stop-grade candidates suppressed by the bar to P0-6 and AC-14.

## F15 — Shared identifiers do not mean what the document says they mean, and one of the collisions lands on the anti-reduction requirement. COLLAPSES.

**Decision attacked:** the header — *"Requirement identifiers are shared so
downstream artifacts need no translation."*

They are not shared. Checked line by line against the current parent:

| ID | Means here | Means in the parent |
|---|---|---|
| FR-A2 | one whisper per event, token budget | **the twelve-genre table** |
| FR-A3 | dedup | budgets |
| FR-A4 | the bar | dedup |
| FR-A5 | the evidence floors | the bar **and** the floors |
| FR-M3 | diagnostics never touch agent context | the distiller self-report (Phase 2) |
| AC-9 / AC-10 / AC-11 / AC-12 / AC-13 / AC-14 / AC-15 | secrets / least privilege / injection / staleness / self-detection / measurements / ceremony | export / degraded mode / recursion guard / secrets / trust origin / least privilege / export round-trip |

Two consequences that are substance, not formatting. First, **parent §12's Phase 0
exit is written in parent numbering** — *"AC-1..AC-5, AC-12, AC-14, AC-17, AC-18
pass"* — and under this document's precedence rule the same strings name different
criteria; a builder satisfying "AC-14" satisfies the measurement criterion here
and the least-privilege criterion there. Second, **FR-A2 is the identifier this
project uses for the twelve-genre breadth requirement** — `RETHINK.md:390`
(*"across all twelve FR-A2 genres, none of them primary"*), the collapse log, and
`CLAUDE.md` all use it that way. In the document that governs the build, FR-A2 now
means a token budget, and the requirement whose reduction caused two full remakes
has no identifier at all. `CLAUDE.md`'s read-list has the same problem with FR-M3.

**Class: unverified (a false claim about the document's own contents).**
**Fix:** adopt the parent's numbers unchanged and give genuinely new requirements
`P0-` identifiers — which is what the header already promises.

## F16 — NF-2 requires a report the parent's own metric table records as having no recorder. PARTIAL.

NF-2 here: *"Session token overhead stays within the FR-A2 budget and is reported
by `ctxoracle status`."* Parent §9.2's metric table, token-overhead row:
recorded by *"no requirement names a recorder — §14"*, store row *"—"*, Phase 0
column *"gap"*. And FR-A2 here states no budget value (the parent's 2,000-token
default `[D-10]` did not survive the restatement), so "within the FR-A2 budget" is
unfalsifiable and AC-14 does not test it.

**Class: unverified.**
**Fix:** either name the recorder and the store row and add it to AC-14, or state
NF-2 as an open gap exactly as the parent does.

---

## Self-serving check (mandatory — the inclusive direction has nothing watching it)

The collapse log's 2026-08-01 lesson 10 is explicit: *"after a run of kills the
authoring instinct learns that inclusive proposals survive — every safeguard here
points at exclusion, so an inclusive error has nothing watching for it. Being
wrong in the safe direction is still being wrong."* This pass is overwhelmingly
inclusive, so it is checked against itself:

- **F2, F6, F7, F11, F15, F16 restore or preserve text the governing parent
  already contains.** These enlarge nothing; they stop a phase spec from
  subtracting from the document above it. Free in the direction of the
  precedence rule.
- **F1, F5, F13, F14** add computation, criteria and reporting to things already
  required. They cost implementation work and they are the ones to argue about;
  each names a specific requirement already in force whose verification or whose
  term is missing, not a new capability.
- **F10's remedy is the only genuinely additive requirement in this pass** — a
  human-channel announcement Phase 0 does not have and the parent does not
  require of Phase 0. It is offered as one requirement with one criterion, and it
  is the one finding whose rejection would be reasonable if the owner would rather
  run `ctxoracle status` himself. Priced, not smuggled.
- **F2 and F3 each have a cheaper honest form than restoration** — record the arm
  as deferred content with its filling condition, per parent §12 limit 2. Taking
  the cheap form satisfies both findings. Neither requires Phase 0 to grow.

---

## The single most dangerous unexamined assumption

**That a Phase 0 which passes every one of its fifteen criteria is a Phase 0 that
works.**

Every criterion in §12 is one of three shapes: *the genre fires when the fixture
is rigged for it* (AC-1, AC-5, AC-6, AC-7, AC-8), *the tool does no harm* (AC-3,
AC-4, AC-9, AC-10, AC-11, AC-12), or *the tool notices its own breakage* (AC-13,
AC-14). AC-2 caps volume. AC-15 confirms nothing is demanded of the agent. Not one
of them asks whether a single whisper delivered a fact the agent did not have and
would have acted differently for. The exit clause completes the pattern: *"the
owner runs it on a real project without incident"* — an absence-of-harm test, from
the person the whole project exists to keep out of the substance-checking role.

The three measurements P0-6 emits are all **cost** measurements: silence rate,
latency, continuation count. P0-D-1 consciously declines a value measurement, and
its reasoning is sound as far as it goes. But §1 justifies building this phase
first on the ground that *"running it is the only way to obtain evidence about how
often the oracle should speak"* — and `RETHINK.md:273–275` says a silence rate is
interpretable only against a hit rate (*"a falling silence rate with flat hit rate
means it's getting chatty"*). Phase 0 therefore ships, exits, and hands Phase 1
the numbers its bar is tuned from, and every one of those numbers measures what
the oracle **spent**, none what it **delivered**. The single artifact that could
close the gap later — FR-L1's per-event record of uptake evidence — is the one
Phase 0 artifact with no acceptance criterion at all (F5), so Phase 0 can pass
everything and hand Phase 1 an empty or unusable log without any check firing.

If that assumption is wrong, the failure is not that Phase 0 ships something
weak. It is that Phase 0 ships something weak **and certifies it**, and the
certificate is what four subsequent sessions will cite. This is the shape the
2026-07-30 pattern note named — *an unfilled requirement wearing a reference* —
here wearing an exit.

**What would test it, and is writable today:** one replay criterion in which the
fact the oracle whispers is already in the consumer's read set and the oracle must
stay silent, and one in which it is not and the oracle must speak. Two fixtures,
one pair, and the mission's load-bearing clause acquires its first check.
