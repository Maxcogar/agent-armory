# Independent verification — the token-budget correction (P0-D-27), Phase 0 spec

**Date:** 2026-08-13
**Target:** `docs/specs/spec-context-oracle-phase0.md`, decision `P0-D-27` (the
"per-event limit is a token budget, not a count of one" correction) and every
passage it touched.
**Why:** `P0-D-27` landed *after* the round-5 passes (2026-08-12) and so was the
one change in the document never independently reviewed. STATUS (2026-08-12) named
verifying it as the next step.
**Method:** one independent adversarial pass — citation/fact check plus collapse
hunt — never the author. Two axes both required per `CLAUDE.md`.

## Verdict: NEEDS FIXES — 6 findings (2 Critical, 1 Serious, 2 Moderate, 1 Minor)

The correction's intent was sound and owner-backed (multiple whispers per event is
correct; the count-of-one was Max Cogar's rejected fabrication, OL-R1). As landed it
was incomplete and under-specified.

### Critical 1 — FR-A5 still encoded the single-whisper rule
`FR-A5` read *"only the top candidate above the bar is spoken"* — an independent,
uncorrected copy of the rule `P0-D-27` claimed to remove. `FR-A5` is the requirement
that defines what is spoken, so an implementer would ship single-whisper delivery,
contradicting `FR-A3` / §7 / `AC-28` ("both are delivered"). The author expanded that
very paragraph but left the count clause untouched.

### Critical 2 — FR-O2 capped the shim at one whisper, and §3 called it "unchanged"
`FR-O2` read *"relay at most one whisper back"* and §3 listed it under "unchanged
(20)". This makes multi-whisper delivery impossible **at the delivery mechanism**
regardless of `FR-A5`, and the §3 partition falsely certifies FR-O2 preserves v1's
meaning while `P0-D-27` overturns exactly that meaning.

### Serious 3 — the "per-trigger token budget" had no value and no source
The new rule turns on "fits the per-trigger budget," but only the per-session budget
(2,000 tokens, v1 `[D-10]`) has a value. The per-trigger budget was a number-shaped
hole, in neither `P0-D-4`'s judgment list nor v1 — making `AC-28` / §7 untestable.

### Moderate 4 — "token budget" over-attributed to the owner
`P0-D-27` and §3 called it *"the per-trigger token budget the owner actually set."*
`RETHINK.md:175–176` verbatim is *"Per-trigger and per-session whisper budgets. Hard
caps."* — "token" does not appear; the owner set no denomination and no value. The
count-of-one rejection is authoritatively his (OL-R1); the token denomination is a
reconstruction and must be labeled as the document's judgment.

### Moderate 5 — §3 disposition partition internally inconsistent
Consequence of Critical 2: FR-O2 in "unchanged" contradicts the narrowed FR-A3.

### Minor 6 — budget-tight competition path unexercised, tiebreak undefined
`AC-28` tested only "both fit" and "budget spent," never the case where more cleared
than fit; no tiebreak specified for equal scores.

## Disposition — all six applied (commit on branch `claude/project-oracle-y4olms`)

The reviewer diagnoses; it does not dictate the correction. The applied fix is
smaller and derived, not a patch-per-finding:

- **C1** — `FR-A5` rewritten: every candidate that clears the bar is spoken within the
  session budget; v1's "only the top candidate" explicitly not carried.
- **C2 / M5** — `FR-O2` relays *every* whisper the service returned; moved from §3
  "unchanged" (→19) to "narrowed" (→29).
- **S3 + Min6** — resolved by **removing fabricated machinery, not adding it**: Phase 0
  fixes no separate per-trigger number; the per-trigger cap defaults to the session
  cap, so per-event contention cannot arise, and the ordering/tiebreak is deferred to
  Phase 1 where the exit-run data (P0-4) that would set the cap will exist. The session
  hard cap still bounds everything. Recorded as new `[P0-D-28]`.
- **M4** — attribution corrected in `FR-A3`, `P0-D-27`, and §3; token denomination now
  labeled a derived document judgment (`[P0-D-28]`).

The spec's own check script passes 8/8 after the fixes. A focused re-verification of
the corrected decisions followed (see the companion review dated 2026-08-13).

## Generalized lesson
Logged to `docs/collapse-log.md` (2026-08-13): a correction that replaces an
unsourced owner-attributed limit must sweep **every** copy of the old rule and must
not replace it with a second unsourced number; the reviewer names the defect, the
author derives the fix.
