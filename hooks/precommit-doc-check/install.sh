#!/usr/bin/env bash
# install.sh — Sets up doc-sync in your repository
#
# Run from inside any git repo:
#   bash /path/to/doc-sync/install.sh
#
# What it does:
#   1. Copies scripts to ./scripts/doc-sync/
#   2. Installs the pre-commit hook (with backup if one exists)
#   3. Makes everything executable

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Ensure we're in a git repo
if ! git rev-parse --is-inside-work-tree &>/dev/null; then
    echo "ERROR: Run this from inside a git repository."
    exit 1
fi

REPO_ROOT=$(git rev-parse --show-toplevel)
DEST="$REPO_ROOT/scripts/doc-sync"

echo "Installing doc-sync into: $DEST"
echo ""

# Copy scripts
mkdir -p "$DEST"
cp "$SCRIPT_DIR/detect-stale-docs.sh" "$DEST/"
cp "$SCRIPT_DIR/sync-docs.sh" "$DEST/"
chmod +x "$DEST/detect-stale-docs.sh"
chmod +x "$DEST/sync-docs.sh"
echo "  Copied detect-stale-docs.sh"
echo "  Copied sync-docs.sh"

# Install pre-commit hook
HOOK_DIR="$REPO_ROOT/.git/hooks"
HOOK_FILE="$HOOK_DIR/pre-commit"

if [[ -f "$HOOK_FILE" ]]; then
    # Backup existing hook
    cp "$HOOK_FILE" "$HOOK_FILE.backup.$(date +%s)"
    echo "  Backed up existing pre-commit hook"
    
    # Check if our hook is already in there
    if grep -q "detect-stale-docs" "$HOOK_FILE" 2>/dev/null; then
        echo "  Pre-commit hook already contains doc-sync check. Skipping."
    else
        # Append our check to existing hook
        cat >> "$HOOK_FILE" << 'HOOKEOF'

# --- doc-sync: Auto-update stale docs at commit time ---
REPO_ROOT_DS=$(git rev-parse --show-toplevel)
DETECT_SCRIPT_DS="$REPO_ROOT_DS/scripts/doc-sync/detect-stale-docs.sh"
SYNC_SCRIPT_DS="$REPO_ROOT_DS/scripts/doc-sync/sync-docs.sh"
if [[ -x "$DETECT_SCRIPT_DS" && -x "$SYNC_SCRIPT_DS" ]]; then
    DS_OUTPUT=$("$DETECT_SCRIPT_DS" --staged --json 2>/dev/null || true)
    DS_COUNT=$(echo "$DS_OUTPUT" | grep -oP '"stale_count":\s*\K[0-9]+' || echo "0")
    if [[ "$DS_COUNT" -gt 0 ]]; then
        echo "DOC SYNC: $DS_COUNT stale doc(s) found. Updating..."
        "$SYNC_SCRIPT_DS" --staged
        echo "$DS_OUTPUT" | grep -oP '"doc":\s*"\K[^"]+' | while IFS= read -r doc; do
            [[ -n "$doc" && -f "$REPO_ROOT_DS/$doc" ]] && git add "$REPO_ROOT_DS/$doc"
        done
        echo "Doc updates staged. Commit proceeding."
    fi
fi
# --- end doc-sync ---
HOOKEOF
        echo "  Appended doc-sync check to existing pre-commit hook"
    fi
else
    cp "$SCRIPT_DIR/pre-commit" "$HOOK_FILE"
    chmod +x "$HOOK_FILE"
    echo "  Installed pre-commit hook"
fi

echo ""
echo "Installation complete."
echo ""
echo "Usage:"
echo "  scripts/doc-sync/detect-stale-docs.sh    # Check for stale docs"
echo "  scripts/doc-sync/sync-docs.sh             # Auto-update stale docs"
echo "  scripts/doc-sync/sync-docs.sh --dry-run   # Preview what would change"
echo ""
echo "The pre-commit hook will block commits when docs are stale."
echo "Bypass with: git commit --no-verify"
