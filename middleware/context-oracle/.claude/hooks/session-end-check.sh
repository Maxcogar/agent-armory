#!/usr/bin/env bash
# Stop hook — enforces this project's information policy (CLAUDE.md).
#
# Written rules did not hold on this project: on 2026-07-31 the same agent broke
# its own newly-written rules repeatedly within minutes. The only things that
# caught anything that day were mechanical. This is the mechanical check.
#
# It NEVER blocks. It emits `additionalContext` on Stop, which continues the turn
# once so the agent can fix what it missed — and it is gated on `stop_hook_active`
# so it can never chain (the same single-cycle bound spec FR-B4 puts on the
# oracle's own Stop-time completion-check whisper).
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

# 4. Reviews are written once and never edited — editing one destroys the closure
#    record the next round is required to check against.
EDITED_REVIEW="$(git diff --name-only --diff-filter=M "$BASE" 2>/dev/null; git diff --name-only --diff-filter=M 2>/dev/null)"
EDITED_REVIEW="$(printf '%s' "$EDITED_REVIEW" | grep "^$PROJECT/docs/reviews/" | grep -v "README.md$" || true)"
if [ -n "$EDITED_REVIEW" ]; then
  PROBLEMS="${PROBLEMS}
- **An existing review file was edited** ($(printf '%s' "$EDITED_REVIEW" | tr '\n' ' ')).
  Reviews are written once and never edited — the next round's closure ledger is
  checked against them, so editing one destroys the record it is checked against.
  Corrections go in the NEXT round's review, not by rewriting the last one."
fi

# 5. A new review landed but no durable lesson was recorded. A review that found
#    something generalisable and left it only in the review file means the trap is
#    re-sprung next time — that is the collapse-log's whole job.
NEW_REVIEW="$(printf '%s' "$NEW_DOCS" | grep "^$PROJECT/docs/reviews/.*\.md$" | grep -v "README.md$" || true)"
if [ -n "$NEW_REVIEW" ] && ! printf '%s' "$CHANGED" | grep -q "^$PROJECT/docs/collapse-log.md$"; then
  PROBLEMS="${PROBLEMS}
- **A review was added but docs/collapse-log.md was not updated.** If the review
  found nothing that generalises past its own instance, that is fine — but decide
  it deliberately. A lesson left only in a review file is never read before
  designing, which is how the same trap gets re-sprung."
fi

# 6. Keep documents in sync (CLAUDE.md, Engineering standard): a design change
#    without any record of what changed or why leaves the spec and the state stale.
if printf '%s' "$CHANGED" | grep -q "^$PROJECT/docs/architecture-"; then
  if ! printf '%s' "$CHANGED" | grep -qE "^$PROJECT/(docs/specs/|docs/STATUS.md|docs/collapse-log.md)"; then
    PROBLEMS="${PROBLEMS}
- **The architecture changed, but the spec, STATUS.md and the collapse log did
  not.** CLAUDE.md's engineering standard requires documents kept in sync: a
  change to behaviour updates the spec, a change to scope updates §2 and §14, and
  a design decision that collapsed belongs in the log. Silent design drift is how
  the architecture and the spec stopped agreeing."
  fi
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
