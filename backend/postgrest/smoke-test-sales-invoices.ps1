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
    $request['Body'] = ($Body | ConvertTo-Json -Depth 20)
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

function First-LookupValue {
  param(
    [Parameter(Mandatory)] [string] $Code,
    [string] $PreferredCode,
    [Parameter(Mandatory)] [string] $Token
  )

  $response = Invoke-Api -Method POST -Path '/rpc/admin_list_lookup_values' -Token $Token -Body @{
    lookup_type_code = $Code
    active = $true
    page_number = 1
    page_size = 50
  }
  Assert-Status $response @(200) "Admin can list $Code lookups"
  $items = @(($response.Content | ConvertFrom-Json).items)

  if ($items.Count -eq 0) {
    throw "Lookup type $Code has no active values."
  }

  if (-not [string]::IsNullOrWhiteSpace($PreferredCode)) {
    $preferred = @($items | Where-Object { $_.code -eq $PreferredCode })
    if ($preferred.Count -gt 0) {
      return $preferred[0]
    }
  }

  $items[0]
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
  Assert-Status (Invoke-Api -Method GET -Path '/sales_invoice_view?limit=1' -Token $allowed.Token) @(200, 206) "$($allowed.Name) can list sales invoices"
}

Assert-Status (Invoke-Api -Method GET -Path '/sales_invoice_view?limit=1' -Token $viewer.accessToken) @(401, 403) 'Viewer cannot list sales invoices'

$customer = First-Row -Response (Invoke-Api -Method GET -Path '/customers?active=eq.true&limit=1' -Token $admin.accessToken) -Name 'Active customer'
$product = First-Row -Response (Invoke-Api -Method GET -Path '/products?active=eq.true&sellable=eq.true&track_inventory=eq.true&limit=1' -Token $admin.accessToken) -Name 'Inventory-tracked sellable product'
$warehouseRow = First-Row -Response (Invoke-Api -Method GET -Path '/warehouses?active=eq.true&limit=1' -Token $admin.accessToken) -Name 'Active warehouse'
$currency = First-LookupValue -Code 'currency' -PreferredCode 'IRR' -Token $admin.accessToken
$taxRate = First-LookupValue -Code 'tax_rate' -PreferredCode 'standard' -Token $admin.accessToken

Assert-Status (Invoke-Api -Method POST -Path '/rpc/inventory_adjust_in' -Token $admin.accessToken -Body @{
  product_id = $product.id
  warehouse_id = $warehouseRow.id
  storage_location_id = $null
  quantity = 10
  reason = 'Sales invoice smoke stock'
}) @(200) 'Admin can seed stock for invoice smoke test'

$createOrder = Invoke-Api -Method POST -Path '/rpc/create_sales_order' -Token $admin.accessToken -Body @{
  customer_id = $customer.id
  order_date = (Get-Date).ToString('yyyy-MM-dd')
  requested_delivery_date = (Get-Date).AddDays(3).ToString('yyyy-MM-dd')
  currency_lookup_value_id = $currency.id
  delivery_warehouse_id = $warehouseRow.id
  notes = 'Sales invoice smoke order'
  lines = @(
    @{
      product_id = $product.id
      quantity = 3
      unit_lookup_value_id = $product.base_unit_lookup_value_id
      unit_price = 100
      tax_rate_lookup_value_id = $taxRate.id
      description = 'Sales invoice smoke line'
    }
  )
}
Assert-Status $createOrder @(200) 'Admin can create sales order for invoice'
$salesOrder = $createOrder.Content | ConvertFrom-Json

Assert-Status (Invoke-Api -Method POST -Path '/rpc/submit_sales_order' -Token $admin.accessToken -Body @{ sales_order_id = $salesOrder.id }) @(200) 'Admin can submit sales order for invoice'
Assert-Status (Invoke-Api -Method POST -Path '/rpc/confirm_sales_order' -Token $manager.accessToken -Body @{ sales_order_id = $salesOrder.id }) @(200) 'Manager can confirm sales order for invoice'

$orderLine = First-Row -Response (Invoke-Api -Method GET -Path "/sales_order_line_view?sales_order_id=eq.$($salesOrder.id)&limit=1" -Token $admin.accessToken) -Name 'Sales order invoice line'
$deliveryResponse = Invoke-Api -Method POST -Path '/rpc/post_sales_delivery' -Token $warehouse.accessToken -Body @{
  sales_order_id = $salesOrder.id
  delivery_date = (Get-Date).ToString('yyyy-MM-dd')
  warehouse_id = $warehouseRow.id
  notes = 'Sales invoice smoke delivery'
  lines = @(
    @{
      salesOrderLineId = $orderLine.id
      shippedQuantity = 2
      storageLocationId = $null
      notes = 'Invoice smoke shipment'
    }
  )
}
Assert-Status $deliveryResponse @(200) 'Warehouse can post delivery for invoice'
$delivery = $deliveryResponse.Content | ConvertFrom-Json
$deliveryLine = First-Row -Response (Invoke-Api -Method GET -Path "/sales_delivery_line_view?sales_delivery_id=eq.$($delivery.id)&limit=1" -Token $admin.accessToken) -Name 'Delivery line for invoice'
$balanceBeforeInvoice = First-Row -Response (Invoke-Api -Method GET -Path "/inventory_balance_view?product_id=eq.$($product.id)&warehouse_id=eq.$($warehouseRow.id)&storage_location_id=is.null&limit=1" -Token $admin.accessToken) -Name 'Inventory balance before invoice'

