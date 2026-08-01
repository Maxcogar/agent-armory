# Collapse-hunt — the four-part §12 edit (2026-08-01, eighth pass)

*Independent adversarial pass, fresh subagent, never the author. **Written once,
never edited.*** Run **before** the edit was written.

**Verdict: 13 findings. Parts 2 and 3 survive with additions. Part 1 does not
survive as proposed — one of its seven genres collapses. Part 4(a) survives
incomplete. Part 4(b) must not be written as framed.** Branch A was taken and
every prescribed addition applied.

## F1 — Answer drift's producer is a Phase 1 component, and §12 says so fifteen lines above the bullet being edited. COLLAPSES.
*"Name the Phase 0 component that writes a row into `open_questions`."* There is
none. D14 — the narration reader — extracts *"user questions (FR-A9
open-question tracking)"*; the build order places `narration/` readers at step
10, after the Phase 0 exit at step 8. And the spec says it itself, in §12,
fifteen lines above the bullet being rewritten: *"needs a narration reader,
which §12 places in Phase 1"* — a sentence written the same day by the same
author. R4-C10 asked the identical question, answered it, and priced the
"land it" branch at five coordinated changes; the proposed edit made one.
**Class: unverified.**

## F2 — The basis has two conjuncts; answer drift satisfies only one. COLLAPSES.
*"Derivable from the stores by deterministic lookup keyed by the observed event,
with no model call."* Answer drift fails the first conjunct — `open_questions` is
session state written by a transcript reader, and its grounding pointer is a
*bounded transcript scan*. Every other member satisfies both. **A criterion that
has to be read with one conjunct suppressed to admit one member is not the
criterion that produced the list.** **Class: wrong-check.**

## F3 — Part 1 resolves the build set and leaves FR-J3's runtime enumeration untouched. COLLAPSES as scoped.
FR-J3 enumerates five; consequence is not among them. The architecture's
governing principle is that degraded mode is *"the same system minus Lane 2"* —
so after Part 3 places FR-J3 in Phase 1, a runtime model failure would switch
**off** a genre needing no model. **Class: wrong-check.** *Fix applied: FR-J3's
enumeration amended in the same pass, with the build-set/runtime-set distinction
stated in place.*

## F4 — Two genres move into a phase whose exits cover neither. PARTIAL.
AC-20 (answer drift) is a Phase 1 exit; **no acceptance criterion anywhere covers
consequence**. Thin AC coverage is a finding against the AC set, not a scope rule
— so this does not forbid the move, it forbids making it **silently**.
**Class: posture.** *Fix applied: recorded in §14.*

## F5 — The basis does exclude, and hands the next session two levers unless two clauses are added. PARTIAL.
Applied to all twelve genres it excludes five; four have Phase 1 as a
destination, **Unknown has none** — a deferral into nowhere, verbatim the
genre-cut hunt's F1. Second lever: two of the admitted seven have deliverable-fact
gaps of record (verification's join does not exist; orientation's landmine writer
is unspecified), so a later session reading the basis as *"the lookup returns
something today"* cuts both. *Fixes applied: basis stated as the derivation of
this list and not a standing rule; unbuilt store rows declared deferred content
within a live genre, never a membership test; Unknown declared outside the
derivation's reach and left recorded in §14.*

## F6 — The basis is the criterion a prior hunt recorded as a correctly-diagnosed defect. SURVIVES ONLY IF THE REVERSAL IS ARGUED IN WRITING.
The purpose hunt recorded *"which genres run without the model"* as *"mechanically
decidable, wrong answer, correctly diagnosed as a defect."* The counter-evidence
is real — the architecture's own derivation-by-capability yields seven Lane 1
rows, corroborated twice independently — but the reconciliation must be **written**:
model-availability is a **build dependency**, not a judgment that the excluded
genres say less, so the "a bar suppresses, a build plan deletes" rule is not
engaged. *Fix applied: that paragraph written into §12.*

## F7 — Sequencing or scope: SURVIVES. But the proposal's own sentence was self-refuting.
Nothing leaves v1, so the move is the agent's call. But *"no genre is removed from
any phase"* cannot hold while Phase 1's bullet still names consequence.
*Fix applied: struck from Phase 1 in the same edit.*

