---
name: wrap-up
description: End-of-session handoff — add progress notes, log activity, and summarize state for the next agent
---

# AgentBoard Wrap-Up

Cleanly end a session so the next agent can pick up seamlessly.

## Instructions

Follow these steps in order.

1. **Identify current work** by calling `agentboard_list_tasks` filtered by `status=in-progress` for the active project.

2. **For each in-progress task**, add a progress note documenting what was accomplished this session:
   - Call `agentboard_update_task` with a note containing:
     - What was done
     - What remains
     - Any blockers or decisions made
     - Files touched (if implementation work)
   - Do NOT change the task status unless the work is actually complete

3. **If work is complete on a task**, transition it properly:
   - Implementation tasks: move to `review` (requires notes)
   - Milestone tasks: submit the document via `agentboard_submit_document` if the document is ready

4. **Add a log entry** by calling `agentboard_add_log_entry` summarizing the session:
   - Action: `log_entry`
   - Detail: 2-3 sentence summary of what was accomplished

5. **Get final project state** by calling `agentboard_get_project` and `agentboard_list_tasks`.

6. **Show handoff summary** to the user:

   ```
   ## Session Summary

   **Project**: [name] — Phase [N]/13 ([phase name])

   ### Completed This Session
   - [list of completed items]

   ### In Progress
   - [task title] — [what was done, what remains]

   ### Blockers / Notes for Next Agent
   - [any blockers, decisions, or context the next agent needs]

   ### Next Steps
   - [what the next agent should do first]
   ```

7. **Inform the user**: "Session wrapped up. Notes have been saved to AgentBoard. The next agent can run `/pickup` to continue."
