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

function Get-LookupId {
  param(
    [Parameter(Mandatory)] [string] $Token,
    [Parameter(Mandatory)] [string] $TypeCode,
    [Parameter(Mandatory)] [string] $Code
  )

  $response = Invoke-Api `
    -Method POST `
    -Path '/rpc/admin_list_lookup_values' `
    -Token $Token `
    -Body @{
      lookup_type_code = $TypeCode
      page_number = 1
      page_size = 100
    }

  Assert-Status $response @(200) "Lookup $TypeCode can be read"
  $payload = $response.Content | ConvertFrom-Json
  $match = @($payload.items | Where-Object { $_.code -eq $Code })[0]

  if ($null -eq $match) {
    throw "Lookup value $TypeCode/$Code was not found."
  }

  $match.id
}

$admin = Login-User -Email 'admin@erp.com' -Password 'admin'
$manager = Login-User -Email 'manager@erp.com' -Password 'manager'
$accountant = Login-User -Email 'accountant@erp.com' -Password 'accountant'
$warehouse = Login-User -Email 'warehouse@erp.com' -Password 'warehouse'
$sales = Login-User -Email 'sales@erp.com' -Password 'sales'
$viewer = Login-User -Email 'viewer@erp.com' -Password 'viewer'

$supplierGroupId = Get-LookupId -Token $admin.accessToken -TypeCode 'supplier_group' -Code 'local'
$currencyId = Get-LookupId -Token $admin.accessToken -TypeCode 'currency' -Code 'IRR'
$wrongLookupId = Get-LookupId -Token $admin.accessToken -TypeCode 'currency' -Code 'EUR'

$adminList = Invoke-Api `
  -Method GET `
  -Path '/suppliers?limit=1' `
  -Token $admin.accessToken
Assert-Status $adminList @(200, 206) 'Admin can list suppliers'

$managerList = Invoke-Api `
  -Method GET `
  -Path '/suppliers?limit=1' `
  -Token $manager.accessToken
Assert-Status $managerList @(200, 206) 'Manager can list suppliers'

$accountantList = Invoke-Api `
  -Method GET `
  -Path '/suppliers?limit=1' `
  -Token $accountant.accessToken
Assert-Status $accountantList @(200, 206) 'Accountant can list suppliers'

$warehouseList = Invoke-Api `
  -Method GET `
  -Path '/suppliers?limit=1' `
  -Token $warehouse.accessToken
Assert-Status $warehouseList @(200, 206) 'Warehouse can list suppliers'

