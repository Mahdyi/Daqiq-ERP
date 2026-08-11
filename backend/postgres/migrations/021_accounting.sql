BEGIN;

INSERT INTO api.lookup_types (code, name, description, system, active)
VALUES
  ('gl_account_type', 'نوع حساب کل', NULL, true, true),
  ('journal_entry_status', 'وضعیت سند حسابداری', NULL, true, true),
  ('journal_source_type', 'منبع سند حسابداری', NULL, true, true)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    active = true;

WITH account_type AS (
  SELECT id FROM api.lookup_types WHERE code = 'gl_account_type'
)
INSERT INTO api.lookup_values (
  lookup_type_id,
  code,
  label,
  sort_order,
  metadata,
  system,
  active
)
SELECT account_type.id, item.code, item.label, item.sort_order, '{}'::jsonb, true, true
FROM account_type
CROSS JOIN (
  VALUES
    ('asset', 'دارایی', 10),
    ('liability', 'بدهی', 20),
    ('equity', 'حقوق مالکانه', 30),
    ('revenue', 'درآمد', 40),
    ('expense', 'هزینه', 50)
) AS item(code, label, sort_order)
ON CONFLICT (lookup_type_id, code) DO UPDATE
SET label = EXCLUDED.label,
    sort_order = EXCLUDED.sort_order,
    active = true;

WITH status_type AS (
  SELECT id FROM api.lookup_types WHERE code = 'journal_entry_status'
)
INSERT INTO api.lookup_values (
  lookup_type_id,
  code,
  label,
  sort_order,
  metadata,
  system,
  active
)
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
INSERT INTO api.lookup_values (
  lookup_type_id,
  code,
  label,
  sort_order,
  metadata,
  system,
  active
)
SELECT source_type.id, item.code, item.label, item.sort_order, '{}'::jsonb, true, true
FROM source_type
CROSS JOIN (
  VALUES
    ('manual', 'دستی', 10),
    ('sales_invoice', 'فاکتور فروش', 20),
    ('supplier_invoice', 'فاکتور تأمین‌کننده', 30)
) AS item(code, label, sort_order)
ON CONFLICT (lookup_type_id, code) DO UPDATE
SET label = EXCLUDED.label,
    sort_order = EXCLUDED.sort_order,
    active = true;

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
  ('documents.journalEntryPrefix', '"JE"'::jsonb, 'string', 'documents', 'پیشوند سند حسابداری', 'پیشوند شماره‌گذاری اسناد حسابداری', true, true),
  ('accounting.defaultAccounts.accountsReceivable', '"1100"'::jsonb, 'string', 'accounting', 'حساب دریافتنی پیش‌فرض', 'کد حساب دریافتنی پیش‌فرض برای فاکتورهای فروش', true, true),
  ('accounting.defaultAccounts.accountsPayable', '"2000"'::jsonb, 'string', 'accounting', 'حساب پرداختنی پیش‌فرض', 'کد حساب پرداختنی پیش‌فرض برای فاکتورهای تأمین‌کننده', true, true),
  ('accounting.defaultAccounts.salesRevenue', '"4000"'::jsonb, 'string', 'accounting', 'حساب درآمد فروش پیش‌فرض', 'کد حساب درآمد فروش پیش‌فرض', true, true),
  ('accounting.defaultAccounts.purchaseExpense', '"5000"'::jsonb, 'string', 'accounting', 'حساب هزینه خرید پیش‌فرض', 'کد حساب هزینه خرید پیش‌فرض', true, true),
  ('accounting.defaultAccounts.inputTax', '"1300"'::jsonb, 'string', 'accounting', 'حساب مالیات خرید پیش‌فرض', 'کد حساب مالیات ورودی پیش‌فرض', true, true),
  ('accounting.defaultAccounts.outputTax', '"2100"'::jsonb, 'string', 'accounting', 'حساب مالیات فروش پیش‌فرض', 'کد حساب مالیات خروجی پیش‌فرض', true, true),
  ('accounting.defaultAccounts.inventoryClearing', '"5100"'::jsonb, 'string', 'accounting', 'حساب واسط موجودی پیش‌فرض', 'کد حساب واسط موجودی برای توسعه‌های بعدی', true, true)
ON CONFLICT (setting_key) DO UPDATE
SET label = EXCLUDED.label,
    description = EXCLUDED.description,
    active = true;

INSERT INTO api.feature_flags (flag_key, enabled, label, description, category)
VALUES ('accounting.enabled', true, 'حسابداری', 'فعال‌سازی قابلیت‌های پایه حسابداری', 'accounting')
ON CONFLICT (flag_key) DO UPDATE
SET enabled = true,
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    category = EXCLUDED.category;

CREATE TABLE IF NOT EXISTS api.gl_accounts (
  id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
  account_code text NOT NULL,
  account_name text NOT NULL,
  account_type_lookup_value_id uuid NOT NULL REFERENCES api.lookup_values(id) ON DELETE RESTRICT,
  parent_account_id uuid NULL REFERENCES api.gl_accounts(id) ON DELETE RESTRICT,
  description text NULL,
  is_postable boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT gl_accounts_code_not_blank CHECK (length(btrim(account_code)) > 0),
  CONSTRAINT gl_accounts_name_not_blank CHECK (length(btrim(account_name)) > 0),
  CONSTRAINT gl_accounts_parent_not_self CHECK (parent_account_id IS NULL OR parent_account_id <> id)
);

CREATE UNIQUE INDEX IF NOT EXISTS gl_accounts_code_unique_idx ON api.gl_accounts (lower(account_code));
CREATE INDEX IF NOT EXISTS gl_accounts_name_idx ON api.gl_accounts (lower(account_name));
CREATE INDEX IF NOT EXISTS gl_accounts_type_idx ON api.gl_accounts (account_type_lookup_value_id);
CREATE INDEX IF NOT EXISTS gl_accounts_parent_idx ON api.gl_accounts (parent_account_id);
CREATE INDEX IF NOT EXISTS gl_accounts_active_idx ON api.gl_accounts (active);
CREATE INDEX IF NOT EXISTS gl_accounts_postable_idx ON api.gl_accounts (is_postable);

