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
    [object] $Body
  )

  $headers = @{}

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
    $request['Body'] = ($Body | ConvertTo-Json -Depth 10)
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

function Login-User {
  param(
    [Parameter(Mandatory)] [string] $Email,
    [Parameter(Mandatory)] [string] $Password
  )

  $response = Invoke-Api `
    -Method POST `
    -Path '/rpc/login' `
    -Body @{
      email = $Email
      password = $Password
    }

  Assert-Status $response @(200) "Login succeeds for $Email"
  $response.Content | ConvertFrom-Json
}

function Assert-NoSensitiveContent {
  param(
    [Parameter(Mandatory)] [string] $Content,
    [Parameter(Mandatory)] [string] $Name
  )

  if ($Content -match 'Bearer eyJ|accessToken|refreshToken|jwt_secret|password_hash|refresh_token_hash') {
    throw "$Name leaked sensitive content."
  }

  Write-Host "PASS: $Name has no sensitive content"
}

$admin = Login-User -Email 'admin@erp.com' -Password 'admin'
$manager = Login-User -Email 'manager@erp.com' -Password 'manager'
$sales = Login-User -Email 'sales@erp.com' -Password 'sales'

$adminSettings = Invoke-Api `
  -Method POST `
  -Path '/rpc/admin_list_system_settings' `
  -Token $admin.accessToken `
  -Body @{
    page_number = 1
    page_size = 20
  }
Assert-Status $adminSettings @(200) 'Admin can list settings'
Assert-NoSensitiveContent -Content $adminSettings.Content -Name 'Settings response'

$managerSettings = Invoke-Api `
  -Method POST `
  -Path '/rpc/admin_list_system_settings' `
  -Token $manager.accessToken `
  -Body @{
    page_number = 1
    page_size = 20
  }
Assert-Status $managerSettings @(200) 'Manager can list settings'

$salesSettings = Invoke-Api `
  -Method POST `
  -Path '/rpc/admin_list_system_settings' `
  -Token $sales.accessToken `
  -Body @{
    page_number = 1
    page_size = 20
  }
Assert-Status $salesSettings @(401, 403, 404) 'Sales cannot list settings'

$updateSetting = Invoke-Api `
  -Method POST `
  -Path '/rpc/admin_update_system_setting' `
  -Token $admin.accessToken `
  -Body @{
    setting_key = 'ui.defaultPageSize'
    setting_value = 25
  }
Assert-Status $updateSetting @(200) 'Admin can update editable setting'

$managerUpdateSetting = Invoke-Api `
  -Method POST `
  -Path '/rpc/admin_update_system_setting' `
  -Token $manager.accessToken `
  -Body @{
    setting_key = 'ui.defaultPageSize'
    setting_value = 20
  }
Assert-Status $managerUpdateSetting @(401, 403, 404) 'Manager cannot update setting'

$nonEditableUpdate = Invoke-Api `
  -Method POST `
  -Path '/rpc/admin_update_system_setting' `
  -Token $admin.accessToken `
  -Body @{
    setting_key = 'system.releaseChannel'
    setting_value = 'stable'
  }
Assert-Status $nonEditableUpdate @(400, 401, 403) 'Non-editable setting cannot be updated'

$secretValueUpdate = Invoke-Api `
  -Method POST `
  -Path '/rpc/admin_update_system_setting' `
  -Token $admin.accessToken `
  -Body @{
    setting_key = 'company.name'
    setting_value = 'secret-value'
  }
Assert-Status $secretValueUpdate @(400) 'Secret-like setting value is rejected'

$lookupTypes = Invoke-Api `
  -Method POST `
  -Path '/rpc/admin_list_lookup_types' `
  -Token $admin.accessToken `
  -Body @{
    page_number = 1
    page_size = 50
  }
Assert-Status $lookupTypes @(200) 'Admin can list lookup types'

$lookupValues = Invoke-Api `
  -Method POST `
  -Path '/rpc/admin_list_lookup_values' `
  -Token $admin.accessToken `
  -Body @{
    lookup_type_code = 'unit'
    page_number = 1
    page_size = 20
  }
Assert-Status $lookupValues @(200) 'Admin can list lookup values'

$suffix = [Guid]::NewGuid().ToString('N').Substring(0, 10)
$lookupCode = "smoke_$suffix"

$createdLookup = Invoke-Api `
  -Method POST `
  -Path '/rpc/admin_create_lookup_value' `
  -Token $admin.accessToken `
  -Body @{
    lookup_type_code = 'unit'
    lookup_code = $lookupCode
    lookup_label = 'Smoke Unit'
    lookup_description = 'Development smoke value'
    lookup_sort_order = 99
    lookup_metadata = @{ source = 'smoke' }
    lookup_active = $true
  }
Assert-Status $createdLookup @(200) 'Admin can create lookup value'
$createdLookupValue = $createdLookup.Content | ConvertFrom-Json

$updatedLookup = Invoke-Api `
  -Method POST `
  -Path '/rpc/admin_update_lookup_value' `
  -Token $admin.accessToken `
  -Body @{
    value_id = $createdLookupValue.id
    lookup_code = $lookupCode
    lookup_label = 'Smoke Unit Updated'
    lookup_description = 'Updated development smoke value'
    lookup_sort_order = 100
    lookup_metadata = @{ source = 'smoke-updated' }
    lookup_active = $true
  }
Assert-Status $updatedLookup @(200) 'Admin can update lookup value'

$deactivatedLookup = Invoke-Api `
  -Method POST `
  -Path '/rpc/admin_set_lookup_value_active' `
  -Token $admin.accessToken `
  -Body @{
    value_id = $createdLookupValue.id
    active = $false
  }
Assert-Status $deactivatedLookup @(200) 'Admin can deactivate lookup value'

$managerMutation = Invoke-Api `
  -Method POST `
  -Path '/rpc/admin_create_lookup_value' `
  -Token $manager.accessToken `
  -Body @{
    lookup_type_code = 'unit'
    lookup_code = "manager_$suffix"
    lookup_label = 'Manager Value'
    lookup_description = $null
    lookup_sort_order = 1
    lookup_metadata = @{}
    lookup_active = $true
  }
Assert-Status $managerMutation @(401, 403, 404) 'Manager cannot mutate lookup values'

$flags = Invoke-Api `
  -Method POST `
  -Path '/rpc/admin_list_feature_flags' `
  -Token $admin.accessToken `
  -Body @{
    page_number = 1
    page_size = 20
  }
Assert-Status $flags @(200) 'Admin can list feature flags'

$updatedFlag = Invoke-Api `
  -Method POST `
  -Path '/rpc/admin_update_feature_flag' `
  -Token $admin.accessToken `
  -Body @{
    flag_key = 'reports.enabled'
    enabled = $true
  }
Assert-Status $updatedFlag @(200) 'Admin can update feature flag'

$managerFlagUpdate = Invoke-Api `
  -Method POST `
  -Path '/rpc/admin_update_feature_flag' `
  -Token $manager.accessToken `
  -Body @{
    flag_key = 'reports.enabled'
    enabled = $false
  }
Assert-Status $managerFlagUpdate @(401, 403, 404) 'Manager cannot update feature flag'

$auditList = Invoke-Api `
  -Method POST `
  -Path '/rpc/admin_list_audit_logs' `
  -Token $admin.accessToken `
  -Body @{
    page_number = 1
    page_size = 100
  }
Assert-Status $auditList @(200) 'Admin can list audit logs after configuration changes'

$auditPayload = $auditList.Content | ConvertFrom-Json
$actions = @($auditPayload.items | ForEach-Object { $_.action })

foreach ($expectedAction in @(
  'system_setting.updated',
  'lookup_value.created',
  'lookup_value.updated',
  'lookup_value.deactivated',
  'feature_flag.updated'
)) {
  if ($actions -notcontains $expectedAction) {
    throw "Expected audit action $expectedAction was not found."
  }

  Write-Host "PASS: Audit action $expectedAction exists"
}
