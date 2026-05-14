# Session 6 reviewer-pattern analysis — Architecture pipeline rework

**Date:** 2026-05-13
**Source:** Direct observation of all 11 fresh-reviewer rounds for `agents/architecture-compose-l1.md` (commit `542d16f`).
**Coverage limit:** Session 6 only. Sessions 4–5 patterns inferred from CORE memory record at session start; not directly observed in this analysis.

---

## Trajectory summary

| Session | Profile | Rounds | Passes (3 reviewers/round) | Findings trajectory | Total findings |
|---|---|---|---|---|---|
| 4 | compose-l3 | 5 | 15 | fluctuating | ~30–40 (estimate) |
| 5 | compose-l2 | 5 | 15 | 30 → 20 → 18 → 21 → 25 | ~114 |
| 6 | compose-l1 | 11 | 33 | 25 → 10 → 19 → 3 → 5 → 14 → 5 → 4 → 8 → 4 → 6 | 93 |

Compose-l1 took twice as many rounds as compose-l2 or compose-l3. Likely drivers: shorter file (each sentence more load-bearing), single-pass-write contract harder to specify precisely than two-pass, stricter plant-watering enforcement.

**Convergence is non-monotonic.** Round 4 went 25→10→19→3, looked like convergence; round 6 spiked to 14. The bouncing pattern showed up across all three sessions. Round 10's reviewer R10B and round 11's reviewer R10B/R11B each returned 0 findings independently — but their peers in the same round still surfaced 4–6 findings. Single-reviewer rounds would miss the convergence signal.

---

## Pattern catalog (Session 6, 93 findings categorized)

Estimated category counts. Some findings span multiple categories; the dominant one was used.

### 1. Cross-call-site drift (~23 findings, 25%)

Same rule needs to be stated at N call sites; fixes updated some but not all.

| Rule | Required call sites | Round caught |
|---|---|---|
| Source decisions L1 form non-compliance (both forms: bare `Direct from spec` AND literal `R#`/`Q#` placeholder) | 5 — Inline disciplines table, Output contract, Step 6(b), Step 7 Card Slices section, Step 8 gate (b) | R6, R7, R9, R10, R11 (different call sites each round) |
| "Include the file path in the card note" | 3 — Step 7 non-empty-Glob, Step 7 empty-Glob non-parent-directory, Step 7 empty-Glob parent-directory-missing | R9, R10, R11 |
| Halt condition activity log naming "step (Halt condition)" | 2 — JSON-parse branch, level-mismatch branch | R9 (first branch), R10 (second branch) |
| Mid-process classification escalation halt covering all five conditions | 4 — Steps 3, 4, 5, 6 inline halts + Workflow context list + Failure modes entry | R2, R3, R6 |

### 2. Description ↔ Process drift (~19 findings, 20%)

Failure modes section and Process step text drifted apart whenever one was updated without the other.

- **R7** added open-question attribution to mid-process escalation Failure modes entry. **R8** caught that Step 6 Process text still updated only the card note, not the activity log entry.
- **R10** caught Step 10 Process halt text missing "Leave the document in place" while the Failure modes entry had it.
- **R8** caught that Step 6 escalation cited only `R-L2-NEW-CONTRACTS` for new contracts, while Workflow context and Failure modes cited both `R-L2-NEW-CONTRACTS` and `R-L3-CONTRACTS`.
- **R6** caught that Step 4 inline escalation halt was missing while Failure modes claimed it fires there.

### 3. Halt-completeness pattern (~14 findings, 15%)

Reviewers enforced four components + terminal "Stop." Each missed component recurred:

| Component | Rounds caught missing |
|---|---|
| Step name in activity log | R6, R9 (multiple instances), R10, R11 |
| Terminal "Stop." | R11 (level-mismatch Halt condition branch — last halt to be caught) |
| Post-halt disk/artifact state attestation | R3 (Context7 unavailable entry) |
| Card note content specifics (vs generic "write a card note") | R1 (external_libraries halt missing activity log entirely; card note specifics in early rounds) |

### 4. Plant-watering violations (~11 findings, 12%)

Sentences that didn't address the subagent. Three sub-patterns:

