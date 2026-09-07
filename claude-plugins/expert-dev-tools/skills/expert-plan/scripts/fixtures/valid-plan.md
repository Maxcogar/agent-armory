# Fixture — a minimal valid plan exercising the full step-decl grammar

This fixture is read by `derive-plan-sections.mjs --self-check`. It exercises:
indented and column-0 fences, suffixed step IDs, multi-entry lists, every
files sub-key form, a dependency chain, and both test-spec ID line forms.
Regenerate it with the script itself after any grammar change; self-check
requires it to check clean as committed.

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
    tests: [T-1]
    depends_on: []
    ```

2. **Step S2a — wire configuration.**

```step-decl
step: S2a
covers: [R-2, Q-1]
files:
  create: []
  modify: [src/config.js]
  delete: [docs/old-notes.md]
tests: [T-1, T-2]
depends_on: [S1]
```

## 12. Test specifications

- **T-1** — the limiter rejects requests over the threshold.

### T-2

Config override changes the threshold; spec-heading form exercised.
