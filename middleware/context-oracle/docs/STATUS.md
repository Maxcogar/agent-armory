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

**The Phase A implementation plan attempt (`docs/plans/plan-phase-a.md`) failed
its independent reviews and is not fit to build against.** PR #78 on branch
`claude/context-oracle-1evnd9`, head `d915856`. Two reviews landed against the
current plan:

- **`docs/reviews/2026-09-06-plan-collapse-hunt.md` — Verdict: DOES NOT
  SURVIVE.** 3 full collapses, 4 partials, 6 new load-bearing decisions the
  author's collapse-test (§10A) missed. Key collapses: D-plan-1 build-order
  framing IS the 2026-09-04 goal-loss shape at the build layer; D-plan-3
  `node:test` won't actually execute against `.ts` under Node 22.16 (tests
  never run, T15-2 confinement grep passes vacuously); Step 42 exit run on
  `Maxcogar/agent-armory` is not "the owner's real repos" §11.5 names.
- **`docs/reviews/2026-09-06-plan-expert-review.md` — Verdict: NEEDS FIXES
  (10 findings: 3 Serious, 5 Moderate, 2 Minor).** S1 Step 31 references
  Step 32 in Dependencies (topological-sort violation); S2 FR-A2g
  Verification genre has no acceptance-tier test; S3 plan not deliverable
  per SKILL.md while an open register entry remains; M1 ~15 named fixture
  repos unenumerated in §5.1; more.

Additional context on how the plan got here:

- **`docs/reviews/2026-09-06-author-gates-review.md`** — the plan-writer's
  own compliance walk. Found 20 findings on their own artifact (5 Critical,
  7 Serious, 4 Moderate, 4 Minor).
- **`docs/reviews/2026-09-06-meta-check-skipped-steps.md`** — meta-check
  subagent. Found H1–H8 including the finding that the plan-writer
  proceeded despite two SKILL.md halt conditions (CodeGraph and Clear
  Thought MCP servers unavailable, plan-writer manual-substituted instead
  of halting).

The author's compliance findings and the meta-check findings were partially
applied across commits `bbcd55f`, `6cb00ce`, `107673c`, `e60293b`, `99be60a`,
`7290549`, `5f94682`. The two later independent reviews (collapse-hunt +
expert-review) landed on the post-fix plan and still returned failing
verdicts.

**The plan-writer also opened Q-gap-5 in the plan's Gaps section — a bin-2
owner-decision escalation asking Max Cogar to rule accept / halt / waive on
the SKILL.md halt-condition violation. This was the wrong disposition.**
CLAUDE.md rule 2 says: *"if tooling genuinely prevents it, halt and say so
rather than shipping an unattacked decision."* The project's answer to
the halt condition is: halt. Not: escalate to the owner. Opening a bin-2
question the project's own rule already answers is exactly the "don't hand
the owner a decision that is already written" failure `CLAUDE.md` calls out.

## What to do next (agent-owned)

1. **Fix the current plan in place; a rewrite is not what either review
   calls for.** Neither review says the plan's *shape* is unsalvageable:
   collapse-hunt names exactly 3 full collapses (C1 build-order framing,
   C2 `node:test` won't execute `.ts` under Node 22.16, C3 Step 42's
   exit-run repo set is one-and-that-one — `Maxcogar/agent-armory`), 4
   partials (P1–P4), and 6 new load-bearing decisions its own §10A missed
   (N1–N6) — while explicitly recording 3 decisions that survive as-is
   (S1–S3). Expert-review's verdict is literally "NEEDS FIXES" (10
   findings: 3 Serious, 5 Moderate, 2 Minor), the project's own term for a
   fixable artifact, not a rebuild-from-zero one. This project has direct
   precedent for exactly this situation: `docs/architecture-phase-a.md`
   returned this same collapse-hunt verdict, "DOES NOT SURVIVE," across at
   least four rounds (`docs/reviews/2026-08-29-collapse-hunt-architecture-phase-a.md`,
   `2026-08-29-round-2-...md`, `2026-09-03-round-6-...md`,
   `2026-09-03-round-9-...md`) and converged to acceptance every time by
   fixing the round's named collapses in the existing document and
   re-reviewing — never by discarding it and starting over. Apply that
   same discipline here: fix C1–C3, P1–P4, and N1–N6 in
   `docs/plans/plan-phase-a.md` and the 10 expert-review findings, on top
   of the current architecture, in the current plan document.

2. **Every finding across all four review documents applies to the fix
   pass** — the author-gates review, the meta-check, the collapse-hunt,
   and the expert-review. Not a prioritized subset. Not a "start with
   C1–C3." All of them.

3. **Halt on the SKILL.md halt condition, per CLAUDE.md rule 2.** CodeGraph
   MCP and Clear Thought MCP are unavailable in this environment
   (empirically verified this session: `ToolSearch` for `codegraph` and
   `clear_thought` both returned no matches). SKILL.md says a required
   tool that cannot run is a halt condition, not a license to improvise.
   The next attempt at the plan either (a) runs in an environment where
   those tools ARE available, or (b) does not produce a
   `/expert-plan`-labeled fix — a different, non-`/expert-plan` process
   would need explicit owner authorization first.

4. **Run the independent collapse-hunt and expert-review after the fix
   pass lands**, before delivering. Both are mandatory per CLAUDE.md
   rule 2 and per the project lifecycle. Do not open owner-decision gaps
   for anything the project's own rules already answer. If that round
   still returns findings, fix and re-review again — the same iterate-to-
   convergence loop the architecture document went through, not a reason
   to discard the plan.

## Open items

- The Phase A plan is not deliverable as written. Fix per items 1–4
  above, in place — not a restart or rewrite from zero.
- L11(a) — human-marker presence on Max Cogar's real interactive
  transcript was resolved this session by direct measurement of
  `/root/.claude/projects/-home-user-agent-armory/dc9955b4-2023-5a97-b6a3-47796382cb94.jsonl`
  (11 `origin.kind:"human"` entries, markers present exactly as V12 and
  AD-9 assume). Follow-up documentation PR updating architecture L11(a)
  from "assumption pending" to "measured" is a post-Phase-A-completion
  task.
- L11(b) — whether `UserPromptSubmit` fires for platform-injected turns
  remains empirically unresolvable inside this container (hook install
  blocked by auto-mode classifier). Design-safe either way per AD-9's
  voiding guard. Natural resolution: first real install of the tool.
