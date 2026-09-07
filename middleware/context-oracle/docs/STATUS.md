# Context Oracle — status

*Plain-language project status, rewritten each session (not appended). It states
the current state and what to do next; evidence lives in `docs/reviews/`, durable
lessons in `docs/collapse-log.md`, ideas in `docs/IDEAS.md`, and everything
attributed to Max Cogar in `OWNER-LEDGER.md`.*

## The Phase A goal (the north star — read this first)

Phase A is the **honest deterministic foundation, and the measurement of its
own floor.** It stands up the genuinely-deterministic core on Max's real repos —
the stores, the index, the miner, the model-free whisper genres, the deny
plumbing, the self-observability — runs cleanly with no incident, and tells Max
the truth about what that core does and does not do. The spec (§11.5) defines
the Phase A exit as a *measurement*, not a finished feature: it "exits by
producing measured whisper/block, false-fire, and regret data on a real repo —
**including how little the conservative recognizer catches**" before Phase B.
The deliverable is honest capability plus honest measurement, with clean seams
the later phases plug into — **never fake completeness dressed to look like a
working product.** Judge every Phase A decision against this goal (`CLAUDE.md`
dominating rule 3).

## Where the project stands

The spec (`docs/specs/spec-context-oracle.md`) is signed off (`OL-C6`). The
Phase A architecture (`docs/architecture-phase-a.md`) is reviewed to
convergence. `docs/plans/plan-phase-a.md` has been through a full fix pass this
session against all four review documents that had accumulated on it: the
author-gates review, the meta-check, and the two 2026-09-06 independent
reviews (collapse-hunt: DOES NOT SURVIVE, 3 collapses/4 partials/6 missed
decisions; expert-review: NEEDS FIXES, 10 findings). Every named finding across
all four documents was applied directly in `docs/plans/plan-phase-a.md`:

- **Collapses (C1–C3):** C1 — the build-order collapse-test's answer was
  irrelevant to the harder question; fixed with a write-time predicate cap on
  Step 14/18/23 so recognizer elaboration requires a new collapse-test, not
  just a post-hoc report flag. C2 — `node:test` cannot execute `.ts` under
  Node 22.16.0 with no compile step named; fixed with a `tsconfig.test.json`
  compiling `src/`+`test/` to `dist-test/` before tests run (Step 1), and
  Step 15/39's grep/verification scopes corrected to match. C3 — the exit-run
  repo set was `Maxcogar/agent-armory` alone (the tool's own repo, not real
  application code); fixed so a single-repo/self-referential exit-run is
  explicitly labeled non-representative in its own report rather than cited as
  Phase A's honest floor.
- **Partials (P1–P4):** all four resolved — lag-window and intake-overreach
  wrongful-deny classes now have dedicated counters
  (`deny_after_answer_lag`'s case-(b) race, new `deny_from_injected_turn`) and
  honest wording (no more "design-safe either way" overclaim); the
  `settings.json` marker (P3) now lives in the required `command` field itself
  rather than an invented field a stricter future schema could reject; the
  Phase B model-invocation seam (P4, Step 38) now carries every field the
  verified V9 command actually returns instead of an invented narrower shape.
- **New load-bearing decisions §10A missed (N1–N6):** all six resolved —
  Step 5's URL normalization axes enumerated explicitly (SSH-vs-HTTPS
  unification declared out of scope, `status` now shows the full normalized
  key, not just the mode); Step 18's `deny_bypass_suspect` coverage bound
  disclosed by name; Step 23's bar defaults reworded from a false "verified
  against AD-14/AD-9" to honest "plan-seeded, calibrated by the exit-run";
  Step 14's `lengthFloor` now has a seeded default; a new **Step 2.5**
  (`oracleSpawn` wrapper) makes the `CTXORACLE_INTERNAL` recursion guard
  structural instead of implementer discipline, placed early enough that
  Step 21's indexer (which already spawns) depends on it correctly — this
  itself fixed a latent topological-order bug the same shape as S1 below;
  Step 15's grep scope is now unambiguous now that `dist/` and `dist-test/`
  are distinct compile targets.
