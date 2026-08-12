# GitHub Cleanup Guide

Use this guide before publishing, pushing, or sharing the Daqiq ERP repository.

## 1. Files Safe To Commit

Safe:

- source code under `apps/` and `libs/`
- SQL migrations and development seed scripts
- documentation under `docs/` and `backend/docs/`
- placeholder `.example` environment files
- smoke-test scripts
- Playwright specs
- sanitized screenshots intentionally placed under `docs/screenshots/`

## 2. Files Never To Commit

Never commit:

- `backend/.env`
- `backend/postgrest/.env.smoke.ps1`
- `e2e/.env.e2e.ps1`
- real JWTs
- real access tokens
- real refresh tokens
- real passwords
- real JWT secrets
- database dumps with private data
- local Docker volumes
- `node_modules`
- `dist`
- Playwright traces/screenshots unless intentionally sanitized
- screenshots showing credentials or private records

## 3. Local Env Files

Tracked examples:

- `backend/.env.example`
- `backend/postgrest/.env.smoke.example`
- `e2e/.env.e2e.example`

Local-only files:

- `backend/.env`
- `backend/postgrest/.env.smoke.ps1`
- `e2e/.env.e2e.ps1`

Local files must contain only local development values and must remain ignored.

## 4. Smoke Credentials

Smoke tests should read credentials from environment variables or ignored local scripts.

Do not paste credentials into:

- README
- docs
- source files
- screenshots
- issue comments
- commit messages

## 5. Docker And Local Ports

Local PostgREST may run on:

```text
http://127.0.0.1:3500
```

Angular may run on:

```text
http://localhost:4200
```

Port `3000` or `3400` may be unavailable on Windows. Use `PGRST_BASE_URL` instead of hard-coding a port.

## 6. Screenshots And Demo Media Policy

Screenshots are useful for portfolio presentation, but sanitize them first.

Do not include:

- passwords
- tokens
- private customer data
- private supplier data
- real financial data
- browser devtools with Authorization headers
- local `.env` files

Prefer:

- seeded fictional data
- neutral records
- cropped UI screenshots
- short captions explaining the business flow

## 7. Commit Checklist

Before committing:

```powershell
git status --short
npm run build
npm run health:backend
npm run e2e:demo
```

If local credentials are available:

```powershell
npm run smoke:backend
```

Scan for obvious secrets:

```powershell
Select-String -Path "backend/**/*.sql","backend/**/*.md","backend/**/*.ps1","docs/**/*.md","apps/**/*.ts","libs/**/*.ts","e2e/**/*.ts","e2e/**/*.ps1" -Pattern "Bearer eyJ|accessToken: '|refreshToken: '|jwt_secret|PGRST_JWT_SECRET"
```

Review all matches manually.

## 8. Pre-Push Checklist

Before pushing to GitHub:

- README describes prototype/MVP status honestly
- demo docs are linked
- local `.env` files are absent from `git status`
- no generated reports are staged
- no private screenshots are staged
- build passes
- browser smoke passes
- backend health passes
- backend smoke tests pass if local credentials are available

## 9. GitIgnore Expectations

The repository ignores:

```text
node_modules
dist
coverage
playwright-report
test-results
backend/.env
backend/postgrest/.env.smoke.ps1
e2e/.env.e2e.ps1
```

Keep `.example` files tracked and real environment files ignored.
