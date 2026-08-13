# Context Oracle — status

*Plain-language project status, rewritten each session. It states the current
state and what to do next; the evidence lives in `docs/reviews/`, the durable
lessons in `docs/collapse-log.md`, and everything attributed to Max Cogar in
`OWNER-LEDGER.md`.*

## 2026-08-13 (later) — Max Cogar ruled the token/whisper budget OUT entirely; the Phase 0 spec is reopened; the removal is decided but NOT yet applied to the spec

**The decision that changes everything.** Max Cogar ruled that **no arbitrary
limit gates the oracle's operation** — *"either the information its giving the
agent is important, or its not. at no point should an arbitrary limit influence
how that operates."* Recorded as **OL-C1 (CONFIRMED)** in `OWNER-LEDGER.md` — the
**first confirmed owner decision** in the ledger. The per-session/per-trigger
token budget is rejected as never his (**OL-R3**): it was introduced in
`RETHINK.md` §5 rationale, was **not** one of his §12 decisions, and was treated
as settled through every review round until he questioned it this session.

**Read this before trusting the spec:** the **ledger now says no budget, but the
Phase 0 spec still contains it.** `FR-A3` still reads "budgets," and
`FR-A5` / §7 / `AC-2` / `AC-28` / `NF-2` / `P0-D-15/16/27/28` still depend on it.
The removal is **decided, not yet applied.** Do not trust those passages.

**What this supersedes.** Earlier this session I "verified and repaired" the
token-budget correction (P0-D-27/28) and called the thread closed. That is dead:
the budget those decisions made coherent is being removed. **PR #59's
token-budget work is largely superseded**, and the Phase 0 spec is **reopened**,
not near-done. I was wrong to report it as nearly finished.

**Why the budget is wrong (so it is not re-litigated).** The mission delivers
"the fact that would change the agent's next decision." Such facts are rare, so
the **bar** (confidence × decision-impact × marginal value) is the volume control
at the level that matters — relevance, per decision. A global token/session quota
is a wrong-shaped duplicate whose only distinctive effect is going mute
mid-session, possibly right before the decisive moment — it can defeat the
mission. The one legitimate residual concern (a malfunctioning oracle spamming)
belongs to self-observability (FR-M): **detect and surface** the fault, never
silence a real whisper.

**What to do next:**

1. **Apply the budget removal to the Phase 0 spec** as one careful pass, then put
   it through an independent review against this corrected foundation. Reshaped
   `FR-A3` anchor: *"No limit gates delivery; the bar is the sole arbiter — no
   per-session or per-trigger budget of any kind; nothing suppresses a whisper
   that clears the bar (`[OL-C1]`); a malfunctioning oracle is detected and
   surfaced via FR-M, never silenced."* Cascade: `FR-A5` (drop "within budget"),
   §7 (every candidate that clears the bar is delivered), `AC-2` (make the 10% a
   descriptive expectation, not an enforced throttle — derivable from OL-C1),
   `AC-28` (multiple above-bar whispers all delivered, nothing caps them), `NF-2`
   (overhead reported, not capped), retire/rewrite `P0-D-15/16/27/28`, fix §3's
   `FR-A3` row.
2. **v1 spec correction stays deferred** until Phase 0 is complete, per Max
   Cogar. v1 `FR-A3` still carries the rejected budget (OL-R3) and the
   "at most one whisper per event" fabrication (OL-R1). Do not touch v1 yet.

**Open question for the owner (awaiting his answer, a or b):** (a) excise just
the budget, or (b) also run the same "mission-grounded vs arbitrary" lens over
the rest of the Phase 0 spec — since the budget was not the only mechanism that
slipped through every review. The sweep proceeds once he answers.

**A process rule Max directed this session (wording proposed in chat, NOT yet
approved, so NOT yet encoded).** Every owner decision must be (1) stated
explicitly in the document, (2) quoted to Max in chat, and (3) explicitly
approved or denied before any work rests on it — applying to already-assumed
premises, not just new claims. It goes into `CLAUDE.md` and strengthens the
`OWNER-LEDGER.md` rules **once he approves the exact wording.**

## What is still open, and where it lives

- **`OWNER-LEDGER.md`** — OL-C1 (CONFIRMED: no arbitrary limit), OL-R3 (REJECTED:
  the budget), OL-R1 (corrected). OL-1…OL-12 remain PENDING his review; nothing
  there is authoritative until he confirms it.
- **The Phase 0 budget removal** — decided (OL-C1), **not yet applied** to the
  spec. This is the next build step (above).
- **PR #59** (`https://github.com/Maxcogar/agent-armory/pull/59`) — its
  token-budget work is largely superseded; its body still describes the old
  "fix" and needs updating once GitHub is reachable again.
