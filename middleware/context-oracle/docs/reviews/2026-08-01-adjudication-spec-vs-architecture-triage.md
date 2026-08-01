# Adjudication — is the project ready to write Phase 0's architecture? (2026-08-01)

*Independent pass, fresh subagent, never the author. **Written once, never
edited.*** Run before anything was written. Eighth pass of the day.

**Question put:** nobody had checked which of §14's open items the **spec** must
answer and which are the **architect's**. That distinction decides whether the
project is still doing spec work or can begin `docs/architecture-context-oracle-phase0.md`.

## A seam declared before the classification was used

Most open items are **phase-membership** items ("which phase builds X"). The
documents settle where they are recorded (spec §12) and who decides them (the
agent — sequencing), but **not** whether phase membership passes `CLAUDE.md`'s
spec-membership test: it is not a requirement, constraint, or acceptance
criterion, and it is not an architecture decision either (`spec:21-23` reserves
only component boundaries, storage layouts, IPC mechanisms and algorithms). They
are marked **SPEC-resident / agent-decided** rather than forced into either box —
forcing them would be the undecidable-criterion-hardened-into-the-spec that the
purpose hunt spent 17 findings removing.

## Classification (abridged; full table in the adjudication)

**NEITHER / already answered:** export format (Phase 2, self-disposing);
piggyback credential coverage (Phase 1 verification, spike already passed here);
transcript freshness (Phase 1 — *conditional*: becomes a Phase 0 gate only if
answer drift is placed in Phase 0); subagent hook contract (Phase 1, injection
spike already answered yes); conduct-genre detection quality (Phase 1, genuinely
the owner's but nothing to review yet); `additionalContext` merge order
(self-disposing); no metric for Phase 2's exit (self-disposing).

**ARCHITECTURE:** uptake detection's phase — *which component performs the join is
a component boundary*, and the item's own text says it blocks **Phase 1's** exit,
not Phase 0's; per-consumer Tier 3 state — *this is the Phase 0 architecture's
work, not a prerequisite to it; the §14 wording inverts a task into a blocker*;
R4-4 (the bar) — an input to the new document, and its Phase 0 premise dissolves
with B2 below.

**SPEC, but blocking the exit rather than the design:** Phase 0's numbers are
never reviewed; the acceptance criteria do not cover the requirement set. Both are
consumed at verification time.

**SPEC, cheap self-consistency:** §12's design-readiness rule is a set claim
unsatisfiable at Phase 2.

## (a) The fork — direct answer

**No, not yet — but what blocks is one paragraph of §12, not a phase of work.**

**B1 — Phase 0's genre set is defined by a reference the project has established
is the wrong basis, and §12 says so about itself.** Its live instances are the
unphased Unknown genre and Warning landmine arm, and the contested consequence and
answer-drift memberships. *The architect cannot resolve this*: putting a genre
list in the architecture is scope stated in the wrong file, and writing the
architecture against the incumbent five while noting the contest is settling by
silence — already logged as a finding.

**B2 — §12 states that Phase 0 *is* degraded mode, and two independent passes have
established from source that it is not.** Left as written, the Phase 0
architecture derives from a sentence that makes Phase 0 ship a raised bar and
announce "degraded mode" when nothing has degraded — and every measurement Phase 0
emits is taken at that handicapped setting. A spec sentence with a product
consequence is a spec fix. Fixing it un-homes FR-J3, so the same edit must phase
it: it is the fallback for a model path, and the model path is Phase 1.

**Sequence:** one §12 edit → the mandatory collapse-hunt **on that edit, before it
is written** → then the Phase 0 architecture.

Two supports for the remedy's *shape*, so it is not a fourth killed artifact: the
purpose hunt prescribed it in its own words — *"What would make it decidable: a
list, not a criterion… That list is writable today"* — and its F4: *"delete the
exclusion clause. Inclusion criteria may be stated."* A list that drops nothing is
none of the three shapes already killed.

## (b) Was the triage load-bearing or manufactured?

**Load-bearing — and the honest measure is that it *removes* work rather than
adding it.** STATUS's step 1 (uptake detection) comes off the critical path: it is
a Phase 1 question the build rule forbids resolving before Phase 0 has run, and
left in place the next session spends itself on it. Steps 2 and 3 come off too.
What STATUS had as step 4 is actually step 1, and it merges with step 5's first
clause into a single edit. Five steps become one.

*"The answer that buys the most writing is 'blocked — settle uptake, rebuild the
table, fix the bar, then derive contents.' The answer that buys the least is
'nothing blocks, go.' I took neither; I named a paragraph."*

This triage is **not** a substitute for the adversarial pass on B1's edit.

## (c) Anything genuinely the owner's?

**Right now: nothing.** Five §14 items each name a real owner decision — approve
the export format, accept degraded-only in a failing environment, ship narration
genres enabled, accept a subagent fallback or descope, keep conduct genres on by
default — and **none is answerable today**, because each is contingent on a
Phase 1/2 verification that does not exist. Handing him one now is a question with
no evidence attached.

**And one item offered to him should be withdrawn.** STATUS offered him the ruling
on `RETHINK.md:111` (*"the single highest-value signal"*), arguing the ban reached
rankings of purposes but not of signals. The collapse log bans *"the single
highest-value X"* verbatim; the line sits in RETHINK §4 (agent-authored analysis),
not §12 where owner decisions live; no record attributes it to him. **Already
written, not his** — and offering it is a mild instance of the project's most
persistent failure.

## Two findings not previously recorded

1. **§12's Phase 0 component list is not exhaustive against its own exits.** It
   names shims, session service, Tier 2 index, co-change miner and the diagnostic
   core — no CLI. But AC-4 requires `init`/index/`deinit` and AC-18 requires
   `ctxoracle status`, and both are Phase 0 exits. Same class as the FR-X6 finding
   already logged. Derivable, non-blocking, worth one sentence in the same edit.
2. **R4-C1 is a spec-wording defect, not an architecture one.** FR-A5's gloss
   defines warn-grade claims as requiring co-change support ≥ 3; a generated-file
   warning is a zone classification with no co-change support at all, so under the
   gloss it can never fire — while AC-5, a Phase 0 exit, requires it to. The
   governing clause resolves it (a non-history-backed claim is not the sentence's
   subject), so it is not blocking, but the gloss contradicts the clause. One word.
