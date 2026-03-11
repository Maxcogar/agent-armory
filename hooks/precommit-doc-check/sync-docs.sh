#!/usr/bin/env bash
# sync-docs.sh
# Detects stale docs and spawns focused, single-purpose Claude sessions to update each one.
#
# Each doc gets its own Claude session with ONLY:
#   - The current doc content
#   - The relevant code diffs
#   - The current state of the changed code files
#   - A single instruction: update this doc to match the code
#
# No distractions, no competing priorities, no feature work in context.
#
# Usage:
#   ./sync-docs.sh                        # Detect and fix all stale docs
#   ./sync-docs.sh --dry-run              # Show what would be updated without changing anything
#   ./sync-docs.sh --since HEAD~5         # Check changes since 5 commits ago
#   ./sync-docs.sh --report-only          # Just generate the stale doc report, don't fix
#   ./sync-docs.sh --api                  # Use Anthropic API directly instead of claude CLI
#
# Prerequisites:
#   - 'claude' CLI available in PATH (default), OR
#   - ANTHROPIC_API_KEY set in environment (with --api flag)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)

# --- Config ---
DRY_RUN=false
REPORT_ONLY=false
USE_API=false
DETECT_ARGS=()
MAX_CONTEXT_LINES=500  # Max lines of code context to include per doc update

# --- Parse args ---
while [[ $# -gt 0 ]]; do
    case "$1" in
        --dry-run)      DRY_RUN=true; shift ;;
        --report-only)  REPORT_ONLY=true; shift ;;
        --api)          USE_API=true; shift ;;
        --since)        DETECT_ARGS+=("--since" "$2"); shift 2 ;;
        --staged)       DETECT_ARGS+=("--staged"); shift ;;
        --help|-h)
            echo "Usage: sync-docs.sh [--dry-run] [--report-only] [--api] [--since REF] [--staged]"
            echo ""
            echo "  --dry-run       Show what would be updated, don't change anything"
            echo "  --report-only   Generate stale doc report and stop"
            echo "  --api           Use Anthropic API (needs ANTHROPIC_API_KEY) instead of claude CLI"
            echo "  --since REF     Check changes since REF"
            echo "  --staged        Only check staged changes"
            exit 0
            ;;
        *)  echo "Unknown arg: $1"; exit 1 ;;
    esac
done

# --- Check prerequisites ---
if ! $USE_API; then
    if ! command -v claude &>/dev/null; then
        echo "WARNING: 'claude' CLI not found. Falling back to --api mode."
        echo "Set ANTHROPIC_API_KEY or install claude CLI."
        USE_API=true
    fi
fi

if $USE_API && [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
    echo "ERROR: --api mode requires ANTHROPIC_API_KEY environment variable."
    echo "Alternatively, install the claude CLI for direct usage."
    exit 1
fi

cd "$REPO_ROOT"

# --- Run detection ---
echo "Scanning for stale docs..."
echo ""

DETECT_OUTPUT=$("$SCRIPT_DIR/detect-stale-docs.sh" --json "${DETECT_ARGS[@]}" 2>/dev/null || true)

# Parse JSON output (using basic tools, no jq dependency required)
STALE_COUNT=$(echo "$DETECT_OUTPUT" | grep -oP '"stale_count":\s*\K[0-9]+' || echo "0")

if [[ "$STALE_COUNT" -eq 0 ]]; then
    echo "All docs appear to be in sync. No updates needed."
    exit 0
fi

echo "Found $STALE_COUNT potentially stale doc(s)."
echo ""

# Extract stale doc paths and their reasons
STALE_DOCS=()
STALE_REASONS=()
while IFS= read -r line; do
    doc=$(echo "$line" | grep -oP '"doc":\s*"\K[^"]+' || true)
    reasons=$(echo "$line" | grep -oP '"reasons":\s*"\K[^"]+' || true)
    if [[ -n "$doc" ]]; then
        STALE_DOCS+=("$doc")
        STALE_REASONS+=("$reasons")
    fi
done <<< "$(echo "$DETECT_OUTPUT" | grep -oP '\{[^}]+\}' || true)"

# Extract changed code files
CHANGED_FILES=()
while IFS= read -r f; do
    f=$(echo "$f" | tr -d '"' | xargs)
    [[ -n "$f" ]] && CHANGED_FILES+=("$f")
done <<< "$(echo "$DETECT_OUTPUT" | sed -n '/changed_code_files/,/\]/p' | grep '"' | tr -d ',"' | xargs -I{} echo {})"

# --- Report ---
echo "============================================"
echo "  STALE DOC REPORT"
echo "============================================"
for i in "${!STALE_DOCS[@]}"; do
    echo ""
    echo "  [$((i+1))/$STALE_COUNT] ${STALE_DOCS[$i]}"
    echo "      Why: ${STALE_REASONS[$i]}"
done
echo ""
echo "============================================"

if $REPORT_ONLY; then
    echo "Report complete (--report-only mode)."
    exit 0
fi

if $DRY_RUN; then
    echo ""
    echo "DRY RUN: Would update the above docs. Run without --dry-run to apply."
    exit 0
fi

# --- Remediation: Update each stale doc ---

# Build the diff context once (shared across all updates)
get_diff_for_files() {
    local diff_args=()
    case "${DETECT_ARGS[0]:-}" in
        --staged) diff_args=("--cached") ;;
        --since)  diff_args=("${DETECT_ARGS[1]}") ;;
        *)        diff_args=() ;;
    esac
    
    # Get unified diff, limited to reasonable size
    git diff "${diff_args[@]}" -- "$@" 2>/dev/null | head -n 2000
    if [[ "${DETECT_ARGS[0]:-}" != "--staged" ]]; then
        git diff --cached -- "$@" 2>/dev/null | head -n 2000
    fi
}

