Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$baseUrl = if ($env:PGRST_BASE_URL) { $env:PGRST_BASE_URL } elseif ($env:POSTGREST_BASE_URL) { $env:POSTGREST_BASE_URL } else { 'http://127.0.0.1:3000' }
$baseUrl = $baseUrl.TrimEnd('/')

Write-Host "Payments smoke test base URL: $baseUrl"

function Invoke-PostgrestJson {
  param(
    [Parameter(Mandatory = $true)][string] $Method,
    [Parameter(Mandatory = $true)][string] $Path,
    [string] $Token,
    [object] $Body
  )

  $headers = @{
    'Accept' = 'application/json'
    'Content-Type' = 'application/json'
  }

  if (-not [string]::IsNullOrWhiteSpace($Token)) {
    $headers['Authorization'] = "Bearer $Token"
  }

  $request = @{
    Method = $Method
    Uri = "$baseUrl$Path"
    Headers = $headers
    ErrorAction = 'Stop'
    UseBasicParsing = $true
  }

  if ($PSBoundParameters.ContainsKey('Body')) {
    $request['Body'] = ($Body | ConvertTo-Json -Depth 20)
  }

  try {
    $response = Invoke-WebRequest @request
    $content = [string] $response.Content
    $json = if ([string]::IsNullOrWhiteSpace($content)) { $null } else { $content | ConvertFrom-Json }

    return [pscustomobject]@{
      StatusCode = [int] $response.StatusCode
      Json = $json
      Body = $content
      Headers = $response.Headers
    }
  } catch {
    $webResponse = $_.Exception.Response
    if ($null -eq $webResponse) {
      throw
    }

    $statusCode = [int] $webResponse.StatusCode
    $stream = $webResponse.GetResponseStream()
    $reader = [System.IO.StreamReader]::new($stream)
    $content = $reader.ReadToEnd()
    $reader.Dispose()
    $json = if ([string]::IsNullOrWhiteSpace($content)) { $null } else { $content | ConvertFrom-Json }

    return [pscustomobject]@{
      StatusCode = $statusCode
      Json = $json
      Body = $content
      Headers = $webResponse.Headers
    }
  }
}

function Assert-Status {
  param(
    [Parameter(Mandatory = $true)] $Response,
    [Parameter(Mandatory = $true)][int[]] $AllowedStatus,
    [Parameter(Mandatory = $true)][string] $Name
  )

  if ($AllowedStatus -notcontains $Response.StatusCode) {
    throw "$Name failed. Expected status $($AllowedStatus -join ', '), got $($Response.StatusCode). Body: $($Response.Body)"
  }

  Write-Host "PASS: $Name"
}

function Get-SmokeToken {
  param(
    [Parameter(Mandatory = $true)][string] $Role
  )

  $tokenName = "ERP_$($Role.ToUpperInvariant())_TOKEN"
  $emailName = "SMOKE_$($Role.ToUpperInvariant())_EMAIL"
  $passwordName = "SMOKE_$($Role.ToUpperInvariant())_PASSWORD"
  $existingToken = [Environment]::GetEnvironmentVariable($tokenName)

  if (-not [string]::IsNullOrWhiteSpace($existingToken)) {
    return $existingToken
  }

  $email = [Environment]::GetEnvironmentVariable($emailName)
  $password = [Environment]::GetEnvironmentVariable($passwordName)

  if ([string]::IsNullOrWhiteSpace($email) -or [string]::IsNullOrWhiteSpace($password)) {
    throw "Missing credentials for $Role. Set $emailName and $passwordName locally, or provide $tokenName. Never commit tokens or passwords."
  }

  $response = Invoke-PostgrestJson -Method POST -Path '/rpc/login' -Body @{
    email = $email
    password = $password
  }
  Assert-Status $response @(200) "Login succeeds for $Role"

  if ([string]::IsNullOrWhiteSpace([string] $response.Json.accessToken)) {
    throw "Login for $Role did not return an access token."
  }

  return [string] $response.Json.accessToken
}

