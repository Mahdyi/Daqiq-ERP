[CmdletBinding()]
param(
  [string] $BaseUrl
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
  $BaseUrl = $env:PGRST_BASE_URL
}

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
  $BaseUrl = $env:POSTGREST_BASE_URL
}

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
  $BaseUrl = 'http://127.0.0.1:3000'
}

$BaseUrl = $BaseUrl.TrimEnd('/')

function Convert-ResponseJson {
  param([string] $Content)

  if ([string]::IsNullOrWhiteSpace($Content)) {
    return $null
  }

  $Content | ConvertFrom-Json
}

function New-SmokeResponse {
  param(
    [int] $StatusCode,
    [string] $Content,
    $Headers
  )

  [pscustomobject]@{
    StatusCode = $StatusCode
    Content = $Content
    Json = Convert-ResponseJson -Content $Content
    Headers = $Headers
  }
}

function Invoke-PostgrestJson {
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
    $request['Body'] = ($Body | ConvertTo-Json -Depth 30)
  }

  try {
    $response = Invoke-WebRequest @request
    return New-SmokeResponse -StatusCode ([int] $response.StatusCode) -Content ([string] $response.Content) -Headers $response.Headers
  } catch {
    $rawResponse = $_.Exception.Response

    if ($null -eq $rawResponse) {
      throw
    }

    $contentMember = $rawResponse.PSObject.Properties | Where-Object { $_.Name -eq 'Content' } | Select-Object -First 1
    if ($null -ne $contentMember -and $null -ne $contentMember.Value -and $contentMember.Value.PSObject.Methods.Name -contains 'ReadAsStringAsync') {
      $content = $contentMember.Value.ReadAsStringAsync().GetAwaiter().GetResult()
      return New-SmokeResponse -StatusCode ([int] $rawResponse.StatusCode) -Content $content -Headers $rawResponse.Headers
    }

    if ($rawResponse.PSObject.Methods.Name -notcontains 'GetResponseStream') {
      throw
    }

    $reader = New-Object System.IO.StreamReader($rawResponse.GetResponseStream())
    $content = $reader.ReadToEnd()
    return New-SmokeResponse -StatusCode ([int] $rawResponse.StatusCode) -Content $content -Headers $rawResponse.Headers
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
  param([string] $Content)

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

function First-LookupValue {
  param(
    [Parameter(Mandatory)] [string] $Code,
    [string] $PreferredCode,
    [Parameter(Mandatory)] [string] $Token
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

  $items[0]
}

function Require-SmokeCredentialPlan {
  param([Parameter(Mandatory)] [object[]] $RoleConfigs)

  $missing = @()

  foreach ($config in $RoleConfigs) {
    $token = [Environment]::GetEnvironmentVariable($config.TokenEnv)
    $email = [Environment]::GetEnvironmentVariable($config.EmailEnv)
    $password = [Environment]::GetEnvironmentVariable($config.PasswordEnv)

    if ([string]::IsNullOrWhiteSpace($token)) {
      if ([string]::IsNullOrWhiteSpace($email)) {
        $missing += $config.EmailEnv
      }

      if ([string]::IsNullOrWhiteSpace($password)) {
        $missing += $config.PasswordEnv
      }
    }
  }

  if ($missing.Count -gt 0) {
    $uniqueMissing = $missing | Sort-Object -Unique
    throw @"
Required smoke-test credentials are missing.

Set role credentials locally, or provide the corresponding ERP_*_TOKEN variables.
Missing variables:
$($uniqueMissing -join "`n")

Example:
`$env:PGRST_BASE_URL = "http://127.0.0.1:3500"
`$env:SMOKE_ADMIN_EMAIL = "admin@erp.com"
`$env:SMOKE_ADMIN_PASSWORD = "<local only>"
`$env:SMOKE_ACCOUNTANT_EMAIL = "accountant@erp.com"
`$env:SMOKE_ACCOUNTANT_PASSWORD = "<local only>"

Never commit passwords, JWTs, or secrets.
"@
  }
}

function Get-SmokeToken {
  param(
    [Parameter(Mandatory)] [string] $RoleName,
    [Parameter(Mandatory)] [string] $TokenEnv,
    [Parameter(Mandatory)] [string] $EmailEnv,
    [Parameter(Mandatory)] [string] $PasswordEnv
  )

  $token = [Environment]::GetEnvironmentVariable($TokenEnv)

  if (-not [string]::IsNullOrWhiteSpace($token)) {
    Write-Host "Using $TokenEnv for $RoleName."
    return $token
  }

  $email = [Environment]::GetEnvironmentVariable($EmailEnv)
  $password = [Environment]::GetEnvironmentVariable($PasswordEnv)

  $response = Invoke-PostgrestJson -Method POST -Path '/rpc/login' -Body @{
    email = $email
    password = $password
  }

  Assert-Status $response @(200) "Login succeeds for $RoleName"

  if ($null -eq $response.Json -or [string]::IsNullOrWhiteSpace([string] $response.Json.accessToken)) {
    throw "Login response for $RoleName did not contain an access token."
  }

  $response.Json.accessToken
}

function Assert-JournalBalanced {
  param(
    [Parameter(Mandatory)] $Journal,
    [Parameter(Mandatory)] [string] $Name
  )

  if ([decimal] $Journal.totalDebit -ne [decimal] $Journal.totalCredit) {
    throw "$Name is not balanced. Debit=$($Journal.totalDebit), Credit=$($Journal.totalCredit)"
  }

  Write-Host "PASS: $Name is balanced"
}

function New-ManualJournalBody {
  param(
    [Parameter(Mandatory)] [string] $DebitAccountId,
    [Parameter(Mandatory)] [string] $CreditAccountId,
    [Parameter(Mandatory)] [decimal] $DebitAmount,
    [Parameter(Mandatory)] [decimal] $CreditAmount,
    [string] $Description = 'Accounting smoke test journal',
    [datetime] $JournalDate = (Get-Date)
  )

  @{
    journal_date = $JournalDate.ToString('yyyy-MM-dd')
    description = $Description
    currency_lookup_value_id = $null
    lines = @(
      @{
        accountId = $DebitAccountId
        description = 'Smoke debit'
        debitAmount = $DebitAmount
        creditAmount = 0
      },
      @{
        accountId = $CreditAccountId
        description = 'Smoke credit'
        debitAmount = 0
        creditAmount = $CreditAmount
      }
    )
  }
}

function Get-InventoryQuantityTotal {
  param([Parameter(Mandatory)] [string] $Token)

  $response = Invoke-PostgrestJson -Method GET -Path '/inventory_balance_view?select=quantity_on_hand' -Token $Token
  Assert-Status $response @(200, 206) 'Inventory balances are readable for baseline'
  $sum = [decimal] 0

  foreach ($row in @(Convert-Rows -Content $response.Content)) {
    if ($null -ne $row.quantity_on_hand) {
      $sum += [decimal] $row.quantity_on_hand
    }
  }

  $sum
}

function New-SalesInvoiceAccountingFixture {
  param(
    [Parameter(Mandatory)] [string] $AdminToken,
    [Parameter(Mandatory)] [string] $ManagerToken,
    [Parameter(Mandatory)] [string] $SalesToken,
    [Parameter(Mandatory)] [string] $WarehouseToken,
    [Parameter(Mandatory)] [string] $AccountantToken
  )

  Write-Host 'Preparing deterministic issued sales invoice fixture...'
  $customer = First-Row -Response (Invoke-PostgrestJson -Method GET -Path '/customers?active=eq.true&limit=1' -Token $AdminToken) -Name 'Active customer'
  $product = First-Row -Response (Invoke-PostgrestJson -Method GET -Path '/products?active=eq.true&sellable=eq.true&track_inventory=eq.true&limit=1' -Token $AdminToken) -Name 'Inventory-tracked sellable product'
  $warehouse = First-Row -Response (Invoke-PostgrestJson -Method GET -Path '/warehouses?active=eq.true&limit=1' -Token $AdminToken) -Name 'Active warehouse'
  $currency = First-LookupValue -Code 'currency' -PreferredCode 'IRR' -Token $AdminToken
  $taxRate = First-LookupValue -Code 'tax_rate' -PreferredCode 'standard' -Token $AdminToken
  $today = (Get-Date).ToString('yyyy-MM-dd')

  Assert-Status (Invoke-PostgrestJson -Method POST -Path '/rpc/inventory_adjust_in' -Token $AdminToken -Body @{
    product_id = $product.id
    warehouse_id = $warehouse.id
    storage_location_id = $null
    quantity = 10
    reason = 'Accounting smoke sales invoice fixture stock'
  }) @(200) 'Admin can seed stock for accounting sales invoice fixture'

  $orderResponse = Invoke-PostgrestJson -Method POST -Path '/rpc/create_sales_order' -Token $AdminToken -Body @{
    customer_id = $customer.id
    order_date = $today
    requested_delivery_date = (Get-Date).AddDays(3).ToString('yyyy-MM-dd')
    currency_lookup_value_id = $currency.id
    delivery_warehouse_id = $warehouse.id
    notes = 'Accounting smoke sales order'
    lines = @(
      @{
        product_id = $product.id
        quantity = 2
        unit_lookup_value_id = $product.base_unit_lookup_value_id
        unit_price = 100
        tax_rate_lookup_value_id = $taxRate.id
        description = 'Accounting smoke sales line'
      }
    )
  }
  Assert-Status $orderResponse @(200) 'Admin can create sales order for accounting fixture'
  $salesOrder = $orderResponse.Json

  Assert-Status (Invoke-PostgrestJson -Method POST -Path '/rpc/submit_sales_order' -Token $AdminToken -Body @{ sales_order_id = $salesOrder.id }) @(200) 'Admin can submit sales order for accounting fixture'
  Assert-Status (Invoke-PostgrestJson -Method POST -Path '/rpc/confirm_sales_order' -Token $ManagerToken -Body @{ sales_order_id = $salesOrder.id }) @(200) 'Manager can confirm sales order for accounting fixture'

  $orderLine = First-Row -Response (Invoke-PostgrestJson -Method GET -Path "/sales_order_line_view?sales_order_id=eq.$($salesOrder.id)&limit=1" -Token $AdminToken) -Name 'Sales order line for accounting fixture'
  $deliveryResponse = Invoke-PostgrestJson -Method POST -Path '/rpc/post_sales_delivery' -Token $WarehouseToken -Body @{
    sales_order_id = $salesOrder.id
    delivery_date = $today
    warehouse_id = $warehouse.id
    notes = 'Accounting smoke sales delivery'
    lines = @(
      @{
        salesOrderLineId = $orderLine.id
        shippedQuantity = 1
        storageLocationId = $null
        notes = 'Accounting smoke shipment'
      }
    )
  }
  Assert-Status $deliveryResponse @(200) 'Warehouse can post sales delivery for accounting fixture'
  $delivery = $deliveryResponse.Json
  $deliveryLine = First-Row -Response (Invoke-PostgrestJson -Method GET -Path "/sales_delivery_line_view?sales_delivery_id=eq.$($delivery.id)&limit=1" -Token $AdminToken) -Name 'Sales delivery line for accounting fixture'

  $invoiceResponse = Invoke-PostgrestJson -Method POST -Path '/rpc/create_sales_invoice_from_delivery' -Token $SalesToken -Body @{
    sales_delivery_id = $delivery.id
    invoice_date = $today
    due_date = (Get-Date).AddDays(30).ToString('yyyy-MM-dd')
    notes = 'Accounting smoke sales invoice'
    lines = @(
      @{
        salesDeliveryLineId = $deliveryLine.id
        quantity = 1
        unitPrice = 100
        taxRateLookupValueId = $taxRate.id
        description = 'Accounting smoke sales invoice line'
      }
    )
  }
  Assert-Status $invoiceResponse @(200) 'Sales can create sales invoice for accounting fixture'
  $invoice = $invoiceResponse.Json

  Assert-Status (Invoke-PostgrestJson -Method POST -Path '/rpc/issue_sales_invoice' -Token $AccountantToken -Body @{ sales_invoice_id = $invoice.id }) @(200) 'Accountant can issue sales invoice for accounting fixture'
  $issuedResponse = Invoke-PostgrestJson -Method GET -Path "/sales_invoice_view?id=eq.$($invoice.id)&select=id,invoice_number,total_amount,status_code&limit=1" -Token $AccountantToken
  Assert-Status $issuedResponse @(200, 206) 'Accountant can reload issued sales invoice fixture'
  $issued = First-Row -Response $issuedResponse -Name 'Issued sales invoice fixture'

  if ($issued.status_code -ne 'issued') {
    throw "Sales invoice fixture is not issued. Status=$($issued.status_code)"
  }

  Write-Host "PASS: Issued sales invoice fixture prepared: $($issued.invoice_number)"
  $issued
}

function New-SupplierInvoiceAccountingFixture {
  param(
    [Parameter(Mandatory)] [string] $AdminToken,
    [Parameter(Mandatory)] [string] $ManagerToken,
    [Parameter(Mandatory)] [string] $WarehouseToken,
    [Parameter(Mandatory)] [string] $AccountantToken
  )

  Write-Host 'Preparing deterministic posted supplier invoice fixture...'
  $supplier = First-Row -Response (Invoke-PostgrestJson -Method GET -Path '/suppliers?active=eq.true&limit=1' -Token $AdminToken) -Name 'Active supplier'
  $product = First-Row -Response (Invoke-PostgrestJson -Method GET -Path '/products?active=eq.true&purchasable=eq.true&track_inventory=eq.true&limit=1' -Token $AdminToken) -Name 'Inventory-tracked purchasable product'
  $warehouse = First-Row -Response (Invoke-PostgrestJson -Method GET -Path '/warehouses?active=eq.true&limit=1' -Token $AdminToken) -Name 'Active warehouse'
  $currency = First-LookupValue -Code 'currency' -PreferredCode 'IRR' -Token $AdminToken
  $taxRate = First-LookupValue -Code 'tax_rate' -PreferredCode 'standard' -Token $AdminToken
  $today = (Get-Date).ToString('yyyy-MM-dd')
  $supplierInvoiceNumber = "ACC-SMOKE-SUP-$((Get-Date).ToString('yyyyMMddHHmmss'))"

  $orderResponse = Invoke-PostgrestJson -Method POST -Path '/rpc/create_purchase_order' -Token $AdminToken -Body @{
    supplier_id = $supplier.id
    order_date = $today
    expected_date = (Get-Date).AddDays(3).ToString('yyyy-MM-dd')
    currency_lookup_value_id = $currency.id
    delivery_warehouse_id = $warehouse.id
    notes = 'Accounting smoke purchase order'
    lines = @(
      @{
        product_id = $product.id
        quantity = 2
        unit_lookup_value_id = $product.base_unit_lookup_value_id
        unit_price = 100
        tax_rate_lookup_value_id = $taxRate.id
        description = 'Accounting smoke purchase line'
      }
    )
  }
  Assert-Status $orderResponse @(200) 'Admin can create purchase order for accounting fixture'
  $purchaseOrder = $orderResponse.Json

  Assert-Status (Invoke-PostgrestJson -Method POST -Path '/rpc/submit_purchase_order' -Token $AdminToken -Body @{ purchase_order_id = $purchaseOrder.id }) @(200) 'Admin can submit purchase order for accounting fixture'
  Assert-Status (Invoke-PostgrestJson -Method POST -Path '/rpc/approve_purchase_order' -Token $ManagerToken -Body @{ purchase_order_id = $purchaseOrder.id }) @(200) 'Manager can approve purchase order for accounting fixture'

  $orderLine = First-Row -Response (Invoke-PostgrestJson -Method GET -Path "/purchase_order_line_view?purchase_order_id=eq.$($purchaseOrder.id)&limit=1" -Token $AdminToken) -Name 'Purchase order line for accounting fixture'
  $receiptResponse = Invoke-PostgrestJson -Method POST -Path '/rpc/post_goods_receipt' -Token $WarehouseToken -Body @{
    purchase_order_id = $purchaseOrder.id
    receipt_date = $today
    warehouse_id = $warehouse.id
    notes = 'Accounting smoke goods receipt'
    lines = @(
      @{
        purchase_order_line_id = $orderLine.id
        received_quantity = 1
        storage_location_id = $null
        notes = 'Accounting smoke receipt line'
      }
    )
  }
  Assert-Status $receiptResponse @(200) 'Warehouse can post goods receipt for accounting fixture'
  $receipt = $receiptResponse.Json
  $receiptLine = First-Row -Response (Invoke-PostgrestJson -Method GET -Path "/goods_receipt_line_view?goods_receipt_id=eq.$($receipt.id)&limit=1" -Token $AdminToken) -Name 'Goods receipt line for accounting fixture'

  $invoiceResponse = Invoke-PostgrestJson -Method POST -Path '/rpc/create_supplier_invoice_from_receipt' -Token $AccountantToken -Body @{
    goods_receipt_id = $receipt.id
    supplier_invoice_number = $supplierInvoiceNumber
    invoice_date = $today
    due_date = (Get-Date).AddDays(30).ToString('yyyy-MM-dd')
    notes = 'Accounting smoke supplier invoice'
    lines = @(
      @{
        goodsReceiptLineId = $receiptLine.id
        quantity = 1
        unitPrice = 100
        taxRateLookupValueId = $taxRate.id
        description = 'Accounting smoke supplier invoice line'
      }
    )
  }
  Assert-Status $invoiceResponse @(200) 'Accountant can create supplier invoice for accounting fixture'
  $invoice = $invoiceResponse.Json

  Assert-Status (Invoke-PostgrestJson -Method POST -Path '/rpc/post_supplier_invoice' -Token $AccountantToken -Body @{ supplier_invoice_id = $invoice.id }) @(200) 'Accountant can post supplier invoice for accounting fixture'
  $postedResponse = Invoke-PostgrestJson -Method GET -Path "/supplier_invoice_view?id=eq.$($invoice.id)&select=id,invoice_number,total_amount,status_code&limit=1" -Token $AccountantToken
  Assert-Status $postedResponse @(200, 206) 'Accountant can reload posted supplier invoice fixture'
  $posted = First-Row -Response $postedResponse -Name 'Posted supplier invoice fixture'

  if ($posted.status_code -ne 'posted') {
    throw "Supplier invoice fixture is not posted. Status=$($posted.status_code)"
  }

  Write-Host "PASS: Posted supplier invoice fixture prepared: $($posted.invoice_number)"
  $posted
}

function Invoke-InvoiceAccountingCheck {
  param(
    [Parameter(Mandatory)] [string] $Name,
    [Parameter(Mandatory)] [string] $RpcPath,
    [Parameter(Mandatory)] [string] $RequestKey,
    [Parameter(Mandatory)] $Invoice,
    [Parameter(Mandatory)] [string] $AccountantToken,
    [Parameter(Mandatory)] [string] $AdminToken
  )

  $inventoryBefore = Get-InventoryQuantityTotal -Token $AdminToken
  $body = @{}
  $body[$RequestKey] = $Invoice.id

  $postedResponse = Invoke-PostgrestJson -Method POST -Path $RpcPath -Token $AccountantToken -Body $body
  Assert-Status $postedResponse @(200) "$Name accounting posting succeeds"
  $journal = $postedResponse.Json

  if ($journal.statusCode -ne 'posted') {
    throw "$Name accounting posting did not return a posted journal."
  }

  Assert-JournalBalanced -Journal $journal -Name "$Name accounting journal"

  $duplicateResponse = Invoke-PostgrestJson -Method POST -Path $RpcPath -Token $AccountantToken -Body $body
  Assert-Status $duplicateResponse @(409) "$Name duplicate accounting posting is blocked"

  $inventoryAfter = Get-InventoryQuantityTotal -Token $AdminToken
  if ($inventoryBefore -ne $inventoryAfter) {
    throw "$Name accounting posting changed inventory. Before=$inventoryBefore, After=$inventoryAfter"
  }

  Write-Host "PASS: $Name accounting posting does not change inventory"

  $ledgerResponse = Invoke-PostgrestJson -Method GET -Path "/general_ledger_view?journal_number=eq.$($journal.journalNumber)&select=journal_number,account_code,debit_amount,credit_amount" -Token $AccountantToken
  Assert-Status $ledgerResponse @(200, 206) "$Name journal is visible in general ledger"

  if (@(Convert-Rows -Content $ledgerResponse.Content).Count -lt 2) {
    throw "$Name journal did not expose at least two general ledger lines."
  }

  Write-Host "PASS: $Name general ledger lines are present"
}

$roleConfigs = @(
  @{ RoleName = 'admin'; TokenEnv = 'ERP_ADMIN_TOKEN'; EmailEnv = 'SMOKE_ADMIN_EMAIL'; PasswordEnv = 'SMOKE_ADMIN_PASSWORD' },
  @{ RoleName = 'accountant'; TokenEnv = 'ERP_ACCOUNTANT_TOKEN'; EmailEnv = 'SMOKE_ACCOUNTANT_EMAIL'; PasswordEnv = 'SMOKE_ACCOUNTANT_PASSWORD' },
  @{ RoleName = 'manager'; TokenEnv = 'ERP_MANAGER_TOKEN'; EmailEnv = 'SMOKE_MANAGER_EMAIL'; PasswordEnv = 'SMOKE_MANAGER_PASSWORD' },
  @{ RoleName = 'warehouse'; TokenEnv = 'ERP_WAREHOUSE_TOKEN'; EmailEnv = 'SMOKE_WAREHOUSE_EMAIL'; PasswordEnv = 'SMOKE_WAREHOUSE_PASSWORD' },
  @{ RoleName = 'sales'; TokenEnv = 'ERP_SALES_TOKEN'; EmailEnv = 'SMOKE_SALES_EMAIL'; PasswordEnv = 'SMOKE_SALES_PASSWORD' },
  @{ RoleName = 'viewer'; TokenEnv = 'ERP_VIEWER_TOKEN'; EmailEnv = 'SMOKE_VIEWER_EMAIL'; PasswordEnv = 'SMOKE_VIEWER_PASSWORD' }
)

Write-Host "Accounting smoke test base URL: $BaseUrl"
Require-SmokeCredentialPlan -RoleConfigs $roleConfigs

$tokens = @{}
foreach ($config in $roleConfigs) {
  $tokens[$config.RoleName] = Get-SmokeToken -RoleName $config.RoleName -TokenEnv $config.TokenEnv -EmailEnv $config.EmailEnv -PasswordEnv $config.PasswordEnv
}

$adminToken = $tokens['admin']
$accountantToken = $tokens['accountant']
$managerToken = $tokens['manager']
$warehouseToken = $tokens['warehouse']
$salesToken = $tokens['sales']
$viewerToken = $tokens['viewer']

Write-Host 'Checking chart of accounts access...'
$accountsResponse = Invoke-PostgrestJson -Method GET -Path '/gl_account_view?select=id,account_code,account_name,is_postable,active&order=account_code.asc' -Token $accountantToken
Assert-Status $accountsResponse @(200, 206) 'Accountant can view chart of accounts'
$accounts = @(Convert-Rows -Content $accountsResponse.Content)
$debitAccount = $accounts | Where-Object { $_.account_code -eq '1000' -and $_.is_postable -eq $true -and $_.active -eq $true } | Select-Object -First 1
$creditAccount = $accounts | Where-Object { $_.account_code -eq '3000' -and $_.is_postable -eq $true -and $_.active -eq $true } | Select-Object -First 1

if ($null -eq $debitAccount -or $null -eq $creditAccount) {
  throw 'Required seed GL accounts 1000 and 3000 were not found as active postable accounts.'
}

Write-Host 'Creating balanced manual journal...'
$journalResponse = Invoke-PostgrestJson -Method POST -Path '/rpc/create_manual_journal_entry' -Token $accountantToken -Body (New-ManualJournalBody -DebitAccountId $debitAccount.id -CreditAccountId $creditAccount.id -DebitAmount 100 -CreditAmount 100)
Assert-Status $journalResponse @(200) 'Accountant can create balanced manual journal draft'
$journal = $journalResponse.Json

if ($journal.statusCode -ne 'draft') {
  throw 'Manual journal was not created as draft.'
}

if ([string]::IsNullOrWhiteSpace([string] $journal.journalNumber)) {
  throw 'Manual journal number was not generated by the backend.'
}
Write-Host "PASS: Journal number generated by backend: $($journal.journalNumber)"

Write-Host 'Posting balanced journal...'
$postedResponse = Invoke-PostgrestJson -Method POST -Path '/rpc/post_journal_entry' -Token $accountantToken -Body @{ journal_entry_id = $journal.id }
Assert-Status $postedResponse @(200) 'Accountant can post balanced manual journal'
$postedJournal = $postedResponse.Json

if ($postedJournal.statusCode -ne 'posted') {
  throw 'Manual journal was not posted.'
}

Assert-JournalBalanced -Journal $postedJournal -Name 'Posted manual journal'

Write-Host 'Verifying general ledger contains posted journal lines...'
$ledgerResponse = Invoke-PostgrestJson -Method GET -Path "/general_ledger_view?journal_number=eq.$($postedJournal.journalNumber)&select=journal_number,account_code,debit_amount,credit_amount" -Token $accountantToken
Assert-Status $ledgerResponse @(200, 206) 'General ledger can be queried by journal number'

if (@(Convert-Rows -Content $ledgerResponse.Content).Count -lt 2) {
  throw 'General ledger did not expose posted journal lines.'
}
Write-Host 'PASS: General ledger view shows posted journal lines only'

Assert-Status (Invoke-PostgrestJson -Method PATCH -Path "/journal_entries?id=eq.$($postedJournal.id)" -Token $accountantToken -Body @{ description = 'Should not edit posted smoke journal' }) @(401, 403, 405) 'Posted journal cannot be edited through table API'
Assert-Status (Invoke-PostgrestJson -Method DELETE -Path "/journal_entries?id=eq.$($postedJournal.id)" -Token $accountantToken) @(401, 403, 405) 'Posted journal cannot be deleted through table API'

Write-Host 'Verifying unbalanced journal posting is blocked...'
$unbalancedResponse = Invoke-PostgrestJson -Method POST -Path '/rpc/create_manual_journal_entry' -Token $accountantToken -Body (New-ManualJournalBody -DebitAccountId $debitAccount.id -CreditAccountId $creditAccount.id -DebitAmount 100 -CreditAmount 90 -Description 'Unbalanced accounting smoke test journal')
Assert-Status $unbalancedResponse @(200) 'Accountant can create unbalanced draft for validation test'
$unbalancedJournal = $unbalancedResponse.Json
Assert-Status (Invoke-PostgrestJson -Method POST -Path '/rpc/post_journal_entry' -Token $accountantToken -Body @{ journal_entry_id = $unbalancedJournal.id }) @(400) 'Unbalanced journal posting is blocked'

Write-Host 'Verifying closed period posting is blocked...'
$closedPeriodResponse = Invoke-PostgrestJson -Method POST -Path '/rpc/create_manual_journal_entry' -Token $accountantToken -Body (New-ManualJournalBody -DebitAccountId $debitAccount.id -CreditAccountId $creditAccount.id -DebitAmount 25 -CreditAmount 25 -Description 'Closed period accounting smoke test journal')
Assert-Status $closedPeriodResponse @(200) 'Accountant can create draft before closing period'
$closedPeriodJournal = $closedPeriodResponse.Json
$periodResponse = Invoke-PostgrestJson -Method GET -Path "/accounting_periods?id=eq.$($closedPeriodJournal.accountingPeriodId)&select=id,is_closed&limit=1" -Token $accountantToken
Assert-Status $periodResponse @(200, 206) 'Accountant can inspect accounting period for closed-period test'
$period = First-Row -Response $periodResponse -Name 'Accounting period'
$originalIsClosed = [bool] $period.is_closed

try {
  Assert-Status (Invoke-PostgrestJson -Method PATCH -Path "/accounting_periods?id=eq.$($period.id)" -Token $accountantToken -Body @{ is_closed = $true }) @(200, 204) 'Accountant can temporarily close accounting period for smoke test'
  Assert-Status (Invoke-PostgrestJson -Method POST -Path '/rpc/post_journal_entry' -Token $accountantToken -Body @{ journal_entry_id = $closedPeriodJournal.id }) @(400) 'Closed period posting is blocked'
} finally {
  Assert-Status (Invoke-PostgrestJson -Method PATCH -Path "/accounting_periods?id=eq.$($period.id)" -Token $accountantToken -Body @{ is_closed = $originalIsClosed }) @(200, 204) 'Accounting period is restored after smoke test'
}

Write-Host 'Verifying role boundaries...'
Assert-Status (Invoke-PostgrestJson -Method GET -Path '/journal_entry_view?limit=1' -Token $managerToken) @(200, 206) 'Manager can read accounting journals'
Assert-Status (Invoke-PostgrestJson -Method POST -Path '/rpc/post_journal_entry' -Token $managerToken -Body @{ journal_entry_id = $unbalancedJournal.id }) @(401, 403, 404) 'Manager cannot post accounting journals'
Assert-Status (Invoke-PostgrestJson -Method GET -Path '/gl_account_view?select=id&limit=1' -Token $warehouseToken) @(401, 403, 404) 'Warehouse cannot read accounting'
Assert-Status (Invoke-PostgrestJson -Method GET -Path '/gl_account_view?select=id&limit=1' -Token $salesToken) @(401, 403, 404) 'Sales cannot read accounting'
Assert-Status (Invoke-PostgrestJson -Method GET -Path '/gl_account_view?select=id&limit=1' -Token $viewerToken) @(401, 403, 404) 'Viewer cannot read accounting'

Write-Host 'Checking invoice accounting fixtures...'
$salesInvoice = New-SalesInvoiceAccountingFixture -AdminToken $adminToken -ManagerToken $managerToken -SalesToken $salesToken -WarehouseToken $warehouseToken -AccountantToken $accountantToken
Invoke-InvoiceAccountingCheck -Name 'Sales invoice' -RpcPath '/rpc/post_sales_invoice_accounting' -RequestKey 'sales_invoice_id' -Invoice $salesInvoice -AccountantToken $accountantToken -AdminToken $adminToken

$supplierInvoice = New-SupplierInvoiceAccountingFixture -AdminToken $adminToken -ManagerToken $managerToken -WarehouseToken $warehouseToken -AccountantToken $accountantToken
Invoke-InvoiceAccountingCheck -Name 'Supplier invoice' -RpcPath '/rpc/post_supplier_invoice_accounting' -RequestKey 'supplier_invoice_id' -Invoice $supplierInvoice -AccountantToken $accountantToken -AdminToken $adminToken

Write-Host 'Checking audit events...'
$auditResponse = Invoke-PostgrestJson -Method POST -Path '/rpc/admin_list_audit_logs' -Token $adminToken -Body @{
  search = 'journalEntry'
  page_number = 1
  page_size = 20
}
Assert-Status $auditResponse @(200) 'Admin can list accounting audit logs'
$auditItems = @($auditResponse.Json.items)

if ($auditItems.Count -lt 1) {
  throw 'No accounting audit events were found.'
}

Write-Host 'PASS: Accounting audit events are created'
Write-Host 'Accounting smoke test completed.'
