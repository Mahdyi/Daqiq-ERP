BEGIN;

WITH upserted_types AS (
  INSERT INTO api.lookup_types (code, name, description, system, active)
  VALUES
    ('warehouse_type', 'نوع انبار', NULL, true, true),
    ('storage_location_type', 'نوع موقعیت انبار', NULL, true, true)
  ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name,
      active = true
  RETURNING id, code
),
all_types AS (
  SELECT id, code FROM upserted_types
  UNION
  SELECT id, code FROM api.lookup_types
  WHERE code IN ('warehouse_type', 'storage_location_type')
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
SELECT type.id, value.code, value.label, value.sort_order, '{}'::jsonb, true, true
FROM all_types type
JOIN (
  VALUES
    ('warehouse_type', 'main', 'انبار اصلی', 10),
    ('warehouse_type', 'raw_material', 'انبار مواد اولیه', 20),
    ('warehouse_type', 'finished_goods', 'انبار محصول نهایی', 30),
    ('warehouse_type', 'packaging', 'انبار بسته‌بندی', 40),
    ('warehouse_type', 'cold_storage', 'سردخانه', 50),
    ('warehouse_type', 'quality_hold', 'قرنطینه کنترل کیفیت', 60),
    ('warehouse_type', 'production', 'انبار خط تولید', 70),
    ('storage_location_type', 'receiving', 'دریافت', 10),
    ('storage_location_type', 'storage', 'نگهداری', 20),
    ('storage_location_type', 'picking', 'برداشت', 30),
    ('storage_location_type', 'shipping', 'ارسال', 40),
    ('storage_location_type', 'quality_hold', 'قرنطینه کنترل کیفیت', 50),
    ('storage_location_type', 'scrap', 'ضایعات', 60),
    ('storage_location_type', 'production', 'تولید', 70)
) AS value(type_code, code, label, sort_order) ON value.type_code = type.code
ON CONFLICT (lookup_type_id, code) DO UPDATE
SET label = EXCLUDED.label,
    sort_order = EXCLUDED.sort_order,
    active = true;

INSERT INTO api.feature_flags (flag_key, enabled, label, description, category)
VALUES ('warehouses.enabled', true, 'انبارها', 'فعال بودن مدیریت انبارها و موقعیت‌های انبار', 'master-data')
ON CONFLICT (flag_key) DO UPDATE
SET enabled = true,
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    category = EXCLUDED.category;

CREATE TABLE IF NOT EXISTS api.warehouses (
  id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  description text NULL,
  warehouse_type_lookup_value_id uuid NULL REFERENCES api.lookup_values(id),
  address text NULL,
  responsible_person text NULL,
  phone text NULL,
  email text NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT warehouses_code_not_blank CHECK (length(btrim(code)) > 0),
  CONSTRAINT warehouses_name_not_blank CHECK (length(btrim(name)) > 0),
  CONSTRAINT warehouses_email_format CHECK (
    email IS NULL OR email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS warehouses_code_ci_uq ON api.warehouses (lower(code));
CREATE INDEX IF NOT EXISTS warehouses_name_ci_idx ON api.warehouses (lower(name));
CREATE INDEX IF NOT EXISTS warehouses_active_idx ON api.warehouses (active);
CREATE INDEX IF NOT EXISTS warehouses_type_idx ON api.warehouses (warehouse_type_lookup_value_id);
CREATE INDEX IF NOT EXISTS warehouses_list_order_idx ON api.warehouses (created_at DESC, id ASC);

CREATE TABLE IF NOT EXISTS api.storage_locations (
  id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
  warehouse_id uuid NOT NULL REFERENCES api.warehouses(id) ON DELETE RESTRICT,
  code text NOT NULL,
  name text NOT NULL,
  description text NULL,
  location_type_lookup_value_id uuid NULL REFERENCES api.lookup_values(id),
  parent_location_id uuid NULL REFERENCES api.storage_locations(id) ON DELETE RESTRICT,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT storage_locations_code_not_blank CHECK (length(btrim(code)) > 0),
  CONSTRAINT storage_locations_name_not_blank CHECK (length(btrim(name)) > 0),
  CONSTRAINT storage_locations_parent_not_self CHECK (parent_location_id IS NULL OR parent_location_id <> id)
);

CREATE UNIQUE INDEX IF NOT EXISTS storage_locations_warehouse_code_ci_uq
ON api.storage_locations (warehouse_id, lower(code));
CREATE INDEX IF NOT EXISTS storage_locations_warehouse_idx ON api.storage_locations (warehouse_id);
CREATE INDEX IF NOT EXISTS storage_locations_code_ci_idx ON api.storage_locations (lower(code));
CREATE INDEX IF NOT EXISTS storage_locations_active_idx ON api.storage_locations (active);
CREATE INDEX IF NOT EXISTS storage_locations_type_idx ON api.storage_locations (location_type_lookup_value_id);
CREATE INDEX IF NOT EXISTS storage_locations_parent_idx ON api.storage_locations (parent_location_id);
CREATE INDEX IF NOT EXISTS storage_locations_list_order_idx ON api.storage_locations (created_at DESC, id ASC);

DROP TRIGGER IF EXISTS warehouses_set_updated_at ON api.warehouses;
CREATE TRIGGER warehouses_set_updated_at
BEFORE UPDATE ON api.warehouses
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

DROP TRIGGER IF EXISTS storage_locations_set_updated_at ON api.storage_locations;
CREATE TRIGGER storage_locations_set_updated_at
BEFORE UPDATE ON api.storage_locations
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

CREATE OR REPLACE FUNCTION private.validate_warehouse_lookup_references()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  IF NEW.warehouse_type_lookup_value_id IS NOT NULL
    AND (
      TG_OP = 'INSERT'
      OR OLD.warehouse_type_lookup_value_id IS DISTINCT FROM NEW.warehouse_type_lookup_value_id
    )
    AND NOT private.lookup_value_has_type(NEW.warehouse_type_lookup_value_id, 'warehouse_type', true) THEN
    RAISE EXCEPTION 'Warehouse type lookup value is invalid' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.validate_storage_location_references()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  parent_warehouse_id uuid;
BEGIN
  IF NEW.location_type_lookup_value_id IS NOT NULL
    AND (
      TG_OP = 'INSERT'
      OR OLD.location_type_lookup_value_id IS DISTINCT FROM NEW.location_type_lookup_value_id
    )
    AND NOT private.lookup_value_has_type(NEW.location_type_lookup_value_id, 'storage_location_type', true) THEN
    RAISE EXCEPTION 'Storage location type lookup value is invalid' USING ERRCODE = '23514';
  END IF;

  IF NEW.parent_location_id IS NOT NULL THEN
    SELECT parent.warehouse_id
    INTO parent_warehouse_id
    FROM api.storage_locations parent
    WHERE parent.id = NEW.parent_location_id;

    IF parent_warehouse_id IS NULL OR parent_warehouse_id <> NEW.warehouse_id THEN
      RAISE EXCEPTION 'Parent storage location must belong to the same warehouse' USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS warehouses_validate_lookup_references ON api.warehouses;
CREATE TRIGGER warehouses_validate_lookup_references
BEFORE INSERT OR UPDATE ON api.warehouses
FOR EACH ROW
EXECUTE FUNCTION private.validate_warehouse_lookup_references();

DROP TRIGGER IF EXISTS storage_locations_validate_references ON api.storage_locations;
CREATE TRIGGER storage_locations_validate_references
BEFORE INSERT OR UPDATE ON api.storage_locations
FOR EACH ROW
EXECUTE FUNCTION private.validate_storage_location_references();

CREATE OR REPLACE FUNCTION private.audit_warehouse_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  action_name text;
  entity_id text;
  metadata jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_name := 'warehouse.created';
    entity_id := NEW.id::text;
    metadata := jsonb_build_object(
      'code', NEW.code,
      'name', NEW.name,
      'active', NEW.active,
      'warehouseTypeLookupValueId', NEW.warehouse_type_lookup_value_id
    );
  ELSIF TG_OP = 'UPDATE' THEN
    action_name := CASE
      WHEN OLD.active = true AND NEW.active = false THEN 'warehouse.deactivated'
      WHEN OLD.active = false AND NEW.active = true THEN 'warehouse.activated'
      ELSE 'warehouse.updated'
    END;
    entity_id := NEW.id::text;
    metadata := jsonb_build_object(
      'code', NEW.code,
      'name', NEW.name,
      'active', NEW.active,
      'warehouseTypeLookupValueId', NEW.warehouse_type_lookup_value_id
    );
  ELSE
    action_name := 'warehouse.deleted';
    entity_id := OLD.id::text;
    metadata := jsonb_build_object(
      'code', OLD.code,
      'name', OLD.name,
      'active', OLD.active,
      'warehouseTypeLookupValueId', OLD.warehouse_type_lookup_value_id
    );
  END IF;

  PERFORM private.write_audit_log(
    action_name,
    'warehouse',
    'success',
    replace(initcap(replace(action_name, '.', ' ')), ' ', ' '),
    entity_id,
    metadata
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION private.audit_storage_location_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  action_name text;
  entity_id text;
  metadata jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_name := 'storageLocation.created';
    entity_id := NEW.id::text;
    metadata := jsonb_build_object(
      'code', NEW.code,
      'name', NEW.name,
      'warehouseId', NEW.warehouse_id,
      'active', NEW.active,
      'locationTypeLookupValueId', NEW.location_type_lookup_value_id
    );
  ELSIF TG_OP = 'UPDATE' THEN
    action_name := CASE
      WHEN OLD.active = true AND NEW.active = false THEN 'storageLocation.deactivated'
      WHEN OLD.active = false AND NEW.active = true THEN 'storageLocation.activated'
      ELSE 'storageLocation.updated'
    END;
    entity_id := NEW.id::text;
    metadata := jsonb_build_object(
      'code', NEW.code,
      'name', NEW.name,
      'warehouseId', NEW.warehouse_id,
      'active', NEW.active,
      'locationTypeLookupValueId', NEW.location_type_lookup_value_id
    );
  ELSE
    action_name := 'storageLocation.deleted';
    entity_id := OLD.id::text;
    metadata := jsonb_build_object(
      'code', OLD.code,
      'name', OLD.name,
      'warehouseId', OLD.warehouse_id,
      'active', OLD.active,
      'locationTypeLookupValueId', OLD.location_type_lookup_value_id
    );
  END IF;

  PERFORM private.write_audit_log(
    action_name,
    'storage_location',
    'success',
    replace(initcap(replace(action_name, '.', ' ')), ' ', ' '),
    entity_id,
    metadata
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS warehouses_audit_insert ON api.warehouses;
DROP TRIGGER IF EXISTS warehouses_audit_update ON api.warehouses;
DROP TRIGGER IF EXISTS warehouses_audit_delete ON api.warehouses;
CREATE TRIGGER warehouses_audit_insert AFTER INSERT ON api.warehouses FOR EACH ROW EXECUTE FUNCTION private.audit_warehouse_change();
CREATE TRIGGER warehouses_audit_update AFTER UPDATE ON api.warehouses FOR EACH ROW WHEN (OLD IS DISTINCT FROM NEW) EXECUTE FUNCTION private.audit_warehouse_change();
CREATE TRIGGER warehouses_audit_delete AFTER DELETE ON api.warehouses FOR EACH ROW EXECUTE FUNCTION private.audit_warehouse_change();

DROP TRIGGER IF EXISTS storage_locations_audit_insert ON api.storage_locations;
DROP TRIGGER IF EXISTS storage_locations_audit_update ON api.storage_locations;
DROP TRIGGER IF EXISTS storage_locations_audit_delete ON api.storage_locations;
CREATE TRIGGER storage_locations_audit_insert AFTER INSERT ON api.storage_locations FOR EACH ROW EXECUTE FUNCTION private.audit_storage_location_change();
CREATE TRIGGER storage_locations_audit_update AFTER UPDATE ON api.storage_locations FOR EACH ROW WHEN (OLD IS DISTINCT FROM NEW) EXECUTE FUNCTION private.audit_storage_location_change();
CREATE TRIGGER storage_locations_audit_delete AFTER DELETE ON api.storage_locations FOR EACH ROW EXECUTE FUNCTION private.audit_storage_location_change();

REVOKE ALL ON api.warehouses FROM PUBLIC;
REVOKE ALL ON api.storage_locations FROM PUBLIC;
REVOKE ALL ON FUNCTION private.validate_warehouse_lookup_references() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.validate_storage_location_references() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.audit_warehouse_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.audit_storage_location_change() FROM PUBLIC;

GRANT USAGE ON SCHEMA api TO erp_admin, erp_manager, erp_accountant, erp_warehouse;
GRANT SELECT ON api.lookup_types, api.lookup_values TO erp_accountant, erp_warehouse;
GRANT EXECUTE ON FUNCTION api.admin_list_lookup_values(text, text, boolean, integer, integer) TO erp_accountant, erp_warehouse;

GRANT SELECT ON api.warehouses, api.storage_locations TO erp_admin, erp_manager, erp_accountant, erp_warehouse;
GRANT INSERT ON api.warehouses, api.storage_locations TO erp_admin, erp_manager, erp_warehouse;
GRANT UPDATE ON api.warehouses, api.storage_locations TO erp_admin, erp_manager, erp_warehouse;
GRANT DELETE ON api.warehouses, api.storage_locations TO erp_admin;

ALTER TABLE api.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.warehouses FORCE ROW LEVEL SECURITY;
ALTER TABLE api.storage_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.storage_locations FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS warehouses_select_policy ON api.warehouses;
DROP POLICY IF EXISTS warehouses_insert_policy ON api.warehouses;
DROP POLICY IF EXISTS warehouses_update_policy ON api.warehouses;
DROP POLICY IF EXISTS warehouses_delete_policy ON api.warehouses;
CREATE POLICY warehouses_select_policy ON api.warehouses FOR SELECT TO erp_admin, erp_manager, erp_accountant, erp_warehouse USING (true);
CREATE POLICY warehouses_insert_policy ON api.warehouses FOR INSERT TO erp_admin, erp_manager, erp_warehouse WITH CHECK (true);
CREATE POLICY warehouses_update_policy ON api.warehouses FOR UPDATE TO erp_admin, erp_manager, erp_warehouse USING (true) WITH CHECK (true);
CREATE POLICY warehouses_delete_policy ON api.warehouses FOR DELETE TO erp_admin USING (true);

DROP POLICY IF EXISTS storage_locations_select_policy ON api.storage_locations;
DROP POLICY IF EXISTS storage_locations_insert_policy ON api.storage_locations;
DROP POLICY IF EXISTS storage_locations_update_policy ON api.storage_locations;
DROP POLICY IF EXISTS storage_locations_delete_policy ON api.storage_locations;
CREATE POLICY storage_locations_select_policy ON api.storage_locations FOR SELECT TO erp_admin, erp_manager, erp_accountant, erp_warehouse USING (true);
CREATE POLICY storage_locations_insert_policy ON api.storage_locations FOR INSERT TO erp_admin, erp_manager, erp_warehouse WITH CHECK (true);
CREATE POLICY storage_locations_update_policy ON api.storage_locations FOR UPDATE TO erp_admin, erp_manager, erp_warehouse USING (true) WITH CHECK (true);
CREATE POLICY storage_locations_delete_policy ON api.storage_locations FOR DELETE TO erp_admin USING (true);

COMMIT;
