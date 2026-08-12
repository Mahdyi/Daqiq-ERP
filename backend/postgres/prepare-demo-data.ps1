param(
  [switch] $RunSmokeFixtures
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host 'Daqiq ERP demo-data preparation'
Write-Host ''
Write-Host 'A destructive demo reset is intentionally not implemented.'
Write-Host 'The safe local strategy is:'
Write-Host '1. Start the local backend.'
Write-Host '2. Set local smoke credentials through environment variables.'
Write-Host '3. Run smoke tests to create deterministic demonstration records through real business flows.'
Write-Host ''

if (-not $RunSmokeFixtures) {
  Write-Host 'To create fresh demo records through the verified flows, run:'
  Write-Host 'powershell -ExecutionPolicy Bypass -File backend/postgres/prepare-demo-data.ps1 -RunSmokeFixtures'
  exit 0
}

$runner = Join-Path (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)) 'postgrest/run-all-smoke-tests.ps1'
& powershell -ExecutionPolicy Bypass -File $runner
exit $LASTEXITCODE
