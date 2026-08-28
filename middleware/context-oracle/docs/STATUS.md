# Context Oracle — status

*Plain-language project status, rewritten each session (not appended). It states
the current state and what to do next; evidence lives in `docs/reviews/`, durable
lessons in `docs/collapse-log.md`, and everything attributed to Max Cogar in
`OWNER-LEDGER.md`.*

## Where the project stands (2026-08-28)

The **v1 spec** (`docs/specs/spec-context-oracle.md`) is the single spec for the whole tool,
built in phases (A/B/C are build order, not separate products). It rests on the verified Claude
Code hooks contract (re-verified 2026-08-25) and clean owner-attribution: nothing is attributed to
Max Cogar that is not CONFIRMED in `OWNER-LEDGER.md`.

**This session: the spec was checked against the `expert-spec` skill and stripped.** Max asked for
an honest evaluation against that skill's bar. It **passed** Gate A (Frame — every requirement
traces to a source) and Gate B (Premise — every external fact carries a dated verification), which
are genuine strengths. It **failed** Gate C (hygiene) three ways, and the strip fixed them:

- **Self-narration.** §8 carried ~50 lines narrating its own *review methodology* (the
  "author picks the beatable question" argument, a round-3-hunt anecdote, a heightened-provenance
  essay), and an "asserted honestly / surfaced to Max / not overclaimed / not hidden" refrain ran
  document-wide. All removed; every real caveat kept, the narration about disclosing it dropped.
- **Smuggled design (HOW).** The answer-drift block had been specified down to its mechanism —
  a lag window, cached async classifier state, a steady-state-vs-lag-window lean reversal,
  post-condition chaining. That is architecture, and it was also the **OL-C3 violation**: OL-C3
  says *"dont make a convoluted fucked up way,"* and the machinery was exactly that. It is now
  stated as a **property** (what must hold), with the mechanism deferred to the Phase A
  architecture doc, per the project's own spec→architecture lifecycle.
- **A live defect.** `[D-35]` still named the **rejected OL-R5** predicate *"is-this-writing-code"*
  as an active axis — a direct contradiction with the confirmed OL-C5 answer-directed rule. Fixed.

After the §8 strip, the same self-narration was found scattered document-wide — D-39 still
re-told the rejected "writing code" story, and a "stated limit / surfaced to Max / not a defect"
refrain ran through §1, §4, §9, §11, §12, and §14. A full-document cleanup removed all of it
(positive statements kept; the narration about disclosing them dropped), then an **independent
read of the whole current file** verified it: it found one remaining clause (FR-B2's "not a
property the spec claims can never occur"), which was removed. The spec is now **1,094 lines**
(from 1,291) with no loss of requirements or properties; CI green (PR #59). The `OWNER-LEDGER.md`
OL-C5 entry was likewise reduced to a plain statement of the answer-drift block. Review record for
the blocking-model rounds is unchanged: `docs/reviews/2026-08-25-blocking-model-rebuild-6-rounds.md`.

## The two blocks, as the spec now states them

Both are owner-confirmed; both are a reactive `PreToolUse` **deny of the deviating action**, never
a pre-emptive gate, never a Stop-based hold. §8 is the authority.

- **Answer-drift (OL-C3 / OL-C5).** After Max asks a question, a next move that is neither a direct
  answer nor an action taken to provide the answer is denied ("answer Max first") until the agent
  answers. Actions that get the answer — reading, searching, running a test — run freely, so the
  block never deadlocks the path to a truthful answer or forces a fabricated "it works." A text
  answer is never a tool action, so it is never denied: the way out always exists. Judging
  "is this move answer-directed?" needs the model, so Phase A ships a conservative skeleton (denies
  only clearly non-answer-directed moves) and Phase B gives it OL-C5 precision.
- **Skill non-conformance (OL-C2).** An expert skill is active and the agent skips a declared step:
  steer first (whisper), then deny the step-skipping action if it proceeds without a stated reason.
  Its under-fire guard is automated (a step's observable post-condition checked against repo/store
  state), because Max cannot see a skipped step himself (OL-11). A step with no checkable
  post-condition is out of that guard's reach.

## What to do next (agent-owned)

1. **The Phase A architecture document**, derived from the current spec, is the next lifecycle
   stage — no build before it. It is where the mechanism the strip removed from the spec gets
   worked out and adversarially reviewed: the answer-drift async question/answer-state maintenance
   (kept off the synchronous deny path), the skill block's post-condition chaining, the stores/
   index/miner, and the relevance bar's numeric combinator. At architecture time, re-confirm one
   load-bearing hooks fact against current source — that `transcript_path` is written
   asynchronously / may lag (the answer-drift clear-axis rests on it; the hooks contract has
   drifted before).
2. **Sync `RETHINK.md` §12.12** to the reactive-`PreToolUse`-deny mechanism (it still describes the
   superseded Stop-based no-deny model). Treat RETHINK as agent-contaminated; only `OWNER-LEDGER.md`
   CONFIRMED is authoritative. (The context-oracle `CLAUDE.md` is already synced.)

## Open external unknown (does not gate v1 design)

Whether a subagent hook's `additionalContext` propagates to the parent is undocumented; the spec
assumes **not** (C-4) and a cheap pre-design spike showing otherwise only adds an option. (Spec §13.)
