BEGIN;

CREATE SEQUENCE IF NOT EXISTS private.goods_receipt_number_seq;

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
  'documents.goodsReceiptPrefix',
  '"GR"',
  'string',
  'documents',
  'پیشوند رسید خرید',
  'پیشوند شماره سند رسید خرید',
  true,
  true
)
ON CONFLICT (setting_key) DO NOTHING;

WITH upserted_type AS (
  INSERT INTO api.lookup_types (code, name, description, system, active)
  VALUES ('goods_receipt_status', 'وضعیت رسید خرید', NULL, true, true)
  ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name,
      active = true
  RETURNING id
),
status_type AS (
  SELECT id FROM upserted_type
  UNION
  SELECT id FROM api.lookup_types WHERE code = 'goods_receipt_status'
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
SELECT status_type.id, status.code, status.label, status.sort_order, '{}'::jsonb, true, true
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
  sort_order,
  metadata,
  system,
  active
)
SELECT movement_type.id, 'purchase_receipt', 'رسید خرید', 60, '{}'::jsonb, true, true
FROM movement_type
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
    'purchase_receipt'
  )
);

CREATE TABLE IF NOT EXISTS api.goods_receipts (
  id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
  receipt_number text NOT NULL UNIQUE,
  purchase_order_id uuid NOT NULL REFERENCES api.purchase_orders(id) ON DELETE RESTRICT,
  supplier_id uuid NOT NULL REFERENCES api.suppliers(id) ON DELETE RESTRICT,
  status_lookup_value_id uuid NOT NULL REFERENCES api.lookup_values(id) ON DELETE RESTRICT,
  receipt_date date NOT NULL DEFAULT current_date,
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
  CONSTRAINT goods_receipts_number_not_blank CHECK (length(btrim(receipt_number)) > 0)
);

CREATE INDEX IF NOT EXISTS goods_receipts_number_idx ON api.goods_receipts (receipt_number);
CREATE INDEX IF NOT EXISTS goods_receipts_purchase_order_idx ON api.goods_receipts (purchase_order_id);
CREATE INDEX IF NOT EXISTS goods_receipts_supplier_idx ON api.goods_receipts (supplier_id);
CREATE INDEX IF NOT EXISTS goods_receipts_status_idx ON api.goods_receipts (status_lookup_value_id);
CREATE INDEX IF NOT EXISTS goods_receipts_receipt_date_idx ON api.goods_receipts (receipt_date DESC, id DESC);
CREATE INDEX IF NOT EXISTS goods_receipts_warehouse_idx ON api.goods_receipts (warehouse_id);
CREATE INDEX IF NOT EXISTS goods_receipts_created_by_idx ON api.goods_receipts (created_by_user_id);

DROP TRIGGER IF EXISTS goods_receipts_set_updated_at ON api.goods_receipts;
CREATE TRIGGER goods_receipts_set_updated_at
BEFORE UPDATE ON api.goods_receipts
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

