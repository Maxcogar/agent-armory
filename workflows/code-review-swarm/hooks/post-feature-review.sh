#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# Claude Code Hook — Post-Feature Review Trigger
# ============================================================================
# Place this in your project's .claude/hooks/ directory.
# Triggers a targeted code review after completing a feature branch.
#
# Hook type: PostTask (runs after Claude completes a task)
# ============================================================================

SWARM_DIR="${CODE_REVIEW_SWARM_DIR:-$HOME/tools/code-review-swarm}"
PROJECT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
MAIN_BRANCH="${MAIN_BRANCH:-main}"

# Only trigger if we're on a feature branch
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "")
if [[ "$CURRENT_BRANCH" == "$MAIN_BRANCH" ]] || [[ -z "$CURRENT_BRANCH" ]]; then
    exit 0
fi

# Only trigger if there are actual changes vs main
CHANGED_FILES=$(git diff --name-only "$MAIN_BRANCH"...HEAD --diff-filter=ACMR 2>/dev/null | wc -l | tr -d ' ')
if [[ "$CHANGED_FILES" -eq 0 ]]; then
    exit 0
fi

echo "╔══════════════════════════════════════════════╗"
echo "║  Code Review Swarm — Post-Feature Review     ║"
echo "║  Branch: ${CURRENT_BRANCH}                   ║"
echo "║  Changed files: ${CHANGED_FILES}             ║"
echo "╚══════════════════════════════════════════════╝"

if [[ -x "${SWARM_DIR}/review.sh" ]]; then
    # Run review focused on the diff
    "${SWARM_DIR}/review.sh" "$PROJECT_DIR" \
        --diff "$MAIN_BRANCH" \
        --no-worktree \
        --agents claude \
        --output ".code-review"

    echo ""
    echo "Review complete: .code-review/REVIEW_REPORT.md"
else
    echo "Swarm not found at ${SWARM_DIR}"
    echo "Set CODE_REVIEW_SWARM_DIR or install to ~/tools/code-review-swarm"
fi
