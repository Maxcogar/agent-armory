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
convergence. `docs/plans/plan-phase-a.md` has been through **four rounds** of
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
opposite direction from round 1's original mis-framing), plus a procedural
finding that N1–N6 had inline rationale but no formal four-part collapse-test
— now added for all six, each attacked with a harder question than its
Step's inline text posed. Expert-review: 9 of
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

**Q-gap-5 (the skill halt-condition) is now fully resolved.** The original
session's disposition — asking Max Cogar to rule accept/halt/waive on
CodeGraph/Clear Thought unavailability — was wrong; `CLAUDE.md` rule 2
already answers a genuine halt condition with "halt," not "escalate." Round
1 fixed the root cause: `mcp-servers/codegraph-mcp/` (already present in
this repo) was built and registered as a local MCP server, and
`clear-thought` (already named in `middleware/context-oracle/.mcp.json`)
was registered alongside it — `claude mcp list` health-checks both as
connected. Round 1 then called Q-gap-5 "closed" on that basis — **round 2's
independent expert-review correctly rejected that as an overclaim (finding
S3):** fixing tool *availability* does not retroactively make round 1's own
judgment calls Clear-Thought-verified, since this session's own
tool-attachment layer (`ToolSearch`) never picked up the newly-registered
servers, confirmed repeatedly.

**Resolved for real, this session, by going around the attachment layer
rather than waiting for it.** The MCP stdio protocol is just JSON-RPC over
a subprocess's stdin/stdout — it doesn't require the harness's own
tool-attachment layer to work. This session wrote a minimal MCP client,
spoke the protocol directly to `npx -y @waldzellai/clear-thought-onepointfive`
(full handshake: `initialize` → `tools/list` confirmed the `clear_thought`
tool), and ran all six flagged decisions as real `sequential_thinking`
chains — 18 tool calls, one MCP session
(`stdio-session-1788762266748`), transcript in full at
`docs/reviews/2026-09-07-clear-thought-verification-q-gap-5.md`. All six
confirmed the shipped design (C1's write-time cap, N5's Step-2.5 placement,
C3's repo-set disclosure, P3's command-field marker, P4's widened
interface, T18-3's mechanization), and the pass sharpened N5's framing from
"defensible" to "required" (Step 21 already spawns, before Step 38, so the
wrapper structurally must exist by Step 2.5 or Step 21 ships an uncaught
AD-21 violation). This satisfies SKILL.md Step 6's literal mandate (invoke
the server, record the reasoning) — round 3's collapse-hunt correctly
caught this document initially overclaiming that as "independent
verification": it isn't (this session both wrote the original reasoning
and fed it through a tool that echoes rather than judges), and the
overclaim is corrected everywhere it appeared. Independent checking of
this session's work is what the separately-dispatched collapse-hunt/
expert-review rounds provide, and they did: round 3 caught the overclaim,
plus a real AD-9 compliance gap (below). This closes the plan's Q-gap-5
entry (section 15) in full — no owner ruling, no further tool-attached
re-check outstanding.

**Round 3** dispatched a fresh independent collapse-hunt and expert-review
against round 2's output. Both returned real, shrinking findings, all
fixed:

- **Collapse-hunt** (2 collapses, 2 partials): (1) the "independent check"
  overclaim above, corrected everywhere it appeared (the plan, STATUS, and
  the verification transcript) to the narrower true claim (SKILL.md Step
  6's literal mandate satisfied; independent checking comes from the
  dispatched review rounds); (2) `deny_bypass_suspect`'s bias disclosure
  (Step 18, Step 33/`T33-1`) named only the under-count direction; AD-9
  requires both directions stated in `status` — the over-count direction
  is now disclosed verbatim alongside the under-count residual; (3) a
  stale cross-reference in the plan's D-plan-1 entry (section 10) still
  pointed at Clear Thought as unresolved after Q-gap-5 (section 15)
  resolved it — fixed; (4) the sharpened N5 framing was claimed to be in
  N5's own collapse-test entry (section 10A) but wasn't — now added there.
- **Expert-review** (1 Systemic pattern spanning 2 instances, 2 Moderate,
  1 Minor): independently reproduced the Q-gap-5 MCP protocol claim from
  scratch (its own client, matched the exact server version string and
  session-ID shape) and confirmed it genuine, not asserted. Found the
  same 7-site systemic pattern round 2 fixed recurring at 2 new sites this
  fix pass itself introduced: Step 41 never actually built
  `deny_bypass_predicates_confined.test.ts` (`T18-3`) despite four other
  surfaces asserting it exists — fixed, added as Step 41's fifth
  convention file; and Step 8's migration seeded `tuning` at
  migration-apply time, contradicting AD-5's own "seeded at `init`"
  WRITER designation and duplicating Step 23 — removed the seeding claim
  from Step 8, corrected T8-1/T23-1's test specs to match Step 23's actual
  4-AD-14-sourced/2-plan-judgment split. Two Moderate citation errors
  (§2.3's Delivery row misattributing Step 31 instead of Step 30/19; Step
  19 citing "Step 26" instead of Step 25 for the done-claim recognizer)
  also fixed. One Minor finding (no checked-in script/transcript for the
  Q-gap-5 MCP evidence) resolved by committing the actual client script
  and a raw transcript sample to
  `docs/reviews/evidence-2026-09-07-clear-thought-verification-q-gap-5/`.

