# Audit Swarm — Corrections Changelog

Corrections applied to the audit-swarm system per the Expert Standard evaluation. This document is both a summary of changes and my after output contract for the corrections.

---

## Priority 1 — Synthesizer premise-axis gap (closes: Partially integrated → Integrated on the synthesizer)

**Files modified:** `synthesizer.md`

**What changed:**

1. **Added a re-verification step** as process step 2 (shifting original steps 2–6 down to 3–7). The new step requires the synthesizer to re-derive the factual premise of any finding before promoting it to Critical Issues in the consolidated report. Explicit rationale included in the step text — cites the prior-artifact-replication rule. When re-verification isn't possible, the step requires demotion to Tentative with the verification gap stated.

2. **Added `Verified` column** to the Critical Issues table in the output format. The table header is now `| ID | Title | Domain | Standard | Verified |`. The narrative preceding the table now states that the Verified column carries forward the premise-axis evidence from the underlying auditor, or reflects the re-verification done at synthesis.

3. **Added verification requirement to cross-cutting patterns.** The pattern output format now includes a `**Verified across**` field requiring the synthesizer to state how many instances were verified and by what method (grep with query and result count, spot-check Reads at file:line). A cross-cutting claim of "pattern appears across the codebase" without counted instances is now structurally flagged.

4. **Updated the deduplication step** to preserve the Verified field from whichever auditor performed the more thorough verification when merging.

**Standard governing this change:** `expert-standard-eval-SKILL.md` criterion 7 (output contract makes compliance verifiable on both axes — CHECK tool requirements).

**What this is NOT:** This is not turning the synthesizer into an auditor. The synthesizer still consumes auditor output; it now carries the verification evidence forward structurally and re-verifies only what it promotes to priority-1. Full re-verification of every finding would duplicate the auditor work; the targeted re-verification of promoted findings catches the most consequential premise errors without blowing up scope.

---

## Priority 2 — Prior-artifact replication risk from CORE to auditors (closes the gap identified in Criterion 5 and Criterion 1)

**Files modified:** `audit-swarm.md`

**What changed:**

1. **Rewrote the narrative** in §2 (Search CORE Memory) that described how past findings should be used. The original framing — `"Past decisions prevent subagents from contradicting established architectural choices or repeating previously-identified issues"` — treated prior findings as facts to respect. The new framing treats them as *candidate claims* that require re-derivation from current source before they can be treated as findings or exclusions. Rationale explicitly references the Expert Standard's prior-artifact-replication rule.

2. **Added an explicit treatment instruction** inside the shared context block preamble that every subagent sees. The "Relevant Past Decisions (from CORE)" section now carries a `**Treatment**:` line that makes the candidate-claim rule visible at the exact point a subagent reads the context — not buried in orchestrator-level prose the subagent may not see.

**Standard governing this change:** `expert-standard-SKILL.md` — "*A finding from an earlier review gets imported by reference instead of re-verified. Same failure, different source document.*" Plus `expert-standard-builder-SKILL.md` — "*Silent pattern replication... also covers importing a claim, approach, or finding from a handoff document, prior plan, earlier review pass, or memory summary without re-deriving it from source.*"

**What this is NOT:** This is not telling subagents to ignore CORE context. CORE context is still consumed — it just gets treated as leads to investigate rather than facts to build on.

---

## Priority 3 — Enforcement-language recalibration (closes the anti-pattern identified in Criterion 2 and Criterion 8)

**Files modified:** All 7 auditors (security, error-handling, validation, performance, architecture, production-readiness, test-coverage).

**What changed:**

Removed the following lines from Critical Rules sections wherever they appeared:

- `**NO "GOOD ENOUGH"** — Production code with real users = zero compromises` (was in 3 auditors: architecture, performance, production-readiness)
- `**NO SHORTCUTS IN PRODUCTION CODE** — Every line must be production-ready` (was in all 7)
- `**VERIFY EVERYTHING** — Check your own findings for completeness and accuracy` (was in all 7)
- `**SECURITY IS NON-NEGOTIABLE** — Every vulnerability must be identified` (security only)

**Kept (functional directives, not rhetoric):**

