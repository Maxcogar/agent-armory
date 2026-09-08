# Author's compliance review — plan-phase-a.md against expert-plan Gates A/B/C and CLAUDE.md rule 2

**Date:** 2026-09-07
**Author of the plan (same person as this reviewer):** the session that re-authored `docs/plans/plan-phase-a.md` on branch `claude/context-oracle-plan-fix-zmfuoj`, from the 2026-09-06 reviews (`2026-09-06-plan-collapse-hunt.md`, `2026-09-06-plan-expert-review.md`, `2026-09-06-author-gates-review.md`, `2026-09-06-meta-check-skipped-steps.md`).
**What is being reviewed:** `docs/plans/plan-phase-a.md` as installed in the working tree (5,970 lines, 40 steps, 113 test specifications).
**What this review is not:** the independent collapse-hunt and expert-review required by `CLAUDE.md` dominating rule 2 and the project's review protocol. Those are dispatched to fresh subagents after this document is written, and they review the entire plan, not this document's claims.
**Why it exists:** the expert-plan skill's compliance gates are run by the author before delivery, and Max Cogar required the self-check to be done "after your corrections and before any review". Each item below names the check that was actually run and what it observed. Where a check is a script, the script's scope is stated so that its blind spots are visible.

Findings found by this pass and closed before dispatch are listed under each gate item as **found → closed**. Nothing found by this pass is left open.

---

## How the checks were run

Two scripts over the installed plan (kept in the session scratchpad, not committed — they are reviewer tooling, not project content):

- **Reconciliation script.** Parses every `**T<n>-<m>` heading in §12 with its `File.` and `Verifies.` fields; every `### Step N` with its `Dependencies.` and `Verification.` fields; the §5.1 tree with its `# Step N` / `# T-ID` annotations; the §9 checkpoints; the §2.3 and §12.4 tables. Cross-checks: every T-ID defined ↔ cited by a step Verification field or a checkpoint ↔ annotated in the §5.1 tree ↔ its `File.` path present in the tree; every Dependencies field names only earlier steps; every step number referenced anywhere is 1–40; every AD-n, V-n, L-n, FR-*, AC-*, D-n, OL-* citation resolves in `docs/architecture-phase-a.md`, `docs/specs/spec-context-oracle.md`, or `OWNER-LEDGER.md`; every D-plan-n, Q-n, G-n, R-n reference resolves to a definition; every step carries the six fields and, unless marked trivial, the four Gate 3 parts; every §11 entry carries an `Evidence.` field.
- **Narration/deferral script.** Greps §7 for option-set and deferral phrasings (`TBD`, `to be decided`, `either … or`, `one of the following`, `alternatively`, `if needed`, `as appropriate`, `might`, `perhaps`, trailing `?`) and the whole document for self-correction artifacts (`retracted`, `prior wording`, `previous plan`, `earlier draft`, `batch N`, `round-N fix`, `the review said`, `oops`, `on reflection`).

A grep is a lead, not verification (`SKILL.md`, "I searched and found nothing"). Where a gate item is about meaning rather than structure, the check below is a read, and the read's scope is stated.

---

## Gate A — does the plan enable downstream work

**A1. Can an implementer execute step by step without architectural decisions on the fly, and without encountering an open question, unmade choice, or option set?**

- *Check run.* Narration/deferral grep over §7: zero hits. Read of every step's `What changes` paragraph (all 40; the extraction is ~900 lines) for choices left to the implementer: parameters, thresholds, file names, orderings, and formats are stated as values; where a value is the plan's own (the six `plan_seed` thresholds) it is a stated number with its reasoning in D-plan-7 and its measurement in Step 39.
- *Observed.* No step presents an option set. Step 5's URL normalization states every axis; Step 25 states the lag hold as read-to-EOF + deny-on-open with no heuristic; Step 31 states the marker as the `command` pattern; Step 36 states the seam's shape as the executed invocation contract.
- **Found → closed.** Step 6 was labelled trivial while it chose a `const enum` that `T6-1` could not enumerate at runtime (`TS2475`, executed under the Step 1 tsconfig with `typescript` 5.9.3). Replaced by an `as const` tuple with a derived type; Gate 3 written for Step 6; Step 1 part 3/4 and D-plan-3 re-derived (the "no enums" argument no longer carries any weight and was removed); §11.4 entry added with the execution; Q31 registered.
- **Found → closed.** `src/stores/dao/tuning.ts` was created by both Step 9 and Step 12. Now Step 12 only; §5.1 annotates it; `T9-1` excludes it; Q32 registered.
- *Outcome.* Pass, on the author's read. The independent reviews are the check that this read did not miss a choice hidden in prose.

