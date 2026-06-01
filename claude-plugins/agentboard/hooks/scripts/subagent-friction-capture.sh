#!/usr/bin/env bash
# subagent-friction-capture.sh
# SubagentStop hook — deterministically captures autonomy-friction signals from a
# finished orchestration subagent's OWN transcript into a per-session staging
# file, so the Stop-event observer (an agent hook that only sees the MAIN
# transcript) can reason over friction that happened *inside* the waves.
#
# Why a command hook (not an agent hook): orchestration subagents are isolated —
# the main transcript receives only their final summary, not their internal
# 422s / FAIL verdicts / RAG cold-starts (confirmed in the sub-agents docs). The
# subagent's own transcript is delivered here via `agent_transcript_path`
# (Agent SDK hooks reference). A *command* hook cannot spawn a subagent, so it is
# immune to the documented recursive-hook-loop risk that an agent hook on
# SubagentStop would carry. This stage is pure deterministic capture (grep); all
# reasoning happens in the Stop observer.
#
# Contract: never blocks (always exits 0); writes only to
# $HOME/.agentboard/observations/.staging-<session_id>.jsonl.
set -uo pipefail

JQ_BIN="${AGENTBOARD_JQ_BIN:-jq}"

# --- Input acquisition (Claude Code hook protocol: JSON on stdin) ------------
PAYLOAD=""
if [ -t 0 ]; then
  PAYLOAD="${HOOK_INPUT:-}"
else
  PAYLOAD="$(cat)"
fi
[ -n "$PAYLOAD" ] || exit 0
command -v "$JQ_BIN" >/dev/null 2>&1 || exit 0

# --- Loop guard ---------------------------------------------------------------
if [ "$(printf '%s' "$PAYLOAD" | "$JQ_BIN" -r '.stop_hook_active // false' 2>/dev/null)" = "true" ]; then
  exit 0
fi

SESSION_ID="$(printf '%s' "$PAYLOAD" | "$JQ_BIN" -r '.session_id // "unknown"' 2>/dev/null)"
AGENT_TYPE="$(printf '%s' "$PAYLOAD" | "$JQ_BIN" -r '.agent_type // "unknown"' 2>/dev/null)"
# Prefer the subagent's OWN transcript; fall back to transcript_path if the field
# name differs on the CLI build (the SDK reference names it agent_transcript_path).
TRANSCRIPT="$(printf '%s' "$PAYLOAD" | "$JQ_BIN" -r '.agent_transcript_path // .transcript_path // empty' 2>/dev/null)"
[ -n "$TRANSCRIPT" ] || exit 0
case "$TRANSCRIPT" in "~"*) TRANSCRIPT="${HOME}${TRANSCRIPT#\~}";; esac
[ -f "$TRANSCRIPT" ] || exit 0

# --- Scope to AgentBoard pipeline subagents only ------------------------------
# Allowlist by agent_type. This also excludes the observer's OWN analysis
# subagent and unrelated workers (Explore, general-purpose), preventing the
# observer from capturing its own transcript (which would echo these keywords).
case "$AGENT_TYPE" in
  *plan*|*review*|*implement*|*audit*|*architecture*|*compose*|*orchestrat*) : ;;
  *) exit 0 ;;
esac

# --- Deterministic friction signatures (keep aligned with the observer taxonomy)
SIGNATURE='HTTP 422|HTTP 409|REVIEW_NOTE_MISSING_VERDICT|Verdict: FAIL|status.{0,3}indexing|Error loading hnsw|No graph|not been scanned|build failed|lint failed|INVALID_TRANSITION|permission denied|tool not loaded|max retries'

HITS="$(grep -aoiE "$SIGNATURE" "$TRANSCRIPT" 2>/dev/null | sort | uniq -c | sort -rn | head -20 || true)"
[ -n "$HITS" ] || exit 0

# --- Stage one JSON record (never overwrites; append-only) --------------------
STAGING_DIR="${HOME}/.agentboard/observations"
mkdir -p "$STAGING_DIR" 2>/dev/null || exit 0
STAGING_FILE="${STAGING_DIR}/.staging-${SESSION_ID}.jsonl"

"$JQ_BIN" -nc \
  --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --arg agent "$AGENT_TYPE" \
  --arg transcript "$TRANSCRIPT" \
  --arg signals "$HITS" \
  '{ts:$ts, agent_type:$agent, transcript:$transcript, signals:$signals}' \
  >> "$STAGING_FILE" 2>/dev/null || true

exit 0
