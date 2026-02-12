#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# CODE REVIEW SWARM - Multi-Agent Parallel Code Review
# ============================================================================
# Uses Claude Code, Gemini CLI, and Codex CLI in parallel across git worktrees
# to perform comprehensive code review from multiple expert perspectives.
#
# Each agent reviews different domains based on model strengths:
#   Claude Code  → Architecture, security, complex logic, cross-cutting concerns
#   Gemini CLI   → Large-scale pattern detection, full-file analysis, IoT protocols
#   Codex CLI    → Bug detection, type safety, test gaps, quick targeted checks
#
# Usage:
#   ./review.sh [target-dir] [options]
#
# Options:
#   --mode        full|feature|iot     (default: auto-detect)
#   --diff        branch-or-sha        (review only changes since this ref)
#   --agents      claude,gemini,codex  (comma-separated, default: all available)
#   --parallel    max-parallel-agents   (default: 3)
#   --output      output-directory      (default: .code-review/)
#   --config      path-to-config.yaml   (default: .review-swarm.yaml)
#   --no-worktree skip worktree isolation (use for small reviews)
#   --verbose     show agent output in real-time
#   --dry-run     show what would be reviewed without running agents
# ============================================================================

VERSION="1.0.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# ── Defaults ────────────────────────────────────────────────────────────────
TARGET_DIR=""
MODE="auto"
DIFF_REF=""
AGENTS_CSV=""
MAX_PARALLEL=3
OUTPUT_DIR=".code-review"
CONFIG_FILE=""
USE_WORKTREE=true
VERBOSE=false
DRY_RUN=false

# ── Model Configuration ────────────────────────────────────────────────────
# CLI tools (claude, gemini, codex) use their own configured model by default.
# This is intentional — the CLIs stay current automatically (e.g. codex defaults
# to gpt-5.3-codex, gemini CLI has gemini-3-flash/pro available).
#
# These vars are ONLY used for API-key curl fallbacks when the CLI isn't installed.
# Override via environment or .review-swarm.yaml.
CLAUDE_API_MODEL="${CLAUDE_API_MODEL:-claude-sonnet-4-20250514}"
OPENAI_API_MODEL="${OPENAI_API_MODEL:-o3}"              # or gpt-4.1 for speed
GEMINI_API_MODEL="${GEMINI_API_MODEL:-gemini-2.5-pro}"   # stable; gemini-3-flash also works
# Optional: override the model the CLI tools use (empty = use CLI's own default)
CODEX_CLI_MODEL="${CODEX_CLI_MODEL:-}"     # empty = codex's default (gpt-5.3-codex)
GEMINI_CLI_MODEL="${GEMINI_CLI_MODEL:-}"   # empty = gemini's default

# ── Parse args ──────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
    case $1 in
        --mode)       MODE="$2"; shift 2 ;;
        --diff)       DIFF_REF="$2"; shift 2 ;;
        --agents)     AGENTS_CSV="$2"; shift 2 ;;
        --parallel)   MAX_PARALLEL="$2"; shift 2 ;;
        --output)     OUTPUT_DIR="$2"; shift 2 ;;
        --config)     CONFIG_FILE="$2"; shift 2 ;;
        --no-worktree) USE_WORKTREE=false; shift ;;
        --verbose)    VERBOSE=true; shift ;;
        --dry-run)    DRY_RUN=true; shift ;;
        --version)    echo "code-review-swarm v${VERSION}"; exit 0 ;;
        --help|-h)    head -30 "$0" | tail -25; exit 0 ;;
        -*)           echo "Unknown option: $1"; exit 1 ;;
        *)            TARGET_DIR="$1"; shift ;;
    esac
done

# ── Resolve target ──────────────────────────────────────────────────────────
TARGET_DIR="${TARGET_DIR:-.}"
TARGET_DIR="$(cd "$TARGET_DIR" && pwd)"

if [[ ! -d "$TARGET_DIR/.git" ]] && [[ ! -f "$TARGET_DIR/.git" ]]; then
    echo -e "${RED}Error: $TARGET_DIR is not a git repository${NC}"
    echo "Code Review Swarm requires a git repo to create worktrees and track diffs."
    exit 1
fi

