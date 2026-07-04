BEGIN;

INSERT INTO api.customers (
  id,
  code,
  name,
  email,
  phone,
  customer_type,
  credit_limit,
  active
)
VALUES
  ('10000000-0000-4000-8000-000000000001', 'CUST-0001', 'شرکت آریا صنعت', 'info@arya-sanat.example', '021-44000001', 'corporate', 250000000.00, true),
  ('10000000-0000-4000-8000-000000000002', 'CUST-0002', 'شرکت نگین تجارت پارس', 'sales@negin-pars.example', '021-44000002', 'corporate', 120000000.00, true),
  ('10000000-0000-4000-8000-000000000003', 'CUST-0003', 'فروشگاه سپهر', NULL, '031-33000003', 'corporate', 45000000.00, true),
  ('10000000-0000-4000-8000-000000000004', 'CUST-0004', 'گروه خدمات باران', 'contact@baran-services.example', NULL, 'corporate', 90000000.00, false),
  ('10000000-0000-4000-8000-000000000005', 'CUST-0005', 'مهسا احمدی', 'mahsa.ahmadi@example.test', '09120000005', 'individual', NULL, true),
  ('10000000-0000-4000-8000-000000000006', 'CUST-0006', 'رضا کریمی', NULL, '09120000006', 'individual', NULL, true),
  ('10000000-0000-4000-8000-000000000007', 'CUST-0007', 'شرکت توسعه دقیق شرق', 'office@daqiq-east.example', '051-37000007', 'corporate', 300000000.00, true),
  ('10000000-0000-4000-8000-000000000008', 'CUST-0008', 'علی رضایی', 'ali.rezaei@example.test', NULL, 'individual', NULL, false),
  ('10000000-0000-4000-8000-000000000009', 'CUST-0009', 'شرکت فراز داده', NULL, '021-44000009', 'corporate', NULL, true),
  ('10000000-0000-4000-8000-000000000010', 'CUST-0010', 'سارا محمدی', 'sara.mohammadi@example.test', '09120000010', 'individual', NULL, true),
  ('10000000-0000-4000-8000-000000000011', 'CUST-0011', 'موسسه راهکار نوین', 'hello@rahkar-novin.example', '026-34000011', 'corporate', 75000000.00, true),
  ('10000000-0000-4000-8000-000000000012', 'CUST-0012', 'حسین اکبری', NULL, NULL, 'individual', NULL, false)
ON CONFLICT DO NOTHING;

COMMIT;
