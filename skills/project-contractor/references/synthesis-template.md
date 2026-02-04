# SOURCE-OF-TRUTH Template

Use this template when synthesizing subagent reports into the final SOURCE-OF-TRUTH.md.

---

```markdown
# SOURCE OF TRUTH
<!-- This file is the canonical reference for this project. Claude must consult this before making changes. -->

**Generated**: [timestamp]
**Project**: [name from package.json]
**Last validated by user**: [pending/date]
**Survey version**: 1.0

---

## Quick Commands

Copy-paste ready commands that ACTUALLY WORK (tested during survey).

### Start Development
```bash
[CANONICAL COMMAND - from operations report]
```
Ports: [list ports used]
Prerequisites: [any required services]

### Database Migration
```bash
[CANONICAL COMMAND]
```
Note: [any important notes]

### Run Tests
```bash
[CANONICAL COMMAND]
```

### Build for Production
```bash
[CANONICAL COMMAND]
```
Output: [where build artifacts go]

### Deploy
```bash
[CANONICAL COMMAND or describe manual process]
```

---

## Architecture

### Stack Summary
- **Frontend**: [framework] v[version]
- **Backend**: [framework] v[version]  
- **Database**: [type]
- **Real-time**: [WebSocket/MQTT/SSE/none]
- **Auth**: [method]

### Directory Structure
```
[simplified tree showing major directories and their purposes]
```

### Entry Points
| Component | File | Purpose |
|-----------|------|---------|
| Frontend | [path] | [main UI entry] |
| Backend | [path] | [API server] |
| [other] | [path] | [purpose] |

---

## Connections & Integrations

### External Services
| Service | Purpose | Auth | Env Vars |
|---------|---------|------|----------|
| [name] | [what it does] | [API key/OAuth/etc] | [var names] |

### Database
- **Type**: [PostgreSQL/MongoDB/etc]
- **Connection**: `[ENV_VAR_NAME]`
- **Schema location**: [path]
- **Migrations**: [path or command]

### Real-Time (if applicable)
- **Protocol**: [WebSocket/MQTT/etc]
- **Server**: [file path]
- **Events**: [list main events]

---

## Environment Variables

All required environment variables for this project:

| Variable | Purpose | Example | Required |
|----------|---------|---------|----------|
| [NAME] | [what it's for] | [example value] | [yes/no] |

**Where to get values**:
- [SERVICE]: [how to obtain the key/secret]

---

## Critical Files

Files that require extra caution or should not be modified without discussion:

| File | Reason |
|------|--------|
| [path] | [why it's critical] |

---

## Known Issues

Current problems or technical debt:

| Issue | Location | Priority | Notes |
|-------|----------|----------|-------|
| [description] | [file/area] | [high/med/low] | [context] |

---

## Project Conventions

Patterns observed in this codebase:

### Naming
- Files: [kebab-case/camelCase/etc]
- Components: [PascalCase/etc]
- Variables: [camelCase/etc]

### Code Organization
- Components go in: [path]
- Utils/helpers go in: [path]
- API routes go in: [path]
- Types go in: [path]

### Patterns Used
- [State management approach]
- [API call pattern]
- [Error handling pattern]

---

## What Claude Must Ask About

These areas are not fully understood and require user input before changes:

1. [Topic] - [what's unclear]
2. [Topic] - [what's unclear]

---

## Assumptions Log

| Date | Assumption | Basis | Verified |
|------|------------|-------|----------|
| [date] | [what was assumed] | [evidence] | [yes/no] |

---

## Change Log

| Date | Change | By |
|------|--------|-------|
| [date] | Initial survey | Claude |

---

## Validation Status

- [ ] User has reviewed Quick Commands
- [ ] User has reviewed Architecture
- [ ] User has reviewed Environment Variables
- [ ] User has confirmed Critical Files list
- [ ] User has approved this document

**User signature**: _________________ **Date**: _________
```

---

## Synthesis Checklist

When creating SOURCE-OF-TRUTH.md from subagent reports:

1. **Quick Commands**
   - Take ONLY tested/working commands from Operations report
   - If conflicts exist, use the one that was actually tested
   - Include prerequisites and port information

2. **Architecture**
   - Use Structure report for directory info
   - Use Connections report for tech stack
   - Keep it high-level and scannable

3. **Connections**
   - Pull directly from Connections report
   - Double-check env var names are accurate

4. **Environment Variables**
   - Consolidate from all reports
   - Mark which are required vs optional
   - Note how to obtain values if known

5. **Critical Files**
   - Entry points from Structure report
   - Config files that affect everything
   - Any files mentioned in State report as problematic

6. **Known Issues**
   - TODOs/FIXMEs from State report
   - Vulnerabilities from Dependency report
   - Any broken commands from Operations report

7. **Conventions**
   - Inferred from Structure and code patterns
   - If unsure, add to "What Claude Must Ask About"

8. **Assumptions Log**
   - Start with any assumptions made during survey
   - This list grows as Claude works on the project
