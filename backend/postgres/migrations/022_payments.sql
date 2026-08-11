BEGIN;

INSERT INTO api.lookup_types (code, name, description, system, active)
VALUES
  ('cash_bank_account_type', 'نوع حساب نقد و بانک', NULL, true, true),
  ('payment_method', 'روش پرداخت', NULL, true, true),
  ('payment_status', 'وضعیت پرداخت', NULL, true, true)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    active = true;

WITH account_type AS (
  SELECT id FROM api.lookup_types WHERE code = 'cash_bank_account_type'
)
INSERT INTO api.lookup_values (lookup_type_id, code, label, sort_order, metadata, system, active)
SELECT account_type.id, item.code, item.label, item.sort_order, '{}'::jsonb, true, true
FROM account_type
CROSS JOIN (
  VALUES
    ('cash', 'صندوق', 10),
    ('bank', 'بانک', 20)
) AS item(code, label, sort_order)
ON CONFLICT (lookup_type_id, code) DO UPDATE
SET label = EXCLUDED.label,
    sort_order = EXCLUDED.sort_order,
    active = true;

WITH method_type AS (
  SELECT id FROM api.lookup_types WHERE code = 'payment_method'
)
INSERT INTO api.lookup_values (lookup_type_id, code, label, sort_order, metadata, system, active)
SELECT method_type.id, item.code, item.label, item.sort_order, '{}'::jsonb, true, true
FROM method_type
CROSS JOIN (
  VALUES
    ('cash', 'نقدی', 10),
    ('bank_transfer', 'حواله بانکی', 20),
    ('card', 'کارت', 30),
    ('cheque', 'چک', 40),
    ('other', 'سایر', 50)
) AS item(code, label, sort_order)
ON CONFLICT (lookup_type_id, code) DO UPDATE
SET label = EXCLUDED.label,
    sort_order = EXCLUDED.sort_order,
    active = true;

WITH status_type AS (
  SELECT id FROM api.lookup_types WHERE code = 'payment_status'
)
INSERT INTO api.lookup_values (lookup_type_id, code, label, sort_order, metadata, system, active)
SELECT status_type.id, item.code, item.label, item.sort_order, '{}'::jsonb, true, true
FROM status_type
CROSS JOIN (
  VALUES
    ('draft', 'پیش‌نویس', 10),
    ('posted', 'ثبت‌شده', 20),
    ('cancelled', 'لغوشده', 30)
) AS item(code, label, sort_order)
ON CONFLICT (lookup_type_id, code) DO UPDATE
SET label = EXCLUDED.label,
    sort_order = EXCLUDED.sort_order,
    active = true;

WITH source_type AS (
  SELECT id FROM api.lookup_types WHERE code = 'journal_source_type'
)
INSERT INTO api.lookup_values (lookup_type_id, code, label, sort_order, metadata, system, active)
SELECT source_type.id, item.code, item.label, item.sort_order, '{}'::jsonb, true, true
FROM source_type
CROSS JOIN (
  VALUES
    ('customer_receipt', 'دریافت مشتری', 40),
    ('supplier_payment', 'پرداخت تأمین‌کننده', 50)
) AS item(code, label, sort_order)
ON CONFLICT (lookup_type_id, code) DO UPDATE
SET label = EXCLUDED.label,
    sort_order = EXCLUDED.sort_order,
    active = true;

ALTER TABLE api.accounting_source_links
  DROP CONSTRAINT IF EXISTS accounting_source_links_source_type_valid;

ALTER TABLE api.accounting_source_links
  ADD CONSTRAINT accounting_source_links_source_type_valid
  CHECK (source_type IN ('sales_invoice', 'supplier_invoice', 'customer_receipt', 'supplier_payment'));

INSERT INTO api.system_settings (
  setting_key,
  setting_value,
  value_type,
  category,
  label,
  description,
  editable,
  active
)
VALUES
  ('documents.customerReceiptPrefix', '"CR"'::jsonb, 'string', 'documents', 'پیشوند دریافت مشتری', 'پیشوند شماره‌گذاری دریافت‌های مشتریان', true, true),
  ('documents.supplierPaymentPrefix', '"SP"'::jsonb, 'string', 'documents', 'پیشوند پرداخت تأمین‌کننده', 'پیشوند شماره‌گذاری پرداخت‌های تأمین‌کنندگان', true, true)
ON CONFLICT (setting_key) DO UPDATE
SET label = EXCLUDED.label,
    description = EXCLUDED.description,
    active = true;

INSERT INTO api.feature_flags (flag_key, enabled, label, description, category)
VALUES ('payments.enabled', true, 'دریافت و پرداخت', 'فعال‌سازی قابلیت‌های پایه دریافت و پرداخت', 'payments')
ON CONFLICT (flag_key) DO UPDATE
SET enabled = true,
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    category = EXCLUDED.category;

