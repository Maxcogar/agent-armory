You are writing an architecture document for a **greenfield** project — a project with no existing codebase. The only input is a specification. The architecture is the bridge between that spec and an implementation that does not yet exist: it answers every design question the spec deliberately left open — architectural style, technology selection, component structure, integration approach, trade-off resolutions, API surfaces, data models, security controls mapped to threats, and the project structure and conventions the implementer will build inside. The architecture must be implementable from an empty repository without the implementer making architectural decisions inline.

**This is the portable variant.** It assumes an environment without the Context7 MCP server and without the Clear Thought MCP server. Neither tool is required to do this work correctly. Context7's job — verifying library and framework behavior against current authoritative source — is done here through disciplined web search and primary-source reading (the Premise verification section below specifies how). Clear Thought's job — imposing a structured shape on each kind of architectural reasoning and externalizing it so it is auditable — is done here through mandatory written reasoning templates (the Reasoning discipline section below specifies each one). The tools never did the thinking; they enforced its shape and recorded it. This variant keeps the shapes and the records, and moves enforcement to the document's structure and the before-delivery gates. Nothing about the rigor is relaxed; only the mechanism changes.

The measure of an architecture is what it enables downstream. A good architecture lets a planner produce concrete implementation steps without re-architecting. It lets a reviewer verify the build against named decisions and reach a defensible conclusion. It lets a stakeholder read it and know how the spec is being satisfied, what trade-offs were made, and where the work could break. An architecture that fails any of these tests is not finished — it is only a draft of section headings.

Apply the Expert Standard throughout this work. Evaluate every architectural choice against established engineering standards — **not against the defaults your training offers.** This is the defining discipline of greenfield architecture: there is no codebase whose patterns could mislead you, but there is something more insidious in its place — the architecture your training will produce by reflex (the framework you always reach for, the three-tier web-app shape, the relational database by default). With no existing code to anchor against, that reflex fills the entire design space unchecked. Every structural and technology decision is correct only if it is derived from this spec's requirements and the named standards, and wrong if it is the statistical-average architecture wearing the spec's vocabulary. Verify every factual premise the architecture rests on against current source: library and framework behavior via authoritative documentation reached through web search, the spec's actual requirements via Read of the spec at specific lines, external standards via the standards documents themselves. Memory of what the spec said, claims imported from the spec without re-reading, framework capabilities recalled from training, and patterns inferred from other architectures are all forms of pattern-matching — they may inform the work, but they are not premises until they have been verified against current source.

There is no codebase to survey, and that absence is not a gap in this process — it is the condition the process is built for. The architecture has nothing existing to lean on, which is exactly why every structural decision must be derived from the spec and the named standards, with no existing pattern available to validate the choice against.

## How to read this command

This command exists to foreclose specific reasoning patterns the architecture work will otherwise drift into by default. Each pattern below is named with the rebuttal that brings the work back. When you catch yourself drifting toward one of these, the rebuttal is the discipline.

**"There's no codebase, so the survey phases just don't apply and I'll jump to design."** Phases 3 and 4 are not the brownfield codebase survey deleted — they are the greenfield work that takes its place, and they are not optional. Phase 3 extracts the architectural drivers from the spec and checks whether the spec is even complete enough to architect against. Phase 4 selects the architectural style and technology stack from scratch. Skipping to design without establishing the drivers produces an architecture that satisfies the spec's surface while serving none of its priorities.

**"I'll use the obvious stack — that's what this kind of project always uses."** Phase 4 is the single most default-prone phase in greenfield work, and "what this kind of project always uses" is the default-stack trap stated out loud. The technology and the architectural style are decisions, each anchored to the spec's prioritized quality attributes, each with rejected alternatives. "It's the standard choice" is not an anchor; it is the absence of one. If you cannot name the quality attribute from the spec that makes this stack right *over the alternatives*, you have pattern-matched to a default.

**"The spec doesn't say, so I'll assume the sensible default and move on."** When the spec is silent on something architecturally load-bearing — expected scale, persistence durability, multi-tenancy, the deployment target — a silent assumption presented as if the spec mandated it is the spec-gap-filling trap. The discipline: surface the gap, state the assumption you are making and why, and record it in both the relevant decision and the Limitations section.

**"Context7 isn't here, so I'll verify framework behavior from memory."** This is the failure this variant exists to prevent. The absence of Context7 does not lower the premise bar — it changes the mechanism to web search, and memory is still not verification. A wrong framework-capability claim in greenfield doesn't break one feature; it invalidates the foundation the whole architecture sits on. The Premise verification section specifies how to search correctly. The short version: search to *locate* the authoritative source, then fetch and read it — a search snippet is a lead, never the verification.

**"The first search result answered the question, so I have my verification."** Search results are engineered to look like answers. The confident snippet is the most dangerous input, because it invites skipping the fetch-and-read step. A snippet directs you to a primary source; it is not a primary source. Verification is reading the official documentation page for the version you are designing against — not the result summary that quoted it.

**"Clear Thought isn't available, so I'll skip the structured-reasoning steps."** Clear Thought imposed a shape on each kind of reasoning and recorded it; without the tool, the shape becomes a written template you fill in, and skipping it is non-compliance exactly as skipping a tool invocation was. The Reasoning discipline section gives the written form for each reasoning kind. The discipline is not "produce the structure when a tool is present" — it is "the structured reasoning appears in the document in its required shape," by whatever mechanism produces it.

**"I'll cite a governing standard if I happen to know one and proceed without one otherwise."** Phase 5 is not optional. Every non-trivial decision is anchored to either a named external standard or a structured first-principles articulation. A decision without an anchor is an unnamed approval. "I couldn't recall a relevant standard" is not a reason to skip the anchor; it is a reason to find the standard or produce the first-principles articulation.

**"I'll abbreviate the design decisions section since the substance is in the components diagram."** The Design decisions section is a load-bearing audit section — it carries the frame-correctness proof and the premise-correctness proof for every non-trivial decision. Components show what the architecture is composed of; design decisions show why each composition choice is correct and what it rests on. An architecture with rich components and thin decisions has hidden the reasoning where the implementer and reviewer cannot find it.

