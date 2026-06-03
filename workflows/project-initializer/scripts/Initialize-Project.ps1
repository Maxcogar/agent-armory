# Enhanced Project Initialization Script for rule2hook Integration

param(
    [string]$ProjectPath = (Get-Location).Path,
    [switch]$Force,
    [switch]$List,
    [switch]$Silent,
    [switch]$QuickCheck  # New parameter for hook-based quick checks
)

$TemplatesPath = "C:\Users\maxco\OneDrive\Documents\GitHub\Coding Tools\Claude\project-initializer\templates"
$ConfigFile = "$env:USERPROFILE\.claude-project-init-config.json"
$LogFile = "$env:USERPROFILE\.claude\project-init.log"

# Colors for output
$Colors = @{
    Success = "Green"
    Warning = "Yellow" 
    Error = "Red"
    Info = "Cyan"
    Prompt = "Magenta"
}

function Write-ColorText {
    param([string]$Text, [string]$Color = "White")
    if (-not $Silent) {
        Write-Host $Text -ForegroundColor $Colors[$Color]
    }
}

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $Message" | Out-File -FilePath $LogFile -Append -Encoding UTF8
}

function Get-AvailableTemplates {
    if (-not (Test-Path $TemplatesPath)) {
        Write-ColorText "⚠️  Templates directory not found: $TemplatesPath" "Warning"
        return @()
    }
    
    $templates = @()
    Get-ChildItem $TemplatesPath -Directory | ForEach-Object {
        $configPath = Join-Path $_.FullName "template.json"
        if (Test-Path $configPath) {
            try {
                $config = Get-Content $configPath | ConvertFrom-Json
                $templates += @{
                    Path = $_.FullName
                    Name = $config.name
                    Description = $config.description
                    Config = $config
                }
            }
            catch {
                Write-Log "Error reading template config: $configPath - $($_.Exception.Message)"
            }
        }
    }
    return $templates
}

function Test-IsProjectDirectory {
    param([string]$Path)
    
    # Check for common project indicators
    $indicators = @(
        "package.json", "package-lock.json", "yarn.lock",
        ".git", ".gitignore",
        "requirements.txt", "setup.py", "pyproject.toml",
        "Cargo.toml", "go.mod", "composer.json",
        "pom.xml", "build.gradle", "CMakeLists.txt",
        ".env", ".env.example",
        "README.md", "README.txt"
    )
    
    $hasIndicator = $indicators | Where-Object { Test-Path (Join-Path $Path $_) } | Select-Object -First 1
    return $null -ne $hasIndicator
}

function Test-IsEmptyProject {
    param([string]$Path)
    
    $items = Get-ChildItem $Path -Force | Where-Object { 
        $_.Name -notmatch "^\.git$|^\.vscode$|^node_modules$|^\.env$|^__pycache__$" 
    }
    return $items.Count -le 3  # Allow for README, .gitignore, package.json
}

function Test-HasClaudeCodeMarkers {
    param([string]$Path)
    
    # Check for existing Claude Code setup
    $markers = @(".claude", ".cursor", ".bmad-core", ".windsurf")
    $hasMarker = $markers | Where-Object { Test-Path (Join-Path $Path $_) } | Select-Object -First 1
    return $null -ne $hasMarker
}

function Test-ShouldOfferInit {
    param([string]$Path)
    
    # Don't offer if already has Claude Code setup
    if (Test-HasClaudeCodeMarkers $Path) {
        return $false
    }
    
    # Offer if it's a project directory that's empty or small
    $isProject = Test-IsProjectDirectory $Path
    $isEmpty = Test-IsEmptyProject $Path
    
    return $isProject -and $isEmpty
}

function Copy-Template {
    param(
        [string]$TemplatePath,
        [string]$ProjectPath,
        [object]$Config
    )
    
    Write-ColorText "🚀 Setting up $($Config.name)..." "Info"
    Write-Log "Setting up template: $($Config.name) in $ProjectPath"
    
    try {
        # Copy all template files except template.json
        Get-ChildItem $TemplatePath | Where-Object { $_.Name -ne "template.json" } | ForEach-Object {
            $destination = Join-Path $ProjectPath $_.Name
            if ($_.PSIsContainer) {
                Copy-Item $_.FullName $destination -Recurse -Force
            } else {
                Copy-Item $_.FullName $destination -Force
            }
            Write-ColorText "  ✅ $($_.Name)" "Success"
        }
        
        Write-ColorText "✨ Template setup complete!" "Success"
        
        if ($Config.usage) {
            Write-ColorText "`n💡 Quick Start:" "Info"
            Write-ColorText "   $($Config.usage)" "White"
        }
        
        Write-Log "Template setup completed successfully: $($Config.name)"
        return $true
    }
    catch {
        Write-ColorText "❌ Error setting up template: $($_.Exception.Message)" "Error"
        Write-Log "Template setup failed: $($_.Exception.Message)"
        return $false
    }
}

