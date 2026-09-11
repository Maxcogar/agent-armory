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

**The Phase A implementation plan (`docs/plans/plan-phase-a.md`) is at its
2026-09-11 revision.** Its history: five review-and-correction rounds and a
hook-enforced 24-finding correction loop (closed 2026-09-08, commits
`01ddf2e`…`b58a05c`), then the 2026-09-11 session below, which found that the
plan had carried a **non-functional foundation** through all of that and fixed
it together with six further defects. Every mechanical gate this project has
is green on the current revision — `derive-plan-sections.mjs --check` (40
steps, 124 test specs, 26 probes cited, regions current), `run-plan-probes.mjs`
(all 26 probes, including the seven new ones), and `tools/check_docs.py` — and
the correction-loop queue is empty (round 5 recorded complete).

**What the 2026-09-11 session established (all executed, none assumed):**

1. **The runtime pin was non-functional.** The plan pinned `web-tree-sitter`
   0.26.13 with `tree-sitter-wasms` 0.1.13 as "the versions the architecture
   verified (V14)". V14 had verified registry metadata (publish date, no
   install scripts) — never a grammar load. Under 0.26.13, and under every
   0.26.x and 0.27.0, `Language.load` rejects all 36 shipped grammars
   (`probe:21_web_tree_sitter_026_loads_nothing.optional`). The plan now pins
   0.25.10, the last runtime whose loader accepts the grammars' legacy
   `dylink` section, and adds the dev pin `@types/emscripten` 1.41.6 with
   `"types": ["node", "emscripten"]`, without which no file importing the
   runtime compiles (`TS2304`; `probe:22_tsc_web_tree_sitter_import`). The
   corrected pin was attacked by an independent collapse-hunt **before** it
   was written into the plan (`docs/reviews/2026-09-11-dplan2-pin-collapse-hunt.md`,
   verdict "does not survive as written", every finding absorbed): the
   usable inventory is **32 of 36** grammars — `elm` and `ql` are below every
   runtime's minimum language ABI, `yaml` and `bash` throw on parse because
   their scanners import symbols the runtime never exports — so Step 15 now
   enumerates the default extension→grammar table (32 grammars, four
   excluded by executed cause, their extensions on the generic frontend),
   catches every throwable a parse raises and records `frontend_parse_failed`
   (`probe:20_grammar_inventory`; new `T-15-4`). The alternatives — the
   per-language grammar packages (native install scripts and prebuilds, so
   AD-25/C-3 fail at install) and vendoring their `dylink.0` grammar files
   (works under every runtime; recorded in the plan's section 16 as the named exit if
   `tree-sitter-wasms` stays unmaintained) — are dispositioned in the plan's section 4. The
   pin is plan-owned: the architecture decides packages, never versions.
