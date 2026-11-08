param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]] $SpecifyArguments
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ToolsRoot = Join-Path $ProjectRoot '.tools'
$env:UV_CACHE_DIR = Join-Path $ToolsRoot 'cache'
$env:UV_PYTHON_INSTALL_DIR = Join-Path $ToolsRoot 'python'
$env:UV_PYTHON_BIN_DIR = Join-Path $ToolsRoot 'bin'
$env:UV_TOOL_DIR = Join-Path $ToolsRoot 'packages'
$env:UV_TOOL_BIN_DIR = Join-Path $ToolsRoot 'bin'
$SpecifyExe = Join-Path $env:UV_TOOL_BIN_DIR 'specify.exe'
if (-not (Test-Path -LiteralPath $SpecifyExe)) {
    throw 'Najpierw uruchom scripts/setup-spec-kit.ps1.'
}
Push-Location $ProjectRoot
try {
    & $SpecifyExe @SpecifyArguments
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
finally { Pop-Location }
