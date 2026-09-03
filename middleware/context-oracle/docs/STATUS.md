# Context Oracle — status

*Plain-language project status, rewritten each session (not appended). It states
the current state and what to do next; evidence lives in `docs/reviews/`, durable
lessons in `docs/collapse-log.md`, and everything attributed to Max Cogar in
`OWNER-LEDGER.md`.*

## Where the project stands (2026-09-03)

The spec (`docs/specs/spec-context-oracle.md`) is signed off (`OL-C6`,
2026-08-28). The Phase A architecture document (`docs/architecture-phase-a.md`)
has been through **nine full rounds** of the mandatory independent adversarial
review — each round a fresh expert review (premise/standards axis) plus a fresh
collapse-hunt (mission-fidelity axis), dispatched blind to each other and never
to the author. Every finding from every round has been applied in full; all
eighteen review files live under `docs/reviews/` (rounds 1–5 dated 2026-08-29,
rounds 6–9 dated 2026-09-03).

**Round 9 (2026-09-03) — the tripwire fired, and round 9 was applied as a
foundational reframe, not a fourth patch.**

- Expert review — NEEDS FIXES: 0 Critical / 1 Serious / 1 Moderate / 1 Minor.
- Collapse-hunt — DOES NOT SURVIVE: 0 collapses / 1 partial / 3 notes (the fifth
  consecutive zero-collapse round).
- Finding count: 8 → 5 → 3 → 3 → **3**. The non-convergence tripwire's count
  condition (total findings not strictly decreasing for two consecutive rounds)
  **fired** for the first time.

For four straight rounds (6–9), the answer-drift classifier was found incomplete
a *new* way each round — a seeded object class, a missing no-object case, an
undefined compound/coordinated parse, and now a post-head-PP parse plus a
corpus row that contradicted its own rule. Round 8's "specify it completely,
once" attempt itself over-claimed and introduced round 9's Serious. Both round-9
passes prescribed the same thing, and it is what spec `D-41`/§11.5 actually asks
of Phase A — **a conservative, low-coverage skeleton whose coverage is measured
at exit, not a classifier asserting a totality a model-free recognizer cannot
meet.** So round 9 demoted the over-claims rather than patching again:

- **Clause (iv) is a conservative best-effort classification**, not a total
  rule. Its mis-parses are *safe by construction* — a mis-parse lands on the
  under-enforced `request` side or in the owned residual. The object-head
  heuristic is refined (rightmost noun of the *base* noun phrase; post-head
  PP/relative modifiers set aside; inflection folded) and framed as a heuristic,
  not an exact parse.
- **The wrongful-deny residual is now one open class defined by a property** (an
  `info`-classified row coexisting in the turn with a mutation that legitimately
  serves intent), frame-independent, its forms illustrations rather than members
  to complete. A new phrasing or a head mis-route is *the same class*, which ends
  the P1-lineage "N member shapes" recurrence (it grew every round 5→8) at its
  root.
- **The AC-24 corpus is derived from the rules** (illustrative), so a row can
  never contradict the rule again — the exact defect (R9-S1) that the round-8
  "complete spec" attempt had introduced.

**Convergence has NOT been reached, and this is not the terminal round.** The
architecture is a **nine-times-reviewed draft, not an approved artifact. No
plan, no build, until a round finds nothing real.** The reframe is itself
unattacked.

## What to do next (agent-owned)

1. **Dispatch review round 10** — the test of whether the reframe converges. A
   fresh independent expert review + collapse hunt, blind to each other,
   attacking the round-9 reframe, carrying its inheritance: (a) verify the
   "mis-parse is safe by construction" claim actually holds — is there any
   head-heuristic mis-parse that lands on the *deny-capable* side AND outside the
   owned residual (i.e. a genuinely unsafe error)? (b) verify the one-class
   residual truly has no escape (an `info`-classified mutation-fulfilled ask the
   property misses); (c) confirm the demoted-totality framing did not silently
   drop a real requirement the spec does make. Apply all findings.
2. **If round 10 also finds a real Serious/partial in the classifier and the
   count does not fall:** that would mean the reframe did not converge either,
   and the classifier's *approach* (model-free recognition of answer-drift in
   Phase A) may be more than a Phase A skeleton can bear. That is the point to
   bring Max a scoped question — whether to narrow Phase A's answer-drift
   coverage further (a spec-§13/§14 scope call, his to make) rather than keep
   iterating the architecture. Until then the loop continues.
3. **On convergence:** rewrite this file, mark the architecture approved in its
   "Status of this architecture" section, then write the Phase A implementation
   plan (consuming spec + architecture), then build against §11.5's Phase A exit
   and the §14 Phase A criteria.

## Open items

- The two **build-time verifications** the architecture names (L11): marker
  presence on the owner's real interactive transcripts, and whether
  platform-injected turns fire `UserPromptSubmit`. Neither gates the design; both
  are resolved with real captured sessions during the build.
- No owner question is open **yet** — but see "What to do next" item 2: if round
  10 does not converge, a Phase A answer-drift *scope* question is Max's to
  decide.
