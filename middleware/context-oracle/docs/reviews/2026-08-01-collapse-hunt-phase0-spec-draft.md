# Collapse-hunt — `spec-context-oracle-phase0.md` draft (2026-08-01)

*Independent adversarial pass, fresh subagent, never the author. Dispatched
before the draft became authority. **Written once, never edited.***

**Verdict: the document does not survive — 19 findings, 6 structural. Deleted the
same day.** The hunt's answer to "should this document exist at all" is **no**: its
genuine content is phase tags belonging in the parent spec, contradictions
belonging in parent §14, and an order of work belonging in `STATUS.md`.

---

## F1 — The justifying quote is accurate; the conclusion is the opposite of what it licenses

**Collapse question:** the owner asked *"3 phases in one spec. WHY?"* This document
leaves all three phases in the parent spec and adds a fourth statement of one of
them. **Name the file from which a Phase 1 requirement was removed.**

**COLLAPSES. Class: wrong-check.** `collapse-log.md:401–403` is quoted correctly,
but the defect it names is *specifying Phase 1 and Phase 2 against nothing* — a
defect located entirely in the Phase 1/2 material. Re-stating **Phase 0** in a
second file does not touch it. Net movement against the defect: zero; net
duplication: one full requirement set. The draft's own §3 is the proof — it is a
list of parent FR identifiers, i.e. a **phase tag**, and `STATUS.md:110–114`
already records that remedy: *"Write those tags into the spec, so the boundary is
settled once, in the spec, and can be checked."*

## F1b — Two sources of truth, precedence stated both ways in one document

**COLLAPSES. Class: wrong-check.** draft:97 — *"the parent text governs"*;
draft:44–49 — the draft overrides parent §12 on the most load-bearing Phase 0
question. `CLAUDE.md:48–50` and `:36–39` allow one home for "what the tool must do."

## F2 — §3 constrains nothing a builder holding the parent spec did not already have

**COLLAPSES. Class: mechanism-not-mission.** Every candidate sentence checked;
each is either already an acceptance criterion (FR-X5's no-network point is AC-14,
`spec:956–959`) or a restatement of an architecture fact.

## F3 — The requirement set has holes it does not account for

**COLLAPSES. Class: reduction.** **FR-A2 — the twelve-genre requirement — appears
in neither §3 nor §6.** The one requirement whose reduction caused two full remakes
is the one the "requirements in force" list omits. FR-J1 is likewise absent though
Lane 1 *is* its mechanical bypass.

## F4 — §3 requires a writer §6 puts out of scope

**COLLAPSES. Class: unverified.** The Phase 0 landmine/invariant writer is
`human_facts` promotion, which `architecture:2168–2170` identifies as **FR-L6**;
§6 excludes *"every learning mechanism (FR-L\*)"*. Required and forbidden, four
sections apart.

## F5 — The measurement table picks a side on the same contradiction it escalates

**COLLAPSES. Class: wrong-check.** `spec:682–684`'s *"by the distiller"* scopes all
six §9.2 bullets. The table awards silence rate and latency to Phase 0 ("No
distiller needed") and raises the contradiction only for hit rate — the asymmetric
application the preceding hunt already logged.

## F6 — PH0-Q1's two options are not exhaustive; the third is in the parent spec, twice

**COLLAPSES. Class: unverified — the region that would have shown option 3 was
never read.** `spec:302–306` (§6.3): `status` covers *"health metrics §9.2"*.
`spec:675–677` (NF-2): overhead *"measured and reported by `ctxoracle status`"*.
`status` is Phase 0 (build order step 8, `architecture:2706–2707`). **Option 3:**
§9.2's "by the distiller" is an over-broad attribution contradicted by §6.3 and
NF-2; metric computation from logs is `status`'s job and already Phase 0. Under it,
nothing about Phase 1's exit is wrong and no component moves — only an uptake
*record* is needed. The two-option framing made a spec change mandatory when the
spec may already answer it, and attached a cost warning only to the option that
enlarges Phase 0.

## F7 — The table's rows are answered by two different tests

**COLLAPSES. Class: wrong-check.** Hit rate answers "No" on *component
assignment*; silence rate answers "Yes" on *data availability*. Swap the tests and
both flip: every uptake predicate in `architecture:1339–1351` is an observation of
a later tool event, and Phase 0 receives those events (FR-O1). The conclusion is an
artifact of which test each row got.

## F8 — The NF-2 row cites the wrong data; the FR-X6 derivation survives

**PARTIAL. Class: unverified.** FR-X6 requires evidence, not token counts; token
overhead's source is FR-A3's budget. But *"FR-X6 applies to every whisper, so it is
Phase 0 by necessity"* **survives** and is a genuine correction to the preceding
hunt's finding of record (that hunt stated Phase 0's component list has no FR-X6
log) — corroborated by `architecture:2390–2402`, where the audit append is a
delivery precondition. It should be recorded as a correction, not buried in a cell.

