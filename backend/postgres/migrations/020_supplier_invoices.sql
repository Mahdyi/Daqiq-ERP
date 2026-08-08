BEGIN;

INSERT INTO api.lookup_types (code, name, description, system, active)
VALUES ('supplier_invoice_status', 'وضعیت فاکتور تأمین‌کننده', NULL, true, true)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    active = true;

WITH status_type AS (
  SELECT id FROM api.lookup_types WHERE code = 'supplier_invoice_status'
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
  'documents.supplierInvoicePrefix',
  '"PI"'::jsonb,
  'string',
  'documents',
  'پیشوند فاکتور تأمین‌کننده',
  'پیشوند شماره‌گذاری داخلی فاکتورهای تأمین‌کننده',
  true,
  true
)
ON CONFLICT (setting_key) DO UPDATE
SET label = EXCLUDED.label,
    description = EXCLUDED.description,
    active = true;

UPDATE api.feature_flags
SET enabled = true
WHERE flag_key = 'purchasing.enabled';

CREATE OR REPLACE FUNCTION private.supplier_invoice_status_id(status_code text)
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT value.id
  FROM api.lookup_values value
  JOIN api.lookup_types type ON type.id = value.lookup_type_id
  WHERE type.code = 'supplier_invoice_status'
    AND value.code = status_code
    AND value.active = true
    AND type.active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.supplier_invoice_status_code(status_lookup_value_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT value.code
  FROM api.lookup_values value
  JOIN api.lookup_types type ON type.id = value.lookup_type_id
  WHERE value.id = status_lookup_value_id
    AND type.code = 'supplier_invoice_status'
  LIMIT 1;
$$;

CREATE TABLE IF NOT EXISTS api.supplier_invoices (
  id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  supplier_invoice_number text NULL,
  supplier_id uuid NOT NULL REFERENCES api.suppliers(id) ON DELETE RESTRICT,
  purchase_order_id uuid NULL REFERENCES api.purchase_orders(id) ON DELETE RESTRICT,
  goods_receipt_id uuid NULL REFERENCES api.goods_receipts(id) ON DELETE RESTRICT,
  status_lookup_value_id uuid NOT NULL REFERENCES api.lookup_values(id) ON DELETE RESTRICT,
  invoice_date date NOT NULL DEFAULT current_date,
  due_date date NULL,
  currency_lookup_value_id uuid NULL REFERENCES api.lookup_values(id) ON DELETE RESTRICT,
  notes text NULL,
  subtotal_amount numeric(14,2) NOT NULL DEFAULT 0,
  tax_amount numeric(14,2) NOT NULL DEFAULT 0,
  total_amount numeric(14,2) NOT NULL DEFAULT 0,
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
  CONSTRAINT supplier_invoices_number_not_blank CHECK (length(btrim(invoice_number)) > 0),
  CONSTRAINT supplier_invoices_supplier_number_not_blank CHECK (
    supplier_invoice_number IS NULL OR length(btrim(supplier_invoice_number)) > 0
  ),
  CONSTRAINT supplier_invoices_due_date_valid CHECK (due_date IS NULL OR due_date >= invoice_date),
  CONSTRAINT supplier_invoices_amounts_nonnegative CHECK (
    subtotal_amount >= 0 AND tax_amount >= 0 AND total_amount >= 0
  ),
  CONSTRAINT supplier_invoices_posted_metadata CHECK (
    private.supplier_invoice_status_code(status_lookup_value_id) <> 'posted'
    OR (posted_by_email IS NOT NULL AND posted_at IS NOT NULL)
  ),
  CONSTRAINT supplier_invoices_cancelled_metadata CHECK (
    private.supplier_invoice_status_code(status_lookup_value_id) <> 'cancelled'
    OR (cancelled_by_email IS NOT NULL AND cancelled_at IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS supplier_invoices_supplier_number_unique_idx
ON api.supplier_invoices (supplier_id, lower(supplier_invoice_number))
WHERE supplier_invoice_number IS NOT NULL;

CREATE TABLE IF NOT EXISTS api.supplier_invoice_lines (
  id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
  supplier_invoice_id uuid NOT NULL REFERENCES api.supplier_invoices(id) ON DELETE CASCADE,
  goods_receipt_line_id uuid NULL REFERENCES api.goods_receipt_lines(id) ON DELETE RESTRICT,
  purchase_order_line_id uuid NULL REFERENCES api.purchase_order_lines(id) ON DELETE RESTRICT,
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
  CONSTRAINT supplier_invoice_lines_number_positive CHECK (line_number > 0),
  CONSTRAINT supplier_invoice_lines_quantity_positive CHECK (quantity > 0),
  CONSTRAINT supplier_invoice_lines_amounts_nonnegative CHECK (
    unit_price >= 0 AND tax_amount >= 0 AND line_total >= 0
  ),
  CONSTRAINT supplier_invoice_lines_unique_number UNIQUE (supplier_invoice_id, line_number)
);

CREATE INDEX IF NOT EXISTS supplier_invoices_number_idx ON api.supplier_invoices (lower(invoice_number));
CREATE INDEX IF NOT EXISTS supplier_invoices_supplier_number_idx ON api.supplier_invoices (lower(supplier_invoice_number));
CREATE INDEX IF NOT EXISTS supplier_invoices_supplier_idx ON api.supplier_invoices (supplier_id);
CREATE INDEX IF NOT EXISTS supplier_invoices_purchase_order_idx ON api.supplier_invoices (purchase_order_id);
CREATE INDEX IF NOT EXISTS supplier_invoices_goods_receipt_idx ON api.supplier_invoices (goods_receipt_id);
CREATE INDEX IF NOT EXISTS supplier_invoices_status_idx ON api.supplier_invoices (status_lookup_value_id);
CREATE INDEX IF NOT EXISTS supplier_invoices_date_idx ON api.supplier_invoices (invoice_date DESC);
CREATE INDEX IF NOT EXISTS supplier_invoices_due_date_idx ON api.supplier_invoices (due_date);
CREATE INDEX IF NOT EXISTS supplier_invoices_created_by_idx ON api.supplier_invoices (created_by_user_id);
CREATE INDEX IF NOT EXISTS supplier_invoice_lines_invoice_idx ON api.supplier_invoice_lines (supplier_invoice_id);
CREATE INDEX IF NOT EXISTS supplier_invoice_lines_receipt_line_idx ON api.supplier_invoice_lines (goods_receipt_line_id);
CREATE INDEX IF NOT EXISTS supplier_invoice_lines_order_line_idx ON api.supplier_invoice_lines (purchase_order_line_id);
CREATE INDEX IF NOT EXISTS supplier_invoice_lines_product_idx ON api.supplier_invoice_lines (product_id);
CREATE INDEX IF NOT EXISTS supplier_invoice_lines_line_number_idx ON api.supplier_invoice_lines (line_number);

DROP TRIGGER IF EXISTS set_supplier_invoices_updated_at ON api.supplier_invoices;
CREATE TRIGGER set_supplier_invoices_updated_at
BEFORE UPDATE ON api.supplier_invoices
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

DROP TRIGGER IF EXISTS set_supplier_invoice_lines_updated_at ON api.supplier_invoice_lines;
CREATE TRIGGER set_supplier_invoice_lines_updated_at
BEFORE UPDATE ON api.supplier_invoice_lines
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

CREATE OR REPLACE FUNCTION private.next_supplier_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  prefix text;
  next_number integer;
BEGIN
  SELECT COALESCE(NULLIF(setting.setting_value #>> '{}', ''), 'PI')
  INTO prefix
  FROM api.system_settings setting
  WHERE setting.setting_key = 'documents.supplierInvoicePrefix'
    AND setting.active = true
  LIMIT 1;

  prefix := COALESCE(prefix, 'PI');

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
  FROM api.supplier_invoices invoice
  WHERE invoice.invoice_number LIKE prefix || '-' || to_char(current_date, 'YYYY') || '-%';

  RETURN prefix || '-' || to_char(current_date, 'YYYY') || '-' || lpad(next_number::text, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION private.validate_supplier_invoice_header()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  supplier_active boolean;
  receipt_supplier_id uuid;
  receipt_order_id uuid;
  receipt_status text;
  order_currency_id uuid;
BEGIN
  IF NOT private.lookup_value_has_type(NEW.status_lookup_value_id, 'supplier_invoice_status', true) THEN
    RAISE EXCEPTION 'Supplier invoice status is invalid' USING ERRCODE = '23514';
  END IF;

  SELECT supplier.active
  INTO supplier_active
  FROM api.suppliers supplier
  WHERE supplier.id = NEW.supplier_id;

  IF supplier_active IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Invoice supplier must be active' USING ERRCODE = '23514';
  END IF;

  IF NEW.currency_lookup_value_id IS NOT NULL
    AND NOT private.lookup_value_has_type(NEW.currency_lookup_value_id, 'currency', true) THEN
    RAISE EXCEPTION 'Supplier invoice currency is invalid' USING ERRCODE = '23514';
  END IF;

  IF NEW.goods_receipt_id IS NOT NULL THEN
    SELECT receipt.supplier_id,
           receipt.purchase_order_id,
           private.goods_receipt_status_code(receipt.status_lookup_value_id)
    INTO receipt_supplier_id, receipt_order_id, receipt_status
    FROM api.goods_receipts receipt
    WHERE receipt.id = NEW.goods_receipt_id;

    IF receipt_supplier_id IS NULL THEN
      RAISE EXCEPTION 'Goods receipt not found' USING ERRCODE = 'P0002';
    END IF;

    IF receipt_status <> 'posted' THEN
      RAISE EXCEPTION 'Only posted goods receipts can be invoiced' USING ERRCODE = '23514';
    END IF;

    IF receipt_supplier_id <> NEW.supplier_id THEN
      RAISE EXCEPTION 'Invoice supplier must match goods receipt supplier' USING ERRCODE = '23514';
    END IF;

    IF NEW.purchase_order_id IS NOT NULL AND NEW.purchase_order_id <> receipt_order_id THEN
      RAISE EXCEPTION 'Invoice purchase order must match goods receipt order' USING ERRCODE = '23514';
    END IF;

    SELECT purchase_order.currency_lookup_value_id
    INTO order_currency_id
    FROM api.purchase_orders purchase_order
    WHERE purchase_order.id = receipt_order_id;

    IF NEW.currency_lookup_value_id IS NOT NULL
      AND order_currency_id IS NOT NULL
      AND NEW.currency_lookup_value_id <> order_currency_id THEN
      RAISE EXCEPTION 'Supplier invoice currency must match purchase order currency' USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.validate_supplier_invoice_line()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  invoice_receipt_id uuid;
  receipt_line_product_id uuid;
  receipt_line_order_line_id uuid;
  receipt_line_unit_id uuid;
  product_valid boolean;
BEGIN
  SELECT invoice.goods_receipt_id
  INTO invoice_receipt_id
  FROM api.supplier_invoices invoice
  WHERE invoice.id = NEW.supplier_invoice_id;

  IF invoice_receipt_id IS NULL THEN
    RAISE EXCEPTION 'Supplier invoice not found or not receipt-based' USING ERRCODE = '23514';
  END IF;

  IF NOT private.lookup_value_has_type(NEW.unit_lookup_value_id, 'unit', true) THEN
    RAISE EXCEPTION 'Supplier invoice line unit is invalid' USING ERRCODE = '23514';
  END IF;

  IF NEW.tax_rate_lookup_value_id IS NOT NULL THEN
    PERFORM private.purchase_order_tax_rate(NEW.tax_rate_lookup_value_id);
  END IF;

  SELECT product.active AND product.purchasable
  INTO product_valid
  FROM api.products product
  WHERE product.id = NEW.product_id;

  IF product_valid IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Supplier invoice line product must be active and purchasable' USING ERRCODE = '23514';
  END IF;

  SELECT receipt_line.product_id,
         receipt_line.purchase_order_line_id,
         receipt_line.unit_lookup_value_id
  INTO receipt_line_product_id, receipt_line_order_line_id, receipt_line_unit_id
  FROM api.goods_receipt_lines receipt_line
  WHERE receipt_line.id = NEW.goods_receipt_line_id
    AND receipt_line.goods_receipt_id = invoice_receipt_id;

  IF receipt_line_product_id IS NULL THEN
    RAISE EXCEPTION 'Goods receipt line is invalid for this invoice' USING ERRCODE = '23514';
  END IF;

  IF receipt_line_product_id <> NEW.product_id THEN
    RAISE EXCEPTION 'Invoice line product must match goods receipt line product' USING ERRCODE = '23514';
  END IF;

  IF receipt_line_unit_id <> NEW.unit_lookup_value_id THEN
    RAISE EXCEPTION 'Invoice line unit must match goods receipt line unit' USING ERRCODE = '23514';
  END IF;

  IF NEW.purchase_order_line_id IS NOT NULL AND NEW.purchase_order_line_id <> receipt_line_order_line_id THEN
    RAISE EXCEPTION 'Invoice line purchase order line must match goods receipt line' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_supplier_invoice_header ON api.supplier_invoices;
CREATE TRIGGER validate_supplier_invoice_header
BEFORE INSERT OR UPDATE ON api.supplier_invoices
FOR EACH ROW
EXECUTE FUNCTION private.validate_supplier_invoice_header();

DROP TRIGGER IF EXISTS validate_supplier_invoice_line ON api.supplier_invoice_lines;
CREATE TRIGGER validate_supplier_invoice_line
BEFORE INSERT OR UPDATE ON api.supplier_invoice_lines
FOR EACH ROW
EXECUTE FUNCTION private.validate_supplier_invoice_line();

CREATE OR REPLACE FUNCTION private.recalculate_supplier_invoice_totals(target_supplier_invoice_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  UPDATE api.supplier_invoices invoice
  SET subtotal_amount = COALESCE((
        SELECT round(sum(line.quantity * line.unit_price)::numeric, 2)
        FROM api.supplier_invoice_lines line
        WHERE line.supplier_invoice_id = target_supplier_invoice_id
      ), 0),
      tax_amount = COALESCE((
        SELECT round(sum(line.tax_amount)::numeric, 2)
        FROM api.supplier_invoice_lines line
        WHERE line.supplier_invoice_id = target_supplier_invoice_id
      ), 0),
      total_amount = COALESCE((
        SELECT round(sum(line.line_total)::numeric, 2)
        FROM api.supplier_invoice_lines line
        WHERE line.supplier_invoice_id = target_supplier_invoice_id
      ), 0)
  WHERE invoice.id = target_supplier_invoice_id;
END;
$$;

CREATE OR REPLACE VIEW api.supplier_invoice_view
WITH (security_invoker = true)
AS
SELECT
  invoice.id,
  invoice.invoice_number,
  invoice.supplier_invoice_number,
  invoice.supplier_id,
  supplier.code AS supplier_code,
  supplier.name AS supplier_name,
  invoice.purchase_order_id,
  purchase_order.order_number AS purchase_order_number,
  invoice.goods_receipt_id,
  receipt.receipt_number AS goods_receipt_number,
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
  invoice.posted_by_email,
  invoice.posted_at,
  invoice.cancelled_by_email,
  invoice.cancelled_at,
  invoice.created_at,
  invoice.updated_at
FROM api.supplier_invoices invoice
JOIN api.suppliers supplier ON supplier.id = invoice.supplier_id
LEFT JOIN api.purchase_orders purchase_order ON purchase_order.id = invoice.purchase_order_id
LEFT JOIN api.goods_receipts receipt ON receipt.id = invoice.goods_receipt_id
JOIN api.lookup_values status ON status.id = invoice.status_lookup_value_id
LEFT JOIN api.lookup_values currency ON currency.id = invoice.currency_lookup_value_id;

CREATE OR REPLACE VIEW api.supplier_invoice_line_view
WITH (security_invoker = true)
AS
SELECT
  line.id,
  line.supplier_invoice_id,
  line.line_number,
  line.goods_receipt_line_id,
  line.purchase_order_line_id,
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
FROM api.supplier_invoice_lines line
JOIN api.products product ON product.id = line.product_id
JOIN api.lookup_values unit ON unit.id = line.unit_lookup_value_id
LEFT JOIN api.lookup_values tax_value ON tax_value.id = line.tax_rate_lookup_value_id;

CREATE OR REPLACE VIEW api.goods_receipt_line_supplier_invoicing_view
WITH (security_invoker = true)
AS
SELECT
  receipt_line.id AS goods_receipt_line_id,
  receipt_line.goods_receipt_id,
  receipt_line.purchase_order_line_id,
  receipt_line.product_id,
  product.sku AS product_sku,
  product.name AS product_name,
  receipt_line.received_quantity,
  COALESCE(SUM(invoice_line.quantity) FILTER (
    WHERE invoice_status.code <> 'cancelled'
  ), 0)::numeric(18,4) AS invoiced_quantity,
  GREATEST(
    receipt_line.received_quantity - COALESCE(SUM(invoice_line.quantity) FILTER (
      WHERE invoice_status.code <> 'cancelled'
    ), 0),
    0
  )::numeric(18,4) AS remaining_quantity,
  receipt_line.unit_lookup_value_id,
  unit.code AS unit_code,
  unit.label AS unit_label
FROM api.goods_receipt_lines receipt_line
JOIN api.products product ON product.id = receipt_line.product_id
JOIN api.lookup_values unit ON unit.id = receipt_line.unit_lookup_value_id
LEFT JOIN api.supplier_invoice_lines invoice_line ON invoice_line.goods_receipt_line_id = receipt_line.id
LEFT JOIN api.supplier_invoices invoice ON invoice.id = invoice_line.supplier_invoice_id
LEFT JOIN api.lookup_values invoice_status ON invoice_status.id = invoice.status_lookup_value_id
GROUP BY
  receipt_line.id,
  receipt_line.goods_receipt_id,
  receipt_line.purchase_order_line_id,
  receipt_line.product_id,
  product.sku,
  product.name,
  receipt_line.received_quantity,
  receipt_line.unit_lookup_value_id,
  unit.code,
  unit.label;

CREATE OR REPLACE VIEW api.goods_receipt_supplier_invoicing_view
WITH (security_invoker = true)
AS
SELECT
  receipt.id AS goods_receipt_id,
  receipt.receipt_number AS goods_receipt_number,
  receipt.purchase_order_id,
  purchase_order.order_number AS purchase_order_number,
  receipt.supplier_id,
  supplier.code AS supplier_code,
  supplier.name AS supplier_name,
  SUM(progress.received_quantity)::numeric(18,4) AS received_quantity,
  SUM(progress.invoiced_quantity)::numeric(18,4) AS invoiced_quantity,
  SUM(progress.remaining_quantity)::numeric(18,4) AS remaining_quantity
FROM api.goods_receipts receipt
JOIN api.purchase_orders purchase_order ON purchase_order.id = receipt.purchase_order_id
JOIN api.suppliers supplier ON supplier.id = receipt.supplier_id
LEFT JOIN api.goods_receipt_line_supplier_invoicing_view progress ON progress.goods_receipt_id = receipt.id
GROUP BY receipt.id, receipt.receipt_number, receipt.purchase_order_id, purchase_order.order_number, receipt.supplier_id, supplier.code, supplier.name;

CREATE OR REPLACE FUNCTION private.supplier_invoice_json(target_supplier_invoice_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT jsonb_build_object(
    'id', invoice.id,
    'invoiceNumber', invoice.invoice_number,
    'supplierInvoiceNumber', invoice.supplier_invoice_number,
    'supplierId', invoice.supplier_id,
    'supplierCode', invoice.supplier_code,
    'supplierName', invoice.supplier_name,
    'purchaseOrderId', invoice.purchase_order_id,
    'purchaseOrderNumber', invoice.purchase_order_number,
    'goodsReceiptId', invoice.goods_receipt_id,
    'goodsReceiptNumber', invoice.goods_receipt_number,
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
    'postedByEmail', invoice.posted_by_email,
    'postedAt', invoice.posted_at,
    'cancelledByEmail', invoice.cancelled_by_email,
    'cancelledAt', invoice.cancelled_at,
    'createdAt', invoice.created_at,
    'updatedAt', invoice.updated_at,
    'lines', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', line.id,
            'supplierInvoiceId', line.supplier_invoice_id,
            'lineNumber', line.line_number,
            'goodsReceiptLineId', line.goods_receipt_line_id,
            'purchaseOrderLineId', line.purchase_order_line_id,
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
        FROM api.supplier_invoice_line_view line
        WHERE line.supplier_invoice_id = invoice.id
      ),
      '[]'::jsonb
    )
  )
  FROM api.supplier_invoice_view invoice
  WHERE invoice.id = target_supplier_invoice_id;
$$;

CREATE OR REPLACE FUNCTION api.create_supplier_invoice_from_receipt(
  goods_receipt_id uuid,
  supplier_invoice_number text DEFAULT NULL,
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
  target_receipt api.goods_receipts%ROWTYPE;
  receipt_status text;
  target_order api.purchase_orders%ROWTYPE;
  invoice_id uuid;
  line_item jsonb;
  receipt_line api.goods_receipt_lines%ROWTYPE;
  invoice_line_number integer := 0;
  parsed_quantity numeric(18,4);
  parsed_unit_price numeric(14,2);
  parsed_tax_rate_lookup_value_id uuid;
  parsed_tax_amount numeric(14,2);
  parsed_line_total numeric(14,2);
  remaining_quantity numeric(18,4);
  normalized_supplier_invoice_number text;
BEGIN
  IF jsonb_typeof(lines) <> 'array' OR jsonb_array_length(lines) = 0 THEN
    RETURN private.inventory_error_response('23514', 'At least one supplier invoice line is required');
  END IF;

  SELECT * INTO target_receipt
  FROM api.goods_receipts receipt
  WHERE receipt.id = create_supplier_invoice_from_receipt.goods_receipt_id;

  IF NOT FOUND THEN
    RETURN private.inventory_error_response('P0002', 'Goods receipt not found', '404');
  END IF;

  receipt_status := private.goods_receipt_status_code(target_receipt.status_lookup_value_id);

  IF receipt_status <> 'posted' THEN
    RETURN private.inventory_error_response('23514', 'Only posted goods receipts can be invoiced');
  END IF;

  SELECT * INTO target_order
  FROM api.purchase_orders purchase_order
  WHERE purchase_order.id = target_receipt.purchase_order_id;

  normalized_supplier_invoice_number := NULLIF(btrim(supplier_invoice_number), '');

  IF normalized_supplier_invoice_number IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM api.supplier_invoices invoice
      WHERE invoice.supplier_id = target_receipt.supplier_id
        AND lower(invoice.supplier_invoice_number) = lower(normalized_supplier_invoice_number)
    ) THEN
    RETURN private.inventory_error_response('23505', 'Supplier invoice number already exists for this supplier', '409');
  END IF;

  INSERT INTO api.supplier_invoices (
    invoice_number,
    supplier_invoice_number,
    supplier_id,
    purchase_order_id,
    goods_receipt_id,
    status_lookup_value_id,
    invoice_date,
    due_date,
    currency_lookup_value_id,
    notes,
    created_by_user_id,
    created_by_email
  )
  VALUES (
    private.next_supplier_invoice_number(),
    normalized_supplier_invoice_number,
    target_receipt.supplier_id,
    target_receipt.purchase_order_id,
    target_receipt.id,
    private.supplier_invoice_status_id('draft'),
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
      DELETE FROM api.supplier_invoices WHERE id = invoice_id;
      RETURN private.inventory_error_response('23514', 'Supplier invoice quantity must be greater than zero');
    END IF;

    SELECT * INTO receipt_line
    FROM api.goods_receipt_lines line
    WHERE line.id = NULLIF(COALESCE(line_item->>'goodsReceiptLineId', line_item->>'goods_receipt_line_id'), '')::uuid
      AND line.goods_receipt_id = target_receipt.id;

    IF NOT FOUND THEN
      DELETE FROM api.supplier_invoices WHERE id = invoice_id;
      RETURN private.inventory_error_response('23514', 'Goods receipt line is invalid');
    END IF;

    SELECT progress.remaining_quantity
    INTO remaining_quantity
    FROM api.goods_receipt_line_supplier_invoicing_view progress
    WHERE progress.goods_receipt_line_id = receipt_line.id;

    IF parsed_quantity > remaining_quantity THEN
      PERFORM private.write_audit_log(
        'supplierInvoice.overInvoiceBlocked',
        'supplierInvoice',
        'blocked',
        'Supplier invoice over-invoicing was blocked.',
        target_receipt.id::text,
        jsonb_build_object(
          'goods_receipt_id', target_receipt.id,
          'goods_receipt_line_id', receipt_line.id,
          'requested_quantity', parsed_quantity,
          'remaining_quantity', remaining_quantity
        )
      );
      DELETE FROM api.supplier_invoices WHERE id = invoice_id;
      RETURN private.inventory_error_response('23514', 'Supplier invoice quantity exceeds remaining received quantity');
    END IF;

    parsed_tax_amount := round((parsed_quantity * parsed_unit_price * private.purchase_order_tax_rate(parsed_tax_rate_lookup_value_id))::numeric, 2);
    parsed_line_total := round((parsed_quantity * parsed_unit_price + parsed_tax_amount)::numeric, 2);

    INSERT INTO api.supplier_invoice_lines (
      supplier_invoice_id,
      goods_receipt_line_id,
      purchase_order_line_id,
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
      receipt_line.id,
      receipt_line.purchase_order_line_id,
      invoice_line_number,
      receipt_line.product_id,
      NULLIF(btrim(COALESCE(line_item->>'description', '')), ''),
      parsed_quantity,
      receipt_line.unit_lookup_value_id,
      parsed_unit_price,
      parsed_tax_rate_lookup_value_id,
      parsed_tax_amount,
      parsed_line_total
    );
  END LOOP;

  PERFORM private.recalculate_supplier_invoice_totals(invoice_id);

  PERFORM private.write_audit_log(
    'supplierInvoice.created',
    'supplierInvoice',
    'success',
    'Supplier invoice was created from a goods receipt.',
    invoice_id::text,
    jsonb_build_object(
      'invoice_number', (SELECT invoice_number FROM api.supplier_invoices WHERE id = invoice_id),
      'supplier_invoice_number', normalized_supplier_invoice_number,
      'goods_receipt_id', target_receipt.id,
      'goods_receipt_number', target_receipt.receipt_number,
      'purchase_order_id', target_receipt.purchase_order_id,
      'purchase_order_number', target_order.order_number,
      'supplier_id', target_receipt.supplier_id,
      'total_amount', (SELECT total_amount FROM api.supplier_invoices WHERE id = invoice_id),
      'line_count', invoice_line_number
    )
  );

  RETURN private.supplier_invoice_json(invoice_id);
END;
$$;

CREATE OR REPLACE FUNCTION api.post_supplier_invoice(supplier_invoice_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  target_invoice api.supplier_invoices%ROWTYPE;
BEGIN
  SELECT * INTO target_invoice
  FROM api.supplier_invoices invoice
  WHERE invoice.id = post_supplier_invoice.supplier_invoice_id;

  IF NOT FOUND THEN
    RETURN private.inventory_error_response('P0002', 'Supplier invoice not found', '404');
  END IF;

  IF private.supplier_invoice_status_code(target_invoice.status_lookup_value_id) <> 'draft' THEN
    RETURN private.inventory_error_response('23514', 'Only draft supplier invoices can be posted');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM api.supplier_invoice_lines line WHERE line.supplier_invoice_id = target_invoice.id
  ) THEN
    RETURN private.inventory_error_response('23514', 'Supplier invoice must have at least one line');
  END IF;

  UPDATE api.supplier_invoices invoice
  SET status_lookup_value_id = private.supplier_invoice_status_id('posted'),
      posted_by_user_id = private.current_request_user_id(),
      posted_by_email = private.current_request_email(),
      posted_at = statement_timestamp()
  WHERE invoice.id = target_invoice.id;

  PERFORM private.write_audit_log(
    'supplierInvoice.posted',
    'supplierInvoice',
    'success',
    'Supplier invoice was posted.',
    target_invoice.id::text,
    jsonb_build_object(
      'invoice_number', target_invoice.invoice_number,
      'supplier_invoice_number', target_invoice.supplier_invoice_number,
      'goods_receipt_id', target_invoice.goods_receipt_id,
      'purchase_order_id', target_invoice.purchase_order_id,
      'supplier_id', target_invoice.supplier_id,
      'total_amount', target_invoice.total_amount
    )
  );

  RETURN private.supplier_invoice_json(target_invoice.id);
END;
$$;

CREATE OR REPLACE FUNCTION api.cancel_supplier_invoice(supplier_invoice_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  target_invoice api.supplier_invoices%ROWTYPE;
  current_status text;
BEGIN
  SELECT * INTO target_invoice
  FROM api.supplier_invoices invoice
  WHERE invoice.id = cancel_supplier_invoice.supplier_invoice_id;

  IF NOT FOUND THEN
    RETURN private.inventory_error_response('P0002', 'Supplier invoice not found', '404');
  END IF;

  current_status := private.supplier_invoice_status_code(target_invoice.status_lookup_value_id);

  IF current_status = 'cancelled' THEN
    RETURN private.inventory_error_response('23514', 'Supplier invoice is already cancelled');
  END IF;

  UPDATE api.supplier_invoices invoice
  SET status_lookup_value_id = private.supplier_invoice_status_id('cancelled'),
      cancelled_by_user_id = private.current_request_user_id(),
      cancelled_by_email = private.current_request_email(),
      cancelled_at = statement_timestamp()
  WHERE invoice.id = target_invoice.id;

  PERFORM private.write_audit_log(
    'supplierInvoice.cancelled',
    'supplierInvoice',
    'success',
    'Supplier invoice was cancelled.',
    target_invoice.id::text,
    jsonb_build_object(
      'invoice_number', target_invoice.invoice_number,
      'supplier_invoice_number', target_invoice.supplier_invoice_number,
      'goods_receipt_id', target_invoice.goods_receipt_id,
      'purchase_order_id', target_invoice.purchase_order_id,
      'supplier_id', target_invoice.supplier_id,
      'total_amount', target_invoice.total_amount
    )
  );

  RETURN private.supplier_invoice_json(target_invoice.id);
END;
$$;

REVOKE ALL ON TABLE api.supplier_invoices FROM PUBLIC;
REVOKE ALL ON TABLE api.supplier_invoice_lines FROM PUBLIC;
REVOKE ALL ON FUNCTION private.supplier_invoice_status_id(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.supplier_invoice_status_code(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.next_supplier_invoice_number() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.validate_supplier_invoice_header() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.validate_supplier_invoice_line() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.recalculate_supplier_invoice_totals(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.supplier_invoice_json(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.create_supplier_invoice_from_receipt(uuid, text, date, date, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.post_supplier_invoice(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.cancel_supplier_invoice(uuid) FROM PUBLIC;

GRANT USAGE ON SCHEMA api TO erp_admin, erp_manager, erp_accountant, erp_warehouse;
GRANT SELECT ON api.suppliers, api.products, api.lookup_types, api.lookup_values
TO erp_admin, erp_manager, erp_accountant, erp_warehouse;
GRANT SELECT ON api.purchase_orders, api.purchase_order_lines, api.purchase_order_view, api.purchase_order_line_view
TO erp_admin, erp_manager, erp_accountant, erp_warehouse;
GRANT SELECT ON api.goods_receipts, api.goods_receipt_lines, api.goods_receipt_view, api.goods_receipt_line_view
TO erp_admin, erp_manager, erp_accountant, erp_warehouse;
GRANT SELECT ON api.supplier_invoices, api.supplier_invoice_lines, api.supplier_invoice_view, api.supplier_invoice_line_view
TO erp_admin, erp_manager, erp_accountant, erp_warehouse;
GRANT SELECT ON api.goods_receipt_supplier_invoicing_view, api.goods_receipt_line_supplier_invoicing_view
TO erp_admin, erp_manager, erp_accountant, erp_warehouse;
GRANT SELECT ON api.inventory_balances, api.inventory_balance_view
TO erp_admin, erp_manager, erp_accountant, erp_warehouse;
GRANT EXECUTE ON FUNCTION api.create_supplier_invoice_from_receipt(uuid, text, date, date, text, jsonb)
TO erp_admin, erp_manager, erp_accountant;
GRANT EXECUTE ON FUNCTION api.post_supplier_invoice(uuid)
TO erp_admin, erp_manager, erp_accountant;
GRANT EXECUTE ON FUNCTION api.cancel_supplier_invoice(uuid)
TO erp_admin, erp_manager, erp_accountant;

ALTER TABLE api.supplier_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.supplier_invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.supplier_invoices FORCE ROW LEVEL SECURITY;
ALTER TABLE api.supplier_invoice_lines FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS supplier_invoices_select_policy ON api.supplier_invoices;
DROP POLICY IF EXISTS supplier_invoice_lines_select_policy ON api.supplier_invoice_lines;

CREATE POLICY supplier_invoices_select_policy
ON api.supplier_invoices
FOR SELECT
TO erp_admin, erp_manager, erp_accountant, erp_warehouse
USING (true);

CREATE POLICY supplier_invoice_lines_select_policy
ON api.supplier_invoice_lines
FOR SELECT
TO erp_admin, erp_manager, erp_accountant, erp_warehouse
USING (true);

COMMIT;
