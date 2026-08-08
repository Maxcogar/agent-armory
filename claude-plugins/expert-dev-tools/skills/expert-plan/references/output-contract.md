# Output Contract — Plan Document Sections and Compliance Gates

This reference specifies the plan document's structure and the gates it must pass before delivery. Read it in full before writing the plan document (Step 8) and again at the gates. The section specifications are the contract; the gates are how the contract is checked.

## The sixteen output sections

Write the plan as a structured document with the sections below. Sections marked **(required)** appear in every plan, even when brief. Sections marked **(if applicable)** are omitted only when the content genuinely does not exist — not because they take effort to write.

1. **Goal** *(required)* — what's being built, one paragraph.
2. **Scope** *(required)* — in/out boundaries, where this plan ends, what comes after, and the **coverage reconciliation**: every element of the requested work mapped to implementing step(s) or to a user-approved exclusion (citing its Question register entry). Exclusions without a cited approval are non-compliance.
3. **Standards that govern this plan** *(required)* — the named engineering standards, library documentation, specs, or architecture decisions this plan is written against, with what each governs in this plan. Includes the testing standards when the plan involves tests. This is the registry every step's Source annotation points back to. A plan with no entries here either is not touching anything that has governing standards (rare) or has not done step 3 (common, and non-compliant).
4. **Spec issues** *(if applicable)* — conflicts found during planning between the spec and reality or between the spec and a named standard — each with what was found, the options presented, **the user's resolution**, and where the plan incorporates it. An entry without a resolution is an open bin-2 register item, and the plan is undeliverable.
5. **Files affected** *(required)* — every file that will be created, modified, or deleted, plus their dependents from `codegraph_get_dependents` that may need verification after changes, plus every documentation file from `codegraph_find_related_docs` that must be reviewed.
6. **Foundation corrections** *(if applicable)* — existing problems the plan addresses first, each with the standard the current code violates and why the correction can't be deferred.
7. **Plan** *(required)* — ordered steps. Each step contains: **what changes**, **Source** (spec reference, architecture decision, named standard, or constraint), **why this approach** (for non-trivial steps: the Gate 3 four-part format — decision, authoritative standard, why the standard applies here, what this is NOT and why), **dependencies**, **verification** (pointing to Test specification IDs where tests are the verification), **impact if wrong**. No step contains an option set, an open question, or a choice deferred to the implementer.
8. **Divergences from existing patterns** *(if applicable)* — each place the plan diverges from existing codebase patterns, the standard that justifies the divergence, and the step(s) where the divergence is introduced. Omit this section only when the plan introduces no divergences — not when the planner did not look for any.
9. **Checkpoints** *(required)* — checkpoint placements per Step 10. If the plan has no triggers requiring checkpoints, the section explicitly states that and explains why.
10. **Decisions made during planning** *(required)* — judgment calls the planner made while writing the plan, with reasoning. Includes ambiguity resolutions, trade-off choices, and interpretations of how a standard applies to this situation. A plan with no entries here either involved no real judgment (rare for any non-trivial plan) or the planner is not surfacing their reasoning. **This is the frame-correctness proof of the output contract.**
11. **Verification of factual claims** *(required)* — a numbered list. One entry per factual claim the plan depends on. A factual claim is any statement the plan makes about: file contents, function signatures, type definitions, library behavior, framework defaults, configuration values, what symbols currently exist, what currently breaks, what currently works, what a test currently asserts, what a doc currently says.

    Every entry contains both:

    1. **The claim** — stated as it appears in the plan, with the step number(s) that depend on it.
    2. **The evidence** — exactly one of, with specifics. Search tools (grep, code search, RAG queries, web search) locate; they are never themselves the evidence. The evidence is what was read at the located place:
       - **File read** — `path/to/file.ext:N–M`, with one line describing what was read at that location. Memory of a file read earlier in the session is not a current verification — re-read or cite the read at the time of plan-writing. Where search located the file or region, the search may be noted as the locator; the read is the entry's evidence.
       - **Structural trace** — a CodeGraph result (`codegraph_get_dependents`, `codegraph_get_dependencies`, `codegraph_get_change_impact`, `codegraph_find_symbol_dependents`, `codegraph_get_symbol`, `codegraph_get_path_between`, `codegraph_find_bridges`), admissible only for the structural claim the tool measures: what imports what, who references which symbol, what the blast radius is, how A reaches B, which producer matches which consumer. Claims about what code *contains or does* still require a file read.
       - **Documentation read** — Context7 (library ID, docs section title, library version, date of lookup, behavior confirmed) or a direct fetch of the authoritative page (URL, what the page states, version documented, date). A search snippet, summary, or result listing is not a documentation read.
       - **Test reproduction** — test file path, what was executed, what was observed.
       - **Absence claims** come in two kinds with different evidence. *Structural absence* — "no file imports X," "symbol Y has no references," "this import resolves to nothing" — may cite a calibrated CodeGraph verdict (`codegraph_find_dead_exports`, `codegraph_get_symbol` liveness, `codegraph_find_unreachable`, `codegraph_find_broken_imports`) as evidence, with the scan scope and a current scan (`force: true` if staleness is possible) stated; these verdicts report ambiguity rather than false absence, which is what makes them admissible (note the documented exclusions, e.g. Ruby liveness). *Content absence* — "no function validates X," "nothing sanitizes this input," "no test covers Y" — gets a compound entry: the search that defined the candidate set (pattern and scope stated), the reads of the candidates confirming absence, and the scope covered. If the scope cannot credibly be covered, the claim is a gap, not a finding.

    **Citation identity — the evidence must be reachable by the next reader.** Where a cited artifact can change independently of this plan, the citation carries an immutable identifier, never a path alone: a file inside the artifact under change is cited by path and line range; a file elsewhere in the same repository by path **and commit**; a file outside version control (run transcripts, plugin caches, generated logs) by path and date, with its unpinnable status stated; documentation by library ID or URL with date. A path-and-date citation to a mutable file stops being checkable the moment that file is edited — in a repository with parallel sessions, that can be within hours — and the next reader cannot distinguish "this was never true" from "this was true and the source moved." Empirically: a plan's designated load-bearing claim quoted a sibling project's document accurately, an unrelated session rewrote that document four hours later, and the claim became unverifiable while the plan still rested on it.

    A claim that could not be verified does not appear in the Plan section — it is in the Gaps section as an unresolved item with the attempt evidence and what would be required to verify it. There is no "tentative" path; tentative claims are gaps.

    If this section is empty, the section explicitly states "No factual claims — this plan asserts nothing about current code, library behavior, or external state." For any plan that touches existing code, an empty section is non-compliance.

    **This is the premise-correctness proof of the output contract.**
