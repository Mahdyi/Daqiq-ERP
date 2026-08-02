BEGIN;

WITH lookup_ids AS (
  SELECT
    (SELECT value.id FROM api.lookup_values value JOIN api.lookup_types type ON type.id = value.lookup_type_id WHERE type.code = 'warehouse_type' AND value.code = 'main') AS wh_main,
    (SELECT value.id FROM api.lookup_values value JOIN api.lookup_types type ON type.id = value.lookup_type_id WHERE type.code = 'warehouse_type' AND value.code = 'raw_material') AS wh_raw,
    (SELECT value.id FROM api.lookup_values value JOIN api.lookup_types type ON type.id = value.lookup_type_id WHERE type.code = 'warehouse_type' AND value.code = 'finished_goods') AS wh_finished,
    (SELECT value.id FROM api.lookup_values value JOIN api.lookup_types type ON type.id = value.lookup_type_id WHERE type.code = 'warehouse_type' AND value.code = 'packaging') AS wh_packaging,
    (SELECT value.id FROM api.lookup_values value JOIN api.lookup_types type ON type.id = value.lookup_type_id WHERE type.code = 'warehouse_type' AND value.code = 'quality_hold') AS wh_quality,
    (SELECT value.id FROM api.lookup_values value JOIN api.lookup_types type ON type.id = value.lookup_type_id WHERE type.code = 'storage_location_type' AND value.code = 'receiving') AS loc_receiving,
    (SELECT value.id FROM api.lookup_values value JOIN api.lookup_types type ON type.id = value.lookup_type_id WHERE type.code = 'storage_location_type' AND value.code = 'storage') AS loc_storage,
    (SELECT value.id FROM api.lookup_values value JOIN api.lookup_types type ON type.id = value.lookup_type_id WHERE type.code = 'storage_location_type' AND value.code = 'picking') AS loc_picking,
    (SELECT value.id FROM api.lookup_values value JOIN api.lookup_types type ON type.id = value.lookup_type_id WHERE type.code = 'storage_location_type' AND value.code = 'shipping') AS loc_shipping,
    (SELECT value.id FROM api.lookup_values value JOIN api.lookup_types type ON type.id = value.lookup_type_id WHERE type.code = 'storage_location_type' AND value.code = 'quality_hold') AS loc_quality
),
seed_warehouses(id, code, name, description, warehouse_type_lookup_value_id, address, responsible_person, phone, email, active) AS (
  SELECT '10000000-0000-4000-8000-000000000001'::uuid, 'WH-MAIN', 'انبار اصلی', 'مرکز نگهداری عمومی کالاها', wh_main, 'تهران، سایت مرکزی', 'آقای انصاری', '021-88001001', 'main-warehouse@example.test', true FROM lookup_ids
  UNION ALL SELECT '10000000-0000-4000-8000-000000000002'::uuid, 'WH-RAW', 'انبار مواد اولیه', 'نگهداری مواد اولیه تولید', wh_raw, 'تهران، سالن مواد اولیه', 'خانم سعیدی', '021-88001002', NULL, true FROM lookup_ids
  UNION ALL SELECT '10000000-0000-4000-8000-000000000003'::uuid, 'WH-FG', 'انبار محصول نهایی', 'محصولات آماده فروش', wh_finished, 'تهران، سالن محصول نهایی', 'آقای نوری', '021-88001003', 'fg-warehouse@example.test', true FROM lookup_ids
  UNION ALL SELECT '10000000-0000-4000-8000-000000000004'::uuid, 'WH-PACK', 'انبار بسته‌بندی', NULL, wh_packaging, 'البرز، سالن بسته‌بندی', NULL, '026-33001004', NULL, true FROM lookup_ids
  UNION ALL SELECT '10000000-0000-4000-8000-000000000005'::uuid, 'WH-QC', 'قرنطینه کنترل کیفیت', 'محوطه نگهداری اقلام در انتظار تایید', wh_quality, NULL, 'خانم مرادی', NULL, 'qc-hold@example.test', false FROM lookup_ids
)
INSERT INTO api.warehouses (
  id,
  code,
  name,
  description,
  warehouse_type_lookup_value_id,
  address,
  responsible_person,
  phone,
  email,
  active
)
SELECT id, code, name, description, warehouse_type_lookup_value_id, address, responsible_person, phone, email, active
FROM seed_warehouses
ON CONFLICT (lower(code)) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  warehouse_type_lookup_value_id = EXCLUDED.warehouse_type_lookup_value_id,
  address = EXCLUDED.address,
  responsible_person = EXCLUDED.responsible_person,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  active = EXCLUDED.active;