## F9 — "Phase 0 is not degraded mode" SURVIVES, and its evidence is sound

**SURVIVES.** `spec:886`, `spec:898` (AC-10 is a Phase 2 exit),
`architecture:2704–2709` (D20's machine is step 9, after the Phase 0 exit at step
8), `architecture:2222–2231` (D20 is a runtime mode machine). Already recorded in
`collapse-log.md:546–555`.

## F10 — "Ships the real bar" and PH0-Q2 rest on a gap the architecture already fills

**COLLAPSES. Class: unverified.** `architecture:1059–1060`, verbatim: *"For the
mechanical Lane 1 genres (no model) `materiality` defaults to the genre's base
weight, so degraded mode still ranks — without intent input."* The substitute
exists, is named, and sits in the same numbered step the draft cited. This is
`collapse-log.md:585–587` reproduced exactly — *"Before recording that something
was missing, read the file you are about to say it was missing from."* What is
genuinely open is narrower and already tracked: R4-4.

## F11 — A normative decision stated inside an "open questions" section

**COLLAPSES. Class: posture.** *"Phase 0 ships the full bar"*, in bold, inside the
section headed *"Open questions this spec cannot close"* — unsourced, contradicting
`architecture:2242–2244`, and already asserted as settled in §1. Two documents were
killed today for writing a rule ahead of its premises; this writes the rule inside
the question that says the premise is missing.

## F12 — §1 and §5 use D20 as authority in opposite directions

**COLLAPSES (moderate). Class: wrong-check.** §5 cites D20 approvingly to show AC-2
is unsatisfiable; §1 overrides the same passage's conclusion. De-equating Phase 0
from degraded mode changes the notice, the probe and the delta — it does not
conjure an intent signal.

## F13 — The refusal to settle genres is contradicted by §6, which settles one by exclusion

**COLLAPSES. Class: reduction.** §4 lists Answer drift as contested and to be
settled; §6 excludes *"the conduct genres (FR-A8, FR-A9)"* — and FR-A9 **is**
Answer drift. §6 is normative and §4 is a promise, so the contested membership is
settled by default in the direction that removes it, against
`architecture:1351` and `:2234–2236`, with R4-C10 still open.

## F14 — §5 fixes genres the document says it will not fix

**PARTIAL. Class: posture.** Adopting the parent's exits brings AC-1 (coupling) and
AC-5 (warning) with them, so two genres are fixed while §4 claims neutrality.
Inheriting the parent's exits is legitimate; claiming a neutrality §5 does not have
is the defect.

## F15 — §4's three rules are a third copy of lessons that already have a home

**COLLAPSES. Class: process.** The rules themselves **survive** — they are correct
and correctly inherited. Their location is the finding
(`CLAUDE.md:36–44`, `:58–61`).

## F16 — §6 defers FR-J3's air-gap guarantee with no destination phase

**COLLAPSES. Class: reduction, crossing into scope.** §4 declares a deferral without
a named destination prohibited; §6 defers D20 and parent §12 assigns FR-J3 to no
phase. Checked item by item, **every other §6 entry has a parent-§12 destination**;
D20/FR-J3 is the single unnamed one, and it is the one the owner locked
(`RETHINK.md:312–313`, decision 2). Both `collapse-log.md:553–555` and
`STATUS.md:73–75` already attach this consequence to the de-equation; the draft
executed the de-equation and omitted the consequence.

## F17 — §5's AC-3(b) escape pre-authorises dropping the stop-class genres

