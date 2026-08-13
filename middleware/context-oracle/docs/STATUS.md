# Context Oracle — status

*Plain-language project status, rewritten each session. It states the current
state and what to do next; the evidence lives in `docs/reviews/`, the durable
lessons in `docs/collapse-log.md`, and everything attributed to Max Cogar in
`OWNER-LEDGER.md`.*

## 2026-08-12 — Phase 0 spec through round 5 plus one owner correction; a dedicated owner-claims ledger started; its enforcement still to be designed

**Where the project is.** Still design phase, **no code**. The Phase 0 requirement
document (`docs/specs/spec-context-oracle-phase0.md`) was rebuilt against round 4's
findings and taken through round 5 — two independent passes, one checking facts and
citations, one attacking whether each decision serves the mission. Round 5 was the
**first clean result in this document's history**: every prior finding genuinely
closed, none recurring, none regressed, the non-convergence tripwire did not fire.
The fact-checking pass went 9 → 2 findings; the adversarial pass 16 → 5. All were
applied.

**The security fix worth knowing.** The harness gives a hook fields that can
silently rewrite the agent's edit before it runs (`updatedInput`) or replace a
tool's result (`updatedToolOutput`). The spec had blocked only the deny paths; the
requirement (FR-O4) now structurally forbids every such mutation field, so "the
oracle never changes the repo" rests on a mechanism, not a promise.

**The owner correction.** The spec (inheriting v1) assumed the oracle says at most
**one** whisper per event. That count was never Max Cogar's rule — his rule is a
per-trigger and per-session **token budget** (`RETHINK.md:175–176`), not a count. An
agent had hardened "budget" into "one," and it manufactured a false dilemma about
which of two useful notes must "win" at an edit. Corrected: the per-event limit is
the token budget, so when two notes each clear the bar and fit the budget, **both are
delivered**. Recorded as decision P0-D-27; logged in `docs/collapse-log.md` as a
process failure, because Max caught it, not the review mechanism.

**Not yet verified.** The token-budget correction was made *after* the round-5
review passes ran, so it has not been independently reviewed. That verification is
outstanding.

**New, owner-directed — a dedicated ledger for everything attributed to Max Cogar.**
Across the owner's projects, agents have repeatedly invented claims attributed to
him and propagated them as true, corrupting the work. His directive: every such
claim must live in one dedicated file, be referenced whenever it is involved, and
require his **explicit sign-off before work proceeds** on it. A pilot file,
`OWNER-LEDGER.md`, now exists — the 12 owner decisions on record in `RETHINK.md` §12
are listed PENDING his confirmation (nothing is treated as authoritative until he
signs), and two known fabrications (one-whisper-per-event; "the core problem") are
listed REJECTED so they cannot return. `CLAUDE.md` now points to it. **The
enforcement mechanism is unsolved:** an automated phrase/pattern-matching check was
proposed and rejected as inadequate. A real design is still owed, and it must not be
phrase matching.

**What to do next:**

1. **Max Cogar's sign-off on `OWNER-LEDGER.md`'s 12 pending entries.** Only he can
   move an entry to CONFIRMED; until then they are provisional.
2. **Design real enforcement for the owner-ledger — not phrase matching.** This is
   an open problem, not a settled approach.
3. **Independently verify the token-budget correction** to the Phase 0 spec.
4. **Then the Phase 0 architecture document**, then plan, build, and run it — every
   number the design is tuned from is still unmeasured, which is why Phase 0 exists.

**A question for the owner (plain yes/no).** The parent v1 spec still carries the
same unsourced "at most one whisper per event" wording that Phase 0 corrected.
Phase 0 governs Phase 0, so nothing is blocked — should v1 be corrected too so the
two documents agree? If unanswered, v1 stays as-is.

## What is still open, and where it lives

- **Round 5 of the Phase 0 spec — all findings applied.** Two passes:
  `docs/reviews/2026-08-12-round-5-expert-review-phase0-spec.md` (2 minor) and
  `docs/reviews/2026-08-12-round-5-collapse-hunt-phase0-spec.md` (5 findings + 4
  minors). The token-budget correction landed after them and is not yet reviewed.
- **The owner-claims ledger** — `OWNER-LEDGER.md` (project root). 12 entries pending
  Max's sign-off; a real (non-phrase-matching) enforcement mechanism is unbuilt.
- **The Phase 0 architecture document does not exist yet.** It is written after the
  correction is verified; the old whole-scope architecture stays as input to Phase 1,
  not a base to edit (`docs/collapse-log.md`, 2026-07-31).
