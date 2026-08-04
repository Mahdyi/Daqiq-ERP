BEGIN;

INSERT INTO api.lookup_types (code, name, description, system, active)
VALUES ('sales_delivery_status', 'وضعیت حواله فروش', NULL, true, true)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    active = true;

WITH status_type AS (
  SELECT id FROM api.lookup_types WHERE code = 'sales_delivery_status'
)
INSERT INTO api.lookup_values (
  lookup_type_id,
  code,
  label,
  description,
  sort_order,
  metadata,
  system,
  active
)
SELECT status_type.id, status.code, status.label, NULL, status.sort_order, '{}'::jsonb, true, true
FROM status_type
CROSS JOIN (
  VALUES
    ('draft', 'پیش‌نویس', 10),
    ('posted', 'ثبت‌شده', 20),
    ('cancelled', 'لغوشده', 30)
) AS status(code, label, sort_order)
ON CONFLICT (lookup_type_id, code) DO UPDATE
SET label = EXCLUDED.label,
    sort_order = EXCLUDED.sort_order,
    active = true;

WITH movement_type AS (
  SELECT id FROM api.lookup_types WHERE code = 'inventory_movement_type'
)
INSERT INTO api.lookup_values (
  lookup_type_id,
  code,
  label,
  description,
  sort_order,
  metadata,
  system,
  active
)
SELECT movement_type.id, movement.code, movement.label, NULL, movement.sort_order, '{}'::jsonb, true, true
FROM movement_type
CROSS JOIN (
  VALUES
    ('sales_shipment', 'ارسال فروش', 70),
    ('sales_shipment_reversal', 'برگشت/ابطال ارسال فروش', 80)
) AS movement(code, label, sort_order)
ON CONFLICT (lookup_type_id, code) DO UPDATE
SET label = EXCLUDED.label,
    sort_order = EXCLUDED.sort_order,
    active = true;

ALTER TABLE api.inventory_movements
DROP CONSTRAINT IF EXISTS inventory_movements_type_valid;

ALTER TABLE api.inventory_movements
ADD CONSTRAINT inventory_movements_type_valid CHECK (
  movement_type IN (
    'adjustment_in',
    'adjustment_out',
    'transfer_out',
    'transfer_in',
    'opening_balance',
    'purchase_receipt',
    'purchase_receipt_reversal',
    'sales_shipment',
    'sales_shipment_reversal'
  )
);

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
  'documents.salesDeliveryPrefix',
  '"SD"'::jsonb,
  'string',
  'documents',
  'پیشوند حواله فروش',
  'پیشوند شماره‌گذاری حواله‌های فروش',
  true,
  true
)
ON CONFLICT (setting_key) DO UPDATE
SET label = EXCLUDED.label,
    description = EXCLUDED.description,
    active = true;

UPDATE api.feature_flags
SET enabled = true
WHERE flag_key = 'sales.enabled';

