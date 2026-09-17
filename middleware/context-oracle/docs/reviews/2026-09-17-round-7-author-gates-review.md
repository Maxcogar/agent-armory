# Author's compliance review (Gate A/B/C walk) — plan-phase-a.md after the round-7 corrections

**Date:** 2026-09-17
**Author (same as this reviewer):** the session that applied round 7's findings
(M1, T1) to `docs/plans/plan-phase-a.md` through the hook-enforced correction loop,
then applied the restating-surface re-derivation this walk found.
**What is being reviewed:** `docs/plans/plan-phase-a.md` after the round-7 fixes
(40 steps; 124 test specs; 27 probes).
**Inputs closed by this pass:** the round-7 findings —
`docs/reviews/2026-09-17-round-7-expert-review.md` (M1) and
`docs/reviews/2026-09-17-round-7-collapse-hunt.md` (M1, T1). The two M1s are one
finding (the residual-quote branch shipped untested); T1 is a Step 13 prose-order
nit.
**What this review is NOT:** the independent round-8 collapse-hunt and expert-review
(fresh subagents, dispatched neutrally after this file). This walk does not close
the round.
**Why it exists:** Max Cogar requires the author's Gate A/B/C walk after each
correction pass and before any review.

## 1. The corrections and the second-order surface

- **M1 (both reviewers) — the residual-quote safety branch shipped untested.** The
  `miner-hygiene` fixture planted only `café.txt` (raw UTF-8 under
  `core.quotePath=false`, never quoted), so T-13-1's `Fails when` guard for a
  C-quoted field could never fire. Fix (correction-loop issue 1): T-13-1's Data now
  plants "one file renamed to a residually C-quoted path (`a\b.txt` … `--numstat`
  prints the rename with its new identity beginning with a double-quote) … reaching
  the residual-quote skip on a rename identity" — so the existing guard becomes live
  and a whole-field-first-char implementation would fail it. (Issue 2, the
  collapse-hunt's identical M1, was closed by that same edit.) Deciding source:
  AD-13's record-never-guess routing must be *exercised*; AD-24 equivalence
  partitioning; executed `probe:27_git_numstat_quotepath`.
- **T1 — Step 13 prose order.** The residual-quote skip was stated before the
  rename split it references ("either rename identity"). Fix (issue 3): the two
  sentences are reordered — rename split first, quote check after — content
  identical.
- **Second-order surface — Q56.** This walk's `--impact HEAD` step flagged Q56 as a
  restating surface of the changed Step 13. Q56's evidence parenthetical read
  "(`T-13-1` plants both shapes)", which omitted the residual-quote fixture the M1
  fix added — the same class of drift this walk caught on the S1 fix. Re-derived:
  "(`T-13-1` plants both rename shapes and a residually C-quoted rename)".

## 2. The `--impact HEAD` restating-surface walk

`derive-plan-sections.mjs --impact HEAD docs/plans/plan-phase-a.md` reports the only
changed step as **S13**, and its restating surfaces are re-derived or confirmed:
- `T-13-1` (declared test) — the M1 fix is here; consistent with Step 13's branch. ✓
- **Q56 (register)** — **re-derived** (above); the one surface needing an edit.
- Standards §3 line 288 (confidence grounding), test spec 7821 (T-13-1 header),
  test spec 9133 (Step 13 corpus floor + Step 18, AC-6), §14.1 line 9692
  (fault-code list), and the Step 5/6/14/16/30 mentions of Step 13 — all reference
  Step 13's subprocess/outputs/name, none restates the residual-quote handling or
  the reordered prose. No change.

## 3. Closure of the round-7 findings

| Finding | Where closed | Re-derived | Check |
|---|---|---|---|
| ER M1 / CH M1 — residual-quote branch untested (guard inert) | T-13-1 Data plants a residually-C-quoted rename; existing `Fails when` guard now has a reaching input | Q56 evidence parenthetical (this walk) | `--check`; `--impact HEAD`; read of T-13-1 + the guard |
| CH T1 — Step 13 states the quote check before the rename split | Step 13's two sentences reordered (rename split first) | none (self-contained prose reorder) | `--check`; read of the diff |

## 4. Author's collapse-test on the load-bearing content

The round-7 fixes introduce no new load-bearing *decision* — M1 is a test-data
addition that exercises an existing decision (the residual-quote routing, whose
own collapse-test was recorded in the S1 author-gates walk and survived round 7's
independent execution), and T1 is a prose reorder. There is nothing new to
collapse-test; the residual-quote decision itself is now *tested*, which strengthens
rather than changes it.

## 5. Gate A / B / C walk

**Gate A — enables downstream work.** The changed units carry no open question or
option set: T-13-1 states the added fixture file and its assertion; Step 13's
reordered prose states the same behavior in execution order. An implementer can
build the fixture and the branch without a decision on the fly. ✓
**Gate B — auditable from the document.** The M1 fix's standard is named (AD-24
equivalence partitioning; AD-13 never-guess); its executed premise is `probe:27`
(§11.4); the guard and its failure condition are in T-13-1. Q56's re-derivation is
consistent with T-13-1. Each answerable by pointing to a section. ✓
**Gate C — final checklist (touched items).** `--check` exits 0 (regions current,
27 probes cited, step↔test/step↔step resolve); `--self-check` 34 checks;
`check_docs.py` passes; no probe changed; the authored restating surface Q56 was
re-derived, not patched. ✓

## 6. Gate runs (this pass)
```
$ derive-plan-sections.mjs docs/plans/plan-phase-a.md --check
OK: 40 steps, 13 elements, 124 test specs, 27 probes cited, regions current   (exit 0)
$ derive-plan-sections.mjs --self-check
self-check passed: 34 checks                                                  (exit 0)
$ tools/check_docs.py
context-oracle doc-consistency check passed.                                  (exit 0)
$ derive-plan-sections.mjs --impact HEAD docs/plans/plan-phase-a.md
steps whose text changed since HEAD: S13   (surfaces walked in §2)             (exit 0)
```
(The probe runner is not re-run this pass — no probe changed; all 27 were green
earlier this round.)

Round 7 is not closed until the independent round-8 pass is clean on this plan.
