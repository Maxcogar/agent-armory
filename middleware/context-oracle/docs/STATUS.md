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
`AD-9` rebuilt to the honest Phase A skeleton the spec mandates (deny plumbing +
conservative move recognizer; over-fire is a measured, escapable residual;
precision deferred to Phase B).

**The Phase A implementation plan is written and delivered:
`docs/plans/plan-phase-a.md`** (43 numbered steps, topologically sorted;
sixteen expert-plan output-contract sections; every non-trivial step in Gate 3
four-part format; every spec §14 Phase A acceptance criterion mapped to at least
one test; two build-time verifications scheduled as owner-run markdown probes;
four gaps recorded honestly with attempt evidence — no CodeGraph MCP available
in this environment, no Clear Thought MCP available, V7 not re-executed (Step 2's
runtime probe is the runtime check), the two L11 owner-run verifications).

The plan makes no design decisions the architecture had not already made — it
schedules the construction, orders it topologically, pins each acceptance
criterion to a mechanical test, and closes with the exit run on Max's real repos
that measures the honest floor. Every step's Source resolves to a named
architecture decision, a spec requirement, or a ledger key. The plan is
executable by another engineer — or by an autonomous agent — without inline
architectural decisions.

## What to do next (agent-owned)

1. **Independent expert-review + collapse-hunt on
   `docs/plans/plan-phase-a.md`** — dispatched to a fresh session/subagent
   who did not author it, per `CLAUDE.md` dominating rule 2. The author's
   own compliance passes (expert-plan Gates A/B/C, already run) do not
   substitute for adversarial attack. The reviewer's job: attack every
   step's collapse-test question harder and hunt for new ones; test
   whether Step 14's recognizer-minimalism holds under pressure or drifts
   toward the 2026-09-04 slop the plan is supposed to be armored against;
   verify every factual claim in the plan's Verification section
   resolves at the cited evidence; verify every register bin-1 answer
   is real (not a bin-2 in disguise); verify every gap's attempt
   evidence is real. Findings written to
   `docs/reviews/<date>-plan-phase-a-review.md`, never edited after.

2. **Apply every finding from Step 1** (per `CLAUDE.md` engineering
   standard: "When a review surfaces findings, apply all of them"). A
   plan update lives in the same file, `docs/plans/plan-phase-a.md`.

3. **Only then, build against `docs/plans/plan-phase-a.md`.** Steps
   1–42 in order, respecting the five checkpoints. Do not skip the
   tests-per-step verifications. Do not elaborate the answer-drift
   recognizer beyond its safe-skeleton scope (Step 14 restraint — the
   2026-09-04 collapse is the standing warning). Publish the exit
   report at Step 42 to `docs/reviews/<date>-phase-a-exit-run.md` with
   the honest floor — a suspiciously-high answer-drift coverage number
   is a finding, not a success.

4. **Run the two L11 owner-run verifications alongside the build** (per
   plan-phase-a Step 40): `test/build_time/real_transcript_marker_probe.md`
   and `test/build_time/user_prompt_submit_provenance.md`. Their results
   update L11's disclosure in `docs/architecture-phase-a.md` via a
   follow-up documentation PR after the build lands.

5. **After Phase A ships and its exit run is published, write the Phase B
   architecture** — per the per-phase lifecycle, only when Phase A's data
   exists.

## Open items

- The two build-time verifications the architecture names (`L11`): human-turn
  marker presence on Max's real interactive transcripts, and whether
  platform-injected turns fire `UserPromptSubmit`. Neither gates the design or
  the plan; both resolve with the owner-run probes above during the build.
- No owner question is open.