WITH lookup_ids AS (
  SELECT
    (SELECT value.id FROM api.lookup_values value JOIN api.lookup_types type ON type.id = value.lookup_type_id WHERE type.code = 'storage_location_type' AND value.code = 'receiving') AS loc_receiving,
    (SELECT value.id FROM api.lookup_values value JOIN api.lookup_types type ON type.id = value.lookup_type_id WHERE type.code = 'storage_location_type' AND value.code = 'storage') AS loc_storage,
    (SELECT value.id FROM api.lookup_values value JOIN api.lookup_types type ON type.id = value.lookup_type_id WHERE type.code = 'storage_location_type' AND value.code = 'picking') AS loc_picking,
    (SELECT value.id FROM api.lookup_values value JOIN api.lookup_types type ON type.id = value.lookup_type_id WHERE type.code = 'storage_location_type' AND value.code = 'shipping') AS loc_shipping,
    (SELECT value.id FROM api.lookup_values value JOIN api.lookup_types type ON type.id = value.lookup_type_id WHERE type.code = 'storage_location_type' AND value.code = 'quality_hold') AS loc_quality,
    (SELECT value.id FROM api.lookup_values value JOIN api.lookup_types type ON type.id = value.lookup_type_id WHERE type.code = 'storage_location_type' AND value.code = 'production') AS loc_production
),
seed_locations(id, warehouse_id, code, name, description, location_type_lookup_value_id, parent_location_id, active) AS (
  SELECT '20000000-0000-4000-8000-000000000001'::uuid, '10000000-0000-4000-8000-000000000001'::uuid, 'RCV', 'محوطه دریافت', NULL, loc_receiving, NULL::uuid, true FROM lookup_ids
  UNION ALL SELECT '20000000-0000-4000-8000-000000000002'::uuid, '10000000-0000-4000-8000-000000000001'::uuid, 'A-AISLE', 'راهرو A', NULL, loc_storage, NULL::uuid, true FROM lookup_ids
  UNION ALL SELECT '20000000-0000-4000-8000-000000000003'::uuid, '10000000-0000-4000-8000-000000000001'::uuid, 'A-R01', 'قفسه A-01', NULL, loc_storage, '20000000-0000-4000-8000-000000000002'::uuid, true FROM lookup_ids
  UNION ALL SELECT '20000000-0000-4000-8000-000000000004'::uuid, '10000000-0000-4000-8000-000000000001'::uuid, 'SHIP', 'محوطه ارسال', NULL, loc_shipping, NULL::uuid, true FROM lookup_ids
  UNION ALL SELECT '20000000-0000-4000-8000-000000000005'::uuid, '10000000-0000-4000-8000-000000000002'::uuid, 'RM-A', 'مواد اولیه A', NULL, loc_storage, NULL::uuid, true FROM lookup_ids
  UNION ALL SELECT '20000000-0000-4000-8000-000000000006'::uuid, '10000000-0000-4000-8000-000000000002'::uuid, 'RM-B', 'مواد اولیه B', NULL, loc_storage, NULL::uuid, true FROM lookup_ids
  UNION ALL SELECT '20000000-0000-4000-8000-000000000007'::uuid, '10000000-0000-4000-8000-000000000002'::uuid, 'RM-QC', 'کنترل کیفیت مواد اولیه', NULL, loc_quality, NULL::uuid, true FROM lookup_ids
  UNION ALL SELECT '20000000-0000-4000-8000-000000000008'::uuid, '10000000-0000-4000-8000-000000000003'::uuid, 'FG-A', 'محصول نهایی A', NULL, loc_storage, NULL::uuid, true FROM lookup_ids
  UNION ALL SELECT '20000000-0000-4000-8000-000000000009'::uuid, '10000000-0000-4000-8000-000000000003'::uuid, 'FG-PICK', 'برداشت محصول نهایی', NULL, loc_picking, NULL::uuid, true FROM lookup_ids
  UNION ALL SELECT '20000000-0000-4000-8000-000000000010'::uuid, '10000000-0000-4000-8000-000000000003'::uuid, 'FG-OLD', 'محصول نهایی غیرفعال', NULL, loc_storage, NULL::uuid, false FROM lookup_ids
  UNION ALL SELECT '20000000-0000-4000-8000-000000000011'::uuid, '10000000-0000-4000-8000-000000000004'::uuid, 'PK-A', 'بسته‌بندی A', NULL, loc_storage, NULL::uuid, true FROM lookup_ids
  UNION ALL SELECT '20000000-0000-4000-8000-000000000012'::uuid, '10000000-0000-4000-8000-000000000004'::uuid, 'PK-LABEL', 'برچسب و لیبل', NULL, loc_storage, '20000000-0000-4000-8000-000000000011'::uuid, true FROM lookup_ids
  UNION ALL SELECT '20000000-0000-4000-8000-000000000013'::uuid, '10000000-0000-4000-8000-000000000005'::uuid, 'QC-HOLD', 'قرنطینه QC', NULL, loc_quality, NULL::uuid, false FROM lookup_ids
  UNION ALL SELECT '20000000-0000-4000-8000-000000000014'::uuid, '10000000-0000-4000-8000-000000000005'::uuid, 'QC-SAMPLE', 'نمونه‌برداری', NULL, loc_quality, '20000000-0000-4000-8000-000000000013'::uuid, false FROM lookup_ids
  UNION ALL SELECT '20000000-0000-4000-8000-000000000015'::uuid, '10000000-0000-4000-8000-000000000001'::uuid, 'PROD-LINE', 'ذخیره خط تولید', NULL, loc_production, NULL::uuid, true FROM lookup_ids
)
INSERT INTO api.storage_locations (
  id,
  warehouse_id,
  code,
  name,
  description,
  location_type_lookup_value_id,
  parent_location_id,
  active
)
SELECT id, warehouse_id, code, name, description, location_type_lookup_value_id, parent_location_id, active
FROM seed_locations
ON CONFLICT (warehouse_id, lower(code)) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  location_type_lookup_value_id = EXCLUDED.location_type_lookup_value_id,
  parent_location_id = EXCLUDED.parent_location_id,
  active = EXCLUDED.active;

COMMIT;
