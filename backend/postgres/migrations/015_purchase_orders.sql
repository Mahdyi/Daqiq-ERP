BEGIN;

CREATE SEQUENCE IF NOT EXISTS private.purchase_order_number_seq;

WITH upserted_type AS (
  INSERT INTO api.lookup_types (code, name, description, system, active)
  VALUES ('purchase_order_status', 'وضعیت سفارش خرید', NULL, true, true)
  ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name,
      active = true
  RETURNING id
),
status_type AS (
  SELECT id FROM upserted_type
  UNION
  SELECT id FROM api.lookup_types WHERE code = 'purchase_order_status'
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
    ('submitted', 'ارسال‌شده', 20),
    ('approved', 'تأییدشده', 30),
    ('cancelled', 'لغوشده', 40),
    ('closed', 'بسته‌شده', 50)
) AS status(code, label, sort_order)
ON CONFLICT (lookup_type_id, code) DO UPDATE
SET label = EXCLUDED.label,
    sort_order = EXCLUDED.sort_order,
    active = true;

UPDATE api.feature_flags
SET enabled = true,
    category = 'purchasing'
WHERE flag_key = 'purchasing.enabled';

CREATE TABLE IF NOT EXISTS api.purchase_orders (
  id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  supplier_id uuid NOT NULL REFERENCES api.suppliers(id) ON DELETE RESTRICT,
  status_lookup_value_id uuid NOT NULL REFERENCES api.lookup_values(id) ON DELETE RESTRICT,
  order_date date NOT NULL DEFAULT current_date,
  expected_date date NULL,
  currency_lookup_value_id uuid NULL REFERENCES api.lookup_values(id) ON DELETE RESTRICT,
  delivery_warehouse_id uuid NULL REFERENCES api.warehouses(id) ON DELETE RESTRICT,
  notes text NULL,
  subtotal_amount numeric(14,2) NOT NULL DEFAULT 0,
  tax_amount numeric(14,2) NOT NULL DEFAULT 0,
  total_amount numeric(14,2) NOT NULL DEFAULT 0,
  created_by_user_id uuid NULL,
  created_by_email text NULL,
  approved_by_user_id uuid NULL,
  approved_by_email text NULL,
  approved_at timestamptz NULL,
  cancelled_by_user_id uuid NULL,
  cancelled_by_email text NULL,
  cancelled_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT purchase_orders_number_not_blank CHECK (length(btrim(order_number)) > 0),
  CONSTRAINT purchase_orders_amounts_nonnegative CHECK (
    subtotal_amount >= 0 AND tax_amount >= 0 AND total_amount >= 0
  ),
  CONSTRAINT purchase_orders_expected_after_order CHECK (
    expected_date IS NULL OR expected_date >= order_date
  )
);

CREATE INDEX IF NOT EXISTS purchase_orders_number_idx ON api.purchase_orders (order_number);
CREATE INDEX IF NOT EXISTS purchase_orders_supplier_idx ON api.purchase_orders (supplier_id);
CREATE INDEX IF NOT EXISTS purchase_orders_status_idx ON api.purchase_orders (status_lookup_value_id);
CREATE INDEX IF NOT EXISTS purchase_orders_order_date_idx ON api.purchase_orders (order_date DESC, id DESC);
CREATE INDEX IF NOT EXISTS purchase_orders_expected_date_idx ON api.purchase_orders (expected_date);
CREATE INDEX IF NOT EXISTS purchase_orders_created_by_idx ON api.purchase_orders (created_by_user_id);

DROP TRIGGER IF EXISTS purchase_orders_set_updated_at ON api.purchase_orders;
CREATE TRIGGER purchase_orders_set_updated_at
BEFORE UPDATE ON api.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