CREATE OR REPLACE FUNCTION private.sales_delivery_status_id(status_code text)
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT value.id
  FROM api.lookup_values value
  JOIN api.lookup_types type ON type.id = value.lookup_type_id
  WHERE type.code = 'sales_delivery_status'
    AND value.code = status_code
    AND value.active = true
    AND type.active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.sales_delivery_status_code(status_lookup_value_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT value.code
  FROM api.lookup_values value
  JOIN api.lookup_types type ON type.id = value.lookup_type_id
  WHERE value.id = status_lookup_value_id
    AND type.code = 'sales_delivery_status'
  LIMIT 1;
$$;

CREATE TABLE IF NOT EXISTS api.sales_deliveries (
  id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
  delivery_number text NOT NULL UNIQUE,
  sales_order_id uuid NOT NULL REFERENCES api.sales_orders(id) ON DELETE RESTRICT,
  customer_id uuid NOT NULL REFERENCES api.customers(id) ON DELETE RESTRICT,
  status_lookup_value_id uuid NOT NULL REFERENCES api.lookup_values(id) ON DELETE RESTRICT,
  delivery_date date NOT NULL DEFAULT current_date,
  warehouse_id uuid NOT NULL REFERENCES api.warehouses(id) ON DELETE RESTRICT,
  notes text NULL,
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
  CONSTRAINT sales_deliveries_number_not_blank CHECK (length(btrim(delivery_number)) > 0),
  CONSTRAINT sales_deliveries_posted_metadata CHECK (
    private.sales_delivery_status_code(status_lookup_value_id) <> 'posted'
    OR (posted_by_email IS NOT NULL AND posted_at IS NOT NULL)
  ),
  CONSTRAINT sales_deliveries_cancelled_metadata CHECK (
    private.sales_delivery_status_code(status_lookup_value_id) <> 'cancelled'
    OR (cancelled_by_email IS NOT NULL AND cancelled_at IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS api.sales_delivery_lines (
  id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
  sales_delivery_id uuid NOT NULL REFERENCES api.sales_deliveries(id) ON DELETE CASCADE,
  sales_order_line_id uuid NOT NULL REFERENCES api.sales_order_lines(id) ON DELETE RESTRICT,
  line_number integer NOT NULL,
  product_id uuid NOT NULL REFERENCES api.products(id) ON DELETE RESTRICT,
  shipped_quantity numeric(18,4) NOT NULL,
  unit_lookup_value_id uuid NOT NULL REFERENCES api.lookup_values(id) ON DELETE RESTRICT,
  storage_location_id uuid NULL REFERENCES api.storage_locations(id) ON DELETE RESTRICT,
  notes text NULL,
  inventory_movement_id uuid NULL REFERENCES api.inventory_movements(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sales_delivery_lines_line_unique UNIQUE (sales_delivery_id, line_number),
  CONSTRAINT sales_delivery_lines_quantity_positive CHECK (shipped_quantity > 0)
);

CREATE INDEX IF NOT EXISTS sales_deliveries_number_idx ON api.sales_deliveries (lower(delivery_number));
CREATE INDEX IF NOT EXISTS sales_deliveries_order_idx ON api.sales_deliveries (sales_order_id);
CREATE INDEX IF NOT EXISTS sales_deliveries_customer_idx ON api.sales_deliveries (customer_id);
CREATE INDEX IF NOT EXISTS sales_deliveries_status_idx ON api.sales_deliveries (status_lookup_value_id);
CREATE INDEX IF NOT EXISTS sales_deliveries_date_idx ON api.sales_deliveries (delivery_date DESC);
CREATE INDEX IF NOT EXISTS sales_deliveries_warehouse_idx ON api.sales_deliveries (warehouse_id);
CREATE INDEX IF NOT EXISTS sales_deliveries_created_by_idx ON api.sales_deliveries (created_by_user_id);
CREATE INDEX IF NOT EXISTS sales_delivery_lines_delivery_idx ON api.sales_delivery_lines (sales_delivery_id);
CREATE INDEX IF NOT EXISTS sales_delivery_lines_order_line_idx ON api.sales_delivery_lines (sales_order_line_id);
CREATE INDEX IF NOT EXISTS sales_delivery_lines_product_idx ON api.sales_delivery_lines (product_id);
CREATE INDEX IF NOT EXISTS sales_delivery_lines_location_idx ON api.sales_delivery_lines (storage_location_id);
CREATE INDEX IF NOT EXISTS sales_delivery_lines_movement_idx ON api.sales_delivery_lines (inventory_movement_id);

DROP TRIGGER IF EXISTS set_sales_deliveries_updated_at ON api.sales_deliveries;
CREATE TRIGGER set_sales_deliveries_updated_at
BEFORE UPDATE ON api.sales_deliveries
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

DROP TRIGGER IF EXISTS set_sales_delivery_lines_updated_at ON api.sales_delivery_lines;
CREATE TRIGGER set_sales_delivery_lines_updated_at
BEFORE UPDATE ON api.sales_delivery_lines
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

CREATE OR REPLACE FUNCTION private.next_sales_delivery_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  prefix text;
  next_number integer;
BEGIN
  SELECT COALESCE(NULLIF(setting.setting_value #>> '{}', ''), 'SD')
  INTO prefix
  FROM api.system_settings setting
  WHERE setting.setting_key = 'documents.salesDeliveryPrefix'
    AND setting.active = true
  LIMIT 1;

  prefix := COALESCE(prefix, 'SD');

  SELECT COALESCE(
    MAX(
      NULLIF(
        regexp_replace(delivery.delivery_number, '^' || prefix || '-' || to_char(current_date, 'YYYY') || '-([0-9]+)$', '\1'),
        delivery.delivery_number
      )::integer
    ),
    0
  ) + 1
  INTO next_number
  FROM api.sales_deliveries delivery
  WHERE delivery.delivery_number LIKE prefix || '-' || to_char(current_date, 'YYYY') || '-%';

  RETURN prefix || '-' || to_char(current_date, 'YYYY') || '-' || lpad(next_number::text, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION private.validate_sales_delivery_header()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  order_customer_id uuid;
BEGIN
  IF NOT private.lookup_value_has_type(NEW.status_lookup_value_id, 'sales_delivery_status', true) THEN
    RAISE EXCEPTION 'Sales delivery status is invalid' USING ERRCODE = '23514';
  END IF;

  SELECT sales_order.customer_id
  INTO order_customer_id
  FROM api.sales_orders sales_order
  WHERE sales_order.id = NEW.sales_order_id;

  IF order_customer_id IS NULL THEN
    RAISE EXCEPTION 'Sales order not found' USING ERRCODE = 'P0002';
  END IF;

  IF order_customer_id <> NEW.customer_id THEN
    RAISE EXCEPTION 'Sales delivery customer must match sales order customer' USING ERRCODE = '23514';
  END IF;

  PERFORM private.validate_inventory_warehouse(NEW.warehouse_id);

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.validate_sales_delivery_line()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  delivery_warehouse_id uuid;
  delivery_order_id uuid;
  expected_product_id uuid;
  expected_unit_id uuid;
BEGIN
  SELECT delivery.warehouse_id, delivery.sales_order_id
  INTO delivery_warehouse_id, delivery_order_id
  FROM api.sales_deliveries delivery
  WHERE delivery.id = NEW.sales_delivery_id;

  IF delivery_warehouse_id IS NULL THEN
    RAISE EXCEPTION 'Sales delivery not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT line.product_id, line.unit_lookup_value_id
  INTO expected_product_id, expected_unit_id
  FROM api.sales_order_lines line
  WHERE line.id = NEW.sales_order_line_id
    AND line.sales_order_id = delivery_order_id;

  IF expected_product_id IS NULL THEN
    RAISE EXCEPTION 'Sales order line does not belong to this delivery order' USING ERRCODE = '23514';
  END IF;

  IF expected_product_id <> NEW.product_id THEN
    RAISE EXCEPTION 'Sales delivery product must match sales order line product' USING ERRCODE = '23514';
  END IF;

  IF expected_unit_id <> NEW.unit_lookup_value_id THEN
    RAISE EXCEPTION 'Sales delivery unit must match sales order line unit' USING ERRCODE = '23514';
  END IF;

  PERFORM private.validate_inventory_product(NEW.product_id);
  PERFORM private.validate_inventory_location(delivery_warehouse_id, NEW.storage_location_id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_sales_delivery_header ON api.sales_deliveries;
CREATE TRIGGER validate_sales_delivery_header
BEFORE INSERT OR UPDATE ON api.sales_deliveries
FOR EACH ROW
EXECUTE FUNCTION private.validate_sales_delivery_header();

DROP TRIGGER IF EXISTS validate_sales_delivery_line ON api.sales_delivery_lines;
CREATE TRIGGER validate_sales_delivery_line
BEFORE INSERT OR UPDATE ON api.sales_delivery_lines
FOR EACH ROW
EXECUTE FUNCTION private.validate_sales_delivery_line();

CREATE OR REPLACE VIEW api.sales_delivery_view
WITH (security_invoker = true)
AS
SELECT
  delivery.id,
  delivery.delivery_number,
  delivery.sales_order_id,
  sales_order.order_number AS sales_order_number,
  delivery.customer_id,
  customer.code AS customer_code,
  customer.name AS customer_name,
  delivery.status_lookup_value_id,
  status.code AS status_code,
  status.label AS status_label,
  delivery.delivery_date,
  delivery.warehouse_id,
  warehouse.code AS warehouse_code,
  warehouse.name AS warehouse_name,
  delivery.notes,
  delivery.posted_by_email,
  delivery.posted_at,
  delivery.cancelled_by_email,
  delivery.cancelled_at,
  delivery.created_by_email,
  delivery.created_at,
  delivery.updated_at
FROM api.sales_deliveries delivery
JOIN api.sales_orders sales_order ON sales_order.id = delivery.sales_order_id
JOIN api.customers customer ON customer.id = delivery.customer_id
JOIN api.lookup_values status ON status.id = delivery.status_lookup_value_id
JOIN api.warehouses warehouse ON warehouse.id = delivery.warehouse_id;

CREATE OR REPLACE VIEW api.sales_delivery_line_view
WITH (security_invoker = true)
AS
SELECT
  line.id,
  line.sales_delivery_id,
  line.line_number,
  line.sales_order_line_id,
  line.product_id,
  product.sku AS product_sku,
  product.name AS product_name,
  line.shipped_quantity,
  unit.code AS unit_code,
  unit.label AS unit_label,
  line.storage_location_id,
  location.code AS storage_location_code,
  location.name AS storage_location_name,
  line.inventory_movement_id,
  line.notes
FROM api.sales_delivery_lines line
JOIN api.products product ON product.id = line.product_id
JOIN api.lookup_values unit ON unit.id = line.unit_lookup_value_id
LEFT JOIN api.storage_locations location ON location.id = line.storage_location_id;

CREATE OR REPLACE VIEW api.sales_order_line_delivery_view
WITH (security_invoker = true)
AS
SELECT
  order_line.id AS sales_order_line_id,
  order_line.sales_order_id,
  order_line.product_id,
  product.sku AS product_sku,
  product.name AS product_name,
  order_line.quantity AS ordered_quantity,
  COALESCE(SUM(delivery_line.shipped_quantity) FILTER (
    WHERE delivery_status.code = 'posted'
  ), 0)::numeric(18,4) AS shipped_quantity,
  GREATEST(
    order_line.quantity - COALESCE(SUM(delivery_line.shipped_quantity) FILTER (
      WHERE delivery_status.code = 'posted'
    ), 0),
    0
  )::numeric(18,4) AS remaining_quantity,
  order_line.unit_lookup_value_id,
  unit.code AS unit_code,
  unit.label AS unit_label
FROM api.sales_order_lines order_line
JOIN api.products product ON product.id = order_line.product_id
JOIN api.lookup_values unit ON unit.id = order_line.unit_lookup_value_id
LEFT JOIN api.sales_delivery_lines delivery_line ON delivery_line.sales_order_line_id = order_line.id
LEFT JOIN api.sales_deliveries delivery ON delivery.id = delivery_line.sales_delivery_id
LEFT JOIN api.lookup_values delivery_status ON delivery_status.id = delivery.status_lookup_value_id
GROUP BY
  order_line.id,
  order_line.sales_order_id,
  order_line.product_id,
  product.sku,
  product.name,
  order_line.quantity,
  order_line.unit_lookup_value_id,
  unit.code,
  unit.label;

CREATE OR REPLACE VIEW api.sales_order_delivery_view
WITH (security_invoker = true)
AS
SELECT
  sales_order.id AS sales_order_id,
  sales_order.order_number AS sales_order_number,
  sales_order.customer_id,
  customer.code AS customer_code,
  customer.name AS customer_name,
  SUM(progress.ordered_quantity)::numeric(18,4) AS ordered_quantity,
  SUM(progress.shipped_quantity)::numeric(18,4) AS shipped_quantity,
  SUM(progress.remaining_quantity)::numeric(18,4) AS remaining_quantity
FROM api.sales_orders sales_order
JOIN api.customers customer ON customer.id = sales_order.customer_id
LEFT JOIN api.sales_order_line_delivery_view progress ON progress.sales_order_id = sales_order.id
GROUP BY sales_order.id, sales_order.order_number, sales_order.customer_id, customer.code, customer.name;

CREATE OR REPLACE FUNCTION private.sales_delivery_json(target_delivery_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT jsonb_build_object(
    'id', delivery.id,
    'deliveryNumber', delivery.delivery_number,
    'salesOrderId', delivery.sales_order_id,
    'salesOrderNumber', delivery.sales_order_number,
    'customerId', delivery.customer_id,
    'customerCode', delivery.customer_code,
    'customerName', delivery.customer_name,
    'statusCode', delivery.status_code,
    'statusLabel', delivery.status_label,
    'deliveryDate', delivery.delivery_date,
    'warehouseId', delivery.warehouse_id,
    'warehouseCode', delivery.warehouse_code,
    'warehouseName', delivery.warehouse_name,
    'notes', delivery.notes,
    'postedByEmail', delivery.posted_by_email,
    'postedAt', delivery.posted_at,
    'cancelledByEmail', delivery.cancelled_by_email,
    'cancelledAt', delivery.cancelled_at,
    'createdByEmail', delivery.created_by_email,
    'createdAt', delivery.created_at,
    'updatedAt', delivery.updated_at,
    'lines', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', line.id,
            'salesDeliveryId', line.sales_delivery_id,
            'lineNumber', line.line_number,
            'salesOrderLineId', line.sales_order_line_id,
            'productId', line.product_id,
            'productSku', line.product_sku,
            'productName', line.product_name,
            'shippedQuantity', line.shipped_quantity,
            'unitCode', line.unit_code,
            'unitLabel', line.unit_label,
            'storageLocationId', line.storage_location_id,
            'storageLocationCode', line.storage_location_code,
            'storageLocationName', line.storage_location_name,
            'inventoryMovementId', line.inventory_movement_id,
            'notes', line.notes
          )
          ORDER BY line.line_number
        )
        FROM api.sales_delivery_line_view line
        WHERE line.sales_delivery_id = delivery.id
      ),
      '[]'::jsonb
    )
  )
  FROM api.sales_delivery_view delivery
  WHERE delivery.id = target_delivery_id;
$$;

CREATE OR REPLACE FUNCTION api.post_sales_delivery(
  sales_order_id uuid,
  delivery_date date DEFAULT current_date,
  warehouse_id uuid DEFAULT NULL,
  notes text DEFAULT NULL,
  lines jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  target_order api.sales_orders%ROWTYPE;
  order_status text;
  delivery_id uuid;
  line_item jsonb;
  order_line api.sales_order_lines%ROWTYPE;
  delivery_line_number integer := 0;
  shipped_quantity numeric(18,4);
  storage_location_id uuid;
  line_notes text;
  remaining_quantity numeric(18,4);
  current_quantity numeric(18,4);
  movement_id uuid;
  all_delivered boolean;
BEGIN
  IF warehouse_id IS NULL THEN
    RETURN private.inventory_error_response('23514', 'Warehouse is required');
  END IF;

  IF jsonb_typeof(lines) <> 'array' OR jsonb_array_length(lines) = 0 THEN
    RETURN private.inventory_error_response('23514', 'At least one delivery line is required');
  END IF;

  SELECT * INTO target_order
  FROM api.sales_orders sales_order
  WHERE sales_order.id = post_sales_delivery.sales_order_id;

  IF NOT FOUND THEN
    RETURN private.inventory_error_response('P0002', 'Sales order not found', '404');
  END IF;

  order_status := private.sales_order_status_code(target_order.status_lookup_value_id);

  IF order_status <> 'confirmed' THEN
    RETURN private.inventory_error_response('23514', 'Only confirmed sales orders can be delivered');
  END IF;

  PERFORM private.validate_inventory_warehouse(warehouse_id);

  INSERT INTO api.sales_deliveries (
    delivery_number,
    sales_order_id,
    customer_id,
    status_lookup_value_id,
    delivery_date,
    warehouse_id,
    notes,
    posted_by_user_id,
    posted_by_email,
    posted_at,
    created_by_user_id,
    created_by_email
  )
  VALUES (
    private.next_sales_delivery_number(),
    target_order.id,
    target_order.customer_id,
    private.sales_delivery_status_id('posted'),
    COALESCE(delivery_date, current_date),
    warehouse_id,
    NULLIF(btrim(notes), ''),
    private.current_request_user_id(),
    private.current_request_email(),
    statement_timestamp(),
    private.current_request_user_id(),
    private.current_request_email()
  )
  RETURNING id INTO delivery_id;

  FOR line_item IN SELECT value FROM jsonb_array_elements(lines)
  LOOP
    delivery_line_number := delivery_line_number + 1;
    shipped_quantity := NULLIF(
      COALESCE(line_item->>'shippedQuantity', line_item->>'shipped_quantity'),
      ''
    )::numeric;
    storage_location_id := NULLIF(
      COALESCE(line_item->>'storageLocationId', line_item->>'storage_location_id'),
      ''
    )::uuid;
    line_notes := NULLIF(btrim(COALESCE(line_item->>'notes', '')), '');

    IF shipped_quantity IS NULL OR shipped_quantity <= 0 THEN
      DELETE FROM api.sales_deliveries WHERE id = delivery_id;
      RETURN private.inventory_error_response('23514', 'Shipped quantity must be greater than zero');
    END IF;

    SELECT * INTO order_line
    FROM api.sales_order_lines line
    WHERE line.id = NULLIF(
      COALESCE(line_item->>'salesOrderLineId', line_item->>'sales_order_line_id'),
      ''
    )::uuid
      AND line.sales_order_id = target_order.id;

    IF NOT FOUND THEN
      DELETE FROM api.sales_deliveries WHERE id = delivery_id;
      RETURN private.inventory_error_response('23514', 'Sales order line is invalid');
    END IF;

    PERFORM private.validate_inventory_product(order_line.product_id);
    PERFORM private.validate_inventory_location(warehouse_id, storage_location_id);

    SELECT progress.remaining_quantity
    INTO remaining_quantity
    FROM api.sales_order_line_delivery_view progress
    WHERE progress.sales_order_line_id = order_line.id;

    IF shipped_quantity > remaining_quantity THEN
      PERFORM private.write_audit_log(
        'salesDelivery.overDeliveryBlocked',
        'salesDelivery',
        'blocked',
        'Over-delivery was blocked.',
        target_order.id::text,
        jsonb_build_object(
          'sales_order_id', target_order.id,
          'sales_order_line_id', order_line.id,
          'requested_quantity', shipped_quantity,
          'remaining_quantity', remaining_quantity
        )
      );
      DELETE FROM api.sales_deliveries WHERE id = delivery_id;
      RETURN private.inventory_error_response('23514', 'Shipped quantity exceeds remaining order quantity');
    END IF;

    current_quantity := private.current_inventory_quantity(order_line.product_id, warehouse_id, storage_location_id);

    IF current_quantity - shipped_quantity < 0 AND NOT private.inventory_allow_negative_stock() THEN
      PERFORM private.write_audit_log(
        'salesDelivery.negativeStockBlocked',
        'salesDelivery',
        'blocked',
        'Negative stock was blocked while posting a sales delivery.',
        target_order.id::text,
        jsonb_build_object(
          'sales_order_id', target_order.id,
          'sales_order_line_id', order_line.id,
          'product_id', order_line.product_id,
          'warehouse_id', warehouse_id,
          'storage_location_id', storage_location_id,
          'requested_quantity', shipped_quantity,
          'available_quantity', current_quantity
        )
      );
      DELETE FROM api.sales_deliveries WHERE id = delivery_id;
      RETURN private.inventory_error_response('23514', 'Negative stock is not allowed');
    END IF;

    movement_id := private.insert_inventory_movement(
      'sales_shipment',
      order_line.product_id,
      warehouse_id,
      storage_location_id,
      NULL,
      NULL,
      shipped_quantity,
      order_line.unit_lookup_value_id,
      'Sales delivery shipment',
      'sales_delivery',
      delivery_id::text
    );

    PERFORM private.apply_inventory_balance_delta(
      order_line.product_id,
      warehouse_id,
      storage_location_id,
      -shipped_quantity
    );

    INSERT INTO api.sales_delivery_lines (
      sales_delivery_id,
      sales_order_line_id,
      line_number,
      product_id,
      shipped_quantity,
      unit_lookup_value_id,
      storage_location_id,
      notes,
      inventory_movement_id
    )
    VALUES (
      delivery_id,
      order_line.id,
      delivery_line_number,
      order_line.product_id,
      shipped_quantity,
      order_line.unit_lookup_value_id,
      storage_location_id,
      line_notes,
      movement_id
    );
  END LOOP;

  SELECT bool_and(progress.remaining_quantity = 0)
  INTO all_delivered
  FROM api.sales_order_line_delivery_view progress
  WHERE progress.sales_order_id = target_order.id;

  IF COALESCE(all_delivered, false) THEN
    UPDATE api.sales_orders sales_order
    SET status_lookup_value_id = private.sales_order_status_id('closed')
    WHERE sales_order.id = target_order.id;
  END IF;

  PERFORM private.write_audit_log(
    'salesDelivery.posted',
    'salesDelivery',
    'success',
    'Sales delivery was posted.',
    delivery_id::text,
    jsonb_build_object(
      'delivery_number', (SELECT delivery_number FROM api.sales_deliveries WHERE id = delivery_id),
      'sales_order_id', target_order.id,
      'sales_order_number', target_order.order_number,
      'customer_id', target_order.customer_id,
      'warehouse_id', warehouse_id,
      'line_count', delivery_line_number
    )
  );

  PERFORM private.write_audit_log(
    'salesDelivery.inventoryPosted',
    'salesDelivery',
    'success',
    'Sales delivery inventory movements were posted.',
    delivery_id::text,
    jsonb_build_object(
      'sales_order_id', target_order.id,
      'warehouse_id', warehouse_id,
      'line_count', delivery_line_number
    )
  );

  RETURN private.sales_delivery_json(delivery_id);
END;
$$;

CREATE OR REPLACE FUNCTION api.cancel_sales_delivery(sales_delivery_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  target_delivery api.sales_deliveries%ROWTYPE;
  target_status text;
  delivery_line api.sales_delivery_lines%ROWTYPE;
  movement_id uuid;
BEGIN
  SELECT * INTO target_delivery
  FROM api.sales_deliveries delivery
  WHERE delivery.id = cancel_sales_delivery.sales_delivery_id;

  IF NOT FOUND THEN
    RETURN private.inventory_error_response('P0002', 'Sales delivery not found', '404');
  END IF;

  target_status := private.sales_delivery_status_code(target_delivery.status_lookup_value_id);

  IF target_status <> 'posted' THEN
    RETURN private.inventory_error_response('23514', 'Only posted sales deliveries can be cancelled');
  END IF;

  FOR delivery_line IN
    SELECT * FROM api.sales_delivery_lines line
    WHERE line.sales_delivery_id = target_delivery.id
    ORDER BY line.line_number
  LOOP
    movement_id := private.insert_inventory_movement(
      'sales_shipment_reversal',
      delivery_line.product_id,
      NULL,
      NULL,
      target_delivery.warehouse_id,
      delivery_line.storage_location_id,
      delivery_line.shipped_quantity,
      delivery_line.unit_lookup_value_id,
      'Sales delivery cancellation',
      'sales_delivery',
      target_delivery.id::text
    );

    PERFORM private.apply_inventory_balance_delta(
      delivery_line.product_id,
      target_delivery.warehouse_id,
      delivery_line.storage_location_id,
      delivery_line.shipped_quantity
    );
  END LOOP;

  UPDATE api.sales_deliveries delivery
  SET status_lookup_value_id = private.sales_delivery_status_id('cancelled'),
      cancelled_by_user_id = private.current_request_user_id(),
      cancelled_by_email = private.current_request_email(),
      cancelled_at = statement_timestamp()
  WHERE delivery.id = target_delivery.id;

  UPDATE api.sales_orders sales_order
  SET status_lookup_value_id = private.sales_order_status_id('confirmed')
  WHERE sales_order.id = target_delivery.sales_order_id
    AND private.sales_order_status_code(sales_order.status_lookup_value_id) = 'closed';

  PERFORM private.write_audit_log(
    'salesDelivery.cancelled',
    'salesDelivery',
    'success',
    'Sales delivery was cancelled and inventory was reversed.',
    target_delivery.id::text,
    jsonb_build_object(
      'delivery_number', target_delivery.delivery_number,
      'sales_order_id', target_delivery.sales_order_id,
      'customer_id', target_delivery.customer_id,
      'warehouse_id', target_delivery.warehouse_id
    )
  );

  RETURN private.sales_delivery_json(target_delivery.id);
END;
$$;

REVOKE ALL ON TABLE api.sales_deliveries FROM PUBLIC;
REVOKE ALL ON TABLE api.sales_delivery_lines FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sales_delivery_status_id(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sales_delivery_status_code(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.next_sales_delivery_number() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.validate_sales_delivery_header() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.validate_sales_delivery_line() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sales_delivery_json(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.post_sales_delivery(uuid, date, uuid, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.cancel_sales_delivery(uuid) FROM PUBLIC;

GRANT USAGE ON SCHEMA api TO erp_admin, erp_manager, erp_warehouse, erp_sales, erp_accountant;
GRANT SELECT ON api.customers, api.products, api.lookup_types, api.lookup_values, api.warehouses, api.storage_locations
TO erp_admin, erp_manager, erp_warehouse, erp_sales, erp_accountant;
GRANT SELECT ON api.sales_orders, api.sales_order_lines, api.sales_order_view, api.sales_order_line_view
TO erp_admin, erp_manager, erp_warehouse, erp_sales, erp_accountant;
GRANT SELECT ON api.sales_deliveries, api.sales_delivery_lines, api.sales_delivery_view, api.sales_delivery_line_view
TO erp_admin, erp_manager, erp_warehouse, erp_sales, erp_accountant;
GRANT SELECT ON api.sales_order_delivery_view, api.sales_order_line_delivery_view
TO erp_admin, erp_manager, erp_warehouse, erp_sales, erp_accountant;
GRANT SELECT ON api.inventory_balances, api.inventory_movements, api.inventory_balance_view, api.inventory_movement_view
TO erp_admin, erp_manager, erp_warehouse, erp_accountant;
GRANT EXECUTE ON FUNCTION api.post_sales_delivery(uuid, date, uuid, text, jsonb)
TO erp_admin, erp_manager, erp_warehouse;
GRANT EXECUTE ON FUNCTION api.cancel_sales_delivery(uuid)
TO erp_admin, erp_manager;

ALTER TABLE api.sales_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.sales_delivery_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.sales_deliveries FORCE ROW LEVEL SECURITY;
ALTER TABLE api.sales_delivery_lines FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sales_deliveries_select_policy ON api.sales_deliveries;
DROP POLICY IF EXISTS sales_delivery_lines_select_policy ON api.sales_delivery_lines;

CREATE POLICY sales_deliveries_select_policy
ON api.sales_deliveries
FOR SELECT
TO erp_admin, erp_manager, erp_warehouse, erp_sales, erp_accountant
USING (true);

CREATE POLICY sales_delivery_lines_select_policy
ON api.sales_delivery_lines
FOR SELECT
TO erp_admin, erp_manager, erp_warehouse, erp_sales, erp_accountant
USING (true);

GRANT SELECT ON api.customers TO erp_warehouse;
DROP POLICY IF EXISTS customers_warehouse_select_policy ON api.customers;
CREATE POLICY customers_warehouse_select_policy
ON api.customers
FOR SELECT
TO erp_warehouse
USING (true);

GRANT SELECT ON api.storage_locations TO erp_sales;
DROP POLICY IF EXISTS storage_locations_sales_select_policy ON api.storage_locations;
CREATE POLICY storage_locations_sales_select_policy
ON api.storage_locations
FOR SELECT
TO erp_sales
USING (true);

COMMIT;
