# Invoke-ClaudeRole.ps1
# Launches a bare Claude Code instance using CLAUDE_CONFIG_DIR isolation.
# Each role has its own CLAUDE.md, settings.json, and credentials.
# Zero contamination from your main ~/.claude setup.
#
# Usage:
#   .\Invoke-ClaudeRole.ps1 -Role code-reviewer -TargetDir C:\projects\myapp
#   .\Invoke-ClaudeRole.ps1 -Role code-reviewer -TargetDir C:\projects\myapp -Prompt "Focus on security issues only"
#   .\Invoke-ClaudeRole.ps1 -Role code-reviewer -TargetDir C:\projects\myapp -Async
#   $job = .\Invoke-ClaudeRole.ps1 -Role code-reviewer -TargetDir . -Async
#   $job | Wait-Job | Receive-Job

param(
    [Parameter(Mandatory)]
    [string]$Role,

    [Parameter(Mandatory)]
    [string]$TargetDir,

    [string]$Prompt,

    [string]$RolesRoot = "C:\claude-roles",

    [int]$MaxTurns = 50,

    # Output format: text, json, stream-json
    [ValidateSet("text", "json", "stream-json")]
    [string]$OutputFormat = "text",

    # Run as background job (non-blocking). Returns the job object.
    [switch]$Async,

    # Allowed tools override (comma-separated). Defaults to what's in settings.json.
    [string]$AllowedTools
)

# --- Resolve paths ---
$roleDir   = "$RolesRoot\$Role"
$claudeMd  = "$roleDir\CLAUDE.md"
$credsFile = "$roleDir\.credentials.json"
$promptFile = "$roleDir\default-prompt.txt"
$targetDir = Resolve-Path $TargetDir -ErrorAction Stop

# --- Validate role exists and is ready ---
if (-not (Test-Path $roleDir)) {
    Write-Error "Role '$Role' not found at $roleDir`nRun Setup-ClaudeRoles.ps1 first."
    exit 1
}
if (-not (Test-Path $claudeMd)) {
    Write-Error "Role '$Role' is missing CLAUDE.md at $claudeMd"
    exit 1
}
if (-not (Test-Path $credsFile)) {
    Write-Error "Role '$Role' is missing .credentials.json`nRun Setup-ClaudeRoles.ps1 to wire up credentials."
    exit 1
}

# --- Resolve prompt ---
if (-not $Prompt) {
    if (Test-Path $promptFile) {
        $Prompt = Get-Content $promptFile -Raw
    } else {
        Write-Error "No -Prompt provided and no default-prompt.txt found at $promptFile"
        exit 1
    }
}

# --- Build the claude command args ---
$claudeArgs = @(
    "-p", $Prompt,
    "--max-turns", $MaxTurns,
    "--output-format", $OutputFormat,
    "--dangerously-skip-permissions"   # required for headless; locked down via settings.json
)

if ($AllowedTools) {
    $claudeArgs += "--allowedTools", $AllowedTools
}

# --- Run ---
$scriptBlock = {
    param($roleDir, $targetDir, $claudeArgs)

    $env:CLAUDE_CONFIG_DIR = $roleDir

    # Also point HOME to the role dir so Claude reads CLAUDE.md from there
    # (Claude Code reads CLAUDE.md from the project dir AND ~/.claude/CLAUDE.md;
    #  CLAUDE_CONFIG_DIR replaces the ~/.claude part)

    Set-Location $targetDir

    & claude @claudeArgs
}

if ($Async) {
    $job = Start-Job -ScriptBlock $scriptBlock -ArgumentList $roleDir, $targetDir, $claudeArgs
    Write-Host "Role '$Role' running as background job ID: $($job.Id)" -ForegroundColor Cyan
    Write-Host "  Target: $targetDir"
    Write-Host "  Check status:  Get-Job $($job.Id)"
    Write-Host "  Collect output: Receive-Job $($job.Id) -Wait"
    return $job
} else {
    & $scriptBlock -roleDir $roleDir -targetDir $targetDir -claudeArgs $claudeArgs
}
