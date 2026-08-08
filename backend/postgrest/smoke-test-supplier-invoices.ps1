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
  Assert-Status $response @(200) "Can list $Code lookups"
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
  @{ Name = 'Accountant'; Token = $accountant.accessToken },
  @{ Name = 'Warehouse'; Token = $warehouse.accessToken }
)) {
  Assert-Status (Invoke-Api -Method GET -Path '/supplier_invoice_view?limit=1' -Token $allowed.Token) @(200, 206) "$($allowed.Name) can list supplier invoices"
}

Assert-Status (Invoke-Api -Method GET -Path '/supplier_invoice_view?limit=1' -Token $sales.accessToken) @(401, 403) 'Sales cannot list supplier invoices'
Assert-Status (Invoke-Api -Method GET -Path '/supplier_invoice_view?limit=1' -Token $viewer.accessToken) @(401, 403) 'Viewer cannot list supplier invoices'

$supplier = First-Row -Response (Invoke-Api -Method GET -Path '/suppliers?active=eq.true&limit=1' -Token $admin.accessToken) -Name 'Active supplier'
$product = First-Row -Response (Invoke-Api -Method GET -Path '/products?active=eq.true&purchasable=eq.true&track_inventory=eq.true&limit=1' -Token $admin.accessToken) -Name 'Inventory-tracked purchasable product'
$warehouseRow = First-Row -Response (Invoke-Api -Method GET -Path '/warehouses?active=eq.true&limit=1' -Token $admin.accessToken) -Name 'Active warehouse'
$currency = First-LookupValue -Code 'currency' -PreferredCode 'IRR' -Token $admin.accessToken
$taxRate = First-LookupValue -Code 'tax_rate' -PreferredCode 'standard' -Token $admin.accessToken
$smokeSupplierInvoiceNumber = "SUP-SMOKE-$([guid]::NewGuid().ToString('N').Substring(0, 10))"

$createOrder = Invoke-Api -Method POST -Path '/rpc/create_purchase_order' -Token $admin.accessToken -Body @{
  supplier_id = $supplier.id
  order_date = (Get-Date).ToString('yyyy-MM-dd')
  expected_date = (Get-Date).AddDays(3).ToString('yyyy-MM-dd')
  currency_lookup_value_id = $currency.id
  delivery_warehouse_id = $warehouseRow.id
  notes = 'Supplier invoice smoke purchase order'
  lines = @(
    @{
      product_id = $product.id
      quantity = 3
      unit_lookup_value_id = $product.base_unit_lookup_value_id
      unit_price = 100
      tax_rate_lookup_value_id = $taxRate.id
      description = 'Supplier invoice smoke line'
    }
  )
}
Assert-Status $createOrder @(200) 'Admin can create purchase order for supplier invoice'
$purchaseOrder = $createOrder.Content | ConvertFrom-Json

Assert-Status (Invoke-Api -Method POST -Path '/rpc/submit_purchase_order' -Token $admin.accessToken -Body @{ purchase_order_id = $purchaseOrder.id }) @(200) 'Admin can submit purchase order for supplier invoice'
Assert-Status (Invoke-Api -Method POST -Path '/rpc/approve_purchase_order' -Token $manager.accessToken -Body @{ purchase_order_id = $purchaseOrder.id }) @(200) 'Manager can approve purchase order for supplier invoice'

$orderLine = First-Row -Response (Invoke-Api -Method GET -Path "/purchase_order_line_view?purchase_order_id=eq.$($purchaseOrder.id)&limit=1" -Token $admin.accessToken) -Name 'Purchase order invoice line'
$receiptResponse = Invoke-Api -Method POST -Path '/rpc/post_goods_receipt' -Token $warehouse.accessToken -Body @{
  purchase_order_id = $purchaseOrder.id
  receipt_date = (Get-Date).ToString('yyyy-MM-dd')
  warehouse_id = $warehouseRow.id
  notes = 'Supplier invoice smoke receipt'
  lines = @(
    @{
      purchase_order_line_id = $orderLine.id
      received_quantity = 2
      storage_location_id = $null
      notes = 'Invoice smoke receipt line'
    }
  )
}
Assert-Status $receiptResponse @(200) 'Warehouse can post goods receipt for supplier invoice'
$receipt = $receiptResponse.Content | ConvertFrom-Json
$receiptLine = First-Row -Response (Invoke-Api -Method GET -Path "/goods_receipt_line_view?goods_receipt_id=eq.$($receipt.id)&limit=1" -Token $admin.accessToken) -Name 'Goods receipt line for invoice'
$balanceBeforeInvoice = First-Row -Response (Invoke-Api -Method GET -Path "/inventory_balance_view?product_id=eq.$($product.id)&warehouse_id=eq.$($warehouseRow.id)&storage_location_id=is.null&limit=1" -Token $admin.accessToken) -Name 'Inventory balance before supplier invoice'

Assert-Status (Invoke-Api -Method POST -Path '/rpc/create_supplier_invoice_from_receipt' -Token $warehouse.accessToken -Body @{
  goods_receipt_id = $receipt.id
  invoice_date = (Get-Date).ToString('yyyy-MM-dd')
  lines = @(
    @{
      goodsReceiptLineId = $receiptLine.id
      quantity = 1
      unitPrice = 100
      taxRateLookupValueId = $taxRate.id
    }
  )
}) @(401, 403, 404) 'Warehouse cannot create supplier invoice'

