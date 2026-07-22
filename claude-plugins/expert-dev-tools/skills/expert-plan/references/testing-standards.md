# Testing Standards — Test Design by Type

This reference governs every test the plan specifies. Read it before Step 9 (and at Step 5 when auditing existing tests). It exists because "write tests" treated as a self-explanatory instruction produces the easiest construction — mock everything, assert the mocks were called, fabricate data that satisfies the assertions — which is a tautology, not a test. A suite of two hundred such tests reports two hundred verifications that never happened, which is worse than no tests: it manufactures false confidence that survives until production. This is the premise-correctness failure applied to test design — the test *states* "verified" without ever *observing* the system.

Governing sources cited throughout (editions verified 2026-06-11 against the ISO catalog and the published text of the Google SWE book):
- **ISO/IEC/IEEE 29119** — software testing standard series: Part 1:2022 (general concepts, risk-based testing as the recommended strategy basis), Part 2:2021 (test processes), Part 3:2021 (test documentation), Part 4:2021 (test design techniques), Part 5:2016 (keyword-driven testing).
- **Software Engineering at Google** (Winters, Manshreck, Wright, 2020; published free at abseil.io/resources/swe-book) — Unit Testing and Test Doubles chapters: test behaviors not methods, test state not interactions, test via public APIs, prefer realism over isolation, "a real implementation is preferred if it is fast, deterministic, and has simple dependencies," prefer fakes over stubbing and interaction testing, prefer state testing over interaction testing, fakes should be tested.
- **xUnit Test Patterns** (Meszaros, 2007) — the test-double taxonomy: dummy, stub, fake, spy, mock.
- **Martin Fowler, "Mocks Aren't Stubs" and "Test Pyramid"** (martinfowler.com) — classical vs. mockist styles; the cost/speed/confidence trade across levels.
- **OWASP Web Security Testing Guide** — security test design.
- **Project methodology** (`spec-expert-standard-methodology.md`, Build phase) — testing standards as governing standards; output contract: "not 'tests exist' but 'tests verify the behaviors the spec requires,'" at coverage appropriate to risk.

## The Core Discipline

**A test verifies an observable behavior of the system, traced to a requirement.** Not a method. Not an implementation detail. Not that a mock was called. The question every test answers is "does the system do the thing the spec requires?" — and the assertion must target the observable outcome of that thing.

**Real implementations are the default; every double is a justified exception.** A real implementation is preferred whenever it is fast, deterministic, and has simple dependencies — and the burden of proof sits on the double, not on the real thing. When a double is genuinely needed, a fake (a working lightweight implementation of the same contract, maintained and itself tested) is preferred over a stub, and a stub over a mock with interaction assertions. Name every double by its kind, because the kind determines what the test can and cannot legitimately claim.

**The system under test is never doubled.** Doubles stand in for *dependencies* of the thing being verified — never for the thing itself or for the layer whose behavior the test claims to verify. A "database test" that replaces the database has doubled its own subject: it verifies a fake database, and the verdict transfers to the real one only by hope.

**Test data is forward-derived, never backward-fabricated.** Data comes from the real schema via migrations, from named fixtures representing realistic states, or from generators with stated properties. Data shaped backward from the assertions — constructed so the assertion passes — converts the test into `assert(x == x)`. If realistic data makes the test fail, the test just did its job.

**Every test must be able to fail, and the specification states what makes it fail.** A test whose assertions cannot be falsified by broken behavior is coverage theater. The failure condition is written before the test.

**Technique is chosen, not improvised.** Cases are derived with a named design technique per ISO/IEC/IEEE 29119-4:2021 (see the catalog below), making the case set auditable: a reviewer checks whether the partitions are complete instead of trusting that "enough" cases were written.

**Coverage is proportional to risk.** Depth of testing follows the consequence of failure — the risk-based approach ISO/IEC/IEEE 29119-1:2022 makes the recommended strategy basis, and the methodology's Build-phase requirement: tests verify the behaviors the spec requires, at coverage appropriate to the code's risk level.

---

## Unit Tests

**Verify:** one behavior of one unit, through its public API, by asserting on resulting state or return values — not on how the unit got there. The unit's failure must be attributable: when this test fails, the broken behavior is in this unit.

**Run real:** the unit itself (never doubled — it is the subject), and its collaborators whenever they are fast, deterministic, and simple to construct. The classical style — real collaborators inside the process boundary — is the default; isolation per se is not the goal, attributable verification is. *(SWE-at-Google: prefer realism over isolation; Fowler: classical style.)*