Assert-Status (Invoke-Api -Method POST -Path '/rpc/create_sales_invoice_from_delivery' -Token $warehouse.accessToken -Body @{
  sales_delivery_id = $delivery.id
  invoice_date = (Get-Date).ToString('yyyy-MM-dd')
  due_date = (Get-Date).AddDays(30).ToString('yyyy-MM-dd')
  lines = @(
    @{
      salesDeliveryLineId = $deliveryLine.id
      quantity = 1
      unitPrice = 100
      taxRateLookupValueId = $taxRate.id
    }
  )
}) @(401, 403, 404) 'Warehouse cannot create sales invoice'

$invoiceResponse = Invoke-Api -Method POST -Path '/rpc/create_sales_invoice_from_delivery' -Token $sales.accessToken -Body @{
  sales_delivery_id = $delivery.id
  invoice_date = (Get-Date).ToString('yyyy-MM-dd')
  due_date = (Get-Date).AddDays(30).ToString('yyyy-MM-dd')
  notes = 'Sales invoice smoke invoice'
  lines = @(
    @{
      salesDeliveryLineId = $deliveryLine.id
      quantity = 1
      unitPrice = 100
      taxRateLookupValueId = $taxRate.id
      description = 'Smoke invoice line'
    }
  )
}
Assert-Status $invoiceResponse @(200) 'Sales can create sales invoice draft'
$invoice = $invoiceResponse.Content | ConvertFrom-Json

if ([string]::IsNullOrWhiteSpace($invoice.invoiceNumber)) {
  throw 'Invoice number was not generated.'
}
Write-Host 'PASS: Invoice number is generated by backend'

if ([decimal] $invoice.subtotalAmount -ne 100) {
  throw "Unexpected invoice subtotal: $($invoice.subtotalAmount)"
}
Write-Host 'PASS: Invoice totals are calculated by backend'

Assert-Status (Invoke-Api -Method POST -Path '/rpc/issue_sales_invoice' -Token $sales.accessToken -Body @{ sales_invoice_id = $invoice.id }) @(401, 403, 404) 'Sales cannot issue sales invoice'
Assert-Status (Invoke-Api -Method POST -Path '/rpc/issue_sales_invoice' -Token $accountant.accessToken -Body @{ sales_invoice_id = $invoice.id }) @(200) 'Accountant can issue sales invoice'
Assert-Status (Invoke-Api -Method POST -Path '/rpc/cancel_sales_invoice' -Token $accountant.accessToken -Body @{ sales_invoice_id = $invoice.id }) @(200) 'Accountant can cancel sales invoice'

$progressAfterCancel = First-Row -Response (Invoke-Api -Method GET -Path "/sales_delivery_line_invoicing_view?sales_delivery_id=eq.$($delivery.id)&limit=1" -Token $admin.accessToken) -Name 'Invoice progress after cancellation'
if ([decimal] $progressAfterCancel.invoiced_quantity -ne 0) {
  throw 'Cancelled invoice still counts toward invoicing progress.'
}
Write-Host 'PASS: Cancelled invoices do not count toward progress'

Assert-Status (Invoke-Api -Method POST -Path '/rpc/create_sales_invoice_from_delivery' -Token $manager.accessToken -Body @{
  sales_delivery_id = $delivery.id
  invoice_date = (Get-Date).ToString('yyyy-MM-dd')
  lines = @(
    @{
      salesDeliveryLineId = $deliveryLine.id
      quantity = 3
      unitPrice = 100
      taxRateLookupValueId = $taxRate.id
    }
  )
}) @(400) 'Over-invoicing is blocked'

$balanceAfter = First-Row -Response (Invoke-Api -Method GET -Path "/inventory_balance_view?product_id=eq.$($product.id)&warehouse_id=eq.$($warehouseRow.id)&storage_location_id=is.null&limit=1" -Token $admin.accessToken) -Name 'Inventory balance after invoice'
if ([decimal] $balanceBeforeInvoice.quantity_on_hand -ne [decimal] $balanceAfter.quantity_on_hand) {
  throw 'Invoice changed inventory balance. Invoices must not post inventory.'
}
Write-Host 'PASS: Sales invoice does not change inventory balance'

$auditResponse = Invoke-Api -Method POST -Path '/rpc/admin_list_audit_logs' -Token $admin.accessToken -Body @{
  search = 'salesInvoice'
  page_number = 1
  page_size = 20
}
Assert-Status $auditResponse @(200) 'Admin can list invoice audit logs'
$auditItems = @(($auditResponse.Content | ConvertFrom-Json).items)
if ($auditItems.Count -lt 1) {
  throw 'No sales invoice audit events were found.'
}
Write-Host 'PASS: Sales invoice audit events are created'
