BEGIN;

CREATE OR REPLACE FUNCTION private.config_text_is_safe(value text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog
AS $$
  SELECT value IS NOT NULL
    AND value !~* '(password|token|secret|jwt|key|credential)';
$$;

CREATE OR REPLACE FUNCTION private.config_metadata_is_safe(metadata jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog
AS $$
  SELECT COALESCE(private.sanitize_audit_metadata(metadata), '{}'::jsonb) = COALESCE(metadata, '{}'::jsonb);
$$;

CREATE OR REPLACE FUNCTION private.setting_value_matches_type(setting_value jsonb, value_type text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog
AS $$
  SELECT CASE value_type
    WHEN 'string' THEN jsonb_typeof(setting_value) = 'string'
    WHEN 'number' THEN jsonb_typeof(setting_value) = 'number'
    WHEN 'boolean' THEN jsonb_typeof(setting_value) = 'boolean'
    WHEN 'json' THEN jsonb_typeof(setting_value) IN ('object', 'array')
    ELSE false
  END;
$$;

CREATE TABLE IF NOT EXISTS api.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL,
  value_type text NOT NULL,
  category text NOT NULL,
  label text NOT NULL,
  description text,
  editable boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  CONSTRAINT system_settings_key_not_blank CHECK (length(btrim(setting_key)) > 0),
  CONSTRAINT system_settings_category_not_blank CHECK (length(btrim(category)) > 0),
  CONSTRAINT system_settings_label_not_blank CHECK (length(btrim(label)) > 0),
  CONSTRAINT system_settings_value_type_valid CHECK (value_type IN ('string', 'number', 'boolean', 'json')),
  CONSTRAINT system_settings_value_matches_type CHECK (
    private.setting_value_matches_type(setting_value, value_type)
  ),
  CONSTRAINT system_settings_key_safe CHECK (private.config_text_is_safe(setting_key)),
  CONSTRAINT system_settings_value_safe CHECK (private.config_text_is_safe(setting_value::text))
);

CREATE INDEX IF NOT EXISTS system_settings_key_idx ON api.system_settings (setting_key);
CREATE INDEX IF NOT EXISTS system_settings_category_idx ON api.system_settings (category);
CREATE INDEX IF NOT EXISTS system_settings_active_idx ON api.system_settings (active);

DROP TRIGGER IF EXISTS set_system_settings_updated_at ON api.system_settings;
CREATE TRIGGER set_system_settings_updated_at
BEFORE UPDATE ON api.system_settings
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

CREATE TABLE IF NOT EXISTS api.lookup_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  system boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  CONSTRAINT lookup_types_code_not_blank CHECK (length(btrim(code)) > 0),
  CONSTRAINT lookup_types_name_not_blank CHECK (length(btrim(name)) > 0),
  CONSTRAINT lookup_types_code_safe CHECK (private.config_text_is_safe(code))
);

CREATE INDEX IF NOT EXISTS lookup_types_code_idx ON api.lookup_types (code);
CREATE INDEX IF NOT EXISTS lookup_types_active_idx ON api.lookup_types (active);

DROP TRIGGER IF EXISTS set_lookup_types_updated_at ON api.lookup_types;
CREATE TRIGGER set_lookup_types_updated_at
BEFORE UPDATE ON api.lookup_types
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

CREATE TABLE IF NOT EXISTS api.lookup_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lookup_type_id uuid NOT NULL REFERENCES api.lookup_types(id) ON DELETE RESTRICT,
  code text NOT NULL,
  label text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  system boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  CONSTRAINT lookup_values_code_not_blank CHECK (length(btrim(code)) > 0),
  CONSTRAINT lookup_values_label_not_blank CHECK (length(btrim(label)) > 0),
  CONSTRAINT lookup_values_code_safe CHECK (private.config_text_is_safe(code)),
  CONSTRAINT lookup_values_metadata_safe CHECK (private.config_metadata_is_safe(metadata)),
  CONSTRAINT lookup_values_type_code_unique UNIQUE (lookup_type_id, code)
);

