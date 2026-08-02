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
  foreach ($key in $ExtraHeaders.Keys) { $headers[$key] = $ExtraHeaders[$key] }
  if (-not [string]::IsNullOrWhiteSpace($Token)) { $headers['Authorization'] = "Bearer $Token" }

  $request = @{ Method = $Method; Uri = "$BaseUrl$Path"; Headers = $headers; UseBasicParsing = $true }
  if ($null -ne $Body) {
    $request['ContentType'] = 'application/json'
    $request['Body'] = ($Body | ConvertTo-Json -Depth 10)
  }

  try {
    Invoke-WebRequest @request
  } catch [System.Net.WebException] {
    if ($null -eq $_.Exception.Response) { throw }
    $response = $_.Exception.Response
    $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
    [pscustomobject]@{ StatusCode = [int] $response.StatusCode; Content = $reader.ReadToEnd(); Headers = $response.Headers }
  }
}

function Assert-Status {
  param([Parameter(Mandatory)] $Response, [Parameter(Mandatory)] [int[]] $AllowedStatus, [Parameter(Mandatory)] [string] $Name)
  if ($AllowedStatus -notcontains [int] $Response.StatusCode) {
    throw "$Name failed. Expected status $($AllowedStatus -join ', '), got $($Response.StatusCode). Body: $($Response.Content)"
  }
  Write-Host "PASS: $Name"
}

function Login-User {
  param([Parameter(Mandatory)] [string] $Email, [Parameter(Mandatory)] [string] $Password)
  $response = Invoke-Api -Method POST -Path '/rpc/login' -Body @{ email = $Email; password = $Password }
  Assert-Status $response @(200) "Login succeeds for $Email"
  $response.Content | ConvertFrom-Json
}

function Get-LookupId {
  param([Parameter(Mandatory)] [string] $Token, [Parameter(Mandatory)] [string] $TypeCode, [Parameter(Mandatory)] [string] $Code)
  $response = Invoke-Api -Method POST -Path '/rpc/admin_list_lookup_values' -Token $Token -Body @{ lookup_type_code = $TypeCode; page_number = 1; page_size = 100 }
  Assert-Status $response @(200) "Lookup $TypeCode can be read"
  $payload = $response.Content | ConvertFrom-Json
  $match = @($payload.items | Where-Object { $_.code -eq $Code })[0]
  if ($null -eq $match) { throw "Lookup value $TypeCode/$Code was not found." }
  $match.id
}

$admin = Login-User -Email 'admin@erp.com' -Password 'admin'
$manager = Login-User -Email 'manager@erp.com' -Password 'manager'
$accountant = Login-User -Email 'accountant@erp.com' -Password 'accountant'
$warehouse = Login-User -Email 'warehouse@erp.com' -Password 'warehouse'
$sales = Login-User -Email 'sales@erp.com' -Password 'sales'
$viewer = Login-User -Email 'viewer@erp.com' -Password 'viewer'

$warehouseTypeId = Get-LookupId -Token $admin.accessToken -TypeCode 'warehouse_type' -Code 'main'
$locationTypeId = Get-LookupId -Token $admin.accessToken -TypeCode 'storage_location_type' -Code 'storage'
$wrongLookupId = Get-LookupId -Token $admin.accessToken -TypeCode 'currency' -Code 'IRR'

foreach ($allowed in @(
  @{ Name = 'Admin'; Token = $admin.accessToken },
  @{ Name = 'Manager'; Token = $manager.accessToken },
  @{ Name = 'Accountant'; Token = $accountant.accessToken },
  @{ Name = 'Warehouse'; Token = $warehouse.accessToken }
)) {
  Assert-Status (Invoke-Api -Method GET -Path '/warehouses?limit=1' -Token $allowed.Token) @(200, 206) "$($allowed.Name) can list warehouses"
  Assert-Status (Invoke-Api -Method GET -Path '/storage_locations?limit=1' -Token $allowed.Token) @(200, 206) "$($allowed.Name) can list storage locations"
}

