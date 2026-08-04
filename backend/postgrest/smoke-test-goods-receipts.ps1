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

function New-SmokePurchaseOrder {
  param([Parameter(Mandatory)] [string] $Token)

  $supplier = First-Row -Response (Invoke-Api -Method GET -Path '/suppliers?active=eq.true&limit=1' -Token $Token) -Name 'Active supplier'
  $product = First-Row -Response (Invoke-Api -Method GET -Path '/products?active=eq.true&purchasable=eq.true&track_inventory=eq.true&limit=1' -Token $Token) -Name 'Inventory tracked product'
  $warehouse = First-Row -Response (Invoke-Api -Method GET -Path '/warehouses?active=eq.true&limit=1' -Token $Token) -Name 'Active warehouse'
  $locationRows = @(Convert-Rows -Content (Invoke-Api -Method GET -Path "/storage_locations?warehouse_id=eq.$($warehouse.id)&active=eq.true&limit=1" -Token $Token).Content)
  $locationId = if ($locationRows.Count -gt 0) { $locationRows[0].id } else { $null }

  $currencyPage = Invoke-Api -Method POST -Path '/rpc/admin_list_lookup_values' -Token $Token -Body @{
    lookup_type_code = 'currency'
    active = $true
    page_number = 1
    page_size = 20
  }
  Assert-Status $currencyPage @(200) 'Admin can list currency lookups'
  $currencyData = $currencyPage.Content | ConvertFrom-Json
  $currency = @($currencyData.items)[0]

  $taxRatePage = Invoke-Api -Method POST -Path '/rpc/admin_list_lookup_values' -Token $Token -Body @{
    lookup_type_code = 'tax_rate'
    active = $true
    page_number = 1
    page_size = 20
  }
  Assert-Status $taxRatePage @(200) 'Admin can list tax-rate lookups'
  $taxRateData = $taxRatePage.Content | ConvertFrom-Json
  $taxRate = @($taxRateData.items)[0]

  $create = Invoke-Api -Method POST -Path '/rpc/create_purchase_order' -Token $Token -Body @{
    supplier_id = $supplier.id
    order_date = (Get-Date).ToString('yyyy-MM-dd')
    expected_date = (Get-Date).AddDays(5).ToString('yyyy-MM-dd')
    currency_lookup_value_id = $currency.id
    delivery_warehouse_id = $warehouse.id
    notes = 'Goods receipt smoke test'
    lines = @(
      @{
        product_id = $product.id
        quantity = 4
        unit_lookup_value_id = $product.base_unit_lookup_value_id
        unit_price = 100
        tax_rate_lookup_value_id = $taxRate.id
        description = 'Goods receipt smoke line'
      }
    )
  }
  Assert-Status $create @(200) 'Admin can create purchase order for receiving smoke'
  $order = $create.Content | ConvertFrom-Json

  Assert-Status (Invoke-Api -Method POST -Path '/rpc/submit_purchase_order' -Token $Token -Body @{ purchase_order_id = $order.id }) @(200) 'Purchase order can be submitted'
  $approved = Invoke-Api -Method POST -Path '/rpc/approve_purchase_order' -Token $Token -Body @{ purchase_order_id = $order.id }
  Assert-Status $approved @(200) 'Purchase order can be approved'

  [pscustomobject]@{
    Order = ($approved.Content | ConvertFrom-Json)
    Warehouse = $warehouse
    LocationId = $locationId
  }
}

$admin = Login-User -Email 'admin@erp.com' -Password 'admin'
$manager = Login-User -Email 'manager@erp.com' -Password 'manager'
$accountant = Login-User -Email 'accountant@erp.com' -Password 'accountant'
$warehouseUser = Login-User -Email 'warehouse@erp.com' -Password 'warehouse'
$sales = Login-User -Email 'sales@erp.com' -Password 'sales'
$viewer = Login-User -Email 'viewer@erp.com' -Password 'viewer'

foreach ($allowed in @(
  @{ Name = 'Admin'; Token = $admin.accessToken },
  @{ Name = 'Manager'; Token = $manager.accessToken },
  @{ Name = 'Accountant'; Token = $accountant.accessToken },
  @{ Name = 'Warehouse'; Token = $warehouseUser.accessToken }
)) {
  Assert-Status (Invoke-Api -Method GET -Path '/goods_receipt_view?limit=1' -Token $allowed.Token) @(200, 206) "$($allowed.Name) can list goods receipts"
}

foreach ($blocked in @(
  @{ Name = 'Sales'; Token = $sales.accessToken },
  @{ Name = 'Viewer'; Token = $viewer.accessToken }
)) {
  Assert-Status (Invoke-Api -Method GET -Path '/goods_receipt_view?limit=1' -Token $blocked.Token) @(401, 403) "$($blocked.Name) cannot list goods receipts"
}

$context = New-SmokePurchaseOrder -Token $admin.accessToken
$progressResponse = Invoke-Api -Method GET -Path "/purchase_order_line_receiving_view?purchase_order_id=eq.$($context.Order.id)" -Token $admin.accessToken
Assert-Status $progressResponse @(200, 206) 'Receiving progress is readable'
$progress = First-Row -Response $progressResponse -Name 'Receiving progress line'

