# Setup-ClaudeRoles.ps1
# Creates the entire claude-roles system from scratch.
# Run this once. Re-run anytime to add credentials to new roles.
#
# Default install location: C:\Users\<you>\claude-roles\
# To override: .\Setup-ClaudeRoles.ps1 -RolesRoot "D:\somewhere-else\claude-roles"

param(
    [string]$RolesRoot = "$env:USERPROFILE\claude-roles"
)

$credSource = "$env:USERPROFILE\.claude\.credentials.json"

# 1. Verify credentials exist
if (-not (Test-Path $credSource)) {
    Write-Error @"
Credentials not found at: $credSource

You need to log into Claude Code first:
  1. Open a terminal and run: claude
  2. Log in when prompted, then exit (Ctrl+C twice)
  3. Re-run this script
"@
    exit 1
}
Write-Host "Credentials found at $credSource" -ForegroundColor Green

# 2. Create roles root directory
New-Item -ItemType Directory -Force -Path $RolesRoot | Out-Null
Write-Host "Roles root: $RolesRoot" -ForegroundColor Green

# 3. Define roles
# To add a new role: copy one of the blocks below and fill in the four fields.
$roles = @(
    @{
        Name          = "code-reviewer"
        DefaultPrompt = "Review all code in this directory. Produce a complete review report per your instructions and write it to claude-review-report.md."
        ClaudeMd      = @"
# Role: Code Reviewer

You are a focused, thorough code reviewer. You have one job per invocation.

## What You Do
Read the code in the working directory. Produce a structured review report.
Write the report to ``claude-review-report.md`` in the working directory.

## Report Format

# Code Review Report
Generated: <timestamp>
Scope: <what you reviewed>

## Executive Summary
<2-4 sentences on overall state of the code>

## Critical Issues
<bugs, crashes, data loss risks - must fix>

## Security Issues
<injection, auth gaps, secrets in code, etc.>

## Code Quality
<smells, duplication, naming, complexity>

## Suggestions
<non-blocking improvements>

## Positives
<what is done well>

## Hard Rules
- DO NOT modify any source files
- ONLY write to ``claude-review-report.md``
- Do not ask clarifying questions. Make your best judgment and note assumptions in the report.
- Do not summarize what you are about to do. Just do it.
- When the report is written, stop.
"@
        SettingsJson  = @'
{
  "permissions": {
    "allow": [
      "Read(**)",
      "Glob(**)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(git show:*)",
      "Bash(git status:*)",
      "Write(claude-review-report.md)"
    ],
    "deny": [
      "Edit(**)",
      "Bash(rm:*)",
      "Bash(del:*)",
      "Bash(npm:*)",
      "Bash(pip:*)",
      "Bash(python:*)",
      "Bash(node:*)",
      "WebFetch(*)",
      "WebSearch(*)"
    ]
  }
}
'@
    }

    # Add more roles here - copy the block above and change the four fields
)

# 4. Create each defined role
foreach ($role in $roles) {
    $roleDir = "$RolesRoot\$($role.Name)"
    New-Item -ItemType Directory -Force -Path $roleDir | Out-Null
    Write-Host ""
    Write-Host "  Role: $($role.Name)" -ForegroundColor Cyan

    $claudeMdPath = "$roleDir\CLAUDE.md"
    if (-not (Test-Path $claudeMdPath)) {
        Set-Content -Path $claudeMdPath -Value $role.ClaudeMd -Encoding UTF8
        Write-Host "    Created CLAUDE.md" -ForegroundColor Green
    } else {
        Write-Host "    CLAUDE.md already exists - skipping" -ForegroundColor DarkGray
    }

    $settingsPath = "$roleDir\settings.json"
    if (-not (Test-Path $settingsPath)) {
        Set-Content -Path $settingsPath -Value $role.SettingsJson -Encoding UTF8
        Write-Host "    Created settings.json" -ForegroundColor Green
    } else {
        Write-Host "    settings.json already exists - skipping" -ForegroundColor DarkGray
    }

    $promptPath = "$roleDir\default-prompt.txt"
    if (-not (Test-Path $promptPath)) {
        Set-Content -Path $promptPath -Value $role.DefaultPrompt -Encoding UTF8
        Write-Host "    Created default-prompt.txt" -ForegroundColor Green
    } else {
        Write-Host "    default-prompt.txt already exists - skipping" -ForegroundColor DarkGray
    }

    $credDest = "$roleDir\.credentials.json"
    if (-not (Test-Path $credDest)) {
        try {
            New-Item -ItemType SymbolicLink -Path $credDest -Target $credSource -ErrorAction Stop | Out-Null
            Write-Host "    Credentials symlinked" -ForegroundColor Green
        } catch {
            Copy-Item $credSource $credDest
            Write-Host "    Credentials COPIED (symlink requires admin - re-run setup if Claude Code rotates credentials)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "    Credentials already wired - skipping" -ForegroundColor DarkGray
    }
}

# 5. Also wire credentials for any manually-created role folders not in the list above
$knownRoleNames = $roles | ForEach-Object { $_.Name }
Get-ChildItem -Path $RolesRoot -Directory | Where-Object { $knownRoleNames -notcontains $_.Name } | ForEach-Object {
    $credDest = "$($_.FullName)\.credentials.json"
    if (-not (Test-Path $credDest)) {
        Write-Host ""
        Write-Host "  Role: $($_.Name) (manual)" -ForegroundColor Cyan
        try {
            New-Item -ItemType SymbolicLink -Path $credDest -Target $credSource -ErrorAction Stop | Out-Null
            Write-Host "    Credentials symlinked" -ForegroundColor Green
        } catch {
            Copy-Item $credSource $credDest
            Write-Host "    Credentials COPIED (symlink requires admin)" -ForegroundColor Yellow
        }
    }
}

# 6. Summary
Write-Host ""
Write-Host "Setup complete. Roles at $RolesRoot" -ForegroundColor Cyan
Write-Host ""
Get-ChildItem $RolesRoot -Directory | ForEach-Object {
    $ready = (Test-Path "$($_.FullName)\CLAUDE.md") -and
             (Test-Path "$($_.FullName)\settings.json") -and
             (Test-Path "$($_.FullName)\.credentials.json")
    $hasPrompt = Test-Path "$($_.FullName)\default-prompt.txt"

    if ($ready) {
        Write-Host "  $($_.Name)  READY" -ForegroundColor Green
    } else {
        Write-Host "  $($_.Name)  INCOMPLETE" -ForegroundColor Red
        if (-not (Test-Path "$($_.FullName)\CLAUDE.md"))         { Write-Host "    Missing: CLAUDE.md" -ForegroundColor Red }
        if (-not (Test-Path "$($_.FullName)\settings.json"))     { Write-Host "    Missing: settings.json" -ForegroundColor Red }
        if (-not (Test-Path "$($_.FullName)\.credentials.json")) { Write-Host "    Missing: .credentials.json" -ForegroundColor Red }
    }
    if (-not $hasPrompt) {
        Write-Host "    Note: no default-prompt.txt - you must pass -Prompt when invoking" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Usage:" -ForegroundColor Cyan
Write-Host '  .\Invoke-ClaudeRole.ps1 -Role code-reviewer -TargetDir C:\projects\myapp'
