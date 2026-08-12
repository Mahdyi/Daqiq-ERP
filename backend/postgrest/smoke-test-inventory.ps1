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

function Convert-Rows {
  param([Parameter(Mandatory)] [string] $Content)

  if ([string]::IsNullOrWhiteSpace($Content) -or $Content.Trim() -eq '[]') {
    return @()
  }

  $converted = $Content | ConvertFrom-Json
  @($converted | ForEach-Object { $_ })
}

function Login-User {
  param(
    [Parameter(Mandatory)] [string] $Email,
    [Parameter(Mandatory)] [string] $Password
  )

  $response = Invoke-Api -Method POST -Path '/rpc/login' -Body @{
    email = $Email
    password = $Password
  }

  Assert-Status $response @(200) "Login succeeds for $Email"
  $response.Content | ConvertFrom-Json
}

function First-Row {
  param(
    [Parameter(Mandatory)] $Response,
    [Parameter(Mandatory)] [string] $Name
  )

  $rows = @(Convert-Rows -Content $Response.Content)
  if ($rows.Count -lt 1) {
    throw "$Name did not return a row."
  }

  $rows[0]
}

$admin = Login-User -Email 'admin@erp.com' -Password 'admin'
$manager = Login-User -Email 'manager@erp.com' -Password 'manager'
$accountant = Login-User -Email 'accountant@erp.com' -Password 'accountant'
$warehouse = Login-User -Email 'warehouse@erp.com' -Password 'warehouse'
$sales = Login-User -Email 'sales@erp.com' -Password 'sales'
$viewer = Login-User -Email 'viewer@erp.com' -Password 'viewer'

foreach ($allowed in @(
  @{ Name = 'Admin'; Token = $admin.accessToken },
  @{ Name = 'Manager'; Token = $manager.accessToken },
  @{ Name = 'Accountant'; Token = $accountant.accessToken },
  @{ Name = 'Warehouse'; Token = $warehouse.accessToken }
)) {
  Assert-Status (Invoke-Api -Method GET -Path '/inventory_balance_view?limit=1' -Token $allowed.Token) @(200, 206) "$($allowed.Name) can list balances"
  Assert-Status (Invoke-Api -Method GET -Path '/inventory_movement_view?limit=1' -Token $allowed.Token) @(200, 206) "$($allowed.Name) can list movements"
}

Assert-Status (Invoke-Api -Method GET -Path '/inventory_balance_view?limit=1' -Token $sales.accessToken) @(200, 206) 'Sales can list balances for sales availability checks'
Assert-Status (Invoke-Api -Method GET -Path '/inventory_movement_view?limit=1' -Token $sales.accessToken) @(401, 403) 'Sales cannot list inventory movement history'

foreach ($blocked in @(
  @{ Name = 'Viewer'; Token = $viewer.accessToken }
)) {
  Assert-Status (Invoke-Api -Method GET -Path '/inventory_balance_view?limit=1' -Token $blocked.Token) @(401, 403) "$($blocked.Name) cannot list balances"
}

$suffix = [Guid]::NewGuid().ToString('N').Substring(0, 10)
$productResponse = Invoke-Api -Method GET -Path '/products?track_inventory=eq.true&active=eq.true&limit=1' -Token $admin.accessToken
Assert-Status $productResponse @(200, 206) 'Admin can read an inventory-tracked product'
$product = First-Row -Response $productResponse -Name 'Inventory-tracked product lookup'

$serviceProductResponse = Invoke-Api -Method GET -Path '/products?product_type=eq.service&active=eq.true&limit=1' -Token $admin.accessToken
Assert-Status $serviceProductResponse @(200, 206) 'Admin can query service product candidates'
$serviceProductRows = @(Convert-Rows -Content $serviceProductResponse.Content)

$warehouseResponse = Invoke-Api -Method GET -Path '/warehouses?active=eq.true&limit=2&order=code.asc' -Token $admin.accessToken
Assert-Status $warehouseResponse @(200, 206) 'Admin can read active warehouses'
$warehouses = @(Convert-Rows -Content $warehouseResponse.Content)

while ($warehouses.Count -lt 2) {
  $createdWarehouse = Invoke-Api -Method POST -Path '/warehouses' -Token $admin.accessToken -ExtraHeaders @{ Prefer = 'return=representation' } -Body @{
    code = "SMOKE-INV-WH-$suffix-$($warehouses.Count + 1)"
    name = "Smoke Inventory Warehouse $($warehouses.Count + 1)"
    active = $true
  }
  Assert-Status $createdWarehouse @(201) 'Admin can create missing smoke warehouse'
  $warehouses = @($warehouses) + @(First-Row -Response $createdWarehouse -Name 'Created smoke warehouse')
}

$fromWarehouse = @($warehouses)[0]
$toWarehouse = @($warehouses)[1]

$fromLocationResponse = Invoke-Api -Method GET -Path "/storage_locations?warehouse_id=eq.$($fromWarehouse.id)&active=eq.true&limit=1" -Token $admin.accessToken
Assert-Status $fromLocationResponse @(200, 206) 'Admin can read source storage location candidates'
$fromLocationRows = @(Convert-Rows -Content $fromLocationResponse.Content)
$fromLocationId = if ($fromLocationRows.Count -gt 0) { $fromLocationRows[0].id } else { $null }

$toLocationResponse = Invoke-Api -Method GET -Path "/storage_locations?warehouse_id=eq.$($toWarehouse.id)&active=eq.true&limit=1" -Token $admin.accessToken
Assert-Status $toLocationResponse @(200, 206) 'Admin can read destination storage location candidates'
$toLocationRows = @(Convert-Rows -Content $toLocationResponse.Content)
$toLocationId = if ($toLocationRows.Count -gt 0) { $toLocationRows[0].id } else { $null }

