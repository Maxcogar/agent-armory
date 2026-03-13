#!/usr/bin/env bash
# workspace-card-guidance.sh
# PostToolUse hook — outputs phase-specific guidance after claiming a workspace card.
#
# Matches: get_next_card, get_card, update_workspace_card
# Behavior: Parses the card's current status from tool output and injects
#           phase-appropriate standards. For update_workspace_card, only fires
#           when an assignee is being set (i.e., a card claim, not a routine update).

OUTPUT="$TOOL_OUTPUT"
INPUT="$TOOL_INPUT"

# For update_workspace_card, only fire when assignee is being set (a claim).
# Skip routine updates like adding notes or changing status.
if [ "$TOOL_NAME" = "mcp__agentboard__agentboard_update_workspace_card" ]; then
  if ! echo "$INPUT" | grep -qi '"assignee"'; then
    exit 0
  fi
fi

# Extract card status from tool output
STATUS=$(echo "$OUTPUT" | grep -oi '"status"\s*:\s*"[^"]*"' | head -1 | grep -oi '"[^"]*"$' | tr -d '"')

if [ -z "$STATUS" ]; then
  exit 0
fi

case "$STATUS" in
  planning)
    cat <<'EOF'
PLANNING PHASE STANDARDS:
1. REQUIRED TOOLS: You MUST use codegraph (scan then dependencies/dependents for every relevant file), codebase-rag (rag_check_constraints), Grep, and Read to investigate BEFORE drafting your plan.
2. COMPLETENESS: Your plan must be FULLY ACTIONABLE — zero open questions, zero TODOs, zero "need to investigate further." If you don't know something, use your tools to find out NOW before writing anything.
3. SPECIFICITY: Every step must reference specific files, functions, and line numbers. Vague steps like "update the component" will be rejected.
4. If you cannot produce a complete plan after investigation, do NOT submit an artifact. Update the card notes explaining what blocked you.
EOF
    ;;
  review)
    cat <<'EOF'
PLAN REVIEW PHASE:
1. Read ALL plan artifacts on this card thoroughly.
2. Evaluate: Is the plan complete? Does it reference specific files and line numbers? Are there open questions or TODOs?
3. If the plan is insufficient, submit a review_note artifact explaining what's missing.
4. A good plan has zero ambiguity — another agent should be able to implement it without asking questions.
EOF
    ;;
  implementation)
    cat <<'EOF'
IMPLEMENTATION PHASE:
1. Read the plan and any review artifacts on this card before writing code.
2. Follow the plan's file references and steps. If deviating, document why in card notes.
3. Run build + lint after changes.
4. Submit an implementation_note artifact summarizing changes and any deviations from the plan.
EOF
    ;;
  audit)
    cat <<'EOF'
AUDIT PHASE:
1. Read the plan, review notes, and implementation artifacts on this card.
2. Verify the implementation matches the plan. Run tests and lint.
3. Check for state machine violations, missing WebSocket events, and API contract adherence.
4. Submit an audit_report artifact with your findings.
EOF
    ;;
  *)
    # backlog, finished, or unknown — no guidance needed
    exit 0
    ;;
esac

exit 0
