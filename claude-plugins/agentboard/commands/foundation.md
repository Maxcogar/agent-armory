---
name: foundation
description: Interactive spec-building session — brainstorm work, produce a spec document, and create workspace board cards
---

# Foundation — Spec & Card Creation

Build a spec for a body of work and break it into workspace board cards.

## Instructions

Follow these steps in order.

1. **Load AgentBoard tools** by calling `ToolSearch` for `agentboard`. Then call `agentboard_health_check`. If the server is not running, call `agentboard_start_server`.

2. **Select or create an app:**
   - Call `agentboard_list_apps`
   - If apps exist, ask the user which one to use
   - If none exist or the user wants a new one, call `agentboard_create_app`

3. **Select or create a workspace board:**
   - Call `agentboard_list_boards` for the selected app
   - If boards exist, ask the user which one to use
   - If none exist or the user wants a new one, call `agentboard_create_board`
   - Note the board's `auto_transitions` setting — inform the user which blocking toggles are active

4. **Brainstorm the work:**
   - Ask the user what they want to accomplish
   - Ask clarifying questions one at a time to understand scope, constraints, and goals
   - Use codegraph and RAG to research the codebase as needed
   - Focus on *what* needs to happen, not *how* — the "how" is figured out per-card by planning agents

5. **Write the spec document:**
   - Create `docs/specs/YYYY-MM-DD-<topic>.md` with:
     - Summary of the work
     - Goals and constraints
     - Major sections/chunks of work (each becomes a card)
     - Out of scope items
   - Show the spec to the user for approval before creating cards

6. **Create workspace cards:**
   - For each major section in the spec, call `agentboard_create_card` on the board:
     - title: Clear, actionable title
     - description: Relevant section from the spec
     - priority: Ask user or infer from context
   - Cards are created in `backlog`

7. **Show summary:**
   ```
   ## Foundation Complete

   **App:** [name]
   **Board:** [name] (ID: [id])
   **Spec:** docs/specs/YYYY-MM-DD-<topic>.md
   **Cards created:** [N]

   | # | Card | Priority |
   |---|------|----------|
   | 1 | [title] | [priority] |
   | 2 | [title] | [priority] |

   **Next step:** Start a new session and run `/orchestrate` to begin the planning → implementation pipeline.
   ```

8. **Commit the spec** to git on the current branch.

## Key Principles

- One question at a time during brainstorming
- Spec defines *what*, not *how*
- Each card should be a focused, independent unit of work
- Cards should be small enough for a single agent to plan and implement
- Foundation takes a full session — don't try to orchestrate in the same session
