---
description: Define specs for a feature or improvement through structured ideation and requirements gathering
---

1. Gather the initial idea from the user. Ask:
   - What problem does this solve? (the pain point)
   - Who is this for? (the user/persona)
   - What does success look like? (desired outcome)

2. Clarify the problem space. Summarize back:
   - Problem statement: [one sentence]
   - Current state: [how it works now, or "does not exist"]
   - Desired state: [how it should work after]
   - Ask user to confirm or correct this understanding

3. Explore the solution space. Present 2-3 approaches:
   - [ ] Approach A: [description]
     - Pros: [benefits]
     - Cons: [drawbacks or risks]
     - Complexity: [LOW/MEDIUM/HIGH]
   - [ ] Approach B: [description]
     - Pros: [benefits]
     - Cons: [drawbacks or risks]
     - Complexity: [LOW/MEDIUM/HIGH]
   - [ ] Approach C: [description] (if meaningfully different)
     - Pros: [benefits]
     - Cons: [drawbacks or risks]
     - Complexity: [LOW/MEDIUM/HIGH]

4. Ask the user which approach to pursue, or if they want to combine elements.

5. Define functional requirements for the chosen approach:
   - FR-1: [The system shall...] — Priority: [MUST/SHOULD/COULD]
   - FR-2: [The system shall...] — Priority: [MUST/SHOULD/COULD]
   - Continue numbering for all requirements

6. Define non-functional requirements:
   - Performance: [response time, throughput, etc.]
   - Security: [authentication, authorization, data protection]
   - Compatibility: [browsers, devices, APIs, existing systems]
   - Maintainability: [code standards, documentation needs]

7. Identify edge cases and error scenarios:
   - Edge case 1: [description] — Expected behavior: [how to handle]
   - Edge case 2: [description] — Expected behavior: [how to handle]
   - Error scenario 1: [what could fail] — Recovery: [how to handle]
   - Error scenario 2: [what could fail] — Recovery: [how to handle]

8. Define scope boundaries explicitly:
   - IN SCOPE:
     - [feature/capability 1]
     - [feature/capability 2]
   - OUT OF SCOPE:
     - [explicitly excluded item 1]
     - [explicitly excluded item 2]
   - FUTURE CONSIDERATIONS:
     - [potential future enhancement 1]
     - [potential future enhancement 2]

9. Identify dependencies and constraints:
   - Technical dependencies: [libraries, APIs, services required]
   - Data dependencies: [schemas, sources, migrations needed]
   - External dependencies: [third-party services, approvals needed]
   - Constraints: [budget, timeline, technical limitations]

10. Compile the specification document:
    - Title: [Feature/Improvement Name]
    - Problem Statement: [from step 2]
    - Solution Overview: [chosen approach from step 4]
    - Functional Requirements: [from step 5]
    - Non-Functional Requirements: [from step 6]
    - Edge Cases and Error Handling: [from step 7]
    - Scope: [from step 8]
    - Dependencies and Constraints: [from step 9]
    - Acceptance Criteria: [how to verify the feature is complete]

11. Present the compiled spec to the user and ask:
    - Does this capture your intent?
    - Are any requirements missing?
    - Should any priorities be adjusted?

<error_handling>
IF the user's initial idea is too vague to form a problem statement:
  DO ask clarifying questions about the specific pain point
  DO NOT proceed with an ambiguous problem definition

IF the user cannot choose between approaches:
  DO suggest starting with the lowest complexity option as a prototype
  DO NOT combine all approaches into one bloated solution

IF requirements conflict with each other:
  DO surface the conflict and ask the user to prioritize
  DO NOT silently resolve conflicts with assumptions

IF scope keeps expanding during the conversation:
  DO pause and revisit the scope boundaries in step 8
  DO NOT allow unbounded scope creep
</error_handling>

<verification>
Before finalizing the specification:
- [ ] Problem statement is clear and specific
- [ ] At least one approach was evaluated
- [ ] All functional requirements have priorities
- [ ] Edge cases are documented with expected behaviors
- [ ] Scope boundaries are explicit (IN/OUT)
- [ ] Acceptance criteria are testable
</verification>

<constraint>
Never finalize a spec without explicit scope boundaries.
Never skip the edge case identification step.
Never proceed past step 2 without user confirmation of the problem statement.
</constraint>