| Sub-pattern | Examples caught | Rounds |
|---|---|---|
| Comparative L2/L3 clauses | "at higher rigor levels", "what L2/L3 documents put in", "(replaces L3's X)" — 5 instances in R1 alone | R1 |
| Audit-trail annotations | Commit hashes (`0a8d982`, `74a7518`) and plan §N references added in R8 fix | R9 |
| Third-person declarative explanations | "Operational correctness is preserved because..." snuck in via R8 fix | R11C |
| Orchestrator-directed clauses | "Invoke from /architecture only when verified_level == 1" in frontmatter description | R3 |
| User-directed clauses | "leave the document in place so the orchestrator or user can inspect" | R2 |

### 5. Symmetry breaks introduced by fixes (~9 findings, 10%)

**The most concerning pattern.** Fixes for one finding broke parallel cases that subsequent rounds caught.

| Fix in round | Broke | Caught in round |
|---|---|---|
| R3 added `rules_fired` absent-key check inline at top of its bullet | Left `blast_radius` at end of Step 2 — asymmetric | R6 |
| R7 added "include the file path in the card note" to Step 7 non-empty-Glob branch | Other two Step 7 Write-failure branches still didn't have it | R8, R10, R11 |
| R10 fixed "missing step name in level-mismatch activity log" | Introduced card-note/activity-log conflation ("card note and activity log entry naming ..." as one phrase) | R11 |
| R8 added "On section placement" paragraph to explain Halt condition's document-order position | Contained plant-watering violations (commit hashes, plan refs, third-person explanations) | R9, R11 |
| R9 added literal-`R#` placeholder warning to Step 6(b) and Output contract | Step 7 Card Slices section requirements and Step 8 gate (b) still only named form (a) | R10, R11 |

### 6. Hidden assumptions / forward references (~7 findings, 8%)

| Finding | Round |
|---|---|
| Subagent told to "read the eight classification fields" without specifying downstream use of `expected_card_count_band` | R10 |
| `.upper` mentioned as significant but never used (defect introduced by R10 fix) | R11 |
| Cross-references like "the eight-field schema enumerated in §5" — subagent can't access plan | R1, R11 (residual) |
| References to validation hook rules (R-DOC-7) the subagent can't look up | R3 |
| Step 8 Grep patterns assuming standard R# labeling without adjustment guidance | R1 |

### 7. Operational completeness gaps (~6 findings, 7%)

Whole halt paths missing entirely.

| Missing halt | Round caught | Severity |
|---|---|---|
| Card-count escalation (Step 6 declared L1 implies 1-3 cards but no halt on 4+) | R6 | Serious |
| Step 3, 4, 5 escalation halts (Workflow context said "any step from Step 3 onward" but only Step 6 had inline halt) | R1, R6 | Serious |
| `rules_fired` key absent vs. empty distinction (only `blast_radius` had it originally) | R4 | Serious |
| Step 4 hard-contradiction halt | R2 | Serious |
| Step 4 unmappable-requirement halt (after second-read prerequisite) | R5 | Serious |

### 8. Imprecise heuristics (~3 findings, 3%)

| Issue | Round caught | Resolution |
|---|---|---|
| "10-line proximity" for out-of-scope detection | R6, R8 | R8 replaced with section-membership test |
| Grep patterns without word boundaries | R1, R8 (residual instances) | Added `\b...\b` anchoring |
| "Genuinely required" external library without mechanical test | R5 | Added two-part test |

### 9. Other (~1 finding, 1%)

Single-instance issues that don't fit a category — e.g., Step 9 trap audit re-running only checks (a)+(b) when trap fixes could affect (d) and (e).

---

## Themes that matter for future sessions

**1. Fixes introduce defects at a non-trivial rate.** Approximately 10% of all Session 6 findings (~9 of 93) traced directly to fixes from earlier rounds. R8's "On section placement" paragraph (added to address R8B's structural finding) was the source for 3 subsequent findings across rounds 9 and 11. **Every fix should be self-checked for: (a) does it break a parallel case? (b) does it introduce non-subagent-directed content?**