CREATE TABLE IF NOT EXISTS api.cash_bank_accounts (
  id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
  account_code text NOT NULL,
  account_name text NOT NULL,
  account_type_lookup_value_id uuid NOT NULL REFERENCES api.lookup_values(id) ON DELETE RESTRICT,
  currency_lookup_value_id uuid NULL REFERENCES api.lookup_values(id) ON DELETE RESTRICT,
  gl_account_id uuid NOT NULL REFERENCES api.gl_accounts(id) ON DELETE RESTRICT,
  bank_name text NULL,
  iban text NULL,
  account_number text NULL,
  description text NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cash_bank_accounts_code_not_blank CHECK (length(btrim(account_code)) > 0),
  CONSTRAINT cash_bank_accounts_name_not_blank CHECK (length(btrim(account_name)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS cash_bank_accounts_code_unique_idx ON api.cash_bank_accounts (lower(account_code));
CREATE INDEX IF NOT EXISTS cash_bank_accounts_name_idx ON api.cash_bank_accounts (lower(account_name));
CREATE INDEX IF NOT EXISTS cash_bank_accounts_type_idx ON api.cash_bank_accounts (account_type_lookup_value_id);
CREATE INDEX IF NOT EXISTS cash_bank_accounts_currency_idx ON api.cash_bank_accounts (currency_lookup_value_id);
CREATE INDEX IF NOT EXISTS cash_bank_accounts_gl_account_idx ON api.cash_bank_accounts (gl_account_id);
CREATE INDEX IF NOT EXISTS cash_bank_accounts_active_idx ON api.cash_bank_accounts (active);

CREATE TABLE IF NOT EXISTS api.customer_receipts (
  id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
  receipt_number text NOT NULL UNIQUE,
  customer_id uuid NOT NULL REFERENCES api.customers(id) ON DELETE RESTRICT,
  cash_bank_account_id uuid NOT NULL REFERENCES api.cash_bank_accounts(id) ON DELETE RESTRICT,
  status_lookup_value_id uuid NOT NULL REFERENCES api.lookup_values(id) ON DELETE RESTRICT,
  payment_method_lookup_value_id uuid NULL REFERENCES api.lookup_values(id) ON DELETE RESTRICT,
  receipt_date date NOT NULL DEFAULT current_date,
  currency_lookup_value_id uuid NULL REFERENCES api.lookup_values(id) ON DELETE RESTRICT,
  amount numeric(14,2) NOT NULL,
  reference_number text NULL,
  notes text NULL,
  journal_entry_id uuid NULL REFERENCES api.journal_entries(id) ON DELETE RESTRICT,
  posted_by_user_id uuid NULL,
  posted_by_email text NULL,
  posted_at timestamptz NULL,
  cancelled_by_user_id uuid NULL,
  cancelled_by_email text NULL,
  cancelled_at timestamptz NULL,
  created_by_user_id uuid NULL,
  created_by_email text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT customer_receipts_number_not_blank CHECK (length(btrim(receipt_number)) > 0),
  CONSTRAINT customer_receipts_amount_positive CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS customer_receipts_number_idx ON api.customer_receipts (lower(receipt_number));
CREATE INDEX IF NOT EXISTS customer_receipts_customer_idx ON api.customer_receipts (customer_id);
CREATE INDEX IF NOT EXISTS customer_receipts_cash_bank_idx ON api.customer_receipts (cash_bank_account_id);
CREATE INDEX IF NOT EXISTS customer_receipts_status_idx ON api.customer_receipts (status_lookup_value_id);
CREATE INDEX IF NOT EXISTS customer_receipts_date_idx ON api.customer_receipts (receipt_date DESC);
CREATE INDEX IF NOT EXISTS customer_receipts_journal_idx ON api.customer_receipts (journal_entry_id);

CREATE TABLE IF NOT EXISTS api.customer_receipt_allocations (
  id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
  customer_receipt_id uuid NOT NULL REFERENCES api.customer_receipts(id) ON DELETE CASCADE,
  sales_invoice_id uuid NOT NULL REFERENCES api.sales_invoices(id) ON DELETE RESTRICT,
  line_number integer NOT NULL,
  allocated_amount numeric(14,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT customer_receipt_allocations_unique_line UNIQUE (customer_receipt_id, line_number),
  CONSTRAINT customer_receipt_allocations_unique_invoice UNIQUE (customer_receipt_id, sales_invoice_id),
  CONSTRAINT customer_receipt_allocations_line_positive CHECK (line_number > 0),
  CONSTRAINT customer_receipt_allocations_amount_positive CHECK (allocated_amount > 0)
);

CREATE INDEX IF NOT EXISTS customer_receipt_allocations_receipt_idx ON api.customer_receipt_allocations (customer_receipt_id);
CREATE INDEX IF NOT EXISTS customer_receipt_allocations_invoice_idx ON api.customer_receipt_allocations (sales_invoice_id);

CREATE TABLE IF NOT EXISTS api.supplier_payments (
  id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
  payment_number text NOT NULL UNIQUE,
  supplier_id uuid NOT NULL REFERENCES api.suppliers(id) ON DELETE RESTRICT,
  cash_bank_account_id uuid NOT NULL REFERENCES api.cash_bank_accounts(id) ON DELETE RESTRICT,
  status_lookup_value_id uuid NOT NULL REFERENCES api.lookup_values(id) ON DELETE RESTRICT,
  payment_method_lookup_value_id uuid NULL REFERENCES api.lookup_values(id) ON DELETE RESTRICT,
  payment_date date NOT NULL DEFAULT current_date,
  currency_lookup_value_id uuid NULL REFERENCES api.lookup_values(id) ON DELETE RESTRICT,
  amount numeric(14,2) NOT NULL,
  reference_number text NULL,
  notes text NULL,
  journal_entry_id uuid NULL REFERENCES api.journal_entries(id) ON DELETE RESTRICT,
  posted_by_user_id uuid NULL,
  posted_by_email text NULL,
  posted_at timestamptz NULL,
  cancelled_by_user_id uuid NULL,
  cancelled_by_email text NULL,
  cancelled_at timestamptz NULL,
  created_by_user_id uuid NULL,
  created_by_email text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT supplier_payments_number_not_blank CHECK (length(btrim(payment_number)) > 0),
  CONSTRAINT supplier_payments_amount_positive CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS supplier_payments_number_idx ON api.supplier_payments (lower(payment_number));
CREATE INDEX IF NOT EXISTS supplier_payments_supplier_idx ON api.supplier_payments (supplier_id);
CREATE INDEX IF NOT EXISTS supplier_payments_cash_bank_idx ON api.supplier_payments (cash_bank_account_id);
CREATE INDEX IF NOT EXISTS supplier_payments_status_idx ON api.supplier_payments (status_lookup_value_id);
CREATE INDEX IF NOT EXISTS supplier_payments_date_idx ON api.supplier_payments (payment_date DESC);
CREATE INDEX IF NOT EXISTS supplier_payments_journal_idx ON api.supplier_payments (journal_entry_id);

CREATE TABLE IF NOT EXISTS api.supplier_payment_allocations (
  id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
  supplier_payment_id uuid NOT NULL REFERENCES api.supplier_payments(id) ON DELETE CASCADE,
  supplier_invoice_id uuid NOT NULL REFERENCES api.supplier_invoices(id) ON DELETE RESTRICT,
  line_number integer NOT NULL,
  allocated_amount numeric(14,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT supplier_payment_allocations_unique_line UNIQUE (supplier_payment_id, line_number),
  CONSTRAINT supplier_payment_allocations_unique_invoice UNIQUE (supplier_payment_id, supplier_invoice_id),
  CONSTRAINT supplier_payment_allocations_line_positive CHECK (line_number > 0),
  CONSTRAINT supplier_payment_allocations_amount_positive CHECK (allocated_amount > 0)
);

CREATE INDEX IF NOT EXISTS supplier_payment_allocations_payment_idx ON api.supplier_payment_allocations (supplier_payment_id);
CREATE INDEX IF NOT EXISTS supplier_payment_allocations_invoice_idx ON api.supplier_payment_allocations (supplier_invoice_id);

DROP TRIGGER IF EXISTS set_cash_bank_accounts_updated_at ON api.cash_bank_accounts;
CREATE TRIGGER set_cash_bank_accounts_updated_at
BEFORE UPDATE ON api.cash_bank_accounts
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

DROP TRIGGER IF EXISTS set_customer_receipts_updated_at ON api.customer_receipts;
CREATE TRIGGER set_customer_receipts_updated_at
BEFORE UPDATE ON api.customer_receipts
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

DROP TRIGGER IF EXISTS set_customer_receipt_allocations_updated_at ON api.customer_receipt_allocations;
CREATE TRIGGER set_customer_receipt_allocations_updated_at
BEFORE UPDATE ON api.customer_receipt_allocations
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

DROP TRIGGER IF EXISTS set_supplier_payments_updated_at ON api.supplier_payments;
CREATE TRIGGER set_supplier_payments_updated_at
BEFORE UPDATE ON api.supplier_payments
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

DROP TRIGGER IF EXISTS set_supplier_payment_allocations_updated_at ON api.supplier_payment_allocations;
CREATE TRIGGER set_supplier_payment_allocations_updated_at
BEFORE UPDATE ON api.supplier_payment_allocations
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

CREATE OR REPLACE FUNCTION private.payment_lookup_value_id(
  lookup_type_code text,
  lookup_value_code text
)
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT value.id
  FROM api.lookup_values value
  JOIN api.lookup_types type ON type.id = value.lookup_type_id
  WHERE type.code = lookup_type_code
    AND value.code = lookup_value_code
    AND type.active = true
    AND value.active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.payment_status_id(status_code text)
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT private.payment_lookup_value_id('payment_status', status_code);
$$;

CREATE OR REPLACE FUNCTION private.payment_status_code(status_lookup_value_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT value.code
  FROM api.lookup_values value
  JOIN api.lookup_types type ON type.id = value.lookup_type_id
  WHERE value.id = status_lookup_value_id
    AND type.code = 'payment_status'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.next_customer_receipt_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  prefix text;
  next_number integer;
BEGIN
  SELECT COALESCE(NULLIF(setting.setting_value #>> '{}', ''), 'CR')
  INTO prefix
  FROM api.system_settings setting
  WHERE setting.setting_key = 'documents.customerReceiptPrefix'
    AND setting.active = true
  LIMIT 1;

  prefix := COALESCE(prefix, 'CR');

  SELECT COALESCE(
    MAX(
      NULLIF(
        regexp_replace(receipt.receipt_number, '^' || prefix || '-' || to_char(current_date, 'YYYY') || '-([0-9]+)$', '\1'),
        receipt.receipt_number
      )::integer
    ),
    0
  ) + 1
  INTO next_number
  FROM api.customer_receipts receipt
  WHERE receipt.receipt_number LIKE prefix || '-' || to_char(current_date, 'YYYY') || '-%';

  RETURN prefix || '-' || to_char(current_date, 'YYYY') || '-' || lpad(next_number::text, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION private.next_supplier_payment_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  prefix text;
  next_number integer;
BEGIN
  SELECT COALESCE(NULLIF(setting.setting_value #>> '{}', ''), 'SP')
  INTO prefix
  FROM api.system_settings setting
  WHERE setting.setting_key = 'documents.supplierPaymentPrefix'
    AND setting.active = true
  LIMIT 1;

  prefix := COALESCE(prefix, 'SP');

  SELECT COALESCE(
    MAX(
      NULLIF(
        regexp_replace(payment.payment_number, '^' || prefix || '-' || to_char(current_date, 'YYYY') || '-([0-9]+)$', '\1'),
        payment.payment_number
      )::integer
    ),
    0
  ) + 1
  INTO next_number
  FROM api.supplier_payments payment
  WHERE payment.payment_number LIKE prefix || '-' || to_char(current_date, 'YYYY') || '-%';

  RETURN prefix || '-' || to_char(current_date, 'YYYY') || '-' || lpad(next_number::text, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION private.sales_invoice_paid_amount(
  target_sales_invoice_id uuid,
  excluded_receipt_id uuid DEFAULT NULL
)
RETURNS numeric
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT COALESCE(round(sum(allocation.allocated_amount)::numeric, 2), 0)
  FROM api.customer_receipt_allocations allocation
  JOIN api.customer_receipts receipt ON receipt.id = allocation.customer_receipt_id
  JOIN api.lookup_values status ON status.id = receipt.status_lookup_value_id
  JOIN api.lookup_types status_type ON status_type.id = status.lookup_type_id
  WHERE allocation.sales_invoice_id = target_sales_invoice_id
    AND receipt.id IS DISTINCT FROM excluded_receipt_id
    AND status_type.code = 'payment_status'
    AND status.code = 'posted';
$$;

CREATE OR REPLACE FUNCTION private.supplier_invoice_paid_amount(
  target_supplier_invoice_id uuid,
  excluded_payment_id uuid DEFAULT NULL
)
RETURNS numeric
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT COALESCE(round(sum(allocation.allocated_amount)::numeric, 2), 0)
  FROM api.supplier_payment_allocations allocation
  JOIN api.supplier_payments payment ON payment.id = allocation.supplier_payment_id
  JOIN api.lookup_values status ON status.id = payment.status_lookup_value_id
  JOIN api.lookup_types status_type ON status_type.id = status.lookup_type_id
  WHERE allocation.supplier_invoice_id = target_supplier_invoice_id
    AND payment.id IS DISTINCT FROM excluded_payment_id
    AND status_type.code = 'payment_status'
    AND status.code = 'posted';
$$;

CREATE OR REPLACE FUNCTION private.validate_cash_bank_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  NEW.account_code := btrim(NEW.account_code);
  NEW.account_name := btrim(NEW.account_name);
  NEW.bank_name := NULLIF(btrim(COALESCE(NEW.bank_name, '')), '');
  NEW.iban := NULLIF(btrim(COALESCE(NEW.iban, '')), '');
  NEW.account_number := NULLIF(btrim(COALESCE(NEW.account_number, '')), '');
  NEW.description := NULLIF(btrim(COALESCE(NEW.description, '')), '');

  IF NOT private.lookup_value_has_type(NEW.account_type_lookup_value_id, 'cash_bank_account_type', true) THEN
    RAISE EXCEPTION 'Cash/bank account type is invalid' USING ERRCODE = '23514';
  END IF;

  IF NEW.currency_lookup_value_id IS NOT NULL
    AND NOT private.lookup_value_has_type(NEW.currency_lookup_value_id, 'currency', true) THEN
    RAISE EXCEPTION 'Cash/bank account currency is invalid' USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM api.gl_accounts account
    WHERE account.id = NEW.gl_account_id
      AND account.active = true
      AND account.is_postable = true
  ) THEN
    RAISE EXCEPTION 'Cash/bank GL account must be active and postable' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.validate_customer_receipt_header()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  status_code text;
BEGIN
  NEW.receipt_number := btrim(NEW.receipt_number);
  NEW.reference_number := NULLIF(btrim(COALESCE(NEW.reference_number, '')), '');
  NEW.notes := NULLIF(btrim(COALESCE(NEW.notes, '')), '');
  status_code := private.payment_status_code(NEW.status_lookup_value_id);

  IF status_code IS NULL THEN
    RAISE EXCEPTION 'Payment status is invalid' USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM api.customers customer WHERE customer.id = NEW.customer_id AND customer.active = true) THEN
    RAISE EXCEPTION 'Customer must be active' USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM api.cash_bank_accounts account WHERE account.id = NEW.cash_bank_account_id AND account.active = true) THEN
    RAISE EXCEPTION 'Cash/bank account must be active' USING ERRCODE = '23514';
  END IF;

  IF NEW.payment_method_lookup_value_id IS NOT NULL
    AND NOT private.lookup_value_has_type(NEW.payment_method_lookup_value_id, 'payment_method', true) THEN
    RAISE EXCEPTION 'Payment method is invalid' USING ERRCODE = '23514';
  END IF;

  IF NEW.currency_lookup_value_id IS NOT NULL
    AND NOT private.lookup_value_has_type(NEW.currency_lookup_value_id, 'currency', true) THEN
    RAISE EXCEPTION 'Payment currency is invalid' USING ERRCODE = '23514';
  END IF;

  IF status_code = 'posted'
    AND (NEW.journal_entry_id IS NULL OR NEW.posted_by_user_id IS NULL OR NEW.posted_by_email IS NULL OR NEW.posted_at IS NULL) THEN
    RAISE EXCEPTION 'Posted customer receipt requires journal and posted metadata' USING ERRCODE = '23514';
  END IF;

  IF status_code = 'cancelled'
    AND (NEW.cancelled_by_user_id IS NULL OR NEW.cancelled_by_email IS NULL OR NEW.cancelled_at IS NULL) THEN
    RAISE EXCEPTION 'Cancelled customer receipt requires cancellation metadata' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.validate_customer_receipt_allocation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  receipt_record api.customer_receipts%ROWTYPE;
  invoice_record api.sales_invoices%ROWTYPE;
  remaining_amount numeric;
BEGIN
  SELECT * INTO receipt_record FROM api.customer_receipts receipt WHERE receipt.id = NEW.customer_receipt_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer receipt was not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO invoice_record FROM api.sales_invoices invoice WHERE invoice.id = NEW.sales_invoice_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sales invoice was not found' USING ERRCODE = 'P0002';
  END IF;

  IF private.sales_invoice_status_code(invoice_record.status_lookup_value_id) <> 'issued' THEN
    RAISE EXCEPTION 'Customer receipt allocation requires an issued sales invoice' USING ERRCODE = '23514';
  END IF;

  IF invoice_record.customer_id <> receipt_record.customer_id THEN
    PERFORM private.write_audit_log(
      'payment.wrongPartyBlocked',
      'customerReceipt',
      'blocked',
      'Wrong customer allocation was blocked.',
      receipt_record.id::text,
      jsonb_build_object('sales_invoice_id', invoice_record.id, 'customer_id', receipt_record.customer_id)
    );
    RAISE EXCEPTION 'Sales invoice customer does not match receipt customer' USING ERRCODE = '23514';
  END IF;

  remaining_amount := invoice_record.total_amount - private.sales_invoice_paid_amount(invoice_record.id, receipt_record.id);

  IF round(NEW.allocated_amount::numeric, 2) > round(remaining_amount::numeric, 2) THEN
    PERFORM private.write_audit_log(
      'payment.overAllocationBlocked',
      'customerReceipt',
      'blocked',
      'Customer receipt over-allocation was blocked.',
      receipt_record.id::text,
      jsonb_build_object('sales_invoice_id', invoice_record.id, 'remaining_amount', remaining_amount, 'allocated_amount', NEW.allocated_amount)
    );
    RAISE EXCEPTION 'Customer receipt allocation exceeds remaining invoice amount' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.validate_supplier_payment_header()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  status_code text;
BEGIN
  NEW.payment_number := btrim(NEW.payment_number);
  NEW.reference_number := NULLIF(btrim(COALESCE(NEW.reference_number, '')), '');
  NEW.notes := NULLIF(btrim(COALESCE(NEW.notes, '')), '');
  status_code := private.payment_status_code(NEW.status_lookup_value_id);

  IF status_code IS NULL THEN
    RAISE EXCEPTION 'Payment status is invalid' USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM api.suppliers supplier WHERE supplier.id = NEW.supplier_id AND supplier.active = true) THEN
    RAISE EXCEPTION 'Supplier must be active' USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM api.cash_bank_accounts account WHERE account.id = NEW.cash_bank_account_id AND account.active = true) THEN
    RAISE EXCEPTION 'Cash/bank account must be active' USING ERRCODE = '23514';
  END IF;

  IF NEW.payment_method_lookup_value_id IS NOT NULL
    AND NOT private.lookup_value_has_type(NEW.payment_method_lookup_value_id, 'payment_method', true) THEN
    RAISE EXCEPTION 'Payment method is invalid' USING ERRCODE = '23514';
  END IF;

  IF NEW.currency_lookup_value_id IS NOT NULL
    AND NOT private.lookup_value_has_type(NEW.currency_lookup_value_id, 'currency', true) THEN
    RAISE EXCEPTION 'Payment currency is invalid' USING ERRCODE = '23514';
  END IF;

  IF status_code = 'posted'
    AND (NEW.journal_entry_id IS NULL OR NEW.posted_by_user_id IS NULL OR NEW.posted_by_email IS NULL OR NEW.posted_at IS NULL) THEN
    RAISE EXCEPTION 'Posted supplier payment requires journal and posted metadata' USING ERRCODE = '23514';
  END IF;

  IF status_code = 'cancelled'
    AND (NEW.cancelled_by_user_id IS NULL OR NEW.cancelled_by_email IS NULL OR NEW.cancelled_at IS NULL) THEN
    RAISE EXCEPTION 'Cancelled supplier payment requires cancellation metadata' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.validate_supplier_payment_allocation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  payment_record api.supplier_payments%ROWTYPE;
  invoice_record api.supplier_invoices%ROWTYPE;
  remaining_amount numeric;
BEGIN
  SELECT * INTO payment_record FROM api.supplier_payments payment WHERE payment.id = NEW.supplier_payment_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Supplier payment was not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO invoice_record FROM api.supplier_invoices invoice WHERE invoice.id = NEW.supplier_invoice_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Supplier invoice was not found' USING ERRCODE = 'P0002';
  END IF;

  IF private.supplier_invoice_status_code(invoice_record.status_lookup_value_id) <> 'posted' THEN
    RAISE EXCEPTION 'Supplier payment allocation requires a posted supplier invoice' USING ERRCODE = '23514';
  END IF;

  IF invoice_record.supplier_id <> payment_record.supplier_id THEN
    PERFORM private.write_audit_log(
      'payment.wrongPartyBlocked',
      'supplierPayment',
      'blocked',
      'Wrong supplier allocation was blocked.',
      payment_record.id::text,
      jsonb_build_object('supplier_invoice_id', invoice_record.id, 'supplier_id', payment_record.supplier_id)
    );
    RAISE EXCEPTION 'Supplier invoice supplier does not match payment supplier' USING ERRCODE = '23514';
  END IF;

  remaining_amount := invoice_record.total_amount - private.supplier_invoice_paid_amount(invoice_record.id, payment_record.id);

  IF round(NEW.allocated_amount::numeric, 2) > round(remaining_amount::numeric, 2) THEN
    PERFORM private.write_audit_log(
      'payment.overAllocationBlocked',
      'supplierPayment',
      'blocked',
      'Supplier payment over-allocation was blocked.',
      payment_record.id::text,
      jsonb_build_object('supplier_invoice_id', invoice_record.id, 'remaining_amount', remaining_amount, 'allocated_amount', NEW.allocated_amount)
    );
    RAISE EXCEPTION 'Supplier payment allocation exceeds remaining invoice amount' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_cash_bank_account ON api.cash_bank_accounts;
CREATE TRIGGER validate_cash_bank_account
BEFORE INSERT OR UPDATE ON api.cash_bank_accounts
FOR EACH ROW
EXECUTE FUNCTION private.validate_cash_bank_account();

DROP TRIGGER IF EXISTS validate_customer_receipt_header ON api.customer_receipts;
CREATE TRIGGER validate_customer_receipt_header
BEFORE INSERT OR UPDATE ON api.customer_receipts
FOR EACH ROW
EXECUTE FUNCTION private.validate_customer_receipt_header();

DROP TRIGGER IF EXISTS validate_customer_receipt_allocation ON api.customer_receipt_allocations;
CREATE TRIGGER validate_customer_receipt_allocation
BEFORE INSERT OR UPDATE ON api.customer_receipt_allocations
FOR EACH ROW
EXECUTE FUNCTION private.validate_customer_receipt_allocation();

DROP TRIGGER IF EXISTS validate_supplier_payment_header ON api.supplier_payments;
CREATE TRIGGER validate_supplier_payment_header
BEFORE INSERT OR UPDATE ON api.supplier_payments
FOR EACH ROW
EXECUTE FUNCTION private.validate_supplier_payment_header();

DROP TRIGGER IF EXISTS validate_supplier_payment_allocation ON api.supplier_payment_allocations;
CREATE TRIGGER validate_supplier_payment_allocation
BEFORE INSERT OR UPDATE ON api.supplier_payment_allocations
FOR EACH ROW
EXECUTE FUNCTION private.validate_supplier_payment_allocation();

CREATE OR REPLACE FUNCTION api.post_customer_receipt(
  customer_id uuid,
  cash_bank_account_id uuid,
  receipt_date date DEFAULT current_date,
  currency_lookup_value_id uuid DEFAULT NULL,
  payment_method_lookup_value_id uuid DEFAULT NULL,
  amount numeric DEFAULT NULL,
  reference_number text DEFAULT NULL,
  notes text DEFAULT NULL,
  allocations jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  receipt_id uuid;
  journal_id uuid;
  line_item jsonb;
  line_no integer := 0;
  allocation_total numeric := 0;
  receipt_amount numeric := round(COALESCE(amount, 0)::numeric, 2);
  account_record api.cash_bank_accounts%ROWTYPE;
BEGIN
  IF jsonb_typeof(allocations) <> 'array' OR jsonb_array_length(allocations) = 0 THEN
    RETURN private.inventory_error_response('23514', 'Customer receipt requires at least one allocation');
  END IF;

  SELECT * INTO account_record FROM api.cash_bank_accounts account WHERE account.id = cash_bank_account_id;
  IF NOT FOUND THEN
    RETURN private.inventory_error_response('P0002', 'Cash/bank account not found', '404');
  END IF;

  INSERT INTO api.customer_receipts (
    receipt_number,
    customer_id,
    cash_bank_account_id,
    status_lookup_value_id,
    payment_method_lookup_value_id,
    receipt_date,
    currency_lookup_value_id,
    amount,
    reference_number,
    notes,
    created_by_user_id,
    created_by_email
  )
  VALUES (
    private.next_customer_receipt_number(),
    customer_id,
    cash_bank_account_id,
    private.payment_status_id('draft'),
    payment_method_lookup_value_id,
    COALESCE(receipt_date, current_date),
    currency_lookup_value_id,
    receipt_amount,
    reference_number,
    notes,
    private.current_request_user_id(),
    private.current_request_email()
  )
  RETURNING id INTO receipt_id;

  FOR line_item IN SELECT value FROM jsonb_array_elements(allocations)
  LOOP
    line_no := line_no + 1;
    INSERT INTO api.customer_receipt_allocations (
      customer_receipt_id,
      sales_invoice_id,
      line_number,
      allocated_amount
    )
    VALUES (
      receipt_id,
      NULLIF(COALESCE(line_item->>'salesInvoiceId', line_item->>'sales_invoice_id'), '')::uuid,
      line_no,
      round(COALESCE(NULLIF(COALESCE(line_item->>'allocatedAmount', line_item->>'allocated_amount'), '')::numeric, 0), 2)
    );
  END LOOP;

  SELECT COALESCE(round(sum(allocation.allocated_amount)::numeric, 2), 0)
  INTO allocation_total
  FROM api.customer_receipt_allocations allocation
  WHERE allocation.customer_receipt_id = receipt_id;

  IF allocation_total <> receipt_amount THEN
    RETURN private.inventory_error_response('23514', 'Customer receipt allocation total must equal receipt amount');
  END IF;

  journal_id := private.create_journal_header(
    'customer_receipt',
    receipt_id,
    COALESCE(receipt_date, current_date),
    'Customer receipt posting',
    currency_lookup_value_id
  );

  PERFORM private.insert_journal_line(journal_id, 1, account_record.gl_account_id, 'Customer receipt cash/bank debit', receipt_amount, 0, receipt_id);
  PERFORM private.insert_journal_line(journal_id, 2, private.default_gl_account('accounting.defaultAccounts.accountsReceivable'), 'Customer receipt accounts receivable credit', 0, receipt_amount, receipt_id);
  PERFORM private.post_journal_entry_internal(journal_id);

  INSERT INTO api.accounting_source_links (source_type, source_id, journal_entry_id)
  VALUES ('customer_receipt', receipt_id, journal_id);

  UPDATE api.customer_receipts receipt
  SET status_lookup_value_id = private.payment_status_id('posted'),
      journal_entry_id = journal_id,
      posted_by_user_id = private.current_request_user_id(),
      posted_by_email = private.current_request_email(),
      posted_at = statement_timestamp()
  WHERE receipt.id = receipt_id;

  PERFORM private.write_audit_log(
    'payment.accountingPosted',
    'customerReceipt',
    'success',
    'Customer receipt accounting journal was posted.',
    receipt_id::text,
    jsonb_build_object(
      'receipt_number', (SELECT receipt_number FROM api.customer_receipts WHERE id = receipt_id),
      'customer_id', customer_id,
      'cash_bank_account_id', cash_bank_account_id,
      'amount', receipt_amount,
      'journal_number', (SELECT journal_number FROM api.journal_entries WHERE id = journal_id),
      'invoice_count', jsonb_array_length(allocations)
    )
  );

  PERFORM private.write_audit_log(
    'customerReceipt.posted',
    'customerReceipt',
    'success',
    'Customer receipt was posted.',
    receipt_id::text,
    jsonb_build_object('receipt_number', (SELECT receipt_number FROM api.customer_receipts WHERE id = receipt_id), 'amount', receipt_amount)
  );

  RETURN private.customer_receipt_json(receipt_id);
EXCEPTION WHEN OTHERS THEN
  RETURN private.inventory_error_response(SQLSTATE, SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION api.cancel_customer_receipt(customer_receipt_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  target_receipt api.customer_receipts%ROWTYPE;
BEGIN
  SELECT * INTO target_receipt FROM api.customer_receipts receipt WHERE receipt.id = customer_receipt_id;

  IF NOT FOUND THEN
    RETURN private.inventory_error_response('P0002', 'Customer receipt not found', '404');
  END IF;

  IF private.payment_status_code(target_receipt.status_lookup_value_id) <> 'draft' THEN
    RETURN private.inventory_error_response('23514', 'Posted payment cancellation through reversal journal is deferred');
  END IF;

  UPDATE api.customer_receipts receipt
  SET status_lookup_value_id = private.payment_status_id('cancelled'),
      cancelled_by_user_id = private.current_request_user_id(),
      cancelled_by_email = private.current_request_email(),
      cancelled_at = statement_timestamp()
  WHERE receipt.id = target_receipt.id;

  PERFORM private.write_audit_log(
    'customerReceipt.cancelled',
    'customerReceipt',
    'success',
    'Draft customer receipt was cancelled.',
    target_receipt.id::text,
    jsonb_build_object('receipt_number', target_receipt.receipt_number)
  );

  RETURN private.customer_receipt_json(target_receipt.id);
END;
$$;

CREATE OR REPLACE FUNCTION api.post_supplier_payment(
  supplier_id uuid,
  cash_bank_account_id uuid,
  payment_date date DEFAULT current_date,
  currency_lookup_value_id uuid DEFAULT NULL,
  payment_method_lookup_value_id uuid DEFAULT NULL,
  amount numeric DEFAULT NULL,
  reference_number text DEFAULT NULL,
  notes text DEFAULT NULL,
  allocations jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  payment_id uuid;
  journal_id uuid;
  line_item jsonb;
  line_no integer := 0;
  allocation_total numeric := 0;
  payment_amount numeric := round(COALESCE(amount, 0)::numeric, 2);
  account_record api.cash_bank_accounts%ROWTYPE;
BEGIN
  IF jsonb_typeof(allocations) <> 'array' OR jsonb_array_length(allocations) = 0 THEN
    RETURN private.inventory_error_response('23514', 'Supplier payment requires at least one allocation');
  END IF;

  SELECT * INTO account_record FROM api.cash_bank_accounts account WHERE account.id = cash_bank_account_id;
  IF NOT FOUND THEN
    RETURN private.inventory_error_response('P0002', 'Cash/bank account not found', '404');
  END IF;

  INSERT INTO api.supplier_payments (
    payment_number,
    supplier_id,
    cash_bank_account_id,
    status_lookup_value_id,
    payment_method_lookup_value_id,
    payment_date,
    currency_lookup_value_id,
    amount,
    reference_number,
    notes,
    created_by_user_id,
    created_by_email
  )
  VALUES (
    private.next_supplier_payment_number(),
    supplier_id,
    cash_bank_account_id,
    private.payment_status_id('draft'),
    payment_method_lookup_value_id,
    COALESCE(payment_date, current_date),
    currency_lookup_value_id,
    payment_amount,
    reference_number,
    notes,
    private.current_request_user_id(),
    private.current_request_email()
  )
  RETURNING id INTO payment_id;

  FOR line_item IN SELECT value FROM jsonb_array_elements(allocations)
  LOOP
    line_no := line_no + 1;
    INSERT INTO api.supplier_payment_allocations (
      supplier_payment_id,
      supplier_invoice_id,
      line_number,
      allocated_amount
    )
    VALUES (
      payment_id,
      NULLIF(COALESCE(line_item->>'supplierInvoiceId', line_item->>'supplier_invoice_id'), '')::uuid,
      line_no,
      round(COALESCE(NULLIF(COALESCE(line_item->>'allocatedAmount', line_item->>'allocated_amount'), '')::numeric, 0), 2)
    );
  END LOOP;

  SELECT COALESCE(round(sum(allocation.allocated_amount)::numeric, 2), 0)
  INTO allocation_total
  FROM api.supplier_payment_allocations allocation
  WHERE allocation.supplier_payment_id = payment_id;

  IF allocation_total <> payment_amount THEN
    RETURN private.inventory_error_response('23514', 'Supplier payment allocation total must equal payment amount');
  END IF;

  journal_id := private.create_journal_header(
    'supplier_payment',
    payment_id,
    COALESCE(payment_date, current_date),
    'Supplier payment posting',
    currency_lookup_value_id
  );

  PERFORM private.insert_journal_line(journal_id, 1, private.default_gl_account('accounting.defaultAccounts.accountsPayable'), 'Supplier payment accounts payable debit', payment_amount, 0, payment_id);
  PERFORM private.insert_journal_line(journal_id, 2, account_record.gl_account_id, 'Supplier payment cash/bank credit', 0, payment_amount, payment_id);
  PERFORM private.post_journal_entry_internal(journal_id);

  INSERT INTO api.accounting_source_links (source_type, source_id, journal_entry_id)
  VALUES ('supplier_payment', payment_id, journal_id);

  UPDATE api.supplier_payments payment
  SET status_lookup_value_id = private.payment_status_id('posted'),
      journal_entry_id = journal_id,
      posted_by_user_id = private.current_request_user_id(),
      posted_by_email = private.current_request_email(),
      posted_at = statement_timestamp()
  WHERE payment.id = payment_id;

  PERFORM private.write_audit_log(
    'payment.accountingPosted',
    'supplierPayment',
    'success',
    'Supplier payment accounting journal was posted.',
    payment_id::text,
    jsonb_build_object(
      'payment_number', (SELECT payment_number FROM api.supplier_payments WHERE id = payment_id),
      'supplier_id', supplier_id,
      'cash_bank_account_id', cash_bank_account_id,
      'amount', payment_amount,
      'journal_number', (SELECT journal_number FROM api.journal_entries WHERE id = journal_id),
      'invoice_count', jsonb_array_length(allocations)
    )
  );

  PERFORM private.write_audit_log(
    'supplierPayment.posted',
    'supplierPayment',
    'success',
    'Supplier payment was posted.',
    payment_id::text,
    jsonb_build_object('payment_number', (SELECT payment_number FROM api.supplier_payments WHERE id = payment_id), 'amount', payment_amount)
  );

  RETURN private.supplier_payment_json(payment_id);
EXCEPTION WHEN OTHERS THEN
  RETURN private.inventory_error_response(SQLSTATE, SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION api.cancel_supplier_payment(supplier_payment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  target_payment api.supplier_payments%ROWTYPE;
BEGIN
  SELECT * INTO target_payment FROM api.supplier_payments payment WHERE payment.id = supplier_payment_id;

  IF NOT FOUND THEN
    RETURN private.inventory_error_response('P0002', 'Supplier payment not found', '404');
  END IF;

  IF private.payment_status_code(target_payment.status_lookup_value_id) <> 'draft' THEN
    RETURN private.inventory_error_response('23514', 'Posted payment cancellation through reversal journal is deferred');
  END IF;

  UPDATE api.supplier_payments payment
  SET status_lookup_value_id = private.payment_status_id('cancelled'),
      cancelled_by_user_id = private.current_request_user_id(),
      cancelled_by_email = private.current_request_email(),
      cancelled_at = statement_timestamp()
  WHERE payment.id = target_payment.id;

  PERFORM private.write_audit_log(
    'supplierPayment.cancelled',
    'supplierPayment',
    'success',
    'Draft supplier payment was cancelled.',
    target_payment.id::text,
    jsonb_build_object('payment_number', target_payment.payment_number)
  );

  RETURN private.supplier_payment_json(target_payment.id);
END;
$$;

CREATE OR REPLACE VIEW api.cash_bank_account_view AS
SELECT
  account.id,
  account.account_code,
  account.account_name,
  account.account_type_lookup_value_id,
  account_type.code AS account_type_code,
  account_type.label AS account_type_label,
  account.currency_lookup_value_id,
  currency.code AS currency_code,
  currency.label AS currency_label,
  account.gl_account_id,
  gl.account_code AS gl_account_code,
  gl.account_name AS gl_account_name,
  account.bank_name,
  account.iban,
  account.account_number,
  account.description,
  account.active,
  account.created_at,
  account.updated_at
FROM api.cash_bank_accounts account
JOIN api.lookup_values account_type ON account_type.id = account.account_type_lookup_value_id
LEFT JOIN api.lookup_values currency ON currency.id = account.currency_lookup_value_id
JOIN api.gl_accounts gl ON gl.id = account.gl_account_id;

CREATE OR REPLACE VIEW api.customer_receipt_view AS
SELECT
  receipt.id,
  receipt.receipt_number,
  receipt.customer_id,
  customer.code AS customer_code,
  customer.name AS customer_name,
  receipt.cash_bank_account_id,
  account.account_code AS cash_bank_account_code,
  account.account_name AS cash_bank_account_name,
  receipt.status_lookup_value_id,
  status.code AS status_code,
  status.label AS status_label,
  receipt.payment_method_lookup_value_id,
  method.code AS payment_method_code,
  method.label AS payment_method_label,
  receipt.receipt_date,
  receipt.currency_lookup_value_id,
  currency.code AS currency_code,
  currency.label AS currency_label,
  receipt.amount,
  receipt.reference_number,
  receipt.notes,
  receipt.journal_entry_id,
  journal.journal_number,
  receipt.posted_by_email,
  receipt.posted_at,
  receipt.cancelled_by_email,
  receipt.cancelled_at,
  receipt.created_by_email,
  receipt.created_at,
  receipt.updated_at
FROM api.customer_receipts receipt
JOIN api.customers customer ON customer.id = receipt.customer_id
JOIN api.cash_bank_accounts account ON account.id = receipt.cash_bank_account_id
JOIN api.lookup_values status ON status.id = receipt.status_lookup_value_id
LEFT JOIN api.lookup_values method ON method.id = receipt.payment_method_lookup_value_id
LEFT JOIN api.lookup_values currency ON currency.id = receipt.currency_lookup_value_id
LEFT JOIN api.journal_entries journal ON journal.id = receipt.journal_entry_id;

CREATE OR REPLACE VIEW api.customer_receipt_allocation_view AS
SELECT
  allocation.id,
  allocation.customer_receipt_id,
  allocation.sales_invoice_id,
  invoice.invoice_number,
  allocation.line_number,
  allocation.allocated_amount,
  allocation.created_at,
  allocation.updated_at
FROM api.customer_receipt_allocations allocation
JOIN api.sales_invoices invoice ON invoice.id = allocation.sales_invoice_id;

CREATE OR REPLACE VIEW api.supplier_payment_view AS
SELECT
  payment.id,
  payment.payment_number,
  payment.supplier_id,
  supplier.code AS supplier_code,
  supplier.name AS supplier_name,
  payment.cash_bank_account_id,
  account.account_code AS cash_bank_account_code,
  account.account_name AS cash_bank_account_name,
  payment.status_lookup_value_id,
  status.code AS status_code,
  status.label AS status_label,
  payment.payment_method_lookup_value_id,
  method.code AS payment_method_code,
  method.label AS payment_method_label,
  payment.payment_date,
  payment.currency_lookup_value_id,
  currency.code AS currency_code,
  currency.label AS currency_label,
  payment.amount,
  payment.reference_number,
  payment.notes,
  payment.journal_entry_id,
  journal.journal_number,
  payment.posted_by_email,
  payment.posted_at,
  payment.cancelled_by_email,
  payment.cancelled_at,
  payment.created_by_email,
  payment.created_at,
  payment.updated_at
FROM api.supplier_payments payment
JOIN api.suppliers supplier ON supplier.id = payment.supplier_id
JOIN api.cash_bank_accounts account ON account.id = payment.cash_bank_account_id
JOIN api.lookup_values status ON status.id = payment.status_lookup_value_id
LEFT JOIN api.lookup_values method ON method.id = payment.payment_method_lookup_value_id
LEFT JOIN api.lookup_values currency ON currency.id = payment.currency_lookup_value_id
LEFT JOIN api.journal_entries journal ON journal.id = payment.journal_entry_id;

CREATE OR REPLACE VIEW api.supplier_payment_allocation_view AS
SELECT
  allocation.id,
  allocation.supplier_payment_id,
  allocation.supplier_invoice_id,
  invoice.invoice_number,
  invoice.supplier_invoice_number,
  allocation.line_number,
  allocation.allocated_amount,
  allocation.created_at,
  allocation.updated_at
FROM api.supplier_payment_allocations allocation
JOIN api.supplier_invoices invoice ON invoice.id = allocation.supplier_invoice_id;

CREATE OR REPLACE VIEW api.sales_invoice_settlement_view AS
SELECT
  invoice.id AS sales_invoice_id,
  invoice.invoice_number,
  invoice.customer_id,
  customer.code AS customer_code,
  customer.name AS customer_name,
  invoice.invoice_date,
  invoice.due_date,
  invoice.total_amount,
  private.sales_invoice_paid_amount(invoice.id) AS paid_amount,
  GREATEST(invoice.total_amount - private.sales_invoice_paid_amount(invoice.id), 0) AS remaining_amount,
  CASE
    WHEN private.sales_invoice_status_code(invoice.status_lookup_value_id) = 'cancelled' THEN 'cancelled'
    WHEN private.sales_invoice_paid_amount(invoice.id) <= 0 THEN 'unpaid'
    WHEN private.sales_invoice_paid_amount(invoice.id) >= invoice.total_amount THEN 'paid'
    ELSE 'partially_paid'
  END AS settlement_status
FROM api.sales_invoices invoice
JOIN api.customers customer ON customer.id = invoice.customer_id
WHERE private.sales_invoice_status_code(invoice.status_lookup_value_id) = 'issued';

CREATE OR REPLACE VIEW api.supplier_invoice_settlement_view AS
SELECT
  invoice.id AS supplier_invoice_id,
  invoice.invoice_number,
  invoice.supplier_invoice_number,
  invoice.supplier_id,
  supplier.code AS supplier_code,
  supplier.name AS supplier_name,
  invoice.invoice_date,
  invoice.due_date,
  invoice.total_amount,
  private.supplier_invoice_paid_amount(invoice.id) AS paid_amount,
  GREATEST(invoice.total_amount - private.supplier_invoice_paid_amount(invoice.id), 0) AS remaining_amount,
  CASE
    WHEN private.supplier_invoice_status_code(invoice.status_lookup_value_id) = 'cancelled' THEN 'cancelled'
    WHEN private.supplier_invoice_paid_amount(invoice.id) <= 0 THEN 'unpaid'
    WHEN private.supplier_invoice_paid_amount(invoice.id) >= invoice.total_amount THEN 'paid'
    ELSE 'partially_paid'
  END AS settlement_status
FROM api.supplier_invoices invoice
JOIN api.suppliers supplier ON supplier.id = invoice.supplier_id
WHERE private.supplier_invoice_status_code(invoice.status_lookup_value_id) = 'posted';

CREATE OR REPLACE FUNCTION private.customer_receipt_json(target_customer_receipt_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT jsonb_build_object(
    'id', receipt.id,
    'receiptNumber', receipt.receipt_number,
    'customerId', receipt.customer_id,
    'customerCode', receipt.customer_code,
    'customerName', receipt.customer_name,
    'cashBankAccountId', receipt.cash_bank_account_id,
    'cashBankAccountCode', receipt.cash_bank_account_code,
    'cashBankAccountName', receipt.cash_bank_account_name,
    'statusCode', receipt.status_code,
    'statusLabel', receipt.status_label,
    'paymentMethodCode', receipt.payment_method_code,
    'paymentMethodLabel', receipt.payment_method_label,
    'receiptDate', receipt.receipt_date,
    'currencyCode', receipt.currency_code,
    'currencyLabel', receipt.currency_label,
    'amount', receipt.amount,
    'referenceNumber', receipt.reference_number,
    'notes', receipt.notes,
    'journalEntryId', receipt.journal_entry_id,
    'journalNumber', receipt.journal_number,
    'postedByEmail', receipt.posted_by_email,
    'postedAt', receipt.posted_at,
    'cancelledByEmail', receipt.cancelled_by_email,
    'cancelledAt', receipt.cancelled_at,
    'createdByEmail', receipt.created_by_email,
    'createdAt', receipt.created_at,
    'updatedAt', receipt.updated_at,
    'allocations', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', allocation.id,
            'customerReceiptId', allocation.customer_receipt_id,
            'salesInvoiceId', allocation.sales_invoice_id,
            'invoiceNumber', allocation.invoice_number,
            'lineNumber', allocation.line_number,
            'allocatedAmount', allocation.allocated_amount
          )
          ORDER BY allocation.line_number
        )
        FROM api.customer_receipt_allocation_view allocation
        WHERE allocation.customer_receipt_id = receipt.id
      ),
      '[]'::jsonb
    )
  )
  FROM api.customer_receipt_view receipt
  WHERE receipt.id = target_customer_receipt_id;
$$;

CREATE OR REPLACE FUNCTION private.supplier_payment_json(target_supplier_payment_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT jsonb_build_object(
    'id', payment.id,
    'paymentNumber', payment.payment_number,
    'supplierId', payment.supplier_id,
    'supplierCode', payment.supplier_code,
    'supplierName', payment.supplier_name,
    'cashBankAccountId', payment.cash_bank_account_id,
    'cashBankAccountCode', payment.cash_bank_account_code,
    'cashBankAccountName', payment.cash_bank_account_name,
    'statusCode', payment.status_code,
    'statusLabel', payment.status_label,
    'paymentMethodCode', payment.payment_method_code,
    'paymentMethodLabel', payment.payment_method_label,
    'paymentDate', payment.payment_date,
    'currencyCode', payment.currency_code,
    'currencyLabel', payment.currency_label,
    'amount', payment.amount,
    'referenceNumber', payment.reference_number,
    'notes', payment.notes,
    'journalEntryId', payment.journal_entry_id,
    'journalNumber', payment.journal_number,
    'postedByEmail', payment.posted_by_email,
    'postedAt', payment.posted_at,
    'cancelledByEmail', payment.cancelled_by_email,
    'cancelledAt', payment.cancelled_at,
    'createdByEmail', payment.created_by_email,
    'createdAt', payment.created_at,
    'updatedAt', payment.updated_at,
    'allocations', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', allocation.id,
            'supplierPaymentId', allocation.supplier_payment_id,
            'supplierInvoiceId', allocation.supplier_invoice_id,
            'invoiceNumber', allocation.invoice_number,
            'supplierInvoiceNumber', allocation.supplier_invoice_number,
            'lineNumber', allocation.line_number,
            'allocatedAmount', allocation.allocated_amount
          )
          ORDER BY allocation.line_number
        )
        FROM api.supplier_payment_allocation_view allocation
        WHERE allocation.supplier_payment_id = payment.id
      ),
      '[]'::jsonb
    )
  )
  FROM api.supplier_payment_view payment
  WHERE payment.id = target_supplier_payment_id;
$$;

CREATE OR REPLACE FUNCTION private.audit_cash_bank_account_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM private.write_audit_log(
      'cashBankAccount.created',
      'cashBankAccount',
      'success',
      'Cash/bank account was created.',
      NEW.id::text,
      jsonb_build_object('account_code', NEW.account_code, 'account_name', NEW.account_name)
    );
  ELSIF OLD.active = true AND NEW.active = false THEN
    PERFORM private.write_audit_log(
      'cashBankAccount.deactivated',
      'cashBankAccount',
      'success',
      'Cash/bank account was deactivated.',
      NEW.id::text,
      jsonb_build_object('account_code', NEW.account_code, 'account_name', NEW.account_name)
    );
  ELSE
    PERFORM private.write_audit_log(
      'cashBankAccount.updated',
      'cashBankAccount',
      'success',
      'Cash/bank account was updated.',
      NEW.id::text,
      jsonb_build_object('account_code', NEW.account_code, 'account_name', NEW.account_name)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_cash_bank_account_change ON api.cash_bank_accounts;
CREATE TRIGGER audit_cash_bank_account_change
AFTER INSERT OR UPDATE ON api.cash_bank_accounts
FOR EACH ROW
EXECUTE FUNCTION private.audit_cash_bank_account_change();

WITH default_cash AS (
  SELECT id FROM api.gl_accounts WHERE account_code = '1000' AND active = true AND is_postable = true LIMIT 1
),
account_type AS (
  SELECT private.payment_lookup_value_id('cash_bank_account_type', 'cash') AS id
),
currency AS (
  SELECT private.payment_lookup_value_id('currency', 'IRR') AS id
)
INSERT INTO api.cash_bank_accounts (
  account_code,
  account_name,
  account_type_lookup_value_id,
  currency_lookup_value_id,
  gl_account_id,
  description,
  active
)
SELECT
  'CASH-001',
  'Main Cash Account',
  account_type.id,
  currency.id,
  default_cash.id,
  'Development cash account mapped to default cash GL account.',
  true
FROM default_cash, account_type, currency
WHERE default_cash.id IS NOT NULL
ON CONFLICT ((lower(account_code))) DO UPDATE
SET account_name = EXCLUDED.account_name,
    account_type_lookup_value_id = EXCLUDED.account_type_lookup_value_id,
    currency_lookup_value_id = EXCLUDED.currency_lookup_value_id,
    gl_account_id = EXCLUDED.gl_account_id,
    active = true;

REVOKE ALL ON TABLE api.cash_bank_accounts FROM PUBLIC;
REVOKE ALL ON TABLE api.customer_receipts FROM PUBLIC;
REVOKE ALL ON TABLE api.customer_receipt_allocations FROM PUBLIC;
REVOKE ALL ON TABLE api.supplier_payments FROM PUBLIC;
REVOKE ALL ON TABLE api.supplier_payment_allocations FROM PUBLIC;
REVOKE ALL ON FUNCTION private.payment_lookup_value_id(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.payment_status_id(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.payment_status_code(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.next_customer_receipt_number() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.next_supplier_payment_number() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sales_invoice_paid_amount(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.supplier_invoice_paid_amount(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.validate_cash_bank_account() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.validate_customer_receipt_header() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.validate_customer_receipt_allocation() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.validate_supplier_payment_header() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.validate_supplier_payment_allocation() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.customer_receipt_json(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.supplier_payment_json(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.audit_cash_bank_account_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION api.post_customer_receipt(uuid, uuid, date, uuid, uuid, numeric, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.cancel_customer_receipt(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.post_supplier_payment(uuid, uuid, date, uuid, uuid, numeric, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.cancel_supplier_payment(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION private.sales_invoice_status_code(uuid) TO erp_admin, erp_manager, erp_accountant;
GRANT EXECUTE ON FUNCTION private.supplier_invoice_status_code(uuid) TO erp_admin, erp_manager, erp_accountant;
GRANT EXECUTE ON FUNCTION private.sales_invoice_paid_amount(uuid, uuid) TO erp_admin, erp_manager, erp_accountant;
GRANT EXECUTE ON FUNCTION private.supplier_invoice_paid_amount(uuid, uuid) TO erp_admin, erp_manager, erp_accountant;

GRANT USAGE ON SCHEMA api TO erp_admin, erp_manager, erp_accountant;
GRANT SELECT ON api.lookup_types, api.lookup_values TO erp_admin, erp_manager, erp_accountant;
GRANT EXECUTE ON FUNCTION api.admin_list_lookup_values(text, text, boolean, integer, integer) TO erp_accountant;
GRANT SELECT ON api.cash_bank_accounts, api.cash_bank_account_view TO erp_admin, erp_manager, erp_accountant;
GRANT INSERT, UPDATE, DELETE ON api.cash_bank_accounts TO erp_admin;
GRANT INSERT, UPDATE ON api.cash_bank_accounts TO erp_accountant;
GRANT SELECT ON api.customer_receipts, api.customer_receipt_allocations, api.customer_receipt_view, api.customer_receipt_allocation_view TO erp_admin, erp_manager, erp_accountant;
GRANT SELECT ON api.supplier_payments, api.supplier_payment_allocations, api.supplier_payment_view, api.supplier_payment_allocation_view TO erp_admin, erp_manager, erp_accountant;
GRANT SELECT ON api.sales_invoice_settlement_view, api.supplier_invoice_settlement_view TO erp_admin, erp_manager, erp_accountant;
GRANT EXECUTE ON FUNCTION api.post_customer_receipt(uuid, uuid, date, uuid, uuid, numeric, text, text, jsonb) TO erp_admin, erp_accountant;
GRANT EXECUTE ON FUNCTION api.cancel_customer_receipt(uuid) TO erp_admin, erp_accountant;
GRANT EXECUTE ON FUNCTION api.post_supplier_payment(uuid, uuid, date, uuid, uuid, numeric, text, text, jsonb) TO erp_admin, erp_accountant;
GRANT EXECUTE ON FUNCTION api.cancel_supplier_payment(uuid) TO erp_admin, erp_accountant;

ALTER TABLE api.cash_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.customer_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.customer_receipt_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.supplier_payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.cash_bank_accounts FORCE ROW LEVEL SECURITY;
ALTER TABLE api.customer_receipts FORCE ROW LEVEL SECURITY;
ALTER TABLE api.customer_receipt_allocations FORCE ROW LEVEL SECURITY;
ALTER TABLE api.supplier_payments FORCE ROW LEVEL SECURITY;
ALTER TABLE api.supplier_payment_allocations FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cash_bank_accounts_select_policy ON api.cash_bank_accounts;
DROP POLICY IF EXISTS cash_bank_accounts_insert_policy ON api.cash_bank_accounts;
DROP POLICY IF EXISTS cash_bank_accounts_update_policy ON api.cash_bank_accounts;
DROP POLICY IF EXISTS cash_bank_accounts_delete_policy ON api.cash_bank_accounts;
DROP POLICY IF EXISTS customer_receipts_select_policy ON api.customer_receipts;
DROP POLICY IF EXISTS customer_receipt_allocations_select_policy ON api.customer_receipt_allocations;
DROP POLICY IF EXISTS supplier_payments_select_policy ON api.supplier_payments;
DROP POLICY IF EXISTS supplier_payment_allocations_select_policy ON api.supplier_payment_allocations;

CREATE POLICY cash_bank_accounts_select_policy
ON api.cash_bank_accounts
FOR SELECT
TO erp_admin, erp_manager, erp_accountant
USING (true);

CREATE POLICY cash_bank_accounts_insert_policy
ON api.cash_bank_accounts
FOR INSERT
TO erp_admin, erp_accountant
WITH CHECK (true);

CREATE POLICY cash_bank_accounts_update_policy
ON api.cash_bank_accounts
FOR UPDATE
TO erp_admin, erp_accountant
USING (true)
WITH CHECK (true);

CREATE POLICY cash_bank_accounts_delete_policy
ON api.cash_bank_accounts
FOR DELETE
TO erp_admin
USING (true);

CREATE POLICY customer_receipts_select_policy
ON api.customer_receipts
FOR SELECT
TO erp_admin, erp_manager, erp_accountant
USING (true);

CREATE POLICY customer_receipt_allocations_select_policy
ON api.customer_receipt_allocations
FOR SELECT
TO erp_admin, erp_manager, erp_accountant
USING (true);

CREATE POLICY supplier_payments_select_policy
ON api.supplier_payments
FOR SELECT
TO erp_admin, erp_manager, erp_accountant
USING (true);

CREATE POLICY supplier_payment_allocations_select_policy
ON api.supplier_payment_allocations
FOR SELECT
TO erp_admin, erp_manager, erp_accountant
USING (true);

COMMIT;
