#!/usr/bin/env bash
# detect-stale-docs.sh
# Detects documentation files that likely need updating based on code changes.
#
# How it works:
# 1. Gets list of code files changed (git diff, optionally against a specific ref)
# 2. Extracts identifiers from the diffs (function names, exports, route paths, class names)
# 3. Scans all doc files for references to changed files or extracted identifiers
# 4. Reports which docs are probably stale and WHY (what reference was found)
#
# Usage:
#   ./detect-stale-docs.sh                    # Changes since last commit (working tree + staged)
#   ./detect-stale-docs.sh --since HEAD~3     # Changes in last 3 commits + working tree
#   ./detect-stale-docs.sh --staged           # Only staged changes (for pre-commit hook)
#   ./detect-stale-docs.sh --json             # Output as JSON for consumption by other scripts

set -euo pipefail

# --- Config ---
# Doc file extensions to scan
DOC_EXTENSIONS="md|txt|rst"
# Code file extensions (everything else that isn't a doc is implicitly "code", but
# we specifically extract identifiers from these)
CODE_EXTENSIONS="js|jsx|ts|tsx|py|sh|bash|mjs|cjs|vue|svelte"
# Directories to skip when scanning for docs
SKIP_DIRS="node_modules|.git|dist|build|.next|__pycache__|.venv|venv"

# --- Parse args ---
DIFF_MODE="working"  # working | staged | since
SINCE_REF=""
OUTPUT_FORMAT="text"  # text | json

while [[ $# -gt 0 ]]; do
    case "$1" in
        --staged)   DIFF_MODE="staged"; shift ;;
        --since)    DIFF_MODE="since"; SINCE_REF="$2"; shift 2 ;;
        --json)     OUTPUT_FORMAT="json"; shift ;;
        --help|-h)
            echo "Usage: detect-stale-docs.sh [--staged | --since REF] [--json]"
            echo ""
            echo "  --staged     Only check staged changes (for pre-commit hooks)"
            echo "  --since REF  Check changes since REF (e.g. HEAD~3, main, abc123)"
            echo "  --json       Output results as JSON"
            echo ""
            echo "Default: checks all uncommitted changes (staged + working tree)"
            exit 0
            ;;
        *)          echo "Unknown arg: $1"; exit 1 ;;
    esac
done

# --- Ensure we're in a git repo ---
if ! git rev-parse --is-inside-work-tree &>/dev/null; then
    echo "ERROR: Not inside a git repository." >&2
    exit 1
fi

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

# --- Get changed files ---
get_changed_files() {
    case "$DIFF_MODE" in
        staged)
            git diff --cached --name-only --diff-filter=ACMR
            ;;
        since)
            # Changes in commits since REF, plus any working tree changes
            git diff "$SINCE_REF" --name-only --diff-filter=ACMR
            git diff --name-only --diff-filter=ACMR 2>/dev/null || true
            ;;
        working)
            # All uncommitted: staged + unstaged
            git diff --name-only --diff-filter=ACMR
            git diff --cached --name-only --diff-filter=ACMR
            ;;
    esac | sort -u
}

# --- Get the actual diff content (for identifier extraction) ---
get_diff_content() {
    case "$DIFF_MODE" in
        staged)
            git diff --cached -U0
            ;;
        since)
            git diff "$SINCE_REF" -U0
            ;;
        working)
            git diff -U0
            git diff --cached -U0
            ;;
    esac
}