function Show-TemplateMenu {
    param([array]$Templates)
    
    Write-ColorText "`n🎯 Available Project Templates:" "Prompt"
    Write-ColorText "=" * 50 "Info"
    
    for ($i = 0; $i -lt $Templates.Count; $i++) {
        $template = $Templates[$i]
        Write-ColorText "[$($i + 1)] $($template.Name)" "Info"
        Write-ColorText "    $($template.Description)" "White"
        if ($template.Config.requires) {
            Write-ColorText "    Requires: $($template.Config.requires -join ', ')" "Warning"
        }
        Write-Host
    }
    
    Write-ColorText "[0] Skip - No template needed" "Warning"
    Write-ColorText "=" * 50 "Info"
}

function Get-UserChoice {
    param([int]$MaxChoice)
    
    do {
        $choice = Read-Host "Select template [0-$MaxChoice]"
        if ($choice -match '^\d+$' -and [int]$choice -ge 0 -and [int]$choice -le $MaxChoice) {
            return [int]$choice
        }
        Write-ColorText "⚠️  Please enter a number between 0 and $MaxChoice" "Warning"
    } while ($true)
}

# Main execution
function Start-ProjectInitializer {
    Write-Log "Project initializer started with params: ProjectPath=$ProjectPath, Force=$Force, List=$List, Silent=$Silent, QuickCheck=$QuickCheck"
    
    if ($List) {
        $templates = Get-AvailableTemplates
        Show-TemplateMenu $templates
        return
    }
    
    # Check if we're in a project directory
    if (-not (Test-Path $ProjectPath)) {
        Write-ColorText "❌ Project path does not exist: $ProjectPath" "Error"
        return
    }
    
    # Quick check mode (for hooks) - just check if we should offer, don't actually do anything
    if ($QuickCheck) {
        if (Test-ShouldOfferInit $ProjectPath) {
            Write-ColorText "💡 This project could benefit from template setup. Run 'quick-setup' to configure." "Info"
            return $true
        }
        return $false
    }
    
    # FORCE MODE: Always show templates (for Claude Code hooks)
    if ($Force) {
        $templates = Get-AvailableTemplates
        if ($templates.Count -eq 0) {
            Write-ColorText "❌ No templates found in $TemplatesPath" "Error"
            return
        }
        
        Write-ColorText "🤖 Claude Code CLI Project Templates" "Prompt"
        Write-ColorText "Current directory: $ProjectPath" "Info"
        
        Show-TemplateMenu $templates
        $choice = Get-UserChoice $templates.Count
        
        if ($choice -eq 0) {
            Write-ColorText "👍 Skipping template setup." "Info"
            Write-Log "User skipped template setup (Force mode)"
            return
        }
        
        $selectedTemplate = $templates[$choice - 1]
        $success = Copy-Template $selectedTemplate.Path $ProjectPath $selectedTemplate.Config
        
        if ($success) {
            Write-ColorText "`n🎉 Project initialized successfully!" "Success"
            Write-ColorText "You can now use Claude Code CLI with the configured templates." "Info"
        }
        return
    }
    
    # SMART MODE: Only offer if appropriate (for manual use)
    if (-not (Test-ShouldOfferInit $ProjectPath)) {
        if ((Test-HasClaudeCodeMarkers $ProjectPath)) {
            if (-not $Silent) {
                Write-ColorText "✅ Claude Code setup already detected in this project." "Success"
            }
        } elseif (-not (Test-IsEmptyProject $ProjectPath)) {
            if (-not $Silent) {
                Write-ColorText "📁 Project appears to have many files. Use -Force to override or 'quick-setup' manually." "Warning"
            }
        }
        return
    }
    
    $templates = Get-AvailableTemplates
    if ($templates.Count -eq 0) {
        Write-ColorText "❌ No templates found in $TemplatesPath" "Error"
        return
    }
    
    Write-ColorText "🤖 Claude Code CLI Project Initializer" "Prompt"
    Write-ColorText "Current directory: $ProjectPath" "Info"
    
    Show-TemplateMenu $templates
    $choice = Get-UserChoice $templates.Count
    
    if ($choice -eq 0) {
        Write-ColorText "👍 Skipping template setup." "Info"
        Write-Log "User skipped template setup"
        return
    }
    
    $selectedTemplate = $templates[$choice - 1]
    $success = Copy-Template $selectedTemplate.Path $ProjectPath $selectedTemplate.Config
    
    if ($success) {
        Write-ColorText "`n🎉 Project initialized successfully!" "Success"
        Write-ColorText "You can now use Claude Code CLI with the configured templates." "Info"
    }
}

# Export function for module use
if ($MyInvocation.InvocationName -ne '.') {
    Start-ProjectInitializer
}