CREATE TABLE IF NOT EXISTS api.accounting_periods (
  id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
  period_code text NOT NULL UNIQUE,
  period_name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_closed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT accounting_periods_code_not_blank CHECK (length(btrim(period_code)) > 0),
  CONSTRAINT accounting_periods_name_not_blank CHECK (length(btrim(period_name)) > 0),
  CONSTRAINT accounting_periods_range_valid CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS accounting_periods_start_idx ON api.accounting_periods (start_date);
CREATE INDEX IF NOT EXISTS accounting_periods_end_idx ON api.accounting_periods (end_date);
CREATE INDEX IF NOT EXISTS accounting_periods_closed_idx ON api.accounting_periods (is_closed);

CREATE TABLE IF NOT EXISTS api.journal_entries (
  id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
  journal_number text NOT NULL UNIQUE,
  status_lookup_value_id uuid NOT NULL REFERENCES api.lookup_values(id) ON DELETE RESTRICT,
  source_type_lookup_value_id uuid NOT NULL REFERENCES api.lookup_values(id) ON DELETE RESTRICT,
  source_id uuid NULL,
  journal_date date NOT NULL DEFAULT current_date,
  accounting_period_id uuid NOT NULL REFERENCES api.accounting_periods(id) ON DELETE RESTRICT,
  description text NULL,
  currency_lookup_value_id uuid NULL REFERENCES api.lookup_values(id) ON DELETE RESTRICT,
  total_debit numeric(14,2) NOT NULL DEFAULT 0,
  total_credit numeric(14,2) NOT NULL DEFAULT 0,
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
  CONSTRAINT journal_entries_number_not_blank CHECK (length(btrim(journal_number)) > 0),
  CONSTRAINT journal_entries_totals_nonnegative CHECK (total_debit >= 0 AND total_credit >= 0)
);

CREATE INDEX IF NOT EXISTS journal_entries_number_idx ON api.journal_entries (lower(journal_number));
CREATE INDEX IF NOT EXISTS journal_entries_status_idx ON api.journal_entries (status_lookup_value_id);
CREATE INDEX IF NOT EXISTS journal_entries_source_type_idx ON api.journal_entries (source_type_lookup_value_id);
CREATE INDEX IF NOT EXISTS journal_entries_source_id_idx ON api.journal_entries (source_id);
CREATE INDEX IF NOT EXISTS journal_entries_date_idx ON api.journal_entries (journal_date DESC);
CREATE INDEX IF NOT EXISTS journal_entries_period_idx ON api.journal_entries (accounting_period_id);

CREATE TABLE IF NOT EXISTS api.journal_entry_lines (
  id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
  journal_entry_id uuid NOT NULL REFERENCES api.journal_entries(id) ON DELETE CASCADE,
  line_number integer NOT NULL,
  account_id uuid NOT NULL REFERENCES api.gl_accounts(id) ON DELETE RESTRICT,
  description text NULL,
  debit_amount numeric(14,2) NOT NULL DEFAULT 0,
  credit_amount numeric(14,2) NOT NULL DEFAULT 0,
  source_line_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT journal_entry_lines_unique_number UNIQUE (journal_entry_id, line_number),
  CONSTRAINT journal_entry_lines_number_positive CHECK (line_number > 0),
  CONSTRAINT journal_entry_lines_amounts_nonnegative CHECK (debit_amount >= 0 AND credit_amount >= 0),
  CONSTRAINT journal_entry_lines_single_side CHECK (
    (debit_amount > 0 AND credit_amount = 0)
    OR (credit_amount > 0 AND debit_amount = 0)
  )
);

CREATE INDEX IF NOT EXISTS journal_entry_lines_entry_idx ON api.journal_entry_lines (journal_entry_id);
CREATE INDEX IF NOT EXISTS journal_entry_lines_account_idx ON api.journal_entry_lines (account_id);
CREATE INDEX IF NOT EXISTS journal_entry_lines_source_line_idx ON api.journal_entry_lines (source_line_id);

CREATE TABLE IF NOT EXISTS api.accounting_source_links (
  id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
  source_type text NOT NULL,
  source_id uuid NOT NULL,
  journal_entry_id uuid NOT NULL REFERENCES api.journal_entries(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT accounting_source_links_source_type_valid CHECK (source_type IN ('sales_invoice', 'supplier_invoice')),
  CONSTRAINT accounting_source_links_unique_source UNIQUE (source_type, source_id)
);

CREATE INDEX IF NOT EXISTS accounting_source_links_journal_idx ON api.accounting_source_links (journal_entry_id);

DROP TRIGGER IF EXISTS set_gl_accounts_updated_at ON api.gl_accounts;
CREATE TRIGGER set_gl_accounts_updated_at
BEFORE UPDATE ON api.gl_accounts
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

DROP TRIGGER IF EXISTS set_accounting_periods_updated_at ON api.accounting_periods;
CREATE TRIGGER set_accounting_periods_updated_at
BEFORE UPDATE ON api.accounting_periods
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

DROP TRIGGER IF EXISTS set_journal_entries_updated_at ON api.journal_entries;
CREATE TRIGGER set_journal_entries_updated_at
BEFORE UPDATE ON api.journal_entries
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

DROP TRIGGER IF EXISTS set_journal_entry_lines_updated_at ON api.journal_entry_lines;
CREATE TRIGGER set_journal_entry_lines_updated_at
BEFORE UPDATE ON api.journal_entry_lines
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

CREATE OR REPLACE FUNCTION private.accounting_lookup_value_id(
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

CREATE OR REPLACE FUNCTION private.accounting_lookup_value_code(lookup_value_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT value.code
  FROM api.lookup_values value
  WHERE value.id = lookup_value_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.journal_status_id(status_code text)
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT private.accounting_lookup_value_id('journal_entry_status', status_code);
$$;

CREATE OR REPLACE FUNCTION private.journal_status_code(status_lookup_value_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT value.code
  FROM api.lookup_values value
  JOIN api.lookup_types type ON type.id = value.lookup_type_id
  WHERE value.id = status_lookup_value_id
    AND type.code = 'journal_entry_status'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.journal_source_type_id(source_type_code text)
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT private.accounting_lookup_value_id('journal_source_type', source_type_code);
$$;

CREATE OR REPLACE FUNCTION private.default_gl_account(setting_key text)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SET search_path = pg_catalog
AS $$
DECLARE
  configured_code text;
  account_id uuid;
BEGIN
  SELECT NULLIF(setting.setting_value #>> '{}', '')
  INTO configured_code
  FROM api.system_settings setting
  WHERE setting.setting_key = default_gl_account.setting_key
    AND setting.active = true
  LIMIT 1;

  IF configured_code IS NULL THEN
    RAISE EXCEPTION 'Default accounting account setting is missing: %', setting_key USING ERRCODE = '23514';
  END IF;

  SELECT account.id
  INTO account_id
  FROM api.gl_accounts account
  WHERE lower(account.account_code) = lower(configured_code)
    AND account.active = true
    AND account.is_postable = true
    AND NOT EXISTS (
      SELECT 1 FROM api.gl_accounts child
      WHERE child.parent_account_id = account.id
        AND child.active = true
    )
  LIMIT 1;

  IF account_id IS NULL THEN
    RAISE EXCEPTION 'Default accounting account is invalid: %', configured_code USING ERRCODE = '23514';
  END IF;

  RETURN account_id;
END;
$$;

CREATE OR REPLACE FUNCTION private.open_accounting_period_id(target_date date)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SET search_path = pg_catalog
AS $$
DECLARE
  period_id uuid;
BEGIN
  SELECT period.id
  INTO period_id
  FROM api.accounting_periods period
  WHERE target_date BETWEEN period.start_date AND period.end_date
    AND period.is_closed = false
  ORDER BY period.start_date DESC
  LIMIT 1;

  IF period_id IS NULL THEN
    RAISE EXCEPTION 'No open accounting period exists for the journal date' USING ERRCODE = '23514';
  END IF;

  RETURN period_id;
END;
$$;

CREATE OR REPLACE FUNCTION private.next_journal_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  prefix text;
  next_number integer;
BEGIN
  SELECT COALESCE(NULLIF(setting.setting_value #>> '{}', ''), 'JE')
  INTO prefix
  FROM api.system_settings setting
  WHERE setting.setting_key = 'documents.journalEntryPrefix'
    AND setting.active = true
  LIMIT 1;

  prefix := COALESCE(prefix, 'JE');

  SELECT COALESCE(
    MAX(
      NULLIF(
        regexp_replace(entry.journal_number, '^' || prefix || '-' || to_char(current_date, 'YYYY') || '-([0-9]+)$', '\1'),
        entry.journal_number
      )::integer
    ),
    0
  ) + 1
  INTO next_number
  FROM api.journal_entries entry
  WHERE entry.journal_number LIKE prefix || '-' || to_char(current_date, 'YYYY') || '-%';

  RETURN prefix || '-' || to_char(current_date, 'YYYY') || '-' || lpad(next_number::text, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION private.recalculate_journal_totals(target_journal_entry_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  UPDATE api.journal_entries entry
  SET total_debit = COALESCE((
        SELECT round(sum(line.debit_amount)::numeric, 2)
        FROM api.journal_entry_lines line
        WHERE line.journal_entry_id = target_journal_entry_id
      ), 0),
      total_credit = COALESCE((
        SELECT round(sum(line.credit_amount)::numeric, 2)
        FROM api.journal_entry_lines line
        WHERE line.journal_entry_id = target_journal_entry_id
      ), 0)
  WHERE entry.id = target_journal_entry_id;
END;
$$;

CREATE OR REPLACE FUNCTION private.validate_gl_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  NEW.account_code := btrim(NEW.account_code);
  NEW.account_name := btrim(NEW.account_name);

  IF NOT private.lookup_value_has_type(NEW.account_type_lookup_value_id, 'gl_account_type', true) THEN
    RAISE EXCEPTION 'GL account type is invalid' USING ERRCODE = '23514';
  END IF;

  IF NEW.parent_account_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM api.gl_accounts parent
      WHERE parent.id = NEW.parent_account_id
        AND parent.active = true
    ) THEN
    RAISE EXCEPTION 'Parent GL account must be active' USING ERRCODE = '23514';
  END IF;

  IF NEW.is_postable
    AND EXISTS (
      SELECT 1
      FROM api.gl_accounts child
      WHERE child.parent_account_id = NEW.id
        AND child.active = true
    ) THEN
    RAISE EXCEPTION 'GL account with active child accounts cannot be postable' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_gl_account ON api.gl_accounts;
CREATE TRIGGER validate_gl_account
BEFORE INSERT OR UPDATE ON api.gl_accounts
FOR EACH ROW
EXECUTE FUNCTION private.validate_gl_account();

CREATE OR REPLACE FUNCTION private.validate_accounting_period()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  NEW.period_code := btrim(NEW.period_code);
  NEW.period_name := btrim(NEW.period_name);

  IF EXISTS (
    SELECT 1
    FROM api.accounting_periods period
    WHERE period.id <> NEW.id
      AND daterange(period.start_date, period.end_date, '[]')
        && daterange(NEW.start_date, NEW.end_date, '[]')
  ) THEN
    RAISE EXCEPTION 'Accounting periods must not overlap' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_accounting_period ON api.accounting_periods;
CREATE TRIGGER validate_accounting_period
BEFORE INSERT OR UPDATE ON api.accounting_periods
FOR EACH ROW
EXECUTE FUNCTION private.validate_accounting_period();

CREATE OR REPLACE FUNCTION private.validate_journal_entry_header()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  target_status text;
  target_period api.accounting_periods%ROWTYPE;
BEGIN
  NEW.journal_number := btrim(NEW.journal_number);

  IF NOT private.lookup_value_has_type(NEW.status_lookup_value_id, 'journal_entry_status', true) THEN
    RAISE EXCEPTION 'Journal status is invalid' USING ERRCODE = '23514';
  END IF;

  IF NOT private.lookup_value_has_type(NEW.source_type_lookup_value_id, 'journal_source_type', true) THEN
    RAISE EXCEPTION 'Journal source type is invalid' USING ERRCODE = '23514';
  END IF;

  IF NEW.currency_lookup_value_id IS NOT NULL
    AND NOT private.lookup_value_has_type(NEW.currency_lookup_value_id, 'currency', true) THEN
    RAISE EXCEPTION 'Journal currency is invalid' USING ERRCODE = '23514';
  END IF;

  SELECT * INTO target_period
  FROM api.accounting_periods period
  WHERE period.id = NEW.accounting_period_id;

  IF NOT FOUND OR NEW.journal_date NOT BETWEEN target_period.start_date AND target_period.end_date THEN
    RAISE EXCEPTION 'Journal date must fall inside the accounting period' USING ERRCODE = '23514';
  END IF;

  target_status := private.journal_status_code(NEW.status_lookup_value_id);

  IF target_status = 'posted' THEN
    IF target_period.is_closed THEN
      PERFORM private.write_audit_log(
        'accounting.closedPeriodBlocked',
        'journalEntry',
        'blocked',
        'Posting into a closed period was blocked.',
        NEW.id::text,
        jsonb_build_object('journal_number', NEW.journal_number, 'period_code', target_period.period_code)
      );
      RAISE EXCEPTION 'Journal period is closed' USING ERRCODE = '23514';
    END IF;

    IF NEW.posted_by_email IS NULL OR NEW.posted_at IS NULL THEN
      RAISE EXCEPTION 'Posted journal requires posting metadata' USING ERRCODE = '23514';
    END IF;

    IF NEW.total_debit <> NEW.total_credit OR NEW.total_debit <= 0 THEN
      PERFORM private.write_audit_log(
        'accounting.unbalancedJournalBlocked',
        'journalEntry',
        'blocked',
        'Unbalanced journal posting was blocked.',
        NEW.id::text,
        jsonb_build_object('journal_number', NEW.journal_number, 'total_debit', NEW.total_debit, 'total_credit', NEW.total_credit)
      );
      RAISE EXCEPTION 'Posted journal entries must be balanced' USING ERRCODE = '23514';
    END IF;
  END IF;

  IF target_status = 'cancelled'
    AND (NEW.cancelled_by_email IS NULL OR NEW.cancelled_at IS NULL) THEN
    RAISE EXCEPTION 'Cancelled journal requires cancellation metadata' USING ERRCODE = '23514';
  END IF;

  IF TG_OP = 'UPDATE'
    AND private.journal_status_code(OLD.status_lookup_value_id) = 'posted'
    AND NEW IS DISTINCT FROM OLD THEN
    RAISE EXCEPTION 'Posted journal entries are immutable' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_journal_entry_header ON api.journal_entries;
CREATE TRIGGER validate_journal_entry_header
BEFORE INSERT OR UPDATE ON api.journal_entries
FOR EACH ROW
EXECUTE FUNCTION private.validate_journal_entry_header();

CREATE OR REPLACE FUNCTION private.validate_journal_entry_line()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  parent_status text;
BEGIN
  SELECT private.journal_status_code(entry.status_lookup_value_id)
  INTO parent_status
  FROM api.journal_entries entry
  WHERE entry.id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id);

  IF parent_status = 'posted' THEN
    RAISE EXCEPTION 'Posted journal lines are immutable' USING ERRCODE = '23514';
  END IF;

  IF TG_OP <> 'DELETE'
    AND NOT EXISTS (
      SELECT 1
      FROM api.gl_accounts account
      WHERE account.id = NEW.account_id
        AND account.active = true
        AND account.is_postable = true
        AND NOT EXISTS (
          SELECT 1
          FROM api.gl_accounts child
          WHERE child.parent_account_id = account.id
            AND child.active = true
        )
    ) THEN
    RAISE EXCEPTION 'Journal line account must be active and postable' USING ERRCODE = '23514';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS validate_journal_entry_line ON api.journal_entry_lines;
CREATE TRIGGER validate_journal_entry_line
BEFORE INSERT OR UPDATE OR DELETE ON api.journal_entry_lines
FOR EACH ROW
EXECUTE FUNCTION private.validate_journal_entry_line();

CREATE OR REPLACE FUNCTION private.recalculate_journal_totals_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  PERFORM private.recalculate_journal_totals(COALESCE(NEW.journal_entry_id, OLD.journal_entry_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS recalculate_journal_totals_after_line_change ON api.journal_entry_lines;
CREATE TRIGGER recalculate_journal_totals_after_line_change
AFTER INSERT OR UPDATE OR DELETE ON api.journal_entry_lines
FOR EACH ROW
EXECUTE FUNCTION private.recalculate_journal_totals_trigger();

CREATE OR REPLACE FUNCTION private.audit_gl_account_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  changed_account api.gl_accounts%ROWTYPE;
  audit_action text;
  audit_summary text;
BEGIN
  changed_account := COALESCE(NEW, OLD);

  IF TG_OP = 'INSERT' THEN
    audit_action := 'glAccount.created';
    audit_summary := 'GL account was created.';
  ELSIF TG_OP = 'UPDATE' AND OLD.active = true AND NEW.active = false THEN
    audit_action := 'glAccount.deactivated';
    audit_summary := 'GL account was deactivated.';
  ELSIF TG_OP = 'UPDATE' THEN
    audit_action := 'glAccount.updated';
    audit_summary := 'GL account was updated.';
  ELSE
    RETURN changed_account;
  END IF;

  PERFORM private.write_audit_log(
    audit_action,
    'glAccount',
    'success',
    audit_summary,
    changed_account.id::text,
    jsonb_build_object(
      'account_code', changed_account.account_code,
      'account_name', changed_account.account_name,
      'active', changed_account.active
    )
  );

  RETURN changed_account;
END;
$$;

DROP TRIGGER IF EXISTS audit_gl_account_change ON api.gl_accounts;
CREATE TRIGGER audit_gl_account_change
AFTER INSERT OR UPDATE ON api.gl_accounts
FOR EACH ROW
EXECUTE FUNCTION private.audit_gl_account_change();

CREATE OR REPLACE FUNCTION private.audit_accounting_period_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    PERFORM private.write_audit_log(
      'accountingPeriod.updated',
      'accountingPeriod',
      'success',
      'Accounting period was updated.',
      NEW.id::text,
      jsonb_build_object(
        'period_code', NEW.period_code,
        'oldClosed', OLD.is_closed,
        'newClosed', NEW.is_closed
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_accounting_period_change ON api.accounting_periods;
CREATE TRIGGER audit_accounting_period_change
AFTER UPDATE ON api.accounting_periods
FOR EACH ROW
EXECUTE FUNCTION private.audit_accounting_period_change();

INSERT INTO api.gl_accounts (
  account_code,
  account_name,
  account_type_lookup_value_id,
  is_postable,
  active
)
SELECT item.account_code,
       item.account_name,
       private.accounting_lookup_value_id('gl_account_type', item.account_type),
       true,
       true
FROM (
  VALUES
    ('1000', 'Cash', 'asset'),
    ('1100', 'Accounts Receivable', 'asset'),
    ('1200', 'Inventory', 'asset'),
    ('1300', 'Input Tax Receivable', 'asset'),
    ('2000', 'Accounts Payable', 'liability'),
    ('2100', 'Output Tax Payable', 'liability'),
    ('3000', 'Owner Equity', 'equity'),
    ('4000', 'Sales Revenue', 'revenue'),
    ('5000', 'Purchase Expense', 'expense'),
    ('5100', 'Inventory Clearing', 'expense')
) AS item(account_code, account_name, account_type)
ON CONFLICT ((lower(account_code))) DO UPDATE
SET account_name = EXCLUDED.account_name,
    account_type_lookup_value_id = EXCLUDED.account_type_lookup_value_id,
    active = true;

INSERT INTO api.accounting_periods (
  period_code,
  period_name,
  start_date,
  end_date,
  is_closed
)
SELECT '2026-' || lpad(month_number::text, 2, '0'),
       'دوره مالی ' || '2026-' || lpad(month_number::text, 2, '0'),
       make_date(2026, month_number, 1),
       (make_date(2026, month_number, 1) + interval '1 month - 1 day')::date,
       false
FROM generate_series(1, 12) AS month_number
WHERE NOT EXISTS (
  SELECT 1
  FROM api.accounting_periods period
  WHERE period.period_code = '2026-' || lpad(month_number::text, 2, '0')
)
ON CONFLICT (period_code) DO NOTHING;

CREATE OR REPLACE VIEW api.gl_account_view
WITH (security_invoker = true)
AS
SELECT
  account.id,
  account.account_code,
  account.account_name,
  account.account_type_lookup_value_id,
  account_type.code AS account_type_code,
  account_type.label AS account_type_label,
  account.parent_account_id,
  parent.account_code AS parent_account_code,
  parent.account_name AS parent_account_name,
  account.description,
  account.is_postable,
  account.active,
  account.created_at,
  account.updated_at
FROM api.gl_accounts account
JOIN api.lookup_values account_type ON account_type.id = account.account_type_lookup_value_id
LEFT JOIN api.gl_accounts parent ON parent.id = account.parent_account_id;

CREATE OR REPLACE VIEW api.accounting_period_view
WITH (security_invoker = true)
AS
SELECT
  period.id,
  period.period_code,
  period.period_name,
  period.start_date,
  period.end_date,
  period.is_closed,
  period.created_at,
  period.updated_at
FROM api.accounting_periods period;

CREATE OR REPLACE VIEW api.journal_entry_view
WITH (security_invoker = true)
AS
SELECT
  entry.id,
  entry.journal_number,
  status.code AS status_code,
  status.label AS status_label,
  source_type.code AS source_type_code,
  source_type.label AS source_type_label,
  entry.source_id,
  entry.journal_date,
  period.period_code,
  entry.accounting_period_id,
  entry.description,
  entry.currency_lookup_value_id,
  currency.code AS currency_code,
  currency.label AS currency_label,
  entry.total_debit,
  entry.total_credit,
  entry.posted_by_email,
  entry.posted_at,
  entry.cancelled_by_email,
  entry.cancelled_at,
  entry.created_by_email,
  entry.created_at,
  entry.updated_at
FROM api.journal_entries entry
JOIN api.lookup_values status ON status.id = entry.status_lookup_value_id
JOIN api.lookup_values source_type ON source_type.id = entry.source_type_lookup_value_id
JOIN api.accounting_periods period ON period.id = entry.accounting_period_id
LEFT JOIN api.lookup_values currency ON currency.id = entry.currency_lookup_value_id;

CREATE OR REPLACE VIEW api.journal_entry_line_view
WITH (security_invoker = true)
AS
SELECT
  line.id,
  line.journal_entry_id,
  entry.journal_number,
  line.line_number,
  line.account_id,
  account.account_code,
  account.account_name,
  account_type.code AS account_type_code,
  line.description,
  line.debit_amount,
  line.credit_amount,
  line.source_line_id,
  line.created_at,
  line.updated_at
FROM api.journal_entry_lines line
JOIN api.journal_entries entry ON entry.id = line.journal_entry_id
JOIN api.gl_accounts account ON account.id = line.account_id
JOIN api.lookup_values account_type ON account_type.id = account.account_type_lookup_value_id;

CREATE OR REPLACE VIEW api.general_ledger_view
WITH (security_invoker = true)
AS
SELECT
  entry.journal_date,
  entry.journal_number,
  line.account_id,
  account.account_code,
  account.account_name,
  account_type.code AS account_type_code,
  line.description,
  line.debit_amount,
  line.credit_amount,
  source_type.code AS source_type_code,
  entry.source_id,
  entry.posted_by_email,
  entry.posted_at
FROM api.journal_entry_lines line
JOIN api.journal_entries entry ON entry.id = line.journal_entry_id
JOIN api.gl_accounts account ON account.id = line.account_id
JOIN api.lookup_values account_type ON account_type.id = account.account_type_lookup_value_id
JOIN api.lookup_values source_type ON source_type.id = entry.source_type_lookup_value_id
JOIN api.lookup_values status ON status.id = entry.status_lookup_value_id
WHERE status.code = 'posted';

CREATE OR REPLACE FUNCTION private.journal_entry_json(target_journal_entry_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT jsonb_build_object(
    'id', entry.id,
    'journalNumber', entry.journal_number,
    'statusCode', entry.status_code,
    'statusLabel', entry.status_label,
    'sourceTypeCode', entry.source_type_code,
    'sourceTypeLabel', entry.source_type_label,
    'sourceId', entry.source_id,
    'journalDate', entry.journal_date,
    'accountingPeriodId', entry.accounting_period_id,
    'periodCode', entry.period_code,
    'description', entry.description,
    'currencyLookupValueId', entry.currency_lookup_value_id,
    'currencyCode', entry.currency_code,
    'currencyLabel', entry.currency_label,
    'totalDebit', entry.total_debit,
    'totalCredit', entry.total_credit,
    'postedByEmail', entry.posted_by_email,
    'postedAt', entry.posted_at,
    'cancelledByEmail', entry.cancelled_by_email,
    'cancelledAt', entry.cancelled_at,
    'createdByEmail', entry.created_by_email,
    'createdAt', entry.created_at,
    'updatedAt', entry.updated_at,
    'lines', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', line.id,
            'journalEntryId', line.journal_entry_id,
            'lineNumber', line.line_number,
            'accountId', line.account_id,
            'accountCode', line.account_code,
            'accountName', line.account_name,
            'accountTypeCode', line.account_type_code,
            'description', line.description,
            'debitAmount', line.debit_amount,
            'creditAmount', line.credit_amount,
            'sourceLineId', line.source_line_id
          )
          ORDER BY line.line_number
        )
        FROM api.journal_entry_line_view line
        WHERE line.journal_entry_id = entry.id
      ),
      '[]'::jsonb
    )
  )
  FROM api.journal_entry_view entry
  WHERE entry.id = target_journal_entry_id;
$$;

CREATE OR REPLACE FUNCTION private.insert_journal_line(
  target_journal_entry_id uuid,
  target_line_number integer,
  target_account_id uuid,
  target_description text,
  target_debit_amount numeric,
  target_credit_amount numeric,
  target_source_line_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  line_id uuid;
BEGIN
  INSERT INTO api.journal_entry_lines (
    journal_entry_id,
    line_number,
    account_id,
    description,
    debit_amount,
    credit_amount,
    source_line_id
  )
  VALUES (
    target_journal_entry_id,
    target_line_number,
    target_account_id,
    NULLIF(btrim(COALESCE(target_description, '')), ''),
    round(COALESCE(target_debit_amount, 0)::numeric, 2),
    round(COALESCE(target_credit_amount, 0)::numeric, 2),
    target_source_line_id
  )
  RETURNING id INTO line_id;

  RETURN line_id;
END;
$$;

CREATE OR REPLACE FUNCTION private.create_journal_header(
  target_source_type text,
  target_source_id uuid,
  target_journal_date date,
  target_description text,
  target_currency_lookup_value_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  journal_id uuid;
  resolved_date date := COALESCE(target_journal_date, current_date);
BEGIN
  INSERT INTO api.journal_entries (
    journal_number,
    status_lookup_value_id,
    source_type_lookup_value_id,
    source_id,
    journal_date,
    accounting_period_id,
    description,
    currency_lookup_value_id,
    created_by_user_id,
    created_by_email
  )
  VALUES (
    private.next_journal_number(),
    private.journal_status_id('draft'),
    private.journal_source_type_id(target_source_type),
    target_source_id,
    resolved_date,
    private.open_accounting_period_id(resolved_date),
    NULLIF(btrim(COALESCE(target_description, '')), ''),
    target_currency_lookup_value_id,
    private.current_request_user_id(),
    private.current_request_email()
  )
  RETURNING id INTO journal_id;

  RETURN journal_id;
END;
$$;

CREATE OR REPLACE FUNCTION private.post_journal_entry_internal(target_journal_entry_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  target_entry api.journal_entries%ROWTYPE;
BEGIN
  PERFORM private.recalculate_journal_totals(target_journal_entry_id);

  SELECT * INTO target_entry
  FROM api.journal_entries entry
  WHERE entry.id = target_journal_entry_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Journal entry not found' USING ERRCODE = 'P0002';
  END IF;

  IF private.journal_status_code(target_entry.status_lookup_value_id) <> 'draft' THEN
    RAISE EXCEPTION 'Only draft journal entries can be posted' USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM api.journal_entry_lines line WHERE line.journal_entry_id = target_entry.id
  ) OR (
    SELECT count(*) FROM api.journal_entry_lines line WHERE line.journal_entry_id = target_entry.id
  ) < 2 THEN
    RAISE EXCEPTION 'Journal entry must have at least two lines' USING ERRCODE = '23514';
  END IF;

  IF target_entry.total_debit <> target_entry.total_credit OR target_entry.total_debit <= 0 THEN
    PERFORM private.write_audit_log(
      'accounting.unbalancedJournalBlocked',
      'journalEntry',
      'blocked',
      'Unbalanced journal posting was blocked.',
      target_entry.id::text,
      jsonb_build_object('journal_number', target_entry.journal_number, 'total_debit', target_entry.total_debit, 'total_credit', target_entry.total_credit)
    );
    RAISE EXCEPTION 'Journal entry is not balanced' USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM api.accounting_periods period
    WHERE period.id = target_entry.accounting_period_id
      AND target_entry.journal_date BETWEEN period.start_date AND period.end_date
      AND period.is_closed = false
  ) THEN
    PERFORM private.write_audit_log(
      'accounting.closedPeriodBlocked',
      'journalEntry',
      'blocked',
      'Posting into a closed period was blocked.',
      target_entry.id::text,
      jsonb_build_object('journal_number', target_entry.journal_number)
    );
    RAISE EXCEPTION 'Journal period is closed' USING ERRCODE = '23514';
  END IF;

  UPDATE api.journal_entries entry
  SET status_lookup_value_id = private.journal_status_id('posted'),
      posted_by_user_id = private.current_request_user_id(),
      posted_by_email = private.current_request_email(),
      posted_at = statement_timestamp()
  WHERE entry.id = target_entry.id;
END;
$$;

CREATE OR REPLACE FUNCTION api.create_manual_journal_entry(
  journal_date date DEFAULT current_date,
  description text DEFAULT NULL,
  currency_lookup_value_id uuid DEFAULT NULL,
  lines jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  journal_id uuid;
  line_item jsonb;
  line_number integer := 0;
  parsed_account_id uuid;
  parsed_debit numeric;
  parsed_credit numeric;
BEGIN
  IF jsonb_typeof(lines) <> 'array' OR jsonb_array_length(lines) < 2 THEN
    RETURN private.inventory_error_response('23514', 'Manual journal requires at least two lines');
  END IF;

  journal_id := private.create_journal_header(
    'manual',
    NULL,
    COALESCE(journal_date, current_date),
    description,
    currency_lookup_value_id
  );

  FOR line_item IN SELECT value FROM jsonb_array_elements(lines)
  LOOP
    line_number := line_number + 1;
    parsed_account_id := NULLIF(COALESCE(line_item->>'accountId', line_item->>'account_id'), '')::uuid;
    parsed_debit := COALESCE(NULLIF(COALESCE(line_item->>'debitAmount', line_item->>'debit_amount'), '')::numeric, 0);
    parsed_credit := COALESCE(NULLIF(COALESCE(line_item->>'creditAmount', line_item->>'credit_amount'), '')::numeric, 0);

    PERFORM private.insert_journal_line(
      journal_id,
      line_number,
      parsed_account_id,
      COALESCE(line_item->>'description', ''),
      parsed_debit,
      parsed_credit
    );
  END LOOP;

  PERFORM private.recalculate_journal_totals(journal_id);
  PERFORM private.write_audit_log(
    'journalEntry.created',
    'journalEntry',
    'success',
    'Manual journal entry was created.',
    journal_id::text,
    jsonb_build_object(
      'journal_number', (SELECT journal_number FROM api.journal_entries WHERE id = journal_id),
      'source_type', 'manual'
    )
  );

  RETURN private.journal_entry_json(journal_id);
EXCEPTION WHEN OTHERS THEN
  RETURN private.inventory_error_response(SQLSTATE, SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION api.post_journal_entry(journal_entry_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  target_number text;
BEGIN
  PERFORM private.post_journal_entry_internal(journal_entry_id);

  SELECT journal_number INTO target_number
  FROM api.journal_entries
  WHERE id = journal_entry_id;

  PERFORM private.write_audit_log(
    'journalEntry.posted',
    'journalEntry',
    'success',
    'Journal entry was posted.',
    journal_entry_id::text,
    jsonb_build_object('journal_number', target_number)
  );

  RETURN private.journal_entry_json(journal_entry_id);
EXCEPTION WHEN OTHERS THEN
  RETURN private.inventory_error_response(SQLSTATE, SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION api.cancel_journal_entry(journal_entry_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  target_entry api.journal_entries%ROWTYPE;
BEGIN
  SELECT * INTO target_entry
  FROM api.journal_entries entry
  WHERE entry.id = journal_entry_id;

  IF NOT FOUND THEN
    RETURN private.inventory_error_response('P0002', 'Journal entry not found', '404');
  END IF;

  IF private.journal_status_code(target_entry.status_lookup_value_id) <> 'draft' THEN
    RETURN private.inventory_error_response('23514', 'Only draft journal entries can be cancelled');
  END IF;

  UPDATE api.journal_entries entry
  SET status_lookup_value_id = private.journal_status_id('cancelled'),
      cancelled_by_user_id = private.current_request_user_id(),
      cancelled_by_email = private.current_request_email(),
      cancelled_at = statement_timestamp()
  WHERE entry.id = target_entry.id;

  PERFORM private.write_audit_log(
    'journalEntry.cancelled',
    'journalEntry',
    'success',
    'Draft journal entry was cancelled.',
    target_entry.id::text,
    jsonb_build_object('journal_number', target_entry.journal_number)
  );

  RETURN private.journal_entry_json(target_entry.id);
END;
$$;

CREATE OR REPLACE FUNCTION api.post_sales_invoice_accounting(sales_invoice_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  target_invoice api.sales_invoices%ROWTYPE;
  journal_id uuid;
  line_no integer := 1;
BEGIN
  SELECT * INTO target_invoice
  FROM api.sales_invoices invoice
  WHERE invoice.id = sales_invoice_id;

  IF NOT FOUND THEN
    RETURN private.inventory_error_response('P0002', 'Sales invoice not found', '404');
  END IF;

  IF private.sales_invoice_status_code(target_invoice.status_lookup_value_id) <> 'issued' THEN
    RETURN private.inventory_error_response('23514', 'Only issued sales invoices can be posted to accounting');
  END IF;

  IF EXISTS (
    SELECT 1 FROM api.accounting_source_links link
    WHERE link.source_type = 'sales_invoice'
      AND link.source_id = target_invoice.id
  ) THEN
    PERFORM private.write_audit_log(
      'accounting.duplicatePostingBlocked',
      'salesInvoice',
      'blocked',
      'Duplicate accounting posting was blocked.',
      target_invoice.id::text,
      jsonb_build_object('source_type', 'sales_invoice', 'source_id', target_invoice.id)
    );
    RETURN private.inventory_error_response('23505', 'Sales invoice accounting is already posted', '409');
  END IF;

  journal_id := private.create_journal_header(
    'sales_invoice',
    target_invoice.id,
    target_invoice.invoice_date,
    'Accounting posting for sales invoice ' || target_invoice.invoice_number,
    target_invoice.currency_lookup_value_id
  );

  PERFORM private.insert_journal_line(
    journal_id,
    line_no,
    private.default_gl_account('accounting.defaultAccounts.accountsReceivable'),
    'Accounts receivable for sales invoice ' || target_invoice.invoice_number,
    target_invoice.total_amount,
    0,
    target_invoice.id
  );
  line_no := line_no + 1;

  PERFORM private.insert_journal_line(
    journal_id,
    line_no,
    private.default_gl_account('accounting.defaultAccounts.salesRevenue'),
    'Sales revenue for invoice ' || target_invoice.invoice_number,
    0,
    target_invoice.subtotal_amount,
    target_invoice.id
  );
  line_no := line_no + 1;

  IF target_invoice.tax_amount > 0 THEN
    PERFORM private.insert_journal_line(
      journal_id,
      line_no,
      private.default_gl_account('accounting.defaultAccounts.outputTax'),
      'Output tax for invoice ' || target_invoice.invoice_number,
      0,
      target_invoice.tax_amount,
      target_invoice.id
    );
  END IF;

  PERFORM private.post_journal_entry_internal(journal_id);

  INSERT INTO api.accounting_source_links (source_type, source_id, journal_entry_id)
  VALUES ('sales_invoice', target_invoice.id, journal_id);

  PERFORM private.write_audit_log(
    'accounting.salesInvoicePosted',
    'journalEntry',
    'success',
    'Sales invoice accounting journal was posted.',
    journal_id::text,
    jsonb_build_object(
      'journal_number', (SELECT journal_number FROM api.journal_entries WHERE id = journal_id),
      'source_type', 'sales_invoice',
      'source_id', target_invoice.id,
      'total_debit', target_invoice.total_amount,
      'total_credit', target_invoice.total_amount
    )
  );

  RETURN private.journal_entry_json(journal_id);
EXCEPTION WHEN OTHERS THEN
  RETURN private.inventory_error_response(SQLSTATE, SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION api.post_supplier_invoice_accounting(supplier_invoice_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  target_invoice api.supplier_invoices%ROWTYPE;
  journal_id uuid;
  line_no integer := 1;
BEGIN
  SELECT * INTO target_invoice
  FROM api.supplier_invoices invoice
  WHERE invoice.id = supplier_invoice_id;

  IF NOT FOUND THEN
    RETURN private.inventory_error_response('P0002', 'Supplier invoice not found', '404');
  END IF;

  IF private.supplier_invoice_status_code(target_invoice.status_lookup_value_id) <> 'posted' THEN
    RETURN private.inventory_error_response('23514', 'Only posted supplier invoices can be posted to accounting');
  END IF;

  IF EXISTS (
    SELECT 1 FROM api.accounting_source_links link
    WHERE link.source_type = 'supplier_invoice'
      AND link.source_id = target_invoice.id
  ) THEN
    PERFORM private.write_audit_log(
      'accounting.duplicatePostingBlocked',
      'supplierInvoice',
      'blocked',
      'Duplicate accounting posting was blocked.',
      target_invoice.id::text,
      jsonb_build_object('source_type', 'supplier_invoice', 'source_id', target_invoice.id)
    );
    RETURN private.inventory_error_response('23505', 'Supplier invoice accounting is already posted', '409');
  END IF;

  journal_id := private.create_journal_header(
    'supplier_invoice',
    target_invoice.id,
    target_invoice.invoice_date,
    'Accounting posting for supplier invoice ' || target_invoice.invoice_number,
    target_invoice.currency_lookup_value_id
  );

  PERFORM private.insert_journal_line(
    journal_id,
    line_no,
    private.default_gl_account('accounting.defaultAccounts.purchaseExpense'),
    'Purchase expense for supplier invoice ' || target_invoice.invoice_number,
    target_invoice.subtotal_amount,
    0,
    target_invoice.id
  );
  line_no := line_no + 1;

  IF target_invoice.tax_amount > 0 THEN
    PERFORM private.insert_journal_line(
      journal_id,
      line_no,
      private.default_gl_account('accounting.defaultAccounts.inputTax'),
      'Input tax for supplier invoice ' || target_invoice.invoice_number,
      target_invoice.tax_amount,
      0,
      target_invoice.id
    );
    line_no := line_no + 1;
  END IF;

  PERFORM private.insert_journal_line(
    journal_id,
    line_no,
    private.default_gl_account('accounting.defaultAccounts.accountsPayable'),
    'Accounts payable for supplier invoice ' || target_invoice.invoice_number,
    0,
    target_invoice.total_amount,
    target_invoice.id
  );

  PERFORM private.post_journal_entry_internal(journal_id);

  INSERT INTO api.accounting_source_links (source_type, source_id, journal_entry_id)
  VALUES ('supplier_invoice', target_invoice.id, journal_id);

  PERFORM private.write_audit_log(
    'accounting.supplierInvoicePosted',
    'journalEntry',
    'success',
    'Supplier invoice accounting journal was posted.',
    journal_id::text,
    jsonb_build_object(
      'journal_number', (SELECT journal_number FROM api.journal_entries WHERE id = journal_id),
      'source_type', 'supplier_invoice',
      'source_id', target_invoice.id,
      'total_debit', target_invoice.total_amount,
      'total_credit', target_invoice.total_amount
    )
  );

  RETURN private.journal_entry_json(journal_id);
EXCEPTION WHEN OTHERS THEN
  RETURN private.inventory_error_response(SQLSTATE, SQLERRM);
END;
$$;

REVOKE ALL ON TABLE api.gl_accounts FROM PUBLIC;
REVOKE ALL ON TABLE api.accounting_periods FROM PUBLIC;
REVOKE ALL ON TABLE api.journal_entries FROM PUBLIC;
REVOKE ALL ON TABLE api.journal_entry_lines FROM PUBLIC;
REVOKE ALL ON TABLE api.accounting_source_links FROM PUBLIC;
REVOKE ALL ON FUNCTION private.accounting_lookup_value_id(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.accounting_lookup_value_code(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.journal_status_id(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.journal_status_code(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.journal_source_type_id(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.default_gl_account(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.open_accounting_period_id(date) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.next_journal_number() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.recalculate_journal_totals(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.validate_gl_account() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.validate_accounting_period() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.validate_journal_entry_header() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.validate_journal_entry_line() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.recalculate_journal_totals_trigger() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.audit_gl_account_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.audit_accounting_period_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.journal_entry_json(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.insert_journal_line(uuid, integer, uuid, text, numeric, numeric, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.create_journal_header(text, uuid, date, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.post_journal_entry_internal(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.create_manual_journal_entry(date, text, uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.post_journal_entry(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.cancel_journal_entry(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.post_sales_invoice_accounting(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.post_supplier_invoice_accounting(uuid) FROM PUBLIC;

GRANT USAGE ON SCHEMA api TO erp_admin, erp_manager, erp_accountant;
GRANT SELECT ON api.lookup_types, api.lookup_values TO erp_admin, erp_manager, erp_accountant;
GRANT SELECT ON api.gl_accounts, api.gl_account_view TO erp_admin, erp_manager, erp_accountant;
GRANT INSERT, UPDATE, DELETE ON api.gl_accounts TO erp_admin;
GRANT INSERT, UPDATE ON api.gl_accounts TO erp_accountant;
GRANT SELECT ON api.accounting_periods, api.accounting_period_view TO erp_admin, erp_manager, erp_accountant;
GRANT INSERT, UPDATE, DELETE ON api.accounting_periods TO erp_admin;
GRANT UPDATE ON api.accounting_periods TO erp_accountant;
GRANT SELECT ON api.journal_entries, api.journal_entry_lines, api.accounting_source_links TO erp_admin, erp_manager, erp_accountant;
GRANT SELECT ON api.journal_entry_view, api.journal_entry_line_view, api.general_ledger_view TO erp_admin, erp_manager, erp_accountant;
GRANT SELECT ON api.sales_invoices, api.sales_invoice_view TO erp_admin, erp_accountant;
GRANT SELECT ON api.supplier_invoices, api.supplier_invoice_view TO erp_admin, erp_accountant;
GRANT EXECUTE ON FUNCTION api.create_manual_journal_entry(date, text, uuid, jsonb) TO erp_admin, erp_accountant;
GRANT EXECUTE ON FUNCTION api.post_journal_entry(uuid) TO erp_admin, erp_accountant;
GRANT EXECUTE ON FUNCTION api.cancel_journal_entry(uuid) TO erp_admin, erp_accountant;
GRANT EXECUTE ON FUNCTION api.post_sales_invoice_accounting(uuid) TO erp_admin, erp_accountant;
GRANT EXECUTE ON FUNCTION api.post_supplier_invoice_accounting(uuid) TO erp_admin, erp_accountant;

ALTER TABLE api.gl_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.accounting_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.accounting_source_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.gl_accounts FORCE ROW LEVEL SECURITY;
ALTER TABLE api.accounting_periods FORCE ROW LEVEL SECURITY;
ALTER TABLE api.journal_entries FORCE ROW LEVEL SECURITY;
ALTER TABLE api.journal_entry_lines FORCE ROW LEVEL SECURITY;
ALTER TABLE api.accounting_source_links FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS gl_accounts_select_policy ON api.gl_accounts;
DROP POLICY IF EXISTS gl_accounts_insert_policy ON api.gl_accounts;
DROP POLICY IF EXISTS gl_accounts_update_policy ON api.gl_accounts;
DROP POLICY IF EXISTS gl_accounts_delete_policy ON api.gl_accounts;
DROP POLICY IF EXISTS accounting_periods_select_policy ON api.accounting_periods;
DROP POLICY IF EXISTS accounting_periods_insert_policy ON api.accounting_periods;
DROP POLICY IF EXISTS accounting_periods_update_policy ON api.accounting_periods;
DROP POLICY IF EXISTS accounting_periods_delete_policy ON api.accounting_periods;
DROP POLICY IF EXISTS journal_entries_select_policy ON api.journal_entries;
DROP POLICY IF EXISTS journal_entry_lines_select_policy ON api.journal_entry_lines;
DROP POLICY IF EXISTS accounting_source_links_select_policy ON api.accounting_source_links;

CREATE POLICY gl_accounts_select_policy
ON api.gl_accounts
FOR SELECT
TO erp_admin, erp_manager, erp_accountant
USING (true);

CREATE POLICY gl_accounts_insert_policy
ON api.gl_accounts
FOR INSERT
TO erp_admin, erp_accountant
WITH CHECK (true);

CREATE POLICY gl_accounts_update_policy
ON api.gl_accounts
FOR UPDATE
TO erp_admin, erp_accountant
USING (true)
WITH CHECK (true);

CREATE POLICY gl_accounts_delete_policy
ON api.gl_accounts
FOR DELETE
TO erp_admin
USING (true);

CREATE POLICY accounting_periods_select_policy
ON api.accounting_periods
FOR SELECT
TO erp_admin, erp_manager, erp_accountant
USING (true);

CREATE POLICY accounting_periods_insert_policy
ON api.accounting_periods
FOR INSERT
TO erp_admin
WITH CHECK (true);

CREATE POLICY accounting_periods_update_policy
ON api.accounting_periods
FOR UPDATE
TO erp_admin, erp_accountant
USING (true)
WITH CHECK (true);

CREATE POLICY accounting_periods_delete_policy
ON api.accounting_periods
FOR DELETE
TO erp_admin
USING (true);

CREATE POLICY journal_entries_select_policy
ON api.journal_entries
FOR SELECT
TO erp_admin, erp_manager, erp_accountant
USING (true);

CREATE POLICY journal_entry_lines_select_policy
ON api.journal_entry_lines
FOR SELECT
TO erp_admin, erp_manager, erp_accountant
USING (true);

CREATE POLICY accounting_source_links_select_policy
ON api.accounting_source_links
FOR SELECT
TO erp_admin, erp_manager, erp_accountant
USING (true);

COMMIT;
