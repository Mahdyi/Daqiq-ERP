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
    [object] $Body
  )

  $headers = @{}

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
  $payload = $response.Content | ConvertFrom-Json

  if ($response.Content -match 'password_hash|refresh_token_hash') {
    throw "Login response leaked a private hash field."
  }

  $payload
}

$admin = Login-User -Email 'admin@erp.com' -Password 'admin'
$manager = Login-User -Email 'manager@erp.com' -Password 'manager'

$nonAdminList = Invoke-Api `
  -Method POST `
  -Path '/rpc/admin_list_users' `
  -Token $manager.accessToken `
  -Body @{
    page_number = 1
    page_size = 5
  }
Assert-Status $nonAdminList @(401, 403, 404) 'Non-admin cannot list users'

$adminList = Invoke-Api `
  -Method POST `
  -Path '/rpc/admin_list_users' `
  -Token $admin.accessToken `
  -Body @{
    page_number = 1
    page_size = 5
  }
Assert-Status $adminList @(200) 'Admin can list users'
if ($adminList.Content -match 'password_hash|refresh_token_hash') {
  throw 'Admin list response leaked a private hash field.'
}

$suffix = [Guid]::NewGuid().ToString('N').Substring(0, 12)
$email = "smoke-user-$suffix@example.test"
$password = "SmokePass-$suffix"

$created = Invoke-Api `
  -Method POST `
  -Path '/rpc/admin_create_user' `
  -Token $admin.accessToken `
  -Body @{
    email = $email
    display_name = 'Smoke Test User'
    password = $password
    app_roles = @('viewer')
    active = $true
  }
Assert-Status $created @(200) 'Admin can create user'
if ($created.Content -match 'password_hash|refresh_token_hash') {
  throw 'Create response leaked a private hash field.'
}
$createdUser = $created.Content | ConvertFrom-Json

$duplicate = Invoke-Api `
  -Method POST `
  -Path '/rpc/admin_create_user' `
  -Token $admin.accessToken `
  -Body @{
    email = $email
    display_name = 'Duplicate Smoke Test User'
    password = $password
    app_roles = @('viewer')
    active = $true
  }
Assert-Status $duplicate @(400, 409) 'Duplicate email is rejected'

$invalidRole = Invoke-Api `
  -Method POST `
  -Path '/rpc/admin_update_user' `
  -Token $admin.accessToken `
  -Body @{
    user_id = $createdUser.id
    email = $email
    display_name = 'Smoke Test User'
    active = $true
    app_roles = @('invalid-role')
  }
Assert-Status $invalidRole @(400) 'Invalid role is rejected'

$updated = Invoke-Api `
  -Method POST `
  -Path '/rpc/admin_update_user' `
  -Token $admin.accessToken `
  -Body @{
    user_id = $createdUser.id
    email = $email
    display_name = 'Smoke Test User Updated'
    active = $true
    app_roles = @('sales')
  }
Assert-Status $updated @(200) 'Admin can update safe user fields and roles'

$createdLogin = Login-User -Email $email -Password $password

$reset = Invoke-Api `
  -Method POST `
  -Path '/rpc/admin_reset_user_password' `
  -Token $admin.accessToken `
  -Body @{
    user_id = $createdUser.id
    new_password = "SmokePass-New-$suffix"
  }
Assert-Status $reset @(200) 'Admin can reset password'

$refreshAfterReset = Invoke-Api `
  -Method POST `
  -Path '/rpc/refresh_session' `
  -Body @{
    refresh_token = $createdLogin.refreshToken
  }
Assert-Status $refreshAfterReset @(400, 401, 403) 'Password reset revokes previous refresh sessions'

$deactivate = Invoke-Api `
  -Method POST `
  -Path '/rpc/admin_deactivate_user' `
  -Token $admin.accessToken `
  -Body @{
    user_id = $createdUser.id
  }
Assert-Status $deactivate @(200) 'Admin can deactivate user'

$loginAfterDeactivate = Invoke-Api `
  -Method POST `
  -Path '/rpc/login' `
  -Body @{
    email = $email
    password = "SmokePass-New-$suffix"
  }
Assert-Status $loginAfterDeactivate @(400, 401, 403) 'Deactivated user cannot log in'
