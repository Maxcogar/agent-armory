# Collapse-hunt — "Phase 1's exit is missing a procedure, not a threshold" (2026-08-01)

*Independent adversarial pass, fresh subagent, never the author. **Written once,
never edited.*** Run before anything was written.

**Verdict: the proposition does not survive — and it took the §14 finding it was
built on with it.**

## F1 — The finding is false as written. Phase 1's exit DOES resolve to acceptance criteria.
*"Read Phase 1's exit sentence to its end. Does it contain an AC list?"* It does:
*"Exit: AC-6..AC-8, AC-11, AC-16, AC-19, AC-20 pass (AC-21 contingent per §14);
measured silence and hit rates reviewed against the bar."* And **all three** phases
are ACs plus a trailing measurement clause with no threshold — Phase 0's is *"the
owner runs it on a real project without incident"*, Phase 2's is *"a demonstrated
case of the oracle measurably improving between sessions."* A uniform, deliberate
feature of §12 was presented as a Phase-1-specific defect. **Class: unverified.**

**What survives after correction, much narrower:** of the three trailing clauses,
Phase 1's is the only one naming **neither an actor nor a failure condition**.
Phase 0 names the owner and "without incident"; Phase 2 names an event-shaped rule.

## F2 — AC-2 is the wrong exemplar twice over.
A category mismatch — AC-2 is a *test* against a fixture replay definable today;
the trailing clause is a *measurement* of live sessions, and §12 separates the two
explicitly. And the exemplar is itself an open item: STATUS records that AC-2
depends on the model judgment, which is Phase 1, so it cannot be run in the phase
whose exit it gates. **Class: wrong-check.**

## F3 — Premise 2 proves too much, and its own remedy is the first casualty.
*"If measuring-against-nothing forbids a number, why not an observation window and
a genre scope — also quantities about a run that has never happened?"* D-14 sets a
number pre-data and survives because it operationalizes a principle already written
(P1, silence is the default) and is checked against a fixture. The proposition's
own premise refutes two of the four things it wants written.
**Class: mechanism-not-mission.**

## F4 — "Which genres are in scope" is the build-plan exclusion lever killed twice already.
§12's own table ties hit rate to *"per-genre admission"*. Writing genre scope into
an exit converts a runtime, per-candidate, tunable judgment into a phase-gate
admission test — the manual form of the auto-retirement the architecture already
forbids. **Class: reduction, third recurrence.**

## F5 — "Who reviews" is already written, in the file whose job it is.
CLAUDE.md: *"Design, build, verification, sequencing, and process are yours."* The
form is written too (FR-M2's plain-language `status`). And where a metric review is
genuinely the owner's, the spec already names him — the conduct-genre false-fire
review. **Class: posture** (re-deriving a written rule and presenting it as a
judgment call).

## F6 — Reading (4) is correct and is the spec's own reading; the "missing procedure" framing misdescribes the defect.
*"A hit rate is a fraction of whispers. What unit comparison is 'reviewed against
the bar' supposed to be?"* Four passages fix it as a tuning input: P1 and FR-A5
define the bar as a send gate; RETHINK states the operation — *"Ship with the bar
set high and lower it against measured hit rate"*; §12's own table gives silence
rate's purpose as *"the FR-A5 bar's operating point"*; and exits are *"measurements,
not tests."* A tuning input has no threshold by design. **Class: wrong-check.**

## F7 — The clause's *function* is disputed between the two governing documents.
§12 places it after "Exit:"; CLAUDE.md's lifecycle amendment reads the identical
sentence as gating Phase 1's *design*, fed by Phase 0's run. Settleable today with
no measurement, and it decides whether an exit procedure is even the right
artifact. Neither the proposition nor the §14 item asks it.
**Class: decision-hiding.** *(Adjudicated separately the same day — see
`2026-08-01-adjudication-entry-vs-exit-gate.md`.)*

## F8 — Self-serving, in a specific checkable way.
Strike everything premise 2 forbids, everything already written, and everything
forbidden: what remains is "state a decision rule", which is written in RETHINK.
Net new content ≈ zero, at the cost of a fourth edit to a section edited and
reverted three times that day. **Is the underlying finding real?** Real in
substance (F1's narrow form), **inflated in every stated particular** — including
a ranking claim over two open items with no basis.

## F9 — Does it create an exit that can never fail? Partly — but so does the status quo, by design.
The exit's falsifiable half is the AC list; the measurement half has one available
failure mode needing no threshold — the named measurement cannot be produced —
which is live today and already written.

## F10 — The proposition sidesteps the question that actually blocks the clause.
Hit rate's producibility is an open item; every element of the proposed procedure
is written *about* that metric and inherits its unsettledness.
**Class: wrong-check.**

## Verdict
**Write now:** correct the §14 item to its verified form; record F7 as the item
that replaces it; add the one derivable failure condition only if F7 resolves to
the exit reading, as a pointer not a copy.

**Must wait for Phase 0 to run:** any numeric threshold; the observation window;
per-genre reporting of any kind.

**Never write:** a named reviewer for Phase 1's exit — CLAUDE.md decides it.

**Most dangerous unexamined assumption:** that the sentence is an exit condition at
all.
