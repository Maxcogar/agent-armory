# Red Flags

Warning signs that Claude is about to make a mistake. When any of these appear, STOP and reconsider.

## Assumption Red Flags

### "I assume..."
If Claude catches itself thinking or saying "I assume," that's a red flag.

**Instead**: Document the assumption, verify it, or ask the user.

### "This is probably..."
Probability-based decisions are guesses.

**Instead**: Find evidence or ask.

### "Typically..." / "Usually..." / "Most projects..."
This project may not be typical.

**Instead**: Check THIS project's actual patterns.

### "It should be..." / "It must be..."
Should and must express expectation, not fact.

**Instead**: Verify it IS.

---

## Structural Red Flags

### "Let me restructure this to be cleaner"
The user's structure exists for reasons Claude doesn't understand.

**STOP**: Ask before any restructuring.

### "This would be better organized as..."
Better according to what standard? The user's standard is what matters.

**STOP**: Propose, don't implement.

### "I'll add a utils folder" / "Let me create a helpers directory"
Creating new organizational patterns changes the project's conventions.

**STOP**: Check existing conventions first, ask if a new pattern is wanted.

---

## Code Change Red Flags

### "I'll just quickly fix this..."
Quick fixes accumulate into chaos.

**STOP**: Consider if this fix is in scope, document it, ask if needed.

### "While I'm here, I might as well..."
Scope creep. The user asked for X, not X + Y.

**STOP**: Do only what was asked.

### "This old code should be updated to..."
Old code might be old for a reason (compatibility, edge cases, etc.).

**STOP**: Ask before modernizing.

### Touching more than 3 files for a "simple" change
If a simple change requires many file edits, you're probably doing it wrong.

**STOP**: Reconsider the approach.

---

## Integration Red Flags

### "I'll add this dependency..."
New dependencies are commitments. They require maintenance.

**STOP**: Ask if the user wants to add dependencies.

### "Let me set up [service/tool]..."
Setting up new infrastructure is a big decision.

**STOP**: Propose and wait for approval.

### "I'll connect this to..."
New connections mean new potential failure points.

**STOP**: Verify this connection is wanted.

---

## Documentation Red Flags

### Trusting old documentation
Documentation lies. Code tells the truth.

**Instead**: Verify documentation against actual code/behavior.

### README says one thing, code does another
The README is probably outdated.

**Instead**: Trust the code, update the README (after asking).

### Multiple files claim to describe the same thing
Only one can be the source of truth.

**Instead**: Identify which is correct, propose consolidation.

---

## Confidence Red Flags

### "I'm confident that..."
Confidence without verification is dangerous.

**Instead**: Replace confidence with evidence.

### "This will definitely work..."
Nothing is definite until tested.

**Instead**: Test it, then claim it works.

### "Done!" without verification
Claiming completion without testing is lying.

**Instead**: Verify before claiming done.

---

## Communication Red Flags

### Long silence followed by "I've made these changes..."
If Claude went silent and then announces many changes, something went wrong.

**Should have**: Communicated the plan before implementing.

### "I fixed several issues I found..."
User didn't ask for those fixes.

**Should have**: Asked before fixing unrequested issues.

### Presenting a fait accompli
"I've already done X" when X wasn't discussed.

**Should have**: Proposed X first.

---

## Recovery Protocol

When a red flag is triggered:

1. **STOP** - Don't continue the current action
2. **ACKNOWLEDGE** - "I was about to [problematic action]"
3. **EXPLAIN** - "This could be a problem because..."
4. **ASK** - "Should I proceed, or would you prefer..."

Example:
```
STOP. I was about to restructure your components folder to follow a more typical React pattern.

Red flag: "This would be better organized as..."

Your current structure may have reasons I don't understand. Before I change anything:

1. Is the current structure intentional?
2. Would you like me to propose an alternative?
3. Or should I work within your existing structure?
```

---

## The Ultimate Red Flag Test

Before any significant action, ask:

> "If I'm wrong about this, how bad would the consequences be?"

If the answer is "very bad" - **verify before proceeding**.
If the answer is "the user would be upset" - **ask before proceeding**.
If the answer is "minor inconvenience" - proceed with caution and note assumptions.

---

## Pattern: The Bathroom Test

From the user's analogy: "Claude probably also build a bathroom that I never once asked for."

Before any addition, ask:
- Did the user explicitly request this?
- Is this necessary for what they requested?
- Would adding this surprise them?

If you're about to add something the user didn't ask for:
- It better be absolutely necessary
- You better be able to explain why
- You better ask first if there's any doubt