function First-Item {
  param(
    [Parameter(Mandatory = $true)] $Response,
    [Parameter(Mandatory = $true)][string] $Name,
    [string[]] $RequiredProperties = @()
  )

  if (@(200, 206) -notcontains $Response.StatusCode) {
    throw "$Name query failed. Expected status 200 or 206, got $($Response.StatusCode). Body: $($Response.Body)"
  }

  $items = @($Response.Json)

  if ($null -eq $Response.Json -or $items.Count -lt 1) {
    throw "$Name was not found. Check that required master-data seed records exist."
  }

  $item = $items[0]
  foreach ($property in $RequiredProperties) {
    if ($null -eq $item.PSObject.Properties[$property]) {
      throw "$Name did not include expected property '$property'. Body: $($Response.Body)"
    }
  }

  return $item
}

function First-LookupValue {
  param(
    [Parameter(Mandatory = $true)][string] $Code,
    [string] $PreferredCode,
    [Parameter(Mandatory = $true)][string] $Token
  )

  $response = Invoke-PostgrestJson -Method POST -Path '/rpc/admin_list_lookup_values' -Token $Token -Body @{
    lookup_type_code = $Code
    active = $true
    page_number = 1
    page_size = 50
  }
  Assert-Status $response @(200) "Admin can list $Code lookups"
  $items = @($response.Json.items)

  if ($items.Count -eq 0) {
    throw "Lookup type $Code has no active values."
  }

  if (-not [string]::IsNullOrWhiteSpace($PreferredCode)) {
    $preferred = @($items | Where-Object { $_.code -eq $PreferredCode })
    if ($preferred.Count -gt 0) {
      return $preferred[0]
    }
  }

  return $items[0]
}

function Assert-JournalBalanced {
  param(
    [Parameter(Mandatory = $true)][string] $JournalNumber,
    [Parameter(Mandatory = $true)][string] $Token,
    [Parameter(Mandatory = $true)][string] $Name
  )

  $ledger = Invoke-PostgrestJson -Method GET -Path "/general_ledger_view?journal_number=eq.$JournalNumber&select=debit_amount,credit_amount" -Token $Token
  Assert-Status $ledger @(200, 206) "$Name journal is visible in general ledger"

  $debit = 0
  $credit = 0
  foreach ($line in @($ledger.Json)) {
    $debit += [decimal] $line.debit_amount
    $credit += [decimal] $line.credit_amount
  }

  if ($debit -ne $credit -or $debit -le 0) {
    throw "$Name journal is not balanced."
  }

  Write-Host "PASS: $Name journal is balanced"
}

