# New-ClaudeRole.ps1
# Interactive wizard to create a new role definition in the roles/ directory.
# After creating, run Setup-ClaudeRoles.ps1 to install it.
#
# Usage: .\New-ClaudeRole.ps1

$scriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Definition
$rolesSource = Join-Path $scriptDir "roles"
$sharedDir   = Join-Path $rolesSource "_shared"

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
Write-Host "  Lowercase letters, numbers, and hyphens. E.g: security-auditor" -ForegroundColor DarkGray
Write-Host ""

$roleName = Prompt-Required "Role name"
$roleName = $roleName -replace '[^a-z0-9\-]', '-'
$roleDir  = Join-Path $rolesSource $roleName

if (Test-Path $roleDir) {
    Write-Host ""
    Write-Host "  Role '$roleName' already exists at $roleDir" -ForegroundColor Red
    $overwrite = Prompt-YesNo "  Overwrite it?"
    if (-not $overwrite) { Write-Host "Cancelled."; exit 0 }
}

# ─────────────────────────────────────────────────────────────
# 2. Role identity
# ─────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "STEP 2: What is this role?" -ForegroundColor Yellow
Write-Host "  E.g: You are a security auditor focused on finding vulnerabilities." -ForegroundColor DarkGray
Write-Host ""

$roleIdentity = Prompt-Required "Role identity"

# ─────────────────────────────────────────────────────────────
# 3. Task description
# ─────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "STEP 3: What does it do?" -ForegroundColor Yellow
Write-Host "  E.g: Read all code in the working directory and produce a security report." -ForegroundColor DarkGray
Write-Host ""

$roleTask = Prompt-Required "Task description"

# ─────────────────────────────────────────────────────────────
# 4. Output file
# ─────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "STEP 4: Output file" -ForegroundColor Yellow
$outputFile = Prompt-Optional "Output filename" "claude-$roleName-report.md"

# ─────────────────────────────────────────────────────────────
# 5. Expert Standard
# ─────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "STEP 5: Expert Standard" -ForegroundColor Yellow
Write-Host "  Should this role evaluate against engineering standards (SOLID, DRY, OWASP, etc.)?" -ForegroundColor DarkGray
Write-Host "  If yes, the Expert Standard will be injected into the CLAUDE.md." -ForegroundColor DarkGray
Write-Host ""

$useExpertStandard = Prompt-YesNo "Include Expert Standard?"

# ─────────────────────────────────────────────────────────────
# 6. Hard rules
# ─────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "STEP 6: Hard rules" -ForegroundColor Yellow
Write-Host "  What must this role NEVER do? 'When done, stop.' is added automatically." -ForegroundColor DarkGray

$hardRules = Prompt-MultiLine "Hard rules (e.g: DO NOT modify source files)"

# ─────────────────────────────────────────────────────────────
# 7. Allowed tools
# ─────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "STEP 7: Allowed tools" -ForegroundColor Yellow
Write-Host "  Common options:" -ForegroundColor DarkGray
Write-Host "    Read(**)               - read any file" -ForegroundColor DarkGray
Write-Host "    Glob(**)               - search for files" -ForegroundColor DarkGray
Write-Host "    Edit(**)               - edit any file" -ForegroundColor DarkGray
Write-Host "    Write(**)              - write new files" -ForegroundColor DarkGray
Write-Host "    Bash(git diff *)       - run git diff" -ForegroundColor DarkGray
Write-Host "    Bash(npm run *)        - run npm scripts" -ForegroundColor DarkGray
Write-Host "    mcp__codegraph         - codegraph MCP tools" -ForegroundColor DarkGray
Write-Host "    mcp__codebase-rag      - codebase RAG MCP tools" -ForegroundColor DarkGray
Write-Host "    Write($outputFile)     - write only the output file" -ForegroundColor DarkGray

$allowedTools = Prompt-MultiLine "Allowed tools"

$outputWriteRule = "Write($outputFile)"
if ($allowedTools -notcontains $outputWriteRule) {
    $allowedTools += $outputWriteRule
}

# ─────────────────────────────────────────────────────────────
# 8. Denied tools
# ─────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "STEP 8: Denied tools" -ForegroundColor Yellow
Write-Host "  Leave blank and type END to skip." -ForegroundColor DarkGray

$deniedTools = Prompt-MultiLine "Denied tools"

# ─────────────────────────────────────────────────────────────
# 9. MCP servers
# ─────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "STEP 9: MCP servers" -ForegroundColor Yellow
Write-Host "  Does this role need MCP servers (codegraph, codebase-rag, etc.)?" -ForegroundColor DarkGray
Write-Host ""

$useMcp = Prompt-YesNo "Add MCP servers?"
$mcpServers = @{}

