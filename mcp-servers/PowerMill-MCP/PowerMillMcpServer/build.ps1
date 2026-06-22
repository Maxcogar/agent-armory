# PowerMillMcpServer build + test + smoke-test script.
# Run from the project directory: ./build.ps1
#
# Steps:
#   1. dotnet build -c Release       (server + test project + Delcam refs)
#   2. dotnet test -c Release        (xUnit suite)
#   3. stdio smoke test              (verify the wire protocol against a freshly built exe)
#   4. print artifact path + SHA256
#
# Exits 0 only when all steps succeed. Any non-zero exit is a build break.

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverProject = Join-Path $projectRoot 'PowerMillMcpServer.csproj'
$testsProject = Join-Path (Split-Path -Parent $projectRoot) 'PowerMillMcpServer.Tests\PowerMillMcpServer.Tests.csproj'
$exePath = Join-Path $projectRoot 'bin\Release\net48\win-x64\PowerMillMcpServer.exe'

function Step($name) {
    Write-Host ''
    Write-Host ('=== {0} ===' -f $name) -ForegroundColor Cyan
}

# Step 1 — build
Step 'Build (Release)'
& dotnet build $serverProject -c Release --nologo
if ($LASTEXITCODE -ne 0) { Write-Host 'Build failed' -ForegroundColor Red; exit 1 }

# Step 2 — test
Step 'Test'
if (Test-Path $testsProject) {
    & dotnet test $testsProject -c Release --nologo --logger 'console;verbosity=minimal'
    if ($LASTEXITCODE -ne 0) { Write-Host 'Tests failed' -ForegroundColor Red; exit 1 }
} else {
    Write-Host 'Test project not found; skipping.' -ForegroundColor Yellow
}

# Step 3 — stdio smoke test
Step 'Stdio smoke test'
if (-not (Test-Path $exePath)) {
    Write-Host "Server exe missing: $exePath" -ForegroundColor Red
    exit 1
}

$frames = @(
    '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"build-smoke","version":"0"}}}',
    '{"jsonrpc":"2.0","method":"notifications/initialized"}',
    '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
)
$stdin = ($frames -join "`n") + "`n"

# ReadToEnd() can deadlock or truncate when both stdout and stderr are
# redirected and the child writes more than fits in the OS pipe buffer.
# Reading line-by-line drains stdout as it's produced, avoiding the issue.
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $exePath
$psi.RedirectStandardInput = $true
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $true
$psi.StandardOutputEncoding = [System.Text.UTF8Encoding]::new($false)
$psi.StandardErrorEncoding = [System.Text.UTF8Encoding]::new($false)

$proc = New-Object System.Diagnostics.Process
$proc.StartInfo = $psi
[void]$proc.Start()
$proc.StandardInput.Write($stdin)
$proc.StandardInput.Close()

$stdoutLines = New-Object System.Collections.Generic.List[string]
while (-not $proc.StandardOutput.EndOfStream) {
    $line = $proc.StandardOutput.ReadLine()
    if ($null -ne $line) { [void]$stdoutLines.Add($line) }
}
if (-not $proc.WaitForExit(5000)) { $proc.Kill() }
$stderr = $proc.StandardError.ReadToEnd()
$stdout = [string]::Join("`n", $stdoutLines)

$lines = @($stdoutLines | Where-Object { $_.Trim().Length -gt 0 })

if ($env:POWERMILL_BUILD_DEBUG -eq '1') {
    Write-Host ('  stdout bytes: {0}' -f $stdout.Length)
    Write-Host ('  line count:   {0}' -f $lines.Count)
    for ($i = 0; $i -lt $lines.Count; $i++) {
        Write-Host ('  line[{0}] length: {1}' -f $i, $lines[$i].Length)
    }
}
if ($lines.Count -lt 2) {
    Write-Host ('Smoke test: expected >=2 response lines, got {0}' -f $lines.Count) -ForegroundColor Red
    Write-Host '--- stdout ---'
    Write-Host $stdout
    Write-Host '--- stderr ---'
    Write-Host $stderr
    exit 1
}

# PowerShell 5.1's ConvertFrom-Json balks on the full tools/list payload (deep
# nesting + ~30KB). Use regex on the raw string instead — robust and avoids the
# parser limit.
$initLine = $lines[0]
$listLine = $lines[1]

$versionMatch = [regex]::Match($initLine, '"protocolVersion"\s*:\s*"([^"]+)"')
if (-not $versionMatch.Success) {
    Write-Host 'Smoke test: initialize response missing protocolVersion' -ForegroundColor Red
    Write-Host $initLine
    exit 1
}
$negotiatedVersion = $versionMatch.Groups[1].Value

$toolNameMatches = [regex]::Matches($listLine, '"name"\s*:\s*"([^"]+)"')
# The 'name' key appears once per tool descriptor at the top level. Count and
# spot-check a couple known tool names so a regex regression would surface.
$toolCount = $toolNameMatches.Count
$expected = 46
if ($toolCount -ne $expected) {
    Write-Host ("Smoke test: expected {0} tools, got {1}" -f $expected, $toolCount) -ForegroundColor Red
    exit 1
}
$expectedNames = @('connect_powermill', 'run_macro', 'write_nc_program', 'query_parameter')
foreach ($n in $expectedNames) {
    if ($listLine -notmatch ('"name"\s*:\s*"' + [regex]::Escape($n) + '"')) {
        Write-Host ("Smoke test: tool '{0}' missing from tools/list" -f $n) -ForegroundColor Red
        exit 1
    }
}

Write-Host ('  protocolVersion: {0}' -f $negotiatedVersion) -ForegroundColor Green
Write-Host ('  tools registered: {0}' -f $toolCount) -ForegroundColor Green

# Step 4 — artifact info
Step 'Artifact'
$hash = (Get-FileHash $exePath -Algorithm SHA256).Hash
$size = (Get-Item $exePath).Length
Write-Host ('  Path:    {0}' -f $exePath)
Write-Host ('  Size:    {0:N0} bytes' -f $size)
Write-Host ('  SHA256:  {0}' -f $hash)

Write-Host ''
Write-Host 'Build green.' -ForegroundColor Green
exit 0
