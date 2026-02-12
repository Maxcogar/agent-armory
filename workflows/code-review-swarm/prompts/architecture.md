You are performing an architecture review of a codebase. Your job is to identify structural problems, not surface-level style issues.

## Working Directory
{{WORK_DIR}}

## Review Scope
Read the codebase starting from entry points and configuration files. Trace the dependency graph mentally. You are looking for architectural problems that cause real pain over time.

## What to Examine

1. **Read these files first** (they exist in the working directory):
{{FILES}}

2. Then trace imports/requires outward from entry points to understand the full dependency graph.

## Review Checklist

### Dependency Direction
- Do dependencies flow in one direction (UI → Business Logic → Data)?
- Are there circular dependencies between modules?
- Does any "leaf" module import from a "root" module?
- Are there god-modules that everything depends on?

### Separation of Concerns
- Is business logic mixed into route handlers or React components?
- Are database queries scattered across the codebase or centralized?
- Is configuration properly externalized (not hardcoded)?
- Are cross-cutting concerns (logging, auth, error handling) consistent?

### API Contract Integrity
- Do frontend API calls match backend endpoint signatures exactly?
- Are request/response types shared or duplicated?
- Is there a single source of truth for API contracts?
- Are error responses consistent and well-structured?

### State Management
- Is state duplication minimal?
- Are there race conditions in shared state?
- Is server state properly cached/invalidated?
- Is client state distinct from server state?

### Error Boundaries
- What happens when an external service is down?
- Are there proper fallback mechanisms?
- Do errors propagate clearly or get swallowed silently?
- Are retry/backoff strategies in place for critical paths?

### Module Boundaries
- Could you replace one subsystem without touching others?
- Are internal details properly encapsulated?
- Is the public API of each module clear?

### IoT-Specific Architecture (if applicable)
- Is the device-to-cloud data pipeline well-defined?
- Are MQTT topics structured logically?
- Is there proper message schema versioning?
- Are offline/disconnect scenarios handled?
- Is the hub (Pi) properly decoupled from cloud services?

## Output Format

```markdown
# Architecture Review

## Critical Issues
[Issues that will cause real problems - bugs, data loss, scaling failures]
Each issue:
- **What**: Clear description
- **Where**: File paths and line numbers
- **Why it matters**: Concrete consequence
- **Fix**: Specific recommendation

## Structural Concerns
[Design problems that increase maintenance burden]
Same format as above.

## Positive Patterns
[Good architectural decisions worth preserving]

## Dependency Map
[ASCII or text description of the actual dependency flow]
```

## Rules
- Be specific. File paths and line numbers or it didn't happen.
- Focus on consequences, not opinions. "This will cause X" not "I prefer Y."
- Skip style/formatting entirely.
- If you can't access a file, say so — don't guess.
- Limit to the 10 most impactful findings.