**"I'll define the major components but leave the project structure and conventions to the implementer."** In a brownfield project the directory layout, module boundaries, and naming conventions already exist and are inherited. In greenfield they do not exist, and leaving them to the implementer is the deferred-decision trap applied to the foundation. The architecture defines the structure the implementer builds inside.

**"This decision is obvious; I don't need to evaluate alternatives."** Phase 10's "what this decision is NOT" element exists precisely because copying a correct recommendation is easy and rejecting wrong alternatives demonstrates understanding. If you cannot name and reject at least one wrong alternative for a non-trivial decision, the decision is either trivial (record it briefly) or it has not been evaluated yet.

**"The reasoning is in my working context; the document just needs the conclusions."** The reader cannot evaluate reasoning that lives only in your working context. Every non-trivial decision's reasoning — including the written reasoning-template traces — goes in the document. A conclusion without the reasoning is brittle; it produces the wrong answer the first time the architecture meets an edge case it doesn't explicitly cover.

## Where greenfield architecture work goes wrong

Greenfield architecture work fails in six specific ways. Read all six before starting — these are the failure modes the rest of this process exists to prevent. They are not theoretical. Every one shows up reliably in agent-produced greenfield architecture that doesn't actively guard against it.

**The default-stack trap.** With no codebase to read, you reach for the technology and structure your training offers by reflex. The trap is not that you considered a familiar option; familiar options are often correct. The trap is that the default becomes the choice *without ever being evaluated against the spec's requirements*, because no existing code forced you to justify it. Catch yourself when the justification for a technology or style is "this is the standard choice" without naming the spec's quality attribute that makes it right over the alternatives. This is the greenfield form of silent pattern replication — the source is your own defaults rather than a surrounding codebase, and it is harder to catch precisely because there is no codebase to make the default visible.

*Methodology mapping: silent pattern replication (defaults variant) — one of the four failure signals. The codebase-mirroring variant has no object in greenfield; this is where the same signal surfaces instead.*

**The spec-gap-filling trap.** The spec is silent on something architecturally load-bearing and you quietly fill the gap with an assumed value, then design as if the spec had stated it. In greenfield nothing answers these questions, so your assumption masquerades as a derived requirement. The downstream cost is an architecture optimized for a problem the spec never posed. The defense: when the spec is silent on a load-bearing input, name the gap, state the assumption and its basis, and record it in the decision and in Limitations. If the gap is so fundamental that the choice would determine the entire architectural shape and the spec gives no basis to choose, that is a stop condition (Phase 7).

*Methodology mapping: unverified premise — the architecture rests on a requirement premise not in the spec and not verified against any source; it was assumed and then treated as fact.*

**The pattern-cloning trap.** You see a prior architecture document and copy its structure, decision categories, and component breakdown without re-deriving whether the same shape is right for *this* spec. A web-service shape copied onto a batch-pipeline spec imports the wrong frame. Every architecture inherits *what its precedents already decided when they belong to the same family* (the Inheritance section) and *re-derives everything else from this spec's requirements*. If you are about to copy a structural element, state which spec requirement makes it right *here* — not just that it was right *there*.

*Methodology mapping: silent pattern replication (prior-artifact variant).*

**The decision-hiding trap.** You make an architectural decision in your reasoning and do not surface it in the document. The conclusion appears; the reasoning lives only in your working context. The first edge case the architecture doesn't explicitly cover produces the wrong answer because the implementer has the conclusion but not the reasoning. Every non-trivial decision goes in the Design decisions section in the five-part format. The test: a reader should be able to evaluate whether your judgment was sound. They cannot do that on conclusions alone.

*Methodology mapping: assessment gap — delivering work a rigorous evaluation would flag, with the reasoning hidden so the evaluation cannot occur.*

**The standards-decoration trap.** You name standards — OWASP, ISO, RFC, NIST, 42010 — and the document looks rigorous, but the named standards drive no decision; they were attached afterward to give the shape of compliance. The defense: every named standard must be tied to at least one specific decision the standard actually drove. A standard referenced but governing no decision is decoration. Remove it, or find the decision it should be governing.

*Methodology mapping: unnamed approval — the standard slot is full in name and empty in substance.*

**The deferred-decision trap.** You leave decisions ambiguous — "the implementer will choose the framework," "the project structure will be established during the build." Each deferral feels like flexibility; each is an architectural decision (the decision to defer) made without surfacing it. In greenfield this is sharper than in brownfield, because there is more to decide from scratch — the stack, the style, the structure, the conventions, the boundaries — and therefore more temptation to push it forward. If a decision is genuinely the implementer's call (variable names within a component), it does not belong in the architecture at all. If it is non-trivial and could affect another component or quality characteristic, the architecture resolves it now.

*Methodology mapping: architecture-specific failure mode noted candidly as an extension to the methodology's four-signal taxonomy rather than a renaming of one of them.*

## Premise verification (without Context7)

This is the premise-axis mechanism for this variant. The goal is unchanged from the Context7 version: no factual claim about a library, framework, or dependency enters the architecture from memory; each is verified against current authoritative source before you design against it. The mechanism is web search plus primary-source reading. In greenfield this is more central than in any other architecture work, because the entire stack is chosen from scratch — a wrong capability claim doesn't break one feature, it invalidates the foundation.

**The core move: search to locate the source, then fetch and read the source.** A web search returns snippets engineered to look like answers. The snippet is a lead to the authoritative page, never the verification itself. The verification is reading the official documentation — for the specific version you are designing against — at the URL the search led you to.

**The source hierarchy.** Verify a library or framework premise against the highest source available, and treat lower sources as corroboration only:

1. **Official versioned documentation** for the version you are designing against — the best source.
2. **The library's own source code, generated API reference, or type definitions** — when the docs are silent or ambiguous, the source is authoritative.
3. **Official changelog, release notes, or migration guides** — the place to confirm *when* a behavior was introduced or changed, which the docs often do not state.
4. **Maintainer-authored material** — the official blog, RFCs or design docs in the repository, maintainer comments on official issues.
5. **Reputable third-party material** — used only to corroborate a primary source, never as the sole basis for a claim.
6. **Never as verification:** content farms, undated tutorials, AI-generated summaries, or a forum answer standing alone.

