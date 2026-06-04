# Simple test script to verify the project initializer works

Write-Host "🧪 Testing Smart Project Initializer System" -ForegroundColor Cyan

$ProjectInitPath = "C:\Users\maxco\OneDrive\Documents\GitHub\Coding Tools\Claude\project-initializer"

Write-Host "`n📁 Checking file structure..." -ForegroundColor Yellow

$requiredPaths = @(
    "$ProjectInitPath\setup.ps1",
    "$ProjectInitPath\quick-setup.ps1", 
    "$ProjectInitPath\scripts\Initialize-Project.ps1",
    "$ProjectInitPath\templates\bmad-template",
    "$ProjectInitPath\hooks\rule2hook-config.md"
)

$allGood = $true
foreach ($path in $requiredPaths) {
    if (Test-Path $path) {
        Write-Host "✅ $path" -ForegroundColor Green
    } else {
        Write-Host "❌ $path" -ForegroundColor Red
        $allGood = $false
    }
}

Write-Host "`n📦 Checking templates..." -ForegroundColor Yellow
$templatesPath = "$ProjectInitPath\templates"
$templates = Get-ChildItem $templatesPath -Directory
foreach ($template in $templates) {
    $configPath = Join-Path $template.FullName "template.json"
    if (Test-Path $configPath) {
        $config = Get-Content $configPath | ConvertFrom-Json
        Write-Host "✅ Template: $($config.name)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Template missing config: $($template.Name)" -ForegroundColor Yellow
    }
}

Write-Host "`n🛣️  Checking PATH..." -ForegroundColor Yellow
$inPath = $env:PATH -like "*$ProjectInitPath*"
if ($inPath) {
    Write-Host "✅ Project initializer is in PATH" -ForegroundColor Green
} else {
    Write-Host "⚠️  Not in PATH - run setup.ps1 -AddToPath" -ForegroundColor Yellow
}

Write-Host "`n🪝 Checking rule2hook..." -ForegroundColor Yellow
$rule2hookPath = "$env:USERPROFILE\.claude\commands\rule2hook.md"
if (Test-Path $rule2hookPath) {
    Write-Host "✅ rule2hook is available" -ForegroundColor Green
} else {
    Write-Host "⚠️  rule2hook not found" -ForegroundColor Yellow
}

if ($allGood) {
    Write-Host "`n🎉 System appears to be correctly set up!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Restart your terminal" -ForegroundColor White
    Write-Host "2. Navigate to a new project directory" -ForegroundColor White
    Write-Host "3. Run: quick-setup" -ForegroundColor White
    Write-Host "4. Choose a template from the menu" -ForegroundColor White
} else {
    Write-Host "`n❌ Some components are missing. Please check the installation." -ForegroundColor Red
}
