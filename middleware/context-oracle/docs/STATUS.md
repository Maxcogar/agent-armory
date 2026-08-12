# Context Oracle — status

*Plain-language project status, updated at the end of every working
session. Newest entry first.*

## 2026-08-01 — Phase 0 has a spec; four review rounds in; one real discovery about what the tool can do

**Where the project is.** Still design phase, **no code**. The first buildable phase
now has a requirement document of its own,
`docs/specs/spec-context-oracle-phase0.md`, and it has been through four rounds of
independent review — two passes each round, one checking facts and citations, one
attacking whether the decisions serve the mission. Round 4's findings are **not yet
applied**. That is the next piece of work and it is described at the bottom.

**The one thing you should know about what the tool can do.** Round 4 found, in the
harness documentation, that a message the oracle sends about an edit is attached to
the *result* of that edit. So the warning "that file is generated build output"
arrives immediately **after** the write, not before it. Three of the seven whisper
types are affected — consequence, and the generated- and vendored-file warnings.
The other four (orientation, coupling, completeness, verification) are unaffected,
because they were always meant to fire on something already finished.

**Why this is a limitation and not a failure.** None of those three guards against
something irreversible. Editing build output is not destructive, it is futile — the
edit evaporates at the next build. Editing vendored code is lost at the next
dependency update. Consequence is about call sites, not damage. All three warn about
**wasted work and wrong assumptions**, and the whisper still reaches the agent before
its *next* action, so it stops the waste from compounding and lets the agent undo the
one edit that triggered it. There is also no alternative: the only mechanism that
shows anything before a tool runs is the permission prompt, which is the gate you
ruled out. This is the ceiling of what a non-blocking tool can do on an edit.
It is judgment, not measurement — nothing has been run.

**What four rounds have actually settled.** The completion-claim mechanism (the tool
now recognises when an agent says it is done, by reading the text of what it just
said, rather than firing at every pause); the evidence thresholds and where each
number comes from; the security model; and every requirement's relationship to the
main spec. Every quotation in the document has been matched character-for-character
against its source — 36 of 36 in round 4.

**What keeps going wrong, and it is mine.** The document carries a summary table
saying "these requirements are unchanged from the main spec." It has been wrong in
ten rows, then eleven, then eight — three rebuilds, four rounds, same error. Each
time I correct the rows a review names and never re-check the rest. Round 4 also
caught a regression I caused: I renumbered the tests and did not update four things
pointing at them. And five of nine source pointers I added — to close a finding
about missing sources — pointed at the wrong source, because I added them without
checking them.

**The review trajectory, honestly.** The fact-checking pass has gone 20 → 14 → 7 →
9 findings. It stopped falling this round. The reviewers' own stop-rule is armed on
its first condition for the first time: if round 5 opens more than it closes, the
process says stop fixing and rethink the document rather than patch it again.

**What is next, concretely:**

1. **Apply round 4's findings by rebuilding the spec, and change what §3's table
   claims.** Keep the index — all 65 of the main spec's requirements accounted for
   exactly once, which is how an architect knows what Phase 0 owes and that nothing
   was dropped. That half is arithmetic, is script-checked, and has held every
   round. What goes is the column asserting a requirement is *identical* to the main
   spec: that is a second copy of what the requirement text already says, and it is
   the copy that goes stale — wrong in ten rows, then eleven, then eight, across
   three rebuilds. Each requirement states its own relationship to the main spec
   inside itself; the table points at where that is stated instead of asserting it
   separately, so there is nothing left for it to contradict. Write the edit-timing
   fact into the document while doing it.

   **Run `python3 docs/specs/check-phase0-spec.py` before and after.** It does the
   mechanical checks by script that I have done by hand and gotten wrong: coverage of
   all 65 requirements, no invented identifiers, criterion numbering, every
   requirement covered by a criterion or an inspection, every decision recorded and
   referenced, every internal reference resolving. It deliberately does **not** check
   whether a requirement means the same as v1's — that needs judgment, which is why
   the document should stop claiming it. On its first run it found four requirements
   (FR-A2, FR-K3, FR-K4, FR-K5) listed as in force with no definition in the body;
   that is part of the rebuild.
2. **Round 5 review, both passes.** If the count does not drop, the stop-rule fires
   and the answer stops being another fix round.
3. **Then the Phase 0 architecture document**, then plan, then build, then **run
   it** — every number the later phases are tuned from is still unmeasured because
   nothing has ever been run.

**What is broken or unknown.** Round 4's 25 findings are open. Nothing has been
built. The edit-timing limitation above is reasoned, not measured.

**Nothing needed from you.**

## What is still open, and where it lives

This file states the state; the evidence lives in the review documents. Nothing
below is a copy of them — each line says what is open and where to read it.

**Round 4 of the Phase 0 spec — 25 findings, none applied.** Nine from the
fact-checking pass, sixteen (plus ten minors) from the adversarial pass.
`docs/reviews/2026-08-01-round-4-expert-review-phase0-spec.md` and
`docs/reviews/2026-08-01-round-4-collapse-hunt-phase0-spec.md`. These are step 1
above.

**The old whole-scope architecture document — 32 findings, none applied, and the
document is not a base to edit.** It was abandoned as a base on 2026-07-31 when the
review cycle's own stop-rule fired; Phase 0 gets its own architecture document
instead. The findings were triaged then: **12 bear on Phase 0** and are inputs to
that new document — they are not closed and must be resolved while writing it — and
**20 belong to Phases 1 and 2**, which are not being architected yet. Deferred is not
closed. The triage and every finding's detail are in
`docs/reviews/2026-07-30-round-4-expert-review.md` and
`docs/reviews/2026-07-30-round-4-collapse-hunt.md`.

*Earlier session entries were removed from this file on 2026-08-01. It states the
current state and is rewritten each session rather than appended to, per
`CLAUDE.md`; the history is in git, the evidence in `docs/reviews/`, and the durable
lessons in `docs/collapse-log.md`.*
