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
$warehouse = Login-User -Email 'warehouse@erp.com' -Password 'warehouse'
$sales = Login-User -Email 'sales@erp.com' -Password 'sales'
$viewer = Login-User -Email 'viewer@erp.com' -Password 'viewer'

$unitId = Get-LookupId -Token $admin.accessToken -TypeCode 'unit' -Code 'piece'
$categoryId = Get-LookupId -Token $admin.accessToken -TypeCode 'product_category' -Code 'finished_good'
$taxRateId = Get-LookupId -Token $admin.accessToken -TypeCode 'tax_rate' -Code 'standard'
$wrongLookupId = Get-LookupId -Token $admin.accessToken -TypeCode 'unit' -Code 'kg'

$adminList = Invoke-Api `
  -Method GET `
  -Path '/products?limit=1' `
  -Token $admin.accessToken
Assert-Status $adminList @(200, 206) 'Admin can list products'

$viewerList = Invoke-Api `
  -Method GET `
  -Path '/products?limit=1' `
  -Token $viewer.accessToken
Assert-Status $viewerList @(401, 403) 'Viewer cannot list products'

$suffix = [Guid]::NewGuid().ToString('N').Substring(0, 10)
$sku = "SMOKE-PROD-$suffix"

$created = Invoke-Api `
  -Method POST `
  -Path '/products' `
  -Token $admin.accessToken `
  -ExtraHeaders @{ Prefer = 'return=representation' } `
  -Body @{
    sku = $sku
    name = 'Smoke Product'
    description = 'Development smoke product'
    barcode = "SMOKE-$suffix"
    product_type = 'finished_good'
    category_lookup_value_id = $categoryId
    base_unit_lookup_value_id = $unitId
    tax_rate_lookup_value_id = $taxRateId
    track_inventory = $true
    purchasable = $true
    sellable = $true
    standard_cost = 100
    sales_price = 150
    active = $true
  }
Assert-Status $created @(201) 'Admin can create product'
$createdProduct = @($created.Content | ConvertFrom-Json)[0]

$duplicate = Invoke-Api `
  -Method POST `
  -Path '/products' `
  -Token $admin.accessToken `
  -Body @{
    sku = $sku
    name = 'Duplicate Product'
    product_type = 'finished_good'
    base_unit_lookup_value_id = $unitId
    track_inventory = $true
    purchasable = $true
    sellable = $true
    active = $true
  }
Assert-Status $duplicate @(400, 409) 'Duplicate SKU is rejected'

$invalidLookup = Invoke-Api `
  -Method POST `
  -Path '/products' `
  -Token $admin.accessToken `
  -Body @{
    sku = "SMOKE-BAD-LOOKUP-$suffix"
    name = 'Bad Lookup Product'
    product_type = 'finished_good'
    category_lookup_value_id = $wrongLookupId
    base_unit_lookup_value_id = $unitId
    track_inventory = $true
    purchasable = $true
    sellable = $true
    active = $true
  }
Assert-Status $invalidLookup @(400) 'Invalid lookup type is rejected'

$badService = Invoke-Api `
  -Method POST `
  -Path '/products' `
  -Token $admin.accessToken `
  -Body @{
    sku = "SMOKE-SERVICE-$suffix"
    name = 'Bad Service Product'
    product_type = 'service'
    base_unit_lookup_value_id = $unitId
    track_inventory = $true
    purchasable = $false
    sellable = $true
    active = $true
  }
Assert-Status $badService @(400) 'Service product cannot track inventory'

$managerCreate = Invoke-Api `
  -Method POST `
  -Path '/products' `
  -Token $manager.accessToken `
  -ExtraHeaders @{ Prefer = 'return=representation' } `
  -Body @{
    sku = "SMOKE-MGR-$suffix"
    name = 'Manager Product'
    product_type = 'finished_good'
    base_unit_lookup_value_id = $unitId
    track_inventory = $true
    purchasable = $true
    sellable = $true
    active = $true
  }
Assert-Status $managerCreate @(201) 'Manager can create product'
$managerProduct = @($managerCreate.Content | ConvertFrom-Json)[0]

$managerDelete = Invoke-Api `
  -Method DELETE `
  -Path "/products?id=eq.$($managerProduct.id)" `
  -Token $manager.accessToken
Assert-Status $managerDelete @(401, 403) 'Manager cannot delete product'

$warehousePatch = Invoke-Api `
  -Method PATCH `
  -Path "/products?id=eq.$($createdProduct.id)" `
  -Token $warehouse.accessToken `
  -ExtraHeaders @{ Prefer = 'return=representation' } `
  -Body @{
    description = 'Updated by warehouse smoke test'
  }
Assert-Status $warehousePatch @(200) 'Warehouse can update product'

$warehouseCreate = Invoke-Api `
  -Method POST `
  -Path '/products' `
  -Token $warehouse.accessToken `
  -Body @{
    sku = "SMOKE-WH-$suffix"
    name = 'Warehouse Product'
    product_type = 'finished_good'
    base_unit_lookup_value_id = $unitId
    track_inventory = $true
    purchasable = $true
    sellable = $true
    active = $true
  }
Assert-Status $warehouseCreate @(401, 403) 'Warehouse cannot create product'

$salesPatch = Invoke-Api `
  -Method PATCH `
  -Path "/products?id=eq.$($createdProduct.id)" `
  -Token $sales.accessToken `
  -Body @{
    name = 'Sales Mutated Product'
  }
Assert-Status $salesPatch @(401, 403) 'Sales cannot mutate product'

$deleted = Invoke-Api `
  -Method DELETE `
  -Path "/products?id=eq.$($createdProduct.id)" `
  -Token $admin.accessToken `
  -ExtraHeaders @{ Prefer = 'return=representation' }
Assert-Status $deleted @(200, 204) 'Admin can delete product'

$auditList = Invoke-Api `
  -Method POST `
  -Path '/rpc/admin_list_audit_logs' `
  -Token $admin.accessToken `
  -Body @{
    page_number = 1
    page_size = 100
  }
Assert-Status $auditList @(200) 'Admin can list audit logs'

if ($auditList.Content -match 'Bearer eyJ|accessToken|refreshToken|jwt_secret|password_hash|refresh_token_hash') {
  throw 'Audit response leaked sensitive content.'
}

$auditPayload = $auditList.Content | ConvertFrom-Json
$actions = @($auditPayload.items | ForEach-Object { $_.action })

foreach ($expectedAction in @('product.created', 'product.updated', 'product.deleted')) {
  if ($actions -notcontains $expectedAction) {
    throw "Expected audit action $expectedAction was not found."
  }

  Write-Host "PASS: Audit action $expectedAction exists"
}