# --- Extract identifiers from diff ---
# Pulls function names, export names, class names, route paths, component names
extract_identifiers() {
    local diff_content="$1"

    echo "$diff_content" | grep '^[+-]' | grep -v '^[+-][+-][+-]' | \
    sed 's/^[+-]//' | \
    {
        # Function declarations: function foo(, const foo =, export function foo
        grep -oP '(?:function\s+|const\s+|let\s+|var\s+|export\s+(?:default\s+)?(?:function\s+|const\s+|class\s+)?)\K[a-zA-Z_][a-zA-Z0-9_]*' || true
        
    }
    
    echo "$diff_content" | grep '^[+-]' | grep -v '^[+-][+-][+-]' | \
    sed 's/^[+-]//' | \
    {
        # Class declarations
        grep -oP '(?:class\s+)\K[a-zA-Z_][a-zA-Z0-9_]*' || true
    }
    
    echo "$diff_content" | grep '^[+-]' | grep -v '^[+-][+-][+-]' | \
    sed 's/^[+-]//' | \
    {
        # Route/endpoint paths: '/api/foo', "/api/bar"
        grep -oP "['\"]\/[a-zA-Z0-9/_-]+['\"]" | tr -d "'\"" || true
    }
    
    echo "$diff_content" | grep '^[+-]' | grep -v '^[+-][+-][+-]' | \
    sed 's/^[+-]//' | \
    {
        # Python: def foo(
        grep -oP '(?:def\s+)\K[a-zA-Z_][a-zA-Z0-9_]*' || true
    }

    echo "$diff_content" | grep '^[+-]' | grep -v '^[+-][+-][+-]' | \
    sed 's/^[+-]//' | \
    {
        # React components: <ComponentName or export default ComponentName
        grep -oP '<\K[A-Z][a-zA-Z0-9]+(?=[\s/>])' || true
    }
}

# --- Find all doc files ---
find_doc_files() {
    find "$REPO_ROOT" -type f \
        -regextype posix-extended \
        -regex ".*\.($DOC_EXTENSIONS)$" \
        2>/dev/null | \
    grep -vE "/(${SKIP_DIRS})/" || true
}

# --- Main ---

# Collect changed code files (exclude doc files themselves)
CHANGED_FILES=$(get_changed_files | grep -vE "\.($DOC_EXTENSIONS)$" || true)

if [[ -z "$CHANGED_FILES" ]]; then
    if [[ "$OUTPUT_FORMAT" == "json" ]]; then
        echo '{"stale_docs": [], "changed_files": [], "message": "No code changes detected"}'
    else
        echo "No code changes detected."
    fi
    exit 0
fi

# Get diff content and extract identifiers
DIFF_CONTENT=$(get_diff_content 2>/dev/null || true)
IDENTIFIERS=$(extract_identifiers "$DIFF_CONTENT" | sort -u | grep -v '^$' || true)

# Get all doc files
DOC_FILES=$(find_doc_files)

if [[ -z "$DOC_FILES" ]]; then
    if [[ "$OUTPUT_FORMAT" == "json" ]]; then
        echo '{"stale_docs": [], "changed_files": [], "message": "No doc files found in repo"}'
    else
        echo "No doc files found in repository."
    fi
    exit 0
fi

# --- Scan docs for references to changed files/identifiers ---

declare -A STALE_DOCS  # doc_path -> reasons