CREATE INDEX IF NOT EXISTS lookup_values_code_idx ON api.lookup_values (lookup_type_id, code);
CREATE INDEX IF NOT EXISTS lookup_values_active_idx ON api.lookup_values (active);
CREATE INDEX IF NOT EXISTS lookup_values_sort_order_idx ON api.lookup_values (lookup_type_id, sort_order, label);

DROP TRIGGER IF EXISTS set_lookup_values_updated_at ON api.lookup_values;
CREATE TRIGGER set_lookup_values_updated_at
BEFORE UPDATE ON api.lookup_values
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

CREATE TABLE IF NOT EXISTS api.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  label text NOT NULL,
  description text,
  category text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  CONSTRAINT feature_flags_key_not_blank CHECK (length(btrim(flag_key)) > 0),
  CONSTRAINT feature_flags_label_not_blank CHECK (length(btrim(label)) > 0),
  CONSTRAINT feature_flags_category_not_blank CHECK (length(btrim(category)) > 0),
  CONSTRAINT feature_flags_key_safe CHECK (private.config_text_is_safe(flag_key))
);

CREATE INDEX IF NOT EXISTS feature_flags_key_idx ON api.feature_flags (flag_key);
CREATE INDEX IF NOT EXISTS feature_flags_category_idx ON api.feature_flags (category);
CREATE INDEX IF NOT EXISTS feature_flags_enabled_idx ON api.feature_flags (enabled);

DROP TRIGGER IF EXISTS set_feature_flags_updated_at ON api.feature_flags;
CREATE TRIGGER set_feature_flags_updated_at
BEFORE UPDATE ON api.feature_flags
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

REVOKE ALL ON TABLE api.system_settings FROM PUBLIC;
REVOKE ALL ON TABLE api.lookup_types FROM PUBLIC;
REVOKE ALL ON TABLE api.lookup_values FROM PUBLIC;
REVOKE ALL ON TABLE api.feature_flags FROM PUBLIC;

ALTER TABLE api.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.lookup_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.lookup_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS system_settings_read_policy ON api.system_settings;
DROP POLICY IF EXISTS lookup_types_read_policy ON api.lookup_types;
DROP POLICY IF EXISTS lookup_values_read_policy ON api.lookup_values;
DROP POLICY IF EXISTS feature_flags_read_policy ON api.feature_flags;

CREATE POLICY system_settings_read_policy ON api.system_settings
FOR SELECT TO erp_admin, erp_manager
USING (true);

CREATE POLICY lookup_types_read_policy ON api.lookup_types
FOR SELECT TO erp_admin, erp_manager
USING (true);

CREATE POLICY lookup_values_read_policy ON api.lookup_values
FOR SELECT TO erp_admin, erp_manager
USING (true);

CREATE POLICY feature_flags_read_policy ON api.feature_flags
FOR SELECT TO erp_admin, erp_manager
USING (true);

GRANT USAGE ON SCHEMA api TO erp_admin, erp_manager;
GRANT SELECT ON TABLE api.system_settings TO erp_admin, erp_manager;
GRANT SELECT ON TABLE api.lookup_types TO erp_admin, erp_manager;
GRANT SELECT ON TABLE api.lookup_values TO erp_admin, erp_manager;
GRANT SELECT ON TABLE api.feature_flags TO erp_admin, erp_manager;

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
  ('company.name', '"Daqiq ERP"', 'string', 'company', 'نام شرکت', 'نام نمایشی شرکت در اسناد و گزارش‌ها', true, true),
  ('company.defaultCurrency', '"IRR"', 'string', 'company', 'ارز پیش‌فرض', 'ارز پیش‌فرض سامانه', true, true),
  ('company.defaultLocale', '"fa-IR"', 'string', 'company', 'زبان پیش‌فرض', 'زبان و قالب منطقه‌ای پیش‌فرض', true, true),
  ('documents.salesOrderPrefix', '"SO"', 'string', 'documents', 'پیشوند سفارش فروش', NULL, true, true),
  ('documents.purchaseOrderPrefix', '"PO"', 'string', 'documents', 'پیشوند سفارش خرید', NULL, true, true),
  ('documents.invoicePrefix', '"INV"', 'string', 'documents', 'پیشوند فاکتور', NULL, true, true),
  ('inventory.allowNegativeStock', 'false', 'boolean', 'inventory', 'موجودی منفی', 'اجازه ثبت موجودی منفی', true, true),
  ('ui.defaultPageSize', '20', 'number', 'ui', 'اندازه صفحه پیش‌فرض', NULL, true, true),
  ('system.releaseChannel', '"local"', 'string', 'system', 'کانال انتشار', 'تنظیم سیستمی فقط خواندنی', false, true)
