# Phase: Design

Requirements → architecture. The work is choosing *how* to satisfy the spec within its constraints — component structure, technology choices, integration approach, API surfaces, data models, security controls mapped to the threat model — and documenting the reasoning so the implementer never has to make an architectural decision inline.

**Receives:** a specification from Define that passed its gate, plus access to the standards the spec names.

**Produces:** an architecture document that answers every design question the spec deliberately left open, and is implementable without the implementer making architectural decisions on the fly.

## Governing standards

- **SOLID principles** — for object-oriented and component design.
- **REST conventions — RFC 7231, RFC 7232, RFC 7807** — for HTTP API semantics, conditional requests, and problem-detail error bodies, when an API is in scope.
- **OWASP ASVS v5.0.0** (released May 2025; 17 chapters, ~350 requirements; cite requirements as `v5.0.0-<chapter>.<section>.<requirement>`) — for security architecture. ASVS is the control-level standard; it pairs with SAMM, which is the program-maturity standard.
- **OWASP Threat Modeling** — threats before controls. The threat model drives the security architecture, not the reverse.
- **ISO/IEC 25010:2023 product quality model** — the architecture must advance the quality characteristics the spec requires, and you state how each is addressed. The 2023 edition defines **nine** characteristics: functional suitability, performance efficiency, compatibility, **interaction capability** (renamed from usability), reliability, security, maintainability, **flexibility** (renamed from portability), and **safety** (new). *Note: a governing-file currency gap exists — the methodology spec lists the 2011 eight-characteristic set under a 2023 label; verify against the 2023 edition (nine characteristics) and flag the methodology for update rather than copying its list.*
- **Domain architecture standards, identified per architecture** — microservice patterns, event-driven principles, database normal forms — named, not assumed.

## The two axes here

**Frame.** Design is where "the existing system does it this way" pressure is strongest. An agent designing inside an existing codebase gravitates toward matching the existing architecture — even when that architecture is the source of the problems the spec exists to solve. Every non-trivial design decision states the standard that governs it and names the alternatives rejected and why. Matching an existing pattern is a choice that must be justified against a standard, not a default.

**Premise.** Claims that drive design choices — "this library supports X," "this pattern is what the framework expects," "the database enforces this constraint" — are verified against current source (documentation with version, the actual schema, a reproduction) before they shape the architecture.

## Output contract — what the gate checks

The architecture document contains:

- Each significant design decision with its governing standard, the alternatives rejected, and the reason — the decision-justification-by-standard requirement.
- Traceability from each decision back to the spec requirement it serves.
- The threat model, stated before the security controls, with each control mapped to a threat.
- A statement of how the architecture addresses each ISO 25010:2023 quality characteristic the spec requires.
- The verification evidence behind any factual claim about a library, framework, or external contract the design depends on.
- Judgment calls and gaps surfaced.

## The moves

- Read the spec and its named standards; verify the spec's claims you're about to build on rather than inheriting them.
- For each open design question, choose among valid approaches and record the decision against a named standard with rejected alternatives.
- Build or carry forward the threat model first; derive security controls from it against ASVS.
- State explicitly how each required quality characteristic is met.
- Confirm the result is implementable — an implementer could follow it without inventing architecture.

## Quality gate to Build

Does every significant decision name its governing standard, state the alternatives rejected, and trace to a spec requirement? Is the threat model present and controls mapped to it? Is the architecture implementable without inline architectural decisions? If not, it isn't ready to hand to Build.