$adjustIn = Invoke-Api -Method POST -Path '/rpc/inventory_adjust_in' -Token $admin.accessToken -Body @{
  product_id = $product.id
  warehouse_id = $fromWarehouse.id
  storage_location_id = $fromLocationId
  quantity = 20
  reason = 'Smoke test adjustment in'
}
Assert-Status $adjustIn @(200) 'Admin can adjust inventory in'
$adjustInMovement = $adjustIn.Content | ConvertFrom-Json
if ([string]::IsNullOrWhiteSpace($adjustInMovement.movementNumber)) {
  throw 'Movement number was not generated.'
}
Write-Host 'PASS: Movement number is generated'

Assert-Status (Invoke-Api -Method POST -Path '/rpc/inventory_adjust_out' -Token $admin.accessToken -Body @{
  product_id = $product.id
  warehouse_id = $fromWarehouse.id
  storage_location_id = $fromLocationId
  quantity = 3
  reason = 'Smoke test adjustment out'
}) @(200) 'Admin can adjust inventory out'

Assert-Status (Invoke-Api -Method POST -Path '/rpc/inventory_transfer' -Token $admin.accessToken -Body @{
  product_id = $product.id
  from_warehouse_id = $fromWarehouse.id
  from_storage_location_id = $fromLocationId
  to_warehouse_id = $toWarehouse.id
  to_storage_location_id = $toLocationId
  quantity = 4
  reason = 'Smoke test transfer'
}) @(200) 'Admin can transfer inventory'

Assert-Status (Invoke-Api -Method POST -Path '/rpc/inventory_adjust_in' -Token $warehouse.accessToken -Body @{
  product_id = $product.id
  warehouse_id = $fromWarehouse.id
  storage_location_id = $fromLocationId
  quantity = 1
  reason = 'Warehouse role smoke adjustment'
}) @(200) 'Warehouse role can adjust inventory'

Assert-Status (Invoke-Api -Method POST -Path '/rpc/inventory_adjust_in' -Token $accountant.accessToken -Body @{
  product_id = $product.id
  warehouse_id = $fromWarehouse.id
  storage_location_id = $fromLocationId
  quantity = 1
  reason = 'Blocked accountant adjustment'
}) @(401, 403, 404) 'Accountant cannot adjust inventory'

Assert-Status (Invoke-Api -Method POST -Path '/rpc/inventory_adjust_in' -Token $sales.accessToken -Body @{
  product_id = $product.id
  warehouse_id = $fromWarehouse.id
  storage_location_id = $fromLocationId
  quantity = 1
  reason = 'Blocked sales adjustment'
}) @(401, 403, 404) 'Sales cannot adjust inventory'

Assert-Status (Invoke-Api -Method POST -Path '/rpc/inventory_adjust_out' -Token $admin.accessToken -Body @{
  product_id = $product.id
  warehouse_id = $fromWarehouse.id
  storage_location_id = $fromLocationId
  quantity = 999999
  reason = 'Smoke negative stock block'
}) @(400) 'Negative stock is blocked'

if ($serviceProductRows.Count -gt 0) {
  Assert-Status (Invoke-Api -Method POST -Path '/rpc/inventory_adjust_in' -Token $admin.accessToken -Body @{
    product_id = $serviceProductRows[0].id
    warehouse_id = $fromWarehouse.id
    storage_location_id = $fromLocationId
    quantity = 1
    reason = 'Blocked service product adjustment'
  }) @(400) 'Service product is rejected for inventory movement'
}

if ($fromLocationRows.Count -gt 0 -and $toLocationRows.Count -gt 0) {
  Assert-Status (Invoke-Api -Method POST -Path '/rpc/inventory_adjust_in' -Token $admin.accessToken -Body @{
    product_id = $product.id
    warehouse_id = $fromWarehouse.id
    storage_location_id = $toLocationId
    quantity = 1
    reason = 'Invalid cross-warehouse location'
  }) @(400) 'Storage location from another warehouse is rejected'
}

Assert-Status (Invoke-Api -Method PATCH -Path "/inventory_movements?id=eq.$($adjustInMovement.id)" -Token $admin.accessToken -Body @{ reason = 'Should fail' }) @(401, 403, 405) 'Inventory movements are append-only'

$balanceResponse = Invoke-Api -Method GET -Path "/inventory_balance_view?product_id=eq.$($product.id)&warehouse_id=eq.$($fromWarehouse.id)&limit=1" -Token $admin.accessToken
Assert-Status $balanceResponse @(200, 206) 'Admin can read adjusted balance'

$movementResponse = Invoke-Api -Method GET -Path "/inventory_movement_view?movement_number=eq.$($adjustInMovement.movementNumber)" -Token $admin.accessToken
Assert-Status $movementResponse @(200, 206) 'Admin can read generated movement'

$auditList = Invoke-Api -Method POST -Path '/rpc/admin_list_audit_logs' -Token $admin.accessToken -Body @{
  page_number = 1
  page_size = 100
}
Assert-Status $auditList @(200) 'Admin can list audit logs'

if ($auditList.Content -match 'Bearer eyJ|accessToken|refreshToken|jwt_secret|password_hash|refresh_token_hash|secret') {
  throw 'Audit response leaked sensitive content.'
}

$actions = @(($auditList.Content | ConvertFrom-Json).items | ForEach-Object { $_.action })
foreach ($expectedAction in @('inventory.adjustment_in', 'inventory.adjustment_out', 'inventory.transfer', 'inventory.negative_stock_blocked')) {
  if ($actions -notcontains $expectedAction) {
    throw "Expected audit action $expectedAction was not found."
  }

  Write-Host "PASS: Audit action $expectedAction exists"
}
