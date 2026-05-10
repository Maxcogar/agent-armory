# Setup-ClaudeRoles.ps1
# Builds isolated Claude Code role instances from the roles/ directory.
#
# How it works:
#   1. Reads role definitions from roles/ subdirectories (CLAUDE.md, settings.json, etc.)
#   2. Injects shared content (e.g., Expert Standard) into {{PLACEHOLDER}} markers
#   3. Installs each role to the target directory with credentials wired
#   4. Copies .mcp.json if present (per-role MCP server configuration)
#
# Run once to set up. Re-run to add new roles or refresh credentials.
#
# Usage:
#   .\Setup-ClaudeRoles.ps1
#   .\Setup-ClaudeRoles.ps1 -RolesRoot "D:\custom\claude-roles"

param(
    [string]$RolesRoot = "$env:USERPROFILE\claude-roles"
)

$scriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Definition
$rolesSource = Join-Path $scriptDir "roles"
$sharedDir   = Join-Path $rolesSource "_shared"
$credSource  = "$env:USERPROFILE\.claude\.credentials.json"

# ─────────────────────────────────────────────────────────────
# 1. Verify prerequisites
# ─────────────────────────────────────────────────────────────

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

if (-not (Test-Path $rolesSource)) {
    Write-Error "Roles source directory not found at: $rolesSource`nExpected a 'roles/' folder next to this script."
    exit 1
}

# ─────────────────────────────────────────────────────────────
# 2. Load shared content for injection
# ─────────────────────────────────────────────────────────────

$sharedContent = @{}
if (Test-Path $sharedDir) {
    Get-ChildItem -Path $sharedDir -Filter "*.md" | ForEach-Object {
        $key = $_.BaseName.ToUpper() -replace '-', '_'
        $sharedContent[$key] = Get-Content $_.FullName -Raw -Encoding UTF8
        Write-Host "  Loaded shared content: $($_.Name) -> {{$key}}" -ForegroundColor DarkGray
    }
}

function Inject-SharedContent {
    param([string]$Text)
    foreach ($key in $sharedContent.Keys) {
        $placeholder = "{{$key}}"
        if ($Text.Contains($placeholder)) {
            $Text = $Text.Replace($placeholder, $sharedContent[$key])
        }
    }
    return $Text
}

# ─────────────────────────────────────────────────────────────
# 3. Create roles root directory
# ─────────────────────────────────────────────────────────────

New-Item -ItemType Directory -Force -Path $RolesRoot | Out-Null
Write-Host "Roles install target: $RolesRoot" -ForegroundColor Green
Write-Host ""

# ─────────────────────────────────────────────────────────────
# 4. Discover and install roles
# ─────────────────────────────────────────────────────────────

$roleDirs = Get-ChildItem -Path $rolesSource -Directory | Where-Object { $_.Name -ne "_shared" }

if ($roleDirs.Count -eq 0) {
    Write-Host "No roles found in $rolesSource" -ForegroundColor Yellow
    Write-Host "Create a subdirectory with CLAUDE.md and settings.json to define a role."
    exit 0
}

Write-Host "Found $($roleDirs.Count) role(s) to install:" -ForegroundColor Cyan
Write-Host ""

