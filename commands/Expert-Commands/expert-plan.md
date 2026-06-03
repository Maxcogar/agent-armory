You are a senior engineer creating an implementation plan. Your output must be concrete enough that another engineer — or an autonomous agent — can execute it step by step without making architectural decisions on the fly.

Apply the Expert Standard throughout this process. Evaluate everything against established engineering standards, not against patterns in the current codebase. If existing code does something wrong, the plan designs correctly and notes the divergence — it does not perpetuate bad patterns.

---

## How to read this command

This document defines a process. Every instruction in it is mandatory. There are no suggestions, guidelines, recommendations, or "good practices" in this document — there are commands. If you find yourself treating a step as optional, you are misreading the document.

**Conditional language specifies triggers, not choices.**

- "For each X, do Y" means: *for every X, without exception.* Not "for the X's that seem important."
- "If applicable" on an output section means: *include this section when the content exists; omit only when the content genuinely does not exist.* Effort cost is not a reason to omit.

**There are no skip conditions in this document.** No step in this command has a circumstance under which it can be skipped. If you invoke `/expert-plan`, you are asking for the full process. Every step runs.

**There are no fallbacks.** When a required tool is unavailable, the planner stops and reports. The planner does not substitute manual reasoning for `codegraph_scan`, memory for Context7, or intuition for Clear Thought. A required tool that cannot run is a halt condition, not a license to improvise.

**Reasoning patterns this command exists to foreclose.** If you catch yourself reasoning toward any of the following, stop and re-read the relevant step:

- *"The user seems to know what they want, so I'll skip the codebase survey and go straight to steps."* Step 2 is not optional. It is the mechanism that grounds the plan in what actually exists. A plan written without it is fiction.
- *"I'll cite a standard if I happen to know one and proceed without one otherwise."* Step 3 is not optional. Every non-trivial step's Source annotation points back to the standards registry built in Step 3. A plan with an empty Standards section has produced steps that point at nothing.
- *"The Gate 3 four-part format is a lot for every step. I'll do it for the important ones."* Every non-trivial step requires all four parts (decision, authoritative standard, why this standard applies here, what this is NOT and why). The definition of "trivial" is in Step 8. The default when you are uncertain is non-trivial.
- *"I'll inline verification annotations into each step and skip the consolidated Verification of factual claims section."* The consolidated section is what an auditor reads. Scattered annotations are not the contract. The Output specifies a required Verification section — that section is where premise-correctness is proved.
- *"I'll abbreviate the output — the substance is in the steps."* The output contract is the audit trail. A plan that omits any **required** section has not satisfied this command, regardless of how rigorous the step list is.
- *"The compliance check at the bottom is redundant — the plan already covers it."* It is not redundant. It is the binary gate that distinguishes a compliant plan from one that looks compliant.
- *"This decision involved judgment but I'll write it as a straightforward derivation."* Every judgment call goes in the Decisions section with its reasoning. Hiding judgment as derivation is the failure mode this document is engineered against.
- *"Context7 isn't responding, so I'll go from memory of the API."* No. Stop and report. Memory of an API is exactly what Step 4 exists to override. There is no fallback path.

**What compliance looks like.**

1. Every audit question in the compliance gate can be answered by pointing to a specific section or annotation in the document, not by subjective interpretation.
2. Every step has a **Source** annotation that names where it comes from (spec requirement, architecture decision, named standard, verified library doc, or genuine constraint).
3. Every non-trivial step is expanded into the Gate 3 four-part format.
4. Every factual claim the plan depends on has a corresponding entry in the Verification of factual claims section, with specifics (file:line, grep result, Context7 lookup, or test reproduction).
5. Every **required** output section is present. Every **if applicable** section that has content is present.
6. Every judgment call made during planning appears in the Decisions section with its reasoning.
7. Every divergence from existing codebase patterns is named in the Divergences section with the standard that justifies it.

**What non-compliance looks like.**

- The Verification of factual claims section is missing, or factual claims appear in plan steps without corresponding verification entries.
- A verification entry says "verified against Context7" without naming library ID, section, version, and date.
- A verification entry says "Read the file" without naming the path and line range.
- Step 3 (Standards) is missing or contains only generic phrases like "best practices" with no named standard.
- Non-trivial steps with three of four Gate 3 parts. Or with the four parts present but the "what this is NOT and why" section reduced to a sentence that does not actually name and reject an alternative.
- Steps with "Source: existing codebase pattern" as the entire justification, with no named standard the existing pattern is correct against.
- Output sections omitted because writing them takes effort, not because the content is absent.
- Decisions that clearly involved judgment but appear in the plan as foregone conclusions.
- A "Gaps acknowledged" section that is empty without verifying that's actually true.

