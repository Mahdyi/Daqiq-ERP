BEGIN;

CREATE SEQUENCE IF NOT EXISTS private.inventory_movement_number_seq;

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
VALUES (
  'documents.inventoryMovementPrefix',
  '"INV"',
  'string',
  'documents',
  'پیشوند سند انبار',
  'پیشوند شماره سند گردش موجودی',
  true,
  true
)
ON CONFLICT (setting_key) DO NOTHING;

WITH upserted_type AS (
  INSERT INTO api.lookup_types (code, name, description, system, active)
  VALUES ('inventory_movement_type', 'نوع گردش موجودی', NULL, true, true)
  ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name,
      active = true
  RETURNING id
),
movement_type AS (
  SELECT id FROM upserted_type
  UNION
  SELECT id FROM api.lookup_types WHERE code = 'inventory_movement_type'
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
SELECT movement_type.id, value.code, value.label, value.sort_order, '{}'::jsonb, true, true
FROM movement_type
CROSS JOIN (
  VALUES
    ('adjustment_in', 'افزایش اصلاحی', 10),
    ('adjustment_out', 'کاهش اصلاحی', 20),
    ('transfer_out', 'خروج انتقالی', 30),
    ('transfer_in', 'ورود انتقالی', 40),
    ('opening_balance', 'موجودی اول دوره', 50)
) AS value(code, label, sort_order)
ON CONFLICT (lookup_type_id, code) DO UPDATE
SET label = EXCLUDED.label,
    sort_order = EXCLUDED.sort_order,
    active = true;

UPDATE api.feature_flags
SET enabled = true,
    category = 'inventory'
WHERE flag_key = 'inventory.enabled';

CREATE TABLE IF NOT EXISTS api.inventory_balances (
  id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES api.products(id) ON DELETE RESTRICT,
  warehouse_id uuid NOT NULL REFERENCES api.warehouses(id) ON DELETE RESTRICT,
  storage_location_id uuid NULL REFERENCES api.storage_locations(id) ON DELETE RESTRICT,
  quantity_on_hand numeric(18,4) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS inventory_balances_product_warehouse_location_uq
ON api.inventory_balances (product_id, warehouse_id, storage_location_id) NULLS NOT DISTINCT;

CREATE INDEX IF NOT EXISTS inventory_balances_product_idx ON api.inventory_balances (product_id);
CREATE INDEX IF NOT EXISTS inventory_balances_warehouse_idx ON api.inventory_balances (warehouse_id);
CREATE INDEX IF NOT EXISTS inventory_balances_storage_location_idx ON api.inventory_balances (storage_location_id);
CREATE INDEX IF NOT EXISTS inventory_balances_quantity_idx ON api.inventory_balances (quantity_on_hand);

DROP TRIGGER IF EXISTS inventory_balances_set_updated_at ON api.inventory_balances;
CREATE TRIGGER inventory_balances_set_updated_at
BEFORE UPDATE ON api.inventory_balances
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

CREATE TABLE IF NOT EXISTS api.inventory_movements (
  id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
  movement_number text NOT NULL UNIQUE,
  movement_type text NOT NULL,
  product_id uuid NOT NULL REFERENCES api.products(id) ON DELETE RESTRICT,
  from_warehouse_id uuid NULL REFERENCES api.warehouses(id) ON DELETE RESTRICT,
  from_storage_location_id uuid NULL REFERENCES api.storage_locations(id) ON DELETE RESTRICT,
  to_warehouse_id uuid NULL REFERENCES api.warehouses(id) ON DELETE RESTRICT,
  to_storage_location_id uuid NULL REFERENCES api.storage_locations(id) ON DELETE RESTRICT,
  quantity numeric(18,4) NOT NULL,
  unit_lookup_value_id uuid NOT NULL REFERENCES api.lookup_values(id) ON DELETE RESTRICT,
  reason text NULL,
  reference_type text NULL,
  reference_id text NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_by_user_id uuid NULL,
  created_by_email text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inventory_movements_number_not_blank CHECK (length(btrim(movement_number)) > 0),
  CONSTRAINT inventory_movements_type_valid CHECK (
    movement_type IN (
      'adjustment_in',
      'adjustment_out',
      'transfer_out',
      'transfer_in',
      'opening_balance'
    )
  ),
  CONSTRAINT inventory_movements_quantity_positive CHECK (quantity > 0),
  CONSTRAINT inventory_movements_adjust_in_shape CHECK (
    movement_type <> 'adjustment_in'
    OR (
      from_warehouse_id IS NULL
      AND from_storage_location_id IS NULL
      AND to_warehouse_id IS NOT NULL
    )
  ),
  CONSTRAINT inventory_movements_adjust_out_shape CHECK (
    movement_type <> 'adjustment_out'
    OR (
      from_warehouse_id IS NOT NULL
      AND to_warehouse_id IS NULL
      AND to_storage_location_id IS NULL
    )
  ),
  CONSTRAINT inventory_movements_transfer_shape CHECK (
    movement_type NOT IN ('transfer_in', 'transfer_out')
    OR (
      from_warehouse_id IS NOT NULL
      AND to_warehouse_id IS NOT NULL
    )
  ),
  CONSTRAINT inventory_movements_opening_shape CHECK (
    movement_type <> 'opening_balance'
    OR (
      from_warehouse_id IS NULL
      AND from_storage_location_id IS NULL
      AND to_warehouse_id IS NOT NULL
    )
  ),
  CONSTRAINT inventory_movements_adjust_reason_required CHECK (
    movement_type NOT IN ('adjustment_in', 'adjustment_out')
    OR length(btrim(COALESCE(reason, ''))) > 0
  )
);

CREATE INDEX IF NOT EXISTS inventory_movements_number_idx ON api.inventory_movements (movement_number);
CREATE INDEX IF NOT EXISTS inventory_movements_type_idx ON api.inventory_movements (movement_type);
CREATE INDEX IF NOT EXISTS inventory_movements_product_idx ON api.inventory_movements (product_id);
CREATE INDEX IF NOT EXISTS inventory_movements_from_warehouse_idx ON api.inventory_movements (from_warehouse_id);
CREATE INDEX IF NOT EXISTS inventory_movements_to_warehouse_idx ON api.inventory_movements (to_warehouse_id);
CREATE INDEX IF NOT EXISTS inventory_movements_occurred_at_idx ON api.inventory_movements (occurred_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS inventory_movements_reference_idx ON api.inventory_movements (reference_type, reference_id);

CREATE OR REPLACE FUNCTION private.inventory_error_response(
  error_code text,
  error_message text,
  http_status text DEFAULT '400'
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  PERFORM set_config('response.status', http_status, true);

  RETURN jsonb_build_object(
    'code', error_code,
    'message', error_message
  );
END;
$$;

CREATE OR REPLACE FUNCTION private.inventory_allow_negative_stock()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT COALESCE(
    (
      SELECT (setting.setting_value #>> '{}')::boolean
      FROM api.system_settings setting
      WHERE setting.setting_key = 'inventory.allowNegativeStock'
        AND setting.active = true
      LIMIT 1
    ),
    false
  );
$$;

CREATE OR REPLACE FUNCTION private.next_inventory_movement_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  prefix text;
  sequence_value bigint;
BEGIN
  SELECT trim(both '"' from setting.setting_value::text)
  INTO prefix
  FROM api.system_settings setting
  WHERE setting.setting_key = 'documents.inventoryMovementPrefix'
    AND setting.active = true
  LIMIT 1;

  prefix := COALESCE(NULLIF(btrim(prefix), ''), 'INV');
  sequence_value := nextval('private.inventory_movement_number_seq');

  RETURN prefix || '-' || to_char(statement_timestamp(), 'YYYY') || '-' || lpad(sequence_value::text, 6, '0');
END;
$$;

DROP FUNCTION IF EXISTS private.validate_inventory_product(uuid);
CREATE OR REPLACE FUNCTION private.validate_inventory_product(target_product_id uuid)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  unit_id uuid;
BEGIN
  SELECT product.base_unit_lookup_value_id
  INTO unit_id
  FROM api.products product
  WHERE product.id = target_product_id
    AND product.active = true
    AND product.track_inventory = true;

  IF unit_id IS NULL THEN
    RAISE EXCEPTION 'Product is not active or inventory-tracked' USING ERRCODE = '23514';
  END IF;

  RETURN unit_id;
END;
$$;

DROP FUNCTION IF EXISTS private.validate_inventory_warehouse(uuid);
CREATE OR REPLACE FUNCTION private.validate_inventory_warehouse(target_warehouse_id uuid)
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM api.warehouses warehouse
    WHERE warehouse.id = target_warehouse_id
      AND warehouse.active = true
  ) THEN
    RAISE EXCEPTION 'Warehouse is not active' USING ERRCODE = '23514';
  END IF;
END;
$$;

DROP FUNCTION IF EXISTS private.validate_inventory_location(uuid, uuid);
CREATE OR REPLACE FUNCTION private.validate_inventory_location(
  target_warehouse_id uuid,
  target_storage_location_id uuid
)
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  IF target_storage_location_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM api.storage_locations location
    WHERE location.id = target_storage_location_id
      AND location.warehouse_id = target_warehouse_id
      AND location.active = true
  ) THEN
    RAISE EXCEPTION 'Storage location is not active or does not belong to warehouse' USING ERRCODE = '23514';
  END IF;
END;
$$;

DROP FUNCTION IF EXISTS private.apply_inventory_balance_delta(uuid, uuid, uuid, numeric);
CREATE OR REPLACE FUNCTION private.apply_inventory_balance_delta(
  target_product_id uuid,
  target_warehouse_id uuid,
  target_storage_location_id uuid,
  quantity_delta numeric
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  next_quantity numeric(18,4);
BEGIN
  UPDATE api.inventory_balances balance
  SET quantity_on_hand = balance.quantity_on_hand + quantity_delta
  WHERE balance.product_id = target_product_id
    AND balance.warehouse_id = target_warehouse_id
    AND balance.storage_location_id IS NOT DISTINCT FROM target_storage_location_id
  RETURNING balance.quantity_on_hand INTO next_quantity;

  IF FOUND THEN
    RETURN next_quantity;
  END IF;

  INSERT INTO api.inventory_balances (
    product_id,
    warehouse_id,
    storage_location_id,
    quantity_on_hand
  )
  VALUES (
    target_product_id,
    target_warehouse_id,
    target_storage_location_id,
    quantity_delta
  )
  RETURNING quantity_on_hand INTO next_quantity;

  RETURN next_quantity;
END;
$$;

CREATE OR REPLACE FUNCTION private.current_inventory_quantity(
  product_id uuid,
  warehouse_id uuid,
  storage_location_id uuid
)
RETURNS numeric
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT COALESCE(
    (
      SELECT balance.quantity_on_hand
      FROM api.inventory_balances balance
      WHERE balance.product_id = $1
        AND balance.warehouse_id = $2
        AND balance.storage_location_id IS NOT DISTINCT FROM $3
      LIMIT 1
    ),
    0
  );
$$;

CREATE OR REPLACE FUNCTION private.current_request_user_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SET search_path = pg_catalog
AS $$
DECLARE
  claims jsonb;
BEGIN
  claims := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
  RETURN NULLIF(claims->>'user_id', '')::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION private.current_request_email()
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = pg_catalog
AS $$
DECLARE
  claims jsonb;
BEGIN
  claims := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
  RETURN NULLIF(claims->>'email', '');
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

DROP FUNCTION IF EXISTS private.insert_inventory_movement(text, uuid, uuid, uuid, uuid, uuid, numeric, uuid, text, text, text);
CREATE OR REPLACE FUNCTION private.insert_inventory_movement(
  target_movement_type text,
  target_product_id uuid,
  target_from_warehouse_id uuid,
  target_from_storage_location_id uuid,
  target_to_warehouse_id uuid,
  target_to_storage_location_id uuid,
  target_quantity numeric,
  target_unit_lookup_value_id uuid,
  target_reason text,
  target_reference_type text DEFAULT NULL,
  target_reference_id text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  inserted_id uuid;
BEGIN
  INSERT INTO api.inventory_movements (
    movement_number,
    movement_type,
    product_id,
    from_warehouse_id,
    from_storage_location_id,
    to_warehouse_id,
    to_storage_location_id,
    quantity,
    unit_lookup_value_id,
    reason,
    reference_type,
    reference_id,
    created_by_user_id,
    created_by_email
  )
  VALUES (
    private.next_inventory_movement_number(),
    target_movement_type,
    target_product_id,
    target_from_warehouse_id,
    target_from_storage_location_id,
    target_to_warehouse_id,
    target_to_storage_location_id,
    target_quantity,
    target_unit_lookup_value_id,
    NULLIF(btrim(COALESCE(target_reason, '')), ''),
    target_reference_type,
    target_reference_id,
    private.current_request_user_id(),
    private.current_request_email()
  )
  RETURNING id INTO inserted_id;

  RETURN inserted_id;
END;
$$;

CREATE OR REPLACE FUNCTION private.validate_inventory_movement_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  product_unit_id uuid;
BEGIN
  product_unit_id := private.validate_inventory_product(NEW.product_id);

  IF NEW.unit_lookup_value_id <> product_unit_id THEN
    RAISE EXCEPTION 'Inventory movement unit must match product base unit' USING ERRCODE = '23514';
  END IF;

  IF NOT private.lookup_value_has_type(NEW.unit_lookup_value_id, 'unit', true) THEN
    RAISE EXCEPTION 'Inventory movement unit is invalid' USING ERRCODE = '23514';
  END IF;

  IF NEW.from_warehouse_id IS NOT NULL THEN
    PERFORM private.validate_inventory_warehouse(NEW.from_warehouse_id);
    PERFORM private.validate_inventory_location(NEW.from_warehouse_id, NEW.from_storage_location_id);
  END IF;

  IF NEW.to_warehouse_id IS NOT NULL THEN
    PERFORM private.validate_inventory_warehouse(NEW.to_warehouse_id);
    PERFORM private.validate_inventory_location(NEW.to_warehouse_id, NEW.to_storage_location_id);
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.validate_inventory_balance_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  PERFORM private.validate_inventory_product(NEW.product_id);
  PERFORM private.validate_inventory_warehouse(NEW.warehouse_id);
  PERFORM private.validate_inventory_location(NEW.warehouse_id, NEW.storage_location_id);

  IF NEW.quantity_on_hand < 0 AND NOT private.inventory_allow_negative_stock() THEN
    RAISE EXCEPTION 'Negative stock is not allowed' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.prevent_inventory_movement_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  RAISE EXCEPTION 'Inventory movements are append-only' USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS inventory_movements_validate ON api.inventory_movements;
CREATE TRIGGER inventory_movements_validate
BEFORE INSERT ON api.inventory_movements
FOR EACH ROW
EXECUTE FUNCTION private.validate_inventory_movement_row();

DROP TRIGGER IF EXISTS inventory_balances_validate ON api.inventory_balances;
CREATE TRIGGER inventory_balances_validate
BEFORE INSERT OR UPDATE ON api.inventory_balances
FOR EACH ROW
EXECUTE FUNCTION private.validate_inventory_balance_row();

DROP TRIGGER IF EXISTS inventory_movements_prevent_update ON api.inventory_movements;
CREATE TRIGGER inventory_movements_prevent_update
BEFORE UPDATE ON api.inventory_movements
FOR EACH ROW
EXECUTE FUNCTION private.prevent_inventory_movement_mutation();

DROP TRIGGER IF EXISTS inventory_movements_prevent_delete ON api.inventory_movements;
CREATE TRIGGER inventory_movements_prevent_delete
BEFORE DELETE ON api.inventory_movements
FOR EACH ROW
EXECUTE FUNCTION private.prevent_inventory_movement_mutation();

CREATE OR REPLACE VIEW api.inventory_balance_view
WITH (security_invoker = true)
AS
SELECT
  balance.id,
  balance.product_id,
  product.sku AS product_sku,
  product.name AS product_name,
  balance.warehouse_id,
  warehouse.code AS warehouse_code,
  warehouse.name AS warehouse_name,
  balance.storage_location_id,
  location.code AS storage_location_code,
  location.name AS storage_location_name,
  balance.quantity_on_hand,
  product.base_unit_lookup_value_id AS unit_lookup_value_id,
  unit_value.code AS unit_code,
  unit_value.label AS unit_label,
  balance.updated_at
FROM api.inventory_balances balance
JOIN api.products product ON product.id = balance.product_id
JOIN api.warehouses warehouse ON warehouse.id = balance.warehouse_id
LEFT JOIN api.storage_locations location ON location.id = balance.storage_location_id
LEFT JOIN api.lookup_values unit_value ON unit_value.id = product.base_unit_lookup_value_id;

CREATE OR REPLACE VIEW api.inventory_movement_view
WITH (security_invoker = true)
AS
SELECT
  movement.id,
  movement.movement_number,
  movement.movement_type,
  movement.product_id,
  product.sku AS product_sku,
  product.name AS product_name,
  movement.from_warehouse_id,
  from_warehouse.name AS from_warehouse_name,
  movement.from_storage_location_id,
  from_location.name AS from_storage_location_name,
  movement.to_warehouse_id,
  to_warehouse.name AS to_warehouse_name,
  movement.to_storage_location_id,
  to_location.name AS to_storage_location_name,
  movement.quantity,
  movement.unit_lookup_value_id,
  unit_value.label AS unit_label,
  movement.reason,
  movement.reference_type,
  movement.reference_id,
  movement.occurred_at,
  movement.created_by_email
FROM api.inventory_movements movement
JOIN api.products product ON product.id = movement.product_id
LEFT JOIN api.warehouses from_warehouse ON from_warehouse.id = movement.from_warehouse_id
LEFT JOIN api.storage_locations from_location ON from_location.id = movement.from_storage_location_id
LEFT JOIN api.warehouses to_warehouse ON to_warehouse.id = movement.to_warehouse_id
LEFT JOIN api.storage_locations to_location ON to_location.id = movement.to_storage_location_id
LEFT JOIN api.lookup_values unit_value ON unit_value.id = movement.unit_lookup_value_id;

CREATE OR REPLACE FUNCTION private.inventory_movement_json(movement_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT jsonb_build_object(
    'id', movement.id,
    'movementNumber', movement.movement_number,
    'movementType', movement.movement_type,
    'productId', movement.product_id,
    'productSku', movement.product_sku,
    'productName', movement.product_name,
    'fromWarehouseId', movement.from_warehouse_id,
    'fromWarehouseName', movement.from_warehouse_name,
    'fromStorageLocationId', movement.from_storage_location_id,
    'fromStorageLocationName', movement.from_storage_location_name,
    'toWarehouseId', movement.to_warehouse_id,
    'toWarehouseName', movement.to_warehouse_name,
    'toStorageLocationId', movement.to_storage_location_id,
    'toStorageLocationName', movement.to_storage_location_name,
    'quantity', movement.quantity,
    'unitLookupValueId', movement.unit_lookup_value_id,
    'unitLabel', movement.unit_label,
    'reason', movement.reason,
    'referenceType', movement.reference_type,
    'referenceId', movement.reference_id,
    'occurredAt', movement.occurred_at,
    'createdByEmail', movement.created_by_email
  )
  FROM api.inventory_movement_view movement
  WHERE movement.id = movement_id;
$$;

CREATE OR REPLACE FUNCTION api.inventory_adjust_in(
  product_id uuid,
  warehouse_id uuid,
  storage_location_id uuid DEFAULT NULL,
  quantity numeric DEFAULT NULL,
  reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  unit_id uuid;
  movement_id uuid;
BEGIN
  IF quantity IS NULL OR quantity <= 0 THEN
    RETURN private.inventory_error_response('23514', 'Quantity must be greater than zero');
  END IF;

  IF reason IS NULL OR length(btrim(reason)) = 0 THEN
    RETURN private.inventory_error_response('23514', 'Reason is required');
  END IF;

  unit_id := private.validate_inventory_product(product_id);
  PERFORM private.validate_inventory_warehouse(warehouse_id);
  PERFORM private.validate_inventory_location(warehouse_id, storage_location_id);
  PERFORM private.apply_inventory_balance_delta(product_id, warehouse_id, storage_location_id, quantity);

  movement_id := private.insert_inventory_movement(
    'adjustment_in',
    product_id,
    NULL,
    NULL,
    warehouse_id,
    storage_location_id,
    quantity,
    unit_id,
    reason,
    'manual_adjustment',
    NULL
  );

  PERFORM private.write_audit_log(
    'inventory.adjustment_in',
    'inventory_movement',
    'success',
    'Inventory adjustment in posted',
    movement_id::text,
    jsonb_build_object(
      'movementId', movement_id,
      'productId', product_id,
      'warehouseId', warehouse_id,
      'storageLocationId', storage_location_id,
      'quantity', quantity,
      'movementType', 'adjustment_in'
    )
  );

  RETURN private.inventory_movement_json(movement_id);
END;
$$;

CREATE OR REPLACE FUNCTION api.inventory_adjust_out(
  product_id uuid,
  warehouse_id uuid,
  storage_location_id uuid DEFAULT NULL,
  quantity numeric DEFAULT NULL,
  reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  unit_id uuid;
  next_quantity numeric(18,4);
  movement_id uuid;
BEGIN
  IF quantity IS NULL OR quantity <= 0 THEN
    RETURN private.inventory_error_response('23514', 'Quantity must be greater than zero');
  END IF;

  IF reason IS NULL OR length(btrim(reason)) = 0 THEN
    RETURN private.inventory_error_response('23514', 'Reason is required');
  END IF;

  unit_id := private.validate_inventory_product(product_id);
  PERFORM private.validate_inventory_warehouse(warehouse_id);
  PERFORM private.validate_inventory_location(warehouse_id, storage_location_id);
  next_quantity := private.current_inventory_quantity(product_id, warehouse_id, storage_location_id) - quantity;

  IF next_quantity < 0 AND NOT private.inventory_allow_negative_stock() THEN
    PERFORM private.write_audit_log(
      'inventory.negative_stock_blocked',
      'inventory_balance',
      'blocked',
      'Negative stock blocked',
      product_id::text,
      jsonb_build_object(
        'productId', product_id,
        'warehouseId', warehouse_id,
        'storageLocationId', storage_location_id,
        'quantity', quantity,
        'movementType', 'adjustment_out'
      )
    );
    RETURN private.inventory_error_response('23514', 'Negative stock is not allowed');
  END IF;

  PERFORM private.apply_inventory_balance_delta(product_id, warehouse_id, storage_location_id, -quantity);

  movement_id := private.insert_inventory_movement(
    'adjustment_out',
    product_id,
    warehouse_id,
    storage_location_id,
    NULL,
    NULL,
    quantity,
    unit_id,
    reason,
    'manual_adjustment',
    NULL
  );

  PERFORM private.write_audit_log(
    'inventory.adjustment_out',
    'inventory_movement',
    'success',
    'Inventory adjustment out posted',
    movement_id::text,
    jsonb_build_object(
      'movementId', movement_id,
      'productId', product_id,
      'warehouseId', warehouse_id,
      'storageLocationId', storage_location_id,
      'quantity', quantity,
      'movementType', 'adjustment_out'
    )
  );

  RETURN private.inventory_movement_json(movement_id);
END;
$$;

CREATE OR REPLACE FUNCTION api.inventory_transfer(
  product_id uuid,
  from_warehouse_id uuid,
  from_storage_location_id uuid,
  to_warehouse_id uuid,
  to_storage_location_id uuid,
  quantity numeric,
  reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  unit_id uuid;
  next_quantity numeric(18,4);
  transfer_reference_id text;
  out_movement_id uuid;
  in_movement_id uuid;
BEGIN
  IF quantity IS NULL OR quantity <= 0 THEN
    RETURN private.inventory_error_response('23514', 'Quantity must be greater than zero');
  END IF;

  IF from_warehouse_id IS NULL OR to_warehouse_id IS NULL THEN
    RETURN private.inventory_error_response('23514', 'Transfer requires source and destination warehouses');
  END IF;

  IF from_warehouse_id = to_warehouse_id
    AND from_storage_location_id IS NOT DISTINCT FROM to_storage_location_id THEN
    RETURN private.inventory_error_response('23514', 'Transfer source and destination must be different');
  END IF;

  unit_id := private.validate_inventory_product(product_id);
  PERFORM private.validate_inventory_warehouse(from_warehouse_id);
  PERFORM private.validate_inventory_warehouse(to_warehouse_id);
  PERFORM private.validate_inventory_location(from_warehouse_id, from_storage_location_id);
  PERFORM private.validate_inventory_location(to_warehouse_id, to_storage_location_id);

  next_quantity := private.current_inventory_quantity(
    product_id,
    from_warehouse_id,
    from_storage_location_id
  ) - quantity;

  IF next_quantity < 0 AND NOT private.inventory_allow_negative_stock() THEN
    PERFORM private.write_audit_log(
      'inventory.negative_stock_blocked',
      'inventory_balance',
      'blocked',
      'Negative stock blocked',
      product_id::text,
      jsonb_build_object(
        'productId', product_id,
        'warehouseId', from_warehouse_id,
        'storageLocationId', from_storage_location_id,
        'quantity', quantity,
        'movementType', 'transfer_out'
      )
    );
    RETURN private.inventory_error_response('23514', 'Negative stock is not allowed');
  END IF;

  PERFORM private.apply_inventory_balance_delta(
    product_id,
    from_warehouse_id,
    from_storage_location_id,
    -quantity
  );

  PERFORM private.apply_inventory_balance_delta(
    product_id,
    to_warehouse_id,
    to_storage_location_id,
    quantity
  );

  transfer_reference_id := public.gen_random_uuid()::text;
  out_movement_id := private.insert_inventory_movement(
    'transfer_out',
    product_id,
    from_warehouse_id,
    from_storage_location_id,
    to_warehouse_id,
    to_storage_location_id,
    quantity,
    unit_id,
    reason,
    'inventory_transfer',
    transfer_reference_id
  );
  in_movement_id := private.insert_inventory_movement(
    'transfer_in',
    product_id,
    from_warehouse_id,
    from_storage_location_id,
    to_warehouse_id,
    to_storage_location_id,
    quantity,
    unit_id,
    reason,
    'inventory_transfer',
    transfer_reference_id
  );

  PERFORM private.write_audit_log(
    'inventory.transfer',
    'inventory_movement',
    'success',
    'Inventory transfer posted',
    transfer_reference_id,
    jsonb_build_object(
      'outMovementId', out_movement_id,
      'inMovementId', in_movement_id,
      'productId', product_id,
      'fromWarehouseId', from_warehouse_id,
      'fromStorageLocationId', from_storage_location_id,
      'toWarehouseId', to_warehouse_id,
      'toStorageLocationId', to_storage_location_id,
      'quantity', quantity,
      'movementType', 'transfer'
    )
  );

  RETURN jsonb_build_object(
    'outMovement', private.inventory_movement_json(out_movement_id),
    'inMovement', private.inventory_movement_json(in_movement_id)
  );
END;
$$;

REVOKE ALL ON api.inventory_balances FROM PUBLIC;
REVOKE ALL ON api.inventory_movements FROM PUBLIC;
REVOKE ALL ON api.inventory_balance_view FROM PUBLIC;
REVOKE ALL ON api.inventory_movement_view FROM PUBLIC;
REVOKE ALL ON FUNCTION private.inventory_error_response(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.inventory_allow_negative_stock() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.next_inventory_movement_number() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.validate_inventory_product(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.validate_inventory_warehouse(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.validate_inventory_location(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.apply_inventory_balance_delta(uuid, uuid, uuid, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.current_inventory_quantity(uuid, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.current_request_user_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.current_request_email() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.insert_inventory_movement(text, uuid, uuid, uuid, uuid, uuid, numeric, uuid, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.validate_inventory_movement_row() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.validate_inventory_balance_row() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.prevent_inventory_movement_mutation() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.inventory_movement_json(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.inventory_adjust_in(uuid, uuid, uuid, numeric, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.inventory_adjust_out(uuid, uuid, uuid, numeric, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.inventory_transfer(uuid, uuid, uuid, uuid, uuid, numeric, text) FROM PUBLIC;

GRANT USAGE ON SCHEMA api TO erp_admin, erp_manager, erp_accountant, erp_warehouse;
GRANT SELECT ON api.products, api.warehouses, api.storage_locations, api.lookup_types, api.lookup_values
TO erp_admin, erp_manager, erp_accountant, erp_warehouse;
GRANT SELECT ON api.inventory_balances, api.inventory_movements
TO erp_admin, erp_manager, erp_accountant, erp_warehouse;
GRANT SELECT ON api.inventory_balance_view, api.inventory_movement_view
TO erp_admin, erp_manager, erp_accountant, erp_warehouse;
GRANT EXECUTE ON FUNCTION api.inventory_adjust_in(uuid, uuid, uuid, numeric, text)
TO erp_admin, erp_manager, erp_warehouse;
GRANT EXECUTE ON FUNCTION api.inventory_adjust_out(uuid, uuid, uuid, numeric, text)
TO erp_admin, erp_manager, erp_warehouse;
GRANT EXECUTE ON FUNCTION api.inventory_transfer(uuid, uuid, uuid, uuid, uuid, numeric, text)
TO erp_admin, erp_manager, erp_warehouse;

ALTER TABLE api.inventory_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.inventory_balances FORCE ROW LEVEL SECURITY;
ALTER TABLE api.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.inventory_movements FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inventory_balances_select_policy ON api.inventory_balances;
DROP POLICY IF EXISTS inventory_movements_select_policy ON api.inventory_movements;
DROP POLICY IF EXISTS inventory_movements_insert_policy ON api.inventory_movements;

CREATE POLICY inventory_balances_select_policy
ON api.inventory_balances
FOR SELECT
TO erp_admin, erp_manager, erp_accountant, erp_warehouse
USING (true);

CREATE POLICY inventory_movements_select_policy
ON api.inventory_movements
FOR SELECT
TO erp_admin, erp_manager, erp_accountant, erp_warehouse
USING (true);

CREATE POLICY inventory_movements_insert_policy
ON api.inventory_movements
FOR INSERT
TO erp_admin, erp_manager, erp_warehouse
WITH CHECK (true);

COMMIT;