# Resolve output dir relative to target
OUTPUT_DIR="${TARGET_DIR}/${OUTPUT_DIR}"
mkdir -p "$OUTPUT_DIR"/{reports,worktrees,logs,findings}

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REVIEW_ID="review_${TIMESTAMP}"
LOG_FILE="${OUTPUT_DIR}/logs/${REVIEW_ID}.log"

# ── Logging ─────────────────────────────────────────────────────────────────
log() { echo -e "[$(date +%H:%M:%S)] $*" | tee -a "$LOG_FILE"; }
log_section() { echo -e "\n${BOLD}${BLUE}═══ $* ═══${NC}" | tee -a "$LOG_FILE"; }
log_agent() {
    local agent="$1" color="$2" msg="$3"
    echo -e "  ${color}[${agent}]${NC} ${msg}" | tee -a "$LOG_FILE"
}

# ── Agent Detection ─────────────────────────────────────────────────────────
detect_agents() {
    local available=()

    if command -v claude &>/dev/null; then
        available+=("claude")
        log_agent "Claude" "$CYAN" "✓ claude CLI detected"
    else
        log_agent "Claude" "$DIM" "✗ not found (install: npm i -g @anthropic-ai/claude-code)"
    fi

    if command -v gemini &>/dev/null; then
        available+=("gemini")
        log_agent "Gemini" "$GREEN" "✓ gemini CLI detected"
    else
        log_agent "Gemini" "$DIM" "✗ not found (install: npm i -g @anthropic-ai/gemini or pip install google-genai)"
    fi

    if command -v codex &>/dev/null; then
        available+=("codex")
        log_agent "Codex" "$MAGENTA" "✓ codex CLI detected"
    else
        log_agent "Codex" "$DIM" "✗ not found (install: npm i -g @openai/codex)"
    fi

    # Fallback: if none detected, check for API keys for curl-based dispatch
    if [[ ${#available[@]} -eq 0 ]]; then
        if [[ -n "${ANTHROPIC_API_KEY:-}" ]]; then
            available+=("claude-api")
            log_agent "Claude" "$CYAN" "✓ API key detected (curl mode)"
        fi
        if [[ -n "${GEMINI_API_KEY:-}" ]] || [[ -n "${GOOGLE_API_KEY:-}" ]]; then
            available+=("gemini-api")
            log_agent "Gemini" "$GREEN" "✓ API key detected (curl mode)"
        fi
        if [[ -n "${OPENAI_API_KEY:-}" ]]; then
            available+=("codex-api")
            log_agent "Codex" "$MAGENTA" "✓ API key detected (curl mode)"
        fi
    fi

    if [[ ${#available[@]} -eq 0 ]]; then
        echo -e "${RED}No agents available. Install at least one:${NC}"
        echo "  Claude Code:  npm i -g @anthropic-ai/claude-code"
        echo "  Gemini CLI:   npm i -g @google/gemini-cli     (Gemini 3 Flash/Pro)"
        echo "  Codex CLI:    npm i -g @openai/codex          (gpt-5.3-codex)"
        echo "  Or set API keys: ANTHROPIC_API_KEY, GEMINI_API_KEY, OPENAI_API_KEY"
        exit 1
    fi

    echo "${available[*]}"
}

# ── Codebase Classification ────────────────────────────────────────────────
classify_codebase() {
    local dir="$1"
    local result=""

    # Frontend detection
    if find "$dir" -maxdepth 3 -name "*.jsx" -o -name "*.tsx" -o -name "*.vue" -o -name "*.svelte" 2>/dev/null | head -1 | grep -q .; then
        result+="frontend,"
    fi

    # Backend detection
    if find "$dir" -maxdepth 3 \( -name "server.*" -o -name "app.py" -o -name "main.go" \) 2>/dev/null | head -1 | grep -q . || \
       grep -rql "express\|fastify\|flask\|django\|gin\|fiber" "$dir"/package.json "$dir"/requirements.txt "$dir"/go.mod 2>/dev/null; then
        result+="backend,"
    fi

    # IoT / Embedded detection
    if find "$dir" -maxdepth 4 \( -name "*.ino" -o -name "platformio.ini" -o -name "*.pio" \) 2>/dev/null | head -1 | grep -q . || \
       grep -rql "Arduino\|ESP32\|ESP8266\|WiFi.h\|MQTT\|PubSubClient" "$dir" --include="*.h" --include="*.cpp" --include="*.ino" 2>/dev/null; then
        result+="iot,"
    fi

    # Raspberry Pi / Hub detection
    if find "$dir" -maxdepth 4 \( -name "*.py" \) 2>/dev/null | xargs grep -l "RPi\|gpiozero\|paho\|mqtt\|serial\|smbus\|spidev" 2>/dev/null | head -1 | grep -q .; then
        result+="pi-hub,"
    fi

    # Database detection
    if find "$dir" -maxdepth 4 -name "*.sql" -o -name "*.prisma" -o -name "knexfile*" -o -name "drizzle.config*" 2>/dev/null | head -1 | grep -q .; then
        result+="database,"
    fi

    # WebSocket / Real-time detection
    if grep -rql "socket\.io\|ws\|WebSocket\|mqtt\|MQTT" "$dir" --include="*.js" --include="*.ts" --include="*.py" --include="*.jsx" --include="*.tsx" 2>/dev/null; then
        result+="realtime,"
    fi

    echo "${result%,}"  # trim trailing comma
}

# ── File Collection ─────────────────────────────────────────────────────────
collect_review_targets() {
    local dir="$1"
    local manifest="${OUTPUT_DIR}/findings/file_manifest.json"

    if [[ -n "$DIFF_REF" ]]; then
        # Feature/refactor mode: only changed files
        log "Collecting files changed since ${DIFF_REF}..."
        cd "$dir"
        git diff --name-only "$DIFF_REF"...HEAD --diff-filter=ACMR | \
            grep -E '\.(js|jsx|ts|tsx|py|go|rs|cpp|c|h|ino|vue|svelte|sql|prisma|yaml|yml|json|toml)$' | \
            sort > "${OUTPUT_DIR}/findings/changed_files.txt"

        git diff --stat "$DIFF_REF"...HEAD > "${OUTPUT_DIR}/findings/diff_stats.txt"
        git diff "$DIFF_REF"...HEAD > "${OUTPUT_DIR}/findings/full_diff.patch" 2>/dev/null || true
        cd - > /dev/null

        local count
        count=$(wc -l < "${OUTPUT_DIR}/findings/changed_files.txt" | tr -d ' ')
        log "Found ${BOLD}${count}${NC} changed files"
    else
        # Full review mode: everything
        log "Collecting all source files..."
        cd "$dir"
        find . -type f \( \
            -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \
            -o -name "*.py" -o -name "*.go" -o -name "*.rs" \
            -o -name "*.cpp" -o -name "*.c" -o -name "*.h" -o -name "*.ino" \
            -o -name "*.vue" -o -name "*.svelte" \
            -o -name "*.sql" -o -name "*.prisma" \
            -o -name "*.yaml" -o -name "*.yml" -o -name "*.toml" \
            -o -name "*.json" -o -name "*.env*" \
            -o -name "Dockerfile*" -o -name "docker-compose*" \
        \) \
            ! -path "*/node_modules/*" \
            ! -path "*/.git/*" \
            ! -path "*/dist/*" \
            ! -path "*/build/*" \
            ! -path "*/.next/*" \
            ! -path "*/vendor/*" \
            ! -path "*/__pycache__/*" \
            ! -path "*/.pio/*" \
            | sort > "${OUTPUT_DIR}/findings/all_files.txt"
        cd - > /dev/null

        local count
        count=$(wc -l < "${OUTPUT_DIR}/findings/all_files.txt" | tr -d ' ')
        log "Found ${BOLD}${count}${NC} source files"
    fi
}

# ── Worktree Management ────────────────────────────────────────────────────
create_worktree() {
    local name="$1"
    local wt_path="${OUTPUT_DIR}/worktrees/${name}"

    if [[ "$USE_WORKTREE" == true ]]; then
        if [[ -d "$wt_path" ]]; then
            cd "$TARGET_DIR"
            git worktree remove "$wt_path" --force 2>/dev/null || rm -rf "$wt_path"
            cd - > /dev/null
        fi
        cd "$TARGET_DIR"
        git worktree add "$wt_path" HEAD --detach --quiet 2>/dev/null
        cd - > /dev/null
        echo "$wt_path"
    else
        echo "$TARGET_DIR"
    fi
}

cleanup_worktrees() {
    if [[ "$USE_WORKTREE" == true ]] && [[ -d "${OUTPUT_DIR}/worktrees" ]]; then
        log "Cleaning up worktrees..."
        cd "$TARGET_DIR"
        for wt in "${OUTPUT_DIR}"/worktrees/*/; do
            [[ -d "$wt" ]] && git worktree remove "$wt" --force 2>/dev/null || true
        done
        cd - > /dev/null
        rm -rf "${OUTPUT_DIR}/worktrees" 2>/dev/null || true
    fi
}
trap cleanup_worktrees EXIT

# ── Agent Dispatch Functions ────────────────────────────────────────────────
dispatch_claude() {
    local review_domain="$1"
    local prompt_file="$2"
    local work_dir="$3"
    local output_file="$4"
    local context_files="$5"

    local prompt
    prompt=$(<"$prompt_file")

    # Inject context files list into prompt
    prompt=$(echo "$prompt" | sed "s|{{FILES}}|${context_files}|g")
    prompt=$(echo "$prompt" | sed "s|{{WORK_DIR}}|${work_dir}|g")
    prompt=$(echo "$prompt" | sed "s|{{DOMAIN}}|${review_domain}|g")

    if command -v claude &>/dev/null; then
        cd "$work_dir"
        claude -p "$prompt" --output-format text --max-turns 3 \
            > "$output_file" 2>>"${LOG_FILE}" || {
            log_agent "Claude" "$RED" "Failed on ${review_domain}"
            echo "# Review Failed\nAgent: Claude\nDomain: ${review_domain}\nError: See log for details" > "$output_file"
        }
        cd - > /dev/null
    elif [[ -n "${ANTHROPIC_API_KEY:-}" ]]; then
        # API fallback — uses CLAUDE_API_MODEL
        local response
        response=$(curl -s https://api.anthropic.com/v1/messages \
            -H "content-type: application/json" \
            -H "x-api-key: ${ANTHROPIC_API_KEY}" \
            -H "anthropic-version: 2023-06-01" \
            -d "$(jq -n --arg prompt "$prompt" --arg model "$CLAUDE_API_MODEL" '{
                model: $model,
                max_tokens: 8192,
                messages: [{role: "user", content: $prompt}]
            }')" 2>>"${LOG_FILE}")

        echo "$response" | jq -r '.content[0].text // "Error: No response"' > "$output_file"
    fi
}

dispatch_gemini() {
    local review_domain="$1"
    local prompt_file="$2"
    local work_dir="$3"
    local output_file="$4"
    local context_files="$5"

    local prompt
    prompt=$(<"$prompt_file")
    prompt=$(echo "$prompt" | sed "s|{{FILES}}|${context_files}|g")
    prompt=$(echo "$prompt" | sed "s|{{WORK_DIR}}|${work_dir}|g")
    prompt=$(echo "$prompt" | sed "s|{{DOMAIN}}|${review_domain}|g")

    if command -v gemini &>/dev/null; then
        cd "$work_dir"
        local model_flag=""
        [[ -n "$GEMINI_CLI_MODEL" ]] && model_flag="--model $GEMINI_CLI_MODEL"
        echo "$prompt" | gemini $model_flag \
            > "$output_file" 2>>"${LOG_FILE}" || {
            log_agent "Gemini" "$RED" "Failed on ${review_domain}"
            echo "# Review Failed\nAgent: Gemini\nDomain: ${review_domain}" > "$output_file"
        }
        cd - > /dev/null
    elif [[ -n "${GEMINI_API_KEY:-}${GOOGLE_API_KEY:-}" ]]; then
        local api_key="${GEMINI_API_KEY:-${GOOGLE_API_KEY}}"
        local response
        response=$(curl -s "https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_API_MODEL}:generateContent?key=${api_key}" \
            -H 'Content-Type: application/json' \
            -d "$(jq -n --arg prompt "$prompt" '{
                contents: [{parts: [{text: $prompt}]}],
                generationConfig: {maxOutputTokens: 8192}
            }')" 2>>"${LOG_FILE}")

        echo "$response" | jq -r '.candidates[0].content.parts[0].text // "Error: No response"' > "$output_file"
    fi
}

dispatch_codex() {
    local review_domain="$1"
    local prompt_file="$2"
    local work_dir="$3"
    local output_file="$4"
    local context_files="$5"

    local prompt
    prompt=$(<"$prompt_file")
    prompt=$(echo "$prompt" | sed "s|{{FILES}}|${context_files}|g")
    prompt=$(echo "$prompt" | sed "s|{{WORK_DIR}}|${work_dir}|g")
    prompt=$(echo "$prompt" | sed "s|{{DOMAIN}}|${review_domain}|g")

    if command -v codex &>/dev/null; then
        cd "$work_dir"
        # Use codex exec for non-interactive scripted review
        # Let codex use its configured default model (gpt-5.3-codex) unless overridden
        local model_flag=""
        [[ -n "$CODEX_CLI_MODEL" ]] && model_flag="--model $CODEX_CLI_MODEL"
        codex exec $model_flag --approval-mode full-auto --quiet \
            "$prompt" \
            > "$output_file" 2>>"${LOG_FILE}" || {
            log_agent "Codex" "$RED" "Failed on ${review_domain}"
            echo "# Review Failed\nAgent: Codex\nDomain: ${review_domain}" > "$output_file"
        }
        cd - > /dev/null
    elif [[ -n "${OPENAI_API_KEY:-}" ]]; then
        # API fallback — uses OPENAI_API_MODEL (default: o3)
        local response
        response=$(curl -s https://api.openai.com/v1/chat/completions \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${OPENAI_API_KEY}" \
            -d "$(jq -n --arg prompt "$prompt" --arg model "$OPENAI_API_MODEL" '{
                model: $model,
                messages: [{role: "user", content: $prompt}],
                max_completion_tokens: 8192
            }')" 2>>"${LOG_FILE}")

        echo "$response" | jq -r '.choices[0].message.content // "Error: No response"' > "$output_file"
    fi
}

# ── Review Task Definitions ────────────────────────────────────────────────
# Maps: domain → preferred_agent → fallback_agent
# This is where the model-strength matching happens
build_review_plan() {
    local domains="$1"
    local available_agents="$2"
    local plan_file="${OUTPUT_DIR}/findings/review_plan.txt"

    > "$plan_file"

    # Always run these core reviews
    echo "architecture|claude|gemini|${SCRIPT_DIR}/prompts/architecture.md" >> "$plan_file"
    echo "security|claude|codex|${SCRIPT_DIR}/prompts/security.md" >> "$plan_file"

    # Domain-specific reviews based on classification
    if echo "$domains" | grep -q "frontend"; then
        echo "frontend|codex|claude|${SCRIPT_DIR}/prompts/frontend.md" >> "$plan_file"
    fi
    if echo "$domains" | grep -q "backend"; then
        echo "backend|claude|gemini|${SCRIPT_DIR}/prompts/backend.md" >> "$plan_file"
    fi
    if echo "$domains" | grep -q "iot\|pi-hub"; then
        echo "iot-embedded|gemini|claude|${SCRIPT_DIR}/prompts/iot.md" >> "$plan_file"
    fi
    if echo "$domains" | grep -q "realtime"; then
        echo "realtime-dataflow|gemini|claude|${SCRIPT_DIR}/prompts/dataflow.md" >> "$plan_file"
    fi
    if echo "$domains" | grep -q "database"; then
        echo "database|codex|claude|${SCRIPT_DIR}/prompts/database.md" >> "$plan_file"
    fi

    # Performance review gets assigned to Gemini (large context = can see patterns)
    echo "performance|gemini|codex|${SCRIPT_DIR}/prompts/performance.md" >> "$plan_file"

    cat "$plan_file"
}

resolve_agent() {
    local preferred="$1"
    local fallback="$2"
    local available="$3"

    if echo "$available" | grep -qw "$preferred"; then
        echo "$preferred"
    elif echo "$available" | grep -qw "${preferred}-api"; then
        echo "${preferred}-api"
    elif echo "$available" | grep -qw "$fallback"; then
        echo "$fallback"
    elif echo "$available" | grep -qw "${fallback}-api"; then
        echo "${fallback}-api"
    else
        # Use whatever's available
        echo "$available" | tr ' ' '\n' | head -1
    fi
}

dispatch_agent() {
    local agent="$1"
    local domain="$2"
    local prompt_file="$3"
    local work_dir="$4"
    local output_file="$5"
    local context_files="$6"

    case "$agent" in
        claude|claude-api) dispatch_claude "$domain" "$prompt_file" "$work_dir" "$output_file" "$context_files" ;;
        gemini|gemini-api) dispatch_gemini "$domain" "$prompt_file" "$work_dir" "$output_file" "$context_files" ;;
        codex|codex-api)   dispatch_codex  "$domain" "$prompt_file" "$work_dir" "$output_file" "$context_files" ;;
        *) log "Unknown agent: $agent"; return 1 ;;
    esac
}

# ── Build Context for Each Domain ──────────────────────────────────────────
build_context() {
    local domain="$1"
    local files_list="$2"
    local work_dir="$3"
    local max_files=50  # prevent context overflow

    local context=""
    local count=0

    case "$domain" in
        architecture)
            # Feed config files, entry points, main modules
            context=$(cd "$work_dir" && find . -maxdepth 2 \( \
                -name "package.json" -o -name "tsconfig*" -o -name "*.config.*" \
                -o -name "Dockerfile*" -o -name "docker-compose*" \
                -o -name ".env*" -o -name "platformio.ini" \
            \) ! -path "*/node_modules/*" | head -$max_files | sort)
            ;;
        security)
            # Auth files, env configs, API routes, middleware
            context=$(cd "$work_dir" && grep -rl "auth\|token\|jwt\|password\|secret\|credential\|bcrypt\|cors\|helmet\|csrf\|sanitiz" \
                --include="*.js" --include="*.ts" --include="*.py" --include="*.jsx" --include="*.tsx" \
                . 2>/dev/null | head -$max_files | sort)
            ;;
        frontend)
            context=$(cd "$work_dir" && find . -type f \( -name "*.jsx" -o -name "*.tsx" -o -name "*.vue" -o -name "*.svelte" -o -name "*.css" \) \
                ! -path "*/node_modules/*" ! -path "*/dist/*" | head -$max_files | sort)
            ;;
        backend)
            context=$(cd "$work_dir" && find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.py" -o -name "*.go" \) \
                ! -path "*/node_modules/*" ! -path "*/dist/*" ! -path "*/.next/*" \
                | xargs grep -l "app\.\|router\.\|route\|endpoint\|handler\|controller\|middleware" 2>/dev/null \
                | head -$max_files | sort)
            ;;
        iot-embedded)
            context=$(cd "$work_dir" && find . -type f \( \
                -name "*.ino" -o -name "*.cpp" -o -name "*.c" -o -name "*.h" \
                -o -name "platformio.ini" \
            \) ! -path "*/.pio/*" | head -$max_files | sort)
            # Also grab Pi scripts
            local pi_files
            pi_files=$(find . -type f -name "*.py" | xargs grep -l "RPi\|GPIO\|mqtt\|serial\|smbus\|paho" 2>/dev/null | head -20)
            [[ -n "$pi_files" ]] && context+=$'\n'"$pi_files"
            ;;
        realtime-dataflow)
            context=$(cd "$work_dir" && grep -rl "socket\|WebSocket\|mqtt\|MQTT\|EventSource\|SSE\|emit\|subscribe\|publish" \
                --include="*.js" --include="*.ts" --include="*.py" --include="*.jsx" --include="*.tsx" --include="*.cpp" --include="*.ino" \
                . 2>/dev/null | head -$max_files | sort)
            ;;
        database)
            context=$(cd "$work_dir" && find . -type f \( \
                -name "*.sql" -o -name "*.prisma" -o -name "*.migration*" \
                -o -name "knexfile*" -o -name "drizzle.config*" \
            \) ! -path "*/node_modules/*" | head -$max_files | sort)
            # Also grab files with DB queries
            local query_files
            query_files=$(grep -rl "SELECT\|INSERT\|UPDATE\|DELETE\|prisma\.\|knex\|sequelize\|mongoose\|TypeORM" \
                --include="*.js" --include="*.ts" --include="*.py" . 2>/dev/null | head -20)
            [[ -n "$query_files" ]] && context+=$'\n'"$query_files"
            ;;
        performance)
            context=$(cat "$files_list" 2>/dev/null | head -$max_files)
            ;;
    esac

    echo "$context"
}

# ── Main Execution ──────────────────────────────────────────────────────────
main() {
    echo -e "${BOLD}${CYAN}"
    echo '  ╔═══════════════════════════════════════════════════════════╗'
    echo '  ║          CODE REVIEW SWARM v'${VERSION}'                       ║'
    echo '  ║     Multi-Agent Parallel Code Review Orchestrator        ║'
    echo '  ╚═══════════════════════════════════════════════════════════╝'
    echo -e "${NC}"

    log "Review ID: ${REVIEW_ID}"
    log "Target: ${TARGET_DIR}"

    # ── Step 1: Detect available agents ──
    log_section "Agent Detection"
    local available_agents
    available_agents=$(detect_agents)
    log "Available: ${BOLD}${available_agents}${NC}"

    # Override if user specified
    if [[ -n "$AGENTS_CSV" ]]; then
        available_agents=$(echo "$AGENTS_CSV" | tr ',' ' ')
        log "Using specified agents: ${available_agents}"
    fi

    # ── Step 2: Classify codebase ──
    log_section "Codebase Classification"
    local domains
    domains=$(classify_codebase "$TARGET_DIR")
    log "Detected domains: ${BOLD}${domains}${NC}"

    if [[ "$MODE" != "auto" ]]; then
        case "$MODE" in
            iot) domains="frontend,backend,iot,pi-hub,realtime,database" ;;
            full) domains="frontend,backend,database,realtime" ;;
            feature) ;; # use detected
        esac
        log "Mode override: ${MODE} → ${domains}"
    fi

    # ── Step 3: Collect files to review ──
    log_section "File Collection"
    collect_review_targets "$TARGET_DIR"

    # ── Step 4: Build review plan ──
    log_section "Review Plan"
    local plan
    plan=$(build_review_plan "$domains" "$available_agents")

    echo -e "${DIM}Domain assignments:${NC}"
    while IFS='|' read -r domain preferred fallback prompt_file; do
        local assigned
        assigned=$(resolve_agent "$preferred" "$fallback" "$available_agents")
        local agent_color="$NC"
        case "$assigned" in
            claude*) agent_color="$CYAN" ;;
            gemini*) agent_color="$GREEN" ;;
            codex*)  agent_color="$MAGENTA" ;;
        esac
        echo -e "  ${BOLD}${domain}${NC} → ${agent_color}${assigned}${NC} ${DIM}(prompt: $(basename "$prompt_file"))${NC}"
    done <<< "$plan"

    if [[ "$DRY_RUN" == true ]]; then
        log "Dry run complete. Review plan above."
        exit 0
    fi

    # ── Step 5: Dispatch agents in parallel ──
    log_section "Agent Dispatch"

    local pids=()
    local agent_count=0
    local files_list="${OUTPUT_DIR}/findings/all_files.txt"
    [[ -n "$DIFF_REF" ]] && files_list="${OUTPUT_DIR}/findings/changed_files.txt"

    while IFS='|' read -r domain preferred fallback prompt_file; do
        local assigned
        assigned=$(resolve_agent "$preferred" "$fallback" "$available_agents")

        # Create worktree for this agent
        local work_dir
        work_dir=$(create_worktree "agent_${domain}")

        # Build context file list for this domain
        local context_files
        context_files=$(build_context "$domain" "$files_list" "$work_dir")

        local output_file="${OUTPUT_DIR}/reports/${domain}_${assigned%%"-api"}.md"

        log_agent "${assigned}" "$(case $assigned in claude*) echo $CYAN;; gemini*) echo $GREEN;; codex*) echo $MAGENTA;; esac)" \
            "Reviewing ${BOLD}${domain}${NC}..."

        # Dispatch in background
        dispatch_agent "$assigned" "$domain" "$prompt_file" "$work_dir" "$output_file" "$context_files" &
        pids+=($!)
        ((agent_count++))

        # Throttle parallelism
        if [[ $agent_count -ge $MAX_PARALLEL ]]; then
            wait "${pids[0]}" 2>/dev/null || true
            pids=("${pids[@]:1}")
            ((agent_count--))
        fi
    done <<< "$plan"

    # Wait for all remaining agents
    log "Waiting for ${#pids[@]} remaining agents..."
    for pid in "${pids[@]}"; do
        wait "$pid" 2>/dev/null || true
    done

    log_section "All Agents Complete"

    # ── Step 6: Synthesis ──
    log_section "Synthesizing Report"

    local synthesis_input=""
    for report in "${OUTPUT_DIR}"/reports/*.md; do
        [[ -f "$report" ]] || continue
        local domain_name
        domain_name=$(basename "$report" .md)
        synthesis_input+="
=== REVIEW: ${domain_name} ===
$(cat "$report")
=== END: ${domain_name} ===

"
    done

    # Use Claude for synthesis (best at reasoning across reports)
    local synthesis_prompt
    synthesis_prompt=$(<"${SCRIPT_DIR}/prompts/synthesis.md")
    synthesis_prompt=$(echo "$synthesis_prompt" | sed "s|{{AGENT_REPORTS}}|${synthesis_input}|g")
    synthesis_prompt=$(echo "$synthesis_prompt" | sed "s|{{DOMAINS}}|${domains}|g")
    synthesis_prompt=$(echo "$synthesis_prompt" | sed "s|{{REVIEW_ID}}|${REVIEW_ID}|g")
    synthesis_prompt=$(echo "$synthesis_prompt" | sed "s|{{TIMESTAMP}}|$(date -Iseconds)|g")

    local final_report="${OUTPUT_DIR}/REVIEW_REPORT.md"
    local synth_agent
    synth_agent=$(resolve_agent "claude" "gemini" "$available_agents")

    log "Synthesis agent: ${synth_agent}"

    if [[ "$synth_agent" == claude* ]]; then
        dispatch_claude "synthesis" <(echo "$synthesis_prompt") "$TARGET_DIR" "$final_report" "" 2>/dev/null || \
            # Fallback: just concatenate if synthesis fails
            echo "$synthesis_input" > "$final_report"
    elif [[ "$synth_agent" == gemini* ]]; then
        dispatch_gemini "synthesis" <(echo "$synthesis_prompt") "$TARGET_DIR" "$final_report" "" 2>/dev/null || \
            echo "$synthesis_input" > "$final_report"
    else
        # Fallback: create structured concatenation
        {
            echo "# Code Review Report"
            echo "Review ID: ${REVIEW_ID}"
            echo "Date: $(date -Iseconds)"
            echo "Domains: ${domains}"
            echo ""
            echo "---"
            echo ""
            echo "$synthesis_input"
        } > "$final_report"
    fi

    # ── Step 7: Summary ──
    log_section "Review Complete"
    echo -e "${GREEN}${BOLD}"
    echo '  ✓ Review complete!'
    echo -e "${NC}"
    echo -e "  ${BOLD}Final report:${NC}  ${final_report}"
    echo -e "  ${BOLD}Agent reports:${NC} ${OUTPUT_DIR}/reports/"
    echo -e "  ${BOLD}Full log:${NC}      ${LOG_FILE}"
    echo ""

    # Print quick summary of findings
    local total_findings=0
    for report in "${OUTPUT_DIR}"/reports/*.md; do
        [[ -f "$report" ]] || continue
        local critical
        critical=$(grep -ci "critical\|severe\|vulnerability\|injection\|overflow" "$report" 2>/dev/null || echo 0)
        local warnings
        warnings=$(grep -ci "warning\|caution\|consider\|should\|recommend" "$report" 2>/dev/null || echo 0)
        local domain_name
        domain_name=$(basename "$report" .md)
        echo -e "  ${BOLD}${domain_name}${NC}: ${RED}${critical} critical${NC} | ${YELLOW}${warnings} warnings${NC}"
        ((total_findings += critical + warnings))
    done

    echo -e "\n  ${BOLD}Total signals: ${total_findings}${NC}"
    echo ""
}

main "$@"
