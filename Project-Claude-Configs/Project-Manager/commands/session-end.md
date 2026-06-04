---
name: session-end
description: Mandatory session wrap protocol — expert-standard check, completion audit, clean up, update docs, save auto-memory, CORE ingest with exact protocol compliance.
---

# Session End

Do these in order. The completion audit at step 2 and the CORE ingest at step 7 have strict rules — follow them literally.

## 1. Apply the expert-standard to the session's output

Before wrapping, re-invoke `Skill(skill: "expert-standard")` and walk the session's work through the frame one more time. For every non-trivial decision made this session:

- Is there a named engineering standard behind it, or am I pattern-matching against the codebase?
- Did I write `unnamed approvals` like "looks good" or "clean implementation" anywhere without naming what makes it good?
- Did I silently replicate an existing bad pattern without flagging it?

If any of these surface problems, fix or flag them NOW in the handoff — do not let them survive to the PR review cycle.

## 2. Completion audit — done or explicitly deferred

List every commitment made this session — every verification criterion, every plan step, every flagged follow-up — and mark each:

- **DONE** with concrete evidence (test file + pass, commit hash, live verification output).
- **DEFERRED** with a **valid reason** stated explicitly. Valid reasons include: plan sequencing dependency (Plan N Step M blocked by Plan K Step L), out-of-scope for the agreed task, hard tool/platform limit that cannot be worked around in the session window.

Not valid reasons: "I didn't get to it", "it seemed hard", "I hedged earlier and didn't come back". If the only reason something is deferred is that I stopped, it is NOT deferred — finish it.

Every deferred item MUST be:
- Stated clearly in the session-end chat report (not buried).
- Added to the current session's handoff doc under an explicit "Deferred" section with the reason.
- Added to the production-readiness-checklist.md Notes column if it maps to a deployment-readiness finding.

If the session produced a PR, verify the plan's own verification criteria are satisfied (e.g., Plan 4 has 12 criteria at `docs/deployment-readiness/plans/plan4-data-integrity-runtime-reliability.md` lines 447-462). For each criterion: pass, fail, or deferred-with-reason. No silent gaps.

## 3. Clean up

- Kill stray node/python processes: `taskkill //F //IM node.exe` (and python.exe if any test scripts were run).
- Remove temp files: `rm -f tmp-*.db tmp-*.db-*`.
- Revert unintended `package.json` / `package-lock.json` changes from cross-platform install attempts (check `git diff` for `"agentboard": "file:.."` or similar noise and `git restore` it).

## 4. Update deployment-readiness docs if work state changed

If a PR opened or state shifted this session:

- `docs/deployment-readiness/roadmap.md` — update the Plan N row with accurate status (e.g., "Steps 1–N implemented on PR #M (open); Step X deferred because ..."). Don't mark a plan "done" until it's merged AND deployed.
- `docs/deployment-readiness/production-readiness-checklist.md` — for any finding the current PR closes, populate the Notes column with PR #, test coverage summary, and state ("awaits merge + deploy before checking"). Boxes stay `[ ]` until merged + verified in prod.
- The current session's handoff doc in `docs/deployment-readiness/handoffs/2026-MM-DD-<topic>.md` — ensure it covers: closed findings with `review.md` line citations, every non-trivial decision with a named standard, threat model where security-relevant, test coverage per plan verification criterion, **explicit Deferred section from step 2**, known tech debt flagged, next-session steps. Attribution corrections go here, not in amended commit messages.

## 5. Update auto-memory