foreach ($blockedUser in @(
  @{ Name = 'Sales'; Token = $sales.accessToken },
  @{ Name = 'Viewer'; Token = $viewer.accessToken }
)) {
  $blockedList = Invoke-Api `
    -Method GET `
    -Path '/suppliers?limit=1' `
    -Token $blockedUser.Token
  Assert-Status $blockedList @(401, 403) "$($blockedUser.Name) cannot list suppliers"
}

$suffix = [Guid]::NewGuid().ToString('N').Substring(0, 10)
$code = "SMOKE-SUP-$suffix"

$created = Invoke-Api `
  -Method POST `
  -Path '/suppliers' `
  -Token $admin.accessToken `
  -ExtraHeaders @{ Prefer = 'return=representation' } `
  -Body @{
    code = $code
    name = 'Smoke Supplier'
    email = "smoke-supplier-$suffix@example.test"
    phone = '021-00000000'
    tax_number = '9988776655'
    contact_person = 'Smoke Contact'
    website = 'https://smoke-supplier.example.test'
    address = 'Smoke address'
    supplier_group_lookup_value_id = $supplierGroupId
    currency_lookup_value_id = $currencyId
    payment_terms_days = 30
    active = $true
  }
Assert-Status $created @(201) 'Admin can create supplier'
$createdSupplier = @($created.Content | ConvertFrom-Json)[0]

$duplicate = Invoke-Api `
  -Method POST `
  -Path '/suppliers' `
  -Token $admin.accessToken `
  -Body @{
    code = $code
    name = 'Duplicate Supplier'
    active = $true
  }
Assert-Status $duplicate @(400, 409) 'Duplicate supplier code is rejected'

$invalidLookup = Invoke-Api `
  -Method POST `
  -Path '/suppliers' `
  -Token $admin.accessToken `
  -Body @{
    code = "SMOKE-BAD-SUP-$suffix"
    name = 'Bad Supplier Lookup'
    supplier_group_lookup_value_id = $wrongLookupId
    currency_lookup_value_id = $currencyId
    active = $true
  }
Assert-Status $invalidLookup @(400) 'Invalid supplier lookup type is rejected'

$managerCreate = Invoke-Api `
  -Method POST `
  -Path '/suppliers' `
  -Token $manager.accessToken `
  -ExtraHeaders @{ Prefer = 'return=representation' } `
  -Body @{
    code = "SMOKE-MGR-SUP-$suffix"
    name = 'Manager Supplier'
    supplier_group_lookup_value_id = $supplierGroupId
    currency_lookup_value_id = $currencyId
    payment_terms_days = 15
    active = $true
  }
Assert-Status $managerCreate @(201) 'Manager can create supplier'
$managerSupplier = @($managerCreate.Content | ConvertFrom-Json)[0]

$managerUpdate = Invoke-Api `
  -Method PATCH `
  -Path "/suppliers?id=eq.$($managerSupplier.id)" `
  -Token $manager.accessToken `
  -ExtraHeaders @{ Prefer = 'return=representation' } `
  -Body @{
    contact_person = 'Updated by manager'
  }
Assert-Status $managerUpdate @(200) 'Manager can update supplier'

$managerDelete = Invoke-Api `
  -Method DELETE `
  -Path "/suppliers?id=eq.$($managerSupplier.id)" `
  -Token $manager.accessToken
Assert-Status $managerDelete @(401, 403) 'Manager cannot delete supplier'

$accountantUpdate = Invoke-Api `
  -Method PATCH `
  -Path "/suppliers?id=eq.$($createdSupplier.id)" `
  -Token $accountant.accessToken `
  -ExtraHeaders @{ Prefer = 'return=representation' } `
  -Body @{
    payment_terms_days = 45
  }
Assert-Status $accountantUpdate @(200) 'Accountant can update supplier'

$accountantCreate = Invoke-Api `
  -Method POST `
  -Path '/suppliers' `
  -Token $accountant.accessToken `
  -Body @{
    code = "SMOKE-ACC-SUP-$suffix"
    name = 'Accountant Supplier'
    active = $true
  }
Assert-Status $accountantCreate @(401, 403) 'Accountant cannot create supplier'

$warehousePatch = Invoke-Api `
  -Method PATCH `
  -Path "/suppliers?id=eq.$($createdSupplier.id)" `
  -Token $warehouse.accessToken `
  -Body @{
    phone = '021-11111111'
  }
Assert-Status $warehousePatch @(401, 403) 'Warehouse cannot mutate supplier'

$deleted = Invoke-Api `
  -Method DELETE `
  -Path "/suppliers?id=eq.$($createdSupplier.id)" `
  -Token $admin.accessToken `
  -ExtraHeaders @{ Prefer = 'return=representation' }
Assert-Status $deleted @(200, 204) 'Admin can delete supplier'

$cleanupManager = Invoke-Api `
  -Method DELETE `
  -Path "/suppliers?id=eq.$($managerSupplier.id)" `
  -Token $admin.accessToken `
  -ExtraHeaders @{ Prefer = 'return=representation' }
Assert-Status $cleanupManager @(200, 204) 'Admin can clean up manager supplier'

$auditList = Invoke-Api `
  -Method POST `
  -Path '/rpc/admin_list_audit_logs' `
  -Token $admin.accessToken `
  -Body @{
    page_number = 1
    page_size = 100
  }
Assert-Status $auditList @(200) 'Admin can list audit logs'

if ($auditList.Content -match 'Bearer eyJ|accessToken|refreshToken|jwt_secret|password_hash|refresh_token_hash|secret') {
  throw 'Audit response leaked sensitive content.'
}

$auditPayload = $auditList.Content | ConvertFrom-Json
$actions = @($auditPayload.items | ForEach-Object { $_.action })

foreach ($expectedAction in @('supplier.created', 'supplier.updated', 'supplier.deleted')) {
  if ($actions -notcontains $expectedAction) {
    throw "Expected audit action $expectedAction was not found."
  }

  Write-Host "PASS: Audit action $expectedAction exists"
}
