# Audit Swarm

Spawn a parallel swarm of specialized production code auditors. Each subagent focuses on one audit domain, writes findings to a file, and a synthesizer consolidates the results.

## Arguments

`$ARGUMENTS` specifies the audit scope. Examples:
- `backend/` — audit the entire backend directory
- `src/api/auth.ts src/api/users.ts` — audit specific files
- `the new payment integration` — audit a described feature (you determine which files)
- (empty) — audit the full project

## Rigor Mode

This swarm runs in full-rigor mode by design. Invoking `audit-swarm` is itself the opt-in — the swarm assumes the invoker wants a thorough audit appropriate to production code with real users, and does not offer a quick / prototype / MVP mode. If the code being audited is a prototype, the appropriate signal is either (a) don't run the swarm, or (b) run it and treat the output as a list of what would need to be addressed before production rather than as a blocking gate. The swarm does not self-adjust its rigor based on project stage.

## Setup — Mandatory Before Dispatch

Before dispatching subagents, YOU must gather the context they all need. Do not skip any of these steps.

### 1. Read the Plan

If there is a planning doc, architecture doc, spec, or CLAUDE.md that describes what the code should do — read it. The subagents need to know what was intended, not just what exists. Check for:
- `docs/planning/` or `docs/plans/`
- `CLAUDE.md`, `ARCHITECTURE.md`, `README.md`
- Any spec or design doc referenced in `$ARGUMENTS`

If no planning docs exist, note that in the shared context — the subagents will audit against engineering standards only, without spec compliance.

### 2. Search CORE Memory

Use the `core-memory` MCP tool to search for:
- Past architectural decisions related to this code
- Previous audit findings or reviews for this project
- Historical context on why certain patterns were chosen
- Known issues or incidents related to this area
- Team decisions about coding standards and conventions

Include relevant CORE results in the shared context block. Past architectural decisions help subagents avoid contradicting established choices, and past findings help them avoid duplicating known issues.

**Important framing**: claims in CORE results — especially past findings, previously-identified issues, and historical architectural assertions — are *candidate claims*, not verified facts about the current code. Code changes. Prior findings may have been fixed, invalidated, or were wrong in the first place. Subagents must re-derive any claim from current source before treating it as a finding or an exclusion. This is the Expert Standard's prior-artifact-replication rule applied at the context-gathering stage: prior artifacts are leads, not conclusions.

### 3. Determine the Audit Target

If `$ARGUMENTS` names files or directories, those are the target. If it describes a feature, identify the relevant files using grep, file listing, and codegraph if available. If empty, the target is the full project source.

### 4. Create the Output Directory

Create `docs/audits/YYYY-MM-DD/` (today's date). If that directory already exists (multiple audits same day), append a sequence number: `docs/audits/YYYY-MM-DD-2/`.

### 5. Build the Shared Context Block

Every subagent receives this same preamble:

```
## Audit Target
[List of files/directories being audited]

## Project Context
[Language, framework, what the project does, deployment target]

## Plan / Spec Summary
[Key requirements from planning docs, or "No planning docs found — audit against engineering standards only"]

## Relevant Past Decisions (from CORE)
[Architectural decisions, past review findings, known issues, or "No relevant CORE context found"]

**Treatment**: Items in this section are candidate claims, not verified facts. Re-derive any claim from current source before treating it as a finding or an exclusion.

## Scope
[What the user asked to be audited — their exact words from $ARGUMENTS]
```

## Dispatch

Read each subagent prompt file from `~/.claude/commands/audit-swarm/`, then spawn all 7 in parallel using `Task`.

Each `Task` call includes:
1. The full subagent prompt text (read from file)
2. The shared context block (built above)
3. The output file path to write findings to

| Subagent | Prompt File | Output File |
|----------|------------|-------------|
| Security | `~/.claude/commands/audit-swarm/security-auditor.md` | `docs/audits/YYYY-MM-DD/01-security.md` |
| Error Handling | `~/.claude/commands/audit-swarm/error-handling-auditor.md` | `docs/audits/YYYY-MM-DD/02-error-handling.md` |
| Type Safety & Validation | `~/.claude/commands/audit-swarm/validation-auditor.md` | `docs/audits/YYYY-MM-DD/03-validation.md` |
| Performance | `~/.claude/commands/audit-swarm/performance-auditor.md` | `docs/audits/YYYY-MM-DD/04-performance.md` |
| Architecture | `~/.claude/commands/audit-swarm/architecture-auditor.md` | `docs/audits/YYYY-MM-DD/05-architecture.md` |
| Production Infrastructure | `~/.claude/commands/audit-swarm/production-readiness-auditor.md` | `docs/audits/YYYY-MM-DD/06-production-readiness.md` |
| Test Coverage | `~/.claude/commands/audit-swarm/test-coverage-auditor.md` | `docs/audits/YYYY-MM-DD/07-test-coverage.md` |

## After All Subagents Complete

Once all 7 subagents have finished and written their findings files:

1. **Read all 7 findings files.**

2. **Synthesize.** Read `~/.claude/commands/audit-swarm/synthesizer.md` and follow its instructions to produce the consolidated report at `docs/audits/YYYY-MM-DD/00-consolidated-report.md`.

3. **Report to user.** Summarize: how many findings at each severity level, which domains had the most critical issues, and the recommended fix priority. Point the user to the consolidated report.

## File Layout After Completion

```
docs/audits/YYYY-MM-DD/
├── 00-consolidated-report.md    # Synthesized findings + priority
├── 01-security.md               # Security auditor findings
├── 02-error-handling.md         # Error handling findings
├── 03-validation.md             # Validation findings
├── 04-performance.md            # Performance findings
├── 05-architecture.md           # Architecture findings
├── 06-production-readiness.md   # Production readiness findings
└── 07-test-coverage.md          # Test coverage findings
```