Auto-memory root: `C:\Users\maxco\.claude\projects\C--Users-maxco-Documents-Project-Manager-Project-Manager-Latest-Project-Manager\memory\`

For each durable learning from this session, create one memory file with frontmatter and add a one-line pointer to `MEMORY.md` under the right section (Feedback / Project / Reference / User).

Save only what's NOT already captured and NOT derivable from the code or `git log`. Do not save: code patterns, architecture obvious from files, debugging journeys that led nowhere, routine dependency installs.

Save when relevant:
- **Feedback**: corrections from the user AND validated successes. Include **Why:** (the reason) and **How to apply:** (when the rule kicks in).
- **Project**: time-sensitive state (open PRs, deferred work). Flag decay.
- **Reference**: pointers to external systems or tool locations not on PATH.

## 6. Commit + push doc updates

If steps 4–5 produced repo changes, commit them with a descriptive message and push:
```
git add <paths> && git commit -m "..." && git push
```

Use `/c/Program Files/GitHub CLI/gh.exe` for PR creation/updates if needed.

## 7. CORE Memory ingestion — follow the protocol EXACTLY

The global `CLAUDE.md` defines this protocol. Max enforces it literally. Violations flagged in prior sessions: entity abbreviations on second mention, missing XML tags, calling `get_labels` before approval, treating "follow exactly" as approval.

### 7a. Write the full ingestion text

Format (tags must be literal in the final `message` parameter, not just in presentation):

```
<user>Max Cogar is working on Maxcogar/Project-Manager — {session goal with enough context}</user>

<assistant>{What was done, decided, built, fixed. State of the work. What's next. Every deferred item from step 2 stated clearly.}</assistant>
```

Entity naming rules — apply on EVERY mention, not just first:
- **Repository**: `Maxcogar/Project-Manager` every time. Never "the repo".
- **Files**: full path from repo root every time (`server/src/routes/documents.js`, not "documents.js" or "the route").
- **Services**: full name every time — `Google Cloud Run`, `Google Cloud Identity-Aware Proxy` (not `IAP` on second mention), `Google Cloud Storage`, `Litestream`.
- **MCP server**: `AgentBoard MCP server` (with file path `agentboard_mcp/server.py` when referencing the file).
- **Findings**: `Finding C8 (Serious, "Document status transitions have no state machine", docs/deployment-readiness/review.md §C8 line 69)` — full citation.
- **Plans**: `Plan 4 from docs/deployment-readiness/plans/plan4-data-integrity-runtime-reliability.md`.
- **Handoffs**: full path — `docs/deployment-readiness/handoffs/2026-MM-DD-<topic>.md`.
- **People**: `Max Cogar`, never just "Max".
- **Commits**: `commit <hash>` in the `Maxcogar/Project-Manager` repository.
- **PRs**: `pull request #N at https://github.com/Maxcogar/Project-Manager/pull/N`.

What to capture:
- Architecture decisions with the **Why** (not just the what).
- Bug root causes + exact fixes (file paths, function names).
- New files or structural changes (full paths).
- What's working vs broken — concrete, testable.
- **Every deferred item with its stated reason** (matches step 2 + handoff).
- What's next — specific enough to start immediately.
- Known tech debt flagged in the handoff.

What NOT to capture:
- Every file touched.
- Dead-end debugging that didn't lead to the fix.
- Conversational back-and-forth.
- Info already stored in a previous ingestion this session.

### 7b. Present the exact text for approval

Show Max the full `message` string, including the XML tags, exactly as it will be passed to `memory_ingest`. Do not summarize it. Also present the proposed label IDs.

### 7c. Wait for explicit approval

Valid approval: `approved`, `looks good`, `ok`, `yes`, `go`, or similar explicit affirmation.

NOT approval: `follow exactly`, `do it right`, or any meta-instruction. Keep waiting.

### 7d. After approval, in sequence

1. Call `mcp__claude_ai_CORE_Memory__get_labels` (only now — not before approval).
2. Select label IDs that clearly match the session content. If nothing fits, ingest without a label rather than guess.
3. Call `mcp__claude_ai_CORE_Memory__memory_ingest` with:
   - `message`: the full approved text with XML tags literal
   - `sessionId`: the one from `/session-start`
   - `labelIds`: the selected array (or omit if none fit)

### 7e. Confirm

Report the returned `id` and the selected labels so Max can verify the write landed.

## 8. Final state report

One paragraph summary:
- Branch + commits + PR status.
- CORE ingest `id`.
- **Deferred items** (if any) — each with its reason.
- Unresolved items for next session.
- Working tree clean? No stray processes? No temp files?
