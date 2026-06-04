# Agent Quick Guide

Quick reference for selecting the right agent. Use this before delegating any primary task.

## Agent Roster

| Agent | Use For | Model |
|-------|---------|-------|
| `plan-architect` | Creating implementation plans before coding | Opus |
| `implementation-plan-architect` | Detailed feature plans with file:line references | Sonnet |
| `backend-research` | Researching APIs, libraries, patterns before implementation | Sonnet |
| `api-integration-specialist` | Replacing mocks with real API integrations | Sonnet |
| `react-component-architect` | Complex React components, hooks, state patterns | Sonnet |
| `production-code-auditor` | Security review, production readiness audit | Opus |
| `claudemd-maintainer` | Syncing CLAUDE.md after structural changes | Haiku |

## Decision Tree

```
Need to build something new?
├── Do you know HOW to build it?
│   ├── YES → plan-architect → then implementation agent
│   └── NO → backend-research FIRST → then plan-architect
│
Need to integrate an external API?
├── Is there documentation in docs/api/?
│   ├── YES → api-integration-specialist
│   └── NO → backend-research FIRST → then api-integration-specialist
│
Need to build React components?
└── react-component-architect

Need security/production review?
└── production-code-auditor

Made structural changes to codebase?
└── claudemd-maintainer (at session end)
```

## Agent Details

### plan-architect

**When to use:**

- Before implementing any feature
- When you need a detailed plan with file:line references
- For multi-step implementations

**What it does:**

- Gathers context from codebase and memory
- Verifies actual implementation status (doesn't trust docs)
- Creates detailed implementation steps
- Generates TodoWrite tracking items

**What it does NOT do:**

- Write code (planning only)

---

### backend-research

**When to use:**

- Before implementing ANY new API integration
- When encountering unfamiliar libraries
- When you need to understand authentication flows
- Before making technology decisions

**What it does:**

- Uses Context7 for library documentation
- Web searches for API documentation
- Creates docs in `docs/api/[service]/`
- Stores findings in core-memory

**CRITICAL:** Always use this BEFORE implementation when dealing with:

- ERPNext API
- Google Calendar/Gmail API
- Microsoft Graph API
- Autodesk Forge API
- Any new library

---

### api-integration-specialist

**When to use:**

- Replacing mock services with real API calls
- Building API client code
- Implementing error handling for external services

**What it does:**

- Creates type-safe API clients
- Implements retry logic and error handling
- Handles authentication flows
- Maintains data contracts

**Prerequisite:** Research should be done first (backend-research)

---

### react-component-architect

**When to use:**

- Building complex React components
- Refactoring component architecture
- Performance optimization
- Custom hooks development

**What it does:**

- Designs component hierarchies
- Implements proper state patterns
- Maintains voice command integration compatibility
- Preserves refs + state pattern for CommandContext

**CRITICAL:** Must preserve voice command integration

---

### production-code-auditor

**When to use:**

- Before deploying to production
- After completing a major feature
- When security review is needed
- For code quality assessment

**What it does:**

- Security vulnerability analysis
- Error handling audit
- Performance review
- SOLID principles check
- Production readiness checklist

**Model:** Opus (thorough analysis)

---

### claudemd-maintainer

**When to use:**

- After sessions that changed project structure
- When new files/directories were created
- When dependencies changed
- At session end (if structural changes were made)

**What it does:**

- Scans package.json for version changes
- Checks directory structure
- Updates CLAUDE.md to match reality
- Preserves user content

**Model:** Haiku (fast, focused)

## Common Workflows

### New Feature Implementation

```
1. Discuss with user → understand requirements
2. backend-research (if new APIs/libraries involved)
3. plan-architect → create implementation plan
4. User approves plan
5. api-integration-specialist OR react-component-architect
6. production-code-auditor (if significant)
7. claudemd-maintainer (if structure changed)
```

### Bug Fix

```
1. Understand the bug
2. If simple → fix directly
3. If complex → plan-architect first
4. Implement fix
5. Verify
```

### API Integration

```
1. backend-research → understand the API
2. plan-architect → plan the integration
3. api-integration-specialist → implement
4. production-code-auditor → review
```