if ($useMcp) {
    Write-Host ""
    Write-Host "  Available MCP servers:" -ForegroundColor DarkGray
    Write-Host "    codegraph     - Deterministic dependency graph (Node.js)" -ForegroundColor DarkGray
    Write-Host "    codebase-rag  - Constraint enforcement via RAG (Python)" -ForegroundColor DarkGray
    Write-Host "    custom        - Enter a custom MCP server" -ForegroundColor DarkGray
    Write-Host ""

    $addCodegraph = Prompt-YesNo "  Add codegraph MCP?"
    if ($addCodegraph) {
        $codegraphPath = Prompt-Optional "  Codegraph index.js path" "C:\Users\maxco\Documents\agent-armory\mcp-servers\codegraph-mcp\dist\index.js"
        $mcpServers["codegraph"] = @{
            command = "cmd"
            args = @("/c", "node", $codegraphPath)
        }
    }

    $addRag = Prompt-YesNo "  Add codebase-rag MCP?"
    if ($addRag) {
        $ragPath = Prompt-Optional "  RAG server.py path" "C:\Users\maxco\Documents\agent-armory\mcp-servers\codebase-rag\mcp-server-python\server.py"
        $mcpServers["codebase-rag"] = @{
            command = "cmd"
            args = @("/c", "python", $ragPath)
        }
    }

    $addCustom = Prompt-YesNo "  Add a custom MCP server?"
    while ($addCustom) {
        $customName = Prompt-Required "  Server name (e.g. my-server)"
        $customCmd  = Prompt-Required "  Command (e.g. node, python)"
        $customArgs = Prompt-Required "  Full path to entry file"
        $mcpServers[$customName] = @{
            command = "cmd"
            args = @("/c", $customCmd, $customArgs)
        }
        $addCustom = Prompt-YesNo "  Add another custom MCP server?"
    }
}

# ─────────────────────────────────────────────────────────────
# 10. Default prompt
# ─────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "STEP 10: Default prompt" -ForegroundColor Yellow
$defaultPrompt = Prompt-Required "Default prompt"

# ─────────────────────────────────────────────────────────────
# 11. Preview and confirm
# ─────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  Preview" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "Role name:        $roleName"
Write-Host "Creates at:       $roleDir"
Write-Host "Identity:         $roleIdentity"
Write-Host "Output file:      $outputFile"
Write-Host "Expert Standard:  $(if ($useExpertStandard) { 'Yes' } else { 'No' })"
Write-Host "Hard rules:       $($hardRules.Count) rule(s)"
Write-Host "Allowed tools:    $($allowedTools.Count) tool(s)"
Write-Host "Denied tools:     $($deniedTools.Count) tool(s)"
Write-Host "MCP servers:      $($mcpServers.Count) server(s)"
Write-Host ""

$confirm = Prompt-YesNo "Create this role?"
if (-not $confirm) { Write-Host "Cancelled."; exit 0 }

# ─────────────────────────────────────────────────────────────
# 12. Build the files
# ─────────────────────────────────────────────────────────────

New-Item -ItemType Directory -Force -Path $roleDir | Out-Null

# --- CLAUDE.md ---
$hardRulesText = ($hardRules | ForEach-Object { "- $_" }) -join "`n"
$expertBlock = if ($useExpertStandard) { "`n`n{{EXPERT_STANDARD}}`n" } else { "" }

$claudeMdContent = @"
# Role: $roleName

$roleIdentity

## What You Do

$roleTask

Write your output to ``$outputFile`` in the working directory.
$expertBlock
## Hard Rules

$hardRulesText
- Do not ask clarifying questions. Make your best judgment and note assumptions.
- Do not summarize what you are about to do. Just do it.
- When done, stop.
"@

Set-Content -Path (Join-Path $roleDir "CLAUDE.md") -Value $claudeMdContent -Encoding UTF8
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

Set-Content -Path (Join-Path $roleDir "settings.json") -Value $settingsContent -Encoding UTF8
Write-Host "  Created settings.json" -ForegroundColor Green

# --- default-prompt.txt ---
Set-Content -Path (Join-Path $roleDir "default-prompt.txt") -Value $defaultPrompt -Encoding UTF8
Write-Host "  Created default-prompt.txt" -ForegroundColor Green

# --- .mcp.json (if MCP servers were configured) ---
if ($mcpServers.Count -gt 0) {
    $mcpConfig = @{ mcpServers = $mcpServers }
    $mcpJson = $mcpConfig | ConvertTo-Json -Depth 4
    Set-Content -Path (Join-Path $roleDir ".mcp.json") -Value $mcpJson -Encoding UTF8
    Write-Host "  Created .mcp.json ($($mcpServers.Count) server(s))" -ForegroundColor Green
}

# ─────────────────────────────────────────────────────────────
# 13. Done
# ─────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "  Role '$roleName' created in roles/ directory." -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Review the files in $roleDir"
Write-Host "  2. Run .\Setup-ClaudeRoles.ps1 to install"
Write-Host "  3. Run .\Invoke-ClaudeRole.ps1 -Role $roleName -TargetDir C:\path\to\project"
Write-Host ""