$partialReceipt = Invoke-Api -Method POST -Path '/rpc/post_goods_receipt' -Token $admin.accessToken -Body @{
  purchase_order_id = $context.Order.id
  receipt_date = (Get-Date).ToString('yyyy-MM-dd')
  warehouse_id = $context.Warehouse.id
  notes = 'Partial goods receipt smoke'
  lines = @(
    @{
      purchase_order_line_id = $progress.purchase_order_line_id
      received_quantity = 2
      storage_location_id = $context.LocationId
      notes = 'Partial receive'
    }
  )
}
Assert-Status $partialReceipt @(200) 'Admin can post partial goods receipt'
$receipt = $partialReceipt.Content | ConvertFrom-Json

if ([string]::IsNullOrWhiteSpace($receipt.receiptNumber)) {
  throw 'Goods receipt number was not generated.'
}
Write-Host 'PASS: Goods receipt number is generated'

$remainingResponse = Invoke-Api -Method GET -Path "/purchase_order_line_receiving_view?purchase_order_id=eq.$($context.Order.id)" -Token $admin.accessToken
Assert-Status $remainingResponse @(200, 206) 'Remaining receiving progress is readable'
$remaining = First-Row -Response $remainingResponse -Name 'Remaining receiving progress line'

if ([decimal] $remaining.remaining_quantity -ne 2) {
  throw "Expected remaining quantity 2 after partial receipt, got $($remaining.remaining_quantity)."
}
Write-Host 'PASS: Partial receiving keeps remaining quantity'

Assert-Status (Invoke-Api -Method POST -Path '/rpc/post_goods_receipt' -Token $admin.accessToken -Body @{
  purchase_order_id = $context.Order.id
  receipt_date = (Get-Date).ToString('yyyy-MM-dd')
  warehouse_id = $context.Warehouse.id
  notes = 'Over receive smoke'
  lines = @(
    @{
      purchase_order_line_id = $progress.purchase_order_line_id
      received_quantity = 99
      storage_location_id = $context.LocationId
    }
  )
}) @(400) 'Over-receipt is blocked'

Assert-Status (Invoke-Api -Method POST -Path '/rpc/post_goods_receipt' -Token $manager.accessToken -Body @{
  purchase_order_id = $context.Order.id
  receipt_date = (Get-Date).ToString('yyyy-MM-dd')
  warehouse_id = $context.Warehouse.id
  notes = 'Final goods receipt smoke'
  lines = @(
    @{
      purchase_order_line_id = $progress.purchase_order_line_id
      received_quantity = 2
      storage_location_id = $context.LocationId
    }
  )
}) @(200) 'Manager can post goods receipt'

$accountantBlockedContext = New-SmokePurchaseOrder -Token $admin.accessToken
$accountantProgress = First-Row -Response (Invoke-Api -Method GET -Path "/purchase_order_line_receiving_view?purchase_order_id=eq.$($accountantBlockedContext.Order.id)" -Token $admin.accessToken) -Name 'Accountant blocked progress'
Assert-Status (Invoke-Api -Method POST -Path '/rpc/post_goods_receipt' -Token $accountant.accessToken -Body @{
  purchase_order_id = $accountantBlockedContext.Order.id
  receipt_date = (Get-Date).ToString('yyyy-MM-dd')
  warehouse_id = $accountantBlockedContext.Warehouse.id
  lines = @(
    @{
      purchase_order_line_id = $accountantProgress.purchase_order_line_id
      received_quantity = 1
      storage_location_id = $accountantBlockedContext.LocationId
    }
  )
}) @(401, 403, 404) 'Accountant cannot post goods receipt'

Assert-Status (Invoke-Api -Method POST -Path '/rpc/cancel_goods_receipt' -Token $manager.accessToken -Body @{
  goods_receipt_id = $receipt.id
}) @(200) 'Manager can cancel posted goods receipt'
Assert-Status (Invoke-Api -Method POST -Path '/rpc/cancel_goods_receipt' -Token $warehouseUser.accessToken -Body @{
  goods_receipt_id = $receipt.id
}) @(401, 403, 404) 'Warehouse cannot cancel goods receipt'

$auditList = Invoke-Api -Method POST -Path '/rpc/admin_list_audit_logs' -Token $admin.accessToken -Body @{
  page_number = 1
  page_size = 100
}
Assert-Status $auditList @(200) 'Admin can list goods receipt audit logs'

if ($auditList.Content -match 'Bearer eyJ|accessToken|refreshToken|jwt_secret|password_hash|refresh_token_hash|secret') {
  throw 'Audit response leaked sensitive content.'
}

foreach ($expectedAction in @('goodsReceipt.posted', 'goodsReceipt.inventoryPosted', 'goodsReceipt.cancelled', 'goodsReceipt.overReceiptBlocked')) {
  if ($auditList.Content -notmatch [regex]::Escape($expectedAction)) {
    throw "Expected audit action $expectedAction was not found."
  }

  Write-Host "PASS: Audit action $expectedAction exists"
}