function New-SalesInvoicePaymentFixture {
  param(
    [Parameter(Mandatory = $true)][string] $AdminToken,
    [Parameter(Mandatory = $true)][string] $ManagerToken,
    [Parameter(Mandatory = $true)][string] $SalesToken,
    [Parameter(Mandatory = $true)][string] $WarehouseToken,
    [Parameter(Mandatory = $true)][string] $AccountantToken
  )

  Write-Host 'Preparing fresh issued sales invoice fixture for payment...'
  $customer = First-Item `
    (Invoke-PostgrestJson -Method GET -Path '/customers?active=eq.true&limit=1' -Token $AdminToken) `
    'Active customer for payment fixture' `
    @('id')
  $product = First-Item `
    (Invoke-PostgrestJson -Method GET -Path '/products?active=eq.true&sellable=eq.true&track_inventory=eq.true&limit=1' -Token $AdminToken) `
    'Inventory-tracked sellable product for payment fixture' `
    @('id', 'base_unit_lookup_value_id')
  $warehouse = First-Item `
    (Invoke-PostgrestJson -Method GET -Path '/warehouses?active=eq.true&limit=1' -Token $AdminToken) `
    'Active warehouse for payment fixture' `
    @('id')
  $currency = First-LookupValue -Code 'currency' -PreferredCode 'IRR' -Token $AdminToken
  $taxRate = First-LookupValue -Code 'tax_rate' -PreferredCode 'standard' -Token $AdminToken
  $today = (Get-Date).ToString('yyyy-MM-dd')

  Assert-Status (Invoke-PostgrestJson -Method POST -Path '/rpc/inventory_adjust_in' -Token $AdminToken -Body @{
    product_id = $product.id
    warehouse_id = $warehouse.id
    storage_location_id = $null
    quantity = 10
    reason = 'Payment smoke sales invoice fixture stock'
  }) @(200) 'Admin can seed stock for payment sales invoice fixture'

  $orderResponse = Invoke-PostgrestJson -Method POST -Path '/rpc/create_sales_order' -Token $AdminToken -Body @{
    customer_id = $customer.id
    order_date = $today
    requested_delivery_date = (Get-Date).AddDays(3).ToString('yyyy-MM-dd')
    currency_lookup_value_id = $currency.id
    delivery_warehouse_id = $warehouse.id
    notes = 'Payment smoke sales order'
    lines = @(
      @{
        product_id = $product.id
        quantity = 2
        unit_lookup_value_id = $product.base_unit_lookup_value_id
        unit_price = 100
        tax_rate_lookup_value_id = $taxRate.id
        description = 'Payment smoke sales line'
      }
    )
  }
  Assert-Status $orderResponse @(200) 'Admin can create sales order for payment fixture'
  $salesOrder = $orderResponse.Json

  Assert-Status (Invoke-PostgrestJson -Method POST -Path '/rpc/submit_sales_order' -Token $AdminToken -Body @{ sales_order_id = $salesOrder.id }) @(200) 'Admin can submit sales order for payment fixture'
  Assert-Status (Invoke-PostgrestJson -Method POST -Path '/rpc/confirm_sales_order' -Token $ManagerToken -Body @{ sales_order_id = $salesOrder.id }) @(200) 'Manager can confirm sales order for payment fixture'

  $orderLine = First-Item `
    (Invoke-PostgrestJson -Method GET -Path "/sales_order_line_view?sales_order_id=eq.$($salesOrder.id)&limit=1" -Token $AdminToken) `
    'Sales order line for payment fixture' `
    @('id')
  $deliveryResponse = Invoke-PostgrestJson -Method POST -Path '/rpc/post_sales_delivery' -Token $WarehouseToken -Body @{
    sales_order_id = $salesOrder.id
    delivery_date = $today
    warehouse_id = $warehouse.id
    notes = 'Payment smoke sales delivery'
    lines = @(
      @{
        salesOrderLineId = $orderLine.id
        shippedQuantity = 1
        storageLocationId = $null
        notes = 'Payment smoke shipment'
      }
    )
  }
  Assert-Status $deliveryResponse @(200) 'Warehouse can post sales delivery for payment fixture'
  $delivery = $deliveryResponse.Json
  $deliveryLine = First-Item `
    (Invoke-PostgrestJson -Method GET -Path "/sales_delivery_line_view?sales_delivery_id=eq.$($delivery.id)&limit=1" -Token $AdminToken) `
    'Sales delivery line for payment fixture' `
    @('id')

  $invoiceResponse = Invoke-PostgrestJson -Method POST -Path '/rpc/create_sales_invoice_from_delivery' -Token $SalesToken -Body @{
    sales_delivery_id = $delivery.id
    invoice_date = $today
    due_date = (Get-Date).AddDays(30).ToString('yyyy-MM-dd')
    notes = 'Payment smoke sales invoice'
    lines = @(
      @{
        salesDeliveryLineId = $deliveryLine.id
        quantity = 1
        unitPrice = 100
        taxRateLookupValueId = $taxRate.id
        description = 'Payment smoke sales invoice line'
      }
    )
  }
  Assert-Status $invoiceResponse @(200) 'Sales can create sales invoice for payment fixture'
  $invoice = $invoiceResponse.Json

  Assert-Status (Invoke-PostgrestJson -Method POST -Path '/rpc/issue_sales_invoice' -Token $AccountantToken -Body @{ sales_invoice_id = $invoice.id }) @(200) 'Accountant can issue sales invoice for payment fixture'
  Assert-Status (Invoke-PostgrestJson -Method POST -Path '/rpc/post_sales_invoice_accounting' -Token $AccountantToken -Body @{ sales_invoice_id = $invoice.id }) @(200) 'Accountant can post sales invoice accounting for payment fixture'
  $settlement = First-Item `
    (Invoke-PostgrestJson -Method GET -Path "/sales_invoice_settlement_view?sales_invoice_id=eq.$($invoice.id)&select=sales_invoice_id,customer_id,invoice_number,remaining_amount,settlement_status&limit=1" -Token $AccountantToken) `
    'Fresh unpaid sales invoice settlement row' `
    @('sales_invoice_id', 'customer_id', 'invoice_number', 'remaining_amount', 'settlement_status')

  if ($settlement.settlement_status -ne 'unpaid') {
    throw "Fresh sales invoice fixture is not unpaid. Status=$($settlement.settlement_status)"
  }

  Write-Host "PASS: Fresh sales invoice fixture prepared: $($settlement.invoice_number)"
  return $settlement
}

