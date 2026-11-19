param([Parameter(Mandatory=$true)][string]$ProjectRoot)
$ErrorActionPreference = 'Stop'
$envFile = Join-Path $ProjectRoot '.env'
foreach ($line in Get-Content -LiteralPath $envFile) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith('#')) { continue }
    $separator = $trimmed.IndexOf('=')
    if ($separator -lt 1) { continue }
    $key = $trimmed.Substring(0, $separator).Trim()
    $value = $trimmed.Substring($separator + 1).Trim()
    if ($value.Length -ge 2 -and (($value[0] -eq '"' -and $value[-1] -eq '"') -or ($value[0] -eq "'" -and $value[-1] -eq "'"))) {
        $value = $value.Substring(1, $value.Length - 2)
    }
    if ($key -in @('DB_USER','DB_PASSWORD','NEGOCIO_ACTIVO_ID')) {
        [Environment]::SetEnvironmentVariable($key, $value, 'Process')
    }
}
Set-Location (Join-Path $ProjectRoot 'backend')
& .\mvnw.cmd spring-boot:run
exit $LASTEXITCODE
