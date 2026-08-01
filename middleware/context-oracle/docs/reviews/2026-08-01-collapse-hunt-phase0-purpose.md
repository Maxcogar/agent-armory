# Collapse-hunt — spec §12 "What Phase 0 is for" block (2026-08-01)

*Independent adversarial pass, fresh subagent, never the author. Dispatched per
`CLAUDE.md` before the block was accepted. **Written once, never edited.***

**Verdict: the block does not survive. 17 findings.** The block was removed from
the spec the same day; §12 now records the question as open, with the blocking
discovery (F3 / closing section (a)) stated in place.

**Target:** the block added at the head of spec §12 stating that Phase 0's purpose
is to *"produce the answers Phases 1 and 2 cannot be designed without"*, with a
membership test (belongs in Phase 0 if running it produces a measurement Phase 1
or 2 needs), a three-way span obligation (provenance classes / trigger channels /
delivery costs), a load-bearing reading of the "owner runs it on a real project"
exit clause, and an exclusion rule.

---

## F1 — The headline sentence is an unattributed exclusive-purpose claim

**Collapse question:** the standing lesson written into the collapse log *the same
day* forbids "the reason it exists" claims the owner did not state in those words.
Point at the owner's words, or the mission line, that makes measurement-production
Phase 0's *purpose* rather than one of its consequences.

**COLLAPSES. Class: reduction.**
- `collapse-log.md:468–471` — the standing lesson bans exactly this shape.
- `RETHINK.md:386–390` — *"agents keep collapsing a deliberately broad tool onto
  one purpose … this is the second full remake caused by it."*
- The architecture already states Phase 0's job in mission terms and it is not
  measurement: `architecture:2244–2249` — *"non-obvious history facts on mechanical
  triggers … cold-checkout-invisible knowledge (P5-passing)."*
- Fails `CLAUDE.md:123–127` collapse-test step 1: the one sentence it can write
  describes the build process, not the mission-need. Mechanism-not-mission applied
  to a phase.

**Fix:** lead with the mission-level statement; record measurement-production as
what that yields. Exclusive-purpose framing is an owner ruling and goes to him
quoted.

## F2 — The "purpose was already written" provenance claim is false

**Collapse question:** read the two quoted sentences. Do either state a *purpose*,
or a *dependency*?