**May double, with justification:** true boundaries that make the test slow, nondeterministic, or environment-dependent — network calls, clocks, randomness, filesystems where speed matters, third-party services. Prefer a fake over a stub; use stubs only where each stubbed return directly supports an assertion; reserve mocks-with-interaction-assertions for the narrow case below.

**Requirements:**
- Assert state and outputs, not interactions. Interaction assertions ("repository.save was called once with X") verify the implementation's call pattern, not the behavior — they break on refactor and pass on broken behavior. *(SWE-at-Google: test state, not interactions; prefer state testing over interaction testing.)*
- Test through the public API. Tests reaching into privates verify implementation, not contract.
- One behavior per test, named for the behavior ("rejects expired tokens"), not the method ("testValidate2").
- No logic in tests — no loops/conditionals computing the expected value by the same path the code computes it. Expected values are literals or independently derived.
- Cases derived by a named technique (see Design Techniques below), so a reviewer can audit the partition coverage.

**Interaction testing is appropriate only when** the interaction *is* the contracted behavior and no observable state exists to assert — e.g., "publishes exactly one event on commit" where the publication itself is the requirement. Even then, assert the fewest interactions that express the requirement. *(SWE-at-Google: when interaction testing is appropriate.)*

---

## Integration Tests

**Verify:** that separately-built components work together across a real boundary — the wiring, the contract, the translation. The boundary under test runs real on both sides; doubling either side of it tests nothing.

**Run real:** every component and infrastructure piece *inside* the boundary being verified. For persistence integration: the real database engine, the production engine's containerized instance (the documented industry practice — e.g., Testcontainers-style ephemeral instances), the real schema applied through the project's own migrations, the real driver and query path, real transactions.

**May double, with justification:** systems *outside* the boundary under test — a third-party API the integration doesn't target, upstream services irrelevant to the contract being verified.

### Database testing rules (the rules the mock-database failure violates)

1. **The engine is the production engine.** Not an in-memory substitute of a different engine, not a hand-rolled fake of the repository layer when the repository layer is what's under test. SQL dialect, constraint enforcement, transaction isolation, type coercion, collation, and index behavior all differ between engines — a pass against a substitute is evidence about the substitute. Containerized real engines make this fast enough to be routine.
2. **The schema comes from the migrations.** Creating tables inline in the test fixture verifies a schema that production will never have. Run the project's migration path; schema drift between tests and production is itself a defect this exposes.
3. **The data respects the real schema and constraints.** Fixtures insert through the real constraint set. Data that could not exist in production (orphaned foreign keys, violated uniqueness) makes the test verify an impossible state.
4. **Assertions target persisted state and query results** — read back what was written, through the real path. Asserting that a mocked repository's `save` was called is a unit-test interaction assertion wearing an integration test's name, and it verifies neither persistence nor retrieval.
5. **Isolation by transaction rollback, per-test schema, or per-test database** — stated in the spec so that test pollution is impossible by construction, not by hope.

---

## System / End-to-End Tests

**Verify:** complete user-visible flows through the fully assembled system — real services, real persistence, real configuration, environment as close to production parity as the project can stand.

**Run real:** everything the flow touches. **May double, with justification:** only external third parties that cannot be exercised (payment capture, partner APIs) — via contract-faithful fakes, ideally provider-verified (contract testing).

**Requirements:** few and high-value, per the Test Pyramid — E2E confidence is bought at the cost of speed and flakiness, so each E2E test must verify a flow whose breakage matters and that lower levels cannot verify *(Fowler, Test Pyramid)*. Deterministic setup and teardown; a flaky E2E test is treated as broken, because a test that fails for non-behavioral reasons trains everyone to ignore failures.

---

## Acceptance Tests

**Verify:** the spec's acceptance criteria, one-to-one. Each acceptance test traces to a specific criterion; each criterion in scope traces to at least one test. This is the testable-and-traceable requirement of ISO/IEC/IEEE 29148 carried to execution, and the direct mechanization of the methodology's "tests verify the behaviors the spec requires."

**Requirements:** expressed in the spec's observable terms (inputs, outputs, state) rather than implementation terms; the trace recorded (criterion ID ↔ test ID) so coverage of the criteria is auditable as a reconciliation, not an impression.

---

## Specialized Types (when in scope)