**A2. Can a reviewer check a build against this and decide whether each step is done correctly, including whether each test was built to its specification?**

- *Check run.* Reconciliation script: every step's Verification field cites T-IDs that exist; every T-ID is cited by its step or a checkpoint; every `File.` path is in the §5.1 tree; every §5.1 test file is claimed by exactly one T-ID. Counts: 54 unit, 3 build, 5 convention, 47 replay test files; 113 specifications (T38-* replays share the §12.3 preamble's Level and Real/doubles fields and state the rest individually).
- **Found → closed.** 22 §12.3 entries (`T38-10`–`T38-27`, `T38-29`, `T38-31`–`T38-33`) lacked the `Verifies.` field that traces the behaviour to its step(s). Added, each naming the step(s) exercised and the criterion pinned.
- **Found → closed.** `T24-1`'s second fixture path was abbreviated to a basename; full path written. Step 38's Verification said "every `T38-*`" instead of the range; now `T38-1`–`T38-33` with the two build-time scripts named.
- *Outcome.* Pass.

**A3. Can the user read this and know what they are getting, what is corrected along the way, and what was excluded with their approval?**

- *Check run.* Read §1, §2.1–2.4, §6. §2.3 maps every spec §11.5 Phase A element to steps; §2.4 states no exclusion requires owner authority and why (`OL-C6` sign-off, `STATUS.md` declaring no open owner question); §6 states no foundation correction with the CodeGraph evidence.
- *Outcome.* Pass. Bin 2 is empty and says why (§14.2).

---

## Gate B — is the plan's own compliance auditable from the document alone

