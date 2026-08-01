#!/usr/bin/env bash
# Stop hook — enforces this project's information policy (CLAUDE.md).
#
# Written rules did not hold on this project: on 2026-07-31 the same agent broke
# its own newly-written rules repeatedly within minutes. The only things that
# caught anything that day were mechanical. This is the mechanical check.
#
# It NEVER blocks. It emits `additionalContext` on Stop, which continues the turn
# once so the agent can fix what it missed — and it is gated on `stop_hook_active`
# so it can never chain (the same bound spec FR-O4a puts on the oracle itself).
# Exits 0 on every path.

set -uo pipefail
INPUT="$(cat)"
PROJECT="middleware/context-oracle"

# --- never fire twice: if the harness is already continuing due to a stop hook,
# --- stay silent. Bounds this to exactly one continuation.
if printf '%s' "$INPUT" | grep -q '"stop_hook_active"[[:space:]]*:[[:space:]]*true'; then
  exit 0
fi

cd "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || exit 0

# Compare against the merge-base with the default branch: everything this session
# added, whether committed or not.
BASE="$(git merge-base HEAD origin/main 2>/dev/null || git rev-parse HEAD)"
CHANGED="$(git diff --name-only "$BASE" 2>/dev/null; git diff --name-only 2>/dev/null; git ls-files --others --exclude-standard 2>/dev/null)"

# Only enforce when this session actually touched the project.
if ! printf '%s' "$CHANGED" | grep -q "^$PROJECT/"; then
  exit 0
fi

PROBLEMS=""

# 1. STATUS.md is the state of record and is rewritten every session.
if ! printf '%s' "$CHANGED" | grep -q "^$PROJECT/docs/STATUS.md$"; then
  PROBLEMS="${PROBLEMS}
- **docs/STATUS.md was not updated.** It is the state of record and CLAUDE.md's
  session protocol requires it rewritten — what changed, what works, what is
  broken, and what to do next. No other file states next steps."
fi

# 2. No new handoff documents — STATUS.md is the handoff.
NEW_HANDOFF="$(printf '%s' "$CHANGED" | grep "^$PROJECT/docs/handoffs/" || true)"
if [ -n "$NEW_HANDOFF" ]; then
  PROBLEMS="${PROBLEMS}
- **A handoff document was written or changed** ($(printf '%s' "$NEW_HANDOFF" | tr '\n' ' ')).
  Sessions do not write handoffs for this project; docs/STATUS.md is the handoff.
  Files in docs/handoffs/ are history only."
fi

# 3. New files under docs/ must be a sanctioned kind — a new file is almost never
#    the answer, and four places to look means no place to trust.
NEW_DOCS="$(git diff --name-only --diff-filter=A "$BASE" 2>/dev/null; git ls-files --others --exclude-standard 2>/dev/null)"
STRAY="$(printf '%s' "$NEW_DOCS" \
  | grep "^$PROJECT/docs/" \
  | grep -v "^$PROJECT/docs/reviews/" \
  | grep -v "^$PROJECT/docs/specs/" \
  | grep -v "^$PROJECT/docs/architecture-" \
  | grep -vE "^$PROJECT/docs/(STATUS|IDEAS|collapse-log)\.md$" || true)"
if [ -n "$STRAY" ]; then
  PROBLEMS="${PROBLEMS}
- **New file(s) created outside the sanctioned set** ($(printf '%s' "$STRAY" | tr '\n' ' ')).
  Route the content by CLAUDE.md's information policy instead: state to
  STATUS.md, durable lessons to collapse-log.md, review output to docs/reviews/,
  requirements to the spec, design to docs/architecture-*.md."
fi

[ -z "$PROBLEMS" ] && exit 0

MSG="[information policy — middleware/context-oracle/CLAUDE.md]
This session changed the project but did not satisfy the session-end protocol:
${PROBLEMS}

Fix these before ending. This notice fires once and cannot repeat."

python3 -c '
import json,sys
print(json.dumps({"hookSpecificOutput":{"hookEventName":"Stop","additionalContext":sys.stdin.read()}}))
' <<< "$MSG"
exit 0
