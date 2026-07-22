BEGIN;

CREATE TABLE IF NOT EXISTS private.app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  display_name text NOT NULL,
  password_hash text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  last_login_at timestamptz,
  CONSTRAINT app_users_email_not_blank CHECK (length(btrim(email)) > 0),
  CONSTRAINT app_users_display_name_not_blank CHECK (length(btrim(display_name)) > 0),
  CONSTRAINT app_users_password_hash_not_blank CHECK (length(btrim(password_hash)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS app_users_email_ci_uq
  ON private.app_users (lower(btrim(email)));

DROP TRIGGER IF EXISTS set_app_users_updated_at ON private.app_users;

CREATE TRIGGER set_app_users_updated_at
BEFORE UPDATE ON private.app_users
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

CREATE TABLE IF NOT EXISTS private.app_user_roles (
  user_id uuid NOT NULL REFERENCES private.app_users(id) ON DELETE CASCADE,
  app_role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  PRIMARY KEY (user_id, app_role),
  CONSTRAINT app_user_roles_role_valid CHECK (
    app_role IN ('admin', 'manager', 'accountant', 'sales', 'warehouse', 'viewer')
  )
);

REVOKE ALL ON TABLE private.app_users FROM PUBLIC;
REVOKE ALL ON TABLE private.app_user_roles FROM PUBLIC;

COMMIT;
