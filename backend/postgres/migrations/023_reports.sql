BEGIN;

INSERT INTO api.feature_flags (flag_key, enabled, label, description, category)
VALUES (
  'reports.enabled',
  true,
  'گزارش‌ها',
  'فعال‌سازی گزارش‌های عملیاتی خواندنی سامانه',
  'reports'
)
ON CONFLICT (flag_key) DO UPDATE
SET enabled = true,
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    category = EXCLUDED.category;

CREATE OR REPLACE VIEW api.report_inventory_on_hand_view
WITH (security_invoker = true)
AS
SELECT
  balance.product_id,
  balance.product_sku,
  balance.product_name,
  product.product_type,
  balance.warehouse_id,
  balance.warehouse_code,
  balance.warehouse_name,
  balance.storage_location_id,
  balance.storage_location_code,
  balance.storage_location_name,
  balance.unit_code,
  balance.unit_label,
  balance.quantity_on_hand,
  MAX(movement.occurred_at) AS last_movement_at
FROM api.inventory_balance_view balance
JOIN api.products product ON product.id = balance.product_id
LEFT JOIN api.inventory_movements movement
  ON movement.product_id = balance.product_id
  AND (
    movement.from_warehouse_id = balance.warehouse_id
    OR movement.to_warehouse_id = balance.warehouse_id
  )
  AND (
    balance.storage_location_id IS NULL
    OR movement.from_storage_location_id = balance.storage_location_id
    OR movement.to_storage_location_id = balance.storage_location_id
  )
GROUP BY
  balance.product_id,
  balance.product_sku,
  balance.product_name,
  product.product_type,
  balance.warehouse_id,
  balance.warehouse_code,
  balance.warehouse_name,
  balance.storage_location_id,
  balance.storage_location_code,
  balance.storage_location_name,
  balance.unit_code,
  balance.unit_label,
  balance.quantity_on_hand;

CREATE OR REPLACE VIEW api.report_inventory_movement_summary_view
WITH (security_invoker = true)
AS
SELECT
  movement.product_id,
  movement.product_sku,
  movement.product_name,
  COALESCE(movement.to_warehouse_id, movement.from_warehouse_id) AS warehouse_id,
  COALESCE(to_warehouse.code, from_warehouse.code) AS warehouse_code,
  COALESCE(to_warehouse.name, from_warehouse.name) AS warehouse_name,
  movement.movement_type AS movement_type_code,
  CASE movement.movement_type
    WHEN 'adjustment_in' THEN 'اصلاح افزایشی'
    WHEN 'adjustment_out' THEN 'اصلاح کاهشی'
    WHEN 'transfer_in' THEN 'انتقال ورودی'
    WHEN 'transfer_out' THEN 'انتقال خروجی'
    WHEN 'opening_balance' THEN 'موجودی ابتدای دوره'
    WHEN 'purchase_receipt' THEN 'رسید خرید'
    WHEN 'sales_shipment' THEN 'ارسال فروش'
    WHEN 'sales_shipment_reversal' THEN 'ابطال ارسال فروش'
    ELSE movement.movement_type
  END AS movement_type_label,
  COUNT(*)::integer AS movement_count,
  COALESCE(SUM(movement.quantity) FILTER (
    WHERE movement.movement_type IN ('adjustment_in', 'transfer_in', 'opening_balance', 'purchase_receipt')
  ), 0)::numeric(18,4) AS total_quantity_in,
  COALESCE(SUM(movement.quantity) FILTER (
    WHERE movement.movement_type IN ('adjustment_out', 'transfer_out', 'sales_shipment', 'sales_shipment_reversal')
  ), 0)::numeric(18,4) AS total_quantity_out,
  MIN(movement.occurred_at) AS first_movement_at,
  MAX(movement.occurred_at) AS last_movement_at
FROM api.inventory_movement_view movement
LEFT JOIN api.warehouses from_warehouse ON from_warehouse.id = movement.from_warehouse_id
LEFT JOIN api.warehouses to_warehouse ON to_warehouse.id = movement.to_warehouse_id
GROUP BY
  movement.product_id,
  movement.product_sku,
  movement.product_name,
  COALESCE(movement.to_warehouse_id, movement.from_warehouse_id),
  COALESCE(to_warehouse.code, from_warehouse.code),
  COALESCE(to_warehouse.name, from_warehouse.name),
  movement.movement_type;

CREATE OR REPLACE VIEW api.report_purchase_order_status_view
WITH (security_invoker = true)
AS
SELECT
  status_code,
  status_label,
  COUNT(*)::integer AS order_count,
  COALESCE(SUM(subtotal_amount), 0)::numeric(14,2) AS subtotal_amount,
  COALESCE(SUM(tax_amount), 0)::numeric(14,2) AS tax_amount,
  COALESCE(SUM(total_amount), 0)::numeric(14,2) AS total_amount
FROM api.purchase_order_view
GROUP BY status_code, status_label;

