# Context Oracle — status

*Plain-language project status, rewritten each session (not appended). It states
the current state and what to do next; evidence lives in `docs/reviews/`, durable
lessons in `docs/collapse-log.md`, ideas in `docs/IDEAS.md`, and everything
attributed to Max Cogar in `OWNER-LEDGER.md`.*

## The Phase A goal (the north star — read this first)

Phase A is the **honest deterministic foundation, and the measurement of its own
floor.** It stands up the genuinely-deterministic core on Max's real repos — the
stores, the index, the miner, the model-free whisper genres, the deny plumbing,
the self-observability — runs cleanly with no incident, and tells Max the truth
about what that core does and does not do. The spec (§11.5) defines the Phase A
exit as a *measurement*, not a finished feature: it "exits by producing measured
whisper/block, false-fire, and regret data on a real repo — **including how
little the conservative recognizer catches** before Phase B." The deliverable is
honest capability plus honest measurement, with clean seams the later phases plug
into — **never fake completeness dressed to look like a working product.** Judge
every Phase A decision against this goal (`CLAUDE.md` dominating rule 3).

## Where the project stands

The spec (`docs/specs/spec-context-oracle.md`) is signed off (`OL-C6`). The Phase
A architecture (`docs/architecture-phase-a.md`) is complete: its
non-answer-drift decisions passed a round-10 expert review, and the answer-drift
block `AD-9` — the one block previously found to be over-built "slop" — has been
**rebuilt to the honest Phase A skeleton the spec mandates.**

**What `AD-9` now is.** Deny **plumbing** (a `PreToolUse` deny confined to one
producer, `AD-10`) plus a **conservative move recognizer**: while any question
Max asked is open, a repo-mutating file edit (`Write`/`Edit`/`NotebookEdit`) is
denied ("answer Max's question first"); every other move — reads, searches,
test/build runs, spawns, MCP, web — runs free (`D-39`). A question is tracked as
open when Max asks a clear interrogative and cleared when the agent gives a
substantive text turn; Phase A **never classifies what kind of answer a question
wants.** The model-free info/request classifier the previous version had grown
(verb/object lexicons, noun-phrase heads, wh-precedence, coordinated-ask) is
**removed entirely** — that was the fake-completeness `D-41`/§11.5 forbid Phase A
from building (`docs/collapse-log.md` 2026-09-04).

**Why this is the honest skeleton, not a working block.** A model-free recognizer
cannot tell an edit that *is* the answer to a request ("rename `foo`") from an
edit that ignores the question, so `AD-9` over-denies that case — the
**wrongful-deny residual**, escapable by one answering turn and **measured** on
the wrongful-deny rate. Its real-repo coverage is deliberately low and is a Phase
A **exit measurement**, not a claim. The precision — judging whether a move is
answer-directed — is a comprehension judgment deferred to **Phase B**, which
swaps the deterministic state-writer for a model-maintained one behind the same
`qa/state.ts` interface, with no change to the deny path, tables, hook wiring, or
audit. That seam is the point of the skeleton.

## What to do next (agent-owned)

1. **Complete the goal-first review of the rebuilt `AD-9`** — a fresh expert
   review + independent collapse-hunt aimed goal-first (`CLAUDE.md` rule 3: "does
   this serve the Phase A goal, or is it machinery that only passes review?"),
   with all findings applied, before it is trusted.
2. **Then write the Phase A implementation plan** (greenfield expert-plan,
   consuming the spec + this architecture), and build against §11.5's Phase A exit
   and the §14 Phase A acceptance criteria.

## Open items

- **Residual fix-narration elsewhere in the architecture doc.** A few small
  "round-N" review mentions remain in sections unrelated to `AD-9` (e.g. `AD-4`'s
  fail-open note, `AD-24`'s AC-19 note). They break the "never narrate fixes in
  the architecture doc" rule and should be swept in a separate pass; they change
  no design.
- The two **build-time verifications** the architecture names (`L11`): human-turn
  marker presence on Max's real interactive transcripts, and whether
  platform-injected turns fire `UserPromptSubmit`. Neither gates the design; both
  resolve with real captured sessions during the build.
- No owner question is open. The answer-drift design principle is settled (honest
  skeleton + clean seam, coverage measured at exit, never fake completeness).
