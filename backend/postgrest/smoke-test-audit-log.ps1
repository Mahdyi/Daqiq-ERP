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
    UseBasicParsing = $true
  }

  if ($null -ne $Body) {
    $request['ContentType'] = 'application/json'
    $request['Body'] = ($Body | ConvertTo-Json -Depth 10)
  }

  try {
    Invoke-WebRequest @request
  } catch [System.Net.WebException] {
    if ($null -eq $_.Exception.Response) {
      throw
    }

    $response = $_.Exception.Response
    $reader = New-Object System.IO.StreamReader($response.GetResponseStream())

    [pscustomobject]@{
      StatusCode = [int] $response.StatusCode
      Content = $reader.ReadToEnd()
      Headers = $response.Headers
    }
  }
}

function Assert-Status {
  param(
    [Parameter(Mandatory)] $Response,
    [Parameter(Mandatory)] [int[]] $AllowedStatus,
    [Parameter(Mandatory)] [string] $Name
  )

  if ($AllowedStatus -notcontains [int] $Response.StatusCode) {
    throw "$Name failed. Expected status $($AllowedStatus -join ', '), got $($Response.StatusCode). Body: $($Response.Content)"
  }

  Write-Host "PASS: $Name"
}

function Login-User {
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
  $response.Content | ConvertFrom-Json
}

function Assert-NoSensitiveContent {
  param(
    [Parameter(Mandatory)] [string] $Content,
    [Parameter(Mandatory)] [string] $Name
  )

  if ($Content -match 'password|refreshToken|accessToken|password_hash|refresh_token_hash|Bearer eyJ|jwt_secret') {
    throw "$Name leaked sensitive content."
  }

  Write-Host "PASS: $Name has no sensitive content"
}

$failedLogin = Invoke-Api `
  -Method POST `
  -Path '/rpc/login' `
  -Body @{
    email = 'admin@erp.com'
    password = 'wrong-password'
  }
Assert-Status $failedLogin @(400, 401, 403) 'Failed login is rejected'

$admin = Login-User -Email 'admin@erp.com' -Password 'admin'
$manager = Login-User -Email 'manager@erp.com' -Password 'manager'

$nonAdminAudit = Invoke-Api `
  -Method POST `
  -Path '/rpc/admin_list_audit_logs' `
  -Token $manager.accessToken `
  -Body @{
    page_number = 1
    page_size = 5
  }
Assert-Status $nonAdminAudit @(401, 403, 404) 'Non-admin cannot list audit logs'

$suffix = [Guid]::NewGuid().ToString('N').Substring(0, 12)
$email = "audit-smoke-$suffix@example.test"

$createdUser = Invoke-Api `
  -Method POST `
  -Path '/rpc/admin_create_user' `
  -Token $admin.accessToken `
  -Body @{
    email = $email
    display_name = 'Audit Smoke User'
    password = "AuditPass-$suffix"
    app_roles = @('viewer')
    active = $true
  }
Assert-Status $createdUser @(200) 'Admin user creation succeeds'

$customerCode = ("AUDIT-SMOKE-{0}" -f $suffix).ToUpperInvariant()
$createdCustomer = Invoke-Api `
  -Method POST `
  -Path '/customers' `
  -Token $admin.accessToken `
  -ExtraHeaders @{ Prefer = 'return=representation' } `
  -Body @{
    code = $customerCode
    name = 'Audit Smoke Customer'
    customer_type = 'corporate'
    credit_limit = 1000
    active = $true
  }
Assert-Status $createdCustomer @(201) 'Customer create succeeds'

$patchedCustomer = Invoke-Api `
  -Method PATCH `
  -Path "/customers?code=eq.$customerCode" `
  -Token $admin.accessToken `
  -ExtraHeaders @{ Prefer = 'return=representation' } `
  -Body @{
    name = 'Audit Smoke Customer Updated'
  }
Assert-Status $patchedCustomer @(200) 'Customer update succeeds'

$deletedCustomer = Invoke-Api `
  -Method DELETE `
  -Path "/customers?code=eq.$customerCode" `
  -Token $admin.accessToken
Assert-Status $deletedCustomer @(200, 204) 'Customer delete succeeds'

$auditList = Invoke-Api `
  -Method POST `
  -Path '/rpc/admin_list_audit_logs' `
  -Token $admin.accessToken `
  -Body @{
    page_number = 1
    page_size = 50
  }
Assert-Status $auditList @(200) 'Admin can list audit logs'
Assert-NoSensitiveContent -Content $auditList.Content -Name 'Audit list response'

$auditPayload = $auditList.Content | ConvertFrom-Json
$actions = @($auditPayload.items | ForEach-Object { $_.action })

foreach ($expectedAction in @(
  'auth.login.success',
  'auth.login.failure',
  'user.created',
  'customer.created',
  'customer.updated',
  'customer.deleted'
)) {
  if ($actions -notcontains $expectedAction) {
    throw "Expected audit action $expectedAction was not found."
  }

  Write-Host "PASS: Audit action $expectedAction exists"
}

$firstLogId = $auditPayload.items[0].id
$auditDetail = Invoke-Api `
  -Method POST `
  -Path '/rpc/admin_get_audit_log' `
  -Token $admin.accessToken `
  -Body @{
    log_id = $firstLogId
  }
Assert-Status $auditDetail @(200) 'Admin can get audit log detail'
Assert-NoSensitiveContent -Content $auditDetail.Content -Name 'Audit detail response'
