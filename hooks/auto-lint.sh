#!/bin/bash
# Auto-lint hook — runs ESLint on edited JSX/JS client files
# Only triggers for client files to avoid noise from server files (no lint config)

FILE="$CLAUDE_TOOL_PARAM_file_path"
FILE="${FILE//\\//}"

# Only lint client-side files
case "$FILE" in
  *client/src/*.jsx|*client/src/*.js)
    # Run ESLint on the specific file, suppress warnings about ignored files
    cd "$(git rev-parse --show-toplevel)/client" 2>/dev/null || exit 0
    npx eslint --no-warn-ignored "$FILE" 2>/dev/null
    EXIT=$?
    if [ $EXIT -ne 0 ]; then
      echo "LINT ERRORS found in: $FILE"
      echo "Fix these before continuing."
    fi
    ;;
esac