foreach ($blocked in @(
  @{ Name = 'Sales'; Token = $sales.accessToken },
  @{ Name = 'Viewer'; Token = $viewer.accessToken }
)) {
  Assert-Status (Invoke-Api -Method GET -Path '/warehouses?limit=1' -Token $blocked.Token) @(401, 403) "$($blocked.Name) cannot list warehouses"
  Assert-Status (Invoke-Api -Method GET -Path '/storage_locations?limit=1' -Token $blocked.Token) @(401, 403) "$($blocked.Name) cannot list storage locations"
}

$suffix = [Guid]::NewGuid().ToString('N').Substring(0, 10)
$warehouseCode = "SMOKE-WH-$suffix"

$createdWarehouse = Invoke-Api -Method POST -Path '/warehouses' -Token $admin.accessToken -ExtraHeaders @{ Prefer = 'return=representation' } -Body @{
  code = $warehouseCode; name = 'Smoke Warehouse'; description = 'Smoke warehouse'; warehouse_type_lookup_value_id = $warehouseTypeId; address = 'Smoke address'; responsible_person = 'Smoke user'; phone = '021-22222222'; email = "smoke-wh-$suffix@example.test"; active = $true
}
Assert-Status $createdWarehouse @(201) 'Admin can create warehouse'
$warehouseRow = @($createdWarehouse.Content | ConvertFrom-Json)[0]

Assert-Status (Invoke-Api -Method POST -Path '/warehouses' -Token $admin.accessToken -Body @{ code = $warehouseCode; name = 'Duplicate Warehouse'; active = $true }) @(400, 409) 'Duplicate warehouse code is rejected'
Assert-Status (Invoke-Api -Method POST -Path '/warehouses' -Token $admin.accessToken -Body @{ code = "SMOKE-BAD-WH-$suffix"; name = 'Bad Warehouse'; warehouse_type_lookup_value_id = $wrongLookupId; active = $true }) @(400) 'Invalid warehouse type lookup is rejected'
Assert-Status (Invoke-Api -Method PATCH -Path "/warehouses?id=eq.$($warehouseRow.id)" -Token $admin.accessToken -ExtraHeaders @{ Prefer = 'return=representation' } -Body @{ responsible_person = 'Updated smoke user' }) @(200) 'Admin can update warehouse'

$locA = Invoke-Api -Method POST -Path '/storage_locations' -Token $admin.accessToken -ExtraHeaders @{ Prefer = 'return=representation' } -Body @{
  warehouse_id = $warehouseRow.id; code = 'BIN-A'; name = 'Bin A'; description = $null; location_type_lookup_value_id = $locationTypeId; parent_location_id = $null; active = $true
}
Assert-Status $locA @(201) 'Admin can create storage location'
$locARow = @($locA.Content | ConvertFrom-Json)[0]

Assert-Status (Invoke-Api -Method POST -Path '/storage_locations' -Token $admin.accessToken -Body @{ warehouse_id = $warehouseRow.id; code = 'BIN-A'; name = 'Duplicate Bin'; active = $true }) @(400, 409) 'Duplicate location code in same warehouse is rejected'

$otherWarehouse = Invoke-Api -Method POST -Path '/warehouses' -Token $admin.accessToken -ExtraHeaders @{ Prefer = 'return=representation' } -Body @{ code = "SMOKE-WH2-$suffix"; name = 'Second Smoke Warehouse'; active = $true }
Assert-Status $otherWarehouse @(201) 'Admin can create second warehouse'
$otherWarehouseRow = @($otherWarehouse.Content | ConvertFrom-Json)[0]
Assert-Status (Invoke-Api -Method POST -Path '/storage_locations' -Token $admin.accessToken -Body @{ warehouse_id = $otherWarehouseRow.id; code = 'BIN-A'; name = 'Same code different warehouse'; active = $true }) @(201) 'Same location code in different warehouses is allowed'

Assert-Status (Invoke-Api -Method POST -Path '/storage_locations' -Token $admin.accessToken -Body @{ warehouse_id = $warehouseRow.id; code = "BAD-TYPE-$suffix"; name = 'Bad Type'; location_type_lookup_value_id = $wrongLookupId; active = $true }) @(400) 'Invalid location type lookup is rejected'
Assert-Status (Invoke-Api -Method POST -Path '/storage_locations' -Token $admin.accessToken -Body @{ warehouse_id = $otherWarehouseRow.id; code = "BAD-PARENT-$suffix"; name = 'Bad Parent'; parent_location_id = $locARow.id; active = $true }) @(400) 'Parent from different warehouse is rejected'

