# Local Backend Development

This backend setup is for local development only. It is not production deployment infrastructure.

The local PostgreSQL container uses `postgres:18-alpine`. It is pinned to the PostgreSQL 18 major line instead of `latest` so local development does not silently jump across major versions.

## Files

```text
backend/
  docker-compose.yml
  .env.example
  postgres/
    init/
    migrations/
    seeds/
  postgrest/
    postgrest.conf.example
  docs/
```

## Start Locally

1. Copy the example environment file:

   ```powershell
   Copy-Item backend/.env.example backend/.env
   ```

2. Replace every placeholder in `backend/.env`.

3. Start manually when needed:

   ```powershell
   docker compose --env-file backend/.env -f backend/docker-compose.yml up -d
   ```

The setup does not auto-start containers.

## Migration Order

Migrations are applied in lexical order during first local PostgreSQL initialization:

```text
001_schemas_roles.sql
002_private_functions.sql
003_customers_table.sql
004_customers_rls_grants.sql
005_auth_tables.sql
006_auth_functions.sql
```

Development seeds are applied only when:

```text
POSTGRES_APPLY_DEV_SEEDS=true
```

## Secrets

Do not commit:

- `backend/.env`
- JWT secrets
- database passwords
- generated tokens
- password hashes

`postgrest.conf.example` contains placeholders only.

## Rollback Guidance

These migrations are forward-only for the initial backend foundation. Do not drop schemas, tables, or roles automatically in a shared database.

For local throwaway development databases, reset by deleting the Docker volume:

```powershell
docker compose --env-file backend/.env -f backend/docker-compose.yml down
docker volume rm daqiq-erp-backend-dev_daqiq_postgres_data
```

Only do this for local disposable data.

## Smoke Tests

After starting the local backend, set the PostgREST base URL. On this Windows development
machine the configured PostgREST port may be `3500` because `3000` can be unavailable:

```powershell
$env:PGRST_BASE_URL = 'http://127.0.0.1:3500'
```

Run the local health check:

```powershell
powershell -ExecutionPolicy Bypass -File backend/postgrest/check-dev-health.ps1
```

Run all smoke tests in dependency order:

```powershell
powershell -ExecutionPolicy Bypass -File backend/postgrest/run-all-smoke-tests.ps1
```

Smoke scripts do not store tokens. Prefer `/rpc/login` with local-only smoke credentials.
Use `backend/postgrest/.env.smoke.example` as a placeholder template. If you copy it to
`backend/postgrest/.env.smoke.ps1`, the health and run-all smoke scripts will auto-load it.
Never commit a real smoke credential file.

See also:

```text
docs/demo-readiness.md
docs/smoke-test-conventions.md
```
