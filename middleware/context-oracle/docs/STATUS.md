# Context Oracle — status

*Plain-language project status, rewritten each session (not appended). It states
the current state and what to do next; evidence lives in `docs/reviews/`, durable
lessons in `docs/collapse-log.md`, ideas in `docs/IDEAS.md`, and everything
attributed to Max Cogar in `OWNER-LEDGER.md`.*

## Where the project stands (2026-08-29)

The build state is unchanged from the last working session. The spec
(`docs/specs/spec-context-oracle.md`) is signed off (`OL-C6`, 2026-08-28). The
**Phase A architecture** (`docs/architecture-phase-a.md`) is a **five-times
independently reviewed draft — NOT an approved artifact**. Each round was a
fresh expert review (premise/standards axis) plus a fresh collapse-hunt
(mission-fidelity axis), dispatched blind to each other, never the author; every
finding from every round was applied in full; all evidence is under
`docs/reviews/` (the 2026-08-29 files). Collapse trajectory: 5 → 6 → 1 → 1 → 0.
Round 5 was the series' first zero-collapse round, but its fixes are themselves
unattacked, so **convergence (a round that finds nothing real) is NOT formally
reached.** Max Cogar ended the review loop there for that session. **No plan, no
build, until a round finds nothing real.**

**This session (2026-08-29) was not build work — it was a testing-methodology
discussion with Max Cogar, and it changed only `docs/IDEAS.md`,
`docs/collapse-log.md`, and this file.** No spec, architecture, or `CLAUDE.md`
change. It produced two durable additions and surfaced one owner decision:

- **`docs/IDEAS.md` #14 — Discovery-mode real-transcript replay** (unvalidated).
  A full write-up of replaying Max Cogar's *real, unmodified* past Claude Code
  transcripts through the oracle to test/train it — distinguished from AD-24's
  *synthetic planted-history fixtures* (which stay). It records what such replay
  **can** measure (recognizer boundaries against real phrasings — the part this
  design keeps collapsing on; silence/latency-tail; rare transcript modes and
  the two build-time verifications; pipeline robustness; regret ground-truth),
  what it **structurally cannot** (hit rate, whisper efficacy, calibration,
  block value — the off-policy/counterfactual limit that *no volume fixes*), the
  volume position, and a sanitization correction (shape-preserving secret
  substitution only, not broad redaction). It also refines/annotates the older
  #6, which had conflated the two harnesses.
- **`docs/collapse-log.md` 2026-08-29 — "narrowing the discovery-test corpus."**
  A **reduction** collapse the agent committed this session (proposing to index
  the discovery corpus by *known* problem types) and Max Cogar caught. The
  durable guardrail for whoever builds the test/replay harness: discovery
  testing is taxonomy-*blind* (its job is to produce the taxonomy, so narrowing
  it to known problems defeats the oracle's own unknown-unknowns purpose —
  RETHINK §3); regression testing is taxonomy-*bound* (AD-24). Opposite phases,
  never conflated.

## What to do next (agent-owned)

The build's next step is unchanged:

1. **Dispatch review round 6** — a fresh independent expert review + collapse
   hunt, blind to each other, attacking the round-5 fixes, with both
   collapse-log 2026-08-29 review-lessons in the charter (reviewer-prescribed
   repair text is attacked exactly as author text; an enumeration offered as a
   terminating repair is verified for completeness first). Apply all findings.
   Repeat until a round finds nothing real — that is convergence.
2. **On convergence:** rewrite this file, mark the architecture approved in its
   Status section, then write the **Phase A implementation plan** (consuming
   spec + architecture), then build against the Phase A exit and acceptance
   criteria.

The discovery-testing work in `IDEAS.md` #14 is **not** a build next-step and
does not gate round 6; it is captured for when the oracle exists and is being
tested, plus the assembly of the transcript corpus (which the two build-time
verifications will need regardless).

## Open items

- **Owner decision now pending (genuinely Max Cogar's).** `IDEAS.md` #14 is the
  "cheap idea" tier and the collapse-log entry is a guardrail — but neither is a
  *binding* requirement, so a future session could still narrow the testing.
  Making the discovery-breadth rule un-narrowable means promoting it to a **spec
  §14 acceptance requirement** with Max Cogar's explicit sign-off (per the
  ledger process; a conversation is not sign-off). **The plain-language
  question for Max:** do you want the "discovery testing must stay wide and must
  not be filtered to problems we already know about" rule written into the spec
  as a hard requirement future agents cannot skip — or is the idea + guardrail
  enough for now? If yes, an agent will draft the requirement text for your
  approval.
- The two **build-time verifications** the architecture names: marker presence
  on Max Cogar's real interactive transcripts, and whether platform-injected
  turns fire `UserPromptSubmit`. Neither gates the design; both are resolved
  with real captured sessions during the build — and the `IDEAS.md` #14 corpus
  is where they get answered.
