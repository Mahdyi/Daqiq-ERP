BEGIN;

WITH lookup_ids AS (
  SELECT
    (SELECT value.id FROM api.lookup_values value JOIN api.lookup_types type ON type.id = value.lookup_type_id WHERE type.code = 'unit' AND value.code = 'kg') AS unit_kg,
    (SELECT value.id FROM api.lookup_values value JOIN api.lookup_types type ON type.id = value.lookup_type_id WHERE type.code = 'unit' AND value.code = 'g') AS unit_g,
    (SELECT value.id FROM api.lookup_values value JOIN api.lookup_types type ON type.id = value.lookup_type_id WHERE type.code = 'unit' AND value.code = 'liter') AS unit_liter,
    (SELECT value.id FROM api.lookup_values value JOIN api.lookup_types type ON type.id = value.lookup_type_id WHERE type.code = 'unit' AND value.code = 'piece') AS unit_piece,
    (SELECT value.id FROM api.lookup_values value JOIN api.lookup_types type ON type.id = value.lookup_type_id WHERE type.code = 'tax_rate' AND value.code = 'standard') AS tax_standard,
    (SELECT value.id FROM api.lookup_values value JOIN api.lookup_types type ON type.id = value.lookup_type_id WHERE type.code = 'tax_rate' AND value.code = 'zero') AS tax_zero,
    (SELECT value.id FROM api.lookup_values value JOIN api.lookup_types type ON type.id = value.lookup_type_id WHERE type.code = 'product_category' AND value.code = 'raw_material') AS cat_raw,
    (SELECT value.id FROM api.lookup_values value JOIN api.lookup_types type ON type.id = value.lookup_type_id WHERE type.code = 'product_category' AND value.code = 'finished_good') AS cat_finished,
    (SELECT value.id FROM api.lookup_values value JOIN api.lookup_types type ON type.id = value.lookup_type_id WHERE type.code = 'product_category' AND value.code = 'packaging') AS cat_packaging
),
seed_products(
  sku, name, description, barcode, product_type, category_lookup_value_id,
  base_unit_lookup_value_id, tax_rate_lookup_value_id, track_inventory,
  purchasable, sellable, standard_cost, sales_price, active
) AS (
  SELECT 'RM-STEEL-001', 'ورق فولادی خام', 'ماده اولیه تولید قطعات', '6260000000011', 'raw_material', cat_raw, unit_kg, tax_standard, true, true, false, 1250.00::numeric, NULL::numeric, true FROM lookup_ids
  UNION ALL SELECT 'RM-PAINT-002', 'رنگ صنعتی آبی', 'رنگ مصرفی خط تولید', NULL, 'raw_material', cat_raw, unit_liter, tax_standard, true, true, false, 780.00::numeric, NULL::numeric, true FROM lookup_ids
  UNION ALL SELECT 'RM-RUBBER-003', 'لاستیک خام', NULL, '6260000000035', 'raw_material', cat_raw, unit_kg, tax_standard, true, true, false, 940.00::numeric, NULL::numeric, true FROM lookup_ids
  UNION ALL SELECT 'FG-PUMP-100', 'پمپ آب خانگی', 'محصول نهایی قابل فروش', '6260000001001', 'finished_good', cat_finished, unit_piece, tax_standard, true, false, true, 3200.00::numeric, 4800.00::numeric, true FROM lookup_ids
  UNION ALL SELECT 'FG-VALVE-110', 'شیر کنترل صنعتی', NULL, '6260000001100', 'finished_good', cat_finished, unit_piece, tax_standard, true, false, true, 1900.00::numeric, 2850.00::numeric, true FROM lookup_ids
  UNION ALL SELECT 'FG-PANEL-120', 'تابلو کنترل', 'محصول مونتاژی', NULL, 'finished_good', cat_finished, unit_piece, tax_standard, true, false, true, 5400.00::numeric, 7600.00::numeric, true FROM lookup_ids
  UNION ALL SELECT 'PK-BOX-010', 'کارتن بسته‌بندی کوچک', NULL, '6260000002015', 'packaging', cat_packaging, unit_piece, tax_standard, true, true, false, 35.00::numeric, NULL::numeric, true FROM lookup_ids
  UNION ALL SELECT 'PK-LABEL-011', 'برچسب محصول', 'برچسب فارسی کالا', NULL, 'packaging', cat_packaging, unit_piece, tax_standard, true, true, false, 8.00::numeric, NULL::numeric, true FROM lookup_ids
  UNION ALL SELECT 'SRV-INSTALL-001', 'خدمات نصب', 'خدمت بدون موجودی انبار', NULL, 'service', NULL, unit_piece, tax_standard, false, false, true, NULL::numeric, 950.00::numeric, true FROM lookup_ids
  UNION ALL SELECT 'SRV-WARRANTY-002', 'خدمات گارانتی ویژه', NULL, NULL, 'service', NULL, unit_piece, tax_zero, false, false, true, NULL::numeric, 450.00::numeric, true FROM lookup_ids
  UNION ALL SELECT 'SP-MOTOR-001', 'موتور یدکی پمپ', NULL, '6260000003012', 'spare_part', cat_finished, unit_piece, tax_standard, true, true, true, 2100.00::numeric, 3300.00::numeric, true FROM lookup_ids
  UNION ALL SELECT 'SP-SEAL-002', 'اورینگ یدکی', 'قطعه یدکی غیرفعال آزمایشی', NULL, 'spare_part', cat_finished, unit_g, tax_standard, true, true, true, 75.00::numeric, 130.00::numeric, false FROM lookup_ids
)
INSERT INTO api.products (
  sku,
  name,
  description,
  barcode,
  product_type,
  category_lookup_value_id,
  base_unit_lookup_value_id,
  tax_rate_lookup_value_id,
  track_inventory,
  purchasable,
  sellable,
  standard_cost,
  sales_price,
  active
)
SELECT
  sku,
  name,
  description,
  barcode,
  product_type,
  category_lookup_value_id,
  base_unit_lookup_value_id,
  tax_rate_lookup_value_id,
  track_inventory,
  purchasable,
  sellable,
  standard_cost,
  sales_price,
  active
FROM seed_products
ON CONFLICT (lower(sku)) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  barcode = EXCLUDED.barcode,
  product_type = EXCLUDED.product_type,
  category_lookup_value_id = EXCLUDED.category_lookup_value_id,
  base_unit_lookup_value_id = EXCLUDED.base_unit_lookup_value_id,
  tax_rate_lookup_value_id = EXCLUDED.tax_rate_lookup_value_id,
  track_inventory = EXCLUDED.track_inventory,
  purchasable = EXCLUDED.purchasable,
  sellable = EXCLUDED.sellable,
  standard_cost = EXCLUDED.standard_cost,
  sales_price = EXCLUDED.sales_price,
  active = EXCLUDED.active;

COMMIT;
