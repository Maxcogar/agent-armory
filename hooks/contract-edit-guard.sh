#!/bin/bash
# Contract-Aware Edit Guard
# Fires after Edit/Write. When a contract-paired file is edited,
# outputs a MANDATORY instruction for Claude to invoke source-of-truth-sync.

FILE="$CLAUDE_TOOL_PARAM_file_path"
FILE="${FILE//\\//}"

# Check if this file is contract-paired
CONTRACT_PAIRED=false
case "$FILE" in
  *server/src/taskStateMachine.js|\
  *server/src/db/schema.js|\
  *server/src/routes/tasks.js|\
  *server/src/routes/projects.js|\
  *server/src/routes/documents.js|\
  *server/src/routes/activity.js|\
  *server/src/ws.js|\
  *server/src/events.js|\
  *server/src/milestoneSync.js|\
  *server/src/templates/milestoneTasks.js|\
  *client/src/utils/taskTransitions.js|\
  *client/src/components/layout/PhaseBar.jsx|\
  *client/src/components/kanban/KanbanBoard.jsx|\
  *client/src/components/common/StatusBadge.jsx|\
  *docs/contracts/*|\
  *CLAUDE.md)
    CONTRACT_PAIRED=true
    ;;
esac

if [ "$CONTRACT_PAIRED" = true ]; then
  echo "=========================================="
  echo "CONTRACT-PAIRED FILE MODIFIED"
  echo "=========================================="
  echo ""

  # Show specific mapping
  case "$FILE" in
    *server/src/taskStateMachine.js)
      echo "Changed: taskStateMachine.js"
      echo "Paired with: docs/contracts/task-state-machine.md + CLAUDE.md STATE_MACHINE"
      ;;
    *server/src/db/schema.js)
      echo "Changed: db/schema.js"
      echo "Paired with: docs/contracts/database-schema.md + CLAUDE.md DB_SCHEMA"
      ;;
    *server/src/routes/tasks.js)
      echo "Changed: routes/tasks.js"
      echo "Paired with: docs/contracts/api-endpoints.md + CLAUDE.md API_ENDPOINTS"
      ;;
    *server/src/routes/projects.js)
      echo "Changed: routes/projects.js"
      echo "Paired with: docs/contracts/api-endpoints.md + CLAUDE.md API_ENDPOINTS"
      ;;
    *server/src/routes/documents.js)
      echo "Changed: routes/documents.js"
      echo "Paired with: docs/contracts/api-endpoints.md + CLAUDE.md API_ENDPOINTS + MILESTONE_SYSTEM"
      ;;
    *server/src/routes/activity.js)
      echo "Changed: routes/activity.js"
      echo "Paired with: docs/contracts/api-endpoints.md + CLAUDE.md API_ENDPOINTS"
      ;;
    *server/src/ws.js)
      echo "Changed: ws.js"
      echo "Paired with: docs/contracts/websocket-events.md + CLAUDE.md WEBSOCKET_EVENTS"
      ;;
    *server/src/events.js)
      echo "Changed: events.js"
      echo "Paired with: docs/contracts/websocket-events.md + CLAUDE.md WEBSOCKET_EVENTS"
      ;;
    *server/src/milestoneSync.js)
      echo "Changed: milestoneSync.js"
      echo "Paired with: CLAUDE.md MILESTONE_SYSTEM + docs/contracts/task-state-machine.md"
      ;;
    *server/src/templates/milestoneTasks.js)
      echo "Changed: milestoneTasks.js"
      echo "Paired with: CLAUDE.md MILESTONE_SYSTEM + PHASE_SYSTEM"
      ;;
    *client/src/utils/taskTransitions.js)
      echo "Changed: taskTransitions.js"
      echo "Paired with: docs/contracts/task-state-machine.md + CLAUDE.md STATE_MACHINE"
      ;;
    *client/src/components/layout/PhaseBar.jsx)
      echo "Changed: PhaseBar.jsx"
      echo "Paired with: CLAUDE.md PHASE_SYSTEM"
      ;;
    *client/src/components/kanban/KanbanBoard.jsx)
      echo "Changed: KanbanBoard.jsx"
      echo "Paired with: CLAUDE.md STATE_MACHINE (column order)"
      ;;
    *client/src/components/common/StatusBadge.jsx)
      echo "Changed: StatusBadge.jsx"
      echo "Paired with: CLAUDE.md STATE_MACHINE (status values)"
      ;;
    *docs/contracts/*)
      echo "Changed: contract doc"
      echo "Paired with: CLAUDE.md + corresponding source files"
      ;;
    *CLAUDE.md)
      echo "Changed: CLAUDE.md"
      echo "Paired with: docs/contracts/ + source files"
      ;;
  esac

  echo ""
  echo "ACTION REQUIRED: You MUST invoke the source-of-truth-sync skill"
  echo "to update all paired documents before continuing other work."
  echo "=========================================="
fi
