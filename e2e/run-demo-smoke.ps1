param(
  [switch] $Headed
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host 'Preparing Daqiq ERP browser demo smoke...'

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptRoot
$localEnv = Join-Path $scriptRoot '.env.e2e.ps1'

if (Test-Path -LiteralPath $localEnv) {
  Write-Host "Loading local browser-demo environment: $localEnv"
  . $localEnv
}

if ([string]::IsNullOrWhiteSpace($env:ERP_APP_BASE_URL)) {
  $env:ERP_APP_BASE_URL = 'http://localhost:4200'
}

if ([string]::IsNullOrWhiteSpace($env:PGRST_BASE_URL) -and -not [string]::IsNullOrWhiteSpace($env:POSTGREST_BASE_URL)) {
  $env:PGRST_BASE_URL = $env:POSTGREST_BASE_URL
}

if ([string]::IsNullOrWhiteSpace($env:PGRST_BASE_URL)) {
  $env:PGRST_BASE_URL = 'http://127.0.0.1:3000'
}

Write-Host "Daqiq ERP browser demo smoke"
Write-Host "Angular base URL: $env:ERP_APP_BASE_URL"
Write-Host "PostgREST base URL for Angular proxy: $env:PGRST_BASE_URL"

function Test-AppReachable {
  try {
    $response = Invoke-WebRequest -Method GET -Uri $env:ERP_APP_BASE_URL -UseBasicParsing -TimeoutSec 3
    return [int] $response.StatusCode -ge 200 -and [int] $response.StatusCode -lt 500
  } catch {
    return $false
  }
}

function Stop-ProcessTree {
  param([Parameter(Mandatory)] [int] $ProcessId)

  $taskkill = Get-Command taskkill.exe -ErrorAction SilentlyContinue
  if ($null -ne $taskkill) {
    & taskkill.exe /PID $ProcessId /T /F | Out-Null
    return
  }

  Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
}

$serverProcess = $null
$serverStarted = $false
$stdoutPath = Join-Path $env:TEMP 'daqiq-erp-e2e-server.out.log'
$stderrPath = Join-Path $env:TEMP 'daqiq-erp-e2e-server.err.log'

if (-not (Test-AppReachable)) {
  Write-Host 'Angular dev server is not reachable; starting it for the browser smoke...'
  Remove-Item -LiteralPath $stdoutPath, $stderrPath -ErrorAction SilentlyContinue

  $serverProcess = Start-Process `
    -FilePath 'npm.cmd' `
    -ArgumentList @('start', '--', '--host', '127.0.0.1', '--port', '4200') `
    -WorkingDirectory $repoRoot `
    -RedirectStandardOutput $stdoutPath `
    -RedirectStandardError $stderrPath `
    -WindowStyle Hidden `
    -PassThru

  $serverStarted = $true
  $deadline = (Get-Date).AddSeconds(120)

  while ((Get-Date) -lt $deadline) {
    if (Test-AppReachable) {
      Write-Host 'Angular dev server is ready.'
      break
    }

    Start-Sleep -Seconds 2
  }

  if (-not (Test-AppReachable)) {
    if ($serverStarted -and $null -ne $serverProcess) {
      Stop-ProcessTree -ProcessId $serverProcess.Id
    }

    throw "Angular dev server did not become reachable at $env:ERP_APP_BASE_URL. See $stdoutPath and $stderrPath."
  }
} else {
  Write-Host 'Using existing Angular dev server.'
}

$arguments = @('playwright', 'test')

if ($Headed) {
  $arguments += '--headed'
}

try {
  Write-Host "Running: npx $($arguments -join ' ')"
  & npx @arguments
  $exitCode = $LASTEXITCODE
} finally {
  if ($serverStarted -and $null -ne $serverProcess) {
    Write-Host 'Stopping Angular dev server started by browser smoke...'
    Stop-ProcessTree -ProcessId $serverProcess.Id
  }
}

exit $exitCode
