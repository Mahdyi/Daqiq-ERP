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
  Assert-Status (Invoke-Api -Method GET -Path '/sales_order_view?limit=1' -Token $allowed.Token) @(200, 206) "$($allowed.Name) can list sales orders"
}

Assert-Status (Invoke-Api -Method GET -Path '/sales_order_view?limit=1' -Token $viewer.accessToken) @(401, 403) 'Viewer cannot list sales orders'

$customer = First-Row -Response (Invoke-Api -Method GET -Path '/customers?active=eq.true&limit=1' -Token $admin.accessToken) -Name 'Active customer'
$product = First-Row -Response (Invoke-Api -Method GET -Path '/products?active=eq.true&sellable=eq.true&limit=1' -Token $admin.accessToken) -Name 'Sellable product'
$warehouseRow = First-Row -Response (Invoke-Api -Method GET -Path '/warehouses?active=eq.true&limit=1' -Token $admin.accessToken) -Name 'Active warehouse'

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

$createBody = @{
  customer_id = $customer.id
  order_date = (Get-Date).ToString('yyyy-MM-dd')
  requested_delivery_date = (Get-Date).AddDays(7).ToString('yyyy-MM-dd')
  currency_lookup_value_id = $currency.id
  delivery_warehouse_id = $warehouseRow.id
  notes = 'Sales order smoke test'
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

$created = Invoke-Api -Method POST -Path '/rpc/create_sales_order' -Token $admin.accessToken -Body $createBody
Assert-Status $created @(200) 'Admin can create sales order'
$createdOrder = $created.Content | ConvertFrom-Json

if ([string]::IsNullOrWhiteSpace($createdOrder.orderNumber)) {
  throw 'Sales order number was not generated.'
}
Write-Host 'PASS: Sales order number is generated'

$updateBody = @{
  sales_order_id = $createdOrder.id
  customer_id = $customer.id
  order_date = (Get-Date).ToString('yyyy-MM-dd')
  requested_delivery_date = (Get-Date).AddDays(10).ToString('yyyy-MM-dd')
  currency_lookup_value_id = $currency.id
  delivery_warehouse_id = $warehouseRow.id
  notes = 'Updated sales order smoke test'
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

Assert-Status (Invoke-Api -Method POST -Path '/rpc/update_sales_order' -Token $admin.accessToken -Body $updateBody) @(200) 'Admin can update draft sales order'
Assert-Status (Invoke-Api -Method POST -Path '/rpc/submit_sales_order' -Token $sales.accessToken -Body @{ sales_order_id = $createdOrder.id }) @(200) 'Sales user can submit sales order'
Assert-Status (Invoke-Api -Method POST -Path '/rpc/confirm_sales_order' -Token $sales.accessToken -Body @{ sales_order_id = $createdOrder.id }) @(401, 403, 404) 'Sales user cannot confirm sales order'
Assert-Status (Invoke-Api -Method POST -Path '/rpc/confirm_sales_order' -Token $manager.accessToken -Body @{ sales_order_id = $createdOrder.id }) @(200) 'Manager can confirm sales order'
Assert-Status (Invoke-Api -Method POST -Path '/rpc/update_sales_order' -Token $admin.accessToken -Body $updateBody) @(400) 'Confirmed sales order cannot be edited as draft'
Assert-Status (Invoke-Api -Method POST -Path '/rpc/cancel_sales_order' -Token $admin.accessToken -Body @{ sales_order_id = $createdOrder.id }) @(200) 'Admin can cancel confirmed sales order'

Assert-Status (Invoke-Api -Method POST -Path '/rpc/create_sales_order' -Token $accountant.accessToken -Body $createBody) @(401, 403, 404) 'Accountant cannot create sales order'
Assert-Status (Invoke-Api -Method POST -Path '/rpc/create_sales_order' -Token $warehouse.accessToken -Body $createBody) @(401, 403, 404) 'Warehouse cannot create sales order'
Assert-Status (Invoke-Api -Method POST -Path '/sales_orders' -Token $admin.accessToken -Body @{
  order_number = 'DIRECT-SHOULD-FAIL'
  customer_id = $customer.id
  status_lookup_value_id = $createdOrder.statusLookupValueId
  order_date = (Get-Date).ToString('yyyy-MM-dd')
}) @(401, 403) 'Admin cannot directly insert sales orders outside RPCs'

$inactiveCustomer = Invoke-Api -Method POST -Path '/customers' -Token $admin.accessToken -Body @{
  code = "SO-SMOKE-INACTIVE-$([guid]::NewGuid().ToString('N').Substring(0, 8))"
  name = 'Inactive Sales Smoke Customer'
  customer_type = 'individual'
  active = $false
} -ExtraHeaders @{ Prefer = 'return=representation' }
Assert-Status $inactiveCustomer @(201) 'Admin can create inactive smoke customer'
$inactiveCustomerRow = First-Row -Response $inactiveCustomer -Name 'Inactive smoke customer'
$inactiveBody = $createBody.Clone()
$inactiveBody.customer_id = $inactiveCustomerRow.id
Assert-Status (Invoke-Api -Method POST -Path '/rpc/create_sales_order' -Token $admin.accessToken -Body $inactiveBody) @(400) 'Inactive customer is rejected for sales order'

$nonSellableProduct = Invoke-Api -Method POST -Path '/products' -Token $admin.accessToken -Body @{
  sku = "SO-SMOKE-NONSELL-$([guid]::NewGuid().ToString('N').Substring(0, 8))"
  name = 'Non Sellable Sales Smoke Product'
  product_type = 'service'
  base_unit_lookup_value_id = $product.base_unit_lookup_value_id
  track_inventory = $false
  purchasable = $false
  sellable = $false
  active = $true
} -ExtraHeaders @{ Prefer = 'return=representation' }
Assert-Status $nonSellableProduct @(201) 'Admin can create non-sellable smoke product'
$nonSellableProductRow = First-Row -Response $nonSellableProduct -Name 'Non-sellable smoke product'
$nonSellableBody = $createBody.Clone()
$nonSellableBody.lines = @(
  @{
    product_id = $nonSellableProductRow.id
    quantity = 1
    unit_lookup_value_id = $nonSellableProductRow.base_unit_lookup_value_id
    unit_price = 10
    tax_rate_lookup_value_id = $taxRate.id
  }
)
Assert-Status (Invoke-Api -Method POST -Path '/rpc/create_sales_order' -Token $admin.accessToken -Body $nonSellableBody) @(400) 'Non-sellable product is rejected for sales order'

$auditList = Invoke-Api -Method POST -Path '/rpc/admin_list_audit_logs' -Token $admin.accessToken -Body @{
  page_number = 1
  page_size = 100
}
Assert-Status $auditList @(200) 'Admin can list sales-order audit logs'

if ($auditList.Content -match 'Bearer eyJ|accessToken|refreshToken|jwt_secret|password_hash|refresh_token_hash|secret') {
  throw 'Audit response leaked sensitive content.'
}

foreach ($expectedAction in @('salesOrder.created', 'salesOrder.updated', 'salesOrder.submitted', 'salesOrder.confirmed', 'salesOrder.cancelled')) {
  if ($auditList.Content -notmatch [regex]::Escape($expectedAction)) {
    throw "Expected audit action $expectedAction was not found."
  }

  Write-Host "PASS: Audit action $expectedAction exists"
}
