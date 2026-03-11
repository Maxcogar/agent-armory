# Bare Claude Code Roles System

Isolated, role-specific Claude Code instances launched via PowerShell.
Each role is completely isolated from your main `~/.claude` setup using `CLAUDE_CONFIG_DIR`.

## What's In This Folder

```
C:\Users\maxco\claude-roles-system\
    Setup-ClaudeRoles.ps1   <- run once to create everything
    Invoke-ClaudeRole.ps1   <- run this to use a role
    README.md               <- this file
```

## What Setup Creates

```
C:\Users\maxco\claude-roles\
    code-reviewer\
        CLAUDE.md               <- role identity and instructions
        settings.json           <- what tools it can/can't use
        .credentials.json       <- copy of your Claude credentials
        default-prompt.txt      <- prompt used when you don't pass one
```

## First-Time Setup

Only needs to be done once. Open PowerShell and run:

```powershell
# Allow local scripts to run (only needed once ever)
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned

# Unblock the downloaded files (only needed once)
cd C:\Users\maxco\claude-roles-system
Unblock-File .\Setup-ClaudeRoles.ps1
Unblock-File .\Invoke-ClaudeRole.ps1

# Run setup
.\Setup-ClaudeRoles.ps1
```

## Usage

```powershell
cd C:\Users\maxco\claude-roles-system

# Basic - runs the review and waits until done
.\Invoke-ClaudeRole.ps1 -Role code-reviewer -TargetDir C:\path\to\your\project

# Custom prompt - override the default
.\Invoke-ClaudeRole.ps1 -Role code-reviewer -TargetDir C:\path\to\your\project `
    -Prompt "Review only the authentication module. Focus on security."

# Run in the background while you keep working
$job = .\Invoke-ClaudeRole.ps1 -Role code-reviewer -TargetDir C:\path\to\your\project -Async

# Check if it's done
Get-Job $job.Id

# Collect the output when done
$job | Wait-Job | Receive-Job
```

When the review is done, `claude-review-report.md` will appear in your target directory.

## Adding a New Role

1. Open `Setup-ClaudeRoles.ps1` in a text editor
2. Find the `$roles = @(...)` section
3. Copy the existing `code-reviewer` block and fill in the four fields:
   - `Name` - folder name for the role
   - `DefaultPrompt` - what it does by default
   - `ClaudeMd` - the role's identity and rules
   - `SettingsJson` - what tools it's allowed to use
4. Save and re-run `.\Setup-ClaudeRoles.ps1`

### Minimal CLAUDE.md template

```
# Role: <name>

You are a <description>.

## What You Do
<task>

## Hard Rules
- <constraint>
- When done, stop.
```

### Minimal settings.json template

```json
{
  "permissions": {
    "allow": [
      "Read(**)",
      "Glob(**)"
    ],
    "deny": [
      "Edit(**)",
      "Bash(rm:*)"
    ]
  }
}
```

## How Isolation Works

`CLAUDE_CONFIG_DIR` tells Claude Code to use the role's folder instead of `~/.claude/`
for all user-level config. That means:

- Your main `~/.claude/CLAUDE.md` is **not loaded**
- Your main `~/.claude/settings.json` is **not loaded**
- Your session history, memories, custom commands - **none of it bleeds in**
- The role's own `CLAUDE.md` and `settings.json` are used instead

Credentials are copied from your main Claude credentials, so roles bill to your Max subscription.

## If You Get Logged Out of Claude Code

If Claude Code makes you re-authenticate, the copied credentials in each role will be stale.
Fix it by deleting the old copies and re-running setup:

```powershell
cd C:\Users\maxco\claude-roles-system
Get-ChildItem C:\Users\maxco\claude-roles -Recurse -Filter ".credentials.json" | Remove-Item
.\Setup-ClaudeRoles.ps1
```