**COLLAPSES. Class: unverified.** Both say Phase N+1 *needs* data Phase N
produces; neither says Phase 0 *exists for* that. `spec:840–841` is a sequencing
constraint; `STATUS.md:152–153` is a dependency; `STATUS.md:146–148` orders it the
other way (*"a real running tool producing the measurements everything downstream
waits on"* — tool first). "X is necessary for Y" → "X exists for Y" is a
non-sequitur. The note written to correct a misattribution committed a fresh
false-provenance claim of the same class.

**Fix:** say what is true — the dependency was written twice; the purpose claim is
new and is the author's.

## F3 — The test cannot exclude, read per candidate: it swallows Phases 1 and 2

**Collapse question:** Phase 1's exit names *"measured silence and hit rates."*
Name the Phase 0 component that computes a hit rate.

**COLLAPSES. Class: wrong-check.** There is none.
- `spec:683` — §9.2 metrics are *"Measured from the FR-X6 log **by the distiller**."*
- `architecture:1282–1283` — uptake detection is *"owned by the distiller."*
- The distiller is Phase 2 (`spec:909–910`; build order step 13,
  `architecture:2716–2718`).
- Phase 0's component list (`spec:896–897`) has no FR-X6 whisper log and no metric
  computation; FR-M1/M2 detect *failures*, not hit rates.

So either the distiller and §9.2 metric computation belong in Phase 0 by the test
— erasing the boundary the block existed to define — or Phase 0 produces none of
the measurements the block says it exists to produce. Every genre likewise
produces "a measurement Phase 1 needs" (its own genre-keyed hit rate;
`architecture:875`), so all twelve FR-A2 genres pass.

**Fix:** replace the criterion with an enumerated list of the specific
measurements Phase 0 must emit, each with the component that computes it and the
store row it lands in.

## F4 — Read as the block glosses it, the test excludes Completeness — and `deinit`

**Collapse question:** use it to exclude something. What is the minimal set
spanning all three axes?

**COLLAPSES. Class: reduction.** From D10a (`architecture:1339–1351`), Orientation
+ Coupling + Warning + Verification spans every provenance class, every trigger
channel and both delivery costs. **Completeness is redundant on all three axes**,
so `spec:901–902` lets it go — a permanent, per-genre, unmeasurable,
build-plan-level cut of a co-equal FR-A2 genre, and the stop-class genre nearest
OWNER-12's accepted-cost ruling. Precisely what `collapse-log.md:514–519` forbids.

The exclusion clause also reaches non-genre work: `deinit` produces no measurement
and gates nothing, yet AC-4 (`spec:936–938`) is a Phase 0 exit — the rule excludes
something §12 requires twelve lines later.

**Fix:** delete the exclusion clause. Inclusion criteria may be stated; exclusion
routes to the bar or to the owner.

## F5 — The test and its contrapositive do not match

Admission is on "produces a measurement" OR "required for trustworthiness";
exclusion fires on "produces no measurement **and gates nothing**". "Gates" appears
nowhere else, is undefined, and is a word this project bans in its product sense
(RETHINK §12 decision 3; `CLAUDE.md:204–206`). An item that gates something but
produces no measurement is neither included nor excluded.

**COLLAPSES. Class: wrong-check.** **Fix:** one rule, stated once, negation
entailed.

## F6 — §12 rules out a criterion and then applies it, five lines later

`spec:899–900` rules out deciding contents *"by which need no model."*
`spec:898–899`, immediately following: *"Genres: **the FR-J3 degraded set**"* —
and FR-J3 (`spec:513–517`) is definitionally "no model path available:
deterministic genres only."

**COLLAPSES. Class: posture** (declares a standard, leaves the violation in
place). `STATUS.md:56–58` also still records the next step as "does the genre need
the model…", now contradicted by the spec with no STATUS update
(`CLAUDE.md:51–53`: only STATUS states next steps).

**Fix:** derive the genre list from the new test in the same edit, or don't write
the rule-out until you can.

## F7 — The `self_serve_cost` provenance-keying claim misquotes D10

**D10 verbatim, `architecture:1099–1100`:** *"deterministic and derived from the
fact's own provenance class **plus what this consumer has already done**."* The
block drops half the definition — and it is the half that *was* the round-2
collapse fix (`architecture:1153–1156` driven to ≈0 by demonstrated reach;
`:1116–1125` Steering's exception is *"consumer-relative, not a stored fact"*;
`:1171–1175` AC-16a exists to fixture it).

**COLLAPSES. Class: reduction.** Consequence: the span list is wrong — calibration
must also span consumer states, and AC-16a is a **Phase 1** exit (`spec:906`).
"Mapping-derived" is also not a provenance class; D10 calls it an *exception*
(`:1108–1113`).

Separately: D10 states its own formula two ways — three factors at `:1098`, two at
`:1306–1307` (*"materiality × structural_weight"*), inside D10's own collapse-test
box. A spec citing D10 for this formula cites a decision that contradicts itself.

## F8 — The premise of span-bullet 1 is contradicted by an open SERIOUS finding

**Collapse question:** does Phase 0's bar contain `self_serve_cost` at all?

**COLLAPSES. Class: unverified.** `architecture:2242–2244` (D20, current):
*"`decision-impact` falls back to `structural_weight` alone."* R4-4 is open
(`reviews/2026-07-30-round-4-expert-review.md:342`) and is `STATUS.md`'s next step
1. The block inherits the assertion without re-deriving it against D20 — the
specific failure `collapse-log.md:525–532` warns about (*"Reading a correction is
not inheriting it"*).

## F9 — "latency, delivery and false-fire behaviour are per-channel": half false

**PARTIAL. Class: unverified.** Latency survives (`architecture:829–830`,
`session_log … latency_ms`). False-fire collapses: the ladder is keyed to the
warning genre's *subtypes* (`spec:699–702`), and the aggregates carry no channel
(`architecture:875–880`, `whisper_stats(genre, project_key, mode…)`,
`genre_state(...)` — no trigger column). Since D10a gives each genre essentially
one trigger, "span the channels" reduces to "include enough genres" — circular.

## F10 — "the one cost the owner has accepted" is false, and the bullet obliges nothing

**COLLAPSES (minor). Class: unverified + posture.** `RETHINK.md:321–323`, decision
3: the worst case is *"a wasted sentence"* — an accepted cost stated by the owner
before OWNER-12. "The one cost" is a banned superlative applied to an owner ruling.
Operationally the bullet is satisfied by the incumbent set, and the free/turn split
inside Phase 0 is itself open (R4-C13, `STATUS.md:187`).

## F11 — Lifecycle inversion: the spec now depends on the demoted architecture

**COLLAPSES. Class: wrong-check.** `spec:21–23` reserves component boundaries and
algorithms to the architect; a spec obligation grounded in an architect's decision
inverts spec → architecture. Every `architect`/`architecture` occurrence in the
spec was read: line 881 is the **only** place the spec cites a numbered
architecture decision as authority — a new pattern, not an inherited one. The
document cited is demoted (`CLAUDE.md:240–241`, *"not as a base to edit"*), and D10
is Phase-1 material — the half that collapsed in every review round.

**Fix:** restate in spec terms (RETHINK §2.3, `RETHINK.md:59–60`) and drop the
citation.

## F12 — No source annotation; §11/§2/§14 not updated

**COLLAPSES. Class: posture (process).** The block is normative and carries no
`[OWNER-n]`/`[D-n]` (`spec:16–19`, `CLAUDE.md:262–264`). §11 still ends at D-20.
The commit says the block *"likely makes Phase 0 larger than five genres"*, and
neither §2 nor §14 was touched (`CLAUDE.md:267–268`).

## F13 — The test is never applied to the one membership actually in dispute

**COLLAPSES. Class: wrong-check.** Answer-drift is in Phase 0 per
`architecture:1387–1389` and `:2234–2237`, and not in Phase 0 per `spec:513–517`
and `spec:898–899` (R4-C10, open). It has a unique trigger channel, a free delivery
cost and its own hit rate — the test would put it in Phase 0. The block does not
say so, does not mention the contradiction, and leaves §12's genre bullet
unchanged. **Net effect on the phase's contents: zero.**

## F14 — Owner-level safety guarantees made instrumental to the measurement program

**COLLAPSES. Class: reduction.** `RETHINK.md:321–323`, decision 3: *"safe to run on
real projects **by construction**"* is owner-locked, not an input to a calibration
argument. Three Phase 0 exits — AC-4, AC-12, AC-14 — implement it and produce no
measurement. The "real project" clause is retained but reframed as derivative,
setting the utility floor at the owner's tolerance for running the thing rather
than at the mission.

## F15 — Whose decision this is: mostly survives

**SURVIVES on inclusion; COLLAPSES on exclusion.** Deciding which phase builds a
thing, with nothing dropped from v1, is sequencing — the agent's call
(`CLAUDE.md:172`). Stated plainly: the change is **not** a scope grab in its stated
direction. But the exclusion clause removes things with no destination — verbatim
the F1 error from the preceding hunt, same error, opposite direction, one layer up.

## F16 — Self-serving check: the conclusion is not rehabilitated; the authority is

**PARTIAL.** The direct charge fails — the block cuts no genre and moves toward a
larger Phase 0. What it resurrects is the *form* of the killed argument: a
build-plan-level, permanent, unmeasurable exclusion criterion, now phrased over
"mechanisms and store tables", which dodges the letter. `spec:901–902` carries the
converse on its face, and F4 shows it is reachable against a real genre today. The
next scoping proposal would have a spec-blessed lever the last one lacked.

## F17 — The test deletes D18's Phase 0 store tables, and outlaws D18's defence

**COLLAPSES. Class: wrong-check.** D18 (`architecture:2166–2173`) creates exemplar,
landmine, invariant and recipe tables in Phase 0 though exemplars and recipes have
no v1 writer — so they produce no measurement and gate nothing, and the exclusion
rule deletes them. D18's rationale (`:2175–2176`) is that deferring the schemas
*"would make Phase 0's store a throwaway"* — a **build-cost** argument, the exact
criterion the block declares illegitimate. The test overturns a standing decision
and simultaneously forbids the only argument defending it.

**Fix:** scope any test to genres and event-path mechanisms, not store schemas, and
re-admit migration cost as a valid sequencing input.

---

## (a) The single most dangerous unexamined assumption

**That Phase 0, as specified, can produce a measurement at all.** Everything in the
block is downstream of it and nothing checks it. Phase 0's component list contains
no FR-X6 whisper log, no uptake detector, no §9.2 metric computation; all §9.2
metrics are computed by the distiller, which is Phase 2. Phase 1's exit names two
metrics, neither of which any Phase 0 component computes.

If that assumption is false, the block does not merely mis-scope Phase 0 — it
declares a purpose the phase is structurally incapable of serving, in the spec,
where the next four sessions cite it as ground truth. Same shape as the 2026-07-30
pattern note: *an unfilled requirement wearing a reference* — here, wearing a
**purpose**.

## (b) More decidable, or the vagueness moved?

**It moved the vagueness, and hardened it.** Before: "which genres run without the
model" — mechanically decidable, wrong answer, correctly diagnosed as a defect.
After: "does running it produce a measurement Phase 1 or 2 needs" — **not**
decidable on its own materials. The measurements are never enumerated; no Phase 0
component computes either metric Phase 1's exit names; the criterion admits all
twelve genres under one reading and cuts a co-equal genre under the other. The
three "obliges" bullets are satisfied by the set that already existed, so the test
changed nothing, and it resolved neither contested membership.

The hardening is the cost: an undecidable criterion in the spec outranks the
decidable-but-wrong one it replaced, carries no `[D-n]`, grounds itself in a
demoted architecture document's collapsed half, and hands a future session a
build-plan-level deletion lever the preceding hunt spent fourteen findings
removing.

**What would make it decidable:** a list, not a criterion — the specific
measurements Phase 0 must emit, each with the component that computes it, the
store row it lands in, and the Phase 1/2 decision it unblocks. That list is
writable today, and writing it would have surfaced the (a) finding immediately.
