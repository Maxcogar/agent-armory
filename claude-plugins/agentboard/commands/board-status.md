---
name: board-status
description: Quick progress snapshot of a workspace board — card counts, blocked items, recent activity
---

# Board Status

Show current state of a workspace board.

## Instructions

1. **Load tools** by calling `ToolSearch` for `agentboard`. Call `agentboard_health_check`.

2. **Select the board:**
   - Call `agentboard_list_apps`, then `agentboard_list_boards` for the target app
   - If the user passed a board ID as argument, use it directly
   - If multiple boards, ask the user which one

3. **Fetch board data:**
   - Call `agentboard_list_workspace_cards` for the board
   - Count cards per status column

4. **Display status:**

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
