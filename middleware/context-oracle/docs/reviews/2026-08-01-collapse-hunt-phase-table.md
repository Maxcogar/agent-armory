# Collapse-hunt — §9.2 attribution, §12 measurement table, §12.1, §12.2 (2026-08-01)

*Independent adversarial pass, fresh subagent, never the author. **Written once,
never edited.*** Target: commit `c002cc3`.

**Verdict: 23 findings, 8 structural. (A) §9.2 keep with three corrections;
(B) §12 table keep, cut the conclusion; (C) §12.1 does not survive — remove and
rebuild; (D) §12.2 does not survive — remove.** All four dispositions were applied
the same day.

**The one thing that survived cleanly**, in the hunt's words: *"the FR-L1
recording derivation is correct. The author read `spec:543–546` and read it right,
and the session-service premise checks out against `spec:1010`. After three
artifacts killed for declaring things missing without reading the file, this one
found the thing that was there. The failure this time is not in the premise — it
is in everything built on top of it in the same commit without the same
discipline."*

---

## Structural

**F1 — §12.2's heading swallowed the phase bullets.** The new `### 12.2 Genre
assignment — open` was inserted directly above the pre-existing Phase 0/1/2
bullets, so the canonical component lists became children of a subsection whose
title declares the matter unsettled — and ~15 rows of §12.1 cite `[§12]` as their
basis, a citation that then resolved into it. The section also contradicted itself
in six lines: *"the one part of the boundary this section cannot state today"*,
twelve lines above eleven genre assignments.

**F2 — The Unknown genre is assigned to no phase, in the same subsection that
forbids exactly that.** FR-A2 lists twelve genres; the phase bullets account for
eleven. Also unphased: Warning's landmine arm, Coupling's helper half,
Consequence's breakage half. Third appearance of this trap — collapse-log
2026-07-22 item 6 recorded it already. **Class: reduction.**

**F3 — The "Verified by" column is false in at least twelve of forty-one rows**
against §13's own explicit mapping. Worst: `FR-L1 → AC-9` — AC-9 names FR-L3,
FR-D3 and the §9.2 ladder; **FR-L1 has no criterion at all**, and it is the
recorder for the metric Phase 1's exit is gated on. Grouped rows concealed five
more requirements with no criterion, including FR-X6 — also a recorder in the
measurement table. **Class: unverified. The largest defect in the change.**

**F4 — The in-force/verified-by split laundered a verification gap.** Roughly a
third of Phase 0's obligations, as tagged, had no criterion inside Phase 0's exit
set — including FR-X2/X3/X8, whose only criterion (AC-7) is a Phase 1 exit while
Phase 0 emits whispers built from repo-derived text. The principle is right; the
deployment left the owner as default verifier, which `CLAUDE.md` forbids.
**Class: posture.**

**F5 — "Phase 0 therefore emits every measurement Phase 1 and Phase 2 are gated
on" is false, and is a summary attestation.** §9.2 lists six metrics; the table
listed six *different* ones — regret rate and ceremony count dropped without
mention, latency and continuation count added. No row corresponds to Phase 2's
exit. STATUS records that any summary attestation is a defect on sight.

**F6 — "Every recorder in this table is a Phase 0 component" is a category
error.** The column names requirements, not components; FR-L1 and FR-X6 appear
nowhere in §12's Phase 0 component list. *"FR-A3 budget accounting"* names a
component that exists in no requirement, no §5 row and no architecture decision —
an unfilled requirement wearing a reference.

**F7 — "no component moves between phases" is contradicted three rows later** by
the author's own split rows (FR-K3/K4/K5 "2 (schema 0)", FR-A2 "split — open").

**F8 — The store-row column, prescribed identically by both prior hunts, was
dropped.** It is the falsifiable column, and the rows were nameable today. Its
absence is what let "FR-A3 budget accounting" pass as a recorder: a store row
cannot be invented, a component name can. **Class: reduction.**

## The FR-L1 derivation

**F9 — The recording half SURVIVES; the detection half is unaddressed.** FR-L1's
grammatical subject is the session service, §12 places the session service in
Phase 0, and FR-L1 is not in Phase 2's bullet — the premise holds. But the
architecture states *"uptake detection … owned by the distiller"*, and
`whisper_log.uptake` is nullable — the shape of a deferred writer. FR-L1's own
examples are *matches* between a whisper's pointer and a later event, i.e.
detection. So the change resolved the §9.2/§6.3 contradiction and re-created it
one layer down, and §12.1's open-item list flagged a different architecture
disagreement while omitting this one — asymmetric application on the load-bearing
row.

**F10 — *"which §9.2's ladder already accounts for"* is false against §9.2's
text.** The ladder is probation at 10% / suppression at 25% for warning subtypes;
it says nothing about genres lacking uptake detectors. That accounting exists in
the *architecture*. Asserting what a file contains without reading it, inverted.

## The measurement table, row by row

**F11 — The false-fire row smuggles a Phase 1 dependency.** §9.2 defines the rate
as warnings contradicted by *"outcome **or narration**"*, and narration readers
are build-order step 10, after the Phase 0 exit at step 8. Half the row's signal
is Phase 1. This also indicts the `FR-O1 | 0` row: FR-O1 includes reading
narration as its primary intent signal.

**F12 — The token-overhead row keeps a citation the previous hunt already found
wrong.** FR-X6 logs evidence, not tokens. The prior finding was partially
applied — FR-A3 added, FR-X6 retained. *"Apply all of them."*

**F13 — Silence rate and latency survive, but §9.2 and §12 now disagree about the
recorder** — §9.2's new bullet names only FR-X6 and FR-L1, while §12's table
sources three rows to FR-M1. Two passages written in one commit, two answers.

**F14 — *"Both logs are written by components §12 places in Phase 0"* is an
inference for the FR-X6 half.** FR-X6 is passive-voice and names no writer.

**F15 — The continuation-count row survives cleanly.** §6.1 supports both recorder
and computer verbatim.

## Settling contested questions by default

**F16 — The consequence genre's contested membership was omitted from the open
items**, settling it as Phase 1 by silence — while STATUS names it as one of
exactly two contested memberships. **Class: reduction.**

**F17 — FR-J3's open item states its conclusion, omits the consequence, and
converts a STATUS action item into a permanent spec "open item."** Phase 0's genre
set is defined by reference to FR-J3, so if FR-J3 is Phase 1 the definition is
circular — untouched and unmentioned.

**F18 — §12.1's justification sentence is false in both halves.** Requirements
*were* tagged in the phase bullets (FR-K2, FR-M1, FR-M2, FR-A8, FR-A9, FR-O6,
FR-L7, FR-M3, FR-J3), and the "wrong" derivation from FR-J3's list is one the
spec itself instructs (*"Genres: the FR-J3 degraded set"*). The sentence blames
readers for following the spec and declines to fix the text that mandates it.

## Self-serving

**F19 — `FR-A5 | in force from 0` reinstates the claim killed eight hours
earlier.** *"Phase 0 ships the full bar"* was killed that morning; the table
restated it as an unflagged row while flagging every other contested row in-cell.
R4-4 is open and is STATUS's next step 2. **Class: reduction (rehabilitation).**

**F20 — §12.2's third constraint is a build-plan exclusion lever, predicted by
name.** *"Every genre admitted to Phase 0 needs an uptake predicate Phase 0 can
evaluate"* reads as an admission condition, and loads asymmetrically onto exactly
the Lane 2 genres the killed proposal tried to defer. The preceding hunt warned
in writing that the next proposal would have a spec-blessed lever the last one
lacked.

## Information policy

**F21 — Four places now hold "what is open", and §14 — the section whose one job
that is — was not updated.**

**F22 — A second home for phase assignment, already diverging on the day it was
written** (FR-O1 whole-Phase-0 in the table, split in the build order; FR-A9
Phase 1 here, Phase 0 in the architecture; FR-A5 contradicting an open finding).

**F23 — Next-steps language in the spec**, and a pre-existing paragraph declaring
the work unwritten now sitting beneath a header announcing it resolved — while
naming the one column the table omits. §12.1 item 4 defers to §12.2; §12.2 says it
cannot state it. Circular.

**F24 — Lifecycle inversion recurs, in the artifact written the same day the
lesson was logged.** New instances include *"per the architecture"* as the basis
for a phase assignment, a review-finding ID (R4-C10) cited as spec authority, and
**"Lane 1"/"Lane 2" — architecture vocabulary with no referent in the spec,
appearing in the spec only in lines this commit introduced.**

---

## (a) The most dangerous unexamined assumption

**That "recording", "computing" and "detecting" are three jobs rather than four —
and that the boundary between recording and detecting falls where the author needs
it to.** Uptake is not recorded, it is inferred: *"pointed file opened"* is a join
between a whisper's pointer and a later tool event. The architecture names that
step and gives it to the distiller; the store column is nullable. If detection is
Phase 2, hit rate — the metric this change was written to establish — is still
behind a Phase 2 component, and the headline conclusion is false the same way its
two predecessors were, one layer down. Second-order risk: the header now says
*"resolved"*, so the next four sessions inherit it as settled.

## (b) Verdict

**(A) §9.2 — KEEP with three corrections**: drop *"the only part of this section
that is [Phase 2]"* (the ladder is Phase 2 too); add FR-M1 to the recorded list;
mark the FR-X6 writer as a derivation.

**(B) §12 table — KEEP the table, CUT the conclusion**: delete both attestation
sentences; add the store-row column; narrow the false-fire row to its outcome arm;
fix the token-overhead recorder; state regret rate and ceremony count as out of
scope and why.

**(C) §12.1 — DOES NOT SURVIVE. Remove and rebuild, not patch.** A per-requirement
phase table is the right artifact and STATUS has specified it since 07-31 — but
this instance asserts more verification than exists, which `CLAUDE.md` calls
strictly worse than no work at all.

**(D) §12.2 — DOES NOT SURVIVE. Remove.** Its two worthwhile constraints already
live in the collapse log, which is their home.
