# Session 7 reviewer-pattern analysis — Architecture pipeline rework

**Date:** 2026-05-14
**Source:** Direct observation of all 9 fresh-reviewer rounds for `agents/architecture-design-reviewer.md` (final commit `12218fa`).
**Coverage limit:** Session 7 only. The Session 6 retrospective at `docs/plans/2026-05-13-session-6-reviewer-pattern-analysis.md` covered compose-l1; this analysis extends to a profile of a structurally different shape (review-only, no codebase discovery, no document writing).

---

## Trajectory summary

| Session | Profile | Rounds | Passes (3 reviewers/round) | Findings trajectory | Total distinct findings |
|---|---|---|---|---|---|
| 4 | compose-l3 | 5 | 15 | fluctuating | ~30–40 (estimate) |
| 5 | compose-l2 | 5 | 15 | 30 → 20 → 18 → 21 → 25 | ~114 |
| 6 | compose-l1 | 11 | 33 | 25 → 10 → 19 → 3 → 5 → 14 → 5 → 4 → 8 → 4 → 6 | 93 |
| 7 | design-reviewer | 9 | 25 (1 reviewer round 1, 3 reviewers rounds 2–9) | 10 → 26 → 22 → 16 → 20 → 22 → 13 → 14 → 12 | ~155 |

Design-reviewer's total finding count is the highest of the four sessions despite being a structurally simpler profile (review-only, no codebase discovery tools, no document-writing two-pass mechanic). The drivers are different from compose-l1's:

- Design-reviewer accumulated 9 multi-reviewer rounds; compose-l1 had 11. Comparable.
- The first round used a single reviewer (10 findings); rounds 2–9 used three. Each three-reviewer round caught 12–26 distinct findings vs compose-l1's range of 3–25. The medians are higher because the design-reviewer profile is larger (final 377 lines vs compose-l1's 329) and more rule-dense per sentence.
- Pattern-sweep frame was introduced at round 7 after explicit user critique. The trajectory before round 7 averaged 19 findings per round (26, 22, 16, 20, 22); after round 7 it averaged 13 (13, 14, 12). The intervention changed the slope.

**Convergence is non-monotonic, then floors.** Like compose-l1, the trajectory bounced (16 → 20 → 22) before settling. Unlike compose-l1, which had several rounds with 3–5 findings, design-reviewer never dropped below 12. The floor for design-reviewer appears to be 12–14 findings per three-reviewer round — the equilibrium between (a) round-N-1 fix-introduced regressions, (b) pre-existing edge cases that surface late, and (c) wording-precision improvements.

---

## Pattern catalog (Session 7, ~155 distinct findings across 9 rounds)

Estimated category counts. Some findings span multiple categories; the dominant one was used.

### 1. Round-N-1 fix-introduced regressions (~45 findings, 29%)

Fixes applied in round N introduced new defects that round N+1 caught. Approximately 30% of each round's findings traced directly to the previous round's edits. This is roughly 3× higher than the ~10% rate compose-l1 showed.

| Round | Round-N-1 regressions caught | Notable instances |
|---|---|---|
| R2 | 1 | M2 reverted (backticks) — engineering call dispute |
| R3 | 3 | "both" typo in 4(c), `## Status` truncation in 2(d), dependency-role exception incoherent |
| R4 | 5 | Description "ARCH_FACTS_BUNDLE_V2" mislabel, Mode A/Mode B split needed cleanup, Step 4(c) condition (iii) interaction |
| R5 | 4 | spec_requirements forward-reference, Step 5 still missing severity, "arguably fits" inconsistency, prefix-match hyphen compound-word |
| R6 | 5 | Mode A None sentinel collision, slices-map binding missing in Steps 5/7/8, Mode A/B mutual exclusivity unstated, attestation upper-bound mismatch, "arguably" redefinition circular |
| R7 | 4 | Verification-scope strip missed bold markers, "arguably" still ambiguous, Step 9 contiguity sorted-list, code-block exclusion judgment-call |
| R8 | 5 | Failure modes missing wrong-sentinel mirrors (the convergent catch), Verification scope strip token-collision, hook-blame too definitive, prefix-match hyphen compound-word |
| R9 | 3 | Verification scope regex `[-+]?` excluded `*` (round-8 regression), `^# Goal\r?$` case-insensitive ambiguity, output contract wording drift |

