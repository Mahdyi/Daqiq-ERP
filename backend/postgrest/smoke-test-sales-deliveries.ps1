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
    $request['Body'] = ($Body | ConvertTo-Json -Depth 16)
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

$admin = Login-User -Email 'admin@erp.com' -Password 'admin'
$manager = Login-User -Email 'manager@erp.com' -Password 'manager'
$sales = Login-User -Email 'sales@erp.com' -Password 'sales'
$accountant = Login-User -Email 'accountant@erp.com' -Password 'accountant'
$warehouse = Login-User -Email 'warehouse@erp.com' -Password 'warehouse'
$viewer = Login-User -Email 'viewer@erp.com' -Password 'viewer'

foreach ($allowed in @(
  @{ Name = 'Admin'; Token = $admin.accessToken },
  @{ Name = 'Manager'; Token = $manager.accessToken },
  @{ Name = 'Sales'; Token = $sales.accessToken },
  @{ Name = 'Accountant'; Token = $accountant.accessToken },
  @{ Name = 'Warehouse'; Token = $warehouse.accessToken }
)) {
  Assert-Status (Invoke-Api -Method GET -Path '/sales_delivery_view?limit=1' -Token $allowed.Token) @(200, 206) "$($allowed.Name) can list sales deliveries"
}

Assert-Status (Invoke-Api -Method GET -Path '/sales_delivery_view?limit=1' -Token $viewer.accessToken) @(401, 403) 'Viewer cannot list sales deliveries'

$customer = First-Row -Response (Invoke-Api -Method GET -Path '/customers?active=eq.true&limit=1' -Token $admin.accessToken) -Name 'Active customer'
$product = First-Row -Response (Invoke-Api -Method GET -Path '/products?active=eq.true&sellable=eq.true&track_inventory=eq.true&limit=1' -Token $admin.accessToken) -Name 'Inventory-tracked sellable product'
$warehouseRow = First-Row -Response (Invoke-Api -Method GET -Path '/warehouses?active=eq.true&limit=1' -Token $admin.accessToken) -Name 'Active warehouse'
$locationRows = @(Convert-Rows -Content (Invoke-Api -Method GET -Path "/storage_locations?warehouse_id=eq.$($warehouseRow.id)&active=eq.true&limit=1" -Token $admin.accessToken).Content)
$storageLocationId = $null

if ($locationRows.Count -gt 0) {
  $storageLocationId = $locationRows[0].id
}

$otherWarehouseResponse = Invoke-Api -Method POST -Path '/warehouses' -Token $admin.accessToken -Body @{
  code = "SD-SMOKE-WH-$([guid]::NewGuid().ToString('N').Substring(0, 8))"
  name = 'Sales Delivery Other Warehouse'
  active = $true
} -ExtraHeaders @{ Prefer = 'return=representation' }
Assert-Status $otherWarehouseResponse @(201) 'Admin can create other warehouse for delivery validation'
$otherWarehouse = First-Row -Response $otherWarehouseResponse -Name 'Other smoke warehouse'
$otherLocationResponse = Invoke-Api -Method POST -Path '/storage_locations' -Token $admin.accessToken -Body @{
  warehouse_id = $otherWarehouse.id
  code = "SD-SMOKE-LOC-$([guid]::NewGuid().ToString('N').Substring(0, 8))"
  name = 'Sales Delivery Other Location'
  active = $true
} -ExtraHeaders @{ Prefer = 'return=representation' }
Assert-Status $otherLocationResponse @(201) 'Admin can create other location for delivery validation'
$otherLocation = First-Row -Response $otherLocationResponse -Name 'Other smoke location'

$currencyPage = Invoke-Api -Method POST -Path '/rpc/admin_list_lookup_values' -Token $admin.accessToken -Body @{
  lookup_type_code = 'currency'
  active = $true
  page_number = 1
  page_size = 20
}
Assert-Status $currencyPage @(200) 'Admin can list currency lookups'
$currency = @((($currencyPage.Content | ConvertFrom-Json).items))[0]

$taxRatePage = Invoke-Api -Method POST -Path '/rpc/admin_list_lookup_values' -Token $admin.accessToken -Body @{
  lookup_type_code = 'tax_rate'
  active = $true
  page_number = 1
  page_size = 20
}
Assert-Status $taxRatePage @(200) 'Admin can list tax-rate lookups'
$taxRate = @((($taxRatePage.Content | ConvertFrom-Json).items))[0]

Assert-Status (Invoke-Api -Method POST -Path '/rpc/inventory_adjust_in' -Token $admin.accessToken -Body @{
  product_id = $product.id
  warehouse_id = $warehouseRow.id
  storage_location_id = $storageLocationId
  quantity = 10
  reason = 'Sales delivery smoke stock'
}) @(200) 'Admin can seed stock for delivery smoke test'

