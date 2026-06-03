#!/bin/bash
# Session-End Drift Check
# Runs at Stop. Checks if any contract-paired files were modified during
# the session and outputs a MANDATORY instruction to run drift detection.

cd "$(git rev-parse --show-toplevel)" 2>/dev/null || exit 0

# Contract-paired source files
CONTRACT_FILES=(
  "server/src/taskStateMachine.js"
  "server/src/db/schema.js"
  "server/src/routes/tasks.js"
  "server/src/routes/projects.js"
  "server/src/routes/documents.js"
  "server/src/routes/activity.js"
  "server/src/ws.js"
  "server/src/events.js"
  "server/src/milestoneSync.js"
  "server/src/templates/milestoneTasks.js"
  "client/src/utils/taskTransitions.js"
  "client/src/components/layout/PhaseBar.jsx"
  "client/src/components/kanban/KanbanBoard.jsx"
  "client/src/components/common/StatusBadge.jsx"
  "CLAUDE.md"
)

# Get all modified files (staged + unstaged)
MODIFIED=$(git diff --name-only HEAD 2>/dev/null; git diff --name-only --cached 2>/dev/null)

if [ -z "$MODIFIED" ]; then
  exit 0
fi

# Check for contract doc changes too
CONTRACT_DOC_CHANGED=false
if echo "$MODIFIED" | grep -q "^docs/contracts/"; then
  CONTRACT_DOC_CHANGED=true
fi

# Check each contract-paired file
CHANGED_CONTRACT_FILES=()
for cf in "${CONTRACT_FILES[@]}"; do
  if echo "$MODIFIED" | grep -q "^${cf}$"; then
    CHANGED_CONTRACT_FILES+=("$cf")
  fi
done

if [ ${#CHANGED_CONTRACT_FILES[@]} -eq 0 ] && [ "$CONTRACT_DOC_CHANGED" = false ]; then
  exit 0
fi

echo "=========================================="
echo "SESSION-END: CONTRACT-PAIRED FILES WERE MODIFIED"
echo "=========================================="
echo ""
echo "Modified contract-paired files this session:"
for f in "${CHANGED_CONTRACT_FILES[@]}"; do
  echo "  - $f"
done
if [ "$CONTRACT_DOC_CHANGED" = true ]; then
  echo "$MODIFIED" | grep "^docs/contracts/" | while read -r f; do
    echo "  - $f"
  done
fi
echo ""
echo "ACTION REQUIRED: Before ending this session, you MUST either:"
echo "  1. Confirm source-of-truth-sync was already run for these files, OR"
echo "  2. Invoke the verify-alignment skill to check for drift"
echo ""
echo "Skipping this risks the same drift that caused the 8-contradiction audit."
echo "=========================================="