| Question | Where the document answers it | Check run |
|---|---|---|
| Which named standards govern, and what does each govern? | §3 — each entry names the standard, its read date, and what it governs | Read §3; every entry carries "governs" text and a 2026-09-07 read date or the architecture's verified read |
| Where does each non-trivial step come from? | `Source.` on all 40 steps | Script: 40/40 present |
| For each non-trivial step, what alternatives were rejected and why? | Gate 3 part 4 on 37 steps; Steps 8, 40 marked trivial with the reason in the field | Script: 37/37 four parts; the two trivial markings read — Step 8 is the AD-5 schema verbatim, Step 40 is `CLAUDE.md` routine |
| How was each factual claim verified? | §11.1–11.6, 81 entries, each with `Evidence.` | Script: 81/81 have the field; read of the three entries whose evidence is a registry or listing read (npm `view` output, the session's repository listing) — each names the command, the fields read, and the date |
| Which decisions were judgment calls, with reasoning? | §10 D-plan-1…19, each with the Clear Thought pass named and a `Reasoning` paragraph; §10A collapse-tests each | Read the D-plan list and §10A headings: 19/19 have a §10A entry |
| Where does the plan diverge from existing patterns? | §8 — none, with the CodeGraph evidence and the archived-sibling statement | Read |
| What questions arose and how was each closed? | §14.1 Q1–Q32, §14.3 G1–G4, §14.4 two-pass record | Script: every Q/G reference resolves; read: every entry has a step, a bin, and a disposition |
| For each test: behaviour, level, real/doubles, data, failure condition? | §12.1–12.3 | Script: `File.`/`Verifies.` on all 113; grep for doubles without a Meszaros kind: zero hits; read of the entries that name a double (T2-1 stub, T29-1 fake, T22-2 module-replace) — each names kind and justification |
| What could not be grounded, and what was attempted? | §15 G1–G4 with attempt evidence | Read |

*Outcome.* Pass. No answer above required interpretation beyond reading the named section.

---

## Gate C — final checklist

| Item | Check run | Observed |
|---|---|---|
| Every step has a Source annotation | script | 40/40 |
| Every non-trivial step has all four Gate 3 parts | script + read of the trivial markings | 37 with four parts; 2 trivial with reason; 1 (Step 6) **found → closed** above |
| No step presents alternatives, defers a choice, or contains an unanswered question | grep + read of every `What changes` | none observed |
| Every factual claim in a step has a §11 entry | read of §7 against §11 for the claims added this session (Node API availability, `const enum`, layout reproduction, hooks timeout drift, V7/V8/V9/V17 re-executions, registry versions, repository list, transcript marker measurement, CodeGraph baseline) | each has an entry; **found → closed**: Q28 pointed at a §11.4 entry that did not exist — entry added with the execution on 22.22.2 and the statement that the 22.16.0 floor is executed only by CI's matrix entry |
| Every §11 entry carries read-level evidence | script for the field; read for the kind | file reads carry `:N–M`; executions carry the command and output; documentation reads carry the Context7 library ID or the fetched URL and the date; the CodeGraph entries carry tool, scope, timestamp |
| Every absence claim states its kind and evidence | read §11.6 | 1 structural (CodeGraph, scope and timestamp), 4 content (listing / doc-scan / full read, each with scope) |
| File paths and function names confirmed against the codebase | §11.6 first two entries; the planned tree does not exist yet (no `ctxoracle/`), so every path is a creation, and the layout reproduction (§11.4) executed the package/tsconfig/runner shape | pass |
| Question register present; every entry binned, stepped, dispositioned; zero open; sweep count recorded; final pass added zero | read §14 | Q1–Q32 closed; G1–G4 closed into §15; §14.4 records two passes, pass 2 added zero |
| Every bin-2 entry shows the user's answer | §14.2 | none exist; the section says why |
| Every Gaps entry carries attempt evidence | read §15 | G1–G4 each state what was read/fetched/enumerated and what closes it |
| Coverage reconciliation maps every requested element | read §2.3 against spec §11.5 lines 739–777 and the architecture's in-scope list; §12.4 against the spec's AC list (AC-1…AC-25 with sub-items) | every §11.5 element maps to steps; every spec AC has a row, with Phase B/C rows marked deferred by the spec's own phasing (AC-2a-i deny-half, AC-2a-ii, AC-2b, AC-2c skill under-fire, AC-16, AC-25) |
| Every test specification has all five fields; doubles carry kind and justification; no double-interaction-only assertions; no backward-shaped data | script for `File.`/`Verifies.`; grep for doubles; read of §12.3's shared-field preamble | pass after the 22 `Verifies.` additions above; the shared preamble covers Level and Real/doubles only — the fields that are genuinely identical across the replay tier |
| No internal reasoning artifacts, self-corrections, or scratchpad content remain | narration grep over the whole document, then read of the four hits | the four hits cite collapse-log "round 8/9" entries by their titles — citations, not narration. **Found → closed** at assembly: a `SWEEP-RECORD-TBD` placeholder (replaced with the pass record) and one stale `R13` reference (§16, now the coupling-hotspots entry of §13) |
| Every required section present; "if applicable" sections with content present | section list | §1–§16 present; §4 (spec issues) has content (the hooks timeout drift); §6 and §8 carry the explicit "none, because" attestations |
| §10, §11, §12, §14, §15 present, with attestations where empty | read | all present and non-empty |

*Outcome.* Pass, with the six closures above applied before dispatch.

---

## CLAUDE.md dominating rule 2 — the author's collapse test

Rule 2 requires, for every load-bearing decision: the hardest skeptic's question, an answer citing a spec/mission line, and a statement of what it steers the agent toward and that it is a guide informing, never a gate policing. §10A carries this for D-plan-1 through D-plan-19 (19 entries, one per decision — checked by listing the §10A headings against the §10 list).

Two decisions were re-tested here because this session changed them after §10A was written:

- **D-plan-3 (compiled tests, count-guarded runner).** Hardest question: *"You removed the `const enum` argument — does the decision still stand without it?"* Answer: yes; the argument was never load-bearing. The decision rests on the executed facts that `node --test` exits 0 on an empty glob and that type stripping is default only from 22.18.0 (`CHANGELOG_V22.md` lines 1200–1218, §11.4), against the 22.16.0 floor in AD-2. It steers the build toward a red run on a missing test — informing the implementer that a test was dropped; it polices nothing at runtime.
- **Step 6's code list (not a §10 decision, but load-bearing for `status` and `T6-1`).** Hardest question: *"Is an `as const` tuple just a style preference dressed as a correctness fix?"* Answer: no — the executed `TS2475` (§11.4) shows the alternative cannot be enumerated in the same compilation, and AD-17 requires one enumeration of the codes. It steers `status` toward rendering every code from one list, so the reserved codes cannot be silently omitted; informing, not policing.

---

## What this review cannot establish

- It is the author's read. The two independent passes review the whole document with no knowledge of this file's claims.
- The 22.16.0 floor was not executed in this environment (Node 22.22.2); the plan says so (§11.4, Q28) and assigns the floor's execution to CI's matrix entry.
- The reconciliation script parses the document's own conventions; a step that names a file in prose the script does not recognise as a path would not be cross-checked. The `What changes` read is the mitigation, and its coverage is the 40 paragraphs, not the whole of §7.
