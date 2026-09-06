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

**The Phase A implementation plan is written but is NOT deliverable under
the expert-plan SKILL.md's own rule** — one bin-2 register entry (Q-gap-5) is
open, and SKILL.md says: *"A plan with any open register entry is not
deliverable."* Q-gap-5 is the escalation Max Cogar has to rule on before the
plan proceeds.

**How the plan got here.**

The plan is at `docs/plans/plan-phase-a.md`, PR #78 draft on branch
`claude/context-oracle-1evnd9`, head `99be60a`. It has been through two
adversarial reviews and one fix pass:

1. **The plan-writer's own compliance review** —
   `docs/reviews/2026-09-06-author-gates-review.md`. Found 20 findings on
   the author's own artifact (5 Critical, 7 Serious, 4 Moderate, 4 Minor)
   covering test-spec incompleteness, a fabricated §14 reconciliation-sweep
   attestation, an absence-claim with wrong data, missing citation
   line-ranges, undocumented src/ files, shared test specs violating the
   "trivially mechanical only" rule, doubles without Meszaros type, an
   unverified byte-identical claim, and more.
2. **A meta-check subagent** — `docs/reviews/2026-09-06-meta-check-skipped-steps.md`.
   Read the expert-plan SKILL.md in full and the session transcript. Found
   H1–H8 covering the two most damaging classes: (H1) two of the skill's
   halt-condition tools (CodeGraph, Clear Thought) are unavailable in this
   environment and the plan proceeded despite the skill mandating stop-and-
   report; and (H2) the plan was delivered before the compliance gates were
   walked (the author asserted "gates pass" without walking them).
3. **A five-batch fix pass** (commits `bbcd55f`, `6cb00ce`, `107673c`,
   `e60293b`, `99be60a`) applied every content finding from the author's
   review and every content finding from the meta-check. What did not fix
   is H1's skill halt-condition violation — that is a Max-decides item
   (Q-gap-5 in the plan's Gaps section). Also open: L11(b) is empirically
   unresolvable inside this container (hook install blocked) but the
   design is safe either way per AD-9's voiding guard; resolves naturally
   on first real install.

**What still remains** (all Max Cogar decisions or first-real-install
observations, not plan-writer work):
- **Q-gap-5** (Gaps section of the plan) — bin-2 owner decision: accept /
  halt / waive the SKILL.md halt-condition violation. Options are
  spelled out plainly in the plan's Gaps section.
- **L11(a) documentation update** — the human-marker presence
  measurement done this session should feed a documentation PR to
  architecture L11(a); that is Step 43 post-completion work, not build.
- **L11(b) first-install observation** — resolves naturally, no probe
  required.

## What to do next (agent-owned unless it says owner-decision)

1. **[OWNER DECISION] Rule on Q-gap-5.** Read the plan's Gaps section Q-gap-5
   (options A/B/C — accept / halt / waive the skill halt-condition
   violation for this plan). Whichever you pick, the plan-writer will
   apply your ruling in the plan's Gaps section and update STATUS.md.

2. **After Q-gap-5 ruling:** dispatch a fresh independent review
   subagent against the current commit (the earlier one was
   dispatched against `9d1521e` which has since been rewritten across
   commits `bbcd55f`..`99be60a` — that review is stale and does not
   count). The fresh review attacks the plan's §10A step-2 questions
   and hunts for new load-bearing decisions the author's collapse-test
   missed. This is agent-owned dispatch, not an owner ask.

3. **After the independent review lands and its findings are applied:**
   build against `docs/plans/plan-phase-a.md`. Steps 1–43 in order,
   respecting the five checkpoints. Do not skip test-per-step
   verifications. Do not elaborate the answer-drift recognizer beyond
   its safe-skeleton scope (Step 14 restraint — the 2026-09-04 collapse
   is the standing warning). Publish the exit report at Step 42 with
   the honest floor — a suspiciously-high answer-drift coverage number
   is a finding, not a success.

4. **After Phase A ships and its exit run is published:** write the
   Phase B architecture (per the per-phase lifecycle).

## Open items

- **Q-gap-5** (plan Gaps section) — bin-2 owner decision open. Blocks
  deliverability per SKILL.md's own rule.
- **L11(a) documentation** — measurement resolved; documentation PR
  deferred to Step 43.
- **L11(b)** — resolves on first real install; no probe needed.
