# Round 4 — adversarial collapse-hunt (mission fidelity only)

**Target**: `docs/architecture-context-oracle.md`, primary focus **D10a — the genre
pipeline table** (never before reviewed).
**Axis**: mission fidelity only. *"Deliver the fact that would change the agent's
next decision, at the moment of that decision, without being asked."*
**Method**: per-genre end-to-end traversal from the anchor documents' own
enumerated criteria (corrected foundation's five conditions; RETHINK §2.3; the
twelve FR-A2 genres), then a cell-by-cell verification of D10a against the
decision that owns each cell, then an attack on the table as an artifact.
**Independence**: dispatched blind to the concurrent expert-review; not told
which decisions the author suspects.

**Verdict: the architecture does not survive round 4.** Sixteen collapses, four
of them inside repairs written in rounds 2 and 3, and four of them inside D10a
itself — the artifact built to prevent exactly this class. Every finding below
was established by reading the owning decision, never by grep.

---

## Part 0 — What D10a was for, and whether it did it

D10a's stated purpose: *"one row per FR-A2 genre, one column per pipeline joint …
A blank or `NONE` cell is a build-time error."* Its stated maintenance rule: *"a
fix must be **traversed, not inspected**."*

Two structural facts about the table decide most of what follows.

**(a) The table cannot detect a missing *column*.** "Blank cell = build error"
catches an unfilled joint only among the joints the author chose to columnise.
Two joints at which genres have already died in this project have **no column**:
the FR-A5 evidence floor, and D12/D13's trust-conditioned composition (what the
whisper may actually *say*). A genre can traverse all nine columns and still be
undeliverable. That is R4-C1.

**(b) Three of the nine columns cannot fail.** `Durability` reads `durable` in
13/13 rows. `Lane` is a restatement of `Trigger`. `Grounding pointer` reads
`repo span` or `commit` in 8/13 rows without reference to whether the source
table has a provenance block (three do not). A column whose every cell is the
same value is not a joint under test; it is a column that was filled to satisfy
the no-blank-cells rule. R4-C3 and R4-C14.

The table did real work — it is how R4-C7, R4-C13 and R4-C16 became visible at
all, and note 2's answer-drift predicate is a genuine improvement over the prose
it replaced. But as an instrument it currently certifies more than it tests.

---

## Part 1 — The genre traversal, and where each one breaks

Traversal order is the pipeline: trigger → retrieval → grounding → bar →
budget → assembly → delivery → audit → learning.

| Genre | First joint that breaks | Finding |
|---|---|---|
| Orientation | retrieval (spec-required landmine arm has no writer) → *detector for the gap does not exist* | R4-C11 |
| Coupling | **grounding** — the pointer the cell names is not in the schema | **R4-C3** |
| Coupling (helper half) ⛔ | retrieval (no writer) — correctly stated | — |
| Consequence | bar — the only live content is `trivial`, and note 1 says otherwise | R4-C2, R4-C16 |
| Warning ⚠ | assembly (FR-D3's own example is unrenderable under D13) → learning (uptake = compliance) | **R4-C1, R4-C4** |
| Completeness | trigger — FR-A2's free arm was dropped; grounding — same as Coupling | R4-C13, R4-C3 |
| Verification | bar — the exception that lifts it cites a mining behaviour D16 does not have | **R4-C7** |
| Assumption check | bar — `self_serve_class` is asserted per genre for a per-fact function | R4-C2 |
| Steering | bar — the exception's mechanism is not its stated bound and lifts every candidate | **R4-C8** |
| Answer | retrieval — the FTS index covers symbol names and paths only | R4-C15 |
| Unknown | bar — granted `invisible` in violation of the exception's declared narrowness | R4-C2 |
| Process | **delivery** — cannot fire at the moment the cell claims it fires | **R4-C12** |
| Answer drift | trigger — the resolution predicate scores abandonment as an answer | **R4-C9, R4-C10** |
| *(all genres)* | learning — no producer, no input, and the evidence is droppable | **R4-C5, R4-C6** |

---

## Part 2 — Decisions attacked

Each item gives the collapse question **the author did not write**, verbatim, then
the verdict.

---

### R4-C1 — D10a's column set omits the two joints at which genres have already died — COLLAPSES

**Question:** *"Your table's premise is that a genre dies at a joint no single
decision owns, so you gave each joint a column. Point at the column that says
what the whisper is allowed to **say**. D13 makes pointer-only the default for
**all** repo-derived spans; FR-D3's normative example whisper — the one AC-5
tests — reads `(generated-header marker; written by "npm run build")`, two
repo-derived spans, and D13's own rendering example silently drops one of them.
Process must 'name the skipped step' (AC-19) from `skill_expectations.step_text`,
which D14 itself says supplies no `claim_text` when its trust label is
`untrusted_repo`. Both genres traverse all nine of your columns and arrive at the
assembler with nothing they are permitted to utter. A table that makes gaps
visible has no column for the gap that is currently killing two genres."*

**COLLAPSES.** Class: **reduction** (the table's own purpose narrowed to the
joints already contested).

**Why it is hollow against the mission.** The mission is to deliver *the fact*,
not a pointer to a place where a fact might be. RETHINK §6 fixes the unit as "one
topic, one to five sentences, always with a verifiable pointer" — pointer *plus*
claim, not pointer *instead of* claim. D13's pointer-only default (a round-1
repair) is correct as an injection control and was never traversed against the
two genres whose content is inherently repo-derived text. The result is a warning
that cannot say what will overwrite the file and a Process whisper that cannot
name the step. Round 3 filed this for Process (C10); the repair added a *row* for
Process to D10a rather than a *column* for renderable content, so the identical
defect in Warning was never seen.

The FR-A5 evidence floor is the second missing column. FR-A5 binds the floor to
*"any whisper delivered in the FR-D3 ⚠ format, i.e. the Warning genre and
completeness whispers escalated to warnings"* — a floor expressed in co-change
support ≥ 3, applied to a genre (generated-file warning) that has no co-change
evidence at all. Whether the Warning row can ever clear its own floor is
undecided, and there is no cell in which the undecidedness could show.

