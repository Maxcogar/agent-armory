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

## Where the project stands (2026-09-04)

The spec (`docs/specs/spec-context-oracle.md`) is signed off (`OL-C6`,
2026-08-28). The Phase A architecture (`docs/architecture-phase-a.md`) passed its
round-10 **expert** review clean (0 findings); the paired round-10
**collapse-hunt was never run** — the prior session was halted mid-round-10. Max
directed (2026-09-04) proceeding toward the Phase A plan without re-running that
hunt.

**In grounding the plan, the answer-drift block `AD-9` was found to be AI slop
and sent back to the architecture layer.** Across the ten review rounds the Phase
A answer-drift classifier was elaborated — communicative-verb and
information-object lexicons, base-noun-phrase head extraction, wh-complement
precedence, coordinated-ask handling — into a coverage-maximizing classifier that
*looks like* a working answer-drift block. The spec (`D-41`, §11.5) asks Phase A
only for a recognizer that "errs hard toward not-firing," "low-coverage,"
explicitly "a skeleton, not 'the block working.'" The architecture over-reached
its own spec. Max caught it — the reviews did not, because they check
correctness, not whether a mechanism serves the Phase A goal — and named it the
same fake-completeness pattern that cost three prior versions of this tool. The
lesson is now `CLAUDE.md` dominating rule 3 and `docs/collapse-log.md`
2026-09-04.

**The Phase A plan is on hold until `AD-9` is honest.** A plan translates the
architecture faithfully; it cannot fix a wrong architecture by building something
different (that freelancing is exactly what the lifecycle exists to stop). So
`AD-9` is corrected at the architecture layer first, then the plan resumes from
the corrected architecture.

**Update (2026-09-04):** the Phase A test-bed purpose, found missing from the
governing docs this session, is now stated in spec §11.5 (one-line pointer in
`CLAUDE.md` rule 3). The `AD-9` rebuild is judged against it and is the immediate
next step.

## What to do next (agent-owned)

1. **Rebuild `AD-9` at the architecture layer to serve the Phase A goal.** Keep
   what is real and already right: the deny plumbing confined to one producer
   (`AD-10`), the `questions`/`classify_state` state tables, and the clean
   Phase-B seam (`qa/state.ts`) the model plugs into with no redesign. Replace the
   coverage-maximizing classifier with the honest minimum the spec's `D-41`
   skeleton asks for — a recognizer that fires only on a move *clearly* not
   answer-directed, errs hard toward not-firing, and whose low coverage is
   *measured at exit*, not hidden behind machinery. Whether that minimum is a
   single unambiguous trigger or no automatic recognizer at all (the plumbing
   tested with fixture-controlled state, all answer-directedness judgment deferred
   to Phase B) is the architecture decision to make here — grounded in
   `D-41`/§11.5, not freelanced.
2. **Re-review the rebuilt `AD-9`** — a fresh expert review + collapse-hunt, aimed
   goal-first per rule 3 ("does this serve the Phase A goal, or is it machinery
   that only passes review?"), all findings applied, before it is trusted.
3. **Then write the Phase A implementation plan** (greenfield expert-plan,
   consuming spec + the corrected architecture), and build against §11.5's Phase A
   exit and the §14 Phase A acceptance criteria.

## Open items

- The round-10 collapse-hunt on the pre-rework architecture was never run; it is
  now moot — `AD-9` is being reworked and its rework carries its own review, and
  the rest of the architecture stands on the round-10 expert-review PASS.
- The two **build-time verifications** the architecture names (`L11`): human-turn
  marker presence on Max's real interactive transcripts, and whether
  platform-injected turns fire `UserPromptSubmit`. Neither gates the design; both
  resolve with real captured sessions during the build.
- No owner question is open. The answer-drift *design principle* is settled
  (honest skeleton + clean seam, never fake completeness); the specific rebuilt
  `AD-9` is agent-owned architecture work, reviewed before it is trusted.
