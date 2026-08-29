# Context Oracle — status

*Plain-language project status, rewritten each session (not appended). It states
the current state and what to do next; evidence lives in `docs/reviews/`, durable
lessons in `docs/collapse-log.md`, and everything attributed to Max Cogar in
`OWNER-LEDGER.md`.*

## Where the project stands (2026-08-29)

The spec (`docs/specs/spec-context-oracle.md`) is signed off (`OL-C6`,
2026-08-28). **This session wrote the Phase A architecture document**
(`docs/architecture-phase-a.md`) and took it through **three full rounds of the
mandatory independent adversarial review** — each round a fresh expert review
(premise/standards axis) plus a fresh collapse-hunt (mission-fidelity axis),
dispatched blind to each other, never the author. Every finding from every
round was applied in full and every review is recorded under `docs/reviews/`
(six files dated 2026-08-29). The trajectory converged sharply:

- **Round 1** (against the first draft): 5 collapses + 4 Serious among 24
  findings — the Reuse headline was uncomputable from its schema, the clear
  lean blinded an owner-recourse counter, an `init` fetch contradicted the
  no-network security claims, the watchdog claim was physically impossible as
  stated, and the export API didn't exist on the declared runtime floor.
- **Round 2** (against round 1's fixes): 6 collapses + 4 Serious — the defects
  moved *into* the repairs, exactly as the collapse-log predicts: the
  request-form exclusion blinded the recourse tracking for the dominant ask
  form; `PostToolUse` turns out to fire only on *successful* tool runs (so
  failure outcomes needed the `PostToolUseFailure` event, verified against
  current docs); the human-turn marker (`origin.kind`) is provably absent in
  some transcript modes; a dedup constraint rejected the spec's own "Max
  re-asks" recourse.
- **Round 3** (against round 2's fixes): 1 collapse + 0 Serious — polite
  communicative-verb questions ("could you *tell me* why X fails?") were
  misclassified as requests and lost enforcement; fixed with the
  communicative-verb split, plus consumer filters for failure outcomes, a
  ternary command classifier so Verification stays alive in real sessions,
  and a readable recourse counter (`ctxoracle log` renders the counted
  questions).
- **Round 4** (against round 3's fixes): 1 collapse + 1 Serious (the same
  defect, found independently by both passes) + 1 Moderate — and a durable
  discovery, now a collapse-log entry (2026-08-29): **both top findings had
  entered the document as verbatim sentences from round 3's own prescribed
  repairs** — a reviewer's repair text carries no verification of its own and
  must be attacked like author text. The fixes: the failure-outcome consumer
  filter split by what a failed action *is* per consumer (a failed test run
  IS a run — "not run" is never asserted over it); the request-frame default
  flipped to the safe tracked-only direction with an artifact-object noun
  lexicon; per-segment compound-command classification; and the sync/receptacle
  batch (watermark home, counter storage, three unswept sentences).
- **Round 5** (against round 4's fixes): **0 collapses** — the series' first
  zero-collapse round — with 1 Serious + 2 Moderate + 4 partials remaining,
  all sentence-to-mechanism scale, concentrated in the one unspecified piece
  of round-4 machinery (the artifact-object test). Fixed: the object
  mechanism made precise (direct-object head noun with wh-complement
  precedence); every lexicon's incompleteness now fails toward
  under-enforcement, never wrongful deny; the regret proxy's missing outcome
  semantics (a tenth `observed_actions` reader the round-4 enumeration had
  itself missed — the collapse-log entry now carries that corollary);
  per-project fold watermarks; comparability-gated Reuse dominance (silence
  over a mixed-language set instead of a false crown); quote-aware compound
  classification.

**Convergence has NOT been formally reached, and Max Cogar ended the review
loop here for this session.** The trajectory (5 → 6 → 1 → 1 → 0 collapses;
Serious 4 → 4 → 0 → 1 → 1) is clearly converging, but the terminal
definition (collapse-log 2026-08-25: a round that finds nothing real) is
unmet — the round-5 fixes are themselves unattacked. The architecture is a
**five-times-reviewed draft, not an approved artifact. No plan, no build,
until a round finds nothing real.**

## What this session verified before designing (all against current primary sources or by execution; the architecture's V-table, V1–V19, holds the evidence)

- **The hooks contract holds where the spec recorded it** — `transcript_path`
  still documented as asynchronously written / may lag (the FR-B1 lag clause
  has a live premise); deny channel, Stop `additionalContext`, timeouts,
  subagent fields all confirmed. Newly established and load-bearing: a
  timed-out `PreToolUse` hook *blocks the tool call* (so the handler always
  answers with silence before any timeout); `PostToolUse` fires **only on
  success**, and failures fire `PostToolUseFailure` (now wired,
  observation-only).
- **The spec's C-2 factual note was stale and was synced** (disclosed edit,
  requirement unchanged): stock Node ships `node:sqlite` with FTS5 **from
  v22.16.0** — the store needs zero dependencies; the architecture's runtime
  floor is 22.16.0. The spec's §13 subagent-context open item also resolved
  against current docs (it does not reach the parent; a documented
  parent-injection channel exists) and the spec carries the resolution note.
- **The piggyback works as shipped** (`claude -p … --tools "" --max-turns 1`,
  host auth, no credentials, ~4.4 s — model calls stay off the synchronous
  path; `--bare` still severs auth and stays banned).
- **A cold spawn-per-event handler costs 45–54 ms measured** — the
  architecture drops the historical warm-daemon design (its governing
  constraint no longer exists in the current spec).

Also this session: `tools/check_docs.py` now **gates the per-phase
architecture documents too** (requirement keys, ledger keys, §-references); it
caught a real citation defect on its first run and passes on the current tree.

## What the architecture covers (headline)

Phase A per spec §11.5: the seven deterministic whisper genres; the
answer-drift block's safe skeleton — prompt-field question intake with an
info/request classifier at every opener, marker-based transcript
discrimination, the cached question/answer state with the lag-window hold, the
deny confined structurally to one producer, and the named seam Phase B's
model-maintained state plugs into; stores/index/miner with provenance
mandatory in the schema; per-consumer delivery and dedup; self-observability
(deny-health signals, the labelled recourse counter, the labelled regret
proxy); security controls mapped to T1–T4 with the injection surface into the
deny path closed at every opener; the CLI (including `tune` and the
export/import migration offer); and a test/fixture architecture pinning each
Phase A acceptance criterion, plus two named build-time verifications for the
transcript-marker and `UserPromptSubmit`-provenance premises. The skill-block
machinery (FR-C1–FR-C4) is deferred to the Phase C architecture per the
per-phase lifecycle rule (the reconciliation with the previous STATUS's
listing is recorded in the architecture's Scope section).

## What to do next (agent-owned)

1. **Dispatch review round 6** — a fresh independent expert review + collapse
   hunt, blind to each other, attacking the round-5 fixes (the round-5 review
   files list them; the architecture's "Status of this architecture" section
   summarizes), with both collapse-log 2026-08-29 lessons in the charter:
   reviewer-prescribed repair text is attacked exactly as author text, and an
   enumeration offered as a terminating repair is verified for completeness
   first. Apply all findings. Repeat until a round finds nothing real — that
   is convergence, per the collapse-log's 2026-08-25 terminal-state
   definition.
2. **On convergence:** rewrite this file, mark the architecture approved in
   its Status section, and only then write the **Phase A implementation plan**
   (consuming spec + architecture), then build against §11.5's Phase A exit
   and the §14 Phase A criteria.

## Open items

- The two **build-time verifications** the architecture names (L11): marker
  presence on the owner's real interactive transcripts, and whether
  platform-injected turns fire `UserPromptSubmit`. Neither gates the design
  (the exposure is bounded either way); both are resolved with real captured
  sessions during the build.
- No owner question is open.
