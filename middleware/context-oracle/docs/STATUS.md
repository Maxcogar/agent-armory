# Context Oracle — status

*Plain-language project status, rewritten each session. It states the current
state and what to do next; the evidence lives in `docs/reviews/`, the durable
lessons in `docs/collapse-log.md`, and everything attributed to Max Cogar in
`OWNER-LEDGER.md`.*

## 2026-08-13 — The token-budget correction is now independently verified and repaired; the Phase 0 spec is clean; next is the Phase 0 architecture document

**Where the project is.** Still design phase, **no code**. The one item the last
session left open — the token-budget correction (`P0-D-27`), which had landed *after*
the round-5 review passes and so had never been independently reviewed — is now
verified and repaired. With that closed, the Phase 0 requirement document
(`docs/specs/spec-context-oracle-phase0.md`) has **no outstanding unreviewed change**,
and the spec's own check script passes 8/8.

**What the verification did.** Two independent adversarial passes (both recorded in
`docs/reviews/`, dated 2026-08-13). The correction's intent was right — multiple
whispers per event; the count-of-one was your rejected fabrication — but as it had
landed it was incomplete and over-reached in three ways, all now fixed:

1. The single-whisper count it claimed to remove **still survived in two other
   requirements** — `FR-A5` ("only the top candidate above the bar is spoken") and
   `FR-O2` ("relay at most one whisper back"). Both corrected: every whisper that
   clears the high bar is delivered within the session budget, and the shim relays all
   of them.
2. The new rule leaned on a "per-trigger token budget" with **no value and no
   source**. Rather than invent a number in a phase built to *measure* numbers, Phase 0
   now sets **no** separate per-trigger number: the per-trigger cap defaults to the
   session cap, and a tighter cap (and any ordering of whispers if one were ever
   needed) is **deferred to Phase 1**, where the exit-run data that would set it will
   exist. The session's own hard cap still bounds everything meanwhile. Recorded as
   `[P0-D-28]`.
3. The "token" denomination had been **attributed to you**. Your words are "per-trigger
   and per-session whisper budgets, hard caps" — no denomination. The token reading is
   now labeled a derived document judgment everywhere it appears.

**The fix that matters most for the next session.** The second pass caught that
`OWNER-LEDGER.md` — the file every session reads *first* as the authority for what is
yours — still said "your rule is a token budget," re-committing the exact
over-attribution the correction was fixing. `OL-R1` now matches your verbatim words
and flags the token reading as the document's judgment, not yours. This is the class of
error this project most repeatedly makes, and the authority file was quietly carrying
one.

**How this was caught.** By the independent passes, **not** by you. That is the
mechanism working as designed — the owner is not meant to be the substance-reviewer.
The recurring lesson (a correction must sweep *every* copy of the old rule, and must
not replace an unsourced limit with a new unsourced number) is logged in
`docs/collapse-log.md` (2026-08-13).

**What to do next:**

1. **Write the Phase 0 architecture document** — `docs/architecture-context-oracle-phase0.md`,
   derived from the now-clean Phase 0 spec, resolving the design questions the spec
   assigns to the architect for Phase 0, and adversarially reviewed with all findings
   applied (same discipline as the spec). This is the next lifecycle stage and the spec
   is ready for it. The existing whole-scope architecture stays as **input to Phase 1**,
   not a base to edit (`docs/collapse-log.md`, 2026-07-31).
2. **Then plan, build, and run Phase 0** against the spec's §12 exits and §14 acceptance
   criteria — every number the design is tuned from is still unmeasured, which is why
   Phase 0 exists.

**A question for you (plain yes/no).** The parent v1 spec
(`docs/specs/spec-context-oracle.md`) still carries the same unsourced "at most one
whisper per event" wording that Phase 0 just corrected. Phase 0 governs Phase 0, so
nothing is blocked — should v1 be corrected to match, or left as-is? If unanswered, v1
stays as-is.

## What is still open, and where it lives

- **The token-budget correction thread is closed.** Verified across two independent
  passes (`docs/reviews/2026-08-13-verification-p0-d-27-token-budget-phase0-spec.md`
  and `…-reverification-p0-d-27-corrected-phase0-spec.md`) and repaired across `FR-A3`,
  `FR-A5`, `FR-O2`, the §3 disposition, `P0-D-27`, new `P0-D-28`, `AC-28`, and
  `OWNER-LEDGER.md` OL-R1.
- **The owner-claims ledger** — `OWNER-LEDGER.md`. Its 12 PENDING entries still await
  your sign-off; nothing there is authoritative until you confirm it. A real
  (non-phrase-matching) enforcement mechanism for it is still unbuilt — a thread you are
  directing, not a blocker on the spec.
- **The Phase 0 architecture document does not exist yet.** It is the next stage now
  that the spec is clean.

## This session's PR

`https://github.com/Maxcogar/agent-armory/pull/59` — the verification and repair above.