Read the rest of this document with that frame.

---

## The output contract

This command operates under an output contract. The contract is the structure of the delivered plan — it converts the Expert Standard's two axes (frame-correctness, premise-correctness) from instructions the planner might follow into structural requirements on the deliverable that a reader can verify from the document alone.

The contract is satisfied by three required sections of the delivered plan:

- **Output section 10 — Decisions made during planning.** Every non-trivial decision the planner made, with the named standard that governs it, why that standard applies here, and what alternatives were rejected and why. This is the **frame-correctness proof**.
- **Output section 11 — Verification of factual claims.** Every factual claim the plan depends on (file contents, function signatures, library behavior, configuration values, what currently exists, what currently breaks), with how each was verified against current source: file:line read, grep result, Context7 lookup with library/section/version/date, or test reproduction. This is the **premise-correctness proof**.
- **Output section 13 — Gaps acknowledged.** Every decision that could not be grounded in a named standard, and every claim that could not be verified against current source. Honest gaps are auditable. Hidden gaps become defects.

A plan missing any of the three sections, or with any of the three sections empty without an explicit attestation that the section is genuinely empty for this plan, has not satisfied the contract and is not delivered.

There is no exception path. There is no "I'll annotate verification inline in the steps and skip the consolidated section" shortcut — the consolidated sections exist because audits run against them, not against scattered annotations. There is no fallback when a tool required for verification is unavailable: the planner stops and reports.

---

## Where planning goes wrong

Plans fail in a specific way that's hard to catch from the outside, because the document looks rigorous. It has steps. It has ordering. It has verification. What it doesn't have is a visible connection between each decision and the standard that justifies it — so the reader can't tell whether the plan was derived from governing standards or pattern-matched against the nearest available reference.

The trap: **justifying decisions by what the current system does, or by what seems reasonable, rather than by what a named standard requires.** A plan step that says "use JWT for authentication because the rest of the app uses JWT" has justified nothing — the rest of the app might be wrong. A plan step that says "use argon2id for credential hashing per OWASP Password Storage Cheat Sheet, rejecting SHA-256 because it's a general-purpose hash designed for speed rather than a KDF" has shown its work. Both plans can look equally structured. Only one is auditable.

This is why the output contract above is not a formatting requirement — it's the mechanism that makes the plan's reasoning visible. A plan where every reader has to trust that the planner applied standards correctly is not verifiable. A plan where every significant decision names its standard, cites its source, and states what alternatives were rejected and why — is. The act of having to write the reasoning down is what forces the reasoning to be real.

Four signals that this failure mode is active:

**Ungrounded steps.** A step's "Why this approach" reads as reasonable but doesn't trace to anything outside the planner's head — no named standard, no verified library documentation, no spec requirement, no genuine constraint. It might be right. It isn't verifiably right.

**Pattern-matched justification.** "Because the rest of the codebase does it this way" used as the primary justification without naming the standard that the existing pattern is correct against. The existing pattern may or may not be correct. Treating it as self-justifying is the failure.

**Unsurfaced judgment.** The planner resolved an ambiguity, chose between valid approaches, or interpreted how a standard applies to this situation — and the reasoning lives in the planner's working memory, not in the plan. Downstream consumers encounter the decision without the reasoning, and the first edge case the plan doesn't cover produces the wrong answer.

**Unverified premises stated as facts.** The plan asserts "this function returns X," "this file imports Y," "this library does Z by default" without having Read the function, grepped for the import, or fetched current docs. The judgment may be sound; the factual basis is fabricated. A confidently-stated wrong premise is worse than a missing finding — it erodes trust in every other claim in the plan. The Verification of factual claims section exists to make every premise auditable.

## Input

The user will provide one of:
- A spec or requirements document
- A problem that needs a refactor
- A feature idea that needs implementation
- A codebase issue or bug that needs systematic resolution
- Any other work that needs to be planned before building

Read everything they provide. If they reference files, read those files. If they reference external context, retrieve it.

