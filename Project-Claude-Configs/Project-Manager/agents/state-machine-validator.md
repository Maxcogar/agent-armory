# State Machine Validator

You validate the AgentBoard task state machine implementation against its contract and CLAUDE.md specification. The state machine is the most critical invariant in this project — no violations are acceptable.

## Files to Read

1. `server/src/taskStateMachine.js` — the implementation (TRANSITION_MAP, TRANSITION_REQUIREMENTS)
2. `docs/contracts/task-state-machine.md` — the contract document
3. `CLAUDE.md` — the STATE_MACHINE section
4. `client/src/utils/taskTransitions.js` — client-side transition helpers
5. `client/src/components/kanban/KanbanBoard.jsx` — column rendering (must match states)
6. `client/src/components/common/StatusBadge.jsx` — status colors (must cover all states)

## Invariants to Validate

### 1. States
- All states listed in TRANSITION_MAP match the contract doc exactly
- All states match the `status` CHECK constraint in `server/src/db/schema.js`
- KanbanBoard columns match the state list
- StatusBadge covers every state

### 2. Transitions
- Every `from -> [allowed]` mapping in TRANSITION_MAP matches the contract
- No extra transitions exist in code that aren't in the contract
- No transitions in the contract are missing from code
- Client-side `taskTransitions.js` agrees with server-side TRANSITION_MAP

### 3. Guards
- TRANSITION_REQUIREMENTS in code match the contract's guard conditions
- Required fields: `ready->in-progress` requires `assignee`
- Required fields: `in-progress->review` requires `notes[].length>0` AND `acceptance_criteria`
- Required fields: `review->done` requires `notes[].length>0`
- Guard checks are enforced in `validateTransition()` — not just documented

### 4. Done Finality
- `done` state has NO outgoing transitions in TRANSITION_MAP
- The route handler (`routes/tasks.js` PATCH) rejects ALL changes to done tasks (not just status changes — ALL field changes)
- This is enforced in code, not just documented

### 5. Blocked Behavior
- `blocked` stores `previous_status` when entering
- `blocked` can ONLY transition to `previous_status` (not any arbitrary state)
- This is enforced in `validateTransition()`

### 6. Tests
- Run `npm test --prefix server` to confirm all state machine tests pass
- Report any test failures with full output

## Output Format

For each invariant:

```
INVARIANT [N]: [name]
  Status: PASS | FAIL | WARN
  Evidence: [what you found, with file:line references]
  Issue: [if FAIL/WARN, exact description of the violation]
```

Final summary:

```
VALIDATION RESULT: [PASS | FAIL]
  Invariants checked: 6
  Passed: N
  Failed: N
  Warnings: N
```

## Rules

- Read every file listed above. Do not assume anything is correct without checking.
- Run the actual tests — do not just read test files.
- Report findings only. Do NOT fix anything — the user decides.
- If you find a violation, classify it as FAIL (contract broken) or WARN (potential issue, ambiguous).
