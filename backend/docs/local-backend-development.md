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
   docker compose --env-file backend/.env -f backend/docker-compose.yml up
   ```

The setup does not auto-start containers.

## Migration Order

Migrations are applied in lexical order during first local PostgreSQL initialization:

```text
001_schemas_roles.sql
002_private_functions.sql
003_customers_table.sql
004_customers_rls_grants.sql
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

After starting the local backend and obtaining locally signed test JWTs, export tokens through environment variables:

```powershell
$env:PGRST_ADMIN_TOKEN = '<local-admin-test-token>'
$env:PGRST_MANAGER_TOKEN = '<local-manager-test-token>'
$env:PGRST_ACCOUNTANT_TOKEN = '<local-accountant-test-token>'
$env:PGRST_WAREHOUSE_TOKEN = '<local-warehouse-test-token>'
$env:PGRST_BASE_URL = 'http://127.0.0.1:3000'
```

Then run:

```powershell
pwsh backend/postgrest/smoke-test-customers.ps1
```

The script does not store tokens. It creates records with a `SMOKE-` code prefix and cleans them up with the admin token.
