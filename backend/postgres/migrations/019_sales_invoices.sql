BEGIN;

INSERT INTO api.lookup_types (code, name, description, system, active)
VALUES ('sales_invoice_status', 'وضعیت فاکتور فروش', NULL, true, true)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    active = true;

WITH status_type AS (
  SELECT id FROM api.lookup_types WHERE code = 'sales_invoice_status'
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
    ('issued', 'صادرشده', 20),
    ('cancelled', 'لغوشده', 30)
) AS status(code, label, sort_order)
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
VALUES (
  'documents.salesInvoicePrefix',
  '"SI"'::jsonb,
  'string',
  'documents',
  'پیشوند فاکتور فروش',
  'پیشوند شماره‌گذاری فاکتورهای فروش',
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

CREATE OR REPLACE FUNCTION private.sales_invoice_status_id(status_code text)
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT value.id
  FROM api.lookup_values value
  JOIN api.lookup_types type ON type.id = value.lookup_type_id
  WHERE type.code = 'sales_invoice_status'
    AND value.code = status_code
    AND value.active = true
    AND type.active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.sales_invoice_status_code(status_lookup_value_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT value.code
  FROM api.lookup_values value
  JOIN api.lookup_types type ON type.id = value.lookup_type_id
  WHERE value.id = status_lookup_value_id
    AND type.code = 'sales_invoice_status'
  LIMIT 1;
$$;

CREATE TABLE IF NOT EXISTS api.sales_invoices (
  id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  customer_id uuid NOT NULL REFERENCES api.customers(id) ON DELETE RESTRICT,
  sales_order_id uuid NULL REFERENCES api.sales_orders(id) ON DELETE RESTRICT,
  sales_delivery_id uuid NULL REFERENCES api.sales_deliveries(id) ON DELETE RESTRICT,
  status_lookup_value_id uuid NOT NULL REFERENCES api.lookup_values(id) ON DELETE RESTRICT,
  invoice_date date NOT NULL DEFAULT current_date,
  due_date date NULL,
  currency_lookup_value_id uuid NULL REFERENCES api.lookup_values(id) ON DELETE RESTRICT,
  notes text NULL,
  subtotal_amount numeric(14,2) NOT NULL DEFAULT 0,
  tax_amount numeric(14,2) NOT NULL DEFAULT 0,
  total_amount numeric(14,2) NOT NULL DEFAULT 0,
  issued_by_user_id uuid NULL,
  issued_by_email text NULL,
  issued_at timestamptz NULL,
  cancelled_by_user_id uuid NULL,
  cancelled_by_email text NULL,
  cancelled_at timestamptz NULL,
  created_by_user_id uuid NULL,
  created_by_email text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sales_invoices_number_not_blank CHECK (length(btrim(invoice_number)) > 0),
  CONSTRAINT sales_invoices_due_date_valid CHECK (due_date IS NULL OR due_date >= invoice_date),
  CONSTRAINT sales_invoices_amounts_nonnegative CHECK (
    subtotal_amount >= 0 AND tax_amount >= 0 AND total_amount >= 0
  ),
  CONSTRAINT sales_invoices_issued_metadata CHECK (
    private.sales_invoice_status_code(status_lookup_value_id) <> 'issued'
    OR (issued_by_email IS NOT NULL AND issued_at IS NOT NULL)
  ),
  CONSTRAINT sales_invoices_cancelled_metadata CHECK (
    private.sales_invoice_status_code(status_lookup_value_id) <> 'cancelled'
    OR (cancelled_by_email IS NOT NULL AND cancelled_at IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS api.sales_invoice_lines (
  id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
  sales_invoice_id uuid NOT NULL REFERENCES api.sales_invoices(id) ON DELETE CASCADE,
  sales_delivery_line_id uuid NULL REFERENCES api.sales_delivery_lines(id) ON DELETE RESTRICT,
  sales_order_line_id uuid NULL REFERENCES api.sales_order_lines(id) ON DELETE RESTRICT,
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
  CONSTRAINT sales_invoice_lines_number_positive CHECK (line_number > 0),
  CONSTRAINT sales_invoice_lines_quantity_positive CHECK (quantity > 0),
  CONSTRAINT sales_invoice_lines_amounts_nonnegative CHECK (
    unit_price >= 0 AND tax_amount >= 0 AND line_total >= 0
  ),
  CONSTRAINT sales_invoice_lines_unique_number UNIQUE (sales_invoice_id, line_number)
);

CREATE INDEX IF NOT EXISTS sales_invoices_number_idx ON api.sales_invoices (lower(invoice_number));
CREATE INDEX IF NOT EXISTS sales_invoices_customer_idx ON api.sales_invoices (customer_id);
CREATE INDEX IF NOT EXISTS sales_invoices_sales_order_idx ON api.sales_invoices (sales_order_id);
CREATE INDEX IF NOT EXISTS sales_invoices_sales_delivery_idx ON api.sales_invoices (sales_delivery_id);
CREATE INDEX IF NOT EXISTS sales_invoices_status_idx ON api.sales_invoices (status_lookup_value_id);
CREATE INDEX IF NOT EXISTS sales_invoices_date_idx ON api.sales_invoices (invoice_date DESC);
CREATE INDEX IF NOT EXISTS sales_invoices_due_date_idx ON api.sales_invoices (due_date);
CREATE INDEX IF NOT EXISTS sales_invoices_created_by_idx ON api.sales_invoices (created_by_user_id);
CREATE INDEX IF NOT EXISTS sales_invoice_lines_invoice_idx ON api.sales_invoice_lines (sales_invoice_id);
CREATE INDEX IF NOT EXISTS sales_invoice_lines_delivery_line_idx ON api.sales_invoice_lines (sales_delivery_line_id);
CREATE INDEX IF NOT EXISTS sales_invoice_lines_order_line_idx ON api.sales_invoice_lines (sales_order_line_id);
CREATE INDEX IF NOT EXISTS sales_invoice_lines_product_idx ON api.sales_invoice_lines (product_id);
CREATE INDEX IF NOT EXISTS sales_invoice_lines_line_number_idx ON api.sales_invoice_lines (line_number);

DROP TRIGGER IF EXISTS set_sales_invoices_updated_at ON api.sales_invoices;
CREATE TRIGGER set_sales_invoices_updated_at
BEFORE UPDATE ON api.sales_invoices
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

DROP TRIGGER IF EXISTS set_sales_invoice_lines_updated_at ON api.sales_invoice_lines;
CREATE TRIGGER set_sales_invoice_lines_updated_at
BEFORE UPDATE ON api.sales_invoice_lines
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

CREATE OR REPLACE FUNCTION private.next_sales_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  prefix text;
  next_number integer;
BEGIN
  SELECT COALESCE(NULLIF(setting.setting_value #>> '{}', ''), 'SI')
  INTO prefix
  FROM api.system_settings setting
  WHERE setting.setting_key = 'documents.salesInvoicePrefix'
    AND setting.active = true
  LIMIT 1;

  prefix := COALESCE(prefix, 'SI');

  SELECT COALESCE(
    MAX(
      NULLIF(
        regexp_replace(invoice.invoice_number, '^' || prefix || '-' || to_char(current_date, 'YYYY') || '-([0-9]+)$', '\1'),
        invoice.invoice_number
      )::integer
    ),
    0
  ) + 1
  INTO next_number
  FROM api.sales_invoices invoice
  WHERE invoice.invoice_number LIKE prefix || '-' || to_char(current_date, 'YYYY') || '-%';

  RETURN prefix || '-' || to_char(current_date, 'YYYY') || '-' || lpad(next_number::text, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION private.validate_sales_invoice_header()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  customer_active boolean;
  delivery_customer_id uuid;
  delivery_order_id uuid;
  delivery_status text;
BEGIN
  IF NOT private.lookup_value_has_type(NEW.status_lookup_value_id, 'sales_invoice_status', true) THEN
    RAISE EXCEPTION 'Sales invoice status is invalid' USING ERRCODE = '23514';
  END IF;

  SELECT customer.active
  INTO customer_active
  FROM api.customers customer
  WHERE customer.id = NEW.customer_id;

  IF customer_active IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Invoice customer must be active' USING ERRCODE = '23514';
  END IF;

  IF NEW.currency_lookup_value_id IS NOT NULL
    AND NOT private.lookup_value_has_type(NEW.currency_lookup_value_id, 'currency', true) THEN
    RAISE EXCEPTION 'Invoice currency is invalid' USING ERRCODE = '23514';
  END IF;

  IF NEW.sales_delivery_id IS NOT NULL THEN
    SELECT delivery.customer_id,
           delivery.sales_order_id,
           private.sales_delivery_status_code(delivery.status_lookup_value_id)
    INTO delivery_customer_id, delivery_order_id, delivery_status
    FROM api.sales_deliveries delivery
    WHERE delivery.id = NEW.sales_delivery_id;

    IF delivery_customer_id IS NULL THEN
      RAISE EXCEPTION 'Sales delivery not found' USING ERRCODE = 'P0002';
    END IF;

    IF delivery_status <> 'posted' THEN
      RAISE EXCEPTION 'Only posted sales deliveries can be invoiced' USING ERRCODE = '23514';
    END IF;

    IF delivery_customer_id <> NEW.customer_id THEN
      RAISE EXCEPTION 'Invoice customer must match sales delivery customer' USING ERRCODE = '23514';
    END IF;

    IF NEW.sales_order_id IS NOT NULL AND NEW.sales_order_id <> delivery_order_id THEN
      RAISE EXCEPTION 'Invoice sales order must match sales delivery order' USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.validate_sales_invoice_line()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  invoice_delivery_id uuid;
  delivery_line_product_id uuid;
  delivery_line_order_line_id uuid;
  delivery_line_unit_id uuid;
  product_valid boolean;
BEGIN
  SELECT invoice.sales_delivery_id
  INTO invoice_delivery_id
  FROM api.sales_invoices invoice
  WHERE invoice.id = NEW.sales_invoice_id;

  IF invoice_delivery_id IS NULL THEN
    RAISE EXCEPTION 'Sales invoice not found or not delivery-based' USING ERRCODE = '23514';
  END IF;

  IF NOT private.lookup_value_has_type(NEW.unit_lookup_value_id, 'unit', true) THEN
    RAISE EXCEPTION 'Invoice line unit is invalid' USING ERRCODE = '23514';
  END IF;

  IF NEW.tax_rate_lookup_value_id IS NOT NULL THEN
    PERFORM private.sales_order_tax_rate(NEW.tax_rate_lookup_value_id);
  END IF;

  SELECT product.active AND product.sellable
  INTO product_valid
  FROM api.products product
  WHERE product.id = NEW.product_id;

  IF product_valid IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Invoice line product must be active and sellable' USING ERRCODE = '23514';
  END IF;

  SELECT delivery_line.product_id,
         delivery_line.sales_order_line_id,
         delivery_line.unit_lookup_value_id
  INTO delivery_line_product_id, delivery_line_order_line_id, delivery_line_unit_id
  FROM api.sales_delivery_lines delivery_line
  WHERE delivery_line.id = NEW.sales_delivery_line_id
    AND delivery_line.sales_delivery_id = invoice_delivery_id;

  IF delivery_line_product_id IS NULL THEN
    RAISE EXCEPTION 'Sales delivery line is invalid for this invoice' USING ERRCODE = '23514';
  END IF;

  IF delivery_line_product_id <> NEW.product_id THEN
    RAISE EXCEPTION 'Invoice line product must match delivery line product' USING ERRCODE = '23514';
  END IF;

  IF delivery_line_unit_id <> NEW.unit_lookup_value_id THEN
    RAISE EXCEPTION 'Invoice line unit must match delivery line unit' USING ERRCODE = '23514';
  END IF;

  IF NEW.sales_order_line_id IS NOT NULL AND NEW.sales_order_line_id <> delivery_line_order_line_id THEN
    RAISE EXCEPTION 'Invoice line sales order line must match delivery line' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_sales_invoice_header ON api.sales_invoices;
CREATE TRIGGER validate_sales_invoice_header
BEFORE INSERT OR UPDATE ON api.sales_invoices
FOR EACH ROW
EXECUTE FUNCTION private.validate_sales_invoice_header();

DROP TRIGGER IF EXISTS validate_sales_invoice_line ON api.sales_invoice_lines;
CREATE TRIGGER validate_sales_invoice_line
BEFORE INSERT OR UPDATE ON api.sales_invoice_lines
FOR EACH ROW
EXECUTE FUNCTION private.validate_sales_invoice_line();

CREATE OR REPLACE FUNCTION private.recalculate_sales_invoice_totals(target_sales_invoice_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  UPDATE api.sales_invoices invoice
  SET subtotal_amount = COALESCE((
        SELECT round(sum(line.quantity * line.unit_price)::numeric, 2)
        FROM api.sales_invoice_lines line
        WHERE line.sales_invoice_id = target_sales_invoice_id
      ), 0),
      tax_amount = COALESCE((
        SELECT round(sum(line.tax_amount)::numeric, 2)
        FROM api.sales_invoice_lines line
        WHERE line.sales_invoice_id = target_sales_invoice_id
      ), 0),
      total_amount = COALESCE((
        SELECT round(sum(line.line_total)::numeric, 2)
        FROM api.sales_invoice_lines line
        WHERE line.sales_invoice_id = target_sales_invoice_id
      ), 0)
  WHERE invoice.id = target_sales_invoice_id;
END;
$$;

CREATE OR REPLACE VIEW api.sales_invoice_view
WITH (security_invoker = true)
AS
SELECT
  invoice.id,
  invoice.invoice_number,
  invoice.customer_id,
  customer.code AS customer_code,
  customer.name AS customer_name,
  invoice.sales_order_id,
  sales_order.order_number AS sales_order_number,
  invoice.sales_delivery_id,
  delivery.delivery_number AS sales_delivery_number,
  invoice.status_lookup_value_id,
  status.code AS status_code,
  status.label AS status_label,
  invoice.invoice_date,
  invoice.due_date,
  invoice.currency_lookup_value_id,
  currency.code AS currency_code,
  currency.label AS currency_label,
  invoice.subtotal_amount,
  invoice.tax_amount,
  invoice.total_amount,
  invoice.notes,
  invoice.created_by_email,
  invoice.issued_by_email,
  invoice.issued_at,
  invoice.cancelled_by_email,
  invoice.cancelled_at,
  invoice.created_at,
  invoice.updated_at
FROM api.sales_invoices invoice
JOIN api.customers customer ON customer.id = invoice.customer_id
LEFT JOIN api.sales_orders sales_order ON sales_order.id = invoice.sales_order_id
LEFT JOIN api.sales_deliveries delivery ON delivery.id = invoice.sales_delivery_id
JOIN api.lookup_values status ON status.id = invoice.status_lookup_value_id
LEFT JOIN api.lookup_values currency ON currency.id = invoice.currency_lookup_value_id;

CREATE OR REPLACE VIEW api.sales_invoice_line_view
WITH (security_invoker = true)
AS
SELECT
  line.id,
  line.sales_invoice_id,
  line.line_number,
  line.sales_delivery_line_id,
  line.sales_order_line_id,
  line.product_id,
  product.sku AS product_sku,
  product.name AS product_name,
  line.description,
  line.quantity,
  unit.code AS unit_code,
  unit.label AS unit_label,
  line.unit_price,
  tax_value.code AS tax_rate_code,
  tax_value.label AS tax_rate_label,
  line.tax_amount,
  line.line_total
FROM api.sales_invoice_lines line
JOIN api.products product ON product.id = line.product_id
JOIN api.lookup_values unit ON unit.id = line.unit_lookup_value_id
LEFT JOIN api.lookup_values tax_value ON tax_value.id = line.tax_rate_lookup_value_id;

CREATE OR REPLACE VIEW api.sales_delivery_line_invoicing_view
WITH (security_invoker = true)
AS
SELECT
  delivery_line.id AS sales_delivery_line_id,
  delivery_line.sales_delivery_id,
  delivery_line.sales_order_line_id,
  delivery_line.product_id,
  product.sku AS product_sku,
  product.name AS product_name,
  delivery_line.shipped_quantity AS delivered_quantity,
  COALESCE(SUM(invoice_line.quantity) FILTER (
    WHERE invoice_status.code <> 'cancelled'
  ), 0)::numeric(18,4) AS invoiced_quantity,
  GREATEST(
    delivery_line.shipped_quantity - COALESCE(SUM(invoice_line.quantity) FILTER (
      WHERE invoice_status.code <> 'cancelled'
    ), 0),
    0
  )::numeric(18,4) AS remaining_quantity,
  delivery_line.unit_lookup_value_id,
  unit.code AS unit_code,
  unit.label AS unit_label
FROM api.sales_delivery_lines delivery_line
JOIN api.products product ON product.id = delivery_line.product_id
JOIN api.lookup_values unit ON unit.id = delivery_line.unit_lookup_value_id
LEFT JOIN api.sales_invoice_lines invoice_line ON invoice_line.sales_delivery_line_id = delivery_line.id
LEFT JOIN api.sales_invoices invoice ON invoice.id = invoice_line.sales_invoice_id
LEFT JOIN api.lookup_values invoice_status ON invoice_status.id = invoice.status_lookup_value_id
GROUP BY
  delivery_line.id,
  delivery_line.sales_delivery_id,
  delivery_line.sales_order_line_id,
  delivery_line.product_id,
  product.sku,
  product.name,
  delivery_line.shipped_quantity,
  delivery_line.unit_lookup_value_id,
  unit.code,
  unit.label;

CREATE OR REPLACE VIEW api.sales_delivery_invoicing_view
WITH (security_invoker = true)
AS
SELECT
  delivery.id AS sales_delivery_id,
  delivery.delivery_number,
  delivery.sales_order_id,
  sales_order.order_number AS sales_order_number,
  delivery.customer_id,
  customer.code AS customer_code,
  customer.name AS customer_name,
  SUM(progress.delivered_quantity)::numeric(18,4) AS delivered_quantity,
  SUM(progress.invoiced_quantity)::numeric(18,4) AS invoiced_quantity,
  SUM(progress.remaining_quantity)::numeric(18,4) AS remaining_quantity
FROM api.sales_deliveries delivery
JOIN api.sales_orders sales_order ON sales_order.id = delivery.sales_order_id
JOIN api.customers customer ON customer.id = delivery.customer_id
LEFT JOIN api.sales_delivery_line_invoicing_view progress ON progress.sales_delivery_id = delivery.id
GROUP BY delivery.id, delivery.delivery_number, delivery.sales_order_id, sales_order.order_number, delivery.customer_id, customer.code, customer.name;

CREATE OR REPLACE FUNCTION private.sales_invoice_json(target_sales_invoice_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT jsonb_build_object(
    'id', invoice.id,
    'invoiceNumber', invoice.invoice_number,
    'customerId', invoice.customer_id,
    'customerCode', invoice.customer_code,
    'customerName', invoice.customer_name,
    'salesOrderId', invoice.sales_order_id,
    'salesOrderNumber', invoice.sales_order_number,
    'salesDeliveryId', invoice.sales_delivery_id,
    'salesDeliveryNumber', invoice.sales_delivery_number,
    'statusCode', invoice.status_code,
    'statusLabel', invoice.status_label,
    'invoiceDate', invoice.invoice_date,
    'dueDate', invoice.due_date,
    'currencyLookupValueId', invoice.currency_lookup_value_id,
    'currencyCode', invoice.currency_code,
    'currencyLabel', invoice.currency_label,
    'subtotalAmount', invoice.subtotal_amount,
    'taxAmount', invoice.tax_amount,
    'totalAmount', invoice.total_amount,
    'notes', invoice.notes,
    'createdByEmail', invoice.created_by_email,
    'issuedByEmail', invoice.issued_by_email,
    'issuedAt', invoice.issued_at,
    'cancelledByEmail', invoice.cancelled_by_email,
    'cancelledAt', invoice.cancelled_at,
    'createdAt', invoice.created_at,
    'updatedAt', invoice.updated_at,
    'lines', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', line.id,
            'salesInvoiceId', line.sales_invoice_id,
            'lineNumber', line.line_number,
            'salesDeliveryLineId', line.sales_delivery_line_id,
            'salesOrderLineId', line.sales_order_line_id,
            'productId', line.product_id,
            'productSku', line.product_sku,
            'productName', line.product_name,
            'description', line.description,
            'quantity', line.quantity,
            'unitCode', line.unit_code,
            'unitLabel', line.unit_label,
            'unitPrice', line.unit_price,
            'taxRateCode', line.tax_rate_code,
            'taxRateLabel', line.tax_rate_label,
            'taxAmount', line.tax_amount,
            'lineTotal', line.line_total
          )
          ORDER BY line.line_number
        )
        FROM api.sales_invoice_line_view line
        WHERE line.sales_invoice_id = invoice.id
      ),
      '[]'::jsonb
    )
  )
  FROM api.sales_invoice_view invoice
  WHERE invoice.id = target_sales_invoice_id;
$$;

CREATE OR REPLACE FUNCTION api.create_sales_invoice_from_delivery(
  sales_delivery_id uuid,
  invoice_date date DEFAULT current_date,
  due_date date DEFAULT NULL,
  notes text DEFAULT NULL,
  lines jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  target_delivery api.sales_deliveries%ROWTYPE;
  delivery_status text;
  target_order api.sales_orders%ROWTYPE;
  invoice_id uuid;
  line_item jsonb;
  delivery_line api.sales_delivery_lines%ROWTYPE;
  invoice_line_number integer := 0;
  parsed_quantity numeric(18,4);
  parsed_unit_price numeric(14,2);
  parsed_tax_rate_lookup_value_id uuid;
  parsed_tax_amount numeric(14,2);
  parsed_line_total numeric(14,2);
  remaining_quantity numeric(18,4);
BEGIN
  IF jsonb_typeof(lines) <> 'array' OR jsonb_array_length(lines) = 0 THEN
    RETURN private.inventory_error_response('23514', 'At least one invoice line is required');
  END IF;

  SELECT * INTO target_delivery
  FROM api.sales_deliveries delivery
  WHERE delivery.id = create_sales_invoice_from_delivery.sales_delivery_id;

  IF NOT FOUND THEN
    RETURN private.inventory_error_response('P0002', 'Sales delivery not found', '404');
  END IF;

  delivery_status := private.sales_delivery_status_code(target_delivery.status_lookup_value_id);

  IF delivery_status <> 'posted' THEN
    RETURN private.inventory_error_response('23514', 'Only posted sales deliveries can be invoiced');
  END IF;

  SELECT * INTO target_order
  FROM api.sales_orders sales_order
  WHERE sales_order.id = target_delivery.sales_order_id;

  INSERT INTO api.sales_invoices (
    invoice_number,
    customer_id,
    sales_order_id,
    sales_delivery_id,
    status_lookup_value_id,
    invoice_date,
    due_date,
    currency_lookup_value_id,
    notes,
    created_by_user_id,
    created_by_email
  )
  VALUES (
    private.next_sales_invoice_number(),
    target_delivery.customer_id,
    target_delivery.sales_order_id,
    target_delivery.id,
    private.sales_invoice_status_id('draft'),
    COALESCE(invoice_date, current_date),
    due_date,
    target_order.currency_lookup_value_id,
    NULLIF(btrim(notes), ''),
    private.current_request_user_id(),
    private.current_request_email()
  )
  RETURNING id INTO invoice_id;

  FOR line_item IN SELECT value FROM jsonb_array_elements(lines)
  LOOP
    invoice_line_number := invoice_line_number + 1;
    parsed_quantity := NULLIF(line_item->>'quantity', '')::numeric;
    parsed_unit_price := COALESCE(NULLIF(COALESCE(line_item->>'unitPrice', line_item->>'unit_price'), '')::numeric, 0);
    parsed_tax_rate_lookup_value_id := NULLIF(COALESCE(line_item->>'taxRateLookupValueId', line_item->>'tax_rate_lookup_value_id'), '')::uuid;

    IF parsed_quantity IS NULL OR parsed_quantity <= 0 THEN
      DELETE FROM api.sales_invoices WHERE id = invoice_id;
      RETURN private.inventory_error_response('23514', 'Invoice quantity must be greater than zero');
    END IF;

    SELECT * INTO delivery_line
    FROM api.sales_delivery_lines line
    WHERE line.id = NULLIF(COALESCE(line_item->>'salesDeliveryLineId', line_item->>'sales_delivery_line_id'), '')::uuid
      AND line.sales_delivery_id = target_delivery.id;

    IF NOT FOUND THEN
      DELETE FROM api.sales_invoices WHERE id = invoice_id;
      RETURN private.inventory_error_response('23514', 'Sales delivery line is invalid');
    END IF;

    SELECT progress.remaining_quantity
    INTO remaining_quantity
    FROM api.sales_delivery_line_invoicing_view progress
    WHERE progress.sales_delivery_line_id = delivery_line.id;

    IF parsed_quantity > remaining_quantity THEN
      PERFORM private.write_audit_log(
        'salesInvoice.overInvoiceBlocked',
        'salesInvoice',
        'blocked',
        'Over-invoicing was blocked.',
        target_delivery.id::text,
        jsonb_build_object(
          'sales_delivery_id', target_delivery.id,
          'sales_delivery_line_id', delivery_line.id,
          'requested_quantity', parsed_quantity,
          'remaining_quantity', remaining_quantity
        )
      );
      DELETE FROM api.sales_invoices WHERE id = invoice_id;
      RETURN private.inventory_error_response('23514', 'Invoice quantity exceeds remaining delivered quantity');
    END IF;

    parsed_tax_amount := round((parsed_quantity * parsed_unit_price * private.sales_order_tax_rate(parsed_tax_rate_lookup_value_id))::numeric, 2);
    parsed_line_total := round((parsed_quantity * parsed_unit_price + parsed_tax_amount)::numeric, 2);

    INSERT INTO api.sales_invoice_lines (
      sales_invoice_id,
      sales_delivery_line_id,
      sales_order_line_id,
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
      invoice_id,
      delivery_line.id,
      delivery_line.sales_order_line_id,
      invoice_line_number,
      delivery_line.product_id,
      NULLIF(btrim(COALESCE(line_item->>'description', '')), ''),
      parsed_quantity,
      delivery_line.unit_lookup_value_id,
      parsed_unit_price,
      parsed_tax_rate_lookup_value_id,
      parsed_tax_amount,
      parsed_line_total
    );
  END LOOP;

  PERFORM private.recalculate_sales_invoice_totals(invoice_id);

  PERFORM private.write_audit_log(
    'salesInvoice.created',
    'salesInvoice',
    'success',
    'Sales invoice was created from a delivery.',
    invoice_id::text,
    jsonb_build_object(
      'invoice_number', (SELECT invoice_number FROM api.sales_invoices WHERE id = invoice_id),
      'sales_delivery_id', target_delivery.id,
      'sales_delivery_number', target_delivery.delivery_number,
      'sales_order_id', target_delivery.sales_order_id,
      'sales_order_number', target_order.order_number,
      'customer_id', target_delivery.customer_id,
      'total_amount', (SELECT total_amount FROM api.sales_invoices WHERE id = invoice_id),
      'line_count', invoice_line_number
    )
  );

  RETURN private.sales_invoice_json(invoice_id);
END;
$$;

CREATE OR REPLACE FUNCTION api.issue_sales_invoice(sales_invoice_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  target_invoice api.sales_invoices%ROWTYPE;
BEGIN
  SELECT * INTO target_invoice
  FROM api.sales_invoices invoice
  WHERE invoice.id = issue_sales_invoice.sales_invoice_id;

  IF NOT FOUND THEN
    RETURN private.inventory_error_response('P0002', 'Sales invoice not found', '404');
  END IF;

  IF private.sales_invoice_status_code(target_invoice.status_lookup_value_id) <> 'draft' THEN
    RETURN private.inventory_error_response('23514', 'Only draft sales invoices can be issued');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM api.sales_invoice_lines line WHERE line.sales_invoice_id = target_invoice.id
  ) THEN
    RETURN private.inventory_error_response('23514', 'Sales invoice must have at least one line');
  END IF;

  UPDATE api.sales_invoices invoice
  SET status_lookup_value_id = private.sales_invoice_status_id('issued'),
      issued_by_user_id = private.current_request_user_id(),
      issued_by_email = private.current_request_email(),
      issued_at = statement_timestamp()
  WHERE invoice.id = target_invoice.id;

  PERFORM private.write_audit_log(
    'salesInvoice.issued',
    'salesInvoice',
    'success',
    'Sales invoice was issued.',
    target_invoice.id::text,
    jsonb_build_object(
      'invoice_number', target_invoice.invoice_number,
      'sales_delivery_id', target_invoice.sales_delivery_id,
      'sales_order_id', target_invoice.sales_order_id,
      'customer_id', target_invoice.customer_id,
      'total_amount', target_invoice.total_amount
    )
  );

  RETURN private.sales_invoice_json(target_invoice.id);
END;
$$;

CREATE OR REPLACE FUNCTION api.cancel_sales_invoice(sales_invoice_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  target_invoice api.sales_invoices%ROWTYPE;
  current_status text;
BEGIN
  SELECT * INTO target_invoice
  FROM api.sales_invoices invoice
  WHERE invoice.id = cancel_sales_invoice.sales_invoice_id;

  IF NOT FOUND THEN
    RETURN private.inventory_error_response('P0002', 'Sales invoice not found', '404');
  END IF;

  current_status := private.sales_invoice_status_code(target_invoice.status_lookup_value_id);

  IF current_status = 'cancelled' THEN
    RETURN private.inventory_error_response('23514', 'Sales invoice is already cancelled');
  END IF;

  UPDATE api.sales_invoices invoice
  SET status_lookup_value_id = private.sales_invoice_status_id('cancelled'),
      cancelled_by_user_id = private.current_request_user_id(),
      cancelled_by_email = private.current_request_email(),
      cancelled_at = statement_timestamp()
  WHERE invoice.id = target_invoice.id;

  PERFORM private.write_audit_log(
    'salesInvoice.cancelled',
    'salesInvoice',
    'success',
    'Sales invoice was cancelled.',
    target_invoice.id::text,
    jsonb_build_object(
      'invoice_number', target_invoice.invoice_number,
      'sales_delivery_id', target_invoice.sales_delivery_id,
      'sales_order_id', target_invoice.sales_order_id,
      'customer_id', target_invoice.customer_id,
      'total_amount', target_invoice.total_amount
    )
  );

  RETURN private.sales_invoice_json(target_invoice.id);
END;
$$;

REVOKE ALL ON TABLE api.sales_invoices FROM PUBLIC;
REVOKE ALL ON TABLE api.sales_invoice_lines FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sales_invoice_status_id(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sales_invoice_status_code(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.next_sales_invoice_number() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.validate_sales_invoice_header() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.validate_sales_invoice_line() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.recalculate_sales_invoice_totals(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sales_invoice_json(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.create_sales_invoice_from_delivery(uuid, date, date, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.issue_sales_invoice(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.cancel_sales_invoice(uuid) FROM PUBLIC;

GRANT USAGE ON SCHEMA api TO erp_admin, erp_manager, erp_accountant, erp_sales, erp_warehouse;
GRANT SELECT ON api.customers, api.products, api.lookup_types, api.lookup_values
TO erp_admin, erp_manager, erp_accountant, erp_sales, erp_warehouse;
GRANT SELECT ON api.sales_orders, api.sales_order_lines, api.sales_order_view, api.sales_order_line_view
TO erp_admin, erp_manager, erp_accountant, erp_sales, erp_warehouse;
GRANT SELECT ON api.sales_deliveries, api.sales_delivery_lines, api.sales_delivery_view, api.sales_delivery_line_view
TO erp_admin, erp_manager, erp_accountant, erp_sales, erp_warehouse;
GRANT SELECT ON api.sales_invoices, api.sales_invoice_lines, api.sales_invoice_view, api.sales_invoice_line_view
TO erp_admin, erp_manager, erp_accountant, erp_sales, erp_warehouse;
GRANT SELECT ON api.sales_delivery_invoicing_view, api.sales_delivery_line_invoicing_view
TO erp_admin, erp_manager, erp_accountant, erp_sales, erp_warehouse;
GRANT EXECUTE ON FUNCTION api.create_sales_invoice_from_delivery(uuid, date, date, text, jsonb)
TO erp_admin, erp_manager, erp_accountant, erp_sales;
GRANT EXECUTE ON FUNCTION api.issue_sales_invoice(uuid)
TO erp_admin, erp_manager, erp_accountant;
GRANT EXECUTE ON FUNCTION api.cancel_sales_invoice(uuid)
TO erp_admin, erp_manager, erp_accountant;

ALTER TABLE api.sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.sales_invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.sales_invoices FORCE ROW LEVEL SECURITY;
ALTER TABLE api.sales_invoice_lines FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sales_invoices_select_policy ON api.sales_invoices;
DROP POLICY IF EXISTS sales_invoice_lines_select_policy ON api.sales_invoice_lines;

CREATE POLICY sales_invoices_select_policy
ON api.sales_invoices
FOR SELECT
TO erp_admin, erp_manager, erp_accountant, erp_sales, erp_warehouse
USING (true);

CREATE POLICY sales_invoice_lines_select_policy
ON api.sales_invoice_lines
FOR SELECT
TO erp_admin, erp_manager, erp_accountant, erp_sales, erp_warehouse
USING (true);

COMMIT;