while IFS= read -r changed_file; do
    basename_no_ext=$(basename "$changed_file" | sed 's/\.[^.]*$//')
    basename_full=$(basename "$changed_file")
    # Also get the relative path without extension for partial path matching
    rel_path_no_ext=$(echo "$changed_file" | sed 's/\.[^.]*$//')
    
    while IFS= read -r doc_file; do
        # Skip if the doc IS the changed file (shouldn't happen after filter but safety)
        [[ "$doc_file" == "$REPO_ROOT/$changed_file" ]] && continue
        
        rel_doc=$(echo "$doc_file" | sed "s|$REPO_ROOT/||")
        
        # Check for filename references (with or without extension)
        if grep -qlF "$basename_full" "$doc_file" 2>/dev/null; then
            reason="references filename '$basename_full'"
            STALE_DOCS["$rel_doc"]+="${reason}|CHANGED:${changed_file}; "
        elif grep -qlF "$basename_no_ext" "$doc_file" 2>/dev/null; then
            # Only match bare name if it's likely a deliberate reference (3+ chars, not a common word)
            if [[ ${#basename_no_ext} -ge 4 ]]; then
                reason="references '$basename_no_ext'"
                STALE_DOCS["$rel_doc"]+="${reason}|CHANGED:${changed_file}; "
            fi
        fi
        
        # Check for relative path references
        if grep -qlF "$changed_file" "$doc_file" 2>/dev/null; then
            reason="references path '$changed_file'"
            STALE_DOCS["$rel_doc"]+="${reason}|CHANGED:${changed_file}; "
        fi
        
    done <<< "$DOC_FILES"
done <<< "$CHANGED_FILES"

# Also check identifiers (function names, class names, etc.) — but only meaningful ones
# Skip very short or very common identifiers to reduce false positives
if [[ -n "$IDENTIFIERS" ]]; then
    while IFS= read -r identifier; do
        # Skip short identifiers (likely false positives: e, i, x, id, etc.)
        [[ ${#identifier} -lt 5 ]] && continue
        # Skip extremely common words that aren't useful signals
        case "$identifier" in
            return|const|export|default|import|require|module|function|class|async|await|props|state|error|value|index|items|result|data|type|name|path|null|undefined|true|false|catch|throw|console|process|window|document|string|number|boolean|object|array|Promise) continue ;;
        esac
        
        while IFS= read -r doc_file; do
            rel_doc=$(echo "$doc_file" | sed "s|$REPO_ROOT/||")
            if grep -qlwF "$identifier" "$doc_file" 2>/dev/null; then
                reason="references identifier '$identifier'"
                # Don't duplicate if we already flagged this doc
                if [[ "${STALE_DOCS[$rel_doc]:-}" != *"$identifier"* ]]; then
                    STALE_DOCS["$rel_doc"]+="${reason}; "
                fi
            fi
        done <<< "$DOC_FILES"
    done <<< "$IDENTIFIERS"
fi

# --- Output ---

STALE_COUNT=${#STALE_DOCS[@]}

if [[ "$OUTPUT_FORMAT" == "json" ]]; then
    echo "{"
    echo "  \"changed_code_files\": ["
    first=true
    while IFS= read -r f; do
        [[ -z "$f" ]] && continue
        $first && first=false || echo ","
        printf '    "%s"' "$f"
    done <<< "$CHANGED_FILES"
    echo ""
    echo "  ],"
    echo "  \"stale_docs\": ["
    first=true
    for doc in "${!STALE_DOCS[@]}"; do
        $first && first=false || echo ","
        reasons="${STALE_DOCS[$doc]}"
        # Clean up trailing semicolon
        reasons=$(echo "$reasons" | sed 's/; $//')
        printf '    {"doc": "%s", "reasons": "%s"}' "$doc" "$reasons"
    done
    echo ""
    echo "  ],"
    echo "  \"stale_count\": $STALE_COUNT,"
    echo "  \"identifiers_checked\": $(echo "$IDENTIFIERS" | grep -c . || echo 0)"
    echo "}"
else
    echo "============================================"
    echo "  DOC SYNC CHECK"
    echo "============================================"
    echo ""
    echo "Changed code files:"
    while IFS= read -r f; do
        [[ -z "$f" ]] && continue
        echo "  * $f"
    done <<< "$CHANGED_FILES"
    echo ""
    
    if [[ $STALE_COUNT -eq 0 ]]; then
        echo "No docs appear to reference the changed code."
        echo "(This doesn't mean docs are up to date — it means no docs"
        echo " mention the changed files or identifiers by name.)"
    else
        echo "POTENTIALLY STALE DOCS ($STALE_COUNT):"
        echo "--------------------------------------------"
        for doc in "${!STALE_DOCS[@]}"; do
            echo ""
            echo "  >> $doc"
            reasons="${STALE_DOCS[$doc]}"
            IFS=';' read -ra reason_arr <<< "$reasons"
            for reason in "${reason_arr[@]}"; do
                reason=$(echo "$reason" | xargs)  # trim whitespace
                [[ -z "$reason" ]] && continue
                echo "     - $reason"
            done
        done
        echo ""
        echo "--------------------------------------------"
        echo "Run 'sync-docs.sh' to auto-update these docs."
    fi
fi

exit $STALE_COUNT