## F8 — Part 2: SURVIVES. Every term of Phase 0's bar is computable without a model.
`materiality` falls back to genre base weight for mechanical genres;
`structural_weight` is deterministic; `self_serve_cost` is derived from provenance
class and consumer history. **The deleted equation leaves nothing undefined.** Two
additions required: state that Phase 0 ships the unraised bar and issues no
degraded-mode announcement; and record that three architecture passages rest on the
deleted sentence. *Both applied.*

## F9 — Part 3: SURVIVES on placement, leaves two Phase 0 obligations pointing at Phase 1 machinery.
Phase 1 is right and no circularity survives Part 1. Residuals: §6.3 gives
`status` the degraded-mode state and AC-18's induced-failure list includes a
blocked model path — both Phase 0 exits. Pre-existing, not created, but made
explicit. *Fix applied: recorded in §14.*

## F10 — Part 4(a): SURVIVES on substance, incomplete as scoped.
The CLI omission is real. But the same derivation applied to all nine exits finds
two more: the **security scanner** (AC-12 is a Phase 0 exit, and the build order
requires it *"before any ingesting component"*) and the **FR-X6 whisper log**.
Adding only the CLI produces a corrected list that is still wrong — the phase-table
failure logged this session. *Fix applied: all three added, and the audit's scope
stated in place.*

## F11 — Part 4(b): the premise is false. MUST NOT BE WRITTEN AS FRAMED.
FR-A5's governing clause is *"**History-backed genres** additionally respect
evidence floors"* — the generated-file warning is a zone classification, not
history-backed, so it is exempt and AC-5 can fire. The genuine contradiction is the
**architecture's** restatement of the floors with the qualifier dropped. Writing
"the spec's gloss makes the warning unable to fire" repeats the failure logged
three separate times today: declaring a defect against a source read only as far as
the em-dash. **Class: unverified.** *Fix applied: not written as framed; §14 records
the gloss as loose and locates the real defect in the architecture.*

## F12 — "from the stores" is too narrow for the basis's own list.
Completeness's *"paired file not yet touched"* needs Tier 3, which is an in-memory
map, not a store. On the literal wording completeness fails the basis for the same
reason answer drift does. *Fix applied: basis reworded to "from the stores and
per-consumer Tier 3 state."*

## F13 — Self-serving check.
The direct charge fails: nothing leaves v1, the direction is inclusive, and the
seven is the architecture's own count. But **the prompt's suspicion is warranted
for exactly one item** — answer drift fails the stated basis, needs a Phase 1
component, has its criterion in Phase 1, and was already priced at five changes.
*"It is included because inclusion is the shape least likely to be challenged, and
because including it lets the edit claim it resolves both contested memberships.
Dropping it costs the proposal that headline and nothing else."*

## (a) The most dangerous unexamined assumption
**That "no model call" is a property readable off the spec** — when for the one
genre moved on that ground, the mechanical predicate exists only in the
architecture, and only as a deliberately narrowed subset the spec never adopted.
FR-A9 says answer drift fires when turns *"fail to **address**"* a question;
"address" is a judgment and the spec supplies no predicate. So the basis applied to
answer drift does not classify FR-A9 — it classifies the architecture's narrowed
v1 subset, then writes the result into the spec as a fact about the requirement.
**A lifecycle inversion running through a criterion instead of through a citation
— the sentence is what launders it, which is why no reviewer would see it as one.**
Six of the seven survive a spec-only derivation. Answer drift does not.

## (b) Per-part verdict
- **Part 1 — Branch A**: write six, not seven. Answer drift stays in Phase 1 with
  its blocker named. Plus the seven corrections listed under F3, F5, F6, F7, F12
  and a `[D-n]` in §11.
- **Part 2** — as proposed, plus the unraised-bar statement and the §14 line on the
  three inherited architecture passages.
- **Part 3** — as proposed, plus one §14 line on the §6.3 / AC-18 residuals.
- **Part 4(a)** — with the scanner and whisper log added, or the scope stated.
- **Part 4(b)** — must not be written as framed.