**Fix.** Add two columns and re-walk all thirteen rows:
- **Renderable content** — for each genre, the exact span classes the assembler
  may emit (oracle-computed / pointer / human-trust text / mechanical-trust
  text), naming the trust label the source carries. Resolve the two failures it
  exposes: give the mechanical zone/verify path a `trust='mechanical'` carve-out
  for oracle-extracted identifiers (a package.json script name the *indexer*
  extracted is mechanically-derived metadata, not a quoted repo span), and
  decide explicitly whether AC-19's "name the step" is satisfiable — if not, say
  so and revise AC-19 rather than shipping a genre that fails its own fixture.
- **Evidence floor** — per genre: which floor applies (warn-grade, suggestion,
  none) and, where none applies, the sentence in FR-A5 that exempts it.

---

### R4-C2 — `self_serve_class` is a per-genre constant for a per-candidate function — COLLAPSES

**Question:** *"Step 5a defines `self_serve_cost` as a function of **(fact,
consumer state)** — its high class enumerates fact kinds, its zero case is driven
by this consumer's read set. Your column gives it **one value per genre**. Name
the fact that makes Assumption-check `invisible` when its own store-source cell
reads 'any contradicting fact' — which includes the `symbols`/`ref_edges` rows
your Steering row calls `trivial`. Criterion 2 spent a full round as prose
because it was asserted at the genre level; you have just re-asserted it at the
genre level in the artifact built to stop that."*

**COLLAPSES.** Class: **wrong-check** (the level of the check is wrong, so the
check cannot fail).

**Why it is hollow against the mission.** RETHINK §2.3 — *"marginal value over
the agent's own abilities is the only relevance metric that matters"* — is a
property of a specific fact in front of a specific agent at a specific moment,
which is why step 5a wrote it as `(fact, consumer)` and why the "demonstrated
reach" rule drives it to ≈0 per consumer. A genre-level constant restores exactly
the reasoning that round 2 collapsed: the traceability matrix answering P5 with a
design intent. Three rows are demonstrably wrong at the fact level:

- **Assumption check = `invisible`.** FR-A2's canonical assumption-check is
  *"narration assumes X; evidence says Y at `file:line`"* — a static-structure
  contradiction, i.e. a `trivial`-class fact under 5a's own taxonomy. The cell
  asserts the genre's best case and hides its normal case.
- **Unknown = `invisible`.** The bound fact is the negative-evidence fact
  `{evidence_pointer: 'query:<terms> → 0 results'}`. Its payload is literally one
  `Grep` away — it is the most self-servable object in the store. What is *not*
  self-servable is that the oracle knew to ask. That is the mapping-exception
  shape, and step 5a declares the exception available to exactly two genres and
  *"not available to a genre that wants to re-describe a trivial payload as
  valuable."* Unknown was given the benefit and denied the justification.
- **Consequence = `trivial (call-sites)`** — see R4-C16.

**Fix.** Delete the column's per-genre values. Replace with a per-genre statement
of **which fact classes the genre may bind to and the `self_serve_cost` each one
carries**, so a row that can bind to both invisible and trivial facts says so —
and add the consequence: a genre whose only v1-available fact class is `trivial`
does not clear the bar and must be marked ⛔, not `trivial`. Re-run 5a's own
fixture rule (AC-16a) per fact class, not per genre.

---

### R4-C3 — Coupling's grounding pointer does not exist in the schema — COLLAPSES

