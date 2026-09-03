# Context Oracle — status

*Plain-language project status, rewritten each session (not appended). It states
the current state and what to do next; evidence lives in `docs/reviews/`, durable
lessons in `docs/collapse-log.md`, and everything attributed to Max Cogar in
`OWNER-LEDGER.md`.*

## Where the project stands (2026-09-03)

The spec (`docs/specs/spec-context-oracle.md`) is signed off (`OL-C6`,
2026-08-28). The Phase A architecture document (`docs/architecture-phase-a.md`)
has now been through **six full rounds** of the mandatory independent adversarial
review — each round a fresh expert review (premise/standards axis) plus a fresh
collapse-hunt (mission-fidelity axis), dispatched blind to each other and never
to the author. Every finding from every round has been applied in full; all
twelve review files live under `docs/reviews/` (rounds 1–5 dated 2026-08-29,
round 6 dated 2026-09-03).

**Round 6 (2026-09-03):**

- Expert review — NEEDS FIXES: 0 Critical / 1 Serious / 1 Moderate / 3 Minor.
- Collapse-hunt — DOES NOT SURVIVE: 0 collapses / 4 partial / 5 notes (the second
  consecutive zero-collapse round).
- Collapse-class trajectory: 5 → 6 → 1 → 1 → 0 → 0. Serious-class:
  4 → 4 → 0 → 1 → 1 → 1.

The one Serious was a real regression the round-5 fixes introduced: the round-5
"unlisted object → request" default had silently reclassified the escalation
re-ask "can you please answer my question?" as a tracked-only request, disarming
the `OL-C3` recourse. It is fixed by seeding "question"/"answer" into the
information-object lexicon so the meta-answer ask stays deny-capable. The four
partials all lived inside round-5 repair text: the wrongful-deny residual was
still described as one member shape while a rhetorical lead-in ("why is CI always
so flaky?? …anyway please fix X") is a second; the tenth-reader semantics and the
`deny_bypass_suspect` bucketing sat one decision away from AD-4's canonical
consumer enumeration; the per-project watermark was synced to one comment and not
its operative sibling; and a same-name fixture asserted a prevention the
identifier-match heuristic does not perform. All are applied.

**Convergence has NOT been reached, and this is not the terminal round.** The
terminal definition (a round that finds nothing real) is unmet — round 6 found a
real Serious and four partials — and the round-6 fixes are themselves unattacked.
The architecture is a **six-times-reviewed draft, not an approved artifact. No
plan, no build, until a round finds nothing real.**

## What round 6 established before applying

- The Claude Code hooks contract behind the classifier lag and the regret-floor
  label still holds where the spec recorded it (re-fetched from the current hooks
  reference this session): transcript async-lag, `last_assistant_message` on
  Stop, and `PostToolUseFailure` firing only after a tool executes and fails.
- The round-5 fixes introduced no new external premise; the round-6 fixes are
  internal design and consistency corrections.
- `tools/check_docs.py` passes on the current tree.

## What the architecture covers (headline)

Phase A per spec §11.5: the seven deterministic whisper genres; the answer-drift
block's safe skeleton — prompt-field question intake with an info/request
classifier at every opener, marker-based transcript discrimination, the cached
question/answer state with the lag-window hold, the deny confined structurally to
one producer, and the named seam Phase B's model-maintained state plugs into;
stores/index/miner with provenance mandatory in the schema; per-consumer delivery
and dedup; self-observability (deny-health signals, the labelled recourse
counter, the labelled regret proxy); security controls mapped to T1–T4 with the
injection surface into the deny path closed at every opener; the CLI (including
`tune` — now the writer for both numbers and list-valued lexicon keys — and the
export/import migration offer); and a test/fixture architecture pinning each
Phase A acceptance criterion, plus two named build-time verifications for the
transcript-marker and `UserPromptSubmit`-provenance premises. The skill-block
machinery (FR-C1–FR-C4) is deferred to the Phase C architecture per the per-phase
lifecycle rule.

## What to do next (agent-owned)

1. **Dispatch review round 7** — a fresh independent expert review + collapse
   hunt, blind to each other, attacking the round-6 fixes, carrying the standing
   charter questions: reviewer-prescribed repair text is attacked exactly as
   author text; any enumeration offered as a terminating repair is verified for
   completeness; every repair-added fixture must name the mechanism that produces
   its asserted behavior; and — the round-6 recurrence — a fix that names a
   location ("add to the filter", "sync the comment", "per-project") must be
   verified to have landed at that exact location, not one decision away. Apply
   all findings. Repeat until a round finds nothing real — that is convergence,
   per the collapse-log's 2026-08-25 terminal-state definition.
2. **On convergence:** rewrite this file, mark the architecture approved in its
   "Status of this architecture" section, then write the Phase A implementation
   plan (consuming spec + architecture), then build against §11.5's Phase A exit
   and the §14 Phase A criteria.

## Open items

- The two **build-time verifications** the architecture names (L11): marker
  presence on the owner's real interactive transcripts, and whether
  platform-injected turns fire `UserPromptSubmit`. Neither gates the design; both
  are resolved with real captured sessions during the build.
- No owner question is open.
