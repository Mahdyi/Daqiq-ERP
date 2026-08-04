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
    $request['Body'] = ($Body | ConvertTo-Json -Depth 12)
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
  Assert-Status (Invoke-Api -Method GET -Path '/purchase_order_view?limit=1' -Token $allowed.Token) @(200, 206) "$($allowed.Name) can list purchase orders"
}

foreach ($blocked in @(
  @{ Name = 'Sales'; Token = $sales.accessToken },
  @{ Name = 'Viewer'; Token = $viewer.accessToken }
)) {
  Assert-Status (Invoke-Api -Method GET -Path '/purchase_order_view?limit=1' -Token $blocked.Token) @(401, 403) "$($blocked.Name) cannot list purchase orders"
}

$supplier = First-Row -Response (Invoke-Api -Method GET -Path '/suppliers?active=eq.true&limit=1' -Token $admin.accessToken) -Name 'Active supplier'
$product = First-Row -Response (Invoke-Api -Method GET -Path '/products?active=eq.true&purchasable=eq.true&limit=1' -Token $admin.accessToken) -Name 'Purchasable product'
$currencyPage = Invoke-Api -Method POST -Path '/rpc/admin_list_lookup_values' -Token $admin.accessToken -Body @{
  lookup_type_code = 'currency'
  active = $true
  page_number = 1
  page_size = 20
}
Assert-Status $currencyPage @(200) 'Admin can list currency lookups'
$currency = @($currencyPage.Content | ConvertFrom-Json).items[0]

$taxRatePage = Invoke-Api -Method POST -Path '/rpc/admin_list_lookup_values' -Token $admin.accessToken -Body @{
  lookup_type_code = 'tax_rate'
  active = $true
  page_number = 1
  page_size = 20
}
Assert-Status $taxRatePage @(200) 'Admin can list tax-rate lookups'
$taxRate = @($taxRatePage.Content | ConvertFrom-Json).items[0]
$warehouseResponse = Invoke-Api -Method GET -Path '/warehouses?active=eq.true&limit=1' -Token $admin.accessToken
Assert-Status $warehouseResponse @(200, 206) 'Admin can query active warehouse'
$warehouseRows = @(Convert-Rows -Content $warehouseResponse.Content)
$warehouseId = if ($warehouseRows.Count -gt 0) { $warehouseRows[0].id } else { $null }

$createBody = @{
  supplier_id = $supplier.id
  order_date = (Get-Date).ToString('yyyy-MM-dd')
  expected_date = (Get-Date).AddDays(7).ToString('yyyy-MM-dd')
  currency_lookup_value_id = $currency.id
  delivery_warehouse_id = $warehouseId
  notes = 'Purchase order smoke test'
  lines = @(
    @{
      product_id = $product.id
      quantity = 2
      unit_lookup_value_id = $product.base_unit_lookup_value_id
      unit_price = 100
      tax_rate_lookup_value_id = $taxRate.id
      description = 'Smoke test line'
    }
  )
}

$created = Invoke-Api -Method POST -Path '/rpc/create_purchase_order' -Token $admin.accessToken -Body $createBody
Assert-Status $created @(200) 'Admin can create purchase order'
$createdOrder = $created.Content | ConvertFrom-Json

if ([string]::IsNullOrWhiteSpace($createdOrder.orderNumber)) {
  throw 'Purchase order number was not generated.'
}
Write-Host 'PASS: Purchase order number is generated'

$updateBody = @{
  purchase_order_id = $createdOrder.id
  supplier_id = $supplier.id
  order_date = (Get-Date).ToString('yyyy-MM-dd')
  expected_date = (Get-Date).AddDays(10).ToString('yyyy-MM-dd')
  currency_lookup_value_id = $currency.id
  delivery_warehouse_id = $warehouseId
  notes = 'Updated purchase order smoke test'
  lines = @(
    @{
      product_id = $product.id
      quantity = 3
      unit_lookup_value_id = $product.base_unit_lookup_value_id
      unit_price = 75
      tax_rate_lookup_value_id = $taxRate.id
      description = 'Updated smoke test line'
    }
  )
}
$updated = Invoke-Api -Method POST -Path '/rpc/update_purchase_order' -Token $admin.accessToken -Body $updateBody
Assert-Status $updated @(200) 'Admin can update draft purchase order'

Assert-Status (Invoke-Api -Method POST -Path '/rpc/submit_purchase_order' -Token $admin.accessToken -Body @{ purchase_order_id = $createdOrder.id }) @(200) 'Admin can submit purchase order'
Assert-Status (Invoke-Api -Method POST -Path '/rpc/approve_purchase_order' -Token $admin.accessToken -Body @{ purchase_order_id = $createdOrder.id }) @(200) 'Admin can approve purchase order'
Assert-Status (Invoke-Api -Method POST -Path '/rpc/update_purchase_order' -Token $admin.accessToken -Body $updateBody) @(400) 'Approved purchase order cannot be edited as draft'
Assert-Status (Invoke-Api -Method POST -Path '/rpc/cancel_purchase_order' -Token $admin.accessToken -Body @{ purchase_order_id = $createdOrder.id }) @(200) 'Admin can cancel approved purchase order'

Assert-Status (Invoke-Api -Method POST -Path '/rpc/create_purchase_order' -Token $accountant.accessToken -Body $createBody) @(401, 403, 404) 'Accountant cannot create purchase order'
Assert-Status (Invoke-Api -Method POST -Path '/rpc/create_purchase_order' -Token $warehouse.accessToken -Body $createBody) @(401, 403, 404) 'Warehouse cannot create purchase order'
Assert-Status (Invoke-Api -Method POST -Path '/purchase_orders' -Token $admin.accessToken -Body @{
  order_number = 'DIRECT-SHOULD-FAIL'
  supplier_id = $supplier.id
  status_lookup_value_id = $createdOrder.statusLookupValueId
  order_date = (Get-Date).ToString('yyyy-MM-dd')
}) @(401, 403) 'Admin cannot directly insert purchase orders outside RPCs'

$auditList = Invoke-Api -Method POST -Path '/rpc/admin_list_audit_logs' -Token $admin.accessToken -Body @{
  page_number = 1
  page_size = 100
}
Assert-Status $auditList @(200) 'Admin can list purchase-order audit logs'

if ($auditList.Content -match 'Bearer eyJ|accessToken|refreshToken|jwt_secret|password_hash|refresh_token_hash|secret') {
  throw 'Audit response leaked sensitive content.'
}

foreach ($expectedAction in @('purchaseOrder.created', 'purchaseOrder.updated', 'purchaseOrder.submitted', 'purchaseOrder.approved', 'purchaseOrder.cancelled')) {
  if ($auditList.Content -notmatch [regex]::Escape($expectedAction)) {
    throw "Expected audit action $expectedAction was not found."
  }

  Write-Host "PASS: Audit action $expectedAction exists"
}
