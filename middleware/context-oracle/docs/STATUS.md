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
exit as a *measurement*, not a finished feature. Judge every Phase A decision
against this goal (`CLAUDE.md` dominating rule 3).

## Where the project stands

The spec (`docs/specs/spec-context-oracle.md`) is signed off (`OL-C6`). The Phase
A architecture (`docs/architecture-phase-a.md`) is reviewed to convergence
(round 10, verdict PASS).

**The Phase A implementation plan has been rewritten from scratch and delivered
by its author** (`docs/plans/plan-phase-a.md`, ~3,900 lines, 16 output sections,
46 numbered steps, 90+ test specifications). This replaces the prior attempt in
full, per the standing rule that a failed plan is replaced, not patched — the
prior version's own reviews (`docs/reviews/2026-09-06-plan-collapse-hunt.md`,
DOES NOT SURVIVE; `docs/reviews/2026-09-06-plan-expert-review.md`, NEEDS FIXES;
plus the author-gates and meta-check reviews) drove the rewrite, and every
finding across all four documents is closed in the new plan, cited by ID
throughout its own text (collapse-hunt C1/C2/C3, N1–N6, P1–P4; expert-review
S1–S3, M1–M5, m1–m2).

**What is different this session, structurally, from the prior attempt:**

1. **CodeGraph and Clear Thought were actually invoked.** The prior session's
   halt-condition violation (meta-check findings H1.1/H1.2 — both mandated
   tools were never searched for, let alone called) does not recur: this
   session confirmed both tools loaded via `ToolSearch` before planning began,
   ran the full CodeGraph codebase survey (confirmed genuinely greenfield: one
   Python file, zero JS/TS code, zero broken/unused imports), and ran a real
   Clear Thought reasoning trace (6 recorded thoughts, session ID
   `stdio-session-1788729150838`) for the plan's most consequential decisions.
2. **The build order is reversed.** The answer-drift block (the fallible,
   deliberately minimal recognizer) is now built *last*, after the schema,
   stores, index, miner, and all seven whisper genres — closing collapse-hunt
   C1, which showed the prior plan's first-build placement recreated the exact
   review-treadmill failure recorded in `docs/collapse-log.md` 2026-09-04. A
   closed, enumerated recognizer condition list plus an immediate
   post-recognizer checkpoint (Step 32) are the paired discipline the
   reasoning trace concluded order alone does not provide.
3. **The test toolchain was verified live, not assumed.** This session fetched
   Node's current TypeScript-support documentation and independently
   reproduced the actual behavior in this container (Node v22.22.2): ordinary
   `.ts` test files already execute directly (type stripping is default-on on
   this runtime), but `enum` — the exact syntax this workspace hit and
   diagnosed earlier in this same session, before the mid-session
   summarization — is rejected outright regardless of flag state, confirmed by
   a live reproduction with the full error trace recorded. The plan's
   toolchain design (explicit `--experimental-strip-types` flag for
   version-independence, a hard convention against four rejected syntax
   forms, mechanically enforced) is built on that verified behavior, closing
   collapse-hunt C2 — and was itself corrected mid-session when the live
   reproduction showed the plan's own first draft (a heavier compile-both-
   trees design, reasoned from memory before the reproduction) was more than
   the verified behavior actually required.
4. **The exit-run measures real code, not just this tool's own repository.**
   `list_repos` returned 40 of Max Cogar's own repositories distinct from
   `Maxcogar/agent-armory` (NOVA, Project-Manager, CNC-Programmer-Copilot, and
   others) — a concrete, deterministic mechanism requiring no new owner
   decision, closing collapse-hunt C3 without an owner-facing config file.

**Gates walked by the author this session (`docs/plans/plan-phase-a.md`'s own
Plan and later sections).** A mechanical field-count and cross-reference walk (Gate C) found
and fixed real defects before delivery — not zero on the first pass: 44 of 46
steps were initially missing a distinct, grep-checkable `Source` field; one
step's Gate-3 numbering was mislabeled; five steps needed reclassification as
trivial; four cross-references pointed at a section number the plan never
used; one markdown table row was broken by an unescaped pipe character. All
were found and fixed within this session, and the sweep's own history —
including what it found, not just that it eventually found nothing — is
recorded in the plan's own Question register section, in direct response to the
prior attempt's own C2 finding (a fabricated, unwalked sweep attestation).
This is the author's own gate walk, not the independent collapse-hunt and
`/expert-review` `CLAUDE.md` dominating rule 2 mandates — those are dispatched
next, against this committed file.

## What to do next (agent-owned)

1. **Dispatch the independent collapse-hunt and independent `/expert-review`
   against the committed `docs/plans/plan-phase-a.md`** — fresh subagents,
   never the author, per `CLAUDE.md` dominating rule 2 and this project's
   standing process. Read the plan's own Decisions section and Question
   register first for the reasoning trail; attack the load-bearing
   decisions on mission-fidelity (the collapse-hunt's axis) and the document's
   own compliance with `expert-plan`'s output contract (the `/expert-review`
   axis) independently.
2. **Apply every finding from both fresh reviews**, not a prioritized subset,
   and re-review until a round finds nothing real — the standing discipline
   this workspace has needed enforced by process because it has repeatedly
   failed to hold by intention alone.
3. **Only once both reviews converge to zero real findings is the plan
   deliverable, and only then does Phase A implementation begin.**

## Open items

- The plan is delivered by its author but not yet independently reviewed —
  item 1 above is the very next step, owned by the agents.
- Every numeric threshold this plan seeds (the relevance bar's floors,
  `qa.clear_length_floor`) is explicitly labelled provisional, calibrated by
  the Phase A exit-run itself (plan's Gaps section, Gap 2) — this is by design, not an
  open question requiring resolution before the plan is deliverable.
- L11(a) and L11(b) (transcript human-marker presence; whether
  platform-injected turns fire `UserPromptSubmit`) remain as the architecture
  already states them — unchanged this session, not touched by the plan
  rewrite.

## Owner-facing

Nothing is waiting on Max Cogar. The plan rewrite, its author's gate walk, and
the dispatch of independent review are all agent-owned work per `OL-11`.
