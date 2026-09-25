# Phase: Build

Architecture → implementation. The work is executing the design correctly — and "correctly" means against the standards the design was built on, not against patterns already in the codebase. This is where verified premises matter most concretely: code is written against assumptions about what libraries do and what internal contracts guarantee, and an unverified assumption becomes a confident defect.

**Receives:** the architecture document plus the spec. The architecture says how; the spec says what and why. Departures from either are defects.

**Produces:** working, tested code plus implementation notes — including verification evidence for the external libraries and internal contracts the implementation depends on.

## Governing standards

- **The standards the design was built on** — Build does not introduce its own architectural standards; it implements against the ones Design named. A SOLID violation, an ASVS control skipped, a deviation from the API contract — each is a Build defect measured against the design's standards.
- **Premise verification for dependencies** — every external library call and internal contract the code relies on is verified against current source (documentation with version and date for libraries; a read of the actual contract for internal ones), not written from memory of how the API "probably" works.
- **Testing discipline** — test coverage proportional to risk. The riskier and more central the code, the more its behavior must be pinned by tests. Tests assert behavior, not implementation detail.

## The two axes here

**Frame.** "How the rest of the code does it" is not the standard. When the existing codebase's pattern conflicts with the design's standard, the design's standard wins and the divergence is noted. Replicating a surrounding pattern because it's there — without checking it against the design — is the core failure this phase guards against.

**Premise.** Before calling a library function, verify its current signature and behavior against its documentation. Before depending on an internal function's guarantee, read it. "This returns null on miss," "this is idempotent," "this validates its input" — each is a claim to verify, not assume. Record where you verified and where you didn't.

## Output contract — what the gate checks

The build's deliverable contains:

- Working code with tests whose coverage matches the code's risk level.
- Implementation notes that trace the implementation back to the architecture.
- Verification evidence for external library usage (documentation source with version) and for internal contracts the code depends on (a read of the contract), or an explicit acknowledgment of where verification was skipped and why.
- Pattern divergences noted with the standard that justified diverging from the surrounding code.

## The moves

- Read the architecture and spec; verify the claims about libraries and contracts you're about to build on.
- Implement against the design's standards; where the existing codebase pulls you toward a conflicting pattern, follow the standard and note the divergence.
- Write tests that pin behavior at a depth proportional to risk.
- Record verification evidence for each dependency as you go, so it lands in the handoff rather than being reconstructed later.

## Quality gate to Verify

Does the code have test coverage appropriate to its risk? Do the implementation notes trace to the architecture? Are pattern divergences noted with their standards? Is there verification evidence for external library usage and internal contract dependencies — or an explicit note of where verification was skipped and why?
