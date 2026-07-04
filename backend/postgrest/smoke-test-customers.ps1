#requires -Version 7.0

[CmdletBinding()]
param(
  [string] $BaseUrl = $env:PGRST_BASE_URL
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
  $BaseUrl = 'http://127.0.0.1:3000'
}

$tokens = @{
  Admin = $env:PGRST_ADMIN_TOKEN
  Manager = $env:PGRST_MANAGER_TOKEN
  Accountant = $env:PGRST_ACCOUNTANT_TOKEN
  Warehouse = $env:PGRST_WAREHOUSE_TOKEN
}

foreach ($entry in $tokens.GetEnumerator()) {
  if ([string]::IsNullOrWhiteSpace($entry.Value)) {
    throw "Missing required environment token: PGRST_$($entry.Key.ToUpperInvariant())_TOKEN"
  }
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
    SkipHttpErrorCheck = $true
  }

  if ($null -ne $Body) {
    $request['ContentType'] = 'application/json'
    $request['Body'] = ($Body | ConvertTo-Json -Depth 8)
  }

  Invoke-WebRequest @request
}

function Assert-Status {
  param(
    [Parameter(Mandatory)] $Response,
    [Parameter(Mandatory)] [int[]] $AllowedStatus,
    [Parameter(Mandatory)] [string] $Name
  )

  if ($AllowedStatus -notcontains [int] $Response.StatusCode) {
    throw "$Name failed. Expected status $($AllowedStatus -join ', '), got $($Response.StatusCode)."
  }

  Write-Host "PASS: $Name"
}

$testCode = ("SMOKE-{0}" -f [Guid]::NewGuid().ToString('N').Substring(0, 12)).ToUpperInvariant()
$managerCode = ("SMOKE-MGR-{0}" -f [Guid]::NewGuid().ToString('N').Substring(0, 8)).ToUpperInvariant()

try {
  $anonymousList = Invoke-Api -Method GET -Path '/customers?limit=1'
  Assert-Status $anonymousList @(401, 403) 'Anonymous customer list fails'

  $adminList = Invoke-Api `
    -Method GET `
    -Path '/customers?order=created_at.desc&id=not.is.null' `
    -Token $tokens.Admin `
    -ExtraHeaders @{ 'Range-Unit' = 'items'; 'Range' = '0-4'; 'Prefer' = 'count=exact' }
  Assert-Status $adminList @(200, 206) 'Admin can list customers'
  if (-not $adminList.Headers['Content-Range']) {
    throw 'Pagination check failed. Content-Range header was not returned.'
  }
  Write-Host 'PASS: List pagination returned Content-Range'

  $create = Invoke-Api `
    -Method POST `
    -Path '/customers' `
    -Token $tokens.Admin `
    -ExtraHeaders @{ Prefer = 'return=representation' } `
    -Body @{
      code = $testCode
      name = 'Smoke Test Customer'
      customer_type = 'corporate'
      credit_limit = 1000
      active = $true
    }
  Assert-Status $create @(201) 'Admin can create customer'
  $created = ($create.Content | ConvertFrom-Json)[0]

  $update = Invoke-Api `
    -Method PATCH `
    -Path "/customers?id=eq.$($created.id)" `
    -Token $tokens.Admin `
    -ExtraHeaders @{ Prefer = 'return=representation' } `
    -Body @{ name = 'Smoke Test Customer Updated' }
  Assert-Status $update @(200) 'Admin can update customer'

  $duplicate = Invoke-Api `
    -Method POST `
    -Path '/customers' `
    -Token $tokens.Admin `
    -ExtraHeaders @{ Prefer = 'return=representation' } `
    -Body @{
      code = $testCode.ToLowerInvariant()
      name = 'Duplicate Smoke Test Customer'
      customer_type = 'corporate'
      active = $true
    }
  Assert-Status $duplicate @(409) 'Duplicate customer code returns conflict'

  $invalidType = Invoke-Api `
    -Method POST `
    -Path '/customers' `
    -Token $tokens.Admin `
    -Body @{
      code = "$testCode-BADTYPE"
      name = 'Invalid Type Smoke Test Customer'
      customer_type = 'invalid'
      active = $true
    }
  Assert-Status $invalidType @(400, 409, 422) 'Invalid customer type fails database validation'

  $invalidIndividualCredit = Invoke-Api `
    -Method POST `
    -Path '/customers' `
    -Token $tokens.Admin `
    -Body @{
      code = "$testCode-BADCREDIT"
      name = 'Invalid Individual Credit Smoke Test Customer'
      customer_type = 'individual'
      credit_limit = 100
      active = $true
    }
  Assert-Status $invalidIndividualCredit @(400, 409, 422) 'Individual customer with credit limit fails database validation'

  $managerCreate = Invoke-Api `
    -Method POST `
    -Path '/customers' `
    -Token $tokens.Manager `
    -ExtraHeaders @{ Prefer = 'return=representation' } `
    -Body @{
      code = $managerCode
      name = 'Manager Smoke Test Customer'
      customer_type = 'corporate'
      active = $true
    }
  Assert-Status $managerCreate @(201) 'Manager can create customer'
  $managerCustomer = ($managerCreate.Content | ConvertFrom-Json)[0]

  $managerUpdate = Invoke-Api `
    -Method PATCH `
    -Path "/customers?id=eq.$($managerCustomer.id)" `
    -Token $tokens.Manager `
    -ExtraHeaders @{ Prefer = 'return=representation' } `
    -Body @{ name = 'Manager Smoke Test Customer Updated' }
  Assert-Status $managerUpdate @(200) 'Manager can update customer'

  $managerDelete = Invoke-Api `
    -Method DELETE `
    -Path "/customers?id=eq.$($managerCustomer.id)" `
    -Token $tokens.Manager
  Assert-Status $managerDelete @(401, 403, 405) 'Manager cannot delete customer'

  $accountantList = Invoke-Api -Method GET -Path '/customers?limit=1' -Token $tokens.Accountant
  Assert-Status $accountantList @(200, 206) 'Accountant can read customers'

  $accountantCreate = Invoke-Api `
    -Method POST `
    -Path '/customers' `
    -Token $tokens.Accountant `
    -Body @{
      code = "$testCode-ACC"
      name = 'Accountant Smoke Test Customer'
      customer_type = 'corporate'
      active = $true
    }
  Assert-Status $accountantCreate @(401, 403, 405) 'Accountant cannot create customer'

  $warehouseList = Invoke-Api -Method GET -Path '/customers?limit=1' -Token $tokens.Warehouse
  Assert-Status $warehouseList @(401, 403) 'Warehouse cannot read customers'

  $adminDelete = Invoke-Api `
    -Method DELETE `
    -Path "/customers?id=eq.$($created.id)" `
    -Token $tokens.Admin
  Assert-Status $adminDelete @(204) 'Admin can delete customer'
}
finally {
  if (-not [string]::IsNullOrWhiteSpace($tokens.Admin)) {
    Invoke-Api `
      -Method DELETE `
      -Path "/customers?code=like.SMOKE-*" `
      -Token $tokens.Admin | Out-Null
  }
}