$managerWarehouse = Invoke-Api -Method POST -Path '/warehouses' -Token $manager.accessToken -ExtraHeaders @{ Prefer = 'return=representation' } -Body @{ code = "SMOKE-MGR-WH-$suffix"; name = 'Manager Warehouse'; active = $true }
Assert-Status $managerWarehouse @(201) 'Manager can create warehouse'
$managerWarehouseRow = @($managerWarehouse.Content | ConvertFrom-Json)[0]
$warehouseRoleWarehouse = Invoke-Api -Method POST -Path '/warehouses' -Token $warehouse.accessToken -ExtraHeaders @{ Prefer = 'return=representation' } -Body @{ code = "SMOKE-WR-WH-$suffix"; name = 'Warehouse Role Warehouse'; active = $true }
Assert-Status $warehouseRoleWarehouse @(201) 'Warehouse role can create warehouse'
$warehouseRoleWarehouseRow = @($warehouseRoleWarehouse.Content | ConvertFrom-Json)[0]
Assert-Status (Invoke-Api -Method PATCH -Path "/warehouses?id=eq.$($warehouseRow.id)" -Token $accountant.accessToken -Body @{ name = 'Accountant Mutated Warehouse' }) @(401, 403) 'Accountant cannot mutate warehouse'
Assert-Status (Invoke-Api -Method DELETE -Path "/warehouses?id=eq.$($warehouseRow.id)" -Token $manager.accessToken) @(401, 403) 'Manager cannot delete warehouse'

Assert-Status (Invoke-Api -Method DELETE -Path "/storage_locations?warehouse_id=eq.$($otherWarehouseRow.id)" -Token $admin.accessToken -ExtraHeaders @{ Prefer = 'return=representation' }) @(200, 204) 'Admin can delete second warehouse locations'
Assert-Status (Invoke-Api -Method DELETE -Path "/storage_locations?id=eq.$($locARow.id)" -Token $admin.accessToken -ExtraHeaders @{ Prefer = 'return=representation' }) @(200, 204) 'Admin can delete storage location'
Assert-Status (Invoke-Api -Method DELETE -Path "/warehouses?id=eq.$($otherWarehouseRow.id)" -Token $admin.accessToken -ExtraHeaders @{ Prefer = 'return=representation' }) @(200, 204) 'Admin can delete second warehouse'
Assert-Status (Invoke-Api -Method DELETE -Path "/warehouses?id=eq.$($warehouseRow.id)" -Token $admin.accessToken -ExtraHeaders @{ Prefer = 'return=representation' }) @(200, 204) 'Admin can delete warehouse'
Assert-Status (Invoke-Api -Method DELETE -Path "/warehouses?id=eq.$($managerWarehouseRow.id)" -Token $admin.accessToken -ExtraHeaders @{ Prefer = 'return=representation' }) @(200, 204) 'Admin can clean up manager warehouse'
Assert-Status (Invoke-Api -Method DELETE -Path "/warehouses?id=eq.$($warehouseRoleWarehouseRow.id)" -Token $admin.accessToken -ExtraHeaders @{ Prefer = 'return=representation' }) @(200, 204) 'Admin can clean up warehouse-role warehouse'

$auditList = Invoke-Api -Method POST -Path '/rpc/admin_list_audit_logs' -Token $admin.accessToken -Body @{ page_number = 1; page_size = 100 }
Assert-Status $auditList @(200) 'Admin can list audit logs'
if ($auditList.Content -match 'Bearer eyJ|accessToken|refreshToken|jwt_secret|password_hash|refresh_token_hash|secret') { throw 'Audit response leaked sensitive content.' }
$actions = @(($auditList.Content | ConvertFrom-Json).items | ForEach-Object { $_.action })
foreach ($expectedAction in @('warehouse.created', 'warehouse.updated', 'warehouse.deleted', 'storageLocation.created', 'storageLocation.deleted')) {
  if ($actions -notcontains $expectedAction) { throw "Expected audit action $expectedAction was not found." }
  Write-Host "PASS: Audit action $expectedAction exists"
}