- `**ULTRATHINK**` in all 7 — functional Claude Code trigger keyword for extended thinking budget. My original evaluation grouped this with rhetoric; on reflection, ULTRATHINK changes behavior rather than just changing tone, so it stays.
- `**ASSUME HOSTILE INPUT**` in security and validation — specific domain directive that changes how the auditor approaches input boundaries. Not generic "take this seriously" rhetoric.
- `**FAIL LOUDLY, NOT SILENTLY**` in error handling — specific domain directive with a concrete failure mode named. Not generic rhetoric.

**Standard governing this change:**
- `expert-standard-builder-SKILL.md` — "*Don't use heavy-handed enforcement language. 'ALWAYS evaluate against standards' and 'NEVER state unverified claims' are less effective than explaining why pattern matching fails and what to do instead.*"
- `expert-standard-SKILL.md` "What This Is Not" section — "*This isn't perfectionism. Prototypes cut corners. MVPs defer optimization. Quick fixes exist.*" The `NO "GOOD ENOUGH" — zero compromises` framing directly contradicted this foundational carve-out.

**What this is NOT:** This is not loosening the auditors' rigor. The rigor is enforced structurally — by the Output Format's required Standard and Verified fields, by the Final Verification checklist, by the domain-specific "How You Think" sections teaching the reasoning. The removed lines were redundant with the structural enforcement and contradictory with the foundational skill. The auditors' rejection criteria in the Absolute Standards sections (e.g., "You MUST REJECT code that has any security vulnerability") are unchanged — those are scope definitions, not rhetoric.

---

## Priority 4 — Summary-section standard-naming (closes the unnamed-approval gap in Criterion 5)

**Files modified:** All 7 auditors.

**What changed:**

The output format's `## Summary` placeholder was updated in every auditor to require naming the specific standard(s) the posture assessment is evaluated against. Before/after examples:

| Auditor | Before | After |
|---|---|---|
| Security | "overall security posture by OWASP standards" | "overall security posture evaluated against the specific standard(s) applied — e.g., OWASP Top 10, CWE Top 25... Name the standard..." |
| Error handling | "overall error handling posture" | "overall error handling posture evaluated against named standard(s) — e.g., structured logging requirement, Node.js unhandled rejection guidance..." |
| Validation | "overall validation posture" | "...named standard(s) — e.g., runtime boundary validation, TypeScript strict mode, OWASP input validation cheat sheet..." |
| Performance | "overall performance posture and scalability risk level" | "...named standard(s) — e.g., N+1 prevention, event loop non-blocking requirement, database indexing practice..." |
| Architecture | "overall architectural quality and maintainability assessment" | "...named standard(s) — e.g., SOLID principles, Clean Architecture layer separation, Dependency Inversion..." |
| Production readiness | "overall production readiness assessment" | "...named standard(s) — e.g., 12-Factor App, structured logging requirement, graceful shutdown, SRE golden signals..." |
| Test coverage | "overall test coverage and documentation assessment" | "...named standard(s) — e.g., critical path test coverage requirement, API documentation completeness (OpenAPI)..." |

Each updated placeholder includes domain-appropriate example standards AND an explicit "Name the standard..." instruction — so the auditor can't write a vague "posture is reasonable" summary that would satisfy the format while being an unnamed approval.

**Standard governing this change:** `expert-standard-SKILL.md` failure signal #1: "*Unnamed approvals. A positive quality judgment with no standard behind it... If the approval would sound the same regardless of code quality, it's not a real assessment.*"

**What this is NOT:** This does not require the Summary to enumerate every standard used in the detailed findings. The Standard field on each finding already catches that. This closes the specific loophole where the Summary itself — the first thing a reader sees — could contain an unnamed approval.

---

## Priority 5 — Rigor mode documented (resolves the scope-of-rigor ambiguity from Criterion 6)

**Files modified:** `audit-swarm.md`

**What changed:**

Added a `## Rigor Mode` section to the top of the orchestrator, immediately after `## Arguments`. The section documents that the swarm runs in full-rigor mode by design, that invocation is itself the opt-in, and that the swarm does not self-adjust its rigor based on project stage. For prototype code, the guidance is either (a) don't run the swarm, or (b) treat its output as a list of what would need to be addressed before production rather than as a blocking gate.

**Standard governing this change:** Neither option of my evaluation's Priority 5 is inherently wrong — this was a design decision the original artifact had left implicit. The governing standard is *coherence with the project's own foundational position*: the expert-standard skill's non-perfectionism carve-out exists; the swarm as invoked doesn't contradict it because invocation is opt-in to full rigor; that's now stated explicitly instead of being inferred.