**Question:** *"Your Coupling row's grounding pointer is `commit hash`. Open D6
and read the row it binds to: `cochange_file_pairs(a, b, pair_count, a_count,
b_count, last_ts, PRIMARY KEY(a,b))` — no commit hash, and, unlike every other
knowledge table, **no `…prov` block at all**, which D6's own preamble makes
mandatory and FR-K6 makes unrepresentable-if-absent. D17 then *rejects on
purpose* the one structure that could supply a commit — 'storing full per-commit
transaction lists as the query model'. So D12 Move C's grounding check ('commit
exists') has nothing to resolve, AC-1's 'git-history pointer' has nothing to
render, and AC-6's 'every pointer resolves' fails on the highest-value signal the
tool has. Which commit does `[oracle] (coupling) … 16 of its last 20 commits`
point at?"*

**COLLAPSES.** Class: **unverified** (a cell asserted without reading the table
it names) compounding **decision-hiding** (the provenance the schema was built to
make structural is absent from three of its own tables).

**Why it is hollow against the mission.** P4 — *"Provenance on every claim …
every whisper carries at least one verifiable pointer"* — is not decoration; it
is what makes a whisper checkable rather than a rumour (RETHINK §6: "a whisper the
agent can't check is a rumor"). Co-change is, in RETHINK §4's words, *"the single
highest-value signal"* and the entirety of the Phase 0 product's non-obvious
content. The genre that carries the mission in Phase 0 cannot satisfy the
principle that makes its output trustworthy.

`ref_edges`, `invariant_members` and `open_questions` are missing the same block.
`ref_edges` is the store source for Steering and half of Consequence; both of
their grounding cells read `repo span`.

**Fix.** Two moves, both cheap:
1. Give `cochange_file_pairs` / `cochange_symbol_pairs` a provenance block whose
   `prov_kind='commit'` and whose `prov_ref` is the **bounded re-runnable query**
   D6 already introduced for negative claims — `git log --no-merges --follow -- A
   B` scoped to the mined horizon — plus `last_commit_hash` (the most recent
   commit in which the pair co-changed), which D17 already streams and discards.
   One hash per pair is O(pairs), not the per-commit transaction list D17
   correctly rejected.
2. Add the same block to `ref_edges` and `invariant_members`, and give
   `open_questions` the `session`-kind provenance D6 defined in round 3 (see
   R4-C9). Then re-walk the `Grounding pointer` column: it currently asserts a
   pointer class for eight rows without any of them having been checked against
   the schema.

---

### R4-C4 — Warning's uptake predicate measures compliance, which D10 step 9b exists to forbid — COLLAPSES

**Question:** *"Step 9b's whole point is 'uptake must measure influence, not
compliance', and it specifies the detector as 'the whisper's **subject** being
subsequently edited, tested, or referenced by **any** route'. Your Warning row's
uptake predicate is **'edit abandoned or zone respected'** — the subject *not*
being edited. You inverted your own rule in the one genre where P2 and FR-D3 go
furthest out of their way to protect the agent's freedom to proceed: the whisper
literally ends 'If this classification is wrong, proceed, and say so in your
narration.' An agent that reads a correct warning, understands it, and proceeds
anyway now scores as non-uptake **and**, under FR-L3, as a false fire. What
number in `status` distinguishes 'the warning worked and the agent overrode it'
from 'the warning was noise'?"*

**COLLAPSES.** Class: **wrong-check**, with a **posture** edge — it makes
obedience the success metric for the only genre the owner explicitly refused to
let block (OWNER-3: *"every intervention, including generated-file protection, is
a loud warning whisper"*).

**Why it is hollow against the mission.** The mission delivers a fact so the
agent can decide; RETHINK §6 makes the agent "the decision-maker" and P2 caps the
worst case at a wasted sentence. A metric that reads compliance as success and
independence as failure converts the advisory genre into a gate measured by its
conviction rate. Worse, the §9.2 ladder consumes false-fire rate: a warning
correctly delivered and correctly overridden pushes the genre toward probation at
10% and, absent 9b(ii)'s carve-out, toward suppression at 25%. The one genre the
owner insisted stay advisory is the one whose metric punishes advisory outcomes.

**Fix.** Apply 9b(i) as written: Warning's uptake predicate is *the subject file
or its editable source being subsequently opened, edited, or the named build
command run* — evidence the agent engaged with the fact, whichever way it decided.
Keep FR-L3's false-fire clause for what it actually says: a warning is false when
narration corrects it or the outcome contradicts it, **not** when the agent
proceeds. State in `status` the two counts separately: "warnings acted on",
"warnings knowingly overridden", "warnings contradicted".

---

### R4-C5 — the uptake column names thirteen predicates and no producer, and closes the escape hatch that made that safe — COLLAPSES

**Question:** *"Note 4 says 'Every uptake predicate is now named.' Name the
component that evaluates 'narration corrected', 'question not re-asked', 'gap
named in a later user turn', 'claim retracted'. FR-L2 gives the distiller *'that
log plus the session diff'*; D21 adds diagnostics findings. **The transcript is
not an input to the distiller anywhere in this document** — and six of your
thirteen predicates are transcript predicates. Meanwhile note 4's own escape
hatch — 'where an honest predicate does not exist, `status` renders "no uptake
detector" and the §9.2 ladder **excludes** the genre' — is now unreachable,
because you filled every cell. You have moved thirteen genres from 'excluded from
the automatic ladder' to 'governed by the automatic ladder on numbers nothing
produces'. Round 3's finding was that four genres had no detector; naming a
detector is what stopped them being counted."*

**COLLAPSES.** Class: **mechanism-not-mission** + **decision-hiding** (the
deciding step is named, never designed, and the naming disables the safeguard).

**Why it is hollow against the mission.** P7 is *learn or plateau*; the ladder is
what keeps the tool honest (TRICORDER-15). A ladder driven by unproduced numbers
does not plateau — it degrades, and it degrades toward silence, because an
undetected uptake reads as zero. This is the silence ratchet step 9 was written
to prevent, re-entered through the metric rather than the bar. And it is
invisible: `status` reports "hit rate 4%" with the detection method named
(9b(iii)) but not with the detection method's *inputs* named, so the owner reads a
number whose real value is "not measured".

**Fix.** Three parts, none optional:
1. **Give the distiller its input contract, in D21 or a new decision**: session
   log, whisper audit spool, session diff, diagnostics, **and the transcript**
   (with D19 scanning applied) — and say whether it has a model path. Six of the
   predicates are language judgments; a distiller with no model can evaluate none
   of them.
2. **Split the column into `uptake predicate` + `evaluated by` + `input`.** Any
   row whose `input` is not in the distiller's contract is ⛔, not filled.
3. **Restore note 4's escape hatch as a live path**: a genre whose predicate is
   not yet evaluable renders "no uptake detector — hit rate not measured" and is
   excluded from the ladder. That sentence is only worth writing if some row can
   reach it.

---

### R4-C6 — the anti-silence-ratchet's only evidence lives in D24's disposable write class — COLLAPSES

**Question:** *"Step 9a's fix — the one that stops the warn-grade floor being a
one-way ratchet — is: 'every candidate that failed **only** an evidence floor is
logged to `session_log`', and floor lowering is permitted **only** from that
evidence. Step 9's regret proxy and 9b's uptake detection read the same table.
Now open D24: `session_log` candidate traces are in the **disposable class**,
'may be dropped on contention beyond `busy_timeout` with a diagnostic'. So the
sole permitted basis for ever lowering a floor is droppable telemetry — and every
drop moves the tool one notch further toward permanent silence, in the exact
direction a non-programmer owner cannot observe. This is round 2's Collapse 4
verbatim, one table over: 'fail-open is right for latency, wrong for the
oversight control.'"*

**COLLAPSES.** Class: **wrong-check** (fail-open applied to a control whose
failure mode is invisible), and it is a defect created by one round-2 repair
(D10 step 9a) landing on another round-2 repair (D24's two write classes) without
either being re-traversed.

**Why it is hollow against the mission.** D24's own collapse test states the
standard: *"only genuinely disposable telemetry drops."* Step 9a promoted
`session_log`'s near-miss records from telemetry to the load-bearing evidence of
whether the tool is *"silent because it is calibrated for someone else's
repository"* — 9a's own words, and it names that count as *"the only number that
can tell the owner"* that. A number with that job is not disposable. The mission
fails silently when the oracle holds the fact and does not speak; this is the one
mechanism designed to detect that, and it drops under load.

**Fix.** Add a third write class in D24, or promote the affected rows: **the
below-floor near-miss records, uptake evidence, and regret-proxy inputs are
durable** — written to the same append-only JSONL spool as the FR-X6 audit record
(the pattern D24 already established and proved cheap), projected into
`session_log` for relational query. Leave *candidate traces for events that
produced a whisper* in the disposable class; those genuinely are telemetry.
Re-state D24's disposable class as an enumeration of what may drop, not a
category, so the next requirement that lands in `session_log` has to be classed
explicitly.

---

### R4-C7 — Verification's mapping exception cites a mining behaviour D16 does not have — COLLAPSES

**Question:** *"Your exception says the bound fact is 'the `region_glob` →
`command` association … a repo-specific association **D16 mines from test
topology and path conventions**'. Read D16. Its verify-commands extraction is
'**package.json scripts per workspace dir**; pytest/tox presence'. Test topology
is a *different* extraction feeding a *different* table. So `region_glob` is the
directory that contains the `package.json` — and on a single-package repository,
which is the common case and the fixture case, `verify_commands` holds **one
row**: `**` → `npm test`. Your exception lifts `self_serve_cost` from 0.15 to
0.85 on the strength of a mapping that maps everything to one command. That
whisper **spends the agent's turn** under OWNER-12's accepted cost. What is the
agent learning that `cat package.json` would not have told it?"*

**COLLAPSES.** Class: **unverified** — and it is the *second* inversion inside
this same exception. The first (`test_map` named where `verify_commands` holds the
association) was caught by traversal after the exception was written; this one
survived because the correction re-read D6 and never re-read D16.

**Why it is hollow against the mission.** P5 and RETHINK §2.3 are the reason the
exception has to be argued at all: *"handing them thousands of tokens of material
they could surface themselves in three tool calls is noise that crowds out the
signal."* "Run the test script in the package.json of the workspace you edited"
is one tool call and zero repo-specific knowledge. And this is the genre that
pays the highest delivery price in the system — a continuation, the cost the
owner bounded and audited by name. Spending a turn to say `npm test` is the exact
trade OWNER-12's ruling was not about.

**Fix.** Either make the mapping real or drop the exception:
- **Real:** specify in D16 the derivation the exception claims — join `test_map`
  (test file → source region, which D16 *does* extract from path conventions and
  import edges) to the commands that execute those test files, so
  `verify_commands` carries a region→command association that a package.json read
  cannot produce (e.g. `src/settings/**` → `npm test -- settings`). Then the
  exception is earned, and the cell should name **`test_map ⋈ verify_commands`**,
  not `verify_commands` alone.
- **Drop:** if that derivation is Phase 2, mark Verification ⛔ for v1 with the
  reason, and do not let a turn-spending genre ship on a mapping with one row.
  Note that D20 lists verification in the FR-J3 degraded set, so this decision
  changes the Phase 0 product and must be reflected there.

---

### R4-C8 — Steering's mapping exception lifts every Steering candidate, and contradicts the base rule with no combination rule — COLLAPSES

**Question:** *"You call the exception 'deliberately narrow' and say Steering
'fires only when the agent is provably looking in the wrong place'. The predicate
you actually wrote is: 'its reads and searches are in a region that **does not
contain** the location.' That is satisfied by an agent that has read nothing, an
agent early in a session, and an agent legitimately reading elsewhere first. Not
having looked somewhere is not evidence of looking in the wrong place — it is the
default state of every fact the oracle would ever speak. So the exception fires
for essentially all Steering candidates, which is precisely 're-describing a
trivial payload as valuable', the thing you forbade one sentence later. And
separately: `self_serve_cost` is 'derived from the fact's own provenance class
**plus** what this consumer has already done'. The provenance class of a
`symbols`/`ref_edges` location is 0.15; the consumer clause says 0.85. Which
wins? Two implementers, two store-of-record answers — the F5 defect D5 fixed by
deleting one of two rules."*

**COLLAPSES.** Class: **wrong-check** (the predicate implemented is not the
predicate justified) plus an unresolved rule conflict.

**Why it is hollow against the mission.** The correction note attached to this
exception is honest and correct — it removed a fabricated fact class and grounded
the lift in Tier 3. What it did not do is check that Tier 3 can carry the second
conjunct. D15's Tier 3 enumeration is *"files seen, symbols searched, whispers
sent (with subjects for dedup), uptake evidence, open questions, skill
expectations, token spend, orientation-decay counter."* There is no intent state
— RETHINK §4 Tier 3 names *"the current intent hypothesis"* and the architecture
carries it nowhere (the phrase appears zero times in the document). So the clause
"while its narrated intent does [contain the location]" has no state to read, and
the deterministic factor collapses to the half that is nearly always true.

**Fix.**
1. **Make the predicate mis-reach, not non-reach.** The lift requires *positive*
   evidence of a wrong region: the consumer's reads/searches are concentrated in
   region R, the candidate's location is in region R′ ≠ R, **and** R and R′ are
   disjoint under the D16 topology. An empty read set gets no lift.
2. **State the combination rule** in step 5a: consumer-state evidence *overrides*
   the provenance-class base value for the mapping-exception genres, and the
   result still meets the model's `non_obviousness` by minimum. One rule, in one
   sentence, as D5 rule 1 does for repo identity.
3. **Add the intent hypothesis to D15's Tier 3** (RETHINK §4 requires it; three
   mechanisms now need it) or delete every rule that reads it.

---

### R4-C9 — answer-drift's resolution predicate scores the user giving up as an answer, and doubles as its uptake predicate — COLLAPSES

**Question:** *"Read your own resolution rule's second disjunct: a question is
**resolved** 'when the next user turn neither restates the question nor repeats
its subject tokens.' That is the user moving on. FR-A9 exists because the owner's
direct question went unanswered — OWNER-9's words are 'the user's direct question
going unaddressed across successive turns'. Your predicate marks the canonical
failure — the agent ignored it, the user gave up — as **resolved**, so no whisper
fires. And your D10a uptake cell for the same genre is
'`open_questions.resolved` transitions', so on the occasions it *does* fire, the
user dropping the subject is recorded as the whisper **working**. The genre's
miss condition and its success condition are the same event."*

**COLLAPSES.** Class: **wrong-check**, of the same family as collapse-log
2026-07-17 item 1 (checking the easy property instead of the one that matters) —
here, checking *conversational continuation* instead of *whether the question was
answered*.

**Why it is hollow against the mission.** FR-A9 is one of the two genres the
owner added by name (OWNER-9), for the failure mode he described as *"mistakes
neither he nor the agent catches"*. A predicate that treats his silence as
satisfaction is the machine version of not catching it. And it is self-concealing:
the false resolutions suppress the whisper, and the true resolutions score as
uptake, so `status` shows a healthy genre that has never fired for the reason it
exists.

**Fix.**
- **Delete the second disjunct.** Resolution is (i) a later assistant turn
  containing ≥1 subject token *and* an answer-shaped construction, or (ii)
  explicit user acknowledgement, or (iii) session end. Nothing else. An
  unanswered question that the user abandons should end the session **unresolved**
  and be reported — that is a regret the distiller can count without an oracle of
  correctness, and it is a better up-signal than the explore budget.
- **Separate uptake from resolution.** Answer-drift's uptake is *the assistant's
  next turn addressing the question* (the same answer-shaped test), not the
  `resolved` flag, which is now reachable by three routes.
- **Give `open_questions` the `session`-kind provenance block** so the "bounded
  transcript scan" pointer the D10a row claims has a column to live in (R4-C3).
- Re-examine the third bullet ("not registered at all when neither test is
  mechanically decidable"): as written it asks deterministic code to decide
  decidability. State it positively, as the Process rule does — registration
  requires a detected interrogative construction *and* ≥1 extracted subject token;
  otherwise no registration.

---

### R4-C10 — a table cell moves answer-drift into Phase 0 and into FR-J3's degraded set, and nothing else in the lifecycle moved — COLLAPSES

**Question:** *"Note 2 concludes 'it **belongs in FR-J3's degraded genre set** and
runs in Phase 0', and D20's set was edited to match. FR-J3 is a **spec
requirement** whose degraded set is enumerated — 'minimal orientation …, coupling,
generated-file warning, verification, completeness' — and the spec was not
changed. Spec §12 puts the conduct genres in **Phase 1**. Your own build order
puts `narration/` readers at element **10** and the conduct genres at element
**12**, both after the Phase 0 exit at element 8 — and answer-drift cannot read a
user question without the narration reader. Phase 0's exit ACs are
AC-1..5/12/14/17/18; **AC-20, the answer-drift criterion, is not among them**. So
the architecture now ships, in Phase 0, a genre the spec places in Phase 1, built
from a component the build order places in Phase 1, tested by no Phase 0 exit
criterion. Which document is the authority?"*

**COLLAPSES.** Class: **decision-hiding** — a change to a spec-enumerated set and
to the phase boundary made inside a table note, where no reviewer of D20, the
build order, or spec §12 would encounter it.

**Why it is hollow against the mission.** CLAUDE.md's engineering standard is
explicit: *"a change to behavior updates the spec; a change to scope updates §2
and §14."* And the collapse log's own standing lesson from OWNER-12 is that *"when
a finding produces a ruling, the ruling lands in every artifact the lifecycle
consumes … a requirement that arrives between rounds inherits no reviewer."* This
is the same shape, self-inflicted: a requirement moved between phases in one
sentence, inheriting no reviewer.

The instinct behind it is right — *"Phase 0 is where the owner actually meets
it"* is a genuine mission argument, and answer-drift being deterministic is a
real finding. The defect is that the argument was applied in one place.

**Fix.** Either land the change everywhere or reverse it:
- **Land it:** update spec FR-J3's enumeration and spec §12 Phase 0/Phase 1 genre
  lists; move `narration/` question-extraction (not the whole reader) into build
  order element 7; add AC-20 to the Phase 0 exit; state in D20 what answer-drift
  costs in a degraded session. Then note 2's claim is true.
- **Reverse it:** answer-drift stays Phase 1, D20's set reverts, and note 2
  records the Phase 0 value as an IDEAS entry.

Either way, D10a needs a **Phase** column. Three rows currently carry phase
claims in prose (Orientation "structural-only in v1", Consequence "breakage ⛔
Phase 2", Answer-drift "runs in Phase 0") and the table has no cell that would
have made them collide with spec §12.

---

### R4-C11 — Orientation's spec-required landmine arm is descoped, and the check that would have surfaced it does not exist — COLLAPSES

**Question:** *"FR-J3 specifies degraded-mode orientation as 'structural entry
points **and literal-match landmines**'. Your row says 'Orientation ships
structural-only in v1'. Then note 1 says: 'Its expected fire rate is therefore
low, and **D21's `genre_dark` check must not flag it**.' Open D21 and count the
self-checks: wiring, latency, model path, store integrity, staleness, delivery
reconciliation, subagent narration, continuation accounting, delivery
confirmation. There are nine, and **none of them is `genre_dark`**. So you have
(a) dropped a spec-required element of the Phase 0 genre set, (b) pre-registered
the resulting silence as expected, and (c) instructed a detector that does not
exist not to fire. OWNER-10's exact words are 'it could fail a hundred ways in
front of me and I wouldn't know' — and the one paragraph in this document that
reasons about a genre going dark is the paragraph that tells the non-existent
detector to look away."*

**COLLAPSES.** Class: **unverified** (a citation landing on a component name that
is not there — the tell the collapse log names) compounding **reduction** (a
spec-mandated element dropped inside a note that congratulates itself on dropping
nothing: *"No genre is dropped from v1 … which is the difference between a stated
gap and the silent descoping round 2 predicted"*).

**Why it is hollow against the mission.** Orientation is the whisper at the
moment of maximum leverage — the task's opening — and RETHINK §5 makes landmines
its distinguishing content ("landmines matching the task's shape"). Stripped of
landmines and invariants, orientation is "2–4 entry-point files", which is
`trivial` under step 5a's own taxonomy and therefore below the bar (R4-C2). The
row is not "structural-only"; under this document's own bar it is dark. And the
premise for dropping it — "no v1 writer (D18)" — is itself wrong: D18 names
`human_facts` promotion (FR-L6) as a v1 writer for landmines and invariants, and
names a literal-match landmine path *because FR-J3 requires it*.

**Fix.**
1. **Build the check the note assumes.** Add a D21 self-check (10) *genre
   liveness*: per genre, whispers sent vs candidates generated vs events matching
   the trigger, over a session window, against a **declared expected fire rate**
   that becomes a new D10a column. A genre at zero against a non-zero expectation
   raises `genre_dark`. Without it, "silent because broken vs silent because
   correct" — D10's own stated standard — holds nowhere at the genre level. This
   also covers the `stop_hook_active` gate failing permanently open (a shim that
   cannot supply the field sends `true`, so a harness rename silences every
   stop-class whisper forever with no detector).
2. **Resolve the FR-J3 conflict as a conflict.** Either specify the literal-match
   landmine writer for Phase 0 (a marker/keyword scan over commit messages and
   file heads is well within D16/D17's existing passes) or take it to the spec.
   Do not settle a spec conflict by lowering a diagnostic's expectations.
3. Correct the "no v1 writer (D18)" cell: `human_facts` promotion is a writer.

---

### R4-C12 — Process cannot fire at the moment its cell says it fires — COLLAPSES

**Question:** *"Your Process row's delivery-cost cell reads 'spends a turn
**(fires at completion)**', and OWNER-12's ruling is that speaking at a completion
claim is the must-have. Now read D14's lag contract, which you measured: 'at event
N the freshest narration is turn N−1.' The completion claim **is** turn N. At the
`Stop` event the claim is not yet readable, so the detector cannot see it; at the
next readable boundary the turn has already ended. Then read your Lane column:
Process is **Lane 2**, ≈10.5 s of model call plus queue, against a 1,200 ms event
deadline. So the candidate must already be in the pool before `Stop` — judged from
a completion claim that had not yet been made. D14's own Collapse-C9 note warns
that 'a genre that is structurally always late presents as **correct silence**, and
nothing in the design would reveal it.' You wrote that warning and then filled the
cell as if the genre fires on time."*

**COLLAPSES.** Class: **mechanism-not-mission** — the cell describes the moment
the mission requires, not the moment the mechanism can reach.

**Why it is hollow against the mission.** The mission's second clause is *"at the
moment of that decision"*. OWNER-12 is the owner's ruling that this specific
moment is worth a continuation — *"the completion claim is the single
highest-value moment the oracle has"*. AC-19 requires the whisper on the
completion claim with the claimed action proceeding unimpeded. If the design
cannot see the claim at `Stop`, then either AC-19 fails at fixture time or an
implementer invents a synchronous transcript read on the hook path — which is
I/O on the deadline-governed loop, the thing D24 spent a decision removing.

Note this does **not** touch OWNER-12's existence; the capability is settled. It
touches whether the design delivers it.

**Fix.**
1. **Measure the lag at `Stop` specifically.** The freshness spike was taken at
   `PreToolUse` mid-turn; a turn that has *ended* may well be flushed. This is a
   one-hook, ten-minute experiment and it decides the genre. Do it before the
   plan.
2. **If the claim is readable at `Stop`:** Process needs a synchronous
   detection path, which means the mechanically-decidable subset D14 already
   specified (claim lexicon + registered `skill_expectations` + absence of a
   required tool signature in Tier 3) is **Lane 1**, not Lane 2 — the whole
   detector is a lexicon match plus a set-membership test on state the service
   already holds. Change the Lane cell and the Store-source cell accordingly.
3. **If it is not readable at `Stop`:** say so, and take the remedy to the owner
   *with the evidence*, because two of the candidate remedies (fire at the next
   `UserPromptSubmit`; fire at `SessionEnd` on the human channel) change what
   OWNER-12 ruled on. That is a real owner question of the OWNER-12 shape — not a
   design call to make silently.
4. Add the **delivery-lag measurement** D14 already promised (D26 replay:
   motivation-to-delivery boundary count and supersession survival rate per
   genre) to the Phase 1 exit, not to prose.

---

### R4-C13 — Completeness lost FR-A2's free trigger, so every completeness whisper now spends a turn — COLLAPSES

**Question:** *"FR-A2's Completeness trigger is '**edit completed** / stop'. Your
row's trigger cell says 'stop', and D10 step 4's Lane 1 enumeration says 'stop →
untouched partners'. The `PostToolUse` arm is gone from both. So the genre that
FR-A2 gave a **free** boundary now delivers only through the one channel that
costs the agent a turn and must clear `stop_bar_delta`. OWNER-12 accepted a
bounded cost at the completion claim; you have quietly routed a second genre's
entire output through that cost, and the row's own note calls it 'OWNER-12's
accepted cost' as though the owner had accepted this. Where did the
edit-completed arm go, and why is the cheaper delivery the one that was dropped?"*

**COLLAPSES.** Class: **reduction** — a spec-given trigger silently removed, with
the effect of enlarging the cost the owner bounded.

**Why it is hollow against the mission.** RETHINK §5 puts Completeness at "edit
completed" for a reason: *"you changed the reducer but not the selector"* is
actionable immediately after the edit, while the agent is still in the region,
and it costs nothing. Deferring it to `Stop` delivers the same fact after the
agent has decided it is finished, at the price of a continuation, behind a raised
bar. That is right-info-wrong-time — RETHINK §2.1's own failure mode — and it
converts a free whisper into a turn-spending one without an owner decision.

**Fix.** Restore the `tool_post` (edit completed) arm in FR-A2's terms: after an
observed edit, a co-change/invariant partner not yet touched in this session
becomes a Completeness candidate delivered on the *next* free boundary
(`PostToolUse` or the following `PreToolUse`), with `Stop` retained as the
last-chance arm at the raised bar. Update the D10a row to two triggers and two
delivery costs, and update D10 step 4's Lane 1 enumeration to match. Then re-check
note 3's claim that "two genres spend a turn" — with this fixed, Completeness
mostly does not.

---

### R4-C14 — `Durability` is a column that cannot fail, and where it could fail it is false — COLLAPSES

**Question:** *"Thirteen rows, thirteen `durable`. Say which write the column is
about. If it is the whisper audit record, D24 makes it durable for every whisper
by construction and the column is a constant — it can never be the blank cell your
maintenance rule is built around. If it is the **grounding fact's** write, then
open D24's enumeration: the durable class is 'the whisper audit record and
`suppressions`'; the disposable class is '`session_log` candidate traces, **Tier-3
flushes**'. `skill_expectations`, `session_evidence` and `open_questions` appear
in **neither** — and D15 says Tier 3 holds 'open questions, skill expectations',
so by D24's own words their flush is disposable. Your three conduct-genre rows
say `durable` about tables D24 either drops or never classified. Round 3 filed
exactly this (C9); the repair added a column asserting the opposite of D24
without editing D24."*

**COLLAPSES.** Class: **wrong-check** on the first horn, **unverified** on the
second. Either way the cell was filled without reading the decision that owns it.

**Why it is hollow against the mission.** A Process whisper whose
`skill_expectations` row was dropped under contention binds to a fact that no
longer resolves — D12 Move C then drops the whole whisper, and the conduct genre
the owner asked for goes silent under load with a diagnostic nobody reads. The
FR-X6 audit record survives (it is durable), so the audit trail records nothing
either, because nothing was sent.

**Fix.** Rename the column **`grounding-fact durability`** and make D24's
enumeration total: every table in D6 is explicitly durable or disposable, with
the rule that **any table that appears in a `Grounding pointer` cell is durable
by definition** — a fact a whisper must bind to cannot be telemetry. That single
rule closes this class permanently and would have caught R4-C6 as well.

---

### R4-C15 — the Answer genre's reach is an index of symbol names and paths; A0 buys reach the index cannot deliver — COLLAPSES

**Question:** *"Your Answer row's store source is 'FTS, A0-shaped', and the honest
cap you state is that 'an answer that lives only in code no **query term**
reaches' becomes 'I don't know'. Read D6's FTS tables: `fts_symbols`,
`fts_paths`, `fts_landmines`. There is **no content index** — not file bodies, not
comments, not commit messages (D19 lists commit-message ingestion as a scanning
boundary and D6 has no column to store one). So the cap is not about query terms;
it is that the searchable corpus is identifiers and paths. A0's stated purpose —
'semantic reach beyond raw token-match', synonyms, framework names — cannot reach
past an index of names, because a synonym for a concept that appears only in
prose or logic matches nothing. Round 2 collapsed the Answer genre as 'nicely-
phrased FTS'; the repair added a sub-turn that proposes better words to the same
name index."*

**COLLAPSES.** Class: **reduction** — the honest cap is stated at the wrong layer,
which makes it read as a bounded limitation when it is a structural one.

**Why it is hollow against the mission.** The Answer genre is the direct-address
channel (FR-S3, RETHINK §7) — the one place the agent *asks*. "Where do
notification preferences live?" is answerable from a name index only when the
concept happens to be a symbol or path name. When it is not, FR-S3's honest "I
don't know" is delivered — which is safe, but it means the genre's real reach is
much narrower than "retrieval-bounded" suggests, and the A0 model call (≈10.5 s,
≈$0.005, drawn from the agent's own quota per D10 step 8a) is spent proposing
terms against a corpus that cannot use them.

**Fix.** Say what the corpus is, in the Store-source cell and in the Limitations
entry: **Answer retrieval covers symbol names, file paths, and landmine text; it
does not index file content.** Then decide, explicitly: (a) accept the narrower
reach and **skip A0 when the shaped query would run only against name indexes**,
saving a model call and a budget slot; or (b) add a bounded content index
(FTS over the indexed files' text is a D16-scope addition, not a new dependency)
and keep A0, which then earns its cost. Option (a) is the honest v1; option (b)
should go to IDEAS with the measurement that would justify it.

---

### R4-C16 — note 1's justification for keeping Consequence is falsified by Consequence's own cell — COLLAPSES

**Question:** *"Note 1 keeps Consequence in v1 on this reasoning: 'Both degrade to
a working genre rather than a dead one (co-change carries Coupling; **call-sites
carry Consequence**), which is why neither descopes.' Two cells to the left, the
same row classes call-sites as **`trivial`** — step 5a's ≈0.15 class, the class
whose entire purpose is to keep 'there is a helper for the symbol you just
grepped for' below the bar. So the fact that 'carries' Consequence is the fact the
bar is designed to suppress. Consequence at `PreToolUse` is what RETHINK §5 calls
'the golden moment, the last cheap point to alter course.' On this row it is dark
in v1, and the note that says otherwise is the only thing standing between that
and a ⛔."*

**COLLAPSES.** Class: **reduction**, delivered by a summary note that contradicts
the table it summarises.

**Why it is hollow against the mission.** The pattern is the one the collapse log
already named: a row is declared healthy at the point of the finding rather than
by walking the row. Note 1's three-bullet summary is the part of D10a most likely
to be read and least likely to be re-derived — the same position the deleted
self-verification block occupied.

**Fix.** Mark **Consequence ⛔ for v1** with the honest reason (its only
above-bar content — historical breakage — is Phase 2 mining), or give it
above-bar content in v1. The obvious candidate is already in the store:
co-change partners of the file *about to be edited*, which is `invisible`-class
and which the row already lists as a store source but does not use. That is a
one-line change to the row and it makes the genre live. Then re-check note 1 —
after C7, C11 and this, its "no genre is dropped from v1" claim needs re-deriving
from the corrected cells, not restating.

---

## Part 3 — Attacked and survived

Reported so the next round does not re-spend effort here.

**D24 — the logged-before-sent audit guarantee. SURVIVES.**
*Question:* *"'The audit append happens before the whisper is returned to the
shim' puts an `fs` append on the deadline-governed reply path. On a full disk or
an fsync stall, the whisper is late or lost — you have moved a failure from the
audit channel onto the agent's latency budget."* Survives: the failure direction
is an *unspoken* whisper, which is P1's safe direction and P2's worst case, and
the deadline governor bounds the stall to silence. FR-X6 remains true by
construction. The trade is stated correctly in the decision.

**D11 — the three-layer recursion guard. SURVIVES.**
*Question:* *"cwd isolation rests on the run directory having no `.claude/` — but
the run directory is under `$HOME`, and the CLI reads user-scope settings. If a
future `init` or a user ever wires the oracle at user scope, layer 1 is void."*
Survives: D22 forbids user-scope wiring by decision and gives the reason
(per-project consent, C-4), `CTXORACLE_INTERNAL=1` is layer 2 and is checked as
the shim's first statement, and AC-11 asserts the property against the shipped
command rather than a proxy. The layers are genuinely independent.

**D10 step 5 — the `stop_hook_active` gate. SURVIVES as a bound.**
*Question:* *"A shim that cannot supply the field sends `true`, so a harness
field rename makes the oracle permanently silent at `Stop` — the moment OWNER-12
called the highest-value one — and D21 check 8 counts continuations, so zero
reads as good news."* The gate itself survives: fail-safe in the silence
direction is correct, and the bound is what OWNER-12 explicitly accepted. The
*detection* gap is real and is folded into R4-C11's fix (a genre-liveness check
with declared expected fire rates), not filed separately.

**D12 — trust-conditioned composition. SURVIVES as a control.**
It closes the paraphrase carrier correctly and at genuinely low mission cost for
the co-change/zone/human-fact genres. Its unpriced consequence for skill text is
filed under R4-C1, which is a missing column, not a broken control.

---

## Part 4 — Partials (real, below collapse threshold)

- **P1 — the explore budget still has no stop-class exclusion.** Step 9(a)
  excludes warn-grade genres but not stop-class candidates, so a below-bar
  candidate can be delivered at `Stop` for telemetry — spending the agent's turn
  on a whisper the bar rejected. Round 3 raised this (C5); the current text is
  unchanged. Add "never on stop-class candidates" beside "never on warn-grade
  genres", and the explore budget stays clean.
- **P2 — commit messages are ingested and scanned but never stored.** D19 names
  "miner commit-message/diff ingestion" as a scanning boundary; D6's `commits`
  table has no message column and no FTS over messages. Either the boundary is
  vestigial or a table is missing. Bears on landmine mining (Phase 2) and on
  R4-C15's corpus question.
- **P3 — `whisper_log` has no `explore` flag.** Step 9(a) tags explore
  deliveries and the distiller must measure their uptake separately; the schema
  carries `genre`, `confidence`, `uptake`, `false_fire` and no tag. A one-column
  omission that silently merges explore results into the genre's hit rate — the
  opposite of what the explore budget is for.
- **P4 — D10a has no Phase column.** Three rows carry phase claims in prose and
  one of them (R4-C10) contradicts spec §12. Folded into R4-C10's fix.

---

## Pattern this session

Rounds 2 and 3 named their shapes: *the hard part relocated into an unspecified
deterministic step*, then *the hard part as a named noun with no producer*. This
round's shape is the next move in the same sequence, and it is the sharper one:

> **The gap was given a cell, and the cell was filled from the fix rather than
> from the decision that owns it.**

D10a is a good instrument aimed at a real problem, and it is where nine of this
round's sixteen collapses live — not because the table is wrong to exist, but
because filling a cell *feels* like traversing a row. Every one of the nine was
found the same way: read the cell, then open the decision it names and read that.
`commit hash` against a table with no provenance block. `verify_commands` against
a D16 that mines package.json, not test topology. `durable` against a D24 whose
enumeration does not contain the table. `genre_dark` against a D21 with nine
checks and no such check. `Lane 1 / degraded set` against a spec that says Phase 1.
None of these required judgment; they required opening the other file.

Two structural lessons, binding on round 5:

1. **A cell is a claim about another decision, and must be verified there, in
   both directions.** The two inversions the author caught while writing D10a
   (`test_map` for `verify_commands`; a fabricated intent→location fact class)
   were found the same way and were treated as isolated slips. They were the
   first two of eleven. Any future artifact that summarises across decisions —
   a table, a matrix, a note that says "both degrade to a working genre" — is
   the highest-risk text in the document, for the same reason the deleted
   self-verification block was: it is what a downstream reader trusts most and
   re-derives least. The standing instruction against restoring a summary
   attestation should be widened: **a cross-decision summary carries, per cell,
   the decision and the line it was read from, or it is not evidence.**

2. **The joints did not go away; they moved down one level.** Round 3's lesson
   was that collapses live between decisions. This round they live *between a
   cell and its decision* — a strictly narrower gap, which is progress, and a
   strictly easier one to close mechanically. Three of the sixteen (C3, C6, C14)
   are the same defect wearing different names: **a fact a whisper must bind to
   was treated as telemetry or as schema-optional.** One rule closes all three
   and prevents the class: *any table named in a `Grounding pointer` cell is
   durable and carries a provenance block, by definition.* Write the rule into
   D6 and D24, not into the table.

A closing observation about the ⛔ convention, since the brief asked about the
rows declared resolved. ⛔ is doing honest work — it is the reason Coupling's
helper half and Consequence's breakage half are visible at all. But it is applied
only where the author already knew the gap. Of the four genres that are in fact
dark in v1 under this document's own bar (Orientation, Consequence, Verification,
and — pending the `Stop` measurement — Process), **none carries a ⛔ on the row
itself**; three carry prose that says the opposite. The convention is sound; its
application is where the optimism went.
