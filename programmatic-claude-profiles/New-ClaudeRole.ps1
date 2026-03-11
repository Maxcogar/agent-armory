# New-ClaudeRole.ps1
# Interactive wizard to create a new bare Claude Code role.
# Run this whenever you want to add a new role to the system.
#
# Usage: .\New-ClaudeRole.ps1

param(
    [string]$RolesRoot = "$env:USERPROFILE\claude-roles"
)

$credSource = "$env:USERPROFILE\.claude\.credentials.json"

# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────

function Prompt-Required {
    param([string]$Label)
    do {
        $val = Read-Host $Label
    } while ([string]::IsNullOrWhiteSpace($val))
    return $val.Trim()
}

function Prompt-Optional {
    param([string]$Label, [string]$Default = "")
    $val = Read-Host "$Label (leave blank for default)"
    if ([string]::IsNullOrWhiteSpace($val)) { return $Default }
    return $val.Trim()
}

function Prompt-MultiLine {
    param([string]$Label)
    Write-Host ""
    Write-Host $Label -ForegroundColor Cyan
    Write-Host "  Enter each item on its own line. Type END on a blank line when done." -ForegroundColor DarkGray
    $lines = @()
    while ($true) {
        $line = Read-Host "  >"
        if ($line.Trim() -eq "END") { break }
        if (-not [string]::IsNullOrWhiteSpace($line)) {
            $lines += $line.Trim()
        }
    }
    return $lines
}

function Prompt-YesNo {
    param([string]$Label)
    do {
        $val = Read-Host "$Label [y/n]"
    } while ($val -notin @("y","Y","n","N"))
    return $val -in @("y","Y")
}

# ─────────────────────────────────────────────────────────────
# Header
# ─────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  New Claude Code Role Wizard" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# ─────────────────────────────────────────────────────────────
# 1. Role name
# ─────────────────────────────────────────────────────────────

Write-Host "STEP 1: Role name" -ForegroundColor Yellow
Write-Host "  This becomes the folder name and the -Role argument when invoking." -ForegroundColor DarkGray
Write-Host "  Use lowercase letters, numbers, and hyphens only. E.g: security-auditor" -ForegroundColor DarkGray
Write-Host ""

$roleName = Prompt-Required "Role name"
$roleName = $roleName -replace '[^a-z0-9\-]', '-'   # sanitize
$roleDir  = "$RolesRoot\$roleName"

if (Test-Path $roleDir) {
    Write-Host ""
    Write-Host "  Role '$roleName' already exists at $roleDir" -ForegroundColor Red
    $overwrite = Prompt-YesNo "  Overwrite it?"
    if (-not $overwrite) { Write-Host "Cancelled."; exit 0 }
}

# ─────────────────────────────────────────────────────────────
# 2. What this role IS
# ─────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "STEP 2: What is this role?" -ForegroundColor Yellow
Write-Host "  One sentence describing what this agent IS." -ForegroundColor DarkGray
Write-Host "  E.g: You are a security auditor focused on finding vulnerabilities." -ForegroundColor DarkGray
Write-Host ""

$roleIdentity = Prompt-Required "Role identity"

# ─────────────────────────────────────────────────────────────
# 3. What it does
# ─────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "STEP 3: What does it do?" -ForegroundColor Yellow
Write-Host "  Describe the task this role performs each time it runs." -ForegroundColor DarkGray
Write-Host "  E.g: Read all code in the working directory and produce a security report." -ForegroundColor DarkGray
Write-Host ""

$roleTask = Prompt-Required "Task description"

# ─────────────────────────────────────────────────────────────
# 4. Output file
# ─────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "STEP 4: Output file" -ForegroundColor Yellow
Write-Host "  What file should this role write its results to?" -ForegroundColor DarkGray
Write-Host ""

$outputFile = Prompt-Optional "Output filename" "claude-$roleName-report.md"

# ─────────────────────────────────────────────────────────────
# 5. Hard rules
# ─────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "STEP 5: Hard rules" -ForegroundColor Yellow
Write-Host "  What must this role NEVER do? These become absolute constraints." -ForegroundColor DarkGray
Write-Host "  The rule 'When done, stop.' is always added automatically." -ForegroundColor DarkGray

$hardRules = Prompt-MultiLine "Hard rules (e.g: DO NOT modify source files)"

# ─────────────────────────────────────────────────────────────
# 6. Permissions - what it CAN do
# ─────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "STEP 6: Allowed tools" -ForegroundColor Yellow
Write-Host "  What tools can this role use?" -ForegroundColor DarkGray
Write-Host "  Common options:" -ForegroundColor DarkGray
Write-Host "    Read(**)              - read any file" -ForegroundColor DarkGray
Write-Host "    Glob(**)              - search for files" -ForegroundColor DarkGray
Write-Host "    Edit(**)              - edit any file" -ForegroundColor DarkGray
Write-Host "    Write(**)             - write new files" -ForegroundColor DarkGray
Write-Host "    Bash(git diff:*)      - run git diff" -ForegroundColor DarkGray
Write-Host "    Bash(npm run *:*)     - run npm scripts" -ForegroundColor DarkGray
Write-Host "    WebSearch(*)          - search the web" -ForegroundColor DarkGray
Write-Host "    Write($outputFile)    - write only the output file" -ForegroundColor DarkGray

$allowedTools = Prompt-MultiLine "Allowed tools"

