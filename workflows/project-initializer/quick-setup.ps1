# Quick Project Setup for Claude Code CLI
# Run this in any project directory to set up templates

param(
    [switch]$Help,
    [switch]$List
)

$ClaudeToolsPath = "C:\Users\maxco\OneDrive\Documents\GitHub\Coding Tools\Claude\project-initializer"
$InitScript = Join-Path $ClaudeToolsPath "scripts\Initialize-Project.ps1"

if ($Help) {
    Write-Host @"
🤖 Claude Code CLI Project Setup

Usage:
  quick-setup            # Interactive template selection
  quick-setup -List      # Show available templates
  quick-setup -Help      # Show this help

Available commands after setup:
  - In PowerShell: init-project
  - From anywhere: quick-setup

Templates are stored in: $ClaudeToolsPath\templates\
"@ -ForegroundColor Cyan
    exit 0
}

if ($List) {
    & $InitScript -List
    exit 0
}

if (-not (Test-Path $InitScript)) {
    Write-Host "❌ Initializer script not found: $InitScript" -ForegroundColor Red
    Write-Host "Please ensure the Claude tools are properly installed." -ForegroundColor Yellow
    exit 1
}

Write-Host "🚀 Quick Project Setup" -ForegroundColor Cyan
& $InitScript