12. **Test specifications** *(required)* — one specification per test (or per technique-grouped set, per Step 9), each carrying all five fields: behavior verified (traced to spec requirement or step), test level with rationale, the real/double boundary (every double with its taxonomy kind and named justification; real is the default — **and where a double supplies an input the system under test reads, the specification names the production component contractually obliged to supply that input and where the obligation is written**; if no such obligation exists, the test is green over a path that cannot execute), the data source, and what the test must NOT assert plus the condition that makes it fail. Plan-step Verification fields reference these specifications by ID. If the plan genuinely requires no tests, the section states that explicitly with the reason — an attestation the compliance gate checks against the plan's actual content.
13. **Risks** *(required)* — what could go wrong, what's uncertain, what's hardest, what's irreversible, which coupling hotspots are touched.
14. **Question register** *(required)* — every question encountered during planning: the question, the step where it arose, its bin (engineering / user decision / genuine gap), and its closed disposition (the answer with its evidence pointer; the user's decision and where it's incorporated; or the Gaps entry it closed into). Ends with the reconciliation sweep attestation: number of passes performed, confirmation the final pass added zero entries. If genuinely no questions arose, the section states "No questions arose during planning" — an attestation that, for any non-trivial plan, the compliance gate treats as a signal to re-run the sweep. **This is the completeness proof of the output contract.**
15. **Gaps acknowledged** *(required)* — plan decisions that could not be grounded in a named standard, and claims whose verification was attempted and is genuinely blocked — each entry with its resolution-attempt evidence (what was read, fetched, queried, researched) and why resolution is outside the planner's reach. If this section is empty, the section explicitly states "No gaps — every decision in this plan was grounded in a named standard from section 3, and every factual claim was verified per the entries in section 11." Empty without that attestation is non-compliance.
16. **Post-completion** *(required)* — what to verify after all steps are done, and what follow-up work this plan may create. Include an exported-surface check: `codegraph_diff_surface` against the pre-implementation baseline confirms the build's added/removed/kind-changed exported symbols match exactly what the plan's steps specify — any surface change the plan did not call for is an unplanned breaking-change candidate to investigate, not to wave through.

## Sections that restate the step set — known drift sites

