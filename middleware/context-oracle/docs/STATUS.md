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
on 2026-09-07 and has been through two more independent review rounds. It is
not accepted.** The correction loop was stopped after round 3 under Max Cogar's
rule — two consecutive rounds in which the corrections themselves introduced
defects — and the session's remaining work went into diagnosing that and
shipping an external fix, not into a fourth correction pass.

What is true of the plan now (commit `d667534` is the reviewed text):

- **On the mission axis it holds.** Four independent passes (rounds 2 and 3,
  both kinds) read Steps 21–27 line by line against `AD-9` and found the
  answer-drift block is the spec §11.5 safe skeleton and nothing more; the
  package pins and the Node floor are the architecture's; no scope was added
  or dropped. The exit run now hands the handler a per-event transcript
  prefix and measures the recognizer against a labelled sample, not against
  itself.
- **On the build/test-mechanics axis it does not.** Round 3
  (`docs/reviews/2026-09-07-round-3-expert-review.md`: NEEDS FIXES, 20
  findings; `docs/reviews/2026-09-07-round-3-collapse-hunt.md`: DOES NOT
  SURVIVE, 23 findings) found, among others: the handler step consumes modules
  and a CLI verb that later steps create, so its checkpoint cannot run where
  placed; a convention test forbids words the plan's own modules must use; a
  concurrency test's timeline produces the opposite of its asserted outcome
  (executed by both reviewers); the cold-container CI job runs a script
  created thirty-seven steps later, on an image without `git`; the exit run's
  remote sessions leave their stores where the report cannot read them; a
  deny-health detector now counts correct denies; the Clear Thought attestation
  is contradicted by the trace file that was added to prove it. Every finding
  carries line numbers and the source it contradicts; 23 of the 43 are tagged
  as introduced by the round-2 corrections.
- **The diagnosis** is `docs/collapse-log.md` 2026-09-07 (the last entry): the
  author validated corrections with an identifier-reconciliation script while
  the reviewers validated by walking the build in order and executing claims;
  every regression class lay outside the author's check. The external fix is
  `tools/check_plan.py` — a mechanical gate for the plan (temporal
  availability of every module, verb, script, and fixture a step names;
  creation annotations; test-ID reconciliation; attestation and count
  consistency; sweep-record termination; narration). Run on the current plan
  it reports 19 problems that reproduce round 3's build-order and attestation
  findings; run on the round-2 artifact it flags two inversions round 2 did
  not name. It is not yet wired into CI, on purpose: it joins the workflow in
  the pull request that first makes the plan pass it, so it never lands as a
  red check on a plan that predates it.

The other evidence files this session added, all under `docs/reviews/`:
`2026-09-07-author-gates-review.md` and `2026-09-07-round-3-author-gates-review.md`
(the author's written self-checks before rounds 2 and 3, with the round-2
closure table), `2026-09-07-round-2-collapse-hunt.md`,
`2026-09-07-round-2-expert-review.md`, and `2026-09-07-plan-tool-traces.md` (the
captured CodeGraph and Clear Thought stdio logs from the planning run — round 3
found that the current decisions D-plan-6, 8, 10 and 20–23 are not covered by
them, which is one of the open findings).

## What to do next (agent-owned)

1. **Apply every round-3 finding — all 43, both reviews — under the new
   discipline, not the old one.** The discipline, from the collapse-log entry:
   run `python3 middleware/context-oracle/tools/check_plan.py` and get it green
   before anything else; execute every executable claim a correction states (a
   timeline, a compiler or runtime behaviour, a package layout) before writing
   it, and record the execution in the plan's evidence section — a reviewer's
   "required change" is a hypothesis to execute, not text to transcribe;
   re-enumerate every convention test's allow/deny set against every module
   the file tree places in its scope; then dispatch a **dry-run implementer**
   subagent that walks Steps 1–40 in order and states, per step, what the step
   needs and whether it exists yet — and only when that pass is clean, dispatch
   round 4 (independent collapse-hunt and expert-review, fresh subagents, whole
   document). Write the author's Gate A/B/C self-check before dispatch as
   before. Round-4 arithmetic the expert-review series records: the review
   tripwire fires if round 4's new + regression count ≥ its closed count or its
   total ≥ 20; Max Cogar's rule is unchanged — corrections that introduce
   defects in round 4 means stop again, and five rounds without convergence
   means stop.
2. **Wire `tools/check_plan.py` into `.github/workflows/context-oracle-docs.yml`
   in the same pull request** that makes the plan pass it, beside
   `check_docs.py`, so no later session can skip it.
3. **When the reviews converge,** rewrite this file to say so, route any
   further generalisable lesson to `docs/collapse-log.md`, and the plan becomes
   the build contract for `/expert-implement`.

There is no owner question open. The stop was the owner's own rule applied;
the diagnosis and the external fix are recorded; the next session resumes with
them in place.

## Open items

- The 43 round-3 findings (item 1 above). The plan is not deliverable until
  they are closed and a round returns no correction-induced defects.
- The round-3 tentative items: behaviour at the Node 22.16.0 floor is executed
  only by CI's matrix entry; whether `unshare -rn` works on the GitHub Actions
  runner image the plan uses is unverified (the plan must name the image or
  handle the refusal).
- L11(a) — human-marker presence is measured on interactive transcripts; the
  plan reports it *verified* only when an owner-local interactive transcript is
  in the exit corpus, otherwise *not observed*.
- L11(b) — whether `UserPromptSubmit` fires for platform-injected turns is
  undocumented; the plan resolves it by live induction inside the exit run's
  closed-loop leg. Design-safe either way per `AD-9`'s voiding guard.
