$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$stateFile = Join-Path $root '.runtime\processes.json'
if (-not (Test-Path $stateFile)) { Write-Host 'No hay procesos registrados por iniciar-proyecto.ps1.'; exit 0 }
$state = Get-Content -Raw $stateFile | ConvertFrom-Json
foreach ($entry in @(@{Name='Frontend'; Id=[int]$state.frontendPid; Expected='servidor_frontend.py'}, @{Name='Backend'; Id=[int]$state.backendPid; Expected='run-backend-local.ps1'})) {
    if (-not $entry.Id) { continue }
    $process = Get-CimInstance Win32_Process -Filter "ProcessId=$($entry.Id)" -ErrorAction SilentlyContinue
    if (-not $process) { Write-Host "$($entry.Name): ya estaba detenido."; continue }
    if (-not $process.CommandLine.Contains($entry.Expected)) { Write-Warning "$($entry.Name): el PID registrado ya pertenece a otro proceso; se deja intacto."; continue }
    & taskkill.exe /PID $entry.Id /T /F | Out-Null
    Write-Host "$($entry.Name) detenido (PID $($entry.Id))."
}
Remove-Item -LiteralPath $stateFile -Force