CREATE TABLE IF NOT EXISTS api.goods_receipt_lines (
  id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
  goods_receipt_id uuid NOT NULL REFERENCES api.goods_receipts(id) ON DELETE CASCADE,
  purchase_order_line_id uuid NOT NULL REFERENCES api.purchase_order_lines(id) ON DELETE RESTRICT,
  line_number integer NOT NULL,
  product_id uuid NOT NULL REFERENCES api.products(id) ON DELETE RESTRICT,
  received_quantity numeric(18,4) NOT NULL,
  unit_lookup_value_id uuid NOT NULL REFERENCES api.lookup_values(id) ON DELETE RESTRICT,
  storage_location_id uuid NULL REFERENCES api.storage_locations(id) ON DELETE RESTRICT,
  notes text NULL,
  inventory_movement_id uuid NULL REFERENCES api.inventory_movements(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT goods_receipt_lines_unique_number UNIQUE (goods_receipt_id, line_number),
  CONSTRAINT goods_receipt_lines_quantity_positive CHECK (received_quantity > 0)
);

CREATE INDEX IF NOT EXISTS goods_receipt_lines_receipt_idx ON api.goods_receipt_lines (goods_receipt_id);
CREATE INDEX IF NOT EXISTS goods_receipt_lines_purchase_order_line_idx ON api.goods_receipt_lines (purchase_order_line_id);
CREATE INDEX IF NOT EXISTS goods_receipt_lines_product_idx ON api.goods_receipt_lines (product_id);
CREATE INDEX IF NOT EXISTS goods_receipt_lines_storage_location_idx ON api.goods_receipt_lines (storage_location_id);
CREATE INDEX IF NOT EXISTS goods_receipt_lines_inventory_movement_idx ON api.goods_receipt_lines (inventory_movement_id);

DROP TRIGGER IF EXISTS goods_receipt_lines_set_updated_at ON api.goods_receipt_lines;
CREATE TRIGGER goods_receipt_lines_set_updated_at
BEFORE UPDATE ON api.goods_receipt_lines
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

CREATE OR REPLACE FUNCTION private.goods_receipt_status_id(status_code text)
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT value.id
  FROM api.lookup_values value
  JOIN api.lookup_types type ON type.id = value.lookup_type_id
  WHERE type.code = 'goods_receipt_status'
    AND value.code = status_code
    AND value.active = true
    AND type.active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.goods_receipt_status_code(status_lookup_value_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT value.code
  FROM api.lookup_values value
  JOIN api.lookup_types type ON type.id = value.lookup_type_id
  WHERE value.id = status_lookup_value_id
    AND type.code = 'goods_receipt_status'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.next_goods_receipt_number()
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
  WHERE setting.setting_key = 'documents.goodsReceiptPrefix'
    AND setting.active = true
  LIMIT 1;

  prefix := COALESCE(NULLIF(btrim(prefix), ''), 'GR');
  sequence_value := nextval('private.goods_receipt_number_seq');

  RETURN prefix || '-' || to_char(statement_timestamp(), 'YYYY') || '-' || lpad(sequence_value::text, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION private.validate_goods_receipt_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  status_code text;
  order_supplier_id uuid;
BEGIN
  IF NOT private.lookup_value_has_type(NEW.status_lookup_value_id, 'goods_receipt_status', true) THEN
    RAISE EXCEPTION 'Goods receipt status is invalid' USING ERRCODE = '23514';
  END IF;

  status_code := private.goods_receipt_status_code(NEW.status_lookup_value_id);

  SELECT purchase_order.supplier_id
  INTO order_supplier_id
  FROM api.purchase_orders purchase_order
  WHERE purchase_order.id = NEW.purchase_order_id;

  IF order_supplier_id IS NULL THEN
    RAISE EXCEPTION 'Purchase order is invalid' USING ERRCODE = '23514';
  END IF;

  IF order_supplier_id <> NEW.supplier_id THEN
    RAISE EXCEPTION 'Goods receipt supplier must match purchase order supplier' USING ERRCODE = '23514';
  END IF;

  PERFORM private.validate_inventory_warehouse(NEW.warehouse_id);

  IF status_code = 'posted'
    AND (NEW.posted_by_user_id IS NULL OR NEW.posted_by_email IS NULL OR NEW.posted_at IS NULL) THEN
    RAISE EXCEPTION 'Posted goods receipt requires posted metadata' USING ERRCODE = '23514';
  END IF;

  IF status_code = 'cancelled'
    AND (NEW.cancelled_by_user_id IS NULL OR NEW.cancelled_by_email IS NULL OR NEW.cancelled_at IS NULL) THEN
    RAISE EXCEPTION 'Cancelled goods receipt requires cancellation metadata' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.validate_goods_receipt_line_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  receipt_warehouse_id uuid;
  order_line_product_id uuid;
  order_line_unit_id uuid;
BEGIN
  SELECT receipt.warehouse_id
  INTO receipt_warehouse_id
  FROM api.goods_receipts receipt
  WHERE receipt.id = NEW.goods_receipt_id;

  IF receipt_warehouse_id IS NULL THEN
    RAISE EXCEPTION 'Goods receipt is invalid' USING ERRCODE = '23514';
  END IF;

  SELECT line.product_id, line.unit_lookup_value_id
  INTO order_line_product_id, order_line_unit_id
  FROM api.purchase_order_lines line
  WHERE line.id = NEW.purchase_order_line_id;

  IF order_line_product_id IS NULL THEN
    RAISE EXCEPTION 'Purchase order line is invalid' USING ERRCODE = '23514';
  END IF;

  IF NEW.product_id <> order_line_product_id THEN
    RAISE EXCEPTION 'Receipt line product must match purchase order line product' USING ERRCODE = '23514';
  END IF;

  IF NEW.unit_lookup_value_id <> order_line_unit_id THEN
    RAISE EXCEPTION 'Receipt line unit must match purchase order line unit' USING ERRCODE = '23514';
  END IF;

  PERFORM private.validate_inventory_product(NEW.product_id);
  PERFORM private.validate_inventory_location(receipt_warehouse_id, NEW.storage_location_id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS goods_receipts_validate ON api.goods_receipts;
CREATE TRIGGER goods_receipts_validate
BEFORE INSERT OR UPDATE ON api.goods_receipts
FOR EACH ROW
EXECUTE FUNCTION private.validate_goods_receipt_row();

DROP TRIGGER IF EXISTS goods_receipt_lines_validate ON api.goods_receipt_lines;
CREATE TRIGGER goods_receipt_lines_validate
BEFORE INSERT OR UPDATE ON api.goods_receipt_lines
FOR EACH ROW
EXECUTE FUNCTION private.validate_goods_receipt_line_row();

CREATE OR REPLACE VIEW api.purchase_order_line_receiving_view
WITH (security_invoker = true)
AS
SELECT
  line.id AS purchase_order_line_id,
  line.purchase_order_id,
  line.product_id,
  product.sku AS product_sku,
  product.name AS product_name,
  line.quantity AS ordered_quantity,
  COALESCE(received.received_quantity, 0)::numeric(18,4) AS received_quantity,
  GREATEST(line.quantity - COALESCE(received.received_quantity, 0), 0)::numeric(18,4) AS remaining_quantity,
  line.unit_lookup_value_id,
  unit_value.code AS unit_code,
  unit_value.label AS unit_label
FROM api.purchase_order_lines line
JOIN api.products product ON product.id = line.product_id
JOIN api.lookup_values unit_value ON unit_value.id = line.unit_lookup_value_id
LEFT JOIN (
  SELECT
    receipt_line.purchase_order_line_id,
    sum(receipt_line.received_quantity) AS received_quantity
  FROM api.goods_receipt_lines receipt_line
  JOIN api.goods_receipts receipt ON receipt.id = receipt_line.goods_receipt_id
  JOIN api.lookup_values receipt_status ON receipt_status.id = receipt.status_lookup_value_id
  JOIN api.lookup_types receipt_status_type ON receipt_status_type.id = receipt_status.lookup_type_id
  WHERE receipt_status_type.code = 'goods_receipt_status'
    AND receipt_status.code = 'posted'
  GROUP BY receipt_line.purchase_order_line_id
) received ON received.purchase_order_line_id = line.id;

CREATE OR REPLACE VIEW api.purchase_order_receiving_view
WITH (security_invoker = true)
AS
SELECT
  purchase_order.id AS purchase_order_id,
  purchase_order.order_number,
  purchase_order.supplier_id,
  supplier.code AS supplier_code,
  supplier.name AS supplier_name,
  purchase_order.status_lookup_value_id,
  status_value.code AS status_code,
  count(line_progress.purchase_order_line_id)::integer AS line_count,
  COALESCE(sum(line_progress.ordered_quantity), 0)::numeric(18,4) AS ordered_quantity,
  COALESCE(sum(line_progress.received_quantity), 0)::numeric(18,4) AS received_quantity,
  COALESCE(sum(line_progress.remaining_quantity), 0)::numeric(18,4) AS remaining_quantity,
  bool_and(line_progress.remaining_quantity <= 0) AS fully_received
FROM api.purchase_orders purchase_order
JOIN api.suppliers supplier ON supplier.id = purchase_order.supplier_id
JOIN api.lookup_values status_value ON status_value.id = purchase_order.status_lookup_value_id
LEFT JOIN api.purchase_order_line_receiving_view line_progress
  ON line_progress.purchase_order_id = purchase_order.id
GROUP BY
  purchase_order.id,
  purchase_order.order_number,
  purchase_order.supplier_id,
  supplier.code,
  supplier.name,
  purchase_order.status_lookup_value_id,
  status_value.code;

CREATE OR REPLACE VIEW api.goods_receipt_view
WITH (security_invoker = true)
AS
SELECT
  receipt.id,
  receipt.receipt_number,
  receipt.purchase_order_id,
  purchase_order.order_number AS purchase_order_number,
  receipt.supplier_id,
  supplier.code AS supplier_code,
  supplier.name AS supplier_name,
  status_value.code AS status_code,
  status_value.label AS status_label,
  receipt.receipt_date,
  receipt.warehouse_id,
  warehouse.code AS warehouse_code,
  warehouse.name AS warehouse_name,
  receipt.notes,
  receipt.posted_by_email,
  receipt.posted_at,
  receipt.cancelled_by_email,
  receipt.cancelled_at,
  receipt.created_by_email,
  receipt.created_at,
  receipt.updated_at
FROM api.goods_receipts receipt
JOIN api.purchase_orders purchase_order ON purchase_order.id = receipt.purchase_order_id
JOIN api.suppliers supplier ON supplier.id = receipt.supplier_id
JOIN api.lookup_values status_value ON status_value.id = receipt.status_lookup_value_id
JOIN api.warehouses warehouse ON warehouse.id = receipt.warehouse_id;

CREATE OR REPLACE VIEW api.goods_receipt_line_view
WITH (security_invoker = true)
AS
SELECT
  line.id,
  line.goods_receipt_id,
  line.line_number,
  line.purchase_order_line_id,
  line.product_id,
  product.sku AS product_sku,
  product.name AS product_name,
  line.received_quantity,
  unit_value.code AS unit_code,
  unit_value.label AS unit_label,
  line.storage_location_id,
  location.code AS storage_location_code,
  location.name AS storage_location_name,
  line.inventory_movement_id,
  movement.movement_number AS inventory_movement_number,
  line.notes
FROM api.goods_receipt_lines line
JOIN api.products product ON product.id = line.product_id
JOIN api.lookup_values unit_value ON unit_value.id = line.unit_lookup_value_id
LEFT JOIN api.storage_locations location ON location.id = line.storage_location_id
LEFT JOIN api.inventory_movements movement ON movement.id = line.inventory_movement_id;

CREATE OR REPLACE FUNCTION private.goods_receipt_json(target_goods_receipt_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT jsonb_build_object(
    'id', receipt.id,
    'receiptNumber', receipt.receipt_number,
    'purchaseOrderId', receipt.purchase_order_id,
    'purchaseOrderNumber', receipt.purchase_order_number,
    'supplierId', receipt.supplier_id,
    'supplierCode', receipt.supplier_code,
    'supplierName', receipt.supplier_name,
    'statusCode', receipt.status_code,
    'statusLabel', receipt.status_label,
    'receiptDate', receipt.receipt_date,
    'warehouseId', receipt.warehouse_id,
    'warehouseCode', receipt.warehouse_code,
    'warehouseName', receipt.warehouse_name,
    'notes', receipt.notes,
    'postedByEmail', receipt.posted_by_email,
    'postedAt', receipt.posted_at,
    'cancelledByEmail', receipt.cancelled_by_email,
    'cancelledAt', receipt.cancelled_at,
    'createdByEmail', receipt.created_by_email,
    'createdAt', receipt.created_at,
    'updatedAt', receipt.updated_at
  )
  FROM api.goods_receipt_view receipt
  WHERE receipt.id = target_goods_receipt_id;
$$;

CREATE OR REPLACE FUNCTION private.write_goods_receipt_audit(
  audit_action text,
  target_goods_receipt_id uuid,
  audit_summary text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  receipt api.goods_receipt_view%ROWTYPE;
  line_count integer;
BEGIN
  SELECT * INTO receipt FROM api.goods_receipt_view WHERE id = target_goods_receipt_id;
  SELECT count(*) INTO line_count FROM api.goods_receipt_lines WHERE goods_receipt_id = target_goods_receipt_id;

  PERFORM private.write_audit_log(
    audit_action,
    'goods_receipt',
    'success',
    audit_summary,
    target_goods_receipt_id::text,
    jsonb_build_object(
      'receiptNumber', receipt.receipt_number,
      'purchaseOrderId', receipt.purchase_order_id,
      'purchaseOrderNumber', receipt.purchase_order_number,
      'supplierId', receipt.supplier_id,
      'warehouseId', receipt.warehouse_id,
      'lineCount', line_count
    )
  );
END;
$$;

DROP FUNCTION IF EXISTS private.post_goods_receipt_lines(uuid, uuid, uuid, jsonb);
CREATE OR REPLACE FUNCTION private.post_goods_receipt_lines(
  target_goods_receipt_id uuid,
  target_purchase_order_id uuid,
  target_warehouse_id uuid,
  line_payload jsonb
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  line_record record;
  parsed_purchase_order_line_id uuid;
  parsed_received_quantity numeric;
  parsed_storage_location_id uuid;
  parsed_notes text;
  order_line api.purchase_order_lines%ROWTYPE;
  remaining_quantity numeric;
  inserted_line_id uuid;
  movement_id uuid;
  inserted_count integer := 0;
BEGIN
  IF jsonb_typeof(COALESCE(line_payload, 'null'::jsonb)) <> 'array' THEN
    RETURN 'Goods receipt lines must be an array';
  END IF;

  FOR line_record IN
    SELECT
      NULLIF(COALESCE(value->>'purchase_order_line_id', value->>'purchaseOrderLineId'), '')::uuid AS purchase_order_line_id,
      sum(NULLIF(COALESCE(value->>'received_quantity', value->>'receivedQuantity'), '')::numeric) AS received_quantity
    FROM jsonb_array_elements(line_payload) AS line(value)
    GROUP BY NULLIF(COALESCE(value->>'purchase_order_line_id', value->>'purchaseOrderLineId'), '')::uuid
  LOOP
    IF line_record.received_quantity IS NULL OR line_record.received_quantity <= 0 THEN
      RETURN 'Received quantity must be greater than zero';
    END IF;

    SELECT progress.remaining_quantity
    INTO remaining_quantity
    FROM api.purchase_order_line_receiving_view progress
    WHERE progress.purchase_order_line_id = line_record.purchase_order_line_id
      AND progress.purchase_order_id = target_purchase_order_id;

    IF remaining_quantity IS NULL THEN
      RETURN 'Purchase order line is invalid for this receipt';
    END IF;

    IF line_record.received_quantity > remaining_quantity THEN
      PERFORM private.write_audit_log(
        'goodsReceipt.overReceiptBlocked',
        'goods_receipt',
        'blocked',
        'Goods receipt over-receipt was blocked',
        target_goods_receipt_id::text,
        jsonb_build_object(
          'purchaseOrderId', target_purchase_order_id,
          'purchaseOrderLineId', line_record.purchase_order_line_id,
          'receivedQuantity', line_record.received_quantity,
          'remainingQuantity', remaining_quantity
        )
      );

      RETURN 'Received quantity exceeds remaining purchase order quantity';
    END IF;
  END LOOP;

  FOR line_record IN
    SELECT value, ordinality
    FROM jsonb_array_elements(line_payload) WITH ORDINALITY AS line(value, ordinality)
  LOOP
    parsed_purchase_order_line_id := NULLIF(COALESCE(line_record.value->>'purchase_order_line_id', line_record.value->>'purchaseOrderLineId'), '')::uuid;
    parsed_received_quantity := NULLIF(COALESCE(line_record.value->>'received_quantity', line_record.value->>'receivedQuantity'), '')::numeric;
    parsed_storage_location_id := NULLIF(COALESCE(line_record.value->>'storage_location_id', line_record.value->>'storageLocationId'), '')::uuid;
    parsed_notes := NULLIF(btrim(COALESCE(line_record.value->>'notes', '')), '');

    IF parsed_received_quantity IS NULL OR parsed_received_quantity <= 0 THEN
      RETURN 'Received quantity must be greater than zero';
    END IF;

    SELECT *
    INTO order_line
    FROM api.purchase_order_lines line
    WHERE line.id = parsed_purchase_order_line_id
      AND line.purchase_order_id = target_purchase_order_id;

    IF order_line.id IS NULL THEN
      RAISE EXCEPTION 'Purchase order line is invalid for this receipt' USING ERRCODE = '23514';
    END IF;

    SELECT progress.remaining_quantity
    INTO remaining_quantity
    FROM api.purchase_order_line_receiving_view progress
    WHERE progress.purchase_order_line_id = parsed_purchase_order_line_id;

    IF parsed_received_quantity > COALESCE(remaining_quantity, 0) THEN
      RETURN 'Received quantity exceeds remaining purchase order quantity';
    END IF;

    PERFORM private.validate_inventory_product(order_line.product_id);
    PERFORM private.validate_inventory_location(target_warehouse_id, parsed_storage_location_id);

    movement_id := private.insert_inventory_movement(
      'purchase_receipt',
      order_line.product_id,
      NULL,
      NULL,
      target_warehouse_id,
      parsed_storage_location_id,
      parsed_received_quantity,
      order_line.unit_lookup_value_id,
      'Goods receipt posting',
      'goods_receipt',
      target_goods_receipt_id::text
    );

    PERFORM private.apply_inventory_balance_delta(
      order_line.product_id,
      target_warehouse_id,
      parsed_storage_location_id,
      parsed_received_quantity
    );

    INSERT INTO api.goods_receipt_lines (
      goods_receipt_id,
      purchase_order_line_id,
      line_number,
      product_id,
      received_quantity,
      unit_lookup_value_id,
      storage_location_id,
      notes,
      inventory_movement_id
    )
    VALUES (
      target_goods_receipt_id,
      parsed_purchase_order_line_id,
      line_record.ordinality::integer,
      order_line.product_id,
      parsed_received_quantity,
      order_line.unit_lookup_value_id,
      parsed_storage_location_id,
      parsed_notes,
      movement_id
    )
    RETURNING id INTO inserted_line_id;

    inserted_count := inserted_count + 1;
  END LOOP;

  IF inserted_count = 0 THEN
    RETURN 'Goods receipt must contain at least one line';
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION api.post_goods_receipt(
  purchase_order_id uuid,
  receipt_date date DEFAULT current_date,
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
  purchase_order api.purchase_orders%ROWTYPE;
  purchase_order_status text;
  receipt_id uuid;
  posted_status_id uuid;
  closed_status_id uuid;
  all_received boolean;
  line_error text;
BEGIN
  IF warehouse_id IS NULL THEN
    RAISE EXCEPTION 'Warehouse is required' USING ERRCODE = '23514';
  END IF;

  SELECT *
  INTO purchase_order
  FROM api.purchase_orders po
  WHERE po.id = post_goods_receipt.purchase_order_id;

  IF purchase_order.id IS NULL THEN
    RAISE EXCEPTION 'Purchase order not found' USING ERRCODE = '02000';
  END IF;

  purchase_order_status := private.purchase_order_status_code(purchase_order.status_lookup_value_id);

  IF purchase_order_status <> 'approved' THEN
    RAISE EXCEPTION 'Goods can only be received against approved purchase orders' USING ERRCODE = '23514';
  END IF;

  PERFORM private.validate_inventory_warehouse(warehouse_id);
  posted_status_id := private.goods_receipt_status_id('posted');

  INSERT INTO api.goods_receipts (
    receipt_number,
    purchase_order_id,
    supplier_id,
    status_lookup_value_id,
    receipt_date,
    warehouse_id,
    notes,
    posted_by_user_id,
    posted_by_email,
    posted_at,
    created_by_user_id,
    created_by_email
  )
  VALUES (
    private.next_goods_receipt_number(),
    purchase_order.id,
    purchase_order.supplier_id,
    posted_status_id,
    COALESCE(receipt_date, current_date),
    warehouse_id,
    NULLIF(btrim(COALESCE(notes, '')), ''),
    private.current_request_user_id(),
    private.current_request_email(),
    statement_timestamp(),
    private.current_request_user_id(),
    private.current_request_email()
  )
  RETURNING id INTO receipt_id;

  line_error := private.post_goods_receipt_lines(receipt_id, purchase_order.id, warehouse_id, lines);

  IF line_error IS NOT NULL THEN
    DELETE FROM api.goods_receipts receipt
    WHERE receipt.id = receipt_id;

    RETURN private.inventory_error_response('23514', line_error);
  END IF;

  SELECT bool_and(progress.remaining_quantity <= 0)
  INTO all_received
  FROM api.purchase_order_line_receiving_view progress
  WHERE progress.purchase_order_id = purchase_order.id;

  IF COALESCE(all_received, false) THEN
    closed_status_id := private.purchase_order_status_id('closed');
    UPDATE api.purchase_orders po
    SET status_lookup_value_id = closed_status_id
    WHERE po.id = purchase_order.id;
  END IF;

  PERFORM private.write_goods_receipt_audit('goodsReceipt.posted', receipt_id, 'Goods receipt posted');
  PERFORM private.write_goods_receipt_audit('goodsReceipt.inventoryPosted', receipt_id, 'Goods receipt inventory posted');

  RETURN private.goods_receipt_json(receipt_id);
END;
$$;

CREATE OR REPLACE FUNCTION api.cancel_goods_receipt(goods_receipt_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  receipt api.goods_receipts%ROWTYPE;
  line_record record;
  status_code text;
  movement_id uuid;
BEGIN
  SELECT *
  INTO receipt
  FROM api.goods_receipts gr
  WHERE gr.id = cancel_goods_receipt.goods_receipt_id;

  IF receipt.id IS NULL THEN
    RAISE EXCEPTION 'Goods receipt not found' USING ERRCODE = '02000';
  END IF;

  status_code := private.goods_receipt_status_code(receipt.status_lookup_value_id);

  IF status_code <> 'posted' THEN
    RAISE EXCEPTION 'Only posted goods receipts can be cancelled' USING ERRCODE = '23514';
  END IF;

  FOR line_record IN
    SELECT *
    FROM api.goods_receipt_lines line
    WHERE line.goods_receipt_id = receipt.id
    ORDER BY line.line_number
  LOOP
    movement_id := private.insert_inventory_movement(
      'adjustment_out',
      line_record.product_id,
      receipt.warehouse_id,
      line_record.storage_location_id,
      NULL,
      NULL,
      line_record.received_quantity,
      line_record.unit_lookup_value_id,
      'Goods receipt cancellation',
      'goods_receipt_cancellation',
      receipt.id::text
    );

    PERFORM private.apply_inventory_balance_delta(
      line_record.product_id,
      receipt.warehouse_id,
      line_record.storage_location_id,
      -line_record.received_quantity
    );
  END LOOP;

  UPDATE api.goods_receipts gr
  SET status_lookup_value_id = private.goods_receipt_status_id('cancelled'),
      cancelled_by_user_id = private.current_request_user_id(),
      cancelled_by_email = private.current_request_email(),
      cancelled_at = statement_timestamp()
  WHERE gr.id = receipt.id;

  PERFORM private.write_goods_receipt_audit('goodsReceipt.cancelled', receipt.id, 'Goods receipt cancelled');

  RETURN private.goods_receipt_json(receipt.id);
END;
$$;

REVOKE ALL ON api.goods_receipts FROM PUBLIC;
REVOKE ALL ON api.goods_receipt_lines FROM PUBLIC;
REVOKE ALL ON api.purchase_order_receiving_view FROM PUBLIC;
REVOKE ALL ON api.purchase_order_line_receiving_view FROM PUBLIC;
REVOKE ALL ON api.goods_receipt_view FROM PUBLIC;
REVOKE ALL ON api.goods_receipt_line_view FROM PUBLIC;
REVOKE ALL ON FUNCTION private.goods_receipt_status_id(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.goods_receipt_status_code(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.next_goods_receipt_number() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.validate_goods_receipt_row() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.validate_goods_receipt_line_row() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.goods_receipt_json(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.write_goods_receipt_audit(text, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.post_goods_receipt_lines(uuid, uuid, uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.post_goods_receipt(uuid, date, uuid, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.cancel_goods_receipt(uuid) FROM PUBLIC;

GRANT USAGE ON SCHEMA api TO erp_admin, erp_manager, erp_accountant, erp_warehouse;
GRANT SELECT ON api.purchase_orders, api.purchase_order_lines, api.purchase_order_view, api.purchase_order_line_view
TO erp_admin, erp_manager, erp_accountant, erp_warehouse;
GRANT SELECT ON api.goods_receipts, api.goods_receipt_lines, api.goods_receipt_view, api.goods_receipt_line_view
TO erp_admin, erp_manager, erp_accountant, erp_warehouse;
GRANT SELECT ON api.purchase_order_receiving_view, api.purchase_order_line_receiving_view
TO erp_admin, erp_manager, erp_accountant, erp_warehouse;
GRANT SELECT ON api.products, api.suppliers, api.warehouses, api.storage_locations, api.lookup_types, api.lookup_values
TO erp_admin, erp_manager, erp_accountant, erp_warehouse;
GRANT SELECT ON api.inventory_balances, api.inventory_movements, api.inventory_balance_view, api.inventory_movement_view
TO erp_admin, erp_manager, erp_accountant, erp_warehouse;
GRANT EXECUTE ON FUNCTION api.post_goods_receipt(uuid, date, uuid, text, jsonb)
TO erp_admin, erp_manager, erp_warehouse;
GRANT EXECUTE ON FUNCTION api.cancel_goods_receipt(uuid)
TO erp_admin, erp_manager;

ALTER TABLE api.goods_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.goods_receipts FORCE ROW LEVEL SECURITY;
ALTER TABLE api.goods_receipt_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.goods_receipt_lines FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS goods_receipts_select_policy ON api.goods_receipts;
DROP POLICY IF EXISTS goods_receipt_lines_select_policy ON api.goods_receipt_lines;

CREATE POLICY goods_receipts_select_policy
ON api.goods_receipts
FOR SELECT
TO erp_admin, erp_manager, erp_accountant, erp_warehouse
USING (true);

CREATE POLICY goods_receipt_lines_select_policy
ON api.goods_receipt_lines
FOR SELECT
TO erp_admin, erp_manager, erp_accountant, erp_warehouse
USING (true);

COMMIT;
