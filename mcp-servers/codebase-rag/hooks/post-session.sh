#!/bin/bash
# Optional Stop-hook fallback for the codebase RAG MCP.
#
# The MCP server has its own filesystem watcher and keeps the index live while
# it's running. This hook is a safety net for files modified while the server
# isn't around (e.g., between sessions). Wire it into Claude Code's `Stop` hook
# if you want belt-and-suspenders freshness.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../mcp-server-python" && pwd)"
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PWD}"
python "$SCRIPT_DIR/scripts/reindex.py" --project-root "$PROJECT_DIR" >/dev/null 2>&1 &

exit 0
