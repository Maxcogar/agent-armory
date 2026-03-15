---
name: codebase-sweep
description: Skill for systematically discovering quality issues in existing codebases. Use when the user wants to clean up a vibe-coded app, audit codebase quality, find technical debt, survey an app for problems, or prepare an existing codebase for improvement. Triggers on "sweep my codebase", "clean up this app", "audit code quality", "find issues in this project", "this app is a mess", "technical debt", or "vibe coded".
---

# Codebase Sweep

Systematically discover every quality issue in a codebase through a single broad sweep, then organize findings into actionable workspace board cards for the orchestration pipeline to fix.

## Philosophy

The lack of focus IS the focus. Any competent engineer can spot a multitude of problems when their entire goal is to point out problems. Narrow passes ("look for error handling") cause inattentional blindness — you'll read past duplicated functions because that's not what you were told to find. The broad sweep avoids this entirely: the only instruction is "what's wrong here?"

Categories are not predefined. They emerge from what you find. A voice-controlled dashboard will produce different problem clusters than a Firebase migration app. Imposing categories wastes time on empty buckets and misses app-specific patterns.

Discovery doesn't have to be perfect. The audit wave in `/orchestrate` catches adjacent issues when fixing each card. The sweep finds the major problems; the fix-and-audit cycle catches stragglers.

---

## How to Read Code Critically

### Signals to Watch For

These are types of problems, not a checklist. You are not scanning for these categories in sequence — you are reading code and noting anything that's wrong. These signals help you calibrate what "wrong" looks like:

**Code doing the same thing in different ways.** Three different patterns for fetching data. Two ways to validate input. API calls with different error handling depending on who wrote that file. This is the #1 signal in vibe-coded apps — each feature was built with whatever approach felt right at the time.

**Error paths that silently swallow failures.** Empty catch blocks. `.catch(() => {})`. Functions that return `null` on failure with no logging or indication that something went wrong. Async operations with no error handling at all.

**Files that import everything or are imported by everything.** God modules that half the codebase depends on. Utility files that grew into dumping grounds. These are coupling hotspots — changing them breaks things in unexpected places.

**Functions longer than a screen that do multiple things.** Data fetching, transformation, validation, and rendering in one function. Business logic mixed into event handlers. These are untestable and fragile.

**Comments that contradict the code.** `// Validate user input` above a function that doesn't validate anything. `// TODO: add error handling` that's been there for months. Comments describing behavior the code no longer performs.

**State modified from multiple uncoordinated places.** Global variables updated from different files. UI state set directly instead of through a single state management pattern. Multiple sources of truth for the same data.

**Patterns that start strong and fall apart.** The first few files follow a clean pattern (maybe from a tutorial or template), then later files get progressively sloppier. This tells you what the intended pattern was and where discipline broke down.

**Dead code.** Unused imports, unreachable branches, commented-out blocks, exported functions nothing calls. Dead code obscures the real logic and creates false signals in dependency analysis.

**Hardcoded values.** API URLs, credentials, magic numbers, environment-specific paths baked into source files. These break on deployment and make configuration impossible.

**Missing boundaries.** Database queries in route handlers. Business logic in UI components. No distinction between "what the app does" and "how it presents it." These make the app impossible to test or refactor in isolation.

### How to Calibrate Severity

- **Critical** — Will cause data loss, security vulnerabilities, or crashes during normal use. Examples: SQL injection, unhandled promise rejection that kills the process, credentials in source code, race condition that corrupts data.

- **High** — Breaks functionality in edge cases, or blocks other improvements from being made safely. Examples: error handling that hides failures, tight coupling that makes isolated changes impossible, missing input validation on external inputs.

- **Medium** — Makes the codebase harder to work with but doesn't break user-facing functionality. Examples: duplicated logic, inconsistent patterns, functions doing too many things, poor naming.

- **Low** — Style, formatting, minor duplication, naming conventions. Things that matter for readability but don't affect correctness or maintainability in a meaningful way.

### How to Write Good Findings

**State what's wrong, not what to do about it.** Fixes come later during the planning wave. Your job is discovery.

Good: "Routes in `api/users.js`, `api/projects.js`, and `api/auth.js` each implement their own error handling pattern — try/catch with different response formats, inconsistent status codes, and `auth.js` has no error handling at all."

Bad: "Refactor error handling into a middleware."

**Reference specific files and functions.** Vague findings produce vague cards.

Good: "`Dashboard.jsx:142` — `fetchData()` is 89 lines long, handles API calls for three different data sources, parses responses, updates local state, and triggers two side effects."

Bad: "Dashboard component is too complex."

**Note when the same issue appears across multiple files.** This is a pattern, not an isolated incident, and it becomes one card — not five.

Good: "Silent error swallowing in `api/users.js:34`, `api/projects.js:67`, `api/auth.js:12`, `services/dataSync.js:89` — all have `.catch(() => {})` or empty catch blocks."

Bad: Individual findings for each file's empty catch block.

---

## Findings Document Format

Write findings to `docs/sweep/YYYY-MM-DD-findings.md` in the target project. Raw entries, organized by file or file group:

```markdown
# Codebase Sweep Findings — [date]

**Target:** [codebase path]
**Files scanned:** [count]
**Agent:** [agent_id]

---

### src/api/users.js
- **high** — No input validation on any route parameter. User IDs from URL params passed directly to database queries without sanitization.
- **medium** — Error responses use three different formats: `{error: msg}`, `{message: msg}`, and raw strings. No consistency.

### src/components/Dashboard.jsx
- **medium** — `fetchData()` (line 142) is 89 lines. Fetches from 3 endpoints, parses responses, updates state, and triggers side effects. Does at least 5 distinct things.
- **low** — 4 unused imports at top of file.

### src/api/users.js, src/api/projects.js, src/api/auth.js
- **high** — Each file implements its own error handling pattern. `users.js` uses try/catch with `{error}` responses, `projects.js` uses `.catch()` with `{message}`, `auth.js` has no error handling on 3 of 5 routes.
```

Keep findings terse. One to two sentences max. Include file paths and line numbers. Group cross-file patterns together.

---

## Triage Process

After the sweep is complete, read your findings document and organize:

1. **Group related findings.** Multiple files with the same problem become one group. "Missing error handling in routes" not "missing error handling in users.js" + "missing error handling in projects.js."

2. **Let categories emerge.** Name the groups based on what you actually found. Don't force findings into predetermined buckets. If you found 12 issues related to inconsistent API response formats, that's a category. If you found 1 accessibility issue, it joins a broader group or stands alone — whatever makes sense.

3. **Set priority.** Based on severity concentration and dependency ordering. A group with 3 critical findings outranks a group with 10 low findings. A group that blocks other groups from being fixed outranks everything.

4. **Identify dependencies.** "Separate business logic from UI" must happen before "add unit tests for business logic." Set `depends_on` on the cards accordingly.

5. **Create workspace cards.** One card per group. Description includes the relevant findings (summarized, not copy-pasted). Priority from step 3. Dependencies from step 4.

---

## What This Skill Does NOT Cover

- **Fixing issues** — that's the planning and implementation waves in `/orchestrate`
- **Running linters or static analysis** — this is an agent reading code and reasoning about quality, not running tools
- **Prescribing architecture** — findings state what's wrong, not what the target architecture should be
- **Prioritizing business features** — this is about code quality, not product decisions
