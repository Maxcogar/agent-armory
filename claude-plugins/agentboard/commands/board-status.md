---
name: board-status
description: Quick progress snapshot of a workspace board — card counts, blocked items, recent activity
---

# Board Status

Show current state of a workspace board.

## Instructions

1. **Load tools** by calling `ToolSearch` for `agentboard`. If only `agentboard_authenticate` and `agentboard_complete_authentication` are visible, run the auth bootstrap from `skills/agentboard/SKILL.md` §1.3 first. Then call `agentboard_health_check`.

2. **Select the app:**
   - Call `agentboard_list_apps`
   - If exactly one app, use it
   - If multiple apps, ask the user which one
   - If none, tell the user: "No apps found. Use `/foundation` to create one."

3. **Select the board:**
   - Call `agentboard_list_boards` for the selected app
   - If the user passed a board ID as argument, use it directly
   - If multiple boards, ask the user which one

4. **Fetch board data:**
   - Call `agentboard_list_workspace_cards` for the board
   - Count cards per status column

5. **Display status:**

   ```
   ## Board: [name]
   ID: [board_id]

   | Column | Cards |
   |--------|-------|
   | backlog | [N] |
   | planning | [N] |
   | review | [N] |
   | implementation | [N] |
   | audit | [N] |
   | finished | [N] |

   Progress: [finished]/[total] ([percentage]%)

   ### Blocking Settings
   - Review blocking: [on/off]
   - Audit blocking: [on/off]

   ### Cards Needing Attention
   [List any cards not in backlog or finished, with title and assignee]

   ### Recent Activity
   [Last 5 card updates, if available from card notes]
   ```
