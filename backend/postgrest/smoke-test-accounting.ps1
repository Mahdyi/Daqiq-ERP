param(
  [string]$BaseUrl = $env:POSTGREST_BASE_URL,
  [string]$AdminToken = $env:ERP_ADMIN_TOKEN,
  [string]$AccountantToken = $env:ERP_ACCOUNTANT_TOKEN,
  [string]$ManagerToken = $env:ERP_MANAGER_TOKEN,
  [string]$WarehouseToken = $env:ERP_WAREHOUSE_TOKEN
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
  $BaseUrl = 'http://127.0.0.1:3400'
}

function New-AuthHeaders([string]$Token) {
  if ([string]::IsNullOrWhiteSpace($Token)) {
    throw 'Required smoke-test token is missing. Provide tokens through local environment variables only.'
  }

  return @{
    Authorization = "Bearer $Token"
    Prefer = 'count=exact'
  }
}

function Invoke-ExpectedFailure([scriptblock]$Call, [string]$Name) {
  try {
    & $Call | Out-Null
    throw "$Name unexpectedly succeeded."
  } catch {
    Write-Host "PASS expected failure: $Name"
  }
}

$accountantHeaders = New-AuthHeaders $AccountantToken
$managerHeaders = New-AuthHeaders $ManagerToken
$warehouseHeaders = New-AuthHeaders $WarehouseToken

Write-Host 'Checking chart of accounts access...'
$accounts = Invoke-RestMethod -Method Get -Uri "$BaseUrl/gl_account_view?select=id,account_code,account_name&order=account_code.asc" -Headers $accountantHeaders
$debitAccount = $accounts | Where-Object { $_.account_code -eq '1000' } | Select-Object -First 1
$creditAccount = $accounts | Where-Object { $_.account_code -eq '3000' } | Select-Object -First 1

if ($null -eq $debitAccount -or $null -eq $creditAccount) {
  throw 'Required seed GL accounts were not found.'
}

Write-Host 'Creating balanced manual journal...'
$journalBody = @{
  journal_date = (Get-Date -Format 'yyyy-MM-dd')
  description = 'Accounting smoke test journal'
  currency_lookup_value_id = $null
  lines = @(
    @{
      accountId = $debitAccount.id
      description = 'Smoke debit'
      debitAmount = 100
      creditAmount = 0
    },
    @{
      accountId = $creditAccount.id
      description = 'Smoke credit'
      debitAmount = 0
      creditAmount = 100
    }
  )
} | ConvertTo-Json -Depth 6

$journal = Invoke-RestMethod -Method Post -Uri "$BaseUrl/rpc/create_manual_journal_entry" -Headers $accountantHeaders -Body $journalBody -ContentType 'application/json'
if ($journal.statusCode -ne 'draft') {
  throw 'Manual journal was not created as draft.'
}

Write-Host 'Posting balanced journal...'
$posted = Invoke-RestMethod -Method Post -Uri "$BaseUrl/rpc/post_journal_entry" -Headers $accountantHeaders -Body (@{ journal_entry_id = $journal.id } | ConvertTo-Json) -ContentType 'application/json'
if ($posted.statusCode -ne 'posted') {
  throw 'Manual journal was not posted.'
}

Write-Host 'Verifying manager cannot post...'
Invoke-ExpectedFailure {
  Invoke-RestMethod -Method Post -Uri "$BaseUrl/rpc/post_journal_entry" -Headers $managerHeaders -Body (@{ journal_entry_id = $posted.id } | ConvertTo-Json) -ContentType 'application/json'
} 'manager post journal'

Write-Host 'Verifying warehouse cannot read accounting...'
Invoke-ExpectedFailure {
  Invoke-RestMethod -Method Get -Uri "$BaseUrl/gl_account_view?select=id&limit=1" -Headers $warehouseHeaders
} 'warehouse read chart'

Write-Host 'Checking general ledger contains posted journal...'
$ledger = Invoke-RestMethod -Method Get -Uri "$BaseUrl/general_ledger_view?journal_number=eq.$($posted.journalNumber)&select=journal_number,account_code,debit_amount,credit_amount" -Headers $accountantHeaders
if (($ledger | Measure-Object).Count -lt 2) {
  throw 'General ledger did not expose posted journal lines.'
}

Write-Host 'Accounting smoke test completed.'
