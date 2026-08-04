BEGIN;

CREATE SEQUENCE IF NOT EXISTS private.sales_order_number_seq;

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
  'documents.salesOrderPrefix',
  '"SO"',
  'string',
  'documents',
  'پیشوند سفارش فروش',
  'پیشوند شماره سند سفارش فروش',
  true,
  true
)
ON CONFLICT (setting_key) DO NOTHING;

WITH upserted_type AS (
  INSERT INTO api.lookup_types (code, name, description, system, active)
  VALUES ('sales_order_status', 'وضعیت سفارش فروش', NULL, true, true)
  ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name,
      active = true
  RETURNING id
),
status_type AS (
  SELECT id FROM upserted_type
  UNION
  SELECT id FROM api.lookup_types WHERE code = 'sales_order_status'
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
    ('confirmed', 'تأییدشده', 30),
    ('cancelled', 'لغوشده', 40),
    ('closed', 'بسته‌شده', 50)
) AS status(code, label, sort_order)
ON CONFLICT (lookup_type_id, code) DO UPDATE
SET label = EXCLUDED.label,
    sort_order = EXCLUDED.sort_order,
    active = true;

UPDATE api.feature_flags
SET enabled = true,
    category = 'sales'
WHERE flag_key = 'sales.enabled';

CREATE TABLE IF NOT EXISTS api.sales_orders (
  id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  customer_id uuid NOT NULL REFERENCES api.customers(id) ON DELETE RESTRICT,
  status_lookup_value_id uuid NOT NULL REFERENCES api.lookup_values(id) ON DELETE RESTRICT,
  order_date date NOT NULL DEFAULT current_date,
  requested_delivery_date date NULL,
  currency_lookup_value_id uuid NULL REFERENCES api.lookup_values(id) ON DELETE RESTRICT,
  delivery_warehouse_id uuid NULL REFERENCES api.warehouses(id) ON DELETE RESTRICT,
  notes text NULL,
  subtotal_amount numeric(14,2) NOT NULL DEFAULT 0,
  tax_amount numeric(14,2) NOT NULL DEFAULT 0,
  total_amount numeric(14,2) NOT NULL DEFAULT 0,
  created_by_user_id uuid NULL,
  created_by_email text NULL,
  confirmed_by_user_id uuid NULL,
  confirmed_by_email text NULL,
  confirmed_at timestamptz NULL,
  cancelled_by_user_id uuid NULL,
  cancelled_by_email text NULL,
  cancelled_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sales_orders_number_not_blank CHECK (length(btrim(order_number)) > 0),
  CONSTRAINT sales_orders_amounts_nonnegative CHECK (
    subtotal_amount >= 0 AND tax_amount >= 0 AND total_amount >= 0
  ),
  CONSTRAINT sales_orders_delivery_after_order CHECK (
    requested_delivery_date IS NULL OR requested_delivery_date >= order_date
  )
);

CREATE INDEX IF NOT EXISTS sales_orders_number_idx ON api.sales_orders (order_number);
CREATE INDEX IF NOT EXISTS sales_orders_customer_idx ON api.sales_orders (customer_id);
CREATE INDEX IF NOT EXISTS sales_orders_status_idx ON api.sales_orders (status_lookup_value_id);
CREATE INDEX IF NOT EXISTS sales_orders_order_date_idx ON api.sales_orders (order_date DESC, id DESC);
CREATE INDEX IF NOT EXISTS sales_orders_requested_delivery_idx ON api.sales_orders (requested_delivery_date);
CREATE INDEX IF NOT EXISTS sales_orders_created_by_idx ON api.sales_orders (created_by_user_id);

DROP TRIGGER IF EXISTS sales_orders_set_updated_at ON api.sales_orders;
CREATE TRIGGER sales_orders_set_updated_at
BEFORE UPDATE ON api.sales_orders
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

CREATE TABLE IF NOT EXISTS api.sales_order_lines (
  id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
  sales_order_id uuid NOT NULL REFERENCES api.sales_orders(id) ON DELETE CASCADE,
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
  CONSTRAINT sales_order_lines_number_positive CHECK (line_number > 0),
  CONSTRAINT sales_order_lines_quantity_positive CHECK (quantity > 0),
  CONSTRAINT sales_order_lines_amounts_nonnegative CHECK (
    unit_price >= 0 AND tax_amount >= 0 AND line_total >= 0
  ),
  CONSTRAINT sales_order_lines_unique_number UNIQUE (sales_order_id, line_number)
);

