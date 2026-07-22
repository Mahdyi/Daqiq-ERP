BEGIN;

CREATE OR REPLACE FUNCTION private.hash_password(password text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT public.crypt(password, public.gen_salt('bf', 12));
$$;

CREATE OR REPLACE FUNCTION private.verify_password(password text, password_hash text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT password_hash = public.crypt(password, password_hash);
$$;

CREATE OR REPLACE FUNCTION private.map_app_role_to_db_role(app_role text)
RETURNS text
LANGUAGE sql
IMMUTABLE
STRICT
SET search_path = pg_catalog
AS $$
  SELECT CASE app_role
    WHEN 'admin' THEN 'erp_admin'
    WHEN 'manager' THEN 'erp_manager'
    WHEN 'accountant' THEN 'erp_accountant'
    WHEN 'sales' THEN 'erp_sales'
    WHEN 'warehouse' THEN 'erp_warehouse'
    WHEN 'viewer' THEN 'erp_viewer'
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION private.base64url(data bytea)
RETURNS text
LANGUAGE sql
IMMUTABLE
STRICT
SET search_path = pg_catalog
AS $$
  SELECT translate(rtrim(encode(data, 'base64'), '='), '+/', '-_');
$$;

CREATE OR REPLACE FUNCTION private.jwt_sign(payload jsonb)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  jwt_secret text;
  header_part text;
  payload_part text;
  signing_input text;
  signature_part text;
BEGIN
  jwt_secret := current_setting('app.jwt_secret', true);

  IF jwt_secret IS NULL OR length(jwt_secret) < 32 THEN
    RAISE EXCEPTION 'JWT signing secret is not configured'
      USING ERRCODE = 'P0001';
  END IF;

  header_part := private.base64url(
    convert_to('{"alg":"HS256","typ":"JWT"}', 'utf8')
  );
  payload_part := private.base64url(convert_to(payload::text, 'utf8'));
  signing_input := header_part || '.' || payload_part;
  signature_part := private.base64url(
    public.hmac(signing_input, jwt_secret, 'sha256')
  );

  RETURN signing_input || '.' || signature_part;
END;
$$;

CREATE OR REPLACE FUNCTION api.login(email text, password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  normalized_email text;
  matched_user private.app_users%ROWTYPE;
  app_roles text[];
  selected_app_role text;
  selected_db_role text;
  expires_at timestamptz;
  token_payload jsonb;
BEGIN
  normalized_email := lower(btrim(email));

  IF normalized_email IS NULL OR normalized_email = '' OR password IS NULL THEN
    RAISE EXCEPTION 'Invalid email or password'
      USING ERRCODE = '28P01';
  END IF;

  SELECT *
  INTO matched_user
  FROM private.app_users app_user
  WHERE lower(btrim(app_user.email)) = normalized_email
    AND app_user.active = true
  LIMIT 1;

  IF NOT FOUND OR NOT private.verify_password(password, matched_user.password_hash) THEN
    RAISE EXCEPTION 'Invalid email or password'
      USING ERRCODE = '28P01';
  END IF;

  SELECT array_agg(role_row.app_role ORDER BY role_row.role_rank)
  INTO app_roles
  FROM (
    SELECT
      user_role.app_role,
      CASE user_role.app_role
        WHEN 'admin' THEN 1
        WHEN 'manager' THEN 2
        WHEN 'sales' THEN 3
        WHEN 'accountant' THEN 4
        WHEN 'warehouse' THEN 5
        WHEN 'viewer' THEN 6
        ELSE 100
      END AS role_rank
    FROM private.app_user_roles user_role
    WHERE user_role.user_id = matched_user.id
  ) role_row;

  IF app_roles IS NULL OR array_length(app_roles, 1) IS NULL THEN
    RAISE EXCEPTION 'Invalid email or password'
      USING ERRCODE = '28P01';
  END IF;

  selected_app_role := app_roles[1];
  selected_db_role := private.map_app_role_to_db_role(selected_app_role);

  IF selected_db_role IS NULL THEN
    RAISE EXCEPTION 'Invalid email or password'
      USING ERRCODE = '28P01';
  END IF;

  expires_at := statement_timestamp() + interval '60 minutes';
  token_payload := jsonb_build_object(
    'role', selected_db_role,
    'user_id', matched_user.id::text,
    'email', matched_user.email,
    'display_name', matched_user.display_name,
    'app_roles', to_jsonb(app_roles),
    'exp', floor(extract(epoch from expires_at))::bigint
  );

  UPDATE private.app_users
  SET last_login_at = statement_timestamp()
  WHERE id = matched_user.id;

  RETURN jsonb_build_object(
    'accessToken', private.jwt_sign(token_payload),
    'tokenType', 'Bearer',
    'expiresAt', expires_at,
    'user', jsonb_build_object(
      'id', matched_user.id,
      'email', matched_user.email,
      'displayName', matched_user.display_name,
      'roles', to_jsonb(app_roles)
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION api.me()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  claims jsonb;
BEGIN
  claims := nullif(current_setting('request.jwt.claims', true), '')::jsonb;

  IF claims IS NULL OR claims->>'user_id' IS NULL THEN
    RAISE EXCEPTION 'Authentication is required'
      USING ERRCODE = '28000';
  END IF;

  RETURN jsonb_build_object(
    'id', claims->>'user_id',
    'email', claims->>'email',
    'displayName', claims->>'display_name',
    'roles', COALESCE(claims->'app_roles', '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION private.hash_password(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.verify_password(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.map_app_role_to_db_role(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.base64url(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.jwt_sign(jsonb) FROM PUBLIC;

REVOKE ALL ON FUNCTION api.login(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.me() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION api.login(text, text) TO erp_anon;
GRANT EXECUTE ON FUNCTION api.me() TO
  erp_admin,
  erp_manager,
  erp_accountant,
  erp_sales,
  erp_warehouse,
  erp_viewer;

COMMIT;