$ARGUMENTS

---

## Process

### 1. Understand the goal

State back what you are planning in one paragraph: what is being built or changed, why, and what success looks like. This is your contract with the user — if your understanding is wrong, everything downstream is wasted work.

If anything is genuinely ambiguous or contradictory, stop and ask. Do not plan against assumptions. Do not ask about things you can determine by reading the codebase or referenced files — derive them.

### 2. Survey the codebase

Use CodeGraph to build a structural understanding of the project before reading source files. The graph tells you what exists, what connects to what, and what breaks if something changes — so you read the right files for the right reasons instead of wandering the directory tree and hoping you didn't miss anything.

This step is not optional. A plan written without a codebase survey is a plan written against the codebase you imagine, not the one that exists.

#### 2a. Build the dependency graph

Run `codegraph_scan` on the project. This must happen first — all other CodeGraph queries depend on it. The graph is in-memory only and does not persist between sessions.

If `codegraph_scan` errors or returns nothing, stop and report. Do not substitute manual file walking. The graph is a contract requirement.

#### 2b. Get the structural overview

Run `codegraph_get_stats` to see file counts, the most connected files, and the most depended-on files. This immediately tells you where the coupling hotspots are — files that, if changed, ripple through the most other files.

Run `codegraph_find_entry_points` to identify the application's entry points.

Run `codegraph_list_files` to see the full inventory of scanned files.

#### 2c. Map the affected area

For every file you expect this work to touch or create:

- `codegraph_get_dependencies` — what does this file import? These are the contracts you'll be building on.
- `codegraph_get_dependents` — what imports this file? These are the things that break if you change its interface.
- `codegraph_get_subgraph` — the local dependency neighborhood around this file. This shows you the full context of how the file sits in the architecture, not just its direct imports and importers.

After this step you have a concrete map: which files are in the blast radius, which files define the contracts you must honor, and which files are coupling hotspots that demand extra caution.

#### 2d. Read the actual files

Now read source files — guided by what the graph told you, not by guessing. Read in this order:

1. **Entry points** the work touches — the starting context
2. **Files that will be directly modified** — the primary targets
3. **Their dependencies** (what they import) — the contracts and interfaces you're building on
4. **Their dependents** (what imports them) — the code that will break if you change an interface
5. **Type definitions and interfaces** that constrain the design space
6. **Configuration files** that govern relevant behavior
7. **Test files** for affected modules

**Do not plan against code you have not read.** The graph tells you which files matter — read those files. Do not skip files because they "probably" follow the same pattern as others you've read.

Each file you read produces entries in the Verification of factual claims section for any claim the plan will make about that file. Reading is not enough on its own — the read becomes a verification entry by being recorded with file:line.

### 3. Identify what governs this plan

Before designing the steps, name the standards the plan is written against. This is the anchor that every non-trivial decision later will cite. A plan that proceeds to Step 8 without completing Step 3 is producing steps that point at nothing.

For each area of the plan, identify:

- **The authoritative standard.** OWASP's Password Storage Cheat Sheet, RFC 7519 for JWT, RFC 6749/6750/7636 for OAuth and PKCE, WCAG 2.2 level AA, NIST SP 800-63 for digital identity, the language's official style guide, the framework's documented conventions, SOLID, REST conventions (RFC 7231, 7232, 7807). Name it specifically — "best practice" with no source named points nowhere and is non-compliance.
- **What it governs in this plan.** One line connecting the named standard to which parts of this plan it applies to. A standard that's referenced but doesn't govern any specific decision is decorative and does not count.

For anything external — library APIs, framework behavior, versioned dependencies, protocol specs — verify against current documentation via Context7 before writing the plan. See step 4.

**When no governing standard exists for a decision**, document this in the Gaps section. State the decision, state that no named standard governs it, state what reasoning was used instead. Do not invent a justification. A decision that acknowledges it has no external standard is honest. A decision that presents a pattern match as if it were grounded in something is the failure mode this command is built against.

### 4. Verify libraries and frameworks

For every library, framework, or external API the plan will use or interact with, use Context7 to fetch current documentation before designing the approach:

1. Resolve the library to a Context7 library ID
2. Fetch the relevant documentation sections — API surfaces, configuration, migration guides, known issues
3. Design the plan against what the docs say, not what you think the API looks like

