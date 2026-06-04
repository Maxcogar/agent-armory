#!/usr/bin/env bash
# skill-enforcer.sh
# UserPromptSubmit hook — detects explicit skill name mentions in the user's
# prompt and outputs targeted enforcement text so Claude invokes the correct
# skill via the Skill tool before doing anything else.
#
# Input: JSON on stdin with { "prompt": "..." }
# Output: enforcement text on stdout (exit 0)

PROMPT=$(cat | jq -r '.prompt // empty' 2>/dev/null)
if [ -z "$PROMPT" ]; then
  exit 0
fi

# Superpowers skills
SKILLS=(
  "systematic-debugging"
  "writing-plans"
  "executing-plans"
  "verification-before-completion"
  "test-driven-development"
  "subagent-driven-development"
  "brainstorming"
  "receiving-code-review"
  "requesting-code-review"
  "using-git-worktrees"
  "finishing-a-development-branch"
  "dispatching-parallel-agents"
  "writing-skills"
  "using-superpowers"
)

# Project-local skills
LOCAL_SKILLS=(
  "agentboard"
  "source-of-truth-sync"
  "verify-alignment"
  "codebase-rag-enforcer"
  "mcp-builder"
  "app-user-docs"
)

found=()

for skill in "${SKILLS[@]}"; do
  if echo "$PROMPT" | grep -qi "$skill"; then
    found+=("superpowers:$skill")
  fi
done

for skill in "${LOCAL_SKILLS[@]}"; do
  if echo "$PROMPT" | grep -qi "$skill"; then
    found+=("$skill")
  fi
done

if [ ${#found[@]} -gt 0 ]; then
  echo "SKILL ENFORCEMENT ALERT: The user explicitly named these skills in their message:"
  for s in "${found[@]}"; do
    echo "  -> $s"
  done
  echo ""
  echo "You MUST call the Skill tool with skill=\"<name>\" for EACH one BEFORE doing anything else."
  echo "DO NOT substitute a different skill. DO NOT skip. DO NOT use Read on the skill file."
  echo "Call the Skill tool FIRST, then follow the skill's instructions."
fi

exit 0
