#!/usr/bin/env bash
# Enforces the "read before proposing/changing" standing rule in CLAUDE.md.
# Blocks Edit/Write/MultiEdit on files under claude-plugins/<plugin>/ unless
# the current transcript shows at least 5 distinct prior Read tool calls on
# OTHER files under the same plugin root.

set -euo pipefail

input=$(cat)

file_path=$(jq -r '.tool_input.file_path // empty' <<<"$input")
transcript_path=$(jq -r '.transcript_path // empty' <<<"$input")
cwd=$(jq -r '.cwd // empty' <<<"$input")

# No file_path → not a file op we gate. Allow.
if [[ -z "$file_path" ]]; then
  exit 0
fi

# Normalize relative path against cwd.
if [[ "$file_path" != /* ]]; then
  file_path="$cwd/$file_path"
fi

# Only gate edits under claude-plugins/<plugin>/.
if [[ ! "$file_path" =~ /claude-plugins/([^/]+)/ ]]; then
  exit 0
fi

plugin_name="${BASH_REMATCH[1]}"
plugin_root="${file_path%%/claude-plugins/${plugin_name}/*}/claude-plugins/${plugin_name}"

THRESHOLD=5

# Fail closed if transcript isn't available — we can't verify, so we block.
if [[ -z "$transcript_path" || ! -f "$transcript_path" ]]; then
  jq -n --arg root "$plugin_root" --arg target "$file_path" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: ("read-before-edit hook: transcript not available, cannot verify prior reads under " + $root + ". Block. Target: " + $target)
    }
  }'
  exit 0
fi

# Distinct files Read under the same plugin root, excluding the target itself.
read_files=$(
  jq -r --arg root "$plugin_root/" '
    select(.type == "assistant")
    | .message.content[]?
    | select(.type == "tool_use" and .name == "Read")
    | .input.file_path
    | select(. != null and startswith($root))
  ' "$transcript_path" 2>/dev/null | sort -u | grep -vxF "$file_path" || true
)

if [[ -z "$read_files" ]]; then
  read_count=0
else
  read_count=$(printf '%s\n' "$read_files" | wc -l | tr -d ' ')
fi

if (( read_count >= THRESHOLD )); then
  exit 0
fi

# Build a human-readable list of what's been read.
if [[ -n "$read_files" ]]; then
  read_list=$(printf -- '  - %s\n' $read_files)
else
  read_list="  (none)"
fi

reason="read-before-edit standing rule (see CLAUDE.md): before editing files under a plugin, you must have Read at least ${THRESHOLD} other distinct files under that plugin root in this session.

Plugin root: ${plugin_root}
Target file: ${file_path}
Distinct files read under this plugin: ${read_count} / ${THRESHOLD}

Files read so far:
${read_list}

Read more files under ${plugin_root}/ (commands/, hooks/, agents/, sibling skills/, AGENTS.md, README.md, .claude-plugin/plugin.json) and retry. Do NOT work around this with cat/head/tail — only Read tool calls count. If you genuinely need to bypass, ask the user."

jq -n --arg reason "$reason" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: $reason
  }
}'
