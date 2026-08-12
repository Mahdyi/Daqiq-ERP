# Daqiq ERP Demo Readiness

This guide is for local product demonstrations. It is not production deployment documentation.

## 1. Start Backend

From the repository root:

```powershell
docker compose --env-file backend/.env -f backend/docker-compose.yml up -d
```

Check containers:

```powershell
docker ps
```

Expected local containers:

```text
daqiq-erp-postgres-dev
daqiq-erp-postgrest-dev
```

## 2. Configure PostgREST Base URL

This Windows machine currently uses PostgREST on port `3500`:

```powershell
$env:PGRST_BASE_URL = "http://127.0.0.1:3500"
```

The scripts default to `http://127.0.0.1:3000` when `PGRST_BASE_URL` is not set.

## 3. Verify Backend Health

```powershell
npm run health:backend
```

or:

```powershell
powershell -ExecutionPolicy Bypass -File backend/postgrest/check-dev-health.ps1
```

With admin smoke credentials present, the health check also verifies key views:

```text
customers
products
inventory movements
journal entries
general ledger
cash/bank accounts
```

## 4. Smoke-Test Credentials

Use local environment variables only. Do not commit passwords or tokens.

Start from:

```powershell
Get-Content backend/postgrest/.env.smoke.example
```

Set local values in your own PowerShell session. For repeatable local runs, copy the example
to `backend/postgrest/.env.smoke.ps1`; the health and run-all smoke scripts auto-load that
file when it exists. The real `.env.smoke.ps1` file is git-ignored and must stay local.

```powershell
$env:SMOKE_ADMIN_EMAIL = "admin@erp.com"
$env:SMOKE_ADMIN_PASSWORD = "<local only>"
```

Repeat for accountant, manager, warehouse, sales, and viewer.

## 5. Run All Smoke Tests

```powershell
npm run smoke:backend
```

or:

```powershell
powershell -ExecutionPolicy Bypass -File backend/postgrest/run-all-smoke-tests.ps1
```

To continue after failures and see a full failure summary:

```powershell
powershell -ExecutionPolicy Bypass -File backend/postgrest/run-all-smoke-tests.ps1 -ContinueOnFailure
```

## 6. Build Angular

Fast app build:

```powershell
npm run build
```

Full dependency-order build:

```powershell
npm run build:all
```

The full build covers:

```text
core
shared
ui
feature-auth
feature-dashboard
feature-customers
feature-users
feature-audit
feature-settings
feature-products
feature-suppliers
feature-warehouses
feature-inventory
feature-purchasing
feature-sales
feature-accounting
feature-payments
erp-shell
```

## 7. Start Angular

```powershell
npm start
```

Open:

```text
http://localhost:4200
```

## 7A. Run Browser Demo Smoke

Use Playwright to verify that the browser UI can log in, open the major demo routes, enforce a representative permission boundary, and log out:

```powershell
npm run e2e:demo
```

For a visible rehearsal:

```powershell
npm run e2e:demo:headed
```

See:

```text
docs/browser-demo-automation.md
docs/ui-demo-checklist.md
docs/presenter-script.md
```

## 8. Demo Users And Roles

Local development users are seeded only in local/dev environments. Typical roles:

```text
admin
manager
accountant
sales
warehouse
viewer
```

Use the credentials configured in your local seed or smoke environment. Never place real credentials in documentation, source code, screenshots, or presentation notes.

## 9. Suggested Demo Flow

1. Log in as admin.
2. Open the dashboard.
3. Show master data: customers, products, suppliers, warehouses.
4. Show inventory balances and stock movements.
5. Show purchase order to goods receipt to supplier invoice.
6. Show sales order to delivery to sales invoice.
7. Show chart of accounts, journal entries, and general ledger.
8. Show customer receipt and supplier payment.
9. Show audit log for security and business activity.
10. Switch roles if needed to show permission-aware navigation.

## 10. Port Troubleshooting

If `127.0.0.1:3000` fails, check whether the port is unavailable or excluded:

```powershell
netsh interface ipv4 show excludedportrange protocol=tcp
```

Use the configured local PostgREST port:

```powershell
Select-String -Path backend/.env -Pattern '^POSTGREST_PORT='
```

Then set:

```powershell
$env:PGRST_BASE_URL = "http://127.0.0.1:<port>"
```

If PostGREST is running but new RPCs/views are not visible:

```powershell
docker kill --signal=SIGUSR1 daqiq-erp-postgrest-dev
```

## 11. Demo Data Strategy

A destructive one-click reset is intentionally deferred. For local demos, use the smoke tests to prepare data through real business flows:

```powershell
powershell -ExecutionPolicy Bypass -File backend/postgres/prepare-demo-data.ps1 -RunSmokeFixtures
```

This creates demo records through the same secure APIs and RLS policies that the product uses.

## 12. Known Limitations

Not implemented yet:

```text
bank reconciliation
payment gateway integration
financial statements
approval workflow
lot/serial tracking
PDF printing
email sending
production identity provider
production deployment pipeline
```

Manual browser verification should still be performed before a real sales presentation.