$invoiceResponse = Invoke-Api -Method POST -Path '/rpc/create_supplier_invoice_from_receipt' -Token $accountant.accessToken -Body @{
  goods_receipt_id = $receipt.id
  supplier_invoice_number = $smokeSupplierInvoiceNumber
  invoice_date = (Get-Date).ToString('yyyy-MM-dd')
  due_date = (Get-Date).AddDays(30).ToString('yyyy-MM-dd')
  notes = 'Supplier invoice smoke invoice'
  lines = @(
    @{
      goodsReceiptLineId = $receiptLine.id
      quantity = 1
      unitPrice = 100
      taxRateLookupValueId = $taxRate.id
      description = 'Smoke supplier invoice line'
    }
  )
}
Assert-Status $invoiceResponse @(200) 'Accountant can create supplier invoice draft'
$invoice = $invoiceResponse.Content | ConvertFrom-Json

if ([string]::IsNullOrWhiteSpace($invoice.invoiceNumber)) {
  throw 'Supplier invoice internal number was not generated.'
}
Write-Host 'PASS: Supplier invoice number is generated by backend'

if ([decimal] $invoice.subtotalAmount -ne 100) {
  throw "Unexpected supplier invoice subtotal: $($invoice.subtotalAmount)"
}
Write-Host 'PASS: Supplier invoice totals are calculated by backend'

Assert-Status (Invoke-Api -Method POST -Path '/rpc/post_supplier_invoice' -Token $sales.accessToken -Body @{ supplier_invoice_id = $invoice.id }) @(401, 403, 404) 'Sales cannot post supplier invoice'
Assert-Status (Invoke-Api -Method POST -Path '/rpc/post_supplier_invoice' -Token $accountant.accessToken -Body @{ supplier_invoice_id = $invoice.id }) @(200) 'Accountant can post supplier invoice'
Assert-Status (Invoke-Api -Method POST -Path '/rpc/cancel_supplier_invoice' -Token $accountant.accessToken -Body @{ supplier_invoice_id = $invoice.id }) @(200) 'Accountant can cancel supplier invoice'

$progressAfterCancel = First-Row -Response (Invoke-Api -Method GET -Path "/goods_receipt_line_supplier_invoicing_view?goods_receipt_id=eq.$($receipt.id)&limit=1" -Token $admin.accessToken) -Name 'Supplier invoice progress after cancellation'
if ([decimal] $progressAfterCancel.invoiced_quantity -ne 0) {
  throw 'Cancelled supplier invoice still counts toward invoicing progress.'
}
Write-Host 'PASS: Cancelled supplier invoices do not count toward progress'

Assert-Status (Invoke-Api -Method POST -Path '/rpc/create_supplier_invoice_from_receipt' -Token $manager.accessToken -Body @{
  goods_receipt_id = $receipt.id
  invoice_date = (Get-Date).ToString('yyyy-MM-dd')
  lines = @(
    @{
      goodsReceiptLineId = $receiptLine.id
      quantity = 3
      unitPrice = 100
      taxRateLookupValueId = $taxRate.id
    }
  )
}) @(400) 'Over-invoicing is blocked'

Assert-Status (Invoke-Api -Method POST -Path '/rpc/create_supplier_invoice_from_receipt' -Token $manager.accessToken -Body @{
  goods_receipt_id = $receipt.id
  supplier_invoice_number = $smokeSupplierInvoiceNumber
  invoice_date = (Get-Date).ToString('yyyy-MM-dd')
  lines = @(
    @{
      goodsReceiptLineId = $receiptLine.id
      quantity = 1
      unitPrice = 100
      taxRateLookupValueId = $taxRate.id
    }
  )
}) @(400, 409) 'Duplicate supplier invoice number is rejected per supplier'

$balanceAfter = First-Row -Response (Invoke-Api -Method GET -Path "/inventory_balance_view?product_id=eq.$($product.id)&warehouse_id=eq.$($warehouseRow.id)&storage_location_id=is.null&limit=1" -Token $admin.accessToken) -Name 'Inventory balance after supplier invoice'
if ([decimal] $balanceBeforeInvoice.quantity_on_hand -ne [decimal] $balanceAfter.quantity_on_hand) {
  throw 'Supplier invoice changed inventory balance. Supplier invoices must not post inventory.'
}
Write-Host 'PASS: Supplier invoice does not change inventory balance'

Assert-Status (Invoke-Api -Method POST -Path '/rpc/cancel_goods_receipt' -Token $admin.accessToken -Body @{ goods_receipt_id = $receipt.id }) @(200) 'Admin can cancel receipt after invoice cancellation'
Assert-Status (Invoke-Api -Method POST -Path '/rpc/create_supplier_invoice_from_receipt' -Token $accountant.accessToken -Body @{
  goods_receipt_id = $receipt.id
  invoice_date = (Get-Date).ToString('yyyy-MM-dd')
  lines = @(
    @{
      goodsReceiptLineId = $receiptLine.id
      quantity = 1
      unitPrice = 100
      taxRateLookupValueId = $taxRate.id
    }
  )
}) @(400) 'Cancelled goods receipt cannot be invoiced'

$auditResponse = Invoke-Api -Method POST -Path '/rpc/admin_list_audit_logs' -Token $admin.accessToken -Body @{
  search = 'supplierInvoice'
  page_number = 1
  page_size = 20
}
Assert-Status $auditResponse @(200) 'Admin can list supplier invoice audit logs'
$auditItems = @(($auditResponse.Content | ConvertFrom-Json).items)
if ($auditItems.Count -lt 1) {
  throw 'No supplier invoice audit events were found.'
}
Write-Host 'PASS: Supplier invoice audit events are created'
