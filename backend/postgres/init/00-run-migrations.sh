#!/usr/bin/env sh
set -eu

: "${POSTGRES_DB:?POSTGRES_DB is required}"
: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${PGRST_DB_AUTHENTICATOR_PASSWORD:?PGRST_DB_AUTHENTICATOR_PASSWORD is required}"

for migration in /migrations/*.sql; do
  echo "Applying migration: ${migration}"
  psql \
    --username "${POSTGRES_USER}" \
    --dbname "${POSTGRES_DB}" \
    --set ON_ERROR_STOP=1 \
    --file "${migration}"
done

psql \
  --username "${POSTGRES_USER}" \
  --dbname "${POSTGRES_DB}" \
  --set ON_ERROR_STOP=1 \
  --set authenticator_password="${PGRST_DB_AUTHENTICATOR_PASSWORD}" <<'SQL'
ALTER ROLE authenticator WITH PASSWORD :'authenticator_password';
SQL

if [ "${POSTGRES_APPLY_DEV_SEEDS:-false}" = "true" ]; then
  for seed in /seeds/*.sql; do
    echo "Applying development seed: ${seed}"
    psql \
      --username "${POSTGRES_USER}" \
      --dbname "${POSTGRES_DB}" \
      --set ON_ERROR_STOP=1 \
      --file "${seed}"
  done
fi
