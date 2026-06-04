---
Description: Team-based document review using code-tracer + doc-reviewer agents with active collaboration, codegraph, and RAG verification
---

# Team Document Review

The user will specify which document to review (by phase number, document title, or document ID). Your job is to orchestrate a multi-agent team that reviews the document for correctness using the /review workflow methodology.

## Step 0: Find the Document

If the user gave a phase number or title, find the document:
```
agentboard_list_documents(project_id="bc4e7717-8232-4084-bc26-60e1bf324d24")
```
Extract the document ID, title, and status. Confirm with the user before proceeding.

## Step 1: Create the Team

```
TeamCreate: team_name="doc-review-{phase}", description="Review {document title}"
```

Create 2 tasks:
1. **"Build codegraph and run RAG analysis"** — assigned to code-tracer
2. **"Review document and trace code flows end-to-end"** — assigned to doc-reviewer, blocked by task 1

## Step 2: Spawn Agents

### code-tracer (general-purpose, background)

Prompt must include:
- Team name and task assignment
- The /review workflow Steps 1-2 (codegraph + RAG):
  1. `codegraph_scan` the codebase
  2. `codegraph_get_stats` for most connected files
  3. For each file the document references: `codegraph_get_dependencies`, `codegraph_get_dependents`, `codegraph_get_subgraph(depth=2)`
  4. `codegraph_get_change_impact` on all files that will be modified
  5. `rag_search` for each major feature area
  6. `rag_query_impact` on every referenced source file
- Instruction to share ALL findings with doc-reviewer via SendMessage
- Instruction to actively ask doc-reviewer questions when something looks off
- The document ID and agentboard project ID

### doc-reviewer (general-purpose, background)

Prompt must include:
- Team name and task assignment
- The /review workflow Steps 3-5 (read doc, trace flows, write walkthrough):
  1. Fetch document via `agentboard_get_document`
  2. List every verifiable claim (field names, data shapes, rate limits, timeouts, error codes, session lifecycles, auth requirements, enum values)
  3. For each endpoint: read the ENTIRE route handler, check input validation, ALL processing steps, exact `res.json()` response, error handling paths
  4. Trace full lifecycles (creation -> mutation -> persistence -> response -> deletion)
  5. Match exact field names and shapes (camelCase vs snake_case matters)
  6. Check frontend payload construction (App.tsx callers), not just backend validation
  7. Grep for nested property access (e.g., `step.action` vs plain string)
  8. Check package.json, index.html, vite.config.ts for ecosystem traces
- The core rules: NEVER trust the document, trace full lifecycles, match exact field names, never suggest removing features, correctness over speed
- Instruction to actively ask code-tracer questions via SendMessage
- The document ID and agentboard project ID

## Step 3: Send Collaboration Directive

Immediately after spawning both agents, broadcast:

> You must actively ask EACH OTHER questions as you work. Don't just send finished results.
> code-tracer: When you find dependency gaps, message doc-reviewer immediately.
> doc-reviewer: When you find suspicious claims, ask code-tracer to run specific checks.
> Use SendMessage with type "message" and the other agent's name as recipient.

## Step 4: Monitor and Relay

- Relay significant findings to the user as they come in
- If agents stop collaborating, nudge them
- If an agent sends a report, check whether it incorporates the other agent's findings — nudge if not
- Let the user decide when the review is thorough enough

## Step 5: Apply Fixes

When the user approves, spawn a doc-fixer agent (general-purpose, background) with:
- The complete fix list from doc-reviewer's final report
- The document ID and agentboard project ID
- Instructions to fetch, update, and verify the document
- Keep document status as-is (don't change approved to draft)

## Step 6: Cleanup

After fixes are applied and confirmed:
1. Shutdown all agents
2. TeamDelete to clean up
3. Report final summary to user

---

## Anti-Patterns from Experience

| Mistake | Prevention |
|---------|------------|
| Agents start over when respawned | Tell them to build on previous findings, not redo work |
| Agents don't follow /review workflow | Broadcast correction: use codegraph + RAG tools, not just source reading |
| Doc-reviewer ignores code-tracer findings | Nudge doc-reviewer to integrate and cross-verify |
| Fixer applies fixes before review is done | Don't spawn fixer until user confirms review is complete |
| Agents work in isolation | Broadcast collaboration directive immediately after spawn |
| One agent's report doesn't include the other's findings | Ask for consolidated report that integrates both agents' work |

## Deliverable Format

The final walkthrough must include:
1. **Verified Claims table** — every claim, source file:line, verdict
2. **Issues Found** — severity, what doc says vs what code shows, why it matters
3. **Verdict** — Completeness, Accuracy, Actionability ratings (1-10)
4. **Fixes Required** — numbered, severity-tagged, all mandatory
