# UI Demo Checklist

Use this checklist before presenting Daqiq ERP.

## Before Demo

1. Start backend:

```powershell
docker compose --env-file backend/.env -f backend/docker-compose.yml up -d
```

2. Set PostgREST URL:

```powershell
$env:PGRST_BASE_URL = "http://127.0.0.1:3500"
```

3. Confirm smoke credentials are local-only:

```powershell
Test-Path backend/postgrest/.env.smoke.ps1
Test-Path e2e/.env.e2e.ps1
```

4. Run backend health:

```powershell
npm run health:backend
```

5. Run backend smoke tests:

```powershell
npm run smoke:backend
```

6. Build Angular:

```powershell
npm run build
```

7. Run browser smoke:

```powershell
npm run e2e:demo
```

8. Optional rehearsal with visible browser:

```powershell
npm run e2e:demo:headed
```

9. Start Angular dev server:

```powershell
npm start
```

10. Open:

```text
http://127.0.0.1:4200
```

If the browser smoke cannot reach `127.0.0.1:4200`, use:

```powershell
$env:ERP_APP_BASE_URL = "http://localhost:4200"
```

## During Demo

Follow `docs/presenter-script.md`.

Suggested order:

```text
login
dashboard
master data
inventory
purchase-to-pay
order-to-cash
accounting
payments
audit/security
settings/users
logout
```

Avoid destructive changes unless the demo data has been prepared for it.

After major operations, show the audit log to reinforce traceability.

## After Demo

Capture:

```text
questions
bugs
slow pages
confusing labels
missing business terms
permission surprises
```

If demo data needs refresh:

```powershell
powershell -ExecutionPolicy Bypass -File backend/postgres/prepare-demo-data.ps1 -RunSmokeFixtures
```

## Known Local Issues

```text
ChromeHeadless may fail locally due Windows/GPU/cache launcher issues.
PostgREST currently uses 3500 on this machine.
Port 3000 may be unavailable.
Port 3400 may be inside a Windows excluded TCP range.
Angular proxy follows PGRST_BASE_URL through proxy.conf.cjs.
Browser smoke defaults to localhost:4200 because Angular may bind IPv6 loopback on Windows.
```

## Do Not Commit

```text
backend/postgrest/.env.smoke.ps1
e2e/.env.e2e.ps1
playwright-report/
test-results/
screenshots with visible credentials
tokens
passwords
```
