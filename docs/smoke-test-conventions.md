# Smoke-Test Conventions

This document defines the standard pattern for Daqiq ERP PostgREST smoke tests.

## Required Basics

Every smoke test should:

```text
support PGRST_BASE_URL
default to http://127.0.0.1:3000
auto-load backend/postgrest/.env.smoke.ps1 when using shared runners
use /rpc/login to acquire tokens when credentials are present
accept ERP_<ROLE>_TOKEN as a local-only fallback
never commit passwords, JWTs, refresh tokens, access tokens, or secrets
use Set-StrictMode -Version Latest
use -UseBasicParsing with Invoke-WebRequest
return non-zero exit code on failure
print clear PASS/FAIL/SKIP messages
```

## Local Credentials

Use local environment variables:

```text
SMOKE_ADMIN_EMAIL
SMOKE_ADMIN_PASSWORD
SMOKE_ACCOUNTANT_EMAIL
SMOKE_ACCOUNTANT_PASSWORD
SMOKE_MANAGER_EMAIL
SMOKE_MANAGER_PASSWORD
SMOKE_WAREHOUSE_EMAIL
SMOKE_WAREHOUSE_PASSWORD
SMOKE_SALES_EMAIL
SMOKE_SALES_PASSWORD
SMOKE_VIEWER_EMAIL
SMOKE_VIEWER_PASSWORD
```

Token variables are allowed only for local shells:

```text
ERP_ADMIN_TOKEN
ERP_ACCOUNTANT_TOKEN
ERP_MANAGER_TOKEN
ERP_WAREHOUSE_TOKEN
ERP_SALES_TOKEN
ERP_VIEWER_TOKEN
```

## Response Handling

Scripts must check HTTP status before reading JSON properties.

Use strict-mode-safe collection handling:

```powershell
$items = @($response.Json)
```

When a test needs a field, validate that the field exists before using it. Error JSON must never be treated as a successful data row.

## URL Interpolation

Prefer safe interpolation when a variable touches a PostgREST query string:

```powershell
"/view_name?id=eq.$($row.id)&limit=1"
```

Avoid ambiguous strings such as:

```powershell
"/view_name?id=eq.$row.id"
```

## Fixtures

Smoke tests should either:

```text
create deterministic fresh fixtures through real business RPCs
or explicitly document required existing seed records
```

Repeated runs should not fail merely because a previous run consumed a fixture. Payments and accounting tests create fresh invoice fixtures for this reason.

## Temporary Mutations

When a script temporarily changes state, it must restore it before exit when feasible. Examples:

```text
closing and reopening an accounting period
creating a temporary smoke user and deactivating it
creating smoke records with clear prefixes
```

## Negative Authorization Tests

PostgREST may return `403` or may hide an RPC from a role and return `404/PGRST202` when the role lacks `EXECUTE`. For negative permission tests, accepting `404` can be legitimate when the intent is “the role cannot use this function.”

## Step 33/34 Debugging Lessons

Common local failures and meanings:

```text
missing env vars               smoke credentials were not set in the current shell
connection refused             PostGREST is not running or PGRST_BASE_URL points to the wrong port
PGRST202 schema cache           reload PostGREST schema cache after migrations/grants
permission denied for function  a view/RPC calls a helper without narrow EXECUTE grants
property not found              the script read an error/unexpected JSON object as a data row
nullable fixture                test data was consumed or not prepared deterministically
PowerShell parsing prompt       Invoke-WebRequest needs -UseBasicParsing on Windows PowerShell 5
```

These are engineering learnings, not blame. Future smoke tests should be hardened before they become part of the demo path.
