# Second independent adversarial review — spec revision (2026-08-25)

**Target:** `docs/specs/spec-context-oracle.md` after the first review's 14 findings were
applied.
**Reviewer:** a second independent subagent (not the author, not the first reviewer),
tasked with (1) auditing closure of the first 14 findings and (2) a fresh hunt.
**Outcome:** first-round closure confirmed **11/14 fully closed, S3 partial**; **6 new
findings**, all applied (this file is the closure record). Written once; do not edit.

## Closure audit (confirmed by the second reviewer)
- Fully closed: C1, C2, S1, S2, S4, M1, M2, M3, M4, m1, m2, m4. `[OL:#3]` appears nowhere
  in the spec; every `[OL-*]` key resolves to a real ledger entry; no fabricated quote
  remains; OL-P1 (PENDING) is never used as authority.
- Partial: **S3** — the fix lived in FR-A2g prose but AC-8 tested only firing timing, so a
  run-state-only whisper still passed. Closed now by Finding 3.

## New findings and closure

| # | Sev | Finding | Fix applied |
|---|---|---|---|
| 1 | Serious | The completion-check / Completeness whispers fire *at a `Stop`* and can only reach the agent by continuing the turn — a use of the Stop-continuation primitive that FR-B1's "blocking exists in **exactly** the two confirmed cases" flatly contradicts. | Split the primitive's two uses: **FR-B1** is now *enforcement blocking* (hold until condition clears, exactly two cases); new **FR-B4** is a *single self-releasing continuation* that only delivers a Stop-time whisper (FR-A2f/g), gates on nothing, releases after one cycle, grounded on OL-12. FR-B3 and FR-O2 reworded to match; D-34 records it. |
| 2 | Serious | `[OL-3]` cited as authority for "never mutates the repository / tree stays pristine / no repo-tree write" — but OL-3's confirmed content is about **blocking**, not writes. Same defect class as C1/C2, milder (property is benign and separately grounded). | Re-grounded those citations on `[D-9]` (in-tree write only on `init`) at §1, P8, FR-X5, §2.2, FR-B3, AC-2. `[OL-3]` retained only where genuinely about blocking / fail-open (P2, FR-O3, NF-1). |
| 3 | Moderate | S3 unverifiable: AC-8 tested firing timing, not headline content, so the "test not run" whisper S3 rejected still passed. | AC-8 given a **content assertion**: the whisper must headline the covering-test→region mapping; a run-state-only headline fails. |
| 4 | Moderate | `FR-O4`/`FR-O4a` are cited as live v1 requirements by `CLAUDE.md`, `RETHINK.md`, and the Phase 0 spec, but the 2026-08-16 rebuild renumbered them out of existence. | Restored the `FR-O4` (no-deny-path) and `FR-O4a` (one-continuation bound) labels on the surviving requirements (FR-B3, FR-B2) so the downstream citations resolve. |
| 5 | Moderate | Four Phase-A genres (Orientation, Reuse, Consequence, Completeness) had no acceptance criterion, so the Phase-A exit could be declared on untested core genres. | Added AC-1a–AC-1d, each asserting the genre's **marginal-value headline** (entry-points; the "most call sites use it" convention; historically-coupled tests not a raw count; the unchanged co-change partner). |
| 6 | Minor/Mod | C-1 labelled the Node.js runtime "fixed by circumstance," but the harness is language-agnostic and the cited circumstance (`node:sqlite`) is downstream of choosing Node — circular. | Restated C-1 as recorded judgment `[D-33]`: Node chosen for a cold-start/no-toolchain store (`node:sqlite`) serving C-3; architect may revisit. |

## Fresh-hunt classes that produced nothing (per the second reviewer)
- Owner attribution not in CONFIRMED — none beyond Finding 2; every remaining `[OL-*]` resolves.
- Hollow decisions — none unflagged; blocking is honestly a non-mission owner objective.
- Internal contradictions — one (Finding 1), now fixed.
- Unreachable acceptance criteria — none; gaps were Findings 3 and 5.
- Smuggled single implementation — one (Finding 6, C-1), now a judgment.
