BEGIN;

WITH lookup_ids AS (
  SELECT
    (SELECT value.id FROM api.lookup_values value JOIN api.lookup_types type ON type.id = value.lookup_type_id WHERE type.code = 'supplier_group' AND value.code = 'local') AS group_local,
    (SELECT value.id FROM api.lookup_values value JOIN api.lookup_types type ON type.id = value.lookup_type_id WHERE type.code = 'supplier_group' AND value.code = 'international') AS group_international,
    (SELECT value.id FROM api.lookup_values value JOIN api.lookup_types type ON type.id = value.lookup_type_id WHERE type.code = 'currency' AND value.code = 'IRR') AS currency_irr,
    (SELECT value.id FROM api.lookup_values value JOIN api.lookup_types type ON type.id = value.lookup_type_id WHERE type.code = 'currency' AND value.code = 'EUR') AS currency_eur,
    (SELECT value.id FROM api.lookup_values value JOIN api.lookup_types type ON type.id = value.lookup_type_id WHERE type.code = 'currency' AND value.code = 'USD') AS currency_usd
),
seed_suppliers(
  code, name, email, phone, tax_number, contact_person, website, address,
  supplier_group_lookup_value_id, currency_lookup_value_id, payment_terms_days, active
) AS (
  SELECT 'SUP-LOCAL-001', 'تأمین فولاد سپهر', 'steel.sepehr@example.test', '021-44001001', '4111111111', 'آقای احمدی', 'https://steel-sepehr.example.test', 'تهران، شهرک صنعتی شمس‌آباد', group_local, currency_irr, 30, true FROM lookup_ids
  UNION ALL SELECT 'SUP-LOCAL-002', 'رنگ و رزین پارسیان', 'paint.parsian@example.test', '021-55002002', '4222222222', 'خانم محمدی', NULL, 'تهران، جاده قدیم کرج', group_local, currency_irr, 15, true FROM lookup_ids
  UNION ALL SELECT 'SUP-LOCAL-003', 'بسته‌بندی نیکان', 'pack.nikan@example.test', '026-33003003', NULL, 'آقای رضایی', 'https://pack-nikan.example.test', 'البرز، شهرک صنعتی نظرآباد', group_local, currency_irr, 20, true FROM lookup_ids
  UNION ALL SELECT 'SUP-LOCAL-004', 'حمل‌ونقل راه‌آوران', NULL, '021-66004004', NULL, 'خانم کریمی', NULL, 'تهران، میدان آزادی', group_local, currency_irr, 10, true FROM lookup_ids
  UNION ALL SELECT 'SUP-LOCAL-005', 'خدمات فنی پایدار', 'service.paydar@example.test', NULL, '4555555555', 'آقای صادقی', NULL, NULL, group_local, currency_irr, 0, true FROM lookup_ids
  UNION ALL SELECT 'SUP-LOCAL-006', 'قطعات یدکی آریا', 'spare.aria@example.test', '031-37006006', '4666666666', NULL, 'https://spare-aria.example.test', 'اصفهان، خیابان صنعت', group_local, currency_irr, 45, false FROM lookup_ids
  UNION ALL SELECT 'SUP-INT-001', 'Euro Industrial GmbH', 'sales@euro-industrial.example.test', '+49-30-100100', NULL, 'Martin Weber', 'https://euro-industrial.example.test', 'Berlin, Germany', group_international, currency_eur, 60, true FROM lookup_ids
  UNION ALL SELECT 'SUP-INT-002', 'Global Packaging Co.', 'orders@global-packaging.example.test', '+90-212-200200', NULL, 'Selin Kaya', 'https://global-packaging.example.test', 'Istanbul, Turkey', group_international, currency_usd, 45, true FROM lookup_ids
  UNION ALL SELECT 'SUP-INT-003', 'Nordic Maintenance Services', NULL, '+46-8-300300', NULL, 'Erik Lind', NULL, 'Stockholm, Sweden', group_international, currency_eur, 30, true FROM lookup_ids
  UNION ALL SELECT 'SUP-INT-004', 'Asia Materials Trading', 'contact@asia-materials.example.test', '+971-4-400400', NULL, NULL, 'https://asia-materials.example.test', 'Dubai, UAE', group_international, currency_usd, 75, true FROM lookup_ids
  UNION ALL SELECT 'SUP-INT-005', 'Precision Spare Parts Ltd.', 'sales@precision-spares.example.test', '+44-20-500500', NULL, 'Olivia Smith', NULL, 'London, United Kingdom', group_international, currency_eur, 30, false FROM lookup_ids
  UNION ALL SELECT 'SUP-LOCAL-007', 'تجهیزات ایمنی کارا', 'safety.kara@example.test', '021-77007007', '4777777777', 'خانم حسینی', NULL, 'تهران، خیابان دماوند', group_local, currency_irr, 25, true FROM lookup_ids
)
INSERT INTO api.suppliers (
  code,
  name,
  email,
  phone,
  tax_number,
  contact_person,
  website,
  address,
  supplier_group_lookup_value_id,
  currency_lookup_value_id,
  payment_terms_days,
  active
)
SELECT
  code,
  name,
  email,
  phone,
  tax_number,
  contact_person,
  website,
  address,
  supplier_group_lookup_value_id,
  currency_lookup_value_id,
  payment_terms_days,
  active
FROM seed_suppliers
ON CONFLICT (lower(code)) DO UPDATE
SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  tax_number = EXCLUDED.tax_number,
  contact_person = EXCLUDED.contact_person,
  website = EXCLUDED.website,
  address = EXCLUDED.address,
  supplier_group_lookup_value_id = EXCLUDED.supplier_group_lookup_value_id,
  currency_lookup_value_id = EXCLUDED.currency_lookup_value_id,
  payment_terms_days = EXCLUDED.payment_terms_days,
  active = EXCLUDED.active;

COMMIT;
