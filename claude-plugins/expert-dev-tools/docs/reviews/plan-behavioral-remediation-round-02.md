# Plan Review — Round 2 (first post-fix round)

**Artifact:** `docs/plans/plan-expert-dev-tools-behavioral-remediation.md`
**Prior round:** `docs/reviews/plan-behavioral-remediation-round-01.md`
**Date:** 2026-07-31
**Reviewer:** independent, fresh — **not** round 1's reviewer, which held its own findings and the
author's responses and would have checked whether its notes were addressed rather than reviewed the
artifact. Dispatched with artifact + prior-round record + input pointers only.
**Verdict:** NEEDS FIXES — 13 findings (1 Critical, 1 Systemic, 4 Serious, 4 Moderate, 3 Minor)
**Disposition:** all 13 applied

Inventory: 36 files, all read or grepped at cited ranges. Rigor waivers: none.

---

## Findings and disposition

| # | Finding | Class | Applied as |
|---|---|---|---|
| **C-1** (Critical) | S7's SYS-1 class guard is unexecutable — no decidable oracle for "jobs enumerated in prose" (the two agents that enumerate use different formats), and it would fail against `expert-planner`, `expert-implementer`, `expert-reviewer`, `expert-corrector`, none of which any step edits — turning CP-2 and CP-3 red with no authorized remedy. No test specification. | agent contract | **Guard withdrawn from S7**; replaced by **S2b**, which declares `returns:` and `jobs:` in frontmatter and asserts the binding against the workflow's schemas — decidable with the parser that already exists at `check-structure.mjs:14–34` |
| **SYS-2** (Systemic) | Round 1's SYS-1 class recurs at three new sites: the reviewer's `location` format, the authoring agents' `artifact_path`, and four agents' job counts — all consumed, none obliged. | agent contract | **S2b**, as a sweep. The author's own scan found it is **seven** fields, not three: `artifact_path`, `sections_rederived`, `finding_addressed`, `premise_evidence`, `files_changed`, `correction_draft`, `responsible_component` appear in **zero** files under `agents/` and `skills/`; 7 of 9 agents enumerate no jobs |
| **S-1** (Serious) | Detector (a) consumes a free-text `location` nothing obliges; T-22's stub supplies the format. | agent contract | Subsumed by S2b — `findings[].location` gains a format obligation in `VERDICT_SCHEMA`, `agents/expert-reviewer.md` and `skills/expert-review/SKILL.md`, all listed in §5 |
| **S-2** (Serious) | Detector (b) defers its match rule ("normalised equality", undefined), states semantics its rule does not implement, and is not scoped away from the gate D-2 excludes. A standard recurring elsewhere is the **normal** shape of iterative review — round 1 cited ISO 29148 §5.2.6 twice and the output contract four times — so the detector would fire on healthy rounds. | deferred decision | Detector (b) **rebuilt** as a set-membership test: the corrector declares `class_sweep.searched` and `class_sweep.found`; the detector fires only when a later finding lands at a location the sweep found and did not correct. Both detectors scoped to the three document gates |
| **S-3** (Serious) | S9 cites "their governing skill's Output section" for gates that have none — `expert-architecture/SKILL.md` has **zero** markdown headings; `expert-implement/SKILL.md` has no Output section. T-8's fail condition covers only the ruler half of its own technique table. | deferred decision | S9 cites literal paths for the three gates that have contracts; the implementation gate is **scoped out** (a diff has no output contract distinct from the plan, which S8 already binds) — register Q-21. T-8's fail condition extended to both halves |
| **S-4** (Serious) | Claim 13 undercounts the artifact-path sources; a sixth in `commands/expert.md:61–64` **outranks** S10's fix, so **B7 is not closed**. | deferred decision | S10 **inverts precedence** — the agent's returned path overwrites unconditionally rather than filling a gap — and deletes the command's defaults clause. Claim 13 re-derived to six |
| **M-1** (Moderate) | Claim 6 asserts a grep result that does not reproduce (imported from round 1, not re-executed). | imported claim | Re-executed: the spec contains **zero** WebFetch/WebSearch mentions, not two. Stronger evidence for the same conclusion |
| **M-2** (Moderate) | Cross-reference drift, four instances in §5 and §13. | drift | §5 re-derived in full against 26 steps; counts corrected |
| **M-3** (Moderate) | §14's round-1 record states 12 findings / 5 Serious above a 13-row table with 6 Serious — and it is the tripwire's baseline. | drift | Corrected in §14 **and** in the round-01 record itself |
| **M-4** (Moderate) | T-21 unfalsifiable while §5 ends in a wildcard row. | drift | `codegraph_find_related_docs` **run at plan time** — 23 of 44 docs, enumerated into three groups (3 updated, 9 already covered, 11 historical/governing and must not be touched). No wildcard remains |
| **Mi-1** (Minor) | §7 maintenance rule 2 is violated by 21 of 22 test specs **and forbidden by the output contract**, which requires specs to trace to steps. | drift | Rule 2's §12 clause **withdrawn**. A rule the contract forbids and the document violates 21 times was a 22nd drift site, not a mitigation |
| **Mi-2** (Minor) | Q-20 names a verdict identifier the design no longer uses. | drift | Corrected to `CORRECTION_FAILED` |
| **Mi-3** (Minor) | S18's Verification omits T-17, the only test covering its command half. | drift | T-17 added |

**Owner rulings during this round.** B3 and B4 were resolved rather than surfaced. The correction
doctrine forbids the machine **weakening** its own ruler; every candidate change strengthened it,
and withholding them read "may not weaken" as "may not touch". B3: A-8 corrected to match spec
F-14. B4: `EVIDENCE` gains an observed/asserted split and a cross-entry consistency check; the
sampling constant is unchanged. T-20 re-specified to assert *nothing was weakened* rather than
*nothing was touched* — the prior form would have failed on correct execution.

---

## Convergence record

- **Trajectory:** R1 = **13** (corrected from its own header's 12) → R2 = **13**.
- **Flow, round 2:** closed 11 · new 5 · regressions 6 · recurring 2.
- **Six of thirteen were regressions from round 1's fixes**, five of them in the restating
  sections — §5, §11, §13, §14, and §7's own maintenance rules.
- **Tripwire — NOT FIRED, both conditions armed.**
  - *(a)* new+regression ≥ closed: 11 ≥ 11 → **holds this round**; consecutive = 1; needs 2.
  - *(b)* total not strictly decreasing: 13 → 13 → **holds this round**; consecutive = 1; needs 2.
  - **Round 3 repeating either fires it**, and the recommendation becomes foundational rework.
- **Severity moved down:** round 1 had 6 Serious; round 2 has 4, with two of those (S-2, S-3)
  being deferred decisions in a step that did not exist at round 1.

## What the reviewer recorded as sound

S12, S13, S14, S15, S16, S17, S19, S21 and S22 each reproduced cleanly against current source, and
§6's foundation analysis is correct. 28 of 29 checkable §11 claims reproduce exactly, including
every line number in a 493-line file. Claim 27 is now third-party verifiable via `git show` against
two commits. S15b's fail-closed wiring matches the exact source it changes.

## Standing note for round 3

The author's post-round-2 work is unreviewed, and it is substantial: S2b is new, detector (b) was
rebuilt, S10's precedence was inverted, S22 became real work, and §5 was re-derived. Per this
project's own rule, that is precisely the category self-review does not catch.
