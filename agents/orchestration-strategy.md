# Orchestration Strategy

How to delegate effectively without breaking agent workflows.

---

## CRITICAL: Read MANDATORY-VERIFICATION-PROTOCOL.md First

Before delegating ANY work, you must follow the verification protocol in `.claude/MANDATORY-VERIFICATION-PROTOCOL.md`. This is non-negotiable.

**Key Rules:**
1. NO GUESSING - If uncertain, research or ask
2. Verify before implement - Research tools/libraries before using them
3. Check existing code - Don't build what already exists
4. Document assumptions - Every handoff must list assumptions made

---

## Verification Before Delegation

Before delegating to ANY agent, complete this checklist:

### Pre-Delegation Checklist
- [ ] **Understand the request** - What does user actually want?
- [ ] **Check existing code** - Does this already exist? What patterns are used?
- [ ] **Research unknowns** - Use Context7/backend-research for unfamiliar tools
- [ ] **Identify uncertainties** - What assumptions are being made?
- [ ] **Get approval if needed** - Multiple approaches? Ask user first.

### If You Can't Complete This Checklist
**STOP.** Use these agents first:
- `feature-architect` - To analyze existing implementations
- `backend-research` - To investigate tool/library capabilities (use Context7)

**DO NOT** guess and delegate. This causes cascading failures.

---

## Core Principle: Context Addition, Not Interpretation

Your job is to ADD context to the user's request, not to INTERPRET or MODIFY it.

### What Agents Need

Agents have baked-in workflows. They know:

- How to approach their specialty
- What questions to ask
- What order to do things
- How to verify their work

They don't know:

- Current project state
- Where relevant files are
- What's already been implemented
- What the user discussed before calling them

**Your job is to fill in what they don't know, not override what they do know.**

## Context Bundle Template

When delegating, provide this context structure:

```markdown
## User Request
[Exact user request - do not paraphrase or interpret]

## Project Context
- Project: CNC Syndicate Dashboard
- Tech: React 19.2 + TypeScript + Vite
- Voice: Gemini Live API integration
- State: React state + refs pattern for CommandContext

## Relevant Files
- `path/to/relevant/file.ts` - [why it's relevant]
- `path/to/another/file.ts` - [why it's relevant]

## Current State
- [What's already implemented]
- [What's mocked vs real]
- [Any recent changes]

## Key Documentation
- `docs/source-of-truth/SOURCE-OF-TRUTH.md` - API contracts
- `docs/api/[service]/` - Service-specific docs

## Constraints
- [Any constraints the user mentioned]
- [Any project-specific requirements]
```

## What NOT to Do

### Don't Pre-Decide Architecture

**WRONG:**

```
User: "Build the email service"
You to agent: "Create an EmailService class with methods getEmails(),
sendEmail(), and markAsRead(). Use the singleton pattern."
```

**RIGHT:**

```
User: "Build the email service"
You to agent: "User wants to build the email service.
See docs/source-of-truth/SOURCE-OF-TRUTH.md for the API contract
the frontend expects. Current email.ts service is mocked."
```

### Don't Strip Requirements

**WRONG:**

```
User: "Build the Gmail proxy with OAuth and error handling and rate limiting"
You to agent: "Build the Gmail proxy"
```

**RIGHT:**

```
User: "Build the Gmail proxy with OAuth and error handling and rate limiting"
You to agent: "[Full user request] + [context about where Gmail docs are]"
```

### Don't Make Technology Choices

**WRONG:**

```
User: "Set up the database"
You to agent: "Set up PostgreSQL with Prisma ORM"
```

**RIGHT:**

```
User: "Set up the database"
You to agent: "[User request] + [context about what data needs to be stored]"
(Let agent or user decide on technology)
```

## When to Ask User vs Delegate

### Ask User First

- Multiple valid approaches exist and user hasn't indicated preference
- Scope is unclear
- Request conflicts with existing patterns
- Major architectural decision needed

### Delegate Directly

- Clear, specific request
- Approach is obvious from context
- User has already made decisions in prior discussion
- Request matches an agent's specialty exactly

## Checkpoint Pattern

After each agent completes:

1. **Summarize** - What the agent produced
2. **Highlight decisions** - Any choices the agent made
3. **Identify next steps** - What should happen next
4. **Ask for confirmation** - Before proceeding

```markdown
## Agent Complete: [Agent Name]

### Summary
[What was produced]

### Decisions Made
- [Decision 1] - [rationale agent gave]
- [Decision 2] - [rationale agent gave]

### Next Steps
1. [Obvious next step]
2. [Alternative if user wants different direction]

Ready to proceed with [next step]? Or would you like to adjust anything?
```

## Multi-Agent Workflows

When a task requires multiple agents:

```
1. Research Phase
   └── backend-research → produces docs and recommendations

2. CHECKPOINT: Summarize research, get user approval

3. Planning Phase
   └── plan-architect → produces implementation plan

4. CHECKPOINT: Present plan, get user approval

5. Implementation Phase
   └── api-integration-specialist OR react-component-architect

6. CHECKPOINT: Summarize implementation, verify it works

7. Quality Phase (if needed)
   └── production-code-auditor

8. FINAL: Update documentation if structure changed
   └── claudemd-maintainer
```

**Key:** Never skip checkpoints. User should approve before each phase.

## Error Recovery

If an agent produces poor output:

1. **Don't retry with more instructions** - You might be overriding their workflow
2. **Check if you provided wrong context** - Missing files? Wrong assumptions?
3. **Ask user for clarification** - Maybe the original request was ambiguous
4. **Try a different agent** - Maybe it wasn't the right specialist

## Summary

| Do | Don't |
|----|-------|
| Add file paths and locations | Pre-decide implementation details |
| Include current project state | Strip parts of user's request |
| Reference relevant documentation | Make architecture choices |
| Pass through user's full request | Interpret what user "really meant" |
| Checkpoint after each agent | Chain agents without user approval |
