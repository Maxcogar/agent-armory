# Phase: Define

Problem → requirements. The work is deciding *what must exist and why*, grounded in real needs and named standards — not in what the current codebase does or what seems reasonable. This is where the pattern-matching trap is most dangerous and least visible: a spec that transcribes the current system's behavior into requirements demands the new work be wrong in the same way.

**Receives:** a problem, need, or opportunity — a sentence, a conversation, a rough brief, or a pointer to an existing system with a desired change.

**Produces:** a specification that constrains the solution space without foreclosing valid designs — it states what must be true of any acceptable solution, traces each requirement to a source, and makes its own reasoning auditable.

## Governing standards

- **ISO/IEC/IEEE 29148:2018** (current edition) — requirements quality. Every requirement must be unambiguous (one valid interpretation), testable (a verification procedure exists), traceable (source annotated), necessary, consistent, and ranked for importance.
- **Domain standards, identified per spec rather than pre-loaded** — OWASP for security-bearing requirements, WCAG 2.2 for accessibility, the relevant RFCs for protocols, NIST publications for identity and crypto. Name them in the spec; don't assume them.
- **The source test** — every requirement traces to a named standard, a confirmed need, or a genuine constraint. This is the frame axis applied at the requirements level.

## The two axes here

**Frame.** Requirements come from standards and confirmed needs, not from the current codebase. When you read an existing system to understand a change, that observation is *input for the transition* — never the specification for the new state. The new state's requirements derive from the standards and needs you identified, not from what the old code happened to do.

**Premise.** Every claim the spec rests on — "the current system does X," "the regulation requires Y," "the API returns Z" — is verified against source before it becomes a requirement or a constraint. A threat model that can't be constructed from available information is marked pending, not invented.

## Output contract — what the gate checks

The delivered spec contains, as auditable elements:

- Named standards, with what each governs in this spec.
- A source annotation on every non-trivial requirement (the standard, need, or constraint it derives from).
- The threat model *before* the security requirements, whenever the work touches credentials, tokens, session state, personal data, multi-user access, trust boundaries, or external integrations — each security requirement tied to a specific threat and stated as a property that must hold, not an implementation to use.
- Judgment calls surfaced — ambiguities resolved, contradictions reconciled, interpretations of how a standard applies — each with its reasoning.
- Gaps acknowledged — requirements that couldn't be grounded, areas of fallback judgment, anything unresolved and who must decide it.

## Test every requirement as you write it

Three tests. A requirement that fails any one has a latent defect that compounds downstream.

1. **Source test** — point to the named standard, confirmed need, or genuine constraint it derives from. If it traces only to "the current system does this" or "this seems right," it's ungrounded and faces scrutiny before it stays.
2. **Abstraction test** — could two valid implementations both satisfy it? If only one could, it has smuggled in a design decision — rewrite it to state the property, not the mechanism. Genuine circumstance constraints ("must run on iOS 16+") are the exception.
3. **Downstream test** — can an architect choose a design from it, and can a reviewer reach a defensible verdict on whether it's met?

## The moves

- Explore the problem before formalizing it — separate the actual need from any solution already in someone's head.
- Identify and name the standards that govern this specific problem.
- Write each requirement as a property of acceptable solutions, then run the three tests on it.
- For security-bearing work, build the threat model first, then derive controls from it.
- Surface every judgment call and gap in the document itself, not in the conversation around it.

## Quality gate to Design

Does the spec pass the three requirement tests on every requirement — unambiguous, testable, traceable to a named source? Any requirement that fails returns to Define, not forward with an implicit "the architect will figure it out."