function New-SupplierInvoicePaymentFixture {
  param(
    [Parameter(Mandatory = $true)][string] $AdminToken,
    [Parameter(Mandatory = $true)][string] $ManagerToken,
    [Parameter(Mandatory = $true)][string] $WarehouseToken,
    [Parameter(Mandatory = $true)][string] $AccountantToken
  )

  Write-Host 'Preparing fresh posted supplier invoice fixture for payment...'
  $supplier = First-Item `
    (Invoke-PostgrestJson -Method GET -Path '/suppliers?active=eq.true&limit=1' -Token $AdminToken) `
    'Active supplier for payment fixture' `
    @('id')
  $product = First-Item `
    (Invoke-PostgrestJson -Method GET -Path '/products?active=eq.true&purchasable=eq.true&track_inventory=eq.true&limit=1' -Token $AdminToken) `
    'Inventory-tracked purchasable product for payment fixture' `
    @('id', 'base_unit_lookup_value_id')
  $warehouse = First-Item `
    (Invoke-PostgrestJson -Method GET -Path '/warehouses?active=eq.true&limit=1' -Token $AdminToken) `
    'Active warehouse for payment fixture' `
    @('id')
  $currency = First-LookupValue -Code 'currency' -PreferredCode 'IRR' -Token $AdminToken
  $taxRate = First-LookupValue -Code 'tax_rate' -PreferredCode 'standard' -Token $AdminToken
  $today = (Get-Date).ToString('yyyy-MM-dd')
  $supplierInvoiceNumber = "PAY-SMOKE-SUP-$((Get-Date).ToString('yyyyMMddHHmmssfff'))"

  $orderResponse = Invoke-PostgrestJson -Method POST -Path '/rpc/create_purchase_order' -Token $AdminToken -Body @{
    supplier_id = $supplier.id
    order_date = $today
    expected_date = (Get-Date).AddDays(3).ToString('yyyy-MM-dd')
    currency_lookup_value_id = $currency.id
    delivery_warehouse_id = $warehouse.id
    notes = 'Payment smoke purchase order'
    lines = @(
      @{
        product_id = $product.id
        quantity = 2
        unit_lookup_value_id = $product.base_unit_lookup_value_id
        unit_price = 100
        tax_rate_lookup_value_id = $taxRate.id
        description = 'Payment smoke purchase line'
      }
    )
  }
  Assert-Status $orderResponse @(200) 'Admin can create purchase order for payment fixture'
  $purchaseOrder = $orderResponse.Json

  Assert-Status (Invoke-PostgrestJson -Method POST -Path '/rpc/submit_purchase_order' -Token $AdminToken -Body @{ purchase_order_id = $purchaseOrder.id }) @(200) 'Admin can submit purchase order for payment fixture'
  Assert-Status (Invoke-PostgrestJson -Method POST -Path '/rpc/approve_purchase_order' -Token $ManagerToken -Body @{ purchase_order_id = $purchaseOrder.id }) @(200) 'Manager can approve purchase order for payment fixture'

  $orderLine = First-Item `
    (Invoke-PostgrestJson -Method GET -Path "/purchase_order_line_view?purchase_order_id=eq.$($purchaseOrder.id)&limit=1" -Token $AdminToken) `
    'Purchase order line for payment fixture' `
    @('id')
  $receiptResponse = Invoke-PostgrestJson -Method POST -Path '/rpc/post_goods_receipt' -Token $WarehouseToken -Body @{
    purchase_order_id = $purchaseOrder.id
    receipt_date = $today
    warehouse_id = $warehouse.id
    notes = 'Payment smoke goods receipt'
    lines = @(
      @{
        purchase_order_line_id = $orderLine.id
        received_quantity = 1
        storage_location_id = $null
        notes = 'Payment smoke receipt line'
      }
    )
  }
  Assert-Status $receiptResponse @(200) 'Warehouse can post goods receipt for payment fixture'
  $receipt = $receiptResponse.Json
  $receiptLine = First-Item `
    (Invoke-PostgrestJson -Method GET -Path "/goods_receipt_line_view?goods_receipt_id=eq.$($receipt.id)&limit=1" -Token $AdminToken) `
    'Goods receipt line for payment fixture' `
    @('id')

  $invoiceResponse = Invoke-PostgrestJson -Method POST -Path '/rpc/create_supplier_invoice_from_receipt' -Token $AccountantToken -Body @{
    goods_receipt_id = $receipt.id
    supplier_invoice_number = $supplierInvoiceNumber
    invoice_date = $today
    due_date = (Get-Date).AddDays(30).ToString('yyyy-MM-dd')
    notes = 'Payment smoke supplier invoice'
    lines = @(
      @{
        goodsReceiptLineId = $receiptLine.id
        quantity = 1
        unitPrice = 100
        taxRateLookupValueId = $taxRate.id
        description = 'Payment smoke supplier invoice line'
      }
    )
  }
  Assert-Status $invoiceResponse @(200) 'Accountant can create supplier invoice for payment fixture'
  $invoice = $invoiceResponse.Json

  Assert-Status (Invoke-PostgrestJson -Method POST -Path '/rpc/post_supplier_invoice' -Token $AccountantToken -Body @{ supplier_invoice_id = $invoice.id }) @(200) 'Accountant can post supplier invoice for payment fixture'
  Assert-Status (Invoke-PostgrestJson -Method POST -Path '/rpc/post_supplier_invoice_accounting' -Token $AccountantToken -Body @{ supplier_invoice_id = $invoice.id }) @(200) 'Accountant can post supplier invoice accounting for payment fixture'
  $settlement = First-Item `
    (Invoke-PostgrestJson -Method GET -Path "/supplier_invoice_settlement_view?supplier_invoice_id=eq.$($invoice.id)&select=supplier_invoice_id,supplier_id,invoice_number,remaining_amount,settlement_status&limit=1" -Token $AccountantToken) `
    'Fresh unpaid supplier invoice settlement row' `
    @('supplier_invoice_id', 'supplier_id', 'invoice_number', 'remaining_amount', 'settlement_status')

  if ($settlement.settlement_status -ne 'unpaid') {
    throw "Fresh supplier invoice fixture is not unpaid. Status=$($settlement.settlement_status)"
  }

  Write-Host "PASS: Fresh supplier invoice fixture prepared: $($settlement.invoice_number)"
  return $settlement
}