- **Security tests** — designed against the OWASP Web Security Testing Guide for the categories the threat model names; verify rejection and abuse paths, not only happy paths.
- **Performance tests** — verify the spec's stated performance requirements under stated load, on environment-parity infrastructure; a number without a stated requirement is not a test.
- **Property-based tests** — where the behavior is a property over an input domain (round-trips, invariants, idempotence), generate inputs and assert the property; state the generators' domain. Complements, not replaces, example-based cases at the boundaries.
- **Regression tests** — every fixed bug gets a test that reproduces it first (fails on the broken code), then passes on the fix. A regression test that never failed has not demonstrated it can.

---

## The Test-Double Taxonomy (Meszaros)

Name every double by kind; the kind bounds what the test may claim.

| Kind | What it is | Legitimate use | Illegitimate use |
|---|---|---|---|
| **Dummy** | Placeholder, never used | Satisfying a signature | — |
| **Stub** | Canned answers to calls | Supplying inputs that drive the asserted state | Stubbing so much that the test verifies the stubs' script |
| **Fake** | Working lightweight implementation of the same contract | Standing in for a heavy dependency; must itself be tested against the real contract *(SWE-at-Google: fakes should be tested)* | A fake of the system under test; an untested fake |
| **Spy** | Records calls for later inspection | Verifying a contracted side effect with minimal coupling | Auditing implementation call patterns |
| **Mock** | Pre-programmed interaction expectations | The narrow interaction-is-the-behavior case | Asserting interactions as proof of behavior — the default fake-test construction |

Preference order when the real implementation is genuinely infeasible: **fake > stub > spy > mock.** *(SWE-at-Google, Test Doubles.)*

---

## Design Techniques (ISO/IEC/IEEE 29119-4:2021)

Derive cases with a named technique and record which one, so the case set's completeness is auditable:

- **Equivalence partitioning** — one case per behaviorally-equivalent input class, valid and invalid classes both.
- **Boundary value analysis** — cases at, just inside, and just outside every boundary of every partition.
- **Decision tables** — when behavior depends on combinations of conditions; one case per rule column, completeness checked by the table.
- **State-transition testing** — when behavior depends on history; cover valid transitions and assert rejection of invalid ones.
- **Error guessing** — experience-driven cases (nulls, empties, duplicates, unicode, concurrency) — a supplement to the systematic techniques, never the only technique.

---

## The Fake-Test Anti-Pattern Catalog

Use this when auditing an existing suite (Step 5) or reviewing proposed tests. Each entry is a binary check: a test exhibiting the pattern verifies nothing and is counted as missing coverage, not as a test.

1. **Testing the mock.** The dependency is doubled and the assertions target the double — its return values, its recorded calls. The test verifies its own wiring. Check: delete the system under test's logic; if the test still passes, it tested the mock.
2. **Doubled subject.** The layer named in the test's purpose is the layer that was replaced (the "database test" with no database). Check: does the component the test claims to verify actually execute?
3. **Backward-fabricated data.** Test data constructed from the assertion's expected values. Check: would realistic production-shaped data change the verdict?
4. **Cannot fail.** No assertions; asserts only "no exception"; asserts tautologies; snapshot blobs nobody reviews. Check: name the behavioral breakage that fails this test. If none can be named, it is not a test.
5. **Logic mirror.** The test computes the expected value with the same algorithm as the code, so both are wrong together. Check: is the expectation independent of the implementation?
6. **Wrong-engine substitute.** Persistence verified against an in-memory or different-engine database. Check: database-testing rule 1.
7. **Schema bypass.** Tables created inline rather than via migrations. Check: database-testing rule 2.
8. **Coverage theater.** Tests added to move a coverage number, exercising lines without asserting behavior. Coverage measures what executed, not what was verified; risk-based behavior coverage (29119-1) is the requirement, line percentage is at most a smoke signal.
9. **Interaction audit.** Asserting the exact internal call sequence of a refactorable implementation. Breaks on correct refactors, passes on broken behavior.
10. **Flake-tolerated.** A test whose failures are rerun until green. A test that fails non-deterministically for non-behavioral reasons is broken and is fixed or removed — tolerated flakes train the team to ignore red.

## What This Reference Is Not

Not a mandate for end-to-end tests everywhere, and not a ban on doubles. True external boundaries — third-party APIs you don't control, payment processors, clocks, randomness, networks in unit scope — are legitimately doubled, with the double named and justified. The discipline is that *justified* is a real word: each double carries its reason, and the default it departed from is the real implementation.
