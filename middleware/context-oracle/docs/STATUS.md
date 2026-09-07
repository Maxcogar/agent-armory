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
convergence. `docs/plans/plan-phase-a.md` has been through **two rounds** of
fix-and-re-review this session:

**Round 1** fixed every finding across the four review documents that had
accumulated by 2026-09-06: the author-gates review, the meta-check, and the
two 2026-09-06 independent reviews (collapse-hunt: DOES NOT SURVIVE, 3
collapses/4 partials/6 missed decisions; expert-review: NEEDS FIXES, 10
findings).

**Round 2** dispatched a fresh independent collapse-hunt
(`docs/reviews/2026-09-07-round-2-plan-collapse-hunt.md`) and a fresh
independent expert-review (`docs/reviews/2026-09-07-round-2-plan-expert-review.md`)
against round 1's output — both came back with real findings, both were
fixed directly in the plan. Collapse-hunt: 1 collapse (a cited test ID,
`T41-1d`, was never actually specified), 3 partials (a "design-safe either
way" overclaim survived at three secondary locations after its primary fix;
the plan's risk register (section 13) entries R1/R7 weren't synced to their Step fixes; four of Step
23's six "unsourced" defaults are actually AD-14-sourced, an overclaim in the
opposite direction from round 1's original mis-framing). Expert-review: 9 of
10 round-1 findings verified genuinely closed; one (S3/Q-gap-5) correctly
rejected as an overclaim — see below; a Systemic pattern (fix content not
swept to every cross-reference — a stale `D-plan-6`/`D-plan-8` collapse-test,
a stale `src/cli.ts` reference, a missing `src/proc/` skeleton entry) found
at 7 sites and fixed; 4 test IDs cited with no test specification (plan
section 12), now added
(`T2.5-1`, `T18-2`, `T21-2`, `T32-1a`).

All findings from both rounds, across all six review documents total, were
applied directly in `docs/plans/plan-phase-a.md`:

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
- **New load-bearing decisions the plan's collapse-test section (10A) missed (N1–N6):** all six resolved —
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
  per genre" claim, m2); M1's fixture repos now enumerated in the plan's file
  skeleton (section 5.1); M2's
  duplicated `hook_field_names_isolated.test.ts` reduced to one file at one
  path; M3's `T15-1` now covers both mutation fields; M4's Step 39
  Dependencies field now states its real scope; M5's `AC-2c` over-fire mapping
  corrected to state what `T17-1` actually covers, with the uncovered
  sub-case explicitly reduced to Phase B; m1's Step 39 verification glob now
  covers all three non-replay test tiers.
- **Meta-check H5/H6:** H5 — two decisions (the `web-tree-sitter` dependency
  floor, and the now-largely-moot D-plan-6 owner-probe workload) were
  reclassified from bin-1 to bin-2 in the plan's bin-2 register (section
  14.2), given a stated default so nothing is blocked, and flagged for Max
  Cogar's optional override — no action is required from him. H6 — the
  CodeGraph-dependent checks SKILL.md names (`codegraph_find_related_docs`,
  `codegraph_diff_surface`, the symbol tools, the foundation probes, the
  dependency-list builder) were never run against this plan; recorded
  honestly as a new gap (the plan's Q-gap-6) with bounded impact
  (the plan is greenfield, so most would return empty today) and wired into
  Step 43's post-completion doc-sync so they run for real once Phase A's code
  exists.

**Q-gap-5 (the skill halt-condition) is partially resolved — not closed, and
not waived.** The original session's disposition — asking Max Cogar to rule
accept/halt/waive on CodeGraph/Clear Thought unavailability — was wrong;
`CLAUDE.md` rule 2 already answers a genuine halt condition with "halt," not
"escalate." Round 1 fixed the root cause: `mcp-servers/codegraph-mcp/`
(already present in this repo) was built and registered as a local MCP
server, and `clear-thought` (already named in
`middleware/context-oracle/.mcp.json`) was registered alongside it —
`claude mcp list` health-checks both as connected. **Any future session that
opens fresh in this environment has both tools available.** Round 1 then
called Q-gap-5 "closed" on that basis — **round 2's independent expert-review
correctly rejected that as an overclaim (finding S3):** fixing tool
*availability* does not retroactively make round 1's own judgment calls
Clear-Thought-verified, since this fix-pass session's tool registry never
attached to the newly-registered servers (re-verified at round 2: still no
match). The plan's own Q-gap-5 entry (section 15) now names the six specific judgment calls
made by manual reasoning instead of Clear Thought (the write-time restraint
mechanism, the `oracleSpawn` placement, the repo-set disclosure, the
`command`-field marker redesign, the seam-interface widening, `T18-3`'s
mechanization) and tracks them as an open bin-3 gap — not an owner question,
a task for the next tool-attached session to re-verify each one through
Clear Thought before further plan changes. Every other fix in both rounds is
a direct correction against an already-fully-specified, independently-cited
finding, not a "choice among alternatives," and is not part of that list.

## What to do next (agent-owned)

1. **In a session where the registered `codegraph` and `clear-thought` MCP
   servers actually attach** (this fix-pass session's own registry never
   picked them up mid-conversation — a fresh session should), re-verify the
   six judgment calls named in the plan's Q-gap-5 entry (section 15) through Clear Thought:
   confirm each conclusion or revise it. This is the one open item from round
   2 that isn't already closed.
2. **Dispatch round 3 of independent collapse-hunt and expert-review** if
   item 1 changes anything; if it doesn't, round 2's clean-except-Q-gap-5
   result plus item 1's re-check is sufficient to call the plan converged.
   This is the same iterate-to-convergence loop that took the architecture
   document nine rounds — round 2 found real but shrinking findings (1
   collapse + 3 partials, down from round 1's 3 collapses + 4 partials + 6
   missed decisions), which is what convergence looks like in progress, not
   a reason to discard the plan.
3. **Once converged, proceed to implementation** via
   `.claude/skills/expert-implement/` against the fixed plan.
4. **Two bin-2 items are flagged for Max Cogar's awareness in the plan's
   bin-2 register (section 14.2), not blocking anything:** the
   `web-tree-sitter` dependency-floor pin (currently `^0.26.13`, a defensible
   default) and the now-largely-resolved D-plan-6 owner-probe workload
   (L11(a) already measured this session; L11(b) has no probe path and is
   handled by a runtime counter instead). No response is needed unless he
   wants either changed.

## Open items

- Q-gap-5's six flagged judgment calls await a Clear-Thought re-check in a
  tool-attached session — see "What to do next" item 1. Not an owner
  question; not blocking implementation planning, since each call is already
  disclosed with its reasoning in the plan.
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
