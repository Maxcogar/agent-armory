# Project Initialization Hook for Claude Code CLI
# This hook ALWAYS offers to set up project templates when Claude Code CLI starts

# Rule: Always offer project template setup when Claude Code CLI starts
Every time Claude Code CLI starts, immediately offer project template setup options, regardless of project state or directory contents.

## Implementation Details:
- Trigger: Before any task execution (PreToolUse) 
- Target: Task tool (first thing when Claude starts)
- Action: Always show template menu
- Command: Run project initialization with immediate prompt

## Usage with rule2hook:
Run `/rule2hook` in Claude Code CLI and provide this file as input.

## Expected Hook Configuration:
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Task",
      "hooks": [{
        "type": "command", 
        "command": "powershell -NoProfile -ExecutionPolicy Bypass -File \"C:\\Users\\maxco\\OneDrive\\Documents\\GitHub\\Coding Tools\\Claude\\project-initializer\\scripts\\Initialize-Project.ps1\" -Force"
      }]
    }]
  }
}
```

This will:
1. Run every time Claude starts a task
2. Always show the template menu
3. Let you choose what you want or decline
4. Not do any "smart" detection - just always ask
