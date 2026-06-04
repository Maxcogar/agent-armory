# Simplified Project Initializer Setup

param(
    [switch]$All,
    [switch]$Help
)

$ProjectInitPath = "C:\Users\maxco\OneDrive\Documents\GitHub\Coding Tools\Claude\project-initializer"

function Show-Help {
    Write-Host "Project Initializer Setup" -ForegroundColor Cyan
    Write-Host "========================="
    Write-Host "Usage: .\setup-new.ps1 -All"
    Write-Host "       .\setup-new.ps1 -Help"
}

function Install-Core {
    Write-Host "[1/3] Checking installation..." -ForegroundColor Cyan
    
    if (Test-Path $ProjectInitPath) {
        Write-Host "✅ Core system found at $ProjectInitPath" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ Core system not found at $ProjectInitPath" -ForegroundColor Red
        return $false
    }
}

function Add-ToPath {
    Write-Host "[2/3] Checking PATH..." -ForegroundColor Cyan
    
    $currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
    if ($currentPath -like "*$ProjectInitPath*") {
        Write-Host "✅ Already in PATH" -ForegroundColor Green
        return $true
    }
    
    try {
        $newPath = "$currentPath;$ProjectInitPath"
        [Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
        Write-Host "✅ Added to PATH. Please restart your terminal." -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Failed to add to PATH: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main execution
if ($Help) {
    Show-Help
    exit 0
}

if ($All) {
    $success = $true
    $success = Install-Core -and $success
    $success = Add-ToPath -and $success
    
    if ($success) {
        Write-Host "`n✅ Setup completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "`n❌ Setup completed with errors." -ForegroundColor Red
    }
    exit 0
}

# Default: show help
Show-Help
