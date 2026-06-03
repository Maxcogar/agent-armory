#!/usr/bin/env sh
#
# Prepare the ctxpack sandbox build in a fresh, ephemeral container and wire it
# into the repository's Claude Code hooks. Intended to be run from a Claude Code
# web/CI SessionStart step, but safe to run by hand. Idempotent.
#
#   sh middleware/codebase-context-compiler-sandbox/scripts/sandbox-bootstrap.sh
#
# Environment:
#   CTXPACK_INIT_ROOT   repo root to guard (default: git toplevel, else cwd).
#                       Set to empty string to skip `ctxpack init` (build only).
set -eu

pkg_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$pkg_dir"

echo "[ctxpack] installing dependencies (no native toolchain required)..."
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

# `prepare` already builds on install, but run explicitly so the script also
# works when lifecycle scripts were disabled during install.
echo "[ctxpack] building..."
npm run build

if [ "${CTXPACK_INIT_ROOT-unset}" = "" ]; then
  echo "[ctxpack] CTXPACK_INIT_ROOT empty; skipping hook install (build only)."
  exit 0
fi

root="${CTXPACK_INIT_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
echo "[ctxpack] installing Claude Code hooks into: $root"
node dist/cli/main.js init "$root"
echo "[ctxpack] ready. Restart the Claude Code session to load the hooks."
