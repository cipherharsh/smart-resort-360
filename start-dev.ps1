# start-dev.ps1 - PowerShell launcher for Smart Resort 360
$PSScriptRoot = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
Set-Location $PSScriptRoot

if (Test-Path "$PSScriptRoot\backend\venv\Scripts\python.exe") {
    & "$PSScriptRoot\backend\venv\Scripts\python.exe" "$PSScriptRoot\run_app.py"
} else {
    python "$PSScriptRoot\run_app.py"
}
