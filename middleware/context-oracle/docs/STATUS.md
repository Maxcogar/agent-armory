# Context Oracle — status

*Plain-language project status, rewritten at the end of every working session.
It states the current state and what to do next; the evidence lives in
`docs/reviews/`, the durable lessons in `docs/collapse-log.md`.*

## 2026-08-12 — Phase 0 spec: round 5 converged; an owner correction applied; a verification pass, then architecture

**Where the project is.** Still design phase, **no code**. The Phase 0
requirement document (`docs/specs/spec-context-oracle-phase0.md`) was rebuilt
from scratch against round 4's findings, then put through round 5 — both
independent passes, one checking facts and citations, one attacking whether each
decision serves the mission. **Round 5 is the first clean result in this
document's history**: every prior finding genuinely closed, none recurring, none
regressed, and the non-convergence tripwire did not fire. The fact-checking pass
went 9 → 2 findings (both minor, applied); the adversarial pass went 16 → 5
(all applied).

**What round 5 found, and why it mattered.** Two of the five new adversarial
findings were mistakes the rebuild itself introduced — one of them a hollow
mechanism (a scoring "zone term" claimed to do something it mathematically could
not), which is the exact trap this project keeps springing. All are fixed. The
heaviest finding was a real security gap: the harness gives a hook a field
(`updatedInput`) that can silently rewrite the agent's edit before it runs, and
the spec had only blocked the *deny* paths. The requirement now structurally
forbids every mutation field, so "the oracle never changes the repo" has a
mechanism behind it, not just a promise.

**One correction Max Cogar made by hand — logged because the review mechanism did
not catch it.** The spec assumed the oracle says at most **one** whisper per
event. That count is **not the owner's rule.** The owner set per-trigger and
per-session **token budgets** (hard caps); an agent had quietly hardened "budget"
into "exactly one," and it manufactured a false dilemma — which of two genuinely
useful notes must "win" at a single edit. Corrected: the per-event limit is the
token budget, so when two notes each clear the bar and fit the budget, **both are
delivered**. There is nothing to rank and nothing to sacrifice. This dissolved an
owner question a draft had raised earlier this session. Recorded as decision
P0-D-27.

**What is next, concretely:**

1. **One more verification review pass** over the applied fixes and the
   token-budget correction. A load-bearing assumption changed, and this session's
   own edits introduced defects twice, so the changes are re-attacked before the
   document is called finished. If it comes back clean, the spec is
   architecture-ready.
2. **Then the Phase 0 architecture document**, then plan, then build, then **run
   it.** Every number the design is tuned from is still unmeasured, because
   nothing has ever been run — that is the whole reason Phase 0 exists.

**What is broken or unknown.** Nothing is built. The edit-timing and
delivery reasoning throughout the spec is judgment, not measurement.

**A question for the owner (a plain yes/no).** The parent v1 spec still contains
the same unsourced "at most one whisper per event" wording that Phase 0 just
corrected. Phase 0 governs Phase 0, so nothing is blocked — but should the v1 spec
be corrected too, so the two documents agree? If left unanswered, v1 stays as-is.

## What is still open, and where it lives

**Round 5 of the Phase 0 spec — all findings applied.** Two passes:
`docs/reviews/2026-08-12-round-5-expert-review-phase0-spec.md` (2 minor) and
`docs/reviews/2026-08-12-round-5-collapse-hunt-phase0-spec.md` (5 findings + 4
minors). Each finding's fix is in the current spec; the reviews are the evidence
of record.

**The Phase 0 architecture document does not exist yet.** The old whole-scope
architecture document is retained as input to Phase 1's architecture, not as a
base to edit (see `docs/collapse-log.md`, 2026-07-31). The Phase 0 architecture is
written after the verification pass above clears.