CREATE OR REPLACE VIEW api.report_goods_receipt_status_view
WITH (security_invoker = true)
AS
SELECT
  receipt.status_code,
  receipt.status_label,
  COUNT(DISTINCT receipt.id)::integer AS receipt_count,
  COUNT(line.id)::integer AS line_count,
  COALESCE(SUM(line.received_quantity), 0)::numeric(18,4) AS total_received_quantity
FROM api.goods_receipt_view receipt
LEFT JOIN api.goods_receipt_line_view line ON line.goods_receipt_id = receipt.id
GROUP BY receipt.status_code, receipt.status_label;

CREATE OR REPLACE VIEW api.report_supplier_invoice_settlement_view AS
WITH paid_amounts AS (
  SELECT
    allocation.supplier_invoice_id,
    COALESCE(SUM(allocation.allocated_amount), 0)::numeric(14,2) AS paid_amount
  FROM api.supplier_payment_allocations allocation
  JOIN api.supplier_payments payment ON payment.id = allocation.supplier_payment_id
  JOIN api.lookup_values status ON status.id = payment.status_lookup_value_id
  WHERE status.code = 'posted'
  GROUP BY allocation.supplier_invoice_id
),
settlement AS (
  SELECT
    invoice.supplier_id,
    supplier.code AS supplier_code,
    supplier.name AS supplier_name,
    invoice.due_date,
    invoice.total_amount,
    COALESCE(paid_amounts.paid_amount, 0)::numeric(14,2) AS paid_amount,
    GREATEST(invoice.total_amount - COALESCE(paid_amounts.paid_amount, 0), 0)::numeric(14,2) AS remaining_amount
  FROM api.supplier_invoices invoice
  JOIN api.suppliers supplier ON supplier.id = invoice.supplier_id
  JOIN api.lookup_values status ON status.id = invoice.status_lookup_value_id
  LEFT JOIN paid_amounts ON paid_amounts.supplier_invoice_id = invoice.id
  WHERE status.code = 'posted'
)
SELECT
  settlement.supplier_id,
  settlement.supplier_code,
  settlement.supplier_name,
  COUNT(*)::integer AS invoice_count,
  COALESCE(SUM(settlement.total_amount), 0)::numeric(14,2) AS total_invoiced_amount,
  COALESCE(SUM(settlement.paid_amount), 0)::numeric(14,2) AS total_paid_amount,
  COALESCE(SUM(settlement.remaining_amount), 0)::numeric(14,2) AS total_remaining_amount,
  COALESCE(SUM(settlement.remaining_amount) FILTER (
    WHERE settlement.due_date < current_date AND settlement.remaining_amount > 0
  ), 0)::numeric(14,2) AS overdue_amount
FROM settlement
GROUP BY settlement.supplier_id, settlement.supplier_code, settlement.supplier_name;

CREATE OR REPLACE VIEW api.report_sales_order_status_view
WITH (security_invoker = true)
AS
SELECT
  status_code,
  status_label,
  COUNT(*)::integer AS order_count,
  COALESCE(SUM(subtotal_amount), 0)::numeric(14,2) AS subtotal_amount,
  COALESCE(SUM(tax_amount), 0)::numeric(14,2) AS tax_amount,
  COALESCE(SUM(total_amount), 0)::numeric(14,2) AS total_amount
FROM api.sales_order_view
GROUP BY status_code, status_label;

CREATE OR REPLACE VIEW api.report_sales_delivery_status_view
WITH (security_invoker = true)
AS
SELECT
  delivery.status_code,
  delivery.status_label,
  COUNT(DISTINCT delivery.id)::integer AS delivery_count,
  COUNT(line.id)::integer AS line_count,
  COALESCE(SUM(line.shipped_quantity), 0)::numeric(18,4) AS total_shipped_quantity
FROM api.sales_delivery_view delivery
LEFT JOIN api.sales_delivery_line_view line ON line.sales_delivery_id = delivery.id
GROUP BY delivery.status_code, delivery.status_label;

CREATE OR REPLACE VIEW api.report_sales_invoice_settlement_view AS
WITH paid_amounts AS (
  SELECT
    allocation.sales_invoice_id,
    COALESCE(SUM(allocation.allocated_amount), 0)::numeric(14,2) AS paid_amount
  FROM api.customer_receipt_allocations allocation
  JOIN api.customer_receipts receipt ON receipt.id = allocation.customer_receipt_id
  JOIN api.lookup_values status ON status.id = receipt.status_lookup_value_id
  WHERE status.code = 'posted'
  GROUP BY allocation.sales_invoice_id
),
settlement AS (
  SELECT
    invoice.customer_id,
    customer.code AS customer_code,
    customer.name AS customer_name,
    invoice.due_date,
    invoice.total_amount,
    COALESCE(paid_amounts.paid_amount, 0)::numeric(14,2) AS paid_amount,
    GREATEST(invoice.total_amount - COALESCE(paid_amounts.paid_amount, 0), 0)::numeric(14,2) AS remaining_amount
  FROM api.sales_invoices invoice
  JOIN api.customers customer ON customer.id = invoice.customer_id
  JOIN api.lookup_values status ON status.id = invoice.status_lookup_value_id
  LEFT JOIN paid_amounts ON paid_amounts.sales_invoice_id = invoice.id
  WHERE status.code = 'issued'
)
SELECT
  settlement.customer_id,
  settlement.customer_code,
  settlement.customer_name,
  COUNT(*)::integer AS invoice_count,
  COALESCE(SUM(settlement.total_amount), 0)::numeric(14,2) AS total_invoiced_amount,
  COALESCE(SUM(settlement.paid_amount), 0)::numeric(14,2) AS total_paid_amount,
  COALESCE(SUM(settlement.remaining_amount), 0)::numeric(14,2) AS total_remaining_amount,
  COALESCE(SUM(settlement.remaining_amount) FILTER (
    WHERE settlement.due_date < current_date AND settlement.remaining_amount > 0
  ), 0)::numeric(14,2) AS overdue_amount
