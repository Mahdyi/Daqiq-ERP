[CmdletBinding()]
param(
  [string] $BaseUrl = $env:PGRST_BASE_URL
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
  $BaseUrl = 'http://127.0.0.1:3000'
}

$BaseUrl = $BaseUrl.TrimEnd('/')
Write-Host "Reports smoke test base URL: $BaseUrl"

function Invoke-PostgrestJson {
  param(
    [Parameter(Mandatory = $true)] [string] $Method,
    [Parameter(Mandatory = $true)] [string] $Path,
    [string] $Token,
    [object] $Body,
    [hashtable] $ExtraHeaders = @{}
  )

  $headers = @{
    Accept = 'application/json'
  }

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
    ErrorAction = 'Stop'
    UseBasicParsing = $true
  }

  if ($PSBoundParameters.ContainsKey('Body')) {
    $request['ContentType'] = 'application/json'
    $request['Body'] = ($Body | ConvertTo-Json -Depth 20)
  }

  try {
    $response = Invoke-WebRequest @request
    $content = [string] $response.Content
    $json = if ([string]::IsNullOrWhiteSpace($content)) { $null } else { $content | ConvertFrom-Json }

    [pscustomobject]@{
      StatusCode = [int] $response.StatusCode
      Json = $json
      Body = $content
      Headers = $response.Headers
    }
  } catch [System.Net.WebException] {
    if ($null -eq $_.Exception.Response) {
      throw
    }

    $webResponse = $_.Exception.Response
    $reader = New-Object System.IO.StreamReader($webResponse.GetResponseStream())
    $content = $reader.ReadToEnd()
    $reader.Dispose()
    $json = if ([string]::IsNullOrWhiteSpace($content)) { $null } else { $content | ConvertFrom-Json }

    [pscustomobject]@{
      StatusCode = [int] $webResponse.StatusCode
      Json = $json
      Body = $content
      Headers = $webResponse.Headers
    }
  }
}

function Assert-Status {
  param(
    [Parameter(Mandatory = $true)] $Response,
    [Parameter(Mandatory = $true)] [int[]] $AllowedStatus,
    [Parameter(Mandatory = $true)] [string] $Name
  )

  if ($AllowedStatus -notcontains [int] $Response.StatusCode) {
    throw "$Name failed. Expected status $($AllowedStatus -join ', '), got $($Response.StatusCode). Body: $($Response.Body)"
  }

  Write-Host "PASS: $Name"
}