**What this is NOT:** This does not add a "quick mode" or "prototype mode" to the swarm. That was one of the options; I took the other — preserving the current behavior and making the reasoning explicit. A quick mode could be added later if there's demand, but it would be a new feature, not a correction.

---

## My After Contract

**How I made decisions (frame axis).**

- Priority 1's specific mechanism (Verified column + re-verification step for promoted findings + per-pattern verification counting) was derived from `expert-standard-eval-SKILL.md` criterion 7 — the CHECK tool output contract requirements. The column was chosen over alternatives (separate verification appendix, flag on each finding) because it aligns with how the Standard column already works in the table — the reader sees both axes of evidence at the same point in the document.

- Priority 3's distinction between "functional directive" and "rhetoric" was governed by the builder guide's explicit warning against heavy-handed enforcement language combined with the foundational skill's non-perfectionism carve-out. I applied the test: does removing this line change anything the tool actually does? ULTRATHINK yes (probably — functional trigger). ASSUME HOSTILE INPUT yes (directive that shifts the auditor's frame). FAIL LOUDLY yes (directive that defines the failure mode). NO GOOD ENOUGH no (rhetoric). VERIFY EVERYTHING no (redundant with structural enforcement).

- Priority 4's choice to update the Summary placeholder rather than add a separate "standards used" field was governed by minimalism — the Summary is the surface where the unnamed-approval risk sits, so the fix lives there rather than being added as a new surface.

**How I verified premises (premise axis).**

- Before writing each str_replace, I re-read the section from context (the files were fully loaded before editing).
- After the edits, I ran grep across all 9 files to verify: (a) every rhetoric pattern from Priority 3 is gone from every file, (b) every functional directive that should stay is still present, (c) the synthesizer Verified column appears in the expected table header, (d) the orchestrator's candidate-claims framing appears in both the §2 narrative and the shared context block preamble, (e) the Rigor Mode section is present, (f) every Summary section now references named standards or example standards. Grep output is visible in the conversation record.
- Numbers in this changelog (`"3 auditors contained NO GOOD ENOUGH"`, etc.) reflect grep verification from the pre-edit evaluation, not estimates.

**Flag on my own ULTRATHINK decision.**

My original evaluation recommended removing ULTRATHINK. In this correction pass I kept it, based on my recollection that ULTRATHINK is a Claude Code trigger keyword for extended thinking. I did not Context7-verify this against current Anthropic docs. If ULTRATHINK is not in fact functional and is just a word in the prompt, then this correction pass kept rhetoric I said should be removed — and a future pass should strip it. The fact that I noticed the issue and flagged it in the response is good; the fact that I resolved it by memory rather than verification is exactly the premise-axis failure mode. Documenting it here so it's auditable.

**Gaps in this correction pass.**

- I did not test-run the modified swarm against an actual codebase. The changes are to the prompt structure; their behavioral effect on real audits is not verified by this correction pass.
- I did not re-evaluate the full swarm against the Expert Standard Eval after applying corrections. I verified the specific changes landed; a fresh Expert Standard Eval pass on the modified swarm is warranted to confirm the verdict moves to Integrated on the synthesizer and that no new gaps were introduced by the changes themselves.
- The Absolute Standards sections in some auditors still contain binary framing (e.g., performance: "*You DO NOT accept performance issues as 'acceptable.' Performance is either adequate for production load or it isn't.*") that has the same perfectionism pattern as the removed Critical Rules. I did not touch these because my original evaluation didn't call them out, and expanding scope mid-correction would be its own failure mode. If you want a second pass to clean these up, say so.
- I did not add output-contract requirements around positive assessments beyond the Summary. The "What's Actually Good" pattern from `/expert-review` could potentially be added to audit outputs but wasn't in my evaluation's recommendations and isn't in this correction pass.

**Self-grading problem.**

This is a self-graded correction pass. The agent that wrote the evaluation applied the corrections from that evaluation. Blind spots in the evaluation likely translated into blind spots in the corrections. A fresh Expert Standard Eval pass on the modified swarm — in a new session or by a separate agent — would catch what this self-correction missed. That independent pass is warranted before treating the corrections as complete.