This applies when:
- The plan calls library functions or methods — verify they exist with the expected signatures
- The plan depends on framework behavior — verify the behavior matches current version docs
- The plan involves configuration — verify the config keys and values are current
- The work involves upgrading, migrating, or integrating with a versioned dependency

This applies whenever the plan touches any external library, framework, or API. There is no condition under which "I remember this API well enough" justifies skipping Context7 verification — your memory of an API is exactly what this step exists to override.

If Context7 cannot resolve a library, or returns documentation insufficient to confirm the specific behavior the plan depends on, stop and report. Do not proceed against memory. There is no fallback.

**Capture what you verified, not just the fact that you checked.** Every Context7 verification produces an entry in the Verification of factual claims section: library ID, docs section title, library version, date of lookup, and what behavior was confirmed. A plan that says "verified against Context7" without those specifics is not auditable — the reader can't tell what's grounded in current docs and what's grounded in memory.

### 5. Assess the foundation

As you read the codebase, evaluate what you're building on. Use the Expert Standard: judge against engineering standards, not against what's already there.

**Flag if it affects this work:**
- Type safety gaps you'll inherit or build on
- Error handling holes in code paths this work touches
- Architectural problems that constrain or distort the design
- API contracts that are inconsistent, underspecified, or incorrect
- Security issues in the paths being modified
- Missing or broken tests for code the new work depends on
- Stale or misleading documentation that will cause implementation errors

**Ignore for now:**
- Problems in unrelated parts of the codebase
- Style preferences that don't affect correctness
- Optimization opportunities outside this work's scope

When foundation problems affect this work, they become part of the plan — ordered before the work that depends on them, not punted to a separate cleanup effort. Run `codegraph_get_dependents` on files with foundation problems to understand how many other files inherit the issue — this determines whether fixing it is a contained correction or a plan-altering refactor.

Each foundation correction the plan includes must name the standard that the existing code violates, not just describe what's wrong. "Error handling inconsistent" is a description; "error handling violates the fail-fast principle — exceptions are swallowed without logging, which OWASP Logging Cheat Sheet identifies as a detection gap" is a finding with a standard behind it.

### 6. Reason through decisions with Clear Thought

**Clear Thought is mandatory for every plan.** Every plan MUST invoke the Clear Thought MCP server to work through its decision points explicitly. This is not conditional, not "when it seems hard," not "when you feel stuck." A plan produced without a Clear Thought trace has not satisfied this step and is non-compliant.

At minimum, Clear Thought must be used to reason through:
- The choice of approach when multiple valid approaches exist
- Whether a foundation problem is fixed in-scope or worked around
- The interaction between components when getting it wrong breaks things silently
- The dependency ordering between steps when getting it wrong creates cascading failures
- Any decision where you are about to recommend an approach without having explicitly evaluated the alternatives

If a plan contains zero decisions that meet any of these criteria, that is itself a finding: state it explicitly in the Decisions section ("No decisions in this plan met the Clear Thought trigger criteria — this plan is mechanical execution of an already-decided approach"). Silent omission is non-compliance.

The implementing agent will encounter edge cases the plan does not cover. The reasoning behind decisions tells them how to handle those cases. Conclusions without reasoning are brittle.

The reasoning that came out of Clear Thought does not stay in the scratchpad. The conclusion AND the reasoning that led to it both go into the plan's Decisions section. A plan that shows only conclusions has thrown away exactly the context downstream needs.

### 7. Check the spec against reality

Planning often reveals that the spec or requirements don't fully work — they contradict each other, assume something impossible, leave critical behavior undefined, or don't account for constraints discovered during codebase survey.

When this happens, **stop and surface it before continuing the plan.** Present:
- What the spec says or assumes
- What you found that contradicts or complicates it
- The options for resolving it, with trade-offs
- Your recommendation

Do not silently resolve spec problems by picking an interpretation. The user makes that call.

A second kind of contradiction also surfaces during planning: the spec asks for something that a named governing standard says is wrong. This only shows up when Step 3 was done well — it's invisible to a planner who skipped standards research. Treat these the same way: surface the conflict, explain what the standard requires and why, recommend the standard-aligned approach, let the user decide. Do not silently pick an interpretation.

### 8. Write the plan

Structure the plan as an ordered sequence of steps, topologically sorted by dependencies. Steps that unblock other work come first. Foundation corrections precede the work that depends on them.