Six of the sixteen sections above restate information originating in section 7's steps: section 2's coverage reconciliation (requested element → steps), section 3's standards registry (standard → steps), section 5's files affected (path → steps), section 11's claims (claim → steps), section 12's test IDs (referenced from each step's Verification field), and section 14's register (question → steps). Section 1's Goal sentence and section 13's counts routinely restate them as well.

**None of these is generated.** A plan is prose with no build step, so any step edit can stale any of them, and consistency depends on the author walking every one after every change. Empirically that does not hold: across two review rounds of a single plan, eleven of twenty-three findings were drift in these sections, and a sibling project recorded the same class in ten locations across six rounds without converging.

Therefore:

- **Editing a step re-derives every restating section from the current step set. It never patches them at the lines a review named.** Locating and amending only the mentions of the edited step leaves stale every entry the author did not happen to think about — which is precisely how the class reproduces round after round.
- **A finding in any restating section is a class signal, not an instance.** When a reviewer reports one drifted entry, all of them are re-derived before that finding is reported closed.
- **The enumeration above is itself hand-maintained.** When a section restating step data is added to this contract, add it to this list in the same edit — a surface missing from the list is a surface nothing checks.

This is a limitation of the contract, not of any plan written to it. Closing it requires a machine-readable per-step declaration — files touched, requirement elements covered, test IDs — from which sections 2, 5 and 12 are generated rather than authored. Until that exists, the rules above are a mitigation: they reduce the drift rate, they do not eliminate it, and a plan that reports zero drift findings across several rounds has more likely gone unchecked than gone clean.

## Compliance gates — before delivering

Run all three gates below. The plan is not complete until all three pass.

**Gate A — does the plan enable downstream work:**

- Can an implementer execute this step by step without making architectural decisions on the fly — and without encountering a single open question, unmade choice, or option set anywhere in the document?
- Can a reviewer check a build against this and reach a defensible conclusion about whether each step is done correctly — including whether each test was built to its specification?
- Can the user read this and know what they're getting, what's being corrected along the way, and what was excluded *with their approval*?

**Gate B — is the plan's own compliance auditable.** Each of the following questions must be answerable from the document alone, by pointing to a specific section or annotation. If any answer requires subjective interpretation, the plan has not made its own reasoning visible enough — fix the document before delivering.

- Which named standards govern this plan, and what does each govern? (Output section 3.)
- Where does each non-trivial step come from? (Source annotation on each step in Output section 7.)
- For each non-trivial step, what alternatives were rejected, and why? (Gate 3 part 4 on each step.)
- How was each factual claim the plan depends on verified — by reading what, where? (Output section 11 — every claim has an entry with read-level evidence.)
- Which plan decisions involved judgment calls, and what was the reasoning? (Output section 10.)
- Where does the plan diverge from existing codebase patterns, and what standard justifies the divergence? (Output section 8.)
- What questions arose during planning, and how was each one closed? (Output section 14 — every entry dispositioned, sweep count attested.)
- For each test the plan requires: what behavior does it verify, at what level, with which dependencies real, on what data, and what makes it fail? (Output section 12.)
- What couldn't be grounded in a named standard or verified against external documentation — and what was attempted before concluding that? (Output section 15.)

**Gate C — final checklist:**

- Every step has a **Source** annotation. Steps without one are in the Gaps section, not the Plan section.
- Every non-trivial step has all four Gate 3 parts (decision, standard, why here, what it is NOT and why). Steps with three of four parts are non-compliant.
- No step anywhere in the plan presents alternatives to the implementer, defers a choice to implementation time, or contains an unanswered question. Zero tolerance — one deferred decision fails the gate.
- Every factual claim asserted in any plan step has a corresponding entry in Output section 11. The two are reconciled — claims without entries are non-compliance.
- Every entry in Output section 11 carries read-level evidence: a file read with path and line range, a structural trace from CodeGraph for a structural claim, a documentation read (Context7 with library ID/section/version/date, or fetched URL with content and date), or a test reproduction. An entry whose only evidence is a search result — a grep count, a RAG hit, a search snippet — is non-compliance.
- Every absence claim states its kind and carries the matching evidence: structural absence cites a calibrated CodeGraph verdict with scan scope and currency; content absence ("no function validates X") states the search that defined the candidate set, the reads that confirmed absence at the candidates, and the scope covered. Search-only content-absence claims are non-compliance.
- File paths and function names are confirmed against the current codebase, not assumed.
- The Question register (Output section 14) is present; every entry has a bin, the step where it arose, and a closed disposition; zero entries are open; the sweep pass count is recorded and the final pass added zero entries.
- Every bin-2 entry shows the user's answer and where the plan incorporates it. No bin-2 entry is "noted" without an answer.
- Every Gaps entry (Output section 15) carries resolution-attempt evidence. Entries without an attempt are non-compliance.
- The Scope section's coverage reconciliation maps every element of the requested work to step(s) or to a user-approved exclusion citing its register entry. Unmapped elements are non-compliance.
- Every test specification (Output section 12) has all five fields. Any double carries its taxonomy kind and named justification; any test whose only assertions target double interactions is non-compliance; any data source shaped backward from assertions is non-compliance; and any double that supplies an input the system under test reads names the production component obliged to supply it — a double standing in for an obligation that does not exist is non-compliance.
- Every claim in Output section 11 that cites an artifact outside the work under change carries an immutable identifier — commit for an in-repository file, date plus a stated unpinnable status for anything outside version control, library ID or URL plus date for documentation. Path-only citation of a mutable artifact is non-compliance.
- The restating sections (2, 3, 5, 11, 12, 14, plus section 1's Goal and section 13's counts) were re-derived from the current step set after the last step edit, not patched. A plan whose step set changed after these sections were last written has not satisfied this item.
- No internal reasoning artifacts, self-corrections, or scratchpad content remain in the document.
- Every required output section is present. Every "if applicable" section that has content is present.
- Output sections 10, 11, 12, 14, and 15 are all present. Empty sections carry the explicit attestation specified in their definitions; bare empty sections are non-compliance.

If any item in Gate A, B, or C fails, the plan does not get delivered. Fix it.