CREATE INDEX IF NOT EXISTS sales_order_lines_order_idx ON api.sales_order_lines (sales_order_id, line_number);
CREATE INDEX IF NOT EXISTS sales_order_lines_product_idx ON api.sales_order_lines (product_id);

DROP TRIGGER IF EXISTS sales_order_lines_set_updated_at ON api.sales_order_lines;
CREATE TRIGGER sales_order_lines_set_updated_at
BEFORE UPDATE ON api.sales_order_lines
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

CREATE OR REPLACE FUNCTION private.sales_order_status_id(status_code text)
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT value.id
  FROM api.lookup_values value
  JOIN api.lookup_types type ON type.id = value.lookup_type_id
  WHERE type.code = 'sales_order_status'
    AND value.code = status_code
    AND value.active = true
    AND type.active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.sales_order_status_code(status_lookup_value_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT value.code
  FROM api.lookup_values value
  JOIN api.lookup_types type ON type.id = value.lookup_type_id
  WHERE value.id = status_lookup_value_id
    AND type.code = 'sales_order_status'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.sales_order_tax_rate(tax_rate_lookup_value_id uuid)
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

CREATE OR REPLACE FUNCTION private.next_sales_order_number()
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
  WHERE setting.setting_key = 'documents.salesOrderPrefix'
    AND setting.active = true
  LIMIT 1;

  prefix := COALESCE(NULLIF(btrim(prefix), ''), 'SO');
  sequence_value := nextval('private.sales_order_number_seq');

  RETURN prefix || '-' || to_char(statement_timestamp(), 'YYYY') || '-' || lpad(sequence_value::text, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION private.validate_sales_order_header(
  target_customer_id uuid,
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
    SELECT 1 FROM api.customers customer
    WHERE customer.id = target_customer_id
      AND customer.active = true
  ) THEN
    RAISE EXCEPTION 'Customer is not active' USING ERRCODE = '23514';
  END IF;

  IF NOT private.lookup_value_has_type(target_status_lookup_value_id, 'sales_order_status', true) THEN
    RAISE EXCEPTION 'Sales order status is invalid' USING ERRCODE = '23514';
  END IF;

  IF private.sales_order_status_code(target_status_lookup_value_id) <> target_status_code THEN
    RAISE EXCEPTION 'Sales order status transition is invalid' USING ERRCODE = '23514';
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

CREATE OR REPLACE FUNCTION private.validate_sales_order_line(
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
    AND product.sellable = true;

  IF product_unit_id IS NULL THEN
    RAISE EXCEPTION 'Product is not active or sellable' USING ERRCODE = '23514';
  END IF;

  IF target_unit_lookup_value_id <> product_unit_id THEN
    RAISE EXCEPTION 'Sales order line unit must match product base unit' USING ERRCODE = '23514';
  END IF;

  IF NOT private.lookup_value_has_type(target_unit_lookup_value_id, 'unit', true) THEN
    RAISE EXCEPTION 'Unit lookup value is invalid' USING ERRCODE = '23514';
  END IF;

  IF target_tax_rate_lookup_value_id IS NOT NULL THEN
    PERFORM private.sales_order_tax_rate(target_tax_rate_lookup_value_id);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION private.replace_sales_order_lines(
  target_sales_order_id uuid,
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
    RAISE EXCEPTION 'Sales order lines must be an array' USING ERRCODE = '22023';
  END IF;

  DELETE FROM api.sales_order_lines
  WHERE sales_order_id = target_sales_order_id;

  FOR line_record IN
    SELECT value, ordinality
    FROM jsonb_array_elements(line_payload) WITH ORDINALITY AS line(value, ordinality)
  LOOP
    parsed_product_id := NULLIF(COALESCE(line_record.value->>'product_id', line_record.value->>'productId'), '')::uuid;
    parsed_unit_lookup_value_id := NULLIF(COALESCE(line_record.value->>'unit_lookup_value_id', line_record.value->>'unitLookupValueId'), '')::uuid;
    parsed_tax_rate_lookup_value_id := NULLIF(COALESCE(line_record.value->>'tax_rate_lookup_value_id', line_record.value->>'taxRateLookupValueId'), '')::uuid;
    parsed_quantity := NULLIF(line_record.value->>'quantity', '')::numeric;
    parsed_unit_price := COALESCE(NULLIF(COALESCE(line_record.value->>'unit_price', line_record.value->>'unitPrice'), '')::numeric, 0);
    parsed_description := NULLIF(btrim(COALESCE(line_record.value->>'description', '')), '');

    IF parsed_quantity IS NULL OR parsed_quantity <= 0 THEN
      RAISE EXCEPTION 'Sales order line quantity must be greater than zero' USING ERRCODE = '23514';
    END IF;

    IF parsed_unit_price < 0 THEN
      RAISE EXCEPTION 'Sales order line unit price cannot be negative' USING ERRCODE = '23514';
    END IF;

    PERFORM private.validate_sales_order_line(
      parsed_product_id,
      parsed_unit_lookup_value_id,
      parsed_tax_rate_lookup_value_id
    );

    parsed_tax_amount := round((parsed_quantity * parsed_unit_price * private.sales_order_tax_rate(parsed_tax_rate_lookup_value_id))::numeric, 2);
    parsed_line_total := round((parsed_quantity * parsed_unit_price + parsed_tax_amount)::numeric, 2);

    INSERT INTO api.sales_order_lines (
      sales_order_id,
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
      target_sales_order_id,
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
    RAISE EXCEPTION 'Sales order must contain at least one line' USING ERRCODE = '23514';
  END IF;

  UPDATE api.sales_orders sales_order
  SET subtotal_amount = COALESCE((
        SELECT round(sum(line.quantity * line.unit_price)::numeric, 2)
        FROM api.sales_order_lines line
        WHERE line.sales_order_id = target_sales_order_id
      ), 0),
      tax_amount = COALESCE((
        SELECT round(sum(line.tax_amount)::numeric, 2)
        FROM api.sales_order_lines line
        WHERE line.sales_order_id = target_sales_order_id
      ), 0),
      total_amount = COALESCE((
        SELECT round(sum(line.line_total)::numeric, 2)
        FROM api.sales_order_lines line
        WHERE line.sales_order_id = target_sales_order_id
      ), 0)
  WHERE sales_order.id = target_sales_order_id;
END;
$$;

CREATE OR REPLACE VIEW api.sales_order_view
WITH (security_invoker = true)
AS
SELECT
  sales_order.id,
  sales_order.order_number,
  sales_order.customer_id,
  customer.code AS customer_code,
  customer.name AS customer_name,
  sales_order.status_lookup_value_id,
  status_value.code AS status_code,
  status_value.label AS status_label,
  sales_order.order_date,
  sales_order.requested_delivery_date,
  sales_order.currency_lookup_value_id,
  currency_value.code AS currency_code,
  currency_value.label AS currency_label,
  sales_order.delivery_warehouse_id,
  warehouse.code AS delivery_warehouse_code,
  warehouse.name AS delivery_warehouse_name,
  sales_order.subtotal_amount,
  sales_order.tax_amount,
  sales_order.total_amount,
  sales_order.created_by_email,
  sales_order.confirmed_by_email,
  sales_order.confirmed_at,
  sales_order.cancelled_by_email,
  sales_order.cancelled_at,
  sales_order.created_at,
  sales_order.updated_at
FROM api.sales_orders sales_order
JOIN api.customers customer ON customer.id = sales_order.customer_id
JOIN api.lookup_values status_value ON status_value.id = sales_order.status_lookup_value_id
LEFT JOIN api.lookup_values currency_value ON currency_value.id = sales_order.currency_lookup_value_id
LEFT JOIN api.warehouses warehouse ON warehouse.id = sales_order.delivery_warehouse_id;

CREATE OR REPLACE VIEW api.sales_order_line_view
WITH (security_invoker = true)
AS
SELECT
  line.id,
  line.sales_order_id,
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
FROM api.sales_order_lines line
JOIN api.products product ON product.id = line.product_id
JOIN api.lookup_values unit_value ON unit_value.id = line.unit_lookup_value_id
LEFT JOIN api.lookup_values tax_value ON tax_value.id = line.tax_rate_lookup_value_id;

CREATE OR REPLACE VIEW api.product_stock_availability_view
WITH (security_invoker = true)
AS
SELECT
  product.id AS product_id,
  product.sku AS product_sku,
  product.name AS product_name,
  product.base_unit_lookup_value_id AS unit_lookup_value_id,
  unit_value.code AS unit_code,
  unit_value.label AS unit_label,
  COALESCE(sum(balance.quantity_on_hand), 0)::numeric(18,4) AS total_quantity_on_hand
FROM api.products product
JOIN api.lookup_values unit_value ON unit_value.id = product.base_unit_lookup_value_id
LEFT JOIN api.inventory_balances balance ON balance.product_id = product.id
WHERE product.active = true
  AND product.sellable = true
GROUP BY product.id, product.sku, product.name, product.base_unit_lookup_value_id, unit_value.code, unit_value.label;

CREATE OR REPLACE FUNCTION private.sales_order_json(target_sales_order_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT jsonb_build_object(
    'id', sales_order.id,
    'orderNumber', sales_order.order_number,
    'customerId', sales_order.customer_id,
    'customerCode', sales_order.customer_code,
    'customerName', sales_order.customer_name,
    'statusLookupValueId', sales_order.status_lookup_value_id,
    'statusCode', sales_order.status_code,
    'statusLabel', sales_order.status_label,
    'orderDate', sales_order.order_date,
    'requestedDeliveryDate', sales_order.requested_delivery_date,
    'currencyLookupValueId', sales_order.currency_lookup_value_id,
    'currencyCode', sales_order.currency_code,
    'currencyLabel', sales_order.currency_label,
    'deliveryWarehouseId', sales_order.delivery_warehouse_id,
    'deliveryWarehouseCode', sales_order.delivery_warehouse_code,
    'deliveryWarehouseName', sales_order.delivery_warehouse_name,
    'subtotalAmount', sales_order.subtotal_amount,
    'taxAmount', sales_order.tax_amount,
    'totalAmount', sales_order.total_amount,
    'createdByEmail', sales_order.created_by_email,
    'confirmedByEmail', sales_order.confirmed_by_email,
    'confirmedAt', sales_order.confirmed_at,
    'cancelledByEmail', sales_order.cancelled_by_email,
    'cancelledAt', sales_order.cancelled_at,
    'createdAt', sales_order.created_at,
    'updatedAt', sales_order.updated_at
  )
  FROM api.sales_order_view sales_order
  WHERE sales_order.id = target_sales_order_id;
$$;

CREATE OR REPLACE FUNCTION private.write_sales_order_audit(
  audit_action text,
  target_sales_order_id uuid,
  audit_summary text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  sales_order api.sales_order_view%ROWTYPE;
  line_count integer;
BEGIN
  SELECT * INTO sales_order FROM api.sales_order_view WHERE id = target_sales_order_id;
  SELECT count(*) INTO line_count FROM api.sales_order_lines WHERE sales_order_id = target_sales_order_id;

  PERFORM private.write_audit_log(
    audit_action,
    'sales_order',
    'success',
    audit_summary,
    target_sales_order_id::text,
    jsonb_build_object(
      'orderNumber', sales_order.order_number,
      'customerId', sales_order.customer_id,
      'customerName', sales_order.customer_name,
      'status', sales_order.status_code,
      'totalAmount', sales_order.total_amount,
      'lineCount', line_count
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION api.create_sales_order(
  customer_id uuid,
  order_date date DEFAULT current_date,
  requested_delivery_date date DEFAULT NULL,
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
  draft_status_id := private.sales_order_status_id('draft');

  PERFORM private.validate_sales_order_header(
    customer_id,
    draft_status_id,
    currency_lookup_value_id,
    delivery_warehouse_id,
    'draft'
  );

  INSERT INTO api.sales_orders (
    order_number,
    customer_id,
    status_lookup_value_id,
    order_date,
    requested_delivery_date,
    currency_lookup_value_id,
    delivery_warehouse_id,
    notes,
    created_by_user_id,
    created_by_email
  )
  VALUES (
    private.next_sales_order_number(),
    customer_id,
    draft_status_id,
    COALESCE(order_date, current_date),
    requested_delivery_date,
    currency_lookup_value_id,
    delivery_warehouse_id,
    NULLIF(btrim(COALESCE(notes, '')), ''),
    private.current_request_user_id(),
    private.current_request_email()
  )
  RETURNING id INTO created_id;

  PERFORM private.replace_sales_order_lines(created_id, lines);
  PERFORM private.write_sales_order_audit('salesOrder.created', created_id, 'Sales order created');

  RETURN private.sales_order_json(created_id);
END;
$$;

CREATE OR REPLACE FUNCTION api.update_sales_order(
  sales_order_id uuid,
  customer_id uuid,
  order_date date DEFAULT current_date,
  requested_delivery_date date DEFAULT NULL,
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
  draft_status_id := private.sales_order_status_id('draft');

  IF NOT EXISTS (
    SELECT 1 FROM api.sales_orders sales_order
    WHERE sales_order.id = sales_order_id
      AND sales_order.status_lookup_value_id = draft_status_id
  ) THEN
    RAISE EXCEPTION 'Only draft sales orders can be updated' USING ERRCODE = '23514';
  END IF;

  PERFORM private.validate_sales_order_header(
    customer_id,
    draft_status_id,
    currency_lookup_value_id,
    delivery_warehouse_id,
    'draft'
  );

  UPDATE api.sales_orders sales_order
  SET customer_id = update_sales_order.customer_id,
      order_date = COALESCE(update_sales_order.order_date, current_date),
      requested_delivery_date = update_sales_order.requested_delivery_date,
      currency_lookup_value_id = update_sales_order.currency_lookup_value_id,
      delivery_warehouse_id = update_sales_order.delivery_warehouse_id,
      notes = NULLIF(btrim(COALESCE(update_sales_order.notes, '')), '')
  WHERE sales_order.id = sales_order_id;

  PERFORM private.replace_sales_order_lines(sales_order_id, lines);
  PERFORM private.write_sales_order_audit('salesOrder.updated', sales_order_id, 'Sales order updated');

  RETURN private.sales_order_json(sales_order_id);
END;
$$;

CREATE OR REPLACE FUNCTION private.transition_sales_order(
  target_sales_order_id uuid,
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
  expected_status_id := private.sales_order_status_id(expected_status_code);
  next_status_id := private.sales_order_status_id(next_status_code);

  UPDATE api.sales_orders sales_order
  SET status_lookup_value_id = next_status_id,
      confirmed_by_user_id = CASE WHEN next_status_code = 'confirmed' THEN private.current_request_user_id() ELSE confirmed_by_user_id END,
      confirmed_by_email = CASE WHEN next_status_code = 'confirmed' THEN private.current_request_email() ELSE confirmed_by_email END,
      confirmed_at = CASE WHEN next_status_code = 'confirmed' THEN statement_timestamp() ELSE confirmed_at END,
      cancelled_by_user_id = CASE WHEN next_status_code = 'cancelled' THEN private.current_request_user_id() ELSE cancelled_by_user_id END,
      cancelled_by_email = CASE WHEN next_status_code = 'cancelled' THEN private.current_request_email() ELSE cancelled_by_email END,
      cancelled_at = CASE WHEN next_status_code = 'cancelled' THEN statement_timestamp() ELSE cancelled_at END
  WHERE sales_order.id = target_sales_order_id
    AND sales_order.status_lookup_value_id = expected_status_id
  RETURNING sales_order.id INTO updated_id;

  IF updated_id IS NULL THEN
    RAISE EXCEPTION 'Sales order status transition is invalid' USING ERRCODE = '23514';
  END IF;

  RETURN updated_id;
END;
$$;

CREATE OR REPLACE FUNCTION api.submit_sales_order(sales_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  PERFORM private.transition_sales_order(sales_order_id, 'draft', 'submitted');
  PERFORM private.write_sales_order_audit('salesOrder.submitted', sales_order_id, 'Sales order submitted');
  RETURN private.sales_order_json(sales_order_id);
END;
$$;

CREATE OR REPLACE FUNCTION api.confirm_sales_order(sales_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  PERFORM private.transition_sales_order(sales_order_id, 'submitted', 'confirmed');
  PERFORM private.write_sales_order_audit('salesOrder.confirmed', sales_order_id, 'Sales order confirmed');
  RETURN private.sales_order_json(sales_order_id);
END;
$$;

CREATE OR REPLACE FUNCTION api.cancel_sales_order(sales_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  current_status text;
BEGIN
  SELECT private.sales_order_status_code(status_lookup_value_id)
  INTO current_status
  FROM api.sales_orders
  WHERE id = sales_order_id;

  IF current_status NOT IN ('draft', 'submitted', 'confirmed') THEN
    RAISE EXCEPTION 'Sales order cannot be cancelled from current status' USING ERRCODE = '23514';
  END IF;

  UPDATE api.sales_orders sales_order
  SET status_lookup_value_id = private.sales_order_status_id('cancelled'),
      cancelled_by_user_id = private.current_request_user_id(),
      cancelled_by_email = private.current_request_email(),
      cancelled_at = statement_timestamp()
  WHERE sales_order.id = sales_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sales order not found' USING ERRCODE = '02000';
  END IF;

  PERFORM private.write_sales_order_audit('salesOrder.cancelled', sales_order_id, 'Sales order cancelled');
  RETURN private.sales_order_json(sales_order_id);
END;
$$;

CREATE OR REPLACE FUNCTION api.close_sales_order(sales_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  PERFORM private.transition_sales_order(sales_order_id, 'confirmed', 'closed');
  PERFORM private.write_sales_order_audit('salesOrder.closed', sales_order_id, 'Sales order closed');
  RETURN private.sales_order_json(sales_order_id);
END;
$$;

REVOKE ALL ON api.sales_orders FROM PUBLIC;
REVOKE ALL ON api.sales_order_lines FROM PUBLIC;
REVOKE ALL ON api.sales_order_view FROM PUBLIC;
REVOKE ALL ON api.sales_order_line_view FROM PUBLIC;
REVOKE ALL ON api.product_stock_availability_view FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sales_order_status_id(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sales_order_status_code(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sales_order_tax_rate(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.next_sales_order_number() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.validate_sales_order_header(uuid, uuid, uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.validate_sales_order_line(uuid, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.replace_sales_order_lines(uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sales_order_json(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.write_sales_order_audit(text, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.transition_sales_order(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.create_sales_order(uuid, date, date, uuid, uuid, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.update_sales_order(uuid, uuid, date, date, uuid, uuid, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.submit_sales_order(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.confirm_sales_order(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.cancel_sales_order(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.close_sales_order(uuid) FROM PUBLIC;

GRANT USAGE ON SCHEMA api TO erp_admin, erp_manager, erp_sales, erp_warehouse, erp_accountant;
GRANT SELECT ON api.customers, api.products, api.lookup_types, api.lookup_values
TO erp_admin, erp_manager, erp_sales, erp_warehouse, erp_accountant;
GRANT SELECT ON api.warehouses TO erp_admin, erp_manager, erp_sales, erp_warehouse, erp_accountant;
GRANT SELECT ON api.inventory_balances, api.inventory_balance_view
TO erp_admin, erp_manager, erp_sales, erp_warehouse, erp_accountant;
GRANT SELECT ON api.sales_orders, api.sales_order_lines, api.sales_order_view, api.sales_order_line_view, api.product_stock_availability_view
TO erp_admin, erp_manager, erp_sales, erp_warehouse, erp_accountant;
GRANT EXECUTE ON FUNCTION api.create_sales_order(uuid, date, date, uuid, uuid, text, jsonb)
TO erp_admin, erp_manager, erp_sales;
GRANT EXECUTE ON FUNCTION api.update_sales_order(uuid, uuid, date, date, uuid, uuid, text, jsonb)
TO erp_admin, erp_manager, erp_sales;
GRANT EXECUTE ON FUNCTION api.submit_sales_order(uuid)
TO erp_admin, erp_manager, erp_sales;
GRANT EXECUTE ON FUNCTION api.confirm_sales_order(uuid)
TO erp_admin, erp_manager;
GRANT EXECUTE ON FUNCTION api.cancel_sales_order(uuid)
TO erp_admin, erp_manager, erp_sales;
GRANT EXECUTE ON FUNCTION api.close_sales_order(uuid)
TO erp_admin;

GRANT SELECT ON api.warehouses TO erp_sales;
DROP POLICY IF EXISTS warehouses_sales_select_policy ON api.warehouses;
CREATE POLICY warehouses_sales_select_policy
ON api.warehouses
FOR SELECT
TO erp_sales
USING (true);

DROP POLICY IF EXISTS inventory_balances_sales_select_policy ON api.inventory_balances;
CREATE POLICY inventory_balances_sales_select_policy
ON api.inventory_balances
FOR SELECT
TO erp_sales
USING (true);

ALTER TABLE api.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.sales_orders FORCE ROW LEVEL SECURITY;
ALTER TABLE api.sales_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.sales_order_lines FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sales_orders_select_policy ON api.sales_orders;
DROP POLICY IF EXISTS sales_order_lines_select_policy ON api.sales_order_lines;

CREATE POLICY sales_orders_select_policy
ON api.sales_orders
FOR SELECT
TO erp_admin, erp_manager, erp_sales, erp_warehouse, erp_accountant
USING (true);

CREATE POLICY sales_order_lines_select_policy
ON api.sales_order_lines
FOR SELECT
TO erp_admin, erp_manager, erp_sales, erp_warehouse, erp_accountant
USING (true);

COMMIT;
