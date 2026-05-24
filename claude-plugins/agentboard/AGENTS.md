# AGENTS.md

## Repo rule

If the task is correction-loop spec rescue or repair of the correction-loop
design/spec workflow, do not start from chat reconstruction or prose
rewriting.

## Required entry sequence for correction-loop spec rescue

Read these artifacts first, in order:

1. `docs/specs/spec-workflow.md`
2. `docs/specs/spec-session-status.md`
3. use CORE exactly as CORE requires for this workflow
4. `docs/specs/spec-chunk.md`
5. `docs/specs/spec-inventory.md`

Then use the repo-local `spec-rescue` skill and continue from the phase and
next safe step recorded in `docs/specs/spec-session-status.md`.

Take the current phase from `docs/specs/spec-session-status.md`.
Do not guess the phase from file contents or from chat reconstruction.

## CORE protocol guardrail

### RULE: APPROVAL REQUIRED BEFORE ANY WRITE TO CORE

Before calling ANY tool that writes data into or through CORE, you MUST
present what you intend to do and get explicit approval.

Tools that require approval before use:
- `memory_ingest` - show the full ingestion text first
- `add_reminder` - show the reminder text and schedule first
- `update_reminder` - show what will change first
- `execute_integration_action` - show the action and parameters first

Present the exact content, not a summary of it. Max must see the actual text
that will be stored. Then wait for approval before calling the tool.

This is not optional. A single incorrect write to CORE can propagate bad data
into every future session.

### RULE: ALL DATA MUST HAVE COMPLETE ENTITY CONNECTIONS

Every piece of data that enters CORE must contain everything CORE needs to
build correct graph connections. CORE extracts entities by name from the text
it receives. If a name is missing, abbreviated, or vague, the entity either
doesn't get created or doesn't connect to existing entities in the graph.

For every write to CORE:
- Repos: Owner and name - "Maxcogar/syndicatecnc-weekly-web-brief", never
  "the repo" or "the project"
- Files: Full paths from repo root - "src/api/handlers/auth.ts", never
  "the auth file" or "that handler"
- Packages/Dependencies: Full name and version when relevant -
  "python-fastmcp 2.0", never "the MCP library"
- APIs/Services: Proper name and endpoint when relevant -
  "ERPNext REST API /api/resource/Sales Order", never "the ERP endpoint"
- MCP Servers: Full name - "Engineering Design Navigator MCP server", never
  "the MCP server" or "the navigator"
- Infrastructure: Named - "Google Cloud Run", "Firebase Hosting",
  "HP t740 Docker host", never "the server" or "the cloud"
- Skills/Configs: With identifiers - "integration-builder skill at
  /mnt/skills/user/integration-builder/SKILL.md", never "that skill"
- People: Full name - "Max Cogar", never just "Max" or "the user"
- Organizations: Proper name - "CNC Syndicate", "Anthropic", never
  "the company"

Never use: "the repo", "the project", "the file", "that function", "the bug",
"the thing we fixed"

### START OF EVERY SESSION

**Step 1:** Call `initialize_conversation_session` (`new: true`). Store the
`sessionId` for the entire session.

**Step 2:** Identify the repo and work context. Determine:
- Which repository is being worked on (owner/name)
- What feature, bug, or task is the focus

**Step 3:** Call `memory_search` with a complete semantic question about the
repo or work being done.

CORE classifies every query into one of 5 types (aspect, entity lookup,
temporal, exploratory, relationship) and routes to the optimal search
strategy. The query must be a full natural-language question so CORE can
determine intent.

**Step 4:** If the session involves external services or integrations, call
`get_integrations` to verify connection status.

### END OF EVERY SESSION

**Step 1:** Write the full ingestion message.

**Step 2:** Present the ingestion message to Max for review. Do not call
`memory_ingest` until Max approves the content.

**Step 3:** Once approved, call `get_labels`, select the appropriate
label(s), and call `memory_ingest` with the approved text, `sessionId`, and
label ID(s).

If no label fits, ingest without a label. Do NOT guess.

### HOW TO WRITE THE INGESTION MESSAGE

Write as if the next Claude Code session has zero context and needs to pick
up exactly where this session left off. If a detail would be needed to
continue the work - find the right file, understand why a decision was made,
reproduce a bug, or know what's left to do - it must be in the message.

Format:

```text
<user>Max Cogar is working on {repo} - {what the session goal was, with enough context to understand why}</user>
<assistant>{What was done, decided, built, fixed, and what state the work is in}</assistant>
```

## Guardrail

Do not create extra workflow/process files for this spec-rescue flow unless
the owner explicitly asks for them.

## Conformance-scope guardrail

When a correction-loop session builds a conformance inspection list from the
current governing spec, scope is determined by affected-surface membership,
not by predicted edit likelihood.

- Do not exclude a file because it "probably" needs no edits.
- Do not exclude a file because the agent is uncertain whether it will need
  changes.
- Every exclusion must be explicitly justified from the governing spec and the
  current owner-approved scope.
- If the justification for exclusion is weak, missing, or merely predictive,
  keep the file in scope and record the uncertainty explicitly.
