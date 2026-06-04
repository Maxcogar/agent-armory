# Expert Standard Hooks

Structural enforcement of the Expert Standard at the points where failures occur inside the agentic loop.

## Three Hooks

### PreToolUse — Write|Edit|MultiEdit (prompt hook)

**Verified against:** Anthropic's official hook-development skill and hooks reference. PreToolUse prompt hooks receive `$ARGUMENTS` containing the full tool input JSON. The evaluator model returns 'approve' or 'deny'.

**What it does:** Every time the agent is about to write or edit a file, a model evaluates the code against established engineering standards. The prompt carries the Expert Standard's reasoning frame — evaluate against what the discipline says, not what the codebase does, and name the standard for every concern. Not a hardcoded checklist.

**What happens on deny:** The write is blocked. The agent sees which standard was violated and what must change.

### UserPromptSubmit (command hook)

**Verified against:** Official hooks reference and guide. UserPromptSubmit stdout becomes context the agent sees before processing.

**What it does:** Injects a condensed Expert Standard frame before every prompt. Addresses context decay — keeps the standard temporally close instead of fading as codebase reads fill the context window.

### TaskCompleted (command hook)

**Verified against:** Official hooks reference confirms TaskCompleted fires when a task is marked complete, always fires (no matcher support). Input includes common fields (session_id, transcript_path, cwd, hook_event_name).

**What it does:** Saves the full hook input to a timestamped JSON file in `.claude/hooks/task-logs/`. Preserves raw task output before the main agent summarizes it.

**Note:** The exact fields in TaskCompleted input beyond the common fields were not verified in the documentation. The script saves everything it receives. On first run, check the output file to confirm what fields are present. If the task response content isn't in the input, the `transcript_path` field (which IS documented as a common field) points to the full session transcript where the content can be found.

## Installation

```bash
# Copy hooks to your project
mkdir -p /path/to/project/.claude/hooks
cp expert-standard-inject.sh /path/to/project/.claude/hooks/
cp capture-task-output.py /path/to/project/.claude/hooks/
chmod +x /path/to/project/.claude/hooks/expert-standard-inject.sh

# Merge settings-hooks.json into your .claude/settings.json or .claude/settings.local.json
```

Verify with `/hooks` in Claude Code.

## Tuning the PreToolUse Prompt

The prompt carries the Expert Standard's evaluation frame. To adjust:

- **Change severity threshold:** Currently denies only for security failures, data loss, data integrity problems, or operational failures. Broaden or narrow this list.
- **Add domain standards:** If your project has specific governing standards (HIPAA, PCI-DSS, specific framework conventions), add them to the prompt.
- **Switch to agent hook for plan compliance:** The prompt hook can't read the plan file. An agent hook can:

```json
{
  "type": "agent",
  "prompt": "Read the current plan document in the project, then evaluate whether this code change follows the plan. If it deviates from a specific plan step, deny and explain what the plan requires. $ARGUMENTS"
}
```

Agent hooks are slower (60s default timeout) but can use Read, Grep, and Glob.

## Dependencies

- `bash` (injection script)
- `python3` with stdlib only (capture script)
- Claude Code with prompt hook support
