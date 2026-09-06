#!/usr/bin/env bash
# Launches the CodeGraph MCP server over stdio for Claude Code (see the repo-root
# .mcp.json). dist/ and node_modules/ are gitignored, so the first launch in a
# fresh container installs and builds; every later launch just starts the server.
# All build output goes to stderr — stdout is the MCP transport and must stay clean.
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"
if [ ! -f dist/index.js ] || [ ! -d node_modules ]; then
  npm ci --no-audit --no-fund >&2
  npm run build >&2
fi
exec node dist/index.js
