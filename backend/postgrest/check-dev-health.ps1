Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$localSmokeEnv = Join-Path $scriptRoot '.env.smoke.ps1'

if (Test-Path -LiteralPath $localSmokeEnv) {
  Write-Host "Loading local smoke-test environment: $localSmokeEnv"
  . $localSmokeEnv
}

$baseUrl = if ($env:PGRST_BASE_URL) {
  $env:PGRST_BASE_URL
} elseif ($env:POSTGREST_BASE_URL) {
  $env:POSTGREST_BASE_URL
} else {
  'http://127.0.0.1:3000'
}
$baseUrl = $baseUrl.TrimEnd('/')

Write-Host "Daqiq ERP backend health check"
Write-Host "PostgREST base URL: $baseUrl"

$checks = New-Object System.Collections.Generic.List[object]

function Add-Check {
  param(
    [Parameter(Mandatory = $true)][string] $Name,
    [Parameter(Mandatory = $true)][string] $Status,
    [string] $Detail = ''
  )

  $checks.Add([pscustomobject]@{
    Name = $Name
    Status = $Status
    Detail = $Detail
  })

  if ($Status -eq 'PASS') {
    Write-Host "PASS: $Name"
  } elseif ($Status -eq 'SKIP') {
    Write-Host "SKIP: $Name - $Detail"
  } else {
    Write-Host "FAIL: $Name - $Detail"
  }
}

function Invoke-Postgrest {
  param(
    [Parameter(Mandatory = $true)][string] $Method,
    [Parameter(Mandatory = $true)][string] $Path,
    [string] $Token,
    [object] $Body
  )

  $headers = @{
    Accept = 'application/json'
    'Content-Type' = 'application/json'
  }

  if (-not [string]::IsNullOrWhiteSpace($Token)) {
    $headers.Authorization = "Bearer $Token"
  }

  $request = @{
    Method = $Method
    Uri = "$baseUrl$Path"
    Headers = $headers
    ErrorAction = 'Stop'
    UseBasicParsing = $true
    TimeoutSec = 10
  }

  if ($PSBoundParameters.ContainsKey('Body')) {
    $request.Body = ($Body | ConvertTo-Json -Depth 20)
  }

  try {
    $response = Invoke-WebRequest @request
    return [pscustomobject]@{
      StatusCode = [int] $response.StatusCode
      Body = [string] $response.Content
      Json = if ([string]::IsNullOrWhiteSpace([string] $response.Content)) { $null } else { $response.Content | ConvertFrom-Json }
    }
  } catch {
    $webResponse = $_.Exception.Response
    if ($null -eq $webResponse) {
      return [pscustomobject]@{
        StatusCode = 0
        Body = $_.Exception.Message
        Json = $null
      }
    }

    $reader = [System.IO.StreamReader]::new($webResponse.GetResponseStream())
    $content = $reader.ReadToEnd()
    $reader.Dispose()

    return [pscustomobject]@{
      StatusCode = [int] $webResponse.StatusCode
      Body = $content
      Json = if ([string]::IsNullOrWhiteSpace($content)) { $null } else { $content | ConvertFrom-Json }
    }
  }
}

function Get-AdminToken {
  $existingToken = [Environment]::GetEnvironmentVariable('ERP_ADMIN_TOKEN')
  if (-not [string]::IsNullOrWhiteSpace($existingToken)) {
    Add-Check 'Admin token source' 'PASS' 'Using ERP_ADMIN_TOKEN from local environment.'
    return $existingToken
  }

  $email = [Environment]::GetEnvironmentVariable('SMOKE_ADMIN_EMAIL')
  $password = [Environment]::GetEnvironmentVariable('SMOKE_ADMIN_PASSWORD')
  if ([string]::IsNullOrWhiteSpace($email) -or [string]::IsNullOrWhiteSpace($password)) {
    Add-Check 'Admin login token' 'SKIP' 'Set SMOKE_ADMIN_EMAIL and SMOKE_ADMIN_PASSWORD, or ERP_ADMIN_TOKEN, for authenticated health checks.'
    return $null
  }

  $login = Invoke-Postgrest -Method POST -Path '/rpc/login' -Body @{
    email = $email
    password = $password
  }

  if ($login.StatusCode -ne 200 -or $null -eq $login.Json -or [string]::IsNullOrWhiteSpace([string] $login.Json.accessToken)) {
    Add-Check 'Admin login token' 'FAIL' "Login failed. Status=$($login.StatusCode). Body=$($login.Body)"
    return $null
  }

  Add-Check 'Admin login token' 'PASS' 'Authenticated health checks can run.'
  return [string] $login.Json.accessToken
}

$root = Invoke-Postgrest -Method GET -Path '/'
if ($root.StatusCode -eq 200) {
  Add-Check 'PostgREST root endpoint' 'PASS'
} else {
  Add-Check 'PostgREST root endpoint' 'FAIL' "Status=$($root.StatusCode). Body=$($root.Body)"
}

$adminToken = Get-AdminToken

if (-not [string]::IsNullOrWhiteSpace($adminToken)) {
  $endpoints = @(
    @{ Name = 'Customers endpoint'; Path = '/customers?select=id&limit=1' },
    @{ Name = 'Products endpoint'; Path = '/products?select=id&limit=1' },
    @{ Name = 'Inventory movement view'; Path = '/inventory_movement_view?select=id&limit=1' },
    @{ Name = 'Journal entry view'; Path = '/journal_entry_view?select=id&limit=1' },
    @{ Name = 'General ledger view'; Path = '/general_ledger_view?select=journal_number&limit=1' },
    @{ Name = 'Cash/bank account view'; Path = '/cash_bank_account_view?select=id&limit=1' }
  )

  foreach ($endpoint in $endpoints) {
    $response = Invoke-Postgrest -Method GET -Path $endpoint.Path -Token $adminToken
    if (@(200, 206) -contains $response.StatusCode) {
      Add-Check $endpoint.Name 'PASS'
    } else {
      Add-Check $endpoint.Name 'FAIL' "Status=$($response.StatusCode). Body=$($response.Body)"
    }
  }
}

$failed = @($checks | Where-Object { $_.Status -eq 'FAIL' })

Write-Host ''
Write-Host 'Health check summary:'
$checks | Format-Table Name, Status, Detail -AutoSize

if ($failed.Count -gt 0) {
  Write-Host ''
  Write-Host 'Troubleshooting hints:'
  Write-Host '- Confirm Docker containers are running: docker ps'
  Write-Host '- Start local backend: docker compose --env-file backend/.env -f backend/docker-compose.yml up -d'
  Write-Host '- If port 3000 is unavailable, set $env:PGRST_BASE_URL = "http://127.0.0.1:3500"'
  Write-Host '- Reload PostgREST schema cache after SQL grants/migrations: docker kill --signal=SIGUSR1 daqiq-erp-postgrest-dev'
  Write-Host '- Never paste real JWTs, passwords, or secrets into committed files.'
  exit 1
}

exit 0
