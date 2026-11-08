$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ToolsRoot = Join-Path $ProjectRoot '.tools'
$UvRoot = Join-Path $ToolsRoot 'uv'
$UvExe = Join-Path $UvRoot 'uv.exe'
New-Item -ItemType Directory -Force -Path $UvRoot | Out-Null
if (-not (Test-Path -LiteralPath $UvExe)) {
    $Archive = Join-Path $ToolsRoot 'uv.zip'
    Invoke-WebRequest -Uri 'https://github.com/astral-sh/uv/releases/download/0.13.7/uv-x86_64-pc-windows-msvc.zip' -OutFile $Archive
    Expand-Archive -LiteralPath $Archive -DestinationPath $UvRoot -Force
}
$env:UV_CACHE_DIR = Join-Path $ToolsRoot 'cache'
$env:UV_PYTHON_INSTALL_DIR = Join-Path $ToolsRoot 'python'
$env:UV_PYTHON_BIN_DIR = Join-Path $ToolsRoot 'bin'
$env:UV_TOOL_DIR = Join-Path $ToolsRoot 'packages'
$env:UV_TOOL_BIN_DIR = Join-Path $ToolsRoot 'bin'
& $UvExe tool install --python 3.13 'specify-cli==1.3.2'
if ($LASTEXITCODE -ne 0) { throw 'Instalacja Spec Kit nie powiodla sie.' }
& (Join-Path $env:UV_TOOL_BIN_DIR 'specify.exe') version
if ($LASTEXITCODE -ne 0) { throw 'Weryfikacja Spec Kit nie powiodla sie.' }
