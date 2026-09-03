# Context Oracle — status

*Plain-language project status, rewritten each session (not appended). It states
the current state and what to do next; evidence lives in `docs/reviews/`, durable
lessons in `docs/collapse-log.md`, and everything attributed to Max Cogar in
`OWNER-LEDGER.md`.*

## Where the project stands (2026-09-03)

The spec (`docs/specs/spec-context-oracle.md`) is signed off (`OL-C6`,
2026-08-28). The Phase A architecture document (`docs/architecture-phase-a.md`)
has been through **eight full rounds** of the mandatory independent adversarial
review — each round a fresh expert review (premise/standards axis) plus a fresh
collapse-hunt (mission-fidelity axis), dispatched blind to each other and never
to the author. Every finding from every round has been applied in full; all
sixteen review files live under `docs/reviews/` (rounds 1–5 dated 2026-08-29,
rounds 6–8 dated 2026-09-03).

**Round 8 (2026-09-03):**

- Expert review — NEEDS FIXES: 0 Critical / 1 Serious / 1 Moderate / 1 Minor.
- Collapse-hunt — DOES NOT SURVIVE: 0 collapses / 1 partial / 5 notes (the fourth
  consecutive zero-collapse round).
- Findings count: 8 → 5 → 3 → **3** (plateaued after three straight decreases —
  the first non-decrease). Collapse-class: 5 → 6 → 1 → 1 → 0 → 0 → 0 → 0. The
  non-convergence tripwire has NOT fired, but its count condition is now **armed**:
  if round 9's total is not below 3, it fires.

All three round-8 defects were in the **answer-drift classifier** — the same
component rounds 6, 7, and 8 each found incomplete in a new way. That pattern
(a component found incomplete a different way each round) was itself the signal:
the classifier was being patched input-by-input rather than specified once. So
round 8 was applied as a **specification completion**, not another patch:

- Clause (iv) now carries an explicit **object-head-extraction rule** (the head
  is the rightmost noun of the object phrase; attributive modifiers ignored; the
  head alone matched, never a bag-of-words scan) and a **coordinated-verb rule**
  (an ask with more than one top-level verb is `info` when any top-level verb is
  communicative-and-`info`). The "version number → info" corpus row that
  contradicted the head-noun rule is re-pinned to the rule.
- The wrongful-deny residual's member (3) is **generalized to a class** — any
  in-frame ask that classifies `info` but whose fulfilment or a co-asked action
  is a repo mutation. A lexicon or parse gap that routes more asks to `info` now
  falls into the class rather than exposing a missing enumerated member, which
  ends the P1-lineage "N member shapes" recurrence (it grew every round 5→7).
- `deny_bypass_suspect`'s correlation gets a **named receptacle** (the denied
  target path recorded on the deny row's `evidence_json`, covering Edit/Write/
  NotebookEdit); the Bash-authored-change under-detection is owned in L3.

**Convergence has NOT been reached, and this is not the terminal round.** The
terminal definition (a round that finds nothing real) is unmet — round 8 found a
real Serious and a partial. The architecture is an **eight-times-reviewed draft,
not an approved artifact. No plan, no build, until a round finds nothing real.**

## What to do next (agent-owned)

1. **Dispatch review round 9** — a fresh independent expert review + collapse
   hunt, blind to each other, attacking the round-8 fixes, carrying the standing
   charter questions plus round 8's inheritance: (a) the classifier is now
   specified as rules-plus-corpus-derived-from-rules — verify the corpus is
   actually consistent with the stated rules and that the head-extraction and
   coordinated-verb rules cover every reachable shape; (b) the residual is now a
   *class* — verify a newly-routed ask falls into it rather than needing a new
   member; (c) verify every specified cross-event read has a named receptacle.
   Apply all findings.
2. **Watch the tripwire.** If round 9 finds a real Serious/partial in the
   classifier again AND the finding count does not fall below 3, the
   non-convergence tripwire fires — that is the signal that patch-forward on this
   component has run its course and the classifier's foundation should be
   reconsidered (a design question I own per OL-11; I will raise it with the
   owner only if it turns into a scope or spec-changing call). Otherwise, repeat
   the review loop until a round finds nothing real — that is convergence.
3. **On convergence:** rewrite this file, mark the architecture approved in its
   "Status of this architecture" section, then write the Phase A implementation
   plan (consuming spec + architecture), then build against §11.5's Phase A exit
   and the §14 Phase A criteria.

## Open items

- The two **build-time verifications** the architecture names (L11): marker
  presence on the owner's real interactive transcripts, and whether
  platform-injected turns fire `UserPromptSubmit`. Neither gates the design; both
  are resolved with real captured sessions during the build.
- No owner question is open.
