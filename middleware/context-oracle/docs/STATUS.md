# Context Oracle — status

*Plain-language project status, rewritten each session (not appended). It states
the current state and what to do next; evidence lives in `docs/reviews/`, durable
lessons in `docs/collapse-log.md`, and everything attributed to Max Cogar in
`OWNER-LEDGER.md`.*

## Where the project stands (2026-09-03)

The spec (`docs/specs/spec-context-oracle.md`) is signed off (`OL-C6`,
2026-08-28). The Phase A architecture document (`docs/architecture-phase-a.md`)
has now been through **seven full rounds** of the mandatory independent
adversarial review — each round a fresh expert review (premise/standards axis)
plus a fresh collapse-hunt (mission-fidelity axis), dispatched blind to each
other and never to the author. Every finding from every round has been applied
in full; all fourteen review files live under `docs/reviews/` (rounds 1–5 dated
2026-08-29, rounds 6–7 dated 2026-09-03).

**Round 7 (2026-09-03):**

- Expert review — NEEDS FIXES: 0 Critical / 1 Serious / 1 Moderate / 1 Minor.
- Collapse-hunt — DOES NOT SURVIVE: 0 collapses / 1 partial / 7 notes (the third
  consecutive zero-collapse round).
- Findings-count trajectory: 8 → 5 → 3. Collapse-class: 5 → 6 → 1 → 1 → 0 → 0 → 0.
  All nine round-6 findings closed at their named sites; the non-convergence
  tripwire did not fire (two consecutive strict decreases).

Round 7's defects were all in the classifier/deny area the round-6 fixes
touched — the recurring regression zone:

- **Serious (R7-S1):** the round-6 object-head fix left a request-frame
  communicative verb with **no object** ("can you explain?", "can you answer?")
  matched by no rule in clause (iv), violating its "classifies every opened row"
  invariant and disarming `OL-C3` for that phrasing. Fixed: an object-less
  communicative verb now classifies `info`.
- **Partial (CH-P1):** the round-6 `question`/`answer` seed opened the opposite
  miss direction — an in-frame `info` question whose answer *is* a build ("can
  you answer the question in the ticket?") is deny-capable, wrongfully denying
  the fulfilling edit. Fixed: the residual re-opened to a **third member shape**,
  and the false soundness universal ("mutating the repo doesn't produce an
  answer") replaced by an honest over-enforcement disclosure mirroring L3.
- **Moderate (R7-M1):** the shape-(2) "shrunk by tending the stoplist" leaned on
  a `tune` surface that omitted the stoplist. Fixed: `tune` now edits
  `lexicon.stoplist`; AD-15's "every lexicon" universal corrected.
- **Minor (R7-m1) + notes:** `deny_bypass_suspect` over-flagged redirected test
  runs — now correlated with the denied target and disclosed both directions;
  plus `--missed-question` names the untended word and its `tune` command (N1),
  the CHANGE/READ dual-producer reading pinned (N2), the same-name cap-vs-floor
  relation (N4), and the fold's `BEGIN IMMEDIATE` atomicity (N7).

**Convergence has NOT been reached, and this is not the terminal round.** The
terminal definition (a round that finds nothing real) is unmet — round 7 found a
real Serious and a partial — and the round-7 fixes are themselves unattacked.
The architecture is a **seven-times-reviewed draft, not an approved artifact. No
plan, no build, until a round finds nothing real.** The blast radius keeps
narrowing (this round: one missing classifier case, one CLI surface omission,
one diagnostic predicate) and nothing has reached the deny confinement, the
owner constraints, or the phase boundary in three rounds.

## What round 7 established before applying

- The Claude Code hooks contract behind the classifier and the `deny_bypass`
  predicate still holds where the spec recorded it (re-fetched from the current
  hooks reference this session): PostToolUse fires after a tool succeeds,
  PostToolUseFailure after it fails, a PreToolUse deny blocks the call.
- The round-6 fixes introduced no new external premise; the round-7 fixes are
  internal design and consistency corrections.
- `tools/check_docs.py` passes on the current tree.

## What the architecture covers (headline)

Phase A per spec §11.5: the seven deterministic whisper genres; the answer-drift
block's safe skeleton — prompt-field question intake with an info/request
classifier at every opener (now total over its input domain, including the
object-less communicative verb), marker-based transcript discrimination, the
cached question/answer state with the lag-window hold, the deny confined
structurally to one producer, and the named seam Phase B's model-maintained
state plugs into; stores/index/miner with provenance mandatory in the schema;
per-consumer delivery and dedup; self-observability (deny-health signals, the
labelled recourse counter, the labelled regret proxy, the correlated
`deny_bypass_suspect`); security controls mapped to T1–T4 with the injection
surface into the deny path closed at every opener; the CLI (`tune` for numbers
and list-valued lexicon keys including the stoplist; `--missed-question` that
hands back the fixing command; the export/import migration offer); and a
test/fixture architecture pinning each Phase A acceptance criterion, plus two
named build-time verifications for the transcript-marker and
`UserPromptSubmit`-provenance premises. The skill-block machinery (FR-C1–FR-C4)
is deferred to the Phase C architecture per the per-phase lifecycle rule.

## What to do next (agent-owned)

1. **Dispatch review round 8** — a fresh independent expert review + collapse
   hunt, blind to each other, attacking the round-7 fixes, carrying the standing
   charter questions plus round 7's inheritance: (a) verify clause (iv) is a
   **total** classifier over every reachable input shape (no-object; pronoun-only
   object; attributive-compound heads like "test results"; multi-object/compound
   asks), not just the cases a fix touched; (b) whenever a round **widens** the
   deny-capable set, audit the new members for fulfilling-move wrongful denies,
   not only the recourse they were added to restore; (c) re-audit every
   owner-facing proxy/diagnostic against the "state both error directions, never
   present a proxy as a measurement" discipline. Apply all findings. Repeat until
   a round finds nothing real — that is convergence.
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