function Get-SmokeToken {
  param(
    [Parameter(Mandatory = $true)] [string] $Role
  )

  $upperRole = $Role.ToUpperInvariant()
  $tokenName = "ERP_$($upperRole)_TOKEN"
  $emailName = "SMOKE_$($upperRole)_EMAIL"
  $passwordName = "SMOKE_$($upperRole)_PASSWORD"
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

function Assert-ReportReadable {
  param(
    [Parameter(Mandatory = $true)] [string] $ViewName,
    [Parameter(Mandatory = $true)] [string] $Token,
    [Parameter(Mandatory = $true)] [string] $Name
  )

  $response = Invoke-PostgrestJson -Method GET -Path "/$($ViewName)?limit=1" -Token $Token
  Assert-Status $response @(200, 206) $Name
}

function Assert-ReportBlocked {
  param(
    [Parameter(Mandatory = $true)] [string] $ViewName,
    [Parameter(Mandatory = $true)] [string] $Token,
    [Parameter(Mandatory = $true)] [string] $Name
  )

  $response = Invoke-PostgrestJson -Method GET -Path "/$($ViewName)?limit=1" -Token $Token
  Assert-Status $response @(401, 403, 404) $Name
}

function Assert-NumericField {
  param(
    [Parameter(Mandatory = $true)] [string] $ViewName,
    [Parameter(Mandatory = $true)] [string] $FieldName,
    [Parameter(Mandatory = $true)] [string] $Token
  )

  $response = Invoke-PostgrestJson -Method GET -Path "/$($ViewName)?select=$($FieldName)&limit=1" -Token $Token
  Assert-Status $response @(200, 206) "$ViewName exposes $FieldName"
  $rows = @($response.Json)

  if ($rows.Count -eq 0) {
    Write-Host "SKIP: $ViewName has no rows for numeric validation"
    return
  }

  if ($null -eq $rows[0].PSObject.Properties[$FieldName]) {
    throw "$ViewName did not include expected numeric field $FieldName."
  }

  [decimal] $rows[0].$FieldName | Out-Null
  Write-Host "PASS: $ViewName.$FieldName is numeric"
}

function Assert-ReadOnlyReportMutationBlocked {
  param(
    [Parameter(Mandatory = $true)] $Response,
    [Parameter(Mandatory = $true)] [string] $Name
  )

  $allowedStatus = @(400, 401, 403, 405)
  if ($allowedStatus -contains [int] $Response.StatusCode) {
    Write-Host "PASS: $Name"
    return
  }

  $postgresCode = if ($null -eq $Response.Json -or $null -eq $Response.Json.PSObject.Properties['code']) {
    ''
  } else {
    [string] $Response.Json.code
  }

  if ([int] $Response.StatusCode -eq 500 -and $postgresCode -eq '55000') {
    Write-Host "PASS: $Name"
    return
  }

  throw "$Name failed. Expected read-only rejection, got $($Response.StatusCode). Body: $($Response.Body)"
}

$adminToken = Get-SmokeToken -Role 'admin'
$managerToken = Get-SmokeToken -Role 'manager'
$accountantToken = Get-SmokeToken -Role 'accountant'
$warehouseToken = Get-SmokeToken -Role 'warehouse'
$salesToken = Get-SmokeToken -Role 'sales'
$viewerToken = Get-SmokeToken -Role 'viewer'

$allReports = @(
  'report_inventory_on_hand_view',
  'report_inventory_movement_summary_view',
  'report_purchase_order_status_view',
  'report_goods_receipt_status_view',
  'report_supplier_invoice_settlement_view',
  'report_sales_order_status_view',
  'report_sales_delivery_status_view',
  'report_sales_invoice_settlement_view',
  'report_general_ledger_summary_view',
  'report_journal_activity_view',
  'report_payment_summary_view',
  'report_audit_activity_summary_view'
)

Write-Host 'Checking admin report access...'
foreach ($report in $allReports) {
  Assert-ReportReadable -ViewName $report -Token $adminToken -Name "Admin can read $report"
}

Write-Host 'Checking manager report access...'
foreach ($report in @(
  'report_inventory_on_hand_view',
  'report_inventory_movement_summary_view',
  'report_purchase_order_status_view',
  'report_goods_receipt_status_view',
  'report_supplier_invoice_settlement_view',
  'report_sales_order_status_view',
  'report_sales_delivery_status_view',
  'report_sales_invoice_settlement_view',
  'report_payment_summary_view'
)) {
  Assert-ReportReadable -ViewName $report -Token $managerToken -Name "Manager can read $report"
}
Assert-ReportBlocked -ViewName 'report_general_ledger_summary_view' -Token $managerToken -Name 'Manager cannot read accounting report'
Assert-ReportBlocked -ViewName 'report_audit_activity_summary_view' -Token $managerToken -Name 'Manager cannot read audit report'

Write-Host 'Checking accountant report access...'
foreach ($report in @(
  'report_supplier_invoice_settlement_view',
  'report_sales_invoice_settlement_view',
  'report_general_ledger_summary_view',
  'report_journal_activity_view',
  'report_payment_summary_view'
)) {
  Assert-ReportReadable -ViewName $report -Token $accountantToken -Name "Accountant can read $report"
}
Assert-ReportBlocked -ViewName 'report_inventory_on_hand_view' -Token $accountantToken -Name 'Accountant cannot read inventory report'
Assert-ReportBlocked -ViewName 'report_audit_activity_summary_view' -Token $accountantToken -Name 'Accountant cannot read audit report'

Write-Host 'Checking warehouse report access...'
Assert-ReportReadable -ViewName 'report_inventory_on_hand_view' -Token $warehouseToken -Name 'Warehouse can read inventory on hand report'
Assert-ReportReadable -ViewName 'report_inventory_movement_summary_view' -Token $warehouseToken -Name 'Warehouse can read inventory movement summary report'
Assert-ReportBlocked -ViewName 'report_sales_order_status_view' -Token $warehouseToken -Name 'Warehouse cannot read sales report'
Assert-ReportBlocked -ViewName 'report_payment_summary_view' -Token $warehouseToken -Name 'Warehouse cannot read payment report'

Write-Host 'Checking sales report access...'
Assert-ReportReadable -ViewName 'report_sales_order_status_view' -Token $salesToken -Name 'Sales can read sales order report'
Assert-ReportReadable -ViewName 'report_sales_delivery_status_view' -Token $salesToken -Name 'Sales can read sales delivery report'
Assert-ReportReadable -ViewName 'report_sales_invoice_settlement_view' -Token $salesToken -Name 'Sales can read sales settlement report'
Assert-ReportBlocked -ViewName 'report_inventory_movement_summary_view' -Token $salesToken -Name 'Sales cannot read inventory report'
Assert-ReportBlocked -ViewName 'report_payment_summary_view' -Token $salesToken -Name 'Sales cannot read payment report'

Write-Host 'Checking viewer report access...'
foreach ($report in $allReports) {
  Assert-ReportBlocked -ViewName $report -Token $viewerToken -Name "Viewer cannot read $report"
}

Write-Host 'Checking numeric report fields...'
Assert-NumericField -ViewName 'report_inventory_on_hand_view' -FieldName 'quantity_on_hand' -Token $adminToken
Assert-NumericField -ViewName 'report_purchase_order_status_view' -FieldName 'total_amount' -Token $adminToken
Assert-NumericField -ViewName 'report_sales_order_status_view' -FieldName 'total_amount' -Token $adminToken
Assert-NumericField -ViewName 'report_sales_invoice_settlement_view' -FieldName 'total_remaining_amount' -Token $adminToken
Assert-NumericField -ViewName 'report_supplier_invoice_settlement_view' -FieldName 'total_remaining_amount' -Token $adminToken
Assert-NumericField -ViewName 'report_general_ledger_summary_view' -FieldName 'net_amount' -Token $adminToken
Assert-NumericField -ViewName 'report_payment_summary_view' -FieldName 'total_amount' -Token $adminToken
Assert-NumericField -ViewName 'report_audit_activity_summary_view' -FieldName 'event_count' -Token $adminToken

Write-Host 'Checking report read-only behavior...'
$readonlyResponse = Invoke-PostgrestJson -Method POST -Path '/report_sales_order_status_view' -Token $adminToken -Body @{
  status_code = 'draft'
}
Assert-ReadOnlyReportMutationBlocked $readonlyResponse 'Report views reject mutation attempts'

$missingRpcResponse = Invoke-PostgrestJson -Method POST -Path '/rpc/create_report' -Token $adminToken -Body @{}
Assert-Status $missingRpcResponse @(404) 'No report mutation RPC exists'

Write-Host 'Reports smoke test completed.'
