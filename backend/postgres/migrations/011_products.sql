BEGIN;

CREATE TABLE IF NOT EXISTS api.products (
  id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
  sku text NOT NULL,
  name text NOT NULL,
  description text NULL,
  barcode text NULL,
  product_type text NOT NULL,
  category_lookup_value_id uuid NULL REFERENCES api.lookup_values(id),
  base_unit_lookup_value_id uuid NOT NULL REFERENCES api.lookup_values(id),
  tax_rate_lookup_value_id uuid NULL REFERENCES api.lookup_values(id),
  track_inventory boolean NOT NULL DEFAULT true,
  purchasable boolean NOT NULL DEFAULT true,
  sellable boolean NOT NULL DEFAULT true,
  standard_cost numeric(14,2) NULL,
  sales_price numeric(14,2) NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT products_sku_not_blank CHECK (length(btrim(sku)) > 0),
  CONSTRAINT products_name_not_blank CHECK (length(btrim(name)) > 0),
  CONSTRAINT products_type_check CHECK (
    product_type IN ('raw_material', 'finished_good', 'packaging', 'service', 'spare_part')
  ),
  CONSTRAINT products_standard_cost_nonnegative CHECK (standard_cost IS NULL OR standard_cost >= 0),
  CONSTRAINT products_sales_price_nonnegative CHECK (sales_price IS NULL OR sales_price >= 0),
  CONSTRAINT products_service_no_inventory CHECK (product_type <> 'service' OR track_inventory = false)
);

CREATE UNIQUE INDEX IF NOT EXISTS products_sku_ci_uq ON api.products (lower(sku));
CREATE INDEX IF NOT EXISTS products_name_ci_idx ON api.products (lower(name));
CREATE INDEX IF NOT EXISTS products_barcode_idx ON api.products (barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS products_type_idx ON api.products (product_type);
CREATE INDEX IF NOT EXISTS products_active_idx ON api.products (active);
CREATE INDEX IF NOT EXISTS products_category_idx ON api.products (category_lookup_value_id);
CREATE INDEX IF NOT EXISTS products_base_unit_idx ON api.products (base_unit_lookup_value_id);
CREATE INDEX IF NOT EXISTS products_list_order_idx ON api.products (created_at DESC, id ASC);

DROP TRIGGER IF EXISTS products_set_updated_at ON api.products;
CREATE TRIGGER products_set_updated_at
BEFORE UPDATE ON api.products
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

CREATE OR REPLACE FUNCTION private.lookup_value_has_type(
  lookup_value_id uuid,
  lookup_type_code text,
  require_active boolean DEFAULT true
)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM api.lookup_values value
    JOIN api.lookup_types type ON type.id = value.lookup_type_id
    WHERE value.id = lookup_value_id
      AND type.code = lookup_type_code
      AND (require_active = false OR value.active = true)
      AND type.active = true
  );
$$;

CREATE OR REPLACE FUNCTION private.validate_product_lookup_references()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  IF NEW.category_lookup_value_id IS NOT NULL
    AND NOT private.lookup_value_has_type(NEW.category_lookup_value_id, 'product_category', true) THEN
    RAISE EXCEPTION 'Product category lookup value is invalid' USING ERRCODE = '23514';
  END IF;

  IF NOT private.lookup_value_has_type(NEW.base_unit_lookup_value_id, 'unit', true) THEN
    RAISE EXCEPTION 'Base unit lookup value is invalid' USING ERRCODE = '23514';
  END IF;

  IF NEW.tax_rate_lookup_value_id IS NOT NULL
    AND NOT private.lookup_value_has_type(NEW.tax_rate_lookup_value_id, 'tax_rate', true) THEN
    RAISE EXCEPTION 'Tax rate lookup value is invalid' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_validate_lookup_references ON api.products;
CREATE TRIGGER products_validate_lookup_references
BEFORE INSERT OR UPDATE ON api.products
FOR EACH ROW
EXECUTE FUNCTION private.validate_product_lookup_references();