FULL_DIFF=$(get_diff_for_files "${CHANGED_FILES[@]}" 2>/dev/null || true)

update_doc_via_cli() {
    local doc_path="$1"
    local doc_content="$2"
    local relevant_diff="$3"
    local reasons="$4"
    
    local prompt="You are a documentation updater. Your ONLY job is to update this document to accurately reflect code changes. Do not add commentary. Do not explain what you changed. Output ONLY the complete updated document content.

RULES:
- Preserve the document's existing structure, style, and formatting
- Only change parts that are affected by the code changes
- If a section describes behavior that changed, update it to match the new behavior
- If a section references files/functions/paths that were renamed or removed, update the references
- If the code changes don't actually affect what the doc describes, output the doc unchanged
- Do NOT add new sections unless the code changes introduce something the doc should cover but doesn't
- Do NOT remove sections unless what they describe no longer exists

THE DOC TO UPDATE ($doc_path):
--- START DOC ---
$doc_content
--- END DOC ---

CODE CHANGES THAT TRIGGERED THIS UPDATE:
Reason this doc was flagged: $reasons

--- START DIFF ---
$relevant_diff
--- END DIFF ---

Output the complete updated document now. Nothing else."

    echo "$prompt" | claude --print 2>/dev/null
}

update_doc_via_api() {
    local doc_path="$1"
    local doc_content="$2"
    local relevant_diff="$3"
    local reasons="$4"
    
    # Escape for JSON
    local escaped_doc=$(echo "$doc_content" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))" 2>/dev/null | sed 's/^"//;s/"$//')
    local escaped_diff=$(echo "$relevant_diff" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))" 2>/dev/null | sed 's/^"//;s/"$//')
    local escaped_reasons=$(echo "$reasons" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))" 2>/dev/null | sed 's/^"//;s/"$//')
    
    local prompt="You are a documentation updater. Your ONLY job is to update this document to accurately reflect code changes. Do not add commentary. Do not explain what you changed. Output ONLY the complete updated document content.\n\nRULES:\n- Preserve the document's existing structure, style, and formatting\n- Only change parts that are affected by the code changes\n- If a section describes behavior that changed, update it to match the new behavior\n- If a section references files/functions/paths that were renamed or removed, update the references\n- If the code changes don't actually affect what the doc describes, output the doc unchanged\n- Do NOT add new sections unless the code changes introduce something the doc should cover but doesn't\n- Do NOT remove sections unless what they describe no longer exists\n\nTHE DOC TO UPDATE ($doc_path):\n--- START DOC ---\n$escaped_doc\n--- END DOC ---\n\nCODE CHANGES THAT TRIGGERED THIS UPDATE:\nReason this doc was flagged: $escaped_reasons\n\n--- START DIFF ---\n$escaped_diff\n--- END DIFF ---\n\nOutput the complete updated document now. Nothing else."
    
    local response
    response=$(curl -s "https://api.anthropic.com/v1/messages" \
        -H "Content-Type: application/json" \
        -H "x-api-key: $ANTHROPIC_API_KEY" \
        -H "anthropic-version: 2023-06-01" \
        -d "{
            \"model\": \"claude-sonnet-4-20250514\",
            \"max_tokens\": 8192,
            \"messages\": [{
                \"role\": \"user\",
                \"content\": \"$prompt\"
            }]
        }" 2>/dev/null)
    
    # Extract text from response
    echo "$response" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for block in data.get('content', []):
        if block.get('type') == 'text':
            print(block['text'])