CREATE TABLE IF NOT EXISTS api.purchase_order_lines (
  id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES api.purchase_orders(id) ON DELETE CASCADE,
  line_number integer NOT NULL,
  product_id uuid NOT NULL REFERENCES api.products(id) ON DELETE RESTRICT,
  description text NULL,
  quantity numeric(18,4) NOT NULL,
  unit_lookup_value_id uuid NOT NULL REFERENCES api.lookup_values(id) ON DELETE RESTRICT,
  unit_price numeric(14,2) NOT NULL DEFAULT 0,
  tax_rate_lookup_value_id uuid NULL REFERENCES api.lookup_values(id) ON DELETE RESTRICT,
  tax_amount numeric(14,2) NOT NULL DEFAULT 0,
  line_total numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT purchase_order_lines_number_positive CHECK (line_number > 0),
  CONSTRAINT purchase_order_lines_quantity_positive CHECK (quantity > 0),
  CONSTRAINT purchase_order_lines_amounts_nonnegative CHECK (
    unit_price >= 0 AND tax_amount >= 0 AND line_total >= 0
  ),
  CONSTRAINT purchase_order_lines_unique_number UNIQUE (purchase_order_id, line_number)
);

CREATE INDEX IF NOT EXISTS purchase_order_lines_order_idx ON api.purchase_order_lines (purchase_order_id, line_number);
CREATE INDEX IF NOT EXISTS purchase_order_lines_product_idx ON api.purchase_order_lines (product_id);

DROP TRIGGER IF EXISTS purchase_order_lines_set_updated_at ON api.purchase_order_lines;
CREATE TRIGGER purchase_order_lines_set_updated_at
BEFORE UPDATE ON api.purchase_order_lines
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