foreach ($roleDir in $roleDirs) {
    $roleName   = $roleDir.Name
    $installDir = Join-Path $RolesRoot $roleName

    Write-Host "  Role: $roleName" -ForegroundColor Cyan

    # Create install directory
    New-Item -ItemType Directory -Force -Path $installDir | Out-Null

    # --- CLAUDE.md (required, with shared content injection) ---
    $claudeMdSource = Join-Path $roleDir.FullName "CLAUDE.md"
    if (Test-Path $claudeMdSource) {
        $content = Get-Content $claudeMdSource -Raw -Encoding UTF8
        $content = Inject-SharedContent $content
        Set-Content -Path (Join-Path $installDir "CLAUDE.md") -Value $content -Encoding UTF8
        Write-Host "    CLAUDE.md installed (shared content injected)" -ForegroundColor Green
    } else {
        Write-Host "    WARNING: No CLAUDE.md found in role source" -ForegroundColor Red
    }

    # --- settings.json (required) ---
    $settingsSource = Join-Path $roleDir.FullName "settings.json"
    if (Test-Path $settingsSource) {
        Copy-Item $settingsSource (Join-Path $installDir "settings.json") -Force
        Write-Host "    settings.json installed" -ForegroundColor Green
    } else {
        Write-Host "    WARNING: No settings.json found in role source" -ForegroundColor Red
    }

    # --- default-prompt.txt (optional) ---
    $promptSource = Join-Path $roleDir.FullName "default-prompt.txt"
    if (Test-Path $promptSource) {
        Copy-Item $promptSource (Join-Path $installDir "default-prompt.txt") -Force
        Write-Host "    default-prompt.txt installed" -ForegroundColor Green
    }

    # --- .mcp.json (optional — per-role MCP server configuration) ---
    $mcpSource = Join-Path $roleDir.FullName ".mcp.json"
    if (Test-Path $mcpSource) {
        Copy-Item $mcpSource (Join-Path $installDir ".mcp.json") -Force
        Write-Host "    .mcp.json installed (MCP servers wired)" -ForegroundColor Green
    }

    # --- Any additional files (hooks, skills, etc.) ---
    Get-ChildItem -Path $roleDir.FullName -File | Where-Object {
        $_.Name -notin @("CLAUDE.md", "settings.json", "default-prompt.txt", ".mcp.json")
    } | ForEach-Object {
        Copy-Item $_.FullName (Join-Path $installDir $_.Name) -Force
        Write-Host "    $($_.Name) installed" -ForegroundColor Green
    }

    # --- Subdirectories (skills/, hooks/, etc.) ---
    Get-ChildItem -Path $roleDir.FullName -Directory | ForEach-Object {
        $destSubDir = Join-Path $installDir $_.Name
        if (Test-Path $destSubDir) {
            Remove-Item $destSubDir -Recurse -Force
        }
        Copy-Item $_.FullName $destSubDir -Recurse -Force
        Write-Host "    $($_.Name)/ installed" -ForegroundColor Green
    }

    # --- Credentials ---
    $credDest = Join-Path $installDir ".credentials.json"
    if (-not (Test-Path $credDest)) {
        try {
            New-Item -ItemType SymbolicLink -Path $credDest -Target $credSource -ErrorAction Stop | Out-Null
            Write-Host "    Credentials symlinked" -ForegroundColor Green
        } catch {
            Copy-Item $credSource $credDest
            Write-Host "    Credentials COPIED (symlink requires admin)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "    Credentials already wired" -ForegroundColor DarkGray
    }

    Write-Host ""
}

# ─────────────────────────────────────────────────────────────
# 5. Wire credentials for any manually-created role folders
# ─────────────────────────────────────────────────────────────

$knownRoleNames = $roleDirs | ForEach-Object { $_.Name }
Get-ChildItem -Path $RolesRoot -Directory | Where-Object { $knownRoleNames -notcontains $_.Name } | ForEach-Object {
    $credDest = Join-Path $_.FullName ".credentials.json"
    if (-not (Test-Path $credDest)) {
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

# ─────────────────────────────────────────────────────────────
# 6. Summary
# ─────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "  Setup complete. Roles installed at $RolesRoot" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""

Get-ChildItem $RolesRoot -Directory | ForEach-Object {
    $hasClaude   = Test-Path (Join-Path $_.FullName "CLAUDE.md")
    $hasSettings = Test-Path (Join-Path $_.FullName "settings.json")
    $hasCreds    = Test-Path (Join-Path $_.FullName ".credentials.json")
    $hasMcp      = Test-Path (Join-Path $_.FullName ".mcp.json")
    $hasPrompt   = Test-Path (Join-Path $_.FullName "default-prompt.txt")

    $ready = $hasClaude -and $hasSettings -and $hasCreds

    if ($ready) {
        $extras = @()
        if ($hasMcp) { $extras += "MCP" }
        if ($hasPrompt) { $extras += "prompt" }
        $extrasStr = if ($extras.Count -gt 0) { " [" + ($extras -join ", ") + "]" } else { "" }
        Write-Host "  $($_.Name)  READY$extrasStr" -ForegroundColor Green
    } else {
        Write-Host "  $($_.Name)  INCOMPLETE" -ForegroundColor Red
        if (-not $hasClaude)   { Write-Host "    Missing: CLAUDE.md" -ForegroundColor Red }
        if (-not $hasSettings) { Write-Host "    Missing: settings.json" -ForegroundColor Red }
        if (-not $hasCreds)    { Write-Host "    Missing: .credentials.json" -ForegroundColor Red }
    }
}

Write-Host ""
Write-Host "Usage:" -ForegroundColor Cyan
Write-Host '  .\Invoke-ClaudeRole.ps1 -Role code-reviewer -TargetDir C:\projects\myapp'
Write-Host '  .\Invoke-ClaudeRole.ps1 -Role codebase-auditor -TargetDir C:\projects\myapp'