except Exception as e:
    print(f'ERROR: Failed to parse API response: {e}', file=sys.stderr)
    sys.exit(1)
" 2>/dev/null
}

# --- Process each stale doc ---
UPDATED=0
FAILED=0
SKIPPED=0

for i in "${!STALE_DOCS[@]}"; do
    doc_path="${STALE_DOCS[$i]}"
    reasons="${STALE_REASONS[$i]}"
    
    echo ""
    echo "[$((i+1))/$STALE_COUNT] Updating: $doc_path"
    
    # Read current doc content
    if [[ ! -f "$doc_path" ]]; then
        echo "  SKIP: File not found (may have been deleted)"
        ((SKIPPED++))
        continue
    fi
    
    doc_content=$(cat "$doc_path")
    
    # Get relevant diff (filtered to files that caused this doc to be flagged)
    # Extract changed files from the reasons string
    relevant_changed=()
    while IFS= read -r chunk; do
        changed_ref=$(echo "$chunk" | grep -oP 'CHANGED:\K[^;]+' || true)
        [[ -n "$changed_ref" ]] && relevant_changed+=("$changed_ref")
    done <<< "$(echo "$reasons" | tr ';' '\n')"
    
    relevant_diff=""
    if [[ ${#relevant_changed[@]} -gt 0 ]]; then
        relevant_diff=$(get_diff_for_files "${relevant_changed[@]}" 2>/dev/null || true)
    fi
    if [[ -z "$relevant_diff" ]]; then
        relevant_diff="$FULL_DIFF"
    fi
    
    # Truncate diff if massive
    if [[ $(echo "$relevant_diff" | wc -l) -gt $MAX_CONTEXT_LINES ]]; then
        relevant_diff=$(echo "$relevant_diff" | head -n $MAX_CONTEXT_LINES)
        relevant_diff+=$'\n... [diff truncated for context window management]'
    fi
    
    # Call Claude to update the doc
    updated_content=""
    if $USE_API; then
        updated_content=$(update_doc_via_api "$doc_path" "$doc_content" "$relevant_diff" "$reasons" 2>/dev/null || true)
    else
        updated_content=$(update_doc_via_cli "$doc_path" "$doc_content" "$relevant_diff" "$reasons" 2>/dev/null || true)
    fi
    
    if [[ -z "$updated_content" ]]; then
        echo "  FAILED: No response from Claude"
        ((FAILED++))
        continue
    fi
    
    # Check if content actually changed
    if [[ "$updated_content" == "$doc_content" ]]; then
        echo "  NO CHANGE: Doc already matches code (false positive)"
        ((SKIPPED++))
        continue
    fi
    
    # Write updated content
    echo "$updated_content" > "$doc_path"
    echo "  UPDATED"
    ((UPDATED++))
done

# --- Summary ---
echo ""
echo "============================================"
echo "  SYNC COMPLETE"
echo "============================================"
echo "  Updated: $UPDATED"
echo "  Skipped: $SKIPPED (already current or not found)"
echo "  Failed:  $FAILED"
echo "============================================"

if [[ $UPDATED -gt 0 ]]; then
    echo ""
    echo "Review the changes:"
    echo "  git diff -- $(printf '%s ' "${STALE_DOCS[@]}")"
    echo ""
    echo "If they look good, stage and amend your commit:"
    echo "  git add $(printf '%s ' "${STALE_DOCS[@]}")"
fi

exit 0