**2. The trajectory is bouncing, not monotonic.** Compose-l3 (Session 4) fluctuated. Compose-l2 (Session 5) went 30→20→18→21→25. Compose-l1 (Session 6) went 25→10→19→3→5→14→5→4→8→4→6. Plan for the bounces; don't treat a low-finding round as convergence proof.

**3. Per-reviewer variance is high.** R10B returned 0 findings while R10A returned 2 and R10C returned 2 — same file, same round. R11B returned 0 while R11A returned 4. Single-reviewer rounds miss the convergence signal that distinguishes "single reviewer opinion" from "real defect caught by multiple independents." **Three parallel reviewers per round is load-bearing, not redundant.**

**4. The strongest pattern is cross-call-site drift.** ~25% of all findings traced to rules that need to be stated at multiple call sites where I'd update some but not all. The reviewers' job became enumerating call sites and checking each one. **For any rule that has multiple call sites, the author should enumerate them up front (in a comment or checklist) and verify each one before submitting.**

**5. Description-to-process drift is the second-strongest pattern.** ~20% of findings. The Failure modes section is a summary; the Process step text is the operative instruction. They MUST stay in sync. **For every Failure modes change, check the Process step. For every Process step halt change, check Failure modes.**

**6. Compose-l1 was harder than compose-l2/l3.** Twice the rounds (11 vs 5). Possible drivers: shorter file means each sentence more load-bearing; single-pass-write contract has less structural slack than two-pass; the absence of D# decisions and Element 5 means more weight on the slice schema and source-decisions form. **Future shorter profiles should expect more rounds.**

**7. Plant-watering compliance got stricter over rounds.** Round 1 caught comparative L2/L3 clauses. Round 9 caught commit hashes I added in round 8 (subagent can't look them up). Round 11 caught third-person declarative sentences ("Operational correctness is preserved because..."). **Every sentence added to a profile must pass: "Is this an instruction to the subagent? Could the subagent act on it during execution?"**

---

## Suggested mechanical checklists derived from these patterns

For future profile-authoring sessions, before submitting for review:

**Call-site enumeration check.** For every rule that appears at multiple call sites:
- List every call site
- Verify the rule is stated at each one in the canonical form
- If the rule has multiple sub-forms (e.g., "both non-compliance forms"), verify every sub-form at every call site

**Description/Process consistency check.** For every halt path:
- Process step text states: trigger, card note content (with MCP call name), activity log content (with MCP call name, step name, condition), post-halt disk/artifact state, terminal "Stop."
- Failure modes entry mirrors all five
- The two are exact-match consistent on tool names, step names, and content specifics

**Plant-watering pass.** For every sentence in the profile:
- Is the subject the subagent or imperative?
- Does it instruct the subagent to do, check, or treat something a specific way?
- If it explains "why" — is the explanation itself actionable by the subagent, or is it just author-to-reader?

**Symmetry pass.** When fixing a finding, before submitting:
- Are there parallel cases (other halts, other branches, other call sites) that should get the same fix?
- Does the fix introduce a new non-instruction sentence?
- Does the fix break a previously-symmetric pattern (e.g., move one check inline without moving the other)?

**Forward-reference pass.** For every cross-reference:
- Does the reference resolve to content the subagent can access during execution?
- "See §5 of the plan" doesn't resolve unless the subagent has the plan in context.
- "See Step 6(b) below" resolves only if the subagent reads sequentially or has the whole profile in context.

---

## Open questions for cross-session investigation

If CORE memory becomes available again, worth searching Session 4 and Session 5 records for these specific patterns to validate they're cross-profile and not Session-6-specific:

1. Did compose-l3 (Session 4) and compose-l2 (Session 5) have similar cross-call-site drift findings?
2. Did rounds 3–5 of those sessions also show the "fixes introduce defects" pattern at ~10%?
3. What percentage of Session 4/5 findings were plant-watering vs operational completeness vs halt-completeness?
4. Would a static linter checking the canonical patterns (every halt has 5 components, every call site for a rule has the same text, no commit hashes, no plan §N pointers, no third-person explanations) eliminate enough findings to make a real difference in round count?

A future cross-profile sweep session could codify several of these checks as a script that runs against all three compose profiles before any reviewer pass.