FROM settlement
GROUP BY settlement.customer_id, settlement.customer_code, settlement.customer_name;

CREATE OR REPLACE VIEW api.report_general_ledger_summary_view
WITH (security_invoker = true)
AS
SELECT
  account_id,
  account_code,
  account_name,
  account_type_code,
  COALESCE(SUM(debit_amount), 0)::numeric(14,2) AS debit_amount,
  COALESCE(SUM(credit_amount), 0)::numeric(14,2) AS credit_amount,
  COALESCE(SUM(debit_amount - credit_amount), 0)::numeric(14,2) AS net_amount,
  COUNT(*)::integer AS journal_line_count
FROM api.general_ledger_view
GROUP BY account_id, account_code, account_name, account_type_code;

CREATE OR REPLACE VIEW api.report_journal_activity_view
WITH (security_invoker = true)
AS
SELECT
  source_type_code,
  source_type_label,
  COUNT(*)::integer AS journal_count,
  COALESCE(SUM(total_debit), 0)::numeric(14,2) AS total_debit,
  COALESCE(SUM(total_credit), 0)::numeric(14,2) AS total_credit,
  MIN(journal_date) AS first_journal_date,
  MAX(journal_date) AS last_journal_date
FROM api.journal_entry_view
WHERE status_code = 'posted'
GROUP BY source_type_code, source_type_label;

CREATE OR REPLACE VIEW api.report_payment_summary_view
WITH (security_invoker = true)
AS
SELECT
  payment_direction,
  COUNT(*)::integer AS payment_count,
  COALESCE(SUM(amount), 0)::numeric(14,2) AS total_amount,
  MIN(payment_date) AS first_payment_date,
  MAX(payment_date) AS last_payment_date
FROM (
  SELECT
    'customer_receipt'::text AS payment_direction,
    amount,
    receipt_date AS payment_date
  FROM api.customer_receipt_view
  WHERE status_code = 'posted'
  UNION ALL
  SELECT
    'supplier_payment'::text AS payment_direction,
    amount,
    payment_date
  FROM api.supplier_payment_view
  WHERE status_code = 'posted'
) payment
GROUP BY payment_direction;

CREATE OR REPLACE VIEW api.report_audit_activity_summary_view AS
SELECT
  audit_log.action,
  audit_log.entity_type,
  audit_log.actor_email,
  COUNT(*)::integer AS event_count,
  MIN(audit_log.occurred_at) AS first_event_at,
  MAX(audit_log.occurred_at) AS last_event_at
FROM private.audit_logs audit_log
GROUP BY audit_log.action, audit_log.entity_type, audit_log.actor_email;

REVOKE ALL ON
  api.report_inventory_on_hand_view,
  api.report_inventory_movement_summary_view,
  api.report_purchase_order_status_view,
  api.report_goods_receipt_status_view,
  api.report_supplier_invoice_settlement_view,
  api.report_sales_order_status_view,
  api.report_sales_delivery_status_view,
  api.report_sales_invoice_settlement_view,
  api.report_general_ledger_summary_view,
  api.report_journal_activity_view,
  api.report_payment_summary_view,
  api.report_audit_activity_summary_view
FROM PUBLIC;

GRANT USAGE ON SCHEMA api TO erp_admin, erp_manager, erp_accountant, erp_sales, erp_warehouse;

GRANT SELECT ON
  api.report_inventory_on_hand_view,
  api.report_inventory_movement_summary_view
TO erp_admin, erp_manager, erp_warehouse;

GRANT SELECT ON
  api.report_purchase_order_status_view,
  api.report_goods_receipt_status_view,
  api.report_supplier_invoice_settlement_view
TO erp_admin, erp_manager, erp_accountant;

GRANT SELECT ON
  api.report_sales_order_status_view,
  api.report_sales_delivery_status_view,
  api.report_sales_invoice_settlement_view
TO erp_admin, erp_manager, erp_accountant, erp_sales;

GRANT SELECT ON
  api.report_general_ledger_summary_view,
  api.report_journal_activity_view
TO erp_admin, erp_accountant;

GRANT SELECT ON api.report_payment_summary_view
TO erp_admin, erp_manager, erp_accountant;

GRANT SELECT ON api.report_audit_activity_summary_view
TO erp_admin;

COMMIT;