$adminToken = Get-SmokeToken -Role 'admin'
$accountantToken = Get-SmokeToken -Role 'accountant'
$managerToken = Get-SmokeToken -Role 'manager'
$warehouseToken = Get-SmokeToken -Role 'warehouse'
$salesToken = Get-SmokeToken -Role 'sales'
$viewerToken = Get-SmokeToken -Role 'viewer'

Write-Host 'Checking cash/bank account access...'
$cashAccount = First-Item `
  (Invoke-PostgrestJson -Method GET -Path '/cash_bank_account_view?active=eq.true&select=id,account_code,account_name&limit=1' -Token $accountantToken) `
  'Active cash/bank account' `
  @('id', 'account_code', 'account_name')
Write-Host "PASS: Cash/bank account available: $($cashAccount.account_code)"

Write-Host 'Checking role boundaries...'
Assert-Status (Invoke-PostgrestJson -Method GET -Path '/customer_receipt_view?limit=1' -Token $managerToken) @(200, 206) 'Manager can read payments'
Assert-Status (Invoke-PostgrestJson -Method POST -Path '/rpc/post_customer_receipt' -Token $managerToken -Body @{}) @(401, 403, 404) 'Manager cannot post customer receipt'
Assert-Status (Invoke-PostgrestJson -Method GET -Path '/customer_receipt_view?limit=1' -Token $warehouseToken) @(401, 403) 'Warehouse cannot read payments'
Assert-Status (Invoke-PostgrestJson -Method GET -Path '/customer_receipt_view?limit=1' -Token $salesToken) @(401, 403) 'Sales cannot read payments'
Assert-Status (Invoke-PostgrestJson -Method GET -Path '/customer_receipt_view?limit=1' -Token $viewerToken) @(401, 403) 'Viewer cannot read payments'

Write-Host 'Posting customer receipt...'
$salesSettlement = New-SalesInvoicePaymentFixture `
  -AdminToken $adminToken `
  -ManagerToken $managerToken `
  -SalesToken $salesToken `
  -WarehouseToken $warehouseToken `
  -AccountantToken $accountantToken
