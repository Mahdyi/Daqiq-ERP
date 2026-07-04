BEGIN;

CREATE TABLE IF NOT EXISTS api.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  customer_type text NOT NULL,
  credit_limit numeric(14, 2),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  CONSTRAINT customers_code_not_blank CHECK (length(btrim(code)) > 0),
  CONSTRAINT customers_name_not_blank CHECK (length(btrim(name)) > 0),
  CONSTRAINT customers_type_valid CHECK (customer_type IN ('individual', 'corporate')),
  CONSTRAINT customers_credit_limit_non_negative CHECK (credit_limit IS NULL OR credit_limit >= 0),
  CONSTRAINT customers_individual_credit_limit_null CHECK (
    customer_type <> 'individual' OR credit_limit IS NULL
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS customers_code_ci_uq
  ON api.customers (lower(btrim(code)));

CREATE INDEX IF NOT EXISTS customers_name_ci_idx
  ON api.customers (lower(btrim(name)));

CREATE INDEX IF NOT EXISTS customers_active_idx
  ON api.customers (active);

CREATE INDEX IF NOT EXISTS customers_list_order_idx
  ON api.customers (created_at DESC, id);

DROP TRIGGER IF EXISTS set_customers_updated_at ON api.customers;

CREATE TRIGGER set_customers_updated_at
BEFORE UPDATE ON api.customers
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

REVOKE ALL ON TABLE api.customers FROM PUBLIC;

COMMIT;
