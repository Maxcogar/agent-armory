# Collapse-hunt — the Phase 0 genre-cut proposal (2026-08-01)

*Independent adversarial pass, fresh subagent, never the author. **Written once,
never edited.*** First hunt of 2026-08-01. Filed late, on 2026-08-01, when an
audit against `docs/reviews/README.md` found four of the day's six hunts had no
file.

**Target:** a proposal to cut Phase 0's genre set from five (spec §12's reference
to FR-J3) to three — coupling, generated-file warning, completeness — deferring
orientation and verification.

**Verdict: 14 findings. The proposal does not survive.**

## F1 — The deferral has no destination. It is a descope wearing a schedule.
*"Name the phase."* Spec §12's Phase 1 and Phase 2 lists contain neither
orientation nor verification. D10a's standard for an honest gap is a live genre
with deferred *content* and a named filling condition; this deferred the genres
themselves. Sequencing is the agent's call, scope is the owner's — a deferral with
no destination converts one into the other. **Class: reduction.**

## F2 — Acceptance-criterion coverage used to define scope; traceability runs the other way.
The premise is TRUE — of Phase 0's nine exits only AC-1 and AC-5 name a genre. But
criteria verify requirements; requirements define scope. And the rule was applied
asymmetrically: no Phase 0 AC names completeness either, and completeness was
kept. Two incompatible rules in one decision is the signature of a conclusion
reached first and justified after. **Class: wrong-check.**

## F3 — "The rest is infrastructure" is false for AC-2 and AC-3, and cutting genres makes both easier to pass.
AC-2 caps whispers at 10% of events — every genre deleted lowers that number.
AC-3(b) asserts no output extends the loop by more than one continuation per stop,
testable only if a stop-firing genre exists. *"Name the Phase 0 exit that would
fail if the cut were wrong."* None. A scoping argument validated against a metric
set that rewards silence is the 2026-07-22 collapse moved up a level.
**Class: wrong-check.**

## F4 — The diagnosis is true and the remedy contradicts it.
Phase 0's genre list *is* copied from a mode definition. But the architecture's own
derivation-by-capability yields **seven** Lane 1 rows, not five and not three, and
the build order completes all Lane 1 genres before the Phase 0 exit. A copied list
is a reason to re-derive; subtracting from a copy leaves a shorter copy and the
original defect intact. **Class: reduction.**

## F5 — Completeness kept for a mechanism reason; its dark arm treated differently from orientation's identical dark arm.
Completeness's store source includes `invariants`, which has no automated v1
writer — structurally the same condition cited to defer orientation. Same
condition, opposite verdict, no stated principle. The narrow claim (its blocker is
the lost free `edit completed` trigger) is TRUE and correctly sourced.
**Class: mechanism-not-mission.**

## F6 — The stated reason for deferring verification is false as written.
D16 extracts *test topology* as well as verify commands, and D6 already holds both
`test_map` and `verify_commands`. What is missing is a **join**, and the round-4
review lists "make it real" as the first option, with deferral permitted only if
FR-J3's degraded set is amended to match. **Class: unverified.**

## F7 — Orientation: factually wrong, a known open finding, corrected in writing the day before.
D18 names the literal-match landmine path as a v1 writer, Lane 1 includes it, and
`STATUS.md` records this exact error being made and corrected on 2026-07-31. The
second half inverts its own source: the round-4 remedy concludes *keep the genre,
let the bar suppress the trivial arm*, not defer the genre.
**Class: unverified, compounding into reduction. Hardest of the set.**

## F8 — Phase 0 ≠ degraded mode: SURVIVES, and is under-evidenced.
Corroborated by the build order placing D20's state machine after the Phase 0
exit. The proposal's strongest true claim.

## F9 — "R4-4 outranks the whole scoping question" is a ranking, and false in the direction claimed.
`decision-impact = materiality × structural_weight × self_serve_cost`, and
`self_serve_cost` is deterministic — no model needed, fully available in Phase 0.
Either R4-4 is fixed and the bar filters per candidate, making the deferral
unnecessary; or it is not, and Phase 0 has no term that can express the argument at
all. Both branches remove the deferral. **Class: wrong-check.**

## F10 — The kept set is two mechanisms over one table.
Coupling and completeness are the same store fact delivered at two moments; warning
is a zero lookup. Phase 1's bar, silence target and hit-rate baseline would all be
calibrated on a single table. **Class: reduction, of the durable kind.**

## F11 — Cutting orientation removes an entire trigger class from Phase 0.
Orientation is the only genre on `prompt submitted`. Cut it and the phase produces
zero data about that channel — no latency profile, no hit rate, no evidence the
injection path works there. **Class: reduction.**

## F12 — The scope change was made outside the artifact that owns genres.
D10a's maintenance rule requires any change altering a genre to update that table
first and walk each row end to end. The largest genre change yet proposed was made
in prose. **Class: posture.**

## F13 — The proposal scopes a set whose membership is actively contested and never says which side it is on.
Answer-drift is in the degraded set per the architecture and in Phase 1 per §12
(open finding R4-C10). The cut "from five to three" never mentions it.
**Class: reduction by omission.**

## F14 — OWNER-12's must-have is thinned in the only phase the owner will run.
Phase 0 has exactly two genres at the completion moment; the proposal deletes one
and moves the survivor's primary delivery to the free arm. *"Behind
`stop_bar_delta`, what does the owner actually hear?"* **Class: reduction against a
locked decision.**

## Verdict
**Does it honour D10a's "No genre is dropped from v1"? No.** Orientation and
verification would be removed as genres, with no destination phase and no filling
condition.

**Most dangerous unexamined assumption:** that a genre's mission value can be
settled once, at build-plan level, using `self_serve_class` — a property the
architecture's own open findings say is a per-candidate runtime function, not a
per-genre constant. Fix `self_serve_cost` in degraded mode first, and most of what
the proposal wants to cut gets filtered at runtime, per candidate, without any
genre leaving v1 — *"which is the difference between the tool getting quieter and
the tool getting smaller."*