$inventoryBefore = Invoke-PostgrestJson -Method GET -Path '/inventory_movement_view?select=id&limit=1' -Token $adminToken
$receiptAmount = [decimal] $salesSettlement.remaining_amount
$receipt = Invoke-PostgrestJson -Method POST -Path '/rpc/post_customer_receipt' -Token $accountantToken -Body @{
  customer_id = $salesSettlement.customer_id
  cash_bank_account_id = $cashAccount.id
  receipt_date = (Get-Date).ToString('yyyy-MM-dd')
  amount = $receiptAmount
  allocations = @(@{
    salesInvoiceId = $salesSettlement.sales_invoice_id
    allocatedAmount = $receiptAmount
  })
}
Assert-Status $receipt @(200) 'Accountant can post customer receipt'
if ([string]::IsNullOrWhiteSpace([string] $receipt.Json.receiptNumber)) { throw 'Receipt number was not generated by backend.' }
Write-Host "PASS: Receipt number generated by backend: $($receipt.Json.receiptNumber)"
Assert-JournalBalanced -JournalNumber $receipt.Json.journalNumber -Token $accountantToken -Name 'Customer receipt'
$salesAfter = Invoke-PostgrestJson -Method GET -Path "/sales_invoice_settlement_view?sales_invoice_id=eq.$($salesSettlement.sales_invoice_id)&select=remaining_amount,settlement_status&limit=1" -Token $accountantToken
Assert-Status $salesAfter @(200, 206) 'Sales invoice settlement can be checked after receipt'
$salesAfterItem = First-Item $salesAfter 'Sales invoice settlement row after receipt' @('remaining_amount', 'settlement_status')
if ([decimal] $salesAfterItem.remaining_amount -ge $receiptAmount) { throw 'Customer receipt did not reduce sales invoice remaining amount.' }
Write-Host 'PASS: Customer receipt reduced sales invoice remaining amount'
Assert-Status (Invoke-PostgrestJson -Method POST -Path '/rpc/post_customer_receipt' -Token $accountantToken -Body @{
  customer_id = $salesSettlement.customer_id
  cash_bank_account_id = $cashAccount.id
  receipt_date = (Get-Date).ToString('yyyy-MM-dd')
  amount = ($receiptAmount + 1)
  allocations = @(@{
    salesInvoiceId = $salesSettlement.sales_invoice_id
    allocatedAmount = ($receiptAmount + 1)
  })
}) @(400) 'Customer over-allocation is blocked'