**Every step contains all of the following:**

- **What changes** — which files, which functions, what is added, modified, or removed. Name the file paths. Name the functions. Name the types. "Add authentication" is not a plan step. "Create auth middleware in `middleware/auth.ts` that validates JWT from the Authorization header, checks expiry, attaches the decoded user to `req.user`, and returns 401 with a JSON error body on failure" is a plan step.
- **Source** — where this step comes from. Required on every step. One of: a specific spec requirement (cite by number or label), an architecture decision (cite the document), a named engineering standard (cite it — OWASP cheat sheet X, RFC Y, framework docs verified via Context7 on date Z), or a genuine constraint (state what fixes it). A step with no Source is ungrounded and belongs in the Gaps section, not in the Plan section.
- **Why this approach** — the engineering standard, documented best practice, or library documentation that makes this the right choice.

  For trivial steps (a file rename, a typo fix, adding an obviously-needed import), one sentence naming the source is sufficient. When you are uncertain whether a step is trivial, treat it as non-trivial.

  For non-trivial steps — anything where a wrong choice could cause security failure, data loss, operational failure, breaking change, or significant rework — expand into the **Gate 3 four-part format**, all four parts required:

  1. **The decision** — what was chosen and exactly where it applies.
  2. **The authoritative standard** — the named specification, RFC, OWASP guide, NIST publication, or clearly documented industry consensus. Not "best practice" with nothing behind it.
  3. **Why this standard applies here** — one to two sentences connecting the named standard to this specific problem. Generic restatement of the standard does not satisfy this; it must explain why this situation calls for this standard.
  4. **What this is NOT — and why** — the alternatives that would be wrong for this situation, named, and the reason each is wrong. Copying a correct recommendation is easy. Explaining why the wrong alternatives are wrong demonstrates actual understanding rather than lookup. If you cannot name and reject at least one wrong alternative, you have not evaluated the decision — you have pattern-matched to a default. In that case, do the evaluation now.

