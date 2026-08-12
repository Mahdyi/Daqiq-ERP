param(
  [switch] $ContinueOnFailure
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$baseUrl = if ($env:PGRST_BASE_URL) {
  $env:PGRST_BASE_URL
} elseif ($env:POSTGREST_BASE_URL) {
  $env:POSTGREST_BASE_URL
} else {
  'http://127.0.0.1:3000'
}
$env:PGRST_BASE_URL = $baseUrl.TrimEnd('/')

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$localSmokeEnv = Join-Path $scriptRoot '.env.smoke.ps1'

if (Test-Path -LiteralPath $localSmokeEnv) {
  Write-Host "Loading local smoke-test environment: $localSmokeEnv"
  . $localSmokeEnv
  if ($env:PGRST_BASE_URL) {
    $env:PGRST_BASE_URL = $env:PGRST_BASE_URL.TrimEnd('/')
  }
}

$smokeTests = @(
  'smoke-test-auth.ps1',
  'smoke-test-user-management.ps1',
  'smoke-test-settings-lookups.ps1',
  'smoke-test-products.ps1',
  'smoke-test-suppliers.ps1',
  'smoke-test-warehouses.ps1',
  'smoke-test-inventory.ps1',
  'smoke-test-purchase-orders.ps1',
  'smoke-test-goods-receipts.ps1',
  'smoke-test-sales-orders.ps1',
  'smoke-test-sales-deliveries.ps1',
  'smoke-test-sales-invoices.ps1',
  'smoke-test-supplier-invoices.ps1',
  'smoke-test-accounting.ps1',
  'smoke-test-payments.ps1',
  'smoke-test-reports.ps1'
)

Write-Host "Daqiq ERP smoke-test runner"
Write-Host "PostgREST base URL: $env:PGRST_BASE_URL"
Write-Host "Continue on failure: $($ContinueOnFailure.IsPresent)"
Write-Host ''

$results = New-Object System.Collections.Generic.List[object]

foreach ($testName in $smokeTests) {
  $testPath = Join-Path $scriptRoot $testName
  if (-not (Test-Path -LiteralPath $testPath)) {
    $results.Add([pscustomobject]@{
      Script = $testName
      Status = 'MISSING'
      Duration = '00:00:00'
    })
    if (-not $ContinueOnFailure) {
      break
    }
    continue
  }

  Write-Host "=== RUN $testName ==="
  $startedAt = Get-Date
  & powershell -ExecutionPolicy Bypass -File $testPath
  $exitCode = $LASTEXITCODE
  $duration = (Get-Date) - $startedAt

  if ($exitCode -eq 0) {
    $status = 'PASS'
  } else {
    $status = "FAIL ($exitCode)"
  }

  $results.Add([pscustomobject]@{
    Script = $testName
    Status = $status
    Duration = $duration.ToString('hh\:mm\:ss')
  })

  Write-Host "=== $status $testName in $($duration.ToString('hh\:mm\:ss')) ==="
  Write-Host ''

  if ($exitCode -ne 0 -and -not $ContinueOnFailure) {
    break
  }
}

Write-Host 'Smoke-test summary:'
$results | Format-Table Script, Status, Duration -AutoSize

$failed = @($results | Where-Object { $_.Status -ne 'PASS' })
if ($failed.Count -gt 0) {
  Write-Host ''
  Write-Host 'At least one smoke test failed. Fix the first failure before presenting the product.'
  exit 1
}

Write-Host ''
Write-Host 'All smoke tests passed.'
exit 0