Write-Host 'Posting supplier payment...'
$supplierSettlement = New-SupplierInvoicePaymentFixture `
  -AdminToken $adminToken `
  -ManagerToken $managerToken `
  -WarehouseToken $warehouseToken `
  -AccountantToken $accountantToken
$paymentAmount = [decimal] $supplierSettlement.remaining_amount
$payment = Invoke-PostgrestJson -Method POST -Path '/rpc/post_supplier_payment' -Token $accountantToken -Body @{
  supplier_id = $supplierSettlement.supplier_id
  cash_bank_account_id = $cashAccount.id
  payment_date = (Get-Date).ToString('yyyy-MM-dd')
  amount = $paymentAmount
  allocations = @(@{
    supplierInvoiceId = $supplierSettlement.supplier_invoice_id
    allocatedAmount = $paymentAmount
  })
}
Assert-Status $payment @(200) 'Accountant can post supplier payment'
if ([string]::IsNullOrWhiteSpace([string] $payment.Json.paymentNumber)) { throw 'Payment number was not generated by backend.' }
Write-Host "PASS: Payment number generated by backend: $($payment.Json.paymentNumber)"
Assert-JournalBalanced -JournalNumber $payment.Json.journalNumber -Token $accountantToken -Name 'Supplier payment'
$supplierAfter = Invoke-PostgrestJson -Method GET -Path "/supplier_invoice_settlement_view?supplier_invoice_id=eq.$($supplierSettlement.supplier_invoice_id)&select=remaining_amount,settlement_status&limit=1" -Token $accountantToken
Assert-Status $supplierAfter @(200, 206) 'Supplier invoice settlement can be checked after payment'
$supplierAfterItem = First-Item $supplierAfter 'Supplier invoice settlement row after payment' @('remaining_amount', 'settlement_status')
if ([decimal] $supplierAfterItem.remaining_amount -ge $paymentAmount) { throw 'Supplier payment did not reduce supplier invoice remaining amount.' }
Write-Host 'PASS: Supplier payment reduced supplier invoice remaining amount'
Assert-Status (Invoke-PostgrestJson -Method POST -Path '/rpc/post_supplier_payment' -Token $accountantToken -Body @{
  supplier_id = $supplierSettlement.supplier_id
  cash_bank_account_id = $cashAccount.id
  payment_date = (Get-Date).ToString('yyyy-MM-dd')
  amount = ($paymentAmount + 1)
  allocations = @(@{
    supplierInvoiceId = $supplierSettlement.supplier_invoice_id
    allocatedAmount = ($paymentAmount + 1)
  })
}) @(400) 'Supplier over-allocation is blocked'

$inventoryAfter = Invoke-PostgrestJson -Method GET -Path '/inventory_movement_view?select=id&limit=1' -Token $adminToken
Assert-Status $inventoryBefore @(200, 206) 'Inventory movement view readable before payments'
Assert-Status $inventoryAfter @(200, 206) 'Inventory movement view readable after payments'
Write-Host 'PASS: Payments do not require or create inventory movement API calls'

$audit = Invoke-PostgrestJson -Method POST -Path '/rpc/admin_list_audit_logs' -Token $adminToken -Body @{
  search = 'payment'
  page_number = 1
  page_size = 20
}
Assert-Status $audit @(200) 'Admin can inspect payment audit events'

Write-Host 'Payments smoke test completed.'