2. **Six defects ported from the plan's parallel lineage.** The unmerged
   branch `claude/plan-correction-strategy-57ot28` (`Maxcogar/agent-armory`
   PR #83) carried twelve independent review rounds of a divergent copy of
   this plan; its findings had never been checked against this one. A
   port-check (`docs/reviews/2026-09-11-pr83-port-check.md`: 76 findings,
   9 present, 34 absent, 33 not applicable, executed where they rest on
   execution) found six defects present here, all now fixed: `npm ci` with
   no `package-lock.json` anywhere in the plan (fails every CI run,
   `probe:23_npm_ci_without_lockfile`; Step 1 now creates the npm-generated
   lockfile); the miner never handled `git log --numstat -M` rename lines
   (`probe:24_git_numstat_rename`; Step 13 expands both identities,
   `miner_unparsed_numstat` for the ambiguous case; `T-13-1` plants both
   shapes); Step 5's rule 1 keyed on `git rev-parse` printing `false` where
   git actually exits 128 with nothing (`probe:25_git_rev_parse_nongit`;
   one `{ok, …}` helper, failures route to rule 4 with a diagnostic); Step
   14's `.reindex.lock` with pid-liveness reclaim let two real processes
   both win in 29 of 200 races — replaced by a `schema_meta` claim row taken
   inside one `BEGIN IMMEDIATE` transaction, released in a `finally`,
   refused with `reindex_locked` (`probe:26_reindex_claim_row_race`: 200 of
   200 races, one winner; D-plan-32, risk R14, the plan's section-4 AD-26 entry, the race
   case in `T-14-1`); the `deny_bypass_suspect` disclosure printed only the
   under-count where AD-9 requires both directions (Steps 26/33/39,
   `T-33-1`); one wrong step citation in `T-38-31`.
3. **Three drifted probes fixed at the root.** Probes 13, 15 and 17 asserted
   incidental values (a since-reworded documentation sentence, a count of
   environment variables, which `@types/node` 22.x was newest); each now
   asserts the property its plan claim rests on.
4. **The correction loop re-armed on every fresh container.** Its
   completed-rounds record (`state/done.json`) was gitignored, so the
   2026-09-09 session's fresh container rebuilt and re-served the already
   closed round-5 queue from issue 1. `done.json` is now tracked, seeded
   with round 5 complete; `collapse-log.md` records the lesson.
5. **An owner rule that was never Max Cogar's.** The "five-round cap" /
   "convergence rule from the owner" cited since 2026-09-07 was invented by
   an agent; Max Cogar rejected it on 2026-09-11 (`OWNER-LEDGER.md`
   `OL-R6`), and the two citations now say so.

The 2026-09-09 session's contribution (probes 18 and 19, `T-7-1`'s executed
FTS-migration evidence, D-plan-26's executed leg-2 protocol) is in this
history.

## What to do next

**Dispatch round 6: an independent whole-document collapse-hunt and an
independent expert-review of the current plan, fresh subagents, with the
discipline that found everything above — execute every pin, install, load,
parse, command and race the plan rests on; a registry read, a documentation
sentence or a prior round's "verified" is not evidence.** This is derived, not
an owner question: `CLAUDE.md` rule 2 makes the independent collapse-hunt
mandatory for every load-bearing decision, and two of this revision's
decisions have not had one on their final text — D-plan-32 (the reindex
claim row: proposed by the port-check reviewer, written by the author,
executed by probe 26, never independently attacked) and D-plan-2 as
written (its proposal was attacked; the text that absorbed the hunter's
findings was not). The six ported corrections were also applied in the same
pass that derived them, which the 2026-09-07 collapse-log lesson says needs a
separate independent pass before the plan is the build contract. Name the
review files `docs/reviews/<date>-round-6-collapse-hunt.md` and
`…-round-6-expert-review.md` so the correction loop serves their findings
one at a time; the loop's `state/done.json` is tracked, so a closed round
stays closed across containers.

When round 6 closes, the plan is the build contract for `/expert-implement`
— Step 1 first, whose very first act (`npm ci` on the committed lockfile,
then a file importing `web-tree-sitter` compiling and loading a grammar)
re-executes the three probes that would have caught the pin.

## Open items

- Round 6 (above) — the only thing between the plan and the build.
- The round-3 tentative items carried forward, never re-verified: behaviour
  at the Node 22.16.0 floor is executed only by CI's matrix entry and by the
  pin collapse-hunt's `npx node@22.16.0` runs (grammar loads, the compiled
  layout); whether `unshare -rn` works on the GitHub Actions runner image
  (probe `09_unshare_no_network.optional` is optional for exactly this
  reason).
- L11(a) — human-marker presence is measured on interactive transcripts; the
  plan reports it *verified* only when an owner-local interactive transcript is
  in the exit corpus, otherwise *not observed*.
- L11(b) — whether `UserPromptSubmit` fires for platform-injected turns is
  undocumented; the plan resolves it by live induction inside the exit run's
  closed-loop leg. Design-safe either way per `AD-9`'s voiding guard.
- **Two real bugs in this repo's own Stop hooks (`hooks/stop-completeness-gate/`,
  `hooks/stop-instruction-adherence-gate/`), outside Context Oracle's scope,
  recorded here once per Max Cogar's explicit instruction so they get seen:**
  1. **Wrong JSON key from the judge.** `stop-instruction-adherence-gate`'s judge
     is instructed to reply `{"violating": bool, "reason": "..."}`; twice in one
     session it replied `{"complete": true, ...}` (the sibling hook's schema), so
     `parse_verdict()` (`hooks/stop-instruction-adherence-gate/stop_instruction_adherence_gate.py:351-363`)
     returned `None` and the hook failed closed on a clean verdict.
  2. **Session isolation / transcript pollution — the likely root cause of #1.**
     Both hooks spawn their judge with `os.environ.copy()` without stripping
     Claude Code's session-identity variables, so a judge call can attach to
     the live session and read cross-contaminated content; a Stop-hook
     `reason` re-injected as a synthetic user turn is then read as "the user's
     request" by the next firing — self-sustaining. The fix is
     `Maxcogar/agent-armory` PR #82 ("Fix session isolation and transcript
     pollution in both Stop-hook gates"). The 2026-09-09 session hit 75+
     consecutive rejections whose demands no human had made, consistent with
     that mechanism.
  This is not a standing practice — future unrelated findings do not belong
  in this file.
