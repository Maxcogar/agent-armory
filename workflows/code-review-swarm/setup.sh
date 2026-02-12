#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# Code Review Swarm — Setup
# ============================================================================
# Checks for required tools and helps install missing agents.
# Run once after cloning: ./setup.sh
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}${CYAN}Code Review Swarm — Setup${NC}\n"

# ── Required tools ──────────────────────────────────────────────────────────
check() {
    local name="$1" cmd="$2" install="$3"
    if command -v "$cmd" &>/dev/null; then
        echo -e "  ${GREEN}✓${NC} ${name} ($(command -v "$cmd"))"
        return 0
    else
        echo -e "  ${YELLOW}✗${NC} ${name} — install: ${install}"
        return 1
    fi
}

echo -e "${BOLD}Required tools:${NC}"
check "git"  "git"  "https://git-scm.com"
check "jq"   "jq"   "apt install jq / brew install jq"
echo ""

echo -e "${BOLD}AI Agents (need at least one):${NC}"
agents_found=0
check "Claude Code"  "claude"  "npm install -g @anthropic-ai/claude-code"              && ((agents_found++)) || true
check "Gemini CLI"   "gemini"  "npm install -g @google/gemini-cli (Gemini 3 Flash/Pro)" && ((agents_found++)) || true
check "Codex CLI"    "codex"   "npm install -g @openai/codex (gpt-5.3-codex)"           && ((agents_found++)) || true
echo ""

# Check for API keys as fallback
if [[ $agents_found -eq 0 ]]; then
    echo -e "${BOLD}API Key Fallbacks:${NC}"
    [[ -n "${ANTHROPIC_API_KEY:-}" ]] && echo -e "  ${GREEN}✓${NC} ANTHROPIC_API_KEY set" && ((agents_found++)) || echo -e "  ${YELLOW}✗${NC} ANTHROPIC_API_KEY not set"
    [[ -n "${GEMINI_API_KEY:-}${GOOGLE_API_KEY:-}" ]] && echo -e "  ${GREEN}✓${NC} GEMINI_API_KEY set" && ((agents_found++)) || echo -e "  ${YELLOW}✗${NC} GEMINI_API_KEY not set"
    [[ -n "${OPENAI_API_KEY:-}" ]] && echo -e "  ${GREEN}✓${NC} OPENAI_API_KEY set" && ((agents_found++)) || echo -e "  ${YELLOW}✗${NC} OPENAI_API_KEY not set"
    echo ""
fi

if [[ $agents_found -eq 0 ]]; then
    echo -e "${RED}No agents available. Install at least one CLI tool or set an API key.${NC}"
    exit 1
fi

echo -e "${BOLD}Agent count: ${agents_found}${NC}"
echo -e "  1 agent  = serial review (still useful, ~10min)"
echo -e "  2 agents = parallel with cross-validation"
echo -e "  3 agents = full swarm with maximum coverage"
echo ""

# ── Make scripts executable ─────────────────────────────────────────────────
chmod +x "${SCRIPT_DIR}/review.sh"
echo -e "${GREEN}✓${NC} Made review.sh executable"

# ── Symlink option ──────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Optional: Create global alias${NC}"
echo "  Add to your shell rc:"
echo "    alias review='${SCRIPT_DIR}/review.sh'"
echo ""
echo "  Or symlink:"
echo "    sudo ln -sf ${SCRIPT_DIR}/review.sh /usr/local/bin/code-review"
echo ""

# ── Usage examples ──────────────────────────────────────────────────────────
echo -e "${BOLD}Quick Start:${NC}"
echo ""
echo "  # Full codebase review"
echo "  ./review.sh /path/to/project"
echo ""
echo "  # Review only changes since a branch/commit"
echo "  ./review.sh /path/to/project --diff main"
echo ""
echo "  # IoT-focused review"
echo "  ./review.sh /path/to/project --mode iot"
echo ""
echo "  # Use only Claude and Gemini"
echo "  ./review.sh /path/to/project --agents claude,gemini"
echo ""
echo "  # Dry run (see plan without executing)"
echo "  ./review.sh /path/to/project --dry-run"
echo ""

echo -e "${GREEN}${BOLD}Setup complete!${NC}"
