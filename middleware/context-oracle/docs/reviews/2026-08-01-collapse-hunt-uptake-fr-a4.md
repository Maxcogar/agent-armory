# Collapse-hunt — "uptake detection is already a Phase 0 obligation under FR-A4" (2026-08-01)

*Independent adversarial pass, fresh subagent, never the author. **Written once,
never edited.*** Run **before** anything was written — the target was a
proposition, not a document.

**Verdict: the proposition COLLAPSES.** Premise 1 true; premise 2 survives only on
a basis the proposition does not give; premise 3 misreads the sentence it cites;
premise 4 is false in the direction that matters, and its truth in the other
direction is what kills the conclusion.

## F1 — Premise 2's stated reason is a non-sequitur; the premise survives on a substitute basis.
FR-A4 has three arms; the one preventing repetition is *"been told"*, which needs
no observation of the agent — Tier 3 already holds whispers sent with subjects for
dedup. The inference is rescuable on a source the proposition never cited: FR-A4's
own `[RETHINK §5]` reference resolves to *"Never repeat a whisper whose content the
agent has visibly incorporated (opened the pointed file, used the named helper)."*
**Class: unverified.**

## F2 — THE KILLER. The machinery FR-A4 requires is precisely the detector D10 step 9b rejected.
9b names FR-L1's detector by its clauses — *"pointed file opened / named helper
used / suggested command run"* — and rejects it: *"That scores the tool's best
outcome as a failure: an agent told there is a second write-site, which then edits
it directly … never opens the file the pointer named."* Its replacement is *"the
whisper's subject being subsequently edited, tested, or referenced by any route …
**not only the pointer being followed**"* — a verbatim rejection of the arm the
proposition offers as its machinery. Same machinery ⇒ same defect.
**Class: wrong-check.**

## F3 — The parenthetical claims the subject key and nothing more.
*"(the subject key already exists for FR-A4 dedup)"* asserts that no new identifier
class is needed; it modifies the sub-clause, not the ownership clause it is nested
inside. 9b's stated defect *was* ownership — *"`uptake` existed only as a schema
column and a statistic with no named producer"* — so re-assigning the producer is a
change to D10, not a derivation from it. **Class: posture.**

## F4 — The nullable column is evidence about write ordering, not writer identity.
The `whisper_log` row is written before the whisper is returned to the shim, so
uptake is unknowable at that instant. Both "shape of a deferred writer" and any
permissive reading are overreads. What *is* evidence, and cuts against the
proposition: an uptake write is a later update in neither of D24's write classes,
and its nearest analogue is explicitly droppable (open finding R4-C6).
**Class: decision-hiding.**

## F5 — An in-session-only hit rate is biased along exactly the axis it would be used on.
Completeness and Verification fire at `stop` — the last observable moment — so
in-session detection systematically scores the two turn-spending genres lowest
*because they fire last*. That is 9b's own failure mode relocated from the
predicate to the observation window, landing on the capability OWNER-12 ruled a
must-have. 9b's guardrails do not cover this consumer, and naming a bias does not
remove it from the decision it feeds. **Class: wrong-check.**

## F6 — Per-genre, the proposition holds for a minority, and not the load-bearing ones.
Coupling partial (*tested* needs a mapping that does not exist); Warning not usable
(an absence predicate, already collapsed as R4-C4); Completeness and Verification
structurally undercounted; Orientation evaluable but thin; Answer drift clean and
fully mechanical but contested. One clean row, one partial, two biased, one
collapsed, one thin.

## F7 — FR-A4 has no phase assignment, and its only criterion is a Phase 1 exit.
Its Phase 0 membership is a derivation (Tier 3 → session service → Phase 0), which
is legitimate but must be labelled as one. AC-16 — whose first clause is literally
*"no whisper repeats after its content is visibly incorporated"* — is in Phase 1's
exit set. **Class: unverified / posture.**

## F8 — The architecture splits Tier 3 across the phase boundary and never says where.
D15 lists Tier 3 as holding *"uptake evidence"* — the proposition's strongest
available evidence, uncited. But the build order puts *"Tier 3 completion"* at step
10, after the Phase 0 exit at step 8, while per-consumer dedup vs Tier 3 sits at
step 7. **This is the real open question, and it is narrower and more answerable
than the one asked.** **Class: decision-hiding.**

## F9 — Phase 0's bar deletes the only term that reads the consumer's actions.
D20's caveat drops `decision-impact` to `structural_weight` alone, and
`self_serve_cost` is the term carrying *"driven to ≈0 by demonstrated reach."* Open
finding R4-4. The proposition's "the machinery is already there" leans on a
subsystem the register lists as deleted in the mode Phase 0 runs in.

## F10 — Lifecycle inversion, sixth instance.
Premises 3 and 4 rest entirely on numbered architecture decisions.

## F11 — Self-serving: this restores the killed conclusion one layer down, as the previous hunt predicted in writing.
And on the "stated limitation": a limitation is honest when it bounds a capability
along an axis **independent** of the decision it feeds. Here it is *correlated* —
it depresses exactly the genres per-genre admission would judge. That makes it a
hedge, not a bound. **Class: reduction / posture.**

## F12 — The computation is never named.
In-session detection means joining every tool event against every open whisper's
subject key on the FR-O3 latency-budgeted path, then writing the result. Some
predicates are in-memory joins; *"tested"* is a store join; *"command subsequently
run"* needs Bash-argument parsing. None specified.

## Verdict
**Is hit rate available in Phase 0? No.** Partially available is a *component* of
it, and calling that component "hit rate" is the error.

**Established:** Phase 0 can detect, in-session, that this consumer opened a
pointed file or used a named helper — a derivation, not a spec statement, whose
only criterion is a Phase 1 exit.

**Not established:** that this constitutes uptake. It is the pointer-following
proxy the architecture explicitly rejects.

**Most dangerous unexamined assumption:** that "hit rate" names one quantity. It
names three — §9.2's ratio, 9b's *influence* measure, and FR-A4's *incorporation*
check which 9b rejected as the detector for the second. Collapse them and the
proposition reads as obvious; keep them apart and Phase 0 supplies the third where
Phase 1's exit needs the first computed from the second.

**Larger finding, unrecorded anywhere:** Phase 1's exit has no pass condition even
if detection were settled tomorrow — no threshold, no genre scope, no window, no
named reviewer.

**Standing lesson:** *a requirement and a metric can share a predicate's name, a
subject key, and a source sentence, and still be opposite tests* — one asks "has
the agent already got this?" (suppress), the other "did the agent take this?"
(score). The detector one rejects may be exactly the detector the other requires.