$createOrder = Invoke-Api -Method POST -Path '/rpc/create_sales_order' -Token $admin.accessToken -Body @{
  customer_id = $customer.id
  order_date = (Get-Date).ToString('yyyy-MM-dd')
  requested_delivery_date = (Get-Date).AddDays(3).ToString('yyyy-MM-dd')
  currency_lookup_value_id = $currency.id
  delivery_warehouse_id = $warehouseRow.id
  notes = 'Sales delivery smoke order'
  lines = @(
    @{
      product_id = $product.id
      quantity = 4
      unit_lookup_value_id = $product.base_unit_lookup_value_id
      unit_price = 50
      tax_rate_lookup_value_id = $taxRate.id
      description = 'Sales delivery smoke line'
    }
  )
}
Assert-Status $createOrder @(200) 'Admin can create sales order for delivery'
$salesOrder = $createOrder.Content | ConvertFrom-Json

Assert-Status (Invoke-Api -Method POST -Path '/rpc/submit_sales_order' -Token $admin.accessToken -Body @{ sales_order_id = $salesOrder.id }) @(200) 'Admin can submit sales order for delivery'
Assert-Status (Invoke-Api -Method POST -Path '/rpc/confirm_sales_order' -Token $manager.accessToken -Body @{ sales_order_id = $salesOrder.id }) @(200) 'Manager can confirm sales order for delivery'

$orderLine = First-Row -Response (Invoke-Api -Method GET -Path "/sales_order_line_view?sales_order_id=eq.$($salesOrder.id)&limit=1" -Token $admin.accessToken) -Name 'Sales order delivery line'

$postBody = @{
  sales_order_id = $salesOrder.id
  delivery_date = (Get-Date).ToString('yyyy-MM-dd')
  warehouse_id = $warehouseRow.id
  notes = 'Partial delivery smoke test'
  lines = @(
    @{
      salesOrderLineId = $orderLine.id
      shippedQuantity = 2
      storageLocationId = $storageLocationId
      notes = 'First partial shipment'
    }
  )
}

Assert-Status (Invoke-Api -Method POST -Path '/rpc/post_sales_delivery' -Token $sales.accessToken -Body $postBody) @(401, 403, 404) 'Sales user cannot post delivery'
Assert-Status (Invoke-Api -Method POST -Path '/rpc/post_sales_delivery' -Token $warehouse.accessToken -Body @{
  sales_order_id = $salesOrder.id
  delivery_date = (Get-Date).ToString('yyyy-MM-dd')
  warehouse_id = $warehouseRow.id
  notes = 'Invalid storage location smoke test'
  lines = @(
    @{
      salesOrderLineId = $orderLine.id
      shippedQuantity = 1
      storageLocationId = $otherLocation.id
    }
  )
}) @(400) 'Storage location from another warehouse is rejected'
$deliveryResponse = Invoke-Api -Method POST -Path '/rpc/post_sales_delivery' -Token $warehouse.accessToken -Body $postBody
Assert-Status $deliveryResponse @(200) 'Warehouse can post delivery'
$delivery = $deliveryResponse.Content | ConvertFrom-Json

if ([string]::IsNullOrWhiteSpace($delivery.deliveryNumber)) {
  throw 'Delivery number was not generated.'
}
Write-Host 'PASS: Delivery number is generated by backend'

$deliveryLine = First-Row -Response (Invoke-Api -Method GET -Path "/sales_delivery_line_view?sales_delivery_id=eq.$($delivery.id)" -Token $admin.accessToken) -Name 'Sales delivery line'

if ([string]::IsNullOrWhiteSpace($deliveryLine.inventory_movement_id)) {
  throw 'Delivery line does not reference an inventory movement.'
}
Write-Host 'PASS: Delivery line references inventory movement'

$progress = First-Row -Response (Invoke-Api -Method GET -Path "/sales_order_line_delivery_view?sales_order_id=eq.$($salesOrder.id)" -Token $admin.accessToken) -Name 'Sales order delivery progress'
if ([decimal] $progress.shipped_quantity -lt 2 -or [decimal] $progress.remaining_quantity -ne 2) {
  throw "Unexpected delivery progress. Body: $($progress | ConvertTo-Json -Depth 8)"
}
Write-Host 'PASS: Delivery progress shows partial shipment'

$overDeliveryBody = @{
  sales_order_id = $salesOrder.id
  delivery_date = (Get-Date).ToString('yyyy-MM-dd')
  warehouse_id = $warehouseRow.id
  notes = 'Over delivery smoke test'
  lines = @(
    @{
      salesOrderLineId = $orderLine.id
      shippedQuantity = 10
      storageLocationId = $storageLocationId
    }
  )
}
Assert-Status (Invoke-Api -Method POST -Path '/rpc/post_sales_delivery' -Token $admin.accessToken -Body $overDeliveryBody) @(400) 'Over-delivery is blocked'