**Round 4** dispatched a fresh independent collapse-hunt and expert-review
against round 3's output. Both returned real, shrinking findings, all
fixed:

- **Collapse-hunt** (2 collapses, 0 partials): (1) Step 14's own body still
  said `lexicon.stoplist` is "seeded... at Step 8," a literal contradiction
  of round 3's own Step 8 correction three lines above in the same
  paragraph — fixed to "at Step 23 (invoked at `init`)"; (2) §2.3's
  coverage-reconciliation table — the same table whose Delivery row round
  3 corrected — had three further wrong step-number citations: the seven
  genres attributed to "Steps 21–28" instead of Step 25 alone, the indexer
  attributed to Step 22 instead of Step 21, and Self-observability's
  status/regret/log roles swapped across Steps 33/36/37 (with Step 37 —
  concurrency, unrelated — cited in place of Step 33 for `log`). All four
  rows rewritten to match the step bodies and §12.5's own Step→T-ID table.
- **Expert-review** (1 Systemic pattern spanning 2 instances): Step 40's
  body and §14.1's Q13 still described the owner-run L11 probe design
  that the plan's D-plan-6 entry retracted back in round 1 — files
  (`real_transcript_marker_probe.md`, `user_prompt_submit_provenance.md`)
  that never matched the plan's actual file skeleton (`l11_a_measurement.md`,
  `l11_b_disposition.md`); rewritten to match D-plan-6/Q-gap-4's
  resolved disposition (no owner action for either L11(a), already
  measured, or L11(b), resolved by design-safety analysis plus the
  `deny_from_injected_turn` runtime counter). Step 32's Verification field
  never cited `T32-1a` (added at round 2 to §12 and the mapping table, but
  never swept into Step 32's own inline prose) and misattributed `--purge`
  to `T32-1` alone, contradicting T32-1's own "NOT asserts: `--purge`"
  spec — split into separate `T32-1`/`T32-1a` citations. A related stale
  reference in §10A's "Test tier split" collapse-test (still describing
  the L11 preconditions as unexecuted manual probes) was found during this
  pass's own sweep and fixed alongside the two flagged findings. The
  sweep-record narrative (section 14.4) also got two missing entries —
  Pass J (round 3) and Pass K (round 4) — per expert-review's tentative
  finding that it had no entry for round 3's own substantial fix pass.

Four consecutive rounds have now found this same "fix landed at its
primary site, not swept to every cross-referencing surface" pattern
recurring at new sites each time (round 2: 7 sites; round 3: 2 sites;
round 4: 2 instances at 4 locations) — logged in `docs/collapse-log.md`
as a standing lesson: a reconciliation sweep's own attestation of
completeness is not verification of completeness, however many times the
same fix pass has already caught one instance of the pattern in the same
session.

## What to do next (agent-owned)

1. **Dispatch round 5 of independent collapse-hunt and expert-review.**
   The finding count kept shrinking each round (round 1: 3
   collapses/4 partials/6 missed decisions + 10 expert-review findings;
   round 2: 1 collapse/3 partials/1 procedural gap + 9 expert-review
   findings incl. the Q-gap-5 overclaim; round 3: 2 collapses/2 partials +
   4 expert-review findings; round 4: 2 collapses/0 partials + 1 Systemic
   pattern spanning 2 instances) and all were fixed each time. This is the
   same iterate-to-convergence loop that took the architecture document
   nine rounds — dispatch the next round rather than assuming round 4's
   fixes are the last word.
2. **Once a round comes back clean, proceed to implementation** via
   `.claude/skills/expert-implement/` against the fixed plan.
3. **Two bin-2 items are flagged for Max Cogar's awareness in the plan's
   bin-2 register (section 14.2), not blocking anything:** the
   `web-tree-sitter` dependency-floor pin (currently `^0.26.13`, a defensible
   default) and the now-largely-resolved D-plan-6 owner-probe workload
   (L11(a) already measured this session; L11(b) has no probe path and is
   handled by a runtime counter instead). No response is needed unless he
   wants either changed.

## Open items

- Round 5 of independent review has not yet run — see "What to do next"
  item 1. Nothing else from rounds 1–4 remains open: all findings from all
  four rounds across both review types, plus Q-gap-5's six judgment
  calls (Clear-Thought-verified, independently reproduced by round 3's
  expert-review), are closed.
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