**COLLAPSES. Class: reduction (pre-authorisation).** *"or state that AC-3(b) is
fixture-driven"* removes the last structural reason Phase 0 must contain a
stop-class genre — and speaking at a completion claim is the capability the owner
personally ruled a must-have. The preceding hunt spent fourteen findings removing a
build-plan-level cut lever; this hands back a narrower one.

## F18 — "Two products, both required" re-elevates the killed purpose claim

**PARTIAL. Class: reduction.** The fix of record was to *"record
measurement-production as what that yields."* The draft leads with mission
correctly and then promotes measurement to a required product with *"Neither is
subordinate to the other"* — unattributed. A co-equality claim is safer than a
ranking claim but is still an unsupported claim about the phase's purposes.

## F19 — PH0-Q3 manufactures a conflict that does not exist

**COLLAPSES. Class: unverified.** Phase 1 is inside v1, so parent §12 assigning
FR-O6 to Phase 1 does not conflict with OWNER-8 requiring subagent delivery in v1.
Separately, `spec:1008–1012` still lists the subagent hook contract as unverified
and to be verified in Phase 1 — a live contradiction the draft's own charter
obliged it to name. The residual question (whether per-consumer Tier 3 state is
foundational rather than additive) **survives**.

## F20 — The document states next steps, priorities and an order of work

**COLLAPSES. Class: posture (process).** Six instances. `CLAUDE.md:51–53`: *"Only
`STATUS.md` states what to do next … This is the rule most often broken."*

## F21 — PH0-Q1 is stated in three places, PH0-Q4/Q5 in two

**COLLAPSES. Class: process.** Already recorded in parent §12 in place and in
`STATUS.md`. `CLAUDE.md:48–50`: state it once and point at it. Parent §14 is the
home the project already has for unresolved items.

## F22 — Lifecycle inversion, at eight times the scale of the instance killed this morning

**COLLAPSES. Class: wrong-check.** Numbered architecture decisions cited as
authority for spec-level statements at least eight times (D20 ×4, D18 ×2, D10a ×2,
D10 ×1). The standing lesson from this morning is `collapse-log.md:634–637`. Most
acute: a spec closing a scope question on the authority of a demoted architecture
document (*"is recorded in D18 and is not re-opened here"*).

## F23 — The document opens with a summary attestation

**COLLAPSES. Class: posture.** *"Nothing is invented."* Counter-examples inside the
same file: the three §1 prohibitions, *"Two products, both required"*, *"Security —
in force in full"*, *"Phase 0 ships the full bar"* — none annotated, and the
document carries no source annotations at all. `STATUS.md:322–326` records the
standing instruction that **any future summary attestation is a defect on sight**.

## F24 — §5's AC-2 claim is overstated

**PARTIAL. Class: unverified.** AC-2's procedure is a rate check and runs without a
model. What fails is the inference — passing it evidences a whisper rate, not FR-A1
conformance. Already recorded in `STATUS.md`.

---

## (a) The single most dangerous unexamined assumption

**That the remedy for "three phases in one spec" is another spec.** The defect the
collapse log names is located entirely in the Phase 1/2 material; every remedy that
addresses it removes or suspends that material. This document touches none of it and
produces a second, partially-contradictory statement of the half that **survived
every review round**. The moment parent §12 gains phase tags — `STATUS.md:110–114`,
still undone — every requirement has two homes and no precedence rule.

## (b) Verdict

**Should this document exist? No.** Its genuine content is three things that
already have homes: phase tags → the parent spec; the contradictions → parent §14;
the order of work → `STATUS.md`.

Two things are real work and should survive its deletion: the **Phase 0 ≠ degraded
mode** derivation (F9), and the **FR-X6-is-Phase-0-by-necessity** derivation (F8),
which corrects a finding of record in the preceding hunt.

**Usable base? No — rewrite as edits to existing files.** Six defects are properties
of the decision to make it a separate document; three more are the project's two
dominant failure classes in their third and fourth appearance today.

**The single most valuable next action:** the list `STATUS.md` already specifies —
each measurement Phase 0 must emit, the component that computes it, the store row,
and the decision it unblocks — written into the parent spec, **with §6.3 and NF-2
read first.**
