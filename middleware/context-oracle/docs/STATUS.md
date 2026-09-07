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
A architecture (`docs/architecture-phase-a.md`) is reviewed to convergence, with
`AD-9` rebuilt to the honest Phase A skeleton the spec mandates.

**The Phase A implementation plan (`docs/plans/plan-phase-a.md`) was re-authored
on 2026-09-07** from every finding of the 2026-09-06 review set
(`docs/reviews/2026-09-06-plan-collapse-hunt.md`,
`2026-09-06-plan-expert-review.md`, `2026-09-06-author-gates-review.md`,
`2026-09-06-meta-check-skipped-steps.md`), with the expert-plan skill's required
tools actually run over stdio (CodeGraph scan of the project as the
pre-implementation baseline; Clear Thought passes for every plan decision) and
every factual premise re-read or re-executed on 2026-09-07 (§11 of the plan).

What the re-authored plan is:

- 40 topologically ordered steps; every non-trivial step carries the Gate 3
  four-part reasoning; no option sets, no deferred choices, no owner
  questions (bin 2 is empty and says why).
- The answer-drift block stays the spec §11.5 **safe skeleton**: deny plumbing
  plus a `?`-only recognizer with negative-coverage tests that fail on any
  elaboration; the lag hold is read-to-EOF plus deny-on-open with no
  heuristic; coverage is a number the exit run measures, never designed
  around.
- 113 test specifications, each with File / Verifies / Level / Real-doubles /
  Data / Fails-when, compiled with the sources and run through a runner that
  refuses an empty or mismatched test set (the 22.16.0 floor cannot execute
  `.ts` tests and `node --test` exits 0 on an empty glob — both executed).
- Pins unchanged from the architecture (`web-tree-sitter` 0.26.13,
  `tree-sitter-wasms` 0.1.13, Node ≥ 22.16.0); the one premise drift found
  (the hooks reference now lets a timed-out `PreToolUse` hook's tool
  continue) is recorded as the plan's §4 spec issue and changes no
  requirement.
- An exit run (Step 39) with three legs, a validity rule that refuses a
  reflection-only measurement, and a report whose fields include the honest
  floor numbers.

The author's Gate A/B/C walk for this version is
`docs/reviews/2026-09-07-author-gates-review.md`; it names the check run for
each gate item and the seven defects closed before the independent reviews.

**Review state.** The round-2 independent collapse-hunt and expert-review
(`docs/reviews/2026-09-07-round-2-collapse-hunt.md`,
`2026-09-07-round-2-expert-review.md`) are being run in the same session that
re-authored the plan, by fresh subagents over the entire document. The plan is
**not accepted** until both converge; this file is rewritten with their verdicts
before the session ends.

## What to do next (agent-owned)

1. **Apply every round-2 finding** in `docs/plans/plan-phase-a.md`, with the
   dependent sections re-derived (a finding is not a fix list — trace what
   depends on the changed decision and correct it there too). Then re-run
   the author's Gate A/B/C walk in writing and dispatch the next round.
   Convergence rule from the owner: two consecutive rounds where the
   corrections themselves introduced defects means stop and diagnose the
   correction process externally; five rounds without convergence means stop.
2. **When the reviews converge,** rewrite this file to say so, route any
   generalisable lesson to `docs/collapse-log.md` (one line plus a pointer),
   and the plan becomes the build contract for `/expert-implement`.

## Open items

- L11(a) — human-marker presence was measured on a real interactive
  transcript (11 `origin.kind:"human"` entries, markers present as V12 and
  AD-9 assume); the plan re-measured it on 2026-09-07 and carries
  `T38-32` to measure it over the exit corpus. The architecture's L11(a)
  wording moves from "assumption" to "measured" in a documentation change
  after Phase A completes (the plan's Post-completion section).
- L11(b) — whether `UserPromptSubmit` fires for platform-injected turns is
  undocumented (plan gap G2); the plan resolves it by live induction inside
  the exit run's closed-loop leg and records fires / does not fire / not
  observed. Design-safe either way per AD-9's voiding guard.
