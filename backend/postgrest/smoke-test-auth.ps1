#requires -Version 7.0

[CmdletBinding()]
param(
  [string] $BaseUrl = $env:PGRST_BASE_URL
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
  $BaseUrl = 'http://127.0.0.1:3000'
}

function Invoke-Api {
  param(
    [Parameter(Mandatory)] [string] $Method,
    [Parameter(Mandatory)] [string] $Path,
    [string] $Token,
    [object] $Body,
    [hashtable] $ExtraHeaders = @{}
  )

  $headers = @{}

  foreach ($key in $ExtraHeaders.Keys) {
    $headers[$key] = $ExtraHeaders[$key]
  }

  if (-not [string]::IsNullOrWhiteSpace($Token)) {
    $headers['Authorization'] = "Bearer $Token"
  }

  $request = @{
    Method = $Method
    Uri = "$BaseUrl$Path"
    Headers = $headers
    SkipHttpErrorCheck = $true
  }

  if ($null -ne $Body) {
    $request['ContentType'] = 'application/json'
    $request['Body'] = ($Body | ConvertTo-Json -Depth 8)
  }

  Invoke-WebRequest @request
}

function Assert-Status {
  param(
    [Parameter(Mandatory)] $Response,
    [Parameter(Mandatory)] [int[]] $AllowedStatus,
    [Parameter(Mandatory)] [string] $Name
  )

  if ($AllowedStatus -notcontains [int] $Response.StatusCode) {
    throw "$Name failed. Expected status $($AllowedStatus -join ', '), got $($Response.StatusCode)."
  }

  Write-Host "PASS: $Name"
}

function Login-DevUser {
  param(
    [Parameter(Mandatory)] [string] $Email,
    [Parameter(Mandatory)] [string] $Password
  )

  $response = Invoke-Api `
    -Method POST `
    -Path '/rpc/login' `
    -Body @{
      email = $Email
      password = $Password
    }

  Assert-Status $response @(200) "Login succeeds for $Email"
  $payload = $response.Content | ConvertFrom-Json

  if ([string]::IsNullOrWhiteSpace($payload.accessToken)) {
    throw "Login response for $Email did not include an access token."
  }

  if ($response.Content -match 'password_hash') {
    throw 'Login response leaked password_hash.'
  }

  $payload
}

$anonymousList = Invoke-Api -Method GET -Path '/customers?limit=1'
Assert-Status $anonymousList @(401, 403) 'Anonymous customer list fails'

$invalidLogin = Invoke-Api `
  -Method POST `
  -Path '/rpc/login' `
  -Body @{
    email = 'admin@erp.com'
    password = 'wrong-password'
  }
Assert-Status $invalidLogin @(400, 401, 403) 'Invalid login fails safely'

$admin = Login-DevUser -Email 'admin@erp.com' -Password 'admin'
$accountant = Login-DevUser -Email 'accountant@erp.com' -Password 'accountant'
$warehouse = Login-DevUser -Email 'warehouse@erp.com' -Password 'warehouse'

if ([datetime]::Parse($admin.expiresAt) -le [datetime]::UtcNow) {
  throw 'Admin token expiry is not in the future.'
}
Write-Host 'PASS: Login response contains finite future expiry'

$me = Invoke-Api -Method POST -Path '/rpc/me' -Token $admin.accessToken
Assert-Status $me @(200) 'Authenticated user can call /rpc/me'
if ($me.Content -match 'password_hash') {
  throw '/rpc/me response leaked password_hash.'
}
Write-Host 'PASS: /rpc/me does not expose password_hash'

$adminList = Invoke-Api `
  -Method GET `
  -Path '/customers?order=created_at.desc&id=not.is.null' `
  -Token $admin.accessToken `
  -ExtraHeaders @{ 'Range-Unit' = 'items'; 'Range' = '0-4'; 'Prefer' = 'count=exact' }
Assert-Status $adminList @(200, 206) 'Admin token can list customers'

$testCode = ("AUTH-SMOKE-{0}" -f [Guid]::NewGuid().ToString('N').Substring(0, 12)).ToUpperInvariant()

try {
  $create = Invoke-Api `
    -Method POST `
    -Path '/customers' `
    -Token $admin.accessToken `
    -ExtraHeaders @{ Prefer = 'return=representation' } `
    -Body @{
      code = $testCode
      name = 'Auth Smoke Test Customer'
      customer_type = 'corporate'
      credit_limit = 1000
      active = $true
    }
  Assert-Status $create @(201) 'Admin token can create customer'

  $accountantList = Invoke-Api -Method GET -Path '/customers?limit=1' -Token $accountant.accessToken
  Assert-Status $accountantList @(200, 206) 'Accountant token can list customers'

  $accountantCreate = Invoke-Api `
    -Method POST `
    -Path '/customers' `
    -Token $accountant.accessToken `
    -Body @{
      code = "$testCode-ACC"
      name = 'Accountant Blocked Customer'
      customer_type = 'corporate'
      active = $true
    }
  Assert-Status $accountantCreate @(401, 403, 405) 'Accountant token cannot create customer'

  $warehouseList = Invoke-Api -Method GET -Path '/customers?limit=1' -Token $warehouse.accessToken
  Assert-Status $warehouseList @(401, 403) 'Warehouse token cannot list customers'
}
finally {
  Invoke-Api `
    -Method DELETE `
    -Path "/customers?code=like.AUTH-SMOKE-*" `
    -Token $admin.accessToken | Out-Null
}