CREATE OR REPLACE FUNCTION private.audit_product_change()
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
    action_name := 'product.created';
    entity_id := NEW.id::text;
    metadata := jsonb_build_object(
      'sku', NEW.sku,
      'name', NEW.name,
      'productType', NEW.product_type,
      'active', NEW.active
    );
  ELSIF TG_OP = 'UPDATE' THEN
    action_name := CASE
      WHEN OLD.active = true AND NEW.active = false THEN 'product.deactivated'
      WHEN OLD.active = false AND NEW.active = true THEN 'product.activated'
      ELSE 'product.updated'
    END;
    entity_id := NEW.id::text;
    metadata := jsonb_build_object(
      'sku', NEW.sku,
      'name', NEW.name,
      'productType', NEW.product_type,
      'active', NEW.active
    );
  ELSE
    action_name := 'product.deleted';
    entity_id := OLD.id::text;
    metadata := jsonb_build_object(
      'sku', OLD.sku,
      'name', OLD.name,
      'productType', OLD.product_type,
      'active', OLD.active
    );
  END IF;

  PERFORM private.write_audit_log(
    action_name,
    'product',
    'success',
    CASE action_name
      WHEN 'product.created' THEN 'Product created'
      WHEN 'product.updated' THEN 'Product updated'
      WHEN 'product.deactivated' THEN 'Product deactivated'
      WHEN 'product.activated' THEN 'Product activated'
      ELSE 'Product deleted'
    END,
    entity_id,
    metadata
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS products_audit_insert ON api.products;
DROP TRIGGER IF EXISTS products_audit_update ON api.products;
DROP TRIGGER IF EXISTS products_audit_delete ON api.products;

CREATE TRIGGER products_audit_insert
AFTER INSERT ON api.products
FOR EACH ROW
EXECUTE FUNCTION private.audit_product_change();

CREATE TRIGGER products_audit_update
AFTER UPDATE ON api.products
FOR EACH ROW
WHEN (OLD IS DISTINCT FROM NEW)
EXECUTE FUNCTION private.audit_product_change();

CREATE TRIGGER products_audit_delete
AFTER DELETE ON api.products
FOR EACH ROW
EXECUTE FUNCTION private.audit_product_change();

REVOKE ALL ON api.products FROM PUBLIC;
REVOKE ALL ON FUNCTION private.lookup_value_has_type(uuid, text, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.validate_product_lookup_references() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.audit_product_change() FROM PUBLIC;

GRANT USAGE ON SCHEMA api TO erp_admin, erp_manager, erp_accountant, erp_sales, erp_warehouse;
GRANT SELECT ON api.lookup_types, api.lookup_values TO erp_accountant, erp_sales, erp_warehouse;
GRANT SELECT ON api.products TO erp_admin, erp_manager, erp_accountant, erp_sales, erp_warehouse;
GRANT INSERT ON api.products TO erp_admin, erp_manager;
GRANT UPDATE ON api.products TO erp_admin, erp_manager, erp_warehouse;
GRANT DELETE ON api.products TO erp_admin;

DROP POLICY IF EXISTS lookup_types_product_read_policy ON api.lookup_types;
DROP POLICY IF EXISTS lookup_values_product_read_policy ON api.lookup_values;

CREATE POLICY lookup_types_product_read_policy
ON api.lookup_types
FOR SELECT
TO erp_accountant, erp_sales, erp_warehouse
USING (active = true);

CREATE POLICY lookup_values_product_read_policy
ON api.lookup_values
FOR SELECT
TO erp_accountant, erp_sales, erp_warehouse
USING (active = true);

GRANT EXECUTE ON FUNCTION api.admin_list_lookup_values(text, text, boolean, integer, integer)
TO erp_accountant, erp_sales, erp_warehouse;

ALTER TABLE api.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.products FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS products_select_policy ON api.products;
DROP POLICY IF EXISTS products_insert_policy ON api.products;
DROP POLICY IF EXISTS products_update_policy ON api.products;
DROP POLICY IF EXISTS products_delete_policy ON api.products;

CREATE POLICY products_select_policy
ON api.products
FOR SELECT
TO erp_admin, erp_manager, erp_accountant, erp_sales, erp_warehouse
USING (true);

CREATE POLICY products_insert_policy
ON api.products
FOR INSERT
TO erp_admin, erp_manager
WITH CHECK (true);

CREATE POLICY products_update_policy
ON api.products
FOR UPDATE
TO erp_admin, erp_manager, erp_warehouse
USING (true)
WITH CHECK (true);

CREATE POLICY products_delete_policy
ON api.products
FOR DELETE
TO erp_admin
USING (true);

UPDATE api.feature_flags
SET enabled = true
WHERE flag_key = 'products.enabled';

COMMIT;