# Always include the output file write permission if not already there
$outputWriteRule = "Write($outputFile)"
if ($allowedTools -notcontains $outputWriteRule) {
    $allowedTools += $outputWriteRule
}

# ─────────────────────────────────────────────────────────────
# 7. Permissions - what it CANNOT do
# ─────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "STEP 7: Denied tools" -ForegroundColor Yellow
Write-Host "  What tools should this role be blocked from using?" -ForegroundColor DarkGray
Write-Host "  Leave blank and type END to skip (no denies beyond allowed list)." -ForegroundColor DarkGray

$deniedTools = Prompt-MultiLine "Denied tools"

# ─────────────────────────────────────────────────────────────
# 8. Default prompt
# ─────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "STEP 8: Default prompt" -ForegroundColor Yellow
Write-Host "  What should this role do when invoked with no custom -Prompt?" -ForegroundColor DarkGray
Write-Host "  E.g: Review all code in this directory and write a report to $outputFile" -ForegroundColor DarkGray
Write-Host ""

$defaultPrompt = Prompt-Required "Default prompt"

# ─────────────────────────────────────────────────────────────
# 9. Max turns
# ─────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "STEP 9: Max turns (optional)" -ForegroundColor Yellow
Write-Host "  How many turns should this role be allowed before stopping?" -ForegroundColor DarkGray
Write-Host "  Default is 50. Use a lower number for simple focused tasks." -ForegroundColor DarkGray
Write-Host ""

$maxTurnsInput = Prompt-Optional "Max turns" "50"
$maxTurns = [int]$maxTurnsInput

# ─────────────────────────────────────────────────────────────
# 10. Preview and confirm
# ─────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  Preview" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "Role name:      $roleName"
Write-Host "Install at:     $roleDir"
Write-Host "Identity:       $roleIdentity"
Write-Host "Task:           $roleTask"
Write-Host "Output file:    $outputFile"
Write-Host "Max turns:      $maxTurns"
Write-Host "Hard rules:     $($hardRules.Count) rule(s)"
Write-Host "Allowed tools:  $($allowedTools.Count) tool(s)"
Write-Host "Denied tools:   $($deniedTools.Count) tool(s)"
Write-Host "Default prompt: $defaultPrompt"
Write-Host ""

$confirm = Prompt-YesNo "Create this role?"
if (-not $confirm) { Write-Host "Cancelled."; exit 0 }

# ─────────────────────────────────────────────────────────────
# 11. Build the files
# ─────────────────────────────────────────────────────────────

New-Item -ItemType Directory -Force -Path $roleDir | Out-Null

# --- CLAUDE.md ---
$hardRulesText = ($hardRules | ForEach-Object { "- $_" }) -join "`n"
$claudeMdContent = @"
# Role: $roleName

$roleIdentity

## What You Do
$roleTask

Write your output to ``$outputFile`` in the working directory.

## Hard Rules
$hardRulesText
- Do not ask clarifying questions. Make your best judgment and note assumptions in the output.
- Do not summarize what you are about to do. Just do it.
- When done, stop.
"@

Set-Content -Path "$roleDir\CLAUDE.md" -Value $claudeMdContent -Encoding UTF8
Write-Host "  Created CLAUDE.md" -ForegroundColor Green

# --- settings.json ---
$allowJson = ($allowedTools | ForEach-Object { "      `"$_`"" }) -join ",`n"
$denyBlock = ""
if ($deniedTools.Count -gt 0) {
    $denyJson = ($deniedTools | ForEach-Object { "      `"$_`"" }) -join ",`n"
    $denyBlock = @"
,
    "deny": [
$denyJson
    ]
"@
}

$settingsContent = @"
{
  "permissions": {
    "allow": [
$allowJson
    ]$denyBlock
  }
}
"@

Set-Content -Path "$roleDir\settings.json" -Value $settingsContent -Encoding UTF8
Write-Host "  Created settings.json" -ForegroundColor Green

# --- default-prompt.txt ---
Set-Content -Path "$roleDir\default-prompt.txt" -Value $defaultPrompt -Encoding UTF8
Write-Host "  Created default-prompt.txt" -ForegroundColor Green

# --- .credentials.json ---
$credDest = "$roleDir\.credentials.json"
if (-not (Test-Path $credSource)) {
    Write-Host "  WARNING: No credentials found at $credSource" -ForegroundColor Red
    Write-Host "  Log into Claude Code first, then re-run Setup-ClaudeRoles.ps1" -ForegroundColor Red
} elseif (-not (Test-Path $credDest)) {
    try {
        New-Item -ItemType SymbolicLink -Path $credDest -Target $credSource -ErrorAction Stop | Out-Null
        Write-Host "  Credentials symlinked" -ForegroundColor Green
    } catch {
        Copy-Item $credSource $credDest
        Write-Host "  Credentials COPIED (symlink requires admin - re-run Setup-ClaudeRoles.ps1 if you re-authenticate)" -ForegroundColor Yellow
    }
}

# ─────────────────────────────────────────────────────────────
# 12. Done
# ─────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "  Role '$roleName' created and ready." -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "Invoke it:" -ForegroundColor Cyan
Write-Host "  .\Invoke-ClaudeRole.ps1 -Role $roleName -TargetDir C:\path\to\your\project"
Write-Host ""
Write-Host "Files created at $roleDir :"
Get-ChildItem $roleDir -Force | ForEach-Object { Write-Host "  $($_.Name)" }
