---
name: architecture
description: Read an approved spec and produce the architecture document — ownership map, contract truth, dependency graph, per-card scope, verification ownership — then create workspace board cards from the architecture's slices. Cards do not exist before this command runs.
---

# Architecture — Boundaries & Card Creation

Convert an approved spec into an architecture document and create workspace cards from its slices. This is the only place architecture decisions live; the spec is architecturally silent.

## Prerequisites

- An approved spec exists at `docs/specs/<topic>.md` (produced by `/foundation`)
- AgentBoard MCP authenticated
- Codegraph and codebase-rag MCP servers available

## Instructions

Follow these steps in order.

1. **Load tools and skills:**
   - `ToolSearch` for `agentboard`, `codegraph`, `rag`
   - If only `agentboard_authenticate` and `agentboard_complete_authentication` are visible, run the OAuth bootstrap from `skills/agentboard/SKILL.md` §1.3
   - Activate the `expert-standard` skill via the `Skill` tool — architecture decisions must be evaluated against established engineering standards, not against codebase patterns alone

2. **Locate the approved spec:**
   - Look in `docs/specs/` for the most recent file, or take the path from the user's command argument
   - Read it. Confirm with the user that this is the spec the architecture is being built for.
   - Read section 6 (Architecture Questions Held for /architecture). Every question listed there must be answered or explicitly deferred during this session.

3. **Scan the codebase:**
   - `codegraph_scan` on the project root
   - Run `rag_search` against the spec's outcomes and constraints with `source_type="all"` to surface the existing patterns this work will touch
   - Identify the relevant existing modules, contracts, and dependency hotspots

4. **Design the architecture.**

   For the work the spec describes, decide each of the following. Every decision must cite the engineering standard or codebase reality it rests on. "Auth lives in `src/auth/` because separation-of-concerns puts authentication behind a single trust boundary" is grounded; "auth lives in `src/auth/`" is not.

   - **Ownership map.** Which existing modules/files own which areas of the change. Any new modules introduced and where they sit. State the principle behind each placement.
   - **Contract truth.** For every cross-component contract (types, protocols, API shapes), declare exactly one owner. Every other side is a consumer. Name the file or module that holds the source of truth. No co-ownership.
   - **Card dependency graph.** Explicit `depends_on` edges between cards. No implicit ordering. Cycles are not allowed.
   - **Per-card scope.** For each card the architecture creates:
     - **Allowed-touch list** — files this card may modify or create
     - **Forbidden-touch list** — files this card must not modify, when relevant (e.g., a contract owned by another card)
     - **Produces** — contracts this card produces, named with the consumer cards
     - **Consumes** — contracts this card consumes, named with the producer cards
     - **Verification scope** — local-only, or contributes to a verification card
   - **Verification ownership.** Which cards verify their own work locally only, and which card (if any) owns end-to-end / cross-card / integration verification. State the boundary explicitly so no card can claim or duck shared verification work.
   - **Open questions.** Anything that cannot be decided without more information from the user. Do NOT guess. The architecture is approved with open questions resolved or it is not approved.

   The architecture is allowed to reshape the spec's implicit work breakdown. If outcomes are best served by a different slicing than the spec suggested, slice differently — the spec defines outcomes, architecture defines structure.

5. **Write the architecture document** at `docs/arch/YYYY-MM-DD-<topic>.md`:

   ```markdown
   # Architecture: <topic>

   **Spec:** docs/specs/<spec-file>.md
   **Date:** YYYY-MM-DD

   ## 1. Ownership Map
   Modules and where they live, including new ones. Principle behind each placement.

   ## 2. Contract Truth
   For each cross-component contract: the single owner (file/module) and every
   consumer card. No co-ownership.

   ## 3. Card Dependency Graph
   Explicit edges. No implicit ordering. No cycles.

   ## 4. Card Slices
   For each card, all of the following:

   ### <Card title>
   - **Description** — what this card does, in architectural terms
   - **Allowed-touch list** — files this card may modify or create
   - **Forbidden-touch list** — files this card must not modify (when relevant)
   - **Produces** — contracts produced, with consumer card titles
   - **Consumes** — contracts consumed, with producer card titles
   - **Verification scope** — local-only | contributes to <verification card>
   - **Depends on** — other card titles

   ## 5. Verification Ownership
   Which cards verify what; whether a dedicated verification card exists and
   what it owns.

   ## 6. Decisions
   Every architecture decision with the engineering standard or codebase fact
   behind it. Decisions without a named standard go in section 7, not here.

   ## 7. Open Questions
   Unresolved architectural decisions. If non-empty, this architecture is not
   yet approved for card creation.
   ```

6. **Show the architecture to the user. Get explicit approval.**
   - If section 7 (Open Questions) has entries, the user resolves them; iterate until empty.
   - The user must explicitly approve the architecture before any card is created.

7. **Commit the architecture document** to git on the current branch.

8. **Select or create a workspace board:**
   - `agentboard_list_apps`, then `agentboard_list_boards` for the chosen app
   - If no suitable board exists, `agentboard_create_board`
   - Note the board's `auto_transitions` setting (`review_blocking`, `audit_blocking`) and tell the user

9. **Create cards from the architecture's Card Slices.**
   - One `agentboard_create_workspace_card` call per slice
   - `title` — from the slice
   - `description` — the full slice content (allowed-touch list, forbidden-touch, produces, consumes, verification scope, depends_on inline)
   - `priority` — ask user or infer from urgency
   - `depends_on` — set the workspace-card `depends_on` field per the dependency graph

10. **Show summary:**

    ```
    ## Architecture Complete

    **Spec:** docs/specs/<file>
    **Architecture:** docs/arch/<file>
    **App:** [name]
    **Board:** [name] (ID: [id])
    **Cards created:** N

    | # | Card | Allowed-touch (count) | Depends on |
    |---|------|----------------------|-----------|

    **Next step:** Start a new session and run `/orchestrate` to begin the
    planning → implementation pipeline. Planning agents will receive the
    architecture slice for their card as the boundary truth.
    ```

## Key Principles

- The spec is architecturally silent. The architecture is the only place boundaries, ownership, and contracts are decided.
- Cards do not exist until the architecture is approved. A spec without an approved architecture creates no cards.
- Every architecture decision cites the standard or codebase fact behind it. Ungrounded decisions are open questions, not decisions.
- The architecture's Card Slices are the contract every planning agent works from. Planning agents do not invent boundaries — if a slice is underspecified, planning surfaces it as a structured failure rather than guessing.
- Architecture is allowed to reshape the spec's implicit work breakdown. The spec defines outcomes; architecture defines structure.
- One question at a time when iterating with the user.
