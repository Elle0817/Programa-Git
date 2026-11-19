$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$runtime = Join-Path $root '.runtime'
$envFile = Join-Path $root '.env'
$stateFile = Join-Path $runtime 'processes.json'
New-Item -ItemType Directory -Force -Path $runtime | Out-Null

function Test-TcpPort([int]$Port) {
    $client = [System.Net.Sockets.TcpClient]::new()
    try { $task = $client.ConnectAsync('127.0.0.1', $Port); return $task.Wait(500) -and $client.Connected }
    catch { return $false }
    finally { $client.Dispose() }
}
function Get-ProcessCommandLine([int]$Id) {
    try { return (Get-CimInstance Win32_Process -Filter "ProcessId=$Id" -ErrorAction Stop).CommandLine } catch { return $null }
}
function Read-LocalEnv {
    $values = @{}
    foreach ($line in Get-Content -LiteralPath $envFile) {
        $s = $line.Trim(); if (-not $s -or $s.StartsWith('#')) { continue }
        $i = $s.IndexOf('='); if ($i -lt 1) { continue }
        $key = $s.Substring(0,$i).Trim(); $value = $s.Substring($i+1).Trim()
        if ($value.Length -ge 2 -and (($value[0] -eq '"' -and $value[-1] -eq '"') -or ($value[0] -eq "'" -and $value[-1] -eq "'"))) { $value = $value.Substring(1,$value.Length-2) }
        $values[$key] = $value
    }
    return $values
}

if (-not (Test-Path -LiteralPath $envFile)) {
    Write-Host 'Primera configuración local de MySQL. La contraseña se guardará en .env, excluido de Git.'
    $dbUser = Read-Host 'Usuario MySQL [root]'; if (-not $dbUser) { $dbUser = 'root' }
    $secure = Read-Host 'Contraseña MySQL' -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
    $businessId = Read-Host 'NEGOCIO_ACTIVO_ID (dejar vacío para selección automática)'
    $content = "DB_USER=$dbUser`r`nDB_PASSWORD=$password`r`nNEGOCIO_ACTIVO_ID=$businessId`r`n"
    [IO.File]::WriteAllText($envFile, $content, [Text.UTF8Encoding]::new($false))
    $password = $null; $content = $null; $secure = $null
}
$identity = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$acl = Get-Acl -LiteralPath $envFile
$currentUserRules = @($acl.Access | Where-Object { $_.IdentityReference.Value -eq $identity })
$otherExplicitRules = @($acl.Access | Where-Object { -not $_.IsInherited -and $_.IdentityReference.Value -ne $identity })
$userHasFullControl = @($currentUserRules | Where-Object {
    $_.AccessControlType -eq [Security.AccessControl.AccessControlType]::Allow -and
    (($_.FileSystemRights -band [Security.AccessControl.FileSystemRights]::FullControl) -eq [Security.AccessControl.FileSystemRights]::FullControl)
}).Count -gt 0

# Do not rewrite an already private ACL. If it needs tightening, icacls operates
# with the current user's ordinary file permissions and does not require SeSecurityPrivilege.
if (-not ($acl.AreAccessRulesProtected -and $userHasFullControl -and $otherExplicitRules.Count -eq 0)) {
    & icacls.exe $envFile /inheritance:r /grant:r "${identity}:(F)" | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw 'No se pudieron restringir los permisos de .env con los permisos normales del usuario. No se modificaron sus credenciales; revisa manualmente la ACL del archivo.'
    }
}
$values = Read-LocalEnv
if (-not $values.DB_USER -or -not $values.ContainsKey('DB_PASSWORD') -or -not $values.DB_PASSWORD) { throw 'Falta DB_USER o DB_PASSWORD en .env. No se mostrará su contenido.' }

if (-not (Test-TcpPort 3306)) { throw 'MySQL no responde en localhost:3306. Inicia el servicio MySQL y vuelve a ejecutar.' }

$state = if (Test-Path $stateFile) { try { Get-Content -Raw $stateFile | ConvertFrom-Json } catch { $null } } else { $null }
$owned = @{ backend = $false; frontend = $false }
foreach ($port in @(3000,8080)) {
    if (Test-TcpPort $port) {
        $pidExpected = if ($port -eq 3000) { $state.frontendPid } else { $state.backendPid }
        $cmd = if ($pidExpected) { Get-ProcessCommandLine ([int]$pidExpected) } else { $null }
        $belongs = if ($port -eq 3000) { $cmd -and $cmd.Contains('servidor_frontend.py') } else { $cmd -and ($cmd.Contains('MiGuiaTuristico_v2') -or $cmd.Contains('mvnw')) }
        if ($belongs) { if ($port -eq 3000) { $owned.frontend = $true } else { $owned.backend = $true }; Write-Host "Puerto $port ocupado por este proyecto (PID $pidExpected); se reutiliza." }
        else { throw "El puerto $port ya está ocupado por un proceso no identificado como este proyecto; no se detuvo." }
    }
}

$backendPid = if ($owned.backend) { [int]$state.backendPid } else { $null }
$frontendPid = if ($owned.frontend) { [int]$state.frontendPid } else { $null }
if (-not $owned.backend) {
    $runner = Join-Path $root 'backend\run-backend-local.ps1'
    $p = Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',"`"$runner`"",'-ProjectRoot',"`"$root`"") -WorkingDirectory (Join-Path $root 'backend') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtime 'backend.log') -RedirectStandardError (Join-Path $runtime 'backend-error.log')
    $backendPid = $p.Id; Write-Host "Backend iniciando (PID $backendPid)..."
}
if (-not $owned.frontend) {
    $python = (Get-Command python.exe -ErrorAction SilentlyContinue).Source
    if (-not $python) { $python = (Get-Command py.exe -ErrorAction Stop).Source }
    $p = Start-Process -FilePath $python -ArgumentList @((Join-Path $root 'servidor_frontend.py')) -WorkingDirectory $root -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtime 'frontend.log') -RedirectStandardError (Join-Path $runtime 'frontend-error.log')
    $frontendPid = $p.Id; Write-Host "Frontend iniciando (PID $frontendPid)..."
}
@{ backendPid = $backendPid; frontendPid = $frontendPid; root = $root } | ConvertTo-Json | Set-Content -LiteralPath $stateFile -Encoding UTF8

$deadline = (Get-Date).AddSeconds(120)
while ((Get-Date) -lt $deadline -and (-not (Test-TcpPort 8080) -or -not (Test-TcpPort 3000))) { Start-Sleep -Seconds 2 }
if (-not (Test-TcpPort 8080) -or -not (Test-TcpPort 3000)) { throw "No se confirmó la disponibilidad de ambos servidores. Consulta los registros locales en .runtime; las credenciales no se registran." }
Write-Host 'Proyecto disponible: frontend http://localhost:3000 | backend http://localhost:8080 | MySQL localhost:3306.'
