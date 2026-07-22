BEGIN;

-- Local development only. Do not apply this seed in production.
-- Development credentials:
-- admin@erp.com / admin
-- manager@erp.com / manager
-- sales@erp.com / sales
-- accountant@erp.com / accountant
-- warehouse@erp.com / warehouse
-- viewer@erp.com / viewer

WITH seed_users(id, email, display_name, plain_password, app_role) AS (
  VALUES
    ('00000000-0000-4000-8000-000000000001'::uuid, 'admin@erp.com', 'مدیر سیستم', 'admin', 'admin'),
    ('00000000-0000-4000-8000-000000000002'::uuid, 'manager@erp.com', 'مدیر فروش', 'manager', 'manager'),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'sales@erp.com', 'کاربر فروش', 'sales', 'sales'),
    ('00000000-0000-4000-8000-000000000004'::uuid, 'accountant@erp.com', 'کاربر حسابداری', 'accountant', 'accountant'),
    ('00000000-0000-4000-8000-000000000005'::uuid, 'warehouse@erp.com', 'کاربر انبار', 'warehouse', 'warehouse'),
    ('00000000-0000-4000-8000-000000000006'::uuid, 'viewer@erp.com', 'کاربر مشاهده‌گر', 'viewer', 'viewer')
),
upserted_users AS (
  INSERT INTO private.app_users (
    id,
    email,
    display_name,
    password_hash,
    active
  )
  SELECT
    seed_users.id,
    seed_users.email,
    seed_users.display_name,
    private.hash_password(seed_users.plain_password),
    true
  FROM seed_users
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    password_hash = EXCLUDED.password_hash,
    active = EXCLUDED.active
  RETURNING id
)
INSERT INTO private.app_user_roles (user_id, app_role)
SELECT seed_users.id, seed_users.app_role
FROM seed_users
ON CONFLICT (user_id, app_role) DO NOTHING;

COMMIT;