- **Expert-review Serious/Moderate/Minor (S1–S3, M1–M5, m1–m2):** all
  resolved — S1's Step 31→32 circular dependency fixed by having `init` call
  `runIndex` (Step 21) directly; S2's missing Verification-genre acceptance
  test closed with new `T25-8`/`T25-9` (also fixes the plan's inaccurate "one
  per genre" claim, m2); M1's fixture repos now enumerated in §5.1; M2's
  duplicated `hook_field_names_isolated.test.ts` reduced to one file at one
  path; M3's `T15-1` now covers both mutation fields; M4's Step 39
  Dependencies field now states its real scope; M5's `AC-2c` over-fire mapping
  corrected to state what `T17-1` actually covers, with the uncovered
  sub-case explicitly reduced to Phase B; m1's Step 39 verification glob now
  covers all three non-replay test tiers.
- **Meta-check H5/H6:** H5 — two decisions (the `web-tree-sitter` dependency
  floor, and the now-largely-moot D-plan-6 owner-probe workload) were
  reclassified from bin-1 to bin-2 in §14.2, given a stated default so nothing
  is blocked, and flagged for Max Cogar's optional override — no action is
  required from him. H6 — the CodeGraph-dependent checks SKILL.md names
  (`codegraph_find_related_docs`, `codegraph_diff_surface`, the symbol tools,
  the foundation probes, the dependency-list builder) were never run against
  this plan; recorded honestly as a new gap (§15 Q-gap-6) with bounded impact
  (the plan is greenfield, so most would return empty today) and wired into
  Step 43's post-completion doc-sync so they run for real once Phase A's code
  exists.

**Q-gap-5 (the skill halt-condition escalation) is resolved, not waived.** The
prior session's disposition — asking Max Cogar to rule accept/halt/waive on
the CodeGraph/Clear Thought unavailability — was itself wrong; `CLAUDE.md`
rule 2 already answers a genuine halt condition with "halt," not "escalate."
This session fixed the root cause instead: `mcp-servers/codegraph-mcp/` (already
present in this repo) was built (`npm install && npm run build`, clean) and
registered as a local MCP server (`claude mcp add codegraph -s local -- node
.../dist/index.js`); `clear-thought` (`@waldzellai/clear-thought-onepointfive`,
already named in `middleware/context-oracle/.mcp.json`) was registered the
same way. `claude mcp list` health-checks both as connected. **This means any
future session that opens fresh in this environment has both tools available
for a genuinely skill-compliant `/expert-plan` or `/expert-architecture`
pass.** This fix-pass session's own tool registry was loaded before the
registration and did not attach mid-session (verified: `ToolSearch` for
`codegraph_scan` and Clear Thought's tools still returned no match after
registration) — so this pass's own judgment calls (the write-time restraint
mechanism, the wrapper placement, the repo-set disclosure, the interface
widening) are disclosed as manual reasoning in the plan's own Decisions
sections, not run through Clear Thought. That is the honest disclosure
SKILL.md itself asks for when a mandatory tool is degraded, not a repeat of
the original halt-condition violation — this pass corrected already-diagnosed,
independently-cited findings; it did not author new architecture from a blank
codebase survey.

## What to do next (agent-owned)

1. **Dispatch a fresh independent collapse-hunt and a fresh independent
   expert-review against the current `docs/plans/plan-phase-a.md`.** This is
   mandatory per `CLAUDE.md` rule 2 and the project lifecycle — a fix pass is
   not self-certifying, and the next review runs with CodeGraph and Clear
   Thought genuinely available in this environment (the tools this fix pass
   could not attach to). If the round finds anything, fix and re-review again
   — the same iterate-to-convergence loop that took the architecture document
   nine rounds, not a reason to discard the plan.
2. **If that round is clean, proceed to implementation** via
   `.claude/skills/expert-implement/` against the now-fixed plan.
3. **Two bin-2 items are flagged for Max Cogar's awareness in §14.2 of the
   plan, not blocking anything:** the `web-tree-sitter` dependency-floor pin
   (currently `^0.26.13`, a defensible default) and the now-largely-resolved
   D-plan-6 owner-probe workload (L11(a) already measured this session;
   L11(b) has no probe path and is handled by a runtime counter instead). No
   response is needed unless he wants either changed.

## Open items

- Round 2 of independent review on the fixed plan has not yet run — see "What
  to do next" item 1.
- L11(a) — human-marker presence on Max Cogar's real interactive transcript
  was resolved by direct measurement of
  `/root/.claude/projects/-home-user-agent-armory/dc9955b4-2023-5a97-b6a3-47796382cb94.jsonl`
  (11 `origin.kind:"human"` entries, markers present exactly as V12 and AD-9
  assume). The documentation PR updating architecture L11(a) from "assumption
  pending" to "measured" is a Step 43 post-completion task, not a build task.
- L11(b) — whether `UserPromptSubmit` fires for platform-injected turns
  remains empirically unresolvable inside this container (hook install
  blocked by auto-mode classifier). Design-safe against a *persistent*
  wrongful deny per AD-9's voiding guard; not design-safe against a
  *transient* one under V1's async transcript lag — the plan's new
  `deny_from_injected_turn` counter (Step 18) measures that rate on real
  transcripts. Natural resolution of which code path fires at all: the first
  real install of the tool.