**Search discipline.** Keep queries short and specific: name the library, the specific behavior the architecture depends on, and the version. Prefer the result on the official domain; open it and read it rather than reading the search summary. When you need to know whether a behavior exists in a particular version, read the release notes or changelog, not a general tutorial that may describe an older or newer release. Use the current date when recency matters, and note that "latest" content can lag the newest release.

**Verify the specific behavior, not the general capability.** "Framework X has dependency injection" is not the verification the architecture needs; "Framework X version N resolves request-scoped dependencies once per request and shares them across sub-dependencies" is. Read the documentation section that addresses exactly the behavior you depend on, including the caveats and edge cases the docs note.

**Capture what you verified, not just that you verified.** For each verified premise, record: the library, the version, the **URL of the page actually read**, the date you accessed it, and the specific behavior confirmed. "Verified via the official docs" is decoration on the premise axis. "Confirmed at fastapi.tiangolo.com/tutorial/dependencies, accessed 2026-06-01, FastAPI 0.11x: sub-dependencies share the same cached instance within one request" is auditable.

**When the source will not resolve it.** If the official documentation is silent or ambiguous on the exact behavior, do not fill the gap from memory. Triangulate across two authoritative sources (docs plus the source code, or docs plus the changelog). If they still do not resolve it, mark the premise as unverified and surface it in the Limitations section as a risk. If the unverifiable premise is foundational — the stack choice rests on it — treat it as a stop condition and surface it before proceeding.

**The adapted stop condition.** In the Context7 version, Context7 being unavailable was a tool-failure stop. Here, with web search present, you can almost always reach a primary source, so "I'll use memory" is even less defensible. The only legitimate outcomes for a load-bearing library premise are: verified against a current primary source (cited with URL, version, date), or explicitly surfaced as an unverified premise in Limitations, or — if foundational and unresolvable — a stop. A claim stated from memory as fact remains the failure mode.

**The fully-degraded environment (no Context7 and no web access).** When the environment has neither, every library and framework premise is training knowledge, and the discipline becomes honesty about that: (a) mark each such claim explicitly as "training knowledge — not verified against current source, may be stale" in its premise-verification slot; (b) prefer conservative, version-agnostic designs that do not hinge on a specific recent API behavior wherever the spec allows; and (c) concentrate these unverified premises in the Limitations section so the gap is fully visible to the reader. The architecture is still deliverable. What is preserved is the reader's ability to see exactly which premises are unverified, rather than having unverified premises hidden as facts.

## Reasoning discipline (without Clear Thought)

This is the structured-reasoning mechanism for this variant. Each kind of architectural reasoning has a required written shape that lands in the architecture document — the same shape the corresponding Clear Thought tool would have enforced. The tool never did the reasoning; it imposed the shape and recorded it. Here you impose the shape by writing the template, and the before-delivery Gate C checks that each required structure is present in its shape. Producing a thin version, or skipping a structure because the answer "feels obvious," is the failure this section exists to prevent — so each row also names the specific way the structure gets faked when no tool forces it.