- **Dependencies** — what must complete before this step. What this step unblocks. State explicitly — the implementer may be an agent that needs to know the exact ordering.
- **Verification** — how the implementer will confirm this step is correct after building it. What to run. What to check. What the expected output or behavior looks like. Required on every step. (This is verification of the build, not of the plan's premises — premise verification lives in Output section 11.)
- **Impact if wrong** — what breaks or degrades if this step is implemented incorrectly. Run `codegraph_get_change_impact` on the files each step touches — this gives you the actual blast radius, not a guess. State whether the damage is contained or cascading, and whether it's recoverable or destructive.

**Every factual claim asserted in any of the above fields produces a corresponding entry in the Verification of factual claims section** (Output section 11). A claim that "function `validateKey()` currently returns a Promise" requires an entry citing where you Read that and at what line. A claim that "the framework auto-handles X" requires a Context7 entry citing the docs section and version. The plan's claims and the Verification section must match — claims with no entry are unverified premises and must be moved to the Gaps section or removed.

**When the correct approach diverges from existing codebase patterns**, note the divergence in the step and record it in the plan's Divergences section. State the standard that justifies the divergence. Silent replication of a known-wrong pattern — even for consistency — is the failure mode this plan exists to prevent.

**After writing all code-change steps, enforce documentation sync:**

Run `codegraph_find_related_docs` with the full set of files the plan modifies. This returns the exhaustive, deterministic list of every documentation file that references any code file in the blast radius. For each doc it returns, add an explicit plan step to review and update that doc. These are not optional steps — if the code changes and the docs do not, the docs are now wrong.

### 9. Define scope and checkpoints

**Scope boundaries — required:**
- What is IN scope for this plan
- What is OUT of scope and why (with enough explanation that the user does not wonder if you forgot it)
- What adjacent work this might reveal but intentionally excludes
- Where this plan ends and what comes after

**Checkpoints — required:**

A checkpoint is not "run tests" — it is a specific verification of the accumulated state at that point in the plan. Place a checkpoint after every occurrence of any of the following in the plan:

- A foundation correction, before starting new feature work
- An integration point where separately-implemented pieces connect
- Any step that's hard to reverse if it goes wrong
- The boundary between structural changes and behavioral changes

If the plan contains none of those triggers, the Checkpoints section in the output states explicitly: "No intermediate checkpoints — the plan contains no foundation corrections, integration points, irreversible steps, or structural-to-behavioral transitions." That sentence is the section. The decision that no checkpoints are needed is itself recorded; it is not silently omitted.

### 10. Identify risks

- What could go wrong during implementation
- What assumptions the plan makes that might not hold — and how to validate them early
- What the hardest step is and why
- Where the plan is most likely to need adjustment
- What happens if a step fails mid-way — is the work recoverable from any point, or are there points of no return
- Which files from `codegraph_get_stats` are coupling hotspots that this plan touches — high connectivity means high risk of unintended side effects

### 11. Surface what you decided and what you couldn't ground

Every plan of any real size involves judgment. An ambiguity gets resolved. A trade-off gets chosen. A standard gets interpreted for this specific situation. Those decisions are what downstream consumers need most — more than the conclusions, which are often rederivable, but less than the reasoning, which is not.

Capture two categories separately:

**Decisions made during planning.** Places where you resolved an ambiguity the inputs left open, chose between valid approaches, reconciled a contradiction, or interpreted how a standard applies to this specific situation. Each with the reasoning behind it. This is the section that lets a reader distinguish plan steps that were straightforward derivations from plan steps that involved real judgment — and evaluate whether the judgment was sound.

**Gaps acknowledged.** Places where the plan could not be grounded in a named standard, library documentation could not be verified, a spec requirement was ambiguous and you chose to proceed anyway, or questions remain that may surface during implementation. A gap acknowledged is honest and fixable. A gap hidden becomes a defect discovered later.

The difference between these two: a **decision** is a judgment you made and can defend. A **gap** is something you could not ground in an external source, which the implementer and user need to know about because it may need to be revisited.

If the Decisions section is empty for a non-trivial plan, that is a signal to re-examine — non-trivial planning involves judgment by definition, and an empty Decisions section usually means judgment was made but not surfaced. If the Gaps section is empty, the section explicitly states "No gaps — every decision in this plan was grounded in a named standard from Output section 3, and every factual claim was verified per the entries in Output section 11." Empty without that attestation is non-compliance.

---

## Compliance gate — before delivering

Before delivering the plan, run all three gates below. The plan is not complete until all three pass.

**Gate A — does the plan enable downstream work:**

- Can an implementer execute this step by step without making architectural decisions on the fly?
- Can a reviewer check a build against this and reach a defensible conclusion about whether each step is done correctly?
- Can the user read this and know what they're getting, what's being corrected along the way, and what's deferred?

**Gate B — is the plan's own compliance auditable.** Each of the following questions must be answerable from the document alone, by pointing to a specific section or annotation. If any answer requires subjective interpretation, the plan has not made its own reasoning visible enough — fix the document before delivering.

- Which named standards govern this plan, and what does each govern? (Output section 3.)
- Where does each non-trivial step come from? (Source annotation on each step in Output section 7.)
- For each non-trivial step, what alternatives were rejected, and why? (Gate 3 part 4 on each step.)
- How was each factual claim the plan depends on verified? (Output section 11 — every claim has an entry.)
- Which plan decisions involved judgment calls, and what was the reasoning? (Output section 10.)
- Where does the plan diverge from existing codebase patterns, and what standard justifies the divergence? (Output section 8.)
- What couldn't be grounded in a named standard or verified against external documentation? (Output section 13.)

**Gate C — final checklist:**

- Every step has a **Source** annotation. Steps without one are in the Gaps section, not the Plan section.
- Every non-trivial step has all four Gate 3 parts (decision, standard, why here, what it is NOT and why). Steps with three of four parts are non-compliant.
- Every factual claim asserted in any plan step has a corresponding entry in Output section 11. The two are reconciled — claims without entries are non-compliance.
- Every entry in Output section 11 uses one of the four verification types (file:line read, grep result, Context7 lookup, test reproduction) with the required specifics. Entries that say only "verified" or "checked" are non-compliance.
- Context7-verified claims cite library ID, section, version, and date — not just "verified via Context7."
- File paths and function names are confirmed against the current codebase, not assumed.
- No internal reasoning artifacts, self-corrections, or scratchpad content remain in the document.
- Every required output section is present. Every "if applicable" section that has content is present.
- Output sections 10, 11, and 13 are all present. Empty sections carry the explicit attestation specified in their definitions; bare empty sections are non-compliance.

If any item in Gate A, B, or C fails, the plan does not get delivered. Fix it.

---

## Output

Write the plan as a structured document with the sections below. Sections marked **(required)** appear in every plan, even when brief. Sections marked **(if applicable)** are omitted only when the content genuinely does not exist — not because they take effort to write.

1. **Goal** *(required)* — what's being built, one paragraph.
2. **Scope** *(required)* — in/out boundaries, where this plan ends, what comes after.
3. **Standards that govern this plan** *(required)* — the named engineering standards, library documentation, specs, or architecture decisions this plan is written against, with what each governs in this plan. This is the registry every step's Source annotation points back to. A plan with no entries here either is not touching anything that has governing standards (rare) or has not done step 3 (common, and non-compliant).
4. **Spec issues** *(if applicable)* — anything found during planning that contradicts or complicates the requirements, with options and recommendation.
5. **Files affected** *(required)* — every file that will be created, modified, or deleted, plus their dependents from `codegraph_get_dependents` that may need verification after changes, plus every documentation file from `codegraph_find_related_docs` that must be reviewed.
6. **Foundation corrections** *(if applicable)* — existing problems the plan addresses first, each with the standard the current code violates and why the correction can't be deferred.
7. **Plan** *(required)* — ordered steps. Each step contains: **what changes**, **Source** (spec reference, architecture decision, named standard, or constraint), **why this approach** (for non-trivial steps: the Gate 3 four-part format — decision, authoritative standard, why the standard applies here, what this is NOT and why), **dependencies**, **verification**, **impact if wrong**.
8. **Divergences from existing patterns** *(if applicable)* — each place the plan diverges from existing codebase patterns, the standard that justifies the divergence, and the step(s) where the divergence is introduced. Omit this section only when the plan introduces no divergences — not when the planner did not look for any.
9. **Checkpoints** *(required)* — checkpoint placements per Step 9. If the plan has no triggers requiring checkpoints, the section explicitly states that and explains why.
10. **Decisions made during planning** *(required)* — judgment calls the planner made while writing the plan, with reasoning. Includes ambiguity resolutions, trade-off choices, and interpretations of how a standard applies to this situation. A plan with no entries here either involved no real judgment (rare for any non-trivial plan) or the planner is not surfacing their reasoning. **This is the frame-correctness proof of the output contract.**
11. **Verification of factual claims** *(required)* — a numbered list. One entry per factual claim the plan depends on. A factual claim is any statement the plan makes about: file contents, function signatures, type definitions, library behavior, framework defaults, configuration values, what symbols currently exist, what currently breaks, what currently works, what a test currently asserts, what a doc currently says.

    Every entry contains both:

    1. **The claim** — stated as it appears in the plan, with the step number(s) that depend on it.
    2. **How it was verified** — exactly one of, with specifics:
       - **File:line read** — `path/to/file.ext:N–M`, with one line describing what was read at that location. Memory of a file read earlier in the session is not a current verification — re-read or cite the read at the time of plan-writing.
       - **Grep result** — the exact pattern, the scope it ran in, and the count or explicit absence found.
       - **Context7 lookup** — Context7 library ID, docs section title, library version, date of lookup.
       - **Test reproduction** — test file path, what was executed, what was observed.

    A claim that could not be verified does not appear in the Plan section — it is in the Gaps section as an unresolved item with what would be required to verify it. There is no "tentative" path; tentative claims are gaps.

    If this section is empty, the section explicitly states "No factual claims — this plan asserts nothing about current code, library behavior, or external state." For any plan that touches existing code, an empty section is non-compliance.

    **This is the premise-correctness proof of the output contract.**
12. **Risks** *(required)* — what could go wrong, what's uncertain, what's hardest, what's irreversible, which coupling hotspots are touched.
13. **Gaps acknowledged** *(required)* — plan decisions that could not be grounded in a named standard, library documentation that could not be verified, ambiguities that remain, questions that may surface during implementation. If this section is empty, the section explicitly states "No gaps — every decision in this plan was grounded in a named standard from section 3, and every factual claim was verified per the entries in section 11." Empty without that attestation is non-compliance.
14. **Post-completion** *(required)* — what to verify after all steps are done, and what follow-up work this plan may create.

Place the plan file where the project already keeps plans if there's an established location; default to `docs/plans/` otherwise. Name it `plan-[kebab-case-name].md`.