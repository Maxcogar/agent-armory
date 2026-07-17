# Phase: Verify

Confirming the build is correct and complete. ISO/IEC/IEEE 12207 distinguishes **verification** ("did we build the thing right?" — against the architecture and standards) from **validation** ("did we build the right thing?" — against the spec's requirements and the user's need). Both belong here, and they check against different references, so a system can be perfectly built to spec and still not solve the problem.

**Receives:** the code, its tests, the architecture, the spec, and the build's verification evidence. The build's evidence is *context*, not established fact — Verify re-derives claims from current source, the same as it would for any prior-artifact claim. But knowing where the implementer was working from helps locate where premises may have drifted.

**Produces:** a verification report with findings classified by severity, systemic patterns identified, acceptance criteria checked, and every assessment — positive and negative — carrying both its governing standard and its premise-verification evidence.

## Governing standards

- **The two axes, at full weight** — this phase is the Expert Standard's home ground. Findings are evaluated against named standards (frame), and every finding's premise is verified against current source before it's stated as confirmed (premise). The premise axis exists because review against only the frame axis produced confidently-wrong findings — correct standards applied to unverified premises.
- **OWASP ASVS v5.0.0** — for security review, verified against the threat model from Design.
- **Performance requirements from the spec** — performance is checked against the spec's stated targets, not against a generic sense of "fast enough."
- **The spec's acceptance criteria and the architecture's design decisions** — the two explicit references verification and validation check against.

## The two axes here

**Frame.** Every finding names the standard it violates — and so does every *positive* assessment. "This looks good" without naming the property checked is an unnamed approval and is as unsound as a confident bad finding. An existing pattern that violates a standard is a finding, not a point in its favor.

**Premise.** A finding is **confirmed** only when its premise was verified against current source. Findings whose premise couldn't be verified are delivered as **tentative**, in a separate section, never mixed into confirmed findings. A claimed property in a positive assessment ("input is validated here") is verified before it's asserted, not assumed from a glance.

## Output contract — what the gate checks

The verification report contains:

- Findings classified by severity, with confirmed findings separated from tentative ones.
- Systemic patterns — problems that repeat across the codebase — verified across the instances claimed, not just one. These are highest priority because fixing the pattern fixes many instances.
- What was checked and what was not — scope limits, missing context, standards that couldn't be verified, premises that couldn't be checked with available tools.
- Explicit verification against the spec's acceptance criteria (validation) and against the architecture's decisions (verification).
- The governing standard *and* the verification evidence behind every assessment, positive included.

## The moves

- Read the spec, the architecture, and the code; re-derive the build's load-bearing claims from current source rather than trusting the build's evidence.
- Review against named standards; for each finding, record the standard violated and the verified premise.
- Mark every finding confirmed or tentative by whether its premise was verified.
- Look for repeating patterns and verify them across instances before calling them systemic.
- Check acceptance criteria (did we build the right thing) and design conformance (did we build it right) explicitly.
- Substantiate every positive assessment with the standard and the check.

## Quality gate to Operate

Zero Critical and zero unaddressed Serious **confirmed** findings. Tentative findings at any severity are resolved first — verified and promoted to confirmed, or dismissed with rationale — because shipping on a tentative Critical is shipping on an unknown. Serious confirmed findings may be cleared by explicit, documented acceptance of risk, never by silence. Do the spec's acceptance criteria pass?
