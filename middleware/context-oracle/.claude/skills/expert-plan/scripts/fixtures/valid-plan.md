# Fixture — a minimal valid plan exercising the full step-decl grammar

This fixture is read by `derive-plan-sections.mjs --self-check`. It exercises:
indented and column-0 fences, suffixed step IDs, multi-entry lists, every
files sub-key form, a provided name, a dependency chain whose consumer names
the producer's artifacts, both test-spec ID line forms, and a probe citation
resolved against `valid-plan.probes/`. Regenerate it with the script itself
after any grammar change; self-check requires it to check clean as committed.

## 2. Scope

```plan-elements
elements: [R-1, R-2, Q-1]
```

<!-- generated:coverage begin -->
| Requested element | Implementing step(s) |
|---|---|
| Q-1 | S2a |
| R-1 | S1 |
| R-2 | S1, S2a |
<!-- generated:coverage end -->

## 5. Files affected

<!-- generated:files begin -->
| File | Change | Step(s) |
|---|---|---|
| docs/old-notes.md | delete | S2a |
| src/config.js | modify | S2a |
| src/lib/limiter.js | create | S1 |
| src/server.js | modify | S1 |
<!-- generated:files end -->

## 7. Plan

1. **Step S1 — create the limiter.**

    ```step-decl
    step: S1
    covers: [R-1, R-2]
    files:
      create: [src/lib/limiter.js]
      modify: [src/server.js]
      delete: []
    provides: [limiter-cli]
    tests: [T-1]
    depends_on: []
    ```

    Creates `src/lib/limiter.js` and registers the `limiter cli` entry point.

2. **Step S2a — wire configuration.**

```step-decl
step: S2a
covers: [R-2, Q-1]
files:
  create: []
  modify: [src/config.js]
  delete: [docs/old-notes.md]
provides: []
tests: [T-1, T-2]
depends_on: [S1]
```

Reads the threshold `src/lib/limiter.js` exports and exposes it through
`limiter cli --threshold`.

## 11. Verification of factual claims

1. **Claim.** The default threshold is 100. **Steps.** S2a. **Evidence.**
   Test reproduction — `probe:01-threshold-default`.

## 12. Test specifications

<!-- generated:tests begin -->
| Step | Test spec(s) |
|---|---|
| S1 | T-1 |
| S2a | T-1, T-2 |
<!-- generated:tests end -->

- **T-1** — the limiter rejects requests over the threshold.

### T-2

Config override changes the threshold; spec-heading form exercised.
