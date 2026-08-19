# Context Oracle — status

*Plain-language project status, rewritten each session. It states the current
state and what to do next; the evidence lives in `docs/reviews/`, the durable
lessons in `docs/collapse-log.md`, and everything attributed to Max Cogar in
`OWNER-LEDGER.md`.*

## 2026-08-16 — Full restart: owner claims ratified, the spec rebuilt from scratch and independently reviewed; three owner questions are the only thing between here and the Phase A architecture

**What happened.** Max Cogar called a restart after the project kept getting
rebuilt on assumptions attributed to him that he never confirmed. Two things were
established this session and everything else was rebuilt on them:

1. **The owner ledger is now fully ratified.** `OWNER-LEDGER.md` — every owner claim
   (OL-1…OL-12, plus OL-C1 "no arbitrary limit gates operation" and OL-C2 "the
   corrective feature is small/personal/non-primary") is CONFIRMED in his own words;
   OL-12 was reworded and approved; the budget concept is REJECTED (OL-R3). Nothing
   owner-attributed is pending. **New standing rule:** nothing may be attributed to
   Max unless it is CONFIRMED in the ledger with his sign-off in chat.

2. **The v1 spec was rebuilt from scratch** (`docs/specs/spec-context-oracle.md`),
   written only on the confirmed foundation + the mission + named,
   current-verified standards + recorded judgments. The old `spec-context-oracle.md`
   and `spec-context-oracle-phase0.md` are superseded (the rebuild replaced the
   former; the phase0 file is dead — see "cleanup owed" below).

**The spec was independently reviewed (both axes) and all findings applied.** Two
fresh reviewers (`docs/reviews/2026-08-16-*`): an expert/structure pass (1 Critical,
1 Serious, 5 Moderate, 5 Minor) and an adversarial collapse-hunt (mission-fidelity).
Every finding was applied in one revision. The three that matter most:
- The bar as first written **silenced the uncertain hazard** — the exact
  possible-disaster fact OL-3 says to speak. Fixed: FR-A5a speaks it *flagged*.
- The learning loop **only demoted** (a one-way ratchet to silence, a re-sprung
  2026-07-22 trap). Fixed: FR-L3b requires promotion/re-exploration.
- A latency figure was **attributed to Max through RETHINK §5 rationale** — the same
  poisoned channel as the rejected budget. Fixed: it is a recorded judgment (D-31),
  not his. (All three logged in `docs/collapse-log.md`, 2026-08-16.)

**What is verified vs assumed in the spec:** the hooks contract and `node:sqlite`/
FTS5 facts were re-verified 2026-08-16 (FTS5 is NOT in stock `node:sqlite` — a false
premise in the old spec, now a stated constraint C-2). A set of standards are marked
"prior pass; re-confirm at build" in §9 — load-bearing concepts, exact wording to be
re-fetched before each is built on (spec §13). This is carried openly, not hidden.

**What to do next:**

1. **Max answers the three questions in spec §13 (Q1–Q3).** They are the only open
   owner items and two could change the spec:
   - **Q1 — Answer-drift genre.** His ledger contradicts itself (OL-9 in-scope vs
     OL-C2 "awaits ruling"); it is also the weakest mission fit. *Recommendation:
     drop it.* Not built until he rules.
   - **Q2 — Uncertain-hazard voice.** The tool now *speaks* low-confidence hazards
     flagged (derived from OL-3 + OL-C1). *Confirm, or name a confidence below which
     it should stay quiet.*
   - **Q3 — v1 language set.** Which languages ship first (prior proposal: TS/JS/TSX
     + Python). A scope preference only he sets.
2. **Apply his answers, then a short confirmation review of just those changes**
   (no point reviewing a spec with open owner questions that could move it).
3. **Then the Phase A architecture document** — deterministic core — per the
   lifecycle.

**Cleanup owed (agent's, not blocking):** the superseded `spec-context-oracle-phase0.md`
and the stale references to it in `CLAUDE.md`'s read-list should be removed once the
rebuilt spec is settled; and `CLAUDE.md`'s description of the spec as "v1 across
three phases + a separate phase0 spec" should be updated to the one-spec, phases-as-
build-order structure. Left for the settle point so it isn't half-done now.

**PR:** `https://github.com/Maxcogar/agent-armory/pull/59` (draft) now carries the
restart + rebuilt spec; its early commits (the dead token-budget "correction") are
superseded history.

## What is still open, and where it lives

- **Spec owner questions Q1–Q3** — in `docs/specs/spec-context-oracle.md` §13. The
  only thing gating the architecture phase.
- **`OWNER-LEDGER.md`** — fully ratified; nothing pending.
- **The Phase A architecture document does not exist yet** — it is written after
  Q1–Q3 are answered and the confirmation review passes.
