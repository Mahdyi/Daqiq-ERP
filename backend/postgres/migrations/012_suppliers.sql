BEGIN;

CREATE TABLE IF NOT EXISTS api.suppliers (
  id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  email text NULL,
  phone text NULL,
  tax_number text NULL,
  contact_person text NULL,
  website text NULL,
  address text NULL,
  supplier_group_lookup_value_id uuid NULL REFERENCES api.lookup_values(id),
  currency_lookup_value_id uuid NULL REFERENCES api.lookup_values(id),
  payment_terms_days integer NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT suppliers_code_not_blank CHECK (length(btrim(code)) > 0),
  CONSTRAINT suppliers_name_not_blank CHECK (length(btrim(name)) > 0),
  CONSTRAINT suppliers_payment_terms_nonnegative CHECK (
    payment_terms_days IS NULL OR payment_terms_days >= 0
  ),
  CONSTRAINT suppliers_email_format CHECK (
    email IS NULL OR email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS suppliers_code_ci_uq ON api.suppliers (lower(code));
CREATE INDEX IF NOT EXISTS suppliers_name_ci_idx ON api.suppliers (lower(name));
CREATE INDEX IF NOT EXISTS suppliers_email_ci_idx ON api.suppliers (lower(email)) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS suppliers_phone_idx ON api.suppliers (phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS suppliers_active_idx ON api.suppliers (active);
CREATE INDEX IF NOT EXISTS suppliers_group_idx ON api.suppliers (supplier_group_lookup_value_id);
CREATE INDEX IF NOT EXISTS suppliers_currency_idx ON api.suppliers (currency_lookup_value_id);
CREATE INDEX IF NOT EXISTS suppliers_list_order_idx ON api.suppliers (created_at DESC, id ASC);

DROP TRIGGER IF EXISTS suppliers_set_updated_at ON api.suppliers;
CREATE TRIGGER suppliers_set_updated_at
BEFORE UPDATE ON api.suppliers
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

CREATE OR REPLACE FUNCTION private.validate_supplier_lookup_references()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  IF NEW.supplier_group_lookup_value_id IS NOT NULL
    AND (
      TG_OP = 'INSERT'
      OR OLD.supplier_group_lookup_value_id IS DISTINCT FROM NEW.supplier_group_lookup_value_id
    )
    AND NOT private.lookup_value_has_type(NEW.supplier_group_lookup_value_id, 'supplier_group', true) THEN
    RAISE EXCEPTION 'Supplier group lookup value is invalid' USING ERRCODE = '23514';
  END IF;

  IF NEW.currency_lookup_value_id IS NOT NULL
    AND (
      TG_OP = 'INSERT'
      OR OLD.currency_lookup_value_id IS DISTINCT FROM NEW.currency_lookup_value_id
    )
    AND NOT private.lookup_value_has_type(NEW.currency_lookup_value_id, 'currency', true) THEN
    RAISE EXCEPTION 'Currency lookup value is invalid' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS suppliers_validate_lookup_references ON api.suppliers;
CREATE TRIGGER suppliers_validate_lookup_references
BEFORE INSERT OR UPDATE ON api.suppliers
FOR EACH ROW
EXECUTE FUNCTION private.validate_supplier_lookup_references();

CREATE OR REPLACE FUNCTION private.audit_supplier_change()
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
    action_name := 'supplier.created';
    entity_id := NEW.id::text;
    metadata := jsonb_build_object(
      'code', NEW.code,
      'name', NEW.name,
      'active', NEW.active,
      'supplierGroupLookupValueId', NEW.supplier_group_lookup_value_id,
      'currencyLookupValueId', NEW.currency_lookup_value_id
    );
  ELSIF TG_OP = 'UPDATE' THEN
    action_name := CASE
      WHEN OLD.active = true AND NEW.active = false THEN 'supplier.deactivated'
      WHEN OLD.active = false AND NEW.active = true THEN 'supplier.activated'
      ELSE 'supplier.updated'
    END;
    entity_id := NEW.id::text;
    metadata := jsonb_build_object(
      'code', NEW.code,
      'name', NEW.name,
      'active', NEW.active,
      'supplierGroupLookupValueId', NEW.supplier_group_lookup_value_id,
      'currencyLookupValueId', NEW.currency_lookup_value_id
    );
  ELSE
    action_name := 'supplier.deleted';
    entity_id := OLD.id::text;
    metadata := jsonb_build_object(
      'code', OLD.code,
      'name', OLD.name,
      'active', OLD.active,
      'supplierGroupLookupValueId', OLD.supplier_group_lookup_value_id,
      'currencyLookupValueId', OLD.currency_lookup_value_id
    );
  END IF;

  PERFORM private.write_audit_log(
    action_name,
    'supplier',
    'success',
    CASE action_name
      WHEN 'supplier.created' THEN 'Supplier created'
      WHEN 'supplier.updated' THEN 'Supplier updated'
      WHEN 'supplier.deactivated' THEN 'Supplier deactivated'
      WHEN 'supplier.activated' THEN 'Supplier activated'
      ELSE 'Supplier deleted'
    END,
    entity_id,
    metadata
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS suppliers_audit_insert ON api.suppliers;
DROP TRIGGER IF EXISTS suppliers_audit_update ON api.suppliers;
DROP TRIGGER IF EXISTS suppliers_audit_delete ON api.suppliers;

CREATE TRIGGER suppliers_audit_insert
AFTER INSERT ON api.suppliers
FOR EACH ROW
EXECUTE FUNCTION private.audit_supplier_change();

CREATE TRIGGER suppliers_audit_update
AFTER UPDATE ON api.suppliers
FOR EACH ROW
WHEN (OLD IS DISTINCT FROM NEW)
EXECUTE FUNCTION private.audit_supplier_change();

CREATE TRIGGER suppliers_audit_delete
AFTER DELETE ON api.suppliers
FOR EACH ROW
EXECUTE FUNCTION private.audit_supplier_change();

REVOKE ALL ON api.suppliers FROM PUBLIC;
REVOKE ALL ON FUNCTION private.validate_supplier_lookup_references() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.audit_supplier_change() FROM PUBLIC;

GRANT USAGE ON SCHEMA api TO erp_admin, erp_manager, erp_accountant, erp_warehouse;
GRANT SELECT ON api.lookup_types, api.lookup_values TO erp_accountant, erp_warehouse;
GRANT EXECUTE ON FUNCTION api.admin_list_lookup_values(text, text, boolean, integer, integer)
TO erp_accountant, erp_warehouse;

GRANT SELECT ON api.suppliers TO erp_admin, erp_manager, erp_accountant, erp_warehouse;
GRANT INSERT ON api.suppliers TO erp_admin, erp_manager;
GRANT UPDATE ON api.suppliers TO erp_admin, erp_manager, erp_accountant;
GRANT DELETE ON api.suppliers TO erp_admin;

ALTER TABLE api.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.suppliers FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS suppliers_select_policy ON api.suppliers;
DROP POLICY IF EXISTS suppliers_insert_policy ON api.suppliers;
DROP POLICY IF EXISTS suppliers_update_policy ON api.suppliers;
DROP POLICY IF EXISTS suppliers_delete_policy ON api.suppliers;

CREATE POLICY suppliers_select_policy
ON api.suppliers
FOR SELECT
TO erp_admin, erp_manager, erp_accountant, erp_warehouse
USING (true);

CREATE POLICY suppliers_insert_policy
ON api.suppliers
FOR INSERT
TO erp_admin, erp_manager
WITH CHECK (true);

CREATE POLICY suppliers_update_policy
ON api.suppliers
FOR UPDATE
TO erp_admin, erp_manager, erp_accountant
USING (true)
WITH CHECK (true);

CREATE POLICY suppliers_delete_policy
ON api.suppliers
FOR DELETE
TO erp_admin
USING (true);

UPDATE api.feature_flags
SET enabled = true
WHERE flag_key = 'suppliers.enabled';

COMMIT;