ON CONFLICT (setting_key) DO NOTHING;

WITH upserted_types AS (
  INSERT INTO api.lookup_types (code, name, description, system, active)
  VALUES
    ('unit', 'واحد سنجش', NULL, true, true),
    ('currency', 'ارز', NULL, true, true),
    ('tax_rate', 'نرخ مالیات', NULL, true, true),
    ('product_category', 'دسته محصول', NULL, true, true),
    ('customer_group', 'گروه مشتری', NULL, true, true),
    ('supplier_group', 'گروه تامین‌کننده', NULL, true, true)
  ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name
  RETURNING id, code
),
all_types AS (
  SELECT id, code FROM upserted_types
  UNION
  SELECT id, code FROM api.lookup_types
  WHERE code IN ('unit', 'currency', 'tax_rate', 'product_category', 'customer_group', 'supplier_group')
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
SELECT type_row.id, seed.code, seed.label, seed.sort_order, '{}'::jsonb, true, true
FROM all_types type_row
JOIN (
  VALUES
    ('unit', 'kg', 'کیلوگرم', 10),
    ('unit', 'g', 'گرم', 20),
    ('unit', 'liter', 'لیتر', 30),
    ('unit', 'piece', 'عدد', 40),
    ('currency', 'EUR', 'یورو', 10),
    ('currency', 'IRR', 'ریال ایران', 20),
    ('currency', 'USD', 'دلار آمریکا', 30),
    ('tax_rate', 'zero', 'معاف از مالیات', 10),
    ('tax_rate', 'standard', 'نرخ استاندارد', 20),
    ('tax_rate', 'reduced', 'نرخ کاهش‌یافته', 30),
    ('product_category', 'raw_material', 'مواد اولیه', 10),
    ('product_category', 'finished_good', 'کالای ساخته‌شده', 20),
    ('product_category', 'packaging', 'بسته‌بندی', 30),
    ('customer_group', 'regular', 'عادی', 10),
    ('customer_group', 'vip', 'ویژه', 20),
    ('customer_group', 'wholesale', 'عمده‌فروش', 30),
    ('supplier_group', 'local', 'داخلی', 10),
    ('supplier_group', 'international', 'بین‌المللی', 20)
) AS seed(type_code, code, label, sort_order)
  ON seed.type_code = type_row.code
ON CONFLICT (lookup_type_id, code) DO NOTHING;

INSERT INTO api.feature_flags (flag_key, enabled, label, description, category)
VALUES
  ('customers.enabled', true, 'مشتریان', 'فعال بودن ماژول مشتریان', 'master-data'),
  ('users.enabled', true, 'کاربران', 'فعال بودن مدیریت کاربران', 'admin'),
  ('audit.enabled', true, 'گزارش فعالیت‌ها', 'فعال بودن گزارش فعالیت‌ها', 'admin'),
  ('suppliers.enabled', false, 'تامین‌کنندگان', NULL, 'future'),
  ('products.enabled', false, 'محصولات', NULL, 'future'),
  ('inventory.enabled', false, 'انبار', NULL, 'future'),
  ('purchasing.enabled', false, 'خرید', NULL, 'future'),
  ('sales.enabled', false, 'فروش', NULL, 'future'),
  ('accounting.enabled', false, 'حسابداری', NULL, 'future'),
  ('reports.enabled', false, 'گزارش‌ها', NULL, 'future')
ON CONFLICT (flag_key) DO NOTHING;

CREATE OR REPLACE FUNCTION private.system_setting_json(setting_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT jsonb_build_object(
    'id', setting.id,
    'settingKey', setting.setting_key,
    'settingValue', setting.setting_value,
    'valueType', setting.value_type,
    'category', setting.category,
    'label', setting.label,
    'description', setting.description,
    'editable', setting.editable,
    'active', setting.active,
    'createdAt', setting.created_at,
    'updatedAt', setting.updated_at
  )
  FROM api.system_settings setting
  WHERE setting.id = setting_id;
$$;

CREATE OR REPLACE FUNCTION private.lookup_type_json(type_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT jsonb_build_object(
    'id', lookup_type.id,
    'code', lookup_type.code,
    'name', lookup_type.name,
    'description', lookup_type.description,
    'system', lookup_type.system,
    'active', lookup_type.active,
    'createdAt', lookup_type.created_at,
    'updatedAt', lookup_type.updated_at
  )
  FROM api.lookup_types lookup_type
  WHERE lookup_type.id = type_id;
$$;

CREATE OR REPLACE FUNCTION private.lookup_value_json(value_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT jsonb_build_object(
    'id', lookup_value.id,
    'lookupTypeId', lookup_value.lookup_type_id,
    'lookupTypeCode', lookup_type.code,
    'code', lookup_value.code,
    'label', lookup_value.label,
    'description', lookup_value.description,
    'sortOrder', lookup_value.sort_order,
    'metadata', private.sanitize_audit_metadata(lookup_value.metadata),
    'system', lookup_value.system,
    'active', lookup_value.active,
    'createdAt', lookup_value.created_at,
    'updatedAt', lookup_value.updated_at
  )
  FROM api.lookup_values lookup_value
  JOIN api.lookup_types lookup_type ON lookup_type.id = lookup_value.lookup_type_id
  WHERE lookup_value.id = value_id;
$$;

CREATE OR REPLACE FUNCTION private.feature_flag_json(flag_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT jsonb_build_object(
    'id', feature_flag.id,
    'flagKey', feature_flag.flag_key,
    'enabled', feature_flag.enabled,
    'label', feature_flag.label,
    'description', feature_flag.description,
    'category', feature_flag.category,
    'createdAt', feature_flag.created_at,
    'updatedAt', feature_flag.updated_at
  )
  FROM api.feature_flags feature_flag
  WHERE feature_flag.id = flag_id;
$$;

CREATE OR REPLACE FUNCTION api.admin_list_system_settings(
  search text DEFAULT NULL,
  category text DEFAULT NULL,
  active boolean DEFAULT NULL,
  page_number integer DEFAULT 1,
  page_size integer DEFAULT 20
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  category_filter ALIAS FOR $2;
  active_filter ALIAS FOR $3;
  normalized_search text;
  resolved_page integer;
  resolved_page_size integer;
  total_items integer;
  items jsonb;
BEGIN
  normalized_search := lower(btrim(COALESCE(search, '')));
  resolved_page := GREATEST(COALESCE(page_number, 1), 1);
  resolved_page_size := LEAST(GREATEST(COALESCE(page_size, 20), 1), 100);

  WITH filtered AS (
    SELECT setting.id
    FROM api.system_settings setting
    WHERE (category_filter IS NULL OR setting.category = category_filter)
      AND (active_filter IS NULL OR setting.active = active_filter)
      AND (
        normalized_search = ''
        OR lower(setting.setting_key) LIKE '%' || normalized_search || '%'
        OR lower(setting.label) LIKE '%' || normalized_search || '%'
        OR lower(setting.category) LIKE '%' || normalized_search || '%'
      )
  )
  SELECT count(*)::integer INTO total_items FROM filtered;

  WITH filtered AS (
    SELECT setting.id
    FROM api.system_settings setting
    WHERE (category_filter IS NULL OR setting.category = category_filter)
      AND (active_filter IS NULL OR setting.active = active_filter)
      AND (
        normalized_search = ''
        OR lower(setting.setting_key) LIKE '%' || normalized_search || '%'
        OR lower(setting.label) LIKE '%' || normalized_search || '%'
        OR lower(setting.category) LIKE '%' || normalized_search || '%'
      )
    ORDER BY setting.category, setting.setting_key
    LIMIT resolved_page_size
    OFFSET (resolved_page - 1) * resolved_page_size
  )
  SELECT COALESCE(jsonb_agg(private.system_setting_json(filtered.id)), '[]'::jsonb)
  INTO items
  FROM filtered;

  RETURN jsonb_build_object(
    'items', items,
    'page', resolved_page,
    'pageSize', resolved_page_size,
    'totalItems', total_items,
    'totalPages', CEIL(total_items::numeric / resolved_page_size)::integer
  );
END;
$$;

CREATE OR REPLACE FUNCTION api.admin_get_system_setting(setting_key text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  setting_id uuid;
BEGIN
  SELECT setting.id INTO setting_id
  FROM api.system_settings setting
  WHERE setting.setting_key = admin_get_system_setting.setting_key;

  IF setting_id IS NULL THEN
    RAISE EXCEPTION 'Setting not found' USING ERRCODE = 'P0002';
  END IF;

  RETURN private.system_setting_json(setting_id);
END;
$$;

CREATE OR REPLACE FUNCTION api.admin_update_system_setting(setting_key text, setting_value jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  existing_setting api.system_settings%ROWTYPE;
  result jsonb;
BEGIN
  SELECT * INTO existing_setting
  FROM api.system_settings setting
  WHERE setting.setting_key = admin_update_system_setting.setting_key;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Setting not found' USING ERRCODE = 'P0002';
  END IF;

  IF existing_setting.editable = false THEN
    RAISE EXCEPTION 'Setting is not editable' USING ERRCODE = '42501';
  END IF;

  IF NOT private.setting_value_matches_type(setting_value, existing_setting.value_type) THEN
    RAISE EXCEPTION 'Setting value does not match value type' USING ERRCODE = '22023';
  END IF;

  IF NOT private.config_text_is_safe(setting_value::text) THEN
    RAISE EXCEPTION 'Setting value is not allowed' USING ERRCODE = '22023';
  END IF;

  UPDATE api.system_settings setting
  SET setting_value = admin_update_system_setting.setting_value
  WHERE setting.id = existing_setting.id;

  result := private.system_setting_json(existing_setting.id);

  PERFORM private.write_audit_log(
    'system_setting.updated',
    'system_setting',
    'success',
    'System setting updated',
    existing_setting.setting_key,
    jsonb_build_object('settingKey', existing_setting.setting_key, 'oldValue', existing_setting.setting_value, 'newValue', setting_value)
  );

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION api.admin_list_lookup_types(
  search text DEFAULT NULL,
  active boolean DEFAULT NULL,
  page_number integer DEFAULT 1,
  page_size integer DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  active_filter ALIAS FOR $2;
  normalized_search text;
  resolved_page integer;
  resolved_page_size integer;
  total_items integer;
  items jsonb;
BEGIN
  normalized_search := lower(btrim(COALESCE(search, '')));
  resolved_page := GREATEST(COALESCE(page_number, 1), 1);
  resolved_page_size := LEAST(GREATEST(COALESCE(page_size, 50), 1), 100);

  WITH filtered AS (
    SELECT lookup_type.id
    FROM api.lookup_types lookup_type
    WHERE (active_filter IS NULL OR lookup_type.active = active_filter)
      AND (
        normalized_search = ''
        OR lower(lookup_type.code) LIKE '%' || normalized_search || '%'
        OR lower(lookup_type.name) LIKE '%' || normalized_search || '%'
      )
  )
  SELECT count(*)::integer INTO total_items FROM filtered;

  WITH filtered AS (
    SELECT lookup_type.id
    FROM api.lookup_types lookup_type
    WHERE (active_filter IS NULL OR lookup_type.active = active_filter)
      AND (
        normalized_search = ''
        OR lower(lookup_type.code) LIKE '%' || normalized_search || '%'
        OR lower(lookup_type.name) LIKE '%' || normalized_search || '%'
      )
    ORDER BY lookup_type.code
    LIMIT resolved_page_size
    OFFSET (resolved_page - 1) * resolved_page_size
  )
  SELECT COALESCE(jsonb_agg(private.lookup_type_json(filtered.id)), '[]'::jsonb)
  INTO items
  FROM filtered;

  RETURN jsonb_build_object('items', items, 'page', resolved_page, 'pageSize', resolved_page_size, 'totalItems', total_items, 'totalPages', CEIL(total_items::numeric / resolved_page_size)::integer);
END;
$$;

CREATE OR REPLACE FUNCTION api.admin_list_lookup_values(
  lookup_type_code text,
  search text DEFAULT NULL,
  active boolean DEFAULT NULL,
  page_number integer DEFAULT 1,
  page_size integer DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  type_code_input ALIAS FOR $1;
  active_filter ALIAS FOR $3;
  normalized_search text;
  resolved_page integer;
  resolved_page_size integer;
  total_items integer;
  items jsonb;
BEGIN
  normalized_search := lower(btrim(COALESCE(search, '')));
  resolved_page := GREATEST(COALESCE(page_number, 1), 1);
  resolved_page_size := LEAST(GREATEST(COALESCE(page_size, 50), 1), 100);

  WITH filtered AS (
    SELECT lookup_value.id
    FROM api.lookup_values lookup_value
    JOIN api.lookup_types lookup_type ON lookup_type.id = lookup_value.lookup_type_id
    WHERE lookup_type.code = type_code_input
      AND (active_filter IS NULL OR lookup_value.active = active_filter)
      AND (
        normalized_search = ''
        OR lower(lookup_value.code) LIKE '%' || normalized_search || '%'
        OR lower(lookup_value.label) LIKE '%' || normalized_search || '%'
      )
  )
  SELECT count(*)::integer INTO total_items FROM filtered;

  WITH filtered AS (
    SELECT lookup_value.id
    FROM api.lookup_values lookup_value
    JOIN api.lookup_types lookup_type ON lookup_type.id = lookup_value.lookup_type_id
    WHERE lookup_type.code = type_code_input
      AND (active_filter IS NULL OR lookup_value.active = active_filter)
      AND (
        normalized_search = ''
        OR lower(lookup_value.code) LIKE '%' || normalized_search || '%'
        OR lower(lookup_value.label) LIKE '%' || normalized_search || '%'
      )
    ORDER BY lookup_value.sort_order, lookup_value.label
    LIMIT resolved_page_size
    OFFSET (resolved_page - 1) * resolved_page_size
  )
  SELECT COALESCE(jsonb_agg(private.lookup_value_json(filtered.id)), '[]'::jsonb)
  INTO items
  FROM filtered;

  RETURN jsonb_build_object('items', items, 'page', resolved_page, 'pageSize', resolved_page_size, 'totalItems', total_items, 'totalPages', CEIL(total_items::numeric / resolved_page_size)::integer);
END;
$$;

CREATE OR REPLACE FUNCTION private.lookup_type_id_by_code(type_code text)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SET search_path = pg_catalog
AS $$
DECLARE
  result uuid;
BEGIN
  SELECT lookup_type.id INTO result
  FROM api.lookup_types lookup_type
  WHERE lookup_type.code = type_code;

  IF result IS NULL THEN
    RAISE EXCEPTION 'Lookup type not found' USING ERRCODE = 'P0002';
  END IF;

  RETURN result;
END;
$$;

DROP FUNCTION IF EXISTS api.admin_create_lookup_value(text, text, text, text, integer, jsonb, boolean);

CREATE OR REPLACE FUNCTION api.admin_create_lookup_value(
  lookup_type_code text,
  lookup_code text,
  lookup_label text,
  lookup_description text DEFAULT NULL,
  lookup_sort_order integer DEFAULT 0,
  lookup_metadata jsonb DEFAULT '{}'::jsonb,
  lookup_active boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  type_id uuid;
  created_id uuid;
  result jsonb;
BEGIN
  IF NOT private.config_text_is_safe(lookup_code) THEN
    RAISE EXCEPTION 'Lookup code is not allowed' USING ERRCODE = '22023';
  END IF;

  IF NOT private.config_metadata_is_safe(lookup_metadata) THEN
    RAISE EXCEPTION 'Lookup metadata is not allowed' USING ERRCODE = '22023';
  END IF;

  type_id := private.lookup_type_id_by_code(lookup_type_code);

  INSERT INTO api.lookup_values (lookup_type_id, code, label, description, sort_order, metadata, system, active)
  VALUES (type_id, lower(btrim(lookup_code)), btrim(lookup_label), lookup_description, COALESCE(lookup_sort_order, 0), COALESCE(lookup_metadata, '{}'::jsonb), false, COALESCE(lookup_active, true))
  RETURNING id INTO created_id;

  result := private.lookup_value_json(created_id);

  PERFORM private.write_audit_log('lookup_value.created', 'lookup_value', 'success', 'Lookup value created', created_id::text, jsonb_build_object('lookupTypeCode', lookup_type_code, 'code', lookup_code));

  RETURN result;
END;
$$;

DROP FUNCTION IF EXISTS api.admin_update_lookup_value(uuid, text, text, text, integer, jsonb, boolean);

CREATE OR REPLACE FUNCTION api.admin_update_lookup_value(
  value_id uuid,
  lookup_code text,
  lookup_label text,
  lookup_description text DEFAULT NULL,
  lookup_sort_order integer DEFAULT 0,
  lookup_metadata jsonb DEFAULT '{}'::jsonb,
  lookup_active boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT private.config_text_is_safe(lookup_code) THEN
    RAISE EXCEPTION 'Lookup code is not allowed' USING ERRCODE = '22023';
  END IF;

  IF NOT private.config_metadata_is_safe(lookup_metadata) THEN
    RAISE EXCEPTION 'Lookup metadata is not allowed' USING ERRCODE = '22023';
  END IF;

  UPDATE api.lookup_values lookup_value
  SET
    code = lower(btrim(lookup_code)),
    label = btrim(lookup_label),
    description = admin_update_lookup_value.lookup_description,
    sort_order = COALESCE(admin_update_lookup_value.lookup_sort_order, 0),
    metadata = COALESCE(admin_update_lookup_value.lookup_metadata, '{}'::jsonb),
    active = COALESCE(admin_update_lookup_value.lookup_active, lookup_value.active)
  WHERE lookup_value.id = value_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lookup value not found' USING ERRCODE = 'P0002';
  END IF;

  result := private.lookup_value_json(value_id);

  PERFORM private.write_audit_log('lookup_value.updated', 'lookup_value', 'success', 'Lookup value updated', value_id::text, jsonb_build_object('code', lookup_code, 'active', lookup_active));

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION api.admin_set_lookup_value_active(value_id uuid, active boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  result jsonb;
BEGIN
  UPDATE api.lookup_values lookup_value
  SET active = COALESCE(admin_set_lookup_value_active.active, lookup_value.active)
  WHERE lookup_value.id = value_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lookup value not found' USING ERRCODE = 'P0002';
  END IF;

  result := private.lookup_value_json(value_id);

  PERFORM private.write_audit_log(
    CASE WHEN active THEN 'lookup_value.activated' ELSE 'lookup_value.deactivated' END,
    'lookup_value',
    'success',
    CASE WHEN active THEN 'Lookup value activated' ELSE 'Lookup value deactivated' END,
    value_id::text,
    jsonb_build_object('active', active)
  );

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION api.admin_list_feature_flags(
  search text DEFAULT NULL,
  category text DEFAULT NULL,
  enabled boolean DEFAULT NULL,
  page_number integer DEFAULT 1,
  page_size integer DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  category_filter ALIAS FOR $2;
  enabled_filter ALIAS FOR $3;
  normalized_search text;
  resolved_page integer;
  resolved_page_size integer;
  total_items integer;
  items jsonb;
BEGIN
  normalized_search := lower(btrim(COALESCE(search, '')));
  resolved_page := GREATEST(COALESCE(page_number, 1), 1);
  resolved_page_size := LEAST(GREATEST(COALESCE(page_size, 50), 1), 100);

  WITH filtered AS (
    SELECT feature_flag.id
    FROM api.feature_flags feature_flag
    WHERE (category_filter IS NULL OR feature_flag.category = category_filter)
      AND (enabled_filter IS NULL OR feature_flag.enabled = enabled_filter)
      AND (
        normalized_search = ''
        OR lower(feature_flag.flag_key) LIKE '%' || normalized_search || '%'
        OR lower(feature_flag.label) LIKE '%' || normalized_search || '%'
        OR lower(feature_flag.category) LIKE '%' || normalized_search || '%'
      )
  )
  SELECT count(*)::integer INTO total_items FROM filtered;

  WITH filtered AS (
    SELECT feature_flag.id
    FROM api.feature_flags feature_flag
    WHERE (category_filter IS NULL OR feature_flag.category = category_filter)
      AND (enabled_filter IS NULL OR feature_flag.enabled = enabled_filter)
      AND (
        normalized_search = ''
        OR lower(feature_flag.flag_key) LIKE '%' || normalized_search || '%'
        OR lower(feature_flag.label) LIKE '%' || normalized_search || '%'
        OR lower(feature_flag.category) LIKE '%' || normalized_search || '%'
      )
    ORDER BY feature_flag.category, feature_flag.flag_key
    LIMIT resolved_page_size
    OFFSET (resolved_page - 1) * resolved_page_size
  )
  SELECT COALESCE(jsonb_agg(private.feature_flag_json(filtered.id)), '[]'::jsonb)
  INTO items
  FROM filtered;

  RETURN jsonb_build_object('items', items, 'page', resolved_page, 'pageSize', resolved_page_size, 'totalItems', total_items, 'totalPages', CEIL(total_items::numeric / resolved_page_size)::integer);
END;
$$;

CREATE OR REPLACE FUNCTION api.admin_update_feature_flag(flag_key text, enabled boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  flag_id uuid;
  old_enabled boolean;
  result jsonb;
BEGIN
  SELECT feature_flag.id, feature_flag.enabled
  INTO flag_id, old_enabled
  FROM api.feature_flags feature_flag
  WHERE feature_flag.flag_key = admin_update_feature_flag.flag_key;

  IF flag_id IS NULL THEN
    RAISE EXCEPTION 'Feature flag not found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE api.feature_flags feature_flag
  SET enabled = COALESCE(admin_update_feature_flag.enabled, feature_flag.enabled)
  WHERE feature_flag.id = flag_id;

  result := private.feature_flag_json(flag_id);

  PERFORM private.write_audit_log('feature_flag.updated', 'feature_flag', 'success', 'Feature flag updated', flag_key, jsonb_build_object('flagKey', flag_key, 'oldEnabled', old_enabled, 'newEnabled', enabled));

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION private.config_text_is_safe(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.config_metadata_is_safe(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.setting_value_matches_type(jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.system_setting_json(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.lookup_type_json(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.lookup_value_json(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.lookup_type_id_by_code(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.feature_flag_json(uuid) FROM PUBLIC;

REVOKE ALL ON FUNCTION api.admin_list_system_settings(text, text, boolean, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.admin_get_system_setting(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.admin_update_system_setting(text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.admin_list_lookup_types(text, boolean, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.admin_list_lookup_values(text, text, boolean, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.admin_create_lookup_value(text, text, text, text, integer, jsonb, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.admin_update_lookup_value(uuid, text, text, text, integer, jsonb, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.admin_set_lookup_value_active(uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.admin_list_feature_flags(text, text, boolean, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.admin_update_feature_flag(text, boolean) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION api.admin_list_system_settings(text, text, boolean, integer, integer) TO erp_admin, erp_manager;
GRANT EXECUTE ON FUNCTION api.admin_get_system_setting(text) TO erp_admin, erp_manager;
GRANT EXECUTE ON FUNCTION api.admin_list_lookup_types(text, boolean, integer, integer) TO erp_admin, erp_manager;
GRANT EXECUTE ON FUNCTION api.admin_list_lookup_values(text, text, boolean, integer, integer) TO erp_admin, erp_manager;
GRANT EXECUTE ON FUNCTION api.admin_list_feature_flags(text, text, boolean, integer, integer) TO erp_admin, erp_manager;

GRANT EXECUTE ON FUNCTION api.admin_update_system_setting(text, jsonb) TO erp_admin;
GRANT EXECUTE ON FUNCTION api.admin_create_lookup_value(text, text, text, text, integer, jsonb, boolean) TO erp_admin;
GRANT EXECUTE ON FUNCTION api.admin_update_lookup_value(uuid, text, text, text, integer, jsonb, boolean) TO erp_admin;
GRANT EXECUTE ON FUNCTION api.admin_set_lookup_value_active(uuid, boolean) TO erp_admin;
GRANT EXECUTE ON FUNCTION api.admin_update_feature_flag(text, boolean) TO erp_admin;

COMMIT;