$noStockProductResponse = Invoke-Api -Method POST -Path '/products' -Token $admin.accessToken -Body @{
  sku = "SD-SMOKE-NOSTOCK-$([guid]::NewGuid().ToString('N').Substring(0, 8))"
  name = 'Sales Delivery No Stock Product'
  product_type = 'finished_good'
  base_unit_lookup_value_id = $product.base_unit_lookup_value_id
  track_inventory = $true
  purchasable = $true
  sellable = $true
  active = $true
} -ExtraHeaders @{ Prefer = 'return=representation' }
Assert-Status $noStockProductResponse @(201) 'Admin can create no-stock product for delivery validation'
$noStockProduct = First-Row -Response $noStockProductResponse -Name 'No-stock smoke product'

$negativeStockOrderResponse = Invoke-Api -Method POST -Path '/rpc/create_sales_order' -Token $admin.accessToken -Body @{
  customer_id = $customer.id
  order_date = (Get-Date).ToString('yyyy-MM-dd')
  requested_delivery_date = (Get-Date).AddDays(4).ToString('yyyy-MM-dd')
  currency_lookup_value_id = $currency.id
  delivery_warehouse_id = $warehouseRow.id
  notes = 'Negative stock delivery smoke order'
  lines = @(
    @{
      product_id = $noStockProduct.id
      quantity = 20
      unit_lookup_value_id = $noStockProduct.base_unit_lookup_value_id
      unit_price = 50
      tax_rate_lookup_value_id = $taxRate.id
      description = 'Negative stock delivery smoke line'
    }
  )
}
Assert-Status $negativeStockOrderResponse @(200) 'Admin can create negative-stock smoke sales order'
$negativeStockOrder = $negativeStockOrderResponse.Content | ConvertFrom-Json
Assert-Status (Invoke-Api -Method POST -Path '/rpc/submit_sales_order' -Token $admin.accessToken -Body @{ sales_order_id = $negativeStockOrder.id }) @(200) 'Admin can submit negative-stock smoke order'
Assert-Status (Invoke-Api -Method POST -Path '/rpc/confirm_sales_order' -Token $manager.accessToken -Body @{ sales_order_id = $negativeStockOrder.id }) @(200) 'Manager can confirm negative-stock smoke order'
$negativeStockLine = First-Row -Response (Invoke-Api -Method GET -Path "/sales_order_line_view?sales_order_id=eq.$($negativeStockOrder.id)&limit=1" -Token $admin.accessToken) -Name 'Negative-stock sales order line'
Assert-Status (Invoke-Api -Method POST -Path '/rpc/post_sales_delivery' -Token $warehouse.accessToken -Body @{
  sales_order_id = $negativeStockOrder.id
  delivery_date = (Get-Date).ToString('yyyy-MM-dd')
  warehouse_id = $warehouseRow.id
  notes = 'Negative stock blocked smoke test'
  lines = @(
    @{
      salesOrderLineId = $negativeStockLine.id
      shippedQuantity = 20
      storageLocationId = $storageLocationId
    }
  )
}) @(400) 'Negative stock is blocked when stock is insufficient'

Assert-Status (Invoke-Api -Method POST -Path '/rpc/cancel_sales_delivery' -Token $accountant.accessToken -Body @{ sales_delivery_id = $delivery.id }) @(401, 403, 404) 'Accountant cannot cancel delivery'
Assert-Status (Invoke-Api -Method POST -Path '/rpc/cancel_sales_delivery' -Token $manager.accessToken -Body @{ sales_delivery_id = $delivery.id }) @(200) 'Manager can cancel delivery'

$auditList = Invoke-Api -Method POST -Path '/rpc/admin_list_audit_logs' -Token $admin.accessToken -Body @{
  page_number = 1
  page_size = 100
}
Assert-Status $auditList @(200) 'Admin can list delivery audit logs'

foreach ($expectedAction in @('salesDelivery.posted', 'salesDelivery.inventoryPosted', 'salesDelivery.overDeliveryBlocked', 'salesDelivery.negativeStockBlocked', 'salesDelivery.cancelled')) {
  if ($auditList.Content -notmatch [regex]::Escape($expectedAction)) {
    throw "Expected audit action $expectedAction was not found."
  }

  Write-Host "PASS: Audit action $expectedAction exists"
}

if ($auditList.Content -match 'Bearer eyJ|accessToken|refreshToken|jwt_secret|password_hash|refresh_token_hash|secret') {
  throw 'Audit response leaked sensitive content.'
}

Write-Host 'Sales delivery smoke test completed.'
