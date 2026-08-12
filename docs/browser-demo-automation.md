# Browser Demo Automation

This guide explains the browser-level demo smoke test for Daqiq ERP.

Backend smoke tests prove business rules and PostgreSQL/PostgREST security. The browser demo smoke proves that the Angular app can open, log in, navigate major modules, enforce a representative authorization boundary, and log out.

## Local Environment

Start from the placeholder file:

```powershell
Get-Content e2e/.env.e2e.example
```

For repeatable local runs, copy it to the ignored local file:

```powershell
Copy-Item e2e/.env.e2e.example e2e/.env.e2e.ps1
```

Then edit `e2e/.env.e2e.ps1` locally.

Required variables:

```powershell
$env:ERP_APP_BASE_URL = "http://localhost:4200"
$env:PGRST_BASE_URL = "http://127.0.0.1:3500"
$env:SMOKE_ADMIN_EMAIL = "<local admin email>"
$env:SMOKE_ADMIN_PASSWORD = "<local admin password>"
$env:SMOKE_VIEWER_EMAIL = "<local viewer email>"
$env:SMOKE_VIEWER_PASSWORD = "<local viewer password>"
```

Never commit passwords, JWTs, refresh tokens, or generated reports containing sensitive values.

## Run The Browser Smoke

Headless:

```powershell
npm run e2e:demo
```

Headed, useful before a presentation:

```powershell
npm run e2e:demo:headed
```

Combined demo check:

```powershell
npm run demo:check
```

`demo:check` runs backend health, builds Angular, and then runs the browser demo smoke.

## What It Verifies

The browser smoke:

1. opens the Angular application
2. logs in as admin through the real `/rpc/login` path
3. verifies the shell loads
4. navigates the major ERP route map
5. verifies Persian page headings
6. logs out through the shell logout action
7. logs in as viewer
8. verifies viewer is blocked from admin-only user management

Covered admin routes:

```text
Dashboard
Customers
Products
Suppliers
Warehouses
Inventory balances
Inventory movements
Purchase orders
Goods receipts
Supplier invoices
Sales orders
Sales deliveries
Sales invoices
Chart of accounts
Journal entries
General ledger
Cash/bank accounts
Customer receipts
Supplier payments
Settlement overview
Audit logs
Users
Settings
Lookups
Feature flags
```

## Screenshots And Evidence

Playwright is configured to keep evidence on failure:

```text
test-results/
playwright-report/
```

These folders are ignored by Git. To inspect the latest report:

```powershell
npx playwright show-report
```

For a presenter rehearsal, use headed mode and keep the terminal output as the run record.

## Browser Notes

The config defaults to the local Chrome channel:

```powershell
$env:PLAYWRIGHT_BROWSER_CHANNEL = "chrome"
```

If Chrome is not installed or Playwright cannot launch it, install Playwright browsers locally:

```powershell
npx playwright install chromium
```

Then set:

```powershell
$env:PLAYWRIGHT_BROWSER_CHANNEL = ""
```

## Proxy Notes

Angular dev server now uses `apps/erp-shell/proxy.conf.cjs`, which reads:

```text
PGRST_BASE_URL
POSTGREST_BASE_URL
```

This prevents the old demo failure where the frontend proxy always tried `127.0.0.1:3000` while PostgREST was actually running on `127.0.0.1:3500`.

## Troubleshooting

```text
Login fails              Check PGRST_BASE_URL and smoke credentials.
Connection refused       Backend or Angular dev server is not running, or localhost/127.0.0.1 binding differs.
404 on /api/rpc/login    Angular proxy target is wrong or PostgREST is down.
Access denied too early  The selected role does not have the route permission.
Chrome launch failure    Try headed mode, clear Playwright cache, or install Chromium.
```