Higher regression rate than compose-l1 plausibly because design-reviewer's rule density is higher per sentence — each fix interacts with more adjacent rules. When the round-6 Verification scope exclusion was added to fix the round-5 plant-watering finding, it introduced the bold-marker stripping gap (round 7) which the round-7 fix then introduced the token-collision gap (round 8) which the round-8 fix then introduced the bullet-`*`-excluded gap (round 9).

### 2. Description ↔ Process drift (~30 findings, 19%)

Failure modes section and Process step text drifted apart whenever one was updated without the other. Same dominant pattern as compose-l1 (20%).

| Drift instance | Rounds caught |
|---|---|
| Failure modes entries omit terminal "Stop." (every halt path) | R9 (sweep-caught after 8 rounds) |
| Failure modes entries name "Step 2" not "Step 2(a)/2(b)/2(e)" | R6, R9 |
| Failure modes entries omit state-attestation that Process had | R9 |
| Failure modes section opener drifted to mixed-audience meta-instruction ("for cross-reference") | R6, R7, R8 (each round caught a new instance of the opener's plant-watering issue) |
| Inline Step 2(c) added sentinel checks but Failure modes mirrors not added | R8 (converged across B-S1, B-S2) |
| Round-7 hook-blame diagnostic added 5 cases inline; Failure modes entry stayed brief | R8 |

This pattern persisted because every round's pattern-sweep was narrower than the full file. Round 7 swept plant-watering and "Stop." consistency but missed Failure-modes-mirror updates for the new sentinel halts. Round 8 swept BOM/CRLF on `$`-anchored Greps but missed extending the delimited-prefix delimiter set for the same CRLF concern (round 9 caught that).

### 3. Halt-completeness pattern (~22 findings, 14%)

Reviewers enforced four components + terminal "Stop." at every halt site. Each missed component recurred across rounds.

| Halt component | Rounds caught missing | Resolution |
|---|---|---|
| Terminal "Stop." in inline halts | R3, R7 | Added in R7 sweep; new halts in R8 missed it (R8 caught) |
| Terminal "Stop." in Failure modes entries | R9 (sweep-caught) | Added systematically R9 |
| Step name in activity log (sub-step suffix) | R6, R9 | Inline updated R6, Failure modes updated R9 |
| State attestation at halt point | R9 (single declaration approach taken) | Added once at top of Step 2 covering all sub-step halts |
| Halt path covered in Failure modes section | R4, R8 (multiple halts added without mirrors) | Added incrementally each round |

### 4. Plant-watering violations (~18 findings, 12%)

Sentences not directly addressing the subagent. Three sub-patterns:

| Sub-pattern | Rounds caught |
|---|---|
| Frontmatter description third-person ("Reads", "Surfaces") vs imperative ("Read", "Surface") — oscillating | R1, R6, R8 |
| Mixed-audience navigation/explanation ("for cross-reference", "Use this section to find") | R6, R7, R8 |
| Meta-instruction about document structure ("If wording below contradicts inline...follow Process") | R8 |
| Explanatory comment that names a tool's behavior rather than instructing the subagent | R6 (R-DOC-2 reference removed), R7 ("this records the reasoning the catch-all is supposed to surface" removed) |
| Plan §N references inside the profile body | R5 (§4 pointers removed) |

The frontmatter description bounced for 5 rounds (R4, R6, R7, R8 each wanted a different position). Final decision in R8 was to include `other` and describe the profile's actual behavior, accepting that this diverges from plan §6.6's literal text.

### 5. Cross-call-site drift (~15 findings, 10%)

Same rule needed to be stated at N call sites; fixes updated some but not all. Lower percentage than compose-l1's 25% because design-reviewer has fewer call-site categories — but the pattern still appeared.

| Rule | Required call sites | Rounds caught |
|---|---|---|
| Steps 5/7/8 binding to `slices` map (round-5 declared it in Step 4(a) without Step 5/7/8 references) | 3 — Steps 5 opener, Step 7 opener, Step 8 (declined — Step 8 doesn't use slices, but the Step 4(a) statement was wrong) | R6 (B-S1) |
| Sentinel-presence verification (round-7 added inline, round-8 added Failure modes mirror) | 2 — audit fetch, bundle fetch (any_discrepancy == false branch) | R8 (both caught together) |
| `\r?$` discipline applied to every `$`-anchored Grep | 3+ — `^## Card Slices$`, `^\*\*Level:\*\* L[123]$`, `^# Goal$` fallback | R8 (sweep applied across all three together) |
| CR in delimited-prefix delimiter set (analogous to `\r?$` for `$`-anchored case) | 1 rule, 1 application site, but missed in round-8's CRLF sweep | R9 (C-S1) |
| Sub-step suffix consistency across inline halts AND Failure modes | 6 sub-step halts × 2 surfaces | R6, R9 |

### 6. Cross-platform robustness gaps (~10 findings, 6%)

A category that surfaced late. Reviewer C in round 8 was first to probe Windows-specific behavior systematically. The profile runs on whatever platform Claude Code is invoked from; Windows is common.

| Gap | Round caught |
|---|---|
| Sentinel checks fail on UTF-8 BOM | R8 (C-S1) |
| `$`-anchored Greps fail on CRLF line endings | R8 (C-Critical) |
| Delimited-prefix delimiter set doesn't include `\r` | R9 (C-S1) |
| Step 8 Verification scope regex doesn't handle blockquote prefix | R9 (C-M1, declined — outside compose-output scope) |

Cross-platform issues survived 7 rounds because earlier reviewer prompts didn't probe for them. Adding the explicit platform-walk to reviewer C's round-8 brief surfaced them.

### 7. Pre-existing defects nobody caught for many rounds (~12 findings, 8%)

Defects present in the file from an early round (often round 1) that no reviewer caught until much later. Each survived 3+ rounds × 3 reviewer-instances = 9+ reviewer attempts.

| Defect | First catchable round | Actually caught round | Survival rounds |
|---|---|---|---|
| Step 4(a) parsed only 3 of 8 slice fields; Steps 5/7/8 silently relied on un-parsed data | R1 | R5 (A-M1) | 4 |
| Step 5 missing `summary` and `details` field specifications | R1 | R4 (A-CRIT-1) | 3 |
| Step 7 L2/L3 "names a choice between two or more options" non-mechanical | R3 | R5 (A-M2) | 2 |
| Step 6(b) standard-name extraction unspecified | R3 | R5 (A-M4) | 2 |
| Step 8 deferral Grep matches "deferred" in scope heading | R3 | R5 (A-Min1) | 2 |
| `^# Goal` matches doc title (`# Goal — what...`) | R1 | R5 (C-M1) | 4 |
| Audit sentinel never verified before JSON parse | R1 | R7 (A-S2) | 6 |
| Step 2(e) inline halt missing terminal "Stop." | R1 | R7 (A-m2) | 6 |
| `^F[0-9]+$` admits `F0` and zero-padded | R1 | R8 (C-M2) | 7 |
| Failure modes opener plant-watering ("for cross-reference") | R6 | R7 (A-M1) | 1 |

The Session 6 retrospective's "per-reviewer variance is high; three parallel reviewers per round is load-bearing, not redundant" finding holds. Three reviewers × 9 rounds = 27 reviewer-instances was the cost to find the longest-surviving defects.

### 8. Mechanical-vs-judgment ambiguity (~8 findings, 5%)

Rules that left judgment calls instead of mechanical tests, causing two independent runs to diverge.

| Ambiguity | Round introduced | Round resolved |
|---|---|---|
| "arguably fits" in Step 8.5(b) | R4 | R6 (still ambiguous), R7 (clarification still circular), R8 (replaced with "fits under literal definition") |
| "when in doubt" in code-block exclusion | R5 | R6 (replaced with state-machine algorithm) |
| "exact string match" without case sensitivity | R5 | R7 (made explicit case-sensitive) |
| Step 7 L2/L3 non-trivial-decision criterion | R3 | R5 (changed to "every D# is non-trivial") |
| `other` severity assignment relies on extended-thinking | R4 | Not resolved — inherent to catch-all |

### 9. Description field oscillation (~5 findings, 3%)

A specific drift pattern where reviewers in different rounds had inconsistent preferences. Round 4 wanted `other` in the description; round 6 wanted plan §6.6 alignment (which omits `other`); round 8 wanted `other` back; round 9 wanted plan alignment again.

| Round | Position taken | Reviewer that wanted change |
|---|---|---|
| R1 | Mixed-audience original | M3 caught it |
| R4 | Imperative voice, no `other` | B-Mi-2 wanted audit artifact mentioned |
| R6 | Plan §6.6 aligned, includes `other` parenthetical | A-MOD-1 wanted register fix |
| R7 | Imperative with `other` | — |
| R8 | Plan §6.6 aligned shape, `other` included | A-S1 in round 9 wanted plan alignment without `other` |
| R9 | Same as R8 (decline) | — |

Five rounds bouncing between two defensible positions. Resolution: commit to one, stop oscillating. The bouncing itself is the defect, not which position is chosen.

---

## Themes that matter for future sessions

**1. Fix-introduces-defect rate scales with rule density.** Compose-l1 had ~10% regression rate; design-reviewer hit ~30%. The mechanism: when rules are densely packed (every sentence is a load-bearing instruction), edits to one rule interact with adjacent rules in ways that aren't obvious at edit time. The Verification scope exclusion went through four rewrites across rounds 6–9, each rewrite fixing the previous round's defect and introducing a new one. **For dense rule sections, every edit should be checked against the immediately-adjacent rules, not just against the section being edited.**

**2. Three-reviewer rounds are load-bearing even more clearly than the Session 6 retrospective said.** Several Critical defects (Step 5 missing summary/details, Step 9 missing schema validations, Step 8 deferral `for a future` matches in non-deferral contexts) were caught by a single reviewer in a single round after multiple prior reviewers missed them. The per-reviewer variance compounds: 3 reviewers × 9 rounds = 27 attempts to find the long-tail defects. **Single-reviewer rounds on a profile of this complexity miss most of the long-tail.**

**3. Pattern-sweep frame measurably changes the slope.** Rounds 1–6 averaged 19 findings per round (range 16–26). Rounds 7–9 averaged 13 (range 12–14). The intervention at round 6→7 was: after each fix, sweep the file for other instances of the same pattern, not just the specific call site the reviewer named. **This is the Session 6 retrospective's call-site enumeration recommendation, applied iteratively. It works.**

**4. The trajectory floors at ~12–14 findings, not zero.** Three categories produce findings at a roughly constant rate per round: (a) round-N-1 fix-introduced regressions (~3 per round at 30% rate), (b) pre-existing edge cases that the cumulative reviewer-instance count finally reaches (~3–5 per round, shrinking), (c) wording-precision improvements ("anchored exact match" vs "case-insensitive matching of the literal text") that are inexhaustible. **Continuing rounds past the convergence floor produces wordsmithing, not engineering improvement.**

**5. Cross-platform robustness must be a deliberate reviewer probe.** Seven rounds with three reviewers each (21 reviewer-instances) missed the CRLF and BOM handling gaps. They surfaced only when reviewer C in round 8 was explicitly briefed to probe Windows-specific behavior. **Future profile-authoring sessions should include cross-platform behavior as a default reviewer-prompt scrutiny axis.**

**6. The "oscillating finding" pattern is its own defect.** Five rounds bounced on the frontmatter description's treatment of the `other` category. Each round's reviewer found a defect; each fix was followed by the next round's reviewer wanting it reverted. **When the same finding is flagged in two consecutive rounds with opposing fixes, the defect is the oscillation itself — pick one position and surface the trade-off to the user, don't keep applying the latest reviewer's preference.**

**7. Halt-completeness sweeps are the highest-yield pattern-sweep.** Round 9's halt-completeness sweep (4 findings from one reviewer, all in this category) caught a class of defects that 8 prior rounds had each surfaced one instance of. **Doing the sweep once is cheaper than doing 8 point-fixes.** The components to sweep: terminal "Stop.", step-name-with-sub-letter in activity log, state attestation, Failure modes mirror for every inline halt.

**8. Profile size matters more than profile complexity.** Compose-l1 (329 lines) had 93 findings across 11 rounds. Design-reviewer (377 lines) had ~155 across 9 rounds. The simpler-conceptually profile grew larger because each pattern-sweep miss added explanatory text rather than collapsing it. **When pattern-sweep finds a category-wide issue, prefer consolidating to one declaration over adding the fix at every call site — design-reviewer's "state attestation for all Step 2 halts" declaration at top of Step 2 is the pattern.**

---

## Suggested mechanical checklists derived from these patterns

For future profile-authoring sessions, before submitting for review, run these sweeps in addition to the Session 6 checklists:

**Round-N-1 regression-vulnerability check.** For every edit made in the previous round:
- Identify the immediately-adjacent rules (within the same Step or sub-step)
- Walk a worked example through the edited rule plus each adjacent rule
- Flag any interaction where the edited rule's outcome depends on or contradicts an adjacent rule

**Cross-platform robustness sweep.** Specifically probe:
- `$`-anchored Greps: do they handle CRLF? (use `\r?$`)
- Delimited-prefix delimiter sets: do they include `\r` as end-of-line-equivalent?
- Sentinel checks on artifact content: do they normalize UTF-8 BOM?
- Line-content stripping algorithms: do they handle leading whitespace + bullet + emphasis markers in all combinations?

**Halt-completeness sweep.** For every halt path in the file:
- Step name (with sub-step suffix) named in activity log
- Specific failing condition named in activity log
- State attestation (declared once at top of Step or repeated per halt — pick one approach and apply consistently)
- Terminal "Stop."
- Failure modes section has a mirror entry with the same step name, condition, and Stop.

**Oscillation circuit-breaker.** When a finding flagged by reviewer R in round N is followed by a finding from reviewer R+1 in round N+1 that wants the round-N fix reverted:
- Recognize this is an oscillation, not a defect
- Surface the trade-off to the user
- Pick one position and commit
- Don't apply the round-N+1 reviewer's preference reflexively

**Floor-detection check.** After three consecutive rounds at a similar finding count (within ±3 of each other) with no Critical/Serious fix-introduced regressions in the most recent round:
- The trajectory has hit its convergence floor
- Continuing rounds will catch wordsmithing, not engineering defects
- Surface this to the user explicitly with the trajectory data
- Let the user decide whether the remaining findings are worth more rounds

---

## Open questions for cross-session investigation

If CORE memory becomes available again, worth searching Session 4 and Session 5 records for these specific patterns to validate they're cross-profile and not Session-7-specific:

1. Did compose-l3 (Session 4) and compose-l2 (Session 5) show similar fix-introduces-defect rates? Was the ~10% from compose-l1 typical or low for that pipeline?
2. Did rounds 4–5 of those sessions also show description-field oscillation?
3. What percentage of Session 4/5 findings were cross-platform robustness vs other categories? (If 0%, the cross-platform probe was unique to Session 7's reviewer briefs.)
4. Did Session 4/5 hit a convergence floor at similar finding counts, or did they actually reach zero-finding rounds?

A future cross-profile sweep session could codify the eight new mechanical checks (the four from Session 6 + the four new ones above) as a script that runs against all five architecture-* profiles before any reviewer pass.

---

## Comparison to Session 6 retrospective recommendations

The Session 6 retrospective made five mechanical-checklist recommendations: call-site enumeration, description/process consistency, plant-watering pass, symmetry pass, forward-reference pass.

For Session 7:

| Recommendation | Applied up-front (round 1)? | Re-applied between rounds? | Surfaced as miss in retrospective? |
|---|---|---|---|
| Call-site enumeration | Yes (task 2) | No until round 7 | Yes — round 4 had cross-call-site finding; round 6 had `slices`-map binding miss; round 9 caught Failure modes sub-step suffixes |
| Description/Process consistency | No | Started at round 7 | Yes — pattern persisted through round 8 (Failure modes wrong-sentinel mirrors), partial fix round 9 |
| Plant-watering | Yes (task 4) | Spot-checked each round | Yes — new instances surfaced in rounds 5, 6, 7, 8 (each in a different part of the file) |
| Symmetry pass | Partial | Implicit each round | Yes — Mode A/Mode B split (round 5) created asymmetry between modes that round 6 had to fix |
| Forward-reference pass | Yes (task 2 listed forward references) | No | Yes — round 5's §4 plan pointers were a direct violation of this check |

The mechanical checklists exist but weren't being re-applied between rounds. Round 7's pattern-sweep frame essentially started re-applying them every round; the trajectory dropped as a result. **The recommendation that worked was not "apply the checklists once" but "apply the checklists before submitting every round."**