CREATE OR REPLACE FUNCTION private.purchase_order_status_id(status_code text)
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT value.id
  FROM api.lookup_values value
  JOIN api.lookup_types type ON type.id = value.lookup_type_id
  WHERE type.code = 'purchase_order_status'
    AND value.code = status_code
    AND value.active = true
    AND type.active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.purchase_order_status_code(status_lookup_value_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT value.code
  FROM api.lookup_values value
  JOIN api.lookup_types type ON type.id = value.lookup_type_id
  WHERE value.id = status_lookup_value_id
    AND type.code = 'purchase_order_status'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.purchase_order_tax_rate(tax_rate_lookup_value_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SET search_path = pg_catalog
AS $$
DECLARE
  tax_code text;
BEGIN
  IF tax_rate_lookup_value_id IS NULL THEN
    RETURN 0;
  END IF;

  SELECT value.code
  INTO tax_code
  FROM api.lookup_values value
  JOIN api.lookup_types type ON type.id = value.lookup_type_id
  WHERE value.id = tax_rate_lookup_value_id
    AND type.code = 'tax_rate'
    AND value.active = true
    AND type.active = true;

  IF tax_code IS NULL THEN
    RAISE EXCEPTION 'Tax rate lookup value is invalid' USING ERRCODE = '23514';
  END IF;

  RETURN CASE tax_code
    WHEN 'standard' THEN 0.10
    WHEN 'reduced' THEN 0.05
    ELSE 0
  END;
END;
$$;

CREATE OR REPLACE FUNCTION private.next_purchase_order_number()
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
  WHERE setting.setting_key = 'documents.purchaseOrderPrefix'
    AND setting.active = true
  LIMIT 1;

  prefix := COALESCE(NULLIF(btrim(prefix), ''), 'PO');
  sequence_value := nextval('private.purchase_order_number_seq');

  RETURN prefix || '-' || to_char(statement_timestamp(), 'YYYY') || '-' || lpad(sequence_value::text, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION private.validate_purchase_order_header(
  target_supplier_id uuid,
  target_status_lookup_value_id uuid,
  target_currency_lookup_value_id uuid,
  target_delivery_warehouse_id uuid,
  target_status_code text
)
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM api.suppliers supplier
    WHERE supplier.id = target_supplier_id
      AND supplier.active = true
  ) THEN
    RAISE EXCEPTION 'Supplier is not active' USING ERRCODE = '23514';
  END IF;

  IF NOT private.lookup_value_has_type(target_status_lookup_value_id, 'purchase_order_status', true) THEN
    RAISE EXCEPTION 'Purchase order status is invalid' USING ERRCODE = '23514';
  END IF;

  IF private.purchase_order_status_code(target_status_lookup_value_id) <> target_status_code THEN
    RAISE EXCEPTION 'Purchase order status transition is invalid' USING ERRCODE = '23514';
  END IF;

  IF target_currency_lookup_value_id IS NOT NULL
    AND NOT private.lookup_value_has_type(target_currency_lookup_value_id, 'currency', true) THEN
    RAISE EXCEPTION 'Currency lookup value is invalid' USING ERRCODE = '23514';
  END IF;

  IF target_delivery_warehouse_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM api.warehouses warehouse
      WHERE warehouse.id = target_delivery_warehouse_id
        AND warehouse.active = true
    ) THEN
    RAISE EXCEPTION 'Delivery warehouse is not active' USING ERRCODE = '23514';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION private.validate_purchase_order_line(
  target_product_id uuid,
  target_unit_lookup_value_id uuid,
  target_tax_rate_lookup_value_id uuid
)
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  product_unit_id uuid;
BEGIN
  SELECT product.base_unit_lookup_value_id
  INTO product_unit_id
  FROM api.products product
  WHERE product.id = target_product_id
    AND product.active = true
    AND product.purchasable = true;

  IF product_unit_id IS NULL THEN
    RAISE EXCEPTION 'Product is not active or purchasable' USING ERRCODE = '23514';
  END IF;

  IF target_unit_lookup_value_id <> product_unit_id THEN
    RAISE EXCEPTION 'Purchase order line unit must match product base unit' USING ERRCODE = '23514';
  END IF;

  IF NOT private.lookup_value_has_type(target_unit_lookup_value_id, 'unit', true) THEN
    RAISE EXCEPTION 'Unit lookup value is invalid' USING ERRCODE = '23514';
  END IF;

  IF target_tax_rate_lookup_value_id IS NOT NULL THEN
    PERFORM private.purchase_order_tax_rate(target_tax_rate_lookup_value_id);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION private.replace_purchase_order_lines(
  target_purchase_order_id uuid,
  line_payload jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  line_record record;
  parsed_product_id uuid;
  parsed_unit_lookup_value_id uuid;
  parsed_tax_rate_lookup_value_id uuid;
  parsed_quantity numeric;
  parsed_unit_price numeric;
  parsed_tax_amount numeric(14,2);
  parsed_line_total numeric(14,2);
  parsed_description text;
  inserted_count integer := 0;
BEGIN
  IF jsonb_typeof(COALESCE(line_payload, 'null'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'Purchase order lines must be an array' USING ERRCODE = '22023';
  END IF;

  DELETE FROM api.purchase_order_lines
  WHERE purchase_order_id = target_purchase_order_id;

  FOR line_record IN
    SELECT value, ordinality
    FROM jsonb_array_elements(line_payload) WITH ORDINALITY AS line(value, ordinality)
  LOOP
    parsed_product_id := NULLIF(line_record.value->>'product_id', '')::uuid;
    parsed_unit_lookup_value_id := NULLIF(line_record.value->>'unit_lookup_value_id', '')::uuid;
    parsed_tax_rate_lookup_value_id := NULLIF(line_record.value->>'tax_rate_lookup_value_id', '')::uuid;
    parsed_quantity := NULLIF(line_record.value->>'quantity', '')::numeric;
    parsed_unit_price := COALESCE(NULLIF(line_record.value->>'unit_price', '')::numeric, 0);
    parsed_description := NULLIF(btrim(COALESCE(line_record.value->>'description', '')), '');

    IF parsed_quantity IS NULL OR parsed_quantity <= 0 THEN
      RAISE EXCEPTION 'Purchase order line quantity must be greater than zero' USING ERRCODE = '23514';
    END IF;

    IF parsed_unit_price < 0 THEN
      RAISE EXCEPTION 'Purchase order line unit price cannot be negative' USING ERRCODE = '23514';
    END IF;

    PERFORM private.validate_purchase_order_line(
      parsed_product_id,
      parsed_unit_lookup_value_id,
      parsed_tax_rate_lookup_value_id
    );

    parsed_tax_amount := round((parsed_quantity * parsed_unit_price * private.purchase_order_tax_rate(parsed_tax_rate_lookup_value_id))::numeric, 2);
    parsed_line_total := round((parsed_quantity * parsed_unit_price + parsed_tax_amount)::numeric, 2);

    INSERT INTO api.purchase_order_lines (
      purchase_order_id,
      line_number,
      product_id,
      description,
      quantity,
      unit_lookup_value_id,
      unit_price,
      tax_rate_lookup_value_id,
      tax_amount,
      line_total
    )
    VALUES (
      target_purchase_order_id,
      line_record.ordinality::integer,
      parsed_product_id,
      parsed_description,
      parsed_quantity,
      parsed_unit_lookup_value_id,
      parsed_unit_price,
      parsed_tax_rate_lookup_value_id,
      parsed_tax_amount,
      parsed_line_total
    );

    inserted_count := inserted_count + 1;
  END LOOP;

  IF inserted_count = 0 THEN
    RAISE EXCEPTION 'Purchase order must contain at least one line' USING ERRCODE = '23514';
  END IF;

  UPDATE api.purchase_orders purchase_order
  SET subtotal_amount = COALESCE((
        SELECT round(sum(line.quantity * line.unit_price)::numeric, 2)
        FROM api.purchase_order_lines line
        WHERE line.purchase_order_id = target_purchase_order_id
      ), 0),
      tax_amount = COALESCE((
        SELECT round(sum(line.tax_amount)::numeric, 2)
        FROM api.purchase_order_lines line
        WHERE line.purchase_order_id = target_purchase_order_id
      ), 0),
      total_amount = COALESCE((
        SELECT round(sum(line.line_total)::numeric, 2)
        FROM api.purchase_order_lines line
        WHERE line.purchase_order_id = target_purchase_order_id
      ), 0)
  WHERE purchase_order.id = target_purchase_order_id;
END;
$$;

CREATE OR REPLACE VIEW api.purchase_order_view
WITH (security_invoker = true)
AS
SELECT
  purchase_order.id,
  purchase_order.order_number,
  purchase_order.supplier_id,
  supplier.code AS supplier_code,
  supplier.name AS supplier_name,
  purchase_order.status_lookup_value_id,
  status_value.code AS status_code,
  status_value.label AS status_label,
  purchase_order.order_date,
  purchase_order.expected_date,
  purchase_order.currency_lookup_value_id,
  currency_value.code AS currency_code,
  currency_value.label AS currency_label,
  purchase_order.delivery_warehouse_id,
  warehouse.code AS delivery_warehouse_code,
  warehouse.name AS delivery_warehouse_name,
  purchase_order.subtotal_amount,
  purchase_order.tax_amount,
  purchase_order.total_amount,
  purchase_order.created_by_email,
  purchase_order.approved_by_email,
  purchase_order.approved_at,
  purchase_order.cancelled_by_email,
  purchase_order.cancelled_at,
  purchase_order.created_at,
  purchase_order.updated_at
FROM api.purchase_orders purchase_order
JOIN api.suppliers supplier ON supplier.id = purchase_order.supplier_id
JOIN api.lookup_values status_value ON status_value.id = purchase_order.status_lookup_value_id
LEFT JOIN api.lookup_values currency_value ON currency_value.id = purchase_order.currency_lookup_value_id
LEFT JOIN api.warehouses warehouse ON warehouse.id = purchase_order.delivery_warehouse_id;

CREATE OR REPLACE VIEW api.purchase_order_line_view
WITH (security_invoker = true)
AS
SELECT
  line.id,
  line.purchase_order_id,
  line.line_number,
  line.product_id,
  product.sku AS product_sku,
  product.name AS product_name,
  line.description,
  line.quantity,
  line.unit_lookup_value_id,
  unit_value.code AS unit_code,
  unit_value.label AS unit_label,
  line.unit_price,
  line.tax_rate_lookup_value_id,
  tax_value.code AS tax_rate_code,
  tax_value.label AS tax_rate_label,
  line.tax_amount,
  line.line_total
FROM api.purchase_order_lines line
JOIN api.products product ON product.id = line.product_id
JOIN api.lookup_values unit_value ON unit_value.id = line.unit_lookup_value_id
LEFT JOIN api.lookup_values tax_value ON tax_value.id = line.tax_rate_lookup_value_id;

CREATE OR REPLACE FUNCTION private.purchase_order_json(target_purchase_order_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT jsonb_build_object(
    'id', purchase_order.id,
    'orderNumber', purchase_order.order_number,
    'supplierId', purchase_order.supplier_id,
    'supplierCode', purchase_order.supplier_code,
    'supplierName', purchase_order.supplier_name,
    'statusLookupValueId', purchase_order.status_lookup_value_id,
    'statusCode', purchase_order.status_code,
    'statusLabel', purchase_order.status_label,
    'orderDate', purchase_order.order_date,
    'expectedDate', purchase_order.expected_date,
    'currencyLookupValueId', purchase_order.currency_lookup_value_id,
    'currencyCode', purchase_order.currency_code,
    'currencyLabel', purchase_order.currency_label,
    'deliveryWarehouseId', purchase_order.delivery_warehouse_id,
    'deliveryWarehouseCode', purchase_order.delivery_warehouse_code,
    'deliveryWarehouseName', purchase_order.delivery_warehouse_name,
    'subtotalAmount', purchase_order.subtotal_amount,
    'taxAmount', purchase_order.tax_amount,
    'totalAmount', purchase_order.total_amount,
    'createdByEmail', purchase_order.created_by_email,
    'approvedByEmail', purchase_order.approved_by_email,
    'approvedAt', purchase_order.approved_at,
    'cancelledByEmail', purchase_order.cancelled_by_email,
    'cancelledAt', purchase_order.cancelled_at,
    'createdAt', purchase_order.created_at,
    'updatedAt', purchase_order.updated_at
  )
  FROM api.purchase_order_view purchase_order
  WHERE purchase_order.id = target_purchase_order_id;
$$;

CREATE OR REPLACE FUNCTION private.write_purchase_order_audit(
  audit_action text,
  target_purchase_order_id uuid,
  audit_summary text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  po api.purchase_order_view%ROWTYPE;
  line_count integer;
BEGIN
  SELECT * INTO po FROM api.purchase_order_view WHERE id = target_purchase_order_id;
  SELECT count(*) INTO line_count FROM api.purchase_order_lines WHERE purchase_order_id = target_purchase_order_id;

  PERFORM private.write_audit_log(
    audit_action,
    'purchase_order',
    'success',
    audit_summary,
    target_purchase_order_id::text,
    jsonb_build_object(
      'orderNumber', po.order_number,
      'supplierId', po.supplier_id,
      'supplierName', po.supplier_name,
      'status', po.status_code,
      'totalAmount', po.total_amount,
      'lineCount', line_count
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION api.create_purchase_order(
  supplier_id uuid,
  order_date date DEFAULT current_date,
  expected_date date DEFAULT NULL,
  currency_lookup_value_id uuid DEFAULT NULL,
  delivery_warehouse_id uuid DEFAULT NULL,
  notes text DEFAULT NULL,
  lines jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  draft_status_id uuid;
  created_id uuid;
BEGIN
  draft_status_id := private.purchase_order_status_id('draft');

  PERFORM private.validate_purchase_order_header(
    supplier_id,
    draft_status_id,
    currency_lookup_value_id,
    delivery_warehouse_id,
    'draft'
  );

  INSERT INTO api.purchase_orders (
    order_number,
    supplier_id,
    status_lookup_value_id,
    order_date,
    expected_date,
    currency_lookup_value_id,
    delivery_warehouse_id,
    notes,
    created_by_user_id,
    created_by_email
  )
  VALUES (
    private.next_purchase_order_number(),
    supplier_id,
    draft_status_id,
    COALESCE(order_date, current_date),
    expected_date,
    currency_lookup_value_id,
    delivery_warehouse_id,
    NULLIF(btrim(COALESCE(notes, '')), ''),
    private.current_request_user_id(),
    private.current_request_email()
  )
  RETURNING id INTO created_id;

  PERFORM private.replace_purchase_order_lines(created_id, lines);
  PERFORM private.write_purchase_order_audit('purchaseOrder.created', created_id, 'Purchase order created');

  RETURN private.purchase_order_json(created_id);
END;
$$;

CREATE OR REPLACE FUNCTION api.update_purchase_order(
  purchase_order_id uuid,
  supplier_id uuid,
  order_date date DEFAULT current_date,
  expected_date date DEFAULT NULL,
  currency_lookup_value_id uuid DEFAULT NULL,
  delivery_warehouse_id uuid DEFAULT NULL,
  notes text DEFAULT NULL,
  lines jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  draft_status_id uuid;
BEGIN
  draft_status_id := private.purchase_order_status_id('draft');

  IF NOT EXISTS (
    SELECT 1 FROM api.purchase_orders purchase_order
    WHERE purchase_order.id = purchase_order_id
      AND purchase_order.status_lookup_value_id = draft_status_id
  ) THEN
    RAISE EXCEPTION 'Only draft purchase orders can be updated' USING ERRCODE = '23514';
  END IF;

  PERFORM private.validate_purchase_order_header(
    supplier_id,
    draft_status_id,
    currency_lookup_value_id,
    delivery_warehouse_id,
    'draft'
  );

  UPDATE api.purchase_orders purchase_order
  SET supplier_id = update_purchase_order.supplier_id,
      order_date = COALESCE(update_purchase_order.order_date, current_date),
      expected_date = update_purchase_order.expected_date,
      currency_lookup_value_id = update_purchase_order.currency_lookup_value_id,
      delivery_warehouse_id = update_purchase_order.delivery_warehouse_id,
      notes = NULLIF(btrim(COALESCE(update_purchase_order.notes, '')), '')
  WHERE purchase_order.id = purchase_order_id;

  PERFORM private.replace_purchase_order_lines(purchase_order_id, lines);
  PERFORM private.write_purchase_order_audit('purchaseOrder.updated', purchase_order_id, 'Purchase order updated');

  RETURN private.purchase_order_json(purchase_order_id);
END;
$$;

CREATE OR REPLACE FUNCTION private.transition_purchase_order(
  target_purchase_order_id uuid,
  expected_status_code text,
  next_status_code text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  expected_status_id uuid;
  next_status_id uuid;
  updated_id uuid;
BEGIN
  expected_status_id := private.purchase_order_status_id(expected_status_code);
  next_status_id := private.purchase_order_status_id(next_status_code);

  UPDATE api.purchase_orders purchase_order
  SET status_lookup_value_id = next_status_id,
      approved_by_user_id = CASE WHEN next_status_code = 'approved' THEN private.current_request_user_id() ELSE approved_by_user_id END,
      approved_by_email = CASE WHEN next_status_code = 'approved' THEN private.current_request_email() ELSE approved_by_email END,
      approved_at = CASE WHEN next_status_code = 'approved' THEN statement_timestamp() ELSE approved_at END,
      cancelled_by_user_id = CASE WHEN next_status_code = 'cancelled' THEN private.current_request_user_id() ELSE cancelled_by_user_id END,
      cancelled_by_email = CASE WHEN next_status_code = 'cancelled' THEN private.current_request_email() ELSE cancelled_by_email END,
      cancelled_at = CASE WHEN next_status_code = 'cancelled' THEN statement_timestamp() ELSE cancelled_at END
  WHERE purchase_order.id = target_purchase_order_id
    AND purchase_order.status_lookup_value_id = expected_status_id
  RETURNING purchase_order.id INTO updated_id;

  IF updated_id IS NULL THEN
    RAISE EXCEPTION 'Purchase order status transition is invalid' USING ERRCODE = '23514';
  END IF;

  RETURN updated_id;
END;
$$;

CREATE OR REPLACE FUNCTION api.submit_purchase_order(purchase_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  PERFORM private.transition_purchase_order(purchase_order_id, 'draft', 'submitted');
  PERFORM private.write_purchase_order_audit('purchaseOrder.submitted', purchase_order_id, 'Purchase order submitted');
  RETURN private.purchase_order_json(purchase_order_id);
END;
$$;

CREATE OR REPLACE FUNCTION api.approve_purchase_order(purchase_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  PERFORM private.transition_purchase_order(purchase_order_id, 'submitted', 'approved');
  PERFORM private.write_purchase_order_audit('purchaseOrder.approved', purchase_order_id, 'Purchase order approved');
  RETURN private.purchase_order_json(purchase_order_id);
END;
$$;

CREATE OR REPLACE FUNCTION api.cancel_purchase_order(purchase_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  current_status text;
BEGIN
  SELECT private.purchase_order_status_code(status_lookup_value_id)
  INTO current_status
  FROM api.purchase_orders
  WHERE id = purchase_order_id;

  IF current_status NOT IN ('draft', 'submitted', 'approved') THEN
    RAISE EXCEPTION 'Purchase order cannot be cancelled from current status' USING ERRCODE = '23514';
  END IF;

  UPDATE api.purchase_orders purchase_order
  SET status_lookup_value_id = private.purchase_order_status_id('cancelled'),
      cancelled_by_user_id = private.current_request_user_id(),
      cancelled_by_email = private.current_request_email(),
      cancelled_at = statement_timestamp()
  WHERE purchase_order.id = purchase_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase order not found' USING ERRCODE = '02000';
  END IF;

  PERFORM private.write_purchase_order_audit('purchaseOrder.cancelled', purchase_order_id, 'Purchase order cancelled');
  RETURN private.purchase_order_json(purchase_order_id);
END;
$$;

CREATE OR REPLACE FUNCTION api.close_purchase_order(purchase_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  PERFORM private.transition_purchase_order(purchase_order_id, 'approved', 'closed');
  PERFORM private.write_purchase_order_audit('purchaseOrder.closed', purchase_order_id, 'Purchase order closed');
  RETURN private.purchase_order_json(purchase_order_id);
END;
$$;

REVOKE ALL ON api.purchase_orders FROM PUBLIC;
REVOKE ALL ON api.purchase_order_lines FROM PUBLIC;
REVOKE ALL ON api.purchase_order_view FROM PUBLIC;
REVOKE ALL ON api.purchase_order_line_view FROM PUBLIC;
REVOKE ALL ON FUNCTION private.purchase_order_status_id(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.purchase_order_status_code(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.purchase_order_tax_rate(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.next_purchase_order_number() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.validate_purchase_order_header(uuid, uuid, uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.validate_purchase_order_line(uuid, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.replace_purchase_order_lines(uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.purchase_order_json(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.write_purchase_order_audit(text, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.transition_purchase_order(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.create_purchase_order(uuid, date, date, uuid, uuid, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.update_purchase_order(uuid, uuid, date, date, uuid, uuid, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.submit_purchase_order(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.approve_purchase_order(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.cancel_purchase_order(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.close_purchase_order(uuid) FROM PUBLIC;

GRANT USAGE ON SCHEMA api TO erp_admin, erp_manager, erp_accountant, erp_warehouse;
GRANT SELECT ON api.suppliers, api.products, api.lookup_types, api.lookup_values, api.warehouses
TO erp_admin, erp_manager, erp_accountant, erp_warehouse;
GRANT SELECT ON api.purchase_orders, api.purchase_order_lines, api.purchase_order_view, api.purchase_order_line_view
TO erp_admin, erp_manager, erp_accountant, erp_warehouse;
GRANT EXECUTE ON FUNCTION api.create_purchase_order(uuid, date, date, uuid, uuid, text, jsonb)
TO erp_admin, erp_manager;
GRANT EXECUTE ON FUNCTION api.update_purchase_order(uuid, uuid, date, date, uuid, uuid, text, jsonb)
TO erp_admin, erp_manager;
GRANT EXECUTE ON FUNCTION api.submit_purchase_order(uuid)
TO erp_admin, erp_manager;
GRANT EXECUTE ON FUNCTION api.approve_purchase_order(uuid)
TO erp_admin, erp_manager;
GRANT EXECUTE ON FUNCTION api.cancel_purchase_order(uuid)
TO erp_admin, erp_manager;
GRANT EXECUTE ON FUNCTION api.close_purchase_order(uuid)
TO erp_admin;

ALTER TABLE api.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.purchase_orders FORCE ROW LEVEL SECURITY;
ALTER TABLE api.purchase_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.purchase_order_lines FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS purchase_orders_select_policy ON api.purchase_orders;
DROP POLICY IF EXISTS purchase_order_lines_select_policy ON api.purchase_order_lines;

CREATE POLICY purchase_orders_select_policy
ON api.purchase_orders
FOR SELECT
TO erp_admin, erp_manager, erp_accountant, erp_warehouse
USING (true);

CREATE POLICY purchase_order_lines_select_policy
ON api.purchase_order_lines
FOR SELECT
TO erp_admin, erp_manager, erp_accountant, erp_warehouse
USING (true);

COMMIT;