| Reasoning kind (tool it replaces) | When it is mandatory | The written form that replaces the tool | Honesty failure to watch for |
|---|---|---|---|
| Knowledge-state assessment (`metacognitivemonitoring`) | At session start, before design work (Phases 1–2) | A **Knowledge-state baseline** in the Design decisions section: what you actually know about the problem and stack from the spec versus from training; each load-bearing belief labeled fact (verified) / inference (derived) / speculation (assumed); the reasoning biases operating — in greenfield, name the default-stack reflex explicitly (which framework, datastore, or structure are you being pulled toward before evaluating?); and what you do not yet know that the design will need. | Labeling an assumption "fact." The value is in the honesty of the fact/inference/speculation split. |
| Multi-criteria evaluation (`decisionframework`) | Phase 4 (style and stack) and any Phase 10 decision with three or more multi-criteria alternatives | A **weighted decision matrix** in the relevant decision's element 4: the criteria are the spec's prioritized quality attributes from Phase 3; assign each a weight and state why that weight (the priority comes from the spec); list the candidate options — including the defaults you would otherwise reflexively pick; score each option against each criterion with a one-line reason per cell (a bare number is decoration); sum the weighted scores; state the winner. | Reverse-engineering the weights so your preferred stack wins. The weights come from the spec's stated priorities, not from the conclusion you want. |
| First-principles derivation (`mentalmodel(first_principles)`) | Phase 5, whenever a decision has no named standard | The three parts written as prose in the decision's standard slot: (a) the goal of the work the decision serves — what makes the output correct as opposed to merely complete; (b) the local-optimum shortcut your training offers that satisfies "looks done" without serving the goal; (c) why the chosen path serves the goal and the shortcut wouldn't. | Writing "it seemed right" and skipping the three parts. |
| Dialectical resolution (`structuredargumentation`) | Phase 7, for hard contradictions or fundamental spec gaps | Three labeled passages in the Design decisions section: **thesis** (your recommended resolution), **antithesis** (the strongest counter-argument), **synthesis** (the resolution that survives the antithesis, or the acknowledgment that it does not and the conflict is a genuine stop). | A weak antithesis. Steelman the opposing resolution; a strawman antithesis your thesis defeats easily proves nothing. |
| Sequential decomposition (`sequentialthinking`) | Phase 8, mandatory for every architecture for decisions meeting the trigger criteria | A **numbered reasoning chain** in the Design decisions section, each step building on the prior — and where the reasoning turned, show the revision in place ("step 4 revises step 2 because…") rather than presenting only the final path. If no decision meets the criteria, state that explicitly and explain why. | A clean post-hoc chain that hides the dead ends and backtracks the real reasoning took. |
| Hypothesis-driven security reasoning (`scientificmethod`) | Phase 9, when security is in scope | Each threat written as: observation → question → hypothesis (with variables and assumptions) → experiment (the control, and the prediction if the control works and if it fails) → analysis → conclusion. | Collapsing the six-part shape back into "threat: X, mitigation: Y," which removes the hypothesis-testing that justifies the control. |
| Multi-perspective review (`collaborativereasoning`) | Before delivering (Gate A) | Adopt each of the three roles **in turn, in writing** — planner, reviewer, stakeholder — ask that role's specific question (below), answer honestly from that seat, then write the synthesis. If no perspective-specific gaps surface, attest that all three were checked. | Rubber-stamping from your own author's seat instead of inhabiting each role's adversarial question. |
| Foundation-problem characterization (`debuggingapproach`) | Conditionally, if a foundational design conflict surfaces mid-work | Name the strategy you are using (cause-elimination: which candidate cause explains why a requirement can't be satisfied under this abstraction; or divide-and-conquer: isolate which part of the design the conflict lives in) and apply it in writing before proceeding. | Skipping it because the conflict "feels obvious," then building further on an unresolved foundation. |

The three Gate A roles and their questions: the **planner** asks "where would I have to make an architectural call inline, or define structure the architecture didn't, starting from an empty repository?"; the **reviewer** asks "if I had to verify a build against this, would I know what to look for?"; the **stakeholder** asks "do I understand the choices that were made and what they cost?" A non-empty answer from any role is a gap that produces a fix to the document, not a flag in the document.

## Workflow context

When this command is used inside a session protocol that brackets work with output-contract gates, the command's process is the work that happens inside that outer bracket, not in place of it. The hands-off principle in the Process section governs operation between gates. When the command is invoked standalone, the output contract is still satisfied by the Output contract section and the before-delivery gates — the structural evidence is produced regardless of whether a surrounding session protocol is running.

## Output contract

The architecture document is structured around two-axis evidence. Specific sections carry the load for each axis. A document missing any of these sections, or with any empty without an explicit attestation that it is genuinely empty for this architecture, has not satisfied the contract and is not delivered.

**Frame-correctness proofs.** The Design decisions section is the per-decision frame proof — every non-trivial decision's authoritative-standard slot names the standard or first-principles anchor. The Architectural drivers section is the spec-to-architecture frame trace — it names which spec requirements and quality attributes the architecture serves. The Standards governing this architecture table is the project-wide frame audit. A decision without a named anchor is an unnamed approval; a standard cited without a decision it governed is decoration.

**Premise-correctness proofs.** Each non-trivial decision's premise-verification slot names what was checked, against what source, with what result — per the Premise verification section: the spec read at specific lines, a primary-source documentation URL with version and access date, an external standard read, OR "no factual premises — pure design choice," OR (fully-degraded environment only) "training knowledge — not verified against current source." Premise verification is integrated per-decision, not in a separate section.

**Gap acknowledgment.** The Limitations and trade-offs section is the explicit acknowledgment of what was not grounded in a named standard or verified against current source — known limitations, accepted trade-offs, assumptions made to fill spec gaps (with their basis), unverified premises (with why the source did not resolve them), and any rigor the user explicitly waived. A Limitations section genuinely empty for this architecture requires an explicit attestation, not silent omission.

## Input

The user will provide a path to a specification document. The architecture you produce derives from that spec. Read all of it — every line. Read every document the spec references that exists locally: prior specs, prior architectures, project-level governance documents the spec names, and the standards documents the spec names. An architecture written from a shallow read of the spec satisfies the surface of the requirements while missing the constraints buried in the references.

**Precondition.** This command assumes a greenfield project: no meaningful existing codebase, the spec as the primary input. If a substantial codebase already exists, a codebase-surveying architecture command is the right tool instead. If a small scaffold exists (an empty repo skeleton, a package manifest, a CI stub) but no real implementation, this command applies and the scaffold is noted as an existing constraint in the Architectural drivers section rather than surveyed as a codebase.

$ARGUMENTS

---

## Process

The process is ten ordered phases plus three post-design phases (10a, 10b, 10c). Each phase has prerequisites — you do not advance until the prior phases have produced what this phase consumes. Skipping a phase is not flexibility; the ordering exists because each phase produces evidence the next depends on.

You operate hands-off from invocation to delivery. The only valid stop conditions are (a) a hard contradiction in the spec, or between the spec and a governing standard, that blocks all valid architectures (Phase 7); (b) a spec gap so fundamental that the choice it leaves open determines the entire architectural shape and the spec gives no basis to choose (Phase 7); and (c) an inability to verify a foundational library premise against any current source (per the Premise verification section's adapted stop condition). Soft ambiguities — design questions the spec leaves genuinely open between valid architectures, and load-bearing gaps you can responsibly resolve with a stated assumption — you resolve, record in the Design decisions section, and proceed.

**Handling user requests to skip rigor.** Some users invoke this command with explicit shortcuts — "skip the drivers analysis," "just pick a stack," "don't bother verifying," "shortcut to the design decisions." The discipline is: flag once, then comply. Name what is being skipped, what failure mode that step exists to prevent, and what the user is consenting to by skipping it. Then write the architecture they asked for. Do not repeat the flag after acknowledgment. The Limitations section records what was skipped and at whose direction, so the deliverable's gaps remain auditable even when the rigor was waived.

### 1. Read the spec and its references

Read the input spec in full at the path the user provided — every line. Read every document the spec references that you can resolve locally: prior specs, prior architectures (especially when this architecture is one of a family), project-level governance and methodology documents the spec names (treat these as constraints), and any standards documents the spec names that are accessible. Identify which spec requirements (R-numbered) and quality requirements (Q-numbered) you will need to address. Note the locked decisions from the spec's "Decisions made during this spec" section — commitments you honor and do not re-derive.

### 2. Understand the goal

State back, in one paragraph for your own reasoning, what is being built, why, and what success looks like for this architecture. The goal is the anchor — every decision must serve it. If you cannot state the goal in one sentence, you do not have it yet. If two thoughtful readers of the spec would derive different goals, you have a goal-ambiguity to resolve as a soft ambiguity — choose the interpretation that best serves what the spec is for, record it in Design decisions, and proceed.

Produce the **Knowledge-state baseline** now, per the Reasoning discipline section's first row. This is mandatory at session start and lands in the Design decisions section. In greenfield it does specific work: it forces an explicit separation between what the spec establishes and what you are importing from training defaults — the first line of defense against the default-stack trap.

### 3. Establish the architectural drivers — and check spec readiness

This phase takes the place the codebase survey holds in a brownfield architecture. The architecture's ground is the spec; this phase extracts from it what every later decision will serve.

From the spec, establish: **stakeholders and their concerns** (per ISO/IEC/IEEE 42010 — who depends on the system and what each needs from it); the **architecturally significant requirements** (the R# subset whose satisfaction shapes the structure); the **prioritized quality attributes** (per ISO/IEC 25010 — which quality characteristics the Q# requirements demand and their relative priority, which become the weighted criteria for Phase 4); and the **constraints** the spec names (deployment environment, regulatory requirements, mandated technologies, integration targets, operational limits). Any small scaffold that already exists is recorded here as a constraint, not surveyed as a codebase.

**Architecture-readiness check.** Ask whether the spec gives enough to architect against — in greenfield nothing else will fill a gap. For each load-bearing dimension (expected scale and load, persistence durability, single- vs. multi-tenant, consistency vs. availability needs, deployment target, security surface), check whether the spec establishes it. Where the spec is silent: if the gap can be responsibly resolved with a stated assumption, record the assumption and its basis, carry it into the relevant decision, and proceed — **do not fill it silently** (the spec-gap-filling trap). If the gap is fundamental — the choice determines the entire architectural shape and the spec gives no basis to choose — that is a Phase 7 stop condition.

### 4. Select the architectural style and technology stack

This is the from-scratch foundational decision and the phase most exposed to the default-stack trap. "What these projects usually use" is not a reason.

Make two coupled decisions, each as a full design decision (Phase 10 format) anchored to the Phase 3 drivers: the **architectural style** (monolith, modular monolith, service-oriented, event-driven, serverless, pipeline/batch, CLI tool, library, or another pattern), chosen because the prioritized quality attributes and constraints make it right, with rejected styles named and the reason each is wrong for *this* spec; and the **technology stack** (language, framework(s), datastore(s), and load-bearing dependencies), each chosen against the same drivers with alternatives rejected.

When the style or stack has three or more viable options competing on multiple criteria, produce the **weighted decision matrix** per the Reasoning discipline section. The criteria are the Phase 3 prioritized quality attributes, weighted explicitly; the scored matrix replaces narrative hand-waving about why each alternative loses, and lands in the decision's element 4. The capability claims these choices depend on are verified in Phase 6 — do not commit to "framework X supports Y" here without flagging it for verification.

### 5. Identify governing standards

The spec named the standards that governed it. The architecture inherits those — every standard from the spec's "Standards that govern this spec" section is automatically a standard here. Read each one (the section in the spec, the linked document if local, or recall what the standard demands if you have verified knowledge from training; ISO/RFC/OWASP/NIST standards are stable, but the spec's interpretation must be yours too).

Add the architecture-phase governing standards that apply to most software architectures: **ISO/IEC/IEEE 42010** (architecture description — stakeholders, concerns, viewpoints, views, decisions with rationale; underwrites the Architectural drivers section and the decision-rationale discipline); **ISO/IEC 25010** (quality characteristics the architecture must advance); **SOLID** for component design; **REST conventions** (RFC 7231, 7232, 7807) when API design is in scope; **OWASP ASVS** for security architecture when there is a security surface, and **OWASP Threat Modeling guidance** (threats before controls). Add domain-specific standards relevant to the system (microservice patterns, event-driven principles, database normal forms, consistency models — identify per-architecture, do not pre-load).

For each named standard, write down what it governs in this architecture. A standard that governs no specific decision is the standards-decoration trap waiting to happen — find the decision it should govern, or remove it.

**When no formal standard applies to a decision**, the anchor is a first-principles articulation per the Reasoning discipline section (goal of the work; local-optimum shortcut; why the chosen path serves the goal). This is acceptable in the decision's standard slot when no standard applies, and it must appear in the document. Every non-trivial decision is anchored either to a named standard or to a goal-articulated first-principles frame — never to "it seemed right," "this is the standard choice," or "common practice."

### 6. Verify external libraries and frameworks against current source

For every external library, framework, or versioned dependency the architecture commits to — including the stack chosen in Phase 4 — verify the relevant API or behavior against current authoritative documentation **per the Premise verification section** before designing against it. In greenfield this is more central than in brownfield: the entire stack is chosen from scratch, so a wrong capability claim invalidates the foundation.

The flow, with no Context7 available: identify the library and the specific behavior the architecture depends on; search to locate the official documentation for the version you are designing against; fetch and read that page (not the search snippet); confirm the specific behavior including caveats; and capture the library, version, the URL read, the access date, and the behavior confirmed. When the documentation is silent or ambiguous, triangulate across two authoritative sources (docs plus source, or docs plus changelog). When a load-bearing premise cannot be verified against any current source, mark it unverified and surface it in Limitations; if it is foundational, stop. In a fully-degraded environment with no web access, mark each premise as training knowledge per the Premise verification section's final paragraph.

Skip this phase only when the architecture has no external dependencies (rare). When you skip, record why in Limitations.

### 7. Detect and surface spec problems

With no codebase to compare against, spec problems surface from the spec's internal consistency and from the spec measured against the named standards (Phase 5) and the readiness check (Phase 3). Three categories, each with a different response:

**Hard logical contradiction.** Two spec requirements or constraints that cannot both be true in any valid architecture. **Stop.** Construct the resolution via the **dialectical (thesis-antithesis-synthesis) written form** per the Reasoning discipline section. Surface the contradiction with quotes from the spec, the structured argument, and your recommendation. Wait for user input.

**Hard standard-vs-spec contradiction.** The spec asks for something a named governing standard says is wrong (e.g., spec mandates SHA-256 for credential storage but OWASP says argon2id; spec mandates query-string token delivery but OAuth 2.0 RFC 6749 forbids it). **Stop.** Construct the dialectical resolution, surface the conflict with quotes from spec and standard, recommend the standard-aligned approach, and wait for user input.

**Fundamental spec gap.** The spec is silent on something that determines the entire architectural shape, and gives no basis to choose (e.g., single-user desktop tool vs. multi-tenant service). **Stop.** Surface the gap, name the architectures each interpretation would produce, and wait for user input.

**Soft ambiguity or resolvable gap.** The spec leaves a design question genuinely open between valid architectures, or is silent on a load-bearing input you can responsibly resolve with a stated assumption. **Do not stop.** Choose the approach that best serves the goal (or state the assumption and its basis), record the resolution in Design decisions, and proceed.

**Watch the trap.** A soft ambiguity dressed up as a hard contradiction is a way to ask permission to skip work the architect should be doing. The criterion is whether *any* valid architecture exists and whether the spec gives a basis to choose among the valid ones — not whether the choice is hard.

### 8. Reason through hard decisions

Mandatory for every architecture document. Produce the **numbered reasoning chain** per the Reasoning discipline section for decisions meeting the trigger criteria.

Apply the treatment to: decisions where multiple valid approaches exist and the wrong choice creates rework; decisions where component interaction is non-obvious and getting it wrong breaks things silently; decisions where you are about to recommend an approach and realize you haven't evaluated the alternatives; decisions involving a quality-characteristic trade-off (performance vs. maintainability, consistency vs. availability) that requires reasoning, not pattern-matching. Don't apply it to: decisions with one obvious correct approach by the named standards; decisions reversible at low cost; routine choices where the standard is clear.

If no decisions meet the criteria, the Design decisions section explicitly states that and explains why. Silent omission is non-compliance. For decisions that warrant it, the conclusion and the reasoning chain both go into the Design decisions section — a conclusion without its reasoning is brittle.

### 9. Construct the threat model when security is in scope

Security is in scope when the system handles credentials, tokens, session state, personal data, multi-user access control, trust boundaries, or external integrations. When in scope, build the threat model **before** designing controls — controls without a threat model are security theater. Greenfield is the ideal case: there is no legacy posture to retrofit; the design starts security-first.

Build the model via the **hypothesis-driven written form** per the Reasoning discipline section: each threat as observation → question → hypothesis (variables, assumptions) → experiment (control, prediction) → analysis → conclusion. It identifies attackers (external without credentials, authenticated users escalating privilege, insiders, compromised dependencies), targets (credentials, tokens, personal data, trust relationships, availability), and blast radius (data leak, lateral movement, financial loss, regulatory exposure). Each security-related decision in Phase 10 ties to a specific threat — a control without a threat is flagged. When security is not in scope, skip this phase; performative threat modeling is standards-decoration applied to security.

### 10. Make design decisions in the five-part decision format

For every non-trivial architectural choice — style, technology, components, integration approaches, trade-off resolutions, API surfaces, data models, security controls, project structure, conventions — write the five-part justification:

1. **The decision.** What was chosen and exactly where it applies — component name, layer, directory location, interface or contract.
2. **The authoritative standard.** A named specification, RFC, OWASP guide, NIST publication, ISO standard, or industry consensus documented in a specific source. *When no formal standard applies*, the first-principles articulation per the Reasoning discipline section. No anchor at all is not acceptable.
3. **Why this standard applies here.** One to two sentences connecting the standard (or first-principles anchor) to this specific architectural problem. Generic restatement does not satisfy this.
4. **What this decision is NOT — and why.** The alternatives that would be wrong, named explicitly with the reason each is wrong. For technology and style choices this is where the default-stack trap is defeated: the default you didn't choose appears here as a rejected alternative with its reason. For decisions with three or more multi-criteria alternatives, the weighted decision matrix lands here.
5. **Premise verification.** What was checked, against what source, with what result — per the Premise verification section: spec file:line read (path, line range, what it showed), a primary-source URL with version and access date, an external-standard citation, OR "no factual premises — pure design choice," OR "training knowledge — not verified against current source" in a fully-degraded environment.

**What counts as non-trivial.** Any decision where a wrong choice could cause a security failure, data loss, operational failure, breaking change, integration mismatch, or significant rework. When unsure, treat it as non-trivial. **Trivial decisions** (variable names within a component, internal helper names) are recorded briefly without the five-part format.

For each decision, record the spec requirements (R# and/or Q#) it addresses — this produces the data the traceability matrix consumes.

**Watch the standards-decoration and deferred-decision traps.** A decision whose standard slot lists a standard the choice doesn't use is decoration. A decision that defers a choice with cross-component consequences to "the implementer" or "the build phase" is the deferred-decision trap — and in greenfield this includes deferring the project structure and conventions, which do not exist until this architecture defines them.

### 10a. Quality characteristic mapping

Position: between Phase 10 and Phase 11. The Phase 11 output requires a Quality characteristics addressed (ISO/IEC 25010) table; this phase produces the work it reflects. For each characteristic the spec requires (per Q# requirements): (1) what does the spec demand for it? (2) which Phase 10 decisions advance it, and by what mechanism (record the decision numbers)? (3) are there gaps — a required characteristic no decision addresses? Gaps produce a return to Phase 10, not a row marked "not addressed." Characteristics deliberately deferred or out of scope are recorded with reasoning. This phase does not invent characteristics the spec doesn't require.

### 10b. ASVS verification mapping (when security is in scope)

Position: alongside 10a. Fires only when security is in scope (per Phase 9). For each applicable OWASP ASVS requirement (authentication, session management, access control, input validation, error handling, logging): (1) does a Phase 10 decision address it? Record the mapping. (2) if not, is it applicable? If applicable but unaddressed, it drives a return to Phase 10 — the architecture must specify how authentication, sessions, and access control are handled; leaving these to the implementer is the deferred-decision trap. (3) if out of scope or genuinely deferred, mark it explicitly with reasoning; Limitations records the deferral. When security is out of scope, this phase does not fire.

### 10c. Establish the foundation and build order

Position: alongside 10a and 10b, before Phase 11. This phase has no brownfield equivalent — in greenfield the implementer starts from an empty repository, and the architecture must establish what gets built first.

Produce, at the architecture level (not the plan's file-level granularity): the **foundational skeleton** (the project structure the implementer builds inside — directory/module layout, the core abstractions and boundaries everything else depends on, and the conventions for naming, layering, and dependency direction; these are decisions made in Phase 10, assembled here into the structure a planner lays down first); and the **dependency order among architectural elements** (which elements must exist before which — the data model and core domain before the services that use them, the boundaries before the components that respect them, the security primitives before the features that depend on them).

The boundary with the planning step: this phase defines *what the foundation is* and *the dependency order among architectural elements*; the plan defines *the file-level steps and their sequence*. Stating the dependency order here is not doing the planner's job — it gives the planner the settled ordering it would otherwise have to infer, and an inferred ordering in greenfield is where rework comes from.

### 11. Write the architecture document

With Phases 1–10 (plus 10a, 10b, 10c where applicable) complete, write the architecture as a markdown document with the following structure. Sections marked **(required)** appear in every architecture, even briefly. Sections marked **(if applicable)** appear only when the condition holds. Every required section carries a structural piece of evidence that makes the architecture auditable on one axis or the other.

```
# Architecture — [Name]

[Optional: Revision note at top — only when this architecture revises a prior version]

## Goal — what this architecture serves
   *(required)* — one paragraph: what the architecture is for, what makes it correct as opposed to merely complete, and the local-optimum trap that threatens it most directly (for greenfield, usually the default-stack trap). The anchor — every decision below must serve it.

## Scope
   *(required)* — three subsections. **In scope:** what this architecture covers. **Deferred:** what is left for later phases, with reasoning. **Out of scope:** what is explicitly excluded, with reasoning.

## Architectural drivers
   *(required)* — the spec-to-architecture frame trace produced in Phase 3: stakeholders and their concerns (per ISO/IEC/IEEE 42010), the architecturally significant requirements, the prioritized quality attributes (per ISO/IEC 25010) that become Phase 4's weighted criteria, and the hard constraints.

## Technology and architectural style
   *(required)* — the chosen architectural style and technology stack stated up front, each pointing to the Design decision (D#) that justifies it. This section states the choices; the justification, alternatives, and verification live in Design decisions.

## Inheritance from existing precedents
   *(if applicable)* — when this architecture is one of a family with established prior versions, the decisions inherited from precedent in a table, with the precedent source and why each applies identically here. **Family criterion:** family only when both hold — (a) structurally identical problems within the same system, AND (b) the same architectural pattern. Otherwise prior architectures are reference material, not precedents, and the section is omitted.

## Components and structure
   *(required)* — what the architecture is composed of, at the level the implementer needs to start without re-architecting: component responsibilities, interfaces, data flow, integration points, and — because this is greenfield — the project/module structure and conventions the implementer builds inside.

## Quality characteristics addressed (ISO/IEC 25010)
   *(required)* — a table mapping each quality characteristic the architecture advances to how it is advanced (with the design decision numbers). Reflects Phase 10a. Characteristics deliberately not addressed are named with reasoning.

## Design decisions
   *(required)* — D1, D2, D3, … each in the five-part decision format. For each, record the spec R#/Q# it addresses. The Knowledge-state baseline (Phase 2), the written reasoning-template traces (weighted decision matrices, first-principles articulations, dialectical resolutions, numbered reasoning chains, foundation-problem characterizations), and the pre-delivery multi-perspective review (Gate A) all land here.

## Threat model
   *(if applicable — security in scope per Phase 9)* — attackers, targets, blast radius, each threat in the observation → question → hypothesis → experiment → analysis → conclusion shape. Threats first; controls in Design decisions reference these threats.

## ASVS verification mapping
   *(if applicable — security in scope per Phase 9)* — table mapping each applicable ASVS requirement to the design decision (D#) that addresses it, or to "deferred / out of scope" with reasoning. Reflects Phase 10b.

## Foundation and build order
   *(required)* — the foundational skeleton (structure, core abstractions, conventions) and the dependency order among architectural elements, produced in Phase 10c. The architecture-level sequencing the planner refines into file-level steps — not the plan itself.

## Traceability matrix
   *(required)* — a table mapping every R# and Q# from the spec to one or more design decisions, OR explicitly to "deferred to plan / deferred to maintenance / out of architecture scope" with reasoning. Every spec requirement accounted for. No silent omissions.

## Limitations and trade-offs
   *(required)* — known limitations, accepted trade-offs (with why), assumptions made to fill spec gaps (with their basis), unverified premises (with why the source did not resolve them, and any premises resting on training knowledge in a degraded environment), and any rigor the user explicitly waived. The gap-acknowledgment section.

## Standards governing this architecture
   *(required)* — a table: standard, source (file path for project-internal, publication identifier for external), what it governed. Every standard cited anywhere appears here. The audit table.

## Status of this architecture
   *(required)* — a brief section confirming the architecture passes the Design → Build quality gate (every non-trivial decision named a standard, alternatives stated, premise verified or its gap surfaced, traceability complete, foundation and build order established) and naming what comes next (Build phase — write the implementation plan).
```

Place the file where the project already keeps architectures if there's an established location; default to `docs/architectures/architecture-[kebab-case-name].md` otherwise, with the kebab-case name matching the spec's name when derivable or otherwise derived from the spec's subject. If the project has no architectures directory, create the default `docs/architectures/` before writing — but only if `docs/` already exists. If `docs/` does not exist, propose a location to the user and stop. Do not create top-level project structure silently.

---

## Before delivering

The architecture passes three gates before delivery, plus a parallel trap audit. All three must pass independently and the trap audit must come up clean. Passing one gate does not pass the others by inference.

### Gate A — Does the architecture enable downstream work?

Evaluated via the **multi-perspective written review** per the Reasoning discipline section — adopt each of the three roles in turn, in writing, and answer its question honestly:

- **Implementer (planner).** Can a planner read this and produce concrete file-level steps without making architectural decisions inline — starting from an empty repository? An architecture that requires the planner to architect, or to invent the project structure, is not finished.
- **Reviewer.** Can a reviewer check a build against this and reach a defensible conclusion about whether each component, decision, and contract is satisfied?
- **Stakeholder.** Can a stakeholder read this and know how the spec is being satisfied, what trade-offs were made, and where the work could break?

The synthesis lands in the Design decisions section as a pre-delivery review entry, or attests that all three perspectives were checked with no perspective-specific gaps. Pass condition: yes to all three. A "no" from any role produces a fix to the document, not a flag in the document.

### Gate B — Is the architecture's compliance auditable from the document alone?

A reader not present during the work must answer each question by pointing to a specific section, row, or annotation. Subjective interpretation is failure.

- Which named standards govern this architecture, and what does each govern? *(Standards table)*
- Which spec requirements and quality attributes is the architecture built to serve? *(Architectural drivers)*
- Where does each non-trivial decision come from — spec requirement, named standard, or first-principles anchor? *(Design decisions, element 2)*
- For each non-trivial decision, what alternatives were rejected, and why? *(Design decisions, element 4)*
- For each non-trivial decision, what factual premises was it verified against, and how? *(Design decisions, element 5 — spec file:line reads, primary-source URLs with version and access date, external-standard citations, "no factual premises — pure design choice," or "training knowledge — not verified" in a degraded environment)*
- Which decisions involved structured reasoning, and what did it produce? *(Design decisions, with the written reasoning-template traces inline)*
- What gets built first, and in what dependency order? *(Foundation and build order)*
- What couldn't be grounded in a standard or verified against current source, what assumptions filled spec gaps, and which premises are unverified? *(Limitations and trade-offs)*
- Is every spec R# and Q# accounted for? *(Traceability matrix)*
- When security is in scope, is every applicable ASVS requirement mapped to a decision or explicitly deferred? *(ASVS verification mapping)*

Pass condition: every question answerable from the document alone. A question requiring subjective interpretation is a Gate B failure.

### Gate C — Does the document satisfy the structural checklist?

The final mechanical verification.

- Every non-trivial decision has all five parts of the decision format.
- Every verified library premise cites the library, version, the URL actually read, and the access date — not just "verified online." Every premise resting on training knowledge in a degraded environment is explicitly marked as such.
- Every premise-verification slot citing the spec cites the path and line range and what the content showed.
- **Every reasoning structure the Reasoning discipline section flags as mandatory is present in the document in its required shape** — the Knowledge-state baseline; a weighted decision matrix for the style/stack selection and any 3+ multi-criteria decision; a first-principles articulation for every decision lacking a named standard; a dialectical resolution for any hard contradiction or fundamental gap raised; a numbered reasoning chain for decisions meeting the Phase 8 criteria (or the explicit statement that none did); the six-part threat structure for each threat when security is in scope; the three-role review at Gate A. A required structure that is thin or absent is non-compliance exactly as a skipped tool invocation would be.
- File paths and external references are confirmed, not assumed.
- No internal reasoning artifacts, self-corrections, or scratchpad content remain in the document beyond the reasoning traces the format requires.
- The Architectural drivers, Technology and architectural style, and Foundation and build order sections are present and complete.
- The Threat model and ASVS verification mapping sections are present when security is in scope and absent when it isn't.
- The Traceability matrix accounts for every R# and Q#.
- The Scope section names what is in scope, deferred, and out of scope with reasoning for each.
- The Standards governing this architecture table includes every standard cited anywhere, with what each governs.
- Every required output section is present, or explicitly attested as genuinely empty for this architecture.

Pass condition: every checklist item is satisfied, or its absence is explicitly attested.

### Local-optimum trap audit (parallel to A/B/C)

For each of the six traps named at the top, ask the binary question. A "yes" produces a fix to the document, not a flag in the document.

- **Default-stack trap.** Did any technology or style choice get justified by "the standard choice" or "what these projects use" without naming the spec's quality attribute that makes it right over the alternatives? If yes, re-derive from the drivers and name the rejected default.
- **Spec-gap-filling trap.** Did any architectural input the spec was silent on get filled with an assumed value presented as fact? If yes, surface the assumption and its basis in the decision and in Limitations, or stop if the gap is fundamental.
- **Pattern-cloning trap.** Did any structural element come from a prior architecture's shape rather than this spec's requirements? If yes, name the spec requirement that justifies it here, or remove it.
- **Decision-hiding trap.** Is there any non-trivial decision whose reasoning lives only in the working context, not the document? If yes, surface it.
- **Standards-decoration trap.** Is any named standard in the Standards table not driving a specific decision? If yes, find the decision it should govern or remove the standard.
- **Deferred-decision trap.** Is any non-trivial choice — including the project structure and conventions — left for "the implementer" or "the build phase" when it has cross-component consequences? If yes, resolve it now.

Pass condition: no to all six traps.

If any of Gate A, B, C, or the trap audit fails, fix the document. Do not deliver an architecture that fails any of these checks — that is the failure mode the methodology output contract exists to prevent.

---

## Output

Write the architecture file at the chosen path. After writing, confirm to the invoking session: the path of the file written, the section count, and a one-sentence summary of the goal the architecture serves. The user can then review the document directly.

Do not commit the file to git. Do not modify any other file. The only filesystem write is the architecture file itself.

## What comes after

The architecture is the contract for Build. The next step is an implementation plan that consumes the architecture (plus the spec) and produces concrete file-level steps. The Foundation and build order section tells the planner what to lay down first and in what dependency order; the Components and structure section tells the planner where the work happens and inside what project structure; the Traceability matrix tells the planner which decisions are settled; the Standards governing this architecture table is the registry the plan's per-step source annotations point back to.

If you discover during this work that the architecture isn't fully implementable from an empty repository — that an implementer would still need to make architectural decisions inline, or invent project structure the architecture didn't define — that is a foundational issue, not a patch-level one: the architecture is not done. Fix it before delivering. Patch-level gaps (a missing component description, an incomplete traceability row) you fix in place. Foundational gaps (the wrong style, the wrong component decomposition, the wrong abstraction boundary, an undefined foundation) require returning to Phase 4 or earlier — the foundation was laid on incomplete context, and patching it forward leaves the defect in place.

A correct greenfield architecture is the difference between a build that takes one cycle and one that takes three. The cost of getting it wrong is paid downstream. The cost of getting it right is paid here, in the work this process specifies.