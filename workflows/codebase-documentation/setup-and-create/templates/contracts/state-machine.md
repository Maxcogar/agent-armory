# [Entity] State Machine Contract

**Last Updated**: [DATE]
**File**: `[server/src/[entityStateMachine].js]`

---

## Overview

[Entity name] in [project name] follow a strict state machine to prevent [problem it solves]. **You cannot skip states.** This is by design.

---

## Valid States

| State | Description |
|-------|-------------|
| `[state1]` | [What this state means] |
| `[state2]` | [What this state means] |
| `[state3]` | [What this state means] |
| `[final_state]` | [Terminal state — cannot be changed] |
| `[blocked_state]` | [Paused state — can only return to previous] |

---

## State Transition Map

```
[state1] ------> [state2] ------> [state3] ------> [final]
    |                |                 |
[blocked] <----------+-----------------+
    |
    +--> (returns to previous_status only)
```

### Valid Transitions

| From | To | Allowed? |
|------|----|----------|
| `[state1]` | `[state2]`, `[blocked]` | Yes |
| `[state2]` | `[state1]`, `[state3]`, `[blocked]` | Yes |
| `[state3]` | `[state2]`, `[final]`, `[blocked]` | Yes |
| `[final]` | (none) | FINAL STATE |
| `[blocked]` | `previous_status` only | Yes |

### Invalid Transitions (Will Error)

- `[state1]` -> `[state3]` (must go through `[state2]`)
- `[state1]` -> `[final]` (cannot skip)
- `[final]` -> anything (final state)
- `[blocked]` -> anything except `previous_status`

---

## Transition Requirements (Guard Conditions)

### `[state1]` -> `[state2]`

**Required Fields**:
- `[field_name]` (string, non-empty)

**Rationale**: [Why this field is required before this transition]

**Error Message**: `"[Human-readable message]"`

---

### `[state2]` -> `[state3]`

**Required Fields**:
- `[field1]` (array, length > 0)
- `[field2]` (string, non-empty)

**Rationale**: [Why these fields are required]

**Error Message**: `"[Human-readable message]"`

---

### `[state3]` -> `[final]`

**Required Fields**:
- `[field]` (array, length > 0)

**Rationale**: [Why this field is required before finalizing]

**Error Message**: `"[Human-readable message]"`

---

## Special Rules

### Rule 1: `[final]` is FINAL

Once an entity reaches `[final]`, **it cannot be modified**. No status changes, no field updates, nothing.

**Rationale**: [Why final is final in your system]

### Rule 2: `[blocked]` Returns to Previous State Only

When an entity is `[blocked]`, the system stores the previous status in `previous_status`. The entity can **only** return to that specific status.

**Example**:
- Entity at `[state2]` -> moves to `[blocked]` -> can only return to `[state2]`

### Rule 3: Same-status transitions are no-ops

Transitioning from a status to the same status returns `{ valid: true }` without any checks.

---

## API Enforcement

### Backend Validation

File: `[server/src/routes/[entities].js]` (PATCH `/api/[entities]/:id`)

```javascript
const result = validateTransition(currentEntity, newStatus, mergedData);
if (!result.valid) {
  return res.status(422).json(result);
}
```

### Frontend Helpers (if applicable)

File: `[client/src/utils/[entity]Transitions.js]`

Functions:
- `getValidNextStatuses(entity)` - Returns array of allowed next states
- `canTransitionTo(entity, newStatus)` - Boolean check
- `getTransitionWarnings(entity, newStatus)` - Get missing field warnings

---

## Examples

### Valid Workflow

```
1. Create entity -> [state1]
2. PATCH {status:'[state2]', [required_field]:'...'} -> [state2]
3. PATCH {status:'[state3]', [required_fields]:[...]} -> [state3]
4. PATCH {status:'[final]', [required_fields]:[...]} -> [final]
```

### Invalid: Skipping States

```
1. Create entity -> [state1]
2. PATCH {status:'[final]'} -> 422 ERROR
   "Cannot move from \"[state1]\" to \"[final]\""
   allowed: ['[state2]', '[blocked]']
```

### Invalid: Missing Required Fields

```
1. Entity in [state1]
2. PATCH {status:'[state2]'} -> 422 ERROR (if [required_field] missing)
   "[Guard error message]"
   missing_fields: ['[required_field]']
```

---

## Testing Checklist

When modifying the state machine, verify:

- [ ] All valid transitions still work
- [ ] All invalid transitions return proper error codes (422)
- [ ] Guard conditions are enforced
- [ ] `[final]` entities cannot be modified
- [ ] `[blocked]` entities only return to `previous_status`
- [ ] Error messages are clear and actionable
- [ ] Frontend helpers match backend logic (if applicable)

---

## How to Add a New State

**WARNING**: Adding states changes the entire workflow.

1. **Add to schema** - Update `CHECK` constraint in schema file
2. **Update TRANSITION_MAP** - Add state and allowed transitions in state machine file
3. **Add guard conditions** - If the transition requires fields
4. **Update frontend** - Add status to UI components
5. **Update this doc** - Add new state to all tables and diagrams
6. **Test thoroughly** - Use the testing checklist above

---

## Files That Depend on This

| File | Impact |
|------|--------|
| `[server/src/[entity]StateMachine.js]` | Definition (source of truth) |
| `[server/src/routes/[entities].js]` | Enforcement on PATCH |
| `[server/src/db/schema.js]` | SQL CHECK constraint |
| `[client/src/utils/[entity]Transitions.js]` | Frontend helpers |
| `[client/src/components/[Entity]Board.jsx]` | Column definitions |
| `[client/src/components/common/StatusBadge.jsx]` | Status styling |
