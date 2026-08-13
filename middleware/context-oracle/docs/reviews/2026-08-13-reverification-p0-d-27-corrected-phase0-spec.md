# Focused re-verification — the corrected token-budget decisions, Phase 0 spec

**Date:** 2026-08-13
**Target:** the corrected `P0-D-27` and new `P0-D-28`, and every passage the
2026-08-13 verification changed (`FR-A3`, `FR-A5`, `FR-O2`, §3 disposition, §7,
`P0-D-18`, `AC-28`).
**Why:** the corrections are a fresh, load-bearing change; a fresh change gets one
independent adversarial pass before it is trusted. Instructed to report **substance
only** (contradictions, hollow decisions, mis-citations, untestable requirements) —
no wording nits — to avoid the review→fix churn.
**Method:** independent adversarial pass, not the author.

## Verdict: NEEDS FIXES — 1 Serious finding. The spec correction itself is clean.

The multi-whisper correction inside the Phase 0 spec is sound and internally
consistent. The single substantive defect is in the **authority file** it rests on.

### Serious 1 — OWNER-LEDGER OL-R1 over-attributes the token denomination to the owner
`OWNER-LEDGER.md:52` (OL-R1) asserted *"Your rule is a per-trigger / per-session
**token budget** (RETHINK:175–176, 'hard caps'), not a count."* `RETHINK.md:175–176`
verbatim is *"Per-trigger and per-session whisper budgets. Hard caps…"* — no "token".
This directly contradicts `P0-D-28` (*"gave neither a denomination nor a value… this
is this document's judgment, not the owner's"*). Since `CLAUDE.md` mandates reading
`OWNER-LEDGER.md` **first** as the authority for what is Max Cogar's, a future agent
would read "the owner's rule is a token budget" as owner-truth and undo the care the
spec took — the mirror image of the exact collapse OL-R1 exists to record.

**Applied fix:** OL-R1 now reads *"a per-trigger / per-session budget, hard caps
(RETHINK:175–176, verbatim … — no denomination stated), not a count,"* and states the
token denomination is a derived document judgment (`[P0-D-28]`), not the owner's. The
count-of-one rejection — which *is* Max Cogar's — is retained.

## Confirmed clean (the checks the pass ran)

- **Single-whisper rule fully eliminated.** Verified across `FR-O2`, `FR-A3`, `FR-A5`,
  `FR-A4`, `AC-2` (10% ceiling is a fraction of events, orthogonal to per-event count),
  `AC-3`, `AC-11` and `AC-28` (both *require* multi-whisper delivery), and the §3
  disposition rows. A grep for the old phrasings surfaced only the correction's own
  explanatory text and the factual "at most one at most events" consequence — no live
  single-whisper requirement remains. §3 partition still sums (19 + 29 + 17 = 65).
- **`P0-D-28` passes the collapse test, both legs.** Deferral leg: the 2,000-token
  session cap is a hard bound on total injection, per-event concentration is
  structurally small (a few genres, a few hundred tokens each), so the session cap
  genuinely bounds the single-event flood; the tighter cap's value is what P0-4's
  counts exist to inform (measure-first). Nothing is left untestable — `AC-2`, `AC-20`,
  `AC-28` all key off the concrete session budget. Token-denomination leg: validly
  derived (per-session already tokens per `[D-10]`; §5 frames cost as attention;
  cross-currency nesting would be incoherent), labeled the document's judgment; the
  inference that rejecting the count-of-one argues against a count denomination is
  sound.
- **Citations hold.** `RETHINK.md:175–176` (verbatim), `RETHINK.md` §5 (attention
  model), v1 `[D-10]` (2,000-token derivation, "§5 sets no number"), `collapse-log.md`
  entries — all support their citing claims. OL-R1's "token" gloss was the sole
  unsupported citation (fixed).
- **Nothing orphaned.** The deferred score-ordering is a consistent forward-reference
  to Phase 1 (§7, `FR-A5`, `P0-D-18`, `P0-D-28`); no Phase 0 AC tests ordering.

## Outcome
The token-budget correction thread is closed: verified across two independent passes
and repaired, including the one downstream over-attribution in the owner ledger.
