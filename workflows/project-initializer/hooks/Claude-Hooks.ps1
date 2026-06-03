# Claude Code CLI Startup Hook
# Add this to your PowerShell profile to automatically offer project initialization

# Function to check if we should offer project initialization
function Test-ShouldOfferInit {
    # Check if we're in a project directory (has package.json, .git, or looks like a project)
    $indicators = @("package.json", ".git", "requirements.txt", "Cargo.toml", "go.mod", "composer.json")
    $hasIndicator = $indicators | Where-Object { Test-Path $_ } | Select-Object -First 1
    
    if ($hasIndicator) {
        return $true
    }
    
    # Check if directory has few files (might be new project)
    $fileCount = (Get-ChildItem -Force | Measure-Object).Count
    return $fileCount -le 5
}

# Function to offer project initialization
function Invoke-ClaudeProjectInit {
    $initScriptPath = "C:\Users\maxco\OneDrive\Documents\GitHub\Coding Tools\Claude\project-initializer\scripts\Initialize-Project.ps1"
    
    if (Test-Path $initScriptPath) {
        if (Test-ShouldOfferInit) {
            Write-Host "🤖 " -NoNewline -ForegroundColor Cyan
            Write-Host "Claude Code CLI detected. Would you like to set up project templates? " -NoNewline
            Write-Host "[Y/n]: " -NoNewline -ForegroundColor Yellow
            
            $response = Read-Host
            if ($response -match '^(y|yes|)$' -or [string]::IsNullOrEmpty($response)) {
                & $initScriptPath
            } else {
                Write-Host "👍 Skipping project initialization." -ForegroundColor Green
            }
        }
    }
}

# Create alias for manual use
Set-Alias -Name "init-project" -Value $initScriptPath -Force

# Hook function to call when claude code CLI starts
function Start-ClaudeCodeWithInit {
    # Check if claude code is being started
    if ($args -contains "claude" -or $PWD.Path -match "project|workspace|code") {
        Invoke-ClaudeProjectInit
    }
}

Write-Host "✅ Claude Code CLI hooks loaded. Use 'init-project' to manually initialize projects." -ForegroundColor Green
